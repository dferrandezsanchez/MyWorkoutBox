import fs from 'fs/promises';
import path from 'path';
import type { PhotoStorage, UploadedPhoto } from '../../application/ports';

export class LocalPhotoStorage implements PhotoStorage {
  constructor(private readonly uploadRoot = 'uploads') {}

  async persistClientPhoto(file: UploadedPhoto): Promise<string> {
    const uploadDir = path.join(this.uploadRoot, 'clients');
    await fs.mkdir(uploadDir, { recursive: true });
    const destPath = path.join(uploadDir, file.filename);
    await fs.rename(file.tempPath, destPath);
    return `/${this.uploadRoot}/clients/${file.filename}`;
  }

  async deleteByUrl(url: string): Promise<void> {
    const filePath = url.replace(/^\//, '');
    try {
      await fs.unlink(filePath);
    } catch {
      // Missing files should not block domain operations.
    }
  }
}
