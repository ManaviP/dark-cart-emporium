import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, ShoppingCart } from "lucide-react";
import { Product } from "@/types/product";
import { useCart } from "@/hooks/useCart";
import { saveProduct, removeSavedProduct, isProductSaved, getSavedProducts } from "@/services/savedProductsService";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import { useNavigate } from "react-router-dom";

interface ProductCardProps {
  product: Product;
  onCardClick?: (productId: string) => void;
}

const ProductCard = ({ product, onCardClick }: ProductCardProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkSavedStatus = async () => {
      if (!user) return;
      try {
        const saved = await isProductSaved(product.id);
        setIsSaved(saved);
      } catch (error) {
        console.error('Error checking saved status:', error);
      }
    };
    checkSavedStatus();
  }, [user, product.id]);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast({
        title: "Please login",
        description: "You need to login to add items to your cart",
        variant: "destructive"
      });
      navigate("/login");
      return;
    }

    try {
      setLoading(true);
      await addToCart(product);
      toast({
        title: "Added to cart",
        description: `${product.name} added to your cart`,
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProduct = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast({
        title: "Please login",
        description: "You need to login to save products",
        variant: "destructive"
      });
      navigate("/login");
      return;
    }

    try {
      setLoading(true);
      if (isSaved) {
        await removeSavedProduct(product.id);
        setIsSaved(false);
        toast({
          description: "Product removed from saved items",
        });
      } else {
        await saveProduct(product.id);
        setIsSaved(true);
        toast({
          description: "Product saved successfully",
        });
      }
    } catch (error) {
      console.error('Error saving product:', error);
      toast({
        title: "Error",
        description: "Failed to save product",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => onCardClick?.(product.id)}
    >
      <CardContent className="p-0">
        <div className="relative">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-48 object-cover"
          />
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 bg-white/80 hover:bg-white"
            onClick={handleSaveProduct}
            disabled={loading}
          >
            <Heart
              className={`h-5 w-5 ${isSaved ? 'fill-red-500 text-red-500' : 'text-gray-500'}`}
            />
          </Button>
        </div>
        <div className="p-4">
          <h3 className="font-semibold mb-1">{product.name}</h3>
          <p className="text-gray-500 text-sm mb-2">{product.category}</p>
          <div className="flex items-center justify-between">
            <span className="font-bold">${product.price}</span>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleAddToCart}
              disabled={loading || !product.inStock}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              {product.inStock ? "Add to Cart" : "Out of Stock"}
            </Button>
          </div>
          {!product.inStock && (
            <Badge variant="destructive" className="mt-2">
              Out of Stock
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard; 