import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';

// --- Mock Data ---

let incidents = [
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
    aiSummary: 'High-severity automatic SOS event detected near Ampang. Vehicle VAA 8899, 2 occupants, nearest hospital is 3.2 km away. Immediate dispatch recommended.',
    aiSeverity: 'Critical',
    aiRecommendations: ['Dispatch Ambulance (Nearest: Gleneagles)', 'Notify Traffic Police', 'Prepare Trauma Unit'],
    telemetry: {
      airbagDeployed: true,
      crashDetected: true,
      deltaV: 45,
      collisionType: 'front',
      impactLevel: 'high',
      possibleEntrapment: true,
      passengerCondition: 'unconscious'
    },
    actionLogs: [
      { timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), action: 'System: SOS received from vehicle.' }
    ]
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
    aiSummary: 'Manual eCall triggered on LDP Highway. 1 occupant reported. Possible minor collision or medical issue.',
    aiSeverity: 'Medium',
    aiRecommendations: ['Attempt Voice Call to Vehicle', 'Dispatch Tow Truck'],
    telemetry: {
      airbagDeployed: false,
      crashDetected: true,
      deltaV: 15,
      collisionType: 'side',
      impactLevel: 'medium',
      possibleEntrapment: false,
      passengerCondition: 'normal'
    },
    actionLogs: [
      { timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), action: 'System: SOS received from vehicle.' },
      { timestamp: new Date(Date.now() - 1000 * 60 * 29).toISOString(), action: 'Op-Jane: Acknowledged alert.' },
      { timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(), action: 'Op-Jane: Contacted driver. Dispatching tow and medical.' }
    ]
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
    aiSummary: 'Automatic eCall triggered near Subang Jaya. 1 occupant. No MSD data received. High probability of false alarm.',
    aiSeverity: 'Low',
    aiRecommendations: ['Attempt Voice Call to Vehicle', 'Monitor for further signals'],
    aiReport: 'Incident INC-2026-003 was triggered automatically at 14:22 near Subang Jaya. The case involved 1 occupant and was categorized as low severity. Voice contact established at 14:25, false alarm confirmed, and the case was marked resolved at 14:28.',
    telemetry: {
      airbagDeployed: false,
      crashDetected: false,
      deltaV: 5,
      collisionType: 'none',
      impactLevel: 'low',
      possibleEntrapment: false,
      passengerCondition: 'normal'
    },
    actionLogs: [
      { timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), action: 'System: SOS received from vehicle.' },
      { timestamp: new Date(Date.now() - 1000 * 60 * 58).toISOString(), action: 'Op-Mark: Acknowledged alert.' },
      { timestamp: new Date(Date.now() - 1000 * 60 * 55).toISOString(), action: 'Op-Mark: Spoke with driver. Confirmed false alarm.' },
      { timestamp: new Date(Date.now() - 1000 * 60 * 54).toISOString(), action: 'Op-Mark: Resolved incident.' }
    ]
  }
];

const vehicles = [
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
    notes: 'Vehicle involved in a high-severity collision. Airbags deployed.'
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
    notes: 'Frequent minor incidents. Driver tends to speed on highways.'
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
    notes: 'Recent false alarm due to sensor malfunction.'
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
    notes: 'VIP client. Ensure rapid response if SOS is triggered.'
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
    notes: 'Vehicle requires manual verification for SOS events.'
  }
];

const hospitals = [
  { id: 'H-01', name: 'Kuala Lumpur Hospital (HKL)', latitude: 3.1717, longitude: 101.7014, phone: '+60 3-2615 5555' },
  { id: 'H-02', name: 'Gleneagles Kuala Lumpur', latitude: 3.1600, longitude: 101.7370, phone: '+60 3-4141 3000' },
  { id: 'H-03', name: 'Pantai Hospital Kuala Lumpur', latitude: 3.1196, longitude: 101.6664, phone: '+60 3-2296 0888' },
  { id: 'H-04', name: 'Sunway Medical Centre', latitude: 3.0655, longitude: 101.6044, phone: '+60 3-7491 9191' },
  { id: 'H-05', name: 'University Malaya Medical Centre (UMMC)', latitude: 3.1125, longitude: 101.6534, phone: '+60 3-7949 4422' },
  { id: 'H-06', name: 'Hospital Serdang', latitude: 2.9753, longitude: 101.7211, phone: '+60 3-8947 5555' },
  { id: 'H-07', name: 'Hospital Sungai Buloh', latitude: 3.2195, longitude: 101.5833, phone: '+60 3-6145 4333' },
  { id: 'H-08', name: 'Hospital Ampang', latitude: 3.1292, longitude: 101.7634, phone: '+60 3-4289 2000' },
  { id: 'H-09', name: 'Hospital Selayang', latitude: 3.2435, longitude: 101.6444, phone: '+60 3-6120 3233' },
  { id: 'H-10', name: 'Hospital Shah Alam', latitude: 3.0715, longitude: 101.4898, phone: '+60 3-5526 3000' },
  { id: 'H-11', name: 'Hospital Tengku Ampuan Rahimah', latitude: 3.0300, longitude: 101.4355, phone: '+60 3-3323 9444' },
  { id: 'H-12', name: 'Assunta Hospital', latitude: 3.0945, longitude: 101.6440, phone: '+60 3-7872 3000' },
  { id: 'H-13', name: 'KPJ Damansara Specialist Hospital', latitude: 3.1368, longitude: 101.6231, phone: '+60 3-7718 1000' },
  { id: 'H-14', name: 'Hospital Putrajaya', latitude: 2.9292, longitude: 101.6742, phone: '+60 3-8312 4200' },
  { id: 'H-15', name: 'Hospital Cyberjaya', latitude: 2.9288, longitude: 101.6381, phone: '+60 3-8312 8000' },
  { id: 'H-16', name: 'Hospital Kajang', latitude: 2.9935, longitude: 101.7909, phone: '+60 3-8913 3333' },
  { id: 'H-17', name: 'Hospital Banting', latitude: 2.8167, longitude: 101.4967, phone: '+60 3-3187 1333' },
  { id: 'H-18', name: 'Hospital Tuanku Ja\'afar (Seremban)', latitude: 2.7169, longitude: 101.9431, phone: '+60 6-768 4000' },
  { id: 'H-19', name: 'Hospital Melaka', latitude: 2.2172, longitude: 102.2615, phone: '+60 6-289 2344' },
  { id: 'H-20', name: 'Hospital Sultanah Aminah (Johor Bahru)', latitude: 1.4590, longitude: 103.7465, phone: '+60 7-225 7000' },
  { id: 'H-21', name: 'Hospital Sultan Ismail (Johor Bahru)', latitude: 1.5518, longitude: 103.7946, phone: '+60 7-356 5000' },
  { id: 'H-22', name: 'Hospital Raja Permaisuri Bainun (Ipoh)', latitude: 4.6033, longitude: 101.0900, phone: '+60 5-208 5000' },
  { id: 'H-23', name: 'Hospital Pulau Pinang', latitude: 5.4170, longitude: 100.3113, phone: '+60 4-222 5333' },
  { id: 'H-24', name: 'Hospital Sultanah Bahiyah (Alor Setar)', latitude: 6.1488, longitude: 100.4065, phone: '+60 4-740 6233' },
  { id: 'H-25', name: 'Hospital Tengku Ampuan Afzan (Kuantan)', latitude: 3.8010, longitude: 103.3218, phone: '+60 9-513 3333' },
  { id: 'H-26', name: 'Hospital Sultanah Nur Zahirah (Kuala Terengganu)', latitude: 5.3248, longitude: 103.1493, phone: '+60 9-621 2121' },
  { id: 'H-27', name: 'Hospital Raja Perempuan Zainab II (Kota Bharu)', latitude: 6.1248, longitude: 102.2457, phone: '+60 9-745 2000' }
];

const weather = {
  location: 'Kuala Lumpur, Malaysia',
  temperature: 32,
  condition: 'Scattered Thunderstorms',
  humidity: 78,
  windSpeed: 12,
  icon: 'cloud-lightning'
};

let operators = [
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
    notes: 'Senior supervisor, handles high-severity cases.'
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
    lastActiveTime: new Date(Date.now() - 1000 * 60 * 1).toISOString(),
    skills: ['Traffic Control', 'Medical Dispatch'],
    averageResponseTime: '52s',
    notes: 'Specializes in highway incidents.'
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
    notes: 'On leave until tomorrow.'
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
    notes: 'Fastest response time this month.'
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
    notes: 'Taking a 15-minute break.'
  },
];

// --- Server Setup ---

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API Routes ---

  app.get('/api/incidents', (req, res) => {
    res.json(incidents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
  });

  app.get('/api/incidents/:id', (req, res) => {
    const incident = incidents.find(i => i.incidentId === req.params.id);
    if (incident) {
      res.json(incident);
    } else {
      res.status(404).json({ error: 'Incident not found' });
    }
  });

  app.post('/api/incidents', (req, res) => {
    const newIncident = {
      incidentId: `INC-${new Date().getFullYear()}-${String(incidents.length + 1).padStart(3, '0')}`,
      timestamp: new Date().toISOString(),
      status: 'New Alert',
      assignedOperator: null,
      responseTime: null,
      mode: 'NG eCall',
      msdReceived: true,
      actionLogs: [
        { timestamp: new Date().toISOString(), action: 'System: SOS received from vehicle.' }
      ],
      ...req.body
    };
    incidents.push(newIncident);
    res.status(201).json(newIncident);
  });

  app.put('/api/incidents/:id/status', (req, res) => {
    const { status, operator, note } = req.body;
    const incidentIndex = incidents.findIndex(i => i.incidentId === req.params.id);
    
    if (incidentIndex !== -1) {
      const incident = incidents[incidentIndex];
      incident.status = status;
      if (operator && !incident.assignedOperator) {
        incident.assignedOperator = operator;
        incident.responseTime = Math.floor((new Date().getTime() - new Date(incident.timestamp).getTime()) / 1000);
      }
      
      let actionText = `${operator || 'System'}: Status updated to ${status}.`;
      if (note) actionText += ` Note: ${note}`;
      
      incident.actionLogs.push({
        timestamp: new Date().toISOString(),
        action: actionText
      });
      
      res.json(incident);
    } else {
      res.status(404).json({ error: 'Incident not found' });
    }
  });

  app.get('/api/vehicles', (req, res) => {
    res.json(vehicles);
  });

  app.get('/api/hospitals', (req, res) => {
    res.json(hospitals);
  });

  app.get('/api/weather', (req, res) => {
    res.json(weather);
  });

  app.get('/api/operators', (req, res) => {
    res.json(operators);
  });

  app.post('/api/operators', (req, res) => {
    const newOperator = {
      id: `OP-${String(operators.length + 1).padStart(3, '0')}`,
      activeIncidents: 0,
      ...req.body
    };
    operators.push(newOperator);
    res.status(201).json(newOperator);
  });

  app.put('/api/operators/:id', (req, res) => {
    const index = operators.findIndex(o => o.id === req.params.id);
    if (index !== -1) {
      operators[index] = { ...operators[index], ...req.body };
      res.json(operators[index]);
    } else {
      res.status(404).json({ error: 'Operator not found' });
    }
  });

  app.delete('/api/operators/:id', (req, res) => {
    operators = operators.filter(o => o.id !== req.params.id);
    res.status(204).send();
  });

  app.get('/api/analytics', (req, res) => {
    const total = incidents.length;
    const active = incidents.filter(i => !['Resolved', 'Closed'].includes(i.status)).length;
    const resolved = incidents.filter(i => ['Resolved', 'Closed'].includes(i.status)).length;
    
    const responseTimes = incidents.filter(i => i.responseTime !== null).map(i => i.responseTime as number);
    const avgResponseTime = responseTimes.length > 0 
      ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length) 
      : 0;

    const severityDistribution = {
      high: incidents.filter(i => i.severity === 'high').length,
      medium: incidents.filter(i => i.severity === 'medium').length,
      low: incidents.filter(i => i.severity === 'low').length,
    };

    const triggerDistribution = {
      automatic: incidents.filter(i => i.triggerType === 'automatic').length,
      manual: incidents.filter(i => i.triggerType === 'manual').length,
    };

    res.json({
      summary: { total, active, resolved, avgResponseTime },
      severityDistribution,
      triggerDistribution
    });
  });

  // --- Vite Middleware ---

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
