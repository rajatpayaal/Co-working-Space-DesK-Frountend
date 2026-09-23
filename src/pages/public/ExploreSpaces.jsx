import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import spacesApi from '../../api/spacesApi';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import EmptyState from '../../components/common/EmptyState';
import { SkeletonCard, LoadingSpinner } from '../../components/common/LoadingSpinner';
import { collectionFrom, unwrapResponse } from '../../api/responseHelpers';

const spaceImagePool = [
  'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1568992687947-868a62a9f521?auto=format&fit=crop&w=800&q=80',
];

export const ExploreSpaces = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Filter state initialized from URL params
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get('search') || searchParams.get('q') || searchParams.get('type') || searchParams.get('location') || ''
  );
  const [capacityFilter, setCapacityFilter] = useState(searchParams.get('capacity') || 'all');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);

  // Sync state if URL query params change (e.g. from Landing reservation form or back/forward)
  useEffect(() => {
    const q = searchParams.get('search') || searchParams.get('q') || searchParams.get('type') || searchParams.get('location') || '';
    const cap = searchParams.get('capacity') || 'all';
    const price = searchParams.get('maxPrice') || '';
    setSearchQuery(q);
    setCapacityFilter(cap);
    setMaxPrice(price);
    setCurrentPage(1);
  }, [searchParams]);

  // Data state
  const [spaces, setSpaces] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 9, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Quick Availability Modal state
  const [activeModalSpace, setActiveModalSpace] = useState(null);
  const [checkDate, setCheckDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [dateAvailability, setDateAvailability] = useState(null);
  const [loadingDateAvailability, setLoadingDateAvailability] = useState(false);

  // Range Check state (POST /api/availability/check)
  const [checkStartTime, setCheckStartTime] = useState('09:00');
  const [checkEndTime, setCheckEndTime] = useState('12:00');
  const [checkingSlot, setCheckingSlot] = useState(false);
  const [slotCheckResult, setSlotCheckResult] = useState(null);

  // Build params & fetch spaces from backend
  const fetchSpaces = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: currentPage,
        limit: 9,
        sortBy,
        sortOrder,
      };

      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      if (capacityFilter === 'solo') {
        params.minCapacity = 1;
        params.maxCapacity = 1;
      } else if (capacityFilter === 'team') {
        params.minCapacity = 2;
        params.maxCapacity = 8;
      } else if (capacityFilter === 'conference') {
        params.minCapacity = 9;
        params.maxCapacity = 20;
      } else if (capacityFilter === 'large') {
        params.minCapacity = 21;
      }

      if (maxPrice && Number(maxPrice) > 0) {
        params.maxPrice = Number(maxPrice);
      }

      const res = await spacesApi.getAll(params);
      const data = collectionFrom(res, ['spaces', 'items', 'records']);
      const envelope = unwrapResponse(res);
      const pag = envelope?.pagination || envelope?.meta?.pagination || { total: data.length, page: currentPage, limit: 9, totalPages: 1 };

      setSpaces(data);
      setPagination(pag);
    } catch (err) {
      setError('Unable to load workspaces. Please try again or adjust your filters.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, capacityFilter, maxPrice, sortBy, sortOrder]);

  useEffect(() => {
    fetchSpaces();
  }, [fetchSpaces]);

  // Open availability modal for a space
  const handleOpenAvailabilityModal = async (space) => {
    setActiveModalSpace(space);
    setSlotCheckResult(null);
    await fetchDateAvailability(space.id, checkDate);
  };

  const handleCloseAvailabilityModal = () => {
    setActiveModalSpace(null);
    setDateAvailability(null);
    setSlotCheckResult(null);
  };

  // Fetch space daily schedule: GET /api/spaces/:id/availability
  const fetchDateAvailability = async (spaceId, dateStr) => {
    setLoadingDateAvailability(true);
    try {
      const res = await spacesApi.getAvailability(spaceId, { date: dateStr });
      setDateAvailability(res?.data?.data || null);
    } catch (err) {
      setDateAvailability(null);
    } finally {
      setLoadingDateAvailability(false);
    }
  };

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setCheckDate(newDate);
    setSlotCheckResult(null);
    if (activeModalSpace) {
      fetchDateAvailability(activeModalSpace.id, newDate);
    }
  };

  // Check specific time slot: POST /api/availability/check
  const handleSlotCheck = async (e) => {
    e.preventDefault();
    if (!activeModalSpace || !checkDate || !checkStartTime || !checkEndTime) return;

    setCheckingSlot(true);
    setSlotCheckResult(null);
    try {
      const startDateTime = new Date(`${checkDate}T${checkStartTime}:00.000Z`).toISOString();
      const endDateTime = new Date(`${checkDate}T${checkEndTime}:00.000Z`).toISOString();

      const res = await spacesApi.checkAvailability({
        spaceId: activeModalSpace.id,
        startTime: startDateTime,
        endTime: endDateTime,
      });

      setSlotCheckResult(res?.data?.data || { isAvailable: true });
    } catch (err) {
      setSlotCheckResult({
        isAvailable: false,
        error: 'Unable to verify slot availability right now.',
      });
    } finally {
      setCheckingSlot(false);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setCapacityFilter('all');
    setMaxPrice('');
    setSortBy('createdAt');
    setSortOrder('desc');
    setCurrentPage(1);
    setSearchParams({});
  };

  return (
    <div className="min-h-screen bg-background text-on-surface">
      {/* ── Page Header ────────────────────────────────────────────── */}
      <section className="pt-6 sm:pt-10 pb-8 border-b border-outline-variant/60 bg-surface-container-lowest">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container text-xs font-semibold text-primary uppercase tracking-wider mb-3">
            <span className="material-symbols-outlined text-sm">domain</span>
            Workspace Directory
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="font-headline text-3xl sm:text-4xl text-on-surface font-normal">
                Explore Workspaces
              </h1>
              <p className="text-sm text-on-surface-variant mt-2 max-w-2xl">
                Browse hot desks, acoustic pods, executive boardrooms, and team suites. Check real-time availability and reserve on demand.
              </p>
            </div>
            <div className="text-xs text-on-surface-variant font-medium">
              Showing <span className="text-primary font-semibold">{spaces.length}</span> of {pagination.total} workspaces
            </div>
          </div>
        </div>
      </section>

      {/* ── Search & Filter Controls ────────────────────────────────── */}
      <section className="py-6 bg-surface-container-low border-b border-outline-variant/60 sticky top-20 z-30 backdrop-blur-md bg-surface-container-low/95 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[260px]">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg pointer-events-none">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by workspace name, suite, or amenities..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              )}
            </div>

            {/* Capacity Quick Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
              {[
                { label: 'All', val: 'all' },
                { label: 'Solo (1)', val: 'solo' },
                { label: 'Team (2–8)', val: 'team' },
                { label: 'Conference (9–20)', val: 'conference' },
                { label: 'Large (20+)', val: 'large' },
              ].map((pill) => (
                <button
                  key={pill.val}
                  type="button"
                  onClick={() => {
                    setCapacityFilter(pill.val);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    capacityFilter === pill.val
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'bg-surface-container-lowest border border-outline-variant text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            {/* Sort & Reset */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 bg-surface-container-lowest border border-outline-variant rounded-xl px-2.5 py-1.5">
                <span className="material-symbols-outlined text-sm text-on-surface-variant">sort</span>
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [sb, so] = e.target.value.split('-');
                    setSortBy(sb);
                    setSortOrder(so);
                    setCurrentPage(1);
                  }}
                  className="bg-transparent text-xs font-semibold text-on-surface border-none outline-none cursor-pointer focus:ring-0"
                >
                  <option value="createdAt-desc">Newest Added</option>
                  <option value="pricePerHour-asc">Price: Low to High</option>
                  <option value="pricePerHour-desc">Price: High to Low</option>
                  <option value="capacity-asc">Capacity: Low to High</option>
                  <option value="capacity-desc">Capacity: High to Low</option>
                </select>
              </div>

              {(searchQuery || capacityFilter !== 'all' || maxPrice) && (
                <button
                  onClick={handleResetFilters}
                  className="p-2 rounded-xl text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors"
                  title="Clear all filters"
                >
                  <span className="material-symbols-outlined text-lg">filter_alt_off</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Main Workspaces Grid ───────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-6 lg:px-12 py-12">
        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant p-10 text-center max-w-md mx-auto my-12">
            <div className="w-12 h-12 rounded-full bg-error-container text-error flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-2xl">error_outline</span>
            </div>
            <h3 className="font-headline text-lg font-medium text-on-surface">Unable to Load Spaces</h3>
            <p className="text-xs text-on-surface-variant mt-1.5">{error}</p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-5"
              onClick={fetchSpaces}
            >
              Retry
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && spaces.length === 0 && (
          <EmptyState
            icon="search_off"
            title="No matching workspaces found"
            description="Try modifying your search keywords or removing capacity filters to discover other available spaces."
            action={
              <Button variant="secondary" size="sm" onClick={handleResetFilters}>
                Clear All Filters
              </Button>
            }
          />
        )}

        {/* Spaces Cards */}
        {!loading && !error && spaces.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {spaces.map((space, index) => {
                const spaceImg = spaceImagePool[index % spaceImagePool.length];
                return (
                  <div
                    key={space.id}
                    className="bg-surface-container-lowest rounded-2xl border border-outline-variant/60 overflow-hidden shadow-[0_2px_12px_rgba(58,48,42,0.04)] hover:shadow-[0_8px_24px_rgba(58,48,42,0.08)] transition-all duration-300 flex flex-col group"
                  >
                    {/* Space Image & Header Badges */}
                    <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-surface-container">
                      <img
                        src={spaceImg}
                        alt={space.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute top-3 right-3">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface/90 backdrop-blur-md text-[11px] font-semibold text-on-surface border border-outline-variant/40 shadow-sm">
                          <span className="material-symbols-outlined text-xs text-primary">group</span>
                          {space.capacity} {space.capacity === 1 ? 'Seat' : 'Seats'}
                        </span>
                      </div>
                      {space.isActive && (
                        <div className="absolute top-3 left-3">
                          <Badge variant="active">Available</Badge>
                        </div>
                      )}
                    </div>

                    {/* Space Info */}
                    <div className="p-5 sm:p-6 flex flex-col flex-1">
                      <div className="flex-1">
                        <h3 className="font-headline text-xl font-medium text-on-surface group-hover:text-primary transition-colors line-clamp-1">
                          {space.name}
                        </h3>
                        <p className="text-xs text-on-surface-variant leading-relaxed mt-2 line-clamp-2">
                          {space.description || 'Premium architectural workspace with ergonomic fittings and high-speed fiber internet.'}
                        </p>
                      </div>

                      {/* Amenities Quick Tags */}
                      <div className="flex items-center gap-3 py-3 my-3 border-y border-outline-variant/40 text-xs text-on-surface-variant">
                        <span className="inline-flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm text-primary">wifi</span>
                          Fiber Wi-Fi
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm text-primary">coffee</span>
                          Coffee Bar
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm text-primary">lock</span>
                          24/7 Keycard
                        </span>
                      </div>

                      {/* Pricing & Double Actions */}
                      <div className="flex items-center justify-between pt-1">
                        <div>
                          <div className="text-[10px] uppercase font-semibold text-on-surface-variant tracking-wider">Rate</div>
                          <div className="flex items-baseline gap-1">
                            <span className="font-headline text-2xl font-semibold text-primary">₹{space.pricePerHour}</span>
                            <span className="text-xs text-on-surface-variant font-medium">/hr</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Button 1: Check Availability (Modal using GET & POST availability APIs) */}
                          <button
                            type="button"
                            onClick={() => handleOpenAvailabilityModal(space)}
                            className="p-2 rounded-lg border border-outline-variant text-on-surface-variant hover:text-primary hover:border-primary/40 hover:bg-surface-container transition-colors"
                            title="Check Live Availability"
                          >
                            <span className="material-symbols-outlined text-[18px]">calendar_clock</span>
                          </button>

                          {/* Button 2: View Details -> /spaces/:id */}
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => navigate(`/spaces/${space.id}`)}
                            className="px-3"
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="mt-12 pt-8 border-t border-outline-variant/60 flex items-center justify-between">
                <div className="text-xs text-on-surface-variant">
                  Page <span className="font-semibold text-on-surface">{pagination.page}</span> of {pagination.totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={pagination.page <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  >
                    <span className="material-symbols-outlined text-sm">chevron_left</span>
                    Previous
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                  >
                    Next
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* ── Quick Availability Modal (GET & POST availability) ─────── */}
      <Modal
        isOpen={Boolean(activeModalSpace)}
        onClose={handleCloseAvailabilityModal}
        title={`Live Availability — ${activeModalSpace?.name || ''}`}
        size="lg"
      >
        {activeModalSpace && (
          <div className="space-y-6">
            {/* Header info */}
            <div className="flex items-center justify-between p-3.5 bg-surface-container rounded-2xl border border-outline-variant/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">chair</span>
                </div>
                <div>
                  <div className="text-sm font-semibold text-on-surface">{activeModalSpace.name}</div>
                  <div className="text-xs text-on-surface-variant">Capacity: {activeModalSpace.capacity} Seats • ₹{activeModalSpace.pricePerHour}/hr</div>
                </div>
              </div>
              <Badge variant="active">Active</Badge>
            </div>

            {/* 1. Daily Schedule: GET /api/spaces/:id/availability */}
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1.5 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-primary">calendar_month</span>
                Select Date for Daily Schedule
              </label>
              <input
                type="date"
                value={checkDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={handleDateChange}
                className="w-full px-3.5 py-2 rounded-xl bg-surface-container-low border border-outline-variant text-sm text-on-surface focus:outline-none focus:border-primary"
              />

              {loadingDateAvailability && (
                <div className="py-4 text-center">
                  <LoadingSpinner size="sm" />
                  <span className="text-xs text-on-surface-variant mt-1 inline-block">Checking occupied slots...</span>
                </div>
              )}

              {!loadingDateAvailability && dateAvailability && (
                <div className="mt-3 p-3 bg-surface-container-lowest rounded-xl border border-outline-variant/60 text-xs text-on-surface-variant">
                  <div className="flex items-center justify-between font-medium text-on-surface mb-1">
                    <span>Occupied Windows:</span>
                    <span className="text-primary font-semibold">{dateAvailability.totalOccupiedWindows || 0}</span>
                  </div>
                  {dateAvailability.totalOccupiedWindows === 0 ? (
                    <p className="text-green-700 font-medium">✓ Space is fully open throughout {checkDate}.</p>
                  ) : (
                    <p className="text-amber-800">
                      There are {dateAvailability.totalOccupiedWindows} existing booking/maintenance windows on this date.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* 2. Range Slot Verification: POST /api/availability/check */}
            <form onSubmit={handleSlotCheck} className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant space-y-3">
              <div className="text-xs font-semibold text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-primary">verified</span>
                Verify Specific Time Range
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-on-surface-variant mb-1 font-medium">Start Time (UTC)</label>
                  <input
                    type="time"
                    value={checkStartTime}
                    onChange={(e) => setCheckStartTime(e.target.value)}
                    required
                    className="w-full px-3 py-1.5 rounded-lg bg-surface-container-lowest border border-outline-variant text-xs text-on-surface"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-on-surface-variant mb-1 font-medium">End Time (UTC)</label>
                  <input
                    type="time"
                    value={checkEndTime}
                    onChange={(e) => setCheckEndTime(e.target.value)}
                    required
                    className="w-full px-3 py-1.5 rounded-lg bg-surface-container-lowest border border-outline-variant text-xs text-on-surface"
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="w-full"
                isLoading={checkingSlot}
              >
                Check Slot Range
              </Button>

              {/* Slot check outcome */}
              {slotCheckResult && (
                <div
                  className={`p-3 rounded-xl text-xs font-medium border transition-all ${
                    slotCheckResult.isAvailable
                      ? 'bg-green-50 text-green-800 border-green-200'
                      : 'bg-red-50 text-red-800 border-red-200'
                  }`}
                >
                  {slotCheckResult.isAvailable ? (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm text-green-600">check_circle</span>
                        Slot is available for booking!
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          handleCloseAvailabilityModal();
                          navigate(`/spaces/${activeModalSpace.id}`);
                        }}
                        className="text-xs font-semibold text-primary underline ml-2"
                      >
                        Proceed
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm text-red-600">cancel</span>
                      {slotCheckResult.error || 'This slot overlaps with an existing booking or maintenance schedule.'}
                    </div>
                  )}
                </div>
              )}
            </form>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="secondary" size="sm" onClick={handleCloseAvailabilityModal}>
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  handleCloseAvailabilityModal();
                  navigate(`/spaces/${activeModalSpace.id}`);
                }}
              >
                View Full Details
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ExploreSpaces;
