/* ═══════════════════════════════════════════════════════════════
   NOVASTORE — ADMIN ENGINE
═══════════════════════════════════════════════════════════════ */

const Admin = (function() {

  const STATUS_CLASS = {
    Delivered: 'status-delivered',
    Shipped:   'status-shipped',
    Processing:'status-processing',
    Pending:   'status-pending',
  };

  /* ── SUB-PAGE NAVIGATION ── */
  function goSub(sub, el) {
    document.querySelectorAll('.admin-sub').forEach(s=>s.classList.remove('active'));
    document.querySelectorAll('.sidebar-item').forEach(s=>s.classList.remove('active'));
    const panel = document.getElementById('sub-'+sub);
    if(panel) { panel.classList.add('active'); }
    if(el) el.classList.add('active');

    switch(sub) {
      case 'overview':    Charts.initDashboard(); break;
      case 'analytics':   renderAnalytics();      break;
      case 'inventory':   renderInventory();      break;
      case 'customers':   renderCustomers();      break;
      case 'orders-mgmt': renderOrdersMgmt();     break;
      case 'customer-orders': UI.renderOrders();  break;
      case 'products-mgmt': renderProductsMgmt(); break;
      case 'forecasting': Charts.initForecasting(); break;
      case 'reports':     /* static */            break;
    }
  }

  /* ── INVENTORY TABLE ── */
  function renderInventory() {
    const tbody = document.getElementById('inventory-tbody');
    if(!tbody) return;

    Charts.initInventoryChart();

    tbody.innerHTML = NS.PRODUCTS.map(p => {
      const pct = Math.min(100, Math.round((p.stock / 100) * 100));
      const barCls = p.daysLeft<=5 ? 'bar-crit' : p.daysLeft<=15 ? 'bar-warn' : 'bar-ok';
      const daysCls = p.daysLeft<=5 ? 'days-crit' : p.daysLeft<=15 ? 'days-warn' : 'days-ok';
      const statusTxt = p.daysLeft<=5 ? '⚠ Critical' : p.daysLeft<=15 ? '⚡ Low' : '✓ Healthy';
      const statusCls = p.daysLeft<=5 ? 'status-pending" style="background:rgba(251,79,103,.15);color:#fb4f67' : p.daysLeft<=15 ? 'status-processing' : 'status-delivered';
      return `
        <tr>
          <td><div class="td-product"><span class="td-emoji" style="background:${p.imgGradient}"><img src="${p.imgSrc}" alt="${p.name}" class="td-photo"></span><div><div class="td-name">${p.name}</div><div class="td-sku">${p.sku}</div></div></div></td>
          <td><span class="cat-chip">${p.cat}</span></td>
          <td>
            <div class="stock-cell">
              <div class="stock-track"><div class="stock-bar ${barCls}" style="width:${pct}%"></div></div>
              <span class="stock-num">${p.stock}</span>
            </div>
          </td>
          <td>${p.sold.toLocaleString()}</td>
          <td><span class="${daysCls}">~${p.daysLeft}d</span></td>
          <td><span class="status-badge ${statusCls}">${statusTxt}</span></td>
          <td>
            <div class="td-actions">
              <button class="td-btn td-btn-primary" onclick="UI.toast('Reorder placed for ${p.name.replace(/'/g,'').slice(0,20)}','success','📦')">Reorder</button>
              <button class="td-btn" onclick="Modal.openAdminProduct(${p.id})">Edit</button>
            </div>
          </td>
        </tr>`;
    }).join('');
  }

  /* ── CUSTOMERS TABLE ── */
  function renderCustomers() {
    const tbody = document.getElementById('customers-tbody');
    if(!tbody) return;
    const segColor = { High:'var(--nova)', Mid:'var(--cyan)', Low:'var(--text2)' };
    tbody.innerHTML = NS.CUSTOMERS.map(c => `
      <tr>
        <td>
          <div class="td-product">
            <div class="customer-avatar">${c.name[0]}</div>
            <div>
              <div class="td-name">${c.name}</div>
              <div class="td-sku">${c.email}</div>
            </div>
          </div>
        </td>
        <td><span style="color:${segColor[c.segment]};font-weight:700">${c.segment} Value</span></td>
        <td><span class="td-money">$${c.spent.toLocaleString()}</span></td>
        <td>${c.orders}</td>
        <td><span class="td-date">${c.joined}</span></td>
        <td><span class="td-date">${c.last}</span></td>
        <td>
          <div class="td-actions">
            <button class="td-btn" onclick="UI.toast('Viewing ${c.name}','info','👤')">View</button>
            <button class="td-btn" onclick="UI.toast('Email sent to ${c.email}','success','📧')">Email</button>
          </div>
        </td>
      </tr>`).join('');
  }

  /* ── ORDERS MANAGEMENT TABLE ── */
  function renderOrdersMgmt() {
    const tbody = document.getElementById('orders-mgmt-tbody');
    if(!tbody) return;
    tbody.innerHTML = NS.ADMIN_ORDERS.map(o => `
      <tr>
        <td><span class="order-id-cell">#${o.id}</span></td>
        <td>
          <div class="td-name">${o.customer}</div>
          <div class="td-sku">${o.email}</div>
        </td>
        <td>${o.items} item${o.items!==1?'s':''}</td>
        <td><span class="td-money">$${o.total.toLocaleString()}</span></td>
        <td><span class="td-date">${o.date}</span></td>
        <td>
          <select class="status-select" onchange="Admin.changeOrderStatus(this,'${o.id}')">
            ${['Pending','Processing','Shipped','Delivered'].map(s=>`<option ${s===o.status?'selected':''}>${s}</option>`).join('')}
          </select>
        </td>
        <td>
          <div class="td-actions">
            <button class="td-btn td-btn-primary" onclick="UI.toast('Order #${o.id} details','info','📦')">View</button>
            <button class="td-btn" onclick="UI.toast('Invoice generated','success','🧾')">Invoice</button>
          </div>
        </td>
      </tr>`).join('');
  }

  function changeOrderStatus(sel, orderId) {
    const order = NS.ADMIN_ORDERS.find(o=>o.id===orderId);
    if(order) order.status = sel.value;
    UI.toast(`Order #${orderId} → ${sel.value}`,'success','✅');
  }

  /* ── PRODUCTS MANAGEMENT TABLE ── */
  function renderProductsMgmt() {
    const tbody = document.getElementById('products-mgmt-tbody');
    if(!tbody) return;
    const countEl = document.getElementById('products-mgmt-count');
    if(countEl) countEl.textContent = `${NS.PRODUCTS.length} total products`;
    tbody.innerHTML = NS.PRODUCTS.map(p => {
      const discount = p.oldPrice ? Math.round((1-p.price/p.oldPrice)*100) : 0;
      return `
        <tr>
          <td>
            <div class="td-product">
              <span class="td-emoji" style="background:${p.imgGradient}"><img src="${p.imgSrc}" alt="${p.name}" class="td-photo"></span>
              <div>
                <div class="td-name">${p.name}</div>
                <div class="td-sku">${p.sku}</div>
              </div>
            </div>
          </td>
          <td><span class="cat-chip">${p.cat}</span></td>
          <td><span class="td-money">$${p.price.toLocaleString()}</span>${discount?`<span class="discount-tiny">−${discount}%</span>`:''}</td>
          <td><span class="stock-num ${p.stock<=10?'text-rose':''}">${p.stock}</span></td>
          <td>${p.sold.toLocaleString()}</td>
          <td><span class="text-amber">★</span> ${p.rating} <span class="td-sku">(${p.reviews.toLocaleString()})</span></td>
          <td>${p.badge?`<span class="product-badge badge-${p.badge}" style="position:static;font-size:9px">${p.badge.toUpperCase()}</span>`:'-'}</td>
          <td>
            <div class="td-actions">
              <button class="td-btn td-btn-primary" onclick="Modal.openAdminProduct(${p.id})">Edit</button>
              <button class="td-btn td-btn-danger" onclick="UI.toast('Product removed','error','🗑')">Del</button>
            </div>
          </td>
        </tr>`;
    }).join('');
  }

  /* ── ANALYTICS SUB-PAGE ── */
  function renderAnalytics() {
    Charts.initAnalytics();
  }

  /* ── LIVE KPI TICKER ── */
  let _tickerStarted = false;
  function startKpiTicker() {
    if(_tickerStarted) return;
    const revenueEl = document.getElementById('kpi-revenue');
    const ordersEl  = document.getElementById('kpi-orders');
    if(!revenueEl || !ordersEl) return;

    _tickerStarted = true;
    let revenue = 84320;
    let orders  = 1847;

    setInterval(() => {
      const rInc = Math.floor(Math.random()*180+20);
      const oInc = Math.floor(Math.random()*2);
      revenue += rInc;
      orders  += oInc;
      if(revenueEl) revenueEl.textContent = '$'+revenue.toLocaleString();
      if(ordersEl)  ordersEl.textContent  = orders.toLocaleString();
    }, 4000);
  }

  return {
    goSub,
    renderInventory, renderCustomers,
    renderOrdersMgmt, renderProductsMgmt,
    renderAnalytics, changeOrderStatus,
    startKpiTicker,
  };
})();
