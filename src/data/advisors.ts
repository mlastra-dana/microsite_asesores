export type Advisor = {
  id: string;
  company: string;
  name: string;
  role: string;
  email: string;
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
    company: 'Example Insurance',
    name: 'Laura Lepage',
    role: 'Asesora de Seguros',
    email: 'lauralee@examplemail.com',
    phone: '+1 (123) 456 789',
    whatsapp: '1123456789',
    city: 'Montreal',
    advisorCode: 'PAS-1024',
    photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=640&q=80',
    bio: 'Especialista en soluciones de protección personal, familiar y patrimonial.',
    products: ['Seguro de Salud', 'Seguro de Vida', 'Seguro de Auto', 'Seguro de Hogar'],
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
