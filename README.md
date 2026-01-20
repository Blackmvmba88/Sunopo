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
