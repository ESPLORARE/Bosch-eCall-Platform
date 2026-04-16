import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  FileText, 
  ChevronRight, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Info,
  X,
  ShieldAlert,
  Activity,
  CheckSquare
} from 'lucide-react';
import { mockSOPs } from '../data/mockSOPs';
import { SOP } from '../types';
import { cn } from '../components/Layout';

export default function SOPCenter() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedScenario, setSelectedScenario] = useState<string>('All');
  const [selectedPriority, setSelectedPriority] = useState<string>('All');
  const [selectedSOP, setSelectedSOP] = useState<SOP | null>(null);
  const [checklistState, setChecklistState] = useState<Record<string, boolean>>({});

  const scenarios = ['All', ...Array.from(new Set(mockSOPs.map(sop => sop.scenarioType)))];
  const priorities = ['All', 'Critical', 'High', 'Medium', 'Low'];

  const filteredSOPs = useMemo(() => {
    return mockSOPs.filter(sop => {
      const matchesSearch = sop.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            sop.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesScenario = selectedScenario === 'All' || sop.scenarioType === selectedScenario;
      const matchesPriority = selectedPriority === 'All' || sop.priorityLevel === selectedPriority;
      
      return matchesSearch && matchesScenario && matchesPriority;
    });
  }, [searchTerm, selectedScenario, selectedPriority]);

  const handleOpenSOP = (sop: SOP) => {
    setSelectedSOP(sop);
    // Reset checklist when opening a new SOP
    const initialChecklist: Record<string, boolean> = {};
    sop.checklist.forEach((_, index) => {
      initialChecklist[index] = false;
    });
    setChecklistState(initialChecklist);
  };

  const toggleChecklistItem = (index: number) => {
    setChecklistState(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'bg-[#E20015] text-white';
      case 'High': return 'bg-orange-500 text-white';
      case 'Medium': return 'bg-amber-500 text-white';
      case 'Low': return 'bg-[#00A8CB] text-white';
      default: return 'bg-slate-500 text-white';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
      case 'Draft': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800';
      case 'Archived': return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-[#005691] dark:text-blue-400" />
            Emergency SOP Center
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Standardized response procedures for emergency scenarios
          </p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search SOPs by title or keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#005691] dark:text-white transition-shadow"
          />
        </div>
        
        <div className="flex items-center gap-3 overflow-x-auto pb-1 sm:pb-0">
          <div className="flex items-center gap-2 shrink-0">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Filters:</span>
          </div>
          
          <select
            value={selectedScenario}
            onChange={(e) => setSelectedScenario(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm rounded-lg focus:ring-[#005691] focus:border-[#005691] block p-2 outline-none"
          >
            {scenarios.map(s => (
              <option key={s} value={s}>{s === 'All' ? 'All Scenarios' : s}</option>
            ))}
          </select>

          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm rounded-lg focus:ring-[#005691] focus:border-[#005691] block p-2 outline-none"
          >
            {priorities.map(p => (
              <option key={p} value={p}>{p === 'All' ? 'All Priorities' : p}</option>
            ))}
          </select>
        </div>
      </div>

      {/* SOP List */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredSOPs.map((sop) => (
          <div 
            key={sop.id}
            className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-md transition-all group flex flex-col"
          >
            <div className="p-5 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-3">
                <span className={cn("px-2.5 py-1 text-xs font-bold rounded-md uppercase tracking-wide", getPriorityColor(sop.priorityLevel))}>
                  {sop.priorityLevel}
                </span>
                <span className={cn("px-2.5 py-1 text-xs font-medium rounded-full border", getStatusColor(sop.status))}>
                  {sop.status}
                </span>
              </div>
              
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-[#005691] dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                {sop.title}
              </h3>
              
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2 flex-1">
                {sop.description}
              </p>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">
                  <Activity className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-medium">Scenario:</span> {sop.scenarioType}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">
                  <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-medium">Trigger:</span> {sop.triggerType}
                </div>
              </div>
            </div>
            
            <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <Clock className="w-3.5 h-3.5" />
                Updated {sop.lastUpdated}
              </div>
              <button 
                onClick={() => handleOpenSOP(sop)}
                className="text-sm font-medium text-[#005691] dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1 transition-colors"
              >
                View SOP <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        
        {filteredSOPs.length === 0 && (
          <div className="col-span-full py-12 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 border-dashed">
            <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white">No SOPs found</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Try adjusting your search or filters to find what you're looking for.</p>
          </div>
        )}
      </div>

      {/* SOP Detail Drawer */}
      {selectedSOP && (
        <>
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity"
            onClick={() => setSelectedSOP(null)}
          ></div>
          <div className="fixed inset-y-0 right-0 w-full max-w-2xl bg-white dark:bg-slate-900 shadow-2xl z-50 border-l border-slate-200 dark:border-slate-800 flex flex-col transform transition-transform duration-300 ease-in-out overflow-hidden">
            
            {/* Drawer Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-start bg-slate-50 dark:bg-slate-800/50 shrink-0">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={cn("px-2.5 py-1 text-xs font-bold rounded-md uppercase tracking-wide", getPriorityColor(selectedSOP.priorityLevel))}>
                    {selectedSOP.priorityLevel} Priority
                  </span>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded-md">
                    {selectedSOP.id}
                  </span>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded-md">
                    {selectedSOP.version}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                  {selectedSOP.title}
                </h2>
              </div>
              <button 
                onClick={() => setSelectedSOP(null)} 
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              
              {/* Overview Section */}
              <section>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                  <Info className="w-4 h-4 text-[#005691] dark:text-blue-400" /> Overview
                </h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Scenario Type</div>
                    <div className="text-sm font-medium text-slate-900 dark:text-white">{selectedSOP.scenarioType}</div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Trigger Type</div>
                    <div className="text-sm font-medium text-slate-900 dark:text-white">{selectedSOP.triggerType}</div>
                  </div>
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {selectedSOP.description}
                </p>
              </section>

              {/* Trigger Conditions */}
              <section>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" /> Trigger Conditions
                </h3>
                <ul className="list-disc list-inside space-y-1.5 text-sm text-slate-700 dark:text-slate-300">
                  {selectedSOP.triggerConditions.map((condition, idx) => (
                    <li key={idx} className="leading-relaxed">{condition}</li>
                  ))}
                </ul>
              </section>

              {/* Procedure Steps & Checklist */}
              <section>
                <div className="flex items-center justify-between mb-3 border-b border-slate-200 dark:border-slate-800 pb-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-emerald-500" /> Execution Checklist
                  </h3>
                  <span className="text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">
                    {Object.values(checklistState).filter(Boolean).length} / {selectedSOP.checklist.length} Completed
                  </span>
                </div>
                
                <div className="space-y-3">
                  {selectedSOP.checklist.map((item, idx) => (
                    <label 
                      key={idx} 
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                        checklistState[idx] 
                          ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-800/50" 
                          : "bg-white border-slate-200 hover:border-slate-300 dark:bg-slate-900 dark:border-slate-700 dark:hover:border-slate-600"
                      )}
                    >
                      <div className="relative flex items-center justify-center mt-0.5">
                        <input 
                          type="checkbox" 
                          className="peer appearance-none w-5 h-5 border-2 border-slate-300 dark:border-slate-600 rounded-md checked:bg-emerald-500 checked:border-emerald-500 transition-colors cursor-pointer"
                          checked={checklistState[idx] || false}
                          onChange={() => toggleChecklistItem(idx)}
                        />
                        <CheckCircle2 className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" />
                      </div>
                      <div className="flex-1">
                        <span className={cn(
                          "text-sm font-medium transition-colors",
                          checklistState[idx] ? "text-emerald-800 dark:text-emerald-400 line-through opacity-70" : "text-slate-900 dark:text-white"
                        )}>
                          {item}
                        </span>
                        {/* Show corresponding detailed step if available */}
                        {selectedSOP.procedureSteps[idx] && (
                          <p className={cn(
                            "text-xs mt-1",
                            checklistState[idx] ? "text-emerald-600/70 dark:text-emerald-500/50" : "text-slate-500 dark:text-slate-400"
                          )}>
                            {selectedSOP.procedureSteps[idx]}
                          </p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </section>

              {/* Key Questions */}
              <section>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                  <ShieldAlert className="w-4 h-4 text-[#005691] dark:text-blue-400" /> Key Questions for Operator
                </h3>
                <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl p-4">
                  <ul className="space-y-2">
                    {selectedSOP.keyQuestions.map((q, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-blue-900 dark:text-blue-200">
                        <span className="font-bold text-blue-500 mt-0.5">Q:</span> {q}
                      </li>
                    ))}
                  </ul>
                </div>
              </section>

              {/* Dispatch & Escalation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <section>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                    <Activity className="w-4 h-4 text-indigo-500" /> Dispatch Recs
                  </h3>
                  <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                    {selectedSOP.dispatchRecommendations.map((rec, idx) => {
                      const [service, condition] = rec.split(':');
                      return (
                        <li key={idx} className="flex flex-col bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-slate-700">
                          <span className="font-semibold text-slate-900 dark:text-white">{service}</span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">{condition?.trim()}</span>
                        </li>
                      );
                    })}
                  </ul>
                </section>
                
                <section>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                    <AlertTriangle className="w-4 h-4 text-[#E20015]" /> Escalation Rules
                  </h3>
                  <ul className="list-disc list-inside space-y-1.5 text-sm text-slate-700 dark:text-slate-300">
                    {selectedSOP.escalationRules.map((rule, idx) => (
                      <li key={idx} className="leading-relaxed">{rule}</li>
                    ))}
                  </ul>
                </section>
              </div>

              {/* Notes & Warnings */}
              {selectedSOP.notesWarnings.length > 0 && (
                <section>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" /> Notes & Warnings
                  </h3>
                  <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-xl p-4">
                    <ul className="list-disc list-inside space-y-1.5 text-sm text-amber-900 dark:text-amber-200">
                      {selectedSOP.notesWarnings.map((note, idx) => (
                        <li key={idx} className="leading-relaxed">{note}</li>
                      ))}
                    </ul>
                  </div>
                </section>
              )}
            </div>
            
            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 shrink-0 flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
              <div>Last updated: {selectedSOP.lastUpdated} by {selectedSOP.updatedBy}</div>
              <button 
                className="px-4 py-2 bg-[#005691] hover:bg-blue-800 text-white rounded-lg font-medium transition-colors"
                onClick={() => setSelectedSOP(null)}
              >
                Close SOP
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
