# Bonia Landing Page

A fully responsive React landing page for Bonia - an AI-powered data protection service.

## Features

✅ Fully responsive design (mobile, tablet, desktop)
✅ Modern React 18 with functional components
✅ Tailwind CSS for styling
✅ Smooth animations and transitions
✅ Clean, production-ready code
✅ Optimized performance with Vite

## Quick Start

### Option 1: Open the standalone HTML file directly
Simply open `index-standalone.html` in your browser. This version works without any installation and includes all dependencies via CDN.

### Option 2: Run with Vite (Recommended for development)

1. **Install dependencies:**
```bash
npm install
```

2. **Start development server:**
```bash
npm run dev
```

3. **Build for production:**
```bash
npm run build
```

4. **Preview production build:**
```bash
npm run preview
```

## Project Structure

```
Bonia-landing/
├── src/
│   ├── App.jsx              # Main component
│   ├── main.jsx             # Entry point
│   └── index.css            # Global styles with Tailwind
├── index.html               # Vite HTML entry point
├── index-standalone.html    # Standalone version (no build needed)
├── package.json             # Dependencies
├── vite.config.js           # Vite configuration
├── tailwind.config.js       # Tailwind configuration
└── postcss.config.js        # PostCSS configuration
```

## Tech Stack

- **React 18** - Modern React with hooks
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful icon library
- **PostCSS** - CSS processing
- **Autoprefixer** - Automatic vendor prefixes

## Responsive Breakpoints

- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Design Features

- Clean, modern aesthetic
- Vietnamese language support
- Gradient backgrounds
- Hover effects and transitions
- Card-based layout
- Form validation
- Professional typography with Inter font

## Customization

### Colors
Edit the color scheme in `tailwind.config.js`:
```js
theme: {
  extend: {
    colors: {
      primary: { ... }
    }
  }
}
```

### Content
All content can be modified in `src/App.jsx` or `index.html`

## Performance

- Optimized bundle size
- Lazy loading ready
- Fast initial load
- Smooth animations with CSS

## License

MIT License - feel free to use for your projects!

## Support

For issues or questions, please contact the development team.
