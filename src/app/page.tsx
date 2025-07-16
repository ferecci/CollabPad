import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from './api/auth/[...nextauth]/route';
import { SignInButton, SignOutButton } from '@/components/AuthButtons';

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-6">
          CollabPad
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Real-time collaborative markdown editor with CRDT sync
        </p>
        <div className="mb-6">
          {session?.user ? (
            <div className="flex flex-col items-center gap-2">
              <span className="text-gray-700">Signed in as <b>{session.user.email}</b></span>
              <SignOutButton />
            </div>
          ) : (
            <SignInButton />
          )}
        </div>
        <div className="space-y-4 mb-12">
          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
              Next.js 14
            </span>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full">
              TypeScript
            </span>
            <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full">
              Yjs CRDT
            </span>
            <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full">
              TipTap
            </span>
            <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full">
              tRPC
            </span>
          </div>
        </div>
        <div className="space-y-4">
          <Link
            href="/editor"
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Try the Editor
          </Link>
          <div className="text-sm text-gray-500">
            <p>Coming soon: Authentication, real-time collaboration, and more!</p>
          </div>
        </div>
        <div className="mt-16 text-sm text-gray-400">
          <p>Development in progress - See roadmap.txt for details</p>
        </div>
      </div>
    </div>
  );
} 