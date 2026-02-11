import { z } from 'zod';
import { type ZodRouter } from 'koa-zod-router';
import { getOrdersStorage } from './memory-adapter';
import { getWarehouseStorage } from '../warehouse/memory-adapter';
import { getDatabase } from '../db';
import { ObjectId } from 'mongodb';
import type { FulfillmentItem } from './types';

// Helper to validate book IDs exist in the database
async function validateBookIds(bookIds: string[]): Promise<{ valid: boolean; invalidIds: string[] }> {
  const db = getDatabase();
  const collection = db.collection('books');
  const invalidIds: string[] = [];

  for (const bookId of bookIds) {
    try {
      const objectId = ObjectId.createFromHexString(bookId);
      const book = await collection.findOne({ _id: objectId });
      if (!book) {
        invalidIds.push(bookId);
      }
    } catch {
      invalidIds.push(bookId);
    }
  }

  return { valid: invalidIds.length === 0, invalidIds };
}

export function registerOrderRoutes(router: ZodRouter): void {
  // Create an order
  router.register({
    name: 'create order',
    method: 'post',
    path: '/orders',
    validate: {
      body: z.object({
        books: z.array(z.string()).min(1)
      })
    },
    handler: async (ctx, next) => {
      const { books } = ctx.request.body;
      const ordersStorage = getOrdersStorage();

      // Validate all book IDs exist
      const validation = await validateBookIds(books);
      if (!validation.valid) {
        ctx.status = 400;
        ctx.body = {
          error: 'Invalid book IDs',
          invalidIds: validation.invalidIds
        };
        await next();
        return;
      }

      try {
        const result = await ordersStorage.createOrder(books);
        ctx.status = 201;
        ctx.body = result;
      } catch (err) {
        ctx.status = 400;
        ctx.body = { error: (err as Error).message };
      }

      await next();
    }
  });

  // List all orders
  router.register({
    name: 'list orders',
    method: 'get',
    path: '/orders',
    validate: {
      query: z.object({
        fulfilled: z.enum(['true', 'false']).optional()
      })
    },
    handler: async (ctx, next) => {
      const { fulfilled } = ctx.request.query;
      const ordersStorage = getOrdersStorage();

      let fulfilledFilter: boolean | undefined;
      if (fulfilled === 'true') fulfilledFilter = true;
      if (fulfilled === 'false') fulfilledFilter = false;

      const orders = await ordersStorage.listOrders(fulfilledFilter);
      ctx.body = orders.map(order => ({
        orderId: order.orderId,
        books: order.books,
        fulfilled: order.fulfilled
      }));

      await next();
    }
  });

  // Get a specific order
  router.register({
    name: 'get order',
    method: 'get',
    path: '/orders/:orderId',
    validate: {
      params: z.object({
        orderId: z.string()
      })
    },
    handler: async (ctx, next) => {
      const { orderId } = ctx.request.params;
      const ordersStorage = getOrdersStorage();

      const order = await ordersStorage.getOrder(orderId);
      if (!order) {
        ctx.status = 404;
        ctx.body = { error: 'Order not found' };
      } else {
        ctx.body = {
          orderId: order.orderId,
          books: order.books,
          fulfilled: order.fulfilled
        };
      }

      await next();
    }
  });

  // Fulfill an order
  router.register({
    name: 'fulfill order',
    method: 'post',
    path: '/orders/:orderId/fulfill',
    validate: {
      params: z.object({
        orderId: z.string()
      }),
      body: z.object({
        fulfillment: z.array(z.object({
          book: z.string(),
          shelf: z.string(),
          numberOfBooks: z.number().int().positive()
        }))
      })
    },
    handler: async (ctx, next) => {
      const { orderId } = ctx.request.params;
      const { fulfillment } = ctx.request.body as { fulfillment: FulfillmentItem[] };
      const ordersStorage = getOrdersStorage();
      const warehouse = getWarehouseStorage();

      // Get the order
      const order = await ordersStorage.getOrder(orderId);
      if (!order) {
        ctx.status = 404;
        ctx.body = { error: 'Order not found' };
        await next();
        return;
      }

      if (order.fulfilled) {
        ctx.status = 400;
        ctx.body = { error: 'Order already fulfilled' };
        await next();
        return;
      }

      // Validate fulfillment matches order
      const fulfillmentCounts: Record<string, number> = {};
      for (const item of fulfillment) {
        fulfillmentCounts[item.book] = (fulfillmentCounts[item.book] ?? 0) + item.numberOfBooks;
      }

      for (const [bookId, required] of Object.entries(order.books)) {
        const provided = fulfillmentCounts[bookId] ?? 0;
        if (provided !== required) {
          ctx.status = 400;
          ctx.body = {
            error: `Fulfillment mismatch for book ${bookId}: required ${required}, provided ${provided}`
          };
          await next();
          return;
        }
      }

      // Remove books from shelves
      try {
        for (const item of fulfillment) {
          await warehouse.removeBooksFromShelf(item.book, item.numberOfBooks, item.shelf);
        }
      } catch (err) {
        ctx.status = 400;
        ctx.body = { error: (err as Error).message };
        await next();
        return;
      }

      // Mark order as fulfilled
      await ordersStorage.fulfillOrder(orderId);

      ctx.body = { success: true };
      await next();
    }
  });
}
