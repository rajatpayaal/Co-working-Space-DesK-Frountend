import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import adminApi from '../../api/adminApi'; // kept — available for future use
import { collectionFrom } from '../../api/responseHelpers';
import spacesApi from '../../api/spacesApi';
import bookingsApi from '../../api/bookingsApi';

export const Dashboard = () => {
  const [stats, setStats] = useState({});
  const [bookings, setBookings] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    Promise.all([
      spacesApi.getAll({ limit: 100 }),
      bookingsApi.getAdminAll({ limit: 100 }),
    ])
      .then(([spacesResponse, bookingsResponse]) => {
        if (!active) return;

        const spaces = collectionFrom(spacesResponse, ['spaces', 'items', 'records', 'data']);
        const bookingRows = collectionFrom(bookingsResponse, ['bookings', 'items', 'records', 'data']);

        const pending = bookingRows.filter(
          (b) => String(b.status).toUpperCase() === 'PENDING'
        ).length;
        const approved = bookingRows.filter(
          (b) => String(b.status).toUpperCase() === 'APPROVED'
        ).length;
        const cancelled = bookingRows.filter(
          (b) => String(b.status).toUpperCase() === 'CANCELLED'
        ).length;

        // Derive total revenue from bookings that have an `amount` / `totalAmount` / `price` field
        const totalRevenue = bookingRows.reduce((sum, b) => {
          const amt = Number(b.totalAmount ?? b.amount ?? b.price ?? 0);
          return sum + (isNaN(amt) ? 0 : amt);
        }, 0);

        setBookings(bookingRows.slice(0, 5));
        setStats({
          totalSpaces: spaces.length,
          totalBookings: bookingRows.length,
          pendingBookings: pending,
          approvedBookings: approved,
          cancelledBookings: cancelled,
          totalRevenue,
          // totalUsers and maintenanceCount are not available from these endpoints;
          // they will display '—' intentionally until a dedicated endpoint is wired up.
        });
        setActivity([]); // No activity-log endpoint available yet
      })
      .catch((e) => {
        if (active) {
          setError(e?.response?.data?.message || 'Unable to load dashboard data.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  /**
   * Look up a value from `stats` by one or more candidate keys (camelCase or snake_case).
   * Returns the first truthy match, or '—' if none found.
   */
  const value = (...keys) => {
    // Build a normalised camelCase index over the stats object
    const normalized = Object.fromEntries(
      Object.entries(stats).map(([k, v]) => [
        k.replace(/[-_](.)/g, (_, char) => char.toUpperCase()),
        v,
      ])
    );
    const found = keys
      .map((key) => stats[key] ?? normalized[key])
      .find((v) => v !== undefined && v !== null);
    return found ?? '—';
  };

  const cards = [
    ['apartment',       'Total Spaces',       value('totalSpaces', 'spaces'),             'Inventory availability',    false],
    ['group',           'Total Users',         value('totalUsers', 'users'),               'Registered members',        false],
    ['event_available', 'Total Bookings',      value('totalBookings', 'bookings'),         'Across all workspaces',     false],
    ['pending_actions', 'Pending Bookings',    value('pendingBookings', 'pending'),        'Needs review',              true ],
    ['task_alt',        'Approved Bookings',   value('approvedBookings', 'approved'),      'Confirmed reservations',    false],
    ['event_busy',      'Cancelled Bookings',  value('cancelledBookings', 'cancelled'),    'Cancelled reservations',    false],
    ['payments',        'Total Revenue',       `₹${value('totalRevenue', 'revenue')}`,     'Gross booking revenue',     true ],
    ['build',           'Maintenance Windows', value('maintenanceCount', 'maintenance'),   'Active service blocks',     false],
  ];

  return (
    <div className="w-full px-5 md:px-8 py-8 max-w-[1600px] mx-auto space-y-8">
      {/* ── Header banner ── */}
      <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 flex flex-col md:flex-row gap-5 justify-between">
        <div>
          <p className="text-[11px] uppercase font-semibold tracking-widest text-primary">
            Platform operations
          </p>
          <h1 className="font-headline text-3xl text-on-surface mt-1">System Overview</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Monitor booking activity, availability, and platform performance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs font-mono text-on-surface-variant">LIVE · UTC+00:00</span>
        </div>
      </section>

      {/* ── Error banner ── */}
      {error && (
        <p className="rounded-lg bg-error-container p-3 text-sm text-error">{error}</p>
      )}

      {/* ── Stat cards ── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map(([icon, label, number, detail, accent]) => (
          <div
            key={label}
            className={`rounded-xl border p-5 bg-surface-container-lowest ${
              accent ? 'border-primary/40' : 'border-outline-variant'
            }`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`material-symbols-outlined ${
                  accent ? 'text-primary' : 'text-on-surface-variant'
                }`}
              >
                {icon}
              </span>
              <span className="text-[10px] text-on-surface-variant">
                {loading ? 'Loading…' : 'Live data'}
              </span>
            </div>
            <p
              className={`text-[11px] font-semibold uppercase tracking-wider mt-5 ${
                accent ? 'text-primary' : 'text-on-surface-variant'
              }`}
            >
              {label}
            </p>
            <p className="font-headline text-4xl text-on-surface mt-1">
              {loading ? '…' : number}
            </p>
            <p className="text-[11px] text-on-surface-variant mt-2">{detail}</p>
          </div>
        ))}
      </section>

      {/* ── Charts row ── */}
      <section className="grid xl:grid-cols-12 gap-6">
        {/* Booking Trends (hardcoded bars — no trends endpoint yet) */}
        <div className="xl:col-span-7 rounded-xl border border-outline-variant bg-surface-container-lowest p-6">
          <div className="flex justify-between">
            <div>
              <p className="text-[11px] uppercase font-semibold tracking-widest text-primary">
                7-day performance
              </p>
              <h2 className="font-headline text-2xl text-on-surface mt-1">Booking Trends</h2>
            </div>
            <span className="text-xs text-on-surface-variant">Last 7 days</span>
          </div>
          <div className="h-56 mt-8 flex items-end gap-3 border-b border-outline-variant pb-3">
            {[43, 56, 48, 68, 88, 73, 38].map((height, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className={`w-full max-w-8 rounded-t-md ${
                    index === 4 ? 'bg-primary' : 'bg-primary-fixed-dim'
                  }`}
                  style={{ height: `${height}%` }}
                />
                <span className="text-[10px] text-on-surface-variant">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue Breakdown */}
        <div className="xl:col-span-5 rounded-xl border border-outline-variant bg-surface-container-lowest p-6">
          <p className="text-[11px] uppercase font-semibold tracking-widest text-primary">
            Financial health
          </p>
          <h2 className="font-headline text-2xl text-on-surface mt-1">Revenue Breakdown</h2>
          <div className="mt-8 text-center">
            <p className="font-headline text-5xl text-primary">
              ₹{loading ? '…' : value('totalRevenue', 'revenue')}
            </p>
            <p className="text-xs text-on-surface-variant mt-2">Total revenue to date</p>
          </div>
          <div className="mt-8 space-y-4">
            {[
              ['Meeting rooms', '72%'],
              ['Private suites', '53%'],
              ['Flex desks', '38%'],
            ].map(([name, width]) => (
              <div key={name}>
                <div className="flex justify-between text-xs text-on-surface-variant">
                  <span>{name}</span>
                  <span>{width}</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-surface-container">
                  <div className="h-full rounded-full bg-primary" style={{ width }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Recent bookings + activity feed ── */}
      <section className="grid xl:grid-cols-12 gap-6">
        {/* Recent Booking Operations */}
        <div className="xl:col-span-8 rounded-xl border border-outline-variant bg-surface-container-lowest overflow-hidden">
          <div className="p-6 flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase font-semibold tracking-widest text-primary">
                Workflow
              </p>
              <h2 className="font-headline text-2xl text-on-surface mt-1">
                Recent Booking Operations
              </h2>
            </div>
            <Link to="/admin/bookings" className="text-xs font-semibold text-primary">
              View all →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-surface-container-low text-[10px] uppercase tracking-wider text-on-surface-variant">
                <tr>
                  <th className="px-6 py-3">Member</th>
                  <th className="px-4 py-3">Workspace</th>
                  <th className="px-4 py-3">Schedule</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="px-6 py-8 text-sm text-on-surface-variant" colSpan="4">
                      Loading…
                    </td>
                  </tr>
                ) : bookings.length ? (
                  bookings.map((b) => (
                    <tr
                      key={b.id}
                      className="border-t border-outline-variant/60 text-xs"
                    >
                      <td className="px-6 py-4 font-semibold">
                        {b.user?.name || b.userName || 'Member'}
                      </td>
                      <td className="px-4 py-4 text-on-surface-variant">
                        {b.space?.name || b.spaceName || 'Workspace'}
                      </td>
                      <td className="px-4 py-4 text-on-surface-variant">
                        {b.date || b.startTime || '—'}
                      </td>
                      <td className="px-4 py-4">
                        <span className="px-2 py-1 rounded-full bg-primary-fixed text-on-primary-fixed text-[10px] font-semibold">
                          {b.status || 'PENDING'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-6 py-8 text-sm text-on-surface-variant" colSpan="4">
                      No recent bookings.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity feed */}
        <div className="xl:col-span-4 rounded-xl border border-outline-variant bg-surface-container-lowest p-6">
          <p className="text-[11px] uppercase font-semibold tracking-widest text-primary">
            System feed
          </p>
          <h2 className="font-headline text-2xl text-on-surface mt-1">Recent Activity</h2>
          <div className="mt-6 space-y-5">
            {activity.length ? (
              activity.slice(0, 5).map((item, index) => (
                <div key={item.id || index} className="flex gap-3">
                  <span className="mt-1.5 w-2 h-2 bg-primary rounded-full flex-none" />
                  <div>
                    <p className="text-xs text-on-surface">
                      {item.message || item.description || item.type}
                    </p>
                    <p className="text-[10px] text-on-surface-variant mt-1">
                      {item.createdAt || item.time || 'Just now'}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-on-surface-variant">
                No recent operational activity.
              </p>
            )}
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3">
            <Link
              className="rounded-lg bg-primary py-2.5 text-center text-xs font-semibold text-on-primary"
              to="/admin/bookings"
            >
              Review bookings
            </Link>
            <Link
              className="rounded-lg bg-surface-container py-2.5 text-center text-xs font-semibold text-on-surface"
              to="/admin/spaces/new"
            >
              Create space
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
