
export type UserRole = "owner" | "coordinator" | "factory" | "administrator";

export type OrderStatus = "Pending" | "Working" | "Completed" | "Billed" | "Delivered";

export type LineItem = {
  id: string;
  description: string;
  quantity: number;
  price: number;
  hsn: string;
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
  id:string;
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
    id: string;
    name: string;
    email?: string;
    address?: string;
    dealerId?: string;
    gstin?: string;
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
  totalGstRate?: number;
  sgstAmount?: number;
  cgstAmount?: number;
  totalGstAmount?: number;
  totalAmount?: number;
  payments?: Payment[];
  paidAmount?: number;
  balanceDue?: number;
  paymentStatus?: PaymentStatus;
  reference?: string;
  irn?: string;
  qrCodeUrl?: string;
};

export type User = {
    id: string;
    username: string;
    password: string;
    role: UserRole;
};

export type StockStatus = "In Stock" | "Low Stock" | "Out of Stock";

export type StockItem = {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  reorderLevel: number;
  status: StockStatus;
  locationId?: string;
  locationName?: string;
};

export type RawMaterial = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  locationId?: string;
  locationName?: string;
}

export type LedgerGroup =
  | 'Sundry Debtors'   // Customers, Dealers
  | 'Sundry Creditors' // Suppliers
  | 'Bank Accounts'
  | 'Capital Account'
  | 'Direct Expenses'
  | 'Indirect Expenses'
  | 'Direct Incomes'
  | 'Indirect Incomes'
  | 'Fixed Assets'
  | 'Current Assets'
  | 'Cash-in-hand'
  | 'Loans (Liability)'
  | 'Current Liabilities'
  | 'Sales Accounts'
  | 'Purchase Accounts'
  | 'Duties & Taxes'
  | 'Stock-in-Hand'
  | 'Primary'; // For P&L account

export type Ledger = {
  id: string;
  name: string;
  group: LedgerGroup;
  email?: string;
  address?: string;
  dealerId?: string;
  gstin?: string;
  openingBalance?: number;
};

export type Purchase = {
    id:string;
    supplierId: string;
    supplierName: string;
    billNumber: string;
    date: string;
    items: {
        id: string;
        name: string;
        hsn?: string;
        quantity: number;
        price: number;
    }[];
    totalAmount: number;
    payments?: Payment[];
    paidAmount?: number;
    balanceDue?: number;
    paymentStatus?: PaymentStatus;
};

export type LedgerEntryType = 'Sales' | 'Purchase' | 'Receipt' | 'Payment';

export type LedgerEntry = {
    id: string;
    date: string;
    // The account being affected (e.g., customer, supplier, sales, purchase)
    accountId: string;
    accountName: string;
    type: LedgerEntryType;
    details: string; // e.g., "Inv #INV-123", "Payment for Bill #B-456"
    debit: number; // Amount in
    credit: number; // Amount out
    refId: string; // The ID of the order, purchase, or payment that generated this entry
};

export type Company = {
  id: string;
  name: string;
  financialYearStart: string;
  financialYearEnd:string;
};

export type Location = {
  id: string;
  name: string;
  address?: string;
};

export type CatalogItem = {
  id: string;
  name: string;
  sku: string;
  description?: string;
  photoDataUrl?: string;
};
