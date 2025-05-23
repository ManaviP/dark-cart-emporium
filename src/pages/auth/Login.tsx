import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { supabase } from "@/lib/supabase";

const Login = () => {
  const { login, loginWithGoogle } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Helper function to redirect based on role
  const redirectToRoleDashboard = (role: string) => {
    let redirectPath = from;

    if (role === "seller") {
      redirectPath = "/seller";
      console.log('Redirecting to seller dashboard');
    } else if (role === "admin") {
      redirectPath = "/admin";
      console.log('Redirecting to admin dashboard');
    } else if (role === "logistics") {
      redirectPath = "/logistics";
      console.log('Redirecting to logistics dashboard');
    } else {
      // Default to buyer dashboard
      redirectPath = "/dashboard";
      console.log('Redirecting to buyer dashboard');
    }

    navigate(redirectPath, { replace: true });
  };

  const handleLogin = async (userEmail: string, userPassword: string) => {
    setLoading(true);
    try {
      // Call the login function
      await login(userEmail, userPassword);
      console.log('Login function completed');

      toast({
        description: "Logged in successfully!",
      });

      try {
        console.log("Checking Supabase for user role");
        
        // Get the current session to get the user ID
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id;
        
        if (!userId) {
          console.error("No user ID found in session");
          redirectToRoleDashboard("buyer");
          return;
        }
        
        console.log("Fetching profile for user ID:", userId);
        
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", userId)
          .single();

        if (error) {
          console.error("Error fetching user profile:", error);
          redirectToRoleDashboard("buyer");
          return;
        }

        const userRole = profile.role || "buyer";
        console.log("User role from database:", userRole);
        redirectToRoleDashboard(userRole);
      } catch (profileError) {
        console.error("Error in profile fetch:", profileError);
        
        // Try localStorage as fallback
        try {
          const storedUserData = localStorage.getItem('dark-cart-user');
          if (storedUserData) {
            const parsedData = JSON.parse(storedUserData);
            if (parsedData.role) {
              console.log('Found role in localStorage:', parsedData.role);
              redirectToRoleDashboard(parsedData.role);
              return;
            }
          }
        } catch (storageErr) {
          console.error('Error reading from localStorage:', storageErr);
        }
        
        // Default fallback
        redirectToRoleDashboard("buyer");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Login failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please enter both email and password",
        variant: "destructive",
      });
      return;
    }
    await handleLogin(email, password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Welcome back</h1>
          <p className="text-muted-foreground mt-2">
            Log in to your account to continue
          </p>
        </div>

        <Card className="border border-border/40 bg-card/30 backdrop-blur-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Login</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    to="/forgot-password"
                    className="text-sm text-primary underline-offset-4 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="sr-only">
                      {showPassword ? "Hide password" : "Show password"}
                    </span>
                  </Button>
                </div>
              </div>

              <Button className="w-full" type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <span className="mr-2">Logging in...</span>
                    <div className="h-4 w-4 border-2 border-background border-r-transparent rounded-full animate-spin"></div>
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Log In with Email
                  </>
                )}
              </Button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={async () => {
                  setLoading(true);
                  try {
                    const success = await loginWithGoogle();
                    if (!success) {
                      setLoading(false);
                    }
                  } catch (error) {
                    console.error("Google login error:", error);
                    setLoading(false);
                  }
                }}
              >
                Continue with Google
              </Button>

              {/* Test account info */}
              <div className="p-3 bg-muted/30 rounded-md text-sm">
                <p className="font-medium mb-1">Test Accounts:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>Buyer: buyer@example.com</li>
                  <li>Seller: seller@example.com</li>
                  <li>Admin: admin@example.com</li>
                  <li>Logistics: logistics@example.com</li>
                  <li className="pt-1 text-xs">Password for all: password123</li>
                </ul>
                <div className="mt-2 space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setEmail('buyer@example.com');
                      setPassword('password123');
                    }}
                  >
                    Fill Test Account
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    onClick={() => handleLogin('buyer@example.com', 'password123')}
                  >
                    Direct Login (Test)
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-center text-sm">
              <span className="text-muted-foreground">Don't have an account? </span>
              <Link
                to="/register"
                className="text-primary underline-offset-4 hover:underline"
              >
                Sign up
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Login;
