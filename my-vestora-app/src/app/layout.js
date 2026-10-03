import "./globals.css";
import Navbar from "../components/Navbar";
import CartDrawer from "../components/CartDrawer";

export const metadata = { title: "Vestora — Objects with presence", description: "A considered collection for modern living." };

export default function RootLayout({ children }) {
  return <html lang="en"><body><Navbar /><main>{children}</main><CartDrawer /><footer><span>VESTORA</span><span>Objects with presence.</span><span>© 2026 Vestora</span></footer></body></html>;
}
