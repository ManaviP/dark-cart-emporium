import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Menu, ShoppingCart, Package, User, LogOut, Search, Bell } from "lucide-react";
import Notifications from "./Notifications";
import { Link, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";

interface NavbarProps {
  onMenuClick: () => void;
}

const Navbar = ({ onMenuClick }: NavbarProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      console.log('Navbar: Handling logout click');
      // Don't navigate - let the logout function handle the redirect
      await logout();
      console.log('Navbar: Logout function completed');
      // The logout function will redirect to home page
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center px-4">
        <Button variant="ghost" size="icon" className="mr-2 lg:hidden" onClick={onMenuClick}>
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle menu</span>
        </Button>

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 mr-4">
          <div className="relative size-8 overflow-hidden rounded-full bg-primary/20 flex items-center justify-center">
            <Package className="size-5 text-primary" />
          </div>
          <span className="font-bold tracking-tight text-xl hidden md:inline-block">
            DarkCart
          </span>
        </Link>

        {/* Search */}
        <div className="relative hidden md:flex flex-1 px-4">
          <Search className="absolute left-7 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            className="w-full max-w-sm pl-9 bg-muted/50"
          />
        </div>

        {/* Navigation Icons */}
        <div className="flex items-center gap-2 md:gap-4">
          {user && (
            <>
              <Link to="/buyer/cart">
                <Button variant="ghost" size="icon" className="relative">
                  <ShoppingCart className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 size-5 rounded-full bg-primary text-[10px] font-medium flex items-center justify-center">3</span>
                  <span className="sr-only">Cart</span>
                </Button>
              </Link>

              {/* Notifications */}
              {(user.role === 'seller' || user.role === 'admin') && (
                <Notifications />
              )}
            </>
          )}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar_url} alt={user.name} />
                    <AvatarFallback className="bg-primary/20 text-primary text-sm font-medium">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="w-full cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/profile/edit" className="w-full cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>Change Account Type</span>
                    </Link>
                  </DropdownMenuItem>

                  {user.role === "buyer" && (
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard" className="w-full cursor-pointer">
                        <Package className="mr-2 h-4 w-4" />
                        <span>My Orders</span>
                      </Link>
                    </DropdownMenuItem>
                  )}

                  {user.role === "seller" && (
                    <DropdownMenuItem asChild>
                      <Link to="/seller" className="w-full cursor-pointer">
                        <Package className="mr-2 h-4 w-4" />
                        <span>Seller Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                  )}

                  {user.role === "admin" && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="w-full cursor-pointer">
                        <Package className="mr-2 h-4 w-4" />
                        <span>Admin Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                  )}

                  {user.role === "logistics" && (
                    <DropdownMenuItem asChild>
                      <Link to="/logistics" className="w-full cursor-pointer">
                        <Package className="mr-2 h-4 w-4" />
                        <span>Logistics Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-destructive focus:text-destructive"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex gap-2">
              <Button variant="ghost" asChild>
                <Link to="/login">Login</Link>
              </Button>
              <Button asChild>
                <Link to="/register">Register</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
