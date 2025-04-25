import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { getOrderById, cancelOrder, Order } from "@/services/orderService";
import { useAuth } from "@/context/auth-context";
import { ShoppingBag, Package, Truck, CheckCircle, XCircle, Clock, ArrowLeft, MapPin, Calendar, User, CreditCard } from "lucide-react";

const OrderDetail = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (!orderId) {
      navigate("/orders");
      return;
    }

    fetchOrderDetails();
  }, [user, orderId, navigate]);

  const fetchOrderDetails = async () => {
    if (!orderId) return;

    try {
      setLoading(true);
      console.log("Fetching order details for ID:", orderId);
      const orderDetails = await getOrderById(orderId);
      console.log("Fetched order details:", orderDetails);

      if (!orderDetails) {
        toast({
          title: "Order Not Found",
          description: "The requested order could not be found",
          variant: "destructive",
        });
        navigate("/orders");
        return;
      }

      setOrder(orderDetails);
    } catch (error) {
      console.error("Error fetching order details:", error);
      toast({
        title: "Error",
        description: "Failed to load order details",
        variant: "destructive",
      });
      navigate("/orders");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order) return;

    try {
      console.log("Cancelling order:", order.id);
      await cancelOrder(order.id);

      toast({
        title: "Order Cancelled",
        description: "Your order has been cancelled successfully",
      });

      // Refresh order details after a short delay to allow the database to update
      setTimeout(() => {
        fetchOrderDetails();
      }, 500);
    } catch (error) {
      console.error("Error cancelling order:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to cancel order",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case "processing":
        return <Badge className="bg-blue-500">Processing</Badge>;
      case "ready_for_pickup":
        return <Badge className="bg-indigo-500">Ready for Pickup</Badge>;
      case "dispatched":
        return <Badge className="bg-purple-500">Dispatched</Badge>;
      case "delivered":
        return <Badge className="bg-green-500">Delivered</Badge>;
      case "cancelled":
        return <Badge className="bg-red-500">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case "processing":
        return <Package className="h-5 w-5 text-blue-500" />;
      case "ready_for_pickup":
        return <ShoppingBag className="h-5 w-5 text-indigo-500" />;
      case "dispatched":
        return <Truck className="h-5 w-5 text-purple-500" />;
      case "delivered":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "cancelled":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Order Details</h1>
          <p className="text-muted-foreground">
            View details for your order
          </p>
        </div>
        <Button variant="ghost" className="mt-4 md:mt-0" asChild>
          <Link to="/orders">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : !order ? (
        <Card className="border border-border/40 bg-card/30 backdrop-blur-sm">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <XCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Order not found</h2>
            <p className="text-muted-foreground mb-6">
              The order you're looking for doesn't exist or you don't have permission to view it.
            </p>
            <Button asChild>
              <Link to="/orders">View Your Orders</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className="border border-border/40 bg-card/30 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">Order #{order.id.slice(0, 8)}</CardTitle>
                  <CardDescription>
                    Placed on {new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString()}
                  </CardDescription>
                </div>
                <div className="flex items-center">
                  {getStatusBadge(order.status)}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(order.status)}
                  <span className="font-medium">
                    {order.status === "pending" && "Awaiting confirmation"}
                    {order.status === "processing" && "Order is being processed"}
                    {order.status === "ready_for_pickup" && "Ready for pickup"}
                    {order.status === "dispatched" && "On the way to you"}
                    {order.status === "delivered" && "Delivered"}
                    {order.status === "cancelled" && "Order cancelled"}
                  </span>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-3">Order Items</h3>
                  <div className="space-y-4">
                    {order.items && order.items.map((item, index) => (
                      <div key={index} className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-md overflow-hidden bg-muted flex-shrink-0">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.product_name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // Fallback for broken images
                                (e.target as HTMLImageElement).src = 'https://placehold.co/100x100/1a1f2c/ffffff?text=Product';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground">
                              <Package className="h-6 w-6" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium">{item.product_name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Quantity: {item.quantity} × ₹{item.price.toFixed(2)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            ₹{(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      Shipping Address
                    </h3>
                    <div className="text-sm">
                      <p className="font-medium">{user?.name}</p>
                      <p>123 Main Street</p>
                      <p>Apt 4B</p>
                      <p>Bangalore, Karnataka 560001</p>
                      <p>India</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3 flex items-center">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Payment Information
                    </h3>
                    <div className="text-sm">
                      <p><span className="text-muted-foreground">Method:</span> {order.payment_method || 'Credit Card'}</p>
                      <p><span className="text-muted-foreground">Status:</span> {order.payment_status}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>₹{order.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>₹0.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax</span>
                    <span>₹0.00</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span>₹{order.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end space-x-2">
              {(order.status === "pending" || order.status === "processing") && (
                <Button
                  variant="destructive"
                  onClick={handleCancelOrder}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancel Order
                </Button>
              )}
              <Button variant="outline" asChild>
                <Link to="/orders">
                  View All Orders
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
};

export default OrderDetail;
