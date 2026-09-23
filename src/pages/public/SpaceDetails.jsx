import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import spacesApi from '../../api/spacesApi';
import { unwrapResponse } from '../../api/responseHelpers';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { PageLoader, LoadingSpinner } from '../../components/common/LoadingSpinner';

const spaceImagePool = [
  'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=1200&q=80',
];

const DEFAULT_AMENITIES = [
  { label: 'High-Speed Fiber Wi-Fi', icon: 'wifi' },
  { label: 'Artisanal Coffee & Tea Bar', icon: 'coffee' },
  { label: '24/7 Keycard Access', icon: 'lock' },
  { label: 'Acoustic Soundproofing', icon: 'volume_off' },
  { label: '4K Presentation Display', icon: 'tv' },
  { label: 'Ergonomic Task Chairs', icon: 'chair' },
];

export const SpaceDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin, isAuthenticated } = useAuth();

  const [space, setSpace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Selected date for slot check
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Smart go back handler
  const handleGoBack = () => {
    if (window.history.state && typeof window.history.state.idx === 'number' && window.history.state.idx > 0) {
      navigate(-1);
    } else if (window.history.length > 1) {
      navigate(-1);
    } else if (isAdmin) {
      navigate('/admin/spaces');
    } else {
      navigate('/spaces');
    }
  };

  // Fetch Space Details (with admin fallback for unpublished/inactive spaces)
  const fetchSpace = useCallback(async () => {
    setLoading(true);
    setError('');
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
      const data = unwrapResponse(res);
      setSpace(data);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          'This workspace could not be loaded or does not exist.'
      );
    } finally {
      setLoading(false);
    }
  }, [id, isAdmin]);

  // Fetch Available Slots for selected date
  const fetchSlots = useCallback(async () => {
    if (!id || !selectedDate) return;
    setLoadingSlots(true);
    try {
      const res = await spacesApi.getSlots(id, { date: selectedDate });
      const data = unwrapResponse(res);
      const list = data?.slots || (Array.isArray(data) ? data : []);
      setSlots(list);
    } catch {
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
            {error || 'This space might be inactive or does not exist.'}
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

  const spaceImg =
    space.images && space.images.length > 0
      ? space.images[0]
      : spaceImagePool[Math.abs(space.name?.charCodeAt(0) || 0) % spaceImagePool.length];

  const amenitiesList =
    Array.isArray(space.amenities) && space.amenities.length > 0
      ? space.amenities.map((a) => ({ label: a, icon: 'check_circle' }))
      : DEFAULT_AMENITIES;

  return (
    <div className="min-h-screen bg-background text-on-surface pb-20 page-fade-in">
      {/* ── Breadcrumb & Back Header ────────────────────────────────────────── */}
      <section className="bg-surface-container-lowest border-b border-outline-variant/60 pt-6 pb-6">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex items-center justify-between">
          <Button variant="secondary" size="sm" onClick={handleGoBack}>
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            {isAdmin ? 'Back to Spaces' : 'Back to Workspaces'}
          </Button>
          <div className="flex items-center gap-2 text-xs text-on-surface-variant font-mono">
            <span>#{space.id ? space.id.slice(0, 8).toUpperCase() : 'SPACE'}</span>
            <span>•</span>
            <Badge variant={space.isActive ? 'active' : 'inactive'}>
              {space.isActive ? 'Available' : 'Inactive'}
            </Badge>
            {isAdmin && (
              <Link
                to={`/admin/spaces/${space.id}/edit`}
                className="ml-3 text-xs font-semibold text-primary hover:underline flex items-center gap-1 font-sans"
              >
                <span className="material-symbols-outlined text-[14px]">edit</span>
                Edit Space
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ── Space Banner / Gallery ─────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-6 lg:px-12 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Details & Amenities (8 cols) */}
          <div className="lg:col-span-8 space-y-8">
            {/* Main Picture Card */}
            <div className="relative h-[380px] sm:h-[460px] rounded-3xl overflow-hidden shadow-sm border border-outline-variant/60 bg-surface-container">
              <img
                src={spaceImg}
                alt={space.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 text-white">
                <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold tracking-wider uppercase">
                  {space.type || 'Workspace'}
                </span>
                <h1 className="font-headline text-3xl sm:text-4xl font-bold mt-2 text-white">
                  {space.name}
                </h1>
                <p className="text-xs sm:text-sm text-white/90 mt-1 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base">location_on</span>
                  {space.location || 'Central Floor, Main Hub'}
                </p>
              </div>
            </div>

            {/* Space Description */}
            <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/60 p-6 sm:p-8 space-y-4">
              <h2 className="font-headline text-2xl text-on-surface">About This Workspace</h2>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                {space.description ||
                  'Architectural workspace designed with focus, natural illumination, and premium hospitality in mind. Engineered for discerning remote professionals, executive teams, and growing creative agencies.'}
              </p>

              {/* Specifications */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-outline-variant/40 text-center">
                <div className="p-3 bg-surface-container-low rounded-2xl">
                  <div className="text-[10px] uppercase font-bold text-on-surface-variant">Capacity</div>
                  <div className="font-headline text-xl font-bold text-on-surface mt-1">
                    {space.capacity} {space.capacity === 1 ? 'Desk' : 'Desks'}
                  </div>
                </div>
                <div className="p-3 bg-surface-container-low rounded-2xl">
                  <div className="text-[10px] uppercase font-bold text-on-surface-variant">Rate</div>
                  <div className="font-headline text-xl font-bold text-primary mt-1">
                    ₹{space.pricePerHour}
                    <span className="text-xs font-normal text-on-surface-variant">/hr</span>
                  </div>
                </div>
                <div className="p-3 bg-surface-container-low rounded-2xl">
                  <div className="text-[10px] uppercase font-bold text-on-surface-variant">Access</div>
                  <div className="font-headline text-xl font-bold text-on-surface mt-1">24/7 Pass</div>
                </div>
                <div className="p-3 bg-surface-container-low rounded-2xl">
                  <div className="text-[10px] uppercase font-bold text-on-surface-variant">Category</div>
                  <div className="font-headline text-xl font-bold text-on-surface mt-1 truncate">
                    {space.type || 'Hot Desk'}
                  </div>
                </div>
              </div>
            </div>

            {/* Amenities Grid */}
            <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/60 p-6 sm:p-8 space-y-4">
              <h2 className="font-headline text-2xl text-on-surface">Premium Inclusions & Amenities</h2>
              <p className="text-xs text-on-surface-variant">
                Every reservation includes uninterrupted access to our high-performance facility amenities.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {amenitiesList.map((amenity, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/40"
                  >
                    <span className="material-symbols-outlined text-primary text-xl">
                      {amenity.icon || 'verified'}
                    </span>
                    <span className="text-sm font-medium text-on-surface">
                      {amenity.label || amenity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Reservation Card (4 cols) */}
          <div className="lg:col-span-4 sticky top-28 space-y-6">
            <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant p-6 sm:p-7 shadow-sm space-y-5">
              <div className="flex items-baseline justify-between border-b border-outline-variant/60 pb-4">
                <div>
                  <div className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">
                    Hourly Booking
                  </div>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="font-headline text-3xl font-bold text-primary">
                      ₹{space.pricePerHour}
                    </span>
                    <span className="text-xs text-on-surface-variant font-medium">/ hour</span>
                  </div>
                </div>
                <Badge variant={space.isActive ? 'active' : 'inactive'}>
                  {space.isActive ? 'Instant Book' : 'Unavailable'}
                </Badge>
              </div>

              {/* Date Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                  Select Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface-container-low text-sm text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              {/* Slot Availability Live Preview */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    Availability Schedule
                  </span>
                  {loadingSlots && <LoadingSpinner size="sm" />}
                </div>

                {loadingSlots ? (
                  <div className="p-4 text-center text-xs text-on-surface-variant">
                    Checking live calendar...
                  </div>
                ) : slots.length > 0 ? (
                  <div className="grid grid-cols-3 gap-1.5 max-h-48 overflow-y-auto pr-1">
                    {slots.slice(0, 12).map((slot, idx) => (
                      <div
                        key={idx}
                        className={`p-2 rounded-lg text-center text-[11px] font-mono border ${
                          slot.isAvailable
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-surface-container text-on-surface-variant/50 border-outline-variant line-through'
                        }`}
                      >
                        {slot.startTime?.slice(11, 16) || slot.time || slot}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-surface-container-low rounded-xl text-xs text-on-surface-variant text-center">
                    Flexible availability on this date
                  </div>
                )}
              </div>

              {/* Booking CTA Button */}
              <div className="pt-2 space-y-2.5">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  disabled={!space.isActive}
                  onClick={() =>
                    navigate(`/booking/${space.id}?date=${selectedDate}`)
                  }
                >
                  <span className="material-symbols-outlined text-base">calendar_month</span>
                  Reserve This Workspace
                </Button>

                {!isAuthenticated && (
                  <p className="text-[11px] text-center text-on-surface-variant">
                    You can configure times first — sign in required before final confirmation.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SpaceDetails;
