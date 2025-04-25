import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Heart, ShoppingCart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getSavedProducts, removeSavedProduct } from "@/services/savedProductsService";
import { SavedProduct } from "@/services/savedProductsService";
import { addToCart } from "@/services/cartService";
import { useAuth } from "@/context/auth-context";

const SavedProducts = () => {
  const [savedProducts, setSavedProducts] = useState<SavedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchSavedProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const products = await getSavedProducts();
        setSavedProducts(products);
      } catch (err) {
        console.error("Error fetching saved products:", err);
        setError("Failed to load saved products. Please try again later.");
        toast({
          title: "Error",
          description: "Failed to load saved products. Please try again later.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSavedProducts();
  }, [user, navigate, toast]);

  const handleRemoveSaved = async (savedProductId: string) => {
    try {
      const success = await removeSavedProduct(savedProductId);
      if (success) {
        setSavedProducts(products => 
          products.filter(p => p.id !== savedProductId)
        );
        toast({
          title: "Removed from saved",
          description: "Product has been removed from your saved items",
        });
      }
    } catch (err) {
      console.error("Error removing saved product:", err);
      toast({
        title: "Error",
        description: "Failed to remove product from saved items",
        variant: "destructive"
      });
    }
  };

  const handleAddToCart = async (productId: string) => {
    try {
      await addToCart(productId, 1);
      toast({
        title: "Added to cart",
        description: "Product has been added to your cart",
      });
    } catch (err) {
      console.error("Error adding to cart:", err);
      toast({
        title: "Error",
        description: "Failed to add product to cart",
        variant: "destructive"
      });
    }
  };

  const handleCardClick = (productId: string) => {
    navigate(`/products/${productId}`);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Saved Products</h1>
          <p className="text-muted-foreground">
            Your favorite products are saved here
          </p>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading saved products...</p>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-4 max-w-md text-center">
            <p>{error}</p>
          </div>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && savedProducts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="bg-muted p-8 rounded-md mb-4 max-w-md text-center">
            <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-bold mb-2">No saved products</h3>
            <p className="text-muted-foreground mb-4">
              You haven't saved any products yet. Start saving your favorite products!
            </p>
            <Button onClick={() => navigate("/products")}>Browse Products</Button>
          </div>
        </div>
      )}

      {/* Product grid */}
      {!loading && !error && savedProducts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {savedProducts.map(({ id, product }) => (
            <Card
              key={id}
              className="overflow-hidden border border-border/40 bg-card/30 backdrop-blur-sm hover:bg-card/50 transition-colors"
            >
              <div 
                className="aspect-square relative overflow-hidden cursor-pointer"
                onClick={() => handleCardClick(product.id)}
              >
                <img
                  src={product.image}
                  alt={product.name}
                  className="object-cover w-full h-full"
                />
                {!product.inStock && (
                  <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
                    <Badge variant="destructive" className="text-base py-1.5">Out of Stock</Badge>
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <h3 className="font-medium line-clamp-1">{product.name}</h3>
                <p className="text-muted-foreground text-sm line-clamp-2 mt-1 mb-3">
                  {product.description}
                </p>
                <div className="flex items-center justify-between">
                  <p className="font-bold text-lg">₹{product.price.toFixed(2)}</p>
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveSaved(id);
                      }}
                    >
                      <Heart className="h-4 w-4 fill-primary" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(product.id);
                      }}
                      disabled={!product.inStock}
                    >
                      <ShoppingCart className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedProducts; 