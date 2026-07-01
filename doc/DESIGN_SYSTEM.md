# Sistema visual de MyWorkoutBox

## Principios

MyWorkoutBox utiliza una base neutra compartida y un acento configurable por tenant. El color del centro identifica acciones, selección y foco, pero no sustituye los colores semánticos de éxito, aviso o peligro.

La interfaz del entrenador prioriza:

- Jerarquía operativa antes que decoración.
- Targets táctiles de al menos 44 px.
- Superficies diferenciadas sin convertir cada dato en una card.
- Experiencia oscura consistente con identidad de producto fuerte.
- Composición específica para móvil y escritorio.

## Tokens

Los tokens viven en `frontend/src/index.css` y se exponen a Tailwind mediante `tailwind.config.ts`.

### Marca dinámica

- `--color-primary`
- `--color-primary-hover`
- `--color-primary-soft`
- `--color-primary-contrast`

`ThemeProvider` obtiene los tres primeros valores del tenant y calcula automáticamente un color de contraste para el contenido de los CTA.

### Base neutral

- `--color-background`
- `--color-surface`
- `--color-elevated`
- `--color-border`
- `--color-border-strong`
- `--color-text-primary`
- `--color-text-secondary`
- `--color-text-muted`

### Estados semánticos

- `--color-success`
- `--color-warning`
- `--color-danger`

Estos estados no cambian con el tenant.

## Uso del color de tenant

El color primario se reserva para:

- CTA principal.
- Foco y selección.
- Navegación activa.
- Iconos destacados.
- Bordes y glow sutil de la acción principal.
- Estados no semánticos como una sesión en curso.

No debe aplicarse al fondo completo, texto general ni estados destructivos.

## Componentes operativos

- `Button`: acción primaria, secundaria, ghost o destructiva.
- `Panel`: superficie contenida para información relacionada.
- `ConfirmDialog`: confirmación accesible para acciones destructivas.
- `EmptyState`: ausencia de datos con explicación breve.
- `ThemeToggle`: indicador de modo oscuro fijo.

Los componentes específicos del entrenador permanecen cerca de su feature o página hasta que exista reutilización real.
