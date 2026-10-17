// The add-and-edit-a-product logic, kept in one place.
//
// A shop can list something from three different pages — the dashboard, the home page and
// its own storefront — and all three behave identically because they share this. It holds
// the form, the photo handling, and whether saving creates or updates.

import { useState } from 'react';
import { createProduct, updateProduct } from '../api/productApi';
import { filesToDataUrls } from '../utils/image';

export const emptyProductForm = {
  id: '',
  name: '',
  description: '',
  price: '',
  stock: '',
  restock_expected_at: '',
  category: 'clothes',
  audience: 'unisex',
  image_url: '',
  imageFiles: [],
  previews: [],
};

function dateInputValue(value) {
  if (!value) return '';
  const dateString = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(dateString)) return dateString.slice(0, 10);
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
}

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
      restock_expected_at: dateInputValue(product.restock_expected_at),
      category: product.category_name || product.category || 'clothes',
      audience: product.audience || 'unisex',
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
    const selectedFiles = Array.from(files || []);
    if (!selectedFiles.length) return;

    const invalidFile = selectedFiles.find((file) =>
      !['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)
      || file.size > 5 * 1024 * 1024,
    );
    if (invalidFile) {
      setMessage(invalidFile.size > 5 * 1024 * 1024
        ? 'Each product image must be 5MB or smaller.'
        : 'Use JPG, PNG, GIF, or WebP product images.');
      return;
    }

    try {
      const newPreviews = await filesToDataUrls(selectedFiles);
      if (form.previews.length + newPreviews.length > 6) {
        setMessage(`A product can have up to 6 photos. You can add ${Math.max(0, 6 - form.previews.length)} more.`);
        return;
      }
      setForm((current) => ({
        ...current,
        imageFiles: [...current.imageFiles, ...selectedFiles],
        previews: [...current.previews, ...newPreviews],
        image_url: current.image_url || newPreviews[0] || '',
      }));
      setMessage('');
    } catch (error) {
      setMessage(error.message || 'Could not read the selected product images.');
    }
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
      restock_expected_at: form.restock_expected_at || null,
      category: form.category,
      audience: form.audience,
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
