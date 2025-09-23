# Quiz Game - Kahoot-Inspired Real-Time Quiz Platform

A production-quality, real-time quiz game platform inspired by Kahoot, built with a modern monorepo architecture using pnpm workspaces.

## 🏗️ Architecture

### Monorepo Structure
```
quiz-game/
├── apps/
│   ├── host-react/          # React host application (admin/teacher interface)
│   └── player-vanilla/      # Vanilla JS player client (mobile-first PWA)
├── server/                  # Node.js + Express + Socket.IO backend
├── package.json            # Root workspace configuration
└── pnpm-workspace.yaml     # pnpm workspace definition
```

### Tech Stack
- **Backend**: Node.js, Express, Socket.IO
- **Host App**: React 18, Vite, Tailwind CSS, Zustand
- **Player App**: Vanilla JavaScript, PWA
- **Real-time**: Socket.IO with WebSocket fallback
- **Testing**: Jest + Testing Library
- **Package Manager**: pnpm workspaces

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- pnpm 8+

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd quiz-game

# Install dependencies for all packages
pnpm install

# Copy environment files
cp .env.example .env
cp server/.env.example server/.env
cp apps/host-react/.env.example apps/host-react/.env
cp apps/player-vanilla/.env.example apps/player-vanilla/.env
```

### Development
```bash
# Start all services in development mode
pnpm dev

# Or start services individually:
pnpm -F server dev          # Server on http://localhost:4000
pnpm -F host-react dev       # Host app on http://localhost:5173
pnpm -F player-vanilla dev   # Player app on http://localhost:3000
```

### Building
```bash
# Build all packages
pnpm build

# Build specific package
pnpm -F server build
pnpm -F host-react build
pnpm -F player-vanilla build
```

### Testing
```bash
# Run all tests
pnpm test

# Run tests for specific package
pnpm -F server test
pnpm -F host-react test
pnpm -F player-vanilla test
```

## 🎮 How to Play

### For Hosts (Teachers/Admins)
1. Open the host application at `http://localhost:5173`
2. Select a quiz from the available options
3. Click "Create Game" to generate a 6-digit PIN
4. Share the PIN with players
5. Wait for players to join, then start the game
6. Control the game flow and view real-time results

### For Players (Students/Participants)
1. Open the player app at `http://localhost:3000`
2. Enter the 6-digit game PIN
3. Choose a unique nickname
4. Wait in the lobby for the host to start
5. Answer questions quickly for bonus points!
6. View your rank and compete with others

## 🎯 Core Features

### Game Flow
- **Lobby System**: Players join using a 6-digit PIN
- **Real-time Sync**: All participants see updates simultaneously
- **Multiple Question Types**: Multiple choice, true/false, short text
- **Timer System**: Configurable time limits per question
- **Scoring**: Base points + speed bonus + streak multipliers
- **Leaderboard**: Live rankings with smooth animations

### Question Types
- **Multiple Choice**: 2-6 options with single correct answer
- **True/False**: Binary choice questions
- **Short Text**: Free-form text answers with exact matching
- **Image Questions**: Support for question illustrations

### Scoring System
- **Base Points**: 1000 points for correct answers
- **Speed Bonus**: Up to 500 additional points based on answer speed
- **Streak Bonus**: +100 points per consecutive correct answer
- **Tie Breaking**: Earliest submission wins ties

### Anti-Cheat & Reliability
- **Profanity Filter**: Automatic nickname filtering
- **Rate Limiting**: Prevents spam and abuse
- **Reconnection Support**: Players can rejoin and maintain scores
- **Late Join**: Configurable setting to allow joining after start
- **Answer Locking**: Prevents multiple submissions (configurable)

## 📱 User Experience

### Host Application (React)
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Keyboard Navigation**: Full keyboard accessibility support
- **Color-blind Safe**: WCAG AA compliant color palette
- **Real-time Dashboard**: Live player management and game control
- **Settings Panel**: Customizable game rules and timing

### Player Application (PWA)
- **Mobile-First**: Optimized for smartphones and tablets
- **Large Touch Targets**: Easy interaction on all devices
- **Offline Support**: Basic functionality without network
- **Minimal Data Usage**: Efficient real-time communication
- **Haptic Feedback**: Vibration support for answer feedback
- **Progressive Web App**: Installable on mobile devices

## 🔧 Configuration

### Server Environment Variables
```env
PORT=4000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
```

### Host App Environment Variables
```env
VITE_SERVER_URL=http://localhost:4000
```

### Player App Environment Variables
```env
SERVER_URL=http://localhost:4000
```

### Game Settings
Hosts can configure:
- Points base value (default: 1000)
- Speed multiplier (default: 0.5)
- Allow answer changes (default: false)
- Late join enabled (default: false)
- Streak bonus enabled (default: true)
- Time per question (5-60 seconds)

## 🧪 Testing

The project includes comprehensive test coverage:

### Server Tests
- Scoring logic validation
- Leaderboard calculations
- Rank change detection
- Edge case handling

### Host App Tests
- Component rendering
- User interactions
- State management
- Socket integration

### Player App Tests
- Screen transitions
- Answer submissions
- Error handling
- PWA functionality

## 📊 Performance

### Target Metrics
- **Host App**: < 150KB gzipped initial load
- **Player App**: < 60KB gzipped initial load
- **Concurrent Players**: 100+ per game instance
- **Response Time**: < 100ms for real-time updates

### Optimization Techniques
- Code splitting and lazy loading
- Efficient WebSocket communication
- Minimal DOM updates
- Optimized asset delivery
- Service worker caching

## 🚦 API Reference

### Socket.IO Events

#### Host → Server
- `host:create_game` - Create new game session
- `host:start` - Begin the quiz
- `host:next` - Proceed to next question/phase
- `host:end` - Terminate the game

#### Player → Server
- `player:join` - Join game with PIN and nickname
- `player:answer` - Submit answer for current question
- `player:reconnect` - Rejoin existing session

#### Server → All
- `question:start` - New question begins
- `question:results` - Question results and statistics
- `leaderboard:update` - Updated player rankings
- `game:ended` - Game completion notification

## 🔐 Security

### Implemented Measures
- Rate limiting on all endpoints
- Input validation and sanitization
- Profanity filtering for nicknames
- CORS configuration
- Helmet.js security headers
- Socket.IO authentication

### Best Practices
- Environment variable configuration
- No sensitive data in client code
- Secure WebSocket connections
- Regular dependency updates

## 🚀 Deployment

### Server Deployment (Node.js)
Recommended platforms:
- **Render**: Easy Node.js deployment
- **Fly.io**: Global edge deployment
- **Railway**: Simple container deployment
- **Heroku**: Classic PaaS option

### Client Deployment
#### Host App (React/Vite)
- **Vercel**: Optimized for React apps
- **Netlify**: JAMstack deployment
- **Cloudflare Pages**: Global CDN

#### Player App (Static)
- **Netlify**: Static site hosting
- **Vercel**: Static deployment
- **GitHub Pages**: Free hosting option

### Environment Setup
1. Set production environment variables
2. Configure CORS origins for your domains
3. Update Socket.IO server URLs in client apps
4. Enable HTTPS in production
5. Set up monitoring and logging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow existing code style and patterns
- Add tests for new functionality
- Update documentation as needed
- Ensure all tests pass before submitting

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎉 Acknowledgments

- Inspired by Kahoot's engaging quiz format
- Built with modern web technologies
- Designed for educational and entertainment use
- Community-driven development

---

**Ready to host your first quiz?** Follow the Quick Start guide above and create engaging, real-time quiz experiences for your audience!