import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { isAdvisorAuthenticated } from '../utils/auth';

export default function RequireAdvisorAuth() {
  const location = useLocation();

  if (!isAdvisorAuthenticated()) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}${location.hash}` }}
      />
    );
  }

  return <Outlet />;
}
