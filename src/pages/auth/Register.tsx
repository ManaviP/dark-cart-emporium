
import { useState } from "react";
import { useAuth, UserRole } from "@/context/auth-context";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, UserPlus } from "lucide-react";

const Register = () => {
  const { register, loginWithGoogle } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<UserRole>("buyer");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !password || !confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const result = await register(email, password, name, role);
      toast({
        description: "Account created successfully!",
      });

      // If email confirmation is required, let the user know
      if (result) {
        navigate("/");
      }
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Create an account</h1>
          <p className="text-muted-foreground mt-2">
            Sign up to start shopping or selling
          </p>
        </div>

        <Card className="border border-border/40 bg-card/30 backdrop-blur-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Sign up</CardTitle>
            <CardDescription>
              Enter your information to create an account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

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
                <Label htmlFor="password">Password</Label>
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

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Account Type</Label>
                <div className="grid grid-cols-3 gap-2">
                  <label
                    htmlFor="buyer"
                    className={`flex flex-col items-center justify-between rounded-md border-2 ${role === 'buyer' ? 'border-primary' : 'border-muted'} bg-muted/30 p-4 hover:bg-muted/40 cursor-pointer`}
                  >
                    <input
                      type="radio"
                      name="role"
                      id="buyer"
                      value="buyer"
                      checked={role === 'buyer'}
                      onChange={() => setRole('buyer')}
                      className="sr-only"
                      aria-label="Buyer role"
                    />
                    <span className="font-medium">Buyer</span>
                    <span className="text-xs text-muted-foreground">
                      Shop for products
                    </span>
                  </label>
                  <label
                    htmlFor="seller"
                    className={`flex flex-col items-center justify-between rounded-md border-2 ${role === 'seller' ? 'border-primary' : 'border-muted'} bg-muted/30 p-4 hover:bg-muted/40 cursor-pointer`}
                  >
                    <input
                      type="radio"
                      name="role"
                      id="seller"
                      value="seller"
                      checked={role === 'seller'}
                      onChange={() => setRole('seller')}
                      className="sr-only"
                      aria-label="Seller role"
                    />
                    <span className="font-medium">Seller</span>
                    <span className="text-xs text-muted-foreground">
                      Sell your products
                    </span>
                  </label>
                  <label
                    htmlFor="logistics"
                    className={`flex flex-col items-center justify-between rounded-md border-2 ${role === 'logistics' ? 'border-primary' : 'border-muted'} bg-muted/30 p-4 hover:bg-muted/40 cursor-pointer`}
                  >
                    <input
                      type="radio"
                      name="role"
                      id="logistics"
                      value="logistics"
                      checked={role === 'logistics'}
                      onChange={() => setRole('logistics')}
                      className="sr-only"
                      aria-label="Logistics role"
                    />
                    <span className="font-medium">Logistics</span>
                    <span className="text-xs text-muted-foreground">
                      Deliver products
                    </span>
                  </label>
                </div>
              </div>

              <Button className="w-full" type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <span className="mr-2">Creating account...</span>
                    <div className="h-4 w-4 border-2 border-background border-r-transparent rounded-full animate-spin"></div>
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Create Account
                  </>
                )}
              </Button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
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
                      // If the login failed, reset the loading state
                      setLoading(false);
                    }
                    // If successful, the page will redirect and we don't need to reset loading
                  } catch (error) {
                    console.error("Google login error:", error);
                    setLoading(false);
                  }
                }}
                disabled={loading}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                  <path d="M1 1h22v22H1z" fill="none" />
                </svg>
                Sign up with Google
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-center text-sm">
              <span className="text-muted-foreground">Already have an account? </span>
              <Link
                to="/login"
                className="text-primary underline-offset-4 hover:underline"
              >
                Log in
              </Link>
            </div>
            <p className="text-center text-xs text-muted-foreground px-4">
              By creating an account, you agree to our Terms of Service and Privacy Policy.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Register;
