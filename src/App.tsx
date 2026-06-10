import { Navigate, Route, Routes } from 'react-router-dom';
import ActivationPage from './pages/ActivationPage';
import AdvisorEditPage from './pages/AdvisorEditPage';
import MicrositePage from './pages/MicrositePage';
import NotFoundPage from './pages/NotFoundPage';
import ProvisionPage from './pages/ProvisionPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/asesor/laura-lepage" replace />} />
      <Route path="/activar" element={<ActivationPage />} />
      <Route path="/provisionar" element={<ProvisionPage />} />
      <Route path="/asesor/:advisorId" element={<MicrositePage />} />
      <Route path="/asesor/:advisorId/actualizar" element={<AdvisorEditPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
