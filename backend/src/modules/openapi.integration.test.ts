import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import app from '../index';

type OpenApiOperation = {
  operationId?: string;
  security?: Array<Record<string, string[]>>;
  requestBody?: { required?: boolean };
  responses?: Record<string, unknown>;
  'x-tenant-scoped'?: boolean;
  'x-required-roles'?: string[];
};

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete'] as const;

function documentedOperations(paths: Record<string, Record<string, OpenApiOperation>>): string[] {
  return Object.entries(paths).flatMap(([path, pathItem]) => HTTP_METHODS
    .filter((method) => pathItem[method])
    .map((method) => `${method.toUpperCase()} ${path}`));
}

function expressOperations(): string[] {
  const routeFiles: Array<[string, string]> = [
    ['auth.routes.ts', '/auth'],
    ['clients.routes.ts', '/clients'],
    ['exercises.routes.ts', '/exercises'],
    ['trainers.routes.ts', '/trainers'],
    ['training-sessions.routes.ts', '/training-sessions'],
    ['performances.routes.ts', ''],
  ];
  const operations = ['GET /health'];

  for (const [file, prefix] of routeFiles) {
    const source = readFileSync(resolve(process.cwd(), 'src/interfaces/http/routes', file), 'utf8');
    const routePattern = /router\.(get|post|put|patch|delete)\('([^']+)'/g;
    for (const match of source.matchAll(routePattern)) {
      const path = `${prefix}${match[2] === '/' ? '' : match[2]}`.replace(/:([A-Za-z]+)/g, '{$1}');
      operations.push(`${match[1].toUpperCase()} ${path || '/'}`);
    }
  }
  return operations.sort((left, right) => left.localeCompare(right));
}

function collectRefs(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(collectRefs);
  if (!value || typeof value !== 'object') return [];
  return Object.entries(value).flatMap(([key, child]) => key === '$ref' && typeof child === 'string'
    ? [child]
    : collectRefs(child));
}

describe('OpenAPI documentation', () => {
  it('serves the OpenAPI JSON document', async () => {
    const response = await request(app)
      .get('/openapi.json')
      .expect(200)
      .expect('Content-Type', /json/);

    expect(response.body.openapi).toBe('3.0.3');
    expect(response.body.info.title).toBe('MyWorkoutBox API');
    expect(response.body.info.version).toBe('0.6.0-alpha');
    expect(response.body.servers[0]).toEqual({ url: '.', description: 'Current environment' });
    expect(response.body.components.securitySchemes.bearerAuth).toMatchObject({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    });
  });

  it('documents the main public API surface', async () => {
    const { body } = await request(app).get('/openapi.json').expect(200);
    const expectedPaths = [
      '/health',
      '/auth/login',
      '/auth/select-tenant',
      '/auth/me',
      '/auth/tenant',
      '/clients',
      '/clients/{id}',
      '/clients/{id}/export',
      '/clients/{id}/anonymize',
      '/exercises',
      '/exercises/{id}',
      '/clients/{clientId}/current-performances',
      '/clients/{clientId}/exercises/{exerciseId}/performances',
      '/clients/{id}/training-sessions',
      '/training-sessions',
      '/training-sessions/active',
      '/training-sessions/{id}',
      '/training-sessions/{id}/exercises',
      '/training-sessions/{id}/exercises/{sessionExerciseId}/series',
      '/training-sessions/{id}/complete',
      '/trainers',
      '/trainers/{id}',
      '/trainers/{id}/password',
    ];

    for (const path of expectedPaths) {
      expect(body.paths, `OpenAPI spec must document ${path}`).toHaveProperty(path);
    }
    expect(body.paths).not.toHaveProperty('/clients/{id}/photo');
    expect(body.components.schemas.Client.properties).not.toHaveProperty('photoUrl');
    expect(body.components.schemas.Client.properties).not.toHaveProperty('photoConsentAt');
    expect(body.components.schemas.Client.properties).not.toHaveProperty('sessionExerciseId');
    expect(body.components.schemas.PerformanceRecord.properties).toHaveProperty('sessionExerciseId');
    expect(body.components.schemas.ClientExport).toMatchObject({
      required: ['client', 'performances', 'trainingSessions'],
    });
    expect(body.paths['/clients/{id}/export'].get.responses[200].content['application/json'].schema).toEqual({
      $ref: '#/components/schemas/ClientExport',
    });
    expect(body.paths['/clients/{clientId}/exercises/{exerciseId}/performances']).not.toHaveProperty('post');
    expect(body.paths['/training-sessions']).toHaveProperty('get');
    expect(body.components.schemas.CurrentMark.properties.recentRecords.maxItems).toBe(6);
    expect(body.components.schemas.ClientCreateInput.allOf[1].required).toEqual(['firstName', 'lastName', 'birthDate']);
    expect(body.components.schemas.ExerciseCreateInput.allOf[1].required).toEqual(['name', 'category', 'defaultUnit']);
    expect(body.components.schemas.TrainerCreateInput.allOf[1].required).toEqual(['name', 'email', 'password']);
    expect(body.components.schemas.TrainerInput.properties).not.toHaveProperty('password');
  });

  it('matches every Express API route and method', async () => {
    const { body } = await request(app).get('/openapi.json').expect(200);
    expect(documentedOperations(body.paths).sort((left, right) => left.localeCompare(right))).toEqual(expressOperations());
  });

  it('provides stable operation IDs, tenant roles, security and required request bodies', async () => {
    const { body } = await request(app).get('/openapi.json').expect(200);
    const operations = Object.values(body.paths as Record<string, Record<string, OpenApiOperation>>)
      .flatMap((pathItem) => HTTP_METHODS.map((method) => pathItem[method]).filter(Boolean));
    const operationIds = operations.map((operation) => operation.operationId);

    expect(operationIds.every(Boolean)).toBe(true);
    expect(new Set(operationIds).size).toBe(operationIds.length);

    for (const operation of operations.filter((item) => item['x-tenant-scoped'])) {
      expect(operation.security).toEqual([{ bearerAuth: [] }]);
      expect(operation['x-required-roles']?.length).toBeGreaterThan(0);
      expect(operation.responses).toHaveProperty('401');
      expect(operation.responses).toHaveProperty('403');
    }

    for (const operation of operations.filter((item) => item.requestBody)) {
      const mayHaveEmptyBody = operation.operationId === 'completeTrainingSession';
      expect(operation.requestBody?.required).toBe(mayHaveEmptyBody ? undefined : true);
    }
  });

  it('defines every path parameter and a successful response for every operation', async () => {
    const { body } = await request(app).get('/openapi.json').expect(200);
    for (const [path, pathItem] of Object.entries(body.paths as Record<string, Record<string, OpenApiOperation & { parameters?: Array<{ name: string; in: string; required?: boolean }> }>>)) {
      const placeholders = path.split('/')
        .filter((segment) => segment.startsWith('{') && segment.endsWith('}'))
        .map((segment) => segment.slice(1, -1))
        .sort((left, right) => left.localeCompare(right));
      for (const method of HTTP_METHODS) {
        const operation = pathItem[method];
        if (!operation) continue;
        const parameters = (operation.parameters ?? [])
          .filter((parameter) => parameter.in === 'path' && parameter.required)
          .map((parameter) => parameter.name)
          .sort((left, right) => left.localeCompare(right));
        expect(parameters, `${method.toUpperCase()} ${path} path parameters`).toEqual(placeholders);
        expect(Object.keys(operation.responses ?? {}).some((status) => status.startsWith('2'))).toBe(true);
      }
    }
  });

  it('contains only resolvable local component references', async () => {
    const { body } = await request(app).get('/openapi.json').expect(200);
    for (const ref of collectRefs(body)) {
      expect(ref).toMatch(/^#\/components\/(schemas|responses|securitySchemes)\/[A-Za-z0-9]+$/);
      const segments = ref.slice(2).split('/');
      let target: unknown = body;
      for (const segment of segments) target = (target as Record<string, unknown>)[segment];
      expect(target, `Missing OpenAPI reference ${ref}`).toBeDefined();
    }
  });

  it('serves Swagger UI', async () => {
    const response = await request(app)
      .get('/docs')
      .expect(200)
      .expect('Content-Type', /html/);

    expect(response.text).toContain('SwaggerUIBundle');
    expect(response.text).toContain("url: './openapi.json'");
  });
});
