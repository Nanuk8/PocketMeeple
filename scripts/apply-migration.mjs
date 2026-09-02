import pg from "pg";
import fs from "fs";
import path from "path";

// Simple .env parser
function loadEnv() {
  if (fs.existsSync(".env")) {
    const lines = fs.readFileSync(".env", "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx !== -1) {
        const key = trimmed.substring(0, eqIdx).trim();
        let val = trimmed.substring(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        process.env[key] = val;
      }
    }
  }
}

loadEnv();

const { Client } = pg;

async function run() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("No DATABASE_URL found in .env");
    process.exit(1);
  }

  console.log("Connecting to PostgreSQL at:", connectionString.replace(/:[^:@]+@/, ":****@"));
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log("Connected successfully!");

    // Test a basic query
    const res = await client.query("SELECT current_database(), current_user, version();");
    console.log("Database info:", res.rows[0]);

    // Check existing tables & policies
    const policiesRes = await client.query(`
      SELECT tablename, policyname, cmd, qual, with_check 
      FROM pg_policies 
      WHERE schemaname = 'public'
      ORDER BY tablename, policyname;
    `);
    console.log(`\nCurrent policies in public schema (${policiesRes.rows.length}):`);
    console.table(policiesRes.rows);

    // Read and apply the new migration
    const migrationPath = path.resolve("supabase/migrations/20260827120000_enforce_auth_rls.sql");
    if (fs.existsSync(migrationPath)) {
      console.log(`\nReading migration: ${migrationPath}`);
      const sql = fs.readFileSync(migrationPath, "utf-8");
      
      console.log("Executing migration...");
      await client.query(sql);
      console.log("Migration executed successfully!");

      // Verify updated policies
      const updatedPoliciesRes = await client.query(`
        SELECT tablename, policyname, cmd, qual, with_check 
        FROM pg_policies 
        WHERE schemaname = 'public'
        ORDER BY tablename, policyname;
      `);
      console.log(`\nUpdated policies in public schema (${updatedPoliciesRes.rows.length}):`);
      console.table(updatedPoliciesRes.rows);
    } else {
      console.warn("Migration file not found at:", migrationPath);
    }
  } catch (err) {
    console.error("Database connection / execution error:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
