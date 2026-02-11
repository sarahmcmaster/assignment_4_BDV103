export type BookID = string;
export type OrderId = string;

export interface Order {
  orderId: OrderId;
  books: Record<BookID, number>; // bookId -> quantity
  fulfilled: boolean;
  createdAt: Date;
}

export interface FulfillmentItem {
  book: BookID;
  shelf: string;
  numberOfBooks: number;
}

// Port interface for orders storage
export interface OrdersStorage {
  // Create a new order
  createOrder(books: BookID[]): Promise<{ orderId: OrderId }>;

  // Get an order by ID
  getOrder(orderId: OrderId): Promise<Order | null>;

  // List all orders (optionally filter by fulfilled status)
  listOrders(fulfilled?: boolean): Promise<Order[]>;

  // Mark order as fulfilled
  fulfillOrder(orderId: OrderId): Promise<void>;
}

// Function to validate books exist (injected dependency)
export type BookValidator = (bookIds: BookID[]) => Promise<boolean>;
