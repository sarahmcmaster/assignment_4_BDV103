import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestDatabase, type DatabaseAccessor } from '../db';

describe('Database Connection', () => {
  let testDb: DatabaseAccessor;

  beforeEach(async () => {
    testDb = await createTestDatabase();
  });

  afterEach(async () => {
    await testDb.close();
  });

  it('should connect to the test database', async () => {
    expect(testDb.db).toBeDefined();
  });

  it('should be able to insert and retrieve documents', async () => {
    const collection = testDb.db.collection('test');
    await collection.insertOne({ name: 'test', value: 42 });

    const result = await collection.findOne({ name: 'test' });
    expect(result).toBeDefined();
    expect(result?.value).toBe(42);
  });

  it('should have isolated databases between tests', async () => {
    const collection = testDb.db.collection('test');
    const count = await collection.countDocuments();
    // Each test gets a fresh database, so it should be empty
    expect(count).toBe(0);
  });
});
