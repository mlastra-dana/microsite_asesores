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
};

export const products: Product[] = [
  {
    title: 'Vitales',
    description: 'Protección para cuidar tu bienestar y el de quienes más importan.',
    logoUrl: vitalesLogo,
    url: 'https://link.mercantilseguros.com/Vitales_ADS_2377',
  },
  {
    title: 'Auto',
    description: 'Coberturas para proteger tu vehículo y conducir con tranquilidad.',
    logoUrl: autoLogo,
    url: 'https://link.mercantilseguros.com/Auto_ADS_2377',
  },
  {
    title: 'Salud',
    description: 'Alternativas de protección médica para ti y tu familia.',
    logoUrl: saludLogo,
    url: 'https://link.mercantilseguros.com/Salud_ADS_2377',
  },
  {
    title: 'Emergencias Médicas',
    description: 'Atención y respaldo ante situaciones médicas inesperadas.',
    logoUrl: emergenciaLogo,
    url: 'https://link.mercantilseguros.com/EmerMedicas_ADS_2377',
  },
  {
    title: 'Platino',
    description: 'Una opción de protección amplia para necesidades especiales.',
    logoUrl: rcpLogo,
    url: 'https://link.mercantilseguros.com/Platino_ADS_2377',
  },
  {
    title: 'Travel',
    description: 'Asistencia y protección para disfrutar tus viajes con tranquilidad.',
    logoUrl: pymeLogo,
    url: 'https://link.mercantilseguros.com/Travel_ADS_2377',
  },
  {
    title: 'C.R.',
    description: 'Protección residencial para tu hogar y sus bienes.',
    logoUrl: combinadoLogo,
    url: 'https://link.mercantilseguros.com/Residencial_ADS_2377',
  },
  {
    title: 'Salud Panamá',
    description: 'Beneficios de salud para grupos y clientes en Panamá.',
    logoUrl: cyberLogo,
    url: 'https://link.mercantilseguros.com/GroupBenefits_ADS_2377',
  },
];
