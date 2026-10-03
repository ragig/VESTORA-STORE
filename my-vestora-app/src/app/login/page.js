"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const roles = [{ id: "CUSTOMER", label: "Customer", description: "Shop the Vestora collection" }, { id: "SELLER", label: "Seller", description: "Manage your products and prices" }, { id: "ADMIN", label: "Admin", description: "Oversee the entire studio" }];

export default function LoginPage() {
  const router = useRouter(); const [role, setRole] = useState("CUSTOMER"); const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  async function handleSubmit(event) { event.preventDefault(); setError(""); setLoading(true); const result = await signIn("credentials", { email, password: role === "ADMIN" ? password : undefined, requestedRole: role, redirect: false }); if (result?.error) { setError("Please check your email and try again."); setLoading(false); return; } const session = await (await fetch("/api/auth/session")).json(); router.refresh(); router.push(session?.user?.role === "ADMIN" ? "/admin" : session?.user?.role === "SELLER" ? "/seller" : "/products"); }
  return <main className="login-page"><div className="login-art"><div className="login-art-inner"><span>VESTORA</span><p>Objects with presence.</p></div></div><div className="login-panel"><Link className="login-back" href="/">← Back home</Link><div className="login-heading"><p className="eyebrow">Welcome back</p><h1>Sign in to<br /><em>your space.</em></h1></div><div className="role-tabs" aria-label="Choose account type">{roles.map((item) => <button className={role === item.id ? "active" : ""} key={item.id} onClick={() => { setRole(item.id); setError(""); }} type="button"><strong>{item.label}</strong><span>{item.description}</span></button>)}</div><form className="login-form" onSubmit={handleSubmit}><label>Email address<input autoComplete="email" onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required type="email" value={email} /></label>{role === "ADMIN" && <label>Password<input autoComplete="current-password" onChange={(event) => setPassword(event.target.value)} required type="password" value={password} /></label>}{error && <p className="login-error">{error}</p>}<button className="button button-dark full-width" disabled={loading} type="submit">{loading ? "Signing in…" : `Continue as ${roles.find((item) => item.id === role).label}`}<span>↗</span></button></form>{role === "SELLER" && <p className="login-note">Seller login uses your registered email. New seller? <Link href="/seller/register">Register here</Link></p>}</div></main>;
}
