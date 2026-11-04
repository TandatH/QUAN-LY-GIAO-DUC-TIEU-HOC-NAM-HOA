// ═══════════════════════════════════════════════════════════════════════════
// evaluations.js — Module Đánh giá & 11 Biểu mẫu Quản lý (BGH & Giáo viên)
// Lớp Phổ cập Nam Hòa — Năm học 2026-2027
// Dùng để in và sử dụng trực tiếp trong quản lý, theo dõi, đánh giá
// ═══════════════════════════════════════════════════════════════════════════

export const EVALUATION_MODULE_VERSION = '5.37.0';

// ── 1. ĐỊNH NGHĨA 11 BIỂU MẪU QUẢN LÝ ─────────────────────────────────────────
export const EVAL_FORMS = {
    bm01: {
        code: 'BIỂU MẪU 01',
        key: 'bm01',
        title: 'PHIẾU RÀ SOÁT HỒ SƠ NHÂN THÂN HỌC SINH',
        shortTitle: 'Rà soát nhân thân HS',
        group: 'student',
        groupName: 'Theo dõi & Can thiệp Học sinh',
        requiresStudent: true,
        color: 'blue',
        desc: 'Rà soát tình trạng giấy khai sinh, CCCD phụ huynh, nơi cư trú, phân loại và hướng xử lý pháp lý/xã hội cho học sinh.',
    },
    bm02: {
        code: 'BIỂU MẪU 02',
        key: 'bm02',
        title: 'PHIẾU PHÂN TÍCH HỌC SINH CÓ NGUY CƠ HỌC YẾU',
        shortTitle: 'Phân tích HS nguy cơ học yếu',
        group: 'student',
        groupName: 'Theo dõi & Can thiệp Học sinh',
        requiresStudent: true,
        color: 'amber',
        desc: 'Nhận diện biểu hiện mất kiến thức, khó tập trung, phân tích nguyên nhân động lực, môi trường và mức độ cần hỗ trợ.',
    },
    bm03: {
        code: 'BIỂU MẪU 03',
        key: 'bm03',
        title: 'KẾ HOẠCH HỖ TRỢ CÁ NHÂN HỌC SINH',
        shortTitle: 'Kế hoạch hỗ trợ cá nhân HS',
        group: 'student',
        groupName: 'Theo dõi & Can thiệp Học sinh',
        requiresStudent: true,
        color: 'green',
        desc: 'Mục tiêu tiến bộ, biện pháp hỗ trợ tại lớp, đôi bạn cùng tiến, theo dõi từng đợt và kết luận giai đoạn.',
    },
    bm04: {
        code: 'BIỂU MẪU 04',
        key: 'bm04',
        title: 'PHIẾU THEO DÕI TIẾN BỘ HỌC SINH',
        shortTitle: 'Theo dõi tiến bộ theo lớp',
        group: 'student',
        groupName: 'Theo dõi & Can thiệp Học sinh',
        requiresStudent: false,
        color: 'blue',
        desc: 'Bảng theo dõi mức độ tiến bộ nhiều học sinh qua các giai đoạn (Đầu vào, GĐ 1-4), xu hướng và nhận xét của GV.',
    },
    bm05: {
        code: 'BIỂU MẪU 05',
        key: 'bm05',
        title: 'PHIẾU ĐÁNH GIÁ SAU CHUYÊN ĐỀ GIÁO VIÊN',
        shortTitle: 'Đánh giá sau chuyên đề GV',
        group: 'teacher',
        groupName: 'Phát triển Chuyên môn Giáo viên',
        requiresStudent: false,
        color: 'purple',
        desc: 'Giáo viên tự đánh giá sau sinh hoạt chuyên môn: điều học được, áp dụng vào lớp, thay đổi của HS và đề xuất hỗ trợ.',
    },
    bm06: {
        code: 'BIỂU MẪU 06',
        key: 'bm06',
        title: 'PHIẾU THEO DÕI ÁP DỤNG SAU TẬP HUẤN',
        shortTitle: 'Theo dõi áp dụng sau tập huấn',
        group: 'teacher',
        groupName: 'Phát triển Chuyên môn Giáo viên',
        requiresStudent: false,
        color: 'purple',
        desc: 'Kiểm tra mức độ áp dụng thực tế sau tập huấn, thiết kế hoạt động, sản phẩm của học sinh và nhận xét của Quản lý.',
    },
    bm07: {
        code: 'BIỂU MẪU 07',
        key: 'bm07',
        title: 'PHIẾU THĂM GIA ĐÌNH',
        shortTitle: 'Phiếu thăm gia đình',
        group: 'family',
        groupName: 'Phối hợp Gia đình & Bảo vệ trẻ',
        requiresStudent: true,
        color: 'amber',
        desc: 'Ghi nhận hoàn cảnh, điều kiện học tập tại nhà, thỏa thuận giữa nhà trường và gia đình trong việc đồng hành cùng học sinh.',
    },
    bm08: {
        code: 'BIỂU MẪU 08',
        key: 'bm08',
        title: 'PHIẾU THEO DÕI TRƯỜNG HỢP BẢO VỆ TRẺ',
        shortTitle: 'Hồ sơ bảo vệ trẻ (Bảo mật)',
        group: 'family',
        groupName: 'Phối hợp Gia đình & Bảo vệ trẻ',
        requiresStudent: true,
        isConfidential: true,
        color: 'rose',
        desc: 'HỒ SƠ BẢO MẬT: Ghi nhận mức độ can thiệp, tiến trình các bước xử lý, đối tác phối hợp và tình trạng an toàn của học sinh.',
    },
    bm09: {
        code: 'BIỂU MẪU 09',
        key: 'bm09',
        title: 'PHIẾU KIỂM THẢO CUỐI THÁNG',
        shortTitle: 'Kiểm thảo công tác cuối tháng',
        group: 'teacher',
        groupName: 'Phát triển Chuyên môn Giáo viên',
        requiresStudent: false,
        color: 'purple',
        desc: 'Giáo viên tự kiểm thảo công việc tháng: việc quan trọng đã xong, kết quả nổi bật, tồn tại, HS cần quan tâm và điều chỉnh.',
    },
    bm10: {
        code: 'BIỂU MẪU 10',
        key: 'bm10',
        title: 'BẢNG TỔNG HỢP CHỈ SỐ TÁC ĐỘNG CUỐI NĂM',
        shortTitle: 'Tổng hợp chỉ số tác động BGH',
        group: 'manager',
        groupName: 'Báo cáo & Tổng hợp BGH',
        requiresStudent: false,
        color: 'blue',
        desc: 'Dành cho BGH / Quản lý tổng hợp toàn diện các chỉ số Bảo vệ trẻ, Học tập, Giáo viên, Phụ huynh và định hướng năm học mới.',
    },
    bm11: {
        code: 'BIỂU MẪU 11',
        key: 'bm11',
        title: 'CÂU CHUYỆN THAY ĐỔI CỦA HỌC SINH',
        shortTitle: 'Câu chuyện thay đổi của HS',
        group: 'student',
        groupName: 'Theo dõi & Can thiệp Học sinh',
        requiresStudent: true,
        color: 'green',
        desc: 'Ghi chép hành trình trước và sau khi được hỗ trợ, minh chứng thay đổi tích cực, lời nói của em và bài học của nhà trường.',
    }
};

// ── 2. STATE QUẢN LÝ NỘI BỘ ──────────────────────────────────────────────────
let evalState = {
    periods: {},            // id -> period config
    submissions: {},        // id -> submission
    activeTab: 'forms',     // 'forms' | 'submissions' | 'periods' | 'bm10'
    currentPeriodId: null,
    filterForm: '',
    filterStatus: '',
    filterClass: '',
    filterSearch: '',
    initialized: false
};

// ── 3. KHỞI TẠO VÀ TẢI DỮ LIỆU TỪ REALTIME DATABASE ───────────────────────────
export async function initEvaluationsData() {
    try {
        const db = window.db;
        if (!db) return;

        // 1. Tải danh sách Đợt đánh giá (Periods)
        try {
            const snapP = await window.get(window.child(window.ref(db), 'evaluations/periods'));
            evalState.periods = snapP.exists() ? snapP.val() : {};
        } catch(e) {
            // Fallback đọc từ settings/evaluationPeriods
            try {
                const snapP2 = await window.get(window.child(window.ref(db), 'settings/evaluationPeriods'));
                evalState.periods = snapP2.exists() ? snapP2.val() : {};
            } catch(e2) {
                evalState.periods = {};
            }
        }

        // Nếu chưa có đợt nào, BGH tự khởi tạo đợt mặc định cho năm học hiện tại
        if (Object.keys(evalState.periods).length === 0 && window.userRole === 'admin') {
            await ensureDefaultEvaluationPeriods();
        }

        // Chọn đợt đang mở gần nhất làm mặc định
        const now = Date.now();
        const periodList = Object.values(evalState.periods);
        const openPeriod = periodList.find(p => p.status === 'open' && (!p.endDate || new Date(p.endDate).getTime() >= now));
        evalState.currentPeriodId = openPeriod ? openPeriod.id : (periodList[0]?.id || null);

        // 2. Tải danh sách Phiếu nộp (Submissions)
        try {
            const snapS = await window.get(window.child(window.ref(db), 'evaluations/submissions'));
            evalState.submissions = snapS.exists() ? snapS.val() : {};
        } catch(e) {
            console.warn('[Evaluations] submissions fetch:', e.message);
            evalState.submissions = {};
        }

        evalState.initialized = true;
    } catch (err) {
        console.error('[Evaluations] init error:', err);
    }
}

async function ensureDefaultEvaluationPeriods() {
    const sy = window._currentSchoolYear || '2026-2027';
    const now = new Date();
    const defaults = {
        [`${sy.replace('-','_')}_dau_nam`]: {
            id: `${sy.replace('-','_')}_dau_nam`,
            name: `Rà soát & Đánh giá nhân thân đầu năm (${sy})`,
            schoolYear: sy,
            semester: 'hk1',
            startDate: `${now.getFullYear()}-09-01`,
            endDate: `${now.getFullYear()}-10-31`,
            status: 'open',
            allowedForms: ['bm01', 'bm02', 'bm03', 'bm07', 'bm08'],
            notes: 'BGH yêu cầu GVCN rà soát toàn diện hồ sơ nhân thân và phân tích học sinh có nguy cơ học yếu để lập kế hoạch can thiệp sớm.',
            createdBy: window.currentUser?.email || 'admin'
        },
        [`${sy.replace('-','_')}_giua_ky`]: {
            id: `${sy.replace('-','_')}_giua_ky`,
            name: `Đánh giá tiến độ & Kế hoạch cá nhân (${sy})`,
            schoolYear: sy,
            semester: 'hk1',
            startDate: `${now.getFullYear()}-11-01`,
            endDate: `${now.getFullYear()+1}-01-15`,
            status: 'open',
            allowedForms: ['bm02', 'bm03', 'bm04', 'bm05', 'bm06', 'bm09'],
            notes: 'Theo dõi tiến bộ học sinh, báo cáo chuyên đề và kiểm thảo định kỳ tháng.',
            createdBy: window.currentUser?.email || 'admin'
        },
        [`${sy.replace('-','_')}_cuoi_nam`]: {
            id: `${sy.replace('-','_')}_cuoi_nam`,
            name: `Tổng kết & Báo cáo tác động cuối năm (${sy})`,
            schoolYear: sy,
            semester: 'ca_nam',
            startDate: `${now.getFullYear()+1}-04-15`,
            endDate: `${now.getFullYear()+1}-05-31`,
            status: 'open',
            allowedForms: ['bm04', 'bm09', 'bm10', 'bm11'],
            notes: 'Tổng hợp chỉ số tác động toàn trường và ghi nhận câu chuyện thay đổi tích cực của học sinh.',
            createdBy: window.currentUser?.email || 'admin'
        }
    };

    try {
        await window.update(window.ref(window.db), {
            'evaluations/periods': defaults,
            'settings/evaluationPeriods': defaults
        });
        evalState.periods = defaults;
    } catch(e) {}
}

// ── 4. TIỆN ÍCH KIỂM TRA THỜI HẠN & QUYỀN ──────────────────────────────────────
export function getActivePeriod() {
    if (!evalState.currentPeriodId) return null;
    return evalState.periods[evalState.currentPeriodId] || null;
}

export function isPeriodEditable(period = getActivePeriod()) {
    if (!period) return true; // Chưa chọn đợt thì cho phép linh hoạt
    if (window.userRole === 'admin') return true; // BGH luôn có quyền can thiệp
    if (period.status !== 'open') return false;
    if (period.endDate) {
        const end = new Date(period.endDate + 'T23:59:59').getTime();
        if (Date.now() > end) return false;
    }
    return true;
}

export function canAccessConfidential(submission) {
    if (window.userRole === 'admin') return true;
    if (submission?.teacherUid === window.currentUser?.uid) return true;
    return false;
}

// ── 5. GIAO DIỆN CHÍNH (RENDER EVALUATIONS VIEW) ──────────────────────────────
export async function renderEvaluations() {
    const content = document.getElementById('content');
    if (!content) return;

    if (!evalState.initialized) {
        content.innerHTML = `
            <div class="card" style="text-align:center;padding:50px">
                <i class="fas fa-spinner fa-spin" style="font-size:2.2rem;color:var(--primary);margin-bottom:14px"></i>
                <p style="color:#475569;font-weight:600">Đang tải dữ liệu biểu mẫu & đợt đánh giá...</p>
            </div>`;
        await initEvaluationsData();
    }

    const isAdmin = window.userRole === 'admin';
    const period = getActivePeriod();
    const isEditable = isPeriodEditable(period);

    // Tính toán thống kê
    const allSubs = Object.values(evalState.submissions);
    const visibleSubs = allSubs.filter(s => {
        if (!isAdmin && s.teacherUid !== window.currentUser?.uid && s.classRoom !== window.teacherClass) return false;
        if (s.isConfidential && !canAccessConfidential(s)) return false;
        return true;
    });

    const totalCount = visibleSubs.length;
    const submittedCount = visibleSubs.filter(s => s.status === 'submitted').length;
    const approvedCount = visibleSubs.filter(s => s.status === 'approved').length;
    const draftCount = visibleSubs.filter(s => s.status === 'draft').length;

    let periodBannerHtml = '';
    if (period) {
        const isOpen = period.status === 'open';
        const startFmt = period.startDate ? period.startDate.split('-').reverse().join('/') : '---';
        const endFmt = period.endDate ? period.endDate.split('-').reverse().join('/') : '---';
        const isExp = period.endDate && (new Date(period.endDate + 'T23:59:59').getTime() < Date.now());

        let statusText = isOpen ? (isExp ? 'Đã hết hạn nộp' : 'Đang mở nhận phiếu') : 'Đã khóa';
        let badgeBg = isOpen ? (isExp ? '#e11d48' : '#16a34a') : '#64748b';

        periodBannerHtml = `
            <div class="eval-period-banner ${!isOpen || isExp ? 'closed' : ''}">
                <div class="eval-period-info">
                    <h4>
                        <i class="fas fa-calendar-check"></i> ${period.name}
                        <span style="font-size:0.75rem;padding:3px 8px;border-radius:12px;background:${badgeBg};margin-left:8px">
                            ${statusText}
                        </span>
                    </h4>
                    <div class="eval-period-dates">
                        <span><i class="fas fa-hourglass-start"></i> Bắt đầu: <b>${startFmt}</b></span>
                        <span><i class="fas fa-flag-checkered"></i> Hạn chót: <b>${endFmt}</b></span>
                        <span><i class="fas fa-graduation-cap"></i> Năm học: <b>${period.schoolYear}</b></span>
                        <span><i class="fas fa-layer-group"></i> Kỳ: <b>${period.semester === 'ca_nam' ? 'Cả năm' : period.semester?.toUpperCase()}</b></span>
                    </div>
                    ${period.notes ? `<div style="font-size:0.83rem;margin-top:6px;opacity:0.9"><i class="fas fa-info-circle"></i> ${period.notes}</div>` : ''}
                </div>
                <div class="eval-period-actions">
                    ${isAdmin ? `
                        <button class="btn btn-sm btn-outline" style="color:white;border-color:white" onclick="openPeriodModal('${period.id}')">
                            <i class="fas fa-cog"></i> Cài đặt đợt
                        </button>
                    ` : ''}
                </div>
            </div>`;
    }

    content.innerHTML = `
        <div class="eval-container">
            <div class="eval-header">
                <div>
                    <h2><i class="fas fa-clipboard-check" style="color:#2563eb"></i> Bộ 11 Biểu Mẫu Quản Lý & Đánh Giá</h2>
                    <p>Hệ thống theo dõi, đánh giá và báo cáo tác động giữa Ban Giám Hiệu và Giáo viên theo từng kỳ</p>
                </div>
                <div style="display:flex;gap:10px;align-items:center">
                    <select id="eval-period-selector" class="form-control" style="font-weight:600;min-width:220px" onchange="switchEvalPeriod(this.value)">
                        ${Object.values(evalState.periods).map(p => `
                            <option value="${p.id}" ${p.id === evalState.currentPeriodId ? 'selected' : ''}>
                                ${p.name} (${p.status === 'open' ? 'Đang mở' : 'Đã đóng'})
                            </option>
                        `).join('')}
                    </select>
                    ${isAdmin ? `
                        <button class="btn btn-outline" onclick="openPeriodModal()">
                            <i class="fas fa-plus"></i> Tạo đợt mới
                        </button>
                    ` : ''}
                </div>
            </div>

            ${periodBannerHtml}

            <!-- Thống kê nhanh -->
            <div class="eval-stats-grid">
                <div class="eval-stat-card">
                    <div class="eval-stat-icon blue"><i class="fas fa-file-alt"></i></div>
                    <div>
                        <div class="eval-stat-val">${totalCount}</div>
                        <div class="eval-stat-label">Tổng số phiếu ${isAdmin ? 'toàn trường' : 'của lớp'}</div>
                    </div>
                </div>
                <div class="eval-stat-card">
                    <div class="eval-stat-icon amber"><i class="fas fa-hourglass-half"></i></div>
                    <div>
                        <div class="eval-stat-val">${submittedCount}</div>
                        <div class="eval-stat-label">Chờ BGH phê duyệt</div>
                    </div>
                </div>
                <div class="eval-stat-card">
                    <div class="eval-stat-icon green"><i class="fas fa-check-circle"></i></div>
                    <div>
                        <div class="eval-stat-val">${approvedCount}</div>
                        <div class="eval-stat-label">BGH đã ký duyệt</div>
                    </div>
                </div>
                <div class="eval-stat-card">
                    <div class="eval-stat-icon purple"><i class="fas fa-edit"></i></div>
                    <div>
                        <div class="eval-stat-val">${draftCount}</div>
                        <div class="eval-stat-label">Bản nháp đang làm</div>
                    </div>
                </div>
            </div>

            <!-- Thanh điều hướng Tab -->
            <div class="eval-nav-tabs">
                <button class="eval-tab-btn ${evalState.activeTab === 'forms' ? 'active' : ''}" onclick="switchEvalTab('forms')">
                    <i class="fas fa-th-large"></i> Bộ 11 Biểu mẫu
                </button>
                <button class="eval-tab-btn ${evalState.activeTab === 'submissions' ? 'active' : ''}" onclick="switchEvalTab('submissions')">
                    <i class="fas fa-list-check"></i> ${isAdmin ? 'Duyệt phiếu giáo viên' : 'Phiếu đã lập'}
                    <span class="eval-tab-badge">${submittedCount > 0 && isAdmin ? submittedCount : totalCount}</span>
                </button>
                ${isAdmin ? `
                    <button class="eval-tab-btn ${evalState.activeTab === 'periods' ? 'active' : ''}" onclick="switchEvalTab('periods')">
                        <i class="fas fa-calendar-alt"></i> Quản lý đợt & Hạn nộp
                    </button>
                    <button class="eval-tab-btn ${evalState.activeTab === 'bm10' ? 'active' : ''}" onclick="switchEvalTab('bm10')">
                        <i class="fas fa-chart-line"></i> BM10: Chỉ số tác động cuối năm
                    </button>
                ` : ''}
            </div>

            <!-- Nội dung theo Tab -->
            <div id="eval-tab-content">
                ${renderCurrentTabContent()}
            </div>
        </div>
    `;
}

function renderCurrentTabContent() {
    if (evalState.activeTab === 'forms') {
        return renderFormsCatalogView();
    } else if (evalState.activeTab === 'submissions') {
        return renderSubmissionsListView();
    } else if (evalState.activeTab === 'periods') {
        return renderPeriodsManagementView();
    } else if (evalState.activeTab === 'bm10') {
        return renderBM10ManagementView();
    }
    return '';
}

// ── 6. TAB 1: DANH MỤC 11 BIỂU MẪU ───────────────────────────────────────────
function renderFormsCatalogView() {
    const period = getActivePeriod();
    const allowed = period?.allowedForms || Object.keys(EVAL_FORMS);
    const groups = [
        { key: 'student', title: '1. Theo dõi & Can thiệp Học sinh', icon: 'user-graduate' },
        { key: 'teacher', title: '2. Phát triển Chuyên môn Giáo viên', icon: 'chalkboard-teacher' },
        { key: 'family',  title: '3. Phối hợp Gia đình & Bảo vệ trẻ', icon: 'shield-alt' },
        { key: 'manager', title: '4. Báo cáo Tác động Cấp Quản lý', icon: 'file-signature' }
    ];

    return groups.map(g => {
        const formsInGroup = Object.values(EVAL_FORMS).filter(f => f.group === g.key);
        if (!formsInGroup.length) return '';

        return `
            <div class="eval-group-title"><i class="fas fa-${g.icon}"></i> ${g.title}</div>
            <div class="eval-forms-grid">
                ${formsInGroup.map(f => {
                    const isFormAllowed = allowed.includes(f.key);
                    const subCount = Object.values(evalState.submissions).filter(s => s.formType === f.key).length;

                    return `
                        <div class="eval-form-card color-${f.color}">
                            <div>
                                <div class="eval-form-top">
                                    <span class="eval-form-badge">${f.code}</span>
                                    <span class="eval-form-count"><i class="fas fa-file-signature"></i> ${subCount} phiếu</span>
                                </div>
                                <h3 class="eval-form-title">${f.title}</h3>
                                <p class="eval-form-desc">${f.desc}</p>
                            </div>
                            <div class="eval-form-footer">
                                <button class="btn btn-sm btn-outline" onclick="previewSampleForm('${f.key}')" title="Xem biểu mẫu chuẩn">
                                    <i class="fas fa-eye"></i> Mẫu
                                </button>
                                ${f.key === 'bm10' && window.userRole !== 'admin' ? `
                                    <span style="font-size:0.75rem;color:#64748b;font-style:italic">Dành riêng cho BGH</span>
                                ` : `
                                    <button class="btn btn-sm btn-primary" onclick="openNewFormSubmission('${f.key}')">
                                        <i class="fas fa-plus"></i> Tạo phiếu mới
                                    </button>
                                `}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }).join('');
}

// ── 7. TAB 2: DANH SÁCH PHIẾU ĐÃ LẬP & XÉT DUYỆT ─────────────────────────────
function renderSubmissionsListView() {
    const isAdmin = window.userRole === 'admin';
    const allSubs = Object.values(evalState.submissions);

    // Lọc theo điều kiện
    let list = allSubs.filter(s => {
        if (!isAdmin && s.teacherUid !== window.currentUser?.uid && s.classRoom !== window.teacherClass) return false;
        if (s.isConfidential && !canAccessConfidential(s)) return false;
        if (evalState.filterForm && s.formType !== evalState.filterForm) return false;
        if (evalState.filterStatus && s.status !== evalState.filterStatus) return false;
        if (evalState.filterClass && s.classRoom !== evalState.filterClass) return false;
        if (evalState.filterSearch) {
            const q = evalState.filterSearch.toLowerCase();
            const text = `${s.studentName || ''} ${s.teacherName || ''} ${s.title || ''} ${s.formData?.notes || ''}`.toLowerCase();
            if (!text.includes(q)) return false;
        }
        return true;
    });

    // Sắp xếp mới nhất lên đầu
    list.sort((a,b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));

    // Thu thập danh sách lớp để lọc
    const classes = [...new Set(allSubs.map(s => s.classRoom).filter(Boolean))];

    return `
        <div class="eval-filter-bar">
            <div style="flex:1;min-width:200px">
                <input type="text" id="eval-search-inp" class="form-control" placeholder="Tìm theo tên học sinh, GV, nội dung..."
                       value="${evalState.filterSearch}" oninput="evalState.filterSearch = this.value; refreshEvalSubmissionsTable()">
            </div>
            <div>
                <select class="form-control" onchange="evalState.filterForm = this.value; refreshEvalSubmissionsTable()">
                    <option value="">Tất cả 11 biểu mẫu</option>
                    ${Object.values(EVAL_FORMS).map(f => `
                        <option value="${f.key}" ${evalState.filterForm === f.key ? 'selected' : ''}>${f.code} - ${f.shortTitle}</option>
                    `).join('')}
                </select>
            </div>
            <div>
                <select class="form-control" onchange="evalState.filterStatus = this.value; refreshEvalSubmissionsTable()">
                    <option value="">Tất cả trạng thái</option>
                    <option value="draft" ${evalState.filterStatus === 'draft' ? 'selected' : ''}>Bản nháp</option>
                    <option value="submitted" ${evalState.filterStatus === 'submitted' ? 'selected' : ''}>Chờ BGH duyệt</option>
                    <option value="approved" ${evalState.filterStatus === 'approved' ? 'selected' : ''}>Đã duyệt</option>
                    <option value="returned" ${evalState.filterStatus === 'returned' ? 'selected' : ''}>Yêu cầu sửa lại</option>
                </select>
            </div>
            <div>
                <select class="form-control" onchange="evalState.filterClass = this.value; refreshEvalSubmissionsTable()">
                    <option value="">Tất cả lớp</option>
                    ${classes.map(c => `<option value="${c}" ${evalState.filterClass === c ? 'selected' : ''}>Lớp ${c}</option>`).join('')}
                </select>
            </div>
        </div>

        <div class="eval-table-card">
            <table class="eval-table">
                <thead>
                    <tr>
                        <th style="width:110px">Mẫu</th>
                        <th>Học sinh / Nội dung</th>
                        <th style="width:90px">Lớp</th>
                        <th>Người lập</th>
                        <th style="width:120px">Ngày lập</th>
                        <th style="width:130px">Trạng thái</th>
                        <th style="text-align:right;width:190px">Thao tác</th>
                    </tr>
                </thead>
                <tbody id="eval-submissions-tbody">
                    ${renderSubmissionsTableRows(list)}
                </tbody>
            </table>
        </div>
    `;
}

function renderSubmissionsTableRows(list) {
    if (!list.length) {
        return `
            <tr>
                <td colspan="7" style="text-align:center;padding:36px;color:#64748b">
                    <i class="fas fa-inbox" style="font-size:2rem;margin-bottom:8px;display:block;opacity:0.5"></i>
                    Chưa có phiếu nộp nào phù hợp với bộ lọc.
                </td>
            </tr>`;
    }

    const isAdmin = window.userRole === 'admin';

    return list.map(s => {
        const formDef = EVAL_FORMS[s.formType] || {};
        const dateStr = s.updatedAt ? new Date(s.updatedAt).toLocaleDateString('vi-VN') : '---';

        let statusBadge = '';
        if (s.status === 'draft') statusBadge = '<span class="eval-status-pill draft"><i class="fas fa-pen"></i> Bản nháp</span>';
        else if (s.status === 'submitted') statusBadge = '<span class="eval-status-pill submitted"><i class="fas fa-clock"></i> Chờ BGH duyệt</span>';
        else if (s.status === 'approved') statusBadge = '<span class="eval-status-pill approved"><i class="fas fa-check-circle"></i> Đã duyệt</span>';
        else if (s.status === 'returned') statusBadge = '<span class="eval-status-pill returned"><i class="fas fa-undo"></i> Cần sửa lại</span>';

        return `
            <tr>
                <td><span class="eval-form-badge">${formDef.code || s.formType}</span></td>
                <td>
                    <div style="font-weight:700;color:#0f172a">
                        ${s.studentName || s.title || formDef.shortTitle}
                        ${s.isConfidential ? '<span style="color:#e11d48;font-size:0.75rem;margin-left:4px"><i class="fas fa-lock"></i> Bảo mật</span>' : ''}
                    </div>
                    <div style="font-size:0.78rem;color:#64748b">${formDef.shortTitle || ''}</div>
                </td>
                <td><b>${s.classRoom || '---'}</b></td>
                <td>
                    <div>${s.teacherName || '---'}</div>
                    <div style="font-size:0.75rem;color:#94a3b8">${s.teacherEmail || ''}</div>
                </td>
                <td>${dateStr}</td>
                <td>${statusBadge}</td>
                <td style="text-align:right">
                    <div style="display:inline-flex;gap:6px">
                        <button class="btn btn-sm btn-outline" onclick="printEvaluationSubmission('${s.id}')" title="Xem trước & In A4">
                            <i class="fas fa-print"></i>
                        </button>
                        ${isAdmin ? `
                            <button class="btn btn-sm btn-primary" onclick="openReviewSubmissionModal('${s.id}')" title="BGH Duyệt & Nhận xét">
                                <i class="fas fa-check-double"></i> Duyệt
                            </button>
                        ` : ''}
                        <button class="btn btn-sm btn-outline" onclick="editEvaluationSubmission('${s.id}')" title="Chỉnh sửa">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline" style="color:#dc2626" onclick="deleteEvaluationSubmission('${s.id}')" title="Xóa">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// ── 8. TAB 3: QUẢN LÝ ĐỢT ĐÁNH GIÁ (BGH / ADMIN) ──────────────────────────────
function renderPeriodsManagementView() {
    const list = Object.values(evalState.periods);
    list.sort((a,b) => (b.startDate || '').localeCompare(a.startDate || ''));

    return `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px">
            <div>
                <h4 style="margin:0;color:#0f172a;font-weight:700">Quy định Đợt đánh giá & Thời hạn nộp</h4>
                <p style="margin:4px 0 0;color:#64748b;font-size:0.86rem">BGH thiết lập thời gian bắt đầu, hạn chót và các biểu mẫu giáo viên được nộp trong từng đợt.</p>
            </div>
            <button class="btn btn-primary" onclick="openPeriodModal()">
                <i class="fas fa-plus"></i> Tạo đợt đánh giá mới
            </button>
        </div>

        <div class="eval-table-card">
            <table class="eval-table">
                <thead>
                    <tr>
                        <th>Tên đợt đánh giá</th>
                        <th style="width:110px">Năm học</th>
                        <th style="width:90px">Kỳ</th>
                        <th style="width:120px">Bắt đầu</th>
                        <th style="width:120px">Hạn chót</th>
                        <th style="width:130px">Trạng thái</th>
                        <th style="text-align:right;width:160px">Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    ${list.map(p => {
                        const isExpired = p.endDate && (new Date(p.endDate + 'T23:59:59').getTime() < Date.now());
                        const statusPill = p.status === 'open'
                            ? (isExpired ? '<span class="eval-status-pill returned">Hết hạn</span>' : '<span class="eval-status-pill approved">Đang mở</span>')
                            : '<span class="eval-status-pill draft">Đã khóa</span>';

                        return `
                            <tr>
                                <td>
                                    <div style="font-weight:700;color:#0f172a">${p.name}</div>
                                    <div style="font-size:0.78rem;color:#64748b">
                                        Áp dụng: ${(p.allowedForms || []).map(k => EVAL_FORMS[k]?.code || k).join(', ') || 'Tất cả 11 mẫu'}
                                    </div>
                                </td>
                                <td><b>${p.schoolYear}</b></td>
                                <td>${p.semester === 'ca_nam' ? 'Cả năm' : p.semester?.toUpperCase()}</td>
                                <td>${p.startDate ? p.startDate.split('-').reverse().join('/') : '---'}</td>
                                <td>${p.endDate ? p.endDate.split('-').reverse().join('/') : '---'}</td>
                                <td>${statusPill}</td>
                                <td style="text-align:right">
                                    <button class="btn btn-sm btn-outline" onclick="togglePeriodQuickStatus('${p.id}')" title="Bật/Tắt đợt">
                                        <i class="fas fa-power-off"></i>
                                    </button>
                                    <button class="btn btn-sm btn-outline" onclick="openPeriodModal('${p.id}')" title="Sửa">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn btn-sm btn-outline" style="color:#dc2626" onclick="deletePeriod('${p.id}')" title="Xóa">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// ── 9. TAB 4: BM10 - BẢNG TỔNG HỢP CHỈ SỐ TÁC ĐỘNG CUỐI NĂM (BGH) ───────────
function renderBM10ManagementView() {
    const sy = window._currentSchoolYear || '2026-2027';
    const allSubs = Object.values(evalState.submissions);

    // Tính toán số liệu tự động từ các biểu mẫu khác trong hệ thống
    const bm01Subs = allSubs.filter(s => s.formType === 'bm01');
    const bm02Subs = allSubs.filter(s => s.formType === 'bm02');
    const bm03Subs = allSubs.filter(s => s.formType === 'bm03');
    const bm05Subs = allSubs.filter(s => s.formType === 'bm05');
    const bm06Subs = allSubs.filter(s => s.formType === 'bm06');
    const bm07Subs = allSubs.filter(s => s.formType === 'bm07');
    const bm08Subs = allSubs.filter(s => s.formType === 'bm08');

    const totalStudents = Object.keys(window.localData?.students || {}).length || 50;
    const reviewedStudents = bm01Subs.length;
    const missingDocs = bm01Subs.filter(s => s.formData?.classification === 'thieu_bo_sung' || s.formData?.classification === 'kho_xac_minh').length;
    const protectedCases = bm08Subs.length;
    const resolvedCases = bm08Subs.filter(s => s.formData?.currentStatus === 'da_giai_quyet').length;

    return `
        <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:24px;box-shadow:0 2px 8px rgba(0,0,0,0.03)">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;border-bottom:1px solid #f1f5f9;padding-bottom:16px">
                <div>
                    <span class="eval-form-badge" style="font-size:0.85rem">BIỂU MẪU 10</span>
                    <h3 style="margin:8px 0 4px;color:#0f172a;font-size:1.3rem">BẢNG TỔNG HỢP CHỈ SỐ TÁC ĐỘNG CUỐI NĂM</h3>
                    <p style="margin:0;color:#64748b;font-size:0.88rem">Dùng cho quản lý tổng hợp dữ liệu từ các biểu mẫu trong năm học ${sy}.</p>
                </div>
                <div style="display:flex;gap:10px">
                    <button class="btn btn-outline" onclick="previewSampleForm('bm10')">
                        <i class="fas fa-print"></i> Xem & In mẫu A4
                    </button>
                    <button class="btn btn-primary" onclick="openNewFormSubmission('bm10')">
                        <i class="fas fa-save"></i> Lưu báo cáo tổng hợp
                    </button>
                </div>
            </div>

            <!-- Khối tổng hợp A: BẢO VỆ TRẺ -->
            <div class="eval-section-title"><i class="fas fa-shield-alt"></i> A. BẢO VỆ TRẺ</div>
            <table class="eval-inner-table">
                <thead>
                    <tr><th>Chỉ số</th><th style="width:120px">Đầu năm</th><th style="width:150px">Mục tiêu</th><th style="width:120px">Cuối năm</th><th>Mức đạt / Ghi chú</th></tr>
                </thead>
                <tbody>
                    <tr><td>HS được rà soát hồ sơ</td><td style="text-align:center">${reviewedStudents}</td><td style="text-align:center">100%</td><td style="text-align:center">${reviewedStudents}</td><td>Đã rà soát ${reviewedStudents}/${totalStudents} học sinh</td></tr>
                    <tr><td>HS thiếu giấy tờ</td><td style="text-align:center">${missingDocs}</td><td style="text-align:center">Bổ sung 100%</td><td style="text-align:center">${missingDocs}</td><td>Hỗ trợ tư pháp & xác minh cư trú</td></tr>
                    <tr><td>Trường hợp được hỗ trợ</td><td style="text-align:center">${protectedCases}</td><td style="text-align:center">100% ghi nhận</td><td style="text-align:center">${protectedCases}</td><td>Theo dõi hồ sơ bảo vệ trẻ</td></tr>
                    <tr><td>Trường hợp đã giải quyết</td><td style="text-align:center">${resolvedCases}</td><td style="text-align:center">≥ 80%</td><td style="text-align:center">${resolvedCases}</td><td>Đã ổn định an toàn</td></tr>
                </tbody>
            </table>

            <!-- Khối B: HỌC TẬP -->
            <div class="eval-section-title"><i class="fas fa-book-reader"></i> B. HỌC TẬP</div>
            <table class="eval-inner-table">
                <thead>
                    <tr><th>Chỉ số</th><th style="width:120px">Đầu năm</th><th style="width:150px">Mục tiêu</th><th style="width:120px">Cuối năm</th><th>Mức đạt / Ghi chú</th></tr>
                </thead>
                <tbody>
                    <tr><td>HS cần hỗ trợ</td><td style="text-align:center">${bm02Subs.length}</td><td style="text-align:center">Theo dõi sát</td><td style="text-align:center">${bm02Subs.length}</td><td>Dựa trên BM02 phân tích nguy cơ</td></tr>
                    <tr><td>HS được hỗ trợ cá nhân</td><td style="text-align:center">${bm03Subs.length}</td><td style="text-align:center">100% diện hỗ trợ</td><td style="text-align:center">${bm03Subs.length}</td><td>Đã lập kế hoạch can thiệp (BM03)</td></tr>
                </tbody>
            </table>

            <!-- Khối C: GIÁO VIÊN & D: PHỤ HUYNH -->
            <div class="eval-section-title"><i class="fas fa-users-cog"></i> C. GIÁO VIÊN & D. PHỤ HUYNH</div>
            <table class="eval-inner-table">
                <thead>
                    <tr><th>Hạng mục</th><th style="width:120px">Kế hoạch</th><th style="width:150px">Mục tiêu</th><th style="width:120px">Thực hiện</th><th>Ghi chú</th></tr>
                </thead>
                <tbody>
                    <tr><td>Chuyên đề chuyên môn GV</td><td style="text-align:center">4 đợt</td><td style="text-align:center">100%</td><td style="text-align:center">${bm05Subs.length}</td><td>Đã nộp phiếu đánh giá sau chuyên đề</td></tr>
                    <tr><td>Áp dụng sau tập huấn</td><td style="text-align:center">100% GV</td><td style="text-align:center">≥ 80% GV</td><td style="text-align:center">${bm06Subs.length}</td><td>Có minh chứng áp dụng lớp học</td></tr>
                    <tr><td>Phiếu thăm gia đình (BM07)</td><td style="text-align:center">Theo nhu cầu</td><td style="text-align:center">100% HS khó khăn</td><td style="text-align:center">${bm07Subs.length}</td><td>Phối hợp chặt chẽ với phụ huynh</td></tr>
                </tbody>
            </table>
        </div>
    `;
}

// ── 10. CHUYỂN TAB & BỘ LỌC ──────────────────────────────────────────────────
export function switchEvalTab(tabKey) {
    evalState.activeTab = tabKey;
    renderEvaluations();
}

export function switchEvalPeriod(periodId) {
    evalState.currentPeriodId = periodId;
    renderEvaluations();
}

export function refreshEvalSubmissionsTable() {
    const tbody = document.getElementById('eval-submissions-tbody');
    if (!tbody) return;

    const isAdmin = window.userRole === 'admin';
    const allSubs = Object.values(evalState.submissions);

    let list = allSubs.filter(s => {
        if (!isAdmin && s.teacherUid !== window.currentUser?.uid && s.classRoom !== window.teacherClass) return false;
        if (s.isConfidential && !canAccessConfidential(s)) return false;
        if (evalState.filterForm && s.formType !== evalState.filterForm) return false;
        if (evalState.filterStatus && s.status !== evalState.filterStatus) return false;
        if (evalState.filterClass && s.classRoom !== evalState.filterClass) return false;
        if (evalState.filterSearch) {
            const q = evalState.filterSearch.toLowerCase();
            const text = `${s.studentName || ''} ${s.teacherName || ''} ${s.title || ''} ${s.formData?.notes || ''}`.toLowerCase();
            if (!text.includes(q)) return false;
        }
        return true;
    });

    list.sort((a,b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));
    tbody.innerHTML = renderSubmissionsTableRows(list);
}

// Expose globals để gọi từ giao diện HTML
window.switchEvalTab = switchEvalTab;
window.switchEvalPeriod = switchEvalPeriod;
window.refreshEvalSubmissionsTable = refreshEvalSubmissionsTable;

// ── 11. HÀM MỞ MODAL ĐIỀN PHIẾU (TẠO MỚI HOẶC CHỈNH SỬA) ──────────────────────
let currentEditingSubmission = null;

export function openNewFormSubmission(formKey) {
    const period = getActivePeriod();
    const isAdmin = window.userRole === 'admin';

    // Kiểm tra đợt đánh giá
    if (period) {
        if (!isAdmin && period.status !== 'open') {
            Swal.fire('Đợt đã đóng', 'Đợt đánh giá hiện tại đang ở trạng thái Đã khóa. Vui lòng liên hệ BGH.', 'warning');
            return;
        }
        if (!isAdmin && period.endDate) {
            const end = new Date(period.endDate + 'T23:59:59').getTime();
            if (Date.now() > end) {
                Swal.fire('Hết hạn nộp', `Thời hạn nộp của đợt này đã kết thúc vào ngày ${period.endDate.split('-').reverse().join('/')}.`, 'warning');
                return;
            }
        }
        if (period.allowedForms && !period.allowedForms.includes(formKey) && !isAdmin) {
            Swal.fire('Không thuộc đợt', 'Biểu mẫu này không nằm trong danh sách yêu cầu nộp của đợt đánh giá hiện tại.', 'info');
            return;
        }
    }

    currentEditingSubmission = {
        id: null,
        formType: formKey,
        periodId: period?.id || null,
        schoolYear: period?.schoolYear || window._currentSchoolYear || '2026-2027',
        semester: period?.semester || window._currentSemester || 'hk1',
        teacherUid: window.currentUser?.uid || '',
        teacherName: window.teacherName || window.currentUser?.displayName || window.currentUser?.email || '',
        teacherEmail: window.currentUser?.email || '',
        classRoom: window.teacherClass || '',
        studentKey: '',
        studentCode: '',
        studentName: '',
        status: 'draft',
        isConfidential: EVAL_FORMS[formKey]?.isConfidential === true,
        formData: {}
    };

    renderAndShowEvalModal(formKey, currentEditingSubmission, false);
}

export function editEvaluationSubmission(submissionId) {
    const sub = evalState.submissions[submissionId];
    if (!sub) return;

    const isAdmin = window.userRole === 'admin';
    if (!isAdmin && sub.teacherUid !== window.currentUser?.uid) {
        Swal.fire('Không có quyền', 'Bạn chỉ có thể chỉnh sửa các phiếu do chính mình lập.', 'error');
        return;
    }

    const period = evalState.periods[sub.periodId];
    if (!isPeriodEditable(period) && !isAdmin && sub.status !== 'returned') {
        Swal.fire('Đã hết hạn', 'Đợt đánh giá này đã kết thúc, không thể chỉnh sửa nội dung.', 'warning');
        return;
    }

    currentEditingSubmission = JSON.parse(JSON.stringify(sub));
    renderAndShowEvalModal(sub.formType, currentEditingSubmission, false);
}

export function previewSampleForm(formKey) {
    const sample = {
        id: 'sample',
        formType: formKey,
        schoolYear: window._currentSchoolYear || '2026-2027',
        semester: window._currentSemester || 'hk1',
        teacherName: window.teacherName || 'Giáo viên phụ trách',
        classRoom: window.teacherClass || 'Lớp 2',
        studentName: 'Trần Anh Khôi',
        studentCode: 'HS2026-001',
        formData: {},
        isSample: true
    };
    printEvaluationSubmission(null, sample);
}

function renderAndShowEvalModal(formKey, submission, isReadOnly) {
    const formDef = EVAL_FORMS[formKey];
    if (!formDef) return;

    const modal = document.getElementById('modal-eval-form');
    if (!modal) return;

    // Tiêu đề modal
    document.getElementById('eval-modal-code').textContent = formDef.code;
    document.getElementById('eval-modal-title').textContent = formDef.title;

    // Header info: chọn lớp / chọn học sinh nếu biểu mẫu yêu cầu
    const studentPickerWrap = document.getElementById('eval-modal-student-wrap');
    if (formDef.requiresStudent) {
        studentPickerWrap.style.display = 'block';
        renderStudentPicker(submission);
    } else {
        studentPickerWrap.style.display = 'none';
    }

    // Render nội dung biểu mẫu cụ thể
    const bodyEl = document.getElementById('eval-modal-form-fields');
    bodyEl.innerHTML = buildFormSpecificFields(formKey, submission.formData || {}, isReadOnly);

    // BGH Feedback nếu có
    const feedbackBox = document.getElementById('eval-modal-feedback-box');
    if (submission.managerFeedback) {
        feedbackBox.style.display = 'block';
        feedbackBox.innerHTML = `
            <h5><i class="fas fa-comment-dots"></i> Nhận xét từ Quản lý / BGH (${submission.managerApprovedBy || 'Quản lý'}):</h5>
            <p style="margin:0;color:#1e293b;font-weight:600">${submission.managerFeedback}</p>
        `;
    } else {
        feedbackBox.style.display = 'none';
    }

    modal.style.display = 'flex';
}

function renderStudentPicker(sub) {
    const students = Object.entries(window.localData?.students || {});
    const classes = [...new Set(students.map(([k,s]) => s.classRoom || s.class).filter(Boolean))];

    // Lọc học sinh theo lớp giáo viên (nếu là GVCN)
    const filteredStudents = window.userRole === 'teacher' && window.teacherClass
        ? students.filter(([k,s]) => (s.classRoom || s.class) === window.teacherClass)
        : students;

    const pickerHtml = `
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px;margin-bottom:16px">
            <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end">
                <div style="flex:1;min-width:180px">
                    <label style="font-weight:700;font-size:0.83rem;color:#334155;margin-bottom:4px;display:block">
                        Chọn Học sinh áp dụng phiếu:
                    </label>
                    <select id="eval-student-select" class="form-control" onchange="onEvalStudentSelected(this.value)">
                        <option value="">-- Chọn học sinh từ danh sách --</option>
                        ${filteredStudents.map(([k, s]) => `
                            <option value="${k}" ${sub.studentKey === k ? 'selected' : ''}>
                                ${s.name || s.fullName} (${s.code || s.id || ''}) - Lớp ${s.classRoom || s.class || ''}
                            </option>
                        `).join('')}
                    </select>
                </div>
                <div style="width:130px">
                    <label style="font-weight:700;font-size:0.83rem;color:#334155;margin-bottom:4px;display:block">Lớp</label>
                    <input type="text" id="eval-student-class" class="form-control" readonly value="${sub.classRoom || ''}">
                </div>
                <div style="width:150px">
                    <label style="font-weight:700;font-size:0.83rem;color:#334155;margin-bottom:4px;display:block">GVCN</label>
                    <input type="text" id="eval-student-teacher" class="form-control" readonly value="${sub.teacherName || ''}">
                </div>
            </div>
        </div>
    `;
    document.getElementById('eval-modal-student-wrap').innerHTML = pickerHtml;
}

export function onEvalStudentSelected(studentKey) {
    if (!studentKey) return;
    const student = window.localData?.students?.[studentKey];
    if (!student || !currentEditingSubmission) return;

    currentEditingSubmission.studentKey = studentKey;
    currentEditingSubmission.studentName = student.name || student.fullName || '';
    currentEditingSubmission.studentCode = student.code || student.id || '';
    currentEditingSubmission.classRoom = student.classRoom || student.class || '';

    // Auto-fill thông tin vào form
    const classInp = document.getElementById('eval-student-class');
    if (classInp) classInp.value = currentEditingSubmission.classRoom;

    // Điền vào các trường cụ thể của biểu mẫu nếu có
    if (currentEditingSubmission.formType === 'bm01') {
        setInp('bm01_studentName', student.name);
        setInp('bm01_classRoom', currentEditingSubmission.classRoom);
        setInp('bm01_dob', student.dob);
        setInp('bm01_birthPlace', student.birthPlace);
        setInp('bm01_phone', student.phone || student.momPhone || student.dadPhone);
        setInp('bm01_caregiverName', student.primaryCaregiver || student.momName || student.dadName);
        setInp('bm01_currentAddress', student.currentAddress);
    } else if (currentEditingSubmission.formType === 'bm02') {
        setInp('bm02_studentName', student.name);
        setInp('bm02_classRoom', currentEditingSubmission.classRoom);
    } else if (currentEditingSubmission.formType === 'bm03') {
        setInp('bm03_studentName', student.name);
        setInp('bm03_classRoom', currentEditingSubmission.classRoom);
    } else if (currentEditingSubmission.formType === 'bm07') {
        setInp('bm07_studentName', student.name);
        setInp('bm07_classRoom', currentEditingSubmission.classRoom);
    } else if (currentEditingSubmission.formType === 'bm11') {
        setInp('bm11_studentName', student.name);
        setInp('bm11_studentCode', currentEditingSubmission.studentCode);
        setInp('bm11_classRoom', currentEditingSubmission.classRoom);
    }
}
window.onEvalStudentSelected = onEvalStudentSelected;

function setInp(id, val) {
    const el = document.getElementById(id);
    if (el && val) el.value = val;
}

// ── 12. XÂY DỰNG NỘI DUNG FORM CHO TỪNG BIỂU MẪU (11 MẪU) ───────────────────
function buildFormSpecificFields(key, d = {}, readOnly = false) {
    const ro = readOnly ? 'disabled' : '';

    if (key === 'bm01') {
        return `
            <div class="eval-section-title"><i class="fas fa-id-card"></i> Thông tin học sinh</div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px;margin-bottom:14px">
                <div><label>Họ tên HS</label><input type="text" id="bm01_studentName" class="form-control" value="${d.studentName||''}" ${ro}></div>
                <div><label>Lớp</label><input type="text" id="bm01_classRoom" class="form-control" value="${d.classRoom||''}" ${ro}></div>
                <div><label>Ngày sinh</label><input type="text" id="bm01_dob" class="form-control" value="${d.dob||''}" ${ro}></div>
                <div><label>Nơi sinh</label><input type="text" id="bm01_birthPlace" class="form-control" value="${d.birthPlace||''}" ${ro}></div>
                <div><label>Người chăm sóc chính</label><input type="text" id="bm01_caregiverName" class="form-control" value="${d.caregiverName||''}" ${ro}></div>
                <div><label>Số điện thoại</label><input type="text" id="bm01_phone" class="form-control" value="${d.phone||''}" ${ro}></div>
                <div style="grid-column:1/-1"><label>Địa chỉ hiện tại</label><input type="text" id="bm01_currentAddress" class="form-control" value="${d.currentAddress||''}" ${ro}></div>
            </div>

            <div class="eval-section-title"><i class="fas fa-folder-open"></i> A. Tình trạng hồ sơ</div>
            <table class="eval-inner-table">
                <thead><tr><th>Hồ sơ</th><th style="width:70px">Có</th><th style="width:70px">Thiếu</th><th style="width:130px">Chưa xác minh</th><th>Ghi chú</th></tr></thead>
                <tbody>
                    ${['birthCert|Giấy khai sinh', 'parentsId|CCCD/giấy tờ cha/mẹ', 'residence|Hồ sơ cư trú', 'academic|Hồ sơ học tập', 'otherDocs|Hồ sơ khác'].map(item => {
                        const [id, label] = item.split('|');
                        const st = d[id]?.status || '';
                        return `
                            <tr>
                                <td><b>${label}</b></td>
                                <td style="text-align:center"><input type="radio" name="bm01_${id}" value="co" ${st==='co'?'checked':''} ${ro}></td>
                                <td style="text-align:center"><input type="radio" name="bm01_${id}" value="thieu" ${st==='thieu'?'checked':''} ${ro}></td>
                                <td style="text-align:center"><input type="radio" name="bm01_${id}" value="chua_xac_minh" ${st==='chua_xac_minh'?'checked':''} ${ro}></td>
                                <td><input type="text" id="bm01_${id}_note" value="${d[id]?.note||''}" placeholder="Ghi chú cụ thể..." ${ro}></td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>

            <div class="eval-section-title"><i class="fas fa-tags"></i> B. Phân loại</div>
            <div class="eval-check-grid">
                ${[
                    'day_du|Hồ sơ đầy đủ',
                    'thieu_bo_sung|Thiếu hồ sơ nhưng có thể bổ sung',
                    'kho_xac_minh|Khó xác minh',
                    'can_ho_tro_phap_ly|Cần hỗ trợ pháp lý/xã hội'
                ].map(item => {
                    const [val, label] = item.split('|');
                    return `
                        <label class="eval-check-item">
                            <input type="radio" name="bm01_classification" value="${val}" ${d.classification===val?'checked':''} ${ro}>
                            <span>${label}</span>
                        </label>
                    `;
                }).join('')}
            </div>

            <div class="eval-section-title"><i class="fas fa-directions"></i> C. Hướng xử lý</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                <div style="grid-column:1/-1"><label>Vấn đề cần giải quyết:</label><textarea id="bm01_issues" class="form-control" rows="2" ${ro}>${d.issues||''}</textarea></div>
                <div><label>Người/đơn vị phối hợp:</label><input type="text" id="bm01_cooperatingParty" class="form-control" value="${d.cooperatingParty||''}" ${ro}></div>
                <div><label>Người theo dõi:</label><input type="text" id="bm01_supervisor" class="form-control" value="${d.supervisor||''}" ${ro}></div>
                <div><label>Việc cần thực hiện:</label><textarea id="bm01_actions" class="form-control" rows="2" ${ro}>${d.actions||''}</textarea></div>
                <div><label>Thời hạn dự kiến:</label><input type="date" id="bm01_deadline" class="form-control" value="${d.deadline||''}" ${ro}></div>
            </div>
        `;
    }

    if (key === 'bm02') {
        const manifestations = d.manifestations || {};
        return `
            <div class="eval-section-title"><i class="fas fa-user"></i> Thông tin chung</div>
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:14px">
                <div><label>Họ tên HS</label><input type="text" id="bm02_studentName" class="form-control" value="${d.studentName||''}" ${ro}></div>
                <div><label>Lớp</label><input type="text" id="bm02_classRoom" class="form-control" value="${d.classRoom||''}" ${ro}></div>
                <div><label>Môn học cần hỗ trợ</label><input type="text" id="bm02_subject" class="form-control" value="${d.subject||'Toán, Tiếng Việt'}" ${ro}></div>
            </div>

            <div class="eval-section-title"><i class="fas fa-exclamation-triangle"></i> A. Biểu hiện hiện tại</div>
            <div class="eval-check-grid">
                ${[
                    'notCompleted|Không hoàn thành bài', 'lostFoundation|Mất kiến thức nền',
                    'hardToFocus|Khó tập trung', 'lackMotivation|Thiếu động lực',
                    'slowSkills|Chậm kỹ năng học tập', 'shyParticipation|Ngại tham gia',
                    'familyIssues|Khó khăn gia đình', 'healthIssues|Khó khăn tâm lý/sức khỏe'
                ].map(item => {
                    const [k, lbl] = item.split('|');
                    return `
                        <label class="eval-check-item">
                            <input type="checkbox" id="bm02_mf_${k}" ${manifestations[k]?'checked':''} ${ro}>
                            <span>${lbl}</span>
                        </label>
                    `;
                }).join('')}
            </div>
            <div style="margin-bottom:14px"><label>Khác:</label><input type="text" id="bm02_mf_other" class="form-control" value="${manifestations.other||''}" ${ro}></div>

            <div class="eval-section-title"><i class="fas fa-search-plus"></i> B. Phân tích nguyên nhân</div>
            <table class="eval-inner-table">
                <thead><tr><th style="width:200px">Yếu tố</th><th>Nhận định / Bằng chứng</th></tr></thead>
                <tbody>
                    ${[
                        'motivation|Động lực học tập', 'skills|Kỹ năng học tập',
                        'familyEnv|Gia đình / môi trường', 'mentalHealth|Tâm lý / sức khỏe',
                        'teachingMethod|Phương pháp dạy học', 'otherCause|Khác'
                    ].map(item => {
                        const [id, label] = item.split('|');
                        return `
                            <tr>
                                <td><b>${label}</b></td>
                                <td><input type="text" id="bm02_cause_${id}" value="${d.causes?.[id]||''}" placeholder="Ghi nhận định/bằng chứng cụ thể..." ${ro}></td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>

            <div class="eval-section-title"><i class="fas fa-clipboard-check"></i> C. Kết luận</div>
            <div style="margin-bottom:12px"><label>Nguyên nhân chính được xác định:</label><textarea id="bm02_mainCause" class="form-control" rows="2" ${ro}>${d.mainCause||''}</textarea></div>
            <div>
                <label style="font-weight:700;display:block;margin-bottom:6px">Mức độ cần hỗ trợ:</label>
                <div class="eval-check-grid">
                    ${['theo_doi|Theo dõi', 'thuong_xuyen|Hỗ trợ thường xuyên', 'phoi_hop_ph|Cần phối hợp PH', 'dac_biet|Cần hỗ trợ đặc biệt'].map(item => {
                        const [val, label] = item.split('|');
                        return `
                            <label class="eval-check-item">
                                <input type="radio" name="bm02_supportLevel" value="${val}" ${d.supportLevel===val?'checked':''} ${ro}>
                                <span>${label}</span>
                            </label>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    if (key === 'bm03') {
        const measures = d.measures || {};
        return `
            <div class="eval-section-title"><i class="fas fa-bullseye"></i> 1. Mục tiêu hỗ trợ</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
                <div><label>Họ tên HS</label><input type="text" id="bm03_studentName" class="form-control" value="${d.studentName||''}" ${ro}></div>
                <div><label>Thời gian hỗ trợ</label><input type="text" id="bm03_supportPeriod" class="form-control" placeholder="VD: Từ 10/10/2026 đến 15/12/2026" value="${d.supportPeriod||''}" ${ro}></div>
            </div>
            <div style="margin-bottom:14px"><label>Trong thời gian trên, em sẽ tiến bộ về:</label><textarea id="bm03_goals" class="form-control" rows="2" placeholder="Ghi rõ mục tiêu đọc, viết, tính toán, hành vi..." ${ro}>${d.goals||''}</textarea></div>

            <div class="eval-section-title"><i class="fas fa-hands-helping"></i> 2. Biện pháp hỗ trợ</div>
            <table class="eval-inner-table">
                <thead><tr><th>Biện pháp</th><th style="width:180px">Người thực hiện</th><th style="width:140px">Tần suất</th><th style="width:140px">Thời gian</th></tr></thead>
                <tbody>
                    ${['inClass|Hỗ trợ tại lớp', 'individual|Hỗ trợ riêng', 'peerSupport|Đôi bạn cùng tiến', 'familyCoord|Phối hợp gia đình', 'otherMeasure|Khác'].map(item => {
                        const [id, label] = item.split('|');
                        const m = measures[id] || {};
                        return `
                            <tr>
                                <td><b>${label}</b></td>
                                <td><input type="text" id="bm03_m_${id}_performer" value="${m.performer||''}" placeholder="GVCN/Bạn..." ${ro}></td>
                                <td><input type="text" id="bm03_m_${id}_freq" value="${m.freq||''}" placeholder="Hàng ngày/2 lần/tuần..." ${ro}></td>
                                <td><input type="text" id="bm03_m_${id}_time" value="${m.time||''}" placeholder="15 phút..." ${ro}></td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>

            <div class="eval-section-title"><i class="fas fa-check-double"></i> 3. Tiêu chí thành công & 4. Theo dõi</div>
            <div style="margin-bottom:12px"><label>Tiêu chí cụ thể:</label><textarea id="bm03_criteria" class="form-control" rows="2" ${ro}>${d.criteria||''}</textarea></div>
            <div style="margin-bottom:12px"><label>Biểu hiện / Kết quả ghi nhận & Điều chỉnh:</label><textarea id="bm03_timelineNotes" class="form-control" rows="3" placeholder="Ghi nhận từng đợt theo dõi..." ${ro}>${d.timelineNotes||''}</textarea></div>

            <div class="eval-section-title"><i class="fas fa-flag"></i> 5. Kết luận giai đoạn</div>
            <div class="eval-check-grid">
                ${['tiep_tuc|Tiếp tục hỗ trợ', 'dieu_chinh|Điều chỉnh biện pháp', 'giam_muc|Giảm mức hỗ trợ', 'ket_thuc|Kết thúc hỗ trợ', 'chuyen_sau|Chuyển hỗ trợ chuyên sâu'].map(item => {
                    const [val, label] = item.split('|');
                    return `
                        <label class="eval-check-item">
                            <input type="radio" name="bm03_stageConclusion" value="${val}" ${d.stageConclusion===val?'checked':''} ${ro}>
                            <span>${label}</span>
                        </label>
                    `;
                }).join('')}
            </div>
        `;
    }

    if (key === 'bm04') {
        const rows = d.studentRows || [
            { stt: 1, name: '', inputScore: '', g1: '', g2: '', g3: '', g4: '', note: '' },
            { stt: 2, name: '', inputScore: '', g1: '', g2: '', g3: '', g4: '', note: '' },
            { stt: 3, name: '', inputScore: '', g1: '', g2: '', g3: '', g4: '', note: '' }
        ];
        return `
            <div class="eval-section-title"><i class="fas fa-list-ol"></i> Bảng theo dõi tiến bộ học sinh theo lớp</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px">
                <div><label>Lớp</label><input type="text" id="bm04_classRoom" class="form-control" value="${d.classRoom||window.teacherClass||''}" ${ro}></div>
                <div><label>Năm học</label><input type="text" id="bm04_schoolYear" class="form-control" value="${d.schoolYear||window._currentSchoolYear||'2026-2027'}" ${ro}></div>
            </div>
            <table class="eval-inner-table" id="bm04_students_table">
                <thead><tr><th style="width:40px">STT</th><th>Họ và tên HS</th><th style="width:90px">Đầu vào</th><th style="width:70px">GĐ 1</th><th style="width:70px">GĐ 2</th><th style="width:70px">GĐ 3</th><th style="width:70px">GĐ 4</th><th>Nhận xét</th></tr></thead>
                <tbody>
                    ${rows.map((r, i) => `
                        <tr>
                            <td style="text-align:center">${i+1}</td>
                            <td><input type="text" class="bm04_row_name" value="${r.name||''}" placeholder="Tên HS..." ${ro}></td>
                            <td><input type="text" class="bm04_row_in" value="${r.inputScore||''}" ${ro}></td>
                            <td><input type="text" class="bm04_row_g1" value="${r.g1||''}" ${ro}></td>
                            <td><input type="text" class="bm04_row_g2" value="${r.g2||''}" ${ro}></td>
                            <td><input type="text" class="bm04_row_g3" value="${r.g3||''}" ${ro}></td>
                            <td><input type="text" class="bm04_row_g4" value="${r.g4||''}" ${ro}></td>
                            <td><input type="text" class="bm04_row_note" value="${r.note||''}" ${ro}></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            ${!readOnly ? `<button type="button" class="btn btn-sm btn-outline" onclick="addBM04Row()"><i class="fas fa-plus"></i> Thêm dòng học sinh</button>` : ''}

            <div class="eval-section-title"><i class="fas fa-chart-line"></i> Đánh giá xu hướng & Nhận xét của GV</div>
            <div class="eval-check-grid">
                ${['tien_bo_ro|Tiến bộ rõ', 'co_tien_bo|Có tiến bộ', 'chua_thay_doi|Chưa thay đổi', 'giam_sut|Giảm sút', 'can_ho_tro_them|Cần hỗ trợ thêm'].map(item => {
                    const [val, label] = item.split('|');
                    return `
                        <label class="eval-check-item">
                            <input type="radio" name="bm04_trend" value="${val}" ${d.trend===val?'checked':''} ${ro}>
                            <span>${label}</span>
                        </label>
                    `;
                }).join('')}
            </div>
            <div style="margin:12px 0"><label>Nhận xét của GV:</label><textarea id="bm04_teacherComment" class="form-control" rows="2" ${ro}>${d.teacherComment||''}</textarea></div>
            <div>
                <label style="font-weight:700;display:block;margin-bottom:6px">Quyết định:</label>
                <div class="eval-check-grid">
                    ${['tiep_tuc|Tiếp tục hỗ trợ', 'giam_muc|Giảm mức hỗ trợ', 'ket_thuc|Kết thúc hỗ trợ', 'chuyen_sau|Chuyển sang hỗ trợ chuyên sâu'].map(item => {
                        const [val, label] = item.split('|');
                        return `
                            <label class="eval-check-item">
                                <input type="radio" name="bm04_decision" value="${val}" ${d.decision===val?'checked':''} ${ro}>
                                <span>${label}</span>
                            </label>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    if (key === 'bm05') {
        return `
            <div class="eval-section-title"><i class="fas fa-chalkboard"></i> Thông tin chuyên đề</div>
            <div style="display:grid;grid-template-columns:2fr 1fr;gap:12px;margin-bottom:14px">
                <div><label>Tên chuyên đề</label><input type="text" id="bm05_topic" class="form-control" value="${d.topic||''}" placeholder="Nhập tên chuyên đề tập huấn..." ${ro}></div>
                <div><label>Ngày thực hiện</label><input type="date" id="bm05_date" class="form-control" value="${d.date||new Date().toISOString().split('T')[0]}" ${ro}></div>
            </div>
            <div class="eval-section-title"><i class="fas fa-question-circle"></i> 7 Câu hỏi đánh giá giáo viên</div>
            ${[
                'q1|1. Tôi học được điều gì?',
                'q2|2. Điều nào có thể áp dụng ngay?',
                'q3|3. Tôi sẽ áp dụng vào lớp bằng hoạt động nào?',
                'q4|4. Tôi dự kiến áp dụng vào thời gian nào?',
                'q5|5. Sau khi áp dụng, HS có thay đổi gì?',
                'q6|6. Tôi cần điều chỉnh gì?',
                'q7|7. Tôi cần nhà trường hỗ trợ gì?'
            ].map(item => {
                const [id, label] = item.split('|');
                return `
                    <div style="margin-bottom:12px">
                        <label style="font-weight:700;color:#1e3a8a">${label}</label>
                        <textarea id="bm05_${id}" class="form-control" rows="2" ${ro}>${d[id]||''}</textarea>
                    </div>
                `;
            }).join('')}
        `;
    }

    if (key === 'bm06') {
        const ev = d.evidence || {};
        return `
            <div class="eval-section-title"><i class="fas fa-tasks"></i> Thông tin theo dõi</div>
            <div style="display:grid;grid-template-columns:2fr 1fr 1fr;gap:12px;margin-bottom:14px">
                <div><label>Chuyên đề</label><input type="text" id="bm06_topic" class="form-control" value="${d.topic||''}" ${ro}></div>
                <div><label>Ngày tập huấn</label><input type="date" id="bm06_trainingDate" class="form-control" value="${d.trainingDate||''}" ${ro}></div>
                <div><label>Ngày theo dõi áp dụng</label><input type="date" id="bm06_monitorDate" class="form-control" value="${d.monitorDate||''}" ${ro}></div>
            </div>

            <div class="eval-section-title"><i class="fas fa-check-square"></i> Nội dung áp dụng</div>
            <table class="eval-inner-table">
                <thead><tr><th>Nội dung</th><th style="width:80px">Có</th><th style="width:80px">Chưa</th><th>Ghi chú</th></tr></thead>
                <tbody>
                    ${[
                        'understands|GV hiểu nội dung',
                        'designed|Có thiết kế hoạt động',
                        'applied|Đã áp dụng',
                        'studentProducts|Có sản phẩm HS',
                        'adjusted|Có điều chỉnh sau áp dụng'
                    ].map(item => {
                        const [id, label] = item.split('|');
                        const st = d[id]?.status || '';
                        return `
                            <tr>
                                <td><b>${label}</b></td>
                                <td style="text-align:center"><input type="radio" name="bm06_${id}" value="co" ${st==='co'?'checked':''} ${ro}></td>
                                <td style="text-align:center"><input type="radio" name="bm06_${id}" value="chua" ${st==='chua'?'checked':''} ${ro}></td>
                                <td><input type="text" id="bm06_${id}_note" value="${d[id]?.note||''}" ${ro}></td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>

            <div class="eval-section-title"><i class="fas fa-paperclip"></i> Minh chứng & Mô tả áp dụng</div>
            <div class="eval-check-grid">
                ${['giao_an|Giáo án', 'hinh_anh|Hình ảnh', 'san_pham_hs|Sản phẩm HS', 'video|Video/ghi nhận', 'phan_hoi_hs|Phản hồi HS'].map(item => {
                    const [k, lbl] = item.split('|');
                    return `
                        <label class="eval-check-item">
                            <input type="checkbox" id="bm06_ev_${k}" ${ev[k]?'checked':''} ${ro}>
                            <span>${lbl}</span>
                        </label>
                    `;
                }).join('')}
            </div>
            <div style="margin:12px 0"><label>Mô tả ngắn việc áp dụng:</label><textarea id="bm06_description" class="form-control" rows="3" ${ro}>${d.description||''}</textarea></div>
            <div><label>Nhận xét của Quản lý / BGH:</label><textarea id="bm06_managerComment" class="form-control" rows="2" ${ro}>${d.managerComment||''}</textarea></div>
        `;
    }

    if (key === 'bm07') {
        const p = d.purpose || {};
        return `
            <div class="eval-section-title"><i class="fas fa-home"></i> 1. Thông tin chuyến thăm</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
                <div><label>Ngày thăm</label><input type="date" id="bm07_visitDate" class="form-control" value="${d.visitDate||new Date().toISOString().split('T')[0]}" ${ro}></div>
                <div><label>Người tham gia</label><input type="text" id="bm07_participants" class="form-control" value="${d.participants||''}" placeholder="GVCN, BGH..." ${ro}></div>
            </div>
            <label style="font-weight:700;display:block;margin-bottom:6px">Mục đích chuyến thăm:</label>
            <div class="eval-check-grid">
                ${[
                    'tim_hieu_hoan_canh|Tìm hiểu hoàn cảnh', 'ho_tro_hoc_tap|Hỗ trợ học tập',
                    'ho_so_nhan_than|Hồ sơ nhân thân', 'theo_doi_truong_hop|Theo dõi trường hợp',
                    'phoi_hop_ph|Phối hợp PH'
                ].map(item => {
                    const [k, lbl] = item.split('|');
                    return `
                        <label class="eval-check-item">
                            <input type="checkbox" id="bm07_p_${k}" ${p[k]?'checked':''} ${ro}>
                            <span>${lbl}</span>
                        </label>
                    `;
                }).join('')}
            </div>

            <div class="eval-section-title"><i class="fas fa-clipboard-list"></i> 2. Thông tin ghi nhận & Thỏa thuận</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                <div><label>Hoàn cảnh gia đình:</label><textarea id="bm07_familyCircumstance" class="form-control" rows="2" ${ro}>${d.familyCircumstance||''}</textarea></div>
                <div><label>Điều kiện học tập:</label><textarea id="bm07_studyConditions" class="form-control" rows="2" ${ro}>${d.studyConditions||''}</textarea></div>
                <div><label>Mối quan hệ gia đình:</label><textarea id="bm07_relationships" class="form-control" rows="2" ${ro}>${d.relationships||''}</textarea></div>
                <div><label>Khó khăn hiện tại:</label><textarea id="bm07_difficulties" class="form-control" rows="2" ${ro}>${d.difficulties||''}</textarea></div>
                <div style="grid-column:1/-1"><label>Nhu cầu của học sinh:</label><textarea id="bm07_studentNeeds" class="form-control" rows="2" ${ro}>${d.studentNeeds||''}</textarea></div>
                <div><label>Việc nhà trường sẽ thực hiện:</label><textarea id="bm07_schoolActions" class="form-control" rows="2" ${ro}>${d.schoolActions||''}</textarea></div>
                <div><label>Việc gia đình sẽ thực hiện:</label><textarea id="bm07_familyActions" class="form-control" rows="2" ${ro}>${d.familyActions||''}</textarea></div>
            </div>
            <div style="margin-top:12px"><label>Ngày dự kiến theo dõi tiếp theo:</label><input type="date" id="bm07_followUpDate" class="form-control" style="max-width:240px" value="${d.followUpDate||''}" ${ro}></div>
        `;
    }

    if (key === 'bm08') {
        return `
            <div style="background:#fff1f2;border:1px solid #fecdd3;border-radius:10px;padding:12px;margin-bottom:16px;color:#be123c">
                <i class="fas fa-lock"></i> <b>HỒ SƠ BẢO MẬT:</b> Chỉ người có trách nhiệm (Ban Giám Hiệu, GV phụ trách ca) mới được tiếp cận.
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:14px">
                <div><label>Mã trường hợp</label><input type="text" id="bm08_caseCode" class="form-control" value="${d.caseCode||'BVT-2026-'+Math.floor(Math.random()*900+100)}" ${ro}></div>
                <div><label>Ngày tiếp nhận</label><input type="date" id="bm08_receivedDate" class="form-control" value="${d.receivedDate||new Date().toISOString().split('T')[0]}" ${ro}></div>
                <div><label>Người phụ trách</label><input type="text" id="bm08_officer" class="form-control" value="${d.officer||window.teacherName||''}" ${ro}></div>
            </div>

            <div class="eval-section-title"><i class="fas fa-exclamation-circle"></i> A. Vấn đề ghi nhận</div>
            <textarea id="bm08_recordedIssue" class="form-control" rows="3" placeholder="Mô tả chi tiết vấn đề an toàn, bạo lực, bỏ rơi, sang chấn tâm lý..." ${ro}>${d.recordedIssue||''}</textarea>

            <div class="eval-section-title"><i class="fas fa-shield-alt"></i> B. Mức độ cần hỗ trợ & Tình trạng</div>
            <div class="eval-check-grid">
                ${['theo_doi|Theo dõi', 'can_thiep|Cần can thiệp', 'phoi_hop_chuyen_mon|Cần phối hợp chuyên môn', 'khan_cap|Khẩn cấp'].map(item => {
                    const [val, label] = item.split('|');
                    return `
                        <label class="eval-check-item">
                            <input type="radio" name="bm08_supportLevel" value="${val}" ${d.supportLevel===val?'checked':''} ${ro}>
                            <span>${label}</span>
                        </label>
                    `;
                }).join('')}
            </div>

            <div class="eval-section-title"><i class="fas fa-history"></i> C. Các bước đã thực hiện & Đối tác phối hợp</div>
            <div style="margin-bottom:12px"><label>Hành động / Can thiệp đã triển khai:</label><textarea id="bm08_actionsTaken" class="form-control" rows="3" placeholder="Ghi rõ ngày, hành động, kết quả..." ${ro}>${d.actionsTaken||''}</textarea></div>
            <div style="margin-bottom:12px"><label>Đối tác phối hợp (UBND, Công an, Y tế, Hội phụ nữ...):</label><input type="text" id="bm08_partners" class="form-control" value="${d.partners||''}" ${ro}></div>

            <div class="eval-section-title"><i class="fas fa-flag-checkered"></i> E. Tình trạng hiện tại</div>
            <div class="eval-check-grid">
                ${['dang_theo_doi|Đang theo dõi', 'da_cai_thien|Đã cải thiện', 'da_giai_quyet|Đã giải quyết', 'chuyen_tiep|Chuyển tiếp', 'tiep_tuc_nam_sau|Cần tiếp tục năm học sau'].map(item => {
                    const [val, label] = item.split('|');
                    return `
                        <label class="eval-check-item">
                            <input type="radio" name="bm08_currentStatus" value="${val}" ${d.currentStatus===val?'checked':''} ${ro}>
                            <span>${label}</span>
                        </label>
                    `;
                }).join('')}
            </div>
        `;
    }

    if (key === 'bm09') {
        const ev = d.evidence || {};
        return `
            <div class="eval-section-title"><i class="fas fa-calendar-check"></i> Thông tin kiểm thảo</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px">
                <div><label>Tháng kiểm thảo</label><input type="text" id="bm09_month" class="form-control" value="${d.month||'Tháng '+(new Date().getMonth()+1)}" ${ro}></div>
                <div><label>Người thực hiện</label><input type="text" id="bm09_performer" class="form-control" value="${d.performer||window.teacherName||''}" ${ro}></div>
            </div>

            <div class="eval-section-title"><i class="fas fa-check-circle"></i> 1. Việc quan trọng đã hoàn thành</div>
            <textarea id="bm09_tasksCompleted" class="form-control" rows="3" placeholder="Ghi các đầu việc trọng tâm đã thực hiện trong tháng..." ${ro}>${d.tasksCompleted||''}</textarea>

            <div class="eval-section-title"><i class="fas fa-star"></i> 2. Kết quả nổi bật & 3. Việc chưa đạt</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                <div><label>Kết quả nổi bật:</label><textarea id="bm09_highlights" class="form-control" rows="2" ${ro}>${d.highlights||''}</textarea></div>
                <div><label>Việc chưa đạt & Nguyên nhân:</label><textarea id="bm09_unmetAndCauses" class="form-control" rows="2" ${ro}>${d.unmetAndCauses||''}</textarea></div>
                <div><label>HS cần quan tâm:</label><textarea id="bm09_studentsNeedCare" class="form-control" rows="2" ${ro}>${d.studentsNeedCare||''}</textarea></div>
                <div><label>Vấn đề bảo vệ trẻ cần tiếp tục:</label><textarea id="bm09_childProtection" class="form-control" rows="2" ${ro}>${d.childProtection||''}</textarea></div>
                <div style="grid-column:1/-1"><label>Việc cần điều chỉnh tháng tới:</label><textarea id="bm09_adjustmentsNextMonth" class="form-control" rows="2" ${ro}>${d.adjustmentsNextMonth||''}</textarea></div>
            </div>

            <div class="eval-section-title"><i class="fas fa-folder"></i> 8. Minh chứng đã lưu</div>
            <div class="eval-check-grid">
                ${['hinh_anh|Hình ảnh', 'danh_sach|Danh sách', 'bang_ket_qua|Bảng kết quả', 'san_pham|Sản phẩm', 'bien_ban|Biên bản', 'ho_so_truong_hop|Hồ sơ trường hợp'].map(item => {
                    const [k, lbl] = item.split('|');
                    return `
                        <label class="eval-check-item">
                            <input type="checkbox" id="bm09_ev_${k}" ${ev[k]?'checked':''} ${ro}>
                            <span>${lbl}</span>
                        </label>
                    `;
                }).join('')}
            </div>
        `;
    }

    if (key === 'bm10') {
        return `
            <div class="eval-section-title"><i class="fas fa-chart-pie"></i> Báo cáo tổng hợp cuối năm học (Dành cho Quản lý)</div>
            <p style="color:#64748b;font-size:0.86rem">Dữ liệu được hệ thống tự động tổng hợp từ các biểu mẫu BM01 đến BM09 đã duyệt trong năm học.</p>
            <div style="margin-bottom:12px"><label>Kết quả nổi bật toàn trường:</label><textarea id="bm10_highlights" class="form-control" rows="3" ${ro}>${d.highlights||''}</textarea></div>
            <div style="margin-bottom:12px"><label>Chỉ số chưa đạt & Nguyên nhân:</label><textarea id="bm10_unmetAndCauses" class="form-control" rows="3" ${ro}>${d.unmetAndCauses||''}</textarea></div>
            <div style="margin-bottom:12px"><label>Điều chỉnh hoặc ưu tiên năm học sau:</label><textarea id="bm10_futurePriorities" class="form-control" rows="3" ${ro}>${d.futurePriorities||''}</textarea></div>
        `;
    }

    if (key === 'bm11') {
        const parts = d.participants || {};
        const ev = d.evidenceOfChange || {};
        return `
            <div class="eval-section-title"><i class="fas fa-book-reader"></i> Thông tin học sinh</div>
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:14px">
                <div><label>Mã HS</label><input type="text" id="bm11_studentCode" class="form-control" value="${d.studentCode||''}" ${ro}></div>
                <div><label>Họ tên HS</label><input type="text" id="bm11_studentName" class="form-control" value="${d.studentName||''}" ${ro}></div>
                <div><label>Lớp</label><input type="text" id="bm11_classRoom" class="form-control" value="${d.classRoom||''}" ${ro}></div>
            </div>

            <div class="eval-section-title"><i class="fas fa-history"></i> 1. Trước khi hỗ trợ & 2. Nhà trường đã làm gì?</div>
            <div style="margin-bottom:12px"><label>Trước khi được hỗ trợ – Em gặp khó khăn gì?</label><textarea id="bm11_beforeSupport" class="form-control" rows="3" placeholder="Hoàn cảnh, học lực, tâm lý, sự tự ti..." ${ro}>${d.beforeSupport||''}</textarea></div>
            <div style="margin-bottom:12px"><label>Nhà trường đã làm gì?</label><textarea id="bm11_schoolActions" class="form-control" rows="3" placeholder="Các giải pháp hỗ trợ học tập, rèn luyện, thăm gia đình..." ${ro}>${d.schoolActions||''}</textarea></div>

            <div class="eval-section-title"><i class="fas fa-users"></i> 3. Ai đã tham gia hỗ trợ?</div>
            <div class="eval-check-grid">
                ${['gv|Giáo viên', 'gvcn|GVCN', 'ph|Phụ huynh', 'nha_truong|Nhà trường', 'doi_tac|Đối tác', 'tai_tro|Nhà tài trợ'].map(item => {
                    const [k, lbl] = item.split('|');
                    return `
                        <label class="eval-check-item">
                            <input type="checkbox" id="bm11_part_${k}" ${parts[k]?'checked':''} ${ro}>
                            <span>${lbl}</span>
                        </label>
                    `;
                }).join('')}
            </div>

            <div class="eval-section-title"><i class="fas fa-seedling"></i> 4. Sau một thời gian – Em đã thay đổi điều gì?</div>
            <textarea id="bm11_changesObserved" class="form-control" rows="3" placeholder="Sự tiến bộ rõ nét nhất của em..." ${ro}>${d.changesObserved||''}</textarea>

            <div class="eval-section-title"><i class="fas fa-medal"></i> 5. Minh chứng về thay đổi</div>
            <div class="eval-check-grid">
                ${['ket_qua_hoc_tap|Kết quả học tập', 'hanh_vi|Hành vi', 'chuyen_can|Chuyên cần', 'ky_nang|Kỹ năng', 'tu_tin|Sự tự tin', 'quan_he_ban_be|Quan hệ bạn bè', 'tu_bao_ve|Tự bảo vệ'].map(item => {
                    const [k, lbl] = item.split('|');
                    return `
                        <label class="eval-check-item">
                            <input type="checkbox" id="bm11_ev_${k}" ${ev[k]?'checked':''} ${ro}>
                            <span>${lbl}</span>
                        </label>
                    `;
                }).join('')}
            </div>
            <div style="margin:12px 0"><label>Mô tả minh chứng:</label><textarea id="bm11_evidenceDesc" class="form-control" rows="2" ${ro}>${d.evidenceDesc||''}</textarea></div>
            <div style="margin-bottom:12px"><label style="font-weight:700;color:#d97706">6. Một câu nói của em:</label><input type="text" id="bm11_studentQuote" class="form-control" placeholder="Trích dẫn nguyên văn câu nói cảm xúc của em..." value="${d.studentQuote||''}" ${ro}></div>
            <div><label>7. Bài học của nhà trường:</label><textarea id="bm11_schoolLessons" class="form-control" rows="2" ${ro}>${d.schoolLessons||''}</textarea></div>
        `;
    }

    return '<p>Biểu mẫu đang được cập nhật.</p>';
}

window.addBM04Row = function() {
    const tbody = document.querySelector('#bm04_students_table tbody');
    if (!tbody) return;
    const count = tbody.children.length + 1;
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td style="text-align:center">${count}</td>
        <td><input type="text" class="bm04_row_name" placeholder="Tên HS..."></td>
        <td><input type="text" class="bm04_row_in"></td>
        <td><input type="text" class="bm04_row_g1"></td>
        <td><input type="text" class="bm04_row_g2"></td>
        <td><input type="text" class="bm04_row_g3"></td>
        <td><input type="text" class="bm04_row_g4"></td>
        <td><input type="text" class="bm04_row_note"></td>
    `;
    tbody.appendChild(tr);
};

// ── 13. THU THẬP DỮ LIỆU TỪ DOM ĐỂ LƯU ────────────────────────────────────────
function collectFormSpecificFields(key) {
    const d = {};
    const getVal = id => document.getElementById(id)?.value?.trim() || '';
    const getRadio = name => document.querySelector(`input[name="${name}"]:checked`)?.value || '';
    const getCheck = id => document.getElementById(id)?.checked === true;

    if (key === 'bm01') {
        d.studentName = getVal('bm01_studentName');
        d.classRoom = getVal('bm01_classRoom');
        d.dob = getVal('bm01_dob');
        d.birthPlace = getVal('bm01_birthPlace');
        d.caregiverName = getVal('bm01_caregiverName');
        d.phone = getVal('bm01_phone');
        d.currentAddress = getVal('bm01_currentAddress');

        ['birthCert', 'parentsId', 'residence', 'academic', 'otherDocs'].forEach(id => {
            d[id] = {
                status: getRadio(`bm01_${id}`),
                note: getVal(`bm01_${id}_note`)
            };
        });

        d.classification = getRadio('bm01_classification');
        d.issues = getVal('bm01_issues');
        d.cooperatingParty = getVal('bm01_cooperatingParty');
        d.supervisor = getVal('bm01_supervisor');
        d.actions = getVal('bm01_actions');
        d.deadline = getVal('bm01_deadline');
    } else if (key === 'bm02') {
        d.studentName = getVal('bm02_studentName');
        d.classRoom = getVal('bm02_classRoom');
        d.subject = getVal('bm02_subject');
        d.manifestations = {
            notCompleted: getCheck('bm02_mf_notCompleted'),
            lostFoundation: getCheck('bm02_mf_lostFoundation'),
            hardToFocus: getCheck('bm02_mf_hardToFocus'),
            lackMotivation: getCheck('bm02_mf_lackMotivation'),
            slowSkills: getCheck('bm02_mf_slowSkills'),
            shyParticipation: getCheck('bm02_mf_shyParticipation'),
            familyIssues: getCheck('bm02_mf_familyIssues'),
            healthIssues: getCheck('bm02_mf_healthIssues'),
            other: getVal('bm02_mf_other')
        };
        d.causes = {
            motivation: getVal('bm02_cause_motivation'),
            skills: getVal('bm02_cause_skills'),
            familyEnv: getVal('bm02_cause_familyEnv'),
            mentalHealth: getVal('bm02_cause_mentalHealth'),
            teachingMethod: getVal('bm02_cause_teachingMethod'),
            otherCause: getVal('bm02_cause_otherCause')
        };
        d.mainCause = getVal('bm02_mainCause');
        d.supportLevel = getRadio('bm02_supportLevel');
    } else if (key === 'bm03') {
        d.studentName = getVal('bm03_studentName');
        d.supportPeriod = getVal('bm03_supportPeriod');
        d.goals = getVal('bm03_goals');
        d.measures = {};
        ['inClass', 'individual', 'peerSupport', 'familyCoord', 'otherMeasure'].forEach(id => {
            d.measures[id] = {
                performer: getVal(`bm03_m_${id}_performer`),
                freq: getVal(`bm03_m_${id}_freq`),
                time: getVal(`bm03_m_${id}_time`)
            };
        });
        d.criteria = getVal('bm03_criteria');
        d.timelineNotes = getVal('bm03_timelineNotes');
        d.stageConclusion = getRadio('bm03_stageConclusion');
    } else if (key === 'bm04') {
        d.classRoom = getVal('bm04_classRoom');
        d.schoolYear = getVal('bm04_schoolYear');
        const rows = [];
        document.querySelectorAll('#bm04_students_table tbody tr').forEach((tr, i) => {
            const name = tr.querySelector('.bm04_row_name')?.value?.trim();
            if (name) {
                rows.push({
                    stt: i + 1,
                    name,
                    inputScore: tr.querySelector('.bm04_row_in')?.value || '',
                    g1: tr.querySelector('.bm04_row_g1')?.value || '',
                    g2: tr.querySelector('.bm04_row_g2')?.value || '',
                    g3: tr.querySelector('.bm04_row_g3')?.value || '',
                    g4: tr.querySelector('.bm04_row_g4')?.value || '',
                    note: tr.querySelector('.bm04_row_note')?.value || ''
                });
            }
        });
        d.studentRows = rows;
        d.trend = getRadio('bm04_trend');
        d.teacherComment = getVal('bm04_teacherComment');
        d.decision = getRadio('bm04_decision');
    } else if (key === 'bm05') {
        d.topic = getVal('bm05_topic');
        d.date = getVal('bm05_date');
        for (let i = 1; i <= 7; i++) d[`q${i}`] = getVal(`bm05_q${i}`);
    } else if (key === 'bm06') {
        d.topic = getVal('bm06_topic');
        d.trainingDate = getVal('bm06_trainingDate');
        d.monitorDate = getVal('bm06_monitorDate');
        ['understands', 'designed', 'applied', 'studentProducts', 'adjusted'].forEach(id => {
            d[id] = {
                status: getRadio(`bm06_${id}`),
                note: getVal(`bm06_${id}_note`)
            };
        });
        d.evidence = {
            giao_an: getCheck('bm06_ev_giao_an'),
            hinh_anh: getCheck('bm06_ev_hinh_anh'),
            san_pham_hs: getCheck('bm06_ev_san_pham_hs'),
            video: getCheck('bm06_ev_video'),
            phan_hoi_hs: getCheck('bm06_ev_phan_hoi_hs')
        };
        d.description = getVal('bm06_description');
        d.managerComment = getVal('bm06_managerComment');
    } else if (key === 'bm07') {
        d.visitDate = getVal('bm07_visitDate');
        d.participants = getVal('bm07_participants');
        d.purpose = {
            tim_hieu_hoan_canh: getCheck('bm07_p_tim_hieu_hoan_canh'),
            ho_tro_hoc_tap: getCheck('bm07_p_ho_tro_hoc_tap'),
            ho_so_nhan_than: getCheck('bm07_p_ho_so_nhan_than'),
            theo_doi_truong_hop: getCheck('bm07_p_theo_doi_truong_hop'),
            phoi_hop_ph: getCheck('bm07_p_phoi_hop_ph')
        };
        d.familyCircumstance = getVal('bm07_familyCircumstance');
        d.studyConditions = getVal('bm07_studyConditions');
        d.relationships = getVal('bm07_relationships');
        d.difficulties = getVal('bm07_difficulties');
        d.studentNeeds = getVal('bm07_studentNeeds');
        d.schoolActions = getVal('bm07_schoolActions');
        d.familyActions = getVal('bm07_familyActions');
        d.followUpDate = getVal('bm07_followUpDate');
    } else if (key === 'bm08') {
        d.caseCode = getVal('bm08_caseCode');
        d.receivedDate = getVal('bm08_receivedDate');
        d.officer = getVal('bm08_officer');
        d.recordedIssue = getVal('bm08_recordedIssue');
        d.supportLevel = getRadio('bm08_supportLevel');
        d.actionsTaken = getVal('bm08_actionsTaken');
        d.partners = getVal('bm08_partners');
        d.currentStatus = getRadio('bm08_currentStatus');
    } else if (key === 'bm09') {
        d.month = getVal('bm09_month');
        d.performer = getVal('bm09_performer');
        d.tasksCompleted = getVal('bm09_tasksCompleted');
        d.highlights = getVal('bm09_highlights');
        d.unmetAndCauses = getVal('bm09_unmetAndCauses');
        d.studentsNeedCare = getVal('bm09_studentsNeedCare');
        d.childProtection = getVal('bm09_childProtection');
        d.adjustmentsNextMonth = getVal('bm09_adjustmentsNextMonth');
        d.evidence = {
            hinh_anh: getCheck('bm09_ev_hinh_anh'),
            danh_sach: getCheck('bm09_ev_danh_sach'),
            bang_ket_qua: getCheck('bm09_ev_bang_ket_qua'),
            san_pham: getCheck('bm09_ev_san_pham'),
            bien_ban: getCheck('bm09_ev_bien_ban'),
            ho_so_truong_hop: getCheck('bm09_ev_ho_so_truong_hop')
        };
    } else if (key === 'bm10') {
        d.highlights = getVal('bm10_highlights');
        d.unmetAndCauses = getVal('bm10_unmetAndCauses');
        d.futurePriorities = getVal('bm10_futurePriorities');
    } else if (key === 'bm11') {
        d.studentCode = getVal('bm11_studentCode');
        d.studentName = getVal('bm11_studentName');
        d.classRoom = getVal('bm11_classRoom');
        d.beforeSupport = getVal('bm11_beforeSupport');
        d.schoolActions = getVal('bm11_schoolActions');
        d.participants = {
            gv: getCheck('bm11_part_gv'),
            gvcn: getCheck('bm11_part_gvcn'),
            ph: getCheck('bm11_part_ph'),
            nha_truong: getCheck('bm11_part_nha_truong'),
            doi_tac: getCheck('bm11_part_doi_tac'),
            tai_tro: getCheck('bm11_part_tai_tro')
        };
        d.changesObserved = getVal('bm11_changesObserved');
        d.evidenceOfChange = {
            ket_qua_hoc_tap: getCheck('bm11_ev_ket_qua_hoc_tap'),
            hanh_vi: getCheck('bm11_ev_hanh_vi'),
            chuyen_can: getCheck('bm11_ev_chuyen_can'),
            ky_nang: getCheck('bm11_ev_ky_nang'),
            tu_tin: getCheck('bm11_ev_tu_tin'),
            quan_he_ban_be: getCheck('bm11_ev_quan_he_ban_be'),
            tu_bao_ve: getCheck('bm11_ev_tu_bao_ve')
        };
        d.evidenceDesc = getVal('bm11_evidenceDesc');
        d.studentQuote = getVal('bm11_studentQuote');
        d.schoolLessons = getVal('bm11_schoolLessons');
    }

    return d;
}

// ── 14. LƯU PHIẾU (NHÁP HOẶC NỘP CHO BGH) ───────────────────────────────────
export async function saveEvaluationSubmission(status = 'draft') {
    if (!currentEditingSubmission) return;

    const formKey = currentEditingSubmission.formType;
    const formDef = EVAL_FORMS[formKey];
    const formData = collectFormSpecificFields(formKey);

    const now = Date.now();
    const id = currentEditingSubmission.id || ('sub_' + formKey + '_' + now + '_' + Math.random().toString(36).substr(2, 6));

    const payload = {
        ...currentEditingSubmission,
        id,
        status,
        formData,
        updatedAt: now,
        createdAt: currentEditingSubmission.createdAt || now
    };

    // Tiêu đề tóm tắt hiển thị trên bảng
    if (formDef.requiresStudent) {
        payload.studentName = formData.studentName || currentEditingSubmission.studentName || 'Học sinh';
        payload.classRoom = formData.classRoom || currentEditingSubmission.classRoom || '';
    } else {
        payload.title = formData.topic || formData.month || formDef.shortTitle;
    }

    try {
        await window.set(window.ref(window.db, `evaluations/submissions/${id}`), payload);
        evalState.submissions[id] = payload;

        closeModal('modal-eval-form');
        const actionText = status === 'submitted' ? 'Đã gửi phiếu lên Ban Giám Hiệu xét duyệt!' : 'Đã lưu bản nháp thành công.';
        Swal.fire({ icon: 'success', title: 'Thành công', text: actionText, timer: 2000, showConfirmButton: false });

        renderEvaluations();
    } catch (err) {
        console.error('[Evaluations] saveSubmission error:', err);
        Swal.fire('Lỗi', 'Không lưu được phiếu: ' + err.message, 'error');
    }
}
window.saveEvaluationSubmission = saveEvaluationSubmission;

// ── 15. BGH XÉT DUYỆT & NHẬN XÉT PHIẾU ────────────────────────────────────────
let currentReviewingSubmissionId = null;

export function openReviewSubmissionModal(submissionId) {
    const sub = evalState.submissions[submissionId];
    if (!sub) return;

    currentReviewingSubmissionId = submissionId;
    const formDef = EVAL_FORMS[sub.formType] || {};

    const modal = document.getElementById('modal-eval-review');
    if (!modal) return;

    document.getElementById('eval-review-sub-title').textContent = `${formDef.code} — ${sub.studentName || sub.title || formDef.shortTitle}`;
    document.getElementById('eval-review-teacher-info').textContent = `Người lập: ${sub.teacherName || '---'} | Lớp: ${sub.classRoom || '---'} | Ngày gửi: ${sub.updatedAt ? new Date(sub.updatedAt).toLocaleDateString('vi-VN') : '---'}`;
    document.getElementById('eval-review-feedback').value = sub.managerFeedback || '';

    modal.style.display = 'flex';
}
window.openReviewSubmissionModal = openReviewSubmissionModal;

export async function submitReviewDecision(approved) {
    if (!currentReviewingSubmissionId) return;
    const sub = evalState.submissions[currentReviewingSubmissionId];
    if (!sub) return;

    const feedback = document.getElementById('eval-review-feedback')?.value?.trim() || '';
    const newStatus = approved ? 'approved' : 'returned';
    const now = Date.now();

    const updates = {
        [`evaluations/submissions/${currentReviewingSubmissionId}/status`]: newStatus,
        [`evaluations/submissions/${currentReviewingSubmissionId}/managerFeedback`]: feedback,
        [`evaluations/submissions/${currentReviewingSubmissionId}/managerApprovedBy`]: window.currentUser?.email || 'Quản lý',
        [`evaluations/submissions/${currentReviewingSubmissionId}/managerApprovedAt`]: now,
        [`evaluations/submissions/${currentReviewingSubmissionId}/updatedAt`]: now
    };

    try {
        await window.update(window.ref(window.db), updates);
        sub.status = newStatus;
        sub.managerFeedback = feedback;
        sub.managerApprovedBy = window.currentUser?.email || 'Quản lý';
        sub.managerApprovedAt = now;
        sub.updatedAt = now;

        closeModal('modal-eval-review');
        const msg = approved ? 'Đã duyệt hoàn thành phiếu và đóng dấu Quản lý!' : 'Đã trả phiếu về cho giáo viên để chỉnh sửa.';
        Swal.fire({ icon: 'success', title: approved ? 'Đã duyệt' : 'Đã trả về', text: msg, timer: 2000, showConfirmButton: false });

        renderEvaluations();
    } catch(err) {
        Swal.fire('Lỗi', 'Không cập nhật được kết quả duyệt: ' + err.message, 'error');
    }
}
window.submitReviewDecision = submitReviewDecision;

// ── 16. XÓA PHIẾU ─────────────────────────────────────────────────────────────
export async function deleteEvaluationSubmission(submissionId) {
    const sub = evalState.submissions[submissionId];
    if (!sub) return;

    const isAdmin = window.userRole === 'admin';
    if (!isAdmin && sub.teacherUid !== window.currentUser?.uid) {
        Swal.fire('Không có quyền', 'Chỉ người lập phiếu hoặc Ban Giám Hiệu mới được xóa phiếu này.', 'error');
        return;
    }

    const confirm = await Swal.fire({
        title: 'Xác nhận xóa?',
        text: 'Phiếu này sẽ bị xóa vĩnh viễn khỏi hệ thống.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Đồng ý xóa',
        cancelButtonText: 'Hủy'
    });
    if (!confirm.isConfirmed) return;

    try {
        await window.remove(window.ref(window.db, `evaluations/submissions/${submissionId}`));
        delete evalState.submissions[submissionId];
        Swal.fire('Đã xóa', 'Phiếu đã được xóa.', 'success');
        renderEvaluations();
    } catch(e) {
        Swal.fire('Lỗi', 'Không thể xóa phiếu: ' + e.message, 'error');
    }
}
window.deleteEvaluationSubmission = deleteEvaluationSubmission;

// ── 17. XEM TRƯỚC VÀ IN BIỂU MẪU A4 CHUẨN VĂN BẢN ─────────────────────────────
export function printEvaluationSubmission(submissionId, sampleObj = null) {
    const sub = sampleObj || evalState.submissions[submissionId];
    if (!sub) return;

    const printContainer = document.getElementById('eval-print-content');
    if (!printContainer) return;

    printContainer.innerHTML = buildPrintA4Document(sub);

    const modal = document.getElementById('modal-eval-print');
    if (modal) modal.style.display = 'block';
}
window.printEvaluationSubmission = printEvaluationSubmission;

export function triggerPrintDialog() {
    window.print();
}
window.triggerPrintDialog = triggerPrintDialog;

function buildPrintA4Document(sub) {
    const formDef = EVAL_FORMS[sub.formType] || {};
    const d = sub.formData || {};
    const sy = sub.schoolYear || '2026–2027';

    // Nội dung chi tiết in theo từng mẫu
    let bodyHtml = '';
    if (sub.formType === 'bm01') {
        bodyHtml = `
            <div style="margin-bottom:10px">
                <b>Họ và tên HS:</b> ${d.studentName||sub.studentName||'..................................................................'} &nbsp;&nbsp;&nbsp;&nbsp; <b>Lớp:</b> ${d.classRoom||sub.classRoom||'................'}<br>
                <b>Ngày sinh:</b> ${d.dob||'................................'} &nbsp;&nbsp;&nbsp;&nbsp; <b>Nơi sinh:</b> ${d.birthPlace||'........................................................'}<br>
                <b>GVCN:</b> ${sub.teacherName||'........................................................................................................................'}<br>
                <b>Người chăm sóc chính:</b> ${d.caregiverName||'........................................................................................................................'}<br>
                <b>Số điện thoại:</b> ${d.phone||'........................................................................................................................'}<br>
                <b>Địa chỉ hiện tại:</b> ${d.currentAddress||'........................................................................................................................'}
            </div>
            <div style="font-weight:bold;margin:8px 0 4px">A. Tình trạng hồ sơ</div>
            <table class="eval-print-table">
                <thead><tr><th>Hồ sơ</th><th style="width:50px">Có</th><th style="width:60px">Thiếu</th><th style="width:130px">Chưa xác minh</th><th>Ghi chú</th></tr></thead>
                <tbody>
                    ${['birthCert|Giấy khai sinh', 'parentsId|CCCD/giấy tờ của cha/mẹ', 'residence|Hồ sơ cư trú', 'academic|Hồ sơ học tập', 'otherDocs|Hồ sơ khác'].map(it => {
                        const [id, label] = it.split('|');
                        const st = d[id]?.status || '';
                        return `
                            <tr>
                                <td>${label}</td>
                                <td style="text-align:center">${st==='co'?'☑':'☐'}</td>
                                <td style="text-align:center">${st==='thieu'?'☑':'☐'}</td>
                                <td style="text-align:center">${st==='chua_xac_minh'?'☑':'☐'}</td>
                                <td>${d[id]?.note||''}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
            <div style="font-weight:bold;margin:8px 0 4px">B. Phân loại</div>
            <div style="margin-bottom:8px">
                ${d.classification==='day_du'?'☑':'☐'} Hồ sơ đầy đủ &nbsp;&nbsp;&nbsp;&nbsp;
                ${d.classification==='thieu_bo_sung'?'☑':'☐'} Thiếu hồ sơ nhưng có thể bổ sung &nbsp;&nbsp;&nbsp;&nbsp;
                ${d.classification==='kho_xac_minh'?'☑':'☐'} Khó xác minh &nbsp;&nbsp;&nbsp;&nbsp;
                ${d.classification==='can_ho_tro_phap_ly'?'☑':'☐'} Cần hỗ trợ pháp lý/xã hội
            </div>
            <div style="font-weight:bold;margin:8px 0 4px">C. Hướng xử lý</div>
            <div>
                Vấn đề cần giải quyết: ${d.issues||'............................................................................................................................................'}<br>
                Người/đơn vị phối hợp: ${d.cooperatingParty||'............................................................................................................................................'}<br>
                Việc cần thực hiện: ${d.actions||'............................................................................................................................................'}<br>
                Thời hạn dự kiến: ${d.deadline||'..................................................................'} &nbsp;&nbsp;&nbsp;&nbsp; Người theo dõi: ${d.supervisor||'..................................................................'}
            </div>
        `;
    } else {
        // Render mẫu mặc định thanh lịch cho các form khác
        bodyHtml = `
            <div style="padding:10px 0;line-height:1.6">
                <div><b>Học sinh / Đối tượng:</b> ${sub.studentName || sub.title || '...................................................'} &nbsp;&nbsp;&nbsp;&nbsp; <b>Lớp:</b> ${sub.classRoom || '................'}</div>
                <div><b>Giáo viên phụ trách:</b> ${sub.teacherName || '...................................................'} &nbsp;&nbsp;&nbsp;&nbsp; <b>Thời gian:</b> ${sub.schoolYear || '2026-2027'}</div>
                <div style="margin-top:14px;border:1px solid #000;padding:12px;min-height:220px;border-radius:4px">
                    <div style="font-weight:bold;margin-bottom:8px">NỘI DUNG GHI NHẬN & ĐÁNH GIÁ:</div>
                    ${Object.entries(d).map(([k, v]) => {
                        if (typeof v === 'object') return '';
                        return `<div style="margin-bottom:6px"><b>${k}:</b> ${v}</div>`;
                    }).join('')}
                    ${sub.managerFeedback ? `<div style="margin-top:12px;border-top:1px dashed #000;padding-top:8px"><b>NHẬN XÉT CỦA QUẢN LÝ:</b> ${sub.managerFeedback}</div>` : ''}
                </div>
            </div>
        `;
    }

    return `
        <div class="eval-print-sheet">
            <div class="eval-print-header">
                <div class="school-name">LỚP PHỔ CẬP NAM HÒA</div>
                <div class="school-year">NĂM HỌC ${sy}</div>
                <div class="doc-set">BỘ 11 BIỂU MẪU QUẢN LÝ</div>
                <div class="doc-tag">DÙNG ĐỂ IN VÀ SỬ DỤNG TRỰC TIẾP TRONG QUẢN LÝ, THEO DÕI, ĐÁNH GIÁ</div>
                <div style="font-size:10pt;font-style:italic">BẢN SỬ DỤNG NỘI BỘ</div>
                <div class="form-code">${formDef.code || 'BIỂU MẪU'}</div>
                <div class="form-title">${formDef.title || ''}</div>
            </div>

            ${bodyHtml}

            <div class="eval-print-signatures">
                <div class="eval-print-sig-col">
                    <div class="sig-title">Người lập phiếu</div>
                    <div class="sig-sub">(Ký, ghi rõ họ tên)</div>
                    <div class="sig-space"></div>
                    <div class="sig-name">${sub.teacherName || ''}</div>
                </div>
                <div class="eval-print-sig-col">
                    <div class="sig-title">GVCN / Người phụ trách</div>
                    <div class="sig-sub">(Ký, ghi rõ họ tên)</div>
                    <div class="sig-space"></div>
                    <div class="sig-name">${sub.teacherName || ''}</div>
                </div>
                <div class="eval-print-sig-col">
                    <div class="sig-title">Quản lý / Ban Giám Hiệu</div>
                    <div class="sig-sub">(Ký, ghi rõ họ tên)</div>
                    <div class="sig-space"></div>
                    <div class="sig-name">${sub.managerApprovedBy || 'BGH Phê duyệt'}</div>
                </div>
            </div>
        </div>
    `;
}

// ── 18. QUẢN LÝ ĐỢT ĐÁNH GIÁ (BGH / ADMIN) ────────────────────────────────────
let currentEditingPeriodId = null;

export function openPeriodModal(periodId = null) {
    currentEditingPeriodId = periodId;
    const modal = document.getElementById('modal-eval-period');
    if (!modal) return;

    const period = periodId ? evalState.periods[periodId] : null;
    const sy = window._currentSchoolYear || '2026-2027';

    document.getElementById('eval-period-name').value = period?.name || `Đánh giá định kỳ (${sy})`;
    document.getElementById('eval-period-year').value = period?.schoolYear || sy;
    document.getElementById('eval-period-sem').value = period?.semester || 'hk1';
    document.getElementById('eval-period-start').value = period?.startDate || '';
    document.getElementById('eval-period-end').value = period?.endDate || '';
    document.getElementById('eval-period-status').value = period?.status || 'open';
    document.getElementById('eval-period-notes').value = period?.notes || '';

    // Checkboxes 11 biểu mẫu
    const allowed = period?.allowedForms || Object.keys(EVAL_FORMS);
    const wrap = document.getElementById('eval-period-forms-checks');
    if (wrap) {
        wrap.innerHTML = Object.values(EVAL_FORMS).map(f => `
            <label class="eval-check-item">
                <input type="checkbox" class="eval-period-form-chk" value="${f.key}" ${allowed.includes(f.key)?'checked':''}>
                <span><b>${f.code}:</b> ${f.shortTitle}</span>
            </label>
        `).join('');
    }

    modal.style.display = 'flex';
}
window.openPeriodModal = openPeriodModal;

export async function savePeriodSettings() {
    const name = document.getElementById('eval-period-name')?.value?.trim();
    if (!name) {
        Swal.fire('Lỗi', 'Vui lòng nhập tên đợt đánh giá.', 'warning');
        return;
    }

    const sy = document.getElementById('eval-period-year')?.value || '2026-2027';
    const sem = document.getElementById('eval-period-sem')?.value || 'hk1';
    const startDate = document.getElementById('eval-period-start')?.value || '';
    const endDate = document.getElementById('eval-period-end')?.value || '';
    const status = document.getElementById('eval-period-status')?.value || 'open';
    const notes = document.getElementById('eval-period-notes')?.value || '';

    const allowedForms = Array.from(document.querySelectorAll('.eval-period-form-chk:checked')).map(el => el.value);

    const id = currentEditingPeriodId || (`${sy.replace('-','_')}_${Date.now()}`);
    const payload = {
        id,
        name,
        schoolYear: sy,
        semester: sem,
        startDate,
        endDate,
        status,
        allowedForms,
        notes,
        updatedAt: Date.now(),
        createdBy: window.currentUser?.email || 'admin'
    };

    try {
        await window.update(window.ref(window.db), {
            [`evaluations/periods/${id}`]: payload,
            [`settings/evaluationPeriods/${id}`]: payload
        });
        evalState.periods[id] = payload;
        evalState.currentPeriodId = id;

        closeModal('modal-eval-period');
        Swal.fire({ icon: 'success', title: 'Thành công', text: 'Đã lưu cấu hình đợt đánh giá!', timer: 2000, showConfirmButton: false });
        renderEvaluations();
    } catch(err) {
        Swal.fire('Lỗi', 'Không lưu được đợt đánh giá: ' + err.message, 'error');
    }
}
window.savePeriodSettings = savePeriodSettings;

export async function togglePeriodQuickStatus(periodId) {
    const period = evalState.periods[periodId];
    if (!period) return;

    const newStatus = period.status === 'open' ? 'closed' : 'open';
    try {
        await window.update(window.ref(window.db), {
            [`evaluations/periods/${periodId}/status`]: newStatus,
            [`settings/evaluationPeriods/${periodId}/status`]: newStatus
        });
        period.status = newStatus;
        Swal.fire({
            icon: 'info',
            title: newStatus === 'open' ? 'Đã mở nhận phiếu' : 'Đã khóa đợt',
            text: `Đợt "${period.name}" hiện ${newStatus==='open'?'đang mở':'đã đóng'}.`,
            timer: 1800,
            showConfirmButton: false
        });
        renderEvaluations();
    } catch(e) {
        Swal.fire('Lỗi', e.message, 'error');
    }
}
window.togglePeriodQuickStatus = togglePeriodQuickStatus;

export async function deletePeriod(periodId) {
    const period = evalState.periods[periodId];
    if (!period) return;

    const confirm = await Swal.fire({
        title: 'Xóa đợt đánh giá?',
        text: `Bạn có chắc muốn xóa đợt "${period.name}"?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Xóa',
        cancelButtonText: 'Hủy'
    });
    if (!confirm.isConfirmed) return;

    try {
        await window.update(window.ref(window.db), {
            [`evaluations/periods/${periodId}`]: null,
            [`settings/evaluationPeriods/${periodId}`]: null
        });
        delete evalState.periods[periodId];
        if (evalState.currentPeriodId === periodId) {
            evalState.currentPeriodId = Object.keys(evalState.periods)[0] || null;
        }
        Swal.fire('Đã xóa', 'Đợt đánh giá đã bị xóa.', 'success');
        renderEvaluations();
    } catch(e) {
        Swal.fire('Lỗi', e.message, 'error');
    }
}
window.deletePeriod = deletePeriod;

// Expose toàn bộ hàm chính ra window
window.renderEvaluations = renderEvaluations;
window.openNewFormSubmission = openNewFormSubmission;
window.editEvaluationSubmission = editEvaluationSubmission;
window.previewSampleForm = previewSampleForm;
