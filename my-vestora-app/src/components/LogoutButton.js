'use client';

import { signOut } from "next-auth/react";

export default function LogoutButton() {
  return (
    <button
      type="button"
      className="logout-button"
      onClick={() => signOut({ callbackUrl: "/login" })}
    >
      Log out
    </button>
  );
}
