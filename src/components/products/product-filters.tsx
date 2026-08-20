'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface ProductFiltersProps {
  categories: Category[];
  currentParams: Record<string, string | undefined>;
}

export function ProductFilters({ categories, currentParams }: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === null || value === '') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      params.delete('page'); // reset pagination
      router.push(`/products?${params.toString()}`);
    },
    [router, searchParams]
  );

  return (
    <div className="space-y-8 rounded-2xl border border-neutral-200 bg-neutral-100/40 p-5">
      {/* Sort */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-neutral-900">Sort by</h3>
        <select
          value={currentParams.sort || ''}
          onChange={(e) => updateParam('sort', e.target.value || null)}
          className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent-500"
        >
          <option value="">Newest</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="name">Name A–Z</option>
        </select>
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-neutral-900">Category</h3>
          <ul className="space-y-2">
            <li>
              <button
                onClick={() => updateParam('category', null)}
                className={`text-sm ${
                  !currentParams.category
                    ? 'font-medium text-accent-400'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                All categories
              </button>
            </li>
            {categories.map((cat) => (
              <li key={cat.id}>
                <button
                  onClick={() => updateParam('category', cat.slug)}
                  className={`text-sm ${
                    currentParams.category === cat.slug
                      ? 'font-medium text-accent-400'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  {cat.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Stock */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-neutral-900">Availability</h3>
        <label className="flex items-center gap-2 text-sm text-neutral-700">
          <input
            type="checkbox"
            checked={currentParams.in_stock === 'true'}
            onChange={(e) => updateParam('in_stock', e.target.checked ? 'true' : null)}
            className="h-4 w-4 rounded border-neutral-300 accent-accent-500"
          />
          In stock only
        </label>
      </div>

      {/* Price */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-neutral-900">Price range</h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            defaultValue={currentParams.min_price || ''}
            onBlur={(e) => updateParam('min_price', e.target.value || null)}
            className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent-500"
          />
          <span className="text-neutral-400">–</span>
          <input
            type="number"
            placeholder="Max"
            defaultValue={currentParams.max_price || ''}
            onBlur={(e) => updateParam('max_price', e.target.value || null)}
            className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent-500"
          />
        </div>
      </div>

      {/* Clear */}
      <button
        onClick={() => router.push('/products')}
        className="w-full rounded-lg border border-neutral-200 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
      >
        Clear filters
      </button>
    </div>
  );
}
