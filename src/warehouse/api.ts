
import { getWarehouseStorage } from './memory-adapter';

// Expose only what other subdomains are allowed to use - hides adapter
export async function getBookStock(bookId: string): Promise<number> {
  const warehouse = getWarehouseStorage();
  return warehouse.getTotalStock(bookId);
}
//exposes removeBooksFromShelf so orders can use it 
export async function removeBooksFromShelf(
  bookId: string,
  numberOfBooks: number,
  shelf: string
): Promise<void> {
  const warehouse = getWarehouseStorage();
  await warehouse.removeBooksFromShelf(bookId, numberOfBooks, shelf);
}