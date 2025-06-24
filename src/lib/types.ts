
export type UserRole = "owner" | "coordinator" | "factory" | "administrator";

export type OrderStatus = "Pending" | "Working" | "Completed" | "Delivered";

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
};

export type User = {
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
