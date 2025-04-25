import { useState, useEffect } from "react";
import { getSavedProducts, removeSavedProduct } from "@/services/savedProductsService";
import { Product } from "@/types/product";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";

interface SavedProduct {
  id: string;
  productId: string;
  product: Product;
  createdAt: string;
}

export const SavedProducts = () => {
  const [savedProducts, setSavedProducts] = useState<SavedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    fetchSavedProducts();
  }, []);

  const fetchSavedProducts = async () => {
    try {
      const products = await getSavedProducts();
      setSavedProducts(products);
    } catch (error) {
      console.error('Error fetching saved products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (savedProductId: string) => {
    try {
      await removeSavedProduct(savedProductId);
      setSavedProducts(products => 
        products.filter(p => p.id !== savedProductId)
      );
    } catch (error) {
      console.error('Error removing saved product:', error);
    }
  };

  const handleAddToCart = (product: Product) => {
    addToCart(product);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {savedProducts.length === 0 ? (
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold mb-2">No saved products</h2>
          <p className="text-gray-500">Save products to see them here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedProducts.map(({ id, product }) => (
            <div key={id} className="border rounded-lg p-4">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-48 object-cover rounded mb-4"
              />
              <h3 className="font-semibold mb-2">{product.name}</h3>
              <p className="text-gray-500 mb-2">${product.price}</p>
              <div className="flex space-x-2">
                <Button
                  onClick={() => handleAddToCart(product)}
                  className="flex-1"
                >
                  Add to Cart
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleRemove(id)}
                  className="flex-1"
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}; 