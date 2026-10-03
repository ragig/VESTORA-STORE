import Link from "next/link";
import { getSession } from "../../lib/auth";
import { listProducts } from "../../lib/db";
import SellerProducts from "./SellerProducts";
import OrderList from "../../components/OrderList";
import SellerNotices from "./SellerNotices";
import SellerNav from "./SellerNav";

export default async function SellerPage() { const session = await getSession(); if (session?.user?.role !== "SELLER") return <section className="admin-page section-pad"><h1>Seller access required.</h1><Link href="/login">Sign in</Link></section>; const products = await listProducts({ sellerId: Number(session.user.id) }); return <section className="admin-page section-pad"><p className="eyebrow">Seller studio</p><h1>Your product<br /><em>space.</em></h1><SellerNav /><SellerNotices /><div className="admin-table"><div className="table-head"><span>Store overview</span><span>Value</span><span>Status</span><span>Updated</span></div><div><span>Your products</span><span>{products.length}</span><span>Live</span><span>Today</span></div><div><span>Available stock</span><span>{products.reduce((sum, product) => sum + product.stock, 0)}</span><span>Healthy</span><span>Today</span></div></div><SellerProducts initialProducts={products} /><h2>Orders for your products</h2><OrderList role="SELLER" /></section>; }
