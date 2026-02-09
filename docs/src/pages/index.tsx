import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/docs/guide/overview">
            Comenzar Guía 🚀
          </Link>
          <Link
            className="button button--outline button--secondary button--lg ml-4"
            style={{marginLeft: '1rem'}}
            to="/example">
            Ver Demo Completo ✨
          </Link>
        </div>
      </div>
    </header>
  );
}

interface FeatureItem {
  title: string;
  icon: string;
  description: ReactNode;
}

const FeatureList: FeatureItem[] = [
  {
    title: 'Editor Visual de Fórmulas',
    icon: '∑',
    description: (
      <>
        100+ bloques pre-armados en 9 categorías (fracciones, integrales, matrices, griegos, operadores). Preview en tiempo real con KaTeX.
      </>
    ),
  },
  {
    title: '6 Tipos de Celda',
    icon: '📝',
    description: (
      <>
        Markdown con toolbar flotante, Code, LaTeX con editor visual, Image con drag & drop, Embed con presets (YouTube, Desmos, CodePen), Raw.
      </>
    ),
  },
  {
    title: 'UX Moderna',
    icon: '✨',
    description: (
      <>
        Click-to-edit, toolbar flotante contextual, insert handles entre celdas, animaciones suaves, temas light/dark.
      </>
    ),
  },
  {
    title: 'Zero-Server',
    icon: '⚡',
    description: (
      <>
        100% TypeScript, funciona offline sin backend. Core ~25KB. Arranque instantáneo sin kernel ni compilación.
      </>
    ),
  },
  {
    title: 'Plugin System',
    icon: '🔌',
    description: (
      <>
        Cada feature es un plugin opt-in. Extensible en cada capa — custom cell types, renderers, toolbar actions, keybindings.
      </>
    ),
  },
  {
    title: 'Framework Agnostic',
    icon: '⚛️',
    description: (
      <>
        Core puro TypeScript. Adapter React listo. Arquitectura preparada para Vue, Svelte, Solid, Vanilla JS.
      </>
    ),
  },
];

function Feature({title, icon, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <span style={{fontSize: '3rem'}}>{icon}</span>
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title} - Editor Científico`}
      description={siteConfig.tagline}>
      <HomepageHeader />
      <main>
        <section className={styles.features}>
          <div className="container">
            <div className="row">
              {FeatureList.map((props, idx) => (
                <Feature key={idx} {...props} />
              ))}
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
