import fs from 'node:fs';
import path from 'node:path';

for (const file of fs.readdirSync('src/content/posts').filter(f => f.endsWith('.md'))) {
  const original = fs.readFileSync(path.join('../ydnd/source/_posts', file), 'utf8');
  const originalMatch = original.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?([\s\S]*)$/);
  if (!originalMatch) throw new Error(`Missing original: ${file}`);
  const title = originalMatch[1].match(/^title:\s*(.+)$/m)?.[1].trim();
  const body = originalMatch[2].trim();
  const paragraphs = body.replace(/```[\s\S]*?```/g, '').split(/\r?\n\s*\r?\n/)
    .map(p => p.replace(/!\[[^\]]*\]\([^)]*\)/g, '').trim());
  const paragraph = paragraphs.find(p => !/^(#|<)/u.test(p) && p.length > 12) || '';
  const plain = paragraph.replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[*`]/g, '').replace(/\s+/g, ' ').trim();
  const excerpt = plain.length > 130 ? plain.slice(0, 130) + '…' : plain;
  const current = fs.readFileSync(path.join('src/content/posts', file), 'utf8');
  const currentMatch = current.match(/^---\s*\r?\n([\s\S]*?)\r?\n---/);
  const metadata = currentMatch[1]
    .replace(/^title:.*$/m, `title: ${JSON.stringify(title)}`)
    .replace(/^description:.*$/m, `description: ${JSON.stringify(excerpt)}`);
  fs.writeFileSync(path.join('src/content/posts', file), `---\n${metadata}\n---\n\n${body}\n`);
}
console.log('Restored original titles and complete article bodies; excerpts come from the original prose.');
