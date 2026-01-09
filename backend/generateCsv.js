import fs from 'fs';
import readline from 'readline';

// CONFIGURATION
const INPUT_FILE = './data/million-rows-optimized.csv'; 
const OUTPUT_FILE = './data/sample-dataset.csv'; 
const ROW_LIMIT = 50000;

async function processCsv() {
  const fileStream = fs.createReadStream(INPUT_FILE);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });
  const output = fs.createWriteStream(OUTPUT_FILE);

  let count = 0;
  let headers = [];

  console.log('Crunching 50 Thousand rows...');

  for await (const line of rl) {
    // 1. Handle Headers (First line)
    if (count === 0) {
      // split by comma (assuming simple CSV)
      headers = line.split(','); 
      
      // OPTIONAL: If you want to drop columns, do it logic here
      output.write(line + '\n');
      count++;
      continue;
    }

    // 2. Stop at your row limit
    if (count > ROW_LIMIT) break;

    output.write(line + '\n');
    count++;
    
    // Progress bar every 100k
    if (count % 100000 === 0) console.log(`Processed ${count} rows...`);
  }

  console.log('Done! Check the file size of ' + OUTPUT_FILE);
  console.log('If it is under 350MB, you are safe for Supabase.');
}

processCsv();