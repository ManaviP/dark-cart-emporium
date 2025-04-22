
import { useAuth } from "@/context/auth-context";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, LineChart, ShoppingBag, Package, DollarSign, TrendingUp, ShoppingCart, Gift } from "lucide-react";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const { user } = useAuth();

  // Mock stats data
  const stats = {
    totalSales: 4578.25,
    totalOrders: 67,
    totalProducts: 32,
    donatedItems: 12,
    revenueByMonth: [
      { month: "Jan", revenue: 2100 },
      { month: "Feb", revenue: 2400 },
      { month: "Mar", revenue: 1800 },
      { month: "Apr", revenue: 2900 },
      { month: "May", revenue: 3100 },
      { month: "Jun", revenue: 2800 },
    ],
    topProducts: [
      { name: "Premium Headphones", sales: 24, revenue: 3839.76 },
      { name: "Denim Jacket", sales: 18, revenue: 1259.82 },
      { name: "Wireless Earbuds", sales: 12, revenue: 1079.88 },
    ],
    recentOrders: [
      { id: "ORD-5678", date: "2023-05-01", status: "delivered", items: 2, total: 169.98 },
      { id: "ORD-6789", date: "2023-04-28", status: "processing", items: 1, total: 59.99 },
      { id: "ORD-7890", date: "2023-04-25", status: "delivered", items: 3, total: 149.97 },
    ],
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl animate-in">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Seller Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.name}. Here's an overview of your store performance.
          </p>
        </div>
        <div className="flex gap-3 mt-4 md:mt-0">
          <Button variant="outline" asChild>
            <Link to="/seller/products">
              <ShoppingBag className="mr-2 h-4 w-4" />
              Manage Products
            </Link>
          </Button>
          <Button asChild>
            <Link to="/seller/orders">
              <Package className="mr-2 h-4 w-4" />
              View Orders
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="border border-border/40 bg-card/30 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Sales</p>
                <h4 className="text-2xl font-bold mt-1">${stats.totalSales.toFixed(2)}</h4>
              </div>
              <div className="p-2 rounded-full bg-primary/10">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              <span className="text-green-500 font-medium">+12.5%</span>
              <span className="ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border border-border/40 bg-card/30 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                <h4 className="text-2xl font-bold mt-1">{stats.totalOrders}</h4>
              </div>
              <div className="p-2 rounded-full bg-primary/10">
                <ShoppingCart className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              <span className="text-green-500 font-medium">+8.2%</span>
              <span className="ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border border-border/40 bg-card/30 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Products</p>
                <h4 className="text-2xl font-bold mt-1">{stats.totalProducts}</h4>
              </div>
              <div className="p-2 rounded-full bg-primary/10">
                <ShoppingBag className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-muted-foreground">
              <span>In stock and ready to sell</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border border-border/40 bg-card/30 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Donated Items</p>
                <h4 className="text-2xl font-bold mt-1">{stats.donatedItems}</h4>
              </div>
              <div className="p-2 rounded-full bg-primary/10">
                <Gift className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-muted-foreground">
              <span>Thanks for supporting the community</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 md:w-auto md:inline-flex">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="products">Top Products</TabsTrigger>
          <TabsTrigger value="orders">Recent Orders</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <Card className="border border-border/40 bg-card/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Revenue Overview</CardTitle>
              <CardDescription>
                Your monthly revenue performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80 flex items-center justify-center border rounded-md p-6">
                <div className="flex flex-col gap-1 w-full">
                  <div className="flex justify-between text-sm font-medium mb-6">
                    <span>Monthly Revenue</span>
                    <span>Last 6 months</span>
                  </div>
                  
                  <div className="relative h-60">
                    <div className="flex h-full items-end gap-2">
                      {stats.revenueByMonth.map((item, i) => (
                        <div key={i} className="relative flex-1 group">
                          <div 
                            className="w-full bg-primary/20 rounded-t-sm hover:bg-primary/30 transition-all"
                            style={{ height: `${(item.revenue / 3500) * 100}%` }}
                          ></div>
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 rounded bg-muted text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                            ${item.revenue}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="absolute left-0 right-0 bottom-0 flex justify-between text-xs text-muted-foreground">
                      {stats.revenueByMonth.map((item, i) => (
                        <div key={i} className="flex-1 text-center">
                          {item.month}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="products">
          <Card className="border border-border/40 bg-card/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Top Selling Products</CardTitle>
              <CardDescription>
                Your best performing products by revenue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {stats.topProducts.map((product, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground font-medium w-6">{i + 1}</span>
                      <div>
                        <h4 className="font-medium">{product.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {product.sales} units sold
                        </p>
                      </div>
                    </div>
                    <span className="font-medium">${product.revenue.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" asChild>
                <Link to="/seller/products">View All Products</Link>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="orders">
          <Card className="border border-border/40 bg-card/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>
                Your latest customer orders
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.recentOrders.map((order, i) => (
                  <div 
                    key={i} 
                    className="flex items-center justify-between p-3 rounded-md border border-border/40 bg-muted/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-primary/10">
                        <Package className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium">{order.id}</h4>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`text-xs px-2 py-1 rounded-full
                        ${order.status === 'delivered' ? 'bg-green-500/10 text-green-500' : ''}
                        ${order.status === 'processing' ? 'bg-blue-500/10 text-blue-500' : ''}
                      `}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                      <div className="text-right">
                        <p className="font-medium">${order.total.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">{order.items} items</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" asChild>
                <Link to="/seller/orders">View All Orders</Link>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
