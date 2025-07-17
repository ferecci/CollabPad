'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { trpc } from '@/lib/trpc';

interface DocumentEditorProps {
  documentId: string;
}

export function DocumentEditor({ documentId }: DocumentEditorProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const {
    data: document,
    isLoading,
    error,
  } = trpc.documents.byId.useQuery({
    id: documentId,
  });

  const updateDocument = trpc.documents.update.useMutation({
    onSuccess: () => {
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
    },
  });

  // Load document data when it's fetched
  useEffect(() => {
    if (document) {
      setTitle(document.title);
      setContent(document.content);
      setIsPublic(document.isPublic);
      setHasUnsavedChanges(false);
    }
  }, [document]);

  // Track changes for unsaved state
  useEffect(() => {
    if (document) {
      const hasChanges =
        title !== document.title ||
        content !== document.content ||
        isPublic !== document.isPublic;
      setHasUnsavedChanges(hasChanges);
    }
  }, [title, content, isPublic, document]);

  // Auto-save functionality (save every 2 seconds after user stops typing)
  useEffect(() => {
    if (!document || !hasUnsavedChanges) return;

    const timer = setTimeout(() => {
      if (title.trim()) {
        // Only save if title is not empty
        updateDocument.mutate({
          id: documentId,
          title: title.trim(),
          content,
          isPublic,
        });
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [
    title,
    content,
    isPublic,
    document,
    documentId,
    updateDocument,
    hasUnsavedChanges,
  ]);

  const handleManualSave = () => {
    if (hasUnsavedChanges && document && title.trim()) {
      updateDocument.mutate({
        id: documentId,
        title: title.trim(),
        content,
        isPublic,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <h2 className="text-2xl font-bold mb-4 text-red-600">
          Document not found
        </h2>
        <p className="text-gray-600 mb-4">
          The document you&apos;re looking for doesn&apos;t exist or you
          don&apos;t have permission to view it.
        </p>
        <Link
          href="/documents"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Back to Documents
        </Link>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>No document found</div>
      </div>
    );
  }

  const isPrivate = !isPublic;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="text-gray-600 hover:text-gray-800 font-medium"
              >
                ← Home
              </Link>
              <span className="text-gray-300">|</span>
              <Link
                href="/documents"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                My Documents
              </Link>
              <div className="text-sm text-gray-500">
                {lastSaved
                  ? `Last saved: ${lastSaved.toLocaleTimeString()}`
                  : 'Not saved yet'}
                {updateDocument.isPending && (
                  <span className="ml-2 text-blue-600">Saving...</span>
                )}
                {hasUnsavedChanges && !updateDocument.isPending && (
                  <span className="ml-2 text-orange-600">Unsaved changes</span>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleManualSave}
                disabled={
                  !hasUnsavedChanges ||
                  updateDocument.isPending ||
                  !title.trim()
                }
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {updateDocument.isPending ? 'Saving...' : 'Save'}
              </button>
              <div className="flex items-center group relative">
                <label className="flex items-center text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPrivate}
                    onChange={e => setIsPublic(!e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
                  />
                  <span className="select-none">
                    {isPrivate ? '🔒 Private' : '🌐 Public'}
                  </span>
                </label>
                <div className="absolute top-full right-0 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                  {isPrivate
                    ? 'Only you can view this document'
                    : 'Anyone with the link can view this document'}
                </div>
              </div>
              <span className="text-sm text-gray-500">
                Owner: {document.owner.name || document.owner.email}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="mb-6">
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Document title..."
              className="w-full text-3xl font-bold text-gray-900 border-none outline-none placeholder-gray-400 resize-none"
            />
          </div>

          <div className="prose max-w-none">
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Start writing your document..."
              className="w-full h-96 border-none outline-none resize-none text-gray-900 leading-relaxed placeholder-gray-400"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
