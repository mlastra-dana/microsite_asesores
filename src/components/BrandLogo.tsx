import centenaryLogo from '../assets/brand/Marca_example/logos/IMG_5977.jpg';
import mercantilLogo from '../assets/brand/Marca_example/logos/mercantilseguros.png';

type BrandLogoProps = {
  className?: string;
  inverse?: boolean;
  showName?: boolean;
};

export default function BrandLogo({ className = '', inverse = false, showName = true }: BrandLogoProps) {
  return (
    <div className={`inline-flex items-center ${className}`}>
      <img
        src={showName ? mercantilLogo : centenaryLogo}
        alt={showName ? 'Mercantil Seguros' : 'Mercantil Seguros 100 años'}
        className={`w-auto object-contain ${
          showName ? 'h-11' : 'h-12'
        } ${inverse ? 'rounded-md bg-white px-2 py-1' : ''}`}
      />
    </div>
  );
}
