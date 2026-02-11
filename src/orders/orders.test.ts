import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryOrdersStorage } from './memory-adapter';

describe('Orders Storage', () => {
  let orders: InMemoryOrdersStorage;

  beforeEach(() => {
    orders = new InMemoryOrdersStorage();
  });

  describe('createOrder', () => {
    it('should create an order with a single book', async () => {
      const result = await orders.createOrder(['book1']);

      expect(result.orderId).toBeDefined();
      expect(typeof result.orderId).toBe('string');
    });

    it('should create an order with multiple books', async () => {
      const result = await orders.createOrder(['book1', 'book2', 'book1']);

      const order = await orders.getOrder(result.orderId);
      expect(order).not.toBeNull();
      expect(order?.books).toEqual({ book1: 2, book2: 1 });
    });

    it('should reject empty order', async () => {
      await expect(orders.createOrder([]))
        .rejects.toThrow('Order must contain at least one book');
    });

    it('should set fulfilled to false initially', async () => {
      const result = await orders.createOrder(['book1']);
      const order = await orders.getOrder(result.orderId);

      expect(order?.fulfilled).toBe(false);
    });
  });

  describe('getOrder', () => {
    it('should return null for unknown order', async () => {
      const order = await orders.getOrder('unknown-id');
      expect(order).toBeNull();
    });

    it('should return the order when found', async () => {
      const { orderId } = await orders.createOrder(['book1', 'book2']);
      const order = await orders.getOrder(orderId);

      expect(order).not.toBeNull();
      expect(order?.orderId).toBe(orderId);
      expect(order?.books).toEqual({ book1: 1, book2: 1 });
    });
  });

  describe('listOrders', () => {
    it('should return empty array when no orders', async () => {
      const allOrders = await orders.listOrders();
      expect(allOrders).toEqual([]);
    });

    it('should return all orders', async () => {
      await orders.createOrder(['book1']);
      await orders.createOrder(['book2']);
      await orders.createOrder(['book3']);

      const allOrders = await orders.listOrders();
      expect(allOrders).toHaveLength(3);
    });

    it('should filter by fulfilled status', async () => {
      const { orderId: order1 } = await orders.createOrder(['book1']);
      await orders.createOrder(['book2']);
      await orders.fulfillOrder(order1);

      const pending = await orders.listOrders(false);
      const fulfilled = await orders.listOrders(true);

      expect(pending).toHaveLength(1);
      expect(fulfilled).toHaveLength(1);
    });

    it('should order by creation time', async () => {
      const { orderId: id1 } = await orders.createOrder(['book1']);
      const { orderId: id2 } = await orders.createOrder(['book2']);
      const { orderId: id3 } = await orders.createOrder(['book3']);

      const allOrders = await orders.listOrders();
      expect(allOrders[0].orderId).toBe(id1);
      expect(allOrders[1].orderId).toBe(id2);
      expect(allOrders[2].orderId).toBe(id3);
    });
  });

  describe('fulfillOrder', () => {
    it('should mark order as fulfilled', async () => {
      const { orderId } = await orders.createOrder(['book1']);
      await orders.fulfillOrder(orderId);

      const order = await orders.getOrder(orderId);
      expect(order?.fulfilled).toBe(true);
    });

    it('should throw for unknown order', async () => {
      await expect(orders.fulfillOrder('unknown'))
        .rejects.toThrow('Order not found');
    });

    it('should throw if already fulfilled', async () => {
      const { orderId } = await orders.createOrder(['book1']);
      await orders.fulfillOrder(orderId);

      await expect(orders.fulfillOrder(orderId))
        .rejects.toThrow('Order already fulfilled');
    });
  });
});
