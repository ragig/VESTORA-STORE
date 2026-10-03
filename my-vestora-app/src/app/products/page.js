import CategoryFilter from "../../components/CategoryFilter";
import ProductCard from "../../components/ProductCard";
import { getProducts } from "../../lib/products";

export default async function ProductsPage({ searchParams }) {
  const products = await getProducts();
  const params = await searchParams;
  const selectedCategory = params?.category || "";
  const categories = [...new Set(products.map((product) => product.category).filter(Boolean))].sort();
  const visibleProducts = selectedCategory ? products.filter((product) => product.category === selectedCategory) : products;

  return (
    <section className="section-pad products-page">
      <div className="page-heading">
        <p className="eyebrow">The collection</p>
        <h1>Objects for<br /><em>everyday living.</em></h1>
        <p>Small-batch pieces made to be used, loved, and lived with.</p>
      </div>

      <div className="filter-row">
        <span>{visibleProducts.length} piece{visibleProducts.length === 1 ? "" : "s"}</span>
        <CategoryFilter categories={categories} selectedCategory={selectedCategory} />
      </div>

      <div className="product-grid">
        {visibleProducts.map((product) => <ProductCard key={product.id} product={product} />)}
      </div>
    </section>
  );
}
