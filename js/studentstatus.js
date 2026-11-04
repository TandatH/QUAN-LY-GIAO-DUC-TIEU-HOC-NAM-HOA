// ══════════════════════════════════════════════════════════════════════════════
// studentstatus.js — Bộ lọc trạng thái học sinh dùng chung V5
// ══════════════════════════════════════════════════════════════════════════════

export const ACTIVE_STUDENT_STATUS = 'active';

export function normalizeStudentStatus(student) {
    const raw = typeof student === 'string' ? student : student?.status;
    const value = String(raw || ACTIVE_STUDENT_STATUS).trim().toLowerCase();

    // Chuẩn hóa các giá trị cũ/lệch từ form HTML hoặc dữ liệu import.
    // Lỗi trước đây: form dùng value="leave", nhưng danh sách chỉ hiểu "inactive",
    // nên học sinh nghỉ học vẫn hiện thành "Đang học".
    if (['leave', 'left', 'quit', 'stop', 'stopped', 'nghi', 'nghi_hoc', 'nghihoc', 'ngừng học', 'ngung_hoc'].includes(value)) {
        return 'inactive';
    }
    if (['bao_luu', 'baoluu', 'reserve', 'reserved'].includes(value)) {
        return 'reserved';
    }
    if (['tot_nghiep', 'hoan_thanh_tieu_hoc', 'graduated'].includes(value)) {
        return 'graduated';
    }
    if (['dang_hoc', 'đang học', 'danghoc', 'active'].includes(value)) {
        return 'active';
    }
    return value || ACTIVE_STUDENT_STATUS;
}

export function isActiveStudent(student) {
    return normalizeStudentStatus(student) === ACTIVE_STUDENT_STATUS;
}

export function activeStudentValues(source = window.localData?.students || {}) {
    return Object.values(source || {}).filter(isActiveStudent);
}

export function activeStudentEntries(source = window.localData?.students || {}) {
    return Object.entries(source || {}).filter(([, student]) => isActiveStudent(student));
}

export function operationalClass(student) {
    return isActiveStudent(student) ? (student?.classRoom || student?.class || '') : '';
}

export function filterByAssignedClass(students, assignedClass) {
    const list = (students || []).filter(isActiveStudent);
    if (!assignedClass) return list;
    return list.filter(student =>
        student?.classRoom === assignedClass || student?.class === assignedClass
    );
}

export function compareStudentNames(a, b, order = 'name_az') {
    const nameA = String(typeof a === 'string' ? a : (a?.name || '')).trim();
    const nameB = String(typeof b === 'string' ? b : (b?.name || '')).trim();
    const partsA = nameA.split(/\s+/).filter(Boolean);
    const partsB = nameB.split(/\s+/).filter(Boolean);
    const givenA = partsA.length ? partsA[partsA.length - 1] : '';
    const givenB = partsB.length ? partsB[partsB.length - 1] : '';

    let res = givenA.localeCompare(givenB, 'vi');
    if (res === 0) {
        res = nameA.localeCompare(nameB, 'vi');
    }
    if (res === 0 && typeof a === 'object' && typeof b === 'object') {
        const codeA = String(a?.code || a?.id || '');
        const codeB = String(b?.code || b?.id || '');
        res = codeA.localeCompare(codeB, 'vi', { numeric: true });
    }
    return order === 'name_za' ? -res : res;
}

export function sortStudentsByName(students, order = 'name_az') {
    return [...students].sort((a, b) => compareStudentNames(a, b, order));
}

// Cho mã cũ có thể dùng mà không cần import trực tiếp.
if (typeof window !== 'undefined') {
    window.isActiveStudent = isActiveStudent;
    window.activeStudentValues = activeStudentValues;
    window.compareStudentNames = compareStudentNames;
    window.sortStudentsByName = sortStudentsByName;
}

