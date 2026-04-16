import { AnalyticsData, Hospital, Incident, Operator, Vehicle, Weather } from '../types';

let incidents: Incident[] = [
  {
    incidentId: 'INC-2026-001',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    triggerType: 'automatic',
    severity: 'high',
    status: 'New Alert',
    latitude: 3.1579,
    longitude: 101.7116,
    address: 'Jalan Ampang, Kuala Lumpur, Malaysia',
    vehicleId: 'VEH-9921',
    plateNumber: 'VAA 8899',
    vehicleBrand: 'Proton',
    vehicleModel: 'X70',
    passengerCount: 2,
    passengerCondition: 'Unknown',
    notes: 'Airbag deployed. Multiple impacts detected.',
    assignedOperator: null,
    responseTime: null,
    mode: 'NG eCall',
    msdReceived: true,
    aiSummary:
      'High-severity automatic SOS event detected near Ampang. Vehicle VAA 8899, 2 occupants, nearest hospital is 3.2 km away. Immediate dispatch recommended.',
    aiSeverity: 'Critical',
    aiRecommendations: ['Dispatch Ambulance (Nearest: Gleneagles)', 'Notify Traffic Police', 'Prepare Trauma Unit'],
    telemetry: {
      airbagDeployed: true,
      crashDetected: true,
      deltaV: 45,
      collisionType: 'front',
      impactLevel: 'high',
      possibleEntrapment: true,
      passengerCondition: 'unconscious',
    },
    actionLogs: [{ timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), action: 'System: SOS received from vehicle.' }],
  },
  {
    incidentId: 'INC-2026-002',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    triggerType: 'manual',
    severity: 'medium',
    status: 'Dispatching',
    latitude: 3.1149,
    longitude: 101.6288,
    address: 'Lebuhraya Damansara-Puchong (LDP), Petaling Jaya, Malaysia',
    vehicleId: 'VEH-4412',
    plateNumber: 'BND 1234',
    vehicleBrand: 'Perodua',
    vehicleModel: 'Myvi',
    passengerCount: 1,
    passengerCondition: 'Conscious, minor injuries',
    notes: 'Driver pressed SOS button. Reports minor collision with barrier.',
    assignedOperator: 'Op-Jane',
    responseTime: 45,
    mode: 'Classic',
    msdReceived: true,
    aiSummary:
      'Manual eCall triggered on LDP Highway. 1 occupant reported. Possible minor collision or medical issue.',
    aiSeverity: 'Medium',
    aiRecommendations: ['Attempt Voice Call to Vehicle', 'Dispatch Tow Truck'],
    telemetry: {
      airbagDeployed: false,
      crashDetected: true,
      deltaV: 15,
      collisionType: 'side',
      impactLevel: 'medium',
      possibleEntrapment: false,
      passengerCondition: 'normal',
    },
    actionLogs: [
      { timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), action: 'System: SOS received from vehicle.' },
      { timestamp: new Date(Date.now() - 1000 * 60 * 29).toISOString(), action: 'Op-Jane: Acknowledged alert.' },
      { timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(), action: 'Op-Jane: Contacted driver. Dispatching tow and medical.' },
    ],
  },
  {
    incidentId: 'INC-2026-003',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    triggerType: 'automatic',
    severity: 'low',
    status: 'Resolved',
    latitude: 3.0471,
    longitude: 101.5832,
    address: 'Persiaran Kewajipan, Subang Jaya, Malaysia',
    vehicleId: 'VEH-1109',
    plateNumber: 'JQ 5566',
    vehicleBrand: 'Honda',
    vehicleModel: 'Civic',
    passengerCount: 1,
    passengerCondition: 'Uninjured',
    notes: 'False alarm. Sensor malfunction due to pothole.',
    assignedOperator: 'Op-Mark',
    responseTime: 120,
    mode: 'NG eCall',
    msdReceived: false,
    aiSummary:
      'Automatic eCall triggered near Subang Jaya. 1 occupant. No MSD data received. High probability of false alarm.',
    aiSeverity: 'Low',
    aiRecommendations: ['Attempt Voice Call to Vehicle', 'Monitor for further signals'],
    aiReport:
      'Incident INC-2026-003 was triggered automatically at 14:22 near Subang Jaya. The case involved 1 occupant and was categorized as low severity. Voice contact established at 14:25, false alarm confirmed, and the case was marked resolved at 14:28.',
    telemetry: {
      airbagDeployed: false,
      crashDetected: false,
      deltaV: 5,
      collisionType: 'none',
      impactLevel: 'low',
      possibleEntrapment: false,
      passengerCondition: 'normal',
    },
    actionLogs: [
      { timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), action: 'System: SOS received from vehicle.' },
      { timestamp: new Date(Date.now() - 1000 * 60 * 58).toISOString(), action: 'Op-Mark: Acknowledged alert.' },
      { timestamp: new Date(Date.now() - 1000 * 60 * 55).toISOString(), action: 'Op-Mark: Spoke with driver. Confirmed false alarm.' },
      { timestamp: new Date(Date.now() - 1000 * 60 * 54).toISOString(), action: 'Op-Mark: Resolved incident.' },
    ],
  },
];

const vehicles: Vehicle[] = [
  {
    vehicleId: 'VEH-9921',
    plateNumber: 'VAA 8899',
    brand: 'Proton',
    model: 'X70',
    color: 'Silver',
    ownerName: 'Ahmad bin Ali',
    emergencyContact: '+60 12 345 6789',
    fuelType: 'Petrol',
    riskLevel: 'low',
    status: 'In Alert',
    lastSosTime: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    incidentCount: 1,
    assignedRegion: 'Kuala Lumpur',
    eCallMode: 'NG eCall',
    lastLocation: 'Jalan Ampang, Kuala Lumpur',
    notes: 'Vehicle involved in a high-severity collision. Airbags deployed.',
  },
  {
    vehicleId: 'VEH-4412',
    plateNumber: 'BND 1234',
    brand: 'Perodua',
    model: 'Myvi',
    color: 'Yellow',
    ownerName: 'Tan Wei Ming',
    emergencyContact: '+60 19 876 5432',
    fuelType: 'Petrol',
    riskLevel: 'medium',
    status: 'In Alert',
    lastSosTime: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    incidentCount: 3,
    assignedRegion: 'Selangor',
    eCallMode: 'Classic',
    lastLocation: 'LDP Highway, Petaling Jaya',
    notes: 'Frequent minor incidents. Driver tends to speed on highways.',
  },
  {
    vehicleId: 'VEH-1109',
    plateNumber: 'JQ 5566',
    brand: 'Honda',
    model: 'Civic',
    color: 'White',
    ownerName: 'Siti Nurhaliza',
    emergencyContact: '+60 11 2233 4455',
    fuelType: 'Hybrid',
    riskLevel: 'low',
    status: 'Resolved',
    lastSosTime: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    incidentCount: 1,
    assignedRegion: 'Selangor',
    eCallMode: 'NG eCall',
    lastLocation: 'Subang Jaya',
    notes: 'Recent false alarm due to sensor malfunction.',
  },
  {
    vehicleId: 'VEH-8833',
    plateNumber: 'WXY 9090',
    brand: 'Toyota',
    model: 'Camry',
    color: 'Black',
    ownerName: 'Lim Chong Wei',
    emergencyContact: '+60 16 555 7777',
    fuelType: 'Hybrid',
    riskLevel: 'high',
    status: 'Normal',
    lastSosTime: null,
    incidentCount: 0,
    assignedRegion: 'Penang',
    eCallMode: 'NG eCall',
    lastLocation: 'George Town, Penang',
    notes: 'VIP client. Ensure rapid response if SOS is triggered.',
  },
  {
    vehicleId: 'VEH-5522',
    plateNumber: 'JST 1122',
    brand: 'Nissan',
    model: 'Almera',
    color: 'Red',
    ownerName: 'Nurul Huda',
    emergencyContact: '+60 13 444 8888',
    fuelType: 'Petrol',
    riskLevel: 'medium',
    status: 'Normal',
    lastSosTime: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    incidentCount: 2,
    assignedRegion: 'Johor',
    eCallMode: 'Classic',
    lastLocation: 'Johor Bahru City Center',
    notes: 'Vehicle requires manual verification for SOS events.',
  },
];

const hospitals: Hospital[] = [
  { id: 'H-01', name: 'Kuala Lumpur Hospital (HKL)', latitude: 3.1717, longitude: 101.7014, phone: '+60 3-2615 5555' },
  { id: 'H-02', name: 'Gleneagles Kuala Lumpur', latitude: 3.16, longitude: 101.737, phone: '+60 3-4141 3000' },
  { id: 'H-03', name: 'Pantai Hospital Kuala Lumpur', latitude: 3.1196, longitude: 101.6664, phone: '+60 3-2296 0888' },
  { id: 'H-04', name: 'Sunway Medical Centre', latitude: 3.0655, longitude: 101.6044, phone: '+60 3-7491 9191' },
  { id: 'H-05', name: 'Hospital Ampang', latitude: 3.1292, longitude: 101.7634, phone: '+60 3-4289 2000' },
];

const weather: Weather = {
  location: 'Kuala Lumpur, Malaysia',
  temperature: 32,
  condition: 'Scattered Thunderstorms',
  humidity: 78,
  windSpeed: 12,
  icon: 'cloud-lightning',
};

let operators: Operator[] = [
  {
    id: 'OP-001',
    name: 'Jane Doe',
    role: 'Supervisor',
    status: 'Available',
    activeIncidents: 2,
    activeIncidentIds: ['INC-2026-002', 'INC-2026-005'],
    shift: 'Morning Shift',
    shiftStart: '08:00',
    shiftEnd: '16:00',
    contact: '+60 12 345 1111',
    assignedRegion: 'Kuala Lumpur',
    todayHandledCases: 12,
    lastActiveTime: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    skills: ['First Aid', 'Crisis Management', 'Bilingual (EN/MS)'],
    averageResponseTime: '45s',
    notes: 'Senior supervisor, handles high-severity cases.',
  },
  {
    id: 'OP-002',
    name: 'Mark Smith',
    role: 'Dispatcher',
    status: 'Dispatching',
    activeIncidents: 1,
    activeIncidentIds: ['INC-2026-003'],
    shift: 'Morning Shift',
    shiftStart: '08:00',
    shiftEnd: '16:00',
    contact: '+60 12 345 2222',
    assignedRegion: 'Selangor',
    todayHandledCases: 8,
    lastActiveTime: new Date(Date.now() - 1000 * 60).toISOString(),
    skills: ['Traffic Control', 'Medical Dispatch'],
    averageResponseTime: '52s',
    notes: 'Specializes in highway incidents.',
  },
  {
    id: 'OP-003',
    name: 'Ahmad Razak',
    role: 'Call Taker',
    status: 'Offline',
    activeIncidents: 0,
    activeIncidentIds: [],
    shift: 'Evening Shift',
    shiftStart: '16:00',
    shiftEnd: '00:00',
    contact: '+60 12 345 3333',
    assignedRegion: 'Johor',
    todayHandledCases: 0,
    lastActiveTime: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    skills: ['Bilingual (MS/ZH)'],
    averageResponseTime: '38s',
    notes: 'On leave until tomorrow.',
  },
  {
    id: 'OP-004',
    name: 'Sarah Lee',
    role: 'Dispatcher',
    status: 'Handling Call',
    activeIncidents: 1,
    activeIncidentIds: ['INC-2026-008'],
    shift: 'Morning Shift',
    shiftStart: '08:00',
    shiftEnd: '16:00',
    contact: '+60 12 345 4444',
    assignedRegion: 'Penang',
    todayHandledCases: 15,
    lastActiveTime: new Date(Date.now() - 1000 * 15).toISOString(),
    skills: ['Medical Dispatch', 'Bilingual (EN/ZH)'],
    averageResponseTime: '41s',
    notes: 'Fastest response time this month.',
  },
  {
    id: 'OP-005',
    name: 'David Wong',
    role: 'Call Taker',
    status: 'On Break',
    activeIncidents: 0,
    activeIncidentIds: [],
    shift: 'Morning Shift',
    shiftStart: '08:00',
    shiftEnd: '16:00',
    contact: '+60 12 345 5555',
    assignedRegion: 'Kuala Lumpur',
    todayHandledCases: 22,
    lastActiveTime: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    skills: ['Crisis Management'],
    averageResponseTime: '48s',
    notes: 'Taking a 15-minute break.',
  },
];

function sortIncidents() {
  return [...incidents].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

function getAnalytics(): AnalyticsData {
  const total = incidents.length;
  const active = incidents.filter((i) => !['Resolved', 'Closed'].includes(i.status)).length;
  const resolved = incidents.filter((i) => ['Resolved', 'Closed'].includes(i.status)).length;
  const responseTimes = incidents.filter((i) => i.responseTime !== null).map((i) => i.responseTime as number);
  const avgResponseTime = responseTimes.length > 0 ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length) : 0;

  return {
    summary: { total, active, resolved, avgResponseTime },
    severityDistribution: {
      high: incidents.filter((i) => i.severity === 'high').length,
      medium: incidents.filter((i) => i.severity === 'medium').length,
      low: incidents.filter((i) => i.severity === 'low').length,
    },
    triggerDistribution: {
      automatic: incidents.filter((i) => i.triggerType === 'automatic').length,
      manual: incidents.filter((i) => i.triggerType === 'manual').length,
    },
  };
}

export const mockPlatformApi = {
  getIncidents: async () => sortIncidents(),
  getIncident: async (id: string) => {
    const incident = incidents.find((item) => item.incidentId === id);
    if (!incident) {
      throw new Error('Incident not found');
    }
    return incident;
  },
  createIncident: async (data: Partial<Incident>) => {
    const newIncident: Incident = {
      incidentId: `INC-${new Date().getFullYear()}-${String(incidents.length + 1).padStart(3, '0')}`,
      timestamp: new Date().toISOString(),
      triggerType: 'automatic',
      severity: 'medium',
      status: 'New Alert',
      latitude: 3.139,
      longitude: 101.6869,
      address: 'Kuala Lumpur, Malaysia',
      vehicleId: 'VEH-NEW',
      plateNumber: 'TMP 0000',
      vehicleBrand: 'Unknown',
      vehicleModel: 'Unknown',
      passengerCount: 1,
      passengerCondition: 'Unknown',
      notes: '',
      assignedOperator: null,
      responseTime: null,
      mode: 'NG eCall',
      msdReceived: true,
      actionLogs: [{ timestamp: new Date().toISOString(), action: 'System: SOS received from vehicle.' }],
      ...data,
    };

    incidents = [newIncident, ...incidents];
    return newIncident;
  },
  updateIncidentStatus: async (id: string, status: string, operator: string, note?: string) => {
    const incidentIndex = incidents.findIndex((item) => item.incidentId === id);
    if (incidentIndex === -1) {
      throw new Error('Incident not found');
    }

    const incident = incidents[incidentIndex];
    const updatedIncident: Incident = {
      ...incident,
      status: status as Incident['status'],
      assignedOperator: incident.assignedOperator || operator || null,
      responseTime:
        incident.responseTime ??
        (operator ? Math.floor((Date.now() - new Date(incident.timestamp).getTime()) / 1000) : null),
      actionLogs: [
        ...incident.actionLogs,
        {
          timestamp: new Date().toISOString(),
          action: `${operator || 'System'}: Status updated to ${status}.${note ? ` Note: ${note}` : ''}`,
        },
      ],
    };

    incidents[incidentIndex] = updatedIncident;
    return updatedIncident;
  },
  getVehicles: async () => vehicles,
  getHospitals: async () => hospitals,
  getWeather: async () => weather,
  getOperators: async () => operators,
  createOperator: async (data: Partial<Operator>) => {
    const newOperator: Operator = {
      id: `OP-${String(operators.length + 1).padStart(3, '0')}`,
      name: data.name || 'New Operator',
      role: (data.role as Operator['role']) || 'Dispatcher',
      status: (data.status as Operator['status']) || 'Offline',
      activeIncidents: data.activeIncidents || 0,
      activeIncidentIds: data.activeIncidentIds || [],
      shift: (data.shift as Operator['shift']) || 'Morning Shift',
      shiftStart: data.shiftStart || '08:00',
      shiftEnd: data.shiftEnd || '16:00',
      contact: data.contact || '',
      assignedRegion: data.assignedRegion || '',
      todayHandledCases: data.todayHandledCases || 0,
      lastActiveTime: data.lastActiveTime || new Date().toISOString(),
      skills: data.skills || [],
      averageResponseTime: data.averageResponseTime || '0s',
      notes: data.notes || '',
    };

    operators = [...operators, newOperator];
    return newOperator;
  },
  updateOperator: async (id: string, data: Partial<Operator>) => {
    const index = operators.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new Error('Operator not found');
    }

    operators[index] = { ...operators[index], ...data };
    return operators[index];
  },
  deleteOperator: async (id: string) => {
    operators = operators.filter((item) => item.id !== id);
  },
  getAnalytics: async () => getAnalytics(),
};
