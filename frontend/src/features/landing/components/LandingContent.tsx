import { useEffect, useState, type ReactNode } from 'react';
import {
  ArrowRight,
  BarChart3,
  Check,
  Clock3,
  Dumbbell,
  GitFork,
  Lock,
  Menu,
  Palette,
  PlayCircle,
  ShieldCheck,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '@features/auth/api/auth.api';
import { setStoredTenantBrand, setToken } from '@features/auth/model/auth-store';
import { PLATFORM_BRAND } from '@shared/config/branding';
import { queryClient } from '@shared/state/query-client';
import adminMobile from '../assets/admin-mobile.webp';
import personalTraining from '../assets/personal-training.webp';
import trainerSession from '../assets/trainer-session.webp';

interface LandingContentProps {
  appPath: '/login' | '/admin' | '/trainer';
  authenticated: boolean;
}

const benefits = [
  {
    title: 'Clientes y entrenadores',
    description: 'Ten cada perfil, acceso y seguimiento bajo control desde un único lugar.',
    icon: Users,
    tone: 'text-blue-400 bg-blue-500/10 border-blue-500/25',
  },
  {
    title: 'Registro durante la sesión',
    description: 'Registra ejercicios y series sobre la marcha, sin interrumpir el ritmo del entrenamiento.',
    icon: Zap,
    tone: 'text-amber-300 bg-amber-400/10 border-amber-400/25',
  },
  {
    title: 'Catálogo evaluable',
    description: 'Convierte cada sesión en progreso visible con marcas e históricos comparables.',
    icon: Dumbbell,
    tone: 'text-emerald-300 bg-emerald-400/10 border-emerald-400/25',
  },
  {
    title: 'Tu marca, presente',
    description: 'Haz que la plataforma se sienta propia con el nombre y los colores de tu centro.',
    icon: Palette,
    tone: 'text-fuchsia-300 bg-fuchsia-400/10 border-fuchsia-400/25',
  },
  {
    title: 'RGPD desde el diseño',
    description: 'Exporta o anonimiza los datos de un cliente cuando lo necesites, con cada acción registrada en la auditoría.',
    icon: Lock,
    tone: 'text-sky-300 bg-sky-400/10 border-sky-400/25',
  },
];

const adminPoints = [
  'Visión operativa del centro',
  'Gestión de clientes y equipo',
  'Catálogo de ejercicios',
  'Configuración del tenant',
];

const trainerPoints = [
  'Selección rápida de cliente',
  'Sesiones sin planificación obligatoria',
  'Registro de ejercicios y series',
  'Histórico de rendimiento',
];

const demoAccounts = {
  admin: { email: 'admin-demo@gym.com', password: 'Admin1234!', path: '/admin' },
  trainer: { email: 'trainer-demo@gym.com', password: 'Trainer1234!', path: '/trainer' },
} as const;

function BrandMark({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-lg border border-blue-400/45 bg-blue-600 text-sm font-black text-white shadow-[0_10px_28px_rgba(37,99,235,0.3)] ${className}`}
      aria-hidden="true"
    >
      {PLATFORM_BRAND.mark}
    </span>
  );
}

function PrimaryLink({ to, children, className = '' }: { to: string; children: ReactNode; className?: string }) {
  return (
    <Link
      to={to}
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-blue-400/50 bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_38px_rgba(37,99,235,0.3)] transition-colors hover:bg-blue-500 focus-ring ${className}`}
    >
      {children}
    </Link>
  );
}

function ProductFrame({ src, alt, className = '' }: { src: string; alt: string; className?: string }) {
  return (
    <div className={`aspect-[0.464] overflow-hidden rounded-[22px] border border-blue-400/30 bg-[#081322] p-1.5 shadow-[0_28px_70px_rgba(0,0,0,0.55)] ${className}`}>
      <img src={src} alt={alt} className="h-full w-full rounded-[17px] object-cover object-top" />
    </div>
  );
}

function ModePoints({ points }: { points: string[] }) {
  return (
    <ul className="mt-4 space-y-2.5 text-xs text-slate-300 sm:mt-5 sm:space-y-3 sm:text-sm">
      {points.map((point) => (
        <li key={point} className="flex items-center gap-3">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-current text-blue-400">
            <Check size={12} strokeWidth={3} />
          </span>
          {point}
        </li>
      ))}
    </ul>
  );
}

export function LandingContent({ appPath, authenticated }: LandingContentProps) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [demoLoading, setDemoLoading] = useState<'admin' | 'trainer' | null>(null);
  const [demoError, setDemoError] = useState<string | null>(null);
  const accessLabel = authenticated ? 'Ir a la plataforma' : 'Entrar';

  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  const accessDemo = async (mode: keyof typeof demoAccounts) => {
    const account = demoAccounts[mode];
    setDemoLoading(mode);
    setDemoError(null);

    try {
      const response = await login(account.email, account.password);
      if ('tenantSelectionRequired' in response) {
        throw new Error('Demo account requires tenant selection');
      }
      queryClient.clear();
      setStoredTenantBrand(response.tenant);
      setToken(response.token);
      navigate(account.path);
    } catch {
      setDemoError('No hemos podido abrir la demo. Inténtalo de nuevo en unos segundos.');
    } finally {
      setDemoLoading(null);
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#050b14] text-slate-50">
      <a href="#contenido" className="sr-only z-[60] rounded-md bg-blue-600 px-4 py-3 text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
        Saltar al contenido
      </a>

      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#050b14]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <a href="#inicio" className="flex min-h-11 items-center gap-3 rounded-lg focus-ring" aria-label="MyWorkoutBox, inicio">
            <BrandMark className="h-10 w-10" />
            <span className="text-lg font-bold sm:text-xl">{PLATFORM_BRAND.appName}</span>
          </a>

          <nav aria-label="Navegación de producto" className="hidden items-center gap-8 md:flex">
            <a href="#producto" className="text-sm text-slate-300 transition-colors hover:text-white focus-ring">Producto</a>
            <a href="#modos" className="text-sm text-slate-300 transition-colors hover:text-white focus-ring">Modos</a>
            <a href="#personalizacion" className="text-sm text-slate-300 transition-colors hover:text-white focus-ring">Personalización</a>
            <a href="#demo" className="text-sm text-slate-300 transition-colors hover:text-white focus-ring">Demo</a>
          </nav>

          <div className="flex items-center gap-2">
            <PrimaryLink to={appPath} className="hidden min-w-28 sm:inline-flex">{accessLabel}</PrimaryLink>
            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/15 bg-white/[0.04] text-slate-200 focus-ring md:hidden"
              onClick={() => setMenuOpen((current) => !current)}
              aria-expanded={menuOpen}
              aria-controls="landing-mobile-menu"
              aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            >
              {menuOpen ? <X size={21} /> : <Menu size={21} />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav id="landing-mobile-menu" aria-label="Navegación móvil de producto" className="border-t border-white/10 bg-[#08111f] px-4 py-4 md:hidden">
            <div className="mx-auto grid max-w-7xl gap-1">
              {[
                ['Producto', '#producto'],
                ['Modos de trabajo', '#modos'],
                ['Personalización', '#personalizacion'],
                ['Demo', '#demo'],
              ].map(([label, href]) => (
                <a key={href} href={href} onClick={closeMenu} className="flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-slate-200 hover:bg-white/[0.06] focus-ring">
                  {label}
                </a>
              ))}
              <PrimaryLink to={appPath} className="mt-3 w-full" >{accessLabel}</PrimaryLink>
            </div>
          </nav>
        )}
      </header>

      <main id="contenido">
        <section id="inicio" className="mx-auto grid min-h-[calc(100svh-72px)] max-w-7xl items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[0.88fr_1.12fr] lg:px-8 lg:py-14">
          <div className="max-w-xl">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-blue-400">La plataforma para tu centro</p>
            <h1 className="text-4xl font-bold leading-[1.08] sm:text-5xl lg:text-6xl">
              Gestiona tu centro. Registra entrenamientos <span className="text-blue-500">sin fricción.</span>
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-slate-300 sm:text-lg">
              Gestiona el día a día de tu centro y registra cada sesión en tiempo real, con toda la información del cliente siempre a mano.
            </p>
            <div className="mt-8 grid gap-3 sm:flex">
              <PrimaryLink to={appPath} className="sm:min-w-52">
                {authenticated ? 'Ir a la plataforma' : 'Entrar en la plataforma'} <ArrowRight size={17} />
              </PrimaryLink>
              <a href="#demo" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-blue-400/45 bg-transparent px-5 py-3 text-sm font-semibold text-blue-300 transition-colors hover:bg-blue-500/10 focus-ring sm:min-w-40">
                <PlayCircle size={17} /> Ver demo
              </a>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-xs font-medium text-slate-400">
              <span className="flex items-center gap-2"><Clock3 size={16} /> Registro durante la sesión</span>
              <span className="flex items-center gap-2"><ShieldCheck size={16} /> Seguro y preparado para crecer</span>
              <span className="flex items-center gap-2"><Dumbbell size={16} /> Pensado para entrenadores</span>
            </div>
          </div>

          <div className="relative mx-auto h-[350px] w-full max-w-[620px] sm:h-[470px] lg:h-[540px]" aria-label="Vistas reales de MyWorkoutBox en móvil">
            <ProductFrame src={adminMobile} alt="Dashboard móvil de administración de MyWorkoutBox" className="absolute right-[9%] top-0 w-[43%] rotate-[1deg]" />
            <ProductFrame src={trainerSession} alt="Sesión activa en móvil" className="absolute bottom-0 left-[14%] w-[38%] -rotate-[2deg]" />
          </div>

          <div className="grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-white/10 bg-white/10 lg:col-span-2">
            {[
              ['API documentada', BarChart3],
              ['Despliegue reproducible', ShieldCheck],
              ['Experiencia mobile-first', Zap],
            ].map(([label, Icon]) => (
              <div key={label as string} className="flex min-h-16 items-center justify-center gap-2 bg-[#0a1423] px-2 text-center text-[11px] font-medium text-slate-300 sm:text-sm">
                <Icon size={16} className="hidden text-blue-400 sm:block" /> {label as string}
              </div>
            ))}
          </div>
        </section>

        <section id="producto" className="border-y border-white/10 bg-[#08111f] py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-400">Producto</p>
              <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Menos gestión. Más tiempo para entrenar.</h2>
              <p className="mt-4 leading-7 text-slate-400">Toda la información que necesitas para dirigir el centro y acompañar a tus clientes, conectada y lista cuando empieza la sesión.</p>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {benefits.map(({ title, description, icon: Icon, tone }) => (
                <article key={title} className="rounded-lg border border-white/10 bg-[#0c1727] p-5">
                  <span className={`flex h-11 w-11 items-center justify-center rounded-lg border ${tone}`}><Icon size={21} /></span>
                  <h3 className="mt-5 text-lg font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-white/10 bg-[#08111f]">
          <div className="mx-auto grid max-w-7xl lg:grid-cols-2">
            <div className="relative min-h-[310px] overflow-hidden lg:min-h-[430px]">
              <img src={personalTraining} alt="Entrenador guiando a una clienta durante un ejercicio" className="absolute inset-0 h-full w-full object-cover object-[center_58%]" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#08111f] via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-[#08111f]" />
            </div>
            <div className="flex items-center px-4 py-12 sm:px-8 lg:px-12">
              <div className="max-w-xl">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-400">Cada dato cuenta</p>
                <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Del apunte aislado a una historia de progreso</h2>
                <p className="mt-5 leading-7 text-slate-300">Consulta la información del cliente, registra lo que ocurre durante la sesión y deja cada marca preparada para la próxima vez.</p>
                <p className="mt-4 text-sm leading-6 text-slate-400">Sin hojas sueltas, sin reconstruir entrenamientos de memoria y sin perder tiempo después de la sesión.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="modos" className="py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-400">Dos modos de trabajo</p>
              <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Una cuenta, el contexto adecuado</h2>
              <p className="mx-auto mt-4 max-w-2xl text-slate-400">Organiza el negocio y pasa al entrenamiento sin cambiar de cuenta ni perder el contexto.</p>
            </div>
            <div className="mt-10 grid gap-5 lg:grid-cols-2">
              <article className="grid min-h-[330px] grid-cols-[1.05fr_0.95fr] overflow-hidden rounded-lg border border-blue-500/35 bg-[#0a1525] sm:min-h-[390px] sm:grid-cols-[0.9fr_1.1fr]">
                <div className="relative z-10 p-5 sm:p-7">
                  <span className="text-blue-400"><BarChart3 size={26} /></span>
                  <h3 className="mt-4 text-xl font-bold sm:text-2xl">Modo administración</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">Todo lo necesario para mantener el centro organizado.</p>
                  <ModePoints points={adminPoints} />
                </div>
                <div className="flex items-center justify-center overflow-hidden border-l border-blue-500/20 bg-[#07101c] p-3 sm:p-5">
                  <img src={adminMobile} alt="Resumen operativo del modo administración" className="max-h-[330px] w-full object-contain sm:max-h-[350px]" />
                </div>
              </article>

              <article className="grid min-h-[330px] grid-cols-[1.05fr_0.95fr] overflow-hidden rounded-lg border border-emerald-500/30 bg-[#091724] sm:min-h-[390px] sm:grid-cols-[0.9fr_1.1fr]">
                <div className="relative z-10 p-5 sm:p-7">
                  <span className="text-emerald-300"><Dumbbell size={26} /></span>
                  <h3 className="mt-4 text-xl font-bold sm:text-2xl">Modo entrenador</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">La información justa para trabajar con el cliente.</p>
                  <ModePoints points={trainerPoints} />
                </div>
                <div className="flex items-center justify-center overflow-hidden border-l border-emerald-500/20 bg-[#07101c] p-3 sm:p-5">
                  <img src={trainerSession} alt="Registro de series en modo entrenador" className="max-h-[330px] w-full object-contain sm:max-h-[350px]" />
                </div>
              </article>
            </div>
          </div>
        </section>

        <section id="personalizacion" className="border-y border-white/10 bg-[#08111f] py-14">
          <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_auto] lg:px-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-400">Una experiencia que habla de ti</p>
              <h2 className="mt-3 text-3xl font-bold">Tu centro, tu identidad</h2>
              <p className="mt-3 max-w-2xl leading-7 text-slate-400">Personaliza el nombre y el color principal para que tu equipo trabaje en un espacio reconocible, coherente con la imagen de tu centro.</p>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">Y ese espacio es solo tuyo: los datos, clientes y sesiones de tu centro permanecen completamente separados de cualquier otro centro en la plataforma.</p>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-[#0c1727] p-4" aria-label="Ejemplos de colores de marca">
              {['#2563EB', '#7C3AED', '#0D9488', '#16A34A', '#ED702D', '#DB2777'].map((color) => (
                <span key={color} className="h-9 w-9 rounded-full border-2 border-white/20" style={{ backgroundColor: color }} />
              ))}
            </div>
          </div>
        </section>

        <section id="demo" className="py-16 sm:py-24">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-lg border border-blue-500/35 bg-[#0a1525] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.35)] sm:p-10">
              <div className="grid items-center gap-8 lg:grid-cols-[1fr_0.95fr]">
                <div>
                  <BrandMark className="h-14 w-14 text-lg" />
                  <h2 className="mt-5 text-3xl font-bold">Pruébalo desde dentro</h2>
                  <p className="mt-3 leading-7 text-slate-400">Explora el producto con datos de ejemplo. Elige cómo quieres empezar y entra directamente, sin crear una cuenta.</p>
                  {authenticated && (
                    <PrimaryLink to={appPath} className="mt-7 w-full sm:w-auto">
                      Volver a la plataforma <ArrowRight size={17} />
                    </PrimaryLink>
                  )}
                </div>
                <div className="space-y-3 rounded-lg border border-white/10 bg-[#07101c] p-4">
                  <p className="text-sm font-semibold">Elige tu punto de vista</p>
                  <button type="button" onClick={() => accessDemo('admin')} disabled={authenticated || demoLoading !== null} className="flex min-h-14 w-full items-center justify-between rounded-lg border border-blue-500/35 bg-blue-500/10 px-4 text-left transition-colors hover:bg-blue-500/20 disabled:opacity-50 focus-ring">
                    <span><span className="block font-semibold">Gestionar el centro</span><span className="text-xs text-slate-400">Entrar como administrador</span></span>
                    {demoLoading === 'admin' ? <span className="text-xs text-blue-300">Accediendo...</span> : <ArrowRight size={18} className="text-blue-400" />}
                  </button>
                  <button type="button" onClick={() => accessDemo('trainer')} disabled={authenticated || demoLoading !== null} className="flex min-h-14 w-full items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 text-left transition-colors hover:bg-emerald-500/20 disabled:opacity-50 focus-ring">
                    <span><span className="block font-semibold">Registrar una sesión</span><span className="text-xs text-slate-400">Entrar como entrenador</span></span>
                    {demoLoading === 'trainer' ? <span className="text-xs text-emerald-300">Accediendo...</span> : <ArrowRight size={18} className="text-emerald-300" />}
                  </button>
                  {demoError && <p role="alert" className="text-sm text-red-300">{demoError}</p>}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-[#07101c]">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <BrandMark className="h-9 w-9 text-xs" />
            <div>
              <p className="font-semibold">{PLATFORM_BRAND.appName}</p>
              <p className="text-xs text-slate-500">Gestión y seguimiento del entrenamiento.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <a href="https://unsplash.com/es/fotos/un-hombre-y-una-mujer-haciendo-ejercicio-en-un-gimnasio-9faBzIlnV14" target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center text-slate-500 hover:text-white focus-ring">Fotografía: Unsplash</a>
            <a href="https://github.com/dferrandezsanchez/MyWorkoutBox" target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 text-slate-400 hover:text-white focus-ring"><GitFork size={17} /> GitHub</a>
            <a href="/api/docs" className="inline-flex min-h-11 items-center gap-2 text-slate-400 hover:text-white focus-ring"><BarChart3 size={17} /> API Docs</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
