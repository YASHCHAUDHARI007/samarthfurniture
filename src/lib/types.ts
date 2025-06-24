
export type UserRole = "owner" | "coordinator" | "factory" | "administrator";

export type OrderStatus = "Pending" | "Working" | "Completed" | "Billed" | "Delivered";

export type LineItem = {
  id: string;
  description: string;
  quantity: number;
  price: number;
};

export type Payment = {
  id: string;
  date: string;
  amount: number;
  method: 'Cash' | 'UPI' | 'Bank Transfer' | 'Other';
  notes?: string;
};

export type PaymentStatus = 'Unpaid' | 'Partially Paid' | 'Paid';

export type Order = {
  id: string;
  customer: string;
  item: string;
  status: OrderStatus;
  type: "Customized" | "Dealer";
  details: string;
  createdBy?: string;
  createdAt?: string;
  deliveredAt?: string;
  stockDeducted?: boolean;
  dimensions?: {
    height?: string;
    width?: string;
    depth?: string;
  };
  dimensionDetails?: string;
  photoDataUrl?: string;
  customerInfo?: {
    name: string;
    email?: string;
    address?: string;
    dealerId?: string;
  };
  transportDetails?: {
    driverName: string;
    driverContact: string;
    vehicleNumber: string;
    vehicleModel: string;
  };
  invoiceNumber?: string;
  invoiceDate?: string;
  lineItems?: LineItem[];
  subTotal?: number;
  gstRate?: number;
  gstAmount?: number;
  totalAmount?: number;
  payments?: Payment[];
  paidAmount?: number;
  balanceDue?: number;
  paymentStatus?: PaymentStatus;
};

export type User = {
    id: string;
    username: string;
    password: string;
    role: UserRole;
};

export type Product = {
  id: string;
  name: string;
  sku: string;
  image: string;
  aiHint: string;
};

export type StockStatus = "In Stock" | "Low Stock" | "Out of Stock";

export type StockItem = {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  reorderLevel: number;
  status: StockStatus;
};

export type RawMaterial = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}

export type Customer = {
  id: string;
  name: string;
  type: 'Customer' | 'Dealer';
  email?: string;
  address?: string;
  dealerId?: string;
};
