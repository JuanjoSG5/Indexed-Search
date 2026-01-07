import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import csv from 'csv-parser';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../product/entities/product.entity.js';

@Injectable()
export class CsvService {
  constructor(
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
  ) {}

  async processCsvFile(filePath: string) {
    const results: any[] = [];
    
    // 1. Create a Stream (Pipeline)
    fs.createReadStream(filePath)
      .pipe(csv()) // Parses line by line
      .on('data', (data) => {
        // 2. Push data to a temporary array
        // "data" here is a single row from your CSV
        return results.push(data);
        
      })
      .on('end', async () => {
        // 3. Save to Supabase when done (or save final batch)
        console.log(`Parsed ${results.length} rows.`);
        
        // Bulk Insert (Much faster than saving 1 by 1)
        await this.productRepo.save(results, { chunk: 1000 }); 
        console.log('Data saved to Supabase!');
      });
  }
}