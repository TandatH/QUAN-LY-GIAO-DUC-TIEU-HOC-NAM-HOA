import { activeStudentValues, isActiveStudent } from "./studentstatus.js?v=5.26.1";

// ═══════════════════════════════════════════════════════
// users.js — Quản lý Tài khoản V5.29.0
// - Tạo tài khoản có hồ sơ giáo viên/phụ huynh/admin
// - Yêu cầu đổi mật khẩu lần đầu khi Admin cấp mật khẩu tạm
// - Admin gửi email reset mật khẩu qua Firebase Auth
// ═══════════════════════════════════════════════════════

console.info('[Smart School V5.29.0] users profile + first-password-change + reset loaded');

function classKey(value) {
    return String(value || '').trim().replace(/\//g, '_').replace(/[.#$\[\]]/g, '_');
}

function htmlEscape(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function nowValue() {
    return typeof window.serverNow === 'function' ? window.serverNow() : Date.now();
}

function roleLabel(role) {
    return {
        admin: 'Admin',
        teacher: 'Giáo viên CN',
        subject_teacher: 'GV Bộ môn',
        parent: 'Phụ huynh',
        staff: 'Nhân viên'
    }[role] || role || '—';
}

function getClassList() {
    return [...new Set(
        activeStudentValues().map(s => s.classRoom || s.class).filter(Boolean)
    )].sort((a, b) => a.localeCompare(b, 'vi'));
}

function getSubjectList() {
    const fromSubjects = Object.values(window.PRIMARY_SUBJECTS || {})
        .flat()
        .map(s => s?.name)
        .filter(Boolean);
    const fallback = [
        'Tiếng Việt','Toán','Ngoại ngữ 1','Lịch sử và Địa lí','Khoa học',
        'Tin học','Công nghệ','Đạo đức','Tự nhiên và Xã hội',
        'Giáo dục thể chất','Nghệ thuật (Âm nhạc)','Nghệ thuật (Mỹ thuật)',
        'Hoạt động trải nghiệm','Tiếng dân tộc'
    ];
    return [...new Set([...fromSubjects, ...fallback])].sort((a,b) => a.localeCompare(b, 'vi'));
}

function getStudentOptions() {
    return activeStudentValues()
        .sort((a,b) => `${a.classRoom || a.class || ''} ${a.name || ''}`.localeCompare(`${b.classRoom || b.class || ''} ${b.name || ''}`, 'vi'));
}

function ensureCreateUserModal() {
    const old = document.getElementById('modal-create-user');
    if (old) old.remove();

    const modal = document.createElement('div');
    modal.id = 'modal-create-user';
    modal.className = 'modal';
    modal.style.display = 'none';
    modal.innerHTML = `
        <div class="modal-content" style="max-width:920px;width:95%;max-height:92vh;overflow:auto">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;border-bottom:1px solid #e2e8f0;padding-bottom:12px">
                <h3 style="margin:0;color:#1e293b">
                    <i class="fas fa-user-plus"></i> Tạo tài khoản mới
                </h3>
                <button type="button" onclick="closeCreateUserModal()" class="btn btn-outline btn-sm"
                        style="margin-left:auto">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px">
                <div class="form-group">
                    <label>Email đăng nhập *</label>
                    <input id="cu-email" type="email" class="form-control" placeholder="giaovien@gmail.com">
                </div>
                <div class="form-group">
                    <label>Mật khẩu tạm *</label>
                    <input id="cu-pass" type="text" class="form-control" placeholder="VD: TamHa@2026">
                    <small style="color:#64748b">Người dùng sẽ được yêu cầu đổi mật khẩu khi đăng nhập lần đầu.</small>
                </div>
                <div class="form-group">
                    <label>Vai trò *</label>
                    <select id="cu-role" class="form-control" onchange="toggleCreateUserFields()">
                        <option value="">-- Chọn vai trò --</option>
                        <option value="admin">Admin / Ban giám hiệu</option>
                        <option value="teacher">Giáo viên chủ nhiệm</option>
                        <option value="subject_teacher">Giáo viên bộ môn</option>
                        <option value="parent">Phụ huynh</option>
                    </select>
                </div>
            </div>

            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px;margin:12px 0">
                <div style="font-weight:800;color:#2563eb;margin-bottom:10px">
                    <i class="fas fa-id-card"></i> Thông tin hồ sơ
                </div>
                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px">
                    <div class="form-group">
                        <label>Họ và tên *</label>
                        <input id="cu-name" class="form-control" placeholder="Nguyễn Văn A">
                    </div>
                    <div class="form-group">
                        <label>Số điện thoại</label>
                        <input id="cu-phone" class="form-control" placeholder="09xxxxxxxx">
                    </div>
                    <div class="form-group">
                        <label>Mã GV/NV</label>
                        <input id="cu-employee-code" class="form-control" placeholder="GV001">
                    </div>
                    <div class="form-group">
                        <label>Tổ/Bộ phận</label>
                        <input id="cu-department" class="form-control" placeholder="Tổ 4-5, Tổ Tiếng Anh...">
                    </div>
                    <div class="form-group">
                        <label>Chức vụ</label>
                        <input id="cu-position" class="form-control" placeholder="GVCN, GV bộ môn, BGH...">
                    </div>
                    <div class="form-group">
                        <label>Nhận email thông báo</label>
                        <select id="cu-receive-email" class="form-control">
                            <option value="true">Có</option>
                            <option value="false">Không</option>
                        </select>
                    </div>
                </div>
                <div class="form-group" style="margin-top:8px">
                    <label>Ghi chú</label>
                    <textarea id="cu-note" class="form-control" rows="2" placeholder="Ghi chú thêm nếu có"></textarea>
                </div>
                <label style="display:flex;align-items:center;gap:8px;margin-top:8px;color:#475569;font-weight:600">
                    <input id="cu-force-change-pass" type="checkbox" checked>
                    Yêu cầu đổi mật khẩu sau lần đăng nhập đầu tiên
                </label>
            </div>

            <div id="cu-class-group" class="form-group hidden"></div>
            <div id="cu-subject-group" class="form-group hidden"></div>
            <div id="cu-student-group" class="form-group hidden"></div>

            <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:16px;border-top:1px solid #e2e8f0;padding-top:14px">
                <button type="button" class="btn btn-outline" onclick="closeCreateUserModal()">Hủy</button>
                <button type="button" class="btn btn-primary" onclick="adminCreateUser()">
                    <i class="fas fa-save"></i> Tạo tài khoản
                </button>
            </div>
        </div>`;
    document.body.appendChild(modal);
}

window.closeCreateUserModal = function() {
    const modal = document.getElementById('modal-create-user');
    if (modal) modal.style.display = 'none';
};

function fillCreateUserDynamicFields() {
    const classes = getClassList();
    const students = getStudentOptions();
    const subjects = getSubjectList();

    const classOptions = classes.length
        ? classes.map(c => `<option value="${htmlEscape(c)}">${htmlEscape(c)}</option>`).join('')
        : '<option value="">-- Chưa có lớp nào --</option>';

    const classGroup = document.getElementById('cu-class-group');
    classGroup.innerHTML = `
        <label>Lớp phụ trách *</label>
        <select id="cu-class" class="form-control">
            <option value="">-- Chọn lớp --</option>
            ${classOptions}
        </select>
        ${classes.length === 0 ? '<small style="color:#dc2626">Chưa có học sinh/lớp. Nhập học sinh trước.</small>' : ''}`;

    const subjectGroup = document.getElementById('cu-subject-group');
    subjectGroup.innerHTML = `
        <label>Môn phụ trách *</label>
        <select id="cu-subject" class="form-control" style="margin-bottom:10px">
            <option value="">-- Chọn môn --</option>
            ${subjects.map(s => `<option value="${htmlEscape(s)}">${htmlEscape(s)}</option>`).join('')}
        </select>
        <label>Khối phụ trách * <small style="color:#64748b">(chọn 1 hoặc nhiều)</small></label>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:6px">
            ${['1','2','3','4','5'].map(g => `
                <label style="display:flex;align-items:center;gap:5px;cursor:pointer;
                              background:#f1f5f9;padding:5px 12px;border-radius:6px;
                              font-weight:600;font-size:0.88rem">
                    <input type="checkbox" class="cu-grade-cb" value="${g}"> Khối ${g}
                </label>`).join('')}
        </div>`;

    const studentGroup = document.getElementById('cu-student-group');
    studentGroup.innerHTML = `
        <label>Học sinh của phụ huynh *</label>
        <input id="cu-student-search" class="form-control" placeholder="Tìm theo tên, mã HS hoặc lớp..." style="margin-bottom:6px">
        <select id="cu-student-id" class="form-control">
            <option value="">-- Chọn học sinh --</option>
            ${students.map(s => {
                const code = s.code || s.id || '';
                const cls  = s.classRoom || s.class || '';
                return `<option value="${htmlEscape(code)}">${htmlEscape(s.name || '')} (${htmlEscape(code)}) — Lớp ${htmlEscape(cls)}</option>`;
            }).join('')}
        </select>`;

    setTimeout(() => {
        const search = document.getElementById('cu-student-search');
        const select = document.getElementById('cu-student-id');
        if (search && select) {
            search.addEventListener('input', function() {
                const q = this.value.toLowerCase();
                Array.from(select.options).forEach(opt => {
                    if (!opt.value) return;
                    opt.style.display = opt.text.toLowerCase().includes(q) ? '' : 'none';
                });
            });
        }
    }, 0);
}

export function renderUsers() {
    document.getElementById('content').innerHTML = `
        <div style="margin-bottom:20px;display:flex;gap:10px;align-items:center;flex-wrap:wrap">
            <button class="btn btn-primary" onclick="openCreateUserModal()">
                <i class="fas fa-user-plus"></i> Tạo tài khoản mới
            </button>
            <div style="margin-left:auto;color:#64748b;font-size:0.85rem">
                <i class="fas fa-info-circle"></i> Admin tạo tài khoản, cấp mật khẩu tạm và có thể gửi link reset mật khẩu.
            </div>
        </div>

        <div class="card" style="margin-bottom:15px;background:#eff6ff;border:1px solid #bfdbfe">
            <p style="color:#1d4ed8;margin:0">
                <i class="fas fa-key"></i>
                <strong>V5.29:</strong> Người dùng có thể đổi mật khẩu. Nếu Admin bật "Yêu cầu đổi mật khẩu lần đầu",
                hệ thống sẽ bắt đổi mật khẩu sau khi đăng nhập bằng mật khẩu tạm.
            </p>
        </div>

        <div class="table-wrapper">
            <table>
                <thead>
                    <tr>
                        <th>Người dùng</th>
                        <th>Vai trò</th>
                        <th>Phân công / Liên kết</th>
                        <th>Liên hệ</th>
                        <th>Bảo mật</th>
                        <th style="text-align:center">Thao tác</th>
                    </tr>
                </thead>
                <tbody id="user-list-body"></tbody>
            </table>
        </div>`;

    loadUsers();
}

export function loadUsers() {
    window.onValue(window.ref(window.db, 'users'), snap => {
        const users = snap.val() || {};
        if (!window._classKeyMigrationRunning && window.userRole === 'admin') {
            const fixes = {};
            Object.entries(users).forEach(([uid,u]) => {
                if (u?.role === 'teacher' && u.assignedClass) {
                    const expected = classKey(u.assignedClass);
                    if (u.assignedClassKey !== expected) fixes[`users/${uid}/assignedClassKey`] = expected;
                }
                if (u?.role === 'subject_teacher' && Array.isArray(u.assignedGrades) && !u.assignedGradeMap) {
                    fixes[`users/${uid}/assignedGradeMap`] = Object.fromEntries(u.assignedGrades.map(g => [String(g), true]));
                }
            });
            if (Object.keys(fixes).length) {
                window._classKeyMigrationRunning = true;
                window.update(window.ref(window.db), fixes).finally(() => { window._classKeyMigrationRunning = false; });
            }
        }

        let html = '';
        Object.entries(users).forEach(([uid, u]) => {
            const isCurrentUser = window.currentUser && window.currentUser.uid === uid;
            const assigned = u.assignedClass ? `📚 ${htmlEscape(u.assignedClass)}`
                : u.assignedSubject ? `⭐ ${htmlEscape(u.assignedSubject)}${u.assignedGrades ? ' — Khối ' + Object.values(u.assignedGrades).join(',') : ''}`
                : u.studentId ? `👤 ${htmlEscape(u.studentName || '')} ${htmlEscape(u.studentId)}`
                : '-';

            const security = u.mustChangePassword
                ? '<span class="badge badge-danger">Cần đổi MK</span>'
                : '<span class="badge badge-success">Bình thường</span>';

            html += `<tr>
                <td>
                    <div style="font-weight:700;color:#1e293b">${htmlEscape(u.name || u.displayName || u.email || '')}
                        ${isCurrentUser ? ' <span class="badge badge-info">Bạn</span>' : ''}
                    </div>
                    <div style="color:#64748b;font-size:0.82rem">${htmlEscape(u.email || '')}</div>
                    ${u.employeeCode ? `<div style="color:#94a3b8;font-size:0.78rem">Mã: ${htmlEscape(u.employeeCode)}</div>` : ''}
                </td>
                <td><span class="badge badge-warning">${htmlEscape(roleLabel(u.role))}</span></td>
                <td>
                    <div>${assigned}</div>
                    ${u.department ? `<div style="color:#64748b;font-size:0.78rem">Tổ: ${htmlEscape(u.department)}</div>` : ''}
                    ${u.position ? `<div style="color:#64748b;font-size:0.78rem">Chức vụ: ${htmlEscape(u.position)}</div>` : ''}
                </td>
                <td>
                    ${u.phone ? `<div>📞 ${htmlEscape(u.phone)}</div>` : '<span style="color:#94a3b8">—</span>'}
                    <div style="color:${u.receiveEmail === false ? '#dc2626' : '#16a34a'};font-size:0.8rem">
                        ${u.receiveEmail === false ? 'Không nhận email' : 'Nhận email'}
                    </div>
                </td>
                <td>
                    ${security}
                    ${u.passwordChangedAt ? `<div style="font-size:0.75rem;color:#94a3b8;margin-top:4px">Đổi: ${new Date(u.passwordChangedAt).toLocaleDateString('vi-VN')}</div>` : ''}
                </td>
                <td style="text-align:center;white-space:nowrap">
                    <button class="btn btn-sm btn-outline" onclick="editUserProfile('${uid}')">
                        <i class="fas fa-edit"></i> Sửa
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="adminSendPasswordReset('${uid}','${htmlEscape(u.email || '')}')">
                        <i class="fas fa-key"></i> Reset MK
                    </button>
                    ${!isCurrentUser ? `
                        <button class="btn btn-sm btn-danger" onclick="deleteUser('${uid}','${htmlEscape(u.email || '')}')">
                            <i class="fas fa-trash"></i> Xóa
                        </button>` :
                        `<span style="color:#94a3b8;font-size:0.8rem;display:block;margin-top:4px">Không xóa tài khoản của bạn</span>`}
                </td>
            </tr>`;
        });

        const tbody = document.getElementById('user-list-body');
        if (tbody) tbody.innerHTML = html ||
            `<tr><td colspan="6" style="text-align:center;color:#94a3b8;padding:30px">Chưa có tài khoản nào</td></tr>`;
    });
}

export function openCreateUserModal() {
    if (window.userRole !== 'admin') {
        Swal.fire('Từ chối', 'Chỉ Admin mới có quyền tạo tài khoản', 'error');
        return;
    }

    ensureCreateUserModal();
    fillCreateUserDynamicFields();

    ['cu-email','cu-pass','cu-role','cu-name','cu-phone','cu-employee-code','cu-department','cu-position','cu-note'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    const receive = document.getElementById('cu-receive-email');
    if (receive) receive.value = 'true';
    const force = document.getElementById('cu-force-change-pass');
    if (force) force.checked = true;

    toggleCreateUserFields();
    document.getElementById('modal-create-user').style.display = 'flex';
}

export function toggleCreateUserFields() {
    const role = document.getElementById('cu-role')?.value || '';
    const classGroup = document.getElementById('cu-class-group');
    const subjectGroup = document.getElementById('cu-subject-group');
    const studentGroup = document.getElementById('cu-student-group');
    if (classGroup) classGroup.classList.toggle('hidden', role !== 'teacher');
    if (subjectGroup) subjectGroup.classList.toggle('hidden', role !== 'subject_teacher');
    if (studentGroup) studentGroup.classList.toggle('hidden', role !== 'parent');

    const employee = document.getElementById('cu-employee-code');
    const department = document.getElementById('cu-department');
    const position = document.getElementById('cu-position');
    if (role === 'parent') {
        if (employee) employee.placeholder = 'Có thể để trống';
        if (department) department.placeholder = 'Phụ huynh';
        if (position) position.placeholder = 'Cha/Mẹ/Người giám hộ';
    } else {
        if (employee) employee.placeholder = 'GV001';
        if (department) department.placeholder = 'Tổ 4-5, Tổ Tiếng Anh...';
        if (position) position.placeholder = 'GVCN, GV bộ môn, BGH...';
    }
}

function readCreateUserProfile() {
    const value = id => document.getElementById(id)?.value?.trim() || '';
    return {
        name: value('cu-name'),
        phone: value('cu-phone'),
        employeeCode: value('cu-employee-code'),
        department: value('cu-department'),
        position: value('cu-position'),
        note: value('cu-note'),
        receiveEmail: (document.getElementById('cu-receive-email')?.value || 'true') === 'true',
        mustChangePassword: document.getElementById('cu-force-change-pass')?.checked !== false,
    };
}

export async function adminCreateUser() {
    if (window.userRole !== 'admin') return;

    const email = document.getElementById('cu-email')?.value.trim();
    const pass  = document.getElementById('cu-pass')?.value || '';
    const role  = document.getElementById('cu-role')?.value || '';
    const profile = readCreateUserProfile();

    if (!email || !pass || !role || !profile.name) {
        Swal.fire('Lỗi', 'Vui lòng điền Email, mật khẩu, vai trò và họ tên.', 'warning');
        return;
    }
    if (pass.length < 6) {
        Swal.fire('Lỗi', 'Mật khẩu phải có ít nhất 6 ký tự', 'warning');
        return;
    }

    let assignedClass   = '';
    let assignedSubject = '';
    let assignedGrades  = [];
    let studentId       = '';
    let studentName     = '';
    let studentKey      = '';

    if (role === 'teacher') {
        assignedClass = document.getElementById('cu-class')?.value?.trim();
        if (!assignedClass) { Swal.fire('Lỗi', 'Vui lòng chọn lớp phụ trách', 'warning'); return; }
    } else if (role === 'subject_teacher') {
        assignedSubject = document.getElementById('cu-subject')?.value?.trim();
        if (!assignedSubject) { Swal.fire('Lỗi', 'Vui lòng chọn môn phụ trách', 'warning'); return; }
        assignedGrades = Array.from(document.querySelectorAll('.cu-grade-cb:checked')).map(el => el.value);
        if (!assignedGrades.length) { Swal.fire('Lỗi', 'Vui lòng chọn ít nhất 1 khối', 'warning'); return; }
    } else if (role === 'parent') {
        studentId = document.getElementById('cu-student-id')?.value?.trim();
        if (!studentId) { Swal.fire('Lỗi', 'Vui lòng chọn học sinh', 'warning'); return; }
        const stuEntry = Object.entries(window.localData.students || {}).find(
            ([, s]) => (s.code || s.id) === studentId
        );
        studentName = stuEntry ? stuEntry[1].name : '';
        studentKey = stuEntry ? stuEntry[0] : studentId;
    }

    Swal.fire({ title:'Đang tạo tài khoản...', allowOutsideClick:false, didOpen:()=>Swal.showLoading() });

    try {
        const adminEmail = window.currentUser.email;

        const { initializeApp, deleteApp } = await import(
            "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js"
        );
        const { getAuth, createUserWithEmailAndPassword, signOut } = await import(
            "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js"
        );

        const secondaryAppName = `secondary-${Date.now()}`;
        const secondaryApp  = initializeApp(window._firebaseApp.options, secondaryAppName);
        const secondaryAuth = getAuth(secondaryApp);

        let newUid;
        try {
            const userCred = await createUserWithEmailAndPassword(secondaryAuth, email, pass);
            newUid = userCred.user.uid;
            await signOut(secondaryAuth);
        } finally {
            await deleteApp(secondaryApp);
        }

        const userData = {
            email,
            role,
            name: profile.name,
            displayName: profile.name,
            phone: profile.phone,
            employeeCode: profile.employeeCode,
            department: profile.department,
            position: profile.position,
            note: profile.note,
            receiveEmail: profile.receiveEmail,
            mustChangePassword: profile.mustChangePassword,
            createdAt: nowValue(),
            createdBy: adminEmail,
            createdByUid: window.currentUser?.uid || '',
            lastPasswordProvisionedAt: nowValue(),
            lastPasswordProvisionedBy: adminEmail,
        };

        if (role === 'teacher') {
            userData.assignedClass = assignedClass;
            userData.assignedClassKey = classKey(assignedClass);
        }
        if (role === 'subject_teacher') {
            userData.assignedSubject = assignedSubject;
            userData.assignedGrades  = assignedGrades;
            userData.assignedGradeMap = Object.fromEntries(assignedGrades.map(g => [String(g), true]));
        }
        if (role === 'parent') {
            userData.studentId   = studentId;
            userData.studentKey  = studentKey;
            userData.studentName = studentName;
        }

        await window.set(window.ref(window.db, `users/${newUid}`), userData);
        window.closeCreateUserModal();

        await Swal.fire({
            icon: 'success',
            title: '✅ Tạo tài khoản thành công!',
            width: 650,
            html: `
                <div style="text-align:left;background:#f0fdf4;border-radius:8px;padding:15px;margin-top:10px">
                    <p style="font-weight:700;margin-bottom:10px">📋 Thông tin tài khoản:</p>
                    <p>👤 <strong>Họ tên:</strong> ${htmlEscape(profile.name)}</p>
                    <p>📧 <strong>Email:</strong> ${htmlEscape(email)}</p>
                    <p>🔑 <strong>Mật khẩu tạm:</strong> ${htmlEscape(pass)}</p>
                    <p>🛡️ <strong>Vai trò:</strong> ${htmlEscape(roleLabel(role))}
                        ${role==='teacher' ? ` — Lớp <strong>${htmlEscape(assignedClass)}</strong>` :
                          role==='subject_teacher' ? ` — Môn <strong>${htmlEscape(assignedSubject)}</strong> — Khối <strong>${assignedGrades.join(', ')}</strong>` :
                          role==='parent' ? ` — HS <strong>${htmlEscape(studentName)} (${htmlEscape(studentId)})</strong>` : ''}
                    </p>
                    <p>🔁 <strong>Đổi mật khẩu lần đầu:</strong> ${profile.mustChangePassword ? 'Có' : 'Không'}</p>
                </div>
                <p style="margin-top:12px;color:#16a34a;font-size:0.85rem;font-weight:600">
                    ✅ Admin vẫn đang đăng nhập bình thường.
                </p>`,
            confirmButtonText: 'Hoàn tất',
            confirmButtonColor: '#16a34a',
        });

        loadUsers();

    } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
            Swal.fire('Lỗi', 'Email này đã được sử dụng', 'error');
        } else {
            Swal.fire('Lỗi', error.message, 'error');
        }
    }
}

export async function editUserProfile(uid) {
    if (window.userRole !== 'admin') return;
    const snap = await window.get(window.ref(window.db, `users/${uid}`));
    const u = snap.val();
    if (!u) {
        Swal.fire('Lỗi', 'Không tìm thấy tài khoản trong Database.', 'error');
        return;
    }

    const result = await Swal.fire({
        title: 'Sửa thông tin tài khoản',
        width: 650,
        html: `
            <div style="text-align:left">
                <label style="font-weight:600;color:#475569">Họ và tên</label>
                <input id="eu-name" class="swal2-input" style="width:100%;margin:6px 0 10px 0" value="${htmlEscape(u.name || '')}">
                <label style="font-weight:600;color:#475569">Số điện thoại</label>
                <input id="eu-phone" class="swal2-input" style="width:100%;margin:6px 0 10px 0" value="${htmlEscape(u.phone || '')}">
                <label style="font-weight:600;color:#475569">Mã GV/NV</label>
                <input id="eu-code" class="swal2-input" style="width:100%;margin:6px 0 10px 0" value="${htmlEscape(u.employeeCode || '')}">
                <label style="font-weight:600;color:#475569">Tổ/Bộ phận</label>
                <input id="eu-dept" class="swal2-input" style="width:100%;margin:6px 0 10px 0" value="${htmlEscape(u.department || '')}">
                <label style="font-weight:600;color:#475569">Chức vụ</label>
                <input id="eu-pos" class="swal2-input" style="width:100%;margin:6px 0 10px 0" value="${htmlEscape(u.position || '')}">
                <label style="display:flex;gap:8px;align-items:center;margin-top:10px">
                    <input id="eu-receive" type="checkbox" ${u.receiveEmail === false ? '' : 'checked'}> Nhận email thông báo
                </label>
                <label style="display:flex;gap:8px;align-items:center;margin-top:10px">
                    <input id="eu-force" type="checkbox" ${u.mustChangePassword ? 'checked' : ''}> Yêu cầu đổi mật khẩu khi đăng nhập
                </label>
                <div style="background:#fff7ed;color:#9a3412;border:1px solid #fed7aa;border-radius:8px;padding:10px;margin-top:12px">
                    Email đăng nhập thuộc Firebase Authentication. Muốn đổi email đăng nhập thật cần đổi thêm trong Firebase Authentication.
                </div>
            </div>`,
        showCancelButton: true,
        confirmButtonText: 'Lưu',
        cancelButtonText: 'Hủy',
        preConfirm: () => ({
            name: document.getElementById('eu-name')?.value?.trim() || '',
            phone: document.getElementById('eu-phone')?.value?.trim() || '',
            employeeCode: document.getElementById('eu-code')?.value?.trim() || '',
            department: document.getElementById('eu-dept')?.value?.trim() || '',
            position: document.getElementById('eu-pos')?.value?.trim() || '',
            receiveEmail: document.getElementById('eu-receive')?.checked === true,
            mustChangePassword: document.getElementById('eu-force')?.checked === true,
        })
    });

    if (!result.isConfirmed) return;

    await window.update(window.ref(window.db, `users/${uid}`), {
        ...result.value,
        displayName: result.value.name,
        updatedAt: nowValue(),
        updatedBy: window.currentUser?.email || '',
        updatedByUid: window.currentUser?.uid || '',
    });
    Swal.fire('Thành công', 'Đã cập nhật thông tin tài khoản.', 'success');
}

export async function adminSendPasswordReset(uid, email) {
    if (window.userRole !== 'admin') return;
    if (!email) {
        Swal.fire('Lỗi', 'Tài khoản này chưa có email.', 'error');
        return;
    }

    const result = await Swal.fire({
        icon: 'question',
        title: 'Gửi email reset mật khẩu?',
        html: `
            <div style="text-align:left">
                <p>Hệ thống sẽ gửi link đặt lại mật khẩu đến:</p>
                <p style="font-weight:700;color:#2563eb">${htmlEscape(email)}</p>
                <p style="color:#64748b;font-size:0.88rem;margin-top:8px">
                    Đây là cách reset an toàn bằng Firebase Auth. Admin không xem được mật khẩu hiện tại của người dùng.
                </p>
            </div>`,
        showCancelButton: true,
        confirmButtonText: 'Gửi reset',
        cancelButtonText: 'Hủy'
    });

    if (!result.isConfirmed) return;

    try {
        const { sendPasswordResetEmail } = await import(
            "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js"
        );
        await sendPasswordResetEmail(window.auth, email);
        await window.update(window.ref(window.db, `users/${uid}`), {
            lastPasswordResetEmailAt: nowValue(),
            lastPasswordResetEmailBy: window.currentUser?.email || '',
            lastPasswordResetEmailByUid: window.currentUser?.uid || '',
            mustChangePassword: false,
        });
        Swal.fire('Đã gửi', `Đã gửi email reset mật khẩu đến ${email}.`, 'success');
    } catch (error) {
        Swal.fire('Lỗi', error?.message || 'Không gửi được email reset mật khẩu.', 'error');
    }
}

export async function deleteUser(uid, email) {
    const result = await Swal.fire({
        title: 'Xác nhận xóa tài khoản?',
        html: `<p>Bạn có chắc muốn xóa tài khoản:</p>
               <p style="font-weight:600;color:#dc2626;margin-top:8px">${htmlEscape(email)}</p>`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Xóa',
        cancelButtonText: 'Hủy',
        confirmButtonColor: '#dc2626'
    });
    if (!result.isConfirmed) return;
    try {
        await window.remove(window.ref(window.db, `users/${uid}`));
        Swal.fire({
            icon: 'success',
            title: 'Đã xóa khỏi Database',
            html: `<p>Tài khoản <strong>${htmlEscape(email)}</strong> đã bị xóa khỏi Realtime Database.</p>
                   <p style="margin-top:10px;font-size:0.85rem;color:#64748b">
                       Để xóa hoàn toàn và ngăn đăng nhập, vào Firebase Console → Authentication → xóa user.
                   </p>`,
            width: 650
        });
    } catch (error) {
        Swal.fire('Lỗi', error.message || 'Không thể xóa user', 'error');
    }
}
