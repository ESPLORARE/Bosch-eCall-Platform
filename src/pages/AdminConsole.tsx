import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Activity, Database, ShieldCheck, UserCog } from 'lucide-react';
import { api } from '../services/api';
import type { AppOutletContext, AuditEvent } from '../types';
import { canCreateOperators, canDeleteOperators, canManageOperators, canViewAuditEvents } from '../utils/permissions';

function formatAuditTime(timestamp: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(timestamp));
}

export default function AdminConsole() {
  const { user } = useOutletContext<AppOutletContext>();
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!canViewAuditEvents(user)) {
      return;
    }

    api
      .getAuditEvents(50)
      .then(setAuditEvents)
      .catch((auditError) => {
        setError(auditError instanceof Error ? auditError.message : 'Failed to load audit events');
      });
  }, [user]);

  const permissions = [
    { label: 'View audit events', enabled: canViewAuditEvents(user) },
    { label: 'Edit operator profiles', enabled: canManageOperators(user) },
    { label: 'Create operators', enabled: canCreateOperators(user) },
    { label: 'Deactivate operators', enabled: canDeleteOperators(user) },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Admin Console</h2>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          Operational controls, role capabilities, and audit trail for this eCall workspace.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
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
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Audit events loaded</p>
          <p className="mt-1 text-2xl font-bold text-slate-950 dark:text-white">{auditEvents.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-50 text-[#00A8CB] dark:bg-cyan-900/20 dark:text-cyan-300">
            <UserCog className="h-5 w-5" />
          </div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Session user</p>
          <p className="mt-1 truncate text-lg font-bold text-slate-950 dark:text-white">{user.email}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
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

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
              <Activity className="h-5 w-5 text-[#005691] dark:text-blue-300" />
              Recent Audit Events
            </h3>
          </div>
          {error ? (
            <div className="p-5 text-sm font-medium text-red-600 dark:text-red-300">{error}</div>
          ) : (
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
          )}
        </section>
      </div>
    </div>
  );
}
