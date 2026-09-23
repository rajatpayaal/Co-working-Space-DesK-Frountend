import React, { useCallback, useEffect, useState } from 'react';
import bookingsApi from '../../api/bookingsApi';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import { SkeletonRow } from '../../components/common/LoadingSpinner';
import { collectionFrom, unwrapResponse } from '../../api/responseHelpers';

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_LIMIT = 15;

const STATUS_FILTERS = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Rejected', value: 'REJECTED' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

const STAT_CARDS = [
  { key: 'total',     icon: 'calendar_month',   label: 'Total Bookings',   note: 'All time records',            accent: false },
  { key: 'pending',   icon: 'schedule',          label: 'Pending Review',   note: 'Awaiting admin action',       accent: false },
  { key: 'approved',  icon: 'check_circle',      label: 'Approved',         note: 'Confirmed reservations',      accent: false },
  { key: 'cancelled', icon: 'do_not_disturb_on', label: 'Cancelled',        note: 'Member or admin cancellations', accent: true },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Format an ISO date string as "DD MMM YYYY".
 */
const fmtDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

/**
 * Format an ISO date string as "HH:MM".
 */
const fmtTime = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
};

/**
 * Format a booking schedule: "DD MMM YYYY, HH:MM – HH:MM"
 */
const fmtSchedule = (startIso, endIso) => {
  if (!startIso) return '—';
  const datePart = fmtDate(startIso);
  const startTime = fmtTime(startIso);
  const endTime = fmtTime(endIso);
  return `${datePart}, ${startTime} – ${endTime}`;
};

/**
 * Format a currency amount as ₹X,XXX.XX
 */
const fmtAmount = (amount) => {
  if (amount == null) return '—';
  return `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// ─── Reject Reason Modal ──────────────────────────────────────────────────────

const RejectModal = ({ bookingId, onConfirm, onCancel, isLoading }) => {
  const [reason, setReason] = useState('');
  const trimmed = reason.trim();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!trimmed) return;
    onConfirm(bookingId, trimmed);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div
        className="w-full max-w-md rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reject-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-outline-variant px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-error-container">
              <span className="material-symbols-outlined text-error text-lg">cancel</span>
            </span>
            <h3 id="reject-modal-title" className="font-headline text-xl text-on-surface">
              Reject Booking
            </h3>
          </div>
          <button
            onClick={onCancel}
            disabled={isLoading}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant transition hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
          <p className="text-sm text-on-surface-variant">
            Please provide a reason for rejecting this booking. The member will be notified.
          </p>
          <div>
            <label htmlFor="reject-reason" className="mb-1.5 block text-xs font-semibold text-on-surface">
              Rejection Reason <span className="text-error">*</span>
            </label>
            <textarea
              id="reject-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              placeholder="e.g. Space is under emergency maintenance during this period."
              className="w-full resize-none rounded-lg border border-outline-variant bg-background px-3 py-2.5 text-sm text-on-surface outline-none transition placeholder:text-on-surface-variant/50 focus:border-primary"
              disabled={isLoading}
              required
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={onCancel} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              disabled={!trimmed}
              isLoading={isLoading}
            >
              <span className="material-symbols-outlined text-base">cancel</span>
              Reject Booking
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const BookingManagement = () => {
  // Data
  const [bookings, setBookings] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: PAGE_LIMIT, totalPages: 1 });
  const [statusCounts, setStatusCounts] = useState({ total: 0, pending: 0, approved: 0, cancelled: 0 });

  // Filters & page
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  // Loading / error
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Per-row action loading: { [bookingId]: 'approve' | 'reject' | null }
  const [actionLoading, setActionLoading] = useState({});

  // Reject modal state
  const [rejectTarget, setRejectTarget] = useState(null); // booking id
  const [rejectLoading, setRejectLoading] = useState(false);

  // ── Fetch counts (no filter, large limit for aggregate) ──────────────────
  const loadCounts = useCallback(async () => {
    try {
      const res = await bookingsApi.getAdminAll({ limit: 1 });
      const pag = unwrapResponse(res)?.pagination;
      const total = pag?.total ?? 0;

      const [pendingRes, approvedRes, cancelledRes] = await Promise.all([
        bookingsApi.getAdminAll({ status: 'PENDING',   limit: 1 }),
        bookingsApi.getAdminAll({ status: 'APPROVED',  limit: 1 }),
        bookingsApi.getAdminAll({ status: 'CANCELLED', limit: 1 }),
      ]);

      setStatusCounts({
        total,
        pending:   unwrapResponse(pendingRes)?.pagination?.total   ?? 0,
        approved:  unwrapResponse(approvedRes)?.pagination?.total  ?? 0,
        cancelled: unwrapResponse(cancelledRes)?.pagination?.total ?? 0,
      });
    } catch {
      // Counts are non-critical; silently ignore errors here.
    }
  }, []);

  // ── Fetch paginated bookings list ────────────────────────────────────────
  const loadBookings = useCallback(async (currentPage, currentStatus) => {
    setLoading(true);
    setError('');
    try {
      const params = { page: currentPage, limit: PAGE_LIMIT };
      if (currentStatus) params.status = currentStatus;

      const res = await bookingsApi.getAdminAll(params);
      setBookings(collectionFrom(res, ['bookings', 'items']));

      const pag = unwrapResponse(res)?.pagination;
      if (pag) {
        setPagination({
          total:      pag.total      ?? 0,
          page:       pag.page       ?? currentPage,
          limit:      pag.limit      ?? PAGE_LIMIT,
          totalPages: pag.totalPages ?? 1,
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load bookings. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Effects ──────────────────────────────────────────────────────────────
  useEffect(() => {
    loadCounts();
  }, [loadCounts]);

  useEffect(() => {
    loadBookings(page, statusFilter);
  }, [loadBookings, page, statusFilter]);

  // ── Filter change resets to page 1 ───────────────────────────────────────
  const handleFilterChange = (value) => {
    setStatusFilter(value);
    setPage(1);
  };

  // ── Refresh (re-fetches both counts + list) ───────────────────────────────
  const handleRefresh = () => {
    loadCounts();
    loadBookings(page, statusFilter);
  };

  // ── Approve ───────────────────────────────────────────────────────────────
  const handleApprove = async (id) => {
    setActionLoading((prev) => ({ ...prev, [id]: 'approve' }));
    try {
      await bookingsApi.approve(id);
      loadCounts();
      await loadBookings(page, statusFilter);
    } catch (err) {
      setError(err.response?.data?.message || `Failed to approve booking #${id}.`);
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: null }));
    }
  };

  // ── Reject flow ───────────────────────────────────────────────────────────
  const openRejectModal = (id) => setRejectTarget(id);
  const closeRejectModal = () => { if (!rejectLoading) setRejectTarget(null); };

  const handleRejectConfirm = async (id, reason) => {
    setRejectLoading(true);
    setActionLoading((prev) => ({ ...prev, [id]: 'reject' }));
    try {
      await bookingsApi.reject(id, reason);
      setRejectTarget(null);
      loadCounts();
      await loadBookings(page, statusFilter);
    } catch (err) {
      setError(err.response?.data?.message || `Failed to reject booking #${id}.`);
    } finally {
      setRejectLoading(false);
      setActionLoading((prev) => ({ ...prev, [id]: null }));
    }
  };

  // ── Derived counts for stat cards ─────────────────────────────────────────
  const statValues = {
    total:     statusCounts.total,
    pending:   statusCounts.pending,
    approved:  statusCounts.approved,
    cancelled: statusCounts.cancelled,
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">

      {/* ── Reject Modal ──────────────────────────────────────────────────── */}
      {rejectTarget && (
        <RejectModal
          bookingId={rejectTarget}
          onConfirm={handleRejectConfirm}
          onCancel={closeRejectModal}
          isLoading={rejectLoading}
        />
      )}

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs text-on-surface-variant">
            Operations <span className="mx-2">›</span> Bookings
          </p>
          <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className="font-headline text-4xl text-on-surface">Booking Management</h2>
          </div>
          <p className="mt-2 max-w-3xl text-sm text-on-surface-variant">
            Review, approve, and reject member reservations across all co-working spaces. Pending
            bookings require your action before they are confirmed.
          </p>
        </div>
        <div>
          <Button variant="secondary" onClick={handleRefresh} isLoading={loading}>
            <span className="material-symbols-outlined text-base">refresh</span>
            Refresh
          </Button>
        </div>
      </section>

      {/* ── Error Banner ──────────────────────────────────────────────────── */}
      {error && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-error/20 bg-error-container px-4 py-3 text-sm text-error">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-base">error</span>
            <span>{error}</span>
          </div>
          <button onClick={handleRefresh} className="font-semibold underline">
            Try again
          </button>
        </div>
      )}

      {/* ── Stat Cards ────────────────────────────────────────────────────── */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STAT_CARDS.map(({ key, icon, label, note, accent }, index) => (
          <article
            key={key}
            className={`relative overflow-hidden rounded-xl border bg-surface-container-lowest p-5 ${
              accent ? 'border-error-container' : 'border-outline-variant'
            }`}
          >
            <span
              className={`material-symbols-outlined absolute right-5 top-5 ${
                accent ? 'text-error' : index === 1 ? 'text-amber-600' : 'text-primary'
              }`}
            >
              {icon}
            </span>
            <p
              className={`text-[11px] font-semibold uppercase tracking-wider ${
                accent ? 'text-error' : 'text-on-surface-variant'
              }`}
            >
              {label}
            </p>
            <p className="mt-5 font-headline text-4xl text-on-surface">
              {loading ? '—' : statValues[key].toLocaleString('en-IN')}
            </p>
            <p className="mt-3 text-xs text-on-surface-variant">{note}</p>
            <span className="absolute -bottom-10 -right-8 h-28 w-28 rounded-full bg-surface-container" />
          </article>
        ))}
      </section>

      {/* ── Status Filter Pills ───────────────────────────────────────────── */}
      <section className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map(({ label, value }) => (
          <button
            key={value || 'all'}
            onClick={() => handleFilterChange(value)}
            className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
              statusFilter === value
                ? 'border-primary bg-primary text-on-primary'
                : 'border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {label}
          </button>
        ))}
      </section>

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left">
            <thead className="bg-surface-container-low text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
              <tr>
                <th className="px-4 py-4">#</th>
                <th className="px-4 py-4">Member</th>
                <th className="px-4 py-4">Space</th>
                <th className="px-4 py-4">Schedule</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">Total</th>
                <th className="px-4 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {/* Loading skeleton */}
              {loading &&
                Array.from({ length: 8 }, (_, i) => <SkeletonRow key={i} />)}

              {/* Populated rows */}
              {!loading &&
                bookings.map((booking, index) => {
                  const rowNum = (pagination.page - 1) * PAGE_LIMIT + index + 1;
                  const isPending = String(booking.status).toUpperCase() === 'PENDING';
                  const isApprovingThis = actionLoading[booking.id] === 'approve';
                  const isRejectingThis = actionLoading[booking.id] === 'reject';
                  const anyActionInFlight = !!actionLoading[booking.id];

                  return (
                    <tr
                      key={booking.id}
                      className="border-t border-outline-variant/60 transition hover:bg-surface-container-low/50"
                    >
                      {/* # */}
                      <td className="px-4 py-4 font-mono text-xs text-on-surface-variant">
                        {rowNum}
                      </td>

                      {/* Member */}
                      <td className="px-4 py-4">
                        <p className="text-sm font-semibold text-on-surface">
                          {booking.user?.name || '—'}
                        </p>
                        <p className="mt-0.5 text-xs text-on-surface-variant">
                          {booking.user?.email || ''}
                        </p>
                      </td>

                      {/* Space */}
                      <td className="px-4 py-4">
                        <p className="text-sm text-on-surface">
                          {booking.space?.name || '—'}
                        </p>
                      </td>

                      {/* Schedule */}
                      <td className="px-4 py-4">
                        <p className="whitespace-nowrap text-xs text-on-surface">
                          {fmtSchedule(booking.startTime, booking.endTime)}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4">
                        <Badge variant={booking.status?.toLowerCase()}>
                          {String(booking.status || '').replace(/_/g, ' ')}
                        </Badge>
                      </td>

                      {/* Total */}
                      <td className="px-4 py-4">
                        <p className="text-sm font-semibold text-on-surface">
                          {fmtAmount(booking.totalAmount)}
                        </p>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-4 text-right">
                        {isPending ? (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="primary"
                              size="sm"
                              isLoading={isApprovingThis}
                              disabled={anyActionInFlight}
                              onClick={() => handleApprove(booking.id)}
                            >
                              {!isApprovingThis && (
                                <span className="material-symbols-outlined text-sm">check</span>
                              )}
                              Approve
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              isLoading={isRejectingThis}
                              disabled={anyActionInFlight}
                              onClick={() => openRejectModal(booking.id)}
                            >
                              {!isRejectingThis && (
                                <span className="material-symbols-outlined text-sm">close</span>
                              )}
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-on-surface-variant">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* Empty state */}
        {!loading && bookings.length === 0 && (
          <EmptyState
            icon="event_busy"
            title="No bookings found"
            description={
              statusFilter
                ? `There are no ${statusFilter.toLowerCase()} bookings at the moment.`
                : 'No bookings have been made yet.'
            }
          />
        )}

        {/* Table footer */}
        <footer className="flex flex-col items-center justify-between gap-3 border-t border-outline-variant/60 bg-surface-container-low px-4 py-3 text-xs text-on-surface-variant sm:flex-row">
          <span>
            {loading
              ? 'Loading…'
              : `Showing ${bookings.length} of ${pagination.total.toLocaleString('en-IN')} bookings`
                + (statusFilter ? ` · filtered by ${statusFilter}` : '')}
          </span>
          <span className="font-mono">RBAC: MANAGE_BOOKINGS · JWT Bearer Validated</span>
        </footer>
      </section>

      {/* ── Pagination ────────────────────────────────────────────────────── */}
      {pagination.totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <span className="material-symbols-outlined text-base">chevron_left</span>
            Previous
          </Button>

          <p className="text-sm text-on-surface-variant">
            Page{' '}
            <span className="font-semibold text-on-surface">{pagination.page}</span>
            {' '}of{' '}
            <span className="font-semibold text-on-surface">{pagination.totalPages}</span>
            <span className="ml-3 text-xs">
              ({pagination.total.toLocaleString('en-IN')} total)
            </span>
          </p>

          <Button
            variant="secondary"
            size="sm"
            disabled={page >= pagination.totalPages || loading}
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
          >
            Next
            <span className="material-symbols-outlined text-base">chevron_right</span>
          </Button>
        </div>
      )}

    </div>
  );
};

export default BookingManagement;
