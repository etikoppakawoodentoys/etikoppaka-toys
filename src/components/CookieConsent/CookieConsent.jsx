// src/components/CookieConsent/CookieConsent.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { FiX, FiCheck, FiInfo, FiSettings, FiShield, FiChevronRight } from 'react-icons/fi';
import CookieSettingsModal from './CookieSettingsModal';
import styles from './CookieConsent.module.css';

const CookieConsent = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [preferences, setPreferences] = useState({
    necessary: true,
    functional: false,
    analytics: false,
    marketing: false
  });

  // Check for mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    checkCookieConsent();
  }, []);

  const checkCookieConsent = async () => {
    setLoading(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { data, error } = await supabase
        .from('user_cookie_preferences')
        .select('preferences, accepted_at')
        .eq('user_id', user.id)
        .single();

      if (data && !error) {
        const userPrefs = typeof data.preferences === 'string' 
          ? JSON.parse(data.preferences) 
          : data.preferences;
        setPreferences(userPrefs);
        localStorage.setItem('cookiesAccepted', 'true');
        localStorage.setItem('cookiePreferences', JSON.stringify(userPrefs));
        setShowBanner(false);
        setLoading(false);
        return;
      }
    }

    const cookieAccepted = localStorage.getItem('cookiesAccepted');
    const cookiePreferences = localStorage.getItem('cookiePreferences');
    
    if (cookieAccepted === 'true' && cookiePreferences) {
      setPreferences(JSON.parse(cookiePreferences));
      setShowBanner(false);
    } else {
      setTimeout(() => setShowBanner(true), 1000);
    }
    
    setLoading(false);
  };

  const saveToSupabase = async (prefs) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { data: existing } = await supabase
        .from('user_cookie_preferences')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (existing) {
        await supabase
          .from('user_cookie_preferences')
          .update({
            preferences: prefs,
            accepted_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('user_cookie_preferences')
          .insert({
            user_id: user.id,
            preferences: prefs,
            accepted_at: new Date().toISOString()
          });
      }
    }
  };

  const acceptAllCookies = async () => {
    const allPreferences = {
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true
    };
    
    setPreferences(allPreferences);
    localStorage.setItem('cookiesAccepted', 'true');
    localStorage.setItem('cookiePreferences', JSON.stringify(allPreferences));
    await saveToSupabase(allPreferences);
    setShowBanner(false);
    setShowSettings(false);
    
    if (allPreferences.analytics) {
      initializeAnalytics();
    }
  };

  const acceptEssentialOnly = async () => {
    const essentialPreferences = {
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false
    };
    
    setPreferences(essentialPreferences);
    localStorage.setItem('cookiesAccepted', 'true');
    localStorage.setItem('cookiePreferences', JSON.stringify(essentialPreferences));
    await saveToSupabase(essentialPreferences);
    setShowBanner(false);
    setShowSettings(false);
  };

  const initializeAnalytics = () => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: 'granted'
      });
    }
  };

  const openSettings = () => {
    setShowSettings(true);
  };

  const closeSettings = () => {
    setShowSettings(false);
  };

  if (loading) return null;
  if (!showBanner) return null;

  // Desktop UI
  if (!isMobile) {
    return (
      <>
        <div className={styles.cookieBannerDesktop}>
          <div className={styles.cookieContentDesktop}>
            <div className={styles.cookieIconDesktop}>
              🍪
            </div>
            <div className={styles.cookieTextDesktop}>
              <h3>We Value Your Privacy</h3>
              <p>
                We use cookies to enhance your browsing experience, serve personalized content, 
                and analyze our traffic. By clicking "Accept All", you consent to our use of cookies.
              </p>
              <div className={styles.cookieLinksDesktop}>
                <button onClick={openSettings} className={styles.settingsLinkDesktop}>
                  <FiSettings /> Cookie Settings
                </button>
                <a href="/privacy-policy" className={styles.policyLinkDesktop}>
                  <FiInfo /> Privacy Policy
                </a>
              </div>
            </div>
            <div className={styles.cookieButtonsDesktop}>
              <button onClick={acceptEssentialOnly} className={styles.essentialBtnDesktop}>
                Essential Only
              </button>
              <button onClick={acceptAllCookies} className={styles.acceptBtnDesktop}>
                <FiCheck /> Accept All
              </button>
            </div>
          </div>
        </div>
        
        <CookieSettingsModal 
          isOpen={showSettings}
          onClose={closeSettings}
          preferences={preferences}
          onUpdatePreference={(type, value) => {
            if (type !== 'necessary') {
              setPreferences(prev => ({ ...prev, [type]: value }));
            }
          }}
          onSave={async () => {
            localStorage.setItem('cookiesAccepted', 'true');
            localStorage.setItem('cookiePreferences', JSON.stringify(preferences));
            await saveToSupabase(preferences);
            setShowBanner(false);
            setShowSettings(false);
            if (preferences.analytics) initializeAnalytics();
          }}
          onAcceptAll={acceptAllCookies}
          onAcceptEssential={acceptEssentialOnly}
        />
      </>
    );
  }

  // Mobile UI
  return (
    <>
      <div className={styles.cookieBannerMobile}>
        <div className={styles.cookieContentMobile}>
          <div className={styles.cookieHeaderMobile}>
            <div className={styles.cookieIconMobile}>🍪</div>
            <h3>Cookie Consent</h3>
          </div>
          <div className={styles.cookieTextMobile}>
            <p>
              We use cookies to improve your experience. By using our site, you accept our 
              cookie policy.
            </p>
          </div>
          <div className={styles.cookieButtonsMobile}>
            <button onClick={acceptEssentialOnly} className={styles.essentialBtnMobile}>
              Reject All
            </button>
            <button onClick={openSettings} className={styles.settingsBtnMobile}>
              Settings
            </button>
            <button onClick={acceptAllCookies} className={styles.acceptBtnMobile}>
              Accept All
            </button>
          </div>
        </div>
      </div>
      
      <CookieSettingsModal 
        isOpen={showSettings}
        onClose={closeSettings}
        preferences={preferences}
        isMobile={true}
        onUpdatePreference={(type, value) => {
          if (type !== 'necessary') {
            setPreferences(prev => ({ ...prev, [type]: value }));
          }
        }}
        onSave={async () => {
          localStorage.setItem('cookiesAccepted', 'true');
          localStorage.setItem('cookiePreferences', JSON.stringify(preferences));
          await saveToSupabase(preferences);
          setShowBanner(false);
          setShowSettings(false);
          if (preferences.analytics) initializeAnalytics();
        }}
        onAcceptAll={acceptAllCookies}
        onAcceptEssential={acceptEssentialOnly}
      />
    </>
  );
};

export default CookieConsent;