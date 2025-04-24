
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Search,
  Edit,
  Trash,
  Gift,
  ShoppingBag,
  Calendar,
  AlertTriangle,
  X,
  Package
} from "lucide-react";
import { getSellerProducts, deleteProduct } from "@/services/productService";
import { Product } from "@/types/product";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const Products = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await getSellerProducts();
        setProducts(data);
      } catch (error) {
        console.error("Error fetching products:", error);
        toast({
          title: "Error",
          description: "Failed to load products. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [toast]);

  // Filter products based on search term
  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle product deletion
  const handleDeleteProduct = async () => {
    if (!productToDelete) return;

    try {
      await deleteProduct(productToDelete.id);
      setProducts(products.filter((p) => p.id !== productToDelete.id));
      toast({
        description: `${productToDelete.name} has been deleted.`,
      });
    } catch (error) {
      console.error("Error deleting product:", error);
      toast({
        title: "Error",
        description: "Failed to delete product. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProductToDelete(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Manage Products</h1>
          <p className="text-muted-foreground">
            Add, edit, and manage your product listings
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-3">
          <Button onClick={() => navigate("/seller/products/add")}>
            <Plus className="mr-2 h-4 w-4" />
            Add New Product
          </Button>
          <Button variant="outline" onClick={() => navigate("/seller/products/donate")}>
            <Gift className="mr-2 h-4 w-4" />
            Donate Product
          </Button>
        </div>
      </div>

      <Card className="border border-border/40 bg-card/30 backdrop-blur-sm mb-8">
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>My Products</CardTitle>
              <CardDescription>
                Manage your product inventory
              </CardDescription>
            </div>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1 h-8 w-8"
                  onClick={() => setSearchTerm("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading products...</p>
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <Card
                  key={product.id}
                  className="overflow-hidden group border border-border/40 bg-card/30 backdrop-blur-sm relative"
                >
                  <div className="aspect-square overflow-hidden relative">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="object-cover w-full h-full transition-transform group-hover:scale-105"
                    />
                    {!product.inStock && (
                      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
                        <Badge variant="destructive" className="text-sm py-1 px-3">Out of Stock</Badge>
                      </div>
                    )}
                    <div className="absolute top-2 right-2 space-y-2">
                      {product.perishable && (
                        <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                          Perishable
                        </Badge>
                      )}
                      <Badge className={`
                        ${product.priority === 'low' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : ''}
                        ${product.priority === 'medium' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' : ''}
                        ${product.priority === 'high' ? 'bg-red-500/10 text-red-500 border-red-500/20' : ''}
                      `}>
                        {product.priority.charAt(0).toUpperCase() + product.priority.slice(1)} Priority
                      </Badge>
                    </div>
                  </div>
                  <CardHeader className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <CardTitle className="text-lg">{product.name}</CardTitle>
                      <p className="font-bold text-lg">₹{product.price.toFixed(2)}</p>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
                  </CardHeader>
                  <CardContent className="px-4 py-0">
                    <div className="flex flex-wrap gap-2 mb-3">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Package className="h-3 w-3" />
                        <span>Qty: {product.quantity}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <ShoppingBag className="h-3 w-3" />
                        <span>{product.category}</span>
                      </div>
                      {product.expiryDate && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>Expires: {product.expiryDate}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 pt-0 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => navigate(`/seller/products/edit/${product.id}`)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => navigate(`/seller/products/donate/${product.id}`)}
                    >
                      <Gift className="mr-2 h-4 w-4" />
                      Donate
                    </Button>
                    <AlertDialog open={productToDelete?.id === product.id} onOpenChange={(open) => {
                      if (!open) setProductToDelete(null);
                    }}>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="flex-none"
                          onClick={() => setProductToDelete(product)}
                        >
                          <Trash className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Product</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{product.name}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDeleteProduct}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="rounded-full bg-primary/10 p-3 mb-4 mx-auto w-fit">
                <AlertTriangle className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-medium mb-2">
                {searchTerm ? "No matching products found" : "No products found"}
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm
                  ? "Try adjusting your search criteria"
                  : "You haven't added any products yet"}
              </p>
              {searchTerm ? (
                <Button variant="outline" onClick={() => setSearchTerm("")}>Clear Search</Button>
              ) : (
                <Button onClick={() => navigate("/seller/products/add")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Product
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Products;
