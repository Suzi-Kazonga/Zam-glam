import React from 'react';
import ProductCard from './ProductCard';

const ProductGrid = ({ products, loading = false }) => {
  if (loading) {
    return <div className="text-center py-8">Loading products...</div>;
  }

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No products found. Try adjusting your filters.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};

export default ProductGrid;
