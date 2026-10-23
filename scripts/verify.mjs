import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

const root = path.resolve('dist');
const files = fs.readdirSync(root, { recursive: true }).filter(f => f.endsWith('.html'));
const errors = [];
let images = 0;
let links = 0;
for (const file of files) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  assert.match(html, /lang="zh-CN"/, `Chinese document language: ${file}`);
  assert.match(html, /<title>[^<]+<\/title>/, `Page title: ${file}`);
  for (const match of html.matchAll(/(?:src|href)="(\/[^"#?]*)(?:[?#][^"]*)?"/g)) {
    const url = decodeURIComponent(match[1]);
    if (url.startsWith('//')) continue;
    const local = path.join(root, url);
    const exists = fs.existsSync(local) && (fs.statSync(local).isFile() || fs.existsSync(path.join(local, 'index.html')));
    if (!exists) errors.push(`${file}: ${url}`);
    links++;
  }
  images += [...html.matchAll(/<img\b/g)].length;
}
const manifest = JSON.parse(fs.readFileSync('migration/manifest.json', 'utf8'));
for (const { url } of manifest) {
  assert.ok(fs.existsSync(path.join(root, url, 'index.html')), `Preserved article route: ${url}`);
}
const rss = fs.readFileSync(path.join(root, 'rss.xml'), 'utf8');
const postCount = fs.readdirSync('src/content/posts').filter(f => f.endsWith('.md')).length;
assert.equal([...rss.matchAll(/<item>/g)].length, postCount, 'RSS contains all published articles');
const aboutPath = '/2025/06/01/About-me/';
for (const file of ['index.html', 'articles/index.html']) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  const rows = [...html.matchAll(/<article class="post-row"[\s\S]*?<\/article>/g)];
  assert.ok(rows.some(row => row[0].includes(aboutPath)), `About Me is visible in article list: ${file}`);
  const data = html.match(/<script id="search-data"[^>]*>([\s\S]*?)<\/script>/);
  assert.ok(JSON.parse(data[1]).some(post => post.url === aboutPath), `About Me is searchable: ${file}`);
}
const splitBody = text => text.match(/^---\s*\r?\n[\s\S]*?\r?\n---\s*\r?\n?([\s\S]*)$/)[1].trim().replaceAll('\r\n', '\n');
for (const { file, bodySha256 } of manifest) {
  const migrated = fs.readFileSync(path.join('src/content/posts', file), 'utf8');
  const body = splitBody(migrated);
  assert.equal(createHash('sha256').update(body).digest('hex'), bodySha256, `Original article body is preserved: ${file}`);
  const originalPath = path.join('../ydnd/source/_posts', file);
  if (fs.existsSync(originalPath)) {
    assert.equal(body, splitBody(fs.readFileSync(originalPath, 'utf8')), `Legacy source matches: ${file}`);
  }
}
assert.equal(errors.length, 0, `Missing local references:\n${[...new Set(errors)].join('\n')}`);
console.log(`Verified ${files.length} pages, ${links} local references, ${images} image references, ${manifest.length} preserved article routes, and RSS.`);
