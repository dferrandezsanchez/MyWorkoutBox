type OpenApiDocument = {
  openapi: string;
  info: { title: string; version: string; description: string };
  servers: Array<{ url: string; description: string }>;
  tags: Array<{ name: string; description: string }>;
  components: Record<string, unknown>;
  paths: Record<string, unknown>;
};

const errorResponses = {
  BadRequest: {
    description: 'Invalid request',
    content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
  },
  Unauthorized: {
    description: 'Missing, invalid, or expired token',
    content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
  },
  Forbidden: {
    description: 'Insufficient permissions for the requested resource',
    content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
  },
  NotFound: {
    description: 'Resource not found',
    content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
  },
  Conflict: {
    description: 'Conflict with the current resource state',
    content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
  },
};

const authResponses = {
  401: { $ref: '#/components/responses/Unauthorized' },
};

const adminResponses = {
  401: { $ref: '#/components/responses/Unauthorized' },
  403: { $ref: '#/components/responses/Forbidden' },
};

export const openApiDocument: OpenApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'STELIOS API',
    version: '0.6.0-alpha',
    description:
      'HTTP API for managing training centers, clients, trainers, sessions, measurable exercises, and performance records. Except for health and login operations, requests require a tenant-scoped JWT. ADMIN users manage center resources; ADMIN and TRAINER users can use trainer workflows.',
  },
  servers: [
    { url: '.', description: 'Current environment' },
    { url: 'http://localhost:3000', description: 'Local development' },
  ],
  tags: [
    { name: 'Health', description: 'API health status' },
    { name: 'Auth', description: 'Authentication, current user, and active tenant' },
    { name: 'Clients', description: 'Client management and GDPR workflows' },
    { name: 'Exercises', description: 'Measurable exercise catalog' },
    { name: 'Performances', description: 'Performance records and history' },
    { name: 'Training Sessions', description: 'Trainer sessions, exercises, and series' },
    { name: 'Trainers', description: 'Trainer management' },
    { name: 'Dashboard', description: 'Center activity overview for administrators' },
    { name: 'Routines', description: 'Routine templates and client routine plans (A→B→C)' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    responses: errorResponses,
    schemas: {
      ErrorResponse: {
        type: 'object',
        required: ['error'],
        properties: {
          error: { type: 'string', example: 'Recurso no encontrado' },
          fields: { type: 'array', items: { type: 'string' }, example: ['email'] },
        },
      },
      MessageResponse: {
        type: 'object',
        required: ['message'],
        properties: { message: { type: 'string' } },
      },
      Role: { type: 'string', enum: ['ADMIN', 'TRAINER'] },
      Status: { type: 'string', enum: ['ACTIVE', 'INACTIVE'] },
      PerformanceUnit: {
        type: 'string',
        enum: ['kg', 'repetitions', 'seconds', 'minutes', 'meters', 'calories', 'text'],
      },
      User: {
        type: 'object',
        required: ['id', 'name', 'email', 'role', 'canManageRoutines', 'tenantId', 'organizationId'],
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          role: { $ref: '#/components/schemas/Role' },
          canManageRoutines: { type: 'boolean', description: 'Effective routine permission in the current tenant. Always true for ADMIN.' },
          tenantId: { type: 'string' },
          organizationId: { type: 'string' },
        },
      },
      UserUpdateInput: {
        type: 'object',
        properties: {
          name: { type: 'string', example: 'Admin Demo' },
          email: { type: 'string', format: 'email', example: 'admin@example.com' },
        },
      },
      Tenant: {
        type: 'object',
        description: 'Active training center. Visual branding is fixed by the platform and is not configurable per tenant.',
        required: ['id', 'organizationId', 'name', 'slug', 'measurementsEnabled'],
        properties: {
          id: { type: 'string' },
          organizationId: { type: 'string' },
          name: { type: 'string' },
          slug: { type: 'string' },
          measurementsEnabled: { type: 'boolean', description: 'Whether the center tracks client measurements and goals.' },
        },
      },
      TenantOption: {
        type: 'object',
        required: ['id', 'organizationId', 'name', 'organizationName', 'role'],
        properties: {
          id: { type: 'string' },
          organizationId: { type: 'string' },
          name: { type: 'string' },
          organizationName: { type: 'string' },
          role: { $ref: '#/components/schemas/Role' },
        },
      },
      DashboardOverview: {
        type: 'object',
        description: 'Center activity over the last 28 days compared with the previous 28 days.',
        required: ['period', 'totals', 'daily', 'activeSessions', 'trainers', 'recentSessions', 'clientsToReactivate'],
        properties: {
          period: {
            type: 'object',
            required: ['from', 'to', 'days'],
            properties: { from: { type: 'string', format: 'date-time' }, to: { type: 'string', format: 'date-time' }, days: { type: 'integer', example: 28 } },
          },
          totals: {
            type: 'object',
            required: ['completedSessions', 'previousCompletedSessions', 'series', 'previousSeries', 'trainedClients', 'previousTrainedClients'],
            properties: {
              completedSessions: { type: 'integer' },
              previousCompletedSessions: { type: 'integer' },
              series: { type: 'integer' },
              previousSeries: { type: 'integer' },
              trainedClients: { type: 'integer' },
              previousTrainedClients: { type: 'integer' },
            },
          },
          daily: {
            type: 'array',
            items: { type: 'object', required: ['date', 'sessions', 'series'], properties: { date: { type: 'string', format: 'date' }, sessions: { type: 'integer' }, series: { type: 'integer' } } },
          },
          activeSessions: {
            type: 'array',
            items: {
              type: 'object',
              required: ['id', 'clientId', 'clientName', 'trainerName', 'startedAt', 'seriesCount'],
              properties: { id: { type: 'string' }, clientId: { type: 'string' }, clientName: { type: 'string' }, trainerName: { type: 'string' }, startedAt: { type: 'string', format: 'date-time' }, seriesCount: { type: 'integer' } },
            },
          },
          trainers: {
            type: 'array',
            items: { type: 'object', required: ['id', 'name', 'sessions', 'series'], properties: { id: { type: 'string' }, name: { type: 'string' }, sessions: { type: 'integer' }, series: { type: 'integer' } } },
          },
          recentSessions: {
            type: 'array',
            items: {
              type: 'object',
              required: ['id', 'clientId', 'clientName', 'trainerName', 'completedAt', 'exerciseCount', 'seriesCount'],
              properties: { id: { type: 'string' }, clientId: { type: 'string' }, clientName: { type: 'string' }, trainerName: { type: 'string' }, completedAt: { type: 'string', format: 'date-time' }, exerciseCount: { type: 'integer' }, seriesCount: { type: 'integer' } },
            },
          },
          clientsToReactivate: {
            type: 'array',
            description: 'Active clients without a session in the last 14 days, longest inactivity first.',
            items: {
              type: 'object',
              required: ['id', 'name', 'lastSessionAt', 'daysSince'],
              properties: { id: { type: 'string' }, name: { type: 'string' }, lastSessionAt: { type: 'string', format: 'date-time', nullable: true }, daysSince: { type: 'integer', nullable: true } },
            },
          },
        },
      },
      TenantUpdateInput: {
        type: 'object',
        description: 'Send at least one field.',
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 191 },
          measurementsEnabled: { type: 'boolean' },
        },
      },
      LoginSuccessResponse: {
        type: 'object',
        required: ['token', 'user', 'tenant'],
        properties: {
          token: { type: 'string' },
          user: { $ref: '#/components/schemas/User' },
          tenant: { $ref: '#/components/schemas/Tenant' },
        },
      },
      TenantSelectionResponse: {
        type: 'object',
        required: ['tenantSelectionRequired', 'selectionToken', 'tenants'],
        properties: {
          tenantSelectionRequired: { type: 'boolean', enum: [true] },
          selectionToken: { type: 'string' },
          tenants: { type: 'array', items: { $ref: '#/components/schemas/TenantOption' } },
        },
      },
      Client: {
        type: 'object',
        required: ['id', 'tenantId', 'firstName', 'lastName', 'birthDate', 'status', 'createdAt', 'updatedAt'],
        properties: {
          id: { type: 'string' },
          tenantId: { type: 'string' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          birthDate: { type: 'string', format: 'date-time' },
          height: { type: 'number', nullable: true },
          weight: { type: 'number', nullable: true },
          bodyFatPercentage: { type: 'number', nullable: true },
          notes: { type: 'string', nullable: true },
          goal: { type: 'string', nullable: true, description: 'Free-text goal: reason and target (e.g. a race, a wedding, health).' },
          goalDate: { type: 'string', format: 'date-time', nullable: true },
          status: { $ref: '#/components/schemas/Status' },
          anonymizedAt: { type: 'string', format: 'date-time', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      ClientInput: {
        type: 'object',
        properties: {
          firstName: { type: 'string', example: 'Alex' },
          lastName: { type: 'string', example: 'Molina' },
          birthDate: { type: 'string', format: 'date', example: '1990-05-20' },
          height: { type: 'number', example: 178 },
          weight: { type: 'number', example: 78.5 },
          bodyFatPercentage: { type: 'number', minimum: 0, maximum: 100, example: 16.5 },
          notes: { type: 'string', example: 'Lesión antigua de rodilla.' },
          goal: { type: 'string', maxLength: 500, nullable: true, example: 'Preparar la media maratón de Valencia' },
          goalDate: { type: 'string', format: 'date', nullable: true, example: '2027-03-21' },
          status: { $ref: '#/components/schemas/Status' },
        },
      },
      ClientCreateInput: {
        allOf: [
          { $ref: '#/components/schemas/ClientInput' },
          {
            type: 'object',
            required: ['firstName', 'lastName', 'birthDate'],
            properties: {
              initialMeasurement: {
                allOf: [{ $ref: '#/components/schemas/ClientMeasurementInput' }],
                description: 'Optional first measurement, stored as the first entry of the history when the center has measurements enabled.',
              },
            },
          },
        ],
      },
      ClientGoalInput: {
        type: 'object',
        properties: {
          goal: { type: 'string', maxLength: 500, nullable: true },
          goalDate: { type: 'string', format: 'date', nullable: true },
        },
      },
      ClientMeasurement: {
        type: 'object',
        required: ['id', 'tenantId', 'clientId', 'measuredAt', 'weight', 'bodyFatPercentage', 'muscleMass', 'notes', 'createdById', 'createdAt', 'updatedAt'],
        properties: {
          id: { type: 'string' },
          tenantId: { type: 'string' },
          clientId: { type: 'string' },
          measuredAt: { type: 'string', format: 'date-time' },
          weight: { type: 'number', nullable: true, description: 'kg' },
          bodyFatPercentage: { type: 'number', nullable: true, description: '%' },
          muscleMass: { type: 'number', nullable: true, description: 'kg' },
          notes: { type: 'string', nullable: true },
          createdById: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      ClientMeasurementInput: {
        type: 'object',
        required: ['measuredAt'],
        description: 'At least one of weight, bodyFatPercentage or muscleMass is required.',
        properties: {
          measuredAt: { type: 'string', format: 'date', example: '2026-11-17' },
          weight: { type: 'number', minimum: 20, maximum: 400, nullable: true, example: 78.4 },
          bodyFatPercentage: { type: 'number', minimum: 2, maximum: 75, nullable: true, example: 18.2 },
          muscleMass: { type: 'number', minimum: 5, maximum: 150, nullable: true, example: 34.6 },
          notes: { type: 'string', maxLength: 1000, nullable: true },
        },
      },
      TrainingSessionExercise: {
        type: 'object',
        required: ['id', 'sessionId', 'exerciseId', 'position', 'createdAt', 'exercise', 'series'],
        properties: {
          id: { type: 'string' },
          sessionId: { type: 'string' },
          exerciseId: { type: 'string' },
          position: { type: 'integer' },
          createdAt: { type: 'string', format: 'date-time' },
          exercise: { $ref: '#/components/schemas/Exercise' },
          series: { type: 'array', items: { $ref: '#/components/schemas/PerformanceRecord' } },
          previousSeries: {
            type: 'array',
            description: "Series of this exercise in the client's last completed session (excluding this one). Only used to prefill the series form; never stored automatically.",
            items: { $ref: '#/components/schemas/PerformanceRecord' },
          },
        },
      },
      TrainingSession: {
        type: 'object',
        required: ['id', 'tenantId', 'clientId', 'trainerId', 'trainerName', 'status', 'startedAt', 'createdAt', 'updatedAt', 'client', 'exercises'],
        properties: {
          id: { type: 'string' },
          tenantId: { type: 'string' },
          clientId: { type: 'string' },
          trainerId: { type: 'string' },
          trainerName: { type: 'string' },
          status: { type: 'string', enum: ['ACTIVE', 'COMPLETED'] },
          startedAt: { type: 'string', format: 'date-time' },
          completedAt: { type: 'string', format: 'date-time', nullable: true },
          notes: { type: 'string', nullable: true },
          routineTemplateId: { type: 'string', nullable: true, description: 'Routine template the session was started from.' },
          routinePlanId: { type: 'string', nullable: true, description: 'Client routine plan the session was started from (mode "plan").' },
          routinePlanPosition: { type: 'integer', minimum: 1, nullable: true, description: 'Plan position (A=1, B=2, ...) covered by the session.' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          client: { $ref: '#/components/schemas/Client' },
          exercises: { type: 'array', items: { $ref: '#/components/schemas/TrainingSessionExercise' } },
        },
      },
      StartTrainingSessionInput: {
        type: 'object',
        required: ['clientId'],
        properties: {
          clientId: { type: 'string' },
          mode: {
            type: 'string',
            enum: ['free', 'plan', 'template'],
            default: 'free',
            description: 'free: empty session. plan: next routine of the client active plan (advances on completion). template: any active routine template.',
          },
          templateId: { type: 'string', description: 'Required when mode is "template".' },
        },
      },
      SessionStartOptions: {
        type: 'object',
        required: ['plan', 'nextRoutine', 'templates'],
        properties: {
          plan: {
            nullable: true,
            description: 'Client active routine plan (A -> B -> C).',
            allOf: [{ $ref: '#/components/schemas/ClientRoutinePlan' }],
          },
          nextRoutine: {
            type: 'object',
            nullable: true,
            description: 'Routine that corresponds next in the plan, when it is active.',
            required: ['position', 'template'],
            properties: {
              position: { type: 'integer', minimum: 1 },
              template: { $ref: '#/components/schemas/RoutineTemplate' },
            },
          },
          templates: { type: 'array', description: 'Active routine templates of the center.', items: { $ref: '#/components/schemas/RoutineTemplate' } },
        },
      },
      ClientExport: {
        type: 'object',
        required: ['client', 'performances', 'trainingSessions', 'measurements'],
        properties: {
          client: { $ref: '#/components/schemas/Client' },
          performances: { type: 'array', items: { $ref: '#/components/schemas/PerformanceRecord' } },
          trainingSessions: { type: 'array', items: { $ref: '#/components/schemas/TrainingSession' } },
          measurements: { type: 'array', items: { $ref: '#/components/schemas/ClientMeasurement' } },
        },
      },
      Exercise: {
        type: 'object',
        required: ['id', 'tenantId', 'name', 'category', 'movementPattern', 'evaluationType', 'improvementDirection', 'defaultUnit', 'measurementFields', 'variantGroups', 'status', 'createdAt', 'updatedAt'],
        properties: {
          id: { type: 'string' },
          tenantId: { type: 'string' },
          name: { type: 'string' },
          category: { type: 'string', enum: ['strength', 'functional', 'core', 'endurance', 'mobility', 'technique'] },
          movementPattern: { type: 'string', enum: ['push', 'pull', 'squat', 'hinge', 'lunge', 'core', 'locomotion', 'carry', 'olympic', 'gymnastic', 'conditioning', 'mobility', 'general'] },
          evaluationType: { type: 'string', enum: ['repetitions', 'weight_reps', 'max_time', 'distance', 'time_to_complete', 'amrap', 'rounds_reps', 'qualitative'] },
          improvementDirection: { type: 'string', enum: ['higher', 'lower', 'qualitative'] },
          defaultUnit: { $ref: '#/components/schemas/PerformanceUnit' },
          measurementFields: { type: 'string', description: 'Serialized JSON measurement fields' },
          variantGroups: { type: 'string', description: 'Serialized JSON variant groups' },
          description: { type: 'string', nullable: true },
          muscleGroup: { type: 'string', nullable: true, enum: ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'legs', 'glutes', 'core', 'functional', 'cardio'], description: 'Muscle group used to organize the catalog.' },
          libraryKey: { type: 'string', nullable: true, description: 'Slug of the library exercise this one was created from, if any.' },
          status: { $ref: '#/components/schemas/Status' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      ExerciseLibraryItem: {
        type: 'object',
        required: ['slug', 'name', 'muscleGroup', 'category', 'evaluationType', 'defaultUnit', 'starter', 'added'],
        properties: {
          slug: { type: 'string' },
          name: { type: 'string' },
          muscleGroup: { type: 'string' },
          category: { type: 'string' },
          evaluationType: { type: 'string' },
          defaultUnit: { type: 'string' },
          starter: { type: 'boolean', description: 'Part of the starter pack new centers begin with.' },
          added: { type: 'boolean', description: 'The center already has this exercise.' },
        },
      },
      ExerciseLibrary: {
        type: 'object',
        required: ['groups', 'exercises'],
        properties: {
          groups: { type: 'array', items: { type: 'object', required: ['key', 'label'], properties: { key: { type: 'string' }, label: { type: 'string' } } } },
          exercises: { type: 'array', items: { $ref: '#/components/schemas/ExerciseLibraryItem' } },
        },
      },
      ExerciseLibraryImportInput: {
        type: 'object',
        required: ['slugs'],
        properties: { slugs: { type: 'array', minItems: 1, maxItems: 100, items: { type: 'string' }, example: ['press_banca_mancuernas', 'remo_mancuerna'] } },
      },
      ExerciseLibraryImportResult: {
        type: 'object',
        required: ['created', 'reactivated', 'skipped'],
        properties: { created: { type: 'integer' }, reactivated: { type: 'integer' }, skipped: { type: 'integer' } },
      },
      ExerciseInput: {
        type: 'object',
        properties: {
          name: { type: 'string', example: 'Dominadas' },
          category: { type: 'string', example: 'strength' },
          movementPattern: { type: 'string', example: 'pull' },
          evaluationType: { type: 'string', example: 'repetitions' },
          improvementDirection: { type: 'string', example: 'higher' },
          muscleGroup: { type: 'string', nullable: true, example: 'back', description: 'chest, back, shoulders, biceps, triceps, legs, glutes, core, functional or cardio. Null for no group.' },
          defaultUnit: { $ref: '#/components/schemas/PerformanceUnit' },
          measurementFields: { type: 'array', items: { $ref: '#/components/schemas/MeasurementFieldInput' } },
          variantGroups: { type: 'array', items: { $ref: '#/components/schemas/VariantGroupInput' } },
          description: { type: 'string' },
          status: { $ref: '#/components/schemas/Status' },
        },
      },
      ExerciseCreateInput: {
        allOf: [
          { $ref: '#/components/schemas/ExerciseInput' },
          { type: 'object', required: ['name', 'category', 'defaultUnit'] },
        ],
      },
      MeasurementFieldInput: {
        type: 'object',
        required: ['key', 'label', 'required'],
        properties: {
          key: { type: 'string', enum: ['value', 'weight', 'repetitions', 'duration', 'distance'] },
          label: { type: 'string', example: 'Repeticiones' },
          unit: { $ref: '#/components/schemas/PerformanceUnit' },
          required: { type: 'boolean' },
          primary: { type: 'boolean' },
        },
      },
      VariantGroupInput: {
        type: 'object',
        required: ['key', 'label', 'options', 'required'],
        properties: {
          key: { type: 'string', example: 'grip' },
          label: { type: 'string', example: 'Agarre' },
          options: { type: 'array', items: { type: 'string' }, example: ['Prono', 'Supino', 'Neutro'] },
          required: { type: 'boolean' },
        },
      },
      PerformanceRecord: {
        type: 'object',
        required: ['id', 'tenantId', 'clientId', 'exerciseId', 'trainerId', 'value', 'unit', 'date'],
        properties: {
          id: { type: 'string' },
          tenantId: { type: 'string' },
          clientId: { type: 'string' },
          exerciseId: { type: 'string' },
          trainerId: { type: 'string' },
          trainerName: { type: 'string' },
          value: { type: 'string' },
          unit: { $ref: '#/components/schemas/PerformanceUnit' },
          weight: { type: 'number', nullable: true },
          repetitions: { type: 'number', nullable: true },
          duration: { type: 'number', nullable: true },
          distance: { type: 'number', nullable: true },
          date: { type: 'string', format: 'date-time' },
          notes: { type: 'string', nullable: true },
          variantValues: { type: 'string', nullable: true, description: 'Serialized JSON selected variants' },
          sessionExerciseId: { type: 'string', nullable: true },
          seriesNumber: { type: 'integer', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      PerformanceInput: {
        type: 'object',
        required: ['value', 'unit'],
        properties: {
          value: { oneOf: [{ type: 'string' }, { type: 'number' }] },
          unit: { $ref: '#/components/schemas/PerformanceUnit' },
          weight: { type: 'number' },
          repetitions: { type: 'number' },
          duration: { type: 'number' },
          distance: { type: 'number' },
          date: { type: 'string', format: 'date' },
          notes: { type: 'string' },
          variants: { type: 'object', additionalProperties: { type: 'string' } },
        },
      },
      CurrentMark: {
        type: 'object',
        required: ['exerciseId', 'exerciseName', 'exercise', 'record', 'bestRecord', 'recentRecords'],
        properties: {
          exerciseId: { type: 'string' },
          exerciseName: { type: 'string' },
          exercise: { $ref: '#/components/schemas/Exercise' },
          record: { allOf: [{ $ref: '#/components/schemas/PerformanceRecord' }], nullable: true },
          bestRecord: { allOf: [{ $ref: '#/components/schemas/PerformanceRecord' }], nullable: true },
          recentRecords: { type: 'array', maxItems: 6, items: { $ref: '#/components/schemas/PerformanceRecord' } },
        },
      },
      Trainer: {
        type: 'object',
        description: 'Staff member of the center (ADMIN or TRAINER membership).',
        required: ['id', 'name', 'email', 'role', 'canManageRoutines', 'active'],
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          role: { $ref: '#/components/schemas/Role' },
          canManageRoutines: { type: 'boolean', description: 'Effective routine permission. Always true for ADMIN.' },
          active: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      TrainerInput: {
        type: 'object',
        properties: {
          name: { type: 'string', example: 'Trainer Demo' },
          email: { type: 'string', format: 'email', example: 'trainer@example.com' },
          active: { type: 'boolean' },
        },
      },
      StaffAccessInput: {
        type: 'object',
        minProperties: 1,
        properties: {
          role: { $ref: '#/components/schemas/Role' },
          canManageRoutines: { type: 'boolean' },
        },
      },
      TrainerCreateInput: {
        allOf: [
          { $ref: '#/components/schemas/TrainerInput' },
          {
            type: 'object',
            required: ['name', 'email', 'password'],
            properties: { password: { type: 'string', minLength: 8 } },
          },
        ],
      },
      RoutineTemplateExercise: {
        type: 'object',
        required: ['id', 'templateId', 'exerciseId', 'position', 'targetSets', 'targetReps', 'notes', 'exercise'],
        properties: {
          id: { type: 'string' },
          templateId: { type: 'string' },
          exerciseId: { type: 'string' },
          position: { type: 'integer', minimum: 1, description: '1-based order inside the template.' },
          targetSets: { type: 'integer', minimum: 1, maximum: 20, nullable: true },
          targetReps: { type: 'string', maxLength: 64, nullable: true, example: '8-10' },
          notes: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          exercise: { $ref: '#/components/schemas/Exercise' },
        },
      },
      RoutineTemplate: {
        type: 'object',
        required: ['id', 'tenantId', 'name', 'notes', 'status', 'createdById', 'createdAt', 'updatedAt', 'exercises'],
        properties: {
          id: { type: 'string' },
          tenantId: { type: 'string' },
          name: { type: 'string', example: 'Rutina A · Empuje' },
          notes: { type: 'string', nullable: true },
          status: { $ref: '#/components/schemas/Status' },
          createdById: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          exercises: { type: 'array', items: { $ref: '#/components/schemas/RoutineTemplateExercise' } },
        },
      },
      RoutineTemplateExerciseInput: {
        type: 'object',
        required: ['exerciseId'],
        properties: {
          exerciseId: { type: 'string', description: 'Active exercise of the current center. Cannot repeat inside a template.' },
          targetSets: { type: 'integer', minimum: 1, maximum: 20, nullable: true },
          targetReps: { type: 'string', maxLength: 64, nullable: true, example: '8-10' },
          notes: { type: 'string', nullable: true },
        },
      },
      RoutineTemplateInput: {
        type: 'object',
        required: ['name', 'exercises'],
        properties: {
          name: { type: 'string', maxLength: 191, example: 'Rutina A · Empuje' },
          notes: { type: 'string', nullable: true },
          exercises: {
            type: 'array',
            minItems: 1,
            maxItems: 50,
            description: 'Ordered list; the array order becomes the template order. Replaces the whole list on update.',
            items: { $ref: '#/components/schemas/RoutineTemplateExerciseInput' },
          },
        },
      },
      ClientRoutinePlanItem: {
        type: 'object',
        required: ['id', 'planId', 'templateId', 'position', 'template'],
        properties: {
          id: { type: 'string' },
          planId: { type: 'string' },
          templateId: { type: 'string' },
          position: { type: 'integer', minimum: 1, description: '1-based order inside the plan (A=1, B=2, ...).' },
          template: { $ref: '#/components/schemas/RoutineTemplate' },
        },
      },
      ClientRoutinePlan: {
        type: 'object',
        required: ['id', 'tenantId', 'clientId', 'name', 'active', 'nextPosition', 'createdById', 'createdAt', 'updatedAt', 'items'],
        properties: {
          id: { type: 'string' },
          tenantId: { type: 'string' },
          clientId: { type: 'string' },
          name: { type: 'string', example: 'Serie de rutinas' },
          active: { type: 'boolean' },
          nextPosition: { type: 'integer', minimum: 1, description: '1-based position of the routine suggested for the next session.' },
          createdById: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          items: { type: 'array', items: { $ref: '#/components/schemas/ClientRoutinePlanItem' } },
        },
      },
      ClientRoutinePlanInput: {
        type: 'object',
        required: ['templateIds'],
        properties: {
          name: { type: 'string', maxLength: 191, description: 'Defaults to "Serie de rutinas" when empty.' },
          templateIds: {
            type: 'array',
            minItems: 1,
            maxItems: 10,
            description: 'Ordered active templates of the center. The same template may repeat (A→B→A).',
            items: { type: 'string' },
          },
          nextPosition: { type: 'integer', minimum: 1, default: 1, description: 'Must be within 1..templateIds.length.' },
        },
      },
      ClientRoutinePlanNextInput: {
        type: 'object',
        required: ['nextPosition'],
        properties: { nextPosition: { type: 'integer', minimum: 1 } },
      },
      StatusInput: {
        type: 'object',
        required: ['status'],
        properties: { status: { $ref: '#/components/schemas/Status' } },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Check API health',
        responses: {
          200: {
            description: 'API is operational',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['status', 'timestamp'],
                  properties: {
                    status: { type: 'string', enum: ['ok'] },
                    timestamp: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Sign in',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Login completed or tenant selection required',
            content: {
              'application/json': {
                schema: {
                  oneOf: [
                    { $ref: '#/components/schemas/LoginSuccessResponse' },
                    { $ref: '#/components/schemas/TenantSelectionResponse' },
                  ],
                },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/auth/select-tenant': {
      post: {
        tags: ['Auth'],
        summary: 'Select a tenant after multi-tenant login',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['selectionToken', 'tenantId'],
                properties: {
                  selectionToken: { type: 'string' },
                  tenantId: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Tenant selected',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginSuccessResponse' } } },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Auth'],
        security: [{ bearerAuth: [] }],
        summary: 'Sign out on the client',
        responses: { 200: { description: 'Session closed', content: { 'application/json': { schema: { $ref: '#/components/schemas/MessageResponse' } } } }, ...authResponses },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        security: [{ bearerAuth: [] }],
        summary: 'Get the authenticated user',
        responses: {
          200: { description: 'Current user', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
          ...authResponses,
        },
      },
      put: {
        tags: ['Auth'],
        security: [{ bearerAuth: [] }],
        summary: 'Update the authenticated user',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UserUpdateInput' } } } },
        responses: {
          200: { description: 'User updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
          400: { $ref: '#/components/responses/BadRequest' },
          ...authResponses,
        },
      },
    },
    '/auth/me/password': {
      put: {
        tags: ['Auth'],
        security: [{ bearerAuth: [] }],
        summary: 'Change the authenticated user password',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['currentPassword', 'newPassword'], properties: { currentPassword: { type: 'string' }, newPassword: { type: 'string', minLength: 8 } } } } },
        },
        responses: {
          200: { description: 'Password updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/MessageResponse' } } } },
          400: { $ref: '#/components/responses/BadRequest' },
          ...authResponses,
        },
      },
    },
    '/auth/tenant': {
      get: {
        tags: ['Auth'],
        security: [{ bearerAuth: [] }],
        summary: 'Get the active tenant',
        responses: {
          200: { description: 'Active tenant', content: { 'application/json': { schema: { $ref: '#/components/schemas/Tenant' } } } },
          ...authResponses,
        },
      },
      put: {
        tags: ['Auth'],
        security: [{ bearerAuth: [] }],
        summary: 'Update active tenant settings (name, measurement tracking)',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/TenantUpdateInput' } } } },
        responses: {
          200: { description: 'Tenant updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/Tenant' } } } },
          400: { $ref: '#/components/responses/BadRequest' },
          ...adminResponses,
        },
      },
    },
  },
};

const pathItem = (tag: string, schema: string, adminOnly = false, searchable = false) => ({
  get: {
    tags: [tag],
    security: [{ bearerAuth: [] }],
    summary: `List ${tag.toLowerCase()}`,
    parameters: [
      ...(searchable ? [{ name: 'q', in: 'query', description: 'Case-insensitive name search', schema: { type: 'string' } }] : []),
      { name: 'includeInactive', in: 'query', schema: { type: 'boolean', default: false } },
    ],
    responses: {
      200: { description: 'Resource list', content: { 'application/json': { schema: { type: 'array', items: { $ref: `#/components/schemas/${schema}` } } } } },
      ...(adminOnly ? adminResponses : authResponses),
    },
  },
  post: {
    tags: [tag],
    security: [{ bearerAuth: [] }],
    summary: `Create ${tag.toLowerCase()}`,
    requestBody: { required: true, content: { 'application/json': { schema: { $ref: `#/components/schemas/${schema}CreateInput` } } } },
    responses: {
      201: { description: 'Resource created', content: { 'application/json': { schema: { $ref: `#/components/schemas/${schema}` } } } },
      400: { $ref: '#/components/responses/BadRequest' },
      ...adminResponses,
    },
  },
});

Object.assign(openApiDocument.paths, {
  '/clients': pathItem('Clients', 'Client', false, true),
  '/clients/{id}': {
    get: {
      tags: ['Clients'],
      security: [{ bearerAuth: [] }],
      summary: 'Get a client',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: { 200: { description: 'Client details', content: { 'application/json': { schema: { $ref: '#/components/schemas/Client' } } } }, 404: { $ref: '#/components/responses/NotFound' }, ...authResponses },
    },
    put: {
      tags: ['Clients'],
      security: [{ bearerAuth: [] }],
      summary: 'Update a client',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ClientInput' } } } },
      responses: { 200: { description: 'Client updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/Client' } } } }, ...adminResponses },
    },
  },
  '/clients/{id}/status': {
    patch: {
      tags: ['Clients'],
      security: [{ bearerAuth: [] }],
      summary: 'Activate or deactivate a client',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/StatusInput' } } } },
      responses: { 200: { description: 'Client updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/Client' } } } }, ...adminResponses },
    },
  },
  '/clients/{id}/export': {
    get: {
      tags: ['Clients'],
      security: [{ bearerAuth: [] }],
      summary: 'Export client data for GDPR portability',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: { 200: { description: 'Exported client data', content: { 'application/json': { schema: { $ref: '#/components/schemas/ClientExport' } } } }, ...adminResponses },
    },
  },
  '/clients/{id}/anonymize': {
    post: {
      tags: ['Clients'],
      security: [{ bearerAuth: [] }],
      summary: 'Anonymize a client',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: { 200: { description: 'Client anonymized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Client' } } } }, ...adminResponses },
    },
  },
  '/exercises': pathItem('Exercises', 'Exercise'),
  '/exercises/library': {
    get: {
      tags: ['Exercises'], security: [{ bearerAuth: [] }], summary: 'List the exercise library, marking what the center already has',
      responses: { 200: { description: 'Exercise library grouped by muscle group', content: { 'application/json': { schema: { $ref: '#/components/schemas/ExerciseLibrary' } } } }, ...adminResponses },
    },
  },
  '/exercises/library/import': {
    post: {
      tags: ['Exercises'], security: [{ bearerAuth: [] }], summary: 'Add library exercises to the center catalog',
      description: 'Idempotent: exercises the center already has are not duplicated and deactivated ones are reactivated.',
      requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ExerciseLibraryImportInput' } } } },
      responses: { 200: { description: 'Import summary', content: { 'application/json': { schema: { $ref: '#/components/schemas/ExerciseLibraryImportResult' } } } }, 400: { $ref: '#/components/responses/BadRequest' }, ...adminResponses },
    },
  },
  '/exercises/{id}': {
    get: {
      tags: ['Exercises'],
      security: [{ bearerAuth: [] }],
      summary: 'Get an exercise',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: { 200: { description: 'Exercise details', content: { 'application/json': { schema: { $ref: '#/components/schemas/Exercise' } } } }, ...authResponses },
    },
    put: {
      tags: ['Exercises'],
      security: [{ bearerAuth: [] }],
      summary: 'Update an exercise',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ExerciseInput' } } } },
      responses: { 200: { description: 'Exercise updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/Exercise' } } } }, ...adminResponses },
    },
  },
  '/exercises/{id}/status': {
    patch: {
      tags: ['Exercises'],
      security: [{ bearerAuth: [] }],
      summary: 'Activate or deactivate an exercise',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/StatusInput' } } } },
      responses: { 200: { description: 'Exercise updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/Exercise' } } } }, ...adminResponses },
    },
  },
  '/clients/{clientId}/current-performances': {
    get: {
      tags: ['Performances'],
      security: [{ bearerAuth: [] }],
      summary: 'Get current client performance records',
      parameters: [{ name: 'clientId', in: 'path', required: true, schema: { type: 'string' } }],
      responses: { 200: { description: 'Current performance records', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/CurrentMark' } } } } }, ...authResponses },
    },
  },
  '/clients/{clientId}/exercises/{exerciseId}/performances': {
    get: {
      tags: ['Performances'],
      security: [{ bearerAuth: [] }],
      summary: 'Get performance history',
      parameters: [{ name: 'clientId', in: 'path', required: true, schema: { type: 'string' } }, { name: 'exerciseId', in: 'path', required: true, schema: { type: 'string' } }],
      responses: { 200: { description: 'Performance history', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/PerformanceRecord' } } } } }, ...authResponses },
    },
  },
  '/clients/{id}/goal': {
    patch: {
      tags: ['Clients'], security: [{ bearerAuth: [] }], summary: 'Update the client goal and target date',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ClientGoalInput' } } } },
      responses: { 200: { description: 'Client updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/Client' } } } }, 400: { $ref: '#/components/responses/BadRequest' }, ...authResponses },
    },
  },
  '/clients/{id}/measurements': {
    get: {
      tags: ['Clients'], security: [{ bearerAuth: [] }], summary: 'List client measurements, newest first',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: { 200: { description: 'Measurement history', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/ClientMeasurement' } } } } }, ...authResponses },
    },
    post: {
      tags: ['Clients'], security: [{ bearerAuth: [] }], summary: 'Add a client measurement',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ClientMeasurementInput' } } } },
      responses: { 201: { description: 'Measurement created', content: { 'application/json': { schema: { $ref: '#/components/schemas/ClientMeasurement' } } } }, 400: { $ref: '#/components/responses/BadRequest' }, ...authResponses },
    },
  },
  '/clients/{id}/measurements/{measurementId}': {
    put: {
      tags: ['Clients'], security: [{ bearerAuth: [] }], summary: 'Correct a client measurement',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }, { name: 'measurementId', in: 'path', required: true, schema: { type: 'string' } }],
      requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ClientMeasurementInput' } } } },
      responses: { 200: { description: 'Measurement updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/ClientMeasurement' } } } }, 400: { $ref: '#/components/responses/BadRequest' }, ...authResponses },
    },
    delete: {
      tags: ['Clients'], security: [{ bearerAuth: [] }], summary: 'Delete a client measurement',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }, { name: 'measurementId', in: 'path', required: true, schema: { type: 'string' } }],
      responses: { 204: { description: 'Measurement deleted' }, ...authResponses },
    },
  },
  '/clients/{id}/training-sessions': {
    get: {
      tags: ['Training Sessions'], security: [{ bearerAuth: [] }], summary: 'List completed client training sessions',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: { 200: { description: 'Training sessions', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/TrainingSession' } } } } }, ...authResponses },
    },
  },
  '/clients/{id}/session-options': {
    get: {
      tags: ['Training Sessions'], security: [{ bearerAuth: [] }], summary: 'Get the routines a session can start from for a client',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: { 200: { description: 'Session start options', content: { 'application/json': { schema: { $ref: '#/components/schemas/SessionStartOptions' } } } }, ...authResponses },
    },
  },
  '/training-sessions': {
    get: {
      tags: ['Training Sessions'], security: [{ bearerAuth: [] }], summary: 'List recent completed training sessions for the current trainer',
      parameters: [{ name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 50, default: 10 } }],
      responses: { 200: { description: 'Recent training sessions', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/TrainingSession' } } } } }, ...authResponses },
    },
    post: {
      tags: ['Training Sessions'], security: [{ bearerAuth: [] }], summary: 'Start an individual training session',
      requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/StartTrainingSessionInput' } } } },
      responses: { 201: { description: 'Training session started (with routine exercises added in order when started from a routine)', content: { 'application/json': { schema: { $ref: '#/components/schemas/TrainingSession' } } } }, 409: { $ref: '#/components/responses/Conflict' }, ...authResponses },
    },
  },
  '/training-sessions/active': {
    get: {
      tags: ['Training Sessions'], security: [{ bearerAuth: [] }], summary: 'Get the current user active training session',
      responses: { 200: { description: 'Active training session or null', content: { 'application/json': { schema: { $ref: '#/components/schemas/TrainingSession', nullable: true } } } }, ...authResponses },
    },
  },
  '/training-sessions/{id}': {
    get: {
      tags: ['Training Sessions'], security: [{ bearerAuth: [] }], summary: 'Get training session details',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: { 200: { description: 'Training session details', content: { 'application/json': { schema: { $ref: '#/components/schemas/TrainingSession' } } } }, 404: { $ref: '#/components/responses/NotFound' }, ...authResponses },
    },
    delete: {
      tags: ['Training Sessions'], security: [{ bearerAuth: [] }], summary: 'Discard an empty training session',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: { 204: { description: 'Training session discarded' }, 409: { $ref: '#/components/responses/Conflict' }, ...authResponses },
    },
  },
  '/training-sessions/{id}/exercises': {
    post: {
      tags: ['Training Sessions'], security: [{ bearerAuth: [] }], summary: 'Add an exercise to a training session',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['exerciseId'], properties: { exerciseId: { type: 'string' } } } } } },
      responses: { 201: { description: 'Training session updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/TrainingSession' } } } }, ...authResponses },
    },
  },
  '/training-sessions/{id}/exercises/{sessionExerciseId}': {
    delete: {
      tags: ['Training Sessions'], security: [{ bearerAuth: [] }], summary: 'Remove an exercise without series',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }, { name: 'sessionExerciseId', in: 'path', required: true, schema: { type: 'string' } }],
      responses: { 200: { description: 'Training session updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/TrainingSession' } } } }, 409: { $ref: '#/components/responses/Conflict' }, ...authResponses },
    },
  },
  '/training-sessions/{id}/exercises/{sessionExerciseId}/series': {
    post: {
      tags: ['Training Sessions'], security: [{ bearerAuth: [] }], summary: 'Create a new exercise series',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }, { name: 'sessionExerciseId', in: 'path', required: true, schema: { type: 'string' } }],
      requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/PerformanceInput' } } } },
      responses: { 201: { description: 'Exercise series created', content: { 'application/json': { schema: { $ref: '#/components/schemas/PerformanceRecord' } } } }, ...authResponses },
    },
  },
  '/training-sessions/{id}/series/{recordId}': {
    put: {
      tags: ['Training Sessions'], security: [{ bearerAuth: [] }], summary: 'Update a training session series',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }, { name: 'recordId', in: 'path', required: true, schema: { type: 'string' } }],
      requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/PerformanceInput' } } } },
      responses: { 200: { description: 'Exercise series updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/PerformanceRecord' } } } }, ...authResponses },
    },
    delete: {
      tags: ['Training Sessions'], security: [{ bearerAuth: [] }], summary: 'Delete and renumber a training session series',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }, { name: 'recordId', in: 'path', required: true, schema: { type: 'string' } }],
      responses: { 204: { description: 'Exercise series deleted' }, ...authResponses },
    },
  },
  '/training-sessions/{id}/complete': {
    post: {
      tags: ['Training Sessions'], security: [{ bearerAuth: [] }], summary: 'Complete and lock a training session',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { notes: { type: 'string' } } } } } },
      responses: { 200: { description: 'Training session completed', content: { 'application/json': { schema: { $ref: '#/components/schemas/TrainingSession' } } } }, ...authResponses },
    },
  },
  '/dashboard/overview': {
    get: {
      tags: ['Dashboard'],
      security: [{ bearerAuth: [] }],
      summary: 'Get the center activity overview',
      responses: { 200: { description: 'Activity overview', content: { 'application/json': { schema: { $ref: '#/components/schemas/DashboardOverview' } } } }, ...adminResponses },
    },
  },
  '/trainers': pathItem('Trainers', 'Trainer', true),
  '/trainers/{id}': {
    get: {
      tags: ['Trainers'],
      security: [{ bearerAuth: [] }],
      summary: 'Get a trainer',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: { 200: { description: 'Trainer details', content: { 'application/json': { schema: { $ref: '#/components/schemas/Trainer' } } } }, ...adminResponses },
    },
    put: {
      tags: ['Trainers'],
      security: [{ bearerAuth: [] }],
      summary: 'Update a trainer',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/TrainerInput' } } } },
      responses: { 200: { description: 'Trainer updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/Trainer' } } } }, ...adminResponses },
    },
  },
  '/trainers/{id}/status': {
    patch: {
      tags: ['Trainers'],
      security: [{ bearerAuth: [] }],
      summary: 'Activate or deactivate a trainer',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['active'], properties: { active: { type: 'boolean' } } } } } },
      responses: { 200: { description: 'Trainer updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/Trainer' } } } }, ...adminResponses },
    },
  },
  '/trainers/{id}/access': {
    patch: {
      tags: ['Trainers'],
      security: [{ bearerAuth: [] }],
      summary: 'Change a staff member role or routine permission',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/StaffAccessInput' } } } },
      responses: {
        200: { description: 'Staff access updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/Trainer' } } } },
        409: { $ref: '#/components/responses/Conflict' },
        ...adminResponses,
      },
    },
  },
  '/trainers/{id}/password': {
    put: {
      tags: ['Trainers'],
      security: [{ bearerAuth: [] }],
      summary: 'Reset a trainer password',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['password'], properties: { password: { type: 'string', minLength: 8 } } } } } },
      responses: { 200: { description: 'Password updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/MessageResponse' } } } }, ...adminResponses },
    },
  },
});

Object.assign(openApiDocument.paths, {
  '/routines': {
    get: {
      tags: ['Routines'], security: [{ bearerAuth: [] }], summary: 'List routine templates with their ordered exercises',
      parameters: [{ name: 'includeInactive', in: 'query', description: 'Include archived templates', schema: { type: 'boolean', default: false } }],
      responses: { 200: { description: 'Routine templates', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/RoutineTemplate' } } } } }, ...authResponses },
    },
    post: {
      tags: ['Routines'], security: [{ bearerAuth: [] }], summary: 'Create a routine template (routine managers)',
      requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/RoutineTemplateInput' } } } },
      responses: { 201: { description: 'Routine template created', content: { 'application/json': { schema: { $ref: '#/components/schemas/RoutineTemplate' } } } }, 400: { $ref: '#/components/responses/BadRequest' }, ...adminResponses },
    },
  },
  '/routines/{id}': {
    get: {
      tags: ['Routines'], security: [{ bearerAuth: [] }], summary: 'Get a routine template',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: { 200: { description: 'Routine template', content: { 'application/json': { schema: { $ref: '#/components/schemas/RoutineTemplate' } } } }, 404: { $ref: '#/components/responses/NotFound' }, ...authResponses },
    },
    put: {
      tags: ['Routines'], security: [{ bearerAuth: [] }], summary: 'Replace name, notes and ordered exercises of a routine template (routine managers)',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/RoutineTemplateInput' } } } },
      responses: { 200: { description: 'Routine template updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/RoutineTemplate' } } } }, 400: { $ref: '#/components/responses/BadRequest' }, ...adminResponses },
    },
  },
  '/routines/{id}/status': {
    patch: {
      tags: ['Routines'], security: [{ bearerAuth: [] }], summary: 'Archive or restore a routine template (routine managers)',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/StatusInput' } } } },
      responses: { 200: { description: 'Routine template updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/RoutineTemplate' } } } }, ...adminResponses },
    },
  },
  '/clients/{id}/routine-plan': {
    get: {
      tags: ['Routines'], security: [{ bearerAuth: [] }], summary: 'Get the client active routine plan',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: { 200: { description: 'Active routine plan, or null when none is assigned', content: { 'application/json': { schema: { $ref: '#/components/schemas/ClientRoutinePlan', nullable: true } } } }, ...authResponses },
    },
    put: {
      tags: ['Routines'], security: [{ bearerAuth: [] }], summary: 'Assign or replace the client routine plan (routine managers)',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ClientRoutinePlanInput' } } } },
      responses: { 200: { description: 'Routine plan assigned', content: { 'application/json': { schema: { $ref: '#/components/schemas/ClientRoutinePlan' } } } }, 400: { $ref: '#/components/responses/BadRequest' }, ...adminResponses },
    },
    delete: {
      tags: ['Routines'], security: [{ bearerAuth: [] }], summary: 'Remove (deactivate) the client routine plan (routine managers)',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: { 204: { description: 'Routine plan removed' }, ...adminResponses },
    },
  },
  '/clients/{id}/routine-plan/next': {
    patch: {
      tags: ['Routines'], security: [{ bearerAuth: [] }], summary: 'Choose which routine of the plan comes next (routine managers)',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ClientRoutinePlanNextInput' } } } },
      responses: { 200: { description: 'Routine plan updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/ClientRoutinePlan' } } } }, 400: { $ref: '#/components/responses/BadRequest' }, ...adminResponses },
    },
  },
});

type OperationMetadata = {
  operationId: string;
  roles?: Array<'ADMIN' | 'TRAINER'>;
  /** Extra membership permission required on top of the role (TRAINER with canManageRoutines). */
  permission?: 'canManageRoutines';
};

const operationMetadata: Record<string, OperationMetadata> = {
  'GET /health': { operationId: 'getHealth' },
  'POST /auth/login': { operationId: 'login' },
  'POST /auth/select-tenant': { operationId: 'selectTenant' },
  'POST /auth/logout': { operationId: 'logout', roles: ['ADMIN', 'TRAINER'] },
  'GET /auth/me': { operationId: 'getCurrentUser', roles: ['ADMIN', 'TRAINER'] },
  'PUT /auth/me': { operationId: 'updateCurrentUser', roles: ['ADMIN', 'TRAINER'] },
  'PUT /auth/me/password': { operationId: 'changeCurrentUserPassword', roles: ['ADMIN', 'TRAINER'] },
  'GET /auth/tenant': { operationId: 'getCurrentTenant', roles: ['ADMIN', 'TRAINER'] },
  'PUT /auth/tenant': { operationId: 'updateCurrentTenant', roles: ['ADMIN'] },
  'GET /clients': { operationId: 'listClients', roles: ['ADMIN', 'TRAINER'] },
  'POST /clients': { operationId: 'createClient', roles: ['ADMIN'] },
  'GET /clients/{id}': { operationId: 'getClient', roles: ['ADMIN', 'TRAINER'] },
  'PUT /clients/{id}': { operationId: 'updateClient', roles: ['ADMIN'] },
  'PATCH /clients/{id}/status': { operationId: 'updateClientStatus', roles: ['ADMIN'] },
  'GET /clients/{id}/export': { operationId: 'exportClientData', roles: ['ADMIN'] },
  'POST /clients/{id}/anonymize': { operationId: 'anonymizeClient', roles: ['ADMIN'] },
  'GET /clients/{id}/training-sessions': { operationId: 'listClientTrainingSessions', roles: ['ADMIN', 'TRAINER'] },
  'GET /clients/{id}/session-options': { operationId: 'getSessionStartOptions', roles: ['ADMIN', 'TRAINER'] },
  'PATCH /clients/{id}/goal': { operationId: 'updateClientGoal', roles: ['ADMIN', 'TRAINER'] },
  'GET /clients/{id}/measurements': { operationId: 'listClientMeasurements', roles: ['ADMIN', 'TRAINER'] },
  'POST /clients/{id}/measurements': { operationId: 'createClientMeasurement', roles: ['ADMIN', 'TRAINER'] },
  'PUT /clients/{id}/measurements/{measurementId}': { operationId: 'updateClientMeasurement', roles: ['ADMIN', 'TRAINER'] },
  'DELETE /clients/{id}/measurements/{measurementId}': { operationId: 'deleteClientMeasurement', roles: ['ADMIN', 'TRAINER'] },
  'GET /exercises': { operationId: 'listExercises', roles: ['ADMIN', 'TRAINER'] },
  'POST /exercises': { operationId: 'createExercise', roles: ['ADMIN'] },
  'GET /exercises/library': { operationId: 'listExerciseLibrary', roles: ['ADMIN'] },
  'POST /exercises/library/import': { operationId: 'importExerciseLibrary', roles: ['ADMIN'] },
  'GET /exercises/{id}': { operationId: 'getExercise', roles: ['ADMIN', 'TRAINER'] },
  'PUT /exercises/{id}': { operationId: 'updateExercise', roles: ['ADMIN'] },
  'PATCH /exercises/{id}/status': { operationId: 'updateExerciseStatus', roles: ['ADMIN'] },
  'GET /clients/{clientId}/current-performances': { operationId: 'listCurrentPerformances', roles: ['ADMIN', 'TRAINER'] },
  'GET /clients/{clientId}/exercises/{exerciseId}/performances': { operationId: 'listPerformanceHistory', roles: ['ADMIN', 'TRAINER'] },
  'GET /training-sessions': { operationId: 'listTrainerSessions', roles: ['ADMIN', 'TRAINER'] },
  'POST /training-sessions': { operationId: 'startTrainingSession', roles: ['ADMIN', 'TRAINER'] },
  'GET /training-sessions/active': { operationId: 'getActiveTrainingSession', roles: ['ADMIN', 'TRAINER'] },
  'GET /training-sessions/{id}': { operationId: 'getTrainingSession', roles: ['ADMIN', 'TRAINER'] },
  'DELETE /training-sessions/{id}': { operationId: 'discardTrainingSession', roles: ['ADMIN', 'TRAINER'] },
  'POST /training-sessions/{id}/exercises': { operationId: 'addTrainingSessionExercise', roles: ['ADMIN', 'TRAINER'] },
  'DELETE /training-sessions/{id}/exercises/{sessionExerciseId}': { operationId: 'removeTrainingSessionExercise', roles: ['ADMIN', 'TRAINER'] },
  'POST /training-sessions/{id}/exercises/{sessionExerciseId}/series': { operationId: 'createTrainingSessionSeries', roles: ['ADMIN', 'TRAINER'] },
  'PUT /training-sessions/{id}/series/{recordId}': { operationId: 'updateTrainingSessionSeries', roles: ['ADMIN', 'TRAINER'] },
  'DELETE /training-sessions/{id}/series/{recordId}': { operationId: 'deleteTrainingSessionSeries', roles: ['ADMIN', 'TRAINER'] },
  'POST /training-sessions/{id}/complete': { operationId: 'completeTrainingSession', roles: ['ADMIN', 'TRAINER'] },
  'GET /routines': { operationId: 'listRoutineTemplates', roles: ['ADMIN', 'TRAINER'] },
  'POST /routines': { operationId: 'createRoutineTemplate', roles: ['ADMIN', 'TRAINER'], permission: 'canManageRoutines' },
  'GET /routines/{id}': { operationId: 'getRoutineTemplate', roles: ['ADMIN', 'TRAINER'] },
  'PUT /routines/{id}': { operationId: 'updateRoutineTemplate', roles: ['ADMIN', 'TRAINER'], permission: 'canManageRoutines' },
  'PATCH /routines/{id}/status': { operationId: 'updateRoutineTemplateStatus', roles: ['ADMIN', 'TRAINER'], permission: 'canManageRoutines' },
  'GET /clients/{id}/routine-plan': { operationId: 'getClientRoutinePlan', roles: ['ADMIN', 'TRAINER'] },
  'PUT /clients/{id}/routine-plan': { operationId: 'assignClientRoutinePlan', roles: ['ADMIN', 'TRAINER'], permission: 'canManageRoutines' },
  'DELETE /clients/{id}/routine-plan': { operationId: 'removeClientRoutinePlan', roles: ['ADMIN', 'TRAINER'], permission: 'canManageRoutines' },
  'PATCH /clients/{id}/routine-plan/next': { operationId: 'setClientRoutinePlanNext', roles: ['ADMIN', 'TRAINER'], permission: 'canManageRoutines' },
  'GET /dashboard/overview': { operationId: 'getDashboardOverview', roles: ['ADMIN'] },
  'GET /trainers': { operationId: 'listTrainers', roles: ['ADMIN'] },
  'POST /trainers': { operationId: 'createTrainer', roles: ['ADMIN'] },
  'GET /trainers/{id}': { operationId: 'getTrainer', roles: ['ADMIN'] },
  'PUT /trainers/{id}': { operationId: 'updateTrainer', roles: ['ADMIN'] },
  'PATCH /trainers/{id}/status': { operationId: 'updateTrainerStatus', roles: ['ADMIN'] },
  'PATCH /trainers/{id}/access': { operationId: 'updateStaffAccess', roles: ['ADMIN'] },
  'PUT /trainers/{id}/password': { operationId: 'resetTrainerPassword', roles: ['ADMIN'] },
};

for (const [key, metadata] of Object.entries(operationMetadata)) {
  const [method, path] = key.split(' ');
  const pathItemDocument = openApiDocument.paths[path] as Record<string, Record<string, unknown>>;
  const operation = pathItemDocument[method.toLowerCase()];
  operation.operationId = metadata.operationId;
  if (metadata.roles) {
    operation['x-tenant-scoped'] = true;
    operation['x-required-roles'] = metadata.roles;
    operation.description = `Requires a tenant-scoped JWT. Available to ${metadata.roles.join(' and ')} users.`;
    if (metadata.permission) {
      operation['x-required-permission'] = metadata.permission;
      operation.description += ' Writes are limited to routine managers: ADMIN, or TRAINER with canManageRoutines.';
    }
    const responses = operation.responses as Record<string, unknown>;
    responses['401'] ??= { $ref: '#/components/responses/Unauthorized' };
    responses['403'] ??= { $ref: '#/components/responses/Forbidden' };
    if (path.includes('{')) responses['404'] ??= { $ref: '#/components/responses/NotFound' };
    if (operation.requestBody) responses['400'] ??= { $ref: '#/components/responses/BadRequest' };
  }
}
