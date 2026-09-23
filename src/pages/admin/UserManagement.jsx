import React, { useCallback, useEffect, useState, useMemo } from 'react';
import usersApi from '../../api/usersApi';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import { SkeletonRow } from '../../components/common/LoadingSpinner';
import { collectionFrom, paginationFrom } from '../../api/responseHelpers';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Formats an ISO date string as "DD MMM YYYY".
 */
function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d)) return '—';
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Determine whether a user is active or inactive based on boolean or status string
 */
export function isUserActive(user) {
  if (!user) return false;
  if (user.isActive === false) return false;
  if (String(user.status || '').toUpperCase() === 'INACTIVE') return false;
  if (user.isActive === true) return true;
  if (String(user.status || '').toUpperCase() === 'ACTIVE') return true;
  return true; // default active
}

/**
 * Maps a user role string/object to a Badge variant key.
 */
function roleBadgeVariant(role) {
  const roleName = (typeof role === 'object' ? role?.name : role) || '';
  const map = {
    ADMIN: 'admin',
    SUPER_ADMIN: 'admin',
    MEMBER: 'member',
  };
  return map[roleName.toUpperCase()] ?? 'member';
}

/**
 * Returns a human-readable label for a role.
 */
function roleLabel(role) {
  const roleName = (typeof role === 'object' ? role?.name : role) || '';
  const map = {
    ADMIN: 'Admin',
    SUPER_ADMIN: 'Super Admin',
    MEMBER: 'Member',
  };
  return map[roleName.toUpperCase()] ?? (roleName || 'Member');
}

// ---------------------------------------------------------------------------
// Stat card sub-component
// ---------------------------------------------------------------------------

function StatCard({ icon, label, value, colorClass, isSelected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left w-full bg-surface-container-lowest border rounded-2xl p-5 flex items-center gap-4 transition-all cursor-pointer ${
        isSelected
          ? 'border-primary ring-2 ring-primary/20 shadow-sm bg-primary/5'
          : 'border-outline-variant hover:border-outline hover:shadow-xs'
      }`}
    >
      <div className={`flex items-center justify-center w-12 h-12 rounded-xl flex-shrink-0 ${colorClass}`}>
        <span className="material-symbols-outlined text-2xl">{icon}</span>
      </div>
      <div>
        <p className="text-2xl font-headline font-bold text-on-surface leading-none">{value}</p>
        <p className="text-xs text-on-surface-variant font-medium uppercase tracking-wide mt-1">{label}</p>
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function UserManagement() {
  // ── Data state ────────────────────────────────────────────────────────────
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'INACTIVE'
  /** Per-row loading: { [userId]: true } */
  const [actionLoading, setActionLoading] = useState({});

  // ── Fetch users ───────────────────────────────────────────────────────────
  const fetchUsers = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await usersApi.getAll({ page, limit: 50 });
      const list = collectionFrom(res, ['users', 'data', 'items']);
      const meta = paginationFrom(res);
      setUsers(list);
      setPagination(meta);
      setCurrentPage(page);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers(1);
  }, [fetchUsers]);

  // ── Filtered users (by search query & status filter) ───────────────────────
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // 1. Status Filter
      const active = isUserActive(u);
      if (statusFilter === 'ACTIVE' && !active) return false;
      if (statusFilter === 'INACTIVE' && active) return false;

      // 2. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const name = (u.name || '').toLowerCase();
        const email = (u.email || '').toLowerCase();
        const role = (typeof u.role === 'string' ? u.role : u.role?.name || '').toLowerCase();
        return name.includes(q) || email.includes(q) || role.includes(q);
      }

      return true;
    });
  }, [users, searchQuery, statusFilter]);

  // ── Derived stats ─────────────────────────────────────────────────────────
  const totalUsers = pagination?.total ?? users.length;
  const activeUsers = users.filter((u) => isUserActive(u)).length;
  const inactiveUsers = users.filter((u) => !isUserActive(u)).length;

  // ── Activate / Deactivate ────────────────---------------------------------
  const handleToggleStatus = async (user) => {
    const currentlyActive = isUserActive(user);
    const action = currentlyActive ? 'deactivate' : 'activate';
    const confirmed = window.confirm(
      `Are you sure you want to ${action} user "${user.name || user.email}"?`
    );
    if (!confirmed) return;

    setActionLoading((prev) => ({ ...prev, [user.id]: true }));
    try {
      if (currentlyActive) {
        await usersApi.deactivate(user.id);
      } else {
        await usersApi.activate(user.id);
      }
      // Optimistically update the local state
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id
            ? {
                ...u,
                isActive: !currentlyActive,
                status: !currentlyActive ? 'ACTIVE' : 'INACTIVE',
              }
            : u
        )
      );
    } catch (err) {
      alert(
        err?.response?.data?.message ||
          err?.message ||
          `Failed to ${action} user. Please try again.`
      );
    } finally {
      setActionLoading((prev) => {
        const next = { ...prev };
        delete next[user.id];
        return next;
      });
    }
  };

  // ── Pagination helpers ────────────────────────────────────────────────────
  const totalPages = pagination?.totalPages ?? 1;

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    fetchUsers(page);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 page-fade-in">
      {/* ── Breadcrumb & Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-xs text-on-surface-variant mb-0.5">
            <span>Operations</span>
            <span className="mx-1.5 text-on-surface-variant opacity-50">›</span>
            <span className="text-on-surface font-semibold">Users</span>
          </p>
          <h1 className="font-headline text-3xl text-on-surface">
            User Management
          </h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Manage member access, view registered users, and activate or deactivate accounts.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => fetchUsers(currentPage)}
          isLoading={loading}
        >
          <span className="material-symbols-outlined text-lg">refresh</span>
          Refresh
        </Button>
      </div>

      {/* ── Stat Cards (Clickable to Filter) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon="group"
          label="Total Users"
          value={loading ? '—' : totalUsers}
          colorClass="bg-blue-100 text-blue-700"
          isSelected={statusFilter === 'ALL'}
          onClick={() => setStatusFilter('ALL')}
        />
        <StatCard
          icon="check_circle"
          label="Active Users"
          value={loading ? '—' : activeUsers}
          colorClass="bg-emerald-100 text-emerald-700"
          isSelected={statusFilter === 'ACTIVE'}
          onClick={() => setStatusFilter('ACTIVE')}
        />
        <StatCard
          icon="block"
          label="Inactive Users"
          value={loading ? '—' : inactiveUsers}
          colorClass="bg-amber-100 text-amber-800"
          isSelected={statusFilter === 'INACTIVE'}
          onClick={() => setStatusFilter('INACTIVE')}
        />
      </div>

      {/* ── Filter Controls Bar ── */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        {/* Status Filter Pills */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-on-surface-variant mr-1">Status:</span>
          {[
            { label: 'All Users', value: 'ALL' },
            { label: 'Active Users', value: 'ACTIVE' },
            { label: 'Inactive Users', value: 'INACTIVE' },
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setStatusFilter(item.value)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition cursor-pointer ${
                statusFilter === item.value
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
              }`}
            >
              {item.label}
              {item.value === 'INACTIVE' && inactiveUsers > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-amber-200 text-amber-900 text-[10px] font-bold">
                  {inactiveUsers}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative max-w-sm w-full">
          <span className="material-symbols-outlined text-lg absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none select-none">
            search
          </span>
          <input
            type="text"
            placeholder="Search by name, email, or role…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 rounded-xl border border-outline-variant bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/60 text-xs focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
              aria-label="Clear search"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3">
          <span className="material-symbols-outlined text-xl shrink-0">error</span>
          <p className="text-sm flex-1">{error}</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchUsers(currentPage)}
          >
            Retry
          </Button>
        </div>
      )}

      {/* ── Users Table ── */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
                <th className="px-4 py-3.5 text-left w-12">#</th>
                <th className="px-4 py-3.5 text-left">Member Profile</th>
                <th className="px-4 py-3.5 text-left">Role</th>
                <th className="px-4 py-3.5 text-left">Account Status</th>
                <th className="px-4 py-3.5 text-left">Joined Date</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-outline-variant/60">
              {/* Loading skeleton */}
              {loading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonRow key={i} />
                ))}

              {/* Populated rows */}
              {!loading &&
                filteredUsers.map((user, index) => {
                  const active = isUserActive(user);
                  const isProcessing = !!actionLoading[user.id];

                  return (
                    <tr
                      key={user.id}
                      className={`transition-colors hover:bg-surface-container-low/50 ${
                        !active ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      {/* # */}
                      <td className="px-4 py-4 text-xs font-mono text-on-surface-variant">
                        {(currentPage - 1) * 50 + index + 1}
                      </td>

                      {/* Name & Email with Avatar */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full font-bold text-xs flex items-center justify-center flex-shrink-0 border ${
                            active
                              ? 'bg-primary/10 text-primary border-primary/20'
                              : 'bg-surface-container text-on-surface-variant border-outline-variant'
                          }`}>
                            {(user.name || 'M').slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-on-surface truncate">
                              {user.name ?? 'Untitled User'}
                            </p>
                            <p className="text-xs text-on-surface-variant truncate mt-0.5">
                              {user.email ?? '—'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-4 py-4">
                        <Badge variant={roleBadgeVariant(user.role)}>
                          {roleLabel(user.role)}
                        </Badge>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4">
                        <Badge variant={active ? 'active' : 'inactive'}>
                          {active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>

                      {/* Joined */}
                      <td className="px-4 py-4 text-xs text-on-surface-variant">
                        {formatDate(user.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-4 text-right">
                        <Button
                          variant={active ? 'secondary' : 'primary'}
                          size="sm"
                          isLoading={isProcessing}
                          onClick={() => handleToggleStatus(user)}
                        >
                          {!isProcessing && (
                            <span className="material-symbols-outlined text-[16px]">
                              {active ? 'block' : 'check_circle'}
                            </span>
                          )}
                          {active ? 'Deactivate' : 'Activate User'}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* Empty state */}
        {!loading && filteredUsers.length === 0 && (
          <div className="py-12">
            <EmptyState
              icon={statusFilter === 'INACTIVE' ? 'check_circle' : 'group'}
              title={statusFilter === 'INACTIVE' ? 'No inactive users' : 'No users found'}
              description={
                statusFilter === 'INACTIVE'
                  ? 'All user accounts are currently active.'
                  : searchQuery
                  ? `No users match "${searchQuery}".`
                  : 'There are no registered users found.'
              }
              action={
                searchQuery || statusFilter !== 'ALL' ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('ALL');
                    }}
                  >
                    Reset Filters
                  </Button>
                ) : undefined
              }
            />
          </div>
        )}

        {/* Footer */}
        <footer className="px-4 py-3 bg-surface-container-low border-t border-outline-variant/60 flex items-center justify-between text-xs text-on-surface-variant">
          <span>
            Showing {filteredUsers.length} of {totalUsers} user{totalUsers !== 1 ? 's' : ''}
            {statusFilter !== 'ALL' && ` (${statusFilter.toLowerCase()} only)`}
          </span>
          <span className="font-mono text-[11px]">RBAC: ADMIN · JWT VERIFIED</span>
        </footer>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={currentPage <= 1 || loading}
            onClick={() => handlePageChange(currentPage - 1)}
          >
            <span className="material-symbols-outlined text-sm">chevron_left</span>
            Previous
          </Button>

          <span className="text-xs text-on-surface-variant">
            Page <span className="font-semibold text-on-surface">{currentPage}</span> of{' '}
            <span className="font-semibold text-on-surface">{totalPages}</span>
          </span>

          <Button
            variant="secondary"
            size="sm"
            disabled={currentPage >= totalPages || loading}
            onClick={() => handlePageChange(currentPage + 1)}
          >
            Next
            <span className="material-symbols-outlined text-sm">chevron_right</span>
          </Button>
        </div>
      )}
    </div>
  );
}

export default UserManagement;
