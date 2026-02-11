import { useState } from 'react';

export default function PhotoCarousel({ photos, alt = 'Sauna', hideCounter = false }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!photos || photos.length === 0) {
    return null;
  }

  const goToPrevious = (e) => {
    e.stopPropagation();
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? photos.length - 1 : prevIndex - 1
    );
  };

  const goToNext = (e) => {
    e.stopPropagation();
    setCurrentIndex((prevIndex) =>
      prevIndex === photos.length - 1 ? 0 : prevIndex + 1
    );
  };

  return (
    <div className="relative w-full h-40 bg-gray-200 overflow-hidden flex items-center justify-center">
      <img
        src={photos[currentIndex]}
        alt={`${alt} ${currentIndex + 1}`}
        className="w-full h-full object-cover"
        style={{ maxWidth: '100%', maxHeight: '100%' }}
      />

      {photos.length > 1 && (
        <>
          {/* Previous Button */}
          <button
            onClick={goToPrevious}
            className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 sm:p-2 transition-colors z-10"
            aria-label="Previous photo"
          >
            <span className="text-lg sm:text-xl">‹</span>
          </button>

          {/* Next Button */}
          <button
            onClick={goToNext}
            className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 sm:p-2 transition-colors z-10"
            aria-label="Next photo"
          >
            <span className="text-lg sm:text-xl">›</span>
          </button>

          {/* Photo Counter */}
          {!hideCounter && (
            <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
              {currentIndex + 1}/{photos.length}
            </div>
          )}

          {/* Dot Indicators */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {photos.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(index);
                }}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? 'bg-white w-4'
                    : 'bg-white/50 hover:bg-white/75'
                }`}
                aria-label={`Go to photo ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
