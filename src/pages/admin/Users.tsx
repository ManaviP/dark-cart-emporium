
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  MoreHorizontal,
  UserPlus,
  Filter,
  Download,
  RefreshCw,
  CheckCircle,
  XCircle,
  ShieldAlert,
  UserCog,
  Eye,
  Lock,
  Mail,
  AlertTriangle
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { UserRole } from "@/types/supabase";

// Define user interface
interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  created_at: string;
  last_sign_in_at?: string;
  avatar_url?: string;
  status?: 'active' | 'suspended' | 'banned';
}

const Users = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [isChangeRoleOpen, setIsChangeRoleOpen] = useState(false);
  const [newRole, setNewRole] = useState<UserRole>("buyer");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isUserActivityOpen, setIsUserActivityOpen] = useState(false);
  const [userActivities, setUserActivities] = useState<any[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);

  const usersPerPage = 10;

  // Fetch users from Supabase
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);

        // Get users from profiles table
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Get auth data for last sign in
        const { data: authData, error: authError } = await supabase.auth.admin.listUsers();

        if (authError) {
          console.error("Error fetching auth data:", authError);
          // Continue with profile data only
          setUsers(data || []);
        } else {
          // Combine profile data with auth data
          const combinedData = data?.map(profile => {
            const authUser = authData?.users?.find(u => u.id === profile.id);
            return {
              ...profile,
              last_sign_in_at: authUser?.last_sign_in_at || undefined,
              status: profile.status || 'active'
            };
          }) || [];

          setUsers(combinedData);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
        toast({
          title: "Error",
          description: "Failed to load users",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [toast]);

  // Filter users based on search query and filters
  useEffect(() => {
    let result = [...users];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(user =>
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
      );
    }

    // Apply role filter
    if (roleFilter !== "all") {
      result = result.filter(user => user.role === roleFilter);
    }

    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter(user => user.status === statusFilter);
    }

    setFilteredUsers(result);
    setTotalPages(Math.ceil(result.length / usersPerPage));
    setCurrentPage(1); // Reset to first page when filters change
  }, [users, searchQuery, roleFilter, statusFilter]);

  // Get current page of users
  const getCurrentPageUsers = () => {
    const startIndex = (currentPage - 1) * usersPerPage;
    const endIndex = startIndex + usersPerPage;
    return filteredUsers.slice(startIndex, endIndex);
  };

  // Handle user status change
  const handleStatusChange = async (userId: string, newStatus: 'active' | 'suspended' | 'banned') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', userId);

      if (error) throw error;

      // Update local state
      setUsers(users.map(user =>
        user.id === userId ? { ...user, status: newStatus } : user
      ));

      toast({
        title: "Success",
        description: `User status updated to ${newStatus}`,
      });
    } catch (error) {
      console.error("Error updating user status:", error);
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive"
      });
    }
  };

  // Handle role change
  const handleRoleChange = async () => {
    if (!selectedUser) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', selectedUser.id);

      if (error) throw error;

      // Update local state
      setUsers(users.map(user =>
        user.id === selectedUser.id ? { ...user, role: newRole } : user
      ));

      toast({
        title: "Success",
        description: `User role updated to ${newRole}`,
      });

      setIsChangeRoleOpen(false);
    } catch (error) {
      console.error("Error updating user role:", error);
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive"
      });
    }
  };

  // Handle password reset
  const handlePasswordReset = async () => {
    if (!selectedUser) return;

    try {
      const { error } = await supabase.auth.admin.resetUserPassword(selectedUser.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Password reset email sent to user",
      });

      setIsResetPasswordOpen(false);
    } catch (error) {
      console.error("Error resetting password:", error);
      toast({
        title: "Error",
        description: "Failed to send password reset email",
        variant: "destructive"
      });
    }
  };

  // Fetch user activity logs
  const fetchUserActivity = async (userId: string) => {
    setActivityLoading(true);
    try {
      // Fetch product tracking events
      const { data: trackingData, error: trackingError } = await supabase
        .from('product_tracking')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (trackingError) throw trackingError;

      // Fetch orders
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (orderError) throw orderError;

      // Combine and format activity data
      const activities = [
        ...(trackingData || []).map(event => ({
          type: 'tracking',
          event_type: event.event_type,
          created_at: event.created_at,
          details: event.details
        })),
        ...(orderData || []).map(order => ({
          type: 'order',
          order_id: order.id,
          status: order.status,
          total: order.total,
          created_at: order.created_at
        }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setUserActivities(activities);
    } catch (error) {
      console.error("Error fetching user activity:", error);
      toast({
        title: "Error",
        description: "Failed to load user activity",
        variant: "destructive"
      });
    } finally {
      setActivityLoading(false);
    }
  };

  // View user activity
  const viewUserActivity = (user: User) => {
    setSelectedUser(user);
    setIsUserActivityOpen(true);
    fetchUserActivity(user.id);
  };

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleString();
  };

  // Get status badge color
  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">{status}</Badge>;
      case 'suspended':
        return <Badge className="bg-yellow-500">{status}</Badge>;
      case 'banned':
        return <Badge className="bg-red-500">{status}</Badge>;
      default:
        return <Badge>{status || 'active'}</Badge>;
    }
  };

  // Get role badge color
  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-purple-500">{role}</Badge>;
      case 'seller':
        return <Badge className="bg-blue-500">{role}</Badge>;
      case 'logistics':
        return <Badge className="bg-orange-500">{role}</Badge>;
      case 'buyer':
        return <Badge className="bg-green-500">{role}</Badge>;
      default:
        return <Badge>{role}</Badge>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">User Management</h1>
          <p className="text-muted-foreground">
            Manage platform users and permissions
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
              <CardTitle>Users</CardTitle>
              <CardDescription>
                Manage platform users and their permissions
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search users..."
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
                  <DropdownMenuLabel>Filter Users</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="p-2">
                    <p className="text-sm font-medium mb-2">Role</p>
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="buyer">Buyer</SelectItem>
                        <SelectItem value="seller">Seller</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="logistics">Logistics</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <DropdownMenuSeparator />
                  <div className="p-2">
                    <p className="text-sm font-medium mb-2">Status</p>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                        <SelectItem value="banned">Banned</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="outline" size="icon">
                <Download className="h-4 w-4" />
              </Button>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No users found matching your criteria.</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getCurrentPageUsers().map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>{getStatusBadge(user.status)}</TableCell>
                      <TableCell>{formatDate(user.created_at)}</TableCell>
                      <TableCell>{formatDate(user.last_sign_in_at)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => viewUserActivity(user)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Activity
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(user);
                                setNewRole(user.role);
                                setIsChangeRoleOpen(true);
                              }}
                            >
                              <UserCog className="mr-2 h-4 w-4" />
                              Change Role
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(user);
                                setIsResetPasswordOpen(true);
                              }}
                            >
                              <Lock className="mr-2 h-4 w-4" />
                              Reset Password
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {user.status === 'active' ? (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(user.id, 'suspended')}
                                className="text-yellow-500"
                              >
                                <AlertTriangle className="mr-2 h-4 w-4" />
                                Suspend User
                              </DropdownMenuItem>
                            ) : user.status === 'suspended' ? (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(user.id, 'active')}
                                className="text-green-500"
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Reactivate User
                              </DropdownMenuItem>
                            ) : null}
                            {user.status !== 'banned' ? (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(user.id, 'banned')}
                                className="text-red-500"
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                Ban User
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(user.id, 'active')}
                                className="text-green-500"
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Unban User
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Mail className="mr-2 h-4 w-4" />
                              Send Email
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
            Showing {filteredUsers.length > 0 ? (currentPage - 1) * usersPerPage + 1 : 0} to {Math.min(currentPage * usersPerPage, filteredUsers.length)} of {filteredUsers.length} users
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

      {/* Change Role Dialog */}
      <Dialog open={isChangeRoleOpen} onOpenChange={setIsChangeRoleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Update the role for {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm font-medium mb-2">Select New Role</p>
            <Select value={newRole} onValueChange={(value) => setNewRole(value as UserRole)}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="buyer">Buyer</SelectItem>
                <SelectItem value="seller">Seller</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="logistics">Logistics</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsChangeRoleOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRoleChange}>
              Update Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={isResetPasswordOpen} onOpenChange={setIsResetPasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset User Password</DialogTitle>
            <DialogDescription>
              Send a password reset email to {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              This will send a password reset link to the user's email address. The link will expire after 24 hours.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResetPasswordOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePasswordReset}>
              Send Reset Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Activity Dialog */}
      <Dialog open={isUserActivityOpen} onOpenChange={setIsUserActivityOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>User Activity - {selectedUser?.name}</DialogTitle>
            <DialogDescription>
              Recent activity for {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="all">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All Activity</TabsTrigger>
              <TabsTrigger value="orders">Orders</TabsTrigger>
              <TabsTrigger value="products">Product Views</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="max-h-[400px] overflow-y-auto">
              {activityLoading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : userActivities.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No activity found for this user.</p>
                </div>
              ) : (
                <div className="space-y-4 py-4">
                  {userActivities.map((activity, index) => (
                    <div key={index} className="border rounded-md p-4">
                      <div className="flex justify-between">
                        <div>
                          <p className="font-medium">
                            {activity.type === 'tracking'
                              ? `Product ${activity.event_type}`
                              : `Order ${activity.status}`}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {activity.type === 'order'
                              ? `Order #${activity.order_id} - ₹${activity.total}`
                              : `Product interaction`}
                          </p>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(activity.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
            <TabsContent value="orders" className="max-h-[400px] overflow-y-auto">
              {activityLoading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : userActivities.filter(a => a.type === 'order').length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No orders found for this user.</p>
                </div>
              ) : (
                <div className="space-y-4 py-4">
                  {userActivities
                    .filter(a => a.type === 'order')
                    .map((activity, index) => (
                      <div key={index} className="border rounded-md p-4">
                        <div className="flex justify-between">
                          <div>
                            <p className="font-medium">Order #{activity.order_id}</p>
                            <p className="text-sm text-muted-foreground">
                              Status: {activity.status} - ₹{activity.total}
                            </p>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(activity.created_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </TabsContent>
            <TabsContent value="products" className="max-h-[400px] overflow-y-auto">
              {activityLoading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : userActivities.filter(a => a.type === 'tracking').length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No product activity found for this user.</p>
                </div>
              ) : (
                <div className="space-y-4 py-4">
                  {userActivities
                    .filter(a => a.type === 'tracking')
                    .map((activity, index) => (
                      <div key={index} className="border rounded-md p-4">
                        <div className="flex justify-between">
                          <div>
                            <p className="font-medium">
                              Product {activity.event_type}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {activity.details?.product_name || 'Unknown product'}
                            </p>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(activity.created_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button onClick={() => setIsUserActivityOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Users;
