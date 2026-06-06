process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
require('dotenv').config();
const { Client } = require('pg');

const supabaseUrl = process.env.DATABASE_URL_SRC;
const neonUrl = process.env.DATABASE_URL;

async function migrate() {
  const source = new Client({ connectionString: supabaseUrl, ssl: { rejectUnauthorized: false } });
  const dest = new Client({ connectionString: neonUrl, ssl: { rejectUnauthorized: false } });
  
  await source.connect();
  await dest.connect();
  
  console.log("Connected to both databases.");
  
  const { rows: tablesResult } = await source.query(`
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename != '_prisma_migrations';
  `);
  
  let tables = tablesResult.map(t => t.tablename);
  let attempts = 0;
  
  while (tables.length > 0 && attempts < 500) {
    attempts++;
    const tablename = tables.shift();
    
    const { rows: data } = await source.query(`SELECT * FROM "${tablename}"`);
    
    if (data.length === 0) {
      console.log(`[SKIP] No data in ${tablename}`);
      continue;
    }
    
    try {
      await dest.query('BEGIN');
      
      const columns = Object.keys(data[0]);
      const columnsString = columns.map(c => `"${c}"`).join(', ');
      
      const batchSize = 100;
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        let valuesString = [];
        let values = [];
        let paramIndex = 1;
        
        for (const row of batch) {
          let rowParams = [];
          for (const col of columns) {
            rowParams.push(`$${paramIndex++}`);
            values.push(row[col]);
          }
          valuesString.push(`(${rowParams.join(', ')})`);
        }
        
        const query = `INSERT INTO "${tablename}" (${columnsString}) VALUES ${valuesString.join(', ')}`;
        await dest.query(query, values);
      }
      
      await dest.query('COMMIT');
      console.log(`[SUCCESS] Migrated ${data.length} rows for ${tablename}.`);
    } catch (e) {
      await dest.query('ROLLBACK');
      if (e.code === '23503') { // Foreign key violation
        // Push back to the queue to try again after its dependencies are inserted
        tables.push(tablename); 
      } else if (e.code === '23505') { // Unique violation
        console.log(`[WARN] Unique violation in ${tablename}, assuming data already exists.`);
      } else {
        console.error(`[ERROR] Migrating ${tablename}:`, e.message);
        tables.push(tablename); 
      }
    }
  }
  
  if (tables.length > 0) {
    console.error("Finished with remaining unmigrated tables (likely due to cyclic dependencies):", tables);
  } else {
    console.log("Migration complete!");
  }
  
  await source.end();
  await dest.end();
}

migrate().catch(console.error);
