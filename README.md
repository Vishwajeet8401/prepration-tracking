# Preparation Tracker

A React and Firebase workspace for tracking interview preparation, practice questions, study activity, mistakes, applications, roadmaps, and readiness.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env.local` from `.env.example` and fill in your real Firebase and API values.

3. Run locally:

   ```bash
   npm run dev
   ```

## Build

```bash
npm run build
```

## Firebase Hosting

```bash
npx firebase-tools deploy --only hosting
```

Real API keys and local environment files should stay in `.env.local`, which is ignored by Git.
