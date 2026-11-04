import { activeStudentValues, isActiveStudent } from "./studentstatus.js?v=5.26.1";
// ═══════════════════════════════════════════════════════
// subjectscores.js — Nhập Điểm Bộ Môn (V5.6) (Giáo viên bộ môn)
// Role: subject_teacher
// Chỉ nhập điểm 1 môn được phân công, theo khối phụ trách
// DB path: hocba/{studentId}/{year}/hk1 hoặc hk2 (dùng chung với scores.js)
// ═══════════════════════════════════════════════════════

import { getScoreEntryStatus, ensureScoreEntryAllowed, scoreWindowBannerHtml,
         buildAuditedScoreRecord, makeScoreAuditUpdate, isEditedScore,
         scoreAuditSummary, attachScoreChangeHighlighter, escapeHtml }
    from "./scoreaccess.js";
import { bindCommentField, addCommentBankToolbar, getCommentSuggestions }
    from "./commentbank.js?v=5.6.1";

// ── Utils ─────────────────────────────────────────────────────────────────────
function _syNow() {
    if (window._currentSchoolYear) return window._currentSchoolYear;
    const n = new Date(), y = n.getFullYear();
    return n.getMonth() >= 7 ? `${y}-${y+1}` : `${y-1}-${y}`;
}
function _gradeOf(cls) {
    const m = String(cls || '').match(/(?:^|\D)([1-5])(?:\D|$)/); return m ? m[1] : '1';
}
function _getSubs(grade) {
    return window.PRIMARY_SUBJECTS?.[grade] || window.PRIMARY_SUBJECTS?.['1'] || [];
}
function _ghkHasNumericScore(grade, subjectName) {
    if (typeof window.isGHKScoreSubject === 'function') {
        return window.isGHKScoreSubject(grade, subjectName);
    }
    const normalized = String(subjectName || '').normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
    return ['3','4','5'].includes(String(grade))
        && ['tieng viet','toan','ngoai ngu 1','tieng anh'].includes(normalized);
}
function _dbRef(path) { return window.ref(window.db, path); }
function _hkPath(id, sy, hk) { return `hocba/${id}/${sy.replace('-','_')}/${hk}`; }
function _ghkPath(id, sy, ghk) { return `hocba/${id}/${sy.replace('-','_')}/${ghk}`; }

async function _loadHK(id, sy, hk) {
    const s = await window.get(_dbRef(_hkPath(id, sy, hk)));
    return s.val() || {};
}
async function _loadGHK(id, sy, ghk) {
    const s = await window.get(_dbRef(_ghkPath(id, sy, ghk)));
    return s.val() || {};
}

// Kiểm tra subject_teacher có được phép nhập môn này không
function _canTeachSubject(subjectName) {
    const assigned = window.teacherSubject;
    if (!assigned) return false;
    return subjectName === assigned;
}
// Kiểm tra có được nhập khối này không
function _canTeachGrade(grade) {
    const grades = window.teacherGrades;
    if (!grades || !grades.length) return true; // không giới hạn
    return grades.includes(grade);
}

// Màu mức đạt được
const _MUC_COLOR = {
    'T': { color:'#16a34a', bg:'#dcfce7' },
    'H': { color:'#2563eb', bg:'#dbeafe' },
    'Đ': { color:'#2563eb', bg:'#dbeafe' },
    'C': { color:'#dc2626', bg:'#fee2e2' },
    '':  { color:'#94a3b8', bg:'#f1f5f9' },
};

// ══════════════════════════════════════════════════════════════════════════════
// RENDER TRANG NHẬP ĐIỂM BỘ MÔN
// ══════════════════════════════════════════════════════════════════════════════
export async function renderSubjectScores() {
    const subjectName = window.teacherSubject;
    const grades      = window.teacherGrades || [];
    const sy          = _syNow();

    if (!subjectName) {
        document.getElementById('content').innerHTML = `
            <div class="card" style="text-align:center;padding:40px;color:#dc2626">
                <i class="fas fa-exclamation-triangle" style="font-size:2rem;margin-bottom:12px;display:block"></i>
                <strong>Chưa được phân công môn học</strong><br>
                <span style="color:#64748b;font-size:0.88rem">Vui lòng liên hệ Admin để được phân công môn dạy.</span>
            </div>`;
        return;
    }

    // Lấy tất cả lớp thuộc khối được phân công
    const allStudents = activeStudentValues();
    const allClasses  = [...new Set(
        allStudents
            .filter(s => {
                const g = _gradeOf(s.classRoom || s.class);
                return grades.length === 0 || grades.includes(g);
            })
            .map(s => s.classRoom || s.class)
            .filter(Boolean)
    )].sort((a,b) => a.localeCompare(b,'vi'));

    if (!allClasses.length) {
        document.getElementById('content').innerHTML = `
            <div class="card" style="text-align:center;padding:40px;color:#64748b">
                Không có lớp nào thuộc khối phụ trách.
            </div>`;
        return;
    }

    // Khởi tạo lớp hiện tại
    if (!window._subjectScoreClass || !allClasses.includes(window._subjectScoreClass))
        window._subjectScoreClass = allClasses[0];
    if (!window._subjectScoreMode)
        window._subjectScoreMode = 'hk1';

    const mode     = window._subjectScoreMode;
    const isGHK    = mode === 'ghk1' || mode === 'ghk2';
    const hk       = (mode === 'hk2' || mode === 'ghk2') ? 'hk2' : 'hk1';
    const curClass  = window._subjectScoreClass;
    const curGrade  = _gradeOf(curClass);

    // Kiểm tra môn này có trong chương trình của khối không
    const gradeSubjects = _getSubs(curGrade);
    const subjectInGrade = gradeSubjects.find(s => s.name === subjectName);
    const isDiemSub = subjectInGrade?.type === 'diem';
    // GHK có điểm: chỉ khối 3-5 và chỉ Tiếng Việt, Toán, Ngoại ngữ 1/Tiếng Anh
    const ghkHasScore = isGHK && _ghkHasNumericScore(curGrade, subjectName);
    const accessStatus = await getScoreEntryStatus(sy, mode);
    window._subjectScoreAccessStatus = accessStatus;

    document.getElementById('content').innerHTML = `
        <!-- Header -->
        <div style="margin-bottom:14px;display:flex;gap:10px;flex-wrap:wrap;align-items:center">
            <div style="background:linear-gradient(135deg,#1e3a8a,#2563eb);color:white;
                        border-radius:10px;padding:10px 20px;display:flex;align-items:center;gap:14px">
                <div>
                    <div style="font-size:0.7rem;opacity:0.75;letter-spacing:.06em">MÔN PHỤ TRÁCH</div>
                    <div style="font-size:1.2rem;font-weight:800">⭐ ${subjectName}</div>
                </div>
                <div style="width:1px;background:rgba(255,255,255,0.25);height:36px"></div>
                <div>
                    <div style="font-size:0.7rem;opacity:0.75">NĂM HỌC</div>
                    <div style="font-size:0.95rem;font-weight:700">${sy}</div>
                </div>
            </div>
        </div>

        ${scoreWindowBannerHtml(accessStatus)}

        <!-- Toggle HK -->
        <div style="display:flex;background:#f1f5f9;border-radius:8px;padding:3px;gap:2px;
                    margin-bottom:14px;flex-wrap:wrap;width:fit-content">
            ${[
                { key:'hk1',  label:'Cuối HK1' },
                { key:'ghk1', label:'Giữa HK1', badge:'GK' },
                { key:'hk2',  label:'Cuối HK2', badge:'★' },
                { key:'ghk2', label:'Giữa HK2', badge:'GK' },
            ].map(b => `
                <button onclick="window._subjectScoreMode='${b.key}';renderSubjectScores()"
                    class="btn btn-sm ${mode===b.key?'btn-primary':''}"
                    style="${mode!==b.key?'background:transparent;color:#64748b;border:none':''}">
                    ${b.label}
                    ${b.badge?`<span style="font-size:0.68rem;opacity:0.8;margin-left:2px">${b.badge}</span>`:''}
                </button>`).join('')}
        </div>

        <!-- Tab lớp -->
        <div style="background:white;border-radius:10px;padding:10px 14px;margin-bottom:14px;
                    box-shadow:0 1px 3px rgba(0,0,0,0.08);display:flex;gap:8px;flex-wrap:wrap;align-items:center">
            <span style="color:#64748b;font-size:0.85rem;font-weight:600;margin-right:4px">
                <i class="fas fa-layer-group"></i> Lớp:
            </span>
            ${allClasses.map(c => {
                const g = _gradeOf(c);
                const hasSub = _getSubs(g).some(s => s.name === subjectName);
                return `<button
                    id="sstab-${c.replace('/','_')}"
                    onclick="window._subjectScoreClass='${c}';renderSubjectScores()"
                    class="btn btn-sm ${c===curClass?'btn-primary':'btn-outline'}"
                    style="font-size:0.82rem;padding:5px 14px;${!hasSub?'opacity:0.45;cursor:not-allowed':''}"
                    ${!hasSub?'disabled title="Môn này không có trong chương trình khối này"':''}
                >${c}</button>`;
            }).join('')}
        </div>

        <!-- Nội dung bảng -->
        <div id="subject-score-content">
            <div style="text-align:center;padding:30px"><i class="fas fa-spinner fa-spin"></i></div>
        </div>`;

    // Expose hàm ra window để gọi từ HTML
    window.renderSubjectScores = renderSubjectScores;

    // Kiểm tra môn có trong khối này không
    if (!subjectInGrade) {
        document.getElementById('subject-score-content').innerHTML = `
            <div class="card" style="text-align:center;padding:30px;color:#94a3b8">
                <i class="fas fa-info-circle" style="font-size:1.5rem;margin-bottom:8px;display:block"></i>
                Môn <strong>${subjectName}</strong> không có trong chương trình khối ${curGrade}.
            </div>`;
        return;
    }

    await _renderSubjectTable(curClass, sy, mode, subjectName, isDiemSub, ghkHasScore);
}

// ── Render bảng điểm bộ môn ──────────────────────────────────────────────────
async function _renderSubjectTable(cls, sy, mode, subjectName, isDiemSub, ghkHasScore) {
    const isGHK = mode === 'ghk1' || mode === 'ghk2';
    const hk    = (mode === 'hk2' || mode === 'ghk2') ? 'hk2' : 'hk1';
    const grade = _gradeOf(cls);
    const accessStatus = await getScoreEntryStatus(sy, mode);
    const canEdit = accessStatus.allowed;

    const students = activeStudentValues()
        .filter(s => (s.classRoom||s.class||'') === cls)
        .sort((a,b) => (a.name||'').split(' ').pop().localeCompare((b.name||'').split(' ').pop(),'vi'));

    if (!students.length) {
        document.getElementById('subject-score-content').innerHTML =
            `<div class="card" style="text-align:center;color:#94a3b8;padding:30px">
                Không có học sinh trong lớp ${cls}
             </div>`;
        return;
    }

    // Load dữ liệu song song
    const dataMap = {};
    await Promise.all(students.map(async s => {
        dataMap[s.id] = isGHK
            ? await _loadGHK(s.id, sy, mode)
            : await _loadHK(s.id, sy, hk);
    }));

    // Đếm đã nhập
    const nhapCount = students.filter(s => dataMap[s.id]?.[subjectName]?.mucDat).length;

    // Sort
    window._subjectSort = window._subjectSort || 'name_az';
    const sort = window._subjectSort;
    const lastName = s => (s.name||'').split(' ').pop();
    if      (sort === 'name_az')  students.sort((a,b) => lastName(a).localeCompare(lastName(b),'vi'));
    else if (sort === 'name_za')  students.sort((a,b) => lastName(b).localeCompare(lastName(a),'vi'));
    else if (sort === 'avg_desc') students.sort((a,b) => (parseFloat(dataMap[b.id]?.[subjectName]?.diem)||0) - (parseFloat(dataMap[a.id]?.[subjectName]?.diem)||0));
    else if (sort === 'avg_asc')  students.sort((a,b) => (parseFloat(dataMap[a.id]?.[subjectName]?.diem)||0) - (parseFloat(dataMap[b.id]?.[subjectName]?.diem)||0));

    const modeLabel = { hk1:'Cuối HK1', ghk1:'Giữa HK1', hk2:'Cuối HK2', ghk2:'Giữa HK2' }[mode] || mode;

    // Nút file mẫu + upload + xuất Excel
    const exportBtn = `
        <button class="btn btn-outline btn-sm"
            onclick="downloadSubjectScoreTemplate('${cls}','${_syNow()}','${mode}','${subjectName}',${isDiemSub},${ghkHasScore})">
            <i class="fas fa-download"></i> File mẫu
        </button>
        <label class="btn btn-primary btn-sm"
            style="cursor:${canEdit?'pointer':'not-allowed'};margin:0;${canEdit?'':'opacity:0.45'}"
            title="${canEdit?'Upload điểm bằng Excel':escapeHtml(accessStatus.message)}">
            <i class="fas fa-upload"></i> Upload điểm
            <input type="file" accept=".xlsx,.xls"
                   onchange="importSubjectScoreExcel(this)" style="display:none" ${canEdit?'':'disabled'}>
        </label>
        <button class="btn btn-success btn-sm"
            onclick="exportSubjectScoreExcel('${cls}','${_syNow()}','${mode}','${subjectName}')">
            <i class="fas fa-file-excel"></i> Xuất báo cáo
        </button>`;

    document.getElementById('subject-score-content').innerHTML = `
        <!-- Sort bar + thống kê -->
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;flex-wrap:wrap">
            <div style="background:#f0fdf4;border-radius:8px;padding:7px 14px;font-size:0.82rem;color:#166534;font-weight:600">
                ✅ Đã nhập: ${nhapCount}/${students.length}
            </div>
            <span style="font-size:0.82rem;color:#64748b;font-weight:600;margin-left:4px">Sắp xếp:</span>
            ${[
                { v:'name_az', label:'Tên A→Z' },
                { v:'name_za', label:'Tên Z→A' },
                { v:'avg_desc', label:'Điểm ↓' },
                { v:'avg_asc',  label:'Điểm ↑' },
            ].map(o => `<button onclick="window._subjectSort='${o.v}';_reRenderSubjectTable()"
                style="padding:4px 11px;border-radius:16px;border:1.5px solid ${sort===o.v?'#2563eb':'#e2e8f0'};
                       background:${sort===o.v?'#2563eb':'white'};color:${sort===o.v?'white':'#475569'};
                       font-size:0.78rem;font-weight:600;cursor:pointer">${o.label}</button>`).join('')}
            <div style="margin-left:auto">${exportBtn}</div>
        </div>

        <div class="table-wrapper">
            <table>
                <thead>
                    <tr>
                        <th style="width:36px;text-align:center">STT</th>
                        <th style="min-width:160px">Họ và tên</th>
                        <th style="text-align:center;width:120px">Mức đạt được</th>
                        ${(isDiemSub && (!isGHK || ghkHasScore)) ? `
                        <th style="text-align:center;width:100px">Điểm KTĐK</th>` : ''}
                        <th>Nhận xét</th>
                        <th style="text-align:center;width:70px">Nhập</th>
                    </tr>
                </thead>
                <tbody>
                    ${students.map((s, i) => {
                        const d     = dataMap[s.id]?.[subjectName] || {};
                        const muc   = d.mucDat || '';
                        const diem  = parseFloat(d.diem) || 0;
                        const mc    = _MUC_COLOR[muc] || _MUC_COLOR[''];
                        const hasData = !!muc;
                        return `<tr style="${!hasData?'opacity:0.7':''}">
                            <td style="text-align:center;color:#94a3b8;font-size:0.85rem">${i+1}</td>
                            <td>
                                <div style="font-weight:600;color:#1e293b">${s.name}</div>
                                <div style="font-size:0.75rem;color:#94a3b8">${s.code||s.id}</div>
                            </td>
                            <td style="text-align:center;padding:6px">
                                <span style="padding:3px 12px;border-radius:12px;font-size:0.82rem;
                                    font-weight:700;background:${mc.bg};color:${mc.color}">
                                    ${muc || '—'}
                                </span>
                            </td>
                            ${(isDiemSub && (!isGHK || ghkHasScore)) ? `
                            <td style="text-align:center;font-weight:700;font-size:1.05rem;
                                color:${isEditedScore(d)?'#dc2626':diem>0?(diem>=5?'#1d4ed8':'#dc2626'):'#94a3b8'}"
                                title="${escapeHtml(scoreAuditSummary(d))}">
                                <div>${diem || '—'}${isEditedScore(d)?'<span style="font-size:0.65rem;margin-left:3px">✎</span>':''}</div>
                                ${isEditedScore(d) && scoreAuditSummary(d) ? `<div style="font-size:0.62rem;font-weight:500;color:#dc2626;line-height:1.2;margin-top:2px">${escapeHtml(scoreAuditSummary(d))}</div>` : ''}
                            </td>` : ''}
                            <td style="color:#64748b;font-size:0.83rem;padding:8px 12px">
                                ${d.nhanXet || '<span style="color:#e2e8f0;font-style:italic">—</span>'}
                            </td>
                            <td style="text-align:center">
                                <button class="btn btn-sm"
                                    style="background:${canEdit?(hasData?'#2563eb':'#a78bfa'):'#e2e8f0'};color:${canEdit?'white':'#94a3b8'};border:none;padding:5px 10px;${canEdit?'':'cursor:not-allowed'}"
                                    onclick="${canEdit?`openSubjectScoreModal('${s.id}','${_syNow()}','${mode}','${subjectName}')`:''}"
                                    title="${canEdit?(hasData?'Chỉnh sửa':'Nhập điểm'):escapeHtml(accessStatus.message)}"
                                    ${canEdit?'':'disabled'}>
                                    <i class="fas fa-${canEdit?(hasData?'edit':'plus'):'lock'}"></i>
                                </button>
                            </td>
                        </tr>`;
                    }).join('')}
                </tbody>
            </table>
        </div>`;

    // Expose re-render
    window._reRenderSubjectTable = () => _renderSubjectTable(cls, sy, mode, subjectName, isDiemSub, ghkHasScore);
    window._currentSubjectTableArgs = { cls, sy, mode, subjectName, isDiemSub, ghkHasScore };
}

// ── Modal nhập điểm bộ môn ────────────────────────────────────────────────────
window.openSubjectScoreModal = async function(studentId, sy, mode, subjectName) {
    const accessStatus = await ensureScoreEntryAllowed(sy, mode);
    if (!accessStatus.allowed) return;
    const student    = window.localData.students[studentId];
    if (!student) return;

    const grade      = _gradeOf(student.classRoom || student.class);
    const isGHK      = mode === 'ghk1' || mode === 'ghk2';
    const hk         = (mode === 'hk2' || mode === 'ghk2') ? 'hk2' : 'hk1';
    const gradeSubjects = _getSubs(grade);
    const subjectDef    = gradeSubjects.find(s => s.name === subjectName);
    const isDiemSub     = subjectDef?.type === 'diem';
    const ghkHasScore   = isGHK && _ghkHasNumericScore(grade, subjectName);
    const showScore     = isDiemSub && (!isGHK || ghkHasScore);

    const existing = isGHK
        ? await _loadGHK(studentId, sy, mode)
        : await _loadHK(studentId, sy, hk);
    const d = existing[subjectName] || {};

    const modeLabel = { hk1:'Cuối HK1', ghk1:'Giữa HK1', hk2:'Cuối HK2', ghk2:'Giữa HK2' }[mode];
    const mucOpts   = (subjectDef?.type === 'diem'
        ? (window.MUC_DANH_GIA_MON || ['T','H','C'])
        : (window.MUC_DANH_GIA_MON || ['T','H','C'])
    ).map(m => `<option value="${m}">${m === 'T' ? 'T — Tốt' : m === 'H' ? 'H — Hoàn thành' : 'C — Cần cố gắng'}</option>`).join('');

    Swal.fire({
        title: '',
        html: `
        <div style="text-align:left;font-size:0.9rem">
            <!-- Header -->
            <div style="background:linear-gradient(135deg,#1e3a8a,#2563eb);color:white;
                        border-radius:8px;padding:12px 16px;margin-bottom:16px;
                        display:flex;justify-content:space-between;align-items:center">
                <div>
                    <div style="font-size:1rem;font-weight:700">${student.name}</div>
                    <div style="opacity:0.85;font-size:0.82rem">
                        Lớp ${student.classRoom||student.class} — ${modeLabel} — ${sy}
                    </div>
                </div>
                <div style="background:rgba(255,255,255,0.18);border-radius:8px;
                            padding:6px 14px;text-align:center;flex-shrink:0">
                    <div style="font-size:0.72rem;opacity:0.85;margin-bottom:2px">MÔN HỌC</div>
                    <div style="font-weight:800;font-size:1rem">⭐ ${subjectName}</div>
                </div>
            </div>

            <!-- Form nhập -->
            <div style="display:grid;grid-template-columns:${showScore?'1fr 1fr':'1fr'};gap:14px;margin-bottom:14px">
                <div>
                    <label style="font-size:0.8rem;font-weight:600;color:#475569;display:block;margin-bottom:6px">
                        Mức đạt được *
                    </label>
                    <select id="ssm-muc" class="form-control" style="font-size:1rem;font-weight:700">
                        <option value="">-- Chọn mức --</option>
                        ${mucOpts}
                    </select>
                </div>
                ${showScore ? `
                <div>
                    <label style="font-size:0.8rem;font-weight:600;color:#475569;display:block;margin-bottom:6px">
                        Điểm KTĐK (0–10)
                    </label>
                    <input type="number" id="ssm-diem" class="form-control"
                        min="0" max="10" step="0.1" placeholder="VD: 8.5"
                        style="font-size:1.2rem;font-weight:700;text-align:center;color:${isEditedScore(d)?'#dc2626':'#1d4ed8'}"
                        title="${escapeHtml(scoreAuditSummary(d))}"
                        oninput="
                            const v=parseFloat(this.value);
                            this.style.color=v>=5?'#1d4ed8':'#dc2626';
                            const m=document.getElementById('ssm-muc');
                            if(m&&!isNaN(v)&&v>=0&&v<=10){
                                if(v>=9) m.value='T';
                                else if(v>=5) m.value='H';
                                else m.value='C';
                                m.style.fontWeight='700';
                                m.style.color=v>=9?'#16a34a':v>=5?'#2563eb':'#dc2626';
                            }
                        ">
                    ${scoreAuditSummary(d) ? `<div style="font-size:0.72rem;color:${isEditedScore(d)?'#dc2626':'#64748b'};margin-top:5px">${escapeHtml(scoreAuditSummary(d))}</div>` : ''}
                </div>` : ''}
            </div>
            <div>
                <label style="font-size:0.8rem;font-weight:600;color:#475569;display:block;margin-bottom:6px">
                    Nhận xét của giáo viên
                </label>
                <textarea id="ssm-nx" class="form-control" rows="3"
                    placeholder="Nhập nhận xét..."
                    style="resize:vertical;font-size:0.9rem">${d.nhanXet||''}</textarea>
            </div>

            ${isGHK ? `
            <div style="margin-top:12px;background:#ede9fe;border-radius:6px;padding:8px 12px;
                        font-size:0.8rem;color:#5b21b6">
                ℹ️ Đánh giá Giữa HK — không dùng để tính điểm trung bình
            </div>` : hk==='hk2' ? `
            <div style="margin-top:12px;background:#fef3c7;border-radius:6px;padding:8px 12px;
                        font-size:0.8rem;color:#92400e">
                ★ Cuối HK2 — dữ liệu dùng để tổng hợp kết quả giáo dục cuối năm
            </div>` : ''}
        </div>`,

        width: '520px',
        showCancelButton: true,
        confirmButtonText: '<i class="fas fa-save"></i> Lưu',
        cancelButtonText: 'Đóng',
        confirmButtonColor: '#1e3a8a',

        didOpen: () => {
            const mucEl  = document.getElementById('ssm-muc');
            const diemEl = document.getElementById('ssm-diem');
            const nxEl   = document.getElementById('ssm-nx');
            if (mucEl  && d.mucDat)  {
                mucEl.value = d.mucDat;
                mucEl.style.fontWeight = '700';
                mucEl.style.color = d.mucDat==='T'?'#16a34a':d.mucDat==='H'?'#2563eb':'#dc2626';
            }
            if (diemEl && d.diem !== undefined && d.diem !== '')    {
                diemEl.value = d.diem;
                diemEl.style.color = isEditedScore(d) ? '#dc2626' : parseFloat(d.diem) >= 5 ? '#1d4ed8' : '#dc2626';
            }
            attachScoreChangeHighlighter(diemEl, d.diem, d);
            if (nxEl   && d.nhanXet) { nxEl.value = d.nhanXet; }

            // Nếu có điểm mà chưa có mức → tự điền mức
            if (diemEl && mucEl && d.diem !== undefined && d.diem !== '' && !d.mucDat) {
                const v = parseFloat(d.diem);
                if (!isNaN(v)) {
                    mucEl.value = v >= 9 ? 'T' : v >= 5 ? 'H' : 'C';
                    mucEl.style.fontWeight = '700';
                    mucEl.style.color = v>=9?'#16a34a':v>=5?'#2563eb':'#dc2626';
                }
            }

            bindCommentField({
                grade, kind:'subject', name:subjectName, seed:studentId,
                levelId:'ssm-muc',
                scoreId:showScore ? 'ssm-diem' : '',
                commentId:'ssm-nx',
            });
            addCommentBankToolbar(Swal.getHtmlContainer() || document);
        },

        preConfirm: async () => {
            const liveAccess = await ensureScoreEntryAllowed(sy, mode);
            if (!liveAccess.allowed) return false;

            const muc      = document.getElementById('ssm-muc')?.value || '';
            const diemText = (document.getElementById('ssm-diem')?.value || '').trim();
            const diem     = diemText === '' ? null : Number(diemText);
            const nx       = document.getElementById('ssm-nx')?.value || '';

            if (!muc) {
                Swal.showValidationMessage('Vui lòng chọn Mức đạt được');
                return false;
            }
            if (showScore && diem !== null && (!Number.isFinite(diem) || diem < 0 || diem > 10)) {
                Swal.showValidationMessage('Điểm phải nằm trong khoảng 0 đến 10');
                return false;
            }

            const now = typeof window.serverNow === 'function' ? window.serverNow() : Date.now();
            const nextRecord = {
                mucDat:  muc,
                nhanXet: nx,
                ...(showScore && diem !== null ? { diem } : {}),
            };
            const audited = buildAuditedScoreRecord(d, nextRecord, {
                now,
                source:'manual',
                studentId,
                studentCode:student.code || student.id,
                studentName:student.name,
                className:student.classRoom || student.class || '',
                subjectName,
                schoolYear:sy,
                mode,
            });
            const subData = audited.record;

            const basePath = isGHK ? _ghkPath(studentId, sy, mode) : _hkPath(studentId, sy, hk);
            const yearPath = `hocba/${studentId}/${sy.replace('-','_')}`;
            const rootUpdates = {
                [`${basePath}/${subjectName}`]: subData,
                [`${yearPath}/grade`]: _gradeOf(student.classRoom||student.class),
                [`${yearPath}/schoolYear`]: sy,
                [`${yearPath}/updatedAt`]: now,
                ...makeScoreAuditUpdate(audited.auditEntry),
            };
            if (!isGHK) {
                rootUpdates[`${yearPath}/${hk}_subjects/${subjectName}`] = subData;
                if (hk === 'hk2') rootUpdates[`${yearPath}/subjects/${subjectName}`] = subData;
            } else {
                rootUpdates[`${yearPath}/${mode}_subjects/${subjectName}`] = subData;
            }
            await window.update(window.ref(window.db), rootUpdates);

            return { ok: true, muc, diem: diem ?? '', edited: audited.isEdited };
        }
    }).then(res => {
        if (!res.isConfirmed) return;
        Swal.fire({
            icon: 'success',
            title: '✅ Đã lưu!',
            html: `<small>Môn <b>${subjectName}</b> — ${res.value?.muc}${res.value?.diem !== '' && res.value?.diem !== null && res.value?.diem !== undefined ? ` — Điểm: <b>${res.value.diem}</b>` : ''}</small>`,
            timer: 1800, showConfirmButton: false,
        });
        // Reload bảng
        const args = window._currentSubjectTableArgs;
        if (args) _renderSubjectTable(args.cls, args.sy, args.mode, args.subjectName, args.isDiemSub, args.ghkHasScore);
    });
};

// ── Xuất Excel điểm bộ môn ───────────────────────────────────────────────────
window.exportSubjectScoreExcel = async function(cls, sy, mode, subjectName) {
    const isGHK = mode === 'ghk1' || mode === 'ghk2';
    const hk    = (mode === 'hk2' || mode === 'ghk2') ? 'hk2' : 'hk1';
    const modeLabel = { hk1:'CuoiHK1', ghk1:'GiuaHK1', hk2:'CuoiHK2', ghk2:'GiuaHK2' }[mode];

    const students = activeStudentValues()
        .filter(s => (s.classRoom||s.class||'') === cls)
        .sort((a,b) => (a.name||'').split(' ').pop().localeCompare((b.name||'').split(' ').pop(),'vi'));

    Swal.fire({ title:'Đang xuất...', allowOutsideClick:false, didOpen:()=>Swal.showLoading() });

    const rows = await Promise.all(students.map(async (s, i) => {
        const data = isGHK ? await _loadGHK(s.id, sy, mode) : await _loadHK(s.id, sy, hk);
        const d    = data[subjectName] || {};
        const row  = {
            'STT': i+1,
            'Mã HS': s.code||s.id,
            'Họ và tên': s.name,
            'Lớp': cls,
            'Mức đạt được': d.mucDat  || '',
            'Điểm KTĐK':   d.diem     || '',
            'Nhận xét':    d.nhanXet  || '',
        };
        return row;
    }));

    const safeName = `${modeLabel}_${subjectName}_${cls}`.replace(/[\/\\?*\[\]:]/g,'_').substring(0,31);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), safeName);
    XLSX.writeFile(wb, `Diem_${subjectName.replace(/\s/g,'_')}_${modeLabel}_Lop${cls.replace('/','_')}_${sy.replace('-','_')}.xlsx`);
    Swal.fire({ icon:'success', title:'Xuất thành công!', timer:1500, showConfirmButton:false });
};


// ══════════════════════════════════════════════════════════════════════════════
// downloadSubjectScoreTemplate — File mẫu Excel cho Giáo viên Bộ môn
// 4 hàng header (gọn hơn vì chỉ 1 môn):
//   R0: Thông tin  R1: Tiêu đề  R2: Ghi chú  R3: Header cột  R4+: Dữ liệu
// Cuối HK + môn diem: có cột Điểm KTĐK
// Giữa HK khối 3-5: chỉ Tiếng Việt, Toán, Ngoại ngữ 1/Tiếng Anh có cột Điểm KTĐK
// Còn lại: chỉ Mức + Nhận xét
// ══════════════════════════════════════════════════════════════════════════════
window.downloadSubjectScoreTemplate = function(cls, sy, mode, subjectName, isDiemSub, ghkHasScore) {
    cls         = cls         || window._subjectScoreClass;
    sy          = sy          || _syNow();
    mode        = mode        || window._subjectScoreMode || 'hk1';
    subjectName = subjectName || window.teacherSubject;
    const grade = _gradeOf(cls);
    if (isDiemSub === undefined || isDiemSub === null) {
        isDiemSub = _getSubs(grade).find(s=>s.name===subjectName)?.type === 'diem';
    }
    const isGHK     = mode==='ghk1'||mode==='ghk2';
    if (ghkHasScore === undefined || ghkHasScore === null) {
        ghkHasScore = isGHK && _ghkHasNumericScore(grade, subjectName);
    }
    const showScore = isDiemSub && (!isGHK || ghkHasScore);
    const modeLabel = {hk1:'Cuối HK1',ghk1:'Giữa HK1',hk2:'Cuối HK2',ghk2:'Giữa HK2'}[mode]||mode;

    const students = activeStudentValues()
        .filter(s=>(s.classRoom||s.class||'')===cls)
        .sort((a,b)=>(a.name||'').split(' ').pop().localeCompare((b.name||'').split(' ').pop(),'vi'));

    if (!students.length) { Swal.fire('Thông báo','Không có học sinh trong lớp này','warning'); return; }

    // Cột: STT | Mã HS | Họ tên | Mức | [Điểm] | Nhận xét
    const N = showScore ? 6 : 5;
    const ws = {};
    ws['!ref']  = XLSX.utils.encode_range({s:{r:0,c:0},e:{r:4+students.length+2,c:N-1}});
    ws['!rows'] = [{hpt:22},{hpt:26},{hpt:16},{hpt:22}];
    ws['!cols'] = [
        {wch:5},{wch:14},{wch:28},{wch:16},
        ...(showScore?[{wch:13}]:[]),
        {wch:52},
    ];
    ws['!merges'] = [
        {s:{r:0,c:0},e:{r:0,c:N-1}},
        {s:{r:1,c:0},e:{r:1,c:N-1}},
        {s:{r:2,c:0},e:{r:2,c:N-1}},
    ];

    const wc = (r,c,v) => {
        const addr=XLSX.utils.encode_cell({r,c});
        ws[addr]=(v===''||v===null||v===undefined)?{v:'',t:'s'}:typeof v==='number'?{v,t:'n'}:{v:String(v),t:'s'};
    };
    const col2L = c => {let s='';c++;while(c>0){s=String.fromCharCode(((c-1)%26)+65)+s;c=Math.floor((c-1)/26);}return s;};

    const NX_T='Hoàn thành xuất sắc, nắm chắc kiến thức và kỹ năng';
    const NX_H='Hoàn thành các yêu cầu học tập của môn học';
    const NX_C='Cần cố gắng hơn, chú ý rèn luyện thêm';

    wc(0,0,`🏫 FMA Nam Hòa - Lớp Phổ Cập TH. Hùng Vương, 158-160 Đất Thánh, Kp 8, P. Tân Hòa | LỚP: ${cls} | NĂM HỌC: ${sy}`);
    wc(1,0,`PHIẾU NHẬP ĐIỂM BỘ MÔN — ${subjectName.toUpperCase()} — ${modeLabel.toUpperCase()} — LỚP ${cls}`);
    wc(2,0,showScore
        ?`⚠ Nhập ĐIỂM (0–10) → Mức tự điền (≥7→T | ≥5→H | <5→C). Nhận xét tự điền. KHÔNG sửa 3 cột đầu.`
        :`⚠ Nhập MỨC ĐẠT ĐƯỢC (T/H/C). Nhận xét tự điền. KHÔNG sửa 3 cột đầu.`);

    // Header cột R3
    wc(3,0,'STT'); wc(3,1,'Mã học sinh'); wc(3,2,'Họ và tên'); wc(3,3,'Mức đạt được');
    if (showScore) wc(3,4,'Điểm KTĐK');
    wc(3,showScore?5:4,'Nhận xét');

    const COL_MUC =3, COL_DIEM=showScore?4:-1, COL_NX=showScore?5:4;
    const mucL=col2L(COL_MUC), diemL=showScore?col2L(COL_DIEM):null;

    students.forEach((s,si)=>{
        const R=4+si, Rn=R+1;
        ws['!rows'].push({hpt:20});
        wc(R,0,si+1); wc(R,1,s.code||s.id); wc(R,2,s.name);
        if (showScore) {
            ws[XLSX.utils.encode_cell({r:R,c:COL_MUC})]={t:'s',f:`IF(${diemL}${Rn}="","",IF(${diemL}${Rn}>=9,"T",IF(${diemL}${Rn}>=5,"H","C")))`};
            wc(R,COL_DIEM,'');
        } else {
            wc(R,COL_MUC,'');
        }
        ws[XLSX.utils.encode_cell({r:R,c:COL_NX})]={t:'s',f:`IF(${mucL}${Rn}="","",IF(${mucL}${Rn}="T","${NX_T}",IF(${mucL}${Rn}="H","${NX_H}","${NX_C}")))`};
    });

    const fDR=5, lDR=4+students.length;
    ws['!dataValidation']=[{
        sqref:`${mucL}${fDR}:${mucL}${lDR}`,
        type:'list',formula1:'"T,H,C"',showDropDown:false,
        showErrorMessage:true,errorTitle:'Giá trị không hợp lệ',error:'Chỉ nhập: T, H hoặc C',
    }];
    if (showScore) ws['!dataValidation'].push({
        sqref:`${diemL}${fDR}:${diemL}${lDR}`,
        type:'decimal',operator:'between',formula1:'0',formula2:'10',
        showErrorMessage:true,errorTitle:'Điểm không hợp lệ',error:'Nhập điểm từ 0 đến 10',
    });
    ws['!freeze']={xSplit:3,ySplit:4,topLeftCell:'D5'};

    const wsG=XLSX.utils.aoa_to_sheet([
        [`HƯỚNG DẪN — MÔN: ${subjectName}`],[''],
        [`Lớp: ${cls}   |   Kỳ: ${modeLabel}   |   Năm học: ${sy}`],[''],
        ['CẤU TRÚC FILE (4 HÀNG ĐẦU — KHÔNG CHỈNH SỬA):'],
        ['  Hàng 1-3: Thông tin, tiêu đề, ghi chú'],
        ['  Hàng 4: Header cột'],['  Hàng 5+: DỮ LIỆU HỌC SINH ✏️'],[''],
        showScore?['➜ Nhập SỐ ĐIỂM (0–10) → Mức + Nhận xét tự điền']:['➜ Nhập MỨC ĐẠT ĐƯỢC (T/H/C) → Nhận xét tự điền'],
        ['MỨC: T = Tốt  |  H = Hoàn thành  |  C = Cần cố gắng'],
        isGHK?['⚠ GIỮA HK — không dùng để tính điểm trung bình']:[],
    ]);
    wsG['!cols']=[{wch:70}];

    const sn=`${modeLabel.replace(' ','')}_${subjectName}_${cls}`.replace(/[\/\\\?\*\[\]:]/g,'_').substring(0,31);
    const wbf=XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wbf,ws,sn);
    XLSX.utils.book_append_sheet(wbf,wsG,'HuongDan');
    XLSX.writeFile(wbf,`FileMau_${subjectName.replace(/\s/g,'_')}_${modeLabel.replace(' ','')}_Lop${cls.replace('/','_')}.xlsx`);

    Swal.fire({
        icon:'success', title:'✅ Đã tải file mẫu bộ môn!',
        html:`<div style="text-align:left;font-size:0.88rem">
            <p>📁 <b>FileMau_${subjectName.replace(/\s/g,'_')}_${modeLabel.replace(' ','')}_Lop${cls.replace('/','_')}.xlsx</b></p>
            <div style="margin-top:10px;background:#dbeafe;padding:10px 12px;border-radius:8px">
                <p>⭐ Môn: <b>${subjectName}</b> — <b>${modeLabel}</b> — Lớp <b>${cls}</b></p>
                <p style="margin-top:6px">${showScore?'➜ Nhập <b>Điểm KTĐK</b> → Mức + Nhận xét tự điền':'➜ Nhập <b>Mức đạt được</b> (T/H/C) → Nhận xét tự điền'}</p>
                ${isGHK?`<p style="margin-top:6px;color:#7c3aed;font-size:0.8rem">ℹ️ Giữa HK — không dùng để tính điểm trung bình</p>`:''}
            </div>
            <p style="margin-top:10px;color:#64748b;font-size:0.8rem">✏️ Nhập từ hàng 5 → <b>Upload lên hệ thống</b></p>
        </div>`,
        confirmButtonText:'OK',
    });
};


// ══════════════════════════════════════════════════════════════════════════════
// importSubjectScoreExcel — đọc file mẫu bộ môn & upload Firebase
// Chỉ ghi đúng môn được phân công (update 1 key, không đè các môn khác)
// ══════════════════════════════════════════════════════════════════════════════
window.importSubjectScoreExcel = async function(inp) {
    const modeForAccess = window._subjectScoreMode || 'hk1';
    const accessStatus = await ensureScoreEntryAllowed(_syNow(), modeForAccess);
    if (!accessStatus.allowed) { inp.value=''; return; }
    const f=inp.files[0]; if(!f) return; inp.value='';
    const reader=new FileReader();
    reader.onload=async e=>{
        try {
            const wb=XLSX.read(e.target.result,{type:'array'});
            const sheetName=wb.SheetNames.find(n=>!n.toLowerCase().includes('huongdan'))||wb.SheetNames[0];
            const sh=wb.Sheets[sheetName];
            const allRows=XLSX.utils.sheet_to_json(sh,{header:1,defval:''});

            if(allRows.length<5){Swal.fire('Lỗi','File không đúng định dạng — cần ít nhất 5 hàng','error');return;}

            // R3 = header cột
            const hdr=allRows[3]||[];
            const findCol=label=>hdr.findIndex(h=>(h||'').toString().trim().toLowerCase()===label.toLowerCase());
            const COL_MA  =findCol('mã học sinh');
            const COL_MUC =findCol('mức đạt được');
            const COL_DIEM=findCol('điểm ktđk');
            const COL_NX  =findCol('nhận xét');

            if(COL_MA<0||COL_MUC<0){
                Swal.fire('Lỗi','Không tìm thấy cột "Mã học sinh" hoặc "Mức đạt được"','error');return;
            }

            const dataRows=allRows.slice(4).filter(r=>{
                const v=(r[COL_MA]||'').toString().trim();
                return v&&v!=='Mã học sinh'&&v!=='(không đổi)';
            });
            if(!dataRows.length){Swal.fire('Lỗi','Không tìm thấy dữ liệu học sinh (từ hàng 5 trở đi)','error');return;}

            const mode        =window._subjectScoreMode||'hk1';
            const cls         =window._subjectScoreClass;
            const sy          =_syNow();
            const liveAccess  =await ensureScoreEntryAllowed(sy, mode);
            if(!liveAccess.allowed) return;
            const subjectName =window.teacherSubject;
            const grade       =_gradeOf(cls);
            const isGHK       =mode==='ghk1'||mode==='ghk2';
            const hk          =(mode==='hk2'||mode==='ghk2')?'hk2':'hk1';
            const isDiemSub   =_getSubs(grade).find(s=>s.name===subjectName)?.type==='diem';
            const ghkHasScore =isGHK&&_ghkHasNumericScore(grade,subjectName);
            const showScore   =isDiemSub&&(!isGHK||ghkHasScore);
            const modeLabel   ={hk1:'Cuối HK1',ghk1:'Giữa HK1',hk2:'Cuối HK2',ghk2:'Giữa HK2'}[mode];

            Swal.fire({title:`Đang import ${subjectName} — ${modeLabel}...`,allowOutsideClick:false,didOpen:()=>Swal.showLoading()});

            const byCode={};
            activeStudentValues().forEach(s=>{
                if(s.code) byCode[s.code.trim()]=s;
                if(s.id)   byCode[s.id.trim()]=s;
            });

            let ok=0,skip=0,notFound=0;
            const notFoundList=[],updates={};

            for (const row of dataRows) {
                const code=(row[COL_MA]||'').toString().trim();
                if(!code){skip++;continue;}
                const student=byCode[code];
                if(!student){notFound++;notFoundList.push(code);continue;}

                let mucRaw =(row[COL_MUC]??'').toString().trim().toUpperCase();
                let nxRaw  =COL_NX>=0?(row[COL_NX]??'').toString().trim():'';
                const diemText=(showScore&&COL_DIEM>=0)?(row[COL_DIEM]??'').toString().trim():'';
                const diemRaw=diemText===''?null:Number(diemText);
                if(diemRaw!==null&&(!Number.isFinite(diemRaw)||diemRaw<0||diemRaw>10)) {
                    throw new Error(`Điểm của học sinh ${code} phải từ 0 đến 10`);
                }

                if(!mucRaw&&diemRaw!==null) mucRaw=diemRaw>=9?'T':diemRaw>=5?'H':'C';
                if(!nxRaw&&mucRaw) nxRaw=mucRaw==='T'?'Hoàn thành xuất sắc, nắm chắc kiến thức và kỹ năng':mucRaw==='H'?'Hoàn thành các yêu cầu học tập của môn học':'Cần cố gắng hơn, chú ý rèn luyện thêm';

                const existingPeriod = isGHK
                    ? await _loadGHK(student.id, sy, mode)
                    : await _loadHK(student.id, sy, hk);
                const now = typeof window.serverNow === 'function' ? window.serverNow() : Date.now();
                const nextRecord={
                    mucDat: mucRaw, nhanXet: nxRaw,
                    ...(showScore&&diemRaw!==null?{diem:diemRaw}:{}),
                };
                const audited = buildAuditedScoreRecord(existingPeriod[subjectName] || {}, nextRecord, {
                    now,
                    source:'excel',
                    studentId:student.id,
                    studentCode:student.code || student.id,
                    studentName:student.name,
                    className:student.classRoom || student.class || '',
                    subjectName,
                    schoolYear:sy,
                    mode,
                });
                const subData=audited.record;

                const basePath=isGHK?_ghkPath(student.id,sy,mode):_hkPath(student.id,sy,hk);
                updates[`${basePath}/${subjectName}`]=subData;
                Object.assign(updates, makeScoreAuditUpdate(audited.auditEntry));

                const yp=`hocba/${student.id}/${sy.replace('-','_')}`;
                updates[`${yp}/grade`]=grade;
                updates[`${yp}/schoolYear`]=sy;
                updates[`${yp}/updatedAt`]=now;
                if(!isGHK){
                    updates[`${yp}/${hk}_subjects/${subjectName}`]=subData;
                    if(hk==='hk2') updates[`${yp}/subjects/${subjectName}`]=subData;
                } else {
                    updates[`${yp}/${mode}_subjects/${subjectName}`]=subData;
                }
                ok++;
            }

            if(Object.keys(updates).length) await window.update(window.ref(window.db),updates);
            Swal.close();

            const args=window._currentSubjectTableArgs;
            if(args) await _renderSubjectTable(args.cls,args.sy,args.mode,args.subjectName,args.isDiemSub,args.ghkHasScore);

            Swal.fire({
                icon:ok>0?'success':'warning',
                title:ok>0?`✅ Import ${subjectName} hoàn tất!`:'⚠️ Không có dữ liệu nào được lưu',
                html:`<div style="text-align:left;font-size:0.9rem">
                    ${ok?`<p>✅ <b style="color:#16a34a">${ok}</b> học sinh đã cập nhật</p>`:''}
                    ${notFound?`<p>⚠️ <b style="color:#dc2626">${notFound}</b> mã HS không tìm thấy${notFoundList.length?`<br><small style="color:#94a3b8">${notFoundList.slice(0,5).join(', ')}${notFoundList.length>5?'...':''}</small>`:''}</p>`:''}
                    ${skip?`<p>⏭️ <b>${skip}</b> hàng bỏ qua</p>`:''}
                    <p style="margin-top:8px;font-size:0.8rem;color:#64748b">Môn <b>${subjectName}</b> — ${modeLabel} — ${sy} — Lớp ${cls}</p>
                </div>`,
            });
        } catch(err) {
            Swal.close();
            Swal.fire('Lỗi import',err.message,'error');
        }
    };
    reader.readAsArrayBuffer(f);
};


// ══════════════════════════════════════════════════════════════════════════════
// V5.5 — Vá import Excel giáo viên bộ môn: đúng lớp, chuẩn hóa Mã HS, không ghi đè ô trống
// ══════════════════════════════════════════════════════════════════════════════
console.info('[Smart School V5.6] subjectscores excel/comment bank patch loaded');

function _sst55NormCode(value) {
    let text = String(value ?? '').trim();
    if (/^\d+(\.0+)?$/.test(text)) text = String(parseInt(text, 10));
    return text.toUpperCase().replace(/\s+/g, '');
}
function _sst55ClassOf(student) { return String(student?.classRoom || student?.class || '').trim(); }
function _sst55SameClass(student, cls) { return _sst55ClassOf(student) === String(cls || '').trim(); }
function _sst55IsBlank(value) { return String(value ?? '').trim() === ''; }
function _sst55Clean(value) { return String(value ?? '').trim(); }
function _sst55Upper(value) { return _sst55Clean(value).toUpperCase(); }
function _sst55ValidateSubjectLevel(value, label) {
    const raw = _sst55Clean(value);
    if (!raw) return '';
    const v = raw.toUpperCase();
    if (v === 'T' || v === 'TỐT' || v === 'TOT') return 'T';
    if (v === 'H' || v === 'HOÀN THÀNH' || v === 'HOAN THANH') return 'H';
    if (v === 'C' || v === 'CHƯA HOÀN THÀNH' || v === 'CHUA HOAN THANH' || v === 'CẦN CỐ GẮNG' || v === 'CAN CO GANG') return 'C';
    if (/^TIẾNG\s*VIỆT/i.test(raw) || /^TOÁN/i.test(raw) || /^TIN\s*HỌC/i.test(raw)) return 'T';
    if (!['T','H','C'].includes(v)) throw new Error(`${label}: Mức môn học chỉ được nhập T, H hoặc C (hoặc Tốt, Hoàn thành, Cần cố gắng).`);
    return v;
}
function _sst55ScoreToLevel(score) { const n=Number(score); if(!Number.isFinite(n)) return ''; return n>=9?'T':n>=5?'H':'C'; }
function _sst55ParseScore(value,label){ if(_sst55IsBlank(value)) return null; const n=Number(String(value).replace(',','.')); if(!Number.isFinite(n)||n<0||n>10) throw new Error(`${label} phải từ 0 đến 10.`); return Math.round(n*100)/100; }
function _sst55EscapeFormulaText(value){ return String(value??'').replace(/"/g,'""'); }
function _sst55ColLetter(c){ let s=''; c+=1; while(c>0){s=String.fromCharCode(((c-1)%26)+65)+s; c=Math.floor((c-1)/26);} return s; }
function _sst55Set(ws,r,c,v){ const addr=XLSX.utils.encode_cell({r,c}); ws[addr]=(v===''||v===null||v===undefined)?{v:'',t:'s'}:typeof v==='number'?{v,t:'n'}:{v:String(v),t:'s'}; }
function _sst55Comment(grade,name,level,score){ const list=getCommentSuggestions({grade,name,kind:'subject',level,score}); if(list&&list.length) return list[0]; if(score!==null&&score!==undefined&&score!==''){const n=Number(score); if(n>=9)return'Hoàn thành tốt yêu cầu môn học; nắm chắc kiến thức và kỹ năng.'; if(n>=7)return'Hoàn thành yêu cầu môn học; cần tiếp tục phát huy và cẩn thận hơn.'; if(n>=5)return'Hoàn thành ở mức cơ bản; cần rèn luyện thêm để kết quả ổn định hơn.'; return'Chưa hoàn thành yêu cầu; cần được hỗ trợ, ôn tập và luyện tập thường xuyên.';} if(level==='T')return'Hoàn thành tốt yêu cầu môn học; tích cực trong học tập.'; if(level==='H')return'Hoàn thành yêu cầu môn học; cần tiếp tục rèn luyện thêm.'; return'Cần cố gắng hơn; giáo viên và gia đình tiếp tục phối hợp hỗ trợ.'; }
function _sst55Formula(levelRef,scoreRef,grade,subjectName){ const high=_sst55EscapeFormulaText(_sst55Comment(grade,subjectName,'T',10)); const good=_sst55EscapeFormulaText(_sst55Comment(grade,subjectName,'H',8)); const pass=_sst55EscapeFormulaText(_sst55Comment(grade,subjectName,'H',6)); const fail=_sst55EscapeFormulaText(_sst55Comment(grade,subjectName,'C',4)); if(scoreRef) return `IF(${scoreRef}<>"",IF(${scoreRef}>=9,"${high}",IF(${scoreRef}>=7,"${good}",IF(${scoreRef}>=5,"${pass}","${fail}"))),IF(${levelRef}="","",IF(${levelRef}="T","${high}",IF(${levelRef}="H","${good}","${fail}"))))`; return `IF(${levelRef}="","",IF(${levelRef}="T","${high}",IF(${levelRef}="H","${good}","${fail}")))`; }

function _sst56BucketConfig(bucket) {
    if (bucket === 'high') return { level:'T', score:10, label:'Tốt / 9-10' };
    if (bucket === 'good') return { level:'H', score:8, label:'Hoàn thành khá / 7-8' };
    if (bucket === 'pass') return { level:'H', score:6, label:'Hoàn thành cơ bản / 5-6' };
    return { level:'C', score:4, label:'Chưa hoàn thành / dưới 5' };
}
function _sst56BuildCommentBankSheet(grade, subjectName) {
    const sheetName='NganHangNhanXet';
    const rows=[
        [`NGÂN HÀNG NHẬN XÉT — ${subjectName.toUpperCase()} — KHỐI ${grade}`,'','',''],
        ['Các câu được lấy từ bộ nhận xét người dùng cung cấp; sheet nhập dữ liệu tự luân phiên câu theo từng học sinh.','','',''],
        ['Không đổi tên sheet hoặc xóa các dòng nhận xét vì công thức đang tham chiếu tới đây.','','',''],
        ['Mức / khoảng điểm','STT','Nhận xét','Ghi chú'],
    ];
    const ranges=new Map();
    ['high','good','pass','fail'].forEach(bucket=>{
        const cfg=_sst56BucketConfig(bucket);
        let list=getCommentSuggestions({grade,name:subjectName,kind:'subject',level:cfg.level,score:cfg.score})||[];
        list=[...new Set(list.map(v=>String(v||'').trim()).filter(Boolean))];
        if(!list.length) list=[_sst55Comment(grade,subjectName,cfg.level,cfg.score)];
        const first=rows.length+1;
        list.forEach((text,index)=>rows.push([cfg.label,index+1,text,subjectName]));
        ranges.set(bucket,{first,last:rows.length,count:list.length});
    });
    const ws=XLSX.utils.aoa_to_sheet(rows);
    ws['!cols']=[{wch:27},{wch:7},{wch:110},{wch:28}];
    ws['!rows']=[{hpt:26},{hpt:22},{hpt:22},{hpt:24}];
    ws['!merges']=[{s:{r:0,c:0},e:{r:0,c:3}},{s:{r:1,c:0},e:{r:1,c:3}},{s:{r:2,c:0},e:{r:2,c:3}}];
    ws['!autofilter']={ref:`A4:D${Math.max(4,rows.length)}`};
    ws['!freeze']={xSplit:0,ySplit:4,topLeftCell:'A5'};
    return {ws,sheetName,ranges,total:rows.length-4};
}
function _sst56Pick(range,seed=0,sheetName='NganHangNhanXet') {
    if(!range||!range.count) return '""';
    return `INDEX('${sheetName}'!$C$${range.first}:$C$${range.last},MOD(ROW()+${Math.abs(Number(seed)||0)},${range.count})+1)`;
}
function _sst56Formula(levelRef,scoreRef,bank) {
    const high=_sst56Pick(bank.ranges.get('high'),1,bank.sheetName);
    const good=_sst56Pick(bank.ranges.get('good'),3,bank.sheetName);
    const pass=_sst56Pick(bank.ranges.get('pass'),5,bank.sheetName);
    const fail=_sst56Pick(bank.ranges.get('fail'),7,bank.sheetName);
    const isT = `OR(TRIM(UPPER(${levelRef}))="T",TRIM(${levelRef})="Tốt")`;
    const isGood = `OR(TRIM(UPPER(${levelRef}))="H",TRIM(${levelRef})="Hoàn thành")`;
    const isC = `OR(TRIM(UPPER(${levelRef}))="C",TRIM(${levelRef})="Chưa hoàn thành",TRIM(${levelRef})="Cần cố gắng")`;
    const byLevel = `IF(${levelRef}="","",IF(${isT},${high},IF(${isGood},${good},IF(${isC},${fail},""))))`;
    if(scoreRef) return `IF(${scoreRef}<>"",IF(${scoreRef}>=9,${high},IF(${scoreRef}>=7,${good},IF(${scoreRef}>=5,${pass},${fail}))),${byLevel})`;
    return byLevel;
}
function _sst56EnableWorkbookCalculation(wb) {
    wb.Workbook=wb.Workbook||{};
    wb.Workbook.CalcPr={calcMode:'auto',fullCalcOnLoad:'1',forceFullCalc:'1'};
}

function _sst55BuildLookups(cls){ const inClass=new Map(), all=new Map(); Object.entries(window.localData?.students||{}).forEach(([key,student])=>{ if(!isActiveStudent(student)) return; [key,student?.id,student?.code].filter(Boolean).forEach(alias=>{ const norm=_sst55NormCode(alias); if(!norm)return; all.set(norm,{key,student}); if(_sst55SameClass(student,cls)) inClass.set(norm,{key,student}); }); }); return {inClass,all}; }

window.downloadSubjectScoreTemplate = function(cls, sy, mode, subjectName, isDiemSub, ghkHasScore) {
    cls=cls||window._subjectScoreClass; sy=sy||_syNow(); mode=mode||window._subjectScoreMode||'hk1'; subjectName=subjectName||window.teacherSubject;
    const grade=_gradeOf(cls); if(isDiemSub===undefined||isDiemSub===null) isDiemSub=_getSubs(grade).find(s=>s.name===subjectName)?.type==='diem';
    const isGHK=mode==='ghk1'||mode==='ghk2'; if(ghkHasScore===undefined||ghkHasScore===null) ghkHasScore=isGHK&&_ghkHasNumericScore(grade,subjectName);
    const showScore=isDiemSub&&(!isGHK||ghkHasScore); const modeLabel={hk1:'Cuối HK1',ghk1:'Giữa HK1',hk2:'Cuối HK2',ghk2:'Giữa HK2'}[mode]||mode;
    const students=activeStudentValues().filter(s=>_sst55SameClass(s,cls)).sort((a,b)=>(a.name||'').split(' ').pop().localeCompare((b.name||'').split(' ').pop(),'vi'));
    if(!students.length){Swal.fire('Thông báo','Không có học sinh trong lớp này','warning');return;}
    const N=showScore?6:5, COL_MA=1, COL_MUC=showScore?4:3, COL_DIEM=showScore?3:-1, COL_NX=showScore?5:4;
    const ws={'!ref':XLSX.utils.encode_range({s:{r:0,c:0},e:{r:4+students.length+2,c:N-1}})};
    ws['!rows']=[{hpt:22},{hpt:26},{hpt:18},{hpt:22}]; ws['!cols']=[{wch:5},{wch:16},{wch:30},...(showScore?[{wch:12}]:[]),{wch:12},{wch:55}]; ws['!merges']=[{s:{r:0,c:0},e:{r:0,c:N-1}},{s:{r:1,c:0},e:{r:1,c:N-1}},{s:{r:2,c:0},e:{r:2,c:N-1}}];
    _sst55Set(ws,0,0,`🏫 FMA Nam Hòa - Lớp Phổ Cập TH. Hùng Vương, 158-160 Đất Thánh, Kp 8, P. Tân Hòa | LỚP: ${cls} | NĂM HỌC: ${sy}`);
    _sst55Set(ws,1,0,`PHIẾU NHẬP ĐIỂM BỘ MÔN — ${subjectName.toUpperCase()} — ${modeLabel.toUpperCase()} — LỚP ${cls}`);
    _sst55Set(ws,2,0,showScore?'✅ Nhập ĐIỂM bên trái → Mức tự động → Nhận xét tự động bên phải.':'✅ Nhập MỨC bên trái → Nhận xét tự động bên phải.');
    _sst55Set(ws,3,0,'STT'); _sst55Set(ws,3,1,'Mã học sinh'); _sst55Set(ws,3,2,'Họ và tên'); if(showScore)_sst55Set(ws,3,COL_DIEM,'Điểm KTĐK'); _sst55Set(ws,3,COL_MUC,'Mức (T/H/C)'); _sst55Set(ws,3,COL_NX,'Nhận xét');
    const mucL=_sst55ColLetter(COL_MUC), diemL=showScore?_sst55ColLetter(COL_DIEM):'';
    const commentBank=_sst56BuildCommentBankSheet(grade,subjectName);
    students.forEach((s,si)=>{ const R=4+si,Rn=R+1; _sst55Set(ws,R,0,si+1); _sst55Set(ws,R,1,s.code||s.id); _sst55Set(ws,R,2,s.name); if(showScore){ _sst55Set(ws,R,COL_DIEM,''); ws[XLSX.utils.encode_cell({r:R,c:COL_MUC})]={t:'s',f:`IF(${diemL}${Rn}="","",IF(${diemL}${Rn}>=9,"T",IF(${diemL}${Rn}>=5,"H","C")))`}; } else _sst55Set(ws,R,COL_MUC,''); ws[XLSX.utils.encode_cell({r:R,c:COL_NX})]={t:'s',f:_sst56Formula(`${mucL}${Rn}`,showScore?`${diemL}${Rn}`:'',commentBank)}; });
    const fDR=5,lDR=4+students.length; ws['!dataValidation']=[{sqref:`${mucL}${fDR}:${mucL}${lDR}`,type:'list',formula1:'"T,H,C"',showDropDown:true,showErrorMessage:true,errorTitle:'Giá trị không hợp lệ',error:'Chỉ chọn hoặc nhập T, H hoặc C'}]; if(showScore) ws['!dataValidation'].push({sqref:`${diemL}${fDR}:${diemL}${lDR}`,type:'decimal',operator:'between',formula1:'0',formula2:'10',showErrorMessage:true,errorTitle:'Điểm không hợp lệ',error:'Nhập điểm từ 0 đến 10'}); ws['!freeze']={xSplit:3,ySplit:4,topLeftCell:'D5'};
    const wsG=XLSX.utils.aoa_to_sheet([['HƯỚNG DẪN BỘ MÔN — V5.6'],[''],[`Môn: ${subjectName} | Lớp: ${cls} | Kỳ: ${modeLabel} | Năm học: ${sy}`],['Nhận xét tự động luân phiên theo học sinh từ sheet NganHangNhanXet.'],[`Ngân hàng có ${commentBank.total} câu phù hợp môn và khối; không xóa hoặc đổi tên sheet này.`],['Chỉ import học sinh đúng lớp đang chọn. Ô trống được bỏ qua, không ghi đè dữ liệu cũ.']]); wsG['!cols']=[{wch:90}];
    const sn=`${modeLabel.replace(' ','')}_${subjectName}_${cls}`.replace(/[\/\?*\[\]:]/g,'_').substring(0,31);
    const wb=XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb,ws,sn);
    XLSX.utils.book_append_sheet(wb,commentBank.ws,commentBank.sheetName);
    XLSX.utils.book_append_sheet(wb,wsG,'HuongDan');
    _sst56EnableWorkbookCalculation(wb);
    XLSX.writeFile(wb,`FileMau_${subjectName.replace(/\s/g,'_')}_${modeLabel.replace(' ','')}_Lop${cls.replace('/','_')}_V56.xlsx`);
    Swal.fire('Đã tạo file mẫu bộ môn V5.6',`Đã gắn ${commentBank.total} câu nhận xét đúng môn, đúng khối và tự luân phiên.`,'success');
};

window.importSubjectScoreExcel = async function(inp) {
    const modeForAccess=window._subjectScoreMode||'hk1'; const accessStatus=await ensureScoreEntryAllowed(_syNow(),modeForAccess); if(!accessStatus.allowed){inp.value='';return;} const f=inp.files[0]; if(!f)return; inp.value='';
    const reader=new FileReader(); reader.onload=async e=>{ try { const wb=XLSX.read(e.target.result,{type:'array'}); const sheetName=wb.SheetNames.find(n=>!n.toLowerCase().includes('huongdan')&&!n.toLowerCase().includes('nganhangnhanxet'))||wb.SheetNames[0]; const allRows=XLSX.utils.sheet_to_json(wb.Sheets[sheetName],{header:1,defval:''}); if(allRows.length<5){Swal.fire('Lỗi','File không đúng định dạng — cần ít nhất 5 hàng','error');return;} const hdr=allRows[3]||[]; const findCol=label=>hdr.findIndex(h=>_sst55Clean(h).toLowerCase()===label.toLowerCase()); const COL_MA=findCol('mã học sinh'), COL_MUC=hdr.findIndex(h=>/^mức/i.test(_sst55Clean(h))), COL_DIEM=findCol('điểm ktđk'), COL_NX=findCol('nhận xét'); if(COL_MA<0||COL_MUC<0){Swal.fire('Lỗi','Không tìm thấy cột Mã học sinh hoặc Mức đánh giá','error');return;} const dataRows=allRows.slice(4).filter(r=>!_sst55IsBlank(r[COL_MA])); if(!dataRows.length){Swal.fire('Lỗi','Không tìm thấy dữ liệu học sinh từ hàng 5 trở đi','error');return;}
        const mode=window._subjectScoreMode||'hk1', cls=window._subjectScoreClass, sy=_syNow(); const liveAccess=await ensureScoreEntryAllowed(sy,mode); if(!liveAccess.allowed)return; const subjectName=window.teacherSubject, grade=_gradeOf(cls), isGHK=mode==='ghk1'||mode==='ghk2', hk=(mode==='hk2'||mode==='ghk2')?'hk2':'hk1', isDiemSub=_getSubs(grade).find(s=>s.name===subjectName)?.type==='diem', ghkHasScore=isGHK&&_ghkHasNumericScore(grade,subjectName), showScore=isDiemSub&&(!isGHK||ghkHasScore), modeLabel={hk1:'Cuối HK1',ghk1:'Giữa HK1',hk2:'Cuối HK2',ghk2:'Giữa HK2'}[mode];
        const lookups=_sst55BuildLookups(cls); Swal.fire({title:`Đang import ${subjectName} — ${modeLabel} V5.6...`,allowOutsideClick:false,didOpen:()=>Swal.showLoading()}); let ok=0,skip=0,blankRows=0,wrongClass=0,notFound=0; const wrongClassList=[],notFoundList=[],updates={};
        for(const row of dataRows){ const rawCode=row[COL_MA], code=_sst55NormCode(rawCode); if(!code){skip++;continue;} const hasAny=!_sst55IsBlank(row[COL_MUC]) || (COL_DIEM>=0&&!_sst55IsBlank(row[COL_DIEM])) || (COL_NX>=0&&!_sst55IsBlank(row[COL_NX])); if(!hasAny){blankRows++;continue;} const hit=lookups.inClass.get(code); if(!hit){ const any=lookups.all.get(code); if(any){wrongClass++;wrongClassList.push(String(rawCode).trim());} else {notFound++;notFoundList.push(String(rawCode).trim());} continue; } const student=hit.student; const existingPeriod=isGHK?await _loadGHK(student.id,sy,mode):await _loadHK(student.id,sy,hk); let mucRaw=_sst55Clean(row[COL_MUC]); let nxRaw=COL_NX>=0?_sst55Clean(row[COL_NX]):''; const diemText=showScore&&COL_DIEM>=0?_sst55Clean(row[COL_DIEM]):''; if(!showScore&&!_sst55IsBlank(diemText)) throw new Error(`${subjectName} không được nhập điểm ở ${modeLabel}.`); const diemRaw=showScore?_sst55ParseScore(diemText,`Điểm của học sinh ${String(rawCode).trim()}`):null; mucRaw=mucRaw?_sst55ValidateSubjectLevel(mucRaw,`${subjectName} - ${String(rawCode).trim()}`):(diemRaw!==null?_sst55ScoreToLevel(diemRaw):(existingPeriod[subjectName]?.mucDat||'')); nxRaw=nxRaw||(mucRaw?_sst55Comment(grade,subjectName,mucRaw,diemRaw!==null?diemRaw:existingPeriod[subjectName]?.diem):''); if(!mucRaw&&!nxRaw&&diemRaw===null){blankRows++;continue;} const existing=existingPeriod[subjectName]||{}; const now=typeof window.serverNow==='function'?window.serverNow():Date.now(); const nextRecord={...existing,mucDat:mucRaw,nhanXet:nxRaw}; if(diemRaw!==null) nextRecord.diem=diemRaw; const audited=buildAuditedScoreRecord(existing,nextRecord,{now,source:'excel',studentId:student.id,studentCode:student.code||student.id,studentName:student.name,className:cls,subjectName,schoolYear:sy,mode}); const basePath=isGHK?_ghkPath(student.id,sy,mode):_hkPath(student.id,sy,hk); updates[`${basePath}/${subjectName}`]=audited.record; Object.assign(updates,makeScoreAuditUpdate(audited.auditEntry)); const yp=`hocba/${student.id}/${sy.replace('-','_')}`; updates[`${yp}/grade`]=grade; updates[`${yp}/schoolYear`]=sy; updates[`${yp}/updatedAt`]=now; if(!isGHK){ updates[`${yp}/${hk}_subjects/${subjectName}`]=audited.record; if(hk==='hk2') updates[`${yp}/subjects/${subjectName}`]=audited.record; } else updates[`${yp}/${mode}_subjects/${subjectName}`]=audited.record; ok++; }
        if(!Object.keys(updates).length){Swal.close();Swal.fire('Không có dữ liệu được lưu','File trống hoặc không có dòng hợp lệ, hệ thống không ghi đè dữ liệu cũ.','warning');return;} await window.update(window.ref(window.db),updates); Swal.close(); const args=window._currentSubjectTableArgs; if(args) await _renderSubjectTable(args.cls,args.sy,args.mode,args.subjectName,args.isDiemSub,args.ghkHasScore); Swal.fire({icon:'success',title:`✅ Import ${subjectName} V5.6 hoàn tất!`,html:`<div style="text-align:left;font-size:.9rem"><p>✅ <b style="color:#16a34a">${ok}</b> học sinh đúng lớp đã cập nhật</p>${blankRows?`<p>⬜ <b>${blankRows}</b> dòng trống bỏ qua</p>`:''}${wrongClass?`<p>🚫 <b>${wrongClass}</b> mã HS thuộc lớp khác bị từ chối<br><small>${wrongClassList.slice(0,6).join(', ')}</small></p>`:''}${notFound?`<p>⚠️ <b>${notFound}</b> mã không tìm thấy<br><small>${notFoundList.slice(0,6).join(', ')}</small></p>`:''}${skip?`<p>⏭️ <b>${skip}</b> dòng bỏ qua</p>`:''}<p style="margin-top:8px;color:#64748b">${modeLabel} — ${sy} — Lớp ${cls}</p></div>`});
    } catch(err){ Swal.close(); Swal.fire('Lỗi import',err.message,'error'); } }; reader.readAsArrayBuffer(f);
};
