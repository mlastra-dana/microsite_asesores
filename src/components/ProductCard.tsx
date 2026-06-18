import type { Product } from '../data/products';

type ProductCardProps = {
  product: Product;
};

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <article className="flex h-full flex-col rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-[#F4F7FB] ring-1 ring-[#E6EDF5]">
        <img src={product.logoUrl} alt="" className="h-10 w-10 object-contain" />
      </div>
      <h3 className="text-xl font-extrabold text-dana-ink">{product.title}</h3>
      <p className="mt-3 flex-1 text-sm leading-6 text-dana-muted">{product.description}</p>
      <a
        href={product.url}
        target="_blank"
        rel="noreferrer"
        className="mt-5 rounded-lg bg-[#00478D] px-5 py-3 text-center text-sm font-extrabold text-white shadow-sm transition hover:bg-[#00376E]"
      >
        Cotizar
      </a>
    </article>
  );
}
