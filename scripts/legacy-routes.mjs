import fs from 'node:fs';
import path from 'node:path';

const source = path.resolve('../ydnd');
const categoryMap = { '漏洞复现': '安全研究', '靶场': '实验记录', 'CTF': 'CTF', '日常': '随笔', '乱七八糟': '工具与环境' };
const routes = [];
for (const section of ['archives', 'categories', 'tags', 'page', 'links']) {
  const directory = path.join(source, section);
  if (!fs.existsSync(directory)) continue;
  for (const file of fs.readdirSync(directory, { recursive: true }).filter(f => f === 'index.html' || f.endsWith(`${path.sep}index.html`))) {
    const slug = [section, path.dirname(file) === '.' ? '' : path.dirname(file).replaceAll('\\', '/')].filter(Boolean).join('/');
    const tail = slug.split('/').at(-1);
    let target = '/articles/';
    if (section === 'links') target = '/about/';
    if (section === 'categories' && categoryMap[tail]) target += `?category=${encodeURIComponent(categoryMap[tail])}`;
    if (section === 'tags' && tail !== 'tags') target += `?tag=${encodeURIComponent(tail === 'next-js-中间件鉴权绕过' ? 'next.js-中间件鉴权绕过' : tail)}`;
    routes.push({ slug, redirect: target });
  }
}
fs.writeFileSync('migration/legacy-routes.json', JSON.stringify(routes, null, 2));
console.log(`Preserved ${routes.length} legacy navigation routes.`);
