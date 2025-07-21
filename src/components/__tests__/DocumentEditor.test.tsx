import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, beforeEach, vi, expect } from 'vitest';
import { SessionProvider } from 'next-auth/react';

type MockTrpc = {
  documents: {
    byId: {
      useQuery: { mockReturnValue: (v: unknown) => void };
    };
  };
};

vi.mock('../../lib/trpc', () => ({
  trpc: {
    documents: {
      byId: {
        useQuery: vi.fn(() => ({
          data: {
            id: 'doc1',
            title: 'Test Doc',
            content: '<p>Initial content</p>',
            isPublic: false,
            owner: { name: 'Owner', email: 'owner@example.com' },
          },
          isLoading: false,
          error: null,
        })),
      },
      update: {
        useMutation: vi.fn(() => ({ mutate: vi.fn() })),
      },
    },
  },
}));

describe('DocumentEditor', () => {
  let trpc: unknown;
  beforeEach(async () => {
    trpc = (await import('../../lib/trpc')).trpc;
    (trpc as MockTrpc).documents.byId.useQuery.mockReturnValue({
      data: {
        id: 'doc1',
        title: 'Test Doc',
        content: '<p>Initial content</p>',
        isPublic: false,
        owner: { name: 'Owner', email: 'owner@example.com' },
      },
      isLoading: false,
      error: null,
    });
  });

  it('renders with initial data and allows title edit', async () => {
    const { DocumentEditor } = await import('../DocumentEditor');
    render(
      <SessionProvider session={null}>
        <DocumentEditor documentId="doc1" />
      </SessionProvider>
    );
    expect(screen.getByDisplayValue('Test Doc')).toBeInTheDocument();
    fireEvent.change(screen.getByDisplayValue('Test Doc'), {
      target: { value: 'New Title' },
    });
    expect(screen.getByDisplayValue('New Title')).toBeInTheDocument();
  });

  it('shows loading spinner if loading', async () => {
    const { DocumentEditor } = await import('../DocumentEditor');
    render(
      <SessionProvider session={null}>
        <DocumentEditor
          documentId="doc1"
          testQueryResult={{ isLoading: true, data: undefined, error: null }}
        />
      </SessionProvider>
    );
    await screen.findByRole('status');
  });

  it('shows error if document not found', async () => {
    const { DocumentEditor } = await import('../DocumentEditor');
    render(
      <SessionProvider session={null}>
        <DocumentEditor
          documentId="doc1"
          testQueryResult={{
            isLoading: false,
            data: undefined,
            error: { message: 'Not found' },
          }}
        />
      </SessionProvider>
    );
    await screen.findByText(/document not found/i);
  });
});
