import { z } from 'zod';
import { type ZodRouter } from 'koa-zod-router';
import { getDatabase } from '../db';
import { ObjectId, Db } from 'mongodb';
import { getBookStock } from '../warehouse/api';


export interface BookWithId {
  id: string;
  name: string;
  author: string;
  description: string;
  price: number;
  image: string;
  stock?: number;
}

interface BookDocument {
  name: string;
  author: string;
  description: string;
  price: number;
  image: string;
}

// Domain logic function - testable without route
export async function lookupBookById(
  bookId: string,
  db: Db,
  includeStock = false
): Promise<BookWithId | null> {
  try {
    const objectId = ObjectId.createFromHexString(bookId);
    const collection = db.collection<BookDocument>('books');
    const document = await collection.findOne({ _id: objectId });

    if (!document) {
      return null;
    }

    const book: BookWithId = {
      id: document._id.toHexString(),
      name: document.name,
      author: document.author,
      description: document.description,
      price: document.price,
      image: document.image
    };

    // Add stock if warehouse requests
     if (includeStock) {
  book.stock = await getBookStock(bookId);
      }

    return book;
  } catch {
    // Invalid ObjectId format
    return null;
  }
}

// Route wrapper
export default function lookupBookByIdRoute(router: ZodRouter): void {
  router.register({
    name: 'lookup book by id',
    method: 'get',
    path: '/books/:id',
    validate: {
      params: z.object({
        id: z.string()
      })
    },
    handler: async (ctx, next) => {
      const { id } = ctx.request.params;
      const db = getDatabase();
      const book = await lookupBookById(id, db, true);


      if (book) {
        ctx.body = book;
      } else {
        ctx.status = 404;
        ctx.body = { error: 'Book not found' };
      }

      await next();
    }
  });
}
