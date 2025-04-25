import { useState, useEffect } from "react";
import { getUserOrders, Order, OrderItem } from "@/services/orderService";
import { Button } from "@/components/ui/button";

export const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const buyerOrders = await getUserOrders();
      setOrders(buyerOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {orders.length === 0 ? (
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold mb-2">No orders yet</h2>
          <p className="text-gray-500">Your orders will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <span className="text-sm text-gray-500">Order #{order.id}</span>
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleDateString()}
                  </div>
                  <div className="font-semibold">
                    ${order.total.toFixed(2)}
                  </div>
                </div>
              </div>
              {order.items && (
                <div className="space-y-2">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex items-center space-x-4">
                      <div className="flex-1">
                        <h3 className="font-medium">{item.product_name}</h3>
                        <p className="text-sm text-gray-500">
                          Quantity: {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4 flex justify-end space-x-2">
                <Button variant="outline">View Details</Button>
                {order.status === 'pending' && (
                  <Button variant="destructive">Cancel Order</Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}; 