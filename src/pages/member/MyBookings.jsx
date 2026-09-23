import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import bookingsApi from '../../api/bookingsApi';
import { collectionFrom, paginationFrom } from '../../api/responseHelpers';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import { SkeletonRow } from '../../components/common/LoadingSpinner';

const STATUS_FILTERS = [
  { label: 'All Bookings', value: '' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Rejected', value: 'REJECTED' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

export const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [status, setStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page: currentPage,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };
      if (status) params.status = status;

      const res = await bookingsApi.getAll(params);
      const list = collectionFrom(res, ['bookings', 'data', 'items']);
      const pag = paginationFrom(res);

      setBookings(list);
      setPagination(pag);
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to load your bookings.');
    } finally {
      setLoading(false);
    }
  }, [status, currentPage]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  return (
    <div className="min-h-screen bg-background text-on-surface pb-20">
      {/* ── Page Header ────────────────────────────────────────────── */}
      <section className="bg-surface-container-lowest border-b border-outline-variant/60 py-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">Reservations</span>
            <h1 className="font-headline text-3xl sm:text-4xl text-on-surface font-normal mt-1">
              My Bookings
            </h1>
            <p className="text-xs text-on-surface-variant mt-1.5">
              Review and manage your active, pending, and past workspace sessions.
            </p>
          </div>
          <Link to="/spaces">
            <Button variant="primary" size="md">
              <span className="material-symbols-outlined text-base">add</span>
              New Reservation
            </Button>
          </Link>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-6 lg:px-12 pt-8 space-y-6">
        {/* ── Filter Pills ──────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2">
          {STATUS_FILTERS.map((pill) => (
            <button
              key={pill.value}
              type="button"
              onClick={() => {
                setStatus(pill.value);
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                status === pill.value
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-surface-container-lowest border border-outline-variant text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* ── Bookings Table ────────────────────────────────────────── */}
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/60 overflow-hidden shadow-sm">
          {error && (
            <div className="p-5 bg-error/10 text-error text-xs font-medium flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base">error</span>
                <span>{error}</span>
              </div>
              <Button variant="outline" size="sm" onClick={fetchBookings}>
                Retry
              </Button>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-container-low text-[10px] uppercase tracking-wider text-on-surface-variant font-semibold">
                <tr>
                  <th className="px-6 py-4">Workspace</th>
                  <th className="px-4 py-4">Date</th>
                  <th className="px-4 py-4">Time Window</th>
                  <th className="px-4 py-4">Amount</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/60">
                {loading && (
                  <>
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
                  </>
                )}

                {!loading && bookings.length === 0 && (
                  <tr>
                    <td colSpan="6" className="py-16">
                      <EmptyState
                        icon="event_busy"
                        title={status ? `No ${status.toLowerCase()} bookings found` : 'No bookings recorded'}
                        description="Your reservations will be listed here once you book a workspace."
                        action={
                          <Link to="/spaces">
                            <Button size="sm">Browse Spaces</Button>
                          </Link>
                        }
                      />
                    </td>
                  </tr>
                )}

                {!loading &&
                  bookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-surface-container-low/60 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-sm text-on-surface">
                          {booking.space?.name || 'Workspace'}
                        </p>
                        {booking.space?.location && (
                          <p className="text-[11px] text-on-surface-variant flex items-center gap-0.5 mt-0.5">
                            <span className="material-symbols-outlined text-[13px] text-primary">location_on</span>
                            {booking.space.location}
                          </p>
                        )}
                        {booking.notes && (
                          <p className="text-[11px] text-on-surface-variant italic mt-1 line-clamp-1">
                            “{booking.notes}”
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-4 font-medium text-on-surface">
                        {booking.date || '—'}
                      </td>
                      <td className="px-4 py-4 font-mono text-on-surface-variant">
                        {booking.startTime} – {booking.endTime}
                      </td>
                      <td className="px-4 py-4 font-semibold text-sm text-on-surface">
                        ₹{booking.amount ?? booking.totalAmount ?? '—'}
                      </td>
                      <td className="px-4 py-4">
                        <Badge variant={String(booking.status || 'PENDING').toLowerCase()}>
                          {booking.status || 'PENDING'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link to={`/my-bookings/${booking.id}`}>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="p-4 border-t border-outline-variant/60 flex items-center justify-between text-xs text-on-surface-variant">
              <span>
                Page <span className="font-semibold text-on-surface">{pagination.page}</span> of {pagination.totalPages} ({pagination.total} total)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default MyBookings;
