# Vibe Finder

A web application for detecting and analyzing building resonance frequencies with user authentication and cloud data storage.

## Features

- **User Authentication**: Secure sign-up and sign-in with Supabase Auth
- **Cloud Data Storage**: All spaces and recordings are saved to Supabase database
- **Audio File Storage**: Audio recordings stored securely in Supabase Storage
- **Multi-user Support**: Each user has their own private data
- **Real-time Analysis**: Record audio samples with real-time visualization
- **Frequency Analysis**: Analyze frequency content and identify resonance peaks
- **Space Management**: Create and manage different acoustic spaces
- **Cross-device Sync**: Access your data from any device

## Technologies Used

- **Frontend**: Next.js 15, React 18, TypeScript, TailwindCSS
- **Authentication**: Supabase Auth with email/password
- **Database**: Supabase PostgreSQL with Row Level Security
- **Storage**: Supabase Storage for audio files
- **Audio Processing**: Web Audio API for real-time analysis
- **UI Components**: Custom components with glass morphism design

## Getting Started

### Prerequisites

1. Node.js 18+ installed
2. A Supabase project

### Setup

1. **Clone and install dependencies**:
   ```bash
   git clone <repository-url>
   cd vibe-finder
   npm install
   ```

2. **Set up Supabase Project**:
   - Create a new project at [supabase.com](https://supabase.com)
   - Go to Settings > API to get your project URL and anon key
   - Run the database migrations in your project

3. **Configure Environment Variables**:
   Copy `.env.local.example` to `.env.local` and fill in your Supabase credentials:
   
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

4. **Run database migrations**:
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Run the migration files in order:
     1. `supabase/migrations/20250630023727_gentle_violet.sql`
     2. `supabase/migrations/20250625223500_white_sound.sql`

5. **Start the development server**:
   ```bash
   npm run dev
   ```

6. **Open the application**:
   Navigate to [http://localhost:3000](http://localhost:3000)

### Database Schema

The application uses the following main tables:

- **profiles**: User profile information
- **spaces**: Acoustic spaces created by users
- **samples**: Audio recordings and analysis data
- **audio_files**: Metadata for stored audio files

All tables have Row Level Security (RLS) enabled to ensure users can only access their own data.

### Authentication Flow

1. Users sign up with email and password
2. Email verification is disabled by default for easier development
3. User profiles are automatically created via database triggers
4. All data is scoped to the authenticated user

## Project Structure

- `/src/app` - Next.js app router pages
- `/src/components` - React components
  - `/auth` - Authentication components
  - `/layout` - Layout components
  - `/pages` - Page components
  - `/ui` - Reusable UI components
- `/src/lib` - Utility functions and hooks
  - `/audio` - Audio processing and recording
  - `/supabase` - Supabase client and database functions
  - `/hooks` - Custom React hooks
- `/supabase/migrations` - Database migration files

## Key Features

### Audio Recording
- Real-time audio visualization
- Multiple sound types (sine waves, pink noise, chirp signals, etc.)
- Signal quality analysis
- Frequency peak detection

### Data Management
- Create and organize acoustic spaces
- Store recordings with metadata
- Export analysis data
- Cross-device synchronization

### Security
- Row Level Security ensures data privacy
- Secure file storage with signed URLs
- Authentication required for all operations

## Development

### Running Tests
```bash
npm run test
```

### Building for Production
```bash
npm run build
```

### Database Migrations

To apply migrations to your Supabase project:

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the migration SQL files
4. Run them in order

## Deployment

The application can be deployed to any platform that supports Next.js:

1. **Vercel** (recommended for Next.js apps)
2. **Netlify**
3. **Railway**
4. **Any Node.js hosting provider**

Make sure to set the appropriate environment variables in your deployment platform.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.