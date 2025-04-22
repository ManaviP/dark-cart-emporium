
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

// Type definitions
export type UserRole = "buyer" | "seller" | "admin" | "logistics";

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
  register: (email: string, password: string, name: string, role: UserRole) => Promise<void>;
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

  // Simulate checking for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        // In a real app, check Supabase session
        const savedUser = localStorage.getItem("darkcart_user");
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
      } catch (err) {
        console.error("Session check error:", err);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock login logic - will be replaced with Supabase auth
      const foundUser = mockUsers.find(u => u.email === email);
      
      if (foundUser) {
        setUser(foundUser);
        localStorage.setItem("darkcart_user", JSON.stringify(foundUser));
      } else {
        throw new Error("Invalid credentials");
      }
    } catch (err: any) {
      setError(err.message || "Login failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (email: string, password: string, name: string, role: UserRole) => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock register logic - will be replaced with Supabase auth
      if (mockUsers.some(u => u.email === email)) {
        throw new Error("Email already in use");
      }
      
      const newUser: UserProfile = {
        id: `user-${Date.now()}`,
        email,
        name,
        role,
        addresses: [],
      };
      
      setUser(newUser);
      localStorage.setItem("darkcart_user", JSON.stringify(newUser));
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
      // In a real app, sign out of Supabase
      localStorage.removeItem("darkcart_user");
      setUser(null);
    } catch (err: any) {
      setError(err.message || "Logout failed");
      throw err;
    }
  };

  // Update profile
  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) throw new Error("Not authenticated");
    
    try {
      const updatedUser = { ...user, ...data };
      setUser(updatedUser);
      localStorage.setItem("darkcart_user", JSON.stringify(updatedUser));
    } catch (err: any) {
      setError(err.message || "Profile update failed");
      throw err;
    }
  };

  // Address management functions
  const addAddress = async (address: Omit<Address, "id">) => {
    if (!user) throw new Error("Not authenticated");
    
    try {
      const newAddress = { ...address, id: `addr-${Date.now()}` };
      const updatedAddresses = [...user.addresses];
      
      // If this is the first address or marked as default, make it default
      if (updatedAddresses.length === 0 || newAddress.is_default) {
        updatedAddresses.forEach(addr => addr.is_default = false);
        newAddress.is_default = true;
      }
      
      updatedAddresses.push(newAddress);
      
      const updatedUser = { ...user, addresses: updatedAddresses };
      setUser(updatedUser);
      localStorage.setItem("darkcart_user", JSON.stringify(updatedUser));
    } catch (err: any) {
      setError(err.message || "Failed to add address");
      throw err;
    }
  };

  const updateAddress = async (id: string, data: Partial<Omit<Address, "id">>) => {
    if (!user) throw new Error("Not authenticated");
    
    try {
      const updatedAddresses = user.addresses.map(addr => 
        addr.id === id ? { ...addr, ...data } : addr
      );
      
      // Handle default address changes
      if (data.is_default) {
        updatedAddresses.forEach(addr => {
          if (addr.id !== id) addr.is_default = false;
        });
      }
      
      const updatedUser = { ...user, addresses: updatedAddresses };
      setUser(updatedUser);
      localStorage.setItem("darkcart_user", JSON.stringify(updatedUser));
    } catch (err: any) {
      setError(err.message || "Failed to update address");
      throw err;
    }
  };

  const deleteAddress = async (id: string) => {
    if (!user) throw new Error("Not authenticated");
    
    try {
      let updatedAddresses = user.addresses.filter(addr => addr.id !== id);
      
      // If we deleted the default address, set a new default if possible
      if (user.addresses.find(addr => addr.id === id)?.is_default && updatedAddresses.length > 0) {
        updatedAddresses[0].is_default = true;
      }
      
      const updatedUser = { ...user, addresses: updatedAddresses };
      setUser(updatedUser);
      localStorage.setItem("darkcart_user", JSON.stringify(updatedUser));
    } catch (err: any) {
      setError(err.message || "Failed to delete address");
      throw err;
    }
  };

  const setDefaultAddress = async (id: string) => {
    if (!user) throw new Error("Not authenticated");
    
    try {
      const updatedAddresses = user.addresses.map(addr => ({
        ...addr,
        is_default: addr.id === id
      }));
      
      const updatedUser = { ...user, addresses: updatedAddresses };
      setUser(updatedUser);
      localStorage.setItem("darkcart_user", JSON.stringify(updatedUser));
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
