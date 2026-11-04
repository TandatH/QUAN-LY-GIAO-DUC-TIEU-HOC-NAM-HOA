// ═══════════════════════════════════════════════════════
// schoolyear.js — Quản lý Năm học
// Admin set năm học hiện tại → toàn hệ thống dùng chung
// Lên lớp hàng loạt cuối năm
// DB: settings/schoolYear = "2025-2026"
//     settings/semester   = "hk1" | "hk2"
// ═══════════════════════════════════════════════════════

import { SCORE_MODES, SCORE_MODE_LABELS, schoolYearKey,
         toDateTimeLocalValue, fromDateTimeLocalValue,
         evaluateScoreEntryWindow, formatDateTime, escapeHtml, openScoreAuditLog }
    from "./scoreaccess.js";
import { renderYearTransitionPanel, loadPromotionStatusForYear }
    from "./yeartransition.js?v=5.32.9";
import { paymentStatusPath, paymentStatusClassPath, classKey, financeMatchesYear } from "./yearscope.js";

window.openScoreAuditLog = openScoreAuditLog;

const VIEW_YEAR_STORAGE_KEY = 'smartschool_view_school_year';

function normalizeSchoolYearText(value) {
    const m = String(value || '').match(/(\d{4})\D+(\d{4})/);
    return m ? `${m[1]}-${m[2]}` : '';
}

function readViewSchoolYear() {
    return normalizeSchoolYearText(localStorage.getItem(VIEW_YEAR_STORAGE_KEY) || '');
}

function writeViewSchoolYear(year) {
    const y = normalizeSchoolYearText(year);
    if (y) localStorage.setItem(VIEW_YEAR_STORAGE_KEY, y);
    else localStorage.removeItem(VIEW_YEAR_STORAGE_KEY);
    return y;
}

export function getSystemSchoolYear() {
    return window._systemSchoolYear || window._currentSchoolYear || _autoSchoolYear();
}

export function isViewingArchivedSchoolYear() {
    return !!window._isViewingArchivedYear;
}

window.setViewSchoolYear = async function(year) {
    const y = writeViewSchoolYear(year);
    if (!y) return Swal.fire('Lỗi', 'Năm học không hợp lệ. Ví dụ: 2025-2026', 'warning');

    const system = window._systemSchoolYear || window._currentSchoolYear || _autoSchoolYear();
    window._currentSchoolYear = y;
    window._isViewingArchivedYear = y !== system;

    if (window._scoreCurrentClass) window._scoreCurrentClass = '';
    await Swal.fire({
        icon: 'success',
        title: `Đang xem năm học ${y}`,
        html: `<div style="font-size:0.9rem">Chế độ này chỉ để xem dữ liệu cũ, không dùng để chuyển năm học hệ thống.</div>`,
        timer: 1600,
        showConfirmButton: false
    });

    if (typeof window.changeView === 'function') window.changeView('scores');
    else renderSchoolYear();
};

window.clearViewSchoolYear = async function() {
    localStorage.removeItem(VIEW_YEAR_STORAGE_KEY);
    const system = window._systemSchoolYear || _autoSchoolYear();
    window._currentSchoolYear = system;
    window._isViewingArchivedYear = false;
    if (window._scoreCurrentClass) window._scoreCurrentClass = '';
    await Swal.fire({
        icon: 'success',
        title: `Đã quay về năm hiện tại ${system}`,
        timer: 1400,
        showConfirmButton: false
    });
    renderSchoolYear();
};


// ── Lấy năm học từ Firebase (đã cache vào window) ────────────────────────────
export async function initSchoolYear() {
    try {
        const settingsSnap = await window.get(window.child(window.ref(window.db), 'settings'));
        const settings = settingsSnap.val() || {};
        const systemSchoolYear = settings.schoolYear || _autoSchoolYear();
        const viewSchoolYear = readViewSchoolYear();

        window._systemSchoolYear = systemSchoolYear;
        window._currentSchoolYear = viewSchoolYear || systemSchoolYear;
        window._isViewingArchivedYear = !!viewSchoolYear && viewSchoolYear !== systemSchoolYear;
        window._currentSemester   = settings.semester || 'hk1';
        window._legacyFinanceSchoolYear = settings.legacyFinanceSchoolYear || systemSchoolYear;
        if (window.userRole === 'admin') {
            const expectedYearKey = systemSchoolYear.replace('-', '_');
            const fixes = {};
            if (settings.schoolYearKey !== expectedYearKey) fixes['settings/schoolYearKey'] = expectedYearKey;
            if (!settings.legacyFinanceSchoolYear) fixes['settings/legacyFinanceSchoolYear'] = systemSchoolYear;
            if (Number(settings.schemaVersion || 0) < 5) {
                const migrationNow = typeof window.serverNow === 'function' ? window.serverNow() : Date.now();
                fixes['settings/schemaVersion'] = 5;
                fixes['settings/v5MigratedAt'] = migrationNow;
                fixes['settings/v5MigratedBy'] = window.currentUser?.email || '';
                fixes['settings/v5MigratedByUid'] = window.currentUser?.uid || '';
            }

            // V5: bổ sung khóa lớp cho tài khoản cũ và tạo chỉ mục đóng tiền theo lớp.
            // Chỉ Admin thực hiện migration; các lần sau chỉ ghi những trường còn thiếu/sai.
            const [usersSnap, studentsSnap, paymentSnap, paymentClassSnap] = await Promise.all([
                window.get(window.child(window.ref(window.db), 'users')),
                window.get(window.child(window.ref(window.db), 'students')),
                window.get(window.child(window.ref(window.db), paymentStatusPath(systemSchoolYear))),
                window.get(window.child(window.ref(window.db), `paymentStatusByClass/${expectedYearKey}`)),
            ]);
            const users = usersSnap.val() || {};
            const students = studentsSnap.val() || {};
            const payment = paymentSnap.val() || {};
            const paymentByClass = paymentClassSnap.val() || {};

            Object.entries(users).forEach(([uid, user]) => {
                if (user?.role === 'teacher' && user.assignedClass) {
                    const key = classKey(user.assignedClass);
                    if (user.assignedClassKey !== key) fixes[`users/${uid}/assignedClassKey`] = key;
                }
                if (user?.role === 'subject_teacher' && Array.isArray(user.assignedGrades) && !user.assignedGradeMap) {
                    fixes[`users/${uid}/assignedGradeMap`] = Object.fromEntries(user.assignedGrades.map(g => [String(g), true]));
                }
            });

            Object.entries(students).forEach(([studentKey, student]) => {
                const className = student?.classRoom || student?.class || '';
                const key = classKey(className);
                const grade = (String(className).match(/^(\d+)/)||[])[1] || '';
                if (student?.currentClassKey !== key) fixes[`students/${studentKey}/currentClassKey`] = key;
                if (String(student?.currentGrade || '') !== grade) fixes[`students/${studentKey}/currentGrade`] = grade;
            });

            const studentLookup = new Map();
            Object.entries(students).forEach(([studentKey, student]) => {
                [studentKey, student?.id, student?.code].filter(Boolean)
                    .forEach(value => studentLookup.set(String(value), { studentKey, student }));
            });
            const migrationNow = typeof window.serverNow === 'function' ? window.serverNow() : Date.now();
            Object.entries(payment).forEach(([studentCode, oldRecord]) => {
                if (!oldRecord || typeof oldRecord !== 'object') return;
                const found = studentLookup.get(String(studentCode));
                if (!found) return;
                const className = found.student?.classRoom || found.student?.class || oldRecord.className || '';
                const key = classKey(className);
                if (!key) return;
                const record = {
                    ...oldRecord,
                    isPaid: oldRecord.isPaid === true,
                    studentCode: String(studentCode),
                    studentKey: found.studentKey,
                    className,
                    classKey: key,
                    schoolYear: systemSchoolYear,
                    updatedAt: Number(oldRecord.updatedAt || migrationNow),
                    updatedBy: oldRecord.updatedBy || window.currentUser?.email || '',
                    updatedByUid: oldRecord.updatedByUid || window.currentUser?.uid || '',
                };
                const originalComparable = JSON.stringify(oldRecord);
                if (JSON.stringify(record) !== originalComparable) {
                    fixes[`${paymentStatusPath(systemSchoolYear)}/${studentCode}`] = record;
                }
                const indexed = paymentByClass?.[key]?.[studentCode];
                if (JSON.stringify(indexed || null) !== JSON.stringify(record)) {
                    fixes[`${paymentStatusClassPath(className, systemSchoolYear)}/${studentCode}`] = record;
                }
            });
            // Xóa chỉ mục cũ khi học sinh đã chuyển lớp hoặc bản ghi gốc không còn tồn tại.
            Object.entries(paymentByClass).forEach(([indexedClassKey, records]) => {
                Object.entries(records || {}).forEach(([studentCode, indexedRecord]) => {
                    const found = studentLookup.get(String(studentCode)) || studentLookup.get(String(indexedRecord?.studentKey || ''));
                    const desiredKey = found ? classKey(found.student?.classRoom || found.student?.class || '') : '';
                    if (!payment[studentCode] || desiredKey !== indexedClassKey) {
                        fixes[`paymentStatusByClass/${expectedYearKey}/${indexedClassKey}/${studentCode}`] = null;
                    }
                });
            });
            if (Object.keys(fixes).length) await window.update(window.ref(window.db), fixes);
        }
    } catch(e) {
        console.error('[Smart School V5.33.0] initSchoolYear/view-year migration error:', e);
        if (!window._currentSchoolYear) window._currentSchoolYear = _autoSchoolYear();
        if (!window._currentSemester) window._currentSemester = 'hk1';
    }
}

function _autoSchoolYear() {
    const n = new Date(), y = n.getFullYear();
    return n.getMonth() >= 7 ? `${y}-${y+1}` : `${y-1}-${y}`;
}

export function getSchoolYear() {
    return window._currentSchoolYear || _autoSchoolYear();
}
export function getSemester() {
    return window._currentSemester || 'hk1';
}

function khenThuongTheoDanhGia(danhGia) {
    if (danhGia === 'Hoàn thành xuất sắc') return 'Học sinh Xuất sắc';
    if (danhGia === 'Hoàn thành tốt') return 'Học sinh Tiêu biểu hoàn thành tốt trong học tập và rèn luyện';
    return '';
}

// ══════════════════════════════════════════════════════════════════════════════
// RENDER TRANG QUẢN LÝ NĂM HỌC
// ══════════════════════════════════════════════════════════════════════════════
export async function renderSchoolYear() {
    await initSchoolYear();
    const sy  = getSchoolYear();
    const sem = getSemester();
    const systemSy = getSystemSchoolYear();
    const isArchiveView = isViewingArchivedSchoolYear();

    const snap = await window.get(window.child(window.ref(window.db), 'settings'));
    const settings = snap.val() || {};
    const scoreWindows = settings.scoreEntryWindows?.[schoolYearKey(sy)] || {};

    document.getElementById('content').innerHTML = `
        <div style="display:grid;grid-template-columns:340px 1fr;gap:20px;max-width:1100px;align-items:start">
            <div class="card" style="border-top:4px solid #1e3a8a">
                <h3 style="color:#1e3a8a;margin-bottom:16px">
                    <i class="fas fa-calendar-alt"></i> Năm học hiện tại
                </h3>
                <div style="background:${isArchiveView?'#fff7ed':'#eff6ff'};border-radius:10px;padding:16px;margin-bottom:16px;text-align:center;border:${isArchiveView?'2px solid #fb923c':'none'}">
                    <div style="font-size:0.78rem;font-weight:700;color:${isArchiveView?'#c2410c':'#64748b'}">
                        ${isArchiveView ? 'ĐANG XEM NĂM HỌC CŨ' : 'NĂM HỌC HỆ THỐNG'}
                    </div>
                    <div style="font-size:2rem;font-weight:800;color:${isArchiveView?'#c2410c':'#1e3a8a'}">${sy}</div>
                    ${isArchiveView ? `<div style="font-size:0.78rem;color:#9a3412;margin-top:4px">Năm hiện tại của hệ thống: <b>${systemSy}</b></div>` : ''}
                    <div style="font-size:1rem;font-weight:600;margin-top:6px;color:${sem==='hk1'?'#2563eb':'#16a34a'}">
                        ${sem==='hk1'?'📚 Học kỳ 1':'📚 Học kỳ 2'}
                    </div>
                </div>
                <div style="font-weight:600;font-size:0.85rem;color:#374151;margin-bottom:7px">Học kỳ hiện tại</div>
                <div style="display:flex;gap:8px">
                    <button onclick="setSemester('hk1')" class="btn ${sem==='hk1'?'btn-primary':'btn-outline'}" style="flex:1">Học kỳ 1</button>
                    <button onclick="setSemester('hk2')" class="btn ${sem==='hk2'?'btn-success':'btn-outline'}" style="flex:1">Học kỳ 2</button>
                </div>
                <div style="margin-top:14px;padding:10px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;font-size:0.82rem">
                    <div style="font-weight:700;color:#334155;margin-bottom:6px">
                        <i class="fas fa-eye"></i> Xem lại điểm năm học cũ
                    </div>
                    <div style="display:flex;gap:6px;flex-wrap:wrap">
                        <input id="view-school-year-input" class="form-control" style="flex:1;min-width:140px"
                               placeholder="2025-2026" value="${sy}">
                        <button class="btn btn-primary btn-sm" onclick="setViewSchoolYear(document.getElementById('view-school-year-input').value)">
                            Xem điểm
                        </button>
                        ${isArchiveView ? `<button class="btn btn-outline btn-sm" onclick="clearViewSchoolYear()">Quay về hiện tại</button>` : ''}
                    </div>
                    <div style="color:#64748b;font-size:0.75rem;margin-top:6px">
                        Chỉ đổi năm đang xem trên máy này, không làm thay đổi năm học hệ thống.
                    </div>
                </div>
                <div style="margin-top:14px;padding:10px;background:#fef3c7;border-radius:8px;font-size:0.78rem;color:#92400e">
                    <i class="fas fa-lock"></i> Không đổi năm học trực tiếp. Hãy dùng quy trình chuyển năm học nguyên khối V5 để tránh lệch lớp, học kỳ và dữ liệu lịch sử.
                </div>
            </div>

            <div class="card" style="border-top:4px solid #16a34a">
                <h3 style="color:#166534;margin-bottom:14px"><i class="fas fa-exchange-alt"></i> Kết thúc năm học và chuyển năm mới — V5</h3>
                <div id="year-transition-panel"></div>
            </div>
        </div>

        ${isArchiveView ? `
        <div class="card" style="margin-top:20px;border-left:5px solid #f97316;background:#fff7ed;color:#9a3412;max-width:1100px">
            <strong><i class="fas fa-eye"></i> Bạn đang xem lại năm học ${sy}.</strong>
            Dữ liệu điểm/học bạ được mở ở chế độ xem. Để quay về năm hiện tại ${systemSy}, bấm
            <button class="btn btn-sm btn-outline" onclick="clearViewSchoolYear()" style="margin-left:6px">Quay về hiện tại</button>.
        </div>` : ''}

        <div class="card" style="margin-top:20px;border-top:4px solid #dc2626;max-width:1100px">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap;margin-bottom:14px">
                <div>
                    <h3 style="color:#b91c1c;margin-bottom:5px"><i class="fas fa-clock"></i> Thời gian giáo viên được nhập điểm</h3>
                    <div style="color:#64748b;font-size:0.82rem">Áp dụng cho năm học <strong>${sy}</strong>. Ngoài thời gian này giáo viên chỉ được xem.</div>
                </div>
                <div style="background:#fee2e2;color:#991b1b;border-radius:8px;padding:8px 11px;font-size:0.78rem"><i class="fas fa-user-shield"></i> Admin luôn có quyền chỉnh sửa</div>
            </div>
            <div style="overflow-x:auto">
                <table style="width:100%;min-width:780px;border-collapse:collapse">
                    <thead><tr style="background:#f8fafc;color:#475569">
                        <th style="text-align:left;padding:9px;border:1px solid #e2e8f0">Đợt nhập</th>
                        <th style="text-align:center;padding:9px;border:1px solid #e2e8f0;width:90px">Mở</th>
                        <th style="text-align:left;padding:9px;border:1px solid #e2e8f0">Bắt đầu</th>
                        <th style="text-align:left;padding:9px;border:1px solid #e2e8f0">Kết thúc</th>
                        <th style="text-align:left;padding:9px;border:1px solid #e2e8f0">Trạng thái</th>
                    </tr></thead>
                    <tbody>${SCORE_MODES.map(mode => {
                        const cfg = scoreWindows[mode] || {};
                        const st  = evaluateScoreEntryWindow(cfg, { role:'teacher' });
                        const color = st.allowed ? '#166534' : '#b91c1c';
                        const bg    = st.allowed ? '#dcfce7' : '#fee2e2';
                        return `<tr>
                            <td style="padding:9px;border:1px solid #e2e8f0;font-weight:700">${SCORE_MODE_LABELS[mode]}</td>
                            <td style="padding:9px;border:1px solid #e2e8f0;text-align:center"><input type="checkbox" id="score-window-${mode}-enabled" ${cfg.enabled===true?'checked':''} style="width:18px;height:18px"></td>
                            <td style="padding:9px;border:1px solid #e2e8f0"><input type="datetime-local" id="score-window-${mode}-start" class="form-control" value="${toDateTimeLocalValue(cfg.startAt)}"></td>
                            <td style="padding:9px;border:1px solid #e2e8f0"><input type="datetime-local" id="score-window-${mode}-end" class="form-control" value="${toDateTimeLocalValue(cfg.endAt)}"></td>
                            <td style="padding:9px;border:1px solid #e2e8f0">
                                <span style="display:inline-block;background:${bg};color:${color};border-radius:12px;padding:4px 9px;font-size:0.75rem;font-weight:700">${st.allowed?'ĐANG MỞ':'ĐANG KHÓA'}</span>
                                <div style="font-size:0.72rem;color:#64748b;margin-top:4px">${escapeHtml(st.message)}</div>
                                ${cfg.updatedAt?`<div style="font-size:0.68rem;color:#94a3b8;margin-top:3px">Cập nhật: ${formatDateTime(cfg.updatedAt)} — ${escapeHtml(cfg.updatedBy||'')}</div>`:''}
                            </td>
                        </tr>`;
                    }).join('')}</tbody>
                </table>
            </div>
            <div style="display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap;margin-top:14px">
                <button onclick="openScoreAuditLog('${sy}')" class="btn btn-outline"><i class="fas fa-history"></i> Nhật ký nhập/sửa điểm</button>
                <button onclick="saveScoreEntryWindows()" class="btn btn-danger"><i class="fas fa-save"></i> Lưu thời gian nhập điểm</button>
            </div>
        </div>

        <div class="card" style="margin-top:20px;border-top:4px solid #7c3aed;max-width:1100px">
            <h3 style="color:#7c3aed;margin-bottom:16px"><i class="fas fa-history"></i> Lịch sử năm học trong hệ thống</h3>
            <div id="school-year-history"><div style="text-align:center;color:#94a3b8;padding:20px"><i class="fas fa-spinner fa-spin"></i> Đang tải...</div></div>
        </div>`;

    await renderYearTransitionPanel('year-transition-panel');
    loadSchoolYearHistory();
}

// ── Lưu thời gian nhập điểm của giáo viên ───────────────────────────────────
window.saveScoreEntryWindows = async function() {
    if (window.userRole !== 'admin') {
        Swal.fire('Từ chối', 'Chỉ Admin được cấu hình thời gian nhập điểm.', 'error');
        return;
    }

    const sy = getSchoolYear();
    const now = Date.now();
    const editorEmail = window.currentUser?.email || '';
    const editorUid   = window.currentUser?.uid || '';
    const payload = {};

    for (const mode of SCORE_MODES) {
        const enabled = document.getElementById(`score-window-${mode}-enabled`)?.checked === true;
        const startAt = fromDateTimeLocalValue(document.getElementById(`score-window-${mode}-start`)?.value);
        const endAt   = fromDateTimeLocalValue(document.getElementById(`score-window-${mode}-end`)?.value);

        if (enabled && (!startAt || !endAt)) {
            Swal.fire('Thiếu thời gian', `Vui lòng nhập đủ thời gian bắt đầu và kết thúc cho ${SCORE_MODE_LABELS[mode]}.`, 'warning');
            return;
        }
        if (enabled && endAt <= startAt) {
            Swal.fire('Thời gian không hợp lệ', `Thời gian kết thúc của ${SCORE_MODE_LABELS[mode]} phải sau thời gian bắt đầu.`, 'warning');
            return;
        }

        payload[mode] = {
            enabled,
            startAt: startAt || 0,
            endAt: endAt || 0,
            updatedAt: now,
            updatedBy: editorEmail,
            updatedByUid: editorUid,
        };
    }

    try {
        await window.set(
            window.ref(window.db, `settings/scoreEntryWindows/${schoolYearKey(sy)}`),
            payload
        );
        Swal.fire({
            icon:'success',
            title:'Đã lưu thời gian nhập điểm',
            html:`<div style="font-size:0.88rem">Giáo viên sẽ chỉ nhập hoặc sửa điểm trong các khoảng thời gian đã mở của năm học <b>${sy}</b>.</div>`,
            timer:2200,
            showConfirmButton:false,
        }).then(() => renderSchoolYear());
    } catch (error) {
        Swal.fire('Lỗi', error.message, 'error');
    }
};

// ── Lưu cài đặt năm học ──────────────────────────────────────────────────────
window.saveSchoolYearSettings = async function() {
    Swal.fire('Đã khóa đổi năm trực tiếp', 'Từ V5, năm học chỉ được thay đổi bằng quy trình “Chuyển năm học nguyên khối”.', 'info');
};

// ── Set học kỳ ───────────────────────────────────────────────────────────────
window.setSemester = async function(hk) {
    try {
        await window.update(window.ref(window.db, 'settings'), {
            semester: hk, updatedAt: Date.now()
        });
        window._currentSemester = hk;
        Swal.fire({
            icon: 'success',
            title: `Đã chuyển sang ${hk === 'hk1' ? 'Học kỳ 1' : 'Học kỳ 2'}!`,
            timer: 1500, showConfirmButton: false
        }).then(() => renderSchoolYear());
    } catch(e) {
        Swal.fire('Lỗi', e.message, 'error');
    }
};

// ── Lịch sử năm học ──────────────────────────────────────────────────────────
async function loadSchoolYearHistory() {
    // Quét hocba để tìm tất cả năm học đã có dữ liệu
    const students = Object.values(window.localData.students);
    if (!students.length) {
        document.getElementById('school-year-history').innerHTML =
            '<p style="color:#94a3b8;text-align:center">Chưa có dữ liệu học bạ nào</p>';
        return;
    }

    // V5: quét toàn bộ học sinh theo lô, không chỉ lấy mẫu 5 học sinh đầu.
    const yearSet = new Set();
    const BATCH_SIZE = 10;
    for (let i = 0; i < students.length; i += BATCH_SIZE) {
        const batch = students.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map(async s => {
            try {
                const snap = await window.get(window.ref(window.db, `hocba/${s.id}`));
                const val  = snap.val() || {};
                Object.keys(val).filter(yk => /^\d{4}_\d{4}$/.test(yk))
                    .forEach(yk => yearSet.add(yk.replace('_','-')));
            } catch(e) {}
        }));
    }

    const years = [...yearSet].sort().reverse();

    if (!years.length) {
        const histEl1 = document.getElementById('school-year-history');
        if (!histEl1) return;
        histEl1.innerHTML =
            '<p style="color:#94a3b8;text-align:center;padding:20px">Chưa có dữ liệu học bạ. Bắt đầu nhập điểm để tạo lịch sử.</p>';
        return;
    }

    const histEl = document.getElementById('school-year-history');
    if (!histEl) return;
    histEl.innerHTML = `
        <div style="display:flex;gap:10px;flex-wrap:wrap">
            ${years.map(y => `
                <div style="background:${y===getSchoolYear()?'#1e3a8a':'#f8fafc'};
                            color:${y===getSchoolYear()?'white':'#374151'};
                            border-radius:10px;padding:12px 20px;text-align:center;
                            border:2px solid ${y===getSchoolYear()?'#1e3a8a':'#e2e8f0'}">
                    <div style="font-size:1.1rem;font-weight:700">${y}</div>
                    <div style="font-size:0.72rem;opacity:0.8;margin-top:3px">
                        ${y===getSystemSchoolYear()?'✅ Năm hiện tại hệ thống':(y===getSchoolYear()?'👁️ Đang xem':'Đã lưu trữ')}
                    </div>
                    <button class="btn btn-sm ${y===getSchoolYear()?'btn-light':'btn-outline'}"
                            style="margin-top:8px;font-size:0.72rem"
                            onclick="setViewSchoolYear('${y}')">
                        <i class="fas fa-eye"></i> Xem điểm
                    </button>
                </div>
            `).join('')}
        </div>
        <p style="color:#64748b;font-size:0.8rem;margin-top:12px">
            <i class="fas fa-info-circle"></i>
            Dữ liệu điểm và học bạ của mỗi năm học được lưu riêng biệt, không bị ghi đè.
        </p>`;
}

// Quy trình lên lớp cũ đã được thay bằng yeartransition.js (V5).

// ══════════════════════════════════════════════════════════════════════════════
// THỐNG KÊ CUỐI NĂM
// ══════════════════════════════════════════════════════════════════════════════
export async function renderYearEndSummary() {
    try {
        const sy       = getSchoolYear();
        const studentEntries = Object.entries(window.localData?.students || {});
        const students = studentEntries
            .map(([k, s]) => ({ id: s.id || k, key: k, ...s }))
            .filter(s => (s.status||'active') === 'active');
        const classes  = [...new Set(students.map(s=>s.classRoom||s.class).filter(Boolean))]
            .sort((a,b) => a.localeCompare(b, 'vi', { numeric: true }));

        document.getElementById('content').innerHTML = `
            <div style="margin-bottom:14px;display:flex;gap:10px;align-items:center">
                <span style="font-size:1rem;font-weight:700;color:#1e293b">
                    <i class="fas fa-chart-bar"></i> Tổng kết năm học ${sy}
                </span>
            </div>
            <div id="yearend-content">
                <div style="text-align:center;padding:30px">
                    <i class="fas fa-spinner fa-spin"></i> Đang tải...
                </div>
            </div>`;

        // Load promotion status — luôn fresh, không dùng cache
        window._promotionCache = null;
        const [promoData, psSnap] = await Promise.all([
            loadPromotionStatusForYear(sy).catch(() => ({})),
            window.get(window.child(window.ref(window.db), paymentStatusPath(sy))).catch(() => ({ val: () => ({}) })),
        ]);
        const psData = (typeof psSnap?.val === 'function' ? psSnap.val() : psSnap) || {};

        // Load hocba toàn bộ năm học cho mỗi HS (lấy cả hk1, hk2 + ketQua year-level)
        const yk      = sy.replace('-','_');
        const hk1Map  = {}, hk2Map = {}, yearMap = {};
        const BATCH   = 8;
        for (let i = 0; i < students.length; i += BATCH) {
            const batch = students.slice(i, i + BATCH);
            await Promise.all(batch.map(async s => {
                const sid = s.id || s.key || s.code;
                try {
                    // Load cả node năm học để lấy ketQua (từ hocba.js) + hk1, hk2 (từ scores.js)
                    const snap   = await window.get(window.ref(window.db, `hocba/${sid}/${yk}`));
                    const val    = snap?.val() || {};
                    yearMap[sid] = val;
                    hk1Map[sid]  = val.hk1 || {};
                    hk2Map[sid]  = val.hk2 || {};
                } catch(e) {
                    hk1Map[sid] = {};
                    hk2Map[sid] = {};
                    yearMap[sid] = {};
                }
            }));
        }

        // Tính thống kê theo lớp
        const classStats = classes.map(cls => {
            const clsStudents = students.filter(s => (s.classRoom||s.class) === cls);
            const grade       = (cls.match(/^(\d+)/)||[])[1] || '1';
            const ds          = (window.PRIMARY_SUBJECTS?.[grade]||[]).filter(s=>s.type==='diem');

            const stats = { total:clsStudents.length, xuat_sac:0, tot:0, dat:0, chua_dat:0, chua_dg:0,
                            len_lop:0, o_lai:0, bao_luu:0, chua_xn:0,
                            paid:0, unpaid:0, absentKP:0 };

            clsStudents.forEach(s => {
                const sid = s.id || s.key || s.code;
                const hk1 = hk1Map[sid] || {};
                const hk2 = hk2Map[sid] || {};
                const hb  = yearMap[sid] || {};
                // Merge: ketQua từ hocba.js (year-level) ưu tiên hơn __kq từ scores.js
                const kq  = hb.ketQua || hk2.__kq || {};
                // Đánh giá kết quả giáo dục
                if      (kq.danhGia === 'Hoàn thành xuất sắc') stats.xuat_sac++;
                else if (kq.danhGia === 'Hoàn thành tốt')      stats.tot++;
                else if (kq.danhGia === 'Hoàn thành')          stats.dat++;
                else if (kq.danhGia === 'Chưa hoàn thành')     stats.chua_dat++;
                else                                            stats.chua_dg++;
                // Trạng thái lên lớp
                // Học bạ lưu theo s.id — dùng s.id làm key chính
                const pKey = promoData[s.id]?.status || promoData[s.code]?.status || promoData[s.key]?.status || '';
                if      (pKey === 'len_lop')  stats.len_lop++;
                else if (pKey === 'o_lai')    stats.o_lai++;
                else if (pKey === 'bao_luu')  stats.bao_luu++;
                else                          stats.chua_xn++;
                // Học phí
                const isPaid = psData[s.id]?.isPaid || psData[s.code]?.isPaid || psData[s.key]?.isPaid || false;
                if (isPaid) stats.paid++; else stats.unpaid++;
                // Vắng không phép (lấy từ yearMap hoặc HK1+HK2)
                const nghiKP = Number(hb.nghiKhongPhep ?? ((hk1.__body?.nghiKhongPhep || 0) + (hk2.__body?.nghiKhongPhep || 0))) || 0;
                stats.absentKP += nghiKP;
            });
            return { cls, grade, stats };
        });

        // Tổng toàn trường
        const total = { total:0, xuat_sac:0, tot:0, dat:0, chua_dat:0, chua_dg:0,
                        len_lop:0, o_lai:0, bao_luu:0, chua_xn:0,
                        paid:0, unpaid:0, absentKP:0 };
        classStats.forEach(r => Object.keys(total).forEach(k => total[k] += r.stats[k]||0));

        // Guard: nếu người dùng đã chuyển trang trong lúc đang load, bỏ qua
        const yearendEl = document.getElementById('yearend-content');
        if (!yearendEl) return;
        yearendEl.innerHTML = `
            <!-- Tổng toàn trường -->
            <div class="card" style="margin-bottom:16px;border-top:4px solid #1e3a8a">
                <div style="font-weight:700;color:#1e3a8a;margin-bottom:12px;font-size:0.95rem">
                    📊 Toàn trường — ${total.total} học sinh
                </div>
                <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:16px">
                    <div>
                        <div style="font-size:0.78rem;font-weight:600;color:#64748b;margin-bottom:8px">HỌC LỰC</div>
                        <div style="display:flex;gap:6px;flex-wrap:wrap">
                            ${[
                                ['Hoàn thành XS', total.xuat_sac, '#7c3aed','#ede9fe'],
                                ['Hoàn thành tốt', total.tot,     '#16a34a','#dcfce7'],
                                ['Hoàn thành',     total.dat,     '#2563eb','#dbeafe'],
                                ['Chưa HT',        total.chua_dat,'#dc2626','#fee2e2'],
                                ['Chưa ĐG',        total.chua_dg, '#94a3b8','#f1f5f9'],
                            ].map(([l,v,c,bg]) => `
                                <div style="background:${bg};border-radius:8px;padding:8px 12px;text-align:center;min-width:80px">
                                    <div style="font-size:1.3rem;font-weight:700;color:${c}">${v}</div>
                                    <div style="font-size:0.68rem;color:#64748b">${l}</div>
                                    <div style="font-size:0.65rem;color:#94a3b8">${total.total?Math.round(v/total.total*100):0}%</div>
                                </div>`).join('')}
                        </div>
                    </div>
                    <div>
                        <div style="font-size:0.78rem;font-weight:600;color:#64748b;margin-bottom:8px">TRẠNG THÁI LÊN LỚP</div>
                        <div style="display:flex;gap:6px;flex-wrap:wrap">
                            ${[
                                ['✅ Lên lớp',       total.len_lop, '#16a34a','#dcfce7'],
                                ['🔁 Ở lại',         total.o_lai,   '#d97706','#fef3c7'],
                                ['⏸️ Bảo lưu',       total.bao_luu, '#2563eb','#dbeafe'],
                                ['⏳ Chưa xác nhận', total.chua_xn, '#94a3b8','#f1f5f9'],
                            ].map(([l,v,c,bg]) => `
                                <div style="background:${bg};border-radius:8px;padding:8px 12px;text-align:center;min-width:90px">
                                    <div style="font-size:1.3rem;font-weight:700;color:${c}">${v}</div>
                                    <div style="font-size:0.68rem;color:#64748b">${l}</div>
                                </div>`).join('')}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Bảng từng lớp -->
            <div class="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>Lớp</th>
                            <th style="text-align:center">Sĩ số</th>
                            <th style="text-align:center;background:#ede9fe;color:#7c3aed">Xuất sắc</th>
                            <th style="text-align:center;background:#dcfce7;color:#16a34a">HT Tốt</th>
                            <th style="text-align:center;background:#dbeafe;color:#2563eb">HT</th>
                            <th style="text-align:center;background:#fee2e2;color:#dc2626">Chưa HT</th>
                            <th style="text-align:center;color:#94a3b8">Chưa ĐG</th>
                            <th style="text-align:center">✅ Lên lớp</th>
                            <th style="text-align:center">🔁 Ở lại</th>
                            <th style="text-align:center;background:#fef3c7;color:#d97706">Vắng KP</th>
                            <th style="text-align:center;background:#f0fdf4;color:#16a34a">Đóng HP</th>
                            <th style="text-align:center;color:#94a3b8">Chưa đóng</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${classStats.length ? classStats.map(r => `<tr>
                            <td><strong>${r.cls}</strong></td>
                            <td style="text-align:center">${r.stats.total}</td>
                            <td style="text-align:center;color:#7c3aed;font-weight:700">${r.stats.xuat_sac||'—'}</td>
                            <td style="text-align:center;color:#16a34a;font-weight:700">${r.stats.tot||'—'}</td>
                            <td style="text-align:center;color:#2563eb;font-weight:700">${r.stats.dat||'—'}</td>
                            <td style="text-align:center;color:#dc2626;font-weight:700">${r.stats.chua_dat||'—'}</td>
                            <td style="text-align:center;color:#94a3b8">${r.stats.chua_dg||'—'}</td>
                            <td style="text-align:center;color:#16a34a;font-weight:700">${r.stats.len_lop}</td>
                            <td style="text-align:center;color:#d97706;font-weight:700">${r.stats.o_lai||'—'}</td>
                            <td style="text-align:center;color:${r.stats.absentKP>5?'#dc2626':'#374151'};font-weight:${r.stats.absentKP>5?'700':'400'}">${r.stats.absentKP||'—'}</td>
                            <td style="text-align:center;color:#16a34a;font-weight:700">${r.stats.paid}</td>
                            <td style="text-align:center;color:${r.stats.unpaid>0?'#dc2626':'#94a3b8'}">${r.stats.unpaid||'—'}</td>
                        </tr>`).join('') : `<tr><td colspan="12" style="text-align:center;padding:24px;color:#64748b">Không có dữ liệu học sinh</td></tr>`}
                    </tbody>
                </table>
            </div>

            <div style="margin-top:16px;display:flex;gap:10px;flex-wrap:wrap">
                <button class="btn btn-success" onclick="exportYearEndExcel()">
                    <i class="fas fa-file-excel"></i> Xuất Excel tổng kết
                </button>
                <button class="btn btn-primary" onclick="changeView('schoolyear')">
                    <i class="fas fa-graduation-cap"></i> Thực hiện lên lớp hàng loạt
                </button>
                <button class="btn btn-warning" onclick="backupAllData()"
                    style="background:#7c3aed;border:none;color:white">
                    <i class="fas fa-database"></i> Backup toàn bộ dữ liệu
                </button>
            </div>`;

        window._yearEndStats = { classStats, total, sy };
    } catch(err) {
        console.error('renderYearEndSummary error:', err);
        const yearendEl = document.getElementById('yearend-content');
        if (yearendEl) {
            yearendEl.innerHTML = `
                <div class="card" style="text-align:center;padding:30px;color:#dc2626">
                    <i class="fas fa-exclamation-triangle" style="font-size:2rem;margin-bottom:10px"></i>
                    <p style="font-weight:600;margin-bottom:8px">Có lỗi khi tải dữ liệu tổng kết năm học</p>
                    <p style="font-size:0.85rem;color:#64748b;margin-bottom:16px">${err.message || err}</p>
                    <button class="btn btn-primary" onclick="renderYearEndSummary()">
                        <i class="fas fa-redo"></i> Thử lại
                    </button>
                </div>`;
        }
    }
}

window.exportYearEndExcel = function() {
    const { classStats, total, sy } = window._yearEndStats || {};
    if (!classStats) return;
    const rows = classStats.map(r => ({
        'Lớp': r.cls, 'Sĩ số': r.stats.total,
        'Hoàn thành xuất sắc': r.stats.xuat_sac,
        'Hoàn thành tốt':      r.stats.tot,
        'Hoàn thành':          r.stats.dat,
        'Chưa hoàn thành':     r.stats.chua_dat,
        'Chưa đánh giá':       r.stats.chua_dg,
        'Lên lớp':             r.stats.len_lop,
        'Ở lại':               r.stats.o_lai,
        'Bảo lưu':             r.stats.bao_luu,
        'Chưa xác nhận':       r.stats.chua_xn,
        'Vắng không phép (buổi)': r.stats.absentKP,
        'Đã đóng học phí':     r.stats.paid,
        'Chưa đóng học phí':   r.stats.unpaid,
    }));
    rows.push({
        'Lớp':'TỔNG TRƯỜNG', 'Sĩ số':total.total,
        'Hoàn thành xuất sắc':total.xuat_sac,
        'Hoàn thành tốt':total.tot,
        'Hoàn thành':total.dat,
        'Chưa hoàn thành':total.chua_dat,
        'Chưa đánh giá':total.chua_dg,
        'Lên lớp':total.len_lop,
        'Ở lại':total.o_lai,
        'Bảo lưu':total.bao_luu,
        'Chưa xác nhận':total.chua_xn,
        'Vắng không phép (buổi)': classStats.reduce((s,r)=>s+(r.stats.absentKP||0),0),
        'Đã đóng học phí': classStats.reduce((s,r)=>s+(r.stats.paid||0),0),
        'Chưa đóng học phí': classStats.reduce((s,r)=>s+(r.stats.unpaid||0),0),
    });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), `TongKet_${sy.replace('-','_')}`);
    XLSX.writeFile(wb, `TongKet_NamHoc_${sy.replace('-','_')}.xlsx`);
    Swal.fire({ icon:'success', title:'Xuất thành công!', timer:1500, showConfirmButton:false });
};
// ══════════════════════════════════════════════════════════════════════════════
// BACKUP TOÀN BỘ DỮ LIỆU → EXCEL NHIỀU SHEET
// Các sheet:
//   1. Tổng kết năm học   — thống kê theo lớp
//   2. Danh sách HS        — toàn bộ thông tin học sinh
//   3. Điểm HK1            — điểm cuối HK1 từng HS
//   4. Điểm HK2            — điểm cuối HK2 từng HS
//   5. Giữa HK1            — mức đạt giữa HK1
//   6. Giữa HK2            — mức đạt giữa HK2
//   7. Phẩm chất & NL      — HK1 + HK2
//   8. Điểm danh           — tổng hợp vắng cả năm
//   9. Tài chính           — toàn bộ thu/chi
//  10. Học phí HS          — trạng thái đóng học phí từng HS
//  11. Lên lớp             — kết quả xét lên lớp
// ══════════════════════════════════════════════════════════════════════════════
window.backupAllData = async function() {
    const sy = getSchoolYear();
    const yk = sy.replace('-', '_');

    const result = await Swal.fire({
        title: '💾 Backup toàn bộ dữ liệu',
        html: `
        <div style="text-align:left;font-size:0.9rem">
            <p style="color:#1e293b;margin-bottom:12px">
                Sẽ xuất file Excel <b>${sy}</b> gồm các sheet:
            </p>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:0.83rem">
                <div style="background:#f0fdf4;padding:6px 10px;border-radius:6px">📊 Tổng kết năm học</div>
                <div style="background:#eff6ff;padding:6px 10px;border-radius:6px">👤 Danh sách học sinh</div>
                <div style="background:#fef3c7;padding:6px 10px;border-radius:6px">📝 Điểm cuối HK1</div>
                <div style="background:#fef3c7;padding:6px 10px;border-radius:6px">📝 Điểm cuối HK2</div>
                <div style="background:#ede9fe;padding:6px 10px;border-radius:6px">📋 Giữa HK1</div>
                <div style="background:#ede9fe;padding:6px 10px;border-radius:6px">📋 Giữa HK2</div>
                <div style="background:#fce7f3;padding:6px 10px;border-radius:6px">💎 Phẩm chất & Năng lực</div>
                <div style="background:#f0fdf4;padding:6px 10px;border-radius:6px">📅 Điểm danh</div>
                <div style="background:#fef9c3;padding:6px 10px;border-radius:6px">💰 Tài chính thu/chi</div>
                <div style="background:#fef9c3;padding:6px 10px;border-radius:6px">💳 Học phí học sinh</div>
                <div style="background:#dcfce7;padding:6px 10px;border-radius:6px">🎓 Kết quả lên lớp</div>
            </div>
            <p style="margin-top:12px;font-size:0.8rem;color:#64748b">
                ⏱ Quá trình có thể mất 30-60 giây tùy số lượng học sinh.
            </p>
        </div>`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: '<i class="fas fa-download"></i> Bắt đầu backup',
        cancelButtonText: 'Hủy',
        confirmButtonColor: '#7c3aed',
        width: 560,
    });

    if (!result.isConfirmed) return;

    // ── Progress dialog ──────────────────────────────────────────────────────
    const setProgress = (msg, pct) => {
        Swal.fire({
            title: '⏳ Đang backup dữ liệu...',
            html: `
            <div style="text-align:left">
                <p style="color:#374151;margin-bottom:10px;font-size:0.9rem">${msg}</p>
                <div style="background:#e2e8f0;border-radius:8px;height:12px;overflow:hidden">
                    <div style="background:#7c3aed;width:${pct}%;height:100%;border-radius:8px;
                        transition:width 0.3s"></div>
                </div>
                <p style="text-align:right;font-size:0.8rem;color:#64748b;margin-top:4px">${pct}%</p>
            </div>`,
            allowOutsideClick: false,
            showConfirmButton: false,
        });
    };

    try {
        setProgress('Đang tải dữ liệu từ Firebase...', 5);

        // ── Load tất cả data từ Firebase song song ───────────────────────────
        const [promoData, psSnap, finSnap, attSnap] = await Promise.all([
            loadPromotionStatusForYear(sy),
            window.get(window.child(window.ref(window.db), paymentStatusPath(sy))),
            window.get(window.child(window.ref(window.db), 'finance')),
            window.get(window.child(window.ref(window.db), `attendance/${yk}`)),
        ]);
        const psData      = psSnap.val()    || {};
        const allFinance  = finSnap.val()   || {};
        const financeData = Object.fromEntries(Object.entries(allFinance).filter(([,tx]) => financeMatchesYear(tx, sy)));
        const attendData  = attSnap.val()   || {};

        const PROMOTION_STATUS_MAP = {
            'len_lop':  'Lên lớp',
            'o_lai':    'Ở lại',
            'bao_luu':  'Bảo lưu',
            'nghi_hoc': 'Nghỉ học',
        };

        const allStudents = Object.values(window.localData.students)
            .sort((a,b) => {
                const ca = (a.classRoom||a.class||'') + (a.code||a.id||'');
                const cb = (b.classRoom||b.class||'') + (b.code||b.id||'');
                return ca.localeCompare(cb, 'vi', { numeric: true });
            });

        setProgress('Đang tải điểm học sinh...', 15);

        // ── Load hocba data cho tất cả HS (batch 8) ─────────────────────────
        const hocbaMap = {};
        const BATCH = 8;
        for (let i = 0; i < allStudents.length; i += BATCH) {
            const batch = allStudents.slice(i, i + BATCH);
            await Promise.all(batch.map(async s => {
                try {
                    const snap = await window.get(window.ref(window.db, `hocba/${s.id}/${yk}`));
                    hocbaMap[s.id] = snap.val() || {};
                } catch(e) { hocbaMap[s.id] = {}; }
            }));
            const pct = 15 + Math.round((i / allStudents.length) * 55);
            setProgress(`Đang tải điểm: ${Math.min(i+BATCH, allStudents.length)}/${allStudents.length} học sinh...`, pct);
        }

        setProgress('Đang xây dựng các sheet Excel...', 72);

        const wb = XLSX.utils.book_new();
        const addSheet = (data, name) => {
            if (!data.length) return;
            const safe = name.substring(0, 31);
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), safe);
        };

        // ── Helpers ──────────────────────────────────────────────────────────
        const gradeOf = cls => ((cls||'').match(/^(\d+)/)||[])[1] || '1';
        const getSubs  = g  => window.PRIMARY_SUBJECTS?.[g] || window.PRIMARY_SUBJECTS?.['1'] || [];
        const diemSubs = g  => getSubs(g).filter(s => s.type === 'diem');
        const ghkHasNumericScore = (g, subjectName) => {
            if (typeof window.isGHKScoreSubject === 'function') {
                return window.isGHKScoreSubject(g, subjectName);
            }
            const normalized = String(subjectName || '').normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
            return ['3','4','5'].includes(String(g))
                && ['tieng viet','toan','ngoai ngu 1','tieng anh'].includes(normalized);
        };
        const nxSubs   = g  => getSubs(g).filter(s => s.type === 'nhanxet');
        const pcs   = window.PHAM_CHAT        || [];
        const nlcs  = window.NANG_LUC_CHUNG  || [];
        const nlds  = window.NANG_LUC_DAC_THU|| [];

        const promoLabel = sid => {
            const pKey = promoData[sid]?.status || '';
            return PROMOTION_STATUS_MAP[pKey] || 'Chưa xác nhận';
        };

        // ════════════════════════════════════════════════════════════════════
        // SHEET 1: TỔNG KẾT NĂM HỌC
        // ════════════════════════════════════════════════════════════════════
        setProgress('Sheet 1: Tổng kết năm học...', 74);
        {
            const activeStudents = allStudents.filter(s => !s.status || s.status === 'active');
            const classes = [...new Set(activeStudents.map(s => s.classRoom||s.class).filter(Boolean))].sort();
            const sheet1 = [];

            classes.forEach(cls => {
                const clsStu = activeStudents.filter(s => (s.classRoom||s.class) === cls);
                const g = gradeOf(cls);
                const ds = diemSubs(g);
                let xs=0, tot=0, dat=0, chua=0, chuaDG=0,
                    lenLop=0, oLai=0, baoLuu=0, chuaXN=0,
                    paid=0, unpaid=0, nghiKP=0;

                clsStu.forEach(s => {
                    const hb  = hocbaMap[s.id] || {};
                    const hk2 = hb.hk2 || {};
                    const kq  = hb.ketQua || hk2.__kq || {};
                    // Đánh giá kết quả giáo dục
                    if      (kq.danhGia === 'Hoàn thành xuất sắc') xs++;
                    else if (kq.danhGia === 'Hoàn thành tốt')      tot++;
                    else if (kq.danhGia === 'Hoàn thành')          dat++;
                    else if (kq.danhGia === 'Chưa hoàn thành')     chua++;
                    else                                            chuaDG++;
                    // Lên lớp
                    const pk = promoData[s.id]?.status || promoData[s.code]?.status || '';
                    if      (pk === 'len_lop')  lenLop++;
                    else if (pk === 'o_lai')    oLai++;
                    else if (pk === 'bao_luu')  baoLuu++;
                    else                        chuaXN++;
                    // Học phí
                    if (psData[s.id]?.isPaid || psData[s.code]?.isPaid) paid++; else unpaid++;
                    // Vắng KP
                    nghiKP += hk2.__body?.nghiKhongPhep || hb.nghiKhongPhep || 0;
                });

                sheet1.push({
                    'Lớp': cls, 'Khối': g, 'Sĩ số': clsStu.length,
                    'HT Xuất sắc': xs, 'HT Tốt': tot, 'Hoàn thành': dat,
                    'Chưa hoàn thành': chua, 'Chưa đánh giá': chuaDG,
                    'Lên lớp': lenLop, 'Ở lại': oLai,
                    'Bảo lưu': baoLuu, 'Chưa xác nhận LL': chuaXN,
                    'Đã đóng HP': paid, 'Chưa đóng HP': unpaid,
                    'Vắng KP (buổi)': nghiKP,
                });
            });

            // Hàng tổng
            if (sheet1.length) {
                const total = {};
                const numCols = ['Sĩ số','HT Xuất sắc','HT Tốt','Hoàn thành','Chưa hoàn thành',
                    'Chưa đánh giá','Lên lớp','Ở lại','Bảo lưu','Chưa xác nhận LL',
                    'Đã đóng HP','Chưa đóng HP','Vắng KP (buổi)'];
                sheet1.forEach(r => numCols.forEach(k => total[k] = (total[k]||0) + (r[k]||0)));
                sheet1.push({ 'Lớp': 'TỔNG TRƯỜNG', 'Khối': '', ...total });
            }
            addSheet(sheet1, `TongKet_${sy.replace('-','_')}`);
        }

        // ════════════════════════════════════════════════════════════════════
        // SHEET 2: DANH SÁCH HỌC SINH
        // ════════════════════════════════════════════════════════════════════
        setProgress('Sheet 2: Danh sách học sinh...', 76);
        {
            const sheet2 = allStudents.map((s, i) => ({
                'STT': i+1,
                'Mã HS': s.code || s.id,
                'Họ và tên': s.name || '',
                'Lớp': s.classRoom || s.class || '',
                'Khối': gradeOf(s.classRoom || s.class),
                'Giới tính': s.gender || '',
                'Ngày sinh': s.dob || '',
                'Nơi sinh': s.birthPlace || '',
                'Dân tộc': s.ethnicity || '',
                'Mã định danh': s.nationalId || '',
                'Hộ khẩu': s.permanentAddress || '',
                'Họ tên cha': s.dadName || '',
                'SĐT cha': s.dadPhone || '',
                'Nghề nghiệp cha': s.dadJob || '',
                'Họ tên mẹ': s.momName || '',
                'SĐT mẹ': s.momPhone || '',
                'Nghề nghiệp mẹ': s.momJob || '',
                'SĐT khẩn cấp': s.sosPhone || '',
                'Trạng thái': s.status === 'active' ? 'Đang học' : s.status === 'graduated' ? 'Đã TN' : (s.status || ''),
                'Ngày nhập học': s.enrollDate || '',
                'Đóng HP': (psData[s.id]?.isPaid || psData[s.code]?.isPaid) ? 'Đã đóng' : 'Chưa đóng',
                'Lên lớp': promoLabel(s.id),
            }));
            addSheet(sheet2, 'DanhSachHS');
        }

        // ════════════════════════════════════════════════════════════════════
        // SHEET 3 & 4: ĐIỂM CUỐI HK1 + HK2
        // ════════════════════════════════════════════════════════════════════
        setProgress('Sheet 3-4: Điểm cuối kỳ...', 80);
        for (const hkKey of ['hk1', 'hk2']) {
            const hkLabel = hkKey === 'hk1' ? 'HK1' : 'HK2';
            const sheetData = allStudents.map((s, i) => {
                const hb   = hocbaMap[s.id] || {};
                const hkD  = hb[hkKey] || {};
                const g    = gradeOf(s.classRoom || s.class);
                const row  = {
                    'STT': i+1, 'Mã HS': s.code||s.id,
                    'Họ và tên': s.name, 'Lớp': s.classRoom||s.class,
                };
                // Môn có điểm
                diemSubs(g).forEach(sub => {
                    const sc = hkD[sub.name] || {};
                    row[`${sub.name} - Mức`]  = sc.mucDat  || '';
                    row[`${sub.name} - Điểm`] = sc.diem    || '';
                    row[`${sub.name} - NX`]   = sc.nhanXet || '';
                });
                // Môn nhận xét
                nxSubs(g).forEach(sub => {
                    const sc = hkD[sub.name] || {};
                    row[`${sub.name} - Mức`] = sc.mucDat  || '';
                    row[`${sub.name} - NX`]  = sc.nhanXet || '';
                });
                // Thể chất
                const body = hkD.__body || {};
                row['Chiều cao'] = body.chieuCao    || hb.chieuCao    || '';
                row['Cân nặng']  = body.canNang     || hb.canNang     || '';
                row['Nghỉ CP']   = body.nghiCoPhep  || hb.nghiCoPhep  || 0;
                row['Nghỉ KP']   = body.nghiKhongPhep || hb.nghiKhongPhep || 0;
                // Kết quả
                const kq = hb.ketQua || hkD.__kq || {};
                row['Đánh giá KQ GD'] = kq.danhGia    || '';
                row['Khen thưởng']    = kq.khenThuong || khenThuongTheoDanhGia(kq.danhGia);
                return row;
            });
            addSheet(sheetData, `Diem_Cuoi${hkLabel}`);
        }

        // ════════════════════════════════════════════════════════════════════
        // SHEET 5 & 6: GIỮA HK1 + HK2
        // Khối 3-5: chỉ Tiếng Việt, Toán, Ngoại ngữ 1/Tiếng Anh có Điểm KTĐK
        // ════════════════════════════════════════════════════════════════════
        setProgress('Sheet 5-6: Đánh giá giữa kỳ...', 84);
        for (const ghkKey of ['ghk1', 'ghk2']) {
            const ghkLabel    = ghkKey === 'ghk1' ? 'GiuaHK1' : 'GiuaHK2';
            const sheetData   = allStudents.map((s, i) => {
                const hb          = hocbaMap[s.id] || {};
                const ghkD        = hb[ghkKey] || {};
                const g           = gradeOf(s.classRoom || s.class);
                const hasGHKScore = getSubs(g).some(sub => ghkHasNumericScore(g, sub.name));
                const row         = {
                    'STT': i+1, 'Mã HS': s.code||s.id,
                    'Họ và tên': s.name, 'Lớp': s.classRoom||s.class, 'Khối': g,
                };
                getSubs(g).forEach(sub => {
                    const sc = ghkD[sub.name] || {};
                    row[`${sub.name} - Mức`] = sc.mucDat || '';
                    if (hasGHKScore && ghkHasNumericScore(g, sub.name))
                        row[`${sub.name} - Điểm GK`] = sc.diem || '';
                    row[`${sub.name} - NX`] = sc.nhanXet || '';
                });
                pcs.forEach(pc => {
                    row[`PC ${pc} - Mức`] = ghkD.__pc?.[pc]?.mucDat  || '';
                    row[`PC ${pc} - NX`]  = ghkD.__pc?.[pc]?.nhanXet || '';
                });
                return row;
            });
            addSheet(sheetData, `DanhGia_${ghkLabel}`);
        }

        // ════════════════════════════════════════════════════════════════════
        // SHEET 7: PHẨM CHẤT & NĂNG LỰC (HK1 + HK2)
        // ════════════════════════════════════════════════════════════════════
        setProgress('Sheet 7: Phẩm chất & Năng lực...', 87);
        {
            const sheet7 = allStudents.map((s, i) => {
                const hb  = hocbaMap[s.id] || {};
                const row = {
                    'STT': i+1, 'Mã HS': s.code||s.id,
                    'Họ và tên': s.name, 'Lớp': s.classRoom||s.class,
                };
                ['hk1','hk2'].forEach(hkK => {
                    const hkD = hb[hkK] || {};
                    const lbl = hkK.toUpperCase();
                    // Phẩm chất
                    pcs.forEach(pc => {
                        const d = hkD.__pc?.[pc] || {};
                        row[`${lbl} PC ${pc} - Mức`] = d.mucDat  || '';
                        row[`${lbl} PC ${pc} - NX`]  = d.nhanXet || '';
                    });
                    // Năng lực chung
                    nlcs.forEach(nl => {
                        const d = hkD.__nlc?.[nl] || {};
                        row[`${lbl} NL ${nl} - Mức`] = d.mucDat  || '';
                        row[`${lbl} NL ${nl} - NX`]  = d.nhanXet || '';
                    });
                    // Năng lực đặc thù
                    nlds.forEach(nl => {
                        const d = hkD.__nld?.[nl] || {};
                        row[`${lbl} NLĐ ${nl} - Mức`] = d.mucDat  || '';
                    });
                });
                return row;
            });
            addSheet(sheet7, 'PhamChat_NangLuc');
        }

        // ════════════════════════════════════════════════════════════════════
        // SHEET 8: ĐIỂM DANH — tổng hợp vắng theo HS
        // ════════════════════════════════════════════════════════════════════
        setProgress('Sheet 8: Điểm danh...', 90);
        {
            // attendData = { className: { date: { studentId: { status } } } }
            // (đã load đúng node attendance/{year}/ nên không có layer năm)
            const absentMap = {}; // studentId → { coPhep, khongPhep, totalDays }
            Object.entries(attendData).forEach(([cls, dates]) => {
                if (typeof dates !== 'object') return;
                Object.entries(dates).forEach(([date, records]) => {
                    if (typeof records !== 'object') return;
                    Object.entries(records).forEach(([sid, rec]) => {
                        if (!absentMap[sid]) absentMap[sid] = { cp:0, kp:0, total:0 };
                        if (rec.status === 'p' || rec.status === 'cp') absentMap[sid].cp++;
                        else if (rec.status === 'kp') absentMap[sid].kp++;
                        absentMap[sid].total++;
                    });
                });
            });

            const sheet8 = allStudents.map((s, i) => {
                const ab = absentMap[s.id] || absentMap[s.code] || { cp:0, kp:0, total:0 };
                const hb = hocbaMap[s.id] || hocbaMap[s.code] || {};
                // Merge với số ngày nghỉ từ học bạ (nếu có)
                const hk1Body = hb.hk1?.__body || {};
                const hk2Body = hb.hk2?.__body || {};
                return {
                    'STT': i+1, 'Mã HS': s.code||s.id,
                    'Họ và tên': s.name, 'Lớp': s.classRoom||s.class,
                    'Vắng có phép (điểm danh)':   ab.cp,
                    'Vắng không phép (điểm danh)': ab.kp,
                    'Nghỉ CP HK1 (học bạ)':  hk1Body.nghiCoPhep    || hb.nghiCoPhep    || '',
                    'Nghỉ KP HK1 (học bạ)':  hk1Body.nghiKhongPhep || hb.nghiKhongPhep || '',
                    'Nghỉ CP HK2 (học bạ)':  hk2Body.nghiCoPhep    || '',
                    'Nghỉ KP HK2 (học bạ)':  hk2Body.nghiKhongPhep || '',
                };
            });
            addSheet(sheet8, 'DiemDanh');
        }

        // ════════════════════════════════════════════════════════════════════
        // SHEET 9: TÀI CHÍNH
        // ════════════════════════════════════════════════════════════════════
        setProgress('Sheet 9: Tài chính...', 93);
        {
            const CAT_MAP = {
                tuition:'Học phí', exam_fee:'Phí thi', uniform:'Đồng phục',
                meal:'Tiền ăn', other_income:'Thu khác',
                salary:'Lương', utility:'Điện nước', maintenance:'Bảo trì',
                supplies:'Văn phòng phẩm', other_expense:'Chi khác',
            };
            const sheet9 = Object.values(financeData)
                .sort((a,b) => (a.date||'').localeCompare(b.date||''))
                .map((tx, i) => ({
                    'STT': i+1,
                    'Ngày': tx.date || '',
                    'Loại': tx.type === 'income' ? 'Thu' : 'Chi',
                    'Danh mục': CAT_MAP[tx.category] || tx.category || '',
                    'Nội dung': tx.customIncome || tx.note || '',
                    'Số tiền (VNĐ)': tx.amount || 0,
                    'Phương thức': tx.paymentMethod === 'cash' ? 'Tiền mặt'
                                  : tx.paymentMethod === 'bank' ? 'CK ngân hàng'
                                  : tx.paymentMethod === 'card' ? 'Thẻ' : '',
                    'Mã HS': tx.studentCode || '',
                    'Tên HS': tx.studentName || '',
                    'Học kỳ': tx.semester ? `HK${tx.semester}` : '',
                }));
            // Hàng tổng
            const totalIncome  = Object.values(financeData).filter(t=>t.type==='income').reduce((s,t)=>s+(t.amount||0),0);
            const totalExpense = Object.values(financeData).filter(t=>t.type==='expense').reduce((s,t)=>s+(t.amount||0),0);
            sheet9.push({});
            sheet9.push({ 'STT':'', 'Ngày':'TỔNG', 'Loại':'Thu', 'Số tiền (VNĐ)': totalIncome });
            sheet9.push({ 'STT':'', 'Ngày':'TỔNG', 'Loại':'Chi', 'Số tiền (VNĐ)': totalExpense });
            sheet9.push({ 'STT':'', 'Ngày':'CÒN LẠI', 'Loại':'', 'Số tiền (VNĐ)': totalIncome - totalExpense });
            addSheet(sheet9, 'TaiChinh');
        }

        // ════════════════════════════════════════════════════════════════════
        // SHEET 10: HỌC PHÍ TỪNG HỌC SINH
        // ════════════════════════════════════════════════════════════════════
        setProgress('Sheet 10: Trạng thái học phí...', 95);
        {
            const sheet10 = allStudents.map((s, i) => {
                const ps = psData[s.id] || psData[s.code] || {};
                return {
                    'STT': i+1, 'Mã HS': s.code||s.id,
                    'Họ và tên': s.name, 'Lớp': s.classRoom||s.class,
                    'Trạng thái HP': ps.isPaid ? 'Đã đóng' : 'Chưa đóng',
                    'Số tiền đã đóng': ps.amount || '',
                    'Ngày đóng': ps.paidAt ? new Date(ps.paidAt).toLocaleDateString('vi-VN') : '',
                    'Ghi chú': ps.note || '',
                };
            });
            addSheet(sheet10, 'HocPhi_HS');
        }

        // ════════════════════════════════════════════════════════════════════
        // SHEET 11: KẾT QUẢ LÊN LỚP
        // ════════════════════════════════════════════════════════════════════
        setProgress('Sheet 11: Kết quả lên lớp...', 97);
        {
            const sheet11 = allStudents.map((s, i) => {
                const hb  = hocbaMap[s.id] || {};
                const hk2 = hb.hk2 || {};
                const kq  = hb.ketQua || hk2.__kq || {};
                const pKey = promoData[s.id]?.status || promoData[s.code]?.status || '';
                const g = gradeOf(s.classRoom||s.class);
                return {
                    'STT': i+1, 'Mã HS': s.code||s.id,
                    'Họ và tên': s.name, 'Lớp': s.classRoom||s.class, 'Khối': g,
                    'Đánh giá KQ GD': kq.danhGia    || '',
                    'Khen thưởng':    kq.khenThuong || khenThuongTheoDanhGia(kq.danhGia),
                    'Hoàn thành CT':  kq.hoanThanh  || '',
                    'Kết quả lên lớp': PROMOTION_STATUS_MAP[pKey] || 'Chưa xác nhận',
                    'Trạng thái HS': s.status === 'graduated' ? 'Đã TN' : (s.status||'active') === 'active' ? 'Đang học' : s.status,
                };
            });
            addSheet(sheet11, 'KetQua_LenLop');
        }

        // ── Xuất file ────────────────────────────────────────────────────────
        setProgress('Đang xuất file Excel...', 99);
        const today = new Date().toISOString().split('T')[0].replace(/-/g,'');
        XLSX.writeFile(wb, `Backup_ToanTruong_${sy.replace('-','_')}_${today}.xlsx`);

        Swal.fire({
            icon: 'success',
            title: '✅ Backup hoàn tất!',
            html: `
            <div style="text-align:left;font-size:0.9rem">
                <p>📁 <b>Backup_ToanTruong_${sy.replace('-','_')}_${today}.xlsx</b></p>
                <div style="margin-top:10px;background:#f0fdf4;padding:12px;border-radius:8px">
                    <p style="font-weight:600;margin-bottom:6px;color:#166534">File gồm ${wb.SheetNames.length} sheets:</p>
                    ${wb.SheetNames.map(n => `<p style="color:#15803d;font-size:0.83rem">✓ ${n}</p>`).join('')}
                </div>
                <p style="margin-top:10px;font-size:0.8rem;color:#64748b">
                    💡 Lưu file ở nơi an toàn. Backup định kỳ cuối mỗi học kỳ.
                </p>
            </div>`,
            confirmButtonText: 'OK',
            confirmButtonColor: '#7c3aed',
            width: 500,
        });

    } catch(err) {
        Swal.close();
        Swal.fire('Lỗi backup', err.message, 'error');
        console.error('Backup error:', err);
    }
};
