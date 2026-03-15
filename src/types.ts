import { GoogleGenAI, Modality } from "@google/genai";

export interface User {
  id: number;
  inn: string;
  name: string;
  type: 'restaurant' | 'supplier' | 'admin';
  email?: string;
}

export interface PriceRecord {
  product_name: string;
  supplier_name: string;
  price: number;
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
