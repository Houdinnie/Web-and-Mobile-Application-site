/* ═══════════════════════════════════════════════════════════════
   NOVASTORE — MODAL SYSTEM
═══════════════════════════════════════════════════════════════ */

const Modal = (function() {

  let activeModal = null;

  function open(id) {
    closeAll();
    const el = document.getElementById(id);
    if(!el) return;
    el.classList.add('open');
    document.body.style.overflow = 'hidden';
    activeModal = id;
  }

  function close(id) {
    const el = document.getElementById(id || activeModal);
    if(!el) return;
    el.classList.remove('open');
    document.body.style.overflow = '';
    activeModal = null;
  }

  function closeAll() {
    document.querySelectorAll('.modal-overlay.open, .modal-fullscreen.open').forEach(m=>{
      m.classList.remove('open');
    });
    document.body.style.overflow = '';
    activeModal = null;
  }

  /* ── PRODUCT DETAIL MODAL ── */
  function openProduct(id) {
    const p = NS.PRODUCTS.find(x=>x.id===id);
    if(!p) return;
    Store.set('selectedProduct', p);
    _buildProductModal(p);
    open('modal-product');
  }

  function _buildProductModal(p) {
    const discount = p.oldPrice ? Math.round((1-p.price/p.oldPrice)*100) : 0;
    const inWish = Store.inWishlist(p.id);
    const reviews = NS.REVIEWS[p.id] || [];
    const avgRating = p.rating;

    // -- Image side
    document.getElementById('mp-img').style.background = p.imgGradient;
    document.getElementById('mp-emoji').innerHTML = `<img src="${p.imgSrc}" alt="${p.name}" class="mp-photo">`;
    const thumb0 = document.getElementById('mp-thumb-0');
    if(thumb0) { thumb0.style.background = p.imgGradient; thumb0.innerHTML = `<img src="${p.imgSrc}" alt="${p.name}" class="mp-thumb-photo">`; }
    document.getElementById('mp-badge').innerHTML = p.badge ? `<span class="product-badge badge-${p.badge}">${{sale:'SALE',new:'NEW',hot:'🔥 HOT'}[p.badge]}</span>` : '';
    document.getElementById('mp-brand').textContent = p.brand;
    document.getElementById('mp-name').textContent = p.name;
    document.getElementById('mp-sub').textContent = p.sub;
    document.getElementById('mp-stars').innerHTML = UI.stars(avgRating);
    document.getElementById('mp-rating').textContent = avgRating;
    document.getElementById('mp-review-count').textContent = `${p.reviews.toLocaleString()} reviews`;
    document.getElementById('mp-price').textContent = `$${p.price.toLocaleString()}`;
    document.getElementById('mp-old-price').textContent = p.oldPrice ? `$${p.oldPrice.toLocaleString()}` : '';
    document.getElementById('mp-old-price').style.display = p.oldPrice ? '' : 'none';
    document.getElementById('mp-discount').textContent = discount ? `−${discount}%` : '';
    document.getElementById('mp-discount').style.display = discount ? '' : 'none';
    document.getElementById('mp-desc').textContent = p.desc;

    // Features
    document.getElementById('mp-features').innerHTML = p.features.map(f=>`<div class="mp-feature">✓ ${f}</div>`).join('');

    // Specs
    document.getElementById('mp-specs').innerHTML = Object.entries(p.specs).map(([k,v])=>`
      <div class="spec-row"><span class="spec-key">${k}</span><span class="spec-val">${v}</span></div>
    `).join('');

    // Stock
    const stockEl = document.getElementById('mp-stock');
    if(p.stock <= 5) stockEl.innerHTML = `<span class="stock-crit">⚠ Only ${p.stock} units left — order now!</span>`;
    else if(p.stock <= 15) stockEl.innerHTML = `<span class="stock-warn">⚡ Low stock — ${p.stock} remaining</span>`;
    else stockEl.innerHTML = `<span class="stock-ok">✓ ${p.stock} in stock — ships within 24hrs</span>`;

    // Wishlist btn
    const wishBtn = document.getElementById('mp-wish-btn');
    wishBtn.innerHTML = inWish ? '❤️' : '🤍';
    wishBtn.classList.toggle('wishlisted', inWish);
    wishBtn.onclick = () => {
      Store.toggleWishlist(p.id);
      UI.renderProducts();
      UI.renderWishlist();
      wishBtn.innerHTML = Store.inWishlist(p.id) ? '❤️' : '🤍';
      wishBtn.classList.toggle('wishlisted', Store.inWishlist(p.id));
    };

    // Cart btn
    document.getElementById('mp-cart-btn').onclick = () => {
      Store.addToCart(p.id);
      close('modal-product');
    };

    // Tags
    document.getElementById('mp-tags').innerHTML = (p.tags||[]).map(t=>`<span class="tag">${t}</span>`).join('');

    // Reviews
    _buildReviews(p, reviews);
  }

  function _buildReviews(p, reviews) {
    const reviewsEl = document.getElementById('mp-reviews-list');
    const distEl = document.getElementById('mp-rating-dist');

    // Distribution bars
    const dist = [72,18,6,3,1];
    distEl.innerHTML = [5,4,3,2,1].map((s,i)=>`
      <div class="rdist-row">
        <span class="rdist-star">${s}★</span>
        <div class="rdist-track"><div class="rdist-fill" style="width:${dist[i]}%"></div></div>
        <span class="rdist-count">${Math.round(p.reviews*(dist[i]/100)).toLocaleString()}</span>
      </div>
    `).join('');

    // Review list
    if(!reviews.length) {
      reviewsEl.innerHTML = `<div style="color:var(--text3);font-size:13px;padding:16px 0">No written reviews yet. Be the first!</div>`;
      return;
    }
    reviewsEl.innerHTML = reviews.map(r=>`
      <div class="review-card">
        <div class="review-header">
          <div class="reviewer-avatar">${r.name[0]}</div>
          <div>
            <div class="reviewer-name">${r.name}</div>
            <div class="reviewer-meta">Verified Purchase · ${r.date}</div>
          </div>
          <div class="review-stars">${'★'.repeat(r.stars)}</div>
        </div>
        <div class="review-text">${r.text}</div>
        <div class="review-helpful">Helpful? <span class="helpful-btn" onclick="UI.toast('Thanks for your vote!','info','👍')">Yes (${r.helpful})</span> · <span class="helpful-btn" onclick="UI.toast('Noted','info','👎')">No</span></div>
      </div>
    `).join('');

    // Star selector reset
    document.querySelectorAll('.star-sel').forEach((s,i)=>{
      s.classList.remove('active');
      s.onclick = () => {
        document.querySelectorAll('.star-sel').forEach((x,j)=>x.classList.toggle('active', j<=i));
      };
    });
    const ta = document.getElementById('review-textarea');
    if(ta) ta.value = '';
  }

  function submitReview() {
    const ta = document.getElementById('review-textarea');
    const stars = document.querySelectorAll('.star-sel.active').length;
    if(!stars) { UI.toast('Please select a star rating','error','⭐'); return; }
    if(!ta||!ta.value.trim()) { UI.toast('Please write your review','error','✍️'); return; }
    UI.toast('Review submitted! Thank you 🎉','success','⭐');
    ta.value = '';
    document.querySelectorAll('.star-sel').forEach(s=>s.classList.remove('active'));
  }

  /* ── CHECKOUT MODAL ── */
  let _checkoutOrder = null;

  function openCheckout() {
    if(!Store.getCartCount()) { UI.toast('Your cart is empty','error','🛒'); return; }
    _setCheckoutStep(1);
    open('modal-checkout');
  }

  function _setCheckoutStep(n) {
    document.querySelectorAll('.co-step').forEach((s,i)=>{
      s.classList.remove('active','done');
      if(i+1===n) s.classList.add('active');
      else if(i+1<n) s.classList.add('done');
    });
    document.querySelectorAll('.co-panel').forEach((p,i)=>{
      p.classList.toggle('active', i+1===n);
    });
    if(n===3) _buildOrderReview();
    if(n===4) _finaliseOrder();
  }

  function nextCheckoutStep() {
    const current = document.querySelector('.co-step.active');
    if(!current) return;
    const steps = [...document.querySelectorAll('.co-step')];
    const idx = steps.indexOf(current);
    if(idx<steps.length-1) _setCheckoutStep(idx+2);
  }

  function _buildOrderReview() {
    const cart = Store.get('cart');
    const subtotal = Store.getCartTotal();
    const el = document.getElementById('co-review-items');
    if(!el) return;
    el.innerHTML = cart.map(c=>`
      <div class="co-review-row">
        <span class="co-review-img" style="background:${c.imgGradient}">${c.img}</span>
        <span class="co-review-name">${c.name} <span style="color:var(--text3)">×${c.qty}</span></span>
        <span class="co-review-price">$${(c.price*c.qty).toLocaleString()}</span>
      </div>
    `).join('') + `
      <div class="co-review-total">
        <span>Total (incl. 8% tax)</span>
        <span>$${(subtotal*1.08).toLocaleString(undefined,{minimumFractionDigits:2})}</span>
      </div>
    `;
  }

  function _finaliseOrder() {
    const order = Store.placeOrder();
    _checkoutOrder = order;
    document.getElementById('co-success-id').textContent = '#'+order.id;
    document.getElementById('co-success-tracking').textContent = order.tracking;
    UI.renderCart();
    UI.renderOrders();
  }

  function closeCheckout() {
    close('modal-checkout');
    if(_checkoutOrder) {
      App.goToOrders();
      _checkoutOrder = null;
    }
  }

  /* ── ADMIN PRODUCT MODAL ── */
  function openAdminProduct(id) {
    const p = id ? NS.PRODUCTS.find(x=>x.id===id) : null;
    const title = document.getElementById('admin-modal-title');
    const form = document.getElementById('admin-product-form');
    if(!title||!form) return;
    title.textContent = p ? `Edit: ${p.name}` : 'Add New Product';
    form.innerHTML = `
      <div class="form-row-2">
        <div class="form-group">
          <label class="form-label">Brand</label>
          <input class="form-input" value="${p?p.brand:''}" placeholder="e.g. Sony">
        </div>
        <div class="form-group">
          <label class="form-label">Category</label>
          <select class="form-input">
            ${['Audio','Wearables','Electronics','Computing','Gaming','Photography'].map(c=>`<option ${p&&p.cat===c?'selected':''}>${c}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Product Name</label>
        <input class="form-input" value="${p?p.name:''}" placeholder="Full product name">
      </div>
      <div class="form-group">
        <label class="form-label">Sub-title / Type</label>
        <input class="form-input" value="${p?p.sub:''}" placeholder="e.g. Over-Ear Headphones">
      </div>
      <div class="form-row-2">
        <div class="form-group">
          <label class="form-label">Price ($)</label>
          <input class="form-input" type="number" value="${p?p.price:''}" placeholder="0.00">
        </div>
        <div class="form-group">
          <label class="form-label">Old Price ($)</label>
          <input class="form-input" type="number" value="${p?p.oldPrice||'':''}" placeholder="Leave blank if no discount">
        </div>
      </div>
      <div class="form-row-2">
        <div class="form-group">
          <label class="form-label">Stock Qty</label>
          <input class="form-input" type="number" value="${p?p.stock:''}" placeholder="0">
        </div>
        <div class="form-group">
          <label class="form-label">Badge</label>
          <select class="form-input">
            <option value="">None</option>
            <option ${p&&p.badge==='new'?'selected':''}>new</option>
            <option ${p&&p.badge==='sale'?'selected':''}>sale</option>
            <option ${p&&p.badge==='hot'?'selected':''}>hot</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Description</label>
        <textarea class="form-input" rows="3" placeholder="Product description...">${p?p.desc:''}</textarea>
      </div>
      <div style="display:flex;gap:10px;margin-top:4px">
        <button class="btn-primary" style="flex:1" onclick="UI.toast('Product saved!','success','✅'); Modal.close('modal-admin-product')">Save Product</button>
        <button class="btn-secondary" onclick="Modal.close('modal-admin-product')">Cancel</button>
      </div>
    `;
    open('modal-admin-product');
  }

  return {
    open, close, closeAll,
    openProduct,
    submitReview,
    openCheckout, nextCheckoutStep, closeCheckout,
    openAdminProduct,
  };
})();
