import { activeStudentValues, isActiveStudent, compareStudentNames } from "./studentstatus.js?v=5.26.1";
// ═══════════════════════════════════════════════════════
// scores.js — Quản lý Điểm TT27/2020 (V5.5 import an toàn)
// - Mỗi HK chỉ 1 điểm duy nhất (không TX/GK/CK)
// - Cuối học kỳ: các môn có type="diem" vẫn nhập điểm theo cấu hình từng khối
// - Cuối năm tổng hợp kết quả giáo dục theo TT27, không tính điểm trung bình
// - Đồng bộ 2 chiều với hocba
// DB path: hocba/{studentId}/{year_}/hk1 hoặc hk2
// ═══════════════════════════════════════════════════════

import { getScoreEntryStatus, ensureScoreEntryAllowed, scoreWindowBannerHtml,
         buildAuditedScoreRecord, makeScoreAuditUpdate, isEditedScore,
         scoreAuditSummary, attachScoreChangeHighlighter, escapeHtml }
    from "./scoreaccess.js";
import { bindCommentField, addCommentBankToolbar, getCommentSuggestions }
    from "./commentbank.js?v=5.6.1";

window._scoreCurrentClass = '';
window._scoreSemester     = 'hk1';
// mode: 'hk1' | 'ghk1' (giữa HK1) | 'hk2' | 'ghk2' (giữa HK2)
window._scoreMode         = 'hk1';
console.info('[Smart School V5.34.0] finalized score templates loaded');

// ── Utils ─────────────────────────────────────────────────────────────────────
function syNow() {
    // Dùng năm học admin đã set, fallback về tính tự động
    if (window._currentSchoolYear) return window._currentSchoolYear;
    const n = new Date(), y = n.getFullYear();
    return n.getMonth() >= 7 ? `${y}-${y+1}` : `${y-1}-${y}`;
}
function gradeOf(cls) {
    const m = String(cls || '').match(/(?:^|\D)([1-5])(?:\D|$)/); return m ? m[1] : '1';
}

function scoreYearKey(sy = syNow()) {
    return String(sy || '').replace('-', '_');
}

function scoreClassOf(student, sy = syNow()) {
    const current = student?.classRoom || student?.class || '';
    if (window._isViewingArchivedYear) {
        const yk = scoreYearKey(sy);
        const h = student?.schoolYearHistory?.[yk] || {};
        return h.classRoom || h.class || h.className || current;
    }
    return current;
}

function scoreGradeOfStudent(student, sy = syNow()) {
    return gradeOf(scoreClassOf(student, sy) || student?.classRoom || student?.class || '');
}

function scoreArchiveBannerHtml(sy) {
    if (!window._isViewingArchivedYear) return '';
    return `<div style="background:#fff7ed;border-left:4px solid #f97316;border-radius:6px;padding:10px 14px;margin-bottom:12px;font-size:0.875rem;color:#9a3412">
        <i class="fas fa-eye"></i>
        <strong>Đang xem lại năm học ${escapeHtml(sy)}.</strong>
        Màn hình điểm ở chế độ xem dữ liệu cũ; không nhập/sửa điểm tại năm đã lưu trữ.
        <button class="btn btn-sm btn-outline" style="margin-left:8px" onclick="clearViewSchoolYear()">Quay về năm hiện tại</button>
    </div>`;
}

function getSubs(grade)  { return window.PRIMARY_SUBJECTS?.[grade] || window.PRIMARY_SUBJECTS?.['1'] || []; }
function diemSubs(grade) { return getSubs(grade).filter(s => s.type === 'diem'); }
function nxSubs(grade)   { return getSubs(grade).filter(s => s.type === 'nhanxet'); }

// ── Tự động xác định danh hiệu khen thưởng theo đánh giá KQGD ───────────────
function khenThuongTheoDanhGia(danhGia) {
    if (danhGia === 'Hoàn thành xuất sắc') return 'Học sinh Xuất sắc';
    if (danhGia === 'Hoàn thành tốt') return 'Học sinh Tiêu biểu hoàn thành tốt trong học tập và rèn luyện';
    return '';
}

// Giữa HK chỉ khối 3-5 và chỉ 3 môn: Tiếng Việt, Toán, Ngoại ngữ 1/Tiếng Anh.
function ghkHasNumericScore(grade, subjectName) {
    if (typeof window.isGHKScoreSubject === 'function') {
        return window.isGHKScoreSubject(grade, subjectName);
    }
    const normalized = String(subjectName || '').normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
    return ['3','4','5'].includes(String(grade))
        && ['tieng viet','toan','ngoai ngu 1','tieng anh'].includes(normalized);
}
function ghkDiemSubs(grade) {
    return getSubs(grade).filter(s => ghkHasNumericScore(grade, s.name));
}

// DB refs
function dbRef(path)          { return window.ref(window.db, path); }
function hkPath(id, sy, hk)   { return `hocba/${id}/${sy.replace('-','_')}/${hk}`; }
function yearPath(id, sy)      { return `hocba/${id}/${sy.replace('-','_')}`; }
// Giữa HK lưu tại: hocba/{id}/{year}/ghk1 hoặc ghk2
function ghkPath(id, sy, ghk) { return `hocba/${id}/${sy.replace('-','_')}/${ghk}`; }
async function loadGHK(id, sy, ghk) {
    const s = await window.get(dbRef(ghkPath(id, sy, ghk)));
    return s.val() || {};
}
// isGHK: kiểm tra mode có phải giữa HK không
function isGHKMode(mode) { return mode === 'ghk1' || mode === 'ghk2'; }
// Lấy HK tương ứng từ mode
function hkOfMode(mode) { return (mode==='hk2'||mode==='ghk2') ? 'hk2' : 'hk1'; }
async function loadHK(id, sy, hk) {
    const s = await window.get(dbRef(hkPath(id, sy, hk)));
    return s.val() || {};
}

// ── Đánh giá kết quả giáo dục cuối năm theo TT27 ─────────────────────────────
// Không tính điểm trung bình. Điểm kiểm tra định kỳ được xét riêng từng môn.
function _scoreValue(record) {
    const raw = record?.diem ?? record?.diemCN;
    if (raw === '' || raw === null || raw === undefined) return null;
    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
}

function _resultStyle(label) {
    const styles = {
        'Hoàn thành xuất sắc': { color:'#7c3aed', bg:'#ede9fe' },
        'Hoàn thành tốt':      { color:'#16a34a', bg:'#dcfce7' },
        'Hoàn thành':          { color:'#2563eb', bg:'#dbeafe' },
        'Chưa hoàn thành':     { color:'#dc2626', bg:'#fee2e2' },
    };
    return { loai:label || '—', ...(styles[label] || { color:'#94a3b8', bg:'#f1f5f9' }) };
}

function xepLoai(hk2, grade) {
    const confirmed = hk2?.__kq?.danhGia || '';
    if (confirmed) return _resultStyle(confirmed);
    if (!hk2 || !Object.keys(hk2).length) return _resultStyle('');

    const subjects = getSubs(grade);
    const scoreSubjects = diemSubs(grade);
    const subjectLevels = subjects.map(s => hk2?.[s.name]?.mucDat || '');
    const scores = scoreSubjects.map(s => _scoreValue(hk2?.[s.name]));

    const pcLevels = (window.PHAM_CHAT || []).map(x => hk2?.__pc?.[x]?.mucDat || '');
    const nlcLevels = (window.NANG_LUC_CHUNG || []).map(x => hk2?.__nlc?.[x]?.mucDat || '');
    const nldLevels = (window.NANG_LUC_DAC_THU || []).map(x => hk2?.__nld?.[x]?.mucDat || '');
    const traitLevels = [...pcLevels, ...nlcLevels, ...nldLevels];

    // Chỉ tự gợi ý khi đã nhập đủ dữ liệu; kết quả giáo dục do giáo viên xác nhận.
    const complete = subjectLevels.length > 0
        && subjectLevels.every(Boolean)
        && scores.length === scoreSubjects.length
        && scores.every(v => v !== null)
        && traitLevels.length > 0
        && traitLevels.every(Boolean);
    if (!complete) return _resultStyle('');

    const allSubjectsT = subjectLevels.every(v => v === 'T');
    const allSubjectsCompleted = subjectLevels.every(v => v === 'T' || v === 'H');
    const allTraitsT = traitLevels.every(v => v === 'T');
    const allTraitsReached = traitLevels.every(v => v === 'T' || v === 'Đ');
    const allScoresAtLeast = threshold => scores.every(v => v >= threshold);

    if (allSubjectsT && allTraitsT && allScoresAtLeast(9)) return _resultStyle('Hoàn thành xuất sắc');
    if (allSubjectsT && allTraitsT && allScoresAtLeast(7)) return _resultStyle('Hoàn thành tốt');
    if (allSubjectsCompleted && allTraitsReached && allScoresAtLeast(5)) return _resultStyle('Hoàn thành');
    return _resultStyle('Chưa hoàn thành');
}

const MUC_COLOR = {
    'T':  { color:'#16a34a', bg:'#dcfce7' },  // Tốt (môn & phẩm chất)
    'H':  { color:'#2563eb', bg:'#dbeafe' },  // Hoàn thành (môn học)
    'Đ':  { color:'#2563eb', bg:'#dbeafe' },  // Đạt (phẩm chất/năng lực)
    'C':  { color:'#dc2626', bg:'#fee2e2' },  // Cần cố gắng
    '':   { color:'#94a3b8', bg:'#f1f5f9' },
};



// ══════════════════════════════════════════════════════════════════════════════
// V5.27.0 — Giữa kỳ có đánh giá năng lực cốt lõi
// - GHK1/GHK2 lưu thêm __nlc và __nld
// - File mẫu Excel GHK có PC/NLC/NLĐ; import không nhầm cột trùng tên môn học
// ══════════════════════════════════════════════════════════════════════════════
function _v527TraitProp(kind) {
    if (kind === 'quality') return '__pc';
    if (kind === 'commonCompetency') return '__nlc';
    if (kind === 'specificCompetency') return '__nld';
    return '__trait';
}
function _v527TraitYearProp(kind) {
    if (kind === 'quality') return 'phamChat';
    if (kind === 'commonCompetency') return 'nangLucChung';
    if (kind === 'specificCompetency') return 'nangLucDacThu';
    return 'traits';
}
function _v527TraitTitle(kind) {
    if (kind === 'quality') return 'Phẩm chất';
    if (kind === 'commonCompetency') return 'Năng lực chung';
    if (kind === 'specificCompetency') return 'Năng lực đặc thù';
    return 'Đánh giá';
}
function _v527DomKey(kind, name) {
    return `${kind}-${String(name || '')}`
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd').replace(/Đ/g, 'D')
        .replace(/[^a-zA-Z0-9_-]+/g, '_');
}
function _v527DefKey(def) {
    return def.kind === 'subject' ? `SUB:${def.name}` : `${def.prefix}:${def.name}`;
}
function _v527GhkTraitDefs() {
    return typeof _v55TraitDefs === 'function' ? _v55TraitDefs() : [
        ...(window.PHAM_CHAT || []).map(name => ({ name, kind:'quality', prefix:'PC' })),
        ...(window.NANG_LUC_CHUNG || []).map(name => ({ name, kind:'commonCompetency', prefix:'NLC' })),
        ...(window.NANG_LUC_DAC_THU || []).map(name => ({ name, kind:'specificCompetency', prefix:'NLĐ' })),
    ];
}
function _v527GhkCompletion(data, subs) {
    const g = data || {};
    const traits = _v527GhkTraitDefs();
    const subjectFilled = (subs || []).filter(sub => g?.[sub.name]?.mucDat).length;
    const traitFilled = traits.filter(t => g?.[_v527TraitProp(t.kind)]?.[t.name]?.mucDat).length;
    return { filled: subjectFilled + traitFilled, total: (subs || []).length + traits.length };
}
function _v527ReadTraitInput(row, colMap, def, loai) {
    if (def.kind === 'subject') return _v55Cell(row, colMap, def.name, loai);
    return _v55TraitCell(row, colMap, def.prefix, def.name, loai);
}
function _v527RowHasAnyGHKInput(row, colMap, subs, traits) {
    return [
        ...(subs || []).map(s => ({ ...s, kind:'subject' })),
        ...(traits || []),
    ].some(def => ['Điểm KTĐK','Mức đạt được','Nhận xét'].some(loai => !_v55IsBlank(_v527ReadTraitInput(row, colMap, def, loai))));
}

// ══════════════════════════════════════════════════════════════════════════════
// RENDER TRANG ĐIỂM
// ══════════════════════════════════════════════════════════════════════════════
export async function renderScores() {
    let all = activeStudentValues();
    const sy  = syNow();

    if (window.userRole === 'teacher') {
        const assignedClass = window.teacherClass || '';
        const assignedKey   = window.teacherClassKey || '';
        all = all.filter(s =>
            (assignedClass && (scoreClassOf(s, sy) === assignedClass || s.classRoom === assignedClass || s.class === assignedClass)) ||
            (assignedKey && s.currentClassKey === assignedKey)
        );
    }

    const classes = [...new Set(all.map(s => scoreClassOf(s, sy)).filter(Boolean))]
        .sort((a,b) => a.localeCompare(b,'vi'));
    if (!window._scoreCurrentClass || !classes.includes(window._scoreCurrentClass))
        window._scoreCurrentClass = classes[0] || '';
    const hk  = window._scoreSemester || 'hk1';
    const isHK2 = hk === 'hk2';
    const activeMode = window._scoreMode || hk;
    const accessStatus = await getScoreEntryStatus(sy, activeMode);
    window._scoreAccessStatus = accessStatus;

    document.getElementById('content').innerHTML = `
        <div style="margin-bottom:14px;display:flex;gap:10px;flex-wrap:wrap;align-items:center">
            <span style="font-size:1rem;font-weight:700;color:#1e293b">
                <i class="fas fa-star"></i> Quản lý Điểm — TT27/2020
            </span>
            <span style="background:#dbeafe;color:#1d4ed8;padding:4px 12px;
                         border-radius:20px;font-size:0.82rem;font-weight:600">${sy}</span>

            <!-- Toggle HK + Giữa HK -->
            <div style="display:flex;background:#f1f5f9;border-radius:8px;padding:3px;gap:2px;flex-wrap:wrap">
                ${[
                    { key:'hk1',  label:'Cuối HK1',   badge:'' },
                    { key:'ghk1', label:'Giữa HK1',   badge:'GK' },
                    { key:'hk2',  label:'Cuối HK2',   badge:'★' },
                    { key:'ghk2', label:'Giữa HK2',   badge:'GK' },
                ].map(b => `
                    <button onclick="switchScoreMode('${b.key}')"
                        class="btn btn-sm ${window._scoreMode===b.key?'btn-primary':''}"
                        style="${window._scoreMode!==b.key?'background:transparent;color:#64748b;border:none':''}">
                        ${b.label}
                        ${b.badge?`<span style="font-size:0.68rem;opacity:0.8;margin-left:2px">${b.badge}</span>`:''}
                    </button>`).join('')}
            </div>

            <div style="margin-left:auto;display:flex;gap:8px;flex-wrap:wrap">
                <button class="btn btn-outline btn-sm" onclick="${isGHKMode(activeMode)?'downloadGHKTemplate()':'downloadScoreTemplate()'}">
                    <i class="fas fa-download"></i> File mẫu
                </button>
                <label class="btn btn-primary btn-sm"
                    style="cursor:${accessStatus.allowed?'pointer':'not-allowed'};margin:0;${accessStatus.allowed?'':'opacity:0.45'}"
                    title="${accessStatus.allowed?'Upload điểm bằng Excel':escapeHtml(accessStatus.message)}">
                    <i class="fas fa-upload"></i> Upload điểm
                    <input type="file" accept=".xlsx,.xls" onchange="${isGHKMode(activeMode)?'importGHKExcel(this)':'importScoreExcel(this)'}" style="display:none"
                        ${accessStatus.allowed?'':'disabled'}>
                </label>
                <button class="btn btn-success btn-sm" onclick="exportScoreExcel()">
                    <i class="fas fa-file-excel"></i> Xuất báo cáo
                </button>
            </div>
        </div>

        ${scoreArchiveBannerHtml(sy)}
        ${scoreWindowBannerHtml(accessStatus)}

        ${{
            'ghk1': (() => {
                const g = gradeOf(window._scoreCurrentClass);
                const hasGHK = ghkDiemSubs(g).length > 0;
                return `<div style="background:#ede9fe;border-left:4px solid #7c3aed;border-radius:6px;padding:10px 14px;margin-bottom:12px;font-size:0.875rem">
                    <i class="fas fa-clipboard" style="color:#7c3aed"></i>
                    <strong>Giữa Học kỳ 1:</strong>
                    ${hasGHK
                        ? 'Khối 3-5: chỉ <strong>Tiếng Việt, Toán và Ngoại ngữ 1 (Tiếng Anh)</strong> có Điểm KTĐK; các môn còn lại đánh giá định tính; có thêm <strong>phẩm chất và năng lực cốt lõi</strong>.'
                        : 'Chỉ nhập <strong>Mức đạt được</strong> — có thêm <strong>phẩm chất và năng lực cốt lõi</strong>; không dùng để tính điểm trung bình.'}
                </div>`;
            })(),
            'ghk2': (() => {
                const g = gradeOf(window._scoreCurrentClass);
                const hasGHK = ghkDiemSubs(g).length > 0;
                return `<div style="background:#ede9fe;border-left:4px solid #7c3aed;border-radius:6px;padding:10px 14px;margin-bottom:12px;font-size:0.875rem">
                    <i class="fas fa-clipboard" style="color:#7c3aed"></i>
                    <strong>Giữa Học kỳ 2:</strong>
                    ${hasGHK
                        ? 'Khối 3-5: chỉ <strong>Tiếng Việt, Toán và Ngoại ngữ 1 (Tiếng Anh)</strong> có Điểm KTĐK; các môn còn lại đánh giá định tính; có thêm <strong>phẩm chất và năng lực cốt lõi</strong>.'
                        : 'Chỉ nhập <strong>Mức đạt được</strong> — có thêm <strong>phẩm chất và năng lực cốt lõi</strong>; không dùng để tính điểm trung bình.'}
                </div>`;
            })(),
            'hk2': `<div style="background:#fef3c7;border-left:4px solid #f59e0b;border-radius:6px;padding:10px 14px;margin-bottom:12px;font-size:0.875rem">
                <i class="fas fa-star" style="color:#d97706"></i>
                <strong>Cuối Học kỳ 2:</strong> Kết quả cuối năm được tổng hợp từ mức đạt, phẩm chất, năng lực và điểm từng môn. Lưu → tự đồng bộ sang Học bạ.
            </div>`,
            'hk1': '',
        }[window._scoreMode] || ''}

        <!-- Tabs lớp -->
        <div style="background:white;border-radius:10px;padding:12px 16px;margin-bottom:16px;
                    box-shadow:0 1px 3px rgba(0,0,0,0.08);display:flex;gap:8px;flex-wrap:wrap;align-items:center">
            <span style="color:#64748b;font-size:0.85rem;font-weight:600;margin-right:4px">
                <i class="fas fa-layer-group"></i> Lớp:
            </span>
            ${classes.map(c => `
                <button id="sctab-${c.replace('/','_')}" onclick="switchScoreClass('${c}')"
                    class="btn btn-sm ${c===window._scoreCurrentClass?'btn-primary':'btn-outline'}"
                    style="font-size:0.82rem;padding:5px 14px">${c}</button>
            `).join('')}
        </div>

        <div id="score-class-content">
            <div style="text-align:center;padding:30px"><i class="fas fa-spinner fa-spin"></i></div>
        </div>`;

    await _renderTable(window._scoreCurrentClass, sy, hk);
}

window.switchSemester = async function(hk) {
    window._scoreSemester = hk;
    window._scoreMode     = hk;
    await renderScores();
};
window.switchScoreMode = async function(mode) {
    window._scoreMode     = mode;
    window._scoreSemester = hkOfMode(mode);
    await renderScores();
};
window.switchScoreClass = async function(cls) {
    window._scoreCurrentClass = cls;
    document.querySelectorAll('[id^="sctab-"]').forEach(b => b.className = 'btn btn-sm btn-outline');
    const t = document.getElementById(`sctab-${cls.replace('/','_')}`);
    if (t) t.className = 'btn btn-sm btn-primary';
    document.getElementById('score-class-content').innerHTML =
        `<div style="text-align:center;padding:30px"><i class="fas fa-spinner fa-spin"></i></div>`;
    await _renderTable(cls, syNow(), window._scoreSemester||'hk1');
};

window._filterScoreRows = function(query) {
    const q = (query || '').trim().toLowerCase();
    const rows = document.querySelectorAll('#score-table-body tr');
    rows.forEach(r => {
        const text = r.innerText.toLowerCase();
        r.style.display = (!q || text.includes(q)) ? '' : 'none';
    });
};

async function _renderTable(cls, sy, hk) {
    const students = activeStudentValues()
        .filter(s => scoreClassOf(s, sy) === cls)
        .sort((a,b) => (a.name||'').split(' ').pop().localeCompare((b.name||'').split(' ').pop(),'vi'));

    if (!students.length) {
        document.getElementById('score-class-content').innerHTML =
            `<div class="card" style="text-align:center;color:#94a3b8;padding:40px">
                Không có học sinh trong lớp ${cls}
             </div>`;
        return;
    }

    const mode    = window._scoreMode || hk;
    const isGHK   = isGHKMode(mode);

    // Nếu là Giữa HK → render bảng GHK riêng
    if (isGHK) {
        await _renderGHKTable(cls, sy, mode, students);
        return;
    }

    const grade = gradeOf(cls);
    const ds    = diemSubs(grade);
    const canEditRole = window.userRole === 'admin' || window.userRole === 'teacher'
                    || window.userRole === 'subject_teacher';
    const accessStatus = await getScoreEntryStatus(sy, window._scoreMode || hk);
    const canEdit = canEditRole && accessStatus.allowed;

    // Load song song: HK hiện tại + HK2 (để tổng hợp kết quả giáo dục năm)
    const hkMap = {}, hk2Map = {};
    await Promise.all(students.map(async s => {
        hkMap[s.id]  = await loadHK(s.id, sy, hk);
        hk2Map[s.id] = hk === 'hk2' ? hkMap[s.id] : await loadHK(s.id, sy, 'hk2');
    }));

    // Sort state cho bảng điểm — không sắp xếp theo điểm trung bình
    if (!['name_az','name_za'].includes(window._scoreSort)) window._scoreSort = 'name_az';

    const sort = window._scoreSort || 'name_az';
    const cmpFn = typeof compareStudentNames === 'function' ? compareStudentNames : window.compareStudentNames;
    if      (sort === 'name_az') students.sort((a,b) => cmpFn ? cmpFn(a,b,'name_az') : (a.name||'').localeCompare(b.name||'','vi'));
    else if (sort === 'name_za') students.sort((a,b) => cmpFn ? cmpFn(a,b,'name_za') : (b.name||'').localeCompare(a.name||'','vi'));

    // Tính phân bố xếp loại hiện tại (chỉ đếm dữ liệu đã có)
    const dist = { 'Hoàn thành xuất sắc': 0, 'Hoàn thành tốt': 0, 'Hoàn thành': 0, 'Chưa hoàn thành': 0 };
    students.forEach(s => {
        const xl = xepLoai(hk2Map[s.id] || {}, grade);
        if (dist[xl.loai] !== undefined) dist[xl.loai]++;
    });

    document.getElementById('score-class-content').innerHTML = `
        <!-- Chart.js Thống kê phân bố kết quả GD lớp -->
        <div class="chart-container-card">
            <div class="chart-header">
                <h4><i class="fas fa-chart-pie" style="color:var(--primary-light)"></i> Phân Bố Kết Quả Đánh Giá — Lớp ${cls}</h4>
                <span class="badge badge-info">${sy}</span>
            </div>
            <div style="display:grid;grid-template-columns:180px 1fr;gap:24px;align-items:center">
                <div style="height:140px;position:relative">
                    <canvas id="scoreDistributionChart"></canvas>
                </div>
                <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(130px, 1fr));gap:12px">
                    <div style="background:#eff6ff;padding:12px 14px;border-radius:10px;border-left:4px solid #2563eb;box-shadow:0 1px 3px rgba(0,0,0,0.04)">
                        <div style="font-size:0.75rem;color:#1e40af;font-weight:700">HT Xuất Sắc</div>
                        <div style="font-size:1.4rem;font-weight:800;color:#1e40af">${dist['Hoàn thành xuất sắc']}</div>
                    </div>
                    <div style="background:#ecfdf5;padding:12px 14px;border-radius:10px;border-left:4px solid #059669;box-shadow:0 1px 3px rgba(0,0,0,0.04)">
                        <div style="font-size:0.75rem;color:#065f46;font-weight:700">HT Tốt</div>
                        <div style="font-size:1.4rem;font-weight:800;color:#059669">${dist['Hoàn thành tốt']}</div>
                    </div>
                    <div style="background:#f0fdf4;padding:12px 14px;border-radius:10px;border-left:4px solid #16a34a;box-shadow:0 1px 3px rgba(0,0,0,0.04)">
                        <div style="font-size:0.75rem;color:#166534;font-weight:700">Hoàn Thành</div>
                        <div style="font-size:1.4rem;font-weight:800;color:#16a34a">${dist['Hoàn thành']}</div>
                    </div>
                    <div style="background:#fef2f2;padding:12px 14px;border-radius:10px;border-left:4px solid #dc2626;box-shadow:0 1px 3px rgba(0,0,0,0.04)">
                        <div style="font-size:0.75rem;color:#991b1b;font-weight:700">Chưa Hoàn Thành</div>
                        <div style="font-size:1.4rem;font-weight:800;color:#dc2626">${dist['Chưa hoàn thành']}</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Toolbar tìm kiếm & lọc học sinh -->
        <div class="score-toolbar">
            <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
                <div class="search-box-wrap">
                    <i class="fas fa-search"></i>
                    <input type="text" id="score-table-search" class="search-box-inp"
                           placeholder="Tìm kiếm theo họ tên hoặc mã số..."
                           oninput="window._filterScoreRows(this.value)">
                </div>
                <div style="display:flex;align-items:center;gap:6px">
                    <span style="font-size:0.82rem;color:var(--text-muted);font-weight:600">Sắp xếp:</span>
                    <button onclick="window._scoreSort='name_az';switchScoreClass(window._scoreCurrentClass)"
                        class="btn btn-sm ${window._scoreSort==='name_az'?'btn-primary':'btn-outline'}">
                        <i class="fas fa-sort-alpha-down"></i> Tên A→Z
                    </button>
                    <button onclick="window._scoreSort='name_za';switchScoreClass(window._scoreCurrentClass)"
                        class="btn btn-sm ${window._scoreSort==='name_za'?'btn-primary':'btn-outline'}">
                        <i class="fas fa-sort-alpha-up"></i> Tên Z→A
                    </button>
                </div>
            </div>
            <div style="font-size:0.84rem;color:var(--text-muted)">
                Sĩ số: <b style="color:var(--primary-color)">${students.length}</b> học sinh
            </div>
        </div>

        <!-- Bảng Điểm TT27/2020 -->
        <div class="table-wrapper">
            <table>
                <thead>
                    <tr>
                        <th rowspan="2" style="vertical-align:middle;text-align:center;min-width:45px">STT</th>
                        <th rowspan="2" style="vertical-align:middle;min-width:180px">Họ và tên học sinh</th>
                        ${ds.map(s => `
                            <th colspan="2" class="group-header" style="text-align:center;white-space:nowrap;padding:8px 10px">
                                ${s.name}
                            </th>
                        `).join('')}
                        <th rowspan="2" style="text-align:center;vertical-align:middle;background:#ecfdf5;color:#065f46;min-width:140px;padding:8px">
                            Kết quả GD<br>
                            <small style="font-weight:500;font-size:0.72rem;color:#059669">
                                ${hk==='hk2'?'★ Kết quả cuối năm':'(xem dữ liệu cuối năm)'}
                            </small>
                        </th>
                        ${canEditRole ? `<th rowspan="2" style="text-align:center;vertical-align:middle;min-width:65px">Nhập</th>` : ''}
                        <th rowspan="2" style="text-align:center;vertical-align:middle;background:#eff6ff;color:#1e40af;min-width:65px">Xuất</th>
                    </tr>
                    <tr>
                        ${ds.map(() => `
                            <th style="text-align:center;font-size:0.76rem;background:#f8fafc;padding:5px 6px;color:#475569">Điểm</th>
                            <th style="text-align:center;font-size:0.76rem;background:#f8fafc;padding:5px 6px;color:#475569">Mức</th>
                        `).join('')}
                    </tr>
                </thead>
                <tbody id="score-table-body">
                    ${students.map((s, i) => {
                        const hd  = hkMap[s.id]  || {};
                        const hk2 = hk2Map[s.id] || {};
                        const xl  = xepLoai(hk2, grade);
                        return `<tr>
                            <td style="text-align:center;font-weight:600;color:#64748b">${i+1}</td>
                            <td>
                                <strong style="color:var(--text-main);font-size:0.92rem">${s.name}</strong><br>
                                <span class="badge badge-info" style="font-size:0.68rem;padding:1px 6px;font-weight:500">${s.code||s.id}</span>
                            </td>
                            ${ds.map(sub => {
                                const sc  = hd[sub.name] || {};
                                const d   = parseFloat(sc.diem) || 0;
                                const muc = sc.mucDat || '';
                                const mc  = MUC_COLOR[muc] || MUC_COLOR[''];
                                const edited = isEditedScore(sc);
                                const auditText = scoreAuditSummary(sc);
                                const isBelowAvg = d > 0 && d < 5;
                                return `
                                <td style="text-align:center;font-weight:700;font-size:0.95rem"
                                    title="${escapeHtml(auditText)}">
                                    <div class="${isBelowAvg ? 'score-below-avg' : (d >= 5 ? 'score-badge-pass' : '')}"
                                         style="${!isBelowAvg && d === 0 ? 'color:#94a3b8' : ''}">
                                        ${d || '—'}${edited?'<span style="font-size:0.65rem;margin-left:3px;color:#dc2626">✎</span>':''}
                                    </div>
                                    ${edited && auditText ? `<div style="font-size:0.62rem;font-weight:500;color:#dc2626;line-height:1.2;margin-top:2px">${escapeHtml(auditText)}</div>` : ''}
                                </td>
                                <td style="text-align:center;padding:4px">
                                    <span style="font-size:0.75rem;padding:3px 8px;border-radius:8px;
                                        font-weight:700;background:${mc.bg};color:${mc.color};border:1px solid ${mc.color}22">
                                        ${muc || '—'}
                                    </span>
                                </td>`;
                            }).join('')}
                            <td style="text-align:center">
                                <span style="padding:4px 12px;border-radius:12px;font-size:0.76rem;
                                    font-weight:700;background:${xl.bg};color:${xl.color};white-space:nowrap;box-shadow:0 1px 2px rgba(0,0,0,0.05)">
                                    ${xl.loai}
                                </span>
                            </td>
                            ${canEditRole ? `
                            <td style="text-align:center">
                                <button class="btn btn-sm ${canEdit?'btn-primary':'btn-outline'}"
                                    onclick="${canEdit?`openScoreModal('${s.id}','${sy}','${hk}')`:`Swal.fire('Đã khóa nhập điểm','${escapeHtml(accessStatus.message)}','warning')`}"
                                    title="${canEdit?'Nhập hoặc chỉnh sửa điểm':escapeHtml(accessStatus.message)}"
                                    ${canEdit?'':'disabled'}
                                    style="${canEdit?'':'opacity:0.45;cursor:not-allowed'};padding:5px 9px">
                                    <i class="fas fa-${canEdit?'edit':'lock'}"></i>
                                </button>
                            </td>` : ''}
                            <td style="text-align:center">
                                <button class="btn btn-sm btn-success"
                                    onclick="exportStudentScoreWord('${s.id}','${sy}')"
                                    title="Xuất bảng điểm Word" style="padding:5px 9px">
                                    <i class="fas fa-file-word"></i>
                                </button>
                            </td>
                        </tr>`;
                    }).join('')}
                </tbody>
            </table>
        </div>`;

    // Khởi tạo Chart.js phân bố xếp loại lớp
    try {
        if (typeof Chart !== 'undefined') {
            const chartCanvas = document.getElementById('scoreDistributionChart');
            if (chartCanvas) {
                new Chart(chartCanvas, {
                    type: 'doughnut',
                    data: {
                        labels: ['Xuất sắc', 'Tốt', 'Hoàn thành', 'Chưa HT'],
                        datasets: [{
                            data: [
                                dist['Hoàn thành xuất sắc'],
                                dist['Hoàn thành tốt'],
                                dist['Hoàn thành'],
                                dist['Chưa hoàn thành']
                            ],
                            backgroundColor: ['#2563eb', '#059669', '#16a34a', '#dc2626'],
                            borderWidth: 2,
                            borderColor: '#ffffff'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        cutout: '65%',
                        plugins: {
                            legend: { display: false },
                            tooltip: {
                                callbacks: {
                                    label: ctx => ` ${ctx.label}: ${ctx.raw} HS`
                                }
                            }
                        }
                    }
                });
            }
        }
    } catch (err) {
        console.warn('Score chart error:', err);
    }
}

// ══════════════════════════════════════════════════════════════════════════════
// BẢNG GIỮA HK — chỉ nhập Mức đạt được (không điểm số)
// ══════════════════════════════════════════════════════════════════════════════
async function _renderGHKTable(cls, sy, mode, students) {
    const grade       = gradeOf(cls);
    const subs        = getSubs(grade);
    const ds          = ghkDiemSubs(grade);
    const canEditRole = (window.userRole === 'admin' || window.userRole === 'teacher') && !window._isViewingArchivedYear;
    const accessStatus = await getScoreEntryStatus(sy, mode);
    const canEdit     = canEditRole && accessStatus.allowed;
    const ghkLabel    = mode === 'ghk1' ? 'Giữa Học kỳ 1' : 'Giữa Học kỳ 2';
    const hasGHKScore = ds.length > 0;

    // Load dữ liệu GHK song song (batch 5)
    const ghkMap = {};
    const BATCH  = 5;
    for (let i = 0; i < students.length; i += BATCH) {
        await Promise.all(students.slice(i, i + BATCH).map(async s => {
            ghkMap[s.id] = await loadGHK(s.id, sy, mode);
        }));
    }

    const nhapCount = students.filter(s => _v527GhkCompletion(ghkMap[s.id] || {}, subs).filled > 0).length;

    // ── Tính tiến độ nhập; không cộng hoặc chia điểm giữa kỳ ────────────────
    const summaryOf = (s) => _v527GhkCompletion(ghkMap[s.id] || {}, subs);

    // ── Badge tóm tắt môn học nổi bật (tối đa 4 môn đầu) ────────────────────
    const previewBadges = (s) => {
        const g   = ghkMap[s.id] || {};
        const top = subs.slice(0, hasGHKScore ? 3 : 4);
        return top.map(sub => {
            const sc  = g[sub.name] || {};
            const muc = sc.mucDat || '';
            const c   = muc==='T'?'#16a34a':muc==='H'||muc==='Đ'?'#2563eb':muc==='C'?'#dc2626':'#94a3b8';
            const bg  = muc==='T'?'#dcfce7':muc==='H'||muc==='Đ'?'#dbeafe':muc==='C'?'#fee2e2':'#f1f5f9';
            const shortName = sub.name.replace('Tiếng Việt','TV').replace('Toán','Toán')
                .replace('Ngoại ngữ 1','NN').replace('Lịch sử và Địa lí','LS-ĐL')
                .replace('Khoa học','KH').replace('Tin học và Công nghệ','TH-CN')
                .replace('Đạo đức','ĐĐ').replace('Giáo dục thể chất','GDTC')
                .replace('Tự nhiên và Xã hội','TN-XH').replace('Nghệ thuật (Âm nhạc)','ÂN')
                .replace('Nghệ thuật (Mỹ thuật)','MT').replace('Hoạt động trải nghiệm','TN');
            const edited = isEditedScore(sc);
            const auditText = scoreAuditSummary(sc);
            const diemStr = (ghkHasNumericScore(grade, sub.name) && sc.diem !== undefined && sc.diem !== '')
                ? `<b style="margin-left:3px;color:${edited?'#dc2626':parseFloat(sc.diem)>=5?'#1d4ed8':'#dc2626'}">${sc.diem}${edited?'✎':''}</b>` : '';
            return `<span style="display:inline-flex;align-items:center;gap:2px;padding:2px 7px;
                border-radius:10px;font-size:0.7rem;background:${bg};color:${c};
                font-weight:600;white-space:nowrap" title="${escapeHtml(auditText)}">
                ${shortName}${muc?`:${muc}`:'?'}${diemStr}
            </span>`;
        }).join('');
    };

    document.getElementById('score-class-content').innerHTML = `
        <!-- Thanh trạng thái -->
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;flex-wrap:wrap">
            <div style="background:#ede9fe;border-radius:8px;padding:8px 16px;font-size:0.85rem">
                <i class="fas fa-clipboard" style="color:#7c3aed"></i>
                <strong style="color:#7c3aed">${ghkLabel}</strong>
                ${hasGHKScore
                    ? ' — Khối 3-5: chỉ <strong>Tiếng Việt, Toán, Ngoại ngữ 1</strong> có điểm; thêm <strong>năng lực cốt lõi</strong>'
                    : ' — Mức đạt được; thêm <strong>năng lực cốt lõi</strong>'}
            </div>
            <div style="background:#f1f5f9;border-radius:8px;padding:8px 14px;font-size:0.82rem;color:#64748b">
                ✅ Đã nhập: <strong style="color:#16a34a">${nhapCount}</strong>
                / <strong>${students.length}</strong> học sinh
            </div>
            ${canEditRole ? `
            <button class="btn btn-outline btn-sm" onclick="downloadGHKTemplate()">
                <i class="fas fa-download"></i> File mẫu
            </button>
            <label class="btn btn-primary btn-sm"
                style="cursor:${canEdit?'pointer':'not-allowed'};margin:0;${canEdit?'':'opacity:0.45'}"
                title="${canEdit?'Upload điểm bằng Excel':escapeHtml(accessStatus.message)}">
                <i class="fas fa-upload"></i> Upload điểm
                <input type="file" accept=".xlsx,.xls" onchange="importGHKExcel(this)" style="display:none" ${canEdit?'':'disabled'}>
            </label>` : ''}
            <button class="btn btn-success btn-sm" onclick="exportGHKExcel('${cls}','${sy}','${mode}')">
                <i class="fas fa-file-excel"></i> Xuất báo cáo
            </button>
        </div>

        <!-- Bảng gọn: STT | Tên | Tóm tắt môn | Trạng thái | Nhập -->
        <div class="table-wrapper">
            <table style="min-width:unset">
                <thead>
                    <tr>
                        <th style="width:36px;text-align:center">STT</th>
                        <th style="min-width:160px">Họ và tên</th>
                        <th>Tóm tắt đánh giá</th>
                        <th style="text-align:center;width:90px">Tiến độ</th>
                        ${canEditRole ? `<th style="text-align:center;width:72px">Nhập</th>` : ''}
                    </tr>
                </thead>
                <tbody>
                    ${students.map((s, i) => {
                        const { filled, total } = summaryOf(s);
                        const pct     = total > 0 ? Math.round(filled/total*100) : 0;
                        const barClr  = pct===100?'#16a34a':pct>0?'#7c3aed':'#e2e8f0';
                        const isDone  = pct === 100;
                        return `<tr style="${isDone?'':'opacity:0.85'}">
                            <td style="text-align:center;color:#94a3b8;font-size:0.85rem">${i+1}</td>
                            <td>
                                <div style="font-weight:600;color:#1e293b">${s.name}</div>
                                <div style="font-size:0.75rem;color:#94a3b8">${s.code||s.id}</div>
                            </td>
                            <td>
                                <div style="display:flex;gap:4px;flex-wrap:wrap;padding:2px 0">
                                    ${previewBadges(s)}
                                    ${filled > 0 && subs.length > (hasGHKScore?3:4)
                                        ? `<span style="font-size:0.7rem;color:#94a3b8;align-self:center">
                                              +${subs.length-(hasGHKScore?3:4)} môn khác
                                           </span>` : ''}
                                    ${filled === 0
                                        ? `<span style="font-size:0.78rem;color:#94a3b8;font-style:italic">
                                              Chưa nhập
                                           </span>` : ''}
                                </div>
                            </td>
                            <td style="text-align:center">
                                <div style="font-size:0.72rem;color:${pct===100?'#16a34a':pct>0?'#7c3aed':'#94a3b8'};
                                            font-weight:600;margin-bottom:3px">${pct}%</div>
                                <div style="background:#f1f5f9;border-radius:4px;height:5px;
                                            overflow:hidden;width:60px;margin:0 auto">
                                    <div style="background:${barClr};width:${pct}%;
                                                height:100%;border-radius:4px;transition:width .3s"></div>
                                </div>
                            </td>
                            ${canEditRole ? `
                            <td style="text-align:center">
                                <button class="btn btn-sm"
                                    style="background:${canEdit?(isDone?'#7c3aed':'#a78bfa'):'#e2e8f0'};color:${canEdit?'white':'#94a3b8'};border:none;
                                           padding:5px 10px;${canEdit?'':'cursor:not-allowed'}"
                                    onclick="${canEdit?`openGHKModal('${s.id}','${sy}','${mode}')`:''}"
                                    title="${canEdit?(isDone?'Chỉnh sửa':'Nhập đánh giá'):escapeHtml(accessStatus.message)}"
                                    ${canEdit?'':'disabled'}>
                                    <i class="fas fa-${canEdit?(isDone?'check-circle':'edit'):'lock'}"></i>
                                </button>
                            </td>` : ''}
                        </tr>`;
                    }).join('')}
                </tbody>
            </table>
        </div>`;
}

// ── Modal nhập Giữa HK ───────────────────────────────────────────────────────
window.openGHKModal = async function(studentId, sy, mode) {
    if (window._isViewingArchivedYear) {
        Swal.fire('Chỉ xem năm học cũ', 'Năm học đã lưu trữ chỉ được xem lại, không nhập hoặc chỉnh sửa điểm.', 'info');
        return;
    }
    const accessStatus = await ensureScoreEntryAllowed(sy, mode);
    if (!accessStatus.allowed) return;
    const student  = window.localData.students[studentId];
    if (!student) return;
    const grade       = scoreGradeOfStudent(student, sy);
    const subs        = getSubs(grade);
    const ghkData     = await loadGHK(studentId, sy, mode);
    const ghkLabel    = mode === 'ghk1' ? 'Giữa Học kỳ 1' : 'Giữa Học kỳ 2';
    // Khối 3-5: chỉ Tiếng Việt, Toán, Ngoại ngữ 1/Tiếng Anh có ô điểm giữa HK
    const hasGHKScore = ghkDiemSubs(grade).length > 0;
    const mucOpts     = (window.MUC_DANH_GIA_MON || ['T','H','C'])
        .map(m => `<option value="${m}">${m}</option>`).join('');
    const mucOptsPC   = (window.MUC_DANH_GIA || ['T','Đ','C'])
        .map(m => `<option value="${m}">${m}</option>`).join('');

    // Build bảng môn học:
    // Chỉ 3 môn được phép có cột Điểm KTĐK ở khối 3-5; môn khác gạch chéo
    const buildRows = () => subs.map(sub => {
        const sc      = ghkData[sub.name] || {};
        const isDiem  = ghkHasNumericScore(grade, sub.name);
        const diemCell = isDiem
            ? `<td style="padding:6px 8px;border:1px solid #e2e8f0;min-width:90px">
                <input type="number" id="ghk-diem-${sub.name}"
                    class="form-control form-control-sm"
                    min="0" max="10" step="0.1" placeholder="0–10"
                    style="width:75px;font-weight:700;text-align:center;color:${isEditedScore(sc)?'#dc2626':'#1d4ed8'}"
                    title="${escapeHtml(scoreAuditSummary(sc))}"
                    value="${sc.diem??''}">
               </td>`
            : `<td style="padding:6px 8px;border:1px solid #e2e8f0;text-align:center;
                background:repeating-linear-gradient(135deg,#f8fafc 0,#f8fafc 4px,#e2e8f0 4px,#e2e8f0 5px);
                color:#94a3b8;font-size:0.75rem" title="${hasGHKScore?'Môn này giữa HK chỉ đánh giá định tính':'Giữa HK không nhập điểm'}">—</td>`;

        return `<tr>
            <td style="padding:7px 10px;font-weight:600;border:1px solid #e2e8f0;
                background:${isDiem?'#f5f3ff':'#f8fafc'};min-width:150px">
                ${sub.name}
                ${isDiem ? '<span style="font-size:0.66rem;color:#7c3aed;font-weight:400;margin-left:4px">có điểm</span>' : ''}
            </td>
            <td style="padding:6px 8px;border:1px solid #e2e8f0;min-width:130px">
                <select id="ghk-muc-${sub.name}" class="form-control form-control-sm">
                    <option value="">-- Mức --</option>${mucOpts}
                </select>
            </td>
            ${diemCell}
            <td style="padding:6px 8px;border:1px solid #e2e8f0">
                <input type="text" id="ghk-nx-${sub.name}"
                    class="form-control form-control-sm"
                    placeholder="Nhận xét..." value="${sc.nhanXet||''}">
            </td>
        </tr>`;
    }).join('');

    // Phẩm chất giữa HK
    const pcData  = ghkData.__pc || {};
    const pcRows  = (window.PHAM_CHAT||[]).map(pc => {
        const k = pc.replace(/\s/g,'_'), d = pcData[pc]||{};
        return `<tr>
            <td style="padding:6px 10px;border:1px solid #e2e8f0;font-weight:500">${pc}</td>
            <td style="padding:6px 8px;border:1px solid #e2e8f0;min-width:130px">
                <select id="ghk-pc-${k}" class="form-control form-control-sm">
                    <option value="">-- Mức --</option>${mucOptsPC}
                </select>
            </td>
            <td style="padding:6px 8px;border:1px solid #e2e8f0;text-align:center;
                background:repeating-linear-gradient(135deg,#f8fafc 0,#f8fafc 4px,#e2e8f0 4px,#e2e8f0 5px);
                color:#94a3b8">—</td>
            <td style="padding:6px 8px;border:1px solid #e2e8f0">
                <input type="text" id="ghk-pc-nx-${k}" class="form-control form-control-sm"
                    placeholder="Nhận xét..." value="${d.nhanXet||''}">
            </td>
        </tr>`;
    }).join('');

    Swal.fire({
        title: '',
        html: `
        <div id="ghk-modal-wrap" style="text-align:left;font-size:0.88rem;display:flex;flex-direction:column;height:100%">

            <!-- Header cố định -->
            <div style="background:linear-gradient(135deg,#5b21b6,#7c3aed);color:white;
                        border-radius:8px;padding:11px 15px;margin-bottom:10px;
                        display:flex;justify-content:space-between;align-items:center;gap:10px;
                        flex-shrink:0">
                <div>
                    <div style="font-size:1rem;font-weight:700">${student.name}</div>
                    <div style="opacity:0.85;font-size:0.8rem">
                        Lớp ${student.classRoom||student.class} — Khối ${grade}
                        — <strong>${ghkLabel}</strong> — ${sy}
                    </div>
                </div>
                <div style="background:rgba(255,255,255,0.15);border-radius:6px;
                            padding:5px 11px;font-size:0.75rem;flex-shrink:0">
                    ${hasGHKScore ? 'ℹ️ Điểm được ghi riêng từng môn' : 'ℹ️ Chỉ Mức đạt được'}
                </div>
            </div>

            <!-- Tab bar cố định -->
            <div style="display:flex;gap:6px;margin-bottom:8px;flex-shrink:0">
                <button type="button" id="ghk-tab-mon"
                    onclick="window._ghkSwitchTab('mon')"
                    style="padding:6px 18px;border-radius:6px;border:none;cursor:pointer;
                           font-weight:600;font-size:0.82rem;background:#7c3aed;color:white;
                           transition:all .15s">
                    📚 Môn học
                </button>
                <button type="button" id="ghk-tab-pc"
                    onclick="window._ghkSwitchTab('pc')"
                    style="padding:6px 18px;border-radius:6px;border:1.5px solid #e2e8f0;
                           cursor:pointer;font-weight:600;font-size:0.82rem;
                           background:#f8fafc;color:#64748b;transition:all .15s">
                    💎 Phẩm chất
                </button>
                <span style="margin-left:auto;color:#94a3b8;font-size:0.75rem;
                             align-self:center;padding-right:2px">
                    Cuộn để xem thêm ↕
                </span>
            </div>

            <!-- Panel: Môn học — cuộn nội bộ -->
            <div id="ghk-panel-mon"
                 style="flex:1;overflow-y:auto;overflow-x:auto;
                        border:1px solid #e2e8f0;border-radius:8px;
                        min-height:0">
                <table style="width:100%;border-collapse:collapse;font-size:0.84rem;min-width:560px">
                    <thead>
                        <tr style="background:#5b21b6;color:white;text-align:center;
                                   position:sticky;top:0;z-index:3">
                            <th style="padding:8px 10px;border:1px solid #7c3aed;
                                       text-align:left;min-width:150px">Môn học</th>
                            <th style="padding:8px 10px;border:1px solid #7c3aed;
                                       min-width:125px">Mức đạt được</th>
                            <th style="padding:8px 10px;border:1px solid #7c3aed;
                                       min-width:90px">Điểm KTĐK</th>
                            <th style="padding:8px 10px;border:1px solid #7c3aed">Nhận xét</th>
                        </tr>
                    </thead>
                    <tbody>${buildRows()}</tbody>
                </table>
            </div>

            <!-- Panel: Phẩm chất — cuộn nội bộ (ẩn mặc định) -->
            <div id="ghk-panel-pc"
                 style="display:none;flex:1;overflow-y:auto;overflow-x:auto;
                        border:1px solid #e2e8f0;border-radius:8px;
                        min-height:0">
                <table style="width:100%;border-collapse:collapse;font-size:0.84rem;min-width:500px">
                    <thead>
                        <tr style="background:#5b21b6;color:white;text-align:center;
                                   position:sticky;top:0;z-index:3">
                            <th style="padding:7px 10px;border:1px solid #7c3aed;
                                       text-align:left;min-width:150px">Phẩm chất</th>
                            <th style="padding:7px 10px;border:1px solid #7c3aed;
                                       min-width:125px">Mức đạt được</th>
                            <th style="padding:7px 10px;border:1px solid #7c3aed;
                                       min-width:90px">—</th>
                            <th style="padding:7px 10px;border:1px solid #7c3aed">Nhận xét</th>
                        </tr>
                    </thead>
                    <tbody>${pcRows}</tbody>
                </table>
            </div>

        </div>`,

        width: '820px',
        showCancelButton: true,
        confirmButtonText: '<i class="fas fa-save"></i> Lưu đánh giá giữa HK',
        cancelButtonText: 'Đóng',
        confirmButtonColor: '#7c3aed',

        didOpen: () => {
            // ── Crop popup vừa màn hình — thao tác trực tiếp trên DOM SweetAlert2 ──
            const popup = Swal.getPopup();
            if (popup) {
                popup.style.maxHeight   = '90vh';
                popup.style.display     = 'flex';
                popup.style.flexDirection = 'column';
                popup.style.overflow    = 'hidden';
            }
            const htmlContainer = Swal.getHtmlContainer();
            if (htmlContainer) {
                htmlContainer.style.flex      = '1';
                htmlContainer.style.minHeight = '0';
                htmlContainer.style.overflow  = 'hidden';
                htmlContainer.style.display   = 'flex';
                htmlContainer.style.flexDirection = 'column';
                htmlContainer.style.padding   = '0 24px';
            }
            const wrap = document.getElementById('ghk-modal-wrap');
            if (wrap) {
                wrap.style.flex      = '1';
                wrap.style.minHeight = '0';
                wrap.style.overflow  = 'hidden';
            }

            // ── Helper chuyển tab ──────────────────────────────────────────────
            window._ghkSwitchTab = (tab) => {
                const monPanel = document.getElementById('ghk-panel-mon');
                const pcPanel  = document.getElementById('ghk-panel-pc');
                const monBtn   = document.getElementById('ghk-tab-mon');
                const pcBtn    = document.getElementById('ghk-tab-pc');
                if (tab === 'mon') {
                    monPanel.style.display = 'flex'; monPanel.style.flexDirection = 'column';
                    pcPanel.style.display  = 'none';
                    monBtn.style.background = '#7c3aed'; monBtn.style.color = 'white';
                    monBtn.style.border = 'none';
                    pcBtn.style.background = '#f8fafc'; pcBtn.style.color = '#64748b';
                    pcBtn.style.border = '1.5px solid #e2e8f0';
                } else {
                    pcPanel.style.display  = 'flex'; pcPanel.style.flexDirection = 'column';
                    monPanel.style.display = 'none';
                    pcBtn.style.background = '#7c3aed'; pcBtn.style.color = 'white';
                    pcBtn.style.border = 'none';
                    monBtn.style.background = '#f8fafc'; monBtn.style.color = '#64748b';
                    monBtn.style.border = '1.5px solid #e2e8f0';
                }
            };
            // Kích hoạt panel mặc định
            window._ghkSwitchTab('mon');

            // Fill dữ liệu môn
            subs.forEach(sub => {
                const sc  = ghkData[sub.name] || {};
                const mEl = document.getElementById(`ghk-muc-${sub.name}`);
                const nEl = document.getElementById(`ghk-nx-${sub.name}`);
                if (mEl && sc.mucDat)  mEl.value = sc.mucDat;
                if (nEl && sc.nhanXet) nEl.value = sc.nhanXet;
                if (ghkHasNumericScore(grade, sub.name)) {
                    const dEl = document.getElementById(`ghk-diem-${sub.name}`);
                    if (dEl && sc.diem !== undefined && sc.diem !== '') dEl.value = sc.diem;
                    attachScoreChangeHighlighter(dEl, sc.diem, sc);
                }
            });
            // Phẩm chất
            (window.PHAM_CHAT||[]).forEach(pc => {
                const k = pc.replace(/\s/g,'_'), d = pcData[pc]||{};
                const m = document.getElementById(`ghk-pc-${k}`);
                const n = document.getElementById(`ghk-pc-nx-${k}`);
                if (m && d.mucDat)  m.value = d.mucDat;
                if (n && d.nhanXet) n.value = d.nhanXet;
            });

            // Ngân hàng nhận xét tự động theo khối, môn, mức và điểm.
            subs.forEach(sub => bindCommentField({
                grade, kind:'subject', name:sub.name, seed:studentId,
                levelId:`ghk-muc-${sub.name}`,
                scoreId:ghkHasNumericScore(grade, sub.name) ? `ghk-diem-${sub.name}` : '',
                commentId:`ghk-nx-${sub.name}`,
            }));
            (window.PHAM_CHAT||[]).forEach(pc => {
                const k = pc.replace(/\s/g,'_');
                bindCommentField({
                    grade, kind:'quality', name:pc, seed:studentId,
                    levelId:`ghk-pc-${k}`, commentId:`ghk-pc-nx-${k}`,
                    syncLevelFromScore:false,
                });
            });
            addCommentBankToolbar(Swal.getHtmlContainer() || document, {
                afterElement: document.querySelector('#ghk-modal-wrap > div:first-child'),
            });
        },

        preConfirm: async () => {
            const liveAccess = await ensureScoreEntryAllowed(sy, mode);
            if (!liveAccess.allowed) return false;

            const subData = {};
            const auditUpdates = {};
            const now = typeof window.serverNow === 'function' ? window.serverNow() : Date.now();
            for (const sub of subs) {
                const isDiem = ghkHasNumericScore(grade, sub.name);
                const diemText = isDiem
                    ? (document.getElementById(`ghk-diem-${sub.name}`)?.value || '').trim()
                    : '';
                const diemValue = diemText === '' ? null : Number(diemText);
                if (diemValue !== null && (!Number.isFinite(diemValue) || diemValue < 0 || diemValue > 10)) {
                    Swal.showValidationMessage(`Điểm ${sub.name} phải nằm trong khoảng 0 đến 10`);
                    return false;
                }

                const nextRecord = {
                    mucDat:  document.getElementById(`ghk-muc-${sub.name}`)?.value  || '',
                    nhanXet: document.getElementById(`ghk-nx-${sub.name}`)?.value   || '',
                    ...(diemValue !== null ? { diem: diemValue } : {}),
                };
                const audited = buildAuditedScoreRecord(ghkData[sub.name] || {}, nextRecord, {
                    now,
                    source: 'manual',
                    studentId,
                    studentCode: student.code || student.id,
                    studentName: student.name,
                    className: student.classRoom || student.class || '',
                    subjectName: sub.name,
                    schoolYear: sy,
                    mode,
                });
                subData[sub.name] = audited.record;
                Object.assign(auditUpdates, makeScoreAuditUpdate(audited.auditEntry));
            }

            const pc = {};
            (window.PHAM_CHAT||[]).forEach(x => {
                const k = x.replace(/\s/g,'_');
                pc[x] = {
                    mucDat:  document.getElementById(`ghk-pc-${k}`)?.value    || '',
                    nhanXet: document.getElementById(`ghk-pc-nx-${k}`)?.value || '',
                };
            });

            const ghkSave = {
                ...ghkData,
                ...subData,
                __pc:   pc,
                __type: 'giua_hk',
                __hk:   mode,
                __at:   now,
                __by:   window.currentUser?.email || '',
                __uid:  window.currentUser?.uid || '',
            };

            const rootUpdates = {
                [`${ghkPath(studentId, sy, mode)}`]: ghkSave,
                ...auditUpdates,
            };
            const yp = yearPath(studentId, sy);
            rootUpdates[`${yp}/grade`] = grade;
            rootUpdates[`${yp}/schoolYear`] = sy;
            rootUpdates[`${yp}/updatedAt`] = now;
            Object.entries(subData).forEach(([subjectName, record]) => {
                rootUpdates[`${yp}/${mode}_subjects/${subjectName}`] = record;
            });
            rootUpdates[`${yp}/${mode}_phamChat`] = pc;

            await window.update(window.ref(window.db), rootUpdates);
            return ghkSave;
        }
    }).then(res => {
        if (!res.isConfirmed) return;
        Swal.fire({
            icon: 'success', title: '✅ Đã lưu đánh giá giữa HK!',
            html: hasGHKScore
                ? '<small>Chỉ điểm Tiếng Việt, Toán, Ngoại ngữ 1/Tiếng Anh được lưu; môn khác chỉ lưu đánh giá định tính</small>'
                : '<small>Dữ liệu giữa HK không được dùng để tính điểm trung bình</small>',
            timer: 2000, showConfirmButton: false
        });
        _renderGHKTable(window._scoreCurrentClass, sy, mode,
            activeStudentValues()
                .filter(s => (s.classRoom||s.class||'') === window._scoreCurrentClass)
                .sort((a,b) => (a.name||'').split(' ').pop().localeCompare((b.name||'').split(' ').pop(),'vi'))
        );
    });
};

// ── Xuất Excel Giữa HK ───────────────────────────────────────────────────────
window.exportGHKExcel = async function(cls, sy, mode) {
    const students = activeStudentValues()
        .filter(s => (s.classRoom||s.class||'') === cls)
        .sort((a,b) => (a.name||'').split(' ').pop().localeCompare((b.name||'').split(' ').pop(),'vi'));
    const grade       = gradeOf(cls);
    const subs        = getSubs(grade);
    const ghkLabel    = mode === 'ghk1' ? 'GiuaHK1' : 'GiuaHK2';
    const hasGHKScore = ghkDiemSubs(grade).length > 0;

    Swal.fire({ title:'Đang xuất...', allowOutsideClick:false, didOpen:()=>Swal.showLoading() });

    const rows = await Promise.all(students.map(async (s, i) => {
        const g   = await loadGHK(s.id, sy, mode);
        const row = { 'STT':i+1, 'Mã HS':s.code||s.id, 'Họ tên':s.name, 'Lớp':cls };
        subs.forEach(sub => {
            row[sub.name + ' - Mức'] = g[sub.name]?.mucDat  || '';
            if (ghkHasNumericScore(grade, sub.name))
                row[sub.name + ' - Điểm'] = g[sub.name]?.diem || '';
            row[sub.name + ' - NX']  = g[sub.name]?.nhanXet || '';
        });
        (window.PHAM_CHAT||[]).forEach(pc => {
            row['PC ' + pc] = g.__pc?.[pc]?.mucDat || '';
        });
        return row;
    }));

    const safe = `${ghkLabel}_${cls}`.replace(/[\/\\?*\[\]:]/g,'_').substring(0,31);
    const wb   = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), safe);
    XLSX.writeFile(wb, `${ghkLabel}_Lop${cls.replace('/','_')}_${sy.replace('-','_')}.xlsx`);
    Swal.fire({ icon:'success', title:'Xuất thành công!', timer:1500, showConfirmButton:false });
};

// ══════════════════════════════════════════════════════════════════════════════
// downloadGHKTemplate — File mẫu Excel cho Giữa HK1 / Giữa HK2
// Khối 3-5: chỉ Tiếng Việt, Toán, Ngoại ngữ 1/Tiếng Anh có Điểm KTĐK
// Các môn còn lại chỉ có Mức đạt được + Nhận xét
// Cấu trúc 5 hàng header giống cuối HK để dùng chung importGHKExcel
// ══════════════════════════════════════════════════════════════════════════════
window.downloadGHKTemplate = function() {
    const cls      = window._scoreCurrentClass;
    const mode     = window._scoreMode; // 'ghk1' | 'ghk2'
    const sy       = syNow();
    const ghkLabel = mode === 'ghk1' ? 'Giữa HK1' : 'Giữa HK2';

    const students = activeStudentValues()
        .filter(s => (s.classRoom || s.class || '') === cls)
        .sort((a, b) =>
            (a.name || '').split(' ').pop()
                .localeCompare((b.name || '').split(' ').pop(), 'vi')
        );

    if (!students.length) {
        Swal.fire('Thông báo', 'Vui lòng chọn lớp có học sinh trước', 'warning');
        return;
    }

    const grade       = gradeOf(cls);
    const subs        = getSubs(grade);
    const ghkScoreSubjects = ghkDiemSubs(grade);
    const hasGHKScore = ghkScoreSubjects.length > 0;
    const pcs         = window.PHAM_CHAT || [];

    // Xây colDefs: chỉ 3 môn được phép có điểm GHK → 3 cột, còn lại → 2 cột
    const colDefs = [];
    subs.forEach(s => {
        if (ghkHasNumericScore(grade, s.name)) {
            colDefs.push({ mon: s.name, loai: 'Mức đạt được', type: 'diem' });
            colDefs.push({ mon: s.name, loai: 'Điểm KTĐK',   type: 'diem' });
            colDefs.push({ mon: s.name, loai: 'Nhận xét',    type: 'diem' });
        } else {
            colDefs.push({ mon: s.name, loai: 'Mức đạt được', type: 'nx' });
            colDefs.push({ mon: s.name, loai: 'Nhận xét',     type: 'nx' });
        }
    });
    pcs.forEach(p => {
        colDefs.push({ mon: p, loai: 'Mức đạt được', type: 'pc' });
        colDefs.push({ mon: p, loai: 'Nhận xét',     type: 'pc' });
    });

    const N  = 3 + colDefs.length;
    const ws = {};
    ws['!ref']  = XLSX.utils.encode_range({ s:{r:0,c:0}, e:{r:5+students.length+3,c:N-1} });
    ws['!rows'] = [{hpt:22},{hpt:26},{hpt:16},{hpt:36},{hpt:22}];

    // Chiều rộng cột
    const colW = [{wch:5},{wch:14},{wch:26}];
    colDefs.forEach(d => {
        if (d.loai === 'Điểm KTĐK')    colW.push({wch:11});
        else if (d.loai === 'Nhận xét') colW.push({wch:40});
        else                             colW.push({wch:14});
    });
    ws['!cols'] = colW;

    // Merges
    ws['!merges'] = [];
    ws['!merges'].push({s:{r:0,c:0},e:{r:0,c:N-1}});
    ws['!merges'].push({s:{r:1,c:0},e:{r:1,c:N-1}});
    ws['!merges'].push({s:{r:2,c:0},e:{r:2,c:N-1}});
    ws['!merges'].push({s:{r:3,c:0},e:{r:4,c:0}});
    ws['!merges'].push({s:{r:3,c:1},e:{r:4,c:1}});
    ws['!merges'].push({s:{r:3,c:2},e:{r:4,c:2}});
    // Merge tên môn theo nhóm cột
    let ci3 = 3;
    colDefs.forEach((d, idx) => {
        const isLast = idx === colDefs.length - 1 || colDefs[idx+1].mon !== d.mon;
        if (d.mon !== (colDefs[idx-1]||{}).mon) {
            const groupSize = colDefs.filter((x,i) => i>=idx && x.mon===d.mon).length;
            if (groupSize > 1) ws['!merges'].push({s:{r:3,c:ci3},e:{r:3,c:ci3+groupSize-1}});
        }
        ci3++;
    });

    // Helper ghi cell
    const wc = (r, c, v) => {
        const addr = XLSX.utils.encode_cell({r,c});
        if (v===''||v===null||v===undefined) ws[addr]={v:'',t:'s'};
        else if (typeof v==='number') ws[addr]={v,t:'n'};
        else ws[addr]={v:String(v),t:'s'};
    };
    const col2L = c => {
        let s=''; c++;
        while(c>0){s=String.fromCharCode(((c-1)%26)+65)+s;c=Math.floor((c-1)/26);}
        return s;
    };

    const NX_MON = {
        T:'Hoàn thành xuất sắc, nắm chắc kiến thức và kỹ năng',
        H:'Hoàn thành các yêu cầu học tập của môn học',
        C:'Cần cố gắng hơn, chú ý rèn luyện thêm',
    };
    const NX_PC = {
        T: 'Có phẩm chất tốt, thể hiện rõ trong học tập và sinh hoạt',
        'Đ':'Đạt yêu cầu về phẩm chất, cần tiếp tục phát huy',
        C: 'Cần rèn luyện thêm về phẩm chất, nhà trường và gia đình cần phối hợp',
    };

    // Header rows R0–R4
    wc(0,0,`🏫 FMA Nam Hòa - Lớp Phổ Cập TH. Hùng Vương, 158-160 Đất Thánh, Kp 8, P. Tân Hòa | LỚP: ${cls} | NĂM HỌC: ${sy}`);
    wc(1,0,`PHIẾU NHẬP ĐIỂM — ${ghkLabel.toUpperCase()} — NĂM HỌC ${sy} — LỚP ${cls}${hasGHKScore?' [KHỐI 3-5: ĐIỂM CHỈ Ở TV, TOÁN, NGOẠI NGỮ 1]':' [CHỈ MỨC ĐẠT ĐƯỢC]'}`);
    wc(2,0,hasGHKScore
        ?`⚠ Khối 3-5: chỉ nhập ĐIỂM cho Tiếng Việt, Toán, Ngoại ngữ 1/Tiếng Anh → Mức tự điền. Các môn khác chỉ nhập Mức. KHÔNG sửa 3 cột đầu và 5 hàng đầu.`
        :`⚠ Giữa HK — Nhập MỨC ĐẠT ĐƯỢC (T/H/C cho môn; T/Đ/C cho phẩm chất). Nhận xét tự điền theo Mức. KHÔNG sửa 3 cột đầu và 5 hàng đầu.`
    );
    wc(3,0,'STT'); wc(3,1,'Mã học sinh'); wc(3,2,'Họ và tên');
    wc(4,0,'');   wc(4,1,'(không đổi)'); wc(4,2,'(không đổi)');

    let ci4 = 3;
    let lastMon4 = null;
    colDefs.forEach(d => {
        if (d.mon !== lastMon4) {
            const prefix = pcs.includes(d.mon) ? 'PC: ' : '';
            wc(3, ci4, prefix + d.mon);
            lastMon4 = d.mon;
        }
        wc(4, ci4, d.loai);
        ci4++;
    });

    // Data rows
    students.forEach((s, si) => {
        const R  = 5 + si;
        const Rn = R + 1;
        ws['!rows'].push({hpt:20});
        wc(R,0,si+1); wc(R,1,s.code||s.id); wc(R,2,s.name);

        let dc = 3;
        colDefs.forEach(d => {
            if (d.loai === 'Mức đạt được') {
                if (d.type === 'diem') {
                    const diemL = col2L(dc+1);
                    ws[XLSX.utils.encode_cell({r:R,c:dc})] = {t:'s',
                        f:`IF(${diemL}${Rn}="","",IF(${diemL}${Rn}>=9,"T",IF(${diemL}${Rn}>=5,"H","C")))`};
                } else {
                    wc(R, dc, '');
                }
            } else if (d.loai === 'Điểm KTĐK') {
                wc(R, dc, '');
            } else if (d.loai === 'Nhận xét') {
                const mucOffset = d.type==='diem' ? 2 : 1;
                const mucL = col2L(dc - mucOffset);
                if (d.type === 'pc') {
                    ws[XLSX.utils.encode_cell({r:R,c:dc})] = {t:'s',
                        f:`IF(${mucL}${Rn}="","",IF(${mucL}${Rn}="T","${NX_PC.T}",IF(${mucL}${Rn}="Đ","${NX_PC['Đ']}","${NX_PC.C}")))`};
                } else {
                    ws[XLSX.utils.encode_cell({r:R,c:dc})] = {t:'s',
                        f:`IF(${mucL}${Rn}="","",IF(${mucL}${Rn}="T","${NX_MON.T}",IF(${mucL}${Rn}="H","${NX_MON.H}","${NX_MON.C}")))`};
                }
            }
            dc++;
        });
    });

    // Data validation
    ws['!dataValidation'] = [];
    const firstDR = 6, lastDR = 5 + students.length;
    let dvc = 3;
    colDefs.forEach(d => {
        if (d.loai === 'Mức đạt được') {
            ws['!dataValidation'].push({
                sqref:`${col2L(dvc)}${firstDR}:${col2L(dvc)}${lastDR}`,
                type:'list', formula1: d.type==='pc'?'"T,Đ,C"':'"T,H,C"', showDropDown:false,
                showErrorMessage:true, errorTitle:'Giá trị không hợp lệ',
                error: d.type==='pc'?'Chỉ nhập: T, Đ hoặc C':'Chỉ nhập: T, H hoặc C',
            });
        } else if (d.loai === 'Điểm KTĐK') {
            ws['!dataValidation'].push({
                sqref:`${col2L(dvc)}${firstDR}:${col2L(dvc)}${lastDR}`,
                type:'decimal', operator:'between', formula1:'0', formula2:'10',
                showErrorMessage:true, errorTitle:'Điểm không hợp lệ', error:'Nhập điểm từ 0 đến 10',
            });
        }
        dvc++;
    });

    ws['!freeze'] = {xSplit:3, ySplit:5, topLeftCell:'D6'};

    // Sheet hướng dẫn
    const diemSubsGhk = ghkScoreSubjects.map(s=>s.name).join(' · ') || '(không có)';
    const nxSubsGhk  = subs.filter(s=>!ghkHasNumericScore(grade, s.name)).map(s=>s.name).join(' · ');
    const wsG = XLSX.utils.aoa_to_sheet([
        [`HƯỚNG DẪN — ${ghkLabel.toUpperCase()} — TT27/2020`],[''],
        [`Lớp: ${cls}  |  ${ghkLabel}  |  Năm học: ${sy}  |  Khối: ${grade}`],[''],
        ['⚠ ĐÁNH GIÁ GIỮA HỌC KỲ — KHÔNG TÍNH ĐIỂM TRUNG BÌNH'],[''],
        hasGHKScore?['KHỐI 3-5: Chỉ Tiếng Việt, Toán, Ngoại ngữ 1/Tiếng Anh nhập ĐIỂM KTĐK']:
                    ['Khối này chỉ nhập MỨC ĐẠT ĐƯỢC (T/H/C)'],
        [''],
        ['MỨC ĐẠT ĐƯỢC:'],
        ['  Môn học:   T = Tốt  |  H = Hoàn thành  |  C = Cần cố gắng'],
        ['  Phẩm chất: T = Tốt  |  Đ = Đạt          |  C = Cần cố gắng'],[''],
        ['CẤU TRÚC FILE (5 HÀNG ĐẦU — KHÔNG CHỈNH SỬA):'],
        ['  Hàng 1-3: Thông tin trường, tiêu đề, ghi chú'],
        ['  Hàng 4: Tên môn học'],['  Hàng 5: Loại cột'],
        ['  Hàng 6 trở đi: DỮ LIỆU HỌC SINH ✏️'],[''],
        [`Môn có Điểm giữa kỳ: ${diemSubsGhk}`],
        [`Môn chỉ Mức: ${nxSubsGhk}`],
        [`Phẩm chất: ${pcs.join(' · ')}`],
    ]);
    wsG['!cols'] = [{wch:80}];

    const safeGhk = `${mode==='ghk1'?'GiuaHK1':'GiuaHK2'}_${cls}`
        .replace(/[\/\\\?\*\[\]:]/g,'_').substring(0,31);
    const wbGhk = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wbGhk, ws,  safeGhk);
    XLSX.utils.book_append_sheet(wbGhk, wsG, 'HuongDan');
    XLSX.writeFile(wbGhk, `FileMau_${ghkLabel.replace(' ','')}_Lop${cls.replace('/','_')}.xlsx`);

    Swal.fire({
        icon:'success', title:`✅ Đã tải file mẫu ${ghkLabel}!`,
        html:`<div style="text-align:left;font-size:0.88rem">
            <p>📁 <b>FileMau_${ghkLabel.replace(' ','')}_Lop${cls.replace('/','_')}.xlsx</b></p>
            <div style="margin-top:10px;background:#f5f3ff;padding:10px 12px;border-radius:8px">
                ${hasGHKScore
                    ?`<p>📊 <b>Khối 3-5:</b> Môn có điểm: <span style="color:#7c3aed">${diemSubsGhk}</span></p>
                      <p style="margin-top:4px">➜ Nhập ĐIỂM → Mức tự điền → Nhận xét tự điền</p>`
                    :`<p>📝 Khối này chỉ nhập MỨC ĐẠT ĐƯỢC (T/H/C)</p>
                      <p style="margin-top:4px">➜ Nhận xét tự điền theo Mức</p>`
                }
                <p style="margin-top:6px">💎 Phẩm chất: <span style="color:#7c3aed">${pcs.join(' · ')}</span></p>
            </div>
            <p style="margin-top:10px;color:#64748b;font-size:0.8rem">✏️ Nhập từ hàng 6 → <b>Upload lên hệ thống</b></p>
        </div>`,
        confirmButtonText:'OK',
    });
};

// ══════════════════════════════════════════════════════════════════════════════
// importGHKExcel — đọc file mẫu Giữa HK & upload Firebase
// Path lưu: hocba/{studentId}/{year}/ghk1 hoặc ghk2
// ══════════════════════════════════════════════════════════════════════════════
window.importGHKExcel = async function(inp) {
    const modeForAccess = window._scoreMode || 'ghk1';
    const accessStatus = await ensureScoreEntryAllowed(syNow(), modeForAccess);
    if (!accessStatus.allowed) { inp.value = ''; return; }
    const f = inp.files[0]; if (!f) return; inp.value = '';
    const reader = new FileReader();
    reader.onload = async e => {
        try {
            const wb = XLSX.read(e.target.result, {type:'array'});
            const sheetName =
                wb.SheetNames.find(n => /^(Giua|GiuaHK|ghk)/i.test(n.trim())) ||
                wb.SheetNames.find(n => !n.toLowerCase().includes('huongdan')) ||
                wb.SheetNames[0];
            const sh = wb.Sheets[sheetName];
            const allRows = XLSX.utils.sheet_to_json(sh, {header:1, defval:''});

            if (allRows.length < 6) {
                Swal.fire('Lỗi','File không đúng định dạng — cần ít nhất 6 hàng','error'); return;
            }

            const hdr3 = allRows[3] || [];
            const hdr4 = allRows[4] || [];
            const colMap = {};
            let curMon = '';
            for (let c = 3; c < Math.max(hdr3.length, hdr4.length); c++) {
                const monRaw = (hdr3[c]||'').toString().trim();
                if (monRaw) curMon = monRaw.replace(/^PC:\s*/i,'').trim();
                const loai  = (hdr4[c]||'').toString().trim();
                if (curMon && loai) colMap[`${curMon}||${loai}`] = c;
            }

            const dataRows = allRows.slice(5).filter(r => {
                const v = (r[1]||'').toString().trim();
                return v && v !== 'Mã học sinh' && v !== '(không đổi)';
            });
            if (!dataRows.length) {
                Swal.fire('Lỗi','Không tìm thấy dữ liệu học sinh (từ hàng 6 trở đi)','error'); return;
            }

            const mode        = window._scoreMode;
            const sy          = syNow();
            const liveAccess  = await ensureScoreEntryAllowed(sy, mode);
            if (!liveAccess.allowed) return;
            const cls         = window._scoreCurrentClass;
            const grade       = gradeOf(cls);
            const subs        = getSubs(grade);
            const hasGHKScore = ghkDiemSubs(grade).length > 0;
            const pcs         = window.PHAM_CHAT || [];
            const ghkLabel    = mode === 'ghk1' ? 'Giữa HK1' : 'Giữa HK2';

            Swal.fire({title:`Đang import ${ghkLabel}...`, allowOutsideClick:false, didOpen:()=>Swal.showLoading()});

            const byCode = {};
            activeStudentValues().forEach(s => {
                if (s.code) byCode[s.code.trim()] = s;
                if (s.id)   byCode[s.id.trim()]   = s;
            });

            const getVal = (row, mon, loai) => {
                const idx = colMap[`${mon}||${loai}`];
                return idx !== undefined ? (row[idx]??'').toString().trim() : '';
            };

            let ok=0, skip=0, notFound=0;
            const notFoundList=[], updates={};

            for (const row of dataRows) {
                const code = (row[1]||'').toString().trim();
                if (!code) { skip++; continue; }
                const student = byCode[code];
                if (!student) { notFound++; notFoundList.push(code); continue; }

                const existingGhk = await loadGHK(student.id, sy, mode);
                const subData = {};
                const now = typeof window.serverNow === 'function' ? window.serverNow() : Date.now();
                for (const sub of subs) {
                    let mucRaw = getVal(row, sub.name, 'Mức đạt được');
                    let nxRaw  = getVal(row, sub.name, 'Nhận xét');
                    let diemRaw = null;
                    if (ghkHasNumericScore(grade, sub.name)) {
                        const diemText = getVal(row, sub.name, 'Điểm KTĐK');
                        diemRaw = diemText === '' ? null : Number(diemText);
                        if (diemRaw !== null && (!Number.isFinite(diemRaw) || diemRaw < 0 || diemRaw > 10)) {
                            throw new Error(`Điểm ${sub.name} của học sinh ${code} phải từ 0 đến 10`);
                        }
                        if (!mucRaw && diemRaw !== null) mucRaw = diemRaw>=9?'T':diemRaw>=5?'H':'C';
                    }
                    if (!nxRaw && mucRaw) nxRaw = mucRaw==='T'?'Hoàn thành xuất sắc, nắm chắc kiến thức và kỹ năng':mucRaw==='H'?'Hoàn thành các yêu cầu học tập của môn học':'Cần cố gắng hơn, chú ý rèn luyện thêm';
                    const nextRecord = {
                        mucDat: mucRaw,
                        nhanXet: nxRaw,
                        ...(diemRaw !== null ? { diem: diemRaw } : {}),
                    };
                    const audited = buildAuditedScoreRecord(existingGhk[sub.name] || {}, nextRecord, {
                        now,
                        source:'excel',
                        studentId:student.id,
                        studentCode:student.code || student.id,
                        studentName:student.name,
                        className:student.classRoom || student.class || '',
                        subjectName:sub.name,
                        schoolYear:sy,
                        mode,
                    });
                    subData[sub.name] = audited.record;
                    Object.assign(updates, makeScoreAuditUpdate(audited.auditEntry));
                }

                const pc = {};
                pcs.forEach(p => {
                    let mucRaw = getVal(row, p, 'Mức đạt được');
                    let nxRaw  = getVal(row, p, 'Nhận xét');
                    if (!nxRaw && mucRaw) nxRaw = mucRaw==='T'?'Có phẩm chất tốt, thể hiện rõ trong học tập và sinh hoạt':mucRaw==='Đ'?'Đạt yêu cầu về phẩm chất, cần tiếp tục phát huy':'Cần rèn luyện thêm về phẩm chất, nhà trường và gia đình cần phối hợp';
                    pc[p] = {mucDat:mucRaw, nhanXet:nxRaw};
                });

                const basePath = `hocba/${student.id}/${sy.replace('-','_')}/${mode}`;
                Object.entries(subData).forEach(([subjectName, record]) => {
                    updates[`${basePath}/${subjectName}`] = record;
                });
                updates[`${basePath}/__pc`] = pc;
                updates[`${basePath}/__type`] = 'giua_hk';
                updates[`${basePath}/__hk`] = mode;
                updates[`${basePath}/__at`] = now;
                updates[`${basePath}/__by`] = `import:${window.currentUser?.email||'?'}`;
                updates[`${basePath}/__uid`] = window.currentUser?.uid || '';
                const yp = `hocba/${student.id}/${sy.replace('-','_')}`;
                updates[`${yp}/grade`]               = grade;
                updates[`${yp}/schoolYear`]          = sy;
                updates[`${yp}/updatedAt`]           = now;
                Object.entries(subData).forEach(([subjectName, record]) => {
                    updates[`${yp}/${mode}_subjects/${subjectName}`] = record;
                });
                updates[`${yp}/${mode}_phamChat`]    = pc;
                ok++;
            }

            if (Object.keys(updates).length) await window.update(window.ref(window.db), updates);
            Swal.close();

            const allStudents = activeStudentValues()
                .filter(s => (s.classRoom||s.class||'') === cls)
                .sort((a,b) => (a.name||'').split(' ').pop().localeCompare((b.name||'').split(' ').pop(),'vi'));
            await _renderGHKTable(cls, sy, mode, allStudents);

            Swal.fire({
                icon: ok>0?'success':'warning',
                title: ok>0?`✅ Import ${ghkLabel} hoàn tất!`:'⚠️ Không có dữ liệu nào được lưu',
                html:`<div style="text-align:left;font-size:0.9rem">
                    ${ok       ?`<p>✅ <b style="color:#16a34a">${ok}</b> học sinh đã cập nhật</p>`:''}
                    ${notFound ?`<p>⚠️ <b style="color:#dc2626">${notFound}</b> mã HS không tìm thấy
                        ${notFoundList.length?`<br><small style="color:#94a3b8">${notFoundList.slice(0,5).join(', ')}${notFoundList.length>5?'...':''}</small>`:''}</p>`:''}
                    ${skip     ?`<p>⏭️ <b>${skip}</b> hàng bỏ qua</p>`:''}
                    <p style="margin-top:8px;font-size:0.8rem;color:#64748b">${ghkLabel} — ${sy} — Lớp ${cls}</p>
                </div>`,
            });
        } catch(err) {
            Swal.close();
            Swal.fire('Lỗi import', err.message, 'error');
        }
    };
    reader.readAsArrayBuffer(f);
};


// ══════════════════════════════════════════════════════════════════════════════
// MODAL NHẬP ĐIỂM — 1 điểm / HK, đúng mẫu TT27
// ══════════════════════════════════════════════════════════════════════════════
export async function openScoreModal(studentId, sy, hk) {
    if (window._isViewingArchivedYear) {
        Swal.fire('Chỉ xem năm học cũ', 'Năm học đã lưu trữ chỉ được xem lại, không nhập hoặc chỉnh sửa điểm.', 'info');
        return;
    }
    const accessStatus = await ensureScoreEntryAllowed(sy, hk);
    if (!accessStatus.allowed) return;
    const student = window.localData.students[studentId];
    if (!student) return;

    const grade  = scoreGradeOfStudent(student, sy);
    const subs   = getSubs(grade);
    const hkData = await loadHK(studentId, sy, hk);
    const lbl    = hk === 'hk1' ? 'Học kỳ 1' : 'Học kỳ 2';
    const isHK2  = hk === 'hk2';

    // ── Tự động lấy số ngày nghỉ từ Điểm Danh nếu chưa từng lưu ──
    let defaultNghiCP = hkData.__body?.nghiCoPhep;
    let defaultNghiKP = hkData.__body?.nghiKhongPhep;
    if (defaultNghiCP === undefined || defaultNghiCP === null) {
        if (typeof window.getAttendanceAbsenceSummary === 'function') {
            const cls = student.classRoom || student.class || '';
            const sid = student.code || student.id || studentId;
            const att = await window.getAttendanceAbsenceSummary(sy, cls, sid, hk);
            defaultNghiCP = att.coPhep;
            defaultNghiKP = att.khongPhep;
        } else {
            defaultNghiCP = 0;
            defaultNghiKP = 0;
        }
    }

    const mucOpts = (window.MUC_DANH_GIA_MON || ['T','H','C'])
        .map(m => `<option value="${m}">${m}</option>`).join('');
    const mucOptsPC = (window.MUC_DANH_GIA || ['T','Đ','C'])
        .map(m => `<option value="${m}">${m}</option>`).join('');

    // ── Build bảng môn theo mẫu TT27 ─────────────────────────────────────────
    // 4 cột: Môn học | Mức đạt được | Điểm KTĐK | Nhận xét
    // Môn điểm: Điểm KTĐK = 1 ô input
    // Môn NX:   Điểm KTĐK = ô gạch chéo
    const buildRows = () => subs.map(sub => {
        const sc = hkData[sub.name] || {};
        if (sub.type === 'diem') {
            return `<tr>
                <td style="padding:7px 10px;font-weight:600;border:1px solid #e2e8f0;
                    background:#f8faff;min-width:160px">
                    ${sub.name}
                    <span style="font-size:0.68rem;color:#2563eb;font-weight:400;margin-left:4px">Có điểm</span>
                </td>
                <td style="padding:6px 8px;border:1px solid #e2e8f0;min-width:150px">
                    <select id="sc-muc-${sub.name}" class="form-control form-control-sm">
                        <option value="">-- Chọn mức --</option>${mucOpts}
                    </select>
                </td>
                <td style="padding:6px 8px;border:1px solid #e2e8f0;min-width:100px">
                    <input type="number" id="sc-diem-${sub.name}"
                        class="form-control form-control-sm"
                        min="0" max="10" step="0.1" placeholder="0 – 10"
                        style="width:80px;font-weight:700;text-align:center;color:${isEditedScore(sc)?'#dc2626':'#1d4ed8'}"
                        title="${escapeHtml(scoreAuditSummary(sc))}"
                        value="${sc.diem??''}">
                </td>
                <td style="padding:6px 8px;border:1px solid #e2e8f0">
                    <input type="text" id="sc-nx-${sub.name}"
                        class="form-control form-control-sm"
                        placeholder="Nhận xét..." value="${sc.nhanXet||''}">
                </td>
            </tr>`;
        } else {
            return `<tr>
                <td style="padding:7px 10px;font-weight:600;border:1px solid #e2e8f0;
                    background:#f8fafc;min-width:160px">
                    ${sub.name}
                </td>
                <td style="padding:6px 8px;border:1px solid #e2e8f0;min-width:150px">
                    <select id="sc-muc-${sub.name}" class="form-control form-control-sm">
                        <option value="">-- Chọn mức --</option>${mucOpts}
                    </select>
                </td>
                <td style="padding:6px 8px;border:1px solid #e2e8f0;text-align:center;
                    background:repeating-linear-gradient(135deg,#f8fafc 0,#f8fafc 4px,#e2e8f0 4px,#e2e8f0 5px);
                    color:#94a3b8;font-size:0.75rem">—</td>
                <td style="padding:6px 8px;border:1px solid #e2e8f0">
                    <input type="text" id="sc-nx-${sub.name}"
                        class="form-control form-control-sm"
                        placeholder="Nhận xét..." value="${sc.nhanXet||''}">
                </td>
            </tr>`;
        }
    }).join('');

    // Phẩm chất
    const pcData = hkData.__pc || {};
    const pcRows = (window.PHAM_CHAT||[]).map(pc => {
        const k = pc.replace(/\s/g,'_'), d = pcData[pc]||{};
        return `<tr>
            <td style="padding:6px 10px;border:1px solid #e2e8f0;font-weight:500">${pc}</td>
            <td style="padding:6px 8px;border:1px solid #e2e8f0">
                <select id="sc-pc-${k}" class="form-control form-control-sm" style="min-width:130px">
                    <option value="">-- Mức --</option>${mucOptsPC}
                </select>
            </td>
            <td style="padding:6px 8px;border:1px solid #e2e8f0;text-align:center;
                background:repeating-linear-gradient(135deg,#f8fafc 0,#f8fafc 4px,#e2e8f0 4px,#e2e8f0 5px);
                color:#94a3b8;font-size:0.75rem">—</td>
            <td style="padding:6px 8px;border:1px solid #e2e8f0">
                <input type="text" id="sc-pc-nx-${k}" class="form-control form-control-sm"
                    placeholder="Nhận xét..." value="${d.nhanXet||''}">
            </td>
        </tr>`;
    }).join('');

    // Năng lực chung
    const nlcData = hkData.__nlc || {};
    const nlcRows = (window.NANG_LUC_CHUNG||[]).map(nl => {
        const k = nl.replace(/\s/g,'_'), d = nlcData[nl]||{};
        return `<tr>
            <td style="padding:6px 10px;border:1px solid #e2e8f0;font-weight:500">${nl}</td>
            <td style="padding:6px 8px;border:1px solid #e2e8f0">
                <select id="sc-nlc-${k}" class="form-control form-control-sm">
                    <option value="">-- Mức --</option>${mucOptsPC}
                </select>
            </td>
            <td style="padding:6px 8px;border:1px solid #e2e8f0;text-align:center;
                background:repeating-linear-gradient(135deg,#f8fafc 0,#f8fafc 4px,#e2e8f0 4px,#e2e8f0 5px);
                color:#94a3b8">—</td>
            <td style="padding:6px 8px;border:1px solid #e2e8f0">
                <input type="text" id="sc-nlc-nx-${k}" class="form-control form-control-sm"
                    placeholder="Nhận xét..." value="${d.nhanXet||''}">
            </td>
        </tr>`;
    }).join('');

    // Năng lực đặc thù
    const nldData = hkData.__nld || {};
    const nldRows = (window.NANG_LUC_DAC_THU||[]).map(nl => {
        const k = nl.replace(/\s/g,'_'), d = nldData[nl]||{};
        return `<tr>
            <td style="padding:6px 10px;border:1px solid #e2e8f0;font-weight:500">${nl}</td>
            <td style="padding:6px 8px;border:1px solid #e2e8f0">
                <select id="sc-nld-${k}" class="form-control form-control-sm">
                    <option value="">-- Mức --</option>${mucOptsPC}
                </select>
            </td>
            <td style="padding:6px 8px;border:1px solid #e2e8f0;text-align:center;
                background:repeating-linear-gradient(135deg,#f8fafc 0,#f8fafc 4px,#e2e8f0 4px,#e2e8f0 5px);
                color:#94a3b8">—</td>
            <td style="padding:6px 8px;border:1px solid #e2e8f0">
                <input type="text" id="sc-nld-nx-${k}" class="form-control form-control-sm"
                    placeholder="Nhận xét..." value="${d.nhanXet||''}">
            </td>
        </tr>`;
    }).join('');

    Swal.fire({
        title: '',
        html: `
        <div style="text-align:left;font-size:0.88rem">

            <!-- Header -->
            <div style="background:linear-gradient(135deg,#1e3a8a,#2563eb);color:white;
                        border-radius:8px;padding:12px 16px;margin-bottom:14px;
                        display:flex;justify-content:space-between;align-items:center">
                <div>
                    <div style="font-size:1.05rem;font-weight:700">${student.name}</div>
                    <div style="opacity:0.85;font-size:0.82rem">
                        Lớp ${student.classRoom||student.class} — Khối ${grade} — ${lbl} — ${sy}
                        ${isHK2?'<span style="margin-left:8px;background:rgba(255,210,0,0.3);padding:2px 8px;border-radius:10px;font-size:0.75rem">★ Dữ liệu cuối năm</span>':''}
                    </div>
                </div>
                <div style="text-align:center;background:rgba(255,255,255,0.15);
                            border-radius:8px;padding:8px 16px;font-size:0.75rem;line-height:1.4">
                    <i class="fas fa-info-circle"></i><br>
                    Điểm KTĐK được ghi<br><strong>riêng từng môn</strong>
                </div>
            </div>

            <!-- Thể chất + Ngày nghỉ -->
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;
                        background:#f8fafc;padding:10px 12px;border-radius:8px;margin-bottom:14px">
                <div>
                    <label style="font-size:0.75rem;color:#64748b">Chiều cao (cm)</label>
                    <input type="number" id="sc-cc" class="form-control"
                        value="${hkData.__body?.chieuCao||''}" placeholder="VD: 125">
                </div>
                <div>
                    <label style="font-size:0.75rem;color:#64748b">Cân nặng (kg)</label>
                    <input type="number" id="sc-cn" class="form-control"
                        value="${hkData.__body?.canNang||''}" placeholder="VD: 27">
                </div>
                <div>
                    <div style="display:flex;justify-content:space-between;align-items:center">
                        <label style="font-size:0.75rem;color:#64748b">Nghỉ có phép</label>
                        <button type="button" style="font-size:0.7rem;color:#2563eb;cursor:pointer;border:none;background:none;padding:0"
                            onclick="window.syncScoreAbsence('${studentId}', '${sy}', '${hk}')" title="Lấy số ngày nghỉ từ điểm danh">
                            <i class="fas fa-sync-alt"></i> Điểm danh
                        </button>
                    </div>
                    <input type="number" id="sc-np" class="form-control"
                        value="${defaultNghiCP||0}" min="0">
                </div>
                <div>
                    <div style="display:flex;justify-content:space-between;align-items:center">
                        <label style="font-size:0.75rem;color:#64748b">Nghỉ không phép</label>
                        <button type="button" style="font-size:0.7rem;color:#2563eb;cursor:pointer;border:none;background:none;padding:0"
                            onclick="window.syncScoreAbsence('${studentId}', '${sy}', '${hk}')" title="Lấy số ngày nghỉ từ điểm danh">
                            <i class="fas fa-sync-alt"></i> Điểm danh
                        </button>
                    </div>
                    <input type="number" id="sc-nk" class="form-control"
                        value="${defaultNghiKP||0}" min="0">
                </div>
            </div>

            <!-- BẢNG MÔN HỌC giống mẫu TT27 -->
            <div style="font-weight:700;color:#1e3a8a;margin-bottom:8px;font-size:0.9rem">
                1. Các môn học và hoạt động giáo dục
            </div>
            <div style="overflow-x:auto;margin-bottom:14px">
                <table style="width:100%;border-collapse:collapse;font-size:0.85rem">
                    <thead>
                        <tr style="background:#1e3a8a;color:white;text-align:center">
                            <th style="padding:8px 10px;border:1px solid #2563eb;text-align:left;min-width:160px">
                                Môn học và hoạt động GD
                            </th>
                            <th style="padding:8px 10px;border:1px solid #2563eb;min-width:150px">Mức đạt được</th>
                            <th style="padding:8px 10px;border:1px solid #2563eb;min-width:90px">Điểm KTĐK</th>
                            <th style="padding:8px 10px;border:1px solid #2563eb">Nhận xét</th>
                        </tr>
                    </thead>
                    <tbody>${buildRows()}</tbody>
                </table>
            </div>

            <!-- PHẨM CHẤT -->
            <div style="font-weight:700;color:#1e3a8a;margin-bottom:8px;font-size:0.9rem">
                2. Những phẩm chất chủ yếu
            </div>
            <table style="width:100%;border-collapse:collapse;font-size:0.85rem;margin-bottom:14px">
                <thead><tr style="background:#1e3a8a;color:white;text-align:center">
                    <th style="padding:7px 10px;border:1px solid #2563eb;text-align:left;min-width:160px">Phẩm chất</th>
                    <th style="padding:7px 10px;border:1px solid #2563eb;min-width:150px">Mức đạt được</th>
                    <th style="padding:7px 10px;border:1px solid #2563eb;min-width:90px">—</th>
                    <th style="padding:7px 10px;border:1px solid #2563eb">Nhận xét</th>
                </tr></thead>
                <tbody>${pcRows}</tbody>
            </table>

            <!-- NĂNG LỰC -->
            <div style="font-weight:700;color:#1e3a8a;margin-bottom:6px;font-size:0.9rem">3. Năng lực cốt lõi</div>
            <div style="font-style:italic;font-size:0.8rem;color:#64748b;margin-bottom:5px">3.1. Năng lực chung</div>
            <table style="width:100%;border-collapse:collapse;font-size:0.85rem;margin-bottom:10px">
                <thead><tr style="background:#dbeafe">
                    <th style="padding:6px 8px;border:1px solid #93c5fd;min-width:160px">Năng lực</th>
                    <th style="padding:6px 8px;border:1px solid #93c5fd;min-width:150px">Mức đạt được</th>
                    <th style="padding:6px 8px;border:1px solid #93c5fd;min-width:90px;text-align:center">—</th>
                    <th style="padding:6px 8px;border:1px solid #93c5fd">Nhận xét</th>
                </tr></thead>
                <tbody>${nlcRows}</tbody>
            </table>
            <div style="font-style:italic;font-size:0.8rem;color:#64748b;margin-bottom:5px">3.2. Năng lực đặc thù</div>
            <table style="width:100%;border-collapse:collapse;font-size:0.85rem;margin-bottom:14px">
                <thead><tr style="background:#dbeafe">
                    <th style="padding:6px 8px;border:1px solid #93c5fd;min-width:160px">Năng lực</th>
                    <th style="padding:6px 8px;border:1px solid #93c5fd;min-width:150px">Mức đạt được</th>
                    <th style="padding:6px 8px;border:1px solid #93c5fd;min-width:90px;text-align:center">—</th>
                    <th style="padding:6px 8px;border:1px solid #93c5fd">Nhận xét</th>
                </tr></thead>
                <tbody>${nldRows}</tbody>
            </table>

            <!-- KẾT QUẢ GD (luôn nhập, HK2 mới chính thức) -->
            <div style="background:${isHK2?'#f0fdf4':'#f8fafc'};
                        border:${isHK2?'2px solid #86efac':'1px solid #e2e8f0'};
                        border-radius:8px;padding:12px 14px">
                <div style="font-weight:700;color:${isHK2?'#16a34a':'#64748b'};margin-bottom:10px;font-size:0.9rem">
                    ${isHK2 ? '🏆 Đánh giá kết quả giáo dục cuối năm' : '4–6. Đánh giá kết quả (HK1 để theo dõi)'}
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px">
                    <div>
                        <label style="font-size:0.78rem;font-weight:600;color:#64748b">4. Đánh giá kết quả GD</label>
                        <select id="sc-dg" class="form-control">
                            <option value="">-- Chọn --</option>
                            <option value="Hoàn thành xuất sắc">Hoàn thành xuất sắc</option>
                            <option value="Hoàn thành tốt">Hoàn thành tốt</option>
                            <option value="Hoàn thành">Hoàn thành</option>
                            <option value="Chưa hoàn thành">Chưa hoàn thành</option>
                        </select>
                    </div>
                    <div>
                        <label style="font-size:0.78rem;font-weight:600;color:#64748b">5. Khen thưởng</label>
                        <input type="text" id="sc-kt" class="form-control" readonly
                            style="background:#f8fafc;cursor:not-allowed"
                            placeholder="Tự động theo đánh giá kết quả GD"
                            value="${khenThuongTheoDanhGia(hkData.__kq?.danhGia||'')}">
                    </div>
                </div>
                <div>
                    <label style="font-size:0.78rem;font-weight:600;color:#64748b">6. Hoàn thành chương trình</label>
                    <input type="text" id="sc-ht" class="form-control"
                        placeholder="VD: Hoàn thành chương trình lớp ${grade}"
                        value="${hkData.__kq?.hoanThanh||`Hoàn thành chương trình lớp ${grade}`}">
                </div>
            </div>
        </div>`,

        width: '860px',
        showCancelButton: true,
        confirmButtonText: '<i class="fas fa-save"></i> Lưu & Đồng bộ Học bạ',
        cancelButtonText: 'Đóng',
        confirmButtonColor: '#1e3a8a',

        didOpen: () => {
            // Fill dữ liệu môn
            subs.forEach(sub => {
                const sc  = hkData[sub.name] || {};
                const mEl = document.getElementById(`sc-muc-${sub.name}`);
                const nEl = document.getElementById(`sc-nx-${sub.name}`);
                if (mEl && sc.mucDat)  mEl.value  = sc.mucDat;
                if (nEl && sc.nhanXet) nEl.value  = sc.nhanXet;
                if (sub.type === 'diem') {
                    const dEl = document.getElementById(`sc-diem-${sub.name}`);
                    if (dEl && sc.diem !== undefined && sc.diem !== '') dEl.value = sc.diem;
                    attachScoreChangeHighlighter(dEl, sc.diem, sc);
                }
            });
            // Phẩm chất
            (window.PHAM_CHAT||[]).forEach(pc => {
                const k=pc.replace(/\s/g,'_'), d=pcData[pc]||{};
                const m=document.getElementById(`sc-pc-${k}`);
                const n=document.getElementById(`sc-pc-nx-${k}`);
                if (m && d.mucDat)  m.value = d.mucDat;
                if (n && d.nhanXet) n.value = d.nhanXet;
            });
            // Năng lực chung
            (window.NANG_LUC_CHUNG||[]).forEach(nl => {
                const k=nl.replace(/\s/g,'_'), d=nlcData[nl]||{};
                const m=document.getElementById(`sc-nlc-${k}`);
                const n=document.getElementById(`sc-nlc-nx-${k}`);
                if (m && d.mucDat)  m.value = d.mucDat;
                if (n && d.nhanXet) n.value = d.nhanXet;
            });
            // Năng lực đặc thù
            (window.NANG_LUC_DAC_THU||[]).forEach(nl => {
                const k=nl.replace(/\s/g,'_'), d=nldData[nl]||{};
                const m=document.getElementById(`sc-nld-${k}`);
                const n=document.getElementById(`sc-nld-nx-${k}`);
                if (m && d.mucDat)  m.value = d.mucDat;
                if (n && d.nhanXet) n.value = d.nhanXet;
            });

            // Ngân hàng nhận xét tự động theo khối, môn, phẩm chất và năng lực.
            subs.forEach(sub => bindCommentField({
                grade, kind:'subject', name:sub.name, seed:studentId,
                levelId:`sc-muc-${sub.name}`,
                scoreId:sub.type === 'diem' ? `sc-diem-${sub.name}` : '',
                commentId:`sc-nx-${sub.name}`,
            }));
            (window.PHAM_CHAT||[]).forEach(pc => {
                const k=pc.replace(/\s/g,'_');
                bindCommentField({
                    grade, kind:'quality', name:pc, seed:studentId,
                    levelId:`sc-pc-${k}`, commentId:`sc-pc-nx-${k}`,
                    syncLevelFromScore:false,
                });
            });
            (window.NANG_LUC_CHUNG||[]).forEach(nl => {
                const k=nl.replace(/\s/g,'_');
                bindCommentField({
                    grade, kind:'commonCompetency', name:nl, seed:studentId,
                    levelId:`sc-nlc-${k}`, commentId:`sc-nlc-nx-${k}`,
                    syncLevelFromScore:false,
                });
            });
            (window.NANG_LUC_DAC_THU||[]).forEach(nl => {
                const k=nl.replace(/\s/g,'_');
                bindCommentField({
                    grade, kind:'specificCompetency', name:nl, seed:studentId,
                    levelId:`sc-nld-${k}`, commentId:`sc-nld-nx-${k}`,
                    syncLevelFromScore:false,
                });
            });
            addCommentBankToolbar(Swal.getHtmlContainer() || document);

            // Kết quả
            const kq = hkData.__kq || {};
            const dg = document.getElementById('sc-dg');
            const kt = document.getElementById('sc-kt');
            if (dg && kq.danhGia) dg.value = kq.danhGia;

            // Đồng bộ khen thưởng ngay khi thay đổi đánh giá kết quả giáo dục.
            const syncKhenThuong = () => {
                if (kt) kt.value = khenThuongTheoDanhGia(dg?.value || '');
            };
            if (dg) dg.addEventListener('change', syncKhenThuong);
            syncKhenThuong();
        },

        preConfirm: async () => {
            const liveAccess = await ensureScoreEntryAllowed(sy, hk);
            if (!liveAccess.allowed) return false;

            const now = typeof window.serverNow === 'function' ? window.serverNow() : Date.now();
            const subData = {};
            const auditUpdates = {};
            for (const sub of subs) {
                let diemValue = null;
                if (sub.type === 'diem') {
                    const diemText = (document.getElementById(`sc-diem-${sub.name}`)?.value || '').trim();
                    diemValue = diemText === '' ? null : Number(diemText);
                    if (diemValue !== null && (!Number.isFinite(diemValue) || diemValue < 0 || diemValue > 10)) {
                        Swal.showValidationMessage(`Điểm ${sub.name} phải nằm trong khoảng 0 đến 10`);
                        return false;
                    }
                }

                const nextRecord = {
                    mucDat:  document.getElementById(`sc-muc-${sub.name}`)?.value  || '',
                    nhanXet: document.getElementById(`sc-nx-${sub.name}`)?.value   || '',
                    ...(sub.type === 'diem' && diemValue !== null ? { diem: diemValue } : {}),
                };
                const audited = buildAuditedScoreRecord(hkData[sub.name] || {}, nextRecord, {
                    now,
                    source:'manual',
                    studentId,
                    studentCode:student.code || student.id,
                    studentName:student.name,
                    className:student.classRoom || student.class || '',
                    subjectName:sub.name,
                    schoolYear:sy,
                    mode:hk,
                });
                subData[sub.name] = audited.record;
                Object.assign(auditUpdates, makeScoreAuditUpdate(audited.auditEntry));
            }

            const pc = {}, nlc = {}, nld = {};
            (window.PHAM_CHAT||[]).forEach(x => {
                const k=x.replace(/\s/g,'_');
                pc[x] = { mucDat:document.getElementById(`sc-pc-${k}`)?.value||'',
                           nhanXet:document.getElementById(`sc-pc-nx-${k}`)?.value||'' };
            });
            (window.NANG_LUC_CHUNG||[]).forEach(x => {
                const k=x.replace(/\s/g,'_');
                nlc[x]={ mucDat:document.getElementById(`sc-nlc-${k}`)?.value||'',
                          nhanXet:document.getElementById(`sc-nlc-nx-${k}`)?.value||'' };
            });
            (window.NANG_LUC_DAC_THU||[]).forEach(x => {
                const k=x.replace(/\s/g,'_');
                nld[x]={ mucDat:document.getElementById(`sc-nld-${k}`)?.value||'',
                          nhanXet:document.getElementById(`sc-nld-nx-${k}`)?.value||'' };
            });

            const danhGia = document.getElementById('sc-dg')?.value || '';
            const kq = {
                danhGia,
                khenThuong: khenThuongTheoDanhGia(danhGia),
                hoanThanh:  document.getElementById('sc-ht')?.value || '',
            };
            const body = {
                chieuCao:       parseFloat(document.getElementById('sc-cc')?.value) || 0,
                canNang:        parseFloat(document.getElementById('sc-cn')?.value) || 0,
                nghiCoPhep:     parseInt(document.getElementById('sc-np')?.value)   || 0,
                nghiKhongPhep:  parseInt(document.getElementById('sc-nk')?.value)   || 0,
            };

            const hkSave = {
                ...hkData,
                ...subData,
                __pc: pc, __nlc: nlc, __nld: nld,
                __kq: kq, __body: body,
                __at: now,
                __by: window.currentUser?.email || '',
                __uid: window.currentUser?.uid || '',
            };

            const rootUpdates = {
                [hkPath(studentId, sy, hk)]: hkSave,
                ...auditUpdates,
            };
            const yp = yearPath(studentId, sy);
            rootUpdates[`${yp}/grade`] = grade;
            rootUpdates[`${yp}/schoolYear`] = sy;
            rootUpdates[`${yp}/updatedAt`] = now;
            rootUpdates[`${yp}/chieuCao`] = body.chieuCao;
            rootUpdates[`${yp}/canNang`] = body.canNang;

            // Tính tổng ngày nghỉ cả năm (HK1 + HK2) để đồng bộ vào node học bạ cả năm
            let totalNghiCoPhep = body.nghiCoPhep;
            let totalNghiKhongPhep = body.nghiKhongPhep;
            try {
                const otherHk = hk === 'hk1' ? 'hk2' : 'hk1';
                const otherSnap = await window.get(dbRef(hkPath(studentId, sy, otherHk)));
                const otherData = otherSnap.val() || {};
                const otherBody = otherData.__body || {};
                totalNghiCoPhep = (body.nghiCoPhep || 0) + (otherBody.nghiCoPhep || 0);
                totalNghiKhongPhep = (body.nghiKhongPhep || 0) + (otherBody.nghiKhongPhep || 0);
            } catch (e) {
                console.warn('[scores] Không tính được tổng ngày nghỉ cả năm:', e);
            }

            rootUpdates[`${yp}/nghiCoPhep`] = totalNghiCoPhep;
            rootUpdates[`${yp}/nghiKhongPhep`] = totalNghiKhongPhep;
            Object.entries(subData).forEach(([subjectName, record]) => {
                rootUpdates[`${yp}/${hk}_subjects/${subjectName}`] = record;
                if (isHK2) rootUpdates[`${yp}/subjects/${subjectName}`] = record;
            });
            rootUpdates[`${yp}/${hk}_phamChat`] = pc;
            rootUpdates[`${yp}/${hk}_nangLucChung`] = nlc;
            rootUpdates[`${yp}/${hk}_nangLucDacThu`] = nld;
            if (isHK2) {
                rootUpdates[`${yp}/phamChat`] = pc;
                rootUpdates[`${yp}/nangLucChung`] = nlc;
                rootUpdates[`${yp}/nangLucDacThu`] = nld;
                if (kq.danhGia) rootUpdates[`${yp}/ketQua`] = kq;
            } else {
                const existSnap = await window.get(dbRef(`${yp}/hk2_subjects`));
                if (!existSnap.val()) {
                    Object.entries(subData).forEach(([subjectName, record]) => {
                        rootUpdates[`${yp}/subjects/${subjectName}`] = record;
                    });
                }
            }

            await window.update(window.ref(window.db), rootUpdates);
            return { ok: true, kq, isHK2 };
        }
    }).then(res => {
        if (!res.isConfirmed) return;
        const msg = res.value?.isHK2 && res.value?.kq?.danhGia
            ? `<small>Kết quả giáo dục <b>${res.value.kq.danhGia}</b> đã đồng bộ sang Học bạ</small>`
            : '<small>Dữ liệu đã đồng bộ sang Học bạ</small>';
        Swal.fire({ icon:'success', title:'✅ Đã lưu!', html: msg, timer:2000, showConfirmButton:false });
        if (typeof window.showToast === 'function') {
            window.showToast('Đã lưu điểm và đồng bộ sang Học bạ thành công!', 'success');
        }
        _renderTable(window._scoreCurrentClass, sy, hk);
    });
}

// ══════════════════════════════════════════════════════════════════════════════
// EXCEL HELPERS — dùng SheetJS gốc (XLSX global từ cdn.sheetjs.com)
// Cấu trúc 5 hàng header:
//   R0: Thông tin trường  R1: Tiêu đề  R2: Ghi chú
//   R3: Header môn (merge)  R4: Sub-header loại cột  R5+: Dữ liệu HS
// ══════════════════════════════════════════════════════════════════════════════

// ── Tạo 1 cell với value, style không cần (SheetJS gốc không support) ────────
function _sc(v) {
    if (v === '' || v === null || v === undefined) return { v:'', t:'s' };
    if (typeof v === 'number') return { v, t:'n' };
    return { v: String(v), t:'s' };
}

// ── Ghi cell vào ws, tự cập nhật !ref ────────────────────────────────────────
function _wc(ws, r, c, v) {
    const addr = XLSX.utils.encode_cell({ r, c });
    ws[addr] = _sc(v);
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
    if (r > range.e.r) range.e.r = r;
    if (c > range.e.c) range.e.c = c;
    ws['!ref'] = XLSX.utils.encode_range(range);
}

// ── Xây colDefs để export và import dùng chung ────────────────────────────────
function _buildColDefs(ds, nxs, pcs) {
    const defs = [];
    ds.forEach(s  => { defs.push({mon:s.name,loai:'Mức đạt được',type:'diem'}); defs.push({mon:s.name,loai:'Điểm KTĐK',type:'diem'}); defs.push({mon:s.name,loai:'Nhận xét',type:'diem'}); });
    nxs.forEach(s => { defs.push({mon:s.name,loai:'Mức đạt được',type:'nx'}); defs.push({mon:s.name,loai:'Nhận xét',type:'nx'}); });
    pcs.forEach(p => { defs.push({mon:p,loai:'Mức đạt được',type:'pc'}); defs.push({mon:p,loai:'Nhận xét',type:'pc'}); });
    return defs;
}

// ══════════════════════════════════════════════════════════════════════════════
// downloadScoreTemplate — xuất file mẫu với công thức tự động Mức + Nhận xét
// ══════════════════════════════════════════════════════════════════════════════
window.downloadScoreTemplate = function() {
    const cls   = window._scoreCurrentClass;
    const hk    = window._scoreSemester || 'hk1';
    const sy    = syNow();
    const hkNum = hk === 'hk1' ? 1 : 2;

    const students = activeStudentValues()
        .filter(s => (s.classRoom||s.class||'') === cls)
        .sort((a,b) => (a.name||'').split(' ').pop()
            .localeCompare((b.name||'').split(' ').pop(),'vi'));

    if (!students.length) {
        Swal.fire('Thông báo','Vui lòng chọn lớp có học sinh trước','warning');
        return;
    }

    const grade = gradeOf(cls);
    const ds    = diemSubs(grade);
    const nxs   = nxSubs(grade);
    const pcs   = window.PHAM_CHAT || [];
    const defs  = _buildColDefs(ds, nxs, pcs);
    const N     = 3 + defs.length;

    const ws = {};
    ws['!ref'] = XLSX.utils.encode_range({ s:{r:0,c:0}, e:{r:5+students.length+5, c:N-1} });

    // ── Row heights ───────────────────────────────────────────────────────────
    ws['!rows'] = [
        {hpt:22}, // R0 trường
        {hpt:24}, // R1 tiêu đề
        {hpt:15}, // R2 ghi chú
        {hpt:32}, // R3 header môn
        {hpt:22}, // R4 sub-header
    ];

    // ── Column widths ─────────────────────────────────────────────────────────
    const colW = [{wch:5},{wch:14},{wch:24}];
    ds.forEach(()  => colW.push({wch:12},{wch:10},{wch:38}));
    nxs.forEach(() => colW.push({wch:12},{wch:38}));
    pcs.forEach(() => colW.push({wch:12},{wch:38}));
    ws['!cols'] = colW;

    // ── Merges ────────────────────────────────────────────────────────────────
    ws['!merges'] = [];
    ws['!merges'].push({ s:{r:0,c:0}, e:{r:0,c:N-1} });
    ws['!merges'].push({ s:{r:1,c:0}, e:{r:1,c:N-1} });
    ws['!merges'].push({ s:{r:2,c:0}, e:{r:2,c:N-1} });
    ws['!merges'].push({ s:{r:3,c:0}, e:{r:4,c:0} });
    ws['!merges'].push({ s:{r:3,c:1}, e:{r:4,c:1} });
    ws['!merges'].push({ s:{r:3,c:2}, e:{r:4,c:2} });
    let ci = 3;
    ds.forEach(sub  => { ws['!merges'].push({s:{r:3,c:ci},e:{r:3,c:ci+2}}); ci+=3; });
    nxs.forEach(sub => { ws['!merges'].push({s:{r:3,c:ci},e:{r:3,c:ci+1}}); ci+=2; });
    pcs.forEach(pc  => { ws['!merges'].push({s:{r:3,c:ci},e:{r:3,c:ci+1}}); ci+=2; });

    // ── Headers ───────────────────────────────────────────────────────────────
    _wc(ws,0,0, `🏫 FMA Nam Hòa - Lớp Phổ Cập TH. Hùng Vương, 158-160 Đất Thánh, Kp 8, P. Tân Hòa | LỚP: ${cls} | NĂM HỌC: ${sy}`);
    _wc(ws,1,0, `PHIẾU NHẬP ĐIỂM — HỌC KỲ ${hkNum} — NĂM HỌC ${sy} — LỚP ${cls}`);
    _wc(ws,2,0, `⚠ Mức đạt được tự động theo điểm: ≥9→T | 5–8→H | <5→C  ●  Nhận xét tự động theo mức  ●  Có thể sửa tay  ●  KHÔNG sửa 5 hàng đầu và 3 cột đầu`);

    _wc(ws,3,0,'STT'); _wc(ws,3,1,'Mã học sinh'); _wc(ws,3,2,'Họ và tên');
    ci = 3;
    ds.forEach(sub  => { _wc(ws,3,ci,sub.name);     ci+=3; });
    nxs.forEach(sub => { _wc(ws,3,ci,sub.name);     ci+=2; });
    pcs.forEach(pc  => { _wc(ws,3,ci,`PC: ${pc}`);  ci+=2; });

    _wc(ws,4,0,''); _wc(ws,4,1,'(không đổi)'); _wc(ws,4,2,'(không đổi)');
    ci = 3;
    ds.forEach(()  => { _wc(ws,4,ci,'Mức đạt được'); _wc(ws,4,ci+1,'Điểm KTĐK'); _wc(ws,4,ci+2,'Nhận xét'); ci+=3; });
    nxs.forEach(() => { _wc(ws,4,ci,'Mức đạt được'); _wc(ws,4,ci+1,'Nhận xét'); ci+=2; });
    pcs.forEach(() => { _wc(ws,4,ci,'Mức đạt được'); _wc(ws,4,ci+1,'Nhận xét'); ci+=2; });

    // ── Data rows với công thức tự động ──────────────────────────────────────
    // Hàm chuyển col index → chữ cái Excel (A, B, ..., Z, AA, ...)
    const col2letter = c => {
        let s = '';
        c++;
        while (c > 0) { s = String.fromCharCode(((c-1)%26)+65) + s; c = Math.floor((c-1)/26); }
        return s;
    };

    // Map colIndex điểm → colIndex mức (cho môn type=diem)
    // để công thức Nhận xét của môn diem tham chiếu cột Mức
    const diemColToMucCol = {};
    const mucColLetter    = {};
    let ci2 = 3;
    ds.forEach(sub => {
        diemColToMucCol[ci2+1] = ci2;   // diem = ci2+1, muc = ci2
        mucColLetter[sub.name] = col2letter(ci2);
        ci2 += 3;
    });
    nxs.forEach(sub => {
        mucColLetter[sub.name] = col2letter(ci2);
        ci2 += 2;
    });

    // Nhận xét mẫu theo mức (môn học)
    const nxByMuc = {
        T: 'Hoàn thành xuất sắc, nắm chắc kiến thức và kỹ năng',
        H: 'Hoàn thành các yêu cầu học tập của môn học',
        C: 'Cần cố gắng hơn, chú ý rèn luyện thêm',
    };
    // Nhận xét mẫu theo mức (phẩm chất)
    const nxByMucPC = {
        T: 'Có phẩm chất tốt, thể hiện rõ trong học tập và sinh hoạt',
        'Đ': 'Đạt yêu cầu về phẩm chất, cần tiếp tục phát huy',
        C: 'Cần rèn luyện thêm về phẩm chất, nhà trường và gia đình cần phối hợp',
    };

    students.forEach((s, si) => {
        const R    = 5 + si;
        const Rnum = R + 1; // Excel row number (1-based)
        ws['!rows'].push({hpt:20});
        _wc(ws,R,0,si+1);
        _wc(ws,R,1,s.code||s.id);
        _wc(ws,R,2,s.name);

        let dc = 3;

        // Môn có điểm: cột Mức = công thức từ Điểm, Nhận xét = công thức từ Mức
        ds.forEach(sub => {
            const mucL  = col2letter(dc);     // cột Mức
            const diemL = col2letter(dc+1);   // cột Điểm
            const nxL   = col2letter(dc+2);   // cột Nhận xét

            // Cột Mức: công thức IF theo điểm
            // =IF(B="","",IF(B>=9,"T",IF(B>=5,"H","C")))
            const mucFormula = `IF(${diemL}${Rnum}="","",IF(${diemL}${Rnum}>=9,"T",IF(${diemL}${Rnum}>=5,"H","C")))`;
            ws[XLSX.utils.encode_cell({r:R,c:dc})] = { t:'s', f: mucFormula };

            // Cột Điểm: trống để nhập
            _wc(ws,R,dc+1,'');

            // Cột Nhận xét: công thức IF từ Mức
            const nxFormula = `IF(${mucL}${Rnum}="","",IF(${mucL}${Rnum}="T","${nxByMuc.T}",IF(${mucL}${Rnum}="H","${nxByMuc.H}","${nxByMuc.C}")))`;
            ws[XLSX.utils.encode_cell({r:R,c:dc+2})] = { t:'s', f: nxFormula };

            dc += 3;
        });

        // Môn nhận xét: Mức để trống, Nhận xét công thức từ Mức
        nxs.forEach(sub => {
            const mucL = col2letter(dc);
            const nxFormula = `IF(${mucL}${Rnum}="","",IF(${mucL}${Rnum}="T","${nxByMuc.T}",IF(${mucL}${Rnum}="H","${nxByMuc.H}","${nxByMuc.C}")))`;
            _wc(ws,R,dc,'');   // Mức — nhập tay
            ws[XLSX.utils.encode_cell({r:R,c:dc+1})] = { t:'s', f: nxFormula };
            dc += 2;
        });

        // Phẩm chất: Mức để trống, Nhận xét công thức từ Mức
        pcs.forEach(pc => {
            const mucL = col2letter(dc);
            const nxFormula = `IF(${mucL}${Rnum}="","",IF(${mucL}${Rnum}="T","${nxByMucPC.T}",IF(${mucL}${Rnum}="Đ","${nxByMucPC['Đ']}","${nxByMucPC.C}")))`;
            _wc(ws,R,dc,'');   // Mức — nhập tay
            ws[XLSX.utils.encode_cell({r:R,c:dc+1})] = { t:'s', f: nxFormula };
            dc += 2;
        });
    });

    // ── Data validation (dropdown Mức) ────────────────────────────────────────
    ws['!dataValidation'] = ws['!dataValidation'] || [];
    const firstDataRow = 6; // Excel row 6 = index 5
    const lastDataRow  = 5 + students.length;

    let dvc = 3;
    // Môn diem: cột Mức (không cần dropdown vì có công thức, nhưng giữ để sửa tay)
    ds.forEach(() => {
        ws['!dataValidation'].push({
            sqref: `${col2letter(dvc)}${firstDataRow}:${col2letter(dvc)}${lastDataRow}`,
            type: 'list', formula1: '"T,H,C"', showDropDown: false,
            showErrorMessage: true, errorTitle: 'Giá trị không hợp lệ',
            error: 'Chỉ nhập: T, H hoặc C'
        });
        dvc += 3;
    });
    // Môn nhanxet: cột Mức
    nxs.forEach(() => {
        ws['!dataValidation'].push({
            sqref: `${col2letter(dvc)}${firstDataRow}:${col2letter(dvc)}${lastDataRow}`,
            type: 'list', formula1: '"T,H,C"', showDropDown: false,
            showErrorMessage: true, errorTitle: 'Giá trị không hợp lệ',
            error: 'Chỉ nhập: T, H hoặc C'
        });
        dvc += 2;
    });
    // Phẩm chất: T, Đ, C
    pcs.forEach(() => {
        ws['!dataValidation'].push({
            sqref: `${col2letter(dvc)}${firstDataRow}:${col2letter(dvc)}${lastDataRow}`,
            type: 'list', formula1: '"T,Đ,C"', showDropDown: false,
            showErrorMessage: true, errorTitle: 'Giá trị không hợp lệ',
            error: 'Chỉ nhập: T, Đ hoặc C'
        });
        dvc += 2;
    });

    // Freeze panes
    ws['!freeze'] = { xSplit:3, ySplit:5, topLeftCell:'D6' };

    // ── Sheet hướng dẫn ───────────────────────────────────────────────────────
    const wsG = XLSX.utils.aoa_to_sheet([
        [`HƯỚNG DẪN NHẬP ĐIỂM — TT27/2020`],
        [''],
        [`Lớp: ${cls}   |   Học kỳ: ${hkNum}   |   Năm học: ${sy}`],
        [''],
        ['TÍNH NĂNG TỰ ĐỘNG:'],
        ['  • Nhập điểm vào cột "Điểm KTĐK" → cột "Mức đạt được" tự điền:'],
        ['      ≥ 9.0  →  T (Tốt)'],
        ['      5–8.9  →  H (Hoàn thành)'],
        ['      < 5.0  →  C (Cần cố gắng)'],
        ['  • Cột "Nhận xét" tự động điền theo mức — có thể sửa tay nếu muốn'],
        ['  • Môn nhận xét và Phẩm chất: nhập Mức tay → Nhận xét tự điền'],
        [''],
        ['CẤU TRÚC FILE (5 HÀNG HEADER — KHÔNG CHỈNH SỬA):'],
        ['  • Hàng 1-3: Thông tin, tiêu đề, ghi chú'],
        ['  • Hàng 4: Tên môn học'],
        ['  • Hàng 5: Loại cột'],
        ['  • Hàng 6 trở đi: DỮ LIỆU HỌC SINH ✏️'],
        [''],
        ['QUY TẮC NHẬP:'],
        ['  • Môn học/Hoạt động GD: T | H | C'],
        ['  • Phẩm chất/Năng lực: T | Đ | C'],
        ['  • Điểm KTĐK: số 0-10 (VD: 8.5)'],
        ['  • Ô /// = không có điểm → để trống'],
        ['  • KHÔNG thay đổi 3 cột đầu (STT, Mã HS, Họ tên)'],
        [''],
        [`Môn có điểm (${ds.length}): ${ds.map(s=>s.name).join(' · ')}`],
        [`Môn nhận xét (${nxs.length}): ${nxs.map(s=>s.name).join(' · ')}`],
        [`Phẩm chất (${pcs.length}): ${pcs.join(' · ')}`],
    ]);
    wsG['!cols'] = [{wch:80}];

    const safe = `HK${hkNum}_${cls}`.replace(/[\/\\\?\*\[\]:]/g,'_').substring(0,31);
    const wb   = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws,  safe);
    XLSX.utils.book_append_sheet(wb, wsG, 'HuongDan');
    XLSX.writeFile(wb, `FileMau_Diem_HK${hkNum}_Lop${cls.replace('/','_')}.xlsx`);

    Swal.fire({
        icon:'success', title:'Đã tải file mẫu!',
        html:`<div style="text-align:left;font-size:0.88rem">
            <p>📁 <b>FileMau_Diem_HK${hkNum}_Lop${cls.replace('/','_')}.xlsx</b></p>
            <div style="margin-top:10px;background:#f0fdf4;padding:10px 12px;border-radius:8px">
                <p style="font-weight:600;margin-bottom:5px">📚 Môn có Điểm KTĐK (${ds.length} môn):</p>
                <p style="color:#1d4ed8;margin-bottom:8px">${ds.map(s=>s.name).join(' · ')}</p>
                <p style="font-weight:600;margin-bottom:5px">📖 Môn chỉ Nhận xét (${nxs.length} môn):</p>
                <p style="color:#047857;margin-bottom:8px">${nxs.map(s=>s.name).join(' · ')}</p>
                <p style="font-weight:600;margin-bottom:5px">💎 Phẩm chất (${pcs.length}):</p>
                <p style="color:#6d28d9">${pcs.join(' · ')}</p>
            </div>
            <p style="margin-top:10px;color:#64748b;font-size:0.8rem">
                ✏️ Nhập điểm từ hàng 6 trở đi → Upload lên hệ thống
            </p>
        </div>`,
        confirmButtonText:'OK'
    });
};


// ══════════════════════════════════════════════════════════════════════════════
// importScoreExcel — đọc file mẫu (5 hàng header) & upload Firebase
// ══════════════════════════════════════════════════════════════════════════════
window.importScoreExcel = async function(inp) {
    const modeForAccess = window._scoreSemester || 'hk1';
    const accessStatus = await ensureScoreEntryAllowed(syNow(), modeForAccess);
    if (!accessStatus.allowed) { inp.value = ''; return; }
    const f = inp.files[0]; if (!f) return; inp.value = '';
    const reader = new FileReader();
    reader.onload = async e => {
        try {
            const wb = XLSX.read(e.target.result, { type:'array' });
            const sheetName = wb.SheetNames.find(n =>
                n.startsWith('HK') && !n.toLowerCase().includes('uongdan')
            ) || wb.SheetNames[0];
            const sh = wb.Sheets[sheetName];
            const allRows = XLSX.utils.sheet_to_json(sh, { header:1, defval:'' });

            if (allRows.length < 6) {
                Swal.fire('Lỗi','File không đúng định dạng — cần ít nhất 6 hàng (5 header + 1 dữ liệu)','error');
                return;
            }

            // R3 = tên môn (index 3), R4 = loại cột (index 4), data từ index 5
            const hdr1 = allRows[3] || [];
            const hdr2 = allRows[4] || [];

            // Build colMap: 'TenMon||LoaiCot' → colIndex
            const colMap = {};
            let curMon = '';
            for (let c = 3; c < Math.max(hdr1.length, hdr2.length); c++) {
                const monRaw = (hdr1[c]||'').toString().trim();
                if (monRaw) curMon = monRaw.replace(/^PC:\s*/i,'').trim();
                const loai = (hdr2[c]||'').toString().trim();
                if (curMon && loai) colMap[`${curMon}||${loai}`] = c;
            }

            // Lọc hàng dữ liệu: Mã HS ở cột B (index 1)
            const dataRows = allRows.slice(5).filter(r => {
                const v = (r[1]||'').toString().trim();
                return v && v !== 'Mã học sinh' && v !== '(không đổi)';
            });

            if (!dataRows.length) {
                Swal.fire('Lỗi','Không tìm thấy dữ liệu học sinh (từ hàng 6 trở đi)','error');
                return;
            }

            const hk    = window._scoreSemester || 'hk1';
            const isHK2 = hk === 'hk2';
            const sy    = syNow();
            const liveAccess = await ensureScoreEntryAllowed(sy, hk);
            if (!liveAccess.allowed) return;
            const grade = gradeOf(window._scoreCurrentClass);
            const ds    = diemSubs(grade);
            const nxs   = nxSubs(grade);
            const pcs   = window.PHAM_CHAT || [];

            Swal.fire({ title:'Đang import điểm...', allowOutsideClick:false,
                        didOpen:()=>Swal.showLoading() });

            const byCode = {};
            activeStudentValues().forEach(s => {
                if (s.code) byCode[s.code.trim()] = s;
                if (s.id)   byCode[s.id.trim()]   = s;
            });

            const getVal = (row, mon, loai) => {
                const idx = colMap[`${mon}||${loai}`];
                return idx !== undefined ? (row[idx]??'').toString().trim() : '';
            };

            let ok=0, skip=0, notFound=0, notFoundList=[];
            const updates = {};

            for (const row of dataRows) {
                const code = (row[1]||'').toString().trim();
                if (!code) { skip++; continue; }
                const student = byCode[code];
                if (!student) { notFound++; notFoundList.push(code); continue; }

                const existingHk = await loadHK(student.id, sy, hk);
                const subData = {};
                const now = typeof window.serverNow === 'function' ? window.serverNow() : Date.now();
                for (const sub of ds) {
                    const diemText = getVal(row, sub.name, 'Điểm KTĐK');
                    const diemRaw = diemText === '' ? null : Number(diemText);
                    if (diemRaw !== null && (!Number.isFinite(diemRaw) || diemRaw < 0 || diemRaw > 10)) {
                        throw new Error(`Điểm ${sub.name} của học sinh ${code} phải từ 0 đến 10`);
                    }
                    let mucRaw = getVal(row, sub.name, 'Mức đạt được');
                    if (!mucRaw && diemRaw !== null) {
                        mucRaw = diemRaw >= 9 ? 'T' : diemRaw >= 5 ? 'H' : 'C';
                    }
                    let nxRaw = getVal(row, sub.name, 'Nhận xét');
                    if (!nxRaw && mucRaw) {
                        nxRaw = mucRaw === 'T' ? 'Hoàn thành xuất sắc, nắm chắc kiến thức và kỹ năng'
                              : mucRaw === 'H' ? 'Hoàn thành các yêu cầu học tập của môn học'
                              : 'Cần cố gắng hơn, chú ý rèn luyện thêm';
                    }
                    const nextRecord = {
                        mucDat: mucRaw,
                        nhanXet: nxRaw,
                        ...(diemRaw !== null ? { diem: diemRaw } : {}),
                    };
                    const audited = buildAuditedScoreRecord(existingHk[sub.name] || {}, nextRecord, {
                        now,
                        source:'excel',
                        studentId:student.id,
                        studentCode:student.code || student.id,
                        studentName:student.name,
                        className:student.classRoom || student.class || '',
                        subjectName:sub.name,
                        schoolYear:sy,
                        mode:hk,
                    });
                    subData[sub.name] = audited.record;
                    Object.assign(updates, makeScoreAuditUpdate(audited.auditEntry));
                }
                nxs.forEach(sub => {
                    subData[sub.name] = {
                        ...(existingHk[sub.name] || {}),
                        mucDat:  getVal(row, sub.name, 'Mức đạt được'),
                        nhanXet: getVal(row, sub.name, 'Nhận xét'),
                        __by: `import:${window.currentUser?.email||'?'}`,
                        __at: now,
                    };
                });
                const pc = {};
                pcs.forEach(p => {
                    pc[p] = {
                        mucDat:  getVal(row, p, 'Mức đạt được'),
                        nhanXet: getVal(row, p, 'Nhận xét'),
                    };
                });

                const basePath = `hocba/${student.id}/${sy.replace('-','_')}/${hk}`;
                Object.entries(subData).forEach(([subjectName, record]) => {
                    updates[`${basePath}/${subjectName}`] = record;
                });
                updates[`${basePath}/__pc`] = pc;
                updates[`${basePath}/__at`] = now;
                updates[`${basePath}/__by`] = `import:${window.currentUser?.email||'?'}`;
                updates[`${basePath}/__uid`] = window.currentUser?.uid || '';
                const yp = `hocba/${student.id}/${sy.replace('-','_')}`;
                updates[`${yp}/grade`]      = grade;
                updates[`${yp}/schoolYear`] = sy;
                updates[`${yp}/updatedAt`]  = now;
                Object.entries(subData).forEach(([subjectName, record]) => {
                    updates[`${yp}/${hk}_subjects/${subjectName}`] = record;
                    if (isHK2) updates[`${yp}/subjects/${subjectName}`] = record;
                });
                updates[`${yp}/${hk}_phamChat`] = pc;
                if (isHK2) updates[`${yp}/phamChat`] = pc;
                ok++;
            }

            if (Object.keys(updates).length)
                await window.update(window.ref(window.db), updates);

            Swal.close();
            await _renderTable(window._scoreCurrentClass, sy, hk);

            const hkNum = hk === 'hk1' ? 1 : 2;
            Swal.fire({
                icon: ok>0 ? 'success' : 'warning',
                title: ok>0 ? '✅ Import hoàn tất!' : '⚠️ Không có dữ liệu nào được lưu',
                html:`<div style="text-align:left;font-size:0.9rem">
                    ${ok       ? `<p>✅ <b style="color:#16a34a">${ok}</b> học sinh đã cập nhật</p>` : ''}
                    ${notFound ? `<p>⚠️ <b style="color:#dc2626">${notFound}</b> mã HS không tìm thấy
                        ${notFoundList.length ? `<br><small>${notFoundList.slice(0,5).join(', ')}${notFoundList.length>5?'...':''}</small>` : ''}</p>` : ''}
                    ${skip     ? `<p>⏭️ <b>${skip}</b> hàng bỏ qua</p>` : ''}
                    <p style="margin-top:8px;font-size:0.8rem;color:#64748b">
                        HK${hkNum} — ${sy} — Lớp ${window._scoreCurrentClass}
                    </p>
                </div>`
            });
        } catch(err) {
            Swal.close();
            Swal.fire('Lỗi import', err.message, 'error');
        }
    };
    reader.readAsArrayBuffer(f);
};


// ══════════════════════════════════════════════════════════════════════════════
// exportStudentScoreWord — Xuất bảng điểm cá nhân dạng HTML → tải .doc
// Không dùng CDN nào — Word/LibreOffice mở file HTML trực tiếp
// ══════════════════════════════════════════════════════════════════════════════
window.exportStudentScoreWord = async function(studentId, sy) {
    const student = window.localData.students[studentId];
    if (!student) { Swal.fire('Lỗi','Không tìm thấy học sinh','error'); return; }

    Swal.fire({ title:'Đang tạo bảng điểm...', allowOutsideClick:false,
                didOpen:()=>Swal.showLoading() });

    const grade = gradeOf(student.classRoom || student.class || '');
    const subs  = getSubs(grade);
    const ds    = diemSubs(grade);
    const nxs   = nxSubs(grade);
    const pcs   = window.PHAM_CHAT        || [];
    const nlcs  = window.NANG_LUC_CHUNG  || [];
    const nlds  = window.NANG_LUC_DAC_THU|| [];

    const [hk1d, hk2d, ghk1d, ghk2d] = await Promise.all([
        loadHK(studentId, sy, 'hk1'),
        loadHK(studentId, sy, 'hk2'),
        loadGHK(studentId, sy, 'ghk1'),
        loadGHK(studentId, sy, 'ghk2'),
    ]);

    const xl = xepLoai(hk2d, grade);
    const ketQuaNam = hk2d.__kq || {};
    const danhGiaNam = ketQuaNam.danhGia || (xl.loai !== '—' ? xl.loai : '—');
    const khenThuongNam = ketQuaNam.khenThuong || khenThuongTheoDanhGia(danhGiaNam);

    // ── CSS nhúng cho Word ────────────────────────────────────────────────────
    const css = `
        /* ── Reset & base ───────────────────────────────────────────── */
        body {
            font-family: Arial, sans-serif;
            font-size: 11pt;
            margin: 0;
            padding: 1.5cm 2cm;
            color: #1e293b;
            line-height: 1.4;
        }
        /* ── Quốc hiệu ─────────────────────────────────────────────── */
        .quoc-hieu {
            text-align: center;
            font-size: 11pt;
            font-weight: bold;
            margin-bottom: 0;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .doc-lap {
            text-align: center;
            font-size: 11pt;
            margin-top: 2px;
            margin-bottom: 2px;
            font-weight: bold;
        }
        .doc-lap-underline {
            display: inline-block;
            border-bottom: 1px solid #1e293b;
            padding-bottom: 1px;
        }
        /* ── Tiêu đề chính ──────────────────────────────────────────── */
        .tieu-de {
            text-align: center;
            font-size: 16pt;
            font-weight: bold;
            color: #1e3a8a;
            margin: 14px 0 4px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .nam-hoc {
            text-align: center;
            font-size: 11pt;
            color: #2563eb;
            font-weight: bold;
            margin-bottom: 14px;
        }
        /* ── Thông tin học sinh (dùng table) ────────────────────────── */
        .info-table {
            width: 100%;
            border-collapse: collapse;
            margin: 8px 0 14px;
            border: 1px solid #cbd5e1;
            background: #f8fafc;
        }
        .info-table td {
            padding: 6px 12px;
            border: 1px solid #e2e8f0;
            font-size: 10.5pt;
            vertical-align: middle;
        }
        .info-label { color: #64748b; font-size: 9pt; display: block; }
        .info-val   { font-weight: bold; color: #1e3a8a; font-size: 11pt; }
        /* ── Bảng điểm ─────────────────────────────────────────────── */
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 4px 0 10px;
            font-size: 9.5pt;
        }
        th {
            padding: 6px 8px;
            text-align: center;
            border: 1px solid #64748b;
            font-size: 9pt;
        }
        td {
            padding: 5px 8px;
            border: 1px solid #94a3b8;
            vertical-align: middle;
        }
        /* ── Section title ──────────────────────────────────────────── */
        .section-title {
            background: #1e3a8a;
            color: #fff;
            font-weight: bold;
            font-size: 10pt;
            padding: 5px 10px;
            margin: 12px 0 3px;
        }
        .section-title.purple { background: #5b21b6; }
        .section-title.amber  { background: #92400e; }
        .section-title.navy   { background: #1e40af; }
        .section-title.hk2    { background: #065f46; }
        .section-title.gray   { background: #374151; }
        /* ── Table header colors ────────────────────────────────────── */
        .th-main   { background: #1e3a8a; color: #fff; }
        .th-green  { background: #065f46; color: #fff; }
        .th-purple { background: #5b21b6; color: #fff; }
        .th-amber  { background: #92400e; color: #fff; }
        .th-navy   { background: #1e40af; color: #fff; }
        /* ── Table data ─────────────────────────────────────────────── */
        .td-mon   { font-weight: 600; background: #f8fafc; text-align: left; }
        .td-num   { text-align: center; font-weight: bold; color: #1d4ed8; }
        .td-slash { text-align: center; background: #f1f5f9; color: #9ca3af; font-size: 9pt; }
        .td-muc   { text-align: center; }
        .tr-even  { background: #f8fafc; }
        .tr-odd   { background: #ffffff; }
        .muc-tot  { color: #166534; font-weight: bold; }
        .muc-dat  { color: #1d4ed8; font-weight: bold; }
        .muc-ccg  { color: #dc2626; font-weight: bold; }
        /* ── Chữ ký — DÙNG TABLE để Word hiểu layout 2 cột ─────────── */
        .sign-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 36px;
        }
        .sign-table td {
            border: none;
            text-align: center;
            padding: 0 10px;
            vertical-align: top;
            width: 50%;
        }
        .sign-title { font-weight: bold; font-size: 11pt; margin-bottom: 2px; }
        .sign-sub   { font-size: 9pt; color: #475569; margin: 2px 0; }
        .sign-date  { font-size: 10pt; margin-bottom: 4px; color: #374151; }
        .sign-space { height: 55px; }
        /* ── Print ──────────────────────────────────────────────────── */
        @page {
            size: A4 portrait;
            margin: 2cm 2cm 2cm 2.5cm;
        }
        @media print {
            body { padding: 0; margin: 0; font-size: 10pt; }
            .section-title { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            th, .td-mon { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            table { page-break-inside: avoid; }
        }
    `;

    // ── Helper: badge mức đạt được ────────────────────────────────────────────
    const mucBadge = v => {
        if (!v) return '<span style="color:#94a3b8">—</span>';
        const cls2 = v==='T'?'muc-tot':v==='H'?'muc-dat':v==='Đ'?'muc-dat':v==='C'?'muc-ccg':'';
        return `<span class="${cls2}">${v}</span>`;
    };

    // Khối 3-5: GHK chỉ 3 môn Tiếng Việt, Toán, Ngoại ngữ 1/Tiếng Anh có điểm
    const hasGHKScore = ghkDiemSubs(grade).length > 0;

    // ── Helper: bảng điểm 1 kỳ ───────────────────────────────────────────────
    const buildTable = (kData, thClass, thSubClass, isGHK) => {
        // GHK khối 3-5 có cột điểm, nhưng chỉ 3 môn hợp lệ hiển thị số
        const ghkHasScore = isGHK && hasGHKScore;
        const cols = isGHK
            ? (ghkHasScore
                ? `<col width="28%"><col width="18%"><col width="12%"><col width="42%">`
                : `<col width="30%"><col width="20%"><col width="50%">`)
            : `<col width="28%"><col width="18%"><col width="12%"><col width="42%">`;
        const hdr = isGHK
            ? (ghkHasScore
                ? `<th class="${thClass}" style="text-align:left">Môn học và hoạt động GD</th>
                   <th class="${thClass}">Mức đạt được</th>
                   <th class="${thClass}">Điểm KTĐK</th>
                   <th class="${thClass}" style="text-align:left">Nhận xét</th>`
                : `<th class="${thClass}" style="text-align:left">Môn học và hoạt động GD</th>
                   <th class="${thClass}">Mức đạt được</th>
                   <th class="${thClass}" style="text-align:left">Nhận xét</th>`)
            : `<th class="${thClass}" style="text-align:left">Môn học và hoạt động GD</th>
               <th class="${thClass}">Mức đạt được</th>
               <th class="${thClass}">Điểm KTĐK</th>
               <th class="${thClass}" style="text-align:left">Nhận xét</th>`;

        const rows = subs.map((sub, i) => {
            const sd = kData[sub.name] || {};
            const bg = i%2===0 ? 'tr-even' : 'tr-odd';
            const isDiem = isGHK ? ghkHasNumericScore(grade, sub.name) : sub.type === 'diem';
            let diemTd = '';
            if (!isGHK || ghkHasScore) {
                diemTd = isDiem
                    ? `<td class="td-num">${parseFloat(sd.diem)>0 ? sd.diem : '—'}</td>`
                    : `<td class="td-slash">///</td>`;
            }
            return `<tr class="${bg}">
                <td class="td-mon">${sub.name}</td>
                <td class="td-muc">${mucBadge(sd.mucDat)}</td>
                ${diemTd}
                <td>${sd.nhanXet||''}</td>
            </tr>`;
        }).join('');
        return `<table><colgroup>${cols}</colgroup><thead><tr>${hdr}</tr></thead><tbody>${rows}</tbody></table>`;
    };

    // ── Helper: bảng phẩm chất / năng lực ────────────────────────────────────
    const buildTraitTable = (items, data, thClass) => {
        const rows = items.map((name,i) => {
            const d  = data[name] || {};
            const bg = i%2===0 ? 'tr-even' : 'tr-odd';
            return `<tr class="${bg}">
                <td class="td-mon">${name}</td>
                <td class="td-muc">${mucBadge(d.mucDat)}</td>
                <td>${d.nhanXet||''}</td>
            </tr>`;
        }).join('');
        return `<table>
            <colgroup><col width="30%"><col width="20%"><col width="50%"></colgroup>
            <thead><tr>
                <th class="${thClass}" style="text-align:left">Phẩm chất / Năng lực</th>
                <th class="${thClass}">Mức đạt được</th>
                <th class="${thClass}" style="text-align:left">Nhận xét</th>
            </tr></thead>
            <tbody>${rows}</tbody>
        </table>`;
    };

    // ── Màu kết quả giáo dục ─────────────────────────────────────────────────
    const xlColor = xl.color?.replace('#','') || '1e293b';

    // ── Build HTML ────────────────────────────────────────────────────────────
    const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>${css}</style>
</head><body>

<!-- ── QUỐC HIỆU TIÊU NGỮ ───────────────────────────────────────────────── -->
<p class="quoc-hieu">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
<p class="doc-lap"><span class="doc-lap-underline">Độc lập – Tự do – Hạnh phúc</span></p>

<!-- ── TIÊU ĐỀ ───────────────────────────────────────────────────────────── -->
<p class="tieu-de">BẢNG KẾT QUẢ HỌC TẬP</p>
<p class="nam-hoc">Năm học: ${sy}</p>

<!-- ── THÔNG TIN HỌC SINH (table 2 hàng x 4 cột) ────────────────────────── -->
<table class="info-table">
    <tr>
        <td style="width:30%">
            <span class="info-label">Họ và tên học sinh</span>
            <span class="info-val">${student.name}</span>
        </td>
        <td style="width:15%">
            <span class="info-label">Lớp</span>
            <span class="info-val">${student.classRoom||student.class||''}</span>
        </td>
        <td style="width:20%">
            <span class="info-label">Mã học sinh</span>
            <span class="info-val">${student.code||student.id}</span>
        </td>
        <td style="width:15%">
            <span class="info-label">Khối</span>
            <span class="info-val">Khối ${grade}</span>
        </td>
        <td style="width:20%">
            <span class="info-label">Giới tính</span>
            <span class="info-val">${student.gender||'—'}</span>
        </td>
    </tr>
    <tr>
        <td colspan="2">
            <span class="info-label">Ngày sinh</span>
            <span class="info-val">${student.dob ? new Date(student.dob).toLocaleDateString('vi-VN') : '—'}</span>
        </td>
        <td colspan="3">
            <span class="info-label">Nơi sinh</span>
            <span class="info-val">${student.birthPlace||'—'}</span>
        </td>
    </tr>
</table>

<!-- ── KẾT QUẢ TỔNG HỢP ──────────────────────────────────────────────── -->
<div class="section-title">📊 KẾT QUẢ TỔNG HỢP</div>
<table>
    <colgroup><col width="34%"><col width="33%"><col width="33%"></colgroup>
    <thead><tr>
        <th class="th-main">Đánh giá kết quả giáo dục</th>
        <th class="th-main">Hoàn thành chương trình</th>
        <th class="th-main">Khen thưởng</th>
    </tr></thead>
    <tbody><tr>
        <td style="text-align:center;font-weight:bold;color:#${xlColor}">${danhGiaNam}</td>
        <td style="text-align:center">${ketQuaNam.hoanThanh||'—'}</td>
        <td style="text-align:center">${khenThuongNam||'—'}</td>
    </tr></tbody>
</table>

<!-- ══════════════════ HỌC KỲ 1 ══════════════════ -->
<div class="section-title purple">📘 GIỮA HỌC KỲ 1</div>
${buildTable(ghk1d,'th-purple','th-sub-p',true)}
<div class="section-title amber">💎 PHẨM CHẤT — GIỮA HK1</div>
${buildTraitTable(pcs, ghk1d.__pc||{}, 'th-amber')}
<div class="section-title navy">⚡ NĂNG LỰC CHUNG — GIỮA HK1</div>
${buildTraitTable(nlcs, ghk1d.__nlc||{}, 'th-navy')}
<div class="section-title navy">🎯 NĂNG LỰC ĐẶC THÙ — GIỮA HK1</div>
${buildTraitTable(nlds, ghk1d.__nld||{}, 'th-navy')}

<div class="section-title">📗 CUỐI HỌC KỲ 1</div>
${buildTable(hk1d,'th-main','th-sub',false)}

<div class="section-title amber">💎 PHẨM CHẤT — HK1</div>
${buildTraitTable(pcs, hk1d.__pc||{}, 'th-amber')}

<div class="section-title navy">⚡ NĂNG LỰC CHUNG — HK1</div>
${buildTraitTable(nlcs, hk1d.__nlc||{}, 'th-navy')}

<div class="section-title navy">🎯 NĂNG LỰC ĐẶC THÙ — HK1</div>
${buildTraitTable(nlds, hk1d.__nld||{}, 'th-navy')}

<!-- ══════════════════ HỌC KỲ 2 ══════════════════ -->
<div class="section-title purple" style="margin-top:20px">📙 GIỮA HỌC KỲ 2</div>
${buildTable(ghk2d,'th-purple','th-sub-p',true)}
<div class="section-title amber">💎 PHẨM CHẤT — GIỮA HK2</div>
${buildTraitTable(pcs, ghk2d.__pc||{}, 'th-amber')}
<div class="section-title navy">⚡ NĂNG LỰC CHUNG — GIỮA HK2</div>
${buildTraitTable(nlcs, ghk2d.__nlc||{}, 'th-navy')}
<div class="section-title navy">🎯 NĂNG LỰC ĐẶC THÙ — GIỮA HK2</div>
${buildTraitTable(nlds, ghk2d.__nld||{}, 'th-navy')}

<div class="section-title hk2">⭐ CUỐI HỌC KỲ 2 — DỮ LIỆU TỔNG HỢP KẾT QUẢ CUỐI NĂM</div>
${buildTable(hk2d,'th-green','th-sub-g',false)}

<div class="section-title amber">💎 PHẨM CHẤT — HK2</div>
${buildTraitTable(pcs, hk2d.__pc||{}, 'th-amber')}

<div class="section-title navy">⚡ NĂNG LỰC CHUNG — HK2</div>
${buildTraitTable(nlcs, hk2d.__nlc||{}, 'th-navy')}

<div class="section-title navy">🎯 NĂNG LỰC ĐẶC THÙ — HK2</div>
${buildTraitTable(nlds, hk2d.__nld||{}, 'th-navy')}

<!-- ── THỂ CHẤT ──────────────────────────────────────────────────────── -->
<div class="section-title" style="background:#374151">🏃 THỂ CHẤT & CHUYÊN CẦN</div>
<table>
    <colgroup><col width="30%"><col width="20%"><col width="20%"><col width="30%"></colgroup>
    <thead><tr>
        <th style="background:#374151;color:#fff;text-align:left">Chỉ số</th>
        <th style="background:#374151;color:#fff">Học kỳ 1</th>
        <th style="background:#374151;color:#fff">Học kỳ 2</th>
        <th style="background:#374151;color:#fff">Ghi chú</th>
    </tr></thead>
    <tbody>
        <tr class="tr-even"><td class="td-mon">Chiều cao (cm)</td>
            <td class="td-num">${hk1d.__body?.chieuCao||'—'}</td>
            <td class="td-num">${hk2d.__body?.chieuCao||'—'}</td><td></td></tr>
        <tr class="tr-odd"><td class="td-mon">Cân nặng (kg)</td>
            <td class="td-num">${hk1d.__body?.canNang||'—'}</td>
            <td class="td-num">${hk2d.__body?.canNang||'—'}</td><td></td></tr>
        <tr class="tr-even"><td class="td-mon">Nghỉ có phép</td>
            <td class="td-num">${hk1d.__body?.nghiCoPhep||0}</td>
            <td class="td-num">${hk2d.__body?.nghiCoPhep||0}</td><td>buổi</td></tr>
        <tr class="tr-odd"><td class="td-mon">Nghỉ không phép</td>
            <td class="td-num">${hk1d.__body?.nghiKhongPhep||0}</td>
            <td class="td-num">${hk2d.__body?.nghiKhongPhep||0}</td><td>buổi</td></tr>
    </tbody>
</table>

${khenThuongNam ? `<p style="margin-top:10px"><b>🏆 Khen thưởng:</b> <span style="color:#7c3aed;font-weight:bold">${khenThuongNam}</span></p>` : ''}
${hk2d.__kq?.hoanThanh  ? `<p><b>📋 Hoàn thành chương trình:</b> ${hk2d.__kq.hoanThanh}</p>` : ''}

<!-- ── CHỮ KÝ (table 2 cột — Word hiểu đúng) ────────────────────────────── -->
<table class="sign-table">
    <tr>
        <td style="width:50%;text-align:center;border:none;padding:0 10px">
            <p class="sign-title">Giáo viên chủ nhiệm</p>
            <p class="sign-sub">(Ký và ghi rõ họ tên)</p>
            <div class="sign-space"></div>
            <p style="font-size:10pt;margin:0">&nbsp;</p>
        </td>
        <td style="width:50%;text-align:center;border:none;padding:0 10px">
            <p class="sign-date">..., ngày &nbsp;&nbsp;&nbsp;&nbsp; tháng &nbsp;&nbsp;&nbsp;&nbsp; năm ${sy.split('-')[1]||''}</p>
            <p class="sign-title">Hiệu trưởng</p>
            <p class="sign-sub">(Ký, đóng dấu và ghi rõ họ tên)</p>
            <div class="sign-space"></div>
            <p style="font-size:10pt;margin:0">&nbsp;</p>
        </td>
    </tr>
</table>

</body></html>`;

    // ── Download dạng .doc (Word mở HTML trực tiếp) ───────────────────────────
    try {
        // Dùng Blob với MIME type Word — Word/LibreOffice nhận file HTML này
        const blob = new Blob(['\ufeff' + html], {
            type: 'application/msword;charset=utf-8'
        });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `BangDiem_${(student.name||'').replace(/\s+/g,'_')}_${sy.replace('-','_')}.doc`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 3000);

        Swal.fire({
            icon:'success', title:'✅ Xuất bảng điểm thành công!',
            html:`<div style="text-align:left;font-size:0.9rem">
                <p>👤 <b>${student.name}</b> — Lớp ${student.classRoom||student.class} — Khối ${grade}</p>
                <p>📅 Năm học: <b>${sy}</b></p>
                <div style="margin-top:10px;background:#f0fdf4;padding:10px 12px;border-radius:8px;font-size:0.85rem">
                    <p>✅ Giữa HK1 + Cuối HK1 · Giữa HK2 + Cuối HK2</p>
                    <p>✅ Phẩm chất + Năng lực chung + Năng lực đặc thù</p>
                    <p>✅ Thể chất + Chuyên cần + Chữ ký</p>
                </div>
                <p style="margin-top:8px;color:#64748b;font-size:0.8rem">
                    💡 Mở file .doc bằng Microsoft Word hoặc LibreOffice
                </p>
            </div>`,
            timer:5000, showConfirmButton:false,
        });
    } catch(err) {
        Swal.fire('Lỗi','Không thể tạo file: '+err.message,'error');
    }
};


// ── Backward compat ───────────────────────────────────────────────────────────
// ── Xuất báo cáo Excel tổng hợp ──────────────────────────────────────────────
export async function exportScoreExcel() {
    const cls = window._scoreCurrentClass, sy = syNow();
    const students = activeStudentValues()
        .filter(s => (s.classRoom||s.class||'') === cls);
    const grade = gradeOf(cls);
    const ds    = diemSubs(grade);

    Swal.fire({ title:'Đang xuất...', allowOutsideClick:false, didOpen:()=>Swal.showLoading() });

    const rows = await Promise.all(students.map(async (s,i) => {
        const hk1 = await loadHK(s.id, sy, 'hk1');
        const hk2 = await loadHK(s.id, sy, 'hk2');
        const xl  = xepLoai(hk2, grade);
        const row = { 'STT':i+1, 'Mã HS':s.code||s.id, 'Họ tên':s.name, 'Lớp':cls };
        ds.forEach(sub => {
            row[`HK1 - ${sub.name} - Điểm`] = hk1[sub.name]?.diem   || '';
            row[`HK1 - ${sub.name} - Mức`]  = hk1[sub.name]?.mucDat || '';
            row[`HK2 - ${sub.name} - Điểm`] = hk2[sub.name]?.diem   || '';
            row[`HK2 - ${sub.name} - Mức`]  = hk2[sub.name]?.mucDat || '';
        });
        nxSubs(grade).forEach(sub => {
            row[`HK1 - ${sub.name}`] = hk1[sub.name]?.mucDat || '';
            row[`HK2 - ${sub.name}`] = hk2[sub.name]?.mucDat || '';
        });
        row['Đánh giá KQ GD'] = hk2.__kq?.danhGia || (xl.loai !== '—' ? xl.loai : '');
        row['Khen thưởng']    = hk2.__kq?.khenThuong || khenThuongTheoDanhGia(row['Đánh giá KQ GD']);
        return row;
    }));

    const safe = `Diem_${cls}`.replace(/[\/\\\?*\[\]:]/g,'_').substring(0,31);
    const wb   = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), safe);
    XLSX.writeFile(wb, `BaoCaoDiem_${cls.replace('/','_')}_${sy.replace('-','_')}.xlsx`);
    Swal.fire({ icon:'success', title:'Xuất thành công!', timer:2000, showConfirmButton:false });
}

// ── Backward compat ───────────────────────────────────────────────────────────
export function loadScoreForm() {}
export async function saveScores() {}


// ══════════════════════════════════════════════════════════════════════════════
// V5.5 — Vá import Excel an toàn + file mẫu gọn: nhập bên trái, nhận xét bên phải
// - Import chỉ nhận học sinh đúng lớp đang chọn.
// - Chuẩn hóa Mã HS khi import.
// - File mẫu cuối HK có đủ Phẩm chất + Năng lực chung + Năng lực đặc thù.
// - Ô trống không ghi đè dữ liệu cũ.
// ══════════════════════════════════════════════════════════════════════════════
console.info('[Smart School V5.26.3] scores excel import NLD column collision fix loaded');

function _v55NormCode(value) {
    let text = String(value ?? '').trim();
    if (/^\d+(\.0+)?$/.test(text)) text = String(parseInt(text, 10));
    return text.toUpperCase().replace(/\s+/g, '');
}
function _v55ClassOf(student) { return String(student?.classRoom || student?.class || '').trim(); }
function _v55SameClass(student, cls) { return _v55ClassOf(student) === String(cls || '').trim(); }
function _v55IsBlank(value) { return String(value ?? '').trim() === ''; }
function _v55Clean(value) { return String(value ?? '').trim(); }
function _v55Upper(value) { return _v55Clean(value).toUpperCase(); }
function _v55EscapeFormulaText(value) { return String(value ?? '').replace(/"/g, '""'); }
function _v55ValidateSubjectLevel(value, label) {
    const raw = _v55Clean(value);
    if (!raw) return '';
    const v = raw.toUpperCase();
    if (v === 'T' || v === 'TỐT' || v === 'TOT') return 'T';
    if (v === 'H' || v === 'HOÀN THÀNH' || v === 'HOAN THANH') return 'H';
    if (v === 'C' || v === 'CHƯA HOÀN THÀNH' || v === 'CHUA HOAN THANH' || v === 'CẦN CỐ GẮNG' || v === 'CAN CO GANG') return 'C';
    // Phòng ngừa trường hợp file cũ bị AutoComplete tên môn khi gõ T
    if (/^TIẾNG\s*VIỆT/i.test(raw) || /^TOÁN/i.test(raw) || /^TIN\s*HỌC/i.test(raw)) return 'T';
    if (!['T','H','C'].includes(v)) throw new Error(`${label}: Mức môn học chỉ được nhập T, H hoặc C (hoặc Tốt, Hoàn thành, Cần cố gắng).`);
    return v;
}

function _v55SubjectLevelFromScoreOrCell(mucText, diemRaw, existing, label) {
    const cleaned = _v55Clean(mucText);
    if (!cleaned) {
        return diemRaw !== null ? _v55ScoreToLevel(diemRaw) : (existing?.mucDat || '');
    }

    const v = _v55Upper(cleaned);
    if (['T','H','C'].includes(v)) return v;
    if (v === 'TỐT' || v === 'TOT') return 'T';
    if (v === 'HOÀN THÀNH' || v === 'HOAN THANH') return 'H';
    if (v === 'CHƯA HOÀN THÀNH' || v === 'CHUA HOAN THANH' || v === 'CẦN CỐ GẮNG' || v === 'CAN CO GANG') return 'C';
    if (/^TIẾNG\s*VIỆT/i.test(cleaned) || /^TOÁN/i.test(cleaned) || /^TIN\s*HỌC/i.test(cleaned)) return 'T';

    // V5.26.2:
    // Một số file Excel nhìn bằng mắt là T/H/C nhưng khi trình duyệt đọc bằng SheetJS
    // lại nhận cột "Mức đạt được" là công thức Excel hoặc giá trị số lạ.
    // Nếu ô Điểm KTĐK của môn có điểm đã hợp lệ, không báo lỗi ở cột Mức nữa,
    // mà tự quy đổi: >=9 T, >=5 H, dưới 5 C.
    // Như vậy các mẫu nhập đúng bằng điểm sẽ import ổn định hơn.
    if (diemRaw !== null) return _v55ScoreToLevel(diemRaw);

    return _v55ValidateSubjectLevel(cleaned, label);
}
function _v55ValidateTraitLevel(value, label) {
    const raw = _v55Clean(value);
    if (!raw) return '';
    const v = raw.toUpperCase();
    if (v === 'T' || v === 'TỐT' || v === 'TOT') return 'T';
    if (v === 'Đ' || v === 'D' || v === 'ĐẠT' || v === 'DAT') return 'Đ';
    if (v === 'C' || v === 'CẦN CỐ GẮNG' || v === 'CAN CO GANG' || v === 'CHƯA ĐẠT' || v === 'CHUA DAT') return 'C';
    if (/^TRUNG\s*THỰC/i.test(raw) || /^TỰ\s*CHỦ/i.test(raw) || /^TIN\s*HỌC/i.test(raw) || /^THỂ\s*CHẤT/i.test(raw) || /^THẨM\s*MĨ/i.test(raw)) return 'T';
    if (!['T','Đ','D','C'].includes(v)) throw new Error(`${label}: Mức phẩm chất/năng lực chỉ được nhập T, Đ hoặc C (hoặc Tốt, Đạt, Cần cố gắng).`);
    return v === 'D' ? 'Đ' : v;
}
function _v55ScoreToLevel(score) {
    const n = Number(score);
    if (!Number.isFinite(n)) return '';
    return n >= 9 ? 'T' : n >= 5 ? 'H' : 'C';
}
function _v55ParseScore(value, label) {
    if (_v55IsBlank(value)) return null;
    const n = Number(String(value).replace(',', '.'));
    if (!Number.isFinite(n) || n < 0 || n > 10) throw new Error(`${label} phải từ 0 đến 10.`);
    return Math.round(n * 100) / 100;
}
function _v55Comment(grade, name, kind, level, score) {
    const list = getCommentSuggestions({ grade, name, kind, level, score });
    if (list && list.length) return list[0];
    if (kind === 'quality' || kind === 'commonCompetency' || kind === 'specificCompetency') {
        if (level === 'T') return 'Có biểu hiện tốt, tích cực và cần tiếp tục phát huy.';
        if (level === 'Đ') return 'Đạt yêu cầu, cần duy trì và rèn luyện thường xuyên hơn.';
        return 'Cần cố gắng rèn luyện thêm; giáo viên và gia đình tiếp tục phối hợp hỗ trợ.';
    }
    if (score !== null && score !== undefined && score !== '') {
        const n = Number(score);
        if (n >= 9) return 'Hoàn thành tốt yêu cầu môn học; nắm chắc kiến thức và kỹ năng.';
        if (n >= 7) return 'Hoàn thành yêu cầu môn học; cần tiếp tục phát huy và cẩn thận hơn.';
        if (n >= 5) return 'Hoàn thành ở mức cơ bản; cần rèn luyện thêm để kết quả ổn định hơn.';
        return 'Chưa hoàn thành yêu cầu; cần được hỗ trợ, ôn tập và luyện tập thường xuyên.';
    }
    if (level === 'T') return 'Hoàn thành tốt yêu cầu môn học; tích cực trong học tập.';
    if (level === 'H') return 'Hoàn thành yêu cầu môn học; cần tiếp tục rèn luyện thêm.';
    return 'Cần cố gắng hơn; giáo viên và gia đình tiếp tục phối hợp hỗ trợ.';
}
function _v55BuildStudentLookups(cls) {
    const inClass = new Map();
    const all = new Map();
    Object.entries(window.localData?.students || {}).forEach(([key, student]) => {
        if (!isActiveStudent(student)) return;
        const aliases = [key, student?.id, student?.code].filter(Boolean);
        aliases.forEach(alias => {
            const norm = _v55NormCode(alias);
            if (!norm) return;
            all.set(norm, { key, student });
            if (_v55SameClass(student, cls)) inClass.set(norm, { key, student });
        });
    });
    return { inClass, all };
}
function _v55HeaderMap(allRows, dataStart = 5) {
    const itemRow = allRows[3] || [];
    const typeRow = allRows[4] || [];
    const colMap = {};
    let curItem = '';
    let curPrefix = '';

    for (let c = 3; c < Math.max(itemRow.length, typeRow.length); c++) {
        const raw = _v55Clean(itemRow[c]);
        if (raw) {
            // Nhận diện tiền tố nhóm: [PC], [NLC], [NLĐ], PC:, NLC:, NLĐ: hoặc [Môn], Môn:
            const matchTrait = raw.match(/^\[?(PC|NLC|NLD|NLĐ)\]?\s*[:\-]?\s*/i);
            if (matchTrait) {
                curPrefix = matchTrait[1].toUpperCase().replace('NLD', 'NLĐ');
                curItem = raw.replace(/^\[?(PC|NLC|NLD|NLĐ)\]?\s*[:\-]?\s*/i, '').trim();
            } else {
                curPrefix = '';
                curItem = raw.replace(/^\[?(Môn|Mon)\]?\s*[:\-]?\s*/i, '').trim();
            }
        }

        const type = _v55Clean(typeRow[c]);
        if (!curItem || !type) continue;

        // Chuẩn hóa loại cột: "Mức (T/H/C)" hoặc "Mức (T/Đ/C)" -> "Mức đạt được"
        let normType = type;
        if (/^Mức/i.test(type)) {
            normType = 'Mức đạt được';
        } else if (/^Điểm/i.test(type)) {
            normType = 'Điểm KTĐK';
        } else if (/^Nhận\s*xét/i.test(type)) {
            normType = 'Nhận xét';
        }

        if (curPrefix) {
            colMap[`${curPrefix}:${curItem}||${normType}`] = c;
            colMap[`${curPrefix}:${curItem}||${type}`] = c;
        } else {
            colMap[`${curItem}||${normType}`] = c;
            colMap[`${curItem}||${type}`] = c;
        }
    }
    return { colMap, dataStart };
}
function _v55Cell(row, colMap, name, type) {
    const idx = colMap[`${name}||${type}`];
    return idx === undefined ? '' : _v55Clean(row[idx]);
}
function _v55TraitCell(row, colMap, prefix, name, type) {
    const normalizedPrefix = String(prefix || '').toUpperCase().replace('NLD', 'NLĐ');
    const idx = colMap[`${normalizedPrefix}:${name}||${type}`];

    // Ưu tiên cột có tiền tố PC/NLC/NLĐ để không nhầm với cột môn học cùng tên.
    if (idx !== undefined) return _v55Clean(row[idx]);

    // Fallback cho file mẫu quá cũ không có tiền tố.
    return _v55Cell(row, colMap, name, type);
}
function _v55RowHasAnyInput(row, colMap, names) {
    return names.some(name => ['Điểm KTĐK','Mức đạt được','Nhận xét'].some(type => {
        const idx = colMap[`${name}||${type}`];
        return idx !== undefined && !_v55IsBlank(row[idx]);
    }));
}
function _v55ColLetter(c) {
    let s = ''; c += 1;
    while (c > 0) { s = String.fromCharCode(((c - 1) % 26) + 65) + s; c = Math.floor((c - 1) / 26); }
    return s;
}
function _v55Set(ws, r, c, v) {
    const addr = XLSX.utils.encode_cell({ r, c });
    ws[addr] = (v === '' || v === null || v === undefined) ? { v:'', t:'s' }
        : typeof v === 'number' ? { v, t:'n' } : { v:String(v), t:'s' };
}
function _v55FormulaComment(levelRef, scoreRef, high, good, pass, fail) {
    high = _v55EscapeFormulaText(high); good = _v55EscapeFormulaText(good); pass = _v55EscapeFormulaText(pass); fail = _v55EscapeFormulaText(fail);
    const isT = `OR(TRIM(UPPER(${levelRef}))="T",TRIM(${levelRef})="Tốt")`;
    const isGood = `OR(TRIM(UPPER(${levelRef}))="H",TRIM(${levelRef})="Hoàn thành",TRIM(UPPER(${levelRef}))="Đ",TRIM(${levelRef})="Đạt")`;
    const isC = `OR(TRIM(UPPER(${levelRef}))="C",TRIM(${levelRef})="Chưa hoàn thành",TRIM(${levelRef})="Cần cố gắng")`;
    const byLevel = `IF(${levelRef}="","",IF(${isT},"${high}",IF(${isGood},"${good}",IF(${isC},"${fail}",""))))`;
    if (scoreRef) {
        return `IF(${scoreRef}<>"",IF(${scoreRef}>=9,"${high}",IF(${scoreRef}>=7,"${good}",IF(${scoreRef}>=5,"${pass}","${fail}"))),${byLevel})`;
    }
    return byLevel;
}

function _v56DefKey(def) {
    return `${def?.kind || 'subject'}|${def?.prefix || ''}|${def?.name || ''}`;
}
function _v56BucketConfig(kind, bucket) {
    const traitLevel = kind === 'subject' ? 'H' : 'Đ';
    if (bucket === 'high') return { level:'T', score:10, label:'Tốt / 9-10' };
    if (bucket === 'good') return { level:traitLevel, score:8, label:'Hoàn thành khá / 7-8' };
    if (bucket === 'pass') return { level:traitLevel, score:6, label:'Hoàn thành cơ bản / 5-6' };
    return { level:'C', score:4, label:'Chưa hoàn thành / dưới 5' };
}
function _v56SuggestionList(grade, def, bucket) {
    const cfg = _v56BucketConfig(def.kind, bucket);
    const direct = getCommentSuggestions({ grade, name:def.name, kind:def.kind, level:cfg.level, score:cfg.score }) || [];
    const unique = [...new Set(direct.map(v => String(v || '').trim()).filter(Boolean))];
    if (unique.length) return unique;
    return [_v55Comment(grade, def.name, def.kind, cfg.level, cfg.score)];
}
function _v56BuildCommentBankSheet(grade, defs) {
    const sheetName = 'NganHangNhanXet';
    const rows = [
        [`NGÂN HÀNG NHẬN XÉT — KHỐI ${grade}`,'','','','',''],
        ['Các câu được lấy từ bộ nhận xét người dùng cung cấp; file dữ liệu tự luân phiên câu theo từng học sinh.','','','','',''],
        ['Không đổi tên sheet hoặc xóa các dòng nhận xét vì công thức ở sheet nhập dữ liệu đang tham chiếu tới đây.','','','','',''],
        ['Mã nhóm','Loại','Nội dung','Mức / khoảng điểm','STT','Nhận xét'],
    ];
    const ranges = new Map();
    const seen = new Set();
    defs.forEach(def => {
        const defKey = _v56DefKey(def);
        if (seen.has(defKey)) return;
        seen.add(defKey);
        ['high','good','pass','fail'].forEach(bucket => {
            const cfg = _v56BucketConfig(def.kind, bucket);
            const list = _v56SuggestionList(grade, def, bucket);
            const first = rows.length + 1;
            list.forEach((text, index) => rows.push([
                `${defKey}|${bucket}`,
                def.kind === 'subject' ? 'Môn học' : def.kind === 'quality' ? 'Phẩm chất' : def.kind === 'commonCompetency' ? 'Năng lực chung' : 'Năng lực đặc thù',
                `${def.prefix ? `${def.prefix}: ` : ''}${def.name}`,
                cfg.label,
                index + 1,
                text,
            ]));
            const last = rows.length;
            ranges.set(`${defKey}|${bucket}`, { first, last, count:list.length });
        });
    });
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{wch:45},{wch:18},{wch:30},{wch:26},{wch:7},{wch:110}];
    ws['!rows'] = [{hpt:26},{hpt:22},{hpt:22},{hpt:24}];
    ws['!merges'] = [
        {s:{r:0,c:0},e:{r:0,c:5}},
        {s:{r:1,c:0},e:{r:1,c:5}},
        {s:{r:2,c:0},e:{r:2,c:5}},
    ];
    ws['!autofilter'] = { ref:`A4:F${Math.max(4, rows.length)}` };
    ws['!freeze'] = { xSplit:0, ySplit:4, topLeftCell:'A5' };
    return { ws, sheetName, ranges, total:rows.length - 4 };
}
function _v56PickFromRange(range, seed = 0, sheetName = 'NganHangNhanXet') {
    if (!range || !range.count) return '""';
    const ref = `'${sheetName}'!$F$${range.first}:$F$${range.last}`;
    return `INDEX(${ref},MOD(ROW()+${Math.abs(Number(seed) || 0)},${range.count})+1)`;
}
function _v56CommentFormula(levelRef, scoreRef, bank, def, seed = 0) {
    const key = _v56DefKey(def);
    const high = _v56PickFromRange(bank.ranges.get(`${key}|high`), seed + 1, bank.sheetName);
    const good = _v56PickFromRange(bank.ranges.get(`${key}|good`), seed + 3, bank.sheetName);
    const pass = _v56PickFromRange(bank.ranges.get(`${key}|pass`), seed + 5, bank.sheetName);
    const fail = _v56PickFromRange(bank.ranges.get(`${key}|fail`), seed + 7, bank.sheetName);
    const isT = `OR(TRIM(UPPER(${levelRef}))="T",TRIM(${levelRef})="Tốt")`;
    const isGood = `OR(TRIM(UPPER(${levelRef}))="H",TRIM(${levelRef})="Hoàn thành",TRIM(UPPER(${levelRef}))="Đ",TRIM(${levelRef})="Đạt")`;
    const isC = `OR(TRIM(UPPER(${levelRef}))="C",TRIM(${levelRef})="Chưa hoàn thành",TRIM(${levelRef})="Cần cố gắng")`;
    const byLevel = `IF(${levelRef}="","",IF(${isT},${high},IF(${isGood},${good},IF(${isC},${fail},""))))`;
    if (scoreRef) {
        return `IF(${scoreRef}<>"",IF(${scoreRef}>=9,${high},IF(${scoreRef}>=7,${good},IF(${scoreRef}>=5,${pass},${fail}))),${byLevel})`;
    }
    return byLevel;
}
function _v56EnableWorkbookCalculation(wb) {
    wb.Workbook = wb.Workbook || {};
    wb.Workbook.CalcPr = { calcMode:'auto', fullCalcOnLoad:'1', forceFullCalc:'1' };
}

function _v55TraitDefs() {
    return [
        ...(window.PHAM_CHAT || []).map(name => ({ name, kind:'quality', prefix:'PC' })),
        ...(window.NANG_LUC_CHUNG || []).map(name => ({ name, kind:'commonCompetency', prefix:'NLC' })),
        ...(window.NANG_LUC_DAC_THU || []).map(name => ({ name, kind:'specificCompetency', prefix:'NLĐ' })),
    ];
}

function _v56TriggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function _v56DownloadStyledTemplate(prefix, grade, cls, sy, students, filename) {
    try {
        const templateUrl = `templates/FileMau_Diem_${prefix}_Khoi${grade}.xlsx?v=5.36.2`;
        const resp = await fetch(templateUrl);
        if (!resp.ok) return false;
        const arrayBuf = await resp.arrayBuffer();

        if (window.JSZip) {
            const zip = await window.JSZip.loadAsync(arrayBuf);
            const sheet1File = zip.file('xl/worksheets/sheet1.xml');
            if (sheet1File) {
                let xml = await sheet1File.async('string');

                // Cập nhật tên lớp trong Header hàng 1 và hàng 2
                xml = xml.replace(new RegExp(`LỚP:\\s*${grade}A`, 'g'), `LỚP: ${cls}`);
                xml = xml.replace(new RegExp(`LỚP\\s*${grade}A`, 'g'), `LỚP ${cls}`);

                // Điền danh sách học sinh thực tế của lớp (bắt đầu từ hàng 6)
                if (students && students.length > 0) {
                    students.forEach((s, idx) => {
                        const rowNum = 6 + idx;
                        const code = s.code || s.id || `HS${String(idx+1).padStart(3, '0')}`;
                        const name = (s.name || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

                        const rowRegex = new RegExp(`(<row[^>]*r="${rowNum}"[^>]*>[\\s\\S]*?<\\/row>)`);
                        const rowMatch = xml.match(rowRegex);
                        if (rowMatch) {
                            let rXml = rowMatch[1];
                            const patternB = new RegExp(`(<c[^>]*r="B${rowNum}"[^>]*>)(?:<is><t>[^<]*</t></is>)?(</c>)`);
                            if (patternB.test(rXml)) {
                                rXml = rXml.replace(patternB, `$1<is><t>${code}</t></is>$2`);
                            }
                            const patternC = new RegExp(`(<c[^>]*r="C${rowNum}"[^>]*>)(?:<is><t>[^<]*</t></is>)?(</c>)`);
                            if (patternC.test(rXml)) {
                                rXml = rXml.replace(patternC, `$1<is><t>${name}</t></is>$2`);
                            }
                            xml = xml.replace(rowMatch[1], rXml);
                        }
                    });
                }

                zip.file('xl/worksheets/sheet1.xml', xml);
            }

            const outBlob = await zip.generateAsync({
                type: 'blob',
                mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });

            _v56TriggerDownload(outBlob, filename);
            Swal.fire({
                icon: 'success',
                title: 'Đã tải file mẫu V5.6 (Đầy đủ màu sắc)',
                html: `<p>File mẫu định dạng màu sắc chuẩn, đúng khối <b>${grade}</b>, lớp <b>${cls}</b>.</p><p style="color:#0284c7;font-size:0.88rem;margin-top:6px">🏫 FMA Nam Hòa - Lớp Phổ Cập TH. Hùng Vương, 158-160 Đất Thánh, Kp 8, P. Tân Hòa</p>`,
                timer: 3000
            });
            return true;
        }

        const blob = new Blob([arrayBuf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        _v56TriggerDownload(blob, filename);
        Swal.fire({
            icon: 'success',
            title: 'Đã tải file mẫu V5.6 (Đầy đủ màu sắc)',
            html: `<p>File mẫu định dạng màu sắc chuẩn của khối <b>${grade}</b>.</p><p style="color:#0284c7;font-size:0.88rem;margin-top:6px">🏫 FMA Nam Hòa - Lớp Phổ Cập TH. Hùng Vương, 158-160 Đất Thánh, Kp 8, P. Tân Hòa</p>`,
            timer: 3000
        });
        return true;
    } catch (e) {
        console.warn('Lỗi khi tải template màu sẵn:', e);
        return false;
    }
}

window.downloadScoreTemplate = async function() {
    const cls = window._scoreCurrentClass;
    const hk = window._scoreSemester || 'hk1';
    const sy = syNow();
    const hkNum = hk === 'hk1' ? 1 : 2;
    const students = activeStudentValues()
        .filter(s => _v55SameClass(s, cls))
        .sort((a,b) => (a.name||'').split(' ').pop().localeCompare((b.name||'').split(' ').pop(),'vi'));
    if (!students.length) { Swal.fire('Thông báo','Vui lòng chọn lớp có học sinh trước','warning'); return; }

    const grade = gradeOf(cls);
    const prefix = `HK${hkNum}`;
    const filename = `FileMau_Diem_HK${hkNum}_Lop${cls.replace('/','_')}_V56.xlsx`;

    // 1. Ưu tiên tải file mẫu đã có đầy đủ màu sắc, borders, công thức tự động và tên trường chuẩn
    const styledOk = await _v56DownloadStyledTemplate(prefix, grade, cls, sy, students, filename);
    if (styledOk) return;

    // 2. Dự phòng SheetJS nếu không tải được template tĩnh
    const ds = diemSubs(grade);
    const nxs = nxSubs(grade);
    const traits = _v55TraitDefs();
    const inputDefs = [];
    const commentDefs = [];
    ds.forEach(s => { inputDefs.push({ ...s, kind:'subject', type:'score', loai:'Điểm KTĐK' }); inputDefs.push({ ...s, kind:'subject', type:'level', loai:'Mức đạt được' }); commentDefs.push({ ...s, kind:'subject', type:'comment', loai:'Nhận xét' }); });
    nxs.forEach(s => { inputDefs.push({ ...s, kind:'subject', type:'level', loai:'Mức đạt được' }); commentDefs.push({ ...s, kind:'subject', type:'comment', loai:'Nhận xét' }); });
    traits.forEach(t => { inputDefs.push({ ...t, type:'level', loai:'Mức đạt được' }); commentDefs.push({ ...t, type:'comment', loai:'Nhận xét' }); });
    const defs = [...inputDefs, ...commentDefs];
    const N = 3 + defs.length;
    const ws = { '!ref': XLSX.utils.encode_range({ s:{r:0,c:0}, e:{r:5+students.length+5,c:N-1} }) };
    ws['!rows'] = [{hpt:22},{hpt:26},{hpt:18},{hpt:32},{hpt:24}];
    ws['!cols'] = [{wch:5},{wch:16},{wch:28}, ...inputDefs.map(d => d.loai==='Điểm KTĐK'?{wch:11}:{wch:12}), ...commentDefs.map(() => ({wch:44}))];
    ws['!merges'] = [
        {s:{r:0,c:0},e:{r:0,c:N-1}}, {s:{r:1,c:0},e:{r:1,c:N-1}}, {s:{r:2,c:0},e:{r:2,c:N-1}},
        {s:{r:3,c:0},e:{r:4,c:0}}, {s:{r:3,c:1},e:{r:4,c:1}}, {s:{r:3,c:2},e:{r:4,c:2}},
    ];
    _v55Set(ws,0,0,`🏫 FMA Nam Hòa - Lớp Phổ Cập TH. Hùng Vương, 158-160 Đất Thánh, Kp 8, P. Tân Hòa | LỚP: ${cls} | NĂM HỌC: ${sy}`);
    _v55Set(ws,1,0,`PHIẾU NHẬP ĐIỂM — CUỐI HỌC KỲ ${hkNum} — NĂM HỌC ${sy} — LỚP ${cls}`);
    _v55Set(ws,2,0,`✅ Gọn hơn: nhập ĐIỂM/MỨC ở bên trái; NHẬN XÉT tự động ở bên phải. Có đủ Phẩm chất + Năng lực chung + Năng lực đặc thù. KHÔNG sửa 5 hàng đầu và 3 cột đầu.`);
    _v55Set(ws,3,0,'STT'); _v55Set(ws,3,1,'Mã học sinh'); _v55Set(ws,3,2,'Họ và tên');
    _v55Set(ws,4,0,''); _v55Set(ws,4,1,'(không đổi)'); _v55Set(ws,4,2,'(không đổi)');
    defs.forEach((d, idx) => {
        const c = 3 + idx;
        const prefix = d.kind === 'subject' ? '[Môn] ' : (d.prefix ? `[${d.prefix}] ` : '');
        _v55Set(ws, 3, c, prefix + d.name);
        const loaiCol = d.loai === 'Mức đạt được' ? (d.kind === 'subject' ? 'Mức (T/H/C)' : 'Mức (T/Đ/C)') : d.loai;
        _v55Set(ws, 4, c, loaiCol);
    });

    const levelCols = new Map(), scoreCols = new Map();
    inputDefs.forEach((d, idx) => {
        const c = 3 + idx, key = _v56DefKey(d);
        if (d.loai === 'Mức đạt được') levelCols.set(key, c);
        if (d.loai === 'Điểm KTĐK') scoreCols.set(key, c);
    });
    const commentBank = _v56BuildCommentBankSheet(grade, commentDefs);
    students.forEach((s, si) => {
        const R = 5 + si, Rn = R + 1;
        ws['!rows'].push({hpt:21});
        _v55Set(ws,R,0,si+1); _v55Set(ws,R,1,s.code||s.id); _v55Set(ws,R,2,s.name);
        inputDefs.forEach((d, idx) => {
            const c = 3 + idx, key = _v56DefKey(d);
            if (d.loai === 'Điểm KTĐK') _v55Set(ws,R,c,'');
            else if (d.kind === 'subject' && d.type === 'level' && scoreCols.has(key)) {
                const scoreRef = `${_v55ColLetter(scoreCols.get(key))}${Rn}`;
                ws[XLSX.utils.encode_cell({r:R,c})] = { t:'s', f:`IF(${scoreRef}="","",IF(${scoreRef}>=9,"T",IF(${scoreRef}>=5,"H","C")))` };
            } else _v55Set(ws,R,c,'');
        });
        commentDefs.forEach((d, idx) => {
            const c = 3 + inputDefs.length + idx, key = _v56DefKey(d);
            const levelRef = `${_v55ColLetter(levelCols.get(key))}${Rn}`;
            const scoreRef = scoreCols.has(key) ? `${_v55ColLetter(scoreCols.get(key))}${Rn}` : '';
            ws[XLSX.utils.encode_cell({r:R,c})] = { t:'s', f:_v56CommentFormula(levelRef, scoreRef, commentBank, d, idx * 11) };
        });
    });
    ws['!dataValidation'] = [];
    const firstDR = 6, lastDR = 5 + students.length;
    inputDefs.forEach((d, idx) => {
        const c = 3 + idx, L = _v55ColLetter(c);
        if (d.loai === 'Điểm KTĐK') ws['!dataValidation'].push({ sqref:`${L}${firstDR}:${L}${lastDR}`, type:'decimal', operator:'between', formula1:'0', formula2:'10', showErrorMessage:true, errorTitle:'Điểm không hợp lệ', error:'Nhập điểm từ 0 đến 10' });
        if (d.loai === 'Mức đạt được') ws['!dataValidation'].push({ sqref:`${L}${firstDR}:${L}${lastDR}`, type:'list', formula1:d.kind==='subject'?'"T,H,C"':'"T,Đ,C"', showDropDown:true, showErrorMessage:true, errorTitle:'Giá trị không hợp lệ', error:d.kind==='subject'?'Chỉ chọn hoặc nhập T, H hoặc C':'Chỉ chọn hoặc nhập T, Đ hoặc C' });
    });
    ws['!freeze'] = { xSplit:3, ySplit:5, topLeftCell:'D6' };
    const wsG = XLSX.utils.aoa_to_sheet([
        ['HƯỚNG DẪN NHẬP ĐIỂM — TT27/2020 — V5.6'], [''],
        [`Lớp: ${cls} | Cuối HK${hkNum} | Năm học: ${sy} | Khối: ${grade}`], [''],
        ['Bố cục: bên trái nhập Điểm/Mức; bên phải là Nhận xét tự động, luân phiên theo ngân hàng câu của đúng khối.'],
        ['Điểm 9-10 → T; điểm 5-8.9 → H; dưới 5 → C. Hệ thống không tính điểm trung bình.'],
        ['Phẩm chất/Năng lực: T = Tốt | Đ = Đạt | C = Cần cố gắng.'],
        ['Không xóa/sửa Mã học sinh, không đổi tên sheet dữ liệu, không sửa 5 hàng đầu.'],
        ['Ô trống khi import sẽ được bỏ qua, không ghi đè dữ liệu cũ.'],
        [`Sheet NganHangNhanXet chứa ${commentBank.total} câu áp dụng cho khối ${grade}; không xóa hoặc đổi tên sheet này.`],
    ]);
    wsG['!cols'] = [{wch:95}];
    const safe = `HK${hkNum}_${cls}`.replace(/[\/\\?*\[\]:]/g,'_').substring(0,31);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, safe);
    XLSX.utils.book_append_sheet(wb, commentBank.ws, commentBank.sheetName);
    XLSX.utils.book_append_sheet(wb, wsG, 'HuongDan');
    _v56EnableWorkbookCalculation(wb);
    XLSX.writeFile(wb, `FileMau_Diem_HK${hkNum}_Lop${cls.replace('/','_')}_V56.xlsx`);
    Swal.fire('Đã tạo file mẫu V5.6', `Đã gắn ${commentBank.total} câu nhận xét đúng khối và tự luân phiên theo học sinh.`, 'success');
};

window.importScoreExcel = async function(inp) {
    const modeForAccess = window._scoreSemester || 'hk1';
    const accessStatus = await ensureScoreEntryAllowed(syNow(), modeForAccess);
    if (!accessStatus.allowed) { inp.value = ''; return; }
    const f = inp.files[0]; if (!f) return; inp.value = '';
    const reader = new FileReader();
    reader.onload = async e => {
        try {
            const wb = XLSX.read(e.target.result, { type:'array' });
            const sheetName = wb.SheetNames.find(n => n.startsWith('HK') && !n.toLowerCase().includes('huongdan')) || wb.SheetNames.find(n => !n.toLowerCase().includes('huongdan') && !n.toLowerCase().includes('nganhangnhanxet')) || wb.SheetNames[0];
            const sh = wb.Sheets[sheetName];
            const allRows = XLSX.utils.sheet_to_json(sh, { header:1, defval:'' });
            if (allRows.length < 6) { Swal.fire('Lỗi','File không đúng định dạng — cần ít nhất 6 hàng','error'); return; }
            const { colMap, dataStart } = _v55HeaderMap(allRows, 5);
            const hk = window._scoreSemester || 'hk1';
            const sy = syNow();
            const cls = window._scoreCurrentClass;
            const liveAccess = await ensureScoreEntryAllowed(sy, hk); if (!liveAccess.allowed) return;
            const grade = gradeOf(cls);
            const ds = diemSubs(grade), nxs = nxSubs(grade), traits = _v55TraitDefs();
            const allNames = [...ds.map(s=>s.name), ...nxs.map(s=>s.name), ...traits.map(t=>`${t.prefix}:${t.name}`)];
            const dataRows = allRows.slice(dataStart).filter(r => !_v55IsBlank(r[1]));
            if (!dataRows.length) { Swal.fire('Lỗi','Không tìm thấy dữ liệu học sinh từ hàng 6 trở đi','error'); return; }
            const lookup = _v55BuildStudentLookups(cls);
            Swal.fire({ title:'Đang import điểm V5.6...', allowOutsideClick:false, didOpen:()=>Swal.showLoading() });
            const updates = {};
            let ok = 0, skip = 0, notFound = 0, wrongClass = 0, blankRows = 0;
            const notFoundList = [], wrongClassList = [];
            for (const row of dataRows) {
                const rawCode = row[1];
                const code = _v55NormCode(rawCode);
                if (!code) { skip++; continue; }
                if (!_v55RowHasAnyInput(row, colMap, allNames)) { blankRows++; continue; }
                const hit = lookup.inClass.get(code);
                if (!hit) {
                    const any = lookup.all.get(code);
                    if (any) { wrongClass++; wrongClassList.push(String(rawCode).trim()); }
                    else { notFound++; notFoundList.push(String(rawCode).trim()); }
                    continue;
                }
                const student = hit.student;
                const existingHk = await loadHK(student.id, sy, hk);
                const now = typeof window.serverNow === 'function' ? window.serverNow() : Date.now();
                const basePath = `hocba/${student.id}/${sy.replace('-','_')}/${hk}`;
                const yp = `hocba/${student.id}/${sy.replace('-','_')}`;
                let touched = false;

                for (const sub of ds) {
                    const diemText = _v55Cell(row, colMap, sub.name, 'Điểm KTĐK');
                    const mucText = _v55Cell(row, colMap, sub.name, 'Mức đạt được');
                    const nxText = _v55Cell(row, colMap, sub.name, 'Nhận xét');
                    if (_v55IsBlank(diemText) && _v55IsBlank(mucText) && _v55IsBlank(nxText)) continue;
                    const existing = existingHk[sub.name] || {};
                    const diemRaw = _v55ParseScore(diemText, `Điểm ${sub.name} của học sinh ${String(rawCode).trim()}`);
                    const mucRaw = _v55SubjectLevelFromScoreOrCell(mucText, diemRaw, existing, `${sub.name} - ${String(rawCode).trim()}`);
                    const nxRaw = nxText || (mucRaw ? _v55Comment(grade, sub.name, 'subject', mucRaw, diemRaw !== null ? diemRaw : existing.diem) : '');
                    const nextRecord = { ...existing, mucDat:mucRaw, nhanXet:nxRaw };
                    if (diemRaw !== null) nextRecord.diem = diemRaw;
                    const audited = buildAuditedScoreRecord(existing, nextRecord, { now, source:'excel', studentId:student.id, studentCode:student.code || student.id, studentName:student.name, className:cls, subjectName:sub.name, schoolYear:sy, mode:hk });
                    updates[`${basePath}/${sub.name}`] = audited.record;
                    updates[`${yp}/${hk}_subjects/${sub.name}`] = audited.record;
                    if (hk === 'hk2') updates[`${yp}/subjects/${sub.name}`] = audited.record;
                    Object.assign(updates, makeScoreAuditUpdate(audited.auditEntry));
                    touched = true;
                }
                for (const sub of nxs) {
                    const mucText = _v55Cell(row, colMap, sub.name, 'Mức đạt được');
                    const nxText = _v55Cell(row, colMap, sub.name, 'Nhận xét');
                    if (_v55IsBlank(mucText) && _v55IsBlank(nxText)) continue;
                    const existing = existingHk[sub.name] || {};
                    const mucRaw = mucText ? _v55ValidateSubjectLevel(mucText, `${sub.name} - ${String(rawCode).trim()}`) : (existing.mucDat || '');
                    const nxRaw = nxText || (mucRaw ? _v55Comment(grade, sub.name, 'subject', mucRaw, '') : '');
                    const record = { ...existing, mucDat:mucRaw, nhanXet:nxRaw, __by: window.currentUser?.email || '', __uid: window.currentUser?.uid || '', __at: now };
                    updates[`${basePath}/${sub.name}`] = record;
                    updates[`${yp}/${hk}_subjects/${sub.name}`] = record;
                    if (hk === 'hk2') updates[`${yp}/subjects/${sub.name}`] = record;
                    touched = true;
                }
                const traitGroups = [
                    { list: window.PHAM_CHAT || [], prefix:'PC', prop:'__pc', yearProp:`${hk}_phamChat`, finalProp:'phamChat', kind:'quality' },
                    { list: window.NANG_LUC_CHUNG || [], prefix:'NLC', prop:'__nlc', yearProp:`${hk}_nangLucChung`, finalProp:'nangLucChung', kind:'commonCompetency' },
                    { list: window.NANG_LUC_DAC_THU || [], prefix:'NLĐ', prop:'__nld', yearProp:`${hk}_nangLucDacThu`, finalProp:'nangLucDacThu', kind:'specificCompetency' },
                ];
                traitGroups.forEach(group => {
                    group.list.forEach(name => {
                        const mucText = _v55TraitCell(row, colMap, group.prefix, name, 'Mức đạt được');
                        const nxText = _v55TraitCell(row, colMap, group.prefix, name, 'Nhận xét');
                        if (_v55IsBlank(mucText) && _v55IsBlank(nxText)) return;
                        const existing = existingHk[group.prop]?.[name] || {};
                        const mucRaw = mucText ? _v55ValidateTraitLevel(mucText, `${name} - ${String(rawCode).trim()}`) : (existing.mucDat || '');
                        const nxRaw = nxText || (mucRaw ? _v55Comment(grade, name, group.kind, mucRaw, '') : '');
                        const record = { ...existing, mucDat:mucRaw, nhanXet:nxRaw };
                        updates[`${basePath}/${group.prop}/${name}`] = record;
                        updates[`${yp}/${group.yearProp}/${name}`] = record;
                        if (hk === 'hk2') updates[`${yp}/${group.finalProp}/${name}`] = record;
                        touched = true;
                    });
                });
                if (touched) {
                    updates[`${basePath}/__at`] = now; updates[`${basePath}/__by`] = `import:${window.currentUser?.email||'?'}`; updates[`${basePath}/__uid`] = window.currentUser?.uid || '';
                    updates[`${yp}/grade`] = grade; updates[`${yp}/schoolYear`] = sy; updates[`${yp}/updatedAt`] = now;
                    ok++;
                } else skip++;
            }
            if (!Object.keys(updates).length) { Swal.close(); Swal.fire('Không có dữ liệu được lưu','File không có ô nhập hợp lệ hoặc toàn bộ dòng đều trống nên hệ thống không ghi đè dữ liệu cũ.','warning'); return; }
            await window.update(window.ref(window.db), updates);
            Swal.close();
            await _renderTable(window._scoreCurrentClass, sy, hk);
            Swal.fire({ icon:'success', title:'✅ Import V5.5 hoàn tất!', html:`<div style="text-align:left;font-size:.9rem">
                <p>✅ <b style="color:#16a34a">${ok}</b> học sinh đúng lớp đã cập nhật</p>
                ${blankRows?`<p>⬜ <b>${blankRows}</b> dòng trống được bỏ qua, không ghi đè dữ liệu cũ</p>`:''}
                ${wrongClass?`<p>🚫 <b style="color:#dc2626">${wrongClass}</b> mã HS thuộc lớp khác bị từ chối<br><small>${wrongClassList.slice(0,6).join(', ')}${wrongClassList.length>6?'...':''}</small></p>`:''}
                ${notFound?`<p>⚠️ <b>${notFound}</b> mã HS không tìm thấy<br><small>${notFoundList.slice(0,6).join(', ')}${notFoundList.length>6?'...':''}</small></p>`:''}
                ${skip?`<p>⏭️ <b>${skip}</b> dòng bỏ qua</p>`:''}
                <p style="margin-top:8px;color:#64748b">${sy} — ${hk.toUpperCase()} — Lớp ${cls}</p></div>` });
        } catch(err) { Swal.close(); Swal.fire('Lỗi import', err.message, 'error'); }
    };
    reader.readAsArrayBuffer(f);
};

window.downloadGHKTemplate = function() {
    const cls = window._scoreCurrentClass;
    const mode = window._scoreMode;
    const sy = syNow();
    const ghkLabel = mode === 'ghk1' ? 'Giữa HK1' : 'Giữa HK2';
    const students = activeStudentValues().filter(s => _v55SameClass(s, cls)).sort((a,b)=>(a.name||'').split(' ').pop().localeCompare((b.name||'').split(' ').pop(),'vi'));
    if (!students.length) { Swal.fire('Thông báo','Vui lòng chọn lớp có học sinh trước','warning'); return; }
    const grade = gradeOf(cls), subs = getSubs(grade), pcs = window.PHAM_CHAT || [];
    const inputDefs=[], commentDefs=[];
    subs.forEach(s => { if (ghkHasNumericScore(grade,s.name)) { inputDefs.push({ ...s, kind:'subject', loai:'Điểm KTĐK' }); inputDefs.push({ ...s, kind:'subject', loai:'Mức đạt được' }); } else inputDefs.push({ ...s, kind:'subject', loai:'Mức đạt được' }); commentDefs.push({ ...s, kind:'subject', loai:'Nhận xét' }); });
    pcs.forEach(name => { inputDefs.push({ name, kind:'quality', prefix:'PC', loai:'Mức đạt được' }); commentDefs.push({ name, kind:'quality', prefix:'PC', loai:'Nhận xét' }); });
    const defs=[...inputDefs,...commentDefs], N=3+defs.length;
    const ws={ '!ref':XLSX.utils.encode_range({s:{r:0,c:0},e:{r:5+students.length+3,c:N-1}}) };
    ws['!rows']=[{hpt:22},{hpt:26},{hpt:18},{hpt:32},{hpt:24}];
    ws['!cols']=[{wch:5},{wch:16},{wch:28},...inputDefs.map(d=>d.loai==='Điểm KTĐK'?{wch:11}:{wch:12}),...commentDefs.map(()=>({wch:44}))];
    ws['!merges']=[{s:{r:0,c:0},e:{r:0,c:N-1}},{s:{r:1,c:0},e:{r:1,c:N-1}},{s:{r:2,c:0},e:{r:2,c:N-1}},{s:{r:3,c:0},e:{r:4,c:0}},{s:{r:3,c:1},e:{r:4,c:1}},{s:{r:3,c:2},e:{r:4,c:2}}];
    _v55Set(ws,0,0,`🏫 FMA Nam Hòa - Lớp Phổ Cập TH. Hùng Vương, 158-160 Đất Thánh, Kp 8, P. Tân Hòa | LỚP: ${cls} | NĂM HỌC: ${sy}`);
    _v55Set(ws,1,0,`PHIẾU NHẬP ĐÁNH GIÁ — ${ghkLabel.toUpperCase()} — LỚP ${cls}`);
    _v55Set(ws,2,0,`✅ Nhập điểm/mức bên trái; nhận xét tự động bên phải. Giữa kỳ đúng TT27: chỉ môn được phép mới có Điểm KTĐK.`);
    _v55Set(ws,3,0,'STT'); _v55Set(ws,3,1,'Mã học sinh'); _v55Set(ws,3,2,'Họ và tên'); _v55Set(ws,4,1,'(không đổi)'); _v55Set(ws,4,2,'(không đổi)');
    defs.forEach((d,idx)=>{ const c=3+idx; _v55Set(ws,3,c,(d.prefix?`${d.prefix}: `:'')+d.name); _v55Set(ws,4,c,d.loai); });
    const levelCols=new Map(), scoreCols=new Map();
    inputDefs.forEach((d,idx)=>{ const c=3+idx; if(d.loai==='Mức đạt được') levelCols.set(d.name,c); if(d.loai==='Điểm KTĐK') scoreCols.set(d.name,c); });
    students.forEach((s,si)=>{ const R=5+si,Rn=R+1; _v55Set(ws,R,0,si+1); _v55Set(ws,R,1,s.code||s.id); _v55Set(ws,R,2,s.name); inputDefs.forEach((d,idx)=>{ const c=3+idx; if(d.loai==='Điểm KTĐK') _v55Set(ws,R,c,''); else if(d.kind==='subject'&&scoreCols.has(d.name)){ const sr=`${_v55ColLetter(scoreCols.get(d.name))}${Rn}`; ws[XLSX.utils.encode_cell({r:R,c})]={t:'s',f:`IF(${sr}="","",IF(${sr}>=9,"T",IF(${sr}>=5,"H","C")))`}; } else _v55Set(ws,R,c,''); }); commentDefs.forEach((d,idx)=>{ const c=3+inputDefs.length+idx; const lr=`${_v55ColLetter(levelCols.get(d.name))}${Rn}`; const sr=scoreCols.has(d.name)?`${_v55ColLetter(scoreCols.get(d.name))}${Rn}`:''; const high=_v55Comment(grade,d.name,d.kind,'T',10), good=_v55Comment(grade,d.name,d.kind,d.kind==='subject'?'H':'Đ',8), pass=_v55Comment(grade,d.name,d.kind,d.kind==='subject'?'H':'Đ',6), fail=_v55Comment(grade,d.name,d.kind,'C',4); ws[XLSX.utils.encode_cell({r:R,c})]={t:'s',f:_v55FormulaComment(lr,sr,high,good,pass,fail)}; }); });
    ws['!dataValidation']=[]; const firstDR=6,lastDR=5+students.length; inputDefs.forEach((d,idx)=>{ const c=3+idx,L=_v55ColLetter(c); if(d.loai==='Điểm KTĐK') ws['!dataValidation'].push({sqref:`${L}${firstDR}:${L}${lastDR}`,type:'decimal',operator:'between',formula1:'0',formula2:'10',showErrorMessage:true,errorTitle:'Điểm không hợp lệ',error:'Nhập điểm từ 0 đến 10'}); else ws['!dataValidation'].push({sqref:`${L}${firstDR}:${L}${lastDR}`,type:'list',formula1:d.kind==='subject'?'"T,H,C"':'"T,Đ,C"',showDropDown:false,showErrorMessage:true,errorTitle:'Giá trị không hợp lệ',error:d.kind==='subject'?'Chỉ nhập T,H,C':'Chỉ nhập T,Đ,C'}); });
    ws['!freeze']={xSplit:3,ySplit:5,topLeftCell:'D6'};
    const wsG=XLSX.utils.aoa_to_sheet([['HƯỚNG DẪN GIỮA HỌC KỲ — V5.5'],[''],[`Lớp ${cls} | ${ghkLabel} | ${sy}`],['Ô trống khi import sẽ bỏ qua, không ghi đè dữ liệu cũ.']]); wsG['!cols']=[{wch:90}];
    const safe=`${mode==='ghk1'?'GiuaHK1':'GiuaHK2'}_${cls}`.replace(/[\/\\?*\[\]:]/g,'_').substring(0,31); const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,ws,safe); XLSX.utils.book_append_sheet(wb,wsG,'HuongDan'); XLSX.writeFile(wb,`FileMau_${ghkLabel.replace(' ','')}_Lop${cls.replace('/','_')}_V55.xlsx`);
    Swal.fire('Đã tạo file mẫu V5.5', `${ghkLabel}: nhập bên trái, nhận xét tự động bên phải.`, 'success');
};

window.importGHKExcel = async function(inp) {
    const modeForAccess = window._scoreMode || 'ghk1';
    const accessStatus = await ensureScoreEntryAllowed(syNow(), modeForAccess);
    if (!accessStatus.allowed) { inp.value = ''; return; }
    const f = inp.files[0]; if (!f) return; inp.value = '';
    const reader = new FileReader();
    reader.onload = async e => {
        try {
            const wb = XLSX.read(e.target.result, {type:'array'});
            const sheetName = wb.SheetNames.find(n => /^(Giua|GiuaHK|ghk)/i.test(n.trim())) || wb.SheetNames.find(n => !n.toLowerCase().includes('huongdan')) || wb.SheetNames[0];
            const allRows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], {header:1, defval:''});
            if (allRows.length < 6) { Swal.fire('Lỗi','File không đúng định dạng — cần ít nhất 6 hàng','error'); return; }
            const { colMap, dataStart } = _v55HeaderMap(allRows, 5);
            const mode = window._scoreMode, sy = syNow(), cls = window._scoreCurrentClass, grade = gradeOf(cls);
            const liveAccess = await ensureScoreEntryAllowed(sy, mode); if (!liveAccess.allowed) return;
            const subs = getSubs(grade), pcs = window.PHAM_CHAT || [], names = [...subs.map(s=>s.name), ...pcs];
            const rows = allRows.slice(dataStart).filter(r => !_v55IsBlank(r[1]));
            if (!rows.length) { Swal.fire('Lỗi','Không tìm thấy dữ liệu học sinh từ hàng 6 trở đi','error'); return; }
            const lookup = _v55BuildStudentLookups(cls);
            Swal.fire({title:'Đang import giữa kỳ V5.5...',allowOutsideClick:false,didOpen:()=>Swal.showLoading()});
            const updates = {}; let ok=0, skip=0, blankRows=0, wrongClass=0, notFound=0; const wrongClassList=[], notFoundList=[];
            for (const row of rows) {
                const rawCode=row[1], code=_v55NormCode(rawCode); if(!code){skip++;continue;}
                if(!_v55RowHasAnyInput(row,colMap,names)){blankRows++;continue;}
                const hit=lookup.inClass.get(code); if(!hit){ const any=lookup.all.get(code); if(any){wrongClass++;wrongClassList.push(String(rawCode).trim());} else {notFound++;notFoundList.push(String(rawCode).trim());} continue; }
                const student=hit.student, existingGhk=await loadGHK(student.id,sy,mode), now=typeof window.serverNow==='function'?window.serverNow():Date.now(); let touched=false;
                const basePath=`hocba/${student.id}/${sy.replace('-','_')}/${mode}`, yp=`hocba/${student.id}/${sy.replace('-','_')}`;
                for(const sub of subs){ const diemText=_v55Cell(row,colMap,sub.name,'Điểm KTĐK'), mucText=_v55Cell(row,colMap,sub.name,'Mức đạt được'), nxText=_v55Cell(row,colMap,sub.name,'Nhận xét'); if(_v55IsBlank(diemText)&&_v55IsBlank(mucText)&&_v55IsBlank(nxText)) continue; const existing=existingGhk[sub.name]||{}; let diemRaw=null; if(ghkHasNumericScore(grade,sub.name)) diemRaw=_v55ParseScore(diemText,`Điểm ${sub.name} của học sinh ${String(rawCode).trim()}`); else if(!_v55IsBlank(diemText)) throw new Error(`${sub.name} không được nhập điểm giữa kỳ ở khối ${grade}.`); const mucRaw=ghkHasNumericScore(grade,sub.name)?_v55SubjectLevelFromScoreOrCell(mucText,diemRaw,existing,`${sub.name} - ${String(rawCode).trim()}`):(mucText?_v55ValidateSubjectLevel(mucText,`${sub.name} - ${String(rawCode).trim()}`):(existing.mucDat||'')); const nxRaw=nxText||(mucRaw?_v55Comment(grade,sub.name,'subject',mucRaw,diemRaw!==null?diemRaw:existing.diem):''); const nextRecord={...existing,mucDat:mucRaw,nhanXet:nxRaw}; if(diemRaw!==null) nextRecord.diem=diemRaw; const audited=buildAuditedScoreRecord(existing,nextRecord,{now,source:'excel',studentId:student.id,studentCode:student.code||student.id,studentName:student.name,className:cls,subjectName:sub.name,schoolYear:sy,mode}); updates[`${basePath}/${sub.name}`]=audited.record; updates[`${yp}/${mode}_subjects/${sub.name}`]=audited.record; Object.assign(updates,makeScoreAuditUpdate(audited.auditEntry)); touched=true; }
                pcs.forEach(p=>{ const mucText=_v55Cell(row,colMap,p,'Mức đạt được'), nxText=_v55Cell(row,colMap,p,'Nhận xét'); if(_v55IsBlank(mucText)&&_v55IsBlank(nxText)) return; const existing=existingGhk.__pc?.[p]||{}; const mucRaw=mucText?_v55ValidateTraitLevel(mucText,`${p} - ${String(rawCode).trim()}`):(existing.mucDat||''); const nxRaw=nxText||(mucRaw?_v55Comment(grade,p,'quality',mucRaw,''):''); const record={...existing,mucDat:mucRaw,nhanXet:nxRaw}; updates[`${basePath}/__pc/${p}`]=record; updates[`${yp}/${mode}_phamChat/${p}`]=record; touched=true; });
                if(touched){ updates[`${basePath}/__type`]='giua_hk'; updates[`${basePath}/__hk`]=mode; updates[`${basePath}/__at`]=now; updates[`${basePath}/__by`]=`import:${window.currentUser?.email||'?'}`; updates[`${basePath}/__uid`]=window.currentUser?.uid||''; updates[`${yp}/grade`]=grade; updates[`${yp}/schoolYear`]=sy; updates[`${yp}/updatedAt`]=now; ok++; } else skip++;
            }
            if(!Object.keys(updates).length){Swal.close();Swal.fire('Không có dữ liệu được lưu','File trống hoặc không có dòng hợp lệ, hệ thống không ghi đè dữ liệu cũ.','warning');return;}
            await window.update(window.ref(window.db),updates); Swal.close();
            const allStudents=activeStudentValues().filter(s=>_v55SameClass(s,cls)).sort((a,b)=>(a.name||'').split(' ').pop().localeCompare((b.name||'').split(' ').pop(),'vi')); await _renderGHKTable(cls,sy,mode,allStudents);
            Swal.fire({icon:'success',title:'✅ Import giữa kỳ V5.5 hoàn tất!',html:`<div style="text-align:left;font-size:.9rem"><p>✅ <b style="color:#16a34a">${ok}</b> học sinh đúng lớp đã cập nhật</p>${blankRows?`<p>⬜ <b>${blankRows}</b> dòng trống bỏ qua</p>`:''}${wrongClass?`<p>🚫 <b>${wrongClass}</b> mã HS thuộc lớp khác bị từ chối<br><small>${wrongClassList.slice(0,6).join(', ')}</small></p>`:''}${notFound?`<p>⚠️ <b>${notFound}</b> mã không tìm thấy<br><small>${notFoundList.slice(0,6).join(', ')}</small></p>`:''}${skip?`<p>⏭️ <b>${skip}</b> dòng bỏ qua</p>`:''}</div>`});
        } catch(err){ Swal.close(); Swal.fire('Lỗi import',err.message,'error'); }
    };
    reader.readAsArrayBuffer(f);
};


// ══════════════════════════════════════════════════════════════════════════════
// V5.27.0 OVERRIDE — Modal nhập Giữa HK có Phẩm chất + Năng lực cốt lõi
// ══════════════════════════════════════════════════════════════════════════════
window.openGHKModal = async function(studentId, sy, mode) {
    if (window._isViewingArchivedYear) {
        Swal.fire('Chỉ xem năm học cũ', 'Năm học đã lưu trữ chỉ được xem lại, không nhập hoặc chỉnh sửa điểm.', 'info');
        return;
    }
    const accessStatus = await ensureScoreEntryAllowed(sy, mode);
    if (!accessStatus.allowed) return;
    const student = window.localData.students[studentId];
    if (!student) return;

    const grade = gradeOf(student.classRoom || student.class);
    const subs = getSubs(grade);
    const ghkData = await loadGHK(studentId, sy, mode);
    const ghkLabel = mode === 'ghk1' ? 'Giữa Học kỳ 1' : 'Giữa Học kỳ 2';
    const hasGHKScore = ghkDiemSubs(grade).length > 0;
    const traits = _v527GhkTraitDefs();
    const traitGroups = [
        { key:'pc',  kind:'quality',             icon:'💎', title:'Phẩm chất',        items: traits.filter(t => t.kind === 'quality') },
        { key:'nlc', kind:'commonCompetency',    icon:'⚡', title:'Năng lực chung',   items: traits.filter(t => t.kind === 'commonCompetency') },
        { key:'nld', kind:'specificCompetency',  icon:'🎯', title:'Năng lực đặc thù', items: traits.filter(t => t.kind === 'specificCompetency') },
    ];
    const mucOpts = (window.MUC_DANH_GIA_MON || ['T','H','C']).map(m => `<option value="${m}">${m}</option>`).join('');
    const traitOpts = (window.MUC_DANH_GIA || ['T','Đ','C']).map(m => `<option value="${m}">${m}</option>`).join('');

    const buildSubjectRows = () => subs.map(sub => {
        const sc = ghkData[sub.name] || {};
        const isDiem = ghkHasNumericScore(grade, sub.name);
        const key = _v527DomKey('sub', sub.name);
        const diemCell = isDiem
            ? `<td style="padding:6px 8px;border:1px solid #e2e8f0;min-width:90px">
                <input type="number" id="ghk-sub-diem-${key}" class="form-control form-control-sm"
                    min="0" max="10" step="0.1" placeholder="0–10"
                    style="width:75px;font-weight:700;text-align:center;color:${isEditedScore(sc)?'#dc2626':'#1d4ed8'}"
                    title="${escapeHtml(scoreAuditSummary(sc))}" value="${sc.diem ?? ''}">
               </td>`
            : `<td style="padding:6px 8px;border:1px solid #e2e8f0;text-align:center;background:repeating-linear-gradient(135deg,#f8fafc 0,#f8fafc 4px,#e2e8f0 4px,#e2e8f0 5px);color:#94a3b8;font-size:0.75rem">—</td>`;
        return `<tr>
            <td style="padding:7px 10px;font-weight:600;border:1px solid #e2e8f0;background:${isDiem?'#f5f3ff':'#f8fafc'};min-width:150px">
                ${sub.name}${isDiem ? '<span style="font-size:0.66rem;color:#7c3aed;font-weight:400;margin-left:4px">có điểm</span>' : ''}
            </td>
            <td style="padding:6px 8px;border:1px solid #e2e8f0;min-width:130px">
                <select id="ghk-sub-muc-${key}" class="form-control form-control-sm"><option value="">-- Mức --</option>${mucOpts}</select>
            </td>
            ${diemCell}
            <td style="padding:6px 8px;border:1px solid #e2e8f0">
                <input type="text" id="ghk-sub-nx-${key}" class="form-control form-control-sm" placeholder="Nhận xét..." value="${escapeHtml(sc.nhanXet || '')}">
            </td>
        </tr>`;
    }).join('');

    const buildTraitRows = group => group.items.map(def => {
        const key = _v527DomKey(def.kind, def.name);
        const prop = _v527TraitProp(def.kind);
        const d = ghkData[prop]?.[def.name] || {};
        return `<tr>
            <td style="padding:6px 10px;border:1px solid #e2e8f0;font-weight:500">${def.name}</td>
            <td style="padding:6px 8px;border:1px solid #e2e8f0;min-width:130px">
                <select id="ghk-trait-muc-${key}" class="form-control form-control-sm"><option value="">-- Mức --</option>${traitOpts}</select>
            </td>
            <td style="padding:6px 8px;border:1px solid #e2e8f0;text-align:center;background:repeating-linear-gradient(135deg,#f8fafc 0,#f8fafc 4px,#e2e8f0 4px,#e2e8f0 5px);color:#94a3b8">—</td>
            <td style="padding:6px 8px;border:1px solid #e2e8f0">
                <input type="text" id="ghk-trait-nx-${key}" class="form-control form-control-sm" placeholder="Nhận xét..." value="${escapeHtml(d.nhanXet || '')}">
            </td>
        </tr>`;
    }).join('') || `<tr><td colspan="4" style="padding:14px;text-align:center;color:#94a3b8">Chưa cấu hình dữ liệu</td></tr>`;

    Swal.fire({
        title: '',
        html: `<div id="ghk-modal-wrap" style="text-align:left;font-size:0.88rem;display:flex;flex-direction:column;height:100%;min-height:0;overflow:hidden">
            <div style="background:linear-gradient(135deg,#5b21b6,#7c3aed);color:white;border-radius:8px;padding:11px 15px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;gap:10px;flex-shrink:0">
                <div><div style="font-size:1rem;font-weight:700">${student.name}</div>
                    <div style="opacity:0.85;font-size:0.8rem">Lớp ${student.classRoom||student.class} — Khối ${grade} — <strong>${ghkLabel}</strong> — ${sy}</div></div>
                <div style="background:rgba(255,255,255,0.15);border-radius:6px;padding:5px 11px;font-size:0.75rem;flex-shrink:0">
                    ${hasGHKScore ? 'ℹ️ Có điểm ở 3 môn + năng lực cốt lõi' : 'ℹ️ Đánh giá định tính + năng lực cốt lõi'}
                </div>
            </div>
            <div style="display:flex;gap:6px;margin-bottom:8px;flex-shrink:0;flex-wrap:wrap">
                <button type="button" id="ghk-tab-mon" onclick="window._ghkSwitchTabV527('mon')" style="padding:6px 14px;border-radius:6px;border:none;cursor:pointer;font-weight:600;font-size:0.82rem;background:#7c3aed;color:white">📚 Môn học</button>
                ${traitGroups.map(g => `<button type="button" id="ghk-tab-${g.key}" onclick="window._ghkSwitchTabV527('${g.key}')" style="padding:6px 14px;border-radius:6px;border:1.5px solid #e2e8f0;cursor:pointer;font-weight:600;font-size:0.82rem;background:#f8fafc;color:#64748b">${g.icon} ${g.title}</button>`).join('')}
                <span style="margin-left:auto;color:#94a3b8;font-size:0.75rem;align-self:center;padding-right:2px">Cuộn để xem thêm ↕</span>
            </div>
            <div id="ghk-panel-mon" style="flex:1;overflow-y:auto;overflow-x:auto;border:1px solid #e2e8f0;border-radius:8px;min-height:0">
                <table style="width:100%;border-collapse:collapse;font-size:0.84rem;min-width:560px"><thead><tr style="background:#5b21b6;color:white;text-align:center;position:sticky;top:0;z-index:3">
                    <th style="padding:8px 10px;border:1px solid #7c3aed;text-align:left;min-width:150px">Môn học</th><th style="padding:8px 10px;border:1px solid #7c3aed;min-width:125px">Mức đạt được</th><th style="padding:8px 10px;border:1px solid #7c3aed;min-width:90px">Điểm KTĐK</th><th style="padding:8px 10px;border:1px solid #7c3aed">Nhận xét</th>
                </tr></thead><tbody>${buildSubjectRows()}</tbody></table>
            </div>
            ${traitGroups.map(g => `<div id="ghk-panel-${g.key}" style="display:none;flex:1;overflow-y:auto;overflow-x:auto;border:1px solid #e2e8f0;border-radius:8px;min-height:0">
                <table style="width:100%;border-collapse:collapse;font-size:0.84rem;min-width:500px"><thead><tr style="background:#5b21b6;color:white;text-align:center;position:sticky;top:0;z-index:3">
                    <th style="padding:7px 10px;border:1px solid #7c3aed;text-align:left;min-width:160px">${g.title}</th><th style="padding:7px 10px;border:1px solid #7c3aed;min-width:125px">Mức đạt được</th><th style="padding:7px 10px;border:1px solid #7c3aed;min-width:90px">—</th><th style="padding:7px 10px;border:1px solid #7c3aed">Nhận xét</th>
                </tr></thead><tbody>${buildTraitRows(g)}</tbody></table>
            </div>`).join('')}
        </div>`,
        width: '920px', showCancelButton:true, confirmButtonText:'<i class="fas fa-save"></i> Lưu đánh giá giữa HK', cancelButtonText:'Đóng', confirmButtonColor:'#7c3aed',
        didOpen: () => {
            // V5.29.1: Fix modal giữa kỳ bị che phần dưới và không kéo xuống được.
            // Lỗi cũ: popup/htmlContainer dùng overflow:hidden + chưa có chiều cao rõ ràng,
            // nên bảng dài bị đè bởi khu vực nút Lưu/Đóng phía dưới.
            const popup = Swal.getPopup();
            if (popup) {
                popup.style.width = 'min(96vw, 1180px)';
                popup.style.maxWidth = '96vw';
                popup.style.height = 'min(94vh, 980px)';
                popup.style.maxHeight = '94vh';
                popup.style.display = 'flex';
                popup.style.flexDirection = 'column';
                popup.style.overflow = 'hidden';
                popup.style.padding = '0';
            }

            const htmlContainer = Swal.getHtmlContainer();
            if (htmlContainer) {
                htmlContainer.style.flex = '1 1 auto';
                htmlContainer.style.minHeight = '0';
                htmlContainer.style.maxHeight = 'none';
                htmlContainer.style.overflow = 'hidden';
                htmlContainer.style.display = 'flex';
                htmlContainer.style.flexDirection = 'column';
                htmlContainer.style.padding = '0 24px 8px';
                htmlContainer.style.margin = '0';
            }

            const actions = Swal.getActions();
            if (actions) {
                actions.style.flex = '0 0 auto';
                actions.style.position = 'sticky';
                actions.style.bottom = '0';
                actions.style.background = '#fff';
                actions.style.zIndex = '20';
                actions.style.margin = '0';
                actions.style.padding = '12px 0 16px';
                actions.style.boxShadow = '0 -8px 18px rgba(15,23,42,.08)';
            }

            const wrap = document.getElementById('ghk-modal-wrap');
            if (wrap) {
                wrap.style.flex = '1 1 auto';
                wrap.style.minHeight = '0';
                wrap.style.height = '100%';
                wrap.style.overflow = 'hidden';
            }

            ['ghk-panel-mon','ghk-panel-pc','ghk-panel-nlc','ghk-panel-nld'].forEach(id => {
                const panel = document.getElementById(id);
                if (!panel) return;
                panel.style.flex = '1 1 auto';
                panel.style.minHeight = '180px';
                panel.style.maxHeight = 'calc(94vh - 255px)';
                panel.style.overflowY = 'auto';
                panel.style.overflowX = 'auto';
                panel.style.WebkitOverflowScrolling = 'touch';
            });
            window._ghkSwitchTabV527 = tab => {
                ['mon','pc','nlc','nld'].forEach(k => {
                    const panel = document.getElementById(`ghk-panel-${k}`), btn = document.getElementById(`ghk-tab-${k}`);
                    if (!panel || !btn) return;
                    const on = k === tab; panel.style.display = on ? 'flex' : 'none'; panel.style.flexDirection = 'column';
                    btn.style.background = on ? '#7c3aed' : '#f8fafc'; btn.style.color = on ? 'white' : '#64748b'; btn.style.border = on ? 'none' : '1.5px solid #e2e8f0';
                });
            };
            window._ghkSwitchTabV527('mon');
            subs.forEach(sub => {
                const key = _v527DomKey('sub', sub.name), sc = ghkData[sub.name] || {};
                const mEl = document.getElementById(`ghk-sub-muc-${key}`), nEl = document.getElementById(`ghk-sub-nx-${key}`), dEl = document.getElementById(`ghk-sub-diem-${key}`);
                if (mEl && sc.mucDat) mEl.value = sc.mucDat; if (nEl && sc.nhanXet) nEl.value = sc.nhanXet; if (dEl && sc.diem !== undefined && sc.diem !== '') dEl.value = sc.diem;
                attachScoreChangeHighlighter(dEl, sc.diem, sc);
                bindCommentField({ grade, kind:'subject', name:sub.name, seed:studentId, levelId:`ghk-sub-muc-${key}`, scoreId:ghkHasNumericScore(grade, sub.name)?`ghk-sub-diem-${key}`:'', commentId:`ghk-sub-nx-${key}` });
            });
            traits.forEach(def => {
                const key = _v527DomKey(def.kind, def.name), data = ghkData[_v527TraitProp(def.kind)]?.[def.name] || {};
                const m = document.getElementById(`ghk-trait-muc-${key}`), n = document.getElementById(`ghk-trait-nx-${key}`);
                if (m && data.mucDat) m.value = data.mucDat; if (n && data.nhanXet) n.value = data.nhanXet;
                bindCommentField({ grade, kind:def.kind, name:def.name, seed:studentId, levelId:`ghk-trait-muc-${key}`, commentId:`ghk-trait-nx-${key}`, syncLevelFromScore:false });
            });
            addCommentBankToolbar(Swal.getHtmlContainer() || document, { afterElement: document.querySelector('#ghk-modal-wrap > div:first-child') });
        },
        preConfirm: async () => {
            const liveAccess = await ensureScoreEntryAllowed(sy, mode); if (!liveAccess.allowed) return false;
            const now = typeof window.serverNow === 'function' ? window.serverNow() : Date.now();
            const subData = {}, auditUpdates = {};
            for (const sub of subs) {
                const key = _v527DomKey('sub', sub.name), isDiem = ghkHasNumericScore(grade, sub.name);
                const diemText = isDiem ? (document.getElementById(`ghk-sub-diem-${key}`)?.value || '').trim() : '';
                const diemValue = diemText === '' ? null : Number(diemText);
                if (diemValue !== null && (!Number.isFinite(diemValue) || diemValue < 0 || diemValue > 10)) { Swal.showValidationMessage(`Điểm ${sub.name} phải nằm trong khoảng 0 đến 10`); return false; }
                const nextRecord = { mucDat:document.getElementById(`ghk-sub-muc-${key}`)?.value || '', nhanXet:document.getElementById(`ghk-sub-nx-${key}`)?.value || '', ...(diemValue !== null ? { diem:diemValue } : {}) };
                const audited = buildAuditedScoreRecord(ghkData[sub.name] || {}, nextRecord, { now, source:'manual', studentId, studentCode:student.code || student.id, studentName:student.name, className:student.classRoom || student.class || '', subjectName:sub.name, schoolYear:sy, mode });
                subData[sub.name] = audited.record; Object.assign(auditUpdates, makeScoreAuditUpdate(audited.auditEntry));
            }
            const traitDataByProp = { __pc:{}, __nlc:{}, __nld:{} };
            traits.forEach(def => {
                const key = _v527DomKey(def.kind, def.name), prop = _v527TraitProp(def.kind);
                traitDataByProp[prop][def.name] = { mucDat:document.getElementById(`ghk-trait-muc-${key}`)?.value || '', nhanXet:document.getElementById(`ghk-trait-nx-${key}`)?.value || '' };
            });
            const ghkSave = { ...ghkData, ...subData, ...traitDataByProp, __type:'giua_hk', __hk:mode, __at:now, __by:window.currentUser?.email || '', __uid:window.currentUser?.uid || '' };
            const rootUpdates = { [`${ghkPath(studentId, sy, mode)}`]: ghkSave, ...auditUpdates };
            const yp = yearPath(studentId, sy); rootUpdates[`${yp}/grade`] = grade; rootUpdates[`${yp}/schoolYear`] = sy; rootUpdates[`${yp}/updatedAt`] = now;
            Object.entries(subData).forEach(([subjectName, record]) => { rootUpdates[`${yp}/${mode}_subjects/${subjectName}`] = record; });
            rootUpdates[`${yp}/${mode}_phamChat`] = traitDataByProp.__pc;
            rootUpdates[`${yp}/${mode}_nangLucChung`] = traitDataByProp.__nlc;
            rootUpdates[`${yp}/${mode}_nangLucDacThu`] = traitDataByProp.__nld;
            await window.update(window.ref(window.db), rootUpdates);
            return ghkSave;
        }
    }).then(res => {
        if (!res.isConfirmed) return;
        Swal.fire({ icon:'success', title:'✅ Đã lưu đánh giá giữa HK!', html:'<small>Đã lưu môn học, phẩm chất, năng lực chung và năng lực đặc thù.</small>', timer:2000, showConfirmButton:false });
        _renderGHKTable(window._scoreCurrentClass, sy, mode, activeStudentValues().filter(s => (s.classRoom||s.class||'') === window._scoreCurrentClass).sort((a,b)=>(a.name||'').split(' ').pop().localeCompare((b.name||'').split(' ').pop(),'vi')));
    });
};

window.exportGHKExcel = async function(cls, sy, mode) {
    const students = activeStudentValues().filter(s => (s.classRoom||s.class||'') === cls).sort((a,b)=>(a.name||'').split(' ').pop().localeCompare((b.name||'').split(' ').pop(),'vi'));
    const grade = gradeOf(cls), subs = getSubs(grade), traits = _v527GhkTraitDefs();
    const ghkLabel = mode === 'ghk1' ? 'GiuaHK1' : 'GiuaHK2';
    Swal.fire({ title:'Đang xuất...', allowOutsideClick:false, didOpen:()=>Swal.showLoading() });
    const rows = await Promise.all(students.map(async (s,i) => {
        const g = await loadGHK(s.id, sy, mode);
        const row = { 'STT':i+1, 'Mã HS':s.code||s.id, 'Họ tên':s.name, 'Lớp':cls };
        subs.forEach(sub => { row[sub.name + ' - Mức'] = g[sub.name]?.mucDat || ''; if (ghkHasNumericScore(grade, sub.name)) row[sub.name + ' - Điểm'] = g[sub.name]?.diem || ''; row[sub.name + ' - NX'] = g[sub.name]?.nhanXet || ''; });
        traits.forEach(t => { const d = g[_v527TraitProp(t.kind)]?.[t.name] || {}; const label = `${t.prefix} ${t.name}`; row[label + ' - Mức'] = d.mucDat || ''; row[label + ' - NX'] = d.nhanXet || ''; });
        return row;
    }));
    const safe = `${ghkLabel}_${cls}`.replace(/[\/\\?*\[\]:]/g,'_').substring(0,31);
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), safe); XLSX.writeFile(wb, `${ghkLabel}_Lop${cls.replace('/','_')}_${sy.replace('-','_')}_V527.xlsx`);
    Swal.fire({ icon:'success', title:'Xuất thành công!', timer:1500, showConfirmButton:false });
};

window.downloadGHKTemplate = async function() {
    const cls = window._scoreCurrentClass, mode = window._scoreMode, sy = syNow();
    const ghkLabel = mode === 'ghk1' ? 'Giữa HK1' : 'Giữa HK2';
    const students = activeStudentValues().filter(s => _v55SameClass(s, cls)).sort((a,b)=>(a.name||'').split(' ').pop().localeCompare((b.name||'').split(' ').pop(),'vi'));
    if (!students.length) { Swal.fire('Thông báo','Vui lòng chọn lớp có học sinh trước','warning'); return; }
    const grade = gradeOf(cls);
    const prefix = mode === 'ghk1' ? 'GiuaHK1' : 'GiuaHK2';
    const filename = `FileMau_${ghkLabel.replace(' ','')}_Lop${cls.replace('/','_')}_V56.xlsx`;

    // 1. Ưu tiên tải file mẫu đã có đầy đủ màu sắc, borders, công thức tự động và tên trường chuẩn
    const styledOk = await _v56DownloadStyledTemplate(prefix, grade, cls, sy, students, filename);
    if (styledOk) return;

    // 2. Dự phòng SheetJS nếu không tải được template tĩnh
    const subs = getSubs(grade), traits = _v527GhkTraitDefs();
    const inputDefs = [], commentDefs = [];
    subs.forEach(s => { if (ghkHasNumericScore(grade, s.name)) { inputDefs.push({ ...s, kind:'subject', prefix:'', loai:'Điểm KTĐK' }); inputDefs.push({ ...s, kind:'subject', prefix:'', loai:'Mức đạt được' }); } else inputDefs.push({ ...s, kind:'subject', prefix:'', loai:'Mức đạt được' }); commentDefs.push({ ...s, kind:'subject', prefix:'', loai:'Nhận xét' }); });
    traits.forEach(t => { inputDefs.push({ ...t, loai:'Mức đạt được' }); commentDefs.push({ ...t, loai:'Nhận xét' }); });
    const defs = [...inputDefs, ...commentDefs], N = 3 + defs.length;
    const ws = { '!ref':XLSX.utils.encode_range({s:{r:0,c:0},e:{r:5+students.length+4,c:N-1}}) };
    ws['!rows']=[{hpt:22},{hpt:26},{hpt:18},{hpt:32},{hpt:24}];
    ws['!cols']=[{wch:5},{wch:16},{wch:28},...inputDefs.map(d=>d.loai==='Điểm KTĐK'?{wch:11}:{wch:13}),...commentDefs.map(()=>({wch:44}))];
    ws['!merges']=[{s:{r:0,c:0},e:{r:0,c:N-1}},{s:{r:1,c:0},e:{r:1,c:N-1}},{s:{r:2,c:0},e:{r:2,c:N-1}},{s:{r:3,c:0},e:{r:4,c:0}},{s:{r:3,c:1},e:{r:4,c:1}},{s:{r:3,c:2},e:{r:4,c:2}}];
    _v55Set(ws,0,0,`🏫 FMA Nam Hòa - Lớp Phổ Cập TH. Hùng Vương, 158-160 Đất Thánh, Kp 8, P. Tân Hòa | LỚP: ${cls} | NĂM HỌC: ${sy}`);
    _v55Set(ws,1,0,`PHIẾU NHẬP ĐÁNH GIÁ — ${ghkLabel.toUpperCase()} — LỚP ${cls} — V5.6`);
    _v55Set(ws,2,0,`✅ Giữa kỳ có Môn học + Phẩm chất + Năng lực cốt lõi (NLC/NLĐ). Môn được phép mới có Điểm KTĐK; các cột Mức/Nhận xét còn lại nhập T/H/C hoặc T/Đ/C.`);
    _v55Set(ws,3,0,'STT'); _v55Set(ws,3,1,'Mã học sinh'); _v55Set(ws,3,2,'Họ và tên'); _v55Set(ws,4,1,'(không đổi)'); _v55Set(ws,4,2,'(không đổi)');
    defs.forEach((d,idx)=>{
        const c = 3 + idx;
        const prefix = d.kind === 'subject' ? '[Môn] ' : (d.prefix ? `[${d.prefix}] ` : '');
        _v55Set(ws, 3, c, prefix + d.name);
        const loaiCol = d.loai === 'Mức đạt được' ? (d.kind === 'subject' ? 'Mức (T/H/C)' : 'Mức (T/Đ/C)') : d.loai;
        _v55Set(ws, 4, c, loaiCol);
    });
    const levelCols = new Map(), scoreCols = new Map();
    inputDefs.forEach((d,idx)=>{ const c=3+idx, k=_v527DefKey(d); if(d.loai==='Mức đạt được') levelCols.set(k,c); if(d.loai==='Điểm KTĐK') scoreCols.set(k,c); });
    const commentBank = _v56BuildCommentBankSheet(grade, commentDefs);
    students.forEach((s,si)=>{ const R=5+si, Rn=R+1; _v55Set(ws,R,0,si+1); _v55Set(ws,R,1,s.code||s.id); _v55Set(ws,R,2,s.name); inputDefs.forEach((d,idx)=>{ const c=3+idx, k=_v527DefKey(d); if(d.loai==='Điểm KTĐK') _v55Set(ws,R,c,''); else if(d.kind==='subject'&&scoreCols.has(k)){ const sr=`${_v55ColLetter(scoreCols.get(k))}${Rn}`; ws[XLSX.utils.encode_cell({r:R,c})]={t:'s',f:`IF(${sr}="","",IF(${sr}>=9,"T",IF(${sr}>=5,"H","C")))`}; } else _v55Set(ws,R,c,''); }); commentDefs.forEach((d,idx)=>{ const c=3+inputDefs.length+idx, k=_v527DefKey(d), lr=`${_v55ColLetter(levelCols.get(k))}${Rn}`, sr=scoreCols.has(k)?`${_v55ColLetter(scoreCols.get(k))}${Rn}`:''; ws[XLSX.utils.encode_cell({r:R,c})]={t:'s',f:_v56CommentFormula(lr,sr,commentBank,d,idx*13)}; }); });
    ws['!dataValidation']=[]; const firstDR=6,lastDR=5+students.length; inputDefs.forEach((d,idx)=>{ const c=3+idx,L=_v55ColLetter(c); if(d.loai==='Điểm KTĐK') ws['!dataValidation'].push({sqref:`${L}${firstDR}:${L}${lastDR}`,type:'decimal',operator:'between',formula1:'0',formula2:'10',showErrorMessage:true,errorTitle:'Điểm không hợp lệ',error:'Nhập điểm từ 0 đến 10'}); else ws['!dataValidation'].push({sqref:`${L}${firstDR}:${L}${lastDR}`,type:'list',formula1:d.kind==='subject'?'"T,H,C"':'"T,Đ,C"',showDropDown:true,showErrorMessage:true,errorTitle:'Giá trị không hợp lệ',error:d.kind==='subject'?'Chỉ chọn hoặc nhập T, H hoặc C':'Chỉ chọn hoặc nhập T, Đ hoặc C'}); });
    ws['!freeze']={xSplit:3,ySplit:5,topLeftCell:'D6'};
    const wsG=XLSX.utils.aoa_to_sheet([['HƯỚNG DẪN GIỮA HỌC KỲ — V5.6'],[''],[`Lớp ${cls} | ${ghkLabel} | ${sy}`],['Môn học dùng T/H/C. Phẩm chất, Năng lực chung, Năng lực đặc thù dùng T/Đ/C.'],['Nhận xét tự động luân phiên theo từng học sinh từ sheet NganHangNhanXet.'],[`Ngân hàng hiện có ${commentBank.total} câu áp dụng cho khối ${grade}; không xóa hoặc đổi tên sheet này.`],['Các cột có tiền tố PC/NLC/NLĐ không được đổi tên để import đúng.']]); wsG['!cols']=[{wch:105}];
    const safe=`${mode==='ghk1'?'GiuaHK1':'GiuaHK2'}_${cls}`.replace(/[\/\?*\[\]:]/g,'_').substring(0,31);
    const wb=XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb,ws,safe);
    XLSX.utils.book_append_sheet(wb,commentBank.ws,commentBank.sheetName);
    XLSX.utils.book_append_sheet(wb,wsG,'HuongDan');
    _v56EnableWorkbookCalculation(wb);
    XLSX.writeFile(wb,`FileMau_${ghkLabel.replace(' ','')}_Lop${cls.replace('/','_')}_V56.xlsx`);
    Swal.fire('Đã tạo file mẫu V5.6', `${ghkLabel}: đã gắn ${commentBank.total} câu nhận xét đúng khối và tự luân phiên.`, 'success');
};

window.importGHKExcel = async function(inp) {
    const modeForAccess = window._scoreMode || 'ghk1';
    const accessStatus = await ensureScoreEntryAllowed(syNow(), modeForAccess);
    if (!accessStatus.allowed) { inp.value = ''; return; }
    const f = inp.files[0]; if (!f) return; inp.value = '';
    const reader = new FileReader();
    reader.onload = async e => {
        try {
            const wb = XLSX.read(e.target.result, {type:'array'});
            const sheetName = wb.SheetNames.find(n => /^(Giua|GiuaHK|ghk)/i.test(n.trim())) || wb.SheetNames.find(n => !n.toLowerCase().includes('huongdan') && !n.toLowerCase().includes('nganhangnhanxet')) || wb.SheetNames[0];
            const allRows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], {header:1, defval:''});
            if (allRows.length < 6) { Swal.fire('Lỗi','File không đúng định dạng — cần ít nhất 6 hàng','error'); return; }
            const { colMap, dataStart } = _v55HeaderMap(allRows, 5);
            const mode = window._scoreMode, sy = syNow(), cls = window._scoreCurrentClass, grade = gradeOf(cls), subs = getSubs(grade), traits = _v527GhkTraitDefs();
            const liveAccess = await ensureScoreEntryAllowed(sy, mode); if (!liveAccess.allowed) return;
            const rows = allRows.slice(dataStart).filter(r => !_v55IsBlank(r[1]));
            if (!rows.length) { Swal.fire('Lỗi','Không tìm thấy dữ liệu học sinh từ hàng 6 trở đi','error'); return; }
            const lookup = _v55BuildStudentLookups(cls);
            Swal.fire({title:'Đang import giữa kỳ V5.6...',allowOutsideClick:false,didOpen:()=>Swal.showLoading()});
            const updates = {}; let ok=0, skip=0, blankRows=0, wrongClass=0, notFound=0; const wrongClassList=[], notFoundList=[];
            for (const row of rows) {
                const rawCode = row[1], code = _v55NormCode(rawCode); if(!code){skip++;continue;}
                if(!_v527RowHasAnyGHKInput(row, colMap, subs, traits)){blankRows++;continue;}
                const hit = lookup.inClass.get(code); if(!hit){ const any=lookup.all.get(code); if(any){wrongClass++;wrongClassList.push(String(rawCode).trim());} else {notFound++;notFoundList.push(String(rawCode).trim());} continue; }
                const student = hit.student, existingGhk = await loadGHK(student.id, sy, mode), now = typeof window.serverNow === 'function' ? window.serverNow() : Date.now(); let touched=false;
                const basePath = `hocba/${student.id}/${sy.replace('-','_')}/${mode}`, yp = `hocba/${student.id}/${sy.replace('-','_')}`;
                for(const sub of subs){ const diemText=_v55Cell(row,colMap,sub.name,'Điểm KTĐK'), mucText=_v55Cell(row,colMap,sub.name,'Mức đạt được'), nxText=_v55Cell(row,colMap,sub.name,'Nhận xét'); if(_v55IsBlank(diemText)&&_v55IsBlank(mucText)&&_v55IsBlank(nxText)) continue; const existing=existingGhk[sub.name]||{}; let diemRaw=null; if(ghkHasNumericScore(grade,sub.name)) diemRaw=_v55ParseScore(diemText,`Điểm ${sub.name} của học sinh ${String(rawCode).trim()}`); else if(!_v55IsBlank(diemText)) throw new Error(`${sub.name} không được nhập điểm giữa kỳ ở khối ${grade}.`); const mucRaw=ghkHasNumericScore(grade,sub.name)?_v55SubjectLevelFromScoreOrCell(mucText,diemRaw,existing,`${sub.name} - ${String(rawCode).trim()}`):(mucText?_v55ValidateSubjectLevel(mucText,`${sub.name} - ${String(rawCode).trim()}`):(existing.mucDat||'')); const nxRaw=nxText||(mucRaw?_v55Comment(grade,sub.name,'subject',mucRaw,diemRaw!==null?diemRaw:existing.diem):''); const nextRecord={...existing,mucDat:mucRaw,nhanXet:nxRaw}; if(diemRaw!==null) nextRecord.diem=diemRaw; const audited=buildAuditedScoreRecord(existing,nextRecord,{now,source:'excel',studentId:student.id,studentCode:student.code||student.id,studentName:student.name,className:cls,subjectName:sub.name,schoolYear:sy,mode}); updates[`${basePath}/${sub.name}`]=audited.record; updates[`${yp}/${mode}_subjects/${sub.name}`]=audited.record; Object.assign(updates,makeScoreAuditUpdate(audited.auditEntry)); touched=true; }
                traits.forEach(def => { const mucText=_v55TraitCell(row,colMap,def.prefix,def.name,'Mức đạt được'), nxText=_v55TraitCell(row,colMap,def.prefix,def.name,'Nhận xét'); if(_v55IsBlank(mucText)&&_v55IsBlank(nxText)) return; const prop=_v527TraitProp(def.kind), yprop=_v527TraitYearProp(def.kind), existing=existingGhk[prop]?.[def.name]||{}; const mucRaw=mucText?_v55ValidateTraitLevel(mucText,`${def.name} - ${String(rawCode).trim()}`):(existing.mucDat||''); const nxRaw=nxText||(mucRaw?_v55Comment(grade,def.name,def.kind,mucRaw,''):''); const record={...existing,mucDat:mucRaw,nhanXet:nxRaw}; updates[`${basePath}/${prop}/${def.name}`]=record; updates[`${yp}/${mode}_${yprop}/${def.name}`]=record; touched=true; });
                if(touched){ updates[`${basePath}/__type`]='giua_hk'; updates[`${basePath}/__hk`]=mode; updates[`${basePath}/__at`]=now; updates[`${basePath}/__by`]=`import:${window.currentUser?.email||'?'}`; updates[`${basePath}/__uid`]=window.currentUser?.uid||''; updates[`${yp}/grade`]=grade; updates[`${yp}/schoolYear`]=sy; updates[`${yp}/updatedAt`]=now; ok++; } else skip++;
            }
            if(!Object.keys(updates).length){Swal.close();Swal.fire('Không có dữ liệu được lưu','File trống hoặc không có dòng hợp lệ, hệ thống không ghi đè dữ liệu cũ.','warning');return;}
            await window.update(window.ref(window.db),updates); Swal.close();
            const allStudents=activeStudentValues().filter(s=>_v55SameClass(s,cls)).sort((a,b)=>(a.name||'').split(' ').pop().localeCompare((b.name||'').split(' ').pop(),'vi')); await _renderGHKTable(cls,sy,mode,allStudents);
            Swal.fire({icon:'success',title:'✅ Import giữa kỳ V5.6 hoàn tất!',html:`<div style="text-align:left;font-size:.9rem"><p>✅ <b style="color:#16a34a">${ok}</b> học sinh đúng lớp đã cập nhật</p>${blankRows?`<p>⬜ <b>${blankRows}</b> dòng trống bỏ qua</p>`:''}${wrongClass?`<p>🚫 <b>${wrongClass}</b> mã HS thuộc lớp khác bị từ chối<br><small>${wrongClassList.slice(0,6).join(', ')}</small></p>`:''}${notFound?`<p>⚠️ <b>${notFound}</b> mã không tìm thấy<br><small>${notFoundList.slice(0,6).join(', ')}</small></p>`:''}${skip?`<p>⏭️ <b>${skip}</b> dòng bỏ qua</p>`:''}<p style="margin-top:8px;color:#64748b">Đã hỗ trợ Phẩm chất + Năng lực chung + Năng lực đặc thù.</p></div>`});
        } catch(err){ Swal.close(); Swal.fire('Lỗi import',err.message,'error'); }
    };
    reader.readAsArrayBuffer(f);
};

window.syncScoreAbsence = async function(studentId, sy, hk) {
    const student = window.localData?.students?.[studentId];
    if (!student) return;
    if (typeof window.getAttendanceAbsenceSummary !== 'function') {
        Swal.fire('Lỗi', 'Chưa nạp module tính điểm danh', 'warning');
        return;
    }
    const cls = student.classRoom || student.class || '';
    const sid = student.code || student.id || studentId;
    const att = await window.getAttendanceAbsenceSummary(sy, cls, sid, hk);
    const npEl = document.getElementById('sc-np');
    const nkEl = document.getElementById('sc-nk');
    if (npEl) npEl.value = att.coPhep;
    if (nkEl) nkEl.value = att.khongPhep;
    const toast = Swal.mixin({
        toast: true, position: 'top-end', showConfirmButton: false, timer: 1800
    });
    toast.fire({ icon: 'info', title: `Đã lấy điểm danh ${hk === 'hk1' ? 'HK1' : 'HK2'}: ${att.coPhep} phép, ${att.khongPhep} không phép` });
};

