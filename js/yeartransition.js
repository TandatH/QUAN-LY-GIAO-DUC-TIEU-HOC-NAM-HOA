console.info('[Smart School V5.32.9] yeartransition legacy hocba backfill loaded');
// ══════════════════════════════════════════════════════════════════════════════
// yeartransition.js — Chuyển năm học nguyên khối V5.3
// - Dữ liệu luôn được tải lại ngay trước khi ghi
// - Có khóa giao dịch để ngăn hai Admin chuyển cùng lúc
// - Di trú dữ liệu cũ sang cấu trúc theo năm học
// - Hỗ trợ xếp lớp riêng từng học sinh
// - Sao lưu, kiểm tra dấu vết sau chuyển và khôi phục có điều kiện
// ══════════════════════════════════════════════════════════════════════════════

import { runTransaction } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { isActiveStudent } from "./studentstatus.js?v=5.26.1";
import { schoolYearKey, paymentStatusPath, paymentStatusClassPath, classKey, timetablePath } from "./yearscope.js";

const PROMOTION_LABELS = {
    len_lop: 'Lên lớp',
    o_lai: 'Ở lại lớp',
    bao_luu: 'Bảo lưu',
    nghi_hoc: 'Nghỉ học',
};
const SCORE_MODES = ['hk1', 'ghk1', 'hk2', 'ghk2'];
const MAX_ATOMIC_PAYLOAD_BYTES = 14 * 1024 * 1024;
const DEFAULT_ROLLBACK_HOURS = 24;
const MAX_ROLLBACK_HOURS = 168;
const LOCK_TTL_MS = 10 * 60 * 1000;

function syKey(value) { return schoolYearKey(value); }

function firebaseSafeKey(value) {
    const key = String(value ?? '').trim()
        .replace(/[.#$/\[\]]/g, '_')
        .replace(/_+/g, '_');
    return key || '_';
}

function firebaseSafeObjectKeys(value) {
    if (Array.isArray(value)) return value.map(firebaseSafeObjectKeys);
    if (!value || typeof value !== 'object') return value;
    const result = {};
    Object.entries(value).forEach(([key, child]) => {
        result[firebaseSafeKey(key)] = firebaseSafeObjectKeys(child);
    });
    return result;
}

function firebaseSafeTransitionPlan(plan) {
    // V5.32.7: plan.promoteClassMap/repeatClassMap dùng tên lớp làm key, ví dụ "1/1".
    // Firebase RTDB không cho key chứa "/", ".", "#", "$", "[", "]".
    // Dữ liệu dùng để xử lý vẫn giữ nguyên trong biến plan; chỉ bản lưu vào yearTransitions được đổi key an toàn.
    return firebaseSafeObjectKeys(plan || {});
}

function serverNow() { return typeof window.serverNow === 'function' ? window.serverNow() : Date.now(); }
function nextSchoolYear(sy) {
    const m = String(sy || '').match(/^(\d{4})-(\d{4})$/);
    return m ? `${Number(m[1]) + 1}-${Number(m[2]) + 1}` : '';
}
function gradeOfClass(cls) {
    const m = String(cls || '').match(/^(\d+)/);
    return m ? Number(m[1]) : 0;
}
function normalizeClassName(value) {
    return String(value || '').trim().toUpperCase().replace(/\s+/g, '');
}
function defaultPromotionClass(cls) {
    const grade = gradeOfClass(cls);
    return !grade || grade >= 5 ? '' : String(cls).replace(/^(\d+)/, String(grade + 1));
}
function htmlEscape(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
function deepClone(value) { return value == null ? value : JSON.parse(JSON.stringify(value)); }
function stableStringify(value) {
    if (value === null || typeof value !== 'object') return JSON.stringify(value);
    if (Array.isArray(value)) return '[' + value.map(stableStringify).join(',') + ']';
    return '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + stableStringify(value[k])).join(',') + '}';
}
function hasOwnData(value) { return !!value && typeof value === 'object' && Object.keys(value).length > 0; }
function currentUserEmail() { return window.currentUser?.email || ''; }
function currentUserUid() { return window.currentUser?.uid || ''; }
function sourceClassOf(student) { return student?.classRoom || student?.class || ''; }
function readStudentId(key, raw) { return raw?.id || key; }
function nowIsoDate(ms) { return new Date(ms).toISOString().slice(0, 10); }
function isYearKey(key) { return /^\d{4}_\d{4}$/.test(String(key || '')); }
function valueOrNull(snapshot) { return snapshot.exists() ? snapshot.val() : null; }
async function readPath(path) {
    const snap = await window.get(window.ref(window.db, path));
    return valueOrNull(snap);
}
function adminOnly() {
    if (window.userRole === 'admin') return true;
    Swal.fire('Từ chối', 'Chỉ Admin được chuyển hoặc khôi phục năm học.', 'error');
    return false;
}
function activeEntries(studentsRaw) {
    return Object.entries(studentsRaw || {})
        .filter(([, student]) => isActiveStudent(student))
        .map(([key, raw]) => ({ key, ...raw, id: readStudentId(key, raw) }));
}
function legacyEntries(rootValue) {
    return Object.fromEntries(Object.entries(rootValue || {}).filter(([key]) => !isYearKey(key)));
}
function disabledScoreWindows(now = serverNow()) {
    return Object.fromEntries(SCORE_MODES.map(mode => [mode, {
        enabled: false, startAt: 0, endAt: 0,
        updatedAt: now, updatedBy: currentUserEmail(), updatedByUid: currentUserUid(),
    }]));
}
function educationResult(yearData) {
    return yearData?.ketQua?.danhGia || yearData?.hk2?.__kq?.danhGia || '';
}
function studentPromotionRecord(promotionData, student) {
    return promotionData?.[student.id] || promotionData?.[student.key] || promotionData?.[student.code] || null;
}
function appendTransferHistory(student, entry) {
    const history = Array.isArray(student?.transferHistory) ? deepClone(student.transferHistory) : [];
    history.push(entry);
    return history;
}
function selectedClassForStudent(student, status, plan) {
    const override = normalizeClassName(plan.studentClassOverrides?.[student.key]);
    if (override) return override;
    const cls = sourceClassOf(student);
    return status === 'o_lai'
        ? normalizeClassName(plan.repeatClassMap?.[cls] || cls)
        : normalizeClassName(plan.promoteClassMap?.[cls]);
}

function buildStudentLookup(studentsRaw) {
    const lookup = new Map();
    Object.entries(studentsRaw || {}).forEach(([studentKey, student]) => {
        [studentKey, student?.id, student?.code].filter(Boolean)
            .forEach(value => lookup.set(String(value), { studentKey, student }));
    });
    return lookup;
}

function normalizePaymentRecords(paymentData, studentsRaw, schoolYear, now) {
    const result = {};
    const lookup = buildStudentLookup(studentsRaw);
    Object.entries(paymentData || {}).forEach(([studentCode, oldRecord]) => {
        if (!oldRecord || typeof oldRecord !== 'object') return;
        const found = lookup.get(String(studentCode)) || lookup.get(String(oldRecord.studentKey || ''));
        const className = found?.student?.classRoom || found?.student?.class || oldRecord.className || '';
        const cKey = classKey(className);
        result[studentCode] = {
            ...oldRecord,
            isPaid: oldRecord.isPaid === true,
            studentCode: String(studentCode),
            studentKey: found?.studentKey || String(oldRecord.studentKey || ''),
            className,
            classKey: cKey,
            schoolYear,
            updatedAt: Number(oldRecord.updatedAt || now),
            updatedBy: oldRecord.updatedBy || currentUserEmail(),
            updatedByUid: oldRecord.updatedByUid || currentUserUid(),
        };
    });
    return result;
}

function buildPaymentClassIndex(paymentData) {
    const result = {};
    Object.entries(paymentData || {}).forEach(([studentCode, record]) => {
        const cKey = record?.classKey || classKey(record?.className || '');
        if (!cKey) return;
        result[cKey] ||= {};
        result[cKey][studentCode] = deepClone(record);
    });
    return result;
}

async function loadVisibleLegacyPromotion() {
    const role = window.userRole || '';
    if (role !== 'teacher') return {};

    const assignedClass = String(window.teacherClass || '').trim();
    const assignedClassKey = String(window.teacherClassKey || '').trim();
    const students = Object.entries(window.localData?.students || {})
        .filter(([, student]) => {
            if (!isActiveStudent(student)) return false;
            const cls = String(student?.classRoom || student?.class || '').trim();
            const clsKey = classKey(cls);
            return (assignedClass && cls === assignedClass)
                || (assignedClassKey && clsKey === assignedClassKey);
        });

    const result = {};
    const batchSize = 8;

    for (let i = 0; i < students.length; i += batchSize) {
        await Promise.all(students.slice(i, i + batchSize).map(async ([studentKey, student]) => {
            const aliases = [...new Set(
                [studentKey, student?.id, student?.code]
                    .filter(Boolean)
                    .map(String)
            )];

            let record = null;
            for (const alias of aliases) {
                try {
                    const value = await readPath(`promotionStatus/${alias}`);
                    if (value && typeof value === 'object' && typeof value.status === 'string') {
                        record = value;
                        break;
                    }
                } catch {
                    // Bỏ qua alias không có quyền hoặc không tồn tại.
                }
            }

            if (record) {
                aliases.forEach(alias => { result[alias] = record; });
            }
        }));
    }
    return result;
}

async function loadVisibleYearPromotion(yearKey) {
    const students = Object.entries(window.localData?.students || {});
    const result = {};
    const batchSize = 8;

    for (let i = 0; i < students.length; i += batchSize) {
        await Promise.all(students.slice(i, i + batchSize).map(async ([studentKey, student]) => {
            const aliases = [...new Set([studentKey, student?.id, student?.code].filter(Boolean).map(String))];
            let record = null;
            for (const alias of aliases) {
                try {
                    const value = await readPath(`promotionStatus/${yearKey}/${alias}`);
                    if (value && typeof value === 'object' && typeof value.status === 'string') {
                        record = value;
                        break;
                    }
                } catch {
                    // Bỏ qua alias không tồn tại hoặc không thuộc phạm vi giáo viên.
                }
            }
            if (record) aliases.forEach(alias => { result[alias] = record; });
        }));
    }
    return result;
}

async function loadPromotionBundle(schoolYear) {
    const yearKey = syKey(schoolYear);
    const role = window.userRole || '';

    if (role !== 'admin' && role !== 'teacher') {
        return { data: {}, source: 'restricted', legacyKeys: [] };
    }

    const settings = await readPath('settings');

    // GVCN chỉ đọc từng học sinh đã được Rules xác nhận thuộc lớp mình.
    // Không đọc promotionStatus/{yearKey} của toàn trường.
    if (role === 'teacher') {
        const scoped = await loadVisibleYearPromotion(yearKey);
        if (hasOwnData(scoped)) {
            return { data: scoped, source: 'scoped-visible', legacyKeys: [] };
        }
        if (settings?.promotionStatusMigrated === true) {
            return { data: {}, source: 'empty', legacyKeys: [] };
        }
        const legacy = await loadVisibleLegacyPromotion();
        return {
            data: legacy,
            source: hasOwnData(legacy) ? 'legacy-visible' : 'empty',
            legacyKeys: [],
        };
    }

    const scoped = await readPath(`promotionStatus/${yearKey}`);
    if (hasOwnData(scoped)) {
        return { data: scoped, source: 'scoped', legacyKeys: [] };
    }
    if (settings?.promotionStatusMigrated === true) {
        return { data: {}, source: 'empty', legacyKeys: [] };
    }

    // Chỉ Admin cần đọc node cha để phục vụ di trú dữ liệu cũ khi chuyển năm.
    const root = await readPath('promotionStatus');
    const all = root || {};
    const legacy = {};
    const keys = [];
    Object.entries(all).forEach(([key, value]) => {
        if (!isYearKey(key) && value && typeof value === 'object' && typeof value.status === 'string') {
            legacy[key] = value;
            keys.push(key);
        }
    });
    return { data: legacy, source: keys.length ? 'legacy' : 'empty', legacyKeys: keys };
}

export async function loadPromotionStatusForYear(schoolYear) {
    return (await loadPromotionBundle(schoolYear)).data;
}

async function loadAcademicResults(students, yearKey) {
    const result = {};
    const batchSize = 8;
    for (let i = 0; i < students.length; i += batchSize) {
        await Promise.all(students.slice(i, i + batchSize).map(async student => {
            const aliases = studentHocBaAliases(student);
            let merged = {};
            let legacy = {};
            for (const alias of aliases) {
                try {
                    const root = await readPath(`hocba/${alias}`) || {};
                    const yearData = root?.[yearKey] || {};
                    if (yearData && typeof yearData === 'object') merged = { ...merged, ...yearData };

                    const legacyCandidate = transitionLegacyAcademicCandidate(root);
                    if (transitionHasAcademicContent(legacyCandidate)) {
                        legacy = { ...legacy, ...legacyCandidate };
                    }
                } catch { /* bỏ qua alias không đọc được */ }
            }
            if (!transitionHasAcademicContent(merged) && transitionHasAcademicContent(legacy)) {
                merged = { ...merged, ...legacy, backfilledFromLegacy: true };
            }
            aliases.forEach(alias => { result[alias] = merged; });
            result[student.id] = merged;
            result[student.key] = merged;
        }));
    }
    return result;
}

async function loadFreshContext() {
    const [studentsRaw, usersRaw, settingsRaw] = await Promise.all([
        readPath('students'), readPath('users'), readPath('settings'),
    ]);
    const settings = settingsRaw || {};
    const currentYear = settings.schoolYear || window._currentSchoolYear || '';
    const targetYear = nextSchoolYear(currentYear);
    const students = activeEntries(studentsRaw || {});
    const classes = [...new Set(students.map(sourceClassOf).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b, 'vi', { numeric: true }));
    const teachers = Object.entries(usersRaw || {})
        .filter(([, user]) => user?.role === 'teacher')
        .map(([uid, user]) => ({ uid, ...user }))
        .sort((a, b) => String(a.email || '').localeCompare(String(b.email || ''), 'vi'));
    return { currentYear, targetYear, students, studentsRaw: studentsRaw || {}, users: usersRaw || {}, settings, classes, teachers };
}

async function loadLatestTransition() {
    const id = await readPath('settings/lastYearTransitionId');
    if (!id) return null;
    const data = await readPath(`yearTransitions/${id}`);
    return data ? { id, ...data } : null;
}

function latestTransitionCard(transition) {
    if (!transition) return '<div style="color:#94a3b8;font-size:.82rem">Chưa có lần chuyển năm học nào.</div>';
    const label = transition.status === 'completed' ? 'Đã hoàn tất'
        : transition.status === 'rolled_back' ? 'Đã khôi phục' : transition.status || 'Không rõ';
    return `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px 12px;font-size:.8rem">
        <div><strong>${htmlEscape(transition.sourceYear)}</strong> → <strong>${htmlEscape(transition.targetYear)}</strong></div>
        <div style="font-weight:700;margin-top:3px;color:${transition.status === 'completed' ? '#16a34a' : '#64748b'}">${label}</div>
        <div style="color:#64748b;margin-top:3px">${new Date(transition.completedAt || transition.createdAt || 0).toLocaleString('vi-VN')} — ${htmlEscape(transition.createdBy || '')}</div>
    </div>`;
}

function buildTargetClasses(classes) {
    const set = new Set();
    classes.forEach(cls => {
        set.add(normalizeClassName(cls));
        const promoted = defaultPromotionClass(cls);
        if (promoted) set.add(normalizeClassName(promoted));
    });
    return [...set].filter(Boolean).sort((a, b) => a.localeCompare(b, 'vi', { numeric: true }));
}

function planFromDom(context) {
    const promoteClassMap = {};
    const repeatClassMap = {};
    context.classes.forEach(cls => {
        const safe = encodeURIComponent(cls);
        promoteClassMap[cls] = normalizeClassName(document.getElementById(`yt-promote-${safe}`)?.value);
        repeatClassMap[cls] = normalizeClassName(document.getElementById(`yt-repeat-${safe}`)?.value || cls);
    });
    const teacherAssignments = {};
    context.teachers.forEach(teacher => {
        teacherAssignments[teacher.uid] = normalizeClassName(document.getElementById(`yt-teacher-${teacher.uid}`)?.value);
    });
    const studentClassOverrides = {};
    const statusReasons = {};
    context.students.forEach(student => {
        const value = normalizeClassName(document.getElementById(`yt-student-${student.key}`)?.value);
        if (value) studentClassOverrides[student.key] = value;
        const reason = String(document.getElementById(`yt-reason-${student.key}`)?.value || '').trim();
        if (reason) statusReasons[student.key] = reason;
    });
    return { promoteClassMap, repeatClassMap, teacherAssignments, studentClassOverrides, statusReasons };
}

export async function renderYearTransitionPanel(containerId = 'year-transition-panel') {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (window.userRole !== 'admin') {
        container.innerHTML = '<div class="card">Chỉ Admin được sử dụng chức năng chuyển năm học.</div>';
        return;
    }
    container.innerHTML = '<div style="text-align:center;padding:18px;color:#64748b"><i class="fas fa-spinner fa-spin"></i> Đang chuẩn bị dữ liệu...</div>';
    try {
        const [context, latest] = await Promise.all([loadFreshContext(), loadLatestTransition()]);
        const promotion = await loadPromotionStatusForYear(context.currentYear);
        context.promotionData = promotion;
        const targetClasses = buildTargetClasses(context.classes);

        container.innerHTML = `
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:12px;margin-bottom:14px;font-size:.82rem;color:#166534">
            <strong>V5:</strong> tải lại dữ liệu → khóa chuyển năm → kiểm tra → di trú dữ liệu cũ → cập nhật nguyên tử → lưu dấu vết phục vụ khôi phục.
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px">
            <div style="background:#eff6ff;border-radius:8px;padding:12px"><small>NĂM HIỆN TẠI</small><div style="font-size:1.25rem;font-weight:800;color:#1e3a8a">${htmlEscape(context.currentYear)}</div></div>
            <div style="background:#dcfce7;border-radius:8px;padding:12px"><small>NĂM ĐÍCH</small><div style="font-size:1.25rem;font-weight:800;color:#166534">${htmlEscape(context.targetYear)}</div></div>
        </div>

        <div style="font-weight:700;margin:12px 0 7px">1. Ánh xạ lớp mặc định</div>
        <div style="overflow-x:auto;border:1px solid #e2e8f0;border-radius:8px"><table style="width:100%;min-width:620px;border-collapse:collapse;font-size:.82rem">
            <thead><tr style="background:#f8fafc"><th style="padding:8px;border:1px solid #e2e8f0">Lớp hiện tại</th><th style="padding:8px;border:1px solid #e2e8f0">Lên lớp</th><th style="padding:8px;border:1px solid #e2e8f0">Ở lại</th></tr></thead>
            <tbody>${context.classes.map(cls => {
                const grade = gradeOfClass(cls); const safe = encodeURIComponent(cls);
                return `<tr><td style="padding:8px;border:1px solid #e2e8f0;font-weight:700">${htmlEscape(cls)}</td>
                    <td style="padding:8px;border:1px solid #e2e8f0">${grade >= 5 ? '<b style="color:#7c3aed">Hoàn thành tiểu học</b>' : `<input id="yt-promote-${safe}" class="form-control" value="${htmlEscape(defaultPromotionClass(cls))}">`}</td>
                    <td style="padding:8px;border:1px solid #e2e8f0"><input id="yt-repeat-${safe}" class="form-control" value="${htmlEscape(cls)}"></td></tr>`;
            }).join('')}</tbody></table></div>

        <details style="margin-top:12px;border:1px solid #dbeafe;border-radius:8px;padding:10px">
            <summary style="cursor:pointer;font-weight:700;color:#1d4ed8">Điều chỉnh lớp riêng từng học sinh</summary>
            <div style="font-size:.75rem;color:#64748b;margin:7px 0">Để trống để dùng ánh xạ mặc định. Chỉ học sinh “Lên lớp” hoặc “Ở lại” mới được áp dụng.</div>
            <div style="max-height:260px;overflow:auto">${context.students.map(student => {
                const record = studentPromotionRecord(promotion, student); const status = record?.status || '';
                if (!['len_lop','o_lai'].includes(status)) return '';
                const grade = gradeOfClass(sourceClassOf(student));
                if (status === 'len_lop' && grade >= 5) return '';
                const suggested = status === 'o_lai' ? sourceClassOf(student) : defaultPromotionClass(sourceClassOf(student));
                return `<div style="display:grid;grid-template-columns:1.6fr .7fr 1fr;gap:8px;align-items:center;padding:7px;border-bottom:1px solid #f1f5f9;font-size:.8rem">
                    <div><b>${htmlEscape(student.name || student.code || student.id)}</b><div style="color:#94a3b8">${htmlEscape(sourceClassOf(student))} · ${htmlEscape(PROMOTION_LABELS[status])}</div></div>
                    <div>${htmlEscape(student.code || student.id)}</div>
                    <input id="yt-student-${student.key}" class="form-control" value="" placeholder="Mặc định: ${htmlEscape(suggested)}" list="yt-target-classes">
                </div>`;
            }).join('') || '<div style="color:#94a3b8">Chưa có học sinh đủ điều kiện điều chỉnh.</div>'}</div>
        </details>

        <details style="margin-top:12px;border:1px solid #fed7aa;border-radius:8px;padding:10px">
            <summary style="cursor:pointer;font-weight:700;color:#c2410c">Lý do Bảo lưu / Nghỉ học</summary>
            <div style="font-size:.75rem;color:#64748b;margin:7px 0">Lý do là bắt buộc để hồ sơ chuyển trạng thái có căn cứ và dễ tra cứu.</div>
            <div style="max-height:220px;overflow:auto">${context.students.map(student => {
                const status = studentPromotionRecord(promotion, student)?.status || '';
                if (!['bao_luu','nghi_hoc'].includes(status)) return '';
                const existingReason = status === 'bao_luu'
                    ? (student.reserveReason || student.reservedReason || '')
                    : (student.stopReason || student.inactiveReason || '');
                return `<div style="display:grid;grid-template-columns:1fr 1.5fr;gap:8px;align-items:center;padding:7px;border-bottom:1px solid #fff7ed;font-size:.8rem">
                    <div><b>${htmlEscape(student.name || student.code || student.id)}</b><div style="color:#94a3b8">${htmlEscape(PROMOTION_LABELS[status])}</div></div>
                    <input id="yt-reason-${student.key}" class="form-control" value="${htmlEscape(existingReason)}" placeholder="Nhập lý do bắt buộc">
                </div>`;
            }).join('') || '<div style="color:#94a3b8">Không có học sinh Bảo lưu hoặc Nghỉ học.</div>'}</div>
        </details>

        <div style="font-weight:700;margin:14px 0 7px">2. Phân công GVCN năm mới</div>
        <div style="max-height:220px;overflow:auto;border:1px solid #e2e8f0;border-radius:8px">${context.teachers.map(t => {
            const suggested = t.assignedClass && gradeOfClass(t.assignedClass) < 5 ? defaultPromotionClass(t.assignedClass) : '';
            return `<div style="display:grid;grid-template-columns:1.5fr 1fr;gap:8px;align-items:center;padding:8px;border-bottom:1px solid #f1f5f9;font-size:.8rem">
                <div><b>${htmlEscape(t.displayName || t.name || t.email || t.uid)}</b><div style="color:#94a3b8">Hiện tại: ${htmlEscape(t.assignedClass || 'Chưa phân công')}</div></div>
                <input id="yt-teacher-${t.uid}" class="form-control" value="${htmlEscape(suggested)}" list="yt-target-classes" placeholder="Để trống">
            </div>`;
        }).join('') || '<div style="padding:12px;color:#94a3b8">Chưa có GVCN.</div>'}</div>
        <datalist id="yt-target-classes">${targetClasses.map(c => `<option value="${htmlEscape(c)}"></option>`).join('')}</datalist>

        <div style="background:#fff7ed;border-left:4px solid #f59e0b;border-radius:6px;padding:9px 11px;font-size:.76rem;color:#92400e;margin-top:12px">
            Trạng thái đóng tiền và thời khóa biểu được lưu theo năm học; V5 không xóa lịch sử năm cũ. Giao dịch tài chính cũ chưa có trường năm học sẽ được gắn vào năm nguồn.
        </div>
        <div id="yt-preflight-result" style="margin-top:14px"></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">
            <button class="btn btn-primary" onclick="runYearTransitionPreflight()"><i class="fas fa-clipboard-check"></i> Kiểm tra điều kiện</button>
            <button class="btn btn-success" id="yt-execute-btn" onclick="executeYearTransitionV5()" disabled><i class="fas fa-exchange-alt"></i> Chuyển năm học V5</button>
            ${latest?.status === 'completed' ? '<button class="btn btn-danger" onclick="rollbackLastYearTransition()"><i class="fas fa-undo"></i> Khôi phục lần gần nhất</button>' : ''}
        </div>
        <div style="font-weight:700;margin:16px 0 7px">Lần chuyển gần nhất</div>${latestTransitionCard(latest)}`;
        window._yearTransitionContext = context;
    } catch (error) {
        container.innerHTML = `<div style="color:#dc2626;padding:12px">Không tải được quy trình: ${htmlEscape(error.message)}</div>`;
    }
}

async function targetDataState(context) {
    const targetKey = syKey(context.targetYear);
    const [attendance, audit, promotion, classAssignments, teacherAssignments, payment, paymentByClass, timetable, finance] = await Promise.all([
        readPath(`attendance/${targetKey}`), readPath(`scoreAudit/${targetKey}`), readPath(`promotionStatus/${targetKey}`),
        readPath(`classAssignments/${targetKey}`), readPath(`teacherAssignments/${targetKey}`),
        readPath(paymentStatusPath(context.targetYear)), readPath(`paymentStatusByClass/${targetKey}`),
        readPath(timetablePath(context.targetYear)), readPath('finance'),
    ]);
    const targetFinance = Object.values(finance || {}).filter(tx => tx?.schoolYear === context.targetYear);
    const scoreEntryWindows = context.settings?.scoreEntryWindows?.[targetKey] || null;
    return { attendance, audit, promotion, classAssignments, teacherAssignments, payment, paymentByClass, timetable, scoreEntryWindows, targetFinance };
}

async function evaluatePreflight(context, plan) {
    const sourceKey = syKey(context.currentYear);
    const errors = []; const warnings = [];
    if (!context.currentYear || !context.targetYear) errors.push('Năm học hiện tại không hợp lệ.');
    if ((context.settings.semester || 'hk1') !== 'hk2') errors.push('Hệ thống phải ở Học kỳ 2.');
    if (!context.students.length) errors.push('Không có học sinh đang hoạt động.');
    const enabled = SCORE_MODES.filter(mode => context.settings.scoreEntryWindows?.[sourceKey]?.[mode]?.enabled === true);
    if (enabled.length) errors.push(`Cần khóa các đợt nhập điểm: ${enabled.join(', ')}.`);

    const [promotionBundle, academicMap, targetState] = await Promise.all([
        loadPromotionBundle(context.currentYear), loadAcademicResults(context.students, sourceKey), targetDataState(context),
    ]);
    Object.entries(targetState).forEach(([name, value]) => {
        if (name === 'targetFinance') { if (value.length) errors.push(`Năm đích đã có ${value.length} giao dịch tài chính.`); }
        else if (hasOwnData(value)) errors.push(`Năm đích đã có dữ liệu ${name}.`);
    });
    const allStudentRefs = Object.entries(context.studentsRaw || {}).map(([key, raw]) => ({ id:readStudentId(key, raw) }));
    const targetAcademicMap = await loadAcademicResults(allStudentRefs, syKey(context.targetYear));
    const academicCount = allStudentRefs.filter(s => hasOwnData(targetAcademicMap[s.id])).length;
    if (academicCount) errors.push(`Năm đích đã có học bạ/điểm của ${academicCount} học sinh.`);

    const counts = { len_lop:0, o_lai:0, bao_luu:0, nghi_hoc:0 };
    const classSizes = {};
    context.students.forEach(student => {
        const cls = sourceClassOf(student); const grade = gradeOfClass(cls);
        if (grade < 1 || grade > 5) errors.push(`${student.name || student.id}: lớp hiện tại không thuộc khối 1–5.`);
        const status = studentPromotionRecord(promotionBundle.data, student)?.status || '';
        const result = educationResult(academicMap[student.id]);
        if (!PROMOTION_LABELS[status]) { errors.push(`${student.name || student.code || student.id}: chưa xác nhận trạng thái cuối năm.`); return; }
        counts[status]++;
        if (['len_lop','o_lai'].includes(status) && !result) errors.push(`${student.name || student.id}: chưa có đánh giá kết quả giáo dục cuối năm.`);
        if (status === 'len_lop' && result === 'Chưa hoàn thành') errors.push(`${student.name || student.id}: không thể Lên lớp khi kết quả là Chưa hoàn thành.`);
        if (status === 'o_lai' && result && result !== 'Chưa hoàn thành') warnings.push(`${student.name || student.id}: Ở lại lớp nhưng kết quả là “${result}”.`);
        const statusReason = String(plan.statusReasons?.[student.key] || '').trim();
        if (status === 'bao_luu' && !statusReason && !student.reserveReason && !student.reservedReason) errors.push(`${student.name || student.id}: Bảo lưu phải có lý do.`);
        if (status === 'nghi_hoc' && !statusReason && !student.stopReason && !student.inactiveReason) errors.push(`${student.name || student.id}: Nghỉ học phải có lý do.`);

        if (status === 'len_lop' && grade >= 5) return;
        if (['len_lop','o_lai'].includes(status)) {
            const targetClass = selectedClassForStudent(student, status, plan);
            const expectedGrade = status === 'len_lop' ? grade + 1 : grade;
            if (!targetClass) errors.push(`${student.name || student.id}: chưa có lớp đích.`);
            else if (gradeOfClass(targetClass) !== expectedGrade) errors.push(`${student.name || student.id}: lớp ${targetClass} phải thuộc khối ${expectedGrade}.`);
            else classSizes[targetClass] = (classSizes[targetClass] || 0) + 1;
        }
    });

    const assignedClasses = {};
    context.teachers.forEach(teacher => {
        const cls = plan.teacherAssignments[teacher.uid];
        if (!cls) { warnings.push(`GVCN ${teacher.email || teacher.uid} chưa được phân công lớp năm mới.`); return; }
        if (assignedClasses[cls]) errors.push(`Lớp ${cls} đang được phân công cho nhiều GVCN.`);
        assignedClasses[cls] = teacher.uid;
        if (!classSizes[cls]) warnings.push(`GVCN ${teacher.email || teacher.uid} được phân công lớp ${cls} nhưng lớp chưa có học sinh trong kế hoạch.`);
    });
    const maxClassSize = Number(context.settings.maxClassSize || 40);
    Object.entries(classSizes).forEach(([cls, count]) => {
        if (count > maxClassSize) warnings.push(`Lớp ${cls} dự kiến ${count} học sinh, vượt ngưỡng cảnh báo ${maxClassSize}.`);
        if (!assignedClasses[cls]) warnings.push(`Lớp ${cls} có ${count} học sinh nhưng chưa được phân công GVCN.`);
    });
    return { errors, warnings, counts, classSizes, promotionBundle, academicMap };
}

window.runYearTransitionPreflight = async function() {
    if (!adminOnly()) return;
    const oldContext = window._yearTransitionContext;
    if (!oldContext) return;
    const resultEl = document.getElementById('yt-preflight-result'); const button = document.getElementById('yt-execute-btn');
    if (resultEl) resultEl.innerHTML = '<div style="color:#64748b"><i class="fas fa-spinner fa-spin"></i> Đang tải lại và kiểm tra...</div>';
    if (button) button.disabled = true;
    try {
        const plan = planFromDom(oldContext);
        const fresh = await loadFreshContext();
        if (fresh.currentYear !== oldContext.currentYear) throw new Error('Năm học đã thay đổi. Hãy tải lại trang.');
        const check = await evaluatePreflight(fresh, plan);
        window._yearTransitionPreflight = { context: fresh, plan, check, checkedAt: Date.now() };
        const errors = check.errors.map(x => `<li>${htmlEscape(x)}</li>`).join('');
        const warnings = check.warnings.map(x => `<li>${htmlEscape(x)}</li>`).join('');
        resultEl.innerHTML = `<div style="border:1px solid ${check.errors.length ? '#fecaca':'#bbf7d0'};background:${check.errors.length ? '#fef2f2':'#f0fdf4'};border-radius:8px;padding:11px;font-size:.8rem">
            <b style="color:${check.errors.length ? '#b91c1c':'#166534'}">${check.errors.length ? `Không thể chuyển: ${check.errors.length} lỗi` : 'Đủ điều kiện chuyển năm học'}</b>
            ${errors ? `<ul style="margin:7px 0 0 18px;color:#991b1b">${errors}</ul>`:''}
            ${warnings ? `<div style="margin-top:9px;font-weight:700;color:#92400e">Cảnh báo (${check.warnings.length})</div><ul style="margin:5px 0 0 18px;color:#92400e">${warnings}</ul>`:''}
            <div style="margin-top:9px;color:#475569">Lên lớp: ${check.counts.len_lop} · Ở lại: ${check.counts.o_lai} · Bảo lưu: ${check.counts.bao_luu} · Nghỉ học: ${check.counts.nghi_hoc}</div>
        </div>`;
        button.disabled = check.errors.length > 0;
    } catch (error) {
        resultEl.innerHTML = `<div style="color:#dc2626">Lỗi kiểm tra: ${htmlEscape(error.message)}</div>`;
    }
};

async function acquireLock(action, sourceYear, targetYear) {
    const ref = window.ref(window.db, 'settings/yearTransitionLock');
    const now = serverNow();
    const token = `ytlock_${currentUserUid()}_${now}_${Math.random().toString(36).slice(2, 10)}`;
    const result = await runTransaction(ref, current => {
        if (current?.locked === true && Number(current.expiresAt || 0) > now) return;
        return {
            locked:true, action, sourceYear, targetYear,
            lockedAt:now, expiresAt:now + LOCK_TTL_MS,
            lockedByUid:currentUserUid(), lockedBy:currentUserEmail(), lockToken:token,
        };
    }, { applyLocally:false });
    if (!result.committed || result.snapshot.val()?.lockToken !== token) {
        throw new Error('Một phiên Admin khác đang thực hiện chuyển/khôi phục năm học.');
    }
    return { ref, token };
}
async function releaseLock(lockHandle) {
    if (!lockHandle?.ref) return;
    try {
        await runTransaction(
            lockHandle.ref,
            current => current?.lockToken === lockHandle.token ? null : current,
            { applyLocally:false }
        );
    } catch (error) { console.warn('Không giải phóng được khóa:', error); }
}
function transitionId(sourceKey, targetKey, now = serverNow()) { return `yt_${sourceKey}_to_${targetKey}_${now}`; }


function transitionHasAcademicContent(data) {
    if (!data || typeof data !== 'object') return false;
    const keys = [
        'subjects','hk1','hk2','ghk1','ghk2',
        'hk1_subjects','hk2_subjects','ghk1_subjects','ghk2_subjects',
        'phamChat','nangLucChung','nangLucDacThu',
        'hk1_phamChat','hk1_nangLucChung','hk1_nangLucDacThu',
        'hk2_phamChat','hk2_nangLucChung','hk2_nangLucDacThu',
        'ghk1_phamChat','ghk1_nangLucChung','ghk1_nangLucDacThu',
        'ghk2_phamChat','ghk2_nangLucChung','ghk2_nangLucDacThu'
    ];
    if (keys.some(k => data[k] && typeof data[k] === 'object' && Object.keys(data[k]).length > 0)) return true;
    const kq = data.ketQua || data.hk2?.__kq || {};
    return !!(kq && typeof kq === 'object' && Object.keys(kq).length > 0);
}

function transitionLegacyAcademicCandidate(raw) {
    if (!raw || typeof raw !== 'object') return {};
    const copyKeys = [
        'subjects','phamChat','nangLucChung','nangLucDacThu','ketQua',
        'hk1','hk2','ghk1','ghk2',
        'hk1_subjects','hk2_subjects','ghk1_subjects','ghk2_subjects',
        'hk1_phamChat','hk1_nangLucChung','hk1_nangLucDacThu',
        'hk2_phamChat','hk2_nangLucChung','hk2_nangLucDacThu',
        'ghk1_phamChat','ghk1_nangLucChung','ghk1_nangLucDacThu',
        'ghk2_phamChat','ghk2_nangLucChung','ghk2_nangLucDacThu',
        'chieuCao','canNang','nghiCoPhep','nghiKhongPhep'
    ];
    const out = {};
    copyKeys.forEach(k => {
        if (raw[k] !== undefined && raw[k] !== null && raw[k] !== '') out[k] = deepClone(raw[k]);
    });
    return transitionHasAcademicContent(out) ? out : {};
}

function studentHocBaAliases(student) {
    return [...new Set([student?.id, student?.key, student?.code]
        .filter(Boolean)
        .map(value => firebaseSafeKey(String(value))))];
}

function buildTransitionHocBaYearData(student, academicData, status, result, schoolYear, className, now, id, phase = 'source') {
    const cls = normalizeClassName(className || sourceClassOf(student));
    const grade = String(gradeOfClass(cls) || '');
    const existing = (academicData && typeof academicData === 'object') ? deepClone(academicData) : {};
    const currentKetQua = (existing.ketQua && typeof existing.ketQua === 'object') ? existing.ketQua : {};
    const finalKetQua = { ...currentKetQua };

    if (result && !finalKetQua.danhGia) finalKetQua.danhGia = result;

    return {
        ...existing,
        schoolYear,
        yearKey: syKey(schoolYear),
        classRoom: cls,
        class: cls,
        className: cls,
        grade,
        transitionId: id,
        transitionPhase: phase,
        promotionStatus: status || '',
        promotionLabel: PROMOTION_LABELS[status]?.label || status || '',
        ketQua: finalKetQua,
        archivedAt: phase === 'source' ? now : (existing.archivedAt || null),
        archivedBy: phase === 'source' ? currentUserEmail() : (existing.archivedBy || ''),
        startedAt: phase === 'target' ? now : (existing.startedAt || existing.recordedAt || ''),
        updatedAt: now,
        updatedBy: currentUserEmail(),
        updatedByUid: currentUserUid(),
    };
}


function buildStudentAfter(student, status, result, sourceYear, targetYear, plan, now, id) {
    const sourceKey = syKey(sourceYear); const targetKey = syKey(targetYear);
    const cls = sourceClassOf(student); const grade = gradeOfClass(cls); const updated = deepClone(student);
    delete updated.key;
    updated.schoolYearHistory = updated.schoolYearHistory || {};
    updated.schoolYearHistory[sourceKey] = { classRoom:cls, grade, promotionStatus:status, educationResult:result || '', recordedAt:now, recordedBy:currentUserEmail(), transitionId:id };
    updated.currentClassKey = classKey(cls);
    updated.currentGrade = String(grade || '');
    updated.updatedAt = now; updated.updatedBy = currentUserEmail(); updated.lastYearTransitionId = id;
    if (status === 'len_lop' && grade >= 5) {
        updated.status = 'graduated'; updated.graduatedAt = now; updated.graduatedSY = sourceYear;
        updated.completedPrimary = true; updated.completedPrimaryAt = now;
        return updated;
    }
    if (status === 'len_lop' || status === 'o_lai') {
        const newClass = selectedClassForStudent(student, status, plan);
        updated.classRoom = newClass; updated.class = newClass; updated.status = 'active';
        updated.currentClassKey = classKey(newClass); updated.currentGrade = String(gradeOfClass(newClass) || '');
        if (newClass !== cls) updated.transferHistory = appendTransferHistory(student, { fromClass:cls, toClass:newClass, date:nowIsoDate(now), reason:status === 'len_lop' ? `Lên lớp cuối năm ${sourceYear}` : `Sắp lớp học lại năm ${targetYear}`, by:currentUserEmail(), at:now, transitionId:id });
        updated.schoolYearHistory[targetKey] = { classRoom:newClass, grade:gradeOfClass(newClass), enrollmentStatus:status === 'o_lai' ? 'repeat':'active', startedAt:now, transitionId:id };
        return updated;
    }
    if (status === 'bao_luu') {
        updated.status='reserved'; updated.reservedAt=now; updated.reservedFromSY=sourceYear;
        updated.reserveReason = String(plan.statusReasons?.[student.key] || updated.reserveReason || updated.reservedReason || '').trim();
        return updated;
    }
    updated.status='inactive'; updated.stoppedAt=now; updated.stoppedSY=sourceYear;
    updated.inactiveReason = String(plan.statusReasons?.[student.key] || updated.inactiveReason || updated.stopReason || '').trim();
    return updated;
}

function studentGuard(student) {
    return { classRoom:student?.classRoom || null, class:student?.class || null, status:student?.status || 'active', updatedAt:student?.updatedAt || null, lastYearTransitionId:student?.lastYearTransitionId || null };
}
function guardsEqual(actual, expected) {
    return JSON.stringify(studentGuard(actual)) === JSON.stringify(expected);
}

window.executeYearTransitionV5 = async function() {
    if (!adminOnly()) return;
    const prepared = window._yearTransitionPreflight;
    if (!prepared || Date.now() - prepared.checkedAt > 5 * 60 * 1000) return Swal.fire('Cần kiểm tra lại', 'Hãy kiểm tra điều kiện ngay trước khi chuyển.', 'warning');
    if (prepared.check.errors.length) return Swal.fire('Không thể chuyển', 'Vẫn còn lỗi trong bước kiểm tra.', 'error');
    const confirm = await Swal.fire({
        title:'Xác nhận chuyển năm học V5?', icon:'warning', input:'text', inputPlaceholder:'CHUYEN NAM HOC',
        html:`<div style="text-align:left"><b>${htmlEscape(prepared.context.currentYear)}</b> → <b>${htmlEscape(prepared.context.targetYear)}</b><p style="margin-top:8px">Nhập <b>CHUYEN NAM HOC</b> để xác nhận.</p></div>`,
        showCancelButton:true, confirmButtonText:'Thực hiện', cancelButtonText:'Hủy',
        preConfirm:value => String(value || '').trim().toUpperCase() === 'CHUYEN NAM HOC' ? true : Swal.showValidationMessage('Nội dung xác nhận chưa đúng.'),
    });
    if (!confirm.isConfirmed) return;

    let lockRef = null;
    Swal.fire({ title:'Đang chuyển năm học...', allowOutsideClick:false, showConfirmButton:false, didOpen:()=>Swal.showLoading() });
    try {
        lockRef = await acquireLock('transition', prepared.context.currentYear, prepared.context.targetYear);
        const context = await loadFreshContext();
        if (context.currentYear !== prepared.context.currentYear || context.targetYear !== prepared.context.targetYear) throw new Error('Năm học đã thay đổi sau bước kiểm tra.');
        const plan = prepared.plan;
        const freshCheck = await evaluatePreflight(context, plan);
        if (freshCheck.errors.length) throw new Error(`Điều kiện đã thay đổi: ${freshCheck.errors[0]}`);

        const sourceKey = syKey(context.currentYear); const targetKey = syKey(context.targetYear);
        const now = serverNow(); const id = transitionId(sourceKey, targetKey, now);
        const [promotionRoot, paymentRoot, paymentClassRoot, timetableRoot, financeRoot] = await Promise.all([
            readPath('promotionStatus'), readPath('paymentStatus'), readPath('paymentStatusByClass'),
            readPath('timetables'), readPath('finance'),
        ]);
        const allLegacyPromotion = Object.fromEntries(Object.entries(promotionRoot || {}).filter(([key,value]) =>
            !isYearKey(key) && value && typeof value === 'object' && typeof value.status === 'string'
        ));
        const legacyPayment = Object.fromEntries(Object.entries(paymentRoot || {}).filter(([key,value]) => !isYearKey(key) && value && typeof value === 'object' && Object.prototype.hasOwnProperty.call(value, 'isPaid')));
        const legacyTimetable = legacyEntries(timetableRoot || {});
        const sourcePaymentExists = hasOwnData(paymentRoot?.[sourceKey]);
        const sourceTimetableExists = hasOwnData(timetableRoot?.[sourceKey]);
        const sourcePaymentBefore = sourcePaymentExists ? deepClone(paymentRoot[sourceKey]) : null;
        const sourcePaymentRaw = sourcePaymentExists ? paymentRoot[sourceKey] : legacyPayment;
        const sourcePaymentNormalized = normalizePaymentRecords(sourcePaymentRaw, context.studentsRaw, context.currentYear, now);
        const paymentScopedChanged = stableStringify(sourcePaymentBefore || {}) !== stableStringify(sourcePaymentNormalized || {});
        const sourcePaymentByClassBefore = paymentClassRoot?.[sourceKey] ?? null;
        const sourcePaymentByClassAfter = buildPaymentClassIndex(sourcePaymentNormalized);
        const paymentClassIndexChanged = stableStringify(sourcePaymentByClassBefore || {}) !== stableStringify(sourcePaymentByClassAfter || {});
        const legacyFinanceIds = Object.entries(financeRoot || {}).filter(([,tx]) => !tx?.schoolYear).map(([key]) => key);

        const beforeStudents = {}; const afterStudents = {}; const afterGuards = {};
        const sourceHocBaYears = {}; const targetHocBaYears = {};
        const classAssignments = {}; const summary = { promoted:0,repeated:0,graduated:0,reserved:0,inactive:0 };
        context.students.forEach(student => {
            const status = studentPromotionRecord(freshCheck.promotionBundle.data, student)?.status;
            const academicData = freshCheck.academicMap[student.id] || freshCheck.academicMap[student.key] || freshCheck.academicMap[student.code] || {};
            const result = educationResult(academicData);
            beforeStudents[student.key] = deepClone(context.studentsRaw[student.key]);
            const after = buildStudentAfter(student, status, result, context.currentYear, context.targetYear, plan, now, id);
            afterStudents[student.key] = after; afterGuards[student.key] = studentGuard(after);

            const sourceYearData = buildTransitionHocBaYearData(student, academicData, status, result, context.currentYear, sourceClassOf(student), now, id, 'source');
            const targetYearData = buildTransitionHocBaYearData(student, {}, status, '', context.targetYear, after.classRoom || after.class || sourceClassOf(student), now, id, 'target');
            studentHocBaAliases(student).forEach(alias => {
                sourceHocBaYears[alias] = sourceYearData;
                targetHocBaYears[alias] = targetYearData;
            });

            classAssignments[student.key] = { studentId:student.id, studentCode:student.code || '', classRoom:after.classRoom || '', status:after.status || '', transitionId:id, assignedAt:now };
            const grade=gradeOfClass(sourceClassOf(student));
            if (status==='len_lop' && grade>=5) summary.graduated++; else if(status==='len_lop') summary.promoted++; else if(status==='o_lai') summary.repeated++; else if(status==='bao_luu') summary.reserved++; else summary.inactive++;
        });

        const teacherBackup = {}; const teacherAfter = {}; const teacherAssignments = {};
        Object.entries(context.users).forEach(([uid,user]) => {
            if (user?.role !== 'teacher') return;
            teacherBackup[uid] = { assignedClass:user.assignedClass || null, assignedClassKey:user.assignedClassKey || null, lastYearTransitionId:user.lastYearTransitionId || null };
            const assignedClass = Object.prototype.hasOwnProperty.call(plan.teacherAssignments, uid)
                ? (plan.teacherAssignments[uid] || null)
                : (user.assignedClass || null);
            teacherAfter[uid] = { assignedClass, assignedClassKey:assignedClass ? normalizeClassName(assignedClass).replace(/\//g, '_') : null, lastYearTransitionId:id };
            teacherAssignments[uid] = { assignedClass:assignedClass || '', transitionId:id, assignedAt:now, email:user.email || '' };
        });

        const targetWindows = disabledScoreWindows(now);
        const backup = {
            settings:{ schoolYear:context.settings.schoolYear || context.currentYear, semester:context.settings.semester || 'hk2', lastYearTransitionId:context.settings.lastYearTransitionId || null, targetScoreEntryWindows:context.settings.scoreEntryWindows?.[targetKey] ?? null, legacyFinanceSchoolYear:context.settings.legacyFinanceSchoolYear ?? null, promotionStatusMigrated:context.settings.promotionStatusMigrated ?? null, promotionStatusMigratedAt:context.settings.promotionStatusMigratedAt ?? null, currentYearTransitionId:context.settings.currentYearTransitionId ?? null, yearTransitionState:context.settings.yearTransitionState ?? null },
            students:beforeStudents, teacherState:teacherBackup, targetPromotionStatus:promotionRoot?.[targetKey] ?? null,
            migration:{
                promotionSource:freshCheck.promotionBundle.source,
                promotionScopedCreated:freshCheck.promotionBundle.source === 'legacy',
                legacyPromotion:hasOwnData(allLegacyPromotion) ? allLegacyPromotion : null,
                legacyPromotionKeys:Object.keys(allLegacyPromotion),
                paymentMigrated:!sourcePaymentExists && hasOwnData(legacyPayment),
                legacyPayment:!sourcePaymentExists ? legacyPayment : null,
                paymentScopedChanged,
                sourcePaymentBefore,
                paymentClassIndexChanged,
                sourcePaymentByClassBefore:deepClone(sourcePaymentByClassBefore),
                timetableMigrated:!sourceTimetableExists && hasOwnData(legacyTimetable),
                legacyTimetable:!sourceTimetableExists ? legacyTimetable : null,
                legacyFinanceIds,
            },
        };
        const transitionRecord = {
            version:5, status:'completed', sourceYear:context.currentYear, targetYear:context.targetYear,
            createdAt:now, completedAt:now, createdBy:currentUserEmail(), createdByUid:currentUserUid(),
            plan: firebaseSafeTransitionPlan(plan), summary, backup,
            after:{ studentGuards:afterGuards, teacherState:teacherAfter, classAssignments, teacherAssignments, targetScoreEntryWindows:targetWindows, sourceHocBaYearKeys:Object.keys(sourceHocBaYears), targetHocBaYearKeys:Object.keys(targetHocBaYears) },
        };

        const updates = {};
        Object.entries(afterStudents).forEach(([key,value]) => updates[`students/${key}`]=value);
        Object.entries(sourceHocBaYears).forEach(([studentAlias, value]) => { updates[`hocba/${studentAlias}/${sourceKey}`] = value; });
        Object.entries(targetHocBaYears).forEach(([studentAlias, value]) => { updates[`hocba/${studentAlias}/${targetKey}`] = value; });
        Object.entries(teacherAfter).forEach(([uid,value]) => { updates[`users/${uid}/assignedClass`]=value.assignedClass; updates[`users/${uid}/assignedClassKey`]=value.assignedClassKey; updates[`users/${uid}/lastYearTransitionId`]=id; });
        updates['settings/schoolYear']=context.targetYear; updates['settings/schoolYearKey']=targetKey; updates['settings/semester']='hk1'; updates['settings/updatedAt']=now; updates['settings/updatedBy']=currentUserEmail(); updates['settings/lastYearTransitionId']=id; updates['settings/currentYearTransitionId']=id; updates['settings/yearTransitionState']={ id,status:'completed',sourceYear:context.currentYear,targetYear:context.targetYear,completedAt:now };
        updates[`settings/scoreEntryWindows/${targetKey}`]=targetWindows;
        updates['settings/legacyFinanceSchoolYear']=context.settings.legacyFinanceSchoolYear || context.currentYear;
        updates[`classAssignments/${targetKey}`]=classAssignments; updates[`teacherAssignments/${targetKey}`]=teacherAssignments;

        if (freshCheck.promotionBundle.source === 'legacy') {
            updates[`promotionStatus/${sourceKey}`]=freshCheck.promotionBundle.data;
        }
        Object.keys(allLegacyPromotion).forEach(key => updates[`promotionStatus/${key}`]=null);
        updates['settings/promotionStatusMigrated']=true;
        updates['settings/promotionStatusMigratedAt']=now;
        if (paymentScopedChanged) {
            updates[`paymentStatus/${sourceKey}`] = hasOwnData(sourcePaymentNormalized)
                ? sourcePaymentNormalized : null;
        }
        if (!sourcePaymentExists && hasOwnData(legacyPayment)) {
            Object.keys(legacyPayment).forEach(key => updates[`paymentStatus/${key}`]=null);
        }
        if (paymentClassIndexChanged) {
            updates[`paymentStatusByClass/${sourceKey}`] = hasOwnData(sourcePaymentByClassAfter)
                ? sourcePaymentByClassAfter : null;
        }
        if (!sourceTimetableExists && hasOwnData(legacyTimetable)) {
            updates[`timetables/${sourceKey}`]=legacyTimetable;
            Object.keys(legacyTimetable).forEach(key => updates[`timetables/${key}`]=null);
        }
        legacyFinanceIds.forEach(key => updates[`finance/${key}/schoolYear`]=context.currentYear);
        updates[`yearTransitions/${id}`]=firebaseSafeObjectKeys(transitionRecord);

        const bytes = new TextEncoder().encode(JSON.stringify(updates)).length;
        if (bytes > MAX_ATOMIC_PAYLOAD_BYTES) throw new Error(`Gói cập nhật quá lớn (${(bytes/1024/1024).toFixed(1)} MB). Cần chuyển dữ liệu cũ bằng công cụ migration riêng.`);
        await window.update(window.ref(window.db), updates);
        window._currentSchoolYear=context.targetYear; window._currentSemester='hk1'; window._promotionCache=null; window._yearTransitionPreflight=null;
        await Swal.fire({ icon:'success',title:'Chuyển năm học hoàn tất',html:`Đã chuyển sang <b>${htmlEscape(context.targetYear)}</b>.<br>Lên lớp: ${summary.promoted} · Ở lại: ${summary.repeated} · Tốt nghiệp: ${summary.graduated} · Bảo lưu: ${summary.reserved} · Nghỉ học: ${summary.inactive}` });
        location.reload();
    } catch (error) {
        Swal.fire('Chuyển năm học thất bại', error.message, 'error');
    } finally { await releaseLock(lockRef); }
};

async function ensureRollbackSafe(transition, current) {
    const errors=[]; const targetKey=syKey(transition.targetYear);
    const rollbackHours=Math.min(MAX_ROLLBACK_HOURS, Math.max(1, Number(current.settings.yearTransitionRollbackHours || DEFAULT_ROLLBACK_HOURS)));
    if (transition.status !== 'completed') errors.push('Lần chuyển không ở trạng thái hoàn tất.');
    if (current.currentYear !== transition.targetYear) errors.push('Hệ thống không còn ở năm đích.');
    if (current.settings.lastYearTransitionId !== transition.id) errors.push('Đây không còn là lần chuyển gần nhất.');
    if (current.settings.currentYearTransitionId !== transition.id) errors.push('Dấu vết chuyển năm hiện tại không còn khớp.');
    if ((current.settings.semester || 'hk1') !== 'hk1') errors.push('Học kỳ của năm mới đã thay đổi.');
    if (stableStringify(current.settings.scoreEntryWindows?.[targetKey] ?? null) !== stableStringify(transition.after?.targetScoreEntryWindows ?? null)) {
        errors.push('Cấu hình thời gian nhập điểm năm mới đã được chỉnh sửa.');
    }
    if (serverNow()-Number(transition.completedAt||0) > rollbackHours*3600000) errors.push(`Đã quá thời hạn khôi phục ${rollbackHours} giờ.`);

    const [attendance,audit,promotion,payment,paymentByClass,timetable,finance,classAssignments,teacherAssignments] = await Promise.all([
        readPath(`attendance/${targetKey}`), readPath(`scoreAudit/${targetKey}`), readPath(`promotionStatus/${targetKey}`),
        readPath(paymentStatusPath(transition.targetYear)), readPath(`paymentStatusByClass/${targetKey}`),
        readPath(timetablePath(transition.targetYear)), readPath('finance'),
        readPath(`classAssignments/${targetKey}`), readPath(`teacherAssignments/${targetKey}`),
    ]);
    if(hasOwnData(attendance)) errors.push('Năm mới đã có điểm danh.');
    if(hasOwnData(audit)) errors.push('Năm mới đã có nhật ký điểm.');
    if(hasOwnData(promotion)) errors.push('Năm mới đã có trạng thái cuối năm.');
    if(hasOwnData(payment) || hasOwnData(paymentByClass)) errors.push('Năm mới đã có trạng thái đóng tiền.');
    if(hasOwnData(timetable)) errors.push('Năm mới đã có thời khóa biểu.');
    if(Object.values(finance||{}).some(tx=>tx?.schoolYear===transition.targetYear)) errors.push('Năm mới đã có giao dịch tài chính.');

    const academicStudents=Object.entries(transition.backup?.students||{}).map(([key,s])=>({id:s?.id||key}));
    const academic=await loadAcademicResults(academicStudents,targetKey); if(academicStudents.some(s=>hasOwnData(academic[s.id]))) errors.push('Năm mới đã có học bạ/điểm.');
    Object.entries(transition.after?.studentGuards||{}).forEach(([key,guard])=>{ if(!guardsEqual(current.studentsRaw[key],guard)) errors.push(`Hồ sơ học sinh ${current.studentsRaw[key]?.name||key} đã thay đổi sau chuyển năm.`); });
    Object.entries(transition.after?.teacherState||{}).forEach(([uid,guard])=>{ const user=current.users[uid]||{}; if((user.assignedClass||null)!==(guard.assignedClass||null)||(user.assignedClassKey||null)!==(guard.assignedClassKey||null)||(user.lastYearTransitionId||null)!==(guard.lastYearTransitionId||null)) errors.push(`Phân công GVCN ${user.email||uid} đã thay đổi.`); });
    const affected=new Set(Object.keys(transition.backup?.students||{}));
    Object.entries(current.studentsRaw||{}).forEach(([key,s])=>{ if(!affected.has(key) && (Number(s?.createdAt||0)>=Number(transition.completedAt||0) || s?.schoolYearHistory?.[targetKey])) errors.push(`Đã có học sinh mới/phát sinh trong năm đích: ${s?.name||key}.`); });
    if(stableStringify(classAssignments||{})!==stableStringify(transition.after?.classAssignments||{})) errors.push('Dữ liệu xếp lớp năm mới đã bị thay đổi.');
    if(stableStringify(teacherAssignments||{})!==stableStringify(transition.after?.teacherAssignments||{})) errors.push('Dữ liệu phân công giáo viên năm mới đã bị thay đổi.');
    return errors;
}

window.rollbackLastYearTransition = async function() {
    if (!adminOnly()) return;
    let lockRef=null;
    try {
        const id=await readPath('settings/lastYearTransitionId'); if(!id) throw new Error('Không có lần chuyển để khôi phục.');
        const raw=await readPath(`yearTransitions/${id}`); if(!raw) throw new Error('Không tìm thấy bản sao lưu.');
        const transition={id,...raw};
        lockRef=await acquireLock('rollback',transition.sourceYear,transition.targetYear);
        const current=await loadFreshContext();
        Swal.fire({title:'Đang kiểm tra khả năng khôi phục...',allowOutsideClick:false,showConfirmButton:false,didOpen:()=>Swal.showLoading()});
        const errors=await ensureRollbackSafe(transition,current);
        if(errors.length){ await Swal.fire({icon:'error',title:'Không thể khôi phục tự động',html:`<ul style="text-align:left;margin-left:18px">${errors.map(x=>`<li>${htmlEscape(x)}</li>`).join('')}</ul>`}); return; }
        const confirm=await Swal.fire({title:`Khôi phục về ${transition.sourceYear}?`,icon:'warning',showCancelButton:true,confirmButtonText:'Khôi phục',cancelButtonText:'Hủy',confirmButtonColor:'#dc2626'}); if(!confirm.isConfirmed)return;
        Swal.fire({title:'Đang khôi phục...',allowOutsideClick:false,showConfirmButton:false,didOpen:()=>Swal.showLoading()});
        const b=transition.backup||{}; const targetKey=syKey(transition.targetYear); const sourceKey=syKey(transition.sourceYear); const now=serverNow(); const updates={};
        Object.entries(b.students||{}).forEach(([key,value])=>updates[`students/${key}`]=value);
        Object.entries(b.teacherState||{}).forEach(([uid,value])=>{updates[`users/${uid}/assignedClass`]=value.assignedClass;updates[`users/${uid}/assignedClassKey`]=value.assignedClassKey;updates[`users/${uid}/lastYearTransitionId`]=value.lastYearTransitionId;});
        updates['settings/schoolYear']=b.settings?.schoolYear||transition.sourceYear; updates['settings/schoolYearKey']=syKey(b.settings?.schoolYear||transition.sourceYear); updates['settings/semester']=b.settings?.semester||'hk2'; updates['settings/lastYearTransitionId']=b.settings?.lastYearTransitionId||null; updates['settings/currentYearTransitionId']=b.settings?.currentYearTransitionId??null; updates['settings/yearTransitionState']=b.settings?.yearTransitionState??null; updates['settings/updatedAt']=now; updates['settings/updatedBy']=currentUserEmail(); updates['settings/legacyFinanceSchoolYear']=b.settings?.legacyFinanceSchoolYear??null; updates[`settings/scoreEntryWindows/${targetKey}`]=b.settings?.targetScoreEntryWindows??null;
        updates[`promotionStatus/${targetKey}`]=b.targetPromotionStatus??null; updates[`classAssignments/${targetKey}`]=null; updates[`teacherAssignments/${targetKey}`]=null;
        const m=b.migration||{};
        if(m.promotionScopedCreated) updates[`promotionStatus/${sourceKey}`]=null;
        Object.entries(m.legacyPromotion||{}).forEach(([key,value])=>updates[`promotionStatus/${key}`]=value);
        updates['settings/promotionStatusMigrated']=b.settings?.promotionStatusMigrated??null;
        updates['settings/promotionStatusMigratedAt']=b.settings?.promotionStatusMigratedAt??null;
        if(m.paymentMigrated){
            updates[`paymentStatus/${sourceKey}`]=null;
            Object.entries(m.legacyPayment||{}).forEach(([key,value])=>updates[`paymentStatus/${key}`]=value);
        } else if(m.paymentScopedChanged) {
            updates[`paymentStatus/${sourceKey}`]=m.sourcePaymentBefore??null;
        }
        if(m.paymentClassIndexChanged){
            updates[`paymentStatusByClass/${sourceKey}`]=m.sourcePaymentByClassBefore??null;
        }
        if(m.timetableMigrated){ updates[`timetables/${sourceKey}`]=null; Object.entries(m.legacyTimetable||{}).forEach(([key,value])=>updates[`timetables/${key}`]=value); }
        (m.legacyFinanceIds||[]).forEach(key=>updates[`finance/${key}/schoolYear`]=null);
        updates[`yearTransitions/${id}/status`]='rolled_back'; updates[`yearTransitions/${id}/rolledBackAt`]=now; updates[`yearTransitions/${id}/rolledBackBy`]=currentUserEmail(); updates[`yearTransitions/${id}/rolledBackByUid`]=currentUserUid();
        await window.update(window.ref(window.db),updates);
        window._currentSchoolYear=transition.sourceYear;window._currentSemester=b.settings?.semester||'hk2';window._promotionCache=null;
        await Swal.fire('Khôi phục thành công',`Hệ thống đã trở lại năm học ${transition.sourceYear}.`,'success');location.reload();
    } catch(error){Swal.fire('Không thể khôi phục',error.message,'error');}
    finally{await releaseLock(lockRef);}
};
