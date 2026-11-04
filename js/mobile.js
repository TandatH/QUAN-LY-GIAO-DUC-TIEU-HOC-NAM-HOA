// ══════════════════════════════════════════════════════════════════════════════
// mobile.js — Smart School V5.35.0 Universal Mobile Responsive Engine
// Tối ưu giao diện hoàn chỉnh cho mọi loại điện thoại (iOS Safari, Android Chrome, Foldables, Tablets)
// ══════════════════════════════════════════════════════════════════════════════

console.info('[Smart School V5.35.0] Universal Mobile Responsive Engine loaded');

function ensureViewport() {
    let meta = document.querySelector('meta[name="viewport"]');
    if (!meta) {
        meta = document.createElement('meta');
        meta.name = 'viewport';
        document.head.appendChild(meta);
    }
    meta.content = 'width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover';
}

function injectMobileCss() {
    const existing = document.getElementById('smart-mobile-v535');
    if (existing) existing.remove();

    const style = document.createElement('style');
    style.id = 'smart-mobile-v535';
    style.textContent = `
:root {
    --mobile-safe-top: env(safe-area-inset-top, 0px);
    --mobile-safe-bottom: env(safe-area-inset-bottom, 0px);
    --mobile-safe-left: env(safe-area-inset-left, 0px);
    --mobile-safe-right: env(safe-area-inset-right, 0px);
}

.smart-mobile-toggle, .smart-mobile-backdrop, .smart-topbar-menu-btn { display: none; }

/* ══════════════════════════════════════════════════════════════════════
   RESPONSIVE CHO TẤT CẢ MÀN HÌNH ĐIỆN THOẠI & TABLET (<= 820px)
   ══════════════════════════════════════════════════════════════════════ */
@media (max-width: 820px) {
    *, *::before, *::after {
        -webkit-tap-highlight-color: transparent;
    }

    html, body {
        width: 100%;
        max-width: 100%;
        overflow-x: hidden;
        -webkit-text-size-adjust: 100%;
    }

    body {
        background: #f1f5f9;
    }

    #app-container {
        min-height: 100dvh;
        width: 100% !important;
        flex-direction: column !important;
    }

    /* ── SIDEBAR DRAWER TRÊN ĐIỆN THOẠI ── */
    .smart-sidebar, #sidebar, .sidebar, aside {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        bottom: 0 !important;
        width: min(85vw, 300px) !important;
        max-width: 300px !important;
        height: 100dvh !important;
        max-height: 100dvh !important;
        z-index: 10002 !important;
        transform: translateX(-105%) !important;
        transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
        overflow: hidden !important;
        box-shadow: 10px 0 30px rgba(15, 23, 42, 0.35) !important;
        display: flex !important;
        flex-direction: column !important;
        background: #0f172a !important;
        box-sizing: border-box !important;
    }

    body.smart-mobile-menu-open .smart-sidebar,
    body.smart-mobile-menu-open #sidebar,
    body.smart-mobile-menu-open .sidebar,
    body.smart-mobile-menu-open aside {
        transform: translateX(0) !important;
    }

    /* Header trong Drawer */
    .sidebar .brand, #sidebar .brand, .smart-sidebar .brand, aside .brand {
        flex-shrink: 0 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
        padding: 1rem 1.25rem !important;
        padding-top: max(1rem, var(--mobile-safe-top)) !important;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
        font-size: 1.15rem !important;
        color: #fff !important;
        margin: 0 !important;
    }

    .smart-sidebar-close-btn {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        width: 34px !important;
        height: 34px !important;
        border: 0 !important;
        border-radius: 8px !important;
        background: rgba(255, 255, 255, 0.1) !important;
        color: #e2e8f0 !important;
        font-size: 1.1rem !important;
        cursor: pointer !important;
        transition: background 0.2s ease !important;
    }
    .smart-sidebar-close-btn:active {
        background: rgba(255, 255, 255, 0.22) !important;
    }

    /* Menu dọc trong Drawer - cuộn nội bộ mượt mà */
    .sidebar .menu, #sidebar .menu, .smart-sidebar .menu, aside .menu, #main-menu {
        display: flex !important;
        flex-direction: column !important;
        flex: 1 1 0% !important;
        min-height: 0 !important;
        max-height: none !important;
        overflow-y: auto !important;
        overflow-x: hidden !important;
        -webkit-overflow-scrolling: touch !important;
        padding: 0.75rem 0.5rem !important;
        gap: 4px !important;
    }

    .menu-item {
        min-height: 44px !important;
        padding: 10px 14px !important;
        display: flex !important;
        align-items: center !important;
        gap: 12px !important;
        font-size: 0.92rem !important;
        border-radius: 10px !important;
        white-space: normal !important;
    }

    /* Footer Đăng xuất ghim chặt dưới đáy Drawer */
    .sidebar-footer,
    .sidebar > div:last-child,
    #sidebar > div:last-child,
    .smart-sidebar > div:last-child,
    aside > div:last-child {
        flex-shrink: 0 !important;
        margin-top: auto !important;
        padding: 10px 14px calc(12px + var(--mobile-safe-bottom)) !important;
        background: #090d16 !important;
        border-top: 1px solid rgba(255, 255, 255, 0.12) !important;
        position: relative !important;
        z-index: 10 !important;
    }

    .sidebar-footer .btn,
    .sidebar-footer .btn-danger,
    .btn-sidebar-logout,
    .sidebar > div:last-child .btn,
    #sidebar > div:last-child .btn,
    .smart-sidebar > div:last-child .btn,
    aside > div:last-child .btn {
        width: 100% !important;
        min-height: 44px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 8px !important;
        font-size: 0.95rem !important;
        font-weight: 600 !important;
        border-radius: 10px !important;
        background: #dc2626 !important;
        color: #ffffff !important;
        border: none !important;
        box-shadow: 0 4px 12px rgba(220, 38, 38, 0.35) !important;
        cursor: pointer !important;
    }
    .sidebar-footer .btn:active,
    .btn-sidebar-logout:active {
        background: #b91c1c !important;
    }

    .smart-mobile-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.48);
        backdrop-filter: blur(3px);
        z-index: 10001;
        transition: opacity 0.22s ease;
    }

    body.smart-mobile-menu-open .smart-mobile-backdrop {
        display: block;
    }

    /* Nút Hamburger trong Top Bar */
    .smart-topbar-menu-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 42px;
        height: 42px;
        border: 0;
        border-radius: 10px;
        background: #f1f5f9;
        color: #1e293b;
        font-size: 1.2rem;
        cursor: pointer;
        flex-shrink: 0;
        box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    }
    .smart-topbar-menu-btn:active {
        background: #e2e8f0;
    }

    /* Nút Menu nổi ở góc dưới trái */
    .smart-mobile-toggle {
        display: none;
        position: fixed;
        left: 14px;
        bottom: calc(14px + var(--mobile-safe-bottom));
        z-index: 10003;
        width: 48px;
        height: 48px;
        border: 0;
        border-radius: 999px;
        align-items: center;
        justify-content: center;
        background: #1e3a8a;
        color: white;
        box-shadow: 0 8px 24px rgba(30, 58, 138, 0.4);
        font-size: 1.15rem;
    }
    body.smart-mobile-authenticated .smart-mobile-toggle {
        display: inline-flex;
    }
    /* Ẩn nút nổi khi Drawer đang mở để tránh đè lên nút Đăng xuất */
    body.smart-mobile-menu-open .smart-mobile-toggle {
        display: none !important;
        pointer-events: none !important;
    }

    /* ── HEADER & TOP BAR ── */
    header, .top-bar, .topbar, .header, .page-header {
        position: sticky !important;
        top: 0 !important;
        z-index: 500 !important;
        padding-top: max(8px, var(--mobile-safe-top)) !important;
        padding-bottom: 8px !important;
        padding-left: max(10px, var(--mobile-safe-left)) !important;
        padding-right: max(10px, var(--mobile-safe-right)) !important;
        gap: 8px !important;
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
        background: rgba(255, 255, 255, 0.97) !important;
        backdrop-filter: blur(12px) !important;
        border-bottom: 1px solid rgba(226, 232, 240, 0.9) !important;
    }

    #page-title {
        font-size: 1.05rem !important;
        font-weight: 700 !important;
        line-height: 1.25 !important;
        margin: 0 !important;
        flex: 1 1 auto !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        white-space: nowrap !important;
    }

    .topbar-right {
        display: flex !important;
        align-items: center !important;
        gap: 8px !important;
        flex-shrink: 0 !important;
    }

    #user-info {
        font-size: 0.8rem !important;
        max-width: 130px !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        white-space: nowrap !important;
    }

    /* Nút Đăng xuất trên Topbar */
    .smart-topbar-logout-btn, .topbar-logout-btn {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 5px !important;
        padding: 6px 10px !important;
        min-height: 36px !important;
        font-size: 0.82rem !important;
        font-weight: 600 !important;
        border-radius: 8px !important;
        color: #dc2626 !important;
        background: #fef2f2 !important;
        border: 1px solid #fca5a5 !important;
        cursor: pointer !important;
        flex-shrink: 0 !important;
        transition: all 0.2s ease !important;
    }
    .smart-topbar-logout-btn:hover, .topbar-logout-btn:hover {
        background: #fee2e2 !important;
        border-color: #f87171 !important;
    }
    .smart-topbar-logout-btn:active, .topbar-logout-btn:active {
        background: #fecaca !important;
    }

    /* ── MAIN CONTENT AREA ── */
    .main, .main-content, #main-content, .content, .content-area, .page-content {
        margin-left: 0 !important;
        width: 100% !important;
        max-width: 100% !important;
        padding: 0 !important;
        box-sizing: border-box !important;
    }

    #content {
        padding: 10px 10px calc(14px + var(--mobile-safe-bottom)) !important;
        width: 100% !important;
        max-width: 100vw !important;
        box-sizing: border-box !important;
    }

    /* ── CARDS & GRIDS ── */
    .card, .stat-card, .news-card {
        border-radius: 14px !important;
        padding: 14px !important;
        margin-bottom: 10px !important;
        width: 100% !important;
        max-width: 100% !important;
        box-sizing: border-box !important;
    }

    .dashboard-grid, .stats-grid, .grid, .grid-4, .grid-3, .grid-2,
    [style*="grid-template-columns"] {
        grid-template-columns: 1fr !important;
        gap: 10px !important;
    }

    /* ── FORM CONTROLS & CHỐNG ZOOM IOS SAFARI ── */
    input, select, textarea, .form-control, .custom-select, .auth-inp {
        min-height: 44px !important;
        font-size: 16px !important;
        border-radius: 10px !important;
        max-width: 100% !important;
        box-sizing: border-box !important;
    }

    textarea {
        min-height: 84px !important;
    }

    .btn {
        min-height: 42px !important;
        padding: 8px 14px !important;
        border-radius: 10px !important;
        font-size: 0.88rem !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 6px !important;
        box-sizing: border-box !important;
    }

    /* ── TOOLBARS & BỘ LỌC ── */
    .filter-bar, .score-toolbar, .timetable-toolbar, .attendance-toolbar,
    .student-filter-bar, #content > div[style*="display:flex"],
    #content > div[style*="display: flex"] {
        display: flex !important;
        flex-wrap: wrap !important;
        gap: 8px !important;
        align-items: stretch !important;
        width: 100% !important;
        margin-bottom: 12px !important;
    }

    .filter-bar select, .filter-bar input,
    .score-toolbar select, .score-toolbar input,
    .student-filter-bar select, .student-filter-bar input {
        flex: 1 1 130px !important;
        width: auto !important;
        min-width: 0 !important;
    }

    .search-box-wrap {
        width: 100% !important;
        flex: 1 1 100% !important;
    }

    /* ── BẢNG DỮ LIỆU CUỘN NGANG MƯỢT MÀ ── */
    .table-wrapper, .table-responsive {
        width: 100% !important;
        max-width: 100% !important;
        overflow-x: auto !important;
        -webkit-overflow-scrolling: touch;
        touch-action: pan-x pan-y;
        border-radius: 12px !important;
        margin-bottom: 12px !important;
        background: #ffffff;
        box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }

    table {
        min-width: 680px;
        font-size: 0.84rem !important;
        border-collapse: separate !important;
        border-spacing: 0 !important;
    }

    th, td {
        padding: 8px 10px !important;
        vertical-align: middle !important;
    }

    thead th {
        position: sticky !important;
        top: 0 !important;
        z-index: 4 !important;
        background: #f8fafc !important;
    }

    /* Cố định cột thao tác/sửa ở bảng điểm */
    #content[data-view="scores"] th:last-child,
    #content[data-view="scores"] td:last-child {
        position: sticky !important;
        right: 0 !important;
        background: #fff !important;
        z-index: 5 !important;
        box-shadow: -4px 0 8px rgba(15,23,42,.06);
    }

    /* ── CUSTOM MODAL (.modal) TRÊN ĐIỆN THOẠI ── */
    .modal {
        padding: max(6px, var(--mobile-safe-top)) max(6px, var(--mobile-safe-right)) max(6px, var(--mobile-safe-bottom)) max(6px, var(--mobile-safe-left)) !important;
        box-sizing: border-box !important;
    }

    .modal-content {
        width: 100% !important;
        max-width: 100% !important;
        max-height: calc(100dvh - 12px) !important;
        margin: 0 !important;
        border-radius: 16px !important;
        display: flex !important;
        flex-direction: column !important;
        overflow: hidden !important;
    }

    .modal-header {
        flex: 0 0 auto !important;
        padding: 12px 14px !important;
    }

    .modal-header h3 {
        font-size: 1.05rem !important;
        margin: 0 !important;
    }

    .modal-body {
        flex: 1 1 auto !important;
        overflow-y: auto !important;
        -webkit-overflow-scrolling: touch;
        padding: 14px !important;
    }

    .modal-body .form-grid {
        grid-template-columns: 1fr !important;
        gap: 10px !important;
    }

    /* ── SWEETALERT2 POPUPS TRÊN ĐIỆN THOẠI ── */
    .swal2-container {
        padding: 8px !important;
    }

    .swal2-popup {
        width: min(calc(100vw - 16px), 480px) !important;
        max-width: calc(100vw - 16px) !important;
        border-radius: 18px !important;
        padding: 12px !important;
        box-sizing: border-box !important;
    }

    .swal2-html-container {
        margin: 0.5rem 0 0 !important;
        max-height: 72dvh !important;
        overflow-y: auto !important;
        -webkit-overflow-scrolling: touch;
        padding: 0 2px !important;
    }

    .swal2-actions {
        gap: 8px !important;
        flex-wrap: wrap !important;
        width: 100% !important;
        margin: 12px 0 0 !important;
    }

    .swal2-actions .swal2-confirm,
    .swal2-actions .swal2-cancel,
    .swal2-actions .swal2-deny {
        flex: 1 1 120px !important;
        min-height: 44px !important;
        font-size: 0.92rem !important;
        margin: 0 !important;
        border-radius: 10px !important;
    }

    /* Popup nhập điểm / GHK / Học bạ: toàn màn hình trên điện thoại */
    .swal2-popup:has(#score-form),
    .swal2-popup:has(#ghk-modal-wrap),
    .swal2-popup:has([id^="ghk-panel-"]),
    .swal2-popup:has(.score-input-table),
    .swal2-popup.smart-score-popup {
        width: 100vw !important;
        max-width: 100vw !important;
        height: 100dvh !important;
        max-height: 100dvh !important;
        margin: 0 !important;
        padding: 8px !important;
        border-radius: 0 !important;
        display: flex !important;
        flex-direction: column !important;
        overflow: hidden !important;
    }

    .swal2-popup:has(#score-form) .swal2-html-container,
    .swal2-popup:has(#ghk-modal-wrap) .swal2-html-container,
    .swal2-popup:has([id^="ghk-panel-"]) .swal2-html-container,
    .swal2-popup:has(.score-input-table) .swal2-html-container,
    .swal2-popup.smart-score-popup .swal2-html-container {
        flex: 1 1 auto !important;
        min-height: 0 !important;
        max-height: none !important;
        overflow: hidden !important;
        margin: 0 !important;
        padding: 0 !important;
        display: flex !important;
        flex-direction: column !important;
    }

    .swal2-popup:has(#score-form) .swal2-actions,
    .swal2-popup:has(#ghk-modal-wrap) .swal2-actions,
    .swal2-popup.smart-score-popup .swal2-actions {
        flex: 0 0 auto !important;
        position: sticky !important;
        bottom: 0 !important;
        background: #fff !important;
        z-index: 30 !important;
        margin: 0 !important;
        padding: 8px 0 calc(8px + var(--mobile-safe-bottom)) !important;
        box-shadow: 0 -6px 16px rgba(15,23,42,.08);
    }

    /* Form GHK / Nhập điểm: tab cuộn ngang mượt mà */
    #ghk-modal-wrap {
        height: 100% !important;
        min-height: 0 !important;
        display: flex !important;
        flex-direction: column !important;
        overflow: hidden !important;
        font-size: 0.86rem !important;
    }

    #ghk-modal-wrap > div[style*="gap"],
    #ghk-modal-wrap .ghk-tabs,
    #ghk-modal-wrap .tabs {
        flex: 0 0 auto !important;
        display: flex !important;
        gap: 6px !important;
        overflow-x: auto !important;
        -webkit-overflow-scrolling: touch;
        padding-bottom: 4px !important;
        margin-bottom: 6px !important;
        white-space: nowrap !important;
    }

    #ghk-panel-mon, #ghk-panel-pc, #ghk-panel-nlc, #ghk-panel-nld,
    #score-form, .score-form-wrapper, .score-input-wrapper {
        flex: 1 1 auto !important;
        min-height: 0 !important;
        max-height: none !important;
        overflow: auto !important;
        -webkit-overflow-scrolling: touch;
    }

    /* ── AUTH SCREEN ── */
    #auth-screen {
        min-height: 100dvh !important;
        width: 100vw !important;
        padding: 16px !important;
        box-sizing: border-box !important;
    }

    .auth-card {
        width: 100% !important;
        max-width: 420px !important;
        padding: 24px 18px !important;
        border-radius: 20px !important;
    }

    .btn-auth {
        min-height: 46px !important;
    }

    /* ── THỜI KHÓA BIỂU TRÊN ĐIỆN THOẠI ── */
    .timetable-container {
        overflow-x: auto !important;
        -webkit-overflow-scrolling: touch;
        padding: 8px !important;
    }
    .timetable-grid {
        min-width: 540px !important;
    }
    .grade-tabs {
        display: flex !important;
        flex-wrap: wrap !important;
        gap: 6px !important;
    }
}

/* ══════════════════════════════════════════════════════════════════════
   ĐIỆN THOẠI MÀN HÌNH NHỎ (<= 480px, vd: iPhone SE, 13 mini, Galaxy A)
   ══════════════════════════════════════════════════════════════════════ */
@media (max-width: 480px) {
    table {
        min-width: 620px;
        font-size: 0.8rem !important;
    }
    .btn {
        padding: 6px 10px !important;
        font-size: 0.84rem !important;
    }
    .smart-logout-text, .topbar-logout-text {
        display: none !important;
    }
    .smart-topbar-logout-btn, .topbar-logout-btn {
        width: 36px !important;
        height: 36px !important;
        min-height: 36px !important;
        padding: 0 !important;
        border-radius: 8px !important;
        font-size: 0.95rem !important;
    }
    #user-info {
        display: none !important;
    }
    #ghk-panel-mon th:first-child,
    #ghk-panel-mon td:first-child,
    #ghk-panel-pc th:first-child,
    #ghk-panel-pc td:first-child,
    #ghk-panel-nlc th:first-child,
    #ghk-panel-nlc td:first-child,
    #ghk-panel-nld th:first-child,
    #ghk-panel-nld td:first-child {
        min-width: 120px !important;
        max-width: 140px !important;
    }
}
`;
    document.head.appendChild(style);
}

function findSidebar() {
    const mainMenu = document.getElementById('main-menu');
    if (mainMenu) {
        const sidebar = mainMenu.closest('aside, nav, .sidebar, #sidebar, .side-menu, .left-panel') || mainMenu.parentElement;
        if (sidebar) {
            sidebar.classList.add('smart-sidebar');
            return sidebar;
        }
    }
    const fallback = document.querySelector('#sidebar, .sidebar, aside, nav');
    if (fallback) fallback.classList.add('smart-sidebar');
    return fallback;
}

function setMobileAuthenticated(isAuthenticated) {
    document.body.classList.toggle('smart-mobile-authenticated', !!isAuthenticated);
    if (!isAuthenticated) document.body.classList.remove('smart-mobile-menu-open');
}

window.setSmartMobileAuthenticated = setMobileAuthenticated;

function ensureMobileControls() {
    setMobileAuthenticated(!!window.currentUser || !!window.IS_DEMO_MODE);

    // 1. Backdrop
    if (!document.querySelector('.smart-mobile-backdrop')) {
        const backdrop = document.createElement('div');
        backdrop.className = 'smart-mobile-backdrop';
        backdrop.addEventListener('click', () => document.body.classList.remove('smart-mobile-menu-open'));
        document.body.appendChild(backdrop);
    }

    // 2. Nút menu nổi ở góc dưới
    if (!document.querySelector('.smart-mobile-toggle')) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'smart-mobile-toggle';
        btn.setAttribute('aria-label', 'Mở menu');
        btn.innerHTML = '<i class="fas fa-bars"></i>';
        btn.addEventListener('click', () => {
            findSidebar();
            ensureSidebarStructure();
            document.body.classList.toggle('smart-mobile-menu-open');
        });
        document.body.appendChild(btn);
    }

    // 3. Nút menu trực tiếp trong Top Bar (Header)
    ensureTopBarMenuButton();

    // 4. Nút Đăng xuất trên Top Bar (Header)
    ensureTopBarLogoutButton();

    // 5. Cấu trúc Sidebar & Nút đóng
    ensureSidebarStructure();
}

function ensureTopBarMenuButton() {
    const topBar = document.querySelector('.top-bar, .topbar, header, .page-header');
    if (!topBar) return;

    if (!topBar.querySelector('.smart-topbar-menu-btn')) {
        const menuBtn = document.createElement('button');
        menuBtn.type = 'button';
        menuBtn.id = 'smart-topbar-menu-btn';
        menuBtn.className = 'smart-topbar-menu-btn';
        menuBtn.setAttribute('aria-label', 'Mở menu điều hướng');
        menuBtn.innerHTML = '<i class="fas fa-bars"></i>';
        menuBtn.addEventListener('click', () => {
            findSidebar();
            ensureSidebarStructure();
            document.body.classList.toggle('smart-mobile-menu-open');
        });
        topBar.insertBefore(menuBtn, topBar.firstChild);
    }
}

function ensureTopBarLogoutButton() {
    const topBar = document.querySelector('.top-bar, .topbar, header, .page-header');
    if (!topBar) return;

    let rightSection = topBar.querySelector('.topbar-right, .top-bar-right');
    if (!rightSection) {
        const userInfo = topBar.querySelector('#user-info');
        if (userInfo && userInfo.parentElement && userInfo.parentElement !== topBar) {
            rightSection = userInfo.parentElement;
            rightSection.classList.add('topbar-right');
        } else {
            rightSection = document.createElement('div');
            rightSection.className = 'topbar-right';
            if (userInfo) {
                topBar.insertBefore(rightSection, userInfo);
                rightSection.appendChild(userInfo);
            } else {
                topBar.appendChild(rightSection);
            }
        }
    }

    if (!topBar.querySelector('.smart-topbar-logout-btn') && !topBar.querySelector('.topbar-logout-btn')) {
        const logoutBtn = document.createElement('button');
        logoutBtn.type = 'button';
        logoutBtn.id = 'smart-topbar-logout-btn';
        logoutBtn.className = 'smart-topbar-logout-btn topbar-logout-btn';
        logoutBtn.title = 'Đăng xuất tài khoản';
        logoutBtn.setAttribute('aria-label', 'Đăng xuất tài khoản');
        logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> <span class="smart-logout-text">Đăng xuất</span>';
        logoutBtn.addEventListener('click', () => {
            if (typeof window.handleLogout === 'function') {
                window.handleLogout();
            }
        });
        rightSection.appendChild(logoutBtn);
    }
}

function ensureSidebarStructure() {
    const sidebar = findSidebar();
    if (!sidebar) return;

    // 1. Đảm bảo nút đóng (✕) trong brand header
    const brand = sidebar.querySelector('.brand');
    if (brand && !brand.querySelector('.smart-sidebar-close-btn')) {
        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'smart-sidebar-close-btn';
        closeBtn.setAttribute('aria-label', 'Đóng menu');
        closeBtn.title = 'Đóng menu';
        closeBtn.innerHTML = '<i class="fas fa-times"></i>';
        closeBtn.addEventListener('click', () => {
            document.body.classList.remove('smart-mobile-menu-open');
        });
        brand.appendChild(closeBtn);
    }

    // 2. Đảm bảo footer chứa nút Đăng xuất luôn ở đáy
    let footer = sidebar.querySelector('.sidebar-footer');
    if (!footer) {
        const existingLogoutBtn = sidebar.querySelector('button[onclick*="handleLogout"], .btn-sidebar-logout');
        if (existingLogoutBtn) {
            footer = existingLogoutBtn.parentElement;
            if (footer) footer.classList.add('sidebar-footer');
        } else {
            footer = document.createElement('div');
            footer.className = 'sidebar-footer';
            footer.innerHTML = `
                <button type="button" class="btn btn-danger btn-sidebar-logout" style="width:100%">
                    <i class="fas fa-sign-out-alt"></i> Đăng xuất
                </button>
            `;
            const btn = footer.querySelector('button');
            if (btn) {
                btn.addEventListener('click', () => {
                    if (typeof window.handleLogout === 'function') {
                        window.handleLogout();
                    }
                });
            }
            sidebar.appendChild(footer);
        }
    }
}

function bindAutoCloseMenu() {
    document.addEventListener('click', event => {
        if (!event.target.closest('.menu-item')) return;
        if (window.matchMedia('(max-width: 820px)').matches) {
            document.body.classList.remove('smart-mobile-menu-open');
        }
    });
}

function enhanceScorePopups() {
    const mark = () => {
        const popup = document.querySelector('.swal2-popup');
        if (!popup) return;
        if (popup.querySelector('#ghk-modal-wrap, #score-form, [id^="ghk-panel-"], .score-input-table')) {
            popup.classList.add('smart-score-popup');

            const html = popup.querySelector('.swal2-html-container');
            if (html) {
                html.style.flex = '1 1 auto';
                html.style.minHeight = '0';
                html.style.overflow = 'hidden';
            }

            const panels = popup.querySelectorAll('#ghk-panel-mon, #ghk-panel-pc, #ghk-panel-nlc, #ghk-panel-nld, #score-form, .score-form-wrapper, .score-input-wrapper');
            panels.forEach(panel => {
                panel.style.flex = '1 1 auto';
                panel.style.minHeight = '0';
                panel.style.overflow = 'auto';
                panel.style.webkitOverflowScrolling = 'touch';
            });
        }
    };

    const mo = new MutationObserver(mark);
    mo.observe(document.body, { childList: true, subtree: true });
    mark();
}

function watchLayout() {
    findSidebar();
    ensureSidebarStructure();
    ensureTopBarMenuButton();
    ensureTopBarLogoutButton();
    const mo = new MutationObserver(() => {
        findSidebar();
        ensureSidebarStructure();
        ensureTopBarMenuButton();
        ensureTopBarLogoutButton();
    });
    mo.observe(document.body, { childList: true, subtree: true });
}

export function initMobileUI() {
    ensureViewport();
    injectMobileCss();
    ensureMobileControls();
    bindAutoCloseMenu();
    watchLayout();
    enhanceScorePopups();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileUI, { once: true });
} else {
    initMobileUI();
}
