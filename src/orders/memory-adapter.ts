import { type OrdersStorage, type BookID, type OrderId, type Order } from './types';
import { randomBytes } from 'crypto';

function generateOrderId(): string {
  return randomBytes(12).toString('hex');
}

export class InMemoryOrdersStorage implements OrdersStorage {
  private orders: Map<OrderId, Order> = new Map();

  async createOrder(books: BookID[]): Promise<{ orderId: OrderId }> {
    if (books.length === 0) {
      throw new Error('Order must contain at least one book');
    }

    const orderId = generateOrderId();

    // Count quantities for each book
    const bookCounts: Record<BookID, number> = {};
    for (const bookId of books) {
      bookCounts[bookId] = (bookCounts[bookId] ?? 0) + 1;
    }

    const order: Order = {
      orderId,
      books: bookCounts,
      fulfilled: false,
      createdAt: new Date()
    };

    this.orders.set(orderId, order);

    return { orderId };
  }

  async getOrder(orderId: OrderId): Promise<Order | null> {
    return this.orders.get(orderId) ?? null;
  }

  async listOrders(fulfilled?: boolean): Promise<Order[]> {
    const allOrders = Array.from(this.orders.values());

    if (fulfilled === undefined) {
      return allOrders.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    }

    return allOrders
      .filter(order => order.fulfilled === fulfilled)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async fulfillOrder(orderId: OrderId): Promise<void> {
    const order = this.orders.get(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    if (order.fulfilled) {
      throw new Error('Order already fulfilled');
    }

    order.fulfilled = true;
  }

  // For testing: clear all data
  clear(): void {
    this.orders.clear();
  }
}

// Singleton instance for production use
let ordersInstance: OrdersStorage | null = null;

export function getOrdersStorage(): OrdersStorage {
  if (!ordersInstance) {
    ordersInstance = new InMemoryOrdersStorage();
  }
  return ordersInstance;
}

export function setOrdersStorage(storage: OrdersStorage): void {
  ordersInstance = storage;
}
