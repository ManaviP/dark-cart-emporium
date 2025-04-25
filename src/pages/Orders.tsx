import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { getUserOrders, cancelOrder, Order } from "@/services/orderService";
import { useAuth } from "@/context/auth-context";
import { ShoppingBag, Package, Truck, CheckCircle, XCircle, Clock, ArrowLeft, Eye } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Orders = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    fetchOrders();
  }, [user, navigate]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const userOrders = await getUserOrders();
      console.log("Fetched orders:", userOrders);
      setOrders(userOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast({
        title: "Error",
        description: "Failed to load your orders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      setCancellingOrderId(orderId);
      await cancelOrder(orderId);
      
      // Update local state immediately
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { ...order, status: 'cancelled' } 
            : order
        )
      );
      
      toast({
        title: "Success",
        description: "Your order has been cancelled successfully"
      });
      
      // Refresh orders list to ensure data consistency
      await fetchOrders();
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to cancel order. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setCancellingOrderId(null);
      setShowCancelDialog(false);
    }
  };

  const openCancelDialog = (orderId: string) => {
    setSelectedOrderId(orderId);
    setShowCancelDialog(true);
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
          <h1 className="text-3xl font-bold mb-2">Your Orders</h1>
          <p className="text-muted-foreground">
            Track and manage your orders
          </p>
        </div>
        <Button variant="ghost" className="mt-4 md:mt-0" asChild>
          <Link to="/products">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Continue Shopping
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : orders.length === 0 ? (
        <Card className="border border-border/40 bg-card/30 backdrop-blur-sm">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ShoppingBag className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No orders yet</h2>
            <p className="text-muted-foreground mb-6">
              You haven't placed any orders yet.
            </p>
            <Button asChild>
              <Link to="/products">Browse Products</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <Card key={order.id} className="border border-border/40 bg-card/30 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">Order #{order.id.slice(0, 8)}</CardTitle>
                    <CardDescription>
                      Placed on {new Date(order.created_at).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <div className="flex items-center">
                    {getStatusBadge(order.status)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
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
                  <Separator />
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(order.status)}
                      <span className="text-sm font-medium">
                        {order.status === "pending" && "Awaiting confirmation"}
                        {order.status === "processing" && "Order is being processed"}
                        {order.status === "ready_for_pickup" && "Ready for pickup"}
                        {order.status === "dispatched" && "On the way to you"}
                        {order.status === "delivered" && "Delivered"}
                        {order.status === "cancelled" && "Order cancelled"}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="font-bold">₹{order.total.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end space-x-2 pt-0">
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/orders/${order.id}`}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </Link>
                </Button>
                {order.status !== 'cancelled' && (order.status === 'pending' || order.status === 'processing') && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => openCancelDialog(order.id)}
                    disabled={cancellingOrderId === order.id}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    {cancellingOrderId === order.id ? "Cancelling..." : "Cancel Order"}
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to cancel this order?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The order will be cancelled and you will need to place a new order if you wish to purchase these items again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancellingOrderId !== null}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedOrderId && handleCancelOrder(selectedOrderId)}
              disabled={cancellingOrderId !== null}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancellingOrderId !== null ? "Cancelling..." : "Yes, cancel order"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Orders;
