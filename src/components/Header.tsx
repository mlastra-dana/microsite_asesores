import { Link } from 'react-router-dom';
import type { Advisor } from '../data/advisors';
import logoColor from '../assets/brand/Marca_example/logos/svg/example_insurance_color.svg';

type HeaderProps = {
  advisor: Advisor;
};

export default function Header({ advisor }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-example-lavender bg-white/92 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to={`/asesor/${advisor.id}`} className="flex items-center gap-3">
          <img src={logoColor} alt={advisor.company} className="h-11 w-auto max-w-[178px]" />
          <span>
            <span className="block text-xs font-medium text-dana-muted">Asesor autorizado</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-semibold text-dana-muted md:flex">
          <a href="#inicio" className="hover:text-example-violet">Inicio</a>
          <a href="#productos" className="hover:text-example-violet">Productos</a>
          <a href="#postventa" className="hover:text-example-violet">Post-Venta</a>
          <Link to={`/asesor/${advisor.id}/actualizar`} className="text-example-violet hover:text-example-purple">
            Actualizar datos
          </Link>
        </nav>
        <Link
          to={`/asesor/${advisor.id}/actualizar`}
          className="rounded-full bg-example-violet px-4 py-2 text-xs font-bold text-white shadow-sm md:hidden"
        >
          Actualizar
        </Link>
      </div>
    </header>
  );
}
