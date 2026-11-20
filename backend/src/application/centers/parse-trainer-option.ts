import { badRequest } from '../../domain/shared/errors';
import type { CenterPersonInput } from './provision-center.use-case';

/** Parses `Nombre Apellido <correo@ejemplo.com>`, the format of the command's --trainer option. */
export function parseTrainerOption(value: string): CenterPersonInput {
  const open = value.lastIndexOf('<');
  const close = value.lastIndexOf('>');
  if (open <= 0 || close !== value.length - 1 || close < open) {
    throw badRequest(`--trainer debe tener el formato "Nombre Apellido <correo@ejemplo.com>" (recibido: ${value})`, ['trainers']);
  }
  return { name: value.slice(0, open).trim(), email: value.slice(open + 1, close).trim() };
}
