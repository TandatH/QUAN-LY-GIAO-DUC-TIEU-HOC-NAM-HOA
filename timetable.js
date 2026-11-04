import { activeStudentValues, isActiveStudent } from "./studentstatus.js?v=5.26.1";
import { timetablePath, readYearScoped } from "./yearscope.js";
// ═══════════════════════════════════════════════════════
// timetable.js — Thời khóa biểu (v2: lớp động từ DB)
// ═══════════════════════════════════════════════════════

// ── Chuẩn hóa chuỗi tiếng Việt không dấu, chữ thường ─────────────────────────────
function normalizeVi(str) {
    return String(str || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd').replace(/Đ/g, 'D')
        .trim().toLowerCase();
}

// ── Kiểm tra môn học có khớp nhau không (hỗ trợ alias môn tiểu học) ───────────────
function isSubjectMatch(s1, s2) {
    const n1 = normalizeVi(s1);
    const n2 = normalizeVi(s2);
    if (!n1 || !n2) return false;
    if (n1 === n2) return true;

    const aliasGroups = [
        ['tieng anh', 'ngoai ngu 1', 'tieng anh 1', 'tieng anh 2', 'english'],
        ['giao duc the chat', 'the duc'],
        ['nghe thuat (am nhac)', 'am nhac', 'nghe thuat - am nhac', 'nghe thuat'],
        ['nghe thuat (my thuat)', 'my thuat', 'nghe thuat - my thuat'],
        ['tin hoc', 'tin hoc va cong nghe', 'tin hoc - cong nghe'],
        ['lich su va dia li', 'lich su & dia li', 'su - dia', 'lich su', 'dia li'],
        ['tieng viet'],
        ['toan'],
        ['dao duc'],
        ['khoa hoc'],
        ['cong nghe'],
        ['hoat dong trai nghiem', 'trai nghiem'],
    ];

    for (const group of aliasGroups) {
        if (group.includes(n1) && group.includes(n2)) return true;
    }

    return n1.includes(n2) || n2.includes(n1);
}

// ── Kiểm tra tên giáo viên có khớp nhau không ─────────────────────────────────
function isTeacherNameMatch(t1, t2) {
    const n1 = normalizeVi(t1);
    const n2 = normalizeVi(t2);
    if (!n1 || !n2) return false;
    if (n1 === n2) return true;
    if (n1.includes(n2) || n2.includes(n1)) return true;

    const words1 = n1.split(/\s+/).filter(Boolean);
    const words2 = n2.split(/\s+/).filter(Boolean);
    const last1  = words1[words1.length - 1];
    const last2  = words2[words2.length - 1];
    if (last1 && last2 && last1 === last2) return true;

    return false;
}

// Lấy danh sách khối và lớp từ cả students và timetables thực tế
function getGradeClassMap() {
    const map = {}; // { '1': ['1/1','1/2',...], '2': [...], ... }

    // 1. Trích xuất từ học sinh (nếu có)
    activeStudentValues().forEach(s => {
        const cls = s.classRoom || s.class || '';
        if (!cls) return;
        const gradeMatch = cls.match(/^(\d+)/);
        if (!gradeMatch) return;
        const grade = gradeMatch[1];
        if (!map[grade]) map[grade] = new Set();
        map[grade].add(cls);
    });

    // 2. Trích xuất bổ sung từ timetables (đảm bảo không bị thiếu lớp khi students chưa load)
    const timetables = window.localData?.timetables || {};
    Object.keys(timetables).forEach(rawKey => {
        if (!rawKey || typeof timetables[rawKey] !== 'object') return;
        if (/^\d{4}_\d{4}$/.test(rawKey)) return; // Bỏ qua node năm học 2025_2026

        let clsName = rawKey;
        if (/^\d+_\d+$/.test(rawKey)) {
            clsName = rawKey.replace('_', '/');
        }
        const gradeMatch = clsName.match(/^(\d+)/);
        if (!gradeMatch) return;
        const grade = gradeMatch[1];
        if (!map[grade]) map[grade] = new Set();
        map[grade].add(clsName);
    });

    // Convert sets to sorted arrays
    const result = {};
    Object.keys(map).sort((a,b) => parseInt(a)-parseInt(b)).forEach(g => {
        result[g] = [...map[g]].sort((a,b) => a.localeCompare(b,'vi'));
    });
    return result;
}

// ── Thu thập lịch dạy của GV bộ môn từ tất cả các lớp ────────────────────────
export function collectTeacherSchedule(filterMode = 'auto') {
    const timetables = window.localData?.timetables || {};
    const teacherSubject = (window.teacherSubject || window.currentUserProfile?.assignedSubject || '').trim();
    const teacherName = (window.currentUserProfile?.name || window.currentUserProfile?.displayName || window.currentUser?.displayName || '').trim();
    const gradesArr = window.teacherGrades
        ? (Array.isArray(window.teacherGrades) ? window.teacherGrades : Object.values(window.teacherGrades)).map(String)
        : [];
    const allowedGrades = new Set(gradesArr);

    const scheduleMap = {}; // { '0_1': [ { className, subject, teacher, room, grade } ] }
    const taughtClasses = new Set();
    let totalSlots = 0;

    Object.entries(timetables).forEach(([rawClassKey, classSlots]) => {
        if (!classSlots || typeof classSlots !== 'object' || /^\d{4}_\d{4}$/.test(rawClassKey)) return;

        let className = rawClassKey;
        if (/^\d+_\d+$/.test(rawClassKey)) {
            className = rawClassKey.replace('_', '/');
        }
        const gradeMatch = className.match(/^(\d+)/);
        const grade = gradeMatch ? gradeMatch[1] : '';

        // Nếu GV có giới hạn khối cụ thể và lớp có khối, lọc theo khối
        if (allowedGrades.size > 0 && grade && !allowedGrades.has(grade)) {
            return;
        }

        Object.entries(classSlots).forEach(([slotKey, slotData]) => {
            if (!slotData || typeof slotData !== 'object') return;
            const slotSubject = String(slotData.subject || '').trim();
            const slotTeacher = String(slotData.teacher || '').trim();
            const slotRoom    = String(slotData.room    || '').trim();

            if (!slotSubject) return;

            let isMatch = false;

            if (filterMode === 'subject_only') {
                isMatch = teacherSubject ? isSubjectMatch(slotSubject, teacherSubject) : true;
            } else {
                // Auto mode: kết hợp tên GV và môn học
                const teacherMatches = slotTeacher ? isTeacherNameMatch(slotTeacher, teacherName) : false;
                const subjectMatches = teacherSubject ? isSubjectMatch(slotSubject, teacherSubject) : true;

                if (slotTeacher && teacherMatches) {
                    isMatch = true;
                } else if (!slotTeacher && subjectMatches) {
                    isMatch = true;
                } else if (teacherMatches && subjectMatches) {
                    isMatch = true;
                }
            }

            if (isMatch) {
                if (!scheduleMap[slotKey]) scheduleMap[slotKey] = [];
                scheduleMap[slotKey].push({
                    className,
                    rawClassKey,
                    grade,
                    subject: slotSubject,
                    teacher: slotTeacher || teacherName,
                    room: slotRoom
                });
                taughtClasses.add(className);
                totalSlots++;
            }
        });
    });

    return {
        scheduleMap,
        taughtClasses: [...taughtClasses].sort((a,b) => a.localeCompare(b, 'vi')),
        totalSlots,
        teacherSubject,
        teacherName,
        gradesArr,
        filterMode
    };
}

export async function renderTimetable() {
    const content = document.getElementById('content');

    // Đảm bảo timetables + scheduleSettings đã load xong trước khi render
    const needReload = !window.localData.timetables || Object.keys(window.localData.timetables).length === 0
                    || !window.TIMETABLE_PERIODS?.morning?.length;
    if (needReload) {
        content.innerHTML = `<div class="card" style="text-align:center;padding:40px">
            <i class="fas fa-spinner fa-spin" style="font-size:1.5rem;color:var(--primary)"></i>
            <p style="color:#64748b;margin-top:10px">Đang tải thời khóa biểu...</p>
        </div>`;
        try {
            const { get, child, ref } = window;
            const [ttResult, ssSnap] = await Promise.all([
                readYearScoped(timetablePath(), 'timetables'),
                get(child(ref(window.db), 'scheduleSettings')),
            ]);
            window.localData.timetables = ttResult.value || {};
            window.localData.scheduleSettings = ssSnap.val();
            window.TIMETABLE_PERIODS = window.localData.scheduleSettings || window.DEFAULT_PERIODS;
        } catch(e) {
            content.innerHTML = `<div class="card"><p style="color:#dc2626">Lỗi tải dữ liệu: ${e.message}</p></div>`;
            return;
        }
    }

    // Tải bổ sung học sinh an toàn (không gọi root students bừa bãi tránh lỗi Permission denied)
    if (!window.localData.students || Object.keys(window.localData.students).length === 0) {
        try {
            const { get, ref, query, orderByChild, equalTo } = window;
            if (window.userRole === 'admin') {
                const snap = await get(ref(window.db, 'students'));
                window.localData.students = snap.val() || {};
                window._allStudents = activeStudentValues();
            } else if (window.userRole === 'subject_teacher') {
                const grades = [...new Set((window.teacherGrades || []).map(String).filter(g => /^[1-5]$/.test(g)))];
                if (grades.length) {
                    const snaps = await Promise.all(
                        grades.map(g => get(query(ref(window.db, 'students'), orderByChild('currentGrade'), equalTo(g))))
                    );
                    const merged = {};
                    snaps.forEach(s => Object.assign(merged, s.val() || {}));
                    window.localData.students = merged;
                    window._allStudents = activeStudentValues();
                }
            }
        } catch(e) {
            console.warn('[Timetable] Tải bổ sung học sinh chưa xong, tiếp tục render từ timetables:', e.message);
        }
    }

    const gradeMap = getGradeClassMap();
    const grades   = Object.keys(gradeMap);

    if (window.userRole === 'admin') {
        if (!grades.length) {
            content.innerHTML = '<div class="card"><p style="color:#94a3b8">Chưa có lớp nào. Vui lòng nhập dữ liệu học sinh hoặc tạo thời khóa biểu.</p></div>';
            return;
        }

        const firstGrade = grades[0];
        content.innerHTML = `
            <div class="card">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:10px">
                    <h3><i class="fas fa-calendar-alt"></i> Quản lý Thời khóa biểu</h3>
                    <button class="btn btn-primary" onclick="openScheduleSettings()">
                        <i class="fas fa-cog"></i> Cài đặt thời gian tiết
                    </button>
                </div>
                <!-- Tabs khối -->
                <div class="grade-tabs" id="grade-tabs">
                    ${grades.map((g, i) => `
                        <div class="grade-tab ${i===0?'active':''}" data-grade="${g}" onclick="selectGrade('${g}')">
                            Khối ${g}
                        </div>`).join('')}
                </div>
                <div id="timetable-content"></div>
            </div>`;

        window.currentGrade = firstGrade;
        window._gradeMap = gradeMap;
        renderGradeTimetable(firstGrade);

    } else if (window.userRole === 'teacher') {
        if (!window.teacherClass) {
            content.innerHTML = '<div class="card"><p>Bạn chưa được phân công lớp nào.</p></div>';
            return;
        }
        content.innerHTML = `
            <div class="card">
                <h3><i class="fas fa-calendar-alt"></i> Thời khóa biểu lớp ${window.teacherClass}</h3>
                <div id="timetable-content"></div>
            </div>`;
        renderClassTimetable(window.teacherClass, false);

    } else if (window.userRole === 'parent') {
        const parentSId = window.parentStudentId;
        if (!parentSId) {
            content.innerHTML = '<div class="card"><p>Không tìm thấy thông tin học sinh.</p></div>';
            return;
        }
        let studentClass = null;
        for (let key in window.localData.students) {
            const s = window.localData.students[key];
            if (s.code===parentSId || s.id===parentSId || key===parentSId) {
                studentClass = s.classRoom || s.class;
                break;
            }
        }
        if (!studentClass) {
            content.innerHTML = '<div class="card"><p>Không tìm thấy lớp học của con bạn. Vui lòng liên hệ Admin.</p></div>';
            return;
        }
        content.innerHTML = `
            <div class="card">
                <h3><i class="fas fa-calendar-alt"></i> Thời khóa biểu lớp ${studentClass}</h3>
                <div id="timetable-content"></div>
            </div>`;
        renderClassTimetable(studentClass, false);

    } else if (window.userRole === 'subject_teacher') {
        renderSubjectTeacherTimetableView('personal');
    }
}

// ══════════════════════════════════════════════════════════════════════════════
// GIAO DIỆN THỜI KHÓA BIỂU DÀNH RIÊNG CHO GIÁO VIÊN BỘ MÔN
// ══════════════════════════════════════════════════════════════════════════════
export function renderSubjectTeacherTimetableView(activeTab = 'personal', filterMode = 'auto') {
    window._subjectTeacherTimetableTab = activeTab;
    window._subjectTeacherFilterMode = filterMode;

    const content = document.getElementById('content');
    if (!content) return;

    const scheduleData = collectTeacherSchedule(filterMode);
    const teacherName = scheduleData.teacherName || 'Giáo viên bộ môn';
    const teacherSubject = scheduleData.teacherSubject || 'Chưa phân công môn';
    const gradesText = scheduleData.gradesArr.length ? `Khối ${scheduleData.gradesArr.join(', ')}` : 'Tất cả khối';

    content.innerHTML = `
        <div class="card timetable-card-wrapper">
            <!-- Header điều hướng & In -->
            <div class="timetable-top-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:18px">
                <div style="display:flex;align-items:center;gap:10px">
                    <h3 style="margin:0"><i class="fas fa-calendar-alt" style="color:var(--primary)"></i> Thời khóa biểu — ${teacherName}</h3>
                </div>
                <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
                    <button type="button" class="btn btn-outline btn-sm" onclick="printTeacherSchedule()">
                        <i class="fas fa-print"></i> In lịch dạy
                    </button>
                </div>
            </div>

            <!-- Thẻ thông tin GV & Thống kê tiết -->
            <div class="teacher-info-banner" style="background:linear-gradient(135deg,#eff6ff 0%,#f0fdf4 100%);border:1px solid #bfdbfe;border-radius:10px;padding:14px 18px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:15px">
                <div style="display:flex;align-items:center;gap:18px;flex-wrap:wrap">
                    <div>
                        <div style="font-size:0.75rem;color:#64748b;font-weight:600;text-transform:uppercase">Môn phụ trách</div>
                        <div style="font-size:1.1rem;font-weight:700;color:#1e3a8a"><i class="fas fa-book-reader"></i> ${teacherSubject}</div>
                    </div>
                    <div style="width:1px;height:32px;background:#cbd5e1"></div>
                    <div>
                        <div style="font-size:0.75rem;color:#64748b;font-weight:600;text-transform:uppercase">Phạm vi khối</div>
                        <div style="font-size:0.95rem;font-weight:600;color:#334155"><i class="fas fa-layer-group"></i> ${gradesText}</div>
                    </div>
                </div>
                <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
                    <div class="stat-pill" style="background:#dbeafe;color:#1e40af;padding:6px 14px;border-radius:20px;font-size:0.85rem;font-weight:600;display:inline-flex;align-items:center;gap:6px">
                        <i class="fas fa-clock"></i> <strong>${scheduleData.totalSlots}</strong> tiết / tuần
                    </div>
                    <div class="stat-pill" style="background:#dcfce7;color:#166534;padding:6px 14px;border-radius:20px;font-size:0.85rem;font-weight:600;display:inline-flex;align-items:center;gap:6px">
                        <i class="fas fa-chalkboard-teacher"></i> <strong>${scheduleData.taughtClasses.length}</strong> lớp giảng dạy
                    </div>
                </div>
            </div>

            <!-- Tabs chuyển đổi: Lịch dạy của tôi vs Xem theo lớp -->
            <div class="grade-tabs" style="margin-bottom:16px">
                <div class="grade-tab ${activeTab==='personal'?'active':''}" onclick="switchTimetableViewTab('personal')">
                    <i class="fas fa-user-clock"></i> 📅 Lịch dạy của tôi
                </div>
                <div class="grade-tab ${activeTab==='classes'?'active':''}" onclick="switchTimetableViewTab('classes')">
                    <i class="fas fa-school"></i> 🏫 Xem theo lớp
                </div>
            </div>

            <!-- Khu vực nội dung hiển thị chính -->
            <div id="timetable-content-area"></div>
        </div>
    `;

    const area = document.getElementById('timetable-content-area');
    if (activeTab === 'personal') {
        renderTeacherPersonalSchedule(scheduleData, area);
    } else {
        renderSubjectTeacherClassView(area);
    }
}

export function switchTimetableViewTab(tab) {
    const filter = window._subjectTeacherFilterMode || 'auto';
    renderSubjectTeacherTimetableView(tab, filter);
}

export function selectTeacherScheduleFilter(mode) {
    const tab = window._subjectTeacherTimetableTab || 'personal';
    renderSubjectTeacherTimetableView(tab, mode);
}

export function printTeacherSchedule() {
    window.print();
}

// ── Render bảng Lịch dạy cá nhân tuần của Giáo viên bộ môn ─────────────────────
function renderTeacherPersonalSchedule(scheduleData, container) {
    const { scheduleMap, totalSlots, teacherSubject, teacherName, filterMode, taughtClasses } = scheduleData;

    const morningPeriods   = (window.TIMETABLE_PERIODS.morning   || window.DEFAULT_PERIODS.morning);
    const afternoonPeriods = (window.TIMETABLE_PERIODS.afternoon || window.DEFAULT_PERIODS.afternoon);

    if (!morningPeriods.length && !afternoonPeriods.length) {
        container.innerHTML = '<p style="color:#64748b;padding:20px">Chưa có cấu hình thời gian tiết học.</p>';
        return;
    }

    let filterToolbar = `
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:16px;background:#f8fafc;padding:10px 14px;border-radius:8px;border:1px solid #e2e8f0">
            <div style="font-size:0.85rem;color:#475569">
                ${taughtClasses.length ? `Đang dạy các lớp: <strong>${taughtClasses.join(', ')}</strong>` : '<em>Chưa phát hiện lớp nào được xếp lịch</em>'}
            </div>
            <div style="display:flex;align-items:center;gap:8px">
                <span style="font-size:0.82rem;color:#64748b">Bộ lọc:</span>
                <select class="form-control" style="width:auto;padding:4px 8px;font-size:0.82rem" onchange="selectTeacherScheduleFilter(this.value)">
                    <option value="auto" ${filterMode==='auto'?'selected':''}>Tiết của tôi (Khớp tên & môn)</option>
                    <option value="subject_only" ${filterMode==='subject_only'?'selected':''}>Tất cả tiết môn "${teacherSubject || 'Bộ môn'}"</option>
                </select>
            </div>
        </div>
    `;

    if (totalSlots === 0) {
        container.innerHTML = filterToolbar + `
            <div style="text-align:center;padding:40px 20px;background:#f8fafc;border-radius:10px;border:1px dashed #cbd5e1;color:#64748b">
                <i class="fas fa-calendar-times" style="font-size:2.5rem;color:#94a3b8;margin-bottom:12px;display:block"></i>
                <h4 style="color:#334155;margin-bottom:6px">Chưa tìm thấy tiết dạy trong thời khóa biểu</h4>
                <p style="font-size:0.88rem;max-width:560px;margin:0 auto 15px">
                    Hệ thống chưa tìm thấy tiết nào khớp với môn <strong>${teacherSubject}</strong> hoặc tên giáo viên <strong>${teacherName}</strong> trong thời khóa biểu hiện tại.
                </p>
                <div style="display:flex;justify-content:center;gap:10px;flex-wrap:wrap">
                    <button class="btn btn-outline btn-sm" onclick="selectTeacherScheduleFilter('subject_only')">
                        <i class="fas fa-filter"></i> Thử lọc theo tất cả tiết môn ${teacherSubject}
                    </button>
                    <button class="btn btn-primary btn-sm" onclick="switchTimetableViewTab('classes')">
                        <i class="fas fa-school"></i> Chuyển sang xem theo từng lớp
                    </button>
                </div>
            </div>
        `;
        return;
    }

    const buildSession = (periods, label, labelColor) => {
        if (!periods.length) return '';
        let html = `<h4 style="margin-bottom:15px;color:${labelColor};border-left:4px solid ${labelColor};padding-left:10px">${label}</h4>`;
        html += '<div class="timetable-container"><div class="timetable-grid">';
        html += '<div class="timetable-header">Tiết</div>';
        window.WEEKDAYS.forEach(day => { html += `<div class="timetable-header">${day}</div>`; });

        periods.forEach(period => {
            html += `<div class="timetable-time">${period.name}<br><small>${period.time}</small></div>`;
            window.WEEKDAYS.forEach((day, dayIndex) => {
                const slotKey = `${dayIndex}_${period.id}`;
                const slots   = scheduleMap[slotKey] || [];
                html += `<div class="timetable-cell ${slots.length ? 'my-teaching-slot' : ''}">`;

                if (slots.length === 1) {
                    const item = slots[0];
                    html += `
                        <div class="teacher-slot-class-badge" style="background:#1d4ed8;color:white;padding:3px 8px;border-radius:6px;font-weight:700;font-size:0.85rem;margin-bottom:4px">
                            Lớp ${item.className}
                        </div>
                        <div class="timetable-subject" style="font-size:0.82rem;font-weight:600;color:#1e293b">${item.subject}</div>
                        ${item.room ? `<div class="timetable-teacher" style="font-size:0.75rem;color:#475569"><i class="fas fa-door-open"></i> P: ${item.room}</div>` : ''}
                    `;
                } else if (slots.length > 1) {
                    // Trùng tiết
                    html += `
                        <div style="background:#fee2e2;border:1px solid #f87171;color:#b91c1c;padding:3px 6px;border-radius:6px;font-size:0.75rem;font-weight:700;margin-bottom:3px">
                            <i class="fas fa-exclamation-triangle"></i> Trùng lịch (${slots.length} lớp)
                        </div>
                    `;
                    slots.forEach(item => {
                        html += `<div style="font-size:0.78rem;font-weight:600;color:#b91c1c">• Lớp ${item.className} (${item.room || item.subject})</div>`;
                    });
                } else {
                    html += `<div class="empty-slot">-</div>`;
                }

                html += '</div>';
            });
        });
        html += '</div></div>';
        return html;
    };

    container.innerHTML =
        filterToolbar +
        buildSession(morningPeriods, '⛅ Buổi Sáng', 'var(--primary)') +
        (afternoonPeriods.length
            ? `<div style="margin-top:20px"></div>` +
              buildSession(afternoonPeriods, '🌙 Buổi Chiều', 'var(--warning)')
            : '');
}

// ── Render chế độ xem TKB theo từng lớp cho Giáo viên bộ môn (Chỉ đọc) ────────
function renderSubjectTeacherClassView(container) {
    const gradeMap = window._gradeMap || getGradeClassMap();
    window._gradeMap = gradeMap;

    const gradesArr = window.teacherGrades
        ? (Array.isArray(window.teacherGrades) ? window.teacherGrades : Object.values(window.teacherGrades)).map(String)
        : [];
    const allowedGrades = new Set(gradesArr);

    const filteredGradeMap = {};
    Object.keys(gradeMap).forEach(g => {
        if (!allowedGrades.size || allowedGrades.has(g)) {
            filteredGradeMap[g] = gradeMap[g];
        }
    });

    const filteredGrades = Object.keys(filteredGradeMap);
    if (!filteredGrades.length) {
        // Fallback hiển thị toàn bộ khối nếu không khớp
        Object.keys(gradeMap).forEach(g => { filteredGradeMap[g] = gradeMap[g]; });
    }

    const activeGrades = Object.keys(filteredGradeMap);
    if (!activeGrades.length) {
        container.innerHTML = '<p style="color:#94a3b8;padding:20px">Chưa có dữ liệu lớp học nào trong hệ thống.</p>';
        return;
    }

    const firstGrade = window.currentGrade && filteredGradeMap[window.currentGrade] ? window.currentGrade : activeGrades[0];
    window.currentGrade = firstGrade;
    window._gradeMap = filteredGradeMap;

    container.innerHTML = `
        <div style="margin-bottom:15px">
            <div style="font-size:0.85rem;color:#64748b;margin-bottom:8px">
                <i class="fas fa-info-circle"></i> Chế độ xem theo lớp (chỉ đọc): Xem toàn bộ lịch học của lớp học sinh và các tiết bạn giảng dạy.
            </div>
            <div class="grade-tabs" id="subject-teacher-grade-tabs">
                ${activeGrades.map(g => `
                    <div class="grade-tab ${g===firstGrade?'active':''}" data-grade="${g}" onclick="selectGrade('${g}')">
                        Khối ${g}
                    </div>`).join('')}
            </div>
        </div>
        <div id="timetable-content"></div>
    `;

    renderGradeTimetable(firstGrade);
}

export function selectGrade(grade) {
    window.currentGrade = grade;
    document.querySelectorAll('.grade-tab').forEach(tab => {
        const isMatch = tab.dataset.grade === String(grade) || tab.textContent.trim().replace(/\s+/g,' ') === `Khối ${grade}`;
        if (tab.dataset.grade) {
            tab.classList.toggle('active', isMatch);
        }
    });
    renderGradeTimetable(grade);
}

export function renderGradeTimetable(grade) {
    const gradeMap = window._gradeMap || getGradeClassMap();
    window._gradeMap = gradeMap;
    const classes   = gradeMap[grade] || [];
    const container = document.getElementById('timetable-content');
    if (!container) return;

    if (!classes.length) {
        container.innerHTML = `<p style="color:#94a3b8;padding:20px">Khối ${grade} chưa có lớp nào.</p>`;
        return;
    }

    const firstClass = classes[0];
    container.innerHTML = `
        <div class="class-selector" style="margin-top:15px">
            ${classes.map((cls, i) => `
                <div class="class-btn ${i===0?'active':''}" data-class="${cls}" onclick="selectClass('${cls}')">
                    Lớp ${cls}
                </div>`).join('')}
        </div>
        <div id="class-timetable-view"></div>`;

    window.currentClass = firstClass;
    const canEdit = window.userRole === 'admin';
    renderClassTimetable(firstClass, canEdit);
}

export function selectClass(className) {
    window.currentClass = className;
    document.querySelectorAll('.class-btn').forEach(btn => {
        const isMatch = btn.dataset.class === className || btn.textContent.trim().replace(/\s+/g,' ') === `Lớp ${className}`;
        btn.classList.toggle('active', isMatch);
    });
    const canEdit = window.userRole === 'admin';
    renderClassTimetable(className, canEdit);
}

export function renderClassTimetable(className, editable = false) {
    const container = document.getElementById('class-timetable-view')
                   || document.getElementById('timetable-content');
    if (!container) return;

    const _ttKey = className.replace(/\//g,"_");
    const timetableData = window.localData.timetables[_ttKey] || window.localData.timetables[className] || {};

    const gradeMatch = className.match(/^(\d+)/);
    const grade      = gradeMatch ? gradeMatch[1] : '1';

    const morningPeriods   = (window.TIMETABLE_PERIODS.morning   || window.DEFAULT_PERIODS.morning);
    const afternoonPeriods = (window.TIMETABLE_PERIODS.afternoon || window.DEFAULT_PERIODS.afternoon);

    if (!morningPeriods.length && !afternoonPeriods.length) {
        container.innerHTML = '<p style="color:#64748b;padding:20px">Chưa có cấu hình thời gian tiết học.</p>';
        return;
    }

    const teacherSubject = (window.teacherSubject || window.currentUserProfile?.assignedSubject || '').trim();
    const teacherName = (window.currentUserProfile?.name || window.currentUserProfile?.displayName || window.currentUser?.displayName || '').trim();

    const buildSession = (periods, label, labelColor) => {
        if (!periods.length) return '';
        let html = `<h4 style="margin-bottom:15px;color:${labelColor};border-left:4px solid ${labelColor};padding-left:10px">${label}</h4>`;
        html += '<div class="timetable-container"><div class="timetable-grid">';
        html += '<div class="timetable-header">Tiết</div>';
        window.WEEKDAYS.forEach(day => { html += `<div class="timetable-header">${day}</div>`; });

        periods.forEach(period => {
            html += `<div class="timetable-time">${period.name}<br><small>${period.time}</small></div>`;
            window.WEEKDAYS.forEach((day, dayIndex) => {
                const slotKey = `${dayIndex}_${period.id}`;
                const slot    = timetableData[slotKey] || {};

                // Kiểm tra xem tiết này có phải tiết do giáo viên bộ môn đang đăng nhập dạy không
                const isMySlot = window.userRole === 'subject_teacher' && slot.subject && (
                    (slot.teacher && isTeacherNameMatch(slot.teacher, teacherName)) ||
                    (!slot.teacher && teacherSubject && isSubjectMatch(slot.subject, teacherSubject)) ||
                    (teacherSubject && isSubjectMatch(slot.subject, teacherSubject) && isTeacherNameMatch(slot.teacher, teacherName))
                );

                html += `<div class="timetable-cell ${isMySlot ? 'my-teaching-slot' : ''}">`;
                if (slot.subject) {
                    if (isMySlot) {
                        html += `<div style="font-size:0.7rem;background:#16a34a;color:white;padding:1px 6px;border-radius:4px;font-weight:700;margin-bottom:3px"><i class="fas fa-star"></i> Tiết của bạn</div>`;
                    }
                    html += `
                        <div class="timetable-subject">${slot.subject}</div>
                        ${slot.teacher ? `<div class="timetable-teacher">${slot.teacher}</div>` : ''}
                        ${slot.room    ? `<div class="timetable-teacher">P: ${slot.room}</div>`  : ''}`;
                } else {
                    html += `<div class="empty-slot">-</div>`;
                }
                if (editable) {
                    html += `<button class="btn btn-sm btn-primary timetable-edit-btn"
                                onclick="editTimetableSlot('${className}',${dayIndex},${period.id})">
                                <i class="fas fa-edit"></i>
                             </button>`;
                }
                html += '</div>';
            });
        });
        html += '</div></div>';
        return html;
    };

    container.innerHTML =
        buildSession(morningPeriods, '⛅ Buổi Sáng', 'var(--primary)') +
        (afternoonPeriods.length
            ? `<div style="margin-top:20px"></div>` +
              buildSession(afternoonPeriods, '🌙 Buổi Chiều', 'var(--warning)')
            : '');
}

export function editTimetableSlot(className, dayIndex, periodId) {
    window.currentTimetableSlot = { className, dayIndex, periodId };
    const gradeMatch = className.match(/^(\d+)/);
    const grade      = gradeMatch ? gradeMatch[1] : '1';
    const subjects   = window.PRIMARY_SUBJECTS[grade] || [];
    const timetableData = window.localData.timetables[className.replace(/\//g,"_")] || window.localData.timetables[className] || {};
    const slotKey    = `${dayIndex}_${periodId}`;
    const slot       = timetableData[slotKey] || {};

    const subjectSelect = document.getElementById('timetable-subject');
    subjectSelect.innerHTML = '<option value="">-- Chọn môn --</option>';
    subjects.forEach(subject => {
        const name = subject.name || subject;
        subjectSelect.innerHTML += `<option value="${name}" ${slot.subject===name?'selected':''}>${name}</option>`;
    });

    const form = document.getElementById('timetable-form');
    form.teacher.value = slot.teacher || '';
    form.room.value    = slot.room    || '';
    document.getElementById('modal-timetable').style.display = 'flex';
}

export async function saveTimetableSlot(e) {
    e.preventDefault();
    const form = e.target;
    const { className, dayIndex, periodId } = window.currentTimetableSlot;
    const slotKey  = `${dayIndex}_${periodId}`;
    const slotData = { subject: form.subject.value, teacher: form.teacher.value, room: form.room.value };
    try {
        await window.set(window.ref(window.db, `${timetablePath()}/${className.replace(/\//g,"_")}/${slotKey}`), slotData);
        const _saveKey = className.replace(/\//g,"_");
        if (!window.localData.timetables[_saveKey]) window.localData.timetables[_saveKey] = {};
        window.localData.timetables[_saveKey][slotKey] = slotData;
        Swal.fire('Thành công', 'Đã cập nhật thời khóa biểu!', 'success');
        window.closeModal('modal-timetable');
        renderClassTimetable(className, true);
    } catch (error) {
        Swal.fire('Lỗi', error.message, 'error');
    }
}

export async function clearTimetableSlot() {
    const { className, dayIndex, periodId } = window.currentTimetableSlot;
    const slotKey = `${dayIndex}_${periodId}`;
    const result = await Swal.fire({
        title:'Xác nhận xóa', text:'Bạn có chắc muốn xóa tiết học này?',
        icon:'warning', showCancelButton:true, confirmButtonText:'Xóa', cancelButtonText:'Hủy'
    });
    if (result.isConfirmed) {
        try {
            await window.remove(window.ref(window.db, `${timetablePath()}/${className.replace(/\//g,"_")}/${slotKey}`));
            const _delKey = className.replace(/\//g,"_");
            if (window.localData.timetables[_delKey]) delete window.localData.timetables[_delKey][slotKey];
            Swal.fire('Đã xóa', 'Tiết học đã được xóa!', 'success');
            window.closeModal('modal-timetable');
            renderClassTimetable(className, true);
        } catch (error) {
            Swal.fire('Lỗi', error.message, 'error');
        }
    }
}

// ── Schedule Settings ─────────────────────────────────────────────────────────
export function openScheduleSettings() {
    const morningPeriods   = window.TIMETABLE_PERIODS.morning   || window.DEFAULT_PERIODS.morning;
    const afternoonPeriods = window.TIMETABLE_PERIODS.afternoon || window.DEFAULT_PERIODS.afternoon;
    renderPeriodsList('morning',   morningPeriods);
    renderPeriodsList('afternoon', afternoonPeriods);
    document.getElementById('modal-schedule-settings').style.display = 'flex';
}

function renderPeriodsList(session, periods) {
    const container = document.getElementById(`${session}-periods-container`);
    container.innerHTML = periods.map((period, index) => `
        <div class="form-grid" style="align-items:end;margin-bottom:10px;padding:10px;background:#f8fafc;border-radius:6px">
            <div class="form-group" style="margin-bottom:0">
                <label>Tên tiết</label>
                <input type="text" class="form-control" value="${period.name}"
                       id="${session}-name-${index}" placeholder="VD: Tiết 1">
            </div>
            <div class="form-group" style="margin-bottom:0">
                <label>Thời gian (HH:MM-HH:MM)</label>
                <input type="text" class="form-control" value="${period.time}"
                       id="${session}-time-${index}" placeholder="VD: 7:30-8:10">
            </div>
            <button type="button" class="btn btn-sm btn-danger" onclick="removePeriod('${session}',${index})">
                <i class="fas fa-trash"></i>
            </button>
        </div>`).join('');
}

export function addPeriod(session) {
    const periods = session === 'morning'
        ? window.TIMETABLE_PERIODS.morning
        : window.TIMETABLE_PERIODS.afternoon;
    const nextId  = periods.length > 0
        ? Math.max(...periods.map(p=>p.id)) + 1
        : (session==='morning' ? 1 : 6);
    periods.push({ id: nextId, name: `Tiết ${nextId}`, time: session==='morning' ? '7:30-8:10' : '13:30-14:10' });
    renderPeriodsList(session, periods);
}

export function removePeriod(session, index) {
    const periods = session === 'morning'
        ? window.TIMETABLE_PERIODS.morning
        : window.TIMETABLE_PERIODS.afternoon;
    if (periods.length <= 1) { Swal.fire('Lỗi', 'Phải có ít nhất 1 tiết trong mỗi buổi', 'warning'); return; }
    periods.splice(index, 1);
    renderPeriodsList(session, periods);
}

export async function saveScheduleSettings() {
    const collectPeriods = (session, startId = 1) => {
        const count   = document.querySelectorAll(`[id^="${session}-name-"]`).length;
        const periods = [];
        for (let i = 0; i < count; i++) {
            const nameEl = document.getElementById(`${session}-name-${i}`);
            const timeEl = document.getElementById(`${session}-time-${i}`);
            if (!nameEl || !timeEl) continue;
            const name = nameEl.value.trim();
            const time = timeEl.value.trim();
            if (!name || !time) { Swal.fire('Lỗi', 'Vui lòng điền đầy đủ tên và thời gian cho tất cả các tiết', 'warning'); return null; }
            if (!/^\d{1,2}:\d{2}-\d{1,2}:\d{2}$/.test(time)) { Swal.fire('Lỗi', `Thời gian "${time}" không đúng định dạng HH:MM-HH:MM`, 'warning'); return null; }
            periods.push({ id: startId + i, name, time });
        }
        return periods;
    };
    const morningPeriods   = collectPeriods('morning', 1);
    if (!morningPeriods) return;
    const afternoonPeriods = collectPeriods('afternoon', morningPeriods.length + 1);
    if (!afternoonPeriods) return;
    const scheduleSettings = { morning: morningPeriods, afternoon: afternoonPeriods };
    try {
        await window.set(window.ref(window.db, 'scheduleSettings'), scheduleSettings);
        window.localData.scheduleSettings = scheduleSettings;
        window.TIMETABLE_PERIODS = scheduleSettings;
        Swal.fire({ icon:'success', title:'Đã lưu cài đặt!', timer:2000, showConfirmButton:false });
        window.closeModal('modal-schedule-settings');
    } catch (error) {
        Swal.fire('Lỗi', error.message, 'error');
    }
}

export async function resetDefaultSchedule() {
    const result = await Swal.fire({
        title:'Khôi phục mặc định?', text:'Thao tác này sẽ đặt lại thời gian về cài đặt mặc định',
        icon:'warning', showCancelButton:true, confirmButtonText:'Khôi phục', cancelButtonText:'Hủy'
    });
    if (result.isConfirmed) {
        try {
            await window.set(window.ref(window.db, 'scheduleSettings'), window.DEFAULT_PERIODS);
            window.TIMETABLE_PERIODS = window.DEFAULT_PERIODS;
            Swal.fire({ icon:'success', title:'Đã khôi phục!', timer:2000, showConfirmButton:false });
            window.closeModal('modal-schedule-settings');
        } catch (error) {
            Swal.fire('Lỗi', error.message, 'error');
        }
    }
}
