import React, { useState, useEffect } from 'react';

export default function CreateAdministrativeInterfaceComponent() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setData([
        { id: 1, name: 'Create Administrative Interface Record 1', status: 'Active' },
        { id: 2, name: 'Create Administrative Interface Record 2', status: 'Completed' }
      ]);
      setLoading(false);
    }, 300);
  }, []);

  return (
    <div className="p-6 bg-slate-800 rounded-xl border border-slate-700 text-white">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-indigo-400">Create Administrative Interface (TODO-08)</h3>
        <span className="text-xs px-2.5 py-1 bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-500/30">
          Agent: Agent G (Admin Dashboard)
        </span>
      </div>

      <div className="mb-4">
        <input 
          type="text"
          placeholder="Filter records..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
        />
      </div>

      {loading ? (
        <p className="text-xs text-slate-400">Loading Create Administrative Interface...</p>
      ) : (
        <div className="space-y-2">
          {data.map(item => (
            <div key={item.id} className="p-3 bg-slate-900/60 rounded-lg border border-slate-700/50 flex justify-between items-center text-sm">
              <span>{item.name}</span>
              <span className="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded border border-emerald-500/30">
                {item.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
