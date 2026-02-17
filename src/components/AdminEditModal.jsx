import { useState } from 'react';
import { supabase } from '../supabase';
import { amenityLabels } from '../data/saunas';

async function geocodeAddress(address) {
  if (window.google?.maps?.Geocoder) {
    const geocoder = new window.google.maps.Geocoder();
    try {
      const response = await geocoder.geocode({ address });
      if (response.results.length > 0) {
        const location = response.results[0].geometry.location;
        return { lat: location.lat(), lng: location.lng() };
      }
    } catch {
      // fall through
    }
  }
  return { lat: null, lng: null };
}

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

export default function AdminEditModal({ sauna, onClose, onSaunaUpdated }) {
  const [name, setName] = useState(sauna.name || '');
  const [address, setAddress] = useState(sauna.address || '');
  const [city, setCity] = useState(sauna.city_slug || 'nyc');
  const [neighborhood, setNeighborhood] = useState(sauna.neighborhood || '');
  const [price, setPrice] = useState(sauna.price || '');
  const [selectedTypes, setSelectedTypes] = useState(sauna.types || []);
  const [selectedAmenities, setSelectedAmenities] = useState(sauna.amenities || []);
  const [hours, setHours] = useState(sauna.hours || '');
  const [websiteUrl, setWebsiteUrl] = useState(sauna.website_url || '');
  const [description, setDescription] = useState(sauna.description || '');
  const [rating, setRating] = useState(sauna.rating ?? '');
  const [ratingCount, setRatingCount] = useState(sauna.rating_count ?? sauna.ratingCount ?? '');
  const [genderPolicy, setGenderPolicy] = useState(sauna.gender_policy || '');
  const [pricingOptions, setPricingOptions] = useState(sauna.pricing_options || []);
  const [photos, setPhotos] = useState(sauna.photos || []);
  const [photosToDelete, setPhotosToDelete] = useState([]);
  const [newPhotoFiles, setNewPhotoFiles] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

  const handleRemovePhoto = (url) => {
    setPhotos((prev) => prev.filter((p) => p !== url));
    setPhotosToDelete((prev) => [...prev, url]);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setNewPhotoFiles((prev) => [...prev, ...files]);
  };

  const removeNewPhoto = (index) => {
    setNewPhotoFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const addPricingOption = () => {
    setPricingOptions((prev) => [
      ...prev,
      { duration: '', price: '', description: '' },
    ]);
  };

  const updatePricingOption = (index, field, value) => {
    setPricingOptions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const removePricingOption = (index) => {
    setPricingOptions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Upload new photos
      const uploadedUrls = [];
      for (const file of newPhotoFiles) {
        const fileName = `${sauna.id}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('sauna-photos')
          .upload(`public/${fileName}`, file, {
            cacheControl: '3600',
            upsert: false,
          });
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('sauna-photos')
          .getPublicUrl(`public/${fileName}`);
        uploadedUrls.push(publicUrl);
      }

      // Delete removed photos from storage
      for (const url of photosToDelete) {
        const pathMatch = url.match(/sauna-photos\/(.+)$/);
        if (pathMatch) {
          await supabase.storage.from('sauna-photos').remove([pathMatch[1]]);
        }
      }

      // Re-geocode only if address changed
      let lat = sauna.lat;
      let lng = sauna.lng;
      if (address !== sauna.address) {
        const coords = await geocodeAddress(address);
        lat = coords.lat;
        lng = coords.lng;
      }

      const finalPhotos = [...photos, ...uploadedUrls];

      const { error: updateError } = await supabase
        .from('saunas')
        .update({
          name,
          address,
          city_slug: city,
          neighborhood: neighborhood || null,
          price: price || null,
          types: selectedTypes.length > 0 ? selectedTypes : null,
          amenities: selectedAmenities.length > 0 ? selectedAmenities : [],
          hours: hours || null,
          website_url: websiteUrl || null,
          description: description || null,
          gender_policy: genderPolicy || null,
          rating: rating !== '' ? parseFloat(rating) : null,
          rating_count: ratingCount !== '' ? parseInt(ratingCount) : null,
          pricing_options: pricingOptions.filter((o) => o.price !== ''),
          photos: finalPhotos,
          lat,
          lng,
        })
        .eq('id', sauna.id);

      if (updateError) throw updateError;

      setSuccess(true);
      onSaunaUpdated?.();
      setTimeout(() => onClose(), 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setError('');
    setLoading(true);

    try {
      // Delete all photos from storage
      if (photos.length > 0) {
        for (const url of photos) {
          const pathMatch = url.match(/sauna-photos\/(.+)$/);
          if (pathMatch) {
            await supabase.storage.from('sauna-photos').remove([pathMatch[1]]);
          }
        }
      }

      // Delete the sauna record
      const { error: deleteError } = await supabase
        .from('saunas')
        .delete()
        .eq('id', sauna.id);

      if (deleteError) throw deleteError;

      setSuccess(true);
      onSaunaUpdated?.();
      setTimeout(() => onClose(), 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 p-5 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-serif text-xl">Edit Sauna</h2>
          <button
            onClick={onClose}
            className="text-warm-gray hover:text-charcoal text-xl leading-none"
          >
            &times;
          </button>
        </div>

        {showDeleteConfirm ? (
          <div className="text-center py-8">
            <p className="text-charcoal font-medium text-lg mb-4">Delete this sauna?</p>
            <p className="text-warm-gray text-sm mb-6">This action cannot be undone.</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={loading}
                className="px-4 py-2 border border-light-border rounded text-sm hover:bg-hover-bg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="px-4 py-2 bg-accent-red text-white rounded text-sm hover:bg-accent-red/90 transition-colors disabled:opacity-50 font-medium"
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        ) : success ? (
          <div className="text-center py-8">
            <p className="text-charcoal font-medium text-lg mb-1">Saved!</p>
            <p className="text-warm-gray text-sm">Changes have been applied.</p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
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
                  <option value="chicago">Chicago</option>
                  <option value="la">Los Angeles</option>
                  <option value="seattle">Seattle</option>
                  <option value="minneapolis">Minneapolis</option>
                  <option value="portland">Portland</option>
                  <option value="denver">Denver</option>
                  <option value="houston">Houston</option>
                </select>
              </div>
              <div className="flex-1">
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

            {/* Pricing Options */}
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-warm-gray font-medium mb-2">
                Pricing Options
              </label>
              <div className="space-y-2 mb-2">
                {pricingOptions.map((option, index) => (
                  <div key={index} className="flex gap-2 items-end">
                    <input
                      type="text"
                      placeholder="Duration (e.g. 60 min)"
                      value={option.duration}
                      onChange={(e) =>
                        updatePricingOption(index, 'duration', e.target.value)
                      }
                      className="flex-1 px-3 py-2 border border-light-border rounded text-sm focus:border-charcoal focus:outline-none"
                    />
                    <input
                      type="number"
                      placeholder="Price"
                      value={option.price}
                      onChange={(e) =>
                        updatePricingOption(index, 'price', e.target.value)
                      }
                      className="w-24 px-3 py-2 border border-light-border rounded text-sm focus:border-charcoal focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Description"
                      value={option.description}
                      onChange={(e) =>
                        updatePricingOption(index, 'description', e.target.value)
                      }
                      className="flex-1 px-3 py-2 border border-light-border rounded text-sm focus:border-charcoal focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => removePricingOption(index)}
                      className="px-2.5 py-2 text-warm-gray hover:text-accent-red transition-colors"
                      title="Remove option"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addPricingOption}
                className="px-3 py-1.5 border border-light-border rounded text-[12px] text-charcoal hover:bg-hover-bg transition-colors"
              >
                + Add Pricing Option
              </button>
            </div>

            {/* Rating & Rating Count */}
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
                className="w-full px-3 py-2.5 border border-light-border rounded text-sm focus:border-charcoal focus:outline-none"
              />
            </div>

            {/* Gender Policy */}
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

            {/* Description */}
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

            {/* Photos */}
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-warm-gray font-medium mb-2">
                Photos
              </label>

              {/* Existing photos */}
              {photos.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {photos.map((url) => (
                    <div key={url} className="relative group">
                      <img
                        src={url}
                        alt=""
                        className="w-full h-20 object-cover rounded"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(url)}
                        className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* New photo previews */}
              {newPhotoFiles.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {newPhotoFiles.map((file, i) => (
                    <div key={i} className="relative group">
                      <img
                        src={URL.createObjectURL(file)}
                        alt=""
                        className="w-full h-20 object-cover rounded ring-2 ring-accent-red/30"
                      />
                      <button
                        type="button"
                        onClick={() => removeNewPhoto(i)}
                        className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload button */}
              <label className="inline-block cursor-pointer">
                <span className="px-3 py-1.5 border border-light-border rounded text-[12px] text-charcoal hover:bg-hover-bg transition-colors">
                  + Upload Photos
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </label>

              {(photosToDelete.length > 0 || newPhotoFiles.length > 0) && (
                <p className="text-[11px] text-warm-gray mt-2">
                  {photos.length} existing
                  {photosToDelete.length > 0 && `, ${photosToDelete.length} to remove`}
                  {newPhotoFiles.length > 0 && `, ${newPhotoFiles.length} to upload`}
                </p>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 bg-charcoal text-white text-sm rounded hover:bg-charcoal/90 transition-colors disabled:opacity-50 font-medium"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={loading}
                className="px-4 py-2.5 bg-accent-red/10 text-accent-red text-sm rounded hover:bg-accent-red/20 transition-colors disabled:opacity-50 font-medium border border-accent-red/30"
              >
                Delete
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
