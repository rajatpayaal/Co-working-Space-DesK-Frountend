import React, { useCallback, useEffect, useState } from 'react';
import adminApi from '../../api/adminApi';
import { collectionFrom } from '../../api/responseHelpers';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import EmptyState from '../../components/common/EmptyState';

// ---------------------------------------------------------------------------
// Skeleton card shown while the roles list is loading
// ---------------------------------------------------------------------------
const RoleSkeletonCard = () => (
  <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-5 animate-pulse">
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-surface-container-high rounded w-1/3" />
        <div className="h-3 bg-surface-container-high rounded w-2/3" />
      </div>
      <div className="h-6 w-20 bg-surface-container-high rounded-full" />
    </div>
    <div className="mt-4 flex items-center gap-2">
      <div className="h-8 w-36 bg-surface-container-high rounded-lg" />
      <div className="h-8 w-8 bg-surface-container-high rounded-lg" />
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Inline error banner with optional retry
// ---------------------------------------------------------------------------
const ErrorBanner = ({ message, onRetry }) => (
  <div className="flex items-center justify-between gap-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
    <div className="flex items-center gap-2">
      <span className="material-symbols-outlined text-xl text-red-600">error</span>
      <span>{message}</span>
    </div>
    {onRetry && (
      <Button variant="outline" size="sm" onClick={onRetry}>
        Retry
      </Button>
    )}
  </div>
);

// ---------------------------------------------------------------------------
// Create Role Modal
// ---------------------------------------------------------------------------
const CreateRoleModal = ({ isOpen, onClose, onCreated }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [nameError, setNameError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Reset form whenever the modal opens
  useEffect(() => {
    if (isOpen) {
      setName('');
      setDescription('');
      setNameError('');
      setSubmitError('');
      setSubmitting(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setNameError('');
    setSubmitError('');

    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError('Role name is required.');
      return;
    }

    setSubmitting(true);
    try {
      await adminApi.createRole({ name: trimmedName, description: description.trim() });
      onCreated();
      onClose();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to create role. Please try again.';
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Role" size="md">
      <form onSubmit={handleSubmit} noValidate>
        {submitError && (
          <div className="mb-4">
            <ErrorBanner message={submitError} />
          </div>
        )}

        <Input
          label="Role Name"
          name="roleName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Space Manager"
          icon="badge"
          required
          error={nameError}
        />

        <Input
          label="Description"
          name="roleDescription"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description of this role's purpose"
          icon="description"
        />

        <div className="flex justify-end gap-2 mt-2">
          <Button variant="outline" size="md" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" size="md" type="submit" isLoading={submitting}>
            <span className="material-symbols-outlined text-xl">add</span>
            Create Role
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// ---------------------------------------------------------------------------
// Manage Permissions Modal
// ---------------------------------------------------------------------------
const ManagePermissionsModal = ({ isOpen, onClose, role, allPermissions }) => {
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [loadingPerms, setLoadingPerms] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Fetch this role's currently assigned permissions whenever the modal opens
  useEffect(() => {
    if (!isOpen || !role) return;

    let cancelled = false;
    setLoadingPerms(true);
    setLoadError('');
    setSaveError('');
    setSaveSuccess(false);

    adminApi
      .getRolePermissions(role.id)
      .then((res) => {
        if (cancelled) return;
        const perms = collectionFrom(res, ['permissions', 'items']);
        setSelectedIds(new Set(perms.map((p) => p.id)));
      })
      .catch((err) => {
        if (cancelled) return;
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          'Failed to load role permissions.';
        setLoadError(msg);
      })
      .finally(() => {
        if (!cancelled) setLoadingPerms(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, role]);

  const togglePermission = (permId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(permId)) {
        next.delete(permId);
      } else {
        next.add(permId);
      }
      return next;
    });
  };

  const handleSave = async () => {
    setSaveError('');
    setSaveSuccess(false);
    setSaving(true);
    try {
      await adminApi.setRolePermissions(role.id, Array.from(selectedIds));
      setSaveSuccess(true);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to save permissions. Please try again.';
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  };

  // Group permissions by a simple namespace derived from action or name
  // (e.g. "bookings.approve" → "bookings", "MANAGE_SPACES" → "spaces"). Falls back to "general".
  const groupedPermissions = allPermissions.reduce((acc, perm) => {
    const raw = perm.action || perm.name || '';
    const parts = raw.includes('.') ? raw.split('.') : raw.split('_');
    const group = (parts.length > 1 ? parts[0] : 'general').toLowerCase();
    if (!acc[group]) acc[group] = [];
    acc[group].push(perm);
    return acc;
  }, {});

  const groups = Object.keys(groupedPermissions).sort();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={role ? `Permissions — ${role.name}` : 'Manage Permissions'}
      size="lg"
    >
      <div className="flex flex-col gap-4">
        {/* Load error */}
        {loadError && <ErrorBanner message={loadError} />}

        {/* Save success */}
        {saveSuccess && (
          <div className="flex items-center gap-2 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
            <span className="material-symbols-outlined text-xl text-green-600">check_circle</span>
            Permissions saved successfully.
          </div>
        )}

        {/* Save error */}
        {saveError && <ErrorBanner message={saveError} />}

        {/* Permission list */}
        {loadingPerms ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-8 bg-surface-container-high rounded-lg animate-pulse" />
            ))}
          </div>
        ) : allPermissions.length === 0 ? (
          <p className="text-sm text-on-surface-variant text-center py-8">
            No permissions are defined in the system.
          </p>
        ) : (
          <div className="max-h-[400px] overflow-y-auto space-y-5 pr-1">
            {groups.map((group) => (
              <div key={group}>
                {/* Group heading */}
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                  {group.replace(/_/g, ' ')}
                </p>
                <div className="space-y-1.5">
                  {groupedPermissions[group].map((perm) => {
                    const checked = selectedIds.has(perm.id);
                    return (
                      <label
                        key={perm.id}
                        className={`flex items-start gap-3 rounded-xl px-3 py-2.5 cursor-pointer border transition-colors select-none ${
                          checked
                            ? 'bg-primary/5 border-primary/30'
                            : 'bg-surface-container-lowest border-outline-variant hover:bg-surface-container-low'
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="mt-0.5 w-4 h-4 accent-primary cursor-pointer flex-shrink-0"
                          checked={checked}
                          onChange={() => togglePermission(perm.id)}
                          disabled={loadingPerms || saving}
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-on-surface leading-tight font-mono text-xs">
                            {perm.action || perm.name || 'Permission'}
                          </p>
                          {perm.description && (
                            <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
                              {perm.description}
                            </p>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-outline-variant">
          <p className="text-xs text-on-surface-variant">
            {selectedIds.size} permission{selectedIds.size !== 1 ? 's' : ''} selected
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="md" onClick={onClose} disabled={saving}>
              Close
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleSave}
              isLoading={saving}
              disabled={loadingPerms}
            >
              <span className="material-symbols-outlined text-xl">save</span>
              Save Permissions
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

// ---------------------------------------------------------------------------
// Role Card
// ---------------------------------------------------------------------------
const RoleCard = ({ role, permissionCount, onManage, onDelete, deletingId }) => {
  const isDeleting = deletingId === role.id;

  const handleDelete = () => {
    if (
      window.confirm(
        `Are you sure you want to delete the "${role.name}" role? This action cannot be undone.`
      )
    ) {
      onDelete(role.id);
    }
  };

  return (
    <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-5 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="font-headline text-lg font-semibold text-on-surface leading-tight truncate">
            {role.name}
          </h3>
          {role.description ? (
            <p className="text-sm text-on-surface-variant mt-1 leading-relaxed line-clamp-2">
              {role.description}
            </p>
          ) : (
            <p className="text-sm text-on-surface-variant/50 mt-1 italic">No description</p>
          )}
        </div>

        {/* Permission count badge */}
        <div className="flex-shrink-0">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20 whitespace-nowrap">
            <span className="material-symbols-outlined text-[13px]">lock</span>
            {permissionCount ?? '—'} permission{permissionCount !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex items-center gap-2">
        <Button variant="secondary" size="sm" onClick={() => onManage(role)}>
          <span className="material-symbols-outlined text-xl">manage_accounts</span>
          Manage Permissions
        </Button>
        <Button
          variant="danger"
          size="sm"
          onClick={handleDelete}
          isLoading={isDeleting}
          className="!px-2.5"
          title="Delete role"
        >
          <span className="material-symbols-outlined text-xl">delete</span>
        </Button>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
export const RolesPermissions = () => {
  // ── Roles ──────────────────────────────────────────────────────────────────
  const [roles, setRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [rolesError, setRolesError] = useState('');

  // ── Permissions (global list) ──────────────────────────────────────────────
  const [allPermissions, setAllPermissions] = useState([]);
  const [permsLoading, setPermsLoading] = useState(true);

  // ── Per-role permission counts (fetched eagerly) ───────────────────────────
  const [permCounts, setPermCounts] = useState({}); // { [roleId]: number }

  // ── Modals ─────────────────────────────────────────────────────────────────
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [manageModalOpen, setManageModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);

  // ── Delete ─────────────────────────────────────────────────────────────────
  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState('');

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------
  const fetchRoles = useCallback(async () => {
    setRolesLoading(true);
    setRolesError('');
    try {
      const res = await adminApi.getRoles();
      const fetched = collectionFrom(res, ['roles', 'items']);
      setRoles(fetched);
      return fetched;
    } catch (err) {
      const msg =
        err?.response?.data?.message || err?.message || 'Failed to load roles.';
      setRolesError(msg);
      return [];
    } finally {
      setRolesLoading(false);
    }
  }, []);

  const fetchPermissions = useCallback(async () => {
    setPermsLoading(true);
    try {
      const res = await adminApi.getPermissions();
      setAllPermissions(collectionFrom(res, ['permissions', 'items']));
    } catch {
      // non-critical — silently ignore, the modal will still open
    } finally {
      setPermsLoading(false);
    }
  }, []);

  // Fetch permission counts for all roles (best-effort, parallel)
  const fetchPermCounts = useCallback(async (roleList) => {
    if (!roleList.length) return;
    const results = await Promise.allSettled(
      roleList.map((r) =>
        adminApi.getRolePermissions(r.id).then((res) => ({
          id: r.id,
          count: collectionFrom(res, ['permissions', 'items']).length,
        }))
      )
    );
    const counts = {};
    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        counts[result.value.id] = result.value.count;
      }
    });
    setPermCounts(counts);
  }, []);

  // Initial load
  useEffect(() => {
    fetchPermissions();
    fetchRoles().then((fetched) => {
      if (fetched.length) fetchPermCounts(fetched);
    });
  }, [fetchRoles, fetchPermissions, fetchPermCounts]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handleRoleCreated = useCallback(() => {
    fetchRoles().then((fetched) => {
      if (fetched.length) fetchPermCounts(fetched);
    });
  }, [fetchRoles, fetchPermCounts]);

  const handleManage = useCallback((role) => {
    setSelectedRole(role);
    setManageModalOpen(true);
  }, []);

  // After the manage modal closes, refresh the counts for the edited role
  const handleManageClose = useCallback(() => {
    setManageModalOpen(false);
    if (selectedRole) {
      adminApi
        .getRolePermissions(selectedRole.id)
        .then((res) => {
          const count = collectionFrom(res, ['permissions', 'items']).length;
          setPermCounts((prev) => ({ ...prev, [selectedRole.id]: count }));
        })
        .catch(() => {});
    }
  }, [selectedRole]);

  const handleDelete = useCallback(
    async (roleId) => {
      setDeletingId(roleId);
      setDeleteError('');
      try {
        await adminApi.deleteRole(roleId);
        const updated = roles.filter((r) => r.id !== roleId);
        setRoles(updated);
        setPermCounts((prev) => {
          const next = { ...prev };
          delete next[roleId];
          return next;
        });
      } catch (err) {
        const msg =
          err?.response?.data?.message || err?.message || 'Failed to delete role.';
        setDeleteError(msg);
      } finally {
        setDeletingId(null);
      }
    },
    [roles]
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="max-w-4xl mx-auto">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="mb-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-on-surface-variant mb-2">
          <span>Operations</span>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-on-surface font-medium">Roles &amp; Permissions</span>
        </nav>

        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-headline text-3xl font-normal text-on-surface">
              Roles &amp; Permissions
            </h1>
            <p className="text-sm text-on-surface-variant mt-1">
              Define roles and control what each role can access within the platform.
            </p>
          </div>
          <Button variant="primary" size="md" onClick={() => setCreateModalOpen(true)}>
            <span className="material-symbols-outlined text-xl">add</span>
            Create Role
          </Button>
        </div>
      </div>

      {/* ── Delete error banner ─────────────────────────────────────────────── */}
      {deleteError && (
        <div className="mb-4">
          <ErrorBanner message={deleteError} onRetry={() => setDeleteError('')} />
        </div>
      )}

      {/* ── Roles error banner ──────────────────────────────────────────────── */}
      {rolesError && !rolesLoading && (
        <div className="mb-4">
          <ErrorBanner message={rolesError} onRetry={handleRoleCreated} />
        </div>
      )}

      {/* ── Roles list ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4">
        {rolesLoading ? (
          // Show 3 skeleton cards while loading
          [...Array(3)].map((_, i) => <RoleSkeletonCard key={i} />)
        ) : roles.length === 0 && !rolesError ? (
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant">
            <EmptyState
              icon="shield_person"
              title="No roles yet"
              description="Get started by creating your first role, then assign the appropriate permissions to it."
              action={
                <Button variant="primary" size="md" onClick={() => setCreateModalOpen(true)}>
                  <span className="material-symbols-outlined text-xl">add</span>
                  Create First Role
                </Button>
              }
            />
          </div>
        ) : (
          roles.map((role) => (
            <RoleCard
              key={role.id}
              role={role}
              permissionCount={permCounts[role.id]}
              onManage={handleManage}
              onDelete={handleDelete}
              deletingId={deletingId}
            />
          ))
        )}
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      <CreateRoleModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={handleRoleCreated}
      />

      <ManagePermissionsModal
        isOpen={manageModalOpen}
        onClose={handleManageClose}
        role={selectedRole}
        allPermissions={allPermissions}
        permsLoading={permsLoading}
      />
    </div>
  );
};

export default RolesPermissions;
