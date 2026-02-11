import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryWarehouseStorage } from './memory-adapter';

describe('Warehouse Storage', () => {
  let warehouse: InMemoryWarehouseStorage;

  beforeEach(() => {
    warehouse = new InMemoryWarehouseStorage();
  });

  describe('placeBooksOnShelf', () => {
    it('should place books on a new shelf', async () => {
      await warehouse.placeBooksOnShelf('book1', 5, 'shelf-A');
      const stock = await warehouse.findBookOnShelf('book1');

      expect(stock).toEqual([{ shelf: 'shelf-A', count: 5 }]);
    });

    it('should add to existing count on same shelf', async () => {
      await warehouse.placeBooksOnShelf('book1', 5, 'shelf-A');
      await warehouse.placeBooksOnShelf('book1', 3, 'shelf-A');
      const stock = await warehouse.findBookOnShelf('book1');

      expect(stock).toEqual([{ shelf: 'shelf-A', count: 8 }]);
    });

    it('should place books on multiple shelves', async () => {
      await warehouse.placeBooksOnShelf('book1', 5, 'shelf-A');
      await warehouse.placeBooksOnShelf('book1', 3, 'shelf-B');
      const stock = await warehouse.findBookOnShelf('book1');

      expect(stock).toHaveLength(2);
      expect(stock).toContainEqual({ shelf: 'shelf-A', count: 5 });
      expect(stock).toContainEqual({ shelf: 'shelf-B', count: 3 });
    });

    it('should reject non-positive number of books', async () => {
      await expect(warehouse.placeBooksOnShelf('book1', 0, 'shelf-A'))
        .rejects.toThrow('Number of books must be positive');
      await expect(warehouse.placeBooksOnShelf('book1', -1, 'shelf-A'))
        .rejects.toThrow('Number of books must be positive');
    });
  });

  describe('findBookOnShelf', () => {
    it('should return empty array for unknown book', async () => {
      const stock = await warehouse.findBookOnShelf('unknown-book');
      expect(stock).toEqual([]);
    });

    it('should not return shelves with zero count', async () => {
      await warehouse.placeBooksOnShelf('book1', 5, 'shelf-A');
      await warehouse.removeBooksFromShelf('book1', 5, 'shelf-A');
      const stock = await warehouse.findBookOnShelf('book1');

      expect(stock).toEqual([]);
    });
  });

  describe('getTotalStock', () => {
    it('should return 0 for unknown book', async () => {
      const total = await warehouse.getTotalStock('unknown-book');
      expect(total).toBe(0);
    });

    it('should sum stock across all shelves', async () => {
      await warehouse.placeBooksOnShelf('book1', 5, 'shelf-A');
      await warehouse.placeBooksOnShelf('book1', 3, 'shelf-B');
      await warehouse.placeBooksOnShelf('book1', 2, 'shelf-C');
      const total = await warehouse.getTotalStock('book1');

      expect(total).toBe(10);
    });
  });

  describe('removeBooksFromShelf', () => {
    it('should reduce book count on shelf', async () => {
      await warehouse.placeBooksOnShelf('book1', 10, 'shelf-A');
      await warehouse.removeBooksFromShelf('book1', 3, 'shelf-A');
      const stock = await warehouse.findBookOnShelf('book1');

      expect(stock).toEqual([{ shelf: 'shelf-A', count: 7 }]);
    });

    it('should remove shelf entry when count reaches zero', async () => {
      await warehouse.placeBooksOnShelf('book1', 5, 'shelf-A');
      await warehouse.removeBooksFromShelf('book1', 5, 'shelf-A');
      const stock = await warehouse.findBookOnShelf('book1');

      expect(stock).toEqual([]);
    });

    it('should throw when not enough books on shelf', async () => {
      await warehouse.placeBooksOnShelf('book1', 3, 'shelf-A');

      await expect(warehouse.removeBooksFromShelf('book1', 5, 'shelf-A'))
        .rejects.toThrow('Not enough books on shelf');
    });

    it('should throw for unknown book', async () => {
      await expect(warehouse.removeBooksFromShelf('unknown', 1, 'shelf-A'))
        .rejects.toThrow('Book not found in warehouse');
    });

    it('should reject non-positive number', async () => {
      await warehouse.placeBooksOnShelf('book1', 5, 'shelf-A');

      await expect(warehouse.removeBooksFromShelf('book1', 0, 'shelf-A'))
        .rejects.toThrow('Number of books must be positive');
    });
  });
});
