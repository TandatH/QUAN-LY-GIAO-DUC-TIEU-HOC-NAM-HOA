// ══════════════════════════════════════════════════════════════════════════════
// mailer.js — Smart School email notification helper (Resend + Cloudflare)
// Trình duyệt KHÔNG giữ RESEND_API_KEY. Email được gửi qua /api/send-email.
// Nếu chưa cấu hình Resend, dữ liệu vẫn được lưu vào emailOutbox để kiểm tra.
// ══════════════════════════════════════════════════════════════════════════════

console.info('[Smart School] Resend mail notification helper loaded');

const EMAIL_SETTINGS_PATH = 'settings/emailNotifications';
const RESEND_ENDPOINT = '/api/send-email';

function classKey(value) {
    return String(value || '').trim().replace(/\//g, '_').replace(/[.#$\[\]]/g, '_');
}

function sameClass(a, b) {
    if (!a || !b) return false;
    return String(a) === String(b) || classKey(a) === classKey(b);
}

function gradeOfClass(cls) {
    const m = String(cls || '').match(/^(\d+)/);
    return m ? String(m[1]) : '';
}

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({
        '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;'
    }[ch]));
}

async function readDb(path) {
    const snap = await window.get(window.ref(window.db, path));
    return snap.val() || {};
}

async function readEmailSettings() {
    try {
        return await readDb(EMAIL_SETTINGS_PATH);
    } catch (error) {
        console.warn('[Smart School] Không đọc được cấu hình email:', error);
        return {};
    }
}

function normalizeEmail(value) {
    return String(value || '').trim().toLowerCase();
}

function userEmail(user) {
    return normalizeEmail(user?.email || user?.gmail || user?.mail || '');
}

function parentStudentOfUser(user, students) {
    const sid = String(user?.studentKey || user?.studentId || user?.studentCode || '').trim();
    if (!sid) return null;
    if (students?.[sid]) return students[sid];
    return Object.values(students || {}).find(s =>
        String(s?.code || '') === sid || String(s?.id || '') === sid
    ) || null;
}

function roleMatches(targetRole, userRole) {
    const target = String(targetRole || 'all');
    const role = String(userRole || '');

    if (role === 'admin') return false;
    if (target === 'all') return ['teacher', 'subject_teacher', 'parent'].includes(role);
    if (target === 'teacher' || target === 'staff') return role === 'teacher' || role === 'subject_teacher';
    if (target === 'homeroom_teacher') return role === 'teacher';
    if (target === 'subject_teacher') return role === 'subject_teacher';
    if (target === 'parent') return role === 'parent';
    return target === role;
}

function classMatches(notification, user, students) {
    const targetClass = String(notification?.targetClass || '').trim();
    if (!targetClass) return true;

    const role = String(user?.role || '');
    if (role === 'teacher') {
        return sameClass(user.assignedClass, targetClass) || sameClass(user.assignedClassKey, targetClass);
    }

    if (role === 'subject_teacher') {
        const grade = gradeOfClass(targetClass);
        const grades = Array.isArray(user.assignedGrades) ? user.assignedGrades.map(String) : [];
        const gradeMap = user.assignedGradeMap || {};
        if (!grades.length && !Object.keys(gradeMap).length) return true;
        return grades.includes(grade) || gradeMap[grade] === true;
    }

    if (role === 'parent') {
        const student = parentStudentOfUser(user, students);
        const cls = student?.classRoom || student?.class || student?.currentClass || '';
        return sameClass(cls, targetClass);
    }

    return false;
}

export async function resolveNotificationEmailRecipients(notification) {
    const [users, students] = await Promise.all([
        readDb('users'),
        readDb('students'),
    ]);

    const recipients = [];
    const seen = new Set();

    Object.entries(users || {}).forEach(([uid, user]) => {
        if (!user || typeof user !== 'object') return;
        if (!roleMatches(notification.targetRole, user.role)) return;
        if (!classMatches(notification, user, students)) return;

        const email = userEmail(user);
        if (!email || seen.has(email)) return;
        seen.add(email);

        recipients.push({
            uid,
            email,
            name: user.displayName || user.name || user.fullName || email,
            role: user.role || '',
        });
    });

    return recipients;
}

async function writeEmailOutbox(notification, recipients, extra = {}) {
    const id = notification?.id || `manual_${Date.now()}`;
    const payload = {
        notificationId: id,
        title: notification?.title || '',
        content: notification?.content || '',
        type: notification?.type || 'general',
        targetRole: notification?.targetRole || 'all',
        targetClass: notification?.targetClass || '',
        recipients: (recipients || []).map(r => ({
            email: r.email, name: r.name || '', role: r.role || '', uid: r.uid || ''
        })),
        recipientCount: (recipients || []).length,
        status: extra.status || 'queued',
        provider: extra.provider || 'resend',
        createdAt: Date.now(),
        createdBy: window.currentUser?.email || '',
        note: extra.note || '',
        error: extra.error || '',
    };

    try {
        await window.set(window.ref(window.db, `emailOutbox/${id}`), payload);
    } catch (error) {
        console.warn('[Smart School] Không ghi được emailOutbox:', error);
    }
    return payload;
}

async function sendViaResend(notification, recipients, settings) {
    const authUser = window.auth?.currentUser;
    if (!authUser) throw new Error('Bạn chưa đăng nhập Firebase.');

    // Force refresh token để tránh token bị hết hạn hoặc lệch thời gian giữa client và server
    const idToken = await authUser.getIdToken(true);
    const response = await fetch(RESEND_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
            notification,
            recipients,
            settings: {
                fromName: settings.fromName || 'Nhà trường',
                fromEmail: settings.fromEmail || '',
                replyTo: settings.replyTo || '',
                schoolName: settings.schoolName || settings.fromName || 'Nhà trường',
                maxPerNotification: Math.max(1, Math.min(Number(settings.maxPerNotification || 80), 100)),
            },
        }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok === false) {
        throw new Error(data.error || data.message || `Máy chủ gửi email trả về HTTP ${response.status}.`);
    }
    return data;
}

export async function sendNotificationEmail(notification, options = {}) {
    const recipients = await resolveNotificationEmailRecipients(notification);

    if (!recipients.length) {
        return { mode:'none', sent:0, failed:0, queued:0, recipients:0, message:'Không có email người nhận phù hợp.' };
    }

    const settings = await readEmailSettings();
    const provider = settings.provider === 'queue' ? 'queue' : 'resend';
    const enabled = settings.enabled === true || settings.enabled === 'true';
    const ready = enabled && provider === 'resend' && String(settings.fromEmail || '').trim();

    if (!ready || options.forceQueue) {
        await writeEmailOutbox(notification, recipients, {
            status:'pending_config',
            provider,
            note:'Chưa bật Resend hoặc chưa cấu hình email gửi; dữ liệu được lưu vào emailOutbox.'
        });
        return {
            mode:'queue',
            sent:0,
            failed:0,
            queued:recipients.length,
            recipients:recipients.length,
            message:'Chưa cấu hình Resend đầy đủ; hệ thống đã lưu dữ liệu vào emailOutbox.'
        };
    }

    try {
        const result = await sendViaResend(notification, recipients, settings);
        await writeEmailOutbox(notification, recipients, {
            status: result.queued > 0 ? 'partial_sent' : 'sent',
            provider:'resend',
            note: result.message || '',
        });

        return {
            mode:'resend',
            sent:Number(result.sent || 0),
            failed:Number(result.failed || 0),
            queued:Number(result.queued || 0),
            recipients:Number(result.recipients ?? recipients.length),
            message:result.message || `Resend đã nhận ${result.sent || 0}/${recipients.length} email.`
        };
    } catch (error) {
        await writeEmailOutbox(notification, recipients, {
            status:'error',
            provider:'resend',
            error:error?.message || String(error),
            note:'Resend gửi lỗi; kiểm tra Cloudflare secret, domain Resend và email From.'
        });
        return {
            mode:'error',
            sent:0,
            failed:recipients.length,
            queued:recipients.length,
            recipients:recipients.length,
            message:`Gửi Resend lỗi: ${error?.message || error}. Dữ liệu đã được lưu vào emailOutbox.`
        };
    }
}

export function emailResultHtml(result) {
    if (!result) return '';
    const color = result.mode === 'resend' && result.failed === 0 ? '#16a34a'
        : result.mode === 'queue' ? '#d97706'
        : result.mode === 'none' ? '#64748b'
        : '#dc2626';

    return `
        <div style="margin-top:10px;padding:10px 12px;border-radius:10px;background:#f8fafc;border:1px solid #e2e8f0">
            <p style="margin:0;color:${color};font-weight:700">
                <i class="fas fa-envelope"></i> Email: ${escapeHtml(result.message || '')}
            </p>
            <p style="margin:4px 0 0;color:#64748b;font-size:.82rem">
                Người nhận: ${result.recipients || 0} · Resend nhận: ${result.sent || 0} · Chưa gửi: ${result.queued || 0}
            </p>
        </div>`;
}

export async function openEmailSettingsModal() {
    if (window.userRole !== 'admin') return;
    const existing = await readEmailSettings();

    const { value } = await Swal.fire({
        title:'📧 Cài đặt gửi email bằng Resend',
        width:'720px',
        html: `
        <div style="text-align:left;font-size:.9rem">
            <div style="padding:12px 14px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;margin-bottom:14px;color:#1e3a8a;line-height:1.5">
                <strong>An toàn:</strong> Resend API Key không nhập ở đây và không lưu Firebase. Hãy tạo Cloudflare Secret tên <code>RESEND_API_KEY</code>. Web chỉ gọi <code>/api/send-email</code> sau khi xác thực tài khoản Admin.
            </div>

            <label style="display:flex;gap:8px;align-items:center;margin-bottom:12px">
                <input type="checkbox" id="em-enabled" ${existing.enabled ? 'checked' : ''}>
                <span>Bật gửi email khi Admin đăng thông báo</span>
            </label>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                <div>
                    <label>Provider</label>
                    <select id="em-provider" class="form-control">
                        <option value="resend" ${existing.provider!=='queue'?'selected':''}>Resend qua Cloudflare</option>
                        <option value="queue" ${existing.provider==='queue'?'selected':''}>Chỉ lưu emailOutbox</option>
                    </select>
                </div>
                <div>
                    <label>Tên người gửi</label>
                    <input id="em-from-name" class="form-control" value="${escapeHtml(existing.fromName || 'Nhà trường')}">
                </div>
                <div>
                    <label>Email gửi (From) *</label>
                    <input id="em-from-email" type="email" class="form-control" placeholder="vd: thongbao@truong.edu.vn" value="${escapeHtml(existing.fromEmail || '')}">
                </div>
                <div>
                    <label>Email nhận trả lời</label>
                    <input id="em-reply-to" type="email" class="form-control" placeholder="vd: truong@example.com" value="${escapeHtml(existing.replyTo || '')}">
                </div>
                <div>
                    <label>Tên trường</label>
                    <input id="em-school-name" class="form-control" value="${escapeHtml(existing.schoolName || existing.fromName || 'Nhà trường')}">
                </div>
                <div>
                    <label>Giới hạn gửi/lần</label>
                    <input id="em-max" type="number" min="1" max="100" class="form-control" value="${escapeHtml(Math.min(Number(existing.maxPerNotification || 80), 100))}">
                </div>
            </div>

            <div style="margin-top:12px;color:#64748b;font-size:.82rem;line-height:1.55">
                Email <strong>From</strong> phải thuộc đúng domain/subdomain đã xác minh trên Resend. Resend Batch API hỗ trợ tối đa 100 email trong một request; hệ thống mặc định giữ mức 80/lần.
            </div>
        </div>`,
        showCancelButton:true,
        confirmButtonText:'Lưu cài đặt',
        cancelButtonText:'Hủy',
        preConfirm: () => {
            const enabled = document.getElementById('em-enabled')?.checked || false;
            const provider = document.getElementById('em-provider')?.value || 'resend';
            const fromEmail = document.getElementById('em-from-email')?.value.trim() || '';
            if (enabled && provider === 'resend' && !fromEmail) {
                Swal.showValidationMessage('Vui lòng nhập Email gửi (From) đã xác minh domain trên Resend.');
                return false;
            }
            return {
                enabled,
                provider,
                fromName: document.getElementById('em-from-name')?.value.trim() || 'Nhà trường',
                fromEmail,
                replyTo: document.getElementById('em-reply-to')?.value.trim() || '',
                schoolName: document.getElementById('em-school-name')?.value.trim() || 'Nhà trường',
                maxPerNotification: Math.max(1, Math.min(Number(document.getElementById('em-max')?.value || 80), 100)),
                updatedAt: Date.now(),
                updatedBy: window.currentUser?.email || '',
            };
        }
    });

    if (!value) return;
    await window.set(window.ref(window.db, EMAIL_SETTINGS_PATH), value);
    Swal.fire('Đã lưu', 'Cài đặt Resend đã được cập nhật. API key vẫn chỉ nằm trong Cloudflare Secret.', 'success');
}

window.openEmailSettingsModal = openEmailSettingsModal;
window.sendNotificationEmail = sendNotificationEmail;
