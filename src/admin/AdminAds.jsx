// src/admin/AdminAds.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { FiUpload, FiLink, FiCheckCircle, FiAlertCircle, FiX, FiImage } from 'react-icons/fi';
import styles from './AdminAds.module.css';

const AdminAds = () => {
  const [images, setImages] = useState([]);        // array of public URLs
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Load existing ad from Supabase
  useEffect(() => {
    const loadAd = async () => {
      const { data, error } = await supabase
        .from('ads')
        .select('*')
        .eq('id', 1)
        .single();
      
      if (data && !error) {
        setImages(data.images || []);
        setUrl(data.url || '');
      }
    };
    loadAd();
  }, []);

  const validateAspectRatio = (file) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const ratio = img.width / img.height;
        if (Math.abs(ratio - 4/5) < 0.05) resolve();
        else reject(`Image must be 4:5 ratio (current: ${img.width}:${img.height})`);
      };
      img.onerror = () => reject('Failed to load image');
      img.src = URL.createObjectURL(file);
    });
  };

  const uploadImageToStorage = async (file) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `ad_${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('ads')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('ads')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    if (files.length > 2) {
      setError('Maximum 2 images allowed.');
      return;
    }

    setError('');
    setUploading(true);
    const uploadedUrls = [];

    for (const file of files) {
      try {
        await validateAspectRatio(file);
        const url = await uploadImageToStorage(file);
        uploadedUrls.push(url);
      } catch (err) {
        setError(err);
        setUploading(false);
        return;
      }
    }
    setImages(uploadedUrls);
    setUploading(false);
  };

  const removeImage = async (index) => {
    const urlToDelete = images[index];
    // Extract filename from URL
    const filename = urlToDelete.split('/').pop().split('?')[0];
    await supabase.storage.from('ads').remove([filename]);
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (images.length === 0) {
      setError('Please upload at least one image.');
      return;
    }
    if (!url.trim()) {
      setError('Please enter a destination URL.');
      return;
    }

    setLoading(true);
    const { error: dbError } = await supabase
      .from('ads')
      .update({ 
        images: images, 
        url: url.trim(), 
        updated_at: new Date(),
        is_active: true 
      })
      .eq('id', 1);

    if (dbError) {
      setError('Failed to save ad: ' + dbError.message);
    } else {
      setSuccess('Ad posted successfully! Customers will see it instantly.');
      setTimeout(() => setSuccess(''), 4000);
    }
    setLoading(false);
  };

  return (
    <div className={styles.adminAds}>
      <div className={styles.header}>
        <h2>Ad Manager</h2>
        <p className={styles.headerSubtitle}>Post popup ads (4:5 ratio, 1‑2 images)</p>
      </div>

      <div className={styles.formCard}>
        <div className={styles.formGroup}>
          <label className={styles.label}><FiImage /> Ad Images</label>
          <div className={styles.uploadArea}>
            <input type="file" accept="image/*" multiple onChange={handleImageUpload} id="adImageUpload" style={{ display: 'none' }} />
            <label htmlFor="adImageUpload" className={styles.uploadButton}>
              <FiUpload /> {uploading ? 'Uploading...' : 'Upload Images'}
            </label>
          </div>
          {images.length > 0 && (
            <div className={styles.imagePreviewList}>
              {images.map((img, idx) => (
                <div key={idx} className={styles.imagePreviewItem}>
                  <img src={img} alt={`preview ${idx}`} />
                  <button onClick={() => removeImage(idx)} className={styles.removeImageBtn}><FiX /></button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}><FiLink /> Destination URL</label>
          <input
            type="url"
            className={styles.urlInput}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://brandversetech.com/"
          />
        </div>

        {error && <div className={styles.errorMessage}><FiAlertCircle /> {error}</div>}
        {success && <div className={styles.successMessage}><FiCheckCircle /> {success}</div>}

        <div className={styles.formActions}>
          <button onClick={handleSubmit} className={styles.submitBtn} disabled={loading || uploading}>
            {loading ? 'Saving...' : 'Post Ad'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminAds;