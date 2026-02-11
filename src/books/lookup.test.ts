import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestDatabase, type DatabaseAccessor } from '../db';
import { ObjectId } from 'mongodb';
import { lookupBookById } from './lookup';

interface Book {
  name: string;
  author: string;
  description: string;
  price: number;
  image: string;
}

describe('lookupBookById', () => {
  let testDb: DatabaseAccessor;

  beforeEach(async () => {
    testDb = await createTestDatabase();
  });

  afterEach(async () => {
    await testDb.close();
  });

  it('should return a book when found by ID', async () => {
    const collection = testDb.db.collection<Book>('books');
    const insertResult = await collection.insertOne({
      name: 'Test Book',
      author: 'Test Author',
      description: 'A test book',
      price: 19.99,
      image: 'https://example.com/image.jpg'
    });

    const result = await lookupBookById(insertResult.insertedId.toHexString(), testDb.db);

    expect(result).not.toBeNull();
    expect(result?.name).toBe('Test Book');
    expect(result?.author).toBe('Test Author');
    expect(result?.id).toBe(insertResult.insertedId.toHexString());
  });

  it('should return null when book is not found', async () => {
    const fakeId = new ObjectId().toHexString();
    const result = await lookupBookById(fakeId, testDb.db);

    expect(result).toBeNull();
  });

  it('should return null for invalid ObjectId format', async () => {
    const result = await lookupBookById('invalid-id', testDb.db);

    expect(result).toBeNull();
  });
});
