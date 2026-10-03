"use client";

import Link from "next/link";
import SellerManagement from "./SellerManagement";

export default function AdminSellersPage() {
  return <section className="admin-page section-pad"><p className="eyebrow">Studio / Sellers</p><h1>Manage seller<br /><em>profiles.</em></h1><div className="admin-nav"><Link href="/admin">Overview</Link><Link href="/admin/products">Products</Link><Link href="/admin/sellers">Sellers</Link></div><p className="login-note">Sellers register themselves with their name and phone number. They receive a one-time verification code by SMS.</p><SellerManagement /></section>;
}
