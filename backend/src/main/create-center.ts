import { parseArgs } from 'util';
import { ProvisionCenterUseCase, type ProvisionCenterResult } from '../application/centers';
import { ApplicationError } from '../domain/shared/errors';
import prisma from '../infrastructure/prisma/prisma-client';
import { PrismaCenterRepository } from '../infrastructure/repositories/prisma-center-repository';
import { BcryptPasswordHasher } from '../infrastructure/security/bcrypt-password-hasher';
import { RandomPasswordGenerator } from '../infrastructure/security/random-password-generator';

const USAGE = `Crea un centro nuevo con su administrador.

Uso:
  node dist/main/create-center.js --name "Nombre del centro" --admin-name "Nombre Apellido" --admin-email correo@ejemplo.com [opciones]

Opciones:
  --name              Nombre del centro (obligatorio)
  --admin-name        Nombre del administrador (obligatorio)
  --admin-email       Email del administrador (obligatorio)
  --slug              Identificador del centro (por defecto, derivado del nombre)
  --admin-password    Contraseña. Si se omite se genera una segura y se muestra una sola vez.
                      Evítala: queda en el historial de la terminal.
  --no-starter-exercises   No cargar el catálogo inicial de ejercicios
  --dry-run           Comprueba los datos y muestra qué se crearía, sin escribir nada
  --help              Muestra esta ayuda
`;

function describe(result: ProvisionCenterResult): string[] {
  const lines = [`Centro:        ${result.name}`, `Identificador: ${result.slug}`, `Administrador: ${result.adminEmail}`];

  if (result.status === 'dry-run') {
    return [
      'SIMULACIÓN: no se ha escrito nada.',
      ...lines,
      `Ejercicios iniciales que se cargarían: ${result.exercisesCreated}`,
    ];
  }
  if (result.status === 'exists') {
    return [
      'Ese centro ya existe. No se ha cambiado nada.',
      ...lines,
      'Si querías crear otro, usa otro nombre o --slug.',
    ];
  }

  const out = ['Centro creado.', ...lines, `Ejercicios iniciales: ${result.exercisesCreated}`, ''];
  if (result.generatedPassword) {
    out.push(
      'Contraseña inicial (se muestra una sola vez, guárdala ahora):',
      `  ${result.generatedPassword}`,
      '',
      'Entrégasela por un canal privado. Puede cambiarla desde «Cuenta».',
    );
  } else {
    out.push('Ese email ya tenía cuenta: conserva su contraseña y ahora también puede entrar en este centro.');
  }
  return out;
}

async function main(): Promise<number> {
  const { values } = parseArgs({
    options: {
      name: { type: 'string' },
      'admin-name': { type: 'string' },
      'admin-email': { type: 'string' },
      'admin-password': { type: 'string' },
      slug: { type: 'string' },
      'no-starter-exercises': { type: 'boolean', default: false },
      'dry-run': { type: 'boolean', default: false },
      help: { type: 'boolean', default: false },
    },
  });

  if (values.help) {
    console.log(USAGE);
    return 0;
  }

  const useCase = new ProvisionCenterUseCase(new PrismaCenterRepository(), new BcryptPasswordHasher(), new RandomPasswordGenerator());
  const result = await useCase.execute({
    name: values.name ?? '',
    adminName: values['admin-name'] ?? '',
    adminEmail: values['admin-email'] ?? '',
    adminPassword: values['admin-password'],
    slug: values.slug,
    starterExercises: !values['no-starter-exercises'],
    dryRun: values['dry-run'],
  });
  console.log(describe(result).join('\n'));
  return 0;
}

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error: unknown) => {
    if (error instanceof ApplicationError) {
      console.error(`Error: ${error.message}\n\n${USAGE}`);
    } else if (error instanceof TypeError && 'code' in error) {
      console.error(`Error: ${error.message}\n\n${USAGE}`);
    } else {
      console.error('Error inesperado:', error);
    }
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
