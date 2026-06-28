# AGENTS.md

Guía de trabajo para agentes y asistentes que colaboren en MyWorkoutBox.

Este archivo es la fuente principal de instrucciones del proyecto. Antes de modificar código, documentación, tests o configuración, lee estas reglas y respétalas salvo que el usuario indique explícitamente lo contrario.

## Identidad del proyecto

MyWorkoutBox es una aplicación real para centros de entrenamiento. Gestiona clientes, entrenadores, ejercicios evaluables, marcas de rendimiento, histórico, roles, tenants, branding, auditoría y RGPD básico.

El proyecto debe tratarse como un producto en evolución, no como una demo. Las decisiones deben favorecer mantenibilidad, claridad, calidad, producción y crecimiento futuro hacia móvil/API pública.

## Reglas generales de trabajo

- Lee el contexto existente antes de proponer o editar.
- Mantén los cambios pequeños, trazables y alineados con la arquitectura actual.
- No hagas cambios destructivos ni reviertas trabajo ajeno sin petición explícita.
- No introduzcas secretos, credenciales reales, dominios privados o rutas personales.
- No cambies contratos públicos, rutas, payloads o comportamiento de frontend sin revisar impacto.
- Si un cambio afecta a comportamiento observable, añade o ajusta tests.
- Si un cambio afecta a instalación, despliegue, variables de entorno o arquitectura, actualiza documentación.
- Antes de cerrar una tarea, ejecuta la validación proporcional al cambio.

## Arquitectura backend

El backend sigue Clean Architecture estricta.

Regla de dependencia:

```txt
domain <- application <- infrastructure/interfaces/main
```

Directrices:

- `backend/src/domain` contiene reglas puras, entidades, value objects, errores de dominio y contratos internos.
- `backend/src/application` contiene casos de uso, DTOs y puertos.
- `backend/src/infrastructure` contiene Prisma, repositorios concretos, JWT, bcrypt, storage, tiempo/configuración y detalles externos.
- `backend/src/interfaces/http` contiene Express, rutas, middlewares, controladores y traducción HTTP.
- `backend/src/main` compone dependencias manualmente.

Restricciones:

- `domain` y `application` no deben importar Express, Prisma, bcrypt, JWT, Multer, filesystem, variables de entorno ni observabilidad externa.
- Prisma solo debe aparecer como detalle de infraestructura.
- Express solo debe aparecer en adaptadores HTTP.
- Los casos de uso no deben depender de `req`, `res`, `next`, `process.env` ni modelos Prisma.
- Nuevas funcionalidades deben entrar como casos de uso explícitos y puertos cuando haya dependencias externas.
- Mantén y respeta `backend/src/architecture-clean-boundaries.test.ts`.

## Arquitectura frontend

El frontend usa arquitectura por módulos funcionales:

```txt
frontend/src/app
frontend/src/features
frontend/src/shared
```

Directrices:

- `app` compone router, pages, layout y providers.
- `features` contiene capacidades de negocio: auth, clients, exercises, performances, trainers y futuras features.
- `shared` contiene UI genérica, cliente HTTP, sesión compartida, theme, state y tipos transversales.

Restricciones:

- `shared` no importa `features` ni `app`.
- `features` no importa `app`.
- Las páginas enroutadas y la composición de aplicación viven en `app`.
- Los componentes reutilizables sin lógica de negocio viven en `shared`.
- La lógica propia de una capacidad vive en su feature.
- Mantén y respeta `frontend/src/architecture-feature-boundaries.test.ts`.

## Diseño UX/UI

La interfaz debe sentirse como una herramienta profesional para entrenadores y centros deportivos: clara, sobria, rápida y orientada al trabajo.

Directrices:

- Mantén consistencia visual con Tailwind y los componentes existentes.
- Prioriza layouts responsive y usables en desktop y móvil.
- Incluye estados de loading, error, vacío y éxito cuando el flujo lo requiera.
- Usa iconos de `lucide-react` cuando aporten claridad.
- Evita textos explicativos largos dentro de la interfaz.
- Evita rediseños globales si la tarea pide un ajuste puntual.
- No crees una landing salvo que se pida explícitamente.
- Si se trabaja en landing, onboarding o producto comercial, debe verse como producto real, no como plantilla genérica.

## Testing y calidad

Comandos de validación principales:

```bash
npm --prefix backend test
npm --prefix backend run build
npm --prefix frontend test
npm --prefix frontend run build
```

Reglas:

- Ejecuta backend tests con MySQL/MariaDB disponible cuando el cambio toque backend, Prisma, casos de uso o endpoints.
- Ejecuta frontend tests/build cuando cambie UI, routing, hooks, features o shared.
- Mantén tests de arquitectura en verde.
- Añade tests unitarios para casos de uso nuevos.
- Añade tests de integración HTTP cuando cambien endpoints, auth, roles, tenants, RGPD o auditoría.
- Añade tests de componentes cuando cambie comportamiento visual/interactivo relevante.
- Si no puedes ejecutar una validación necesaria, deja constancia clara del motivo.

## API y producción

MyWorkoutBox debe estar preparado para producción y consumo futuro desde móvil.

Directrices:

- Diseña endpoints con contratos claros y estables.
- Mantén actualizada la especificación OpenAPI servida en `/openapi.json` y la UI de `/docs`.
- Documenta DTOs, errores, auth JWT, roles y tenant context cuando cambien endpoints.
- No acoples endpoints a necesidades puntuales de una pantalla si puede evitarse.
- Mantén MariaDB/MySQL como base de datos real del proyecto.
- No recuperes dependencias de SQLite salvo para scripts explícitos de migración.
- Mantén uploads fuera del repositorio.
- Mantén despliegue portable para servidor Linux/VPS con reverse proxy y `systemd`.
- No ejecutes migraciones destructivas ni importaciones de datos automáticamente en deploy.

## Seguridad y configuración

- Nunca escribas secretos reales en archivos versionados.
- Usa `.env.example`, `.env.test.example` y `.env.production.example` para documentar variables.
- Mantén `JWT_SECRET`, `DATABASE_URL`, claves SSH y credenciales fuera del repositorio.
- CORS debe ser configurable por entorno.
- Valida roles y tenant context en operaciones protegidas.
- Trata RGPD, anonimización, exportación y fotos de cliente como flujos sensibles.

## Git y documentación

- Usa ramas descriptivas por bloque de trabajo.
- Haz commits pequeños y con mensaje claro.
- No muevas tags publicados; crea un tag nuevo para relanzar releases.
- Actualiza `README.md` si cambia instalación, stack, arquitectura o funcionalidad principal.
- Actualiza `doc/DEPLOYMENT.md` si cambia despliegue, variables, migraciones, backups o reverse proxy.
- Mantén documentación pública sin dominios reales, rutas personales ni credenciales.

## Workflows internos

Usa estos workflows como habilidades operativas dentro del proyecto. No son skills instalables; son modos de revisión que deben activarse cuando el cambio lo requiera.

### `architecture-review`

Usar antes de cambios estructurales.

- Revisar límites backend Clean Architecture.
- Revisar límites frontend `app/features/shared`.
- Confirmar que no se rompen tests de arquitectura.
- Evitar acoplamientos nuevos entre capas.

### `api-contract`

Usar al crear o modificar endpoints.

- Identificar ruta, método, auth, roles y tenant context.
- Definir request, response y errores.
- Revisar compatibilidad con frontend actual.
- Actualizar OpenAPI y validar que `/openapi.json` cubre la ruta.

### `quality-audit`

Usar antes de cerrar hitos importantes.

- Revisar tests críticos y huecos de cobertura.
- Ejecutar builds relevantes.
- Revisar riesgos de CI/deploy.
- Revisar que documentación y ejemplos sigan actualizados.

### `product-ui`

Usar al tocar pantallas, landing, onboarding o dashboard.

- Revisar responsive.
- Revisar estados vacíos/loading/error.
- Revisar consistencia de componentes, espaciado, contraste y copy.
- Evitar UI decorativa sin valor funcional.

### `production-readiness`

Usar antes de releases o cambios de infraestructura.

- Revisar variables de entorno.
- Revisar migraciones Prisma.
- Revisar backups y uploads persistentes.
- Revisar health check, reverse proxy, CORS y systemd.
- Confirmar que no hay dependencias accidentales de entorno local.
