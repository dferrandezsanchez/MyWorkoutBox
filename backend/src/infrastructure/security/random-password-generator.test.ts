import { describe, expect, it } from 'vitest';
import { RandomPasswordGenerator } from './random-password-generator';

describe('RandomPasswordGenerator', () => {
  const generator = new RandomPasswordGenerator();

  it('produces four readable groups without look-alike characters', () => {
    for (let i = 0; i < 200; i += 1) {
      expect(generator.generate()).toMatch(/^[a-km-zA-HJ-NP-Z2-9]{4}(-[a-km-zA-HJ-NP-Z2-9]{4}){3}$/);
    }
  });

  it('does not repeat', () => {
    const passwords = new Set(Array.from({ length: 500 }, () => generator.generate()));
    expect(passwords.size).toBe(500);
  });
});
