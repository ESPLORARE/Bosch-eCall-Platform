import { Incident, Vehicle, AnalyticsData, Hospital, Weather, Operator } from '../types';

export const api = {
  getIncidents: async (): Promise<Incident[]> => {
    const res = await fetch('/api/incidents');
    return res.json();
  },
  getIncident: async (id: string): Promise<Incident> => {
    const res = await fetch(`/api/incidents/${id}`);
    if (!res.ok) throw new Error('Incident not found');
    return res.json();
  },
  createIncident: async (data: Partial<Incident>): Promise<Incident> => {
    const res = await fetch('/api/incidents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  updateIncidentStatus: async (id: string, status: string, operator: string, note?: string): Promise<Incident> => {
    const res = await fetch(`/api/incidents/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, operator, note }),
    });
    return res.json();
  },
  getVehicles: async (): Promise<Vehicle[]> => {
    const res = await fetch('/api/vehicles');
    return res.json();
  },
  getHospitals: async (): Promise<Hospital[]> => {
    const res = await fetch('/api/hospitals');
    return res.json();
  },
  getWeather: async (): Promise<Weather> => {
    const res = await fetch('/api/weather');
    return res.json();
  },
  getOperators: async (): Promise<Operator[]> => {
    const res = await fetch('/api/operators');
    return res.json();
  },
  createOperator: async (data: Partial<Operator>): Promise<Operator> => {
    const res = await fetch('/api/operators', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  updateOperator: async (id: string, data: Partial<Operator>): Promise<Operator> => {
    const res = await fetch(`/api/operators/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  deleteOperator: async (id: string): Promise<void> => {
    await fetch(`/api/operators/${id}`, { method: 'DELETE' });
  },
  getAnalytics: async (): Promise<AnalyticsData> => {
    const res = await fetch('/api/analytics');
    return res.json();
  }
};
