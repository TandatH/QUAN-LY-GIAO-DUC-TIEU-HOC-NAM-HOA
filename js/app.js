// ═══════════════════════════════════════════════════════
// app.js — Firebase init | Auth | Routing | Data
// Các module chức năng được import bên dưới
// ═══════════════════════════════════════════════════════

window.SMART_SCHOOL_VERSION = '5.37.0';
console.info('[Smart School] Version', window.SMART_SCHOOL_VERSION);
import { initializeApp }       from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
         onAuthStateChanged, signOut, updatePassword }
    from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getDatabase, ref, set, get, child, update, onValue, push, remove,
         query, orderByChild, equalTo }
    from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
// ── Mobile login shell only; feature modules are loaded after auth/demo entry ──
import "./mobile.js?v=5.31.3";

let renderStudents, applyStudentFilter, openStudentModal, editStudent, saveStudent,
    deleteStudent, permanentlyDeleteStudent, exportExcel, importExcel, cycleSortStudent,
    resetStudentFilter, showStudentQr, printStudentQr, openQrStudentFromUrl,
    exportStudentQrPdf, exportStudentQrWord;
let renderAttendance, loadAttendance, saveAttendance, openAttendanceStats,
    loadAttendanceStats, exportAttendanceStats;
let renderScores, openScoreModal, loadScoreForm, saveScores, exportScoreExcel;
let renderFinance, switchFinanceTab, filterFinance, openFinanceModal, editFinance,
    saveFinance, deleteFinance, filterPaymentStatus, togglePaymentStatus,
    exportFinanceExcel, toggleFinanceCategory;
let renderTimetable, selectGrade, renderGradeTimetable, selectClass,
    renderClassTimetable, editTimetableSlot, saveTimetableSlot, clearTimetableSlot,
    openScheduleSettings, addPeriod, removePeriod, saveScheduleSettings,
    resetDefaultSchedule, switchTimetableViewTab, selectTeacherScheduleFilter,
    printTeacherSchedule, collectTeacherSchedule;
let renderUsers, openCreateUserModal, toggleCreateUserFields, adminCreateUser,
    loadUsers, deleteUser, editUserProfile, adminSendPasswordReset;
let renderChildInfo, sendFeedback;
let initSchoolYear, getSchoolYear, getSemester, renderSchoolYear, renderYearEndSummary;
let loadPromotionStatusForYear, activeStudentValues;
let schoolYearKey, timetablePath, paymentStatusPath, paymentStatusClassPath,
    financeMatchesYear, readYearScoped;
let renderHocBa, renderPhieuLienLac, renderNews;
let renderNotifications, initNotifBadge, markAllNotifRead, showNewNotifPopup;
let setupDemoMode, renderDemoView;
let renderEvaluations;
let renderPlans;

window.showToast = function(message, type = 'success') {
    const container = document.getElementById('app-toast-container') || document.body;
    const toast = document.createElement('div');
    toast.className = `app-toast ${type}`;
    const icon = type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle';
    toast.innerHTML = `<i class="fas fa-${icon}"></i> <span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        if (toast && toast.parentNode) toast.remove();
    }, 3200);
};

let featureModulesPromise = null;
let postAuthLibrariesPromise = null;

function loadScriptOnce(id, src, isReady) {
    if (isReady?.()) return Promise.resolve();
    const existing = document.querySelector(`script[data-smartschool-lib="${id}"]`);
    if (existing) {
        if (existing.dataset.loaded === '1' || isReady?.()) return Promise.resolve();
        return new Promise((resolve, reject) => {
            existing.addEventListener('load', resolve, { once:true });
            existing.addEventListener('error', reject, { once:true });
        });
    }

    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.dataset.smartschoolLib = id;
        script.onload = () => {
            script.dataset.loaded = '1';
            resolve();
        };
        script.onerror = () => reject(new Error(`Không tải được thư viện ${id}.`));
        document.head.appendChild(script);
    });
}

function ensurePostAuthLibraries() {
    if (postAuthLibrariesPromise) return postAuthLibrariesPromise;
    postAuthLibrariesPromise = Promise.allSettled([
        loadScriptOnce('xlsx', 'https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js', () => !!window.XLSX),
        loadScriptOnce('chartjs', 'https://cdn.jsdelivr.net/npm/chart.js', () => !!window.Chart),
        loadScriptOnce('jszip', 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js', () => !!window.JSZip),
    ]).then(results => {
        results.forEach(result => {
            if (result.status === 'rejected') console.warn('[Smart School] Lazy library load failed:', result.reason);
        });
    });
    return postAuthLibrariesPromise;
}

const VIEW_ACCESS = {
    admin: new Set([
        'dashboard', 'students', 'attendance', 'scores', 'finance', 'users',
        'timetable', 'hocba', 'yearend', 'schoolyear', 'notifications', 'news',
        'phieulienlac', 'evaluations', 'plans'
    ]),
    teacher: new Set([
        'dashboard', 'students', 'attendance', 'scores', 'finance',
        'timetable', 'hocba', 'notifications', 'news', 'phieulienlac', 'evaluations', 'plans'
    ]),
    subject_teacher: new Set([
        'dashboard', 'subject-scores', 'timetable', 'notifications', 'news', 'evaluations', 'plans'
    ]),
    parent: new Set([
        'dashboard', 'child-info', 'timetable', 'notifications', 'news', 'plans'
    ])
};

function normalizeRole(role = window.userRole) {
    const raw = String(role || '').trim().toLowerCase();
    if (['admin', 'quản trị', 'quan tri'].includes(raw)) return 'admin';
    if (['teacher', 'homeroom teacher', 'giáo viên chủ nhiệm', 'giao vien chu nhiem'].includes(raw)) return 'teacher';
    if (['subject_teacher', 'subject teacher', 'giáo viên bộ môn', 'giao vien bo mon'].includes(raw)) return 'subject_teacher';
    if (['parent', 'phụ huynh', 'phu huynh'].includes(raw)) return 'parent';
    return raw;
}

function canAccessView(view, role = window.userRole) {
    const roleKey = normalizeRole(role);
    return VIEW_ACCESS[roleKey]?.has(view) === true;
}

function renderAccessDenied(message = 'Bạn không có quyền truy cập chức năng này.') {
    const content = document.getElementById('content');
    const title = document.getElementById('page-title');
    if (title) title.textContent = 'Không có quyền truy cập';
    if (content) {
        content.dataset.view = 'access-denied';
        content.innerHTML = `
            <div class="card" style="text-align:center;padding:36px;max-width:560px;margin:0 auto">
                <i class="fas fa-lock" style="font-size:2rem;color:#b91c1c"></i>
                <h3 style="margin:12px 0 6px;color:#0f172a">Không có quyền truy cập</h3>
                <p style="color:#475569">${message}</p>
            </div>`;
    }
    return false;
}

function authorizeView(view) {
    if (window.IS_DEMO_MODE) return true;
    if (canAccessView(view)) return true;
    return renderAccessDenied();
}

// ═══════════════════════════════════════════════════════
// ROUTER & CẤU TRÚC ĐƯỜNG DẪN URL THÂN THIỆN (V5.36.0)
// Phân tách đường dẫn theo vai trò:
// - Quản trị viên: /admin/... (ví dụ: /admin/hoc-sinh, /admin/thoi-khoa-bieu, ...)
// - Giáo viên:     /giao-vien/... (ví dụ: /giao-vien/hoc-sinh, /giao-vien/quan-ly-diem, ...)
// - Phụ huynh:    /phu-huynh/... (ví dụ: /phu-huynh/thong-tin-con, /phu-huynh/thoi-khoa-bieu, ...)
// - Đăng nhập:    /login
// ═══════════════════════════════════════════════════════

const ROLE_URL_PREFIXES = {
    admin:           '/admin',
    teacher:         '/giao-vien',
    subject_teacher: '/giao-vien',
    parent:          '/phu-huynh',
};

// Bản đồ ánh xạ viewId sang slug chuẩn tiếng Việt theo từng vai trò
const VIEW_TO_SLUG = {
    admin: {
        'dashboard':     'dashboard',
        'students':      'hoc-sinh',
        'timetable':     'thoi-khoa-bieu',
        'attendance':    'diem-danh',
        'scores':        'quan-ly-diem',
        'finance':       'tai-chinh',
        'users':         'nguoi-dung',
        'hocba':         'hoc-ba',
        'yearend':       'tong-ket-nam-hoc',
        'schoolyear':    'cai-dat-nam-hoc',
        'notifications': 'thong-bao',
        'news':          'tin-tuc',
        'phieulienlac':  'phieu-lien-lac',
        'evaluations':   'danh-gia',
        'plans':         'ke-hoach',
    },
    teacher: {
        'dashboard':     'dashboard',
        'students':      'hoc-sinh',
        'timetable':     'thoi-khoa-bieu',
        'attendance':    'diem-danh',
        'scores':        'quan-ly-diem',
        'finance':       'dong-tien',
        'hocba':         'hoc-ba',
        'notifications': 'thong-bao',
        'news':          'tin-tuc',
        'phieulienlac':  'phieu-lien-lac',
        'evaluations':   'danh-gia',
        'plans':         'ke-hoach',
    },
    subject_teacher: {
        'dashboard':      'dashboard',
        'subject-scores': 'nhap-diem-bo-mon',
        'timetable':      'thoi-khoa-bieu',
        'notifications':  'thong-bao',
        'news':           'tin-tuc',
        'evaluations':    'danh-gia',
        'plans':          'ke-hoach',
    },
    parent: {
        'dashboard':     'dashboard',
        'child-info':    'thong-tin-con',
        'timetable':     'thoi-khoa-bieu',
        'notifications': 'thong-bao',
        'news':          'tin-tuc',
        'plans':         'ke-hoach',
    }
};

// Bản đồ ngược: chuyển slug URL về viewId nội bộ của app (hỗ trợ cả slug tiếng Việt & tiếng Anh)
const SLUG_TO_VIEW_ID = {
    'dashboard':        'dashboard',
    'tong-quan':        'dashboard',
    'hoc-sinh':         'students',
    'students':         'students',
    'quan-ly-hoc-sinh': 'students',
    'thoi-khoa-bieu':   'timetable',
    'timetable':        'timetable',
    'lich-hoc':         'timetable',
    'diem-danh':        'attendance',
    'attendance':       'attendance',
    'quan-ly-diem':     'scores',
    'diem':             'scores',
    'scores':           'scores',
    'nhap-diem-bo-mon': 'subject-scores',
    'subject-scores':   'subject-scores',
    'diem-bo-mon':      'subject-scores',
    'tai-chinh':        'finance',
    'dong-tien':        'finance',
    'finance':          'finance',
    'hoc-phi':          'finance',
    'nguoi-dung':       'users',
    'users':            'users',
    'tai-khoan':        'users',
    'hoc-ba':           'hocba',
    'hocba':            'hocba',
    'tong-ket-nam-hoc': 'yearend',
    'tong-ket-nam':     'yearend',
    'yearend':          'yearend',
    'cai-dat-nam-hoc':  'schoolyear',
    'schoolyear':       'schoolyear',
    'nam-hoc':          'schoolyear',
    'thong-bao':        'notifications',
    'notifications':    'notifications',
    'tin-tuc':          'news',
    'news':             'news',
    'phieu-lien-lac':   'phieulienlac',
    'danh-gia':         'evaluations',
    'bieu-mau':         'evaluations',
    'evaluations':      'evaluations',
    'phieulienlac':     'phieulienlac',
    'ke-hoach':         'plans',
    'kehoach':          'plans',
    'ke-hoach-day-hoc': 'plans',
    'plans':            'plans',
    'thong-tin-con':    'child-info',
    'child-info':       'child-info',
};

function getRolePrefix(role = window.userRole) {
    if (window.IS_DEMO_MODE) return '/demo';
    const r = normalizeRole(role);
    return ROLE_URL_PREFIXES[r] || '/admin';
}

function buildRouteUrl(view, role = window.userRole) {
    const r = normalizeRole(role);
    const prefix = getRolePrefix(r);
    const slugMap = VIEW_TO_SLUG[r] || VIEW_TO_SLUG.admin;
    const slug = slugMap[view] || VIEW_TO_SLUG.admin[view] || view;
    return `${prefix}/${slug}`;
}

function parseRouteFromPath(pathname = window.location.pathname) {
    const cleanPath = String(pathname || '').replace(/\/+$/, '').toLowerCase();
    const segments = cleanPath.split('/').filter(Boolean);

    if (segments.length === 0) {
        return { isLogin: false, isRoot: true, rolePrefix: null, view: null };
    }

    if (segments[0] === 'login' || segments[0] === 'login.html') {
        return { isLogin: true, isRoot: false, rolePrefix: null, view: null };
    }

    let rolePrefix = null;
    let slug = null;

    if (['admin', 'giao-vien', 'phu-huynh', 'demo'].includes(segments[0])) {
        rolePrefix = segments[0];
        slug = segments[1] || 'dashboard';
    } else {
        slug = segments[0];
    }

    const view = SLUG_TO_VIEW_ID[slug] || null;
    return { isLogin: false, isRoot: false, rolePrefix, view, rawSlug: slug };
}

function hideAppLoading() {
    const loadingEl = document.getElementById('app-loading');
    if (loadingEl) loadingEl.style.display = 'none';
}

function isRoleAllowed(allowedRoles) {
    return allowedRoles.includes(normalizeRole());
}

function blockUnauthorizedAction(actionName) {
    renderAccessDenied(`Tài khoản hiện tại không được phép thực hiện thao tác: ${actionName}.`);
    return false;
}

function guardWindowAction(name, allowedRoles, actionName = name) {
    const original = window[name];
    if (typeof original !== 'function' || original.__authGuarded) return;
    const guarded = function(...args) {
        if (!isRoleAllowed(allowedRoles)) return blockUnauthorizedAction(actionName);
        return original.apply(this, args);
    };
    guarded.__authGuarded = true;
    guarded.__authOriginal = original;
    window[name] = guarded;
}

function applyAuthorizationGuards() {
    [
        'renderUsers', 'openCreateUserModal', 'toggleCreateUserFields', 'adminCreateUser',
        'loadUsers', 'deleteUser', 'editUserProfile', 'adminSendPasswordReset',
        'openStudentModal', 'deleteStudent', 'permanentlyDeleteStudent', 'exportExcel',
        'importExcel', 'printQrForFilteredStudents', 'downloadStudentTemplate',
        'openFinanceModal', 'editFinance', 'saveFinance', 'deleteFinance',
        'exportFinanceExcel', 'toggleFinanceCategory', 'togglePaymentStatus',
        'openScheduleSettings', 'addPeriod', 'removePeriod', 'saveScheduleSettings',
        'resetDefaultSchedule', 'editTimetableSlot', 'saveTimetableSlot',
        'clearTimetableSlot', 'setSemester', 'saveSchoolYearSettings',
        'saveScoreEntryWindows',
        'openScoreAuditLog', 'runYearTransitionPreflight', 'executeYearTransitionV5',
        'rollbackLastYearTransition', 'exportYearEndExcel', 'openNewsModal',
        'deleteNews', 'openNotifModal', 'toggleNotifActive', 'deleteNotif',
        'openPeriodModal', 'savePeriodSettings', 'togglePeriodQuickStatus', 'deletePeriod',
        'openReviewSubmissionModal', 'submitReviewDecision'
    ].forEach(name => guardWindowAction(name, ['admin']));

    [
        'renderEvaluations', 'openNewFormSubmission', 'editEvaluationSubmission',
        'saveEvaluationSubmission', 'deleteEvaluationSubmission', 'printEvaluationSubmission'
    ].forEach(name => guardWindowAction(name, ['admin', 'teacher', 'subject_teacher']));

    [
        'renderStudents', 'applyStudentFilter', 'editStudent', 'saveStudent',
        'cycleSortStudent', 'resetStudentFilter', 'showStudentQr', 'printStudentQr',
        'exportStudentQrPdf', 'exportStudentQrWord', 'openTransferModal',
        'switchStudentClass', 'renderAttendance', 'loadAttendance', 'saveAttendance',
        'openAttendanceStats', 'loadAttendanceStats', 'exportAttendanceStats',
        'renderScores', 'openScoreModal', 'loadScoreForm', 'saveScores',
        'exportScoreExcel', 'switchSemester', 'switchScoreMode', 'switchScoreClass',
        'openGHKModal', 'exportGHKExcel', 'downloadScoreTemplate',
        'setViewSchoolYear', 'clearViewSchoolYear',
        'downloadGHKTemplate', 'importScoreExcel', 'importGHKExcel',
        'renderYearEndClassification', 'updateClassification', 'renderHocBa',
        'switchHocBaClass', 'viewHocBaDetail', 'downloadHocBaWord',
        'openHocBaForm', 'openHocBaWordExportOptions', 'exportAllHocBaClass',
        'changePromotionStatus', 'renderPhieuLienLac', 'sendFeedback'
    ].forEach(name => guardWindowAction(name, ['admin', 'teacher']));

    [
        'renderFinance', 'switchFinanceTab', 'switchFinanceClass', 'filterFinance',
        'filterPaymentStatus'
    ].forEach(name => guardWindowAction(name, ['admin', 'teacher']));

    guardWindowAction('renderChildInfo', ['parent']);
    window.canAccessView = canAccessView;
    window.authorizeView = authorizeView;
}

function markStudentsDataReady() {
    window._studentsDataReady = true;
    window.dispatchEvent(new Event('smartschool:students-ready'));
}
function exposeFeatureGlobals() {
    window.renderStudents     = renderStudents;
    window.applyStudentFilter = applyStudentFilter;
    window.openStudentModal   = openStudentModal;
    window.editStudent        = editStudent;
    window.saveStudent        = saveStudent;
    window.deleteStudent      = deleteStudent;
    window.permanentlyDeleteStudent = permanentlyDeleteStudent;
    window.exportExcel        = exportExcel;
    window.importExcel        = importExcel;
    window.cycleSortStudent   = cycleSortStudent;
    window.resetStudentFilter = resetStudentFilter;
    window.showStudentQr       = showStudentQr;
    window.printStudentQr      = printStudentQr;
    window.openQrStudentFromUrl = openQrStudentFromUrl;
    window.exportStudentQrPdf = exportStudentQrPdf;
    window.exportStudentQrWord = exportStudentQrWord;
    window.openTransferModal  = window.openTransferModal || function(){};
    window.switchStudentClass = window.switchStudentClass || function(){};
    window.switchScoreClass   = window.switchScoreClass   || function(){};

    window.renderAttendance     = renderAttendance;
    window.loadAttendance       = loadAttendance;
    window.saveAttendance       = saveAttendance;
    window.openAttendanceStats  = openAttendanceStats;
    window.loadAttendanceStats  = loadAttendanceStats;
    window.exportAttendanceStats = exportAttendanceStats;

    window.renderScores    = renderScores;
    window.openScoreModal  = openScoreModal;
    window.loadScoreForm   = loadScoreForm;
    window.saveScores      = saveScores;
    window.exportScoreExcel = exportScoreExcel;
    window.switchSemester        = window.switchSemester        || function(){};
    window.switchScoreMode       = window.switchScoreMode       || function(){};
    window.switchScoreClass      = window.switchScoreClass      || function(){};
    window.openGHKModal          = window.openGHKModal          || function(){};
    window.exportGHKExcel        = window.exportGHKExcel        || function(){};
    window.downloadScoreTemplate = window.downloadScoreTemplate || function(){};
    window.importScoreExcel      = window.importScoreExcel      || function(){};
    window.renderYearEndClassification = window.renderYearEndClassification || function(){};
    window.updateClassification  = window.updateClassification  || function(){};

    window.renderFinance        = renderFinance;
    window.switchFinanceTab     = switchFinanceTab;
    window.switchFinanceClass   = window.switchFinanceClass || function(){};
    window.filterFinance        = filterFinance;
    window.openFinanceModal     = openFinanceModal;
    window.editFinance          = editFinance;
    window.saveFinance          = saveFinance;
    window.deleteFinance        = deleteFinance;
    window.filterPaymentStatus  = filterPaymentStatus;
    window.togglePaymentStatus  = togglePaymentStatus;
    window.exportFinanceExcel   = exportFinanceExcel;
    window.toggleFinanceCategory = toggleFinanceCategory;

    window.renderTimetable      = renderTimetable;
    window.selectGrade          = selectGrade;
    window.renderGradeTimetable = renderGradeTimetable;
    window.selectClass          = selectClass;
    window.renderClassTimetable = renderClassTimetable;
    window.editTimetableSlot    = editTimetableSlot;
    window.saveTimetableSlot    = saveTimetableSlot;
    window.clearTimetableSlot   = clearTimetableSlot;
    window.openScheduleSettings = openScheduleSettings;
    window.addPeriod            = addPeriod;
    window.removePeriod         = removePeriod;
    window.saveScheduleSettings = saveScheduleSettings;
    window.resetDefaultSchedule = resetDefaultSchedule;
    window.switchTimetableViewTab = switchTimetableViewTab;
    window.selectTeacherScheduleFilter = selectTeacherScheduleFilter;
    window.printTeacherSchedule = printTeacherSchedule;
    window.collectTeacherSchedule = collectTeacherSchedule;

    window.renderUsers            = renderUsers;
    window.openCreateUserModal    = openCreateUserModal;
    window.toggleCreateUserFields = toggleCreateUserFields;
    window.adminCreateUser        = adminCreateUser;
    window.loadUsers              = loadUsers;
    window.deleteUser             = deleteUser;
    window.editUserProfile        = editUserProfile;
    window.adminSendPasswordReset = adminSendPasswordReset;

    window.renderChildInfo      = renderChildInfo;
    window.renderNotifications  = renderNotifications;
    window.renderNews           = renderNews;
    window.openNewsModal        = window.openNewsModal   || function(){};
    window.viewNewsDetail       = window.viewNewsDetail  || function(){};
    window.deleteNews           = window.deleteNews      || function(){};
    window.filterNews           = window.filterNews      || function(){};
    window._updateCatStyle      = window._updateCatStyle || function(){};
    window._handleNewsFileSelect= window._handleNewsFileSelect || function(){};
    window._handleNewsDrop      = window._handleNewsDrop || function(){};
    window._removeExistingImg   = window._removeExistingImg || function(){};
    window._removeNewImg        = window._removeNewImg   || function(){};
    window._galleryNav          = window._galleryNav     || function(){};
    window._galleryGoTo         = window._galleryGoTo    || function(){};
    window.loadNotifications    = window.loadNotifications  || function(){};
    window.openNotifModal       = window.openNotifModal     || function(){};
    window.toggleNotifActive    = window.toggleNotifActive  || function(){};
    window.deleteNotif          = window.deleteNotif        || function(){};
    window._updateNotifPreview  = window._updateNotifPreview|| function(){};
    window._toggleClassSelect   = window._toggleClassSelect || function(){};
    window.renderHocBa     = renderHocBa;
    window.renderPhieuLienLac = renderPhieuLienLac;
    window.viewHocBaDetail = window.viewHocBaDetail || function(){};
    window.downloadHocBaWord = window.downloadHocBaWord || function(){};
    window.switchHocBaClass  = window.switchHocBaClass  || function(){};
    window.exportAllHocBaClass  = window.exportAllHocBaClass  || function(){};
    window.changePromotionStatus = window.changePromotionStatus || function(){};
    window.sendFeedback    = sendFeedback;
    window.renderEvaluations = renderEvaluations;
    window.renderPlans     = renderPlans;
    applyAuthorizationGuards();
}

async function ensureFeatureModules() {
    if (featureModulesPromise) return featureModulesPromise;

    featureModulesPromise = (async () => {
        const [
            students, attendance, scores, finance, timetable, users, childinfo,
            schoolyear, yeartransition, studentstatus, yearscope, hocba,
            phieulienlac, news, notifications, demo, evaluations, plans
        ] = await Promise.all([
            import('./students.js?v=5.37.0'),
            import('./attendance.js?v=5.7.0'),
            import('./scores.js?v=5.37.0'),
            import('./finance.js'),
            import('./timetable.js'),
            import('./users.js?v=5.29.0'),
            import('./childinfo.js?v=5.27.0'),
            import('./schoolyear.js?v=5.33.1'),
            import('./yeartransition.js?v=5.32.9'),
            import('./studentstatus.js?v=5.26.1'),
            import('./yearscope.js'),
            import('./hocba.js?v=5.33.2'),
            import('./phieulienlac.js?v=5.37.0'),
            import('./news.js'),
            import('./notifications.js?v=5.35.2'),
            import('./demo.js?v=5.37.0'),
            import('./evaluations.js?v=5.37.0'),
            import('./plans.js?v=5.37.0'),
        ]);

        await ensurePostAuthLibraries();

        ({ renderStudents, applyStudentFilter, openStudentModal, editStudent, saveStudent,
           deleteStudent, permanentlyDeleteStudent, exportExcel, importExcel, cycleSortStudent,
           resetStudentFilter, showStudentQr, printStudentQr, openQrStudentFromUrl,
           exportStudentQrPdf, exportStudentQrWord } = students);
        ({ renderAttendance, loadAttendance, saveAttendance, openAttendanceStats,
           loadAttendanceStats, exportAttendanceStats } = attendance);
        ({ renderScores, openScoreModal, loadScoreForm, saveScores, exportScoreExcel } = scores);
        ({ renderFinance, switchFinanceTab, filterFinance, openFinanceModal, editFinance,
           saveFinance, deleteFinance, filterPaymentStatus, togglePaymentStatus,
           exportFinanceExcel, toggleFinanceCategory } = finance);
        ({ renderTimetable, selectGrade, renderGradeTimetable, selectClass,
           renderClassTimetable, editTimetableSlot, saveTimetableSlot, clearTimetableSlot,
           openScheduleSettings, addPeriod, removePeriod, saveScheduleSettings,
           resetDefaultSchedule, switchTimetableViewTab, selectTeacherScheduleFilter,
           printTeacherSchedule, collectTeacherSchedule } = timetable);
        ({ renderUsers, openCreateUserModal, toggleCreateUserFields, adminCreateUser,
           loadUsers, deleteUser, editUserProfile, adminSendPasswordReset } = users);
        ({ renderChildInfo, sendFeedback } = childinfo);
        ({ initSchoolYear, getSchoolYear, getSemester, renderSchoolYear, renderYearEndSummary } = schoolyear);
        ({ loadPromotionStatusForYear } = yeartransition);
        ({ activeStudentValues } = studentstatus);
        ({ schoolYearKey, timetablePath, paymentStatusPath, paymentStatusClassPath,
           financeMatchesYear, readYearScoped } = yearscope);
        ({ renderHocBa } = hocba);
        ({ renderPhieuLienLac } = phieulienlac);
        ({ renderNews } = news);
        ({ renderNotifications, initNotifBadge, markAllNotifRead, showNewNotifPopup } = notifications);
        ({ setupDemoMode, renderDemoView } = demo);
        ({ renderEvaluations } = evaluations);
        ({ renderPlans } = plans);

        exposeFeatureGlobals();
        window.dispatchEvent(new Event('smartschool:features-ready'));
    })().catch(error => {
        featureModulesPromise = null;
        console.error('[Smart School] Feature modules failed to load:', error);
        throw error;
    });

    return featureModulesPromise;
}

window.ensureSmartSchoolFeatures = ensureFeatureModules;

// ═══════════════════════════════════════════════════════
// FIREBASE CONFIG
// ═══════════════════════════════════════════════════════
const firebaseConfig = {
    apiKey:            "AIzaSyA8MPme9kwBzk6HiHZQbhZcIuUXikzWeYA",
    authDomain:        "fma-nam-hoa.firebaseapp.com",
    databaseURL:       "https://fma-nam-hoa-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId:         "fma-nam-hoa",
    messagingSenderId: "26467365636",
    appId:             "1:26467365636:web:7b25c2f37e83bfc9b59651",
    measurementId:     "G-PL7D8Y5VP2"
};

// Firebase Spark: chỉ dùng Authentication và Realtime Database.
// Cloud Storage và Cloud Functions yêu cầu dự án có billing/Blaze nên bị tắt chủ động.
window.FIREBASE_FEATURES = Object.freeze({
    plan: 'spark',
    authentication: true,
    realtimeDatabase: true,
    storage: false,
    functions: false,
});

const INITIAL_ADMIN = Object.freeze({
    uid:   "N1tXsaexgfNlqjsanViPvEBXZxJ3",
    email: "adminnamhoa@gmail.com",
    name:  "Quản trị Nam Hòa",
    role:  "admin"
});

const app       = initializeApp(firebaseConfig);
window._firebaseApp    = app;   // dùng cho secondary Auth và module tùy chọn
window._firebaseApiKey = firebaseConfig.apiKey;
const auth      = getAuth(app);
const db        = getDatabase(app);
// ── Expose globals cần thiết cho toàn app ────────────────────────────────────
window.auth = auth;
window.db   = db;

// ═══════════════════════════════════════════════════════
// V5.31.7 — Firebase Storage tải lười, không chặn đăng nhập
// Nếu firebase-storage.js lỗi mạng/DNS thì login vẫn chạy bình thường.
// Chỉ chức năng QR PDF Storage cần module này.
// ═══════════════════════════════════════════════════════
window.ensureFirebaseStorage = async function ensureFirebaseStorage() {
    if (window.FIREBASE_FEATURES?.storage !== true) {
        console.info('[FMA Nam Hòa] Firebase Storage đã tắt để tương thích gói Spark miễn phí.');
        return null;
    }
    if (window.storage && window.storageRef && window.uploadBytes && window.deleteObject && window.getDownloadURL) {
        return window.storage;
    }
    try {
        const mod = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js");
        window.storage = mod.getStorage(app);
        window.storageRef = mod.ref;
        window.uploadBytes = mod.uploadBytes;
        window.deleteObject = mod.deleteObject;
        window.getDownloadURL = mod.getDownloadURL;
        console.info('[Smart School V5.31.7] Firebase Storage loaded lazily');
        return window.storage;
    } catch (error) {
        console.warn('[Smart School V5.31.7] Firebase Storage chưa tải được. Đăng nhập vẫn hoạt động, chỉ QR PDF Storage tạm thời không dùng được.', error);
        return null;
    }
};

// Firebase Storage chỉ tải khi chức năng QR/ảnh cần dùng sau đăng nhập.

window.ref  = ref;
window.set  = set;
window.get  = get;
window.child = child;
window.update = update;
window.push   = push;
window.remove = remove;
window.onValue = onValue;
window._serverTimeOffset = 0;
window.serverNow = () => Date.now() + Number(window._serverTimeOffset || 0);
onValue(ref(db, '.info/serverTimeOffset'), snap => {
    window._serverTimeOffset = Number(snap.val() || 0);
}, () => {});

window.currentUser      = null;
window.currentUserProfile = null;
window.userRole         = null;
window._currentSchoolYear = null;
window._currentSemester   = 'hk1';
window.teacherClass     = null;
window.parentStudentId  = null;

window.localData = { students: {}, scores: {}, finance: {}, timetables: {}, scheduleSettings: null, paymentStatus: {} };
window._studentsDataReady = false;
window._legacyFinanceSchoolYear = null;
window.editingStudentId    = null;
window.currentScoreStudent = null;
window.currentTimetableSlot = null;

window.TIMETABLE_PERIODS = { morning: [], afternoon: [] };
window.WEEKDAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6'];

window.DEFAULT_PERIODS = {
    morning: [
        { id:1, time:'7:30-8:10',   name:'Tiết 1' },
        { id:2, time:'8:15-8:55',   name:'Tiết 2' },
        { id:3, time:'9:00-9:40',   name:'Tiết 3' },
        { id:4, time:'9:45-10:25',  name:'Tiết 4' },
        { id:5, time:'10:30-11:10', name:'Tiết 5' }
    ],
    afternoon: [
        { id:6, time:'13:30-14:10', name:'Tiết 6' },
        { id:7, time:'14:15-14:55', name:'Tiết 7' },
        { id:8, time:'15:00-15:40', name:'Tiết 8' },
        { id:9, time:'15:45-16:25', name:'Tiết 9' }
    ]
};

// Môn học theo TT27/2020 - CT GDPT 2018 tiểu học
// Loại đánh giá: 'diem' = có điểm số TX+GK+CK, 'nhanxet' = chỉ nhận xét
// ── Môn học theo TT27/2020 + mẫu học bạ chuẩn ──────────────────────────────
// type:'diem'    → có Mức đạt được + Điểm KTĐK + Nhận xét
// type:'nhanxet' → chỉ Mức đạt được + Nhận xét (ô Điểm KTĐK gạch chéo)
//
// Khối 1-2: TV, Toán, Ngoại ngữ 1 → diem
// Khối 3-4-5: TV, Toán, Ngoại ngữ 1, Lịch sử-ĐL, Khoa học, Tin học CN → diem
// Đạo đức, Tự nhiên XH, Thể chất, Nghệ thuật, Trải nghiệm, Tiếng DT → nhanxet (tất cả khối)
window.PRIMARY_SUBJECTS = {
    '1':     [
        { name:'Tiếng Việt',            type:'diem' },
        { name:'Toán',                  type:'diem' },
        { name:'Ngoại ngữ 1',           type:'diem' },
        { name:'Đạo đức',               type:'nhanxet' },
        { name:'Tự nhiên và Xã hội',    type:'nhanxet' },
        { name:'Giáo dục thể chất',     type:'nhanxet' },
        { name:'Nghệ thuật (Âm nhạc)',  type:'nhanxet' },
        { name:'Nghệ thuật (Mỹ thuật)', type:'nhanxet' },
        { name:'Hoạt động trải nghiệm', type:'nhanxet' },
        { name:'Tiếng dân tộc',         type:'nhanxet' },
    ],
    '2':     [
        { name:'Tiếng Việt',            type:'diem' },
        { name:'Toán',                  type:'diem' },
        { name:'Ngoại ngữ 1',           type:'diem' },
        { name:'Đạo đức',               type:'nhanxet' },
        { name:'Tự nhiên và Xã hội',    type:'nhanxet' },
        { name:'Giáo dục thể chất',     type:'nhanxet' },
        { name:'Nghệ thuật (Âm nhạc)',  type:'nhanxet' },
        { name:'Nghệ thuật (Mỹ thuật)', type:'nhanxet' },
        { name:'Hoạt động trải nghiệm', type:'nhanxet' },
        { name:'Tiếng dân tộc',         type:'nhanxet' },
    ],
    '3':     [
        { name:'Tiếng Việt',            type:'diem' },
        { name:'Toán',                  type:'diem' },
        { name:'Ngoại ngữ 1',           type:'diem' },
        { name:'Lịch sử và Địa lí',     type:'diem' },
        { name:'Khoa học',              type:'diem' },
        { name:'Tin học',               type:'diem' },
        { name:'Công nghệ',             type:'diem' },
        { name:'Đạo đức',               type:'nhanxet' },
        { name:'Tự nhiên và Xã hội',    type:'nhanxet' },
        { name:'Giáo dục thể chất',     type:'nhanxet' },
        { name:'Nghệ thuật (Âm nhạc)',  type:'nhanxet' },
        { name:'Nghệ thuật (Mỹ thuật)', type:'nhanxet' },
        { name:'Hoạt động trải nghiệm', type:'nhanxet' },
        { name:'Tiếng dân tộc',         type:'nhanxet' },
    ],
    '4':     [
        { name:'Tiếng Việt',            type:'diem' },
        { name:'Toán',                  type:'diem' },
        { name:'Ngoại ngữ 1',           type:'diem' },
        { name:'Lịch sử và Địa lí',     type:'diem' },
        { name:'Khoa học',              type:'diem' },
        { name:'Tin học',               type:'diem' },
        { name:'Công nghệ',             type:'diem' },
        { name:'Đạo đức',               type:'nhanxet' },
        { name:'Tự nhiên và Xã hội',    type:'nhanxet' },
        { name:'Giáo dục thể chất',     type:'nhanxet' },
        { name:'Nghệ thuật (Âm nhạc)',  type:'nhanxet' },
        { name:'Nghệ thuật (Mỹ thuật)', type:'nhanxet' },
        { name:'Hoạt động trải nghiệm', type:'nhanxet' },
        { name:'Tiếng dân tộc',         type:'nhanxet' },
    ],
    '5':     [
        { name:'Tiếng Việt',            type:'diem' },
        { name:'Toán',                  type:'diem' },
        { name:'Ngoại ngữ 1',           type:'diem' },
        { name:'Lịch sử và Địa lí',     type:'diem' },
        { name:'Khoa học',              type:'diem' },
        { name:'Tin học',               type:'diem' },
        { name:'Công nghệ',             type:'diem' },
        { name:'Đạo đức',               type:'nhanxet' },
        { name:'Tự nhiên và Xã hội',    type:'nhanxet' },
        { name:'Giáo dục thể chất',     type:'nhanxet' },
        { name:'Nghệ thuật (Âm nhạc)',  type:'nhanxet' },
        { name:'Nghệ thuật (Mỹ thuật)', type:'nhanxet' },
        { name:'Hoạt động trải nghiệm', type:'nhanxet' },
        { name:'Tiếng dân tộc',         type:'nhanxet' },
    ],
};

// Quy tắc điểm số GIỮA HỌC KỲ:
// - Chỉ áp dụng cho khối 3, 4, 5.
// - Chỉ 3 môn có Điểm KTĐK: Tiếng Việt, Toán, Ngoại ngữ 1 (Tiếng Anh).
// - Các môn còn lại chỉ lưu Mức đạt được + Nhận xét.
window.GHK_SCORE_SUBJECTS = ['Tiếng Việt', 'Toán', 'Ngoại ngữ 1', 'Tiếng Anh'];
window.isGHKScoreSubject = function(grade, subjectName) {
    const normalized = String(subjectName || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLowerCase();
    const allowed = new Set(['tieng viet', 'toan', 'ngoai ngu 1', 'tieng anh']);
    return ['3', '4', '5'].includes(String(grade)) && allowed.has(normalized);
};

window.PHAM_CHAT = ['Yêu nước','Nhân ái','Chăm chỉ','Trung thực','Trách nhiệm'];

// Năng lực chung
window.NANG_LUC_CHUNG = ['Tự chủ và tự học','Giao tiếp và hợp tác','Giải quyết vấn đề và sáng tạo'];

// Năng lực đặc thù
window.NANG_LUC_DAC_THU = ['Ngôn ngữ','Tính toán','Khoa học','Công nghệ','Tin học','Thẩm mĩ','Thể chất'];

// Mức đánh giá định tính
window.MUC_DANH_GIA     = ['T','Đ','C'];   // Phẩm chất & Năng lực: Tốt / Đạt / Cần cố gắng
window.MUC_DANH_GIA_MON = ['T','H','C'];   // Môn học & Hoạt động GD: Tốt / Hoàn thành / Cần cố gắng

// ── Expose module functions lên window để HTML inline handlers dùng được ─────
window.renderStudents     = renderStudents;
window.applyStudentFilter = applyStudentFilter;
window.openStudentModal   = openStudentModal;
window.editStudent        = editStudent;
window.saveStudent        = saveStudent;
window.deleteStudent      = deleteStudent;
window.permanentlyDeleteStudent = permanentlyDeleteStudent;
window.exportExcel        = exportExcel;
window.importExcel        = importExcel;
window.cycleSortStudent   = cycleSortStudent;
window.resetStudentFilter = resetStudentFilter;
window.showStudentQr       = showStudentQr;
window.printStudentQr      = printStudentQr;
window.openQrStudentFromUrl = openQrStudentFromUrl;
window.openTransferModal  = window.openTransferModal || function(){};
window.switchStudentClass = window.switchStudentClass || function(){};
window.switchScoreClass   = window.switchScoreClass   || function(){};

window.renderAttendance     = renderAttendance;
window.loadAttendance       = loadAttendance;
window.saveAttendance       = saveAttendance;
window.openAttendanceStats  = openAttendanceStats;
window.loadAttendanceStats  = loadAttendanceStats;
window.exportAttendanceStats = exportAttendanceStats;

window.renderScores    = renderScores;
window.openScoreModal  = openScoreModal;
window.loadScoreForm   = loadScoreForm;
window.saveScores      = saveScores;
window.exportScoreExcel = exportScoreExcel;
// scores.js v2 functions
window.switchSemester        = window.switchSemester        || function(){};
window.switchScoreMode       = window.switchScoreMode       || function(){};
window.switchScoreClass      = window.switchScoreClass      || function(){};
window.openGHKModal          = window.openGHKModal          || function(){};
window.exportGHKExcel        = window.exportGHKExcel        || function(){};
window.downloadScoreTemplate = window.downloadScoreTemplate || function(){};
window.importScoreExcel      = window.importScoreExcel      || function(){};
window.renderYearEndClassification = window.renderYearEndClassification || function(){};
window.updateClassification  = window.updateClassification  || function(){};

window.renderFinance        = renderFinance;
window.switchFinanceTab     = switchFinanceTab;
window.switchFinanceClass   = window.switchFinanceClass || function(){};
window.filterFinance        = filterFinance;
window.openFinanceModal     = openFinanceModal;
window.editFinance          = editFinance;
window.saveFinance          = saveFinance;
window.deleteFinance        = deleteFinance;
window.filterPaymentStatus  = filterPaymentStatus;
window.togglePaymentStatus  = togglePaymentStatus;
window.exportFinanceExcel   = exportFinanceExcel;
window.toggleFinanceCategory = toggleFinanceCategory;

window.renderTimetable      = renderTimetable;
window.selectGrade          = selectGrade;
window.renderGradeTimetable = renderGradeTimetable;
window.selectClass          = selectClass;
window.renderClassTimetable = renderClassTimetable;
window.editTimetableSlot    = editTimetableSlot;
window.saveTimetableSlot    = saveTimetableSlot;
window.clearTimetableSlot   = clearTimetableSlot;
window.openScheduleSettings = openScheduleSettings;
window.addPeriod            = addPeriod;
window.removePeriod         = removePeriod;
window.saveScheduleSettings = saveScheduleSettings;
window.resetDefaultSchedule = resetDefaultSchedule;
window.switchTimetableViewTab = switchTimetableViewTab;
window.selectTeacherScheduleFilter = selectTeacherScheduleFilter;
window.printTeacherSchedule = printTeacherSchedule;
window.collectTeacherSchedule = collectTeacherSchedule;

window.renderUsers            = renderUsers;
window.openCreateUserModal    = openCreateUserModal;
window.toggleCreateUserFields = toggleCreateUserFields;
window.adminCreateUser        = adminCreateUser;
window.loadUsers              = loadUsers;
window.deleteUser             = deleteUser;
window.editUserProfile       = editUserProfile;
window.adminSendPasswordReset = adminSendPasswordReset;

window.renderChildInfo      = renderChildInfo;
window.renderNotifications  = renderNotifications;
window.renderNews           = renderNews;
window.openNewsModal        = window.openNewsModal   || function(){};
window.viewNewsDetail       = window.viewNewsDetail  || function(){};
window.deleteNews           = window.deleteNews      || function(){};
window.filterNews           = window.filterNews      || function(){};
window._updateCatStyle      = window._updateCatStyle || function(){};
window._handleNewsFileSelect= window._handleNewsFileSelect || function(){};
window._handleNewsDrop      = window._handleNewsDrop || function(){};
window._removeExistingImg   = window._removeExistingImg || function(){};
window._removeNewImg        = window._removeNewImg   || function(){};
window._galleryNav          = window._galleryNav     || function(){};
window._galleryGoTo         = window._galleryGoTo    || function(){};
window.loadNotifications    = window.loadNotifications  || function(){};
window.openNotifModal       = window.openNotifModal     || function(){};
window.toggleNotifActive    = window.toggleNotifActive  || function(){};
window.deleteNotif          = window.deleteNotif        || function(){};
window._updateNotifPreview  = window._updateNotifPreview|| function(){};
window._toggleClassSelect   = window._toggleClassSelect || function(){};
window.renderHocBa     = renderHocBa;
window.renderPhieuLienLac = renderPhieuLienLac;
window.viewHocBaDetail = window.viewHocBaDetail || function(){};
window.downloadHocBaWord = window.downloadHocBaWord || function(){};
window.switchHocBaClass  = window.switchHocBaClass  || function(){};
window.exportAllHocBaClass  = window.exportAllHocBaClass  || function(){};
window.changePromotionStatus = window.changePromotionStatus || function(){};
window.sendFeedback    = sendFeedback;
    applyAuthorizationGuards();


// ═══════════════════════════════════════════════════════
// V5.29.0 — Đổi mật khẩu lần đầu + đổi mật khẩu cá nhân
// ═══════════════════════════════════════════════════════
function ensureChangePasswordButton() {
    const info = document.getElementById('user-info');
    if (!info || document.getElementById('btn-change-own-password')) return;

    const btn = document.createElement('button');
    btn.id = 'btn-change-own-password';
    btn.type = 'button';
    btn.className = 'btn btn-outline btn-sm';
    btn.style.cssText = 'margin-left:8px;padding:5px 10px;font-size:0.78rem';
    btn.innerHTML = '<i class="fas fa-key"></i> Đổi mật khẩu';
    btn.onclick = () => openOwnPasswordModal(false);
    info.insertAdjacentElement('afterend', btn);
}

async function openOwnPasswordModal(force = false) {
    force = force === true;
    const authUser = auth.currentUser;
    if (!authUser) {
        await Swal.fire('Lỗi', 'Không tìm thấy phiên đăng nhập hiện tại. Vui lòng đăng nhập lại.', 'error');
        return false;
    }

    const result = await Swal.fire({
        icon: 'info',
        title: force ? 'Đổi mật khẩu lần đầu' : 'Đổi mật khẩu',
        html: `
            <div style="text-align:left">
                ${force ? `
                    <div style="background:#fff7ed;border:1px solid #fed7aa;color:#9a3412;
                                border-radius:8px;padding:10px;margin-bottom:12px">
                        Tài khoản này đang dùng mật khẩu tạm do Admin cấp.
                        Vui lòng đổi mật khẩu mới trước khi tiếp tục.
                    </div>` : ''}
                <label style="font-weight:600;color:#475569">Mật khẩu mới</label>
                <input id="new-pass-1" type="password" class="swal2-input"
                       autocomplete="new-password"
                       style="width:100%;margin:6px 0 12px 0" placeholder="Tối thiểu 6 ký tự">
                <label style="font-weight:600;color:#475569">Nhập lại mật khẩu mới</label>
                <input id="new-pass-2" type="password" class="swal2-input"
                       autocomplete="new-password"
                       style="width:100%;margin:6px 0 0 0" placeholder="Nhập lại mật khẩu">
            </div>`,
        allowOutsideClick: () => !Swal.isLoading() && !force,
        allowEscapeKey: () => !Swal.isLoading() && !force,
        showCancelButton: !force,
        showDenyButton: force,
        showLoaderOnConfirm: true,
        confirmButtonText: 'Lưu mật khẩu mới',
        cancelButtonText: 'Để sau',
        denyButtonText: 'Đăng xuất',
        preConfirm: async () => {
            const currentAuthUser = auth.currentUser;
            const p1 = document.getElementById('new-pass-1')?.value || '';
            const p2 = document.getElementById('new-pass-2')?.value || '';

            if (!currentAuthUser) {
                Swal.showValidationMessage('Không tìm thấy phiên đăng nhập hiện tại. Vui lòng đăng nhập lại.');
                return false;
            }
            if (!p1) {
                Swal.showValidationMessage('Mật khẩu mới không được để trống.');
                return false;
            }
            if (p1.length < 6) {
                Swal.showValidationMessage('Mật khẩu mới phải có ít nhất 6 ký tự.');
                return false;
            }
            if (p1 !== p2) {
                Swal.showValidationMessage('Hai lần nhập mật khẩu không khớp.');
                return false;
            }

            try {
                await updatePassword(currentAuthUser, p1);
                const nowValue = typeof window.serverNow === 'function' ? window.serverNow() : Date.now();
                const profileUpdates = {
                    [`users/${currentAuthUser.uid}/mustChangePassword`]: false,
                    [`users/${currentAuthUser.uid}/passwordChangedAt`]: nowValue,
                    [`users/${currentAuthUser.uid}/passwordChangedByUid`]: currentAuthUser.uid,
                    [`users/${currentAuthUser.uid}/passwordChangedByEmail`]: currentAuthUser.email || '',
                };
                if (Object.prototype.hasOwnProperty.call(window.currentUserProfile || {}, 'requirePasswordChange')) {
                    profileUpdates[`users/${currentAuthUser.uid}/requirePasswordChange`] = false;
                }
                await update(ref(db), profileUpdates);
                if (window.currentUserProfile) {
                    window.currentUserProfile.mustChangePassword = false;
                    window.currentUserProfile.requirePasswordChange = false;
                    window.currentUserProfile.passwordChangedAt = nowValue;
                    window.currentUserProfile.passwordChangedByUid = currentAuthUser.uid;
                    window.currentUserProfile.passwordChangedByEmail = currentAuthUser.email || '';
                }
                await currentAuthUser.getIdToken(true);
                return true;
            } catch (error) {
                if (error?.code === 'auth/requires-recent-login') {
                    Swal.showValidationMessage(
                        'Phiên đăng nhập đã hết hiệu lực. Vui lòng bấm Đăng xuất rồi đăng nhập lại trước khi đổi mật khẩu. Cờ đổi mật khẩu lần đầu chưa được xóa.'
                    );
                    return false;
                }
                Swal.showValidationMessage(error?.message || 'Không đổi được mật khẩu. Vui lòng thử lại.');
                return false;
            }
        }
    });

    if (result.isDenied) {
        await signOut(auth);
        return false;
    }
    if (!result.isConfirmed) return false;

    await Swal.fire('Thành công', 'Đã đổi mật khẩu mới.', 'success');
    return true;
}

async function enforceFirstPasswordChange() {
    const user = auth.currentUser;
    if (!user) return;

    try {
        // Đọc trực tiếp trạng thái mới nhất từ Firebase
        const snap = await get(
            child(ref(db), `users/${user.uid}`)
        );

        if (!snap.exists()) return;

        const profile = snap.val() || {};

        // Cập nhật lại dữ liệu đang giữ trong RAM
        window.currentUserProfile = {
            ...(window.currentUserProfile || {}),
            ...profile
        };

        const value = profile.mustChangePassword;

        // Chỉ TRUE thật sự mới bắt đổi mật khẩu
        const mustChange =
            value === true ||
            String(value).trim().toLowerCase() === 'true';

        if (!mustChange) {
            return;
        }

        await openOwnPasswordModal(true);

    } catch (error) {
        console.error('[PASSWORD CHECK ERROR]', error);

        // Nếu không đọc được Firebase thì không tự ý bắt GV đổi lại mật khẩu
        return;
    }
}

window.openOwnPasswordModal = openOwnPasswordModal;


// ═══════════════════════════════════════════════════════
// AUTH STATE
// ═══════════════════════════════════════════════════════
onAuthStateChanged(auth, async (user) => {
    hideAppLoading();
    if (user) {
        try {
            const userRef = child(ref(db), `users/${user.uid}`);
            let snap = await get(userRef);

            // Dự án Firebase Nam Hòa mới có thể tự tạo đúng một hồ sơ admin đầu tiên.
            // Database Rules đi kèm chỉ cho phép UID + email này thực hiện thao tác.
            if (!snap.exists()
                && user.uid === INITIAL_ADMIN.uid
                && String(user.email || '').toLowerCase() === INITIAL_ADMIN.email.toLowerCase()) {
                const createdAt = typeof window.serverNow === 'function' ? window.serverNow() : Date.now();
                await set(userRef, {
                    email: INITIAL_ADMIN.email,
                    role: INITIAL_ADMIN.role,
                    name: INITIAL_ADMIN.name,
                    displayName: INITIAL_ADMIN.name,
                    mustChangePassword: false,
                    createdAt,
                    createdBy: INITIAL_ADMIN.email,
                    createdByUid: INITIAL_ADMIN.uid,
                    isInitialAdmin: true
                });
                snap = await get(userRef);
            }

            if (!snap.exists()) throw new Error('USER_PROFILE_NOT_FOUND');
            if (snap.exists()) {
                window.currentUser      = user;
                const userData          = snap.val();
                window.currentUserProfile = userData;
                window.userRole           = userData.role;
                window.teacherName        = userData.name || userData.displayName || '';
                // V5.1: hỗ trợ cả tên lớp hiển thị (assignedClass) và khóa lớp chuẩn hóa
                // (assignedClassKey). Sau khi chuyển năm, một số tài khoản có thể chỉ có
                // assignedClassKey; các module điểm/học bạ phải nhận diện được cả hai.
                window.teacherClass       = userData.assignedClass || null;
                window.teacherClassKey    = userData.assignedClassKey
                                         || classDbKey(userData.assignedClass || '');
                window.teacherSubject     = userData.assignedSubject || null; // GV bộ môn
                window.teacherGrades      = userData.assignedGrades ? Object.values(userData.assignedGrades) : null; // khối phụ trách — Object.values() vì Firebase lưu array thành object
                window.parentStudentId    = userData.studentId;  // mã code HS
                window.parentStudentKey   = userData.studentKey || userData.studentId; // push key DB

                await ensureFeatureModules();
                window.setSmartMobileAuthenticated?.(true);

                document.getElementById('auth-screen').style.display = 'none';
                document.getElementById('app-container').style.display = 'flex';
                document.getElementById('user-info').textContent = `${userData.name || userData.email} (${userData.role})`;
                ensureChangePasswordButton();

                loadMenu();
                await initSchoolYear();
                loadData();

                // Xác định view mục tiêu dựa theo đường dẫn URL hiện tại hoặc redirect đã lưu
                let targetView = 'dashboard';
                const savedRedirect = sessionStorage.getItem('fma_redirect_after_login');
                if (savedRedirect) {
                    sessionStorage.removeItem('fma_redirect_after_login');
                    const parsed = parseRouteFromPath(savedRedirect);
                    if (parsed.view && canAccessView(parsed.view, window.userRole)) {
                        targetView = parsed.view;
                    }
                } else {
                    const currentRoute = parseRouteFromPath(window.location.pathname);
                    if (currentRoute.view && canAccessView(currentRoute.view, window.userRole)) {
                        targetView = currentRoute.view;
                    }
                }

                await changeView(targetView, { replaceState: true });

                setTimeout(() => openQrStudentFromUrl(), 900);
                setTimeout(() => enforceFirstPasswordChange(), 700);
                // Khởi tạo badge thông báo + popup nếu có TB mới
                setTimeout(() => {
                    initNotifBadge();
                    showNewNotifPopup();
                }, 1500);
            }
        } catch (error) {
            console.error('Auth state init error:', error);
            const errStr = `${error?.code || ''} ${error?.message || ''} ${String(error || '')}`.toUpperCase();
            const message = errStr.includes('USER_PROFILE_NOT_FOUND')
                ? 'Tài khoản đã có trong Authentication nhưng chưa có hồ sơ trong Realtime Database.'
                : errStr.includes('PERMISSION_DENIED')
                    ? 'Realtime Database đang chặn quyền truy cập. Hãy áp dụng file firebase-database.rules.json đi kèm.'
                    : `Không tải được dữ liệu hệ thống sau đăng nhập: ${error?.message || 'Vui lòng thử lại.'}`;
            await Swal.fire('Lỗi', message, 'error');
            await signOut(auth);
        }
    } else {
        if (window.IS_DEMO_MODE) return;
        window.setSmartMobileAuthenticated?.(false);

        // Lưu đường dẫn hiện tại (nếu đang ở trang con) để chuyển lại sau khi đăng nhập thành công
        const currentPath = window.location.pathname;
        if (currentPath && !['/login', '/login.html', '/'].includes(currentPath)) {
            sessionStorage.setItem('fma_redirect_after_login', currentPath + window.location.search);
        }
        if (window.location.pathname !== '/login') {
            history.replaceState(null, '', '/login');
        }

        document.getElementById('auth-screen').style.display = 'flex';
        document.getElementById('app-container').style.display = 'none';
    }
});

// ═══════════════════════════════════════════════════════
// AUTH FUNCTIONS
// ═══════════════════════════════════════════════════════
function setLoginLoading(isLoading) {
    const button = document.getElementById('login-submit');
    if (!button) return;
    button.disabled = isLoading;
    button.setAttribute('aria-busy', String(isLoading));
    const label = button.querySelector('.login-label');
    const loading = button.querySelector('.login-loading');
    if (label) label.hidden = isLoading;
    if (loading) loading.hidden = !isLoading;
}

function getLoginErrorMessage(error) {
    const code = String(error?.code || error?.message || '')
        .toUpperCase()
        .replace(/[-\s]+/g, '_');
    if (code.includes('INVALID_EMAIL')) return 'Email không đúng định dạng.';
    if (code.includes('INVALID_PASSWORD') || code.includes('WRONG_PASSWORD')) return 'Mật khẩu không đúng.';
    if (code.includes('USER_NOT_FOUND')) return 'Không tìm thấy tài khoản với email này.';
    if (code.includes('INVALID_LOGIN_CREDENTIALS') || code.includes('INVALID_CREDENTIAL')) {
        return 'Email hoặc mật khẩu không đúng.';
    }
    if (code.includes('TOO_MANY_ATTEMPTS')) return 'Tài khoản tạm thời bị chặn do đăng nhập sai nhiều lần. Vui lòng thử lại sau.';
    return 'Không đăng nhập được. Vui lòng kiểm tra lại email và mật khẩu.';
}

window.handleLogin = async (event) => {
    event?.preventDefault?.();
    const form = document.getElementById('form-login');
    const emailInput = document.getElementById('login-email');
    const passInput  = document.getElementById('login-pass');
    const email = String(emailInput?.value || '').trim();
    const pass  = String(passInput?.value || '');

    if (!email || !pass) {
        await Swal.fire('Lỗi', 'Vui lòng điền đầy đủ thông tin', 'error');
        form?.reportValidity?.();
        return;
    }
    if (form && !form.checkValidity()) {
        form.reportValidity();
        return;
    }

    setLoginLoading(true);
    try {
        await signInWithEmailAndPassword(auth, email, pass);
        setLoginLoading(false);
        // onAuthStateChanged sẽ tự động xử lý chuyển đến đúng role dashboard hoặc trang đã lưu
    } catch (error) {
        setLoginLoading(false);
        await Swal.fire('Lỗi', getLoginErrorMessage(error), 'error');
    }
};

window.handleDemoLogin = async () => {
    try {
        await ensureFeatureModules();
        setupDemoMode();
        window.setSmartMobileAuthenticated?.(true);

        document.getElementById('auth-screen').style.display = 'none';
        document.getElementById('app-container').style.display = 'flex';
        document.getElementById('user-info').innerHTML = `
            <span style="background:#fff7ed;color:#9a3412;border:1px solid #fb923c;
                         padding:6px 10px;border-radius:999px;font-weight:700">
                <i class="fas fa-flask"></i> Demo dữ liệu giả
            </span>`;

        loadMenu();
        await changeView('dashboard', { replaceState: true });

        Swal.fire({
            icon: 'info',
            title: 'Đang xem chế độ demo',
            html: 'Dữ liệu trong chế độ demo là dữ liệu giả. Các thao tác thêm/sửa/xóa/lưu đều bị chặn.',
            timer: 2500,
            showConfirmButton: false
        });
    } catch (error) {
        console.error('Demo login error:', error);
        Swal.fire('Lỗi demo', error.message || String(error), 'error');
    }
};

window.handleLogout = async () => {
    try {
        if (window.IS_DEMO_MODE) {
            window.IS_DEMO_MODE = false;
            window._demoData = null;
            window.currentUser = null;
            window.currentUserProfile = null;
            window.userRole = null;
            window.localData = { students: {}, scores: {}, finance: {}, timetables: {}, scheduleSettings: null, paymentStatus: {} };
            window._studentsDataReady = false;
            window.setSmartMobileAuthenticated?.(false);
            history.replaceState(null, '', '/login');
            document.getElementById('auth-screen').style.display = 'flex';
            document.getElementById('app-container').style.display = 'none';
            Swal.fire('Đã thoát demo', 'Bạn đã quay lại màn hình đăng nhập.', 'success');
            return;
        }
        await signOut(auth);
        history.replaceState(null, '', '/login');
        Swal.fire('Đã đăng xuất', 'Hẹn gặp lại!', 'success');
    } catch (error) {
        Swal.fire('Lỗi', error.message, 'error');
    }
};

// ═══════════════════════════════════════════════════════
// MENU
// ═══════════════════════════════════════════════════════
function loadMenu() {
    const menuItems = {
        admin: [
            { id:'dashboard',  icon:'chart-line',      text:'Dashboard' },
            { id:'students',   icon:'user-graduate',   text:'Quản lý Học sinh' },
            { id:'timetable',  icon:'calendar-alt',    text:'Thời khóa biểu' },
            { id:'plans',      icon:'calendar-check',  text:'Kế hoạch dạy học' },
            { id:'attendance', icon:'clipboard-check', text:'Điểm danh' },
            { id:'scores',     icon:'star',            text:'Quản lý Điểm' },
            { id:'finance',    icon:'dollar-sign',     text:'Quản lý Tài chính' },
            { id:'users',      icon:'users-cog',       text:'Quản lý Users' },
            { id:'hocba',      icon:'book-open',       text:'Học bạ học sinh' },
            { id:'evaluations',icon:'clipboard-list',  text:'Đánh giá & Biểu mẫu BGH' },
            { id:'yearend',    icon:'chart-bar',       text:'Tổng kết năm học' },
            { id:'schoolyear',     icon:'cog',             text:'Cài đặt năm học' },
            { id:'notifications',   icon:'bell',            text:'Thông báo' },
            { id:'news',            icon:'newspaper',       text:'Tin tức & Sự kiện' }
        ],
        teacher: [
            { id:'dashboard',  icon:'chart-line',      text:'Dashboard' },
            { id:'students',   icon:'user-graduate',   text:'Học sinh lớp mình' },
            { id:'timetable',  icon:'calendar-alt',    text:'Thời khóa biểu' },
            { id:'plans',      icon:'calendar-check',  text:'Kế hoạch dạy học' },
            { id:'attendance', icon:'clipboard-check', text:'Điểm danh' },
            { id:'scores',     icon:'star',            text:'Quản lý Điểm' },
            { id:'finance',    icon:'dollar-sign',     text:'Danh sách đóng tiền' },
            { id:'hocba',         icon:'book-open',       text:'Học bạ học sinh' },
            { id:'evaluations',icon:'clipboard-list',  text:'Đánh giá & Biểu mẫu' },
            { id:'notifications',  icon:'bell',            text:'Thông báo' },
            { id:'news',           icon:'newspaper',       text:'Tin tức & Sự kiện' }
        ],
        subject_teacher: [
            { id:'dashboard',       icon:'chart-line',      text:'Dashboard' },
            { id:'subject-scores',  icon:'star',            text:'Nhập Điểm Bộ Môn' },
            { id:'timetable',       icon:'calendar-alt',    text:'Thời khóa biểu' },
            { id:'plans',           icon:'calendar-check',  text:'Kế hoạch dạy học' },
            { id:'evaluations',     icon:'clipboard-list',  text:'Đánh giá & Biểu mẫu' },
            { id:'notifications',   icon:'bell',            text:'Thông báo' },
            { id:'news',            icon:'newspaper',       text:'Tin tức & Sự kiện' }
        ],
        parent: [
            { id:'dashboard',  icon:'chart-line', text:'Dashboard' },
            { id:'child-info', icon:'user',        text:'Thông tin con' },
            { id:'timetable',     icon:'calendar-alt', text:'Thời khóa biểu' },
            { id:'plans',         icon:'calendar-check', text:'Kế hoạch học tập' },
            { id:'notifications',  icon:'bell',          text:'Thông báo' },
            { id:'news',           icon:'newspaper',      text:'Tin tức & Sự kiện' }
        ]
    };

    const items = menuItems[window.userRole] || menuItems['parent'];
    const demoPrefix = window.IS_DEMO_MODE ? `
        <div style="margin:0 12px 12px;padding:10px;border-radius:10px;background:#7c2d12;color:#fed7aa;font-size:.82rem">
            <i class="fas fa-flask"></i> Dữ liệu demo giả
        </div>` : '';
    document.getElementById('main-menu').innerHTML = demoPrefix + items.map(item => `
        <a href="${buildRouteUrl(item.id, window.userRole)}" class="menu-item" onclick="event.preventDefault(); changeView('${item.id}')">
            <i class="fas fa-${item.icon}"></i> ${item.text}
        </a>
    `).join('');
}

// ═══════════════════════════════════════════════════════
// DATA LOADING
// ═══════════════════════════════════════════════════════
window._dbUnsubs = [];
function classDbKey(cls) { return String(cls || '').trim().replace(/\//g, '_').replace(/[.#$\[\]]/g, '_'); }

function loadData() {
    window._studentsDataReady = false;
    let renderDebounce = null;
    const debouncedRender = fn => { clearTimeout(renderDebounce); renderDebounce = setTimeout(fn, 120); };
    const rerenderDashboardIfActive = () => {
        if (document.getElementById('content')?.dataset.view === 'dashboard') {
            debouncedRender(() => renderDashboard());
        }
    };

    // ── SUBJECT_TEACHER: chỉ tải học sinh thuộc các khối được phân công ────────
    if (window.userRole === 'subject_teacher') {
        const grades = [...new Set((window.teacherGrades || []).map(String).filter(g => /^[1-5]$/.test(g)))];
        const gradeBuckets = new Map();
        window.localData.students = {};
        window._allStudents = [];

        const loadedGrades = new Set();
        if (!grades.length) {
            markStudentsDataReady();
            rerenderDashboardIfActive();
        }

        grades.forEach(grade => {
            const gradeQuery = query(ref(db, 'students'), orderByChild('currentGrade'), equalTo(grade));
            const unsubscribe = onValue(gradeQuery, snap => {
                gradeBuckets.set(grade, snap.val() || {});
                window.localData.students = Object.assign({}, ...gradeBuckets.values());
                window._allStudents = Object.values(window.localData.students);
                loadedGrades.add(grade);
                if (loadedGrades.size === grades.length) {
                    markStudentsDataReady();
                    rerenderDashboardIfActive();
                }
                const currentView = document.getElementById('content')?.dataset.view;
                if (currentView === 'subject-scores') {
                    debouncedRender(() => window.renderSubjectScores?.());
                } else if (currentView === 'timetable') {
                    debouncedRender(() => window.renderTimetable?.());
                }
            });
            window._dbUnsubs.push(unsubscribe);
        });

        readYearScoped(timetablePath(), 'timetables').then(({value}) => {
            window.localData.timetables = value || {};
            if (document.getElementById('content')?.dataset.view === 'timetable') {
                debouncedRender(() => window.renderTimetable?.());
            }
        }).catch(() => {});
        get(child(ref(db), 'scheduleSettings')).then(snap => {
            window.localData.scheduleSettings = snap.val();
            window.TIMETABLE_PERIODS = window.localData.scheduleSettings || window.DEFAULT_PERIODS;
            if (document.getElementById('content')?.dataset.view === 'timetable') {
                debouncedRender(() => window.renderTimetable?.());
            }
        }).catch(() => {});
        return;
    }

    if (window.userRole === 'parent') {
        const sid  = window.parentStudentId;  // mã code, VD: HS2026-001
        const sKey = window.parentStudentKey; // push key nếu có

        // Guard: chỉ load 1 lần, tránh loop vô hạn
        if (window._parentStudentLoading) return;
        window._parentStudentLoading = false;

        const loadParentStudent = async () => {
            if (window._parentStudentLoading) return;
            window._parentStudentLoading = true;
            try {
                let found = {};

                // Thử 1: đọc thẳng bằng sKey nếu khác sid
                if (sKey && sKey !== sid) {
                    const snap = await get(child(ref(db), `students/${sKey}`));
                    if (snap.exists()) found = { [sKey]: snap.val() };
                }

                // Thử 2: dùng sid làm key trực tiếp
                if (!Object.keys(found).length) {
                    const snap = await get(child(ref(db), `students/${sid}`));
                    if (snap.exists()) found = { [sid]: snap.val() };
                }

                // Không tải toàn bộ node students để dò mã: bảo vệ dữ liệu học sinh khác.
                // Admin phải gán studentKey chính xác trong hồ sơ tài khoản phụ huynh.
                if (!Object.keys(found).length) {
                    console.warn('Tài khoản phụ huynh chưa có studentKey hợp lệ.');
                }

                window.localData.students = found;
            } catch(e) {
                console.warn('loadParentStudent error:', e.message);
                window.localData.students = {};
            }
            window._allStudents = Object.values(window.localData.students);
            markStudentsDataReady();
            rerenderDashboardIfActive();
            window._parentStudentLoading = false;

            // Chỉ render nếu đang ở đúng trang — tránh loop
            const view = document.getElementById('content')?.dataset.view;
            if (view === 'child-info') renderChildInfo();
        };

        loadParentStudent();
        get(child(ref(db), 'scheduleSettings')).then(snap => {
            window.localData.scheduleSettings = snap.val();
            window.TIMETABLE_PERIODS = window.localData.scheduleSettings || window.DEFAULT_PERIODS;
        }).catch(() => {});
        readYearScoped(timetablePath(), 'timetables').then(({value}) => {
            window.localData.timetables = value || {};
        }).catch(() => {});
        // V5: không tải toàn bộ tài chính cho phụ huynh; phụ huynh chỉ đọc trạng thái đóng tiền của con.
        window.localData.finance = {};
        return;
    }

    // ── ADMIN / GVCN: chỉ tải đúng phạm vi học sinh được phép ───────────────
    let firstLoad = true;
    const studentSource = window.userRole === 'teacher'
        ? query(
            ref(db, 'students'),
            orderByChild('currentClassKey'),
            equalTo(window.teacherClassKey || classDbKey(window.teacherClass || ''))
        )
        : ref(db, 'students');
    const unsubStudents = onValue(studentSource, snap => {
        const raw = snap.val() || {};
        window.localData.students = window.userRole === 'teacher'
            ? Object.fromEntries(Object.entries(raw).filter(([,student]) =>
                (student.classRoom || student.class || '') === window.teacherClass
                || student.currentClassKey === window.teacherClassKey
            ))
            : raw;
        window._allStudents = Object.values(window.localData.students);
        markStudentsDataReady();
        const view = document.getElementById('content')?.dataset.view;
        if (view === 'dashboard') {
            debouncedRender(() => renderDashboard());
        } else if (!firstLoad) {
            if (view === 'students') debouncedRender(() => applyStudentFilter());
            else if (view === 'scores') debouncedRender(() => renderScores());
            else if (view === 'phieulienlac') debouncedRender(() => renderPhieuLienLac());
        }
        firstLoad = false;
    });
    window._dbUnsubs.push(unsubStudents);

    // V5.1: node `scores` là dữ liệu cũ và Rules chỉ cho Admin đọc.
    // Điểm hiện hành được lưu tại `hocba/{studentKey}/{yearKey}/...`, vì vậy
    // không tải node `scores` khi giáo viên đăng nhập.
    window.localData.scores = {};
    if (window.userRole === 'admin') {
        get(child(ref(db), 'finance')).then(snap => {
            const all = snap.val() || {};
            window.localData.finance = Object.fromEntries(Object.entries(all).filter(([,tx]) => financeMatchesYear(tx)));
        }).catch(() => { window.localData.finance = {}; });
    } else {
        window.localData.finance = {};
    }
    readYearScoped(timetablePath(), 'timetables').then(({value}) => {
        window.localData.timetables = value || {};
    });
    get(child(ref(db), 'scheduleSettings')).then(snap => {
        window.localData.scheduleSettings = snap.val();
        window.TIMETABLE_PERIODS = window.localData.scheduleSettings || window.DEFAULT_PERIODS;
    });
}

async function reloadSectionData(view) {
    const isParent = window.userRole === 'parent';
    if (view === 'hocba') {
        // V5.1: không đọc node `scores` cũ. Học bạ tự đọc dữ liệu theo từng
        // học sinh tại `hocba/{studentKey}/{yearKey}`.
        if (isParent) return;
        window.localData.scores = {};
    } else if (view === 'finance') {
        if (window.userRole !== 'admin') { window.localData.finance = {}; window._cachedPaymentStatus = null; return; }
        const snap = await get(child(ref(db), 'finance'));
        const all = snap.val() || {};
        window.localData.finance = Object.fromEntries(Object.entries(all).filter(([,tx]) => financeMatchesYear(tx)));
        window._cachedPaymentStatus = null;
    } else if (view === 'scores') {
        // V5.1: màn hình điểm sử dụng trực tiếp node `hocba`, không phụ thuộc
        // node `scores` cũ vốn chỉ dành cho Admin trong Firebase Rules V5.
        if (isParent) return;
        window.localData.scores = {};
    } else if (view === 'timetable') {
        const [ttResult, ssSnap] = await Promise.all([
            readYearScoped(timetablePath(), 'timetables'),
            get(child(ref(db), 'scheduleSettings'))
        ]);
        window.localData.timetables = ttResult.value || {};
        window.localData.scheduleSettings = ssSnap.val();
        window.TIMETABLE_PERIODS = window.localData.scheduleSettings || window.DEFAULT_PERIODS;
    } else if (view === 'plans') {
        if (typeof window.loadPlansData === 'function') {
            await window.loadPlansData();
        }
    }
}

// ═══════════════════════════════════════════════════════
// VIEW ROUTING
// ═══════════════════════════════════════════════════════
window.changeView = async (view, options = {}) => {
    const { pushState = true, replaceState = false, skipUrl = false } = options;
    const content = document.getElementById('content');

    if (window.IS_DEMO_MODE) {
        if (!skipUrl) {
            const targetUrl = `/demo/${VIEW_TO_SLUG.admin[view] || view}`;
            if (pushState && window.location.pathname !== targetUrl) {
                history.pushState({ view, demo: true }, '', targetUrl + window.location.search);
            } else if (replaceState) {
                history.replaceState({ view, demo: true }, '', targetUrl + window.location.search);
            }
        }
        if (content) content.dataset.view = view;
        return renderDemoView(view);
    }

    if (!authorizeView(view)) return;

    // Cập nhật đường dẫn trên thanh địa chỉ trình duyệt
    if (!skipUrl && (window.currentUser || window.IS_DEMO_MODE)) {
        const targetUrl = buildRouteUrl(view, window.userRole);
        if (pushState && window.location.pathname !== targetUrl) {
            history.pushState({ view }, '', targetUrl + window.location.search);
        } else if (replaceState) {
            history.replaceState({ view }, '', targetUrl + window.location.search);
        }
    }

    // Active menu highlight
    document.querySelectorAll('.menu-item').forEach(x => x.classList.remove('active'));
    try {
        if (typeof event !== 'undefined' && event?.target?.closest) {
            const mi = event.target.closest('.menu-item');
            if (mi) mi.classList.add('active');
        } else {
            document.querySelectorAll('.menu-item').forEach(el => {
                if (el.getAttribute('onclick')?.includes(`'${view}'`)) el.classList.add('active');
            });
        }
    } catch(e) { /* ignore */ }

    if (content) content.dataset.view = view;

    const titles = {
        dashboard:   'Dashboard',
        students:    window.userRole === 'teacher' ? 'Học sinh lớp mình' : 'Quản lý Học sinh',
        attendance:  'Điểm danh',
        scores:      'Quản lý Điểm',
        'subject-scores': 'Nhập Điểm Bộ Môn',
        finance:     window.userRole === 'teacher' ? 'Danh sách đóng tiền' : 'Quản lý Tài chính',
        timetable:   'Thời khóa biểu',
        users:       'Quản lý Users',
        'child-info':'Thông tin con',
        'hocba':         'Học bạ học sinh',
        'yearend':       'Tổng kết năm học',
        'schoolyear':    'Cài đặt năm học',
        'notifications': 'Thông báo',
        'news':          'Tin tức & Sự kiện',
        'phieulienlac':  'Phiếu liên lạc',
        'evaluations':   'Đánh giá & Biểu mẫu BGH',
        'plans':         window.userRole === 'parent' ? 'Kế hoạch học tập' : 'Kế hoạch dạy học & Giáo dục',
    };
    const title = titles[view] || 'Dashboard';
    const pageTitleEl = document.getElementById('page-title');
    if (pageTitleEl) pageTitleEl.textContent = title;
    document.title = `${title} — FMA Nam Hòa`;

    if (view === 'phieulienlac' && !['admin','teacher'].includes(window.userRole)) {
        document.getElementById('content').innerHTML = `<div class="card" style="text-align:center;padding:36px"><i class="fas fa-lock" style="font-size:2rem;color:#dc2626"></i><h3>Không có quyền truy cập</h3><p>Phiếu liên lạc chỉ dành cho Ban giám hiệu/Quản trị và giáo viên chủ nhiệm.</p></div>`;
        return;
    }

    try {
        await reloadSectionData(view);
    } catch (error) {
        console.error(`reloadSectionData(${view}) error:`, error);
        document.getElementById('content').innerHTML = `
            <div class="card" style="text-align:center;padding:34px">
                <i class="fas fa-exclamation-triangle" style="font-size:2rem;color:#dc2626"></i>
                <h3 style="margin:12px 0 6px;color:#1e293b">Không tải được dữ liệu</h3>
                <p style="color:#64748b">${error?.message || 'Lỗi không xác định'}</p>
                <button class="btn btn-primary" style="margin-top:14px" onclick="changeView('${view}')">
                    <i class="fas fa-redo"></i> Thử lại
                </button>
            </div>`;
        return;
    }

    if      (view === 'dashboard')  renderDashboard();
    else if (view === 'students')   renderStudents();
    else if (view === 'attendance') renderAttendance();
    else if (view === 'scores')     renderScores();
    else if (view === 'finance')    renderFinance();
    else if (view === 'users')      renderUsers();
    else if (view === 'child-info') {
        if (!window.localData.students || Object.keys(window.localData.students).length === 0) {
            document.getElementById('content').innerHTML = `
                <div class="card" style="text-align:center;padding:40px">
                    <i class="fas fa-spinner fa-spin" style="font-size:2rem;color:var(--primary);margin-bottom:15px;display:block"></i>
                    <p style="color:#64748b">Đang tải thông tin học sinh...</p>
                </div>`;
            // loadParentStudent() sẽ tự gọi renderChildInfo() khi data về
        } else {
            renderChildInfo();
        }
    }
    else if (view === 'timetable')  renderTimetable();
    else if (view === 'hocba')      renderHocBa();
    else if (view === 'yearend')    renderYearEndSummary();
    else if (view === 'schoolyear')    renderSchoolYear();
    else if (view === 'notifications') { markAllNotifRead(); renderNotifications(); }
    else if (view === 'news')          renderNews();
    else if (view === 'phieulienlac')  renderPhieuLienLac();
    else if (view === 'evaluations')   renderEvaluations();
    else if (view === 'plans')         renderPlans();
    else if (view === 'subject-scores') {
        if (window.userRole === 'subject_teacher') {
            const { renderSubjectScores } = await import('./subjectscores.js?v=5.8.0');
            renderSubjectScores();
        }
    }
};

// ── Xử lý khi người dùng ấn nút Back / Forward trên trình duyệt ─────────────
window.addEventListener('popstate', async () => {
    if (!window.currentUser && !window.IS_DEMO_MODE) {
        if (window.location.pathname !== '/login') {
            history.replaceState(null, '', '/login');
        }
        document.getElementById('auth-screen').style.display = 'flex';
        document.getElementById('app-container').style.display = 'none';
        return;
    }

    const route = parseRouteFromPath(window.location.pathname);
    if (route.view && canAccessView(route.view, window.userRole)) {
        await changeView(route.view, { pushState: false });
    } else if (route.isLogin) {
        // Đã đăng nhập nhưng back về /login: giữ lại ở dashboard
        const defaultView = 'dashboard';
        const targetUrl = buildRouteUrl(defaultView, window.userRole);
        history.replaceState({ view: defaultView }, '', targetUrl + window.location.search);
        await changeView(defaultView, { pushState: false, skipUrl: true });
    }
});

// ═══════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════
async function renderDashboard() {
    // ── Phụ huynh: dashboard riêng, chuyển thẳng sang thông tin con ──
    if (window.userRole === 'subject_teacher') {
        const sub   = window.teacherSubject  || '(chưa phân công)';
        const gradesArr = window.teacherGrades
            ? (Array.isArray(window.teacherGrades) ? window.teacherGrades : Object.values(window.teacherGrades))
            : [];
        const grades = gradesArr.length ? gradesArr.join(', ') : '(tất cả)';
        document.getElementById('content').innerHTML = `
            <div style="background:#1e3a8a;color:white;border-radius:12px;padding:18px 24px;
                        margin-bottom:20px;display:flex;align-items:center;gap:20px">
                <div>
                    <div style="font-size:0.72rem;opacity:0.75;letter-spacing:.06em">MÔN PHỤ TRÁCH</div>
                    <div style="font-size:1.4rem;font-weight:800">${sub}</div>
                </div>
                <div style="width:1px;background:rgba(255,255,255,0.2);height:40px"></div>
                <div>
                    <div style="font-size:0.72rem;opacity:0.75">KHỐI</div>
                    <div style="font-size:1rem;font-weight:700">📚 Khối ${grades}</div>
                </div>
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px">
                <div class="card" style="cursor:pointer;border-left:4px solid #2563eb;transition:transform .2s"
                     onclick="changeView('subject-scores')"
                     onmouseover="this.style.transform='translateY(-3px)'"
                     onmouseout="this.style.transform=''">
                    <div style="font-size:2rem;margin-bottom:10px">⭐</div>
                    <div style="font-weight:700;font-size:1rem;color:#1e293b">Nhập Điểm Bộ Môn</div>
                    <div style="color:#64748b;font-size:0.85rem;margin-top:4px">Nhập điểm môn ${sub}</div>
                </div>
                <div class="card" style="cursor:pointer;border-left:4px solid #7c3aed;transition:transform .2s"
                     onclick="changeView('timetable')"
                     onmouseover="this.style.transform='translateY(-3px)'"
                     onmouseout="this.style.transform=''">
                    <div style="font-size:2rem;margin-bottom:10px">📅</div>
                    <div style="font-weight:700;font-size:1rem;color:#1e293b">Thời khóa biểu</div>
                    <div style="color:#64748b;font-size:0.85rem;margin-top:4px">Lịch dạy của bạn</div>
                </div>
                <div class="card" style="cursor:pointer;border-left:4px solid #d97706;transition:transform .2s"
                     onclick="changeView('notifications')"
                     onmouseover="this.style.transform='translateY(-3px)'"
                     onmouseout="this.style.transform=''">
                    <div style="font-size:2rem;margin-bottom:10px">🔔</div>
                    <div style="font-weight:700;font-size:1rem;color:#1e293b">Thông báo</div>
                    <div style="color:#64748b;font-size:0.85rem;margin-top:4px">Thông báo từ nhà trường</div>
                </div>
            </div>`;
        return;
    }

    if (window.userRole === 'parent') {
        const sy       = window._currentSchoolYear || '';
        const sem      = window._currentSemester   || 'hk1';
        const semLabel = sem === 'hk1' ? 'Học kỳ 1' : 'Học kỳ 2';
        document.getElementById('content').innerHTML = `
            <div style="background:#1e3a8a;color:white;border-radius:12px;padding:18px 24px;
                        margin-bottom:20px;display:flex;align-items:center;gap:20px">
                <div>
                    <div style="font-size:0.72rem;opacity:0.75;letter-spacing:.06em">NĂM HỌC</div>
                    <div style="font-size:1.5rem;font-weight:800">${sy || '—'}</div>
                </div>
                <div style="width:1px;background:rgba(255,255,255,0.2);height:40px"></div>
                <div>
                    <div style="font-size:0.72rem;opacity:0.75">HỌC KỲ</div>
                    <div style="font-size:1rem;font-weight:700">📚 ${semLabel}</div>
                </div>
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px">
                <div class="card" style="cursor:pointer;border-left:4px solid #2563eb;transition:transform .2s"
                     onclick="changeView('child-info')" onmouseover="this.style.transform='translateY(-3px)'"
                     onmouseout="this.style.transform=''">
                    <div style="font-size:2rem;margin-bottom:10px">👤</div>
                    <div style="font-weight:700;font-size:1rem;color:#1e293b">Thông tin con</div>
                    <div style="color:#64748b;font-size:0.85rem;margin-top:4px">Xem thông tin, điểm số, học bạ</div>
                </div>
                <div class="card" style="cursor:pointer;border-left:4px solid #7c3aed;transition:transform .2s"
                     onclick="changeView('timetable')" onmouseover="this.style.transform='translateY(-3px)'"
                     onmouseout="this.style.transform=''">
                    <div style="font-size:2rem;margin-bottom:10px">📅</div>
                    <div style="font-weight:700;font-size:1rem;color:#1e293b">Thời khóa biểu</div>
                    <div style="color:#64748b;font-size:0.85rem;margin-top:4px">Lịch học của lớp con</div>
                </div>
                <div class="card" style="cursor:pointer;border-left:4px solid #d97706;transition:transform .2s"
                     onclick="changeView('notifications')" onmouseover="this.style.transform='translateY(-3px)'"
                     onmouseout="this.style.transform=''">
                    <div style="font-size:2rem;margin-bottom:10px">🔔</div>
                    <div style="font-weight:700;font-size:1rem;color:#1e293b">Thông báo</div>
                    <div style="color:#64748b;font-size:0.85rem;margin-top:4px">Thông báo từ nhà trường</div>
                </div>
                <div class="card" style="cursor:pointer;border-left:4px solid #16a34a;transition:transform .2s"
                     onclick="changeView('news')" onmouseover="this.style.transform='translateY(-3px)'"
                     onmouseout="this.style.transform=''">
                    <div style="font-size:2rem;margin-bottom:10px">📰</div>
                    <div style="font-weight:700;font-size:1rem;color:#1e293b">Tin tức & Sự kiện</div>
                    <div style="color:#64748b;font-size:0.85rem;margin-top:4px">Hoạt động nhà trường</div>
                </div>
            </div>`;
        return;
    }

    if (['admin', 'teacher'].includes(window.userRole) && !window._studentsDataReady) {
        document.getElementById('content').innerHTML = `
            <div class="card" style="text-align:center;padding:40px">
                <i class="fas fa-spinner fa-spin" style="font-size:2rem;color:var(--primary);margin-bottom:15px;display:block"></i>
                <p style="color:#475569">Đang tải dữ liệu học sinh...</p>
            </div>`;
        return;
    }

    const classMatchesTeacher = s => !window.teacherClass || s?.classRoom === window.teacherClass || s?.class === window.teacherClass;
    const allScopedStudents = Object.values(window.localData.students || {}).filter(s =>
        window.userRole !== 'teacher' || classMatchesTeacher(s)
    );
    let students = activeStudentValues();
    if (window.userRole === 'teacher' && window.teacherClass)
        students = students.filter(classMatchesTeacher);

    const sy         = window._currentSchoolYear || '';
    const sem        = window._currentSemester   || 'hk1';
    const semLabel   = sem === 'hk1' ? 'Học kỳ 1' : 'Học kỳ 2';
    const isAdmin    = window.userRole === 'admin';
    const isTeacher  = window.userRole === 'teacher';

    const totalStudents  = allScopedStudents.length;
    const activeStudents = students.length;
    const graduated      = allScopedStudents.filter(s => s?.status === 'graduated').length;
    const numClasses     = [...new Set(students.map(s => s.classRoom||s.class).filter(Boolean))].length;

    // Thống kê tài chính (từ localData.finance)
    const allTx       = Object.values(window.localData.finance || {});
    const totalIncome = allTx.filter(t => t.type === 'income').reduce((s,t) => s + (t.amount||0), 0);

    // Thống kê đóng học phí (paymentStatus)
    let paidCount = 0;
    try {
        if (isAdmin) {
            const psSnap = await window.get(window.child(window.ref(window.db), paymentStatusPath()));
            const psData = psSnap.val() || {};
            paidCount = students.filter(s => psData[s.id]?.isPaid || psData[s.code]?.isPaid).length;
        } else if (isTeacher && window.teacherClass) {
            const psSnap = await window.get(
                window.child(window.ref(window.db), paymentStatusClassPath(window.teacherClass))
            );
            const psData = psSnap.val() || {};
            paidCount = students.filter(s => psData[s.code || s.id]?.isPaid === true).length;
        }
    } catch(e) {}

    // Thống kê vắng KP hôm nay (từ attendance hôm nay)
    const today = new Date().toISOString().split('T')[0];
    let absentToday = 0;
    try {
        if (window.userRole !== 'parent') {
            const classes = [...new Set(students.map(s=>s.classRoom||s.class).filter(Boolean))];
            const attYear = (window._currentSchoolYear || '').replace('-','_') ||
                (() => { const n=new Date(),y=n.getFullYear(); return n.getMonth()>=7?`${y}_${y+1}`:`${y-1}_${y}`; })();
            const snaps = await Promise.all(
                classes.map(cls =>
                    window.get(window.child(window.ref(window.db), `attendance/${attYear}/${classDbKey(cls)}/${today}`))
                )
            );
            snaps.forEach(snap => {
                const recs = snap.val() || {};
                Object.values(recs).forEach(r => { if (r.status === 'kp') absentToday++; });
            });
        }
    } catch(e) {}

    // Thống kê promotionStatus
    let lenLop = 0, oLai = 0, chuaXN = 0;
    try {
        const prData = await loadPromotionStatusForYear(window._currentSchoolYear || getSchoolYear());
        students.forEach(s => {
            const st = prData[s.id]?.status || prData[s.code]?.status || '';
            if (st === 'len_lop') lenLop++;
            else if (st === 'o_lai') oLai++;
            else chuaXN++;
        });
    } catch(e) { chuaXN = activeStudents; }

    const unpaidCount = activeStudents - paidCount;
    const paidPct     = activeStudents > 0 ? Math.round(paidCount / activeStudents * 100) : 0;

    document.getElementById('content').innerHTML = `
        <!-- Năm học + học kỳ -->
        <div style="display:flex;gap:12px;align-items:stretch;margin-bottom:16px;flex-wrap:wrap">
            <div style="background:#1e3a8a;color:white;border-radius:12px;padding:14px 22px;
                        display:flex;align-items:center;gap:16px;flex:1;min-width:240px">
                <div>
                    <div style="font-size:0.72rem;opacity:0.75;letter-spacing:.06em">NĂM HỌC</div>
                    <div style="font-size:1.5rem;font-weight:800">${sy || '—'}</div>
                </div>
                <div style="width:1px;background:rgba(255,255,255,0.2);height:40px"></div>
                <div>
                    <div style="font-size:0.72rem;opacity:0.75">HỌC KỲ</div>
                    <div style="font-size:1rem;font-weight:700">📚 ${semLabel}</div>
                </div>
                ${isAdmin ? `
                <div style="margin-left:auto">
                    <button class="btn btn-sm" style="background:rgba(255,255,255,0.2);color:white;border:none"
                        onclick="changeView('schoolyear')">
                        <i class="fas fa-cog"></i> Cài đặt
                    </button>
                </div>` : ''}
            </div>
        </div>

        <!-- Stat cards hàng 1: HS -->
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:16px">
            <div class="stat-card" style="border-left-color:var(--primary-light)">
                <div class="label">${isTeacher ? 'HS lớp mình' : 'Tổng số học sinh'}</div>
                <div class="value" style="color:var(--primary-color)">${totalStudents}</div>
                <div class="sub-text"><i class="fas fa-user-check" style="color:var(--success-color)"></i> Đang học: <b>${activeStudents}</b></div>
            </div>
            <div class="stat-card" style="border-left-color:var(--success-color)">
                <div class="label">Số lớp học</div>
                <div class="value" style="color:var(--success-color)">${numClasses}</div>
                <div class="sub-text">${graduated > 0 ? `<span style="color:#7c3aed"><i class="fas fa-graduation-cap"></i> Tốt nghiệp: <b>${graduated}</b></span>` : '<span style="color:var(--text-muted)">Hoạt động đồng bộ</span>'}</div>
            </div>
            <div class="stat-card" style="border-left-color:var(--warning-color)">
                <div class="label">Vắng KP hôm nay</div>
                <div class="value" style="color:${absentToday>0?'var(--danger-color)':'var(--success-color)'}">${absentToday}</div>
                <div class="sub-text"><i class="fas fa-calendar-day"></i> Ngày: ${today}</div>
            </div>
            <div class="stat-card" style="border-left-color:#7c3aed">
                <div class="label">Lên lớp xác nhận</div>
                <div class="value" style="color:#7c3aed">${lenLop}</div>
                <div class="sub-text">Ở lại: <b>${oLai}</b> &bull; Chưa XN: <b>${chuaXN}</b></div>
            </div>
        </div>

        <!-- Stat cards hàng 2: Tài chính (admin/teacher) -->
        ${(isAdmin || isTeacher) ? `
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:16px">
            <div class="stat-card" style="border-left-color:var(--success-color)">
                <div class="label">Tổng thu học phí</div>
                <div class="value" style="font-size:1.4rem;color:var(--success-color)">
                    ${totalIncome > 0 ? (totalIncome/1000000).toFixed(1) + ' triệu VNĐ' : '—'}
                </div>
                <div class="sub-text"><i class="fas fa-wallet"></i> Năm học ${sy}</div>
            </div>
            <div class="stat-card" style="border-left-color:var(--primary-light)">
                <div class="label">Tỷ lệ đóng học phí</div>
                <div class="value" style="color:var(--primary-color)">${paidCount}/${activeStudents}</div>
                <div style="margin-top:6px">
                    <div style="background:#e2e8f0;border-radius:6px;height:6px;overflow:hidden">
                        <div style="background:linear-gradient(90deg, #3b82f6, #059669);width:${paidPct}%;height:100%;border-radius:6px"></div>
                    </div>
                    <div class="sub-text" style="margin-top:4px;display:flex;justify-content:space-between">
                        <span>Tiến độ thu</span>
                        <b>${paidPct}%</b>
                    </div>
                </div>
            </div>
            <div class="stat-card" style="border-left-color:var(--danger-color)">
                <div class="label">Chưa hoàn thành phí</div>
                <div class="value" style="color:${unpaidCount>0?'var(--danger-color)':'var(--success-color)'}">${unpaidCount}</div>
                <div class="sub-text"><i class="fas fa-clock"></i> Học sinh cần đối soát</div>
            </div>
        </div>` : ''}

        <!-- Biểu đồ phân bố học sinh theo lớp -->
        <div class="card" style="margin-bottom:16px">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
                <h3 style="font-size:1rem;font-weight:700;color:var(--text-main);display:flex;align-items:center;gap:8px">
                    <i class="fas fa-chart-bar" style="color:var(--primary-light)"></i> Phân Bố Học Sinh Theo Lớp Học
                </h3>
                <span class="badge badge-info">${activeStudents} Học sinh</span>
            </div>
            <div style="height:200px;position:relative">
                <canvas id="dashboardClassChart"></canvas>
            </div>
        </div>

        <!-- Quick actions -->
        <div class="card" style="padding:14px 18px">
            <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
                <span style="color:var(--text-muted);font-size:0.84rem;font-weight:700;margin-right:4px">Truy cập nhanh:</span>
                <button class="btn btn-outline btn-sm" onclick="changeView('students')">
                    <i class="fas fa-users" style="color:var(--primary-light)"></i> Học sinh
                </button>
                <button class="btn btn-outline btn-sm" onclick="changeView('scores')">
                    <i class="fas fa-star" style="color:var(--warning-color)"></i> Điểm số
                </button>
                <button class="btn btn-outline btn-sm" onclick="changeView('attendance')">
                    <i class="fas fa-clipboard-check" style="color:var(--success-color)"></i> Điểm danh
                </button>
                <button class="btn btn-outline btn-sm" onclick="changeView('hocba')">
                    <i class="fas fa-book-open" style="color:#7c3aed"></i> Học bạ
                </button>
                ${isAdmin ? `
                <button class="btn btn-outline btn-sm" onclick="changeView('finance')">
                    <i class="fas fa-dollar-sign" style="color:var(--success-color)"></i> Tài chính
                </button>
                <button class="btn btn-primary btn-sm" onclick="changeView('yearend')">
                    <i class="fas fa-chart-bar"></i> Tổng kết năm học
                </button>` : ''}
            </div>
        </div>
    `;

    // Render Chart.js biểu đồ phân bố lớp
    try {
        const classMap = {};
        students.forEach(s => {
            const c = s.classRoom || s.class || 'Khác';
            classMap[c] = (classMap[c] || 0) + 1;
        });
        const labels = Object.keys(classMap).sort();
        const data = labels.map(l => classMap[l]);
        if (labels.length && typeof Chart !== 'undefined') {
            const canvas = document.getElementById('dashboardClassChart');
            if (canvas) {
                new Chart(canvas, {
                    type: 'bar',
                    data: {
                        labels,
                        datasets: [{
                            label: 'Số lượng học sinh',
                            data,
                            backgroundColor: 'rgba(37, 99, 235, 0.75)',
                            borderColor: '#1e40af',
                            borderWidth: 1.5,
                            borderRadius: 6,
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: { beginAtZero: true, ticks: { precision: 0, color: '#64748b' } },
                            x: { ticks: { color: '#64748b' } }
                        },
                        plugins: {
                            legend: { display: false },
                            tooltip: {
                                callbacks: {
                                    label: ctx => ` ${ctx.raw} học sinh`
                                }
                            }
                        }
                    }
                });
            }
        }
    } catch (err) {
        console.warn('Dashboard chart error:', err);
    }
}

// ═══════════════════════════════════════════════════════
// MODAL HELPER
// ═══════════════════════════════════════════════════════
window.closeModal = (id) => {
    document.getElementById(id).style.display = 'none';
};

// ═══════════════════════════════════════════════════════
// V5.32.2 — Menu Phiếu liên lạc hiển thị chắc chắn trên bảng điều khiển
// ═══════════════════════════════════════════════════════
function ensurePhieuLienLacMenuItem() {
    if (!['admin','teacher'].includes(window.userRole)) {
        document.querySelectorAll('[data-view="phieulienlac"], #menu-phieulienlac').forEach(el => (el.closest('li') || el).remove());
        return;
    }
    const exists = document.querySelector(
        '[data-view="phieulienlac"], [data-target="phieulienlac"], [onclick*="phieulienlac"], #menu-phieulienlac'
    );
    if (exists) return;

    const menu =
        document.getElementById('main-menu') ||
        document.querySelector('.menu, .sidebar-menu, nav ul, aside ul, .sidebar nav, #sidebar nav, aside nav') ||
        document.querySelector('aside, #sidebar, .sidebar, nav');

    if (!menu) return;

    const isList = menu.tagName === 'UL' || menu.tagName === 'OL';
    const item = document.createElement(isList ? 'li' : 'a');

    if (isList) {
        item.innerHTML = `
            <a href="#" id="menu-phieulienlac" class="menu-item" data-view="phieulienlac">
                <i class="fas fa-file-signature"></i>
                <span>Phiếu liên lạc</span>
            </a>`;
        item.querySelector('a').addEventListener('click', (e) => {
            e.preventDefault();
            if (typeof window.changeView === 'function') window.changeView('phieulienlac');
            else renderPhieuLienLac();
        });
    } else {
        item.href = '#';
        item.id = 'menu-phieulienlac';
        item.className = 'menu-item';
        item.dataset.view = 'phieulienlac';
        item.innerHTML = '<i class="fas fa-file-signature"></i><span>Phiếu liên lạc</span>';
        item.addEventListener('click', (e) => {
            e.preventDefault();
            if (typeof window.changeView === 'function') window.changeView('phieulienlac');
            else renderPhieuLienLac();
        });
    }

    const menuItems = Array.from(menu.querySelectorAll('.menu-item, a, li'));
    const hocbaItem = menuItems.find(x => /Học bạ/i.test(x.textContent || ''));
    const tongketItem = menuItems.find(x => /Tổng kết/i.test(x.textContent || ''));

    const refItem = hocbaItem || tongketItem;
    if (refItem) {
        const container = refItem.closest('li') || refItem;
        if (hocbaItem && container.parentNode) container.parentNode.insertBefore(item, container.nextSibling);
        else if (tongketItem && container.parentNode) container.parentNode.insertBefore(item, container);
        else menu.appendChild(item);
    } else {
        menu.appendChild(item);
    }
}

function installPhieuLienLacRouteWrapper() {
    if (window._pllRouteWrapped) return;
    if (typeof window.changeView === 'function') {
        const oldChangeView = window.changeView;
        window.changeView = function(view) {
            if (view === 'phieulienlac') {
                if (!['admin','teacher'].includes(window.userRole)) {
                    Swal.fire('Không có quyền', 'Phiếu liên lạc chỉ dành cho Ban giám hiệu/Quản trị và giáo viên chủ nhiệm.', 'warning');
                    return;
                }
                document.querySelectorAll('.menu-item').forEach(x => x.classList.remove('active'));
                const active = document.querySelector('#menu-phieulienlac, [data-view="phieulienlac"]');
                if (active) active.classList.add('active');

                const title = document.getElementById('page-title');
                if (title) title.textContent = 'Phiếu liên lạc';

                renderPhieuLienLac();
                return;
            }
            return oldChangeView.apply(this, arguments);
        };
        window._pllRouteWrapped = true;
    }
}

function initPhieuLienLacMenu() {
    ensurePhieuLienLacMenuItem();
    installPhieuLienLacRouteWrapper();
}

document.addEventListener('DOMContentLoaded', initPhieuLienLacMenu);
setTimeout(initPhieuLienLacMenu, 300);
setTimeout(initPhieuLienLacMenu, 1200);
setTimeout(initPhieuLienLacMenu, 2500);
new MutationObserver(() => initPhieuLienLacMenu()).observe(document.documentElement, { childList: true, subtree: true });

window.ensurePhieuLienLacMenuItem = ensurePhieuLienLacMenuItem;
