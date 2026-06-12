# angular-movement plan

Ultima actualizacion: 2026-06-12

## Objetivo

Convertir `angular-movement` en una libreria de motion para Angular con una promesa parecida a
Framer Motion, pero sin copiar React: API Angular-native, runtime basado en Web Animations API,
integracion con standalone components, signals, SSR safety y cero boilerplate de
`@angular/animations`.

La direccion de producto es:

- Declarar motion desde templates Angular.
- Usar estados simples: initial, animate, exit, variants.
- Coordinar presence, stagger, scroll, layout, SVG y drag con una API coherente.
- Mantener el core pequeno, testeado y publicable.

## Como usar este archivo en una nueva sesion

Al empezar una sesion nueva, pedir:

```text
Lee plan.md y continua con la fase X. No empieces de cero; revisa solo los archivos necesarios,
implementa, y verifica con los comandos indicados.
```

Antes de tocar codigo:

1. Ejecutar `git status --short`.
2. Leer la fase activa de este archivo.
3. Leer solo los archivos relacionados con esa fase.
4. No revertir cambios ajenos.
5. Al cerrar, actualizar la seccion "Estado actual".

Comandos base de verificacion:

```bash
pnpm test:coverage
pnpm build
pnpm e2e
```

Para release/package:

```bash
ng build movement
pnpm run pack:check
```

## Analisis inicial

### Que existe hoy

El repo contiene:

- `projects/movement`: libreria Angular publicable.
- `src`: demo/docs site con AnalogJS.
- La app demo importa la libreria via alias Vite `movement -> projects/movement/src/public-api.ts`.

El core actual ya incluye:

- Presets y custom keyframes.
- API motion-style con `moveInitial`, `moveAnimate`, `moveExit`.
- Variants con `moveVariants`.
- Presence con `movePresence`.
- Stagger con `moveStagger`.
- Interacciones: hover, tap, focus, in-view.
- Scroll/parallax.
- Layout.
- Drag.
- Spring.
- SVG path drawing con `pathLength` / `pathOffset`.
- Per-property transitions.
- Runtime WAAPI y no `@angular/animations` como dependencia directa del package publicable.

### Fortalezas

- La propuesta ya es diferenciable para Angular: poca friccion, directivas declarativas y API
  familiar para usuarios de motion libraries.
- SVG drawing, presence, variants, drag y scroll ya dan una base fuerte de producto.
- La libreria no depende de Framer Motion, GSAP ni `@angular/animations`.
- Hay buena cobertura unitaria en directivas y engines.

### Riesgos

- La API puede parecer una coleccion de directivas si la documentacion no guia el uso recomendado.
- Variants todavia deben sentirse mas "sistema de estados" que helper puntual.
- Layout animation necesita robustez de producto: FLIP, resize, reorder, edge cases y pruebas.
- Drag necesita polish para acercarse al nivel esperado: inertia, snap points, constraints dinamicos.
- Falta una capa tipo motion values/signals para valores reactivos derivados.
- La demo/docs site necesita mas paginas de referencia para aprender solo desde la web.
- Faltan e2e/visual tests especificos para demos criticas.

## Norte tecnico

La libreria debe explicarse asi:

```text
Angular-native motion API powered by the browser Web Animations API.
```

No decir:

- "Built on Angular runtime animation API".
- Que requiere `@angular/animations`.
- Que es un port literal de Framer Motion.

Si se menciona Framer Motion, hacerlo como referencia mental:

```text
Motion-style state API for Angular: initial, animate, exit, variants and presence.
```

## API recomendada

Orden de aprendizaje y recomendacion:

| Nivel         | API principal                                                                |
| ------------- | ---------------------------------------------------------------------------- |
| Basico        | `moveEnter`, `moveLeave`, `[move]`, `moveInitial`, `moveAnimate`, `moveExit` |
| Interacciones | `moveWhileHover`, `moveWhileTap`, `moveFocus`, `moveInView`                  |
| Estado        | `moveVariants`, `moveTarget`, `moveTrigger`                                  |
| Orquestacion  | `movePresence`, `moveStagger`                                                |
| Scroll/layout | `moveScroll`, `moveParallax`, `moveLayout`, `moveSmoothScroll`               |
| Avanzado      | `pathLength`, `pathOffset`, `transition`, `spring`, `moveDrag`               |

La API que deberia recomendarse primero para UI de producto:

```html
<ng-container *movePresence="isOpen()">
  <article
    [moveInitial]="{ opacity: 0, y: 24 }"
    [moveAnimate]="{ opacity: 1, y: 0 }"
    [moveExit]="{ opacity: 0, y: -16 }"
  >
    Panel
  </article>
</ng-container>
```

## Plan por fases

### Fase 1. Core runtime y transiciones

Objetivo: que las features avanzadas funcionen de verdad.

Estado: completada la primera correccion importante.

Hecho:

- `composeTransitionKeyframes` ya conserva valores string como `strokeDasharray`.
- `x`, `y`, `scale`, `rotate`, `blur` y SVG passthrough pasan por el compositor normal.
- Tests agregados para:
  - `x/y + transition`
  - `scale/rotate + transition`
  - `blur + transition`
  - `strokeDasharray` string
  - `pathLength + opacity + transition` desde `AnimationEngine`
- Verificado con `pnpm test:coverage`, `pnpm build`, `pnpm e2e`.

Pendiente recomendado:

- Documentar explicitamente la limitacion actual de per-property easing distinto.
- Decidir si se soportan easings por propiedad en WAAPI usando keyframes separados o warning actual.
- Anadir tests para `scaleX/scaleY`, `rotateX/rotateY`, `pathOffset` y propiedades CSS string discretas.
- Revisar `WaapiPlayer` y `SpringPlayer` para subir cobertura en finish/cancel/iterations.

Criterio de exito:

- Las transiciones por propiedad generan keyframes WAAPI correctos.
- SVG drawing no pierde compatibilidad.
- El comportamiento esta documentado y testeado.

### Fase 2. API motion-style y variants

Objetivo: que se sienta como un sistema de estados, no como directivas sueltas.

Tareas:

- Definir oficialmente la API canonica:
  - Primaria: `moveInitial`, `moveAnimate`, `moveExit`.
  - Estado reutilizable: `moveVariants`.
  - Boolean/reversible: `moveTarget`.
  - One-shot/reset: `moveTrigger`.
- Auditar `move-variants.directive.ts`.
- Mejorar variants para:
  - default transition por variant
  - transiciones por propiedad dentro de variants
  - posible `delayChildren` / `staggerChildren` si encaja con `moveStagger`
  - mejor composicion con `movePresence`
- Agregar tests de cambios de estado consecutivos y cancelacion de animacion previa.
- Documentar patrones:
  - idle/active
  - collapsed/expanded
  - loading/success
  - selected/unselected

Criterio de exito:

- Un usuario puede construir UI stateful sin escribir logica imperativa de animacion.
- Variants es la forma recomendada para estados reutilizables.

### Fase 3. Layout animation

Objetivo: acercarse a la magia de `layout` de Framer Motion, pero con constraints Angular.

Tareas:

- Auditar `move-layout.directive.ts`.
- Confirmar estrategia FLIP:
  - First
  - Last
  - Invert
  - Play
- Cubrir casos:
  - cambio de tamano
  - cambio de posicion
  - reorder de lista
  - elementos que entran/salen con presence
  - SSR/browser guards
- Crear demo fuerte de layout/reorder.
- Agregar e2e o visual smoke test.

Criterio de exito:

- Layout funciona en cambios reales de DOM Angular.
- No hay saltos visuales obvios en demos.

### Fase 4. Drag e interacciones avanzadas

Objetivo: que drag sea una feature de producto, no solo pointer movement.

Tareas:

- Auditar `move-drag.directive.ts`.
- Revisar:
  - constraints dinamicos
  - inertia/momentum
  - snap points
  - snap-to-origin
  - axis lock
  - elasticidad
  - outputs start/move/end
- Mejorar tests de limites y momentum.
- Crear demo con card draggable, snap y constraints visibles.
- Documentar diferencias entre `moveWhileTap` y `moveDrag`.

Criterio de exito:

- Drag se siente fluido, predecible y facil de configurar.

### Fase 5. Motion values y Angular signals

Objetivo: crear una capa reactiva que sea natural para Angular.

Idea:

- Algo parecido a motion values, pero construido alrededor de signals.
- Posibles APIs:
  - `moveValue(initial)`
  - `moveSpringValue(source, config)`
  - `moveTransform(source, inputRange, outputRange)`
  - helpers para scroll progress

Tareas:

- Investigar si debe vivir como funciones exportadas o directivas.
- Prototipar API pequena con tests.
- Integrar con `moveScroll` y `moveParallax`.
- Documentar ejemplos con `computed()`.

Criterio de exito:

- Se pueden derivar animaciones de valores reactivos sin escribir loops manuales.

### Fase 6. Docs y demo site

Objetivo: que alguien pueda aprender la libreria solo desde la web.

Hecho:

- Nueva pagina `src/app/pages/docs/api.page.ts`.
- Sidebar de docs enlaza API Guide, Basic Motion, Variants, SVG Icons, Drag y Scroll.
- `README.md` y `projects/movement/README.md` explican API Angular-native + WAAPI runtime.
- Home copy menciona states, presence, SVG drawing, drag, scroll y layout.
- `@angular/animations` removido como dependencia directa del workspace.

Pendiente:

- Crear paginas docs por directiva o una API Reference unica.
- Activar seccion de Presets con ejemplos reales.
- Reutilizar mejor el bloque de instalacion entre hero e install.
- Agregar selector npm/pnpm/yarn real en install docs/home.
- Mejorar ejemplos de SVG, presence, variants, drag y scroll con copy orientado a producto.
- Agregar seccion "How it works" clara: Angular directives -> WAAPI -> final styles.

Criterio de exito:

- El usuario entiende que instalar, que importar, que API usar primero y por que no necesita
  boilerplate.

### Fase 7. Calidad de producto y release

Objetivo: publicar con confianza.

Tareas:

- Anadir e2e o visual smoke tests para:
  - home
  - `/docs/api`
  - `/demos/icons`
  - `/demos/variants`
  - `/demos/drag`
  - `/demos/layout`
- Validar o eliminar `/api/generate` si no se usa.
- Subir coverage de:
  - `SmoothScrollService`
  - `WaapiPlayer`
  - `SpringPlayer`
- Crear checklist de release:
  - `pnpm test:coverage`
  - `pnpm lint`
  - `pnpm e2e`
  - `pnpm build`
  - `pnpm run pack:check`
- Revisar package exports, README de npm y changelog.

Criterio de exito:

- Antes de publicar hay confianza en runtime, docs, demos y package.

## Primera tarea recomendada para la proxima sesion

Si se quiere seguir con maximo impacto tecnico:

```text
Lee plan.md y empieza la Fase 2: audita move-variants.directive.ts y mejora variants para que
sean la API de estado recomendada. Mantén compatibilidad, agrega tests y verifica con
pnpm test:coverage y pnpm build.
```

Si se quiere seguir con maximo impacto de producto/docs:

```text
Lee plan.md y continua la Fase 6: crea una API Reference navegable para directivas y presets,
con ejemplos reales de motion-style, variants, presence, SVG, drag y scroll. Verifica con
pnpm build y pnpm e2e.
```

## Estado actual

Fecha: 2026-06-12.

Estado del repo al crear este archivo:

- `git status --short` estaba limpio antes de crear `plan.md`.
- `plan.md` es el unico archivo creado en esta tarea.

Estado tecnico actual:

- Core de per-property transitions corregido.
- Tests de transition composer y SVG drawing agregados previamente.
- Docs ya tienen `API Guide`.
- README raiz y README del paquete ya explican Angular-native API + WAAPI runtime.
- `@angular/animations` ya no esta como dependencia directa en `package.json`.

Ultimas verificaciones conocidas:

- `pnpm test:coverage` paso con 24 archivos de test y 161 tests.
- `pnpm build` paso.
- `pnpm e2e` paso con 18 tests.

Notas:

- En e2e aparecio un warning de Vite sobre `front-matter` en `optimizeDeps.include`; no rompio la
  suite, pero conviene revisarlo en Fase 7.
- La herramienta de navegador integrado no estaba expuesta en la sesion anterior, asi que no hubo
  revision visual manual dentro del browser plugin.
