# Building Resonance Detector

A web application for detecting and analyzing building resonance frequencies. This application allows users to record audio samples in different spaces, analyze the frequency characteristics, and identify potential resonance issues.

## Features

- Create and manage different spaces (residential, commercial, etc.)
- Record audio samples with real-time visualization
- Analyze frequency content and identify resonance peaks
- Track and compare measurements over time
- Works offline with local storage

## Technologies Used

- Next.js 15
- React 18
- TypeScript
- TailwindCSS
- IndexedDB for local storage
- Web Audio API for audio processing

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Run the development server: `npm run dev`
4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

- `/src/components` - React components
- `/src/lib` - Utility functions and hooks
- `/src/app` - Next.js app router pages