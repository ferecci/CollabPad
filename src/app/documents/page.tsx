import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SignInButton } from '@/components/AuthButtons';
import { DocumentsList } from '@/components/DocumentsList';
import Link from 'next/link';

export default async function DocumentsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <h2 className="text-2xl font-bold mb-4">Sign in required</h2>
        <p className="mb-4 text-gray-600">
          You must be signed in to access your documents.
        </p>
        <SignInButton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="flex items-center space-x-4 mb-2">
              <Link
                href="/"
                className="text-gray-600 hover:text-gray-800 font-medium"
              >
                ← Home
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">My Documents</h1>
            <p className="text-gray-600 mt-2">
              Manage your collaborative documents
            </p>
          </div>
        </div>
        <DocumentsList />
      </div>
    </div>
  );
}
