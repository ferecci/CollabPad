import { prisma } from './prisma'
import type { User, Document, DocumentCollaborator } from '@prisma/client'

// User operations
export async function createUser(data: {
  email: string
  name?: string
  image?: string
}): Promise<User> {
  return prisma.user.create({
    data,
  })
}

export async function getUserById(id: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: { id },
  })
}

export async function getUserByEmail(email: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: { email },
  })
}

// Document operations
export async function createDocument(data: {
  title: string
  content?: string
  ownerId: string
  isPublic?: boolean
}): Promise<Document> {
  return prisma.document.create({
    data,
  })
}

export async function getDocumentById(id: string): Promise<Document | null> {
  return prisma.document.findUnique({
    where: { id },
    include: {
      owner: true,
      collaborators: {
        include: {
          user: true,
        },
      },
    },
  })
}

export async function getUserDocuments(userId: string): Promise<Document[]> {
  return prisma.document.findMany({
    where: {
      OR: [
        { ownerId: userId },
        {
          collaborators: {
            some: {
              userId,
            },
          },
        },
      ],
    },
    include: {
      owner: true,
      collaborators: {
        include: {
          user: true,
        },
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
  })
}

export async function updateDocument(
  id: string,
  data: {
    title?: string
    content?: string
    isPublic?: boolean
  }
): Promise<Document> {
  return prisma.document.update({
    where: { id },
    data,
  })
}

export async function deleteDocument(id: string): Promise<Document> {
  return prisma.document.delete({
    where: { id },
  })
}

// Collaboration operations
export async function addCollaborator(data: {
  documentId: string
  userId: string
  role?: string
}): Promise<DocumentCollaborator> {
  return prisma.documentCollaborator.create({
    data,
  })
}

export async function removeCollaborator(
  documentId: string,
  userId: string
): Promise<DocumentCollaborator> {
  return prisma.documentCollaborator.delete({
    where: {
      documentId_userId: {
        documentId,
        userId,
      },
    },
  })
}

export async function updateCollaboratorRole(
  documentId: string,
  userId: string,
  role: string
): Promise<DocumentCollaborator> {
  return prisma.documentCollaborator.update({
    where: {
      documentId_userId: {
        documentId,
        userId,
      },
    },
    data: { role },
  })
} 