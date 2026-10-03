"use client";

import { useState } from "react";

export default function CustomerDashboard({ customer }) {
  const [profile, setProfile] = useState(customer);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  async function saveProfile(event) {
    event.preventDefault(); setSaving(true); setMessage("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/customer/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(form)) });
    const data = await response.json();
    if (response.ok) { setProfile(data); setMessage("Details saved."); } else setMessage(data.error || "Unable to save details.");
    setSaving(false);
  }
  return <div className="customer-panels address-panel"><section className="customer-panel"><p className="eyebrow">Your address</p><h2>{profile.name || "Your profile"}</h2><form className="checkout-form" onSubmit={saveProfile}><label>Name<input name="name" defaultValue={profile.name || ""} required /></label><label>Email address<input value={profile.email} readOnly /></label><label>Address<textarea name="address" defaultValue={profile.address || ""} placeholder="Street and building" /></label><div className="form-row"><label>City<input name="city" defaultValue={profile.city || ""} /></label><label>State<input name="state" defaultValue={profile.state || ""} /></label></div><div className="form-row"><label>Postal code<input name="postalCode" defaultValue={profile.postalCode || ""} /></label><label>Country<input name="country" defaultValue={profile.country || "India"} /></label></div>{message && <p className="login-note">{message}</p>}<button className="button button-dark" disabled={saving} type="submit">{saving ? "Saving…" : "Save details"} <span>↗</span></button></form></section></div>;
}
