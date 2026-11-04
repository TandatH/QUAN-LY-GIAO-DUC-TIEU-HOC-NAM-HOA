import { activeStudentValues, isActiveStudent } from "./studentstatus.js?v=5.26.1";
import { paymentStatusPath, paymentStatusClassPath, classKey, financeMatchesYear } from "./yearscope.js";
// ═══════════════════════════════════════════════════════
// finance.js — Quản lý Tài chính (v2: phân lớp)
// ═══════════════════════════════════════════════════════

const CATEGORY_NAMES = {
    tuition:'Học phí', exam_fee:'Phí thi', uniform:'Đồng phục',
    meal:'Tiền ăn', other_income:'Thu khác',
    salary:'Lương', utility:'Điện nước', maintenance:'Bảo trì',
    supplies:'Văn phòng phẩm', other_expense:'Chi khác'
};
const PAYMENT_NAMES = { cash:'Tiền mặt', bank:'Chuyển khoản', card:'Thẻ' };

window._financeCurrentClass = '';

// ── Lấy danh sách lớp từ students ────────────────────────────────────────────
function getAllClasses() {
    return [...new Set(
        activeStudentValues().map(s => s.classRoom || s.class).filter(Boolean)
    )].sort((a, b) => a.localeCompare(b, 'vi'));
}

// ═══════════════════════════════════════════════════════
// RENDER CHÍNH
// ═══════════════════════════════════════════════════════
export function renderFinance() {
    if (window.userRole === 'teacher') { renderFinanceTeacher(); return; }

    const allClasses = getAllClasses();
    if (!window._financeCurrentClass || !allClasses.includes(window._financeCurrentClass)) {
        window._financeCurrentClass = allClasses[0] || '';
    }

    // Tính tổng toàn trường (không phân lớp) cho stat cards
    const allTrans     = Object.values(window.localData.finance);
    const totalIncome  = allTrans.filter(t=>t.type==='income').reduce((s,t)=>s+(t.amount||0),0);
    const totalExpense = allTrans.filter(t=>t.type==='expense').reduce((s,t)=>s+(t.amount||0),0);
    const balance      = totalIncome - totalExpense;
    const now = new Date();
    const monthTrans   = allTrans.filter(t => {
        const d = new Date(t.date);
        return d.getMonth()===now.getMonth() && d.getFullYear()===now.getFullYear();
    });
    const monthIncome  = monthTrans.filter(t=>t.type==='income').reduce((s,t)=>s+(t.amount||0),0);
    const monthExpense = monthTrans.filter(t=>t.type==='expense').reduce((s,t)=>s+(t.amount||0),0);

    document.getElementById('content').innerHTML = `
        <div style="margin-bottom:14px;display:flex;gap:10px;flex-wrap:wrap;align-items:center">
            <button class="btn btn-primary" onclick="openFinanceModal()">
                <i class="fas fa-plus"></i> Thêm Thu/Chi
            </button>
            <button class="btn btn-success" onclick="exportFinanceExcel()">
                <i class="fas fa-file-excel"></i> Xuất Excel
            </button>
            <div style="display:flex;gap:5px;margin-left:auto">
                <button data-finance-tab="list"
                    class="btn ${window.financeTab==='status'?'btn-outline':'btn-primary'}"
                    onclick="switchFinanceTab('list')">
                    <i class="fas fa-list"></i> Giao dịch
                </button>
                <button data-finance-tab="status"
                    class="btn ${window.financeTab==='status'?'btn-primary':'btn-outline'}"
                    onclick="switchFinanceTab('status')">
                    <i class="fas fa-check-circle"></i> Trạng thái đóng tiền
                </button>
            </div>
        </div>

        <!-- Stat cards toàn trường -->
        <div class="grid-4" style="margin-bottom:16px">
            <div class="stat-card" style="border-left-color:var(--success)">
                <div style="color:#64748b;font-size:0.8rem">Tổng Thu (toàn trường)</div>
                <div class="value" style="color:var(--success);font-size:1.3rem">${totalIncome.toLocaleString('vi-VN')}đ</div>
            </div>
            <div class="stat-card" style="border-left-color:var(--danger)">
                <div style="color:#64748b;font-size:0.8rem">Tổng Chi</div>
                <div class="value" style="color:var(--danger);font-size:1.3rem">${totalExpense.toLocaleString('vi-VN')}đ</div>
            </div>
            <div class="stat-card" style="border-left-color:var(--primary)">
                <div style="color:#64748b;font-size:0.8rem">Số dư</div>
                <div class="value" style="color:${balance>=0?'var(--success)':'var(--danger)'};font-size:1.3rem">${balance.toLocaleString('vi-VN')}đ</div>
            </div>
            <div class="stat-card" style="border-left-color:var(--warning)">
                <div style="color:#64748b;font-size:0.8rem">Thu / Chi tháng này</div>
                <div class="value" style="font-size:1rem">
                    <span style="color:var(--success)">${monthIncome.toLocaleString('vi-VN')}</span> /
                    <span style="color:var(--danger)">${monthExpense.toLocaleString('vi-VN')}</span>
                </div>
            </div>
        </div>

        <!-- Tabs lớp — hiển thị cho cả 2 tab -->
        <div id="finance-class-tabs" style="background:white;border-radius:10px;padding:12px 16px;
            margin-bottom:16px;box-shadow:0 1px 3px rgba(0,0,0,0.08);
            display:flex;gap:8px;flex-wrap:wrap;align-items:center">
            <span style="color:#64748b;font-size:0.85rem;font-weight:600;margin-right:4px">
                <i class="fas fa-layer-group"></i> Lớp:
            </span>
            ${allClasses.map(c => `
                <button id="fintab-${c.replace('/','_')}" onclick="switchFinanceClass('${c}')"
                    class="btn btn-sm ${c === window._financeCurrentClass ? 'btn-primary' : 'btn-outline'}"
                    style="font-size:0.82rem;padding:5px 14px">${c}</button>
            `).join('')}
            <button onclick="switchFinanceClass('__all__')"
                class="btn btn-sm ${window._financeCurrentClass === '__all__' ? 'btn-primary' : 'btn-outline'}"
                style="font-size:0.82rem;padding:5px 14px;margin-left:auto">
                <i class="fas fa-globe"></i> Tất cả lớp
            </button>
        </div>

        <div id="finance-content-area"></div>`;

    window.financeTab = window.financeTab || 'list';
    switchFinanceTab(window.financeTab);
}

window.switchFinanceClass = function(cls) {
    window._financeCurrentClass = cls;
    // Cập nhật active state cho tất cả tab buttons
    document.querySelectorAll('[id^="fintab-"]').forEach(btn => {
        btn.className = 'btn btn-sm btn-outline';
    });
    if (cls !== '__all__') {
        const tab = document.getElementById(`fintab-${cls.replace('/','_')}`);
        if (tab) tab.className = 'btn btn-sm btn-primary';
    }
    // Cập nhật nút "Tất cả"
    document.querySelectorAll('#finance-class-tabs .btn').forEach(btn => {
        if (btn.textContent.includes('Tất cả')) {
            btn.className = cls === '__all__'
                ? 'btn btn-sm btn-primary'
                : 'btn btn-sm btn-outline';
        }
    });
    // Render đúng tab đang active
    if (window.financeTab === 'status') renderPaymentStatus();
    else renderFinanceList();
};

export function switchFinanceTab(tab) {
    window.financeTab = tab;
    document.querySelectorAll('[data-finance-tab]').forEach(btn => {
        btn.className = btn.dataset.financeTab === tab ? 'btn btn-primary' : 'btn btn-outline';
    });
    // Tabs lớp luôn hiển thị cho cả 2 tab
    // (không ẩn nữa)

    if (tab === 'list') renderFinanceList();
    else renderPaymentStatus();
}

// ── Finance List — lọc theo lớp đang chọn ở tabs ────────────────────────────
function renderFinanceList() {
    const cls = window._financeCurrentClass || '__all__';

    // Lọc giao dịch theo lớp
    let transactions = Object.values(window.localData.finance);
    if (cls && cls !== '__all__') {
        const codesInClass = new Set(
            activeStudentValues()
                .filter(s => (s.classRoom || s.class || '') === cls)
                .flatMap(s => [s.code, s.id].filter(Boolean))
        );
        // Giữ lại: giao dịch của HS trong lớp + giao dịch chi chung (không có studentCode)
        transactions = transactions.filter(t =>
            !t.studentCode || codesInClass.has(t.studentCode)
        );
    }

    const clsLabel = cls === '__all__' ? 'Tất cả lớp' : `Lớp ${cls}`;
    const incomeSum  = transactions.filter(t=>t.type==='income').reduce((s,t)=>s+(t.amount||0),0);
    const expenseSum = transactions.filter(t=>t.type==='expense').reduce((s,t)=>s+(t.amount||0),0);

    document.getElementById('finance-content-area').innerHTML = `
        <!-- Mini stat cho lớp đang chọn -->
        <div style="display:flex;gap:10px;margin-bottom:14px;flex-wrap:wrap">
            <div style="background:#f0fdf4;border-radius:8px;padding:10px 16px;flex:1;min-width:120px">
                <div style="font-size:0.75rem;color:#64748b">${clsLabel} — Thu</div>
                <div style="font-weight:700;color:#16a34a;font-size:1.1rem">${incomeSum.toLocaleString('vi-VN')}đ</div>
            </div>
            <div style="background:#fef2f2;border-radius:8px;padding:10px 16px;flex:1;min-width:120px">
                <div style="font-size:0.75rem;color:#64748b">${clsLabel} — Chi</div>
                <div style="font-weight:700;color:#dc2626;font-size:1.1rem">${expenseSum.toLocaleString('vi-VN')}đ</div>
            </div>
            <div style="background:#eff6ff;border-radius:8px;padding:10px 16px;flex:1;min-width:120px">
                <div style="font-size:0.75rem;color:#64748b">Số dư</div>
                <div style="font-weight:700;color:${(incomeSum-expenseSum)>=0?'#1d4ed8':'#dc2626'};font-size:1.1rem">${(incomeSum-expenseSum).toLocaleString('vi-VN')}đ</div>
            </div>
            <div style="display:flex;gap:6px;align-items:center;margin-left:auto">
                <select id="finance-filter" class="custom-select" onchange="filterFinance()" style="min-width:150px">
                    <option value="all">Tất cả giao dịch</option>
                    <option value="income">Chỉ Thu</option>
                    <option value="expense">Chỉ Chi</option>
                    <option value="month">Tháng này</option>
                </select>
                <span id="finance-count" style="color:#64748b;font-size:0.85rem;white-space:nowrap"></span>
            </div>
        </div>
        <div class="table-wrapper">
            <table>
                <thead>
                    <tr>
                        <th>STT</th><th>Ngày</th><th>Loại</th><th>Danh mục</th>
                        <th>Số tiền</th><th>Mã HS / Lớp</th><th>PT TT</th>
                        <th>Ghi chú</th><th>Thao tác</th>
                    </tr>
                </thead>
                <tbody id="finance-tbody"></tbody>
            </table>
        </div>`;

    // Lưu transactions đã lọc theo lớp để filterFinance() dùng
    window._financeListTransactions = transactions;
    renderFinanceTable(transactions);
}

function getStudentClass(studentCode) {
    if (!studentCode) return '';
    const s = activeStudentValues().find(
        st => st.code === studentCode || st.id === studentCode
    );
    return s ? (s.classRoom || s.class || '') : '';
}

function renderFinanceTable(transactions) {
    const sorted = [...transactions].sort((a,b) => (b.date||'').localeCompare(a.date||''));
    const countEl = document.getElementById('finance-count');
    if (countEl) countEl.textContent = `${sorted.length} giao dịch`;

    const html = sorted.map((t,i) => {
        const typeText    = t.type === 'income' ? 'Thu' : 'Chi';
        const typeBadge   = t.type === 'income' ? 'badge-success' : 'badge-danger';
        const amountColor = t.type === 'income' ? 'var(--success)' : 'var(--danger)';
        const catName     = t.customIncome || CATEGORY_NAMES[t.category] || t.category;
        const cls         = getStudentClass(t.studentCode);
        return `<tr>
            <td>${i+1}</td>
            <td>${t.date || '-'}</td>
            <td><span class="badge ${typeBadge}">${typeText}</span></td>
            <td>${catName}</td>
            <td style="font-weight:600;color:${amountColor}">${(t.amount||0).toLocaleString('vi-VN')}đ</td>
            <td>${t.studentCode ? `<span style="font-size:0.85rem">${t.studentCode}</span>${cls ? `<br><small style="color:#94a3b8">${cls}</small>` : ''}` : '-'}</td>
            <td>${PAYMENT_NAMES[t.paymentMethod] || '-'}</td>
            <td style="color:#64748b;font-size:0.9rem">${t.note || '-'}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="editFinance('${t.id}')"><i class="fas fa-edit"></i></button>
                <button class="btn btn-sm btn-danger" onclick="deleteFinance('${t.id}')" style="margin-left:3px"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`;
    }).join('');

    const tbody = document.getElementById('finance-tbody');
    if (tbody) tbody.innerHTML = html ||
        `<tr><td colspan="9" style="text-align:center;color:#94a3b8;padding:30px">Chưa có giao dịch nào</td></tr>`;
}

export function filterFinance() {
    const filter = document.getElementById('finance-filter')?.value || 'all';
    // Dùng transactions đã lọc theo lớp (từ renderFinanceList)
    let transactions = window._financeListTransactions || Object.values(window.localData.finance);

    if (filter === 'income')       transactions = transactions.filter(t => t.type === 'income');
    else if (filter === 'expense') transactions = transactions.filter(t => t.type === 'expense');
    else if (filter === 'month') {
        const now = new Date();
        transactions = transactions.filter(t => {
            const d = new Date(t.date);
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        });
    }

    renderFinanceTable(transactions);
}

// ── Trạng thái đóng tiền — phân theo lớp ─────────────────────────────────────
export async function renderPaymentStatus() {
    if (!window._cachedPaymentStatus) {
        const snap = await window.get(window.child(window.ref(window.db), paymentStatusPath()));
        window._cachedPaymentStatus = snap.val() || {};
    }
    const paymentStatus = window._cachedPaymentStatus;
    const transactions  = Object.values(window.localData.finance);
    const cls = window._financeCurrentClass;

    // Lọc HS theo lớp
    let students = activeStudentValues();
    if (cls && cls !== '__all__') {
        students = students.filter(s => (s.classRoom || s.class || '') === cls);
    }
    students.sort((a,b) => {
        const la = (a.name||'').trim().split(' ').slice(-1)[0];
        const lb = (b.name||'').trim().split(' ').slice(-1)[0];
        return la.localeCompare(lb, 'vi');
    });

    // Tính tổng đóng của lớp
    const classStudentCodes = new Set(students.map(s => s.code || s.id));
    const classTrans = transactions.filter(t => classStudentCodes.has(t.studentCode));
    const classTotalInc = classTrans.filter(t=>t.type==='income').reduce((s,t)=>s+(t.amount||0),0);
    const paidCount  = students.filter(s => paymentStatus[s.code||s.id]?.isPaid).length;

    let html = `
        <div class="grid-4" style="margin-bottom:16px">
            <div class="stat-card" style="border-left-color:var(--success)">
                <div style="color:#64748b;font-size:0.8rem">Tổng thu lớp ${cls === '__all__' ? '(tất cả)' : cls}</div>
                <div class="value" style="color:var(--success);font-size:1.3rem">${classTotalInc.toLocaleString('vi-VN')}đ</div>
            </div>
            <div class="stat-card" style="border-left-color:var(--primary)">
                <div style="color:#64748b;font-size:0.8rem">Số học sinh</div>
                <div class="value" style="font-size:1.3rem">${students.length}</div>
            </div>
            <div class="stat-card" style="border-left-color:var(--success)">
                <div style="color:#64748b;font-size:0.8rem">Đã đóng đủ</div>
                <div class="value" style="color:var(--success);font-size:1.3rem">${paidCount}</div>
            </div>
            <div class="stat-card" style="border-left-color:var(--warning)">
                <div style="color:#64748b;font-size:0.8rem">Chưa đóng đủ</div>
                <div class="value" style="color:var(--warning);font-size:1.3rem">${students.length - paidCount}</div>
            </div>
        </div>

        <div style="margin-bottom:15px;display:flex;gap:10px;align-items:center">
            <input type="text" id="search-student" class="form-control"
                   placeholder="Tìm theo mã HS hoặc tên..."
                   onkeyup="filterPaymentStatus()"
                   style="max-width:300px">
            <span style="color:#64748b;font-size:0.85rem;margin-left:auto">${students.length} học sinh</span>
        </div>
        <div class="table-wrapper">
            <table>
                <thead>
                    <tr>
                        <th>STT</th><th>Mã HS</th><th>Họ tên</th><th>Lớp</th>
                        <th>Các khoản đã đóng</th><th>Tổng tiền</th><th>Trạng thái</th>
                    </tr>
                </thead>
                <tbody id="payment-status-tbody">`;

    students.forEach((student, index) => {
        const studentCode  = student.code || student.id;
        const studentTrans = transactions.filter(t =>
            t.studentCode === studentCode || t.studentCode === student.id
        );
        const totalInc = studentTrans.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
        const totalExp = studentTrans.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
        const netTotal = totalInc - totalExp;
        const isPaid   = paymentStatus[studentCode]?.isPaid || false;

        const transDetails = studentTrans.slice(0,3).map(t => {
            const catName = t.customIncome || CATEGORY_NAMES[t.category] || t.category;
            const color   = t.type==='income' ? 'var(--success)' : 'var(--danger)';
            return `<div style="margin:2px 0;font-size:0.82rem">• ${catName}: <strong style="color:${color}">${t.amount.toLocaleString('vi-VN')}đ</strong></div>`;
        }).join('') + (studentTrans.length > 3 ? `<div style="font-size:0.8rem;color:#94a3b8">...và ${studentTrans.length-3} khoản khác</div>` : '');

        html += `
            <tr data-student-code="${studentCode.toLowerCase()}" data-student-name="${student.name.toLowerCase()}">
                <td>${index+1}</td>
                <td><strong>${studentCode}</strong></td>
                <td>${student.name}</td>
                <td>${student.classRoom || student.class || '-'}</td>
                <td style="max-width:260px">${transDetails || '<span style="color:#94a3b8;font-size:0.85rem">Chưa có giao dịch</span>'}</td>
                <td style="font-weight:600;color:${netTotal>=0?'var(--success)':'var(--danger)'}">
                    ${netTotal.toLocaleString('vi-VN')}đ
                </td>
                <td>
                    <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
                        <input type="checkbox" ${isPaid?'checked':''}
                               onchange="togglePaymentStatus('${studentCode}',this.checked)"
                               style="width:18px;height:18px;cursor:pointer">
                        <span class="badge ${isPaid?'badge-success':'badge-warning'}">
                            ${isPaid?'Đã đóng đủ':'Chưa đủ'}
                        </span>
                    </label>
                </td>
            </tr>`;
    });

    html += '</tbody></table></div>';
    document.getElementById('finance-content-area').innerHTML = html;
}

export function filterPaymentStatus() {
    const search = document.getElementById('search-student')?.value.toLowerCase() || '';
    document.querySelectorAll('#payment-status-tbody tr').forEach(row => {
        const code = row.dataset.studentCode || '';
        const name = row.dataset.studentName || '';
        row.style.display = (code.includes(search) || name.includes(search)) ? '' : 'none';
    });
}

export async function togglePaymentStatus(studentCode, isPaid) {
    try {
        const entry = Object.entries(window.localData.students || {}).find(([,s]) => (s.code || s.id) === studentCode || s.id === studentCode);
        const studentKey = entry?.[0] || '';
        const student = entry?.[1] || {};
        const className = student.classRoom || student.class || '';
        const record = {
            isPaid,
            studentKey,
            studentCode,
            className,
            classKey: classKey(className),
            schoolYear: window._currentSchoolYear || '',
            updatedAt: typeof window.serverNow === 'function' ? window.serverNow() : Date.now(),
            updatedBy: window.currentUser.email,
            updatedByUid: window.currentUser.uid
        };
        const updates = {};
        updates[`${paymentStatusPath()}/${studentCode}`] = record;
        updates[`${paymentStatusClassPath(className)}/${studentCode}`] = record;
        // Dọn chỉ mục lớp cũ để giáo viên lớp cũ không còn đọc được trạng thái của học sinh đã chuyển lớp.
        const indexSnap = await window.get(window.ref(window.db, `paymentStatusByClass/${String(window._currentSchoolYear || '').replace('-', '_')}`));
        const indexRoot = indexSnap.val() || {};
        Object.entries(indexRoot).forEach(([indexedClassKey, records]) => {
            if (indexedClassKey !== classKey(className) && records?.[studentCode]) {
                updates[`paymentStatusByClass/${String(window._currentSchoolYear || '').replace('-', '_')}/${indexedClassKey}/${studentCode}`] = null;
            }
        });
        await window.update(window.ref(window.db), updates);
        if (window._cachedPaymentStatus) {
            window._cachedPaymentStatus[studentCode] = { isPaid, updatedAt: Date.now() };
        }
        Swal.fire({ icon:'success', title: isPaid ? 'Đã đánh dấu đóng đủ' : 'Đã bỏ đánh dấu', timer:1000, showConfirmButton:false });
        renderPaymentStatus();
    } catch (error) {
        Swal.fire('Lỗi', error.message, 'error');
    }
}

// ── Teacher Finance View ──────────────────────────────────────────────────────
function renderFinanceTeacher() {
    const students = activeStudentValues()
        .filter(s => s.classRoom===window.teacherClass || s.class===window.teacherClass);

    window.get(window.child(window.ref(window.db), paymentStatusClassPath(window.teacherClass))).then(snap => {
        const paymentStatus = snap.val() || {};
        document.getElementById('content').innerHTML = `
            <div class="card" style="margin-bottom:15px">
                <h3>Danh sách đóng tiền lớp ${window.teacherClass}</h3>
                <p style="color:#64748b;margin-top:5px">V5 chỉ hiển thị trạng thái đóng tiền của đúng lớp được phân công; chi tiết giao dịch chỉ Admin được xem.</p>
            </div>
            <div class="table-wrapper"><table><thead><tr>
                <th>STT</th><th>Mã HS</th><th>Họ tên</th><th>Trạng thái</th><th>Cập nhật gần nhất</th>
            </tr></thead><tbody>
            ${students.map((s,i) => {
                const studentCode=s.code||s.id; const rec=paymentStatus[studentCode]||{};
                return `<tr><td>${i+1}</td><td>${studentCode}</td><td>${s.name||''}</td>
                    <td><span class="badge ${rec.isPaid?'badge-success':'badge-warning'}">${rec.isPaid?'Đã đóng đủ':'Chưa đủ'}</span></td>
                    <td>${rec.updatedAt ? new Date(rec.updatedAt).toLocaleString('vi-VN') : '—'}</td></tr>`;
            }).join('')}
            </tbody></table></div>`;
    }).catch(error => {
        document.getElementById('content').innerHTML = `<div class="card" style="color:#dc2626">Không tải được trạng thái đóng tiền: ${error.message}</div>`;
    });
}

// ── Modal helpers ─────────────────────────────────────────────────────────────
export function openFinanceModal() {
    window.editingFinanceId = null;
    document.getElementById('modal-finance-title').textContent = 'Thêm Khoản Thu/Chi';
    document.getElementById('finance-form').reset();
    document.getElementById('finance-form').date.value = new Date().toISOString().split('T')[0];
    document.getElementById('custom-income-field').style.display = 'none';
    document.getElementById('modal-finance').style.display = 'flex';
}

export function editFinance(id) {
    const transaction = window.localData.finance[id];
    if (!transaction) return;
    window.editingFinanceId = id;
    document.getElementById('modal-finance-title').textContent = 'Sửa Giao dịch';
    const form = document.getElementById('finance-form');
    form.type.value          = transaction.type;
    form.category.value      = transaction.category;
    form.amount.value        = transaction.amount;
    form.date.value          = transaction.date;
    form.studentCode.value   = transaction.studentCode || '';
    form.paymentMethod.value = transaction.paymentMethod;
    form.note.value          = transaction.note || '';
    if (transaction.customIncome) {
        document.getElementById('custom-income-field').style.display = 'block';
        form.customIncome.value = transaction.customIncome;
    }
    document.getElementById('modal-finance').style.display = 'flex';
}

export async function saveFinance(e) {
    e.preventDefault();
    const form = e.target;
    const data = {
        type:          form.type.value,
        category:      form.category.value,
        amount:        parseFloat(form.amount.value),
        date:          form.date.value,
        studentCode:   form.studentCode.value,
        paymentMethod: form.paymentMethod.value,
        note:          form.note.value,
        schoolYear:    window._currentSchoolYear || '',
        createdBy:     window.currentUser.email,
        createdAt:     Date.now()
    };
    if (form.category.value === 'other_income') data.customIncome = form.customIncome?.value || '';
    try {
        if (window.editingFinanceId) {
            delete data.createdAt;
            data.updatedAt = Date.now();
            data.updatedBy = window.currentUser.email;
            await window.update(window.ref(window.db, `finance/${window.editingFinanceId}`), data);
            Swal.fire('Thành công', 'Đã cập nhật giao dịch', 'success');
        } else {
            const newRef = window.push(window.ref(window.db, 'finance'));
            data.id = newRef.key;
            await window.set(newRef, data);
            Swal.fire('Thành công', 'Đã thêm giao dịch mới', 'success');
        }
        window.closeModal('modal-finance');
        // Reload finance data
        const snap = await window.get(window.child(window.ref(window.db), 'finance'));
        const allFinance = snap.val() || {};
        window.localData.finance = Object.fromEntries(Object.entries(allFinance).filter(([,tx]) => financeMatchesYear(tx)));
        window._cachedPaymentStatus = null;
        renderFinance();
    } catch (error) {
        Swal.fire('Lỗi', error.message, 'error');
    }
}

export async function deleteFinance(id) {
    const result = await Swal.fire({
        title:'Xác nhận xóa?', text:'Bạn có chắc muốn xóa giao dịch này?',
        icon:'warning', showCancelButton:true, confirmButtonText:'Xóa', cancelButtonText:'Hủy'
    });
    if (result.isConfirmed) {
        try {
            await window.remove(window.ref(window.db, `finance/${id}`));
            delete window.localData.finance[id];
            Swal.fire('Đã xóa', 'Giao dịch đã được xóa', 'success');
            renderFinance();
        } catch (error) {
            Swal.fire('Lỗi', error.message, 'error');
        }
    }
}

export function toggleFinanceCategory() {
    const form = document.getElementById('finance-form');
    const isOtherIncome = form?.category?.value === 'other_income';
    document.getElementById('custom-income-field').style.display = isOtherIncome ? 'block' : 'none';
}

export function exportFinanceExcel() {
    const sy           = window._currentSchoolYear || (()=>{const n=new Date(),y=n.getFullYear();return n.getMonth()>=7?`${y}-${y+1}`:`${y-1}-${y}`;})();
    const allTrans     = Object.values(window.localData.finance)
                            .sort((a,b)=>(a.date||'').localeCompare(b.date||''));
    const allStudents  = activeStudentValues();
    const allClasses   = [...new Set(allStudents.map(s=>s.classRoom||s.class).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'vi'));

    // ── Helper: lấy lớp từ mã HS (cache) ─────────────────────────────────────
    const codeToClass = {};
    allStudents.forEach(s => {
        if (s.code) codeToClass[s.code] = s.classRoom||s.class||'';
        codeToClass[s.id]  = s.classRoom||s.class||'';
    });
    const codeToName = {};
    allStudents.forEach(s => {
        if (s.code) codeToName[s.code] = s.name||'';
        codeToName[s.id]  = s.name||'';
    });
    const getCls  = code => code ? (codeToClass[code] || '') : '';
    const getName = code => code ? (codeToName[code]  || '') : '';

    // ── Helper: build 1 worksheet từ danh sách giao dịch ────────────────────
    // Cấu trúc: R0=tiêu đề, R1=năm học, R2=header, R3+=data, Rcuối=tổng
    function buildSheet(trans, sheetTitle) {
        const aoa = []; // array of arrays

        // R0: Tiêu đề lớn
        aoa.push([sheetTitle]);
        // R1: Năm học + ngày xuất
        aoa.push([`Năm học: ${sy}   |   Xuất ngày: ${new Date().toLocaleDateString('vi-VN')}`]);
        // R2: trống
        aoa.push([]);
        // R3: Header
        aoa.push(['STT','Ngày','Loại','Danh mục / Nội dung','Mã HS','Tên học sinh','Lớp','Số tiền (VNĐ)','PT Thanh toán','Ghi chú']);

        let income = 0, expense = 0;
        trans.forEach((t, i) => {
            const catName = t.customIncome || CATEGORY_NAMES[t.category] || t.category || '';
            const cls     = getCls(t.studentCode);
            const name    = getName(t.studentCode);
            const isInc   = t.type === 'income';
            if (isInc) income += t.amount||0; else expense += t.amount||0;
            aoa.push([
                i+1,
                t.date || '',
                isInc ? 'Thu' : 'Chi',
                catName,
                t.studentCode || '',
                name,
                cls,
                t.amount || 0,
                PAYMENT_NAMES[t.paymentMethod] || '',
                t.note || '',
            ]);
        });

        // Hàng trống
        aoa.push([]);
        // Hàng tổng
        aoa.push(['','','','','','','Tổng Thu:', income, '', '']);
        aoa.push(['','','','','','','Tổng Chi:', expense, '', '']);
        aoa.push(['','','','','','','Số dư:', income - expense, '', '']);

        const ws = XLSX.utils.aoa_to_sheet(aoa);

        // ── Column widths ────────────────────────────────────────────────────
        ws['!cols'] = [
            {wch:5},  // STT
            {wch:12}, // Ngày
            {wch:6},  // Loại
            {wch:30}, // Danh mục
            {wch:12}, // Mã HS
            {wch:22}, // Tên HS
            {wch:8},  // Lớp
            {wch:16}, // Số tiền
            {wch:14}, // PT TT
            {wch:25}, // Ghi chú
        ];

        // ── Merge tiêu đề R0, R1 ────────────────────────────────────────────
        ws['!merges'] = [
            { s:{r:0,c:0}, e:{r:0,c:9} },
            { s:{r:1,c:0}, e:{r:1,c:9} },
        ];

        // ── Row heights ──────────────────────────────────────────────────────
        ws['!rows'] = [
            {hpt:26}, // R0 tiêu đề
            {hpt:18}, // R1 năm học
            {hpt:6},  // R2 trống
            {hpt:20}, // R3 header
        ];

        // ── Styling từng cell ────────────────────────────────────────────────
        const enc = (r,c) => XLSX.utils.encode_cell({r,c});

        // Tiêu đề (R0)
        ws[enc(0,0)].s = {
            font:{ bold:true, sz:14, color:{rgb:'FFFFFF'}, name:'Arial' },
            fill:{ patternType:'solid', fgColor:{rgb:'1E3A8A'} },
            alignment:{ horizontal:'center', vertical:'center' },
            border:_finBorder(),
        };
        // Năm học (R1)
        ws[enc(1,0)].s = {
            font:{ sz:10, color:{rgb:'374151'}, name:'Arial' },
            fill:{ patternType:'solid', fgColor:{rgb:'EFF6FF'} },
            alignment:{ horizontal:'center', vertical:'center' },
            border:_finBorder(),
        };
        // Header (R3)
        for (let c=0; c<10; c++) {
            const cell = ws[enc(3,c)];
            if (!cell) continue;
            cell.s = {
                font:{ bold:true, sz:10, color:{rgb:'FFFFFF'}, name:'Arial' },
                fill:{ patternType:'solid', fgColor:{rgb:'2563EB'} },
                alignment:{ horizontal:'center', vertical:'center', wrapText:true },
                border:_finBorder('1E3A8A'),
            };
        }
        // Data rows
        const DATA_START = 4;
        trans.forEach((t, i) => {
            const r    = DATA_START + i;
            const isInc = t.type === 'income';
            const bg   = i % 2 === 0 ? 'F8FAFC' : 'FFFFFF';
            for (let c=0; c<10; c++) {
                const cell = ws[enc(r,c)];
                if (!cell) continue;
                const isAmtCol = c === 7;
                cell.s = {
                    font:{
                        sz:10, name:'Arial',
                        bold: isAmtCol,
                        color:{ rgb: isAmtCol ? (isInc?'166534':'DC2626') : '1E293B' },
                    },
                    fill:{ patternType:'solid', fgColor:{rgb: bg} },
                    alignment:{ horizontal: isAmtCol?'right' : c===0?'center':'left', vertical:'center' },
                    border:_finBorder(),
                    numFmt: isAmtCol ? '#,##0' : undefined,
                };
                if (isAmtCol) cell.s.numFmt = '#,##0';
            }
            // Badge loại Thu/Chi (col 2)
            const typeCell = ws[enc(r,2)];
            if (typeCell) {
                typeCell.s.fill = { patternType:'solid', fgColor:{rgb: isInc?'DCFCE7':'FEE2E2'} };
                typeCell.s.font.color = { rgb: isInc?'166534':'991B1B' };
                typeCell.s.alignment.horizontal = 'center';
            }
        });

        // Hàng tổng (3 hàng cuối)
        const totalStart = DATA_START + trans.length + 1;
        const TOTAL_COLORS = ['166534','DC2626', income-expense>=0?'1D4ED8':'DC2626'];
        const TOTAL_BG     = ['DCFCE7','FEE2E2', income-expense>=0?'DBEAFE':'FEE2E2'];
        [0,1,2].forEach(ti => {
            const r = totalStart + ti;
            const labelCell = ws[enc(r,6)];
            const valueCell = ws[enc(r,7)];
            if (labelCell) labelCell.s = {
                font:{bold:true, sz:11, name:'Arial', color:{rgb:TOTAL_COLORS[ti]}},
                fill:{patternType:'solid', fgColor:{rgb:TOTAL_BG[ti]}},
                alignment:{horizontal:'right', vertical:'center'},
                border:_finBorder(TOTAL_COLORS[ti]),
            };
            if (valueCell) {
                valueCell.s = {
                    font:{bold:true, sz:12, name:'Arial', color:{rgb:TOTAL_COLORS[ti]}},
                    fill:{patternType:'solid', fgColor:{rgb:TOTAL_BG[ti]}},
                    alignment:{horizontal:'right', vertical:'center'},
                    border:_finBorder(TOTAL_COLORS[ti]),
                    numFmt:'#,##0',
                };
                valueCell.s.numFmt = '#,##0';
            }
        });

        return ws;
    }

    // ── Thin border helper ────────────────────────────────────────────────────
    function _finBorder(clr='CBD5E1') {
        const b = { style:'thin', color:{rgb:clr} };
        return { top:b, right:b, bottom:b, left:b };
    }

    // ── Build workbook ────────────────────────────────────────────────────────
    const wb = XLSX.utils.book_new();
    const addSafe = (ws, name) => {
        const safe = name.replace(/[\/\?*\[\]:]/g,'_').substring(0,31);
        XLSX.utils.book_append_sheet(wb, ws, safe);
    };

    // Sheet 1: Tổng hợp toàn trường
    addSafe(
        buildSheet(allTrans, `BÁO CÁO TÀI CHÍNH TOÀN TRƯỜNG — ${sy}`),
        `TongHop_${sy.replace('-','_')}`
    );

    // Sheet theo từng lớp
    allClasses.forEach(cls => {
        const codesInClass = new Set(
            allStudents
                .filter(s => (s.classRoom||s.class||'') === cls)
                .flatMap(s => [s.code, s.id].filter(Boolean))
        );
        const clsTrans = allTrans.filter(t =>
            t.studentCode && codesInClass.has(t.studentCode)
        );
        if (!clsTrans.length) return; // bỏ qua lớp chưa có giao dịch
        addSafe(
            buildSheet(clsTrans, `BÁO CÁO TÀI CHÍNH — LỚP ${cls} — ${sy}`),
            `Lop_${cls.replace('/','_')}`
        );
    });

    // Sheet chi chung (không gắn lớp/HS)
    const chiChung = allTrans.filter(t => !t.studentCode);
    if (chiChung.length) {
        addSafe(
            buildSheet(chiChung, `CHI CHUNG (LƯƠNG, ĐIỆN NƯỚC...) — ${sy}`),
            'ChiChung'
        );
    }

    const today = new Date().toISOString().split('T')[0].replace(/-/g,'');
    XLSX.writeFile(wb, `TaiChinh_${sy.replace('-','_')}_${today}.xlsx`);

    Swal.fire({
        icon:'success', title:'Xuất Excel thành công!',
        html:`<div style="text-align:left;font-size:0.9rem">
            <p>📁 <b>TaiChinh_${sy.replace('-','_')}_${today}.xlsx</b></p>
            <div style="margin-top:8px;background:#f0fdf4;padding:10px;border-radius:8px;font-size:0.83rem">
                ${wb.SheetNames.map(n=>`<p>✓ Sheet: <b>${n}</b></p>`).join('')}
            </div>
        </div>`,
        timer: 4000, showConfirmButton: false,
    });
}
