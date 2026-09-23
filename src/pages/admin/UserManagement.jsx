import React, { useCallback, useEffect, useState } from 'react';
import usersApi from '../../api/usersApi';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import { SkeletonRow } from '../../components/common/LoadingSpinner';
import { collectionFrom, paginationFrom, unwrapResponse } from '../../api/responseHelpers';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Formats an ISO date string as "DD MMM YYYY".
 * Returns "—" when the value is falsy.
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
 * Maps a user role string/object to a Badge variant key.
 * Falls back to "member" for unknown roles.
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

function StatCard({ icon, label, value, colorClass }) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 flex items-center gap-4">
      <div className={`flex items-center justify-center w-11 h-11 rounded-full ${colorClass}`}>
        <span className="material-symbols-outlined text-xl">{icon}</span>
      </div>
      <div>
        <p className="text-2xl font-bold text-on-surface leading-none">{value}</p>
        <p className="text-sm text-on-surface-variant mt-0.5">{label}</p>
      </div>
    </div>
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
  /** Per-row loading: { [userId]: true } */
  const [actionLoading, setActionLoading] = useState({});

  // ── Fetch users ───────────────────────────────────────────────────────────
  const fetchUsers = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await usersApi.getAll({ page, limit: 20 });
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

  // ── Client-side search filter ─────────────────────────────────────────────
  const filteredUsers = searchQuery.trim()
    ? users.filter((u) => {
        const q = searchQuery.toLowerCase();
        return (
          u.name?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q)
        );
      })
    : users;

  // ── Derived stats (from full loaded page, not filtered subset) ────────────
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.isActive).length;
  const inactiveUsers = totalUsers - activeUsers;

  // ── Activate / Deactivate ─────────────────────────────────────────────────
  const handleToggleStatus = async (user) => {
    const action = user.isActive ? 'deactivate' : 'activate';
    const confirmed = window.confirm(
      `Are you sure you want to ${action} "${user.name}"?`
    );
    if (!confirmed) return;

    setActionLoading((prev) => ({ ...prev, [user.id]: true }));
    try {
      if (user.isActive) {
        await usersApi.deactivate(user.id);
      } else {
        await usersApi.activate(user.id);
      }
      // Optimistically update the local state so the UI reflects the change
      // immediately without a full re-fetch.
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, isActive: !u.isActive } : u
        )
      );
    } catch (err) {
      alert(
        err?.message ??
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
    <div className="space-y-6">
      {/* ── Breadcrumb & Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-sm text-on-surface-variant mb-0.5">
            <span>Operations</span>
            <span className="mx-1.5 text-on-surface-variant opacity-50">›</span>
            <span className="text-on-surface">Users</span>
          </p>
          <h1 className="font-headline text-3xl text-on-surface">
            User Management
          </h1>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchUsers(currentPage)}
          isLoading={loading}
        >
          <span className="material-symbols-outlined text-xl">refresh</span>
          Refresh
        </Button>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon="group"
          label="Total Users"
          value={loading ? '—' : totalUsers}
          colorClass="bg-blue-100 text-blue-600"
        />
        <StatCard
          icon="check_circle"
          label="Active Users"
          value={loading ? '—' : activeUsers}
          colorClass="bg-green-100 text-green-600"
        />
        <StatCard
          icon="cancel"
          label="Inactive Users"
          value={loading ? '—' : inactiveUsers}
          colorClass="bg-red-100 text-red-500"
        />
      </div>

      {/* ── Search ── */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4">
        <div className="relative max-w-sm">
          <span className="material-symbols-outlined text-xl absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none select-none">
            search
          </span>
          <input
            type="text"
            placeholder="Search by name or email…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-outline-variant bg-background text-on-surface placeholder-on-surface-variant text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
              aria-label="Clear search"
            >
              <span className="material-symbols-outlined text-lg">close</span>
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
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-surface-container border-b border-outline-variant">
                <th className="px-4 py-3 text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wide w-10">
                  #
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
                  Name &amp; Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
                  Joined
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-outline-variant">
              {/* Loading skeleton */}
              {loading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonRow key={i} cols={6} />
                ))}

              {/* Populated rows */}
              {!loading &&
                filteredUsers.map((user, index) => (
                  <tr
                    key={user.id}
                    className="hover:bg-surface-container transition-colors"
                  >
                    {/* # */}
                    <td className="px-4 py-3 text-on-surface-variant">
                      {(currentPage - 1) * 20 + index + 1}
                    </td>

                    {/* Name & Email */}
                    <td className="px-4 py-3">
                      <p className="font-semibold text-on-surface">
                        {user.name ?? '—'}
                      </p>
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        {user.email ?? '—'}
                      </p>
                    </td>

                    {/* Role */}
                    <td className="px-4 py-3">
                      <Badge variant={roleBadgeVariant(user.role)}>
                        {roleLabel(user.role)}
                      </Badge>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <Badge variant={user.isActive ? 'active' : 'inactive'}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>

                    {/* Joined */}
                    <td className="px-4 py-3 text-on-surface-variant">
                      {formatDate(user.createdAt)}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        isLoading={!!actionLoading[user.id]}
                        onClick={() => handleToggleStatus(user)}
                      >
                        {!actionLoading[user.id] && (
                          <span className="material-symbols-outlined text-base">
                            {user.isActive ? 'block' : 'check_circle'}
                          </span>
                        )}
                        {user.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                    </td>
                  </tr>
                ))}

              {/* Empty state */}
              {!loading && filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12">
                    <EmptyState
                      icon="group"
                      title="No users found"
                      description={
                        searchQuery
                          ? 'No users match your search. Try a different name or email.'
                          : 'There are no registered users yet.'
                      }
                      action={
                        searchQuery
                          ? {
                              label: 'Clear Search',
                              onClick: () => setSearchQuery(''),
                            }
                          : undefined
                      }
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-outline-variant bg-surface-container">
            <p className="text-sm text-on-surface-variant">
              Page <span className="font-medium text-on-surface">{currentPage}</span>{' '}
              of{' '}
              <span className="font-medium text-on-surface">{totalPages}</span>
              {pagination?.total != null && (
                <>
                  {' '}
                  &mdash;{' '}
                  <span className="font-medium text-on-surface">
                    {pagination.total}
                  </span>{' '}
                  total users
                </>
              )}
            </p>

            <div className="flex items-center gap-1">
              {/* First page */}
              <button
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-low disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="First page"
              >
                <span className="material-symbols-outlined text-lg">
                  first_page
                </span>
              </button>

              {/* Previous page */}
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-low disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous page"
              >
                <span className="material-symbols-outlined text-lg">
                  chevron_left
                </span>
              </button>

              {/* Page number pills */}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(
                  (p) =>
                    p === 1 ||
                    p === totalPages ||
                    Math.abs(p - currentPage) <= 1
                )
                .reduce((acc, p, idx, arr) => {
                  if (idx > 0 && arr[idx - 1] !== p - 1) {
                    acc.push('ellipsis-' + p);
                  }
                  acc.push(p);
                  return acc;
                }, [])
                .map((item) =>
                  typeof item === 'string' ? (
                    <span
                      key={item}
                      className="px-1 text-on-surface-variant text-sm select-none"
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={item}
                      onClick={() => handlePageChange(item)}
                      className={`min-w-[2rem] h-8 rounded-lg text-sm font-medium transition-colors ${
                        item === currentPage
                          ? 'bg-primary text-white'
                          : 'text-on-surface-variant hover:bg-surface-container-low'
                      }`}
                    >
                      {item}
                    </button>
                  )
                )}

              {/* Next page */}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-low disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Next page"
              >
                <span className="material-symbols-outlined text-lg">
                  chevron_right
                </span>
              </button>

              {/* Last page */}
              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-low disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Last page"
              >
                <span className="material-symbols-outlined text-lg">
                  last_page
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default UserManagement;
