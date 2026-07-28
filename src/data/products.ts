import autoLogo from '../assets/products/example-auto.svg';
import emergenciaLogo from '../assets/products/example-emergencias.svg';
import hogarLogo from '../assets/products/example-hogar.svg';
import platinoLogo from '../assets/products/example-platino.svg';
import saludLogo from '../assets/products/example-salud.svg';
import saludPanamaLogo from '../assets/products/example-salud-panama.svg';
import simplificadoLogo from '../assets/products/example-simplificado.svg';
import travelLogo from '../assets/products/example-travel.svg';
import vidaLogo from '../assets/products/example-vida.svg';

export type Product = {
  title: string;
  description: string;
  logoUrl: string;
  url: string;
  badge?: string;
  ctaLabel?: string;
  featured?: boolean;
  aliases?: string[];
};

export const products: Product[] = [
  {
    title: 'Cotizador Simplificado',
    description: 'Experiencia demo para generar una cotización rápida de los planes disponibles.',
    logoUrl: simplificadoLogo,
    url: 'https://example.com/example-insurance/cotizador-simplificado',
    badge: 'Nueva experiencia',
    ctaLabel: 'Probar ahora',
    featured: true,
  },
  {
    title: 'Vida',
    description: 'Protección para cuidar tu bienestar y el de quienes más importan.',
    logoUrl: vidaLogo,
    url: 'https://example.com/example-insurance/vitales',
    aliases: ['Vitales', 'Seguro de Vida'],
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
    logoUrl: platinoLogo,
    url: 'https://example.com/example-insurance/platino',
  },
  {
    title: 'Travel',
    description: 'Asistencia y protección para disfrutar tus viajes con tranquilidad.',
    logoUrl: travelLogo,
    url: 'https://example.com/example-insurance/travel',
  },
  {
    title: 'Hogar',
    description: 'Protección residencial para tu hogar y sus bienes.',
    logoUrl: hogarLogo,
    url: 'https://example.com/example-insurance/residencial',
    aliases: ['C.R.', 'Seguro de Hogar'],
  },
  {
    title: 'Salud Panamá',
    description: 'Beneficios de salud para grupos y clientes en Panamá.',
    logoUrl: saludPanamaLogo,
    url: 'https://example.com/example-insurance/salud-panama',
  },
];
