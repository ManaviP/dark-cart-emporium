import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ShoppingCart,
  Filter,
  SlidersHorizontal,
  Search,
  X,
  Loader2
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getProducts } from "@/services/productService";
import { trackProductEvent } from "@/services/trackingService";
import { Product } from "@/types/product";
import { useToast } from "@/hooks/use-toast";
import { addToCart } from "@/services/cartService";
import { createSellerNotification } from "@/services/notificationService";
import { user } from "@/contexts/UserContext";

const categories = [
  { value: "all", label: "All Categories" },
  { value: "books", label: "Books" },
  { value: "electronics", label: "Electronics" },
  { value: "food", label: "Food" },
  { value: "clothing", label: "Clothing" }
];

const companies = [
  { value: "Sony", label: "Sony" },
  { value: "Organic Farms", label: "Organic Farms" },
  { value: "Penguin Books", label: "Penguin Books" },
  { value: "Coffee Roasters", label: "Coffee Roasters" },
  { value: "Levi's", label: "Levi's" },
  { value: "Apple", label: "Apple" },
  { value: "HarperCollins", label: "HarperCollins" },
  { value: "Local Bakery", label: "Local Bakery" }
];

const priorities = [
  { value: "all", label: "All Priorities" },
  { value: "low", label: "Low Priority" },
  { value: "medium", label: "Medium Priority" },
  { value: "high", label: "High Priority" }
];

const ProductsList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get("category") || "all");
  const [perishableOnly, setPerishableOnly] = useState(false);
  const [nonPerishableOnly, setNonPerishableOnly] = useState(false);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [priceSort, setPriceSort] = useState("none");
  const [filterCount, setFilterCount] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [filterPanelVisible, setFilterPanelVisible] = useState(false);
  const [companyFilter, setCompanyFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Fetch products from Supabase
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const category = searchParams.get("category");
        const fetchedProducts = await getProducts(category !== "all" ? category : undefined);
        setAllProducts(fetchedProducts);
      } catch (err) {
        console.error("Error fetching products:", err);
        setError("Failed to load products. Please try again later.");
        toast({
          title: "Error",
          description: "Failed to load products. Please try again later.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [searchParams, toast]);

  // Update category filter when URL changes
  useEffect(() => {
    const category = searchParams.get("category");
    if (category) {
      setCategoryFilter(category);
    } else {
      setCategoryFilter("all");
    }
  }, [searchParams]);

  // Apply filters to products
  useEffect(() => {
    console.log('Filtering products, showFilters state:', showFilters);
    let filtered = [...allProducts];

    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter(p => p.category.toLowerCase() === categoryFilter.toLowerCase());
    }

    if (perishableOnly) {
      filtered = filtered.filter(p => p.perishable);
    }

    if (nonPerishableOnly) {
      filtered = filtered.filter(p => !p.perishable);
    }

    if (inStockOnly) {
      filtered = filtered.filter(p => p.inStock);
    }

    if (companyFilter !== "all") {
      filtered = filtered.filter(p =>
        p.company && p.company.toLowerCase().includes(companyFilter.toLowerCase())
      );
    }

    if (priorityFilter !== "all") {
      filtered = filtered.filter(p => p.priority === priorityFilter);
    }

    if (priceSort === "low-to-high") {
      filtered.sort((a, b) => a.price - b.price);
    } else if (priceSort === "high-to-low") {
      filtered.sort((a, b) => b.price - a.price);
    }

    setFilteredProducts(filtered);

    // Update filter count
    let count = 0;
    if (searchTerm) count++;
    if (categoryFilter !== "all") count++;
    if (perishableOnly) count++;
    if (nonPerishableOnly) count++;
    if (inStockOnly) count++;
    if (priceSort !== "none") count++;
    if (companyFilter !== "all") count++;
    if (priorityFilter !== "all") count++;
    setFilterCount(count);

    if (categoryFilter !== "all") {
      setSearchParams({ category: categoryFilter });
    } else {
      setSearchParams({});
    }
  }, [allProducts, searchTerm, categoryFilter, perishableOnly, nonPerishableOnly, inStockOnly, priceSort, companyFilter, priorityFilter, showFilters, setSearchParams]);

  const resetFilters = () => {
    console.log('Resetting filters');
    setSearchTerm("");
    setCategoryFilter("all");
    setPerishableOnly(false);
    setNonPerishableOnly(false);
    setInStockOnly(false);
    setPriceSort("none");
    setCompanyFilter("all");
    setPriorityFilter("all");
    setFilterPanelVisible(false);
  };

  const handleCardClick = async (product: Product) => {
    try {
      // Track the product view if it has a seller ID
      if (product.sellerId) {
        await trackProductEvent(
          product.id,
          product.sellerId,
          'view',
          { productName: product.name }
        );
      }

      // Navigate to the product detail page
      navigate(`/products/${product.id}`);
    } catch (err) {
      console.error('Error tracking product view:', err);
      // Still navigate even if tracking fails
      navigate(`/products/${product.id}`);
    }
  };

  // Add to cart function
  const handleAddToCart = async (product: Product) => {
    if (!user) {
      toast({
        title: "Please login",
        description: "You need to login to add items to your cart",
        variant: "destructive"
      });
      navigate("/login");
      return;
    }

    try {
      // Add to cart using cart service
      await addToCart(product.id, 1);

      // Track the cart event if product has a seller ID
      if (product.sellerId) {
        await trackProductEvent(
          product.id,
          product.sellerId,
          'cart',
          {
            productName: product.name,
            quantity: 1,
            value: product.price,
            buyerId: user.id
          }
        );

        // Create notification for seller
        await createSellerNotification(
          product.sellerId,
          product.id,
          'cart',
          user.id,
          {
            productName: product.name,
            quantity: 1,
            value: product.price,
            buyerName: user.name
          }
        );
      }

      toast({
        title: "Added to cart",
        description: `${product.name} added to your cart`,
      });
    } catch (err) {
      console.error('Error adding to cart:', err);
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl animate-in">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Products</h1>
          <p className="text-muted-foreground">
            Browse our collection of quality products
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto mt-4 md:mt-0">
          <div className="relative flex-1 md:hidden">
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

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="relative md:hidden">
                <Filter className="h-5 w-5" />
                {filterCount > 0 && (
                  <span className="absolute -top-1 -right-1 size-5 rounded-full bg-primary text-[10px] font-medium flex items-center justify-center">
                    {filterCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
                <SheetDescription>
                  Refine your product search
                </SheetDescription>
              </SheetHeader>
              <div className="py-4 space-y-6">
                <div className="space-y-3">
                  <h3 className="text-sm font-medium">Categories</h3>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Food Type - Keep this filter as it is */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium">Food Type</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="perishableOnly"
                        checked={perishableOnly}
                        onCheckedChange={(checked) => {
                          setPerishableOnly(checked as boolean);
                          if (checked) setNonPerishableOnly(false);
                        }}
                      />
                      <label htmlFor="perishableOnly">Perishable only</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="nonPerishableOnly"
                        checked={nonPerishableOnly}
                        onCheckedChange={(checked) => {
                          setNonPerishableOnly(checked as boolean);
                          if (checked) setPerishableOnly(false);
                        }}
                      />
                      <label htmlFor="nonPerishableOnly">Non-perishable only</label>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-medium">Company</h3>
                  <Select value={companyFilter} onValueChange={setCompanyFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select company" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Companies</SelectItem>
                      {companies.map(company => (
                        <SelectItem key={company.value} value={company.value}>
                          {company.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-medium">Priority</h3>
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {priorities.map(priority => (
                        <SelectItem key={priority.value} value={priority.value}>
                          {priority.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-medium">Availability</h3>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="inStockOnly"
                      checked={inStockOnly}
                      onCheckedChange={(checked) => setInStockOnly(checked as boolean)}
                    />
                    <label htmlFor="inStockOnly">In stock only</label>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-medium">Price</h3>
                  <Select value={priceSort} onValueChange={setPriceSort}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sort by price" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No sorting</SelectItem>
                      <SelectItem value="low-to-high">Low to High</SelectItem>
                      <SelectItem value="high-to-low">High to Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-2">
                  <Button variant="outline" onClick={resetFilters}>
                    Reset Filters
                  </Button>
                  <Button>
                    Apply Filters
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="hidden md:flex items-start gap-6 mb-8">
        <div className="flex-1 max-w-md relative">
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

        <Tabs value={categoryFilter} onValueChange={setCategoryFilter} className="w-auto">
          <TabsList>
            {categories.map(category => (
              <TabsTrigger key={category.value} value={category.value}>
                {category.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            onClick={() => {
              const newState = !filterPanelVisible;
              console.log('Filter button clicked, changing visibility to:', newState);
              setFilterPanelVisible(newState);
            }}
          >
            <Filter className="h-4 w-4" />
            <span>Filter</span>
            {filterCount > 0 && (
              <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center">{filterCount}</Badge>
            )}
          </Button>

          <Select value={priceSort} onValueChange={setPriceSort}>
            <SelectTrigger className="min-w-[150px]">
              <SelectValue placeholder="Sort by price" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No sorting</SelectItem>
              <SelectItem value="low-to-high">Price: Low to High</SelectItem>
              <SelectItem value="high-to-low">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Dynamic Filter Panel */}
      {filterPanelVisible && (
        <div className="hidden md:block mb-8 p-4 bg-card/50 backdrop-blur-sm border border-border/40 rounded-lg animate-in fade-in-0 slide-in-from-top-5 duration-300">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium">Filter Options</h3>
            <Button variant="ghost" size="sm" onClick={() => setFilterPanelVisible(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Food Type - Keep this filter as it is */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Food Type</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="perishableOnlyDesktop"
                    checked={perishableOnly}
                    onCheckedChange={(checked) => {
                      setPerishableOnly(checked as boolean);
                      if (checked) setNonPerishableOnly(false);
                    }}
                  />
                  <label htmlFor="perishableOnlyDesktop">Perishable only</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="nonPerishableOnlyDesktop"
                    checked={nonPerishableOnly}
                    onCheckedChange={(checked) => {
                      setNonPerishableOnly(checked as boolean);
                      if (checked) setPerishableOnly(false);
                    }}
                  />
                  <label htmlFor="nonPerishableOnlyDesktop">Non-perishable only</label>
                </div>
              </div>
            </div>

            {/* Company Filter */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Company</h3>
              <Select value={companyFilter} onValueChange={setCompanyFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Companies</SelectItem>
                  {companies.map(company => (
                    <SelectItem key={company.value} value={company.value}>
                      {company.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Priority Filter */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Priority</h3>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  {priorities.map(priority => (
                    <SelectItem key={priority.value} value={priority.value}>
                      {priority.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Availability */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Availability</h3>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="inStockOnlyDesktop"
                  checked={inStockOnly}
                  onCheckedChange={(checked) => setInStockOnly(checked as boolean)}
                />
                <label htmlFor="inStockOnlyDesktop">In stock only</label>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button variant="outline" onClick={resetFilters} className="mr-2">
              Reset Filters
            </Button>
            <Button onClick={() => setFilterPanelVisible(false)}>
              Apply Filters
            </Button>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading products...</p>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-4 max-w-md text-center">
            <p>{error}</p>
          </div>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && filteredProducts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="bg-muted p-8 rounded-md mb-4 max-w-md text-center">
            <h3 className="text-xl font-bold mb-2">No products found</h3>
            <p className="text-muted-foreground mb-4">We couldn't find any products matching your filters.</p>
            <Button onClick={resetFilters}>Clear Filters</Button>
          </div>
        </div>
      )}

      {/* Product grid - desktop */}
      {!loading && !error && filteredProducts.length > 0 && (
        <div className="hidden md:block mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map(product => (
              <Card
                key={product.id}
                className="overflow-hidden border border-border/40 bg-card/30 backdrop-blur-sm hover:bg-card/50 transition-colors cursor-pointer"
                onClick={() => handleCardClick(product)}
              >
                <div className="aspect-square relative overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="object-cover w-full h-full"
                  />
                  {!product.inStock && (
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
                      <Badge variant="destructive" className="text-base py-1.5">Out of Stock</Badge>
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-medium line-clamp-1">{product.name}</h3>
                  <p className="text-muted-foreground text-sm line-clamp-2 mt-1 mb-3">{product.description}</p>
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-lg">₹{product.price.toFixed(2)}</p>
                    <div>
                      <Button 
                        size="icon" 
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(product);
                        }}
                        disabled={!product.inStock}
                      >
                        <ShoppingCart className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Product grid - mobile */}
      {!loading && !error && filteredProducts.length > 0 && (
        <div className="md:hidden space-y-4">
          {filteredProducts.map(product => (
            <Card
              key={product.id}
              className="overflow-hidden border border-border/40 bg-card/30 backdrop-blur-sm"
              onClick={() => handleCardClick(product)}
            >
              <div className="flex">
                <div className="w-1/3 aspect-square relative overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="object-cover w-full h-full"
                  />
                  {!product.inStock && (
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
                      <Badge variant="destructive" className="text-xs">Out of Stock</Badge>
                    </div>
                  )}
                </div>
                <div className="w-2/3 p-3 flex flex-col">
                  <h3 className="font-medium line-clamp-1">{product.name}</h3>
                  <p className="text-muted-foreground text-sm line-clamp-2 mt-1 mb-2 flex-grow">{product.description}</p>
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-base">₹{product.price.toFixed(2)}</p>
                    <div>
                      <Button 
                        size="icon" 
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(product);
                        }}
                        disabled={!product.inStock}
                      >
                        <ShoppingCart className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductsList;
