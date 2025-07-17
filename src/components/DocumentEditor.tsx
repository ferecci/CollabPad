'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Typography from '@tiptap/extension-typography';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { createLowlight } from 'lowlight';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import css from 'highlight.js/lib/languages/css';
import json from 'highlight.js/lib/languages/json';
import bash from 'highlight.js/lib/languages/bash';
import { trpc } from '@/lib/trpc';

const lowlight = createLowlight();
lowlight.register('javascript', javascript);
lowlight.register('typescript', typescript);
lowlight.register('python', python);
lowlight.register('css', css);
lowlight.register('json', json);
lowlight.register('bash', bash);

interface DocumentEditorProps {
  documentId: string;
}

export function DocumentEditor({ documentId }: DocumentEditorProps) {
  const [title, setTitle] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [updateCounter, setUpdateCounter] = useState(0);

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

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, // We'll use the lowlight version
      }),
      Placeholder.configure({
        placeholder: 'Start writing your document...',
      }),
      Typography,
      CodeBlockLowlight.configure({
        lowlight,
      }),
    ],
    content: '',
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const content = editor.getHTML();
      setHasUnsavedChanges(true);
    },
    onTransaction: () => {
      // Force re-render to update toolbar button states for any editor change
      setUpdateCounter(prev => prev + 1);
    },
    editorProps: {
      attributes: {
        class: 'focus:outline-none min-h-[400px]',
      },
    },
  });

  // Load document data when it's fetched
  useEffect(() => {
    if (document && editor) {
      setTitle(document.title);

      // Clean up empty or malformed HTML content
      let cleanContent = document.content;
      if (
        !cleanContent ||
        cleanContent.trim() === '' ||
        cleanContent.trim() === '<p></p>'
      ) {
        cleanContent = '';
      }

      editor.commands.setContent(cleanContent);
      setIsPublic(document.isPublic);
      setHasUnsavedChanges(false);
    }
  }, [document, editor]);

  // Track changes for unsaved state
  useEffect(() => {
    if (document && editor) {
      const currentContent = editor.getHTML();
      const hasChanges =
        title !== document.title ||
        currentContent !== document.content ||
        isPublic !== document.isPublic;
      setHasUnsavedChanges(hasChanges);
    }
  }, [title, isPublic, document, editor]);

  // Auto-save functionality (save every 2 seconds after user stops typing)
  useEffect(() => {
    if (!document || !hasUnsavedChanges || !editor) return;

    const timer = setTimeout(() => {
      if (title.trim()) {
        const content = editor.getHTML();
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
    isPublic,
    document,
    documentId,
    updateDocument,
    hasUnsavedChanges,
    editor,
  ]);

  const handleManualSave = () => {
    if (hasUnsavedChanges && document && title.trim() && editor) {
      const content = editor.getHTML();
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Document title..."
              className="w-full text-3xl font-bold text-gray-900 border-none outline-none placeholder-gray-400 resize-none"
            />
          </div>

          {/* Toolbar */}
          {editor && (
            <div className="flex items-center space-x-2 p-4 border-b border-gray-200 bg-gray-50">
              <button
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  editor.isActive('bold')
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                Bold
              </button>
              <button
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  editor.isActive('italic')
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                Italic
              </button>
              <button
                onClick={() => editor.chain().focus().toggleCode().run()}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  editor.isActive('code')
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                Code
              </button>
              <div className="w-px h-6 bg-gray-300"></div>
              <button
                onClick={() =>
                  editor.chain().focus().toggleHeading({ level: 1 }).run()
                }
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  editor.isActive('heading', { level: 1 })
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                H1
              </button>
              <button
                onClick={() =>
                  editor.chain().focus().toggleHeading({ level: 2 }).run()
                }
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  editor.isActive('heading', { level: 2 })
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                H2
              </button>
              <button
                onClick={() =>
                  editor.chain().focus().toggleHeading({ level: 3 }).run()
                }
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  editor.isActive('heading', { level: 3 })
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                H3
              </button>
              <div className="w-px h-6 bg-gray-300"></div>
              <button
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  editor.isActive('bulletList')
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                • List
              </button>
              <button
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  editor.isActive('orderedList')
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                1. List
              </button>
              <button
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  editor.isActive('codeBlock')
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                Code Block
              </button>
            </div>
          )}

          {/* Editor */}
          <div className="min-h-[400px]">
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>
    </div>
  );
}
