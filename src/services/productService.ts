import { Product, DonationDetails } from "@/types/product";
import { supabase, getCurrentUserId } from "@/lib/supabase";

// Fallback mock products for development
const mockProducts: Product[] = [
  {
    id: 101,
    name: "Premium Headphones",
    description: "Noise-cancelling wireless headphones with superior sound quality.",
    price: 159.99,
    category: "electronics",
    image: "https://placehold.co/300x300/1a1f2c/ffffff?text=Headphones",
    perishable: false,
    priority: "medium",
    company: "AudioTech",
    inStock: true,
    quantity: 25,
    rating: 4.8,
    sellerId: "mock-seller-id-1", // Mock seller ID
    specifications: [
      { name: "Brand", value: "AudioTech" },
      { name: "Connectivity", value: "Bluetooth 5.0" },
      { name: "Battery Life", value: "30 hours" }
    ]
  },
  {
    id: 102,
    name: "Organic Apples",
    description: "Fresh and organic apples picked from local farms.",
    price: 5.99,
    category: "food",
    image: "https://placehold.co/300x300/1a1f2c/ffffff?text=Apples",
    perishable: true,
    expiryDate: "2023-12-30",
    priority: "high",
    company: "FreshFarms",
    inStock: true,
    quantity: 100,
    rating: 4.5,
    sellerId: "mock-seller-id-1", // Mock seller ID
    specifications: [
      { name: "Origin", value: "Local Farms" },
      { name: "Type", value: "Honeycrisp" },
      { name: "Certification", value: "Organic" }
    ]
  },
  {
    id: 103,
    name: "Fantasy Novel",
    description: "Bestselling fantasy novel set in a magical world.",
    price: 12.99,
    category: "books",
    image: "https://placehold.co/300x300/1a1f2c/ffffff?text=Book",
    perishable: false,
    priority: "low",
    company: "BookHouse Publishers",
    inStock: true,
    quantity: 50,
    rating: 4.2,
    sellerId: "mock-seller-id-2", // Mock seller ID
    specifications: [
      { name: "Author", value: "J.R. Tolkien" },
      { name: "Pages", value: "423" },
      { name: "Format", value: "Hardcover" }
    ]
  },
  {
    id: 104,
    name: "Denim Jacket",
    description: "Classic denim jacket with modern styling.",
    price: 69.99,
    category: "clothing",
    image: "https://placehold.co/300x300/1a1f2c/ffffff?text=Jacket",
    perishable: false,
    priority: "medium",
    company: "FashionTrends",
    inStock: true,
    quantity: 15,
    rating: 4.1,
    sellerId: "mock-seller-id-2", // Mock seller ID
    specifications: [
      { name: "Material", value: "100% Cotton Denim" },
      { name: "Size", value: "Medium" },
      { name: "Color", value: "Blue" }
    ]
  }
];

// Get all products
export const getProducts = async (category?: string): Promise<Product[]> => {
  try {
    console.log('Fetching products from Supabase...');
    console.log('Category filter:', category);

    // Try to fetch from Supabase first
    try {
      let query = supabase
        .from('products')
        .select('*, product_specifications(*)');

      if (category && category !== 'all') {
        query = query.eq('category', category);
      }

      console.log('Executing Supabase query...');
      const { data, error } = await query;

      if (error) {
        console.error('Supabase query error:', error);
        throw error;
      }

      console.log('Products fetched successfully:', data ? data.length : 0, 'products found');

      if (!data || data.length === 0) {
        console.log('No products found in database, using mock data');

        // Filter mock data if category is provided
        if (category && category !== 'all') {
          return mockProducts.filter(p => p.category.toLowerCase() === category.toLowerCase());
        }
        return mockProducts;
      }

      // Transform data to match Product interface
      return data.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        category: item.category,
        image: item.image,
        perishable: item.perishable,
        expiryDate: item.expiry_date,
        priority: item.priority,
        company: item.company,
        inStock: item.in_stock,
        quantity: item.quantity,
        rating: item.rating,
        specifications: item.product_specifications,
        sellerId: item.seller_id
      }));
    } catch (dbError) {
      console.error('Database error:', dbError);
      console.log('Using mock data due to database error');

      // Filter mock data if category is provided
      if (category && category !== 'all') {
        return mockProducts.filter(p => p.category.toLowerCase() === category.toLowerCase());
      }
      return mockProducts;
    }
  } catch (error) {
    console.error('Error fetching products:', error);
    // Fallback to mock data in development
    console.log('Falling back to mock data');

    // Filter mock data if category is provided
    if (category && category !== 'all') {
      return mockProducts.filter(p => p.category.toLowerCase() === category.toLowerCase());
    }
    return mockProducts;
  }
};

// Get all seller products
export const getSellerProducts = async (): Promise<Product[]> => {
  try {
    console.log('Fetching seller products...');

    const userId = await getCurrentUserId();
    console.log('Current user ID:', userId);

    if (!userId) {
      console.log('User not authenticated, using mock data');
      return mockProducts;
    }

    // Try to fetch from Supabase first
    try {
      console.log('Querying Supabase for seller products...');
      const { data, error } = await supabase
        .from('products')
        .select('*, product_specifications(*)')
        .eq('seller_id', userId);

      if (error) {
        console.error('Supabase query error:', error);
        throw error;
      }

      console.log('Seller products fetched successfully:', data ? data.length : 0, 'products found');

      // If no products found, check if we have any mock products for this seller
      if (!data || data.length === 0) {
        console.log('No seller products found in database, checking mock data');

        // First check if we have any mock products with this seller ID
        const sellerMockProducts = mockProducts.filter(p => p.sellerId === userId);

        if (sellerMockProducts.length > 0) {
          console.log('Found', sellerMockProducts.length, 'mock products for this seller');
          return sellerMockProducts;
        }

        // If no seller-specific mock products, return all mock products in development mode
        console.log('No seller-specific mock products found, using all mock products');
        return mockProducts;
      }

      // Transform data to match Product interface
      return data.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        category: item.category,
        image: item.image,
        perishable: item.perishable,
        expiryDate: item.expiry_date,
        priority: item.priority,
        company: item.company,
        inStock: item.in_stock,
        quantity: item.quantity,
        rating: item.rating,
        specifications: item.product_specifications,
        sellerId: item.seller_id
      }));
    } catch (dbError) {
      console.error('Database error:', dbError);
      console.log('Using mock data due to database error');

      // First check if we have any mock products with this seller ID
      const sellerMockProducts = mockProducts.filter(p => p.sellerId === userId);

      if (sellerMockProducts.length > 0) {
        console.log('Found', sellerMockProducts.length, 'mock products for this seller');
        return sellerMockProducts;
      }

      // If no seller-specific mock products, return all mock products
      return mockProducts;
    }
  } catch (error) {
    console.error('Error fetching seller products:', error);
    // Fallback to mock data in development
    console.log('Falling back to mock data');
    return mockProducts;
  }
};

// Get a single product by ID
export const getProductById = async (id: number): Promise<Product | null> => {
  try {
    console.log('Fetching product by ID:', id);

    // Try to fetch from Supabase first
    try {
      console.log('Querying Supabase for product...');
      const { data, error } = await supabase
        .from('products')
        .select('*, product_specifications(*)')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Supabase query error:', error);
        throw error;
      }

      if (!data) {
        console.log('Product not found in database, checking mock data');
        const mockProduct = mockProducts.find(p => p.id === id);
        if (!mockProduct) {
          console.log('Product not found in mock data either');
          return null;
        }
        console.log('Product found in mock data:', mockProduct.name);
        return mockProduct;
      }

      console.log('Product found in database:', data.name);

      // Transform data to match Product interface
      return {
        id: data.id,
        name: data.name,
        description: data.description,
        price: data.price,
        category: data.category,
        image: data.image,
        perishable: data.perishable,
        expiryDate: data.expiry_date,
        priority: data.priority,
        company: data.company,
        inStock: data.in_stock,
        quantity: data.quantity,
        rating: data.rating,
        specifications: data.product_specifications,
        sellerId: data.seller_id
      };
    } catch (dbError) {
      console.error('Database error:', dbError);
      console.log('Using mock data due to database error');

      // Check mock data
      const mockProduct = mockProducts.find(p => p.id === id);
      if (!mockProduct) {
        console.log('Product not found in mock data');
        return null;
      }
      console.log('Product found in mock data:', mockProduct.name);
      return mockProduct;
    }
  } catch (error) {
    console.error('Error fetching product:', error);
    // Fallback to mock data in development
    console.log('Falling back to mock data');
    return mockProducts.find(p => p.id === id) || null;
  }
};

// Add a new product
export const addProduct = async (product: Omit<Product, 'id'>): Promise<Product> => {
  try {
    console.log('Adding new product:', product);

    // Get current user ID
    const userId = await getCurrentUserId();
    console.log('Current user ID:', userId);

    if (!userId) {
      console.log('User not authenticated, creating mock product');
      // In development mode, create a mock product with a generated ID
      if (process.env.NODE_ENV === 'development') {
        const mockId = Date.now();
        const mockProduct: Product = {
          id: mockId,
          name: product.name,
          description: product.description,
          price: product.price,
          category: product.category,
          image: product.image,
          perishable: product.perishable,
          expiryDate: product.expiryDate,
          priority: product.priority,
          company: product.company,
          inStock: product.inStock,
          quantity: product.quantity,
          rating: 0,
          specifications: product.specifications || [],
          sellerId: 'mock-seller-id'
        };

        // Add to mock products array for immediate use
        mockProducts.push(mockProduct);
        console.log('Created mock product with ID:', mockId);

        return mockProduct;
      }

      throw new Error('User not authenticated');
    }

    // Try to insert product into Supabase
    console.log('Inserting product into Supabase...');
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([
          {
            name: product.name,
            description: product.description,
            price: product.price,
            category: product.category,
            image: product.image,
            perishable: product.perishable,
            expiry_date: product.expiryDate,
            priority: product.priority,
            company: product.company,
            in_stock: product.inStock,
            quantity: product.quantity,
            seller_id: userId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Supabase insert error:', error);
        throw error;
      }

      console.log('Product inserted successfully:', data);

      // Insert specifications if any
      if (product.specifications && product.specifications.length > 0) {
        console.log('Inserting product specifications...');
        const specs = product.specifications.map(spec => ({
          product_id: data.id,
          name: spec.name,
          value: spec.value,
          created_at: new Date().toISOString(),
        }));

        const { error: specsError } = await supabase
          .from('product_specifications')
          .insert(specs);

        if (specsError) {
          console.error('Error adding product specifications:', specsError);
        } else {
          console.log('Product specifications added successfully');
        }
      }

      // Return the new product
      return {
        id: data.id,
        name: data.name,
        description: data.description,
        price: data.price,
        category: data.category,
        image: data.image,
        perishable: data.perishable,
        expiryDate: data.expiry_date,
        priority: data.priority,
        company: data.company,
        inStock: data.in_stock,
        quantity: data.quantity,
        rating: data.rating || 0,
        specifications: product.specifications || [],
        sellerId: data.seller_id
      };
    } catch (dbError) {
      console.error('Database error:', dbError);

      // In development mode, create a mock product as fallback
      if (process.env.NODE_ENV === 'development') {
        console.log('Falling back to mock product in development mode');
        const mockId = Date.now();
        const mockProduct: Product = {
          id: mockId,
          name: product.name,
          description: product.description,
          price: product.price,
          category: product.category,
          image: product.image,
          perishable: product.perishable,
          expiryDate: product.expiryDate,
          priority: product.priority,
          company: product.company,
          inStock: product.inStock,
          quantity: product.quantity,
          rating: 0,
          specifications: product.specifications || [],
          sellerId: userId
        };

        // Add to mock products array for immediate use
        mockProducts.push(mockProduct);
        console.log('Created mock product with ID:', mockId);

        return mockProduct;
      }

      throw dbError;
    }
  } catch (error) {
    console.error('Error adding product:', error);
    throw error;
  }
};

// Update an existing product
export const updateProduct = async (product: Product): Promise<Product> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    // Verify product belongs to seller
    const { data: existingProduct, error: fetchError } = await supabase
      .from('products')
      .select('seller_id')
      .eq('id', product.id)
      .single();

    if (fetchError) throw fetchError;
    if (existingProduct.seller_id !== userId) {
      throw new Error('Unauthorized: You can only update your own products');
    }

    // Update product
    const { error: updateError } = await supabase
      .from('products')
      .update({
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category,
        image: product.image,
        perishable: product.perishable,
        expiry_date: product.expiryDate,
        priority: product.priority,
        company: product.company,
        in_stock: product.inStock,
        quantity: product.quantity,
        updated_at: new Date().toISOString(),
      })
      .eq('id', product.id);

    if (updateError) throw updateError;

    // Handle specifications
    if (product.specifications && product.specifications.length > 0) {
      // Delete existing specifications
      const { error: deleteError } = await supabase
        .from('product_specifications')
        .delete()
        .eq('product_id', product.id);

      if (deleteError) {
        console.error('Error deleting product specifications:', deleteError);
      }

      // Insert new specifications
      const specs = product.specifications.map(spec => ({
        product_id: product.id,
        name: spec.name,
        value: spec.value,
        created_at: new Date().toISOString(),
      }));

      const { error: specsError } = await supabase
        .from('product_specifications')
        .insert(specs);

      if (specsError) {
        console.error('Error updating product specifications:', specsError);
      }
    }

    return product;
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};

// Delete a product
export const deleteProduct = async (id: number): Promise<boolean> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    // Verify product belongs to seller
    const { data: existingProduct, error: fetchError } = await supabase
      .from('products')
      .select('seller_id')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;
    if (existingProduct.seller_id !== userId) {
      throw new Error('Unauthorized: You can only delete your own products');
    }

    // Delete specifications first (foreign key constraint)
    const { error: deleteSpecsError } = await supabase
      .from('product_specifications')
      .delete()
      .eq('product_id', id);

    if (deleteSpecsError) {
      console.error('Error deleting product specifications:', deleteSpecsError);
    }

    // Delete product
    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    return true;
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
};

// Donate a product
export const donateProduct = async (donation: DonationDetails): Promise<DonationDetails> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    // Verify product belongs to seller
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('*')
      .eq('id', donation.productId)
      .eq('seller_id', userId)
      .single();

    if (fetchError) throw fetchError;
    if (!product) throw new Error('Product not found');

    if (product.quantity < donation.quantity) {
      throw new Error('Not enough quantity available');
    }

    // Update product quantity
    const newQuantity = product.quantity - donation.quantity;
    const { error: updateError } = await supabase
      .from('products')
      .update({
        quantity: newQuantity,
        in_stock: newQuantity > 0,
        updated_at: new Date().toISOString(),
      })
      .eq('id', donation.productId);

    if (updateError) throw updateError;

    // Create donation record
    const { data: newDonation, error: donationError } = await supabase
      .from('donations')
      .insert([
        {
          product_id: donation.productId,
          seller_id: userId,
          quantity: donation.quantity,
          destination: donation.destination,
          notes: donation.notes,
          value: donation.value,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (donationError) throw donationError;

    return {
      id: newDonation.id,
      productId: newDonation.product_id,
      quantity: newDonation.quantity,
      destination: newDonation.destination,
      notes: newDonation.notes,
      value: newDonation.value,
    };
  } catch (error) {
    console.error('Error donating product:', error);
    throw error;
  }
};

// Create and donate a product in one step
export const donateNewProduct = async (params: {
  productData: Omit<Product, 'id' | 'sellerId'>,
  donationData: {
    quantity: number,
    destination: string,
    notes?: string
  }
}): Promise<DonationDetails> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    // First, create the product
    const { data: newProduct, error: productError } = await supabase
      .from('products')
      .insert([
        {
          name: params.productData.name,
          description: params.productData.description,
          price: params.productData.price,
          category: params.productData.category,
          image: params.productData.image,
          perishable: params.productData.perishable,
          expiry_date: params.productData.expiryDate,
          priority: params.productData.priority,
          company: params.productData.company,
          in_stock: params.productData.quantity > params.donationData.quantity,
          quantity: params.productData.quantity - params.donationData.quantity, // Reduce quantity by donation amount
          seller_id: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (productError) throw productError;

    // Create donation record
    const { data: newDonation, error: donationError } = await supabase
      .from('donations')
      .insert([
        {
          product_id: newProduct.id,
          seller_id: userId,
          quantity: params.donationData.quantity,
          destination: params.donationData.destination,
          notes: params.donationData.notes || '',
          value: params.productData.price * params.donationData.quantity, // Calculate value
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (donationError) throw donationError;

    return {
      id: newDonation.id,
      productId: newDonation.product_id,
      quantity: newDonation.quantity,
      destination: newDonation.destination,
      notes: newDonation.notes,
      value: newDonation.value,
    };
  } catch (error) {
    console.error('Error creating and donating product:', error);
    throw error;
  }
};

// Get all donations
export const getDonations = async (): Promise<DonationDetails[]> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('donations')
      .select('*')
      .eq('seller_id', userId);

    if (error) throw error;

    return data.map(item => ({
      id: item.id,
      productId: item.product_id,
      quantity: item.quantity,
      destination: item.destination,
      notes: item.notes,
      value: item.value,
    }));
  } catch (error) {
    console.error('Error fetching donations:', error);
    return [];
  }
};
