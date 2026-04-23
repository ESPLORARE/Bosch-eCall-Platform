import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import express, { type NextFunction, type Request, type Response } from 'express';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { generateAssistantFallback } from './src/services/assistantMock';
import { createPlatformStore, type AuthUser, type PlatformStore } from './src/server/platformStore';
import type { Hospital, Incident, Operator, Vehicle, Weather } from './src/types';

for (const envFile of ['.env.local', '.env']) {
  if (fs.existsSync(envFile)) {
    dotenv.config({ path: envFile, override: false });
  }
}

const SESSION_COOKIE = 'bosch_session';
const authRateLimits = new Map<string, { count: number; resetAt: number }>();
const INCIDENT_STATUSES: Incident['status'][] = [
  'New Alert',
  'Acknowledged',
  'Verifying',
  'Dispatching',
  'Responders En Route',
  'Resolved',
  'Closed',
];
const INCIDENT_TRANSITIONS: Record<Incident['status'], Incident['status'][]> = {
  'New Alert': ['Acknowledged', 'Verifying', 'Dispatching'],
  Acknowledged: ['Verifying', 'Dispatching'],
  Verifying: ['Dispatching', 'Responders En Route', 'Resolved'],
  Dispatching: ['Responders En Route', 'Resolved'],
  'Responders En Route': ['Resolved'],
  Resolved: ['Closed'],
  Closed: [],
};
const INCIDENT_ROLE_TRANSITIONS: Record<AuthUser['role'], Incident['status'][]> = {
  Admin: INCIDENT_STATUSES,
  Supervisor: INCIDENT_STATUSES,
  Dispatcher: ['Acknowledged', 'Verifying', 'Dispatching', 'Responders En Route', 'Resolved'],
  'Call Taker': ['Acknowledged', 'Verifying'],
};
const AUTH_ROLES: AuthUser['role'][] = ['Admin', 'Supervisor', 'Dispatcher', 'Call Taker'];
const AUTH_STATUSES: AuthUser['status'][] = ['Active', 'Suspended'];
const realtimeClients = new Set<Response>();

type RealtimePayload = {
  type: string;
  title: string;
  description: string;
  entityId?: string;
  payload?: Record<string, unknown>;
};

function parseCookies(cookieHeader = '') {
  return Object.fromEntries(
    cookieHeader
      .split(';')
      .map((cookie) => cookie.trim())
      .filter(Boolean)
      .map((cookie) => {
        const separatorIndex = cookie.indexOf('=');
        return separatorIndex === -1
          ? [cookie, '']
          : [cookie.slice(0, separatorIndex), decodeURIComponent(cookie.slice(separatorIndex + 1))];
      }),
  );
}

function getClientIp(req: Request) {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string') {
    return forwardedFor.split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown';
}

function setSessionCookie(res: Response, token: string, expiresAt: string) {
  const secure = process.env.COOKIE_SECURE === 'false' ? '' : process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict; Expires=${new Date(expiresAt).toUTCString()}${secure}`,
  );
}

function clearSessionCookie(res: Response) {
  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Expires=Thu, 01 Jan 1970 00:00:00 GMT`,
  );
}

function sanitizeAuthUser(user: unknown) {
  return user;
}

function getRegistrationInviteCodeStatus(store: PlatformStore) {
  const databaseCode = store.getRegistrationInviteCode();
  const environmentCode = process.env.REGISTRATION_CODE;
  const code = databaseCode || environmentCode || '';
  return {
    code,
    isConfigured: Boolean(code),
    source: databaseCode ? 'database' : environmentCode ? 'environment' : 'none',
  } as const;
}

function isStrongEnoughPassword(password: string) {
  return (
    password.length >= 10 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

function isAuthRateLimited(req: Request) {
  const ip = getClientIp(req);
  const now = Date.now();
  const current = authRateLimits.get(ip);

  if (!current || current.resetAt <= now) {
    authRateLimits.set(ip, { count: 1, resetAt: now + 10 * 60 * 1000 });
    return false;
  }

  current.count += 1;
  return current.count > 20;
}

function getAuthUser(res: Response) {
  return res.locals.authUser as AuthUser | undefined;
}

function requireRoles(roles: AuthUser['role'][]) {
  return (_req: Request, res: Response, next: NextFunction) => {
    const user = getAuthUser(res);
    if (!user || !roles.includes(user.role)) {
      res.status(403).json({ error: 'You do not have permission to perform this action' });
      return;
    }
    next();
  };
}

function isIncidentStatus(value: unknown): value is Incident['status'] {
  return typeof value === 'string' && INCIDENT_STATUSES.includes(value as Incident['status']);
}

function getAllowedIncidentStatuses(user: AuthUser, currentStatus: Incident['status']) {
  const transitionTargets = INCIDENT_TRANSITIONS[currentStatus] || [];
  const roleTargets = INCIDENT_ROLE_TRANSITIONS[user.role] || [];
  return transitionTargets.filter((status) => roleTargets.includes(status));
}

function canUpdateIncidentStatus(user: AuthUser, currentStatus: Incident['status'], nextStatus: Incident['status']) {
  if (currentStatus === nextStatus) {
    return true;
  }
  return getAllowedIncidentStatuses(user, currentStatus).includes(nextStatus);
}

function isAuthRole(value: unknown): value is AuthUser['role'] {
  return typeof value === 'string' && AUTH_ROLES.includes(value as AuthUser['role']);
}

function isAuthStatus(value: unknown): value is AuthUser['status'] {
  return typeof value === 'string' && AUTH_STATUSES.includes(value as AuthUser['status']);
}

function publishRealtimeEvent(event: RealtimePayload) {
  const payload = {
    id: `EVT-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    createdAt: new Date().toISOString(),
    ...event,
  };
  const frame = `event: platform\nid: ${payload.id}\ndata: ${JSON.stringify(payload)}\n\n`;

  for (const client of realtimeClients) {
    client.write(frame);
  }
}

// --- Mock Data ---

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

const hospitals: Hospital[] = [
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

const weather: Weather = {
  location: 'Kuala Lumpur, Malaysia',
  temperature: 32,
  condition: 'Scattered Thunderstorms',
  humidity: 78,
  windSpeed: 12,
  icon: 'cloud-lightning'
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
  const PORT = Number(process.env.PORT) || 3000;
  const store = await createPlatformStore();

  app.disable('x-powered-by');
  app.use(express.json({ limit: '64kb' }));
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');
    next();
  });

  // --- API Routes ---

  app.get('/api/health', (req, res) => {
    res.json(store.health());
  });

  app.get('/api/auth/bootstrap', (req, res) => {
    const hasUsers = store.hasUsers();
    const registrationCode = getRegistrationInviteCodeStatus(store);
    res.json({
      hasUsers,
      registrationRequiresInvite: hasUsers,
      registrationEnabled: !hasUsers || registrationCode.isConfigured,
    });
  });

  app.post('/api/auth/register', (req, res) => {
    if (isAuthRateLimited(req)) {
      res.status(429).json({ error: 'Too many authentication attempts. Please try again later.' });
      return;
    }

    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const registrationCode = typeof req.body?.registrationCode === 'string' ? req.body.registrationCode.trim() : '';
    const isFirstUser = !store.hasUsers();

    if (!name || !email || !password) {
      res.status(400).json({ error: 'Name, email, and password are required' });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: 'Please enter a valid email address' });
      return;
    }

    if (!isStrongEnoughPassword(password)) {
      res.status(400).json({
        error: 'Password must be at least 10 characters and include uppercase, lowercase, number, and symbol',
      });
      return;
    }

    if (!isFirstUser) {
      const expectedCode = getRegistrationInviteCodeStatus(store).code;
      if (!expectedCode || registrationCode !== expectedCode) {
        res.status(403).json({ error: 'Registration requires an organization invite code' });
        return;
      }
    }

    const user = store.registerUser({
      name,
      email,
      password,
      role: isFirstUser ? 'Admin' : 'Dispatcher',
      actor: email,
    });

    if (!user) {
      res.status(409).json({ error: 'An account with this email already exists' });
      return;
    }

    const login = store.authenticateUser(email, password, {
      ip: getClientIp(req),
      userAgent: req.headers['user-agent'],
    });

    if (!login.ok) {
      res.status(201).json({ user: sanitizeAuthUser(user) });
      return;
    }

    setSessionCookie(res, login.session.token, login.session.expiresAt);
    publishRealtimeEvent({
      type: 'auth.user_registered',
      title: 'New user registered',
      description: `${user.name} joined as ${user.role}`,
      entityId: user.id,
      payload: { role: user.role },
    });
    res.status(201).json({ user: sanitizeAuthUser(login.session.user), expiresAt: login.session.expiresAt });
  });

  app.post('/api/auth/login', (req, res) => {
    if (isAuthRateLimited(req)) {
      res.status(429).json({ error: 'Too many authentication attempts. Please try again later.' });
      return;
    }

    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const login = store.authenticateUser(email, password, {
      ip: getClientIp(req),
      userAgent: req.headers['user-agent'],
    });

    if (!login.ok) {
      res.status(401).json({ error: login.reason });
      return;
    }

    setSessionCookie(res, login.session.token, login.session.expiresAt);
    res.json({ user: sanitizeAuthUser(login.session.user), expiresAt: login.session.expiresAt });
  });

  app.get('/api/auth/me', (req, res) => {
    const token = parseCookies(req.headers.cookie)[SESSION_COOKIE];
    const session = token ? store.getSession(token) : null;
    if (!session) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    res.json({ user: sanitizeAuthUser(session.user), expiresAt: session.expiresAt });
  });

  app.post('/api/auth/logout', (req, res) => {
    const token = parseCookies(req.headers.cookie)[SESSION_COOKIE];
    if (token) {
      store.deleteSession(token);
    }
    clearSessionCookie(res);
    res.status(204).send();
  });

  app.use('/api', (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/auth/') || req.path === '/health') {
      next();
      return;
    }

    const token = parseCookies(req.headers.cookie)[SESSION_COOKIE];
    const session = token ? store.getSession(token) : null;
    if (!session) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    res.locals.authUser = session.user;
    next();
  });

  app.get('/api/realtime', (req, res) => {
    const user = getAuthUser(res);
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();
    realtimeClients.add(res);
    res.write(
      `event: platform\ndata: ${JSON.stringify({
        id: `EVT-${Date.now()}`,
        type: 'connection.ready',
        title: 'Live stream connected',
        description: `Realtime updates enabled for ${user?.name || 'operator'}`,
        createdAt: new Date().toISOString(),
      })}\n\n`,
    );

    const heartbeat = setInterval(() => {
      res.write(`: heartbeat ${Date.now()}\n\n`);
    }, 25_000);

    req.on('close', () => {
      clearInterval(heartbeat);
      realtimeClients.delete(res);
      res.end();
    });
  });

  app.get('/api/audit-events', requireRoles(['Admin', 'Supervisor']), (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    res.json(store.listAuditEvents(limit));
  });

  app.get('/api/admin/users', requireRoles(['Admin', 'Supervisor']), (req, res) => {
    res.json(store.listAuthUsers());
  });

  app.patch('/api/admin/users/:id', requireRoles(['Admin']), (req, res) => {
    const user = getAuthUser(res);
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : undefined;
    const role = req.body?.role;
    const status = req.body?.status;

    if (role !== undefined && !isAuthRole(role)) {
      res.status(400).json({ error: 'Invalid role' });
      return;
    }

    if (status !== undefined && !isAuthStatus(status)) {
      res.status(400).json({ error: 'Invalid user status' });
      return;
    }

    if (req.params.id === user?.id && status === 'Suspended') {
      res.status(400).json({ error: 'You cannot suspend your own active session' });
      return;
    }

    const updatedUser = store.updateAuthUser(req.params.id, { name, role, status }, user?.name || 'System');
    if (!updatedUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    publishRealtimeEvent({
      type: 'auth.user_updated',
      title: 'User access updated',
      description: `${updatedUser.name} is now ${updatedUser.role} / ${updatedUser.status}`,
      entityId: updatedUser.id,
      payload: { role: updatedUser.role, status: updatedUser.status },
    });
    res.json(updatedUser);
  });

  app.get('/api/admin/registration-code', requireRoles(['Admin']), (req, res) => {
    res.json(getRegistrationInviteCodeStatus(store));
  });

  app.put('/api/admin/registration-code', requireRoles(['Admin']), (req, res) => {
    const user = getAuthUser(res);
    const code = typeof req.body?.code === 'string' ? req.body.code.trim() : '';
    if (code && code.length < 6) {
      res.status(400).json({ error: 'Invite code must be at least 6 characters' });
      return;
    }

    store.setRegistrationInviteCode(code, user?.name || 'System');
    const status = getRegistrationInviteCodeStatus(store);
    publishRealtimeEvent({
      type: 'auth.registration_code_updated',
      title: 'Registration invite code updated',
      description: status.isConfigured ? 'New operator registrations are invite-protected' : 'Registration invite code was cleared',
      entityId: 'registration_invite_code',
      payload: { configured: status.isConfigured },
    });
    res.json(status);
  });

  app.get('/api/incidents', (req, res) => {
    res.json(store.listIncidents());
  });

  app.get('/api/incidents/:id', (req, res) => {
    const incident = store.getIncident(req.params.id);
    if (incident) {
      res.json(incident);
    } else {
      res.status(404).json({ error: 'Incident not found' });
    }
  });

  app.post('/api/incidents', requireRoles(['Admin', 'Supervisor', 'Dispatcher', 'Call Taker']), (req, res) => {
    const user = getAuthUser(res);
    const newIncident = store.createIncident(req.body, user?.name || 'System');
    publishRealtimeEvent({
      type: 'incident.created',
      title: 'New incident created',
      description: `${newIncident.incidentId} opened for ${newIncident.plateNumber}`,
      entityId: newIncident.incidentId,
      payload: { status: newIncident.status, severity: newIncident.severity },
    });
    res.status(201).json(newIncident);
  });

  app.put('/api/incidents/:id/status', (req, res) => {
    const user = getAuthUser(res);
    const incidentBeforeUpdate = store.getIncident(req.params.id);
    const { status, note } = req.body;

    if (!user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!incidentBeforeUpdate) {
      res.status(404).json({ error: 'Incident not found' });
      return;
    }

    if (!isIncidentStatus(status)) {
      res.status(400).json({ error: 'Invalid incident status' });
      return;
    }

    if (
      incidentBeforeUpdate.status !== status &&
      ['Resolved', 'Closed'].includes(status) &&
      (typeof note !== 'string' || !note.trim())
    ) {
      res.status(400).json({ error: `A closure note is required before marking an incident as ${status}` });
      return;
    }

    if (!canUpdateIncidentStatus(user, incidentBeforeUpdate.status, status)) {
      res.status(403).json({
        error: `Role ${user.role} cannot move incident from ${incidentBeforeUpdate.status} to ${status}`,
        allowedStatuses: getAllowedIncidentStatuses(user, incidentBeforeUpdate.status),
      });
      return;
    }

    const incident = store.updateIncidentStatus(req.params.id, status, user.name, note);

    if (incident) {
      publishRealtimeEvent({
        type: incidentBeforeUpdate.status === status ? 'incident.note_added' : 'incident.status_updated',
        title: incidentBeforeUpdate.status === status ? 'Incident note added' : 'Incident status updated',
        description:
          incidentBeforeUpdate.status === status
            ? `${incident.incidentId}: note added by ${user.name}`
            : `${incident.incidentId}: ${incidentBeforeUpdate.status} -> ${incident.status}`,
        entityId: incident.incidentId,
        payload: { previousStatus: incidentBeforeUpdate.status, status: incident.status },
      });
      res.json(incident);
    } else {
      res.status(404).json({ error: 'Incident not found' });
    }
  });

  app.get('/api/vehicles', (req, res) => {
    res.json(store.listVehicles());
  });

  app.get('/api/hospitals', (req, res) => {
    res.json(store.listHospitals());
  });

  app.get('/api/weather', (req, res) => {
    const currentWeather = store.getWeather();
    if (currentWeather) {
      res.json(currentWeather);
    } else {
      res.status(404).json({ error: 'Weather not configured' });
    }
  });

  app.get('/api/operators', (req, res) => {
    res.json(store.listOperators());
  });

  app.post('/api/operators', requireRoles(['Admin']), (req, res) => {
    const user = getAuthUser(res);
    const newOperator = store.createOperator(req.body, user?.name || 'System');
    publishRealtimeEvent({
      type: 'operator.created',
      title: 'Operator created',
      description: `${newOperator.name} was added as ${newOperator.role}`,
      entityId: newOperator.id,
      payload: { role: newOperator.role, status: newOperator.status },
    });
    res.status(201).json(newOperator);
  });

  app.put('/api/operators/:id', requireRoles(['Admin', 'Supervisor']), (req, res) => {
    const user = getAuthUser(res);
    const operator = store.updateOperator(req.params.id, req.body, user?.name || 'System');
    if (operator) {
      publishRealtimeEvent({
        type: 'operator.updated',
        title: 'Operator updated',
        description: `${operator.name} profile was updated`,
        entityId: operator.id,
        payload: { role: operator.role, status: operator.status },
      });
      res.json(operator);
    } else {
      res.status(404).json({ error: 'Operator not found' });
    }
  });

  app.delete('/api/operators/:id', requireRoles(['Admin']), (req, res) => {
    const user = getAuthUser(res);
    const deleted = store.deleteOperator(req.params.id, user?.name || 'System');
    if (deleted) {
      publishRealtimeEvent({
        type: 'operator.deleted',
        title: 'Operator deactivated',
        description: `${req.params.id} was removed from the operator roster`,
        entityId: req.params.id,
      });
      res.status(204).send();
    } else {
      res.status(404).json({ error: 'Operator not found' });
    }
  });

  app.get('/api/analytics', (req, res) => {
    res.json(store.getAnalytics());
  });

  app.post('/api/assistant-chat', async (req, res) => {
    const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';

    if (!message) {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    const currentIncidents = store.listIncidents();
    const currentOperators = store.listOperators();
    const currentHospitals = store.listHospitals();
    const fallbackReply = await generateAssistantFallback(message, {
      incidents: currentIncidents,
      operators: currentOperators,
      hospitals: currentHospitals,
    });

    if (!process.env.GEMINI_API_KEY) {
      res.json({ reply: fallbackReply, source: 'mock' });
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const incidentSnapshot = currentIncidents
        .slice(0, 8)
        .map((incident) => ({
          incidentId: incident.incidentId,
          severity: incident.severity,
          status: incident.status,
          triggerType: incident.triggerType,
          plateNumber: incident.plateNumber,
          address: incident.address,
          timestamp: incident.timestamp,
          passengerCondition: incident.passengerCondition,
          notes: incident.notes,
          aiRecommendations: incident.aiRecommendations,
        }));
      const operatorSnapshot = currentOperators.map((operator) => ({
        id: operator.id,
        name: operator.name,
        role: operator.role,
        status: operator.status,
        activeIncidents: operator.activeIncidents,
        assignedRegion: operator.assignedRegion,
      }));
      const hospitalSnapshot = currentHospitals.slice(0, 8);

      const prompt = [
        'You are Aegis AI, an operational copilot for a Bosch eCall emergency response dashboard.',
        'Answer using only the provided operational context when possible.',
        'Be concise, practical, and safety-oriented.',
        'If the answer is uncertain, say so and avoid inventing facts.',
        '',
        `User question: ${message}`,
        '',
        `Incidents: ${JSON.stringify(incidentSnapshot)}`,
        `Operators: ${JSON.stringify(operatorSnapshot)}`,
        `Hospitals: ${JSON.stringify(hospitalSnapshot)}`,
        '',
        `Fallback guidance: ${fallbackReply}`,
      ].join('\n');

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      res.json({ reply: response.text || fallbackReply, source: 'gemini' });
    } catch (error) {
      console.error('Assistant AI request failed:', error);
      res.json({ reply: fallbackReply, source: 'mock' });
    }
  });

  // --- Vite Middleware ---

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr:
          process.env.DISABLE_HMR === 'true'
            ? false
            : {
                port: Number(process.env.VITE_HMR_PORT) || PORT + 20_000,
              },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    const configuredBasePath = (process.env.VITE_BASE_PATH || '/Bosch-eCall-Platform/').replace(/\/$/, '');
    if (configuredBasePath) {
      app.use(configuredBasePath, express.static(distPath));
    }
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
