import { createTRPCRouter } from './trpc';
import { documentsRouter } from './routers/documents';

export const appRouter = createTRPCRouter({
  documents: documentsRouter,
});

export type AppRouter = typeof appRouter;
