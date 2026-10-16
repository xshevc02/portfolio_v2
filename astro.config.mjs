// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

// GitHub Pages project site: https://xshevc02.github.io/portfolio_v2/
// For a custom domain, set `site` to it and remove `base`.
export default defineConfig({
  site: 'https://xshevc02.github.io',
  base: '/portfolio_v2',
  trailingSlash: 'always',
  integrations: [mdx()],
});
