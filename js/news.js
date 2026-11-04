// ═══════════════════════════════════════════════════════
// news.js — Tin tức & Sự kiện nhà trường
// DB:      news/{id}  — metadata bài đăng
// Storage: news/{id}/images/{filename} — ảnh đính kèm
// ═══════════════════════════════════════════════════════

// ── Hằng số ────────────────────────────────────────────
const NEWS_CATS = {
    activity: { label:'Hoạt động',     icon:'running',       color:'#2563eb', bg:'#dbeafe' },
    event:    { label:'Sự kiện',        icon:'calendar-star', color:'#7c3aed', bg:'#ede9fe' },
    achievement:{ label:'Thành tích',  icon:'trophy',        color:'#d97706', bg:'#fef3c7' },
    summary:  { label:'Tổng kết',       icon:'chart-bar',    color:'#16a34a', bg:'#dcfce7' },
    health:   { label:'Y tế – Sức khỏe',icon:'heartbeat',    color:'#dc2626', bg:'#fee2e2' },
    general:  { label:'Tin chung',      icon:'newspaper',    color:'#0891b2', bg:'#e0f2fe' },
};

// ── Firebase Storage lazy init ───────────────────────────
let _storage = null;
async function getStorage() {
    if (window.FIREBASE_FEATURES?.storage !== true) {
        throw new Error('Tải ảnh tin tức bị tắt trong chế độ Firebase Spark. Bạn vẫn có thể đăng tin dạng văn bản.');
    }
    if (_storage) return _storage;
    const { getStorage: gs, ref: sRef, uploadBytes, getDownloadURL, deleteObject }
        = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js');
    _storage = { gs, sRef, uploadBytes, getDownloadURL, deleteObject,
                 app: window._firebaseApp };
    _storage.instance = gs(window._firebaseApp);
    return _storage;
}

// ── Upload 1 ảnh lên Firebase Storage ────────────────────
async function uploadImage(file, postId, idx) {
    const st   = await getStorage();
    const ext  = file.name.split('.').pop().toLowerCase();
    const path = `news/${postId}/img_${idx}_${Date.now()}.${ext}`;
    const ref  = st.sRef(st.instance, path);
    await st.uploadBytes(ref, file);
    return await st.getDownloadURL(ref);
}

// ── DB helpers ───────────────────────────────────────────
const newsRef  = (id) => id
    ? window.ref(window.db, `news/${id}`)
    : window.ref(window.db, 'news');

// ══════════════════════════════════════════════════════════════════════════════
// RENDER TRANG TIN TỨC
// ══════════════════════════════════════════════════════════════════════════════
export async function renderNews() {
    const isAdmin = window.userRole === 'admin';

    document.getElementById('content').innerHTML = `
    <style>
        /* ── News card animations ── */
        .news-card {
            background: white;
            border-radius: 14px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            transition: transform 0.25s ease, box-shadow 0.25s ease;
            cursor: pointer;
            animation: fadeSlideUp 0.4s ease both;
        }
        .news-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 24px rgba(0,0,0,0.14);
        }
        @keyframes fadeSlideUp {
            from { opacity:0; transform:translateY(20px); }
            to   { opacity:1; transform:translateY(0);    }
        }
        /* Stagger delay */
        .news-card:nth-child(1) { animation-delay: 0.05s }
        .news-card:nth-child(2) { animation-delay: 0.10s }
        .news-card:nth-child(3) { animation-delay: 0.15s }
        .news-card:nth-child(4) { animation-delay: 0.20s }
        .news-card:nth-child(5) { animation-delay: 0.25s }
        .news-card:nth-child(6) { animation-delay: 0.30s }

        /* Thumbnail with zoom on hover */
        .news-thumb-wrap { overflow:hidden; position:relative; }
        .news-thumb {
            width:100%; height:200px; object-fit:cover;
            transition: transform 0.4s ease;
            display:block;
        }
        .news-card:hover .news-thumb { transform: scale(1.06); }

        /* No-image placeholder */
        .news-thumb-placeholder {
            width:100%; height:200px;
            display:flex; align-items:center; justify-content:center;
            font-size:3rem; color:rgba(255,255,255,0.7);
        }

        /* Gallery lightbox */
        .lightbox-overlay {
            position:fixed; inset:0;
            background:rgba(0,0,0,0.92);
            z-index:9999; display:flex; align-items:center; justify-content:center;
            animation: fadeIn 0.2s ease;
        }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        .lightbox-img {
            max-width:90vw; max-height:88vh;
            border-radius:8px;
            box-shadow:0 0 60px rgba(0,0,0,0.6);
            animation: zoomIn 0.25s ease;
        }
        @keyframes zoomIn { from{transform:scale(0.85);opacity:0} to{transform:scale(1);opacity:1} }
        .lightbox-nav {
            position:absolute; top:50%; transform:translateY(-50%);
            background:rgba(255,255,255,0.15); border:none; color:white;
            width:48px; height:48px; border-radius:50%;
            font-size:1.3rem; cursor:pointer;
            transition: background 0.2s;
            display:flex; align-items:center; justify-content:center;
        }
        .lightbox-nav:hover { background:rgba(255,255,255,0.3); }

        /* Filter tabs */
        .news-filter-tab {
            padding: 7px 16px; border-radius: 20px; border: none;
            font-size: 0.83rem; font-weight: 600; cursor: pointer;
            transition: all 0.2s ease;
        }
        .news-filter-tab.active { color: white; }
        .news-filter-tab:not(.active) { background: white; color: #64748b;
            border: 1px solid #e2e8f0; }
        .news-filter-tab:not(.active):hover { border-color:#2563eb; color:#2563eb; }

        /* Featured (first) card larger */
        .news-featured .news-thumb { height: 280px; }
    </style>

    <!-- Header -->
    <div style="display:flex;gap:10px;align-items:center;margin-bottom:16px;flex-wrap:wrap">
        <div>
            <h2 style="margin:0;font-size:1.2rem;color:#1e293b;font-weight:800">
                <i class="fas fa-newspaper" style="color:#2563eb"></i>
                Tin tức & Hoạt động nhà trường
            </h2>
            <p style="margin:2px 0 0;font-size:0.82rem;color:#64748b">
                Cập nhật các tin tức, sự kiện và hoạt động nổi bật
            </p>
        </div>
        ${isAdmin ? `
        <button class="btn btn-primary" onclick="openNewsModal()" style="margin-left:auto">
            <i class="fas fa-plus"></i> Đăng tin mới
        </button>` : ''}
    </div>

    <!-- Filter tabs -->
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px;align-items:center">
        <button class="news-filter-tab active" data-cat=""
            onclick="filterNews('')" style="background:#1e3a8a">
            <i class="fas fa-th-large"></i> Tất cả
        </button>
        ${Object.entries(NEWS_CATS).map(([k,v]) => `
            <button class="news-filter-tab" data-cat="${k}"
                onclick="filterNews('${k}')"
                style="">
                <i class="fas fa-${v.icon}"></i> ${v.label}
            </button>
        `).join('')}
        <div style="margin-left:auto">
            <input type="text" id="news-search" placeholder="🔍 Tìm kiếm..."
                class="form-control" style="max-width:200px;font-size:0.85rem"
                oninput="filterNews(window._newsCurCat||'')">
        </div>
    </div>

    <!-- Grid bài đăng -->
    <div id="news-grid" style="
        display:grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap:20px;
    ">
        <div style="text-align:center;padding:60px;grid-column:1/-1;color:#94a3b8">
            <i class="fas fa-spinner fa-spin" style="font-size:2rem"></i>
            <p style="margin-top:12px">Đang tải tin tức...</p>
        </div>
    </div>`;

    window._newsCurCat = '';
    loadNewsGrid('');
}

// ── Load & render grid ─────────────────────────────────
async function loadNewsGrid(cat) {
    const snap = await window.get(newsRef());
    const raw  = snap.val() || {};
    window._newsData = raw;
    renderNewsGrid(cat);
}

function renderNewsGrid(cat) {
    const search  = (document.getElementById('news-search')?.value || '').toLowerCase();
    const raw     = window._newsData || {};
    let   items   = Object.values(raw)
        .sort((a,b) => (b.createdAt||0) - (a.createdAt||0));

    if (cat)    items = items.filter(n => n.category === cat);
    if (search) items = items.filter(n =>
        (n.title||'').toLowerCase().includes(search) ||
        (n.content||'').toLowerCase().includes(search)
    );

    const grid = document.getElementById('news-grid');
    if (!grid) return;

    if (!items.length) {
        grid.innerHTML = `
        <div style="text-align:center;padding:80px;grid-column:1/-1;
                    background:white;border-radius:14px;color:#94a3b8">
            <i class="fas fa-newspaper" style="font-size:3rem;margin-bottom:16px;display:block"></i>
            <p style="font-size:1rem">Chưa có tin tức nào${cat?' trong mục này':''}</p>
            ${window.userRole==='admin' ? `
            <button class="btn btn-primary" onclick="openNewsModal()" style="margin-top:16px">
                <i class="fas fa-plus"></i> Đăng tin đầu tiên
            </button>` : ''}
        </div>`;
        return;
    }

    grid.innerHTML = items.map((item, idx) => _buildCard(item, idx)).join('');
}

function _buildCard(item, idx) {
    const cat     = NEWS_CATS[item.category] || NEWS_CATS.general;
    const isAdmin = window.userRole === 'admin';
    const date    = item.createdAt
        ? new Date(item.createdAt).toLocaleDateString('vi-VN', {day:'2-digit',month:'2-digit',year:'numeric'})
        : '';
    const firstImg = item.images?.[0] || '';
    const imgCount = item.images?.length || 0;
    const isFeatured = idx === 0;
    const excerpt = (item.content||'').replace(/<[^>]+>/g,'').substring(0, 120) + '...';

    // gradient background khi không có ảnh
    const gradients = [
        'linear-gradient(135deg,#1e3a8a,#2563eb)',
        'linear-gradient(135deg,#5b21b6,#7c3aed)',
        'linear-gradient(135deg,#065f46,#16a34a)',
        'linear-gradient(135deg,#92400e,#d97706)',
        'linear-gradient(135deg,#0891b2,#06b6d4)',
        'linear-gradient(135deg,#be185d,#ec4899)',
    ];
    const grad = gradients[Object.values(NEWS_CATS).findIndex(c=>c===cat) % gradients.length];

    return `
    <div class="news-card ${isFeatured?'news-featured':''}"
         onclick="viewNewsDetail('${item.id}')">

        <!-- Thumbnail -->
        <div class="news-thumb-wrap">
            ${firstImg
                ? `<img class="news-thumb" src="${firstImg}" alt="${item.title||''}"
                        loading="lazy" onerror="this.style.display='none'">`
                : `<div class="news-thumb-placeholder" style="background:${grad}">
                       <i class="fas fa-${cat.icon}"></i>
                   </div>`}

            <!-- Category badge trên ảnh -->
            <div style="position:absolute;top:12px;left:12px">
                <span style="background:${cat.bg};color:${cat.color};
                    padding:4px 10px;border-radius:20px;font-size:0.72rem;
                    font-weight:700;box-shadow:0 2px 6px rgba(0,0,0,0.15)">
                    <i class="fas fa-${cat.icon}"></i> ${cat.label}
                </span>
            </div>

            <!-- Số ảnh nếu có gallery -->
            ${imgCount > 1 ? `
            <div style="position:absolute;bottom:10px;right:10px;
                background:rgba(0,0,0,0.55);color:white;border-radius:12px;
                padding:3px 10px;font-size:0.75rem;font-weight:600">
                <i class="fas fa-images"></i> ${imgCount} ảnh
            </div>` : ''}

            <!-- Admin actions -->
            ${isAdmin ? `
            <div style="position:absolute;top:10px;right:10px;display:flex;gap:5px"
                 onclick="event.stopPropagation()">
                <button onclick="openNewsModal('${item.id}')"
                    style="background:rgba(255,255,255,0.9);border:none;border-radius:8px;
                           padding:5px 8px;cursor:pointer;font-size:0.75rem;color:#1e3a8a;
                           transition:all 0.2s" title="Sửa">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteNews('${item.id}')"
                    style="background:rgba(255,255,255,0.9);border:none;border-radius:8px;
                           padding:5px 8px;cursor:pointer;font-size:0.75rem;color:#dc2626;
                           transition:all 0.2s" title="Xóa">
                    <i class="fas fa-trash"></i>
                </button>
            </div>` : ''}
        </div>

        <!-- Content -->
        <div style="padding:16px">
            <h3 style="margin:0 0 8px;font-size:1rem;color:#1e293b;font-weight:700;
                line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;
                -webkit-box-orient:vertical;overflow:hidden">
                ${item.title || 'Chưa có tiêu đề'}
            </h3>
            <p style="margin:0 0 12px;font-size:0.83rem;color:#64748b;line-height:1.5;
                display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden">
                ${excerpt}
            </p>
            <div style="display:flex;align-items:center;justify-content:space-between;
                font-size:0.75rem;color:#94a3b8;border-top:1px solid #f1f5f9;padding-top:10px">
                <span><i class="fas fa-user-circle" style="margin-right:4px"></i>${item.author||'Admin'}</span>
                <span><i class="fas fa-calendar" style="margin-right:4px"></i>${date}</span>
            </div>
        </div>
    </div>`;
}

// ── Filter ────────────────────────────────────────────────
window.filterNews = function(cat) {
    window._newsCurCat = cat;
    // Update tab active state
    document.querySelectorAll('.news-filter-tab').forEach(btn => {
        const btnCat = btn.dataset.cat;
        if (btnCat === cat) {
            btn.classList.add('active');
            btn.style.background = cat
                ? (NEWS_CATS[cat]?.color || '#1e3a8a')
                : '#1e3a8a';
            btn.style.borderColor = 'transparent';
        } else {
            btn.classList.remove('active');
            btn.style.background = '';
            btn.style.borderColor = '';
        }
    });
    renderNewsGrid(cat);
};

// ══════════════════════════════════════════════════════════════════════════════
// XEM CHI TIẾT BÀI ĐĂNG — Full-page modern news reader
// ══════════════════════════════════════════════════════════════════════════════
window.viewNewsDetail = async function(id) {
    const item = window._newsData?.[id];
    if (!item) return;

    const cat  = NEWS_CATS[item.category] || NEWS_CATS.general;
    const date = item.createdAt
        ? new Date(item.createdAt).toLocaleDateString('vi-VN', {
            weekday:'long', day:'2-digit', month:'long', year:'numeric'
          })
        : '';
    const imgs = item.images || [];

    // Khởi tạo gallery state
    window._galleryIdx     = 0;
    window._galleryImgs    = imgs;
    window._galleryTimer   = null;
    window._galleryPlaying = imgs.length > 1;

    // Tạo overlay full-page
    const overlay = document.createElement('div');
    overlay.id = 'news-reader-overlay';
    overlay.innerHTML = `
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Source+Serif+4:ital,wght@0,300;0,400;0,600;1,400&display=swap');

        #news-reader-overlay {
            position: fixed;
            inset: 0;
            z-index: 9999;
            background: #0f0f0f;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            animation: nrFadeIn 0.35s ease;
        }
        @keyframes nrFadeIn {
            from { opacity:0; transform:scale(0.98); }
            to   { opacity:1; transform:scale(1); }
        }

        /* ── Top bar ── */
        #nr-topbar {
            position: absolute;
            top: 0; left: 0; right: 0;
            z-index: 10;
            padding: 14px 20px;
            display: flex;
            align-items: center;
            gap: 12px;
            background: linear-gradient(to bottom, rgba(0,0,0,0.75) 0%, transparent 100%);
        }
        #nr-close-btn {
            width: 40px; height: 40px;
            border-radius: 50%;
            border: 2px solid rgba(255,255,255,0.4);
            background: rgba(0,0,0,0.5);
            color: white;
            font-size: 1rem;
            cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            transition: all 0.2s;
            backdrop-filter: blur(8px);
            flex-shrink: 0;
        }
        #nr-close-btn:hover { background: rgba(220,38,38,0.7); border-color: #dc2626; transform: scale(1.1); }

        .nr-cat-badge {
            padding: 5px 14px;
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: 700;
            letter-spacing: 0.05em;
            backdrop-filter: blur(8px);
        }

        /* ── Layout: Left gallery | Right content ── */
        #nr-body {
            display: flex;
            height: 100vh;
            overflow: hidden;
        }

        /* ── Gallery panel (left, 60%) ── */
        #nr-gallery-panel {
            position: relative;
            width: 60%;
            flex-shrink: 0;
            background: #000;
            overflow: hidden;
        }

        #nr-main-img {
            width: 100%; height: 100%;
            object-fit: cover;
            transition: opacity 0.5s ease, transform 0.6s ease;
            display: block;
        }
        #nr-main-img.fading { opacity: 0; transform: scale(1.04); }

        /* Gradient overlay on image */
        #nr-img-overlay {
            position: absolute;
            inset: 0;
            background: linear-gradient(
                to right,
                transparent 60%,
                rgba(15,15,15,0.95) 100%
            ), linear-gradient(
                to top,
                rgba(0,0,0,0.6) 0%,
                transparent 40%
            );
            pointer-events: none;
        }

        /* No image placeholder */
        #nr-no-img {
            width: 100%; height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 6rem;
            background: linear-gradient(135deg, ${cat.color}22, ${cat.color}44);
        }

        /* Nav arrows */
        .nr-nav-btn {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            width: 52px; height: 52px;
            border-radius: 50%;
            border: 2px solid rgba(255,255,255,0.3);
            background: rgba(0,0,0,0.45);
            color: white;
            font-size: 1.1rem;
            cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            transition: all 0.2s;
            backdrop-filter: blur(6px);
            z-index: 5;
        }
        .nr-nav-btn:hover { background: rgba(255,255,255,0.2); border-color: white; transform: translateY(-50%) scale(1.1); }
        #nr-prev { left: 16px; }
        #nr-next { right: 16px; }

        /* Progress dots */
        #nr-dots {
            position: absolute;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 8px;
            z-index: 5;
        }
        .nr-dot {
            width: 8px; height: 8px;
            border-radius: 4px;
            background: rgba(255,255,255,0.4);
            cursor: pointer;
            transition: all 0.3s ease;
            border: none;
        }
        .nr-dot.active {
            background: white;
            width: 28px;
        }

        /* Auto-play bar */
        #nr-progress-bar {
            position: absolute;
            bottom: 0; left: 0;
            height: 3px;
            background: ${cat.color};
            width: 0%;
            transition: width linear;
            z-index: 6;
        }

        /* Play/pause button */
        #nr-play-btn {
            position: absolute;
            bottom: 16px; right: 16px;
            width: 36px; height: 36px;
            border-radius: 50%;
            border: 1.5px solid rgba(255,255,255,0.4);
            background: rgba(0,0,0,0.5);
            color: white;
            font-size: 0.8rem;
            cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            transition: all 0.2s;
            backdrop-filter: blur(6px);
            z-index: 5;
        }
        #nr-play-btn:hover { background: rgba(255,255,255,0.2); }

        /* Thumbnail strip */
        #nr-thumbs {
            position: absolute;
            bottom: 52px; left: 0; right: 0;
            display: flex;
            gap: 6px;
            padding: 0 16px;
            overflow-x: auto;
            scrollbar-width: none;
            z-index: 5;
        }
        #nr-thumbs::-webkit-scrollbar { display:none; }
        .nr-thumb {
            width: 60px; height: 44px;
            object-fit: cover;
            border-radius: 5px;
            flex-shrink: 0;
            cursor: pointer;
            opacity: 0.55;
            border: 2px solid transparent;
            transition: all 0.2s;
        }
        .nr-thumb.active { opacity: 1; border-color: white; }
        .nr-thumb:hover { opacity: 0.85; }

        /* ── Content panel (right, 40%) ── */
        #nr-content-panel {
            flex: 1;
            background: #0f0f0f;
            color: #e8e0d5;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            padding: 80px 36px 36px;
        }

        #nr-content-scroll {
            flex: 1;
            overflow-y: auto;
            scrollbar-width: thin;
            scrollbar-color: #333 transparent;
            padding-right: 8px;
        }
        #nr-content-scroll::-webkit-scrollbar { width: 4px; }
        #nr-content-scroll::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }

        .nr-meta {
            font-size: 0.72rem;
            color: #666;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            margin-bottom: 14px;
            display: flex;
            gap: 16px;
            flex-wrap: wrap;
        }

        .nr-title {
            font-family: 'Playfair Display', Georgia, serif;
            font-size: clamp(1.4rem, 2.5vw, 2rem);
            font-weight: 900;
            line-height: 1.25;
            color: #f5f0e8;
            margin: 0 0 20px;
            letter-spacing: -0.01em;
        }

        .nr-divider {
            width: 48px; height: 3px;
            background: ${cat.color};
            border-radius: 2px;
            margin-bottom: 22px;
        }

        .nr-body-text {
            font-family: 'Source Serif 4', Georgia, serif;
            font-size: 0.97rem;
            line-height: 1.9;
            color: #c0b8b0;
            white-space: pre-wrap;
        }

        /* ── Mobile responsive ── */
        @media (max-width: 768px) {
            #nr-body { flex-direction: column; }
            #nr-gallery-panel { width: 100%; height: 55vw; min-height: 220px; flex-shrink: 0; }
            #nr-img-overlay { background: linear-gradient(to bottom, transparent 60%, rgba(15,15,15,0.95) 100%); }
            #nr-content-panel { padding: 20px 20px 24px; }
            .nr-title { font-size: 1.25rem; }
        }
    </style>

    <!-- Top bar -->
    <div id="nr-topbar">
        <button id="nr-close-btn" onclick="closeNewsReader()">
            <i class="fas fa-arrow-left"></i>
        </button>
        <span class="nr-cat-badge"
            style="background:${cat.bg}22;color:${cat.color};border:1px solid ${cat.color}44">
            <i class="fas fa-${cat.icon}"></i> ${cat.label}
        </span>
        <span style="color:rgba(255,255,255,0.45);font-size:0.75rem;margin-left:auto">
            <i class="fas fa-calendar" style="margin-right:5px"></i>${date}
        </span>
    </div>

    <!-- Main body -->
    <div id="nr-body">

        <!-- Gallery panel -->
        <div id="nr-gallery-panel">
            ${imgs.length
                ? `<img id="nr-main-img" src="${imgs[0]}" alt="">`
                : `<div id="nr-no-img"><i class="fas fa-${cat.icon}" style="color:${cat.color}"></i></div>`
            }
            <div id="nr-img-overlay"></div>

            ${imgs.length > 1 ? `
            <button class="nr-nav-btn" id="nr-prev" onclick="_galleryNav(-1)">
                <i class="fas fa-chevron-left"></i>
            </button>
            <button class="nr-nav-btn" id="nr-next" onclick="_galleryNav(1)">
                <i class="fas fa-chevron-right"></i>
            </button>

            <!-- Thumbnails -->
            <div id="nr-thumbs">
                ${imgs.map((url,i) => `
                    <img class="nr-thumb ${i===0?'active':''}" src="${url}"
                        id="nr-thumb-${i}" onclick="_galleryGoTo(${i})"
                        onerror="this.style.display='none'">`
                ).join('')}
            </div>

            <!-- Dots -->
            <div id="nr-dots">
                ${imgs.map((_,i) => `
                    <button class="nr-dot ${i===0?'active':''}" onclick="_galleryGoTo(${i})"></button>
                `).join('')}
            </div>

            <!-- Progress bar -->
            <div id="nr-progress-bar"></div>

            <!-- Play/pause -->
            <button id="nr-play-btn" onclick="_galleryTogglePlay()" title="Tự động chuyển ảnh">
                <i class="fas fa-pause" id="nr-play-icon"></i>
            </button>
            ` : ''}

            ${imgs.length === 1 ? `<div id="nr-progress-bar"></div>` : ''}
        </div>

        <!-- Content panel -->
        <div id="nr-content-panel">
            <div id="nr-content-scroll">
                <div class="nr-meta">
                    <span><i class="fas fa-user-circle" style="margin-right:5px"></i>${item.author||'Admin'}</span>
                    ${imgs.length ? `<span><i class="fas fa-images" style="margin-right:5px"></i>${imgs.length} hình ảnh</span>` : ''}
                </div>
                <h1 class="nr-title">${item.title||''}</h1>
                <div class="nr-divider"></div>
                <div class="nr-body-text">${item.content||''}</div>
            </div>
        </div>

    </div>`;

    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    // Bắt đầu auto-play nếu có nhiều ảnh
    if (imgs.length > 1 && window._galleryPlaying) {
        _galleryStartTimer();
    }

    // Keyboard navigation
    window._newsKeyHandler = (e) => {
        if (e.key === 'Escape')       closeNewsReader();
        if (e.key === 'ArrowLeft')    _galleryNav(-1);
        if (e.key === 'ArrowRight')   _galleryNav(1);
        if (e.key === ' ')            { e.preventDefault(); _galleryTogglePlay(); }
    };
    document.addEventListener('keydown', window._newsKeyHandler);
};

// ── Đóng reader ────────────────────────────────────────
window.closeNewsReader = function() {
    _galleryStopTimer();
    document.removeEventListener('keydown', window._newsKeyHandler);
    const overlay = document.getElementById('news-reader-overlay');
    if (overlay) {
        overlay.style.animation = 'nrFadeIn 0.25s ease reverse';
        setTimeout(() => { overlay.remove(); document.body.style.overflow = ''; }, 230);
    }
};

// ── Auto-play timer ─────────────────────────────────────
function _galleryStartTimer() {
    const DURATION = 4000;
    const bar = document.getElementById('nr-progress-bar');
    if (bar) {
        bar.style.transition = 'none';
        bar.style.width = '0%';
        requestAnimationFrame(() => {
            bar.style.transition = `width ${DURATION}ms linear`;
            bar.style.width = '100%';
        });
    }
    window._galleryTimer = setTimeout(() => {
        if (window._galleryPlaying) {
            _galleryNav(1);
        }
    }, DURATION);
}

function _galleryStopTimer() {
    clearTimeout(window._galleryTimer);
    const bar = document.getElementById('nr-progress-bar');
    if (bar) { bar.style.transition = 'none'; bar.style.width = '0%'; }
}

window._galleryTogglePlay = function() {
    window._galleryPlaying = !window._galleryPlaying;
    const icon = document.getElementById('nr-play-icon');
    if (window._galleryPlaying) {
        if (icon) { icon.className = 'fas fa-pause'; }
        _galleryStartTimer();
    } else {
        if (icon) { icon.className = 'fas fa-play'; }
        _galleryStopTimer();
    }
};

// Gallery navigation
window._galleryNav = function(dir) {
    const imgs = window._galleryImgs || [];
    if (!imgs.length) return;
    _galleryStopTimer();
    window._galleryIdx = (window._galleryIdx + dir + imgs.length) % imgs.length;
    _galleryGoTo(window._galleryIdx);
    if (window._galleryPlaying) _galleryStartTimer();
};

window._galleryGoTo = function(idx) {
    const imgs = window._galleryImgs || [];
    if (!imgs.length) return;
    window._galleryIdx = idx;

    const mainImg = document.getElementById('nr-main-img');
    if (mainImg) {
        mainImg.classList.add('fading');
        setTimeout(() => {
            mainImg.src = imgs[idx];
            mainImg.classList.remove('fading');
        }, 280);
    }

    // Update dots
    document.querySelectorAll('.nr-dot').forEach((d,i) => {
        d.classList.toggle('active', i === idx);
    });

    // Update thumbnails
    document.querySelectorAll('.nr-thumb').forEach((t,i) => {
        t.classList.toggle('active', i === idx);
    });

    // Scroll thumbnail into view
    const activThumb = document.getElementById(`nr-thumb-${idx}`);
    if (activThumb) activThumb.scrollIntoView({ behavior:'smooth', inline:'center', block:'nearest' });
};

// ══════════════════════════════════════════════════════════════════════════════
// MODAL TẠO / SỬA BÀI ĐĂNG
// ══════════════════════════════════════════════════════════════════════════════
window.openNewsModal = async function(editId) {
    if (window.userRole !== 'admin') return;

    let existing = {};
    if (editId) {
        const snap = await window.get(newsRef(editId));
        existing   = snap.val() || {};
    }
    const isEdit   = !!editId;
    const storageEnabled = window.FIREBASE_FEATURES?.storage === true;
    let   previewUrls = [...(existing.images || [])]; // ảnh hiện có
    let   newFiles    = [];   // file mới chọn

    const { value: formData } = await Swal.fire({
        title: isEdit ? '✏️ Sửa bài đăng' : '📝 Đăng tin mới',
        width: '760px',
        html: `
        <div style="text-align:left;font-size:0.88rem">

            <!-- Tiêu đề -->
            <div style="margin-bottom:12px">
                <label style="font-weight:700;color:#374151">Tiêu đề bài đăng *</label>
                <input type="text" id="nw-title" class="form-control"
                    value="${existing.title||''}"
                    placeholder="VD: Tổng kết học kỳ 1 năm học 2025-2026"
                    style="margin-top:5px;font-size:0.95rem;font-weight:600">
            </div>

            <!-- Danh mục -->
            <div style="margin-bottom:12px">
                <label style="font-weight:700;color:#374151">Danh mục *</label>
                <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px" id="nw-cat-group">
                    ${Object.entries(NEWS_CATS).map(([k,v]) => `
                    <label style="cursor:pointer;display:flex;align-items:center;gap:5px;
                        padding:6px 12px;border-radius:20px;border:2px solid #e2e8f0;
                        transition:all 0.2s" id="nw-cat-lbl-${k}">
                        <input type="radio" name="nw-cat" value="${k}"
                            ${(existing.category||'general')===k?'checked':''}
                            onchange="_updateCatStyle()"
                            style="display:none">
                        <i class="fas fa-${v.icon}" style="color:${v.color}"></i>
                        <span style="font-size:0.8rem;font-weight:600">${v.label}</span>
                    </label>`).join('')}
                </div>
            </div>

            <!-- Upload ảnh -->
            <div style="margin-bottom:12px">
                <label style="font-weight:700;color:#374151">Hình ảnh</label>
                <div id="nw-drop-zone"
                    style="border:2px dashed #cbd5e1;border-radius:10px;padding:20px;
                           text-align:center;cursor:pointer;margin-top:6px;
                           transition:all 0.2s;background:#f8fafc"
                    onclick="document.getElementById('nw-file-input').click()"
                    ondragover="event.preventDefault();this.style.borderColor='#2563eb';this.style.background='#eff6ff'"
                    ondragleave="this.style.borderColor='#cbd5e1';this.style.background='#f8fafc'"
                    ondrop="_handleNewsDrop(event)">
                    <i class="fas fa-cloud-upload-alt"
                        style="font-size:2rem;color:#94a3b8;margin-bottom:8px;display:block"></i>
                    <p style="color:#64748b;margin:0;font-size:0.85rem">
                        Kéo thả ảnh vào đây hoặc <span style="color:#2563eb;font-weight:600">click để chọn</span>
                    </p>
                    <p style="color:#94a3b8;font-size:0.75rem;margin:4px 0 0">
                        PNG, JPG, WEBP — tối đa 5MB/ảnh — nhiều ảnh cùng lúc
                    </p>
                </div>
                <input type="file" id="nw-file-input" multiple accept="image/*"
                    style="display:none" onchange="_handleNewsFileSelect(this)">

                <!-- Preview grid -->
                <div id="nw-preview-grid"
                    style="display:grid;grid-template-columns:repeat(auto-fill,minmax(90px,1fr));
                           gap:8px;margin-top:10px"></div>
            </div>

            <!-- Nội dung -->
            <div style="margin-bottom:12px">
                <label style="font-weight:700;color:#374151">Nội dung bài đăng *</label>
                <textarea id="nw-content" class="form-control" rows="7"
                    placeholder="Viết nội dung chi tiết về tin tức, sự kiện, hoạt động..."
                    style="margin-top:5px;resize:vertical;line-height:1.7;font-size:0.88rem"
                >${existing.content||''}</textarea>
                <div style="text-align:right;font-size:0.72rem;color:#94a3b8;margin-top:3px">
                    <span id="nw-char-count">0</span> ký tự
                </div>
            </div>
        </div>`,

        showCancelButton:   true,
        confirmButtonText:  isEdit
            ? '<i class="fas fa-save"></i> Cập nhật'
            : '<i class="fas fa-paper-plane"></i> Đăng ngay',
        cancelButtonText:   'Hủy',
        confirmButtonColor: '#1e3a8a',

        didOpen: () => {
            // Char counter
            const ta = document.getElementById('nw-content');
            const cc = document.getElementById('nw-char-count');
            if (ta && cc) {
                cc.textContent = ta.value.length;
                ta.addEventListener('input', () => cc.textContent = ta.value.length);
            }
            // Init cat style
            window._updateCatStyle();
            if (!storageEnabled) {
                const zone = document.getElementById('nw-drop-zone');
                const input = document.getElementById('nw-file-input');
                if (input) input.disabled = true;
                if (zone) {
                    zone.onclick = null;
                    zone.ondragover = null;
                    zone.ondragleave = null;
                    zone.ondrop = null;
                    zone.style.cursor = 'not-allowed';
                    zone.style.borderColor = '#f59e0b';
                    zone.style.background = '#fffbeb';
                    zone.innerHTML = `
                        <i class="fas fa-info-circle" style="font-size:1.4rem;color:#d97706;margin-bottom:8px;display:block"></i>
                        <p style="color:#92400e;margin:0;font-size:0.85rem;font-weight:700">Không tải ảnh mới trong gói Firebase Spark</p>
                        <p style="color:#a16207;font-size:0.75rem;margin:4px 0 0">Bài viết văn bản và các ảnh đã có vẫn được giữ nguyên.</p>`;
                }
            }
            // Render existing images
            _renderNewsPreview(previewUrls, newFiles);
        },

        preConfirm: () => {
            const title   = document.getElementById('nw-title')?.value.trim();
            const content = document.getElementById('nw-content')?.value.trim();
            const cat     = document.querySelector('[name="nw-cat"]:checked')?.value || 'general';
            if (!title)   { Swal.showValidationMessage('Vui lòng nhập tiêu đề'); return false; }
            if (!content) { Swal.showValidationMessage('Vui lòng nhập nội dung'); return false; }
            return { title, content, category: cat };
        }
    });

    if (!formData) return;

    try {
        Swal.fire({
            title: newFiles.length
                ? `<i class="fas fa-cloud-upload-alt"></i> Đang upload ${newFiles.length} ảnh...`
                : '<i class="fas fa-save"></i> Đang lưu...',
            html: newFiles.length
                ? `<div style="background:#e2e8f0;border-radius:8px;height:8px;overflow:hidden;margin-top:10px">
                       <div id="upload-progress-bar" style="background:#2563eb;width:0%;height:100%;
                           border-radius:8px;transition:width 0.3s"></div>
                   </div>
                   <p id="upload-progress-text" style="font-size:0.83rem;color:#64748b;margin-top:8px">0 / ${newFiles.length}</p>`
                : '',
            allowOutsideClick: false,
            showConfirmButton: false,
        });

        // Tạo hoặc lấy ID bài đăng
        const postId = editId || window.push(newsRef()).key;

        // Upload ảnh mới
        const uploadedUrls = [];
        for (let i = 0; i < newFiles.length; i++) {
            const url = await uploadImage(newFiles[i], postId, i);
            uploadedUrls.push(url);
            // Update progress
            const pct  = Math.round((i+1)/newFiles.length*100);
            const bar  = document.getElementById('upload-progress-bar');
            const txt  = document.getElementById('upload-progress-text');
            if (bar) bar.style.width = pct + '%';
            if (txt) txt.textContent = `${i+1} / ${newFiles.length}`;
        }

        // Ghép ảnh cũ + mới
        const allImages = [...previewUrls, ...uploadedUrls];

        const saveData = {
            ...formData,
            id:        postId,
            images:    allImages,
            author:    window.currentUser?.email || 'admin',
            updatedAt: Date.now(),
            ...(isEdit ? {} : { createdAt: Date.now() }),
        };

        await window.set(newsRef(postId), saveData);

        const cat2 = NEWS_CATS[formData.category] || NEWS_CATS.general;
        Swal.fire({
            icon:  'success',
            title: isEdit ? '✅ Đã cập nhật!' : '🎉 Đăng tin thành công!',
            html:  `<div style="text-align:left;font-size:0.9rem">
                <div style="background:${cat2.bg};border-radius:8px;padding:10px 14px">
                    <p style="font-weight:700;color:${cat2.color}">
                        <i class="fas fa-${cat2.icon}"></i> ${formData.title}
                    </p>
                </div>
                ${allImages.length ? `<p style="margin-top:8px;color:#64748b">📷 ${allImages.length} ảnh</p>` : ''}
            </div>`,
            timer: 2500, showConfirmButton: false,
        });

        // Reload grid
        await loadNewsGrid(window._newsCurCat || '');

    } catch(err) {
        Swal.fire('Lỗi', err.message, 'error');
    }
};

// ── Helpers cho file upload ───────────────────────────────
window._handleNewsFileSelect = function(input) {
    if (window.FIREBASE_FEATURES?.storage !== true) return;
    const files = Array.from(input.files);
    _addNewsFiles(files);
    input.value = '';
};

window._handleNewsDrop = function(event) {
    event.preventDefault();
    if (window.FIREBASE_FEATURES?.storage !== true) return;
    const dz = document.getElementById('nw-drop-zone');
    if (dz) { dz.style.borderColor='#cbd5e1'; dz.style.background='#f8fafc'; }
    const files = Array.from(event.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    _addNewsFiles(files);
};

// newFiles là biến closure từ openNewsModal
function _addNewsFiles(files) {
    if (window.FIREBASE_FEATURES?.storage !== true) return;
    // Gán vào closure scope qua window temp
    if (!window._newsNewFiles) window._newsNewFiles = [];
    const valid = files.filter(f => f.size <= 5*1024*1024);
    if (valid.length < files.length)
        Swal.fire({ icon:'warning', title:'Có ảnh vượt 5MB', text:'Các ảnh khác vẫn được thêm', timer:2000, showConfirmButton:false });
    window._newsNewFiles.push(...valid);
    // Re-read closure refs
    const grid = document.getElementById('nw-preview-grid');
    if (grid) _renderNewsPreviewDOM(window._newsExistingUrls||[], window._newsNewFiles);
}

function _renderNewsPreview(existingUrls, newFiles) {
    window._newsExistingUrls = existingUrls;
    window._newsNewFiles     = newFiles;
    _renderNewsPreviewDOM(existingUrls, newFiles);
}

function _renderNewsPreviewDOM(existingUrls, newFiles) {
    const grid = document.getElementById('nw-preview-grid');
    if (!grid) return;

    let html = '';
    existingUrls.forEach((url, i) => {
        html += `
        <div style="position:relative;border-radius:8px;overflow:hidden;aspect-ratio:1">
            <img src="${url}" style="width:100%;height:100%;object-fit:cover">
            <button onclick="_removeExistingImg(${i})"
                style="position:absolute;top:4px;right:4px;background:rgba(220,38,38,0.85);
                    border:none;border-radius:50%;width:22px;height:22px;cursor:pointer;
                    color:white;font-size:0.7rem;display:flex;align-items:center;justify-content:center">
                <i class="fas fa-times"></i>
            </button>
        </div>`;
    });

    newFiles.forEach((file, i) => {
        const objUrl = URL.createObjectURL(file);
        html += `
        <div style="position:relative;border-radius:8px;overflow:hidden;aspect-ratio:1;
                    border:2px solid #2563eb">
            <img src="${objUrl}" style="width:100%;height:100%;object-fit:cover">
            <div style="position:absolute;bottom:0;left:0;right:0;background:rgba(37,99,235,0.8);
                color:white;font-size:0.65rem;padding:2px 4px;text-align:center">Mới</div>
            <button onclick="_removeNewImg(${i})"
                style="position:absolute;top:4px;right:4px;background:rgba(220,38,38,0.85);
                    border:none;border-radius:50%;width:22px;height:22px;cursor:pointer;
                    color:white;font-size:0.7rem;display:flex;align-items:center;justify-content:center">
                <i class="fas fa-times"></i>
            </button>
        </div>`;
    });

    grid.innerHTML = html ||
        `<p style="color:#94a3b8;font-size:0.82rem;grid-column:1/-1">Chưa có ảnh nào</p>`;
}

window._removeExistingImg = function(idx) {
    window._newsExistingUrls.splice(idx, 1);
    _renderNewsPreviewDOM(window._newsExistingUrls, window._newsNewFiles||[]);
};
window._removeNewImg = function(idx) {
    window._newsNewFiles.splice(idx, 1);
    _renderNewsPreviewDOM(window._newsExistingUrls||[], window._newsNewFiles);
};

// Update category label style
window._updateCatStyle = function() {
    const selected = document.querySelector('[name="nw-cat"]:checked')?.value;
    Object.entries(NEWS_CATS).forEach(([k,v]) => {
        const lbl = document.getElementById(`nw-cat-lbl-${k}`);
        if (!lbl) return;
        if (k === selected) {
            lbl.style.borderColor   = v.color;
            lbl.style.background    = v.bg;
            lbl.style.color         = v.color;
        } else {
            lbl.style.borderColor   = '#e2e8f0';
            lbl.style.background    = 'white';
            lbl.style.color         = '#374151';
        }
    });
};

// ── Xóa bài đăng ────────────────────────────────────────
window.deleteNews = async function(id) {
    const result = await Swal.fire({
        title:  'Xóa bài đăng?',
        text:   'Toàn bộ nội dung và hình ảnh sẽ bị xóa vĩnh viễn.',
        icon:   'warning',
        showCancelButton:   true,
        confirmButtonText:  'Xóa',
        cancelButtonText:   'Hủy',
        confirmButtonColor: '#dc2626',
    });
    if (!result.isConfirmed) return;
    try {
        await window.remove(newsRef(id));
        // Xóa khỏi local cache
        if (window._newsData) delete window._newsData[id];
        renderNewsGrid(window._newsCurCat || '');
        Swal.fire({ icon:'success', title:'Đã xóa!', timer:1500, showConfirmButton:false });
    } catch(err) {
        Swal.fire('Lỗi', err.message, 'error');
    }
};
