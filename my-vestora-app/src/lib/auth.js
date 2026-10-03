import { getServerSession } from "next-auth";
import { authOptions } from "../app/api/auth/[...nextauth]/route";

export function getSession() {
  return getServerSession(authOptions);
}

export async function hasRole(role) {
  const session = await getSession();
  return session?.user?.role === role;
}