import { Invoice, Vendor } from './types';

// Data extracted specifically from the provided OCR/PDF content
export const INVOICE_DATA: Invoice[] = [
  // --- ORANGE INVOICES ---
  {
    id: "5210535475",
    vendor: Vendor.ORANGE,
    date: "17 Nov 2025",
    dueDate: "17 Dec 2025",
    currency: "USD",
    totalAmount: 1300.00,
    items: [
      {
        id: "IPL-20G-001",
        description: "IPL Essential - Link 20 Gbits/s",
        details: "SINGAPORE - SINGAPORE (LD: LD020851 LD020852)",
        quantity: 1,
        unitPrice: 1300.00,
        totalPrice: 1300.00,
        period: "01 Nov 2025 - 30 Nov 2025"
      }
    ]
  },
  {
    id: "5210535759",
    vendor: Vendor.ORANGE,
    date: "26 Nov 2025",
    dueDate: "26 Dec 2025",
    currency: "USD",
    totalAmount: 1282.89,
    items: [
      {
        id: "IPL-CLOSED-002",
        description: "IPL Essential - Contract 2023-0461 closed",
        details: "LD: LD020856 855",
        quantity: 1,
        unitPrice: 1282.89,
        totalPrice: 1282.89,
        period: "31 Oct 2025 - 26 Nov 2025"
      }
    ]
  },

  // --- EQUINIX INVOICES ---
  {
    id: "140210338475",
    vendor: Vendor.EQUINIX,
    date: "01-Nov-2025",
    dueDate: "01-Dec-2025",
    currency: "USD",
    totalAmount: 7662.08,
    items: [
      {
        id: "CAB-001",
        description: "Space - Secure Cabinet With kVA Based Power",
        details: "Cab: 040010 (4 kVA)",
        quantity: 1,
        unitPrice: 1337.06,
        totalPrice: 1337.06,
        period: "01-Nov-25 To 30-Nov-25"
      },
      {
        id: "PWR-001",
        description: "Power - AC Power (4 kVA)",
        details: "Loc: 040010",
        quantity: 1,
        unitPrice: 1480.32,
        totalPrice: 1480.32,
        period: "01-Nov-25 To 30-Nov-25"
      },
      // Aggregated for brevity based on PDF logic (Items 3.1 - 3.4)
      {
        id: "XC-SMW5-A",
        description: "Cross Connect - SM Fiber (SingTel)",
        details: "SQ-290052495 (Batch of 4)",
        quantity: 4,
        unitPrice: 331.80,
        totalPrice: 1327.20,
        period: "01-Nov-25 To 30-Nov-25"
      },
      // Item 4
      {
        id: "XC-SMW5-B",
        description: "Cross Connect - SM Fiber (SingTel)",
        details: "CID: EQ3/KKT/10GLAN/0102",
        quantity: 1,
        unitPrice: 304.50,
        totalPrice: 304.50,
        period: "01-Nov-25 To 30-Nov-25"
      },
      // Items 5.1 - 5.9
      {
        id: "XC-SMW5-C",
        description: "Cross Connect - SM Fiber (SingTel)",
        details: "Various CIDs (Batch of 9)",
        quantity: 9,
        unitPrice: 267.75,
        totalPrice: 2409.75,
        period: "01-Nov-25 To 30-Nov-25"
      },
       // Items 6.1 - 6.3
       {
        id: "XC-CAMPUS",
        description: "Cross Connect - SM Fiber (Campus)",
        details: "CID: EQUINIX (SINGAPORE) Batch of 3",
        quantity: 3,
        unitPrice: 267.75,
        totalPrice: 803.25,
        period: "01-Nov-25 To 30-Nov-25"
      }
    ]
  },
  {
    id: "140210338476",
    vendor: Vendor.EQUINIX,
    date: "01-Nov-2025",
    dueDate: "01-Dec-2025",
    currency: "USD",
    totalAmount: 314.00,
    items: [
      {
        id: "XC-TELSTRA",
        description: "Cross Connect - SM Fiber",
        details: "CID: SNG COLO RACK 9653034 (Telstra)",
        quantity: 1,
        unitPrice: 314.00,
        totalPrice: 314.00,
        period: "01-Nov-25 To 30-Nov-25"
      }
    ]
  },
  {
    id: "140210338478",
    vendor: Vendor.EQUINIX,
    date: "01-Nov-2025",
    dueDate: "01-Dec-2025",
    currency: "USD",
    totalAmount: 6300.00,
    items: [
      {
        id: "IX-PORT-100G",
        description: "Equinix Internet Exchange - Port (100G)",
        details: "Loc: 040010 (Batch of 2)",
        quantity: 2,
        unitPrice: 3150.00,
        totalPrice: 6300.00,
        period: "01-Nov-25 To 30-Nov-25"
      }
    ]
  }
];