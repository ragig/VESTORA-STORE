"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SellerRegisterPage() {
  const router = useRouter(); const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  async function register(event) { event.preventDefault(); setError(""); setLoading(true); const response = await fetch("/api/auth/seller/request-otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email }) }); const data = await response.json(); if (!response.ok) { setError(data.error || "Unable to register seller."); setLoading(false); return; } router.push(`/login?registered=${encodeURIComponent(data.seller.email)}`); }
  return <main className="login-page"><div className="login-art"><div className="login-art-inner"><span>VESTORA</span><p>Objects with presence.</p></div></div><div className="login-panel"><Link className="login-back" href="/login">← Back to login</Link><div className="login-heading"><p className="eyebrow">Join the studio</p><h1>Become a<br /><em>seller.</em></h1></div><form className="login-form" onSubmit={register}><label>Your name<input autoComplete="name" onChange={(event) => setName(event.target.value)} required value={name} /></label><label>Email address<input autoComplete="email" onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required type="email" value={email} /></label>{error && <p className="login-error">{error}</p>}<button className="button button-dark full-width" disabled={loading} type="submit">{loading ? "Registering…" : "Register seller"}<span>↗</span></button></form><p className="login-note">After registration, log in with your email. No verification code or password is required.</p></div></main>;
}
