import { getDatabase } from '../db';
import { ObjectId } from 'mongodb';

export async function bookExists(bookId: string): Promise<boolean> {
  try {
    const db = getDatabase();
    const objectId = ObjectId.createFromHexString(bookId);
    const result = await db.collection('books').findOne({ _id: objectId });
    return result !== null;
  } catch {
    return false;
  }
}
