import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity.js';
import * as fs from 'fs'; // <--- NEW IMPORT
import * as path from 'path'; // <--- NEW IMPORT

@Injectable()
export class ProductService implements OnApplicationBootstrap {
  private readonly logger = new Logger(ProductService.name);

  // 1. Map Index -> ASIN
  private productsMap: string[] = [];
  
  // 2. Map Token -> Array of Indices
  private invertedIndex = new Map<string, number[]>();
  
  // 3. Scores for ranking
  private productScores: Float32Array;

  private fullDataStorage: Product[] = []; 
  
  public isReady: boolean = false;
  public progress: number = 0;

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  onApplicationBootstrap() {
    this.buildInvertedIndex().catch(err => {
      this.logger.error("❌ Indexing failed", err);
    });
  }

   async buildInvertedIndex() {
    const start = Date.now();
    // Reset everything
    this.isReady = false;
    this.productsMap = [];
    this.fullDataStorage = []; // Reset storage
    this.invertedIndex.clear();
    
    // We default to a safe number for the Float32Array
    const ESTIMATED_SIZE = 50000;
    this.productScores = new Float32Array(ESTIMATED_SIZE);
    
    this.logger.log(`🚀 Loading Data from Local JSON due to database issues...`);

    try {
      const filePath = path.join(process.cwd(), 'data/csvjson.json');
      
      if (!fs.existsSync(filePath)) {
        throw new Error(`seed.json not found at ${filePath}`);
      }

      const rawData = fs.readFileSync(filePath, 'utf-8');
      const products = JSON.parse(rawData); // This is your array of items

      this.logger.log(`📂 Found ${products.length} items in file. Indexing...`);

      // Resize score array if needed
      if (products.length > ESTIMATED_SIZE) {
        this.productScores = new Float32Array(products.length);
      }

      for (const product of products) {
        // Handle potential different field names from JSON export
        const asin: string = product.asin || product.product_asin;
        const title: string = product.title || product.product_title;

        if (!title || !asin) continue;

        // 1. Store the ID mapping
        this.productsMap.push(asin);
        const internalId = this.productsMap.length - 1;

        // 2. Store the FULL object (For hydration later)
        this.fullDataStorage.push(product);

        // 3. Calculate Score (Same logic as before)
        const stars = parseFloat(product.stars) || 0;
        const reviews = typeof product.reviews === 'number' ? product.reviews : parseInt(product.reviews) || 0;
        const score = stars + (Math.log1p(reviews) * 0.5);
        this.productScores[internalId] = score; 

        // 4. Tokenize
        const words = title.toLowerCase().match(/[a-z0-9]+/g);
        if (!words) continue;

        const uniqueWords = new Set(words);

        // 5. Update Inverted Index
        for (const word of uniqueWords) {
          if (word.length < 2) continue;

          let list = this.invertedIndex.get(word);
          if (!list) {
            list = [];
            this.invertedIndex.set(word, list);
          }
          list.push(internalId);
        }
        
        // Update progress occasionally
        if (internalId % 5000 === 0) {
            this.progress = Math.round((internalId / products.length) * 100);
        }
      }

    } catch (error) {
        this.logger.error("CRITICAL: Failed to load JSON", error);
        return;
    }

    this.isReady = true;
    this.progress = 100;
    
    const duration = (Date.now() - start) / 1000;
    const ramUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
    
    this.logger.log(`✅ Index Ready! Items: ${this.productsMap.length} | Time: ${duration.toFixed(2)}s | RAM: ${ramUsage} MB`);
  }

  getStatus() {
    return {
      isReady: this.isReady,
      count: this.productsMap.length,
      progress: `${this.progress}%`
    };
  }

  async searchProducts(query: string, paginationLimit: number = 20) {
    if (!this.isReady) throw new Error('Index is still building...');
    if (!query) return [];

    const algorithmStartTimer = performance.now();

    const terms = query
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, '')
      .split(' ')
      .filter(w => w.length > 1);
    
    if (terms.length === 0) return [];

    const sortedTerms = terms
      .map(term => ({ term, ids: this.invertedIndex.get(term) || [] }))
      .sort((a, b) => a.ids.length - b.ids.length);

    let resultIds = [...sortedTerms[0].ids];

    for (let i = 1; i < sortedTerms.length; i++) {
      const nextIdSet = new Set(sortedTerms[i].ids);
      resultIds = resultIds.filter(id => nextIdSet.has(id));
      if (resultIds.length === 0) break;
    }

    const totalResults = resultIds.length;
    const pagedIds = resultIds.slice(0, paginationLimit); 

    const fetchStartTimer = performance.now();

    // --- Data Hydration (RAM instead of DB) ---
    // EMERGENCY CHANGE: We map directly from the fullDataStorage array
    // This mimics the "DB Fetch" but is instant (and reliable)
    
    const completedProducts = pagedIds.map(id => this.fullDataStorage[id]);

    const endTimers = performance.now();

    const algoTime = fetchStartTimer - algorithmStartTimer; 
    const dbTime = endTimers - fetchStartTimer;   
    const totalTime = endTimers - algorithmStartTimer;

    return {
      meta: {
        total: totalResults,
        perf: {
            total: `${totalTime.toFixed(2)}ms`,
            algo: `${algoTime.toFixed(3)}ms`,
            db: `${dbTime.toFixed(2)}ms` // This will be very fast now (0.01ms), effectively 0
        },
        query: query
      },
      data: completedProducts,
    };
  }
}