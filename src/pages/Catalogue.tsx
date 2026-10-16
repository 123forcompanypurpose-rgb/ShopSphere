import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productsApi } from '../api/products';
import { categoriesApi } from '../api/categories';
import { Product, Category, PageResponse } from '../api/types';
import { ProductCard } from '../components/ProductCard';
import { ProductGridSkeleton } from '../components/Skeletons';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import {
  Filter,
  SlidersHorizontal,
  Search,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  PackageSearch,
} from 'lucide-react';

export const Catalogue: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [categories, setCategories] = useState<Category[]>([]);
  const [data, setData] = useState<PageResponse<Product> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Read URL query params
  const keyword = searchParams.get('keyword') || '';
  const categoryId = searchParams.get('categoryId') ? Number(searchParams.get('categoryId')) : undefined;
  const minPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined;
  const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined;
  const inStock = searchParams.get('inStock') === 'true';
  const sort = (searchParams.get('sort') as 'newest' | 'priceAsc' | 'priceDesc') || 'newest';
  const page = searchParams.get('page') ? Number(searchParams.get('page')) : 0;
  const size = 12;

  // Local state for debounced keyword input
  const [inputKeyword, setInputKeyword] = useState(keyword);
  const [inputMinPrice, setInputMinPrice] = useState(minPrice ? String(minPrice) : '');
  const [inputMaxPrice, setInputMaxPrice] = useState(maxPrice ? String(maxPrice) : '');

  // Load categories once
  useEffect(() => {
    categoriesApi.getCategories().then(setCategories).catch(() => {});
  }, []);

  // Derive selected category
  const selectedCategory = useMemo(
    () => (Array.isArray(categories) ? categories.find((c) => c.id === categoryId) : undefined),
    [categories, categoryId]
  );

  // Update document title
  useEffect(() => {
    document.title = selectedCategory
      ? `${selectedCategory.name} · ShopSphere`
      : 'Fashion & Apparel Collection · ShopSphere';
  }, [selectedCategory]);

  // Sync search input if URL changes externally
  useEffect(() => {
    setInputKeyword(keyword);
  }, [keyword]);

  // Debounce search input (400ms per spec §8)
  useEffect(() => {
    const handler = setTimeout(() => {
      if (inputKeyword !== keyword) {
        updateFilter({ keyword: inputKeyword.trim() || undefined, page: 0 });
      }
    }, 400);
    return () => clearTimeout(handler);
  }, [inputKeyword]);

  // Helper to update query params safely
  const updateFilter = (updates: Record<string, string | number | boolean | undefined>) => {
    const nextParams = new URLSearchParams(searchParams);

    Object.entries(updates).forEach(([key, val]) => {
      if (val === undefined || val === '' || val === false) {
        nextParams.delete(key);
      } else {
        nextParams.set(key, String(val));
      }
    });

    setSearchParams(nextParams);
  };

  // Fetch products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await productsApi.getProducts({
        keyword: keyword || undefined,
        categoryId,
        minPrice,
        maxPrice,
        inStock: inStock ? true : undefined,
        sort,
        page,
        size,
      });
      setData(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to load catalogue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [keyword, categoryId, minPrice, maxPrice, inStock, sort, page]);

  const handlePriceFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const min = inputMinPrice ? Number(inputMinPrice) : undefined;
    const max = inputMaxPrice ? Number(inputMaxPrice) : undefined;

    if (min !== undefined && max !== undefined && min > max) {
      alert('Minimum price cannot be greater than maximum price.');
      return;
    }

    updateFilter({
      minPrice: min,
      maxPrice: max,
      page: 0,
    });
  };

  const clearAllFilters = () => {
    setInputKeyword('');
    setInputMinPrice('');
    setInputMaxPrice('');
    setSearchParams(new URLSearchParams());
  };

  const hasActiveFilters = Boolean(
    keyword || categoryId || minPrice || maxPrice || inStock || sort !== 'newest'
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-line mb-8">
        <div>
          <h1 className="font-headline-h2 text-3xl font-bold text-on-surface">
            {selectedCategory ? selectedCategory.name : 'Fashion & Lifestyle Collection'}
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            {data
              ? `${data.totalElements} ${data.totalElements === 1 ? 'item' : 'items'} available`
              : 'Browsing collection'}
          </p>
        </div>

        {/* Sort & Quick Filter Bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-surface border border-line rounded-lg px-3 py-1.5 shadow-sm">
            <span className="text-xs text-muted font-medium">Sort by:</span>
            <select
              value={sort}
              onChange={(e) => updateFilter({ sort: e.target.value as any, page: 0 })}
              className="bg-transparent text-sm font-semibold text-on-surface focus:outline-none cursor-pointer"
            >
              <option value="newest">Newest Arrivals</option>
              <option value="priceAsc">Price: Low to High</option>
              <option value="priceDesc">Price: High to Low</option>
            </select>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container text-xs font-semibold text-on-surface hover:bg-surface-container-high transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Clear Filters
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Left Filter Sidebar */}
        <aside className="lg:col-span-1 bg-surface border border-line rounded-2xl p-5 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-line">
            <span className="font-caption-medium text-caption-medium font-bold text-on-surface flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-primary" />
              Filter Collection
            </span>
          </div>

          {/* Search within catalogue */}
          <div>
            <label className="block text-xs font-semibold text-on-surface mb-1.5">
              Search by Keyword
            </label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted pointer-events-none" />
              <input
                type="text"
                value={inputKeyword}
                onChange={(e) => setInputKeyword(e.target.value)}
                placeholder="e.g. Jacket, Cotton, Gold, Casual..."
                className="w-full h-9 pl-9 pr-3 text-xs bg-surface-container-low rounded-lg border border-line focus:outline-none focus:ring-1 focus:ring-primary text-on-surface placeholder:text-muted"
              />
            </div>
          </div>

          {/* Categories */}
          <div>
            <label className="block text-xs font-semibold text-on-surface mb-2">
              Category
            </label>
            <div className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-1">
              <button
                type="button"
                onClick={() => updateFilter({ categoryId: undefined, page: 0 })}
                className={`text-left px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  categoryId === undefined
                    ? 'bg-primary text-on-primary font-semibold'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                }`}
              >
                All Categories
              </button>
              {Array.isArray(categories) && categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => updateFilter({ categoryId: cat.id, page: 0 })}
                  className={`text-left px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    categoryId === cat.id
                      ? 'bg-primary text-on-primary font-semibold'
                      : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <form onSubmit={handlePriceFilterSubmit}>
            <label className="block text-xs font-semibold text-on-surface mb-2">
              Price Range (₹)
            </label>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <input
                type="number"
                min="0"
                placeholder="Min"
                value={inputMinPrice}
                onChange={(e) => setInputMinPrice(e.target.value)}
                className="h-8 px-2.5 text-xs bg-surface-container-low rounded-md border border-line focus:outline-none focus:ring-1 focus:ring-primary text-on-surface"
              />
              <input
                type="number"
                min="0"
                placeholder="Max"
                value={inputMaxPrice}
                onChange={(e) => setInputMaxPrice(e.target.value)}
                className="h-8 px-2.5 text-xs bg-surface-container-low rounded-md border border-line focus:outline-none focus:ring-1 focus:ring-primary text-on-surface"
              />
            </div>
            <button
              type="submit"
              className="w-full h-8 rounded-md bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-on-surface transition-colors"
            >
              Apply Range
            </button>
          </form>

          {/* In Stock Only Checkbox */}
          <div className="pt-2 border-t border-line">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={inStock}
                onChange={(e) => updateFilter({ inStock: e.target.checked ? true : undefined, page: 0 })}
                className="w-4 h-4 rounded text-primary focus:ring-primary border-line"
              />
              <span className="text-xs font-medium text-on-surface">In Stock Only</span>
            </label>
          </div>
        </aside>

        {/* Products Results Grid */}
        <section className="lg:col-span-3">
          {loading ? (
            <ProductGridSkeleton count={9} />
          ) : error ? (
            <ErrorState message={error} onRetry={fetchProducts} />
          ) : !data || data.content.length === 0 ? (
            <EmptyState
              icon={PackageSearch}
              title="No products match your filters"
              description="Try adjusting your keyword, expanding your price range, or clearing category restrictions."
              actionText="Clear Filters"
              onAction={clearAllFilters}
            />
          ) : (
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {data.content.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Pagination Controls (UI shows 1-based pages) */}
              {data.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-12 pt-6 border-t border-line">
                  <button
                    type="button"
                    disabled={data.page === 0}
                    onClick={() => updateFilter({ page: Math.max(0, data.page - 1) })}
                    className="h-10 px-3.5 rounded-lg border border-line bg-surface text-on-surface hover:bg-surface-container disabled:opacity-40 disabled:hover:bg-surface flex items-center gap-1 text-sm font-medium transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" /> Previous
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: data.totalPages }).map((_, i) => {
                      // Show nearby pages only
                      if (
                        i === 0 ||
                        i === data.totalPages - 1 ||
                        (i >= data.page - 1 && i <= data.page + 1)
                      ) {
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => updateFilter({ page: i })}
                            className={`w-10 h-10 rounded-lg text-sm font-semibold transition-colors ${
                              data.page === i
                                ? 'bg-primary text-on-primary shadow-sm'
                                : 'bg-surface text-on-surface hover:bg-surface-container border border-line'
                            }`}
                          >
                            {i + 1}
                          </button>
                        );
                      }
                      if (i === data.page - 2 || i === data.page + 2) {
                        return (
                          <span key={i} className="px-2 text-muted text-sm">
                            ...
                          </span>
                        );
                      }
                      return null;
                    })}
                  </div>

                  <button
                    type="button"
                    disabled={data.last}
                    onClick={() => updateFilter({ page: data.page + 1 })}
                    className="h-10 px-3.5 rounded-lg border border-line bg-surface text-on-surface hover:bg-surface-container disabled:opacity-40 disabled:hover:bg-surface flex items-center gap-1 text-sm font-medium transition-colors"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
