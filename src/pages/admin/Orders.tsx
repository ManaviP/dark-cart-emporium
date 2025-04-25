import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  MoreHorizontal, 
  Filter, 
  RefreshCw,
  Eye,
  Truck,
  Ban,
  RotateCcw,
  FileText
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

// Define order interface
interface Order {
  id: string;
  created_at: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total: number;
  address_id: string;
  payment_method: string;
  payment_status: 'pending' | 'paid' | 'failed';
  items?: OrderItem[];
  address?: Address;
}

interface OrderItem {
  id: number;
  product_id: number;
  product_name?: string;
  quantity: number;
  price: number;
}

interface Address {
  id: string;
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

const Orders = () => {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isUpdateStatusDialogOpen, setIsUpdateStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const ordersPerPage = 10;

  // Fetch orders from Supabase
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        
        // Get orders
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        // Get user information for each order
        const ordersWithUserInfo = await Promise.all(data?.map(async (order) => {
          // Get user profile
          const { data: userData, error: userError } = await supabase
            .from('profiles')
            .select('name, email')
            .eq('id', order.user_id)
            .single();
            
          if (userError) {
            console.error("Error fetching user data:", userError);
            return {
              ...order,
              user_name: 'Unknown User',
              user_email: 'unknown@example.com'
            };
          }
          
          // Get order items
          const { data: itemsData, error: itemsError } = await supabase
            .from('order_items')
            .select('*, products:product_id(name)')
            .eq('order_id', order.id);
            
          if (itemsError) {
            console.error("Error fetching order items:", itemsError);
          }
          
          // Get address
          const { data: addressData, error: addressError } = await supabase
            .from('addresses')
            .select('*')
            .eq('id', order.address_id)
            .single();
            
          if (addressError) {
            console.error("Error fetching address:", addressError);
          }
          
          // Transform order items
          const transformedItems = itemsData?.map(item => {
            const product = item.products as any;
            return {
              id: item.id,
              product_id: item.product_id,
              product_name: product?.name || 'Unknown Product',
              quantity: item.quantity,
              price: item.price
            };
          });
          
          return {
            ...order,
            user_name: userData?.name || 'Unknown User',
            user_email: userData?.email || 'unknown@example.com',
            items: transformedItems || [],
            address: addressData || undefined
          };
        }) || []);
        
        setOrders(ordersWithUserInfo);
      } catch (error) {
        console.error("Error fetching orders:", error);
        toast({
          title: "Error",
          description: "Failed to load orders",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrders();
  }, [toast]);

  // Filter orders based on search query and filters
  useEffect(() => {
    let result = [...orders];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(order => 
        order.id.toLowerCase().includes(query) || 
        order.user_name?.toLowerCase().includes(query) ||
        order.user_email?.toLowerCase().includes(query)
      );
    }
    
    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter(order => order.status === statusFilter);
    }
    
    // Apply payment status filter
    if (paymentStatusFilter !== "all") {
      result = result.filter(order => order.payment_status === paymentStatusFilter);
    }
    
    setFilteredOrders(result);
    setTotalPages(Math.ceil(result.length / ordersPerPage));
    setCurrentPage(1); // Reset to first page when filters change
  }, [orders, searchQuery, statusFilter, paymentStatusFilter]);

  // Get current page of orders
  const getCurrentPageOrders = () => {
    const startIndex = (currentPage - 1) * ordersPerPage;
    const endIndex = startIndex + ordersPerPage;
    return filteredOrders.slice(startIndex, endIndex);
  };

  // Handle order status update
  const handleUpdateStatus = async () => {
    if (!selectedOrder || !newStatus) return;
    
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', selectedOrder.id);
        
      if (error) throw error;
      
      // Update local state
      setOrders(orders.map(order => 
        order.id === selectedOrder.id 
          ? { ...order, status: newStatus as any } 
          : order
      ));
      
      // Add to order history
      const { error: historyError } = await supabase
        .from('order_history')
        .insert({
          order_id: selectedOrder.id,
          status_id: getStatusId(newStatus),
          notes: `Status updated to ${newStatus} by admin`,
        });
        
      if (historyError) {
        console.error("Error adding to order history:", historyError);
      }
      
      toast({
        title: "Success",
        description: `Order status updated to ${newStatus}`,
      });
      
      setIsUpdateStatusDialogOpen(false);
    } catch (error) {
      console.error("Error updating order status:", error);
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive"
      });
    }
  };

  // Helper function to get status ID
  const getStatusId = (status: string): number => {
    switch (status) {
      case 'pending': return 1;
      case 'processing': return 2;
      case 'shipped': return 3;
      case 'delivered': return 4;
      case 'cancelled': return 5;
      default: return 1;
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return <Badge className="bg-green-500">{status}</Badge>;
      case 'shipped':
        return <Badge className="bg-blue-500">{status}</Badge>;
      case 'processing':
        return <Badge className="bg-yellow-500">{status}</Badge>;
      case 'pending':
        return <Badge className="bg-orange-500">{status}</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500">{status}</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Get payment status badge color
  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500">{status}</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">{status}</Badge>;
      case 'failed':
        return <Badge className="bg-red-500">{status}</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Order Management</h1>
          <p className="text-muted-foreground">
            Manage customer orders and shipments
          </p>
        </div>
        <div className="flex gap-3 mt-4 md:mt-0">
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button asChild>
            <Link to="/admin">
              Return to Dashboard
            </Link>
          </Button>
        </div>
      </div>

      <Card className="border border-border/40 bg-card/30 backdrop-blur-sm mb-8">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle>Orders</CardTitle>
              <CardDescription>
                View and manage customer orders
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search orders..."
                  className="pl-8 w-full sm:w-[250px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px]">
                  <DropdownMenuLabel>Filter Orders</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="p-2">
                    <p className="text-sm font-medium mb-2">Order Status</p>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="shipped">Shipped</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <DropdownMenuSeparator />
                  <div className="p-2">
                    <p className="text-sm font-medium mb-2">Payment Status</p>
                    <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Payment Status</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="outline" size="icon">
                <FileText className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No orders found matching your criteria.</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getCurrentPageOrders().map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.id.substring(0, 8)}...</TableCell>
                      <TableCell>{order.user_name}</TableCell>
                      <TableCell>{formatDate(order.created_at)}</TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>{getPaymentStatusBadge(order.payment_status)}</TableCell>
                      <TableCell>₹{order.total.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem 
                              onClick={() => {
                                setSelectedOrder(order);
                                setIsViewDialogOpen(true);
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => {
                                setSelectedOrder(order);
                                setNewStatus('processing');
                                setIsUpdateStatusDialogOpen(true);
                              }}
                              disabled={order.status === 'processing' || order.status === 'delivered' || order.status === 'cancelled'}
                            >
                              <RotateCcw className="mr-2 h-4 w-4" />
                              Mark as Processing
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => {
                                setSelectedOrder(order);
                                setNewStatus('shipped');
                                setIsUpdateStatusDialogOpen(true);
                              }}
                              disabled={order.status === 'shipped' || order.status === 'delivered' || order.status === 'cancelled'}
                            >
                              <Truck className="mr-2 h-4 w-4" />
                              Mark as Shipped
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => {
                                setSelectedOrder(order);
                                setNewStatus('delivered');
                                setIsUpdateStatusDialogOpen(true);
                              }}
                              disabled={order.status === 'delivered' || order.status === 'cancelled'}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Mark as Delivered
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => {
                                setSelectedOrder(order);
                                setNewStatus('cancelled');
                                setIsUpdateStatusDialogOpen(true);
                              }}
                              disabled={order.status === 'delivered' || order.status === 'cancelled'}
                              className="text-red-500"
                            >
                              <Ban className="mr-2 h-4 w-4" />
                              Cancel Order
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            Showing {filteredOrders.length > 0 ? (currentPage - 1) * ordersPerPage + 1 : 0} to {Math.min(currentPage * ordersPerPage, filteredOrders.length)} of {filteredOrders.length} orders
          </div>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* View Order Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              Order #{selectedOrder?.id}
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Order Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Order ID:</span>
                      <span>{selectedOrder.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date:</span>
                      <span>{formatDate(selectedOrder.created_at)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <span>{getStatusBadge(selectedOrder.status)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Payment Status:</span>
                      <span>{getPaymentStatusBadge(selectedOrder.payment_status)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Payment Method:</span>
                      <span>{selectedOrder.payment_method}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total:</span>
                      <span className="font-semibold">₹{selectedOrder.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Customer Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name:</span>
                      <span>{selectedOrder.user_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email:</span>
                      <span>{selectedOrder.user_email}</span>
                    </div>
                  </div>
                  
                  {selectedOrder.address && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-1">Shipping Address</h4>
                      <p>{selectedOrder.address.name}</p>
                      <p>{selectedOrder.address.line1}</p>
                      {selectedOrder.address.line2 && <p>{selectedOrder.address.line2}</p>}
                      <p>{selectedOrder.address.city}, {selectedOrder.address.state} {selectedOrder.address.postal_code}</p>
                      <p>{selectedOrder.address.country}</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Order Items</h3>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrder.items?.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.product_name}</TableCell>
                          <TableCell>₹{item.price.toFixed(2)}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell className="text-right">₹{(item.price * item.quantity).toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={isUpdateStatusDialogOpen} onOpenChange={setIsUpdateStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
            <DialogDescription>
              Change the status of order #{selectedOrder?.id}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm font-medium mb-2">New Status</p>
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground mt-4">
              This will update the order status and notify the customer.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUpdateStatusDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateStatus}>
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Missing CheckCircle component
const CheckCircle = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

export default Orders;
