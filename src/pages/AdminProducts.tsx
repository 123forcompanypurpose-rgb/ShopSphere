import React, { useEffect, useState, useCallback } from 'react';
import { productsApi, SaveProductDto } from '../api/products';
import { categoriesApi, SaveCategoryDto } from '../api/categories';
import { Product, Category, PageResponse } from '../api/types';
import { TableSkeleton } from '../components/Skeletons';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { ConfirmModal } from '../components/ConfirmModal';
import { formatCurrency } from '../utils/formatters';
import {
  Plus,
  Pencil,
  Trash2,
  Layers,
  Tag,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  Check,
  Package,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Product Form ───────────────────────────────────────────────────────────
interface ProductFormState {
  name: string;
  description: string;
  price: string;
  stockQuantity: string;
  categoryId: string;
  imageUrl: string;
}

const EMPTY_PRODUCT_FORM: ProductFormState = {
  name: '',
  description: '',
  price: '',
  stockQuantity: '',
  categoryId: '',
  imageUrl: '',
};

// ─── Category Form ───────────────────────────────────────────────────────────
interface CategoryFormState {
  name: string;
  description: string;
}

const EMPTY_CATEGORY_FORM: CategoryFormState = { name: '', description: '' };

// ─── Tab type ────────────────────────────────────────────────────────────────
type Tab = 'products' | 'categories';

// ────────────────────────────────────────────────────────────────────────────
export const AdminProducts: React.FC = () => {
  const [tab, setTab] = useState<Tab>('products');

  // ── Products state ──
  const [productsPage, setProductsPage] = useState<PageResponse<Product> | null>(null);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [productPageNum, setProductPageNum] = useState(0);
  const [productSearch, setProductSearch] = useState('');
  const [productSearchInput, setProductSearchInput] = useState('');

  // ── Product form / edit modal ──
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState<ProductFormState>(EMPTY_PRODUCT_FORM);
  const [savingProduct, setSavingProduct] = useState(false);

  // ── Delete product confirm ──
  const [deleteProductTarget, setDeleteProductTarget] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState(false);

  // ── Categories state ──
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  // ── Category form / edit modal ──
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState<CategoryFormState>(EMPTY_CATEGORY_FORM);
  const [savingCategory, setSavingCategory] = useState(false);

  // ── Delete category confirm ──
  const [deleteCategoryTarget, setDeleteCategoryTarget] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState(false);

  useEffect(() => {
    document.title = 'Products & Categories · SphereHQ';
  }, []);

  // ── Load products ──────────────────────────────────────────────────────────
  const loadProducts = useCallback(
    async (page = 0, keyword = productSearch) => {
      try {
        setProductsLoading(true);
        setProductsError(null);
        const data = await productsApi.getProducts({ page, size: 10, keyword: keyword || undefined });
        setProductsPage(data);
        setProductPageNum(page);
      } catch (err: any) {
        setProductsError(err?.message || 'Failed to load products');
      } finally {
        setProductsLoading(false);
      }
    },
    [productSearch],
  );

  // ── Load categories ────────────────────────────────────────────────────────
  const loadCategories = useCallback(async () => {
    try {
      setCategoriesLoading(true);
      setCategoriesError(null);
      const data = await categoriesApi.getCategories();
      setCategories(data);
    } catch (err: any) {
      setCategoriesError(err?.message || 'Failed to load categories');
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts(0, productSearch);
  }, [productSearch]);

  useEffect(() => {
    loadCategories();
  }, []);

  // ── Product CRUD ───────────────────────────────────────────────────────────
  const openAddProduct = () => {
    setEditingProduct(null);
    setProductForm(EMPTY_PRODUCT_FORM);
    setShowProductForm(true);
  };

  const openEditProduct = (p: Product) => {
    setEditingProduct(p);
    setProductForm({
      name: p.name,
      description: p.description,
      price: String(p.price),
      stockQuantity: String(p.stockQuantity),
      categoryId: String(p.categoryId),
      imageUrl: p.imageUrl ?? '',
    });
    setShowProductForm(true);
  };

  const saveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const dto: SaveProductDto = {
      name: productForm.name.trim(),
      description: productForm.description.trim(),
      price: parseFloat(productForm.price),
      stockQuantity: parseInt(productForm.stockQuantity, 10),
      categoryId: parseInt(productForm.categoryId, 10),
      imageUrl: productForm.imageUrl.trim() || undefined,
    };
    if (!dto.name || isNaN(dto.price) || isNaN(dto.stockQuantity) || isNaN(dto.categoryId)) {
      toast.error('Please fill all required fields correctly.');
      return;
    }
    try {
      setSavingProduct(true);
      if (editingProduct) {
        await productsApi.updateProduct(editingProduct.id, dto);
        toast.success('Product updated.');
      } else {
        await productsApi.createProduct(dto);
        toast.success('Product created.');
      }
      setShowProductForm(false);
      loadProducts(productPageNum);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save product.');
    } finally {
      setSavingProduct(false);
    }
  };

  const confirmDeleteProduct = async () => {
    if (!deleteProductTarget) return;
    try {
      setDeletingProduct(true);
      await productsApi.deleteProduct(deleteProductTarget.id);
      toast.success(`"${deleteProductTarget.name}" deleted.`);
      setDeleteProductTarget(null);
      loadProducts(productPageNum);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete product.');
    } finally {
      setDeletingProduct(false);
    }
  };

  // ── Category CRUD ──────────────────────────────────────────────────────────
  const openAddCategory = () => {
    setEditingCategory(null);
    setCategoryForm(EMPTY_CATEGORY_FORM);
    setShowCategoryForm(true);
  };

  const openEditCategory = (c: Category) => {
    setEditingCategory(c);
    setCategoryForm({ name: c.name, description: c.description ?? '' });
    setShowCategoryForm(true);
  };

  const saveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const dto: SaveCategoryDto = {
      name: categoryForm.name.trim(),
      description: categoryForm.description.trim() || undefined,
    };
    if (!dto.name) {
      toast.error('Category name is required.');
      return;
    }
    try {
      setSavingCategory(true);
      if (editingCategory) {
        await categoriesApi.updateCategory(editingCategory.id, dto);
        toast.success('Category updated.');
      } else {
        await categoriesApi.createCategory(dto);
        toast.success('Category created.');
      }
      setShowCategoryForm(false);
      loadCategories();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save category.');
    } finally {
      setSavingCategory(false);
    }
  };

  const confirmDeleteCategory = async () => {
    if (!deleteCategoryTarget) return;
    try {
      setDeletingCategory(true);
      await categoriesApi.deleteCategory(deleteCategoryTarget.id);
      toast.success(`"${deleteCategoryTarget.name}" deleted.`);
      setDeleteCategoryTarget(null);
      loadCategories();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete category.');
    } finally {
      setDeletingCategory(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Products &amp; Categories</h1>
          <p className="text-sm text-muted mt-0.5">Manage your product catalogue and categories</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-surface-container rounded-xl p-1 w-fit">
        {(['products', 'categories'] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
              tab === t
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {t === 'products' ? <Layers className="w-4 h-4" /> : <Tag className="w-4 h-4" />}
            {t}
          </button>
        ))}
      </div>

      {/* ── Products Tab ──────────────────────────────────────────────────── */}
      {tab === 'products' && (
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            {/* Search */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setProductSearch(productSearchInput);
              }}
              className="flex items-center gap-2 max-w-xs"
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  type="text"
                  placeholder="Search products…"
                  value={productSearchInput}
                  onChange={(e) => setProductSearchInput(e.target.value)}
                  className="w-full h-9 pl-9 pr-8 text-sm rounded-lg border border-line bg-surface focus:outline-none focus:border-primary"
                />
                {productSearchInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setProductSearchInput('');
                      setProductSearch('');
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-on-surface"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </form>
            <button
              type="button"
              onClick={openAddProduct}
              className="h-9 px-4 rounded-lg bg-primary text-on-primary text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" /> Add Product
            </button>
          </div>

          {productsLoading ? (
            <TableSkeleton rows={6} />
          ) : productsError ? (
            <ErrorState message={productsError} onRetry={() => loadProducts(productPageNum)} />
          ) : !productsPage || productsPage.content.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No Products Found"
              description="Add your first product to get started."
              actionText="Add Product"
              onAction={openAddProduct}
            />
          ) : (
            <>
              <div className="bg-surface rounded-2xl border border-line overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line bg-surface-container text-left">
                      <th className="px-4 py-3 font-semibold text-on-surface-variant">Product</th>
                      <th className="px-4 py-3 font-semibold text-on-surface-variant hidden sm:table-cell">
                        Category
                      </th>
                      <th className="px-4 py-3 font-semibold text-on-surface-variant">Price</th>
                      <th className="px-4 py-3 font-semibold text-on-surface-variant hidden md:table-cell">
                        Stock
                      </th>
                      <th className="px-4 py-3 font-semibold text-on-surface-variant text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {productsPage.content.map((p) => (
                      <tr key={p.id} className="hover:bg-surface-container/50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium text-on-surface">{p.name}</p>
                          <p className="text-xs text-muted truncate max-w-[200px]">
                            {p.description}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-on-surface-variant hidden sm:table-cell">
                          {p.categoryName ?? `#${p.categoryId}`}
                        </td>
                        <td className="px-4 py-3 font-medium text-on-surface">
                          {formatCurrency(p.price)}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                              p.stockQuantity > 0
                                ? 'bg-success/10 text-success'
                                : 'bg-error/10 text-error'
                            }`}
                          >
                            {p.stockQuantity > 0 ? (
                              <Check className="w-3 h-3" />
                            ) : (
                              <X className="w-3 h-3" />
                            )}
                            {p.stockQuantity}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEditProduct(p)}
                              className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-primary transition-colors"
                              title="Edit"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteProductTarget(p)}
                              className="p-1.5 rounded-lg text-on-surface-variant hover:bg-error-container/20 hover:text-error transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {productsPage.totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-6">
                  <button
                    type="button"
                    disabled={productsPage.page === 0}
                    onClick={() => loadProducts(productsPage.page - 1)}
                    className="h-8 px-3 rounded-lg border border-line bg-surface text-xs font-semibold text-on-surface hover:bg-surface-container disabled:opacity-40 flex items-center gap-1"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Prev
                  </button>
                  <span className="text-xs text-muted">
                    {productsPage.page + 1} / {productsPage.totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={productsPage.last}
                    onClick={() => loadProducts(productsPage.page + 1)}
                    className="h-8 px-3 rounded-lg border border-line bg-surface text-xs font-semibold text-on-surface hover:bg-surface-container disabled:opacity-40 flex items-center gap-1"
                  >
                    Next <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Categories Tab ────────────────────────────────────────────────── */}
      {tab === 'categories' && (
        <div>
          <div className="flex justify-end mb-4">
            <button
              type="button"
              onClick={openAddCategory}
              className="h-9 px-4 rounded-lg bg-primary text-on-primary text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" /> Add Category
            </button>
          </div>

          {categoriesLoading ? (
            <TableSkeleton rows={4} />
          ) : categoriesError ? (
            <ErrorState message={categoriesError} onRetry={loadCategories} />
          ) : categories.length === 0 ? (
            <EmptyState
              icon={Tag}
              title="No Categories Yet"
              description="Create a category to organise your products."
              actionText="Add Category"
              onAction={openAddCategory}
            />
          ) : (
            <div className="bg-surface rounded-2xl border border-line overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line bg-surface-container text-left">
                    <th className="px-4 py-3 font-semibold text-on-surface-variant">Name</th>
                    <th className="px-4 py-3 font-semibold text-on-surface-variant hidden sm:table-cell">
                      Description
                    </th>
                    <th className="px-4 py-3 font-semibold text-on-surface-variant text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {categories.map((c) => (
                    <tr key={c.id} className="hover:bg-surface-container/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-on-surface">{c.name}</td>
                      <td className="px-4 py-3 text-on-surface-variant hidden sm:table-cell">
                        {c.description || '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditCategory(c)}
                            className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-primary transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteCategoryTarget(c)}
                            className="p-1.5 rounded-lg text-on-surface-variant hover:bg-error-container/20 hover:text-error transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Product Form Modal ─────────────────────────────────────────────── */}
      {showProductForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-surface rounded-2xl border border-line shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-line">
              <h2 className="font-bold text-on-surface text-lg">
                {editingProduct ? 'Edit Product' : 'New Product'}
              </h2>
              <button
                type="button"
                onClick={() => setShowProductForm(false)}
                className="p-1.5 rounded-lg text-muted hover:bg-surface-container transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={saveProduct} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  Name *
                </label>
                <input
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full h-10 px-3 text-sm rounded-lg border border-line bg-surface focus:outline-none focus:border-primary"
                  placeholder="Product name"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  Description *
                </label>
                <textarea
                  required
                  rows={3}
                  value={productForm.description}
                  onChange={(e) => setProductForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-line bg-surface focus:outline-none focus:border-primary resize-none"
                  placeholder="Product description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                    Price (₹) *
                  </label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={productForm.price}
                    onChange={(e) => setProductForm((f) => ({ ...f, price: e.target.value }))}
                    className="w-full h-10 px-3 text-sm rounded-lg border border-line bg-surface focus:outline-none focus:border-primary"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                    Stock *
                  </label>
                  <input
                    required
                    type="number"
                    min="0"
                    value={productForm.stockQuantity}
                    onChange={(e) =>
                      setProductForm((f) => ({ ...f, stockQuantity: e.target.value }))
                    }
                    className="w-full h-10 px-3 text-sm rounded-lg border border-line bg-surface focus:outline-none focus:border-primary"
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  Category *
                </label>
                <select
                  required
                  value={productForm.categoryId}
                  onChange={(e) => setProductForm((f) => ({ ...f, categoryId: e.target.value }))}
                  className="w-full h-10 px-3 text-sm rounded-lg border border-line bg-surface focus:outline-none focus:border-primary"
                >
                  <option value="">Select a category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  Image URL
                </label>
                <input
                  type="url"
                  value={productForm.imageUrl}
                  onChange={(e) => setProductForm((f) => ({ ...f, imageUrl: e.target.value }))}
                  className="w-full h-10 px-3 text-sm rounded-lg border border-line bg-surface focus:outline-none focus:border-primary"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowProductForm(false)}
                  className="h-10 px-4 rounded-lg border border-line text-sm font-semibold text-on-surface hover:bg-surface-container transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProduct}
                  className="h-10 px-5 rounded-lg bg-primary text-on-primary text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-2"
                >
                  {savingProduct && (
                    <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                  )}
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Category Form Modal ────────────────────────────────────────────── */}
      {showCategoryForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-surface rounded-2xl border border-line shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-line">
              <h2 className="font-bold text-on-surface text-lg">
                {editingCategory ? 'Edit Category' : 'New Category'}
              </h2>
              <button
                type="button"
                onClick={() => setShowCategoryForm(false)}
                className="p-1.5 rounded-lg text-muted hover:bg-surface-container transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={saveCategory} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  Name *
                </label>
                <input
                  required
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full h-10 px-3 text-sm rounded-lg border border-line bg-surface focus:outline-none focus:border-primary"
                  placeholder="Category name"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-line bg-surface focus:outline-none focus:border-primary resize-none"
                  placeholder="Optional description"
                />
              </div>
              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCategoryForm(false)}
                  className="h-10 px-4 rounded-lg border border-line text-sm font-semibold text-on-surface hover:bg-surface-container transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCategory}
                  className="h-10 px-5 rounded-lg bg-primary text-on-primary text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-2"
                >
                  {savingCategory && (
                    <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                  )}
                  {editingCategory ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirms ────────────────────────────────────────────────── */}
      <ConfirmModal
        isOpen={!!deleteProductTarget}
        title="Delete Product?"
        message={`"${deleteProductTarget?.name}" will be permanently removed.`}
        confirmText={deletingProduct ? 'Deleting…' : 'Delete'}
        loading={deletingProduct}
        variant="danger"
        onConfirm={confirmDeleteProduct}
        onClose={() => setDeleteProductTarget(null)}
      />
      <ConfirmModal
        isOpen={!!deleteCategoryTarget}
        title="Delete Category?"
        message={`"${deleteCategoryTarget?.name}" will be permanently removed. Products in this category may be affected.`}
        confirmText={deletingCategory ? 'Deleting…' : 'Delete'}
        loading={deletingCategory}
        variant="danger"
        onConfirm={confirmDeleteCategory}
        onClose={() => setDeleteCategoryTarget(null)}
      />
    </div>
  );
};
