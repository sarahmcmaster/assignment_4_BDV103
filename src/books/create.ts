import { z } from 'zod';
import { type ZodRouter } from 'koa-zod-router';
import { getDatabase } from '../db';
import { ObjectId } from 'mongodb';

export default function createOrUpdateBook(router: ZodRouter): void {
  router.register({
    name: 'create or update a book',
    method: 'post',
    path: '/books',
    validate: {
      body: z.object({
        id: z.string().optional(),
        name: z.string(),
        price: z.coerce.number(),
        description: z.string(),
        author: z.string(),
        image: z.string()
      })
    },
    handler: async (ctx, next) => {
      const body = ctx.request.body;
      const db = getDatabase();
      const bookCollection = db.collection('books');

      if (typeof body.id === 'string') {
        const id = body.id;
        try {
          const result = await bookCollection.replaceOne({ _id: { $eq: ObjectId.createFromHexString(id) } }, {
            id,
            name: body.name,
            description: body.description,
            price: body.price,
            author: body.author,
            image: body.image
          });
          if (result.modifiedCount === 1) {
            ctx.body = { id };
          } else {
            ctx.status = 404;
          }
        } catch {
          ctx.status = 500;
        }
      } else {
        try {
          const result = await bookCollection.insertOne({
            name: body.name,
            description: body.description,
            price: body.price,
            author: body.author,
            image: body.image
          });
          ctx.body = { id: result.insertedId };
        } catch {
          ctx.status = 500;
        }
      }
      await next();
    }
  });
}
