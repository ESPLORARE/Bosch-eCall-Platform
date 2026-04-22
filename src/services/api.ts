import { Incident, Vehicle, AnalyticsData, Hospital, Weather, Operator, AuthResponse } from '../types';
import { mockPlatformApi } from '../data/mockPlatformData';
import { generateAssistantFallback } from './assistantMock';

const useMockApi =
  import.meta.env.VITE_USE_MOCK_API === 'true' ||
  (typeof window !== 'undefined' && window.location.hostname.endsWith('github.io'));

async function requestJson<T>(path: string, fallback: () => Promise<T>, init?: RequestInit): Promise<T> {
  if (useMockApi) {
    return fallback();
  }

  try {
    const res = await fetch(path, { credentials: 'same-origin', ...init });
    if (res.status === 401 || res.status === 403) {
      throw new Error(`Request failed: ${res.status}`);
    }
    if (!res.ok) {
      throw new Error(`Request failed: ${res.status}`);
    }
    return (await res.json()) as T;
  } catch (error) {
    if (error instanceof Error && (error.message.includes('401') || error.message.includes('403'))) {
      throw error;
    }
    console.warn(`Falling back to mock API for ${path}`, error);
    return fallback();
  }
}

export const api = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Login failed');
    }
    return data as AuthResponse;
  },
  register: async (data: {
    name: string;
    email: string;
    password: string;
    registrationCode?: string;
  }): Promise<AuthResponse> => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const responseData = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(responseData.error || 'Registration failed');
    }
    return responseData as AuthResponse;
  },
  getCurrentUser: async (): Promise<AuthResponse> => {
    const res = await fetch('/api/auth/me', { credentials: 'same-origin' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Not authenticated');
    }
    return data as AuthResponse;
  },
  logout: async (): Promise<void> => {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'same-origin',
    });
  },
  getIncidents: async (): Promise<Incident[]> => {
    return requestJson('/api/incidents', () => mockPlatformApi.getIncidents());
  },
  getIncident: async (id: string): Promise<Incident> => {
    return requestJson(`/api/incidents/${id}`, () => mockPlatformApi.getIncident(id));
  },
  createIncident: async (data: Partial<Incident>): Promise<Incident> => {
    return requestJson('/api/incidents', () => mockPlatformApi.createIncident(data), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },
  updateIncidentStatus: async (id: string, status: string, operator: string, note?: string): Promise<Incident> => {
    return requestJson(
      `/api/incidents/${id}/status`,
      () => mockPlatformApi.updateIncidentStatus(id, status, operator, note),
      {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, operator, note }),
      },
    );
  },
  getVehicles: async (): Promise<Vehicle[]> => {
    return requestJson('/api/vehicles', () => mockPlatformApi.getVehicles());
  },
  getHospitals: async (): Promise<Hospital[]> => {
    return requestJson('/api/hospitals', () => mockPlatformApi.getHospitals());
  },
  getWeather: async (): Promise<Weather> => {
    return requestJson('/api/weather', () => mockPlatformApi.getWeather());
  },
  getOperators: async (): Promise<Operator[]> => {
    return requestJson('/api/operators', () => mockPlatformApi.getOperators());
  },
  createOperator: async (data: Partial<Operator>): Promise<Operator> => {
    return requestJson('/api/operators', () => mockPlatformApi.createOperator(data), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },
  updateOperator: async (id: string, data: Partial<Operator>): Promise<Operator> => {
    return requestJson(`/api/operators/${id}`, () => mockPlatformApi.updateOperator(id, data), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },
  deleteOperator: async (id: string): Promise<void> => {
    if (useMockApi) {
      await mockPlatformApi.deleteOperator(id);
      return;
    }

    try {
      const res = await fetch(`/api/operators/${id}`, { method: 'DELETE', credentials: 'same-origin' });
      if (!res.ok) {
        throw new Error(`Request failed: ${res.status}`);
      }
    } catch (error) {
      console.warn(`Falling back to mock API for /api/operators/${id}`, error);
      await mockPlatformApi.deleteOperator(id);
    }
  },
  getAnalytics: async (): Promise<AnalyticsData> => {
    return requestJson('/api/analytics', () => mockPlatformApi.getAnalytics());
  },
  askAssistant: async (message: string): Promise<string> => {
    const fallback = async () =>
      generateAssistantFallback(message, {
        incidents: await mockPlatformApi.getIncidents(),
        operators: await mockPlatformApi.getOperators(),
        hospitals: await mockPlatformApi.getHospitals(),
      });

    if (useMockApi) {
      return fallback();
    }

    try {
      const res = await fetch('/api/assistant-chat', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });

      if (!res.ok) {
        throw new Error(`Request failed: ${res.status}`);
      }

      const data = (await res.json()) as { reply: string };
      return data.reply;
    } catch (error) {
      console.warn('Falling back to mock assistant response', error);
      return fallback();
    }
  }
};
