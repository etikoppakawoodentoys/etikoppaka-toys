import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { 
  FiPlus, 
  FiEdit2, 
  FiTrash2, 
  FiX, 
  FiSave,
  FiEye,
  FiEyeOff
} from 'react-icons/fi';
import styles from './AdminCategories.module.css';

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchCategories();
    
    // Real-time subscription for categories
    const categoriesSubscription = supabase
      .channel('categories-channel')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'categories' }, 
        () => {
          fetchCategories();
          showToast('Categories updated in real-time!', 'success');
        }
      )
      .subscribe();

    return () => {
      categoriesSubscription.unsubscribe();
    };
  }, []);

  const showToast = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const fetchCategories = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('created_at', { ascending: true });

    if (data && !error) {
      setCategories(data);
    }
    setLoading(false);
  };

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      showToast('Category name is required', 'error');
      return;
    }

    setSaving(true);

    const slug = generateSlug(formData.name);
    const categoryData = {
      name: formData.name.trim(),
      slug: slug,
      description: formData.description || '',
      is_active: formData.is_active
    };

    let error;
    if (editingCategory) {
      const { error: updateError } = await supabase
        .from('categories')
        .update(categoryData)
        .eq('id', editingCategory.id);
      error = updateError;
      if (!error) showToast('Category updated successfully!', 'success');
    } else {
      const { error: insertError } = await supabase
        .from('categories')
        .insert([categoryData]);
      error = insertError;
      if (!error) showToast('Category added successfully!', 'success');
    }

    if (error) {
      console.error('Save error:', error);
      showToast(error.message || 'Failed to save category', 'error');
    } else {
      setShowModal(false);
      setEditingCategory(null);
      resetForm();
      fetchCategories();
    }
    setSaving(false);
  };

  const handleDelete = async (category) => {
    // Check if category has products
    const { count, error: countError } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', category.id);

    if (countError) {
      showToast('Error checking category usage', 'error');
      return;
    }

    if (count > 0) {
      showToast(`Cannot delete "${category.name}" as it has ${count} products. Reassign products first.`, 'error');
      return;
    }

    if (window.confirm(`Are you sure you want to delete "${category.name}"?`)) {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', category.id);

      if (error) {
        showToast(error.message || 'Failed to delete category', 'error');
      } else {
        showToast('Category deleted successfully!', 'success');
        fetchCategories();
      }
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      is_active: category.is_active !== false
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      is_active: true
    });
  };

  const toggleActive = async (category) => {
    const { error } = await supabase
      .from('categories')
      .update({ is_active: !category.is_active })
      .eq('id', category.id);

    if (error) {
      showToast('Failed to update category status', 'error');
    } else {
      showToast(`Category ${!category.is_active ? 'activated' : 'deactivated'}`, 'success');
      fetchCategories();
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading categories...</p>
      </div>
    );
  }

  return (
    <div className={styles.adminCategories}>
      {message && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}

      <div className={styles.header}>
        <div>
          <h1>Category Management</h1>
          <p>Manage your product categories</p>
        </div>
        <button onClick={() => { resetForm(); setEditingCategory(null); setShowModal(true); }} className={styles.addBtn}>
          <FiPlus /> Add Category
        </button>
      </div>

      <div className={styles.categoriesTable}>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Slug</th>
              <th>Description</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id}>
                <td className={styles.nameCell}>
                  <strong>{category.name}</strong>
                </td>
                <td className={styles.slugCell}>
                  <code>{category.slug}</code>
                </td>
                <td className={styles.descCell}>
                  {category.description?.substring(0, 50) || '-'}
                </td>
                <td className={styles.statusCell}>
                  <button 
                    onClick={() => toggleActive(category)}
                    className={`${styles.statusBtn} ${category.is_active !== false ? styles.active : styles.inactive}`}
                  >
                    {category.is_active !== false ? <FiEye /> : <FiEyeOff />}
                    {category.is_active !== false ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className={styles.actionsCell}>
                  <button onClick={() => handleEdit(category)} className={styles.editBtn}>
                    <FiEdit2 />
                  </button>
                  <button onClick={() => handleDelete(category)} className={styles.deleteBtn}>
                    <FiTrash2 />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {categories.length === 0 && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📂</div>
          <h3>No Categories Yet</h3>
          <p>Create your first category to organize your products</p>
          <button onClick={() => { resetForm(); setEditingCategory(null); setShowModal(true); }} className={styles.emptyAddBtn}>
            <FiPlus /> Add Category
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className={styles.modal} onClick={() => setShowModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>{editingCategory ? 'Edit Category' : 'Add New Category'}</h3>
              <button onClick={() => setShowModal(false)} className={styles.closeBtn}>
                <FiX />
              </button>
            </div>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label>Category Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Wooden Toys, Educational Toys"
                  required
                  autoFocus
                />
              </div>

              <div className={styles.formGroup}>
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="3"
                  placeholder="Brief description of this category..."
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                  Active (visible on website)
                </label>
              </div>

              <div className={styles.formActions}>
                <button type="button" onClick={() => setShowModal(false)} className={styles.cancelBtn}>
                  Cancel
                </button>
                <button type="submit" disabled={saving} className={styles.submitBtn}>
                  <FiSave /> {saving ? 'Saving...' : (editingCategory ? 'Update Category' : 'Add Category')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCategories;