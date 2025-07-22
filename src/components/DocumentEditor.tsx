'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Typography from '@tiptap/extension-typography';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Collaboration from '@tiptap/extension-collaboration';
import { createLowlight } from 'lowlight';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import css from 'highlight.js/lib/languages/css';
import json from 'highlight.js/lib/languages/json';
import bash from 'highlight.js/lib/languages/bash';
import { trpc } from '../lib/trpc';
import * as Y from 'yjs';
// @ts-expect-error
import { WebsocketProvider } from 'y-websocket';
import { useSession } from 'next-auth/react';
import { CollaborativeCursorExtension } from './CollaborativeCursorExtension';
import { Awareness } from 'y-protocols/awareness';
import TurndownService from 'turndown';
import { getRandomColor } from '../lib/getRandomColor';

type AwarenessState = {
  user?: { name?: string; color?: string; id?: string };
  cursor?: { anchor: number; head: number };
};

declare global {
  interface Window {
    provider?: WebsocketProvider;
  }
}

const lowlight = createLowlight();
lowlight.register('javascript', javascript);
lowlight.register('typescript', typescript);
lowlight.register('python', python);
lowlight.register('css', css);
lowlight.register('json', json);
lowlight.register('bash', bash);

type DocumentData = {
  id: string;
  title: string;
  content: string;
  isPublic: boolean;
  owner?: { name?: string; email?: string };
};

interface DocumentEditorProps {
  documentId: string;
  testQueryResult?: {
    data?: DocumentData;
    isLoading?: boolean;
    error?: unknown;
  };
}

function bumpAwareness(awareness: Awareness) {
  const state = awareness.getLocalState() || {};
  awareness.setLocalState({ ...state, _bump: true });
  setTimeout(() => {
    const reverted = { ...awareness.getLocalState() };
    delete reverted._bump;
    awareness.setLocalState(reverted);
  }, 0);
}

export function DocumentEditor({
  documentId,
  testQueryResult,
}: DocumentEditorProps) {
  const { data: session } = useSession();
  const [title, setTitle] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isCollaborationReady, setIsCollaborationReady] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState(0);
  const [activeUsers, setActiveUsers] = useState<
    Array<{ name: string; color: string }>
  >([]);
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    code: false,
    heading1: false,
    heading2: false,
    heading3: false,
    bulletList: false,
    orderedList: false,
    codeBlock: false,
  });

  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const [yReady, setYReady] = useState(false);

  const {
    data: document,
    isLoading,
    error,
  } = testQueryResult ??
  trpc.documents.byId.useQuery({
    id: documentId,
  });

  const updateDocument = trpc.documents.update.useMutation();

  useEffect(() => {
    if (!ydocRef.current) ydocRef.current = new Y.Doc();
    providerRef.current = new WebsocketProvider(
      'ws://localhost:1234',
      `document-${documentId}`,
      ydocRef.current
    );
    if (typeof window !== 'undefined') {
      window.provider = providerRef.current;
    }
    providerRef.current.on('status', (event: { status: string }) => {
      const isConnected = event.status === 'connected';
      setIsCollaborationReady(isConnected);
    });
    providerRef.current.awareness.on('change', () => {
      if (providerRef.current) {
        const states = providerRef.current.awareness.getStates();
        setConnectedUsers(states.size);
        const users: Array<{ name: string; color: string }> = [];
        (Array.from(states.values()) as AwarenessState[]).forEach(state => {
          if (state.user) {
            users.push({
              name: state.user.name || 'Anonymous',
              color: state.user.color || '#958DF1',
            });
          }
        });
        setActiveUsers(users);
      }
    });
    setYReady(true);
  }, [documentId]);

  const handleBeforeUnload = () => {
    if (providerRef.current) {
      providerRef.current.awareness.setLocalState(null);
    }
  };

  useEffect(() => {
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (providerRef.current) {
        providerRef.current.awareness.setLocalState(null);
        providerRef.current.destroy();
        providerRef.current = null;
      }
      if (ydocRef.current) {
        ydocRef.current.destroy();
        ydocRef.current = null;
      }
      setYReady(false);
      setIsCollaborationReady(false);
    };
  }, []);

  const userColor = useMemo(() => getRandomColor(), []);
  const userInfo = useMemo(() => {
    if (!session?.user) return null;
    const baseName = session.user.name || session.user.email || 'Anonymous';
    const baseId =
      session.user.id || session.user.email || Math.random().toString(36);
    let name = baseName;
    let id = baseId;
    if (providerRef.current) {
      const states = providerRef.current.awareness.getStates();
      const names = (Array.from(states.values()) as AwarenessState[])
        .map(s => s?.user?.name)
        .filter(Boolean);
      const ids = (Array.from(states.values()) as AwarenessState[])
        .map(s => s?.user?.id)
        .filter(Boolean);
      let counter = 1;
      let candidateName = baseName;
      let candidateId = baseId;
      while (names.includes(candidateName) || ids.includes(candidateId)) {
        counter += 1;
        candidateName = `${baseName}-${counter}`;
        candidateId = `${baseId}-${counter}`;
      }
      name = candidateName;
      id = candidateId;
    }
    return {
      name,
      color: userColor,
      id,
    };
  }, [session?.user, userColor]);

  useEffect(() => {
    if (providerRef.current && userInfo && yReady) {
      try {
        providerRef.current.awareness.setLocalStateField('user', userInfo);
      } catch (error) {
        console.warn('Failed to set user awareness:', error);
      }
    }
  }, [userInfo, yReady]);

  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({
          codeBlock: false,
        }),
        Placeholder.configure({
          placeholder: 'Start writing your document...',
        }),
        Typography,
        CodeBlockLowlight.configure({
          lowlight,
        }),
        ...(yReady && ydocRef.current
          ? [
              Collaboration.configure({
                document: ydocRef.current,
              }),
            ]
          : []),
        ...(yReady && providerRef.current && userInfo
          ? [
              CollaborativeCursorExtension.configure({
                provider: providerRef.current,
              }),
            ]
          : []),
      ],
      immediatelyRender: false,
      editorProps: {
        attributes: {
          class: 'focus:outline-none min-h-[400px]',
        },
      },
      onTransaction: ({ editor }) => {
        setActiveFormats({
          bold: editor.isActive('bold'),
          italic: editor.isActive('italic'),
          code: editor.isActive('code'),
          heading1: editor.isActive('heading', { level: 1 }),
          heading2: editor.isActive('heading', { level: 2 }),
          heading3: editor.isActive('heading', { level: 3 }),
          bulletList: editor.isActive('bulletList'),
          orderedList: editor.isActive('orderedList'),
          codeBlock: editor.isActive('codeBlock'),
        });
      },
    },
    [documentId, yReady, isCollaborationReady, session?.user?.id]
  );

  useEffect(() => {
    if (providerRef.current && userInfo && yReady && editor) {
      providerRef.current.awareness.setLocalStateField('user', userInfo);
      const { anchor, head } = editor.state.selection;
      providerRef.current.awareness.setLocalStateField('cursor', {
        anchor,
        head,
      });
      providerRef.current.awareness.setLocalState(
        providerRef.current.awareness.getLocalState()
      );
    }
  }, [userInfo, yReady, editor]);

  useEffect(() => {
    if (!editor || !providerRef.current || !userInfo) return;
    const updateCursor = () => {
      const { anchor, head } = editor.state.selection;
      providerRef.current.awareness.setLocalStateField('cursor', {
        anchor,
        head,
      });
    };
    editor.on('selectionUpdate', updateCursor);
    updateCursor();
    return () => {
      editor.off('selectionUpdate', updateCursor);
    };
  }, [editor, userInfo, yReady]);

  useEffect(() => {
    if (!providerRef.current) return;
    const awareness = providerRef.current.awareness;
    let lastPeers = awareness.getStates().size;
    let timeout: NodeJS.Timeout | null = null;
    const rebroadcastIfNewPeer = () => {
      const peerCount = awareness.getStates().size;
      if (peerCount > lastPeers) {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => {
          awareness.setLocalState(awareness.getLocalState());
          timeout = null;
        }, 500);
      }
      lastPeers = peerCount;
    };
    awareness.on('update', rebroadcastIfNewPeer);
    return () => {
      awareness.off('update', rebroadcastIfNewPeer);
      if (timeout) clearTimeout(timeout);
    };
  }, [yReady, userInfo, editor]);

  useEffect(() => {
    if (!providerRef.current) return;
    const awareness = providerRef.current.awareness;
    const rebroadcast = () => bumpAwareness(awareness);
    window.addEventListener('visibilitychange', rebroadcast);
    window.addEventListener('focus', rebroadcast);
    return () => {
      window.removeEventListener('visibilitychange', rebroadcast);
      window.removeEventListener('focus', rebroadcast);
    };
  }, [yReady, userInfo, editor]);

  useEffect(() => {
    if (!providerRef.current) return;
    const awareness = providerRef.current.awareness;
    const interval = setInterval(() => {
      bumpAwareness(awareness);
    }, 10000);
    return () => clearInterval(interval);
  }, [yReady, userInfo, editor]);

  useEffect(() => {
    if (document && !title) {
      setTitle(document.title ?? '');
      setIsPublic(!!document.isPublic);
    }
  }, [document, title]);

  useEffect(() => {
    if (document && editor && !isCollaborationReady) {
      if (ydocRef.current && editor) {
        const yjsContent = ydocRef.current.getXmlFragment('default');
        const yjsArray = yjsContent.toArray();
        const isYjsEmpty =
          yjsArray.length === 0 ||
          (yjsArray.length === 1 && yjsArray[0].toString() === '<p></p>');
        if (isYjsEmpty && document.content) {
          editor.commands.setContent(document.content);
        }
      }
    }
  }, [document, editor, isCollaborationReady]);

  // Auto-save
  useEffect(() => {
    if (!editor || !document) return;
    let lastSavedContent = document.content;
    const interval = setInterval(() => {
      const currentContent = editor.getHTML();
      if (currentContent !== lastSavedContent) {
        console.log('Auto-saving content:', currentContent);
        updateDocument.mutate({
          id: documentId,
          content: currentContent,
        });
        lastSavedContent = currentContent;
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [editor, document, documentId, updateDocument]);

  const handleSaveMetadata = () => {
    if (document && title.trim()) {
      updateDocument.mutate({
        id: documentId,
        title: title.trim(),
        isPublic,
      });
    }
  };

  const handleDownload = () => {
    if (!editor || !title) return;

    const htmlContent = editor.getHTML();
    const turndownService = new TurndownService();
    const markdownContent = turndownService.turndown(htmlContent);

    const blob = new Blob([markdownContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div
          className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"
          role="status"
        ></div>
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
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-500">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`w-2 h-2 rounded-full ${isCollaborationReady ? 'bg-green-500' : 'bg-red-500'}`}
                    ></span>
                    <span>
                      {isCollaborationReady
                        ? `Document sync active • ${connectedUsers} user${connectedUsers !== 1 ? 's' : ''} online`
                        : 'Connecting...'}
                    </span>
                  </div>
                  {updateDocument.isPending && (
                    <span className="ml-2 text-blue-600">
                      Saving metadata...
                    </span>
                  )}
                </div>
                {activeUsers.length > 0 && (
                  <div className="flex items-center space-x-1">
                    {activeUsers.slice(0, 5).map((user, index) => (
                      <div
                        key={index}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-white shadow-sm"
                        style={{ backgroundColor: user.color }}
                        title={user.name}
                      >
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    ))}
                    {activeUsers.length > 5 && (
                      <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-white text-xs font-medium border-2 border-white shadow-sm">
                        +{activeUsers.length - 5}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleDownload}
                disabled={!editor || !title.trim()}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                📥 <span className="ml-1">Download</span>
              </button>
              <button
                onClick={handleSaveMetadata}
                disabled={updateDocument.isPending || !title.trim()}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {updateDocument.isPending ? 'Saving...' : 'Save Document'}
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
                Owner:{' '}
                {document.owner?.name || document.owner?.email || 'Unknown'}
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

          {editor && (
            <div className="flex items-center space-x-2 p-4 border-b border-gray-200 bg-gray-50">
              <button
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  activeFormats.bold
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                Bold
              </button>
              <button
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  activeFormats.italic
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                Italic
              </button>
              <button
                onClick={() => editor.chain().focus().toggleCode().run()}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  activeFormats.code
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
                  activeFormats.heading1
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
                  activeFormats.heading2
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
                  activeFormats.heading3
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
                  activeFormats.bulletList
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                Bullet List
              </button>
              <button
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  activeFormats.orderedList
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                Ordered List
              </button>
              <div className="w-px h-6 bg-gray-300"></div>
              <button
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  activeFormats.codeBlock
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                Code Block
              </button>
            </div>
          )}

          <div className="p-6">
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>
    </div>
  );
}
