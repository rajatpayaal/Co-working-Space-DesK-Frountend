import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import adminApi from '../../api/adminApi';
import usersApi from '../../api/usersApi';
import spacesApi from '../../api/spacesApi';
import bookingsApi from '../../api/bookingsApi';
import { collectionFrom, unwrapResponse } from '../../api/responseHelpers';

export const Dashboard = () => {
  const [stats, setStats] = useState({});
  const [bookings, setBookings] = useState([]);
  const [maintenanceItems, setMaintenanceItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    Promise.allSettled([
      spacesApi.getAdminAll({ limit: 100 }),
      bookingsApi.getAdminAll({ limit: 100 }),
      usersApi.getAll({ limit: 100 }),
      adminApi.getMaintenance(),
    ])
      .then(([spacesRes, bookingsRes, usersRes, maintRes]) => {
        if (!active) return;

        const spaces = spacesRes.status === 'fulfilled'
          ? collectionFrom(spacesRes.value, ['spaces', 'items', 'records', 'data'])
          : [];

        const bookingRows = bookingsRes.status === 'fulfilled'
          ? collectionFrom(bookingsRes.value, ['bookings', 'items', 'records', 'data'])
          : [];

        const usersList = usersRes.status === 'fulfilled'
          ? collectionFrom(usersRes.value, ['users', 'items', 'records', 'data'])
          : [];
        const totalUsers = usersRes.status === 'fulfilled'
          ? (unwrapResponse(usersRes.value)?.pagination?.total ?? usersList.length)
          : 0;

        const maintList = maintRes.status === 'fulfilled'
          ? collectionFrom(maintRes.value, ['maintenance', 'items', 'data'])
          : [];

        const pending = bookingRows.filter(
          (b) => String(b.status).toUpperCase() === 'PENDING'
        ).length;
        const approved = bookingRows.filter(
          (b) => String(b.status).toUpperCase() === 'APPROVED'
        ).length;
        const cancelled = bookingRows.filter(
          (b) => String(b.status).toUpperCase() === 'CANCELLED'
        ).length;

        // Derive total revenue from bookings
        const totalRevenue = bookingRows.reduce((sum, b) => {
          const amt = Number(b.totalAmount ?? b.amount ?? b.price ?? 0);
          return sum + (isNaN(amt) ? 0 : amt);
        }, 0);

        setBookings(bookingRows.slice(0, 5));
        setMaintenanceItems(maintList.slice(0, 5));
        setStats({
          totalSpaces: spaces.length,
          totalUsers: totalUsers,
          totalBookings: bookingRows.length,
          pendingBookings: pending,
          approvedBookings: approved,
          cancelledBookings: cancelled,
          totalRevenue,
          maintenanceCount: maintList.length,
        });
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

  const value = (...keys) => {
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
    ['apartment',       'Total Spaces',       value('totalSpaces', 'spaces'),             'Inventory availability',    false, '/admin/spaces'],
    ['group',           'Total Users',         value('totalUsers', 'users'),               'Registered members',        false, '/admin/users'],
    ['event_available', 'Total Bookings',      value('totalBookings', 'bookings'),         'Across all workspaces',     false, '/admin/bookings'],
    ['pending_actions', 'Pending Bookings',    value('pendingBookings', 'pending'),        'Needs review',              true,  '/admin/bookings'],
    ['task_alt',        'Approved Bookings',   value('approvedBookings', 'approved'),      'Confirmed reservations',    false, '/admin/bookings'],
    ['event_busy',      'Cancelled Bookings',  value('cancelledBookings', 'cancelled'),    'Cancelled reservations',    false, '/admin/bookings'],
    ['payments',        'Total Revenue',       `₹${Number(value('totalRevenue', 'revenue') || 0).toLocaleString('en-IN')}`, 'Gross booking revenue', true, '/admin/bookings'],
    ['build',           'Maintenance Windows', value('maintenanceCount', 'maintenance'),   'Active & scheduled windows', false, '/admin/maintenance'],
  ];

  return (
    <div className="w-full px-5 md:px-8 py-8 max-w-[1600px] mx-auto space-y-8 page-fade-in">
      {/* ── Header banner ── */}
      <section className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 flex flex-col md:flex-row gap-5 justify-between shadow-xs">
        <div>
          <p className="text-[11px] uppercase font-bold tracking-widest text-primary">
            Platform operations
          </p>
          <h1 className="font-headline text-3xl text-on-surface mt-1">System Overview</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Monitor real-time booking activity, member accounts, space availability, and maintenance status.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start md:self-auto">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-mono text-on-surface-variant font-semibold">LIVE PLATFORM TELEMETRY</span>
        </div>
      </section>

      {/* ── Error banner ── */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-error-container p-4 text-sm text-error border border-error/20">
          <span className="material-symbols-outlined text-lg">error</span>
          <span>{error}</span>
        </div>
      )}

      {/* ── Stat cards ── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map(([icon, label, number, detail, accent, link]) => (
          <Link
            key={label}
            to={link}
            className={`group rounded-2xl border p-5 bg-surface-container-lowest transition-all hover:shadow-md hover:border-primary/40 block ${
              accent ? 'border-primary/30' : 'border-outline-variant'
            }`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`material-symbols-outlined text-2xl transition-transform group-hover:scale-110 ${
                  accent ? 'text-primary' : 'text-on-surface-variant group-hover:text-primary'
                }`}
              >
                {icon}
              </span>
              <span className="text-[10px] text-on-surface-variant font-medium flex items-center gap-1 group-hover:text-primary transition-colors">
                View
                <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
              </span>
            </div>
            <p
              className={`text-[11px] font-bold uppercase tracking-wider mt-4 ${
                accent ? 'text-primary' : 'text-on-surface-variant'
              }`}
            >
              {label}
            </p>
            <p className="font-headline text-3xl font-bold text-on-surface mt-1">
              {loading ? '…' : number}
            </p>
            <p className="text-[11px] text-on-surface-variant mt-2">{detail}</p>
          </Link>
        ))}
      </section>

      {/* ── Two Column: Recent Bookings & Maintenance Windows ── */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Bookings (2 cols) */}
        <div className="lg:col-span-2 rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-outline-variant/60 mb-4">
            <div>
              <h2 className="font-headline text-xl font-bold text-on-surface">Recent Reservations</h2>
              <p className="text-xs text-on-surface-variant mt-0.5">Latest booking requests across all spaces</p>
            </div>
            <Link to="/admin/bookings" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
              Manage Bookings
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </Link>
          </div>

          <div className="divide-y divide-outline-variant/60">
            {bookings.length > 0 ? (
              bookings.map((booking) => (
                <div key={booking.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center flex-shrink-0 text-xs">
                      {(booking.user?.name || 'M').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-on-surface truncate">{booking.user?.name || 'Member'}</p>
                      <p className="text-xs text-on-surface-variant truncate">
                        {booking.space?.name || 'Space'} · {new Date(booking.startTime).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs font-bold text-on-surface">
                      ₹{Number(booking.totalAmount || 0).toLocaleString('en-IN')}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        String(booking.status).toUpperCase() === 'APPROVED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : String(booking.status).toUpperCase() === 'PENDING'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-surface-container text-on-surface-variant border border-outline-variant'
                      }`}
                    >
                      {booking.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="py-8 text-center text-sm text-on-surface-variant">No reservations found.</p>
            )}
          </div>
        </div>

        {/* Right Column: Maintenance Windows & Quick Actions */}
        <div className="space-y-6">
          {/* Active Maintenance Panel */}
          <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/60 mb-3">
              <h2 className="font-headline text-lg font-bold text-on-surface">Maintenance</h2>
              <Link to="/admin/maintenance" className="text-xs font-semibold text-primary hover:underline">
                View all
              </Link>
            </div>

            <div className="space-y-3">
              {maintenanceItems.length > 0 ? (
                maintenanceItems.map((item) => (
                  <div key={item.id} className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/60 text-xs">
                    <div className="flex items-center justify-between font-semibold text-on-surface">
                      <span className="truncate">{item.space?.name || 'Space Maintenance'}</span>
                      <span className="text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded font-mono">
                        Active
                      </span>
                    </div>
                    <p className="text-on-surface-variant mt-1 text-[11px]">{item.reason || item.title || 'Scheduled upkeep'}</p>
                  </div>
                ))
              ) : (
                <p className="py-4 text-center text-xs text-on-surface-variant">No maintenance windows scheduled.</p>
              )}
            </div>

            <Link
              to="/admin/maintenance"
              className="mt-4 block w-full py-2 text-center text-xs font-semibold rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors"
            >
              + Schedule Maintenance Window
            </Link>
          </div>

          {/* Quick Operations Links */}
          <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-xs">
            <h3 className="font-headline text-lg font-bold text-on-surface mb-3">Quick Navigation</h3>
            <div className="grid grid-cols-2 gap-2.5">
              <Link
                to="/admin/spaces/new"
                className="py-2.5 px-3 rounded-xl bg-primary text-on-primary text-xs font-semibold text-center hover:bg-on-primary-fixed-variant transition-colors"
              >
                + New Space
              </Link>
              <Link
                to="/admin/users"
                className="py-2.5 px-3 rounded-xl bg-surface-container text-on-surface text-xs font-semibold text-center hover:bg-surface-container-high transition-colors"
              >
                Manage Users
              </Link>
              <Link
                to="/admin/bookings"
                className="py-2.5 px-3 rounded-xl bg-surface-container text-on-surface text-xs font-semibold text-center hover:bg-surface-container-high transition-colors"
              >
                All Bookings
              </Link>
              <Link
                to="/admin/roles"
                className="py-2.5 px-3 rounded-xl bg-surface-container text-on-surface text-xs font-semibold text-center hover:bg-surface-container-high transition-colors"
              >
                RBAC Roles
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
