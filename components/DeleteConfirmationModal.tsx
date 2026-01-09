import React, { useState } from 'react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  month: string;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({ isOpen, onClose, onConfirm, month }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'freegp99') {
      onConfirm();
    } else {
      setError(true);
      setPassword('');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-cyber-900 border border-red-900/50 rounded-xl relative overflow-hidden shadow-[0_0_50px_rgba(220,38,38,0.1)]">
        
        {/* Warning Header */}
        <div className="bg-red-900/20 p-6 border-b border-red-500/20">
          <div className="flex items-center gap-3 text-red-500 mb-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            <h3 className="font-bold tracking-wider text-lg">DELETE DATA</h3>
          </div>
          <p className="text-red-400/80 text-xs font-mono">
            WARNING: This action will permanently remove all invoices for <span className="text-white font-bold">{month}</span>.
          </p>
        </div>

        {/* Content */}
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-mono text-slate-500 mb-2 uppercase tracking-widest">
                Admin Confirmation Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(false);
                }}
                className="w-full bg-black/40 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-700 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 font-mono transition-all"
                placeholder="Required for deletion"
                autoFocus
              />
            </div>

            {error && (
              <div className="text-red-500 text-xs text-center font-mono bg-red-500/10 py-2 rounded border border-red-500/20">
                INCORRECT PASSWORD
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs py-3 rounded-lg transition-colors uppercase tracking-wider"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-lg transition-all uppercase tracking-wider text-xs shadow-[0_0_15px_rgba(220,38,38,0.4)]"
              >
                Confirm Delete
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;