export interface User {
  id: number;
  inn: string;
  name: string;
  type: 'restaurant' | 'supplier' | 'admin';
  email?: string;
  settings?: any;
  subscription?: {
    active: boolean;
    plan: 'monthly' | 'yearly';
    expiresAt: string;
  };
}

export interface PriceRecord {
  id?: number;
  product_name: string;
  supplier_name: string;
  supplier_id?: number;
  price: number;
  unit?: string;
  updated_at: string;
  category: string;
}

export interface Recommendation {
  product: string;
  currentPrice: number;
  bestPrice: number;
  supplier: string;
  savingsPercent: number;
}

export interface CartItem extends PriceRecord {
  quantity: number;
}

export interface Supplier {
  id: number;
  name: string;
  inn: string;
  email: string;
  rating: string;
  description: string;
  categories: string[];
}

export interface SupplierDetail extends Supplier {
  prices: {
    product_name: string;
    category: string;
    price: number;
    unit: string;
    updated_at: string;
  }[];
}

export interface Notification {
  id: number;
  user_id: number;
  type: 'price_alert' | 'message' | 'system';
  title: string;
  content: string;
  is_read: number;
  created_at: string;
}
