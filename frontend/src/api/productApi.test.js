import { createProduct, updateProduct } from './productApi';
import apiClient from './axios';

describe('product photo uploads', () => {
  test('sends several product views together as multipart form data', async () => {
    const originalAdapter = apiClient.defaults.adapter;
    let requestConfig;
    apiClient.defaults.adapter = async (config) => {
      requestConfig = config;
      return {
        data: { message: 'Product created successfully' },
        status: 201,
        statusText: 'Created',
        headers: {},
        config,
      };
    };

    try {
      const image = new File(['front'], 'shirt-front.png', { type: 'image/png' });
      const sideImage = new File(['side'], 'shirt-side.png', { type: 'image/png' });
      const backImage = new File(['back'], 'shirt-back.png', { type: 'image/png' });
      await createProduct({
        name: 'Cotton Shirt',
        price: 250,
        imageFiles: [image, sideImage, backImage],
      });

      expect(requestConfig.data).toBeInstanceOf(FormData);
      expect(requestConfig.data.get('name')).toBe('Cotton Shirt');
      expect(requestConfig.data.getAll('images')).toEqual([image, sideImage, backImage]);
      expect(requestConfig.headers.getContentType()).not.toBe('application/json');
    } finally {
      apiClient.defaults.adapter = originalAdapter;
    }
  });

  test('sends new views when adding photos to an existing listing', async () => {
    const originalAdapter = apiClient.defaults.adapter;
    let requestConfig;
    apiClient.defaults.adapter = async (config) => {
      requestConfig = config;
      return { data: { message: 'Product updated successfully' }, status: 200, statusText: 'OK', headers: {}, config };
    };

    try {
      const sideImage = new File(['side'], 'shirt-side.png', { type: 'image/png' });
      await updateProduct(12, { imageFiles: [sideImage], price: 250 });
      expect(requestConfig.url).toBe('/products/12');
      expect(requestConfig.data.getAll('images')).toEqual([sideImage]);
    } finally {
      apiClient.defaults.adapter = originalAdapter;
    }
  });
});
