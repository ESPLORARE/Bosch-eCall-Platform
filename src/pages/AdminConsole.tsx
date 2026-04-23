import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Activity, Database, KeyRound, Save, ShieldCheck, UserCog, Users } from 'lucide-react';
import { api } from '../services/api';
import type { AppOutletContext, AuditEvent, AuthUser, RegistrationCodeStatus } from '../types';
import { canCreateOperators, canDeleteOperators, canManageOperators, canViewAuditEvents } from '../utils/permissions';

const AUTH_ROLES: AuthUser['role'][] = ['Admin', 'Supervisor', 'Dispatcher', 'Call Taker'];
const AUTH_STATUSES: AuthUser['status'][] = ['Active', 'Suspended'];

function formatAuditTime(timestamp: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(timestamp));
}

function formatLastLogin(timestamp: string | null) {
  if (!timestamp) return 'Never';
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(timestamp));
}

export default function AdminConsole() {
  const { user } = useOutletContext<AppOutletContext>();
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [registrationCode, setRegistrationCode] = useState<RegistrationCodeStatus | null>(null);
  const [registrationCodeDraft, setRegistrationCodeDraft] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [registrationCodeError, setRegistrationCodeError] = useState('');
  const [registrationCodeNotice, setRegistrationCodeNotice] = useState('');
  const [savingCode, setSavingCode] = useState(false);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);

  const loadAdminData = async () => {
    setError('');
    try {
      const [nextUsers, nextAuditEvents, nextRegistrationCode] = await Promise.all([
        api.getAdminUsers(),
        canViewAuditEvents(user) ? api.getAuditEvents(50) : Promise.resolve([]),
        user.role === 'Admin' ? api.getRegistrationCode() : Promise.resolve(null),
      ]);
      setUsers(nextUsers);
      setAuditEvents(nextAuditEvents);
      setRegistrationCode(nextRegistrationCode);
      setRegistrationCodeDraft(nextRegistrationCode?.code || '');
    } catch (adminError) {
      setError(adminError instanceof Error ? adminError.message : 'Failed to load admin console');
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [user]);

  const handleUserChange = async (
    targetUser: AuthUser,
    data: Partial<Pick<AuthUser, 'name' | 'role' | 'status'>>,
  ) => {
    setError('');
    setNotice('');
    setSavingUserId(targetUser.id);
    try {
      const updated = await api.updateAdminUser(targetUser.id, data);
      setUsers((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setNotice(`${updated.name} updated.`);
      const nextAuditEvents = await api.getAuditEvents(50);
      setAuditEvents(nextAuditEvents);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'User update failed');
    } finally {
      setSavingUserId(null);
    }
  };

  const handleSaveRegistrationCode = async () => {
    setError('');
    setNotice('');
    setRegistrationCodeError('');
    setRegistrationCodeNotice('');
    setSavingCode(true);
    try {
      const updated = await api.updateRegistrationCode(registrationCodeDraft.trim());
      setRegistrationCode(updated);
      setRegistrationCodeDraft(updated.code);
      const message = updated.isConfigured ? 'Registration invite code saved.' : 'Registration invite code cleared.';
      setNotice(message);
      setRegistrationCodeNotice(message);
      const nextAuditEvents = await api.getAuditEvents(50);
      setAuditEvents(nextAuditEvents);
    } catch (codeError) {
      const message = codeError instanceof Error ? codeError.message : 'Registration code update failed';
      setError(message);
      setRegistrationCodeError(message);
    } finally {
      setSavingCode(false);
    }
  };

  const permissions = [
    { label: 'View audit events', enabled: canViewAuditEvents(user) },
    { label: 'Edit operator profiles', enabled: canManageOperators(user) },
    { label: 'Create operators', enabled: canCreateOperators(user) },
    { label: 'Deactivate operators', enabled: canDeleteOperators(user) },
    { label: 'Manage platform users', enabled: user.role === 'Admin' },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Admin Console</h2>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          User access, invite controls, role capabilities, and audit trail for this eCall workspace.
        </p>
      </div>

      {(error || notice) && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm font-medium ${
            error
              ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300'
          }`}
        >
          {error || notice}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-[#005691] dark:bg-blue-900/20 dark:text-blue-300">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Current role</p>
          <p className="mt-1 text-2xl font-bold text-slate-950 dark:text-white">{user.role}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-[#00884A] dark:bg-emerald-900/20 dark:text-emerald-300">
            <Database className="h-5 w-5" />
          </div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Audit events</p>
          <p className="mt-1 text-2xl font-bold text-slate-950 dark:text-white">{auditEvents.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-50 text-[#00A8CB] dark:bg-cyan-900/20 dark:text-cyan-300">
            <Users className="h-5 w-5" />
          </div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Platform users</p>
          <p className="mt-1 text-2xl font-bold text-slate-950 dark:text-white">{users.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <UserCog className="h-5 w-5" />
          </div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Session user</p>
          <p className="mt-1 truncate text-lg font-bold text-slate-950 dark:text-white">{user.email}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">Role Capabilities</h3>
          <div className="space-y-3">
            {permissions.map((permission) => (
              <div key={permission.label} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5 dark:bg-slate-800/50">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{permission.label}</span>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                    permission.enabled
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                      : 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  {permission.enabled ? 'Allowed' : 'Blocked'}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
            <KeyRound className="h-5 w-5 text-[#005691] dark:text-blue-300" />
            Registration Invite Code
          </h3>
          {user.role === 'Admin' ? (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  value={registrationCodeDraft}
                  onChange={(event) => setRegistrationCodeDraft(event.target.value)}
                  placeholder="Set invite code for new users"
                  className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#005691] focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-blue-950"
                />
                <button
                  type="button"
                  onClick={handleSaveRegistrationCode}
                  disabled={savingCode}
                  className="inline-flex min-w-28 items-center justify-center gap-2 rounded-lg bg-[#005691] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#004878] disabled:cursor-wait disabled:opacity-60"
                >
                  <Save className="h-4 w-4" />
                  {savingCode ? 'Saving...' : 'Save'}
                </button>
              </div>
              {(registrationCodeError || registrationCodeNotice) && (
                <div
                  className={`rounded-lg border px-3 py-2 text-sm font-semibold ${
                    registrationCodeError
                      ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300'
                      : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300'
                  }`}
                  role="status"
                  aria-live="polite"
                >
                  {registrationCodeError || registrationCodeNotice}
                </div>
              )}
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Source: <span className="font-semibold">{registrationCode?.source || 'none'}</span>. Clear the field and save to close invite-based registration.
              </p>
            </div>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">Only Admin users can view or rotate the registration invite code.</p>
          )}
        </section>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Platform Users</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th className="px-5 py-3">User</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Last login</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {users.map((item) => {
                const isSelf = item.id === user.id;
                const isSaving = savingUserId === item.id;

                return (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-900 dark:text-white">{item.name}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{item.email}</div>
                    </td>
                    <td className="px-5 py-4">
                      {user.role === 'Admin' ? (
                        <select
                          value={item.role}
                          disabled={isSaving}
                          onChange={(event) => handleUserChange(item, { role: event.target.value as AuthUser['role'] })}
                          className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                        >
                          {AUTH_ROLES.map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="font-medium text-slate-700 dark:text-slate-300">{item.role}</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {user.role === 'Admin' ? (
                        <select
                          value={item.status}
                          disabled={isSaving || isSelf}
                          onChange={(event) => handleUserChange(item, { status: event.target.value as AuthUser['status'] })}
                          className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                        >
                          {AUTH_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="font-medium text-slate-700 dark:text-slate-300">{item.status}</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-slate-500 dark:text-slate-400">{formatLastLogin(item.lastLoginAt)}</td>
                  </tr>
                );
              })}
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-slate-500 dark:text-slate-400">
                    No platform users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
            <Activity className="h-5 w-5 text-[#005691] dark:text-blue-300" />
            Recent Audit Events
          </h3>
        </div>
        <div className="max-h-[34rem] divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800">
          {auditEvents.map((event) => (
            <div key={event.id} className="grid gap-3 px-5 py-4 sm:grid-cols-[10rem_1fr]">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{formatAuditTime(event.timestamp)}</div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {event.action} <span className="font-normal text-slate-500">by</span> {event.actor}
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {event.entityType}
                  {event.entityId ? ` / ${event.entityId}` : ''}
                </p>
              </div>
            </div>
          ))}
          {auditEvents.length === 0 && (
            <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">No audit events available.</div>
          )}
        </div>
      </section>
    </div>
  );
}
