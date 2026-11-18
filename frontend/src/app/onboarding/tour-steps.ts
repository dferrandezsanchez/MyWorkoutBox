import type { AppMode } from '@app/mode/app-mode';

export interface TourStep {
  /** `data-tour` anchor to highlight. Without it the step is shown centred. */
  target?: string;
  title: string;
  body: string;
}

export const TOUR_STEPS: Record<AppMode, TourStep[]> = {
  trainer: [
    {
      title: 'Bienvenido a STELIOS',
      body: 'Te enseñamos en un minuto dónde está cada cosa. Puedes saltarlo cuando quieras.',
    },
    {
      target: 'trainer-home',
      title: 'Inicio',
      body: 'Tu resumen del día: actividad reciente y lo que tienes pendiente.',
    },
    {
      target: 'trainer-train',
      title: 'Entrenar',
      body: 'Inicia una sesión con un cliente y registra sus marcas mientras entrena.',
    },
    {
      target: 'trainer-clients',
      title: 'Clientes',
      body: 'Consulta el perfil de cada cliente, su histórico de marcas y su evolución.',
    },
    {
      target: 'user-menu',
      title: 'Tu cuenta',
      body: 'Desde aquí gestionas tu cuenta y vuelves a abrir esta guía cuando quieras.',
    },
  ],
  admin: [
    {
      title: 'Bienvenido a STELIOS',
      body: 'Este es el panel de administración del centro. Te enseñamos lo esencial en un minuto.',
    },
    {
      target: 'admin-clients',
      title: 'Clientes',
      body: 'Da de alta y edita clientes, y gestiona sus datos conforme al RGPD.',
    },
    {
      target: 'admin-trainers',
      title: 'Equipo',
      body: 'Crea entrenadores y activa o desactiva su acceso al centro.',
    },
    {
      target: 'admin-exercises',
      title: 'Ejercicios',
      body: 'Define los ejercicios evaluables con los que se registran las marcas.',
    },
    {
      target: 'admin-settings',
      title: 'Ajustes',
      body: 'Configura los datos y las preferencias de tu centro.',
    },
    {
      target: 'user-menu',
      title: 'Tu cuenta',
      body: 'Cambia al modo entrenador, gestiona tu cuenta o vuelve a abrir esta guía.',
    },
  ],
};
