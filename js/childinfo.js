import { paymentStatusPath } from "./yearscope.js";
// ═══════════════════════════════════════════════════════
// childinfo.js — Thông tin con (Phụ huynh xem)
// Cập nhật: thêm Giữa HK1 + Giữa HK2 (chỉ Mức đạt được)
// ═══════════════════════════════════════════════════════

import { isEditedScore, scoreAuditSummary, escapeHtml } from "./scoreaccess.js";

const CATEGORY_NAMES = {
    tuition:'Học phí', exam_fee:'Phí thi', uniform:'Đồng phục',
    meal:'Tiền ăn', other_income:'Thu khác',
    salary:'Lương', utility:'Điện nước', maintenance:'Bảo trì',
    supplies:'Văn phòng phẩm', other_expense:'Chi khác'
};

function khenThuongTheoDanhGia(danhGia) {
    if (danhGia === 'Hoàn thành xuất sắc') return 'Học sinh Xuất sắc';
    if (danhGia === 'Hoàn thành tốt') return 'Học sinh Tiêu biểu hoàn thành tốt trong học tập và rèn luyện';
    return '';
}

export async function renderChildInfo() {
    const studentId = window.parentStudentId;

    if (!studentId) {
        document.getElementById('content').innerHTML = `
            <div class="card">
                <h3 style="color:var(--danger)">Không tìm thấy thông tin học sinh</h3>
                <p style="color:#64748b;margin-top:10px">Vui lòng liên hệ Admin để được cấp mã học sinh.</p>
            </div>`;
        return;
    }

    // Tìm học sinh
    let student = null, foundKey = null;
    if (window.localData.students[studentId]) {
        student  = window.localData.students[studentId];
        foundKey = studentId;
    } else {
        for (let key in window.localData.students) {
            const s = window.localData.students[key];
            if (s.code === studentId || s.id === studentId) {
                student  = s;
                foundKey = key;
                break;
            }
        }
    }

    if (!student) {
        const allStudents = Object.values(window.localData.students);
        document.getElementById('content').innerHTML = `
            <div class="card">
                <h3 style="color:var(--danger)">Không tìm thấy học sinh với mã: ${studentId}</h3>
                <p style="color:#64748b;margin-top:10px">Số học sinh trong hệ thống: <strong>${allStudents.length}</strong></p>
                ${allStudents.length > 0 ? `
                    <div style="margin-top:15px">
                        <p style="color:#64748b;margin-bottom:10px">Danh sách mã học sinh có sẵn:</p>
                        <div style="background:#f8fafc;padding:15px;border-radius:8px">
                            ${allStudents.map(s => `<div style="margin:5px 0">• ${s.code||s.id} - ${s.name}</div>`).join('')}
                        </div>
                    </div>` : ''}
                <p style="color:#dc2626;margin-top:15px">
                    <i class="fas fa-exclamation-triangle"></i> Vui lòng liên hệ Admin để kiểm tra lại mã học sinh.
                </p>
            </div>`;
        return;
    }

    const transactions = Object.values(window.localData.finance).filter(t =>
        t.studentCode === studentId ||
        t.studentCode === student.code ||
        t.studentCode === foundKey
    );

    // Fetch hocba (year + hk1 + hk2 + ghk1 + ghk2) + feedback + paymentStatus song song
    const { ref, get, child } = window;
    const sy = window._currentSchoolYear || '';
    const yk = sy.replace('-','_');

    const [hocbaSnap, hk1Snap, hk2Snap, ghk1Snap, ghk2Snap, fbSnap, statusSnap] = await Promise.all([
        get(ref(window.db, `hocba/${foundKey}/${yk}`)),
        get(ref(window.db, `hocba/${foundKey}/${yk}/hk1`)),
        get(ref(window.db, `hocba/${foundKey}/${yk}/hk2`)),
        get(ref(window.db, `hocba/${foundKey}/${yk}/ghk1`)),
        get(ref(window.db, `hocba/${foundKey}/${yk}/ghk2`)),
        get(child(ref(window.db), `feedback/${foundKey}`)),
        get(child(ref(window.db), `${paymentStatusPath(sy)}/${student.code || foundKey}`))
    ]);

    const hocbaYear = hocbaSnap.val()  || {};
    const hk1Data   = hk1Snap.val()   || {};
    const hk2Data   = hk2Snap.val()   || {};
    const ghk1Data  = ghk1Snap.val()  || {};
    const ghk2Data  = ghk2Snap.val()  || {};
    const ketQua    = hocbaYear.ketQua || hk2Data.__kq || {};
    const khenThuong = ketQua.khenThuong || khenThuongTheoDanhGia(ketQua.danhGia);

    const feedbacks     = Object.values(fbSnap.val() || {}).sort((a,b) => b.createdAt - a.createdAt);
    const paymentStatus = statusSnap.val() || {};
    const isPaid        = paymentStatus.isPaid || false;

    // Lấy danh sách môn theo khối
    const classNum = (student.classRoom || student.class || '1').match(/^(\d+)/)?.[1] || '1';
    const subjects = window.PRIMARY_SUBJECTS?.[classNum] || window.PRIMARY_SUBJECTS?.['1'] || [];

    // ── Helper render mức đạt ──────────────────────────────────────────────────
    function mucBadge(muc) {
        if (!muc) return '<span style="color:#94a3b8">—</span>';
        const C  = muc==='T'?'#16a34a':muc==='H'?'#2563eb':muc==='Đ'?'#2563eb':muc==='C'?'#dc2626':'#94a3b8';
        const BG = muc==='T'?'#dcfce7':muc==='H'?'#dbeafe':muc==='Đ'?'#dbeafe':muc==='C'?'#fee2e2':'#f1f5f9';
        return `<span style="padding:3px 10px;border-radius:12px;font-size:0.78rem;
                    font-weight:600;background:${BG};color:${C}">${muc}</span>`;
    }

    // Khối 3-5: giữa HK chỉ Tiếng Việt, Toán, Ngoại ngữ 1/Tiếng Anh có điểm số
    const ghkHasNumericScore = (subjectName) => {
        if (typeof window.isGHKScoreSubject === 'function') {
            return window.isGHKScoreSubject(classNum, subjectName);
        }
        const normalized = String(subjectName || '').normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
        return ['3','4','5'].includes(String(classNum))
            && ['tieng viet','toan','ngoai ngu 1','tieng anh'].includes(normalized);
    };
    const hasGHKScore = subjects.some(sub => ghkHasNumericScore(sub.name));

    // ── Helper render 1 bảng môn (dùng cho cả HK và GHK) ──────────────────────
    // showDiem: true = HK cuối (có điểm), false = Giữa HK (chỉ mức)
    // forceShowScore: bật quy tắc điểm GHK riêng cho khối 3-5
    function buildSubjectTable(data, showDiem, accentColor, forceShowScore = false) {
        const hasData = Object.keys(data).filter(k => !k.startsWith('__')).length > 0;
        if (!hasData) return `
            <div style="text-align:center;padding:20px;background:#f8fafc;
                        border-radius:8px;color:#94a3b8;font-size:0.85rem">
                <i class="fas fa-inbox" style="font-size:1.3rem;margin-bottom:6px;display:block"></i>
                Giáo viên chưa nhập dữ liệu
            </div>`;

        const subRows = subjects.map(sub => {
            const sc  = data[sub.name] || {};
            const isDiem = showDiem
                ? sub.type === 'diem'
                : (forceShowScore && ghkHasNumericScore(sub.name));
            const edited = isDiem && isEditedScore(sc);
            const auditText = edited ? scoreAuditSummary(sc) : '';
            const scoreValue = sc.diem ?? sc.diemCN ?? '';
            return `<tr>
                <td style="font-weight:600;padding:7px 10px">${sub.name}</td>
                <td style="text-align:center;padding:7px 8px">${mucBadge(sc.mucDat)}</td>
                <td style="text-align:center;padding:7px 8px;font-weight:700;color:${edited?'#dc2626':'#1d4ed8'}"
                    title="${escapeHtml(auditText)}">
                    ${isDiem
                        ? `${scoreValue!==''?scoreValue:'—'}${edited?' <span style="font-size:.72rem">✎</span>':''}
                           ${edited && auditText ? `<div style="font-size:.65rem;font-weight:400;color:#dc2626;margin-top:2px">${escapeHtml(auditText)}</div>` : ''}`
                        : `<span style="color:#cbd5e1;font-size:0.8rem"
                            title="${showDiem?'Môn không có điểm':'Giữa HK không nhập điểm'}">—</span>`}
                </td>
                <td style="color:#64748b;font-size:0.82rem;padding:7px 8px">${sc.nhanXet || '—'}</td>
            </tr>`;
        }).join('');

        const pcData = data.__pc || {};
        const pcRows = (window.PHAM_CHAT || []).map(pc => {
            const d = pcData[pc] || {};
            return `<tr>
                <td style="padding:6px 10px;font-weight:500">${pc}</td>
                <td style="text-align:center;padding:6px 8px">${mucBadge(d.mucDat)}</td>
                <td style="text-align:center;padding:6px 8px;color:#cbd5e1;font-size:0.8rem">—</td>
                <td style="color:#64748b;font-size:0.82rem;padding:6px 8px">${d.nhanXet || '—'}</td>
            </tr>`;
        }).join('');

        const buildCoreRows = (items, src) => (items || []).map(name => {
            const d = src?.[name] || {};
            return `<tr>
                <td style="padding:6px 10px;font-weight:500">${name}</td>
                <td style="text-align:center;padding:6px 8px">${mucBadge(d.mucDat)}</td>
                <td style="text-align:center;padding:6px 8px;color:#cbd5e1;font-size:0.8rem">—</td>
                <td style="color:#64748b;font-size:0.82rem;padding:6px 8px">${d.nhanXet || '—'}</td>
            </tr>`;
        }).join('');
        const nlcRows = buildCoreRows(window.NANG_LUC_CHUNG || [], data.__nlc || {});
        const nldRows = buildCoreRows(window.NANG_LUC_DAC_THU || [], data.__nld || {});

        return `
            <div style="font-weight:700;color:${accentColor};font-size:0.85rem;margin-bottom:6px">
                1. Các môn học và hoạt động giáo dục
            </div>
            <div class="table-wrapper" style="margin-bottom:14px">
                <table>
                    <thead><tr style="background:${accentColor}18">
                        <th style="min-width:150px">Môn học</th>
                        <th style="text-align:center;min-width:120px">Mức đạt được</th>
                        <th style="text-align:center;min-width:80px">Điểm KTĐK</th>
                        <th>Nhận xét</th>
                    </tr></thead>
                    <tbody>${subRows}</tbody>
                </table>
            </div>
            <div style="font-weight:700;color:${accentColor};font-size:0.85rem;margin-bottom:6px">
                2. Phẩm chất chủ yếu
            </div>
            <div class="table-wrapper">
                <table>
                    <thead><tr style="background:${accentColor}18">
                        <th style="min-width:130px">Phẩm chất</th>
                        <th style="text-align:center;min-width:120px">Mức đạt được</th>
                        <th style="text-align:center;min-width:80px">—</th>
                        <th>Nhận xét</th>
                    </tr></thead>
                    <tbody>${pcRows}</tbody>
                </table>
            </div>
            <div style="font-weight:700;color:${accentColor};font-size:0.85rem;margin:14px 0 6px">
                3. Năng lực cốt lõi — Năng lực chung
            </div>
            <div class="table-wrapper" style="margin-bottom:14px">
                <table>
                    <thead><tr style="background:${accentColor}18">
                        <th style="min-width:130px">Năng lực chung</th>
                        <th style="text-align:center;min-width:120px">Mức đạt được</th>
                        <th style="text-align:center;min-width:80px">—</th>
                        <th>Nhận xét</th>
                    </tr></thead>
                    <tbody>${nlcRows}</tbody>
                </table>
            </div>
            <div style="font-weight:700;color:${accentColor};font-size:0.85rem;margin-bottom:6px">
                4. Năng lực cốt lõi — Năng lực đặc thù
            </div>
            <div class="table-wrapper">
                <table>
                    <thead><tr style="background:${accentColor}18">
                        <th style="min-width:130px">Năng lực đặc thù</th>
                        <th style="text-align:center;min-width:120px">Mức đạt được</th>
                        <th style="text-align:center;min-width:80px">—</th>
                        <th>Nhận xét</th>
                    </tr></thead>
                    <tbody>${nldRows}</tbody>
                </table>
            </div>`;
    }

    // ── Cấu hình 4 tab ─────────────────────────────────────────────────────────
    const TABS = [
        { key:'ghk1', label:'Giữa HK 1', data:ghk1Data, showDiem:false,
          forceScore: hasGHKScore, color:'#7c3aed',
          note: hasGHKScore
            ? 'Khối 3-5: chỉ Tiếng Việt, Toán, Ngoại ngữ 1/Tiếng Anh có Điểm KTĐK; môn khác đánh giá định tính'
            : 'Chỉ đánh giá Mức đạt được — không có điểm số' },
        { key:'hk1',  label:'Cuối HK 1', data:hk1Data,  showDiem:true,
          forceScore: false, color:'#1e3a8a',
          note:'' },
        { key:'ghk2', label:'Giữa HK 2', data:ghk2Data, showDiem:false,
          forceScore: hasGHKScore, color:'#7c3aed',
          note: hasGHKScore
            ? 'Khối 3-5: chỉ Tiếng Việt, Toán, Ngoại ngữ 1/Tiếng Anh có Điểm KTĐK; môn khác đánh giá định tính'
            : 'Chỉ đánh giá Mức đạt được — không có điểm số' },
        { key:'hk2',  label:'Cuối HK 2 ★', data:hk2Data, showDiem:true,
          forceScore: false, color:'#16a34a',
          note:'Kết quả cuối năm được tổng hợp theo Thông tư 27' },
    ];
    const defaultTab = 'hk1';

    document.getElementById('content').innerHTML = `

        <!-- Thông tin cơ bản -->
        <div class="card">
            <h3><i class="fas fa-user-graduate"></i> Thông tin học sinh</h3>
            <div class="grid-3" style="margin-top:15px">
                ${infoItem('Họ và tên',     student.name)}
                ${infoItem('Mã học sinh',   student.code || studentId)}
                ${infoItem('Lớp',           student.classRoom || student.class || '-')}
                ${infoItem('Ngày sinh',     (window.formatStudentDob ? window.formatStudentDob(student.dob) : (student.dob || '-')))}
                ${infoItem('Giới tính',     student.gender || '-')}
                ${infoItem('Trạng thái',    student.status === 'active' ? 'Đang học' : student.status || '-')}
                ${infoItem('SĐT khẩn cấp', student.sosPhone || '-')}
                ${infoItem('Hộ khẩu',      student.permanentAddress || '-')}
                ${infoItem('Ngày nhận',     student.enrollDate || '-')}
            </div>
        </div>

        <!-- Kết quả học tập -->
        <div class="card">
            <h3><i class="fas fa-star"></i> Kết quả học tập — ${sy || 'Năm học hiện tại'}</h3>

            <!-- Tổng kết cuối năm -->
            ${ketQua.danhGia ? `
            <div style="display:flex;gap:10px;flex-wrap:wrap;margin:12px 0 18px;align-items:stretch">
                <div style="background:#1e3a8a;color:white;border-radius:10px;padding:12px 18px;min-width:170px">
                    <div style="font-size:0.72rem;opacity:0.8;margin-bottom:4px">Đánh giá kết quả GD</div>
                    <div style="font-weight:700;font-size:1rem">${ketQua.danhGia}</div>
                    ${ketQua.hoanThanh ? `<div style="font-size:0.75rem;opacity:0.75;margin-top:4px">${ketQua.hoanThanh}</div>` : ''}
                </div>
                ${khenThuong ? `
                <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:12px 18px">
                    <div style="font-size:0.72rem;color:#64748b;margin-bottom:4px">🏆 Khen thưởng</div>
                    <div style="font-weight:700;color:#16a34a">${khenThuong}</div>
                </div>` : ''}
                <div style="background:#f8fafc;border-radius:10px;padding:12px 18px;text-align:center">
                    <div style="font-size:0.72rem;color:#64748b">Nghỉ có phép</div>
                    <div style="font-weight:700;font-size:1.2rem">${hocbaYear.nghiCoPhep ?? ((hk1Data.__body?.nghiCoPhep || 0) + (hk2Data.__body?.nghiCoPhep || 0))}</div>
                    <div style="font-size:0.7rem;color:#94a3b8">buổi</div>
                </div>
                <div style="background:${(hocbaYear.nghiKhongPhep ?? ((hk1Data.__body?.nghiKhongPhep || 0) + (hk2Data.__body?.nghiKhongPhep || 0)))>0?'#fff5f5':'#f8fafc'};border-radius:10px;padding:12px 18px;text-align:center">
                    <div style="font-size:0.72rem;color:#64748b">Nghỉ không phép</div>
                    <div style="font-weight:700;font-size:1.2rem;color:${(hocbaYear.nghiKhongPhep ?? ((hk1Data.__body?.nghiKhongPhep || 0) + (hk2Data.__body?.nghiKhongPhep || 0)))>0?'#dc2626':'#16a34a'}">${hocbaYear.nghiKhongPhep ?? ((hk1Data.__body?.nghiKhongPhep || 0) + (hk2Data.__body?.nghiKhongPhep || 0))}</div>
                    <div style="font-size:0.7rem;color:#94a3b8">buổi</div>
                </div>
            </div>` : ''}

            <!-- Tab bar -->
            <div style="display:flex;background:#f1f5f9;border-radius:8px;padding:3px;
                        gap:2px;margin-bottom:16px;flex-wrap:wrap">
                ${TABS.map(t => `
                    <button onclick="ciSwitchTab('${t.key}')"
                        id="ci-btn-${t.key}"
                        class="btn btn-sm"
                        style="border:none;border-radius:6px;padding:7px 16px;font-size:0.83rem;
                               transition:all .15s;flex:1;min-width:100px;
                               background:${t.key===defaultTab?'white':'transparent'};
                               color:${t.key===defaultTab?t.color:'#64748b'};
                               font-weight:${t.key===defaultTab?'700':'400'};
                               box-shadow:${t.key===defaultTab?'0 1px 3px rgba(0,0,0,0.1)':'none'}">
                        ${t.label}
                    </button>`).join('')}
            </div>

            <!-- Tab content -->
            ${TABS.map(t => `
                <div id="ci-tab-${t.key}" style="display:${t.key===defaultTab?'block':'none'}">
                    ${t.note ? `
                    <div style="background:${t.color}10;border-left:3px solid ${t.color};
                                border-radius:0 6px 6px 0;padding:8px 14px;
                                margin-bottom:12px;font-size:0.82rem;color:${t.color}">
                        <i class="fas fa-info-circle"></i> ${t.note}
                    </div>` : ''}
                    ${buildSubjectTable(t.data, t.showDiem, t.color, t.forceScore || false)}
                </div>`).join('')}
        </div>

        <!-- Tài chính -->
        <div class="card">
            <h3><i class="fas fa-dollar-sign"></i> Thông tin tài chính</h3>
            ${transactions.length > 0 ? `
                <div class="table-wrapper" style="margin-top:15px">
                    <table>
                        <thead>
                            <tr>
                                <th>Ngày</th><th>Loại</th><th>Danh mục</th>
                                <th>Số tiền</th><th>Ghi chú</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${transactions.map(t => {
                                const catName     = t.customIncome || CATEGORY_NAMES[t.category] || t.category;
                                const typeBadge   = t.type==='income' ? 'badge-success' : 'badge-danger';
                                const amountColor = t.type==='income' ? 'var(--success)' : 'var(--danger)';
                                return `<tr>
                                    <td>${new Date(t.date).toLocaleDateString('vi-VN')}</td>
                                    <td><span class="badge ${typeBadge}">${t.type==='income'?'Thu':'Chi'}</span></td>
                                    <td>${catName}</td>
                                    <td style="font-weight:600;color:${amountColor}">${t.amount.toLocaleString('vi-VN')}đ</td>
                                    <td style="color:#64748b">${t.note||'-'}</td>
                                </tr>`;
                            }).join('')}
                            <tr style="background:#f8fafc;font-weight:600">
                                <td colspan="3" style="text-align:right">Tổng cộng:</td>
                                <td colspan="2" style="color:var(--primary)">
                                    ${transactions.reduce((sum,t) => sum+(t.type==='income'?t.amount:-t.amount),0).toLocaleString('vi-VN')}đ
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div style="margin-top:15px">
                    <span class="badge ${isPaid?'badge-success':'badge-warning'}" style="font-size:1rem;padding:8px 16px">
                        ${isPaid
                            ? '<i class="fas fa-check-circle"></i> Đã đóng đủ học phí'
                            : '<i class="fas fa-clock"></i> Chưa đóng đủ học phí'}
                    </span>
                </div>` :
                '<p style="color:#94a3b8;margin-top:15px">Chưa có giao dịch tài chính nào</p>'}
        </div>

        <!-- Phản hồi từ giáo viên -->
        <div class="card">
            <h3><i class="fas fa-comments"></i> Phản hồi từ giáo viên</h3>
            ${feedbacks.length > 0 ? `
                <div style="margin-top:15px">
                    ${feedbacks.map(fb => `
                        <div style="background:#f8fafc;padding:15px;border-radius:8px;
                                    margin-bottom:15px;border-left:4px solid var(--primary)">
                            <div style="display:flex;justify-content:space-between;margin-bottom:8px">
                                <div>
                                    <strong style="color:var(--primary)">${fb.teacherName || 'Giáo viên'}</strong>
                                    ${fb.teacherClass ? `<span style="color:#94a3b8;margin-left:10px;font-size:0.9rem">Lớp ${fb.teacherClass}</span>` : ''}
                                </div>
                                <span style="color:#94a3b8;font-size:0.85rem">
                                    ${new Date(fb.createdAt).toLocaleString('vi-VN')}
                                </span>
                            </div>
                            <div style="color:#334155">${fb.message}</div>
                            ${fb.category ? `<div style="margin-top:8px"><span class="badge badge-info">${fb.category}</span></div>` : ''}
                        </div>`).join('')}
                </div>` :
                '<p style="color:#94a3b8;margin-top:15px">Chưa có phản hồi nào từ giáo viên</p>'}
        </div>`;

    // Gắn hàm switch tab vào window sau khi render xong
    window.ciSwitchTab = function(key) {
        // Lấy màu của tab được chọn
        const TAB_COLORS = { ghk1:'#7c3aed', hk1:'#1e3a8a', ghk2:'#7c3aed', hk2:'#16a34a' };
        // Ẩn tất cả content
        document.querySelectorAll('[id^="ci-tab-"]').forEach(el => el.style.display = 'none');
        // Reset tất cả button
        document.querySelectorAll('[id^="ci-btn-"]').forEach(btn => {
            btn.style.background   = 'transparent';
            btn.style.color        = '#64748b';
            btn.style.fontWeight   = '400';
            btn.style.boxShadow    = 'none';
        });
        // Hiện tab được chọn
        const content = document.getElementById('ci-tab-' + key);
        const btn     = document.getElementById('ci-btn-' + key);
        if (content) content.style.display = 'block';
        if (btn) {
            btn.style.background = 'white';
            btn.style.color      = TAB_COLORS[key] || '#1e3a8a';
            btn.style.fontWeight = '700';
            btn.style.boxShadow  = '0 1px 3px rgba(0,0,0,0.1)';
        }
    };
}

// Helper: render thông tin 1 ô
function infoItem(label, value) {
    return `<div>
        <div style="color:#64748b;font-size:0.9rem">${label}</div>
        <div style="font-weight:600;margin-top:5px">${value}</div>
    </div>`;
}

// ── Gửi phản hồi (Giáo viên) ─────────────────────────────────────────────────
export async function sendFeedback(studentCode, studentName) {
    const result = await Swal.fire({
        title: `Gửi phản hồi cho: ${studentName}`,
        html: `
            <div style="text-align:left;margin-top:15px">
                <label style="font-weight:600;margin-bottom:5px;display:block">Loại phản hồi:</label>
                <select id="feedback-category" class="form-control" style="margin-bottom:15px">
                    <option value="học tập">Học tập</option>
                    <option value="kỷ luật">Kỷ luật</option>
                    <option value="sức khỏe">Sức khỏe</option>
                    <option value="hoạt động">Hoạt động</option>
                    <option value="khen ngợi">Khen ngợi</option>
                    <option value="khác">Khác</option>
                </select>
                <label style="font-weight:600;margin-bottom:5px;display:block">Nội dung:</label>
                <textarea id="feedback-message" class="form-control" rows="5"
                          placeholder="Nhập nội dung phản hồi..."></textarea>
            </div>`,
        showCancelButton: true,
        confirmButtonText: 'Gửi',
        cancelButtonText: 'Hủy',
        width: 600,
        preConfirm: () => {
            const category = document.getElementById('feedback-category').value;
            const message  = document.getElementById('feedback-message').value;
            if (!message.trim()) {
                Swal.showValidationMessage('Vui lòng nhập nội dung phản hồi');
                return false;
            }
            return { category, message };
        }
    });

    if (result.isConfirmed) {
        try {
            let studentKey = studentCode;
            for (let key in window.localData.students) {
                const s = window.localData.students[key];
                if (s.code === studentCode || s.id === studentCode) {
                    studentKey = key;
                    break;
                }
            }
            const feedbackData = {
                studentCode, studentName,
                category:     result.value.category,
                message:      result.value.message,
                teacherName:  window.currentUser.email,
                teacherClass: window.teacherClass,
                createdAt:    Date.now()
            };
            await window.push(window.ref(window.db, `feedback/${studentKey}`), feedbackData);
            Swal.fire({
                icon: 'success', title: 'Đã gửi phản hồi!',
                text: 'Phụ huynh sẽ nhìn thấy phản hồi của bạn.',
                timer: 2000, showConfirmButton: false
            });
        } catch (error) {
            Swal.fire('Lỗi', error.message, 'error');
        }
    }
}
