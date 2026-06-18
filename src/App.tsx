import { Navigate, Route, Routes } from 'react-router-dom';
import ActivationPage from './pages/ActivationPage';
import AdvisorEditPage from './pages/AdvisorEditPage';
import MicrositePage from './pages/MicrositePage';
import NotFoundPage from './pages/NotFoundPage';
import ProvisionPage from './pages/ProvisionPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/asesor/tuseguro" replace />} />
      <Route path="/activar" element={<ActivationPage />} />
      <Route path="/provisionar" element={<ProvisionPage />} />
      <Route path="/asesor/laura-lepage" element={<Navigate to="/asesor/tuseguro" replace />} />
      <Route path="/asesor/laura-lepage/actualizar" element={<Navigate to="/asesor/tuseguro/actualizar" replace />} />
      <Route path="/asesor/:advisorId" element={<MicrositePage />} />
      <Route path="/asesor/:advisorId/actualizar" element={<AdvisorEditPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
