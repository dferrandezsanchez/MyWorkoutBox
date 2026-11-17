import { parseArgs } from 'util';
import { ProvisionCenterUseCase, parseTrainerOption, type ProvisionCenterResult, type ProvisionedPersonResult } from '../application/centers';
import { ApplicationError } from '../domain/shared/errors';
import prisma from '../infrastructure/prisma/prisma-client';
import { PrismaCenterRepository } from '../infrastructure/repositories/prisma-center-repository';
import { BcryptPasswordHasher } from '../infrastructure/security/bcrypt-password-hasher';
import { RandomPasswordGenerator } from '../infrastructure/security/random-password-generator';

const USAGE = `Crea un centro nuevo con su administrador.

Uso:
  node dist/main/create-center.js --name "Nombre del centro" --admin-name "Nombre Apellido" --admin-email correo@ejemplo.com \\
    [--trainer "Nombre Apellido <correo@ejemplo.com>"] [opciones]

Opciones:
  --name              Nombre del centro (obligatorio)
  --admin-name        Nombre del administrador (obligatorio)
  --admin-email       Email del administrador (obligatorio)
  --trainer           Entrenador que se crea junto al centro, con el formato
                      "Nombre Apellido <correo@ejemplo.com>". Se puede repetir.
  --slug              Identificador del centro (por defecto, derivado del nombre)
  --admin-password    Contraseña. Si se omite se genera una segura y se muestra una sola vez.
                      Evítala: queda en el historial de la terminal.
  --no-starter-exercises   No cargar el catálogo inicial de ejercicios
  --dry-run           Comprueba los datos y muestra qué se crearía, sin escribir nada
  --help              Muestra esta ayuda
`;

function describePerson(label: string, person: ProvisionedPersonResult): string[] {
  const line = `${label} ${person.name} <${person.email}>`;
  if (person.generatedPassword) return [line, `  Contraseña inicial: ${person.generatedPassword}`];
  return [person.created ? line : `${line}\n  Ese email ya tenía cuenta: conserva su contraseña y ahora también entra en este centro.`];
}

function describe(result: ProvisionCenterResult): string[] {
  const header = [`Centro:        ${result.name}`, `Identificador: ${result.slug}`];
  const people = (label: string, person: ProvisionedPersonResult) => `${label} ${person.name} <${person.email}>`;

  if (result.status === 'dry-run') {
    return [
      'SIMULACIÓN: no se ha escrito nada.',
      ...header,
      people('Administrador:', result.admin),
      ...result.trainers.map((trainer) => people('Entrenador:   ', trainer)),
      `Ejercicios iniciales que se cargarían: ${result.exercisesCreated}`,
    ];
  }
  if (result.status === 'exists') {
    return ['Ese centro ya existe. No se ha cambiado nada.', ...header, 'Si querías crear otro, usa otro nombre o --slug.'];
  }

  const hasPasswords = [result.admin, ...result.trainers].some((person) => person.generatedPassword);
  return [
    'Centro creado.',
    ...header,
    `Ejercicios iniciales: ${result.exercisesCreated}`,
    '',
    ...describePerson('Administrador:', result.admin),
    ...result.trainers.flatMap((trainer) => describePerson('Entrenador:   ', trainer)),
    ...(hasPasswords
      ? ['', 'Las contraseñas se muestran UNA SOLA VEZ: guárdalas ahora y entrégalas por un canal privado.', 'Cada persona puede cambiar la suya desde «Cuenta».']
      : []),
  ];
}

async function main(): Promise<number> {
  const { values } = parseArgs({
    options: {
      name: { type: 'string' },
      'admin-name': { type: 'string' },
      'admin-email': { type: 'string' },
      'admin-password': { type: 'string' },
      trainer: { type: 'string', multiple: true },
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
    trainers: (values.trainer ?? []).map(parseTrainerOption),
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
