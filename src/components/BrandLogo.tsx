import exampleIcon from '../assets/brand/Marca_example/logos/png/example_icon_color.png';
import exampleInsuranceLogo from '../assets/brand/Marca_example/logos/png/example_insurance_color.png';

type BrandLogoProps = {
  className?: string;
  inverse?: boolean;
  showName?: boolean;
};

export default function BrandLogo({ className = '', inverse = false, showName = true }: BrandLogoProps) {
  return (
    <div className={`inline-flex items-center ${className}`}>
      <img
        src={showName ? exampleInsuranceLogo : exampleIcon}
        alt={showName ? 'Example Insurance' : 'Example Insurance icon'}
        className={`w-auto object-contain ${
          showName ? 'h-11' : 'h-12'
        } ${inverse ? 'rounded-md bg-white px-2 py-1' : ''}`}
      />
    </div>
  );
}
