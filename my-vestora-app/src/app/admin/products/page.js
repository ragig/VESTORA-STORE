import Link from "next/link";
import { getProducts } from "../../../lib/products";
import { formatINR } from "../../../lib/currency";
import { listProducts } from "../../../lib/db";
import { getSession } from "../../../lib/auth";
import DeleteProductButton from "../../../components/DeleteProductButton";

export default async function AdminProductsPage() {
	const session = await getSession();
	if (session?.user?.role !== "ADMIN") return <section className="admin-page section-pad"><h1>Admin access required.</h1><Link href="/login">Sign in</Link></section>;
	let products;
	try {
		products = await listProducts({ includeSeller: true });
	} catch {
		products = await getProducts();
	}
	products = products.map((product) => ({ ...product, price: Number(product.price), seller: product.seller || null })).sort((a, b) => (a.seller?.name ? 0 : 1) - (b.seller?.name ? 0 : 1) || (a.seller?.name || "").localeCompare(b.seller?.name || "") || a.name.localeCompare(b.name));
	return <section className="admin-page section-pad"><p className="eyebrow">Studio / Products</p><h1>Product<br /><em>catalogue.</em></h1><div className="admin-nav"><Link href="/admin">Overview</Link><Link href="/admin/products">Products</Link><Link href="/admin/sellers">Sellers</Link></div><div className="admin-table"><div className="table-head"><span>Product</span><span>Seller</span><span>Price</span><span>Category</span><span>Action</span></div>{products.map((product) => <div key={product.id}><span>{product.name}</span><span>{product.seller?.name || "Unassigned"}<small>{product.seller?.phone || product.seller?.email || "Admin catalogue"}</small></span><span>{formatINR(product.price)}</span><span>{product.category}</span><DeleteProductButton productId={product.id} /></div>)}</div></section>;
}
