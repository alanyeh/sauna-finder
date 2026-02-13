import { useState } from 'react';
import { supabase } from '../supabase';
import { amenityLabels } from '../data/saunas';

const GOOGLE_MAPS_API_KEY = 'AIzaSyCh0m5quuG6m_KSicoisiGDAV7K1Rql8gI';

const SAUNA_TYPES = [
  'Modern Bathhouse',
  'Korean Spa',
  'Russian Banya',
  'Infrared Sauna',
  'Japanese Sauna',
  'Hotel Spa',
  'Gym Sauna',
];

const AMENITY_OPTIONS = Object.entries(amenityLabels).map(([value, label]) => ({
  value,
  label,
}));

function mapPriceLevel(priceLevel) {
  if (!priceLevel) return '';
  const levelMap = {
    'PRICE_LEVEL_INEXPENSIVE': '$',
    'PRICE_LEVEL_MODERATE': '$$',
    'PRICE_LEVEL_EXPENSIVE': '$$$',
    'PRICE_LEVEL_VERY_EXPENSIVE': '$$$',
  };
  return levelMap[priceLevel] || '';
}

function formatHours(regularOpeningHours) {
  if (!regularOpeningHours?.weekdayDescriptions) return '';
  return regularOpeningHours.weekdayDescriptions.join(', ');
}

function classifyType(place) {
  const text = [
    place.displayName?.text,
    place.editorialSummary?.text,
    ...(place.reviews || []).map(r => r.text?.text),
  ].filter(Boolean).join(' ').toLowerCase();

  const types = [];
  if (/infrared/.test(text)) types.push('Infrared Sauna');
  if (/korean|hwa|jjimjil/.test(text)) types.push('Korean Spa');
  if (/russian|banya/.test(text)) types.push('Russian Banya');
  if (/japanese|onsen|sento/.test(text)) types.push('Japanese Sauna');
  if (/hotel|spa|resort/.test(text)) types.push('Hotel Spa');
  if (/gym|fitness|athletic/.test(text)) types.push('Gym Sauna');
  if (types.length === 0) types.push('Modern Bathhouse');
  return types;
}

function inferAmenities(place) {
  const text = [
    place.displayName?.text,
    place.editorialSummary?.text,
    ...(place.reviews || []).map(r => r.text?.text),
  ].filter(Boolean).join(' ').toLowerCase();

  const amenities = [];
  if (/cold plunge|ice bath|cold tub/.test(text)) amenities.push('cold_plunge');
  if (/steam room|steam bath/.test(text)) amenities.push('steam_room');
  if (/massage/.test(text)) amenities.push('massage');
  if (/pool|swimming/.test(text)) amenities.push('pool');
  if (/co.?ed|mixed gender/.test(text)) amenities.push('coed');
  if (/private room|private suite/.test(text)) amenities.push('private');
  if (/dry sauna|finnish/.test(text)) amenities.push('dry_sauna');
  return amenities;
}

function urlToSearchQuery(url) {
  try {
    const domain = new URL(url).hostname.replace('www.', '');
    const name = domain
      .split('.')[0]
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/[-_]/g, ' ')
      .replace(/sauna|spa|bath|wellness/gi, ' $& ');
    return name.trim();
  } catch {
    return url;
  }
}

export default function AdminAddSaunaModal({ onClose, onSaunaAdded }) {
  const [activeTab, setActiveTab] = useState('url'); // 'url' | 'manual'
  const [step, setStep] = useState(1); // url tab: 1: search, 2: results, 3: form
  const [url, setUrl] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [city, setCity] = useState('nyc');
  const [results, setResults] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state (shared between URL step 3 and manual tab)
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [price, setPrice] = useState('');
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [hours, setHours] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [description, setDescription] = useState('');
  const [rating, setRating] = useState('');
  const [ratingCount, setRatingCount] = useState('');
  const [genderPolicy, setGenderPolicy] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [photos, setPhotos] = useState([]);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState(false);

  const resetForm = () => {
    setName(''); setAddress(''); setNeighborhood(''); setPrice('');
    setSelectedTypes([]); setSelectedAmenities([]); setHours('');
    setWebsiteUrl(''); setDescription(''); setRating(''); setRatingCount('');
    setGenderPolicy(''); setLat(''); setLng(''); setPhotos([]);
    setFormError('');
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setStep(1);
    setUrl(''); setSearchQuery(''); setResults([]);
    setSelectedPlace(null); setError('');
    resetForm();
  };

  const handleUrlChange = (e) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
    setSearchQuery(urlToSearchQuery(newUrl));
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError('Please enter a search query');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const response = await fetch(
        'https://places.googleapis.com/v1/places:searchText',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
            'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.websiteUri',
          },
          body: JSON.stringify({
            textQuery: `${searchQuery} ${city === 'nyc' ? 'New York' : city === 'sf' ? 'San Francisco' : city === 'chicago' ? 'Chicago' : city === 'la' ? 'Los Angeles' : 'Seattle'}`,
            maxResultCount: 5,
          }),
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(`API error: ${response.status} — ${errData?.error?.message || JSON.stringify(errData)}`);
      }
      const data = await response.json();
      setResults(data.places || []);
      if ((data.places || []).length === 0) {
        setError('No results found. Try a different search query.');
      } else {
        setStep(2);
      }
    } catch (err) {
      setError(err.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlace = async (place) => {
    setSelectedPlace(place);
    setError('');
    setFormLoading(true);

    try {
      const response = await fetch(
        `https://places.googleapis.com/v1/places/${place.id}`,
        {
          headers: {
            'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
            'X-Goog-FieldMask': 'displayName,formattedAddress,location,rating,userRatingCount,websiteUri,regularOpeningHours,priceLevel,editorialSummary,reviews,photos,types',
          },
        }
      );

      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const fullPlace = await response.json();

      setName(fullPlace.displayName?.text || '');
      setAddress(fullPlace.formattedAddress || '');
      setRating(fullPlace.rating?.toString() || '');
      setRatingCount(fullPlace.userRatingCount?.toString() || '');
      setWebsiteUrl(fullPlace.websiteUri || '');
      setHours(formatHours(fullPlace.regularOpeningHours));
      setPrice(mapPriceLevel(fullPlace.priceLevel));
      setSelectedTypes(classifyType(fullPlace));
      setSelectedAmenities(inferAmenities(fullPlace));
      setDescription(fullPlace.editorialSummary?.text || '');
      setLat(fullPlace.location?.latitude?.toString() || '');
      setLng(fullPlace.location?.longitude?.toString() || '');
      setStep(3);
    } catch (err) {
      setError(err.message || 'Failed to fetch place details');
    } finally {
      setFormLoading(false);
    }
  };

  const handleFetchPhotos = async () => {
    if (!selectedPlace?.id) return;
    setFormError('');
    setFormLoading(true);

    try {
      const response = await fetch(
        `https://places.googleapis.com/v1/places/${selectedPlace.id}`,
        {
          headers: {
            'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
            'X-Goog-FieldMask': 'photos',
          },
        }
      );

      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const data = await response.json();
      const photoRefs = (data.photos || []).slice(0, 5);

      if (photoRefs.length === 0) {
        setFormError('No photos found for this place');
        setFormLoading(false);
        return;
      }

      const uploadedUrls = [];
      for (let i = 0; i < photoRefs.length; i++) {
        const photoRef = photoRefs[i];
        try {
          const photoUrl = `https://places.googleapis.com/v1/${photoRef.name}/media?maxHeightPx=600&key=${GOOGLE_MAPS_API_KEY}`;
          const photoResponse = await fetch(photoUrl);
          if (!photoResponse.ok) continue;

          const blob = await photoResponse.blob();
          const fileName = `${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}.jpg`;

          const { error: uploadError } = await supabase.storage
            .from('sauna-photos')
            .upload(`public/${fileName}`, blob, {
              contentType: 'image/jpeg',
              cacheControl: '3600',
              upsert: false,
            });

          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
              .from('sauna-photos')
              .getPublicUrl(`public/${fileName}`);
            uploadedUrls.push(publicUrl);
          }
        } catch {
          // Continue with next photo on error
        }
      }

      setPhotos(uploadedUrls);
      setFormError(uploadedUrls.length > 0 ? '' : 'Failed to upload photos');
    } catch (err) {
      setFormError(err.message || 'Failed to fetch photos');
    } finally {
      setFormLoading(false);
    }
  };

  const toggleType = (type) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const toggleAmenity = (amenity) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    try {
      const { error: insertError } = await supabase
        .from('saunas')
        .insert([
          {
            name,
            address,
            city_slug: city,
            neighborhood: neighborhood || null,
            lat: lat !== '' ? parseFloat(lat) : null,
            lng: lng !== '' ? parseFloat(lng) : null,
            rating: rating !== '' ? parseFloat(rating) : null,
            rating_count: ratingCount !== '' ? parseInt(ratingCount) : null,
            price: price || null,
            types: selectedTypes.length > 0 ? selectedTypes : null,
            amenities: selectedAmenities.length > 0 ? selectedAmenities : [],
            hours: hours || null,
            website_url: websiteUrl || null,
            description: description || null,
            gender_policy: genderPolicy || null,
            place_id: selectedPlace?.id || null,
            photos: photos.length > 0 ? photos : [],
          },
        ]);

      if (insertError) throw insertError;

      setSuccess(true);
      onSaunaAdded?.();
      setTimeout(() => onClose(), 1200);
    } catch (err) {
      setFormError(err.message || 'Failed to save');
    } finally {
      setFormLoading(false);
    }
  };

  const showForm = activeTab === 'manual' || (activeTab === 'url' && step === 3);

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 p-5 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-xl">Add Sauna</h2>
          <button
            onClick={onClose}
            disabled={formLoading}
            className="text-warm-gray hover:text-charcoal text-xl leading-none disabled:opacity-50"
          >
            &times;
          </button>
        </div>

        {/* Tabs */}
        {!success && (
          <div className="flex border-b border-light-border mb-5 -mx-5 px-5">
            <button
              onClick={() => handleTabChange('url')}
              className={`pb-2.5 mr-6 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'url'
                  ? 'border-charcoal text-charcoal'
                  : 'border-transparent text-warm-gray hover:text-charcoal'
              }`}
            >
              By URL
            </button>
            <button
              onClick={() => handleTabChange('manual')}
              className={`pb-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'manual'
                  ? 'border-charcoal text-charcoal'
                  : 'border-transparent text-warm-gray hover:text-charcoal'
              }`}
            >
              Manually
            </button>
          </div>
        )}

        {/* Success state */}
        {success && (
          <div className="text-center py-8">
            <p className="text-charcoal font-medium text-lg mb-1">Saved!</p>
            <p className="text-warm-gray text-sm">New sauna has been added.</p>
          </div>
        )}

        {/* URL tab — Step 1: Search */}
        {!success && activeTab === 'url' && step === 1 && (
          <div className="space-y-4">
            {error && (
              <p className="text-accent-red text-[13px] bg-red-50 px-3 py-2 rounded">
                {error}
              </p>
            )}

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-warm-gray font-medium mb-1">
                Website URL
              </label>
              <input
                type="url"
                value={url}
                onChange={handleUrlChange}
                placeholder="https://example.com"
                className="w-full px-3 py-2.5 border border-light-border rounded text-sm focus:border-charcoal focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-warm-gray font-medium mb-1">
                City <span className="text-accent-red">*</span>
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2.5 border border-light-border bg-white text-charcoal text-sm rounded focus:border-charcoal focus:outline-none"
              >
                <option value="nyc">New York</option>
                <option value="sf">San Francisco</option>
                <option value="chicago">Chicago</option>
                <option value="la">Los Angeles</option>
                <option value="seattle">Seattle</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-warm-gray font-medium mb-1">
                Search Query
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Business name or keywords"
                className="w-full px-3 py-2.5 border border-light-border rounded text-sm focus:border-charcoal focus:outline-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 py-2.5 border border-light-border text-charcoal text-sm rounded hover:bg-hover-bg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSearch}
                disabled={loading}
                className="flex-1 py-2.5 bg-charcoal text-white text-sm rounded hover:bg-charcoal/90 transition-colors disabled:opacity-50 font-medium"
              >
                {loading ? 'Searching...' : 'Search Google Places'}
              </button>
            </div>
          </div>
        )}

        {/* URL tab — Step 2: Select result */}
        {!success && activeTab === 'url' && step === 2 && (
          <div className="space-y-2">
            {results.map((place) => (
              <button
                key={place.id}
                onClick={() => handleSelectPlace(place)}
                disabled={formLoading}
                className="w-full p-3 border border-light-border rounded text-left hover:bg-hover-bg transition-colors disabled:opacity-50 text-sm"
              >
                <div className="font-medium text-charcoal">{place.displayName?.text}</div>
                <div className="text-[12px] text-warm-gray">{place.formattedAddress}</div>
                {place.rating && (
                  <div className="text-[12px] text-warm-gray mt-1">
                    ★ {place.rating} ({place.userRatingCount || 0} reviews)
                  </div>
                )}
              </button>
            ))}

            <button
              onClick={() => { setStep(1); setResults([]); setError(''); }}
              className="w-full mt-4 py-2 border border-light-border text-charcoal text-sm rounded hover:bg-hover-bg transition-colors"
            >
              ← Search Again
            </button>
          </div>
        )}

        {/* Shared form — URL step 3 or Manual tab */}
        {!success && showForm && (
          <>
            {/* Back button for URL flow */}
            {activeTab === 'url' && (
              <button
                onClick={() => setStep(2)}
                disabled={formLoading}
                className="flex items-center gap-1 text-warm-gray hover:text-charcoal text-sm mb-4 disabled:opacity-50"
              >
                ← Back to results
              </button>
            )}

            {/* City selector for manual tab */}
            {activeTab === 'manual' && (
              <div className="mb-4">
                <label className="block text-[11px] uppercase tracking-wider text-warm-gray font-medium mb-1">
                  City <span className="text-accent-red">*</span>
                </label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2.5 border border-light-border bg-white text-charcoal text-sm rounded focus:border-charcoal focus:outline-none"
                >
                  <option value="nyc">New York</option>
                  <option value="sf">San Francisco</option>
                  <option value="chicago">Chicago</option>
                  <option value="la">Los Angeles</option>
                  <option value="seattle">Seattle</option>
                </select>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              {formError && (
                <p className="text-accent-red text-[13px] bg-red-50 px-3 py-2 rounded">
                  {formError}
                </p>
              )}

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-warm-gray font-medium mb-1">
                  Name <span className="text-accent-red">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 border border-light-border rounded text-sm focus:border-charcoal focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-warm-gray font-medium mb-1">
                  Address <span className="text-accent-red">*</span>
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 border border-light-border rounded text-sm focus:border-charcoal focus:outline-none"
                />
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-[11px] uppercase tracking-wider text-warm-gray font-medium mb-1">
                    Latitude
                  </label>
                  <input
                    type="number"
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    step="any"
                    placeholder="e.g. 40.7128"
                    className="w-full px-3 py-2.5 border border-light-border rounded text-sm focus:border-charcoal focus:outline-none"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-[11px] uppercase tracking-wider text-warm-gray font-medium mb-1">
                    Longitude
                  </label>
                  <input
                    type="number"
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                    step="any"
                    placeholder="e.g. -74.0060"
                    className="w-full px-3 py-2.5 border border-light-border rounded text-sm focus:border-charcoal focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-warm-gray font-medium mb-1">
                  Neighborhood
                </label>
                <input
                  type="text"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  className="w-full px-3 py-2.5 border border-light-border rounded text-sm focus:border-charcoal focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-warm-gray font-medium mb-1">
                  Price Range
                </label>
                <select
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-3 py-2.5 border border-light-border bg-white text-charcoal text-sm rounded focus:border-charcoal focus:outline-none"
                >
                  <option value="">Select price</option>
                  <option value="$">$ - Budget</option>
                  <option value="$$">$$ - Moderate</option>
                  <option value="$$$">$$$ - Upscale</option>
                </select>
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-[11px] uppercase tracking-wider text-warm-gray font-medium mb-1">
                    Rating (0-5)
                  </label>
                  <input
                    type="number"
                    value={rating}
                    onChange={(e) => setRating(e.target.value)}
                    min="0"
                    max="5"
                    step="0.1"
                    className="w-full px-3 py-2.5 border border-light-border rounded text-sm focus:border-charcoal focus:outline-none"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-[11px] uppercase tracking-wider text-warm-gray font-medium mb-1">
                    Rating Count
                  </label>
                  <input
                    type="number"
                    value={ratingCount}
                    onChange={(e) => setRatingCount(e.target.value)}
                    min="0"
                    className="w-full px-3 py-2.5 border border-light-border rounded text-sm focus:border-charcoal focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-warm-gray font-medium mb-2">
                  Type
                </label>
                <div className="flex flex-wrap gap-2">
                  {SAUNA_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => toggleType(type)}
                      className={`px-3 py-1.5 border rounded-full text-[12px] transition-all ${
                        selectedTypes.includes(type)
                          ? 'bg-charcoal text-white border-charcoal'
                          : 'bg-white text-charcoal border-light-border hover:bg-hover-bg hover:border-charcoal'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-warm-gray font-medium mb-2">
                  Amenities
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {AMENITY_OPTIONS.map((amenity) => (
                    <button
                      key={amenity.value}
                      type="button"
                      onClick={() => toggleAmenity(amenity.value)}
                      className={`flex items-center gap-2 px-2.5 py-2 border rounded text-[13px] transition-all ${
                        selectedAmenities.includes(amenity.value)
                          ? 'bg-charcoal text-white border-charcoal'
                          : 'bg-white text-charcoal border-light-border hover:bg-hover-bg hover:border-charcoal'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedAmenities.includes(amenity.value)}
                        onChange={() => {}}
                        className="w-4 h-4 cursor-pointer"
                      />
                      <span>{amenity.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-warm-gray font-medium mb-1">
                  Hours
                </label>
                <input
                  type="text"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  className="w-full px-3 py-2.5 border border-light-border rounded text-sm focus:border-charcoal focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-warm-gray font-medium mb-1">
                  Website
                </label>
                <input
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  className="w-full px-3 py-2.5 border border-light-border rounded text-sm focus:border-charcoal focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-warm-gray font-medium mb-1">
                  Gender Policy
                </label>
                <input
                  type="text"
                  value={genderPolicy}
                  onChange={(e) => setGenderPolicy(e.target.value)}
                  placeholder="e.g. Co-ed, Women only on Tuesdays"
                  className="w-full px-3 py-2.5 border border-light-border rounded text-sm focus:border-charcoal focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-warm-gray font-medium mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2.5 border border-light-border rounded text-sm focus:border-charcoal focus:outline-none resize-none"
                />
              </div>

              {/* Photos — fetch from Google only available in URL tab */}
              {activeTab === 'url' && (
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-warm-gray font-medium mb-2">
                    Photos
                  </label>

                  {photos.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 mb-3">
                      {photos.map((photoUrl) => (
                        <div key={photoUrl} className="relative">
                          <img
                            src={photoUrl}
                            alt=""
                            className="w-full h-20 object-cover rounded"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleFetchPhotos}
                    disabled={formLoading || !selectedPlace}
                    className="px-3 py-1.5 border border-light-border rounded text-[12px] text-charcoal hover:bg-hover-bg transition-colors disabled:opacity-50"
                  >
                    {formLoading && photos.length === 0 ? 'Fetching Photos...' : 'Fetch Photos from Google'}
                  </button>

                  {photos.length > 0 && (
                    <p className="text-[11px] text-warm-gray mt-2">
                      {photos.length} photo{photos.length !== 1 ? 's' : ''} ready to upload
                    </p>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={formLoading}
                  className="flex-1 py-2.5 border border-light-border text-charcoal text-sm rounded hover:bg-hover-bg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 py-2.5 bg-charcoal text-white text-sm rounded hover:bg-charcoal/90 transition-colors disabled:opacity-50 font-medium"
                >
                  {formLoading ? 'Saving...' : 'Save to Supabase'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
