import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { createUser, findUserByEmail } from "../../../../lib/db";
import { verifyPassword } from "../../../../lib/password";

export const authOptions = { providers: [Credentials({ name: "Credentials", credentials: { email: {}, password: {}, requestedRole: {} }, async authorize(credentials) {
	if (!credentials?.requestedRole) return null;
	let email = credentials.email?.toLowerCase().trim();
	let user = null;
	if (!email || !/^\S+@\S+\.\S+$/.test(email)) return null;
	user = await findUserByEmail(email);
	if (credentials.requestedRole === "CUSTOMER" && !user) user = await createUser({ email, name: email.split("@")[0], role: "CUSTOMER" });
	if (!user || user.role !== credentials.requestedRole) return null;
	if (user.role !== "CUSTOMER" && user.role !== "SELLER" && (!credentials.password || !user.password || !verifyPassword(credentials.password, user.password))) return null;
	return { id: String(user.id), name: user.name, email: user.email, role: user.role, eid: user.eid };
} })], session: { strategy: "jwt" }, callbacks: {
	async jwt({ token, user }) { if (user) { token.sub = user.id; token.role = user.role; token.eid = user.eid; } return token; },
	async session({ session, token }) { if (session.user) { session.user.id = token.sub; session.user.role = token.role; session.user.eid = token.eid; } return session; },
}, secret: process.env.NEXTAUTH_SECRET };

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
