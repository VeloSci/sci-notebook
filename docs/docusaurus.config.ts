import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import path from 'path';

const config: Config = {
  title: 'SciNotebook',
  tagline: 'Interactive scientific notebook engine for the modern web',
  favicon: 'img/favicon.ico',

  url: 'https://VeloSci.github.io',
  baseUrl: '/sci-notebook/',

  organizationName: 'VeloSci',
  projectName: 'sci-notebook',

  onBrokenLinks: 'ignore',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'es',
    locales: ['es'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          remarkPlugins: [remarkMath],
          rehypePlugins: [rehypeKatex],
          editUrl: 'https://github.com/VeloSci/sci-notebook/tree/main/docs/',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/docusaurus-social-card.jpg',
    colorMode: {
      defaultMode: 'dark',
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'SciNotebook',
      logo: {
        alt: 'SciNotebook Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Guía',
        },
        {to: '/docs/api', label: 'API', position: 'left'},
        {to: '/docs/examples', label: 'Ejemplos', position: 'left'},
        {
          href: 'https://github.com/VeloSci/sci-notebook',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Introducción',
              to: '/docs/guide/overview',
            },
            {
              label: 'Ejemplos',
              to: '/docs/examples/basic-usage',
            },
          ],
        },
        {
          title: 'Ecosistema',
          items: [
            {
              label: 'SciDNA',
              href: 'https://github.com/VeloSci',
            },
            {
              label: 'VeloSci',
              href: 'https://velosci.com',
            },
          ],
        },
        {
          title: 'Más',
          items: [
            {
              label: 'Roadmap',
              to: '/docs/roadmap',
            },
            {
              label: 'GitHub',
              href: 'https://github.com/VeloSci/sci-notebook',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} VeloSci Instrumentation Services. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,

  plugins: [
    async function myPlugin(context, options) {
      return {
        name: 'docusaurus-plugin-aliases',
        configureWebpack() {
          return {
            resolve: {
              alias: {
                '@velo-sci/notebook-core': path.resolve(__dirname, '../packages/core/src'),
                '@velo-sci/notebook-renderer': path.resolve(__dirname, '../packages/renderer/src'),
                '@velo-sci/notebook-react': path.resolve(__dirname, '../packages/react/src'),
                '@velo-sci/notebook-plugin-latex': path.resolve(__dirname, '../packages/plugin-latex/src'),
                '@velo-sci/notebook-plugin-ai': path.resolve(__dirname, '../packages/plugin-ai/src'),
              },
            },
          };
        },
      };
    },
  ],

  stylesheets: [
    {
      href: 'https://cdn.jsdelivr.net/npm/katex@0.13.24/dist/katex.min.css',
      type: 'text/css',
      integrity: 'sha384-odtC+0UGzzFL/6PNoE8rX/SPcQWSi9PQPg5dzGi1CwPTrtRcnSMnpP/E6iBaInPV',
      crossorigin: 'anonymous',
    },
  ],
};

export default config;
