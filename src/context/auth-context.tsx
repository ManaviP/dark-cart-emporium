
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase, getCurrentUser } from "@/lib/supabase";
import { UserRole } from "@/types/supabase";
import { toast } from "@/hooks/use-toast";

// Type definitions
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  addresses: Address[];
  avatar_url?: string;
}

export interface Address {
  id: string;
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<boolean>;
  register: (email: string, password: string, name: string, role: UserRole) => Promise<any>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  addAddress: (address: Omit<Address, "id">) => Promise<void>;
  updateAddress: (id: string, data: Partial<Omit<Address, "id">>) => Promise<void>;
  deleteAddress: (id: string) => Promise<void>;
  setDefaultAddress: (id: string) => Promise<void>;
}

// Mock user data - will be replaced with Supabase auth
const mockUsers: UserProfile[] = [
  {
    id: "1",
    email: "buyer@example.com",
    name: "Test Buyer",
    phone: "123-456-7890",
    role: "buyer",
    addresses: [
      {
        id: "addr1",
        name: "Home",
        line1: "123 Main St",
        city: "New York",
        state: "NY",
        postal_code: "10001",
        country: "USA",
        is_default: true
      }
    ]
  },
  {
    id: "2",
    email: "seller@example.com",
    name: "Test Seller",
    phone: "123-456-7891",
    role: "seller",
    addresses: []
  },
  {
    id: "3",
    email: "admin@example.com",
    name: "Test Admin",
    phone: "123-456-7892",
    role: "admin",
    addresses: []
  },
  {
    id: "4",
    email: "logistics@example.com",
    name: "Test Logistics",
    phone: "123-456-7893",
    role: "logistics",
    addresses: []
  }
];

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user profile from Supabase
  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('Fetching user profile for ID:', userId);

      if (!userId) {
        console.error('Invalid user ID provided to fetchUserProfile');
        return null;
      }

      // In development mode, check if we have a stored profile first
      if (process.env.NODE_ENV === 'development') {
        try {
          const storedUserData = localStorage.getItem('dark-cart-user');
          if (storedUserData) {
            const parsedData = JSON.parse(storedUserData);
            if (parsedData.id === userId) {
              console.log('Found stored profile for user:', parsedData.email);
              console.log('Using stored role:', parsedData.role);
              return parsedData as UserProfile;
            }
          }
        } catch (storageErr) {
          console.error('Error reading stored user data:', storageErr);
        }
      }

      // Get user profile from profiles table
      console.log('Querying profiles table...');
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        console.error('Error code:', profileError.code);
        console.error('Error message:', profileError.message);
        console.error('Error details:', profileError.details);

        // If the error is that the profile doesn't exist, return null
        if (profileError.code === 'PGRST116') {
          console.log('No profile found for user (PGRST116)');
          return null;
        }

        throw profileError;
      }

      if (!profile) {
        console.error('No profile found for user (empty result)');
        return null;
      }

      console.log('Profile found:', profile);
      console.log('User role from database:', profile.role);

      // Get user addresses
      let addresses = [];
      try {
        console.log('Fetching user addresses...');
        const { data: addressData, error: addressesError } = await supabase
          .from('addresses')
          .select('*')
          .eq('user_id', userId);

        if (addressesError) {
          console.error('Error fetching addresses:', addressesError);
        } else {
          addresses = addressData || [];
          console.log('Addresses found:', addresses.length);
        }
      } catch (addrError) {
        console.error('Exception fetching addresses:', addrError);
      }

      // Construct full user profile
      console.log('Constructing user profile object...');
      const userProfile: UserProfile = {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        phone: profile.phone || undefined,
        role: profile.role,
        avatar_url: profile.avatar_url || undefined,
        addresses: addresses,
      };

      console.log('Constructed user profile:', userProfile);

      // Store the profile in localStorage for future use
      if (process.env.NODE_ENV === 'development') {
        try {
          localStorage.setItem('dark-cart-user', JSON.stringify(userProfile));
          sessionStorage.setItem('dark-cart-user', JSON.stringify(userProfile));
          console.log('Stored user profile in localStorage and sessionStorage');
        } catch (storageErr) {
          console.error('Error storing user profile:', storageErr);
        }
      }

      return userProfile;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      return null;
    }
  };

  // Check for existing session on mount and handle auth state changes
  useEffect(() => {
    // Keep track of the last processed user ID to prevent duplicate processing
    let lastProcessedUserId: string | null = null;
    let isProcessingAuthEvent = false;

    const checkSession = async () => {
      try {
        setLoading(true);

        // In development mode, check for user data in localStorage or sessionStorage first
        if (process.env.NODE_ENV === 'development') {
          console.log('Development mode, checking local storage for user data');

          // Try to get user data from localStorage or sessionStorage
          let storedUserData = null;
          try {
            const localData = localStorage.getItem('dark-cart-user');
            const sessionData = sessionStorage.getItem('dark-cart-user');

            if (localData) {
              console.log('Found user data in localStorage');
              storedUserData = JSON.parse(localData);
            } else if (sessionData) {
              console.log('Found user data in sessionStorage');
              storedUserData = JSON.parse(sessionData);

              // Also store in localStorage for future use
              localStorage.setItem('dark-cart-user', sessionData);
            }

            if (storedUserData) {
              console.log('Using stored user data:', storedUserData);
              console.log('User role from storage:', storedUserData.role);
              setUser(storedUserData);
              setLoading(false);
              return;
            }
          } catch (storageErr) {
            console.error('Error reading user data from storage:', storageErr);
          }
        }

        // Check Supabase session
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Initial session check:', session ? 'Session found' : 'No session');

        if (session?.user) {
          console.log('User found in session, fetching profile for ID:', session.user.id);
          // Update the last processed user ID
          lastProcessedUserId = session.user.id;

          const userProfile = await fetchUserProfile(session.user.id);

          if (userProfile) {
            console.log('User profile found, setting user state');
            setUser(userProfile);

            // In development mode, also store in localStorage and sessionStorage
            if (process.env.NODE_ENV === 'development') {
              try {
                const userDataString = JSON.stringify(userProfile);
                localStorage.setItem('dark-cart-user', userDataString);
                sessionStorage.setItem('dark-cart-user', userDataString);
                console.log('Stored user profile in both localStorage and sessionStorage');
              } catch (storageErr) {
                console.error('Error storing user profile in storage:', storageErr);
              }
            }
          } else {
            console.log('No user profile found for authenticated user');
            // Create a basic profile if one doesn't exist
            try {
              console.log('Attempting to create a profile for user:', session.user.id);
              const { error: profileError } = await supabase
                .from('profiles')
                .insert([{
                  id: session.user.id,
                  email: session.user.email || '',
                  name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
                  role: 'buyer',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                }]);

              if (profileError) {
                console.error('Error creating profile during session check:', profileError);
                // If error is not about duplicate key, sign out
                if (!profileError.message.includes('duplicate key')) {
                  console.log('Signing out due to profile creation error');
                  await supabase.auth.signOut();
                  setUser(null);
                } else {
                  // Try fetching the profile again in case it was created by a trigger
                  console.log('Profile may already exist, trying to fetch again');
                  const retryProfile = await fetchUserProfile(session.user.id);
                  if (retryProfile) {
                    setUser(retryProfile);

                    // In development mode, also store in localStorage and sessionStorage
                    if (process.env.NODE_ENV === 'development') {
                      try {
                        const userDataString = JSON.stringify(retryProfile);
                        localStorage.setItem('dark-cart-user', userDataString);
                        sessionStorage.setItem('dark-cart-user', userDataString);
                        console.log('Stored retry profile in both localStorage and sessionStorage');
                      } catch (storageErr) {
                        console.error('Error storing retry profile in storage:', storageErr);
                      }
                    }
                  } else {
                    console.error('Still could not find profile after retry');
                    await supabase.auth.signOut();
                    setUser(null);
                  }
                }
              } else {
                console.log('Profile created successfully, fetching complete profile');
                const newProfile = await fetchUserProfile(session.user.id);
                if (newProfile) {
                  setUser(newProfile);

                  // In development mode, also store in localStorage and sessionStorage
                  if (process.env.NODE_ENV === 'development') {
                    try {
                      const userDataString = JSON.stringify(newProfile);
                      localStorage.setItem('dark-cart-user', userDataString);
                      sessionStorage.setItem('dark-cart-user', userDataString);
                      console.log('Stored new profile in both localStorage and sessionStorage');
                    } catch (storageErr) {
                      console.error('Error storing new profile in storage:', storageErr);
                    }
                  }
                }
              }
            } catch (profileErr) {
              console.error('Error handling profile creation:', profileErr);
              await supabase.auth.signOut();
              setUser(null);
            }
          }
        } else {
          console.log('No active session found');
          setUser(null);
        }
      } catch (err) {
        console.error("Session check error:", err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    // Handle auth state change with debounce to prevent duplicate processing
    const handleAuthStateChange = async (event: string, session: any) => {
      // If already processing an auth event, skip this one
      if (isProcessingAuthEvent) {
        console.log('Already processing an auth event, skipping this one');
        return;
      }

      console.log('Auth state change event:', event);

      // For SIGNED_IN events, check if we've already processed this user
      if (event === 'SIGNED_IN' && session?.user) {
        // If this is the same user we just processed, skip
        if (lastProcessedUserId === session.user.id) {
          console.log('Already processed this user, skipping duplicate SIGNED_IN event');
          return;
        }

        // Update the last processed user ID
        lastProcessedUserId = session.user.id;

        // Set flag to prevent concurrent processing
        isProcessingAuthEvent = true;
        console.log('SIGNED_IN event with user:', session.user.id);
        setLoading(true);

        try {
          const userProfile = await fetchUserProfile(session.user.id);

          if (userProfile) {
            console.log('User profile found after sign in');
            setUser(userProfile);
          } else {
            console.log('No profile found after sign in, creating one');
            // Create a profile if one doesn't exist
            try {
              const { error: profileError } = await supabase
                .from('profiles')
                .insert([{
                  id: session.user.id,
                  email: session.user.email || '',
                  name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
                  role: 'buyer',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                }]);

              if (profileError) {
                console.error('Error creating profile on sign in:', profileError);
                // If error is not about duplicate key, handle accordingly
                if (!profileError.message.includes('duplicate key')) {
                  throw profileError;
                } else {
                  // Try fetching again
                  const retryProfile = await fetchUserProfile(session.user.id);
                  if (retryProfile) {
                    setUser(retryProfile);
                  }
                }
              } else {
                // Profile created, fetch it
                const newProfile = await fetchUserProfile(session.user.id);
                if (newProfile) {
                  setUser(newProfile);
                }
              }
            } catch (profileErr) {
              console.error('Error creating profile on sign in:', profileErr);
              // Create a basic user object with minimal info
              setUser({
                id: session.user.id,
                email: session.user.email || '',
                name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
                role: 'buyer',
                addresses: [],
              });
            }
          }
        } catch (err) {
          console.error('Error handling sign in event:', err);
          // Create a basic user object with minimal info
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
            role: 'buyer',
            addresses: [],
          });
        } finally {
          setLoading(false);
          // Reset the processing flag
          isProcessingAuthEvent = false;
        }
      } else if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        console.log('User signed out or deleted');
        lastProcessedUserId = null;
        setUser(null);
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed, session updated');
        // No need to update user state as the session is just refreshed
      } else if (event === 'USER_UPDATED') {
        console.log('User updated, refreshing profile');
        if (session?.user) {
          const updatedProfile = await fetchUserProfile(session.user.id);
          if (updatedProfile) {
            setUser(updatedProfile);
          }
        }
      }
    };

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    // Initial session check
    checkSession();

    // Cleanup subscription
    return () => {
      console.log('Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      console.log('Login function called with email:', email);
      console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
      console.log('Supabase key available:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);

      // DEVELOPMENT MODE: Only use mock data for predefined test accounts
      if (process.env.NODE_ENV === 'development') {
        console.log('Development mode detected');

        // Check if it's one of our predefined test accounts
        const testEmails = [
          'buyer@example.com',
          'seller@example.com',
          'admin@example.com',
          'logistics@example.com'
        ];

        // Use predefined mock user if it's a test account
        if (testEmails.includes(email)) {
          console.log('Using test account, creating mock user');
          const mockUser = mockUsers.find(u => u.email === email);
          if (mockUser) {
            console.log('Using predefined mock user for testing:', mockUser);
            setUser(mockUser);

            toast({
              title: "Login successful",
              description: "You've been logged in successfully with a test account.",
            });
            return mockUser;
          }
        }

        // For non-test accounts, proceed with Supabase authentication
        console.log('Not a test account, using Supabase authentication');
      }

      // PRODUCTION MODE: Use real Supabase authentication
      console.log('Production mode, attempting Supabase authentication...');

      // First, check if there's already a session to avoid duplicate logins
      console.log('Checking for existing session...');
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error('Error checking session:', sessionError);
      }

      console.log('Session check result:', sessionData?.session ? 'Session exists' : 'No session');

      if (sessionData?.session?.user?.email === email) {
        console.log('User is already logged in with this email');

        // Fetch the user profile to ensure we have the latest data
        const userProfile = await fetchUserProfile(sessionData.session.user.id);
        if (userProfile) {
          setUser(userProfile);

          toast({
            title: "Already logged in",
            description: "You're already logged in with this account.",
          });
          return sessionData.session.user;
        }
      }

      // Proceed with login
      console.log('Proceeding with login attempt...');
      try {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        console.log('Login attempt completed');

        if (signInError) {
          console.error('Supabase login error:', signInError);
          throw signInError;
        }

        if (!data || !data.user) {
          console.error('No user data returned from login');
          throw new Error('Login failed. No user data returned.');
        }

        console.log('Supabase auth successful, user:', data.user);

        // Manually fetch and set the user profile instead of relying on the auth state change listener
        console.log('Fetching user profile...');
        const userProfile = await fetchUserProfile(data.user.id);

        // We'll get the actual role from the database instead of determining it from the email pattern
        console.log('Fetching user role from database...');

        if (userProfile) {
          console.log('User profile found:', userProfile);

          console.log('Using role from database:', userProfile.role);

          // Store the user profile in localStorage and sessionStorage
          try {
            const userDataString = JSON.stringify(userProfile);
            localStorage.setItem('dark-cart-user', userDataString);
            sessionStorage.setItem('dark-cart-user', userDataString);
            console.log('Stored user profile in localStorage and sessionStorage');
          } catch (storageErr) {
            console.error('Error storing user profile:', storageErr);
          }

          setUser(userProfile);
        } else {
          // Create a basic profile if one doesn't exist
          console.log('No profile found after login, creating one');

          // Determine a default role based on email pattern for new users
          let defaultRole: UserRole = 'buyer';
          const userEmail = data.user.email || '';

          if (userEmail.includes('seller')) {
            defaultRole = 'seller';
          } else if (userEmail.includes('admin')) {
            defaultRole = 'admin';
          } else if (userEmail.includes('logistics')) {
            defaultRole = 'logistics';
          }

          console.log('Determined default role from email pattern:', defaultRole);

          try {
            const { error: profileError } = await supabase
              .from('profiles')
              .insert([{
                id: data.user.id,
                email: data.user.email || '',
                name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User',
                role: defaultRole,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }]);

            if (profileError) {
              console.error('Error creating profile after login:', profileError);
              if (!profileError.message.includes('duplicate key')) {
                throw profileError;
              }
            } else {
              console.log('Profile created successfully');
            }

            // Fetch the profile again or create a basic user object
            console.log('Fetching newly created profile...');
            const newProfile = await fetchUserProfile(data.user.id);
            if (newProfile) {
              console.log('New profile fetched successfully');
              setUser(newProfile);
            } else {
              console.log('Creating basic user object with role:', defaultRole);
              const basicUserProfile = {
                id: data.user.id,
                email: data.user.email || '',
                name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User',
                role: defaultRole,
                addresses: [],
              };

              // Store the basic user profile in localStorage and sessionStorage
              try {
                const userDataString = JSON.stringify(basicUserProfile);
                localStorage.setItem('dark-cart-user', userDataString);
                sessionStorage.setItem('dark-cart-user', userDataString);
                console.log('Stored basic user profile in localStorage and sessionStorage');
              } catch (storageErr) {
                console.error('Error storing basic user profile:', storageErr);
              }

              setUser(basicUserProfile);
            }
          } catch (profileErr) {
            console.error('Error handling profile creation after login:', profileErr);
            // Create a basic user object with minimal info
            console.log('Creating basic user object after error with role:', defaultRole);
            const errorUserProfile = {
              id: data.user.id,
              email: data.user.email || '',
              name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User',
              role: defaultRole,
              addresses: [],
            };

            // Store the error user profile in localStorage and sessionStorage
            try {
              const userDataString = JSON.stringify(errorUserProfile);
              localStorage.setItem('dark-cart-user', userDataString);
              sessionStorage.setItem('dark-cart-user', userDataString);
              console.log('Stored error user profile in localStorage and sessionStorage');
            } catch (storageErr) {
              console.error('Error storing error user profile:', storageErr);
            }

            setUser(errorUserProfile);
          }
        }

        console.log('Login process completed successfully');
        toast({
          title: "Login successful",
          description: "You've been logged in successfully.",
        });

        // Force a refresh of the session to ensure it's properly stored
        console.log('Refreshing session...');
        await supabase.auth.refreshSession();
        console.log('Session refreshed');

        // Return the user data
        return data.user;
      } catch (signInErr) {
        console.error('Error during signInWithPassword:', signInErr);
        throw signInErr;
      }

    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || "Login failed");
      toast({
        title: "Login Error",
        description: err.message || "Login failed. Please try again.",
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Login with Google
  const loginWithGoogle = async () => {
    setLoading(true);
    setError(null);

    try {
      // Simplified Google OAuth login
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      // The user will be redirected to Google for authentication
      // After successful authentication, they will be redirected back to the callback URL
      // We don't reset loading here because the page will redirect
      return true;
    } catch (err: any) {
      console.error("Google login error:", err);
      setError(err.message || "Google login failed");
      setLoading(false);
      toast({
        title: "Login Error",
        description: "Failed to connect to Google. Please try again later.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Register function
  const register = async (email: string, password: string, name: string, role: UserRole) => {
    setLoading(true);
    setError(null);

    try {
      console.log('Attempting to register user with email:', email);

      // DEVELOPMENT MODE: Only use mock data for test accounts
      if (process.env.NODE_ENV === 'development') {
        console.log('Development mode detected');

        // Check if it's a test account
        const testEmails = [
          'buyer@example.com',
          'seller@example.com',
          'admin@example.com',
          'logistics@example.com'
        ];

        if (testEmails.includes(email)) {
          console.log('Using test account, creating mock user for registration');

          // Create a mock user with the provided details
          const mockUser: UserProfile = {
            id: `mock-${Date.now()}`,
            email: email,
            name: name,
            role: role,
            addresses: [],
          };

          console.log('Created mock user for registration:', mockUser);

          // Store user data in both localStorage and sessionStorage for cross-browser compatibility
          try {
            const userDataString = JSON.stringify(mockUser);
            localStorage.setItem('dark-cart-user', userDataString);
            sessionStorage.setItem('dark-cart-user', userDataString);
            console.log('Stored registered user data in both localStorage and sessionStorage');
          } catch (storageErr) {
            console.error('Error storing registered user data in storage:', storageErr);
          }

          setUser(mockUser);

          toast({
            title: "Registration successful",
            description: `You've been registered as a ${role} with a mock account for development.`,
          });

          return mockUser;
        }

        // For non-test accounts, proceed with Supabase authentication
        console.log('Not a test account, using Supabase authentication for registration');
      }

      // PRODUCTION MODE: Use real Supabase authentication
      console.log('Production mode, attempting Supabase registration...');

      // First, check if there's already a session with this email
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session?.user?.email === email) {
        console.log('User is already logged in with this email');

        // Update the user's profile with the new role and name if needed
        try {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              name: name,
              role: role,
              updated_at: new Date().toISOString()
            })
            .eq('id', sessionData.session.user.id);

          if (updateError) {
            console.error('Error updating existing profile:', updateError);
          } else {
            console.log('Updated existing profile with new information');
          }

          // Fetch the updated profile
          const userProfile = await fetchUserProfile(sessionData.session.user.id);
          if (userProfile) {
            setUser(userProfile);

            toast({
              title: "Profile Updated",
              description: "Your profile has been updated successfully.",
            });

            return sessionData.session.user;
          }
        } catch (updateErr) {
          console.error('Error updating profile for existing user:', updateErr);
        }
      }

      // Sign up with Supabase Auth with user metadata
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signUpError) {
        console.error('Supabase signup error:', signUpError);

        // Check if the error is because the user already exists
        if (signUpError.message.includes('already registered') ||
            signUpError.message.includes('already exists') ||
            signUpError.message.includes('already taken')) {
          // Try to log in the user instead
          console.log('User already exists, attempting to log in...');
          try {
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
              email,
              password,
            });

            if (signInError) {
              console.error('Failed to log in existing user:', signInError);
              throw new Error('This email is already registered. Please log in instead.');
            }

            console.log('Successfully logged in existing user:', signInData.user);

            // Update the user's profile with the new role and name
            try {
              const { error: updateError } = await supabase
                .from('profiles')
                .update({
                  name: name,
                  role: role,
                  updated_at: new Date().toISOString()
                })
                .eq('id', signInData.user.id);

              if (updateError) {
                console.error('Error updating existing profile after login:', updateError);
              } else {
                console.log('Updated existing profile with new information after login');
              }
            } catch (updateErr) {
              console.error('Error updating profile for existing user after login:', updateErr);
            }

            // Manually fetch and set the user profile
            const userProfile = await fetchUserProfile(signInData.user.id);
            if (userProfile) {
              setUser(userProfile);
            }

            // Force a refresh of the session to ensure it's properly stored
            await supabase.auth.refreshSession();

            toast({
              title: "Login successful",
              description: "You've been logged in with your existing account.",
            });

            return signInData.user;
          } catch (loginErr) {
            console.error('Error logging in existing user:', loginErr);
          }

          throw new Error('This email is already registered. Please log in instead.');
        }

        throw signUpError;
      }

      if (!data.user) {
        console.error('No user returned from signup');
        throw new Error("Registration failed");
      }

      console.log('Supabase signup successful, user:', data.user);

      // Create a profile manually in case the trigger doesn't work
      try {
        console.log('Creating user profile...');
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{
            id: data.user.id,
            email: email,
            name: name,
            role: role,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }]);

        if (profileError) {
          // If error is about duplicate key, it's probably because the trigger already created it
          if (!profileError.message.includes('duplicate key')) {
            console.error('Error creating profile:', profileError);
          } else {
            console.log('Profile already exists (likely created by trigger)');
          }
        } else {
          console.log('Profile created successfully');
        }
      } catch (profileErr) {
        console.error('Error creating profile:', profileErr);
      }

      // Manually fetch and set the user profile
      const userProfile = await fetchUserProfile(data.user.id);
      if (userProfile) {
        setUser(userProfile);
      } else {
        // Create a basic user object with minimal info
        setUser({
          id: data.user.id,
          email: email,
          name: name,
          role: role,
          addresses: [],
        });
      }

      // Force a refresh of the session to ensure it's properly stored
      await supabase.auth.refreshSession();

      toast({
        title: "Registration successful",
        description: "Your account has been created successfully.",
      });

      return data.user;
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || "Registration failed");
      toast({
        title: "Registration Error",
        description: err.message || "Registration failed. Please try again.",
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      console.log('Attempting to log out...');
      setLoading(true);

      // Clear user state first to prevent UI flicker
      setUser(null);

      console.log('Clearing all storage items...');

      // Clear our custom user data
      localStorage.removeItem('dark-cart-user');
      sessionStorage.removeItem('dark-cart-user');

      // Clear Supabase auth token
      localStorage.removeItem('dark-cart-auth-token');
      sessionStorage.removeItem('dark-cart-auth-token');

      // Clear all supabase-related items from localStorage
      const localStorageKeys = Object.keys(localStorage);
      for (const key of localStorageKeys) {
        if (key.includes('supabase') || key.includes('auth') || key.includes('dark-cart')) {
          console.log('Removing from localStorage:', key);
          localStorage.removeItem(key);
        }
      }

      // Clear all supabase-related items from sessionStorage
      const sessionStorageKeys = Object.keys(sessionStorage);
      for (const key of sessionStorageKeys) {
        if (key.includes('supabase') || key.includes('auth') || key.includes('dark-cart')) {
          console.log('Removing from sessionStorage:', key);
          sessionStorage.removeItem(key);
        }
      }

      // In development mode, skip Supabase signOut
      if (process.env.NODE_ENV === 'development') {
        console.log('Development mode, skipping Supabase signOut');
      } else {
        // Sign out from Supabase in production mode
        console.log('Calling supabase.auth.signOut()...');
        const { error } = await supabase.auth.signOut();

        if (error) {
          console.error('Supabase logout error:', error);
          // Continue with logout even if there's an error
          console.log('Continuing with logout despite Supabase error');
        } else {
          console.log('Successfully signed out from Supabase');
        }
      }

      console.log('Logout successful');

      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });

      // Force a page reload to clear any cached state
      console.log('Redirecting to home page...');

      // Use a small timeout to ensure the toast is shown before redirect
      setTimeout(() => {
        window.location.href = '/';
      }, 500);

      return true;
    } catch (err: any) {
      console.error('Logout error:', err);
      setError(err.message || "Logout failed");

      toast({
        title: "Logout Error",
        description: "There was a problem logging out. Please try again.",
        variant: "destructive",
      });

      // Even if there's an error, still try to clear the user state and storage
      setUser(null);
      localStorage.removeItem('dark-cart-user');
      sessionStorage.removeItem('dark-cart-user');
      localStorage.removeItem('dark-cart-auth-token');
      sessionStorage.removeItem('dark-cart-auth-token');

      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update profile
  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) throw new Error("Not authenticated");

    try {
      // Update profile in Supabase
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      // Only include fields that are provided
      if (data.name) updateData.name = data.name;
      if (data.phone !== undefined) updateData.phone = data.phone;
      if (data.avatar_url !== undefined) updateData.avatar_url = data.avatar_url;
      if (data.role) updateData.role = data.role;

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Update local state
      const updatedUser = { ...user, ...data };
      setUser(updatedUser);

      // Update the user data in localStorage and sessionStorage
      try {
        const userDataString = JSON.stringify(updatedUser);
        localStorage.setItem('dark-cart-user', userDataString);
        sessionStorage.setItem('dark-cart-user', userDataString);
        console.log('Stored updated user profile in localStorage and sessionStorage');
      } catch (storageErr) {
        console.error('Error storing updated user profile:', storageErr);
      }
    } catch (err: any) {
      setError(err.message || "Profile update failed");
      throw err;
    }
  };

  // Address management functions
  const addAddress = async (address: Omit<Address, "id">) => {
    if (!user) throw new Error("Not authenticated");

    try {
      // If this is the first address or marked as default, update existing addresses
      if (user.addresses.length === 0 || address.is_default) {
        // Set all existing addresses to non-default
        if (user.addresses.length > 0) {
          const { error: updateError } = await supabase
            .from('addresses')
            .update({ is_default: false })
            .eq('user_id', user.id);

          if (updateError) throw updateError;
        }
      }

      // Insert new address
      const { data: newAddress, error: insertError } = await supabase
        .from('addresses')
        .insert([
          {
            user_id: user.id,
            name: address.name,
            line1: address.line1,
            line2: address.line2 || null,
            city: address.city,
            state: address.state,
            postal_code: address.postal_code,
            country: address.country,
            is_default: user.addresses.length === 0 ? true : address.is_default,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (insertError) throw insertError;

      // Update local state
      const updatedAddresses = [...user.addresses, newAddress];
      const updatedUser = { ...user, addresses: updatedAddresses };
      setUser(updatedUser);
    } catch (err: any) {
      setError(err.message || "Failed to add address");
      throw err;
    }
  };

  const updateAddress = async (id: string, data: Partial<Omit<Address, "id">>) => {
    if (!user) throw new Error("Not authenticated");

    try {
      // If setting as default, update other addresses first
      if (data.is_default) {
        const { error: updateDefaultError } = await supabase
          .from('addresses')
          .update({ is_default: false })
          .eq('user_id', user.id)
          .neq('id', id);

        if (updateDefaultError) throw updateDefaultError;
      }

      // Update the address
      const { error: updateError } = await supabase
        .from('addresses')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateError) throw updateError;

      // Fetch updated addresses
      const { data: addresses, error: fetchError } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id);

      if (fetchError) throw fetchError;

      // Update local state
      const updatedUser = { ...user, addresses: addresses || [] };
      setUser(updatedUser);
    } catch (err: any) {
      setError(err.message || "Failed to update address");
      throw err;
    }
  };

  const deleteAddress = async (id: string) => {
    if (!user) throw new Error("Not authenticated");

    try {
      // Check if this is the default address
      const isDefault = user.addresses.find(addr => addr.id === id)?.is_default;

      // Delete the address
      const { error: deleteError } = await supabase
        .from('addresses')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      // If we deleted the default address, set a new default if possible
      if (isDefault) {
        const remainingAddresses = user.addresses.filter(addr => addr.id !== id);

        if (remainingAddresses.length > 0) {
          const { error: updateError } = await supabase
            .from('addresses')
            .update({ is_default: true })
            .eq('id', remainingAddresses[0].id);

          if (updateError) throw updateError;
        }
      }

      // Fetch updated addresses
      const { data: addresses, error: fetchError } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id);

      if (fetchError) throw fetchError;

      // Update local state
      const updatedUser = { ...user, addresses: addresses || [] };
      setUser(updatedUser);
    } catch (err: any) {
      setError(err.message || "Failed to delete address");
      throw err;
    }
  };

  const setDefaultAddress = async (id: string) => {
    if (!user) throw new Error("Not authenticated");

    try {
      // Set all addresses to non-default
      const { error: updateAllError } = await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', user.id);

      if (updateAllError) throw updateAllError;

      // Set the selected address as default
      const { error: updateError } = await supabase
        .from('addresses')
        .update({ is_default: true })
        .eq('id', id);

      if (updateError) throw updateError;

      // Fetch updated addresses
      const { data: addresses, error: fetchError } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id);

      if (fetchError) throw fetchError;

      // Update local state
      const updatedUser = { ...user, addresses: addresses || [] };
      setUser(updatedUser);
    } catch (err: any) {
      setError(err.message || "Failed to set default address");
      throw err;
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    loginWithGoogle,
    register,
    logout,
    updateProfile,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
