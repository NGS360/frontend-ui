# NGS360 Frontend UI

This is the frontend UI for the NGS360 project, built with React and TypeScript. It utilizes TanStack Router for routing, TanStack Query for data fetching, and TanStack Table for data table components, Radix + Shadcn for base components with Tailwind CSS for styling.

# Getting Started

## Prerequisites

- Node.js (version 18 or higher recommended)
- npm

## Installation

Install dependencies:

```bash
npm install
```

## Configuration

The application requires an API server URL to be configured via environment variables.

### Using a Local APIServer

To run the app with a local instance of the APIServer:

1. Copy the example environment file:

```bash
cp .env.example .env
```

2. Edit the `.env` file and set the `VITE_API_URL` to your local APIServer URL:

```bash
VITE_API_URL=http://localhost:3000
```

Replace `http://localhost:3000` with the actual URL and port where your local APIServer is running.

### Using a Remote APIServer

For production or other remote environments, set the `VITE_API_URL` to the appropriate server URL:

```bash
VITE_API_URL=https://ngs360.org
```

## Running the Development Server

Start the development server:

```bash
npm run start
```

The application will be available at `http://localhost:8080`.

# Building For Production

To build this application for production:

```bash
npm run build
```

The production build will be output to the `dist` directory.
