import tuSeguroLogo from '../assets/advisors/tuseguro-logo.svg';

export type Advisor = {
  id: string;
  company: string;
  name: string;
  role: string;
  email: string;
  website?: string;
  contactUrl?: string;
  phone: string;
  whatsapp: string;
  city: string;
  advisorCode: string;
  photoUrl: string;
  bio: string;
  products: string[];
  productLinks?: Record<string, string>;
};

export const advisors: Advisor[] = [
  {
    id: '9F3806A23CEA5138',
    company: 'Arroba Seguros Sociedad de Corretaje de Seguros, C.A.',
    name: 'TuSeguro.com',
    role: 'Asesores digitales expertos en seguros',
    email: '',
    website: 'tuseguro.com',
    contactUrl: 'https://tuseguro.com/contactanos/',
    phone: '+58 (212) 628.14.55',
    whatsapp: '573209926066',
    city: 'Caracas, Venezuela',
    advisorCode: 'SUDEASEG S-69',
    photoUrl: tuSeguroLogo,
    bio: 'Compara opciones para proteger tu salud, automóvil, mascotas y viajes con el respaldo de especialistas de amplia trayectoria en Latinoamérica.',
    products: ['Seguro de Salud', 'Seguro de Auto', 'Seguro de Vida', 'Seguro de Hogar'],
  },
  {
    id: 'FDF34DAC98DA4246',
    company: 'Mercantil Seguros',
    name: 'Carlos Mendoza',
    role: 'Asesor Patrimonial',
    email: 'carlos.mendoza@examplemail.com',
    phone: '04142041188',
    whatsapp: '584142041188',
    city: 'Valencia',
    advisorCode: 'PAS-2088',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=640&q=80',
    bio: 'Acompaño a familias y empresas venezolanas en decisiones de proteccion financiera.',
    products: ['Vitales', 'Auto', 'Platino', 'C.R.'],
  },
  {
    id: 'E3064E9B655B4359',
    company: 'Mercantil Seguros',
    name: 'Valentina Rojas',
    role: 'Consultora de Seguros',
    email: 'valentina.rojas@examplemail.com',
    phone: '04163304422',
    whatsapp: '584163304422',
    city: 'Maracay',
    advisorCode: 'PAS-3140',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=640&q=80',
    bio: 'Diseno programas de seguro simples, cercanos y faciles de mantener al dia.',
    products: ['Cotizador Simplificado', 'Auto', 'Salud', 'Emergencias Médicas'],
  },
  {
    id: '5752C96A919B29A5',
    company: 'Mercantil Seguros',
    name: 'Andrea Perez',
    role: 'Asesora comercial',
    email: 'andrea.perez@examplemail.com',
    phone: '04120001122',
    whatsapp: '584120001122',
    city: 'Barquisimeto',
    advisorCode: 'ADS-4582',
    photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=640&q=80',
    bio: 'Oriento a profesionales independientes en soluciones de salud, vida y auto.',
    products: ['Vitales', 'Auto', 'Salud', 'Travel'],
  },
  {
    id: 'C6B71A95B42475C4',
    company: 'Mercantil Seguros',
    name: 'Luis Herrera',
    role: 'Asesor corporativo',
    email: 'luis.herrera@examplemail.com',
    phone: '04145550198',
    whatsapp: '584145550198',
    city: 'Maracaibo',
    advisorCode: 'ADS-7741',
    photoUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=640&q=80',
    bio: 'Ayudo a pequenos negocios a elegir coberturas para continuidad operativa y proteccion patrimonial.',
    products: ['Auto', 'Emergencias Médicas', 'Platino', 'C.R.'],
  },
];

export const defaultAdvisor = advisors[0];

export function getAdvisorById(id?: string) {
  return advisors.find((advisor) => advisor.id === id) ?? defaultAdvisor;
}

export function hasAdvisorById(id?: string) {
  return advisors.some((advisor) => advisor.id === id);
}
