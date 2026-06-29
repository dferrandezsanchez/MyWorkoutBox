import { describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../index';

describe('OpenAPI documentation', () => {
  it('serves the OpenAPI JSON document', async () => {
    const response = await request(app)
      .get('/openapi.json')
      .expect(200)
      .expect('Content-Type', /json/);

    expect(response.body.openapi).toBe('3.0.3');
    expect(response.body.info.title).toBe('MyWorkoutBox API');
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
  });

  it('serves Swagger UI', async () => {
    const response = await request(app)
      .get('/docs')
      .expect(200)
      .expect('Content-Type', /html/);

    expect(response.text).toContain('SwaggerUIBundle');
    expect(response.text).toContain('/openapi.json');
  });
});
