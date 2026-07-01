# Decisiones UX asistidas por IA

## Alcance

La iteración del flujo del entrenador se diseñó contrastando uso real, capturas de la aplicación, referencias visuales generadas y las capacidades existentes del código. La IA se utilizó para analizar fricción, comparar alternativas, estructurar decisiones y asistir en implementación y pruebas.

No se añadieron agenda, planificación, reservas, fotografías, notificaciones ni prescripción automática de entrenamientos.

## Dashboard operativo

### Problema

El dashboard inicial repetía búsquedas y acciones, mostraba métricas administrativas y utilizaba cards con el mismo peso visual.

### Decisión

Priorizar una única acción: iniciar una sesión o continuar la activa. La actividad del día, clientes recientes y entrenamientos completados ocupan niveles secundarios. Una sesión activa muestra duración, ejercicios y series, y avisa al superar tres horas.

### Justificación

El entrenador identifica inmediatamente qué debe hacer sin interpretar un panel administrativo.

## Selección de cliente

### Problema

La introducción ocupaba demasiado espacio antes de mostrar clientes y buscador.

### Decisión

Compactar la cabecera, mantener el buscador visible y hacer clicable toda la fila. La confirmación presenta identidad, datos físicos disponibles, notas y el efecto de iniciar la sesión.

### Justificación

Reduce scroll y evita comenzar con el cliente equivocado sin añadir pasos innecesarios.

## Sesión activa

### Problema

Finalizar podía dominar demasiado pronto y las confirmaciones destructivas dependían del diálogo nativo del navegador.

### Decisión

Mantener `Añadir ejercicio` en las acciones sticky. `Finalizar` aparece cuando existen series; una sesión vacía ofrece descarte secundario. Eliminar series y descartar sesiones utilizan diálogos accesibles propios.

### Justificación

La interfaz invita a registrar trabajo antes de cerrar la sesión y comunica mejor las consecuencias destructivas.

## Registro de series

### Problema

El término `marca` y el campo fecha hacían que una serie pareciera un registro histórico administrativo.

### Decisión

Usar `Nueva serie` durante una sesión, ocultar la fecha y copiar números y variantes de la serie anterior. Las notas no se copian.

### Justificación

Varias series consecutivas suelen compartir estructura. El prellenado reduce pulsaciones sin reutilizar observaciones que pueden ser específicas.

## Theming multi-tenant

### Problema

El color primario estaba disponible, pero faltaban tokens de contraste, bordes fuertes y estados semánticos explícitos.

### Decisión

Mantener una base neutral y derivar CTA, foco y glow desde el tenant. El texto de contraste se calcula automáticamente y éxito, aviso y peligro permanecen independientes.

### Justificación

Cada centro obtiene identidad propia sin comprometer legibilidad ni coherencia de producto.
