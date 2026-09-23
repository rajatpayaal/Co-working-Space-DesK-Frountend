import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import spacesApi from '../../api/spacesApi';
import { unwrapResponse } from '../../api/responseHelpers';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import { PageLoader } from '../../components/common/LoadingSpinner';

const spaceImagePool = [
  'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=1200&q=80',
];

const DEFAULT_AMENITIES = [
  { label: 'High-Speed Fiber Wi-Fi', icon: 'wifi' },
  { label: '24/7 Keycard Access', icon: 'lock' },
  { label: 'Artisanal Coffee & Tea', icon: 'coffee' },
  { label: 'Ergonomic Task Seating', icon: 'chair' },
  { label: 'Power & USB at Every Desk', icon: 'power' },
  { label: 'Quiet Acoustic Zone', icon: 'volume_off' },
];

export const SpaceDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [space, setSpace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Selected date for slot checking
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Fetch Space Details
  const fetchSpace = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await spacesApi.getById(id);
      const data = unwrapResponse(res);
      setSpace(data);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Unable to load workspace details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Fetch Available Slots for selected date
  const fetchSlots = useCallback(async () => {
    if (!id || !selectedDate) return;
    setLoadingSlots(true);
    try {
      const res = await spacesApi.getSlots(id, { date: selectedDate });
      const data = unwrapResponse(res);
      const list = data?.slots || (Array.isArray(data) ? data : []);
      setSlots(list);
    } catch (err) {
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, [id, selectedDate]);

  useEffect(() => {
    fetchSpace();
  }, [fetchSpace]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  if (loading) {
    return <PageLoader message="Loading workspace details..." />;
  }

  if (error || !space) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20">
        <Link to="/spaces">
          <Button variant="secondary" size="sm" className="mb-6">
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Back to Workspaces
          </Button>
        </Link>
        <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant p-10 text-center">
          <div className="w-14 h-14 rounded-full bg-error/10 text-error flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-3xl">error_outline</span>
          </div>
          <h2 className="font-headline text-2xl text-on-surface">Workspace Not Found</h2>
          <p className="text-sm text-on-surface-variant mt-2 max-w-md mx-auto">{error || 'This space might be inactive or does not exist.'}</p>
          <Button variant="primary" size="md" className="mt-6" onClick={fetchSpace}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const spaceImg = space.images && space.images.length > 0
    ? space.images[0]
    : spaceImagePool[Math.abs(space.name.charCodeAt(0) || 0) % spaceImagePool.length];

  const amenitiesList = Array.isArray(space.amenities) && space.amenities.length > 0
    ? space.amenities.map((a) => ({ label: a, icon: 'check_circle' }))
    : DEFAULT_AMENITIES;

  return (
    <div className="min-h-screen bg-background text-on-surface pb-20">
      {/* ── Breadcrumb & Back Header ────────────────────────────────────────── */}
      <section className="bg-surface-container-lowest border-b border-outline-variant/60 pt-6 pb-6">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex items-center justify-between">
          <Link to="/spaces">
            <Button variant="secondary" size="sm">
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              Back to Workspaces
            </Button>
          </Link>
          <div className="flex items-center gap-2 text-xs text-on-surface-variant font-mono">
            <span>#{space.id.slice(0, 8).toUpperCase()}</span>
            <span>•</span>
            <Badge variant={space.isActive ? 'active' : 'inactive'}>
              {space.isActive ? 'Available' : 'Inactive'}
            </Badge>
          </div>
        </div>
      </section>

      {/* ── Hero Gallery ────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 pt-8">
        <div className="relative h-[320px] sm:h-[420px] md:h-[480px] w-full rounded-3xl overflow-hidden shadow-sm border border-outline-variant/60">
          <img
            src={spaceImg}
            alt={space.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4 text-white">
            <div>
              {space.type && (
                <span className="inline-block px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold uppercase tracking-wider mb-2">
                  {space.type}
                </span>
              )}
              <h1 className="font-headline text-3xl sm:text-5xl font-medium tracking-tight">
                {space.name}
              </h1>
              {space.location && (
                <p className="flex items-center gap-1.5 text-sm sm:text-base text-white/90 mt-2">
                  <span className="material-symbols-outlined text-base text-primary-fixed">location_on</span>
                  {space.location}
                </p>
              )}
            </div>
            <div className="bg-surface/90 backdrop-blur-md text-on-surface px-5 py-3 rounded-2xl border border-outline-variant/40 shadow-lg">
              <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Hourly Rate</p>
              <p className="font-headline text-3xl font-semibold text-primary">
                ₹{space.pricePerHour}
                <span className="text-xs font-sans text-on-surface-variant font-medium"> / hour</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Main Layout: Content & Booking Box ──────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-6 lg:px-12 pt-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column (8 cols): Details, Amenities, Live Slots */}
        <div className="lg:col-span-8 space-y-10">
          {/* Key Specs Card */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 bg-surface-container-lowest rounded-2xl border border-outline-variant/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-xl">group</span>
              </div>
              <div>
                <p className="text-[11px] text-on-surface-variant uppercase font-semibold">Capacity</p>
                <p className="text-sm font-bold text-on-surface">{space.capacity} {space.capacity === 1 ? 'Person' : 'People'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-xl">payments</span>
              </div>
              <div>
                <p className="text-[11px] text-on-surface-variant uppercase font-semibold">Pricing</p>
                <p className="text-sm font-bold text-on-surface">₹{space.pricePerHour}/hr</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-xl">category</span>
              </div>
              <div>
                <p className="text-[11px] text-on-surface-variant uppercase font-semibold">Type</p>
                <p className="text-sm font-bold text-on-surface">{space.type || 'Workspace'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-xl">verified</span>
              </div>
              <div>
                <p className="text-[11px] text-on-surface-variant uppercase font-semibold">Status</p>
                <p className="text-sm font-bold text-on-surface">{space.isActive ? 'Active' : 'Unavailable'}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/60 p-6 sm:p-8">
            <h2 className="font-headline text-2xl text-on-surface font-medium mb-3">About This Workspace</h2>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              {space.description || 'A thoughtfully designed workspace with natural lighting, ergonomic furnishings, high-speed fiber internet, and seamless access to communal amenities. Perfect for focused individual sprints, creative brainstorms, or executive meetings.'}
            </p>
          </div>

          {/* Amenities Grid */}
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/60 p-6 sm:p-8">
            <h2 className="font-headline text-2xl text-on-surface font-medium mb-4">Included Amenities</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {amenitiesList.map((item, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-low border border-outline-variant/40">
                  <span className="material-symbols-outlined text-lg text-primary">{item.icon}</span>
                  <span className="text-xs font-semibold text-on-surface">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Live Schedule & Slots */}
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/60 p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="font-headline text-2xl text-on-surface font-medium">Daily Schedule & Availability</h2>
                <p className="text-xs text-on-surface-variant mt-1">Select a calendar date to check open booking slots in real time.</p>
              </div>
              <input
                type="date"
                value={selectedDate}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3.5 py-2 rounded-xl bg-surface-container-low border border-outline-variant text-xs text-on-surface outline-none focus:border-primary font-medium"
              />
            </div>

            {loadingSlots && (
              <div className="py-12 text-center text-xs text-on-surface-variant">
                <span className="material-symbols-outlined text-2xl text-primary animate-spin mb-2">progress_activity</span>
                <p>Loading real-time availability...</p>
              </div>
            )}

            {!loadingSlots && slots.length === 0 && (
              <div className="p-6 text-center rounded-xl bg-surface-container-low border border-outline-variant/40">
                <span className="material-symbols-outlined text-3xl text-on-surface-variant mb-2">event_available</span>
                <p className="text-sm font-semibold text-on-surface">Available for full day reservation</p>
                <p className="text-xs text-on-surface-variant mt-1">No blocking conflicts or maintenance windows recorded for {selectedDate}.</p>
              </div>
            )}

            {!loadingSlots && slots.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {slots.map((slot, index) => {
                  const isAvailable = slot.isAvailable !== false && slot.available !== false;
                  return (
                    <div
                      key={index}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        isAvailable
                          ? 'bg-green-50/60 border-green-200 text-green-900'
                          : 'bg-surface-container border-outline-variant/60 text-on-surface-variant/60 opacity-60'
                      }`}
                    >
                      <p className="font-mono text-xs font-bold">
                        {slot.startTime || slot.start} – {slot.endTime || slot.end}
                      </p>
                      <p className="text-[10px] uppercase font-semibold mt-1">
                        {isAvailable ? '✓ Open' : '✕ Reserved'}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (4 cols): Sticky Booking Card */}
        <div className="lg:col-span-4">
          <div className="sticky top-28 bg-surface-container-lowest rounded-3xl border border-outline-variant p-6 sm:p-7 shadow-sm space-y-6">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Reserve This Workspace</p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="font-headline text-4xl font-semibold text-primary">₹{space.pricePerHour}</span>
                <span className="text-xs font-semibold text-on-surface-variant">/ hour</span>
              </div>
            </div>

            <div className="space-y-3 pt-3 border-t border-outline-variant/60 text-xs">
              <div className="flex items-center justify-between text-on-surface-variant">
                <span>Workspace:</span>
                <span className="font-semibold text-on-surface">{space.name}</span>
              </div>
              <div className="flex items-center justify-between text-on-surface-variant">
                <span>Selected Date:</span>
                <span className="font-semibold text-on-surface">{selectedDate}</span>
              </div>
              <div className="flex items-center justify-between text-on-surface-variant">
                <span>Maximum Capacity:</span>
                <span className="font-semibold text-on-surface">{space.capacity} Guests</span>
              </div>
              <div className="flex items-center justify-between text-on-surface-variant">
                <span>Instant Confirmation:</span>
                <span className="font-semibold text-green-700">✓ Real-time Guard</span>
              </div>
            </div>

            <div className="pt-2">
              <Button
                variant="primary"
                size="lg"
                className="w-full justify-center text-sm py-3.5"
                disabled={!space.isActive}
                onClick={() => navigate(`/booking/${space.id}?date=${selectedDate}`)}
              >
                <span className="material-symbols-outlined text-lg">event_available</span>
                {space.isActive ? 'Proceed to Booking' : 'Space Currently Unavailable'}
              </Button>
            </div>

            <div className="rounded-xl bg-surface-container-low p-4 text-[11px] text-on-surface-variant leading-relaxed">
              <p className="font-semibold text-on-surface mb-1">Flexibility Guaranteed</p>
              Cancellations permitted prior to reservation start time. Zero setup fees or membership subscriptions required.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SpaceDetails;
