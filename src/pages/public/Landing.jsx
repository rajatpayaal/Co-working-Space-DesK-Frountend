import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import spacesApi from '../../api/spacesApi';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import { SkeletonCard } from '../../components/common/LoadingSpinner';
import { collectionFrom } from '../../api/responseHelpers';

// Curated architectural photos matching the warm Sahara aesthetic
const spaceImagePool = [
  'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=800&q=80',
];

export const Landing = () => {
  const navigate = useNavigate();
  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Reservation quick filters
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedCapacity, setSelectedCapacity] = useState('all');

  useEffect(() => {
    let isMounted = true;

    const fetchSpaces = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await spacesApi.getAll({ limit: 6 });
        // Envelope: { status: 'success', data: { spaces: [...], pagination: {...} } }
        if (isMounted) {
          setSpaces(collectionFrom(response, ['spaces', 'items', 'records']));
        }
      } catch (err) {
        if (isMounted) {
          setError('Unable to load workspaces right now. Please check back shortly.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchSpaces();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    navigate('/spaces');
  };

  return (
    <div className="min-h-screen bg-background text-on-surface">
      {/* ── 1. Hero Section ────────────────────────────────────────── */}
      <section className="relative pt-6 sm:pt-10 pb-16 lg:pt-12 lg:pb-24 overflow-hidden">
        {/* Subtle decorative warm background radial gradient */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-primary-fixed/25 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-6 lg:px-12 text-center">
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface-container border border-outline-variant/60 text-xs font-semibold tracking-wide text-on-surface-variant uppercase mb-6 shadow-sm">
            <span className="material-symbols-outlined text-sm text-primary">workspace_premium</span>
            <span>Boutique Coworking & Private Suites • Central Business District</span>
          </div>

          {/* Hero Headline */}
          <h1 className="font-headline text-4xl sm:text-5xl lg:text-6xl text-on-surface font-normal leading-[1.12] tracking-tight max-w-4xl mx-auto">
            Work Where Focus Meets Warm Architectural Elegance.
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-on-surface-variant max-w-2xl mx-auto font-normal leading-relaxed mt-5">
            Thoughtfully curated workspaces built for creators, remote teams, and ambitious founders. Flexible day passes, dedicated desks, and executive suites on demand.
          </p>

          {/* ── Interactive Reservation Bar (Desktop & Mobile) ────────── */}
          <form
            onSubmit={handleSearchSubmit}
            className="mt-10 max-w-5xl mx-auto bg-surface-container-lowest/95 backdrop-blur-md rounded-2xl border border-outline-variant/70 p-3 shadow-[0_12px_36px_rgba(58,48,42,0.06)] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-center text-left"
          >
            {/* Field 1: Location */}
            <div className="px-3 py-2 rounded-xl hover:bg-surface-container-low transition-colors">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm text-primary">location_on</span>
                Location
              </label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full bg-transparent text-sm font-medium text-on-surface border-none outline-none cursor-pointer p-0 focus:ring-0"
              >
                <option value="all">Downtown Campus • Floor 4</option>
                <option value="cbd">Central Business District</option>
                <option value="financial">Financial Quarter Suite</option>
              </select>
            </div>

            {/* Field 2: Space Type */}
            <div className="px-3 py-2 rounded-xl hover:bg-surface-container-low transition-colors">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm text-primary">chair</span>
                Workspace
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full bg-transparent text-sm font-medium text-on-surface border-none outline-none cursor-pointer p-0 focus:ring-0"
              >
                <option value="all">All Space Types</option>
                <option value="hot_desk">Hot Desk / Day Pass</option>
                <option value="dedicated">Dedicated Station</option>
                <option value="meeting">Executive Conference</option>
                <option value="office">Private Suite</option>
              </select>
            </div>

            {/* Field 3: Capacity */}
            <div className="px-3 py-2 rounded-xl hover:bg-surface-container-low transition-colors">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm text-primary">group</span>
                Team Size
              </label>
              <select
                value={selectedCapacity}
                onChange={(e) => setSelectedCapacity(e.target.value)}
                className="w-full bg-transparent text-sm font-medium text-on-surface border-none outline-none cursor-pointer p-0 focus:ring-0"
              >
                <option value="all">1 - 4 Members</option>
                <option value="solo">Solo Professional (1)</option>
                <option value="team">Small Team (2 - 8)</option>
                <option value="large">Large Team (8 - 25)</option>
              </select>
            </div>

            {/* Submit CTA */}
            <div className="p-1">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full shadow-md hover:shadow-lg transition-all"
              >
                <span className="material-symbols-outlined text-lg">search</span>
                Check Availability
              </Button>
            </div>
          </form>

          {/* ── Editorial Photo Grid ─────────────────────────────────── */}
          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto text-left">
            <div className="relative rounded-2xl overflow-hidden shadow-sm border border-outline-variant/60 group h-64 sm:h-72">
              <img
                src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80"
                alt="The Grand Atrium"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/20 backdrop-blur-md mb-1.5 inline-block">
                  Levels 1 – 3
                </span>
                <h4 className="font-headline text-lg font-medium text-white">The Grand Atrium</h4>
                <p className="text-xs text-white/80 line-clamp-1">Natural daylight, biophilic accents, and open hot desks.</p>
              </div>
            </div>

            <div className="relative rounded-2xl overflow-hidden shadow-sm border border-outline-variant/60 group h-64 sm:h-72">
              <img
                src="https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=80"
                alt="Acoustic Isolation Suites"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/20 backdrop-blur-md mb-1.5 inline-block">
                  Quiet Pods
                </span>
                <h4 className="font-headline text-lg font-medium text-white">Acoustic Isolation Suites</h4>
                <p className="text-xs text-white/80 line-clamp-1">Sound-dampened pods engineered for video conferences.</p>
              </div>
            </div>

            <div className="relative rounded-2xl overflow-hidden shadow-sm border border-outline-variant/60 group h-64 sm:h-72">
              <img
                src="https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80"
                alt="Single-Origin Roastery"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/20 backdrop-blur-md mb-1.5 inline-block">
                  Social Lounge
                </span>
                <h4 className="font-headline text-lg font-medium text-white">Artisan Roastery Bar</h4>
                <p className="text-xs text-white/80 line-clamp-1">Complimentary pour-overs, nitro cold brew, and herbal teas.</p>
              </div>
            </div>
          </div>

          {/* ── Spatial Telemetry Metrics ───────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 max-w-5xl mx-auto mt-14 pt-10 border-t border-outline-variant/50">
            <div className="p-4 rounded-xl bg-surface-container-lowest/70 border border-outline-variant/40 text-center">
              <div className="font-headline text-3xl sm:text-4xl font-semibold text-primary">128</div>
              <div className="text-xs text-on-surface-variant mt-1 font-medium">Bookable Units</div>
            </div>
            <div className="p-4 rounded-xl bg-surface-container-lowest/70 border border-outline-variant/40 text-center">
              <div className="font-headline text-3xl sm:text-4xl font-semibold text-primary">842</div>
              <div className="text-xs text-on-surface-variant mt-1 font-medium">Ecosystem Teams</div>
            </div>
            <div className="p-4 rounded-xl bg-surface-container-lowest/70 border border-outline-variant/40 text-center">
              <div className="font-headline text-3xl sm:text-4xl font-semibold text-primary">940 Mbps</div>
              <div className="text-xs text-on-surface-variant mt-1 font-medium">Dedicated Bandwidth</div>
            </div>
            <div className="p-4 rounded-xl bg-surface-container-lowest/70 border border-outline-variant/40 text-center">
              <div className="font-headline text-3xl sm:text-4xl font-semibold text-primary">4 Min</div>
              <div className="text-xs text-on-surface-variant mt-1 font-medium">Fast-Pass Check-in</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. Featured Spaces Section (Integrated with GET /api/spaces) ── */}
      <section className="py-16 lg:py-24 bg-surface-container-low border-y border-outline-variant/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary mb-2">
                <span className="material-symbols-outlined text-sm">domain</span>
                Available Workspaces
              </div>
              <h2 className="font-headline text-3xl sm:text-4xl text-on-surface font-normal">
                Crafted for Every Work Style
              </h2>
              <p className="text-sm text-on-surface-variant mt-2 max-w-xl">
                Reserve by the hour or by the month. Seamless high-speed access included with every booking.
              </p>
            </div>
            <Link to="/spaces" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary-hover transition-colors">
              View All Workspaces
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </Link>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-8 text-center max-w-lg mx-auto">
              <div className="w-12 h-12 rounded-full bg-error-container text-error flex items-center justify-center mx-auto mb-3">
                <span className="material-symbols-outlined text-2xl">error_outline</span>
              </div>
              <h3 className="font-headline text-lg font-medium text-on-surface">Temporarily Unavailable</h3>
              <p className="text-xs text-on-surface-variant mt-1.5">{error}</p>
              <Button
                variant="secondary"
                size="sm"
                className="mt-4"
                onClick={() => window.location.reload()}
              >
                Try Again
              </Button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && spaces.length === 0 && (
            <EmptyState
              icon="desk"
              title="No spaces available"
              description="New workspace suites are being prepared. Please check back shortly or explore our upcoming locations."
              action={
                <Link to="/spaces">
                  <Button variant="secondary" size="sm">Explore Other Spaces</Button>
                </Link>
              }
            />
          )}

          {/* Spaces Grid (Real API Response Data) */}
          {!loading && !error && spaces.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {spaces.map((space, index) => {
                const spaceImg = spaceImagePool[index % spaceImagePool.length];
                return (
                  <div
                    key={space.id}
                    className="bg-surface-container-lowest rounded-2xl border border-outline-variant/60 overflow-hidden shadow-[0_2px_12px_rgba(58,48,42,0.04)] hover:shadow-[0_8px_24px_rgba(58,48,42,0.08)] transition-all duration-300 flex flex-col group"
                  >
                    {/* Space Image & Capacity Pill */}
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

                    {/* Card Content */}
                    <div className="p-5 sm:p-6 flex flex-col flex-1">
                      <div className="flex-1">
                        <h3 className="font-headline text-xl font-medium text-on-surface group-hover:text-primary transition-colors line-clamp-1">
                          {space.name}
                        </h3>
                        <p className="text-xs text-on-surface-variant leading-relaxed mt-2 line-clamp-2">
                          {space.description || 'Architectural workspace engineered with ergonomic workstations and high-speed fiber internet.'}
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
                          Artisan Coffee
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm text-primary">lock</span>
                          24/7 Access
                        </span>
                      </div>

                      {/* Price & Action */}
                      <div className="flex items-center justify-between pt-1">
                        <div>
                          <div className="text-[10px] uppercase font-semibold text-on-surface-variant tracking-wider">Rate</div>
                          <div className="flex items-baseline gap-1">
                            <span className="font-headline text-2xl font-semibold text-primary">₹{space.pricePerHour}</span>
                            <span className="text-xs text-on-surface-variant font-medium">/hr</span>
                          </div>
                        </div>

                        {/* View Details navigates to /spaces/:id without individual API calls */}
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => navigate(`/spaces/${space.id}`)}
                          className="px-4"
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── 3. Artisanal Perks & Amenities ─────────────────────────── */}
      <section id="amenities" className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary mb-2">
              <span className="material-symbols-outlined text-sm">stars</span>
              Refined Workspace Amenities
            </div>
            <h2 className="font-headline text-3xl sm:text-4xl text-on-surface font-normal">
              Engineered for Uninterrupted Focus
            </h2>
            <p className="text-sm text-on-surface-variant mt-3 leading-relaxed">
              Every detail is calibrated to support your deepest work — from acoustic isolation to bespoke ergonomic fittings.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/60 shadow-sm hover:border-primary/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-2xl">speed</span>
              </div>
              <h3 className="font-headline text-lg font-medium text-on-surface">1 Gbps Dedicated Fiber</h3>
              <p className="text-xs text-on-surface-variant mt-2 leading-relaxed">
                Low-latency, dual-redundant enterprise fiber networking with isolated guest Wi-Fi and hardwired LAN jacks.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/60 shadow-sm hover:border-primary/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-2xl">coffee</span>
              </div>
              <h3 className="font-headline text-lg font-medium text-on-surface">Single-Origin Roastery</h3>
              <p className="text-xs text-on-surface-variant mt-2 leading-relaxed">
                Unlimited specialty espresso, seasonal pour-overs, organic loose-leaf teas, and chilled sparkling water.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/60 shadow-sm hover:border-primary/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-2xl">graphic_eq</span>
              </div>
              <h3 className="font-headline text-lg font-medium text-on-surface">Acoustic Isolation Booths</h3>
              <p className="text-xs text-on-surface-variant mt-2 leading-relaxed">
                Sound-absorbing micro-architectural phone pods engineered for crystal-clear video conferences and calls.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/60 shadow-sm hover:border-primary/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-2xl">chair</span>
              </div>
              <h3 className="font-headline text-lg font-medium text-on-surface">Ergonomic Architecture</h3>
              <p className="text-xs text-on-surface-variant mt-2 leading-relaxed">
                Herman Miller Aeron seating, motorized standing desks, and circadian daylight balance lighting.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/60 shadow-sm hover:border-primary/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-2xl">tv_gen</span>
              </div>
              <h3 className="font-headline text-lg font-medium text-on-surface">Executive Presentation Tech</h3>
              <p className="text-xs text-on-surface-variant mt-2 leading-relaxed">
                4K HDR wireless projection, directional mic arrays, and smart glass privacy walls in all conference suites.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/60 shadow-sm hover:border-primary/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-2xl">verified_user</span>
              </div>
              <h3 className="font-headline text-lg font-medium text-on-surface">Concierge & Mail Support</h3>
              <p className="text-xs text-on-surface-variant mt-2 leading-relaxed">
                Front-desk reception, commercial business address services, secure parcel lockers, and dry-cleaning drop-off.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. Membership Tiers ────────────────────────────────────── */}
      <section id="pricing" className="py-20 bg-surface-container-low border-t border-outline-variant/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary mb-2">
              <span className="material-symbols-outlined text-sm">payments</span>
              Transparent Memberships
            </div>
            <h2 className="font-headline text-3xl sm:text-4xl text-on-surface font-normal">
              Flexible Plans with No Long-Term Leases
            </h2>
            <p className="text-sm text-on-surface-variant mt-3 leading-relaxed">
              Scale your workspace as your organization grows. Transparent pricing with all amenities included.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Tier 1 */}
            <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/60 flex flex-col justify-between">
              <div>
                <h4 className="font-headline text-lg font-semibold text-on-surface">Day Pass</h4>
                <p className="text-xs text-on-surface-variant mt-1">Single day flex access</p>
                <div className="mt-4 mb-6">
                  <span className="font-headline text-3xl font-semibold text-primary">₹500</span>
                  <span className="text-xs text-on-surface-variant"> / day</span>
                </div>
                <ul className="space-y-2 text-xs text-on-surface-variant">
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-primary">check</span>
                    Any open hot desk
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-primary">check</span>
                    High-speed Wi-Fi
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-primary">check</span>
                    Coffee & beverage bar
                  </li>
                </ul>
              </div>
              <Link to="/spaces" className="mt-6">
                <Button variant="secondary" size="sm" className="w-full">Reserve Pass</Button>
              </Link>
            </div>

            {/* Tier 2 (Highlighted) */}
            <div className="p-6 rounded-2xl bg-surface-container-lowest border-2 border-primary relative flex flex-col justify-between shadow-md">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary text-on-primary text-[10px] font-bold uppercase tracking-wider">
                Most Popular
              </div>
              <div>
                <h4 className="font-headline text-lg font-semibold text-on-surface">Dedicated Desk</h4>
                <p className="text-xs text-on-surface-variant mt-1">Your own assigned station</p>
                <div className="mt-4 mb-6">
                  <span className="font-headline text-3xl font-semibold text-primary">₹6,500</span>
                  <span className="text-xs text-on-surface-variant"> / mo</span>
                </div>
                <ul className="space-y-2 text-xs text-on-surface-variant">
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-primary">check</span>
                    Permanent ergonomic desk
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-primary">check</span>
                    Lockable storage cabinet
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-primary">check</span>
                    5 hrs conference credits
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-primary">check</span>
                    24/7 keycard access
                  </li>
                </ul>
              </div>
              <Link to="/spaces" className="mt-6">
                <Button variant="primary" size="sm" className="w-full">Choose Desk</Button>
              </Link>
            </div>

            {/* Tier 3 */}
            <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/60 flex flex-col justify-between">
              <div>
                <h4 className="font-headline text-lg font-semibold text-on-surface">Meeting Suite</h4>
                <p className="text-xs text-on-surface-variant mt-1">Hourly boardroom reservation</p>
                <div className="mt-4 mb-6">
                  <span className="font-headline text-3xl font-semibold text-primary">₹750</span>
                  <span className="text-xs text-on-surface-variant"> / hr</span>
                </div>
                <ul className="space-y-2 text-xs text-on-surface-variant">
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-primary">check</span>
                    Seats up to 12 people
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-primary">check</span>
                    4K wireless presentation
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-primary">check</span>
                    Hospitality catering option
                  </li>
                </ul>
              </div>
              <Link to="/spaces" className="mt-6">
                <Button variant="secondary" size="sm" className="w-full">Book Room</Button>
              </Link>
            </div>

            {/* Tier 4 */}
            <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/60 flex flex-col justify-between">
              <div>
                <h4 className="font-headline text-lg font-semibold text-on-surface">Private Office</h4>
                <p className="text-xs text-on-surface-variant mt-1">Enclosed suite for 4-20 teams</p>
                <div className="mt-4 mb-6">
                  <span className="font-headline text-3xl font-semibold text-primary">₹28,000</span>
                  <span className="text-xs text-on-surface-variant"> / mo</span>
                </div>
                <ul className="space-y-2 text-xs text-on-surface-variant">
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-primary">check</span>
                    Acoustic soundproofing
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-primary">check</span>
                    Custom company branding
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-primary">check</span>
                    Private enterprise LAN
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-primary">check</span>
                    Dedicated daily cleaning
                  </li>
                </ul>
              </div>
              <Link to="/register" className="mt-6">
                <Button variant="secondary" size="sm" className="w-full">Inquire Office</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. Final Call-to-Action Banner ─────────────────────────── */}
      <section className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="rounded-3xl bg-inverse-surface text-inverse-on-surface p-10 sm:p-16 relative overflow-hidden shadow-xl">
            <div className="relative z-10 max-w-2xl">
              <h2 className="font-headline text-3xl sm:text-5xl font-normal leading-tight">
                Ready to elevate your daily workspace routine?
              </h2>
              <p className="text-sm sm:text-base text-inverse-on-surface/80 mt-4 leading-relaxed font-normal">
                Schedule a complimentary guided tour, test out our acoustic pods, and savor a cup of single-origin roast on us.
              </p>
              <div className="flex flex-wrap gap-4 mt-8">
                <Link to="/spaces">
                  <Button variant="primary" size="lg" className="shadow-md">
                    Reserve Your Space
                  </Button>
                </Link>
                <Link to="/register">
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-outline text-inverse-on-surface hover:bg-surface/10"
                  >
                    Join Membership
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. Global Footer ────────────────────────────────────────── */}
      <footer className="bg-surface-container border-t border-outline-variant/60 py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-lg">bolt</span>
            </div>
            <span className="font-headline text-lg font-bold text-on-surface">CoWork Spot</span>
            <span className="text-xs text-on-surface-variant ml-2">© {new Date().getFullYear()} CoWork Spot Inc. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6 text-xs text-on-surface-variant font-medium">
            <Link to="/spaces" className="hover:text-primary transition-colors">Spaces</Link>
            <Link to="/login" className="hover:text-primary transition-colors">Sign In</Link>
            <Link to="/register" className="hover:text-primary transition-colors">Membership</Link>
            <a href="#privacy" className="hover:text-primary transition-colors">Privacy</a>
            <a href="#terms" className="hover:text-primary transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
