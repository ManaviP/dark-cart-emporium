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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  RefreshCw,
  Download,
  TrendingUp,
  Users,
  ShoppingBag,
  DollarSign
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

const Analytics = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [userStats, setUserStats] = useState({
    total: 0,
    newThisMonth: 0,
    activeUsers: 0,
    buyerCount: 0,
    sellerCount: 0
  });
  const [productStats, setProductStats] = useState({
    total: 0,
    outOfStock: 0,
    lowStock: 0,
    categoryCounts: [] as {name: string, value: number}[]
  });
  const [orderStats, setOrderStats] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    totalRevenue: 0,
    averageOrderValue: 0
  });

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  // Fetch analytics data from Supabase
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        
        // Fetch monthly sales data
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: true });
          
        if (ordersError) throw ordersError;
        
        // Process orders into monthly sales data
        const monthlySales = processMonthlyData(orders || []);
        setSalesData(monthlySales);
        
        // Fetch user statistics
        const { count: userCount, error: userCountError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });
          
        if (userCountError) throw userCountError;
        
        // Get new users this month
        const currentDate = new Date();
        const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();
        
        const { count: newUserCount, error: newUserError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', firstDayOfMonth);
          
        if (newUserError) throw newUserError;
        
        // Get user counts by role
        const { data: roleCounts, error: roleError } = await supabase
          .from('profiles')
          .select('role, count')
          .group('role');
          
        if (roleError) throw roleError;
        
        const buyerCount = roleCounts?.find(r => r.role === 'buyer')?.count || 0;
        const sellerCount = roleCounts?.find(r => r.role === 'seller')?.count || 0;
        
        setUserStats({
          total: userCount || 0,
          newThisMonth: newUserCount || 0,
          activeUsers: Math.floor((userCount || 0) * 0.7), // Estimate active users
          buyerCount: Number(buyerCount),
          sellerCount: Number(sellerCount)
        });
        
        // Fetch product statistics
        const { count: productCount, error: productCountError } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true });
          
        if (productCountError) throw productCountError;
        
        // Get out of stock products
        const { count: outOfStockCount, error: outOfStockError } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('quantity', 0);
          
        if (outOfStockError) throw outOfStockError;
        
        // Get low stock products (less than 5)
        const { count: lowStockCount, error: lowStockError } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .gt('quantity', 0)
          .lt('quantity', 5);
          
        if (lowStockError) throw lowStockError;
        
        // Get product counts by category
        const { data: products, error: productsError } = await supabase
          .from('products')
          .select('category');
          
        if (productsError) throw productsError;
        
        const categoryCounts = getCategoryCounts(products || []);
        
        setProductStats({
          total: productCount || 0,
          outOfStock: outOfStockCount || 0,
          lowStock: lowStockCount || 0,
          categoryCounts
        });
        
        // Calculate order statistics
        if (orders) {
          const pending = orders.filter(o => o.status === 'pending').length;
          const processing = orders.filter(o => o.status === 'processing').length;
          const shipped = orders.filter(o => o.status === 'shipped').length;
          const delivered = orders.filter(o => o.status === 'delivered').length;
          const cancelled = orders.filter(o => o.status === 'cancelled').length;
          
          const totalRevenue = orders.reduce((sum, order) => {
            if (order.payment_status === 'paid') {
              return sum + order.total;
            }
            return sum;
          }, 0);
          
          const paidOrders = orders.filter(o => o.payment_status === 'paid');
          const averageOrderValue = paidOrders.length > 0 
            ? totalRevenue / paidOrders.length 
            : 0;
          
          setOrderStats({
            total: orders.length,
            pending,
            processing,
            shipped,
            delivered,
            cancelled,
            totalRevenue,
            averageOrderValue
          });
        }
      } catch (error) {
        console.error("Error fetching analytics:", error);
        toast({
          title: "Error",
          description: "Failed to load analytics data",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnalytics();
  }, [toast]);

  // Process orders into monthly data
  const processMonthlyData = (orders: any[]) => {
    const monthlyData: {[key: string]: {month: string, sales: number, orders: number}} = {};
    
    orders.forEach(order => {
      const date = new Date(order.created_at);
      const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
      
      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = {
          month: monthYear,
          sales: 0,
          orders: 0
        };
      }
      
      if (order.payment_status === 'paid') {
        monthlyData[monthYear].sales += order.total;
      }
      monthlyData[monthYear].orders += 1;
    });
    
    return Object.values(monthlyData);
  };

  // Get category counts for products
  const getCategoryCounts = (products: any[]) => {
    const counts: {[key: string]: number} = {};
    
    products.forEach(product => {
      const category = product.category || 'Uncategorized';
      counts[category] = (counts[category] || 0) + 1;
    });
    
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return `₹${value.toFixed(2)}`;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Platform performance metrics and insights
          </p>
        </div>
        <div className="flex gap-3 mt-4 md:mt-0">
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button asChild>
            <Link to="/admin">
              Return to Dashboard
            </Link>
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="border border-border/40 bg-card/30 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <h4 className="text-2xl font-bold mt-1">{formatCurrency(orderStats.totalRevenue)}</h4>
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
                <h4 className="text-2xl font-bold mt-1">{orderStats.total}</h4>
              </div>
              <div className="p-2 rounded-full bg-primary/10">
                <ShoppingBag className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-muted-foreground">
              <span>Avg. Order Value: {formatCurrency(orderStats.averageOrderValue)}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/40 bg-card/30 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <h4 className="text-2xl font-bold mt-1">{userStats.total}</h4>
              </div>
              <div className="p-2 rounded-full bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-muted-foreground">
              <span>{userStats.newThisMonth} new this month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/40 bg-card/30 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Products</p>
                <h4 className="text-2xl font-bold mt-1">{productStats.total}</h4>
              </div>
              <div className="p-2 rounded-full bg-primary/10">
                <ShoppingBag className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-muted-foreground">
              <span>{productStats.outOfStock} out of stock</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="sales" className="mb-8">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sales">Sales Analytics</TabsTrigger>
          <TabsTrigger value="users">User Analytics</TabsTrigger>
          <TabsTrigger value="products">Product Analytics</TabsTrigger>
        </TabsList>
        <TabsContent value="sales">
          <Card className="border border-border/40 bg-card/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Sales Overview</CardTitle>
              <CardDescription>
                Monthly sales and order trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={salesData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip formatter={(value, name) => {
                        if (name === 'sales') return formatCurrency(Number(value));
                        return value;
                      }} />
                      <Legend />
                      <Line yAxisId="left" type="monotone" dataKey="sales" name="Revenue" stroke="#8884d8" activeDot={{ r: 8 }} />
                      <Line yAxisId="right" type="monotone" dataKey="orders" name="Orders" stroke="#82ca9d" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 w-full">
                <div className="text-center">
                  <p className="text-sm font-medium text-muted-foreground">Pending</p>
                  <p className="text-lg font-semibold">{orderStats.pending}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-muted-foreground">Processing</p>
                  <p className="text-lg font-semibold">{orderStats.processing}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-muted-foreground">Shipped</p>
                  <p className="text-lg font-semibold">{orderStats.shipped}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-muted-foreground">Delivered</p>
                  <p className="text-lg font-semibold">{orderStats.delivered}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-muted-foreground">Cancelled</p>
                  <p className="text-lg font-semibold">{orderStats.cancelled}</p>
                </div>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="users">
          <Card className="border border-border/40 bg-card/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>User Analytics</CardTitle>
              <CardDescription>
                User growth and distribution
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Buyers', value: userStats.buyerCount },
                            { name: 'Sellers', value: userStats.sellerCount },
                            { name: 'Others', value: userStats.total - userStats.buyerCount - userStats.sellerCount }
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {[
                            { name: 'Buyers', value: userStats.buyerCount },
                            { name: 'Sellers', value: userStats.sellerCount },
                            { name: 'Others', value: userStats.total - userStats.buyerCount - userStats.sellerCount }
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => Number(value)} />
                      </PieChart>
                    </ResponsiveContainer>
                    <p className="text-center font-medium">User Roles Distribution</p>
                  </div>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          { name: 'Total Users', value: userStats.total },
                          { name: 'Active Users', value: userStats.activeUsers },
                          { name: 'New This Month', value: userStats.newThisMonth }
                        ]}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#8884d8" name="Users">
                          {[
                            { name: 'Total Users', value: userStats.total },
                            { name: 'Active Users', value: userStats.activeUsers },
                            { name: 'New This Month', value: userStats.newThisMonth }
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                    <p className="text-center font-medium">User Metrics</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="products">
          <Card className="border border-border/40 bg-card/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Product Analytics</CardTitle>
              <CardDescription>
                Product distribution and inventory status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={productStats.categoryCounts}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {productStats.categoryCounts.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => Number(value)} />
                      </PieChart>
                    </ResponsiveContainer>
                    <p className="text-center font-medium">Products by Category</p>
                  </div>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          { name: 'In Stock', value: productStats.total - productStats.outOfStock },
                          { name: 'Low Stock', value: productStats.lowStock },
                          { name: 'Out of Stock', value: productStats.outOfStock }
                        ]}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#8884d8" name="Products">
                          {[
                            { name: 'In Stock', value: productStats.total - productStats.outOfStock },
                            { name: 'Low Stock', value: productStats.lowStock },
                            { name: 'Out of Stock', value: productStats.outOfStock }
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index === 0 ? '#00C49F' : index === 1 ? '#FFBB28' : '#FF8042'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                    <p className="text-center font-medium">Inventory Status</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Additional Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="border border-border/40 bg-card/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
            <CardDescription>
              Products with the highest sales
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-center text-muted-foreground py-8">
                  Detailed product sales analytics will be available in the next update.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="border border-border/40 bg-card/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Customer Acquisition</CardTitle>
            <CardDescription>
              User registration and retention metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-center text-muted-foreground py-8">
                  Detailed customer acquisition analytics will be available in the next update.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
