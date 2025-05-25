# Store POS Starter Application

A modern, responsive Point of Sale (POS) system built with React and Material-UI. This starter application provides a solid foundation for building retail management systems.

## Features

- 🛍️ Product management with barcode support
- 📊 Category-based product organization
- 💰 Sales management with cash/card payment options
- 🏷️ Backstage pricing support
- 📱 Responsive design
- ⚡ High-performance with virtualization
- 🎨 Modern Material-UI interface

## Tech Stack

- React
- Material-UI
- React Window (for virtualization)
- Electron (for desktop application)

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/store-pos.git
cd store-pos
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Start the development server:
```bash
npm start
# or
yarn start
```

### Building for Production

```bash
npm run build
# or
yarn build
```

## Project Structure

```
store-pos/
├── src/
│   ├── components/     # Reusable UI components
│   ├── contexts/       # React contexts for state management
│   ├── screens/        # Main application screens
│   ├── utils/          # Utility functions
│   └── App.js          # Main application component
├── public/             # Static assets
└── package.json        # Project dependencies and scripts
```

## Customization

### Adding New Features

1. Create new components in the `components` directory
2. Add new screens in the `screens` directory
3. Create new contexts in the `contexts` directory for state management

### Styling

The application uses Material-UI for styling. You can customize the theme in `src/theme.js`.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Material-UI for the component library
- React Window for virtualization
- Electron for desktop application support 