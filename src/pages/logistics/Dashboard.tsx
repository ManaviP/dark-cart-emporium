
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, Truck } from "lucide-react";
import { Link } from "react-router-dom";

const Dashboard = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Logistics Dashboard</h1>
          <p className="text-muted-foreground">
            Manage deliveries and shipping operations
          </p>
        </div>
        <Button className="mt-4 md:mt-0" asChild>
          <Link to="/logistics/orders">
            <Truck className="mr-2 h-4 w-4" />
            Manage Deliveries
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="border border-border/40 bg-card/30 backdrop-blur-sm">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <div className="p-3 bg-primary/10 rounded-full mb-4">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="mb-2">Pending Deliveries</CardTitle>
            <CardDescription className="mb-4">
              Orders waiting to be delivered
            </CardDescription>
            <div className="text-3xl font-bold">12</div>
          </CardContent>
        </Card>
        
        <Card className="border border-border/40 bg-card/30 backdrop-blur-sm">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <div className="p-3 bg-primary/10 rounded-full mb-4">
              <Truck className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="mb-2">Out for Delivery</CardTitle>
            <CardDescription className="mb-4">
              Orders currently in transit
            </CardDescription>
            <div className="text-3xl font-bold">8</div>
          </CardContent>
        </Card>
      </div>
      
      <Card className="border border-border/40 bg-card/30 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Logistics Overview</CardTitle>
          <CardDescription>
            Delivery metrics and performance
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            Logistics dashboard details will be available in the next update.
          </p>
          <Button variant="outline" asChild>
            <Link to="/logistics/orders">View Active Deliveries</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
