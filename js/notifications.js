import { sendNotificationEmail, emailResultHtml, openEmailSettingsModal } from "./mailer.js?v=5.34.8";
console.info('[Smart School V5.35.2] notifications rich-text & format patch loaded');
// ═══════════════════════════════════════════════════════
// notifications.js — Thông báo toàn trường
// DB path: notifications/{id}
//   { title, content, type, targetRole, targetClass,
//     priority, author, createdAt, isActive, attachments }
// ═══════════════════════════════════════════════════════

// ── Hằng số ────────────────────────────────────────────────────────────────
const NOTIF_TYPES = {
    general:   { label:'Thông báo chung',    icon:'bullhorn',        color:'#2563eb', bg:'#dbeafe' },
    urgent:    { label:'Khẩn cấp',           icon:'exclamation-circle', color:'#dc2626', bg:'#fee2e2' },
    event:     { label:'Sự kiện / Lịch',     icon:'calendar-alt',    color:'#7c3aed', bg:'#ede9fe' },
    finance:   { label:'Học phí / Tài chính',icon:'dollar-sign',     color:'#d97706', bg:'#fef3c7' },
    academic:  { label:'Học tập / Điểm số',  icon:'star',            color:'#0891b2', bg:'#e0f2fe' },
    health:    { label:'Y tế / Sức khỏe',    icon:'heartbeat',       color:'#16a34a', bg:'#dcfce7' },
};

const NOTIF_TARGETS = {
    all:              '🌐 Tất cả (GV + GV bộ môn + PH)',
    teacher:          '👩‍🏫 Tất cả giáo viên',
    homeroom_teacher: '🏫 Giáo viên chủ nhiệm',
    subject_teacher:  '⭐ Giáo viên bộ môn',
    parent:           '👨‍👩‍👧 Phụ huynh',
};

// `targetRole: "teacher"` được giữ tương thích dữ liệu cũ và được hiểu là
// gửi cho toàn bộ giáo viên, gồm GVCN (`teacher`) và GV bộ môn (`subject_teacher`).

// ── DB helper ───────────────────────────────────────────────────────────────
function notiRef(id) {
    return id
        ? window.ref(window.db, `notifications/${id}`)
        : window.ref(window.db, 'notifications');
}

function _classKey(value) {
    return String(value || '').trim().replace(/\//g, '_').replace(/[.#$\[\]]/g, '_');
}

function _gradeOfClass(className) {
    const m = String(className || '').match(/^(\d+)/);
    return m ? String(m[1]) : '';
}

function _activeStudents() {
    if (typeof window.activeStudentValues === 'function') return window.activeStudentValues();
    return Object.values(window.localData?.students || {}).filter(s => String(s?.status || 'active') === 'active');
}

function _sameClass(a, b) {
    if (!a || !b) return false;
    return String(a) === String(b) || _classKey(a) === _classKey(b);
}

function _teacherClassNames() {
    const values = [window.teacherClass, window.teacherClassKey].filter(Boolean).map(String);
    if (values.length) return values;
    return [];
}

function _parentStudent() {
    const sid = String(window.parentStudentId || '');
    if (!sid) return null;
    const students = window.localData?.students || {};
    if (students[sid]) return students[sid];
    return Object.values(students).find(s => String(s?.code || '') === sid || String(s?.id || '') === sid) || null;
}

function _subjectTeacherMatchesClass(targetClass) {
    if (!targetClass) return true;
    const grade = _gradeOfClass(targetClass);
    const grades = Array.isArray(window.teacherGrades) ? window.teacherGrades.map(String) : [];
    const gradeMap = window.teacherGradeMap || window.assignedGradeMap || {};
    if (!grades.length && !Object.keys(gradeMap).length) return true;
    return grades.includes(grade) || gradeMap[grade] === true;
}

function _targetClassMatches(n) {
    const targetClass = String(n?.targetClass || '').trim();
    if (!targetClass) return true;

    const role = window.userRole || '';
    if (role === 'admin') return true;

    if (role === 'teacher') {
        return _teacherClassNames().some(cls => _sameClass(cls, targetClass));
    }

    if (role === 'subject_teacher') {
        // GV bộ môn thường không gắn một lớp cố định; nếu Admin giới hạn lớp,
        // chỉ cần khối lớp phù hợp với phân công của GV bộ môn.
        return _subjectTeacherMatchesClass(targetClass);
    }

    if (role === 'parent') {
        const st = _parentStudent();
        const cls = st?.classRoom || st?.class || st?.currentClass || '';
        return _sameClass(cls, targetClass);
    }

    return false;
}

function _roleMatchesNotification(n, role = window.userRole || '') {
    const target = String(n?.targetRole || 'all');

    if (role === 'admin') return true;
    if (target === 'all') return true;

    // Tương thích dữ liệu cũ: "teacher" nghĩa là tất cả giáo viên.
    if (target === 'teacher' || target === 'staff') {
        return role === 'teacher' || role === 'subject_teacher';
    }

    if (target === 'homeroom_teacher') return role === 'teacher';
    if (target === 'subject_teacher') return role === 'subject_teacher';

    return target === role;
}

function _canCurrentUserSeeNotification(n) {
    if (!n?.isActive) return false;
    return _roleMatchesNotification(n) && _targetClassMatches(n);
}

function _notifReadStorageKey() {
    const uid = window.currentUser?.uid || window.currentUser?.email || 'guest';
    return `notif_read_${uid}`;
}

function _loadReadIdsForCurrentUser() {
    const key = _notifReadStorageKey();
    if (window._notifReadStorageKey !== key) {
        window._notifReadStorageKey = key;
        try {
            window._notifReadIds = new Set(JSON.parse(localStorage.getItem(key) || '[]'));
        } catch {
            window._notifReadIds = new Set();
        }
    }
    return window._notifReadIds;
}

// ══════════════════════════════════════════════════════════════════════════════
// RENDER TRANG QUẢN LÝ THÔNG BÁO (Admin)
// ══════════════════════════════════════════════════════════════════════════════
export function renderNotifications() {
    const isAdmin = window.userRole === 'admin';

    document.getElementById('content').innerHTML = `
        <div style="margin-bottom:14px;display:flex;gap:10px;flex-wrap:wrap;align-items:center">
            <span style="font-size:1rem;font-weight:700;color:#1e293b">
                <i class="fas fa-bell"></i> Thông báo toàn trường
            </span>
            ${isAdmin ? `
            <button class="btn btn-primary" onclick="openNotifModal()">
                <i class="fas fa-plus"></i> Tạo thông báo mới
            </button>
            <button class="btn btn-outline" onclick="openEmailSettingsModal()">
                <i class="fas fa-envelope"></i> Cài đặt Email
            </button>` : ''}
            <div style="margin-left:auto;display:flex;gap:8px;align-items:center">
                <select id="notif-filter-type" class="custom-select"
                    onchange="loadNotifications()" style="font-size:0.85rem">
                    <option value="">Tất cả loại</option>
                    ${Object.entries(NOTIF_TYPES).map(([k,v])=>
                        `<option value="${k}">${v.label}</option>`
                    ).join('')}
                </select>
                <select id="notif-filter-target" class="custom-select"
                    onchange="loadNotifications()" style="font-size:0.85rem">
                    <option value="">Tất cả đối tượng</option>
                    ${Object.entries(NOTIF_TARGETS).map(([k,v])=>
                        `<option value="${k}">${v}</option>`
                    ).join('')}
                </select>
            </div>
        </div>
        <div id="notif-list">
            <div style="text-align:center;padding:40px;color:#64748b">
                <i class="fas fa-spinner fa-spin" style="font-size:1.5rem"></i>
                <p style="margin-top:10px">Đang tải thông báo...</p>
            </div>
        </div>`;

    loadNotifications();
}

// ── Load + render danh sách thông báo ─────────────────────────────────────
window.loadNotifications = function() {
    const filterType   = document.getElementById('notif-filter-type')?.value   || '';
    const filterTarget = document.getElementById('notif-filter-target')?.value || '';
    const isAdmin      = window.userRole === 'admin';

    window.onValue(notiRef(), snap => {
        const raw  = snap.val() || {};
        let items  = Object.values(raw)
            .sort((a,b) => (b.createdAt||0) - (a.createdAt||0));

        // Lọc theo quyền xem. V5.7: subject_teacher cũng nhận được thông báo
        // gửi cho "teacher" vì đây là nhóm tất cả giáo viên.
        if (!isAdmin) {
            _loadReadIdsForCurrentUser();
            items = items.filter(n => _canCurrentUserSeeNotification(n));
        }

        // Lọc theo filter
        if (filterType)   items = items.filter(n => n.type      === filterType);
        if (filterTarget) items = items.filter(n => n.targetRole === filterTarget);

        const el = document.getElementById('notif-list');
        if (!el) return;

        if (!items.length) {
            el.innerHTML = `
                <div style="text-align:center;padding:60px;background:white;
                            border-radius:10px;box-shadow:0 1px 3px rgba(0,0,0,0.08)">
                    <i class="fas fa-bell-slash" style="font-size:3rem;color:#cbd5e1;margin-bottom:16px;display:block"></i>
                    <p style="color:#94a3b8;font-size:1rem">Chưa có thông báo nào</p>
                    ${isAdmin ? `<button class="btn btn-primary" onclick="openNotifModal()" style="margin-top:16px">
                        <i class="fas fa-plus"></i> Tạo thông báo đầu tiên
                    </button>` : ''}
                </div>`;
            return;
        }

        el.innerHTML = items.map(n => _renderNotifCard(n, isAdmin)).join('');
    }, { onlyOnce: true });
};

// ── Render 1 card thông báo ───────────────────────────────────────────────
function _renderNotifCard(n, isAdmin) {
    const t     = NOTIF_TYPES[n.type] || NOTIF_TYPES.general;
    const tgt   = NOTIF_TARGETS[n.targetRole] || n.targetRole || '';
    const date  = n.createdAt ? new Date(n.createdAt).toLocaleString('vi-VN') : '';
    const isPinned = n.priority === 'high';
    const isUrgent = n.type    === 'urgent';

    const classTag = n.targetClass
        ? `<span style="background:#f1f5f9;color:#475569;padding:2px 8px;border-radius:12px;
                         font-size:0.75rem;margin-left:4px">📚 Lớp ${n.targetClass}</span>`
        : '';

    return `
    <div style="background:white;border-radius:10px;margin-bottom:12px;
                box-shadow:0 1px 3px rgba(0,0,0,0.08);overflow:hidden;
                border-left:4px solid ${t.color};
                ${isPinned ? 'border-top:2px solid '+t.color+';' : ''}
                opacity:${n.isActive===false ? '0.55' : '1'}">
        <!-- Header -->
        <div style="padding:14px 18px 10px;display:flex;align-items:flex-start;gap:12px">
            <!-- Icon type -->
            <div style="background:${t.bg};color:${t.color};border-radius:10px;
                        padding:10px;font-size:1.1rem;flex-shrink:0;line-height:1">
                <i class="fas fa-${t.icon}"></i>
            </div>
            <!-- Nội dung chính -->
            <div style="flex:1;min-width:0">
                <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:6px">
                    ${isPinned ? `<span style="background:#fef3c7;color:#92400e;padding:2px 8px;
                        border-radius:12px;font-size:0.72rem;font-weight:700">📌 Ghim</span>` : ''}
                    ${isUrgent ? `<span style="background:#fee2e2;color:#991b1b;padding:2px 8px;
                        border-radius:12px;font-size:0.72rem;font-weight:700;
                        animation:pulse 1.5s infinite">🚨 KHẨN</span>` : ''}
                    <span style="background:${t.bg};color:${t.color};padding:2px 10px;
                        border-radius:12px;font-size:0.75rem;font-weight:600">
                        <i class="fas fa-${t.icon}" style="margin-right:3px"></i>${t.label}
                    </span>
                    <span style="background:#f1f5f9;color:#475569;padding:2px 8px;
                        border-radius:12px;font-size:0.75rem">${tgt}</span>
                    ${classTag}
                    ${n.isActive===false ? `<span style="background:#f1f5f9;color:#94a3b8;
                        padding:2px 8px;border-radius:12px;font-size:0.72rem">Đã ẩn</span>` : ''}
                </div>
                <h3 style="margin:0 0 6px;font-size:1rem;color:#1e293b;font-weight:700;
                           line-height:1.4">${n.title || ''}</h3>
                <div style="color:#475569;font-size:0.88rem;line-height:1.6">${formatNotifContent(n.content || '')}</div>
            </div>
            <!-- Actions -->
            ${isAdmin ? `
            <div style="display:flex;flex-direction:column;gap:5px;flex-shrink:0">
                <button class="btn btn-sm btn-primary" onclick="openNotifModal('${n.id}')"
                    title="Sửa" style="padding:5px 10px">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline" onclick="toggleNotifActive('${n.id}',${!n.isActive})"
                    title="${n.isActive===false?'Hiện lại':'Ẩn thông báo'}" style="padding:5px 10px">
                    <i class="fas fa-${n.isActive===false?'eye':'eye-slash'}"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteNotif('${n.id}')"
                    title="Xóa" style="padding:5px 10px">
                    <i class="fas fa-trash"></i>
                </button>
            </div>` : ''}
        </div>
        <!-- Footer -->
        <div style="padding:8px 18px;background:#f8fafc;border-top:1px solid #f1f5f9;
                    display:flex;align-items:center;justify-content:space-between;
                    font-size:0.78rem;color:#94a3b8">
            <span><i class="fas fa-user-circle" style="margin-right:4px"></i>${n.author || '—'}</span>
            <span><i class="fas fa-clock" style="margin-right:4px"></i>${date}</span>
        </div>
    </div>`;
}

export function formatNotifContent(str) {
    if (!str) return '';
    let text = String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    // 1. Khung viền nổi bật: [vien]...[/vien] hoặc [khung]...[/khung]
    text = text.replace(/\[(?:vien|viền|khung)\]([\s\S]*?)\[\/(?:vien|viền|khung)\]/gi, (_, p1) => {
        return `<div style="margin:10px 0;padding:11px 14px;border:1.5px solid #2563eb;border-radius:8px;background:#eff6ff;color:#1e40af;line-height:1.6">${p1}</div>`;
    });

    // 2. Chữ IN HOA: [hoa]...[/hoa] hoặc [caps]...[/caps]
    text = text.replace(/\[(?:hoa|caps|upper)\]([\s\S]*?)\[\/(?:hoa|caps|upper)\]/gi, (_, p1) => {
        return `<span style="text-transform:uppercase;font-weight:700">${p1}</span>`;
    });

    // 3. In đậm: **text** hoặc __text__
    text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/__(.+?)__/g, '<strong>$1</strong>');

    // 4. Kèm link: [tên link](url)
    text = text.replace(/\[([^\]]+)\]\(((?:https?:\/\/|mailto:|tel:)[^\s\)]+)\)/g, (_, label, url) => {
        return `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color:#2563eb;text-decoration:underline;font-weight:700;word-break:break-all"><i class="fas fa-external-link-alt" style="font-size:0.75em;margin-right:3px"></i>${label}</a>`;
    });
    text = text.replace(/\[([^\]]+)\]\((www\.[^\s\)]+)\)/g, (_, label, url) => {
        return `<a href="https://${url}" target="_blank" rel="noopener noreferrer" style="color:#2563eb;text-decoration:underline;font-weight:700;word-break:break-all"><i class="fas fa-external-link-alt" style="font-size:0.75em;margin-right:3px"></i>${label}</a>`;
    });

    // 5. Tự động nhận diện URL thô
    text = text.replace(/(^|[^"'>])(https?:\/\/[^\s<]+)/g, (_, prefix, url) => {
        let cleanUrl = url.replace(/[.,;!?]+$/, '');
        let trailing = url.slice(cleanUrl.length);
        return `${prefix}<a href="${cleanUrl}" target="_blank" rel="noopener noreferrer" style="color:#2563eb;text-decoration:underline;font-weight:600;word-break:break-all"><i class="fas fa-external-link-alt" style="font-size:0.75em;margin-right:3px"></i>${cleanUrl}</a>${trailing}`;
    });

    // 6. Xuống dòng
    text = text.replace(/\r?\n/g, '<br>');
    return text;
}

function _safeHtml(str) {
    return formatNotifContent(str);
}

function _escapeHtmlSimple(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ══════════════════════════════════════════════════════════════════════════════
// MODAL TẠO / SỬA THÔNG BÁO
// ══════════════════════════════════════════════════════════════════════════════
window.openNotifModal = async function(editId) {
    if (window.userRole !== 'admin') return;

    let existing = {};
    if (editId) {
        const snap = await window.get(notiRef(editId));
        existing   = snap.val() || {};
    }

    const classes = [...new Set(
        Object.values(window.localData.students)
            .map(s => s.classRoom || s.class).filter(Boolean)
    )].sort((a,b) => a.localeCompare(b,'vi'));

    const isEdit = !!editId;

    const { value: formData } = await Swal.fire({
        title: isEdit ? '✏️ Sửa thông báo' : '📣 Tạo thông báo mới',
        width: '700px',
        html: `
        <div style="text-align:left;font-size:0.88rem">

            <!-- Tiêu đề -->
            <div class="form-group" style="margin-bottom:14px">
                <label style="font-weight:600;color:#374151;font-size:0.85rem">
                    Tiêu đề thông báo *
                </label>
                <input type="text" id="nf-title" class="form-control"
                    placeholder="VD: Thông báo nghỉ lễ 30/4 - 1/5"
                    value="${existing.title || ''}"
                    style="margin-top:5px;font-size:0.95rem;font-weight:600">
            </div>

            <!-- Loại + Đối tượng -->
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px">
                <div>
                    <label style="font-weight:600;color:#374151;font-size:0.85rem">Loại thông báo *</label>
                    <select id="nf-type" class="form-control" style="margin-top:5px"
                        onchange="_updateNotifPreview()">
                        ${Object.entries(NOTIF_TYPES).map(([k,v])=>
                            `<option value="${k}" ${existing.type===k?'selected':''}>${v.label}</option>`
                        ).join('')}
                    </select>
                </div>
                <div>
                    <label style="font-weight:600;color:#374151;font-size:0.85rem">Gửi đến *</label>
                    <select id="nf-target" class="form-control" style="margin-top:5px"
                        onchange="_toggleClassSelect()">
                        ${Object.entries(NOTIF_TARGETS).map(([k,v])=>
                            `<option value="${k}" ${(existing.targetRole||'all')===k?'selected':''}>${v}</option>`
                        ).join('')}
                    </select>
                </div>
            </div>

            <!-- Lọc theo lớp (tuỳ chọn) -->
            <div id="nf-class-wrap" style="margin-bottom:14px;
                display:${existing.targetClass||existing.targetRole==='parent'?'block':'none'}">
                <label style="font-weight:600;color:#374151;font-size:0.85rem">
                    Giới hạn lớp cụ thể
                    <span style="font-weight:400;color:#94a3b8">(để trống = gửi tất cả lớp)</span>
                </label>
                <select id="nf-class" class="form-control" style="margin-top:5px">
                    <option value="">— Tất cả lớp —</option>
                    ${classes.map(c=>
                        `<option value="${c}" ${existing.targetClass===c?'selected':''}>${c}</option>`
                    ).join('')}
                </select>
            </div>

            <!-- Nội dung -->
            <div class="form-group" style="margin-bottom:14px">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
                    <label style="font-weight:600;color:#374151;font-size:0.85rem;margin:0">Nội dung thông báo *</label>
                    <span style="font-size:0.74rem;color:#64748b">
                        Cú pháp: **In đậm**, IN HOA, [Tên link](url), [vien]Khung[/vien]
                    </span>
                </div>

                <!-- Thanh công cụ định dạng -->
                <div style="display:flex;gap:6px;align-items:center;margin-bottom:6px;background:#f8fafc;padding:6px 8px;border-radius:8px;border:1px solid #e2e8f0;flex-wrap:wrap">
                    <button type="button" class="btn btn-sm btn-outline" onclick="_insertNotifFormat('bold')"
                        title="In đậm (**nội dung**)" style="padding:4px 9px;font-size:0.82rem;font-weight:700;background:white">
                        <i class="fas fa-bold"></i> In đậm
                    </button>
                    <button type="button" class="btn btn-sm btn-outline" onclick="_insertNotifFormat('uppercase')"
                        title="Chuyển thành chữ IN HOA" style="padding:4px 9px;font-size:0.82rem;font-weight:700;background:white">
                        <i class="fas fa-font"></i> IN HOA
                    </button>
                    <button type="button" class="btn btn-sm btn-outline" onclick="_insertNotifFormat('link')"
                        title="Chèn liên kết web ([Tiêu đề](link))" style="padding:4px 9px;font-size:0.82rem;font-weight:600;background:white">
                        <i class="fas fa-link" style="color:#2563eb"></i> Kèm link
                    </button>
                    <button type="button" class="btn btn-sm btn-outline" onclick="_insertNotifFormat('border')"
                        title="Đóng khung viền nổi bật ([vien]...[/vien])" style="padding:4px 9px;font-size:0.82rem;font-weight:600;background:white">
                        <i class="far fa-square" style="color:#059669"></i> Khung viền
                    </button>
                </div>

                <textarea id="nf-content" class="form-control"
                    rows="6" placeholder="Nhập nội dung thông báo chi tiết... (VD: Kính gửi quý thầy cô và phụ huynh...)"
                    style="margin-top:2px;resize:vertical;font-size:0.88rem;line-height:1.6"
                >${existing.content || ''}</textarea>
                <div style="text-align:right;font-size:0.75rem;color:#94a3b8;margin-top:3px">
                    <span id="nf-char-count">0</span> ký tự
                </div>
            </div>

            <!-- Ưu tiên + Trạng thái -->
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px">
                <div>
                    <label style="font-weight:600;color:#374151;font-size:0.85rem">Mức độ ưu tiên</label>
                    <select id="nf-priority" class="form-control" style="margin-top:5px">
                        <option value="normal" ${(existing.priority||'normal')==='normal'?'selected':''}>🔵 Bình thường</option>
                        <option value="high"   ${existing.priority==='high'  ?'selected':''}>📌 Ghim lên đầu</option>
                    </select>
                </div>
                <div>
                    <label style="font-weight:600;color:#374151;font-size:0.85rem">Trạng thái</label>
                    <select id="nf-active" class="form-control" style="margin-top:5px">
                        <option value="true"  ${existing.isActive!==false?'selected':''}>✅ Hiển thị</option>
                        <option value="false" ${existing.isActive===false  ?'selected':''}>🙈 Ẩn</option>
                    </select>
                </div>
            </div>

            <!-- Gửi email -->
            <div style="margin:0 0 14px;padding:12px 14px;border-radius:10px;background:#f8fafc;border:1px solid #e2e8f0">
                <label style="display:flex;align-items:center;gap:9px;font-weight:600;color:#334155">
                    <input type="checkbox" id="nf-send-email" ${!isEdit && window.FIREBASE_FEATURES?.plan !== 'spark' ? 'checked' : ''}>
                    <span>${isEdit ? 'Gửi lại email sau khi cập nhật' : 'Gửi email đến GV/PH phù hợp'}</span>
                </label>
                <div style="font-size:.78rem;color:#64748b;margin-top:5px;line-height:1.45">
                    Email được gửi qua Resend/Cloudflare. Ở chế độ Spark tùy chọn này mặc định tắt để giảm dữ liệu emailOutbox.
                </div>
            </div>

            <!-- Preview badge & Real-time preview card -->
            <div id="nf-preview" style="padding:12px 14px;border-radius:10px;border:1px solid #e2e8f0;
                background:#f8fafc;font-size:0.82rem;color:#64748b">
                <i class="fas fa-eye" style="margin-right:4px"></i>
                Xem trước giao diện thông báo sẽ hiện ở đây
            </div>
        </div>`,

        showCancelButton: true,
        confirmButtonText: isEdit
            ? '<i class="fas fa-save"></i> Cập nhật'
            : '<i class="fas fa-paper-plane"></i> Đăng thông báo',
        cancelButtonText: 'Hủy',
        confirmButtonColor: '#1e3a8a',

        didOpen: () => {
            // Char count + live preview
            const ta = document.getElementById('nf-content');
            const cc = document.getElementById('nf-char-count');
            const titleInput = document.getElementById('nf-title');
            if (ta && cc) {
                cc.textContent = ta.value.length;
                ta.addEventListener('input', () => {
                    cc.textContent = ta.value.length;
                    window._updateNotifPreview();
                });
            }
            if (titleInput) {
                titleInput.addEventListener('input', window._updateNotifPreview);
            }
            // Initial states
            window._updateNotifPreview();
            window._toggleClassSelect();
        },

        preConfirm: () => {
            const title   = document.getElementById('nf-title')?.value.trim();
            const content = document.getElementById('nf-content')?.value.trim();
            const type    = document.getElementById('nf-type')?.value;
            const target  = document.getElementById('nf-target')?.value;
            const cls     = document.getElementById('nf-class')?.value  || '';
            const priority= document.getElementById('nf-priority')?.value;
            const active  = document.getElementById('nf-active')?.value !== 'false';

            if (!title)   { Swal.showValidationMessage('Vui lòng nhập tiêu đề'); return false; }
            if (!content) { Swal.showValidationMessage('Vui lòng nhập nội dung'); return false; }

            const sendEmail = document.getElementById('nf-send-email')?.checked || false;

            return { title, content, type, targetRole:target,
                     targetClass:cls, priority, isActive:active, sendEmail };
        }
    });

    if (!formData) return;

    try {
        Swal.fire({ title:'Đang lưu...', allowOutsideClick:false, didOpen:()=>Swal.showLoading() });

        const saveData = {
            ...formData,
            author:    window.currentUser?.email || 'admin',
            updatedAt: Date.now(),
        };

        if (isEdit) {
            await window.update(notiRef(editId), saveData);
            saveData.id = editId;
        } else {
            const newRef  = window.push(notiRef());
            saveData.id   = newRef.key;
            saveData.createdAt = Date.now();
            await window.set(newRef, saveData);
        }

        let emailResult = null;
        if (formData.sendEmail && saveData.isActive !== false) {
            Swal.update?.({ title: 'Đã lưu, đang xử lý email...' });
            emailResult = await sendNotificationEmail(saveData);
        }

        const t = NOTIF_TYPES[formData.type] || NOTIF_TYPES.general;
        Swal.fire({
            icon: 'success',
            title: isEdit ? 'Đã cập nhật thông báo!' : '✅ Đã đăng thông báo!',
            html: `
            <div style="text-align:left;font-size:0.9rem">
                <div style="background:${t.bg};border-radius:8px;padding:12px 14px;margin-bottom:10px">
                    <p style="font-weight:700;color:${t.color};margin-bottom:4px">
                        <i class="fas fa-${t.icon}"></i> ${formData.title}
                    </p>
                    <p style="color:#475569;font-size:0.85rem">
                        ${NOTIF_TARGETS[formData.targetRole]}
                        ${formData.targetClass ? ` — Lớp ${formData.targetClass}` : ''}
                    </p>
                </div>
                <p style="color:#64748b;font-size:0.82rem">
                    ${isEdit ? 'Thông báo đã được cập nhật.' : 'Thông báo đã được gửi đến tất cả người dùng thuộc đối tượng trên.'}
                </p>
                ${emailResultHtml(emailResult)}
            </div>`,
            timer: 3000, showConfirmButton: false,
        });

        renderNotifications();

    } catch(err) {
        Swal.fire('Lỗi', err.message, 'error');
    }
};

// ── Helper cho modal ──────────────────────────────────────────────────────────
window._insertNotifFormat = function(action) {
    const ta = document.getElementById('nf-content');
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = ta.value.substring(start, end);
    const before = ta.value.substring(0, start);
    const after = ta.value.substring(end);
    let replacement = '';
    let newCursorStart = start;
    let newCursorEnd = start;

    if (action === 'bold') {
        if (selected) {
            replacement = `**${selected}**`;
            newCursorStart = start;
            newCursorEnd = start + replacement.length;
        } else {
            replacement = '**chữ in đậm**';
            newCursorStart = start + 2;
            newCursorEnd = start + 14;
        }
    } else if (action === 'uppercase') {
        if (selected) {
            replacement = selected.toUpperCase();
            newCursorStart = start;
            newCursorEnd = start + replacement.length;
        } else {
            replacement = '[hoa]CHỮ IN HOA[/hoa]';
            newCursorStart = start + 5;
            newCursorEnd = start + 16;
        }
    } else if (action === 'link') {
        const defaultText = selected || 'Xem chi tiết tại đây';
        const url = window.prompt('Nhập địa chỉ liên kết (URL):', 'https://');
        if (!url || url.trim() === 'https://' || url.trim() === '') return;
        const validUrl = url.trim().startsWith('http://') || url.trim().startsWith('https://')
            ? url.trim()
            : `https://${url.trim()}`;
        replacement = `[${defaultText}](${validUrl})`;
        newCursorStart = start;
        newCursorEnd = start + replacement.length;
    } else if (action === 'border') {
        if (selected) {
            replacement = `[vien]${selected}[/vien]`;
            newCursorStart = start;
            newCursorEnd = start + replacement.length;
        } else {
            replacement = `[vien]Nội dung cần đóng khung viền nổi bật[/vien]`;
            newCursorStart = start + 6;
            newCursorEnd = start + 40;
        }
    }

    ta.value = before + replacement + after;
    ta.focus();
    ta.setSelectionRange(newCursorStart, newCursorEnd);
    ta.dispatchEvent(new Event('input'));
};

window._updateNotifPreview = function() {
    const type = document.getElementById('nf-type')?.value;
    const t    = NOTIF_TYPES[type] || NOTIF_TYPES.general;
    const title = document.getElementById('nf-title')?.value.trim() || 'Tiêu đề thông báo';
    const content = document.getElementById('nf-content')?.value.trim() || 'Nội dung thông báo (hỗ trợ **in đậm**, [hoa]IN HOA[/hoa], [link](https://...) và [vien]khung viền[/vien])...';
    const prev = document.getElementById('nf-preview');
    if (prev) {
        prev.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
            <span style="background:${t.bg};color:${t.color};padding:3px 10px;
                border-radius:12px;font-size:0.8rem;font-weight:600">
                <i class="fas fa-${t.icon}" style="margin-right:4px"></i>${t.label}
            </span>
            <span style="font-size:0.75rem;color:#94a3b8"><i class="fas fa-eye"></i> Xem trước hiển thị</span>
        </div>
        <div style="background:white;border-radius:8px;padding:12px 14px;border:1px solid #e2e8f0;border-left:4px solid ${t.color};box-shadow:0 1px 3px rgba(0,0,0,0.04)">
            <h4 style="margin:0 0 6px;color:#1e293b;font-size:0.95rem;font-weight:700">${_escapeHtmlSimple(title)}</h4>
            <div style="color:#475569;font-size:0.86rem;line-height:1.6">${formatNotifContent(content)}</div>
        </div>`;
    }
};

window._toggleClassSelect = function() {
    const target = document.getElementById('nf-target')?.value;
    const wrap   = document.getElementById('nf-class-wrap');
    // Lọc lớp chỉ thật sự phù hợp cho phụ huynh, GVCN hoặc thông báo toàn trường.
    // GV bộ môn không gắn 1 lớp cố định nên không bắt buộc chọn lớp.
    if (wrap) wrap.style.display = ['parent', 'homeroom_teacher', 'all'].includes(target) ? 'block' : 'none';
};

// ── Toggle ẩn/hiện thông báo ─────────────────────────────────────────────────
window.toggleNotifActive = async function(id, newActive) {
    try {
        await window.update(notiRef(id), { isActive: newActive, updatedAt: Date.now() });
        Swal.fire({
            icon: 'success',
            title: newActive ? '✅ Đã hiện thông báo' : '🙈 Đã ẩn thông báo',
            timer: 1500, showConfirmButton: false,
        });
        renderNotifications();
    } catch(err) {
        Swal.fire('Lỗi', err.message, 'error');
    }
};

// ── Xóa thông báo ────────────────────────────────────────────────────────────
window.deleteNotif = async function(id) {
    const result = await Swal.fire({
        title: 'Xóa thông báo?',
        text:  'Thao tác này không thể hoàn tác.',
        icon:  'warning',
        showCancelButton:  true,
        confirmButtonText: 'Xóa',
        cancelButtonText:  'Hủy',
        confirmButtonColor:'#dc2626',
    });
    if (!result.isConfirmed) return;
    try {
        await window.remove(notiRef(id));
        Swal.fire({ icon:'success', title:'Đã xóa!', timer:1500, showConfirmButton:false });
        renderNotifications();
    } catch(err) {
        Swal.fire('Lỗi', err.message, 'error');
    }
};

// ══════════════════════════════════════════════════════════════════════════════
// BADGE SỐ THÔNG BÁO CHƯA ĐỌC — hiện trên menu
// ══════════════════════════════════════════════════════════════════════════════
window._notifUnreadCount = 0;
window._notifReadStorageKey = '';
window._notifReadIds = new Set();

function _saveReadIds() {
    try {
        const key = _notifReadStorageKey();
        localStorage.setItem(key, JSON.stringify([..._loadReadIdsForCurrentUser()].slice(-300)));
    } catch(e) {}
}

export function initNotifBadge() {
    _loadReadIdsForCurrentUser();
    window.onValue(notiRef(), snap => {
        const raw   = snap.val() || {};
        const items = Object.values(raw).filter(n => {
            if (window.userRole === 'admin') return !!n.isActive;
            return _canCurrentUserSeeNotification(n);
        });
        const readIds = _loadReadIdsForCurrentUser();
        const unread = items.filter(n => n.id && !readIds.has(n.id)).length;
        window._notifUnreadCount = unread;
        _updateBadgeUI(unread);
    });
}

function _updateBadgeUI(count) {
    // Xóa badge cũ
    document.querySelectorAll('.notif-badge').forEach(el => el.remove());
    if (!count) return;

    // Tìm menu item thông báo và gắn badge
    document.querySelectorAll('.menu-item').forEach(el => {
        if (el.getAttribute('onclick')?.includes("'notifications'")) {
            const badge = document.createElement('span');
            badge.className = 'notif-badge';
            badge.textContent = count > 99 ? '99+' : count;
            badge.style.cssText = `
                background:#dc2626;color:white;border-radius:10px;
                padding:1px 6px;font-size:0.68rem;font-weight:700;
                margin-left:auto;min-width:18px;text-align:center;
                line-height:16px;display:inline-block;
            `;
            el.appendChild(badge);
        }
    });
}

// Đánh dấu đã đọc khi vào trang thông báo
export function markAllNotifRead() {
    _loadReadIdsForCurrentUser();
    window.onValue(notiRef(), snap => {
        const raw = snap.val() || {};
        Object.values(raw).forEach(n => {
            if (n?.id && (window.userRole === 'admin' ? n.isActive : _canCurrentUserSeeNotification(n))) {
                window._notifReadIds.add(n.id);
            }
        });
        _saveReadIds();
        window._notifUnreadCount = 0;
        _updateBadgeUI(0);
    }, { onlyOnce: true });
}

// ══════════════════════════════════════════════════════════════════════════════
// POPUP THÔNG BÁO MỚI — hiện khi đăng nhập xong (nếu có TB chưa đọc)
// ══════════════════════════════════════════════════════════════════════════════
export async function showNewNotifPopup() {
    const role = window.userRole;
    const snap = await window.get(notiRef());
    const raw  = snap.val() || {};

    const readIds = _loadReadIdsForCurrentUser();
    const unread = Object.values(raw)
        .filter(n => {
            if (!n?.id || readIds.has(n.id)) return false;
            if (role === 'admin') return !!n.isActive;
            return _canCurrentUserSeeNotification(n);
        })
        .sort((a,b) => (b.createdAt||0) - (a.createdAt||0))
        .slice(0, 3); // tối đa 3 thông báo mới nhất

    if (!unread.length) return;

    const t0 = NOTIF_TYPES[unread[0].type] || NOTIF_TYPES.general;

    await Swal.fire({
        title: `🔔 Bạn có ${unread.length} thông báo mới`,
        html: `
        <div style="text-align:left">
            ${unread.map(n => {
                const t = NOTIF_TYPES[n.type] || NOTIF_TYPES.general;
                const d = n.createdAt ? new Date(n.createdAt).toLocaleDateString('vi-VN') : '';
                return `
                <div style="border-left:3px solid ${t.color};padding:10px 14px;
                            margin-bottom:10px;background:${t.bg}20;border-radius:0 6px 6px 0">
                    <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
                        <span style="background:${t.bg};color:${t.color};padding:1px 8px;
                            border-radius:10px;font-size:0.72rem;font-weight:600">
                            <i class="fas fa-${t.icon}"></i> ${t.label}
                        </span>
                        <span style="font-size:0.72rem;color:#94a3b8">${d}</span>
                    </div>
                    <p style="font-weight:700;margin:0 0 4px;color:#1e293b">${_escapeHtmlSimple(n.title || '')}</p>
                    <div style="font-size:0.84rem;color:#475569;margin:0;line-height:1.55;max-height:85px;overflow-y:auto">
                        ${formatNotifContent(n.content || '')}
                    </div>
                </div>`;
            }).join('')}
        </div>`,
        confirmButtonText: 'Xem tất cả thông báo',
        showDenyButton: true,
        denyButtonText: 'Bỏ qua',
        denyButtonColor: '#64748b',
        confirmButtonColor: '#1e3a8a',
        width: '560px',
    }).then(res => {
        // Đánh dấu đọc dù bấm gì
        unread.forEach(n => window._notifReadIds.add(n.id));
        _saveReadIds();
        _updateBadgeUI(0);
        if (res.isConfirmed) {
            window.changeView('notifications');
        }
    });
}
