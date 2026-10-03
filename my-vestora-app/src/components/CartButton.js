"use client";

import { useSyncExternalStore } from "react";
import { useCartStore } from "../store/cartStore";

export default function CartButton() {
  const openCart = useCartStore((state) => state.openCart);
  const count = useSyncExternalStore(
    useCartStore.subscribe,
    () => useCartStore.getState().items.reduce((total, item) => total + item.quantity, 0),
    () => 0,
  );

  return <button className="cart-button" onClick={openCart}>Bag <span>{count}</span></button>;
}
