
// ══════════════════════════════════════════════════════════════════════════════
// V5.36.1 — BẢN KHẢO SÁT THÔNG TIN HỌC SINH (FMA NAM HÒA)
// ══════════════════════════════════════════════════════════════════════════════

window.switchStudentTab = function(tabId) {
    document.querySelectorAll('.student-tab-pane').forEach(el => {
        el.style.display = 'none';
        el.classList.remove('active');
    });
    document.querySelectorAll('.student-tab-btn').forEach(el => el.classList.remove('active'));

    const targetPane = document.getElementById(tabId);
    if (targetPane) {
        targetPane.style.display = 'block';
        targetPane.classList.add('active');
    }

    const tabMap = {
        'tab-hs-basic': 'tab-btn-basic',
        'tab-hs-parents': 'tab-btn-parents',
        'tab-hs-guardian': 'tab-btn-guardian',
        'tab-hs-survey': 'tab-btn-survey'
    };
    const activeBtn = document.getElementById(tabMap[tabId]);
    if (activeBtn) activeBtn.classList.add('active');

    const tabs = ['tab-hs-basic', 'tab-hs-parents', 'tab-hs-guardian', 'tab-hs-survey'];
    const curIdx = tabs.indexOf(tabId);
    const prevBtn = document.getElementById('btn-tab-prev');
    const nextBtn = document.getElementById('btn-tab-next');
    if (prevBtn) prevBtn.style.display = curIdx > 0 ? 'inline-flex' : 'none';
    if (nextBtn) nextBtn.style.display = curIdx < tabs.length - 1 ? 'inline-flex' : 'none';
};

window.nextStudentTab = function() {
    const tabs = ['tab-hs-basic', 'tab-hs-parents', 'tab-hs-guardian', 'tab-hs-survey'];
    const curPane = document.querySelector('.student-tab-pane.active');
    const curId = curPane ? curPane.id : 'tab-hs-basic';
    const curIdx = tabs.indexOf(curId);
    if (curIdx < tabs.length - 1) {
        window.switchStudentTab(tabs[curIdx + 1]);
    }
};

window.prevStudentTab = function() {
    const tabs = ['tab-hs-basic', 'tab-hs-parents', 'tab-hs-guardian', 'tab-hs-survey'];
    const curPane = document.querySelector('.student-tab-pane.active');
    const curId = curPane ? curPane.id : 'tab-hs-basic';
    const curIdx = tabs.indexOf(curId);
    if (curIdx > 0) {
        window.switchStudentTab(tabs[curIdx - 1]);
    }
};

window.toggleReligionFields = function(val) {
    const otherGroup = document.getElementById('group-religion-other');
    if (otherGroup) {
        otherGroup.style.display = val === 'Khác' ? 'block' : 'none';
    }
};

window.addFamilyMemberRow = function(data = {}) {
    const tbody = document.getElementById('family-members-tbody');
    if (!tbody) return;
    const tr = document.createElement('tr');
    tr.className = 'family-member-row';
    tr.innerHTML = `
        <td><input type="text" class="fm-name" value="${safeText(data.fullName || '')}" placeholder="VD: Trần Khả Vy"></td>
        <td><input type="text" class="fm-relation" value="${safeText(data.relation || '')}" placeholder="VD: Em gái, Em trai, Bà..."></td>
        <td><input type="text" class="fm-year" value="${safeText(data.birthYear || '')}" placeholder="VD: 2018"></td>
        <td><input type="text" class="fm-health" value="${safeText(data.health || 'Tốt')}" placeholder="Tốt, Yếu..."></td>
        <td><input type="text" class="fm-job" value="${safeText(data.job || '')}" placeholder="Học tiểu học..."></td>
        <td><input type="text" class="fm-income" value="${safeText(data.income || '')}" placeholder="Thu nhập..."></td>
        <td><input type="text" class="fm-notes" value="${safeText(data.notes || '')}" placeholder="Ghi chú..."></td>
        <td style="text-align:center">
            <button type="button" class="btn-del-row" onclick="removeFamilyMemberRow(this)" title="Xóa dòng"><i class="fas fa-trash-alt"></i></button>
        </td>
    `;
    tbody.appendChild(tr);
};

window.removeFamilyMemberRow = function(btn) {
    const tr = btn.closest('tr');
    if (tr) tr.remove();
};

window.collectFamilyMembers = function() {
    const rows = document.querySelectorAll('#family-members-tbody .family-member-row');
    const list = [];
    rows.forEach(r => {
        const fullName = r.querySelector('.fm-name')?.value?.trim() || '';
        const relation = r.querySelector('.fm-relation')?.value?.trim() || '';
        const birthYear = r.querySelector('.fm-year')?.value?.trim() || '';
        const health   = r.querySelector('.fm-health')?.value?.trim() || '';
        const job      = r.querySelector('.fm-job')?.value?.trim() || '';
        const income   = r.querySelector('.fm-income')?.value?.trim() || '';
        const notes    = r.querySelector('.fm-notes')?.value?.trim() || '';
        if (fullName || relation || birthYear || job) {
            list.push({ fullName, relation, birthYear, health, job, income, notes });
        }
    });
    return list;
};

function setRadioVal(name, val) {
    const radios = document.querySelectorAll(`input[type="radio"][name="${name}"]`);
    radios.forEach(r => {
        r.checked = (r.value === val);
    });
}

function getRadioVal(name) {
    const checked = document.querySelector(`input[type="radio"][name="${name}"]:checked`);
    return checked ? checked.value : '';
}

// ══════════════════════════════════════════════════════════════════════════════
// XEM & IN BẢN KHẢO SÁT THÔNG TIN HỌC SINH (A4 DOCUMENT)
// ══════════════════════════════════════════════════════════════════════════════
window.viewStudentSurvey = function(studentKey) {
    const s = window.localData.students?.[studentKey];
    if (!s) {
        Swal.fire('Lỗi', 'Không tìm thấy thông tin học sinh', 'error');
        return;
    }

    const check = (val, target) => (val === target ? '☑' : '☐');
    const checkedIf = cond => (cond ? '☑' : '☐');

    const famRows = (Array.isArray(s.familyMembers) && s.familyMembers.length ? s.familyMembers : []).map(m => `
        <tr>
            <td style="font-weight:600">${safeText(m.fullName || '-')}</td>
            <td>${safeText(m.relation || '-')}</td>
            <td style="text-align:center">${safeText(m.birthYear || '-')}</td>
            <td>${safeText(m.health || '-')}</td>
            <td>${safeText(m.job || '-')}</td>
            <td>${safeText(m.income || '-')}</td>
            <td>${safeText(m.notes || '-')}</td>
        </tr>
    `).join('');

    const html = `
    <div class="survey-sheet-container" id="survey-printable-content">
        <!-- HEADER TRANG 1 -->
        <div class="survey-sheet-header">
            <div class="survey-school-info">
                <div style="font-size:1.05rem; font-weight:800; color:#1e3a8a">Lớp Phổ cập TH. Hùng Vương</div>
                <div style="font-size:0.85rem; color:#475569">158-160 Đất Thánh, Kp 8, P. Tân Hòa</div>
            </div>
            <div class="survey-national-motto">
                <div style="font-size:0.95rem; font-weight:800">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                <div style="font-size:0.88rem; font-weight:700">Độc lập - Tự do - Hạnh phúc</div>
                <div style="font-size:0.85rem; color:#64748b; margin-top:2px">───────❖───────</div>
            </div>
        </div>

        <div class="survey-sheet-title">BẢN KHẢO SÁT THÔNG TIN HỌC SINH</div>

        <!-- PHẦN I: THÔNG TIN HỌC SINH -->
        <div class="survey-part-title">I. THÔNG TIN HỌC SINH (HS)</div>
        
        <div class="survey-field-row">
            <span>Họ tên HS: <span class="survey-field-val" style="font-size:1.05rem">${safeText(s.name)}</span></span>
            <span>Nam ${check(s.gender, 'Nam')} &nbsp; Nữ ${check(s.gender, 'Nữ')}</span>
            <span>Lớp: <span class="survey-field-val">${safeText(s.classRoom || s.class || '-')}</span></span>
        </div>

        <div class="survey-field-row">
            <span>Ngày tháng năm sinh: <span class="survey-field-val">${safeText(formatStudentDob(s.dob))}</span></span>
            <span>Nơi sinh: <span class="survey-field-val">${safeText(s.birthPlace || '-')}</span></span>
            <span>MSĐD: <span class="survey-field-val">${safeText(s.nationalId || '-')}</span></span>
        </div>

        <div class="survey-field-row">
            <span>Điện thoại HS (nếu có): <span class="survey-field-val">${safeText(s.phone || '-')}</span></span>
            <span>FB: <span class="survey-field-val">${safeText(s.facebook || '-')}</span></span>
            <span>Tên Zalo: <span class="survey-field-val">${safeText(s.zalo || '-')}</span></span>
        </div>

        <div class="survey-field-row">
            <span>Địa chỉ hiện tại: <span class="survey-field-val">${safeText(s.currentAddress || s.temporaryAddress || '-')}</span></span>
        </div>

        <div class="survey-field-row">
            <span>Địa chỉ theo hộ khẩu: <span class="survey-field-val">${safeText(s.permanentAddress || '-')}</span></span>
        </div>

        <div class="survey-field-row">
            <span>Tôn giáo:</span>
            <span>Công giáo ${check(s.religion, 'Công giáo')}</span>
            <span>Phật giáo ${check(s.religion, 'Phật giáo')}</span>
            <span>Không tôn giáo ${check(s.religion, 'Không tôn giáo')}</span>
            <span>Khác: <span class="survey-field-val">${safeText(s.religionOther || '-')}</span></span>
        </div>

        <div class="survey-field-row">
            <span>Nếu là Công giáo đang sinh hoạt tại GX: <span class="survey-field-val">${safeText(s.parish || '-')}</span></span>
            <span>lớp giáo lý: <span class="survey-field-val">${safeText(s.catechismClass || '-')}</span></span>
            <span>Đoàn thể: <span class="survey-field-val">${safeText(s.churchGroup || '-')}</span></span>
        </div>

        <div class="survey-field-row" style="align-items:flex-start">
            <span>Hiện đang sống với:</span>
            <div style="display:inline-flex; flex-wrap:wrap; gap:8px 14px">
                <span>Cha mẹ ruột ${check(s.livingWith, 'Cha mẹ ruột')}</span>
                <span>Cha dượng - mẹ ruột ${check(s.livingWith, 'Cha dượng- mẹ ruột')}</span>
                <span>Cha ruột - mẹ kế ${check(s.livingWith, 'Cha ruột- mẹ kế')}</span>
                <span>Mẹ ruột ${check(s.livingWith, 'Mẹ ruột')}</span>
                <span>Cha ruột ${check(s.livingWith, 'Cha ruột')}</span>
                <span>Cha mẹ nuôi ${check(s.livingWith, 'Cha mẹ nuôi')}</span>
                <span>Người thân khác ${check(s.livingWith, 'Người thân khác')} (${safeText(s.livingWithOtherDetail || '...')})</span>
            </div>
        </div>

        <div class="survey-field-row">
            <span>Nơi ở hiện nay:</span>
            <span>Nhà riêng ${check(s.housingType, 'Nhà riêng')}</span>
            <span>Nhà trọ ${check(s.housingType, 'Nhà trọ')}</span>
            <span>Nhà người thân ${check(s.housingType, 'Nhà người thân')}</span>
            <span>Khác: <span class="survey-field-val">${safeText(s.housingTypeOtherDetail || '-')}</span></span>
        </div>

        <div class="survey-field-row">
            <span>Diện tích nhà: <span class="survey-field-val">${safeText(s.houseArea || '-')}</span></span>
            <span>nhà cấp 4 ${check(s.houseStructure, 'Nhà cấp 4')}</span>
            <span>nhà 1 lầu ${check(s.houseStructure, 'Nhà 1 lầu')}</span>
            <span>nhà 2 lầu ${check(s.houseStructure, 'Nhà 2 lầu')}</span>
            <span>nhà 3 lầu ${check(s.houseStructure, 'Nhà 3 lầu')}</span>
            <span>khác: <span class="survey-field-val">${safeText(s.houseStructureOtherDetail || '-')}</span></span>
        </div>

        <div class="survey-field-row">
            <span>Bản thân HS lao động (làm việc):</span>
            <span>Tại nhà ${check(s.studentLabor, 'Tại nhà')}</span>
            <span>Bên ngoài ${check(s.studentLabor, 'Bên ngoài')}</span>
            <span>Không lao động ${check(s.studentLabor, 'Không lao động')}</span>
        </div>

        ${s.studentLabor && s.studentLabor !== 'Không lao động' ? `
        <div class="survey-field-row">
            <span>(Nếu HS lao động) Thu nhập trung bình/tháng: <span class="survey-field-val">${safeText(s.studentLaborIncome || '-')}</span></span>
            <span>công việc: <span class="survey-field-val">${safeText(s.studentLaborJob || '-')}</span></span>
            <span>thời gian: <span class="survey-field-val">${safeText(s.studentLaborTime || '-')}</span></span>
        </div>` : ''}

        <div class="survey-field-row">
            <span>Bệnh lý hoặc những vấn đề PH lưu ý NT: <span class="survey-field-val" style="color:#b91c1c">${safeText(s.healthNotes || 'Không có')}</span></span>
        </div>

        <div style="margin-top:8px">
            <b>Tình trạng giấy tờ pháp lý:</b>
            <div style="margin-left:14px; margin-top:4px">
                <div class="survey-field-row">
                    <span>• Giấy khai sinh: Có ${check(s.docBirthCert, 'Có')} &nbsp; Không ${check(s.docBirthCert, 'Không')} &nbsp; Khác: ${safeText(s.docBirthCertReason || '-')}</span>
                </div>
                <div class="survey-field-row">
                    <span>• Địa chỉ nơi cư trú: Có ${check(s.docResidence, 'Có')} &nbsp; Không ${check(s.docResidence, 'Không')} &nbsp; Khác: ${safeText(s.docResidenceReason || '-')}</span>
                </div>
                <div class="survey-field-row">
                    <span>• Thẻ căn cước công dân: Có ${check(s.docCccd, 'Có')} &nbsp; Không ${check(s.docCccd, 'Không')}</span>
                </div>
                <div class="survey-field-row">
                    <span>• HS đã có TT trên CSDL quốc gia dân cư: Có ${check(s.docNationalDb, 'Có')} &nbsp; Không ${check(s.docNationalDb, 'Không')} ${s.docNationalDbReason ? `(Lý do: ${safeText(s.docNationalDbReason)})` : ''}</span>
                </div>
            </div>
        </div>

        <!-- PHẦN II: THÔNG TIN GIA ĐÌNH -->
        <div class="survey-part-title" style="margin-top:22px">II. THÔNG TIN GIA ĐÌNH</div>

        <!-- 1. CHA -->
        <div style="margin-top:6px">
            <b>1. Thông tin về Cha</b>
            <div class="survey-field-row" style="margin-top:4px">
                <span>Họ tên: <span class="survey-field-val">${safeText(s.dadName || '-')}</span></span>
                <span>Năm sinh: <span class="survey-field-val">${safeText(s.dadBirthYear || '-')}</span></span>
                <span>Tôn giáo: <span class="survey-field-val">${safeText(s.dadReligion || '-')}</span></span>
            </div>
            <div class="survey-field-row">
                <span>Nghề nghiệp chính: <span class="survey-field-val">${safeText(s.dadJob || '-')}</span></span>
                <span>Ổn định: <span class="survey-field-val">${safeText(s.dadJobStable || '-')}</span></span>
                <span>Thu nhập/tháng: <span class="survey-field-val">${safeText(s.dadIncome || '-')}</span></span>
            </div>
            <div class="survey-field-row">
                <span>Bảo hiểm: BHYT (${safeText(s.dadBhyt || 'Có')}) &nbsp; BHTN tai nạn (${safeText(s.dadBhtn || 'Có')}) ${s.dadNoBhReason ? `- Lý do không mua BH: ${safeText(s.dadNoBhReason)}` : ''}</span>
            </div>
            <div class="survey-field-row">
                <span>SĐT: <span class="survey-field-val">${safeText(s.dadPhone || '-')}</span></span>
                <span>Tình trạng hôn nhân: <span class="survey-field-val">${safeText(s.dadMaritalStatus || '-')}</span></span>
                <span>Học vấn: <span class="survey-field-val">${safeText(s.dadEducation || '-')}</span></span>
            </div>
        </div>

        <!-- 2. MẸ -->
        <div style="margin-top:14px">
            <b>2. Thông tin về Mẹ</b>
            <div class="survey-field-row" style="margin-top:4px">
                <span>Họ tên: <span class="survey-field-val">${safeText(s.momName || '-')}</span></span>
                <span>Năm sinh: <span class="survey-field-val">${safeText(s.momBirthYear || '-')}</span></span>
                <span>Tôn giáo: <span class="survey-field-val">${safeText(s.momReligion || '-')}</span></span>
            </div>
            <div class="survey-field-row">
                <span>Nghề nghiệp chính: <span class="survey-field-val">${safeText(s.momJob || '-')}</span></span>
                <span>Ổn định: <span class="survey-field-val">${safeText(s.momJobStable || '-')}</span></span>
                <span>Thu nhập/tháng: <span class="survey-field-val">${safeText(s.momIncome || '-')}</span></span>
            </div>
            <div class="survey-field-row">
                <span>Bảo hiểm: BHYT (${safeText(s.momBhyt || 'Có')}) &nbsp; BHTN tai nạn (${safeText(s.momBhtn || 'Có')}) ${s.momBhOther ? `- Khác: ${safeText(s.momBhOther)}` : ''}</span>
            </div>
            <div class="survey-field-row">
                <span>SĐT: <span class="survey-field-val">${safeText(s.momPhone || '-')}</span></span>
                <span>Tình trạng hôn nhân: <span class="survey-field-val">${safeText(s.momMaritalStatus || '-')}</span></span>
                <span>Học vấn: <span class="survey-field-val">${safeText(s.momEducation || '-')}</span></span>
            </div>
        </div>

        <!-- 3. GIÁM HỘ -->
        ${s.guardianName ? `
        <div style="margin-top:14px">
            <b>3. Thông tin về Người giám hộ (đang trực tiếp nuôi dưỡng)</b>
            <div class="survey-field-row" style="margin-top:4px">
                <span>Họ tên: <span class="survey-field-val">${safeText(s.guardianName)}</span></span>
                <span>Năm sinh: <span class="survey-field-val">${safeText(s.guardianBirthYear || '-')}</span></span>
                <span>Tôn giáo: <span class="survey-field-val">${safeText(s.guardianReligion || '-')}</span></span>
            </div>
            <div class="survey-field-row">
                <span>Nghề nghiệp chính: <span class="survey-field-val">${safeText(s.guardianJob || '-')}</span></span>
                <span>Ổn định: <span class="survey-field-val">${safeText(s.guardianJobStable || '-')}</span></span>
                <span>Thu nhập/tháng: <span class="survey-field-val">${safeText(s.guardianIncome || '-')}</span></span>
            </div>
            <div class="survey-field-row">
                <span>SĐT: <span class="survey-field-val">${safeText(s.guardianPhone || '-')}</span></span>
                <span>Học vấn: <span class="survey-field-val">${safeText(s.guardianEducation || '-')}</span></span>
            </div>
        </div>` : ''}

        <!-- 4. THÀNH VIÊN SỐNG CÙNG -->
        <div style="margin-top:18px">
            <b>Thành viên trong gia đình (ông/bà, cha/mẹ, anh/chị/em ruột và những người hiện nay sống cùng):</b>
            <table class="survey-table">
                <thead>
                    <tr>
                        <th style="width:24%">Họ tên</th>
                        <th style="width:16%">Quan hệ với trẻ</th>
                        <th style="width:10%">Năm sinh</th>
                        <th style="width:16%">Tình trạng sức khỏe</th>
                        <th style="width:18%">Nghề nghiệp</th>
                        <th style="width:16%">Thu nhập</th>
                    </tr>
                </thead>
                <tbody>
                    ${famRows || '<tr><td colspan="6" style="text-align:center;color:#64748b">Không có thành viên sống cùng nào được ghi nhận</td></tr>'}
                </tbody>
            </table>
        </div>

        <!-- 5. XÁC NHẬN THÔNG TIN & HOÀN CẢNH -->
        <div style="margin-top:16px">
            <div class="survey-part-title">Xác nhận thông tin & Đánh giá hoàn cảnh</div>
            
            <div class="survey-field-row" style="margin-top:6px">
                <span>Người nuôi dưỡng chính: <span class="survey-field-val" style="font-weight:800; color:#1d4ed8">${safeText(s.primaryCaregiver || (s.livingWith === 'Mẹ ruột' ? 'Mẹ ruột' : '-'))}</span></span>
            </div>

            <div class="survey-field-row" style="align-items:flex-start">
                <span>Hoàn cảnh:</span>
                <span class="survey-field-val" style="font-style:italic; line-height:1.6">${safeText(s.familyCircumstance || 'Chưa có ghi chú hoàn cảnh đặc biệt.')}</span>
            </div>

            <div class="survey-field-row">
                <span>Kinh tế gia đình: <span class="survey-field-val" style="font-weight:700">${safeText(s.familyEconomy || 'Thấp')}</span></span>
                <span>Số người lao động trong nhà: <span class="survey-field-val">${safeText(s.workerCount || '1')}</span></span>
                <span>Số người sống chung nhà: <span class="survey-field-val">${safeText(s.housematesCount || '3')}</span></span>
            </div>

            <div class="survey-field-row">
                <span>Nguồn hỗ trợ ngoài gia đình: <span class="survey-field-val">${safeText(s.outsideSupport || 'Không có')}</span></span>
                <span>Anh chị em ruột học PC: <span class="survey-field-val">${safeText(s.siblingsInPc || 'Không có')}</span></span>
            </div>

            ${s.notes ? `
            <div class="survey-field-row">
                <span>Khác: <span class="survey-field-val">${safeText(s.notes)}</span></span>
            </div>` : ''}
        </div>

        <!-- CHỮ KÝ XÁC NHẬN -->
        <div style="display:flex; justify-content:space-between; margin-top:28px; text-align:center">
            <div style="width:40%">
                <div style="font-weight:700">NGƯỜI LẬP PHIẾU</div>
                <div style="font-size:0.85rem; color:#64748b">(Ký và ghi rõ họ tên)</div>
            </div>
            <div style="width:40%">
                <div style="font-style:italic; font-size:0.88rem; margin-bottom:4px">Ngày ..... tháng ..... năm 20...</div>
                <div style="font-weight:700">ĐẠI DIỆN NHÀ TRƯỜNG / PHỤ HUYNH</div>
                <div style="font-size:0.85rem; color:#64748b">(Ký và ghi rõ họ tên)</div>
            </div>
        </div>
    </div>
    `;

    const printArea = document.getElementById('student-survey-print-area');
    if (printArea) printArea.innerHTML = html;
    document.getElementById('modal-student-survey').style.display = 'flex';
};

window.printStudentSurvey = function() {
    window.print();
};


import { classKey, paymentStatusPath, paymentStatusClassPath } from "./yearscope.js";
import { compareStudentNames } from "./studentstatus.js?v=5.26.1";
import { runTransaction } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// ═══════════════════════════════════════════════════════
// students.js — Quản lý Học sinh (v2: phân trang lớp, chuyển lớp)
// ═══════════════════════════════════════════════════════

window._studentCurrentClass = '';
window._studentViewMode = window._studentViewMode || 'current';

console.info('[Smart School V5.32.2] students QR storage lazy fix loaded');

function normalizeStudentStatusValue(value) {
    const raw = String(value || 'active').trim().toLowerCase();
    if (['leave', 'left', 'quit', 'stop', 'stopped', 'nghi', 'nghi_hoc', 'nghihoc', 'ngừng học', 'ngung_hoc', 'chuyen_truong', 'chuyển trường'].includes(raw)) {
        return 'inactive';
    }
    if (['bao_luu', 'baoluu', 'reserve', 'reserved'].includes(raw)) {
        return 'reserved';
    }
    if (['tot_nghiep', 'tốt nghiệp', 'hoan_thanh', 'hoan_thanh_tieu_hoc', 'hoàn thành tiểu học', 'completed', 'graduated'].includes(raw)) {
        return 'graduated';
    }
    if (['dang_hoc', 'đang học', 'danghoc', 'active'].includes(raw)) {
        return 'active';
    }
    return raw || 'active';
}

function ensureStudentStatusSelectOptions(form = document.getElementById('student-form')) {
    const el = form?.elements?.status;
    if (!el) return;

    // Bản HTML cũ có option value="leave". Đổi ngay trên DOM thành inactive để lưu đúng.
    Array.from(el.options || []).forEach(opt => {
        opt.value = normalizeStudentStatusValue(opt.value);
    });

    const existing = new Set(Array.from(el.options || []).map(opt => opt.value));
    const labels = {
        active: 'Đang học',
        inactive: 'Nghỉ học',
        reserved: 'Bảo lưu',
        graduated: 'Hoàn thành tiểu học'
    };

    ['active', 'inactive', 'reserved', 'graduated'].forEach(value => {
        if (!existing.has(value)) {
            const opt = document.createElement('option');
            opt.value = value;
            opt.textContent = labels[value];
            el.appendChild(opt);
        }
    });
}

function setStudentStatusSelectValue(form, value) {
    ensureStudentStatusSelectOptions(form);
    const el = form?.elements?.status;
    if (!el) return;
    el.value = normalizeStudentStatusValue(value);
}

function studentStatusForSchoolYear(student, schoolYear) {
    const currentStatus = normalizeStudentStatusValue(student?.status || 'active');
    // Ở năm học hệ thống hiện tại, trạng thái hồ sơ chính là nguồn dữ liệu quyết định.
    // Khi đang xem năm cũ, ưu tiên trạng thái đã ghi trong lịch sử của năm đó.
    if (!window._isViewingArchivedYear) return currentStatus;

    const yearKey = String(schoolYear || '').replace('-', '_');
    const history = student?.schoolYearHistory?.[yearKey] || student?.schoolYearHistory?.[schoolYear];
    return normalizeStudentStatusValue(
        history?.enrollmentStatus || history?.promotionStatus || currentStatus
    );
}

function isStudentArchived(student, schoolYear) {
    return ['inactive', 'graduated'].includes(studentStatusForSchoolYear(student, schoolYear));
}

function buildStudentArchiveFields(status, previousStudent = {}, now = Date.now()) {
    const normalizedStatus = normalizeStudentStatusValue(status);
    const schoolYear = window._currentSchoolYear || '';

    if (normalizedStatus === 'graduated') {
        return {
            archivedAt: previousStudent.archivedAt || now,
            archivedSchoolYear: previousStudent.archivedSchoolYear || schoolYear,
            archiveReason: 'Hoàn thành tiểu học',
            graduatedAt: previousStudent.graduatedAt || now,
            graduatedSchoolYear: previousStudent.graduatedSchoolYear || schoolYear,
            stoppedAt: null,
            stoppedSY: null,
            inactiveReason: null,
        };
    }

    if (normalizedStatus === 'inactive') {
        return {
            archivedAt: previousStudent.archivedAt || now,
            archivedSchoolYear: previousStudent.archivedSchoolYear || schoolYear,
            archiveReason: previousStudent.archiveReason || previousStudent.inactiveReason || 'Nghỉ học',
            graduatedAt: null,
            graduatedSchoolYear: null,
        };
    }

    return {
        archivedAt: null,
        archivedSchoolYear: null,
        archiveReason: null,
        graduatedAt: null,
        graduatedSchoolYear: null,
        stoppedAt: null,
        stoppedSY: null,
        inactiveReason: null,
    };
}




// ── Khóa duy nhất Mã HS ─────────────────────────────────────────────────────
// Lưu ý: Firebase push() chỉ tạo key hồ sơ không trùng, KHÔNG tự đảm bảo field code/Mã HS duy nhất.
// Vì vậy dùng thêm studentCodeIndex/{MA_HS} = studentKey để khóa mã bằng transaction.
function normalizeStudentCode(value) {
    return String(value || '')
        .trim()
        .toUpperCase()
        .replace(/\s+/g, '');
}

function normalizeNationalId(value) {
    return String(value || '').trim().replace(/\s+/g, '');
}

function studentDisplayName(student, fallback = '') {
    return student?.name || student?.code || student?.id || fallback || 'học sinh khác';
}

function isSameStudentKey(dbKey, student, targetKey) {
    const t = String(targetKey || '');
    return String(dbKey || '') === t || String(student?.id || '') === t;
}

function assertStudentCodeNotDuplicatedLocally(code, studentKey = '') {
    const normalized = normalizeStudentCode(code);
    if (!normalized) {
        throw new Error('Vui lòng nhập Mã HS.');
    }
    if (/[.#$/\[\]]/.test(normalized)) {
        throw new Error('Mã HS không được chứa các ký tự: . # $ / [ ]');
    }

    for (const [key, student] of Object.entries(window.localData?.students || {})) {
        if (isSameStudentKey(key, student, studentKey)) continue;
        const existingCode = normalizeStudentCode(student?.code);
        if (existingCode && existingCode === normalized) {
            throw new Error(`Mã HS ${normalized} đã tồn tại ở học sinh: ${studentDisplayName(student, key)}.`);
        }
    }
}

async function reserveUniqueStudentCode(code, studentKey) {
    const normalized = normalizeStudentCode(code);
    assertStudentCodeNotDuplicatedLocally(normalized, studentKey);

    const indexRef = window.ref(window.db, `studentCodeIndex/${normalized}`);
    const tx = await runTransaction(indexRef, currentOwner => {
        if (!currentOwner || String(currentOwner) === String(studentKey)) {
            return studentKey;
        }
        return; // abort transaction nếu mã đã thuộc học sinh khác
    }, { applyLocally: false });

    if (!tx.committed) {
        throw new Error(`Mã HS ${normalized} đã tồn tại trong hệ thống.`);
    }
    return normalized;
}

async function releaseStudentCodeIndex(code, studentKey) {
    const normalized = normalizeStudentCode(code);
    if (!normalized || !studentKey) return;
    try {
        await runTransaction(window.ref(window.db, `studentCodeIndex/${normalized}`), currentOwner => {
            return String(currentOwner || '') === String(studentKey) ? null : currentOwner;
        }, { applyLocally: false });
    } catch (error) {
        console.warn(`Không giải phóng được studentCodeIndex/${normalized}:`, error);
    }
}

function currentMaxStudentCodeNumber(prefix) {
    let maxCodeNum = 0;
    Object.values(window.localData?.students || {}).forEach(s => {
        const code = normalizeStudentCode(s?.code);
        if (code.startsWith(prefix)) {
            const n = parseInt(code.replace(prefix, ''), 10) || 0;
            if (n > maxCodeNum) maxCodeNum = n;
        }
    });
    return maxCodeNum;
}

async function reserveGeneratedStudentCode(prefix, startNum, studentKey) {
    let current = Number(startNum) || 0;
    for (let attempt = 0; attempt < 10000; attempt++) {
        current++;
        const candidate = `${prefix}${String(current).padStart(3, '0')}`;
        try {
            const code = await reserveUniqueStudentCode(candidate, studentKey);
            return { code, maxCodeNum: current };
        } catch (error) {
            if (String(error?.message || '').includes('đã tồn tại')) continue;
            throw error;
        }
    }
    throw new Error('Không thể sinh Mã HS mới. Vui lòng kiểm tra lại dữ liệu học sinh.');
}

// ── V5.28: Cấu hình mã học sinh theo năm + gợi ý mã thiếu ───────────────────
const STUDENT_CODE_CONFIG_ROOT = 'settings/studentCodeConfig';
let _studentCodeConfigCache = {};

function _studentCodeAutoSchoolYear() {
    if (window._currentSchoolYear) return window._currentSchoolYear;
    const now = new Date();
    const y = now.getFullYear();
    return now.getMonth() >= 7 ? `${y}-${y+1}` : `${y-1}-${y}`;
}

function _studentCodeYearKey(schoolYear = _studentCodeAutoSchoolYear()) {
    return String(schoolYear || '').trim().replace(/-/g, '_');
}

function _studentCodeDefaultPrefix(schoolYear = _studentCodeAutoSchoolYear()) {
    const m = String(schoolYear || '').match(/^(\d{4})-(\d{4})$/);
    const yearForCode = m ? m[2] : String(new Date().getFullYear());
    return `HS${yearForCode}-`;
}

function defaultStudentCodeConfig(schoolYear = _studentCodeAutoSchoolYear()) {
    return {
        schoolYear,
        prefix: _studentCodeDefaultPrefix(schoolYear),
        suffix: '',
        digits: 3,
        startAt: 1,
        maxSuggestions: 12,
        updatedAt: 0,
        updatedBy: '',
        updatedByUid: '',
    };
}

function normalizeStudentCodeConfig(raw = {}, schoolYear = _studentCodeAutoSchoolYear()) {
    const base = defaultStudentCodeConfig(schoolYear);
    const digits = Math.min(8, Math.max(1, parseInt(raw.digits ?? base.digits, 10) || base.digits));
    const startAt = Math.max(1, parseInt(raw.startAt ?? base.startAt, 10) || base.startAt);
    const maxSuggestions = Math.min(50, Math.max(3, parseInt(raw.maxSuggestions ?? base.maxSuggestions, 10) || base.maxSuggestions));
    return {
        ...base,
        ...raw,
        schoolYear: raw.schoolYear || schoolYear,
        prefix: normalizeStudentCode(raw.prefix || base.prefix),
        suffix: normalizeStudentCode(raw.suffix || ''),
        digits,
        startAt,
        maxSuggestions,
    };
}

async function loadStudentCodeConfig(schoolYear = _studentCodeAutoSchoolYear(), force = false) {
    const yearKey = _studentCodeYearKey(schoolYear);
    if (!force && _studentCodeConfigCache[yearKey]) return _studentCodeConfigCache[yearKey];

    try {
        const snap = await window.get(window.ref(window.db, `${STUDENT_CODE_CONFIG_ROOT}/${yearKey}`));
        const cfg = normalizeStudentCodeConfig(snap.val() || {}, schoolYear);
        _studentCodeConfigCache[yearKey] = cfg;
        return cfg;
    } catch (error) {
        console.warn('[Smart School V5.28] Không đọc được cấu hình mã HS, dùng mặc định:', error);
        const cfg = defaultStudentCodeConfig(schoolYear);
        _studentCodeConfigCache[yearKey] = cfg;
        return cfg;
    }
}

async function saveStudentCodeConfig(config) {
    const schoolYear = String(config.schoolYear || _studentCodeAutoSchoolYear()).trim();
    if (!/^\d{4}-\d{4}$/.test(schoolYear)) {
        throw new Error('Năm học phải có dạng 2025-2026.');
    }

    const cfg = normalizeStudentCodeConfig(config, schoolYear);
    if (!cfg.prefix) throw new Error('Tiền tố mã HS không được để trống.');
    if (/[.#$/\[\]]/.test(cfg.prefix) || /[.#$/\[\]]/.test(cfg.suffix)) {
        throw new Error('Tiền tố/hậu tố không được chứa các ký tự: . # $ / [ ]');
    }

    const now = typeof window.serverNow === 'function' ? window.serverNow() : Date.now();
    const payload = {
        schoolYear: cfg.schoolYear,
        prefix: cfg.prefix,
        suffix: cfg.suffix || '',
        digits: cfg.digits,
        startAt: cfg.startAt,
        maxSuggestions: cfg.maxSuggestions,
        updatedAt: now,
        updatedBy: window.currentUser?.email || '',
        updatedByUid: window.currentUser?.uid || '',
    };

    const yearKey = _studentCodeYearKey(cfg.schoolYear);
    await window.set(window.ref(window.db, `${STUDENT_CODE_CONFIG_ROOT}/${yearKey}`), payload);
    _studentCodeConfigCache[yearKey] = normalizeStudentCodeConfig(payload, cfg.schoolYear);
    return _studentCodeConfigCache[yearKey];
}

function studentCodeNumberFromConfig(code, cfg) {
    const normalized = normalizeStudentCode(code);
    const prefix = normalizeStudentCode(cfg.prefix || '');
    const suffix = normalizeStudentCode(cfg.suffix || '');
    if (!prefix || !normalized.startsWith(prefix)) return null;
    if (suffix && !normalized.endsWith(suffix)) return null;

    const start = prefix.length;
    const end = suffix ? normalized.length - suffix.length : normalized.length;
    const middle = normalized.slice(start, end);
    if (!/^\d+$/.test(middle)) return null;
    return parseInt(middle, 10);
}

function formatStudentCodeByConfig(number, cfg) {
    const n = Math.max(0, parseInt(number, 10) || 0);
    return `${cfg.prefix}${String(n).padStart(cfg.digits, '0')}${cfg.suffix || ''}`;
}

function localStudentCodeSet() {
    const used = new Set();
    Object.values(window.localData?.students || {}).forEach(student => {
        const code = normalizeStudentCode(student?.code || student?.id || '');
        if (code) used.add(code);
    });
    return used;
}

async function readStudentCodeIndexSet() {
    try {
        const snap = await window.get(window.ref(window.db, 'studentCodeIndex'));
        const data = snap.val() || {};
        return new Set(Object.keys(data || {}).map(normalizeStudentCode).filter(Boolean));
    } catch (error) {
        console.warn('[Smart School V5.28] Không đọc được studentCodeIndex, dùng dữ liệu local:', error);
        return new Set();
    }
}

async function buildMissingStudentCodeSuggestions(cfg, limit = cfg.maxSuggestions) {
    const used = localStudentCodeSet();
    const indexed = await readStudentCodeIndexSet();
    indexed.forEach(code => used.add(code));

    // Tìm số lớn nhất đang có để vẫn gợi ý được mã còn thiếu ở giữa dãy và các mã tiếp theo.
    let maxExisting = cfg.startAt - 1;
    used.forEach(code => {
        const n = studentCodeNumberFromConfig(code, cfg);
        if (n !== null && n > maxExisting) maxExisting = n;
    });

    const suggestions = [];
    const startAt = Math.max(1, Number(cfg.startAt || 1));
    const hardStop = Math.max(maxExisting + Number(limit || 12) + 50, startAt + 2000);
    for (let n = startAt; n <= hardStop && suggestions.length < Number(limit || 12); n++) {
        const candidate = normalizeStudentCode(formatStudentCodeByConfig(n, cfg));
        if (!used.has(candidate)) suggestions.push(candidate);
    }
    return suggestions;
}

async function reserveGeneratedStudentCodeFromConfig(studentKey) {
    const cfg = await loadStudentCodeConfig();
    const used = localStudentCodeSet();
    const indexed = await readStudentCodeIndexSet();
    indexed.forEach(code => used.add(code));

    const startAt = Math.max(1, Number(cfg.startAt || 1));
    for (let n = startAt; n < startAt + 10000; n++) {
        const candidate = normalizeStudentCode(formatStudentCodeByConfig(n, cfg));
        if (used.has(candidate)) continue;
        try {
            const code = await reserveUniqueStudentCode(candidate, studentKey);
            return { code, maxCodeNum: n, config: cfg };
        } catch (error) {
            if (String(error?.message || '').includes('đã tồn tại')) continue;
            throw error;
        }
    }
    throw new Error('Không thể sinh Mã HS mới theo cấu hình hiện tại.');
}

function ensureStudentCodeAssistUi(form = document.getElementById('student-form')) {
    const input = form?.elements?.code;
    if (!input) return;
    input.setAttribute('list', 'student-code-suggestions');

    if (!document.getElementById('student-code-suggestions')) {
        const dl = document.createElement('datalist');
        dl.id = 'student-code-suggestions';
        document.body.appendChild(dl);
    }

    if (!document.getElementById('student-code-helper')) {
        const helper = document.createElement('div');
        helper.id = 'student-code-helper';
        helper.style.cssText = 'margin-top:6px;font-size:0.78rem;color:#64748b;line-height:1.45';
        helper.innerHTML = `
            <span id="student-code-helper-text">Đang tải gợi ý mã...</span>
            <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">
                <button type="button" class="btn btn-outline btn-sm" style="font-size:0.75rem;padding:4px 8px"
                    onclick="refreshStudentCodeSuggestions(true)">
                    <i class="fas fa-magic"></i> Lấy mã gợi ý
                </button>
                ${window.userRole === 'admin' ? `
                    <button type="button" class="btn btn-outline btn-sm" style="font-size:0.75rem;padding:4px 8px"
                        onclick="openStudentCodeSettings()">
                        <i class="fas fa-cog"></i> Cài mã HS
                    </button>` : ''}
            </div>`;
        input.insertAdjacentElement('afterend', helper);
    }
}

async function refreshStudentCodeSuggestions(autoFill = false) {
    const form = document.getElementById('student-form');
    const input = form?.elements?.code;
    const helper = document.getElementById('student-code-helper-text');
    const datalist = document.getElementById('student-code-suggestions');
    if (!input || !datalist) return;

    try {
        const cfg = await loadStudentCodeConfig();
        const suggestions = await buildMissingStudentCodeSuggestions(cfg, cfg.maxSuggestions);
        datalist.innerHTML = suggestions.map(code => `<option value="${code}"></option>`).join('');

        if (helper) {
            helper.innerHTML = suggestions.length
                ? `Gợi ý mã còn thiếu theo năm <b>${cfg.schoolYear}</b>: <b>${suggestions.slice(0, 6).join('</b>, <b>')}</b>${suggestions.length > 6 ? '...' : ''}`
                : `Chưa tìm được mã trống theo cấu hình năm <b>${cfg.schoolYear}</b>.`;
        }

        if (suggestions.length) {
            input.placeholder = suggestions[0];
            if (autoFill && !window.editingStudentId && !normalizeStudentCode(input.value)) {
                input.value = suggestions[0];
            }
        }
    } catch (error) {
        if (helper) helper.textContent = `Không tải được gợi ý mã HS: ${error.message}`;
    }
}

window.refreshStudentCodeSuggestions = refreshStudentCodeSuggestions;

window.openStudentCodeSettings = async function() {
    if (window.userRole !== 'admin') {
        Swal.fire('Từ chối', 'Chỉ Admin được cài đặt quy tắc mã học sinh.', 'error');
        return;
    }

    const currentYear = _studentCodeAutoSchoolYear();
    const cfg = await loadStudentCodeConfig(currentYear, true);
    const result = await Swal.fire({
        title: 'Cài đặt mã học sinh',
        width: 620,
        html: `
            <div style="text-align:left;font-size:0.9rem">
                <label style="font-weight:600;color:#475569">Năm học</label>
                <input id="scfg-year" class="swal2-input" style="width:100%;margin:6px 0 12px 0" value="${cfg.schoolYear}" placeholder="2025-2026">

                <label style="font-weight:600;color:#475569">Tiền tố mã</label>
                <input id="scfg-prefix" class="swal2-input" style="width:100%;margin:6px 0 12px 0" value="${cfg.prefix}" placeholder="HS2026-">

                <label style="font-weight:600;color:#475569">Hậu tố, nếu có</label>
                <input id="scfg-suffix" class="swal2-input" style="width:100%;margin:6px 0 12px 0" value="${cfg.suffix || ''}" placeholder="Để trống nếu không dùng">

                <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">
                    <div>
                        <label style="font-weight:600;color:#475569">Số chữ số</label>
                        <input id="scfg-digits" type="number" min="1" max="8" class="swal2-input" style="width:100%;margin:6px 0 12px 0" value="${cfg.digits}">
                    </div>
                    <div>
                        <label style="font-weight:600;color:#475569">Bắt đầu từ</label>
                        <input id="scfg-start" type="number" min="1" class="swal2-input" style="width:100%;margin:6px 0 12px 0" value="${cfg.startAt}">
                    </div>
                    <div>
                        <label style="font-weight:600;color:#475569">Số gợi ý</label>
                        <input id="scfg-limit" type="number" min="3" max="50" class="swal2-input" style="width:100%;margin:6px 0 12px 0" value="${cfg.maxSuggestions}">
                    </div>
                </div>

                <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px;margin-top:4px;color:#475569">
                    Ví dụ: tiền tố <b>HS2026-</b>, số chữ số <b>3</b> → hệ thống gợi ý <b>HS2026-001</b>, <b>HS2026-002</b>...
                    Nếu thiếu <b>HS2026-003</b>, ô Mã HS sẽ gợi ý lại mã đó trước.
                </div>
            </div>`,
        showCancelButton: true,
        confirmButtonText: 'Lưu cấu hình',
        cancelButtonText: 'Hủy',
        preConfirm: () => ({
            schoolYear: document.getElementById('scfg-year')?.value || currentYear,
            prefix: document.getElementById('scfg-prefix')?.value || '',
            suffix: document.getElementById('scfg-suffix')?.value || '',
            digits: document.getElementById('scfg-digits')?.value || 3,
            startAt: document.getElementById('scfg-start')?.value || 1,
            maxSuggestions: document.getElementById('scfg-limit')?.value || 12,
        })
    });

    if (!result.isConfirmed) return;
    try {
        const saved = await saveStudentCodeConfig(result.value);
        Swal.fire('Thành công', `Đã lưu cấu hình mã HS năm ${saved.schoolYear}.`, 'success');
        await refreshStudentCodeSuggestions(false);
    } catch (error) {
        Swal.fire('Lỗi', error.message, 'error');
    }
};


window.scanDuplicateStudentCodes = function() {
    const map = {};
    Object.entries(window.localData?.students || {}).forEach(([key, s]) => {
        const code = normalizeStudentCode(s?.code);
        if (!code) return;
        if (!map[code]) map[code] = [];
        map[code].push({ key, id: s.id, code: s.code, name: s.name, class: s.classRoom || s.class || '', status: normalizeStudentStatusValue(s.status || 'active') });
    });
    const duplicated = Object.entries(map)
        .filter(([, list]) => list.length > 1)
        .flatMap(([duplicatedCode, list]) => list.map(item => ({ duplicatedCode, ...item })));
    console.table(duplicated);
    return duplicated;
};

async function buildPaymentClassMoveUpdates(studentKey, studentCode, oldClass, newClass, now) {
    const updates = {};
    if (!studentCode || !newClass || oldClass === newClass) return updates;
    try {
        const snap = await window.get(window.ref(window.db, `${paymentStatusPath()}/${studentCode}`));
        const oldRecord = snap.val();
        if (!oldRecord || typeof oldRecord !== 'object') return updates;
        const newRecord = {
            ...oldRecord,
            studentKey,
            studentCode,
            className: newClass,
            classKey: classKey(newClass),
            schoolYear: window._currentSchoolYear || oldRecord.schoolYear || '',
            updatedAt: now,
            updatedBy: window.currentUser?.email || '',
            updatedByUid: window.currentUser?.uid || '',
        };
        updates[`${paymentStatusPath()}/${studentCode}`] = newRecord;
        if (oldClass) updates[`${paymentStatusClassPath(oldClass)}/${studentCode}`] = null;
        updates[`${paymentStatusClassPath(newClass)}/${studentCode}`] = newRecord;
    } catch (error) {
        console.warn('Không đồng bộ được chỉ mục đóng tiền khi chuyển lớp:', error);
        throw error;
    }
    return updates;
}


function _studentVisibleInSelectedSchoolYear(student, schoolYear) {
    return !isStudentArchived(student, schoolYear);
}

window.setStudentViewMode = function(mode) {
    const nextMode = mode === 'archive' && window.userRole === 'admin' ? 'archive' : 'current';
    if (window._studentViewMode === nextMode) return;
    window._studentViewMode = nextMode;
    window._studentCurrentClass = '';
    renderStudents();
};

export function renderStudents() {
    const selectedSchoolYear = window._currentSchoolYear || '';
    const isAdmin = window.userRole === 'admin';
    const isTeacher = window.userRole === 'teacher';
    if (!isAdmin) window._studentViewMode = 'current';
    const showArchive = isAdmin && window._studentViewMode === 'archive';
    const studentsForYear = Object.values(window.localData.students || {});
    const activeCount = studentsForYear.filter(s => _studentVisibleInSelectedSchoolYear(s, selectedSchoolYear)).length;
    const archiveCount = studentsForYear.filter(s => isStudentArchived(s, selectedSchoolYear)).length;
    let allStudents = studentsForYear.filter(s => showArchive
        ? isStudentArchived(s, selectedSchoolYear)
        : _studentVisibleInSelectedSchoolYear(s, selectedSchoolYear)
    );
    if (window.userRole === 'teacher' && window.teacherClass) {
        allStudents = allStudents.filter(s =>
            s.classRoom === window.teacherClass || s.class === window.teacherClass ||
            s.schoolYearHistory?.[String(selectedSchoolYear).replace('-', '_')]?.classRoom === window.teacherClass
        );
    }
    const classes = [...new Set(allStudents.map(s => s.classRoom || s.class).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b, 'vi'));

    if (!window._studentCurrentClass || !classes.includes(window._studentCurrentClass)) {
        window._studentCurrentClass = classes[0] || '';
    }

    document.getElementById('content').innerHTML = `
        <div style="margin-bottom:12px;display:flex;gap:8px;flex-wrap:wrap;align-items:center">
            <button class="btn ${showArchive ? 'btn-outline' : 'btn-primary'}" onclick="setStudentViewMode('current')">
                <i class="fas fa-user-graduate"></i> Đang quản lý <span style="opacity:.8">(${activeCount})</span>
            </button>
            ${isAdmin ? `<button class="btn ${showArchive ? 'btn-primary' : 'btn-outline'}" onclick="setStudentViewMode('archive')">
                <i class="fas fa-archive"></i> Lưu trữ <span style="opacity:.8">(${archiveCount})</span>
            </button>` : ''}
        </div>
        ${showArchive ? `<div style="background:#eff6ff;border:1px solid #bfdbfe;color:#1e3a8a;border-radius:10px;padding:11px 14px;margin-bottom:14px;font-size:.9rem">
            <i class="fas fa-archive"></i> <b>Hồ sơ lưu trữ:</b> học sinh hoàn thành tiểu học hoặc đã nghỉ học được giữ nguyên học bạ, điểm danh và lịch sử liên quan.
        </div>` : ''}
        <div style="margin-bottom:14px;display:flex;gap:10px;flex-wrap:wrap;align-items:center">
            ${(isAdmin || isTeacher) && !showArchive ? `
                <button class="btn btn-primary" onclick="openStudentModal()"><i class="fas fa-plus"></i> Thêm Học sinh</button>
                ${isAdmin ? `<button class="btn btn-outline" onclick="openStudentCodeSettings()"><i class="fas fa-id-card"></i> Cài mã HS</button>` : ''}
                <button class="btn btn-outline" onclick="printQrForFilteredStudents()"><i class="fas fa-qrcode"></i> In QR lớp</button>
                <button class="btn btn-success" onclick="exportExcel()"><i class="fas fa-file-excel"></i> Xuất Excel lớp/bộ lọc</button>
                <button class="btn btn-outline" onclick="downloadStudentTemplate()"><i class="fas fa-download"></i> Tải mẫu Excel</button>
                <label class="btn btn-warning" style="margin:0">
                    <i class="fas fa-upload"></i> Nhập Excel
                    <input type="file" accept=".xlsx,.xls" onchange="importExcel(this)" style="display:none">
                </label>` : ''}
            ${(isAdmin || isTeacher) && showArchive ? `<button class="btn btn-success" onclick="exportExcel()"><i class="fas fa-file-excel"></i> Xuất Excel lưu trữ</button>` : ''}
        </div>
        <div style="background:white;border-radius:10px;padding:12px 16px;margin-bottom:16px;
                    box-shadow:0 1px 3px rgba(0,0,0,0.08);display:flex;gap:8px;flex-wrap:wrap;align-items:center">
            <span style="color:#64748b;font-size:0.85rem;font-weight:600;margin-right:4px">
                <i class="fas fa-layer-group"></i> Lớp:
            </span>
            ${classes.map(c => `
                <button id="classtab-${c}" onclick="switchStudentClass('${c}')"
                    class="btn btn-sm ${c === window._studentCurrentClass ? 'btn-primary' : 'btn-outline'}"
                    style="font-size:0.82rem;padding:5px 14px">${c}</button>
            `).join('')}
            ${classes.length === 0 ? '<span style="color:#94a3b8">Chưa có lớp nào</span>' : ''}
        </div>
        <div style="background:white;border-radius:10px;padding:14px 16px;margin-bottom:16px;
                    box-shadow:0 1px 3px rgba(0,0,0,0.08);display:flex;gap:10px;flex-wrap:wrap;align-items:center">
            <div style="position:relative;flex:1;min-width:180px">
                <i class="fas fa-search" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:#94a3b8;font-size:0.85rem"></i>
                <input id="sf-search" type="text" placeholder="Tìm tên hoặc mã HS..."
                    oninput="applyStudentFilter()"
                    style="width:100%;padding:8px 10px 8px 32px;border:1px solid #e2e8f0;border-radius:7px;font-size:0.88rem;outline:none"
                    onfocus="this.style.borderColor='var(--primary)'" onblur="this.style.borderColor='#e2e8f0'">
            </div>
            <select id="sf-gender" onchange="applyStudentFilter()"
                style="padding:8px 12px;border:1px solid #e2e8f0;border-radius:7px;font-size:0.88rem;background:white;outline:none;cursor:pointer;min-width:120px">
                <option value="">Tất cả giới tính</option>
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
            </select>
            <select id="sf-status" onchange="applyStudentFilter()"
                style="padding:8px 12px;border:1px solid #e2e8f0;border-radius:7px;font-size:0.88rem;background:white;outline:none;cursor:pointer;min-width:130px">
                <option value="">${showArchive ? 'Tất cả hồ sơ lưu trữ' : 'Tất cả trạng thái'}</option>
                ${showArchive ? `
                    <option value="graduated">Hoàn thành tiểu học</option>
                    <option value="inactive">Nghỉ học</option>
                ` : `
                    <option value="active">Đang học</option>
                    <option value="reserved">Bảo lưu</option>
                `}
            </select>
            <select id="sf-economy" onchange="applyStudentFilter()"
                style="padding:8px 12px;border:1px solid #e2e8f0;border-radius:7px;font-size:0.88rem;background:white;outline:none;cursor:pointer;min-width:135px">
                <option value="">Tất cả hoàn cảnh kinh tế</option>
                <option value="Thấp">Kinh tế Thấp</option>
                <option value="Khó khăn">Khó khăn</option>
                <option value="Hộ nghèo">Hộ nghèo</option>
                <option value="Hộ cận nghèo">Hộ cận nghèo</option>
                <option value="Trung bình">Trung bình</option>
                <option value="Khá">Khá</option>
            </select>
            <select id="sf-sort" onchange="applyStudentFilter()"
                style="padding:8px 12px;border:1px solid #e2e8f0;border-radius:7px;font-size:0.88rem;background:white;outline:none;cursor:pointer;min-width:140px">
                <option value="name_az">Tên A → Z</option>
                <option value="name_za">Tên Z → A</option>
                <option value="dob">Ngày sinh</option>
                <option value="code">Mã HS</option>
            </select>
            <button onclick="resetStudentFilter()" class="btn btn-outline btn-sm" style="white-space:nowrap;font-size:0.85rem">
                <i class="fas fa-times"></i> Xóa lọc
            </button>
            <span id="sf-count" style="color:#64748b;font-size:0.85rem;white-space:nowrap;margin-left:auto"></span>
        </div>
        <div class="table-wrapper">
            <table>
                <thead>
                    <tr>
                        <th>STT</th><th>Mã HS</th><th>Họ tên & Khảo sát</th>
                        <th>Giới tính</th><th>Ngày sinh</th><th>Kinh tế gia đình</th><th>Trạng thái</th>
                        ${isAdmin ? '<th>Thao tác</th>' : ''}
                        ${window.userRole === 'teacher' ? '<th>Thao tác</th>' : ''}
                    </tr>
                </thead>
                <tbody id="student-tbody"></tbody>
            </table>
        </div>`;

    window._allStudents = allStudents;
    applyStudentFilter();
}

window.switchStudentClass = function(cls) {
    window._studentCurrentClass = cls;
    document.querySelectorAll('[id^="classtab-"]').forEach(btn => {
        btn.className = 'btn btn-sm btn-outline';
        btn.style.cssText += ';font-size:0.82rem;padding:5px 14px';
    });
    const active = document.getElementById(`classtab-${cls}`);
    if (active) active.className = 'btn btn-sm btn-primary';
    const sf = document.getElementById('sf-search');
    if (sf) sf.value = '';
    applyStudentFilter();
};

export function applyStudentFilter() {
    const search  = (document.getElementById('sf-search')?.value || '').toLowerCase().trim();
    const gender  = document.getElementById('sf-gender')?.value  || '';
    const status  = document.getElementById('sf-status')?.value  || '';
    const economy = document.getElementById('sf-economy')?.value || '';
    const sort    = document.getElementById('sf-sort')?.value    || 'name_az';
    const cls     = window._studentCurrentClass;

    let students = (window._allStudents || []).filter(s => (s.classRoom || s.class || '') === cls);
    const totalInClass = students.length;

    if (search) students = students.filter(s =>
        (s.name||'').toLowerCase().includes(search) ||
        (s.code||'').toLowerCase().includes(search) ||
        (s.id||'').toLowerCase().includes(search)
    );
    if (gender) students = students.filter(s => (s.gender||'') === gender);
    if (status) students = students.filter(s => normalizeStudentStatusValue(s.status || 'active') === normalizeStudentStatusValue(status));
    if (economy) students = students.filter(s => (s.familyEconomy || '').toLowerCase() === economy.toLowerCase());

    const cmpFn = typeof compareStudentNames === 'function' ? compareStudentNames : window.compareStudentNames;
    if      (sort === 'name_az') students.sort((a,b) => cmpFn ? cmpFn(a,b,'name_az') : (a.name||'').localeCompare(b.name||'','vi'));
    else if (sort === 'name_za') students.sort((a,b) => cmpFn ? cmpFn(a,b,'name_za') : (b.name||'').localeCompare(a.name||'','vi'));
    else if (sort === 'dob')     students.sort((a,b) => (a.dob||'').localeCompare(b.dob||''));
    else if (sort === 'code')    students.sort((a,b) => (a.code||a.id||'').localeCompare(b.code||b.id||'', 'vi', { numeric: true }));

    // Lưu đúng tập kết quả đang hiển thị để chức năng Xuất Excel lấy theo lớp/bộ lọc.
    window._studentFilteredStudents = [...students];

    const countEl = document.getElementById('sf-count');
    const listLabel = window.userRole === 'admin' && window._studentViewMode === 'archive' ? 'hồ sơ lưu trữ' : 'học sinh';
    if (countEl) countEl.textContent = students.length < totalInClass
        ? `Hiển thị ${students.length} / ${totalInClass} ${listLabel} lớp ${cls}`
        : `${totalInClass} ${listLabel} - Lớp ${cls}`;

    const statusInfo = {
        active:   { badge:'badge-success', text:'Đang học' },
        inactive: { badge:'badge-danger',  text:'Nghỉ học' },
        reserved:  { badge:'badge-warning', text:'Bảo lưu'  },
        graduated: { badge:'badge-info',    text:'Hoàn thành tiểu học' }
    };
    const isAdmin = window.userRole === 'admin';
    const showArchive = isAdmin && window._studentViewMode === 'archive';

    const rows = students.map((s, i) => {
        const normalizedStatus = normalizeStudentStatusValue(s.status || 'active');
        const si   = statusInfo[normalizedStatus] || statusInfo['active'];
        const code = s.code || s.id;
        const caregiverBadge = s.primaryCaregiver
            ? `<div style="margin-top:2px"><span class="badge-caregiver" title="Người nuôi dưỡng chính"><i class="fas fa-heart" style="font-size:0.65rem"></i> ${safeText(s.primaryCaregiver)}</span></div>`
            : (s.livingWith ? `<div style="margin-top:2px"><span style="font-size:0.75rem; color:#64748b"><i class="fas fa-user-friends"></i> ${safeText(s.livingWith)}</span></div>` : '');
        const ecoBadge = s.familyEconomy
            ? `<span class="badge ${s.familyEconomy === 'Thấp' || s.familyEconomy === 'Hộ nghèo' || s.familyEconomy === 'Khó khăn' ? 'badge-danger' : 'badge-info'}" style="font-size:0.75rem">${safeText(s.familyEconomy)}</span>`
            : '<span style="color:#94a3b8;font-size:0.8rem">-</span>';
        return `<tr>
            <td>${i+1}</td><td>${code}</td>
            <td>
                <strong>${s.name}</strong>
                ${caregiverBadge}
            </td>
            <td>${s.gender||'-'}</td><td>${formatStudentDob(s.dob)}</td>
            <td>${ecoBadge}</td>
            <td><span class="badge ${si.badge}">${si.text}</span></td>
            ${isAdmin ? `<td style="white-space:nowrap">
                <button class="btn btn-sm btn-info" onclick="viewStudentSurvey('${s.id}')" title="Xem & In Bản khảo sát thông tin" style="margin-right:3px"><i class="fas fa-file-invoice"></i></button>
                <button class="btn btn-sm btn-outline" onclick="showStudentQr('${s.id || code}')" title="Mã QR" style="margin-right:3px"><i class="fas fa-qrcode"></i></button>
                <button class="btn btn-sm btn-primary" onclick="editStudent('${s.id}')" title="Sửa"><i class="fas fa-edit"></i></button>
                ${!showArchive ? `<button class="btn btn-sm btn-warning" onclick="openTransferModal('${s.id}')" title="Chuyển lớp" style="margin-left:3px"><i class="fas fa-exchange-alt"></i></button>
                <button class="btn btn-sm btn-outline" onclick="deleteStudent('${s.id}')" title="Đánh dấu nghỉ học, vẫn giữ hồ sơ" style="margin-left:3px"><i class="fas fa-archive"></i></button>` : ''}
                ${normalizedStatus === 'inactive' ? `<button class="btn btn-sm btn-danger" onclick="permanentlyDeleteStudent('${s.id}')" title="Xóa vĩnh viễn học sinh" aria-label="Xóa vĩnh viễn học sinh" style="margin-left:3px;white-space:nowrap"><i class="fas fa-trash-alt"></i> Xóa</button>` : ''}
            </td>` : ''}
            ${window.userRole === 'teacher' ? `<td style="white-space:nowrap">
                <button class="btn btn-sm btn-info" onclick="viewStudentSurvey('${s.id}')" title="Xem & In Bản khảo sát thông tin" style="margin-right:3px"><i class="fas fa-file-invoice"></i></button>
                <button class="btn btn-sm btn-outline" onclick="showStudentQr('${s.id || code}')" title="Mã QR" style="margin-right:3px"><i class="fas fa-qrcode"></i></button>
                <button class="btn btn-sm btn-primary" onclick="editStudent('${s.id}')" title="Sửa thông tin" style="margin-right:3px">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-success" onclick="sendFeedback('${code}','${s.name.replace(/'/g,"\\'")}')" title="Gửi phản hồi">
                    <i class="fas fa-comment"></i>
                </button>
            </td>` : ''}
        </tr>`;
    }).join('');

    const tbody = document.getElementById('student-tbody');
    if (tbody) tbody.innerHTML = rows || `
        <tr><td colspan="8" style="text-align:center;padding:30px;color:#94a3b8">
            <i class="fas fa-search" style="font-size:1.5rem;display:block;margin-bottom:8px"></i>
            Không tìm thấy học sinh nào trong lớp ${cls}
        </td></tr>`;
}

export function cycleSortStudent(field) {
    const sel = document.getElementById('sf-sort');
    if (!sel) return;
    const cur = sel.value;
    if (field === 'name') sel.value = cur === 'name_az' ? 'name_za' : 'name_az';
    applyStudentFilter();
}

export function resetStudentFilter() {
    ['sf-search','sf-gender','sf-status','sf-economy'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    const sort = document.getElementById('sf-sort');
    if (sort) sort.value = 'name_az';
    applyStudentFilter();
}

// ── CRUD ──────────────────────────────────────────────────────────────────────
export function openStudentModal() {
    window.editingStudentId = null;
    document.getElementById('modal-student-title').textContent = 'Thêm Học sinh (Bản khảo sát)';
    const form = document.getElementById('student-form');
    form.reset();
    ensureStudentStatusSelectOptions(form);
    setStudentStatusSelectValue(form, 'active');
    ensureStudentCodeAssistUi(form);
    refreshStudentCodeSuggestions(true);
    const defaultClass = (window.userRole === 'teacher' ? window.teacherClass : '') || window._studentCurrentClass || '';
    if (defaultClass && form?.elements?.classRoom) {
        form.elements.classRoom.value = defaultClass;
    }
    const tbody = document.getElementById('family-members-tbody');
    if (tbody) {
        tbody.innerHTML = '';
        addFamilyMemberRow();
    }
    setRadioVal('studentLabor', 'Không lao động');
    window.switchStudentTab('tab-hs-basic');
    document.getElementById('modal-student').style.display = 'flex';
}

export function editStudent(id) {
    const student = window.localData.students[id];
    if (!student) return;
    window.editingStudentId = id;
    document.getElementById('modal-student-title').textContent = 'Sửa Hồ sơ Học sinh';
    const form   = document.getElementById('student-form');
    ensureStudentStatusSelectOptions(form);
    ensureStudentCodeAssistUi(form);
    refreshStudentCodeSuggestions(false);
    const setVal = (name, val) => { const el = form.elements[name]; if (el) el.value = val || ''; };

    // 1. Định danh & cơ bản
    setVal('code', student.code);
    setVal('name', student.name);
    setVal('classRoom', student.classRoom || student.class);
    setVal('gender', student.gender || 'Nam');
    setVal('dob', student.dob);
    setVal('birthPlace', student.birthPlace);
    setVal('nationalId', student.nationalId);
    setStudentStatusSelectValue(form, student.status || 'active');
    setVal('enrollDate', student.enrollDate);

    // 2. Liên lạc
    setVal('phone', student.phone);
    setVal('facebook', student.facebook);
    setVal('zalo', student.zalo);
    setVal('sosPhone', student.sosPhone);

    // 3. Địa chỉ
    setVal('currentAddress', student.currentAddress || student.temporaryAddress);
    setVal('permanentAddress', student.permanentAddress);

    // 4. Tôn giáo
    setVal('religion', student.religion || 'Không tôn giáo');
    setVal('religionOther', student.religionOther);
    window.toggleReligionFields(student.religion || 'Không tôn giáo');
    setVal('parish', student.parish);
    setVal('catechismClass', student.catechismClass);
    setVal('churchGroup', student.churchGroup);

    // 5. Nơi ở & hoàn cảnh sống
    setRadioVal('livingWith', student.livingWith || '');
    setVal('livingWithOtherDetail', student.livingWithOtherDetail);
    setRadioVal('housingType', student.housingType || '');
    setVal('housingTypeOtherDetail', student.housingTypeOtherDetail);
    setVal('houseArea', student.houseArea);
    setRadioVal('houseStructure', student.houseStructure || '');
    setVal('houseStructureOtherDetail', student.houseStructureOtherDetail);

    // 6. Lao động & sức khỏe
    setRadioVal('studentLabor', student.studentLabor || 'Không lao động');
    setVal('studentLaborIncome', student.studentLaborIncome);
    setVal('studentLaborJob', student.studentLaborJob);
    setVal('studentLaborTime', student.studentLaborTime);
    setVal('healthNotes', student.healthNotes);

    // 7. Giấy tờ pháp lý
    setVal('docBirthCert', student.docBirthCert || (student.birthCert ? 'Có' : ''));
    setVal('docBirthCertReason', student.docBirthCertReason);
    setVal('docResidence', student.docResidence || (student.residenceCert ? 'Có' : ''));
    setVal('docResidenceReason', student.docResidenceReason);
    setVal('docCccd', student.docCccd || '');
    setVal('docNationalDb', student.docNationalDb || '');
    setVal('docNationalDbReason', student.docNationalDbReason);

    // Cha
    setVal('dadName', student.dadName);
    setVal('dadBirthYear', student.dadBirthYear);
    setVal('dadReligion', student.dadReligion);
    setVal('dadJob', student.dadJob);
    setVal('dadJobStable', student.dadJobStable || 'Ổn định');
    setVal('dadIncome', student.dadIncome);
    setVal('dadPhone', student.dadPhone);
    setVal('dadMaritalStatus', student.dadMaritalStatus);
    setVal('dadEducation', student.dadEducation);
    setVal('dadBhyt', student.dadBhyt || 'Có');
    setVal('dadBhtn', student.dadBhtn || 'Có');
    setVal('dadNoBhReason', student.dadNoBhReason);

    // Mẹ
    setVal('momName', student.momName);
    setVal('momBirthYear', student.momBirthYear);
    setVal('momReligion', student.momReligion);
    setVal('momJob', student.momJob);
    setVal('momJobStable', student.momJobStable || 'Ổn định');
    setVal('momIncome', student.momIncome);
    setVal('momPhone', student.momPhone);
    setVal('momMaritalStatus', student.momMaritalStatus);
    setVal('momEducation', student.momEducation);
    setVal('momBhyt', student.momBhyt || 'Có');
    setVal('momBhtn', student.momBhtn || 'Có');
    setVal('momBhOther', student.momBhOther);

    // Giám hộ
    setVal('guardianName', student.guardianName);
    setVal('guardianBirthYear', student.guardianBirthYear);
    setVal('guardianReligion', student.guardianReligion);
    setVal('guardianJob', student.guardianJob);
    setVal('guardianJobStable', student.guardianJobStable || 'Ổn định');
    setVal('guardianIncome', student.guardianIncome);
    setVal('guardianPhone', student.guardianPhone);
    setVal('guardianMaritalStatus', student.guardianMaritalStatus);
    setVal('guardianEducation', student.guardianEducation);
    setVal('guardianBhyt', student.guardianBhyt);
    setVal('guardianBhtn', student.guardianBhtn);
    setVal('guardianBhOther', student.guardianBhOther);

    // Bảng thành viên gia đình
    const tbody = document.getElementById('family-members-tbody');
    if (tbody) {
        tbody.innerHTML = '';
        const list = Array.isArray(student.familyMembers) && student.familyMembers.length ? student.familyMembers : [{}];
        list.forEach(m => addFamilyMemberRow(m));
    }

    // Hoàn cảnh & khảo sát
    setVal('primaryCaregiver', student.primaryCaregiver || (student.livingWith === 'Mẹ ruột' ? 'Mẹ ruột' : (student.livingWith === 'Cha ruột' ? 'Cha ruột' : '')));
    setVal('familyCircumstance', student.familyCircumstance);
    setVal('familyEconomy', student.familyEconomy || 'Thấp');
    setVal('workerCount', student.workerCount);
    setVal('outsideSupport', student.outsideSupport);
    setVal('housematesCount', student.housematesCount);
    setVal('siblingsInPc', student.siblingsInPc);
    setVal('notes', student.notes);

    window.switchStudentTab('tab-hs-basic');
    document.getElementById('modal-student').style.display = 'flex';
}

// ═══════════════════════════════════════════════════════
// V5.30.0 — Mã QR riêng cho học sinh
// ═══════════════════════════════════════════════════════
const STUDENT_QR_VERSION = 'v1';

function formatStudentDob(value) {
    if (value === null || value === undefined || String(value).trim() === '') return '-';
    const text = String(value).trim();
    const iso = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (iso) return `${String(iso[3]).padStart(2, '0')}/${String(iso[2]).padStart(2, '0')}/${iso[1]}`;
    const slash = text.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (slash) return `${String(slash[1]).padStart(2, '0')}/${String(slash[2]).padStart(2, '0')}/${slash[3]}`;
    return text;
}
window.formatStudentDob = formatStudentDob;

function safeText(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function getStudentDbKeyByCodeOrId(studentCodeOrKey) {
    const target = normalizeStudentCode(studentCodeOrKey);
    if (!target) return '';
    if (window.localData?.students?.[target]) return target;
    const entry = Object.entries(window.localData?.students || {}).find(([key, s]) => {
        const code = normalizeStudentCode(s?.code || s?.id || '');
        return key === target || code === target || normalizeStudentCode(s?.id || '') === target;
    });
    return entry ? entry[0] : '';
}

function buildStudentQrPayload(studentKey, student = {}) {
    const code = normalizeStudentCode(student.code || student.id || studentKey);
    const origin = window.location.origin;
    const path = window.location.pathname || '/login.html';
    const basePath = path.endsWith('/') ? `${path}login.html` : path;
    const fallbackUrl = `${origin}${basePath}?studentQr=${encodeURIComponent(code)}&qrAction=pdf`;
    const storageEnabled = window.FIREBASE_FEATURES?.storage === true;
    return {
        qrVersion: storageEnabled ? 'storage-v1' : 'spark-link-v1',
        qrStudentCode: code,
        qrUrl: storageEnabled && student.qrPdfUrl ? student.qrPdfUrl : fallbackUrl,
        qrUpdatedAt: typeof window.serverNow === 'function' ? window.serverNow() : Date.now(),
    };
}

function buildQrImageUrl(text, size = 220) {
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=12&data=${encodeURIComponent(text)}`;
}

function studentDisplaySummary(student = {}, studentKey = '') {
    const status = normalizeStudentStatusValue(student.status || 'active');
    const statusLabel = {
        active: 'Đang học',
        inactive: 'Nghỉ học',
        reserved: 'Bảo lưu',
        graduated: 'Hoàn thành'
    }[status] || status;
    return {
        code: student.code || student.id || studentKey,
        name: student.name || student.fullName || '',
        classRoom: student.classRoom || student.class || '',
        gender: student.gender || '',
        dob: student.dob || student.birthDate || '',
        statusLabel,
        fatherName: student.dadName || student.fatherName || student.father || '',
        motherName: student.momName || student.motherName || student.mother || '',
        sosPhone: student.sosPhone || student.emergencyPhone || student.phone || '',
        address: student.temporaryAddress || student.permanentAddress || student.address || '',
    };
}

function qrStudentInfoHtml(studentKey, student, qrUrl) {
    const s = studentDisplaySummary(student, studentKey);
    return `
        <div id="student-qr-card" style="text-align:left;font-family:Arial,sans-serif">
            <div style="display:grid;grid-template-columns:250px 1fr;gap:20px;align-items:start">
                <div style="text-align:center;border:1px solid #e2e8f0;border-radius:14px;padding:14px;background:#fff">
                    <img src="${buildQrImageUrl(qrUrl, 230)}" alt="QR học sinh" style="width:230px;height:230px;max-width:100%">
                    <div style="font-weight:800;color:#1e293b;margin-top:8px">${safeText(s.code)}</div>
                    <div style="font-size:0.78rem;color:#64748b;word-break:break-all;margin-top:4px">${safeText(qrUrl)}</div>
                </div>
                <div>
                    <div style="font-size:1.25rem;font-weight:900;color:#1e293b;margin-bottom:10px">
                        ${safeText(s.name || 'Học sinh')}
                    </div>
                    <table style="width:100%;border-collapse:collapse;font-size:0.92rem">
                        <tbody>
                            ${[
                                ['Mã học sinh', s.code], ['Lớp', s.classRoom], ['Giới tính', s.gender],
                                ['Ngày sinh', formatStudentDob(s.dob)], ['Trạng thái', s.statusLabel], ['SĐT khẩn cấp', s.sosPhone],
                                ['Cha', s.fatherName], ['Mẹ', s.motherName], ['Địa chỉ', s.address],
                            ].map(([k,v]) => `
                                <tr>
                                    <td style="width:150px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:700;padding:8px;color:#475569">${safeText(k)}</td>
                                    <td style="border:1px solid #e2e8f0;padding:8px;color:#1e293b">${safeText(v || '—')}</td>
                                </tr>`).join('')}
                        </tbody>
                    </table>
                    <div style="margin-top:12px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:10px;color:#1d4ed8;font-size:0.86rem">
                        <i class="fas fa-info-circle"></i>
                        QR chỉ mở hồ sơ trong hệ thống. Dữ liệu vẫn phụ thuộc quyền tài khoản đang đăng nhập.
                    </div>
                </div>
            </div>
        </div>`;
}

async function ensureStudentQrStored(studentKey, student) {
    if (!studentKey || !student) return buildStudentQrPayload(studentKey, student);
    const payload = buildStudentQrPayload(studentKey, student);
    if (student.qrUrl !== payload.qrUrl || student.qrStudentCode !== payload.qrStudentCode || !student.qrVersion) {
        try {
            await window.update(window.ref(window.db, `students/${studentKey}`), payload);
            Object.assign(student, payload);
        } catch (error) {
            console.warn('[Smart School V5.30] Không lưu được QR vào hồ sơ học sinh:', error);
        }
    }
    return payload;
}


async function readStudentHocBaSummary(studentKey) {
    const yearKey = (window._currentSchoolYear || '').replace('-', '_');
    if (!studentKey || !yearKey) return {};
    try {
        const [hocbaSnap, promoSnap] = await Promise.all([
            window.get(window.ref(window.db, `hocba/${studentKey}/${yearKey}`)),
            window.get(window.ref(window.db, `promotionStatus/${yearKey}/${studentKey}`))
        ]);
        return {
            yearKey,
            hocba: hocbaSnap.val() || {},
            promotion: promoSnap.val() || {}
        };
    } catch (error) {
        console.warn('[Smart School V5.30.1] Không đọc được học bạ tóm tắt:', error);
        return { yearKey, hocba: {}, promotion: {} };
    }
}

function scoreLevelText(value, kind = 'subject') {
    if (!value) return '—';
    const v = String(value).trim();
    if (kind === 'subject') {
        return ({T:'Tốt', H:'Hoàn thành', C:'Cần cố gắng'}[v] || v);
    }
    return ({T:'Tốt', Đ:'Đạt', D:'Đạt', C:'Cần cố gắng'}[v] || v);
}

function buildSubjectRows(hocba = {}) {
    const year = window._currentSchoolYear || '';
    const semesterBlocks = [
        ['Giữa HK1', hocba.ghk1_subjects || hocba.ghk1 || {}],
        ['HK1', hocba.hk1_subjects || hocba.hk1 || {}],
        ['Giữa HK2', hocba.ghk2_subjects || hocba.ghk2 || {}],
        ['HK2', hocba.hk2_subjects || hocba.hk2 || hocba.subjects || {}],
    ];

    const rows = [];
    semesterBlocks.forEach(([label, block]) => {
        Object.entries(block || {}).forEach(([subject, data]) => {
            if (!data || typeof data !== 'object') return;
            rows.push(`
                <tr>
                    <td>${safeText(label)}</td>
                    <td>${safeText(subject)}</td>
                    <td>${safeText(data.mucDat || data.level || '—')}</td>
                    <td>${safeText(data.diem ?? data.score ?? data.diemKtDk ?? '—')}</td>
                    <td>${safeText(data.nhanXet || data.comment || '')}</td>
                </tr>`);
        });
    });

    return rows.join('') || `<tr><td colspan="5" style="text-align:center;color:#64748b">Chưa có dữ liệu đánh giá môn học trong năm học ${safeText(year)}</td></tr>`;
}

function buildTraitRows(title, block = {}) {
    const rows = Object.entries(block || {}).map(([name, data]) => {
        const value = data && typeof data === 'object' ? (data.mucDat || data.level || data.value || '') : data;
        const comment = data && typeof data === 'object' ? (data.nhanXet || data.comment || '') : '';
        return `<tr><td>${safeText(title)}</td><td>${safeText(name)}</td><td>${safeText(value || '—')}</td><td>${safeText(comment || '')}</td></tr>`;
    });
    return rows.join('');
}

function buildStudentDocumentHtml(studentKey, student, payload, summary = {}) {
    const s = studentDisplaySummary(student, studentKey);
    const hocba = summary.hocba || {};
    const promotion = summary.promotion || {};
    const year = window._currentSchoolYear || '';
    const printDate = new Date().toLocaleString('vi-VN');

    const traitsHtml = [
        buildTraitRows('Phẩm chất HK1', hocba.hk1_phamChat || {}),
        buildTraitRows('Năng lực chung HK1', hocba.hk1_nangLucChung || {}),
        buildTraitRows('Năng lực đặc thù HK1', hocba.hk1_nangLucDacThu || {}),
        buildTraitRows('Phẩm chất giữa HK1', hocba.ghk1_phamChat || {}),
        buildTraitRows('Năng lực chung giữa HK1', hocba.ghk1_nangLucChung || {}),
        buildTraitRows('Năng lực đặc thù giữa HK1', hocba.ghk1_nangLucDacThu || {}),
        buildTraitRows('Phẩm chất HK2', hocba.hk2_phamChat || hocba.phamChat || {}),
        buildTraitRows('Năng lực chung HK2', hocba.hk2_nangLucChung || hocba.nangLucChung || {}),
        buildTraitRows('Năng lực đặc thù HK2', hocba.hk2_nangLucDacThu || hocba.nangLucDacThu || {}),
        buildTraitRows('Phẩm chất giữa HK2', hocba.ghk2_phamChat || {}),
        buildTraitRows('Năng lực chung giữa HK2', hocba.ghk2_nangLucChung || {}),
        buildTraitRows('Năng lực đặc thù giữa HK2', hocba.ghk2_nangLucDacThu || {}),
    ].filter(Boolean).join('');

    const promotionLabel = ({
        len_lop: 'Lên lớp',
        o_lai: 'Ở lại',
        bao_luu: 'Bảo lưu',
        nghi_hoc: 'Nghỉ học'
    }[promotion.status] || promotion.status || 'Chưa xác nhận');

    return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<title>Phiếu thông tin học sinh ${safeText(s.code)}</title>
<style>
@page { size: A4; margin: 12mm; }
* { box-sizing: border-box; }
body { font-family: Arial, "Times New Roman", sans-serif; color:#0f172a; margin:0; font-size:12px; }
.header { display:flex; justify-content:space-between; gap:16px; align-items:flex-start; border-bottom:3px solid #1e3a8a; padding-bottom:10px; margin-bottom:12px; }
.school { text-transform:uppercase; font-weight:800; color:#1e3a8a; font-size:13px; }
.title { font-size:20px; font-weight:900; margin:6px 0 2px; color:#111827; }
.subtitle { color:#475569; font-size:12px; }
.qr { text-align:center; border:1px solid #cbd5e1; border-radius:8px; padding:8px; width:118px; }
.qr img { width:96px; height:96px; display:block; margin:0 auto 4px; }
.section-title { background:#1e3a8a; color:white; padding:6px 9px; font-weight:800; border-radius:6px 6px 0 0; margin-top:10px; }
table { width:100%; border-collapse:collapse; }
td, th { border:1px solid #cbd5e1; padding:5px 7px; vertical-align:top; }
th { background:#f1f5f9; color:#334155; text-align:left; font-weight:800; }
.label { background:#f8fafc; font-weight:800; width:150px; color:#334155; }
.grid2 { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
.footer { margin-top:12px; color:#64748b; font-size:10px; display:flex; justify-content:space-between; border-top:1px solid #e2e8f0; padding-top:6px; }
@media print { .no-print { display:none !important; } body { print-color-adjust:exact; -webkit-print-color-adjust:exact; } }
</style>
</head>
<body>
<div class="no-print" style="position:sticky;top:0;background:#fff;padding:8px;border-bottom:1px solid #e2e8f0;margin-bottom:10px">
    <button onclick="window.print()" style="padding:8px 12px;font-weight:700">In / Lưu PDF</button>
</div>

<div class="header">
    <div>
        <div class="school">FMA Nam Hòa</div>
        <div class="title">PHIẾU THÔNG TIN HỌC SINH</div>
        <div class="subtitle">Năm học: ${safeText(year || '—')} | Ngày xuất: ${safeText(printDate)}</div>
    </div>
    <div class="qr">
        <img src="${buildQrImageUrl(payload.qrUrl, 180)}">
        <div style="font-weight:800">${safeText(s.code)}</div>
    </div>
</div>

<div class="section-title">1. Thông tin cơ bản</div>
<table>
    <tr><td class="label">Mã học sinh</td><td>${safeText(s.code)}</td><td class="label">Họ và tên</td><td>${safeText(s.name)}</td></tr>
    <tr><td class="label">Lớp</td><td>${safeText(s.classRoom || '—')}</td><td class="label">Trạng thái</td><td>${safeText(s.statusLabel || '—')}</td></tr>
    <tr><td class="label">Giới tính</td><td>${safeText(s.gender || '—')}</td><td class="label">Ngày sinh</td><td>${safeText(formatStudentDob(s.dob))}</td></tr>
    <tr><td class="label">SĐT khẩn cấp</td><td>${safeText(s.sosPhone || '—')}</td><td class="label">Địa chỉ</td><td>${safeText(s.address || '—')}</td></tr>
    <tr><td class="label">Cha</td><td>${safeText(s.fatherName || '—')}</td><td class="label">Mẹ</td><td>${safeText(s.motherName || '—')}</td></tr>
</table>

<div class="section-title">2. Bảng đánh giá môn học / hoạt động giáo dục</div>
<table>
    <thead><tr><th>Thời điểm</th><th>Môn học</th><th>Mức</th><th>Điểm</th><th>Nhận xét</th></tr></thead>
    <tbody>${buildSubjectRows(hocba)}</tbody>
</table>

<div class="section-title">3. Bảng phẩm chất và năng lực</div>
<table>
    <thead><tr><th>Nhóm</th><th>Nội dung</th><th>Mức</th><th>Nhận xét</th></tr></thead>
    <tbody>${traitsHtml || `<tr><td colspan="4" style="text-align:center;color:#64748b">Chưa có dữ liệu phẩm chất/năng lực</td></tr>`}</tbody>
</table>

<div class="section-title">4. Kết quả cuối năm</div>
<table>
    <tr><td class="label">Kết quả giáo dục</td><td>${safeText((hocba.ketQua && (hocba.ketQua.muc || hocba.ketQua.level || hocba.ketQua.result)) || hocba.ketQua || '—')}</td></tr>
    <tr><td class="label">Khen thưởng</td><td>${safeText((hocba.khenThuong && (hocba.khenThuong.noiDung || hocba.khenThuong.content)) || hocba.khenThuong || '—')}</td></tr>
    <tr><td class="label">Trạng thái lên lớp</td><td>${safeText(promotionLabel)}</td></tr>
</table>

<div class="footer">
    <span>Phiếu được tạo tự động từ FMA Nam Hòa.</span>
    <span>${safeText(s.code)}</span>
</div>
</body>
</html>`;
}

async function exportStudentDocument(studentKeyOrCode, format = 'pdf', autoClose = false) {
    const studentKey = getStudentDbKeyByCodeOrId(studentKeyOrCode);
    const student = window.localData?.students?.[studentKey];
    if (!studentKey || !student) {
        Swal.fire('Không tìm thấy', 'Không tìm thấy học sinh tương ứng với mã QR.', 'warning');
        return;
    }

    const payload = await ensureStudentQrStored(studentKey, student);
    const summary = await readStudentHocBaSummary(studentKey);
    const html = buildStudentDocumentHtml(studentKey, student, payload, summary);
    const s = studentDisplaySummary(student, studentKey);
    const safeName = String(`${s.code}_${s.name || 'hoc_sinh'}`)
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\-]+/g, '_');

    if (format === 'word' || format === 'doc') {
        const blob = new Blob(['\ufeff', html], { type: 'application/msword;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${safeName}_phieu_thong_tin.doc`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1500);
        return;
    }

    const w = window.open('', '_blank');
    if (!w) {
        Swal.fire('Trình duyệt chặn popup', 'Vui lòng cho phép popup để xuất PDF.', 'warning');
        return;
    }
    w.document.open();
    w.document.write(html.replace('</body>', `<script>
        window.onload = () => {
            setTimeout(() => window.print(), 500);
            ${autoClose ? "setTimeout(() => window.close(), 2500);" : ""}
        };
    </script></body>`));
    w.document.close();
}

export async function exportStudentQrPdf(studentKeyOrCode) {
    const studentKey = getStudentDbKeyByCodeOrId(studentKeyOrCode);
    if (!studentKey) return;
    if (window.FIREBASE_FEATURES?.storage !== true) {
        return exportStudentDocument(studentKey, 'pdf', false);
    }
    const payload = await createFreshStudentStorageQr(studentKey);
    window.open(payload.qrPdfUrl || payload.qrUrl, '_blank');
}

export async function exportStudentQrWord(studentKeyOrCode) {
    return exportStudentDocument(studentKeyOrCode, 'word', false);
}



// ── V5.31: Firebase Storage PDF QR một phiên ────────────────────────────────
function randomQrToken() {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    return `${Date.now()}-${Math.random().toString(16).slice(2)}-${Math.random().toString(16).slice(2)}`;
}

function currentYearStorageKey() {
    return String(window._currentSchoolYear || 'unknown_year').replace(/[^\w-]+/g, '_');
}

function sanitizeFileName(value) {
    return String(value || 'hoc_sinh')
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w.-]+/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '');
}

async function loadHtml2PdfIfNeeded() {
    if (window.html2pdf) return;
    await new Promise((resolve, reject) => {
        const existed = document.querySelector('script[data-smartschool-html2pdf="1"]');
        if (existed) {
            existed.addEventListener('load', resolve, { once:true });
            existed.addEventListener('error', reject, { once:true });
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
        script.async = true;
        script.dataset.smartschoolHtml2pdf = '1';
        script.onload = resolve;
        script.onerror = () => reject(new Error('Không tải được thư viện tạo PDF html2pdf.'));
        document.head.appendChild(script);
    });
}

function getStudentPdfStoragePath(studentKey, student, token) {
    const s = studentDisplaySummary(student, studentKey);
    const adminUid = sanitizeFileName(window.currentUser?.uid || 'unknown_admin');
    const code = sanitizeFileName(s.code || studentKey);
    return `student-qr-pdf/${adminUid}/${currentYearStorageKey()}/${code}/${token}.pdf`;
}

async function revokeStudentQrPdf(studentKey, student = null) {
    const s = student || window.localData?.students?.[studentKey] || {};
    const oldPath = s.qrPdfPath || '';
    if (oldPath && window.storage && window.storageRef && window.deleteObject) {
        try {
            await window.deleteObject(window.storageRef(window.storage, oldPath));
        } catch (error) {
            if (!String(error?.code || '').includes('object-not-found')) {
                console.warn('[Smart School V5.31] Không xoá được PDF QR cũ:', error);
            }
        }
    }
    try {
        await window.update(window.ref(window.db, `students/${studentKey}`), {
            qrPdfUrl: null,
            qrPdfPath: null,
            qrPdfToken: null,
            qrPdfExpiresAt: null,
            qrUrl: null,
            qrRevokedAt: typeof window.serverNow === 'function' ? window.serverNow() : Date.now(),
        });
        if (window.localData?.students?.[studentKey]) {
            Object.assign(window.localData.students[studentKey], {
                qrPdfUrl: null, qrPdfPath: null, qrPdfToken: null, qrPdfExpiresAt: null, qrUrl: null
            });
        }
    } catch (error) {
        console.warn('[Smart School V5.31] Không cập nhật trạng thái thu hồi QR:', error);
    }
}


async function loadPdfMakeIfNeeded() {
    if (window.pdfMake?.createPdf && window.pdfMake?.vfs) return;
    await new Promise((resolve, reject) => {
        const script1 = document.createElement('script');
        script1.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/pdfmake.min.js';
        script1.async = true;
        script1.onload = () => {
            const script2 = document.createElement('script');
            script2.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/vfs_fonts.js';
            script2.async = true;
            script2.onload = resolve;
            script2.onerror = () => reject(new Error('Không tải được font PDF vfs_fonts.'));
            document.head.appendChild(script2);
        };
        script1.onerror = () => reject(new Error('Không tải được thư viện pdfMake.'));
        document.head.appendChild(script1);
    });
}

function plainPdfText(value) {
    return String(value ?? '')
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .trim();
}

function pdfTableCell(value, style = '') {
    return { text: plainPdfText(value || '—'), style, margin: [2, 3, 2, 3] };
}

function subjectRowsForPdf(hocba = {}) {
    const semesterBlocks = [
        ['Giữa HK1', hocba.ghk1_subjects || hocba.ghk1 || {}],
        ['HK1', hocba.hk1_subjects || hocba.hk1 || {}],
        ['Giữa HK2', hocba.ghk2_subjects || hocba.ghk2 || {}],
        ['HK2', hocba.hk2_subjects || hocba.hk2 || hocba.subjects || {}],
    ];
    const rows = [];
    semesterBlocks.forEach(([label, block]) => {
        Object.entries(block || {}).forEach(([subject, data]) => {
            if (!data || typeof data !== 'object') return;
            rows.push([
                pdfTableCell(label),
                pdfTableCell(subject),
                pdfTableCell(data.mucDat || data.level || '—'),
                pdfTableCell(data.diem ?? data.score ?? data.diemKtDk ?? '—'),
                pdfTableCell(data.nhanXet || data.comment || '')
            ]);
        });
    });
    return rows;
}

function traitRowsForPdf(title, block = {}) {
    return Object.entries(block || {}).map(([name, data]) => {
        const value = data && typeof data === 'object' ? (data.mucDat || data.level || data.value || '') : data;
        const comment = data && typeof data === 'object' ? (data.nhanXet || data.comment || '') : '';
        return [
            pdfTableCell(title),
            pdfTableCell(name),
            pdfTableCell(value || '—'),
            pdfTableCell(comment || '')
        ];
    });
}

function getKetQuaText(value) {
    if (!value) return '—';
    if (typeof value === 'object') return value.muc || value.level || value.result || value.noiDung || value.content || JSON.stringify(value);
    return value;
}


async function createStudentPdfBlob(studentKey, student, payloadForQr) {
    // V5.31.4: Bỏ html2pdf/html2canvas vì một số trình duyệt tạo PDF trắng.
    // Dùng pdfMake + Roboto vfs để xuất PDF bằng dữ liệu trực tiếp, ổn định hơn và hỗ trợ tiếng Việt.
    await loadPdfMakeIfNeeded();

    const summary = await readStudentHocBaSummary(studentKey);
    const hocba = summary.hocba || {};
    const promotion = summary.promotion || {};
    const s = studentDisplaySummary(student, studentKey);
    const year = window._currentSchoolYear || '';
    const printDate = new Date().toLocaleString('vi-VN');

    const promotionLabel = ({
        len_lop: 'Lên lớp',
        o_lai: 'Ở lại',
        bao_luu: 'Bảo lưu',
        nghi_hoc: 'Nghỉ học'
    }[promotion.status] || promotion.status || 'Chưa xác nhận');

    const subjectRows = subjectRowsForPdf(hocba);
    const traitRows = [
        ...traitRowsForPdf('Phẩm chất giữa HK1', hocba.ghk1_phamChat || {}),
        ...traitRowsForPdf('Năng lực chung giữa HK1', hocba.ghk1_nangLucChung || {}),
        ...traitRowsForPdf('Năng lực đặc thù giữa HK1', hocba.ghk1_nangLucDacThu || {}),
        ...traitRowsForPdf('Phẩm chất HK1', hocba.hk1_phamChat || {}),
        ...traitRowsForPdf('Năng lực chung HK1', hocba.hk1_nangLucChung || {}),
        ...traitRowsForPdf('Năng lực đặc thù HK1', hocba.hk1_nangLucDacThu || {}),
        ...traitRowsForPdf('Phẩm chất giữa HK2', hocba.ghk2_phamChat || {}),
        ...traitRowsForPdf('Năng lực chung giữa HK2', hocba.ghk2_nangLucChung || {}),
        ...traitRowsForPdf('Năng lực đặc thù giữa HK2', hocba.ghk2_nangLucDacThu || {}),
        ...traitRowsForPdf('Phẩm chất HK2', hocba.hk2_phamChat || hocba.phamChat || {}),
        ...traitRowsForPdf('Năng lực chung HK2', hocba.hk2_nangLucChung || hocba.nangLucChung || {}),
        ...traitRowsForPdf('Năng lực đặc thù HK2', hocba.hk2_nangLucDacThu || hocba.nangLucDacThu || {}),
    ];

    const infoTable = [
        [pdfTableCell('Mã học sinh', 'label'), pdfTableCell(s.code), pdfTableCell('Họ và tên', 'label'), pdfTableCell(s.name)],
        [pdfTableCell('Lớp', 'label'), pdfTableCell(s.classRoom), pdfTableCell('Trạng thái', 'label'), pdfTableCell(s.statusLabel)],
        [pdfTableCell('Giới tính', 'label'), pdfTableCell(s.gender), pdfTableCell('Ngày sinh', 'label'), pdfTableCell(formatStudentDob(s.dob))],
        [pdfTableCell('SĐT khẩn cấp', 'label'), pdfTableCell(s.sosPhone), pdfTableCell('Địa chỉ', 'label'), pdfTableCell(s.address)],
        [pdfTableCell('Cha', 'label'), pdfTableCell(s.fatherName), pdfTableCell('Mẹ', 'label'), pdfTableCell(s.motherName)],
    ];

    const docDefinition = {
        pageSize: 'A4',
        pageMargins: [28, 28, 28, 32],
        defaultStyle: {
            font: 'Roboto',
            fontSize: 9,
            color: '#0f172a'
        },
        footer: function(currentPage, pageCount) {
            return {
                columns: [
                    { text: 'Phiếu được tạo tự động từ FMA Nam Hòa', margin: [28, 0, 0, 0], fontSize: 7, color: '#64748b' },
                    { text: `${currentPage}/${pageCount}`, alignment: 'right', margin: [0, 0, 28, 0], fontSize: 7, color: '#64748b' }
                ]
            };
        },
        content: [
            { text: 'SMART SCHOOL', style: 'school' },
            { text: 'PHIẾU THÔNG TIN HỌC SINH', style: 'title' },
            { text: `Năm học: ${plainPdfText(year || '—')} | Ngày xuất: ${plainPdfText(printDate)}`, style: 'subtitle' },
            { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 540, y2: 0, lineWidth: 1.5, lineColor: '#1e3a8a' }], margin: [0, 4, 0, 8] },

            { text: '1. Thông tin cơ bản', style: 'section' },
            {
                table: { widths: [70, '*', 70, '*'], body: infoTable },
                layout: 'lightHorizontalLines',
                margin: [0, 0, 0, 8]
            },

            { text: '2. Bảng đánh giá môn học / hoạt động giáo dục', style: 'section' },
            {
                table: {
                    headerRows: 1,
                    widths: [52, 90, 38, 35, '*'],
                    body: [
                        [
                            pdfTableCell('Thời điểm', 'th'),
                            pdfTableCell('Môn học', 'th'),
                            pdfTableCell('Mức', 'th'),
                            pdfTableCell('Điểm', 'th'),
                            pdfTableCell('Nhận xét', 'th')
                        ],
                        ...(subjectRows.length ? subjectRows : [[
                            { text: `Chưa có dữ liệu đánh giá môn học trong năm học ${plainPdfText(year || '')}`, colSpan: 5, alignment: 'center', color: '#64748b', margin: [0, 6, 0, 6] },
                            {}, {}, {}, {}
                        ]])
                    ]
                },
                layout: 'lightHorizontalLines',
                margin: [0, 0, 0, 8]
            },

            { text: '3. Bảng phẩm chất và năng lực', style: 'section' },
            {
                table: {
                    headerRows: 1,
                    widths: [90, 105, 42, '*'],
                    body: [
                        [
                            pdfTableCell('Nhóm', 'th'),
                            pdfTableCell('Nội dung', 'th'),
                            pdfTableCell('Mức', 'th'),
                            pdfTableCell('Nhận xét', 'th')
                        ],
                        ...(traitRows.length ? traitRows : [[
                            { text: 'Chưa có dữ liệu phẩm chất/năng lực', colSpan: 4, alignment: 'center', color: '#64748b', margin: [0, 6, 0, 6] },
                            {}, {}, {}
                        ]])
                    ]
                },
                layout: 'lightHorizontalLines',
                margin: [0, 0, 0, 8]
            },

            { text: '4. Kết quả cuối năm', style: 'section' },
            {
                table: {
                    widths: [95, '*'],
                    body: [
                        [pdfTableCell('Kết quả giáo dục', 'label'), pdfTableCell(getKetQuaText(hocba.ketQua))],
                        [pdfTableCell('Khen thưởng', 'label'), pdfTableCell(getKetQuaText(hocba.khenThuong))],
                        [pdfTableCell('Trạng thái lên lớp', 'label'), pdfTableCell(promotionLabel)]
                    ]
                },
                layout: 'lightHorizontalLines',
                margin: [0, 0, 0, 8]
            },

            { text: 'Liên kết QR PDF', style: 'section' },
            { text: plainPdfText(payloadForQr?.qrUrl || payloadForQr?.qrPdfUrl || ''), fontSize: 7, color: '#475569' }
        ],
        styles: {
            school: { fontSize: 10, bold: true, color: '#1e3a8a' },
            title: { fontSize: 16, bold: true, color: '#111827', margin: [0, 3, 0, 2] },
            subtitle: { fontSize: 8, color: '#475569', margin: [0, 0, 0, 3] },
            section: { fontSize: 10, bold: true, color: '#ffffff', fillColor: '#1e3a8a', margin: [0, 7, 0, 3] },
            th: { bold: true, color: '#334155', fillColor: '#f1f5f9' },
            label: { bold: true, color: '#334155', fillColor: '#f8fafc' }
        }
    };

    return await new Promise((resolve, reject) => {
        try {
            window.pdfMake.createPdf(docDefinition).getBlob(blob => resolve(blob));
        } catch (error) {
            reject(error);
        }
    });
}

async function createFreshStudentStorageQr(studentKey) {
    if (window.FIREBASE_FEATURES?.storage !== true) {
        throw new Error('Firebase Storage bị tắt trong chế độ Spark. Hãy dùng QR liên kết nội bộ hoặc xuất PDF/Word trên trình duyệt.');
    }
    // V5.32.2: app.js tải Firebase Storage theo kiểu lazy để không làm chết login.
    // Vì vậy khi tạo QR phải chủ động gọi ensureFirebaseStorage() trước.
    if ((!window.storage || !window.storageRef || !window.uploadBytes || !window.getDownloadURL) && typeof window.ensureFirebaseStorage === 'function') {
        await window.ensureFirebaseStorage();
    }
    if (!window.storage || !window.storageRef || !window.uploadBytes || !window.getDownloadURL) {
        throw new Error('Chưa tải được Firebase Storage. Kiểm tra mạng/DNS tới www.gstatic.com hoặc thử tải lại trang.');
    }
    const student = window.localData?.students?.[studentKey];
    if (!student) throw new Error('Không tìm thấy học sinh để tạo QR.');

    await revokeStudentQrPdf(studentKey, student);

    const token = randomQrToken();
    const nowMs = typeof window.serverNow === 'function' ? window.serverNow() : Date.now();
    const expiresAt = nowMs + 15 * 60 * 1000;
    const tempPayload = {
        qrVersion: 'storage-v1',
        qrStudentCode: normalizeStudentCode(student.code || student.id || studentKey),
        qrUrl: 'Đang tạo liên kết PDF...',
        qrUpdatedAt: nowMs,
    };
    const storagePath = getStudentPdfStoragePath(studentKey, student, token);
    const fileRef = window.storageRef(window.storage, storagePath);

    const firstBlob = await createStudentPdfBlob(studentKey, student, tempPayload);
    await window.uploadBytes(fileRef, firstBlob, {
        contentType: 'application/pdf',
        customMetadata: { studentKey, studentCode: tempPayload.qrStudentCode, qrToken: token, expiresAt: String(expiresAt) }
    });
    const downloadUrl = await window.getDownloadURL(fileRef);

    const finalPayload = { ...tempPayload, qrUrl: downloadUrl, qrPdfUrl: downloadUrl, qrPdfPath: storagePath, qrPdfToken: token, qrPdfExpiresAt: expiresAt };
    const finalBlob = await createStudentPdfBlob(studentKey, student, finalPayload);
    await window.uploadBytes(fileRef, finalBlob, {
        contentType: 'application/pdf',
        customMetadata: { studentKey, studentCode: tempPayload.qrStudentCode, qrToken: token, expiresAt: String(expiresAt) }
    });
    const finalUrl = await window.getDownloadURL(fileRef);
    const updates = {
        qrVersion: 'storage-v1',
        qrStudentCode: tempPayload.qrStudentCode,
        qrUrl: finalUrl,
        qrPdfUrl: finalUrl,
        qrPdfPath: storagePath,
        qrPdfToken: token,
        qrPdfExpiresAt: expiresAt,
        qrUpdatedAt: typeof window.serverNow === 'function' ? window.serverNow() : Date.now(),
    };
    await window.update(window.ref(window.db, `students/${studentKey}`), updates);
    if (window.localData?.students?.[studentKey]) Object.assign(window.localData.students[studentKey], updates);
    return updates;
}

export async function showStudentQr(studentKeyOrCode) {
    const studentKey = getStudentDbKeyByCodeOrId(studentKeyOrCode);
    const student = window.localData?.students?.[studentKey];
    if (!studentKey || !student) {
        Swal.fire('Không tìm thấy', 'Không tìm thấy học sinh tương ứng với mã QR.', 'warning');
        return;
    }
    if (window.userRole !== 'admin' && window.userRole !== 'teacher') {
        Swal.fire('Từ chối', 'Bạn không có quyền xem mã QR học sinh.', 'warning');
        return;
    }
    if (window.userRole === 'teacher' && window.teacherClass) {
        const studentClass = student.classRoom || student.class || '';
        if (studentClass && studentClass !== window.teacherClass) {
            Swal.fire('Từ chối', 'Bạn chỉ được xem mã QR học sinh của lớp mình.', 'warning');
            return;
        }
    }

    if (window.FIREBASE_FEATURES?.storage !== true) {
        const payload = await ensureStudentQrStored(studentKey, student);
        const result = await Swal.fire({
            title: 'Mã QR học sinh — Spark',
            width: 900,
            html: qrStudentInfoHtml(studentKey, { ...student, ...payload }, payload.qrUrl)
                + `<div style="margin-top:12px;background:#fffbeb;border:1px solid #fde68a;color:#92400e;border-radius:10px;padding:10px;text-align:left">
                    <b>Chế độ miễn phí:</b> QR mở hồ sơ trong hệ thống và yêu cầu người dùng đăng nhập đúng quyền. PDF được tạo trực tiếp trên trình duyệt, không tải lên Firebase Storage.
                   </div>`,
            showCancelButton: true,
            showDenyButton: true,
            confirmButtonText: '<i class="fas fa-print"></i> In mã QR',
            denyButtonText: '<i class="fas fa-file-word"></i> Tải Word',
            cancelButtonText: 'Đóng'
        });
        if (result.isConfirmed) await printStudentQr(studentKey);
        if (result.isDenied) await exportStudentQrWord(studentKey);
        return;
    }

    Swal.fire({
        title: 'Đang tạo PDF bảo mật...',
        html: 'Hệ thống đang tạo phiếu PDF, upload lên Firebase Storage và sinh mã QR mới.',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
    });

    let payload;
    try {
        payload = await createFreshStudentStorageQr(studentKey);
    } catch (error) {
        console.error(error);
        Swal.fire('Lỗi tạo QR', error?.message || 'Không tạo được PDF QR.', 'error');
        return;
    }

    const result = await Swal.fire({
        title: 'Mã QR PDF học sinh',
        width: 900,
        html: qrStudentInfoHtml(studentKey, { ...student, ...payload }, payload.qrPdfUrl || payload.qrUrl)
            + `<div style="margin-top:12px;background:#f0fdf4;border:1px solid #bbf7d0;color:#166534;border-radius:10px;padding:10px;text-align:left">
                <b>Chế độ QR Storage:</b> Khi quét mã này, điện thoại mở trực tiếp file PDF từ Firebase Storage. Người dùng có thể xem, tải hoặc bấm in.
               </div>
               <div style="margin-top:8px;background:#fef2f2;border:1px solid #fecaca;color:#991b1b;border-radius:10px;padding:10px;text-align:left;font-size:0.86rem">
                <b>Bảo mật:</b> Đóng popup này sẽ xoá file PDF hiện tại và thu hồi QR. Lần sau mở QR sẽ tạo file và mã mới.
               </div>`,
        showCancelButton: true,
        showDenyButton: true,
        confirmButtonText: '<i class="fas fa-print"></i> In mã QR',
        denyButtonText: '<i class="fas fa-file-word"></i> Tải Word',
        cancelButtonText: 'Đóng & thu hồi QR',
        willClose: () => { revokeStudentQrPdf(studentKey).catch(console.warn); },
        footer: `<a href="${payload.qrPdfUrl || payload.qrUrl}" target="_blank" class="swal2-confirm swal2-styled" style="background:#16a34a;text-decoration:none">
                    <i class="fas fa-file-pdf"></i> Mở PDF trực tiếp
                 </a>`
    });
    if (result.isConfirmed) await printStudentQr(studentKey);
    if (result.isDenied) await exportStudentQrWord(studentKey);
}

export async function printStudentQr(studentKeyOrCode) {
    const studentKey = getStudentDbKeyByCodeOrId(studentKeyOrCode);
    const student = window.localData?.students?.[studentKey];
    if (!studentKey || !student) {
        Swal.fire('Không tìm thấy', 'Không tìm thấy học sinh để in QR.', 'warning');
        return;
    }
    const payload = window.FIREBASE_FEATURES?.storage === true
        ? await createFreshStudentStorageQr(studentKey)
        : await ensureStudentQrStored(studentKey, student);
    const s = studentDisplaySummary(student, studentKey);
    const printHtml = `<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8">
<title>QR học sinh ${safeText(s.code)}</title>
<style>@page{size:A4;margin:12mm}body{font-family:Arial,sans-serif;color:#0f172a}.card{width:90mm;min-height:120mm;border:2px solid #1e3a8a;border-radius:12px;padding:10mm;text-align:center}.school{font-size:13px;font-weight:800;color:#1e3a8a;text-transform:uppercase}.title{font-size:16px;font-weight:900;margin:8px 0 4px}.qr{width:62mm;height:62mm;margin:8mm auto 5mm;display:block}.code{font-size:18px;font-weight:900;letter-spacing:.5px}.info{text-align:left;margin-top:8mm;font-size:13px;line-height:1.6}.small{font-size:10px;color:#64748b;word-break:break-all;margin-top:6mm}</style>
</head><body><div class="card"><div class="school">FMA Nam Hòa</div><div class="title">MÃ QR HỌC SINH</div><img class="qr" src="${buildQrImageUrl(payload.qrUrl, 420)}"><div class="code">${safeText(s.code)}</div><div style="font-weight:800;margin-top:4px">${safeText(s.name)}</div><div class="info"><div><b>Lớp:</b> ${safeText(s.classRoom || '—')}</div><div><b>Ngày sinh:</b> ${safeText(formatStudentDob(s.dob))}</div><div><b>Trạng thái:</b> ${safeText(s.statusLabel || '—')}</div></div><div class="small">${safeText(payload.qrUrl)}</div></div><script>window.onload=()=>window.print();</script></body></html>`;
    const w = window.open('', '_blank');
    if (!w) { Swal.fire('Trình duyệt chặn popup', 'Vui lòng cho phép popup để in mã QR.', 'warning'); return; }
    w.document.open(); w.document.write(printHtml); w.document.close();
}

window.printQrForFilteredStudents = async function() {
    let entries = Object.entries(window.localData?.students || {});
    const currentClass = window._studentCurrentClass || '';
    if (currentClass) entries = entries.filter(([,s]) => (s.classRoom || s.class || '') === currentClass);
    entries = entries.filter(([,s]) => normalizeStudentStatusValue(s.status || 'active') === 'active');
    if (!entries.length) { Swal.fire('Chưa có dữ liệu', 'Không có học sinh đang học trong lớp đang chọn.', 'info'); return; }
    const cards = [];
    for (const [key, student] of entries) {
        const payload = await ensureStudentQrStored(key, student);
        const s = studentDisplaySummary(student, key);
        cards.push(`<div class="card"><div class="school">FMA Nam Hòa</div><img src="${buildQrImageUrl(payload.qrUrl, 260)}"><div class="code">${safeText(s.code)}</div><div class="name">${safeText(s.name)}</div><div class="cls">Lớp ${safeText(s.classRoom || '—')}</div></div>`);
    }
    const html = `<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8"><title>In QR học sinh</title><style>@page{size:A4;margin:10mm}body{font-family:Arial,sans-serif;color:#0f172a}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8mm}.card{break-inside:avoid;border:1.5px solid #1e3a8a;border-radius:10px;padding:6mm;text-align:center;min-height:70mm}.school{font-size:10px;font-weight:800;color:#1e3a8a;text-transform:uppercase}img{width:38mm;height:38mm;margin:4mm auto;display:block}.code{font-weight:900;font-size:13px}.name{font-weight:700;font-size:12px;margin-top:2mm}.cls{color:#475569;font-size:11px;margin-top:1mm}</style></head><body><h2 style="margin:0 0 8mm">Danh sách mã QR học sinh ${safeText(currentClass ? 'lớp ' + currentClass : '')}</h2><div class="grid">${cards.join('')}</div><script>window.onload=()=>window.print();</script></body></html>`;
    const w = window.open('', '_blank');
    if (!w) { Swal.fire('Trình duyệt chặn popup', 'Vui lòng cho phép popup để in QR lớp.', 'warning'); return; }
    w.document.open(); w.document.write(html); w.document.close();
};

export async function openQrStudentFromUrl() {
    const params = new URLSearchParams(window.location.search || '');
    const qrCode = params.get('studentQr');
    const qrAction = String(params.get('qrAction') || 'pdf').toLowerCase();
    if (!qrCode || window._studentQrOpened) return;
    window._studentQrOpened = true;

    for (let i = 0; i < 14; i++) {
        const key = getStudentDbKeyByCodeOrId(qrCode);
        if (key) {
            if (qrAction === 'word' || qrAction === 'doc') {
                await exportStudentDocument(key, 'word', false);
            } else if (qrAction === 'view') {
                await showStudentQr(key);
            } else {
                await exportStudentDocument(key, 'pdf', true);
            }
            return;
        }
        await new Promise(resolve => setTimeout(resolve, 350));
    }
    Swal.fire('Không tìm thấy mã QR', `Không tìm thấy học sinh có mã: ${safeText(qrCode)}`, 'warning');
}

export async function saveStudent(e) {
    e.preventDefault();
    const form = e.target;
    const gv   = name => { const el = form.elements[name]; return el ? el.value.trim() : ''; };
    const now  = typeof window.serverNow === 'function' ? window.serverNow() : Date.now();
    ensureStudentStatusSelectOptions(form);
    const classRoom = gv('classRoom').toUpperCase().replace(/\s+/g, '');
    const familyMembers = collectFamilyMembers();
    const data = {
        code: normalizeStudentCode(gv('code')),
        name: gv('name'), classRoom, class: classRoom,
        gender: gv('gender'), dob: gv('dob'), birthPlace: gv('birthPlace'),
        nationalId: normalizeNationalId(gv('nationalId')),
        status: normalizeStudentStatusValue(gv('status')), enrollDate: gv('enrollDate'), sosPhone: gv('sosPhone'),
        phone: gv('phone'), facebook: gv('facebook'), zalo: gv('zalo'),
        currentAddress: gv('currentAddress'),
        permanentAddress: gv('permanentAddress'),
        temporaryAddress: gv('currentAddress') || gv('permanentAddress'),
        religion: gv('religion'), religionOther: gv('religionOther'),
        parish: gv('parish'), catechismClass: gv('catechismClass'), churchGroup: gv('churchGroup'),
        livingWith: getRadioVal('livingWith'),
        livingWithOtherDetail: gv('livingWithOtherDetail'),
        housingType: getRadioVal('housingType'),
        housingTypeOtherDetail: gv('housingTypeOtherDetail'),
        houseArea: gv('houseArea'),
        houseStructure: getRadioVal('houseStructure'),
        houseStructureOtherDetail: gv('houseStructureOtherDetail'),
        studentLabor: getRadioVal('studentLabor') || 'Không lao động',
        studentLaborIncome: gv('studentLaborIncome'),
        studentLaborJob: gv('studentLaborJob'),
        studentLaborTime: gv('studentLaborTime'),
        healthNotes: gv('healthNotes'),
        docBirthCert: gv('docBirthCert'),
        docBirthCertReason: gv('docBirthCertReason'),
        docResidence: gv('docResidence'),
        docResidenceReason: gv('docResidenceReason'),
        docCccd: gv('docCccd'),
        docNationalDb: gv('docNationalDb'),
        docNationalDbReason: gv('docNationalDbReason'),
        birthCert: gv('docBirthCert') === 'Có' ? 'x' : '',
        residenceCert: gv('docResidence') === 'Có' ? 'x' : '',
        dadName: gv('dadName'), dadBirthYear: gv('dadBirthYear'), dadReligion: gv('dadReligion'),
        dadJob: gv('dadJob'), dadJobStable: gv('dadJobStable'), dadIncome: gv('dadIncome'),
        dadPhone: gv('dadPhone'), dadMaritalStatus: gv('dadMaritalStatus'), dadEducation: gv('dadEducation'),
        dadBhyt: gv('dadBhyt'), dadBhtn: gv('dadBhtn'), dadNoBhReason: gv('dadNoBhReason'),
        momName: gv('momName'), momBirthYear: gv('momBirthYear'), momReligion: gv('momReligion'),
        momJob: gv('momJob'), momJobStable: gv('momJobStable'), momIncome: gv('momIncome'),
        momPhone: gv('momPhone'), momMaritalStatus: gv('momMaritalStatus'), momEducation: gv('momEducation'),
        momBhyt: gv('momBhyt'), momBhtn: gv('momBhtn'), momBhOther: gv('momBhOther'),
        guardianName: gv('guardianName'), guardianBirthYear: gv('guardianBirthYear'), guardianReligion: gv('guardianReligion'),
        guardianJob: gv('guardianJob'), guardianJobStable: gv('guardianJobStable'), guardianIncome: gv('guardianIncome'),
        guardianPhone: gv('guardianPhone'), guardianMaritalStatus: gv('guardianMaritalStatus'), guardianEducation: gv('guardianEducation'),
        guardianBhyt: gv('guardianBhyt'), guardianBhtn: gv('guardianBhtn'), guardianBhOther: gv('guardianBhOther'),
        familyMembers,
        primaryCaregiver: gv('primaryCaregiver'),
        familyCircumstance: gv('familyCircumstance'),
        familyEconomy: gv('familyEconomy') || 'Thấp',
        workerCount: gv('workerCount'),
        outsideSupport: gv('outsideSupport'),
        housematesCount: gv('housematesCount'),
        siblingsInPc: gv('siblingsInPc'),
        notes: gv('notes'),
        currentClassKey: classKey(classRoom),
        currentGrade: (classRoom.match(/^(\d+)/)||[])[1] || '',
        updatedAt: now,
        updatedBy: window.currentUser?.email || '',
        updatedByUid: window.currentUser?.uid || ''};

    let reservedCodeForRollback = '';
    let reservedKeyForRollback  = '';
    try {
        if (!data.name) throw new Error('Vui lòng nhập họ tên học sinh.');
        if (!data.classRoom) throw new Error('Vui lòng nhập lớp học.');

        if (window.userRole === 'teacher') {
            const teacherClassNorm = (window.teacherClass || '').toUpperCase().replace(/\s+/g, '');
            if (teacherClassNorm && data.classRoom !== teacherClassNorm) {
                throw new Error(`Bạn chỉ có quyền nhập và cập nhật học sinh cho lớp phụ trách (${window.teacherClass}).`);
            }
        }

        if (window.editingStudentId) {
            const studentKey = window.editingStudentId;
            const oldStudent = window.localData.students?.[studentKey] || {};
            const oldClass = oldStudent.classRoom || oldStudent.class || '';
            const oldClassNorm = oldClass.toUpperCase().replace(/\s+/g, '');
            if (window.userRole === 'teacher') {
                const teacherClassNorm = (window.teacherClass || '').toUpperCase().replace(/\s+/g, '');
                if (teacherClassNorm && oldClassNorm !== teacherClassNorm) {
                    throw new Error(`Bạn không có quyền chỉnh sửa học sinh của lớp khác (${oldClass}).`);
                }
            }
            const oldCode = normalizeStudentCode(oldStudent.code);
            Object.assign(data, buildStudentArchiveFields(data.status, oldStudent, now));

            data.code = await reserveUniqueStudentCode(data.code, studentKey);
            reservedCodeForRollback = data.code;
            reservedKeyForRollback  = studentKey;

            const updatedStudent = { ...oldStudent, ...data, id: oldStudent.id || studentKey };
            Object.assign(updatedStudent, buildStudentQrPayload(studentKey, updatedStudent));
            if (oldClass && data.classRoom && oldClass !== data.classRoom) {
                const history = Array.isArray(oldStudent.transferHistory) ? [...oldStudent.transferHistory] : [];
                history.push({
                    fromClass: oldClass,
                    toClass: data.classRoom,
                    date: new Date(data.updatedAt).toISOString().slice(0, 10),
                    reason: 'Điều chỉnh lớp trong hồ sơ học sinh',
                    by: window.currentUser?.email || (window.userRole === 'teacher' ? 'teacher' : 'admin'),
                    at: data.updatedAt,
                });
                updatedStudent.transferHistory = history;
            }

            const updates = { [`students/${studentKey}`]: updatedStudent };
            Object.assign(updates, await buildPaymentClassMoveUpdates(
                studentKey, data.code, oldClass, data.classRoom, data.updatedAt
            ));
            await window.update(window.ref(window.db), updates);

            if (oldCode && oldCode !== data.code) {
                await releaseStudentCodeIndex(oldCode, studentKey);
            }
            window.localData.students[studentKey] = updatedStudent;
            Swal.fire('Thành công', data.status === 'graduated' ? 'Đã cập nhật và chuyển hồ sơ vào Lưu trữ.' : 'Đã cập nhật học sinh', 'success');
        } else {
            const newRef = window.push(window.ref(window.db, 'students'));
            data.id = newRef.key;
            if (data.code) {
                data.code = await reserveUniqueStudentCode(data.code, data.id);
            } else {
                const reserved = await reserveGeneratedStudentCodeFromConfig(data.id);
                data.code = reserved.code;
            }
            reservedCodeForRollback = data.code;
            reservedKeyForRollback  = data.id;
            data.createdAt = data.updatedAt;
            data.createdBy = window.currentUser?.email || '';
            data.createdByUid = window.currentUser?.uid || '';
            Object.assign(data, buildStudentArchiveFields(data.status, {}, now));
            Object.assign(data, buildStudentQrPayload(data.id, data));

            await window.set(newRef, data);
            window.localData.students[data.id] = data;
            window._studentCurrentClass = data.classRoom;
            Swal.fire('Thành công', 'Đã thêm học sinh mới', 'success');
        }
        window.closeModal('modal-student');
        if (window.userRole === 'admin') {
            window._studentViewMode = ['inactive', 'graduated'].includes(data.status) ? 'archive' : 'current';
        }
        renderStudents();
    } catch (error) {
        // Nếu tạo mới thất bại sau khi đã giữ mã, giải phóng mã để tránh khóa rác.
        if (!window.editingStudentId && reservedCodeForRollback && reservedKeyForRollback) {
            await releaseStudentCodeIndex(reservedCodeForRollback, reservedKeyForRollback);
        }
        Swal.fire('Lỗi', error.message, 'error');
    }
}


function escapeStudentHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function studentDeleteAliases(studentKey, student = {}) {
    return [...new Set([
        studentKey,
        student?.id,
        student?.code,
        normalizeStudentCode(student?.code),
    ].map(value => String(value || '').trim()).filter(Boolean))];
}

function studentDeleteYearKeys(student = {}, hocbaRoots = []) {
    const years = new Set();
    const add = value => {
        const key = String(value || '').trim().replace(/-/g, '_');
        if (/^\d{4}_\d{4}$/.test(key)) years.add(key);
    };

    add(window._currentSchoolYear || window.localData?.settings?.schoolYear || '');
    add(student?.stoppedSY || '');

    [student?.schoolYearHistory, student?.yearHistory, student?.classHistoryByYear].forEach(map => {
        Object.keys(map || {}).forEach(add);
    });

    hocbaRoots.forEach(root => {
        Object.keys(root || {}).forEach(add);
    });

    return [...years];
}

function addStudentAliasDeletes(updates, basePath, aliases, node = null) {
    for (const alias of aliases) {
        if (!node || Object.prototype.hasOwnProperty.call(node, alias)) {
            updates[`${basePath}/${alias}`] = null;
        }
    }
}

async function buildPermanentStudentDeleteUpdates(studentKey, student, reason) {
    const aliases = studentDeleteAliases(studentKey, student);
    const normalizedCode = normalizeStudentCode(student?.code);
    const [hocbaByKeySnap, hocbaByCodeSnap, usersSnap, codeIndexSnap] = await Promise.all([
        window.get(window.ref(window.db, `hocba/${studentKey}`)),
        student?.code && String(student.code) !== String(studentKey)
            ? window.get(window.ref(window.db, `hocba/${student.code}`))
            : Promise.resolve(null),
        window.get(window.ref(window.db, 'users')),
        normalizedCode
            ? window.get(window.ref(window.db, `studentCodeIndex/${normalizedCode}`))
            : Promise.resolve(null),
    ]);

    const hocbaRoots = [
        hocbaByKeySnap?.exists?.() ? hocbaByKeySnap.val() : {},
        hocbaByCodeSnap?.exists?.() ? hocbaByCodeSnap.val() : {},
    ];
    const yearKeys = studentDeleteYearKeys(student, hocbaRoots);
    const updates = {};

    // Hồ sơ chính và các nhánh dữ liệu học sinh trực tiếp.
    updates[`students/${studentKey}`] = null;
    for (const alias of aliases) {
        updates[`hocba/${alias}`] = null;
        updates[`feedback/${alias}`] = null;
        updates[`scores/${alias}`] = null; // tương thích dữ liệu điểm đời cũ nếu có
    }

    const codeIndexOwner = codeIndexSnap?.exists?.() ? String(codeIndexSnap.val() || '').trim() : '';
    if (normalizedCode && aliases.includes(codeIndexOwner)) {
        updates[`studentCodeIndex/${normalizedCode}`] = null;
    }

    // Xóa dữ liệu phụ theo từng năm học có liên quan.
    for (const yearKey of yearKeys) {
        const [promotionSnap, paymentSnap, paymentByClassSnap, attendanceSnap, classAssignmentSnap] = await Promise.all([
            window.get(window.ref(window.db, `promotionStatus/${yearKey}`)),
            window.get(window.ref(window.db, `paymentStatus/${yearKey}`)),
            window.get(window.ref(window.db, `paymentStatusByClass/${yearKey}`)),
            window.get(window.ref(window.db, `attendance/${yearKey}`)),
            window.get(window.ref(window.db, `classAssignments/${yearKey}`)),
        ]);

        const promotion = promotionSnap.exists() ? promotionSnap.val() : {};
        const payment = paymentSnap.exists() ? paymentSnap.val() : {};
        const paymentByClass = paymentByClassSnap.exists() ? paymentByClassSnap.val() : {};
        const attendance = attendanceSnap.exists() ? attendanceSnap.val() : {};
        const classAssignments = classAssignmentSnap.exists() ? classAssignmentSnap.val() : {};

        addStudentAliasDeletes(updates, `promotionStatus/${yearKey}`, aliases, promotion);
        addStudentAliasDeletes(updates, `paymentStatus/${yearKey}`, aliases, payment);
        addStudentAliasDeletes(updates, `classAssignments/${yearKey}`, aliases, classAssignments);

        Object.entries(paymentByClass || {}).forEach(([classDbKey, classNode]) => {
            addStudentAliasDeletes(updates, `paymentStatusByClass/${yearKey}/${classDbKey}`, aliases, classNode || {});
        });

        Object.entries(attendance || {}).forEach(([classDbKey, classNode]) => {
            Object.entries(classNode || {}).forEach(([dateKey, dateNode]) => {
                addStudentAliasDeletes(updates, `attendance/${yearKey}/${classDbKey}/${dateKey}`, aliases, dateNode || {});
            });
        });
    }

    // Ngắt liên kết tài khoản phụ huynh, không tự xóa tài khoản Firebase Authentication.
    const users = usersSnap.exists() ? usersSnap.val() : {};
    Object.entries(users || {}).forEach(([uid, user]) => {
        if (!user || user.role !== 'parent') return;
        const linkedValues = [user.studentKey, user.studentId].map(value => String(value || '').trim());
        if (!linkedValues.some(value => aliases.includes(value))) return;
        updates[`users/${uid}/studentKey`] = null;
        updates[`users/${uid}/studentId`] = null;
        updates[`users/${uid}/studentDeletedAt`] = typeof window.serverNow === 'function' ? window.serverNow() : Date.now();
        updates[`users/${uid}/studentDeletedByUid`] = window.currentUser?.uid || '';
    });

    const auditRef = window.push(window.ref(window.db, 'studentDeletionLog'));
    const now = typeof window.serverNow === 'function' ? window.serverNow() : Date.now();
    updates[`studentDeletionLog/${auditRef.key}`] = {
        studentKey,
        studentCode: student?.code || '',
        studentName: student?.name || '',
        classRoom: student?.classRoom || student?.class || '',
        reason,
        deletedAt: now,
        deletedBy: window.currentUser?.email || '',
        deletedByUid: window.currentUser?.uid || '',
        source: 'student-management',
    };

    return { updates, yearCount: yearKeys.length, pathCount: Object.keys(updates).length };
}

export async function permanentlyDeleteStudent(id) {
    if (window.userRole !== 'admin') {
        await Swal.fire('Không có quyền', 'Chỉ Admin mới được xóa vĩnh viễn học sinh.', 'error');
        return;
    }

    const student = window.localData.students?.[id];
    if (!student) {
        await Swal.fire('Không tìm thấy', 'Hồ sơ học sinh không còn tồn tại hoặc dữ liệu chưa được tải lại.', 'error');
        return;
    }

    const status = normalizeStudentStatusValue(student.status || 'active');
    if (status !== 'inactive') {
        await Swal.fire({
            title: 'Chưa thể xóa vĩnh viễn',
            html: `Hãy bấm nút <b><i class="fas fa-archive"></i> Nghỉ học/Lưu trữ</b> trước. Sau khi xác nhận học sinh đã nghỉ hẳn, nút Xóa mới được phép thực hiện.`,
            icon: 'info',
            confirmButtonText: 'Đã hiểu',
        });
        return;
    }

    const studentCode = String(student.code || student.id || id).trim();
    const safeName = escapeStudentHtml(student.name || studentCode);
    const safeCode = escapeStudentHtml(studentCode);

    const first = await Swal.fire({
        title: 'Xóa vĩnh viễn học sinh?',
        html: `
            <div style="text-align:left;font-size:.92rem;line-height:1.55">
                <p>Học sinh: <b>${safeName}</b> — Mã: <b>${safeCode}</b></p>
                <p style="color:#b91c1c"><b>Thao tác này không thể hoàn tác.</b></p>
                <p>Sẽ xóa hồ sơ học sinh, học bạ, điểm, điểm danh, phản hồi, trạng thái lên lớp và trạng thái học phí. Nhật ký kiểm tra điểm, giao dịch tài chính và lịch sử chuyển năm vẫn được giữ để đối soát.</p>
                <label for="delete-student-code" style="display:block;font-weight:600;margin-top:12px">Nhập đúng mã học sinh để xác nhận:</label>
                <input id="delete-student-code" class="swal2-input" style="width:100%;margin:6px 0 10px" autocomplete="off" placeholder="${safeCode}">
                <label for="delete-student-reason" style="display:block;font-weight:600">Lý do xóa:</label>
                <textarea id="delete-student-reason" class="swal2-textarea" style="width:100%;margin:6px 0 0" maxlength="500" placeholder="Ví dụ: Học sinh nghỉ hẳn, nhà trường đã xác minh"></textarea>
            </div>`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Tiếp tục',
        cancelButtonText: 'Hủy',
        confirmButtonColor: '#dc2626',
        focusConfirm: false,
        preConfirm: () => {
            const typedCode = String(document.getElementById('delete-student-code')?.value || '').trim();
            const reason = String(document.getElementById('delete-student-reason')?.value || '').trim();
            if (typedCode !== studentCode) {
                Swal.showValidationMessage(`Mã xác nhận phải đúng là ${studentCode}.`);
                return false;
            }
            if (reason.length < 5) {
                Swal.showValidationMessage('Vui lòng nhập lý do xóa ít nhất 5 ký tự.');
                return false;
            }
            return { reason };
        },
    });
    if (!first.isConfirmed) return;

    const finalConfirm = await Swal.fire({
        title: 'Xác nhận lần cuối',
        html: `Bạn chắc chắn muốn xóa vĩnh viễn hồ sơ <b>${safeName}</b>?`,
        icon: 'error',
        showCancelButton: true,
        confirmButtonText: 'Xóa vĩnh viễn',
        cancelButtonText: 'Quay lại',
        confirmButtonColor: '#b91c1c',
    });
    if (!finalConfirm.isConfirmed) return;

    Swal.fire({
        title: 'Đang xóa dữ liệu...',
        text: 'Vui lòng không đóng trình duyệt.',
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => Swal.showLoading(),
    });

    try {
        const cleanup = await buildPermanentStudentDeleteUpdates(id, student, first.value.reason);
        await window.update(window.ref(window.db), cleanup.updates);

        delete window.localData.students[id];
        window._allStudents = (window._allStudents || []).filter(item => String(item.id || '') !== String(id));

        await Swal.fire({
            title: 'Đã xóa học sinh',
            html: `Đã xóa vĩnh viễn <b>${safeName}</b> và dọn ${cleanup.pathCount} đường dẫn dữ liệu trong ${cleanup.yearCount} năm học liên quan.`,
            icon: 'success',
        });
        renderStudents();
    } catch (error) {
        console.error('[Smart School] permanent student delete failed:', error);
        await Swal.fire({
            title: 'Không thể xóa',
            html: `Firebase từ chối hoặc kết nối bị lỗi.<br><small>${escapeStudentHtml(error?.message || error)}</small>`,
            icon: 'error',
        });
    }
}

export async function deleteStudent(id) {
    if (window.userRole !== 'admin') {
        Swal.fire('Không có quyền', 'Chỉ Quản trị viên mới được xóa hoặc chuyển học sinh sang ngừng học.', 'warning');
        return;
    }
    const student = window.localData.students?.[id] || {};
    const result = await Swal.fire({
        title: 'Chuyển hồ sơ sang ngừng học?',
        html: `<div style="text-align:left;font-size:.9rem">Hồ sơ <b>${student.name || student.code || id}</b> sẽ được giữ lại để bảo toàn học bạ, điểm danh và lịch sử. Học sinh không còn xuất hiện trong các nghiệp vụ đang hoạt động.</div>`,
        icon: 'warning', showCancelButton: true,
        confirmButtonText: 'Xác nhận ngừng học', cancelButtonText: 'Hủy', confirmButtonColor:'#dc2626'
    });
    if (result.isConfirmed) {
        try {
            const now = typeof window.serverNow === 'function' ? window.serverNow() : Date.now();
            const archiveFields = buildStudentArchiveFields('inactive', student, now);
            await window.update(window.ref(window.db, `students/${id}`), {
                status:'inactive',
                ...archiveFields,
                stoppedAt:now,
                stoppedSY:window._currentSchoolYear || '',
                inactiveReason:'Chuyển sang lưu trữ bởi Admin',
                updatedAt:now,
                updatedBy:window.currentUser?.email || '',
            });
            if (window.localData.students?.[id]) {
                Object.assign(window.localData.students[id], {
                    status:'inactive',
                    ...archiveFields,
                    stoppedAt:now,
                    stoppedSY:window._currentSchoolYear || '',
                    inactiveReason:'Chuyển sang lưu trữ bởi Admin',
                });
            }
            window._studentViewMode = 'archive';
            Swal.fire('Đã lưu trữ', 'Hồ sơ được giữ lại và chuyển vào mục Lưu trữ.', 'success');
            renderStudents();
        } catch (error) {
            Swal.fire('Lỗi', error.message, 'error');
        }
    }
}

// ═══════════════════════════════════════════════════════
// CHUYỂN LỚP
// ═══════════════════════════════════════════════════════
window.openTransferModal = function(studentId) {
    const student = window.localData.students[studentId];
    if (!student) return;
    const currentClass = student.classRoom || student.class || '';
    const allClasses = [...new Set(
        Object.values(window.localData.students).map(s => s.classRoom || s.class).filter(Boolean)
    )].sort((a, b) => a.localeCompare(b, 'vi'));

    Swal.fire({
        title: `<i class="fas fa-exchange-alt"></i> Chuyển lớp`,
        html: `
            <div style="text-align:left;margin-top:10px">
                <p style="margin-bottom:15px">
                    Học sinh: <strong style="color:#1e293b">${student.name}</strong><br>
                    Lớp hiện tại: <span class="badge badge-info" style="font-size:0.95rem;padding:5px 12px">${currentClass||'Chưa có lớp'}</span>
                </p>
                <label style="font-weight:600;margin-bottom:6px;display:block">Chuyển sang lớp:</label>
                <select id="transfer-class-select" class="form-control" style="margin-bottom:10px">
                    <option value="">-- Chọn lớp mới --</option>
                    ${allClasses.filter(c => c !== currentClass).map(c =>
                        `<option value="${c}">${c}</option>`
                    ).join('')}
                    <option value="__new__">➕ Nhập lớp mới...</option>
                </select>
                <div id="new-class-input-wrap" style="display:none;margin-top:8px">
                    <input type="text" id="transfer-new-class" class="form-control"
                           placeholder="Nhập tên lớp mới (VD: 2A, 3B)">
                </div>
                <div style="background:#fef3c7;border-left:4px solid #f59e0b;border-radius:6px;
                            padding:10px 14px;margin-top:15px;font-size:0.875rem">
                    <i class="fas fa-info-circle" style="color:#d97706"></i>
                    Toàn bộ thông tin (điểm số, điểm danh, tài chính) sẽ được giữ nguyên.
                    Chỉ cập nhật lớp học.
                </div>
                ${student.transferHistory?.length > 0 ? `
                <div style="margin-top:12px;font-size:0.82rem;color:#64748b">
                    <strong>Lịch sử chuyển lớp:</strong>
                    ${student.transferHistory.map(h =>
                        `<div style="margin-top:4px">• ${h.date}: ${h.fromClass} → ${h.toClass}</div>`
                    ).join('')}
                </div>` : ''}
            </div>`,
        showCancelButton: true,
        confirmButtonText: '<i class="fas fa-check"></i> Xác nhận chuyển lớp',
        cancelButtonText: 'Hủy',
        confirmButtonColor: '#f59e0b',
        width: 500,
        didOpen: () => {
            document.getElementById('transfer-class-select').addEventListener('change', function() {
                const wrap = document.getElementById('new-class-input-wrap');
                if (wrap) wrap.style.display = this.value === '__new__' ? 'block' : 'none';
            });
        },
        preConfirm: () => {
            let newClass = document.getElementById('transfer-class-select').value;
            if (newClass === '__new__') {
                newClass = (document.getElementById('transfer-new-class')?.value || '').trim().toUpperCase();
            }
            if (!newClass) { Swal.showValidationMessage('Vui lòng chọn hoặc nhập lớp mới'); return false; }
            if (newClass === currentClass) { Swal.showValidationMessage('Lớp mới phải khác lớp hiện tại'); return false; }
            return newClass;
        }
    }).then(async result => {
        if (result.isConfirmed) {
            Swal.fire({ title: 'Đang chuyển lớp...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
            try {
                const existingHistory = student.transferHistory || [];
                const transferNow = typeof window.serverNow === 'function' ? window.serverNow() : Date.now();
                const transferRecord = {
                    fromClass: currentClass, toClass: result.value,
                    date: new Date(transferNow).toISOString().split('T')[0],
                    by: window.currentUser?.email || 'admin', at: transferNow
                };
                const updatedStudent = {
                    ...student,
                    classRoom: result.value, class: result.value,
                    currentClassKey: classKey(result.value),
                    currentGrade: (String(result.value).match(/^(\d+)/)||[])[1] || '',
                    transferHistory: [...existingHistory, transferRecord],
                    updatedAt: transferNow,
                    updatedBy: window.currentUser?.email || '',
                };
                const updates = { [`students/${studentId}`]: updatedStudent };
                Object.assign(updates, await buildPaymentClassMoveUpdates(
                    studentId, student.code || student.id || studentId,
                    currentClass, result.value, transferNow
                ));
                await window.update(window.ref(window.db), updates);
                window.localData.students[studentId].classRoom       = result.value;
                window.localData.students[studentId].class           = result.value;
                window.localData.students[studentId].currentClassKey = classKey(result.value);
                window.localData.students[studentId].currentGrade    = (String(result.value).match(/^(\d+)/)||[])[1] || '';
                window.localData.students[studentId].transferHistory = [...existingHistory, transferRecord];
                window._allStudents = Object.values(window.localData.students);
                window._studentCurrentClass = result.value;
                renderStudents();
                Swal.fire({
                    icon: 'success', title: 'Chuyển lớp thành công!',
                    html: `<div style="text-align:left;background:#f0fdf4;border-radius:8px;padding:15px;margin-top:10px">
                        <p>👤 <strong>${student.name}</strong></p>
                        <p>📚 Lớp cũ: <span style="color:#dc2626;font-weight:600">${currentClass}</span></p>
                        <p>✅ Lớp mới: <span style="color:#16a34a;font-weight:700">${result.value}</span></p>
                    </div>`,
                    timer: 3000, showConfirmButton: false
                });
            } catch (error) {
                Swal.fire('Lỗi', error.message, 'error');
            }
        }
    });
};

// ── Excel Export/Import — cùng một schema, an toàn và có preview ─────────────
const STUDENT_EXCEL_SCHEMA = [
    // NHÓM I: THÔNG TIN HỌC SINH
    { key:'stt', header:'STT', aliases:['stt','so thu tu','no'] },
    { key:'code', header:'Mã HS', aliases:['ma hs','ma hoc sinh','student code'] },
    { key:'name', header:'Họ và tên học sinh *', aliases:['ho va ten hoc sinh','ho va ten','ho ten','ten hoc sinh'] },
    { key:'classRoom', header:'Lớp *', aliases:['lop','lop hoc','class'] },
    { key:'gender', header:'Giới tính *', aliases:['gioi tinh','phai'] },
    { key:'dob', header:'Ngày sinh (dd/mm/yyyy) *', aliases:['ngay sinh','ngay sinh dd mm yyyy','date of birth'] },
    { key:'birthPlace', header:'Nơi sinh', aliases:['noi sinh'] },
    { key:'nationalId', header:'Mã số định danh (MSĐD)', aliases:['ma so dinh danh','msdd','ma dinh danh','ma dinh danh ca nhan','cccd hoc sinh'] },
    { key:'phone', header:'Điện thoại HS', aliases:['dien thoai hs','sdt hs','dien thoai'] },
    { key:'facebook', header:'Facebook', aliases:['facebook','fb'] },
    { key:'zalo', header:'Tên Zalo', aliases:['ten zalo','zalo'] },
    { key:'sosPhone', header:'SĐT khẩn cấp (SOS)', aliases:['sdt khan cap','sdt khan cap sos','dien thoai khan cap','sos'] },
    { key:'currentAddress', header:'Địa chỉ hiện tại *', aliases:['dia chi hien tai','dia chi tam tru','noi tam tru','dia chi'] },
    { key:'permanentAddress', header:'Địa chỉ theo hộ khẩu', aliases:['dia chi theo ho khau','dia chi thuong tru','ho khau','ho khau thuong tru'] },
    { key:'religion', header:'Tôn giáo', aliases:['ton giao'] },
    { key:'religionOther', header:'Tôn giáo khác', aliases:['ton giao khac'] },
    { key:'parish', header:'Giáo xứ đang sinh hoạt', aliases:['giao xu dang sinh hoat','giao xu'] },
    { key:'catechismClass', header:'Lớp giáo lý', aliases:['lop giao ly'] },
    { key:'churchGroup', header:'Đoàn thể', aliases:['doan the'] },
    { key:'livingWith', header:'Hiện đang sống với', aliases:['hien dang song voi','song cung ai','song voi'] },
    { key:'livingWithOtherDetail', header:'Chi tiết người thân khác', aliases:['chi tiet nguoi than khac','nguoi than khac ghi ro'] },
    { key:'housingType', header:'Nơi ở hiện nay', aliases:['noi o hien nay','noi o'] },
    { key:'housingTypeOtherDetail', header:'Nơi ở khác (ghi rõ)', aliases:['noi o khac ghi ro','noi o khac'] },
    { key:'houseArea', header:'Diện tích nhà', aliases:['dien tich nha','dien tich'] },
    { key:'houseStructure', header:'Kết cấu nhà', aliases:['ket cau nha','loai nha'] },
    { key:'houseStructureOtherDetail', header:'Kết cấu khác (ghi rõ)', aliases:['ket cau khac ghi ro','ket cau khac'] },
    { key:'studentLabor', header:'Bản thân HS lao động', aliases:['ban than hs lao dong','hs lao dong'] },
    { key:'studentLaborIncome', header:'Thu nhập HS/tháng', aliases:['thu nhap hs thang','thu nhap hs'] },
    { key:'studentLaborJob', header:'Công việc HS', aliases:['cong viec hs'] },
    { key:'studentLaborTime', header:'Thời gian lao động', aliases:['thoi gian lao dong'] },
    { key:'healthNotes', header:'Bệnh lý / PH lưu ý', aliases:['benh ly ph luu y','benh ly','van de suc khoe','luu y nt'] },
    { key:'docBirthCert', header:'Giấy khai sinh (Có/Không)', aliases:['giay khai sinh co khong','giay khai sinh','gks'] },
    { key:'docBirthCertReason', header:'Lý do chưa có GKS', aliases:['ly do chua co gks','ly do chua co giay khai sinh'] },
    { key:'docResidence', header:'Địa chỉ cư trú (Có/Không)', aliases:['dia chi cu tru co khong','dia chi noi cu tru','giay cu tru'] },
    { key:'docResidenceReason', header:'Lý do chưa có cư trú', aliases:['ly do chua co cu tru','ly do chua co giay cu tru'] },
    { key:'docCccd', header:'Thẻ CCCD (Có/Không)', aliases:['the cccd co khong','the cccd','cccd'] },
    { key:'docNationalDb', header:'Đã có TT trên CSDL dân cư', aliases:['da co tt tren csdl dan cu','csdl dan cu'] },
    { key:'docNationalDbReason', header:'Lý do chưa có CSDL', aliases:['ly do chua co csdl'] },
    { key:'status', header:'Trạng thái hồ sơ *', aliases:['trang thai ho so','trang thai','tinh trang'] },
    { key:'enrollDate', header:'Ngày nhập học', aliases:['ngay nhap hoc','ngay nhan hoc','ngay nhan'] },

    // NHÓM II: THÔNG TIN CHA
    { key:'dadName', header:'Họ tên cha', aliases:['ho ten cha','cha','ho ten ba','ten ba'] },
    { key:'dadBirthYear', header:'Năm sinh cha', aliases:['nam sinh cha','nam sinh ba'] },
    { key:'dadReligion', header:'Tôn giáo cha', aliases:['ton giao cha'] },
    { key:'dadJob', header:'Nghề nghiệp cha', aliases:['nghe nghiep cha','nghe nghiep ba'] },
    { key:'dadJobStable', header:'Tính ổn định (Cha)', aliases:['tinh on dinh cha','on dinh cha'] },
    { key:'dadIncome', header:'Thu nhập cha/tháng', aliases:['thu nhap cha thang','thu nhap cha'] },
    { key:'dadPhone', header:'SĐT cha', aliases:['sdt cha','sdt ba','dien thoai cha'] },
    { key:'dadMaritalStatus', header:'Hôn nhân cha', aliases:['hon nhan cha','tinh trang hon nhan cha'] },
    { key:'dadEducation', header:'Học vấn cha', aliases:['hoc van cha','trinh do hoc van cha','trinh do cha','trinh do ba'] },
    { key:'dadBhyt', header:'BHYT cha (Có/Không)', aliases:['bhyt cha'] },
    { key:'dadBhtn', header:'BHTN cha (Có/Không)', aliases:['bhtn cha'] },
    { key:'dadNoBhReason', header:'Lý do không mua BH cha', aliases:['ly do khong mua bh cha'] },

    // NHÓM III: THÔNG TIN MẸ
    { key:'momName', header:'Họ tên mẹ', aliases:['ho ten me','me','ten me'] },
    { key:'momBirthYear', header:'Năm sinh mẹ', aliases:['nam sinh me'] },
    { key:'momReligion', header:'Tôn giáo mẹ', aliases:['ton giao me'] },
    { key:'momJob', header:'Nghề nghiệp mẹ', aliases:['nghe nghiep me'] },
    { key:'momJobStable', header:'Tính ổn định (Mẹ)', aliases:['tinh on dinh me','on dinh me'] },
    { key:'momIncome', header:'Thu nhập mẹ/tháng', aliases:['thu nhap me thang','thu nhap me'] },
    { key:'momPhone', header:'SĐT mẹ', aliases:['sdt me','dien thoai me'] },
    { key:'momMaritalStatus', header:'Hôn nhân mẹ', aliases:['hon nhan me','tinh trang hon nhan me'] },
    { key:'momEducation', header:'Học vấn mẹ', aliases:['hoc van me','trinh do hoc van me','trinh do me'] },
    { key:'momBhyt', header:'BHYT mẹ (Có/Không)', aliases:['bhyt me'] },
    { key:'momBhtn', header:'BHTN mẹ (Có/Không)', aliases:['bhtn me'] },
    { key:'momBhOther', header:'BH khác mẹ', aliases:['bh khac me','bao hiem khac me'] },

    // NHÓM IV: GIÁM HỘ
    { key:'guardianName', header:'Họ tên giám hộ', aliases:['ho ten giam ho','nguoi giam ho','nguoi nuoi duong','ten nnd'] },
    { key:'guardianBirthYear', header:'Năm sinh giám hộ', aliases:['nam sinh giam ho'] },
    { key:'guardianReligion', header:'Tôn giáo giám hộ', aliases:['ton giao giam ho'] },
    { key:'guardianJob', header:'Nghề nghiệp giám hộ', aliases:['nghe nghiep giam ho','nghe giam ho','nghe nnd'] },
    { key:'guardianJobStable', header:'Tính ổn định (Giám hộ)', aliases:['tinh on dinh giam ho'] },
    { key:'guardianIncome', header:'Thu nhập giám hộ/tháng', aliases:['thu nhap giam ho thang','thu nhap giam ho'] },
    { key:'guardianPhone', header:'SĐT giám hộ', aliases:['sdt giam ho','dien thoai giam ho','sdt nnd'] },
    { key:'guardianMaritalStatus', header:'Hôn nhân giám hộ', aliases:['hon nhan giam ho'] },
    { key:'guardianEducation', header:'Học vấn giám hộ', aliases:['hoc van giam ho','trinh do giam ho','trinh do nnd'] },
    { key:'guardianBhyt', header:'BHYT giám hộ', aliases:['bhyt giam ho'] },
    { key:'guardianBhtn', header:'BHTN giám hộ', aliases:['bhtn giam ho'] },
    { key:'guardianBhOther', header:'BH khác giám hộ', aliases:['bh khac giam ho'] },

    // NHÓM V: HOÀN CẢNH & KHẢO SÁT
    { key:'primaryCaregiver', header:'Người nuôi dưỡng chính', aliases:['nguoi nuoi duong chinh','nguoi nuoi duong'] },
    { key:'familyCircumstance', header:'Hoàn cảnh gia đình chi tiết', aliases:['hoan canh gia dinh chi tiet','hoan canh gia dinh','hoan canh'] },
    { key:'familyEconomy', header:'Kinh tế gia đình', aliases:['kinh te gia dinh','kinh te'] },
    { key:'workerCount', header:'Số người LĐ trong nhà', aliases:['so nguoi ld trong nha','so nguoi lao dong trong nha','so nguoi lao dong'] },
    { key:'outsideSupport', header:'Nguồn hỗ trợ ngoài GĐ', aliases:['nguon ho tro ngoai gd','nguon ho tro ngoai gia dinh'] },
    { key:'housematesCount', header:'Số người sống chung', aliases:['so nguoi song chung nha','so nguoi song chung'] },
    { key:'siblingsInPc', header:'Anh chị em học PC', aliases:['anh chi em hoc pc','anh chi em ruot hoc pc'] },
    { key:'notes', header:'Ghi chú khác', aliases:['ghi chu khac','ghi chu','chu y'] },
];

function studentExcelNorm(value) {
    return String(value ?? '')
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g,'d').replace(/Đ/g,'D')
        .toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
}

function studentExcelDate(value) {
    if (value === null || value === undefined || value === '') return '';
    if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0,10);
    const raw = String(value).trim();
    if (!raw) return '';
    if (/^\d{5}(?:\.\d+)?$/.test(raw)) {
        const d = new Date(Math.round((Number(raw) - 25569) * 86400 * 1000));
        return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0,10);
    }
    const m = raw.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
    if (m) return `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
    throw new Error(`Ngày không hợp lệ: ${raw}. Dùng định dạng dd/mm/yyyy hoặc yyyy-mm-dd.`);
}

function studentExcelStatus(value) {
    const raw = studentExcelNorm(value);
    if (!raw) return 'active';
    const map = {
        'active':'active','dang hoc':'active',
        'inactive':'inactive','nghi hoc':'inactive','thoi hoc':'inactive','chuyen truong':'inactive',
        'reserved':'reserved','bao luu':'reserved',
        'graduated':'graduated','hoan thanh tieu hoc':'graduated','da hoan thanh tieu hoc':'graduated',
    };
    return map[raw] || normalizeStudentStatusValue(value);
}

function studentExcelGender(value) {
    const raw = studentExcelNorm(value);
    if (!raw) return '';
    if (['nam','male'].includes(raw)) return 'Nam';
    if (['nu','female'].includes(raw)) return 'Nữ';
    throw new Error(`Giới tính "${value}" không hợp lệ; chỉ dùng Nam hoặc Nữ.`);
}

function studentExcelClass(value) {
    return String(value || '').trim().toUpperCase().replace(/\s+/g,'');
}

function studentExcelComposite(student) {
    return [studentExcelNorm(student?.name), String(student?.dob || ''), studentExcelClass(student?.classRoom || student?.class)]
        .join('|');
}

function studentExcelHeaderMap(row) {
    const normalized = row.map(studentExcelNorm);
    const map = {};
    STUDENT_EXCEL_SCHEMA.forEach(def => {
        const names = [def.header, ...(def.aliases || [])].map(studentExcelNorm);
        const index = normalized.findIndex(x => names.includes(x));
        if (index >= 0) map[def.key] = index;
    });
    // Tương thích mẫu cũ tách Họ/Tên.
    map.__ho = normalized.findIndex(x => ['ho','ho dem'].includes(x));
    map.__ten = normalized.findIndex(x => x === 'ten');
    return map;
}

function findStudentExcelHeader(rows) {
    for (let i=0; i<Math.min(rows.length, 12); i++) {
        const map = studentExcelHeaderMap(rows[i] || []);
        const hasName = map.name >= 0 || (map.__ho >= 0 && map.__ten >= 0);
        if (hasName && map.classRoom >= 0 && Object.keys(map).length >= 5) return { rowIndex:i, map };
    }
    return null;
}

function studentExcelValue(row, map, key) {
    const index = map[key];
    return index === undefined || index < 0 ? '' : String(row[index] ?? '').trim();
}

function currentStudentExportList() {
    if (Array.isArray(window._studentFilteredStudents)) return [...window._studentFilteredStudents];
    const cls = window._studentCurrentClass || '';
    return Object.values(window.localData?.students || {}).filter(s => !cls || (s.classRoom || s.class || '') === cls);
}

function buildStudentWorkbook(students, templateOnly=false) {
    const sy = window._currentSchoolYear || '2025-2026';
    const cls = templateOnly ? '________' : (window._studentCurrentClass || 'Nhiều lớp');
    
    // Header lines
    const rows = [
        ['🏫 LỚP PHỔ CẬP TH. HÙNG VƯƠNG — FMA NAM HÒA'],
        ['BẢN KHẢO SÁT & DANH SÁCH THÔNG TIN HỌC SINH CHI TIẾT'],
        ['Địa chỉ: 158-160 Đất Thánh, Kp 8, P. Tân Hòa, TP.HCM | Năm học: ' + sy + ' | Lưu ý: Không đổi tên cột ở dòng 5. Cột có dấu (*) là bắt buộc.'],
        [
            'I. THÔNG TIN HỌC SINH, LIÊN LẠC & TÌNH HÌNH PHÁP LÝ', ...Array(39).fill(''),
            'II. THÔNG TIN VỀ CHA', ...Array(11).fill(''),
            'III. THÔNG TIN VỀ MẸ', ...Array(11).fill(''),
            'IV. NGƯỜI GIÁM HỘ (NẾU CÓ)', ...Array(11).fill(''),
            'V. HOÀN CẢNH GIA ĐÌNH & KHẢO SÁT ĐÁNH GIÁ', ...Array(7).fill('')
        ],
        STUDENT_EXCEL_SCHEMA.map(x => x.header),
    ];

    if (!templateOnly && students.length > 0) {
        students.forEach((student, idx) => {
            rows.push(STUDENT_EXCEL_SCHEMA.map(def => {
                if (def.key === 'stt') return idx + 1;
                if (def.key === 'classRoom') return student.classRoom || student.class || '';
                if (def.key === 'status') return normalizeStudentStatusValue(student.status || 'active');
                if (def.key === 'dob') return formatStudentDob(student.dob);
                return student[def.key] ?? '';
            }));
        });
    } else {
        // Dòng mẫu mẫu mực chuẩn như trong ảnh khảo sát
        rows.push(STUDENT_EXCEL_SCHEMA.map(def => {
            const sample1 = {
                stt: 1, code: 'HS2025-001', name: 'TRẦN ANH KHÔI', classRoom: '2',
                gender: 'Nam', dob: '24/04/2016', birthPlace: 'BV Từ Dũ', nationalId: '079216012345',
                phone: '', facebook: '', zalo: '', sosPhone: '0937992416',
                currentAddress: '35/18 Lê Ngã, phường Tân Phú, TP.HCM (khu phố 21)',
                permanentAddress: '212/61/19 Nguyễn Thiện Thuật, phường Bàn Cờ, TP.HCM',
                religion: 'Phật giáo', religionOther: '', parish: '', catechismClass: '', churchGroup: '',
                livingWith: 'Mẹ ruột', livingWithOtherDetail: '', housingType: 'Nhà trọ', housingTypeOtherDetail: '',
                houseArea: '25 m2', houseStructure: 'Nhà cấp 4', houseStructureOtherDetail: '',
                studentLabor: 'Không lao động', studentLaborIncome: '', studentLaborJob: '', studentLaborTime: '',
                healthNotes: 'Tăng động giảm chú ý',
                docBirthCert: 'Có', docBirthCertReason: '', docResidence: 'Có', docResidenceReason: '',
                docCccd: 'Có', docNationalDb: 'Có', docNationalDbReason: '',
                status: 'active', enrollDate: '05/09/2024',
                dadName: 'Cao Hoài Phong', dadBirthYear: '1982', dadReligion: 'Phật giáo', dadJob: 'Kinh doanh',
                dadJobStable: 'Ổn định', dadIncome: '10.000.000', dadPhone: '', dadMaritalStatus: 'Độc thân',
                dadEducation: 'Đại học', dadBhyt: 'Có', dadBhtn: 'Có', dadNoBhReason: '',
                momName: 'Trần Anh Thư', momBirthYear: '1993', momReligion: 'Phật giáo', momJob: 'Bán hàng online',
                momJobStable: 'Không ổn định', momIncome: '7.000.000', momPhone: '0937992416', momMaritalStatus: 'Độc thân',
                momEducation: 'Đại học', momBhyt: 'Có', momBhtn: 'Có', momBhOther: '',
                guardianName: '', guardianBirthYear: '', guardianReligion: '', guardianJob: '', guardianJobStable: '',
                guardianIncome: '', guardianPhone: '', guardianMaritalStatus: '', guardianEducation: '',
                guardianBhyt: '', guardianBhtn: '', guardianBhOther: '',
                primaryCaregiver: 'Mẹ ruột',
                familyCircumstance: 'Mẹ đơn thân, lao động thu nhập không ổn định, phải thuê trọ và chăm con nhỏ',
                familyEconomy: 'Thấp', workerCount: '1', outsideSupport: 'Không có',
                housematesCount: '3', siblingsInPc: 'Không có', notes: 'Học sinh tiến bộ, ngoan'
            };
            return sample1[def.key] ?? '';
        }));
    }

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const lastCol = STUDENT_EXCEL_SCHEMA.length - 1;
    ws['!merges'] = [
        {s:{r:0,c:0}, e:{r:0,c:lastCol}},
        {s:{r:1,c:0}, e:{r:1,c:lastCol}},
        {s:{r:2,c:0}, e:{r:2,c:lastCol}},
        // Nhóm 1: col 0 đến 39
        {s:{r:3,c:0}, e:{r:3,c:39}},
        // Nhóm 2: col 40 đến 51
        {s:{r:3,c:40}, e:{r:3,c:51}},
        // Nhóm 3: col 52 đến 63
        {s:{r:3,c:52}, e:{r:3,c:63}},
        // Nhóm 4: col 64 đến 75
        {s:{r:3,c:64}, e:{r:3,c:75}},
        // Nhóm 5: col 76 đến lastCol
        {s:{r:3,c:76}, e:{r:3,c:lastCol}},
    ];
    ws['!freeze'] = {xSplit:4, ySplit:5, topLeftCell:'E6'};
    ws['!cols'] = STUDENT_EXCEL_SCHEMA.map(def => ({wch: Math.max(12, Math.min(36, def.header.length + 4))}));
    ws['!dataValidation'] = [
        {sqref:`E6:E5000`, type:'list', formula1:'"Nam,Nữ"', showErrorMessage:true, error:'Chỉ nhập Nam hoặc Nữ'},
        {sqref:`AM6:AM5000`, type:'list', formula1:'"active,inactive,reserved,graduated"', showErrorMessage:true, error:'Trạng thái không hợp lệ'},
        {sqref:`CA6:CA5000`, type:'list', formula1:'"Thấp,Khó khăn,Hộ nghèo,Hộ cận nghèo,Trung bình,Khá"', showErrorMessage:true, error:'Chọn mức kinh tế'}
    ];

    // Sheet 2: Hướng dẫn
    const guide = XLSX.utils.aoa_to_sheet([
        ['QUY ĐỊNH & HƯỚNG DẪN NHẬP DANH SÁCH KHẢO SÁT HỌC SINH'],
        ['1. Hàng 5 là Hàng Tiêu Đề Cột chuẩn — tuyệt đối không đổi tên hoặc xóa các cột có dấu (*).'],
        ['2. Họ và tên học sinh, Lớp, Ngày sinh, Giới tính, Địa chỉ hiện tại là thông tin bắt buộc.'],
        ['3. Mã HS để trống khi thêm mới; hệ thống sẽ tự động cấp mã theo cấu hình năm học.'],
        ['4. Giới tính chọn: Nam hoặc Nữ. Ngày sinh nhập dạng dd/mm/yyyy (ví dụ: 24/04/2016).'],
        ['5. Trạng thái hồ sơ: active (Đang học), leave/inactive (Nghỉ học), reserved (Bảo lưu), graduated (Hoàn thành TH).'],
        ['6. Kinh tế gia đình: Thấp, Khó khăn, Hộ nghèo, Hộ cận nghèo, Trung bình, Khá.'],
        ['7. File mẫu đã được kẻ viền, chia nhóm màu sắc logic và có sẵn 1 dòng dữ liệu mẫu để tham khảo.'],
        ['8. File này không chứa cột học phí; dữ liệu tài chính được quản lý riêng tại phân hệ Tài chính.'],
    ]);
    guide['!cols'] = [{wch:100}];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'DanhSachHocSinh');
    XLSX.utils.book_append_sheet(wb, guide, 'HuongDan_QuyDinh');
    return wb;
}

export function exportExcel() {
    const students = currentStudentExportList();
    if (!students.length) {
        Swal.fire('Chưa có dữ liệu', 'Không có học sinh trong lớp hoặc bộ lọc hiện tại.', 'info');
        return;
    }
    const cls = (window._studentCurrentClass || 'nhieu_lop').replace(/[^\p{L}\p{N}_-]+/gu,'_');
    const sy = (window._currentSchoolYear || 'nam_hoc').replace(/-/g,'_');
    XLSX.writeFile(buildStudentWorkbook(students, false), `Danh_sach_hoc_sinh_${cls}_${sy}.xlsx`);
}

export async function downloadStudentTemplate() {
    const templateUrl = 'templates/FileMau_ThongTin_HocSinh.xlsx?v=5.36.2';
    try {
        const resp = await fetch(templateUrl);
        if (resp.ok) {
            const blob = await resp.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'FileMau_ThongTin_HocSinh_FMA_NamHoa.xlsx';
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            return;
        }
    } catch (e) {
        console.warn('[Smart School] Không tải trực tiếp được template tĩnh, chuyển sang tạo bằng SheetJS:', e);
    }
    XLSX.writeFile(buildStudentWorkbook([], true), 'FileMau_ThongTin_HocSinh_FMA_NamHoa.xlsx');
}
window.downloadStudentTemplate = downloadStudentTemplate;

export function importExcel(inp) {
    const file = inp.files?.[0];
    if (!file) return;
    inp.value = '';
    if (window.userRole !== 'admin' && window.userRole !== 'teacher') {
        Swal.fire('Không có quyền', 'Chỉ Quản trị viên và Giáo viên mới được nhập danh sách học sinh.', 'warning');
        return;
    }

    const reader = new FileReader();
    reader.onload = async event => {
        const reservedCodes = [];
        try {
            const workbook = XLSX.read(event.target.result, {type:'array', cellDates:true});
            const sheetName = workbook.SheetNames.find(n => !studentExcelNorm(n).includes('huong dan')) || workbook.SheetNames[0];
            const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {header:1, defval:'', raw:true});
            const header = findStudentExcelHeader(rows);
            if (!header) throw new Error('Không tìm thấy hàng tiêu đề chuẩn. Hãy dùng nút “Tải mẫu Excel”.');

            const existingByCode = new Map();
            const existingByNationalId = new Map();
            const existingByComposite = new Map();
            Object.entries(window.localData?.students || {}).forEach(([key, student]) => {
                const item = {key, student};
                const code = normalizeStudentCode(student.code || student.id);
                const nid = normalizeNationalId(student.nationalId);
                const composite = studentExcelComposite(student);
                if (code) existingByCode.set(code, item);
                if (nid) existingByNationalId.set(nid, item);
                if (composite && !composite.startsWith('||')) existingByComposite.set(composite, item);
            });

            const seenCodes = new Map(), seenNationalIds = new Map(), seenComposite = new Map();
            const parsed = [], errors = [];
            for (let r = header.rowIndex + 1; r < rows.length; r++) {
                const row = rows[r] || [];
                const rowNo = r + 1;
                let name = studentExcelValue(row, header.map, 'name');
                if (!name && header.map.__ho >= 0 && header.map.__ten >= 0) {
                    name = `${row[header.map.__ho] || ''} ${row[header.map.__ten] || ''}`.trim();
                }
                const rawClass = studentExcelValue(row, header.map, 'classRoom');
                const hasAny = row.some(value => String(value ?? '').trim() !== '');
                if (!hasAny) continue;
                if (!name && !rawClass) continue;

                try {
                    let classRoom = studentExcelClass(rawClass);
                    if (!classRoom && window.userRole === 'teacher' && window.teacherClass) {
                        classRoom = studentExcelClass(window.teacherClass);
                    }
                    if (!name) throw new Error('Thiếu Họ và tên.');
                    if (!classRoom) throw new Error('Thiếu Lớp.');
                    if (!/^[1-5]/.test(classRoom)) throw new Error(`Lớp "${rawClass || classRoom}" phải bắt đầu bằng khối 1-5.`);
                    if (window.userRole === 'teacher' && window.teacherClass) {
                        const teacherClassNorm = window.teacherClass.toUpperCase().replace(/\s+/g, '');
                        if (classRoom.toUpperCase().replace(/\s+/g, '') !== teacherClassNorm) {
                            throw new Error(`Bạn chỉ có quyền nhập học sinh cho lớp phụ trách (${window.teacherClass}), dòng này ghi lớp "${classRoom}".`);
                        }
                    }
                    const code = normalizeStudentCode(studentExcelValue(row, header.map, 'code'));
                    const nationalId = normalizeNationalId(studentExcelValue(row, header.map, 'nationalId'));
                    const data = {};
                    STUDENT_EXCEL_SCHEMA.forEach(def => {
                        const value = studentExcelValue(row, header.map, def.key);
                        if (value !== '') data[def.key] = value;
                    });
                    data.name = name.replace(/\s+/g,' ').trim();
                    data.classRoom = classRoom;
                    data.class = classRoom;
                    data.currentClassKey = classKey(classRoom);
                    data.currentGrade = (classRoom.match(/^([1-5])/) || [,''])[1];
                    if ('gender' in data) data.gender = studentExcelGender(data.gender);
                    if ('dob' in data) data.dob = studentExcelDate(data.dob);
                    if ('enrollDate' in data) data.enrollDate = studentExcelDate(data.enrollDate);
                    data.nationalId = nationalId;
                    data.status = studentExcelStatus(data.status || 'active');
                    if (code) data.code = code;

                    const composite = studentExcelComposite(data);
                    const duplicate = (map, key, label) => {
                        if (!key) return;
                        if (map.has(key)) throw new Error(`${label} trùng với dòng ${map.get(key)}.`);
                        map.set(key, rowNo);
                    };
                    duplicate(seenCodes, code, 'Mã HS');
                    duplicate(seenNationalIds, nationalId, 'Mã định danh');
                    duplicate(seenComposite, composite, 'Họ tên + ngày sinh + lớp');

                    const matches = [
                        code ? existingByCode.get(code) : null,
                        nationalId ? existingByNationalId.get(nationalId) : null,
                        existingByComposite.get(composite),
                    ].filter(Boolean);
                    const keys = [...new Set(matches.map(x => x.key))];
                    if (keys.length > 1) throw new Error('Mã HS, mã định danh và thông tin cá nhân đang khớp với nhiều hồ sơ khác nhau.');
                    const existing = matches[0] || null;
                    if (existing && code && normalizeStudentCode(existing.student.code || existing.student.id) !== code) {
                        throw new Error('Không được đổi Mã HS qua Excel. Hãy sửa trực tiếp trong hồ sơ học sinh.');
                    }
                    parsed.push({rowNo, data, existing});
                } catch (error) {
                    errors.push(`Dòng ${rowNo}: ${error.message}`);
                }
            }

            if (!parsed.length && !errors.length) throw new Error('File không có dòng dữ liệu học sinh.');
            if (errors.length) {
                await Swal.fire({
                    icon:'error', title:`Có ${errors.length} lỗi — chưa nhập dữ liệu`,
                    html:`<div style="text-align:left;max-height:330px;overflow:auto;font-size:.86rem">${errors.slice(0,30).map(x=>`<div style="padding:5px 0;border-bottom:1px solid #fee2e2">• ${escapeStudentHtml(x)}</div>`).join('')}${errors.length>30?`<p>… và ${errors.length-30} lỗi khác</p>`:''}</div><p style="margin-top:10px">Sửa file rồi nhập lại. Hệ thống chưa ghi bất kỳ hồ sơ nào.</p>`,
                    width:700,
                });
                return;
            }

            const inserts = parsed.filter(x => !x.existing).length;
            const updatesCount = parsed.length - inserts;
            const preview = await Swal.fire({
                icon:'question', title:'Xác nhận nhập danh sách học sinh',
                html:`<div style="text-align:left;line-height:1.8">
                    <p>📄 File: <b>${escapeStudentHtml(file.name)}</b></p>
                    <p>✅ Dòng hợp lệ: <b>${parsed.length}</b></p>
                    <p>➕ Thêm mới: <b style="color:#16a34a">${inserts}</b></p>
                    <p>🔄 Cập nhật hồ sơ cũ: <b style="color:#2563eb">${updatesCount}</b></p>
                    <p>💰 Học phí: <b>không nhập từ file này</b></p>
                    <p style="font-size:.82rem;color:#64748b">Dữ liệu chỉ được ghi sau bước xác nhận này.</p>
                </div>`,
                showCancelButton:true, confirmButtonText:'Nhập dữ liệu', cancelButtonText:'Hủy', confirmButtonColor:'#16a34a'
            });
            if (!preview.isConfirmed) return;

            Swal.fire({title:'Đang kiểm tra và ghi dữ liệu...',allowOutsideClick:false,didOpen:()=>Swal.showLoading()});
            const updates = {};
            const localChanges = [];
            const now = typeof window.serverNow === 'function' ? window.serverNow() : Date.now();

            for (const item of parsed) {
                if (item.existing) {
                    const {key, student} = item.existing;
                    const payload = {};
                    Object.entries(item.data).forEach(([field,value]) => {
                        if (field === 'code') return;
                        if (value === '' || value === null || value === undefined) return;
                        if (String(student[field] ?? '').trim() !== String(value).trim()) payload[field] = value;
                    });
                    if (Object.keys(payload).length) {
                        payload.updatedAt = now;
                        payload.updatedBy = window.currentUser?.email || '';
                        payload.updatedByUid = window.currentUser?.uid || '';
                        Object.entries(payload).forEach(([field,value]) => updates[`students/${key}/${field}`] = value);
                        const oldClass = student.classRoom || student.class || '';
                        const newClass = payload.classRoom || oldClass;
                        Object.assign(updates, await buildPaymentClassMoveUpdates(key, student.code || student.id || key, oldClass, newClass, now));
                        localChanges.push({key, payload});
                    }
                    continue;
                }

                const newRef = window.push(window.ref(window.db,'students'));
                let code = item.data.code || '';
                if (code) {
                    code = await reserveUniqueStudentCode(code, newRef.key);
                } else {
                    code = (await reserveGeneratedStudentCodeFromConfig(newRef.key)).code;
                }
                reservedCodes.push({code,key:newRef.key});
                const data = {
                    ...item.data,
                    id:newRef.key,
                    code,
                    status:item.data.status || 'active',
                    enrollDate:item.data.enrollDate || new Date().toISOString().slice(0,10),
                    createdAt:now, updatedAt:now,
                    createdBy:window.currentUser?.email || '', updatedBy:window.currentUser?.email || '',
                    createdByUid:window.currentUser?.uid || '', updatedByUid:window.currentUser?.uid || '',
                };
                updates[`students/${newRef.key}`] = data;
                localChanges.push({key:newRef.key, payload:data, replace:true});
            }

            if (Object.keys(updates).length) await window.update(window.ref(window.db), updates);
            localChanges.forEach(change => {
                if (change.replace) window.localData.students[change.key] = change.payload;
                else Object.assign(window.localData.students[change.key] || {}, change.payload);
            });
            window._allStudents = Object.values(window.localData.students || {});
            applyStudentFilter();
            Swal.close();
            await Swal.fire({icon:'success',title:'Nhập danh sách thành công',html:`Đã thêm <b>${inserts}</b> và rà soát/cập nhật <b>${updatesCount}</b> hồ sơ.`,confirmButtonText:'Đóng'});
        } catch (error) {
            for (const reserved of reservedCodes) await releaseStudentCodeIndex(reserved.code, reserved.key);
            Swal.close();
            Swal.fire('Không thể nhập file', escapeStudentHtml(error.message || String(error)), 'error');
        }
    };
    reader.readAsArrayBuffer(file);
}
