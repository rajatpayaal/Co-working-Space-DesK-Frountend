/**
 * Helpers to safely unwrap backend response envelopes used across the API:
 * Handles:
 * - Axios response object { data: { status, message, data } }
 * - Direct body { status, message, data }
 * - Paginated { data: [...], pagination: { total, page, limit, totalPages } }
 */

export const getResponseData = (response) => {
  if (!response) return null;
  // If Axios response, unwrap response.data
  const body = response.data !== undefined ? response.data : response;
  // If standard API envelope { status, data }, unwrap the data property
  if (body && typeof body === 'object' && !Array.isArray(body) && 'status' in body && 'data' in body) {
    return body.data;
  }
  return body;
};

export const unwrapResponse = (response) => {
  return getResponseData(response);
};

export const collectionFrom = (response, keys = []) => {
  const data = getResponseData(response);
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== 'object') return [];

  // 1. Direct array in specified keys
  for (const key of keys) {
    if (Array.isArray(data[key])) return data[key];
  }

  // 2. Direct array in common backend keys
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.spaces)) return data.spaces;
  if (Array.isArray(data.bookings)) return data.bookings;
  if (Array.isArray(data.users)) return data.users;
  if (Array.isArray(data.maintenance)) return data.maintenance;
  if (Array.isArray(data.roles)) return data.roles;
  if (Array.isArray(data.permissions)) return data.permissions;
  if (Array.isArray(data.items)) return data.items;

  // 3. Fallback search in top-level object properties
  for (const child of Object.values(data)) {
    if (Array.isArray(child)) return child;
  }

  return [];
};

export const paginationFrom = (response) => {
  const data = getResponseData(response);
  if (data && typeof data === 'object' && data.pagination) {
    return data.pagination;
  }
  const body = response?.data !== undefined ? response.data : response;
  if (body && typeof body === 'object' && body.pagination) {
    return body.pagination;
  }
  return { total: 0, page: 1, limit: 10, totalPages: 1 };
};

export const objectFrom = (response) => {
  const data = getResponseData(response);
  if (data && typeof data === 'object' && !Array.isArray(data)) return data;
  return {};
};

export default {
  getResponseData,
  unwrapResponse,
  collectionFrom,
  paginationFrom,
  objectFrom,
};
