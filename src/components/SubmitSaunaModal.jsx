import { useState } from 'react';
import { supabase } from '../supabase';
import { amenityLabels } from '../data/saunas';

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

export default function SubmitSaunaModal({ onClose, citySlug, onSaunaAdded }) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState(citySlug || 'nyc');
  const [neighborhoodInput, setNeighborhoodInput] = useState('');
  const [price, setPrice] = useState('');
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [hours, setHours] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const toggleType = (type) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const toggleAmenity = (amenity) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity)
        ? prev.filter((a) => a !== amenity)
        : [...prev, amenity]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error: insertError } = await supabase.from('saunas').insert({
        name,
        address,
        city_slug: city,
        neighborhood: neighborhoodInput || null,
        price: price || null,
        types: selectedTypes.length > 0 ? selectedTypes : null,
        amenities: selectedAmenities.length > 0 ? selectedAmenities : [],
        hours: hours || null,
        website_url: websiteUrl || null,
        description: description || null,
        rating: null,
        rating_count: null,
        photos: [],
        lat: null,
        lng: null,
      });

      if (insertError) throw insertError;

      setSuccess(true);
      onSaunaAdded?.();
      setTimeout(() => onClose(), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 p-6 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-serif text-xl">Submit a Sauna</h2>
          <button
            onClick={onClose}
            className="text-warm-gray hover:text-charcoal text-xl leading-none"
          >
            &times;
          </button>
        </div>

        {success ? (
          <div className="text-center py-8">
            <p className="text-charcoal font-medium text-lg mb-1">
              Thanks for your submission!
            </p>
            <p className="text-warm-gray text-sm">
              Your sauna has been added.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <p className="text-accent-red text-[13px] bg-red-50 px-3 py-2 rounded">
                {error}
              </p>
            )}

            {/* Name */}
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-warm-gray font-medium mb-1">
                Name <span className="text-accent-red">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g. Bathhouse NYC"
                className="w-full px-3 py-2.5 border border-light-border rounded text-sm focus:border-charcoal focus:outline-none"
              />
            </div>

            {/* Address */}
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-warm-gray font-medium mb-1">
                Address <span className="text-accent-red">*</span>
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                placeholder="e.g. 103 E 28th St, New York, NY"
                className="w-full px-3 py-2.5 border border-light-border rounded text-sm focus:border-charcoal focus:outline-none"
              />
            </div>

            {/* City & Neighborhood */}
            <div className="flex gap-3">
              <div className="flex-1">
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
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-[11px] uppercase tracking-wider text-warm-gray font-medium mb-1">
                  Neighborhood
                </label>
                <input
                  type="text"
                  value={neighborhoodInput}
                  onChange={(e) => setNeighborhoodInput(e.target.value)}
                  placeholder="e.g. Midtown"
                  className="w-full px-3 py-2.5 border border-light-border rounded text-sm focus:border-charcoal focus:outline-none"
                />
              </div>
            </div>

            {/* Price */}
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

            {/* Types */}
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

            {/* Amenities */}
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

            {/* Hours */}
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-warm-gray font-medium mb-1">
                Hours
              </label>
              <input
                type="text"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="e.g. Mon-Sun 9am-10pm"
                className="w-full px-3 py-2.5 border border-light-border rounded text-sm focus:border-charcoal focus:outline-none"
              />
            </div>

            {/* Website */}
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-warm-gray font-medium mb-1">
                Website
              </label>
              <input
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://"
                className="w-full px-3 py-2.5 border border-light-border rounded text-sm focus:border-charcoal focus:outline-none"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-warm-gray font-medium mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A brief description of this sauna..."
                rows={2}
                className="w-full px-3 py-2.5 border border-light-border rounded text-sm focus:border-charcoal focus:outline-none resize-none"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-charcoal text-white text-sm rounded hover:bg-charcoal/90 transition-colors disabled:opacity-50 font-medium"
            >
              {loading ? 'Submitting...' : 'Submit Sauna'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
