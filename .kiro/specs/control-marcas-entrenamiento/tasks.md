# Implementation Plan: Control de Marcas de Entrenamiento

## Overview

Plan de implementación incremental del sistema de control de marcas para centros de entrenamiento. Se sigue el orden natural del stack: infraestructura base → backend (modelos, auth, CRUD, performances, RGPD) → frontend (layout, páginas, formularios). Cada bloque de código queda integrado antes de pasar al siguiente.

Stack: **React 18 + TypeScript + Vite + Tailwind CSS + React Query v5 + React Router v6** (frontend) y **Node.js + Express + TypeScript + Prisma + PostgreSQL** (backend). Tests con **Vitest + Supertest + fast-check**.

---

## Tasks

- [x] 1. Configurar infraestructura base del monorepo
  - Crear estructura de directorios `backend/` y `frontend/` en la raíz del proyecto
  - Inicializar `backend/` con `package.json`, `tsconfig.json` (strict mode), dependencias: express, jsonwebtoken, bcrypt, prisma, @prisma/client, multer, dotenv, cors; devDependencies: vitest, supertest, fast-check, @types/*
  - Inicializar `frontend/` con Vite + React + TypeScript template, instalar: tailwindcss, @tanstack/react-query, react-router-dom, axios; devDependencies: vitest, @testing-library/react, @testing-library/user-event
  - Crear `backend/src/index.ts` con servidor Express básico (puerto desde env, CORS, JSON body parser, ruta de health-check `GET /health`)
  - Crear `frontend/tailwind.config.ts` con los tokens de color del design system: `primary (#ED702D)`, `primaryHover (#D96424)`, `primarySoft (#F29A6A)`, `textPrimary (#808080)`, `textSecondary (#A6A6A6)`, `textMuted (#C7C7C7)`, `surface (#F5F5F5)`, `border (#DDDDDD)`
  - _Requirements: 10.1, 10.3_

- [x] 2. Definir esquema de base de datos y ejecutar migraciones iniciales
  - [x] 2.1 Crear `backend/prisma/schema.prisma` con todos los modelos del diseño
    - Modelos: `User` (id, name, email, passwordHash, role, active), `Client` (incluye `anonymizedAt`, `photoConsentAt`), `Exercise`, `PerformanceRecord` (con índice compuesto `@@index([clientId, exerciseId, date(sort: Desc)])`), `AuditLog`
    - Enums: `Role (ADMIN, TRAINER)`, `Status (ACTIVE, INACTIVE)`, `PerformanceUnit (kg, repetitions, seconds, minutes, meters, calories, text)`
    - _Requirements: 4.1, 4.4, 6.6, 7.6, 11.2, 11.3, 11.6_
  - [x] 2.2 Ejecutar migración inicial y crear script seed con un usuario ADMIN y un usuario TRAINER de prueba
    - Archivo: `backend/prisma/seed.ts`
    - _Requirements: 1.1, 6.1_

- [x] 3. Implementar capa de infraestructura backend (middleware y tipos)
  - [x] 3.1 Crear `backend/src/types/express.d.ts` extendiendo `Request` de Express con `req.user: { userId: string; role: Role }`
    - _Requirements: 8.2, 8.3_
  - [x] 3.2 Crear `backend/src/middleware/authenticate.ts`
    - Verificar header `Authorization: Bearer <token>`, validar JWT con `jsonwebtoken`, adjuntar `req.user` al request; devolver 401 si ausente o inválido/expirado
    - _Requirements: 1.3, 1.6, 8.1_
  - [x] 3.3 Crear `backend/src/middleware/authorize.ts`
    - Factory function `authorize(role: Role)` que verifica `req.user.role`; devuelve 403 si el rol no está permitido
    - _Requirements: 8.2, 8.3, 8.4_
  - [x] 3.4 Crear `backend/src/middleware/errorHandler.ts`
    - Middleware de errores global que normaliza todas las respuestas de error a `{ error: string, fields?: string[] }`
    - _Requirements: 1.2, 4.6_
  - [x] 3.5 Crear `backend/src/prisma/client.ts` con instancia singleton de `PrismaClient`
    - _Requirements: 10.1_

- [x] 4. Implementar módulo de autenticación (backend)
  - [x] 4.1 Crear `backend/src/modules/auth/auth.service.ts`
    - Función `login(email, password)`: buscar usuario por email, comparar con `bcrypt.compare`, firmar JWT con `{ sub: userId, role }` y expiración configurable; devolver `LoginResponse`
    - Función `getMe(userId)`: devolver datos públicos del usuario autenticado
    - _Requirements: 1.1, 1.2, 1.5_
  - [x] 4.2 Crear `backend/src/modules/auth/auth.router.ts`
    - `POST /auth/login` (público), `POST /auth/logout` (autenticado, invalidación client-side), `GET /auth/me` (autenticado)
    - _Requirements: 1.1, 1.4_
  - [x] 4.3 Escribir tests unitarios para auth.service
    - Test: login con credenciales válidas devuelve token con role correcto
    - Test: login con password incorrecto devuelve error genérico (no revela campo)
    - Test: login con email inexistente devuelve el mismo error genérico
    - _Requirements: 1.1, 1.2_

- [x] 5. Implementar módulo de clientes (backend)
  - [x] 5.1 Crear `backend/src/modules/clients/clients.service.ts`
    - `listClients(query?)`: devolver clientes ACTIVE filtrando por `firstName ILIKE %q%` OR `lastName ILIKE %q%` si `?q=` presente
    - `getClient(id)`: devolver cliente por ID o lanzar 404
    - `createClient(data)`: crear cliente; registrar en AuditLog
    - `updateClient(id, data)`: editar cliente; registrar en AuditLog
    - `setClientStatus(id, status)`: cambiar ACTIVE/INACTIVE; registrar en AuditLog
    - `uploadPhoto(id, file, consentAt)`: guardar archivo, actualizar `photoUrl` y `photoConsentAt`
    - _Requirements: 2.1, 2.2, 2.3, 6.1, 6.2, 6.3, 6.6, 6.7, 11.3_
  - [x] 5.2 Crear `backend/src/modules/clients/clients.router.ts`
    - `GET /clients` (Any), `POST /clients` (ADMIN), `GET /clients/:id` (Any), `PUT /clients/:id` (ADMIN), `PATCH /clients/:id/status` (ADMIN), `POST /clients/:id/photo` (ADMIN, Multer)
    - Todos con middleware `authenticate`; operaciones de escritura con `authorize('ADMIN')`
    - _Requirements: 2.1, 6.1–6.7, 8.2, 8.4_
  - [x] 5.3 Escribir property test para filtro de búsqueda (Property 1)
    - **Property 1: Filtro de búsqueda de clientes es inclusivo y case-insensitive**
    - Generar con fast-check: lista arbitraria de clientes activos + texto de búsqueda no vacío; verificar que todos los devueltos contienen el texto en nombre/apellido y ningún cliente sin coincidencia aparece
    - **Validates: Requirements 2.2, 2.3**
  - [x] 5.4 Escribir property test para control de acceso TRAINER (Property 6 — clientes)
    - **Property 6: Control de acceso — TRAINER no puede hacer operaciones de ADMIN (clientes)**
    - Generar con fast-check: payloads arbitrarios de creación/edición/cambio de estado de cliente enviados con token de rol TRAINER; verificar que la respuesta es siempre 403 y el estado de la BD no cambia
    - **Validates: Requirements 6.5, 8.2, 8.4**
  - [x] 5.5 Escribir tests de integración para módulo clientes
    - Flujo completo: login → crear cliente (ADMIN) → listar → editar → cambiar estado a INACTIVE
    - Verificar que TRAINER recibe 403 en operaciones de escritura
    - _Requirements: 6.1–6.5_

- [x] 6. Implementar módulo de ejercicios (backend)
  - [x] 6.1 Crear `backend/src/modules/exercises/exercises.service.ts`
    - `listExercises(includeInactive?)`: por defecto devuelve solo ACTIVE
    - `getExercise(id)`: devolver por ID o 404
    - `createExercise(data)`: crear ejercicio
    - `updateExercise(id, data)`: editar ejercicio
    - `setExerciseStatus(id, status)`: cambiar ACTIVE/INACTIVE
    - _Requirements: 7.1–7.6_
  - [x] 6.2 Crear `backend/src/modules/exercises/exercises.router.ts`
    - `GET /exercises` (Any), `POST /exercises` (ADMIN), `GET /exercises/:id` (Any), `PUT /exercises/:id` (ADMIN), `PATCH /exercises/:id/status` (ADMIN)
    - _Requirements: 7.1–7.5, 8.2, 8.4_
  - [x] 6.3 Escribir property test para control de acceso TRAINER (Property 6 — ejercicios)
    - **Property 6: Control de acceso — TRAINER no puede hacer operaciones de ADMIN (ejercicios)**
    - Generar con fast-check: payloads arbitrarios de creación/edición/cambio de estado de ejercicio con token TRAINER; verificar 403 y sin cambios en BD
    - **Validates: Requirements 7.5, 8.2, 8.4**
  - [x] 6.4 Escribir tests unitarios para exercises.service
    - Test: `listExercises()` sin flag devuelve solo ejercicios ACTIVE
    - Test: ejercicio INACTIVE no aparece en listado por defecto
    - _Requirements: 7.3, 7.7_

- [x] 7. Implementar módulo de marcas (backend)
  - [x] 7.1 Crear `backend/src/modules/performances/performances.service.ts`
    - `createPerformance(clientId, exerciseId, trainerId, data)`: validar `value` y `unit` requeridos, inyectar `trainerId` desde contexto (no del body), crear `PerformanceRecord`; registrar en AuditLog
    - `getHistory(clientId, exerciseId)`: devolver todos los registros del par ordenados `date DESC`
    - `getCurrentMarks(clientId)`: para cada ejercicio ACTIVE, obtener el registro más reciente (`ORDER BY date DESC LIMIT 1`)
    - `getCurrentMark(records)`: función pura extraíble para testeo — devuelve el registro con fecha más reciente dado un array
    - _Requirements: 4.1–4.7, 5.1–5.4, 7.7_
  - [x] 7.2 Crear `backend/src/modules/performances/performances.router.ts`
    - `GET /clients/:clientId/current-performances` (Any)
    - `GET /clients/:clientId/exercises/:exerciseId/performances` (Any)
    - `POST /clients/:clientId/exercises/:exerciseId/performances` (Any autenticado)
    - Inyectar `trainerId = req.user.userId` en el service; ignorar cualquier `trainerId` del body
    - _Requirements: 4.1, 4.5, 8.5_
  - [x] 7.3 Escribir property test para Current_Mark (Property 2)
    - **Property 2: Current_Mark es siempre el registro más reciente**
    - Generar con fast-check: arrays de registros con fechas arbitrarias (minLength: 1); verificar que `getCurrentMark(records).date` es siempre la fecha máxima del array
    - **Validates: Requirements 4.2, 5.1**
  - [x] 7.4 Escribir property test para preservación del histórico (Property 3)
    - **Property 3: Creación de marca preserva el histórico**
    - Generar con fast-check: estado inicial con N registros para un par (clientId, exerciseId); crear un nuevo registro; verificar que el total es N+1 y los N registros anteriores están inalterados
    - **Validates: Requirements 4.3**
  - [x] 7.5 Escribir property test para orden del histórico (Property 4)
    - **Property 4: Histórico ordenado de más reciente a más antiguo**
    - Generar con fast-check: conjunto arbitrario de registros; verificar que para todo par consecutivo `(r_i, r_{i+1})` se cumple `r_i.date >= r_{i+1}.date`
    - **Validates: Requirements 5.1**
  - [x] 7.6 Escribir property test para rechazo de campos obligatorios (Property 5)
    - **Property 5: Marca rechazada sin campos obligatorios**
    - Generar con fast-check: payloads con `value` o `unit` ausentes; verificar respuesta 400 y que el conteo de registros en BD no varía
    - **Validates: Requirements 4.6**
  - [x] 7.7 Escribir property test para trainerId inmutable (Property 7)
    - **Property 7: El trainerId coincide con el usuario autenticado**
    - Generar con fast-check: payloads de creación de marca con `trainerId` arbitrario en el body; verificar que el registro creado tiene `trainerId === userId del JWT`, no el valor del body
    - **Validates: Requirements 4.5, 8.5**
  - [x] 7.8 Escribir property test para ejercicios inactivos excluidos (Property 8)
    - **Property 8: Ejercicios INACTIVE excluidos de listados y Current_Mark**
    - Generar con fast-check: mezcla de ejercicios ACTIVE e INACTIVE con registros asociados; verificar que `getCurrentMarks` y `listExercises` nunca devuelven entradas para ejercicios INACTIVE
    - **Validates: Requirements 7.7**
  - [x] 7.9 Escribir tests de integración para módulo performances
    - Flujo completo: login → crear cliente → crear ejercicio → crear marca → verificar Current_Mark en perfil
    - Verificar histórico de múltiples marcas ordenado DESC
    - Verificar creación de marca con histórico de 1 registro
    - _Requirements: 4.1–4.7, 5.1–5.4_

- [x] 8. Implementar endpoints RGPD (backend)
  - [x] 8.1 Añadir `exportClient(id)` en `clients.service.ts`
    - Devolver JSON con todos los campos personales del cliente + array completo de `PerformanceRecords`; registrar en AuditLog con action `'EXPORT'`
    - Ruta: `GET /clients/:id/export` (ADMIN)
    - _Requirements: 11.1_
  - [x] 8.2 Añadir `anonymizeClient(id)` en `clients.service.ts`
    - Sustituir `firstName → "ANONIMIZADO"`, `lastName → ""`, `birthDate → 1900-01-01`, `photoUrl → NULL`, `notes → NULL`, establecer `anonymizedAt`; borrar archivo físico de foto si existe; conservar `PerformanceRecords` intactos; registrar en AuditLog con action `'ANONYMIZE'`
    - Ruta: `POST /clients/:id/anonymize` (ADMIN)
    - _Requirements: 11.2, 11.5_
  - [x] 8.3 Añadir `deletePhoto(id)` en `clients.service.ts`
    - Borrar archivo físico, poner `photoUrl = NULL` y `photoConsentAt = NULL`; registrar en AuditLog con action `'UPDATE'`
    - Ruta: `DELETE /clients/:id/photo` (ADMIN)
    - _Requirements: 11.6_
  - [x] 8.4 Escribir tests de integración para endpoints RGPD
    - Test export: verificar estructura JSON con datos personales + performances
    - Test anonymize: verificar campos neutralizados, AuditLog creado, performances intactos
    - Test deletePhoto: verificar `photoUrl = NULL` y `photoConsentAt = NULL`
    - _Requirements: 11.1, 11.2, 11.5, 11.6_

- [x] 9. Checkpoint — Verificar backend completo
  - Asegurarse de que todos los tests pasan (`vitest --run`), el servidor arranca sin errores y los endpoints responden correctamente. Consultar al usuario si hay dudas antes de continuar con el frontend.

- [x] 10. Configurar estructura base del frontend
  - [x] 10.1 Crear `frontend/src/main.tsx` con `QueryClientProvider`, `BrowserRouter` y `App`
    - Configurar `QueryClient` con `staleTime: 60_000` y `retry: 1`
    - _Requirements: 10.2_
  - [x] 10.2 Crear `frontend/src/App.tsx` con todas las rutas del diseño
    - Rutas públicas: `/login`
    - Rutas protegidas (componente `ProtectedRoute`): `/`, `/clients/:id`, `/clients/:id/exercises/:exerciseId`, `/admin/clients`, `/admin/exercises`
    - Redirección a `/login` para usuarios no autenticados
    - _Requirements: 1.3, 2.4, 3.6_
  - [x] 10.3 Crear `frontend/src/components/ProtectedRoute.tsx`
    - Leer token del almacenamiento; si no existe o está expirado, redirigir a `/login`
    - Prop opcional `requiredRole` para rutas solo ADMIN
    - _Requirements: 1.3, 8.1_
  - [x] 10.4 Crear funciones de la capa API en `frontend/src/api/`
    - `auth.ts`: `login(email, password)`, `logout()`, `getMe()`
    - `clients.ts`: `listClients(q?)`, `getClient(id)`, `createClient(data)`, `updateClient(id, data)`, `setClientStatus(id, status)`, `uploadClientPhoto(id, file)`, `exportClient(id)`, `anonymizeClient(id)`, `deleteClientPhoto(id)`
    - `exercises.ts`: `listExercises()`, `getExercise(id)`, `createExercise(data)`, `updateExercise(id, data)`, `setExerciseStatus(id, status)`
    - `performances.ts`: `getCurrentPerformances(clientId)`, `getPerformanceHistory(clientId, exerciseId)`, `createPerformance(clientId, exerciseId, data)`
    - Incluir interceptor de axios para adjuntar `Authorization: Bearer <token>` y manejar 401 redirigiendo a login
    - _Requirements: 10.1, 10.2_
  - [x] 10.5 Crear hooks React Query en `frontend/src/hooks/`
    - `useClients.ts`: `useClients(q?)`, `useClient(id)`, mutations para create/update/status
    - `useExercises.ts`: `useExercises()`, `useExercise(id)`, mutations para CRUD
    - `usePerformances.ts`: `useCurrentPerformances(clientId)`, `usePerformanceHistory(clientId, exerciseId)`, mutation `useCreatePerformance`
    - _Requirements: 2.1, 2.2, 3.4, 4.7_

- [x] 11. Implementar componentes reutilizables del design system
  - [x] 11.1 Crear `frontend/src/components/Avatar.tsx`
    - Si `photoUrl` existe: renderizar `<img>` con la URL; si no: mostrar iniciales del cliente en círculo con `bg-surface border-border`
    - _Requirements: 3.2, 3.3_
  - [x] 11.2 Crear `frontend/src/components/ClientCard.tsx`
    - Tarjeta con `Avatar`, nombre completo (texto con `text-primary`), estado ACTIVE/INACTIVE; fondo `surface`, borde `border`; área táctil ≥ 44x44 px
    - Al hacer click navegar al perfil del cliente
    - _Requirements: 2.4, 9.4_
  - [x] 11.3 Crear `frontend/src/components/ExerciseRow.tsx`
    - Fila con nombre del ejercicio y Current_Mark (valor + unidad) resaltada con `text-primary` o badge `primary-soft`; si no hay marca mostrar "Sin marca registrada" en `text-muted`
    - Al hacer click navegar al histórico
    - _Requirements: 3.4, 3.5, 3.6_
  - [x] 11.4 Crear `frontend/src/components/PerformanceForm.tsx`
    - Formulario (modal o página) con campos: `value` (requerido), `unit` (select con 7 opciones, requerido), `date` (default hoy), `repetitions`, `weight`, `duration`, `distance`, `notes`
    - Botón "Guardar" con clase `bg-primary hover:bg-primary-hover text-white`; validación inline con mensajes de error
    - Al submit llamar mutation `useCreatePerformance`; en éxito cerrar e invalidar queries
    - _Requirements: 4.1, 4.4, 4.6, 9.3, 9.4_
  - [x] 11.5 Escribir tests de componentes
    - Test `Avatar`: renderiza img cuando hay photoUrl, renderiza iniciales cuando no
    - Test `PerformanceForm`: botón submit deshabilitado con campos requeridos vacíos, muestra error si value vacío
    - Test `ClientCard`: navega al perfil al hacer click
    - _Requirements: 3.2, 3.3, 4.6_

- [x] 12. Implementar páginas principales del frontend
  - [x] 12.1 Crear `frontend/src/pages/LoginPage.tsx`
    - Formulario email + password; mutation de login; en éxito guardar token y redirigir a `/`
    - Error genérico sin revelar campo incorrecto
    - _Requirements: 1.1, 1.2_
  - [x] 12.2 Crear `frontend/src/pages/DashboardPage.tsx`
    - Input de búsqueda controlado que dispara `useClients(q)` con debounce; lista de `ClientCard` para clientes ACTIVE
    - Si `user.role === 'ADMIN'`: mostrar botón "Nuevo cliente" (navega a formulario de creación)
    - Layout responsive: grilla de tarjetas en móvil (1 col), tablet (2 col), desktop (3+ col)
    - _Requirements: 2.1–2.5, 9.1–9.3_
  - [x] 12.3 Crear `frontend/src/pages/ClientProfilePage.tsx`
    - Sección de datos del cliente (nombre, apellidos, edad calculada desde birthDate, altura, peso, grasa corporal, observaciones, estado) + `Avatar`
    - Lista de `ExerciseRow` por ejercicio ACTIVE con Current_Mark del cliente (datos de `useCurrentPerformances`)
    - Botón "Añadir marca" en cada ejercicio que abre `PerformanceForm`
    - _Requirements: 3.1–3.6, 4.7_
  - [x] 12.4 Crear `frontend/src/pages/ExerciseHistoryPage.tsx`
    - Encabezado con nombre del cliente y nombre del ejercicio
    - Lista de registros del histórico (fecha, valor, unidad, nombre del trainer, notas); datos de `usePerformanceHistory`
    - Mensaje "Sin marcas registradas" cuando el histórico está vacío
    - Botón "Nueva marca" que abre `PerformanceForm`
    - _Requirements: 5.1–5.4_

- [x] 13. Implementar páginas de administración (solo ADMIN)
  - [x] 13.1 Crear `frontend/src/pages/admin/ClientsAdminPage.tsx`
    - Listado de todos los clientes (ACTIVE e INACTIVE) con opciones: editar, cambiar estado, exportar datos, anonimizar, gestionar foto
    - Formulario inline o modal para crear/editar cliente con todos los campos del modelo
    - Subida de foto con confirmación de consentimiento explícito (check requerido antes de enviar)
    - _Requirements: 6.1–6.7, 11.1, 11.2, 11.6_
  - [x] 13.2 Crear `frontend/src/pages/admin/ExercisesAdminPage.tsx`
    - Listado de ejercicios con opciones: editar, cambiar estado (ACTIVE/INACTIVE)
    - Formulario para crear/editar con campos: nombre, categoría, unidad principal, descripción, estado
    - _Requirements: 7.1–7.6_

- [~] 14. Verificar responsive y accesibilidad
  - Revisar en `DashboardPage`, `ClientProfilePage` y `ExerciseHistoryPage` que todos los elementos interactivos tienen `min-h-[44px] min-w-[44px]` (área táctil ≥ 44×44 px)
  - Verificar que el flujo "buscar cliente → seleccionar ejercicio → nueva marca → guardar" se completa en ≤ 5 interacciones en móvil
  - Asegurar que los breakpoints de Tailwind cubren 320 px (móvil), 768 px (tablet) y 1024 px (desktop)
  - Añadir atributos `aria-label` en botones icono, `htmlFor` en labels, roles semánticos en listas
  - _Requirements: 9.1–9.4_

- [~] 15. Checkpoint final — Verificar sistema completo
  - Ejecutar todos los tests de backend (`vitest --run`) y frontend (`vitest --run`)
  - Verificar que todos los endpoints principales responden correctamente y el flujo completo funciona de extremo a extremo
  - Consultar al usuario si hay dudas o ajustes antes de considerar el MVP completado.

---

## Notes

- Las tareas marcadas con `*` son opcionales y pueden omitirse para obtener un MVP más rápido; se recomienda implementarlas para garantizar la corrección del sistema.
- Las 8 propiedades PBT deben ejecutarse con `numRuns: 100` mínimo (configuración fast-check por defecto es 100).
- Cada property test debe incluir el tag de trazabilidad: `// Feature: control-marcas-entrenamiento, Property N: <texto>`.
- Los `trainerId` **nunca** se leen del cuerpo de la petición; siempre se inyectan desde `req.user.userId` en el router.
- Los campos `anonymizedAt` y `photoConsentAt` son extensiones del esquema Prisma respecto al modelo base del diseño; incluirlos en la migración inicial (tarea 2.1).
- Para tests de integración (tareas 5.5, 7.9, 8.4) se necesita una base de datos PostgreSQL de test; configurar `DATABASE_URL` en `.env.test` con una BD separada o usar contenedor Docker.
