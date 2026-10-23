import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { topics } from '../lib/topics';
export const GET: APIRoute = async ({ site }) => {
  const paths = ['/', '/articles/', '/about/', '/topics/', ...topics.map(topic => `/topics/${topic.slug}/`), ...(await getCollection('posts')).map(p => p.data.legacyPath)];
  return new Response(`<?xml version="1.0" encoding="utf-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map(p => `<url><loc>${new URL(p, site).href}</loc></url>`).join('')}</urlset>`, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
