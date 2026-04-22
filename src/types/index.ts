export interface ActionLog {
  timestamp: string;
  action: string;
}

export interface VehicleTelemetry {
  airbagDeployed: boolean;
  crashDetected: boolean;
  deltaV?: number;
  collisionType: 'front' | 'side' | 'rear' | 'rollover' | 'none';
  impactLevel: 'low' | 'medium' | 'high';
  possibleEntrapment: boolean;
  passengerCondition: 'normal' | 'unconscious' | 'trapped';
}

export interface Incident {
  incidentId: string;
  timestamp: string;
  triggerType: 'automatic' | 'manual';
  severity: 'high' | 'medium' | 'low';
  status: 'New Alert' | 'Acknowledged' | 'Verifying' | 'Dispatching' | 'Responders En Route' | 'Resolved' | 'Closed';
  latitude: number;
  longitude: number;
  address: string;
  vehicleId: string;
  plateNumber: string;
  vehicleBrand: string;
  vehicleModel: string;
  passengerCount: number;
  passengerCondition: string;
  notes: string;
  assignedOperator: string | null;
  responseTime: number | null;
  actionLogs: ActionLog[];
  mode: 'Classic' | 'NG eCall';
  msdReceived: boolean;
  aiSummary?: string;
  aiSeverity?: 'Low' | 'Medium' | 'High' | 'Critical';
  aiRecommendations?: string[];
  aiReport?: string;
  telemetry?: VehicleTelemetry;
}

export interface Vehicle {
  vehicleId: string;
  plateNumber: string;
  brand: string;
  model: string;
  color: string;
  ownerName: string;
  emergencyContact: string;
  fuelType: string;
  riskLevel: 'high' | 'medium' | 'low';
  status: 'Normal' | 'In Alert' | 'Resolved';
  lastSosTime: string | null;
  incidentCount: number;
  assignedRegion: string;
  eCallMode: 'Classic' | 'NG eCall';
  lastLocation?: string;
  notes?: string;
}

export interface Hospital {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  phone: string;
}

export interface Weather {
  location: string;
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  icon: string;
}

export interface Operator {
  id: string;
  name: string;
  role: 'Dispatcher' | 'Supervisor' | 'Call Taker';
  status: 'Available' | 'Handling Call' | 'Dispatching' | 'On Break' | 'Offline';
  activeIncidents: number;
  activeIncidentIds: string[];
  shift: 'Morning Shift' | 'Evening Shift' | 'Night Shift';
  shiftStart: string;
  shiftEnd: string;
  contact: string;
  assignedRegion: string;
  todayHandledCases: number;
  lastActiveTime: string;
  skills: string[];
  averageResponseTime: string;
  notes: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'Admin' | 'Supervisor' | 'Dispatcher' | 'Call Taker';
  status: 'Active' | 'Suspended';
  createdAt: string;
  lastLoginAt: string | null;
}

export interface AuthResponse {
  user: AuthUser;
  expiresAt?: string;
}

export interface AnalyticsSummary {
  total: number;
  active: number;
  resolved: number;
  avgResponseTime: number;
}

export interface AnalyticsData {
  summary: AnalyticsSummary;
  severityDistribution: { high: number; medium: number; low: number };
  triggerDistribution: { automatic: number; manual: number };
}

export interface SOP {
  id: string;
  title: string;
  scenarioType: string;
  triggerType: 'Automatic' | 'Manual' | 'Any';
  priorityLevel: 'Critical' | 'High' | 'Medium' | 'Low';
  description: string;
  lastUpdated: string;
  status: 'Active' | 'Draft' | 'Archived';
  version: string;
  updatedBy: string;
  applicableConditions: string[];
  triggerConditions: string[];
  procedureSteps: string[];
  keyQuestions: string[];
  dispatchRecommendations: string[];
  escalationRules: string[];
  notesWarnings: string[];
  checklist: string[];
}
