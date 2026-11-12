# Sistema visual de STELIOS

## Principios

STELIOS tiene una única identidad visual, compartida con la web comercial. Los centros (tenants) aparecen como contexto (su nombre), nunca como marca alternativa: no hay colores, logos ni nombres de aplicación configurables por centro.

La interfaz prioriza:

- Jerarquía operativa antes que decoración: la acción principal de cada pantalla se ve a la primera.
- Uso con el móvil en la mano: targets táctiles de al menos 44 px y acciones principales al alcance del pulgar.
- Superficies oscuras sólidas con bordes finos, sin convertir cada dato en una card.
- Cifras grandes y tabulares para marcas, series y métricas.
- Composición específica para móvil y escritorio.

## Identidad

- **Logo:** `BrandLogo` (símbolo + wordmark) y `BrandMark` (solo símbolo), en `shared/components/BrandLogo.tsx`. Usa siempre estos componentes, nunca iniciales ni texto suelto como logo.
- **Marca y textos:** `BRAND` en `shared/config/branding.ts` (nombre, claim «Entrena. Registra. Evoluciona.», descripción).
- **Tipografía:** Space Grotesk (`font-display`) para títulos, cifras y etiquetas; Manrope (`font-sans`, por defecto) para texto. Ambas van alojadas en la app mediante `@fontsource-variable`, sin peticiones a terceros.

## Tokens

Los tokens viven en `frontend/src/index.css` y se exponen a Tailwind en `tailwind.config.ts`. Son fijos: no se sobrescriben en tiempo de ejecución.

| Token | Valor | Uso |
|---|---|---|
| `background` | `#0B0F14` | Fondo de la app |
| `surface` | `#0F161F` | Paneles y cards |
| `elevated` | `#151D28` | Elementos sobre un panel |
| `primary` | `#14B8A6` | CTA, foco, selección, navegación activa |
| `primary-hover` | `#2DD4BF` | Hover del CTA |
| `primary-soft` | `#5EEAD4` | Texto e iconos de acento sobre fondo oscuro |
| `primary-contrast` | `#0B0F14` | Texto sobre teal (nunca blanco) |
| `text-primary` / `secondary` / `muted` | slate claro → medio | Jerarquía de texto |
| `success` / `warning` / `danger` | verde / ámbar / rojo | Estados semánticos |

Bordes: `border-white/[0.08]` en paneles, `border-white/[0.11]` en botones secundarios y `border-border` en inputs.

## Patrones

- **Eyebrow:** clase `.eyebrow` (Space Grotesk, 12 px, mayúsculas, tracking amplio, teal claro) sobre títulos de sección. `PageHeader` la acompaña de una línea corta.
- **Títulos:** `h1`–`h3` heredan `font-display` y `tracking-tight`. Títulos de página en `text-3xl`/`sm:text-[2.75rem]`, `font-bold`.
- **Cifras:** `font-display font-bold tabular` (clase `.tabular`) para pesos, repeticiones, tiempos y contadores.
- **Botones:** píldora (`rounded-full`). `primary`: teal con texto oscuro. `secondary`: borde translúcido sin relleno. `ghost`: solo texto. `danger`: rojo translúcido. Feedback `active:scale-[0.98]`.
- **Paneles:** `Panel` = `rounded-2xl border-white/[0.08] bg-surface`, sin sombras ni blur. Para listas, filas separadas por `divide-white/[0.06]` dentro de un único panel.
- **Iconos destacados:** círculo `rounded-full` con `border-primary/25 bg-primary/10 text-primary-soft`. Los iconos de categoría no usan colores arbitrarios (violeta, azul…); como mucho teal y los colores semánticos.
- **Estado en curso:** punto teal con `animate-ping` (desactivado con `motion-reduce`) y eyebrow «En curso».
- **Movimiento:** transiciones de 150 ms `ease-out` sobre color y borde; nada de desplazamientos decorativos en hover.

## Móvil primero

La app se usa sobre todo con el móvil en la mano, durante el entrenamiento. Se diseña primero a 375 px y después se escala. Reglas basadas en las guías UX de `ui-ux-pro-max` (Apple HIG y Material):

- **Navegación inferior:** como máximo 5 destinos de primer nivel, con icono y texto de al menos 12 px. El entrenador tiene 3 (Inicio · **Entrenar** · Clientes) con la acción de entrenar destacada en el centro, en la zona del pulgar; la cuenta está en el avatar de la cabecera.
- **Acción principal:** una por pantalla. En las listas de administración pasa a ser un botón flotante extendido encima de la barra inferior (`AdminManagementHeader`); desde `lg` vuelve a la cabecera.
- **Acciones de fila:** como mucho dos botones visibles (abrir/editar y «Más acciones»). El resto va en una hoja inferior con acciones con texto (`RowActionsMenu`), y las destructivas en rojo.
- **Hojas inferiores:** `Dialog` y `ConfirmDialog` entran desde abajo en móvil (desde el centro en escritorio), con asa, cierre visible, Escape y área segura inferior.
- **Prioridad de contenido:** en móvil los datos van primero; lo decorativo (por ejemplo el *hero* del dashboard de administración) se oculta por debajo de `sm`. Las listas largas se pintan como filas compactas, no como tarjetas altas.
- **Áreas seguras:** `viewport-fit=cover`, `.pt-safe` en la cabecera, `.pb-safe` en barras y hojas, y `.pb-mobile-nav` en el contenido para que la barra inferior nunca tape nada. Alturas con `dvh`.
- **Táctil:** objetivos de al menos 44 px con 8 px de separación, `touch-action: manipulation` y feedback `active:scale` al pulsar.
- **Accesibilidad:** enlace «Saltar al contenido», `aria-current` en la navegación activa y `prefers-reduced-motion` respetado de forma global.
- **Instalable:** `manifest.webmanifest` y metadatos para añadir STELIOS a la pantalla de inicio.

## Uso del color primario

El teal se reserva para:

- CTA principal (uno por vista).
- Foco y selección.
- Navegación activa.
- Iconos destacados y acentos de texto (`primary-soft`).
- Estados no semánticos como una sesión en curso.

No debe aplicarse al fondo completo, al texto general ni a estados destructivos.

## Componentes operativos

Viven en `shared/components/ui.tsx`:

- `Button`, `TextInput`, `Panel`, `SectionHeader`, `PageHeader`.
- `MetricCard`, `MetricChip`, `ActionTile`, `StatusBadge`.
- `EmptyState`, `Dialog`, `ConfirmDialog`.

Los componentes específicos de una pantalla permanecen cerca de su feature o página hasta que exista reutilización real.
