# NYC Sauna Finder

A beautiful, minimal web app to discover saunas and bathhouses across New York City. Built with React, Tailwind CSS, and Google Maps.

## Features

- 🗺️ **Interactive Map View** - Explore 20+ NYC saunas on a custom-styled map
- 🔍 **Smart Filtering** - Filter by neighborhood, price range, and amenities
- 📱 **Fully Responsive** - Optimized for mobile, tablet, and desktop
- 🎨 **Japanese-Inspired Design** - Clean, minimal aesthetic matching Koriboshi brand
- ⚡ **Fast & Lightweight** - Built with Vite for instant dev server and optimized builds
- 🔄 **Easy Mobile Migration** - Component structure ready for React Native

## Tech Stack

- **React 18** - Modern React with hooks
- **Tailwind CSS 3** - Utility-first styling
- **Vite** - Next-generation build tool
- **Google Maps API** - Interactive mapping with @vis.gl/react-google-maps
- **100% TypeScript-ready** - Easy to migrate if needed

## Quick Start

### Prerequisites

- Node.js 16+ and npm installed
- Google Maps API key ([Get one here](https://console.cloud.google.com/google/maps-apis))

### Installation

1. **Extract and navigate to the project:**
   ```bash
   cd nyc-sauna-finder
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Add your Google Maps API key:**
   
   Open `src/components/Map.jsx` and replace:
   ```javascript
   const GOOGLE_MAPS_API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY';
   ```
   
   With your actual API key:
   ```javascript
   const GOOGLE_MAPS_API_KEY = 'AIzaSyB41DRUbKWJHPxaFjM...';
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   
   Visit `http://localhost:3000` - the app will automatically open!

## Project Structure

```
nyc-sauna-finder/
├── src/
│   ├── components/          # React components
│   │   ├── Header.jsx       # App header with logo
│   │   ├── Filters.jsx      # Filter controls
│   │   ├── SaunaCard.jsx    # Individual sauna card
│   │   ├── SaunaList.jsx    # List of sauna cards
│   │   ├── Map.jsx          # Google Maps integration
│   │   └── Sidebar.jsx      # Left sidebar container
│   ├── data/
│   │   └── saunas.js        # Sauna data (20+ locations)
│   ├── hooks/
│   │   └── useFilters.js    # Filter logic & state management
│   ├── App.jsx              # Main app component
│   ├── main.jsx             # React entry point
│   └── index.css            # Tailwind + custom styles
├── index.html               # HTML template
├── package.json             # Dependencies & scripts
├── vite.config.js           # Vite configuration
├── tailwind.config.js       # Tailwind theme config
└── postcss.config.js        # PostCSS config
```

## Available Scripts

- `npm run dev` - Start development server (http://localhost:3000)
- `npm run build` - Build for production (outputs to `/dist`)
- `npm run preview` - Preview production build locally

## Customization

### Adding More Saunas

Edit `src/data/saunas.js` and add new entries:

```javascript
{
  id: 21,
  name: "Your Sauna",
  address: "123 Main St, Brooklyn, NY",
  neighborhood: "Williamsburg",
  lat: 40.7128,
  lng: -74.0060,
  rating: 4.5,
  ratingCount: 100,
  price: "$$",
  types: ["Modern Bathhouse"],
  amenities: ["cold_plunge", "steam_room", "massage"],
  hours: "Daily: 9AM-10PM",
  placeId: "ChIJ...",
  description: "Amazing sauna experience."
}
```

### Updating Colors

Edit `tailwind.config.js` theme colors:

```javascript
colors: {
  cream: '#FAF8F3',      // Background
  charcoal: '#2A2A2A',   // Text
  'accent-red': '#C84545' // Accents
}
```

### Changing Fonts

Update Google Fonts link in `index.html` and `tailwind.config.js`:

```javascript
fontFamily: {
  serif: ['Your Serif Font', 'serif'],
  sans: ['Your Sans Font', 'sans-serif']
}
```

## Deployment

### Deploy to Vercel (Recommended)

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Deploy:
   ```bash
   npm run build
   vercel --prod
   ```

### Deploy to Netlify

1. Build the project:
   ```bash
   npm run build
   ```

2. Drag the `dist` folder to [Netlify Drop](https://app.netlify.com/drop)

### Deploy to GitHub Pages

1. Install gh-pages:
   ```bash
   npm install -D gh-pages
   ```

2. Add to `package.json`:
   ```json
   "homepage": "https://yourusername.github.io/nyc-sauna-finder",
   "scripts": {
     "deploy": "npm run build && gh-pages -d dist"
   }
   ```

3. Deploy:
   ```bash
   npm run deploy
   ```

## Migrating to React Native

This codebase is structured for easy React Native migration:

1. **Component Logic** - All components use pure React hooks (no DOM-specific code in logic)
2. **Styling** - Tailwind classes can be mapped to React Native StyleSheet
3. **Data Layer** - `src/data/saunas.js` works identically in React Native
4. **Hooks** - `useFilters` hook is platform-agnostic

### Migration Steps:

1. Create React Native project:
   ```bash
   npx react-native init SaunaFinderMobile
   ```

2. Copy `src/data/` and `src/hooks/` directories directly

3. Rebuild components using React Native primitives:
   - `<div>` → `<View>`
   - `<button>` → `<Pressable>`
   - `className` → `style={styles.container}`

4. Use `react-native-maps` for map functionality

## API Key Security

⚠️ **Important:** The Google Maps API key is currently in client-side code. For production:

1. Restrict your API key in Google Cloud Console to your domain
2. Consider using environment variables with Vite:
   ```javascript
   const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY;
   ```
3. For enterprise apps, proxy API calls through your backend

## Performance Tips

- **Lazy Loading**: Components are small enough for now, but you can code-split with React.lazy()
- **Image Optimization**: Add sauna images and optimize with next-gen formats (WebP, AVIF)
- **Map Performance**: Already using AdvancedMarker for better performance
- **Bundle Size**: Currently ~200KB gzipped - very fast!

## Browser Support

- ✅ Chrome/Edge (last 2 versions)
- ✅ Firefox (last 2 versions)
- ✅ Safari 14+
- ✅ Mobile Safari (iOS 13+)
- ✅ Chrome Android

## Contributing

This is a personal project, but feel free to:
- Fork and customize for your own city
- Submit bug fixes via pull requests
- Share your deployed version!

## License

MIT License - feel free to use for personal or commercial projects

## Support

Questions? Issues? 
- Check `src/components/Map.jsx` for API key setup
- Ensure Node.js 16+ is installed
- Clear `node_modules` and reinstall if needed

---

Built with ❤️ for the NYC sauna community
