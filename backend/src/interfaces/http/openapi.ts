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
    version: '0.4.0-alpha',
    description:
      'HTTP API for managing training centers, clients, trainers, sessions, measurable exercises, and performance records.',
  },
  servers: [
    { url: 'http://localhost:3000', description: 'Local development' },
    { url: 'https://app.example.com/api', description: 'Production behind reverse proxy' },
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
          error: { type: 'string' },
          fields: { type: 'array', items: { type: 'string' } },
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
        required: ['id', 'tenantId', 'firstName', 'lastName', 'birthDate', 'status'],
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
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          birthDate: { type: 'string', format: 'date' },
          height: { type: 'number' },
          weight: { type: 'number' },
          bodyFatPercentage: { type: 'number' },
          notes: { type: 'string' },
        },
      },
      TrainingSessionExercise: {
        type: 'object',
        required: ['id', 'exerciseId', 'position', 'exercise', 'series'],
        properties: {
          id: { type: 'string' },
          exerciseId: { type: 'string' },
          position: { type: 'integer' },
          exercise: { $ref: '#/components/schemas/Exercise' },
          series: { type: 'array', items: { $ref: '#/components/schemas/PerformanceRecord' } },
        },
      },
      TrainingSession: {
        type: 'object',
        required: ['id', 'clientId', 'trainerId', 'status', 'startedAt', 'client', 'exercises'],
        properties: {
          id: { type: 'string' },
          clientId: { type: 'string' },
          trainerId: { type: 'string' },
          trainerName: { type: 'string' },
          status: { type: 'string', enum: ['ACTIVE', 'COMPLETED'] },
          startedAt: { type: 'string', format: 'date-time' },
          completedAt: { type: 'string', format: 'date-time', nullable: true },
          notes: { type: 'string', nullable: true },
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
        required: ['id', 'tenantId', 'name', 'category', 'defaultUnit', 'status'],
        properties: {
          id: { type: 'string' },
          tenantId: { type: 'string' },
          name: { type: 'string' },
          category: { type: 'string' },
          movementPattern: { type: 'string' },
          evaluationType: { type: 'string' },
          improvementDirection: { type: 'string' },
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
          name: { type: 'string' },
          category: { type: 'string' },
          movementPattern: { type: 'string' },
          evaluationType: { type: 'string' },
          improvementDirection: { type: 'string' },
          defaultUnit: { $ref: '#/components/schemas/PerformanceUnit' },
          measurementFields: { type: 'array', items: { type: 'object' } },
          variantGroups: { type: 'array', items: { type: 'object' } },
          description: { type: 'string' },
          status: { $ref: '#/components/schemas/Status' },
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
        properties: {
          exerciseId: { type: 'string' },
          exerciseName: { type: 'string' },
          record: { $ref: '#/components/schemas/PerformanceRecord' },
          bestRecord: { $ref: '#/components/schemas/PerformanceRecord' },
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
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
          active: { type: 'boolean' },
        },
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
        requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' }, email: { type: 'string', format: 'email' } } } } } },
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
        requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/Tenant' } } } },
        responses: {
          200: { description: 'Tenant updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/Tenant' } } } },
          400: { $ref: '#/components/responses/BadRequest' },
          ...adminResponses,
        },
      },
    },
  },
};

const pathItem = (tag: string, schema: string, adminOnly = false) => ({
  get: {
    tags: [tag],
    security: [{ bearerAuth: [] }],
    summary: `List ${tag.toLowerCase()}`,
    parameters: [{ name: 'includeInactive', in: 'query', schema: { type: 'boolean' } }],
    responses: {
      200: { description: 'Resource list', content: { 'application/json': { schema: { type: 'array', items: { $ref: `#/components/schemas/${schema}` } } } } },
      ...(adminOnly ? adminResponses : authResponses),
    },
  },
  post: {
    tags: [tag],
    security: [{ bearerAuth: [] }],
    summary: `Create ${tag.toLowerCase()}`,
    requestBody: { content: { 'application/json': { schema: { $ref: `#/components/schemas/${schema}Input` } } } },
    responses: {
      201: { description: 'Resource created', content: { 'application/json': { schema: { $ref: `#/components/schemas/${schema}` } } } },
      400: { $ref: '#/components/responses/BadRequest' },
      ...adminResponses,
    },
  },
});

Object.assign(openApiDocument.paths, {
  '/clients': pathItem('Clients', 'Client'),
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
      requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/ClientInput' } } } },
      responses: { 200: { description: 'Client updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/Client' } } } }, ...adminResponses },
    },
  },
  '/clients/{id}/status': {
    patch: {
      tags: ['Clients'],
      security: [{ bearerAuth: [] }],
      summary: 'Activate or deactivate a client',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/StatusInput' } } } },
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
      requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/ExerciseInput' } } } },
      responses: { 200: { description: 'Exercise updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/Exercise' } } } }, ...adminResponses },
    },
  },
  '/exercises/{id}/status': {
    patch: {
      tags: ['Exercises'],
      security: [{ bearerAuth: [] }],
      summary: 'Activate or deactivate an exercise',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/StatusInput' } } } },
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
      requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/TrainerInput' } } } },
      responses: { 200: { description: 'Trainer updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/Trainer' } } } }, ...adminResponses },
    },
  },
  '/trainers/{id}/status': {
    patch: {
      tags: ['Trainers'],
      security: [{ bearerAuth: [] }],
      summary: 'Activate or deactivate a trainer',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      requestBody: { content: { 'application/json': { schema: { type: 'object', required: ['active'], properties: { active: { type: 'boolean' } } } } } },
      responses: { 200: { description: 'Trainer updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/Trainer' } } } }, ...adminResponses },
    },
  },
  '/trainers/{id}/password': {
    put: {
      tags: ['Trainers'],
      security: [{ bearerAuth: [] }],
      summary: 'Reset a trainer password',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      requestBody: { content: { 'application/json': { schema: { type: 'object', required: ['password'], properties: { password: { type: 'string', minLength: 8 } } } } } },
      responses: { 200: { description: 'Password updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/MessageResponse' } } } }, ...adminResponses },
    },
  },
});
