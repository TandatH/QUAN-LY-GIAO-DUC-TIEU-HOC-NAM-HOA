// ═══════════════════════════════════════════════════════════════════════════
// plans.js — Module Kế hoạch Dạy học & Giáo dục (Năm, Tháng, Tuần)
// Dành cho Giáo viên & Học sinh / Phụ huynh
// Hỗ trợ đính kèm File Excel, Word, PDF & Hình ảnh
// ═══════════════════════════════════════════════════════════════════════════

export const PLANS_MODULE_VERSION = '5.37.0';

// ── 1. HẰNG SỐ & PHÂN LOẠI ─────────────────────────────────────────────────
export const PLAN_TYPES = {
    year: {
        key: 'year',
        label: 'Kế hoạch năm',
        icon: 'calendar-alt',
        badgeClass: 'type-year',
        color: '#6d28d9',
        desc: 'Phương hướng nhiệm vụ, thời gian biểu & kế hoạch giáo dục năm học'
    },
    month: {
        key: 'month',
        label: 'Kế hoạch tháng',
        icon: 'calendar-week',
        badgeClass: 'type-month',
        color: '#1e40af',
        desc: 'Trọng tâm công tác, phong trào thi đua & kế hoạch chuyên môn tháng'
    },
    week: {
        key: 'week',
        label: 'Kế hoạch tuần',
        icon: 'calendar-day',
        badgeClass: 'type-week',
        color: '#0f766e',
        desc: 'Lịch công tác tuần, phân công giảng dạy, lịch báo giảng & thời khóa biểu'
    },
    teaching: {
        key: 'teaching',
        label: 'Kế hoạch dạy học',
        icon: 'book-reader',
        badgeClass: 'type-teaching',
        color: '#c2410c',
        desc: 'Kế hoạch bài dạy, giáo án mẫu, phân phối chương trình & tài liệu ôn tập'
    }
};

export const AUDIENCE_TYPES = {
    teacher: {
        key: 'teacher',
        label: 'Nội bộ Giáo viên',
        shortLabel: 'Cho Giáo viên',
        icon: 'user-tie',
        badgeClass: 'aud-teacher',
        lockIcon: true,
        desc: 'Chỉ BGH và Giáo viên xem được (Học sinh/PH không xem)'
    },
    student_parent: {
        key: 'student_parent',
        label: 'Học sinh & Phụ huynh',
        shortLabel: 'Học sinh & PH',
        icon: 'user-graduate',
        badgeClass: 'aud-student',
        lockIcon: false,
        desc: 'Kế hoạch học tập, lịch kiểm tra, bài ôn tập dành cho Học sinh & PH'
    },
    all: {
        key: 'all',
        label: 'Toàn trường',
        shortLabel: 'Toàn trường',
        icon: 'users',
        badgeClass: 'aud-all',
        lockIcon: false,
        desc: 'Toàn thể giáo viên, học sinh và phụ huynh đều xem được'
    }
};

// State bộ lọc
let currentTypeFilter = 'all';
let currentAudienceFilter = 'all';
let currentGradeFilter = 'all';
let searchKeyword = '';
let draftAttachments = [];
let editingPlanId = null;

// ── 2. DATA LOADER & FIREBASE HELPER ─────────────────────────────────────────
function plansRef(id = null) {
    if (!window.db) return null;
    return id ? window.ref(window.db, `plans/${id}`) : window.ref(window.db, 'plans');
}

export async function loadPlansData() {
    if (window.IS_DEMO_MODE) {
        if (!window.localData.plans || Object.keys(window.localData.plans).length === 0) {
            initDemoPlans();
        }
        return window.localData.plans;
    }

    if (!window.db) {
        window.localData.plans = window.localData.plans || {};
        return window.localData.plans;
    }

    try {
        const snap = await window.get(plansRef());
        window.localData.plans = snap.val() || {};
        return window.localData.plans;
    } catch (err) {
        console.warn('[plans.js] loadPlansData error:', err);
        window.localData.plans = window.localData.plans || {};
        return window.localData.plans;
    }
}

// ── 3. KHỞI TẠO DỮ LIỆU DEMO MẪU ───────────────────────────────────────────
function initDemoPlans() {
    window.localData = window.localData || {};
    window.localData.plans = {
        plan_demo_01: {
            id: 'plan_demo_01',
            title: 'Kế hoạch Giáo dục & Năm học 2026-2027 (Lớp Phổ cập Nam Hòa)',
            planType: 'year',
            targetAudience: 'all',
            targetGrade: 'all',
            targetClass: 'all',
            schoolYear: '2026-2027',
            term: 'Cả năm',
            timeFrame: {
                displayText: 'Năm học 2026 - 2027 (Từ 01/09/2026 đến 31/05/2027)'
            },
            summary: 'Kế hoạch tổng thể thực hiện nhiệm vụ năm học 2026-2027: Chỉ tiêu chuyên cần, phương án phụ đạo học sinh khó khăn theo chương trình GDPT cấp Tiểu học Phổ cập.',
            content: `1. MỤC TIÊU CHUNG:\n- 100% học sinh được rà soát hồ sơ nhân thân và hỗ trợ pháp lý theo BM01.\n- Đảm bảo tỷ lệ chuyên cần trên 95% đối với các lớp phổ cập buổi tối.\n- Tổ chức 04 chuyên đề bồi dưỡng phương pháp giảng dạy tích cực cho giáo viên.\n\n2. THỜI GIAN VÀ CÁC MỐC QUAN TRỌNG:\n- Học kỳ 1: Bắt đầu 05/09/2026 đến 15/01/2027.\n- Học kỳ 2: Bắt đầu 18/01/2027 đến 25/05/2027.\n- Bế giảng & Tổng kết năm học: 28/05/2027.`,
            isPinned: true,
            author: { name: 'Ban Giám Hiệu', role: 'admin' },
            createdAt: Date.now() - 30 * 86400000,
            updatedAt: Date.now() - 30 * 86400000,
            attachments: [
                {
                    id: 'att_demo_1',
                    fileName: 'Ke_hoach_nam_hoc_2026_2027_Nam_Hoa.docx',
                    fileType: 'word',
                    ext: 'docx',
                    fileSize: '245 KB',
                    dataUrl: createDemoDocxDataUrl('Kế hoạch năm học 2026-2027 Nam Hòa')
                },
                {
                    id: 'att_demo_2',
                    fileName: 'Khung_thoi_gian_nam_hoc_2026_2027.pdf',
                    fileType: 'pdf',
                    ext: 'pdf',
                    fileSize: '412 KB',
                    dataUrl: createDemoPdfDataUrl('Khung thời gian năm học')
                }
            ]
        },
        plan_demo_02: {
            id: 'plan_demo_02',
            title: 'Kế hoạch Chuyên môn & Đánh giá Giáo viên Tháng 11/2026',
            planType: 'month',
            targetAudience: 'teacher',
            targetGrade: 'all',
            targetClass: 'all',
            schoolYear: '2026-2027',
            term: 'Học kỳ 1',
            timeFrame: {
                month: 11,
                displayText: 'Tháng 11/2026'
            },
            summary: 'Nội bộ Giáo viên: Lịch dự giờ tiết dạy tốt chào mừng 20/11, kiểm tra hồ sơ sổ sách và triển khai Bộ 11 Biểu mẫu quản lý PC Nam Hòa.',
            content: `TRỌNG TÂM CÔNG TÁC THÁNG 11/2026:\n1. Phong trào thi đua dạy tốt chào mừng Ngày Nhà giáo Việt Nam 20/11.\n2. Giáo viên thực hiện đánh giá tiết dạy và dự giờ theo Biểu mẫu 05.\n3. Rà soát danh sách học sinh có nguy cơ học yếu theo Biểu mẫu 02 để lập kế hoạch hỗ trợ BM03.\n4. Họp kiểm thảo chuyên môn cuối tháng vào 18h30 ngày 28/11/2026.`,
            isPinned: true,
            author: { name: 'Phó Hiệu Trưởng Chuyên Môn', role: 'admin' },
            createdAt: Date.now() - 5 * 86400000,
            updatedAt: Date.now() - 5 * 86400000,
            attachments: [
                {
                    id: 'att_demo_3',
                    fileName: 'Lich_du_gio_chuyen_mon_Thang_11.xlsx',
                    fileType: 'excel',
                    ext: 'xlsx',
                    fileSize: '128 KB',
                    dataUrl: createDemoExcelDataUrl('Lịch dự giờ Tháng 11')
                }
            ]
        },
        plan_demo_03: {
            id: 'plan_demo_03',
            title: 'Kế hoạch Học tập & Lịch ôn tập Tuần 11 (Dành cho Học sinh Khối 1 - 5)',
            planType: 'week',
            targetAudience: 'student_parent',
            targetGrade: 'all',
            targetClass: 'all',
            schoolYear: '2026-2027',
            term: 'Học kỳ 1',
            timeFrame: {
                weekNumber: 11,
                displayText: 'Tuần 11 (Từ 03/11/2026 đến 08/11/2026)'
            },
            summary: 'Kính gửi Quý Phụ huynh và các em Học sinh: Kế hoạch học tập tuần 11, nội dung bài ôn tập môn Toán và Tiếng Việt chuẩn bị kiểm tra giữa kỳ 1.',
            content: `1. THỜI GIAN VÀ CHUYÊN CẦN:\n- Các em học sinh có mặt đúng 17h45 từ Thứ 2 đến Thứ 6.\n- Phụ huynh nhắc nhở các em mang đầy đủ tập vở, đồ dùng học tập.\n\n2. NỘI DUNG ÔN TẬP TRỌNG TÂM:\n- Khối 1: Ôn các vần đã học, phép cộng trong phạm vi 10.\n- Khối 2: Luyện đọc đoạn văn 4-5 câu, bảng cộng trừ có nhớ.\n- Khối 3 - 5: Xem tệp bài tập ôn tập đính kèm bên dưới để làm thêm tại nhà.`,
            isPinned: false,
            author: { name: 'Ban Giám Hiệu & Tổ GVCN', role: 'admin' },
            createdAt: Date.now() - 2 * 86400000,
            updatedAt: Date.now() - 2 * 86400000,
            attachments: [
                {
                    id: 'att_demo_4',
                    fileName: 'De_cuong_on_tap_Toan_TV_Tuan_11.pdf',
                    fileType: 'pdf',
                    ext: 'pdf',
                    fileSize: '512 KB',
                    dataUrl: createDemoPdfDataUrl('Đề cương ôn tập Tuần 11')
                },
                {
                    id: 'att_demo_5',
                    fileName: 'Thoi_khoa_bieu_on_tap_buoi_toi.png',
                    fileType: 'image',
                    ext: 'png',
                    fileSize: '310 KB',
                    dataUrl: createDemoImageDataUrl()
                }
            ]
        }
    };
}

// Giả lập Base64 cho Demo
function createDemoDocxDataUrl(title) {
    return 'data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,UEsDBBQABgAIAAAAIQDfp02laAEAAJ4FAAATAAAAd29yZC9kb2N1bWVudC54bWw=';
}
function createDemoExcelDataUrl(title) {
    return 'data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,UEsDBBQABgAIAAAAIQCe8O78bgEAAEkFAAATAAAAeGwvZGlkL3RoZW1lMS54bWw=';
}
function createDemoPdfDataUrl(title) {
    return 'data:application/pdf;base64,JVBERi0xLjQKJeLjz9MKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKPj4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovTWVkaWFCb3ggWzAgMCA1OTUgODQyXQo+PgplbmRvYmoKeHJlZgowIDQKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDE1IDAwMDAwIG4gCjAwMDAwMDAwNjggMDAwMDAgbiAKMDAwMDAwMDEyMSAwMDAwMCBuIAp0cmFpbGVyCjw8Ci9TaXplIDQKL1Jvb3QgMSAwIFIKPj4Kc3RhcnR4cmVmCjE3OQolJUVPRg==';
}
function createDemoImageDataUrl() {
    // 1x1 png image
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAACWAQMAAABp+jU4AAAABlBMVEX///8AAABVwtN+AAAAAXRSTlMAQObYZgAAAFRJREFUeNrtwTEBAAAAwqD1T20JT6AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAcAYaUAAB8kM33gAAAABJRU5ErkJggg==';
}

// ── 4. RENDER GIAO DIỆN CHÍNH ───────────────────────────────────────────────
export async function renderPlans() {
    const content = document.getElementById('content');
    if (!content) return;
    content.dataset.view = 'plans';

    // Đảm bảo dữ liệu đã tải
    await loadPlansData();

    const role = window.userRole || 'admin';
    const canCreate = ['admin', 'teacher', 'subject_teacher'].includes(role);
    const isParent = role === 'parent';

    const allPlans = Object.values(window.localData.plans || {});

    // Lọc theo quyền xem (Audience visibility)
    const accessiblePlans = allPlans.filter(plan => canViewPlan(plan, role));

    // Đếm số lượng theo từng loại kế hoạch
    const countAll = accessiblePlans.length;
    const countYear = accessiblePlans.filter(p => p.planType === 'year').length;
    const countMonth = accessiblePlans.filter(p => p.planType === 'month').length;
    const countWeek = accessiblePlans.filter(p => p.planType === 'week').length;
    const countTeaching = accessiblePlans.filter(p => p.planType === 'teaching').length;

    // Lọc theo state hiện tại
    const filteredPlans = filterPlansList(accessiblePlans);

    content.innerHTML = `
    <div class="plans-container">
        <!-- Header -->
        <div class="plans-header">
            <div>
                <h2>
                    <i class="fas fa-calendar-check" style="color:#2563eb"></i>
                    ${isParent ? 'Kế Hoạch Học Tập & Dạy Học' : 'Kế Hoạch Dạy Học & Giáo Dục'}
                </h2>
                <p>
                    ${isParent 
                        ? 'Theo dõi kế hoạch học tập năm, tháng, tuần và tài liệu ôn tập của học sinh' 
                        : 'Thông báo & quản lý kế hoạch năm, tháng, tuần cho giáo viên và học sinh'}
                </p>
            </div>
            ${canCreate ? `
            <div>
                <button class="btn btn-primary" onclick="openPlanModal()" style="display:inline-flex;align-items:center;gap:8px">
                    <i class="fas fa-plus"></i> Đăng Kế Hoạch Mới
                </button>
            </div>
            ` : ''}
        </div>

        <!-- Tabs loại kế hoạch -->
        <div class="plans-type-tabs">
            <button class="plans-tab-btn ${currentTypeFilter === 'all' ? 'active' : ''}" onclick="switchPlanTab('all')">
                <i class="fas fa-th-large"></i> Tất cả kế hoạch
                <span class="badge-count">${countAll}</span>
            </button>
            <button class="plans-tab-btn ${currentTypeFilter === 'year' ? 'active' : ''}" onclick="switchPlanTab('year')">
                <i class="fas fa-calendar-alt"></i> Kế hoạch năm
                <span class="badge-count">${countYear}</span>
            </button>
            <button class="plans-tab-btn ${currentTypeFilter === 'month' ? 'active' : ''}" onclick="switchPlanTab('month')">
                <i class="fas fa-calendar-week"></i> Kế hoạch tháng
                <span class="badge-count">${countMonth}</span>
            </button>
            <button class="plans-tab-btn ${currentTypeFilter === 'week' ? 'active' : ''}" onclick="switchPlanTab('week')">
                <i class="fas fa-calendar-day"></i> Kế hoạch tuần
                <span class="badge-count">${countWeek}</span>
            </button>
            <button class="plans-tab-btn ${currentTypeFilter === 'teaching' ? 'active' : ''}" onclick="switchPlanTab('teaching')">
                <i class="fas fa-book-reader"></i> Kế hoạch dạy học
                <span class="badge-count">${countTeaching}</span>
            </button>
        </div>

        <!-- Toolbar: Lọc đối tượng, Khối lớp & Tìm kiếm -->
        <div class="plans-toolbar">
            <div class="plans-search-box">
                <i class="fas fa-search"></i>
                <input type="text" id="plan-search-input" placeholder="Tìm theo tiêu đề, tuần, tháng, nội dung..." 
                       value="${escapeHtml(searchKeyword)}" oninput="handlePlanSearch(this.value)">
            </div>

            <!-- Lọc đối tượng áp dụng (Chỉ hiện cho GV/Admin) -->
            ${!isParent ? `
            <select class="plans-filter-select" id="plan-audience-filter" onchange="handleAudienceFilter(this.value)">
                <option value="all" ${currentAudienceFilter === 'all' ? 'selected' : ''}>-- Mọi đối tượng --</option>
                <option value="teacher" ${currentAudienceFilter === 'teacher' ? 'selected' : ''}>🔒 Dành cho Giáo viên</option>
                <option value="student_parent" ${currentAudienceFilter === 'student_parent' ? 'selected' : ''}>🎓 Dành cho Học sinh & PH</option>
                <option value="all_school" ${currentAudienceFilter === 'all_school' ? 'selected' : ''}>🌐 Toàn trường</option>
            </select>
            ` : ''}

            <!-- Lọc Khối -->
            <select class="plans-filter-select" id="plan-grade-filter" onchange="handleGradeFilter(this.value)">
                <option value="all" ${currentGradeFilter === 'all' ? 'selected' : ''}>-- Tất cả các khối --</option>
                <option value="1" ${currentGradeFilter === '1' ? 'selected' : ''}>Khối 1</option>
                <option value="2" ${currentGradeFilter === '2' ? 'selected' : ''}>Khối 2</option>
                <option value="3" ${currentGradeFilter === '3' ? 'selected' : ''}>Khối 3</option>
                <option value="4" ${currentGradeFilter === '4' ? 'selected' : ''}>Khối 4</option>
                <option value="5" ${currentGradeFilter === '5' ? 'selected' : ''}>Khối 5</option>
            </select>
        </div>

        <!-- Danh sách bài đăng kế hoạch -->
        ${filteredPlans.length === 0 ? `
            <div style="background:#ffffff;border:1px dashed #cbd5e1;border-radius:14px;padding:48px 20px;text-align:center">
                <i class="fas fa-folder-open" style="font-size:3rem;color:#cbd5e1;margin-bottom:12px;display:block"></i>
                <h3 style="color:#475569;margin:0 0 6px">Chưa có kế hoạch nào phù hợp</h3>
                <p style="color:#94a3b8;margin:0;font-size:0.9rem">Hãy thử thay đổi từ khóa hoặc bộ lọc để xem các bài đăng khác.</p>
                ${canCreate ? `
                <button class="btn btn-outline" onclick="openPlanModal()" style="margin-top:16px">
                    <i class="fas fa-plus"></i> Đăng kế hoạch ngay
                </button>
                ` : ''}
            </div>
        ` : `
            <div class="plans-grid">
                ${filteredPlans.map(plan => renderPlanCard(plan, role)).join('')}
            </div>
        `}
    </div>

    <!-- Lightbox Modal hiển thị ảnh phóng to -->
    <div id="plan-lightbox" class="plan-lightbox-modal" onclick="closeLightbox(event)">
        <button class="plan-lightbox-close" onclick="closeLightbox(event)">✕</button>
        <img id="plan-lightbox-img" class="plan-lightbox-img" src="" alt="Xem ảnh">
        <div id="plan-lightbox-caption" class="plan-lightbox-caption"></div>
    </div>
    `;
}

// ── 5. KIỂM TRA QUYỀN XEM KẾ HOẠCH (AUDIENCE PERMISSIONS) ───────────────────
function canViewPlan(plan, role) {
    if (!plan) return false;

    // Admin xem được tất cả
    if (role === 'admin') return true;

    // Giáo viên (GVCN & GV Bộ môn) xem được:
    // - Kế hoạch cho giáo viên
    // - Kế hoạch toàn trường
    // - Kế hoạch cho học sinh (để nắm chương trình)
    if (role === 'teacher' || role === 'subject_teacher') {
        return true;
    }

    // Phụ huynh / Học sinh:
    if (role === 'parent') {
        // TUYỆT ĐỐI KHÔNG XEM KẾ HOẠCH NỘI BỘ GIÁO VIÊN
        if (plan.targetAudience === 'teacher') return false;

        // Nếu kế hoạch áp dụng khối cụ thể, kiểm tra khối của con
        const pStudent = getParentStudent();
        if (pStudent) {
            const studentGrade = String(pStudent.currentGrade || pStudent.grade || '');
            if (plan.targetGrade && plan.targetGrade !== 'all' && studentGrade && plan.targetGrade !== studentGrade) {
                return false;
            }
        }
        return true;
    }

    return false;
}

function getParentStudent() {
    const sid = String(window.parentStudentId || '');
    if (!sid) return null;
    const students = window.localData?.students || {};
    return students[sid] || Object.values(students).find(s => s.code === sid || s.id === sid) || null;
}

// ── 6. LỌC DANH SÁCH THEO STATE ─────────────────────────────────────────────
function filterPlansList(plans) {
    return plans
        .filter(p => {
            // Lọc theo Loại kế hoạch
            if (currentTypeFilter !== 'all' && p.planType !== currentTypeFilter) return false;

            // Lọc theo Đối tượng
            if (currentAudienceFilter !== 'all') {
                if (currentAudienceFilter === 'all_school') {
                    if (p.targetAudience !== 'all') return false;
                } else if (p.targetAudience !== currentAudienceFilter) {
                    return false;
                }
            }

            // Lọc theo Khối
            if (currentGradeFilter !== 'all') {
                if (p.targetGrade !== 'all' && String(p.targetGrade) !== String(currentGradeFilter)) {
                    return false;
                }
            }

            // Lọc theo Từ khóa tìm kiếm
            if (searchKeyword.trim()) {
                const kw = searchKeyword.trim().toLowerCase();
                const matchTitle = (p.title || '').toLowerCase().includes(kw);
                const matchSummary = (p.summary || '').toLowerCase().includes(kw);
                const matchContent = (p.content || '').toLowerCase().includes(kw);
                const matchTime = (p.timeFrame?.displayText || '').toLowerCase().includes(kw);
                if (!matchTitle && !matchSummary && !matchContent && !matchTime) return false;
            }

            return true;
        })
        .sort((a, b) => {
            // Bài ghim (pinned) luôn đứng trước
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            // Xếp theo ngày tạo mới nhất
            return (b.createdAt || 0) - (a.createdAt || 0);
        });
}

// ── 7. RENDER THẺ KẾ HOẠCH (CARD) ───────────────────────────────────────────
function renderPlanCard(plan, role) {
    const pType = PLAN_TYPES[plan.planType] || PLAN_TYPES.week;
    const pAud = AUDIENCE_TYPES[plan.targetAudience] || AUDIENCE_TYPES.all;
    const canManage = role === 'admin' || (role === 'teacher' && plan.author?.uid === window.currentUser?.uid);

    const attachments = plan.attachments || [];
    const imageAttachments = attachments.filter(a => a.fileType === 'image');
    const docAttachments = attachments.filter(a => a.fileType !== 'image');

    const formattedDate = plan.createdAt ? new Date(plan.createdAt).toLocaleDateString('vi-VN') : '';

    return `
    <div class="plan-card ${plan.isPinned ? 'pinned' : ''}" id="plan-card-${plan.id}">
        ${plan.isPinned ? `
        <div class="plan-pin-badge">
            <i class="fas fa-thumbtack"></i> Đã ghim
        </div>` : ''}

        <div>
            <!-- Huy hiệu Meta -->
            <div class="plan-card-meta">
                <span class="plan-badge ${pType.badgeClass}">
                    <i class="fas fa-${pType.icon}"></i> ${pType.label}
                </span>
                <span class="plan-badge ${pAud.badgeClass}">
                    <i class="fas fa-${pAud.icon}"></i> ${pAud.shortLabel}
                </span>
                ${plan.targetGrade && plan.targetGrade !== 'all' ? `
                    <span class="plan-badge" style="background:#f1f5f9;color:#475569">
                        Khối ${plan.targetGrade}
                    </span>` : ''}
            </div>

            <!-- Tiêu đề -->
            <h3 class="plan-card-title" onclick="openPlanDetail('${plan.id}')">
                ${escapeHtml(plan.title || '(Chưa có tiêu đề)')}
            </h3>

            <!-- Thời gian áp dụng -->
            ${plan.timeFrame?.displayText ? `
            <div class="plan-card-time">
                <i class="fas fa-clock"></i>
                <span>${escapeHtml(plan.timeFrame.displayText)}</span>
            </div>` : ''}

            <!-- Tóm tắt nội dung -->
            <div class="plan-card-summary">
                ${escapeHtml(plan.summary || plan.content || '')}
            </div>

            <!-- Tệp đính kèm -->
            ${attachments.length > 0 ? `
            <div class="plan-attachments-wrap">
                <div class="plan-att-title">
                    <i class="fas fa-paperclip"></i> Tệp đính kèm (${attachments.length})
                </div>

                <!-- Thư viện ảnh thu nhỏ -->
                ${imageAttachments.length > 0 ? `
                <div class="plan-image-gallery">
                    ${imageAttachments.map((img, idx) => `
                        <img src="${img.dataUrl}" alt="${escapeHtml(img.fileName)}" class="plan-img-thumb"
                             onclick="openImageLightbox('${img.dataUrl}', '${escapeHtml(img.fileName)}')">
                    `).join('')}
                </div>` : ''}

                <!-- Danh sách file: Excel, Word, PDF -->
                ${docAttachments.length > 0 ? `
                <div class="plan-file-list">
                    ${docAttachments.map(doc => renderFileItem(doc, plan.id)).join('')}
                </div>` : ''}
            </div>
            ` : ''}
        </div>

        <!-- Footer Card -->
        <div class="plan-card-footer">
            <div class="plan-author">
                <i class="fas fa-user-circle"></i>
                <span>${escapeHtml(plan.author?.name || 'Nhà trường')} · ${formattedDate}</span>
            </div>

            <div class="plan-actions-group">
                <button class="btn-plan-sm" onclick="openPlanDetail('${plan.id}')" title="Xem chi tiết">
                    <i class="fas fa-eye"></i> Xem
                </button>
                <button class="btn-plan-sm" onclick="printPlan('${plan.id}')" title="In văn bản">
                    <i class="fas fa-print"></i>
                </button>
                ${canManage ? `
                <button class="btn-plan-sm" onclick="togglePinPlan('${plan.id}')" title="${plan.isPinned ? 'Bỏ ghim' : 'Ghim lên đầu'}">
                    <i class="fas fa-thumbtack" style="${plan.isPinned ? 'color:#f59e0b' : ''}"></i>
                </button>
                <button class="btn-plan-sm" onclick="openPlanModal('${plan.id}')" title="Chỉnh sửa">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-plan-sm danger" onclick="deletePlan('${plan.id}')" title="Xóa">
                    <i class="fas fa-trash"></i>
                </button>
                ` : ''}
            </div>
        </div>
    </div>
    `;
}

// ── 8. RENDER THẺ TỆP ĐÍNH KÈM (EXCEL, WORD, PDF) ───────────────────────────
function renderFileItem(file, planId) {
    let iconClass = 'fa-file-alt';
    let btnDownloadClass = '';

    if (file.fileType === 'excel') {
        iconClass = 'fa-file-excel';
        btnDownloadClass = 'btn-download-excel';
    } else if (file.fileType === 'word') {
        iconClass = 'fa-file-word';
    } else if (file.fileType === 'pdf') {
        iconClass = 'fa-file-pdf';
    }

    return `
    <div class="plan-file-item">
        <div class="plan-file-info" title="${escapeHtml(file.fileName)}">
            <i class="fas ${iconClass} plan-file-icon ${iconClass}"></i>
            <span class="plan-file-name">${escapeHtml(file.fileName)}</span>
            <span class="plan-file-size">(${file.fileSize || 'N/A'})</span>
        </div>
        <div class="plan-file-actions">
            ${file.fileType === 'pdf' ? `
            <button class="btn-file-action btn-preview-pdf" onclick="previewPdf('${file.dataUrl}', '${escapeHtml(file.fileName)}')">
                <i class="fas fa-eye"></i> Xem
            </button>
            ` : ''}
            <button class="btn-file-action ${btnDownloadClass}" onclick="downloadAttachment('${file.dataUrl}', '${escapeHtml(file.fileName)}')">
                <i class="fas fa-download"></i> Tải về
            </button>
        </div>
    </div>
    `;
}

// ── 9. MODAL TẠO & SỬA BÀI KẾ HOẠCH ──────────────────────────────────────────
export function openPlanModal(planId = null) {
    editingPlanId = planId;
    draftAttachments = [];

    const modal = document.getElementById('modal-plan-editor');
    if (!modal) return;

    const plan = planId ? (window.localData.plans || {})[planId] : null;

    document.getElementById('plan-modal-title').textContent = plan ? 'Chỉnh Sửa Kế Hoạch' : 'Đăng Kế Hoạch Mới';
    document.getElementById('plan-input-title').value = plan?.title || '';
    document.getElementById('plan-input-type').value = plan?.planType || 'week';
    document.getElementById('plan-input-audience').value = plan?.targetAudience || 'teacher';
    document.getElementById('plan-input-grade').value = plan?.targetGrade || 'all';
    document.getElementById('plan-input-year').value = plan?.schoolYear || '2026-2027';
    document.getElementById('plan-input-term').value = plan?.term || 'Học kỳ 1';
    document.getElementById('plan-input-time').value = plan?.timeFrame?.displayText || '';
    document.getElementById('plan-input-summary').value = plan?.summary || '';
    document.getElementById('plan-input-content').value = plan?.content || '';

    if (plan?.attachments) {
        // Sao chép tệp hiện có vào draft
        draftAttachments = JSON.parse(JSON.stringify(plan.attachments));
    }

    renderDraftAttachments();

    modal.style.display = 'flex';
}

export function renderDraftAttachments() {
    const listEl = document.getElementById('plan-draft-files-list');
    if (!listEl) return;

    if (draftAttachments.length === 0) {
        listEl.innerHTML = `<div style="color:#94a3b8;font-size:0.83rem;text-align:center;padding:8px">Chưa chọn tệp đính kèm nào</div>`;
        return;
    }

    listEl.innerHTML = draftAttachments.map((att, idx) => {
        let icon = 'fa-file-alt';
        if (att.fileType === 'excel') icon = 'fa-file-excel text-success';
        else if (att.fileType === 'word') icon = 'fa-file-word text-primary';
        else if (att.fileType === 'pdf') icon = 'fa-file-pdf text-danger';
        else if (att.fileType === 'image') icon = 'fa-file-image text-warning';

        return `
        <div class="plan-draft-file-item">
            <div style="display:flex;align-items:center;gap:8px;overflow:hidden">
                <i class="fas ${icon}"></i>
                <span style="font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(att.fileName)}</span>
                <span style="color:#94a3b8;font-size:0.75rem">(${att.fileSize})</span>
            </div>
            <button class="file-del-btn" onclick="removeDraftAttachment(${idx})" title="Xóa tệp này">
                <i class="fas fa-times"></i>
            </button>
        </div>
        `;
    }).join('');
}

export function removeDraftAttachment(idx) {
    draftAttachments.splice(idx, 1);
    renderDraftAttachments();
}

// ── 10. XỬ LÝ CHỌN & ĐỌC TỆP (EXCEL, WORD, PDF, ẢNH) ─────────────────────────
export async function handlePlanFileUpload(files) {
    if (!files || files.length === 0) return;

    const maxFileSize = 12 * 1024 * 1024; // 12MB limit

    for (const file of Array.from(files)) {
        if (file.size > maxFileSize) {
            Swal.fire({
                icon: 'warning',
                title: 'Tệp quá lớn',
                text: `Tệp "${file.name}" vượt quá 12MB. Vui lòng nén nhỏ lại trước khi đính kèm.`
            });
            continue;
        }

        const ext = file.name.split('.').pop().toLowerCase();
        let fileType = 'other';

        if (['xlsx', 'xls', 'csv'].includes(ext)) fileType = 'excel';
        else if (['docx', 'doc'].includes(ext)) fileType = 'word';
        else if (['pdf'].includes(ext)) fileType = 'pdf';
        else if (['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext)) fileType = 'image';

        try {
            let dataUrl = '';
            if (fileType === 'image') {
                // Tự động nén ảnh giữ độ phân giải hợp lý
                dataUrl = await compressImageFile(file);
            } else {
                dataUrl = await readFileAsDataUrl(file);
            }

            const formattedSize = formatBytes(file.size);

            draftAttachments.push({
                id: 'att_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
                fileName: file.name,
                fileType: fileType,
                ext: ext,
                fileSize: formattedSize,
                dataUrl: dataUrl
            });
        } catch (err) {
            console.error('Lỗi đọc tệp:', err);
        }
    }

    renderDraftAttachments();
}

function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function compressImageFile(file, maxWidth = 1400, quality = 0.85) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.onerror = () => resolve(e.target.result);
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// ── 11. LƯU BÀI ĐĂNG KẾ HOẠCH (SAVE) ─────────────────────────────────────────
export async function savePlan() {
    const title = (document.getElementById('plan-input-title').value || '').trim();
    const planType = document.getElementById('plan-input-type').value;
    const targetAudience = document.getElementById('plan-input-audience').value;
    const targetGrade = document.getElementById('plan-input-grade').value;
    const schoolYear = document.getElementById('plan-input-year').value;
    const term = document.getElementById('plan-input-term').value;
    const timeText = (document.getElementById('plan-input-time').value || '').trim();
    const summary = (document.getElementById('plan-input-summary').value || '').trim();
    const content = (document.getElementById('plan-input-content').value || '').trim();

    if (!title) {
        Swal.fire({ icon: 'warning', title: 'Thiếu thông tin', text: 'Vui lòng nhập tiêu đề kế hoạch.' });
        return;
    }

    const planId = editingPlanId || ('plan_' + Date.now());
    const existing = (window.localData.plans || {})[planId] || {};

    const planData = {
        id: planId,
        title,
        planType,
        targetAudience,
        targetGrade,
        schoolYear,
        term,
        timeFrame: {
            displayText: timeText
        },
        summary: summary || (content.length > 150 ? content.substring(0, 150) + '...' : content),
        content,
        isPinned: existing.isPinned || false,
        author: existing.author || {
            uid: window.currentUser?.uid || 'admin',
            name: window.userName || (window.userRole === 'admin' ? 'Ban Giám Hiệu' : 'Giáo viên'),
            role: window.userRole || 'admin'
        },
        createdAt: existing.createdAt || Date.now(),
        updatedAt: Date.now(),
        attachments: draftAttachments
    };

    if (window.IS_DEMO_MODE) {
        window.localData.plans = window.localData.plans || {};
        window.localData.plans[planId] = planData;
        closeModal('modal-plan-editor');
        Swal.fire({ icon: 'success', title: 'Thành công', text: 'Kế hoạch đã được lưu (chế độ Demo).' });
        renderPlans();
        return;
    }

    try {
        await window.set(plansRef(planId), planData);
        window.localData.plans = window.localData.plans || {};
        window.localData.plans[planId] = planData;

        closeModal('modal-plan-editor');
        Swal.fire({ icon: 'success', title: 'Đã đăng thành công', text: 'Kế hoạch đã được lưu và cập nhật lên hệ thống.' });
        renderPlans();
    } catch (err) {
        console.error('Lỗi khi lưu kế hoạch:', err);
        Swal.fire({ icon: 'error', title: 'Lỗi', text: 'Không thể lưu bài đăng: ' + err.message });
    }
}

// ── 12. XÓA & GHIM BÀI ĐĂNG ─────────────────────────────────────────────────
export async function deletePlan(planId) {
    const res = await Swal.fire({
        title: 'Xác nhận xóa?',
        text: 'Bạn có chắc chắn muốn xóa bài kế hoạch này không?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        confirmButtonText: 'Đồng ý xóa',
        cancelButtonText: 'Hủy'
    });

    if (!res.isConfirmed) return;

    if (window.IS_DEMO_MODE) {
        delete window.localData.plans[planId];
        Swal.fire({ icon: 'success', title: 'Đã xóa', text: 'Đã xóa bài kế hoạch (chế độ Demo).' });
        renderPlans();
        return;
    }

    try {
        await window.remove(plansRef(planId));
        delete window.localData.plans[planId];
        Swal.fire({ icon: 'success', title: 'Đã xóa', text: 'Kế hoạch đã được xóa thành công.' });
        renderPlans();
    } catch (err) {
        console.error('Lỗi xóa kế hoạch:', err);
        Swal.fire({ icon: 'error', title: 'Lỗi', text: 'Không thể xóa: ' + err.message });
    }
}

export async function togglePinPlan(planId) {
    const plan = (window.localData.plans || {})[planId];
    if (!plan) return;

    const newPin = !plan.isPinned;
    plan.isPinned = newPin;

    if (window.IS_DEMO_MODE) {
        renderPlans();
        return;
    }

    try {
        await window.update(plansRef(planId), { isPinned: newPin });
        renderPlans();
    } catch (err) {
        console.error('Lỗi ghim bài:', err);
    }
}

// ── 13. XEM CHI TIẾT KẾ HOẠCH (DETAIL MODAL) ─────────────────────────────────
export function openPlanDetail(planId) {
    const plan = (window.localData.plans || {})[planId];
    if (!plan) return;

    const modal = document.getElementById('modal-plan-detail');
    if (!modal) return;

    const pType = PLAN_TYPES[plan.planType] || PLAN_TYPES.week;
    const pAud = AUDIENCE_TYPES[plan.targetAudience] || AUDIENCE_TYPES.all;
    const formattedDate = plan.createdAt ? new Date(plan.createdAt).toLocaleDateString('vi-VN') : '';

    const bodyEl = document.getElementById('plan-detail-content');
    bodyEl.innerHTML = `
        <div style="margin-bottom:16px">
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">
                <span class="plan-badge ${pType.badgeClass}">
                    <i class="fas fa-${pType.icon}"></i> ${pType.label}
                </span>
                <span class="plan-badge ${pAud.badgeClass}">
                    <i class="fas fa-${pAud.icon}"></i> ${pAud.shortLabel}
                </span>
                ${plan.targetGrade && plan.targetGrade !== 'all' ? `
                    <span class="plan-badge" style="background:#f1f5f9;color:#475569">
                        Khối ${plan.targetGrade}
                    </span>` : ''}
            </div>
            <h2 style="margin:0 0 8px;color:#0f172a;font-size:1.4rem">${escapeHtml(plan.title)}</h2>
            <div style="color:#64748b;font-size:0.86rem;display:flex;gap:12px;flex-wrap:wrap">
                <span><i class="fas fa-user-circle"></i> Đăng bởi: <strong>${escapeHtml(plan.author?.name || 'Nhà trường')}</strong></span>
                <span><i class="fas fa-calendar-alt"></i> Ngày: ${formattedDate}</span>
                ${plan.timeFrame?.displayText ? `<span><i class="fas fa-clock"></i> Thời gian: ${escapeHtml(plan.timeFrame.displayText)}</span>` : ''}
            </div>
        </div>

        <div style="background:#f8fafc;border-radius:10px;padding:16px;margin-bottom:20px;line-height:1.65;color:#1e293b;white-space:pre-wrap;font-size:0.95rem;border:1px solid #e2e8f0">
${escapeHtml(plan.content || plan.summary || '(Nội dung trống)')}
        </div>

        ${plan.attachments && plan.attachments.length > 0 ? `
        <div style="margin-top:20px">
            <h4 style="margin:0 0 10px;color:#334155;display:flex;align-items:center;gap:8px">
                <i class="fas fa-paperclip" style="color:#2563eb"></i> Danh sách tệp đính kèm (${plan.attachments.length})
            </h4>

            <!-- Ảnh -->
            ${plan.attachments.filter(a => a.fileType === 'image').length > 0 ? `
            <div style="margin-bottom:14px">
                <div style="font-weight:600;font-size:0.82rem;color:#64748b;margin-bottom:6px">HÌNH ẢNH:</div>
                <div class="plan-image-gallery">
                    ${plan.attachments.filter(a => a.fileType === 'image').map(img => `
                        <img src="${img.dataUrl}" alt="${escapeHtml(img.fileName)}" class="plan-img-thumb"
                             onclick="openImageLightbox('${img.dataUrl}', '${escapeHtml(img.fileName)}')">
                    `).join('')}
                </div>
            </div>` : ''}

            <!-- Tài liệu Word, Excel, PDF -->
            ${plan.attachments.filter(a => a.fileType !== 'image').length > 0 ? `
            <div class="plan-file-list">
                ${plan.attachments.filter(a => a.fileType !== 'image').map(doc => renderFileItem(doc, plan.id)).join('')}
            </div>` : ''}
        </div>
        ` : ''}
    `;

    modal.style.display = 'flex';
}

// ── 14. XỬ LÝ FILE: TẢI VỀ, XEM PDF & LIGHTBOX ẢNH ────────────────────────────
export function downloadAttachment(dataUrl, fileName) {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = fileName || 'tai_lieu';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

export function previewPdf(dataUrl, fileName) {
    const modal = document.getElementById('modal-plan-pdf');
    if (!modal) return;

    document.getElementById('plan-pdf-title').textContent = fileName || 'Xem trước PDF';
    const container = document.getElementById('plan-pdf-container');
    container.innerHTML = `
        <iframe src="${dataUrl}" style="width:100%;height:100%;border:none;border-radius:6px"></iframe>
    `;

    modal.style.display = 'flex';
}

export function openImageLightbox(dataUrl, caption = '') {
    const box = document.getElementById('plan-lightbox');
    const img = document.getElementById('plan-lightbox-img');
    const cap = document.getElementById('plan-lightbox-caption');
    if (!box || !img) return;

    img.src = dataUrl;
    cap.textContent = caption;
    box.classList.add('active');
}

export function closeLightbox(e) {
    if (e.target.id === 'plan-lightbox-img') return;
    const box = document.getElementById('plan-lightbox');
    if (box) box.classList.remove('active');
}

export function printPlan(planId) {
    const plan = (window.localData.plans || {})[planId];
    if (!plan) return;

    const printWin = window.open('', '_blank');
    const pType = PLAN_TYPES[plan.planType] || PLAN_TYPES.week;
    const formattedDate = plan.createdAt ? new Date(plan.createdAt).toLocaleDateString('vi-VN') : '';

    printWin.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>${escapeHtml(plan.title)}</title>
            <style>
                body { font-family: "Times New Roman", Times, serif; font-size: 13pt; line-height: 1.5; padding: 30px; }
                .header-table { width: 100%; margin-bottom: 24px; border-collapse: collapse; }
                .header-table td { vertical-align: top; text-align: center; }
                .title-block { text-align: center; margin: 25px 0 20px; }
                .title-block h2 { font-size: 16pt; margin: 0 0 6px; text-transform: uppercase; }
                .title-block p { font-style: italic; margin: 0; }
                .content-block { text-align: justify; white-space: pre-wrap; margin-bottom: 30px; }
                .signatures { width: 100%; margin-top: 40px; border-collapse: collapse; }
                .signatures td { width: 50%; text-align: center; vertical-align: top; }
                @media print { @page { size: A4; margin: 2cm 2cm 2cm 2.5cm; } }
            </style>
        </head>
        <body>
            <table class="header-table">
                <tr>
                    <td style="width:45%">
                        <strong>TRƯỜNG TIỂU HỌC HÙNG VƯƠNG</strong><br>
                        <strong>LỚP PHỔ CẬP NAM HÒA</strong>
                    </td>
                    <td style="width:55%">
                        <strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong><br>
                        <strong>Độc lập - Tự do - Hạnh phúc</strong><br>
                        <em>TP. Hồ Chí Minh, ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}</em>
                    </td>
                </tr>
            </table>

            <div class="title-block">
                <h2>${escapeHtml(plan.title)}</h2>
                <p>Loại kế hoạch: ${pType.label} ${plan.timeFrame?.displayText ? `· ${escapeHtml(plan.timeFrame.displayText)}` : ''}</p>
            </div>

            <div class="content-block">
${escapeHtml(plan.content || plan.summary || '')}
            </div>

            <table class="signatures">
                <tr>
                    <td>
                        <strong>NGƯỜI LẬP KẾ HOẠCH</strong><br>
                        <em>(Ký và ghi rõ họ tên)</em><br><br><br><br>
                        <strong>${escapeHtml(plan.author?.name || 'Giáo viên')}</strong>
                    </td>
                    <td>
                        <strong>BAN GIÁM HIỆU PHÊ DUYỆT</strong><br>
                        <em>(Ký, đóng dấu)</em><br><br><br><br>
                    </td>
                </tr>
            </table>

            <script>
                window.onload = function() { window.print(); };
            <\/script>
        </body>
        </html>
    `);
    printWin.document.close();
}

// ── 15. SỰ KIỆN TƯƠNG TÁC GIAO DIỆN ──────────────────────────────────────────
export function switchPlanTab(type) {
    currentTypeFilter = type;
    renderPlans();
}

export function handlePlanSearch(kw) {
    searchKeyword = kw;
    renderPlans();
}

export function handleAudienceFilter(val) {
    currentAudienceFilter = val;
    renderPlans();
}

export function handleGradeFilter(val) {
    currentGradeFilter = val;
    renderPlans();
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Gắn các hàm ra window để inline HTML gọi được
if (typeof window !== 'undefined') {
    window.renderPlans = renderPlans;
    window.loadPlansData = loadPlansData;
    window.switchPlanTab = switchPlanTab;
    window.handlePlanSearch = handlePlanSearch;
    window.handleAudienceFilter = handleAudienceFilter;
    window.handleGradeFilter = handleGradeFilter;
    window.openPlanModal = openPlanModal;
    window.savePlan = savePlan;
    window.deletePlan = deletePlan;
    window.togglePinPlan = togglePinPlan;
    window.openPlanDetail = openPlanDetail;
    window.handlePlanFileUpload = handlePlanFileUpload;
    window.removeDraftAttachment = removeDraftAttachment;
    window.downloadAttachment = downloadAttachment;
    window.previewPdf = previewPdf;
    window.openImageLightbox = openImageLightbox;
    window.closeLightbox = closeLightbox;
    window.printPlan = printPlan;
}
