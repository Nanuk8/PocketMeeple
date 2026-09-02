import pg from 'pg';
const { Client } = pg;
const client = new Client({ connectionString: 'postgresql://postgres.ufwcavezofriijvrzomb:bFawRZdF4OmZ66y1@aws-0-us-west-2.pooler.supabase.com:5432/postgres', ssl: { rejectUnauthorized: false } });
client.connect().then(async () => {
  const r1 = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name");
  console.log('Tables:', r1.rows.map(r => r.table_name).join(', '));
  const r2 = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'profiles' ORDER BY ordinal_position");
  console.log('\nprofiles columns:', r2.rows.map(r => r.column_name).join(', '));
  const r3 = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'user_games' ORDER BY ordinal_position");
  console.log('user_games columns:', r3.rows.map(r => r.column_name).join(', '));
  await client.end();
}).catch(e => console.error(e.message));
