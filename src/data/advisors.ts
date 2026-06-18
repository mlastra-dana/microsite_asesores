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
};

export const advisors: Advisor[] = [
  {
    id: 'laura-lepage',
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
    id: 'carlos-mendoza',
    company: 'Example Insurance',
    name: 'Carlos Mendoza',
    role: 'Asesor Patrimonial',
    email: 'carlos.mendoza@examplemail.com',
    phone: '+1 (555) 204 1188',
    whatsapp: '15552041188',
    city: 'Miami',
    advisorCode: 'PAS-2088',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=640&q=80',
    bio: 'Acompaño a familias y empresas en decisiones de proteccion financiera.',
    products: ['Seguro de Vida', 'Seguro Empresarial', 'Seguro de Hogar'],
  },
  {
    id: 'valentina-rojas',
    company: 'Example Insurance',
    name: 'Valentina Rojas',
    role: 'Consultora de Seguros',
    email: 'valentina.rojas@examplemail.com',
    phone: '+1 (786) 330 4422',
    whatsapp: '17863304422',
    city: 'Bogota',
    advisorCode: 'PAS-3140',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=640&q=80',
    bio: 'Diseno programas de seguro simples, cercanos y faciles de mantener al dia.',
    products: ['Seguro de Salud', 'Seguro de Auto', 'Seguro Empresarial'],
  },
];

export const defaultAdvisor = advisors[0];

export function getAdvisorById(id?: string) {
  return advisors.find((advisor) => advisor.id === id) ?? defaultAdvisor;
}
