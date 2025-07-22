'use client';

import React, { useState } from 'react';
import { trpc } from '@/lib/trpc';

interface CreateDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateDocumentModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateDocumentModalProps) {
  const [title, setTitle] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const { mutate, isPending } = trpc.documents.create.useMutation({
    onSuccess: () => {
      setTitle('');
      setIsPublic(false);
      setMutationError(null);
      onSuccess();
    },
    onError: error => {
      setMutationError(error.message || 'Failed to create document.');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    await mutate({
      title: title.trim(),
      isPublic,
    });
  };

  React.useEffect(() => {
    if (!isOpen) setMutationError(null);
  }, [isOpen]);

  if (!isOpen) return null;

  const isPrivate = !isPublic;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">
          Create New Document
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Document Title
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Enter document title..."
              className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400"
              required
              autoFocus
            />
          </div>

          <div className="mb-6">
            <label className="flex items-start">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={e => setIsPublic(!e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-0.5"
              />
              <div className="ml-2">
                <span className="text-sm text-gray-700 font-medium">
                  {isPrivate
                    ? '🔒 Keep this document private'
                    : '🌐 Make this document public'}
                </span>
                <p className="text-xs text-gray-500 mt-1">
                  {isPrivate
                    ? 'Only you can view this document. Uncheck to make it public.'
                    : 'Anyone with the link can view this document. Check to make it private.'}
                </p>
              </div>
            </label>
          </div>

          {mutationError && (
            <div className="mb-4 text-red-600 text-sm" role="alert">
              {mutationError}
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              disabled={isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isPending ? 'Creating...' : 'Create Document'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
