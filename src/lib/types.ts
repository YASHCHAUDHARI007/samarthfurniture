
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
