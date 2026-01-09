import React from 'react';
import { Invoice, Vendor } from '../types';

interface SummaryTableProps {
  vendor: Vendor;
  invoices: Invoice[];
}

const SummaryTable: React.FC<SummaryTableProps> = ({ vendor, invoices }) => {
  const totalAmount = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const currency = invoices[0]?.currency || 'USD';
  
  // Theme colors based on vendor
  const accentColor = vendor === Vendor.ORANGE ? 'text-cyber-orange' : 'text-cyber-cyan';
  const borderColor = vendor === Vendor.ORANGE ? 'border-cyber-orange/30' : 'border-cyber-cyan/30';
  const bgGradient = vendor === Vendor.ORANGE 
    ? 'from-orange-500/10 to-transparent' 
    : 'from-cyan-500/10 to-transparent';

  return (
    <div className="mb-12">
      {/* Header Section */}
      <div className={`flex justify-between items-end mb-4 pb-2 border-b ${borderColor}`}>
        <div>
          <h2 className="text-2xl font-bold text-white uppercase tracking-widest">{vendor}</h2>
          <p className="text-xs text-slate-400 font-mono mt-1">INVOICE BREAKDOWN & CIRCUIT DETAILS</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400 font-mono mb-1">TOTAL INVOICED</p>
          <p className={`text-3xl font-mono font-bold ${accentColor}`}>
            {currency} {totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Cards/Table Container */}
      <div className="grid gap-6">
        {invoices.map((inv) => (
          <div key={inv.id} className="bg-cyber-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg overflow-hidden">
            {/* Invoice Header */}
            <div className={`px-6 py-3 bg-gradient-to-r ${bgGradient} border-b border-slate-700/50 flex justify-between items-center`}>
              <div className="flex gap-4 items-center">
                <span className="font-mono text-sm text-slate-300 bg-black/20 px-2 py-1 rounded border border-white/5">
                  #{inv.id}
                </span>
                <span className="text-sm text-slate-400">
                  {inv.date}
                </span>
              </div>
              <span className="font-mono font-bold text-white">
                {inv.currency} {inv.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* Circuit Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-700/50 bg-black/20 text-slate-400 font-mono text-xs uppercase">
                    <th className="px-6 py-3 font-medium">Description</th>
                    <th className="px-6 py-3 font-medium">Details (Circuit/Ref)</th>
                    <th className="px-6 py-3 font-medium text-center">Period</th>
                    <th className="px-6 py-3 font-medium text-right">Qty</th>
                    <th className="px-6 py-3 font-medium text-right">Unit Price</th>
                    <th className="px-6 py-3 font-medium text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/30">
                  {inv.items.map((item, idx) => (
                    <tr key={`${inv.id}-${idx}`} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-3 text-slate-200 font-medium">
                        {item.description}
                      </td>
                      <td className="px-6 py-3 text-slate-400 font-mono text-xs">
                        {item.details}
                      </td>
                      <td className="px-6 py-3 text-slate-500 text-xs text-center whitespace-nowrap">
                        {item.period || '-'}
                      </td>
                      <td className="px-6 py-3 text-slate-300 text-right font-mono">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-3 text-slate-400 text-right font-mono text-xs">
                        {item.unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-3 text-white text-right font-mono font-bold">
                        {item.totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SummaryTable;