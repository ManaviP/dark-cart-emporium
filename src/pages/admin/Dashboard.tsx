
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Users, Gift, BarChart3 } from "lucide-react";

const Dashboard = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Platform management and analytics
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="border border-border/40 bg-card/30 backdrop-blur-sm">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <div className="p-3 bg-primary/10 rounded-full mb-4">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="mb-2">User Management</CardTitle>
            <CardDescription className="mb-4">
              Manage users and permissions
            </CardDescription>
            <Button className="w-full" asChild>
              <Link to="/admin/users">Manage Users</Link>
            </Button>
          </CardContent>
        </Card>
        
        <Card className="border border-border/40 bg-card/30 backdrop-blur-sm">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <div className="p-3 bg-primary/10 rounded-full mb-4">
              <Gift className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="mb-2">Donations</CardTitle>
            <CardDescription className="mb-4">
              Manage donation tracking and distribution
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
              Platform usage and sales analytics
            </CardDescription>
            <Button className="w-full" disabled>
              Coming Soon
            </Button>
          </CardContent>
        </Card>
      </div>
      
      <Card className="border border-border/40 bg-card/30 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Admin Overview</CardTitle>
          <CardDescription>
            Platform statistics and performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            Admin dashboard metrics will be available in the next update.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
