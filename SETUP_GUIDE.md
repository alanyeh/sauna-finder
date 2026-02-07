# VS Code Setup Guide

## Step-by-Step Instructions

### 1. Open the Project in VS Code

```bash
# Navigate to the project folder
cd nyc-sauna-finder

# Open in VS Code
code .
```

### 2. Install Dependencies

Open the integrated terminal in VS Code (`Ctrl + ~` or `Cmd + ~`) and run:

```bash
npm install
```

This will install all dependencies (~2-3 minutes).

### 3. Add Your Google Maps API Key

1. Open `src/components/Map.jsx`
2. Find line 8:
   ```javascript
   const GOOGLE_MAPS_API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY';
   ```
3. Replace with your actual API key:
   ```javascript
   const GOOGLE_MAPS_API_KEY = 'AIzaSyB41DRUbKWJHPxaFjMAwdrzWzbVKartNGg';
   ```

**Get a Google Maps API Key:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/google/maps-apis)
2. Create a new project (if you don't have one)
3. Enable these APIs:
   - Maps JavaScript API
   - Places API
4. Create credentials → API Key
5. Copy the key

### 4. Start Development Server

In the terminal, run:

```bash
npm run dev
```

You should see:
```
  VITE v5.0.8  ready in 500 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
  ➜  press h to show help
```

Your browser will automatically open to `http://localhost:3000`!

### 5. Recommended VS Code Extensions

VS Code will prompt you to install these (or install manually):

1. **ESLint** - Code quality
2. **Prettier** - Code formatting
3. **Tailwind CSS IntelliSense** - Tailwind autocomplete

### 6. File Structure Overview

```
src/
├── components/       ← All React components
│   ├── Map.jsx      ← Google Maps (ADD API KEY HERE)
│   ├── Sidebar.jsx  ← Left panel container
│   ├── SaunaList.jsx
│   ├── SaunaCard.jsx
│   ├── Filters.jsx
│   └── Header.jsx
├── data/
│   └── saunas.js    ← Sauna data (add more here)
├── hooks/
│   └── useFilters.js ← Filter logic
├── App.jsx          ← Main app
└── main.jsx         ← Entry point
```

## Common Issues & Solutions

### Issue: "Cannot find module 'vite'"

**Solution:** Run `npm install` in the project directory

### Issue: Map shows "API Key Required" message

**Solution:** Add your Google Maps API key in `src/components/Map.jsx` (line 8)

### Issue: Port 3000 already in use

**Solution:** Kill the process or change port in `vite.config.js`:
```javascript
server: {
  port: 3001, // Change to any available port
  open: true
}
```

### Issue: Tailwind styles not working

**Solution:** Make sure `postcss.config.js` and `tailwind.config.js` exist in root directory

## Development Tips

### Hot Reload
Changes to any file will instantly reflect in the browser - no manual refresh needed!

### Component Editing
- Edit any `.jsx` file in `src/components/`
- Changes appear instantly
- Check browser console (F12) for any errors

### Adding New Features
1. Create new component in `src/components/`
2. Import and use in `App.jsx` or other components
3. Use Tailwind classes for styling

### Debugging
- Use React DevTools (Chrome/Firefox extension)
- Console.log() works normally
- Check browser Network tab for API calls

## Next Steps

### Production Build
```bash
npm run build
```
Creates optimized production build in `/dist` folder

### Preview Production Build
```bash
npm run preview
```
Test production build locally before deploying

### Deploy
See README.md for deployment instructions (Vercel, Netlify, etc.)

## Quick Commands Reference

| Command | What it does |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Create production build |
| `npm run preview` | Preview production build |
| `code .` | Open current folder in VS Code |
| `Ctrl/Cmd + C` | Stop development server |

## Getting Help

1. Check browser console (F12) for errors
2. Check terminal output for build errors
3. Read `README.md` for detailed documentation
4. Google error messages - Stack Overflow has answers!

---

**You're all set! Happy coding! 🎉**
