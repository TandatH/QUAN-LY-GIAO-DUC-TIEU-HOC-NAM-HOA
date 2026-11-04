// ══════════════════════════════════════════════════════════════════════════════
// scoreaccess.js — Khóa thời gian nhập điểm + nhật ký chỉnh sửa điểm
// DB cấu hình:
// settings/scoreEntryWindows/{schoolYearKey}/{mode}
// DB nhật ký:
// scoreAudit/{schoolYearKey}/{mode}/{studentKey}/{subjectKey}/{logId}
// ══════════════════════════════════════════════════════════════════════════════

function trustedNow() { return typeof window.serverNow === 'function' ? window.serverNow() : Date.now(); }

export const SCORE_MODE_LABELS = {
    hk1:  'Cuối Học kỳ 1',
    ghk1: 'Giữa Học kỳ 1',
    hk2:  'Cuối Học kỳ 2',
    ghk2: 'Giữa Học kỳ 2',
};

export const SCORE_MODES = ['hk1', 'ghk1', 'hk2', 'ghk2'];

export function schoolYearKey(schoolYear) {
    return String(schoolYear || '').replace(/-/g, '_');
}

export function scoreModeLabel(mode) {
    return SCORE_MODE_LABELS[mode] || mode || 'Kỳ đánh giá';
}

export function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

export function formatDateTime(timestamp) {
    const n = Number(timestamp);
    if (!Number.isFinite(n) || n <= 0) return '—';
    return new Date(n).toLocaleString('vi-VN', {
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        day: '2-digit', month: '2-digit', year: 'numeric',
    });
}

export function toDateTimeLocalValue(timestamp) {
    const n = Number(timestamp);
    if (!Number.isFinite(n) || n <= 0) return '';
    const d = new Date(n);
    const pad = value => String(value).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromDateTimeLocalValue(value) {
    if (!value) return null;
    const n = new Date(value).getTime();
    return Number.isFinite(n) ? n : null;
}

export function currentEditor() {
    return {
        uid:   window.currentUser?.uid || '',
        email: window.currentUser?.email || '',
        role:  window.userRole || '',
    };
}

export async function loadScoreEntryWindow(schoolYear, mode) {
    if (!window.db || !window.ref || !window.get) return {};
    const path = `settings/scoreEntryWindows/${schoolYearKey(schoolYear)}/${mode}`;
    const snap = await window.get(window.ref(window.db, path));
    return snap.val() || {};
}

export function evaluateScoreEntryWindow(config, options = {}) {
    const now  = Number(options.now ?? trustedNow());
    const role = options.role ?? window.userRole;
    const startAt = Number(config?.startAt || 0);
    const endAt   = Number(config?.endAt || 0);
    const enabled = config?.enabled === true;

    if (role === 'admin') {
        return {
            allowed: true,
            adminBypass: true,
            state: 'admin',
            message: 'Admin luôn được phép nhập và chỉnh sửa điểm.',
            config: config || {}, startAt, endAt, now,
        };
    }

    if (!['teacher', 'subject_teacher'].includes(role)) {
        return {
            allowed: false,
            state: 'forbidden_role',
            message: 'Tài khoản này không có quyền nhập điểm.',
            config: config || {}, startAt, endAt, now,
        };
    }

    if (!enabled) {
        return {
            allowed: false,
            state: 'disabled',
            message: 'Admin chưa mở đợt nhập điểm cho kỳ này.',
            config: config || {}, startAt, endAt, now,
        };
    }

    if (!startAt || !endAt || endAt <= startAt) {
        return {
            allowed: false,
            state: 'invalid',
            message: 'Thời gian nhập điểm chưa được cấu hình hợp lệ.',
            config: config || {}, startAt, endAt, now,
        };
    }

    if (now < startAt) {
        return {
            allowed: false,
            state: 'not_started',
            message: `Đợt nhập điểm sẽ mở lúc ${formatDateTime(startAt)}.`,
            config: config || {}, startAt, endAt, now,
        };
    }

    if (now > endAt) {
        return {
            allowed: false,
            state: 'expired',
            message: `Đợt nhập điểm đã đóng lúc ${formatDateTime(endAt)}.`,
            config: config || {}, startAt, endAt, now,
        };
    }

    return {
        allowed: true,
        state: 'open',
        message: `Được phép nhập điểm đến ${formatDateTime(endAt)}.`,
        config: config || {}, startAt, endAt, now,
    };
}

export async function getScoreEntryStatus(schoolYear, mode) {
    try {
        const config = await loadScoreEntryWindow(schoolYear, mode);
        return {
            ...evaluateScoreEntryWindow(config),
            schoolYear,
            mode,
            label: scoreModeLabel(mode),
        };
    } catch (error) {
        if (window.userRole === 'admin') {
            return {
                allowed: true,
                adminBypass: true,
                state: 'admin_error',
                message: `Admin được phép nhập; không đọc được cấu hình thời gian: ${error.message}`,
                schoolYear, mode, label: scoreModeLabel(mode), config: {},
            };
        }
        return {
            allowed: false,
            state: 'load_error',
            message: `Không kiểm tra được thời gian nhập điểm: ${error.message}`,
            schoolYear, mode, label: scoreModeLabel(mode), config: {},
        };
    }
}

export async function ensureScoreEntryAllowed(schoolYear, mode, options = {}) {
    const status = await getScoreEntryStatus(schoolYear, mode);
    if (!status.allowed && options.showMessage !== false && typeof Swal !== 'undefined') {
        Swal.fire({
            icon: 'warning',
            title: 'Ngoài thời gian nhập điểm',
            html: `<div style="text-align:left;font-size:0.9rem">
                <p><b>${escapeHtml(scoreModeLabel(mode))} — ${escapeHtml(schoolYear)}</b></p>
                <p style="margin-top:8px;color:#b45309">${escapeHtml(status.message)}</p>
                ${status.startAt && status.endAt ? `
                    <div style="margin-top:10px;background:#f8fafc;border-radius:8px;padding:10px;color:#475569">
                        <div><b>Mở:</b> ${escapeHtml(formatDateTime(status.startAt))}</div>
                        <div><b>Đóng:</b> ${escapeHtml(formatDateTime(status.endAt))}</div>
                    </div>` : ''}
                <p style="margin-top:10px;color:#64748b;font-size:0.82rem">Vui lòng liên hệ Admin để mở hoặc điều chỉnh thời gian.</p>
            </div>`,
        });
    }
    return status;
}

export function scoreWindowBannerHtml(status) {
    if (!status) return '';
    const isOpen  = status.allowed;
    const isAdmin = status.adminBypass;
    const color   = isAdmin ? '#1d4ed8' : isOpen ? '#166534' : '#b91c1c';
    const bg      = isAdmin ? '#dbeafe' : isOpen ? '#dcfce7' : '#fee2e2';
    const border  = isAdmin ? '#60a5fa' : isOpen ? '#4ade80' : '#f87171';
    const icon    = isAdmin ? 'fa-user-shield' : isOpen ? 'fa-lock-open' : 'fa-lock';
    const title   = isAdmin ? 'Quyền Admin' : isOpen ? 'Đang mở nhập điểm' : 'Đã khóa nhập điểm';
    const timeText = status.startAt && status.endAt
        ? `<span style="margin-left:8px">${escapeHtml(formatDateTime(status.startAt))} → ${escapeHtml(formatDateTime(status.endAt))}</span>`
        : '';
    return `<div style="margin-bottom:12px;background:${bg};border-left:4px solid ${border};
                       color:${color};border-radius:7px;padding:9px 13px;font-size:0.84rem">
        <i class="fas ${icon}"></i> <strong>${title}:</strong>
        ${escapeHtml(status.message || '')}${timeText}
    </div>`;
}

export function normalizeScore(value) {
    if (value === '' || value === null || value === undefined) return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
}

function sameScore(a, b) {
    const av = normalizeScore(a);
    const bv = normalizeScore(b);
    if (av === null && bv === null) return true;
    return av !== null && bv !== null && Math.abs(av - bv) < 1e-9;
}

export function buildAuditedScoreRecord(existingRecord, nextRecord, context = {}) {
    const existing = existingRecord && typeof existingRecord === 'object' ? existingRecord : {};
    const next     = nextRecord && typeof nextRecord === 'object' ? nextRecord : {};
    const editor   = currentEditor();
    const now      = Number(context.now || trustedNow());
    const oldScore = normalizeScore(existing.diem);
    const newScore = normalizeScore(next.diem);
    const changed  = !sameScore(oldScore, newScore);

    const record = { ...existing, ...next, __by: editor.email, __at: now };
    if (newScore === null) delete record.diem;
    else record.diem = newScore;

    const oldMeta = existing.__scoreMeta && typeof existing.__scoreMeta === 'object'
        ? existing.__scoreMeta : {};
    const meta = { ...oldMeta };

    // Dữ liệu cũ chưa có meta: dùng __at/__by làm thông tin nhập ban đầu gần nhất.
    if (oldScore !== null && !meta.firstEnteredAt) {
        meta.firstEnteredAt = Number(existing.__at || now);
        meta.firstEnteredBy = existing.__by || 'Dữ liệu cũ';
        meta.firstEnteredByUid = existing.__uid || '';
    }

    let auditEntry = null;
    if (changed) {
        const isEdit = oldScore !== null;
        const action = oldScore === null && newScore !== null
            ? 'entered'
            : oldScore !== null && newScore === null
                ? 'cleared'
                : 'edited';

        if (!isEdit && newScore !== null) {
            meta.firstEnteredAt    = meta.firstEnteredAt || now;
            meta.firstEnteredBy    = meta.firstEnteredBy || editor.email;
            meta.firstEnteredByUid = meta.firstEnteredByUid || editor.uid;
        }

        meta.lastChangedAt    = now;
        meta.lastChangedBy    = editor.email;
        meta.lastChangedByUid = editor.uid;
        meta.lastChangedRole  = editor.role;
        meta.lastAction       = action;

        if (isEdit) {
            meta.editCount       = Number(meta.editCount || 0) + 1;
            meta.lastEditedAt    = now;
            meta.lastEditedBy    = editor.email;
            meta.lastEditedByUid = editor.uid;
            meta.previousValue   = oldScore;
            record.__scoreEdited = true;
        } else {
            meta.editCount = Number(meta.editCount || 0);
        }

        auditEntry = {
            action,
            oldValue: oldScore,
            newValue: newScore,
            changedAt: now,
            changedByEmail: editor.email,
            changedByUid: editor.uid,
            changedByRole: editor.role,
            source: context.source || 'manual',
            studentId: context.studentId || '',
            studentCode: context.studentCode || '',
            studentName: context.studentName || '',
            className: context.className || '',
            subjectName: context.subjectName || '',
            schoolYear: context.schoolYear || '',
            mode: context.mode || '',
        };
    }

    if (Object.keys(meta).length) record.__scoreMeta = meta;
    return { record, auditEntry, changed, isEdited: Number(meta.editCount || 0) > 0 };
}

export function isEditedScore(record) {
    return Boolean(record?.__scoreEdited) || Number(record?.__scoreMeta?.editCount || 0) > 0;
}

export function scoreAuditSummary(record) {
    const meta = record?.__scoreMeta || {};
    if (Number(meta.editCount || 0) > 0 || meta.lastEditedAt) {
        return `Sửa bởi ${meta.lastEditedBy || meta.lastChangedBy || '—'} lúc ${formatDateTime(meta.lastEditedAt || meta.lastChangedAt)}`;
    }
    if (meta.firstEnteredAt || meta.lastChangedAt) {
        return `Nhập bởi ${meta.firstEnteredBy || meta.lastChangedBy || '—'} lúc ${formatDateTime(meta.firstEnteredAt || meta.lastChangedAt)}`;
    }
    return '';
}

function safeFirebaseKey(value) {
    return encodeURIComponent(String(value ?? ''))
        .replace(/\./g, '%2E')
        .replace(/%/g, '_');
}

export function makeScoreAuditUpdate(auditEntry) {
    if (!auditEntry) return {};
    const logId = `${auditEntry.changedAt}_${String(auditEntry.changedByUid || 'user').slice(0, 8)}_${Math.random().toString(36).slice(2, 8)}`;
    const path = [
        'scoreAudit',
        schoolYearKey(auditEntry.schoolYear),
        safeFirebaseKey(auditEntry.mode),
        safeFirebaseKey(auditEntry.studentId),
        safeFirebaseKey(auditEntry.subjectName),
        logId,
    ].join('/');
    return { [path]: auditEntry };
}

export function attachScoreChangeHighlighter(input, originalValue, persistedRecord = null) {
    if (!input) return;
    const original = normalizeScore(originalValue);
    const persistedEdited = isEditedScore(persistedRecord);
    const persistedSummary = scoreAuditSummary(persistedRecord);

    const refresh = () => {
        const current = normalizeScore(input.value);
        // Chỉ xem là một lần sửa mới khi ô đã có điểm trước đó và giá trị hiện tại khác điểm cũ.
        const changedNow = !sameScore(original, current) && original !== null;
        const showRed = changedNow || persistedEdited;

        input.dataset.scoreChanged = changedNow ? '1' : '0';
        input.dataset.scoreEdited  = persistedEdited ? '1' : '0';
        input.style.color = showRed
            ? '#dc2626'
            : current === null ? '#1e293b' : current >= 5 ? '#1d4ed8' : '#dc2626';
        input.style.borderColor = showRed ? '#ef4444' : '#cbd5e1';
        input.style.background = showRed ? '#fff1f2' : '#ffffff';
        input.title = changedNow
            ? `Điểm cũ: ${originalValue} — điểm mới sẽ được lưu màu đỏ và ghi nhật ký`
            : persistedSummary;
    };
    input.addEventListener('input', refresh);
    refresh();
}

// ── Admin xem toàn bộ nhật ký nhập/sửa điểm của một năm học ─────────────────
export async function openScoreAuditLog(schoolYear) {
    if (window.userRole !== 'admin') {
        if (typeof Swal !== 'undefined') Swal.fire('Từ chối', 'Chỉ Admin được xem toàn bộ nhật ký điểm.', 'error');
        return;
    }
    const sy = schoolYear || window._currentSchoolYear || '';
    if (!sy) {
        Swal.fire('Thiếu năm học', 'Không xác định được năm học cần xem nhật ký.', 'warning');
        return;
    }

    Swal.fire({ title:'Đang tải nhật ký điểm...', allowOutsideClick:false, didOpen:()=>Swal.showLoading() });
    try {
        const snap = await window.get(window.ref(window.db, `scoreAudit/${schoolYearKey(sy)}`));
        const raw = snap.val() || {};
        const entries = [];
        Object.values(raw).forEach(modeNode => {
            Object.values(modeNode || {}).forEach(studentNode => {
                Object.values(studentNode || {}).forEach(subjectNode => {
                    Object.values(subjectNode || {}).forEach(entry => {
                        if (entry && typeof entry === 'object') entries.push(entry);
                    });
                });
            });
        });
        entries.sort((a,b) => Number(b.changedAt||0) - Number(a.changedAt||0));
        const latest = entries.slice(0, 500);
        const actionLabel = action => ({
            entered:'Nhập mới', edited:'Sửa điểm', cleared:'Xóa điểm'
        }[action] || action || 'Thay đổi');
        const sourceLabel = source => ({manual:'Nhập tay', excel:'Import Excel', hocba:'Học bạ'}[source] || source || '—');
        const scoreText = value => value === null || value === undefined || value === '' ? 'Trống' : value;

        const rows = latest.map((e, index) => `
            <tr style="background:${e.action==='edited'?'#fff1f2':index%2?'#ffffff':'#f8fafc'}">
                <td style="padding:7px 8px;border:1px solid #e2e8f0;white-space:nowrap">${escapeHtml(formatDateTime(e.changedAt))}</td>
                <td style="padding:7px 8px;border:1px solid #e2e8f0">
                    <div style="font-weight:600">${escapeHtml(e.changedByEmail||'—')}</div>
                    <div style="font-size:.68rem;color:#64748b">${escapeHtml(e.changedByRole||'')}</div>
                </td>
                <td style="padding:7px 8px;border:1px solid #e2e8f0">${escapeHtml(e.className||'—')}</td>
                <td style="padding:7px 8px;border:1px solid #e2e8f0">
                    <div style="font-weight:600">${escapeHtml(e.studentName||'—')}</div>
                    <div style="font-size:.68rem;color:#64748b">${escapeHtml(e.studentCode||e.studentId||'')}</div>
                </td>
                <td style="padding:7px 8px;border:1px solid #e2e8f0">${escapeHtml(scoreModeLabel(e.mode))}</td>
                <td style="padding:7px 8px;border:1px solid #e2e8f0;font-weight:600">${escapeHtml(e.subjectName||'—')}</td>
                <td style="padding:7px 8px;border:1px solid #e2e8f0;text-align:center;color:${e.action==='edited'?'#dc2626':'#1e293b'};font-weight:700">
                    ${escapeHtml(scoreText(e.oldValue))} → ${escapeHtml(scoreText(e.newValue))}
                </td>
                <td style="padding:7px 8px;border:1px solid #e2e8f0;white-space:nowrap">
                    <div>${escapeHtml(actionLabel(e.action))}</div>
                    <div style="font-size:.68rem;color:#64748b">${escapeHtml(sourceLabel(e.source))}</div>
                </td>
            </tr>`).join('');

        await Swal.fire({
            title: `Nhật ký nhập/sửa điểm — ${escapeHtml(sy)}`,
            html: `<div style="text-align:left">
                <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:10px;font-size:.8rem">
                    <span style="background:#dbeafe;color:#1d4ed8;border-radius:12px;padding:4px 9px">Tổng: <b>${entries.length}</b> thay đổi</span>
                    <span style="background:#fff1f2;color:#b91c1c;border-radius:12px;padding:4px 9px">Sửa điểm: <b>${entries.filter(e=>e.action==='edited').length}</b></span>
                    ${entries.length>500?'<span style="color:#92400e">Chỉ hiển thị 500 bản ghi mới nhất</span>':''}
                </div>
                <div style="max-height:65vh;overflow:auto;border:1px solid #e2e8f0;border-radius:8px">
                    <table style="width:100%;border-collapse:collapse;font-size:.76rem;min-width:1050px">
                        <thead style="position:sticky;top:0;z-index:2;background:#1e3a8a;color:white">
                            <tr>
                                <th style="padding:8px;border:1px solid #334155">Thời gian</th>
                                <th style="padding:8px;border:1px solid #334155">Tài khoản</th>
                                <th style="padding:8px;border:1px solid #334155">Lớp</th>
                                <th style="padding:8px;border:1px solid #334155">Học sinh</th>
                                <th style="padding:8px;border:1px solid #334155">Đợt</th>
                                <th style="padding:8px;border:1px solid #334155">Môn</th>
                                <th style="padding:8px;border:1px solid #334155">Điểm cũ → mới</th>
                                <th style="padding:8px;border:1px solid #334155">Loại</th>
                            </tr>
                        </thead>
                        <tbody>${rows || '<tr><td colspan="8" style="text-align:center;padding:30px;color:#94a3b8">Chưa có nhật ký điểm</td></tr>'}</tbody>
                    </table>
                </div>
            </div>`,
            width:'1180px',
            confirmButtonText:'Đóng',
            confirmButtonColor:'#1e3a8a',
        });
    } catch (error) {
        Swal.fire('Không tải được nhật ký', error.message, 'error');
    }
}
