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
  postSaleLinks?: {
    insuredManagement?: string;
    reimbursements?: string;
    emergency?: string;
    policyChanges?: string;
  };
};

export const advisors: Advisor[] = [
  {
    id: '9F3806A23CEA5138',
    company: 'Example Insurance',
    name: 'Daniela Rivero',
    role: 'Asesora de Seguros',
    email: 'daniela.rivero@examplemail.com',
    website: 'example.com/example-insurance',
    contactUrl: 'https://example.com/example-insurance/contacto',
    phone: '04122150873',
    whatsapp: '584224220520',
    city: 'Caracas',
    advisorCode: 'ADS-91827463',
    photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=640&q=80',
    bio: 'Acompaño a familias caraqueñas a elegir coberturas de salud, auto y hogar con seguimiento cercano.',
    products: ['Cotizador Simplificado', 'Vida', 'Auto', 'Salud', 'Emergencias Médicas', 'Platino', 'Travel', 'Hogar'],
    productLinks: {
      'Cotizador Simplificado': 'https://example.com/microsite-demo/daniela-rivero/simplificado',
      Vida: 'https://example.com/microsite-demo/daniela-rivero/vitales',
      Auto: 'https://example.com/microsite-demo/daniela-rivero/auto',
      Salud: 'https://example.com/microsite-demo/daniela-rivero/salud',
      'Emergencias Médicas': 'https://example.com/microsite-demo/daniela-rivero/emergencias-medicas',
      Platino: 'https://example.com/microsite-demo/daniela-rivero/platino',
      Travel: 'https://example.com/microsite-demo/daniela-rivero/travel',
      Hogar: 'https://example.com/microsite-demo/daniela-rivero/cr',
    },
    postSaleLinks: {
      insuredManagement: 'https://example.com/example-insurance/postventa/gestion-asegurado',
      reimbursements: 'https://example.com/example-insurance/postventa/reembolsos',
      emergency: 'https://example.com/example-insurance/postventa/emergencias',
      policyChanges: 'https://example.com/example-insurance/postventa/cambios-poliza',
    },
  },
  {
    id: 'FDF34DAC98DA4246',
    company: 'Example Insurance',
    name: 'Carlos Mendoza',
    role: 'Asesor Patrimonial',
    email: 'carlos.mendoza@examplemail.com',
    phone: '04142041188',
    whatsapp: '584142041188',
    city: 'Valencia',
    advisorCode: 'PAS-2088',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=640&q=80',
    bio: 'Acompaño a familias y empresas venezolanas en decisiones de proteccion financiera.',
    products: ['Vida', 'Auto', 'Platino', 'Hogar'],
  },
  {
    id: 'E3064E9B655B4359',
    company: 'Example Insurance',
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
    company: 'Example Insurance',
    name: 'Andrea Perez',
    role: 'Asesora comercial',
    email: 'andrea.perez@examplemail.com',
    phone: '04120001122',
    whatsapp: '584120001122',
    city: 'Barquisimeto',
    advisorCode: 'ADS-4582',
    photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=640&q=80',
    bio: 'Oriento a profesionales independientes en soluciones de salud, vida y auto.',
    products: ['Vida', 'Auto', 'Salud', 'Travel'],
  },
  {
    id: 'C6B71A95B42475C4',
    company: 'Example Insurance',
    name: 'Luis Herrera',
    role: 'Asesor corporativo',
    email: 'luis.herrera@examplemail.com',
    phone: '04145550198',
    whatsapp: '584145550198',
    city: 'Maracaibo',
    advisorCode: 'ADS-7741',
    photoUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=640&q=80',
    bio: 'Ayudo a pequenos negocios a elegir coberturas para continuidad operativa y proteccion patrimonial.',
    products: ['Auto', 'Emergencias Médicas', 'Platino', 'Hogar'],
  },
];

export const defaultAdvisor = advisors[0];

export function getAdvisorById(id?: string) {
  return advisors.find((advisor) => advisor.id === id) ?? defaultAdvisor;
}

export function hasAdvisorById(id?: string) {
  return advisors.some((advisor) => advisor.id === id);
}
