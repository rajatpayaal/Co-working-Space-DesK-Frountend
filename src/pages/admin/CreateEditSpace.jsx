import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import spacesApi from '../../api/spacesApi';
import { unwrapResponse } from '../../api/responseHelpers';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { PageLoader } from '../../components/common/LoadingSpinner';

// ─── Initial form state ────────────────────────────────────────────────────────
const INITIAL_FORM = {
  name: '',
  type: '',
  description: '',
  capacity: '',
  pricePerHour: '',
  location: '',
  amenities: '',
  isActive: true,
};

// ─── Validation ────────────────────────────────────────────────────────────────
function validate(fields) {
  const errs = {};
  if (!fields.name.trim()) errs.name = 'Name is required.';
  if (fields.capacity === '' || fields.capacity === null) {
    errs.capacity = 'Capacity is required.';
  } else if (Number(fields.capacity) < 1) {
    errs.capacity = 'Capacity must be at least 1.';
  }
  if (fields.pricePerHour === '' || fields.pricePerHour === null) {
    errs.pricePerHour = 'Price per hour is required.';
  } else if (Number(fields.pricePerHour) < 0) {
    errs.pricePerHour = 'Price cannot be negative.';
  }
  return errs;
}

// ─── Component ─────────────────────────────────────────────────────────────────
export const CreateEditSpace = () => {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();

  // ── State ──────────────────────────────────────────────────────────────────
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [spaceName, setSpaceName] = useState('');   // for page title in edit mode

  const [loadingSpace, setLoadingSpace] = useState(isEditMode);
  const [loadError, setLoadError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // ── Fetch space (edit mode) ────────────────────────────────────────────────
  const fetchSpace = useCallback(async () => {
    setLoadingSpace(true);
    setLoadError(null);
    try {
      const response = await spacesApi.getAdminById(id);
      const space = unwrapResponse(response);
      setSpaceName(space.name ?? '');
      setForm({
        name: space.name ?? '',
        type: space.type ?? '',
        description: space.description ?? '',
        capacity: space.capacity ?? '',
        pricePerHour: space.pricePerHour ?? '',
        location: space.location ?? '',
        amenities: Array.isArray(space.amenities) ? space.amenities.join(', ') : '',
        isActive: space.isActive ?? true,
      });
    } catch (err) {
      setLoadError(
        err?.response?.data?.message ||
          err?.message ||
          'Failed to load space. Please try again.'
      );
    } finally {
      setLoadingSpace(false);
    }
  }, [id]);

  useEffect(() => {
    if (isEditMode) fetchSpace();
  }, [isEditMode, fetchSpace]);

  // ── Field handlers ─────────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Clear field-level error on change
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);

    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const payload = {
      name: form.name.trim(),
      type: form.type?.trim() || undefined,
      description: form.description.trim() || undefined,
      capacity: Number(form.capacity),
      pricePerHour: Number(form.pricePerHour),
      location: form.location?.trim() || undefined,
      amenities: form.amenities
        ? form.amenities.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
      isActive: form.isActive,
    };

    setSubmitting(true);
    try {
      if (isEditMode) {
        await spacesApi.update(id, payload);
      } else {
        await spacesApi.create(payload);
      }
      navigate('/admin/spaces');
    } catch (err) {
      setSubmitError(
        err?.response?.data?.message ||
          err?.message ||
          'Something went wrong. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading skeleton (edit mode fetch) ────────────────────────────────────
  if (loadingSpace) {
    return <PageLoader message="Loading space details…" />;
  }

  // ── Load error banner ─────────────────────────────────────────────────────
  if (loadError) {
    return (
      <div className="max-w-2xl mx-auto py-10">
        <div className="flex items-start gap-3 bg-error/10 border border-error/30 rounded-xl px-5 py-4">
          <span className="material-symbols-outlined text-error text-xl mt-0.5 flex-shrink-0">
            error
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-error mb-1">Failed to load space</p>
            <p className="text-sm text-on-surface-variant">{loadError}</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchSpace}>
            <span className="material-symbols-outlined text-[16px]">refresh</span>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // ── Page title & breadcrumb labels ─────────────────────────────────────────
  const pageTitle = isEditMode ? `Edit Space — ${spaceName}` : 'Create New Space';
  const breadcrumbLeaf = isEditMode ? 'Edit' : 'Create';

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* ── Breadcrumb ───────────────────────────────────────────────────────── */}
      <nav className="flex items-center gap-1.5 text-xs text-on-surface-variant" aria-label="Breadcrumb">
        <span className="material-symbols-outlined text-[15px]">workspaces</span>
        <span className="font-medium">Operations</span>
        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
        <Link
          to="/admin/spaces"
          className="font-medium hover:text-primary transition-colors"
        >
          Spaces
        </Link>
        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
        <span className="font-semibold text-on-surface">{breadcrumbLeaf}</span>
      </nav>

      {/* ── Page heading ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-primary text-xl">
            {isEditMode ? 'edit' : 'add_circle'}
          </span>
        </div>
        <div>
          <h1 className="font-headline text-2xl text-on-surface leading-tight">{pageTitle}</h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            {isEditMode
              ? 'Update the details for this co-working space.'
              : 'Fill in the details to add a new co-working space.'}
          </p>
        </div>
      </div>

      {/* ── Submit error banner ───────────────────────────────────────────────── */}
      {submitError && (
        <div className="flex items-start gap-3 bg-error/10 border border-error/30 rounded-xl px-5 py-4">
          <span className="material-symbols-outlined text-error text-xl mt-0.5 flex-shrink-0">
            error
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-error mb-0.5">
              {isEditMode ? 'Could not update space' : 'Could not create space'}
            </p>
            <p className="text-sm text-on-surface-variant">{submitError}</p>
          </div>
          <button
            type="button"
            className="text-on-surface-variant hover:text-on-surface transition-colors flex-shrink-0 mt-0.5"
            onClick={() => setSubmitError(null)}
            aria-label="Dismiss error"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}

      {/* ── Form card ────────────────────────────────────────────────────────── */}
      <form
        onSubmit={handleSubmit}
        noValidate
        className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 space-y-5"
      >
        {/* Section header */}
        <div className="pb-3 border-b border-outline-variant">
          <h2 className="text-sm font-semibold text-on-surface">Space Information</h2>
          <p className="text-xs text-on-surface-variant mt-0.5">
            All fields marked <span className="text-error font-semibold">*</span> are required.
          </p>
        </div>

        {/* ── Name ──────────────────────────────────────────────────────────── */}
        <Input
          label="Name"
          name="name"
          id="space-name"
          type="text"
          required
          placeholder="e.g. Sunrise Lounge"
          icon="meeting_room"
          value={form.name}
          onChange={handleChange}
          error={errors.name}
          autoFocus={!isEditMode}
        />

        {/* ── Description ───────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-1.5 mb-4">
          <label
            htmlFor="space-description"
            className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant"
          >
            Description
          </label>
          <div className="relative">
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant absolute top-3 left-3.5 pointer-events-none">
              description
            </span>
            <textarea
              id="space-description"
              name="description"
              rows={4}
              placeholder="Describe the space, its features, location, amenities…"
              value={form.description}
              onChange={handleChange}
              className="w-full pl-10 pr-3.5 py-2.5 bg-surface-container-lowest border border-outline-variant focus:border-primary focus:ring-3 focus:ring-primary/15 rounded-xl text-sm text-on-surface placeholder-on-surface-variant/50 focus:outline-none transition resize-none"
            />
          </div>
        </div>

        {/* ── Type & Location ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5">
          <Input
            label="Space Type"
            name="type"
            id="space-type"
            type="text"
            placeholder="e.g. MEETING_ROOM, HOT_DESK, POD"
            icon="category"
            value={form.type}
            onChange={handleChange}
          />
          <Input
            label="Location / Area"
            name="location"
            id="space-location"
            type="text"
            placeholder="e.g. Floor 2, East Wing"
            icon="location_on"
            value={form.location}
            onChange={handleChange}
          />
        </div>

        {/* ── Amenities ──────────────────────────────────────────────────────── */}
        <Input
          label="Amenities (comma-separated)"
          name="amenities"
          id="space-amenities"
          type="text"
          placeholder="e.g. High-Speed Wi-Fi, 4K Display, Whiteboard, Ergonomic Chairs"
          icon="verified"
          value={form.amenities}
          onChange={handleChange}
        />

        {/* ── Capacity & Price (side-by-side on wider screens) ──────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5">
          <Input
            label="Capacity"
            name="capacity"
            id="space-capacity"
            type="number"
            required
            placeholder="e.g. 10"
            icon="group"
            min={1}
            step={1}
            value={form.capacity}
            onChange={handleChange}
            error={errors.capacity}
          />
          <Input
            label="Price per hour (₹)"
            name="pricePerHour"
            id="space-price"
            type="number"
            required
            placeholder="e.g. 500"
            icon="currency_rupee"
            min={0}
            step={0.01}
            value={form.pricePerHour}
            onChange={handleChange}
            error={errors.pricePerHour}
          />
        </div>

        {/* ── Active toggle ─────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3.5">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-xl text-on-surface-variant">
              {form.isActive ? 'toggle_on' : 'toggle_off'}
            </span>
            <div>
              <p className="text-sm font-semibold text-on-surface">Active</p>
              <p className="text-xs text-on-surface-variant">
                {form.isActive
                  ? 'Space is visible and bookable by members.'
                  : 'Space is hidden and cannot be booked.'}
              </p>
            </div>
          </div>

          {/* Pill toggle */}
          <label
            htmlFor="space-isActive"
            className="relative inline-flex items-center cursor-pointer flex-shrink-0 ml-4"
            aria-label="Toggle active status"
          >
            <input
              id="space-isActive"
              type="checkbox"
              name="isActive"
              checked={form.isActive}
              onChange={handleChange}
              className="sr-only peer"
            />
            <div
              className={`
                w-11 h-6 rounded-full transition-colors duration-200 ease-in-out
                peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40 peer-focus-visible:ring-offset-1
                ${form.isActive ? 'bg-primary' : 'bg-surface-container'}
                border
                ${form.isActive ? 'border-primary' : 'border-outline-variant'}
              `}
            >
              <span
                className={`
                  absolute top-[3px] left-[3px] w-[18px] h-[18px] rounded-full shadow-sm
                  transition-transform duration-200 ease-in-out
                  ${form.isActive ? 'translate-x-5 bg-on-primary' : 'translate-x-0 bg-on-surface-variant/50'}
                `}
              />
            </div>
          </label>
        </div>

        {/* ── Form footer ───────────────────────────────────────────────────── */}
        <div className="pt-4 border-t border-outline-variant flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={() => navigate('/admin/spaces')}
            disabled={submitting}
          >
            <span className="material-symbols-outlined text-[17px]">arrow_back</span>
            Cancel
          </Button>

          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={submitting}
          >
            {!submitting && (
              <span className="material-symbols-outlined text-[17px]">
                {isEditMode ? 'save' : 'add_circle'}
              </span>
            )}
            {submitting
              ? isEditMode
                ? 'Saving…'
                : 'Creating…'
              : 'Save Space'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateEditSpace;
