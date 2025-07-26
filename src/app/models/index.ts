// Product model
export interface Product {
  id: number;
  name: string;
  price: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Order Item model
export interface OrderItem {
  id?: number;
  productId: number;
  name: string;
  price: number;
  quantity: number;
  orderId?: number;
}

// Sale Order model
export interface SaleOrder {
  id: number;
  customerName: string;
  items: OrderItem[];
  total: number;
  cashPaid: number;
  returnAmount: number;
  date: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

// Cart Item model (for frontend use)
export interface CartItem extends Omit<OrderItem, 'id' | 'orderId'> {
  qty: number;
}
