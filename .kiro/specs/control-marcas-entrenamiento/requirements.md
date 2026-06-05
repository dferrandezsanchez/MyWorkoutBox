# Requirements Document

## Introduction

Aplicación web interna para centros de entrenamiento personal y gimnasios boutique. La herramienta centraliza la gestión de clientes y el registro de marcas físicas en ejercicios de referencia, reemplazando hojas de cálculo, notas sueltas y comunicaciones informales. El sistema es de uso exclusivo para el equipo de entrenadores y administradores del centro. La arquitectura backend-API separada del frontend quedará preparada para incorporar una app nativa Android/iOS y acceso directo de clientes en fases futuras.

El núcleo funcional del MVP es: **Cliente → Ejercicio → Marca actual → Histórico de progresión**.

---

## Glossary

- **System**: La aplicación web interna del centro de entrenamiento.
- **Admin**: Usuario autenticado con rol ADMIN. Gestiona clientes, ejercicios y entrenadores.
- **Trainer**: Usuario autenticado con rol TRAINER. Consulta perfiles y registra marcas.
- **User**: Cualquier usuario autenticado del sistema (Admin o Trainer).
- **Client**: Persona física que entrena en el centro. No accede al sistema en el MVP.
- **Exercise**: Ejercicio de referencia del centro (p. ej. dominadas, press banca, peso muerto).
- **PerformanceRecord**: Registro individual de una marca de un cliente en un ejercicio, incluyendo valor, unidad, entrenador, fecha y notas opcionales.
- **Current_Mark**: El PerformanceRecord más reciente por fecha para una combinación cliente/ejercicio.
- **History**: Conjunto ordenado de todos los PerformanceRecords de un cliente para un ejercicio, de más reciente a más antiguo.
- **Auth_Service**: Componente responsable de autenticación y gestión de sesiones.
- **Client_Service**: Componente responsable de la gestión de datos de clientes.
- **Exercise_Service**: Componente responsable de la gestión del catálogo de ejercicios.
- **Performance_Service**: Componente responsable del registro y consulta de marcas.
- **API**: Interfaz REST que expone el backend al frontend y a clientes futuros.

---

## Requirements

### Requirement 1: Autenticación de usuarios

**User Story:** Como entrenador o administrador, quiero iniciar sesión con email y contraseña, para acceder de forma segura a la aplicación y que mis acciones queden identificadas.

#### Acceptance Criteria

1. WHEN un User envía email y contraseña válidos, THE Auth_Service SHALL autenticar al User y devolver un token de sesión.
2. WHEN un User envía credenciales incorrectas, THE Auth_Service SHALL devolver un mensaje de error de autenticación sin revelar cuál campo es incorrecto.
3. WHEN un User no autenticado intenta acceder a cualquier ruta protegida, THE System SHALL redirigir al User a la pantalla de login.
4. WHEN un User autenticado solicita cerrar sesión, THE Auth_Service SHALL invalidar el token de sesión activo.
5. THE Auth_Service SHALL asociar cada sesión activa al rol del User (ADMIN o TRAINER) para aplicar permisos en todas las operaciones subsiguientes.
6. IF el token de sesión ha expirado, THEN THE Auth_Service SHALL requerir que el User vuelva a autenticarse antes de procesar cualquier solicitud.

---

### Requirement 2: Búsqueda y listado de clientes

**User Story:** Como entrenador, quiero buscar clientes por nombre y apellidos y ver el listado de clientes activos, para encontrar rápidamente el perfil que necesito consultar o actualizar.

#### Acceptance Criteria

1. THE System SHALL mostrar un listado de todos los Clients con estado ACTIVE al cargar el dashboard.
2. WHEN un User introduce texto en el buscador, THE System SHALL filtrar el listado de Clients mostrando únicamente los que contengan el texto introducido en el nombre o apellidos, sin distinguir mayúsculas de minúsculas.
3. WHEN el buscador está vacío, THE System SHALL mostrar el listado completo de Clients activos.
4. WHEN un User selecciona un Client del listado, THE System SHALL navegar al perfil de ese Client.
5. WHERE el User tiene rol ADMIN, THE System SHALL mostrar un botón de creación de Client en el dashboard.

---

### Requirement 3: Perfil del cliente

**User Story:** Como entrenador, quiero ver el perfil completo de un cliente con sus datos básicos y las marcas actuales en cada ejercicio, para tener una visión rápida de su estado físico y progresión.

#### Acceptance Criteria

1. WHEN un User accede al perfil de un Client, THE System SHALL mostrar el nombre, apellidos, fecha de nacimiento, edad calculada, altura, peso, porcentaje de grasa corporal, observaciones y estado del Client.
2. WHEN un Client tiene una foto registrada, THE System SHALL mostrar la foto del Client en su perfil.
3. IF un Client no tiene foto registrada, THEN THE System SHALL mostrar un avatar genérico en lugar de la foto.
4. WHEN un User accede al perfil de un Client, THE System SHALL mostrar la lista de Exercises activos del centro junto con la Current_Mark del Client en cada uno.
5. IF un Client no tiene ningún PerformanceRecord para un Exercise, THEN THE System SHALL indicar que no existe marca registrada para ese Exercise.
6. WHEN un User selecciona un Exercise en el perfil de un Client, THE System SHALL navegar al histórico de ese Client para ese Exercise.

---

### Requirement 4: Registro de marcas

**User Story:** Como entrenador, quiero registrar una nueva marca de un cliente en un ejercicio de forma rápida, para mantener actualizado su progreso sin interrumpir el ritmo del entrenamiento.

#### Acceptance Criteria

1. WHEN un Trainer selecciona un Exercise en el perfil de un Client y confirma la creación de una nueva marca, THE Performance_Service SHALL crear un nuevo PerformanceRecord con los campos: clientId, exerciseId, trainerId, valor principal, unidad, fecha, y opcionalmente repeticiones, peso, duración, distancia y notas.
2. WHEN un nuevo PerformanceRecord es creado, THE Performance_Service SHALL establecer ese registro como la Current_Mark del Client para ese Exercise.
3. WHEN un nuevo PerformanceRecord es creado, THE Performance_Service SHALL preservar todos los PerformanceRecords anteriores del Client para ese Exercise en el History sin modificarlos.
4. THE Performance_Service SHALL aceptar los siguientes tipos de unidad para el valor principal: kg, repeticiones, segundos, minutos, metros, calorías, y texto libre.
5. THE Performance_Service SHALL asociar automáticamente el trainerId del User autenticado al PerformanceRecord en el momento de su creación.
6. IF el valor principal o la unidad no son proporcionados al crear un PerformanceRecord, THEN THE Performance_Service SHALL rechazar la solicitud y devolver un mensaje de error indicando los campos requeridos.
7. WHEN un PerformanceRecord es creado exitosamente, THE System SHALL mostrar la nueva Current_Mark en el perfil del Client para ese Exercise.

---

### Requirement 5: Histórico de progresión por ejercicio

**User Story:** Como entrenador, quiero consultar el historial completo de marcas de un cliente en un ejercicio concreto, para analizar su evolución y tomar decisiones de programación.

#### Acceptance Criteria

1. WHEN un User accede al histórico de un Client para un Exercise, THE Performance_Service SHALL devolver todos los PerformanceRecords del Client para ese Exercise ordenados de más reciente a más antiguo por fecha.
2. THE System SHALL mostrar para cada PerformanceRecord del History: fecha, valor principal, unidad, nombre del Trainer que registró la marca, y nota si existe.
3. WHEN un Client tiene un único PerformanceRecord para un Exercise, THE System SHALL mostrarlo en el History con los mismos campos que en el caso general.
4. IF un Client no tiene ningún PerformanceRecord para un Exercise, THEN THE System SHALL mostrar el History vacío con un mensaje indicando que no hay marcas registradas.

---

### Requirement 6: Gestión de clientes (solo Admin)

**User Story:** Como administrador, quiero crear, editar y desactivar clientes, para mantener actualizado el directorio del centro sin perder el histórico de marcas.

#### Acceptance Criteria

1. WHERE el User tiene rol ADMIN, THE Client_Service SHALL permitir crear un nuevo Client con los campos: firstName, lastName, birthDate, altura, peso, porcentaje de grasa corporal, observaciones y foto opcional.
2. WHERE el User tiene rol ADMIN, THE Client_Service SHALL permitir editar todos los campos de un Client existente.
3. WHERE el User tiene rol ADMIN, THE Client_Service SHALL permitir cambiar el estado de un Client de ACTIVE a INACTIVE.
4. WHEN el estado de un Client cambia a INACTIVE, THE Performance_Service SHALL conservar todos los PerformanceRecords del Client sin modificaciones.
5. IF un User con rol TRAINER intenta crear, editar o cambiar el estado de un Client, THEN THE System SHALL rechazar la solicitud y devolver un mensaje de error de permisos insuficientes.
6. THE Client_Service SHALL no borrar físicamente ningún Client del sistema.
7. WHERE el User tiene rol ADMIN, THE Client_Service SHALL permitir subir y actualizar la foto de un Client.

---

### Requirement 7: Gestión de ejercicios (solo Admin)

**User Story:** Como administrador, quiero crear y editar los ejercicios de referencia del centro, para mantener actualizado el catálogo que usan todos los entrenadores.

#### Acceptance Criteria

1. WHERE el User tiene rol ADMIN, THE Exercise_Service SHALL permitir crear un nuevo Exercise con los campos: nombre, categoría, unidad principal, descripción opcional y estado (ACTIVE o INACTIVE).
2. WHERE el User tiene rol ADMIN, THE Exercise_Service SHALL permitir editar todos los campos de un Exercise existente.
3. WHERE el User tiene rol ADMIN, THE Exercise_Service SHALL permitir cambiar el estado de un Exercise de ACTIVE a INACTIVE.
4. WHEN el estado de un Exercise cambia a INACTIVE, THE Performance_Service SHALL conservar todos los PerformanceRecords asociados a ese Exercise sin modificaciones.
5. IF un User con rol TRAINER intenta crear o editar un Exercise, THEN THE System SHALL rechazar la solicitud y devolver un mensaje de error de permisos insuficientes.
6. THE Exercise_Service SHALL no borrar físicamente ningún Exercise del sistema.
7. WHEN un Exercise tiene estado INACTIVE, THE System SHALL excluirlo del listado de Exercises mostrado en el perfil del Client y en el flujo de registro de marcas.

---

### Requirement 8: Control de acceso y permisos

**User Story:** Como administrador, quiero que el sistema diferencie claramente los permisos entre administradores y entrenadores, para garantizar que solo las personas autorizadas pueden realizar operaciones sensibles.

#### Acceptance Criteria

1. THE System SHALL requerir autenticación válida para acceder a cualquier dato o funcionalidad de la aplicación.
2. THE System SHALL aplicar las restricciones de rol en el servidor, sin depender únicamente de controles en el cliente.
3. WHEN un User autenticado realiza una solicitud, THE System SHALL verificar el rol del User antes de ejecutar la operación.
4. IF un User con rol TRAINER intenta acceder a una operación reservada para ADMIN, THEN THE System SHALL devolver un código de error de autorización sin ejecutar la operación.
5. THE System SHALL registrar en cada PerformanceRecord el identificador del Trainer autenticado que lo creó, de forma que el Admin pueda consultarlo.

---

### Requirement 9: Interfaz responsive optimizada para móvil

**User Story:** Como entrenador, quiero usar la aplicación desde mi móvil durante el entrenamiento, para registrar marcas en tiempo real sin necesidad de un ordenador.

#### Acceptance Criteria

1. THE System SHALL renderizar correctamente en dispositivos móviles con pantallas de 320px de ancho o más.
2. THE System SHALL renderizar correctamente en tablets y ordenadores de escritorio.
3. THE System SHALL permitir completar el flujo de registro de una nueva marca (buscar cliente → seleccionar ejercicio → introducir valores → guardar) en no más de 5 interacciones desde un dispositivo móvil.
4. THE System SHALL presentar los elementos interactivos (botones, campos de formulario) con un área táctil mínima de 44x44 píxeles en dispositivos móviles.

---

### Requirement 11: Cumplimiento RGPD / LOPD

**User Story:** Como administrador del centro, quiero que el sistema gestione los datos personales de los clientes conforme al RGPD y la LOPDGDD, para cumplir con la normativa vigente de protección de datos y evitar sanciones.

#### Acceptance Criteria

1. THE System SHALL permitir al Admin exportar todos los datos personales de un Client en formato legible (JSON o CSV), en respuesta a una solicitud de portabilidad (Art. 20 RGPD).
2. THE System SHALL permitir al Admin anonimizar los datos personales de un Client (nombre, apellidos, fecha de nacimiento, foto, observaciones) preservando el histórico de PerformanceRecords disociado de la identidad, en respuesta a una solicitud de supresión (Art. 17 RGPD).
3. THE System SHALL registrar en un log de auditoría cada acceso, creación o modificación de datos personales de Clients, incluyendo: userId del User que realizó la acción, tipo de acción, timestamp y clientId afectado.
4. THE Client_Service SHALL almacenar los datos de salud del Client (altura, peso, porcentaje de grasa corporal) bajo el principio de minimización: solo se almacenarán los campos que el centro pueda justificar como necesarios para la prestación del servicio.
5. IF un Client solicita la supresión de sus datos, THEN THE System SHALL anonimizar los campos de identidad del Client (firstName, lastName, birthDate, photoUrl, notes) sustituyéndolos por valores neutros, manteniendo los PerformanceRecords con clientId intacto para no corromper estadísticas de uso interno.
6. THE System SHALL requerir consentimiento explícito registrado antes de almacenar la foto de un Client, y SHALL permitir eliminar la foto de forma independiente al resto de datos.

---

### Requirement 10: Preparación para extensibilidad futura

**User Story:** Como administrador técnico, quiero que la arquitectura del sistema esté preparada para incorporar una app nativa y acceso de clientes en el futuro, para no tener que reescribir el backend cuando se evolucione el producto.

#### Acceptance Criteria

1. THE API SHALL exponer todos los datos y operaciones del sistema a través de endpoints REST versionados, sin acoplar la lógica de negocio al frontend web.
2. THE API SHALL autenticar las solicitudes mediante tokens estándar (JWT o equivalente) que puedan ser consumidos por clientes nativos móviles en el futuro.
3. THE System SHALL mantener el frontend web y el backend API como componentes desplegables de forma independiente.
