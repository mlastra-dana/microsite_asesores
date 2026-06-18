import { FormEvent, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import mercantilIcon from '../assets/brand/Marca_example/logos/icono-mercantil.png';
import { authenticateAdvisor, isAdvisorAuthenticated } from '../utils/auth';

type LoginLocationState = {
  from?: string;
};

export default function LoginPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  if (isAdvisorAuthenticated()) {
    return <Navigate to="/asesor/2377" replace />;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!authenticateAdvisor(username, password)) {
      setError('Usuario incorrecto. Ingresa tuasesor y una contraseña.');
      return;
    }

    const state = location.state as LoginLocationState | null;
    const destination = state?.from?.startsWith('/asesor/') ? state.from : '/asesor/2377';
    navigate(destination, { replace: true });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-4 py-10 sm:px-6">
      <section className="w-full max-w-xl rounded-xl border border-[#D0D5DD] bg-white px-6 py-9 shadow-sm sm:px-12 sm:py-12">
        <img src={mercantilIcon} alt="Mercantil Seguros" className="mx-auto h-24 w-24 object-contain" />

        <div className="mx-auto mt-8 max-w-md">
          <h1 className="text-3xl font-extrabold text-[#101828]">Inicia sesión</h1>

          <form onSubmit={handleSubmit} className="mt-7 space-y-5">
            <label className="block">
              <span className="text-sm font-bold text-[#344054]">Usuario</span>
              <input
                value={username}
                onChange={(event) => {
                  setUsername(event.target.value);
                  setError('');
                }}
                autoComplete="username"
                className="mt-2 w-full rounded-lg border border-[#D0D5DD] bg-white px-4 py-3.5 text-base outline-none transition placeholder:text-[#667085] focus:border-[#00478D] focus:ring-4 focus:ring-[#00478D]/10"
                placeholder="tuasesor"
              />
            </label>

            <label className="block">
              <span className="text-sm font-bold text-[#344054]">Contraseña</span>
              <span className="mt-2 flex items-center rounded-lg border border-[#D0D5DD] bg-white px-4 transition focus-within:border-[#00478D] focus-within:ring-4 focus-within:ring-[#00478D]/10">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setError('');
                  }}
                  autoComplete="current-password"
                  className="min-w-0 flex-1 border-0 bg-transparent py-3.5 text-base outline-none placeholder:text-[#667085]"
                  placeholder="Contraseña"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="text-[#667085] transition hover:text-[#00478D]"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </span>
            </label>

            {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}

            <button
              type="submit"
              className="w-full rounded-lg bg-[#00478D] px-5 py-3.5 text-base font-extrabold text-white shadow-sm transition hover:bg-[#00376E]"
            >
              Iniciar sesión
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
