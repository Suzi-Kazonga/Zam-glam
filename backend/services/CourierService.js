import axios from 'axios';

export class CourierService {
  async getDeliveryQuote({ origin, destination, productName }) {
    const apiKey = process.env.YANGO_API_KEY || 'demo_yango_key';

    const response = await axios.get('https://api.yango.com/v1/quote', {
      params: {
        origin,
        destination,
        product: productName,
        api_key: apiKey,
      },
      timeout: 8000,
    });

    return {
      price: response.data.price || 18.5,
      distance: response.data.distance || '8.4 km',
      direction: response.data.direction || 'North route',
      driver_name: response.data.driver_name || 'Yango Driver',
    };
  }
}

export default new CourierService();
