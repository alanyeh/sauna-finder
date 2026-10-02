import { Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';

const HomePage = lazy(() => import('./pages/HomePage'));
const CityPage = lazy(() => import('./pages/CityPage'));

function App() {
  return (
    <Suspense fallback={<p className="p-8 text-warm-gray" role="status">Loading saunas…</p>}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/city/:citySlug" element={<CityPage />} />
      </Routes>
    </Suspense>
  );
}

export default App;
