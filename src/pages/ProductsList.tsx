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
  Gift, 
  Filter, 
  SlidersHorizontal, 
  Search,
  X
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

const mockProducts = [
  {
    id: 1,
    name: "Premium Headphones",
    description: "Noise-cancelling wireless headphones with superior sound quality.",
    price: 159.99,
    category: "electronics",
    image: "https://placehold.co/300x300/1a1f2c/ffffff?text=Headphones",
    perishable: false,
    inStock: true,
    rating: 4.8
  },
  {
    id: 2,
    name: "Organic Apples",
    description: "Fresh and organic apples picked from local farms.",
    price: 5.99,
    category: "food",
    image: "https://placehold.co/300x300/1a1f2c/ffffff?text=Apples",
    perishable: true,
    inStock: true,
    rating: 4.5
  },
  {
    id: 3,
    name: "Fantasy Novel",
    description: "Bestselling fantasy novel set in a magical world.",
    price: 12.99,
    category: "books",
    image: "https://placehold.co/300x300/1a1f2c/ffffff?text=Book",
    perishable: false,
    inStock: true,
    rating: 4.2
  },
  {
    id: 4,
    name: "Artisan Coffee Beans",
    description: "Premium roasted coffee beans from sustainable farms.",
    price: 18.99,
    category: "food",
    image: "https://placehold.co/300x300/1a1f2c/ffffff?text=Coffee",
    perishable: true,
    inStock: false,
    rating: 4.9
  },
  {
    id: 5,
    name: "Denim Jacket",
    description: "Classic denim jacket with modern styling.",
    price: 69.99,
    category: "clothing",
    image: "https://placehold.co/300x300/1a1f2c/ffffff?text=Jacket",
    perishable: false,
    inStock: true,
    rating: 4.1
  },
  {
    id: 6,
    name: "Wireless Earbuds",
    description: "True wireless earbuds with long battery life.",
    price: 89.99,
    category: "electronics",
    image: "https://placehold.co/300x300/1a1f2c/ffffff?text=Earbuds",
    perishable: false,
    inStock: true,
    rating: 4.6
  },
  {
    id: 7,
    name: "Biography Book",
    description: "Inspiring biography of a renowned historical figure.",
    price: 15.99,
    category: "books",
    image: "https://placehold.co/300x300/1a1f2c/ffffff?text=Biography",
    perishable: false,
    inStock: true,
    rating: 4.3
  },
  {
    id: 8,
    name: "Fresh Bread",
    description: "Artisan sourdough bread baked daily.",
    price: 4.99,
    category: "food",
    image: "https://placehold.co/300x300/1a1f2c/ffffff?text=Bread",
    perishable: true,
    inStock: true,
    rating: 4.7
  }
];

const categories = [
  { value: "all", label: "All Categories" },
  { value: "books", label: "Books" },
  { value: "electronics", label: "Electronics" },
  { value: "food", label: "Food" },
  { value: "clothing", label: "Clothing" }
];

const ProductsList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState(mockProducts);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get("category") || "all");
  const [perishableOnly, setPerishableOnly] = useState(false);
  const [nonPerishableOnly, setNonPerishableOnly] = useState(false);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [priceSort, setPriceSort] = useState("none");
  const [filterCount, setFilterCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const category = searchParams.get("category");
    if (category) {
      setCategoryFilter(category);
    }
  }, [searchParams]);

  useEffect(() => {
    let count = 0;
    if (searchTerm) count++;
    if (categoryFilter !== "all") count++;
    if (perishableOnly) count++;
    if (nonPerishableOnly) count++;
    if (inStockOnly) count++;
    if (priceSort !== "none") count++;
    setFilterCount(count);
  }, [searchTerm, categoryFilter, perishableOnly, nonPerishableOnly, inStockOnly, priceSort]);

  useEffect(() => {
    let filtered = [...mockProducts];
    
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (categoryFilter !== "all") {
      filtered = filtered.filter(p => p.category === categoryFilter);
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
    
    if (priceSort === "low-to-high") {
      filtered.sort((a, b) => a.price - b.price);
    } else if (priceSort === "high-to-low") {
      filtered.sort((a, b) => b.price - a.price);
    }
    
    setProducts(filtered);
    
    if (categoryFilter !== "all") {
      setSearchParams({ category: categoryFilter });
    } else {
      setSearchParams({});
    }
  }, [searchTerm, categoryFilter, perishableOnly, nonPerishableOnly, inStockOnly, priceSort, setSearchParams]);
  
  const resetFilters = () => {
    setSearchTerm("");
    setCategoryFilter("all");
    setPerishableOnly(false);
    setNonPerishableOnly(false);
    setInStockOnly(false);
    setPriceSort("none");
  };

  const handleCardClick = (productId: number) => {
    navigate(`/products/${productId}`);
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
                
                <Button variant="outline" className="w-full" onClick={resetFilters}>
                  Reset Filters
                </Button>
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
        
        <Tabs defaultValue={categoryFilter} onValueChange={setCategoryFilter} className="w-auto">
          <TabsList>
            {categories.map(category => (
              <TabsTrigger key={category.value} value={category.value}>
                {category.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        
        <div className="flex items-center gap-3">
          <SlidersHorizontal className="h-4 w-4" />
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
      
      {filterCount > 0 && (
        <div className="hidden md:flex items-center gap-2 mb-4 flex-wrap">
          <span className="text-sm font-medium">Active filters:</span>
          
          {categoryFilter !== "all" && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Category: {categoryFilter}
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-4 w-4 ml-1 p-0" 
                onClick={() => setCategoryFilter("all")}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          
          {perishableOnly && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Perishable
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-4 w-4 ml-1 p-0" 
                onClick={() => setPerishableOnly(false)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          
          {nonPerishableOnly && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Non-perishable
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-4 w-4 ml-1 p-0" 
                onClick={() => setNonPerishableOnly(false)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          
          {inStockOnly && (
            <Badge variant="secondary" className="flex items-center gap-1">
              In stock
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-4 w-4 ml-1 p-0" 
                onClick={() => setInStockOnly(false)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          
          {priceSort !== "none" && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Price: {priceSort === "low-to-high" ? "Low to High" : "High to Low"}
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-4 w-4 ml-1 p-0" 
                onClick={() => setPriceSort("none")}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={resetFilters}>
            Clear all
          </Button>
        </div>
      )}
      
      <div className="hidden md:flex flex-wrap gap-4 mb-8">
        <Card className="w-full max-w-xs flex-shrink-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Filter Options</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Food Type</h3>
              <div className="grid gap-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="desktopPerishableOnly" 
                    checked={perishableOnly}
                    onCheckedChange={(checked) => {
                      setPerishableOnly(checked as boolean);
                      if (checked) setNonPerishableOnly(false);
                    }}
                  />
                  <label htmlFor="desktopPerishableOnly" className="text-sm">Perishable only</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="desktopNonPerishableOnly" 
                    checked={nonPerishableOnly}
                    onCheckedChange={(checked) => {
                      setNonPerishableOnly(checked as boolean);
                      if (checked) setPerishableOnly(false);
                    }}
                  />
                  <label htmlFor="desktopNonPerishableOnly" className="text-sm">Non-perishable only</label>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Availability</h3>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="desktopInStockOnly" 
                  checked={inStockOnly}
                  onCheckedChange={(checked) => setInStockOnly(checked as boolean)}
                />
                <label htmlFor="desktopInStockOnly" className="text-sm">In stock only</label>
              </div>
            </div>
            
            <Separator />
            
            <Button variant="outline" size="sm" onClick={resetFilters}>
              Reset Filters
            </Button>
          </CardContent>
        </Card>
        
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.length > 0 ? (
            products.map((product) => (
              <Card 
                key={product.id} 
                className="overflow-hidden group hover-scale border border-border/40 bg-card/30 backdrop-blur-sm cursor-pointer relative"
                onClick={() => handleCardClick(product.id)}
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
                  </div>
                </div>
                <CardHeader className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    <p className="font-bold text-lg">${product.price.toFixed(2)}</p>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
                </CardHeader>
                <CardFooter className="p-4 pt-0 flex gap-2">
                  <Button 
                    className="flex-1 z-10" 
                    size="sm" 
                    disabled={!product.inStock}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/products/${product.id}`);
                    }}
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Buy
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 z-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/products/${product.id}?donate=true`);
                    }}
                  >
                    <Gift className="mr-2 h-4 w-4" />
                    Donate
                  </Button>
                </CardFooter>
              </Card>
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center p-8 text-center">
              <div className="rounded-full bg-primary/10 p-3 mb-4">
                <Search className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-medium">No products found</h3>
              <p className="text-muted-foreground mt-1">
                Try adjusting your search or filter criteria
              </p>
              <Button 
                variant="link" 
                className="mt-2"
                onClick={resetFilters}
              >
                Clear all filters
              </Button>
            </div>
          )}
        </div>
      </div>
      
      <div className="md:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
        {products.length > 0 ? (
          products.map((product) => (
            <Card 
              key={product.id} 
              className="overflow-hidden group border border-border/40 bg-card/30 backdrop-blur-sm cursor-pointer relative"
              onClick={() => handleCardClick(product.id)}
            >
              <div className="aspect-square overflow-hidden relative">
                <img 
                  src={product.image} 
                  alt={product.name}
                  className="object-cover w-full h-full"
                />
                {!product.inStock && (
                  <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
                    <Badge variant="destructive" className="text-xs py-1 px-2">Out of Stock</Badge>
                  </div>
                )}
                <div className="absolute top-2 right-2 space-y-1">
                  {product.perishable && (
                    <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 text-xs">
                      Perishable
                    </Badge>
                  )}
                </div>
              </div>
              <CardHeader className="p-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base line-clamp-1">{product.name}</CardTitle>
                  <p className="font-bold text-base">${product.price.toFixed(2)}</p>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{product.description}</p>
              </CardHeader>
              <CardFooter className="p-3 pt-0 flex gap-2">
                <Button 
                  className="flex-1 z-10" 
                  size="sm" 
                  disabled={!product.inStock}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/products/${product.id}`);
                  }}
                >
                  <ShoppingCart className="mr-1 h-3 w-3" />
                  Buy
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/products/${product.id}?donate=true`);
                  }}
                >
                  <Gift className="mr-1 h-3 w-3" />
                  Donate
                </Button>
              </CardFooter>
            </Card>
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center p-6 text-center">
            <div className="rounded-full bg-primary/10 p-3 mb-3">
              <Search className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-base font-medium">No products found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Try adjusting your search or filter criteria
            </p>
            <Button 
              variant="link" 
              className="mt-1"
              onClick={resetFilters}
            >
              Clear all filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductsList;
