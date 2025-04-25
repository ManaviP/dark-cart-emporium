import { supabase, getCurrentUserId } from "@/lib/supabase";
import { Product } from "@/types/product";

interface SavedProductResponse {
  id: string;
  product_id: string;
  created_at: string;
  products: {
    id: string;
    name: string;
    description: string;
    price: number;
    image: string;
    category: string;
    in_stock: boolean;
    seller_id: string;
    perishable: boolean;
    priority: string;
    company: string;
    quantity: number;
  };
}

export interface SavedProduct {
  id: string;
  productId: string;
  product: Product;
  createdAt: string;
}

// Get user's saved products
export const getSavedProducts = async (): Promise<SavedProduct[]> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    const { data: savedProducts, error } = await supabase
      .from('saved_products')
      .select(`
        id,
        product_id,
        created_at,
        products (
          id,
          name,
          description,
          price,
          image,
          category,
          in_stock,
          seller_id,
          perishable,
          priority,
          company,
          quantity
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (savedProducts as unknown as SavedProductResponse[]).map(item => ({
      id: item.id,
      productId: item.product_id,
      createdAt: item.created_at,
      product: {
        id: item.products.id,
        name: item.products.name,
        description: item.products.description,
        price: item.products.price,
        image: item.products.image,
        category: item.products.category,
        inStock: item.products.in_stock,
        sellerId: item.products.seller_id,
        perishable: item.products.perishable,
        priority: item.products.priority,
        company: item.products.company,
        quantity: item.products.quantity,
      },
    }));
  } catch (error) {
    console.error('Error fetching saved products:', error);
    return [];
  }
};

// Save a product
export const saveProduct = async (productId: string): Promise<boolean> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('saved_products')
      .insert([
        {
          user_id: userId,
          product_id: productId,
        },
      ]);

    if (error) {
      if (error.code === '23505') { // Unique violation
        // Product is already saved
        return true;
      }
      throw error;
    }
    return true;
  } catch (error) {
    console.error('Error saving product:', error);
    return false;
  }
};

// Remove a saved product
export const removeSavedProduct = async (savedProductId: string): Promise<boolean> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('saved_products')
      .delete()
      .eq('id', savedProductId)
      .eq('user_id', userId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error removing saved product:', error);
    return false;
  }
};

// Check if a product is saved
export const isProductSaved = async (productId: string): Promise<boolean> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('saved_products')
      .select('id')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return !!data;
  } catch (error) {
    console.error('Error checking if product is saved:', error);
    return false;
  }
}; 