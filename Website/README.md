# PLS-PM Website

A modern React.js frontend for the PLS-PM (Partial Least Squares Path Modeling) library.

## Features

- 🚀 Modern React.js with Material-UI components
- 📱 Responsive design for all devices
- 🎨 Beautiful and intuitive user interface
- 📚 Comprehensive documentation
- 💡 Interactive examples and tutorials
- 🔧 Easy to customize and extend

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn package manager

### Installation

1. Navigate to the Website directory:
   ```bash
   cd Website
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### Available Scripts

- `npm start` - Runs the app in development mode
- `npm test` - Launches the test runner
- `npm run build` - Builds the app for production
- `npm run eject` - Ejects from Create React App (one-way operation)

## Project Structure

```
Website/
├── public/                 # Static files
│   ├── index.html         # Main HTML template
│   ├── manifest.json      # Web app manifest
│   └── robots.txt         # SEO robots file
├── src/                   # Source code
│   ├── components/        # Reusable components
│   │   └── Navbar.js      # Navigation component
│   ├── pages/             # Page components
│   │   ├── Home.js        # Homepage
│   │   ├── Documentation.js # Documentation page
│   │   ├── Examples.js    # Examples page
│   │   └── About.js       # About page
│   ├── App.js             # Main app component
│   ├── App.css            # App styles
│   ├── index.js           # App entry point
│   └── index.css          # Global styles
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
└── README.md              # This file
```

## Technologies Used

- **React 18** - Modern React with hooks
- **Material-UI (MUI)** - Component library and design system
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls
- **Styled Components** - CSS-in-JS styling

## Customization

### Adding New Pages

1. Create a new component in `src/pages/`
2. Add the route to `src/App.js`
3. Update the navigation in `src/components/Navbar.js`

### Styling

The app uses Material-UI's theming system. You can customize the theme in `src/App.js`:

```javascript
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', // Your primary color
    },
    secondary: {
      main: '#dc004e', // Your secondary color
    },
  },
});
```

### Environment Variables

Copy `env.example` to `.env` and customize:

```bash
cp env.example .env
```

## Deployment

### Build for Production

```bash
npm run build
```

This creates a `build` folder with optimized production files.

### Deploy to GitHub Pages

1. Install gh-pages:
   ```bash
   npm install --save-dev gh-pages
   ```

2. Add deploy script to package.json:
   ```json
   "scripts": {
     "deploy": "gh-pages -d build"
   }
   ```

3. Deploy:
   ```bash
   npm run deploy
   ```

### Deploy to Netlify

1. Build the project:
   ```bash
   npm run build
   ```

2. Drag and drop the `build` folder to Netlify

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -am 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

## Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Contact the development team

## Changelog

### Version 1.0.0
- Initial release
- Homepage with hero section
- Documentation page
- Examples gallery
- About page
- Responsive navigation
- Material-UI integration
