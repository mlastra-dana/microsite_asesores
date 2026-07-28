import autoLogo from '../assets/products/auto.png';
import combinadoLogo from '../assets/products/combinado.png';
import cyberLogo from '../assets/products/cyber.png';
import emergenciaLogo from '../assets/products/emergencia.png';
import pymeLogo from '../assets/products/pyme.png';
import rcpLogo from '../assets/products/rcp.png';
import saludLogo from '../assets/products/salud.png';
import vitalesLogo from '../assets/products/vitales.png';

export type Product = {
  title: string;
  description: string;
  logoUrl: string;
  url: string;
  badge?: string;
  ctaLabel?: string;
  featured?: boolean;
};

export const products: Product[] = [
  {
    title: 'Cotizador Simplificado',
    description: 'Experiencia demo para generar una cotización rápida de los planes disponibles.',
    logoUrl: saludLogo,
    url: 'https://example.com/example-insurance/cotizador-simplificado',
    badge: 'Nueva experiencia',
    ctaLabel: 'Probar ahora',
    featured: true,
  },
  {
    title: 'Vitales',
    description: 'Protección para cuidar tu bienestar y el de quienes más importan.',
    logoUrl: vitalesLogo,
    url: 'https://example.com/example-insurance/vitales',
  },
  {
    title: 'Auto',
    description: 'Coberturas para proteger tu vehículo y conducir con tranquilidad.',
    logoUrl: autoLogo,
    url: 'https://example.com/example-insurance/auto',
  },
  {
    title: 'Salud',
    description: 'Alternativas de protección médica para ti y tu familia.',
    logoUrl: saludLogo,
    url: 'https://example.com/example-insurance/salud',
  },
  {
    title: 'Emergencias Médicas',
    description: 'Atención y respaldo ante situaciones médicas inesperadas.',
    logoUrl: emergenciaLogo,
    url: 'https://example.com/example-insurance/emergencias-medicas',
  },
  {
    title: 'Platino',
    description: 'Una opción de protección amplia para necesidades especiales.',
    logoUrl: rcpLogo,
    url: 'https://example.com/example-insurance/platino',
  },
  {
    title: 'Travel',
    description: 'Asistencia y protección para disfrutar tus viajes con tranquilidad.',
    logoUrl: pymeLogo,
    url: 'https://example.com/example-insurance/travel',
  },
  {
    title: 'C.R.',
    description: 'Protección residencial para tu hogar y sus bienes.',
    logoUrl: combinadoLogo,
    url: 'https://example.com/example-insurance/residencial',
  },
  {
    title: 'Salud Panamá',
    description: 'Beneficios de salud para grupos y clientes en Panamá.',
    logoUrl: cyberLogo,
    url: 'https://example.com/example-insurance/salud-panama',
  },
];
