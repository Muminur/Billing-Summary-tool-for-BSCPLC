import React, { useState, useRef } from 'react';
import { Vendor, Invoice, LineItem } from '../types';

interface UploadModalProps {
  onClose: () => void;
  onUploadComplete: (invoices: Invoice[]) => void;
}

const UploadModal: React.FC<UploadModalProps> = ({ onClose, onUploadComplete }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<'idle' | 'processing' | 'success'>('idle');
  const [fileCount, setFileCount] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Configuration State
  const currentYear = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toLocaleString('en-US', { month: 'long' }));
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [batchVendor, setBatchVendor] = useState<Vendor | 'AUTO'>('AUTO');

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const years = [currentYear - 1, currentYear, currentYear + 1];

  const extractTextFromPDF = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      // @ts-ignore
      if (!window.pdfjsLib) throw new Error("PDF.js not loaded");
      
      // @ts-ignore
      const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += ` ---PAGE ${i}--- ${pageText}`;
      }
      return fullText;
    } catch (e) {
      console.error("PDF Parse Error", e);
      return "";
    }
  };

  const parseEquinixInvoice = (text: string, filename: string): Invoice => {
    const idMatch = text.match(/Invoice\s*#\s*(\d+)/i) || text.match(/140\d{9}/);
    const id = idMatch ? idMatch[1] || idMatch[0] : `EQ-${Math.floor(Math.random()*10000)}`;

    const totalMatch = text.match(/Grand Total\s*-\s*([\d,]+\.\d{2})/i) || 
                       text.match(/Invoice Total Due\s*([\d,]+\.\d{2})/i) ||
                       text.match(/Total Charges\s*[\d,.]+\s*([\d,]+\.\d{2})/i);
    
    let totalAmount = 0;
    if (totalMatch) {
      totalAmount = parseFloat(totalMatch[1].replace(/,/g, ''));
    }

    const items: LineItem[] = [];
    const ccRegex = /Location:\s*([0-9]+.*?)\s*CID:\s*(.*?)(?=\s+\d+\.\d+|\s+CC|\s+SQ|\s+Product|\s*–)/gi;
    let ccMatch;
    let ccCount = 0;
    while ((ccMatch = ccRegex.exec(text)) !== null) {
      ccCount++;
      const location = ccMatch[1].trim();
      let cleanCid = ccMatch[2].trim();
      if (cleanCid.includes("CC00001")) cleanCid = cleanCid.split("CC00001")[0];

      const lookAhead = text.substring(ccMatch.index + ccMatch[0].length, ccMatch.index + ccMatch[0].length + 100);
      const priceMatch = lookAhead.match(/(\d{1,3}(?:,\d{3})*\.\d{2})/);
      const unitPrice = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : 0;

      items.push({
        id: `XC-${id}-${ccCount}`,
        description: "Cross Connect - SM Fiber",
        details: `${cleanCid} (${location})`,
        quantity: 1,
        unitPrice: unitPrice,
        totalPrice: unitPrice
      });
    }

    if (text.match(/Secure Cabinet/i)) {
      const cabMatch = text.match(/Secure Cabinet.*?Cabinet\s*\(\s*([\dkVA\s]+)\)/i);
      const cabDetails = cabMatch ? cabMatch[1] : "Standard";
      const priceMatch = text.match(/CAB\w+\s+\d+\s+([\d,]+\.\d{2})/);
      const unitPrice = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : 0;
      items.push({
        id: `CAB-${id}`, description: "Space - Secure Cabinet", details: `Power: ${cabDetails}`, quantity: 1, unitPrice: unitPrice, totalPrice: unitPrice
      });
    }

    if (text.match(/AC Power/i)) {
      const pwrMatch = text.match(/AC Power\s*\(\s*([\dkVA\s]+)\)/i);
      const pwrDetails = pwrMatch ? pwrMatch[1] : "";
      const priceMatch = text.match(/POW\w+\s+\d+\s+([\d,]+\.\d{2})/);
      const unitPrice = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : 0;
      items.push({
        id: `PWR-${id}`, description: "Power - AC Power", details: pwrDetails, quantity: 1, unitPrice: unitPrice, totalPrice: unitPrice
      });
    }

    if (text.match(/Equinix Internet Exchange/i)) {
      const ixMatch = text.match(/Equinix Internet Exchange\s*-\s*Port\s*\(\s*([^)]+)\)/i);
      const ixDetails = ixMatch ? ixMatch[1] : "100G";
      const priceMatch = text.match(/IX\w+\s+\d+\s+([\d,]+\.\d{2})/);
      const unitPrice = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : 0;
      const qtyMatch = text.match(/IX\w+\s+(\d+)\s+[\d,]+\.\d{2}/);
      const qty = qtyMatch ? parseInt(qtyMatch[1]) : 1;
      items.push({
        id: `IX-${id}`, description: `Equinix Internet Exchange - Port (${ixDetails})`, details: "Equinix IX", quantity: qty, unitPrice: unitPrice, totalPrice: unitPrice * qty
      });
    }

    if (items.length === 0 && totalAmount > 0) {
      items.push({
        id: "GENERIC", description: "Equinix Monthly Services", details: "Consolidated Charges", quantity: 1, unitPrice: totalAmount, totalPrice: totalAmount
      });
    }

    return {
      id: id,
      vendor: Vendor.EQUINIX,
      date: `01 ${selectedMonth} ${selectedYear}`,
      currency: "USD",
      totalAmount: totalAmount,
      items: items
    };
  };

  const parseOrangeInvoice = (text: string, filename: string): Invoice => {
    const refMatch = text.match(/reference\s*:\s*(\d+)/i) || text.match(/invoice n\S*\s*:\s*(\d+)/i);
    const id = refMatch ? refMatch[1] : `OR-${Math.floor(Math.random()*10000)}`;

    let totalAmount = 0;
    
    // Strict regex to match amounts:
    // 1. \d{1,3}(?:\s\d{3})+   -> Matches numbers with space separators (e.g., 1 300)
    // 2. \d+                   -> Matches numbers without separators (e.g., 1300)
    // 3. [.,]\d{2}             -> Followed by decimal part (e.g., .00)
    // This prevents greedy matching of unconnected digits (like 181 prefixing the amount).
    const amountPattern = /((?:\d{1,3}(?:\s\d{3})+|\d+)[.,]\d{2})/;

    // Strategy 1: Look for "IPL Essential ... USD [Code] Amount" (Line Item)
    // We strictly look for the amount pattern at the end of the line item
    const lineItemRegex = new RegExp(`IPL Essential.*?USD\\s+(?:[A-Z0-9]+\\s+)?${amountPattern.source}`, 'i');
    const lineItemMatch = text.match(lineItemRegex);
    if (lineItemMatch) {
        const cleaned = lineItemMatch[1].replace(/\s/g, '').replace(/,/g, '.');
        const val = parseFloat(cleaned);
        if (!isNaN(val) && val > 0) totalAmount = val;
    }

    // Strategy 2: Look for Total lines with keywords
    if (totalAmount === 0) {
        const keywords = ["amount due before", "total invoiced amount", "TOTAL"];
        for (const kw of keywords) {
          // Look for keyword, optional text, optional currency, then STRICT amount
          const regex = new RegExp(`${kw}.*?(?:USD)?\\s*${amountPattern.source}`, 'i');
          const match = text.match(regex);
          if (match) {
            const cleaned = match[1].replace(/\s/g, '').replace(/,/g, '.');
            const val = parseFloat(cleaned);
            if (!isNaN(val) && val > 0) {
              totalAmount = val;
              break;
            }
          }
        }
    }

    // Strategy 3: Look for "Amount USD" pattern (common on summary pages)
    if (totalAmount === 0) {
      const p3Regex = new RegExp(`${amountPattern.source}\\s+USD`, 'i');
      const p3Match = text.match(p3Regex);
      if (p3Match) {
        const val = parseFloat(p3Match[1].replace(/\s/g, '').replace(/,/g, '.'));
        if (!isNaN(val) && val > 0) totalAmount = val;
      }
    }
    
    // Strategy 4: Fallback - Look for isolated "USD Amount" pattern
    if (totalAmount === 0) {
        const fallbackRegex = new RegExp(`USD\\s+${amountPattern.source}`, 'i');
        const fallbackMatch = text.match(fallbackRegex);
        if (fallbackMatch) {
            const val = parseFloat(fallbackMatch[1].replace(/\s/g, '').replace(/,/g, '.'));
             if (!isNaN(val) && val > 0) totalAmount = val;
        }
    }

    const items: LineItem[] = [];
    const ldMatch = text.match(/LD\s*:\s*([A-Z0-9\s]+?)(?=\s+city|\s+capacity|\s+MONTHLY|\s+LD|\s*$)/i);
    const ldDetails = ldMatch ? ldMatch[1].trim() : "Details not found in PDF";

    const capMatch = text.match(/(?:capacity|Link)\s+(\d+\s*Gb[a-z]*)/i);
    const speed = capMatch ? capMatch[1].replace('Gbi', 'Gbps') : "";
    
    const isClosed = text.toLowerCase().includes("closed") || text.toLowerCase().includes("contract closed");

    let description = "IPL Essential Service";
    if (isClosed) description = "IPL Essential - Contract Closed";
    else if (speed) description = `IPL Essential - ${speed}`;

    items.push({
        id: `OR-${id}-1`,
        description: description,
        details: `LD: ${ldDetails}`,
        quantity: 1,
        unitPrice: totalAmount,
        totalPrice: totalAmount,
        period: `01 ${selectedMonth} ${selectedYear} - 30 ${selectedMonth} ${selectedYear}`
    });

    return {
      id: id,
      vendor: Vendor.ORANGE,
      date: `01 ${selectedMonth} ${selectedYear}`,
      currency: "USD",
      totalAmount: totalAmount,
      items: items
    };
  };

  const processFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter(f => f.type === 'application/pdf');
    if (fileArray.length === 0) return;

    setFileCount(fileArray.length);
    setProcessedCount(0);
    setStatus('processing');

    const newInvoices: Invoice[] = [];

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      const text = await extractTextFromPDF(file);
      
      let vendor = batchVendor;
      if (vendor === 'AUTO') {
        if (text.includes("Equinix") || file.name.toLowerCase().includes("equinix")) {
          vendor = Vendor.EQUINIX;
        } else if (text.includes("Orange") || file.name.toLowerCase().includes("orange")) {
          vendor = Vendor.ORANGE;
        } else {
          if (text.includes("IBX") || text.includes("Cross Connect")) vendor = Vendor.EQUINIX;
          else if (text.includes("IPL") || text.includes("BSCCL")) vendor = Vendor.ORANGE;
          else vendor = Vendor.EQUINIX;
        }
      }

      let invoice: Invoice;
      if (vendor === Vendor.EQUINIX) {
        invoice = parseEquinixInvoice(text, file.name);
      } else {
        invoice = parseOrangeInvoice(text, file.name);
      }

      invoice.items.forEach(item => {
        item.period = `01 ${selectedMonth} ${selectedYear} - 30 ${selectedMonth} ${selectedYear}`;
      });

      newInvoices.push(invoice);
      setProcessedCount(prev => prev + 1);
    }

    setStatus('success');
    setTimeout(() => {
      onUploadComplete(newInvoices);
    }, 1000);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-cyber-900 border border-slate-700 rounded-xl relative overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <h3 className="text-white font-bold tracking-wider">UPLOAD INVOICES</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        <div className="p-8">
          {status === 'idle' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-mono text-slate-500 mb-1 uppercase">Billing Month</label>
                    <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="w-full bg-black/40 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:border-cyber-cyan outline-none">
                      {months.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                 </div>
                 <div>
                    <label className="block text-xs font-mono text-slate-500 mb-1 uppercase">Billing Year</label>
                    <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="w-full bg-black/40 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:border-cyber-cyan outline-none">
                      {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                 </div>
                 <div className="col-span-2">
                    <label className="block text-xs font-mono text-slate-500 mb-1 uppercase">Vendor Assignment</label>
                    <select value={batchVendor} onChange={(e) => setBatchVendor(e.target.value as Vendor | 'AUTO')} className="w-full bg-black/40 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:border-cyber-cyan outline-none">
                      <option value="AUTO">Auto-Detect (Text Analysis)</option>
                      <option value={Vendor.EQUINIX}>Force Equinix</option>
                      <option value={Vendor.ORANGE}>Force Orange</option>
                    </select>
                 </div>
              </div>
              <div onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={onDrop} onClick={() => fileInputRef.current?.click()} className={`border-2 border-dashed rounded-xl h-40 flex flex-col items-center justify-center cursor-pointer transition-all ${isDragging ? 'border-cyber-cyan bg-cyber-cyan/10' : 'border-slate-700 hover:border-cyber-cyan hover:bg-white/5'}`}>
                <input type="file" ref={fileInputRef} className="hidden" accept=".pdf" multiple onChange={handleFileSelect} />
                <svg className="w-8 h-8 text-slate-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                <p className="text-sm text-slate-400 font-mono text-center">
                  <span className="text-cyber-cyan">Click to upload</span> or drag and drop<br/>
                  Multiple PDF files supported
                </p>
              </div>
            </div>
          )}
          {status === 'processing' && (
            <div className="h-48 flex flex-col items-center justify-center relative">
               <div className="w-16 h-16 border-4 border-cyber-cyan/30 border-t-cyber-cyan rounded-full animate-spin mb-4"></div>
               <p className="text-cyber-cyan font-mono text-sm animate-pulse mb-2">EXTRACTING DATA...</p>
               <p className="text-slate-400 text-xs font-mono">File {processedCount + 1} of {fileCount}</p>
               <div className="w-full max-w-[200px] h-1 bg-slate-800 rounded-full mt-4 overflow-hidden">
                 <div className="h-full bg-cyber-cyan transition-all duration-300" style={{ width: `${((processedCount) / fileCount) * 100}%` }}></div>
               </div>
            </div>
          )}
          {status === 'success' && (
            <div className="h-48 flex flex-col items-center justify-center">
               <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4 border border-green-500/50">
                 <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
               </div>
               <p className="text-green-400 font-mono text-sm font-bold">SUCCESS</p>
               <p className="text-xs text-slate-500 mt-2">Processed {fileCount} invoices</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadModal;