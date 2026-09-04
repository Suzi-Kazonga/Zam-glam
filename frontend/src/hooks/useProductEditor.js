import { useState } from 'react';
import { createProduct, updateProduct } from '../api/productApi';
import { filesToDataUrls } from '../utils/image';

export const emptyProductForm = {
  id: '',
  name: '',
  description: '',
  price: '',
  stock: '',
  category: 'clothes',
  image_url: '',
  imageFiles: [],
  previews: [],
};

// Owns the add/edit product form so the dashboard, the seller home page and the seller's
// own storefront all create and edit listings the same way. Pass onSaved to refresh
// whichever list the caller is showing.
export function useProductEditor({ onSaved } = {}) {
  const [form, setForm] = useState(emptyProductForm);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setForm(emptyProductForm);
    setMessage('');
    setShowForm(true);
  };

  const openEdit = (product) => {
    setForm({
      id: product.id,
      name: product.name,
      description: product.description || '',
      price: product.price,
      stock: product.stock,
      category: product.category || (String(product.category_name || '').toLowerCase().includes('shoe') ? 'shoes' : 'clothes'),
      image_url: product.image_url || '',
      imageFiles: [],
      previews: Array.isArray(product.images) && product.images.length
        ? product.images
        : (product.image_url ? [product.image_url] : []),
    });
    setMessage('');
    setShowForm(true);
  };

  const close = () => {
    setShowForm(false);
    setForm(emptyProductForm);
  };

  const handleImages = async (files) => {
    const previews = await filesToDataUrls(files);
    setForm((current) => ({
      ...current,
      imageFiles: Array.from(files),
      previews,
      image_url: previews[0] || current.image_url,
    }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setMessage('');
    const isEdit = Boolean(form.id);

    // New listings must carry photos. When editing, keeping the existing ones is fine.
    if (!isEdit && !form.imageFiles.length) {
      setMessage('Add at least one product image.');
      return;
    }

    const payload = {
      name: form.name,
      description: form.description,
      price: Number(form.price),
      stock: Number(form.stock),
      category: form.category,
      imageFiles: form.imageFiles,
    };

    setSaving(true);
    try {
      if (isEdit) await updateProduct(form.id, payload);
      else await createProduct(payload);
      close();
      onSaved?.(isEdit ? 'Product updated.' : 'Product listed on your storefront.');
    } catch (error) {
      setMessage(error?.error || error?.message || 'Could not save that product. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return { form, setForm, showForm, message, saving, openCreate, openEdit, close, handleImages, submit };
}
