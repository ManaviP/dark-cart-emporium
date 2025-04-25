export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  perishable: boolean;
  expiryDate?: string; // Optional for non-perishable items
  priority: string;
  company: string;
  inStock: boolean;
  quantity: number;
  rating?: number;
  specifications?: { name: string; value: string }[];
  sellerId: string;
}

export interface DonationDetails {
  productId: number;
  quantity: number;
  destination: string;
  notes?: string;
  value: number;
}

export const categories = [
  { value: "all", label: "All Categories" },
  { value: "books", label: "Books" },
  { value: "electronics", label: "Electronics" },
  { value: "food", label: "Food" },
  { value: "clothing", label: "Clothing" }
];

export const priorities = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" }
];
