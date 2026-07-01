# Contexto de diseno: flujo del entrenador

## 1. Producto

MyWorkoutBox es una aplicacion para centros de entrenamiento y entrenadores personales. Permite gestionar clientes, registrar entrenamientos y conservar un historial estructurado de ejercicios, series y marcas de rendimiento.

El producto no pretende sustituir una aplicacion de planificacion deportiva. Su valor principal es facilitar el trabajo que sucede durante una sesion real: consultar rapidamente la informacion de un cliente, iniciar un entrenamiento y registrar lo realizado sin interrumpir la dinamica entre entrenador y deportista.

La aplicacion es multi-tenant. Cada centro puede tener su propia identidad visual, nombre y color principal.

## 2. Usuario principal

El flujo esta dirigido a un entrenador que:

- Trabaja presencialmente con varios clientes.
- Utiliza el movil mientras dirige la sesion.
- Necesita operar con una sola mano y dedicar poca atencion a la pantalla.
- Registra ejercicios y varias series conforme se realizan.
- Adapta el entrenamiento al tiempo disponible y al estado del cliente.
- Consulta marcas anteriores para decidir cargas, repeticiones o progresiones.
- Puede utilizar tambien un ordenador para revisar informacion con mayor amplitud.

El entrenador no suele planificar una rutina cerrada desde la aplicacion. Primero inicia una sesion con un cliente y despues incorpora los ejercicios utilizados. Cada nueva ronda o serie se registra dentro del ejercicio correspondiente.

## 3. Objetivo del flujo

El flujo debe permitir completar esta secuencia con la minima friccion:

```text
Entrar en la aplicacion
    -> comprobar si existe una sesion activa
    -> seleccionar un cliente
    -> consultar su contexto relevante
    -> iniciar el entrenamiento
    -> anadir ejercicios segun se realizan
    -> registrar una o varias series por ejercicio
    -> corregir o eliminar registros si es necesario
    -> finalizar la sesion
    -> conservar la sesion y las marcas en el historial
```

La interfaz debe transmitir velocidad, control y confianza. Registrar una serie debe sentirse como una accion operativa breve, no como completar un formulario administrativo.

## 4. Preguntas que debe responder la interfaz

### Al entrar

- ¿Hay un entrenamiento en curso?
- ¿Con que cliente estoy trabajando?
- ¿Cuanto tiempo lleva activa la sesion?
- ¿Que necesito hacer ahora?
- ¿Que actividad he registrado hoy?

### Antes de entrenar

- ¿Con quien voy a entrenar?
- ¿Es el cliente correcto?
- ¿Hay observaciones relevantes sobre el cliente?
- ¿Cuales son sus ultimas marcas y mejores registros?

### Durante el entrenamiento

- ¿Que ejercicios ya hemos realizado?
- ¿Cuantas series tiene cada ejercicio?
- ¿Que valores se registraron en la ultima serie?
- ¿Como anado otra serie rapidamente?
- ¿Como incorporo un ejercicio nuevo?
- ¿Como corrijo un dato sin perder el contexto?
- ¿Como finalizo o descarto la sesion?

### Despues del entrenamiento

- ¿Se ha guardado correctamente?
- ¿Que ejercicios y series quedaron registrados?
- ¿Como se compara el resultado con marcas anteriores?

## 5. Flujo funcional actual

### Inicio del entrenador

El dashboard prioriza acciones operativas:

- Saludo y contexto del centro.
- Sesion activa, si existe.
- Accion para iniciar un nuevo entrenamiento cuando no hay otra sesion activa.
- Resumen de la actividad del dia: sesiones, ejercicios y series.
- Acceso a clientes utilizados recientemente.
- Actividad de entrenamientos completados.

No se necesita un buscador de clientes en el dashboard. La seleccion y busqueda se realiza al iniciar un nuevo entrenamiento.

### Nueva sesion

El entrenador puede:

- Buscar clientes activos por nombre.
- Consultar clientes recientes.
- Seleccionar un cliente.
- Confirmar la seleccion antes de crear la sesion.
- Volver a una sesion activa si ya existe una.

### Ficha del cliente

La ficha presenta el contexto disponible antes de entrenar:

- Nombre e iniciales.
- Estado del cliente.
- Edad y datos fisicos disponibles.
- Notas u observaciones.
- Sesiones anteriores.
- Ejercicios evaluables.
- Ultima marca y mejor marca por ejercicio.
- Evolucion reciente basada en registros reales.
- Accion para iniciar o continuar un entrenamiento.

No existen fotografias de clientes.

### Sesion activa

La sesion contiene:

- Cliente y entrenador.
- Cronometro desde el inicio.
- Notas de la sesion, cuando existan.
- Ejercicios anadidos durante el entrenamiento.
- Series registradas dentro de cada ejercicio.
- Acciones para anadir, editar y eliminar series.
- Accion para incorporar otro ejercicio.
- Acciones para finalizar o descartar la sesion.

Solo puede existir una sesion activa por entrenador.

### Cuenta

El entrenador puede:

- Actualizar nombre y email.
- Cambiar contrasena.
- Cerrar sesion.

Estas acciones no necesitan aparecer permanentemente en la cabecera movil.

## 6. Datos reales disponibles

Las propuestas deben trabajar con estos datos y no asumir otros que todavia no existen.

### Cliente

- Nombre y apellidos.
- Fecha de nacimiento y edad calculada.
- Altura y peso, si estan informados.
- Estado activo o inactivo.
- Notas generales.
- Historial de entrenamientos.

### Entrenamiento

- Cliente.
- Entrenador.
- Estado activo o completado.
- Hora de inicio y finalizacion.
- Duracion calculada.
- Notas.
- Ejercicios realizados.
- Numero de series.

### Ejercicio y rendimiento

- Nombre y categoria del ejercicio.
- Campos de medicion configurables segun el ejercicio.
- Registros de cada serie.
- Ultimo registro.
- Mejor registro.
- Hasta seis registros recientes para representar tendencia.

Los ejercicios no comparten necesariamente las mismas metricas. Un ejercicio puede registrar peso y repeticiones, mientras otro puede utilizar tiempo, distancia u otros campos configurados.

## 7. Funcionalidades que no deben inventarse

Actualmente no existen:

- Agenda o sesiones planificadas.
- Rutinas predefinidas obligatorias.
- Calendario de reservas.
- Mensajeria.
- Notificaciones.
- Fotografias de clientes.
- Modelo estructurado de lesiones o historial medico.
- Wearables o telemetria en tiempo real.
- Pagos y suscripciones dentro del flujo del entrenador.
- Inteligencia artificial que prescriba entrenamientos.

Estos elementos pueden plantearse como evolucion futura, pero no deben aparecer como funcionalidades disponibles en el diseno actual.

## 8. Prioridades de experiencia

1. Mobile-first, sin convertir el escritorio en una version movil ampliada.
2. Acciones principales visibles y faciles de alcanzar con el pulgar.
3. Targets tactiles de al menos 44 px.
4. Formularios rapidos y compatibles con el teclado movil.
5. Jerarquia clara entre sesion activa, siguiente accion y contexto secundario.
6. Evitar datos administrativos sin valor inmediato para el entrenador.
7. Evitar duplicar acciones o informacion en dashboard, cabecera y navegacion.
8. Mantener contexto al anadir o editar series.
9. Confirmar acciones destructivas o irreversibles.
10. Mostrar estados de carga, vacio, error y exito.

## 9. Direccion visual deseada

La interfaz debe ser atractiva y comercial, pero seguir funcionando como una herramienta profesional de uso repetido.

Se busca:

- Sensacion de producto deportivo moderno y especializado.
- Apariencia tecnica, precisa y energica.
- Jerarquia visual fuerte sin saturacion.
- Diferentes niveles de superficie para evitar una sucesion de cards identicas.
- Datos faciles de escanear durante una sesion.
- Uso controlado del color principal para acciones y estados importantes.
- Tipografia clara y con personalidad.
- Transiciones breves que aporten respuesta, no decoracion.
- Buen resultado en tema oscuro.
- Adaptacion al branding dinamico de cada centro.

Se debe evitar:

- Apariencia de plantilla generica de dashboard SaaS.
- Exceso de cards, bordes, sombras o indicadores decorativos.
- Graficos sin datos o sin utilidad para tomar decisiones.
- Grandes bloques introductorios que consuman el primer viewport.
- Acciones flotantes duplicadas por botones visibles en el contenido.
- Navegacion o controles administrativos dentro del flujo de entrenamiento.

## 10. Navegacion

### Movil

La navegacion persistente del entrenador contiene solo:

- Inicio.
- Cuenta.

El acceso a una sesion se realiza desde el CTA del dashboard o desde el bloque de sesion activa. No se necesita una tercera accion central duplicada.

La cabecera movil muestra:

- Identidad compacta de MyWorkoutBox o del centro.
- Indicacion de modo entrenador.
- Nombre del centro.
- Avatar como acceso a Cuenta.

### Escritorio

Puede utilizar sidebar y una composicion de dos columnas. El contenido principal debe aprovechar el espacio disponible sin estirarse hasta dificultar la lectura.

## 11. Estados importantes que deben disenarse

- Entrenador sin sesiones completadas.
- Entrenador sin sesion activa.
- Entrenador con sesion activa vacia.
- Sesion activa con varios ejercicios y series.
- Sesion activa anormalmente larga u olvidada.
- Cliente sin marcas previas.
- Cliente con historial suficiente para mostrar tendencia.
- Busqueda sin resultados.
- Error de carga o guardado.
- Guardado en curso.
- Confirmacion de finalizacion o descarte.

## 12. Escenarios de referencia

### Escenario A: comenzar desde cero

1. El entrenador entra y no tiene sesion activa.
2. Pulsa `Nuevo entrenamiento`.
3. Busca y selecciona a Alex Molina.
4. Confirma el inicio.
5. Anade `Dominadas`.
6. Registra tres series.
7. Anade `Peso muerto rumano`.
8. Registra varias series.
9. Finaliza la sesion.

### Escenario B: continuar una sesion

1. El entrenador vuelve a la aplicacion.
2. El dashboard muestra la sesion activa, cliente, duracion, ejercicios y series.
3. Pulsa `Continuar entrenamiento`.
4. Recupera exactamente el estado anterior.

### Escenario C: consultar contexto

1. El entrenador abre uno de sus clientes recientes.
2. Revisa notas y marcas de referencia.
3. Consulta la evolucion de un ejercicio.
4. Inicia un entrenamiento desde la ficha.

## 13. Criterios de exito del rediseño

Una propuesta funciona si:

- El entrenador identifica la accion principal en menos de dos segundos.
- Iniciar o recuperar una sesion requiere pocos pasos y ninguna decision ambigua.
- Registrar series es mas rapido que anotarlas temporalmente fuera de la aplicacion.
- La sesion activa domina visualmente cuando existe.
- La informacion secundaria no compite con la accion actual.
- Mobile permite operar comodamente durante el entrenamiento.
- Desktop aprovecha el ancho mediante una composicion especifica.
- La aplicacion parece un producto comercial reconocible y no una demo tecnica.
- El diseno puede implementarse con React, TypeScript, Tailwind y Lucide sin alterar los contratos funcionales actuales.

## 14. Peticion para la herramienta de diseno

A partir de este contexto, proponer una direccion visual y una experiencia completa para el flujo del entrenador.

La propuesta debe:

- Resolver primero la jerarquia y el flujo, y despues la estetica.
- Cubrir mobile y desktop.
- Mostrar los estados con y sin sesion activa.
- Utilizar exclusivamente funcionalidades y datos descritos en este documento.
- Explicar las decisiones que reduzcan friccion durante un entrenamiento real.
- Entregar tokens, componentes, layout, comportamiento responsive y estados interactivos con suficiente precision para implementarlos en React, TypeScript y Tailwind.
