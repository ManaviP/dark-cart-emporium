
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

      // Get user profile from profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);

        // If the error is that the profile doesn't exist, return null
        if (profileError.code === 'PGRST116') {
          console.log('No profile found for user');
          return null;
        }

        throw profileError;
      }

      if (!profile) {
        console.error('No profile found for user');
        return null;
      }

      console.log('Profile found:', profile);

      // Get user addresses
      let addresses = [];
      try {
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

      return userProfile;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        // Check Supabase session
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          const userProfile = await fetchUserProfile(session.user.id);
          if (userProfile) {
            setUser(userProfile);
          } else {
            // User authenticated but no profile, sign out
            await supabase.auth.signOut();
          }
        }
      } catch (err) {
        console.error("Session check error:", err);
      } finally {
        setLoading(false);
      }
    };

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setLoading(true);
          const userProfile = await fetchUserProfile(session.user.id);
          if (userProfile) {
            setUser(userProfile);
          }
          setLoading(false);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    );

    checkSession();

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      console.log('Login function called with email:', email);

      // For testing purposes, allow any email with a password
      if (password && password.length > 0) {
        // Check if it's one of our predefined test accounts
        const testEmails = [
          'buyer@example.com',
          'seller@example.com',
          'admin@example.com',
          'logistics@example.com'
        ];

        if (testEmails.includes(email)) {
          // Use mock data for predefined test accounts
          const mockUser = mockUsers.find(u => u.email === email);
          if (mockUser) {
            console.log('Using predefined mock user for testing:', mockUser);
            setUser(mockUser);
            return;
          }
        } else {
          // Create a mock user for any other email
          const newMockUser: UserProfile = {
            id: `mock-${Date.now()}`,
            email: email,
            name: email.split('@')[0],
            role: 'buyer',
            addresses: [],
          };
          console.log('Created new mock user for testing:', newMockUser);
          setUser(newMockUser);
          return;
        }
      }

      // Real Supabase authentication
      console.log('Attempting Supabase authentication...');
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.error('Supabase login error:', signInError);

        // Check if the error is because the user doesn't exist
        if (signInError.message.includes('Invalid login credentials') ||
            signInError.message.includes('Email not confirmed')) {

          // For a truly invalid login, provide a helpful message
          throw new Error('Invalid email or password. Please try again or register if you don\'t have an account.');
        }

        // For development, if Supabase auth fails, fall back to mock user
        if (process.env.NODE_ENV === 'development') {
          console.log('Falling back to mock user in development mode');
          const fallbackMockUser: UserProfile = {
            id: `mock-${Date.now()}`,
            email: email,
            name: email.split('@')[0],
            role: 'buyer',
            addresses: [],
          };
          console.log('Created fallback mock user:', fallbackMockUser);
          setUser(fallbackMockUser);
          return;
        }

        throw signInError;
      }

      console.log('Supabase auth successful, user:', data.user);

      if (data.user) {
        try {
          // Try to fetch the user profile
          const userProfile = await fetchUserProfile(data.user.id);

          if (userProfile) {
            console.log('User profile found:', userProfile);
            setUser(userProfile);
          } else {
            console.log('No profile found, creating one...');

            // If no profile exists, create one
            const newProfile: UserProfile = {
              id: data.user.id,
              email: data.user.email || email,
              name: data.user.user_metadata?.name || email.split('@')[0],
              role: 'buyer',
              addresses: [],
            };

            // Insert the profile into Supabase
            const { error: profileError } = await supabase
              .from('profiles')
              .insert([{
                id: newProfile.id,
                email: newProfile.email,
                name: newProfile.name,
                role: newProfile.role,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }]);

            if (profileError) {
              console.error('Error creating profile:', profileError);
            }

            setUser(newProfile);
          }
        } catch (profileErr) {
          console.error('Error handling user profile:', profileErr);
          // Still set the user with basic info
          setUser({
            id: data.user.id,
            email: data.user.email || email,
            name: data.user.user_metadata?.name || email.split('@')[0],
            role: 'buyer',
            addresses: [],
          });
        }
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || "Login failed");
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
      console.log('Attempting to register user with Supabase...');

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

            // Fetch the user profile
            const userProfile = await fetchUserProfile(signInData.user!.id);
            if (userProfile) {
              setUser(userProfile);
              toast({
                title: "Login successful",
                description: "You've been logged in with your existing account.",
              });
              return signInData.user;
            }
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

      toast({
        title: "Registration successful",
        description: "Please check your email to confirm your account.",
      });

      // Create a user profile object
      const userProfile: UserProfile = {
        id: data.user.id,
        email: email,
        name: name,
        role: role,
        addresses: [],
      };

      setUser(userProfile);
      console.log('User registered and logged in:', userProfile);

      return data.user;
    } catch (err: any) {
      setError(err.message || "Registration failed");
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

      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('Supabase logout error:', error);
        throw error;
      }

      console.log('Successfully logged out');
      setUser(null);

      // Clear any local storage items related to auth
      localStorage.removeItem('supabase.auth.token');

      // Force a page reload to clear any cached state
      window.location.href = '/';
    } catch (err: any) {
      console.error('Logout error:', err);
      setError(err.message || "Logout failed");

      // Even if there's an error, still try to clear the user state
      setUser(null);
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
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          name: data.name,
          phone: data.phone,
          avatar_url: data.avatar_url,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Update local state
      const updatedUser = { ...user, ...data };
      setUser(updatedUser);
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
