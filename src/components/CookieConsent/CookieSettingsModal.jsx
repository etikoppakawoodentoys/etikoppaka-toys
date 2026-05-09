// src/components/CookieConsent/CookieSettingsModal.jsx
import React from 'react';
import { FiX, FiCheck, FiShield } from 'react-icons/fi';
import styles from './CookieConsent.module.css';

const CookieSettingsModal = ({ 
  isOpen, 
  onClose, 
  preferences, 
  onUpdatePreference, 
  onSave, 
  onAcceptAll, 
  onAcceptEssential,
  isMobile = false 
}) => {
  if (!isOpen) return null;

  if (isMobile) {
    return (
      <div className={styles.modalOverlayMobile} onClick={onClose}>
        <div className={styles.modalContentMobile} onClick={(e) => e.stopPropagation()}>
          <div className={styles.modalHeaderMobile}>
            <h3>
              <FiShield /> Cookie Settings
            </h3>
            <button onClick={onClose} className={styles.closeBtnMobile}>
              <FiX />
            </button>
          </div>
          
          <div className={styles.modalBodyMobile}>
            <p className={styles.modalDescMobile}>
              Manage your cookie preferences below. Essential cookies cannot be disabled as they 
              ensure the website functions properly.
            </p>

            {/* Necessary Cookies */}
            <div className={styles.cookieOptionMobile}>
              <div className={styles.optionHeaderMobile}>
                <div>
                  <h4>✅ Necessary</h4>
                  <span className={styles.alwaysActiveMobile}>Always Active</span>
                </div>
              </div>
              <p className={styles.optionDescMobile}>
                Required for basic site functionality.
              </p>
            </div>

            {/* Functional Cookies */}
            <div className={styles.cookieOptionMobile}>
              <div className={styles.optionHeaderMobile}>
                <div>
                  <h4>⚙️ Functional</h4>
                </div>
                <label className={styles.switchMobile}>
                  <input 
                    type="checkbox"
                    checked={preferences.functional}
                    onChange={(e) => onUpdatePreference('functional', e.target.checked)}
                  />
                  <span className={styles.sliderMobile}></span>
                </label>
              </div>
              <p className={styles.optionDescMobile}>
                Enhances website functionality and personalization.
              </p>
            </div>

            {/* Analytics Cookies */}
            <div className={styles.cookieOptionMobile}>
              <div className={styles.optionHeaderMobile}>
                <div>
                  <h4>📊 Analytics</h4>
                </div>
                <label className={styles.switchMobile}>
                  <input 
                    type="checkbox"
                    checked={preferences.analytics}
                    onChange={(e) => onUpdatePreference('analytics', e.target.checked)}
                  />
                  <span className={styles.sliderMobile}></span>
                </label>
              </div>
              <p className={styles.optionDescMobile}>
                Helps us understand how visitors interact with our site.
              </p>
            </div>

            {/* Marketing Cookies */}
            <div className={styles.cookieOptionMobile}>
              <div className={styles.optionHeaderMobile}>
                <div>
                  <h4>🎯 Marketing</h4>
                </div>
                <label className={styles.switchMobile}>
                  <input 
                    type="checkbox"
                    checked={preferences.marketing}
                    onChange={(e) => onUpdatePreference('marketing', e.target.checked)}
                  />
                  <span className={styles.sliderMobile}></span>
                </label>
              </div>
              <p className={styles.optionDescMobile}>
                Used to deliver personalized advertisements.
              </p>
            </div>
          </div>

          <div className={styles.modalFooterMobile}>
            <button onClick={onAcceptEssential} className={styles.rejectBtnMobile}>
              Reject All
            </button>
            <button onClick={onSave} className={styles.saveBtnMobile}>
              Save Preferences
            </button>
            <button onClick={onAcceptAll} className={styles.acceptAllBtnMobile}>
              Accept All
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Desktop Modal
  return (
    <div className={styles.modalOverlayDesktop} onClick={onClose}>
      <div className={styles.modalContentDesktop} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeaderDesktop}>
          <h3>
            <FiShield /> Cookie Preferences
          </h3>
          <button onClick={onClose} className={styles.closeBtnDesktop}>
            <FiX />
          </button>
        </div>
        
        <div className={styles.modalBodyDesktop}>
          <p className={styles.modalDescDesktop}>
            When you visit any website, it may store or retrieve information on your browser, 
            mostly in the form of cookies. Control your personal Cookie Services here.
          </p>

          {/* Necessary Cookies */}
          <div className={styles.cookieOptionDesktop}>
            <div className={styles.optionHeaderDesktop}>
              <div>
                <h4>✅ Necessary Cookies</h4>
                <p className={styles.cookieStatusDesktop}>Always Active</p>
              </div>
              <span className={styles.alwaysActiveBadgeDesktop}>Required</span>
            </div>
            <p className={styles.optionDescDesktop}>
              These cookies are necessary for the website to function and cannot be switched off. 
              They are essential for features like login, cart, and secure checkout.
            </p>
          </div>

          {/* Functional Cookies */}
          <div className={styles.cookieOptionDesktop}>
            <div className={styles.optionHeaderDesktop}>
              <div>
                <h4>⚙️ Functional Cookies</h4>
                <p>Enhance website functionality</p>
              </div>
              <label className={styles.switchDesktop}>
                <input 
                  type="checkbox"
                  checked={preferences.functional}
                  onChange={(e) => onUpdatePreference('functional', e.target.checked)}
                />
                <span className={styles.sliderDesktop}></span>
              </label>
            </div>
            <p className={styles.optionDescDesktop}>
              These cookies enable enhanced functionality and personalization like remembering 
              your preferences and past activities.
            </p>
          </div>

          {/* Analytics Cookies */}
          <div className={styles.cookieOptionDesktop}>
            <div className={styles.optionHeaderDesktop}>
              <div>
                <h4>📊 Analytics Cookies</h4>
                <p>Help us improve our website</p>
              </div>
              <label className={styles.switchDesktop}>
                <input 
                  type="checkbox"
                  checked={preferences.analytics}
                  onChange={(e) => onUpdatePreference('analytics', e.target.checked)}
                />
                <span className={styles.sliderDesktop}></span>
              </label>
            </div>
            <p className={styles.optionDescDesktop}>
              These cookies allow us to count visits and traffic sources, so we can measure and 
              improve the performance of our site.
            </p>
          </div>

          {/* Marketing Cookies */}
          <div className={styles.cookieOptionDesktop}>
            <div className={styles.optionHeaderDesktop}>
              <div>
                <h4>🎯 Marketing Cookies</h4>
                <p>Personalized ads and content</p>
              </div>
              <label className={styles.switchDesktop}>
                <input 
                  type="checkbox"
                  checked={preferences.marketing}
                  onChange={(e) => onUpdatePreference('marketing', e.target.checked)}
                />
                <span className={styles.sliderDesktop}></span>
              </label>
            </div>
            <p className={styles.optionDescDesktop}>
              These cookies may be set through our site by our advertising partners to build a 
              profile of your interests and show you relevant ads.
            </p>
          </div>
        </div>

        <div className={styles.modalFooterDesktop}>
          <button onClick={onAcceptEssential} className={styles.rejectBtnDesktop}>
            Reject All Non-Essential
          </button>
          <button onClick={onSave} className={styles.saveBtnDesktop}>
            Save My Preferences
          </button>
          <button onClick={onAcceptAll} className={styles.acceptAllBtnDesktop}>
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieSettingsModal;