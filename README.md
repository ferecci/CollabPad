# 📝 CollabPad

A modern document editor built with Next.js 14, TypeScript, and tRPC.

## Features

- **GitHub Authentication**: Secure OAuth login with NextAuth
- **Document Management**: Create, edit, and organize documents
- **Full-Stack TypeScript**: End-to-end type safety with tRPC
- **Modern UI**: Clean interface built with Tailwind CSS
- **Database**: PostgreSQL with Prisma ORM

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Backend**: tRPC, Prisma, PostgreSQL
- **Auth**: NextAuth.js with GitHub OAuth
- **Styling**: Tailwind CSS
- **Testing**: Jest

## Prerequisites

- Node.js 18+
- pnpm (recommended)
- Docker & Docker Compose
- GitHub account (for OAuth setup)

## Quick Start

1. **Clone the repository**

   ```bash
   git clone <your-repo-url>
   cd collabpad
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up GitHub OAuth App**
   - Go to [GitHub Developer Settings](https://github.com/settings/developers)
   - Click "New OAuth App"
   - Fill in:
     - **Application name**: `CollabPad (Local)`
     - **Homepage URL**: `http://localhost:3000`
     - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
   - Save and copy the **Client ID** and **Client Secret**

4. **Set up environment variables**

   ```bash
   cp env.example .env.local
   ```

   Edit `.env.local` and update:

   ```bash
   # Generate a random secret (you can use: openssl rand -base64 32)
   NEXTAUTH_SECRET="your-generated-secret-here"

   # Use your GitHub OAuth credentials
   GITHUB_ID="your-github-client-id"
   GITHUB_SECRET="your-github-client-secret"
   ```

5. **Start the database**

   ```bash
   docker-compose up -d
   ```

6. **Set up the database**

   ```bash
   pnpm db:generate
   pnpm db:push
   ```

7. **Start the development server**

   ```bash
   pnpm dev
   ```

8. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
collabpad/
├── src/
│   ├── app/                 # Next.js 14 app directory
│   ├── components/          # React components
│   ├── lib/                 # Utilities and configurations
│   ├── server/              # tRPC server setup
│   └── types/               # TypeScript type definitions
├── prisma/                  # Database schema and migrations
└── docker-compose.yml       # Development environment
```

## Development

### Available Scripts

- `pnpm dev` - Start development server
- `pnpm dev:quiet` - Start development server (suppresses npm warnings)
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
- `pnpm db:seed` - Seed database with test data

## Docker Development

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Environment Variables

| Variable          | Description                  | Required |
| ----------------- | ---------------------------- | -------- |
| `DATABASE_URL`    | PostgreSQL connection string | ✅       |
| `NEXTAUTH_URL`    | Base URL for NextAuth        | ✅       |
| `NEXTAUTH_SECRET` | Secret for JWT encryption    | ✅       |
| `GITHUB_ID`       | GitHub OAuth Client ID       | ✅       |
| `GITHUB_SECRET`   | GitHub OAuth Client Secret   | ✅       |

## License

This project is licensed in 2025 under the MIT License by ferecci (Felipe Tancredo).
