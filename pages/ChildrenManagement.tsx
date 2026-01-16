
import React, { useState, useEffect } from 'react';
import { Store } from '../store';
import { Child, Parent, Language } from '../types';
import { Plus, UserPlus, Trash2, Edit2, Baby, Mail, Phone, Languages, Edit3, X, Loader2 } from 'lucide-react';

const ChildrenManagement: React.FC = () => {
  const [children, setChildren] = useState<Child[]>([]);
  const [parents, setParents] = useState<Parent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingChild, setIsAddingChild] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  
  // Parent Modal State
  const [parentModal, setParentModal] = useState<{ isOpen: boolean; childId: string | null; editingParent: Parent | null }>({
    isOpen: false,
    childId: null,
    editingParent: null
  });

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setChildren(await Store.getChildren());
      setParents(await Store.getParents());
      setIsLoading(false);
    };
    loadData();
  }, []);

  const saveChild = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const id = editingChild?.id || Math.random().toString(36).substr(2, 9);
    
    const newChild: Child = {
      id,
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      dob: formData.get('dob') as string,
      classroom: formData.get('classroom') as string,
      active: true,
      parentIds: editingChild?.parentIds || [],
      allergies: formData.get('allergies') as string,
    };

    const updated = editingChild 
      ? children.map(c => c.id === id ? newChild : c)
      : [...children, newChild];

    setChildren(updated);
    await Store.saveChildren(updated);
    setIsAddingChild(false);
    setEditingChild(null);
  };

  const handleParentSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const isEditing = !!parentModal.editingParent;
    const parentId = parentModal.editingParent?.id || Math.random().toString(36).substr(2, 9);

    const updatedParent: Parent = {
      id: parentId,
      fullName: formData.get('fullName') as string,
      email: formData.get('email') as string,
      relationship: formData.get('relationship') as any,
      preferredLanguage: formData.get('preferredLanguage') as Language,
      receivesEmail: formData.get('receivesEmail') === 'on',
    };

    let updatedParents = [...parents];
    if (isEditing) {
      updatedParents = updatedParents.map(p => p.id === parentId ? updatedParent : p);
    } else {
      updatedParents.push(updatedParent);
    }

    let updatedChildren = [...children];
    if (!isEditing && parentModal.childId) {
      updatedChildren = updatedChildren.map(c => 
        c.id === parentModal.childId ? { ...c, parentIds: [...c.parentIds, parentId] } : c
      );
    }

    setParents(updatedParents);
    setChildren(updatedChildren);
    await Store.saveParents(updatedParents);
    await Store.saveChildren(updatedChildren);
    setParentModal({ isOpen: false, childId: null, editingParent: null });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-brand font-extrabold text-amber-900">Manage Children</h1>
        <button 
          onClick={() => setIsAddingChild(true)}
          className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2 rounded-xl transition-all shadow-sm"
        >
          <Plus size={20} />
          <span>Add Child</span>
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-amber-900/40">
           <Loader2 className="animate-spin mb-4" size={32} />
           <p className="font-bold uppercase tracking-widest text-[10px]">Syncing Directory...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-500">
          {children.map(child => (
            <div key={child.id} className="bg-white rounded-3xl border border-amber-100 p-6 shadow-sm flex flex-col h-full hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-700">
                    <Baby size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">{child.firstName} {child.lastName}</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{child.classroom || 'General Group'}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setEditingChild(child)} className="p-2 text-slate-300 hover:text-amber-500 transition-colors">
                    <Edit2 size={18} />
                  </button>
                </div>
              </div>

              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-400 uppercase">Parents / Guardians</p>
                  <button 
                    onClick={() => setParentModal({ isOpen: true, childId: child.id, editingParent: null })} 
                    className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
                  >
                    <UserPlus size={12} />
                    <span>Link Parent</span>
                  </button>
                </div>
                
                <div className="space-y-2">
                  {child.parentIds.map(pid => {
                    const parent = parents.find(p => p.id === pid);
                    if (!parent) return null;
                    return (
                      <div key={pid} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl group">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-slate-700 truncate">{parent.fullName}</p>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded uppercase">{parent.relationship}</span>
                          </div>
                          <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                            <Mail size={10} /> {parent.email}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          <div className={`w-2 h-2 rounded-full ${parent.receivesEmail ? 'bg-green-400' : 'bg-slate-300'}`} title={parent.receivesEmail ? 'Receives Emails' : 'Email notifications off'} />
                          <button 
                            onClick={() => setParentModal({ isOpen: true, childId: child.id, editingParent: parent })}
                            className="p-1.5 text-slate-300 hover:text-amber-500 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Edit3 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {child.parentIds.length === 0 && (
                    <p className="text-xs italic text-slate-400 text-center py-2 bg-slate-50 rounded-xl">No parents linked</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Child Form Modal */}
      {(isAddingChild || editingChild) && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <form onSubmit={saveChild} className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl space-y-4">
            <h2 className="text-xl font-bold text-slate-800 mb-4">{editingChild ? 'Edit' : 'Add New'} Child</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase block mb-1">First Name</label>
                <input name="firstName" defaultValue={editingChild?.firstName} required className="w-full px-4 py-2 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Last Name</label>
                <input name="lastName" defaultValue={editingChild?.lastName} required className="w-full px-4 py-2 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Date of Birth</label>
              <input name="dob" type="date" defaultValue={editingChild?.dob} required className="w-full px-4 py-2 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-amber-400" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Classroom/Group</label>
              <input name="classroom" defaultValue={editingChild?.classroom} className="w-full px-4 py-2 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-amber-400" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Allergies</label>
              <textarea name="allergies" defaultValue={editingChild?.allergies} className="w-full px-4 py-2 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-amber-400" />
            </div>
            <div className="flex gap-4 pt-4">
              <button type="submit" className="flex-1 bg-amber-600 text-white font-bold py-3 rounded-2xl shadow-lg shadow-amber-100">Save Child</button>
              <button type="button" onClick={() => { setIsAddingChild(false); setEditingChild(null); }} className="flex-1 bg-slate-100 text-slate-600 font-bold py-3 rounded-2xl">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Parent Form Modal */}
      {parentModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <form onSubmit={handleParentSave} className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-slate-800">{parentModal.editingParent ? 'Edit' : 'Add'} Parent Contact</h2>
              <button type="button" onClick={() => setParentModal({ isOpen: false, childId: null, editingParent: null })} className="text-slate-400"><X /></button>
            </div>
            
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Full Name</label>
              <input name="fullName" defaultValue={parentModal.editingParent?.fullName} required className="w-full px-4 py-2 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-amber-400" />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Email Address</label>
              <input name="email" type="email" defaultValue={parentModal.editingParent?.email} required className="w-full px-4 py-2 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-amber-400" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Relationship</label>
                <select name="relationship" defaultValue={parentModal.editingParent?.relationship || 'Mom'} className="w-full px-4 py-2 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-amber-400">
                  <option value="Mom">Mom</option>
                  <option value="Dad">Dad</option>
                  <option value="Guardian">Guardian</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Language</label>
                <select name="preferredLanguage" defaultValue={parentModal.editingParent?.preferredLanguage || 'English'} className="w-full px-4 py-2 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-amber-400">
                  <option value="English">English</option>
                  <option value="Urdu">Urdu</option>
                  <option value="Punjabi">Punjabi</option>
                </select>
              </div>
            </div>

            <label className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl cursor-pointer">
              <input name="receivesEmail" type="checkbox" defaultChecked={parentModal.editingParent?.receivesEmail ?? true} className="w-5 h-5 accent-amber-600" />
              <span className="text-sm font-bold text-amber-900">Receives daily report emails</span>
            </label>

            <div className="flex gap-4 pt-4">
              <button type="submit" className="flex-1 bg-amber-600 text-white font-bold py-3 rounded-2xl shadow-lg shadow-amber-100">
                {parentModal.editingParent ? 'Update Contact' : 'Link Parent'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ChildrenManagement;
