import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { BrandLogo } from '@shared/components/BrandLogo';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-background px-4 py-6 sm:px-8">
      <Link to="/" aria-label="Ir al inicio" className="inline-flex min-h-[44px] w-fit items-center rounded-xl focus-ring">
        <BrandLogo size="md" />
      </Link>
      <main role="main" className="flex flex-1 flex-col items-center justify-center pb-16 text-center">
        <p aria-hidden="true" className="tabular font-display text-7xl font-bold leading-none tracking-tight text-primary-soft sm:text-8xl">404</p>
        <h1 className="mt-6 text-2xl font-bold text-text-primary sm:text-3xl">Página no encontrada</h1>
        <p className="mt-2 max-w-sm text-sm leading-6 text-text-secondary">La página que buscas no existe o fue movida.</p>
        <Link
          to="/"
          className="mt-8 inline-flex min-h-[44px] items-center gap-2 rounded-full border border-primary bg-primary px-6 py-2 text-sm font-semibold text-primary-contrast transition-[background-color,border-color,transform] duration-150 ease-out hover:border-primary-hover hover:bg-primary-hover active:scale-[0.98] motion-reduce:active:scale-100 focus-ring"
        >
          <ArrowLeft size={16} />
          Volver al inicio
        </Link>
      </main>
    </div>
  );
}
