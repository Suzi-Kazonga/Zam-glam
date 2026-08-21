export class CartService {
  constructor() {
    this.items = [];
  }

  addItem(item) {
    const existing = this.items.find((cartItem) => cartItem.id === item.id);

    if (existing) {
      existing.quantity += 1;
      return this.items;
    }

    this.items.push({ ...item, quantity: 1 });
    return this.items;
  }

  removeItem(id) {
    this.items = this.items.filter((item) => item.id !== id);
    return this.items;
  }

  getItems() {
    return this.items;
  }
}

export default new CartService();
