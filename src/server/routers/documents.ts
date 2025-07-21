import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure, Context } from '../trpc';

export const documentsRouter = createTRPCRouter({
  // Create document
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(255),
        content: z.string().optional().default(''),
        isPublic: z.boolean().optional().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const document = await ctx.prisma.document.create({
        data: {
          title: input.title,
          content: input.content,
          isPublic: input.isPublic,
          ownerId: ctx.session.user.id!,
        },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return document;
    }),

  // List documents for user
  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).optional().default(50),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const documents = await ctx.prisma.document.findMany({
        where: {
          OR: [
            { ownerId: ctx.session.user.id! },
            {
              collaborators: {
                some: {
                  userId: ctx.session.user.id!,
                },
              },
            },
          ],
        },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              collaborators: true,
            },
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
      });

      let nextCursor: typeof input.cursor | undefined = undefined;
      if (documents.length > input.limit) {
        const nextItem = documents.pop();
        nextCursor = nextItem!.id;
      }

      return {
        documents,
        nextCursor,
      };
    }),

  // Get document by ID
  byId: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const document = await ctx.prisma.document.findFirst({
        where: {
          id: input.id,
          OR: [
            { ownerId: ctx.session.user.id! },
            {
              collaborators: {
                some: {
                  userId: ctx.session.user.id!,
                },
              },
            },
            { isPublic: true },
          ],
        },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          collaborators: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      if (!document) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Document not found',
        });
      }

      return document;
    }),

  // Update document
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).max(255).optional(),
        content: z.string().optional(),
        isPublic: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const document = await ctx.prisma.document.findFirst({
        where: {
          id: input.id,
          OR: [
            { ownerId: ctx.session.user.id! },
            {
              collaborators: {
                some: {
                  userId: ctx.session.user.id!,
                  role: 'editor',
                },
              },
            },
          ],
        },
      });

      if (!document) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Document not found or no edit permission',
        });
      }

      const { id, ...updateData } = input;
      const updatedDocument = await ctx.prisma.document.update({
        where: { id },
        data: updateData,
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return updatedDocument;
    }),

  // Delete document
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const document = await ctx.prisma.document.findFirst({
        where: {
          id: input.id,
          ownerId: ctx.session.user.id!,
        },
      });

      if (!document) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Document not found or no delete permission',
        });
      }

      await ctx.prisma.document.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),
});

// Input types
type CreateInput = {
  title: string;
  content?: string;
  isPublic?: boolean;
};

type UpdateInput = {
  id: string;
  title?: string;
  content?: string;
  isPublic?: boolean;
};

export const createDocumentResolver = async ({
  ctx,
  input,
}: {
  ctx: Context;
  input: CreateInput;
}) => {
  const document = await ctx.prisma.document.create({
    data: {
      title: input.title,
      content: input.content,
      isPublic: input.isPublic,
      ownerId:
        ctx.session?.user?.id ??
        (() => {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Not authenticated',
          });
        })(),
    },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
  return document;
};

export const updateDocumentResolver = async ({
  ctx,
  input,
}: {
  ctx: Context;
  input: UpdateInput;
}) => {
  const document = await ctx.prisma.document.findFirst({
    where: {
      id: input.id,
      OR: [
        { ownerId: ctx.session?.user?.id ?? undefined },
        {
          collaborators: {
            some: {
              userId: ctx.session?.user?.id ?? undefined,
              role: 'editor',
            },
          },
        },
      ],
    },
  });
  if (!document) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Document not found or no edit permission',
    });
  }
  const { id, ...updateData } = input;
  const updatedDocument = await ctx.prisma.document.update({
    where: { id },
    data: updateData,
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
  return updatedDocument;
};

export const deleteDocumentResolver = async ({
  ctx,
  input,
}: {
  ctx: Context;
  input: { id: string };
}) => {
  const document = await ctx.prisma.document.findFirst({
    where: {
      id: input.id,
      ownerId: ctx.session!.user!.id!,
    },
  });
  if (!document) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Document not found or no delete permission',
    });
  }
  await ctx.prisma.document.delete({
    where: { id: input.id },
  });
  return { success: true };
};

export const getDocumentByIdResolver = async ({
  ctx,
  input,
}: {
  ctx: Context;
  input: { id: string };
}) => {
  const document = await ctx.prisma.document.findFirst({
    where: {
      id: input.id,
      OR: [
        { ownerId: ctx.session!.user!.id! },
        {
          collaborators: {
            some: {
              userId: ctx.session!.user!.id!,
            },
          },
        },
        { isPublic: true },
      ],
    },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      collaborators: true,
    },
  });
  if (!document) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Document not found',
    });
  }
  return document;
};
