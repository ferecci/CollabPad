import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SignInButton } from '@/components/AuthButtons';
import { DocumentEditor } from '@/components/DocumentEditor';

interface EditorPageProps {
  params: {
    id: string;
  };
}

export default async function EditorPage({ params }: EditorPageProps) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <h2 className="text-2xl font-bold mb-4">Sign in required</h2>
        <p className="mb-4 text-gray-600">
          You must be signed in to access the editor.
        </p>
        <SignInButton />
      </div>
    );
  }

  return <DocumentEditor documentId={params.id} />;
}
