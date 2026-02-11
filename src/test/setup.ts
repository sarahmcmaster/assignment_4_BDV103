import { MongoMemoryServer } from 'mongodb-memory-server';
import { beforeAll, afterAll } from 'vitest';

let mongoServer: MongoMemoryServer | null = null;

beforeAll(async () => {
  // If docker-compose provides a Mongo URL, use it
  if (process.env.MONGODB_URL) {
    (global as Record<string, unknown>).MONGO_URI =
      process.env.MONGODB_URL;
    return;
  }

  // Otherwise fallback to MongoMemoryServer
  mongoServer = await MongoMemoryServer.create({
    binary: { version: '6.0.15' } // works on GitHub Actions (no libcrypto.so.1.1)
  });

  const uri = mongoServer.getUri();

  // Store the URI globally for tests to use
  (global as Record<string, unknown>).MONGO_URI =
    uri.slice(0, uri.lastIndexOf('/'));
}, 120000); // 2 minute timeout for setup

afterAll(async () => {
  if (mongoServer) {
    await mongoServer.stop();
    mongoServer = null;
  }
});
