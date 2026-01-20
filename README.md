# BlackMamba

A minimal Next.js audio generation app with a Suno-inspired layout and black theme.

## Features

- **Display Page (`/display`)** - Public page in Spanish with:
  - Generate button for audio creation
  - Real-time progress indicator
  - Audio player with controls
  - Download and Share functionality
  - Black minimal theme

- **Control Panel (`/control`)** - Private page in English with:
  - Secret-based authentication
  - System status dashboard
  - Configuration overview
  - Activity monitoring

- **API Endpoint (`/api/generate`)** - Mock audio generation API that:
  - Simulates audio generation with random delay (2-5 seconds)
  - Returns a sample audio file
  - Provides success/error responses

## Tech Stack

- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS 4** - Utility-first styling
- **React 19** - Latest React features

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Blackmvmba88/Sunopo.git
cd Sunopo
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env.local
```

4. Update the `.env.local` file with your secret:
```env
NEXT_PUBLIC_CONTROL_SECRET=your-secret-here
```

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

## Pages

### Display Page - `/display`
The public-facing page where users can:
- Click "Generar Audio" to create audio
- Watch progress bar during generation
- Play the generated audio
- Download the audio file
- Share the audio (uses Web Share API or clipboard fallback)

**Language**: Spanish

### Control Panel - `/control`
Protected admin panel requiring a secret to access:
- View system status
- Monitor generation statistics
- Manage configuration
- View recent activity

**Language**: English
**Default Secret**: `blackmamba2024` (change in `.env.local`)

> **⚠️ Security Note**: The current implementation uses client-side authentication for simplicity. In a production environment, implement proper server-side authentication with secure session management.

## API Routes

### POST `/api/generate`
Generates a mock audio file with random delay.

**Response**:
```json
{
  "success": true,
  "audioUrl": "/sample-audio.mp3",
  "message": "Audio generated successfully",
  "timestamp": "2024-01-18T20:00:00.000Z"
}
```

## Customization

### Theme
The app uses a black minimal theme. To customize:
- Edit `app/globals.css` for global styles
- Modify Tailwind classes in component files

### Audio Generation
The `/api/generate` endpoint currently returns a sample file. To integrate real audio generation:
1. Update `app/api/generate/route.ts`
2. Add your audio generation logic
3. Return the generated audio URL

### Secret Protection
To change the control panel secret:
1. Update `NEXT_PUBLIC_CONTROL_SECRET` in `.env.local`
2. Restart the development server

## Project Structure

```
Sunopo/
├── app/
│   ├── api/
│   │   └── generate/
│   │       └── route.ts          # Audio generation API
│   ├── control/
│   │   └── page.tsx              # Control panel (private, English)
│   ├── display/
│   │   └── page.tsx              # Display page (public, Spanish)
│   ├── globals.css               # Global styles (black theme)
│   └── layout.tsx                # Root layout
├── public/
│   └── sample-audio.mp3          # Sample audio file
├── .env.example                  # Environment variables template
├── .env.local                    # Local environment variables (not committed)
├── package.json                  # Dependencies
└── README.md                     # This file
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_CONTROL_SECRET` | Secret to access control panel | `blackmamba2024` |
| `NEXT_PUBLIC_APP_NAME` | Application name | `BlackMamba` |

## License

MIT License - feel free to use this project for any purpose.

## Credits

UI inspired by [Suno](https://suno.ai/) with a minimal black theme aesthetic.
