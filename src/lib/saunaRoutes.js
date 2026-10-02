import { isDiscoverableSauna } from './publicSaunas.js';

export function saunaPath(sauna) {
  const slug = (sauna.name || 'sauna').normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'sauna';
  return `/city/${sauna.city_slug}/sauna/${slug}-${sauna.id}`;
}

export function saunaIdFromSlug(slug = '') {
  return slug.match(/-(\d+)$/)?.[1] || null;
}

export function saunaRoutes(rows) {
  return [...new Set(rows.filter(isDiscoverableSauna).map(saunaPath))];
}
