export interface BoothNamedEntity {
  id: string;
  name: string;
}

export interface BoothUser {
  id: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  seller_enabled?: boolean;
}

export interface BoothImage {
  id: string;
  name: string;
  url?: string;
}

export interface BoothProduct {
  id: string;
  name: string;
  friendly_product_id?: string;
  manual_review_passed?: boolean;
  images?: BoothImage[];
  category?: BoothNamedEntity | null;
  created_at?: string;
  listing_price?: number | string;
  original_price?: number | string;
  sold?: boolean;
  seller?: { id: string } | null;
  seller_booth?: { id: string; name: string } | null;
  brand?: BoothNamedEntity | string | null;
  size_on_label?: string;
  returned_to_seller?: boolean;
  dev_booth_product_id?: string;
  stock_quantity?: number;
  original_stock?: number;
  description?: string;
  rejected?: boolean;
  code?: string;
  size?: string;
  price?: string;
}

export interface BoothPaymentMethod {
  id: string;
  method: string;
}

export interface BoothCheckoutItem {
  quantity: number;
  booth_product: BoothProduct | null;
}

export interface BoothCheckout {
  id: string;
  Cart_value: number;
  created_at: string;
  checkout_date: string;
  Booth_payment_method: BoothPaymentMethod | null;
  items: BoothCheckoutItem[];
}

export interface SellerBooth {
  id: string;
  name: string;
  business_name?: string;
  user?: BoothUser | null;
  is_verified?: boolean;
  is_inactive?: boolean;
  created_at?: string;
  booth_products?: BoothProduct[];
  booth_start_date?: string;
  booth_end_date?: string;
  booth_slot?: string;
  seller?: string;
  items?: number;
  status?: 'pending' | 'approved' | 'inactive';
  cycle?: 'current' | 'next' | 'upcoming' | 'done';
}

export interface BoothCheckoutAggregates {
  totalCartValue: number;
  totalItemsSold: number;
  totalCheckouts: number;
}
