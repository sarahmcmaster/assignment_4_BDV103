import { z } from 'zod';
import { type ZodRouter } from 'koa-zod-router';
import { getWarehouseStorage } from './memory-adapter';

export function registerWarehouseRoutes(router: ZodRouter): void {
  // Place books on shelf
  router.register({
    name: 'place books on shelf',
    method: 'post',
    path: '/warehouse/shelves',
    validate: {
      body: z.object({
        bookId: z.string(),
        numberOfBooks: z.number().int().positive(),
        shelf: z.string()
      })
    },
    handler: async (ctx, next) => {
      const { bookId, numberOfBooks, shelf } = ctx.request.body;
      const warehouse = getWarehouseStorage();

      try {
        await warehouse.placeBooksOnShelf(bookId, numberOfBooks, shelf);
        ctx.status = 201;
        ctx.body = { success: true };
      } catch (err) {
        ctx.status = 400;
        ctx.body = { error: (err as Error).message };
      }

      await next();
    }
  });

  // Find book locations
  router.register({
    name: 'find book on shelf',
    method: 'get',
    path: '/warehouse/books/:bookId/locations',
    validate: {
      params: z.object({
        bookId: z.string()
      })
    },
    handler: async (ctx, next) => {
      const { bookId } = ctx.request.params;
      const warehouse = getWarehouseStorage();

      const locations = await warehouse.findBookOnShelf(bookId);
      ctx.body = locations;

      await next();
    }
  });

  // Get total stock for a book
  router.register({
    name: 'get book stock',
    method: 'get',
    path: '/warehouse/books/:bookId/stock',
    validate: {
      params: z.object({
        bookId: z.string()
      })
    },
    handler: async (ctx, next) => {
      const { bookId } = ctx.request.params;
      const warehouse = getWarehouseStorage();

      const stock = await warehouse.getTotalStock(bookId);
      ctx.body = { bookId, stock };

      await next();
    }
  });
}
