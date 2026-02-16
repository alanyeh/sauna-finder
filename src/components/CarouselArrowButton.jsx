export default function CarouselArrowButton({ direction, onClick, className = '', 'aria-label': ariaLabel }) {
  return (
    <button
      onClick={onClick}
      className={`bg-black/50 hover:bg-black/70 text-white rounded-full w-6 h-6 flex items-center justify-center transition-colors z-10 ${className}`}
      aria-label={ariaLabel || (direction === 'left' ? 'Previous' : 'Next')}
    >
      {direction === 'left' ? (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      )}
    </button>
  );
}
