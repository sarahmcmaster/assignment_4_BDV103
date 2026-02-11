import { type WarehouseStorage, type BookID, type ShelfId, type ShelfStock } from './types';

export class InMemoryWarehouseStorage implements WarehouseStorage {
  // Map: bookId -> Map<shelfId, count>
  private storage: Map<BookID, Map<ShelfId, number>> = new Map();

  async placeBooksOnShelf(bookId: BookID, numberOfBooks: number, shelf: ShelfId): Promise<void> {
    if (numberOfBooks <= 0) {
      throw new Error('Number of books must be positive');
    }

    let bookShelves = this.storage.get(bookId);
    if (!bookShelves) {
      bookShelves = new Map();
      this.storage.set(bookId, bookShelves);
    }

    const currentCount = bookShelves.get(shelf) ?? 0;
    bookShelves.set(shelf, currentCount + numberOfBooks);
  }

  async findBookOnShelf(bookId: BookID): Promise<ShelfStock[]> {
    const bookShelves = this.storage.get(bookId);
    if (!bookShelves) {
      return [];
    }

    const result: ShelfStock[] = [];
    for (const [shelf, count] of bookShelves.entries()) {
      if (count > 0) {
        result.push({ shelf, count });
      }
    }

    return result;
  }

  async getTotalStock(bookId: BookID): Promise<number> {
    const bookShelves = this.storage.get(bookId);
    if (!bookShelves) {
      return 0;
    }

    let total = 0;
    for (const count of bookShelves.values()) {
      total += count;
    }

    return total;
  }

  async removeBooksFromShelf(bookId: BookID, numberOfBooks: number, shelf: ShelfId): Promise<void> {
    if (numberOfBooks <= 0) {
      throw new Error('Number of books must be positive');
    }

    const bookShelves = this.storage.get(bookId);
    if (!bookShelves) {
      throw new Error('Book not found in warehouse');
    }

    const currentCount = bookShelves.get(shelf) ?? 0;
    if (currentCount < numberOfBooks) {
      throw new Error(`Not enough books on shelf. Available: ${currentCount}, requested: ${numberOfBooks}`);
    }

    const newCount = currentCount - numberOfBooks;
    if (newCount === 0) {
      bookShelves.delete(shelf);
    } else {
      bookShelves.set(shelf, newCount);
    }

    // Clean up empty book entries
    if (bookShelves.size === 0) {
      this.storage.delete(bookId);
    }
  }

  // For testing: clear all data
  clear(): void {
    this.storage.clear();
  }
}

// Singleton instance for production use
let warehouseInstance: WarehouseStorage | null = null;

export function getWarehouseStorage(): WarehouseStorage {
  if (!warehouseInstance) {
    warehouseInstance = new InMemoryWarehouseStorage();
  }
  return warehouseInstance;
}

export function setWarehouseStorage(storage: WarehouseStorage): void {
  warehouseInstance = storage;
}
