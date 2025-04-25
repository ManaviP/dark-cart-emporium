// src/hooks/useCart.ts
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/auth-context";

export interface CartItem {
  id: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  product_id: string;
}

export const useCart = () => {
  const { user } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);

  // ✅ Fetch cart from Supabase
  const fetchCart = useCallback(async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from("cart_items")
      .select("id, quantity, products ( id, name, image, price )")
      .eq("user_id", user.id);

    if (error) {
      console.error("Error fetching cart:", error.message);
    } else {
      const formatted = data.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        product_id: item.products.id,
        name: item.products.name,
        image: item.products.image,
        price: item.products.price,
      }));
      setCart(formatted);
    }
  }, [user]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // ✅ Update quantity in DB
  const updateQuantity = async (id: string, newQuantity: number) => {
    const item = cart.find((c) => c.id === id);
    if (!item) return;

    if (newQuantity < 1) {
      await removeFromCart(id);
      return;
    }

    const { error } = await supabase
      .from("cart_items")
      .update({ quantity: newQuantity })
      .eq("id", id);

    if (error) {
      console.error("Error updating quantity:", error.message);
    } else {
      fetchCart();
    }
  };

  // ✅ Remove item
  const removeFromCart = async (id: string) => {
    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error removing item:", error.message);
    } else {
      fetchCart();
    }
  };

  return {
    cart,
    updateQuantity,
    removeFromCart,
  };
};
