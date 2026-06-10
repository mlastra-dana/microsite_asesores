import logoWhite from '../assets/brand/Marca_example/logos/svg/example_insurance_white.svg';

export default function Footer() {
  return (
    <footer className="bg-example-navy px-4 py-8 text-center text-sm font-medium text-white/72">
      <img src={logoWhite} alt="Example Insurance" className="mx-auto mb-5 h-12 w-auto" />
      <p>Microsite generado automáticamente por DANAconnect para ecosistemas digitales de corredores.</p>
      <p className="mt-2">Demo conceptual generada para la digitalización del PAS.</p>
    </footer>
  );
}
