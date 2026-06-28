import { mkdtemp, readFile, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { BcryptPasswordHasher } from './security/bcrypt-password-hasher';
import { JwtTokenService } from './security/jwt-token-service';
import { LocalPhotoStorage } from './storage/local-photo-storage';
import { SystemClock } from './time/system-clock';

describe('infrastructure adapters', () => {
  it('hashes and verifies passwords', async () => {
    const hasher = new BcryptPasswordHasher(4);
    const hash = await hasher.hash('Secret1234!');

    expect(hash).not.toBe('Secret1234!');
    expect(await hasher.compare('Secret1234!', hash)).toBe(true);
    expect(await hasher.compare('wrong', hash)).toBe(false);
  });

  it('signs and verifies tenant and selection JWTs', () => {
    const service = new JwtTokenService('test-secret', '1h');
    const tenantToken = service.signTenantToken({
      userId: 'user-1',
      tenantId: 'tenant-1',
      organizationId: 'org-1',
      role: 'ADMIN',
    });
    const selectionToken = service.signSelectionToken('user-1');

    expect(service.verify(tenantToken)).toMatchObject({
      sub: 'user-1',
      tenantId: 'tenant-1',
      organizationId: 'org-1',
      role: 'ADMIN',
    });
    expect(service.verify(selectionToken)).toMatchObject({
      sub: 'user-1',
      purpose: 'tenant-selection',
    });
  });

  it('rejects missing secrets and invalid tokens', () => {
    expect(() => new JwtTokenService(undefined).signSelectionToken('user-1')).toThrow('Error interno del servidor');
    expect(() => new JwtTokenService('test-secret').verify('invalid-token')).toThrow('No autenticado');
  });

  it('persists and deletes local client photos', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'mwb-uploads-'));
    const tempFile = path.join(root, 'temp-photo');
    await writeFile(tempFile, 'image-bytes');

    const storage = new LocalPhotoStorage(root);
    const url = await storage.persistClientPhoto({ tempPath: tempFile, filename: 'photo.jpg' });

    expect(url).toBe(`/${root}/clients/photo.jpg`);
    expect(await readFile(path.join(root, 'clients', 'photo.jpg'), 'utf8')).toBe('image-bytes');

    await storage.deleteByUrl(url);
    await expect(readFile(path.join(root, 'clients', 'photo.jpg'))).rejects.toThrow();
    await expect(storage.deleteByUrl(url)).resolves.toBeUndefined();
  });

  it('returns the current time from system clock', () => {
    expect(new SystemClock().now()).toBeInstanceOf(Date);
  });
});
