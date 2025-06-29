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
- **Environment Separation**: Separate development and production databases

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
2. Two Supabase projects (development and production)

### Setup

1. **Clone and install dependencies**:
   ```bash
   git clone <repository-url>
   cd vibe-finder
   npm install
   ```

2. **Set up Supabase Projects**:
   
   **Development Database:**
   - Create a new project at [supabase.com](https://supabase.com) for development
   - Go to Settings > API to get your project URL and anon key
   - Run the database migrations in your development project
   
   **Production Database:**
   - Create a separate project at [supabase.com](https://supabase.com) for production
   - Go to Settings > API to get your project URL and anon key
   - Run the database migrations in your production project

3. **Configure Environment Variables**:
   Copy `.env.local.example` to `.env.local` and fill in your Supabase credentials:
   
   ```env
   # Production Database (for live deployment)
   NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_production_supabase_service_role_key

   # Development Database (for local development)
   NEXT_PUBLIC_SUPABASE_DEV_URL=your_development_supabase_project_url
   NEXT_PUBLIC_SUPABASE_DEV_ANON_KEY=your_development_supabase_anon_key
   SUPABASE_DEV_SERVICE_ROLE_KEY=your_development_supabase_service_role_key

   # Environment Configuration
   NODE_ENV=development
   NEXT_PUBLIC_APP_ENV=development
   ```

4. **Run database migrations** (for both projects):
   ```bash
   # For development database
   npx supabase db push --project-ref your_dev_project_ref
   
   # For production database  
   npx supabase db push --project-ref your_prod_project_ref
   ```

5. **Start the development server**:
   ```bash
   npm run dev
   ```

6. **Open the application**:
   Navigate to [http://localhost:3000](http://localhost:3000)

### Environment Configuration

The app automatically detects the environment and uses the appropriate database:

- **Development Mode** (`NODE_ENV=development` or `NEXT_PUBLIC_APP_ENV=development`):
  - Uses `NEXT_PUBLIC_SUPABASE_DEV_URL` and `NEXT_PUBLIC_SUPABASE_DEV_ANON_KEY`
  - Falls back to production variables if dev variables are not set
  - Shows environment indicator in the UI
  - All test recordings and data go to the development database

- **Production Mode**:
  - Uses `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - No environment indicator shown
  - All user data goes to the production database

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
- Environment separation for development safety

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
```bash
# Development
npx supabase db push --project-ref your_dev_project_ref

# Production
npx supabase db push --project-ref your_prod_project_ref
```

### Environment Switching

To switch between environments, update your `.env.local`:

```env
# For development
NEXT_PUBLIC_APP_ENV=development

# For production testing
NEXT_PUBLIC_APP_ENV=production
```

## Deployment

### Development Deployment
- Uses development database
- Safe for testing and experimentation
- Environment indicator visible

### Production Deployment
- Uses production database
- Real user data
- No environment indicator
- Set `NEXT_PUBLIC_APP_ENV=production` in deployment environment

The application can be deployed to any platform that supports Next.js:

1. **Vercel** (recommended for Next.js apps)
2. **Netlify**
3. **Railway**
4. **Any Node.js hosting provider**

Make sure to set the appropriate environment variables in your deployment platform.

## Best Practices

1. **Always use development database for testing**
2. **Never test with production data**
3. **Run migrations on both databases**
4. **Keep environment variables secure**
5. **Test thoroughly in development before production deployment**

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes using the development database
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.