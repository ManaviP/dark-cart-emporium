
import { useAuth } from "@/context/auth-context";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, Truck, Clock, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const { user } = useAuth();

  // Mock orders data - would come from API in real app
  const orders = [
    {
      id: "ORD-1234",
      date: "2023-04-15",
      status: "delivered",
      items: 3,
      total: 129.99
    },
    {
      id: "ORD-2345",
      date: "2023-04-10",
      status: "in_transit",
      items: 1,
      total: 49.99
    },
    {
      id: "ORD-3456",
      date: "2023-04-05",
      status: "processing",
      items: 2,
      total: 84.50
    }
  ];

  // Status icon mapping
  const statusIcons = {
    processing: <Clock className="h-4 w-4" />,
    in_transit: <Truck className="h-4 w-4" />,
    delivered: <CheckCircle className="h-4 w-4" />
  };

  // Status label mapping
  const statusLabels = {
    processing: "Processing",
    in_transit: "In Transit",
    delivered: "Delivered"
  };

  // Status color mapping
  const statusColors: Record<string, string> = {
    processing: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    in_transit: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    delivered: "bg-green-500/10 text-green-500 border-green-500/20"
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl animate-in">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.name}. Here's an overview of your recent orders.
          </p>
        </div>
        <Button className="mt-4 md:mt-0" asChild>
          <Link to="/products">Shop Now</Link>
        </Button>
      </div>

      <div className="grid gap-6">
        <Card className="border border-border/40 bg-card/30 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Track and manage your orders</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {orders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-muted/30">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-full bg-primary/10">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{order.id}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge className={`flex items-center gap-1 ${statusColors[order.status]}`} variant="outline">
                    {statusIcons[order.status as keyof typeof statusIcons]}
                    {statusLabels[order.status as keyof typeof statusLabels]}
                  </Badge>
                  <div className="text-right">
                    <p className="font-medium">₹{order.total.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">{order.items} items</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" asChild>
              <Link to="/orders">View All Orders</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
