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
  CheckCircle,
  XCircle,
  Edit,
  Eye,
  Trash,
  Star,
  Clock
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Product } from "@/types/product";

// Define product interface with additional fields
interface AdminProduct extends Product {
  id: number;
  created_at: string;
  seller_id: string;
  seller_name?: string;
  status?: 'pending' | 'approved' | 'rejected';
}

const Products = () => {
  const { toast } = useToast();
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedProduct, setSelectedProduct] = useState<AdminProduct | null>(null);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [categories, setCategories] = useState<string[]>([]);

  const productsPerPage = 10;

  // Fetch products from Supabase
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        
        // Get products
        const { data, error } = await supabase
          .from('products')
          .select('*, profiles:seller_id(name)')
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        // Transform data to match our interface
        const transformedProducts: AdminProduct[] = data?.map(product => {
          const sellerProfile = product.profiles as any;
          return {
            id: product.id,
            name: product.name,
            description: product.description,
            price: product.price,
            category: product.category,
            image: product.image,
            perishable: product.perishable,
            expiryDate: product.expiry_date,
            priority: product.priority,
            company: product.company,
            inStock: product.in_stock,
            quantity: product.quantity,
            rating: product.rating,
            sellerId: product.seller_id,
            seller_name: sellerProfile?.name || 'Unknown Seller',
            created_at: product.created_at,
            // Determine status based on in_stock field
            status: product.in_stock ? 'approved' : 'pending'
          };
        }) || [];
        
        setProducts(transformedProducts);
        
        // Extract unique categories
        const uniqueCategories = Array.from(new Set(transformedProducts.map(p => p.category)));
        setCategories(uniqueCategories);
      } catch (error) {
        console.error("Error fetching products:", error);
        toast({
          title: "Error",
          description: "Failed to load products",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, [toast]);

  // Filter products based on search query and filters
  useEffect(() => {
    let result = [...products];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(product => 
        product.name.toLowerCase().includes(query) || 
        product.description.toLowerCase().includes(query) ||
        product.company.toLowerCase().includes(query)
      );
    }
    
    // Apply category filter
    if (categoryFilter !== "all") {
      result = result.filter(product => product.category === categoryFilter);
    }
    
    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter(product => product.status === statusFilter);
    }
    
    setFilteredProducts(result);
    setTotalPages(Math.ceil(result.length / productsPerPage));
    setCurrentPage(1); // Reset to first page when filters change
  }, [products, searchQuery, categoryFilter, statusFilter]);

  // Get current page of products
  const getCurrentPageProducts = () => {
    const startIndex = (currentPage - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    return filteredProducts.slice(startIndex, endIndex);
  };

  // Handle product approval
  const handleApproveProduct = async () => {
    if (!selectedProduct) return;
    
    try {
      const { error } = await supabase
        .from('products')
        .update({ in_stock: true })
        .eq('id', selectedProduct.id);
        
      if (error) throw error;
      
      // Update local state
      setProducts(products.map(product => 
        product.id === selectedProduct.id 
          ? { ...product, inStock: true, status: 'approved' } 
          : product
      ));
      
      toast({
        title: "Success",
        description: "Product approved successfully",
      });
      
      setIsApproveDialogOpen(false);
    } catch (error) {
      console.error("Error approving product:", error);
      toast({
        title: "Error",
        description: "Failed to approve product",
        variant: "destructive"
      });
    }
  };

  // Handle product rejection
  const handleRejectProduct = async () => {
    if (!selectedProduct) return;
    
    try {
      const { error } = await supabase
        .from('products')
        .update({ in_stock: false })
        .eq('id', selectedProduct.id);
        
      if (error) throw error;
      
      // Update local state
      setProducts(products.map(product => 
        product.id === selectedProduct.id 
          ? { ...product, inStock: false, status: 'pending' } 
          : product
      ));
      
      toast({
        title: "Success",
        description: "Product rejected successfully",
      });
      
      setIsRejectDialogOpen(false);
    } catch (error) {
      console.error("Error rejecting product:", error);
      toast({
        title: "Error",
        description: "Failed to reject product",
        variant: "destructive"
      });
    }
  };

  // Handle product deletion
  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;
    
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', selectedProduct.id);
        
      if (error) throw error;
      
      // Update local state
      setProducts(products.filter(product => product.id !== selectedProduct.id));
      
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
      
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error deleting product:", error);
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive"
      });
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Get status badge color
  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500">{status}</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">{status}</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500">{status}</Badge>;
      default:
        return <Badge>{status || 'unknown'}</Badge>;
    }
  };

  // Get priority badge color
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge className="bg-red-500">{priority}</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500">{priority}</Badge>;
      case 'low':
        return <Badge className="bg-blue-500">{priority}</Badge>;
      default:
        return <Badge>{priority}</Badge>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Product Management</h1>
          <p className="text-muted-foreground">
            Manage and approve products
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
              <CardTitle>Products</CardTitle>
              <CardDescription>
                Manage platform products and approvals
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search products..."
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
                  <DropdownMenuLabel>Filter Products</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="p-2">
                    <p className="text-sm font-medium mb-2">Category</p>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map(category => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
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
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No products found matching your criteria.</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Seller</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getCurrentPageProducts().map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>₹{product.price.toFixed(2)}</TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell>{product.seller_name}</TableCell>
                      <TableCell>{getStatusBadge(product.status)}</TableCell>
                      <TableCell>{getPriorityBadge(product.priority)}</TableCell>
                      <TableCell>{formatDate(product.created_at)}</TableCell>
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
                                setSelectedProduct(product);
                                setIsViewDialogOpen(true);
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link to={`/admin/products/edit/${product.id}`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Product
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {product.status === 'pending' ? (
                              <DropdownMenuItem 
                                onClick={() => {
                                  setSelectedProduct(product);
                                  setIsApproveDialogOpen(true);
                                }}
                                className="text-green-500"
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Approve Product
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem 
                                onClick={() => {
                                  setSelectedProduct(product);
                                  setIsRejectDialogOpen(true);
                                }}
                                className="text-yellow-500"
                              >
                                <Clock className="mr-2 h-4 w-4" />
                                Set as Pending
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                              onClick={() => {
                                setSelectedProduct(product);
                                setIsDeleteDialogOpen(true);
                              }}
                              className="text-red-500"
                            >
                              <Trash className="mr-2 h-4 w-4" />
                              Delete Product
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Star className="mr-2 h-4 w-4" />
                              Feature Product
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
            Showing {filteredProducts.length > 0 ? (currentPage - 1) * productsPerPage + 1 : 0} to {Math.min(currentPage * productsPerPage, filteredProducts.length)} of {filteredProducts.length} products
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

      {/* Approve Product Dialog */}
      <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve "{selectedProduct?.name}"?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              This will make the product visible to all users and available for purchase.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApproveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleApproveProduct} className="bg-green-600 hover:bg-green-700">
              Approve Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Product Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Product as Pending</DialogTitle>
            <DialogDescription>
              Are you sure you want to set "{selectedProduct?.name}" as pending?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              This will hide the product from buyers until it is approved again.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRejectProduct} className="bg-yellow-600 hover:bg-yellow-700">
              Set as Pending
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Product Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedProduct?.name}"?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              This action cannot be undone. The product will be permanently removed from the platform.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleDeleteProduct} variant="destructive">
              Delete Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Product Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Product Details</DialogTitle>
            <DialogDescription>
              Detailed information about {selectedProduct?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedProduct && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
              <div>
                <img 
                  src={selectedProduct.image} 
                  alt={selectedProduct.name} 
                  className="w-full h-auto rounded-md object-cover"
                />
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">{selectedProduct.name}</h3>
                  <p className="text-muted-foreground">{selectedProduct.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-sm font-medium">Price</p>
                    <p>₹{selectedProduct.price.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Category</p>
                    <p>{selectedProduct.category}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Company</p>
                    <p>{selectedProduct.company}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Quantity</p>
                    <p>{selectedProduct.quantity}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Priority</p>
                    <p>{getPriorityBadge(selectedProduct.priority)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Status</p>
                    <p>{getStatusBadge(selectedProduct.status)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Perishable</p>
                    <p>{selectedProduct.perishable ? 'Yes' : 'No'}</p>
                  </div>
                  {selectedProduct.perishable && selectedProduct.expiryDate && (
                    <div>
                      <p className="text-sm font-medium">Expiry Date</p>
                      <p>{new Date(selectedProduct.expiryDate).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">Seller</p>
                  <p>{selectedProduct.seller_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Created At</p>
                  <p>{formatDate(selectedProduct.created_at)}</p>
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
    </div>
  );
};

export default Products;
