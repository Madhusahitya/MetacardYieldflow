# MetaCard YieldFlow Frontend

This is the frontend for the MetaCard YieldFlow project.

## Installation

To install the dependencies, run:

```bash
npm install --legacy-peer-deps
```

The `--legacy-peer-deps` flag is necessary because the MetaMask SDK has peer dependencies that conflict with the React version used in this project.

## Running the App

To start the development server, run:

```bash
npm start
```

This will start the app at [http://localhost:3000](http://localhost:3000).

## Building for Production

To build the app for production, run:

```bash
npm run build
```

This will create a `build` folder with the optimized production build.