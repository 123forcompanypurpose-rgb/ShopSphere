import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { productsApi } from '../api/products';
import { categoriesApi } from '../api/categories';
import { Product, Category } from '../api/types';
import { ProductCard } from '../components/ProductCard';
import { ProductGridSkeleton } from '../components/Skeletons';
import { ErrorState } from '../components/ErrorState';
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  RotateCcw,
  Sparkles,
  Shirt,
  Gem,
  ShoppingBag,
  Footprints,
  Tag,
  Layers,
} from 'lucide-react';

export const Home: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [catRes, prodRes] = await Promise.all([
        categoriesApi.getCategories(),
        productsApi.getProducts({ sort: 'newest', size: 8 }),
      ]);
      setCategories(Array.isArray(catRes) ? catRes : (catRes as any)?.content || []);
      setFeaturedProducts(
        Array.isArray(prodRes?.content)
          ? prodRes.content
          : Array.isArray(prodRes)
          ? prodRes
          : []
      );
    } catch (err: any) {
      setError(err?.message || 'Failed to load store data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'ShopSphere · Modern Fashion, Apparel & Curated Style';
    loadData();
  }, []);

  const getCategoryIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('women')) return Sparkles;
    if (lower.includes('men')) return Shirt;
    if (lower.includes('jewel')) return Gem;
    if (lower.includes('bag') || lower.includes('pack')) return ShoppingBag;
    if (lower.includes('shoe') || lower.includes('foot')) return Footprints;
    if (lower.includes('access')) return Tag;
    return Layers;
  };

  return (
    <div className="relative overflow-hidden">
      {/* Top Ambient Glow matching Stitch */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary-fixed-dim/20 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-72 left-10 w-80 h-80 bg-secondary-fixed/30 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Hero Showcase Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 pt-8 pb-12 lg:pt-16 lg:pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface-container rounded-full text-on-surface font-label-sm text-label-sm w-fit border border-line">
              <span className="w-2 h-2 rounded-full bg-secondary-container animate-pulse" />
              <span>Curated Seasonal Drop // 2026 Collection</span>
            </div>

            <h1 className="font-headline-h2 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-on-surface leading-[1.1]">
              Crafted for <br />
              <span className="text-primary bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                Effortless Elegance
              </span>
            </h1>

            <p className="font-body text-body-lg text-on-surface-variant max-w-xl text-base sm:text-lg">
              Explore trendsetting apparel, handcrafted jewelry, and signature designer accessories curated for your everyday aesthetic. Premium style delivered to your doorstep.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                to="/products"
                className="h-12 px-6 rounded-xl bg-primary text-on-primary font-caption-medium text-caption-medium flex items-center gap-2 hover:opacity-90 shadow-md transition-all active:scale-95"
              >
                Shop Collection
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/products?sort=newest"
                className="h-12 px-6 rounded-xl bg-surface border border-line text-on-surface font-caption-medium text-caption-medium flex items-center gap-2 hover:bg-surface-container transition-colors shadow-sm"
              >
                <Sparkles className="w-4 h-4 text-accent" />
                Latest Arrivals
              </Link>
            </div>

            {/* Feature Value Props strip */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-line mt-4">
              <div className="flex items-center gap-2 text-xs text-on-surface-variant font-medium">
                <Zap className="w-4 h-4 text-primary shrink-0" />
                <span>Express Delivery</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-on-surface-variant font-medium">
                <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                <span>100% Verified Quality</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-on-surface-variant font-medium">
                <RotateCcw className="w-4 h-4 text-primary shrink-0" />
                <span>7-Day Easy Returns</span>
              </div>
            </div>
          </div>

          {/* Hero Banner Visual */}
          <div className="lg:col-span-5 relative">
            <div className="relative bg-surface rounded-2xl p-6 border border-line shadow-xl overflow-hidden group">
              <div className="aspect-[4/3] rounded-xl bg-surface-container-low flex items-center justify-center p-6 relative overflow-hidden">
                <img
                  src="https://fakestoreapi.com/img/81XH0e8fefL._AC_UY879_t.png"
                  alt="Removable Hooded Faux Leather Moto Biker Jacket"
                  className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute bottom-3 left-3 right-3 px-3 py-2 bg-surface/90 backdrop-blur-md rounded-lg border border-line text-xs flex items-center justify-between">
                  <span className="font-semibold text-on-surface">Faux Leather Moto Jacket</span>
                  <span className="text-primary font-bold">Trending Pick</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Filter Chips Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-headline-h2 text-2xl font-bold text-on-surface">
              Curated Fashion Categories
            </h2>
            <p className="text-sm text-on-surface-variant mt-1">
              Explore handpicked collections tailored to your personal aesthetic
            </p>
          </div>
          <Link
            to="/products"
            className="text-primary font-caption-medium text-sm flex items-center gap-1 hover:underline"
          >
            All Categories <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.isArray(categories) && categories.map((cat) => {
            const Icon = getCategoryIcon(cat.name);
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => navigate(`/products?categoryId=${cat.id}`)}
                className="p-4 rounded-xl bg-surface border border-line hover:border-primary/40 hover:bg-surface-container-low transition-all text-left group flex flex-col justify-between h-28 shadow-sm"
              >
                <div className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-colors">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-caption-medium text-caption-medium text-on-surface font-semibold group-hover:text-primary transition-colors">
                    {cat.name}
                  </span>
                  <ArrowRight className="w-4 h-4 text-outline opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Featured Products Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-headline-h2 text-2xl font-bold text-on-surface">
              Trending Styles & Must-Haves
            </h2>
            <p className="text-sm text-on-surface-variant mt-1">
              Seasonal bestsellers and timeless essentials ready to wear
            </p>
          </div>
          <Link
            to="/products"
            className="text-primary font-caption-medium text-sm flex items-center gap-1 hover:underline"
          >
            View all styles <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <ProductGridSkeleton count={8} />
        ) : error ? (
          <ErrorState message={error} onRetry={loadData} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.isArray(featuredProducts) && featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
