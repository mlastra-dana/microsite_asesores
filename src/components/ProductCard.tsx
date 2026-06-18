import type { Product } from '../data/products';

type ProductCardProps = {
  product: Product;
};

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <article className="flex h-full flex-col rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-example-lavender">
        <img src={product.logoUrl} alt="" className="h-10 w-10 object-contain" />
      </div>
      <h3 className="text-xl font-extrabold text-dana-ink">{product.title}</h3>
      <p className="mt-3 flex-1 text-sm leading-6 text-dana-muted">{product.description}</p>
      <a
        href={product.url}
        target="_blank"
        rel="noreferrer"
        className="mt-5 rounded-full bg-example-navy px-5 py-3 text-center text-sm font-extrabold text-white transition hover:bg-example-violet"
      >
        Cotizar
      </a>
    </article>
  );
}
