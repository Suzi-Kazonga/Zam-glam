export default function StarRating({ value = 0, onChange, readOnly = false, size = 'md' }) {
  const sizes = { sm: 'text-base', md: 'text-2xl', lg: 'text-3xl' };

  return (
    <div className={`flex items-center gap-1 ${sizes[size] || sizes.md}`} role={readOnly ? 'img' : 'radiogroup'} aria-label="Star rating">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= Number(value);
        return (
          <button
            key={star}
            type="button"
            disabled={readOnly}
            aria-label={`${star} star${star === 1 ? '' : 's'}`}
            onClick={() => onChange?.(star)}
            className={`${filled ? 'text-amber-400' : 'text-slate-300'} ${readOnly ? 'cursor-default' : 'hover:text-amber-400'}`}
          >
            ★
          </button>
        );
      })}
    </div>
  );
}
