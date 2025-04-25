
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Users, Gift, BarChart3, ShoppingBag, Package, CreditCard,
  Bell, Shield, Settings, FileText, TrendingUp, DollarSign
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalDonations: 0,
    totalRevenue: 0,
    pendingApprovals: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);

        // Fetch user count
        const { count: userCount, error: userError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        if (userError) throw userError;

        // Fetch product count
        const { count: productCount, error: productError } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true });

        if (productError) throw productError;

        // Fetch order count
        const { count: orderCount, error: orderError } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true });

        if (orderError) throw orderError;

        // Fetch donation count
        const { count: donationCount, error: donationError } = await supabase
          .from('donations')
          .select('*', { count: 'exact', head: true });

        if (donationError) throw donationError;

        // Calculate total revenue
        const { data: orders, error: revenueError } = await supabase
          .from('orders')
          .select('total')
          .eq('payment_status', 'paid');

        if (revenueError) throw revenueError;

        const totalRevenue = orders?.reduce((sum, order) => sum + order.total, 0) || 0;

        // Count pending product approvals (products with in_stock = false)
        const { count: pendingCount, error: pendingError } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('in_stock', false);

        if (pendingError) throw pendingError;

        setStats({
          totalUsers: userCount || 0,
          totalProducts: productCount || 0,
          totalOrders: orderCount || 0,
          totalDonations: donationCount || 0,
          totalRevenue: totalRevenue,
          pendingApprovals: pendingCount || 0
        });
      } catch (error) {
        console.error("Error fetching admin stats:", error);
        toast({
          title: "Error",
          description: "Failed to load dashboard statistics",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [toast]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Platform management and analytics
          </p>
        </div>
        <div className="flex gap-3 mt-4 md:mt-0">
          <Button variant="outline" asChild>
            <Link to="/admin/reports">
              <FileText className="mr-2 h-4 w-4" />
              Reports
            </Link>
          </Button>
          <Button asChild>
            <Link to="/admin/settings">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="border border-border/40 bg-card/30 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <h4 className="text-2xl font-bold mt-1">{loading ? "..." : stats.totalUsers}</h4>
              </div>
              <div className="p-2 rounded-full bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              <span className="text-green-500 font-medium">Active platform users</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/40 bg-card/30 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Products</p>
                <h4 className="text-2xl font-bold mt-1">{loading ? "..." : stats.totalProducts}</h4>
              </div>
              <div className="p-2 rounded-full bg-primary/10">
                <ShoppingBag className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-muted-foreground">
              <span>{loading ? "" : stats.pendingApprovals} pending approvals</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/40 bg-card/30 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                <h4 className="text-2xl font-bold mt-1">{loading ? "..." : stats.totalOrders}</h4>
              </div>
              <div className="p-2 rounded-full bg-primary/10">
                <Package className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-muted-foreground">
              <span>Processed through the platform</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/40 bg-card/30 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <h4 className="text-2xl font-bold mt-1">₹{loading ? "..." : stats.totalRevenue.toFixed(2)}</h4>
              </div>
              <div className="p-2 rounded-full bg-primary/10">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-muted-foreground">
              <span>Platform-wide sales</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="border border-border/40 bg-card/30 backdrop-blur-sm">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <div className="p-3 bg-primary/10 rounded-full mb-4">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="mb-2">User Management</CardTitle>
            <CardDescription className="mb-4">
              Manage users, roles, and permissions
            </CardDescription>
            <Button className="w-full" asChild>
              <Link to="/admin/users">Manage Users</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border border-border/40 bg-card/30 backdrop-blur-sm">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <div className="p-3 bg-primary/10 rounded-full mb-4">
              <ShoppingBag className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="mb-2">Products</CardTitle>
            <CardDescription className="mb-4">
              Manage products, approvals, and categories
            </CardDescription>
            <Button className="w-full" asChild>
              <Link to="/admin/products">Manage Products</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border border-border/40 bg-card/30 backdrop-blur-sm">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <div className="p-3 bg-primary/10 rounded-full mb-4">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="mb-2">Orders</CardTitle>
            <CardDescription className="mb-4">
              View and manage customer orders
            </CardDescription>
            <Button className="w-full" asChild>
              <Link to="/admin/orders">Manage Orders</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="border border-border/40 bg-card/30 backdrop-blur-sm">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <div className="p-3 bg-primary/10 rounded-full mb-4">
              <Gift className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="mb-2">Donations</CardTitle>
            <CardDescription className="mb-4">
              Track donations
            </CardDescription>
            <Button className="w-full" asChild>
              <Link to="/admin/donations">View Donations</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border border-border/40 bg-card/30 backdrop-blur-sm">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <div className="p-3 bg-primary/10 rounded-full mb-4">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="mb-2">Analytics</CardTitle>
            <CardDescription className="mb-4">
              Sales and usage reports
            </CardDescription>
            <Button className="w-full" asChild>
              <Link to="/admin/analytics">View Analytics</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border border-border/40 bg-card/30 backdrop-blur-sm">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <div className="p-3 bg-primary/10 rounded-full mb-4">
              <CreditCard className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="mb-2">Payments</CardTitle>
            <CardDescription className="mb-4">
              Manage payments and refunds
            </CardDescription>
            <Button className="w-full" asChild>
              <Link to="/admin/payments">View Payments</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border border-border/40 bg-card/30 backdrop-blur-sm">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <div className="p-3 bg-primary/10 rounded-full mb-4">
              <Bell className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="mb-2">Notifications</CardTitle>
            <CardDescription className="mb-4">
              Send announcements and alerts
            </CardDescription>
            <Button className="w-full" asChild>
              <Link to="/admin/notifications">Manage Notifications</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Additional Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="border border-border/40 bg-card/30 backdrop-blur-sm">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <div className="p-3 bg-primary/10 rounded-full mb-4">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="mb-2">Security</CardTitle>
            <CardDescription className="mb-4">
              Manage security settings and logs
            </CardDescription>
            <Button className="w-full" asChild>
              <Link to="/admin/security">Security Settings</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border border-border/40 bg-card/30 backdrop-blur-sm">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <div className="p-3 bg-primary/10 rounded-full mb-4">
              <Settings className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="mb-2">Site Settings</CardTitle>
            <CardDescription className="mb-4">
              Configure platform settings
            </CardDescription>
            <Button className="w-full" asChild>
              <Link to="/admin/settings">Site Configuration</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border border-border/40 bg-card/30 backdrop-blur-sm">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <div className="p-3 bg-primary/10 rounded-full mb-4">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="mb-2">Content</CardTitle>
            <CardDescription className="mb-4">
              Manage site content and pages
            </CardDescription>
            <Button className="w-full" asChild>
              <Link to="/admin/content">Manage Content</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
