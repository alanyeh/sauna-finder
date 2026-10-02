import { isPublicSauna, isHotelSauna } from './saunaQuality.js';

// Generic chains to hide from results (records stay in DB but are filtered out)
const HIDDEN_CHAINS = [
  // Gym chains
  'LA Fitness', 'Anytime Fitness', 'Crunch Fitness', 'YMCA', 'Life Time',
  // Budget/generic hotel chains
  'Holiday Inn', 'Comfort Suites', 'Comfort Inn', 'La Quinta',
  'Quality Inn', 'Best Western', 'Crowne Plaza', 'Courtyard by Marriott',
  'Delta Hotels', 'Sheraton', 'Hilton Americas', 'The Chatwal',
];

function isHiddenChain(sauna) {
  return HIDDEN_CHAINS.some(chain => sauna.name?.includes(chain));
}

export function isDiscoverableSauna(sauna) {
  return isPublicSauna(sauna) && (isHotelSauna(sauna) || !isHiddenChain(sauna));
}
