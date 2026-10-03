import { NextResponse } from "next/server";
import { getSession } from "../../../../lib/auth";
import { listSellerNotices, markSellerNoticeRead } from "../../../../lib/db";

export async function GET() {
  const session = await getSession();
  if (session?.user?.role !== "SELLER") return NextResponse.json({ error: "Seller access required" }, { status: 403 });
  const notices = await listSellerNotices(Number(session.user.id));
  return NextResponse.json(notices);
}

export async function PATCH(request) {
  const session = await getSession();
  if (session?.user?.role !== "SELLER") return NextResponse.json({ error: "Seller access required" }, { status: 403 });
  const { id } = await request.json();
  await markSellerNoticeRead(Number(id), Number(session.user.id));
  return NextResponse.json({ read: true });
}
