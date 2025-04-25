import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, Trash2, ShoppingCart, ChevronLeft, MinusCircle, PlusCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/auth-context";
import { getCart, updateCartItem, removeFromCart, CartItem } from "@/services/cartService";

const Cart = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoDiscount, setPromoDiscount] = useState(0);

  // Calculate subtotal
  const subtotal = cartItems.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  const shipping = subtotal > 50 ? 0 : 5.99;
  const discount = promoApplied ? promoDiscount : 0;
  const total = subtotal + shipping - discount;

  // Load cart data
  useEffect(() => {
    const loadCart = async () => {
      if (!user) {
        navigate("/login");
        return;
      }

      try {
        setLoading(true);
        const items = await getCart();
        setCartItems(items);
      } catch (error) {
        console.error("Error loading cart:", error);
        toast({
          title: "Error",
          description: "Failed to load your cart",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadCart();
  }, [user, navigate, toast]);

  // Update quantity
  const updateQuantity = async (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;

    try {
      const updatedItem = await updateCartItem(itemId, newQuantity);
      if (updatedItem) {
        setCartItems(items =>
          items.map(item =>
            item.id === itemId ? updatedItem : item
          )
        );
      }
    } catch (error) {
      console.error("Error updating quantity:", error);
      toast({
        title: "Error",
        description: "Failed to update quantity",
        variant: "destructive",
      });
    }
  };

  // Remove item
  const removeItem = async (itemId: number) => {
    try {
      await removeFromCart(itemId);
      setCartItems(items => items.filter(item => item.id !== itemId));
      toast({
        description: "Item removed from your cart",
      });
    } catch (error) {
      console.error("Error removing item:", error);
      toast({
        title: "Error",
        description: "Failed to remove item",
        variant: "destructive",
      });
    }
  };

  // Donation functionality removed for buyers

  // Apply promo code
  const applyPromoCode = () => {
    if (promoCode.toLowerCase() === "discount20") {
      const discount = subtotal * 0.2;
      setPromoDiscount(discount);
      setPromoApplied(true);

      toast({
        description: "Promo code applied successfully!",
      });
    } else {
      toast({
        title: "Invalid promo code",
        description: "Please enter a valid promo code",
        variant: "destructive",
      });
    }
  };

  // Handle checkout
  const handleCheckout = () => {
    if (cartItems.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Add some items to your cart before checkout",
        variant: "destructive",
      });
      return;
    }

    navigate("/checkout");
  };

  // Empty cart display
  if (!loading && cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-6xl animate-in">
        <div className="text-center max-w-md mx-auto">
          <div className="rounded-full bg-primary/10 p-3 mx-auto w-fit mb-6">
            <ShoppingCart className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
          <p className="text-muted-foreground mb-6">
            Looks like you haven't added anything to your cart yet.
          </p>
          <Button asChild>
            <Link to="/products">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Continue Shopping
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl animate-in">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-1">Your Cart</h1>
          <p className="text-muted-foreground">
            {!loading && cartItems.length > 0 ? `${cartItems.length} item${cartItems.length !== 1 ? 's' : ''}` : 'Loading...'}
          </p>
        </div>
        <Button variant="outline" className="mt-4 md:mt-0" asChild>
          <Link to="/products">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Continue Shopping
          </Link>
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Cart items */}
        <div className="lg:w-2/3">
          {loading ? (
            // Loading state
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="border border-border/40 bg-card/30 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex animate-pulse">
                      <div className="w-24 h-24 bg-muted rounded-md"></div>
                      <div className="ml-4 flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                        <div className="h-4 bg-muted rounded w-1/4"></div>
                        <div className="h-4 bg-muted rounded w-1/2"></div>
                      </div>
                      <div className="w-24 h-8 bg-muted rounded-md"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {cartItems.map((item) => (
                <Card key={item.id} className="border border-border/40 bg-card/30 backdrop-blur-sm">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <Link to={`/products/${item.productId}`} className="block">
                        <div className="w-full sm:w-20 h-20 rounded-md overflow-hidden">
                          <img
                            src={item.product.image}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </Link>

                      <div className="flex-1">
                        <Link to={`/products/${item.productId}`} className="hover:underline">
                          <h3 className="font-medium line-clamp-1">{item.product.name}</h3>
                        </Link>
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-center border border-border rounded-md">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-none rounded-l-md"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                            >
                              <MinusCircle className="h-4 w-4" />
                            </Button>
                            <div className="w-10 text-center text-sm">
                              {item.quantity}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-none rounded-r-md"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            >
                              <PlusCircle className="h-4 w-4" />
                            </Button>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-muted-foreground"
                            onClick={() => removeItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            <span className="text-xs">Remove</span>
                          </Button>
                        </div>
                      </div>

                      <div className="text-right font-medium">
                        ₹{(item.product.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Order summary */}
        <div className="lg:w-1/3">
          <Card className="border border-border/40 bg-card/30 backdrop-blur-sm sticky top-20">
            <CardHeader className="pb-3">
              <CardTitle>Order Summary</CardTitle>
              <CardDescription>Review your order details</CardDescription>
            </CardHeader>
            <CardContent className="pb-4 space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>
                  {shipping === 0 ? (
                    <span className="text-green-500">Free</span>
                  ) : (
                    `₹${shipping.toFixed(2)}`
                  )}
                </span>
              </div>

              {promoApplied && (
                <div className="flex justify-between text-green-500">
                  <span>Discount (20%)</span>
                  <span>-₹{discount.toFixed(2)}</span>
                </div>
              )}

              <Separator />

              <div className="flex justify-between font-medium text-lg">
                <span>Total</span>
                <span>₹{total.toFixed(2)}</span>
              </div>

              {/* Promo code */}
              <div>
                <label htmlFor="promo" className="text-sm font-medium mb-2 block">
                  Promo Code
                </label>
                <div className="flex gap-2">
                  <Input
                    id="promo"
                    placeholder="Enter code"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    disabled={promoApplied}
                  />
                  <Button
                    variant={promoApplied ? "outline" : "secondary"}
                    onClick={promoApplied ? () => {
                      setPromoApplied(false);
                      setPromoDiscount(0);
                      setPromoCode("");
                    } : applyPromoCode}
                    disabled={!promoCode && !promoApplied}
                  >
                    {promoApplied ? "Remove" : "Apply"}
                  </Button>
                </div>
                {!promoApplied && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Try "DISCOUNT20" for 20% off
                  </p>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                size="lg"
                onClick={handleCheckout}
                disabled={loading || cartItems.length === 0}
              >
                Proceed to Checkout
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Cart;
