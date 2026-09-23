// The catalogue’s filters: who the clothes are for, category, and price.

import React from 'react';

const FilterBar = ({ 
  filters,
  categories = [],
  audiences = [],
  onFilterChange,
}) => {
  const handleAudienceChange = (audience) => {
    onFilterChange({
      ...filters,
      audience: filters.audience === audience ? null : audience,
    });
  };

  const handleCategoryChange = (category) => {
    onFilterChange({
      ...filters,
      category: filters.category === category ? null : category,
    });
  };

  return (
    <div className="mb-6 p-4 bg-white rounded-lg shadow-md">
      <div className="mb-4">
        <h3 className="font-semibold mb-2">Audience</h3>
        <div className="flex gap-2 flex-wrap">
          {audiences.map((audience) => (
            <button
              key={audience}
              className={`filter-btn ${filters.audience === audience ? 'active' : ''}`}
              onClick={() => handleAudienceChange(audience)}
            >
              {audience}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-2">Category</h3>
        <div className="flex gap-2 flex-wrap">
          {categories.map((category) => (
            <button
              key={category.id}
              className={`filter-btn ${filters.category === category.id ? 'active' : ''}`}
              onClick={() => handleCategoryChange(category.id)}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
