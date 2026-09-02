import pg from 'pg';
import { readFileSync } from 'fs';
const { Client } = pg;
const sql = readFileSync('supabase/migrations/20260831140000_phase2_groups_achievements.sql', 'utf8');
const client = new Client({ connectionString: 'postgresql://postgres.ufwcavezofriijvrzomb:bFawRZdF4OmZ66y1@aws-0-us-west-2.pooler.supabase.com:5432/postgres', ssl: { rejectUnauthorized: false } });
client.connect()
  .then(() => client.query(sql))
  .then(() => { console.log('Phase 2 Migrations applied successfully!'); return client.end(); })
  .catch(e => { console.error('ERROR:', e.message); process.exit(1); });