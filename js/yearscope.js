// ══════════════════════════════════════════════════════════════════════════════
// yearscope.js — Đường dẫn dữ liệu theo năm học V5 + tương thích dữ liệu cũ
// ══════════════════════════════════════════════════════════════════════════════

export function schoolYearKey(schoolYear = window._currentSchoolYear || '') {
    return String(schoolYear || '').replace('-', '_');
}

export function currentSchoolYearKey() {
    return schoolYearKey(window._currentSchoolYear || '');
}

export function paymentStatusPath(schoolYear = window._currentSchoolYear || '') {
    return `paymentStatus/${schoolYearKey(schoolYear)}`;
}


export function classKey(value) {
    return String(value || '').trim().replace(/\//g, '_').replace(/[.#$\[\]]/g, '_');
}

export function paymentStatusClassPath(className, schoolYear = window._currentSchoolYear || '') {
    return `paymentStatusByClass/${schoolYearKey(schoolYear)}/${classKey(className)}`;
}

export function timetablePath(schoolYear = window._currentSchoolYear || '') {
    return `timetables/${schoolYearKey(schoolYear)}`;
}

export function financeMatchesYear(transaction, schoolYear = window._currentSchoolYear || '') {
    const txYear = String(transaction?.schoolYear || '').trim();
    // Dữ liệu cũ chưa có schoolYear chỉ được xem trong chế độ tương thích.
    if (!txYear) return String(window._legacyFinanceSchoolYear || '') === String(schoolYear || '');
    return txYear === schoolYear;
}

export async function readYearScoped(path, legacyPath = '') {
    const snap = await window.get(window.ref(window.db, path));
    const value = snap.val();
    if (value && typeof value === 'object' && Object.keys(value).length) {
        return { value, source: 'scoped' };
    }
    if (!legacyPath) return { value: value || {}, source: 'scoped' };
    const legacySnap = await window.get(window.ref(window.db, legacyPath));
    const legacyValue = legacySnap.val() || {};
    // Sau khi đã tách theo năm, node gốc chứa các khóa 2025_2026, 2026_2027...
    // Không được coi các nhánh năm cũ là dữ liệu legacy của năm hiện tại.
    if (legacyValue && typeof legacyValue === 'object' && !Array.isArray(legacyValue)) {
        const unscoped = Object.fromEntries(
            Object.entries(legacyValue).filter(([key]) => !/^\d{4}_\d{4}$/.test(String(key)))
        );
        return { value: unscoped, source: Object.keys(unscoped).length ? 'legacy' : 'empty' };
    }
    return { value: {}, source: 'empty' };
}
