
import { getWarehouseStorage } from './memory-adapter';

// Expose only what other subdomains are allowed to use - hides adapter
export async function getBookStock(bookId: string): Promise<number> {
  const warehouse = getWarehouseStorage();
  return warehouse.getTotalStock(bookId);
}
