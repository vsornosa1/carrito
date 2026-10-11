# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).
Versionado [semántico](https://semver.org/lang/es/).

## [Sin publicar]

### Añadido

- **Carrito es gratis.** No hay pago, ni cuentas, ni anuncios: el apoyo es un enlace a Ko-fi. Con eso desaparecen el `offer` y el `entitlement` que se habían especificado, y el CSP no cambia — el widget de Ko-fi carga un script de terceros que `script-src 'self'` bloquea, así que el enlace es la única forma que conserva la promesa de que la app no contacta con nadie. Hay un test que lo comprueba.
- **Página de presentación en `/`**, y la app se muda a `/app`. El service worker se registra solo desde `/app` y con ese ámbito, así que quien llega por un enlace comparte una página y no los 5,8 MB del catálogo: verificado en el navegador, `/` no registra ningún worker y no pide el catálogo. `public/_headers` no cambia.
- **Un pictograma por sección** en la lista de categorías, que pasa de tarjetas en dos columnas a filas con su icono. El mapa es dato y se comprueba contra el catálogo real: una sección nueva sin icono falla en vez de heredar el de otra.
- **El diálogo de confirmación** sustituye a `window.confirm` para vaciar la lista y restablecer el orden. La integración estaba a medias y dejaba la app sin compilar, sin `lint` y con 39 tests en rojo.

### Fixed

- **El héroe ya no arrastra la página de lado en el móvil.** El degradado decorativo del héroe se pinta a propósito más allá del contenido, y en una pantalla estrecha ese sobrante era desplazamiento horizontal con el panel de la derecha cortado por el borde. `overflow-x: clip` en el contenedor lo recorta sin convertirlo en un contenedor de scroll, así que la barra superior sigue pegada a la ventana. Comprobado a 320 px: `scrollWidth` = `clientWidth`, y la barra sigue en `top: 0` al desplazar.
- **Las alternativas recomendaban productos que la propia app marcaba como más procesados (85 casos).** El ranking no veía la clasificación que muestra la interfaz. Ahora `SwapSignals` incluye el `tier` compuesto, así que la recomendación y la etiqueta no pueden contradecirse.
- **Alternativas que existían y no se ofrecían (397 casos).** 216 no tenían forma de expresarse (ahora hay un motivo `tier`) y 181 los descartaba una regla de Pareto que escondía un intercambio real.
- **`unknown` contaba como mejora.** Significa "no lo sabemos": ahora es neutral, ni mejor ni peor que una clasificación conocida.
- **La etiqueta "Alimento entero" sobrevaloraba.** Se aplicaba a 473 productos solo porque su lista de ingredientes no tenía números E — incluido un café en cápsula de un solo ingrediente. Ahora la etiqueta depende de la evidencia.

### Changed

- **El lateral del héroe es una pantalla, no un carrusel.** La tarjeta cambiaba de etiqueta tres veces sobre el mismo producto —que además era uno de los de la lista de al lado—, así que entenderla exigía seguir el ciclo, y la etiqueta se contradecía entre pasos («Ultraprocesado» y «Mejor opción del pasillo» sobre la misma pizza). Ahora se lee de arriba abajo: la compra agrupada por zonas en orden de recorrido, el congelado marcado con la etiqueta de `tierLabel` —la de la app, no una copia— y la mejor opción del mismo pasillo debajo, y el motivo del orden al pie, que es `TRIP_WHY` importada. Se van el temporizador y el estado: la única animación es la entrada de las zonas, una pasada, y con `prefers-reduced-motion` el panel se pinta entero. Un test cuenta que cada producto aparece una sola vez en el panel, que es la parte que nadie entendía.
- **El producto pasa a llamarse Carrito**, y las claves de `localStorage` con él: `carrito.cart.v1` y `carrito.order.v1`. Las claves antiguas se siguen leyendo como respaldo, así que ninguna lista ni ningún orden guardado se pierde con el cambio de nombre. El nombre del supermercado no se toca en ningún sitio donde signifique el supermercado. Los ficheros de `tasks/archive/` no se reescriben: son el registro de lo que se planeó y se hizo entonces.
- **El procesamiento manda sobre los macros.** Un producto con peor procesamiento nunca se recomienda; un macro puede intercambiarse por una mejora de procesamiento, y el coste se muestra con el mismo peso que el beneficio ("a cambio: más azúcar 12 g → 14 g").
- **`Swap.product` es `EnrichedCatalogProduct`**, para que la interfaz pueda leer la clasificación del producto que recomienda.
- `formatReason` y `formatNumber` se eliminan: el texto de los motivos vive en `benefits.ts` como única fuente, para que la etiqueta, los chips y el nombre accesible no se separen.

## [1.0.0] — 2026-10-07

Primera versión: un asistente de nutrición para la compra en Mercadona, instalable y sin conexión.

### Added

- **Búsqueda** de los 4.330 productos del catálogo, insensible a acentos (`platano` encuentra `Plátano`), con chips de categoría cuando no hay consulta.
- **Ficha de producto** con foto, precio, señal de procesamiento, macronutrientes por 100 g y el texto de ingredientes.
- **Señal de procesamiento** con tres bases distintas y siempre etiquetadas: NOVA de Open Food Facts (autoritativa), heurística propia sobre los ingredientes de Mercadona, y regla por categoría para los frescos. Nunca se mezclan.
- **Alternativas mejores** del mismo pasillo, con el motivo en números (más proteína, menos azúcar, menos sal, menos aditivos).
- **Lista de la compra** persistente, con marcado de un solo toque para ir tachando en el pasillo.
- **PWA instalable** que funciona sin conexión: el catálogo va en el precache del service worker.
- **`ErrorBoundary`** con recuperación en español, para que un fallo no deje una pantalla en blanco.
- **Cabeceras de seguridad** (`public/_headers`): CSP estricta, `nosniff`, `frame-ancestors 'none'`, `Permissions-Policy`.
- **Pipeline de datos reproducible**: `data:fetch`, `data:enrich`, `data:build`, `data:coverage`.
- **Guardia de despliegue**: `npm run build` falla con un mensaje claro si falta el catálogo, para que un host mal configurado no publique una app cuya búsqueda no devuelve nada.
- **`netlify.toml` + `.nvmrc`** con Node 22, para que Netlify y Cloudflare Pages funcionen sin configurar nada.

### Security

- Sin backend, sin cuentas y sin datos de usuario: la lista vive en `localStorage` y **nada** sale del dispositivo.
- **Cero peticiones a `tienda.mercadona.es`** en tiempo de ejecución. El catálogo procede de un espejo estático; Mercadona prohíbe su `/api` en `robots.txt` y bloquea a los scrapers.
- El HTML de ingredientes se convierte a texto plano; no se usa `dangerouslySetInnerHTML`.
- `npm audit`: 0 vulnerabilidades.

### Accessibility

- WCAG 2.1 AA verificado en un navegador real: 0 fallos de contraste en las tres pantallas, 150 elementos interactivos con nombre accesible y 0 imágenes sin `alt`.
- Corregido antes de publicar: el blanco sobre `#00a650` daba 3,20:1 (por debajo de 4,5:1). Se introduce `--color-primary-strong` (`#007a3a`) para las superficies con texto blanco.
- Objetivos táctiles de ≥ 44 px en los controles que se usan en el pasillo; foco visible de 2 px.

### Fixed

- Los productos azucarados sin números E (leche condensada, jarabes) se clasificaban como «alimento entero»; ahora detectan el azúcar añadido como señal de procesamiento.
- La búsqueda sin conexión ahora funciona: el catálogo entró en el precache, que Workbox limitaba a 2 MiB.
- El cliente de Open Food Facts trata un `404` como «no encontrado» en lugar de fallar, y el enriquecimiento tolera fallos por producto.
