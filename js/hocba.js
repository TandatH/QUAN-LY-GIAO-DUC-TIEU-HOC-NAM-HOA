console.info('[Smart School V5.32.9] hocba old-year export backfill loaded');
import { activeStudentValues, isActiveStudent } from "./studentstatus.js?v=5.26.1";
// ═══════════════════════════════════════════════════════
// hocba.js — Học bạ chuẩn TT27/2020 + quản lý năm học (V5.4)
// Cấu trúc DB: hocba/{studentId}/{schoolYear}/{ subjects, phamChat, nangLuc, ketQua }
// ═══════════════════════════════════════════════════════

import { getScoreEntryStatus, ensureScoreEntryAllowed, scoreWindowBannerHtml,
         buildAuditedScoreRecord, makeScoreAuditUpdate, isEditedScore,
         scoreAuditSummary, attachScoreChangeHighlighter, escapeHtml }
    from "./scoreaccess.js";
import { bindCommentField, addCommentBankToolbar }
    from "./commentbank.js?v=5.6.1";

window._hocbaCurrentClass = '';

// ── Năm học hiện tại ──────────────────────────────────────────────────────────
function currentSchoolYear() {
    // Luôn ưu tiên năm học Admin đã cấu hình cho toàn hệ thống.
    if (window._currentSchoolYear) return window._currentSchoolYear;
    const now = new Date();
    const y = now.getFullYear();
    // Nếu tháng >= 8 thì đang trong năm học y-(y+1), ngược lại (y-1)-y
    return now.getMonth() >= 7 ? `${y}-${y+1}` : `${(y-1)}-${y}`;
}

function allSchoolYears() {
    // Tạo danh sách năm học từ 2020 đến hiện tại+1
    const now = new Date();
    const endY = now.getMonth() >= 7 ? now.getFullYear()+1 : now.getFullYear();
    const years = [];
    for (let y = 2020; y < endY; y++) years.push(`${y}-${y+1}`);
    return years.reverse(); // mới nhất lên đầu
}

// ── Lấy khối lớp từ tên lớp ──────────────────────────────────────────────────
function gradeFromClass(cls) {
    const m = (cls||'').match(/^(\d+)/);
    return m ? m[1] : '1';
}

// ── Danh sách học sinh theo đúng năm học ─────────────────────────────────────
// Lỗi cũ: khi xem năm đã lưu trữ, màn hình vẫn lọc theo classRoom hiện tại.
// Học sinh đã lên lớp vì thế biến mất khỏi lớp cũ, chỉ học sinh ở lại còn hiện.
function hocbaYearKey(schoolYear = currentSchoolYear()) {
    return String(schoolYear || '').replace('-', '_');
}

function hocbaIsArchivedYear(schoolYear = currentSchoolYear()) {
    const selected = String(schoolYear || '');
    const system = String(window._systemSchoolYear || '');
    return !!window._isViewingArchivedYear || (!!system && !!selected && selected !== system);
}

function hocbaClassFromRecord(record) {
    return record?.classRoom || record?.class || record?.className || record?.toClass || record?.newClass || '';
}

function hocbaHistoryRecord(student, schoolYear = currentSchoolYear()) {
    const yk = hocbaYearKey(schoolYear);
    const maps = [student?.schoolYearHistory, student?.yearHistory, student?.classHistoryByYear];
    for (const map of maps) {
        const record = map?.[yk] || map?.[String(schoolYear || '')];
        if (record && typeof record === 'object') return record;
    }
    return null;
}

function hocbaClassForYear(student, schoolYear = currentSchoolYear()) {
    if (student?._hocbaClassForYear) return student._hocbaClassForYear;

    // Năm hiện tại → luôn dùng lớp hiện tại
    if (!hocbaIsArchivedYear(schoolYear)) {
        return student?.classRoom || student?.class || '';
    }

    // Chỉ năm cũ mới dùng lịch sử
    const historicalClass =
        hocbaClassFromRecord(hocbaHistoryRecord(student, schoolYear));

    return historicalClass || '';
}

function hocbaInferClassFromGrade(student, grade) {
    const currentClass = String(student?.classRoom || student?.class || '').trim();
    const g = String(grade || '').match(/\d+/)?.[0] || '';
    if (!g || !currentClass) return '';
    const suffix = currentClass.replace(/^\d+/, '');
    return suffix ? `${g}${suffix}` : '';
}

function hocbaStudentKey(student) {
    if (student?._key) return student._key;
    const entries = Object.entries(window.localData?.students || {});
    const found = entries.find(([key, value]) => value === student || key === student?.id || key === student?.code);
    return found?.[0] || student?.id || student?.code || '';
}

function hocbaFindStudent(studentId) {
    const source = window.localData?.students || {};
    if (source[studentId]) return { ...source[studentId], _key:studentId };
    const found = Object.entries(source).find(([key, student]) =>
        key === studentId || String(student?.id || '') === String(studentId || '') || String(student?.code || '') === String(studentId || '')
    );
    return found ? { ...found[1], _key:found[0] } : null;
}

function hocbaStudentForYear(student, schoolYear = currentSchoolYear(), className = '') {
    const cls = className || hocbaClassForYear(student, schoolYear) || (!hocbaIsArchivedYear(schoolYear) ? (student?.classRoom || student?.class || '') : '');
    return {
        ...student,
        _key: hocbaStudentKey(student),
        _hocbaClassForYear: cls,
        classRoom: cls,
        class: cls,
        currentGrade: gradeFromClass(cls),
    };
}

async function hocbaReadArchivedYearMeta(student, schoolYear) {
    const yk = hocbaYearKey(schoolYear);
    const keys = [...new Set([
        hocbaStudentKey(student),
        student?.id,
        student?.code,
    ].filter(Boolean).map(String))];

    for (const key of keys) {
        try {
            const snap = await window.get(window.ref(window.db, `hocba/${key}/${yk}`));
            if (snap.exists()) return { key, data: snap.val() || {} };
        } catch (_) {
            // Thử bí danh tiếp theo; quyền đọc theo từng học sinh vẫn được giữ nguyên.
        }
    }
    return { key: keys[0] || '', data: {} };
}

async function hocbaStudentsForYear(schoolYear = currentSchoolYear()) {
    const entries = Object.entries(window.localData?.students || {})
        .map(([key, student]) => ({ ...student, _key:key }));

    if (!hocbaIsArchivedYear(schoolYear)) {
        return entries.filter(isActiveStudent).map(student => hocbaStudentForYear(student, schoolYear));
    }

    const yk = hocbaYearKey(schoolYear);
    let assignments = {};
    // classAssignments lưu lớp của học sinh ở đầu năm. Node này chỉ Admin đọc được;
    // với vai trò khác, schoolYearHistory vẫn là nguồn chính.
    if (window.userRole === 'admin') {
        try {
            const snap = await window.get(window.ref(window.db, `classAssignments/${yk}`));
            assignments = snap.val() || {};
        } catch (_) {
            assignments = {};
        }
    }

    const roster = [];
    const unresolved = [];
    for (const student of entries) {
        const historyClass = hocbaClassFromRecord(hocbaHistoryRecord(student, schoolYear));
        const assignment = assignments?.[student._key]
            || assignments?.[student.id]
            || assignments?.[student.code]
            || null;
        const assignedClass = hocbaClassFromRecord(assignment);
        const cls = historyClass || assignedClass;
        if (cls) roster.push(hocbaStudentForYear(student, schoolYear, cls));
        else unresolved.push(student);
    }

    // Tương thích dữ liệu cũ chưa có schoolYearHistory: đọc metadata đã lưu ngay
    // trong hocba/{student}/{year}. Chỉ những học sinh thực sự có dữ liệu năm đó
    // mới được thêm vào danh sách.
    const BATCH = 20;
    for (let i = 0; i < unresolved.length; i += BATCH) {
        const batch = unresolved.slice(i, i + BATCH);
        const results = await Promise.all(batch.map(async student => {
            const meta = await hocbaReadArchivedYearMeta(student, schoolYear);
            const data = meta.data || {};
            if (!Object.keys(data).length) return null;
            const cls = hocbaClassFromRecord(data)
                || hocbaInferClassFromGrade(student, data.grade);
            if (!cls) return null;
            return hocbaStudentForYear({ ...student, _key: meta.key || student._key }, schoolYear, cls);
        }));
        roster.push(...results.filter(Boolean));
    }

    const unique = new Map();
    roster.forEach(student => {
        const key = hocbaStudentKey(student) || student.id || student.code;
        if (key && !unique.has(String(key))) unique.set(String(key), student);
    });
    return [...unique.values()];
}

// ── Subjects helper ────────────────────────────────────────────────────────────
function getSubjects(grade) {
    return (window.PRIMARY_SUBJECTS[grade] || window.PRIMARY_SUBJECTS['1']);
}

// ── Tự động xác định danh hiệu khen thưởng theo đánh giá KQGD ───────────────
function khenThuongTheoDanhGia(danhGia) {
    if (danhGia === 'Hoàn thành xuất sắc') return 'Học sinh Xuất sắc';
    if (danhGia === 'Hoàn thành tốt') return 'Học sinh Tiêu biểu hoàn thành tốt trong học tập và rèn luyện';
    return '';
}

// ── DB helpers ────────────────────────────────────────────────────────────────
function hocbaRef(studentId, schoolYear) {
    return window.ref(window.db, `hocba/${studentId}/${schoolYear.replace('-','_')}`);
}

async function loadHocBaData(studentId, schoolYear) {
    try {
        const yk   = schoolYear.replace('-','_');
        const snap = await window.get(window.ref(window.db, `hocba/${studentId}/${yk}`));
        return snap.val() || {};
    } catch(e) {
        console.error('loadHocBaData error:', e);
        return {};
    }
}

async function saveHocBaData(studentId, schoolYear, data) {
    await window.update(hocbaRef(studentId, schoolYear), data);
}

// ── Promotion status ──────────────────────────────────────────────────────────
const PROMOTION_STATUS = {
    'len_lop':  { label:'Lên lớp',  icon:'✅', color:'#16a34a', bg:'#dcfce7' },
    'o_lai':    { label:'Ở lại',    icon:'🔁', color:'#d97706', bg:'#fef3c7' },
    'bao_luu':  { label:'Bảo lưu',  icon:'⏸️', color:'#2563eb', bg:'#dbeafe' },
    'nghi_hoc': { label:'Nghỉ học', icon:'❌', color:'#dc2626', bg:'#fee2e2' },
};

window._promotionCache = null;
async function loadPromotionStatus(schoolYear = currentSchoolYear()) {
    const key = schoolYear.replace('-', '_');
    if (!window._promotionCache || typeof window._promotionCache !== 'object') {
        window._promotionCache = {};
    }
    if (Object.prototype.hasOwnProperty.call(window._promotionCache, key)) {
        return window._promotionCache[key];
    }

    try {
        if (window.userRole === 'admin') {
            const snap = await window.get(
                window.ref(window.db, `promotionStatus/${key}`)
            );
            window._promotionCache[key] = snap.val() || {};
        } else {
            // Giáo viên chỉ đọc từng học sinh đã được Rules xác nhận thuộc lớp mình.
            // Không đọc cả node năm học vì thao tác đó sẽ làm lộ trạng thái lớp khác.
            const entries = Object.entries(window.localData?.students || {});
            const rows = await Promise.all(entries.map(async ([studentKey]) => {
                try {
                    const snap = await window.get(
                        window.ref(window.db, `promotionStatus/${key}/${studentKey}`)
                    );
                    return [studentKey, snap.val() || null];
                } catch {
                    return [studentKey, null];
                }
            }));
            window._promotionCache[key] = Object.fromEntries(
                rows.filter(([, value]) => value)
            );
        }
    } catch (error) {
        // Trạng thái lên lớp chỉ là dữ liệu bổ sung. Không để lỗi quyền làm
        // dừng toàn bộ trang học bạ.
        console.warn(`[Smart School V5.3] Không tải được promotionStatus/${key}:`, error);
        window._promotionCache[key] = {};
    }
    return window._promotionCache[key];
}

// ══════════════════════════════════════════════════════════════════════════════
// RENDER TRANG CHÍNH
// ══════════════════════════════════════════════════════════════════════════════
// ── Đánh giá kết quả giáo dục cuối năm theo TT27 ─────────────────────────────
// Không tính điểm trung bình; kiểm tra điểm định kỳ riêng của từng môn.
function _hbScoreValue(record) {
    const raw = record?.diem ?? record?.diemCN;
    if (raw === '' || raw === null || raw === undefined) return null;
    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
}

function classifyGDPT2018(hk2Data, grade) {
    const kq = hk2Data?.__kq || {};
    const colorMap = {
        'Hoàn thành xuất sắc': '#7c3aed',
        'Hoàn thành tốt':      '#16a34a',
        'Hoàn thành':          '#2563eb',
        'Chưa hoàn thành':     '#dc2626',
    };
    if (kq.danhGia) return { loai:kq.danhGia, color:colorMap[kq.danhGia] || '#94a3b8' };
    if (!hk2Data || !Object.keys(hk2Data).length) return { loai:'—', color:'#94a3b8' };

    const subjects = getSubjects(grade);
    const scoreSubjects = subjects.filter(s => s.type === 'diem');
    const subjectLevels = subjects.map(s => hk2Data?.[s.name]?.mucDat || '');
    const scores = scoreSubjects.map(s => _hbScoreValue(hk2Data?.[s.name]));
    const traitLevels = [
        ...(window.PHAM_CHAT || []).map(x => hk2Data?.__pc?.[x]?.mucDat || ''),
        ...(window.NANG_LUC_CHUNG || []).map(x => hk2Data?.__nlc?.[x]?.mucDat || ''),
        ...(window.NANG_LUC_DAC_THU || []).map(x => hk2Data?.__nld?.[x]?.mucDat || ''),
    ];

    const complete = subjectLevels.length > 0 && subjectLevels.every(Boolean)
        && scores.length === scoreSubjects.length && scores.every(v => v !== null)
        && traitLevels.length > 0 && traitLevels.every(Boolean);
    if (!complete) return { loai:'—', color:'#94a3b8' };

    const allSubjectsT = subjectLevels.every(v => v === 'T');
    const allSubjectsCompleted = subjectLevels.every(v => v === 'T' || v === 'H');
    const allTraitsT = traitLevels.every(v => v === 'T');
    const allTraitsReached = traitLevels.every(v => v === 'T' || v === 'Đ');
    const allScoresAtLeast = threshold => scores.every(v => v >= threshold);

    if (allSubjectsT && allTraitsT && allScoresAtLeast(9)) return { loai:'Hoàn thành xuất sắc', color:'#7c3aed' };
    if (allSubjectsT && allTraitsT && allScoresAtLeast(7)) return { loai:'Hoàn thành tốt', color:'#16a34a' };
    if (allSubjectsCompleted && allTraitsReached && allScoresAtLeast(5)) return { loai:'Hoàn thành', color:'#2563eb' };
    return { loai:'Chưa hoàn thành', color:'#dc2626' };
}

export async function renderHocBa() {
    const schoolYear = currentSchoolYear();
    let allStudents = await hocbaStudentsForYear(schoolYear);
    if (window.userRole === 'teacher') {
        const assignedClass = window.teacherClass || '';
        const assignedKey   = window.teacherClassKey || '';
        allStudents = allStudents.filter(s => {
            const yearClass = hocbaClassForYear(s, schoolYear);
            return (assignedClass && yearClass === assignedClass)
                || (!hocbaIsArchivedYear(schoolYear) && assignedKey && s.currentClassKey === assignedKey);
        });
    }
    const classes = [...new Set(allStudents.map(s => hocbaClassForYear(s, schoolYear)).filter(Boolean))]
        .sort((a,b) => a.localeCompare(b,'vi', { numeric:true, sensitivity:'base' }));

    if (!window._hocbaCurrentClass || !classes.includes(window._hocbaCurrentClass)) {
        window._hocbaCurrentClass = classes[0] || '';
    }
    window._promotionCache = null;

    document.getElementById('content').innerHTML = `
        <div style="margin-bottom:14px;display:flex;gap:10px;flex-wrap:wrap;align-items:center">
            <span style="font-size:1rem;font-weight:700;color:#1e293b">
                <i class="fas fa-book-open"></i> Học bạ — TT27/2020
            </span>
            <span style="background:#dbeafe;color:#1d4ed8;padding:4px 12px;border-radius:20px;font-size:0.85rem;font-weight:600">
                Năm học: ${schoolYear}
            </span>
            <div style="margin-left:auto;display:flex;gap:8px">
                <button class="btn btn-outline btn-sm" onclick="viewQuyTrinhHocTap()">
                    <i class="fas fa-history"></i> Quá trình học tập
                </button>
                <button class="btn btn-success btn-sm" onclick="exportAllHocBaClass()">
                    <i class="fas fa-file-excel"></i> Xuất Excel lớp
                </button>
            </div>
        </div>

        <!-- Tabs lớp -->
        <div style="background:white;border-radius:10px;padding:12px 16px;margin-bottom:16px;
                    box-shadow:0 1px 3px rgba(0,0,0,0.08);display:flex;gap:8px;flex-wrap:wrap;align-items:center">
            <span style="color:#64748b;font-size:0.85rem;font-weight:600;margin-right:4px">
                <i class="fas fa-layer-group"></i> Lớp:
            </span>
            ${classes.map(c => `
                <button id="hbtab-${c.replace('/','_')}" onclick="switchHocBaClass('${c}')"
                    class="btn btn-sm ${c===window._hocbaCurrentClass?'btn-primary':'btn-outline'}"
                    style="font-size:0.82rem;padding:5px 14px">${c}</button>
            `).join('')}
        </div>
        <div id="hocba-content">
            <div style="text-align:center;padding:40px;color:#64748b">
                <i class="fas fa-spinner fa-spin" style="font-size:1.5rem"></i>
            </div>
        </div>`;

    try {
        await renderHocBaTable(window._hocbaCurrentClass, schoolYear);
    } catch (error) {
        console.error('[Smart School V5.3] renderHocBa error:', error);
        const target = document.getElementById('hocba-content');
        if (target) {
            target.innerHTML = `
                <div class="card" style="text-align:center;padding:32px;color:#dc2626">
                    <i class="fas fa-exclamation-triangle" style="font-size:1.7rem"></i>
                    <p style="margin-top:10px;font-weight:600">Không tải được học bạ</p>
                    <p style="margin-top:6px;color:#64748b;font-size:0.85rem">${escapeHtml(error?.message || 'Lỗi không xác định')}</p>
                    <button class="btn btn-primary" style="margin-top:12px" onclick="renderHocBa()">
                        <i class="fas fa-redo"></i> Tải lại
                    </button>
                </div>`;
        }
    }
}

window.switchHocBaClass = async function(cls) {
    window._hocbaCurrentClass = cls;
    document.querySelectorAll('[id^="hbtab-"]').forEach(b => b.className = 'btn btn-sm btn-outline');
    const tab = document.getElementById(`hbtab-${cls.replace('/','_')}`);
    if (tab) tab.className = 'btn btn-sm btn-primary';
    document.getElementById('hocba-content').innerHTML =
        `<div style="text-align:center;padding:40px;color:#64748b">
            <i class="fas fa-spinner fa-spin" style="font-size:1.5rem"></i>
            <p style="margin-top:10px;font-size:0.85rem">Đang tải...</p>
         </div>`;
    try {
        await renderHocBaTable(cls, currentSchoolYear());
    } catch(err) {
        console.error('switchHocBaClass error:', err);
        document.getElementById('hocba-content').innerHTML =
            `<div class="card" style="text-align:center;color:#dc2626;padding:30px">
                <p>Lỗi: ${err.message}</p>
                <button class="btn btn-primary" onclick="switchHocBaClass('${cls}')" style="margin-top:10px">
                    <i class="fas fa-redo"></i> Thử lại
                </button>
             </div>`;
    }
};

async function renderHocBaTable(cls, schoolYear) {
    let students = (await hocbaStudentsForYear(schoolYear))
        .filter(s => hocbaClassForYear(s, schoolYear) === cls)
        .sort((a,b) => {
            const la = (a.name||'').split(' ').pop();
            const lb = (b.name||'').split(' ').pop();
            return la.localeCompare(lb,'vi');
        });

    if (!students.length) {
        document.getElementById('hocba-content').innerHTML =
            `<div class="card" style="text-align:center;color:#94a3b8;padding:40px">
                Không có học sinh trong lớp ${cls}
             </div>`;
        return;
    }

    const promotionData = await loadPromotionStatus();
    // Học bạ cuối năm dùng cùng cửa sổ nhập điểm Cuối HK2.
    const scoreEntryStatus = await getScoreEntryStatus(schoolYear, 'hk2');

    const grade = gradeFromClass(cls);
    const subjects = getSubjects(grade);
    const ds = subjects.filter(s => s.type === 'diem');
    const yk = schoolYear.replace('-','_');

    // Load tất cả dữ liệu lớp trong 1 request duy nhất (thay vì N×2 requests)
    const yearDataMap = {}, hk2DataMap = {};
    try {
        // Load toàn bộ hocba của năm học này cho tất cả HS trong lớp
        // Dùng 1 get() cho mỗi HS thay vì 2 → giảm số request
        const BATCH = 5; // xử lý 5 HS mỗi lần để không quá tải
        for (let i = 0; i < students.length; i += BATCH) {
            const batch = students.slice(i, i + BATCH);
            await Promise.all(batch.map(async s => {
                try {
                    // Load cả năm học 1 lần → lấy được cả hk1, hk2, subjects, ketQua
                    const yearSnap = await window.get(window.ref(window.db, `hocba/${s.id}/${yk}`));
                    const yearVal  = yearSnap.val() || {};
                    yearDataMap[s.id] = yearVal;
                    // HK2 nằm trong yearVal.hk2 (lưu bởi scores.js)
                    // Fallback về yearVal.hk2_subjects nếu có
                    hk2DataMap[s.id] = yearVal.hk2 || {};
                } catch(e) {
                    yearDataMap[s.id] = {};
                    hk2DataMap[s.id]  = {};
                }
            }));
        }
    } catch(e) {
        console.error('hocba load error:', e);
    }

    // Tính kết quả
    const stats = students.map(s => {
        const hb     = yearDataMap[s.id] || {};
        const hk2    = hk2DataMap[s.id]  || {};
        // Merge ketQua: ưu tiên year-level (từ hocba form) → hk2.__kq (từ scores form)
        const ketQua = hb.ketQua || hk2.__kq || {};
        const pKey   = promotionData[s.id]?.status || '';
        const ps     = pKey ? PROMOTION_STATUS[pKey] : null;
        const cl = classifyGDPT2018({ ...hk2, __kq: ketQua }, grade);
        return { s, hb, hk2, ketQua, pKey, ps, loaiText: cl.loai, loaiColor: cl.color };
    });

    // Thống kê theo loaiText (từ HK2)
    const statKL = { 'Hoàn thành xuất sắc':0, 'Hoàn thành tốt':0, 'Hoàn thành':0, 'Chưa hoàn thành':0, '—':0 };
    stats.forEach(r => {
        const key = r.loaiText || '—';
        if (statKL[key] !== undefined) statKL[key]++;
        else statKL['—']++;
    });

    const canEdit = window.userRole === 'admin' || window.userRole === 'teacher';
    const canEditHocBa = canEdit && scoreEntryStatus.allowed;

    document.getElementById('hocba-content').innerHTML = `
        ${scoreWindowBannerHtml(scoreEntryStatus)}
        <!-- Thống kê -->
        <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap">
            ${[
                { label:'Hoàn thành xuất sắc', val:statKL['Hoàn thành xuất sắc'], color:'#7c3aed', bg:'#ede9fe' },
                { label:'Hoàn thành tốt',       val:statKL['Hoàn thành tốt'],       color:'#16a34a', bg:'#dcfce7' },
                { label:'Hoàn thành',           val:statKL['Hoàn thành'],           color:'#2563eb', bg:'#dbeafe' },
                { label:'Chưa hoàn thành',      val:statKL['Chưa hoàn thành'],      color:'#dc2626', bg:'#fee2e2' },
                { label:'Chưa đánh giá',        val:statKL['—'],                     color:'#94a3b8', bg:'#f1f5f9' },
            ].map(it => `
                <div style="background:${it.bg};border-radius:8px;padding:10px 18px;text-align:center;min-width:100px">
                    <div style="font-size:1.5rem;font-weight:700;color:${it.color}">${it.val}</div>
                    <div style="font-size:0.72rem;color:#64748b">${it.label}</div>
                </div>`).join('')}
        </div>

        <!-- Bảng HS -->
        <div class="table-wrapper">
            <table>
                <thead>
                    <tr>
                        <th>STT</th><th>Mã HS</th><th>Họ và tên</th>
                        <th style="text-align:center">Đánh giá<br>kết quả GD</th>
                        <th style="text-align:center;min-width:130px">Khen thưởng</th>
                        <th style="text-align:center;min-width:140px">Lên lớp</th>
                        <th style="text-align:center">Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    ${stats.map((r, i) => {
                        const dg = r.loaiText || r.ketQua.danhGia || '';
                        const dgColor = r.loaiColor || '#94a3b8';
                        const dgBg   = dg==='Hoàn thành xuất sắc'?'#ede9fe':dg==='Hoàn thành tốt'?'#dcfce7':dg==='Hoàn thành'?'#dbeafe':dg==='Chưa hoàn thành'?'#fee2e2':'#f1f5f9';

                        const selectPromotion = canEdit ? `
                            <select onchange="changePromotionStatus('${r.s.id}', this)"
                                style="border:none;border-radius:20px;padding:4px 8px;font-size:0.8rem;
                                font-weight:600;cursor:pointer;outline:none;
                                background:${r.ps?r.ps.bg:'#f1f5f9'};
                                color:${r.ps?r.ps.color:'#94a3b8'};
                                border:1px solid ${r.ps?r.ps.color+'40':'#e2e8f0'}">
                                <option value="" ${!r.pKey?'selected':''}>⏳ Chưa xác nhận</option>
                                ${Object.entries(PROMOTION_STATUS).map(([k,v]) =>
                                    `<option value="${k}" ${r.pKey===k?'selected':''}>${v.icon} ${v.label}</option>`
                                ).join('')}
                            </select>` :
                            `<span style="padding:4px 10px;border-radius:20px;font-size:0.8rem;font-weight:600;
                                background:${r.ps?r.ps.bg:'#f1f5f9'};color:${r.ps?r.ps.color:'#94a3b8'}">
                                ${r.ps?r.ps.icon+' '+r.ps.label:'⏳ Chưa xác nhận'}
                            </span>`;

                        return `<tr>
                            <td>${i+1}</td>
                            <td>${r.s.code||r.s.id}</td>
                            <td><strong>${r.s.name}</strong></td>
                            <td style="text-align:center">
                                ${dg ? `<span style="padding:3px 8px;border-radius:12px;font-size:0.78rem;font-weight:600;background:${dgBg};color:${dgColor}">${dg}</span>` : '<span style="color:#94a3b8;font-size:0.82rem">Chưa đánh giá</span>'}
                            </td>
                            <td style="text-align:center;font-size:0.82rem;color:#475569">
                                ${r.ketQua.khenThuong || khenThuongTheoDanhGia(r.ketQua.danhGia) || '—'}
                            </td>
                            <td style="text-align:center">${selectPromotion}</td>
                            <td style="text-align:center;white-space:nowrap">
                                <button class="btn btn-sm btn-primary" onclick="openHocBaForm('${r.s.id}','${schoolYear}')"
                                    title="${canEditHocBa?'Nhập học bạ':'Đã khóa: ngoài thời gian nhập điểm Cuối HK2'}"
                                    ${canEditHocBa?'':'disabled'}
                                    style="margin-right:3px;${canEditHocBa?'':'opacity:.45;cursor:not-allowed'}">
                                    <i class="fas ${canEditHocBa?'fa-edit':'fa-lock'}"></i>
                                </button>
                                <button class="btn btn-sm btn-info" onclick="viewHocBaDetail('${r.s.id}','${schoolYear}')" title="Xem học bạ" style="margin-right:3px">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button class="btn btn-sm btn-success" onclick="openHocBaWordExportOptions('${r.s.id}','${schoolYear}')" title="Tải Word">
                                    <i class="fas fa-file-word"></i>
                                </button>
                            </td>
                        </tr>`;
                    }).join('')}
                </tbody>
            </table>
        </div>`;
}

// ══════════════════════════════════════════════════════════════════════════════
// FORM NHẬP HỌC BẠ — theo đúng mẫu TT27/2020
// ══════════════════════════════════════════════════════════════════════════════
window.openHocBaForm = async function(studentId, schoolYear) {
    const accessStatus = await ensureScoreEntryAllowed(schoolYear, 'hk2');
    if (!accessStatus.allowed) return;

    const rawStudent = hocbaFindStudent(studentId);
    if (!rawStudent) return;
    const student  = hocbaStudentForYear(rawStudent, schoolYear, window._hocbaCurrentClass || '');
    const grade    = gradeFromClass(student.classRoom || student.class);
    const subjects = getSubjects(grade);
    const hbData   = await loadHocBaData(studentId, schoolYear);
    const hasYearSubjects = Object.keys(hbData.subjects || {}).length > 0;
    const subData  = hasYearSubjects ? hbData.subjects : (hbData.hk2 || {});
    const pcData   = Object.keys(hbData.phamChat || {}).length ? hbData.phamChat : (hbData.hk2?.__pc || {});
    const nlcData  = Object.keys(hbData.nangLucChung || {}).length ? hbData.nangLucChung : (hbData.hk2?.__nlc || {});
    const nldData  = Object.keys(hbData.nangLucDacThu || {}).length ? hbData.nangLucDacThu : (hbData.hk2?.__nld || {});
    const ketQua   = hbData.ketQua || hbData.hk2?.__kq || {};

    // ── Tự động lấy / tính số ngày nghỉ cả năm (từ HK1+HK2 hoặc Điểm danh cả năm) ──
    let defaultNghiCP = hbData.nghiCoPhep;
    let defaultNghiKP = hbData.nghiKhongPhep;
    const hk1Body = hbData.hk1?.__body || {};
    const hk2Body = hbData.hk2?.__body || {};
    const sumHkCP = (hk1Body.nghiCoPhep || 0) + (hk2Body.nghiCoPhep || 0);
    const sumHkKP = (hk1Body.nghiKhongPhep || 0) + (hk2Body.nghiKhongPhep || 0);

    if (defaultNghiCP === undefined || defaultNghiCP === null) {
        if (sumHkCP > 0 || sumHkKP > 0) {
            defaultNghiCP = sumHkCP;
            defaultNghiKP = sumHkKP;
        } else if (typeof window.getAttendanceAbsenceSummary === 'function') {
            const cls = student.classRoom || student.class || '';
            const sid = student.code || student.id || studentId;
            const att = await window.getAttendanceAbsenceSummary(schoolYear, cls, sid, 'all');
            defaultNghiCP = att.coPhep;
            defaultNghiKP = att.khongPhep;
        } else {
            defaultNghiCP = 0;
            defaultNghiKP = 0;
        }
    }

    const mucOptions   = (window.MUC_DANH_GIA_MON || ['T','H','C']).map(m => `<option value="${m}">${m}</option>`).join('');
    const mucOptionsPC = (window.MUC_DANH_GIA     || ['T','Đ','C']).map(m => `<option value="${m}">${m}</option>`).join('');

    // Build bảng môn học
    const buildSubjectRow = (sub) => {
        const sc = subData[sub.name] || {};
        if (sub.type === 'diem') {
            const scoreValue = sc.diem ?? sc.diemCN ?? '';
            const edited = isEditedScore(sc);
            const auditText = scoreAuditSummary(sc);
            return `<tr>
                <td style="font-weight:600">${sub.name}</td>
                <td>
                    <select class="form-control form-control-sm" id="hb-muc-${sub.name}" style="min-width:130px">
                        <option value="">Chọn mức</option>${mucOptions}
                    </select>
                </td>
                <td>
                    <input type="number" class="form-control form-control-sm" id="hb-diem-${sub.name}"
                        placeholder="0-10" min="0" max="10" step="0.1"
                        style="width:78px;font-weight:700;color:${edited?'#dc2626':'#1d4ed8'};${edited?'border-color:#ef4444;background:#fff1f2':''}"
                        title="${escapeHtml(auditText)}" value="${scoreValue}">
                    ${edited && auditText ? `<div style="font-size:.66rem;color:#dc2626;margin-top:3px;max-width:150px">${escapeHtml(auditText)}</div>` : ''}
                </td>
                <td>
                    <input type="text" class="form-control form-control-sm" id="hb-nx-${sub.name}"
                        placeholder="Nhận xét..." value="${sc.nhanXet||''}">
                </td>
            </tr>`;
        } else {
            return `<tr>
                <td style="font-weight:600">${sub.name}</td>
                <td>
                    <select class="form-control form-control-sm" id="hb-muc-${sub.name}" style="min-width:130px">
                        <option value="">Chọn mức</option>${mucOptions}
                    </select>
                </td>
                <td style="color:#94a3b8;font-size:0.8rem;text-align:center">—</td>
                <td>
                    <input type="text" class="form-control form-control-sm" id="hb-nx-${sub.name}"
                        placeholder="Nhận xét..." value="${sc.nhanXet||''}">
                </td>
            </tr>`;
        }
    };

    const buildEvalRow = (id, label, val) => `
        <tr>
            <td style="font-weight:600">${label}</td>
            <td>
                <select class="form-control form-control-sm" id="${id}-muc" style="min-width:130px">
                    <option value="">Chọn mức</option>${mucOptionsPC}
                </select>
            </td>
            <td colspan="2">
                <input type="text" class="form-control form-control-sm" id="${id}-nx" placeholder="Nhận xét...">
            </td>
        </tr>`;

    Swal.fire({
        title: ``,
        html: `
        <div style="text-align:left;font-size:0.88rem">
            <!-- Header học sinh -->
            <div style="background:#1e3a8a;color:white;border-radius:8px;padding:12px 16px;margin-bottom:16px">
                <div style="font-weight:700;font-size:1rem">${student.name}</div>
                <div style="opacity:0.85;font-size:0.85rem">
                    Lớp ${student.classRoom||student.class} &nbsp;|&nbsp; Năm học: ${schoolYear} &nbsp;|&nbsp; Khối ${grade}
                </div>
            </div>

            <!-- Thông tin bổ sung -->
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:8px;margin-bottom:14px">
                <div>
                    <label style="font-size:0.78rem;color:#64748b">Chiều cao (cm)</label>
                    <input type="number" id="hb-chieu-cao" class="form-control" style="font-size:0.85rem" value="${hbData.chieuCao||''}" placeholder="VD: 120">
                </div>
                <div>
                    <label style="font-size:0.78rem;color:#64748b">Cân nặng (kg)</label>
                    <input type="number" id="hb-can-nang" class="form-control" style="font-size:0.85rem" value="${hbData.canNang||''}" placeholder="VD: 25">
                </div>
                <div>
                    <div style="display:flex;justify-content:space-between;align-items:center">
                        <label style="font-size:0.78rem;color:#64748b">Nghỉ có phép</label>
                        <button type="button" style="font-size:0.7rem;color:#2563eb;cursor:pointer;border:none;background:none;padding:0"
                            onclick="window.syncHocBaAbsence('${studentId}','${schoolYear}')" title="Lấy từ Điểm danh / HK1+HK2">
                            <i class="fas fa-sync-alt"></i> Đồng bộ
                        </button>
                    </div>
                    <input type="number" id="hb-nghi-phep" class="form-control" style="font-size:0.85rem" value="${defaultNghiCP||0}" min="0">
                </div>
                <div>
                    <div style="display:flex;justify-content:space-between;align-items:center">
                        <label style="font-size:0.78rem;color:#64748b">Nghỉ không phép</label>
                        <button type="button" style="font-size:0.7rem;color:#2563eb;cursor:pointer;border:none;background:none;padding:0"
                            onclick="window.syncHocBaAbsence('${studentId}','${schoolYear}')" title="Lấy từ Điểm danh / HK1+HK2">
                            <i class="fas fa-sync-alt"></i> Đồng bộ
                        </button>
                    </div>
                    <input type="number" id="hb-nghi-kphep" class="form-control" style="font-size:0.85rem" value="${defaultNghiKP||0}" min="0">
                </div>
            </div>

            <!-- 1. Môn học -->
            <div style="font-weight:700;color:#1e3a8a;margin-bottom:6px">1. Các môn học và hoạt động giáo dục</div>
            <div style="overflow-x:auto;margin-bottom:14px">
                <table style="width:100%;border-collapse:collapse;font-size:0.83rem">
                    <thead>
                        <tr style="background:#dbeafe">
                            <th style="padding:6px 8px;border:1px solid #93c5fd;min-width:160px">Môn học / Hoạt động GD</th>
                            <th style="padding:6px 8px;border:1px solid #93c5fd;min-width:130px">Mức đạt được</th>
                            <th style="padding:6px 8px;border:1px solid #93c5fd;min-width:70px">Điểm KTĐK</th>
                            <th style="padding:6px 8px;border:1px solid #93c5fd">Nhận xét</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${subjects.map(sub => buildSubjectRow(sub)).join('')}
                    </tbody>
                </table>
            </div>

            <!-- 2. Phẩm chất -->
            <div style="font-weight:700;color:#1e3a8a;margin-bottom:6px">2. Những phẩm chất chủ yếu</div>
            <div style="overflow-x:auto;margin-bottom:14px">
                <table style="width:100%;border-collapse:collapse;font-size:0.83rem">
                    <thead>
                        <tr style="background:#dbeafe">
                            <th style="padding:6px 8px;border:1px solid #93c5fd;min-width:130px">Phẩm chất</th>
                            <th style="padding:6px 8px;border:1px solid #93c5fd;min-width:130px">Mức đạt được</th>
                            <th colspan="2" style="padding:6px 8px;border:1px solid #93c5fd">Nhận xét</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${window.PHAM_CHAT.map(pc => buildEvalRow('hb-pc-'+pc.replace(/\s/g,'_'), pc, pcData[pc]||{})).join('')}
                    </tbody>
                </table>
            </div>

            <!-- 3. Năng lực -->
            <div style="font-weight:700;color:#1e3a8a;margin-bottom:4px">3. Những năng lực cốt lõi</div>
            <div style="font-style:italic;font-size:0.8rem;color:#64748b;margin-bottom:6px">3.1. Những năng lực chung</div>
            <div style="overflow-x:auto;margin-bottom:10px">
                <table style="width:100%;border-collapse:collapse;font-size:0.83rem">
                    <thead><tr style="background:#dbeafe">
                        <th style="padding:6px 8px;border:1px solid #93c5fd;min-width:160px">Năng lực</th>
                        <th style="padding:6px 8px;border:1px solid #93c5fd;min-width:130px">Mức đạt được</th>
                        <th colspan="2" style="padding:6px 8px;border:1px solid #93c5fd">Nhận xét</th>
                    </tr></thead>
                    <tbody>
                        ${window.NANG_LUC_CHUNG.map(nl => buildEvalRow('hb-nlc-'+nl.replace(/\s/g,'_'), nl, nlcData[nl]||{})).join('')}
                    </tbody>
                </table>
            </div>
            <div style="font-style:italic;font-size:0.8rem;color:#64748b;margin-bottom:6px">3.2. Những năng lực đặc thù</div>
            <div style="overflow-x:auto;margin-bottom:14px">
                <table style="width:100%;border-collapse:collapse;font-size:0.83rem">
                    <thead><tr style="background:#dbeafe">
                        <th style="padding:6px 8px;border:1px solid #93c5fd;min-width:160px">Năng lực</th>
                        <th style="padding:6px 8px;border:1px solid #93c5fd;min-width:130px">Mức đạt được</th>
                        <th colspan="2" style="padding:6px 8px;border:1px solid #93c5fd">Nhận xét</th>
                    </tr></thead>
                    <tbody>
                        ${window.NANG_LUC_DAC_THU.map(nl => buildEvalRow('hb-nld-'+nl.replace(/\s/g,'_'), nl, nldData[nl]||{})).join('')}
                    </tbody>
                </table>
            </div>

            <!-- 4-6. Kết quả cuối năm -->
            <div style="background:#f8fafc;border-radius:8px;padding:12px;margin-bottom:14px;border:1px solid #e2e8f0">
                <div style="font-weight:700;color:#1e3a8a;margin-bottom:10px">4-6. Đánh giá kết quả & Khen thưởng</div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
                    <div>
                        <label style="font-size:0.8rem;color:#64748b;font-weight:600">4. Đánh giá kết quả giáo dục</label>
                        <select id="hb-danh-gia" class="form-control" style="font-size:0.88rem">
                            <option value="">-- Chọn --</option>
                            <option value="Hoàn thành xuất sắc">Hoàn thành xuất sắc</option>
                            <option value="Hoàn thành tốt">Hoàn thành tốt</option>
                            <option value="Hoàn thành">Hoàn thành</option>
                            <option value="Chưa hoàn thành">Chưa hoàn thành</option>
                        </select>
                    </div>
                    <div>
                        <label style="font-size:0.8rem;color:#64748b;font-weight:600">5. Khen thưởng</label>
                        <input type="text" id="hb-khen-thuong" class="form-control" readonly
                            style="font-size:0.88rem;background:#f8fafc;cursor:not-allowed"
                            placeholder="Tự động theo đánh giá kết quả giáo dục"
                            value="${khenThuongTheoDanhGia(ketQua.danhGia||'')}">
                    </div>
                </div>
                <div style="margin-top:10px">
                    <label style="font-size:0.8rem;color:#64748b;font-weight:600">6. Hoàn thành chương trình lớp học/tiểu học</label>
                    <input type="text" id="hb-hoan-thanh" class="form-control" style="font-size:0.88rem"
                        placeholder="VD: Hoàn thành chương trình lớp 3"
                        value="${ketQua.hoanThanh||''}">
                </div>
            </div>
        </div>`,
        width: '950px',
        showCancelButton: true,
        confirmButtonText: '<i class="fas fa-save"></i> Lưu học bạ',
        cancelButtonText: 'Đóng',
        confirmButtonColor: '#1e3a8a',
        didOpen: () => {
            // Fill existing values into selects
            subjects.forEach(sub => {
                const sc = subData[sub.name] || {};
                const mucEl = document.getElementById(`hb-muc-${sub.name}`);
                if (mucEl && sc.mucDat) mucEl.value = sc.mucDat;
                const nxEl  = document.getElementById(`hb-nx-${sub.name}`);
                if (nxEl && sc.nhanXet) nxEl.value = sc.nhanXet;
                if (sub.type === 'diem') {
                    const diemEl = document.getElementById(`hb-diem-${sub.name}`);
                    // Đọc cả diem (scores.js) và diemCN (học bạ cũ), kể cả điểm 0.
                    const diemVal = sc.diem ?? sc.diemCN ?? '';
                    if (diemEl && diemVal !== '') diemEl.value = diemVal;
                    attachScoreChangeHighlighter(diemEl, diemVal, sc);
                }
            });
            // Fill pham chat
            window.PHAM_CHAT.forEach(pc => {
                const key = 'hb-pc-'+pc.replace(/\s/g,'_');
                const d = pcData[pc] || {};
                const m = document.getElementById(`${key}-muc`);
                const n = document.getElementById(`${key}-nx`);
                if (m && d.mucDat) m.value = d.mucDat;
                if (n && d.nhanXet) n.value = d.nhanXet;
            });
            // Fill nang luc chung
            window.NANG_LUC_CHUNG.forEach(nl => {
                const key = 'hb-nlc-'+nl.replace(/\s/g,'_');
                const d = nlcData[nl] || {};
                const m = document.getElementById(`${key}-muc`);
                const n = document.getElementById(`${key}-nx`);
                if (m && d.mucDat) m.value = d.mucDat;
                if (n && d.nhanXet) n.value = d.nhanXet;
            });
            // Fill nang luc dac thu
            window.NANG_LUC_DAC_THU.forEach(nl => {
                const key = 'hb-nld-'+nl.replace(/\s/g,'_');
                const d = nldData[nl] || {};
                const m = document.getElementById(`${key}-muc`);
                const n = document.getElementById(`${key}-nx`);
                if (m && d.mucDat) m.value = d.mucDat;
                if (n && d.nhanXet) n.value = d.nhanXet;
            });

            // Ngân hàng nhận xét tự động theo khối cho biểu mẫu Học bạ.
            subjects.forEach(sub => bindCommentField({
                grade, kind:'subject', name:sub.name, seed:studentId,
                levelId:`hb-muc-${sub.name}`,
                scoreId:sub.type === 'diem' ? `hb-diem-${sub.name}` : '',
                commentId:`hb-nx-${sub.name}`,
            }));
            window.PHAM_CHAT.forEach(pc => {
                const key = 'hb-pc-'+pc.replace(/\s/g,'_');
                bindCommentField({
                    grade, kind:'quality', name:pc, seed:studentId,
                    levelId:`${key}-muc`, commentId:`${key}-nx`,
                    syncLevelFromScore:false,
                });
            });
            window.NANG_LUC_CHUNG.forEach(nl => {
                const key = 'hb-nlc-'+nl.replace(/\s/g,'_');
                bindCommentField({
                    grade, kind:'commonCompetency', name:nl, seed:studentId,
                    levelId:`${key}-muc`, commentId:`${key}-nx`,
                    syncLevelFromScore:false,
                });
            });
            window.NANG_LUC_DAC_THU.forEach(nl => {
                const key = 'hb-nld-'+nl.replace(/\s/g,'_');
                bindCommentField({
                    grade, kind:'specificCompetency', name:nl, seed:studentId,
                    levelId:`${key}-muc`, commentId:`${key}-nx`,
                    syncLevelFromScore:false,
                });
            });
            addCommentBankToolbar(Swal.getHtmlContainer() || document);

            // Fill kết quả và tự động đồng bộ danh hiệu khen thưởng.
            const dgEl = document.getElementById('hb-danh-gia');
            const ktEl = document.getElementById('hb-khen-thuong');
            if (dgEl && ketQua.danhGia) dgEl.value = ketQua.danhGia;

            const syncKhenThuong = () => {
                if (ktEl) ktEl.value = khenThuongTheoDanhGia(dgEl?.value || '');
            };
            if (dgEl) dgEl.addEventListener('change', syncKhenThuong);
            syncKhenThuong();
        },
        preConfirm: async () => {
            const liveAccess = await ensureScoreEntryAllowed(schoolYear, 'hk2');
            if (!liveAccess.allowed) return false;

            const now = typeof window.serverNow === 'function' ? window.serverNow() : Date.now();
            const yk = schoolYear.replace('-','_');
            const basePath = `hocba/${studentId}/${yk}`;
            const editorEmail = window.currentUser?.email || '';
            const editorUid = window.currentUser?.uid || '';
            const newSubjects = {};
            const auditUpdates = {};

            for (const sub of subjects) {
                const mucEl  = document.getElementById(`hb-muc-${sub.name}`);
                const nxEl   = document.getElementById(`hb-nx-${sub.name}`);
                const existingRaw = subData[sub.name] || {};
                const commonNext = {
                    mucDat:  mucEl?.value || '',
                    nhanXet: nxEl?.value || '',
                };

                if (sub.type === 'diem') {
                    const diemText = (document.getElementById(`hb-diem-${sub.name}`)?.value || '').trim();
                    const diemValue = diemText === '' ? null : Number(diemText);
                    if (diemValue !== null && (!Number.isFinite(diemValue) || diemValue < 0 || diemValue > 10)) {
                        Swal.showValidationMessage(`Điểm ${sub.name} phải nằm trong khoảng 0 đến 10`);
                        return false;
                    }

                    const existingNormalized = {
                        ...existingRaw,
                        diem: existingRaw.diem ?? existingRaw.diemCN,
                    };
                    const nextRecord = {
                        ...commonNext,
                        ...(diemValue !== null
                            ? { diem: diemValue, diemCN: diemValue }
                            : { diem: null, diemCN: null }),
                    };
                    const audited = buildAuditedScoreRecord(existingNormalized, nextRecord, {
                        now,
                        source: 'hocba',
                        studentId,
                        studentCode: student.code || student.id,
                        studentName: student.name,
                        className: student.classRoom || student.class || '',
                        subjectName: sub.name,
                        schoolYear,
                        mode: 'hk2',
                    });
                    if (diemValue === null) {
                        delete audited.record.diem;
                        delete audited.record.diemCN;
                    } else {
                        audited.record.diemCN = audited.record.diem;
                    }
                    newSubjects[sub.name] = audited.record;
                    Object.assign(auditUpdates, makeScoreAuditUpdate(audited.auditEntry));
                } else {
                    newSubjects[sub.name] = {
                        ...existingRaw,
                        ...commonNext,
                        __by: editorEmail,
                        __uid: editorUid,
                        __at: now,
                    };
                }
            }

            const newPhamChat = {};
            (window.PHAM_CHAT || []).forEach(pc => {
                const key = 'hb-pc-'+pc.replace(/\s/g,'_');
                newPhamChat[pc] = {
                    mucDat:  document.getElementById(`${key}-muc`)?.value  || '',
                    nhanXet: document.getElementById(`${key}-nx`)?.value   || '',
                };
            });

            const newNangLucChung = {};
            (window.NANG_LUC_CHUNG || []).forEach(nl => {
                const key = 'hb-nlc-'+nl.replace(/\s/g,'_');
                newNangLucChung[nl] = {
                    mucDat:  document.getElementById(`${key}-muc`)?.value  || '',
                    nhanXet: document.getElementById(`${key}-nx`)?.value   || '',
                };
            });

            const newNangLucDacThu = {};
            (window.NANG_LUC_DAC_THU || []).forEach(nl => {
                const key = 'hb-nld-'+nl.replace(/\s/g,'_');
                newNangLucDacThu[nl] = {
                    mucDat:  document.getElementById(`${key}-muc`)?.value  || '',
                    nhanXet: document.getElementById(`${key}-nx`)?.value   || '',
                };
            });

            const danhGia = document.getElementById('hb-danh-gia')?.value || '';
            const ketQuaMoi = {
                danhGia,
                khenThuong: khenThuongTheoDanhGia(danhGia),
                hoanThanh: document.getElementById('hb-hoan-thanh')?.value || '',
            };
            const saveData = {
                subjects:      newSubjects,
                phamChat:      newPhamChat,
                nangLucChung:  newNangLucChung,
                nangLucDacThu: newNangLucDacThu,
                chieuCao:      parseFloat(document.getElementById('hb-chieu-cao')?.value)||0,
                canNang:       parseFloat(document.getElementById('hb-can-nang')?.value)||0,
                nghiCoPhep:    parseInt(document.getElementById('hb-nghi-phep')?.value)||0,
                nghiKhongPhep: parseInt(document.getElementById('hb-nghi-kphep')?.value)||0,
                ketQua: ketQuaMoi,
                grade, schoolYear,
                updatedAt: now,
                updatedBy: editorEmail,
                updatedByUid: editorUid,
            };

            // Ghi đồng bộ học bạ + HK2 + nhật ký trong một lần update đa đường dẫn.
            const updates = { ...auditUpdates };
            updates[`${basePath}/subjects`] = newSubjects;
            updates[`${basePath}/phamChat`] = newPhamChat;
            updates[`${basePath}/nangLucChung`] = newNangLucChung;
            updates[`${basePath}/nangLucDacThu`] = newNangLucDacThu;
            updates[`${basePath}/chieuCao`] = saveData.chieuCao;
            updates[`${basePath}/canNang`] = saveData.canNang;
            updates[`${basePath}/nghiCoPhep`] = saveData.nghiCoPhep;
            updates[`${basePath}/nghiKhongPhep`] = saveData.nghiKhongPhep;
            updates[`${basePath}/ketQua`] = ketQuaMoi;
            updates[`${basePath}/grade`] = grade;
            updates[`${basePath}/schoolYear`] = schoolYear;
            updates[`${basePath}/updatedAt`] = now;
            updates[`${basePath}/updatedBy`] = editorEmail;
            updates[`${basePath}/updatedByUid`] = editorUid;
            updates[`${basePath}/hk2/__pc`] = newPhamChat;
            updates[`${basePath}/hk2/__nlc`] = newNangLucChung;
            updates[`${basePath}/hk2/__nld`] = newNangLucDacThu;
            updates[`${basePath}/hk2/__kq`] = ketQuaMoi;
            updates[`${basePath}/hk2/__syncFromHocba`] = true;
            subjects.forEach(sub => {
                updates[`${basePath}/hk2/${sub.name}`] = newSubjects[sub.name];
            });

            await window.update(window.ref(window.db), updates);
            window._promotionCache = null;
            return saveData;

        }
    }).then(result => {
        if (result.isConfirmed) {
            Swal.fire({ icon:'success', title:'Đã lưu học bạ!', timer:1500, showConfirmButton:false });
            renderHocBaTable(window._hocbaCurrentClass, currentSchoolYear());
        }
    });
};

// ══════════════════════════════════════════════════════════════════════════════
// XEM CHI TIẾT HỌC BẠ
// ══════════════════════════════════════════════════════════════════════════════
window.viewHocBaDetail = async function(studentId, schoolYear) {
    const rawStudent = hocbaFindStudent(studentId);
    if (!rawStudent) return;
    const student = hocbaStudentForYear(rawStudent, schoolYear, window._hocbaCurrentClass || '');
    const hbData  = await loadHocBaData(studentId, schoolYear);
    const grade   = gradeFromClass(student.classRoom || student.class);
    const subjects = getSubjects(grade);
    const promotionData = await loadPromotionStatus(schoolYear);
    const pKey = promotionData[studentId]?.status || '';
    const ps   = pKey ? PROMOTION_STATUS[pKey] : null;
    const ketQua = hbData.ketQua || hbData.hk2?.__kq || {};
    const viewSubjects = Object.keys(hbData.subjects || {}).length ? hbData.subjects : (hbData.hk2 || {});
    const viewPhamChat = Object.keys(hbData.phamChat || {}).length ? hbData.phamChat : (hbData.hk2?.__pc || {});
    const viewNLC = Object.keys(hbData.nangLucChung || {}).length ? hbData.nangLucChung : (hbData.hk2?.__nlc || {});
    const viewNLD = Object.keys(hbData.nangLucDacThu || {}).length ? hbData.nangLucDacThu : (hbData.hk2?.__nld || {});

    const buildReadRow = (label, data, isDiem) => {
        const d = data || {};
        // Đọc điểm từ cả 2 field, kể cả điểm 0; điểm đã sửa được hiển thị màu đỏ.
        const diemDisplay = d.diem ?? d.diemCN ?? '';
        const edited = isEditedScore(d);
        const auditText = scoreAuditSummary(d);
        return `<tr>
            <td style="padding:5px 8px;border:1px solid #e2e8f0;font-weight:500">${label}</td>
            <td style="padding:5px 8px;border:1px solid #e2e8f0;text-align:center">
                <span style="padding:2px 8px;border-radius:10px;font-size:0.8rem;font-weight:600;
                    background:${d.mucDat==='T'?'#dcfce7':d.mucDat==='H'?'#dbeafe':d.mucDat==='Đ'?'#dbeafe':d.mucDat==='C'?'#fee2e2':'#f1f5f9'};
                    color:${d.mucDat==='T'?'#16a34a':d.mucDat==='H'?'#2563eb':d.mucDat==='Đ'?'#2563eb':d.mucDat==='C'?'#dc2626':'#94a3b8'}">
                    ${d.mucDat || '—'}
                </span>
            </td>
            ${isDiem ? `<td style="padding:5px 8px;border:1px solid #e2e8f0;text-align:center;font-weight:700;color:${edited?'#dc2626':'#1d4ed8'}"
                title="${escapeHtml(auditText)}">
                ${diemDisplay!==''?diemDisplay:'—'}${edited?' <span style="font-size:.72rem">✎</span>':''}
                ${edited && auditText ? `<div style="font-size:.65rem;font-weight:400;color:#dc2626;margin-top:2px">${escapeHtml(auditText)}</div>` : ''}
            </td>` : '<td style="padding:5px 8px;border:1px solid #e2e8f0;text-align:center;color:#94a3b8">—</td>'}
            <td style="padding:5px 8px;border:1px solid #e2e8f0;font-size:0.82rem;color:#475569">${d.nhanXet||'—'}</td>
        </tr>`;
    };

    const dgColor = ketQua.danhGia==='Hoàn thành xuất sắc'?'#7c3aed':ketQua.danhGia==='Hoàn thành tốt'?'#16a34a':ketQua.danhGia==='Hoàn thành'?'#2563eb':ketQua.danhGia==='Chưa hoàn thành'?'#dc2626':'#94a3b8';
    const cpDisplay = hbData.nghiCoPhep ?? ((hbData.hk1?.__body?.nghiCoPhep || 0) + (hbData.hk2?.__body?.nghiCoPhep || 0));
    const kpDisplay = hbData.nghiKhongPhep ?? ((hbData.hk1?.__body?.nghiKhongPhep || 0) + (hbData.hk2?.__body?.nghiKhongPhep || 0));

    Swal.fire({
        title: '',
        html: `
        <div style="text-align:left;font-size:0.88rem">
            <!-- Trang bìa thu nhỏ -->
            <div style="background:#1e3a8a;color:white;border-radius:10px;padding:14px 18px;margin-bottom:16px">
                <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px">
                    <div>
                        <div style="font-size:1.1rem;font-weight:700">${student.name}</div>
                        <div style="opacity:0.85;font-size:0.82rem">
                            Lớp ${student.classRoom||student.class} &nbsp;|&nbsp; Mã: ${student.code||student.id} &nbsp;|&nbsp; Năm học: ${schoolYear}
                        </div>
                        <div style="font-size:0.8rem;margin-top:4px;opacity:0.75">
                            Chiều cao: ${hbData.chieuCao||'—'} cm &nbsp;|&nbsp;
                            Cân nặng: ${hbData.canNang||'—'} kg &nbsp;|&nbsp;
                            Nghỉ CP: ${cpDisplay} &nbsp;|&nbsp;
                            Nghỉ KP: ${kpDisplay}
                        </div>
                    </div>
                    <div style="text-align:center;background:rgba(255,255,255,0.15);border-radius:8px;padding:10px 16px">
                        <div style="font-size:1rem;font-weight:700">${ketQua.danhGia||'Chưa đánh giá'}</div>
                        <div style="font-size:0.75rem;opacity:0.85">Kết quả GD</div>
                        <div style="font-size:0.85rem;margin-top:4px">${ps?ps.icon+' '+ps.label:'⏳ Chưa xác nhận'}</div>
                    </div>
                </div>
            </div>

            <!-- Môn học -->
            <div style="font-weight:700;color:#1e3a8a;margin-bottom:6px">1. Các môn học và hoạt động giáo dục</div>
            <table style="width:100%;border-collapse:collapse;font-size:0.83rem;margin-bottom:14px">
                <thead><tr style="background:#dbeafe">
                    <th style="padding:6px 8px;border:1px solid #93c5fd">Môn học</th>
                    <th style="padding:6px 8px;border:1px solid #93c5fd;text-align:center">Mức đạt được</th>
                    <th style="padding:6px 8px;border:1px solid #93c5fd;text-align:center">Điểm KTĐK</th>
                    <th style="padding:6px 8px;border:1px solid #93c5fd">Nhận xét</th>
                </tr></thead>
                <tbody>
                    ${subjects.map(sub => buildReadRow(sub.name, viewSubjects?.[sub.name], sub.type==='diem')).join('')}
                </tbody>
            </table>

            <!-- Phẩm chất -->
            <div style="font-weight:700;color:#1e3a8a;margin-bottom:6px">2. Những phẩm chất chủ yếu</div>
            <table style="width:100%;border-collapse:collapse;font-size:0.83rem;margin-bottom:14px">
                <thead><tr style="background:#dbeafe">
                    <th style="padding:6px 8px;border:1px solid #93c5fd">Phẩm chất</th>
                    <th style="padding:6px 8px;border:1px solid #93c5fd;text-align:center">Mức đạt được</th>
                    <th style="padding:6px 8px;border:1px solid #93c5fd;text-align:center">—</th>
                    <th style="padding:6px 8px;border:1px solid #93c5fd">Nhận xét</th>
                </tr></thead>
                <tbody>
                    ${window.PHAM_CHAT.map(pc => buildReadRow(pc, viewPhamChat?.[pc], false)).join('')}
                </tbody>
            </table>

            <!-- Năng lực -->
            <div style="font-weight:700;color:#1e3a8a;margin-bottom:4px">3. Những năng lực cốt lõi</div>
            <div style="font-style:italic;font-size:0.8rem;color:#64748b;margin-bottom:4px">3.1. Năng lực chung</div>
            <table style="width:100%;border-collapse:collapse;font-size:0.83rem;margin-bottom:10px">
                <tbody>${window.NANG_LUC_CHUNG.map(nl => buildReadRow(nl, viewNLC?.[nl], false)).join('')}</tbody>
            </table>
            <div style="font-style:italic;font-size:0.8rem;color:#64748b;margin-bottom:4px">3.2. Năng lực đặc thù</div>
            <table style="width:100%;border-collapse:collapse;font-size:0.83rem;margin-bottom:14px">
                <tbody>${window.NANG_LUC_DAC_THU.map(nl => buildReadRow(nl, viewNLD?.[nl], false)).join('')}</tbody>
            </table>

            <!-- Kết quả -->
            <div style="background:#f8fafc;border-radius:8px;padding:12px;border:2px solid ${dgColor}30">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:0.85rem">
                    <div><strong>4. Đánh giá kết quả:</strong>
                        <span style="color:${dgColor};font-weight:700;margin-left:6px">${ketQua.danhGia||'—'}</span>
                    </div>
                    <div><strong>5. Khen thưởng:</strong> ${ketQua.khenThuong || khenThuongTheoDanhGia(ketQua.danhGia) || '—'}</div>
                    <div style="grid-column:span 2"><strong>6. Hoàn thành chương trình:</strong> ${ketQua.hoanThanh||'—'}</div>
                </div>
            </div>
        </div>`,
        width: '900px',
        confirmButtonText: '<i class="fas fa-file-word"></i> Tải Word',
        showDenyButton: true,
        denyButtonText: 'Đóng',
        denyButtonColor: '#64748b',
        preConfirm: () => openHocBaWordExportOptions(studentId, schoolYear)
    });
};

// ══════════════════════════════════════════════════════════════════════════════
// QUÁ TRÌNH HỌC TẬP 5 NĂM TIỂU HỌC
// ══════════════════════════════════════════════════════════════════════════════
window.viewQuyTrinhHocTap = async function(studentId) {
    // Nếu không có studentId thì chọn từ lớp đang xem
    if (!studentId) {
        const students = activeStudentValues()
            .filter(s => (s.classRoom||s.class||'') === window._hocbaCurrentClass)
            .sort((a,b) => {
                // Sắp xếp theo mã học sinh, fallback về id
                const codeA = (a.code || a.id || '').toString();
                const codeB = (b.code || b.id || '').toString();
                return codeA.localeCompare(codeB, 'vi', { numeric: true });
            });
        if (!students.length) {
            Swal.fire('Thông báo', 'Không có học sinh trong lớp này', 'info');
            return;
        }

        const { value: sid } = await Swal.fire({
            title: 'Chọn học sinh — ' + window._hocbaCurrentClass,
            input: 'select',
            inputOptions: Object.fromEntries(
                students.map(s => [s.id, `[${s.code||s.id}]  ${s.name}`])
            ),
            inputPlaceholder: 'Chọn học sinh...',
            showCancelButton: true,
            confirmButtonText: 'Xem quá trình',
            cancelButtonText: 'Hủy',
        });
        if (!sid) return;
        studentId = sid;
    }

    const student = window.localData.students[studentId];
    if (!student) return;

    Swal.fire({
        title: ``,
        html: `<div style="text-align:center;padding:20px">
            <i class="fas fa-spinner fa-spin" style="font-size:1.5rem;color:#1e3a8a"></i>
            <p>Đang tải toàn bộ quá trình học tập...</p>
        </div>`,
        showConfirmButton: false, allowOutsideClick: false
    });

    // Load tất cả năm học từ Firebase
    const snap = await window.get(window.ref(window.db, `hocba/${studentId}`));
    const allYearRaw  = snap.val() || {};
    // Lọc chỉ những key có dạng năm học YYYY_YYYY — bỏ qua key rác như 'hk1','grade','subjects'
    const YEAR_KEY_RE = /^\d{4}_\d{4}$/;
    const allYearData = Object.fromEntries(
        Object.entries(allYearRaw).filter(([k]) => YEAR_KEY_RE.test(k))
    );
    const yearKeys = Object.keys(allYearData).sort(); // '2022_2023', '2023_2024'...

    const buildYearCard = (yearKey) => {
        const yr = yearKey.replace('_','-');
        const d  = allYearData[yearKey] || {};

        // grade: ưu tiên d.grade, fallback tính từ lớp học sinh, hoặc từ yearKey
        const grade = d.grade || gradeFromClass(student.classRoom || student.class) || '?';

        // ketQua: đọc từ d.ketQua (hocba form) hoặc d.hk2?.__kq (scores.js)
        const ketQua = d.ketQua || d.hk2?.__kq || {};
        const dg = ketQua.danhGia || '';
        const dgColor = dg==='Hoàn thành xuất sắc'?'#7c3aed':dg==='Hoàn thành tốt'?'#16a34a':dg==='Hoàn thành'?'#2563eb':dg==='Chưa hoàn thành'?'#dc2626':'#94a3b8';

        // Chiều cao / cân nặng: đọc từ d hoặc d.hk2.__body (scores.js)
        const body = d.hk2?.__body || {};
        const chieuCao = d.chieuCao || body.chieuCao || '—';
        const canNang  = d.canNang  || body.canNang  || '—';

        return `
        <div style="background:white;border-radius:10px;border:2px solid ${dgColor}30;
                    padding:14px 18px;margin-bottom:12px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
                <div>
                    <span style="background:#1e3a8a;color:white;border-radius:6px;
                                 padding:3px 10px;font-size:0.82rem;font-weight:700">
                        Khối ${grade} — ${yr}
                    </span>
                    <span style="margin-left:8px;font-size:0.82rem;color:#64748b">
                        Chiều cao: ${chieuCao} cm &nbsp;|&nbsp; Cân nặng: ${canNang} kg
                    </span>
                </div>
                <div style="text-align:right">
                    ${dg ? `<span style="padding:3px 10px;border-radius:12px;font-size:0.82rem;
                        font-weight:700;background:${dgColor}15;color:${dgColor};
                        border:1px solid ${dgColor}40">${dg}</span>` : ''}
                </div>
            </div>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;font-size:0.8rem">
                <div><b>Khen thưởng:</b> ${ketQua.khenThuong || khenThuongTheoDanhGia(ketQua.danhGia) || '—'}</div>
                <div><b>Hoàn thành:</b> ${ketQua.hoanThanh||'—'}</div>
                <div><b>Cập nhật:</b> ${d.updatedBy||'—'}</div>
            </div>
            <div style="margin-top:8px;text-align:right">
                <button class="btn btn-sm btn-outline" onclick="viewHocBaDetail('${studentId}','${yr}');Swal.close()">
                    <i class="fas fa-eye"></i> Xem chi tiết
                </button>
                <button class="btn btn-sm btn-success" onclick="Swal.close();setTimeout(()=>openHocBaWordExportOptions('${studentId}','${yr}'),0)" style="margin-left:5px">
                    <i class="fas fa-file-word"></i> Tải Word
                </button>
            </div>
        </div>`;
    };

    // Bảng quá trình học tập (trang 1 của học bạ)
    const quyTrinhHTML = `
        <div style="text-align:left">
            <div style="background:#1e3a8a;color:white;border-radius:10px;padding:14px 18px;margin-bottom:16px">
                <div style="font-size:1.1rem;font-weight:700">${student.name}</div>
                <div style="opacity:0.85;font-size:0.82rem">
                    Mã: ${student.code||student.id} &nbsp;|&nbsp;
                    Ngày sinh: ${hocbaFormatVietnamDate(student.dob)||'—'} &nbsp;|&nbsp;
                    Dân tộc: ${student.ethnicity||'Kinh'} &nbsp;|&nbsp;
                    Quốc tịch: Việt Nam
                </div>
                <div style="opacity:0.75;font-size:0.8rem;margin-top:4px">
                    Nơi sinh: ${student.birthPlace||'—'} &nbsp;|&nbsp;
                    Quê quán: ${student.permanentAddress||'—'}
                </div>
                <div style="opacity:0.75;font-size:0.8rem;margin-top:2px">
                    Cha: ${student.dadName||'—'} &nbsp;|&nbsp; Mẹ: ${student.momName||'—'}
                </div>
            </div>

            <div style="font-weight:700;color:#1e3a8a;margin-bottom:10px;font-size:1rem">
                QUÁ TRÌNH HỌC TẬP — ${yearKeys.length} năm có dữ liệu
            </div>

            ${yearKeys.length > 0
                ? yearKeys.map(yk => buildYearCard(yk)).join('')
                : `<div style="text-align:center;color:#94a3b8;padding:30px;background:#f8fafc;border-radius:8px">
                    <i class="fas fa-book-open" style="font-size:2rem;margin-bottom:10px;display:block"></i>
                    Chưa có dữ liệu học bạ nào.<br>
                    <small>Nhập học bạ từng năm học bằng nút ✏️ trong bảng danh sách.</small>
                   </div>`
            }

            <!-- Tóm tắt 5 năm -->
            ${yearKeys.length > 0 ? `
            <div style="background:#f0fdf4;border-radius:10px;padding:14px;margin-top:16px;border:1px solid #bbf7d0">
                <div style="font-weight:700;color:#16a34a;margin-bottom:8px">📊 Tóm tắt 5 năm tiểu học</div>
                <table style="width:100%;border-collapse:collapse;font-size:0.82rem">
                    <thead><tr style="background:#bbf7d0">
                        <th style="padding:5px 8px;border:1px solid #86efac">Năm học</th>
                        <th style="padding:5px 8px;border:1px solid #86efac">Khối</th>
                        <th style="padding:5px 8px;border:1px solid #86efac">Đánh giá KQ GD</th>
                        <th style="padding:5px 8px;border:1px solid #86efac">Hoàn thành CT</th>
                        <th style="padding:5px 8px;border:1px solid #86efac">Khen thưởng</th>
                    </tr></thead>
                    <tbody>
                    ${yearKeys.map(yk => {
                        const yr = yk.replace('_','-');
                        const d  = allYearData[yk] || {};
                        const grade = d.grade || '?';
                        const kq  = d.ketQua || {};
                        return `<tr>
                            <td style="padding:5px 8px;border:1px solid #d1fae5">${yr}</td>
                            <td style="padding:5px 8px;border:1px solid #d1fae5;text-align:center">${grade}</td>
                            <td style="padding:5px 8px;border:1px solid #d1fae5">${kq.danhGia||'—'}</td>
                            <td style="padding:5px 8px;border:1px solid #d1fae5">${kq.hoanThanh||'—'}</td>
                            <td style="padding:5px 8px;border:1px solid #d1fae5">${kq.khenThuong || khenThuongTheoDanhGia(kq.danhGia) || '—'}</td>
                        </tr>`;
                    }).join('')}
                    </tbody>
                </table>
            </div>` : ''}
        </div>`;

    Swal.fire({
        title: '',
        html: quyTrinhHTML,
        width: '900px',
        confirmButtonText: '<i class="fas fa-file-excel"></i> Xuất Excel quá trình',
        showDenyButton: true,
        denyButtonText: 'Đóng',
        denyButtonColor: '#64748b',
        preConfirm: () => exportQuyTrinhExcel(studentId, student, allYearData)
    });
};

function exportQuyTrinhExcel(studentId, student, allYearData) {
    const rows = Object.keys(allYearData).filter(k => /^\d{4}_\d{4}$/.test(k)).sort().map(yk => {
        const yr = yk.replace('_','-');
        const d  = allYearData[yk] || {};
        const grade = d.grade || '?';
        const kq = d.ketQua || {};
        return {
            'Năm học': yr, 'Khối': grade,
            'Chiều cao': d.chieuCao||'', 'Cân nặng': d.canNang||'',
            'Nghỉ có phép': d.nghiCoPhep||0, 'Nghỉ không phép': d.nghiKhongPhep||0,
            'Đánh giá kết quả GD': kq.danhGia||'',
            'Khen thưởng': kq.khenThuong || khenThuongTheoDanhGia(kq.danhGia),
            'Hoàn thành CT': kq.hoanThanh||'',
        };
    });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'QuyTrinh');
    XLSX.writeFile(wb, `QuyTrinh_${student.name.replace(/\s+/g,'_')}.xlsx`);
}

// ── Promotion status change ────────────────────────────────────────────────────
window.changePromotionStatus = async function(studentId, selectEl) {
    const status  = selectEl.value;
    const student = window.localData.students[studentId];
    try {
        selectEl.disabled = true;
        const promoData = { status, updatedAt: (typeof window.serverNow === 'function' ? window.serverNow() : Date.now()), updatedBy: window.currentUser?.email||'', updatedByUid: window.currentUser?.uid||'' };
        const yearKey = currentSchoolYear().replace('-', '_');
        await window.set(window.ref(window.db, `promotionStatus/${yearKey}/${studentId}`), promoData);
        const stu = window.localData.students[studentId];
        // Cache theo năm học; chỉ dùng studentId làm khóa chuẩn từ V5.
        if (!window._promotionCache || typeof window._promotionCache !== 'object') window._promotionCache = {};
        if (!window._promotionCache[yearKey]) window._promotionCache[yearKey] = {};
        window._promotionCache[yearKey][studentId] = { status };
        const ps = status ? PROMOTION_STATUS[status] : null;
        selectEl.style.background  = ps ? ps.bg    : '#f1f5f9';
        selectEl.style.color       = ps ? ps.color  : '#94a3b8';
        selectEl.style.borderColor = ps ? ps.color+'40' : '#e2e8f0';
        selectEl.disabled = false;
        Swal.mixin({ toast:true, position:'top-end', showConfirmButton:false, timer:2000 })
            .fire({ icon:'success', title:`${student?.name}: ${ps?ps.icon+' '+ps.label:'Đã xóa'}` });
    } catch(e) {
        selectEl.disabled = false;
        Swal.fire('Lỗi', e.message, 'error');
    }
};

// ── Download Word: điền trực tiếp vào mẫu DOCX chuẩn TT27 ─────────────────────
// V5.13: không dựng HTML .doc nữa. Hệ thống tải file templates/pl-hoc-ba-tieu-hoc.docx
// và chỉ điền dữ liệu vào đúng mẫu, giữ nguyên bố cục gốc của mẫu Word.
window.openHocBaWordExportOptions = async function(studentId, schoolYear) {
    const student = window.localData.students[studentId];
    if (!student) return;

    const result = await Swal.fire({
        title: 'Xuất học bạ theo mẫu chuẩn',
        html: `
            <div style="text-align:left;font-size:0.92rem;line-height:1.5">
                <p><b>Học sinh:</b> ${escapeHtml(student.name || '')}</p>
                <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px;margin-top:8px">
                    <b>📄 Mẫu học bạ TT27 (.docx)</b>
                    <div style="color:#64748b;font-size:0.84rem;margin-top:3px">
                        Hệ thống sẽ dùng mẫu Word 2106, tạo học bạ đủ 5 năm: lớp 1 đến lớp 5, mỗi lớp có 2 trang đánh giá.
                    </div>
                </div>
                <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:10px;margin-top:8px">
                    <b>Lưu ý:</b> Bản xuất theo mẫu chuẩn không chèn nhật ký sửa điểm vào học bạ.
                    Nhật ký sửa điểm vẫn xem trong hệ thống.
                </div>
            </div>`,
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: '<i class="fas fa-file-word"></i> Xuất DOCX',
        cancelButtonText: 'Đóng',
        confirmButtonColor: '#16a34a',
    });

    if (result.isConfirmed) {
        await downloadHocBaWord(studentId, schoolYear, { mode: 'official' });
    }
};

async function loadHocBaWordSettings() {
    const fallback = {
        schoolName: '',
        schoolAddress: '',
        principalName: '',
        issuePlace: '...................',
        ward: '',
        district: '',
        province: '',
    };

    try {
        const snap = await window.get(window.ref(window.db, 'settings'));
        const s = snap.val() || {};
        return {
            schoolName: s.schoolName || s.tenTruong || s.school?.name || s.schoolInfo?.name || '',
            schoolAddress: s.schoolAddress || s.diaChiTruong || s.school?.address || s.schoolInfo?.address || '',
            principalName: s.principalName || s.hieuTruong || s.school?.principalName || s.schoolInfo?.principalName || '',
            issuePlace: s.issuePlace || s.diaDanh || s.location || s.commune || s.ward || s.city || fallback.issuePlace,
            ward: s.ward || s.xaPhuong || s.school?.ward || s.schoolInfo?.ward || '',
            district: s.district || s.huyenQuan || s.school?.district || s.schoolInfo?.district || '',
            province: s.province || s.tinhThanh || s.city || s.school?.province || s.schoolInfo?.province || '',
        };
    } catch (error) {
        console.warn('[Smart School V5.13] Không đọc được settings khi xuất học bạ:', error);
        return fallback;
    }
}

function wordSchoolYearKey(value) {
    return String(value || '').replace(/-/g, '_');
}

function wordSchoolYearFromKey(value) {
    return String(value || '').replace('_', '-');
}

function wordIsYearKey(value) {
    return /^\d{4}_\d{4}$/.test(String(value || ''));
}


function hocbaHasAcademicContent(data) {
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

function hocbaLegacyYearCandidate(raw) {
    if (!raw || typeof raw !== 'object') return {};
    const copyKeys = [
        'subjects','phamChat','nangLucChung','nangLucDacThu','ketQua',
        'hk1','hk2','ghk1','ghk2',
        'hk1_subjects','hk2_subjects','ghk1_subjects','ghk2_subjects',
        'hk1_phamChat','hk1_nangLucChung','hk1_nangLucDacThu',
        'hk2_phamChat','hk2_nangLucChung','hk2_nangLucDacThu',
        'ghk1_phamChat','ghk1_nangLucChung','ghk1_nangLucDacThu',
        'ghk2_phamChat','ghk2_nangLucChung','ghk2_nangLucDacThu',
        'chieuCao','canNang','nghiCoPhep','nghiKhongPhep',
        'grade','classRoom','class','className','schoolYear'
    ];
    const out = {};
    copyKeys.forEach(k => {
        if (raw[k] !== undefined && raw[k] !== null && raw[k] !== '') out[k] = raw[k];
    });
    return hocbaHasAcademicContent(out) ? out : {};
}

function hocbaMergeYearPreferExisting(base, fallback) {
    const b = (base && typeof base === 'object') ? { ...base } : {};
    const f = (fallback && typeof fallback === 'object') ? fallback : {};
    Object.entries(f).forEach(([key, value]) => {
        const emptyObject = b[key] && typeof b[key] === 'object' && Object.keys(b[key]).length === 0;
        if (b[key] === undefined || b[key] === null || b[key] === '' || emptyObject) {
            b[key] = value;
        }
    });
    return b;
}

function hocbaHistoryYearMap(student) {
    const result = {};
    const history = student?.schoolYearHistory || {};
    Object.entries(history || {}).forEach(([yearKey, item]) => {
        if (!wordIsYearKey(yearKey)) return;
        result[yearKey] = {
            schoolYear: wordSchoolYearFromKey(yearKey),
            yearKey,
            classRoom: item?.classRoom || item?.class || item?.className || '',
            class: item?.classRoom || item?.class || item?.className || '',
            className: item?.classRoom || item?.class || item?.className || '',
            grade: item?.grade || gradeFromClass(item?.classRoom || item?.class || item?.className || ''),
            promotionStatus: item?.promotionStatus || '',
            educationResult: item?.educationResult || '',
            recordedAt: item?.recordedAt || '',
            recordedBy: item?.recordedBy || ''
        };
    });
    return result;
}

function hocbaStudentAliasesForWord(studentId, student) {
    return [...new Set([
        studentId,
        student?._key,
        student?.key,
        student?.id,
        student?.code
    ].filter(Boolean).map(String))];
}

async function loadAllHocBaYearsForWord(studentId, currentSchoolYear, currentYearData, student = null) {
    const aliases = hocbaStudentAliasesForWord(studentId, student);
    let allRaw = {};
    let legacyCandidate = {};

    for (const alias of aliases) {
        try {
            const snap = await window.get(window.ref(window.db, `hocba/${alias}`));
            const data = snap.val() || {};

            const legacy = hocbaLegacyYearCandidate(data);
            if (hocbaHasAcademicContent(legacy)) {
                legacyCandidate = hocbaMergeYearPreferExisting(legacyCandidate, legacy);
            }

            Object.entries(data || {}).forEach(([yearKey, yearData]) => {
                if (!wordIsYearKey(yearKey) || !yearData || typeof yearData !== 'object') return;
                allRaw[yearKey] = hocbaMergeYearPreferExisting(allRaw[yearKey], yearData);
            });
        } catch (error) {
            console.warn(`[Smart School V5.32.9] Không đọc được học bạ alias ${alias}:`, error);
        }
    }

    const currentKey = wordSchoolYearKey(currentSchoolYear);
    const historyMap = hocbaHistoryYearMap(student);
    Object.entries(historyMap).forEach(([yearKey, historyData]) => {
        allRaw[yearKey] = hocbaMergeYearPreferExisting(allRaw[yearKey], historyData);
    });

    if (!allRaw[currentKey] && currentYearData) {
        allRaw[currentKey] = currentYearData;
    }

    // V5.32.9: Nếu năm cũ đã có dòng trong Quá trình học tập nhưng bảng kết quả trống,
    // dùng dữ liệu học bạ legacy/root-level để bù vào năm cũ gần nhất.
    // Trường hợp này xảy ra khi đã chuyển năm bằng bản cũ, dữ liệu HK2 còn nằm ở hocba/{studentId}/hk2
    // nhưng chưa được đưa vào hocba/{studentId}/2025_2026.
    if (hocbaHasAcademicContent(legacyCandidate)) {
        const oldYearKeys = Object.keys(allRaw)
            .filter(k => wordIsYearKey(k) && k !== currentKey)
            .sort();

        const preferredOldKey = oldYearKeys
            .filter(k => !hocbaHasAcademicContent(allRaw[k]))
            .pop() || oldYearKeys.pop();

        if (preferredOldKey && !hocbaHasAcademicContent(allRaw[preferredOldKey])) {
            allRaw[preferredOldKey] = hocbaMergeYearPreferExisting(allRaw[preferredOldKey], legacyCandidate);
            allRaw[preferredOldKey].backfilledFromLegacy = true;
            allRaw[preferredOldKey].backfilledAt = Date.now();
        }
    }

    const yearMap = {};
    Object.entries(allRaw || {}).forEach(([key, value]) => {
        if (wordIsYearKey(key) && value && typeof value === 'object') {
            yearMap[key] = value;
        }
    });

    if (!Object.keys(yearMap).length) {
        yearMap[currentKey] = currentYearData || {};
    }

    return yearMap;
}

function hocbaNormalizeText(value) {
    return String(value || '')
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd').replace(/Đ/g, 'D')
        .replace(/\s+/g, ' ')
        .trim().toLowerCase();
}

function hocbaCanonicalSubject(value) {
    let n = hocbaNormalizeText(value)
        .replace(/[().,;:…·]/g, ' ')
        .replace(/[\/_\-–—]/g, ' ')
        .replace(/&/g, ' va ')
        .replace(/\s+/g, ' ')
        .trim();

    // Chuẩn hóa các biến thể rất hay gặp trong học bạ.
    n = n
        .replace(/\bdia ly\b/g, 'dia li')
        .replace(/\bmy thuat\b/g, 'mi thuat')
        .replace(/\bki nang\b/g, 'ky nang')
        .replace(/\btieng anh\b/g, 'ngoai ngu 1')
        .replace(/\banh van\b/g, 'ngoai ngu 1')
        .replace(/\btnxh\b/g, 'tu nhien xa hoi')
        .replace(/\bls dl\b/g, 'lich su dia li')
        .replace(/\blsdl\b/g, 'lich su dia li')
        .replace(/deva/g, 'de va')
        .replace(/vande/g, 'van de')
        .replace(/giaiquyet/g, 'giai quyet');

    return n.replace(/\s+/g, ' ').trim();
}

function hocbaLooseSubjectKey(value) {
    return hocbaCanonicalSubject(value)
        .replace(/\bva\b/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function hocbaEquivalentSubject(a, b) {
    const ca = hocbaCanonicalSubject(a);
    const cb = hocbaCanonicalSubject(b);
    if (!ca || !cb) return false;
    if (ca === cb) return true;

    const la = hocbaLooseSubjectKey(a);
    const lb = hocbaLooseSubjectKey(b);
    if (la === lb) return true;

    return ca.includes(cb) || cb.includes(ca) || la.includes(lb) || lb.includes(la);
}

function hocbaTokenSet(value) {
    return new Set(
        hocbaLooseSubjectKey(value)
            .split(/\s+/)
            .filter(x => x && !['mon','hoc','va','hoat','dong'].includes(x))
    );
}

function hocbaSubjectTokenScore(a, b) {
    const A = hocbaTokenSet(a);
    const B = hocbaTokenSet(b);
    if (!A.size || !B.size) return 0;
    let hit = 0;
    A.forEach(x => { if (B.has(x)) hit++; });
    return hit / Math.max(A.size, B.size);
}

function hocbaMaybeDebugMissingSubject(label, data, canonicalLabel) {
    // V5.31.6: Không dùng console.warn cho trường hợp thiếu môn trong mẫu học bạ.
    // Đây thường là tình huống bình thường: mẫu Word có môn/ô trống nhưng học sinh
    // chưa có dữ liệu ở năm/lớp đó. Muốn xem chi tiết thì bật:
    // localStorage.setItem('DEBUG_HOCBA_MATCH','1')
    if (localStorage.getItem('DEBUG_HOCBA_MATCH') === '1') {
        console.debug('[Smart School V5.31.6] Không khớp môn khi xuất học bạ:', {
            label,
            canonicalLabel,
            available: Object.keys(data || {})
        });
    }
}



function hocbaEscapeRegex(value) {
    return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function hocbaFormatVietnamDate(value) {
    if (value === null || value === undefined || String(value).trim() === '') return '';
    const text = String(value).trim();

    const iso = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (iso) return `${String(iso[3]).padStart(2,'0')}/${String(iso[2]).padStart(2,'0')}/${iso[1]}`;

    const slash = text.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (slash) return `${String(slash[1]).padStart(2,'0')}/${String(slash[2]).padStart(2,'0')}/${slash[3]}`;

    const n = Number(value);
    if (Number.isFinite(n) && n > 1000000000) return new Date(n).toLocaleDateString('vi-VN');

    return text;
}

function hocbaGetYearBundle(data, student, schoolYear) {
    const className = data?.className || data?.classRoom || data?.class || student.classRoom || student.class || '';
    const grade = String(data?.grade || gradeFromClass(className) || gradeFromClass(student.classRoom || student.class) || '1');
    const subjects = getSubjects(grade);
    const wordSubjects = Object.keys(data?.subjects || {}).length ? data.subjects : (data?.hk2 || {});
    const wordPhamChat = Object.keys(data?.phamChat || {}).length ? data.phamChat : (data?.hk2?.__pc || {});
    const wordNLC = Object.keys(data?.nangLucChung || {}).length ? data.nangLucChung : (data?.hk2?.__nlc || {});
    const wordNLD = Object.keys(data?.nangLucDacThu || {}).length ? data.nangLucDacThu : (data?.hk2?.__nld || {});
    const ketQua = data?.ketQua || data?.hk2?.__kq || {};
    const body = data?.hk2?.__body || {};
    return {
        schoolYear,
        className,
        grade,
        subjects,
        wordSubjects,
        wordPhamChat,
        wordNLC,
        wordNLD,
        ketQua,
        chieuCao: data?.chieuCao || body.chieuCao || '',
        canNang: data?.canNang || body.canNang || '',
        nghiCoPhep: data?.nghiCoPhep ?? ((data?.hk1?.__body?.nghiCoPhep || 0) + (data?.hk2?.__body?.nghiCoPhep || 0)) ?? body.nghiCoPhep ?? '',
        nghiKhongPhep: data?.nghiKhongPhep ?? ((data?.hk1?.__body?.nghiKhongPhep || 0) + (data?.hk2?.__body?.nghiKhongPhep || 0)) ?? body.nghiKhongPhep ?? '',
    };
}

async function hocbaEnsureJsZip() {
    if (window.JSZip) return window.JSZip;

    await new Promise((resolve, reject) => {
        const existed = document.querySelector('script[data-smartschool-jszip="1"]');
        if (existed) {
            existed.addEventListener('load', resolve, { once:true });
            existed.addEventListener('error', reject, { once:true });
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
        script.async = true;
        script.dataset.smartschoolJszip = '1';
        script.onload = resolve;
        script.onerror = () => reject(new Error('Không tải được thư viện JSZip để xuất DOCX.'));
        document.head.appendChild(script);
    });

    if (!window.JSZip) throw new Error('JSZip chưa sẵn sàng.');
    return window.JSZip;
}

function hocbaXmlHelpers(xmlDoc) {
    const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

    const els = (node, localName) => Array.from(node.getElementsByTagNameNS(W, localName));
    const direct = (node, localName) => Array.from(node.childNodes).filter(n => n.nodeType === 1 && n.localName === localName);
    const textOf = node => els(node, 't').map(t => t.textContent || '').join('');

    const ensureTextNode = container => {
        let t = els(container, 't')[0];
        if (t) return t;

        let p = els(container, 'p')[0];
        if (!p) {
            p = xmlDoc.createElementNS(W, 'w:p');
            container.appendChild(p);
        }
        const r = xmlDoc.createElementNS(W, 'w:r');
        t = xmlDoc.createElementNS(W, 'w:t');
        t.setAttribute('xml:space', 'preserve');
        r.appendChild(t);
        p.appendChild(r);
        return t;
    };

    const setText = (node, value) => {
        const tList = els(node, 't');
        if (!tList.length) {
            ensureTextNode(node).textContent = value || '';
            return;
        }
        tList[0].setAttribute('xml:space', 'preserve');
        tList[0].textContent = value || '';
        for (let i = 1; i < tList.length; i++) tList[i].textContent = '';
    };

    const tables = () => els(xmlDoc, 'tbl');
    const rows = tbl => direct(tbl, 'tr');
    const cells = tr => direct(tr, 'tc');
    const cell = (tbl, r, c) => {
        const row = rows(tbl)[r];
        if (!row) return null;
        return cells(row)[c] || null;
    };
    const paragraphs = () => els(xmlDoc, 'p');

    const tcPr = tc => {
        let p = direct(tc, 'tcPr')[0];
        if (!p) {
            p = xmlDoc.createElementNS(W, 'w:tcPr');
            tc.insertBefore(p, tc.firstChild);
        }
        return p;
    };

    const removeVerticalMerge = tc => {
        if (!tc) return;
        const pr = tcPr(tc);
        direct(pr, 'vMerge').forEach(node => node.parentNode.removeChild(node));
    };

    const setCellText = (tc, value) => {
        if (!tc) return;
        // Giữ nguyên định dạng ô nhưng xóa các đoạn nội dung cũ để tránh text bị dính trong ô gộp.
        direct(tc, 'p').forEach(p => p.parentNode.removeChild(p));

        const p = xmlDoc.createElementNS(W, 'w:p');
        const r = xmlDoc.createElementNS(W, 'w:r');
        const t = xmlDoc.createElementNS(W, 'w:t');
        t.setAttribute('xml:space', 'preserve');
        t.textContent = value || '';
        r.appendChild(t);
        p.appendChild(r);
        tc.appendChild(p);
    };

    const splitMergedCommentColumn = (tbl, commentColIndex) => {
        if (!tbl) return;
        rows(tbl).slice(1).forEach(row => {
            const tc = cells(row)[commentColIndex];
            if (tc) removeVerticalMerge(tc);
        });
    };

    const body = () => els(xmlDoc, 'body')[0];

    const makePageBreak = () => {
        const p = xmlDoc.createElementNS(W, 'w:p');
        const r = xmlDoc.createElementNS(W, 'w:r');
        const br = xmlDoc.createElementNS(W, 'w:br');
        br.setAttributeNS(W, 'w:type', 'page');
        br.setAttribute('w:type', 'page');
        r.appendChild(br);
        p.appendChild(r);
        return p;
    };

    const isSectPr = node => node && node.nodeType === 1 && node.localName === 'sectPr';

    const hasTextboxDescendant = node =>
        els(node, 'txbxContent').length > 0 ||
        Array.from(node.getElementsByTagName('*')).some(n => n.localName === 'txbxContent');

    const isTextboxParentParagraph = node =>
        node && node.nodeType === 1 && node.localName === 'p' && hasTextboxDescendant(node);

    return { xmlDoc, W, els, direct, textOf, setText, setCellText, tables, rows, cells, cell, paragraphs, removeVerticalMerge, splitMergedCommentColumn, body, makePageBreak, isSectPr, hasTextboxDescendant, isTextboxParentParagraph };
}

function hocbaReplaceParagraphsByRules(H, rules) {
    const counters = {};
    H.paragraphs().forEach(p => {
        const raw = H.textOf(p).replace(/\u00a0/g, ' ');
        if (!raw.trim()) return;

        for (const rule of rules) {
            if (!raw.includes(rule.contains)) continue;
            const key = rule.key || rule.contains;
            counters[key] = (counters[key] || 0) + 1;
            const result = rule.replace(raw, counters[key]);
            if (result !== null && result !== undefined) {
                H.setText(p, result);
                return;
            }
        }
    });
}

function hocbaSubjectAliases() {
    return {
        'tieng viet': ['tieng viet', 'mon tieng viet', 'tv'],
        'toan': ['toan', 'mon toan'],
        'ngoai ngu 1': ['ngoai ngu 1', 'ngoai ngu', 'tieng anh', 'anh van', 'english'],
        'lich su va dia ly': ['lich su va dia ly', 'lich su va dia li', 'lich su dia li', 'lich su dia ly', 'lich su - dia li', 'lich su - dia ly', 'ls dl', 'lsdl'],
        'lich su va dia li': ['lich su va dia ly', 'lich su va dia li', 'lich su dia li', 'lich su dia ly', 'lich su - dia li', 'lich su - dia ly', 'ls dl', 'lsdl'],
        'khoa hoc': ['khoa hoc', 'mon khoa hoc'],
        'tin hoc': ['tin hoc', 'tin hoc va cong nghe tin hoc', 'tin hoc va cong nghe (tin hoc)', 'tin hoc cong nghe tin hoc'],
        'cong nghe': ['cong nghe', 'tin hoc va cong nghe cong nghe', 'tin hoc va cong nghe (cong nghe)', 'tin hoc cong nghe cong nghe'],
        'tin hoc va cong nghe tin hoc': ['tin hoc', 'tin hoc va cong nghe tin hoc', 'tin hoc va cong nghe (tin hoc)', 'tin hoc cong nghe tin hoc'],
        'tin hoc va cong nghe cong nghe': ['cong nghe', 'tin hoc va cong nghe cong nghe', 'tin hoc va cong nghe (cong nghe)', 'tin hoc cong nghe cong nghe'],
        'dao duc': ['dao duc', 'mon dao duc'],
        'tu nhien va xa hoi': ['tu nhien va xa hoi', 'tu nhien xa hoi', 'tnxh'],
        'giao duc the chat': ['giao duc the chat', 'the duc', 'gd the chat', 'gdtc'],
        'nghe thuat am nhac': ['nghe thuat am nhac', 'nghe thuat (am nhac)', 'am nhac'],
        'nghe thuat mi thuat': ['nghe thuat mi thuat', 'nghe thuat (mi thuat)', 'nghe thuat (my thuat)', 'mi thuat', 'my thuat'],
        'hoat dong trai nghiem': ['hoat dong trai nghiem', 'hdtn'],
        'tieng dan toc': ['tieng dan toc'],
    };
}

function hocbaFindRecordByLabel(label, data) {
    if (!data || !Object.keys(data || {}).length) return {};

    const normalizedLabel = hocbaNormalizeText(label).replace(/\.+/g, '').trim();
    const canonicalLabel = hocbaCanonicalSubject(label);
    const looseLabel = hocbaLooseSubjectKey(label);
    const aliasMap = hocbaSubjectAliases();

    const aliasCandidates = new Set([
        normalizedLabel,
        canonicalLabel,
        looseLabel,
        ...(aliasMap[normalizedLabel] || []),
        ...(aliasMap[canonicalLabel] || []),
        ...(aliasMap[looseLabel] || []),
    ]);

    // 1. Khớp tuyệt đối sau khi chuẩn hóa.
    for (const [name, record] of Object.entries(data || {})) {
        const n = hocbaNormalizeText(name);
        const c = hocbaCanonicalSubject(name);
        const l = hocbaLooseSubjectKey(name);
        if (aliasCandidates.has(n) || aliasCandidates.has(c) || aliasCandidates.has(l)) {
            return record || {};
        }
    }

    // 2. Khớp tương đương mềm: bỏ "và", đổi địa lý/địa lí, mĩ/mỹ, dấu gạch...
    for (const [name, record] of Object.entries(data || {})) {
        if (hocbaEquivalentSubject(label, name)) {
            return record || {};
        }
    }

    // 3. Khớp ngược với alias.
    for (const candidate of aliasCandidates) {
        for (const [name, record] of Object.entries(data || {})) {
            if (hocbaEquivalentSubject(candidate, name)) {
                return record || {};
            }
        }
    }

    // 4. Khớp theo điểm giao token, dùng cho các nhãn dài/khác mẫu nhưng cùng bản chất.
    // Ví dụ: "Nghệ thuật (Âm nhạc)" ↔ "Âm nhạc", "GDTC" ↔ "Giáo dục thể chất".
    let best = null;
    let bestScore = 0;
    for (const [name, record] of Object.entries(data || {})) {
        const score = Math.max(
            hocbaSubjectTokenScore(label, name),
            ...Array.from(aliasCandidates).map(candidate => hocbaSubjectTokenScore(candidate, name))
        );
        if (score > bestScore) {
            bestScore = score;
            best = record || {};
        }
    }
    if (best && bestScore >= 0.66) return best;

    hocbaMaybeDebugMissingSubject(label, data, canonicalLabel);
    return {};
}

function hocbaFindTraitRecord(label, data) {
    if (!data || !Object.keys(data || {}).length) return {};

    const target = hocbaCanonicalSubject(label);
    const looseTarget = hocbaLooseSubjectKey(label);
    for (const [name, record] of Object.entries(data || {})) {
        const n = hocbaCanonicalSubject(name);
        const l = hocbaLooseSubjectKey(name);
        if (n === target || l === looseTarget || n.includes(target) || target.includes(n) || l.includes(looseTarget) || looseTarget.includes(l)) {
            return record || {};
        }
    }

    if (localStorage.getItem('DEBUG_HOCBA_MATCH') === '1') {
        console.debug('[Smart School V5.31.6] Không khớp phẩm chất/năng lực khi xuất học bạ:', {
            label,
            available: Object.keys(data || {})
        });
    }
    return {};
}




function hocbaParagraphTextNodes(H, paragraph) {
    return H.els(paragraph, 't');
}

function hocbaParagraphRawText(H, paragraph) {
    return hocbaParagraphTextNodes(H, paragraph).map(t => t.textContent || '').join('');
}

function hocbaReplaceTextRangeInParagraph(H, paragraph, start, end, replacement) {
    const nodes = hocbaParagraphTextNodes(H, paragraph);
    let pos = 0;
    let inserted = false;

    nodes.forEach(t => {
        const oldText = t.textContent || '';
        const nodeStart = pos;
        const nodeEnd = pos + oldText.length;
        pos = nodeEnd;

        if (end <= nodeStart || start >= nodeEnd) return;

        const overlapStart = Math.max(start, nodeStart);
        const overlapEnd = Math.min(end, nodeEnd);
        const before = oldText.slice(0, Math.max(0, overlapStart - nodeStart));
        const after = oldText.slice(Math.max(0, overlapEnd - nodeStart));

        if (!inserted) {
            t.setAttribute('xml:space', 'preserve');
            t.textContent = before + replacement + (end <= nodeEnd ? after : '');
            inserted = true;
        } else {
            t.textContent = (start > nodeStart ? before : '') + (end < nodeEnd ? after : '');
        }
    });
}

function hocbaMakeFieldReplacement(placeholder, value) {
    const v = String(value ?? '').trim();
    if (!v) return null;

    // V5.23:
    // Nếu đã có dữ liệu thì bỏ toàn bộ dấu chấm của vùng trống.
    // Ví dụ: "Họ và tên học sinh: ................." -> "Họ và tên học sinh: Nguyễn Văn A "
    // Nếu chưa có dữ liệu thì không thay gì, dấu chấm của mẫu vẫn giữ nguyên.
    // Không thêm dấu chấm dư phía sau dữ liệu vì khi in sẽ nhìn rối và không đúng yêu cầu.
    return ` ${v} `;
}

function hocbaFindNextLabelIndex(text, labels, from) {
    let min = -1;
    labels.forEach(label => {
        const idx = text.indexOf(label, from);
        if (idx >= 0 && (min < 0 || idx < min)) min = idx;
    });
    return min;
}

function hocbaBuildFieldReplacements(text, fields) {
    const labels = fields.map(f => f.label).filter(Boolean);
    const replacements = [];

    fields.forEach(field => {
        if (!field || !field.label) return;
        const value = field.value;
        if (value === null || value === undefined || String(value).trim() === '') return;

        const labelIndex = text.indexOf(field.label);
        if (labelIndex < 0) return;

        const afterLabel = labelIndex + field.label.length;
        const nextIndex = hocbaFindNextLabelIndex(text, labels.filter(l => l !== field.label), afterLabel);
        const limit = nextIndex >= 0 ? nextIndex : text.length;
        const segment = text.slice(afterLabel, limit);

        const match = /[.…\.·•⋯]{2,}[\s.…\.·•⋯]*/u.exec(segment);
        let rangeStart;
        let rangeEnd;

        if (match) {
            rangeStart = afterLabel + match.index;
            rangeEnd = afterLabel + match.index + match[0].length;
        } else {
            const ws = /^\s*/u.exec(segment)?.[0] || '';
            rangeStart = afterLabel;
            rangeEnd = Math.min(limit, afterLabel + Math.max(1, ws.length));
        }

        const placeholder = text.slice(rangeStart, rangeEnd);
        const replacement = hocbaMakeFieldReplacement(placeholder || '........', value);
        if (!replacement) return;

        replacements.push({ start: rangeStart, end: rangeEnd, replacement });
    });

    return replacements.sort((a, b) => b.start - a.start);
}

function hocbaFillFieldsInParagraph(H, paragraph, fields) {
    const raw = hocbaParagraphRawText(H, paragraph);
    if (!raw.trim()) return false;
    const searchText = raw.replace(/\u00a0/g, ' ');
    const replacements = hocbaBuildFieldReplacements(searchText, fields);
    if (!replacements.length) return false;
    replacements.forEach(rep => hocbaReplaceTextRangeInParagraph(H, paragraph, rep.start, rep.end, rep.replacement));
    return true;
}

function hocbaFillYearHeaderParagraph(H, paragraph, settings, schoolYear) {
    const text = hocbaParagraphRawText(H, paragraph).replace(/\u00a0/g, ' ');
    if (!(text.includes('Trường:') && text.includes('Năm học'))) return false;
    return hocbaFillFieldsInParagraph(H, paragraph, [
        { label:'Trường:', value: settings.schoolName || '' },
        { label:'Năm học', value: schoolYear || '' },
    ]);
}

function hocbaCloneFirstRunProps(H, paragraph) {
    const firstR = H.direct(paragraph, 'r')[0];
    const rPr = firstR ? H.direct(firstR, 'rPr')[0] : null;
    return rPr ? rPr.cloneNode(true) : null;
}

function hocbaRewriteParagraphLines(H, paragraph, lines) {
    if (!paragraph || !Array.isArray(lines) || !lines.length) return;

    const rPrTemplate = hocbaCloneFirstRunProps(H, paragraph);
    const keep = H.direct(paragraph, 'pPr')[0] || null;

    Array.from(paragraph.childNodes).forEach(node => {
        if (keep && node === keep) return;
        paragraph.removeChild(node);
    });

    lines.forEach((line, idx) => {
        const r = H.xmlDoc.createElementNS(H.W, 'w:r');
        if (rPrTemplate) r.appendChild(rPrTemplate.cloneNode(true));
        const t = H.xmlDoc.createElementNS(H.W, 'w:t');
        t.setAttribute('xml:space', 'preserve');
        t.textContent = String(line ?? '');
        r.appendChild(t);
        paragraph.appendChild(r);

        if (idx < lines.length - 1) {
            const rBreak = H.xmlDoc.createElementNS(H.W, 'w:r');
            if (rPrTemplate) rBreak.appendChild(rPrTemplate.cloneNode(true));
            const br = H.xmlDoc.createElementNS(H.W, 'w:br');
            rBreak.appendChild(br);
            paragraph.appendChild(rBreak);
        }
    });
}

function hocbaPadLabelValue(label, value, width = 48) {
    const v = String(value ?? '');
    const minGap = ' ';
    const target = Math.max(label.length + 2, width);
    const dots = '.'.repeat(Math.max(3, target - label.length - v.length));
    return `${label} ${dots} ${v}`;
}

function hocbaPadTwoFields(label1, value1, label2, value2, totalLeft = 52) {
    const left = `${label1} ${String(value1 ?? '')}`;
    const gap = ' '.repeat(Math.max(4, totalLeft - left.length));
    return `${left}${gap}${label2} ${String(value2 ?? '')}`;
}

function hocbaShouldRewriteCoverParagraph(text) {
    return text.includes('Họ') && text.includes('Trường:') && text.includes('Xã') && text.includes('Huyện') && text.includes('Tỉnh') && !text.includes('Giới tính:');
}

function hocbaShouldRewriteInfoParagraph(text) {
    return text.includes('Họ') && text.includes('Giới tính:') && text.includes('Ngày') && text.includes('Dân tộc:') && text.includes('Quốc tịch:') && text.includes('Người giám hộ');
}

function hocbaShouldRewriteHeaderParagraph(text) {
    return text.includes('Họ') && text.includes('Lớp:') && text.includes('Chiều') && text.includes('Cân') && text.includes('Số ngày nghỉ không phép:');
}

function hocbaFillLabelInText(text, label, value) {
    const escaped = hocbaEscapeRegex(label);
    const safeValue = String(value ?? '');
    // Thay phần sau nhãn tới trước nhãn tiếp theo hoặc hết đoạn, giữ nguyên nhãn.
    const nextLabels = [
        'Trường:', 'Xã (Phường, Thị trấn):', 'Huyện (Thành phố, Quận, Thị xã):',
        'Tỉnh (Thành phố):', 'Giới tính:', 'Dân tộc:', 'Quốc tịch:', 'Nơi sinh:',
        'Quê quán:', 'Nơi ở hiện nay:', 'Họ và tên cha:', 'Họ và tên mẹ:',
        'Người giám hộ (nếu có):', 'Lớp:', 'Cân nặng:', 'Số ngày nghỉ không phép:'
    ].map(hocbaEscapeRegex).join('|');

    const re = new RegExp(`(${escaped})\\s*[.…\\.\\s]*(?=\\s*(?:${nextLabels})|$)`, 'u');
    if (re.test(text)) return text.replace(re, `$1 ${safeValue}`);

    // Trường hợp nhãn nằm giữa câu có dữ liệu cũ.
    const re2 = new RegExp(`(${escaped})\\s*[^\\n\\r]*?(?=\\s*(?:${nextLabels})|$)`, 'u');
    return text.replace(re2, `$1 ${safeValue}`);
}

function hocbaFillInlinePair(text, label, value) {
    const escaped = hocbaEscapeRegex(label);
    const re = new RegExp(`(${escaped})\\s*[.…\\.\\s]*`, 'u');
    return text.replace(re, `$1 ${String(value ?? '')} `);
}

function hocbaFillTemplateParagraphs(H, student, settings, bundle, schoolYear) {
    const currentClassName = student.classRoom || student.class || '';

    H.paragraphs().forEach(p => {
        if (H.isTextboxParentParagraph?.(p)) return;

        const text = hocbaParagraphRawText(H, p).replace(/\u00a0/g, ' ');
        if (!text.trim()) return;

        const infoFields = [
            { label:'Họ và tên học sinh:', value: student.name || '' },
            { label:'Trường:', value: settings.schoolName || '' },
            { label:'Xã (Phường, Thị trấn):', value: settings.ward || '' },
            { label:'Huyện (Thành phố, Quận, Thị xã):', value: settings.district || '' },
            { label:'Tỉnh (Thành phố):', value: settings.province || '' },
            { label:'Giới tính:', value: student.gender || '' },
            { label:'Ngày, tháng, năm sinh:', value: hocbaFormatVietnamDate(student.dob) },
            { label:'Dân tộc:', value: student.ethnicity || 'Kinh' },
            { label:'Quốc tịch:', value: student.nationality || 'Việt Nam' },
            { label:'Nơi sinh:', value: student.birthPlace || '' },
            { label:'Quê quán:', value: student.permanentAddress || '' },
            { label:'Nơi ở hiện nay:', value: student.currentAddress || student.address || student.permanentAddress || '' },
            { label:'Họ và tên cha:', value: student.dadName || '' },
            { label:'Họ và tên mẹ:', value: student.momName || '' },
            { label:'Người giám hộ (nếu có):', value: student.guardianName || '' },
            { label:'Lớp:', value: currentClassName },
            { label:'Chiều cao:', value: bundle.chieuCao || '' },
            { label:'Cân nặng:', value: bundle.canNang || '' },
            { label:'Số ngày nghỉ có phép:', value: bundle.nghiCoPhep ?? '' },
            { label:'Số ngày nghỉ không phép:', value: bundle.nghiKhongPhep ?? '' },
        ];

        if (hocbaFillFieldsInParagraph(H, p, infoFields)) return;
        if (hocbaFillYearHeaderParagraph(H, p, settings, schoolYear)) return;

        hocbaFillFieldsInParagraph(H, p, [
            { label:'4. Đánh giá kết quả giáo dục:', value: bundle.ketQua.danhGia || '' },
            { label:'5. Khen thưởng:', value: bundle.ketQua.khenThuong || khenThuongTheoDanhGia(bundle.ketQua.danhGia) || '' },
            { label:'6. Hoàn thành chương trình lớp học/chương trình tiểu học:', value: bundle.ketQua.hoanThanh || '' },
        ]);
    });
}

function hocbaSchoolYearStart(value) {
    const m = String(value || '').match(/^(\d{4})[-_](\d{4})$/);
    return m ? Number(m[1]) : null;
}

function hocbaYearLabelFromStart(startYear) {
    return Number.isFinite(startYear) ? `${startYear}-${startYear + 1}` : '';
}

function hocbaYearKeyFromStart(startYear) {
    return Number.isFinite(startYear) ? `${startYear}_${startYear + 1}` : '';
}

function hocbaHasMeaningfulYearData(data) {
    if (!data || typeof data !== 'object') return false;
    const meaningfulKeys = [
        'subjects', 'hk1', 'hk2', 'ghk1', 'ghk2',
        'phamChat', 'nangLucChung', 'nangLucDacThu', 'ketQua',
        'className', 'classRoom', 'class', 'grade',
        'schoolName', 'registryNo', 'soDangBo', 'enrollDate', 'admissionDate'
    ];
    return meaningfulKeys.some(key => {
        const value = data[key];
        if (value === null || value === undefined || value === '') return false;
        if (typeof value === 'object') return Object.keys(value).length > 0;
        return true;
    });
}

function hocbaTimestampToDateValue(value) {
    if (value === null || value === undefined || value === '') return '';
    const n = Number(value);
    if (Number.isFinite(n) && n > 1000000000) return n;
    return value;
}

function hocbaStudyClassFromHistoryRecord(record) {
    return record?.className || record?.classRoom || record?.class || record?.toClass || record?.newClass || '';
}

function hocbaStudyRowFromYearData(yearKey, data, student, currentSchoolYear) {
    const currentKey = wordSchoolYearKey(currentSchoolYear);
    const isCurrent = yearKey === currentKey;
    const className = data?.className || data?.classRoom || data?.class || (isCurrent ? (student.classRoom || student.class || '') : '');
    const grade = Number(data?.grade || gradeFromClass(className) || 0);
    if (!wordIsYearKey(yearKey) || !className || !grade) return null;

    return {
        grade,
        yearKey,
        yearLabel: wordSchoolYearFromKey(yearKey),
        data: data || {},
        className,
        hasData: true,
        hasProcessData: true,
        schoolName: data?.schoolName || '',
        registryNo: data?.registryNo || data?.soDangBo || '',
        enrollDate: data?.enrollDate || data?.admissionDate || '',
        source: 'hocba'
    };
}

function hocbaStudyRowsFromStudentHistory(student) {
    const rows = [];

    const historyMap = student?.schoolYearHistory || student?.yearHistory || student?.classHistoryByYear || {};
    Object.entries(historyMap || {}).forEach(([rawKey, record]) => {
        if (!record || typeof record !== 'object') return;
        const yearKey = wordSchoolYearKey(rawKey);
        if (!wordIsYearKey(yearKey)) return;

        const className = hocbaStudyClassFromHistoryRecord(record);
        const grade = Number(record.grade || gradeFromClass(className) || 0);
        if (!className || !grade) return;

        rows.push({
            grade,
            yearKey,
            yearLabel: wordSchoolYearFromKey(yearKey),
            data: record || {},
            className,
            hasData: true,
            hasProcessData: true,
            schoolName: record.schoolName || '',
            registryNo: record.registryNo || record.soDangBo || '',
            enrollDate: record.enrollDate || record.admissionDate || record.startedAt || record.recordedAt || '',
            source: 'student.schoolYearHistory'
        });
    });

    // transferHistory không đủ để tự đoán toàn bộ quá trình học tập, nhưng nếu bản ghi có schoolYear rõ ràng thì dùng.
    (Array.isArray(student?.transferHistory) ? student.transferHistory : []).forEach(record => {
        if (!record || typeof record !== 'object') return;
        const sy = record.schoolYear || record.year || record.targetSchoolYear || '';
        const yearKey = wordSchoolYearKey(sy);
        if (!wordIsYearKey(yearKey)) return;
        const className = record.toClass || record.classRoom || record.class || '';
        const grade = Number(record.grade || gradeFromClass(className) || 0);
        if (!className || !grade) return;

        rows.push({
            grade,
            yearKey,
            yearLabel: wordSchoolYearFromKey(yearKey),
            data: record || {},
            className,
            hasData: true,
            hasProcessData: true,
            schoolName: record.schoolName || '',
            registryNo: record.registryNo || record.soDangBo || '',
            enrollDate: record.enrollDate || record.admissionDate || record.date || record.at || '',
            source: 'student.transferHistory'
        });
    });

    return rows;
}

function hocbaBuildFiveYearPlans(student, schoolYear, allYearData, currentYearData) {
    const currentKey = wordSchoolYearKey(schoolYear);
    const currentClassName = student.classRoom || student.class || '';

    const byYear = new Map();

    // 1) Ưu tiên lịch sử học tập thật trong hồ sơ học sinh.
    hocbaStudyRowsFromStudentHistory(student).forEach(row => {
        if (row?.yearKey && !byYear.has(row.yearKey)) byYear.set(row.yearKey, row);
    });

    // 2) Lấy các năm học bạ thật đã tồn tại trong hocba/{studentId}/{yearKey}.
    Object.entries(allYearData || {}).forEach(([yearKey, data]) => {
        if (!wordIsYearKey(yearKey) || !hocbaHasMeaningfulYearData(data)) return;
        const row = hocbaStudyRowFromYearData(yearKey, data, student, schoolYear);
        if (!row) return;

        const old = byYear.get(yearKey) || {};
        byYear.set(yearKey, {
            ...old,
            ...row,
            data: { ...(old.data || {}), ...(data || {}) },
            schoolName: row.schoolName || old.schoolName || '',
            registryNo: row.registryNo || old.registryNo || '',
            enrollDate: row.enrollDate || old.enrollDate || '',
            source: old.source ? `${old.source}+hocba` : 'hocba'
        });
    });

    // 3) Nếu chỉ có hồ sơ hiện tại nhưng chưa có học bạ chi tiết, chỉ thêm năm hiện tại.
    // Không suy luận các năm quá khứ/tương lai.
    if (currentKey && currentClassName && !byYear.has(currentKey)) {
        const grade = Number(gradeFromClass(currentClassName) || 0);
        if (grade >= 1 && grade <= 5) {
            byYear.set(currentKey, {
                grade,
                yearKey: currentKey,
                yearLabel: wordSchoolYearFromKey(currentKey),
                data: currentYearData && typeof currentYearData === 'object' ? currentYearData : {},
                className: currentClassName,
                hasData: true,
                hasProcessData: true,
                schoolName: '',
                registryNo: student.registryNo || student.soDangBo || '',
                enrollDate: student.enrollDate || student.admissionDate || '',
                source: 'currentStudentProfile'
            });
        }
    }

    const processRows = Array.from(byYear.values())
        .filter(row => row?.hasProcessData && row.yearKey && row.className)
        .sort((a, b) => {
            const ay = hocbaSchoolYearStart(a.yearKey) || 0;
            const by = hocbaSchoolYearStart(b.yearKey) || 0;
            return ay - by;
        })
        .slice(0, 5);

    const plans = [1,2,3,4,5].map(grade => ({
        grade,
        yearKey: '',
        yearLabel: '',
        data: {},
        className: '',
        hasData: false,
        hasProcessData: false
    }));

    // Điền dữ liệu đánh giá vào đúng trang lớp 1→5 chỉ khi có dữ liệu thật.
    processRows.forEach(row => {
        const grade = Number(row.grade || gradeFromClass(row.className) || 0);
        if (grade < 1 || grade > 5) return;

        // Nếu học sinh ở lại lớp và có 2 năm cùng khối, giữ bản mới hơn cho trang đánh giá của khối đó.
        const old = plans[grade - 1];
        const oldStart = hocbaSchoolYearStart(old.yearKey) || 0;
        const newStart = hocbaSchoolYearStart(row.yearKey) || 0;
        if (!old.hasData || newStart >= oldStart) {
            plans[grade - 1] = {
                ...row,
                grade,
                data: row.data || {},
                hasData: true,
                hasProcessData: true
            };
        }
    });

    // Gắn danh sách quá trình học tập thật vào mảng kế hoạch.
    // Token P1..P5 sẽ dùng danh sách này, không dùng dữ liệu tự suy luận.
    plans.processRows = processRows;
    return plans;
}

function hocbaGetBundleForPlan(plan, student) {
    const data = plan?.data || {};
    const originalClass = student.classRoom || student.class || '';
    const tempStudent = { ...student, classRoom: plan.className || originalClass, class: plan.className || originalClass };
    const bundle = hocbaGetYearBundle({ ...data, grade: plan.grade, className: plan.className || data.className }, tempStudent, plan.yearLabel);
    bundle.grade = String(plan.grade);
    bundle.className = plan.className || bundle.className || '';
    bundle.schoolYear = plan.yearLabel || bundle.schoolYear || '';
    return bundle;
}

function hocbaIsAssessmentStartNode(H, node) {
    if (H.isTextboxParentParagraph?.(node)) return false;
    const txt = H.textOf(node).replace(/\u00a0/g, ' ');
    return txt.includes('Họ và tên học sinh:') && txt.includes('Lớp:') && txt.includes('Chiều cao:');
}

function hocbaFindAssessmentBlockNodes(H) {
    const body = H.body();
    const children = Array.from(body.childNodes).filter(n => n.nodeType === 1);
    const startIndex = children.findIndex(node => hocbaIsAssessmentStartNode(H, node));
    if (startIndex < 0) return null;

    let endIndex = children.length - 1;
    const sectIndex = children.findIndex((node, idx) => idx > startIndex && H.isSectPr?.(node));
    if (sectIndex >= 0) endIndex = sectIndex - 1;

    return {
        body,
        children,
        startIndex,
        endIndex,
        nodes: children.slice(startIndex, endIndex + 1)
    };
}

function hocbaExpandAssessmentPagesForFiveYears(H, gradePlans) {
    const block = hocbaFindAssessmentBlockNodes(H);
    if (!block || !block.nodes?.length) {
        console.warn('[Smart School V5.26] Không tìm thấy khối trang đánh giá để nhân bản đủ 5 năm.');
        return;
    }

    const { body, nodes, startIndex } = block;
    const referenceNode = block.children[startIndex];

    // Xóa khối đánh giá mẫu cũ, giữ lại bìa + quá trình học tập + section properties.
    nodes.forEach(node => {
        if (node.parentNode === body) body.removeChild(node);
    });

    const insertBeforeNode = Array.from(body.childNodes).find(n => n.nodeType === 1 && H.isSectPr?.(n)) || null;

    (gradePlans || []).forEach((plan, index) => {
        body.insertBefore(H.makePageBreak(), insertBeforeNode);
        nodes.forEach(node => {
            const clone = node.cloneNode(true);
            clone.setAttribute('data-smartschool-grade', String(plan.grade));
            body.insertBefore(clone, insertBeforeNode);
        });
    });
}

function hocbaGetAssessmentStartParagraphs(H) {
    return H.paragraphs().filter(p => hocbaIsAssessmentStartNode(H, p));
}

function hocbaGetAssessmentYearParagraphs(H) {
    return H.paragraphs().filter(p => {
        if (H.isTextboxParentParagraph?.(p)) return false;
        const txt = H.textOf(p).replace(/\u00a0/g, ' ');
        return txt.includes('Trường:') && txt.includes('Năm học');
    });
}

function hocbaGetResultParagraphGroups(H) {
    const paragraphs = H.paragraphs().filter(p => !H.isTextboxParentParagraph?.(p));
    const groups = [];
    for (let i = 0; i < paragraphs.length; i++) {
        const txt = H.textOf(paragraphs[i]).replace(/\u00a0/g, ' ');
        if (txt.includes('Đánh giá kết quả giáo dục:')) {
            groups.push({
                danhGia: paragraphs[i],
                khenThuong: paragraphs[i + 1] || null,
                hoanThanh: paragraphs.slice(i + 5).find(p => H.textOf(p).replace(/\u00a0/g, ' ').includes('Hoàn thành chương trình lớp học/chương trình tiểu học:')) || null,
            });
        }
    }
    return groups;
}

function hocbaFillAssessmentParagraphsByPlan(H, student, settings, gradePlans) {
    const startPs = hocbaGetAssessmentStartParagraphs(H);
    const yearPs = hocbaGetAssessmentYearParagraphs(H);
    const resultGroups = hocbaGetResultParagraphGroups(H);

    (gradePlans || []).forEach((plan, index) => {
        const bundle = hocbaGetBundleForPlan(plan, student);
        const className = plan.className || '';
        const schoolYear = plan.yearLabel || '';

        if (startPs[index]) {
            hocbaFillFieldsInParagraph(H, startPs[index], [
                { label:'Họ và tên học sinh:', value: student.name || '' },
                { label:'Lớp:', value: className },
                { label:'Chiều cao:', value: bundle.chieuCao || '' },
                { label:'Cân nặng:', value: bundle.canNang || '' },
                { label:'Số ngày nghỉ có phép:', value: bundle.nghiCoPhep ?? '' },
                { label:'Số ngày nghỉ không phép:', value: bundle.nghiKhongPhep ?? '' },
            ]);
        }

        if (yearPs[index]) {
            hocbaFillYearHeaderParagraph(H, yearPs[index], settings, schoolYear);
        }

        const group = resultGroups[index];
        if (group) {
            if (group.danhGia) hocbaFillFieldsInParagraph(H, group.danhGia, [
                { label:'4. Đánh giá kết quả giáo dục:', value: bundle.ketQua.danhGia || '' }
            ]);
            if (group.khenThuong) hocbaFillFieldsInParagraph(H, group.khenThuong, [
                { label:'5. Khen thưởng:', value: bundle.ketQua.khenThuong || khenThuongTheoDanhGia(bundle.ketQua.danhGia) || '' }
            ]);
            if (group.hoanThanh) hocbaFillFieldsInParagraph(H, group.hoanThanh, [
                { label:'6. Hoàn thành chương trình lớp học/chương trình tiểu học:', value: bundle.ketQua.hoanThanh || '' }
            ]);
        }
    });
}

function hocbaFindDocxTables(H) {
    const normalizeTbl = value => hocbaCanonicalSubject(value).replace(/\s+/g, ' ').trim();
    const hasAll = (tbl, terms) => {
        const txt = normalizeTbl(H.textOf(tbl));
        return terms.every(term => txt.includes(normalizeTbl(term)));
    };

    const tbls = H.tables();

    const processTable = tbls.find(tbl =>
        hasAll(tbl, ['Năm học', 'Lớp', 'Tên trường', 'Số đăng bộ'])
    );

    const subjectTables = tbls.filter(tbl =>
        hasAll(tbl, ['Môn học', 'Mức đạt', 'Điểm KT', 'Nhận xét'])
    );

    const qualityTables = tbls.filter(tbl =>
        hasAll(tbl, ['Phẩm chất', 'Mức đạt', 'Nhận xét'])
    );

    const competencyTables = tbls.filter(tbl =>
        hasAll(tbl, ['Năng lực', 'Mức đạt', 'Nhận xét'])
    );

    return {
        processTable,
        subjectTable: subjectTables[0] || null,
        qualityTable: qualityTables[0] || null,
        commonTable: competencyTables[0] || null,
        specialTable: competencyTables[1] || null,
        subjectTables,
        qualityTables,
        competencyTables,
        commonTables: competencyTables.filter((_, i) => i % 2 === 0),
        specialTables: competencyTables.filter((_, i) => i % 2 === 1),
    };
}

function hocbaCleanTemplateLabel(label) {
    return String(label || '')
        .replace(/[.…]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function hocbaCellHasVMergeContinue(H, tc) {
    if (!tc) return false;
    const pr = H.direct(tc, 'tcPr')[0];
    if (!pr) return false;
    const vm = H.direct(pr, 'vMerge')[0];
    if (!vm) return false;
    const val = vm.getAttributeNS(H.W, 'val') || vm.getAttribute('w:val') || vm.getAttribute('val') || '';
    return !val || val === 'continue';
}

function hocbaShouldJoinSubjectContinuation(label) {
    const n = hocbaCanonicalSubject(label);
    if (!n) return false;
    if (/^[.….\s]+$/.test(String(label || ''))) return true;
    if (/^\(.+\)$/.test(String(label || '').trim())) return true;
    return ['trai nghiem'].includes(n);
}

function hocbaCombineSubjectLabel(first, nextLabels) {
    const all = [first, ...(nextLabels || [])]
        .map(x => String(x || '').replace(/[.…]+/g, '').trim())
        .filter(Boolean);

    let label = all.join(' ').replace(/\s+/g, ' ').trim();

    // Mẫu tách thành "Tin học và Công nghệ" + "(Tin học)".
    label = label
        .replace(/^Tin học và Công nghệ\s+\(Tin học\)$/i, 'Tin học')
        .replace(/^Tin học và Công nghệ\s+\(Công nghệ\)$/i, 'Công nghệ')
        .replace(/^Nghệ thuật\s+\(Âm nhạc\)$/i, 'Nghệ thuật (Âm nhạc)')
        .replace(/^Nghệ thuật\s+\(Mĩ thuật\)$/i, 'Nghệ thuật (Mĩ thuật)')
        .replace(/^Hoạt động\s+trải nghiệm$/i, 'Hoạt động trải nghiệm');

    return label;
}

function hocbaFillSubjectTableForBundle(H, table, bundle) {
    if (!table) return;
    const set = (tc, value) => H.setCellText ? H.setCellText(tc, value || '') : H.setText(tc, value || '');

    H.splitMergedCommentColumn?.(table, 3);
    const rows = H.rows(table).slice(1);

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const cs = H.cells(row);
        let label = hocbaCleanTemplateLabel(H.textOf(cs[0] || {}));
        if (!label) continue;

        const nextLabels = [];
        let j = i + 1;
        while (j < rows.length) {
            const nextCells = H.cells(rows[j]);
            const nextLabel = hocbaCleanTemplateLabel(H.textOf(nextCells[0] || {}));
            const continuesLevel = hocbaCellHasVMergeContinue(H, nextCells[1]) || hocbaCellHasVMergeContinue(H, nextCells[2]);
            if (continuesLevel && hocbaShouldJoinSubjectContinuation(nextLabel)) {
                nextLabels.push(nextLabel);
                j++;
            } else {
                break;
            }
        }

        const combinedLabel = hocbaCombineSubjectLabel(label, nextLabels);
        const record = hocbaFindRecordByLabel(combinedLabel, bundle.wordSubjects);
        const score = record?.diem ?? record?.diemCN ?? '';

        if (cs[1]) set(cs[1], record?.mucDat || '');
        if (cs[2]) set(cs[2], score === null || score === undefined ? '' : String(score));
        if (cs[3]) set(cs[3], record?.nhanXet || '');

        for (let k = i + 1; k < j; k++) {
            const subCells = H.cells(rows[k]);
            if (subCells[3]) set(subCells[3], '');
        }

        i = j - 1;
    }
}

function hocbaFillTraitTableForBundle(H, table, data) {
    if (!table) return;
    const set = (tc, value) => H.setCellText ? H.setCellText(tc, value || '') : H.setText(tc, value || '');

    H.splitMergedCommentColumn?.(table, 2);
    H.rows(table).slice(1).forEach(row => {
        const cs = H.cells(row);
        const label = hocbaCleanTemplateLabel(H.textOf(cs[0] || {}));
        if (!label) return;
        const record = hocbaFindTraitRecord(label, data);
        if (cs[1]) set(cs[1], record?.mucDat || '');
        if (cs[2]) set(cs[2], record?.nhanXet || '');
    });
}

function hocbaFillTemplateTables(H, bundle, settings, student, allYearData, schoolYear, gradePlans = null) {
    const set = (tc, value) => H.setCellText ? H.setCellText(tc, value || '') : H.setText(tc, value || '');
    const T = hocbaFindDocxTables(H);

    const plans = gradePlans || hocbaBuildFiveYearPlans(student, schoolYear, allYearData, allYearData?.[wordSchoolYearKey(schoolYear)] || {});

    // Bảng QUÁ TRÌNH HỌC TẬP: luôn hiện đủ 5 dòng lớp 1 → lớp 5.
    if (T.processTable) {
        plans.forEach((plan, i) => {
            const data = plan.data || {};
            const rowIndex = i + 1;
            const values = [
                plan.yearLabel || '',
                plan.className || '',
                data.schoolName || settings.schoolName || '',
                data.registryNo || student.registryNo || student.soDangBo || '',
                hocbaFormatVietnamDate(data.enrollDate || data.admissionDate || (plan.hasData ? '' : '')),
            ];
            values.forEach((value, c) => {
                const tc = H.cell(T.processTable, rowIndex, c);
                if (tc) set(tc, value || '');
            });
        });
    } else {
        console.warn('[Smart School V5.26] Không tìm thấy bảng Quá trình học tập trong mẫu DOCX.');
    }

    plans.forEach((plan, index) => {
        const b = hocbaGetBundleForPlan(plan, student);
        hocbaFillSubjectTableForBundle(H, T.subjectTables[index], b);
        hocbaFillTraitTableForBundle(H, T.qualityTables[index], b.wordPhamChat);
        hocbaFillTraitTableForBundle(H, T.commonTables[index], b.wordNLC);
        hocbaFillTraitTableForBundle(H, T.specialTables[index], b.wordNLD);
    });
}


function hocbaXmlEscape(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function hocbaCleanTokenValue(value, fallback = '') {
    const v = String(value ?? '').trim();
    return v || fallback || '';
}

function hocbaInferClassForGrade(student, grade, plan) {
    if (plan?.className) return plan.className;
    const currentClass = String(student.classRoom || student.class || '');
    const m = currentClass.match(/^([1-5])\s*[\/_-]?\s*(.+)$/);
    if (m && m[2]) return `${grade}/${m[2].replace(/^\//,'')}`;
    return '';
}

function hocbaTokenSubjectList() {
    return [
        ['TV', 'Tiếng Việt'], ['TOAN', 'Toán'], ['NN1', 'Ngoại ngữ 1'],
        ['LSDL', 'Lịch sử và Địa lí'], ['KHOAHOC', 'Khoa học'],
        ['TINHOC', 'Tin học'], ['CONGNGHE', 'Công nghệ'], ['DAODUC', 'Đạo đức'],
        ['TNXH', 'Tự nhiên và Xã hội'], ['GDTC', 'Giáo dục thể chất'],
        ['AMNHAC', 'Nghệ thuật (Âm nhạc)'], ['MITHUAT', 'Nghệ thuật (Mĩ thuật)'],
        ['HDTN', 'Hoạt động trải nghiệm'], ['TDT', 'Tiếng dân tộc'],
    ];
}

function hocbaTokenQualityList() {
    return [['YEUNUOC','Yêu nước'], ['NHANAI','Nhân ái'], ['CHAMCHI','Chăm chỉ'], ['TRUNGTHUC','Trung thực'], ['TRACHNHIEM','Trách nhiệm']];
}

function hocbaTokenCommonCompetencyList() {
    return [['TUTU','Tự chủ và tự học'], ['GTHT','Giao tiếp và hợp tác'], ['GQVDS','Giải quyết vấn đề và sáng tạo']];
}

function hocbaTokenSpecialCompetencyList() {
    return [['NGONNGU','Ngôn ngữ'], ['TINHTOAN','Tính toán'], ['KHOAHOCNL','Khoa học'], ['CONGNGHENL','Công nghệ'], ['TINHOCNL','Tin học'], ['THAMMI','Thẩm mĩ'], ['THECHAT','Thể chất']];
}

function hocbaBuildTokenMap(student, settings, gradePlans) {
    const tokens = {};
    const put = (key, value, fallback = '') => { tokens[`{{${key}}}`] = hocbaCleanTokenValue(value, fallback); };

    put('STUDENT_NAME', student.name || '');
    put('SCHOOL_NAME', settings.schoolName || '');
    put('WARD', settings.ward || '');
    put('DISTRICT', settings.district || '');
    put('PROVINCE', settings.province || '');
    put('GENDER', student.gender || '');
    put('DOB', hocbaFormatVietnamDate(student.dob));
    put('ETHNICITY', student.ethnicity || 'Kinh');
    put('NATIONALITY', student.nationality || 'Việt Nam');
    put('BIRTH_PLACE', student.birthPlace || '');
    put('PERMANENT_ADDRESS', student.permanentAddress || '');
    put('CURRENT_ADDRESS', student.currentAddress || student.address || student.permanentAddress || '');
    put('DAD_NAME', student.dadName || '');
    put('MOM_NAME', student.momName || '');
    put('GUARDIAN_NAME', student.guardianName || '');
    put('ISSUE_PLACE', settings.issuePlace || '................');

    const processRows = Array.isArray(gradePlans?.processRows)
        ? gradePlans.processRows
        : (gradePlans || []).filter(plan => plan?.hasProcessData || plan?.hasData);

    for (let i = 0; i < 5; i++) {
        const row = processRows[i] || {};
        const data = row.data || {};
        const rowNo = i + 1;

        put(`P${rowNo}_YEAR`, row.yearLabel || '');
        put(`P${rowNo}_CLASS`, row.className || '');
        put(`P${rowNo}_SCHOOL`, row.schoolName || data.schoolName || (row.yearLabel ? (settings.schoolName || '') : ''));
        put(`P${rowNo}_REGNO`, row.registryNo || data.registryNo || data.soDangBo || student.registryNo || student.soDangBo || '');
        put(`P${rowNo}_DATE`, hocbaFormatVietnamDate(row.enrollDate || data.enrollDate || data.admissionDate || ''));
    }

    (gradePlans || []).forEach((plan, idx) => {
        const row = idx + 1;
        const g = plan.grade;
        const b = hocbaGetBundleForPlan(plan, student);
        const cls = plan.hasData ? (plan.className || '') : '';
        const data = plan.data || {};

        put(`G${g}_NAME`, student.name || '');
        put(`G${g}_CLASS`, cls || '');
        put(`G${g}_HEIGHT`, b.chieuCao || '');
        put(`G${g}_WEIGHT`, b.canNang || '');
        put(`G${g}_ABSENCE_ALLOWED`, b.nghiCoPhep ?? '');
        put(`G${g}_ABSENCE_NOT_ALLOWED`, b.nghiKhongPhep ?? '');
        put(`G${g}_SCHOOL`, data.schoolName || settings.schoolName || '');
        put(`G${g}_YEAR`, plan.yearLabel || '');
        put(`G${g}_RESULT`, b.ketQua.danhGia || '');
        put(`G${g}_REWARD`, b.ketQua.khenThuong || khenThuongTheoDanhGia(b.ketQua.danhGia) || '');
        put(`G${g}_COMPLETE`, b.ketQua.hoanThanh || '');

        hocbaTokenSubjectList().forEach(([key, label]) => {
            const rec = hocbaFindRecordByLabel(label, b.wordSubjects) || {};
            const score = rec.diem ?? rec.diemCN ?? '';
            put(`G${g}_${key}_LEVEL`, rec.mucDat || '');
            put(`G${g}_${key}_SCORE`, score === null || score === undefined ? '' : String(score));
            put(`G${g}_${key}_COMMENT`, rec.nhanXet || '');
        });
        hocbaTokenQualityList().forEach(([key, label]) => {
            const rec = hocbaFindTraitRecord(label, b.wordPhamChat) || {};
            put(`G${g}_${key}_LEVEL`, rec.mucDat || '');
            put(`G${g}_${key}_COMMENT`, rec.nhanXet || '');
        });
        hocbaTokenCommonCompetencyList().forEach(([key, label]) => {
            const rec = hocbaFindTraitRecord(label, b.wordNLC) || {};
            put(`G${g}_${key}_LEVEL`, rec.mucDat || '');
            put(`G${g}_${key}_COMMENT`, rec.nhanXet || '');
        });
        hocbaTokenSpecialCompetencyList().forEach(([key, label]) => {
            const rec = hocbaFindTraitRecord(label, b.wordNLD) || {};
            put(`G${g}_${key}_LEVEL`, rec.mucDat || '');
            put(`G${g}_${key}_COMMENT`, rec.nhanXet || '');
        });
    });

    // Fill remaining grade tokens for safety.
    for (let g = 1; g <= 5; g++) {
        put(`G${g}_NAME`, student.name || '');
    }
    return tokens;
}

async function hocbaReplaceTokensInZip(zip, tokenMap) {
    const files = Object.keys(zip.files).filter(name => /^word\/.*\.xml$/.test(name));
    for (const name of files) {
        const file = zip.file(name);
        if (!file) continue;
        let xml = await file.async('text');
        for (const [token, rawValue] of Object.entries(tokenMap || {})) {
            const safe = hocbaXmlEscape(rawValue);
            xml = xml.split(token).join(safe);
        }
        // Any unfilled token should become blank, never leak {{TOKEN}} into the official file.
        xml = xml.replace(/\{\{[A-Z0-9_]+\}\}/g, '');
        zip.file(name, xml);
    }
}

async function hocbaCreateDocxFromTemplate(studentId, schoolYear) {
    const JSZip = await hocbaEnsureJsZip();
    const student = window.localData.students[studentId];
    const currentData = await loadHocBaData(studentId, schoolYear);
    const allYearData = await loadAllHocBaYearsForWord(studentId, schoolYear, currentData, student);
    const settings = await loadHocBaWordSettings();

    const templateUrl = 'templates/hoc-ba-in-thuc-te-5-nam-v5.24.docx?v=5.26.0';
    const response = await fetch(templateUrl);
    if (!response.ok) {
        throw new Error('Không tải được file mẫu học bạ in thực tế: ' + templateUrl);
    }

    const zip = await JSZip.loadAsync(await response.arrayBuffer());
    const documentFile = zip.file('word/document.xml');
    if (!documentFile) throw new Error('File mẫu DOCX không hợp lệ: thiếu word/document.xml');

    const gradePlans = hocbaBuildFiveYearPlans(student, schoolYear, allYearData, currentData);
    const tokenMap = hocbaBuildTokenMap(student, settings, gradePlans);
    await hocbaReplaceTokensInZip(zip, tokenMap);

    return zip.generateAsync({
        type: 'blob',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
}

window.downloadHocBaWord = async function(studentId, schoolYear, options = {}) {
    const student = window.localData.students[studentId];
    if (!student) return;

    Swal.fire({
        title: 'Đang tạo học bạ...',
        html: `<div style="padding:14px;text-align:center">
            <i class="fas fa-spinner fa-spin" style="font-size:1.7rem;color:#16a34a"></i>
            <p style="margin-top:10px;color:#64748b">Đang tạo học bạ Word bản in thực tế, bố cục ổn định.</p>
        </div>`,
        allowOutsideClick: false,
        showConfirmButton: false,
    });

    try {
        const blob = await hocbaCreateDocxFromTemplate(studentId, schoolYear);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `HocBa_${student.name.replace(/\s+/g,'_')}_${schoolYear.replace('-','_')}_MauTT27.docx`;
        a.click();
        URL.revokeObjectURL(url);

        Swal.fire({
            icon: 'success',
            title: 'Đã tải học bạ theo mẫu chuẩn!',
            timer: 2000,
            showConfirmButton: false,
        });
    } catch (error) {
        console.error('[Smart School V5.13] Xuất DOCX theo mẫu lỗi:', error);
        Swal.fire('Lỗi xuất học bạ', error.message || String(error), 'error');
    }
};

// ── Xuất Excel tổng hợp lớp ───────────────────────────────────────────────────
window.exportAllHocBaClass = async function() {
    const cls = window._hocbaCurrentClass;
    const sy  = currentSchoolYear();
    const students = (await hocbaStudentsForYear(sy))
        .filter(s => hocbaClassForYear(s, sy) === cls);
    if (!students.length) { Swal.fire('Thông báo','Không có học sinh','warning'); return; }

    Swal.fire({ title:'Đang xuất...', allowOutsideClick:false, didOpen:()=>Swal.showLoading() });

    const promotionData = await loadPromotionStatus();
    const grade    = gradeFromClass(cls);
    const subjects = getSubjects(grade);

    const rows = await Promise.all(students.map(async (s,i) => {
        const hb = await loadHocBaData(s.id, sy);
        const kq = hb.ketQua || {};
        const pKey = promotionData[s.id]?.status||'';
        const ps   = pKey ? PROMOTION_STATUS[pKey] : null;
        const row  = { 'STT':i+1, 'Mã HS':s.code||s.id, 'Họ tên':s.name, 'Lớp':cls };
        const exportSubjects = Object.keys(hb.subjects || {}).length ? hb.subjects : (hb.hk2 || {});
        subjects.forEach(sub => {
            const sc = exportSubjects?.[sub.name] || {};
            row[`${sub.name} - Mức`]  = sc.mucDat  || '';
            if (sub.type==='diem') {
                row[`${sub.name} - Điểm`] = sc.diem ?? sc.diemCN ?? '';
                row[`${sub.name} - Nhật ký sửa`] = isEditedScore(sc) ? scoreAuditSummary(sc) : '';
            }
            row[`${sub.name} - NX`]   = sc.nhanXet || '';
        });
        window.PHAM_CHAT.forEach(pc => {
            row[`PC ${pc}`] = hb.phamChat?.[pc]?.mucDat || '';
        });
        row['Đánh giá KQ GD'] = kq.danhGia    || '';
        row['Khen thưởng']    = kq.khenThuong || khenThuongTheoDanhGia(kq.danhGia);
        row['Lên lớp']        = ps ? ps.label   : 'Chưa xác nhận';
        return row;
    }));

    const safeSheet = `HocBa_${cls}`.replace(/[\/\\\?*\[\]:]/g,'_').substring(0,31);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), safeSheet);
    XLSX.writeFile(wb, `HocBa_Lop${cls.replace('/','_')}_${sy.replace('-','_')}.xlsx`);
    Swal.fire({ icon:'success', title:'Xuất thành công!', timer:2000, showConfirmButton:false });
};

window.syncHocBaAbsence = async function(studentId, schoolYear) {
    const rawStudent = hocbaFindStudent(studentId);
    if (!rawStudent) return;
    const student = hocbaStudentForYear(rawStudent, schoolYear, window._hocbaCurrentClass || '');
    const cls = student.classRoom || student.class || '';
    const sid = student.code || student.id || studentId;

    let cp = 0, kp = 0;
    // Thử lấy từ tổng HK1 + HK2 đã lưu trong học bạ trước
    const hbData = await loadHocBaData(studentId, schoolYear);
    const hk1Body = hbData.hk1?.__body || {};
    const hk2Body = hbData.hk2?.__body || {};
    const sumHkCP = (hk1Body.nghiCoPhep || 0) + (hk2Body.nghiCoPhep || 0);
    const sumHkKP = (hk1Body.nghiKhongPhep || 0) + (hk2Body.nghiKhongPhep || 0);

    if (sumHkCP > 0 || sumHkKP > 0) {
        cp = sumHkCP;
        kp = sumHkKP;
    } else if (typeof window.getAttendanceAbsenceSummary === 'function') {
        const att = await window.getAttendanceAbsenceSummary(schoolYear, cls, sid, 'all');
        cp = att.coPhep;
        kp = att.khongPhep;
    }

    const npEl = document.getElementById('hb-nghi-phep');
    const nkEl = document.getElementById('hb-nghi-kphep');
    if (npEl) npEl.value = cp;
    if (nkEl) nkEl.value = kp;

    const toast = Swal.mixin({
        toast: true, position: 'top-end', showConfirmButton: false, timer: 1800
    });
    toast.fire({ icon: 'info', title: `Đã đồng bộ cả năm: ${cp} có phép, ${kp} không phép` });
};

