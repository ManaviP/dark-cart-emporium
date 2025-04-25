import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getOrderById, cancelOrder, Order } from "@/services/orderService";
import { getLogisticsTrackingByOrderId, LogisticsTracking } from "@/services/logisticsService";
import { Truck, Package, MapPin, XCircle } from "lucide-react";
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

const OrderDetails = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [tracking, setTracking] = useState<LogisticsTracking | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const orderData = await getOrderById(orderId!);
      setOrder(orderData);

      if (orderData) {
        const trackingData = await getLogisticsTrackingByOrderId(orderId!);
        setTracking(trackingData);
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast({
        title: "Error",
        description: "Failed to load order details",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!orderId) return;

    try {
      setCancelling(true);
      await cancelOrder(orderId);
      toast({
        title: "Success",
        description: "Your order has been cancelled successfully"
      });
      
      // Refresh order details to show updated status
      await fetchOrderDetails();
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to cancel order. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setCancelling(false);
      setShowCancelDialog(false);
    }
  };

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'processing':
        return <Badge variant="default">Processing</Badge>;
      case 'ready_for_pickup':
        return <Badge variant="default">Ready for Pickup</Badge>;
      case 'dispatched':
        return <Badge variant="default">Dispatched</Badge>;
      case 'delivered':
        return <Badge variant="default">Delivered</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!order) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="py-6">
            <p className="text-center text-muted-foreground">Order not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Order Details</h1>
        <div className="flex items-center gap-2">
          {getStatusBadge(order.status)}
          <span className="text-sm text-muted-foreground">
            {new Date(order.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Order Items */}
        <Card>
          <CardHeader>
            <CardTitle>Order Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {order.items?.map((item, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{item.product_name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Quantity: {item.quantity} × ₹{item.price}
                    </p>
                  </div>
                  <p className="font-medium">
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
              <div className="flex justify-between items-center pt-4 border-t">
                <p className="font-medium">Total</p>
                <p className="font-bold">₹{order.total.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logistics Tracking */}
        <Card>
          <CardHeader>
            <CardTitle>Logistics Tracking</CardTitle>
          </CardHeader>
          <CardContent>
            {tracking ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>Pickup Location</span>
                    </div>
                    <p className="text-sm">
                      {tracking.start_location.line1}
                      {tracking.start_location.line2 && (
                        <>, {tracking.start_location.line2}</>
                      )}
                      <br />
                      {tracking.start_location.city}, {tracking.start_location.state}
                      <br />
                      {tracking.start_location.postal_code}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>Delivery Location</span>
                    </div>
                    <p className="text-sm">
                      {tracking.end_location.line1}
                      {tracking.end_location.line2 && (
                        <>, {tracking.end_location.line2}</>
                      )}
                      <br />
                      {tracking.end_location.city}, {tracking.end_location.state}
                      <br />
                      {tracking.end_location.postal_code}
                    </p>
                  </div>
                </div>
                <div>
                  <Badge variant="outline">
                    Status: {tracking.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No tracking information available yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex justify-end gap-2">
        {order.status === 'pending' || order.status === 'processing' ? (
          <>
            <Button
              variant="destructive"
              onClick={() => setShowCancelDialog(true)}
              disabled={cancelling}
            >
              <XCircle className="mr-2 h-4 w-4" />
              {cancelling ? "Cancelling..." : "Cancel Order"}
            </Button>
            <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure you want to cancel this order?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. The order will be cancelled and you will need to place a new order if you wish to purchase these items again.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={cancelling}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleCancelOrder}
                    disabled={cancelling}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {cancelling ? "Cancelling..." : "Yes, cancel order"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        ) : null}
        <Button
          variant="outline"
          onClick={() => navigate('/orders')}
          disabled={cancelling}
        >
          Back to Orders
        </Button>
      </div>
    </div>
  );
};

export default OrderDetails; 