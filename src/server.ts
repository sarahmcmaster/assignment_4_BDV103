import Koa from 'koa';
import cors from '@koa/cors';
import zodRouter from 'koa-zod-router';
import qs from 'koa-qs';
import { connectToDatabase } from './db';
import { registerBookRoutes } from './books/book_routes';
import { registerWarehouseRoutes } from './warehouse/routes';
import { registerOrderRoutes } from './orders/routes';

const app = new Koa();

// We use koa-qs to enable parsing complex query strings, like our filters.
qs(app);

// And we add cors to ensure we can access our API from the mcmasterful-books website
app.use(cors());

const router = zodRouter();

// Register all routes
registerBookRoutes(router);
registerWarehouseRoutes(router);
registerOrderRoutes(router);

app.use(router.routes());

// Connect to database and start server
connectToDatabase()
  .then(() => {
    app.listen(3000, () => {
      console.log('Server listening on port 3000');
    });
  })
  .catch((err) => {
    console.error('Failed to connect to database:', err);
    process.exit(1);
  });
