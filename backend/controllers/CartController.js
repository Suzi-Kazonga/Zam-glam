import cartService from '../services/CartService.js';

export class CartController {
  view(req, res) {
    res.json(cartService.getItems());
  }

  add(req, res) {
    const updated = cartService.addItem(req.body);
    res.status(201).json(updated);
  }

  remove(req, res) {
    const updated = cartService.removeItem(Number(req.params.id));
    res.json(updated);
  }
}

export default new CartController();
