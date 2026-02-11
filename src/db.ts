import { Db, MongoClient, Collection, Document } from 'mongodb';

// Use test URI if available, otherwise use environment variable or default
function getMongoUri(): string {
  const testUri = (global as Record<string, unknown>).MONGO_URI as string | undefined;
  return testUri ?? process.env.MONGODB_URL ?? 'mongodb://localhost:27017';
}

function isTestEnvironment(): boolean {
  return (global as Record<string, unknown>).MONGO_URI !== undefined;
}

let client: MongoClient | null = null;
let database: Db | null = null;

export async function connectToDatabase(dbName?: string): Promise<Db> {
  if (database && !dbName) {
    return database;
  }

  const uri = getMongoUri();
  client = new MongoClient(uri);
  await client.connect();

  // In test mode, use random database name for isolation if not specified
  const databaseName = dbName ?? (isTestEnvironment()
    ? `test_${Math.floor(Math.random() * 100000)}`
    : 'mcmasterful-books');

  database = client.db(databaseName);
  return database;
}

export async function disconnectFromDatabase(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    database = null;
  }
}

export function getDatabase(): Db {
  if (!database) {
    throw new Error('Database not connected. Call connectToDatabase first.');
  }
  return database;
}

// Helper to get a typed collection
export function getCollection<T extends Document>(name: string): Collection<T> {
  return getDatabase().collection<T>(name);
}

// For testing: create a fresh database accessor with isolation
export interface DatabaseAccessor {
  db: Db;
  close: () => Promise<void>;
}

export async function createTestDatabase(): Promise<DatabaseAccessor> {
  const uri = getMongoUri();
  const testClient = new MongoClient(uri);
  await testClient.connect();

  const dbName = `test_${Math.floor(Math.random() * 100000)}`;
  const db = testClient.db(dbName);

  return {
    db,
    close: async () => {
      await db.dropDatabase();
      await testClient.close();
    }
  };
}
