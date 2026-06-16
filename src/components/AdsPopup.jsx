// src/components/AdsPopup.jsx – FINAL WORKING VERSION
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabase';
import styles from './AdsPopup.module.css';

const AdsPopup = () => {
  const [ad, setAd] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const slideIntervalRef = useRef(null);

  // Load ad + realtime subscription
  useEffect(() => {
    const fetchAd = async () => {
      const { data, error } = await supabase
        .from('ads')
        .select('*')
        .eq('id', 1)
        .single();

      if (data && !error && data.is_active && data.images?.length) {
        setAd({ images: data.images, url: data.url, updated_at: data.updated_at });
      } else {
        setAd(null);
      }
    };

    fetchAd();

    const subscription = supabase
      .channel('ads-updates')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'ads' }, (payload) => {
        const newAd = payload.new;
        if (newAd.is_active && newAd.images?.length) {
          // New ad detected – reset cooldown so customers see it immediately
          localStorage.removeItem('ad_last_closed');
          setAd({ images: newAd.images, url: newAd.url, updated_at: newAd.updated_at });
        } else {
          setAd(null);
          setShowPopup(false);
        }
      })
      .subscribe();

    return () => subscription.unsubscribe();
  }, []);

  // Cooldown logic – only shows if 10 minutes have passed since last close
  useEffect(() => {
    if (!ad) {
      setShowPopup(false);
      return;
    }

    const checkCooldown = () => {
      const lastClosed = localStorage.getItem('ad_last_closed');
      if (!lastClosed) {
        // Never closed before → show popup
        setShowPopup(true);
        return;
      }
      const now = Date.now();
      const tenMinutes = 10 * 60 * 1000;
      const timeSinceClose = now - parseInt(lastClosed);
      if (timeSinceClose >= tenMinutes) {
        setShowPopup(true);
      } else {
        setShowPopup(false);
      }
    };

    checkCooldown();
    // Re-check every minute (in case user stays on page for a long time)
    const interval = setInterval(checkCooldown, 60 * 1000);
    return () => clearInterval(interval);
  }, [ad]);

  // Slideshow effect
  useEffect(() => {
    if (showPopup && ad && ad.images?.length > 1) {
      slideIntervalRef.current = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % ad.images.length);
      }, 5000);
    } else {
      clearInterval(slideIntervalRef.current);
    }
    return () => clearInterval(slideIntervalRef.current);
  }, [showPopup, ad]);

  const handleClose = () => {
    setShowPopup(false);
    localStorage.setItem('ad_last_closed', Date.now().toString());
    clearInterval(slideIntervalRef.current);
    setCurrentImageIndex(0);
  };

  const handleImageClick = () => {
    if (ad?.url) window.open(ad.url, '_blank', 'noopener,noreferrer');
  };

  if (!showPopup || !ad?.images?.length) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.popupContainer}>
        <button onClick={handleClose} className={styles.closeButton}>✕</button>
        <div className={styles.imageWrapper} onClick={handleImageClick}>
          <img src={ad.images[currentImageIndex]} alt="Ad" className={styles.adImage} />
        </div>
        {ad.images.length > 1 && (
          <div className={styles.dotsContainer}>
            {ad.images.map((_, idx) => (
              <span
                key={idx}
                className={`${styles.dot} ${idx === currentImageIndex ? styles.activeDot : ''}`}
                onClick={() => setCurrentImageIndex(idx)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdsPopup;