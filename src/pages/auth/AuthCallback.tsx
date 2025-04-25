import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

const AuthCallback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get current session
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          toast({ description: "Successfully logged in!" });

          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", session.user.id)
            .single();

          if (profileError || !profile) {
            console.error("Profile fetch error:", profileError);
            setError("Could not fetch user profile.");
            return;
          }

          const role = profile.role;
          console.log("User role from database:", role);

          // Store the user role in localStorage for future use
          try {
            const userDataString = JSON.stringify({
              id: session.user.id,
              email: session.user.email,
              role: role
            });
            localStorage.setItem('dark-cart-user', userDataString);
            sessionStorage.setItem('dark-cart-user', userDataString);
            console.log('Stored user data in localStorage and sessionStorage with role:', role);
          } catch (storageErr) {
            console.error('Error storing user data:', storageErr);
          }

          // Redirect based on role
          switch (role) {
            case "buyer":
              navigate("/dashboard");
              console.log('Redirecting to buyer dashboard');
              break;
            case "seller":
              navigate("/seller");
              console.log('Redirecting to seller dashboard');
              break;
            case "admin":
              navigate("/admin");
              console.log('Redirecting to admin dashboard');
              break;
            case "logistics":
              navigate("/logistics");
              console.log('Redirecting to logistics dashboard');
              break;
            default:
              navigate("/");
              console.log('Redirecting to home page (default)');
              break;
          }

          return;
        }

        // Manual token set fallback
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");

        if (!accessToken) {
          const queryParams = new URLSearchParams(window.location.search);
          const errorDescription = queryParams.get("error_description");
          setError(errorDescription || "Authentication failed.");
          return;
        }

        const { data, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || "",
        });

        if (sessionError) {
          setError(sessionError.message);
          return;
        }

        toast({ description: "Successfully logged in!" });

        // Repeat role fetch for newly set session
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.session.user.id)
          .single();

        if (profileError || !profile) {
          console.error("Profile fetch error:", profileError);
          setError("Could not fetch user profile.");
          return;
        }

        const role = profile.role;
        console.log("User role from database (after token set):", role);

        // Store the user role in localStorage for future use
        try {
          const userDataString = JSON.stringify({
            id: data.session.user.id,
            email: data.session.user.email,
            role: role
          });
          localStorage.setItem('dark-cart-user', userDataString);
          sessionStorage.setItem('dark-cart-user', userDataString);
          console.log('Stored user data in localStorage and sessionStorage');
        } catch (storageErr) {
          console.error('Error storing user data:', storageErr);
        }

        switch (role) {
          case "buyer":
            navigate("/dashboard");
            console.log('Redirecting to buyer dashboard');
            break;
          case "seller":
            navigate("/seller");
            console.log('Redirecting to seller dashboard');
            break;
          case "admin":
            navigate("/admin");
            console.log('Redirecting to admin dashboard');
            break;
          case "logistics":
            navigate("/logistics");
            console.log('Redirecting to logistics dashboard');
            break;
          default:
            navigate("/");
            console.log('Redirecting to home page (default)');
        }

      } catch (err) {
        console.error("Auth callback error:", err);
        setError("Unexpected error. Try again.");
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
      <Card className="w-full max-w-md border border-border/40 bg-card/30 backdrop-blur-sm">
        <CardContent className="pt-6">
          {error ? (
            <div className="text-center space-y-4">
              <h2 className="text-xl font-semibold text-destructive">Authentication Failed</h2>
              <p className="text-muted-foreground">{error}</p>
              <button
                type="button"
                className="text-primary hover:underline"
                onClick={() => navigate("/login")}
              >
                Return to login
              </button>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <h2 className="text-xl font-semibold">Completing authentication...</h2>
              <div className="flex justify-center">
                <div className="h-8 w-8 border-4 border-primary border-r-transparent rounded-full animate-spin"></div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthCallback;
