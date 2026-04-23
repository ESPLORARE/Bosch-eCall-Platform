import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { AppOutletContext, Operator } from '../types';
import { 
  UserPlus, Edit2, Trash2, Phone, Clock, Shield, Search, 
  Filter, Eye, UserX, MapPin, Activity, CheckCircle2, 
  AlertCircle, XCircle, Coffee, Users, BarChart2, ChevronRight, X
} from 'lucide-react';
import { Link, useOutletContext } from 'react-router-dom';
import { canCreateOperators, canDeleteOperators, canManageOperators } from '../utils/permissions';

export default function OperatorManagement() {
  const { user } = useOutletContext<AppOutletContext>();
  const [operators, setOperators] = useState<Operator[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [shiftFilter, setShiftFilter] = useState<string>('all');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOperator, setEditingOperator] = useState<Operator | null>(null);
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState<Partial<Operator>>({
    name: '',
    role: 'Dispatcher',
    status: 'Offline',
    shift: 'Morning Shift',
    shiftStart: '08:00',
    shiftEnd: '16:00',
    contact: '',
    assignedRegion: '',
    skills: [],
    notes: ''
  });

  useEffect(() => {
    fetchOperators();
  }, []);

  const fetchOperators = async () => {
    try {
      const data = await api.getOperators();
      setOperators(data);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to load operators');
    }
  };

  const handleOpenModal = (operator?: Operator) => {
    if ((operator && !canManageOperators(user)) || (!operator && !canCreateOperators(user))) {
      setError('Your role can view operators but cannot change this record.');
      return;
    }

    if (operator) {
      setEditingOperator(operator);
      setFormData(operator);
    } else {
      setEditingOperator(null);
      setFormData({
        name: '',
        role: 'Dispatcher',
        status: 'Offline',
        shift: 'Morning Shift',
        shiftStart: '08:00',
        shiftEnd: '16:00',
        contact: '',
        assignedRegion: '',
        skills: [],
        notes: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingOperator(null);
  };

  const handleOpenDrawer = (operator: Operator) => {
    setSelectedOperator(operator);
    setIsDrawerOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (editingOperator) {
        if (!canManageOperators(user)) {
          throw new Error('Your role cannot edit operators.');
        }
        await api.updateOperator(editingOperator.id, formData);
      } else {
        if (!canCreateOperators(user)) {
          throw new Error('Only admins can add operators.');
        }
        await api.createOperator({
          ...formData,
          activeIncidents: 0,
          activeIncidentIds: [],
          todayHandledCases: 0,
          lastActiveTime: new Date().toISOString(),
          averageResponseTime: '0s'
        });
      }
      fetchOperators();
      handleCloseModal();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Operator update failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!canDeleteOperators(user)) {
      setError('Only admins can deactivate operators.');
      return;
    }

    if (window.confirm('Are you sure you want to deactivate this operator?')) {
      try {
        await api.deleteOperator(id);
        fetchOperators();
        if (selectedOperator?.id === id) setIsDrawerOpen(false);
      } catch (deleteError) {
        setError(deleteError instanceof Error ? deleteError.message : 'Operator delete failed');
      }
    }
  };

  const filteredOperators = operators.filter(op => {
    const matchesSearch = op.name.toLowerCase().includes(searchTerm.toLowerCase()) || op.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || op.status === statusFilter;
    const matchesRole = roleFilter === 'all' || op.role === roleFilter;
    const matchesShift = shiftFilter === 'all' || op.shift === shiftFilter;
    return matchesSearch && matchesStatus && matchesRole && matchesShift;
  });

  // Summary Stats
  const totalOperators = operators.length;
  const onlineNow = operators.filter(o => ['Available', 'Handling Call', 'Dispatching'].includes(o.status)).length;
  const busyNow = operators.filter(o => ['Handling Call', 'Dispatching'].includes(o.status)).length;
  const avgIncidents = totalOperators ? (operators.reduce((acc, o) => acc + o.activeIncidents, 0) / onlineNow || 0).toFixed(1) : '0';

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'Available': return { color: 'bg-[#00884A]', bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-[#00884A] dark:text-emerald-400', icon: CheckCircle2 };
      case 'Handling Call': return { color: 'bg-[#E20015]', bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-[#E20015] dark:text-red-400', icon: Phone };
      case 'Dispatching': return { color: 'bg-[#005691]', bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-[#005691] dark:text-blue-400', icon: Activity };
      case 'On Break': return { color: 'bg-[#00A8CB]', bg: 'bg-cyan-50 dark:bg-cyan-900/20', text: 'text-[#00A8CB] dark:text-cyan-400', icon: Coffee };
      case 'Offline': default: return { color: 'bg-slate-500', bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-800 dark:text-slate-400', icon: XCircle };
    }
  };

  const getWorkloadColor = (incidents: number) => {
    if (incidents === 0) return 'bg-[#00884A]';
    if (incidents <= 2) return 'bg-[#005691]';
    return 'bg-[#E20015]';
  };

  const getWorkloadLabel = (incidents: number) => {
    if (incidents === 0) return 'Low';
    if (incidents <= 2) return 'Medium';
    return 'High';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10 relative">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Operator Management</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {canManageOperators(user) ? 'Manage dispatchers and call takers' : 'View dispatcher and call taker availability'}
          </p>
        </div>
        {canCreateOperators(user) ? (
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-[#005691] hover:bg-blue-800 text-white rounded-lg font-medium transition-colors shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            Add Operator
          </button>
        ) : (
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            {user.role} access
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-[#005691] dark:text-blue-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">Total Operators</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{totalOperators}</div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-[#00884A] dark:text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">Online Now</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{onlineNow}</div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-[#E20015] dark:text-red-400">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">Busy Now</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{busyNow}</div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-cyan-50 dark:bg-cyan-900/20 flex items-center justify-center text-[#00A8CB] dark:text-cyan-400">
            <BarChart2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">Avg Load / Online</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{avgIncidents}</div>
          </div>
        </div>
      </div>

      {/* Filters and Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search operators by name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#005691] dark:text-white shadow-sm"
            />
          </div>
          <div className="flex gap-3 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 shadow-sm shrink-0">
              <Filter className="w-4 h-4 text-slate-400" />
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="Available">Available</option>
                <option value="Handling Call">Handling Call</option>
                <option value="Dispatching">Dispatching</option>
                <option value="On Break">On Break</option>
                <option value="Offline">Offline</option>
              </select>
            </div>
            <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 shadow-sm shrink-0">
              <select 
                value={roleFilter} 
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-transparent text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
              >
                <option value="all">All Roles</option>
                <option value="Dispatcher">Dispatcher</option>
                <option value="Supervisor">Supervisor</option>
                <option value="Call Taker">Call Taker</option>
              </select>
            </div>
            <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 shadow-sm shrink-0">
              <select 
                value={shiftFilter} 
                onChange={(e) => setShiftFilter(e.target.value)}
                className="bg-transparent text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
              >
                <option value="all">All Shifts</option>
                <option value="Morning Shift">Morning Shift</option>
                <option value="Evening Shift">Evening Shift</option>
                <option value="Night Shift">Night Shift</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4">Operator</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Workload</th>
                <th className="px-6 py-4">Shift & Region</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredOperators.map(operator => {
                const statusConfig = getStatusConfig(operator.status);
                const StatusIcon = statusConfig.icon;
                
                return (
                  <tr key={operator.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="px-6 py-4 cursor-pointer" onClick={() => handleOpenDrawer(operator)}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-[#005691] dark:text-blue-400 font-bold shrink-0">
                          {operator.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-slate-900 dark:text-white group-hover:text-[#005691] dark:group-hover:text-blue-400 transition-colors">{operator.name}</div>
                          <div className="text-slate-500 dark:text-slate-400 text-xs flex items-center gap-1.5 mt-0.5">
                            <span>{operator.id}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                            <span>{operator.role}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {operator.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 dark:text-slate-400 font-medium">
                            {getWorkloadLabel(operator.activeIncidents)} Load
                          </span>
                          <div className="group/tooltip relative flex items-center gap-1 cursor-help">
                            <Shield className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-slate-900 dark:text-white font-bold">{operator.activeIncidents}</span>
                            
                            {/* Incidents Tooltip */}
                            {operator.activeIncidentIds?.length > 0 && (
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-800 text-white text-xs rounded-lg p-2 opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-10 shadow-xl">
                                <div className="font-medium mb-1 text-slate-300 border-b border-slate-700 pb-1">Active Incidents</div>
                                <ul className="space-y-1">
                                  {operator.activeIncidentIds.map(id => (
                                    <li key={id}>
                                      <Link to={`/incidents/${id}`} className="hover:text-blue-300 flex items-center justify-between">
                                        <span>{id}</span>
                                        <ChevronRight className="w-3 h-3" />
                                      </Link>
                                    </li>
                                  ))}
                                </ul>
                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45"></div>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${getWorkloadColor(operator.activeIncidents)}`} 
                            style={{ width: `${Math.min((operator.activeIncidents / 3) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-slate-900 dark:text-white font-medium text-xs">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {operator.shift} <span className="text-slate-500 font-normal">({operator.shiftStart}-{operator.shiftEnd})</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs">
                          <MapPin className="w-3.5 h-3.5" />
                          {operator.assignedRegion || 'Unassigned'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => handleOpenDrawer(operator)}
                          className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {canManageOperators(user) && (
                          <button
                            onClick={() => handleOpenModal(operator)}
                            className="p-2 text-slate-400 hover:text-[#005691] dark:hover:text-blue-400 transition-colors rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            title="Edit Profile"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {canDeleteOperators(user) && (
                          <button
                            onClick={() => handleDelete(operator.id)}
                            className="p-2 text-slate-400 hover:text-[#E20015] dark:hover:text-red-400 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                            title="Deactivate Operator"
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredOperators.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
                      <Users className="w-12 h-12 mb-3 opacity-20" />
                      <p className="text-base font-medium text-slate-900 dark:text-white">No operators found</p>
                      <p className="text-sm mt-1">Try adjusting your search or filters.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Operator Detail Drawer */}
      {isDrawerOpen && selectedOperator && (
        <>
          <div 
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity"
            onClick={() => setIsDrawerOpen(false)}
          ></div>
          <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl z-50 border-l border-slate-200 dark:border-slate-800 flex flex-col transform transition-transform duration-300 ease-in-out">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Operator Profile
              </h3>
              <button 
                onClick={() => setIsDrawerOpen(false)} 
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Header Info */}
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-[#005691] dark:text-blue-400 font-bold text-2xl shrink-0">
                  {selectedOperator.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">{selectedOperator.name}</h2>
                  <div className="text-slate-500 dark:text-slate-400 font-medium mt-1">{selectedOperator.role}</div>
                  <div className="mt-2">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusConfig(selectedOperator.status).bg} ${getStatusConfig(selectedOperator.status).text}`}>
                      {React.createElement(getStatusConfig(selectedOperator.status).icon, { className: "w-3.5 h-3.5" })}
                      {selectedOperator.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">Today's Cases</div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">{selectedOperator.todayHandledCases || 0}</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">Avg Response</div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">{selectedOperator.averageResponseTime || 'N/A'}</div>
                </div>
              </div>

              {/* Details List */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Operational Details</h4>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                      <Shield className="w-4 h-4" />
                      <span className="text-sm">Operator ID</span>
                    </div>
                    <span className="text-sm font-medium text-slate-900 dark:text-white">{selectedOperator.id}</span>
                  </div>
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                      <Phone className="w-4 h-4" />
                      <span className="text-sm">Contact</span>
                    </div>
                    <span className="text-sm font-medium text-slate-900 dark:text-white">{selectedOperator.contact}</span>
                  </div>
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">Shift</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-slate-900 dark:text-white">{selectedOperator.shift}</div>
                      <div className="text-xs text-slate-500">{selectedOperator.shiftStart} - {selectedOperator.shiftEnd}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm">Region</span>
                    </div>
                    <span className="text-sm font-medium text-slate-900 dark:text-white">{selectedOperator.assignedRegion || 'All Regions'}</span>
                  </div>
                </div>
              </div>

              {/* Skills */}
              {selectedOperator.skills && selectedOperator.skills.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Certifications & Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedOperator.skills.map((skill, i) => (
                      <span key={i} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedOperator.notes && (
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Notes</h4>
                  <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-xl text-sm text-amber-900 dark:text-amber-200 leading-relaxed">
                    {selectedOperator.notes}
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
              {canManageOperators(user) ? (
                <button
                  onClick={() => {
                    setIsDrawerOpen(false);
                    handleOpenModal(selectedOperator);
                  }}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Profile
                </button>
              ) : (
                <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-center text-sm font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                  View-only access for {user.role}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20 shrink-0">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingOperator ? 'Edit Operator Profile' : 'Add New Operator'}
              </h3>
              <button onClick={handleCloseModal} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-6">
              <form id="operator-form" onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Full Name</label>
                    <input 
                      type="text" 
                      required
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Role</label>
                    <select 
                      value={formData.role}
                      onChange={e => setFormData({...formData, role: e.target.value as any})}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white shadow-sm"
                    >
                      <option value="Dispatcher">Dispatcher</option>
                      <option value="Supervisor">Supervisor</option>
                      <option value="Call Taker">Call Taker</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Status</label>
                    <select 
                      value={formData.status}
                      onChange={e => setFormData({...formData, status: e.target.value as any})}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white shadow-sm"
                    >
                      <option value="Available">Available</option>
                      <option value="Handling Call">Handling Call</option>
                      <option value="Dispatching">Dispatching</option>
                      <option value="On Break">On Break</option>
                      <option value="Offline">Offline</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Assigned Region</label>
                    <input 
                      type="text" 
                      value={formData.assignedRegion}
                      onChange={e => setFormData({...formData, assignedRegion: e.target.value})}
                      placeholder="e.g. Kuala Lumpur"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Shift</label>
                    <select 
                      value={formData.shift}
                      onChange={e => setFormData({...formData, shift: e.target.value as any})}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white shadow-sm"
                    >
                      <option value="Morning Shift">Morning Shift</option>
                      <option value="Evening Shift">Evening Shift</option>
                      <option value="Night Shift">Night Shift</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Contact Number</label>
                    <input 
                      type="text" 
                      required
                      value={formData.contact}
                      onChange={e => setFormData({...formData, contact: e.target.value})}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white shadow-sm"
                      placeholder="+60 12 345 6789"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Shift Start</label>
                    <input 
                      type="time" 
                      required
                      value={formData.shiftStart}
                      onChange={e => setFormData({...formData, shiftStart: e.target.value})}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Shift End</label>
                    <input 
                      type="time" 
                      required
                      value={formData.shiftEnd}
                      onChange={e => setFormData({...formData, shiftEnd: e.target.value})}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white shadow-sm"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Skills & Certifications (comma separated)</label>
                    <input 
                      type="text" 
                      value={formData.skills?.join(', ')}
                      onChange={e => setFormData({...formData, skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})}
                      placeholder="First Aid, Bilingual, Medical Dispatch..."
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white shadow-sm"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Operational Notes</label>
                    <textarea 
                      rows={3}
                      value={formData.notes}
                      onChange={e => setFormData({...formData, notes: e.target.value})}
                      placeholder="Any specific notes about this operator..."
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white shadow-sm resize-none"
                    />
                  </div>
                </div>
              </form>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3 bg-slate-50/50 dark:bg-slate-800/20 shrink-0">
              <button 
                type="button"
                onClick={handleCloseModal}
                className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                form="operator-form"
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm"
              >
                {editingOperator ? 'Save Changes' : 'Add Operator'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
