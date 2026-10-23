import type { Post } from './posts';

export const topics = [
  {
    slug: 'shiro',
    title: 'Apache Shiro 漏洞分析',
    description: '认证绕过与 rememberMe 反序列化漏洞。',
    matches: (post: Post) => post.data.legacyPath.toLowerCase().includes('shiro')
  },
  {
    slug: 'web-components',
    title: 'Web 组件漏洞分析',
    description: 'Next.js 中间件鉴权与 Vite 文件访问控制。',
    matches: (post: Post) => /next\.js-|\/Vite-/i.test(post.data.legacyPath)
  },
  {
    slug: 'ssrf',
    title: 'SSRF 与内网访问',
    description: '基于靶场的 SSRF 复现与内网访问分析。',
    matches: (post: Post) => post.data.legacyPath.includes('ssrf-vul-for-new')
  }
];

export function articleSignals(post: Post): { label: string; url: string }[] {
  const text = `${post.data.title} ${(post.data.tags || []).join(' ')}`;
  const cve = text.match(/CVE-\d{4}-\d{4,7}/i)?.[0].toUpperCase();
  if (cve && !post.data.title.toUpperCase().includes(cve)) {
    return [{ label: cve, url: `/articles/?q=${encodeURIComponent(cve)}` }];
  }
  if (/shiro/i.test(text)) return [{ label: 'Apache Shiro', url: '/topics/shiro/' }];
  if (post.data.categories === 'CTF') {
    const year = post.data.title.match(/ISCC[-\s]*(20\d{2})/i)?.[1];
    return (post.data.tags || []).slice(0, 2).map(tag => ({
      label: tag.toLowerCase() === 'iscc' && year ? `ISCC ${year}` : tag.toLowerCase() === 'mobile' ? 'Mobile' : tag,
      url: `/articles/?tag=${encodeURIComponent(tag)}`
    }));
  }
  if (/ssrf/i.test(text)) return [{ label: 'SSRF', url: '/topics/ssrf/' }];
  if (/docker/i.test(text)) return [{ label: 'Docker · Linux', url: '/articles/?category=%E5%B7%A5%E5%85%B7%E4%B8%8E%E7%8E%AF%E5%A2%83' }];
  if (/shellshock/i.test(text)) return [{ label: 'Bash', url: '/articles/?tag=Shellshock' }];
  if (/vite/i.test(text)) return [{ label: 'Vite', url: '/articles/?tag=vite' }];
  return [];
}
