import { defineConfig } from 'astro/config';
import { satteri } from '@astrojs/markdown-satteri';

export default defineConfig({
  site: 'https://ydnd.github.io',
  trailingSlash: 'always',
  devToolbar: { enabled: false },
  markdown: {
    processor: satteri({
      hastPlugins: [{
        name: 'lazy-article-images',
        element: {
          filter: ['img'],
          visit(node, context) {
            context.setProperty(node, 'loading', 'lazy');
            context.setProperty(node, 'decoding', 'async');
          }
        }
      }]
    }),
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      defaultColor: false,
      wrap: false
    }
  }
});
