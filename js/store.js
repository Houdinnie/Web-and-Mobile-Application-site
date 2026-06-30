/* ═══════════════════════════════════════════════════════════════
   NOVASTORE — STATE & STORE
═══════════════════════════════════════════════════════════════ */

const Store = (function() {

  /* ── STATE ── */
  let state = {
    cart: [],
    wishlist: [],
    currentPage: 'store',
    currentCategory: 'all',
    searchQuery: '',
    sortBy: 'featured',
    priceRange: [0, 9999],
    adminSub: 'overview',
    authTab: 'login',
    checkoutStep: 0,
    selectedProduct: null,
    notifications: [
      {id:1,icon:'📦',title:'Order Shipped',sub:'#ORD-9840 is on its way! Est. delivery Jun 30.',time:'2 min ago',type:'info',unread:true},
      {id:2,icon:'🎉',title:'Flash Sale — 24hrs',sub:'Electronics up to 40% off — today only!',time:'1 hr ago',type:'promo',unread:true},
      {id:3,icon:'❤️',title:'Wishlist Item On Sale',sub:'Sony WH-1000XM5 is now 20% off.',time:'3 hrs ago',type:'alert',unread:true},
      {id:4,icon:'✅',title:'Order Delivered',sub:'#ORD-9812 delivered successfully.',time:'Jun 28',type:'info',unread:true},
      {id:5,icon:'🤖',title:'AI Recommendation',sub:'Based on your history: MacBook Air M3 — bundle deal available.',time:'Jun 27',type:'promo',unread:true},
      {id:6,icon:'💰',title:'Refund Processed',sub:'$99.00 refund for cancelled order #ORD-9771.',time:'Jun 26',type:'info',unread:false},
      {id:7,icon:'🔒',title:'New Login Detected',sub:'Chrome / Windows 11 — London, UK.',time:'Jun 25',type:'alert',unread:false},
    ],
    orders: [],
  };

  /* ── SUBSCRIBERS ── */
  const listeners = {};
  function on(event, fn) { (listeners[event] = listeners[event]||[]).push(fn); }
  function emit(event, data) { (listeners[event]||[]).forEach(fn=>fn(data)); }

  /* ── CART ── */
  function addToCart(productId, qty=1) {
    const p = NS.PRODUCTS.find(x=>x.id===productId);
    if(!p) return;
    const existing = state.cart.find(x=>x.id===productId);
    if(existing) existing.qty += qty;
    else state.cart.push({...p, qty});
    emit('cart:update', state.cart);
    emit('toast', {msg:`${p.name} added to cart`, type:'success', icon:p.img});
  }

  function removeFromCart(productId) {
    state.cart = state.cart.filter(x=>x.id!==productId);
    emit('cart:update', state.cart);
  }

  function changeQty(productId, delta) {
    const item = state.cart.find(x=>x.id===productId);
    if(!item) return;
    item.qty = Math.max(0, item.qty + delta);
    if(item.qty === 0) removeFromCart(productId);
    else emit('cart:update', state.cart);
  }

  function clearCart() {
    state.cart = [];
    emit('cart:update', state.cart);
  }

  function getCartTotal() {
    return state.cart.reduce((s,x)=>s+x.price*x.qty, 0);
  }

  function getCartCount() {
    return state.cart.reduce((s,x)=>s+x.qty, 0);
  }

  /* ── WISHLIST ── */
  function toggleWishlist(productId) {
    const p = NS.PRODUCTS.find(x=>x.id===productId);
    if(!p) return;
    const idx = state.wishlist.findIndex(x=>x.id===productId);
    if(idx>=0) {
      state.wishlist.splice(idx,1);
      emit('toast', {msg:`Removed from wishlist`, type:'info', icon:'🤍'});
    } else {
      state.wishlist.push(p);
      emit('toast', {msg:`${p.name} saved to wishlist`, type:'success', icon:'❤️'});
    }
    emit('wishlist:update', state.wishlist);
  }

  function inWishlist(productId) {
    return !!state.wishlist.find(x=>x.id===productId);
  }

  /* ── ORDERS ── */
  function placeOrder() {
    const items = state.cart.map(x=>({name:x.name, img:x.img, imgSrc:x.imgSrc, imgGradient:x.imgGradient, price:x.price, qty:x.qty}));
    const total = getCartTotal() * 1.08;
    const orderId = 'ORD-' + (9900 + Math.floor(Math.random()*99));
    const order = {
      id: orderId,
      date: new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}),
      items: items.map(x=>({name:x.name, img:x.img, imgSrc:x.imgSrc, imgGradient:x.imgGradient})),
      total: total,
      status: 'Processing',
      tracking: '1Z999AA1' + Math.floor(Math.random()*9999999999).toString().padStart(10,'0'),
    };
    NS.ORDERS_DATA.unshift(order);
    clearCart();
    emit('order:placed', order);
    return order;
  }

  /* ── PRODUCT FILTER ── */
  function getFilteredProducts() {
    let products = [...NS.PRODUCTS];
    if(state.currentCategory !== 'all')
      products = products.filter(p=>p.cat===state.currentCategory);
    if(state.searchQuery)
      products = products.filter(p=>
        p.name.toLowerCase().includes(state.searchQuery) ||
        p.brand.toLowerCase().includes(state.searchQuery) ||
        p.cat.toLowerCase().includes(state.searchQuery) ||
        p.sub.toLowerCase().includes(state.searchQuery) ||
        (p.tags||[]).some(t=>t.includes(state.searchQuery))
      );
    products = products.filter(p=>p.price >= state.priceRange[0] && p.price <= state.priceRange[1]);
    switch(state.sortBy) {
      case 'price-asc':   products.sort((a,b)=>a.price-b.price); break;
      case 'price-desc':  products.sort((a,b)=>b.price-a.price); break;
      case 'rating':      products.sort((a,b)=>b.rating-a.rating); break;
      case 'bestseller':  products.sort((a,b)=>b.sold-a.sold); break;
      case 'newest':      products.sort((a,b)=>b.id-a.id); break;
    }
    return products;
  }

  /* ── NOTIFICATIONS ── */
  function markAllRead() {
    state.notifications.forEach(n=>n.unread=false);
    emit('notifications:update', state.notifications);
  }

  function getUnreadCount() {
    return state.notifications.filter(n=>n.unread).length;
  }

  /* ── NAVIGATE ── */
  function navigate(page) {
    state.currentPage = page;
    emit('page:change', page);
  }

  /* ── GETTERS ── */
  function get(key) { return state[key]; }
  function set(key, val) { state[key]=val; emit('state:change', {key, val}); }

  return {
    on, emit,
    get, set,
    addToCart, removeFromCart, changeQty, clearCart, getCartTotal, getCartCount,
    toggleWishlist, inWishlist,
    placeOrder,
    getFilteredProducts,
    markAllRead, getUnreadCount,
    navigate,
    getState: ()=>({...state}),
  };
})();
