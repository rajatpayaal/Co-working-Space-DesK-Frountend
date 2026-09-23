import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import bookingsApi from '../../api/bookingsApi';
import { collectionFrom } from '../../api/responseHelpers';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import { SkeletonRow } from '../../components/common/LoadingSpinner';

export const Dashboard = () => {
  const { currentUser } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await bookingsApi.getAll({ limit: 10, sortBy: 'createdAt', sortOrder: 'desc' });
      const list = collectionFrom(res, ['bookings', 'data', 'items']);
      setBookings(list);
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to load your dashboard activity.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Derived metrics
  const total = bookings.length;
  const approved = bookings.filter((b) => b.status === 'APPROVED').length;
  const pending = bookings.filter((b) => b.status === 'PENDING').length;
  const cancelled = bookings.filter((b) => b.status === 'CANCELLED' || b.status === 'REJECTED').length;

  return (
    <div className="min-h-screen bg-background text-on-surface pb-20">
      {/* ── Welcome Banner ──────────────────────────────────────────── */}
      <section className="bg-surface-container-lowest border-b border-outline-variant/60 py-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">Member Portal</span>
            <h1 className="font-headline text-3xl sm:text-4xl text-on-surface font-normal mt-1">
              Welcome back, {currentUser?.name || 'Member'}
            </h1>
            <p className="text-xs text-on-surface-variant mt-1.5 max-w-xl">
              Track your reservations, review workspace bookings, and discover open desks.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/spaces">
              <Button variant="primary" size="md">
                <span className="material-symbols-outlined text-base">add</span>
                Reserve New Space
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-6 lg:px-12 pt-10 space-y-10">
        {/* ── Stats Grid ────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/60 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-on-surface-variant uppercase">Total Bookings</span>
              <span className="material-symbols-outlined text-lg text-primary">bookmark</span>
            </div>
            <p className="font-headline text-3xl font-semibold text-on-surface mt-3">
              {loading ? '…' : total}
            </p>
            <p className="text-[11px] text-on-surface-variant mt-1">All time reservations</p>
          </div>

          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/60 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-green-700 uppercase">Confirmed</span>
              <span className="material-symbols-outlined text-lg text-green-600">check_circle</span>
            </div>
            <p className="font-headline text-3xl font-semibold text-green-700 mt-3">
              {loading ? '…' : approved}
            </p>
            <p className="text-[11px] text-on-surface-variant mt-1">Approved & active</p>
          </div>

          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/60 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-700 uppercase">Pending</span>
              <span className="material-symbols-outlined text-lg text-amber-600">schedule</span>
            </div>
            <p className="font-headline text-3xl font-semibold text-amber-700 mt-3">
              {loading ? '…' : pending}
            </p>
            <p className="text-[11px] text-on-surface-variant mt-1">Awaiting admin review</p>
          </div>

          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/60 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-on-surface-variant uppercase">Completed / Past</span>
              <span className="material-symbols-outlined text-lg text-on-surface-variant">history</span>
            </div>
            <p className="font-headline text-3xl font-semibold text-on-surface mt-3">
              {loading ? '…' : cancelled}
            </p>
            <p className="text-[11px] text-on-surface-variant mt-1">Cancelled or rejected</p>
          </div>
        </div>

        {/* ── Recent Bookings Table ─────────────────────────────────── */}
        <section className="bg-surface-container-lowest rounded-2xl border border-outline-variant/60 overflow-hidden shadow-sm">
          <div className="p-6 flex items-center justify-between border-b border-outline-variant/60">
            <div>
              <h2 className="font-headline text-2xl text-on-surface font-medium">Recent Reservations</h2>
              <p className="text-xs text-on-surface-variant mt-0.5">Your most recent workspace sessions and status.</p>
            </div>
            <Link to="/my-bookings">
              <Button variant="secondary" size="sm">
                View All Bookings
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Button>
            </Link>
          </div>

          {error && (
            <div className="p-5 bg-error/10 text-error text-xs font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-base">error</span>
              <span>{error}</span>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-container-low text-[10px] uppercase tracking-wider text-on-surface-variant font-semibold">
                <tr>
                  <th className="px-6 py-3.5">Workspace</th>
                  <th className="px-4 py-3.5">Date & Window</th>
                  <th className="px-4 py-3.5">Cost</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/60">
                {loading && (
                  <>
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
                  </>
                )}

                {!loading && bookings.length === 0 && (
                  <tr>
                    <td colSpan="5" className="py-12">
                      <EmptyState
                        icon="bookmark_border"
                        title="No bookings yet"
                        description="You haven't made any workspace reservations yet. Discover spaces to get started."
                        action={
                          <Link to="/spaces">
                            <Button size="sm">Explore Workspaces</Button>
                          </Link>
                        }
                      />
                    </td>
                  </tr>
                )}

                {!loading &&
                  bookings.slice(0, 5).map((booking) => (
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
                      </td>
                      <td className="px-4 py-4 text-on-surface-variant">
                        <p className="font-medium text-on-surface">{booking.date || '—'}</p>
                        <p className="text-[11px] mt-0.5">{booking.startTime} – {booking.endTime}</p>
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
                            Details
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
