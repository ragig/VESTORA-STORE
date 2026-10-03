import Link from "next/link";
export default function Home() {
	return <section className="video-landing"><video autoPlay className="landing-video" loop muted playsInline><source src="/animo-orbit-globe-720p.mp4" type="video/mp4" /></video><div className="landing-video-shade" /><div className="landing-copy"><p className="landing-kicker">A collection for living well</p><h1>VESTORA</h1><p>Objects, textures, and little rituals<br />that make a place feel like yours.</p><Link className="landing-link" href="/products">Enter the collection <span>↗</span></Link></div><div className="landing-footer"><span>Scroll to explore</span><span>© 2026 Vestora</span></div></section>;
}
