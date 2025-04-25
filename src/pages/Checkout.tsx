import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCard, Truck, Home, CheckCircle2, Clock, ShieldCheck, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/auth-context";
import { getCart } from "@/services/cartService";
import { createOrder, OrderItem } from "@/services/orderService";
import { getUserAddresses } from "@/services/addressService";
import { Address } from "@/context/auth-context";

// Mock cart data
const mockCartItems = [
  {
    id: 1,
    productId: 1,
    name: "Premium Headphones",
    price: 159.99,
    quantity: 1,
    image: "https://placehold.co/300x300/1a1f2c/ffffff?text=Headphones",
  },
  {
    id: 2,
    productId: 3,
    name: "Fantasy Novel",
    price: 12.99,
    quantity: 2,
    image: "https://placehold.co/300x300/1a1f2c/ffffff?text=Book",
  },
  {
    id: 3,
    productId: 5,
    name: "Denim Jacket",
    price: 69.99,
    quantity: 1,
    image: "https://placehold.co/300x300/1a1f2c/ffffff?text=Jacket",
  }
];

const Checkout = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [cartItems, setCartItems] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [processingOrder, setProcessingOrder] = useState(false);
  const [activeTab, setActiveTab] = useState("delivery");
  const [saveAddress, setSaveAddress] = useState(true);
  const [savePayment, setSavePayment] = useState(true);
  const [orderPlaced, setOrderPlaced] = useState(false);

  // Form state
  const [deliveryAddress, setDeliveryAddress] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("credit-card");
  const [nameOnCard, setNameOnCard] = useState<string>(user?.name || "");
  const [cardNumber, setCardNumber] = useState<string>("");
  const [expiryDate, setExpiryDate] = useState<string>("");
  const [cvv, setCvv] = useState<string>("");

  // Calculate totals
  const subtotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  const shipping = subtotal > 50 ? 0 : 5.99;
  const tax = subtotal * 0.07; // 7% tax
  const total = subtotal + shipping + tax;

  // Load cart data and user addresses
  useEffect(() => {
    const loadCartData = async () => {
      if (!user || user.role !== 'buyer') {
        navigate("/");
        return;
      }

      try {
        setLoading(true);

        // Get real cart data from Supabase
        const items = await getCart();

        if (items.length === 0) {
          toast({
            title: "Empty Cart",
            description: "Your cart is empty. Add some items before checkout.",
            variant: "destructive"
          });
          navigate("/buyer/cart");
          return;
        }

        // Transform cart items to match the format needed for display
        const transformedItems = items.map(item => ({
          id: item.id,
          productId: item.product.id,
          name: item.product.name,
          price: item.product.price,
          quantity: item.quantity,
          image: item.product.image,
          sellerId: item.product.sellerId
        }));

        setCartItems(transformedItems);
      } catch (error) {
        console.error("Error loading cart:", error);
        toast({
          title: "Error",
          description: "Failed to load your cart",
          variant: "destructive"
        });
        navigate("/buyer/cart");
      } finally {
        setLoading(false);
      }
    };

    const loadAddresses = async () => {
      if (!user) return;

      try {
        setLoadingAddresses(true);
        console.log("Fetching addresses from Supabase");

        // Get addresses from Supabase
        const userAddresses = await getUserAddresses();
        console.log("Fetched addresses:", userAddresses);

        setAddresses(userAddresses);

        // Set default address if available
        if (userAddresses.length > 0) {
          const defaultAddress = userAddresses.find(addr => addr.is_default);
          if (defaultAddress) {
            setDeliveryAddress(defaultAddress.id);
          } else {
            // If no default address, use the first one
            setDeliveryAddress(userAddresses[0].id);
          }
        }
      } catch (error) {
        console.error("Error loading addresses:", error);
      } finally {
        setLoadingAddresses(false);
      }
    };

    loadCartData();
    loadAddresses();
  }, [user, navigate, toast]);

  // Format credit card number
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];

    for (let i = 0; i < match.length; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  // Handle order placement
  const placeOrder = async () => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to place an order',
        variant: 'destructive'
      });
      navigate('/login');
      return;
    }

    if (!deliveryAddress) {
      toast({
        title: 'Address Required',
        description: 'Please select a delivery address',
        variant: 'destructive'
      });
      return;
    }

    if (cartItems.length === 0) {
      toast({
        title: 'Empty Cart',
        description: 'Your cart is empty. Add some items before checkout.',
        variant: 'destructive'
      });
      navigate('/buyer/cart');
      return;
    }

    try {
      setProcessingOrder(true);

      console.log("Placing order with address:", deliveryAddress);
      console.log("Cart items:", cartItems);

      // Create the order
      const order = await createOrder(deliveryAddress, cartItems);

      console.log("Order created successfully:", order);

      // Set order placed flag to show success page
      setOrderPlaced(true);

      toast({
        title: 'Order Placed Successfully',
        description: 'Your order has been placed and is being processed'
      });
    } catch (error) {
      console.error('Error placing order:', error);
      toast({
        title: 'Error Placing Order',
        description: 'There was an error processing your order. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setProcessingOrder(false);
    }
  };

  // If order is placed, show success page
  if (orderPlaced) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-lg animate-in">
        <Card className="border border-border/40 bg-card/30 backdrop-blur-sm">
          <CardContent className="pt-6 px-6 pb-8 text-center">
            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>

            <h1 className="text-2xl font-bold mb-2">Order Placed Successfully!</h1>
            <p className="text-muted-foreground mb-6">
              Your order has been received and is being processed.
              You will receive a confirmation email shortly.
            </p>

            <div className="text-left p-4 bg-muted/30 rounded-lg mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-muted-foreground">Order Number:</span>
                <span className="font-medium">ORD-{Math.floor(100000 + Math.random() * 900000)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-muted-foreground">Order Date:</span>
                <span className="font-medium">{new Date().toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Amount:</span>
                <span className="font-medium">${total.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button className="flex-1" asChild>
                <Link to="/buyer/orders">
                  <Truck className="mr-2 h-4 w-4" />
                  Track Order
                </Link>
              </Button>
              <Button variant="outline" className="flex-1" asChild>
                <Link to="/products">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Continue Shopping
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl animate-in">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-1">Checkout</h1>
          <p className="text-muted-foreground">
            Complete your order
          </p>
        </div>
        <Button variant="ghost" className="mt-4 md:mt-0" asChild>
          <Link to="/buyer/cart">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Cart
          </Link>
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Checkout steps */}
        <div className="lg:w-2/3">
          <Tabs
            defaultValue="delivery"
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="delivery" disabled={processingOrder}>
                <Truck className="mr-2 h-4 w-4" />
                Delivery
              </TabsTrigger>
              <TabsTrigger value="payment" disabled={processingOrder}>
                <CreditCard className="mr-2 h-4 w-4" />
                Payment
              </TabsTrigger>
            </TabsList>

            {/* Delivery Tab */}
            <TabsContent value="delivery" className="mt-6 space-y-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Delivery Address</CardTitle>
                  <CardDescription>Select a delivery address or add a new one</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {loading || loadingAddresses ? (
                      <div className="space-y-4">
                        {[1, 2].map((i) => (
                          <div key={i} className="animate-pulse flex-1 space-y-3 py-3">
                            <div className="h-4 bg-muted rounded w-3/4"></div>
                            <div className="h-4 bg-muted rounded w-1/2"></div>
                            <div className="h-4 bg-muted rounded w-5/6"></div>
                          </div>
                        ))}
                      </div>
                    ) : addresses.length > 0 ? (
                      <RadioGroup value={deliveryAddress} onValueChange={setDeliveryAddress}>
                        {addresses.map((address) => (
                          <div key={address.id} className="flex items-start space-x-3 border border-border/40 rounded-lg p-4 mb-3">
                            <RadioGroupItem value={address.id} id={`address-${address.id}`} className="mt-1" />
                            <div className="flex-1">
                              <label htmlFor={`address-${address.id}`} className="font-medium text-base cursor-pointer">
                                {address.name}
                                {address.is_default && (
                                  <span className="ml-2 text-xs bg-primary/10 text-primary py-0.5 px-1.5 rounded">
                                    Default
                                  </span>
                                )}
                              </label>
                              <p className="text-sm text-muted-foreground mt-1">
                                {address.line1}
                                {address.line2 && `, ${address.line2}`}
                                <br />
                                {address.city}, {address.state} {address.postal_code}
                                <br />
                                {address.country}
                              </p>
                            </div>
                          </div>
                        ))}
                      </RadioGroup>
                    ) : (
                      <div className="text-center py-6">
                        <div className="rounded-full bg-muted/50 p-3 mx-auto w-fit mb-4">
                          <Home className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-medium mb-1">No addresses found</h3>
                        <p className="text-muted-foreground mb-4">
                          You don't have any saved addresses yet.
                        </p>
                        <Button variant="secondary" asChild>
                          <Link to="/profile">Add New Address</Link>
                        </Button>
                      </div>
                    )}

                    {addresses.length > 0 && (
                      <div className="flex justify-between items-center mt-4 pt-4 border-t border-border/40">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="save-address"
                            checked={saveAddress}
                            onCheckedChange={(checked) => setSaveAddress(!!checked)}
                          />
                          <label htmlFor="save-address" className="text-sm">
                            Use as default address
                          </label>
                        </div>

                        <Button variant="outline" size="sm" asChild>
                          <Link to="/profile">Add New Address</Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Shipping Method</CardTitle>
                  <CardDescription>Choose your preferred shipping method</CardDescription>
                </CardHeader>
                <CardContent>
                  <RadioGroup defaultValue="standard">
                    <div className="flex items-start space-x-3 border border-border/40 rounded-lg p-4 mb-3">
                      <RadioGroupItem value="standard" id="standard" className="mt-1" />
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <label htmlFor="standard" className="font-medium text-base cursor-pointer">
                            Standard Delivery
                          </label>
                          <span className="font-medium">
                            {shipping === 0 ? (
                              <span className="text-green-500">Free</span>
                            ) : (
                              `$${shipping.toFixed(2)}`
                            )}
                          </span>
                        </div>
                        <div className="flex items-center mt-1">
                          <Clock className="h-4 w-4 text-muted-foreground mr-1" />
                          <p className="text-sm text-muted-foreground">
                            Estimated delivery: 3-5 business days
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 border border-border/40 rounded-lg p-4">
                      <RadioGroupItem value="express" id="express" className="mt-1" disabled />
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <label htmlFor="express" className="font-medium text-base cursor-pointer text-muted-foreground">
                            Express Delivery
                          </label>
                          <span className="font-medium text-muted-foreground">
                            $12.99
                          </span>
                        </div>
                        <div className="flex items-center mt-1">
                          <Clock className="h-4 w-4 text-muted-foreground mr-1" />
                          <p className="text-sm text-muted-foreground">
                            Estimated delivery: 1-2 business days
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Express delivery is temporarily unavailable for your region.
                        </p>
                      </div>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Payment Tab */}
            <TabsContent value="payment" className="mt-6 space-y-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Payment Method</CardTitle>
                  <CardDescription>Choose your preferred payment method</CardDescription>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={paymentMethod}
                    onValueChange={setPaymentMethod}
                    className="space-y-3"
                  >
                    <div className="flex items-start space-x-3 border border-border/40 rounded-lg p-4">
                      <RadioGroupItem value="credit-card" id="credit-card" className="mt-1" />
                      <div className="flex-1">
                        <label htmlFor="credit-card" className="font-medium text-base cursor-pointer">
                          Credit / Debit Card
                        </label>
                        <div className="grid gap-4 mt-3">
                          <div className="grid gap-2">
                            <Label htmlFor="name-on-card">Name on Card</Label>
                            <Input
                              id="name-on-card"
                              placeholder="John Doe"
                              value={nameOnCard}
                              onChange={(e) => setNameOnCard(e.target.value)}
                              disabled={paymentMethod !== "credit-card"}
                            />
                          </div>

                          <div className="grid gap-2">
                            <Label htmlFor="card-number">Card Number</Label>
                            <Input
                              id="card-number"
                              placeholder="4111 1111 1111 1111"
                              value={cardNumber}
                              onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                              maxLength={19}
                              disabled={paymentMethod !== "credit-card"}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                              <Label htmlFor="expiry">Expiry Date</Label>
                              <Input
                                id="expiry"
                                placeholder="MM/YY"
                                value={expiryDate}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/\D/g, '');
                                  if (value.length <= 4) {
                                    let formatted = value;
                                    if (value.length > 2) {
                                      formatted = value.slice(0, 2) + '/' + value.slice(2);
                                    }
                                    setExpiryDate(formatted);
                                  }
                                }}
                                maxLength={5}
                                disabled={paymentMethod !== "credit-card"}
                              />
                            </div>

                            <div className="grid gap-2">
                              <Label htmlFor="cvv">CVV</Label>
                              <Input
                                id="cvv"
                                placeholder="123"
                                type="password"
                                value={cvv}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/\D/g, '');
                                  if (value.length <= 4) {
                                    setCvv(value);
                                  }
                                }}
                                maxLength={4}
                                disabled={paymentMethod !== "credit-card"}
                              />
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 mt-1">
                            <Checkbox
                              id="save-payment"
                              checked={savePayment}
                              onCheckedChange={(checked) => setSavePayment(!!checked)}
                              disabled={paymentMethod !== "credit-card"}
                            />
                            <label htmlFor="save-payment" className="text-sm">
                              Save this card for future purchases
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 border border-border/40 rounded-lg p-4">
                      <RadioGroupItem value="paypal" id="paypal" className="mt-1" disabled />
                      <div className="flex-1">
                        <label htmlFor="paypal" className="font-medium text-base cursor-pointer text-muted-foreground">
                          PayPal
                        </label>
                        <p className="text-xs text-muted-foreground mt-2">
                          PayPal integration is coming soon.
                        </p>
                      </div>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>

              <div className="flex items-center p-4 bg-muted/30 rounded-lg">
                <ShieldCheck className="h-5 w-5 text-muted-foreground mr-3" />
                <p className="text-sm text-muted-foreground">
                  Your payment information is secure and encrypted. We do not store your
                  full card details on our servers.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Order summary */}
        <div className="lg:w-1/3">
          <Card className="border border-border/40 bg-card/30 backdrop-blur-sm sticky top-20">
            <CardHeader className="pb-3">
              <CardTitle>Order Summary</CardTitle>
              <CardDescription>Review your order details</CardDescription>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="space-y-4">
                {/* Order items */}
                <div className="space-y-3">
                  {loading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex animate-pulse">
                          <div className="w-12 h-12 bg-muted rounded-md"></div>
                          <div className="ml-3 flex-1 space-y-1 py-1">
                            <div className="h-3 bg-muted rounded w-3/4"></div>
                            <div className="h-3 bg-muted rounded w-1/4"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    cartItems.map(item => (
                      <div key={item.id} className="flex">
                        <div className="w-12 h-12 rounded-md overflow-hidden">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="ml-3 flex-1">
                          <p className="text-sm font-medium line-clamp-1">{item.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Qty: {item.quantity} × ${item.price.toFixed(2)}
                          </p>
                        </div>
                        <div className="text-right font-medium text-sm">
                          ${(item.price * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <Separator />

                {/* Order totals */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>
                      {shipping === 0 ? (
                        <span className="text-green-500">Free</span>
                      ) : (
                        `$${shipping.toFixed(2)}`
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax (7%)</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between font-medium">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                size="lg"
                onClick={placeOrder}
                disabled={loading || processingOrder}
              >
                {processingOrder ? (
                  <>
                    <span className="mr-2">Processing...</span>
                    <div className="h-4 w-4 border-2 border-background border-r-transparent rounded-full animate-spin"></div>
                  </>
                ) : activeTab === "payment" ? (
                  "Place Order"
                ) : (
                  "Continue to Payment"
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
