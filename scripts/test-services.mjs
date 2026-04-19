/**
 * Verifikasi semua Supabase services setelah schema + seed dijalankan.
 * Run: node scripts/test-services.mjs
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const env = Object.fromEntries(
  readFileSync(resolve(__dirname, '../.env'), 'utf-8')
    .split('\n')
    .filter((l) => l.trim() && !l.startsWith('#'))
    .map((l) => { const [k, ...v] = l.split('='); return [k.trim(), v.join('=').trim()]; })
);

const supabase = createClient(env['EXPO_PUBLIC_SUPABASE_URL'], env['EXPO_PUBLIC_SUPABASE_ANON_KEY']);

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (e) {
    console.error(`❌ ${name}: ${e.message}`);
    failed++;
  }
}

console.log('\n🎬 Testing MovieReview Supabase services...\n');

await test('movies — table accessible', async () => {
  const { error } = await supabase.from('movies').select('id').limit(1);
  if (error) throw error;
});

await test('movies — 8 real movies seeded', async () => {
  const { data, error } = await supabase.from('movies').select('id');
  if (error) throw error;
  if (data.length !== 8) throw new Error(`Expected 8, got ${data.length}`);
});

await test('movies — Inception is featured', async () => {
  const { data, error } = await supabase.from('movies').select('id, is_featured').eq('is_featured', true);
  if (error) throw error;
  if (!data.length) throw new Error('No featured movie found');
  if (data[0].id !== 'inception') throw new Error(`Wrong featured: ${data[0].id}`);
});

await test('movies — The Dark Knight exists with correct data', async () => {
  const { data, error } = await supabase.from('movies').select('*').eq('id', 'the-dark-knight').single();
  if (error) throw error;
  if (data.title !== 'The Dark Knight') throw new Error(`Wrong title: ${data.title}`);
  if (data.runtime_minutes !== 152) throw new Error(`Wrong runtime: ${data.runtime_minutes}`);
});

await test('reviews — table accessible', async () => {
  const { error } = await supabase.from('reviews').select('id').limit(1);
  if (error) throw error;
});

await test('reviews — 11 reviews seeded', async () => {
  const { data, error } = await supabase.from('reviews').select('id');
  if (error) throw error;
  if (data.length !== 11) throw new Error(`Expected 11, got ${data.length}`);
});

await test('reviews — Inception has 2 reviews', async () => {
  const { data, error } = await supabase.from('reviews').select('id').eq('movie_id', 'inception');
  if (error) throw error;
  if (data.length !== 2) throw new Error(`Expected 2, got ${data.length}`);
});

await test('reviews — spoiler review exists for Inception', async () => {
  const { data, error } = await supabase.from('reviews')
    .select('id, contains_spoilers')
    .eq('movie_id', 'inception')
    .eq('contains_spoilers', true);
  if (error) throw error;
  if (!data.length) throw new Error('Spoiler review not found for Inception');
});

await test('profiles — table accessible', async () => {
  const { error } = await supabase.from('profiles').select('id').limit(1);
  if (error) throw error;
});

await test('watchlist — table accessible', async () => {
  const { error } = await supabase.from('watchlist').select('id').limit(1);
  if (error) throw error;
});

const emoji = failed === 0 ? '🎉' : '⚠️';
console.log(`\n${emoji} ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
