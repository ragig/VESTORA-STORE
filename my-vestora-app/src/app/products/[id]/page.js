import Link from "next/link";
import { notFound } from "next/navigation";
import ProductCard from "../../../components/ProductCard";
import ProductReviews from "../../../components/ProductReviews";
import { getProduct, getProducts } from "../../../lib/products";
import { formatINR } from "../../../lib/currency";
import { getSession } from "../../../lib/auth";
import { customerCanReviewProduct, findProductReviewByUser, listProductReviews } from "../../../lib/db";

export default async function ProductPage({ params }) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();

  const [products, session] = await Promise.all([getProducts(), getSession()]);
  const productId = Number(product.id);
  const isDatabaseProduct = Number.isInteger(productId);
  const isCustomer = session?.user?.role === "CUSTOMER";
  let reviews = [];
  let canReview = false;
  let ownReview = null;

  if (isDatabaseProduct) {
    try {
      reviews = await listProductReviews(productId);
      if (isCustomer) {
        const userId = Number(session.user.id);
        [canReview, ownReview] = await Promise.all([
          customerCanReviewProduct(productId, userId),
          findProductReviewByUser(productId, userId),
        ]);
      }
    } catch {
      reviews = [];
    }
  }

  return (
    <section className="product-detail section-pad">
      <Link className="back-link" href="/products">Back to collection</Link>
      <div className="detail-layout">
        <div className="detail-image"><img src={product.image} alt={product.name} /></div>
        <div className="detail-copy">
          <p className="eyebrow">{product.category}</p>
          <h1>{product.name}</h1>
          <strong className="detail-price">{formatINR(product.price)}</strong>
          <p className="detail-description">{product.description}</p>
          {product.sizes?.length > 0 && <div className="product-size-list"><span>Available sizes</span><p>{product.sizes.map((item) => `${item.size} (${item.stock} available)`).join(" · ")}</p></div>}
          <ProductCard product={product} />
          <p className="shipping-note">Free shipping on orders over ₹15,000<br />Usually ships within 2-3 business days</p>
        </div>
      </div>

      <ProductReviews productId={productId} initialReviews={reviews} canReview={canReview} ownReview={ownReview} isCustomer={isCustomer} />

      <div className="related">
        <p className="eyebrow">You may also like</p>
        <div className="product-grid">{products.filter((item) => item.id !== product.id).slice(0, 3).map((item) => <ProductCard key={item.id} product={item} />)}</div>
      </div>
    </section>
  );
}
