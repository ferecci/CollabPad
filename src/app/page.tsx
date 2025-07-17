import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SignInButton, SignOutButton } from '@/components/AuthButtons';

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-6">CollabPad</h1>
        <p className="text-xl text-gray-600 mb-8">
          Collaborative document editor with full-stack TypeScript
        </p>
        <div className="mb-6">
          {session?.user ? (
            <div className="flex flex-col items-center gap-2">
              <span className="text-gray-700">
                Signed in as <b>{session.user.email}</b>
              </span>
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
              tRPC
            </span>
            <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full">
              Prisma
            </span>
            <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full">
              PostgreSQL
            </span>
          </div>
        </div>
        <div className="space-y-4">
          {session?.user ? (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/documents"
                className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                View Documents
              </Link>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <SignInButton />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
