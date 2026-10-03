"use client";

import { useEffect, useState } from "react";

export default function SellerNotices() {
  const [notices, setNotices] = useState([]);
  useEffect(() => { fetch("/api/seller/notices", { cache: "no-store" }).then((response) => response.ok ? response.json() : []).then(setNotices); }, []);
  if (!notices.length) return null;
  async function markRead(id) { await fetch("/api/seller/notices", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }); setNotices((items) => items.map((item) => item.id === id ? { ...item, readAt: new Date().toISOString() } : item)); }
  return <section className="seller-notices"><div className="section-heading"><div><p className="eyebrow">From Vestora admin</p><h2>Notices</h2></div><span>{notices.filter((notice) => !notice.readAt).length} unread</span></div>{notices.map((notice) => <article className={`notice-card${notice.readAt ? " read" : ""}`} key={notice.id}><div><strong>{notice.readAt ? "Read notice" : "New notice"}</strong><small>{new Date(notice.createdAt).toLocaleDateString("en-IN")}</small></div><p>{notice.message}</p>{!notice.readAt && <button className="text-button" onClick={() => markRead(notice.id)} type="button">Mark as read</button>}</article>)}</section>;
}
