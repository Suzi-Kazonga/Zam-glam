import courierService from '../services/CourierService.js';
import CourierModel from '../models/CourierModel.js';

export class CourierController {
  async quote(req, res, next) {
    try {
      const quote = await courierService.getDeliveryQuote(req.body);
      const saved = await CourierModel.saveCourierInfo({
        order_id: req.body.order_id,
        driver_name: quote.driver_name,
        price: quote.price,
        distance: quote.distance,
        direction: quote.direction,
      });

      res.json({ ...quote, courier_id: saved });
    } catch (error) {
      next(error);
    }
  }
}

export default new CourierController();
