import { supabase, getCurrentUserId } from "@/lib/supabase";

export interface CartItem {
  id: number;
  productId: number;
  quantity: number;
  product: {
    id: number;
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
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    // Get user's cart
    const { data: cart, error: cartError } = await supabase
      .from('carts')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (cartError) {
      // If cart doesn't exist, create one
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
        
        return []; // New cart is empty
      } else {
        throw cartError;
      }
    }

    // Get cart items with product details
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

    if (itemsError) throw itemsError;

    // Transform data to match CartItem interface
    return cartItems.map(item => ({
      id: item.id,
      productId: item.product_id,
      quantity: item.quantity,
      product: {
        id: item.products.id,
        name: item.products.name,
        price: item.products.price,
        image: item.products.image,
        category: item.products.category,
        inStock: item.products.in_stock,
        sellerId: item.products.seller_id,
      },
    }));
  } catch (error) {
    console.error('Error fetching cart:', error);
    return [];
  }
};

// Add item to cart
export const addToCart = async (productId: number, quantity: number): Promise<CartItem | null> => {
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
        id: updatedItem.id,
        productId: updatedItem.product_id,
        quantity: updatedItem.quantity,
        product: {
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
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
        id: newItem.id,
        productId: newItem.product_id,
        quantity: newItem.quantity,
        product: {
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
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
export const updateCartItem = async (itemId: number, quantity: number): Promise<CartItem | null> => {
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
      .eq('cart_id', cart.id) // Ensure item belongs to user's cart
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

    return {
      id: updatedItem.id,
      productId: updatedItem.product_id,
      quantity: updatedItem.quantity,
      product: {
        id: updatedItem.products.id,
        name: updatedItem.products.name,
        price: updatedItem.products.price,
        image: updatedItem.products.image,
        category: updatedItem.products.category,
        inStock: updatedItem.products.in_stock,
        sellerId: updatedItem.products.seller_id,
      },
    };
  } catch (error) {
    console.error('Error updating cart item:', error);
    throw error;
  }
};

// Remove item from cart
export const removeFromCart = async (itemId: number): Promise<boolean> => {
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
      .eq('id', itemId)
      .eq('cart_id', cart.id); // Ensure item belongs to user's cart

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
