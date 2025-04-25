import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the URL hash and parse it
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        
        // Check if there's an access token in the URL (from OAuth)
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        
        if (accessToken && refreshToken) {
          console.log('Found tokens in URL, setting session');
          
          // Set the session manually
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          
          if (error) {
            console.error('Error setting session:', error);
            setError('Failed to authenticate. Please try again.');
            return;
          }
        } else {
          // Try to exchange the code for a session
          const { data, error } = await supabase.auth.getSession();
          
          if (error || !data.session) {
            console.error('Error getting session:', error);
            setError('Failed to authenticate. Please try again.');
            return;
          }
        }
        
        // Redirect to home page or the page they were trying to access
        const returnTo = localStorage.getItem('returnTo') || '/';
        localStorage.removeItem('returnTo');
        
        // Use replace to avoid having the callback URL in the history
        navigate(returnTo, { replace: true });
      } catch (err) {
        console.error('Auth callback error:', err);
        setError('An unexpected error occurred. Please try again.');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      {error ? (
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Authentication Error</h1>
          <p className="text-red-500 mb-4">{error}</p>
          <button
            className="px-4 py-2 bg-primary text-white rounded-md"
            onClick={() => navigate('/login')}
          >
            Return to Login
          </button>
        </div>
      ) : (
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Completing Authentication</h1>
          <p className="text-muted-foreground">Please wait while we log you in...</p>
        </div>
      )}
    </div>
  );
};

export default AuthCallback;
