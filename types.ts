export enum Vendor {
  ORANGE = 'Orange',
  EQUINIX = 'Equinix'
}

export interface LineItem {
  id: string;
  description: string;
  details: string; // Circuit ID, Cabinet ID, etc.
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  period?: string;
}

export interface Invoice {
  id: string; // Invoice Number
  vendor: Vendor;
  date: string;
  dueDate?: string;
  currency: string;
  totalAmount: number;
  items: LineItem[];
  _firestoreId?: string; // Internal Firebase Document ID
  _pendingSync?: boolean; // Flag for items that haven't been pushed to DB yet
}

export interface AggregatedSummary {
  vendor: Vendor;
  totalInvoiced: number;
  currency: string;
  invoices: Invoice[];
}