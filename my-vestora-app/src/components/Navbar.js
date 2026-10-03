"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import CartButton from "./CartButton";
import LogoutButton from "./LogoutButton";

export default function Navbar() {
  const pathname = usePathname();
  const [session, setSession] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const role = session?.user?.role;

  useEffect(() => {
    let active = true;

    async function loadSession() {
      try {
        const response = await fetch("/api/auth/session", { cache: "no-store" });
        const data = await response.json();
        if (active) setSession(data?.user ? data : null);
      } catch {
        if (active) setSession(null);
      } finally {
        if (active) setLoaded(true);
      }
    }

    loadSession();
    window.addEventListener("focus", loadSession);
    return () => {
      active = false;
      window.removeEventListener("focus", loadSession);
    };
  }, [pathname]);

  if (role === "ADMIN") {
    return <header className="site-header"><Link className="wordmark" href="/">VESTORA</Link><nav><Link href="/admin">Admin</Link><Link href="/admin/products">Products</Link><Link href="/admin/sellers">Sellers</Link><LogoutButton /></nav></header>;
  }

  if (role === "CUSTOMER") {
    return <header className="site-header customer-header"><Link className="wordmark" href="/products">VESTORA</Link><nav><Link href="/products">Shop</Link><Link href="/orders">My orders</Link><Link href="/wishlist">Wishlist</Link><Link href="/customer">Address</Link><LogoutButton /></nav><CartButton /></header>;
  }

  return <header className="site-header"><Link className="wordmark" href="/">VESTORA</Link><nav><Link href="/products">Shop</Link>{role === "SELLER" && <Link href="/seller">Seller</Link>}{loaded && !session?.user && <Link href="/login">Login</Link>}{session?.user && <LogoutButton />}</nav>{role !== "SELLER" && <CartButton />}</header>;
}
