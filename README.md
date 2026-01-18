# BlackMamba

BlackMamba is a Suno-like audio generation interface with a minimal black theme.

## Features

- **Display Page** (`/display`): Public Spanish interface with audio generation, progress tracking, playback, download, and share functionality
- **Control Panel** (`/control`): Private English administrative interface protected by CONTROL_SECRET
- **Mock API**: Simulated audio generation with random delays (1.5-3 seconds)
- **Black Minimal Theme**: Built with TailwindCSS for a sleek, modern look

## Prerequisites

- Node.js 18+ 
- npm or yarn

## Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Sunopo
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and set your control secret:
   ```
   CONTROL_SECRET=your_secret_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   - Display page: http://localhost:3000/display
   - Control panel: http://localhost:3000/control

## Usage

### Display Page
- Click "Generar Audio" to simulate audio generation
- Watch the progress bar
- Once complete, play, download, or share the generated audio

### Control Panel
- Access with the CONTROL_SECRET from your environment
- View system status and statistics
- Navigate to the display page

## Build for Production

```bash
npm run build
npm start
```

## Deploy

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variable: `CONTROL_SECRET`
4. Deploy

### Other Platforms

The app is a standard Next.js application and can be deployed to:
- Netlify
- Railway
- Render
- Any Node.js hosting platform

Make sure to set the `CONTROL_SECRET` environment variable on your hosting platform.

## Project Structure

```
Sunopo/
├── app/
│   ├── api/
│   │   ├── control/verify/route.ts  # Control auth endpoint
│   │   └── generate/route.ts        # Mock generation endpoint
│   ├── control/
│   │   └── page.tsx                 # Control panel (private)
│   ├── display/
│   │   └── page.tsx                 # Display page (public)
│   ├── globals.css                  # Global styles
│   ├── layout.tsx                   # Root layout
│   └── page.tsx                     # Root redirect
├── public/
│   └── samples/
│       └── sample.mp3               # Sample audio file
├── .env.example                     # Environment template
├── .gitignore
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts
└── tsconfig.json
```

## Technologies

- **Next.js 16**: React framework with App Router
- **TypeScript**: Type-safe development
- **TailwindCSS 4**: Utility-first CSS framework
- **React 19**: UI library

## Notes

- This is a scaffold version - real Suno backend integration is not yet implemented
- The mock API returns a sample MP3 file from `public/samples/`
- Audio generation simulation includes realistic progress tracking
- Control panel uses session storage for authentication (development only)

## License

ISC

