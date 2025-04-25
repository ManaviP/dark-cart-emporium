import { useState, useEffect } from "react";
import { Product } from "@/types/product";
import { getCart, addToCart as addToCartService, updateCartItem, removeFromCart as removeFromCartService, clearCart as clearCartService, CartItem as ServiceCartItem } from "@/services/cartService";

interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
    image: string;
    category: string;
    inStock: boolean;
    sellerId: string;
  };
}

export const useCart = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const cartItems = await getCart();
      setCart(cartItems);
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (product: Product) => {
    try {
      await addToCartService(String(product.id), 1);
      await fetchCart();
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  const removeFromCart = async (itemId: string) => {
    try {
      await removeFromCartService(itemId);
      await fetchCart();
    } catch (error) {
      console.error('Error removing from cart:', error);
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity < 1) return;
    try {
      await updateCartItem(itemId, quantity);
      await fetchCart();
    } catch (error) {
      console.error('Error updating cart item:', error);
    }
  };

  const clearCart = async () => {
    try {
      await clearCartService();
      await fetchCart();
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  return {
    cart,
    loading,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
  };
}; 