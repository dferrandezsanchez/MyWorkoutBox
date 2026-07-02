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
    title: 'MyWorkoutBox API',
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
        required: ['id', 'name', 'email', 'role', 'tenantId', 'organizationId'],
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          role: { $ref: '#/components/schemas/Role' },
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
        required: ['id', 'organizationId', 'name', 'slug', 'appName', 'shortName', 'mark'],
        properties: {
          id: { type: 'string' },
          organizationId: { type: 'string' },
          name: { type: 'string' },
          slug: { type: 'string' },
          appName: { type: 'string' },
          shortName: { type: 'string' },
          mark: { type: 'string' },
          claim: { type: 'string' },
          description: { type: 'string' },
          primary: { type: 'string', example: '#2563EB' },
          primaryHover: { type: 'string', example: '#1D4ED8' },
          primarySoft: { type: 'string', example: '#93C5FD' },
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
      TenantUpdateInput: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          appName: { type: 'string' },
          shortName: { type: 'string' },
          mark: { type: 'string' },
          claim: { type: 'string' },
          description: { type: 'string' },
          primary: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$', example: '#2563EB' },
          primaryHover: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$', example: '#1D4ED8' },
          primarySoft: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$', example: '#93C5FD' },
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
          notes: { type: 'string', example: 'Objetivo: mejorar fuerza relativa.' },
          status: { $ref: '#/components/schemas/Status' },
        },
      },
      ClientCreateInput: {
        allOf: [
          { $ref: '#/components/schemas/ClientInput' },
          { type: 'object', required: ['firstName', 'lastName', 'birthDate'] },
        ],
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
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          client: { $ref: '#/components/schemas/Client' },
          exercises: { type: 'array', items: { $ref: '#/components/schemas/TrainingSessionExercise' } },
        },
      },
      ClientExport: {
        type: 'object',
        required: ['client', 'performances', 'trainingSessions'],
        properties: {
          client: { $ref: '#/components/schemas/Client' },
          performances: { type: 'array', items: { $ref: '#/components/schemas/PerformanceRecord' } },
          trainingSessions: { type: 'array', items: { $ref: '#/components/schemas/TrainingSession' } },
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
          status: { $ref: '#/components/schemas/Status' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      ExerciseInput: {
        type: 'object',
        properties: {
          name: { type: 'string', example: 'Dominadas' },
          category: { type: 'string', example: 'strength' },
          movementPattern: { type: 'string', example: 'pull' },
          evaluationType: { type: 'string', example: 'repetitions' },
          improvementDirection: { type: 'string', example: 'higher' },
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
        required: ['id', 'name', 'email', 'role', 'active'],
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          role: { $ref: '#/components/schemas/Role' },
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
        summary: 'Update active tenant branding',
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
  '/clients/{id}/training-sessions': {
    get: {
      tags: ['Training Sessions'], security: [{ bearerAuth: [] }], summary: 'List completed client training sessions',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: { 200: { description: 'Training sessions', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/TrainingSession' } } } } }, ...authResponses },
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
      requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['clientId'], properties: { clientId: { type: 'string' } } } } } },
      responses: { 201: { description: 'Training session started', content: { 'application/json': { schema: { $ref: '#/components/schemas/TrainingSession' } } } }, 409: { $ref: '#/components/responses/Conflict' }, ...authResponses },
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

type OperationMetadata = {
  operationId: string;
  roles?: Array<'ADMIN' | 'TRAINER'>;
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
  'GET /exercises': { operationId: 'listExercises', roles: ['ADMIN', 'TRAINER'] },
  'POST /exercises': { operationId: 'createExercise', roles: ['ADMIN'] },
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
  'GET /trainers': { operationId: 'listTrainers', roles: ['ADMIN'] },
  'POST /trainers': { operationId: 'createTrainer', roles: ['ADMIN'] },
  'GET /trainers/{id}': { operationId: 'getTrainer', roles: ['ADMIN'] },
  'PUT /trainers/{id}': { operationId: 'updateTrainer', roles: ['ADMIN'] },
  'PATCH /trainers/{id}/status': { operationId: 'updateTrainerStatus', roles: ['ADMIN'] },
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
    const responses = operation.responses as Record<string, unknown>;
    responses['401'] ??= { $ref: '#/components/responses/Unauthorized' };
    responses['403'] ??= { $ref: '#/components/responses/Forbidden' };
    if (path.includes('{')) responses['404'] ??= { $ref: '#/components/responses/NotFound' };
    if (operation.requestBody) responses['400'] ??= { $ref: '#/components/responses/BadRequest' };
  }
}
