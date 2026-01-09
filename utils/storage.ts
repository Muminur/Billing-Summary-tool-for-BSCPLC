import { db } from '../firebaseConfig';
import { collection, getDocs, addDoc, writeBatch, doc, deleteDoc, setDoc } from 'firebase/firestore';
import { Invoice, Vendor } from '../types';

const COLLECTION_NAME = 'invoices';
const LOCAL_STORAGE_KEY = 'billing_portal_invoices';

// Seed Data (November Only - No Mock Historical Data)
// Marked as _pendingSync: true so they get uploaded to DB on first run if missing
const SEED_DATA: Invoice[] = [
  // --- ORANGE INVOICES ---
  {
    id: "5210535475",
    vendor: Vendor.ORANGE,
    date: "17 Nov 2025",
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
    ],
    _pendingSync: true
  },
  {
    id: "5210535759",
    vendor: Vendor.ORANGE,
    date: "26 Nov 2025",
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
    ],
    _pendingSync: true
  },
  // --- EQUINIX INVOICES ---
  {
    id: "140210338475",
    vendor: Vendor.EQUINIX,
    date: "01-Nov-2025",
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
      {
        id: "XC-SMW5-A",
        description: "Cross Connect - SM Fiber (SingTel)",
        details: "SQ-290052495 (Batch of 4)",
        quantity: 4,
        unitPrice: 331.80,
        totalPrice: 1327.20,
        period: "01-Nov-25 To 30-Nov-25"
      }
    ],
    _pendingSync: true
  },
  {
    id: "140210338476",
    vendor: Vendor.EQUINIX,
    date: "01-Nov-2025",
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
    ],
    _pendingSync: true
  },
  {
    id: "140210338478",
    vendor: Vendor.EQUINIX,
    date: "01-Nov-2025",
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
    ],
    _pendingSync: true
  }
];

// Helper to load/save from localStorage
const loadLocal = (): Invoice[] => {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to load from local storage", e);
  }
  return [...SEED_DATA];
};

const saveLocal = (invoices: Invoice[]) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(invoices));
  } catch (e) {
    console.error("Failed to save to local storage", e);
  }
};

// Initialize local state
let localInvoices: Invoice[] = loadLocal();
let isFallbackMode = false;

// Sanitize ID for Firestore path (remove slashes)
const getSafeId = (id: string) => id.replace(/\//g, '_');

// Helper to remove undefined values which Firestore hates
const sanitizeForFirestore = (obj: any) => {
  return JSON.parse(JSON.stringify(obj));
};

export const StorageService = {
  // Initialize
  init: async () => {
    // No-op
  },

  getInvoices: async (): Promise<Invoice[]> => {
    // 1. Attempt to sync any pending local items (Retry logic)
    const pendingItems = localInvoices.filter(i => i._pendingSync);
    
    if (pendingItems.length > 0 && db && !isFallbackMode) {
      try {
        console.log(`Attempting to sync ${pendingItems.length} pending items...`);
        const batch = writeBatch(db);
        pendingItems.forEach(inv => {
           const safeId = getSafeId(inv.id);
           const docRef = doc(db, COLLECTION_NAME, safeId);
           // Remove internal flags before sending to DB
           const { _pendingSync, _firestoreId, ...cleanInv } = inv;
           // Sanitize to remove undefineds
           batch.set(docRef, sanitizeForFirestore(cleanInv));
        });
        await batch.commit();
        
        // Mark locally as synced
        const syncedIds = new Set(pendingItems.map(i => i.id));
        localInvoices = localInvoices.map(inv => {
          if (syncedIds.has(inv.id)) {
            const { _pendingSync, ...clean } = inv;
            return clean;
          }
          return inv;
        });
        saveLocal(localInvoices);
        console.log("Sync successful");
      } catch (e) {
        console.warn("Auto-sync failed (will retry later):", e);
      }
    }

    // 2. Fetch Remote Data
    if (isFallbackMode) {
      return localInvoices;
    }

    try {
      if (!db) throw new Error("Database not initialized");
      
      const snapshot = await getDocs(collection(db, COLLECTION_NAME));
      const remoteData = snapshot.docs.map(doc => {
        const data = doc.data() as Invoice;
        return { ...data, _firestoreId: doc.id };
      });
      
      // 3. Merge Remote with Local Pending
      // We index remote data by ID for easier lookup
      const remoteMap = new Map(remoteData.map(i => [i.id, i]));
      
      // We keep local pending items if they haven't been synced to remote yet
      // If a pending item ID exists in remote, we assume remote is newer/synced and use remote
      const mergedInvoices: Invoice[] = [...remoteData];
      
      localInvoices.forEach(localInv => {
        if (localInv._pendingSync && !remoteMap.has(localInv.id)) {
           // Check if this ID is already in merged (prevent duplicates)
           const exists = mergedInvoices.some(m => m.id === localInv.id);
           if (!exists) {
             mergedInvoices.push(localInv);
           }
        }
      });
      
      localInvoices = mergedInvoices;
      saveLocal(localInvoices);
      
      return mergedInvoices;
      
    } catch (e: any) {
      console.warn("Firebase Fetch Error (Using Local Data):", e.message || e);
      // We don't necessarily set fallbackMode=true forever, just return local for now
      return localInvoices;
    }
  },

  saveInvoice: async (invoice: Invoice) => {
    // Mark as pending sync
    const pendingInvoice = { ...invoice, _pendingSync: true };
    localInvoices.push(pendingInvoice);
    saveLocal(localInvoices);

    if (isFallbackMode) return;

    try {
      if (!db) throw new Error("Database not initialized");
      
      const safeId = getSafeId(invoice.id);
      const docRef = doc(db, COLLECTION_NAME, safeId);
      const { _pendingSync, _firestoreId, ...cleanInv } = pendingInvoice;
      
      // Use setDoc to support upsert/idempotency
      // Sanitize to remove undefineds
      await setDoc(docRef, sanitizeForFirestore(cleanInv));
      
      // Update local to remove pending flag
      localInvoices = localInvoices.map(inv => {
        if (inv.id === invoice.id) {
           const { _pendingSync, ...clean } = inv;
           return clean;
        }
        return inv;
      });
      saveLocal(localInvoices);
    } catch (e) {
      console.warn("Firebase Write Error (Saved Locally):", e);
    }
  },

  saveInvoices: async (invoices: Invoice[]) => {
    // 1. Mark new items as pending sync
    const newItems = invoices.map(i => ({...i, _pendingSync: true}));
    
    // 2. Save locally immediately
    // Filter out existing items with same ID to prevent local duplicates before sync
    const newIds = new Set(newItems.map(i => i.id));
    localInvoices = localInvoices.filter(i => !newIds.has(i.id));
    localInvoices = [...localInvoices, ...newItems];
    saveLocal(localInvoices);

    if (isFallbackMode) return;

    try {
      if (!db) throw new Error("Database not initialized");
      const batch = writeBatch(db);
      
      newItems.forEach(inv => {
        const safeId = getSafeId(inv.id);
        const docRef = doc(db, COLLECTION_NAME, safeId);
        const { _pendingSync, _firestoreId, ...cleanInv } = inv;
        // Sanitize to remove undefineds
        batch.set(docRef, sanitizeForFirestore(cleanInv));
      });

      await batch.commit();
      
      // 3. On success, remove pending flag locally
      const savedIds = new Set(newItems.map(i => i.id));
      localInvoices = localInvoices.map(inv => {
        if (savedIds.has(inv.id)) {
           const { _pendingSync, ...clean } = inv;
           return clean;
        }
        return inv;
      });
      saveLocal(localInvoices);

    } catch (e) {
      console.warn("Firebase Batch Write Error (Saved Locally - Will Retry on Reload):", e);
      // We do NOT set isFallbackMode=true here, so that getInvoices can try again later
    }
  },

  deleteMonth: async (monthYear: string): Promise<void> => {
    // 1. Perform deletion on local state immediately
    const initialCount = localInvoices.length;
    localInvoices = localInvoices.filter(inv => {
      const cleanDate = inv.date.replace(/-/g, ' ');
      const dateObj = new Date(cleanDate);
      if (isNaN(dateObj.getTime())) return true;
      
      const invMonth = dateObj.toLocaleString('en-US', { month: 'long', year: 'numeric' });
      return invMonth !== monthYear;
    });
    
    saveLocal(localInvoices);
    console.log(`Locally deleted ${initialCount - localInvoices.length} invoices`);

    if (isFallbackMode) return;

    // 2. Try to sync deletion to Firebase
    try {
      if (!db) throw new Error("Database not initialized");
      
      // We need to fetch from DB to get IDs to delete matching the criteria
      const snapshot = await getDocs(collection(db, COLLECTION_NAME));
      const batch = writeBatch(db);
      let count = 0;

      snapshot.docs.forEach((docSnapshot) => {
        const data = docSnapshot.data() as Invoice;
        const cleanDate = data.date.replace(/-/g, ' ');
        const dateObj = new Date(cleanDate);
        
        if (!isNaN(dateObj.getTime())) {
          const invMonth = dateObj.toLocaleString('en-US', { month: 'long', year: 'numeric' });
          if (invMonth === monthYear) {
            batch.delete(docSnapshot.ref);
            count++;
          }
        }
      });

      if (count > 0) {
        await batch.commit();
        console.log(`Synced deletion of ${count} invoices to Firebase`);
      }
    } catch (e) {
      console.warn("Firebase Delete Error (Local Only):", e);
      isFallbackMode = true;
    }
  },
  
  // Helper to extract unique Month-Year combinations
  getAvailableMonths: (invoices: Invoice[]): string[] => {
    const months = new Set<string>();
    invoices.forEach(inv => {
      // Parse date loosely since formats differ (17 Nov 2025 vs 01-Nov-2025)
      const cleanDate = inv.date.replace(/-/g, ' ');
      const dateObj = new Date(cleanDate);
      if (!isNaN(dateObj.getTime())) {
        const monthYear = dateObj.toLocaleString('en-US', { month: 'long', year: 'numeric' });
        months.add(monthYear);
      }
    });
    return Array.from(months);
  }
};