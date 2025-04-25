import { supabase, getCurrentUserId } from "@/lib/supabase";

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  in_stock: boolean;
  seller_id: string;
}

interface CartItemResponse {
  id: string;
  product_id: string;
  quantity: number;
  products: Product;
}

interface CartItemWithProducts {
  id: string;
  product_id: string;
  quantity: number;
  products: Product[];
}

export interface CartItem {
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

// Get user's cart
export const getCart = async (): Promise<CartItem[]> => {
  try {
    console.log("Getting cart items...");
    const userId = await getCurrentUserId();
    if (!userId) {
      console.error('User not authenticated');
      throw new Error('User not authenticated');
    }

    console.log("Getting cart for user:", userId);

    // Get user's cart
    const { data: cart, error: cartError } = await supabase
      .from('carts')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (cartError) {
      console.log("Cart error:", cartError);
      // If cart doesn't exist, create one
      if (cartError.code === 'PGRST116') {
        console.log("Cart not found, creating new cart");
        const { data: newCart, error: createError } = await supabase
          .from('carts')
          .insert([
            {
              user_id: userId,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ])
          .select()
          .single();

        if (createError) {
          console.error("Error creating cart:", createError);
          throw createError;
        }

        console.log("New cart created:", newCart);
        return []; // New cart is empty
      } else {
        console.error("Unexpected cart error:", cartError);
        throw cartError;
      }
    }

    console.log("Found existing cart:", cart);

    // Get cart items with product details
    console.log("Getting cart items for cart:", cart.id);
    const { data: cartItems, error: itemsError } = await supabase
      .from('cart_items')
      .select(`
        id,
        product_id,
        quantity,
        products (
          id,
          name,
          price,
          image,
          category,
          in_stock,
          seller_id
        )
      `)
      .eq('cart_id', cart.id);

    if (itemsError) {
      console.error("Error fetching cart items:", itemsError);
      throw itemsError;
    }

    // Check if we have any items
    if (!cartItems || cartItems.length === 0) {
      console.log("Cart is empty");
      return [];
    }

    console.log("Found cart items:", cartItems.length);

    // Transform data to match CartItem interface
    const transformedItems = cartItems.map(item => {
      console.log("Processing cart item:", item);

      // Handle case where products might be an array or a single object
      const product = Array.isArray(item.products) ? item.products[0] : item.products;

      if (!product) {
        console.error('Product not found for cart item:', item);
        return null;
      }

      return {
        id: item.id.toString(),
        productId: item.product_id.toString(),
        quantity: item.quantity,
        product: {
          id: product.id.toString(),
          name: product.name,
          price: product.price,
          image: product.image || 'https://placehold.co/300x300/1a1f2c/ffffff?text=Product',
          category: product.category,
          inStock: product.in_stock,
          sellerId: product.seller_id,
        },
      };
    }).filter(Boolean) as CartItem[];

    console.log("Transformed cart items:", transformedItems);
    return transformedItems;
  } catch (error) {
    console.error('Error fetching cart:', error);
    return [];
  }
};

// Add item to cart
export const addToCart = async (productId: string, quantity: number): Promise<CartItem | null> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    // Get user's cart
    let { data: cart, error: cartError } = await supabase
      .from('carts')
      .select('id')
      .eq('user_id', userId)
      .single();

    // If cart doesn't exist, create one
    if (cartError) {
      if (cartError.code === 'PGRST116') {
        const { data: newCart, error: createError } = await supabase
          .from('carts')
          .insert([
            {
              user_id: userId,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ])
          .select()
          .single();

        if (createError) throw createError;
        cart = newCart;
      } else {
        throw cartError;
      }
    }

    // Check if product exists
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, name, price, image, category, in_stock, seller_id')
      .eq('id', productId)
      .single();

    if (productError) throw productError;
    if (!product.in_stock) throw new Error('Product is out of stock');

    // Check if item already exists in cart
    const { data: existingItem, error: existingError } = await supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('cart_id', cart.id)
      .eq('product_id', productId)
      .single();

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + quantity;
      const { data: updatedItem, error: updateError } = await supabase
        .from('cart_items')
        .update({
          quantity: newQuantity,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingItem.id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Update cart timestamp
      await supabase
        .from('carts')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', cart.id);

      return {
        id: updatedItem.id.toString(),
        productId: updatedItem.product_id.toString(),
        quantity: updatedItem.quantity,
        product: {
          id: product.id.toString(),
          name: product.name,
          price: product.price,
          image: product.image || 'https://placehold.co/300x300/1a1f2c/ffffff?text=Product',
          category: product.category,
          inStock: product.in_stock,
          sellerId: product.seller_id,
        },
      };
    } else {
      // Add new item
      const { data: newItem, error: insertError } = await supabase
        .from('cart_items')
        .insert([
          {
            cart_id: cart.id,
            product_id: productId,
            quantity: quantity,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (insertError) throw insertError;

      // Update cart timestamp
      await supabase
        .from('carts')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', cart.id);

      return {
        id: newItem.id.toString(),
        productId: newItem.product_id.toString(),
        quantity: newItem.quantity,
        product: {
          id: product.id.toString(),
          name: product.name,
          price: product.price,
          image: product.image || 'https://placehold.co/300x300/1a1f2c/ffffff?text=Product',
          category: product.category,
          inStock: product.in_stock,
          sellerId: product.seller_id,
        },
      };
    }
  } catch (error) {
    console.error('Error adding to cart:', error);
    throw error;
  }
};

// Update cart item quantity
export const updateCartItem = async (itemId: string, quantity: number): Promise<CartItem | null> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    // Get user's cart
    const { data: cart, error: cartError } = await supabase
      .from('carts')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (cartError) throw cartError;

    // Update item quantity
    const { data: updatedItem, error: updateError } = await supabase
      .from('cart_items')
      .update({
        quantity: quantity,
        updated_at: new Date().toISOString(),
      })
      .eq('id', itemId)
      .select(`
        id,
        product_id,
        quantity,
        products (
          id,
          name,
          price,
          image,
          category,
          in_stock,
          seller_id
        )
      `)
      .single();

    if (updateError) throw updateError;

    // Update cart timestamp
    await supabase
      .from('carts')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', cart.id);

    // Handle case where products might be an array or a single object
    const product = Array.isArray(updatedItem.products)
      ? updatedItem.products[0]
      : updatedItem.products;

    if (!product) {
      console.error('Product not found for updated cart item:', updatedItem);
      throw new Error('Product not found for cart item');
    }

    return {
      id: updatedItem.id.toString(),
      productId: updatedItem.product_id.toString(),
      quantity: updatedItem.quantity,
      product: {
        id: product.id.toString(),
        name: product.name,
        price: product.price,
        image: product.image || 'https://placehold.co/300x300/1a1f2c/ffffff?text=Product',
        category: product.category,
        inStock: product.in_stock,
        sellerId: product.seller_id,
      },
    };
  } catch (error) {
    console.error('Error updating cart item:', error);
    throw error;
  }
};

// Remove item from cart
export const removeFromCart = async (itemId: string): Promise<boolean> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    // Get user's cart
    const { data: cart, error: cartError } = await supabase
      .from('carts')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (cartError) throw cartError;

    // Delete item
    const { error: deleteError } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', itemId);

    if (deleteError) throw deleteError;

    // Update cart timestamp
    await supabase
      .from('carts')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', cart.id);

    return true;
  } catch (error) {
    console.error('Error removing from cart:', error);
    throw error;
  }
};

// Clear cart
export const clearCart = async (): Promise<boolean> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    // Get user's cart
    const { data: cart, error: cartError } = await supabase
      .from('carts')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (cartError) throw cartError;

    // Delete all items
    const { error: deleteError } = await supabase
      .from('cart_items')
      .delete()
      .eq('cart_id', cart.id);

    if (deleteError) throw deleteError;

    // Update cart timestamp
    await supabase
      .from('carts')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', cart.id);

    return true;
  } catch (error) {
    console.error('Error clearing cart:', error);
    throw error;
  }
};
