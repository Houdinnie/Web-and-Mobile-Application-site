/* ═══════════════════════════════════════════════════════════════
   NOVASTORE — CHARTS ENGINE
═══════════════════════════════════════════════════════════════ */

const Charts = (function() {

  const registry = {};

  const COLORS = {
    nova:    '#e8f542',
    cyan:    '#22d3ee',
    violet:  '#8b5cf6',
    amber:   '#f59e0b',
    rose:    '#fb4f67',
    emerald: '#10b981',
    text3:   'rgba(255,255,255,0.3)',
    text2:   'rgba(255,255,255,0.5)',
    grid:    'rgba(255,255,255,0.05)',
    surface: 'rgba(19,19,26,0.95)',
  };

  const BASE_OPTS = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 600, easing: 'easeInOutQuart' },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: COLORS.surface,
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        titleColor: '#f0f0f8',
        bodyColor: COLORS.text2,
        padding: 12,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        grid: { color: COLORS.grid },
        ticks: { color: COLORS.text3, font: { size: 10, family: "'JetBrains Mono', monospace" } },
        border: { display: false },
      },
      y: {
        grid: { color: COLORS.grid },
        ticks: { color: COLORS.text3, font: { size: 10, family: "'JetBrains Mono', monospace" } },
        border: { display: false },
      },
    },
  };

  function _destroy(id) {
    if(registry[id]) { registry[id].destroy(); delete registry[id]; }
  }

  function _make(id, config) {
    _destroy(id);
    const ctx = document.getElementById(id);
    if(!ctx) return null;
    const chart = new Chart(ctx.getContext('2d'), config);
    registry[id] = chart;
    return chart;
  }

  /* ── GENERATE SALES DATA ── */
  function _salesData(period) {
    const seed = (n, base, variance) => Array.from({length:n}, (_,i) =>
      Math.round(base + Math.sin(i*0.7)*variance*0.4 + Math.random()*variance + i*(base*0.01)));

    if(period==='7d') return {
      labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
      actual:    [3200,4100,3750,5280,4620,6100,5840],
      predicted: [3400,3950,3980,5050,4800,5900,6200],
    };
    if(period==='30d') return {
      labels: ['W1','W2','W3','W4'],
      actual:    [18200,21800,19500,24820],
      predicted: [19000,21200,21000,26100],
    };
    return {
      labels: ['Jan','Feb','Mar','Apr','May','Jun'],
      actual:    [58000,63000,68200,72100,79400,84320],
      predicted: [60000,64500,70000,74000,80500,88000],
    };
  }

  /* ── REVENUE CHART ── */
  function revenue(period='7d') {
    const d = _salesData(period);
    return _make('chart-revenue', {
      type: 'line',
      data: {
        labels: d.labels,
        datasets: [
          {
            label: 'Actual Revenue',
            data: d.actual,
            borderColor: COLORS.nova,
            backgroundColor: 'rgba(232,245,66,0.07)',
            tension: 0.4,
            fill: true,
            pointBackgroundColor: COLORS.nova,
            pointRadius: 4,
            pointHoverRadius: 7,
            borderWidth: 2,
          },
          {
            label: 'AI Forecast',
            data: d.predicted,
            borderColor: 'rgba(34,211,238,0.6)',
            backgroundColor: 'rgba(34,211,238,0.03)',
            tension: 0.4,
            fill: false,
            borderDash: [5,4],
            pointRadius: 3,
            pointBackgroundColor: COLORS.cyan,
            borderWidth: 1.5,
          },
        ],
      },
      options: {
        ...BASE_OPTS,
        plugins: {
          ...BASE_OPTS.plugins,
          legend: {
            display: true,
            position: 'top',
            align: 'end',
            labels: {
              color: COLORS.text2,
              font: { size: 11 },
              boxWidth: 24,
              padding: 16,
              usePointStyle: true,
            },
          },
          tooltip: {
            ...BASE_OPTS.plugins.tooltip,
            callbacks: {
              label: ctx => ` $${ctx.raw.toLocaleString()}`,
            },
          },
        },
        scales: {
          ...BASE_OPTS.scales,
          y: {
            ...BASE_OPTS.scales.y,
            ticks: {
              ...BASE_OPTS.scales.y.ticks,
              callback: v => '$'+v.toLocaleString(),
            },
          },
        },
      },
    });
  }

  function updateRevenue(period) {
    const chart = registry['chart-revenue'];
    if(!chart) { revenue(period); return; }
    const d = _salesData(period);
    chart.data.labels = d.labels;
    chart.data.datasets[0].data = d.actual;
    chart.data.datasets[1].data = d.predicted;
    chart.update();
  }

  /* ── CUSTOMER SEGMENTS DONUT ── */
  function segments() {
    return _make('chart-segments', {
      type: 'doughnut',
      data: {
        labels: ['High Value (>$1k)', 'Mid Value ($300–$1k)', 'Low Value (<$300)'],
        datasets: [{
          data: [23, 48, 29],
          backgroundColor: [COLORS.nova, COLORS.cyan, 'rgba(255,255,255,0.12)'],
          borderWidth: 0,
          hoverOffset: 8,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '74%',
        animation: { duration: 800, easing: 'easeInOutQuart' },
        plugins: {
          legend: { display: false },
          tooltip: {
            ...BASE_OPTS.plugins.tooltip,
            callbacks: {
              label: ctx => ` ${ctx.label}: ${ctx.raw}% of customers`,
            },
          },
        },
      },
    });
  }

  /* ── TOP PRODUCTS HORIZONTAL BAR ── */
  function topProducts() {
    return _make('chart-top-products', {
      type: 'bar',
      data: {
        labels: ['WH-1000XM5','iPhone 16 PM','PS5 Slim','MacBook M3','Galaxy S25U'],
        datasets: [{
          data: [284, 211, 198, 167, 142],
          backgroundColor: [COLORS.nova, COLORS.cyan, COLORS.violet, COLORS.amber, COLORS.emerald],
          borderRadius: 6,
          borderSkipped: false,
        }],
      },
      options: {
        ...BASE_OPTS,
        indexAxis: 'y',
        plugins: {
          ...BASE_OPTS.plugins,
          tooltip: {
            ...BASE_OPTS.plugins.tooltip,
            callbacks: { label: ctx => ` ${ctx.raw} units sold` },
          },
        },
        scales: {
          x: { ...BASE_OPTS.scales.x, ticks: { ...BASE_OPTS.scales.x.ticks, callback: v => v+' units' } },
          y: { grid: { display: false }, ticks: { color: 'rgba(255,255,255,0.6)', font: { size: 11 } }, border: { display: false } },
        },
      },
    });
  }

  /* ── CONVERSION FUNNEL ── */
  function funnel() {
    return _make('chart-funnel', {
      type: 'bar',
      data: {
        labels: ['Sessions','Product Views','Add to Cart','Checkout Start','Purchase'],
        datasets: [{
          data: [12400, 8200, 3100, 1860, 596],
          backgroundColor: [
            'rgba(232,245,66,0.85)', 'rgba(232,245,66,0.68)',
            'rgba(232,245,66,0.52)', 'rgba(232,245,66,0.36)', 'rgba(232,245,66,0.95)',
          ],
          borderRadius: 6,
          borderSkipped: false,
        }],
      },
      options: {
        ...BASE_OPTS,
        plugins: {
          ...BASE_OPTS.plugins,
          tooltip: {
            ...BASE_OPTS.plugins.tooltip,
            callbacks: {
              label: ctx => {
                const vals = [12400,8200,3100,1860,596];
                const pct = ((ctx.raw/vals[0])*100).toFixed(1);
                return ` ${ctx.raw.toLocaleString()} (${pct}% of sessions)`;
              },
            },
          },
        },
        scales: {
          ...BASE_OPTS.scales,
          y: { ...BASE_OPTS.scales.y, ticks: { ...BASE_OPTS.scales.y.ticks, callback: v => v.toLocaleString() } },
        },
      },
    });
  }

  /* ── TRAFFIC SOURCES ── */
  function traffic() {
    return _make('chart-traffic', {
      type: 'doughnut',
      data: {
        labels: ['Organic Search','Direct','Social Media','Email','Paid Ads'],
        datasets: [{
          data: [34, 28, 18, 12, 8],
          backgroundColor: [COLORS.nova, COLORS.cyan, COLORS.violet, COLORS.amber, COLORS.rose],
          borderWidth: 0,
          hoverOffset: 6,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        animation: { duration: 700 },
        plugins: {
          legend: {
            display: true,
            position: 'right',
            labels: {
              color: COLORS.text2,
              font: { size: 11 },
              padding: 12,
              boxWidth: 10,
              usePointStyle: true,
            },
          },
          tooltip: {
            ...BASE_OPTS.plugins.tooltip,
            callbacks: { label: ctx => ` ${ctx.label}: ${ctx.raw}%` },
          },
        },
      },
    });
  }

  /* ── AOV TREND ── */
  function aov() {
    return _make('chart-aov', {
      type: 'line',
      data: {
        labels: ['Jan','Feb','Mar','Apr','May','Jun'],
        datasets: [{
          label: 'Avg Order Value',
          data: [142, 156, 149, 168, 174, 183],
          borderColor: COLORS.violet,
          backgroundColor: 'rgba(139,92,246,0.08)',
          tension: 0.4,
          fill: true,
          pointRadius: 4,
          pointBackgroundColor: COLORS.violet,
          pointHoverRadius: 7,
          borderWidth: 2,
        }],
      },
      options: {
        ...BASE_OPTS,
        plugins: {
          ...BASE_OPTS.plugins,
          tooltip: {
            ...BASE_OPTS.plugins.tooltip,
            callbacks: { label: ctx => ` $${ctx.raw} avg order` },
          },
        },
        scales: {
          ...BASE_OPTS.scales,
          y: { ...BASE_OPTS.scales.y, ticks: { ...BASE_OPTS.scales.y.ticks, callback: v => '$'+v } },
        },
      },
    });
  }

  /* ── 90-DAY FORECAST CHART ── */
  function forecast() {
    const days = 90;
    const labels = Array.from({length:days}, (_,i) => {
      const d = new Date(2025,0,1+i);
      return d.getDate()===1 ? d.toLocaleString('en',{month:'short'}) : (i%14===0?'·':'');
    });
    const actual = Array.from({length:60}, (_,i) => Math.round(2000 + Math.sin(i*0.3)*600 + i*22 + Math.random()*300));
    const pred   = Array.from({length:90}, (_,i) => Math.round(2400 + i*20 + Math.sin(i*0.25)*400 + Math.random()*200));

    return _make('chart-forecast', {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Actual',
            data: [...actual, ...Array(30).fill(null)],
            borderColor: COLORS.nova,
            backgroundColor: 'rgba(232,245,66,0.06)',
            tension: 0.3,
            fill: true,
            pointRadius: 0,
            borderWidth: 2,
          },
          {
            label: 'AI Forecast',
            data: [...Array(58).fill(null), actual[58], actual[59], ...pred.slice(60)],
            borderColor: 'rgba(34,211,238,0.65)',
            borderDash: [5,4],
            tension: 0.3,
            fill: false,
            pointRadius: 0,
            borderWidth: 1.5,
          },
          {
            label: 'Upper Band',
            data: [...Array(60).fill(null), ...pred.slice(60).map(v=>v+300)],
            borderColor: 'transparent',
            backgroundColor: 'rgba(34,211,238,0.06)',
            tension: 0.3,
            fill: '+1',
            pointRadius: 0,
            borderWidth: 0,
          },
          {
            label: 'Lower Band',
            data: [...Array(60).fill(null), ...pred.slice(60).map(v=>v-300)],
            borderColor: 'transparent',
            backgroundColor: 'rgba(34,211,238,0.06)',
            tension: 0.3,
            fill: false,
            pointRadius: 0,
            borderWidth: 0,
          },
        ],
      },
      options: {
        ...BASE_OPTS,
        plugins: {
          ...BASE_OPTS.plugins,
          legend: {
            display: true,
            position: 'top',
            align: 'end',
            labels: {
              color: COLORS.text2,
              font: { size: 11 },
              boxWidth: 20,
              padding: 14,
              filter: item => item.text !== 'Upper Band' && item.text !== 'Lower Band',
              usePointStyle: true,
            },
          },
          tooltip: {
            ...BASE_OPTS.plugins.tooltip,
            callbacks: { label: ctx => ctx.raw ? ` $${ctx.raw.toLocaleString()}` : null },
          },
        },
        scales: {
          x: {
            ...BASE_OPTS.scales.x,
            ticks: { ...BASE_OPTS.scales.x.ticks, maxTicksLimit: 10 },
          },
          y: {
            ...BASE_OPTS.scales.y,
            ticks: { ...BASE_OPTS.scales.y.ticks, callback: v => '$'+v.toLocaleString() },
          },
        },
      },
    });
  }

  /* ── CATEGORY REVENUE PIE ── */
  function categoryRevenue() {
    return _make('chart-cat-revenue', {
      type: 'doughnut',
      data: {
        labels: ['Electronics','Audio','Computing','Gaming','Wearables','Photography'],
        datasets: [{
          data: [34, 22, 18, 14, 8, 4],
          backgroundColor: [COLORS.nova, COLORS.cyan, COLORS.violet, COLORS.amber, COLORS.emerald, COLORS.rose],
          borderWidth: 0,
          hoverOffset: 6,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        animation: { duration: 700 },
        plugins: {
          legend: {
            display: true,
            position: 'right',
            labels: { color: COLORS.text2, font: { size: 11 }, padding: 10, boxWidth: 10, usePointStyle: true },
          },
          tooltip: {
            ...BASE_OPTS.plugins.tooltip,
            callbacks: { label: ctx => ` ${ctx.label}: ${ctx.raw}% of revenue` },
          },
        },
      },
    });
  }

  /* ── INVENTORY DAYS BAR ── */
  function inventoryDays() {
    const products = NS.PRODUCTS.slice(0,10);
    const colors = products.map(p => p.daysLeft<=5?COLORS.rose:p.daysLeft<=15?COLORS.amber:COLORS.emerald);
    return _make('chart-inventory', {
      type: 'bar',
      data: {
        labels: products.map(p => p.name.length>16 ? p.name.slice(0,14)+'…' : p.name),
        datasets: [{
          label: 'Days Until Stockout',
          data: products.map(p => p.daysLeft),
          backgroundColor: colors,
          borderRadius: 4,
          borderSkipped: false,
        }],
      },
      options: {
        ...BASE_OPTS,
        indexAxis: 'y',
        plugins: {
          ...BASE_OPTS.plugins,
          tooltip: {
            ...BASE_OPTS.plugins.tooltip,
            callbacks: { label: ctx => ` ~${ctx.raw} days remaining` },
          },
        },
        scales: {
          x: { ...BASE_OPTS.scales.x, ticks: { ...BASE_OPTS.scales.x.ticks, callback: v => v+'d' } },
          y: { grid:{display:false}, ticks:{color:'rgba(255,255,255,0.55)',font:{size:10}}, border:{display:false} },
        },
      },
    });
  }

  /* ── INIT ALL DASHBOARD CHARTS ── */
  let _initialized = false;
  function initDashboard() {
    if(_initialized) return;
    _initialized = true;
    setTimeout(() => {
      revenue('7d');
      segments();
      topProducts();
    }, 80);
  }

  function initAnalytics() {
    setTimeout(() => {
      funnel();
      traffic();
      aov();
      categoryRevenue();
    }, 80);
  }

  function initForecasting() {
    setTimeout(() => { forecast(); }, 80);
  }

  function initInventoryChart() {
    setTimeout(() => { inventoryDays(); }, 80);
  }

  function resetInit() { _initialized = false; }

  return {
    revenue, updateRevenue,
    segments, topProducts,
    funnel, traffic, aov,
    forecast, categoryRevenue,
    inventoryDays,
    initDashboard, initAnalytics, initForecasting, initInventoryChart,
    resetInit,
    registry,
  };
})();
