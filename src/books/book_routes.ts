import { type ZodRouter } from 'koa-zod-router';
import booksList from './lists';
import createOrUpdateBook from './create';
import deleteBook from './delete';
import lookupBookByIdRoute from './lookup';

export function registerBookRoutes(router: ZodRouter): void {
  booksList(router);
  createOrUpdateBook(router);
  deleteBook(router);
  lookupBookByIdRoute(router);
}
