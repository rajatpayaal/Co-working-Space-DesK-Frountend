import React, { useCallback, useEffect, useState, useMemo } from 'react';
import bookingsApi from '../../api/bookingsApi';
import usersApi from '../../api/usersApi';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import EmptyState from '../../components/common/EmptyState';
import { SkeletonRow } from '../../components/common/LoadingSpinner';
import { collectionFrom, unwrapResponse } from '../../api/responseHelpers';

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_LIMIT = 15;

const STATUS_FILTERS = [
  { label: 'All Statuses', value: '' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Rejected', value: 'REJECTED' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

const STAT_CARDS = [
  { key: 'total',     icon: 'calendar_month',   label: 'Total Bookings',   note: 'All time records',              accent: false },
  { key: 'pending',   icon: 'schedule',          label: 'Pending Review',   note: 'Awaiting admin action',         accent: false },
  { key: 'approved',  icon: 'check_circle',      label: 'Approved',         note: 'Confirmed reservations',        accent: false },
  { key: 'cancelled', icon: 'do_not_disturb_on', label: 'Cancelled',        note: 'Member or admin cancellations', accent: true },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Format an ISO date string as "DD MMM YYYY" */
const fmtDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

/** Format an ISO date string as "HH:MM" */
const fmtTime = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
};

/** Format a booking schedule: "DD MMM YYYY, HH:MM – HH:MM" */
const fmtSchedule = (startIso, endIso) => {
  if (!startIso) return '—';
  const datePart = fmtDate(startIso);
  const startTime = fmtTime(startIso);
  const endTime = fmtTime(endIso);
  return `${datePart}, ${startTime} – ${endTime}`;
};

/** Compute human-readable duration between start and end */
const calcDuration = (startIso, endIso) => {
  if (!startIso || !endIso) return '—';
  const diffMs = new Date(endIso) - new Date(startIso);
  if (diffMs <= 0) return '—';
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const mins = Math.round((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  if (hours === 0) return `${mins}m`;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

/** Format a currency amount as ₹X,XXX.XX */
const fmtAmount = (amount) => {
  if (amount == null) return '—';
  return `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/** Get uppercase 1-2 character initials for member avatar */
const getInitials = (name) => {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// ─── Member Avatar Sub-component ──────────────────────────────────────────────

const MemberAvatar = ({ user, size = 'md' }) => {
  const name = user?.name || 'Member';
  const initials = getInitials(name);
  const sizeClasses =
    size === 'sm'
      ? 'w-7 h-7 text-[10px]'
      : size === 'lg'
      ? 'w-12 h-12 text-sm'
      : 'w-9 h-9 text-xs';

  return (
    <div
      className={`${sizeClasses} rounded-full bg-primary/15 text-primary font-bold flex items-center justify-center flex-shrink-0 border border-primary/25 shadow-xs`}
      title={name}
    >
      {initials}
    </div>
  );
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
              Reject Booking #{bookingId}
            </h3>
          </div>
          <button
            onClick={onCancel}
            disabled={isLoading}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant transition hover:bg-surface-container cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
          <p className="text-sm text-on-surface-variant">
            Please provide a clear reason for rejecting this booking. The member will be notified.
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
              placeholder="e.g. Space is unavailable due to scheduled maintenance or double-booking."
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

// ─── Booking & Member Details Modal ───────────────────────────────────────────

const BookingDetailsModal = ({
  booking,
  isOpen,
  onClose,
  onFilterByMember,
  onApprove,
  onReject,
  actionLoading,
}) => {
  if (!isOpen || !booking) return null;

  const isPending = String(booking.status).toUpperCase() === 'PENDING';
  const isApproving = actionLoading[booking.id] === 'approve';
  const isRejecting = actionLoading[booking.id] === 'reject';
  const user = booking.user || {};
  const space = booking.space || {};

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Booking Details #${booking.id}`}
      size="lg"
    >
      <div className="space-y-5">
        {/* Status header banner */}
        <div className="flex items-center justify-between p-3.5 bg-surface-container-low rounded-xl border border-outline-variant">
          <div className="flex items-center gap-2.5">
            <span className="text-xs text-on-surface-variant font-medium">Status:</span>
            <Badge variant={booking.status?.toLowerCase()}>
              {String(booking.status || '').replace(/_/g, ' ')}
            </Badge>
          </div>
          <div className="text-right">
            <p className="text-xs text-on-surface-variant font-medium">Total Amount</p>
            <p className="text-base font-bold text-primary">{fmtAmount(booking.totalAmount)}</p>
          </div>
        </div>

        {/* Member Profile Card */}
        <div className="p-4 rounded-xl border border-outline-variant bg-surface-container-lowest">
          <div className="flex items-center justify-between mb-3 border-b border-outline-variant/50 pb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-primary">person</span>
              Booked By Member
            </h4>
            {user.id && (
              <button
                type="button"
                onClick={() => {
                  onFilterByMember(user.id);
                  onClose();
                }}
                className="text-xs text-primary font-medium hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[14px]">person_search</span>
                View all bookings by this member
              </button>
            )}
          </div>

          <div className="flex items-start gap-3.5">
            <MemberAvatar user={user} size="lg" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-on-surface truncate">
                  {user.name || 'Unknown Member'}
                </p>
                {user.role && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-surface-container text-on-surface-variant uppercase tracking-wider">
                    {user.role}
                  </span>
                )}
              </div>
              <p className="text-xs text-on-surface-variant mt-0.5">{user.email || 'No email provided'}</p>
              {user.id && (
                <p className="text-[11px] text-on-surface-variant/70 mt-1 font-mono">
                  Member ID: {user.id}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Space Information Card */}
        <div className="p-4 rounded-xl border border-outline-variant bg-surface-container-lowest">
          <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-3 border-b border-outline-variant/50 pb-2 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-primary">meeting_room</span>
            Space Information
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-on-surface-variant font-medium">Space Name</p>
              <p className="text-sm font-semibold text-on-surface mt-0.5">{space.name || '—'}</p>
            </div>
            <div>
              <p className="text-on-surface-variant font-medium">Space Type</p>
              <p className="text-sm text-on-surface mt-0.5">{space.type || 'Desk / Room'}</p>
            </div>
            <div>
              <p className="text-on-surface-variant font-medium">Location</p>
              <p className="text-on-surface mt-0.5">{space.location || 'Main Floor'}</p>
            </div>
            <div>
              <p className="text-on-surface-variant font-medium">Capacity</p>
              <p className="text-on-surface mt-0.5">{space.capacity ? `${space.capacity} persons` : '—'}</p>
            </div>
          </div>
        </div>

        {/* Schedule & Timing Card */}
        <div className="p-4 rounded-xl border border-outline-variant bg-surface-container-lowest">
          <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-3 border-b border-outline-variant/50 pb-2 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-primary">schedule</span>
            Schedule & Reservation Time
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-on-surface-variant font-medium">Date & Start Time</p>
              <p className="text-sm text-on-surface mt-0.5 font-medium">
                {fmtDate(booking.startTime)} at {fmtTime(booking.startTime)}
              </p>
            </div>
            <div>
              <p className="text-on-surface-variant font-medium">Date & End Time</p>
              <p className="text-sm text-on-surface mt-0.5 font-medium">
                {fmtDate(booking.endTime)} at {fmtTime(booking.endTime)}
              </p>
            </div>
            <div>
              <p className="text-on-surface-variant font-medium">Duration</p>
              <p className="text-sm text-primary font-semibold mt-0.5">
                {calcDuration(booking.startTime, booking.endTime)}
              </p>
            </div>
            <div>
              <p className="text-on-surface-variant font-medium">Booked On</p>
              <p className="text-on-surface mt-0.5">
                {fmtDate(booking.createdAt)} at {fmtTime(booking.createdAt)}
              </p>
            </div>
          </div>
        </div>

        {/* Rejection Note (if rejected) */}
        {booking.rejectionReason && (
          <div className="p-3.5 bg-error/10 border border-error/30 rounded-xl text-xs text-error">
            <p className="font-semibold flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">cancel</span>
              Rejection Reason:
            </p>
            <p className="mt-1 text-on-surface">{booking.rejectionReason}</p>
          </div>
        )}

        {/* Modal Footer Actions */}
        <div className="pt-4 border-t border-outline-variant flex items-center justify-between gap-3">
          <Button variant="secondary" size="md" onClick={onClose}>
            Close
          </Button>

          {isPending && (
            <div className="flex items-center gap-2">
              <Button
                variant="danger"
                size="md"
                isLoading={isRejecting}
                onClick={() => {
                  onClose();
                  onReject(booking.id);
                }}
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
                Reject Booking
              </Button>
              <Button
                variant="primary"
                size="md"
                isLoading={isApproving}
                onClick={() => {
                  onApprove(booking.id);
                  onClose();
                }}
              >
                <span className="material-symbols-outlined text-[16px]">check</span>
                Approve Booking
              </Button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const BookingManagement = () => {
  // Data
  const [bookings, setBookings] = useState([]);
  const [members, setMembers] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: PAGE_LIMIT, totalPages: 1 });
  const [statusCounts, setStatusCounts] = useState({ total: 0, pending: 0, approved: 0, cancelled: 0 });

  // Filters & search
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  // Loading / error
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Per-row action loading: { [bookingId]: 'approve' | 'reject' | null }
  const [actionLoading, setActionLoading] = useState({});

  // Reject modal state
  const [rejectTarget, setRejectTarget] = useState(null); // booking id
  const [rejectLoading, setRejectLoading] = useState(false);

  // Details modal state
  const [detailsBooking, setDetailsBooking] = useState(null);

  // ── Load member list (for the member selector dropdown) ───────────────────
  const loadMembers = useCallback(async () => {
    try {
      const res = await usersApi.getAll({ limit: 100 });
      const usersList = collectionFrom(res, ['users', 'items']);
      if (Array.isArray(usersList) && usersList.length > 0) {
        setMembers((prev) => {
          const map = new Map(prev.map((m) => [m.id, m]));
          usersList.forEach((u) => {
            if (u.id) map.set(u.id, u);
          });
          return Array.from(map.values());
        });
      }
    } catch {
      // Non-critical; members will also be harvested from bookings
    }
  }, []);

  // ── Fetch counts (for stat cards) ─────────────────────────────────────────
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
      // Counts are non-critical
    }
  }, []);

  // ── Fetch paginated bookings list ────────────────────────────────────────
  const loadBookings = useCallback(async (currentPage, currentStatus, currentMemberId) => {
    setLoading(true);
    setError('');
    try {
      const params = { page: currentPage, limit: PAGE_LIMIT };
      if (currentStatus) params.status = currentStatus;
      if (currentMemberId) params.userId = currentMemberId;

      const res = await bookingsApi.getAdminAll(params);
      const list = collectionFrom(res, ['bookings', 'items']);

      // Harvest unique members from loaded bookings
      setMembers((prev) => {
        const map = new Map(prev.map((m) => [m.id, m]));
        list.forEach((b) => {
          if (b.user?.id && !map.has(b.user.id)) {
            map.set(b.user.id, b.user);
          }
        });
        return Array.from(map.values());
      });

      setBookings(list);

      const pag = unwrapResponse(res)?.pagination;
      if (pag) {
        setPagination({
          total:      pag.total      ?? list.length,
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
    loadMembers();
  }, [loadCounts, loadMembers]);

  useEffect(() => {
    loadBookings(page, statusFilter, selectedMemberId);
  }, [loadBookings, page, statusFilter, selectedMemberId]);

  // ── Filter change handlers ───────────────────────────────────────────────
  const handleStatusChange = (val) => {
    setStatusFilter(val);
    setPage(1);
  };

  const handleMemberChange = (memberId) => {
    setSelectedMemberId(memberId);
    setPage(1);
  };

  const handleClearAllFilters = () => {
    setStatusFilter('');
    setSelectedMemberId('');
    setSearchQuery('');
    setPage(1);
  };

  // ── Refresh ───────────────────────────────────────────────────────────────
  const handleRefresh = () => {
    loadCounts();
    loadMembers();
    loadBookings(page, statusFilter, selectedMemberId);
  };

  // ── Approve ───────────────────────────────────────────────────────────────
  const handleApprove = async (id) => {
    setActionLoading((prev) => ({ ...prev, [id]: 'approve' }));
    try {
      await bookingsApi.approve(id);
      loadCounts();
      await loadBookings(page, statusFilter, selectedMemberId);
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
      await loadBookings(page, statusFilter, selectedMemberId);
    } catch (err) {
      setError(err.response?.data?.message || `Failed to reject booking #${id}.`);
    } finally {
      setRejectLoading(false);
      setActionLoading((prev) => ({ ...prev, [id]: null }));
    }
  };

  // ── Filtered bookings for display (supports search query + member ID) ─────
  const displayedBookings = useMemo(() => {
    return bookings.filter((b) => {
      // If a member is selected, ensure it matches either b.user?.id or b.userId
      if (selectedMemberId) {
        const bUserId = b.user?.id || b.userId;
        if (bUserId && String(bUserId) !== String(selectedMemberId)) {
          return false;
        }
      }

      // If search query is entered, match across multiple fields
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const userName = (b.user?.name || '').toLowerCase();
        const userEmail = (b.user?.email || '').toLowerCase();
        const spaceName = (b.space?.name || '').toLowerCase();
        const bId = String(b.id || '').toLowerCase();
        const status = String(b.status || '').toLowerCase();
        return (
          userName.includes(q) ||
          userEmail.includes(q) ||
          spaceName.includes(q) ||
          bId.includes(q) ||
          status.includes(q)
        );
      }

      return true;
    });
  }, [bookings, selectedMemberId, searchQuery]);

  // Selected member object (if any)
  const selectedMember = useMemo(() => {
    if (!selectedMemberId) return null;
    return members.find((m) => String(m.id) === String(selectedMemberId)) || null;
  }, [members, selectedMemberId]);

  // ── Derived counts for stat cards ─────────────────────────────────────────
  const statValues = {
    total:     statusCounts.total,
    pending:   statusCounts.pending,
    approved:  statusCounts.approved,
    cancelled: statusCounts.cancelled,
  };

  const hasActiveFilters = Boolean(statusFilter || selectedMemberId || searchQuery);

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

      {/* ── Booking & Member Details Modal ────────────────────────────────── */}
      {detailsBooking && (
        <BookingDetailsModal
          booking={detailsBooking}
          isOpen={Boolean(detailsBooking)}
          onClose={() => setDetailsBooking(null)}
          onFilterByMember={(memberId) => handleMemberChange(memberId)}
          onApprove={handleApprove}
          onReject={openRejectModal}
          actionLoading={actionLoading}
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
            <span className="text-[10px] font-bold tracking-[0.18em] text-primary uppercase bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
              Admin Console
            </span>
          </div>
          <p className="mt-2 max-w-3xl text-sm text-on-surface-variant">
            Review, approve, and track all co-working reservations. Filter bookings by individual member,
            inspect member booking profiles, and manage status approvals.
          </p>
        </div>
        <div className="flex items-center gap-2">
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
          <button onClick={handleRefresh} className="font-semibold underline cursor-pointer">
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

      {/* ── Filter Controls Card ──────────────────────────────────────────── */}
      <section className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs">
        {/* Status Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-on-surface-variant mr-1">Status:</span>
          {STATUS_FILTERS.map(({ label, value }) => (
            <button
              key={value || 'all'}
              onClick={() => handleStatusChange(value)}
              className={`rounded-full border px-3.5 py-1 text-xs font-medium transition cursor-pointer ${
                statusFilter === value
                  ? 'border-primary bg-primary text-on-primary shadow-xs'
                  : 'border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:text-on-surface hover:border-outline'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Member Selector & Text Search Bar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-outline-variant/50">
          {/* Member Dropdown Selector */}
          <div className="relative">
            <label htmlFor="member-filter-select" className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px] text-primary">person</span>
              Filter By Member
            </label>
            <div className="relative">
              <select
                id="member-filter-select"
                value={selectedMemberId}
                onChange={(e) => handleMemberChange(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3.5 py-2 text-xs text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 appearance-none pr-8 cursor-pointer"
              >
                <option value="">— View All Members' Bookings —</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name || 'User'} ({m.email})
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-on-surface-variant">
                <span className="material-symbols-outlined text-[18px]">arrow_drop_down</span>
              </div>
            </div>
          </div>

          {/* Quick Search Box */}
          <div>
            <label htmlFor="booking-search" className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px] text-primary">search</span>
              Search Bookings
            </label>
            <div className="relative">
              <input
                id="booking-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search member, email, space, ID..."
                className="w-full bg-surface-container-low border border-outline-variant rounded-xl pl-9 pr-8 py-2 text-xs text-on-surface placeholder:text-on-surface-variant/50 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant absolute left-3 top-2.5 pointer-events-none">
                search
              </span>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-on-surface-variant hover:text-on-surface"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Active Member Filter Banner */}
        {selectedMember && (
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-primary/8 border border-primary/25 rounded-xl">
            <div className="flex items-center gap-3">
              <MemberAvatar user={selectedMember} size="sm" />
              <div>
                <p className="text-[11px] font-semibold text-primary uppercase tracking-wide">
                  Active Filter: Bookings by {selectedMember.name}
                </p>
                <p className="text-xs text-on-surface">
                  {selectedMember.email} · <span className="font-mono text-[11px] text-on-surface-variant">ID: {selectedMember.id}</span>
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleMemberChange('')}
            >
              <span className="material-symbols-outlined text-sm">close</span>
              Clear Member Filter
            </Button>
          </div>
        )}

        {/* Clear all filters shortcut */}
        {hasActiveFilters && !selectedMember && (
          <div className="flex items-center justify-between text-xs text-on-surface-variant pt-2 border-t border-outline-variant/40">
            <span>
              Filters active: {statusFilter && `Status: ${statusFilter}`} {searchQuery && `· Search: "${searchQuery}"`}
            </span>
            <button
              type="button"
              onClick={handleClearAllFilters}
              className="text-primary font-semibold hover:underline cursor-pointer"
            >
              Reset all filters
            </button>
          </div>
        )}
      </section>

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      <section className="overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1020px] text-left">
            <thead className="bg-surface-container-low text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
              <tr>
                <th className="px-4 py-4">#</th>
                <th className="px-4 py-4">Booked By (Member)</th>
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
                displayedBookings.map((booking, index) => {
                  const rowNum = (pagination.page - 1) * PAGE_LIMIT + index + 1;
                  const isPending = String(booking.status).toUpperCase() === 'PENDING';
                  const isApprovingThis = actionLoading[booking.id] === 'approve';
                  const isRejectingThis = actionLoading[booking.id] === 'reject';
                  const anyActionInFlight = !!actionLoading[booking.id];
                  const user = booking.user || {};

                  return (
                    <tr
                      key={booking.id}
                      className="border-t border-outline-variant/60 transition hover:bg-surface-container-low/50"
                    >
                      {/* # */}
                      <td className="px-4 py-4 font-mono text-xs text-on-surface-variant">
                        {rowNum}
                      </td>

                      {/* Member Info */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <MemberAvatar user={user} size="md" />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-semibold text-on-surface truncate">
                                {user.name || 'Unknown Member'}
                              </p>
                              {user.role && (
                                <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-surface-container text-on-surface-variant uppercase tracking-wider">
                                  {user.role}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-on-surface-variant truncate">
                              {user.email || '—'}
                            </p>
                            {user.id && (
                              <button
                                type="button"
                                onClick={() => handleMemberChange(user.id)}
                                className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-medium cursor-pointer"
                                title={`Filter all bookings by ${user.name || 'this member'}`}
                              >
                                <span className="material-symbols-outlined text-[13px]">person_search</span>
                                See all bookings by member
                              </button>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Space */}
                      <td className="px-4 py-4">
                        <p className="text-sm font-medium text-on-surface">
                          {booking.space?.name || '—'}
                        </p>
                        {booking.space?.type && (
                          <p className="text-xs text-on-surface-variant mt-0.5">
                            {booking.space.type}
                          </p>
                        )}
                      </td>

                      {/* Schedule */}
                      <td className="px-4 py-4">
                        <p className="whitespace-nowrap text-xs text-on-surface font-medium">
                          {fmtSchedule(booking.startTime, booking.endTime)}
                        </p>
                        <p className="text-[11px] text-on-surface-variant mt-0.5 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]">schedule</span>
                          Duration: {calcDuration(booking.startTime, booking.endTime)}
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
                        <p className="text-sm font-bold text-on-surface">
                          {fmtAmount(booking.totalAmount)}
                        </p>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Full Details Button */}
                          <button
                            type="button"
                            onClick={() => setDetailsBooking(booking)}
                            title="View Booking & Member Details"
                            className="p-1.5 rounded-lg border border-outline-variant hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[18px] block">visibility</span>
                          </button>

                          {isPending && (
                            <>
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
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* Empty state */}
        {!loading && displayedBookings.length === 0 && (
          <EmptyState
            icon="event_busy"
            title="No bookings found"
            description={
              selectedMember
                ? `No bookings found for ${selectedMember.name}${statusFilter ? ` with status ${statusFilter}` : ''}.`
                : statusFilter
                ? `There are no ${statusFilter.toLowerCase()} bookings at the moment.`
                : searchQuery
                ? `No bookings match your search query "${searchQuery}".`
                : 'No bookings have been made yet.'
            }
            action={
              hasActiveFilters ? (
                <Button variant="secondary" size="sm" onClick={handleClearAllFilters}>
                  Clear All Filters
                </Button>
              ) : undefined
            }
          />
        )}

        {/* Table footer */}
        <footer className="flex flex-col items-center justify-between gap-3 border-t border-outline-variant/60 bg-surface-container-low px-4 py-3 text-xs text-on-surface-variant sm:flex-row">
          <span>
            {loading
              ? 'Loading…'
              : `Showing ${displayedBookings.length} of ${pagination.total.toLocaleString('en-IN')} bookings`
                + (selectedMember ? ` · for member "${selectedMember.name}"` : '')
                + (statusFilter ? ` · filtered by ${statusFilter}` : '')}
          </span>
          <span className="font-mono">RBAC: MANAGE_BOOKINGS · JWT Bearer Validated</span>
        </footer>
      </section>

      {/* ── Pagination ────────────────────────────────────────────────────── */}
      {pagination.totalPages > 1 && !selectedMemberId && (
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
