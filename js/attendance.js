import { activeStudentValues, isActiveStudent, compareStudentNames, sortStudentsByName } from "./studentstatus.js?v=5.26.1";
// ═══════════════════════════════════════════════════════
// attendance.js — Điểm danh
// DB path: attendance/{schoolYear}/{className}/{date}/{studentId}
// schoolYear: '2024_2025', '2025_2026'...
// ═══════════════════════════════════════════════════════

// ── Lấy năm học hiện tại dạng key (2024_2025) ─────────────────────────────

console.info('[Smart School V5.6] attendance permission patch loaded');

function _attClassKey(cls) {
    return String(cls || '').trim().replace(/\//g, '_').replace(/[.#$\[\]]/g, '_');
}

function _teacherClassKey() {
    return _attClassKey(window.teacherClassKey || window.teacherClass || '');
}

function _studentClassName(student) {
    return student?.classRoom || student?.class || '';
}

function _sameClass(student, classNameOrKey) {
    const studentClass = _studentClassName(student);
    if (!studentClass || !classNameOrKey) return false;
    return studentClass === classNameOrKey || _attClassKey(studentClass) === _attClassKey(classNameOrKey);
}

function _resolveTeacherClassName() {
    const assignedName = String(window.teacherClass || '').trim();
    if (assignedName) return assignedName;

    const assignedKey = _teacherClassKey();
    if (!assignedKey) return '';

    const found = activeStudentValues().find(student => _attClassKey(_studentClassName(student)) === assignedKey);
    return found ? _studentClassName(found) : assignedKey;
}

function _emptyAttendanceSnapshot() {
    return { exists: () => false, val: () => null };
}

async function _readAttendanceClass(yearKey, className, suffix = '') {
    const safePath = `attendance/${yearKey}/${_attClassKey(className)}${suffix}`;

    // Firebase Rules V5 cho giáo viên đọc theo classKey, ví dụ 5_3.
    // Không fallback sang đường dẫn cũ 5/3 vì dấu '/' bị Firebase hiểu là node con,
    // làm giáo viên bị Permission denied tại attendance/{year}/5.
    try {
        const safeSnap = await window.get(window.child(window.ref(window.db), safePath));
        if (safeSnap.exists() || window.userRole !== 'admin') return safeSnap;

        // Chỉ Admin mới cần đọc dữ liệu legacy để xem lại dữ liệu cũ.
        const legacyPath = `attendance/${yearKey}/${className}${suffix}`;
        try {
            return await window.get(window.child(window.ref(window.db), legacyPath));
        } catch (legacyError) {
            console.warn('[Smart School V5.6] Không đọc được attendance legacy:', legacyError);
            return safeSnap;
        }
    } catch (error) {
        console.warn(`[Smart School V5.6] Không đọc được ${safePath}:`, error);
        if (window.userRole === 'teacher') {
            throw new Error(
                'Không có quyền đọc điểm danh lớp này. Kiểm tra users/{uid}/assignedClassKey phải khớp với lớp, ví dụ lớp 5/3 thì assignedClassKey = 5_3.'
            );
        }
        return _emptyAttendanceSnapshot();
    }
}

function _attYear() {
    const sy = window._currentSchoolYear || (() => {
        const n = new Date(), y = n.getFullYear();
        return n.getMonth() >= 7 ? `${y}-${y+1}` : `${y-1}-${y}`;
    })();
    return sy.replace('-', '_'); // '2024_2025'
}
// ═══════════════════════════════════════════════════════
// SORT DANH SÁCH ĐIỂM DANH
// ═══════════════════════════════════════════════════════

let _attendanceSortMode = 'name_az';

function _attendanceNameInfo(name) {
    const full = String(name || '').trim();
    const parts = full.split(/\s+/).filter(Boolean);

    return {
        givenName: parts.length ? parts[parts.length - 1] : '',
        fullName: full
    };
}

function _compareAttendanceNames(nameA, nameB) {
    const cmpFn = typeof compareStudentNames === 'function' ? compareStudentNames : window.compareStudentNames;
    if (cmpFn) return cmpFn(nameA, nameB, 'name_az');

    const a = _attendanceNameInfo(nameA);
    const b = _attendanceNameInfo(nameB);

    // Ưu tiên sắp xếp theo TÊN: Anh, Bình, Hùng, Minh...
    const byGivenName = a.givenName.localeCompare(
        b.givenName,
        'vi'
    );

    if (byGivenName !== 0) return byGivenName;

    // Nếu trùng tên thì so tiếp toàn bộ họ tên
    return a.fullName.localeCompare(
        b.fullName,
        'vi'
    );
}

function _sortAttendanceStudents(students) {
    const mode = _attendanceSortMode || 'name_az';
    const sortFn = typeof sortStudentsByName === 'function' ? sortStudentsByName : window.sortStudentsByName;
    if (sortFn) return sortFn(students, mode);

    return [...students].sort((a, b) => {
        const result = _compareAttendanceNames(
            a.name || '',
            b.name || ''
        );

        if (result !== 0) {
            return mode === 'name_za'
                ? -result
                : result;
        }

        const codeResult = String(a.code || a.id || '').localeCompare(
            String(b.code || b.id || ''),
            'vi',
            { numeric: true }
        );

        return mode === 'name_za' ? -codeResult : codeResult;
    });
}

function _updateAttendanceSortButton() {
    const btn = document.getElementById('attendance-sort-btn');
    if (!btn) return;

    if (_attendanceSortMode === 'name_za') {
        btn.innerHTML = `
            <i class="fas fa-sort-alpha-up-alt"></i>
            Tên Z → A
        `;
        btn.title = 'Đang sắp xếp tên Z đến A - bấm để đổi sang A đến Z';
        return;
    }

    btn.innerHTML = `
        <i class="fas fa-sort-alpha-down"></i>
        Tên A → Z
    `;
    btn.title = 'Đang sắp xếp tên A đến Z - bấm để đổi sang Z đến A';
}

export function cycleAttendanceSort() {
    // A-Z → Z-A → A-Z...
    _attendanceSortMode =
        _attendanceSortMode === 'name_za'
            ? 'name_az'
            : 'name_za';

    const tbody = document.getElementById('attendance-tbody');

    if (tbody) {
        // Sort trực tiếp các dòng đang có để KHÔNG mất
        // trạng thái điểm danh và ghi chú chưa lưu.
        const rows = Array.from(tbody.querySelectorAll('tr'))
            .filter(row => row.children.length >= 3);

        const cmpFn = typeof compareStudentNames === 'function' ? compareStudentNames : window.compareStudentNames;

        rows.sort((rowA, rowB) => {
            // Cột thứ 3 luôn là Họ tên (index 2), cột 2 là Mã HS (index 1)
            const nameA = rowA.children[2]?.textContent || '';
            const nameB = rowB.children[2]?.textContent || '';
            const codeA = rowA.children[1]?.textContent || '';
            const codeB = rowB.children[1]?.textContent || '';

            if (cmpFn) {
                return cmpFn({ name: nameA, code: codeA }, { name: nameB, code: codeB }, _attendanceSortMode);
            }

            const result = _compareAttendanceNames(nameA, nameB);

            if (result !== 0) {
                return _attendanceSortMode === 'name_za'
                    ? -result
                    : result;
            }

            const codeRes = codeA.localeCompare(codeB, 'vi', { numeric: true });
            return _attendanceSortMode === 'name_za' ? -codeRes : codeRes;
        });

        rows.forEach((row, index) => {
            // Cập nhật lại STT
            if (row.children[0]) {
                row.children[0].textContent = index + 1;
            }

            tbody.appendChild(row);
        });
    }

    _updateAttendanceSortButton();
}

// Cho phép onclick trong HTML gọi được hàm này
window.cycleAttendanceSort = cycleAttendanceSort;

export function renderAttendance() {
    const teacherClassName = _resolveTeacherClassName();
    if (!teacherClassName && window.userRole === 'teacher') {
        document.getElementById('content').innerHTML = `
            <div class="card"><p>Bạn cần được phân công lớp để sử dụng chức năng điểm danh.</p></div>`;
        return;
    }

    const today = new Date().toISOString().split('T')[0];

    let classSelector = '';
    if (window.userRole === 'admin') {
        const allClasses = [...new Set(
            activeStudentValues().map(s => s.classRoom || s.class).filter(Boolean)
        )].sort((a,b) => a.localeCompare(b, 'vi', { numeric: true }));
        classSelector = `
            <div>
                <label>Chọn lớp:</label>
                <select id="attendance-class" class="form-control" onchange="loadAttendance()"
                    style="display:inline-block;width:auto;margin-left:10px">
                    <option value="">-- Chọn lớp --</option>
                    ${allClasses.map(c => `<option value="${c}">${c}</option>`).join('')}
                </select>
            </div>`;
    } else {
        classSelector = `<div style="font-weight:600;color:var(--primary)">Lớp: ${teacherClassName}</div>`;
    }

    document.getElementById('content').innerHTML = `
        <div class="card">
            <div style="display:flex;gap:15px;align-items:center;margin-bottom:20px;flex-wrap:wrap">
                ${classSelector}
                <div>
                    <label>Chọn ngày:</label>
                    <input type="date" id="attendance-date" class="form-control" value="${today}"
                           onchange="loadAttendance()" style="display:inline-block;width:auto;margin-left:10px">
                </div>
                <button class="btn btn-success" onclick="saveAttendance()">
                    <i class="fas fa-save"></i> Lưu điểm danh
                </button>
                
                <button
                    id="attendance-sort-btn"
                    type="button"
                    class="btn btn-outline"
                    onclick="cycleAttendanceSort()"
                    title="Đang sắp xếp tên A đến Z - bấm để đổi sang Z đến A">
                    <i class="fas fa-sort-alpha-down"></i>
                    Tên A → Z
                </button>
                
                <button class="btn btn-primary" onclick="openAttendanceStats()" style="margin-left:auto">
                    <i class="fas fa-chart-bar"></i> Thống kê điểm danh
                </button>
            </div>

            <div class="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>STT</th><th>Mã HS</th><th>Họ tên</th>
                            ${window.userRole === 'admin' ? '<th>Lớp</th>' : ''}
                            <th style="text-align:center">Trạng thái</th><th>Ghi chú</th>
                        </tr>
                    </thead>
                    <tbody id="attendance-tbody"></tbody>
                </table>
            </div>
        </div>`;

    _updateAttendanceSortButton();
    loadAttendance();
}

export async function loadAttendance() {
    const teacherClassName = _resolveTeacherClassName();
    if (!teacherClassName && window.userRole === 'teacher') return;

    const date = document.getElementById('attendance-date').value;
    let students = activeStudentValues();

    let activeClass = teacherClassName;
    if (window.userRole === 'admin') {
        const classEl = document.getElementById('attendance-class');
        activeClass = classEl ? classEl.value : '';
        if (!activeClass) {
            document.getElementById('attendance-tbody').innerHTML = `
                <tr><td colspan="6" style="text-align:center;color:#94a3b8;padding:30px">Vui lòng chọn lớp để xem điểm danh</td></tr>`;
            return;
        }
    }

    if (activeClass) {
        students = students.filter(x => _sameClass(x, activeClass));
    }
    
    // Giữ kiểu sắp xếp khi đổi ngày hoặc đổi lớp
    students = _sortAttendanceStudents(students);

    let attData = {};
    try {
        const snap = await _readAttendanceClass(_attYear(), activeClass || 'all', `/${date}`);
        attData = snap.exists() ? snap.val() : {};
    } catch (error) {
        document.getElementById('attendance-tbody').innerHTML = `
            <tr><td colspan="${window.userRole === 'admin' ? 6 : 5}" style="text-align:center;color:#dc2626;padding:30px">
                <i class="fas fa-exclamation-circle"></i> ${error.message}
            </td></tr>`;
        return;
    }

    let html = '';
    students.forEach((st, i) => {
        const s = attData[st.code || st.id] || {};
        html += `<tr>
            <td>${i+1}</td>
            <td>${st.code || st.id}</td>
            <td>${st.name}</td>
            ${window.userRole === 'admin' ? `<td>${st.classRoom || st.class}</td>` : ''}
            <td style="text-align:center">
                <select id="att-s-${st.code || st.id}" class="form-control">
                    <option value="present" ${s.status==='present'?'selected':''}>Có mặt</option>
                    <option value="p"       ${s.status==='p'      ?'selected':''}>Vắng P</option>
                    <option value="kp"      ${s.status==='kp'     ?'selected':''}>Vắng KP</option>
                </select>
            </td>
            <td><input type="text" id="att-n-${st.code || st.id}" class="form-control" value="${s.note||''}"></td>
        </tr>`;
    });

    document.getElementById('attendance-tbody').innerHTML = html ||
        `<tr><td colspan="6" style="text-align:center;color:#94a3b8">Không có học sinh trong lớp này</td></tr>`;
}

export async function saveAttendance() {
    const date = document.getElementById('attendance-date').value;
    if (!date) { Swal.fire('Lỗi', 'Chọn ngày', 'warning'); return; }

    let activeClass = _resolveTeacherClassName();
    if (window.userRole === 'admin') {
        const classEl = document.getElementById('attendance-class');
        activeClass = classEl ? classEl.value : '';
        if (!activeClass) { Swal.fire('Lỗi', 'Vui lòng chọn lớp trước khi lưu', 'warning'); return; }
    }

    let students = activeStudentValues();
    if (activeClass) {
        students = students.filter(x => _sameClass(x, activeClass));
    }

    const { ref, update } = window;

    // Ghi thẳng vào node $className thay vì root để tránh PERMISSION_DENIED
    // Firebase rules cho phép teacher ghi vào attendance/$year/$class khi assignedClass khớp
    const basePath = `attendance/${_attYear()}/${_attClassKey(activeClass || 'all')}/${date}`;
    const updates = {};
    students.forEach(st => {
        const id       = st.code || st.id;
        const statusEl = document.getElementById(`att-s-${id}`);
        const noteEl   = document.getElementById(`att-n-${id}`);
        if (statusEl) {
            updates[id] = {
                status:  statusEl.value,
                note:    noteEl ? noteEl.value : '',
                savedBy: window.currentUser?.email || window.userRole,
                savedByUid: window.currentUser?.uid || '',
                className: activeClass || '',
                classKey: _attClassKey(activeClass || 'all'),
                savedAt: Date.now()
            };
        }
    });

    try {
        await update(ref(window.db, basePath), updates);
        Swal.fire({ icon:'success', title:'Đã lưu điểm danh!', timer:1500, showConfirmButton:false });
    } catch (error) {
        Swal.fire('Lỗi', error.message, 'error');
    }
}

export function openAttendanceStats() {
    // Populate class filter
    const allClasses = [...new Set(
        activeStudentValues().map(s => s.classRoom || s.class).filter(Boolean)
    )].sort((a,b) => a.localeCompare(b, 'vi', { numeric: true }));
    const sel = document.getElementById('stats-class-filter');
    if (sel) {
        sel.innerHTML = `<option value="">Tất cả lớp</option>` +
            allClasses.map(c => `<option value="${c}">${c}</option>`).join('');
    }

    // Populate year filter — tạo danh sách năm học từ 2020 đến hiện tại
    const yearSel = document.getElementById('stats-year-filter');
    if (yearSel) {
        const curY = _attYear();
        const now  = new Date();
        const endY = now.getMonth() >= 7 ? now.getFullYear()+1 : now.getFullYear();
        let yearOpts = '';
        for (let y = endY-1; y >= 2020; y--) {
            const yk = `${y}_${y+1}`;
            yearOpts += `<option value="${yk}" ${yk===curY?'selected':''}>${y}-${y+1}</option>`;
        }
        yearSel.innerHTML = yearOpts;
    }

    // Admin only shows class filter
    const wrap = document.getElementById('stats-class-filter-wrap');
    if (wrap) wrap.style.display = window.userRole === 'admin' ? '' : 'none';

    document.getElementById('modal-attendance-stats').style.display = 'flex';
}

export async function loadAttendanceStats() {
    const fromDate   = document.getElementById('stats-from-date').value;
    const toDate     = document.getElementById('stats-to-date').value;
    const classFilter = document.getElementById('stats-class-filter')?.value || '';

    if (!fromDate || !toDate) {
        Swal.fire('Lỗi', 'Vui lòng chọn khoảng thời gian', 'warning');
        return;
    }

    document.getElementById('attendance-stats-result').innerHTML =
        '<div style="text-align:center;padding:30px;color:#64748b"><i class="fas fa-spinner fa-spin" style="font-size:1.5rem"></i></div>';

    try {
        const { ref, get, child } = window;

        // Build danh sách học sinh
        let students = activeStudentValues();
        if (window.userRole === 'teacher') {
            const teacherClassName = _resolveTeacherClassName();
            students = students.filter(s => _sameClass(s, teacherClassName));
        } else if (classFilter) {
            students = students.filter(s => _sameClass(s, classFilter));
        }

        // Sắp xếp danh sách học sinh đồng bộ chuẩn với danh sách Quản lý học sinh (A → Z)
        const cmpFn = typeof compareStudentNames === 'function' ? compareStudentNames : window.compareStudentNames;
        if (classFilter || window.userRole === 'teacher') {
            students = _sortAttendanceStudents(students);
        } else {
            students.sort((a, b) => {
                const clsA = a.classRoom || a.class || '';
                const clsB = b.classRoom || b.class || '';
                const clsCmp = clsA.localeCompare(clsB, 'vi', { numeric: true });
                if (clsCmp !== 0) return clsCmp;
                if (cmpFn) return cmpFn(a, b, 'name_az');
                return _compareAttendanceNames(a.name || '', b.name || '');
            });
        }

        // Build dateRange
        const dates = [];
        let d = new Date(fromDate);
        const end = new Date(toDate);
        while (d <= end) {
            dates.push(d.toISOString().split('T')[0]);
            d.setDate(d.getDate() + 1);
        }

        // Fetch attendance
        // Lấy năm học từ filter (mặc định = năm hiện tại)
        const statsYear = document.getElementById('stats-year-filter')?.value || _attYear();

        const classesToFetch = classFilter
            ? [classFilter]
            : [...new Set(students.map(s => s.classRoom || s.class).filter(Boolean))];

        const attSnaps = await Promise.all(
            classesToFetch.map(cls => _readAttendanceClass(statsYear, cls))
        );
        const attByClass = {};
        classesToFetch.forEach((cls, idx) => {
            attByClass[cls] = attSnaps[idx].val() || {};
        });

        const statsPerStudent = students.map(st => {
            const cls      = st.classRoom || st.class || '';
            const attData  = attByClass[cls] || {};
            let present=0, absentP=0, absentKP=0, total=0;
            dates.forEach(date => {
                const dayData = attData[date];
                if (!dayData) return;
                const id  = st.code || st.id;
                const rec = dayData[id];
                if (!rec) return;
                total++;
                if (rec.status === 'present') present++;
                else if (rec.status === 'p')  absentP++;
                else if (rec.status === 'kp') absentKP++;
            });
            const attendanceRate = total > 0 ? Math.round((present / total) * 100) : null;
            return { student:st, present, absentP, absentKP, total, attendanceRate };
        });

        const totalPresent  = statsPerStudent.reduce((s,r)=>s+r.present,  0);
        const totalAbsentP  = statsPerStudent.reduce((s,r)=>s+r.absentP,  0);
        const totalAbsentKP = statsPerStudent.reduce((s,r)=>s+r.absentKP, 0);
        const highAbsent    = statsPerStudent.filter(r => r.absentKP >= 3);

        document.getElementById('attendance-stats-result').innerHTML = `
            <div class="grid-4" style="margin-bottom:20px">
                <div class="stat-card" style="border-left-color:var(--success)">
                    <div style="color:#64748b;font-size:0.85rem">Tổng buổi có mặt</div>
                    <div class="value" style="color:var(--success)">${totalPresent}</div>
                </div>
                <div class="stat-card" style="border-left-color:var(--warning)">
                    <div style="color:#64748b;font-size:0.85rem">Vắng có phép (P)</div>
                    <div class="value" style="color:var(--warning)">${totalAbsentP}</div>
                </div>
                <div class="stat-card" style="border-left-color:var(--danger)">
                    <div style="color:#64748b;font-size:0.85rem">Vắng không phép (KP)</div>
                    <div class="value" style="color:var(--danger)">${totalAbsentKP}</div>
                </div>
                <div class="stat-card" style="border-left-color:#8b5cf6">
                    <div style="color:#64748b;font-size:0.85rem">HS vắng KP ≥ 3 buổi</div>
                    <div class="value" style="color:#8b5cf6">${highAbsent.length}</div>
                </div>
            </div>

            ${highAbsent.length > 0 ? `
            <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:15px;margin-bottom:20px">
                <h4 style="color:#dc2626;margin-bottom:10px">
                    <i class="fas fa-exclamation-triangle"></i> Học sinh vắng không phép nhiều (≥3 buổi)
                </h4>
                <div style="display:flex;flex-wrap:wrap;gap:8px">
                    ${highAbsent.map(r => `
                        <span style="background:white;border:1px solid #fecaca;border-radius:20px;padding:4px 12px;font-size:0.85rem">
                            ${r.student.name} (${r.student.classRoom || r.student.class}) - ${r.absentKP} buổi KP
                        </span>
                    `).join('')}
                </div>
            </div>` : ''}

            <div class="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>STT</th><th>Họ tên</th><th>Lớp</th>
                            <th style="text-align:center;color:var(--success)">Có mặt</th>
                            <th style="text-align:center;color:var(--warning)">Vắng P</th>
                            <th style="text-align:center;color:var(--danger)">Vắng KP</th>
                            <th style="text-align:center">Tổng ngày</th>
                            <th style="text-align:center">Tỉ lệ đi học</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${statsPerStudent.map((r,i) => `
                        <tr style="${r.absentKP >= 3 ? 'background:#fff5f5' : ''}">
                            <td>${i+1}</td>
                            <td style="font-weight:600">${r.student.name}</td>
                            <td>${r.student.classRoom || r.student.class || '-'}</td>
                            <td style="text-align:center;color:var(--success);font-weight:600">${r.present}</td>
                            <td style="text-align:center;color:var(--warning);font-weight:600">${r.absentP}</td>
                            <td style="text-align:center;color:var(--danger);font-weight:600">${r.absentKP}${r.absentKP >= 3 ? ' ⚠️' : ''}</td>
                            <td style="text-align:center">${r.total}</td>
                            <td style="text-align:center">
                                ${r.attendanceRate !== null ? `
                                    <span style="padding:3px 10px;border-radius:20px;font-size:0.85rem;font-weight:600;
                                        background:${r.attendanceRate >= 90 ? '#dcfce7' : r.attendanceRate >= 70 ? '#fef9c3' : '#fee2e2'};
                                        color:${r.attendanceRate >= 90 ? '#166534' : r.attendanceRate >= 70 ? '#854d0e' : '#991b1b'}">
                                        ${r.attendanceRate}%
                                    </span>` : '<span style="color:#94a3b8">Chưa có</span>'}
                            </td>
                        </tr>`).join('')}
                    </tbody>
                </table>
            </div>
            <div style="margin-top:15px;text-align:right">
                <button class="btn btn-success" onclick="exportAttendanceStats()">
                    <i class="fas fa-file-excel"></i> Xuất Excel
                </button>
            </div>`;

        window._lastAttendanceStats = { statsPerStudent, fromDate, toDate, classFilter };

    } catch (error) {
        document.getElementById('attendance-stats-result').innerHTML = `
            <div style="text-align:center;padding:30px;color:#dc2626">
                <i class="fas fa-exclamation-circle" style="font-size:2rem;margin-bottom:10px;display:block"></i>
                Lỗi tải dữ liệu: ${error.message}
            </div>`;
    }
}

export function exportAttendanceStats() {
    if (!window._lastAttendanceStats) return;
    const { statsPerStudent, fromDate, toDate, classFilter } = window._lastAttendanceStats;
    const data = statsPerStudent.map((r,i) => ({
        'STT': i+1, 'Họ tên': r.student.name,
        'Lớp': r.student.classRoom || r.student.class || '',
        'Mã HS': r.student.code || r.student.id,
        'Có mặt': r.present, 'Vắng P': r.absentP, 'Vắng KP': r.absentKP,
        'Tổng ngày': r.total,
        'Tỉ lệ đi học (%)': r.attendanceRate !== null ? r.attendanceRate : 'Chưa có'
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), 'Diem_Danh');
    XLSX.writeFile(wb, `Thong_Ke_Diem_Danh_${fromDate}_${toDate}${classFilter ? '_'+classFilter : ''}.xlsx`);
}

// ══════════════════════════════════════════════════════════════════════════════
// TIỆN ÍCH ĐỒNG BỘ ĐIỂM DANH CHO QUẢN LÝ ĐIỂM VÀ HỌC BẠ
// ══════════════════════════════════════════════════════════════════════════════

export function getSemesterFromDate(dateStr, schoolYearStr) {
    if (!dateStr) return 'hk1';
    const parts = String(schoolYearStr || '').split(/[-_]/);
    const startYear = parseInt(parts[0], 10) || new Date().getFullYear();
    const endYear = parseInt(parts[1], 10) || (startYear + 1);

    const d = new Date(dateStr);
    const y = d.getFullYear();
    const m = d.getMonth() + 1; // 1 - 12
    const day = d.getDate();

    // HK1: từ 01/08 của năm đầu đến 15/01 của năm sau
    if (y === startYear && m >= 8) return 'hk1';
    if (y === endYear && m === 1 && day <= 15) return 'hk1';
    // HK2: từ 16/01 đến 31/07 của năm sau
    if (y === endYear && (m > 1 || (m === 1 && day > 15))) return 'hk2';

    return (m >= 8 || m === 1) ? 'hk1' : 'hk2';
}

export async function getAttendanceAbsenceSummary(yearKey, className, studentId, semester = 'all') {
    if (!yearKey || !className) return { coPhep: 0, khongPhep: 0, totalDays: 0 };
    try {
        const yk = String(yearKey).replace('-', '_');
        const snap = await _readAttendanceClass(yk, className);
        const classData = snap.val() || {};
        let coPhep = 0, khongPhep = 0, totalDays = 0;

        Object.entries(classData).forEach(([dateStr, dateRecords]) => {
            if (!dateRecords || typeof dateRecords !== 'object') return;
            const sem = getSemesterFromDate(dateStr, yk);
            if (semester && semester !== 'all' && sem !== semester) return;

            // Tìm record của học sinh (khớp id, code, hoặc key)
            let rec = dateRecords[studentId];
            if (!rec) {
                const sObj = window.localData?.students?.[studentId];
                if (sObj) {
                    rec = (sObj.code && dateRecords[sObj.code]) || (sObj.id && dateRecords[sObj.id]);
                }
            }

            if (!rec) return;
            totalDays++;
            if (rec.status === 'p' || rec.status === 'cp') {
                coPhep++;
            } else if (rec.status === 'kp') {
                khongPhep++;
            }
        });

        return { coPhep, khongPhep, totalDays };
    } catch (e) {
        console.warn('[attendance] getAttendanceAbsenceSummary error:', e);
        return { coPhep: 0, khongPhep: 0, totalDays: 0 };
    }
}

window.getSemesterFromDate = getSemesterFromDate;
window.getAttendanceAbsenceSummary = getAttendanceAbsenceSummary;

