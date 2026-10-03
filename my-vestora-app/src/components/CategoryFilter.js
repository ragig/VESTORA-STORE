"use client";

import { useRouter } from "next/navigation";

export default function CategoryFilter({ categories, selectedCategory }) {
  const router = useRouter();

  function handleChange(event) {
    const category = event.target.value;
    router.push(category ? `/products?category=${encodeURIComponent(category)}` : "/products");
  }

  return (
    <label className="category-select-label">
      <span>Sort by category</span>
      <select aria-label="Sort by category" onChange={handleChange} value={selectedCategory}>
        <option value="">All categories</option>
        {categories.map((category) => <option key={category} value={category}>{category}</option>)}
      </select>
    </label>
  );
}
