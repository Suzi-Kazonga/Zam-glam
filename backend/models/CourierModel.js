import { BaseModel } from './BaseModel.js';
import { pool } from '../config/db.js';

class CourierModel extends BaseModel {
  constructor() {
    super('courier', pool);
  }

  async saveCourierInfo(data) {
    const result = await this.create({
      order_id: data.order_id,
      driver_name: data.driver_name,
      price: data.price,
      distance: data.distance,
      direction: data.direction,
    });

    return result.insertId;
  }
}

export default new CourierModel();
