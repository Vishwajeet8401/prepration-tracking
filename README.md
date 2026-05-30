# Preparation Tracker

![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=111827)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-Hosting%20%2B%20Auth%20%2B%20Firestore-FFCA28?style=for-the-badge&logo=firebase&logoColor=111827)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)

A focused interview preparation workspace for planning study sessions, tracking questions, reviewing mistakes, managing applications, and measuring readiness in one clean dashboard.

Live app: https://tracking-prep.web.app

## Highlights

- Smart dashboard for preparation priorities and progress signals
- Topic map with spacing and revision support
- Question bank for practice, recall tracking, and interview notes
- Application and interview tracker
- Mistake journal for targeted improvement
- Activity planner, daily tasks, and preparation roadmaps
- Analytics for sessions, progress, and readiness trends
- Firebase Authentication, Firestore, Storage, and Hosting support
- Mobile-friendly React UI built with Vite and Tailwind CSS

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Firebase Auth
- Cloud Firestore
- Firebase Storage
- Firebase Hosting
- Recharts
- Lucide React

## Getting Started

### Prerequisites

- Node.js
- npm
- Firebase project

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env.local` file from `.env.example`:

```bash
cp .env.example .env.local
```

Fill in your real values:

```env
VITE_FIREBASE_API_KEY="YOUR_FIREBASE_API_KEY"
VITE_FIREBASE_AUTH_DOMAIN="YOUR_FIREBASE_AUTH_DOMAIN"
VITE_FIREBASE_PROJECT_ID="YOUR_FIREBASE_PROJECT_ID"
VITE_FIREBASE_STORAGE_BUCKET="YOUR_FIREBASE_STORAGE_BUCKET"
VITE_FIREBASE_MESSAGING_SENDER_ID="YOUR_FIREBASE_MESSAGING_SENDER_ID"
VITE_FIREBASE_APP_ID="YOUR_FIREBASE_APP_ID"
VITE_FIREBASE_MEASUREMENT_ID="YOUR_FIREBASE_MEASUREMENT_ID"
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
```

Optional demo login:

```env
VITE_DEMO_EMAIL=""
VITE_DEMO_PASSWORD=""
```

Keep real API keys in `.env.local` only. This file is ignored by Git.

## Development

```bash
npm run dev
```

The app runs locally on:

```text
http://localhost:3000
```

## Build

```bash
npm run build
```

## Type Check

```bash
npm run lint
```

## Deploy To Firebase

Build the app:

```bash
npm run build
```

Deploy Firebase Hosting:

```bash
npx firebase-tools deploy --only hosting
```

Hosting config is defined in `firebase.json`, and the production output folder is `dist`.

## Security Notes

- Do not commit `.env.local`.
- Do not hardcode API keys or demo credentials in source files.
- Firebase web config is loaded through `VITE_` environment variables.
- Firestore security rules are stored in `firestore.rules`.
- `node_modules`, `dist`, Firebase cache, logs, and environment files are ignored.

## Project Structure

```text
src/
  components/          UI modules and feature screens
  App.tsx              Main app shell and data orchestration
  firebase.ts          Firebase initialization
  initialData.ts       Demo seed data
  main.tsx             React entry point
  types.ts             Shared TypeScript models

firebase.json          Firebase Hosting and rules config
firestore.rules        Firestore security rules
index.html             Vite HTML entry
vite.config.ts         Vite configuration
```

## License

This project is private/proprietary unless a license is added.
