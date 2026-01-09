import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  onLogout?: () => void;
  onUploadClick?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, onLogout, onUploadClick }) => {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-cyber-900 text-slate-300 selection:bg-cyber-cyan selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-cyber-900/80 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-8 bg-gradient-to-b from-cyber-cyan to-blue-600"></div>
              <h1 className="text-xl font-bold tracking-wider text-white uppercase hidden sm:block">
                Orange & Equinix <span className="text-cyber-cyan font-light">Billing Info</span>
              </h1>
              <h1 className="text-xl font-bold tracking-wider text-white uppercase sm:hidden">
                O&E <span className="text-cyber-cyan font-light">Billing</span>
              </h1>
            </div>
            
            <div className="flex items-center gap-4">
              {onUploadClick && (
                <button 
                  onClick={onUploadClick}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-mono font-bold text-cyber-900 bg-cyber-cyan hover:bg-cyan-300 rounded transition-colors uppercase tracking-wider"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                  Upload Data
                </button>
              )}
              
              {onLogout && (
                <button 
                  onClick={onLogout}
                  className="px-4 py-2 text-xs font-mono border border-slate-600 rounded hover:bg-white/5 hover:border-red-500 hover:text-red-400 transition-colors text-slate-400"
                >
                  LOGOUT
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-cyber-900/0 to-cyber-900 pointer-events-none"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-cyber-900 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <img 
                src="https://bsccl.com.bd/uploads/site/logo.webp" 
                alt="BSCCL Logo" 
                className="h-10 w-auto opacity-80 hover:opacity-100 transition-opacity" 
              />
              <span className="text-xs text-slate-500 font-mono border-l border-slate-700 pl-4">
                Secure Billing Portal v2.5
              </span>
            </div>
            <div className="text-xs text-slate-500 font-mono">
              Developed by <span className="text-cyber-cyan">Muminur</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;