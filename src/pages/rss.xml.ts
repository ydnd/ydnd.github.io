import type { APIRoute } from 'astro';
import { getPosts } from '../lib/posts';
const entities: Record<string, string> = { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' };
const xml = (value: string) => value.replace(/[<>&"']/g, c => entities[c]);
export const GET: APIRoute = async ({ site }) => {
  const posts = await getPosts();
  const items = posts.map(p => `<item><title>${xml(p.data.title)}</title><link>${xml(new URL(p.data.legacyPath, site).href)}</link><guid isPermaLink="true">${xml(new URL(p.data.legacyPath, site).href)}</guid><description>${xml(p.data.description)}</description><pubDate>${p.data.date.toUTCString()}</pubDate><category>${xml(p.data.categories)}</category></item>`).join('');
  return new Response(`<?xml version="1.0" encoding="utf-8"?><rss version="2.0"><channel><title>IE / 反复思考</title><link>${site}</link><description>Web 安全、漏洞分析与安全研究。</description><language>zh-CN</language>${items}</channel></rss>`, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
