// ══════════════════════════════════════════════════════════════════════════════
// phieulienlac.js — Smart School V5.33.1
// Xuất Phiếu liên lạc giữa kỳ / cuối kỳ theo mẫu Booklet (Gấp đôi A4 thành A5)
// - Đồng bộ 100% môn học theo từng Khối lớp (Khối 1, 2, 3, 4, 5) với Quản lý điểm & Học bạ
// - Chèn Logo trường St. Mary's House - FMA VN
// - Trang bìa chuẩn: Đã bỏ chữ "Mái ấm" và bỏ câu "Lời nhắn từ nhà trường"
// - Mặt 1: Thông tin học sinh & Logo trường (Bìa trước)
// - Mặt 2: Điểm & Nhận xét các Môn học và HĐGD (Đồng bộ theo Khối)
// - Mặt 3: Đánh giá Phẩm chất & Năng lực (Năng lực chung, Năng lực đặc thù)
// - Mặt 4: Nhận xét Giáo viên chủ nhiệm & Chữ ký (Tự động co dãn chữ khi nhận xét dài)
// ══════════════════════════════════════════════════════════════════════════════

import { PLL_SCHOOL_LOGO } from './pll_logo.js';

console.info('[Smart School V5.33.1] phieu lien lac booklet edition - sync with grade subjects & scores loaded');

export { PLL_SCHOOL_LOGO };

// Cấu hình môn học chuẩn theo từng khối (Đồng bộ với window.PRIMARY_SUBJECTS trong app.js & scores.js)
const PLL_DEFAULT_PRIMARY_SUBJECTS = {
    '1': [
        { name: 'Tiếng Việt',            type: 'diem' },
        { name: 'Toán',                  type: 'diem' },
        { name: 'Ngoại ngữ 1',           type: 'diem', aliases: ['tieng anh', 'anh van', 'english'] },
        { name: 'Đạo đức',               type: 'nhanxet' },
        { name: 'Tự nhiên và Xã hội',    type: 'nhanxet', aliases: ['tu nhien va xa hoi', 'tu nhien & xa hoi', 'tnxh'] },
        { name: 'Giáo dục thể chất',     type: 'nhanxet', aliases: ['the duc', 'gdtc'] },
        { name: 'Nghệ thuật (Âm nhạc)',  type: 'nhanxet', aliases: ['am nhac', 'nghe thuat am nhac'] },
        { name: 'Nghệ thuật (Mỹ thuật)', type: 'nhanxet', aliases: ['my thuat', 'mi thuat', 'nghe thuat my thuat'] },
        { name: 'Hoạt động trải nghiệm', type: 'nhanxet', aliases: ['hoat dong trai nghiem', 'hdtn'] },
    ],
    '2': [
        { name: 'Tiếng Việt',            type: 'diem' },
        { name: 'Toán',                  type: 'diem' },
        { name: 'Ngoại ngữ 1',           type: 'diem', aliases: ['tieng anh', 'anh van', 'english'] },
        { name: 'Đạo đức',               type: 'nhanxet' },
        { name: 'Tự nhiên và Xã hội',    type: 'nhanxet', aliases: ['tu nhien va xa hoi', 'tu nhien & xa hoi', 'tnxh'] },
        { name: 'Giáo dục thể chất',     type: 'nhanxet', aliases: ['the duc', 'gdtc'] },
        { name: 'Nghệ thuật (Âm nhạc)',  type: 'nhanxet', aliases: ['am nhac', 'nghe thuat am nhac'] },
        { name: 'Nghệ thuật (Mỹ thuật)', type: 'nhanxet', aliases: ['my thuat', 'mi thuat', 'nghe thuat my thuat'] },
        { name: 'Hoạt động trải nghiệm', type: 'nhanxet', aliases: ['hoat dong trai nghiem', 'hdtn'] },
    ],
    '3': [
        { name: 'Tiếng Việt',            type: 'diem' },
        { name: 'Toán',                  type: 'diem' },
        { name: 'Ngoại ngữ 1',           type: 'diem', aliases: ['tieng anh', 'anh van', 'english'] },
        { name: 'Tin học',               type: 'diem', aliases: ['tin hoc va cong nghe', 'th'] },
        { name: 'Công nghệ',             type: 'diem', aliases: ['tin hoc va cong nghe', 'cn'] },
        { name: 'Đạo đức',               type: 'nhanxet' },
        { name: 'Tự nhiên và Xã hội',    type: 'nhanxet', aliases: ['tu nhien va xa hoi', 'tu nhien & xa hoi', 'tnxh'] },
        { name: 'Giáo dục thể chất',     type: 'nhanxet', aliases: ['the duc', 'gdtc'] },
        { name: 'Nghệ thuật (Âm nhạc)',  type: 'nhanxet', aliases: ['am nhac', 'nghe thuat am nhac'] },
        { name: 'Nghệ thuật (Mỹ thuật)', type: 'nhanxet', aliases: ['my thuat', 'mi thuat', 'nghe thuat my thuat'] },
        { name: 'Hoạt động trải nghiệm', type: 'nhanxet', aliases: ['hoat dong trai nghiem', 'hdtn'] },
    ],
    '4': [
        { name: 'Tiếng Việt',            type: 'diem' },
        { name: 'Toán',                  type: 'diem' },
        { name: 'Ngoại ngữ 1',           type: 'diem', aliases: ['tieng anh', 'anh van', 'english'] },
        { name: 'Lịch sử và Địa lí',     type: 'diem', aliases: ['lich su va dia li', 'lich su & dia li', 'ls&dl', 'lsdl'] },
        { name: 'Khoa học',              type: 'diem', aliases: ['khoa hoc', 'kh'] },
        { name: 'Tin học',               type: 'diem', aliases: ['tin hoc va cong nghe', 'th'] },
        { name: 'Công nghệ',             type: 'diem', aliases: ['tin hoc va cong nghe', 'cn'] },
        { name: 'Đạo đức',               type: 'nhanxet' },
        { name: 'Giáo dục thể chất',     type: 'nhanxet', aliases: ['the duc', 'gdtc'] },
        { name: 'Nghệ thuật (Âm nhạc)',  type: 'nhanxet', aliases: ['am nhac', 'nghe thuat am nhac'] },
        { name: 'Nghệ thuật (Mỹ thuật)', type: 'nhanxet', aliases: ['my thuat', 'mi thuat', 'nghe thuat my thuat'] },
        { name: 'Hoạt động trải nghiệm', type: 'nhanxet', aliases: ['hoat dong trai nghiem', 'hdtn'] },
    ],
    '5': [
        { name: 'Tiếng Việt',            type: 'diem' },
        { name: 'Toán',                  type: 'diem' },
        { name: 'Ngoại ngữ 1',           type: 'diem', aliases: ['tieng anh', 'anh van', 'english'] },
        { name: 'Lịch sử và Địa lí',     type: 'diem', aliases: ['lich su va dia li', 'lich su & dia li', 'ls&dl', 'lsdl'] },
        { name: 'Khoa học',              type: 'diem', aliases: ['khoa hoc', 'kh'] },
        { name: 'Tin học',               type: 'diem', aliases: ['tin hoc va cong nghe', 'th'] },
        { name: 'Công nghệ',             type: 'diem', aliases: ['tin hoc va cong nghe', 'cn'] },
        { name: 'Đạo đức',               type: 'nhanxet' },
        { name: 'Giáo dục thể chất',     type: 'nhanxet', aliases: ['the duc', 'gdtc'] },
        { name: 'Nghệ thuật (Âm nhạc)',  type: 'nhanxet', aliases: ['am nhac', 'nghe thuat am nhac'] },
        { name: 'Nghệ thuật (Mỹ thuật)', type: 'nhanxet', aliases: ['my thuat', 'mi thuat', 'nghe thuat my thuat'] },
        { name: 'Hoạt động trải nghiệm', type: 'nhanxet', aliases: ['hoat dong trai nghiem', 'hdtn'] },
    ]
};

const PLL_PHAM_CHAT = ['Yêu nước', 'Nhân ái', 'Chăm chỉ', 'Trung thực', 'Trách nhiệm'];
const PLL_NLC = ['Tự chủ và tự học', 'Giao tiếp và hợp tác', 'Giải quyết vấn đề và sáng tạo'];

function pllNorm(value) {
    return String(value || '')
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd').replace(/Đ/g, 'D')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
}

function pllHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function pllFileName(value) {
    return String(value || 'phieu_lien_lac')
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd').replace(/Đ/g, 'D')
        .replace(/[^\w.-]+/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '');
}

function pllYearKey() {
    return (window._currentSchoolYear || window.localData?.settings?.schoolYear || '2025-2026').replace('-', '_');
}

function pllYearText() {
    return window._currentSchoolYear || window.localData?.settings?.schoolYear || '2025-2026';
}

function pllFormatDob(dob) {
    if (!dob) return '';
    const s = String(dob).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
        const [y, m, d] = s.split('-');
        return `${d}/${m}/${y}`;
    }
    return s;
}

function pllCurrentDateText() {
    const d = new Date();
    return `Ngày ${String(d.getDate()).padStart(2, '0')} tháng ${String(d.getMonth() + 1).padStart(2, '0')} năm ${d.getFullYear()}`;
}

// Lấy khối lớp của học sinh (1, 2, 3, 4, 5)
function pllGradeOfStudent(student) {
    const cls = student?.classRoom || student?.class || '';
    const m = String(cls).match(/^(\d+)/);
    return m ? m[1] : '1';
}

// Từ đồng nghĩa chuẩn để đối chiếu tên môn học giữa Học bạ và Quản lý điểm
function pllGetAliasesForSubject(name) {
    const n = pllNorm(name);
    if (n.includes('tieng viet') || n === 'tv') return ['tiếng việt', 'tieng viet', 'tv'];
    if (n === 'toan') return ['toán', 'toan'];
    if (n.includes('ngoai ngu') || n.includes('tieng anh') || n.includes('anh van') || n === 'english') {
        return ['ngoại ngữ 1', 'ngoai ngu 1', 'tiếng anh', 'tieng anh', 'anh văn', 'anh van', 'english', 'nn1'];
    }
    if (n.includes('tu nhien') || n === 'tnxh') {
        return ['tự nhiên và xã hội', 'tu nhien va xa hoi', 'tự nhiên & xã hội', 'tu nhien & xa hoi', 'tnxh'];
    }
    if (n.includes('lich su') || n.includes('dia li') || n === 'lsdl') {
        return ['lịch sử và địa lí', 'lich su va dia li', 'lịch sử & địa lí', 'lich su & dia li', 'ls&dl', 'lsdl'];
    }
    if (n.includes('khoa hoc') || n === 'kh') return ['khoa học', 'khoa hoc', 'kh'];
    if (n.includes('tin hoc') || n === 'th') return ['tin học', 'tin hoc', 'th'];
    if (n.includes('cong nghe') || n === 'cn') return ['công nghệ', 'cong nghe', 'cn'];
    if (n.includes('dao duc')) return ['đạo đức', 'dao duc'];
    if (n.includes('the chat') || n.includes('the duc') || n === 'gdtc') {
        return ['giáo dục thể chất', 'giao duc the chat', 'thể dục', 'the duc', 'gdtc'];
    }
    if (n.includes('am nhac')) {
        return ['nghệ thuật (âm nhạc)', 'nghe thuat (am nhac)', 'âm nhạc', 'am nhac', 'nghệ thuật âm nhạc'];
    }
    if (n.includes('my thuat') || n.includes('mi thuat')) {
        return ['nghệ thuật (mỹ thuật)', 'nghe thuat (my thuat)', 'mỹ thuật', 'my thuat', 'mĩ thuật', 'mi thuat', 'nghệ thuật mỹ thuật'];
    }
    if (n.includes('trai nghiem') || n === 'hdtn') {
        return ['hoạt động trải nghiệm', 'hoat dong trai nghiem', 'hdtn'];
    }
    if (n.includes('dan toc') || n === 'tdt') {
        return ['tiếng dân tộc', 'tieng dan toc', 'tdt'];
    }
    return [name];
}

// Lấy danh sách môn học đồng bộ theo Khối lớp và học bạ của học sinh
function pllGetSubjectsForStudent(student, subjectBlock) {
    const grade = pllGradeOfStudent(student);
    const configured = (window.PRIMARY_SUBJECTS?.[grade] || PLL_DEFAULT_PRIMARY_SUBJECTS[grade] || PLL_DEFAULT_PRIMARY_SUBJECTS['1']);

    const result = [];
    const addedNames = new Set();

    configured.forEach(sub => {
        const subName = sub.name;
        // Bỏ qua Tiếng dân tộc nếu không có dữ liệu
        if (pllNorm(subName) === 'tieng dan toc') {
            const rec = pllFindRecord(subjectBlock, subName, ['tieng dan toc', 'tdt']);
            if (!rec || (!rec.mucDat && rec.diem === undefined && !rec.nhanXet)) return;
        }
        addedNames.add(pllNorm(subName));
        result.push(sub);
    });

    // Nếu trong subjectBlock có môn học nào khác được nhập điểm mà chưa có trong danh mục, tự động bổ sung
    if (subjectBlock && typeof subjectBlock === 'object') {
        Object.keys(subjectBlock).forEach(key => {
            if (key.startsWith('__')) return;
            const nk = pllNorm(key);
            // Đối với Khối 1, 2, 3: Tuyệt đối không tự bổ sung Khoa học hoặc Lịch sử & Địa lí
            if (Number(grade) <= 3 && (nk.includes('khoa hoc') || nk.includes('lich su') || nk.includes('dia li'))) {
                return;
            }
            if (!addedNames.has(nk)) {
                const matched = result.find(s => {
                    const aliases = pllGetAliasesForSubject(s.name);
                    return aliases.some(a => pllNorm(a) === nk || nk.includes(pllNorm(a)));
                });
                if (!matched) {
                    result.push({ name: key, type: 'diem' });
                    addedNames.add(nk);
                }
            }
        });
    }

    // Bảo đảm với Khối 1, 2, 3 không xuất hiện môn Khoa học và Lịch sử & Địa lí
    if (Number(grade) <= 3) {
        return result.filter(s => {
            const n = pllNorm(s.name);
            return !n.includes('khoa hoc') && !n.includes('lich su') && !n.includes('dia li');
        });
    }

    return result;
}

// Kiểm tra môn có điểm kiểm tra định kỳ giữa học kỳ
function pllHasNumericScoreInGHK(grade, subjectName) {
    if (typeof window.isGHKScoreSubject === 'function') {
        return window.isGHKScoreSubject(grade, subjectName);
    }
    const n = pllNorm(subjectName);
    return ['3', '4', '5'].includes(String(grade))
        && ['tieng viet', 'toan', 'ngoai ngu 1', 'tieng anh'].includes(n);
}

// Lấy danh mục năng lực đặc thù theo khối lớp
function pllNldForGrade(grade, nldBlock) {
    if (['1', '2'].includes(String(grade))) {
        const base = ['Ngôn ngữ', 'Tính toán', 'Khoa học', 'Thẩm mĩ', 'Thể chất'];
        ['Công nghệ', 'Tin học'].forEach(sub => {
            const rec = pllFindRecord(nldBlock, sub);
            if (rec && (rec.mucDat || rec.nhanXet)) base.push(sub);
        });
        return base;
    }
    return ['Ngôn ngữ', 'Tính toán', 'Khoa học', 'Công nghệ', 'Tin học', 'Thẩm mĩ', 'Thể chất'];
}

// Chuẩn hóa tên lớp để đối soát tuyệt đối chính xác (1/1, 1_1, Lớp 1/1, 1-1 => 1_1)
function pllNormClass(cls) {
    if (!cls) return '';
    return String(cls)
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/^(lớp|lop)\s*/, '')
        .replace(/[\/\-\.\s]/g, '_')
        .replace(/^_+|_+$/g, '')
        .trim();
}

// Lập chỉ mục người dùng GVCN vào bảng phân công
function pllIndexTeacherUser(u) {
    if (!u || typeof u !== 'object') return;
    const role = String(u.role || '').toLowerCase();
    const isTeacher = ['teacher', 'homeroom teacher', 'giáo viên chủ nhiệm', 'giao vien chu nhiem'].includes(role)
        || Boolean(u.assignedClass && !u.assignedSubject);

    if (isTeacher) {
        const name = (u.name || u.displayName || u.fullName || '').trim();
        if (!name) return;
        window._pllTeacherMap = window._pllTeacherMap || {};
        const cls = u.assignedClass || u.class || '';
        const clsKey = u.assignedClassKey || '';
        if (cls) window._pllTeacherMap[pllNormClass(cls)] = name;
        if (clsKey) window._pllTeacherMap[pllNormClass(clsKey)] = name;
    }
}

// Nạp tự động toàn diện danh sách phân công giáo viên chủ nhiệm
async function pllEnsureTeachersLoaded(force = false) {
    if (window._pllTeachersLoaded && !force && window._pllTeacherMap && Object.keys(window._pllTeacherMap).length) {
        return window._pllTeacherMap;
    }
    window._pllTeacherMap = window._pllTeacherMap || {};

    // 1. Quét từ window.localData.users
    const localUsers = Object.values(window.localData?.users || {});
    localUsers.forEach(pllIndexTeacherUser);

    // 2. Tải node 'users' từ Firebase để cập nhật đầy đủ toàn trường
    try {
        if (window.db && window.ref && window.get) {
            const snap = await window.get(window.ref(window.db, 'users'));
            if (snap && snap.exists()) {
                const usersObj = snap.val() || {};
                window._cachedUsers = usersObj;
                if (window.localData) window.localData.users = usersObj;
                Object.values(usersObj).forEach(pllIndexTeacherUser);
            }
        }
    } catch (e) {
        console.warn('[PLL] Không nạp được users từ Firebase (sẽ dùng cache nội bộ):', e);
    }

    // 3. Nếu tài khoản hiện tại là giáo viên chủ nhiệm, luôn ưu tiên thông tin chính mình
    const currentRole = window.userRole || window.currentUserProfile?.role;
    if (currentRole === 'teacher' || (!currentRole && window.teacherClass)) {
        const myName = (
            window.currentUserProfile?.name ||
            window.currentUserProfile?.displayName ||
            window.currentUser?.displayName ||
            window.teacherName ||
            ''
        ).trim();
        const myClass = window.teacherClass || window.currentUserProfile?.assignedClass || '';
        const myClassKey = window.teacherClassKey || window.currentUserProfile?.assignedClassKey || '';
        if (myName) {
            if (myClass) window._pllTeacherMap[pllNormClass(myClass)] = myName;
            if (myClassKey) window._pllTeacherMap[pllNormClass(myClassKey)] = myName;
            window._pllCurrentTeacherName = myName;
        }
    }

    // 4. Quét từ thời khóa biểu (timetables) nếu có phân công
    try {
        const tt = window.localData?.timetables || {};
        Object.entries(tt).forEach(([k, slots]) => {
            if (slots && typeof slots === 'object') {
                Object.values(slots).forEach(dayObj => {
                    if (dayObj && typeof dayObj === 'object') {
                        Object.values(dayObj).forEach(slot => {
                            if (slot && (slot.subject === 'Sinh hoạt lớp' || slot.subject === 'Hoạt động trải nghiệm') && slot.teacher) {
                                const norm = pllNormClass(k);
                                if (norm && !window._pllTeacherMap[norm]) {
                                    window._pllTeacherMap[norm] = String(slot.teacher).trim();
                                }
                            }
                        });
                    }
                });
            }
        });
    } catch (e) {}

    window._pllTeachersLoaded = true;
    return window._pllTeacherMap;
}

// Lấy tên Giáo viên chủ nhiệm của lớp đã được phân công
function pllGetTeacherForClass(className) {
    if (!className) return '';
    const norm = pllNormClass(className);

    // 1. Kiểm tra nếu có gán tạm / override
    if (window._pllOverrideTeacher && window._pllOverrideTeacher[norm]) {
        return window._pllOverrideTeacher[norm];
    }

    // 2. Tra cứu trong bản đồ phân công GVCN
    if (window._pllTeacherMap && window._pllTeacherMap[norm]) {
        return window._pllTeacherMap[norm];
    }

    // 3. Nếu người dùng hiện tại là giáo viên chủ nhiệm xem lớp mình
    if (window.userRole === 'teacher') {
        const myClassNorm = pllNormClass(window.teacherClass || window.currentUserProfile?.assignedClass || '');
        const myKeyNorm = pllNormClass(window.teacherClassKey || window.currentUserProfile?.assignedClassKey || '');
        if (myClassNorm === norm || myKeyNorm === norm || !myClassNorm) {
            const myName = (
                window.currentUserProfile?.name ||
                window.currentUserProfile?.displayName ||
                window.currentUser?.displayName ||
                window.teacherName ||
                ''
            ).trim();
            if (myName) return myName;
        }
    }

    // 4. Tra cứu từ danh sách users
    try {
        const users = Object.values(window._cachedUsers || window.localData?.users || {});
        for (const u of users) {
            if (!u) continue;
            const role = String(u.role || '').toLowerCase();
            const isTeacher = ['teacher', 'homeroom teacher', 'giáo viên chủ nhiệm', 'giao vien chu nhiem'].includes(role)
                || Boolean(u.assignedClass && !u.assignedSubject);
            if (isTeacher) {
                const uNorm1 = pllNormClass(u.assignedClass || u.class || '');
                const uNorm2 = pllNormClass(u.assignedClassKey || '');
                if (uNorm1 === norm || uNorm2 === norm) {
                    const name = (u.name || u.displayName || u.fullName || '').trim();
                    if (name) {
                        window._pllTeacherMap = window._pllTeacherMap || {};
                        window._pllTeacherMap[norm] = name;
                        return name;
                    }
                }
            }
        }
    } catch (e) {
        console.warn('[PLL] Lỗi tra cứu GVCN cho lớp:', e);
    }

    // 5. Fallback cuối cùng nếu đang là GVCN đăng nhập
    if (window.userRole === 'teacher') {
        const myName = (
            window.currentUserProfile?.name ||
            window.currentUserProfile?.displayName ||
            window.currentUser?.displayName ||
            window.teacherName ||
            ''
        ).trim();
        if (myName) return myName;
    }

    return '';
}

function pllStudentKeyOf(student) {
    const code = student?.code || student?.id || '';
    const found = Object.entries(window.localData?.students || {}).find(([key, s]) => {
        return key === student?._key || key === code || s === student || s.code === code || s.id === code;
    });
    return found ? found[0] : (student?._key || code);
}

// Đọc toàn diện dữ liệu học sinh từ node hocba (đồng bộ cả Học bạ và Quản lý điểm)
async function pllReadHocBa(student) {
    const key = pllStudentKeyOf(student);
    const code = student?.code || student?.id || '';
    const yk = pllYearKey();
    if (!key && !code) return {};
    try {
        let snap = await window.get(window.ref(window.db, `hocba/${key}/${yk}`));
        let val = snap.val();
        if ((!val || Object.keys(val).length === 0) && code && code !== key) {
            snap = await window.get(window.ref(window.db, `hocba/${code}/${yk}`));
            val = snap.val();
        }
        return val || {};
    } catch (error) {
        console.warn('[PLL] Không đọc được học bạ:', error);
        return {};
    }
}

function pllFindRecord(block, label, aliases = []) {
    if (!block || typeof block !== 'object') return {};
    const allAliases = [...new Set([label, ...(aliases || []), ...pllGetAliasesForSubject(label)])];
    const candidates = allAliases.map(pllNorm).filter(Boolean);

    // Tìm kiếm khớp chính xác
    for (const [key, val] of Object.entries(block)) {
        if (key.startsWith('__')) continue;
        const nk = pllNorm(key);
        if (candidates.includes(nk)) return val || {};
    }
    // Tìm kiếm gần đúng
    for (const [key, val] of Object.entries(block)) {
        if (key.startsWith('__')) continue;
        const nk = pllNorm(key);
        if (candidates.some(c => (c.length > 3 && nk.includes(c)) || (nk.length > 3 && c.includes(nk)))) {
            return val || {};
        }
    }
    return {};
}

// Lấy khối môn học theo mode (đồng bộ cả scores.js và hocba.js)
function pllSubjectBlock(hocba, mode) {
    if (!hocba || typeof hocba !== 'object') return {};
    let block = {};
    if (mode === 'gk1') {
        block = { ...(hocba.ghk1 || {}), ...(hocba.ghk1_subjects || {}) };
    } else if (mode === 'gk2') {
        block = { ...(hocba.ghk2 || {}), ...(hocba.ghk2_subjects || {}) };
    } else if (mode === 'ck1') {
        block = { ...(hocba.hk1 || {}), ...(hocba.hk1_subjects || {}) };
    } else {
        block = { ...(hocba.subjects || {}), ...(hocba.hk2 || {}), ...(hocba.hk2_subjects || {}) };
    }
    return block;
}

// Lấy khối phẩm chất / năng lực (đồng bộ cả scores.js: __pc, __nlc, __nld và hocba.js: phamChat, nangLucChung, nangLucDacThu)
function pllTraitBlock(hocba, mode, type) {
    if (!hocba || typeof hocba !== 'object') return {};
    const suffix = type === 'pc' ? 'phamChat' : type === 'nlc' ? 'nangLucChung' : 'nangLucDacThu';
    const prop = `__${type}`;

    let result = {};

    if (mode === 'gk1') {
        result = {
            ...(hocba.ghk1?.[prop] || {}),
            ...(hocba.ghk1?.[suffix] || {}),
            ...(hocba.ghk1_phamChat && type === 'pc' ? hocba.ghk1_phamChat : {}),
            ...(hocba.ghk1_nangLucChung && type === 'nlc' ? hocba.ghk1_nangLucChung : {}),
            ...(hocba.ghk1_nangLucDacThu && type === 'nld' ? hocba.ghk1_nangLucDacThu : {}),
        };
    } else if (mode === 'gk2') {
        result = {
            ...(hocba.ghk2?.[prop] || {}),
            ...(hocba.ghk2?.[suffix] || {}),
            ...(hocba.ghk2_phamChat && type === 'pc' ? hocba.ghk2_phamChat : {}),
            ...(hocba.ghk2_nangLucChung && type === 'nlc' ? hocba.ghk2_nangLucChung : {}),
            ...(hocba.ghk2_nangLucDacThu && type === 'nld' ? hocba.ghk2_nangLucDacThu : {}),
        };
    } else if (mode === 'ck1') {
        result = {
            ...(hocba.hk1?.[prop] || {}),
            ...(hocba.hk1?.[suffix] || {}),
            ...(hocba.hk1_phamChat && type === 'pc' ? hocba.hk1_phamChat : {}),
            ...(hocba.hk1_nangLucChung && type === 'nlc' ? hocba.hk1_nangLucChung : {}),
            ...(hocba.hk1_nangLucDacThu && type === 'nld' ? hocba.hk1_nangLucDacThu : {}),
        };
    } else {
        result = {
            ...(hocba[suffix] || {}),
            ...(hocba.hk2?.[prop] || {}),
            ...(hocba.hk2?.[suffix] || {}),
            ...(hocba.hk2_phamChat && type === 'pc' ? hocba.hk2_phamChat : {}),
            ...(hocba.hk2_nangLucChung && type === 'nlc' ? hocba.hk2_nangLucChung : {}),
            ...(hocba.hk2_nangLucDacThu && type === 'nld' ? hocba.hk2_nangLucDacThu : {}),
        };
    }
    return result;
}

function pllLevelText(value, type = 'subject') {
    const v = String(value ?? '').trim();
    if (!v) return '';
    if (type === 'subject') return ({ T: 'T', H: 'H', C: 'C' }[v] || v);
    return ({ T: 'T', D: 'Đ', Đ: 'Đ', C: 'C' }[v] || v);
}

function pllRecordLevel(record, type = 'subject') {
    if (!record || typeof record !== 'object') return '';
    return pllLevelText(record.mucDat || record.level || record.value || record.muc || '', type);
}

function pllRecordScore(record) {
    if (!record || typeof record !== 'object') return '';
    const score = record.diem ?? record.score ?? record.diemKtDk ?? record.ktdk ?? '';
    return score === null || score === undefined ? '' : String(score);
}

function pllRecordComment(record) {
    if (!record || typeof record !== 'object') return '';
    return record.nhanXet || record.comment || record.note || '';
}

function pllModeMeta(mode) {
    const isMid = mode === 'gk1' || mode === 'gk2';
    const semesterRoman = mode.endsWith('1') ? 'I' : 'II';
    const semesterNumber = mode.endsWith('1') ? '1' : '2';

    return {
        isMid,
        semesterRoman,
        semesterNumber,
        title: isMid
            ? `ĐÁNH GIÁ HỌC SINH GIỮA HỌC KỲ ${semesterRoman}`
            : `ĐÁNH GIÁ HỌC SINH CUỐI HỌC KỲ ${semesterRoman}`,
        label: `${isMid ? 'Giữa học kỳ' : 'Cuối học kỳ'} ${semesterRoman}`,
        templateName: isMid ? 'PLL GK.docx' : 'PLL CK.docx'
    };
}

function pllAllowedStudents() {
    if (!['admin', 'teacher'].includes(window.userRole)) return [];

    let list = Object.entries(window.localData?.students || {})
        .map(([key, student]) => ({ ...student, _key: key }))
        .filter(student =>
            typeof window.isActiveStudent === 'function'
                ? window.isActiveStudent(student)
                : String(student.status || 'active').toLowerCase() === 'active'
        );

    if (window.userRole === 'teacher') {
        list = list.filter(student =>
            (student.classRoom || student.class || '') === window.teacherClass
            || student.currentClassKey === window.teacherClassKey
        );
    }

    return list;
}

function pllCurrentStudents() {
    const selectedClass = window._pllSelectedClass || '';
    return pllAllowedStudents()
        .filter(student => !selectedClass || (student.classRoom || student.class || '') === selectedClass)
        .sort((a, b) => {
            const codeA = String(a.code || a.id || a._key || '');
            const codeB = String(b.code || b.id || b._key || '');
            const byCode = codeA.localeCompare(codeB, 'vi', { numeric: true, sensitivity: 'base' });
            return byCode || String(a.name || '').localeCompare(String(b.name || ''), 'vi', { sensitivity: 'base' });
        });
}

function pllClassList() {
    return [...new Set(pllAllowedStudents().map(s => s.classRoom || s.class).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b, 'vi'));
}

function pllCanAccessStudent(studentKey) {
    return pllAllowedStudents().some(student => pllStudentKeyOf(student) === studentKey);
}

// Render các hàng bảng với đối soát chính xác theo khối và môn
function pllRenderRows(items, block, type, grade, mode) {
    const isMid = mode === 'gk1' || mode === 'gk2';

    return items.map(item => {
        let label = '';
        let subType = 'diem';
        let aliases = [];

        if (typeof item === 'string') {
            label = item;
            aliases = pllGetAliasesForSubject(item);
        } else if (Array.isArray(item)) {
            label = item[0];
            aliases = item[1] || [];
        } else if (item && typeof item === 'object') {
            label = item.name;
            subType = item.type || 'diem';
            aliases = item.aliases || pllGetAliasesForSubject(item.name);
        }

        const record = pllFindRecord(block, label, aliases);
        const level = pllRecordLevel(record, type);
        const score = pllRecordScore(record);
        const comment = pllRecordComment(record);

        let scoreCell = '';
        if (type === 'subject') {
            if (isMid) {
                // Giữa học kỳ: chỉ khối 3, 4, 5 và 3 môn (Tiếng Việt, Toán, Ngoại ngữ 1) có điểm KTĐK
                const hasScore = pllHasNumericScoreInGHK(grade, label);
                if (hasScore) {
                    scoreCell = `<td class="pll-score">${pllHtml(score)}</td>`;
                } else {
                    scoreCell = `<td class="pll-score score-disabled">—</td>`;
                }
            } else {
                // Cuối học kỳ: môn nhận xét hiển thị gạch ngang nếu không có điểm số
                if (subType === 'nhanxet' && score === '') {
                    scoreCell = `<td class="pll-score score-disabled">—</td>`;
                } else {
                    scoreCell = `<td class="pll-score">${pllHtml(score)}</td>`;
                }
            }
        }

        const commentClass = comment.length > 70 ? 'comment-long' : comment.length > 35 ? 'comment-medium' : '';
        return `<tr>
            <td class="pll-name">${pllHtml(label)}</td>
            <td class="pll-level">${pllHtml(level)}</td>
            ${scoreCell}
            <td class="pll-comment ${commentClass}">${pllHtml(comment)}</td>
        </tr>`;
    }).join('');
}

function pllGetCommentSizeClass(text) {
    const len = String(text || '').trim().length;
    if (len > 450) return 'size-xs';
    if (len > 280) return 'size-sm';
    if (len > 160) return 'size-md';
    return 'size-normal';
}

// ══════════════════════════════════════════════════════════════════════════════
// XÂY DỰNG 4 MẶT CỦA BOOKLET (A5)
// ══════════════════════════════════════════════════════════════════════════════

// MẶT 1: THÔNG TIN HỌC SINH & LOGO TRƯỜNG (BÌA TRƯỚC)
// Đã loại bỏ chữ "MÁI ẤM" và bỏ câu "LỜI NHẮN TỪ NHÀ TRƯỜNG" theo yêu cầu
function pllBuildPage1(student, hocba, mode, meta, teacherName) {
    const studentCode = student.code || student.id || student._key || '';
    const studentClass = student.classRoom || student.class || '';
    const dob = pllFormatDob(student.dob || student.birthDate || '');
    const gender = student.gender || '';

    return `<div class="booklet-page page-1">
        <div class="page-content-wrapper cover-frame">
            <div class="cover-inner-border">
                <!-- Header: Tên cơ quan & Logo trường -->
                <div class="cover-header">
                    <div class="cover-org-info">
                        <div class="org-line1">ỦY BAN NHÂN DÂN PHƯỜNG TAM BÌNH</div>
                        <div class="org-line2">TRƯỜNG TIỂU HỌC TRƯƠNG VĂN HẢI (PC)</div>
                        <div class="org-line3">ST. MARY'S HOUSE - FMA VN</div>
                    </div>
                    <div class="cover-logo-box">
                        <img src="${PLL_SCHOOL_LOGO}" alt="Logo Trường St. Mary's House" class="school-logo-img">
                    </div>
                </div>

                <!-- Tiêu đề lớn -->
                <div class="cover-title-group">
                    <h1 class="main-title">PHIẾU LIÊN LẠC</h1>
                    <div class="sub-title">${pllHtml(meta.title)}</div>
                    <div class="school-year">NĂM HỌC: ${pllHtml(pllYearText())}</div>
                </div>

                <div class="cover-divider">❖ &nbsp; ❖ &nbsp; ❖</div>

                <!-- Khung thông tin học sinh (Trang trọng, rộng rãi, rõ ràng) -->
                <div class="cover-student-card">
                    <div class="student-info-row fullname-row">
                        <span class="info-label">Họ và tên học sinh:</span>
                        <span class="info-value student-name-big">${pllHtml(student.name || '')}</span>
                    </div>
                    <div class="student-info-grid">
                        <div class="student-info-row">
                            <span class="info-label">Lớp:</span>
                            <span class="info-value bold">${pllHtml(studentClass)}</span>
                        </div>
                        <div class="student-info-row">
                            <span class="info-label">Mã học sinh:</span>
                            <span class="info-value bold">${pllHtml(studentCode)}</span>
                        </div>
                    </div>
                    <div class="student-info-grid">
                        <div class="student-info-row">
                            <span class="info-label">Ngày sinh:</span>
                            <span class="info-value">${pllHtml(dob || '... / ... / ......')}</span>
                        </div>
                        <div class="student-info-row">
                            <span class="info-label">Giới tính:</span>
                            <span class="info-value">${pllHtml(gender || 'Nam / Nữ')}</span>
                        </div>
                    </div>
                    <div class="student-info-row">
                        <span class="info-label">Giáo viên chủ nhiệm:</span>
                        <span class="info-value bold teacher-name-display">${pllHtml(teacherName || '................................................')}</span>
                    </div>
                </div>

                <div class="page-footer-tag">Mặt 1 (Bìa trước)</div>
            </div>
        </div>
    </div>`;
}

// MẶT 2: CÁC MÔN HỌC VÀ HOẠT ĐỘNG GIÁO DỤC (ĐỒNG BỘ CHÍNH XÁC THEO KHỐI & LẤP ĐẦY TRANG 2)
function pllBuildPage2(student, hocba, mode, meta) {
    const studentClass = student.classRoom || student.class || '';
    const grade = pllGradeOfStudent(student);
    const subjectBlock = pllSubjectBlock(hocba, mode);
    const subjects = pllGetSubjectsForStudent(student, subjectBlock);

    return `<div class="booklet-page page-2">
        <div class="page-content-wrapper fill-page-layout">
            <div class="page-header-mini">
                <div class="student-mini-name">HS: <b>${pllHtml(student.name || '')}</b> — Lớp: <b>${pllHtml(studentClass)}</b> (Khối ${grade})</div>
                <div class="mode-mini-tag">${pllHtml(meta.label)}</div>
            </div>

            <div class="section-heading">1. CÁC MÔN HỌC VÀ HOẠT ĐỘNG GIÁO DỤC</div>

            <!-- Khung co dãn lấp đầy toàn bộ chiều cao Trang 2 -->
            <div class="page-table-fill-box page2-table-fill">
                <table class="subject-table auto-scale-table table-fill-page">
                    <thead>
                        <tr>
                            <th style="width:31%">Môn học và<br>hoạt động giáo dục</th>
                            <th style="width:13%">Mức<br>đạt</th>
                            <th style="width:13%">Điểm<br>KTĐK</th>
                            <th style="width:43%">Nhận xét của giáo viên</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${pllRenderRows(subjects, subjectBlock, 'subject', grade, mode)}
                    </tbody>
                </table>
            </div>

            <div class="page-bottom-legend">
                <span class="legend-item">* Quy ước mức đạt: <b>T</b>: Tốt; <b>H</b>: Hoàn thành; <b>C</b>: Chưa hoàn thành.</span>
                <span class="page-num-indicator">Trang 2</span>
            </div>
        </div>
    </div>`;
}

// MẶT 3: NĂNG LỰC VÀ PHẨM CHẤT (LẤP ĐẦY TRANG 3 & CÂN BẰNG VỚI TRANG 2)
function pllBuildPage3(student, hocba, mode, meta) {
    const studentClass = student.classRoom || student.class || '';
    const grade = pllGradeOfStudent(student);
    const pcBlock = pllTraitBlock(hocba, mode, 'pc');
    const nlcBlock = pllTraitBlock(hocba, mode, 'nlc');
    const nldBlock = pllTraitBlock(hocba, mode, 'nld');
    const nldItems = pllNldForGrade(grade, nldBlock);

    return `<div class="booklet-page page-3">
        <div class="page-content-wrapper fill-page-layout">
            <div class="page-header-mini">
                <div class="student-mini-name">HS: <b>${pllHtml(student.name || '')}</b> — Lớp: <b>${pllHtml(studentClass)}</b> (Khối ${grade})</div>
                <div class="mode-mini-tag">${pllHtml(meta.label)}</div>
            </div>

            <!-- Khung co dãn lấp đầy toàn bộ chiều cao Trang 3 (chia tỷ lệ 3 bảng cân bằng) -->
            <div class="page-table-fill-box page3-traits-fill">
                <!-- Phần 2: Những phẩm chất chủ yếu -->
                <div class="trait-section-block trait-block-pc">
                    <div class="section-heading section-heading-compact">2. NHỮNG PHẨM CHẤT CHỦ YẾU</div>
                    <table class="trait-table auto-scale-table table-fill-pc">
                        <thead>
                            <tr>
                                <th style="width:31%">Phẩm chất</th>
                                <th style="width:16%">Mức đạt</th>
                                <th style="width:53%">Nhận xét</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${pllRenderRows(PLL_PHAM_CHAT, pcBlock, 'trait', grade, mode)}
                        </tbody>
                    </table>
                </div>

                <!-- Phần 3a: Những năng lực chung -->
                <div class="trait-section-block trait-block-nlc">
                    <div class="section-heading section-heading-compact" style="margin-top:2px">3. NHỮNG NĂNG LỰC CỐT LÕI</div>
                    <div class="sub-section-title sub-title-compact">a. Những năng lực chung</div>
                    <table class="trait-table auto-scale-table table-fill-nlc">
                        <thead>
                            <tr>
                                <th style="width:31%">Năng lực</th>
                                <th style="width:16%">Mức đạt</th>
                                <th style="width:53%">Nhận xét</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${pllRenderRows(PLL_NLC, nlcBlock, 'trait', grade, mode)}
                        </tbody>
                    </table>
                </div>

                <!-- Phần 3b: Những năng lực đặc thù -->
                <div class="trait-section-block trait-block-nld">
                    <div class="sub-section-title sub-title-compact">b. Những năng lực đặc thù</div>
                    <table class="trait-table auto-scale-table table-fill-nld">
                        <thead>
                            <tr>
                                <th style="width:31%">Năng lực</th>
                                <th style="width:16%">Mức đạt</th>
                                <th style="width:53%">Nhận xét</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${pllRenderRows(nldItems, nldBlock, 'trait', grade, mode)}
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="page-bottom-legend">
                <span class="legend-item">* Quy ước mức đạt: <b>T</b>: Tốt; <b>Đ</b>: Đạt; <b>C</b>: Cần cố gắng.</span>
                <span class="page-num-indicator">Trang 3</span>
            </div>
        </div>
    </div>`;
}

// MẶT 4: NHẬN XÉT CỦA GIÁO VIÊN & CHỮ KÝ (MẶT CUỐI / BÌA SAU)
function pllBuildPage4(student, hocba, mode, meta, teacherName) {
    const hkNode = hocba[mode] || (mode === 'ck1' ? hocba.hk1 : mode === 'ck2' ? hocba.hk2 : null) || {};
    const generalComment = hkNode.nhanXet || hkNode.__nhanXet || hkNode.__body?.nhanXet || hkNode.comment || hocba[`${mode}_nhanXet`] || hocba.nhanXet || hocba.comment || hocba.nhanXetChung || '';
    const ketQua = hkNode.__kq || hocba.ketQua || hocba.hk2?.__kq || {};
    const danhGia = ketQua.danhGia || '';
    const khenThuong = ketQua.khenThuong || '';
    const sizeClass = pllGetCommentSizeClass(generalComment);

    const hasEvaluation = !meta.isMid && (danhGia || khenThuong);

    let commentBodyHtml = '';
    if (generalComment.trim()) {
        commentBodyHtml = `<div class="teacher-comment-text auto-fit-comment ${sizeClass}" data-original-text="${pllHtml(generalComment)}">${pllHtml(generalComment)}</div>`;
    } else {
        commentBodyHtml = `<div class="dotted-write-lines">
            <div class="dot-line"></div>
            <div class="dot-line"></div>
            <div class="dot-line"></div>
            <div class="dot-line"></div>
            <div class="dot-line"></div>
        </div>`;
    }

    return `<div class="booklet-page page-4">
        <div class="page-content-wrapper back-cover-frame">
            <div class="section-heading-center">4. Ý KIẾN VÀ ĐÁNH GIÁ CỦA GIÁO VIÊN CHỦ NHIỆM</div>

            <!-- Khung nhận xét của GVCN (Tự co dãn chiều cao & cỡ chữ) -->
            <div class="teacher-comment-card">
                <div class="card-title-bar">
                    <span class="card-title-text">NHẬN XÉT CỦA GIÁO VIÊN CHỦ NHIỆM:</span>
                    ${hasEvaluation && danhGia ? `<span class="eval-pill">${pllHtml(danhGia)}</span>` : ''}
                </div>
                ${hasEvaluation && khenThuong ? `<div class="award-line"><b>Khen thưởng:</b> ${pllHtml(khenThuong)}</div>` : ''}
                <div class="comment-scroll-box comment-section-body">
                    ${commentBodyHtml}
                </div>
            </div>

            <!-- Khung ý kiến phản hồi của phụ huynh -->
            <div class="parent-feedback-card">
                <div class="card-title-bar">
                    <span class="card-title-text">Ý KIẾN CỦA CHA MẸ HỌC SINH:</span>
                </div>
                <div class="parent-dotted-lines">
                    <div class="dot-line"></div>
                    <div class="dot-line"></div>
                    <div class="dot-line"></div>
                </div>
            </div>

            <!-- Phần ngày tháng và 3 chữ ký chuẩn mực, cân xứng, thẩm mỹ -->
            <div class="signatures-container">
                <div class="sig-date-header">TP. Hồ Chí Minh, ${pllCurrentDateText()}</div>
                <div class="signatures-grid">
                    <div class="sig-column">
                        <div class="sig-role">CHA MẸ HỌC SINH</div>
                        <div class="sig-guide">(Ký và ghi rõ họ tên)</div>
                        <div class="sig-space"></div>
                        <div class="sig-name-line sig-name-empty"></div>
                    </div>
                    <div class="sig-column">
                        <div class="sig-role">GIÁO VIÊN CHỦ NHIỆM</div>
                        <div class="sig-guide">(Ký và ghi rõ họ tên)</div>
                        <div class="sig-space"></div>
                        <div class="sig-name-line bold teacher-name-display">${pllHtml(teacherName || '')}</div>
                    </div>
                    <div class="sig-column">
                        <div class="sig-role">HIỆU TRƯỞNG</div>
                        <div class="sig-guide">(Ký tên và đóng dấu)</div>
                        <div class="sig-space"></div>
                        <div class="sig-name-line sig-name-empty"></div>
                    </div>
                </div>
            </div>

            <div class="page-footer-tag">Mặt 4 (Bìa sau)</div>
        </div>
    </div>`;
}

// ══════════════════════════════════════════════════════════════════════════════
// LẮP RÁP BỘ BOOKLET 4 TRANG THEO QUY CHUẨN IN GẤP ĐÔI
// Sheet 1 (Mặt ngoài): [Trang 4 - Bìa sau]  |  [Trang 1 - Bìa trước]
// Sheet 2 (Mặt trong): [Trang 2 - Môn học]   |  [Trang 3 - Năng lực phẩm chất]
// ══════════════════════════════════════════════════════════════════════════════
function pllBuildStudentBooklet(student, hocba, mode, isWord = false) {
    const meta = pllModeMeta(mode);
    const studentClass = student.classRoom || student.class || '';
    const teacherName = pllGetTeacherForClass(studentClass);

    const page1Html = pllBuildPage1(student, hocba, mode, meta, teacherName);
    const page2Html = pllBuildPage2(student, hocba, mode, meta);
    const page3Html = pllBuildPage3(student, hocba, mode, meta);
    const page4Html = pllBuildPage4(student, hocba, mode, meta, teacherName);

    if (isWord) {
        return `<div class="word-student-doc">
            ${page1Html}
            <br clear="all" style="page-break-before:always;mso-break-type:section-break">
            ${page2Html}
            <br clear="all" style="page-break-before:always;mso-break-type:section-break">
            ${page3Html}
            <br clear="all" style="page-break-before:always;mso-break-type:section-break">
            ${page4Html}
        </div>`;
    }

    return `<div class="student-booklet-package" data-student-code="${pllHtml(student.code || student.id || '')}">
        <!-- TỜ 1 (MẶT NGOÀI): Trang 4 bên trái, Trang 1 bên phải -->
        <div class="booklet-spread sheet-outer">
            <div class="booklet-half half-left">
                ${page4Html}
            </div>
            <div class="booklet-center-fold" title="Đường gấp gáy sổ"></div>
            <div class="booklet-half half-right">
                ${page1Html}
            </div>
        </div>

        <!-- TỜ 2 (MẶT TRONG): Trang 2 bên trái, Trang 3 bên phải -->
        <div class="booklet-spread sheet-inner">
            <div class="booklet-half half-left">
                ${page2Html}
            </div>
            <div class="booklet-center-fold" title="Đường gấp gáy sổ"></div>
            <div class="booklet-half half-right">
                ${page3Html}
            </div>
        </div>
    </div>`;
}

// ══════════════════════════════════════════════════════════════════════════════
// HTML DOCUMENT ĐẦY ĐỦ CHO PRINT & PREVIEW
// ══════════════════════════════════════════════════════════════════════════════
function pllBuildHtml(student, hocba, mode) {
    const meta = pllModeMeta(mode);
    const bookletBody = pllBuildStudentBooklet(student, hocba, mode, false);

    return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<title>Phiếu liên lạc — ${pllHtml(student.name || 'Học sinh')} (${pllHtml(meta.label)})</title>
<style id="dynamic-page-size">
@page { size: A4 landscape; margin: 5mm 6mm; }
</style>
<style>
/* ── Reset & Typography với biến kích thước toàn phiếu ── */
:root {
    --pll-base-size: 13px;
    --pll-table-size: 13.5px;
    --pll-comment-size: 13px;
    --pll-sig-size: 13px;
    --pll-line-height: 1.32;

    /* Trang 2 (Môn học): Chữ to rõ, không dãn dòng, đệm cân đối */
    --pll-p2-name-size: 14px;
    --pll-p2-level-size: 14.5px;
    --pll-p2-score-size: 14.5px;
    --pll-p2-comment-size: 13.5px;
    --pll-p2-th-size: 13.5px;
    --pll-p2-cell-pad: 4.5px 5.5px;
    --pll-p2-th-pad: 4px 4px;

    /* Trang 3 (Năng lực & Phẩm chất): Chữ to, vừa vặn 100% trang A5, không bị che */
    --pll-p3-name-size: 13px;
    --pll-p3-level-size: 13.8px;
    --pll-p3-comment-size: 12.6px;
    --pll-p3-th-size: 12.8px;
    --pll-p3-heading-size: 13px;
    --pll-p3-sub-size: 12.2px;
    --pll-p3-cell-pad: 2.4px 4.5px;
    --pll-p3-th-pad: 2.5px 4px;
}

* { box-sizing: border-box; }
html, body {
    margin: 0;
    padding: 0;
    color: #1e293b;
    background: #f1f5f9;
    font-family: "Times New Roman", Times, "Segoe UI", serif;
    font-size: var(--pll-base-size, 13px);
    line-height: var(--pll-line-height, 1.35);
    -webkit-font-smoothing: antialiased;
}

/* ── Toolbar điều khiển trên màn hình (Ẩn hoàn toàn khi in) ── */
.pll-top-toolbar {
    position: sticky;
    top: 0;
    z-index: 9999;
    background: #ffffff;
    border-bottom: 2px solid #cbd5e1;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    padding: 10px 16px;
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}
.toolbar-inner {
    max-width: 1280px;
    margin: 0 auto;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
    justify-content: space-between;
}
.toolbar-group {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
}
.btn-print-main {
    background: linear-gradient(135deg, #1d4ed8, #2563eb);
    color: #ffffff;
    border: none;
    border-radius: 6px;
    padding: 8px 18px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    box-shadow: 0 2px 6px rgba(37,99,235,0.3);
    transition: all 0.15s ease;
}
.btn-print-main:hover {
    background: #1e40af;
    transform: translateY(-1px);
    box-shadow: 0 4px 10px rgba(37,99,235,0.4);
}
.btn-tool {
    background: #f8fafc;
    border: 1px solid #cbd5e1;
    color: #334155;
    border-radius: 6px;
    padding: 6px 11px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    transition: all 0.15s ease;
}
.btn-tool:hover {
    background: #e2e8f0;
    color: #0f172a;
}
.btn-tool.active {
    background: #e0e7ff;
    border-color: #6366f1;
    color: #4338ca;
}
.btn-tool-sm {
    padding: 5px 9px;
    font-size: 13px;
    font-weight: 700;
    min-width: 32px;
    text-align: center;
}
.font-select {
    padding: 5px 8px;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    font-size: 12.5px;
    background: #fff;
    color: #1e293b;
    font-weight: 600;
}
.toolbar-tip {
    width: 100%;
    margin-top: 6px;
    font-size: 12px;
    color: #334155;
    background: #eff6ff;
    padding: 6px 12px;
    border-radius: 6px;
    border-left: 3px solid #3b82f6;
    display: flex;
    align-items: center;
    gap: 6px;
}

/* ── Container chứa các trang in ── */
.booklet-container {
    max-width: 297mm;
    margin: 16px auto 40px;
    padding: 0 10px;
}

/* ── Mỗi tờ A4 Ngang gồm 2 trang A5 cạnh nhau ── */
.booklet-spread {
    width: 285mm;
    height: 198mm;
    max-height: 198mm;
    margin: 0 auto 20px;
    background: #ffffff;
    box-shadow: 0 8px 24px rgba(0,0,0,0.1);
    border-radius: 4px;
    display: grid;
    grid-template-columns: 1fr 2px 1fr;
    box-sizing: border-box;
    overflow: hidden;
    position: relative;
    page-break-after: always;
    page-break-inside: avoid;
}

.booklet-half {
    height: 100%;
    overflow: visible;
    box-sizing: border-box;
    padding: 3.8mm 5mm;
    display: flex;
    flex-direction: column;
}

.booklet-center-fold {
    background: transparent;
    border-left: 1px dashed #cbd5e1;
    height: 100%;
    position: relative;
}
.booklet-center-fold::after {
    content: "✂ nếp gấp";
    position: absolute;
    top: 50%;
    left: -20px;
    transform: rotate(-90deg) translateY(-50%);
    font-size: 9px;
    color: #94a3b8;
    letter-spacing: 1px;
    background: #fff;
    padding: 0 4px;
    white-space: nowrap;
}

/* ── Nội dung từng trang A5 ── */
.booklet-page {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    box-sizing: border-box;
}
.page-content-wrapper {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
}

/* ── Mặt 1: Khung Bìa trước ── */
.cover-frame {
    border: 3px double #1e3a8a;
    border-radius: 6px;
    padding: 8px;
    height: 100%;
    box-sizing: border-box;
}
.cover-inner-border {
    border: 1px solid #3b82f6;
    border-radius: 4px;
    padding: 14px 16px;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    box-sizing: border-box;
    background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
}
.cover-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    border-bottom: 2px solid #1e3a8a;
    padding-bottom: 8px;
}
.cover-org-info {
    text-align: left;
    line-height: 1.4;
}
.org-line1 { font-size: 11.5px; font-weight: 700; color: #334155; }
.org-line2 { font-size: 13px; font-weight: 800; color: #1e3a8a; text-transform: uppercase; }
.org-line3 { font-size: 12px; font-weight: 800; color: #ea580c; letter-spacing: 0.5px; }
.cover-logo-box {
    text-align: center;
    flex-shrink: 0;
}
.school-logo-img {
    height: 68px;
    width: auto;
    object-fit: contain;
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.12));
}

.cover-title-group {
    text-align: center;
    margin: 10px 0 4px;
}
.main-title {
    font-size: 25px;
    font-weight: 900;
    color: #1e3a8a;
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 1.5px;
}
.sub-title {
    font-size: 15px;
    font-weight: 800;
    color: #b91c1c;
    margin: 5px 0 2px;
    text-transform: uppercase;
}
.school-year {
    font-size: 14px;
    font-weight: 700;
    color: #1e293b;
}
.cover-divider {
    text-align: center;
    color: #3b82f6;
    font-size: 12px;
    letter-spacing: 5px;
    margin: 4px 0;
}

.cover-student-card {
    background: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    padding: 16px 18px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    margin: 8px 0;
}
.student-info-row {
    display: flex;
    align-items: baseline;
    margin-bottom: 8px;
    gap: 10px;
}
.student-info-row:last-child { margin-bottom: 0; }
.fullname-row {
    border-bottom: 1.5px dashed #cbd5e1;
    padding-bottom: 8px;
    margin-bottom: 10px;
}
.info-label {
    font-weight: 700;
    color: #334155;
    white-space: nowrap;
    min-width: 130px;
    font-size: calc(var(--pll-base-size, 13px) + 0.5px);
}
.info-value {
    color: #0f172a;
    flex: 1;
    font-size: calc(var(--pll-base-size, 13px) + 0.5px);
}
.info-value.bold { font-weight: 700; }
.student-name-big {
    font-size: calc(var(--pll-base-size, 13px) + 5.5px);
    font-weight: 900;
    color: #1e3a8a;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}
.student-info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
}

/* ── Bố cục Trang 2 & Trang 3: Chữ to rõ ràng, không dãn dòng thừa, không che nội dung ── */
.fill-page-layout {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    box-sizing: border-box;
    overflow: visible;
}

.page-table-fill-box {
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    overflow: visible;
}

/* Trang 2: Bảng môn học - Chiều cao tự nhiên, chữ to rõ nét */
.page2-table-fill {
    margin-bottom: 2px;
}
.table-fill-page {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    margin-bottom: 0;
    height: auto;
}
.table-fill-page th {
    height: 28px;
    background: #e2e8f0;
    color: #0f172a;
    font-weight: 800;
    text-align: center;
    line-height: 1.25;
    font-size: var(--pll-p2-th-size, 13.5px);
    padding: var(--pll-p2-th-pad, 4px 4px);
    border: 1px solid #334155;
    box-sizing: border-box;
}
.table-fill-page td {
    padding: var(--pll-p2-cell-pad, 4.5px 5.5px);
    vertical-align: middle;
    border: 1px solid #334155;
    box-sizing: border-box;
}
.subject-table .pll-name {
    font-size: var(--pll-p2-name-size, 14px);
    font-weight: 700;
    color: #0f172a;
    text-align: left;
    padding-left: 6px;
}
.subject-table .pll-level {
    font-size: var(--pll-p2-level-size, 14.5px);
    font-weight: 800;
    color: #1e3a8a;
    text-align: center;
}
.subject-table .pll-score {
    font-size: var(--pll-p2-score-size, 14.5px);
    font-weight: 800;
    color: #1e3a8a;
    text-align: center;
}
.subject-table .pll-comment {
    font-size: var(--pll-p2-comment-size, 13.5px);
    line-height: 1.28;
    color: #1e293b;
    text-align: left;
    word-break: break-word;
}

/* Trang 3: 3 khối Phẩm chất & Năng lực - Cân đối, chữ to, vừa khít tuyệt đối */
.page3-traits-fill {
    display: flex;
    flex-direction: column;
    gap: 2px;
    overflow: visible;
}
.trait-section-block {
    display: flex;
    flex-direction: column;
}
.trait-section-block table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    margin-bottom: 0;
    height: auto;
}
.trait-section-block table th {
    height: 22px;
    padding: var(--pll-p3-th-pad, 2.5px 4px);
    font-size: var(--pll-p3-th-size, 12.8px);
    background: #e2e8f0;
    color: #0f172a;
    font-weight: 800;
    text-align: center;
    line-height: 1.2;
    border: 1px solid #334155;
    box-sizing: border-box;
}
.trait-section-block table td {
    padding: var(--pll-p3-cell-pad, 2.4px 4.5px);
    vertical-align: middle;
    border: 1px solid #334155;
    box-sizing: border-box;
}
.trait-table .pll-name {
    font-size: var(--pll-p3-name-size, 13px);
    font-weight: 700;
    color: #0f172a;
    text-align: left;
    padding-left: 6px;
}
.trait-table .pll-level {
    font-size: var(--pll-p3-level-size, 13.8px);
    font-weight: 800;
    color: #1e3a8a;
    text-align: center;
}
.trait-table .pll-comment {
    font-size: var(--pll-p3-comment-size, 12.6px);
    line-height: 1.24;
    color: #1e293b;
    text-align: left;
    word-break: break-word;
}
.section-heading-compact {
    font-size: var(--pll-p3-heading-size, 13px);
    font-weight: 800;
    color: #1e3a8a;
    text-transform: uppercase;
    margin: 1.5px 0 1px;
    padding-bottom: 1px;
}
.sub-title-compact {
    font-size: var(--pll-p3-sub-size, 12.2px);
    margin: 1px 0 0.5px;
    color: #1e3a8a;
    font-weight: 700;
}

/* ── Trang 2 & Trang 3 Header & Bảng ── */
.page-header-mini {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1.5px solid #1e3a8a;
    padding-bottom: 3px;
    margin-bottom: 3px;
    font-size: calc(var(--pll-base-size, 13px) - 1.5px);
    flex-shrink: 0;
}
.student-mini-name b { color: #1e3a8a; }
.mode-mini-tag {
    background: #e0f2fe;
    color: #0369a1;
    font-weight: 700;
    padding: 1px 8px;
    border-radius: 8px;
}

.section-heading {
    font-size: calc(var(--pll-base-size, 13px) + 0.5px);
    font-weight: 800;
    color: #1e3a8a;
    text-transform: uppercase;
    margin: 2px 0 2px;
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
}
.sub-section-title {
    font-size: var(--pll-base-size, 13px);
    font-weight: 700;
    color: #0f172a;
    margin: 2px 0 1px;
    flex-shrink: 0;
}

table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    margin-bottom: 3px;
    font-size: var(--pll-table-size, 12.5px);
}
th, td {
    border: 1px solid #334155;
    padding: var(--pll-cell-pad-v, 3.2px) var(--pll-cell-pad-h, 4.5px);
    vertical-align: middle;
    box-sizing: border-box;
}
th {
    background: #e2e8f0;
    color: #0f172a;
    font-weight: 800;
    text-align: center;
    line-height: 1.2;
    font-size: calc(var(--pll-table-size, 12.5px) + 0.2px);
}
.pll-name {
    font-weight: 700;
    text-align: left;
    padding-left: 6px;
    color: #0f172a;
}
.pll-level, .pll-score {
    text-align: center;
    font-weight: 800;
    color: #1e3a8a;
}
.pll-score.score-disabled {
    color: #94a3b8;
    background: #f8fafc;
}
.pll-comment {
    text-align: left;
    line-height: 1.28;
    color: #1e293b;
    word-break: break-word;
    font-size: var(--pll-comment-size, 12px);
}
.pll-comment.comment-long {
    font-size: calc(var(--pll-comment-size, 12px) - 1.2px);
    line-height: 1.18;
}
.pll-comment.comment-medium {
    font-size: calc(var(--pll-comment-size, 12px) - 0.6px);
    line-height: 1.22;
}

/* ── Tự thu gọn bảng khi nội dung quá dài (chỉ co đệm và dãn dòng, giữ nguyên cỡ chữ to) ── */
.table-compact th, .table-compact td {
    padding-top: 1.2px !important;
    padding-bottom: 1.2px !important;
}
.comment-compact {
    line-height: 1.18 !important;
}

.page-bottom-legend {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: calc(var(--pll-base-size, 13px) - 2.5px);
    color: #64748b;
    border-top: 1px dotted #cbd5e1;
    padding-top: 3px;
    margin-top: 2px;
    flex-shrink: 0;
}
.page-num-indicator {
    font-weight: 700;
    color: #1e3a8a;
    background: #f1f5f9;
    padding: 1px 6px;
    border-radius: 4px;
}
.page-footer-tag {
    text-align: right;
    font-size: 10px;
    color: #94a3b8;
    font-weight: 600;
    margin-top: 3px;
    flex-shrink: 0;
}

/* ── Mặt 4: Nhận xét Giáo viên & Chữ ký ── */
.back-cover-frame {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
}
.section-heading-center {
    font-size: calc(var(--pll-base-size, 13px) + 0.8px);
    font-weight: 800;
    color: #1e3a8a;
    text-transform: uppercase;
    text-align: center;
    border-bottom: 2px solid #1e3a8a;
    padding-bottom: 4px;
    margin-bottom: 5px;
}

.teacher-comment-card, .parent-feedback-card {
    border: 1px solid #334155;
    border-radius: 5px;
    margin-bottom: 5px;
    background: #ffffff;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}
.teacher-comment-card {
    flex: 1;
    min-height: 72mm;
    max-height: 88mm;
}
.parent-feedback-card {
    min-height: 22mm;
    max-height: 26mm;
    flex-shrink: 0;
}
.card-title-bar {
    background: #f1f5f9;
    border-bottom: 1px solid #cbd5e1;
    padding: 3px 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}
.card-title-text {
    font-size: calc(var(--pll-base-size, 13px) - 1.2px);
    font-weight: 800;
    color: #1e3a8a;
}
.eval-pill {
    background: #1e3a8a;
    color: #ffffff;
    font-size: 10.5px;
    font-weight: 700;
    padding: 1px 7px;
    border-radius: 10px;
}
.award-line {
    padding: 3px 8px;
    font-size: calc(var(--pll-base-size, 13px) - 1px);
    color: #b45309;
    background: #fef3c7;
    border-bottom: 1px dashed #fcd34d;
}

/* ── KHUNG CHỨA NHẬN XÉT TỰ CO DÃN ── */
.comment-scroll-box {
    padding: 6px 8px;
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    position: relative;
    box-sizing: border-box;
}
.teacher-comment-text {
    color: #0f172a;
    white-space: pre-wrap;
    text-align: justify;
    line-height: 1.45;
    font-size: calc(var(--pll-base-size, 13px) + 0.5px);
    transition: font-size 0.1s ease;
}

.teacher-comment-text.size-normal { font-size: calc(var(--pll-base-size, 13px) + 0.5px); line-height: 1.45; }
.teacher-comment-text.size-md     { font-size: var(--pll-base-size, 13px); line-height: 1.35; }
.teacher-comment-text.size-sm     { font-size: calc(var(--pll-base-size, 13px) - 1.2px); line-height: 1.25; }
.teacher-comment-text.size-xs     { font-size: calc(var(--pll-base-size, 13px) - 2.2px);  line-height: 1.20; }

.dotted-write-lines, .parent-dotted-lines {
    padding: 6px 8px;
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    height: 100%;
}
.dot-line {
    border-bottom: 1px dotted #64748b;
    height: 14px;
    width: 100%;
}

/* ── Khung chữ ký chuẩn thể thức, cân xứng, thẩm mỹ ── */
.signatures-container {
    margin-top: 4px;
    padding-top: 2px;
    flex-shrink: 0;
}
.sig-date-header {
    text-align: right;
    font-style: italic;
    font-size: calc(var(--pll-sig-size, 12.5px) - 0.5px);
    color: #334155;
    margin-bottom: 4px;
    padding-right: 14px;
}
.signatures-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    text-align: center;
    gap: 8px;
}
.sig-column {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
}
.sig-role {
    font-size: var(--pll-sig-size, 12.5px);
    font-weight: 800;
    color: #1e3a8a;
    line-height: 1.25;
    white-space: nowrap;
    text-transform: uppercase;
}
.sig-guide {
    font-size: calc(var(--pll-sig-size, 12.5px) - 2px);
    font-style: italic;
    color: #64748b;
    margin-top: 2px;
    white-space: nowrap;
}
.sig-space {
    height: 19mm;
    min-height: 19mm;
    width: 100%;
}
.sig-name-line {
    font-size: calc(var(--pll-sig-size, 12.5px) + 0.5px);
    color: #0f172a;
    min-height: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    width: 100%;
}
.sig-name-line.bold {
    font-size: calc(var(--pll-sig-size, 12.5px) + 1px);
    font-weight: 800;
    color: #1e3a8a;
    letter-spacing: 0.3px;
}
.sig-name-empty {
    visibility: hidden;
}

/* ── Chế độ hiển thị 4 trang tuần tự (A5 đứng) khi người dùng chọn ── */
body.layout-sequential .booklet-spread {
    display: block !important;
    width: 148mm !important;
    height: 205mm !important;
    max-height: 205mm !important;
    margin: 10px auto !important;
    box-shadow: 0 4px 16px rgba(0,0,0,0.1) !important;
    page-break-after: always !important;
}
body.layout-sequential .booklet-half {
    width: 100% !important;
    height: 100% !important;
    padding: 5.5mm 6.5mm !important;
}
body.layout-sequential .booklet-center-fold {
    display: none !important;
}

/* ══════════════════════════════════════════════════════════════════════════════
   MEDIA PRINT — QUY CHUẨN XUẤT MÁY IN VÀ FILE PDF: CHỮ NỘI DUNG LỚN RÕ NÉT
   ══════════════════════════════════════════════════════════════════════════════ */
@media print {
    .no-print, .pll-top-toolbar {
        display: none !important;
    }
    body {
        background: #ffffff !important;
        margin: 0 !important;
        padding: 0 !important;
        color: #000000 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
    }
    .booklet-container {
        max-width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
    }
    .booklet-spread {
        width: 100% !important;
        height: 198mm !important;
        max-height: 198mm !important;
        margin: 0 !important;
        box-shadow: none !important;
        border-radius: 0 !important;
        page-break-after: always !important;
        page-break-inside: avoid !important;
        border: none !important;
    }
    .booklet-center-fold {
        border-left: 0.5pt dashed #94a3b8 !important;
    }
    .booklet-center-fold::after {
        display: none !important;
    }
    table {
        border: 1pt solid #000000 !important;
    }
    th, td {
        border: 0.8pt solid #000000 !important;
        color: #000000 !important;
    }
    th {
        background: #f1f5f9 !important;
        font-weight: 800 !important;
        color: #000000 !important;
    }
    .pll-score, .pll-level {
        color: #000000 !important;
        font-weight: 800 !important;
    }
    .pll-name {
        color: #000000 !important;
        font-weight: 700 !important;
    }
    .pll-comment {
        color: #000000 !important;
    }
    .student-name-big {
        color: #000000 !important;
        font-weight: 900 !important;
    }
    .sig-role {
        color: #000000 !important;
        font-weight: 800 !important;
    }
    .sig-name-line.bold {
        color: #000000 !important;
        font-weight: 800 !important;
        font-size: calc(var(--pll-sig-size, 12.5px) + 1.2px) !important;
    }
    .card-title-text, .section-heading, .section-heading-center {
        color: #000000 !important;
        border-bottom-color: #000000 !important;
    }
    .cover-frame {
        border: 2.5pt double #1e3a8a !important;
    }
    .cover-inner-border {
        border: 1pt solid #3b82f6 !important;
        background: #ffffff !important;
    }
    .booklet-half {
        padding: 3.5mm 5mm !important;
        overflow: visible !important;
    }
    .fill-page-layout {
        height: 100% !important;
        overflow: visible !important;
        justify-content: space-between !important;
    }
    .page-table-fill-box {
        flex: initial !important;
        height: auto !important;
        overflow: visible !important;
    }
    .table-fill-page, .trait-section-block table {
        height: auto !important;
    }
    .table-fill-page tbody tr, .trait-section-block table tbody tr {
        height: auto !important;
    }
    .table-fill-page td, .trait-section-block table td {
        color: #000000 !important;
    }
    .subject-table .pll-name, .trait-table .pll-name {
        color: #000000 !important;
        font-weight: 700 !important;
    }
    .subject-table .pll-level, .subject-table .pll-score,
    .trait-table .pll-level {
        color: #000000 !important;
        font-weight: 800 !important;
    }
    .subject-table .pll-comment, .trait-table .pll-comment {
        color: #000000 !important;
    }
}
</style>
</head>
<body class="layout-booklet">

<!-- THANH CÔNG CỤ XEM TRƯỚC VÀ IN -->
<div class="no-print pll-top-toolbar">
    <div class="toolbar-inner">
        <div class="toolbar-group">
            <button class="btn-print-main" onclick="window.print()">
                <i class="fas fa-print"></i> 🖨️ In Phiếu / Lưu PDF (Ctrl + P)
            </button>
            <div style="height:24px;width:1px;background:#cbd5e1;margin:0 4px"></div>
            <span style="font-size:13px;font-weight:700;color:#334155">Bố cục:</span>
            <button id="btn-mode-booklet" class="btn-tool active" onclick="pllSetLayout('booklet')">
                📖 Booklet (A4 Ngang gấp đôi)
            </button>
            <button id="btn-mode-seq" class="btn-tool" onclick="pllSetLayout('sequential')">
                📄 4 Trang tuần tự (A5 đứng)
            </button>
        </div>

        <div class="toolbar-group">
            <span style="font-size:13px;font-weight:800;color:#1e40af">
                🔍 Cỡ chữ phiếu:
            </span>
            <button class="btn-tool btn-tool-sm" onclick="pllAdjustContentFont(-0.5)" title="Giảm cỡ chữ toàn bộ phiếu (A-)">
                A-
            </button>
            <button class="btn-tool btn-tool-sm" onclick="pllAdjustContentFont(0.5)" title="Tăng cỡ chữ toàn bộ phiếu (A+)">
                A+
            </button>
            <select id="sel-content-font-size" class="font-select" onchange="pllSetContentFontSize(this.value)">
                <option value="12">12px (Vừa)</option>
                <option value="13" selected>13px (Lớn chuẩn — Khuyên dùng)</option>
                <option value="14">14px (Rất lớn — Dễ đọc)</option>
                <option value="15">15px (Cực lớn)</option>
            </select>
            <div style="height:24px;width:1px;background:#cbd5e1;margin:0 4px"></div>
            <span style="font-size:13px;font-weight:700;color:#334155">Nhận xét:</span>
            <button id="btn-autofit" class="btn-tool active" onclick="pllToggleAutoFit()" title="Tự động thu nhỏ chữ khi nhận xét dài để vừa khít trang">
                ⚡ Tự co dãn: BẬT
            </button>
            <button class="btn-tool btn-tool-sm" onclick="pllAdjustFont(-0.5)" title="Giảm riêng cỡ chữ ô nhận xét GVCN (A-)">A-</button>
            <button class="btn-tool btn-tool-sm" onclick="pllAdjustFont(0.5)" title="Tăng riêng cỡ chữ ô nhận xét GVCN (A+)">A+</button>
            <div style="height:24px;width:1px;background:#cbd5e1;margin:0 4px"></div>
            <button class="btn-tool" onclick="pllPromptChangeTeacher()" title="Đổi tên GVCN hiển thị trên phiếu này nếu cần">
                ✏️ Đổi tên GVCN
            </button>
        </div>

        <div class="toolbar-tip">
            <span>💡 <b>Mẹo in Booklet hoàn hảo:</b> Chữ nội dung và bảng biểu đã được tăng lớn rõ nét khi in. Trong hộp thoại In (Ctrl + P), chọn <b>Khổ giấy A4</b>, <b>Hướng Ngang (Landscape)</b>, bật <b>In 2 mặt</b> và chọn <b>"Lật theo cạnh ngắn" (Flip on short edge)</b>. Gấp đôi theo nếp gáy thành cuốn sổ A5 tuyệt đẹp!</span>
        </div>
    </div>
</div>

<!-- NỘI DUNG PHIẾU LIÊN LẠC -->
<div class="booklet-container" id="booklet-root">
    ${bookletBody}
</div>

<!-- SCRIPT TỰ ĐỘNG CO DÃN & ĐIỀU KHIỂN XEM TRƯỚC -->
<script>
var pllAutoFitActive = true;
var pllCurrentBaseFont = parseFloat(localStorage.getItem('pll_pref_font_size') || '13') || 13;

// 1. Hàm thiết lập cỡ chữ toàn phiếu và tối ưu lề bảng
function pllSetContentFontSize(sizeVal) {
    var size = parseFloat(sizeVal);
    if (!size || isNaN(size)) size = 13;
    size = Math.max(11, Math.min(16, size));
    pllCurrentBaseFont = size;
    try {
        localStorage.setItem('pll_pref_font_size', String(size));
    } catch (e) {}

    var sel = document.getElementById('sel-content-font-size');
    if (sel) {
        var hasMatch = false;
        for (var i = 0; i < sel.options.length; i++) {
            if (parseFloat(sel.options[i].value) === size) {
                sel.selectedIndex = i;
                hasMatch = true;
                break;
            }
        }
        if (!hasMatch) {
            var newOpt = document.createElement('option');
            newOpt.value = String(size);
            newOpt.textContent = size.toFixed(1) + 'px';
            sel.appendChild(newOpt);
            sel.value = String(size);
        }
    }

    var root = document.documentElement;
    root.style.setProperty('--pll-base-size', size + 'px');
    root.style.setProperty('--pll-sig-size', (size - 0.5) + 'px');

    // Tinh chỉnh độc lập cỡ chữ & padding cho Trang 2 và Trang 3:
    // Chữ to rõ ràng, không dãn dòng thừa, không che/cắt nội dung
    var diff = size - 13; // Độ lệch so với cỡ chuẩn 13px

    // Trang 2: Môn học (11-12 môn, chữ to nổi bật, đệm cân đối thanh lịch)
    var p2Name = 14.0 + diff * 1.0;
    var p2Score = 14.5 + diff * 1.0;
    var p2Comment = 13.5 + diff * 0.9;
    var p2Th = 13.5 + diff * 0.8;
    var p2PadV = Math.max(2.5, 4.5 - diff * 0.8);
    var p2PadH = Math.max(3.5, 5.5 - diff * 0.5);

    root.style.setProperty('--pll-p2-name-size', p2Name.toFixed(1) + 'px');
    root.style.setProperty('--pll-p2-level-size', p2Score.toFixed(1) + 'px');
    root.style.setProperty('--pll-p2-score-size', p2Score.toFixed(1) + 'px');
    root.style.setProperty('--pll-p2-comment-size', p2Comment.toFixed(1) + 'px');
    root.style.setProperty('--pll-p2-th-size', p2Th.toFixed(1) + 'px');
    root.style.setProperty('--pll-p2-cell-pad', p2PadV.toFixed(1) + 'px ' + p2PadH.toFixed(1) + 'px');

    // Trang 3: Năng lực phẩm chất (16 dòng tiêu chí + tiêu đề nhóm)
    // Tăng chữ to nhưng tự động thu gọn padding ô để vừa khít 100% trang A5, tuyệt đối không bị che
    var p3Name = 13.0 + diff * 0.7;
    var p3Level = 13.8 + diff * 0.8;
    var p3Comment = 12.6 + diff * 0.7;
    var p3Th = 12.8 + diff * 0.6;
    var p3Heading = 13.0 + diff * 0.5;
    var p3Sub = 12.2 + diff * 0.5;
    var p3PadV = Math.max(1.2, 2.4 - diff * 0.6);
    var p3PadH = Math.max(3.0, 4.5 - diff * 0.5);

    root.style.setProperty('--pll-p3-name-size', p3Name.toFixed(1) + 'px');
    root.style.setProperty('--pll-p3-level-size', p3Level.toFixed(1) + 'px');
    root.style.setProperty('--pll-p3-comment-size', p3Comment.toFixed(1) + 'px');
    root.style.setProperty('--pll-p3-th-size', p3Th.toFixed(1) + 'px');
    root.style.setProperty('--pll-p3-heading-size', p3Heading.toFixed(1) + 'px');
    root.style.setProperty('--pll-p3-sub-size', p3Sub.toFixed(1) + 'px');
    root.style.setProperty('--pll-p3-cell-pad', p3PadV.toFixed(1) + 'px ' + p3PadH.toFixed(1) + 'px');

    setTimeout(pllRunAutoFit, 50);
}

// 2. Tăng / Giảm cỡ chữ toàn phiếu bằng nút A+ / A-
function pllAdjustContentFont(delta) {
    var next = Math.round((pllCurrentBaseFont + delta) * 10) / 10;
    next = Math.max(11, Math.min(16, next));
    pllSetContentFontSize(next);
}

// 3. Đổi tên GVCN nhanh trên toàn bộ trang in
function pllPromptChangeTeacher() {
    var curEl = document.querySelector('.teacher-name-display');
    var current = curEl ? curEl.textContent.trim() : '';
    if (current.includes('.....')) current = '';
    var newName = prompt('Nhập họ và tên Giáo viên chủ nhiệm để chèn vào phiếu:', current);
    if (newName !== null) {
        newName = newName.trim();
        var val = newName || '................................................';
        document.querySelectorAll('.teacher-name-display').forEach(function(el) {
            el.textContent = val;
        });
    }
}

// 4. Hàm tự động co dãn văn bản nhận xét & kiểm tra vừa khít trang
function pllRunAutoFit() {
    if (!pllAutoFitActive) return;

    // A. Tự co dãn ô nhận xét giáo viên ở Mặt 4
    document.querySelectorAll('.auto-fit-comment').forEach(function(el) {
        var container = el.closest('.comment-section-body') || el.parentElement;
        if (!container) return;

        var targetH = container.clientHeight || 260;
        var size = pllCurrentBaseFont + 0.5;
        var lh = 1.45;
        el.style.fontSize = size + 'px';
        el.style.lineHeight = lh;

        var limit = 25;
        while (el.scrollHeight > targetH && size > 8.0 && limit > 0) {
            size -= 0.3;
            lh = Math.max(1.15, lh - 0.02);
            el.style.fontSize = size.toFixed(1) + 'px';
            el.style.lineHeight = lh.toFixed(2);
            limit--;
        }
    });

    // B. Tự thu gọn khoảng cách bảng ở Mặt 2 và Mặt 3 nếu các dòng quá dài
    document.querySelectorAll('.booklet-page').forEach(function(page) {
        var maxH = page.clientHeight || 730;
        if (page.scrollHeight > maxH + 4) {
            page.querySelectorAll('table').forEach(function(tbl) {
                tbl.classList.add('table-compact');
            });
            page.querySelectorAll('.pll-comment').forEach(function(td) {
                td.classList.add('comment-compact');
            });
        } else if (page.scrollHeight <= maxH - 6) {
            page.querySelectorAll('table').forEach(function(tbl) {
                tbl.classList.remove('table-compact');
            });
            page.querySelectorAll('.pll-comment').forEach(function(td) {
                td.classList.remove('comment-compact');
            });
        }
    });
}

// 5. Chuyển đổi giữa chế độ Booklet và 4 Trang A5
function pllSetLayout(mode) {
    var body = document.body;
    var btnBooklet = document.getElementById('btn-mode-booklet');
    var btnSeq = document.getElementById('btn-mode-seq');
    var styleEl = document.getElementById('dynamic-page-size');

    if (mode === 'sequential') {
        body.classList.remove('layout-booklet');
        body.classList.add('layout-sequential');
        if (btnSeq) btnSeq.classList.add('active');
        if (btnBooklet) btnBooklet.classList.remove('active');
        if (styleEl) styleEl.textContent = '@page { size: A5 portrait; margin: 5mm; }';
    } else {
        body.classList.remove('layout-sequential');
        body.classList.add('layout-booklet');
        if (btnBooklet) btnBooklet.classList.add('active');
        if (btnSeq) btnSeq.classList.remove('active');
        if (styleEl) styleEl.textContent = '@page { size: A4 landscape; margin: 5mm 6mm; }';
    }
    setTimeout(pllRunAutoFit, 100);
}

// 6. Bật / Tắt Tự động co dãn
function pllToggleAutoFit() {
    pllAutoFitActive = !pllAutoFitActive;
    var btn = document.getElementById('btn-autofit');
    if (btn) {
        btn.textContent = pllAutoFitActive ? '⚡ Tự co dãn: BẬT' : '⚡ Tự co dãn: TẮT';
        btn.classList.toggle('active', pllAutoFitActive);
    }
    if (pllAutoFitActive) {
        pllRunAutoFit();
    }
}

// 7. Tăng / Giảm cỡ chữ ô nhận xét thủ công
function pllAdjustFont(delta) {
    document.querySelectorAll('.auto-fit-comment').forEach(function(el) {
        var current = parseFloat(window.getComputedStyle(el).fontSize) || 12;
        var next = Math.max(7.5, Math.min(16, current + delta));
        el.style.fontSize = next.toFixed(1) + 'px';
        el.style.lineHeight = '1.3';
    });
}

// 8. Chọn cỡ chữ trực tiếp từ dropdown nhận xét
function pllChangeFontSize(val) {
    if (val === 'auto') {
        pllAutoFitActive = true;
        var btn = document.getElementById('btn-autofit');
        if (btn) {
            btn.textContent = '⚡ Tự co dãn: BẬT';
            btn.classList.add('active');
        }
        pllRunAutoFit();
        return;
    }
    document.querySelectorAll('.auto-fit-comment').forEach(function(el) {
        el.style.fontSize = val + 'px';
        el.style.lineHeight = '1.3';
    });
}

window.addEventListener('DOMContentLoaded', function() {
    pllSetContentFontSize(pllCurrentBaseFont);
});
window.addEventListener('load', function() {
    setTimeout(function() {
        pllSetContentFontSize(pllCurrentBaseFont);
    }, 80);
});
window.addEventListener('resize', function() {
    clearTimeout(window._pllResizeTimer);
    window._pllResizeTimer = setTimeout(pllRunAutoFit, 150);
});
</script>
</body>
</html>`;
}

// ══════════════════════════════════════════════════════════════════════════════
// CÁC HÀM XUẤT VÀ TƯƠNG TÁC NGƯỜI DÙNG
// ══════════════════════════════════════════════════════════════════════════════

async function pllOpenPrint(studentKey, mode) {
    if (!pllCanAccessStudent(studentKey)) return Swal.fire('Không có quyền', 'Bạn không được xem phiếu của học sinh này.', 'warning');
    const student = window.localData?.students?.[studentKey];
    if (!student) return Swal.fire('Không tìm thấy', 'Không tìm thấy học sinh.', 'warning');
    await pllEnsureTeachersLoaded();
    const hocba = await pllReadHocBa(student);
    const html = pllBuildHtml({ ...student, _key: studentKey }, hocba, mode);
    const w = window.open('', '_blank');
    if (!w) return Swal.fire('Trình duyệt chặn popup', 'Vui lòng cho phép popup để in phiếu liên lạc.', 'warning');
    w.document.open();
    w.document.write(html);
    w.document.close();
}

async function pllDownloadWord(studentKey, mode) {
    if (!pllCanAccessStudent(studentKey)) return Swal.fire('Không có quyền', 'Bạn không được tải phiếu của học sinh này.', 'warning');
    const student = window.localData?.students?.[studentKey];
    if (!student) return Swal.fire('Không tìm thấy', 'Không tìm thấy học sinh.', 'warning');
    await pllEnsureTeachersLoaded();
    const hocba = await pllReadHocBa(student);
    const meta = pllModeMeta(mode);

    const wordContent = pllBuildStudentBooklet({ ...student, _key: studentKey }, hocba, mode, true);

    const wordHtml = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<title>Phiếu liên lạc ${pllHtml(student.name || '')}</title>
<!--[if gte mso 9]>
<xml>
<w:WordDocument>
<w:View>Print</w:View>
<w:Zoom>100</w:Zoom>
<w:DoNotOptimizeForBrowser/>
</w:WordDocument>
</xml>
<![endif]-->
<style>
@page Section1 {
    size: 210mm 297mm;
    margin: 15mm 15mm 15mm 15mm;
    mso-header-margin: 10mm;
    mso-footer-margin: 10mm;
}
div.Section1 { page: Section1; }
body { font-family: "Times New Roman", Times, serif; font-size: 13pt; color: #000; line-height: 1.35; }
table { width: 100%; border-collapse: collapse; margin-bottom: 8pt; }
th, td { border: 1pt solid #000; padding: 4pt 6pt; }
th { background: #e2e8f0; font-weight: bold; text-align: center; }
.school-logo-img { height: 60pt; }
.main-title { font-size: 20pt; font-weight: bold; text-align: center; }
.sub-title { font-size: 14pt; font-weight: bold; text-align: center; }
.bold { font-weight: bold; }
</style>
</head>
<body>
<div class="Section1">
${wordContent}
</div>
</body>
</html>`;

    const blob = new Blob(['\ufeff', wordHtml], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${pllFileName(student.code || student.id || studentKey)}_${pllFileName(student.name || 'hoc_sinh')}_${meta.isMid ? 'PLL_GK' : 'PLL_CK'}_Booklet.doc`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
}

async function pllExportClass(mode, format) {
    const students = pllCurrentStudents();
    if (!students.length) return Swal.fire('Chưa có dữ liệu', 'Không có học sinh trong lớp đang chọn.', 'info');
    await pllEnsureTeachersLoaded();

    const meta = pllModeMeta(mode);

    if (format === 'print') {
        Swal.fire({
            title: 'Đang chuẩn bị trang in...',
            text: `Đang kết xuất phiếu liên lạc Booklet cho ${students.length} học sinh...`,
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });

        const booklets = [];
        for (const s of students) {
            const hocba = await pllReadHocBa(s);
            booklets.push(pllBuildStudentBooklet(s, hocba, mode, false));
        }

        Swal.close();

        const combinedBooklets = booklets.join('<div style="page-break-after:always;height:0;overflow:hidden"></div>');

        const fullHtml = pllBuildHtml({ name: `Lớp ${window._pllSelectedClass || 'Toàn trường'}` }, {}, mode)
            .replace(/<div class="booklet-container" id="booklet-root">[\s\S]*?<\/div>\s*<!-- SCRIPT/, `<div class="booklet-container" id="booklet-root">${combinedBooklets}</div>\n<!-- SCRIPT`);

        const w = window.open('', '_blank');
        if (!w) return Swal.fire('Trình duyệt chặn popup', 'Vui lòng cho phép popup để in phiếu liên lạc.', 'warning');
        w.document.open();
        w.document.write(fullHtml);
        w.document.close();
        return;
    }

    for (const s of students) {
        await pllDownloadWord(pllStudentKeyOf(s), mode);
        await new Promise(resolve => setTimeout(resolve, 250));
    }
}

function pllModeSelectHtml() {
    return `<select id="pll-mode" class="form-control" onchange="renderPhieuLienLac()">
        <option value="gk1" ${window._pllMode === 'gk1' ? 'selected' : ''}>Giữa HK1</option>
        <option value="ck1" ${window._pllMode === 'ck1' ? 'selected' : ''}>Cuối HK1</option>
        <option value="gk2" ${window._pllMode === 'gk2' ? 'selected' : ''}>Giữa HK2</option>
        <option value="ck2" ${window._pllMode === 'ck2' || !window._pllMode ? 'selected' : ''}>Cuối HK2</option>
    </select>`;
}

export async function renderPhieuLienLac() {
    if (!['admin', 'teacher'].includes(window.userRole)) {
        const content = document.getElementById('content');
        if (content) content.innerHTML = '<div class="card" style="text-align:center;padding:36px"><i class="fas fa-lock" style="font-size:2rem;color:#dc2626"></i><h3>Không có quyền truy cập</h3><p>Phiếu liên lạc chỉ dành cho Ban giám hiệu/Quản trị và giáo viên chủ nhiệm.</p></div>';
        return;
    }
    await pllEnsureTeachersLoaded();

    if (window.userRole === 'teacher') window._pllSelectedClass = window.teacherClass || '';
    const pageTitle = document.getElementById('page-title');
    if (pageTitle) pageTitle.textContent = 'Phiếu liên lạc';
    document.querySelectorAll('.menu-item').forEach(x => x.classList.remove('active'));
    const pllMenu = document.querySelector('#menu-phieulienlac, [data-view="phieulienlac"]');
    if (pllMenu) pllMenu.classList.add('active');

    window._pllMode = document.getElementById('pll-mode')?.value || window._pllMode || 'ck2';
    window._pllSelectedClass = document.getElementById('pll-class')?.value || window._pllSelectedClass || '';

    const classes = pllClassList();
    const students = pllCurrentStudents();
    const meta = pllModeMeta(window._pllMode);
    const assignedTeacher = window._pllSelectedClass ? pllGetTeacherForClass(window._pllSelectedClass) : '';

    const content = document.getElementById('content');
    if (!content) return;
    content.dataset.view = 'phieulienlac';

    content.innerHTML = `
        <div class="card" style="margin-bottom:16px">
            <div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap">
                <div style="background:#e0e7ff;color:#3730a3;width:48px;height:48px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:1.4rem">
                    <i class="fas fa-book-open"></i>
                </div>
                <div>
                    <h2 style="margin:0;color:#1e293b;display:flex;align-items:center;gap:8px">
                        Phiếu liên lạc Booklet
                        <span class="badge badge-info" style="font-size:0.8rem">${pllHtml(meta.label)} — ${pllHtml(pllYearText())}</span>
                    </h2>
                    <p style="color:#64748b;margin:4px 0 0;font-size:0.9rem">
                        Mẫu in Booklet 4 mặt gập đôi (A4 Ngang ➔ A5): Tự động điền Giáo viên chủ nhiệm đã phân công, có nút tăng cỡ chữ toàn phiếu & in chữ lớn sắc nét.
                    </p>
                </div>
                <div style="margin-left:auto;display:flex;gap:8px;flex-wrap:wrap">
                    <button class="btn btn-primary" onclick="pllExportClass('${window._pllMode}','print')">
                        <i class="fas fa-print"></i> In cả lớp (Booklet)
                    </button>
                    <button class="btn btn-success" onclick="pllExportClass('${window._pllMode}','word')">
                        <i class="fas fa-file-word"></i> Tải Word cả lớp
                    </button>
                </div>
            </div>
        </div>

        <div class="card" style="margin-bottom:16px">
            <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:end">
                <div class="form-group" style="min-width:180px">
                    <label>Loại phiếu</label>
                    ${pllModeSelectHtml()}
                </div>
                <div class="form-group" style="min-width:180px">
                    <label>Lớp</label>
                    <select id="pll-class" class="form-control" onchange="renderPhieuLienLac()" ${window.userRole === 'teacher' ? 'disabled' : ''}>
                        ${window.userRole === 'admin' ? '<option value="">Tất cả lớp</option>' : ''}
                        ${classes.map(c => `<option value="${pllHtml(c)}" ${window._pllSelectedClass === c ? 'selected' : ''}>${pllHtml(c)}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group" style="min-width:220px">
                    <label>Giáo viên chủ nhiệm</label>
                    <div style="padding:9px 12px;background:${assignedTeacher ? '#f0fdf4' : '#f8fafc'};border:1px solid ${assignedTeacher ? '#86efac' : '#cbd5e1'};border-radius:6px;font-weight:700;color:${assignedTeacher ? '#166534' : '#64748b'};display:flex;align-items:center;gap:7px;height:38px;box-sizing:border-box">
                        <i class="fas fa-chalkboard-teacher"></i>
                        <span>${pllHtml(assignedTeacher || (window._pllSelectedClass ? 'Chưa có phân công GVCN' : 'Theo phân công từng lớp'))}</span>
                    </div>
                </div>
                <div class="form-group" style="flex:1;min-width:220px">
                    <label>Tìm học sinh</label>
                    <input id="pll-search" class="form-control" placeholder="Nhập tên hoặc mã HS..." oninput="pllFilterRows()">
                </div>
            </div>
        </div>

        <div class="table-wrapper">
            <table>
                <thead>
                    <tr>
                        <th style="width:50px">STT</th>
                        <th style="width:110px">Mã HS</th>
                        <th>Họ tên</th>
                        <th style="width:90px">Lớp</th>
                        <th style="width:110px">Trạng thái</th>
                        <th style="width:190px">Thao tác in ấn</th>
                    </tr>
                </thead>
                <tbody id="pll-list-body">
                    ${students.map((s, idx) => {
                        const key = pllStudentKeyOf(s);
                        return `<tr class="pll-row" data-search="${pllHtml(`${s.code || s.id || ''} ${s.name || ''} ${s.classRoom || s.class || ''}`.toLowerCase())}">
                            <td>${idx + 1}</td>
                            <td><span class="badge badge-secondary">${pllHtml(s.code || s.id || key)}</span></td>
                            <td><strong>${pllHtml(s.name || '')}</strong></td>
                            <td><b>${pllHtml(s.classRoom || s.class || '')}</b></td>
                            <td><span class="badge badge-success">${pllHtml(s.status || 'active')}</span></td>
                            <td style="white-space:nowrap">
                                <button class="btn btn-sm btn-primary" onclick="pllOpenPrint('${pllHtml(key)}','${window._pllMode}')" title="Xem trước và in mẫu Booklet A5 gấp đôi">
                                    <i class="fas fa-print"></i> In Booklet
                                </button>
                                <button class="btn btn-sm btn-success" onclick="pllDownloadWord('${pllHtml(key)}','${window._pllMode}')" title="Tải file Word 4 trang">
                                    <i class="fas fa-file-word"></i> Word
                                </button>
                            </td>
                        </tr>`;
                    }).join('') || `<tr><td colspan="6" style="text-align:center;color:#64748b;padding:24px">Chưa có học sinh</td></tr>`}
                </tbody>
            </table>
        </div>`;
}

export { pllBuildHtml, pllBuildStudentBooklet };

if (typeof window !== 'undefined') {
    window.renderPhieuLienLac = renderPhieuLienLac;
    window.pllOpenPrint = pllOpenPrint;
    window.pllDownloadWord = pllDownloadWord;
    window.pllExportClass = pllExportClass;
    window.pllFilterRows = function() {
        const q = (document.getElementById('pll-search')?.value || '').toLowerCase();
        document.querySelectorAll('.pll-row').forEach(row => {
            row.style.display = row.dataset.search.includes(q) ? '' : 'none';
        });
    };
    window.pllBuildHtml = pllBuildHtml;
    window.pllBuildStudentBooklet = pllBuildStudentBooklet;
}
