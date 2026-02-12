import { getOrdersStorage } from './memory-adapter';
import type { OrderId } from './types';


export async function createOrder(books: string[]) {
  return getOrdersStorage().createOrder(books);
}

export async function listOrders() {
  return getOrdersStorage().listOrders();
}

export async function fulfillOrder(orderId: OrderId) {
  return getOrdersStorage().fulfillOrder(orderId);
}
