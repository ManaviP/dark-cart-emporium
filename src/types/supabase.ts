export type UserRole = 'buyer' | 'seller' | 'admin' | 'logistics';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          email: string;
          name: string;
          phone: string | null;
          role: UserRole;
          avatar_url: string | null;
        };
        Insert: {
          id: string;
          created_at?: string;
          updated_at?: string;
          email: string;
          name: string;
          phone?: string | null;
          role: UserRole;
          avatar_url?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          email?: string;
          name?: string;
          phone?: string | null;
          role?: UserRole;
          avatar_url?: string | null;
        };
      };
      addresses: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          user_id: string;
          name: string;
          line1: string;
          line2: string | null;
          city: string;
          state: string;
          postal_code: string;
          country: string;
          is_default: boolean;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          user_id: string;
          name: string;
          line1: string;
          line2?: string | null;
          city: string;
          state: string;
          postal_code: string;
          country: string;
          is_default: boolean;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          user_id?: string;
          name?: string;
          line1?: string;
          line2?: string | null;
          city?: string;
          state?: string;
          postal_code?: string;
          country?: string;
          is_default?: boolean;
        };
      };
      products: {
        Row: {
          id: number;
          created_at: string;
          updated_at: string;
          name: string;
          description: string;
          price: number;
          category: string;
          image: string;
          perishable: boolean;
          expiry_date: string | null;
          priority: 'low' | 'medium' | 'high';
          company: string;
          in_stock: boolean;
          quantity: number;
          rating: number | null;
          seller_id: string;
        };
        Insert: {
          id?: number;
          created_at?: string;
          updated_at?: string;
          name: string;
          description: string;
          price: number;
          category: string;
          image: string;
          perishable: boolean;
          expiry_date?: string | null;
          priority: 'low' | 'medium' | 'high';
          company: string;
          in_stock: boolean;
          quantity: number;
          rating?: number | null;
          seller_id: string;
        };
        Update: {
          id?: number;
          created_at?: string;
          updated_at?: string;
          name?: string;
          description?: string;
          price?: number;
          category?: string;
          image?: string;
          perishable?: boolean;
          expiry_date?: string | null;
          priority?: 'low' | 'medium' | 'high';
          company?: string;
          in_stock?: boolean;
          quantity?: number;
          rating?: number | null;
          seller_id?: string;
        };
      };
      product_specifications: {
        Row: {
          id: number;
          created_at: string;
          product_id: number;
          name: string;
          value: string;
        };
        Insert: {
          id?: number;
          created_at?: string;
          product_id: number;
          name: string;
          value: string;
        };
        Update: {
          id?: number;
          created_at?: string;
          product_id?: number;
          name?: string;
          value?: string;
        };
      };
      carts: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          user_id?: string;
        };
      };
      cart_items: {
        Row: {
          id: number;
          created_at: string;
          updated_at: string;
          cart_id: string;
          product_id: number;
          quantity: number;
        };
        Insert: {
          id?: number;
          created_at?: string;
          updated_at?: string;
          cart_id: string;
          product_id: number;
          quantity: number;
        };
        Update: {
          id?: number;
          created_at?: string;
          updated_at?: string;
          cart_id?: string;
          product_id?: number;
          quantity?: number;
        };
      };
      orders: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          user_id: string;
          status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
          total: number;
          address_id: string;
          payment_method: string;
          payment_status: 'pending' | 'paid' | 'failed';
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          user_id: string;
          status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
          total: number;
          address_id: string;
          payment_method: string;
          payment_status: 'pending' | 'paid' | 'failed';
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          user_id?: string;
          status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
          total?: number;
          address_id?: string;
          payment_method?: string;
          payment_status?: 'pending' | 'paid' | 'failed';
        };
      };
      order_items: {
        Row: {
          id: number;
          created_at: string;
          order_id: string;
          product_id: number;
          quantity: number;
          price: number;
        };
        Insert: {
          id?: number;
          created_at?: string;
          order_id: string;
          product_id: number;
          quantity: number;
          price: number;
        };
        Update: {
          id?: number;
          created_at?: string;
          order_id?: string;
          product_id?: number;
          quantity?: number;
          price?: number;
        };
      };
      donations: {
        Row: {
          id: number;
          created_at: string;
          product_id: number;
          seller_id: string;
          quantity: number;
          destination: string;
          notes: string | null;
          value: number;
        };
        Insert: {
          id?: number;
          created_at?: string;
          product_id: number;
          seller_id: string;
          quantity: number;
          destination: string;
          notes?: string | null;
          value: number;
        };
        Update: {
          id?: number;
          created_at?: string;
          product_id?: number;
          seller_id?: string;
          quantity?: number;
          destination?: string;
          notes?: string | null;
          value?: number;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
