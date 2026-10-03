import Link from "next/link";
import { getSession } from "../../lib/auth";
import OrderList from "../../components/OrderList";

export default async function OrdersPage() { const session = await getSession(); if (!session?.user) return <section className="section-pad"><h1>Login to view orders.</h1><Link href="/login">Sign in</Link></section>; if (session.user.role === "ADMIN") return <section className="section-pad"><h1>Order status is not available for admins.</h1><Link href="/admin">Back to admin</Link></section>; return <section className="section-pad orders-page"><div className="orders-hero"><div><p className="eyebrow">Your orders</p><h1>My order<br /><em>history.</em></h1><p>Track delivery progress, payments, products, and review links from one place.</p></div><Link href="/products">Continue shopping</Link></div><OrderList role={session.user.role} /></section>; }
