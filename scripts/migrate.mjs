import fs from 'node:fs';
import path from 'node:path';

const source = path.resolve('../ydnd');
const destination = path.resolve('src/content/posts');
fs.mkdirSync(destination, { recursive: true });
fs.mkdirSync('public/images', { recursive: true });
fs.cpSync(path.join(source, 'source/images'), 'public/images', { recursive: true });
// Some older screenshots only exist in the historical generated directory.
fs.cpSync(path.join(source, 'images'), 'public/images', { recursive: true, force: false });

const descriptions = {
  'About-me': '从 CTF 到漏洞研究，关于独立思考、学习与坚持的个人记录。',
  'ISCC-2025-APP': '记录 ISCC 2025 移动安全题的分析过程，涵盖 APK 分析、加密逻辑与解题实践。',
  'docker-拉取失败-clash-for-linux丝滑拉取': '在 Ubuntu 环境配置代理，排查 Docker 镜像拉取失败并记录解决过程。',
  'next.js-中间件鉴权绕过漏洞': '复现 CVE-2025-29927，结合源码理解 Next.js 中间件鉴权被绕过的原因。',
  'ssrf-vul-for-new': '从一个 SSRF 入口出发，在靶场中梳理内网探测与漏洞利用的完整过程。',
  'Shellshock-CVE-2014-6271': '复现 Bash Shellshock 漏洞，分析环境变量处理与命令执行的关系。',
  'Shiro-密钥泄露CVE-2016-4437': '围绕 rememberMe 机制，记录 Apache Shiro 反序列化漏洞的复现过程。',
  'Shiro认证绕过CVE-2020-1957': '记录 Apache Shiro 认证绕过漏洞的环境、复现步骤与原理。',
  'Vite-CVE-2025-30208': '复现 Vite 开发服务器文件读取漏洞，整理实验过程与修复建议。'
};
const titles = {
  'next.js-中间件鉴权绕过漏洞': 'Next.js 中间件鉴权绕过：复现与原理分析',
  'ssrf-vul-for-new': '从 SSRF 入口到内网探测：一次靶场实践',
  'docker-拉取失败-clash-for-linux丝滑拉取': 'Docker 镜像拉取失败：Ubuntu 代理配置记录',
  'Shiro-密钥泄露CVE-2016-4437': 'Apache Shiro 反序列化漏洞 · CVE-2016-4437',
  'Shiro认证绕过CVE-2020-1957': 'Apache Shiro 认证绕过 · CVE-2020-1957',
  'Shellshock-CVE-2014-6271': 'Shellshock：Bash 环境变量与命令执行',
  'Vite-CVE-2025-30208': 'Vite 任意文件读取 · CVE-2025-30208',
  'ISCC-2025-APP': 'ISCC 2025 · 移动安全解题记录'
};
const manifest = [];
for (const file of fs.readdirSync(path.join(source, 'source/_posts')).filter(f => f.endsWith('.md'))) {
  const stem = file.slice(0, -3);
  const input = fs.readFileSync(path.join(source, 'source/_posts', file), 'utf8');
  const match = input.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?([\s\S]*)$/);
  if (!match) throw new Error(`Missing frontmatter: ${file}`);
  let [, frontmatter, body] = match;
  if (!body.trim()) {
    fs.mkdirSync('migration/drafts', { recursive: true });
    fs.writeFileSync(`migration/drafts/${file}`, input);
    continue;
  }
  const dateMatch = frontmatter.match(/^date:\s*(\d{4})-(\d{1,2})-(\d{1,2})/m);
  if (!dateMatch) throw new Error(`Missing date: ${file}`);
  const [, year, monthRaw, dayRaw] = dateMatch;
  const month = monthRaw.padStart(2, '0');
  const day = dayRaw.padStart(2, '0');
  frontmatter = frontmatter.replace(/^date:.*$/m, `date: "${year}-${month}-${day}"`);
  if (titles[stem]) frontmatter = frontmatter.replace(/^title:.*$/m, `title: ${JSON.stringify(titles[stem])}`);
  const originalCategory = frontmatter.match(/^categories:\s*"?([^"\r\n]+)"?/m)?.[1];
  const category = ({ '漏洞复现': '安全研究', '靶场': '实验记录', '乱七八糟': '工具与环境', '日常': '随笔', 'CTF': 'CTF' })[originalCategory] || '随笔';
  frontmatter = frontmatter.replace(/^categories:.*$/m, `categories: ${category}`);
  const url = `/${year}/${month}/${day}/${stem}/`;
  frontmatter += `\ndescription: ${JSON.stringify(descriptions[stem] || '')}\nlegacyPath: ${JSON.stringify(url)}`;
  // The page header supplies the title; preserve the body below its duplicate heading.
  body = body.replace(/^\s*#{1,2}\s+(?:Next\.js 中间件鉴权绕过漏洞|About Me)\s*\r?\n/, '');
  fs.writeFileSync(path.join(destination, file), `---\n${frontmatter}\n---\n\n${body.trim()}\n`);
  manifest.push({ file, url });
}
fs.writeFileSync('migration/manifest.json', JSON.stringify(manifest, null, 2));
console.log(`Migrated ${manifest.length} articles. Empty posts preserved in migration/drafts.`);
