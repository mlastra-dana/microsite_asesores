import type { Product } from '../data/products';

type ProductCardProps = {
  product: Product;
};

export default function ProductCard({ product }: ProductCardProps) {
  const hasUrl = Boolean(product.url);

  if (product.featured) {
    return (
      <article className="flex h-full flex-col rounded-2xl bg-[#00478D] p-6 text-white shadow-soft ring-1 ring-[#00376E] transition hover:-translate-y-0.5 hover:shadow-lg sm:col-span-2 lg:col-span-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-white ring-1 ring-white/70">
            <img src={product.logoUrl} alt="" className="h-11 w-11 object-contain" />
          </div>
          {product.badge && (
            <span className="rounded-full bg-[#F78E1E] px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-white">
              {product.badge}
            </span>
          )}
        </div>
        <h3 className="mt-5 text-2xl font-extrabold leading-tight">{product.title}</h3>
        <p className="mt-3 flex-1 text-sm leading-6 text-white/90">{product.description}</p>
        {hasUrl ? (
          <a
            href={product.url}
            target="_blank"
            rel="noreferrer"
            className="mt-6 rounded-lg bg-white px-5 py-3 text-center text-sm font-extrabold text-[#00478D] shadow-sm transition hover:bg-[#F4F7FB]"
          >
            {product.ctaLabel ?? 'Cotizar'}
          </a>
        ) : (
          <span className="mt-6 rounded-lg bg-white/15 px-5 py-3 text-center text-sm font-extrabold text-white/80">
            No disponible
          </span>
        )}
      </article>
    );
  }

  return (
    <article className="flex h-full flex-col rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-[#F4F7FB] ring-1 ring-[#E6EDF5]">
        <img src={product.logoUrl} alt="" className="h-10 w-10 object-contain" />
      </div>
      <h3 className="text-xl font-extrabold text-dana-ink">{product.title}</h3>
      <p className="mt-3 flex-1 text-sm leading-6 text-dana-muted">{product.description}</p>
      {hasUrl ? (
        <a
          href={product.url}
          target="_blank"
          rel="noreferrer"
          className="mt-5 rounded-lg bg-[#00478D] px-5 py-3 text-center text-sm font-extrabold text-white shadow-sm transition hover:bg-[#00376E]"
        >
          {product.ctaLabel ?? 'Cotizar'}
        </a>
      ) : (
        <span className="mt-5 rounded-lg bg-slate-100 px-5 py-3 text-center text-sm font-extrabold text-dana-muted">
          No disponible
        </span>
      )}
    </article>
  );
}
