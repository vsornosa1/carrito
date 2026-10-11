import type { ReactNode } from 'react';
import { MotionConfig, motion, useReducedMotion } from 'framer-motion';

import { CarritoMark } from '../components/CarritoMark.tsx';
import { pluralise } from '../lib/plural.ts';
import { TRIP_WHY } from '../lib/zones.ts';
import { heroGroups } from './hero-order.ts';

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
 * usable. The hero additionally plays no loop at all — its build is one pass, skipped
 * outright under reduced motion. See `Hero`.
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

  // Flat out of the groups rather than `HERO_ITEMS.length`, so the count on the card is
  // the number of rows under it even if a zone ever drops one.
  const groups = heroGroups();
  const count = groups.flatMap((group) => group.items).length;

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

        {/* Decorative: every claim it acts out is stated in the copy beside it, and the
            numbers are absent on purpose — the app refuses to invent one, and so does its
            poster. One screen, read top to bottom: what the list is, where each thing sits
            in the store, and the item the app has something to say about. */}
        <div className="demo" aria-hidden="true">
          <p className="demo__head">
            <span className="demo__head-title">Tu compra</span>
            <span className="demo__head-count">
              {pluralise(count, 'producto', 'productos')}
            </span>
          </p>

          {/* Each zone arrives after the one before it, which is the walk itself. One
              pass, then still: nothing here changes while it is being read. */}
          <motion.ul
            className="demo__groups"
            role="list"
            initial={reduce ? false : 'hidden'}
            animate="shown"
            variants={{ shown: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } } }}
          >
            {groups.map((group) => (
              <motion.li
                key={group.label}
                className="demo__group"
                variants={{ hidden: { opacity: 0, y: 12 }, shown: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.45, ease: EASE }}
              >
                <p className="demo__group-label">{group.label}</p>
                <ul className="demo__rows" role="list">
                  {group.items.map((item) => (
                    <li
                      key={item.name}
                      className={item.flag === undefined ? 'demo__row' : 'demo__row demo__row--flag'}
                    >
                      <p className="demo__row-name">
                        <span>{item.name}</span>
                        {item.flag === undefined ? null : (
                          <span className="demo__row-badge">{item.flag.badge}</span>
                        )}
                      </p>
                      {item.flag === undefined ? null : (
                        <p className="demo__row-better">{item.flag.better}</p>
                      )}
                    </li>
                  ))}
                </ul>
              </motion.li>
            ))}
          </motion.ul>

          {/* The app's own line for why the list ends where it does, imported rather
              than retyped, so the poster cannot drift from what the app tells you. */}
          <p className="demo__note">{TRIP_WHY}</p>
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
    body: 'Escrito como quieras: sin tildes, con prisa, con el carro en la otra mano. 4.300 productos que aparecen igual de rápido en el pasillo, con o sin cobertura.',
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
  { value: '0', label: 'cuentas, anuncios y cookies' },
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
          Carrito no la promete. Te propone un orden sensato, frescos primero + congelados al
          final, y lo corriges con un toque: mueves una zona, mueves un producto dentro de su
          zona, o lo pones todo de la A a la Z para comprobar algo.
        </p>
        <p className="order__body">
          Cuando vuelves, tu orden sigue donde lo dejaste. Es tu carrito, no el nuestro.
        </p>
      </Reveal>
    </section>
  );
}

/*
  What is done and what is coming, on the page rather than in a drawer.

  Publishing the gap is the honest version of a roadmap and the useful one: it says the
  project is alive, which is the only real argument for supporting it. No dates, because
  a personal project that misses a date has lied on its own landing page.
*/
const ROADMAP = {
  now: [
    'Ordenar un pasillo por precio o de la A a la Z',
    'Leer el procesamiento y los aditivos de los 4.300 productos',
    'Una alternativa mejor cuando la hay, con el motivo en números',
    'Tu propio orden del carrito, corregible con un toque',
  ],
  next: [
    'Recetas con lo que ya tienes en el carrito',
    'Compartir el mismo carrito con la familia',
    'Un enlace para compartir un producto concreto',
  ],
};

function Roadmap() {
  return (
    <section className="roadmap" aria-labelledby="roadmap-title">
      <Reveal className="roadmap__lists">
        <p className="kicker">En qué ando</p>
        <h2 id="roadmap-title" className="section-title">
          Esto no está terminado, y se nota.
        </h2>
        <p className="roadmap__lead">
          Te enseño lo que falta en vez de esperar a que esté perfecto. Lo primero ya funciona
          hoy; lo segundo es lo siguiente, sin prometer fechas.
        </p>

        <div className="roadmap__columns">
          <div>
            <h3 className="roadmap__head">Ya funciona</h3>
            <ul className="roadmap__list" role="list">
              {ROADMAP.now.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="roadmap__head">Lo siguiente</h3>
            <ul className="roadmap__list roadmap__list--next" role="list">
              {ROADMAP.next.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </Reveal>

      <Reveal className="roadmap__support">
        <h3 className="roadmap__head">Apoyar el proyecto</h3>
        <p className="support-landing__body">
          Sin anuncios, sin cuentas y sin vender nada de lo que haces con la app. Si te ahorra
          tiempo en la compra, puedes invitarme a un café — es lo que paga el siguiente
          despliegue.
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
          <Roadmap />
        </main>
        <Foot />
      </div>
    </MotionConfig>
  );
}
