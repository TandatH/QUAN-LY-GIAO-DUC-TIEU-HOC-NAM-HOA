// Smart School Cloudflare Worker entrypoint
// Static site + same-origin /api/send-email endpoint for Resend.

const FIREBASE_API_KEY_FALLBACK = 'AIzaSyA8MPme9kwBzk6HiHZQbhZcIuUXikzWeYA';
const FIREBASE_DATABASE_URL_FALLBACK = 'https://fma-nam-hoa-default-rtdb.asia-southeast1.firebasedatabase.app';
const MAX_BATCH = 100;

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...extraHeaders,
    },
  });
}

function cleanText(value, max = 5000) {
  return String(value ?? '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .slice(0, max);
}

function cleanHeader(value, max = 200) {
  return cleanText(value, max).replace(/[\r\n]+/g, ' ').trim();
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;',
  }[ch]));
}

function validEmail(value) {
  const email = String(value || '').trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : '';
}

function formatEmailContent(rawText) {
  if (!rawText) return '';
  let text = escapeHtml(cleanText(rawText, 20000));

  // 1. Khung viền nổi bật: [vien]...[/vien] hoặc [khung]...[/khung]
  text = text.replace(/\[(?:vien|viền|khung)\]([\s\S]*?)\[\/(?:vien|viền|khung)\]/gi, (_, p1) => {
    return `<div style="margin:12px 0;padding:12px 14px;border:1.5px solid #2563eb;border-radius:8px;background:#eff6ff;color:#1e3a8a;line-height:1.6">${p1}</div>`;
  });

  // 2. Chữ IN HOA: [hoa]...[/hoa] hoặc [caps]...[/caps]
  text = text.replace(/\[(?:hoa|caps|upper)\]([\s\S]*?)\[\/(?:hoa|caps|upper)\]/gi, (_, p1) => {
    return `<span style="text-transform:uppercase;font-weight:bold">${p1}</span>`;
  });

  // 3. In đậm: **text** hoặc __text__
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/__(.+?)__/g, '<strong>$1</strong>');

  // 4. Kèm link dạng Markdown: [tên link](url)
  text = text.replace(/\[([^\]]+)\]\(((?:https?:\/\/|mailto:|tel:)[^\s\)]+)\)/g, (_, label, url) => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color:#1d4ed8;text-decoration:underline;font-weight:bold;word-break:break-all">${label}</a>`;
  });
  text = text.replace(/\[([^\]]+)\]\((www\.[^\s\)]+)\)/g, (_, label, url) => {
    return `<a href="https://${url}" target="_blank" rel="noopener noreferrer" style="color:#1d4ed8;text-decoration:underline;font-weight:bold;word-break:break-all">${label}</a>`;
  });

  // 5. Tự động nhận diện URL thô
  text = text.replace(/(^|[^"'>])(https?:\/\/[^\s<]+)/g, (_, prefix, url) => {
    let cleanUrl = url.replace(/[.,;!?]+$/, '');
    let trailing = url.slice(cleanUrl.length);
    return `${prefix}<a href="${cleanUrl}" target="_blank" rel="noopener noreferrer" style="color:#1d4ed8;text-decoration:underline;font-weight:bold;word-break:break-all">${cleanUrl}</a>${trailing}`;
  });

  // 6. Xuống dòng
  text = text.replace(/\r?\n/g, '<br>');
  return text;
}

function cleanPlainText(raw) {
  if (!raw) return '';
  return String(raw)
    .replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '$1 ($2)')
    .replace(/\[(?:hoa|caps|upper)\]([\s\S]*?)\[\/(?:hoa|caps|upper)\]/gi, (_, t) => t.toUpperCase())
    .replace(/\[(?:vien|viền|khung)\]([\s\S]*?)\[\/(?:vien|viền|khung)\]/gi, (_, t) => `\n--- ${t.trim()} ---\n`)
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1');
}

function emailHtml(notification, recipient, schoolName) {
  const title = escapeHtml(cleanText(notification.title || 'Thông báo từ nhà trường', 300));
  const content = formatEmailContent(notification.content || '');
  const recipientName = escapeHtml(cleanText(recipient.name || recipient.email, 200));
  const targetClass = escapeHtml(cleanText(notification.targetClass || '', 100));
  const createdAt = Number(notification.createdAt || Date.now());
  const dateText = escapeHtml(new Date(createdAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }));
  const school = escapeHtml(cleanText(schoolName || 'Nhà trường', 200));

  return `<!doctype html>
<html lang="vi">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#f3f6fb;font-family:Arial,Helvetica,sans-serif;color:#1f2937">
  <div style="max-width:640px;margin:0 auto;padding:24px 12px">
    <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden">
      <div style="background:#1e3a8a;color:#ffffff;padding:18px 22px">
        <div style="font-size:13px;opacity:.9">${school}</div>
        <div style="font-size:22px;font-weight:700;margin-top:4px">${title}</div>
      </div>
      <div style="padding:22px;line-height:1.65;font-size:15px">
        <p style="margin-top:0">Kính gửi <strong>${recipientName}</strong>,</p>
        <div style="padding:14px 16px;background:#f8fafc;border-left:4px solid #2563eb;border-radius:8px">${content}</div>
        ${targetClass ? `<p><strong>Lớp:</strong> ${targetClass}</p>` : ''}
        <p style="color:#64748b;font-size:13px;margin-bottom:0">Thời gian: ${dateText}</p>
      </div>
    </div>
    <p style="text-align:center;color:#94a3b8;font-size:12px">Email được gửi tự động từ hệ thống FMA Nam Hòa.</p>
  </div>
</body>
</html>`;
}

async function verifyFirebaseAdmin(env, idToken) {
  const apiKey = env.FIREBASE_API_KEY || FIREBASE_API_KEY_FALLBACK;
  const databaseUrl = String(env.FIREBASE_DATABASE_URL || FIREBASE_DATABASE_URL_FALLBACK).replace(/\/$/, '');

  const authResp = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });

  if (!authResp.ok) {
    return { ok: false, status: 401, message: 'Phiên đăng nhập Firebase không hợp lệ hoặc đã hết hạn.' };
  }

  const authData = await authResp.json();
  const uid = authData?.users?.[0]?.localId;
  if (!uid) {
    return { ok: false, status: 401, message: 'Không xác định được tài khoản Firebase.' };
  }

  const profileResp = await fetch(`${databaseUrl}/users/${encodeURIComponent(uid)}.json?auth=${encodeURIComponent(idToken)}`, {
    headers: { 'cache-control': 'no-store' },
  });
  if (!profileResp.ok) {
    return { ok: false, status: 403, message: 'Không đọc được quyền tài khoản từ Firebase.' };
  }

  const profile = await profileResp.json();
  if (!profile || profile.role !== 'admin') {
    return { ok: false, status: 403, message: 'Chỉ tài khoản Admin được phép gửi email thông báo.' };
  }

  return { ok: true, uid, email: authData?.users?.[0]?.email || '' };
}

async function handleSendEmail(request, env) {
  if (request.method !== 'POST') {
    return json({ ok: false, error: 'Chỉ hỗ trợ POST.' }, 405, { allow: 'POST' });
  }

  try {
    // Endpoint is intended to be called from the same Worker origin.
    const origin = request.headers.get('origin');
    if (origin) {
      let requestHost = '';
      let originHost = '';
      try {
        requestHost = new URL(request.url).host;
        originHost = new URL(origin).host;
      } catch {
        return json({ ok: false, error: 'Origin không hợp lệ.' }, 403);
      }
      if (requestHost !== originHost) {
        return json({ ok: false, error: 'Origin không được phép.' }, 403);
      }
    }

    if (!env.RESEND_API_KEY) {
      return json({ ok: false, error: 'Cloudflare chưa có secret RESEND_API_KEY.' }, 503);
    }

    const authorization = request.headers.get('authorization') || '';
    const idToken = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
    if (!idToken) {
      return json({ ok: false, error: 'Thiếu Firebase ID token.' }, 401);
    }

    const auth = await verifyFirebaseAdmin(env, idToken);
    if (!auth.ok) {
      return json({ ok: false, error: auth.message }, auth.status);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ ok: false, error: 'Dữ liệu JSON không hợp lệ.' }, 400);
    }

    const notification = body?.notification || {};
    const settings = body?.settings || {};
    const inputRecipients = Array.isArray(body?.recipients) ? body.recipients : [];

    const fromEmail = validEmail(env.RESEND_FROM_EMAIL || settings.fromEmail);
    if (!fromEmail) {
      return json({ ok: false, error: 'Chưa cấu hình email gửi (From) thuộc domain đã xác minh trên Resend.' }, 400);
    }

    const fromName = cleanHeader(settings.fromName || settings.schoolName || 'Nhà trường', 100)
      .replace(/[<>]/g, '') || 'Nhà trường';
    const schoolName = cleanHeader(settings.schoolName || fromName, 150) || fromName;
    const replyTo = validEmail(settings.replyTo || env.RESEND_REPLY_TO || '');
    const subject = cleanHeader(notification.title || 'Thông báo từ nhà trường', 200) || 'Thông báo từ nhà trường';

    const seen = new Set();
    const recipients = [];
    for (const raw of inputRecipients) {
      const email = validEmail(raw?.email);
      if (!email || seen.has(email)) continue;
      seen.add(email);
      recipients.push({
        email,
        name: cleanText(raw?.name || email, 200),
        role: cleanText(raw?.role || '', 80),
      });
    }

    if (!recipients.length) {
      return json({
        ok: true,
        sent: 0,
        failed: 0,
        queued: 0,
        recipients: 0,
        message: 'Không có email hợp lệ để gửi.',
      });
    }

    const requestedLimit = Number(settings.maxPerNotification || 80);
    const limit = Math.max(
      1,
      Math.min(Number.isFinite(requestedLimit) ? requestedLimit : 80, MAX_BATCH, recipients.length),
    );
    const toSend = recipients.slice(0, limit);
    const remaining = recipients.length - toSend.length;

    const batch = toSend.map(recipient => {
      const item = {
        from: `${fromName} <${fromEmail}>`,
        to: [recipient.email],
        subject,
        html: emailHtml(notification, recipient, schoolName),
        text: `${schoolName}\n\n${notification.title || 'Thông báo'}\n\n${cleanPlainText(notification.content || '')}`,
      };
      if (replyTo) item.reply_to = replyTo;
      return item;
    });

    const stablePart = cleanHeader(notification.id || 'notification', 80)
      .replace(/[^a-zA-Z0-9_-]/g, '_');
    const versionPart = cleanHeader(notification.updatedAt || notification.createdAt || Date.now(), 80)
      .replace(/[^a-zA-Z0-9_-]/g, '_');
    const idempotencyKey = `smart-school-${stablePart}-${versionPart}`.slice(0, 250);

    const resendResp = await fetch('https://api.resend.com/emails/batch', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${env.RESEND_API_KEY}`,
        'content-type': 'application/json',
        'idempotency-key': idempotencyKey,
      },
      body: JSON.stringify(batch),
    });

    const resendData = await resendResp.json().catch(() => ({}));
    if (!resendResp.ok) {
      const message = resendData?.message || resendData?.error?.message || `Resend HTTP ${resendResp.status}`;
      return json(
        { ok: false, error: message, detail: resendData },
        resendResp.status >= 500 ? 502 : resendResp.status,
      );
    }

    return json({
      ok: true,
      provider: 'resend',
      sent: toSend.length,
      failed: 0,
      queued: remaining,
      recipients: recipients.length,
      ids: Array.isArray(resendData?.data) ? resendData.data.map(x => x?.id).filter(Boolean) : [],
      message: `Resend đã nhận ${toSend.length}/${recipients.length} email${remaining ? `; còn ${remaining} email chưa gửi do giới hạn mỗi lần` : ''}.`,
    });
  } catch (error) {
    console.error('[Smart School Resend Worker]', error);
    return json({ ok: false, error: error?.message || 'Lỗi không xác định khi gửi email.' }, 500);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/send-email') {
      return handleSendEmail(request, env);
    }

    const pathname = url.pathname;

    // Chuẩn hóa /login.html thành /login
    if (pathname === '/login.html') {
      url.pathname = '/login';
      return Response.redirect(url.toString(), 301);
    }

    // Định tuyến SPA cho Smart School:
    // Mọi đường dẫn theo vai trò /admin/*, /giao-vien/*, /phu-huynh/*, /login, /demo/* và các slug trực tiếp
    // đều được phân giải trả về login.html để trình duyệt chạy Single Page App và giữ nguyên URL trên thanh địa chỉ.
    const hasFileExtension = /\.[a-zA-Z0-9]+$/.test(pathname);
    const isAppRoute = !hasFileExtension && /^\/(login|admin|giao-vien|phu-huynh|demo|dashboard|tong-quan|hoc-sinh|students|quan-ly-hoc-sinh|thoi-khoa-bieu|timetable|lich-hoc|diem-danh|attendance|quan-ly-diem|diem|scores|nhap-diem-bo-mon|subject-scores|diem-bo-mon|tai-chinh|dong-tien|finance|hoc-phi|nguoi-dung|users|tai-khoan|hoc-ba|hocba|tong-ket-nam-hoc|yearend|cai-dat-nam-hoc|schoolyear|thong-bao|notifications|tin-tuc|news|phieu-lien-lac|phieulienlac|danh-gia|evaluations|bieu-mau|ke-hoach|plans|kehoach|thong-tin-con|child-info)(\/.*)?$/i.test(pathname);

    if (isAppRoute) {
      const appHtmlUrl = new URL('/login.html', request.url);
      return env.ASSETS.fetch(new Request(appHtmlUrl, request));
    }

    // Keep the existing website served as static assets.
    return env.ASSETS.fetch(request);
  },
};

