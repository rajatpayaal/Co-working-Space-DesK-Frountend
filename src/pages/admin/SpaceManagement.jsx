import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import spacesApi from '../../api/spacesApi';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import { SkeletonRow } from '../../components/common/LoadingSpinner';
import { collectionFrom } from '../../api/responseHelpers';

const getStatus = (space) => {
  if (String(space.status || '').toUpperCase() === 'MAINTENANCE') return 'maintenance';
  if (space.isActive === false || String(space.status || '').toUpperCase() === 'INACTIVE') return 'inactive';
  return 'active';
};

const statusClass = {
  active: 'bg-primary-fixed text-on-primary-fixed',
  inactive: 'bg-surface-container-high text-on-surface-variant',
  maintenance: 'bg-error-container text-error',
};

export const SpaceManagement = () => {
  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await spacesApi.getAdminAll({ limit: 100 });
      setSpaces(collectionFrom(response, ['spaces', 'items', 'records']));
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load spaces. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filteredSpaces = useMemo(() => spaces.filter((space) => {
    const matchesQuery = `${space.name || ''} ${space.id || ''}`.toLowerCase().includes(query.toLowerCase());
    const matchesStatus = filterStatus === 'all' || getStatus(space) === filterStatus;
    return matchesQuery && matchesStatus;
  }), [spaces, query, filterStatus]);

  const totals = {
    all: spaces.length,
    active: spaces.filter((space) => getStatus(space) === 'active').length,
    inactive: spaces.filter((space) => getStatus(space) === 'inactive').length,
    maintenance: spaces.filter((space) => getStatus(space) === 'maintenance').length,
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
    ['apartment', 'Total Spaces', totals.all, 'Allocated units'],
    ['check_circle', 'Active Spaces', totals.active, 'Live & accepting bookings'],
    ['block', 'Inactive Spaces', totals.inactive, 'Hidden from booking catalogue'],
    ['build', 'Under Maintenance', totals.maintenance, 'Work orders active'],
  ];

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs text-on-surface-variant">Operations <span className="mx-2">›</span> Spaces</p>
          <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className="font-headline text-4xl text-on-surface">Space Management</h2>
            <span className="text-[10px] font-bold tracking-[0.18em] text-on-surface-variant">CLUSTER A / LEVEL 1–4</span>
          </div>
          <p className="mt-2 max-w-3xl text-sm text-on-surface-variant">Configure capacity, pricing, amenity bindings, and availability for every bookable workspace.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={load} isLoading={loading}>
            <span className="material-symbols-outlined text-base">refresh</span> Refresh
          </Button>
          <Link to="/admin/spaces/new"><Button><span className="material-symbols-outlined text-base">add</span> Create Space</Button></Link>
        </div>
      </section>

      {error && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-error/20 bg-error-container px-4 py-3 text-sm text-error">
          <span>{error}</span><button onClick={load} className="font-semibold underline">Try again</button>
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metricCards.map(([icon, label, count, note], index) => (
          <article key={label} className={`relative overflow-hidden rounded-xl border bg-surface-container-lowest p-5 ${index === 3 ? 'border-error-container' : 'border-outline-variant'}`}>
            <span className={`material-symbols-outlined absolute right-5 top-5 ${index === 3 ? 'text-error' : 'text-primary'}`}>{icon}</span>
            <p className={`text-[11px] font-semibold uppercase tracking-wider ${index === 3 ? 'text-error' : 'text-on-surface-variant'}`}>{label}</p>
            <p className="mt-5 font-headline text-4xl text-on-surface">{loading ? '—' : count}</p>
            <p className="mt-3 text-xs text-on-surface-variant">{note}</p>
            <span className="absolute -bottom-10 -right-8 h-28 w-28 rounded-full bg-surface-container" />
          </article>
        ))}
      </section>

      <section className="rounded-xl border border-outline-variant/40 bg-surface-container-low p-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <label className="relative block w-full max-w-xl">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-on-surface-variant">search</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search spaces by name or ID…" className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest py-2.5 pl-10 pr-4 text-xs text-on-surface outline-none transition focus:border-primary" />
          </label>
          <div className="flex flex-wrap gap-2">
            {['all', 'active', 'maintenance', 'inactive'].map((item) => (
              <button
                key={item}
                onClick={() => setFilterStatus(item)}
                className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${filterStatus === item ? 'bg-primary text-on-primary' : 'bg-surface-container-lowest text-on-surface-variant hover:text-on-surface'}`}
              >
                {item === 'all' ? 'All' : item === 'active' ? '• Active' : item[0].toUpperCase() + item.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[940px] text-left">
            <thead className="bg-surface-container-low text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
              <tr>
                <th className="px-4 py-4">ID</th>
                <th className="px-4 py-4">Space</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">Capacity</th>
                <th className="px-4 py-4">Description</th>
                <th className="px-4 py-4">Tariff</th>
                <th className="px-4 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && Array.from({ length: 5 }, (_, index) => <SkeletonRow key={index} />)}
              {!loading && filteredSpaces.map((space) => {
                const spaceStatus = getStatus(space);
                const shortId = `#${space.id.slice(0, 8).toUpperCase()}`;
                const description = space.description
                  ? space.description.length > 40
                    ? `${space.description.slice(0, 40)}…`
                    : space.description
                  : '—';
                return (
                  <tr key={space.id} className="border-t border-outline-variant/60 transition hover:bg-surface-container-low/50">
                    <td className="px-4 py-5 font-mono text-xs text-on-surface-variant">{shortId}</td>
                    <td className="px-4 py-5">
                      <p className="text-sm font-semibold text-on-surface">{space.name || 'Untitled Space'}</p>
                      {space.location && (
                        <p className="text-[11px] text-on-surface-variant flex items-center gap-0.5 mt-0.5">
                          <span className="material-symbols-outlined text-[13px] text-primary">location_on</span>
                          {space.location}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-5">
                      <div className="flex flex-col gap-1 items-start">
                        <Badge variant={space.isActive === false ? 'inactive' : 'active'}>
                          {space.isActive === false ? 'Inactive' : 'Active'}
                        </Badge>
                        {space.type && (
                          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-surface-container rounded text-on-surface-variant">
                            {space.type}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-5 text-xs text-on-surface">
                      {space.capacity || 1} {Number(space.capacity || 1) === 1 ? 'Person' : 'People'}
                    </td>
                    <td className="px-4 py-5 text-xs text-on-surface-variant">{description}</td>
                    <td className="px-4 py-5">
                      <p className="text-sm font-semibold text-on-surface">₹{space.pricePerHour || 0}</p>
                      <p className="text-[10px] text-on-surface-variant">/hour</p>
                    </td>
                    <td className="px-4 py-5 text-right whitespace-nowrap">
                      <Link className="mr-4 text-xs font-semibold hover:text-primary" to={`/spaces/${space.id}`}>View</Link>
                      <Link className="mr-4 text-xs font-semibold text-primary" to={`/admin/spaces/${space.id}/edit`}>Edit</Link>
                      <button aria-label={`Delete ${space.name}`} className="text-error" onClick={() => removeSpace(space)}>
                        <span className="material-symbols-outlined text-base">delete</span>
                      </button>
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
            description="Try another search or create a new workspace."
            action={<Link to="/admin/spaces/new"><Button size="sm">Create Space</Button></Link>}
          />
        )}
        <footer className="flex flex-col items-center justify-between gap-3 bg-surface-container-low px-4 py-4 text-xs text-on-surface-variant sm:flex-row">
          <span>Showing {filteredSpaces.length} of {spaces.length} configured spaces</span>
          <span className="font-mono">RBAC: MANAGE_SPACES · JWT Bearer Validated</span>
        </footer>
      </section>
    </div>
  );
};

export default SpaceManagement;
