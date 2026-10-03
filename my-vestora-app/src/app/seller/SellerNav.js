"use client";

import Link from "next/link";
import { useState } from "react";
import LogoutButton from "../../components/LogoutButton";

export default function SellerNav() {
  const [open, setOpen] = useState(false);

  function openProductForm() {
    setOpen(false);
    window.dispatchEvent(new CustomEvent("seller:add-product"));
  }

  return <div className="admin-nav seller-nav"><Link href="/seller">Overview</Link><div className="seller-nav-menu"><button onClick={() => setOpen((current) => !current)} type="button">Products</button>{open && <div className="seller-nav-dropdown"><Link href="/products">Storefront</Link><button onClick={openProductForm} type="button">Add product</button></div>}</div><Link href="/orders">Orders</Link><LogoutButton /></div>;
}
