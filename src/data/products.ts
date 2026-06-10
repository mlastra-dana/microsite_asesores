import { Building2, Car, HeartPulse, Home, ShieldCheck } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type Product = {
  title: string;
  description: string;
  icon: LucideIcon;
};

export const products: Product[] = [
  {
    title: 'Seguro de Salud',
    description: 'Planes de proteccion medica para clientes, familias y equipos.',
    icon: HeartPulse,
  },
  {
    title: 'Seguro de Vida',
    description: 'Respaldo financiero para quienes mas importan.',
    icon: ShieldCheck,
  },
  {
    title: 'Seguro de Auto',
    description: 'Coberturas para conducir con asistencia y tranquilidad.',
    icon: Car,
  },
  {
    title: 'Seguro de Hogar',
    description: 'Proteccion para vivienda, contenidos y responsabilidad familiar.',
    icon: Home,
  },
  {
    title: 'Seguro Empresarial',
    description: 'Soluciones para proteger operaciones, activos y continuidad.',
    icon: Building2,
  },
];
