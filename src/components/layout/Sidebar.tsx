
import { cn } from "@/lib/utils";
import { UserRole } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Package,
  ShoppingBag,
  Store,
  Users,
  Heart,
  Truck,
  BarChart3,
  Gift,
  Settings,
  X,
  Home,
  SlidersHorizontal
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  userRole?: UserRole;
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  roleRequired?: UserRole[];
}

const Sidebar = ({ open, setOpen, userRole }: SidebarProps) => {
  const location = useLocation();

  // Define navigation items based on role
  const navItems: NavItem[] = [
    {
      title: "Home",
      href: "/",
      icon: Home
    },
    {
      title: "Browse Products",
      href: "/products",
      icon: ShoppingBag
    },
    {
      title: "Buyer Dashboard",
      href: "/dashboard",
      icon: BarChart3,
      roleRequired: ["buyer"]
    },
    {
      title: "My Orders",
      href: "/dashboard",
      icon: Package,
      roleRequired: ["buyer"]
    },
    {
      title: "Saved Items",
      href: "/saved",
      icon: Heart,
      roleRequired: ["buyer"]
    },
    {
      title: "Seller Dashboard",
      href: "/seller",
      icon: Store,
      roleRequired: ["seller"]
    },
    {
      title: "Seller Products",
      href: "/seller/products",
      icon: Package,
      roleRequired: ["seller"]
    },
    {
      title: "Seller Orders",
      href: "/seller/orders",
      icon: Package,
      roleRequired: ["seller"]
    },
    {
      title: "Admin Dashboard",
      href: "/admin",
      icon: BarChart3,
      roleRequired: ["admin"]
    },
    {
      title: "Manage Users",
      href: "/admin/users",
      icon: Users,
      roleRequired: ["admin"]
    },
    {
      title: "Donations Management",
      href: "/admin/donations",
      icon: Gift,
      roleRequired: ["admin"]
    },
    {
      title: "Logistics Dashboard",
      href: "/logistics",
      icon: Truck,
      roleRequired: ["logistics"]
    },
    {
      title: "Manage Deliveries",
      href: "/logistics/orders",
      icon: Package,
      roleRequired: ["logistics"]
    },
    // Settings tab removed
  ];

  // Filter items based on user role
  const filteredNavItems = navItems.filter(item => {
    if (!item.roleRequired) return true;
    if (!userRole) return false;
    return item.roleRequired.includes(userRole);
  });

  return (
    <>
      {/* Overlay for mobile */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        id="sidebar"
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 border-r border-border/40 bg-sidebar-background text-sidebar-foreground transition-transform duration-300 ease-in-out lg:static lg:w-64 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center border-b border-border/40 px-4">
          <Link to="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
            <div className="relative size-8 overflow-hidden rounded-full bg-primary/20 flex items-center justify-center">
              <Package className="size-5 text-primary" />
            </div>
            <span className="font-bold tracking-tight text-lg">
              DarkCart
            </span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 lg:hidden"
            onClick={() => setOpen(false)}
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Close sidebar</span>
          </Button>
        </div>

        <ScrollArea className="h-[calc(100vh-4rem)] py-4">
          <div className="px-3 py-2">
            <div className="space-y-1">
              {filteredNavItems.map((item) => (
                <Button
                  key={item.href}
                  variant={location.pathname === item.href ? "secondary" : "ghost"}
                  size="sm"
                  className={cn(
                    "w-full justify-start",
                    location.pathname === item.href && "bg-sidebar-accent text-sidebar-accent-foreground"
                  )}
                  asChild
                >
                  <Link
                    to={item.href}
                    onClick={() => setOpen(false)}
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.title}
                  </Link>
                </Button>
              ))}
            </div>

            {/* Categories Section - for buyers */}
            {(!userRole || userRole === "buyer") && (
              <div className="mt-6 space-y-1">
                <h3 className="mx-3 text-xs font-medium text-sidebar-foreground/60">
                  Product Categories
                </h3>
                <div className="space-y-1 mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    asChild
                  >
                    <Link
                      to="/products?category=books"
                      onClick={() => setOpen(false)}
                    >
                      <SlidersHorizontal className="mr-2 h-4 w-4" />
                      Books
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    asChild
                  >
                    <Link
                      to="/products?category=food"
                      onClick={() => setOpen(false)}
                    >
                      <SlidersHorizontal className="mr-2 h-4 w-4" />
                      Food
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    asChild
                  >
                    <Link
                      to="/products?category=electronics"
                      onClick={() => setOpen(false)}
                    >
                      <SlidersHorizontal className="mr-2 h-4 w-4" />
                      Electronics
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    asChild
                  >
                    <Link
                      to="/products?category=clothing"
                      onClick={() => setOpen(false)}
                    >
                      <SlidersHorizontal className="mr-2 h-4 w-4" />
                      Clothing
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </>
  );
};

export default Sidebar;
