const AUTH_KEY = 'demo-advisor-authenticated';

export function isAdvisorAuthenticated() {
  return sessionStorage.getItem(AUTH_KEY) === 'true';
}

export function authenticateAdvisor(username: string, password: string) {
  const isValid = username.trim().toLowerCase() === 'tuasesor' && password.trim().length > 0;

  if (isValid) {
    sessionStorage.setItem(AUTH_KEY, 'true');
  }

  return isValid;
}

export function logoutAdvisor() {
  sessionStorage.removeItem(AUTH_KEY);
}
