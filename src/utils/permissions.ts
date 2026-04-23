import type { AuthUser, Incident } from '../types';

export const INCIDENT_STATUSES: Incident['status'][] = [
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

export function canManageOperators(user: AuthUser) {
  return user.role === 'Admin' || user.role === 'Supervisor';
}

export function canCreateOperators(user: AuthUser) {
  return user.role === 'Admin';
}

export function canDeleteOperators(user: AuthUser) {
  return user.role === 'Admin';
}

export function canViewAuditEvents(user: AuthUser) {
  return user.role === 'Admin' || user.role === 'Supervisor';
}

export function getAllowedIncidentStatuses(user: AuthUser, currentStatus: Incident['status']) {
  const transitionTargets = INCIDENT_TRANSITIONS[currentStatus] || [];
  const roleTargets = INCIDENT_ROLE_TRANSITIONS[user.role] || [];
  return transitionTargets.filter((status) => roleTargets.includes(status));
}

export function canUpdateIncidentStatus(user: AuthUser, incident: Incident, nextStatus: Incident['status']) {
  return incident.status === nextStatus || getAllowedIncidentStatuses(user, incident.status).includes(nextStatus);
}
