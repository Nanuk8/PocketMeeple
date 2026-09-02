import pg from 'pg';
import { readFileSync } from 'fs';
const { Client } = pg;
const sql = readFileSync('supabase/migrations/20260831120000_phase1_profiles_and_user_games.sql', 'utf8').replace(/^\uFEFF/, '');
const client = new Client({ connectionString: 'postgresql://postgres.ufwcavezofriijvrzomb:bFawRZdF4OmZ66y1@aws-0-us-west-2.pooler.supabase.com:5432/postgres', ssl: { rejectUnauthorized: false } });
client.connect()
  .then(() => client.query(sql))
  .then(() => { console.log('Migration applied successfully!'); return client.end(); })
  .catch(e => { console.error('ERROR:', e.message); process.exit(1); });
