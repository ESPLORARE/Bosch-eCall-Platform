import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Vehicle } from '../types';
import { 
  Car, Search, ShieldAlert, Phone, User, Activity, 
  AlertTriangle, Clock, MapPin, Info, X, ChevronRight, 
  CheckCircle2, AlertCircle, Filter, Radio
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export default function VehicleRegistry() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterRisk, setFilterRisk] = useState<string>('All');
  const [filterFuel, setFilterFuel] = useState<string>('All');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  useEffect(() => {
    const fetchVehicles = async () => {
      const data = await api.getVehicles();
      setVehicles(data);
    };
    fetchVehicles();
  }, []);

  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch = v.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.vehicleId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.ownerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || v.status === filterStatus;
    const matchesRisk = filterRisk === 'All' || v.riskLevel === filterRisk.toLowerCase();
    const matchesFuel = filterFuel === 'All' || v.fuelType === filterFuel;
    return matchesSearch && matchesStatus && matchesRisk && matchesFuel;
  });

  const totalVehicles = vehicles.length;
  const inAlert = vehicles.filter(v => v.status === 'In Alert').length;
  const medHighRisk = vehicles.filter(v => v.riskLevel === 'high' || v.riskLevel === 'medium').length;
  const recentSos = vehicles.filter(v => v.lastSosTime && new Date(v.lastSosTime).getTime() > Date.now() - 1000 * 60 * 60 * 24 * 7).length; // last 7 days

  return (
    <div className="space-y-6 max-w-7xl mx-auto relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Vehicle Registry</h2>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg">
              <Car className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Vehicles</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalVehicles}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
              <AlertCircle className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">In Alert</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{inAlert}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-lg">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Med/High Risk</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{medHighRisk}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg">
              <Activity className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Recent SOS (7d)</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{recentSos}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input 
            type="text" 
            placeholder="Search plate, ID, owner..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none w-full placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="py-2 pl-3 pr-8 border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
            >
              <option value="All">All Statuses</option>
              <option value="Normal">Normal</option>
              <option value="In Alert">In Alert</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <select 
              value={filterRisk}
              onChange={(e) => setFilterRisk(e.target.value)}
              className="py-2 pl-3 pr-8 border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
            >
              <option value="All">All Risks</option>
              <option value="High">High Risk</option>
              <option value="Medium">Medium Risk</option>
              <option value="Low">Low Risk</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <select 
              value={filterFuel}
              onChange={(e) => setFilterFuel(e.target.value)}
              className="py-2 pl-3 pr-8 border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
            >
              <option value="All">All Fuel Types</option>
              <option value="Petrol">Petrol</option>
              <option value="Diesel">Diesel</option>
              <option value="Hybrid">Hybrid</option>
              <option value="Electric">Electric</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVehicles.map(vehicle => (
          <div key={vehicle.vehicleId} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 hover:shadow-md dark:hover:bg-slate-800/50 transition-all flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <Car className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">{vehicle.brand} {vehicle.model}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{vehicle.plateNumber}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize flex items-center gap-1
                  ${vehicle.status === 'In Alert' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800/50' : 
                    vehicle.status === 'Resolved' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-200 dark:border-orange-800/50' : 
                    'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50'}`}>
                  {vehicle.status === 'In Alert' && <AlertCircle className="w-3 h-3" />}
                  {vehicle.status === 'Resolved' && <CheckCircle2 className="w-3 h-3" />}
                  {vehicle.status === 'Normal' && <CheckCircle2 className="w-3 h-3" />}
                  {vehicle.status}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider
                  ${vehicle.riskLevel === 'high' ? 'text-red-600 dark:text-red-400' : 
                    vehicle.riskLevel === 'medium' ? 'text-orange-600 dark:text-orange-400' : 
                    'text-slate-500 dark:text-slate-400'}`}>
                  {vehicle.riskLevel} Risk
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-y-3 gap-x-4 py-4 border-t border-slate-100 dark:border-slate-800 flex-1">
              <div className="flex flex-col">
                <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1"><User className="w-3 h-3" /> Owner</span>
                <span className="text-sm font-medium text-slate-900 dark:text-white truncate">{vehicle.ownerName}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1"><MapPin className="w-3 h-3" /> Region</span>
                <span className="text-sm font-medium text-slate-900 dark:text-white truncate">{vehicle.assignedRegion}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1"><Radio className="w-3 h-3" /> eCall Mode</span>
                <span className="text-sm font-medium text-slate-900 dark:text-white truncate">{vehicle.eCallMode}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" /> Last SOS</span>
                <span className="text-sm font-medium text-slate-900 dark:text-white truncate">
                  {vehicle.lastSosTime ? formatDistanceToNow(new Date(vehicle.lastSosTime), { addSuffix: true }) : 'Never'}
                </span>
              </div>
            </div>
            
            <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-slate-700 dark:text-slate-300">{vehicle.incidentCount}</span> Incidents
              </div>
              <div className="flex flex-wrap justify-end gap-3">
                {vehicle.status === 'In Alert' && (
                  <button 
                    onClick={() => navigate('/alerts')}
                    className="text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 flex items-center gap-1"
                  >
                    Open Incident
                  </button>
                )}
                <button
                  onClick={() => navigate(`/digital-twin?vehicle=${encodeURIComponent(vehicle.vehicleId)}`)}
                  className="text-sm font-medium text-cyan-700 dark:text-cyan-400 hover:text-cyan-800 dark:hover:text-cyan-300 flex items-center gap-1"
                >
                  <Activity className="w-3.5 h-3.5" />
                  Digital Twin
                </button>
                <button 
                  onClick={() => setSelectedVehicle(vehicle)}
                  className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1"
                >
                  View Details
                </button>
              </div>
            </div>
          </div>
        ))}
        {filteredVehicles.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <Car className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-lg font-medium text-slate-900 dark:text-white">No vehicles found</p>
            <p className="text-sm mt-1">Try adjusting your search or filters.</p>
          </div>
        )}
      </div>

      {/* Vehicle Detail Drawer/Modal */}
      {selectedVehicle && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-sm transition-opacity">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col animate-in slide-in-from-right">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Car className="w-6 h-6 text-blue-500" />
                Vehicle Details
              </h3>
              <button 
                onClick={() => setSelectedVehicle(null)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Status Banner */}
              <div className={`p-4 rounded-xl border flex items-start gap-3
                ${selectedVehicle.status === 'In Alert' ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800/50' : 
                  selectedVehicle.status === 'Resolved' ? 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800/50' : 
                  'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800/50'}`}>
                {selectedVehicle.status === 'In Alert' ? <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" /> : 
                 selectedVehicle.status === 'Resolved' ? <CheckCircle2 className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5" /> : 
                 <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5" />}
                <div>
                  <h4 className={`font-semibold 
                    ${selectedVehicle.status === 'In Alert' ? 'text-red-900 dark:text-red-300' : 
                      selectedVehicle.status === 'Resolved' ? 'text-orange-900 dark:text-orange-300' : 
                      'text-emerald-900 dark:text-emerald-300'}`}>
                    Status: {selectedVehicle.status}
                  </h4>
                  <p className={`text-sm mt-1
                    ${selectedVehicle.status === 'In Alert' ? 'text-red-700 dark:text-red-400' : 
                      selectedVehicle.status === 'Resolved' ? 'text-orange-700 dark:text-orange-400' : 
                      'text-emerald-700 dark:text-emerald-400'}`}>
                    {selectedVehicle.status === 'In Alert' ? 'Active SOS incident requires immediate attention.' : 
                     selectedVehicle.status === 'Resolved' ? 'Recent incident has been resolved.' : 
                     'Vehicle is operating normally.'}
                  </p>
                </div>
              </div>

              {/* Vehicle Info */}
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Info className="w-4 h-4 text-slate-400" /> Vehicle Profile
                </h4>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-4 border border-slate-100 dark:border-slate-800">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Make & Model</p>
                      <p className="font-medium text-slate-900 dark:text-white">{selectedVehicle.brand} {selectedVehicle.model}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Plate Number</p>
                      <p className="font-medium text-slate-900 dark:text-white">{selectedVehicle.plateNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Vehicle ID</p>
                      <p className="font-medium text-slate-900 dark:text-white">{selectedVehicle.vehicleId}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Color & Fuel</p>
                      <p className="font-medium text-slate-900 dark:text-white">{selectedVehicle.color} • {selectedVehicle.fuelType}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Owner Info */}
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-400" /> Owner & Contact
                </h4>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-4 border border-slate-100 dark:border-slate-800">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Registered Owner</p>
                      <p className="font-medium text-slate-900 dark:text-white">{selectedVehicle.ownerName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Emergency Contact</p>
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-slate-900 dark:text-white">{selectedVehicle.emergencyContact}</p>
                        <button className="text-blue-600 dark:text-blue-400 hover:text-blue-700 bg-blue-50 dark:bg-blue-900/30 p-1.5 rounded-md">
                          <Phone className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* eCall System */}
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Radio className="w-4 h-4 text-slate-400" /> eCall System
                </h4>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-4 border border-slate-100 dark:border-slate-800">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">System Mode</p>
                      <p className="font-medium text-slate-900 dark:text-white">{selectedVehicle.eCallMode}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Risk Level</p>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider inline-block
                        ${selectedVehicle.riskLevel === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 
                          selectedVehicle.riskLevel === 'medium' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' : 
                          'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'}`}>
                        {selectedVehicle.riskLevel}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Total Incidents</p>
                      <p className="font-medium text-slate-900 dark:text-white">{selectedVehicle.incidentCount}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Last SOS Event</p>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {selectedVehicle.lastSosTime ? new Date(selectedVehicle.lastSosTime).toLocaleDateString() : 'None recorded'}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Last Known Location</p>
                      <p className="font-medium text-slate-900 dark:text-white flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {selectedVehicle.lastLocation || 'Unknown'}
                      </p>
                    </div>
                    {selectedVehicle.notes && (
                      <div className="col-span-2">
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Notes</p>
                        <p className="font-medium text-slate-900 dark:text-white text-sm bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                          {selectedVehicle.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
            
            <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex flex-wrap gap-3">
              <button 
                onClick={() => navigate('/history')}
                className="flex-1 min-w-36 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 py-2.5 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                View Full History
              </button>
              <button
                onClick={() => navigate(`/digital-twin?vehicle=${encodeURIComponent(selectedVehicle.vehicleId)}`)}
                className="flex-1 min-w-36 bg-cyan-600 hover:bg-cyan-700 text-white py-2.5 rounded-lg font-medium transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                <Activity className="w-4 h-4" />
                Digital Twin
              </button>
              {selectedVehicle.status === 'In Alert' && (
                <button 
                  onClick={() => navigate('/alerts')}
                  className="flex-1 min-w-36 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-lg font-medium transition-colors shadow-sm"
                >
                  Open Incident
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
