import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import spacesApi from '../../api/spacesApi';
import bookingsApi from '../../api/bookingsApi';
import { unwrapResponse } from '../../api/responseHelpers';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import { PageLoader } from '../../components/common/LoadingSpinner';

export const BookingCheckout = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, currentUser, isAdmin } = useAuth();

  const [space, setSpace] = useState(null);
  const [loadingSpace, setLoadingSpace] = useState(true);

  // Smart go back handler
  const handleGoBack = () => {
    if (window.history.state && typeof window.history.state.idx === 'number' && window.history.state.idx > 0) {
      navigate(-1);
    } else if (window.history.length > 1) {
      navigate(-1);
    } else if (isAdmin) {
      navigate('/admin/spaces');
    } else {
      navigate(`/spaces/${id}`);
    }
  };

  // Form State
  const [form, setForm] = useState({
    date: searchParams.get('date') || new Date().toISOString().slice(0, 10),
    startTime: '09:00',
    endTime: '12:00',
    notes: '',
  });

  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availabilityResult, setAvailabilityResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Fetch Space info (with admin fallback for unpublished/inactive spaces)
  useEffect(() => {
    let active = true;
    setLoadingSpace(true);
    const loadSpace = async () => {
      try {
        let res;
        try {
          res = await spacesApi.getById(id);
        } catch (publicErr) {
          if (isAdmin || publicErr?.response?.status === 404) {
            res = await spacesApi.getAdminById(id);
          } else {
            throw publicErr;
          }
        }
        if (active) {
          setSpace(unwrapResponse(res));
        }
      } catch (err) {
        if (active) {
          setSubmitError(
            err?.response?.data?.message ||
              err?.message ||
              'This workspace could not be loaded or does not exist.'
          );
        }
      } finally {
        if (active) setLoadingSpace(false);
      }
    };

    loadSpace();

    return () => {
      active = false;
    };
  }, [id, isAdmin]);

  // Compute duration in hours and total price
  const { hours, totalCost } = useMemo(() => {
    if (!form.startTime || !form.endTime || !space) return { hours: 0, totalCost: 0 };
    const [startH, startM] = form.startTime.split(':').map(Number);
    const [endH, endM] = form.endTime.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    const diffHours = (endMinutes - startMinutes) / 60;
    const validHours = diffHours > 0 ? diffHours : 0;
    return {
      hours: validHours,
      totalCost: Math.round(validHours * (space.pricePerHour || 0) * 100) / 100,
    };
  }, [form.startTime, form.endTime, space]);

  const handleFieldChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setAvailabilityResult(null);
    setSubmitError('');
  };

  // Check availability on demand or prior to submit
  const verifyAvailability = async () => {
    if (!form.date || !form.startTime || !form.endTime) return false;
    setCheckingAvailability(true);
    setAvailabilityResult(null);
    try {
      const res = await spacesApi.checkAvailability({
        spaceId: id,
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
      });
      const data = unwrapResponse(res);
      setAvailabilityResult(data);
      return data?.isAvailable !== false;
    } catch (err) {
      setAvailabilityResult({ isAvailable: false, error: 'Could not verify availability.' });
      return false;
    } finally {
      setCheckingAvailability(false);
    }
  };

  // Handle Booking Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/booking/${id}?date=${form.date}` } } });
      return;
    }

    if (hours <= 0) {
      setSubmitError('End time must be after start time.');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Verify availability
      const isAvailable = await verifyAvailability();
      if (!isAvailable) {
        throw new Error('This time slot is no longer available. Please adjust your reservation window.');
      }

      // 2. Create booking
      const payload = {
        spaceId: id,
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        notes: form.notes.trim() || undefined,
      };

      const res = await bookingsApi.create(payload);
      const booking = unwrapResponse(res);
      navigate(`/my-bookings/${booking.id || ''}`, { replace: true });
    } catch (err) {
      setSubmitError(
        err?.response?.data?.message || err?.message || 'Failed to confirm booking. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingSpace) {
    return <PageLoader message="Loading checkout details..." />;
  }

  if (!space) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20 page-fade-in">
        <Button variant="secondary" size="sm" className="mb-6" onClick={handleGoBack}>
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Go Back
        </Button>
        <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant p-10 text-center shadow-sm">
          <div className="w-14 h-14 rounded-full bg-error/10 text-error flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-3xl">error_outline</span>
          </div>
          <h2 className="font-headline text-2xl text-on-surface">Workspace Not Found</h2>
          <p className="text-sm text-on-surface-variant mt-2 max-w-md mx-auto">
            {submitError || 'This space might be inactive or does not exist.'}
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Button variant="secondary" size="md" onClick={handleGoBack}>
              Go Back
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate(isAdmin ? '/admin/spaces' : '/spaces')}
            >
              Browse All Workspaces
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-on-surface pb-20">
      {/* ── Page Header ────────────────────────────────────────────── */}
      <section className="bg-surface-container-lowest border-b border-outline-variant/60 py-6">
        <div className="max-w-6xl mx-auto px-6">
          <Button variant="secondary" size="sm" className="mb-3" onClick={handleGoBack}>
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Back to Details
          </Button>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="font-headline text-3xl font-medium text-on-surface">Confirm Your Reservation</h1>
              <p className="text-xs text-on-surface-variant mt-1">
                Configure your reservation window and complete your booking request.
              </p>
            </div>
            {!isAuthenticated && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
                <span className="material-symbols-outlined text-base text-amber-600">login</span>
                <span>Sign in required to confirm booking</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Main Form & Summary ─────────────────────────────────────── */}
      <main className="max-w-6xl mx-auto px-6 pt-10">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Booking Form (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/60 p-6 sm:p-8 space-y-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-primary">Schedule Parameters</h2>

              {/* Error banner */}
              {submitError && (
                <div className="p-4 rounded-xl bg-error/10 border border-error/30 text-error text-xs font-medium flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">error</span>
                  <span>{submitError}</span>
                </div>
              )}

              {/* Date */}
              <Input
                label="Reservation Date"
                type="date"
                required
                min={new Date().toISOString().slice(0, 10)}
                value={form.date}
                onChange={(e) => handleFieldChange('date', e.target.value)}
                icon="calendar_month"
              />

              {/* Time Range */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Start Time"
                  type="time"
                  required
                  value={form.startTime}
                  onChange={(e) => handleFieldChange('startTime', e.target.value)}
                  icon="schedule"
                />
                <Input
                  label="End Time"
                  type="time"
                  required
                  value={form.endTime}
                  onChange={(e) => handleFieldChange('endTime', e.target.value)}
                  icon="schedule"
                />
              </div>

              {/* Slot check button & status */}
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={verifyAvailability}
                  disabled={checkingAvailability}
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">verified</span>
                  Check Real-time Availability
                </button>

                {availabilityResult && (
                  <Badge variant={availabilityResult.isAvailable ? 'active' : 'rejected'}>
                    {availabilityResult.isAvailable ? 'Slot Available' : 'Slot Conflict'}
                  </Badge>
                )}
              </div>

              {/* Notes (matching Prisma notes field) */}
              <div className="flex flex-col gap-1.5 pt-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                  Special Notes or Requirements (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Need HDMI cable for presentation, quiet environment for client conference…"
                  value={form.notes}
                  onChange={(e) => handleFieldChange('notes', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl text-xs text-on-surface placeholder:text-on-surface-variant/50 outline-none transition resize-none"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary (5 cols) */}
          <div className="lg:col-span-5">
            <div className="sticky top-28 bg-surface-container-lowest rounded-3xl border border-outline-variant p-6 sm:p-8 shadow-sm space-y-6">
              <h2 className="font-headline text-2xl text-on-surface font-medium">Reservation Summary</h2>

              {/* Space info snapshot */}
              {space && (
                <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/40 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-headline text-lg font-semibold text-on-surface">{space.name}</p>
                    <Badge variant="active">{space.type || 'Workspace'}</Badge>
                  </div>
                  {space.location && (
                    <p className="text-xs text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs text-primary">location_on</span>
                      {space.location}
                    </p>
                  )}
                  <p className="text-xs text-on-surface-variant">Capacity: {space.capacity} Guests</p>
                </div>
              )}

              {/* Breakdown */}
              <div className="space-y-3 text-xs text-on-surface-variant pt-2">
                <div className="flex items-center justify-between">
                  <span>Selected Date:</span>
                  <span className="font-semibold text-on-surface">{form.date}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Time Window:</span>
                  <span className="font-semibold text-on-surface">{form.startTime} – {form.endTime}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Duration:</span>
                  <span className="font-semibold text-on-surface">{hours > 0 ? `${hours} hr${hours !== 1 ? 's' : ''}` : '0 hrs'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Hourly Tariff:</span>
                  <span className="font-semibold text-on-surface">₹{space?.pricePerHour || 0}/hr</span>
                </div>
              </div>

              {/* Total Cost */}
              <div className="pt-4 border-t border-outline-variant/60 flex items-baseline justify-between">
                <div>
                  <p className="text-[10px] uppercase font-bold text-on-surface-variant">Estimated Total</p>
                  <p className="text-xs text-on-surface-variant">Taxes & amenities included</p>
                </div>
                <p className="font-headline text-3xl font-semibold text-primary">₹{totalCost}</p>
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full justify-center text-sm py-3.5"
                  isLoading={submitting}
                  disabled={hours <= 0}
                >
                  <span className="material-symbols-outlined text-lg">check_circle</span>
                  {isAuthenticated ? 'Confirm & Reserve Workspace' : 'Sign In to Reserve'}
                </Button>
              </div>

              <p className="text-[11px] text-center text-on-surface-variant">
                Instant confirmation. Bookings can be cancelled from your member dashboard.
              </p>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
};

export default BookingCheckout;
