export type BookID = string;
export type ShelfId = string;

export interface ShelfStock {
  shelf: ShelfId;
  count: number;
}

// Port interface for warehouse storage
export interface WarehouseStorage {
  // Place books on a shelf
  placeBooksOnShelf(bookId: BookID, numberOfBooks: number, shelf: ShelfId): Promise<void>;

  // Find where a book is located
  findBookOnShelf(bookId: BookID): Promise<ShelfStock[]>;

  // Get total stock for a book
  getTotalStock(bookId: BookID): Promise<number>;

  // Remove books from a shelf (for order fulfillment)
  removeBooksFromShelf(bookId: BookID, numberOfBooks: number, shelf: ShelfId): Promise<void>;
}
