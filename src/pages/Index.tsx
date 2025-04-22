
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { Link } from "react-router-dom";
import { ArrowRight, ShoppingBag, Package, UserCog, Truck, Heart } from "lucide-react";

const Index = () => {
  const { user } = useAuth();

  // Force dark mode
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col">
      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-16 md:py-24 bg-gradient-to-b from-background to-muted/30 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-purple-500 to-primary bg-clip-text text-transparent">
            Dark Cart Emporium
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Your premium destination for high-quality products with a unique option to buy or donate to those in need.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link to="/products">
                <ShoppingBag className="mr-2 h-5 w-5" />
                Shop Now
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/products?donate=true">
                <Heart className="mr-2 h-5 w-5" />
                Donate Items
              </Link>
            </Button>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-12">Platform Features</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-card/30 backdrop-blur-sm p-6 rounded-lg border border-border/40 flex flex-col items-center text-center hover-scale h-full">
              <div className="p-3 bg-primary/10 rounded-full mb-4">
                <ShoppingBag className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Shop Products</h3>
              <p className="text-muted-foreground">
                Browse our curated selection of high-quality products across multiple categories.
              </p>
            </div>
            
            <div className="bg-card/30 backdrop-blur-sm p-6 rounded-lg border border-border/40 flex flex-col items-center text-center hover-scale h-full">
              <div className="p-3 bg-primary/10 rounded-full mb-4">
                <Heart className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Donate Items</h3>
              <p className="text-muted-foreground">
                Contribute to your community by donating products to those in need.
              </p>
            </div>
            
            <div className="bg-card/30 backdrop-blur-sm p-6 rounded-lg border border-border/40 flex flex-col items-center text-center hover-scale h-full">
              <div className="p-3 bg-primary/10 rounded-full mb-4">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Sell Products</h3>
              <p className="text-muted-foreground">
                Set up your own shop and sell products directly to customers.
              </p>
            </div>
            
            <div className="bg-card/30 backdrop-blur-sm p-6 rounded-lg border border-border/40 flex flex-col items-center text-center hover-scale h-full">
              <div className="p-3 bg-primary/10 rounded-full mb-4">
                <Truck className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Track Orders</h3>
              <p className="text-muted-foreground">
                Real-time tracking for all your purchases and deliveries.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* User Roles Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-4">Multiple User Roles</h2>
          <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-12">
            Our platform supports different user types, each with specialized features and capabilities.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card/30 backdrop-blur-sm p-6 rounded-lg border border-border/40 flex flex-col h-full hover-scale">
              <h3 className="text-xl font-bold mb-2 flex items-center">
                <ShoppingBag className="h-5 w-5 mr-2 text-primary" />
                Buyers
              </h3>
              <p className="text-muted-foreground mb-4 flex-1">
                Shop for products, donate items, save favorite products, manage addresses, and track your orders.
              </p>
              {!user && (
                <Button variant="outline" size="sm" className="self-start" asChild>
                  <Link to="/register">
                    Register as Buyer
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>
            
            <div className="bg-card/30 backdrop-blur-sm p-6 rounded-lg border border-border/40 flex flex-col h-full hover-scale">
              <h3 className="text-xl font-bold mb-2 flex items-center">
                <Package className="h-5 w-5 mr-2 text-primary" />
                Sellers
              </h3>
              <p className="text-muted-foreground mb-4 flex-1">
                List products for sale, manage your inventory, track orders, and handle donations from your store.
              </p>
              {!user && (
                <Button variant="outline" size="sm" className="self-start" asChild>
                  <Link to="/register">
                    Register as Seller
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>
            
            <div className="bg-card/30 backdrop-blur-sm p-6 rounded-lg border border-border/40 flex flex-col h-full hover-scale">
              <h3 className="text-xl font-bold mb-2 flex items-center">
                <UserCog className="h-5 w-5 mr-2 text-primary" />
                Administrators
              </h3>
              <p className="text-muted-foreground mb-4 flex-1">
                Manage users, oversee platform operations, and coordinate donation activities across the platform.
              </p>
            </div>
            
            <div className="bg-card/30 backdrop-blur-sm p-6 rounded-lg border border-border/40 flex flex-col h-full hover-scale">
              <h3 className="text-xl font-bold mb-2 flex items-center">
                <Truck className="h-5 w-5 mr-2 text-primary" />
                Logistics
              </h3>
              <p className="text-muted-foreground mb-4 flex-1">
                Track deliveries, update order status, and manage the shipping process from warehouse to customer.
              </p>
              {!user && (
                <Button variant="outline" size="sm" className="self-start" asChild>
                  <Link to="/register">
                    Register as Logistics
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>
      
      {/* Call to Action */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Join our growing community of buyers, sellers, and donors making a difference.
          </p>
          
          {user ? (
            <Button size="lg" asChild>
              <Link to="/products">
                <ShoppingBag className="mr-2 h-5 w-5" />
                Browse Products
              </Link>
            </Button>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link to="/register">
                  Create Account
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/login">
                  Log In
                </Link>
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Index;
