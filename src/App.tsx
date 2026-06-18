import { Navigate, Route, Routes } from 'react-router-dom';
import RequireAdvisorAuth from './components/RequireAdvisorAuth';
import ActivationPage from './pages/ActivationPage';
import AdvisorEditPage from './pages/AdvisorEditPage';
import LoginPage from './pages/LoginPage';
import MicrositePage from './pages/MicrositePage';
import NotFoundPage from './pages/NotFoundPage';
import ProvisionPage from './pages/ProvisionPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/activar" element={<ActivationPage />} />
      <Route path="/provisionar" element={<ProvisionPage />} />
      <Route path="/asesor/laura-lepage" element={<Navigate to="/asesor/2377" replace />} />
      <Route path="/asesor/tuseguro" element={<Navigate to="/asesor/2377" replace />} />
      <Route path="/asesor/laura-lepage/actualizar" element={<Navigate to="/asesor/2377/actualizar" replace />} />
      <Route path="/asesor/tuseguro/actualizar" element={<Navigate to="/asesor/2377/actualizar" replace />} />
      <Route element={<RequireAdvisorAuth />}>
        <Route path="/asesor/:advisorId" element={<MicrositePage />} />
        <Route path="/asesor/:advisorId/actualizar" element={<AdvisorEditPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
