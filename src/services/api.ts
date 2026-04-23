import {
  Incident,
  Vehicle,
  AnalyticsData,
  Hospital,
  Weather,
  Operator,
  AuthBootstrap,
  AuthResponse,
  AuditEvent,
  AuthUser,
  RegistrationCodeStatus,
} from '../types';
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
    if (!res.ok) {
      const contentType = res.headers.get('content-type') || '';
      const errorData = contentType.includes('application/json') ? await res.json().catch(() => ({})) : {};
      const message =
        typeof errorData === 'object' && errorData && 'error' in errorData
          ? String(errorData.error)
          : `Request failed: ${res.status}`;
      const error = new Error(message) as Error & { status?: number };
      error.status = res.status;
      throw error;
    }
    return (await res.json()) as T;
  } catch (error) {
    const status = error instanceof Error ? (error as Error & { status?: number }).status : undefined;
    const method = init?.method?.toUpperCase() || 'GET';
    if (
      method !== 'GET' ||
      status === 401 ||
      status === 403 ||
      (error instanceof Error && (error.message.includes('401') || error.message.includes('403')))
    ) {
      throw error;
    }
    console.warn(`Falling back to mock API for ${path}`, error);
    return fallback();
  }
}

async function readApiJson<T>(res: Response, fallbackMessage: string): Promise<T> {
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    await res.text().catch(() => '');
    throw new Error('Backend API is not responding. Please restart with npm run dev instead of a static preview server.');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = typeof data === 'object' && data && 'error' in data ? String(data.error) : fallbackMessage;
    throw new Error(message);
  }
  return data as T;
}

export const api = {
  getAuthBootstrap: async (): Promise<AuthBootstrap> => {
    const res = await fetch('/api/auth/bootstrap', { credentials: 'same-origin' });
    return readApiJson<AuthBootstrap>(res, 'Could not load authentication setup');
  },
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    return readApiJson<AuthResponse>(res, 'Login failed');
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

    return readApiJson<AuthResponse>(res, 'Registration failed');
  },
  getCurrentUser: async (): Promise<AuthResponse> => {
    const res = await fetch('/api/auth/me', { credentials: 'same-origin' });
    return readApiJson<AuthResponse>(res, 'Not authenticated');
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
  getAuditEvents: async (limit = 100): Promise<AuditEvent[]> => {
    return requestJson(`/api/audit-events?limit=${limit}`, async () => []);
  },
  getAdminUsers: async (): Promise<AuthUser[]> => {
    return requestJson('/api/admin/users', async () => []);
  },
  updateAdminUser: async (
    id: string,
    data: Partial<Pick<AuthUser, 'name' | 'role' | 'status'>>,
  ): Promise<AuthUser> => {
    return requestJson(`/api/admin/users/${id}`, async () => {
      throw new Error('User management is unavailable in mock mode');
    }, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },
  getRegistrationCode: async (): Promise<RegistrationCodeStatus> => {
    return requestJson('/api/admin/registration-code', async () => ({ code: '', isConfigured: false, source: 'none' }));
  },
  updateRegistrationCode: async (code: string): Promise<RegistrationCodeStatus> => {
    return requestJson('/api/admin/registration-code', async () => {
      throw new Error('Registration code management is unavailable in mock mode');
    }, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
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
        const contentType = res.headers.get('content-type') || '';
        const errorData = contentType.includes('application/json') ? await res.json().catch(() => ({})) : {};
        const message =
          typeof errorData === 'object' && errorData && 'error' in errorData
            ? String(errorData.error)
            : `Request failed: ${res.status}`;
        const error = new Error(message) as Error & { status?: number };
        error.status = res.status;
        throw error;
      }
    } catch (error) {
      const status = error instanceof Error ? (error as Error & { status?: number }).status : undefined;
      if (status === 401 || status === 403) {
        throw error;
      }
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
