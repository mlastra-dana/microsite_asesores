import type { Product } from '../data/products';

type ProductCardProps = {
  product: Product;
  onRequest: (product: string) => void;
};

export default function ProductCard({ product, onRequest }: ProductCardProps) {
  const Icon = product.icon;

  return (
    <article className="flex h-full flex-col rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-example-lavender text-example-violet">
        <Icon size={24} />
      </div>
      <h3 className="text-xl font-extrabold text-dana-ink">{product.title}</h3>
      <p className="mt-3 flex-1 text-sm leading-6 text-dana-muted">{product.description}</p>
      <button
        type="button"
        onClick={() => onRequest(product.title)}
        className="mt-5 rounded-full bg-example-navy px-5 py-3 text-sm font-extrabold text-white transition hover:bg-example-violet"
      >
        Solicitar información
      </button>
    </article>
  );
}
