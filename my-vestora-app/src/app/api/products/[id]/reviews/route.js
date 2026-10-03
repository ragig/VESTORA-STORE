import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { customerCanReviewProduct, findProductById, listProductReviews, upsertProductReview } from "../../../../../lib/db";
import { getSession } from "../../../../../lib/auth";

export async function GET(request, { params }) {
  const { id } = await params;
  const productId = Number(id);
  if (!Number.isInteger(productId)) return NextResponse.json({ error: "Invalid product" }, { status: 400 });
  return NextResponse.json(await listProductReviews(productId));
}

export async function POST(request, { params }) {
  const session = await getSession();
  if (session?.user?.role !== "CUSTOMER") return NextResponse.json({ error: "Customer login required" }, { status: 401 });

  const { id } = await params;
  const productId = Number(id);
  const userId = Number(session.user.id);
  if (!Number.isInteger(productId)) return NextResponse.json({ error: "Invalid product" }, { status: 400 });

  const product = await findProductById(productId, true);
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const canReview = await customerCanReviewProduct(productId, userId);
  if (!canReview) return NextResponse.json({ error: "You can review this product after placing an order for it." }, { status: 403 });

  const body = await request.json();
  const rating = Number(body.rating);
  const comment = String(body.comment || "").trim();
  if (!Number.isInteger(rating) || rating < 1 || rating > 5 || comment.length < 3 || comment.length > 800) {
    return NextResponse.json({ error: "Choose a rating and write a review between 3 and 800 characters." }, { status: 400 });
  }

  const review = await upsertProductReview(productId, userId, { rating, comment });
  revalidatePath(`/products/${productId}`);
  return NextResponse.json(review, { status: 201 });
}
