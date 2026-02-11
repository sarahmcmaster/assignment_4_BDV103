import previous_assignment from './assignment-3';

const API_BASE = 'http://localhost:3000';

export type BookID = string;

export interface Book {
  id?: BookID;
  name: string;
  author: string;
  description: string;
  price: number;
  image: string;
  stock?: number;
}

export interface Filter {
  from?: number;
  to?: number;
  name?: string;
  author?: string;
}

// If multiple filters are provided, any book that matches at least one of them should be returned
// Within a single filter, a book would need to match all the given conditions
async function listBooks(filters?: Filter[]): Promise<Book[]> {
  const query = filters?.map(({ from, to, name, author }, index) => {
    let result = '';
    if (typeof from === 'number') {
      result += `&filters[${index}][from]=${from}`;
    }
    if (typeof to === 'number') {
      result += `&filters[${index}][to]=${to}`;
    }
    if (typeof name === 'string' && name.trim().length > 0) {
      result += `&filters[${index}][name]=${encodeURIComponent(name.trim())}`;
    }
    if (typeof author === 'string' && author.trim().length > 0) {
      result += `&filters[${index}][author]=${encodeURIComponent(author.trim())}`;
    }
    return result;
  }).join('') ?? '';

  const result = await fetch(`${API_BASE}/books?${query}`);

  if (result.ok) {
    return await result.json() as Book[];
  } else {
    throw new Error('Failed to fetch books');
  }
}

async function createOrUpdateBook(book: Book): Promise<BookID> {
  return await previous_assignment.createOrUpdateBook(book);
}

async function removeBook(book: BookID): Promise<void> {
  await previous_assignment.removeBook(book);
}

async function lookupBookById(bookId: BookID): Promise<Book> {
  const result = await fetch(`${API_BASE}/books/${bookId}`);

  if (result.ok) {
    return await result.json() as Book;
  } else if (result.status === 404) {
    throw new Error('Book not found');
  } else {
    throw new Error('Failed to lookup book');
  }
}

export type ShelfId = string;
export type OrderId = string;

async function placeBooksOnShelf(bookId: BookID, numberOfBooks: number, shelf: ShelfId): Promise<void> {
  const result = await fetch(`${API_BASE}/warehouse/shelves`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bookId, numberOfBooks, shelf })
  });

  if (!result.ok) {
    const error = await result.json() as { error?: string };
    throw new Error(error.error ?? 'Failed to place books on shelf');
  }
}

async function orderBooks(books: BookID[]): Promise<{ orderId: OrderId }> {
  const result = await fetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ books })
  });

  if (result.ok) {
    return await result.json() as { orderId: OrderId };
  } else {
    const error = await result.json() as { error?: string };
    throw new Error(error.error ?? 'Failed to create order');
  }
}

async function findBookOnShelf(bookId: BookID): Promise<Array<{ shelf: ShelfId; count: number }>> {
  const result = await fetch(`${API_BASE}/warehouse/books/${bookId}/locations`);

  if (result.ok) {
    return await result.json() as Array<{ shelf: ShelfId; count: number }>;
  } else {
    throw new Error('Failed to find book locations');
  }
}

async function fulfilOrder(
  orderId: OrderId,
  booksFulfilled: Array<{ book: BookID; shelf: ShelfId; numberOfBooks: number }>
): Promise<void> {
  const result = await fetch(`${API_BASE}/orders/${orderId}/fulfill`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fulfillment: booksFulfilled })
  });

  if (!result.ok) {
    const error = await result.json() as { error?: string };
    throw new Error(error.error ?? 'Failed to fulfill order');
  }
}

async function listOrders(): Promise<Array<{ orderId: OrderId; books: Record<BookID, number> }>> {
  const result = await fetch(`${API_BASE}/orders`);

  if (result.ok) {
    const orders = await result.json() as Array<{ orderId: OrderId; books: Record<BookID, number> }>;
    return orders;
  } else {
    throw new Error('Failed to list orders');
  }
}

const assignment = 'assignment-4';

export default {
  assignment,
  createOrUpdateBook,
  removeBook,
  listBooks,
  placeBooksOnShelf,
  orderBooks,
  findBookOnShelf,
  fulfilOrder,
  listOrders,
  lookupBookById
};
