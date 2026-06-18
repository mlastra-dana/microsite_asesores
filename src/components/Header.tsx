import { Link } from 'react-router-dom';
import type { Advisor } from '../data/advisors';
import BrandLogo from './BrandLogo';

type HeaderProps = {
  advisor: Advisor;
};

export default function Header({ advisor }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-3 sm:px-6">
        <Link to={`/asesor/${advisor.id}`} aria-label="Inicio">
          <BrandLogo showName={false} />
        </Link>
        <div className="hidden flex-1 items-center justify-end gap-8 md:flex">
          <nav className="flex items-center gap-7 text-sm font-semibold text-dana-muted">
            <a href="#inicio" className="hover:text-mercantil-blue">Inicio</a>
            <a href="#productos" className="hover:text-mercantil-blue">Productos</a>
            <a href="#postventa" className="hover:text-mercantil-blue">Post-Venta</a>
            <Link
              to={`/asesor/${advisor.id}/actualizar`}
              className="rounded-lg bg-[#00478D] px-4 py-2 text-white shadow-sm transition hover:bg-[#00376E]"
            >
              Actualizar datos
            </Link>
          </nav>
          <BrandLogo className="border-l border-slate-200 pl-7" />
        </div>
        <Link
          to={`/asesor/${advisor.id}/actualizar`}
          className="rounded-lg bg-[#00478D] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#00376E] md:hidden"
        >
          Actualizar
        </Link>
      </div>
    </header>
  );
}
