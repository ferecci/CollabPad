# CollabPad

A real-time collaborative markdown editor with CRDT sync, built with Next.js 14, TypeScript, and Yjs.

## 🚀 Features

- **Real-time Collaboration**: Google Docs-style live editing with multiple cursors
- **CRDT Sync**: Conflict-free replicated data types for reliable collaboration
- **Markdown Editor**: Rich text editing powered by TipTap
- **Authentication**: GitHub OAuth integration with NextAuth
- **Type Safety**: Full-stack TypeScript with tRPC
- **Modern Stack**: Next.js 14, Prisma, PostgreSQL, Redis

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Backend**: tRPC, Prisma, PostgreSQL
- **Real-time**: Yjs, y-websocket
- **Editor**: TipTap
- **Auth**: NextAuth.js
- **Styling**: Tailwind CSS
- **Testing**: Jest, React Testing Library

## 📋 Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm
- Docker & Docker Compose
- PostgreSQL
- Redis

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd collabpad
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Start the development stack**
   ```bash
   docker-compose up -d
   ```

5. **Run database migrations**
   ```bash
   pnpm db:generate
   pnpm db:push
   ```

6. **Start the development server**
   ```bash
   pnpm dev
   ```

7. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
collabpad/
├── src/
│   ├── app/                 # Next.js 14 app directory
│   ├── components/          # React components
│   ├── lib/                 # Utilities and configurations
│   ├── server/              # tRPC server setup
│   └── types/               # TypeScript type definitions
├── prisma/                  # Database schema and migrations
├── docker-compose.yml       # Development environment
└── roadmap.txt             # Development roadmap
```

## 🧪 Development

### Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm lint:fix` - Fix ESLint errors
- `pnpm format` - Format code with Prettier
- `pnpm test` - Run tests
- `pnpm type-check` - Run TypeScript type checking

### Database Commands

- `pnpm db:generate` - Generate Prisma client
- `pnpm db:push` - Push schema to database
- `pnpm db:migrate` - Run database migrations
- `pnpm db:studio` - Open Prisma Studio

## 🐳 Docker Development

The project includes a Docker Compose setup for easy development:

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

## 📊 Roadmap

See [roadmap.txt](./roadmap.txt) for detailed development milestones and progress.

**Current Focus**: Milestone 2 - Realtime CRDT Sync (Target: 35 hours)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Yjs](https://github.com/yjs/yjs) for CRDT implementation
- [TipTap](https://tiptap.dev/) for the rich text editor
- [tRPC](https://trpc.io/) for type-safe APIs
- [Next.js](https://nextjs.org/) for the React framework 