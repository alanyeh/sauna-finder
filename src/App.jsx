import { Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';

const HomePage = lazy(() => import('./pages/HomePage'));
const ReviewPage = lazy(() => import('./pages/ReviewPage'));
const CityPage = lazy(() => import('./pages/CityPage'));
const SaunaPage = lazy(() => import('./pages/SaunaPage'));

function App() {
  return (
    <Suspense fallback={<p className="p-8 text-warm-gray" role="status">Loading saunas…</p>}>
      <Routes>
        <Route path="/admin/review" element={<ReviewPage />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/city/:citySlug" element={<CityPage />} />
        <Route path="/city/:citySlug/sauna/:saunaSlug" element={<SaunaPage />} />
      </Routes>
    </Suspense>
  );
}

export default App;
