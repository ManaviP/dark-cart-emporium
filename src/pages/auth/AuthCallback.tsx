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
        // Check if we have a session already
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          // We already have a session, redirect to home
          toast({
            description: "Successfully logged in!",
          });
          navigate("/");
          return;
        }

        // Get the auth code from the URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");

        if (!accessToken) {
          // If no access token, check for error
          const queryParams = new URLSearchParams(window.location.search);
          const errorDescription = queryParams.get("error_description");
          const errorCode = queryParams.get("error");

          if (errorDescription) {
            console.error(`Auth error: ${errorCode} - ${errorDescription}`);
            setError(errorDescription);
            return;
          }

          // No token and no error, something went wrong
          setError("Authentication failed. Please try again.");
          return;
        }

        // Exchange the token for a session
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || "",
        });

        if (error) {
          console.error("Session error:", error);
          setError(error.message);
          return;
        }

        // Success! Redirect to home page
        toast({
          description: "Successfully logged in!",
        });
        navigate("/");
      } catch (err) {
        console.error("Auth callback error:", err);
        setError("An unexpected error occurred. Please try again.");
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
