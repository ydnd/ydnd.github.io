import { getCollection, type CollectionEntry } from 'astro:content';
export type Post = CollectionEntry<'posts'>;
export const categories = ['安全研究', 'CTF', '实验记录', '工具与环境', '随笔'];
const categoryLabels: Record<string, string> = { '实验记录': '实验分析', '随笔': '个人文章' };
export const categoryLabel = (category: string) => categoryLabels[category] || category;
export const isAbout = (post: Post) => post.data.legacyPath.includes('/About-me/');
export async function getPosts() {
  return (await getCollection('posts')).sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}
export const dateLabel = (date: Date) => date.toISOString().slice(0, 10).replaceAll('-', '.');
export const readingTime = (post: Post) => Math.max(1, Math.ceil(((post.body || '').match(/[\u4e00-\u9fff]/g)?.length || 0) / 400 + ((post.body || '').match(/[a-zA-Z]+/g)?.length || 0) / 220));
