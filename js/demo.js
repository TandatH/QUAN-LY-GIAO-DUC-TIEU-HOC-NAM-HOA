// ═══════════════════════════════════════════════════════
// demo.js — Chế độ demo dữ liệu giả, không đụng dữ liệu thật
// V5.16
// ═══════════════════════════════════════════════════════

console.info('[Smart School V5.16] demo mode module loaded');

function classKey(cls) {
    return String(cls || '').replace(/\//g, '_').replace(/[.#$\[\]]/g, '_');
}

function money(n) {
    return Number(n || 0).toLocaleString('vi-VN') + 'đ';
}

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({
        '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
    }[ch]));
}

function gradeFromClass(cls) {
    const m = String(cls || '').match(/[1-5]/);
    return m ? m[0] : '1';
}

function demoSubjectsForGrade(grade) {
    const base = window.PRIMARY_SUBJECTS?.[String(grade)] || [
        { name:'Tiếng Việt', type:'diem' },
        { name:'Toán', type:'diem' },
        { name:'Ngoại ngữ 1', type:'diem' },
        { name:'Đạo đức', type:'nhanxet' },
        { name:'Tự nhiên và Xã hội', type:'nhanxet' },
        { name:'Giáo dục thể chất', type:'nhanxet' },
        { name:'Nghệ thuật (Âm nhạc)', type:'nhanxet' },
        { name:'Nghệ thuật (Mỹ thuật)', type:'nhanxet' },
        { name:'Hoạt động trải nghiệm', type:'nhanxet' },
    ];
    return base;
}

function scoreToLevel(score) {
    const n = Number(score);
    if (!Number.isFinite(n)) return '';
    if (n >= 9) return 'T';
    if (n >= 5) return 'H';
    return 'C';
}

function scoreComment(subject, score) {
    const n = Number(score);
    if (n >= 9) return `Hoàn thành xuất sắc, nắm chắc kiến thức và kỹ năng môn ${subject}.`;
    if (n >= 7) return `Hoàn thành tốt yêu cầu học tập môn ${subject}.`;
    if (n >= 5) return `Hoàn thành cơ bản yêu cầu môn ${subject}, cần rèn luyện thêm.`;
    return `Chưa hoàn thành yêu cầu môn ${subject}, cần được hỗ trợ thường xuyên.`;
}

function makeHocBaForStudent(student, idx) {
    const grade = gradeFromClass(student.classRoom);
    const subjects = {};
    demoSubjectsForGrade(grade).forEach((sub, sidx) => {
        if (sub.type === 'diem') {
            const score = [10, 9, 8, 7, 6][(idx + sidx) % 5];
            subjects[sub.name] = {
                diem: score,
                mucDat: scoreToLevel(score),
                nhanXet: scoreComment(sub.name, score)
            };
        } else {
            const level = (idx + sidx) % 6 === 0 ? 'H' : 'T';
            subjects[sub.name] = {
                mucDat: level,
                nhanXet: level === 'T'
                    ? `Tích cực tham gia và hoàn thành tốt các hoạt động của môn ${sub.name}.`
                    : `Hoàn thành yêu cầu cơ bản của môn ${sub.name}.`
            };
        }
    });

    const pc = {};
    (window.PHAM_CHAT || ['Yêu nước','Nhân ái','Chăm chỉ','Trung thực','Trách nhiệm']).forEach((name, i) => {
        pc[name] = {
            mucDat: 'T',
            nhanXet: [
                'Tích cực tham gia hoạt động tập thể, biết giữ gìn trường lớp.',
                'Biết quan tâm, giúp đỡ bạn bè và lễ phép với người lớn.',
                'Chăm học, chuẩn bị đầy đủ đồ dùng học tập.',
                'Trung thực trong học tập và sinh hoạt.',
                'Có ý thức thực hiện tốt nội quy lớp học.'
            ][i] || 'Thực hiện tốt yêu cầu.'
        };
    });

    const nlc = {};
    (window.NANG_LUC_CHUNG || ['Tự chủ và tự học','Giao tiếp và hợp tác','Giải quyết vấn đề và sáng tạo']).forEach((name, i) => {
        nlc[name] = {
            mucDat: 'T',
            nhanXet: [
                'Tự giác chuẩn bị bài và hoàn thành nhiệm vụ học tập.',
                'Mạnh dạn trao đổi, biết phối hợp với bạn trong hoạt động nhóm.',
                'Biết lựa chọn cách làm phù hợp khi thực hiện nhiệm vụ.'
            ][i] || 'Hoàn thành tốt.'
        };
    });

    const nld = {};
    (window.NANG_LUC_DAC_THU || ['Ngôn ngữ','Tính toán','Khoa học','Công nghệ','Tin học','Thẩm mĩ','Thể chất']).forEach((name, i) => {
        nld[name] = {
            mucDat: i in {3:1,4:1} ? '' : 'T',
            nhanXet: i in {3:1,4:1} ? '' : [
                'Diễn đạt rõ ràng, biết lắng nghe và trình bày ý kiến.',
                'Thực hiện tốt các yêu cầu tính toán cơ bản.',
                'Biết quan sát và nhận xét các sự vật gần gũi.',
                '',
                '',
                'Có cảm nhận thẩm mĩ, hoàn thành sản phẩm học tập.',
                'Tham gia tốt hoạt động vận động, tác phong nhanh nhẹn.'
            ][i]
        };
    });

    return {
        chieuCao: 118 + idx,
        canNang: 22 + idx,
        nghiCoPhep: idx % 3,
        nghiKhongPhep: 0,
        subjects,
        phamChat: pc,
        nangLucChung: nlc,
        nangLucDacThu: nld,
        ketQua: {
            danhGia: idx % 4 === 0 ? 'Hoàn thành xuất sắc' : 'Hoàn thành tốt',
            khenThuong: idx % 4 === 0 ? 'Học sinh Xuất sắc' : 'Học sinh Tiêu biểu hoàn thành tốt trong học tập và rèn luyện',
            hoanThanh: `Hoàn thành chương trình lớp ${grade}`
        },
        hk2: {
            ...subjects,
            __pc: pc,
            __nlc: nlc,
            __nld: nld,
            __kq: {
                danhGia: idx % 4 === 0 ? 'Hoàn thành xuất sắc' : 'Hoàn thành tốt',
                khenThuong: idx % 4 === 0 ? 'Học sinh Xuất sắc' : 'Học sinh Tiêu biểu hoàn thành tốt trong học tập và rèn luyện',
                hoanThanh: `Hoàn thành chương trình lớp ${grade}`
            }
        }
    };
}

export function createDemoData() {
    const names = [
        ['demo_stu_001','HSDEMO-001','Nguyễn An Nhiên','Nữ','1/1','2018-02-12'],
        ['demo_stu_002','HSDEMO-002','Trần Minh Khang','Nam','1/1','2018-05-04'],
        ['demo_stu_003','HSDEMO-003','Lê Bảo Ngọc','Nữ','2/1','2017-09-22'],
        ['demo_stu_004','HSDEMO-004','Phạm Gia Huy','Nam','2/1','2017-11-17'],
        ['demo_stu_005','HSDEMO-005','Hoàng Khánh Linh','Nữ','3/1','2016-03-19'],
        ['demo_stu_006','HSDEMO-006','Võ Nhật Minh','Nam','3/1','2016-08-08'],
        ['demo_stu_007','HSDEMO-007','Đặng Thu Hà','Nữ','4/1','2015-01-25'],
        ['demo_stu_008','HSDEMO-008','Bùi Đức Anh','Nam','5/1','2014-12-03'],
        ['demo_stu_009','HSDEMO-009','Ngô Hải Nam','Nam','5/1','2014-04-11'],
    ];

    const students = {};
    const hocba = {};
    names.forEach((row, idx) => {
        const [key, code, name, gender, cls, dob] = row;
        students[key] = {
            id: code,
            code,
            name,
            gender,
            class: cls,
            classRoom: cls,
            currentClassKey: classKey(cls),
            currentGrade: gradeFromClass(cls),
            dob,
            birthPlace: 'TP. Hồ Chí Minh',
            ethnicity: 'Kinh',
            status: 'active',
            enrollDate: '2025-08-20',
            permanentAddress: 'Dữ liệu demo - không phải địa chỉ thật',
            currentAddress: 'Dữ liệu demo - không phải địa chỉ thật',
            dadName: 'Phụ huynh demo',
            momName: 'Phụ huynh demo',
            dadPhone: '0900000000',
            momPhone: '0911111111',
        };
        hocba[key] = { '2025_2026': makeHocBaForStudent(students[key], idx) };
    });

    const classes = ['1/1','2/1','3/1','4/1','5/1'];
    const timetables = {};
    classes.forEach(cls => {
        timetables[classKey(cls)] = {
            'Thứ 2': { 1:{subject:'Tiếng Việt', teacher:'Cô demo'}, 2:{subject:'Toán', teacher:'Cô demo'}, 3:{subject:'Đạo đức', teacher:'Cô demo'} },
            'Thứ 3': { 1:{subject:'Toán', teacher:'Cô demo'}, 2:{subject:'Ngoại ngữ 1', teacher:'Thầy demo'}, 3:{subject:'Nghệ thuật', teacher:'Cô demo'} },
            'Thứ 4': { 1:{subject:'Tiếng Việt', teacher:'Cô demo'}, 2:{subject:'Tự nhiên và Xã hội', teacher:'Cô demo'}, 3:{subject:'Giáo dục thể chất', teacher:'Thầy demo'} },
            'Thứ 5': { 1:{subject:'Toán', teacher:'Cô demo'}, 2:{subject:'Hoạt động trải nghiệm', teacher:'Cô demo'} },
            'Thứ 6': { 1:{subject:'Tiếng Việt', teacher:'Cô demo'}, 2:{subject:'Sinh hoạt lớp', teacher:'GVCN demo'} },
        };
    });

    const paymentStatus = {};
    names.forEach((row, idx) => {
        const [, code, name, , cls] = row;
        paymentStatus[code] = {
            studentCode: code,
            studentName: name,
            classRoom: cls,
            total: 850000,
            paid: idx % 3 === 0 ? 850000 : 500000,
            status: idx % 3 === 0 ? 'paid' : 'partial',
            note: 'Dữ liệu demo'
        };
    });

    const finance = {
        demo_tx_001: { type:'income', category:'Học phí', amount: 5200000, date:'2026-06-01', description:'Thu học phí demo', schoolYear:'2025-2026' },
        demo_tx_002: { type:'expense', category:'Văn phòng phẩm', amount: 850000, date:'2026-06-05', description:'Chi văn phòng phẩm demo', schoolYear:'2025-2026' },
        demo_tx_003: { type:'income', category:'Bán trú', amount: 3600000, date:'2026-06-10', description:'Thu bán trú demo', schoolYear:'2025-2026' },
    };

    const notifications = {
        demo_notif_001: { title:'Lịch họp phụ huynh cuối kỳ', content:'Thông báo demo: nhà trường tổ chức họp phụ huynh vào sáng thứ Bảy.', targetRole:'all', createdAt: Date.now() - 86400000 },
        demo_notif_002: { title:'Nhắc nhập điểm cuối kỳ', content:'Thông báo demo dành cho giáo viên: vui lòng hoàn tất nhập điểm trước hạn.', targetRole:'teacher', createdAt: Date.now() - 3600000 },
    };

    const news = {
        demo_news_001: { title:'Ngày hội đọc sách', content:'Tin demo: học sinh tham gia ngày hội đọc sách và trưng bày sản phẩm học tập.', date:'2026-06-10', author:'Admin demo' },
        demo_news_002: { title:'Hoạt động trải nghiệm', content:'Tin demo: các lớp tham gia hoạt động trải nghiệm theo chủ đề bảo vệ môi trường.', date:'2026-06-12', author:'Admin demo' },
    };

    return {
        students,
        hocba,
        timetables,
        paymentStatus,
        finance,
        notifications,
        news,
        settings: {
            schoolYear: '2025-2026',
            semester: 'hk2',
            schoolName: 'TRƯỜNG TIỂU HỌC DEMO',
            ward: 'Phường Demo',
            district: 'Quận Demo',
            province: 'TP. Hồ Chí Minh',
            principalName: 'Hiệu trưởng Demo',
            issuePlace: 'TP. Hồ Chí Minh'
        }
    };
}

export function setupDemoMode() {
    const data = createDemoData();

    window.IS_DEMO_MODE = true;
    window._demoData = data;
    window.currentUser = { uid:'demo-user', email:'demo@smartschool.local' };
    window.currentUserProfile = {
        email:'demo@smartschool.local',
        name:'Tài khoản Demo',
        role:'admin',
        isDemo:true
    };
    window.userRole = 'admin';
    window.teacherClass = null;
    window.teacherClassKey = null;
    window.teacherSubject = null;
    window.teacherGrades = null;
    window.parentStudentId = null;
    window.parentStudentKey = null;
    window._currentSchoolYear = '2025-2026';
    window._currentSemester = 'hk2';

    window.localData = {
        students: data.students,
        scores: {},
        finance: data.finance,
        timetables: data.timetables,
        scheduleSettings: window.DEFAULT_PERIODS,
        paymentStatus: data.paymentStatus,
        demoHocBa: data.hocba,
        notifications: data.notifications,
        news: data.news
    };

    window._allStudents = Object.values(data.students);

    // Chặn ghi/xóa dữ liệu trong chế độ demo. Người xem có bấm lưu cũng không đụng Firebase thật.
    const blocked = async () => {
        console.warn('[Smart School Demo] Đã chặn thao tác ghi dữ liệu trong chế độ demo.');
        if (window.Swal) Swal.fire('Chế độ demo', 'Đây là dữ liệu giả, thao tác ghi/sửa/xóa đã bị chặn.', 'info');
        return null;
    };
    window.set = blocked;
    window.update = blocked;
    window.remove = blocked;
    window.push = () => ({ key: 'demo_blocked_' + Date.now() });

    return data;
}

function demoBanner() {
    return `
        <div style="background:#fff7ed;border:1px solid #fb923c;color:#9a3412;
                    padding:10px 14px;border-radius:10px;margin-bottom:14px;display:flex;gap:10px;align-items:center">
            <i class="fas fa-flask"></i>
            <div><b>Chế độ demo:</b> toàn bộ dữ liệu đang xem là dữ liệu giả. Các thao tác thêm/sửa/xóa/lưu đều bị chặn, không ảnh hưởng dữ liệu thật.</div>
        </div>`;
}

function studentArray() {
    return Object.entries(window._demoData?.students || {}).map(([key, s]) => ({ key, ...s }));
}

function classList() {
    return [...new Set(studentArray().map(s => s.classRoom || s.class).filter(Boolean))].sort();
}

function demoCard(icon, label, value, color) {
    return `
        <div class="stat-card" style="border-left:4px solid ${color}">
            <div style="display:flex;align-items:center;justify-content:space-between">
                <div>
                    <div class="label">${label}</div>
                    <div class="value" style="color:${color}">${value}</div>
                </div>
                <div style="width:46px;height:46px;border-radius:12px;background:${color}15;display:flex;align-items:center;justify-content:center;font-size:1.4rem">
                    ${icon}
                </div>
            </div>
        </div>`;
}

function renderDashboard() {
    const students = studentArray();
    const classes = classList();
    const paid = Object.values(window._demoData.paymentStatus).filter(x => x.status === 'paid').length;
    const totalIncome = Object.values(window._demoData.finance)
        .filter(x => x.type === 'income')
        .reduce((s,x) => s + Number(x.amount || 0), 0);

    document.getElementById('content').innerHTML = demoBanner() + `
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:14px;margin-bottom:16px">
            ${demoCard('👨‍🎓','Học sinh demo',students.length,'#2563eb')}
            ${demoCard('🏫','Lớp học demo',classes.length,'#10b981')}
            ${demoCard('✅','Đã nộp học phí',paid + '/' + students.length,'#d97706')}
            ${demoCard('💰','Tổng thu demo',money(totalIncome),'#7c3aed')}
        </div>

        <!-- Biểu đồ phân bố sĩ số học sinh demo -->
        <div class="chart-container-card">
            <div class="chart-header">
                <h4><i class="fas fa-chart-bar" style="color:var(--primary-light)"></i> Phân Bố Sĩ Số Học Sinh Các Lớp (Chart.js)</h4>
                <span class="badge badge-info">${classes.length} Lớp demo</span>
            </div>
            <div style="height:180px;position:relative">
                <canvas id="demoClassChart"></canvas>
            </div>
        </div>

        <div style="display:grid;grid-template-columns:2fr 1fr;gap:16px">
            <div class="card">
                <h3 style="margin-bottom:12px;color:var(--text-main);font-size:1rem;font-weight:700">
                    <i class="fas fa-table" style="color:var(--primary-light)"></i> Tổng quan các lớp học
                </h3>
                <div class="table-wrapper">
                    <table>
                        <thead><tr><th>Lớp</th><th>Sĩ số</th><th>Đạt chuẩn GD</th><th>Ghi chú</th></tr></thead>
                        <tbody>
                            ${classes.map(cls => {
                                const count = students.filter(s => s.classRoom === cls).length;
                                return `<tr>
                                    <td><b>${cls}</b></td>
                                    <td><span class="badge badge-info">${count} HS</span></td>
                                    <td><span class="badge badge-success">${count} HS</span></td>
                                    <td style="color:var(--text-muted)">Dữ liệu minh họa</td>
                                </tr>`;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="card">
                <h3 style="margin-bottom:12px;color:var(--text-main);font-size:1rem;font-weight:700">
                    <i class="fas fa-lightbulb" style="color:var(--warning-color)"></i> Hướng dẫn thử nghiệm
                </h3>
                <div style="line-height:1.8;color:var(--text-body);font-size:0.86rem">
                    <div>• <b>Quản lý Điểm:</b> Xem bảng điểm TT27, highlight đỏ cho điểm &lt; 5.</div>
                    <div>• <b>Tìm kiếm/Lọc:</b> Gõ tên học sinh để lọc tức thì.</div>
                    <div>• <b>Biểu đồ Chart.js:</b> Thống kê trực quan phân bố điểm.</div>
                    <div>• <b>An toàn tuyệt đối:</b> Mọi thao tác ghi đều bị chặn trong demo.</div>
                </div>
            </div>
        </div>`;

    try {
        if (typeof Chart !== 'undefined') {
            const canvas = document.getElementById('demoClassChart');
            if (canvas) {
                new Chart(canvas, {
                    type: 'bar',
                    data: {
                        labels: classes,
                        datasets: [{
                            label: 'Sĩ số học sinh',
                            data: classes.map(c => students.filter(s => s.classRoom === c).length),
                            backgroundColor: 'rgba(37, 99, 235, 0.75)',
                            borderColor: '#1e40af',
                            borderWidth: 1.5,
                            borderRadius: 6
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: { beginAtZero: true, ticks: { precision: 0, color: '#64748b' } },
                            x: { ticks: { color: '#64748b' } }
                        },
                        plugins: { legend: { display: false } }
                    }
                });
            }
        }
    } catch (e) {
        console.warn('Demo chart error:', e);
    }
}

function renderScores() {
    const classes = classList();
    const selected = window._demoSelectedClass || classes[0];
    const students = studentArray().filter(s => s.classRoom === selected);

    // Tính thống kê xếp loại từ dữ liệu demo có sẵn
    const counts = { 'Hoàn thành xuất sắc': 0, 'Hoàn thành tốt': 0, 'Hoàn thành': 0, 'Chưa hoàn thành': 0 };
    students.forEach(s => {
        const hb = window._demoData.hocba[s.key]?.['2025_2026'];
        const dg = hb?.ketQua?.danhGia || 'Hoàn thành';
        if (counts[dg] !== undefined) counts[dg]++;
        else counts['Hoàn thành']++;
    });

    document.getElementById('content').innerHTML = demoBanner() + `
        <!-- Chart.js Thống kê kết quả demo -->
        <div class="chart-container-card">
            <div class="chart-header">
                <h4><i class="fas fa-chart-pie" style="color:var(--primary-light)"></i> Phân Bố Kết Quả Đánh Giá — Lớp ${selected}</h4>
                <span class="badge badge-info">2025-2026</span>
            </div>
            <div style="display:grid;grid-template-columns:160px 1fr;gap:20px;align-items:center">
                <div style="height:130px;position:relative">
                    <canvas id="demoScoreChart"></canvas>
                </div>
                <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(120px, 1fr));gap:10px">
                    <div style="background:#eff6ff;padding:10px 12px;border-radius:8px;border-left:3px solid #2563eb">
                        <div style="font-size:0.72rem;color:#1e40af;font-weight:700">Xuất Sắc</div>
                        <div style="font-size:1.3rem;font-weight:800;color:#1e40af">${counts['Hoàn thành xuất sắc']}</div>
                    </div>
                    <div style="background:#ecfdf5;padding:10px 12px;border-radius:8px;border-left:3px solid #059669">
                        <div style="font-size:0.72rem;color:#065f46;font-weight:700">Tốt</div>
                        <div style="font-size:1.3rem;font-weight:800;color:#059669">${counts['Hoàn thành tốt']}</div>
                    </div>
                    <div style="background:#f0fdf4;padding:10px 12px;border-radius:8px;border-left:3px solid #16a34a">
                        <div style="font-size:0.72rem;color:#166534;font-weight:700">Hoàn Thành</div>
                        <div style="font-size:1.3rem;font-weight:800;color:#16a34a">${counts['Hoàn thành']}</div>
                    </div>
                    <div style="background:#fef2f2;padding:10px 12px;border-radius:8px;border-left:3px solid #dc2626">
                        <div style="font-size:0.72rem;color:#991b1b;font-weight:700">Chưa Đạt</div>
                        <div style="font-size:1.3rem;font-weight:800;color:#dc2626">${counts['Chưa hoàn thành']}</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Toolbar tìm kiếm & lọc lớp -->
        <div class="score-toolbar">
            <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
                <div class="search-box-wrap">
                    <i class="fas fa-search"></i>
                    <input type="text" id="demo-score-search" class="search-box-inp"
                           placeholder="Tìm kiếm học sinh demo..."
                           oninput="window._filterDemoScoreTable(this.value)">
                </div>
                <div style="display:flex;align-items:center;gap:8px">
                    <span style="font-size:0.82rem;color:var(--text-muted);font-weight:600">Chọn lớp:</span>
                    <select class="custom-select" style="max-width:180px" onchange="window._demoSelectedClass=this.value;renderScores()">
                        ${classes.map(c => `<option ${c===selected?'selected':''}>${c}</option>`).join('')}
                    </select>
                </div>
            </div>
            <div style="font-size:0.84rem;color:var(--text-muted)">
                Sĩ số lớp: <b style="color:var(--primary-color)">${students.length}</b> học sinh
            </div>
        </div>

        <div class="table-wrapper">
            <table>
                <thead>
                    <tr>
                        <th style="text-align:center;width:45px">STT</th>
                        <th>Học sinh</th>
                        <th style="text-align:center">Tiếng Việt</th>
                        <th style="text-align:center">Toán</th>
                        <th style="text-align:center">Ngoại ngữ 1</th>
                        <th style="text-align:center">Kết quả GD</th>
                    </tr>
                </thead>
                <tbody id="demo-score-tbody">
                    ${students.map((s, idx) => {
                        const hb = window._demoData.hocba[s.key]?.['2025_2026'] || { subjects:{}, ketQua:{} };
                        const tvDiem = hb.subjects['Tiếng Việt']?.diem;
                        const tvMuc = hb.subjects['Tiếng Việt']?.mucDat || '';
                        const toanDiem = hb.subjects['Toán']?.diem;
                        const toanMuc = hb.subjects['Toán']?.mucDat || '';
                        const nnDiem = hb.subjects['Ngoại ngữ 1']?.diem;
                        const nnMuc = hb.subjects['Ngoại ngữ 1']?.mucDat || '';
                        const dg = hb.ketQua.danhGia || '—';

                        const renderScoreCell = (diem, muc) => {
                            if (diem === undefined || diem === null || diem === '') return '—';
                            const num = Number(diem);
                            const isBelow = num < 5;
                            return `
                                <div style="display:inline-flex;align-items:center;gap:4px">
                                    <span class="${isBelow ? 'score-below-avg' : 'score-badge-pass'}">${diem}</span>
                                    ${muc ? `<span class="badge ${muc==='T'?'badge-success':(muc==='H'?'badge-info':'badge-danger')}" style="font-size:0.7rem;padding:1px 5px">${muc}</span>` : ''}
                                </div>
                            `;
                        };

                        return `<tr>
                            <td style="text-align:center;color:var(--text-muted)">${idx+1}</td>
                            <td>
                                <strong style="color:var(--text-main)">${escapeHtml(s.name)}</strong><br>
                                <span class="badge badge-info" style="font-size:0.68rem;padding:1px 5px">${s.code}</span>
                            </td>
                            <td style="text-align:center">${renderScoreCell(tvDiem, tvMuc)}</td>
                            <td style="text-align:center">${renderScoreCell(toanDiem, toanMuc)}</td>
                            <td style="text-align:center">${renderScoreCell(nnDiem, nnMuc)}</td>
                            <td style="text-align:center">
                                <span class="badge ${dg.includes('xuất sắc')?'badge-info':(dg.includes('tốt')?'badge-success':'badge-warning')}" style="font-size:0.75rem;padding:3px 8px">
                                    ${dg}
                                </span>
                            </td>
                        </tr>`;
                    }).join('')}
                </tbody>
            </table>
        </div>`;

    window._filterDemoScoreTable = function(q) {
        const val = (q || '').trim().toLowerCase();
        const rows = document.querySelectorAll('#demo-score-tbody tr');
        rows.forEach(r => {
            const txt = r.innerText.toLowerCase();
            r.style.display = (!val || txt.includes(val)) ? '' : 'none';
        });
    };

    try {
        if (typeof Chart !== 'undefined') {
            const canvas = document.getElementById('demoScoreChart');
            if (canvas) {
                new Chart(canvas, {
                    type: 'doughnut',
                    data: {
                        labels: ['Xuất sắc', 'Tốt', 'Hoàn thành', 'Chưa HT'],
                        datasets: [{
                            data: [
                                counts['Hoàn thành xuất sắc'],
                                counts['Hoàn thành tốt'],
                                counts['Hoàn thành'],
                                counts['Chưa hoàn thành']
                            ],
                            backgroundColor: ['#2563eb', '#059669', '#16a34a', '#dc2626'],
                            borderWidth: 2,
                            borderColor: '#ffffff'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        cutout: '65%',
                        plugins: { legend: { display: false } }
                    }
                });
            }
        }
    } catch (e) {
        console.warn('Score doughnut error:', e);
    }
}

function renderHocBa() {
    const students = studentArray();
    document.getElementById('content').innerHTML = demoBanner() + `
        <div class="card">
            <h3 style="margin-bottom:12px"><i class="fas fa-book-open"></i> Học bạ demo</h3>
            <table class="data-table">
                <thead><tr><th>Mã HS</th><th>Họ tên</th><th>Lớp</th><th>Kết quả giáo dục</th><th>Khen thưởng</th><th>Xem</th></tr></thead>
                <tbody>${students.map(s => {
                    const hb = window._demoData.hocba[s.key]['2025_2026'];
                    return `<tr>
                        <td>${s.code}</td><td><b>${escapeHtml(s.name)}</b></td><td>${s.classRoom}</td>
                        <td>${hb.ketQua.danhGia}</td><td>${hb.ketQua.khenThuong}</td>
                        <td><button class="btn btn-primary btn-sm" onclick="window.showDemoHocBa('${s.key}')"><i class="fas fa-eye"></i> Xem</button></td>
                    </tr>`;
                }).join('')}</tbody>
            </table>
        </div>`;
}

window.showDemoHocBa = function(studentKey) {
    const s = window._demoData.students[studentKey];
    const hb = window._demoData.hocba[studentKey]['2025_2026'];
    const rows = Object.entries(hb.subjects).map(([name, r]) => `
        <tr><td>${escapeHtml(name)}</td><td style="text-align:center">${r.mucDat || ''}</td><td style="text-align:center">${r.diem || ''}</td><td>${escapeHtml(r.nhanXet || '')}</td></tr>`).join('');

    Swal.fire({
        title: `Học bạ demo - ${s.name}`,
        width: 900,
        html: `
            <div style="text-align:left;max-height:70vh;overflow:auto">
                <p><b>Mã HS:</b> ${s.code} &nbsp; <b>Lớp:</b> ${s.classRoom}</p>
                <table class="data-table">
                    <thead><tr><th>Môn học</th><th>Mức</th><th>Điểm</th><th>Nhận xét</th></tr></thead>
                    <tbody>${rows}</tbody>
                </table>
                <p style="margin-top:10px"><b>Đánh giá:</b> ${hb.ketQua.danhGia}</p>
                <p><b>Khen thưởng:</b> ${hb.ketQua.khenThuong}</p>
            </div>`,
        confirmButtonText: 'Đóng'
    });
};

function renderAttendance() {
    const classes = classList();
    const selected = window._demoSelectedClass || classes[0];
    const students = studentArray().filter(s => s.classRoom === selected);
    document.getElementById('content').innerHTML = demoBanner() + `
        <div class="card">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
                <h3><i class="fas fa-clipboard-check"></i> Điểm danh demo</h3>
                <select class="form-control" style="max-width:180px" onchange="window._demoSelectedClass=this.value;changeView('attendance')">
                    ${classes.map(c => `<option ${c===selected?'selected':''}>${c}</option>`).join('')}
                </select>
            </div>
            <table class="data-table">
                <thead><tr><th>STT</th><th>Mã HS</th><th>Họ tên</th><th>Trạng thái</th><th>Ghi chú</th></tr></thead>
                <tbody>${students.map((s,i) => `<tr>
                    <td>${i+1}</td><td>${s.code}</td><td>${escapeHtml(s.name)}</td>
                    <td><span class="badge ${i%5===0?'warning':'success'}">${i%5===0?'Có phép':'Có mặt'}</span></td>
                    <td>${i%5===0?'Dữ liệu demo: nghỉ có phép':''}</td>
                </tr>`).join('')}</tbody>
            </table>
        </div>`;
}

function renderFinance() {
    const payments = Object.values(window._demoData.paymentStatus);
    document.getElementById('content').innerHTML = demoBanner() + `
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;margin-bottom:16px">
            ${demoCard('💳','Tổng phải thu',money(payments.reduce((s,x)=>s+x.total,0)),'#2563eb')}
            ${demoCard('✅','Đã thu',money(payments.reduce((s,x)=>s+x.paid,0)),'#16a34a')}
            ${demoCard('⏳','Còn lại',money(payments.reduce((s,x)=>s+x.total-x.paid,0)),'#dc2626')}
        </div>
        <div class="card">
            <h3 style="margin-bottom:12px"><i class="fas fa-dollar-sign"></i> Danh sách đóng phí demo</h3>
            <table class="data-table">
                <thead><tr><th>Mã HS</th><th>Họ tên</th><th>Lớp</th><th>Phải thu</th><th>Đã thu</th><th>Trạng thái</th></tr></thead>
                <tbody>${payments.map(x => `<tr>
                    <td>${x.studentCode}</td><td>${escapeHtml(x.studentName)}</td><td>${x.classRoom}</td>
                    <td>${money(x.total)}</td><td>${money(x.paid)}</td>
                    <td><span class="badge ${x.status==='paid'?'success':'warning'}">${x.status==='paid'?'Đã đóng đủ':'Đóng một phần'}</span></td>
                </tr>`).join('')}</tbody>
            </table>
        </div>`;
}

function renderTimetable() {
    const classes = classList();
    const selected = window._demoSelectedClass || classes[0];
    const table = window._demoData.timetables[classKey(selected)] || {};
    const weekdays = window.WEEKDAYS || ['Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6'];
    document.getElementById('content').innerHTML = demoBanner() + `
        <div class="card">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
                <h3><i class="fas fa-calendar-alt"></i> Thời khóa biểu demo</h3>
                <select class="form-control" style="max-width:180px" onchange="window._demoSelectedClass=this.value;changeView('timetable')">
                    ${classes.map(c => `<option ${c===selected?'selected':''}>${c}</option>`).join('')}
                </select>
            </div>
            <table class="data-table">
                <thead><tr><th>Thứ</th><th>Tiết 1</th><th>Tiết 2</th><th>Tiết 3</th></tr></thead>
                <tbody>${weekdays.slice(0,5).map(day => `<tr>
                    <td><b>${day}</b></td>
                    <td>${table[day]?.[1]?.subject || ''}</td>
                    <td>${table[day]?.[2]?.subject || ''}</td>
                    <td>${table[day]?.[3]?.subject || ''}</td>
                </tr>`).join('')}</tbody>
            </table>
        </div>`;
}

function renderSimpleList(title, icon, items) {
    document.getElementById('content').innerHTML = demoBanner() + `
        <div class="card">
            <h3 style="margin-bottom:12px"><i class="fas fa-${icon}"></i> ${title}</h3>
            ${items.map(x => `
                <div style="border:1px solid #e2e8f0;border-radius:10px;padding:14px;margin-bottom:10px">
                    <h4 style="color:#1e293b;margin-bottom:6px">${escapeHtml(x.title)}</h4>
                    <p style="color:#475569">${escapeHtml(x.content)}</p>
                    <small style="color:#94a3b8">${x.date || new Date(x.createdAt || Date.now()).toLocaleDateString('vi-VN')}</small>
                </div>`).join('')}
        </div>`;
}

function renderLocked(title) {
    document.getElementById('content').innerHTML = demoBanner() + `
        <div class="card" style="text-align:center;padding:40px">
            <i class="fas fa-lock" style="font-size:2.5rem;color:#f97316;margin-bottom:12px"></i>
            <h3>${title}</h3>
            <p style="color:#64748b;margin-top:8px">Chức năng này đang khóa trong chế độ demo để tránh người xem nhầm là dữ liệu thật.</p>
        </div>`;
}

export function renderDemoView(view) {
    document.getElementById('content').dataset.view = view;

    const titles = {
        dashboard:'Dashboard demo',
        students:'Học sinh demo',
        attendance:'Điểm danh demo',
        scores:'Điểm demo',
        finance:'Tài chính demo',
        timetable:'Thời khóa biểu demo',
        users:'Tài khoản demo',
        hocba:'Học bạ demo',
        yearend:'Tổng kết demo',
        schoolyear:'Cài đặt demo',
        notifications:'Thông báo demo',
        news:'Tin tức demo',
        phieulienlac:'Phiếu liên lạc demo',
        evaluations:'Đánh giá & Biểu mẫu demo',
        plans:'Kế hoạch dạy học demo',
    };
    const titleEl = document.getElementById('page-title');
    if (titleEl) titleEl.textContent = titles[view] || 'Demo';

    if (view === 'dashboard') return renderDashboard();
    if (view === 'students') return renderStudents();
    if (view === 'attendance') return renderAttendance();
    if (view === 'scores') return renderScores();
    if (view === 'hocba') return renderHocBa();
    if (view === 'finance') return renderFinance();
    if (view === 'timetable') return renderTimetable();
    if (view === 'notifications') return renderSimpleList('Thông báo demo', 'bell', Object.values(window._demoData.notifications || {}));
    if (view === 'news') return renderSimpleList('Tin tức demo', 'newspaper', Object.values(window._demoData.news || {}));
    if (view === 'phieulienlac') return window.renderPhieuLienLac ? window.renderPhieuLienLac() : renderLocked('Phiếu liên lạc demo');
    if (view === 'evaluations') return window.renderEvaluations ? window.renderEvaluations() : renderLocked('Đánh giá & Biểu mẫu demo');
    if (view === 'plans') return window.renderPlans ? window.renderPlans() : renderLocked('Kế hoạch dạy học demo');
    if (view === 'yearend') return renderLocked('Tổng kết năm học demo');
    if (view === 'schoolyear') return renderLocked('Cài đặt năm học demo');
    if (view === 'users') return renderLocked('Quản lý tài khoản demo');
    return renderDashboard();
}
