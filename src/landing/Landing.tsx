import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from 'framer-motion';

import { CarritoMark } from '../components/CarritoMark.tsx';
import {
  HERO_BEATS,
  HERO_BEAT_MS,
  HERO_ITEMS,
  nextBeat,
  orderedItems,
  zoneLabel,
} from './hero-order.ts';

const APP_URL = '/app/';
const KOFI_URL = 'https://ko-fi.com/sornosa';

/** A single easing for the whole page, so nothing looks like it arrived from elsewhere. */
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/**
 * The landing page.
 *
 * `MotionConfig reducedMotion="user"` is the reason this page can be as animated as it
 * is: framer-motion disables transform and layout animations for readers who have asked
 * for less motion, so the page does not have to choose between standing out and being
 * usable. The hero additionally stops auto-playing entirely — see `Hero`.
 */
function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.65, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

function Bar() {
  return (
    <motion.header
      className="bar"
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
    >
      <p className="bar__brand">
        <span className="bar__logo">
          <CarritoMark size={22} />
        </span>
        <span className="bar__mark">Carrito</span>
      </p>
      <motion.a className="bar__cta" href={APP_URL} whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}>
        Abrir la app
      </motion.a>
    </motion.header>
  );
}

function Hero() {
  // Null on the server and in tests; treated as "no preference".
  const reduce = useReducedMotion() ?? false;
  const [beat, setBeat] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const id = window.setInterval(() => setBeat(nextBeat), HERO_BEAT_MS);
    return () => window.clearInterval(id);
  }, [reduce]);

  // Under reduced motion the hero does not play at all: it shows the last beat, which is
  // the list already in trip order. A slower animation would still be an animation.
  const shown = reduce ? HERO_BEATS.length - 1 : beat;
  const phase = HERO_BEATS[shown]!;

  // The reorder is the point. As they were added, the items are in no particular order;
  // on the last beat they take their trip order, and framer's `layout` animates each row
  // to its new place rather than cross-fading two lists.
  const rows = phase.id === 'order' ? orderedItems() : [...HERO_ITEMS];

  return (
    <section className="hero" aria-labelledby="hero-title">
      <motion.div
        className="hero__copy"
        initial="hidden"
        animate="shown"
        variants={{ shown: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } } }}
      >
        <motion.p
          className="hero__eyebrow"
          variants={{ hidden: { opacity: 0, y: 14 }, shown: { opacity: 1, y: 0 } }}
          transition={{ duration: 0.5, ease: EASE }}
        >
          Gratis · sin cuentas · sin anuncios
        </motion.p>

        <motion.h1
          id="hero-title"
          className="hero__title"
          variants={{ hidden: { opacity: 0, y: 20 }, shown: { opacity: 1, y: 0 } }}
          transition={{ duration: 0.7, ease: EASE }}
        >
          Conoce qué lleva la comida que compras.
        </motion.h1>

        <motion.p
          className="hero__lead"
          variants={{ hidden: { opacity: 0, y: 16 }, shown: { opacity: 1, y: 0 } }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          Carrito lee las etiquetas de los 4.300 productos de Mercadona y te dice qué llevan,
          cuánto azúcar y cuántos aditivos. Y cuando algo no te conviene, te enseña una
          alternativa mejor del mismo pasillo.
        </motion.p>

        <motion.div
          className="hero__actions"
          variants={{ hidden: { opacity: 0, y: 16 }, shown: { opacity: 1, y: 0 } }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          <motion.a
            className="btn btn--primary"
            href={APP_URL}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.97 }}
          >
            Abrir la app
          </motion.a>
        </motion.div>

        <motion.p
          className="hero__pron"
          variants={{ hidden: { opacity: 0 }, shown: { opacity: 1 } }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          <span className="hero__pron-word">ca·RRI·to</span>
          <span className="hero__pron-note">
            el de empujar por los pasillos y el de volver a casa
          </span>
        </motion.p>
      </motion.div>

      <Reveal className="hero__demo">
        {/* Outside the aria-hidden demo, because it qualifies everything inside it. */}
        <p className="demo__tag">Ejemplo</p>

        {/* Decorative: every claim it acts out is stated in the copy beside it. And the
            numbers are gone — the app refuses to invent one, and so does its poster. */}
        <div className={`demo demo--${phase.id}`} aria-hidden="true">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={phase.id}
              className="demo__card"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.32, ease: EASE }}
            >
              <p className="demo__card-name">{HERO_ITEMS[0]!.name}</p>
              <p className="demo__card-badge">{phase.badge}</p>
            </motion.div>
          </AnimatePresence>

          <motion.ul className="demo__list" layout>
            {rows.map((item) => (
              <motion.li
                key={item.name}
                className="demo__row"
                layout
                transition={{ layout: { duration: 0.6, ease: EASE } }}
              >
                <span className="demo__row-name">{item.name}</span>
                <span className="demo__row-zone">{zoneLabel(item.zone)}</span>
              </motion.li>
            ))}
          </motion.ul>

          <div className="demo__caption-slot">
            <AnimatePresence mode="wait" initial={false}>
              <motion.p
                key={phase.id}
                className="demo__caption"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: EASE }}
              >
                {phase.caption}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/*
  Three steps that narrate value rather than features. The old first line was "Da igual si
  escribes platano, sin tilde: te encuentra el Plátano de Canarias" — true, and it read
  like a test fixture. Nobody in an aisle is impressed that search works.
*/
const STEPS = [
  {
    title: 'Búscalo con una mano',
    body: 'Escrito como te salga: sin tildes, con prisa, con el carro en la otra mano. 4.300 productos que aparecen igual de rápido en el pasillo, con o sin cobertura.',
  },
  {
    title: 'Mira qué lleva de verdad',
    body: 'Cuánto de procesado está, los aditivos uno a uno y los macros por 100 g. Y detrás de cada afirmación, el texto de la etiqueta que la sostiene.',
  },
  {
    title: 'Decide con la etiqueta delante',
    body: 'Cuando hay algo mejor en el mismo pasillo te lo enseña, con el motivo en números. Cuando no hay datos lo dice: aquí no se inventa nada.',
  },
];

const STATS = [
  { value: '4.300', label: 'productos leídos etiqueta a etiqueta' },
  { value: '26', label: 'secciones agrupadas por zonas' },
  { value: '0', label: 'cuentas, anuncios y rastreo' },
];

/** The numbers, because they are the argument: this is not a mock-up. */
function Stats() {
  return (
    <Reveal>
      <ul className="stats" role="list">
        {STATS.map((stat) => (
          <li key={stat.label} className="stat">
            <span className="stat__value">{stat.value}</span>
            <span className="stat__label">{stat.label}</span>
          </li>
        ))}
      </ul>
    </Reveal>
  );
}

function HowItWorks() {
  return (
    <section className="steps" aria-labelledby="steps-title">
      <Reveal>
        <p className="kicker">Cómo funciona</p>
        <h2 id="steps-title" className="section-title">
          Tres pasos, y ninguno es registrarse.
        </h2>
      </Reveal>

      <motion.ol
        className="steps__list"
        initial="hidden"
        whileInView="shown"
        viewport={{ once: true, amount: 0.2 }}
        variants={{ shown: { transition: { staggerChildren: 0.12 } } }}
      >
        {STEPS.map((step, index) => (
          <motion.li
            key={step.title}
            className="steps__item"
            variants={{ hidden: { opacity: 0, y: 26 }, shown: { opacity: 1, y: 0 } }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <span className="steps__number" aria-hidden="true">
              {index + 1}
            </span>
            <h3 className="steps__title">{step.title}</h3>
            <p className="steps__body">{step.body}</p>
          </motion.li>
        ))}
      </motion.ol>
    </section>
  );
}

function Ordering() {
  return (
    <section className="order" aria-labelledby="order-title">
      <Reveal className="order__copy">
        <p className="kicker">Sobre el orden del carrito</p>
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
          Cuando vuelves, tu orden sigue donde lo dejaste. Es tu carrito, no el nuestro.
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
        <motion.a
          className="btn btn--primary"
          href={KOFI_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Invítame a un café (se abre en una pestaña nueva)"
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.97 }}
        >
          Invítame a un café
        </motion.a>
      </Reveal>
    </section>
  );
}

function Foot() {
  return (
    <footer className="foot">
      <p className="foot__note">Por ahora, el único catálogo disponible es el de Mercadona.</p>
      <p className="foot__note">
        Carrito es un proyecto independiente y no está afiliado a Mercadona. El catálogo
        procede de fuentes públicas y los datos nutricionales, de Open Food Facts.
      </p>
    </footer>
  );
}

export function Landing() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="landing">
        <a className="landing__skip" href="#contenido">
          Saltar al contenido
        </a>
        <Bar />
        <main id="contenido" className="landing__main">
          <Hero />
          <Stats />
          <HowItWorks />
          <Ordering />
          <Support />
        </main>
        <Foot />
      </div>
    </MotionConfig>
  );
}
