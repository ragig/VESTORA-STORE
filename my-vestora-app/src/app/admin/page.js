import Link from "next/link";
import { getProducts } from "../../lib/products";
import { getSession } from "../../lib/auth";
import { listAdminSellers } from "../../lib/db";
import LogoutButton from "../../components/LogoutButton";
import SellerDirectory from "./SellerDirectory";

export default async function AdminPage() {
	const session = await getSession();
	if (session?.user?.role !== "ADMIN") return <section className="admin-page section-pad"><h1>Admin access required.</h1><Link href="/login">Sign in</Link></section>;

	const [products, sellers] = await Promise.all([
		getProducts(),
		listAdminSellers(),
	]);

	return <section className="admin-page section-pad">
		<p className="eyebrow">Vestora studio</p>
		<h1>Admin<br /><em>dashboard.</em></h1>
		<div className="admin-nav"><Link href="/admin">Overview</Link><Link href="/admin/products">Products</Link><Link href="/admin/sellers">Sellers</Link><LogoutButton /></div>
		<div className="admin-table"><div className="table-head"><span>Overview</span><span>Value</span><span>Status</span><span>Updated</span></div><div><span>Total products</span><span>{products.length}</span><span>Active</span><span>Today</span></div><div><span>Featured collection</span><span>{products.filter((p) => p.featured).length}</span><span>Published</span><span>Today</span></div><div><span>Registered sellers</span><span>{sellers.length}</span><span>Active</span><span>Today</span></div></div>
		<SellerDirectory sellers={sellers.map((seller) => ({ ...seller, createdAt: seller.createdAt.toLocaleDateString("en-IN"), products: seller.products.map((product) => ({ ...product, price: Number(product.price) })), notices: seller.notices.map((notice) => ({ ...notice, createdAt: notice.createdAt.toLocaleDateString("en-IN") })) }))} />
	</section>;
}
