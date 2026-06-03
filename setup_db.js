const { Client } = require('pg');
const fs = require('fs');

async function run() {
  const client = new Client({
    connectionString: "postgresql://postgres.rnbhlpavfrdsgumxesra:aMazon%402029999999@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres"
  });

  try {
    await client.connect();
    console.log("Connected to Supabase!");
    
    let sql = fs.readFileSync('prisma_reset.sql', 'utf8');
    if (sql.charCodeAt(0) === 0xFEFF) {
      sql = sql.slice(1);
    }
    // Remove null bytes and other garbage if present in the middle
    sql = sql.replace(/\uFEFF/g, '');
    
    console.log("Executing schema SQL...");
    await client.query(sql);
    console.log("Schema pushed successfully!");
  } catch (err) {
    console.error("Error executing SQL:", err);
  } finally {
    await client.end();
  }
}

run();
