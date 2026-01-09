import React from 'react';

interface MonthSelectorProps {
  availableMonths: string[];
  currentMonth: string;
  onSelect: (month: string) => void;
}

const MonthSelector: React.FC<MonthSelectorProps> = ({ availableMonths, currentMonth, onSelect }) => {
  return (
    <div className="flex items-center space-x-2 overflow-x-auto pb-4 mb-6 scrollbar-thin">
      <span className="text-slate-500 text-xs font-mono uppercase mr-2 whitespace-nowrap">Billing Period:</span>
      {availableMonths.map((month) => (
        <button
          key={month}
          onClick={() => onSelect(month)}
          className={`
            px-4 py-2 rounded-full text-xs font-mono whitespace-nowrap transition-all border
            ${month === currentMonth 
              ? 'bg-cyber-cyan/10 border-cyber-cyan text-cyber-cyan shadow-[0_0_10px_rgba(6,182,212,0.2)]' 
              : 'bg-transparent border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'
            }
          `}
        >
          {month}
        </button>
      ))}
    </div>
  );
};

export default MonthSelector;