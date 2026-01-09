import React, { useState, useEffect, useMemo } from 'react';
import Layout from './components/Layout';
import Login from './components/Login';
import SummaryTable from './components/SummaryTable';
import MonthSelector from './components/MonthSelector';
import UploadModal from './components/UploadModal';
import DeleteConfirmationModal from './components/DeleteConfirmationModal';
import { StorageService } from './utils/storage';
import { Invoice, Vendor } from './types';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [currentMonth, setCurrentMonth] = useState<string>('December 2025');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const loadedInvoices = await StorageService.getInvoices();
      setInvoices(loadedInvoices);
      
      // Auto-select the most recent month if we have data
      if (loadedInvoices.length > 0) {
        const months = StorageService.getAvailableMonths(loadedInvoices);
        const sortedMonths = months.sort((a, b) => {
          const dateA = new Date(`01 ${a}`).getTime();
          const dateB = new Date(`01 ${b}`).getTime();
          return dateB - dateA; // Descending
        });
        
        if (sortedMonths.length > 0) {
          setCurrentMonth(sortedMonths[0]);
        }
      }
      
      setIsLoading(false);
    };

    if (isLoggedIn) {
      loadData();
    }
  }, [isLoggedIn]);

  const availableMonths = useMemo(() => {
    const dataMonths = StorageService.getAvailableMonths(invoices);
    const defaultMonths = ['December 2025', 'November 2025', 'October 2025', 'September 2025'];
    const combined = Array.from(new Set([...dataMonths, ...defaultMonths]));
    
    return combined.sort((a, b) => {
      const dateA = new Date(`01 ${a}`).getTime();
      const dateB = new Date(`01 ${b}`).getTime();
      return dateB - dateA;
    });
  }, [invoices]);
  
  const filteredInvoices = useMemo(() => {
    if (!currentMonth) return [];
    return invoices.filter(inv => {
      const cleanDate = inv.date.replace(/-/g, ' ');
      const dateObj = new Date(cleanDate);
      if (isNaN(dateObj.getTime())) return false;
      const invMonth = dateObj.toLocaleString('en-US', { month: 'long', year: 'numeric' });
      return invMonth === currentMonth;
    });
  }, [invoices, currentMonth]);

  const orangeInvoices = filteredInvoices.filter(i => i.vendor === Vendor.ORANGE);
  const equinixInvoices = filteredInvoices.filter(i => i.vendor === Vendor.EQUINIX);
  const grandTotal = filteredInvoices.reduce((sum, item) => sum + item.totalAmount, 0);

  const handleUploadComplete = async (newInvoices: Invoice[]) => {
    setIsLoading(true);
    await StorageService.saveInvoices(newInvoices);
    const updated = await StorageService.getInvoices();
    setInvoices(updated);
    
    if (newInvoices.length > 0) {
      const cleanDate = newInvoices[0].date.replace(/-/g, ' ');
      const newMonth = new Date(cleanDate).toLocaleString('en-US', { month: 'long', year: 'numeric' });
      setCurrentMonth(newMonth);
    }
    
    setIsUploadModalOpen(false);
    setIsLoading(false);
  };

  const handleDeleteMonth = async () => {
    setIsDeleteModalOpen(false);
    setIsLoading(true);
    try {
      await StorageService.deleteMonth(currentMonth);
      const updated = await StorageService.getInvoices();
      setInvoices(updated);
    } catch (error) {
      console.error("Failed to delete month", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isLoggedIn) {
    return <Login onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <Layout 
      onLogout={() => setIsLoggedIn(false)}
      onUploadClick={() => setIsUploadModalOpen(true)}
    >
      {isLoading && (
        <div className="fixed inset-0 bg-cyber-900/50 backdrop-blur-sm z-40 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-cyber-cyan/30 border-t-cyber-cyan rounded-full animate-spin"></div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between md:items-start gap-4 mb-2">
         <div className="flex-grow overflow-hidden">
           <MonthSelector availableMonths={availableMonths} currentMonth={currentMonth} onSelect={setCurrentMonth} />
         </div>
         {filteredInvoices.length > 0 && (
           <button onClick={() => setIsDeleteModalOpen(true)} className="whitespace-nowrap px-4 py-2 rounded border border-red-900/50 text-red-500/70 text-xs font-mono hover:bg-red-900/10 hover:text-red-400 hover:border-red-500/50 transition-all flex items-center gap-2">
             <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
             DELETE DATA
           </button>
         )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-cyber-800/40 border border-slate-700 p-6 rounded-lg relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
             <svg className="w-24 h-24 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z"/></svg>
          </div>
          <h3 className="text-slate-400 font-mono text-xs uppercase tracking-widest mb-2">Grand Total ({currentMonth})</h3>
          <p className="text-4xl font-bold text-white font-mono">
            USD {grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-cyber-800/40 border-l-4 border-cyber-orange p-6 rounded-r-lg">
           <h3 className="text-cyber-orange font-mono text-xs uppercase tracking-widest mb-2">Orange Total</h3>
           <p className="text-2xl font-bold text-slate-200 font-mono">
             USD {orangeInvoices.reduce((s, i) => s + i.totalAmount, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
           </p>
           <p className="text-xs text-slate-500 mt-2">{orangeInvoices.length} Invoices Found</p>
        </div>
        <div className="bg-cyber-800/40 border-l-4 border-cyber-cyan p-6 rounded-r-lg">
           <h3 className="text-cyber-cyan font-mono text-xs uppercase tracking-widest mb-2">Equinix Total</h3>
           <p className="text-2xl font-bold text-slate-200 font-mono">
             USD {equinixInvoices.reduce((s, i) => s + i.totalAmount, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
           </p>
           <p className="text-xs text-slate-500 mt-2">{equinixInvoices.length} Invoices Found</p>
        </div>
      </div>

      <div className="space-y-16">
        {orangeInvoices.length > 0 && <SummaryTable vendor={Vendor.ORANGE} invoices={orangeInvoices} />}
        {equinixInvoices.length > 0 && <SummaryTable vendor={Vendor.EQUINIX} invoices={equinixInvoices} />}
        {orangeInvoices.length === 0 && equinixInvoices.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 border border-dashed border-slate-700/50 rounded-lg bg-cyber-800/20">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
            </div>
            <p className="text-slate-400 font-mono text-lg mb-1">No data uploaded yet</p>
            <p className="text-slate-600 text-sm">There are no invoices available for {currentMonth}</p>
          </div>
        )}
      </div>

      {isUploadModalOpen && <UploadModal onClose={() => setIsUploadModalOpen(false)} onUploadComplete={handleUploadComplete} />}
      <DeleteConfirmationModal isOpen={isDeleteModalOpen} month={currentMonth} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleDeleteMonth} />
    </Layout>
  );
};

export default App;