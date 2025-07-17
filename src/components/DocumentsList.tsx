'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { trpc } from '@/lib/trpc';
import { CreateDocumentModal } from '@/components/CreateDocumentModal';

type Document = {
  id: string;
  title: string;
  content: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  ownerId: string;
  owner: {
    id: string;
    name: string | null;
    email: string;
  };
  _count: {
    collaborators: number;
  };
};

export function DocumentsList() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { data, isLoading, refetch } = trpc.documents.list.useQuery({
    limit: 50,
  });

  const deleteDocument = trpc.documents.delete.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const handleDelete = async (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete "${title}"?`)) {
      try {
        await deleteDocument.mutateAsync({ id });
      } catch (error) {
        console.error('Failed to delete document:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const documents = data?.documents || [];

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Create New Document
        </button>
      </div>

      {documents.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No documents yet
          </h3>
          <p className="text-gray-600 mb-4">
            Create your first document to get started.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc: Document) => (
            <div
              key={doc.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {doc.title}
                </h3>
                <div className="flex space-x-2">
                  <Link
                    href={`/editor/${doc.id}`}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(doc.id, doc.title)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                    disabled={deleteDocument.isPending}
                  >
                    Delete
                  </button>
                </div>
              </div>

              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                {doc.content || 'No content yet...'}
              </p>

              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>
                  {doc._count.collaborators > 0
                    ? `${doc._count.collaborators} collaborator${
                        doc._count.collaborators > 1 ? 's' : ''
                      }`
                    : 'No collaborators'}
                </span>
                <span>{new Date(doc.updatedAt).toLocaleDateString()}</span>
              </div>

              {doc.isPublic && (
                <div className="mt-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Public
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <CreateDocumentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setIsCreateModalOpen(false);
          refetch();
        }}
      />
    </div>
  );
}
