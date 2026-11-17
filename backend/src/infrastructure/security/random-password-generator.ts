import { randomInt } from 'crypto';
import type { PasswordGenerator } from '../../application/ports';

/** No 0/O, 1/l/I: the password is dictated or typed from a screen, so look-alikes are avoided. */
const ALPHABET = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const GROUPS = 4;
const GROUP_LENGTH = 4;

export class RandomPasswordGenerator implements PasswordGenerator {
  /** Four groups of four characters, e.g. `Hk7p-9mQx-Tr3w-Zc8n` (about 91 bits). */
  generate(): string {
    return Array.from({ length: GROUPS }, () =>
      Array.from({ length: GROUP_LENGTH }, () => ALPHABET[randomInt(ALPHABET.length)]).join(''),
    ).join('-');
  }
}
