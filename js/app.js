/* ═══════════════════════════════════════════════════════════════
   NOVASTORE — APP ORCHESTRATOR
   Wires Store + UI + Modal + Charts + Admin together
═══════════════════════════════════════════════════════════════ */

const App = (function() {

  let notifPanelOpen = false;
  let adminAuthed = false;

  /* ── ADMIN CREDENTIALS (demo) ── */
  const ADMIN_USER = 'admin';
  const ADMIN_PASS = 'novastore2025';

  /* ── NAVIGATION ── */
  function go(pageId) {
    Store.navigate(pageId);
    UI.navigate(pageId);
    UI.closeSearch();

    switch(pageId) {
      case 'store':
        UI.renderProducts();
        UI.renderAIRecs();
        break;
      case 'cart':
        UI.renderCart();
        break;
      case 'wishlist':
        UI.renderWishlist();
        break;
      case 'team':
        UI.renderTeam();
        break;
      case 'admin':
        _enterAdmin();
        break;
    }
  }

  /* ── DEEP LINK: GO TO CUSTOMER ORDERS UNDER ADMIN ── */
  function goToOrders() {
    go('admin');
    if(adminAuthed) {
      setTimeout(() => {
        const sidebarItem = [...document.querySelectorAll('.sidebar-item')]
          .find(el => el.getAttribute('onclick')?.includes('customer-orders'));
        if(sidebarItem) Admin.goSub('customer-orders', sidebarItem);
      }, 60);
    } else {
      UI.toast('Sign in to view your orders','info','📦');
    }
  }


  function _enterAdmin() {
    const gate = document.getElementById('admin-gate');
    const dash = document.getElementById('admin-dashboard-content');
    if(adminAuthed) {
      gate.classList.add('gate-hidden');
      dash.classList.remove('hidden');
      Charts.initDashboard();
    } else {
      gate.classList.remove('gate-hidden');
      dash.classList.add('hidden');
      setTimeout(()=>document.getElementById('admin-user-input')?.focus(), 350);
    }
  }

  function adminLogin() {
    const userInput = document.getElementById('admin-user-input');
    const passInput = document.getElementById('admin-pass-input');
    const errorBox  = document.getElementById('admin-gate-error');
    const btn       = document.getElementById('admin-login-btn');
    const btnText   = document.getElementById('admin-login-btn-text');

    const user = userInput.value.trim();
    const pass = passInput.value.trim();

    if(!user || !pass) {
      _showGateError('Please enter both username and password');
      return;
    }

    // Loading state
    btn.classList.add('loading');
    btnText.textContent = 'Verifying…';
    errorBox.classList.add('hidden');

    setTimeout(() => {
      if(user === ADMIN_USER && pass === ADMIN_PASS) {
        adminAuthed = true;
        btnText.textContent = 'Welcome back ✓';
        btn.classList.add('success');
        setTimeout(() => {
          const gate = document.getElementById('admin-gate');
          gate.classList.add('gate-hidden');
          setTimeout(() => {
            document.getElementById('admin-dashboard-content').classList.remove('hidden');
            Charts.initDashboard();
            Admin.startKpiTicker();
            _setLockIndicator(true);
            UI.toast('Welcome back, Admin','success','⚡');
          }, 350);
          btn.classList.remove('loading','success');
          btnText.textContent = 'Sign In to Dashboard →';
          passInput.value = '';
        }, 500);
      } else {
        btn.classList.remove('loading');
        btnText.textContent = 'Sign In to Dashboard →';
        _showGateError('Incorrect username or password');
        const card = document.querySelector('.admin-gate-card');
        card.classList.add('shake');
        setTimeout(()=>card.classList.remove('shake'), 500);
      }
    }, 650);
  }

  function _showGateError(msg) {
    const errorBox = document.getElementById('admin-gate-error');
    errorBox.querySelector('span:last-child')?.remove();
    errorBox.innerHTML = `<span>⚠</span> ${msg}`;
    errorBox.classList.remove('hidden');
  }

  function _setLockIndicator(unlocked) {
    const el = document.getElementById('admin-lock-indicator');
    if(!el) return;
    el.textContent = unlocked ? '⚡' : '🔒';
    el.classList.toggle('unlocked', unlocked);
  }

  function adminLogout() {
    adminAuthed = false;
    document.getElementById('admin-dashboard-content').classList.add('hidden');
    const gate = document.getElementById('admin-gate');
    gate.classList.remove('gate-hidden');
    document.getElementById('admin-user-input').value = 'admin';
    document.getElementById('admin-pass-input').value = '';
    _setLockIndicator(false);
    UI.toast('Logged out of Admin BI','info','🔒');
  }

  function togglePassVisibility() {
    const input = document.getElementById('admin-pass-input');
    const btn = document.getElementById('pass-toggle-btn');
    const isPass = input.type === 'password';
    input.type = isPass ? 'text' : 'password';
    btn.textContent = isPass ? '🙈' : '👁';
  }

  /* ── CATEGORY FILTER ── */
  function setCategory(cat, el) {
    Store.set('currentCategory', cat);
    document.querySelectorAll('.cat-pill').forEach(p=>p.classList.remove('active'));
    if(el) el.classList.add('active');
    UI.renderProducts();
    if(cat !== 'all') go('store');
  }

  /* ── PRICE FILTER ── */
  function filterPrice(val) {
    const [min, max] = val.split('-').map(Number);
    Store.set('priceRange', [min, max]);
    UI.renderProducts();
  }

  /* ── SEARCH ── */
  function search(q) {
    Store.set('searchQuery', q.toLowerCase().trim());
    UI.renderSearchOverlay(q.toLowerCase().trim());
    if(document.getElementById('page-store').classList.contains('active')) {
      UI.renderProducts();
    }
  }

  /* ── REVENUE CHART PERIOD ── */
  function revPeriod(period, el) {
    document.querySelectorAll('.chart-tab').forEach(t=>t.classList.remove('active'));
    el.classList.add('active');
    Charts.updateRevenue(period);
  }

  /* ── PROMO CODE ── */
  function applyPromo() {
    const input = document.getElementById('promo-code-input');
    const code = input?.value.toUpperCase().trim();
    if(code === 'NOVA20') {
      UI.toast('Promo code applied! 20% off your order','success','🎁');
    } else if(!code) {
      UI.toast('Please enter a promo code','error','🏷️');
    } else {
      UI.toast('Invalid or expired promo code','error','❌');
    }
  }

  /* ── AUTH ── */
  function authTab(tab, el) {
    document.querySelectorAll('.auth-tab').forEach(t=>t.classList.remove('active'));
    el.classList.add('active');
    document.getElementById('auth-login').classList.toggle('hidden', tab==='register');
    document.getElementById('auth-register').classList.toggle('hidden', tab!=='register');
  }

  function login() {
    UI.toast('Signed in successfully — welcome back! 👋','success','✅');
    setTimeout(()=>go('store'), 600);
  }

  function register() {
    UI.toast('Account created! Welcome to NovaStore 🎉','success','✅');
    setTimeout(()=>go('store'), 600);
  }

  /* ── PRODUCT MODAL TABS ── */
  function mpTab(tab, el) {
    document.querySelectorAll('.mp-tab').forEach(t=>t.classList.remove('active'));
    document.querySelectorAll('.mp-tab-panel').forEach(p=>p.classList.remove('active'));
    el.classList.add('active');
    document.getElementById('mp-panel-'+tab).classList.add('active');
  }

  /* ── NOTIFICATIONS PANEL ── */
  function toggleNotif() {
    notifPanelOpen = !notifPanelOpen;
    document.getElementById('notif-panel').classList.toggle('open', notifPanelOpen);
    if(notifPanelOpen) UI.renderNotifications();
  }

  function notifFilter(type, el) {
    document.querySelectorAll('.notif-tab-item').forEach(t=>t.classList.remove('active'));
    el.classList.add('active');
    UI.renderNotifications(type);
  }

  /* ── REVIEW SUMMARY DATA FOR PRODUCT MODAL ── */
  function _buildBigReviewSummary(p) {
    const el1 = document.getElementById('mp-big-rating');
    const el2 = document.getElementById('mp-big-stars');
    const el3 = document.getElementById('mp-big-total');
    const el4 = document.getElementById('mp-reviews-total');
    if(el1) el1.textContent = p.rating;
    if(el2) el2.innerHTML = UI.stars(p.rating);
    if(el3) el3.textContent = `${p.reviews.toLocaleString()} reviews`;
    if(el4) el4.textContent = `${p.reviews.toLocaleString()} verified purchases`;
  }

  /* ── INIT ── */
  function init() {
    // Render initial store view
    UI.renderProducts();
    UI.renderAIRecs();
    UI.renderNotifications();
    UI.updateBadges();
    UI.animateCounters();
    UI.startLiveCounter();

    // Subscribe to state changes for live badge updates
    Store.on('cart:update', () => UI.updateBadges());
    Store.on('wishlist:update', () => UI.updateBadges());
    Store.on('notifications:update', () => UI.updateBadges());
    Store.on('toast', (data) => UI.toast(data.msg, data.type, data.icon));

    // Hook into modal product open to also populate big review summary
    const origOpenProduct = Modal.openProduct;

    // ESC key closes modals
    document.addEventListener('keydown', (e) => {
      if(e.key === 'Escape') {
        Modal.closeAll();
        UI.closeSearch();
        if(notifPanelOpen) toggleNotif();
      }
    });

    // Click outside search to close
    document.addEventListener('click', (e) => {
      if(!e.target.closest('.nav-search-wrap') && !e.target.closest('.search-overlay')) {
        UI.closeSearch();
      }
    });

    console.log('%cNovaStore', 'color:#e8f542;font-weight:800;font-size:16px', 'initialized ✓');
  }

  return {
    go, goToOrders, setCategory, filterPrice, search,
    revPeriod, applyPromo,
    authTab, login, register,
    mpTab,
    toggleNotif, notifFilter,
    adminLogin, adminLogout, togglePassVisibility,
    init,
  };
})();

/* ── BOOT ── */
document.addEventListener('DOMContentLoaded', App.init);

/* Patch Modal.openProduct to also build the big review summary header */
(function(){
  const orig = Modal.openProduct;
  Modal.openProduct = function(id) {
    orig(id);
    const p = NS.PRODUCTS.find(x=>x.id===id);
    if(p) {
      document.getElementById('mp-big-rating').textContent = p.rating;
      document.getElementById('mp-big-stars').innerHTML = UI.stars(p.rating);
      document.getElementById('mp-big-total').textContent = `${p.reviews.toLocaleString()} reviews`;
      document.getElementById('mp-reviews-total').textContent = `${p.reviews.toLocaleString()} verified purchases`;
    }
  };
})();
