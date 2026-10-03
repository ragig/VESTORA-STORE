import Link from "next/link";
import ProductCard from "../../components/ProductCard";
import { getSession } from "../../lib/auth";
import { listWishlistProducts } from "../../lib/db";

export default async function WishlistPage() {
  const session = await getSession();
  if (session?.user?.role !== "CUSTOMER") return <section className="section-pad wishlist-page"><div className="page-heading"><p className="eyebrow">Your saved collection</p><h1>Keep what<br /><em>speaks to you.</em></h1><p>Sign in as a customer to save and view your favourite pieces.</p><Link className="button button-dark" href="/login">Sign in to view wishlist <span>↗</span></Link></div></section>;
  const products = await listWishlistProducts(Number(session.user.id));
  return <section className="section-pad wishlist-page"><div className="page-heading"><p className="eyebrow">Your saved collection</p><h1>Things you<br /><em>want to keep.</em></h1><p>Pieces you saved for a considered moment.</p></div><div className="filter-row"><span>{products.length} saved piece{products.length === 1 ? "" : "s"}</span><Link href="/products">Continue shopping ↗</Link></div>{products.length ? <div className="product-grid">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <div className="wishlist-empty"><p>Your wishlist is waiting for something special.</p><Link href="/products">Explore the collection <span>↗</span></Link></div>}</section>;
}
