/* ═══════════════════════════════════════════════════════════════
   NOVASTORE — UI ENGINE
═══════════════════════════════════════════════════════════════ */

const UI = (function() {

  /* ── TOAST ── */
  function toast(msg, type='info', icon='ℹ') {
    const container = document.getElementById('toast-container');
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.innerHTML = `<span class="toast-icon">${icon}</span><span>${msg}</span>`;
    container.appendChild(el);
    setTimeout(()=>{
      el.classList.add('out');
      setTimeout(()=>el.remove(), 400);
    }, 3200);
  }

  /* ── PAGES ── */
  function navigate(pageId) {
    _flashLoadingBar();
    document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
    document.querySelectorAll('.nav-tab').forEach(t=>t.classList.remove('active'));
    const page = document.getElementById('page-'+pageId);
    const tab = document.getElementById('tab-'+pageId);
    if(page) { page.classList.add('active'); page.classList.remove('page-fade'); void page.offsetWidth; page.classList.add('page-fade'); }
    if(tab) tab.classList.add('active');
    window.scrollTo({top:0, behavior:'smooth'});
  }

  /* ── NAV LOADING BAR ── */
  let _barTimeout;
  function _flashLoadingBar() {
    const bar = document.getElementById('nav-loading-bar');
    if(!bar) return;
    clearTimeout(_barTimeout);
    bar.classList.remove('done');
    void bar.offsetWidth;
    bar.classList.add('active');
    _barTimeout = setTimeout(() => {
      bar.classList.remove('active');
      bar.classList.add('done');
      setTimeout(() => { bar.classList.remove('done'); bar.style.width='0%'; }, 280);
    }, 180);
  }

  /* ── STARS ── */
  function stars(rating) {
    const full = Math.round(rating);
    return '★'.repeat(full) + '☆'.repeat(5-full);
  }

  /* ── BADGE HTML ── */
  function badge(type) {
    if(!type) return '';
    const map = {sale:'SALE',new:'NEW',hot:'🔥 HOT'};
    return `<span class="product-badge badge-${type}">${map[type]||type}</span>`;
  }

  /* ── PRODUCT CARD ── */
  function productCard(p) {
    const discount = p.oldPrice ? Math.round((1-p.price/p.oldPrice)*100) : 0;
    const inWish = Store.inWishlist(p.id);
    const stockWarn = p.stock <= 10 ? `<div class="stock-warn-label">⚠ Only ${p.stock} left</div>` : '';
    return `
    <div class="product-card" data-id="${p.id}">
      <div class="product-img" style="background:${p.imgGradient}">
        ${badge(p.badge)}
        ${discount ? `<div class="discount-chip">−${discount}%</div>` : ''}
        <div class="product-emoji"><img src="${p.imgSrc}" alt="${p.name}" loading="lazy" class="product-photo"></div>
        <div class="product-card-actions">
          <button class="btn-add-cart" onclick="Store.addToCart(${p.id}); event.stopPropagation()">Add to Cart</button>
          <button class="btn-wishlist ${inWish?'wishlisted':''}" onclick="Store.toggleWishlist(${p.id}); UI.renderProducts(); UI.renderWishlist(); event.stopPropagation()" title="Wishlist">${inWish?'❤️':'🤍'}</button>
        </div>
      </div>
      <div class="product-card-body" onclick="Modal.openProduct(${p.id})">
        <div class="product-meta"><span class="product-brand">${p.brand}</span><span class="product-cat-tag">${p.cat}</span></div>
        <div class="product-name">${p.name}</div>
        <div class="product-sub">${p.sub}</div>
        <div class="product-rating">
          <span class="stars-sm text-amber">${stars(p.rating)}</span>
          <span class="rating-num">${p.rating}</span>
          <span class="rating-count">(${p.reviews.toLocaleString()})</span>
        </div>
        <div class="product-footer">
          <div class="price-group">
            <span class="price-main">$${p.price.toLocaleString()}</span>
            ${p.oldPrice ? `<span class="price-old">$${p.oldPrice.toLocaleString()}</span>` : ''}
          </div>
          ${stockWarn}
        </div>
      </div>
    </div>`;
  }

  /* ── RENDER PRODUCTS ── */
  function renderProducts() {
    const grid = document.getElementById('products-grid');
    const countEl = document.getElementById('products-count');
    if(!grid) return;
    const products = Store.getFilteredProducts();
    if(countEl) countEl.textContent = `${products.length} products`;
    if(!products.length) {
      grid.innerHTML = `<div class="empty-grid"><div class="empty-icon">🔍</div><div class="empty-title">No products found</div><div class="empty-sub">Try adjusting your filters</div></div>`;
      return;
    }
    grid.innerHTML = products.map(productCard).join('');
  }

  /* ── RENDER AI RECS ── */
  function renderAIRecs() {
    const scroll = document.getElementById('ai-recs');
    if(!scroll) return;
    const recs = [...NS.PRODUCTS].sort(()=>Math.random()-0.5).slice(0,10);
    scroll.innerHTML = recs.map(p=>`
      <div class="rec-card" onclick="Modal.openProduct(${p.id})">
        <div class="rec-img" style="background:${p.imgGradient}"><img src="${p.imgSrc}" alt="${p.name}" class="rec-photo" loading="lazy"></div>
        <div class="rec-body">
          <div class="rec-brand">${p.brand}</div>
          <div class="rec-name">${p.name}</div>
          <div class="rec-price">$${p.price.toLocaleString()}</div>
          <button class="rec-add" onclick="Store.addToCart(${p.id}); event.stopPropagation()">+ Cart</button>
        </div>
      </div>
    `).join('');
  }

  /* ── RENDER CART ── */
  function renderCart() {
    const cart = Store.get('cart');
    const listEl = document.getElementById('cart-items-list');
    const emptyEl = document.getElementById('cart-empty');
    const contentEl = document.getElementById('cart-layout');
    const countEl = document.getElementById('cart-item-count');

    if(!listEl) return;

    if(!cart.length) {
      if(emptyEl) emptyEl.classList.remove('hidden');
      if(contentEl) contentEl.classList.add('hidden');
      if(countEl) countEl.textContent = '0 items';
      return;
    }
    if(emptyEl) emptyEl.classList.add('hidden');
    if(contentEl) contentEl.classList.remove('hidden');
    if(countEl) countEl.textContent = `${Store.getCartCount()} items`;

    listEl.innerHTML = cart.map(item=>`
      <div class="cart-item" data-id="${item.id}">
        <div class="cart-item-img" style="background:${item.imgGradient}"><img src="${item.imgSrc}" alt="${item.name}" class="cart-item-photo"></div>
        <div class="cart-item-info">
          <div class="cart-item-brand">${item.brand}</div>
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-sub">${item.sub}</div>
          <div class="cart-item-price">$${(item.price*item.qty).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</div>
        </div>
        <div class="cart-item-controls">
          <div class="qty-ctrl">
            <button class="qty-btn" onclick="Store.changeQty(${item.id},-1); UI.renderCart(); UI.renderSummary()">−</button>
            <span class="qty-num">${item.qty}</span>
            <button class="qty-btn" onclick="Store.changeQty(${item.id},1); UI.renderCart(); UI.renderSummary()">+</button>
          </div>
          <button class="cart-remove" onclick="Store.removeFromCart(${item.id}); UI.renderCart(); UI.renderSummary()" title="Remove">✕</button>
        </div>
      </div>
    `).join('');

    renderSummary();
  }

  /* ── RENDER CART SUMMARY ── */
  function renderSummary() {
    const subtotal = Store.getCartTotal();
    const tax = subtotal * 0.08;
    const total = subtotal + tax;
    const f = n => '$'+n.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
    _setText('summary-subtotal', f(subtotal));
    _setText('summary-tax', f(tax));
    _setText('summary-total', f(total));
  }

  /* ── RENDER WISHLIST ── */
  function renderWishlist() {
    const wishlist = Store.get('wishlist');
    const grid = document.getElementById('wishlist-grid');
    const empty = document.getElementById('wishlist-empty');
    if(!grid) return;
    if(!wishlist.length) {
      if(empty) empty.classList.remove('hidden');
      grid.classList.add('hidden');
      return;
    }
    if(empty) empty.classList.add('hidden');
    grid.classList.remove('hidden');
    grid.innerHTML = wishlist.map(productCard).join('');
  }

  /* ── RENDER ORDERS ── */
  function renderOrders() {
    const el = document.getElementById('orders-list');
    if(!el) return;
    const statusMap = {Delivered:'status-delivered',Shipped:'status-shipped',Processing:'status-processing',Pending:'status-pending'};
    el.innerHTML = NS.ORDERS_DATA.map(o=>`
      <div class="order-card">
        <div class="order-card-header">
          <div class="order-id-block">
            <span class="order-label">Order</span>
            <span class="order-id">#${o.id}</span>
          </div>
          <div class="order-date">${o.date}</div>
          <span class="status-badge ${statusMap[o.status]||'status-pending'}">${o.status}</span>
          <div class="order-total">$${parseFloat(o.total).toLocaleString(undefined,{minimumFractionDigits:2})}</div>
        </div>
        <div class="order-card-body">
          <div class="order-items-row">
            ${o.items.map(i=>`<div class="order-thumb" title="${i.name}" style="${i.imgGradient?'background:'+i.imgGradient:''}">${i.imgSrc?`<img src="${i.imgSrc}" alt="${i.name}" class="order-thumb-photo">`:i.img}</div>`).join('')}
            <div class="order-items-names">${o.items.map(i=>i.name).join(' · ')}</div>
          </div>
          ${o.tracking?`<div class="order-tracking">📦 Tracking: <span class="tracking-num">${o.tracking}</span></div>`:''}
        </div>
      </div>
    `).join('');
  }

  /* ── RENDER TEAM / CONTRIBUTORS ── */
  function renderTeam() {
    const grid = document.getElementById('team-grid');
    if(!grid) return;
    grid.innerHTML = NS.TEAM.map((m, i) => `
      <div class="team-card" style="animation-delay:${i*0.06}s">
        <div class="team-card-top">
          <div class="team-avatar team-avatar-${m.accent}">${m.initials}</div>
          <div class="team-card-id">
            <span class="team-id-label">School ID</span>
            <span class="team-id-value">${m.schoolId}</span>
          </div>
        </div>
        <div class="team-name">${m.name}</div>
        <div class="team-role team-role-${m.accent}">${m.role}</div>
        <div class="team-focus">${m.focus}</div>
      </div>
    `).join('');
  }

  /* ── RENDER NOTIFICATIONS ── */
  function renderNotifications(filter='all') {
    const el = document.getElementById('notif-items');
    if(!el) return;
    const notifs = Store.get('notifications').filter(n=>filter==='all'||n.type===filter);
    el.innerHTML = notifs.map(n=>`
      <div class="notif-item ${n.unread?'unread':''}" onclick="this.classList.remove('unread'); this.querySelector('.ndot')?.remove()">
        <div class="notif-icon">${n.icon}</div>
        <div class="notif-body">
          <div class="notif-title">${n.title}</div>
          <div class="notif-sub">${n.sub}</div>
          <div class="notif-time">${n.time}</div>
        </div>
        ${n.unread ? '<div class="ndot"></div>' : ''}
      </div>
    `).join('');
  }

  /* ── UPDATE NAV BADGES ── */
  function updateBadges() {
    _setText('cart-count', Store.getCartCount());
    _setText('notif-count', Store.getUnreadCount());
    const cc = document.getElementById('cart-count');
    if(cc) cc.style.display = Store.getCartCount() > 0 ? 'flex' : 'none';
  }

  /* ── SEARCH OVERLAY ── */
  function renderSearchOverlay(q) {
    const overlay = document.getElementById('search-overlay');
    const grid = document.getElementById('search-results-grid');
    if(!overlay||!grid) return;
    if(!q.trim()) { overlay.classList.remove('open'); return; }
    const results = NS.PRODUCTS.filter(p=>
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      (p.tags||[]).some(t=>t.includes(q))
    ).slice(0,8);
    overlay.classList.add('open');
    if(!results.length) {
      grid.innerHTML = `<div class="search-no-results">No products found for "<strong>${q}</strong>"</div>`;
      return;
    }
    grid.innerHTML = results.map(p=>`
      <div class="search-result-item" onclick="UI.closeSearch(); Modal.openProduct(${p.id})">
        <div class="sr-img" style="background:${p.imgGradient}"><img src="${p.imgSrc}" alt="${p.name}" class="sr-photo" loading="lazy"></div>
        <div class="sr-body">
          <div class="sr-brand">${p.brand}</div>
          <div class="sr-name">${p.name}</div>
          <div class="sr-price">$${p.price.toLocaleString()}</div>
        </div>
      </div>
    `).join('');
  }

  function closeSearch() {
    const overlay = document.getElementById('search-overlay');
    if(overlay) overlay.classList.remove('open');
  }

  /* ── UTIL ── */
  function _setText(id, val) {
    const el = document.getElementById(id);
    if(el) el.textContent = val;
  }

  /* ── STAT COUNTER ANIMATION ── */
  function animateCounters() {
    document.querySelectorAll('[data-count]').forEach(el=>{
      const target = parseFloat(el.dataset.count);
      const prefix = el.dataset.prefix||'';
      const suffix = el.dataset.suffix||'';
      const isFloat = String(target).includes('.');
      let current = 0;
      const increment = target/70;
      const timer = setInterval(()=>{
        current = Math.min(current+increment, target);
        el.textContent = prefix + (isFloat ? current.toFixed(1) : Math.floor(current).toLocaleString()) + suffix;
        if(current>=target) clearInterval(timer);
      }, 16);
    });
  }

  /* ── HERO LIVE COUNTER ── */
  function startLiveCounter() {
    let count = 1247;
    const el = document.getElementById('hero-live-count');
    if(!el) return;
    setInterval(()=>{
      count += Math.floor(Math.random()*2+1);
      el.textContent = count.toLocaleString();
    }, 2800);
  }

  return {
    toast, navigate,
    stars, badge, productCard,
    renderProducts, renderAIRecs,
    renderCart, renderSummary,
    renderWishlist, renderOrders, renderTeam,
    renderNotifications, updateBadges,
    renderSearchOverlay, closeSearch,
    animateCounters, startLiveCounter,
  };
})();
