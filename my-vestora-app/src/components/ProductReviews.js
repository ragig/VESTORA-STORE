"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

function formatDate(date) {
  return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function RatingDots({ rating }) {
  return <span className="review-rating" aria-label={`${rating} out of 5`}>{Array.from({ length: 5 }, (_, index) => <span className={index < rating ? "active" : ""} key={index} />)}</span>;
}

export default function ProductReviews({ productId, initialReviews = [], canReview = false, ownReview = null, isCustomer = false }) {
  const router = useRouter();
  const [reviews, setReviews] = useState(initialReviews);
  const [rating, setRating] = useState(ownReview?.rating || 5);
  const [comment, setComment] = useState(ownReview?.comment || "");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function submitReview(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const response = await fetch(`/api/products/${productId}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, comment }),
    });
    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error || "Unable to save review.");
      setSaving(false);
      return;
    }

    setReviews((currentReviews) => {
      const withoutOwnReview = currentReviews.filter((review) => review.id !== data.id && review.userId !== data.userId);
      return [data, ...withoutOwnReview];
    });
    setMessage(ownReview ? "Review updated." : "Review added.");
    setSaving(false);
    router.refresh();
  }

  return (
    <section className="product-reviews" id="reviews">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Customer notes</p>
          <h2>Reviews</h2>
        </div>
        <span>{reviews.length} review{reviews.length === 1 ? "" : "s"}</span>
      </div>

      {canReview && (
        <form className="checkout-form review-form" onSubmit={submitReview}>
          <label>Rating
            <select value={rating} onChange={(event) => setRating(Number(event.target.value))}>
              {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} star{value === 1 ? "" : "s"}</option>)}
            </select>
          </label>
          <label>Your review
            <textarea maxLength={800} minLength={3} onChange={(event) => setComment(event.target.value)} required value={comment} />
          </label>
          {message && <p className={message.startsWith("Unable") || message.startsWith("Choose") || message.startsWith("You can") ? "login-error" : "login-note"}>{message}</p>}
          <button className="button button-dark" disabled={saving} type="submit">{saving ? "Saving..." : ownReview ? "Update review" : "Add review"} <span>-&gt;</span></button>
        </form>
      )}

      {!canReview && isCustomer && <p className="login-note">You can review this product after placing an order for it.</p>}

      <div className="review-list">
        {reviews.length ? reviews.map((review) => (
          <article className="review-card" key={review.id}>
            <div>
              <strong>{review.customerName || "Customer"}</strong>
              <small>{formatDate(review.updatedAt || review.createdAt)}</small>
            </div>
            <RatingDots rating={review.rating} />
            <p>{review.comment}</p>
          </article>
        )) : <p className="empty-state">No reviews yet.</p>}
      </div>
    </section>
  );
}
