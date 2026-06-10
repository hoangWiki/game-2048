// Configure OAuth to enable real sign-in (app works in demo mode without these):
//   GOOGLE_CLIENT_ID: console.cloud.google.com → APIs & Services → Credentials → Create OAuth 2.0 Client ID
//   FB_APP_ID:        developers.facebook.com → My Apps → Create App → Facebook Login
const GOOGLE_CLIENT_ID = '';
const FB_APP_ID = '';

class AuthManager extends EventTarget {
  constructor() {
    super();
    this._u = null;
    try { this._u = JSON.parse(localStorage.getItem('_au')) || null; } catch {}
    if (GOOGLE_CLIENT_ID) this._loadGSI();
    if (FB_APP_ID) this._loadFB();
  }

  get user() { return this._u; }

  _set(u) {
    this._u = u || null;
    if (u) localStorage.setItem('_au', JSON.stringify(u));
    else localStorage.removeItem('_au');
    this.dispatchEvent(new CustomEvent('change', { detail: this._u }));
  }

  _loadGSI() {
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client'; s.async = true;
    s.onload = () => {
      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: r => {
          try {
            const p = JSON.parse(atob(r.credential.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
            this._set({ id: 'g_' + p.sub, name: p.name, email: p.email, pic: p.picture, provider: 'google' });
          } catch(e) { console.error('Google auth error', e); }
        }
      });
    };
    document.head.appendChild(s);
  }

  _loadFB() {
    window.fbAsyncInit = () => FB.init({ appId: FB_APP_ID, version: 'v19.0', cookie: true });
    const s = document.createElement('script');
    s.src = 'https://connect.facebook.net/en_US/sdk.js'; s.async = true; s.defer = true;
    document.head.appendChild(s);
  }

  signInGoogle() {
    if (!GOOGLE_CLIENT_ID) { this.dispatchEvent(new Event('quick')); return; }
    if (window.google) google.accounts.id.prompt(n => {
      if (n?.isNotDisplayed?.() || n?.isSkippedMoment?.()) this.dispatchEvent(new Event('quick'));
    });
  }

  signInFacebook() {
    if (!FB_APP_ID) { this.dispatchEvent(new Event('quick')); return; }
    if (!window.FB) { this.dispatchEvent(new Event('quick')); return; }
    FB.login(r => {
      if (!r.authResponse) return;
      FB.api('/me', { fields: 'name,email,picture.type(normal)' }, me => {
        this._set({ id: 'fb_' + me.id, name: me.name, email: me.email || '', pic: me.picture?.data?.url || '', provider: 'facebook' });
      });
    }, { scope: 'public_profile,email' });
  }

  signInQuick(name) {
    let id = localStorage.getItem('_aqi');
    if (!id) { id = 'q' + Date.now().toString(36); localStorage.setItem('_aqi', id); }
    this._set({ id, name: (name || '').trim().slice(0, 30) || 'Player', email: '', pic: '', provider: 'quick' });
  }

  signOut() {
    this._set(null);
    if (GOOGLE_CLIENT_ID && window.google) google.accounts.id.disableAutoSelect();
  }
}

window.auth = new AuthManager();

// Share helper used by games
window.shareScore = function(text) {
  const url = 'https://hoangwiki.github.io/game-2048/';
  const msg = text + '\n🎮 ' + url;
  if (navigator.share) {
    navigator.share({ text: msg, url }).catch(() => {});
  } else if (navigator.clipboard) {
    navigator.clipboard.writeText(msg).then(() => {
      const btn = document.getElementById('share-btn');
      if (btn) { const orig = btn.textContent; btn.textContent = '✓ Copied!'; setTimeout(() => btn.textContent = orig, 2000); }
    });
  }
};
