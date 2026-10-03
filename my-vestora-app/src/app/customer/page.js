import Link from "next/link";
import { getSession } from "../../lib/auth";
import { findUserById } from "../../lib/db";
import CustomerDashboard from "./CustomerDashboard";

export default async function CustomerPage() {
  const session = await getSession();
  if (session?.user?.role !== "CUSTOMER") return <section className="section-pad"><h1>Customer access required.</h1><Link href="/login">Sign in</Link></section>;
  const customer = await findUserById(Number(session.user.id));
  if (!customer) return <section className="section-pad"><h1>Customer account not found.</h1><Link href="/login">Sign in</Link></section>;
  const profile = { name: customer.name, email: customer.email, address: customer.address, city: customer.city, state: customer.state, postalCode: customer.postalCode, country: customer.country };
  return <section className="admin-page section-pad customer-page"><p className="eyebrow">Your Vestora space</p><h1>Your<br /><em>address.</em></h1><CustomerDashboard customer={profile} /></section>;
}
