import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Product } from './entities/product.entity.js';
import * as fs from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';

@Injectable()
export class ProductService implements OnApplicationBootstrap {
  private readonly logger = new Logger(ProductService.name);

  // 1. Map Internal ID -> ASIN (String)
  private productsMap: string[] = [];
  
  // 2. Map Word -> Array of Internal IDs
  private invertedIndex = new Map<string, number[]>();
  
  // 3. Float32Array for memory-efficient scoring
  private productScores: Float32Array;

  public isReady: boolean = false;
  public progress: number = 0;
  private readonly SNAPSHOT_FILE = path.resolve('index_snapshot.json.gz');

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  // Non-blocking startup for Render/Production
  async onApplicationBootstrap() {
    if (fs.existsSync(this.SNAPSHOT_FILE)) {
      this.logger.log('Loading index snapshot from disk...');
      try {
        await this.loadFromSnapshot();
        this.logger.log('Snapshot loaded successfully!');
        return;
      } catch (err) {
        this.logger.error("Failed to load snapshot", err);
      }
    }
    this.buildInvertedIndex().catch(err => {
      this.logger.error("Indexing failed", err);
    });
  }

  private async loadFromSnapshot() {
    const start = Date.now();

    const compressedBuffer = fs.readFileSync(this.SNAPSHOT_FILE);

    const rawData = zlib.gunzipSync(compressedBuffer).toString('utf-8');

    const snapshot = JSON.parse(rawData);

    this.productsMap = snapshot.map;
    this.invertedIndex = new Map(Object.entries(snapshot.index));
    this.productScores = Float32Array.from(snapshot.scores);

    this.isReady = true;
    const duration = (Date.now() - start) / 1000;
    const mem = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
    this.logger.log(`Index Loaded from Snapshot! Items: ${this.productsMap.length} | Time: ${duration.toFixed(2)}s | RAM: ${mem} MB`);
  }

  async buildInvertedIndex() {
    const start = Date.now();
    // Default to 500k items if not set in env
    const MAX_ITEMS = process.env.MAX_INDEX_ITEMS ? parseInt(process.env.MAX_INDEX_ITEMS) : 500000;
    
    // Reset State
    this.isReady = false;
    this.productsMap = [];
    this.invertedIndex.clear();
    this.productScores = new Float32Array(MAX_ITEMS);

    const BATCH_SIZE = 10000; 
    let lastAsin = ""; 

    try {
      while (this.productsMap.length < MAX_ITEMS) {
        // 1. USE RAW QUERY (getRawMany) - Much faster than loading entire entities
        const products = await this.productRepository
          .createQueryBuilder('product')
          .select(['product.asin', 'product.title', 'product.stars', 'product.reviews']) 
          .where('product.asin > :lastAsin', { lastAsin })
          .orderBy('product.asin', 'ASC')
          .limit(BATCH_SIZE)
          .getRawMany(); 

        if (products.length === 0) break;

        for (const product of products) {
          // Handle Raw TypeORM prefixes (e.g. product_asin vs asin)
          const asin: string = product.asin || product.product_asin;
          const title: string = product.title || product.product_title;
          
          if (!title || !asin) continue;

          // Store mapping (Index -> ASIN)
          this.productsMap.push(asin);
          const internalId = this.productsMap.length - 1;

          // --- SCORING LOGIC ---
          const stars = Number(product.stars || product.product_stars) || 0;
          const reviews = Number(product.reviews || product.product_reviews) || 0;

          // Logarithmic ranking: 5 stars with 10k reviews > 5 stars with 1 review
          const score = stars + (Math.log1p(reviews) * 0.5);
          this.productScores[internalId] = score; 

          // --- TOKENIZATION ---
          const words = title.toLowerCase().match(/[a-z0-9]+/g);
          if (!words) continue;

          const uniqueWords = new Set(words);

          // Update Inverted Index
          for (const word of uniqueWords) {
            if (word.length < 2) continue; // Skiping single letters

            let list = this.invertedIndex.get(word);
            if (!list) {
              list = [];
              this.invertedIndex.set(word, list);
            }
            list.push(internalId);
          }
          
          lastAsin = asin;
        }

        // Update Progress
        this.progress = Math.round((this.productsMap.length / MAX_ITEMS) * 100);
        
        // Log memory usage and yield to event loop every 50000 records
        if (this.productsMap.length % 50000 === 0) {
           const mem = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
           this.logger.log(`📦 Indexed ${this.productsMap.length} items... (RAM: ${mem} MB)`);
           
           // Macro task yielding - Pause for 1ms to let the Event Loop & Garbage Collector run
           await new Promise(resolve => setTimeout(resolve, 1));
        }
      }
    } catch (e) {
      this.logger.error("Error building index", e);
    }

    this.isReady = true;
    const duration = (Date.now() - start) / 1000;
    const finalRam = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);

    if (process.env.NODE_ENV !== 'production' || process.env.SAVE_SNAPSHOT === 'true') {
      await this.saveSnapshot();
      this.logger.log(`✅ Index snapshot saved to disk (${this.SNAPSHOT_FILE})`);
    }
    
    this.logger.log(`✅ Index Ready! Items: ${this.productsMap.length} | Time: ${duration.toFixed(2)}s | RAM: ${finalRam} MB`);
  }

  private async saveSnapshot() {
    const snapshot ={
      map: this.productsMap,
      index: Object.fromEntries(this.invertedIndex),
      scores: Array.from(this.productScores)
    }
    const jsonStringify = JSON.stringify(snapshot);
    const compressed = zlib.gzipSync(jsonStringify);
    fs.writeFileSync(this.SNAPSHOT_FILE, compressed);
  }

  getStatus() {
    return {
      isReady: this.isReady,
      count: this.productsMap.length,
      progress: `${this.progress}%`
    };
  }

  async searchProducts(query: string, paginationLimit: number = 20) {
    if (!this.isReady) throw new Error('Index is still building, please wait.');
    if (!query) return [];

    const algorithmStartTimer = performance.now();

    const terms = query
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, '')
      .split(' ')
      .filter(w => w.length > 1);

    if (terms.length === 0) return [];

    // 1. Sort terms by "Rarest Word First" (to minimize intersection size)
    const sortedTerms = terms
      .map(term => ({ term, ids: this.invertedIndex.get(term) || [] }))
      .sort((a, b) => a.ids.length - b.ids.length);

    // If the rarest word isn't found then no results exist
    if (sortedTerms[0].ids.length === 0) return { meta: { total: 0 }, data: [] };

    // 2. Initialize the result with the smallest list size
    let resultIds = [...sortedTerms[0].ids];

    // 3. Intersect with other lists
    for (let i = 1; i < sortedTerms.length; i++) {
      const nextIdSet = new Set(sortedTerms[i].ids);
      resultIds = resultIds.filter(id => nextIdSet.has(id));
      if (resultIds.length === 0) break;
    }

    // 4. SORT BY SCORE (Ranking based on the previous scoring logic => Reviews > Stars)
    resultIds.sort((a, b) => this.productScores[b] - this.productScores[a]);

    const totalResults = resultIds.length;
    const pagedIds = resultIds.slice(0, paginationLimit); 

    const fetchStartTimer = performance.now();

    // --- Data Hydration (Fetching all the results from DB) ---
    let completedProducts: Product[] = [];

    if (pagedIds.length > 0) {
      // Convert the generated IDs (numbers) back to ASINs (strings)
      const realAsins = pagedIds.map(id => this.productsMap[id]);

      // Fetch only the needed items from Supabase
      const unsortedProducts = await this.productRepository.find({
        where: { asin: In(realAsins) },
      });

      // Maintain the sorted order from our algorithm
      // (DB returns items in arbitrary order, we must map them back)
      const productMap = new Map(unsortedProducts.map(p => [p.asin, p]));
      completedProducts = realAsins
        .map(asin => productMap.get(asin))
        .filter(p => !!p); // Filter out any inconsistencies
    }

    const endTimers = performance.now();

    // Performance Metrics that are used in the frontend to display search time
    const algoTime = fetchStartTimer - algorithmStartTimer; 
    const dbTime = endTimers - fetchStartTimer;   
    const totalTime = endTimers - algorithmStartTimer;

    return {
      meta: {
        total: totalResults,
        perf: {
            total: `${totalTime.toFixed(2)}ms`,
            algo: `${algoTime.toFixed(3)}ms`,
            db: `${dbTime.toFixed(2)}ms`
        },
        query: query
      },
      data: completedProducts,
    };
  }
}
