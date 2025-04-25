import { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, Gift, Heart, ArrowLeft, Truck, Clock, Star, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/auth-context";
import { getProductById } from "@/services/productService";
import { trackProductEvent, createSellerNotification } from "@/services/trackingService";
import { Product } from "@/types/product";
import { addToCart } from "@/services/cartService";

// Mock product data (would come from API in real app)
const mockProducts = [
  {
    id: 1,
    name: "Premium Headphones",
    description: "Noise-cancelling wireless headphones with superior sound quality.",
    price: 159.99,
    category: "electronics",
    image: "https://placehold.co/300x300/1a1f2c/ffffff?text=Headphones",
    perishable: false,
    inStock: true,
    rating: 4.8,
    company: "Sony",
    priority: "medium",
    longDescription: "Experience music like never before with our Premium Headphones. Featuring advanced noise-cancellation technology, these wireless headphones deliver crystal-clear sound quality and deep, rich bass. The comfortable over-ear design makes them perfect for long listening sessions, while the 30-hour battery life ensures your music never stops. Compatible with all Bluetooth devices and includes a premium carrying case.",
    specifications: [
      { name: "Battery Life", value: "30 hours" },
      { name: "Wireless Range", value: "30 feet" },
      { name: "Noise Cancellation", value: "Active" },
      { name: "Weight", value: "280g" },
      { name: "Connectivity", value: "Bluetooth 5.0" }
    ]
  },
  {
    id: 2,
    name: "Organic Apples",
    description: "Fresh and organic apples picked from local farms.",
    price: 5.99,
    category: "food",
    image: "https://placehold.co/300x300/1a1f2c/ffffff?text=Apples",
    perishable: true,
    inStock: true,
    rating: 4.5,
    company: "Organic Farms",
    priority: "high",
    longDescription: "Our Organic Apples are grown without the use of synthetic pesticides and fertilizers. Handpicked at the peak of ripeness from local sustainable farms, these crisp, juicy apples are perfect for healthy snacking or baking. Each order contains approximately 6-8 apples depending on size, all certified organic and sustainably grown.",
    specifications: [
      { name: "Origin", value: "Local Farms" },
      { name: "Type", value: "Honeycrisp" },
      { name: "Certification", value: "Organic" },
      { name: "Quantity", value: "6-8 apples per pack" },
      { name: "Storage", value: "Keep refrigerated" }
    ]
  },
  {
    id: 3,
    name: "Fantasy Novel",
    description: "Bestselling fantasy novel set in a magical world.",
    price: 12.99,
    category: "books",
    image: "https://placehold.co/300x300/1a1f2c/ffffff?text=Book",
    perishable: false,
    inStock: true,
    rating: 4.2,
    company: "Penguin Books",
    priority: "low",
    longDescription: "Dive into an epic fantasy adventure with our bestselling novel. Set in a richly imagined world of magic and intrigue, this tale follows the journey of an unlikely hero as they discover their hidden powers and face ancient evils. With complex characters, intricate world-building, and plot twists that will keep you guessing, this novel has captivated readers worldwide. Available in hardcover with a beautifully designed cover illustration.",
    specifications: [
      { name: "Author", value: "J.R. Tolkien" },
      { name: "Pages", value: "458" },
      { name: "Language", value: "English" },
      { name: "Publisher", value: "Fantasy Books Inc." },
      { name: "ISBN", value: "1234567890123" }
    ]
  }
];

const ProductDetail = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");

  // Get product details from Supabase
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!id) {
          setError("Product ID is missing");
          return;
        }

        const productId = parseInt(id);
        const fetchedProduct = await getProductById(productId);

        if (!fetchedProduct) {
          setError("Product not found");
          return;
        }

        setProduct(fetchedProduct);

        // Track product view if it has a seller ID
        if (fetchedProduct.sellerId) {
          try {
            await trackProductEvent(
              fetchedProduct.id,
              fetchedProduct.sellerId,
              'view',
              {
                productName: fetchedProduct.name
              }
            );
          } catch (trackError) {
            console.error('Error tracking product view:', trackError);
            // Don't set error state here, as we still want to show the product
          }
        }
      } catch (err) {
        console.error("Error fetching product:", err);
        setError("Failed to load product details. Please try again later.");
        toast({
          title: "Error",
          description: "Failed to load product details. Please try again later.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, toast]);

  // Handle quantity change
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      setQuantity(value);
    }
  };

  // Add to cart function
  const handleAddToCart = async () => {
    if (!user) {
      toast({
        title: "Please login",
        description: "You need to login to add items to your cart",
        variant: "destructive"
      });
      navigate("/login");
      return;
    }

    if (!product) return;

    try {
      // Add to cart using cart service
      await addToCart(product.id, quantity);

      // Track the cart event if product has a seller ID
      if (product.sellerId) {
        await trackProductEvent(
          product.id,
          product.sellerId,
          'cart',
          {
            productName: product.name,
            quantity,
            value: product.price * quantity,
            buyerId: user.id
          }
        );

        // Create notification for seller
        await createSellerNotification(
          product.sellerId,
          product.id,
          'cart',
          user.id,
          {
            productName: product.name,
            quantity,
            value: product.price * quantity,
            buyerName: user.name
          }
        );
      }

      toast({
        title: "Added to cart",
        description: `${quantity} × ${product.name} added to your cart`,
      });
    } catch (err) {
      console.error('Error adding to cart:', err);
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive"
      });
    }
  };

  // Donation functionality removed for buyers

  // Save to wishlist
  const handleSaveItem = () => {
    if (!user) {
      toast({
        title: "Please login",
        description: "You need to login to save items",
        variant: "destructive"
      });
      navigate("/login");
      return;
    }

    toast({
      description: `${product.name} saved to your wishlist`,
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-6">
            <p>{error}</p>
          </div>
          <Button asChild>
            <Link to="/products">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Products
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
          <p className="text-muted-foreground mb-6">The product you're looking for doesn't exist or has been removed.</p>
          <Button asChild>
            <Link to="/products">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Products
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl animate-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
        <Link to="/" className="hover:text-foreground">Home</Link>
        <span>/</span>
        <Link to="/products" className="hover:text-foreground">Products</Link>
        <span>/</span>
        <Link to={`/products?category=${product.category}`} className="hover:text-foreground capitalize">
          {product.category}
        </Link>
        <span>/</span>
        <span className="text-foreground truncate max-w-[200px]">{product.name}</span>
      </div>

      <div className="flex flex-col md:flex-row gap-8 mb-12">
        {/* Product image */}
        <div className="md:w-1/2">
          <div className="aspect-square overflow-hidden rounded-lg border border-border/40 bg-card/30 backdrop-blur-sm">
            <img
              src={product.image}
              alt={product.name}
              className="object-cover w-full h-full"
            />
          </div>
        </div>

        {/* Product info */}
        <div className="md:w-1/2 space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${i < Math.floor(product.rating) ? 'text-yellow-500 fill-yellow-500' : 'text-muted'}`}
                  />
                ))}
              </div>
              <span className="text-sm font-medium">{product.rating}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold">₹{product.price.toFixed(2)}</span>

            {product.perishable && (
              <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                Perishable
              </Badge>
            )}

            {!product.inStock && (
              <Badge variant="destructive">Out of Stock</Badge>
            )}
          </div>

          <p className="text-muted-foreground">{product.description}</p>

          <div className="flex items-center gap-2 text-sm">
            <Truck className="h-4 w-4 text-muted-foreground" />
            <span>Free shipping on orders over ₹50</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>Usually ships within 1-2 business days</span>
          </div>

          <Separator />

          {/* Purchase controls */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-24">
                <label htmlFor="quantity" className="text-sm font-medium sr-only">
                  Quantity
                </label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={handleQuantityChange}
                  className="w-full"
                />
              </div>
              <span className="text-sm text-muted-foreground">
                {product.inStock ? "In Stock" : "Out of Stock"}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                size="lg"
                className="flex-1"
                disabled={!product.inStock}
                onClick={handleAddToCart}
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                Add to Cart
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="flex-1 sm:flex-none"
                onClick={handleSaveItem}
              >
                <Heart className="mr-2 h-5 w-5" />
                Save
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Product details tabs */}
      <Card className="border border-border/40 bg-card/30 backdrop-blur-sm">
        <CardHeader className="px-6">
          <Tabs
            defaultValue={activeTab}
            className="w-full"
            onValueChange={setActiveTab}
          >
            <TabsList className="grid w-full grid-cols-2 md:w-auto md:inline-flex">
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="specifications">Specifications</TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="mt-6">
              <div className="space-y-4">
                <p>{product.longDescription}</p>
              </div>
            </TabsContent>

            <TabsContent value="specifications" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {product.specifications.map((spec: any, index: number) => (
                  <div key={index} className="flex justify-between py-2 border-b border-border/50">
                    <span className="font-medium">{spec.name}</span>
                    <span className="text-muted-foreground">{spec.value}</span>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardHeader>
      </Card>
    </div>
  );
};

export default ProductDetail;
