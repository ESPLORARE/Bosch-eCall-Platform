import fs from 'fs';
import { createRequire } from 'module';
import path from 'path';
import { mockPlatformApi } from '../data/mockPlatformData';
import type { AnalyticsData, Hospital, Incident, Operator, Vehicle, Weather } from '../types';

type SqliteDatabase = import('better-sqlite3').Database;
type SqliteStatement = import('better-sqlite3').Statement;
type SqliteOptions = import('better-sqlite3').Options;

type DatabaseConstructor = new (filename: string, options?: SqliteOptions) => SqliteDatabase;

type JsonRow = {
  payload: string;
};

export interface AuditEvent {
  id: number;
  timestamp: string;
  actor: string;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown>;
}

const require = createRequire(path.join(process.cwd(), 'server.ts'));
const Database = require('better-sqlite3') as DatabaseConstructor;
const DEFAULT_DB_PATH = path.join(process.cwd(), 'data', 'bosch-ecall-platform.sqlite');

function parsePayload<T>(row: JsonRow | undefined): T | null {
  if (!row) return null;
  return JSON.parse(row.payload) as T;
}

function toPayload(value: unknown) {
  return JSON.stringify(value);
}

function nowIso() {
  return new Date().toISOString();
}

function auditFromRow(row: {
  id: number;
  timestamp: string;
  actor: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: string;
}): AuditEvent {
  return {
    id: row.id,
    timestamp: row.timestamp,
    actor: row.actor,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    metadata: JSON.parse(row.metadata || '{}') as Record<string, unknown>,
  };
}

export class PlatformStore {
  private db: SqliteDatabase;

  constructor(dbPath = process.env.DATABASE_PATH || DEFAULT_DB_PATH) {
    const resolvedPath = path.resolve(dbPath);
    fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
    this.db = new Database(resolvedPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.db.pragma('busy_timeout = 5000');
    this.migrate();
  }

  async seedIfEmpty() {
    const row = this.db.prepare('SELECT COUNT(*) AS count FROM vehicles').get() as { count: number };
    if (row.count > 0) return;

    const [incidents, vehicles, hospitals, weather, operators] = await Promise.all([
      mockPlatformApi.getIncidents(),
      mockPlatformApi.getVehicles(),
      mockPlatformApi.getHospitals(),
      mockPlatformApi.getWeather(),
      mockPlatformApi.getOperators(),
    ]);

    const seed = this.db.transaction(() => {
      vehicles.forEach((vehicle) => this.upsertVehicle(vehicle));
      incidents.forEach((incident) => this.upsertIncident(incident));
      hospitals.forEach((hospital) => this.upsertHospital(hospital));
      operators.forEach((operator) => this.upsertOperator(operator));
      this.setSetting('weather', weather);
      this.createAuditEvent('System', 'database.seeded', 'database', null, {
        incidents: incidents.length,
        vehicles: vehicles.length,
        hospitals: hospitals.length,
        operators: operators.length,
      });
    });

    seed();
  }

  listIncidents() {
    const rows = this.db.prepare('SELECT payload FROM incidents ORDER BY datetime(timestamp) DESC').all() as JsonRow[];
    return rows.map((row) => JSON.parse(row.payload) as Incident);
  }

  getIncident(incidentId: string) {
    return parsePayload<Incident>(
      this.db.prepare('SELECT payload FROM incidents WHERE incident_id = ?').get(incidentId) as JsonRow | undefined,
    );
  }

  createIncident(data: Partial<Incident>) {
    const timestamp = nowIso();
    const incidentId = data.incidentId || this.nextIncidentId();
    const incident: Incident = {
      incidentId,
      timestamp: data.timestamp || timestamp,
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
      ...data,
      actionLogs: data.actionLogs || [{ timestamp, action: 'System: SOS received from vehicle.' }],
    };

    this.upsertIncident(incident);
    this.createAuditEvent('System', 'incident.created', 'incident', incident.incidentId, {
      severity: incident.severity,
      triggerType: incident.triggerType,
      vehicleId: incident.vehicleId,
    });
    return incident;
  }

  updateIncidentStatus(incidentId: string, status: Incident['status'], operator?: string, note?: string) {
    const incident = this.getIncident(incidentId);
    if (!incident) return null;

    const actor = operator || 'System';
    const updated: Incident = {
      ...incident,
      status,
      assignedOperator: incident.assignedOperator || operator || null,
      responseTime:
        incident.responseTime ??
        (operator ? Math.floor((Date.now() - new Date(incident.timestamp).getTime()) / 1000) : null),
      actionLogs: [
        ...incident.actionLogs,
        {
          timestamp: nowIso(),
          action: `${actor}: Status updated to ${status}.${note ? ` Note: ${note}` : ''}`,
        },
      ],
    };

    this.upsertIncident(updated);
    this.createAuditEvent(actor, 'incident.status_updated', 'incident', incidentId, {
      previousStatus: incident.status,
      status,
      note: note || null,
    });
    return updated;
  }

  listVehicles() {
    const rows = this.db.prepare('SELECT payload FROM vehicles ORDER BY plate_number ASC').all() as JsonRow[];
    return rows.map((row) => JSON.parse(row.payload) as Vehicle);
  }

  listHospitals() {
    const rows = this.db.prepare('SELECT payload FROM hospitals ORDER BY name ASC').all() as JsonRow[];
    return rows.map((row) => JSON.parse(row.payload) as Hospital);
  }

  getWeather() {
    return this.getSetting<Weather>('weather');
  }

  listOperators() {
    const rows = this.db.prepare('SELECT payload FROM operators ORDER BY operator_id ASC').all() as JsonRow[];
    return rows.map((row) => JSON.parse(row.payload) as Operator);
  }

  createOperator(data: Partial<Operator>) {
    const operator: Operator = {
      id: data.id || this.nextOperatorId(),
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
      lastActiveTime: data.lastActiveTime || nowIso(),
      skills: data.skills || [],
      averageResponseTime: data.averageResponseTime || '0s',
      notes: data.notes || '',
    };

    this.upsertOperator(operator);
    this.createAuditEvent('System', 'operator.created', 'operator', operator.id, {
      role: operator.role,
      assignedRegion: operator.assignedRegion,
    });
    return operator;
  }

  updateOperator(operatorId: string, data: Partial<Operator>) {
    const operator = this.getOperator(operatorId);
    if (!operator) return null;

    const updated = { ...operator, ...data, id: operatorId };
    this.upsertOperator(updated);
    this.createAuditEvent('System', 'operator.updated', 'operator', operatorId, {
      fields: Object.keys(data),
    });
    return updated;
  }

  deleteOperator(operatorId: string) {
    const operator = this.getOperator(operatorId);
    if (!operator) return false;

    this.db.prepare('DELETE FROM operators WHERE operator_id = ?').run(operatorId);
    this.createAuditEvent('System', 'operator.deleted', 'operator', operatorId, {
      name: operator.name,
    });
    return true;
  }

  getAnalytics(): AnalyticsData {
    const incidents = this.listIncidents();
    const total = incidents.length;
    const active = incidents.filter((incident) => !['Resolved', 'Closed'].includes(incident.status)).length;
    const resolved = incidents.filter((incident) => ['Resolved', 'Closed'].includes(incident.status)).length;
    const responseTimes = incidents
      .filter((incident) => incident.responseTime !== null)
      .map((incident) => incident.responseTime as number);
    const avgResponseTime =
      responseTimes.length > 0 ? Math.round(responseTimes.reduce((sum, value) => sum + value, 0) / responseTimes.length) : 0;

    return {
      summary: { total, active, resolved, avgResponseTime },
      severityDistribution: {
        high: incidents.filter((incident) => incident.severity === 'high').length,
        medium: incidents.filter((incident) => incident.severity === 'medium').length,
        low: incidents.filter((incident) => incident.severity === 'low').length,
      },
      triggerDistribution: {
        automatic: incidents.filter((incident) => incident.triggerType === 'automatic').length,
        manual: incidents.filter((incident) => incident.triggerType === 'manual').length,
      },
    };
  }

  listAuditEvents(limit = 100) {
    const rows = this.db
      .prepare('SELECT * FROM audit_events ORDER BY datetime(timestamp) DESC, id DESC LIMIT ?')
      .all(limit) as ReturnType<typeof auditFromRow>[];
    return rows.map((row) =>
      auditFromRow(row as unknown as Parameters<typeof auditFromRow>[0]),
    );
  }

  health() {
    const incidentCount = (this.db.prepare('SELECT COUNT(*) AS count FROM incidents').get() as { count: number }).count;
    const vehicleCount = (this.db.prepare('SELECT COUNT(*) AS count FROM vehicles').get() as { count: number }).count;
    const operatorCount = (this.db.prepare('SELECT COUNT(*) AS count FROM operators').get() as { count: number }).count;
    return {
      status: 'ok',
      database: 'sqlite',
      incidentCount,
      vehicleCount,
      operatorCount,
      checkedAt: nowIso(),
    };
  }

  private migrate() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        applied_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS incidents (
        incident_id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL,
        status TEXT NOT NULL,
        severity TEXT NOT NULL,
        trigger_type TEXT NOT NULL,
        vehicle_id TEXT NOT NULL,
        assigned_operator TEXT,
        response_time INTEGER,
        payload TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS vehicles (
        vehicle_id TEXT PRIMARY KEY,
        plate_number TEXT NOT NULL,
        status TEXT NOT NULL,
        risk_level TEXT NOT NULL,
        ecall_mode TEXT NOT NULL,
        assigned_region TEXT NOT NULL,
        payload TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS hospitals (
        hospital_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        payload TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS operators (
        operator_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        status TEXT NOT NULL,
        assigned_region TEXT NOT NULL,
        payload TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        payload TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS audit_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        actor TEXT NOT NULL,
        action TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT,
        metadata TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
      CREATE INDEX IF NOT EXISTS idx_incidents_vehicle_id ON incidents(vehicle_id);
      CREATE INDEX IF NOT EXISTS idx_incidents_timestamp ON incidents(timestamp);
      CREATE INDEX IF NOT EXISTS idx_vehicles_plate_number ON vehicles(plate_number);
      CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_events(entity_type, entity_id);
    `);

    this.db
      .prepare('INSERT OR IGNORE INTO schema_migrations (version, applied_at) VALUES (?, ?)')
      .run(1, nowIso());
  }

  private upsertIncident(incident: Incident) {
    this.upsert(
      `INSERT INTO incidents (
        incident_id, timestamp, status, severity, trigger_type, vehicle_id,
        assigned_operator, response_time, payload, created_at, updated_at
      ) VALUES (
        @incidentId, @timestamp, @status, @severity, @triggerType, @vehicleId,
        @assignedOperator, @responseTime, @payload, @createdAt, @updatedAt
      )
      ON CONFLICT(incident_id) DO UPDATE SET
        timestamp = excluded.timestamp,
        status = excluded.status,
        severity = excluded.severity,
        trigger_type = excluded.trigger_type,
        vehicle_id = excluded.vehicle_id,
        assigned_operator = excluded.assigned_operator,
        response_time = excluded.response_time,
        payload = excluded.payload,
        updated_at = excluded.updated_at`,
      {
        ...incident,
        payload: toPayload(incident),
      },
    );
  }

  private upsertVehicle(vehicle: Vehicle) {
    this.upsert(
      `INSERT INTO vehicles (
        vehicle_id, plate_number, status, risk_level, ecall_mode, assigned_region,
        payload, created_at, updated_at
      ) VALUES (
        @vehicleId, @plateNumber, @status, @riskLevel, @eCallMode, @assignedRegion,
        @payload, @createdAt, @updatedAt
      )
      ON CONFLICT(vehicle_id) DO UPDATE SET
        plate_number = excluded.plate_number,
        status = excluded.status,
        risk_level = excluded.risk_level,
        ecall_mode = excluded.ecall_mode,
        assigned_region = excluded.assigned_region,
        payload = excluded.payload,
        updated_at = excluded.updated_at`,
      {
        ...vehicle,
        payload: toPayload(vehicle),
      },
    );
  }

  private upsertHospital(hospital: Hospital) {
    this.upsert(
      `INSERT INTO hospitals (
        hospital_id, name, latitude, longitude, payload, created_at, updated_at
      ) VALUES (
        @id, @name, @latitude, @longitude, @payload, @createdAt, @updatedAt
      )
      ON CONFLICT(hospital_id) DO UPDATE SET
        name = excluded.name,
        latitude = excluded.latitude,
        longitude = excluded.longitude,
        payload = excluded.payload,
        updated_at = excluded.updated_at`,
      {
        ...hospital,
        payload: toPayload(hospital),
      },
    );
  }

  private upsertOperator(operator: Operator) {
    this.upsert(
      `INSERT INTO operators (
        operator_id, name, role, status, assigned_region, payload, created_at, updated_at
      ) VALUES (
        @id, @name, @role, @status, @assignedRegion, @payload, @createdAt, @updatedAt
      )
      ON CONFLICT(operator_id) DO UPDATE SET
        name = excluded.name,
        role = excluded.role,
        status = excluded.status,
        assigned_region = excluded.assigned_region,
        payload = excluded.payload,
        updated_at = excluded.updated_at`,
      {
        ...operator,
        payload: toPayload(operator),
      },
    );
  }

  private upsert(sql: string, data: Record<string, unknown>) {
    const timestamp = nowIso();
    this.db.prepare(sql).run({
      createdAt: timestamp,
      updatedAt: timestamp,
      ...data,
    });
  }

  private getOperator(operatorId: string) {
    return parsePayload<Operator>(
      this.db.prepare('SELECT payload FROM operators WHERE operator_id = ?').get(operatorId) as JsonRow | undefined,
    );
  }

  private setSetting(key: string, value: unknown) {
    this.db
      .prepare(
        `INSERT INTO app_settings (key, payload, updated_at)
         VALUES (?, ?, ?)
         ON CONFLICT(key) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at`,
      )
      .run(key, toPayload(value), nowIso());
  }

  private getSetting<T>(key: string) {
    return parsePayload<T>(
      this.db.prepare('SELECT payload FROM app_settings WHERE key = ?').get(key) as JsonRow | undefined,
    );
  }

  private createAuditEvent(
    actor: string,
    action: string,
    entityType: string,
    entityId: string | null,
    metadata: Record<string, unknown>,
  ) {
    this.db
      .prepare(
        `INSERT INTO audit_events (timestamp, actor, action, entity_type, entity_id, metadata)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(nowIso(), actor, action, entityType, entityId, toPayload(metadata));
  }

  private nextIncidentId() {
    const rows = this.db.prepare('SELECT incident_id FROM incidents').all() as Array<{ incident_id: string }>;
    const currentYear = new Date().getFullYear();
    const maxNumber = rows.reduce((max, row) => {
      const match = row.incident_id.match(/^INC-\d{4}-(\d+)$/);
      return match ? Math.max(max, Number(match[1])) : max;
    }, 0);
    return `INC-${currentYear}-${String(maxNumber + 1).padStart(3, '0')}`;
  }

  private nextOperatorId() {
    const rows = this.db.prepare('SELECT operator_id FROM operators').all() as Array<{ operator_id: string }>;
    const maxNumber = rows.reduce((max, row) => {
      const match = row.operator_id.match(/^OP-(\d+)$/);
      return match ? Math.max(max, Number(match[1])) : max;
    }, 0);
    return `OP-${String(maxNumber + 1).padStart(3, '0')}`;
  }
}

export async function createPlatformStore() {
  const store = new PlatformStore();
  await store.seedIfEmpty();
  return store;
}
