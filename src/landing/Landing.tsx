import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

import {
  HERO_BEATS,
  HERO_BEAT_MS,
  HERO_ITEMS,
  nextBeat,
  orderedItems,
  zoneLabel,
} from './hero-order.ts';
import { usePrefersReducedMotion, useReveal } from './use-reveal.ts';

// Trailing slash on purpose: /app is a real document at app/index.html, and the
// trailing slash is what makes a static host resolve the directory index rather than
// guess. The manifest's start_url says the same thing.
const APP_URL = '/app/';
const KOFI_URL = 'https://ko-fi.com/sornosa';

/** Fades its children in the first time they scroll into view. */
function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  const { ref, shown } = useReveal<HTMLDivElement>();

  return (
    <div ref={ref} className={`${className ?? ''} reveal${shown ? ' reveal--in' : ''}`}>
      {children}
    </div>
  );
}

function Bar() {
  return (
    <header className="bar">
      <p className="bar__mark">Carrito</p>
      <a className="bar__cta" href={APP_URL}>
        Abrir la app
      </a>
    </header>
  );
}

function Hero() {
  const reduce = usePrefersReducedMotion();
  const [beat, setBeat] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const id = window.setInterval(() => setBeat(nextBeat), HERO_BEAT_MS);
    return () => window.clearInterval(id);
  }, [reduce]);

  // Under reduced motion the demo does not animate: it shows its final state, the
  // list already in trip order. Slowing the animation down would still be motion.
  const shown = reduce ? HERO_BEATS.length - 1 : beat;
  const ordered = orderedItems();
  const zones = [...new Set(ordered.map((item) => item.zone))];

  return (
    <section className="hero" aria-labelledby="hero-title">
      <Reveal className="hero__copy">
        <p className="hero__eyebrow">Gratis · sin cuentas · sin anuncios</p>
        <h1 id="hero-title" className="hero__title">
          Sabe qué hay dentro de lo que compras.
        </h1>
        <p className="hero__lead">
          Carrito lee las etiquetas de los 4.300 productos de Mercadona y te dice qué llevan,
          cuánto azúcar y cuántos aditivos. Y cuando algo no te conviene, te enseña una
          alternativa mejor del mismo pasillo.
        </p>
        <div className="hero__actions">
          <a className="btn btn--primary" href={APP_URL}>
            Abrir la app
          </a>
          <a
            className="btn btn--ghost"
            href={KOFI_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Invítame a un café (se abre en una pestaña nueva)"
          >
            Invítame a un café
          </a>
        </div>
        <p className="hero__pron">
          <span className="hero__pron-word">ca·RRI·to</span>
          <span className="hero__pron-note">
            el de empujar por los pasillos y el de volver a casa
          </span>
        </p>
      </Reveal>

      {/* Decorative: every claim it acts out is stated in the copy around it. */}
      <Reveal className="hero__demo">
        <div className={`demo demo--${HERO_BEATS[shown]!.id}`} aria-hidden="true">
          <div className="demo__card">
            <p className="demo__card-name">{HERO_ITEMS[0]!.name}</p>
            <p className="demo__card-badge">{HERO_BEATS[0]!.caption}</p>
          </div>

          <p className="demo__swap">{HERO_BEATS[1]!.caption}</p>

          <ul className="demo__zones" role="list">
            {zones.map((zone) => (
              <li key={zone} className="demo__zone">
                <p className="demo__zone-name">{zoneLabel(zone)}</p>
                <ul className="demo__items" role="list">
                  {ordered
                    .filter((item) => item.zone === zone)
                    .map((item) => (
                      <li key={item.name} className="demo__item">
                        {item.name}
                      </li>
                    ))}
                </ul>
              </li>
            ))}
          </ul>

          {/* Keyed so a beat change remounts it, which replays the entry animation:
              without the key React swaps the text and the caption just blinks. */}
          <p className="demo__caption" key={HERO_BEATS[shown]!.id}>
            {HERO_BEATS[shown]!.caption}
          </p>
        </div>
      </Reveal>
    </section>
  );
}

const STEPS = [
  {
    title: 'Busca lo que ibas a comprar',
    body: '4.300 productos. Da igual si escribes platano, sin tilde: te encuentra el Plátano de Canarias. Y funciona con una mano y sin cobertura.',
  },
  {
    title: 'Mira qué lleva de verdad',
    body: 'Aditivos, procesamiento y macros, con el texto de los ingredientes detrás de cada afirmación. Donde no hay datos lo dice: no se inventa un número.',
  },
  {
    title: 'Añádelo a la lista',
    body: 'La lista se queda en tu móvil, sin cuentas ni registro. Vas tachando por la tienda y el total se actualiza mientras compras.',
  },
];

function HowItWorks() {
  return (
    <section className="steps" aria-labelledby="steps-title">
      <Reveal>
        <p className="kicker">Cómo funciona</p>
        <h2 id="steps-title" className="section-title">
          Tres pasos, y ninguno es registrarse.
        </h2>
      </Reveal>

      <ol className="steps__list">
        {STEPS.map((step, index) => (
          <li key={step.title} className="steps__item">
            <Reveal>
              <span className="steps__number" aria-hidden="true">
                {index + 1}
              </span>
              <h3 className="steps__title">{step.title}</h3>
              <p className="steps__body">{step.body}</p>
            </Reveal>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Ordering() {
  return (
    <section className="order" aria-labelledby="order-title">
      <Reveal className="order__copy">
        <p className="kicker">Sobre el orden de la lista</p>
        <h2 id="order-title" className="section-title">
          No hay dos Mercadonas iguales.
        </h2>
        <p className="order__body">
          Cada tienda coloca las cosas a su manera, así que una ruta perfecta no existe y
          Carrito no la promete. Te propone un orden sensato —frescos primero, congelados al
          final— y lo corriges con un toque: mueves una zona, mueves un producto dentro de su
          zona, o lo pones todo de la A a la Z para comprobar algo.
        </p>
        <p className="order__body">
          Cuando vuelves, tu orden sigue donde lo dejaste. Es tu lista, no la nuestra.
        </p>
      </Reveal>
    </section>
  );
}

function Support() {
  return (
    <section className="support-landing" aria-labelledby="support-title">
      <Reveal className="support-landing__panel">
        <h2 id="support-title" className="section-title">
          Gratis, y va a seguir siéndolo.
        </h2>
        <p className="support-landing__body">
          Sin anuncios, sin cuentas y sin vender nada de lo que haces con la app. Si te ahorra
          tiempo en la compra, puedes invitarme a un café.
        </p>
        <a
          className="btn btn--primary"
          href={KOFI_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Invítame a un café (se abre en una pestaña nueva)"
        >
          Invítame a un café
        </a>
      </Reveal>
    </section>
  );
}

function Foot() {
  return (
    <footer className="foot">
      <p className="foot__note">
        Por ahora, el único catálogo disponible es el de Mercadona.
      </p>
      <p className="foot__note">
        Carrito es un proyecto independiente y no está afiliado a Mercadona. El catálogo
        procede de fuentes públicas y los datos nutricionales, de Open Food Facts.
      </p>
    </footer>
  );
}

export function Landing() {
  return (
    <div className="landing">
      <a className="landing__skip" href="#contenido">
        Saltar al contenido
      </a>
      <Bar />
      <main id="contenido" className="landing__main">
        <Hero />
        <HowItWorks />
        <Ordering />
        <Support />
      </main>
      <Foot />
    </div>
  );
}
