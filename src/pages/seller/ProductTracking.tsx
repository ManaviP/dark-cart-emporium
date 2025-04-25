import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, ShoppingCart, Gift, ShoppingBag, Loader2, BarChart3 } from "lucide-react";
import { getSellerProducts } from "@/services/productService";
import { getSellerTrackingEvents, getSellerTrackingSummary } from "@/services/trackingService";
import { useToast } from "@/hooks/use-toast";
import { Product } from "@/types/product";

const ProductTracking = () => {
  const [trackingData, setTrackingData] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [selectedProduct, setSelectedProduct] = useState("all");
  const [viewType, setViewType] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch products and tracking data in parallel
        const [productsData, trackingEvents, trackingSummary] = await Promise.all([
          getSellerProducts(),
          getSellerTrackingEvents(),
          getSellerTrackingSummary()
        ]);
        
        setProducts(productsData);
        setTrackingData(trackingEvents);
        setSummary(trackingSummary);
      } catch (err) {
        console.error("Error fetching tracking data:", err);
        setError("Failed to load tracking data. Please try again later.");
        toast({
          title: "Error",
          description: "Failed to load tracking data. Please try again later.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [toast]);

  // Filter tracking data based on selected product and view type
  const filteredData = trackingData.filter(item => {
    if (selectedProduct !== "all" && item.product_id !== parseInt(selectedProduct)) {
      return false;
    }
    
    if (viewType !== "all" && item.event_type !== viewType) {
      return false;
    }
    
    return true;
  });

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading tracking data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-6">
            <p>{error}</p>
          </div>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Product Tracking</h1>
          <p className="text-muted-foreground">
            Monitor how customers interact with your products
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Views</CardDescription>
            <CardTitle className="text-2xl">{summary?.summary?.views || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Added to Cart</CardDescription>
            <CardTitle className="text-2xl">{summary?.summary?.carts || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Purchases</CardDescription>
            <CardTitle className="text-2xl">{summary?.summary?.purchases || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Donations</CardDescription>
            <CardTitle className="text-2xl">{summary?.summary?.donations || 0}</CardTitle>
          </CardHeader>
        </Card>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="w-full md:w-1/2">
          <Select value={selectedProduct} onValueChange={setSelectedProduct}>
            <SelectTrigger>
              <SelectValue placeholder="Select product" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Products</SelectItem>
              {products.map(product => (
                <SelectItem key={product.id} value={product.id.toString()}>
                  {product.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="w-full md:w-1/2">
          <Select value={viewType} onValueChange={setViewType}>
            <SelectTrigger>
              <SelectValue placeholder="Select view type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="view">Views</SelectItem>
              <SelectItem value="cart">Added to Cart</SelectItem>
              <SelectItem value="donation">Donations</SelectItem>
              <SelectItem value="purchase">Purchases</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="details">Detailed Activity</TabsTrigger>
        </TabsList>
        
        <TabsContent value="summary">
          <Card>
            <CardHeader>
              <CardTitle>Product Performance Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {summary?.products?.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-center">Views</TableHead>
                      <TableHead className="text-center">Cart Adds</TableHead>
                      <TableHead className="text-center">Donations</TableHead>
                      <TableHead className="text-center">Purchases</TableHead>
                      <TableHead className="text-center">Conversion Rate</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {summary.products.map((product: any) => {
                      const conversionRate = product.views > 0 
                        ? ((product.carts + product.purchases) / product.views * 100).toFixed(1) 
                        : '0';
                      
                      return (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell className="text-center">{product.views}</TableCell>
                          <TableCell className="text-center">{product.carts}</TableCell>
                          <TableCell className="text-center">{product.donations}</TableCell>
                          <TableCell className="text-center">{product.purchases}</TableCell>
                          <TableCell className="text-center">{conversionRate}%</TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => navigate(`/seller/products/edit/${product.id}`)}
                            >
                              View Product
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p>No tracking data available yet.</p>
                  <p className="text-sm mt-1">Add products and start selling to see performance metrics.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Activity Log</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredData.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.map(item => (
                      <TableRow key={item.id}>
                        <TableCell>
                          {new Date(item.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell className="font-medium">
                          {item.products?.name || 'Unknown Product'}
                        </TableCell>
                        <TableCell>
                          <Badge className={
                            item.event_type === 'view' ? 'bg-blue-500/10 text-blue-500' :
                            item.event_type === 'cart' ? 'bg-orange-500/10 text-orange-500' :
                            item.event_type === 'donation' ? 'bg-green-500/10 text-green-500' :
                            'bg-purple-500/10 text-purple-500'
                          }>
                            {item.event_type === 'view' && <Eye className="mr-1 h-3 w-3" />}
                            {item.event_type === 'cart' && <ShoppingCart className="mr-1 h-3 w-3" />}
                            {item.event_type === 'donation' && <Gift className="mr-1 h-3 w-3" />}
                            {item.event_type === 'purchase' && <ShoppingBag className="mr-1 h-3 w-3" />}
                            {item.event_type.charAt(0).toUpperCase() + item.event_type.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {item.user_id ? 'Registered User' : 'Anonymous'}
                        </TableCell>
                        <TableCell>
                          {item.details?.quantity && `Quantity: ${item.details.quantity}`}
                          {item.details?.value && `, Value: ₹${item.details.value.toFixed(2)}`}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Eye className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p>No activity data found for the selected filters.</p>
                  <p className="text-sm mt-1">Try selecting different filters or check back later.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProductTracking;
