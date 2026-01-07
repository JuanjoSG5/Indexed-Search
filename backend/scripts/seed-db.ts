import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import csv from 'csv-parser';
import 'dotenv/config';

// CONFIG
const FILE_PATH = process.env.DATASET_PATH!; // Double check this path!
const BATCH_SIZE = 1000; // 1000 rows per request
const DELAY_MS = 200; // Wait 200ms between uploads to prevent "fetch failed"

// DB CONNECTION
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // MUST BE THE SECRET KEY
);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function seed() {
  console.log('🚀 Starting Controlled Stream Upload...');

  const stream = fs.createReadStream(FILE_PATH).pipe(csv());
  
  let batch: any[] = [];
  let totalProcessed = 0;

  // KEY DIFFERENCE: "for await" pauses the stream automatically!
  for await (const row of stream) {
    
    // Map your CSV columns to DB columns
    const product = {
      asin: row.asin,
      title: row.title,
      img_url: row.imgUrl, // Check if your CSV header is imgUrl or img_url
      stars: parseFloat(row.stars) || 0,
      reviews: parseInt(row.reviews) || 0,
      price: parseFloat(row.price) || 0,
      category_name: row.categoryName
    };

    batch.push(product);

    if (batch.length >= BATCH_SIZE) {
      await uploadSafe(batch); // We AWAIT here. Nothing else happens until this finishes.
      totalProcessed += batch.length;
      console.log(`✅ Saved ${totalProcessed} rows...`);
      batch = []; // Clear array
      await sleep(DELAY_MS); // Give the network a breather
    }
  }

  // Upload the final leftover batch
  if (batch.length > 0) {
    await uploadSafe(batch);
    totalProcessed += batch.length;
  }

  console.log(`🎉 FINISHED! Total rows uploaded: ${totalProcessed}`);
}

// Wrapper to handle errors without crashing
async function uploadSafe(data: any[]) {
  try {
    const { error } = await supabase.from('products').upsert(data, { ignoreDuplicates: true });
    if (error) {
      console.error('❌ Supabase Error:', error.message);
      // Optional: Wait and retry logic could go here
    }
  } catch (err) {
    console.error('❌ Network Error (Retrying in 2s):', err);
    await sleep(2000);
    // Simple retry once
    const { error } = await supabase.from('products').upsert(data, { ignoreDuplicates: true });
    if (error) console.error('❌ Retry Failed:', error.message);
  }
}

seed();