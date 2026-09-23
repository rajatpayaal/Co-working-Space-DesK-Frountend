import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import spacesApi from '../../api/spacesApi';
import adminApi from '../../api/adminApi';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import { SkeletonRow } from '../../components/common/LoadingSpinner';
import { collectionFrom } from '../../api/responseHelpers';

const getStatus = (space, maintenanceSpaceIds) => {
  if (maintenanceSpaceIds?.has(String(space.id)) || String(space.status || '').toUpperCase() === 'MAINTENANCE') {
    return 'maintenance';
  }
  if (space.isActive === false || String(space.status || '').toUpperCase() === 'INACTIVE') {
    return 'inactive';
  }
  return 'active';
};

export const SpaceManagement = () => {
  const [spaces, setSpaces] = useState([]);
  const [maintenanceList, setMaintenanceList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [spacesRes, maintRes] = await Promise.allSettled([
        spacesApi.getAdminAll({ limit: 100 }),
        adminApi.getMaintenance(),
      ]);

      if (spacesRes.status === 'fulfilled') {
        setSpaces(collectionFrom(spacesRes.value, ['spaces', 'items', 'records', 'data']));
      } else {
        setError(spacesRes.reason?.response?.data?.message || 'Unable to load spaces. Please try again.');
      }

      if (maintRes.status === 'fulfilled') {
        setMaintenanceList(collectionFrom(maintRes.value, ['maintenance', 'items', 'data']));
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load spaces. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Set of space IDs that currently have active or ongoing maintenance windows
  const maintenanceSpaceIds = useMemo(() => {
    const ids = new Set();
    const now = Date.now();
    maintenanceList.forEach((m) => {
      const sid = m.spaceId || m.space?.id;
      if (!sid) return;
      const end = m.endTime ? new Date(m.endTime).getTime() : Infinity;
      // Mark as maintenance if scheduled or not yet passed
      if (end >= now) {
        ids.add(String(sid));
      }
    });
    return ids;
  }, [maintenanceList]);

  const filteredSpaces = useMemo(() => {
    return spaces.filter((space) => {
      const matchesQuery = `${space.name || ''} ${space.id || ''} ${space.location || ''} ${space.type || ''}`
        .toLowerCase()
        .includes(query.toLowerCase());
      const status = getStatus(space, maintenanceSpaceIds);
      const matchesStatus = filterStatus === 'all' || status === filterStatus;
      return matchesQuery && matchesStatus;
    });
  }, [spaces, query, filterStatus, maintenanceSpaceIds]);

  const totals = {
    all: spaces.length,
    active: spaces.filter((space) => getStatus(space, maintenanceSpaceIds) === 'active').length,
    inactive: spaces.filter((space) => getStatus(space, maintenanceSpaceIds) === 'inactive').length,
    maintenance: spaces.filter((space) => getStatus(space, maintenanceSpaceIds) === 'maintenance').length,
  };

  const removeSpace = async (space) => {
    if (!window.confirm(`Delete "${space.name}"? This cannot be undone.`)) return;
    try {
      await spacesApi.delete(space.id);
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to delete this space.');
    }
  };

  const metricCards = [
    ['apartment', 'Total Spaces', totals.all, 'Allocated units', 'all'],
    ['check_circle', 'Active Spaces', totals.active, 'Live & accepting bookings', 'active'],
    ['block', 'Inactive Spaces', totals.inactive, 'Hidden from public catalogue', 'inactive'],
    ['build', 'Under Maintenance', totals.maintenance, 'Active or scheduled service', 'maintenance'],
  ];

  return (
    <div className="space-y-8 page-fade-in">
      <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs text-on-surface-variant">Operations <span className="mx-2">›</span> Spaces</p>
          <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className="font-headline text-4xl text-on-surface">Space Management</h2>
            <span className="text-[10px] font-bold tracking-[0.18em] text-primary uppercase bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
              Workspace Catalogue
            </span>
          </div>
          <p className="mt-2 max-w-3xl text-sm text-on-surface-variant">
            Configure capacity, pricing, amenity bindings, and monitor live availability and maintenance status for every bookable workspace.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={load} isLoading={loading}>
            <span className="material-symbols-outlined text-base">refresh</span> Refresh
          </Button>
          <Link to="/admin/spaces/new">
            <Button>
              <span className="material-symbols-outlined text-base">add</span> Create Space
            </Button>
          </Link>
        </div>
      </section>

      {error && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-error/20 bg-error-container px-4 py-3 text-sm text-error">
          <span>{error}</span>
          <button onClick={load} className="font-semibold underline cursor-pointer">Try again</button>
        </div>
      )}

      {/* Metric Cards (Clickable to Filter) */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metricCards.map(([icon, label, count, note, filterKey]) => (
          <button
            key={label}
            type="button"
            onClick={() => setFilterStatus(filterKey)}
            className={`text-left rounded-2xl border p-5 bg-surface-container-lowest transition-all cursor-pointer ${
              filterStatus === filterKey
                ? 'border-primary ring-2 ring-primary/20 shadow-sm bg-primary/5'
                : 'border-outline-variant hover:border-outline hover:shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="material-symbols-outlined text-2xl text-primary">{icon}</span>
              {filterStatus === filterKey && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  Selected
                </span>
              )}
            </div>
            <p className="mt-3 text-2xl font-bold font-headline text-on-surface">{loading ? '…' : count}</p>
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mt-1">{label}</p>
            <p className="text-[11px] text-on-surface-variant/80 mt-1">{note}</p>
          </button>
        ))}
      </section>

      <section className="rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-xs overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-outline-variant p-5 sm:flex-row sm:items-center sm:justify-between bg-surface-container-low">
          <div className="relative w-full max-w-sm">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-base text-on-surface-variant">search</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by space name, type, location..."
              className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest pl-9 pr-4 py-2 text-xs text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            {[
              ['all', 'All Spaces'],
              ['active', 'Active'],
              ['inactive', 'Inactive'],
              ['maintenance', 'Under Maintenance'],
            ].map(([value, label]) => (
              <button
                key={value}
                onClick={() => setFilterStatus(value)}
                className={`rounded-full px-3.5 py-1.5 font-medium transition cursor-pointer ${
                  filterStatus === value
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {label}
                {value === 'maintenance' && totals.maintenance > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-amber-200 text-amber-900 text-[10px] font-bold">
                    {totals.maintenance}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="bg-surface-container-low text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant border-b border-outline-variant">
              <tr>
                <th className="px-4 py-3.5">ID</th>
                <th className="px-4 py-3.5">Space Name & Area</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Capacity</th>
                <th className="px-4 py-3.5">Rate</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/60">
              {loading && Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
              {!loading && filteredSpaces.map((space) => {
                const shortId = (space.id || '').slice(0, 8).toUpperCase();
                const status = getStatus(space, maintenanceSpaceIds);
                const isUnderMaintenance = status === 'maintenance';

                return (
                  <tr key={space.id} className="transition-colors hover:bg-surface-container-low/50">
                    <td className="px-4 py-4 font-mono text-xs text-on-surface-variant">#{shortId}</td>
                    <td className="px-4 py-4">
                      <p className="text-sm font-semibold text-on-surface">{space.name || 'Untitled Space'}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {space.type && (
                          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-surface-container rounded text-on-surface-variant">
                            {space.type}
                          </span>
                        )}
                        {space.location && (
                          <p className="text-[11px] text-on-surface-variant flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-[13px] text-primary">location_on</span>
                            {space.location}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {isUnderMaintenance ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                          <span className="material-symbols-outlined text-[14px]">build</span>
                          Under Maintenance
                        </span>
                      ) : (
                        <Badge variant={space.isActive === false ? 'inactive' : 'active'}>
                          {space.isActive === false ? 'Inactive' : 'Active'}
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-4 text-xs text-on-surface">
                      {space.capacity || 1} {Number(space.capacity || 1) === 1 ? 'Person' : 'People'}
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm font-bold text-on-surface">₹{space.pricePerHour || 0}</p>
                      <p className="text-[10px] text-on-surface-variant">/hour</p>
                    </td>
                    <td className="px-4 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          className="px-2.5 py-1 rounded-lg border border-outline-variant text-xs font-semibold text-on-surface hover:text-primary hover:border-primary transition-colors"
                          to={`/spaces/${space.id}`}
                        >
                          View
                        </Link>
                        <Link
                          className="px-2.5 py-1 rounded-lg bg-surface-container text-xs font-semibold text-primary hover:bg-surface-container-high transition-colors"
                          to={`/admin/spaces/${space.id}/edit`}
                        >
                          Edit
                        </Link>
                        <button
                          aria-label={`Delete ${space.name}`}
                          className="p-1 text-on-surface-variant hover:text-error transition-colors cursor-pointer"
                          onClick={() => removeSpace(space)}
                        >
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!loading && !filteredSpaces.length && (
          <EmptyState
            icon="apartment"
            title="No spaces found"
            description="Try adjusting your filter or search query, or create a new workspace."
            action={
              <Link to="/admin/spaces/new">
                <Button size="sm">Create Space</Button>
              </Link>
            }
          />
        )}
        <footer className="flex flex-col items-center justify-between gap-3 bg-surface-container-low px-4 py-3 text-xs text-on-surface-variant sm:flex-row border-t border-outline-variant/60">
          <span>Showing {filteredSpaces.length} of {spaces.length} configured spaces</span>
          <span className="font-mono text-[11px]">RBAC: MANAGE_SPACES · JWT VERIFIED</span>
        </footer>
      </section>
    </div>
  );
};

export default SpaceManagement;
