
import React, { useState, useEffect } from 'react';
import { Store } from '../store';
import { Child, Parent } from '../types';
import { 
  Phone, 
  AlertTriangle, 
  ShieldAlert, 
  Search, 
  Loader2, 
  ChevronRight,
  Info,
  Heart
} from 'lucide-react';

const EmergencyPage: React.FC = () => {
  const [children, setChildren] = useState<Child[]>([]);
  const [parents, setParents] = useState<Parent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setChildren(await Store.getChildren());
    setParents(await Store.getParents());
    setIsLoading(false);
  };

  const filteredChildren = children.filter(c => 
    `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-red-900/40">
       <Loader2 className="animate-spin mb-4" size={32} />
       <p className="font-bold uppercase tracking-widest text-[10px]">Loading Safety Data...</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-red-500 p-3 rounded-2xl shadow-lg shadow-red-200">
            <ShieldAlert size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-brand font-extrabold text-red-900">Emergency Dashboard</h1>
            <p className="text-slate-500 font-medium text-sm">Instant access to contacts & medical alerts.</p>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" placeholder="Quick find child..." 
            className="pl-10 pr-4 py-3 bg-white border border-red-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500 w-full md:w-64 shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6">
        {filteredChildren.map(child => {
          const childParents = parents.filter(p => child.parentIds.includes(p.id));
          const hasCriticalInfo = child.allergies || child.emergencyNotes;

          return (
            <div key={child.id} className={`bg-white rounded-[2.5rem] border-2 overflow-hidden shadow-xl transition-all ${hasCriticalInfo ? 'border-red-100 shadow-red-50' : 'border-slate-50'}`}>
              <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6">
                
                {/* Child Summary */}
                <div className="md:w-1/3 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center font-black text-2xl text-slate-400">
                      {child.firstName[0]}{child.lastName[0]}
                    </div>
                    <div>
                      <h2 className="text-2xl font-brand font-extrabold text-slate-800 leading-none">{child.firstName}</h2>
                      <p className="text-sm font-bold text-slate-400 uppercase mt-1 tracking-widest">{child.classroom || 'Toddlers'}</p>
                    </div>
                  </div>

                  {child.allergies && (
                    <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
                      <div className="flex items-center gap-2 text-red-600 font-black text-[10px] uppercase tracking-widest mb-1">
                        <AlertTriangle size={14} />
                        Critical Allergies
                      </div>
                      <p className="text-red-900 font-bold leading-tight">{child.allergies}</p>
                    </div>
                  )}

                  {child.emergencyNotes && (
                    <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                      <div className="flex items-center gap-2 text-amber-600 font-black text-[10px] uppercase tracking-widest mb-1">
                        <Info size={14} />
                        Emergency Notes
                      </div>
                      <p className="text-amber-900 font-medium text-sm leading-tight">{child.emergencyNotes}</p>
                    </div>
                  )}
                </div>

                {/* Parent Quick Dial Cards */}
                <div className="md:w-2/3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Guardian Contacts</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {childParents.map(parent => (
                      <div key={parent.id} className="bg-slate-50 border border-slate-100 p-5 rounded-3xl flex flex-col justify-between hover:bg-slate-100 transition-colors">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-black bg-white px-2 py-0.5 rounded-full text-slate-500 uppercase">{parent.relationship}</span>
                            <span className="text-[10px] font-bold text-slate-400">{parent.preferredLanguage}</span>
                          </div>
                          <h3 className="font-extrabold text-slate-800 text-lg leading-tight mb-4">{parent.fullName}</h3>
                        </div>
                        
                        {parent.phone ? (
                          <a 
                            href={`tel:${parent.phone.replace(/\D/g, '')}`}
                            className="flex items-center justify-center gap-3 bg-green-500 hover:bg-green-600 text-white font-black py-3 px-4 rounded-2xl shadow-lg shadow-green-100 transition-transform active:scale-95"
                          >
                            <Phone size={18} fill="currentColor" />
                            <span>{parent.phone}</span>
                          </a>
                        ) : (
                          <div className="text-center py-3 bg-slate-200 text-slate-500 rounded-2xl text-xs font-bold uppercase tracking-wider">
                            No Phone Listed
                          </div>
                        )}
                      </div>
                    ))}
                    {childParents.length === 0 && (
                      <div className="col-span-full py-10 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 text-slate-400">
                         <p className="font-bold italic">No parents linked to this child.</p>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-red-50 p-6 rounded-[2.5rem] border border-red-100 flex items-center gap-5">
        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shrink-0 shadow-sm text-red-500">
          <Heart size={24} fill="currentColor" />
        </div>
        <p className="text-sm text-red-900/70 font-medium leading-relaxed">
          Keep this dashboard open during outdoor play or field trips. All phone numbers are clickable for immediate dialing on mobile devices.
        </p>
      </div>
    </div>
  );
};

export default EmergencyPage;
