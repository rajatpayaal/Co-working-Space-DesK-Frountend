import React, { useCallback, useEffect, useState } from 'react';
import adminApi from '../../api/adminApi';
import spacesApi from '../../api/spacesApi';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import EmptyState from '../../components/common/EmptyState';
import { SkeletonRow } from '../../components/common/LoadingSpinner';
import { collectionFrom } from '../../api/responseHelpers';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Format an ISO string as "22 Sep 2026, 14:30" */
const formatDateTime = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

/** Compute duration in whole hours between two ISO strings */
const durationHours = (start, end) => {
  if (!start || !end) return '—';
  const diff = (new Date(end) - new Date(start)) / 1000 / 60 / 60;
  if (diff <= 0) return '—';
  if (diff < 1) return `${Math.round(diff * 60)} min`;
  const h = Math.floor(diff);
  const m = Math.round((diff - h) * 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

/** Convert a datetime-local input value to a full ISO string */
const toISO = (localValue) => {
  if (!localValue) return '';
  return new Date(localValue).toISOString();
};

/** Convert an ISO string to a datetime-local input value (YYYY-MM-DDTHH:MM) */
const toLocalInput = (iso) => {
  if (!iso) return '';
  return iso.slice(0, 16);
};

// ─── Summary Card ─────────────────────────────────────────────────────────────

const SummaryCard = ({ icon, label, value, accent = false }) => (
  <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 flex items-center gap-4 shadow-sm">
    <div
      className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
        accent ? 'bg-primary/10 text-primary' : 'bg-surface-container text-on-surface-variant'
      }`}
    >
      <span className="material-symbols-outlined text-xl">{icon}</span>
    </div>
    <div>
      <p className="text-xs text-on-surface-variant font-medium uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-on-surface leading-tight mt-0.5">{value}</p>
    </div>
  </div>
);

// ─── Create Maintenance Form ──────────────────────────────────────────────────

const EMPTY_FORM = { spaceId: '', reason: '', startTime: '', endTime: '' };

const CreateMaintenanceModal = ({ isOpen, onClose, spaces, onCreated }) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setForm(EMPTY_FORM);
      setErrors({});
      setServerError('');
    }
  }, [isOpen]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const next = {};
    if (!form.spaceId) next.spaceId = 'Please select a space.';
    if (!form.reason?.trim()) next.reason = 'Reason is required.';
    if (!form.startTime) next.startTime = 'Start date & time is required.';
    if (!form.endTime) next.endTime = 'End date & time is required.';
    if (form.startTime && form.endTime && new Date(form.endTime) <= new Date(form.startTime)) {
      next.endTime = 'End time must be after start time.';
    }
    return next;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    setServerError('');
    try {
      await adminApi.createMaintenance({
        spaceId: form.spaceId,
        reason: form.reason.trim(),
        startTime: toISO(form.startTime),
        endTime: toISO(form.endTime),
      });
      onCreated();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Failed to create maintenance window. Please try again.';
      setServerError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const fieldCls = (hasErr) =>
    `w-full bg-surface-container-low border rounded-xl px-3.5 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none transition-all focus:ring-2 focus:ring-primary/30 focus:border-primary ${
      hasErr ? 'border-error' : 'border-outline-variant hover:border-outline'
    }`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Schedule Maintenance Window" size="lg">
      <form onSubmit={handleSubmit} noValidate>
        {/* Server error banner */}
        {serverError && (
          <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-error/10 border border-error/30 px-4 py-3">
            <span className="material-symbols-outlined text-xl text-error flex-shrink-0 mt-0.5">error</span>
            <p className="text-sm text-error leading-snug">{serverError}</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          {/* Space selector */}
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wide">
              Space <span className="text-error">*</span>
            </label>
            <select
              value={form.spaceId}
              onChange={(e) => handleChange('spaceId', e.target.value)}
              className={fieldCls(!!errors.spaceId)}
            >
              <option value="">— Select a space —</option>
              {spaces.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            {errors.spaceId && (
              <p className="mt-1 text-xs text-error">{errors.spaceId}</p>
            )}
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wide">
              Reason / Purpose <span className="text-error">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Deep cleaning, HVAC maintenance"
              value={form.reason}
              onChange={(e) => handleChange('reason', e.target.value)}
              className={fieldCls(!!errors.reason)}
            />
            {errors.reason && (
              <p className="mt-1 text-xs text-error">{errors.reason}</p>
            )}
          </div>

          {/* Start / End in a 2-col grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Start */}
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wide">
                Start Date & Time <span className="text-error">*</span>
              </label>
              <input
                type="datetime-local"
                value={form.startTime}
                onChange={(e) => handleChange('startTime', e.target.value)}
                className={fieldCls(!!errors.startTime)}
              />
              {errors.startTime && (
                <p className="mt-1 text-xs text-error">{errors.startTime}</p>
              )}
            </div>

            {/* End */}
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wide">
                End Date & Time <span className="text-error">*</span>
              </label>
              <input
                type="datetime-local"
                value={form.endTime}
                min={form.startTime || undefined}
                onChange={(e) => handleChange('endTime', e.target.value)}
                className={fieldCls(!!errors.endTime)}
              />
              {errors.endTime && (
                <p className="mt-1 text-xs text-error">{errors.endTime}</p>
              )}
            </div>
          </div>

          {/* Duration preview */}
          {form.startTime && form.endTime && new Date(form.endTime) > new Date(form.startTime) && (
            <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-xl px-4 py-2.5">
              <span className="material-symbols-outlined text-base text-primary">schedule</span>
              <p className="text-sm text-primary font-medium">
                Duration: {durationHours(toISO(form.startTime), toISO(form.endTime))}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-outline-variant">
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={submitting}>
            <span className="material-symbols-outlined text-base">build</span>
            Schedule
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export const MaintenanceManagement = () => {
  // Maintenance list state
  const [maintenance, setMaintenance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Spaces state (for the create modal dropdown)
  const [spaces, setSpaces] = useState([]);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);

  // Per-row delete loading state  { [id]: true }
  const [deletingIds, setDeletingIds] = useState({});

  // ── Fetch maintenance list ──────────────────────────────────────────────────
  const fetchMaintenance = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminApi.getMaintenance();
      const items = collectionFrom(res, ['maintenance', 'items', 'data']);
      setMaintenance(items);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Failed to load maintenance windows.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Fetch spaces (for the select dropdown) ──────────────────────────────────
  const fetchSpaces = useCallback(async () => {
    try {
      const res = await spacesApi.getAdminAll({ limit: 100 });
      setSpaces(collectionFrom(res, ['spaces']));
    } catch {
      // Non-critical; create form will show an empty list
      setSpaces([]);
    }
  }, []);

  useEffect(() => {
    fetchMaintenance();
    fetchSpaces();
  }, [fetchMaintenance, fetchSpaces]);

  // ── Delete handler ──────────────────────────────────────────────────────────
  const handleDelete = async (item) => {
    const label = item.title || `Maintenance #${item.id}`;
    const confirmed = window.confirm(
      `Delete "${label}" for ${item.space?.name ?? 'this space'}?\n\nThis action cannot be undone.`
    );
    if (!confirmed) return;

    setDeletingIds((prev) => ({ ...prev, [item.id]: true }));
    try {
      await adminApi.deleteMaintenance(item.id);
      setMaintenance((prev) => prev.filter((m) => m.id !== item.id));
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Failed to delete. Please try again.';
      alert(msg);
    } finally {
      setDeletingIds((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
    }
  };

  // ── After successful creation ───────────────────────────────────────────────
  const handleCreated = () => {
    setModalOpen(false);
    fetchMaintenance();
  };

  // ── Derived stats ───────────────────────────────────────────────────────────
  const now = Date.now();
  const upcomingCount = maintenance.filter(
    (m) => m.startTime && new Date(m.startTime).getTime() > now
  ).length;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div>
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-on-surface-variant mb-2">
          <span>Operations</span>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <span className="text-on-surface font-medium">Maintenance</span>
        </nav>

        {/* Title row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-headline text-3xl text-on-surface font-normal">
              Maintenance Management
            </h1>
            <p className="text-sm text-on-surface-variant mt-1">
              Schedule and manage maintenance windows across all spaces.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <Button
              variant="secondary"
              size="md"
              onClick={fetchMaintenance}
              disabled={loading}
            >
              <span className="material-symbols-outlined text-base">refresh</span>
              Refresh
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => setModalOpen(true)}
            >
              <span className="material-symbols-outlined text-base">add</span>
              Schedule Maintenance
            </Button>
          </div>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SummaryCard
          icon="build"
          label="Total Windows"
          value={loading ? '—' : maintenance.length}
        />
        <SummaryCard
          icon="upcoming"
          label="Upcoming"
          value={loading ? '—' : upcomingCount}
          accent
        />
      </div>

      {/* ── Error banner ── */}
      {error && !loading && (
        <div className="flex items-start gap-3 bg-error/10 border border-error/30 rounded-2xl px-5 py-4">
          <span className="material-symbols-outlined text-xl text-error flex-shrink-0 mt-0.5">
            error
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-error">Failed to load maintenance windows</p>
            <p className="text-xs text-error/80 mt-0.5">{error}</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchMaintenance}>
            Retry
          </Button>
        </div>
      )}

      {/* ── Table Card ── */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-outline-variant bg-surface-container-low">
                <th className="text-left py-3.5 px-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wide whitespace-nowrap">
                  Space
                </th>
                <th className="text-left py-3.5 px-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wide whitespace-nowrap">
                  Reason
                </th>
                <th className="text-left py-3.5 px-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wide whitespace-nowrap">
                  Start
                </th>
                <th className="text-left py-3.5 px-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wide whitespace-nowrap">
                  End
                </th>
                <th className="text-left py-3.5 px-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wide whitespace-nowrap">
                  Duration
                </th>
                <th className="text-right py-3.5 px-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wide whitespace-nowrap">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {/* Loading skeleton */}
              {loading && (
                <>
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                </>
              )}

              {/* Data rows */}
              {!loading && !error && maintenance.length > 0 &&
                maintenance.map((item) => {
                  const isUpcoming = item.startTime && new Date(item.startTime).getTime() > now;
                  const isActive =
                    item.startTime &&
                    item.endTime &&
                    new Date(item.startTime).getTime() <= now &&
                    new Date(item.endTime).getTime() >= now;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-surface-container-low/60 transition-colors"
                    >
                      {/* Space */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="material-symbols-outlined text-sm text-primary">
                              meeting_room
                            </span>
                          </div>
                          <span className="text-on-surface font-medium whitespace-nowrap">
                            {item.space?.name ?? `Space #${item.space?.id ?? '—'}`}
                          </span>
                        </div>
                      </td>

                      {/* Reason */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-on-surface">{item.reason || item.title || 'Routine Maintenance'}</span>
                          {isActive && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700 border border-amber-200 whitespace-nowrap">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              Active
                            </span>
                          )}
                          {isUpcoming && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-600 border border-blue-200 whitespace-nowrap">
                              Upcoming
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Start */}
                      <td className="py-3.5 px-4 text-on-surface-variant whitespace-nowrap">
                        {formatDateTime(item.startTime)}
                      </td>

                      {/* End */}
                      <td className="py-3.5 px-4 text-on-surface-variant whitespace-nowrap">
                        {formatDateTime(item.endTime)}
                      </td>

                      {/* Duration */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-on-surface-variant">
                          <span className="material-symbols-outlined text-sm">schedule</span>
                          {durationHours(item.startTime, item.endTime)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          variant="danger"
                          size="sm"
                          isLoading={!!deletingIds[item.id]}
                          onClick={() => handleDelete(item)}
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                          Delete
                        </Button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>

          {/* Empty state (rendered inside the scroll container for layout consistency) */}
          {!loading && !error && maintenance.length === 0 && (
            <EmptyState
              icon="build"
              title="No maintenance windows scheduled"
              description="Schedule a maintenance window to block a space from being booked during that period."
              action={
                <Button variant="primary" size="sm" onClick={() => setModalOpen(true)}>
                  <span className="material-symbols-outlined text-base">add</span>
                  Schedule Maintenance
                </Button>
              }
            />
          )}
        </div>

        {/* Table footer with record count */}
        {!loading && !error && maintenance.length > 0 && (
          <div className="px-4 py-3 border-t border-outline-variant flex items-center justify-between">
            <p className="text-xs text-on-surface-variant">
              {maintenance.length} window{maintenance.length !== 1 ? 's' : ''} total
              {upcomingCount > 0 && (
                <span className="ml-2 text-primary font-medium">
                  · {upcomingCount} upcoming
                </span>
              )}
            </p>
          </div>
        )}
      </div>

      {/* ── Create Maintenance Modal ── */}
      <CreateMaintenanceModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        spaces={spaces}
        onCreated={handleCreated}
      />
    </div>
  );
};

export default MaintenanceManagement;
