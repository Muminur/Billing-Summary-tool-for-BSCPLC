import React, { useState } from 'react';
import Layout from './Layout';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '1212') {
      onLogin();
    } else {
      setError(true);
      setPassword('');
    }
  };

  return (
    <Layout>
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="bg-cyber-800/50 backdrop-blur-md border border-slate-700 p-8 rounded-2xl shadow-2xl relative overflow-hidden">
            {/* Decorative Corner */}
            <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-cyber-cyan rounded-tl-2xl opacity-50"></div>
            
            <h2 className="text-2xl font-bold text-center text-white mb-2 tracking-wider">SECURE ACCESS</h2>
            <p className="text-center text-slate-400 text-sm mb-8 font-mono">Billing Information Portal</p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-mono text-cyber-cyan mb-2 uppercase tracking-widest">
                  Authorization Code
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(false);
                  }}
                  className="w-full bg-black/40 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-cyber-cyan focus:ring-1 focus:ring-cyber-cyan font-mono text-center tracking-[0.5em] transition-all"
                  placeholder="••••"
                  autoFocus
                />
              </div>

              {error && (
                <div className="text-red-500 text-xs text-center font-mono bg-red-500/10 py-2 rounded border border-red-500/20">
                  ACCESS DENIED: INVALID CREDENTIALS
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-cyber-cyan/10 hover:bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/50 font-bold py-3 px-4 rounded-lg transition-all uppercase tracking-widest text-sm hover:shadow-[0_0_15px_rgba(6,182,212,0.3)]"
              >
                Enter Portal
              </button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Login;