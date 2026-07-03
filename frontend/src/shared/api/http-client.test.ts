import { beforeEach, describe, expect, it, vi } from 'vitest';
import apiClient, { configureApiClient } from './http-client';
import type { AxiosAdapter } from 'axios';

describe('apiClient', () => {
  beforeEach(() => {
    configureApiClient({
      getToken: () => null,
      onUnauthorized: () => {},
    });
    apiClient.defaults.adapter = undefined;
  });

  it('adds bearer authorization when a token is available', async () => {
    let capturedAuthorization: unknown;
    const adapter: AxiosAdapter = async (config) => {
      capturedAuthorization = config.headers.Authorization;
      return {
        data: { ok: true },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    };

    configureApiClient({ getToken: () => 'jwt-token' });
    apiClient.defaults.adapter = adapter;

    await apiClient.get('/clients');

    expect(capturedAuthorization).toBe('Bearer jwt-token');
  });

  it('calls the unauthorized handler on protected 401 responses', async () => {
    const onUnauthorized = vi.fn();
    const adapter: AxiosAdapter = async (config) => {
      throw {
        config,
        response: { status: 401 },
      };
    };

    configureApiClient({ onUnauthorized });
    apiClient.defaults.adapter = adapter;

    await expect(apiClient.get('/clients')).rejects.toMatchObject({
      response: { status: 401 },
    });

    expect(onUnauthorized).toHaveBeenCalledOnce();
  });

  it('does not call the unauthorized handler for login 401 responses', async () => {
    const onUnauthorized = vi.fn();
    const adapter: AxiosAdapter = async (config) => {
      throw {
        config,
        response: { status: 401 },
      };
    };

    configureApiClient({ onUnauthorized });
    apiClient.defaults.adapter = adapter;

    await expect(apiClient.post('/auth/login', {})).rejects.toMatchObject({
      response: { status: 401 },
    });

    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it('does not call the unauthorized handler for tenant selection 401 responses', async () => {
    const onUnauthorized = vi.fn();
    apiClient.defaults.adapter = async (config) => {
      throw { config, response: { status: 401 } };
    };
    configureApiClient({ onUnauthorized });

    await expect(apiClient.post('/auth/select-tenant', {})).rejects.toMatchObject({
      response: { status: 401 },
    });
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it('uses the unauthorized fallback when a 401 has no request metadata', async () => {
    const onUnauthorized = vi.fn();
    apiClient.defaults.adapter = async () => {
      throw { response: { status: 401 } };
    };
    configureApiClient({ onUnauthorized });

    await expect(apiClient.get('/clients')).rejects.toMatchObject({ response: { status: 401 } });
    expect(onUnauthorized).toHaveBeenCalledOnce();
  });

  it('propagates forbidden responses without treating them as an expired session', async () => {
    const onUnauthorized = vi.fn();
    apiClient.defaults.adapter = async (config) => {
      throw { config, response: { status: 403 } };
    };
    configureApiClient({ onUnauthorized });

    await expect(apiClient.get('/admin/settings')).rejects.toMatchObject({ response: { status: 403 } });
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it('does not add authorization when no token is configured', async () => {
    let capturedAuthorization: unknown = 'unset';
    const adapter: AxiosAdapter = async (config) => {
      capturedAuthorization = config.headers.Authorization;
      return {
        data: { ok: true },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    };

    apiClient.defaults.adapter = adapter;

    await apiClient.get('/health');

    expect(capturedAuthorization).toBeUndefined();
  });
});
