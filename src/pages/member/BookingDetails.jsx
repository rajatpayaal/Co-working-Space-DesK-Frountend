import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import bookingsApi from '../../api/bookingsApi';
import { unwrapResponse } from '../../api/responseHelpers';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { PageLoader } from '../../components/common/LoadingSpinner';

export const BookingDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');

  const handleGoBack = () => {
    if (window.history.state && typeof window.history.state.idx === 'number' && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate('/my-bookings');
    }
  };

  const fetchBooking = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await bookingsApi.getById(id);
      const data = unwrapResponse(res);
      setBooking(data);
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to load booking details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this reservation?')) {
      return;
    }

    setCancelling(true);
    setCancelError('');
    try {
      await bookingsApi.cancel(id);
      await fetchBooking();
    } catch (err) {
      setCancelError(err?.response?.data?.message || 'Failed to cancel reservation.');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return <PageLoader message="Loading reservation details..." />;
  }

  if (error || !booking) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-20 text-center">
        <Button variant="secondary" size="sm" className="mb-6" onClick={handleGoBack}>
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Back to My Bookings
        </Button>
        <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant p-10">
          <span className="material-symbols-outlined text-4xl text-error mb-2">event_busy</span>
          <h2 className="font-headline text-2xl text-on-surface">Reservation Not Found</h2>
          <p className="text-xs text-on-surface-variant mt-2">{error || 'This booking may have been removed.'}</p>
        </div>
      </div>
    );
  }

  const canCancel = booking.status === 'PENDING' || booking.status === 'APPROVED';

  return (
    <div className="min-h-screen bg-background text-on-surface pb-20">
      {/* ── Page Header ────────────────────────────────────────────── */}
      <section className="bg-surface-container-lowest border-b border-outline-variant/60 py-6">
        <div className="max-w-4xl mx-auto px-6 flex items-center justify-between">
          <Button variant="secondary" size="sm" onClick={handleGoBack}>
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Back to My Bookings
          </Button>
          <span className="font-mono text-xs text-on-surface-variant">
            REF: #{booking.id.slice(0, 8).toUpperCase()}
          </span>
        </div>
      </section>

      <main className="max-w-4xl mx-auto px-6 pt-10">
        <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant p-6 sm:p-10 shadow-sm space-y-8">
          {/* Top Title & Status */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-outline-variant/60">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">Booking Confirmation</span>
              <h1 className="font-headline text-3xl font-medium text-on-surface mt-1">
                {booking.space?.name || 'Workspace Reservation'}
              </h1>
              {booking.space?.location && (
                <p className="flex items-center gap-1 text-xs text-on-surface-variant mt-1">
                  <span className="material-symbols-outlined text-xs text-primary">location_on</span>
                  {booking.space.location}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={String(booking.status || 'PENDING').toLowerCase()}>
                {booking.status || 'PENDING'}
              </Badge>
            </div>
          </div>

          {cancelError && (
            <div className="p-4 rounded-xl bg-error/10 border border-error/30 text-error text-xs font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-base">error</span>
              <span>{cancelError}</span>
            </div>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
            <div className="space-y-4 p-5 rounded-2xl bg-surface-container-low border border-outline-variant/40">
              <h3 className="font-semibold text-on-surface uppercase text-[11px] tracking-wide">Schedule Details</h3>
              <div className="flex justify-between text-on-surface-variant">
                <span>Date:</span>
                <span className="font-semibold text-on-surface">{booking.date || '—'}</span>
              </div>
              <div className="flex justify-between text-on-surface-variant">
                <span>Time Window:</span>
                <span className="font-semibold text-on-surface">{booking.startTime} – {booking.endTime}</span>
              </div>
              <div className="flex justify-between text-on-surface-variant">
                <span>Created At:</span>
                <span className="font-mono">{booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : '—'}</span>
              </div>
            </div>

            <div className="space-y-4 p-5 rounded-2xl bg-surface-container-low border border-outline-variant/40">
              <h3 className="font-semibold text-on-surface uppercase text-[11px] tracking-wide">Financial Breakdown</h3>
              <div className="flex justify-between text-on-surface-variant">
                <span>Hourly Tariff:</span>
                <span className="font-semibold text-on-surface">₹{booking.space?.pricePerHour || 0}/hr</span>
              </div>
              <div className="flex justify-between text-on-surface-variant">
                <span>Total Amount:</span>
                <span className="font-headline text-lg font-bold text-primary">₹{booking.amount ?? booking.totalAmount ?? '—'}</span>
              </div>
              <div className="flex justify-between text-on-surface-variant">
                <span>Payment Status:</span>
                <span className="font-semibold text-green-700">Settled via Account</span>
              </div>
            </div>
          </div>

          {/* Notes section if present (Prisma notes field) */}
          {booking.notes && (
            <div className="p-5 rounded-2xl bg-surface-container-low border border-outline-variant/40">
              <h3 className="font-semibold text-on-surface uppercase text-[11px] tracking-wide mb-1.5">
                Special Instructions & Notes
              </h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                {booking.notes}
              </p>
            </div>
          )}

          {/* Actions Bar */}
          <div className="pt-6 border-t border-outline-variant/60 flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link to={booking.spaceId ? `/spaces/${booking.spaceId}` : '/spaces'}>
              <Button variant="secondary" size="md">
                <span className="material-symbols-outlined text-base">domain</span>
                View Space Page
              </Button>
            </Link>

            {canCancel && (
              <Button
                variant="danger"
                size="md"
                isLoading={cancelling}
                onClick={handleCancel}
              >
                <span className="material-symbols-outlined text-base">cancel</span>
                Cancel Reservation
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default BookingDetails;
