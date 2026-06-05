import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-bold text-text-primary">Página no encontrada (404)</h1>
      <p className="text-text-secondary text-sm">
        La página que buscas no existe o fue movida.
      </p>
      <Link
        to="/"
        className="min-h-[44px] px-6 py-2 bg-primary hover:bg-primary-hover text-white font-medium rounded-md transition-colors flex items-center"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
