// ══════════════════════════════════════════════════════════════════════════════
// commentbank.js — Ngân hàng nhận xét tự động theo khối (Smart School V5.6)
// Nguồn: Bộ nhận xét môn học, năng lực và phẩm chất chuẩn hóa theo cơ sở dữ liệu.
// - Tự gợi ý theo khối, môn, mức đạt được và khoảng điểm.
// - Không ghi đè nhận xét đã nhập tay.
// - Nút ✨ dùng để đổi sang câu gợi ý khác.
// ══════════════════════════════════════════════════════════════════════════════

console.info('[Smart School V5.6] commentbank.js loaded (Updated with custom bank)');

const COMMENT_BANK = {
  "version": "5.6.1",
  "grades": {
  "1": {
    "subjects": {
      "tieng viet": {
        "high": [
          "Đọc to, rõ ràng, tốc độ đọc đạt yêu cầu; nhận diện và phát âm đúng các âm, vần khó.",
          "Chữ viết đúng mẫu, đều nét, đúng khoảng cách; trình bày vở sạch sẽ; viết đúng chính tả.",
          "Nắm chắc cấu trúc câu ngắn, trả lời lưu loát các câu hỏi hỏi-đáp về bài đọc."
        ],
        "good": [
          "Đọc đúng âm, vần, tiếng và từ ngữ; biết ngắt nghỉ hơi ở các dấu câu cơ bản.",
          "Viết đúng cỡ chữ, đúng quy trình viết nhưng tốc độ viết bài đôi lúc còn hơi chậm.",
          "Hiểu nội dung bài đọc ở mức cơ bản; cần mạnh dạn phát biểu to hơn trước lớp."
        ],
        "pass": [
          "Còn đánh vần chậm ở một số vần kép khó; tốc độ đọc thành tiếng chưa cao.",
          "Chữ viết chưa đều nét, viết hoa hoặc nối nét giữa các chữ cái chưa đúng quy định.",
          "Em cần chú ý rèn đọc thành tiếng và luyện viết bảng con/vở ô ly nhiều hơn ở nhà."
        ],
        "fail": [
          "Chưa thuộc hết bảng chữ cái; tốc độ đọc quá chậm và phải đánh vần từng tiếng.",
          "Viết sai lệch cỡ chữ, chưa hoàn thành được các câu chính tả ngắn tại lớp.",
          "Giáo viên tăng cường kèm cặp phối hợp cùng phụ huynh hướng dẫn em nhận diện lại con chữ mỗi tối."
        ]
      },
      "toan": {
        "high": [
          "Nhận biết, đọc, viết thành thạo các số trong phạm vi 100; tính nhẩm nhanh và chính xác.",
          "Thực hiện tốt các phép tính cộng, trừ không nhớ trong phạm vi 10, phạm vi 100.",
          "Nhận diện tốt các hình phẳng (hình vuông, tròn, tam giác, chữ nhật) và giải tốt bài toán có lời văn."
        ],
        "good": [
          "Thực hiện đúng các phép tính theo yêu cầu của giáo viên; biết so sánh các số.",
          "Hiểu bài, tự hoàn thành các bài tập toán tại lớp; cần chú ý viết chữ số ngay ngắn hơn.",
          "Biết cách làm toán có lời văn nhưng viết câu lời giải còn chậm."
        ],
        "pass": [
          "Kỹ năng tính toán cộng, trừ trong phạm vi 10, 100 còn chậm, đôi khi phải đếm ngón tay.",
          "Còn lúng túng khi sử dụng các dấu so sánh (>, <, =) hoặc điền số vào ô trống.",
          "Em cần rèn thêm các phép tính cơ bản và tập đọc kỹ đề bài toán."
        ],
        "fail": [
          "Chưa đếm và viết đúng các số trong phạm vi 20; sai sót nhiều ở các phép tính cộng trừ đơn giản.",
          "Không nhận diện được các hình hình học cơ bản hoặc các ngày trong tuần.",
          "Giáo viên sẽ bổ trợ kiến thức riêng tại lớp; đề nghị phụ huynh kiểm tra các phép tính đơn giản của con."
        ]
      },
      "other": {
        "high": [
          "Thích nghi tốt với môn học; hoàn thành sản phẩm đẹp mắt; thực hiện đúng các tư thế vận động cơ bản; hát đúng giai điệu bài hát lớp 1."
        ],
        "good": [
          "Có ý thức học tập, chuẩn bị đủ đồ dùng học tập; tham gia đầy đủ các hoạt động cùng bạn; cần tự tin hơn khi trình bày."
        ],
        "pass": [
          "Có ý thức học tập, chuẩn bị đủ đồ dùng học tập; tham gia đầy đủ các hoạt động cùng bạn; cần tự tin hơn khi trình bày."
        ],
        "fail": [
          "Còn bỡ ngỡ, chưa tập trung nghe hướng dẫn; sản phẩm hoặc động tác chưa hoàn thiện. Biện pháp: Giáo viên chú ý động viên và nhắc nhở em tập trung tham gia cùng tập thể."
        ]
      },
      "tu nhien va xa hoi": {
        "high": [
          "Thích nghi tốt với môn học; hoàn thành sản phẩm đẹp mắt; thực hiện đúng các tư thế vận động cơ bản; hát đúng giai điệu bài hát lớp 1."
        ],
        "good": [
          "Có ý thức học tập, chuẩn bị đủ đồ dùng học tập; tham gia đầy đủ các hoạt động cùng bạn; cần tự tin hơn khi trình bày."
        ],
        "pass": [
          "Có ý thức học tập, chuẩn bị đủ đồ dùng học tập; tham gia đầy đủ các hoạt động cùng bạn; cần tự tin hơn khi trình bày."
        ],
        "fail": [
          "Còn bỡ ngỡ, chưa tập trung nghe hướng dẫn; sản phẩm hoặc động tác chưa hoàn thiện. Biện pháp: Giáo viên chú ý động viên và nhắc nhở em tập trung tham gia cùng tập thể."
        ]
      },
      "dao duc": {
        "high": [
          "Thích nghi tốt với môn học; hoàn thành sản phẩm đẹp mắt; thực hiện đúng các tư thế vận động cơ bản; hát đúng giai điệu bài hát lớp 1."
        ],
        "good": [
          "Có ý thức học tập, chuẩn bị đủ đồ dùng học tập; tham gia đầy đủ các hoạt động cùng bạn; cần tự tin hơn khi trình bày."
        ],
        "pass": [
          "Có ý thức học tập, chuẩn bị đủ đồ dùng học tập; tham gia đầy đủ các hoạt động cùng bạn; cần tự tin hơn khi trình bày."
        ],
        "fail": [
          "Còn bỡ ngỡ, chưa tập trung nghe hướng dẫn; sản phẩm hoặc động tác chưa hoàn thiện. Biện pháp: Giáo viên chú ý động viên và nhắc nhở em tập trung tham gia cùng tập thể."
        ]
      },
      "am nhac": {
        "high": [
          "Thích nghi tốt với môn học; hoàn thành sản phẩm đẹp mắt; thực hiện đúng các tư thế vận động cơ bản; hát đúng giai điệu bài hát lớp 1."
        ],
        "good": [
          "Có ý thức học tập, chuẩn bị đủ đồ dùng học tập; tham gia đầy đủ các hoạt động cùng bạn; cần tự tin hơn khi trình bày."
        ],
        "pass": [
          "Có ý thức học tập, chuẩn bị đủ đồ dùng học tập; tham gia đầy đủ các hoạt động cùng bạn; cần tự tin hơn khi trình bày."
        ],
        "fail": [
          "Còn bỡ ngỡ, chưa tập trung nghe hướng dẫn; sản phẩm hoặc động tác chưa hoàn thiện. Biện pháp: Giáo viên chú ý động viên và nhắc nhở em tập trung tham gia cùng tập thể."
        ]
      },
      "mi thuat": {
        "high": [
          "Thích nghi tốt với môn học; hoàn thành sản phẩm đẹp mắt; thực hiện đúng các tư thế vận động cơ bản; hát đúng giai điệu bài hát lớp 1."
        ],
        "good": [
          "Có ý thức học tập, chuẩn bị đủ đồ dùng học tập; tham gia đầy đủ các hoạt động cùng bạn; cần tự tin hơn khi trình bày."
        ],
        "pass": [
          "Có ý thức học tập, chuẩn bị đủ đồ dùng học tập; tham gia đầy đủ các hoạt động cùng bạn; cần tự tin hơn khi trình bày."
        ],
        "fail": [
          "Còn bỡ ngỡ, chưa tập trung nghe hướng dẫn; sản phẩm hoặc động tác chưa hoàn thiện. Biện pháp: Giáo viên chú ý động viên và nhắc nhở em tập trung tham gia cùng tập thể."
        ]
      },
      "giao duc the chat": {
        "high": [
          "Thích nghi tốt với môn học; hoàn thành sản phẩm đẹp mắt; thực hiện đúng các tư thế vận động cơ bản; hát đúng giai điệu bài hát lớp 1."
        ],
        "good": [
          "Có ý thức học tập, chuẩn bị đủ đồ dùng học tập; tham gia đầy đủ các hoạt động cùng bạn; cần tự tin hơn khi trình bày."
        ],
        "pass": [
          "Có ý thức học tập, chuẩn bị đủ đồ dùng học tập; tham gia đầy đủ các hoạt động cùng bạn; cần tự tin hơn khi trình bày."
        ],
        "fail": [
          "Còn bỡ ngỡ, chưa tập trung nghe hướng dẫn; sản phẩm hoặc động tác chưa hoàn thiện. Biện pháp: Giáo viên chú ý động viên và nhắc nhở em tập trung tham gia cùng tập thể."
        ]
      },
      "hoat dong trai nghiem": {
        "high": [
          "Thích nghi tốt với môn học; hoàn thành sản phẩm đẹp mắt; thực hiện đúng các tư thế vận động cơ bản; hát đúng giai điệu bài hát lớp 1."
        ],
        "good": [
          "Có ý thức học tập, chuẩn bị đủ đồ dùng học tập; tham gia đầy đủ các hoạt động cùng bạn; cần tự tin hơn khi trình bày."
        ],
        "pass": [
          "Có ý thức học tập, chuẩn bị đủ đồ dùng học tập; tham gia đầy đủ các hoạt động cùng bạn; cần tự tin hơn khi trình bày."
        ],
        "fail": [
          "Còn bỡ ngỡ, chưa tập trung nghe hướng dẫn; sản phẩm hoặc động tác chưa hoàn thiện. Biện pháp: Giáo viên chú ý động viên và nhắc nhở em tập trung tham gia cùng tập thể."
        ]
      },
      "tieng dan toc": {
        "high": [
          "Thích nghi tốt với môn học; hoàn thành sản phẩm đẹp mắt; thực hiện đúng các tư thế vận động cơ bản; hát đúng giai điệu bài hát lớp 1."
        ],
        "good": [
          "Có ý thức học tập, chuẩn bị đủ đồ dùng học tập; tham gia đầy đủ các hoạt động cùng bạn; cần tự tin hơn khi trình bày."
        ],
        "pass": [
          "Có ý thức học tập, chuẩn bị đủ đồ dùng học tập; tham gia đầy đủ các hoạt động cùng bạn; cần tự tin hơn khi trình bày."
        ],
        "fail": [
          "Còn bỡ ngỡ, chưa tập trung nghe hướng dẫn; sản phẩm hoặc động tác chưa hoàn thiện. Biện pháp: Giáo viên chú ý động viên và nhắc nhở em tập trung tham gia cùng tập thể."
        ]
      }
    },
    "qualities": {
      "yeu nuoc": {
        "high": [
          "Có ý thức bảo vệ của công và giữ gìn cảnh quan lớp học sạch đẹp."
        ],
        "good": [
          "Có ý thức bảo vệ của công và giữ gìn cảnh quan lớp học sạch đẹp."
        ],
        "fail": [
          "Cần nâng cao ý thức giữ gìn vệ sinh và bảo vệ cảnh quan lớp học sạch đẹp hơn."
        ]
      },
      "nhan ai": {
        "high": [
          "Biết yêu thương, nhường nhịn bạn bè; sẵn sàng cho bạn mượn bút, tẩy khi bạn quên đem theo."
        ],
        "good": [
          "Biết yêu thương, nhường nhịn bạn bè; sẵn sàng cho bạn mượn bút, tẩy khi bạn quên đem theo."
        ],
        "fail": [
          "Cần biết hòa đồng, yêu thương và nhường nhịn, giúp đỡ bạn bè trong lớp."
        ]
      },
      "cham chi": {
        "high": [
          "Đi học đều và đúng giờ; hoàn thành bài tập vẽ/viết được giao; tích cực tham gia giữ vệ sinh lớp học."
        ],
        "good": [
          "Đi học đều và đúng giờ; hoàn thành bài tập vẽ/viết được giao; tích cực tham gia giữ vệ sinh lớp học."
        ],
        "fail": [
          "Cần đi học đúng giờ và tích cực, tự giác hoàn thành các bài tập viết/vẽ tại lớp."
        ]
      },
      "trung thuc": {
        "high": [
          "Thật thà, không tự tiện lấy đồ của bạn; nhặt được của rơi biết trả lại người mất; biết nhận lỗi khi làm sai."
        ],
        "good": [
          "Thật thà, không tự tiện lấy đồ của bạn; nhặt được của rơi biết trả lại người mất; biết nhận lỗi khi làm sai."
        ],
        "fail": [
          "Cần thật thà, mạnh dạn nhận lỗi và biết sửa lỗi khi làm sai."
        ]
      },
      "trach nhiem": {
        "high": [
          "Tự giác thu dọn sách vở, đồ dùng sau mỗi tiết học; thực hiện tốt các quy định về nền nếp lớp 1."
        ],
        "good": [
          "Tự giác thu dọn sách vở, đồ dùng sau mỗi tiết học; thực hiện tốt các quy định về nền nếp lớp 1."
        ],
        "fail": [
          "Cần rèn luyện tính tự giác thu dọn sách vở, đồ dùng học tập và thực hiện tốt nền nếp lớp học."
        ]
      }
    },
    "commonCompetencies": {
      "tu chu va tu hoc": {
        "high": [
          "Đã quen với nền nếp học tập; tự chuẩn bị được đồ dùng học tập theo thời khóa biểu."
        ],
        "good": [
          "Đã quen với nền nếp học tập; tự chuẩn bị được đồ dùng học tập theo thời khóa biểu."
        ],
        "fail": [
          "Còn hay quên đồ dùng (bút, thước, đất nặn); cần chú ý giữ gìn sách vở sạch sẽ hơn."
        ]
      },
      "giao tiep va hop tac": {
        "high": [
          "Biết chào hỏi thầy cô, hòa đồng với các bạn; bước đầu biết làm việc theo cặp, theo nhóm nhỏ."
        ],
        "good": [
          "Biết chào hỏi thầy cô, hòa đồng với các bạn; bước đầu biết làm việc theo cặp, theo nhóm nhỏ."
        ],
        "fail": [
          "Còn nói leo hoặc nói quá nhỏ; cần biết giơ tay phát biểu và lắng nghe khi bạn khác nói."
        ]
      },
      "giai quyet van de va sang tao": {
        "high": [
          "Biết thực hiện nhiệm vụ theo hướng dẫn của cô; có nhiều ý tưởng vẽ tranh sinh động."
        ],
        "good": [
          "Biết thực hiện nhiệm vụ theo hướng dẫn của cô; có nhiều ý tưởng vẽ tranh sinh động."
        ],
        "fail": [
          "Khi gặp bài toán khó hoặc tình huống lạ còn lúng túng; cần mạnh dạn hỏi giáo viên để được giúp đỡ."
        ]
      }
    },
    "specificCompetencies": {
      "ngon ngu": {
        "high": [
          "Trả lời tròn câu; biết dùng điệu bộ để diễn đạt ý muốn; biết lắng nghe và kể lại câu chuyện ngắn."
        ],
        "good": [
          "Trả lời tròn câu; biết dùng điệu bộ để diễn đạt ý muốn; biết lắng nghe và kể lại câu chuyện ngắn."
        ],
        "fail": [
          "Cần rèn luyện thêm kỹ năng diễn đạt tròn câu và tập trung lắng nghe khi giao tiếp."
        ]
      },
      "tinh toan": {
        "high": [
          "Sử dụng tốt đồ dùng học toán; nhận biết và phân biệt được vị trí (trên - dưới, trước - sau, phải - trái)."
        ],
        "good": [
          "Sử dụng tốt đồ dùng học toán; nhận biết và phân biệt được vị trí (trên - dưới, trước - sau, phải - trái)."
        ],
        "fail": [
          "Cần chú ý rèn thêm kỹ năng sử dụng đồ dùng học toán và xác định vị trí, phương hướng."
        ]
      },
      "the chat": {
        "high": [
          "Thao tác đúng các tư thế đội hình đội ngũ cơ bản và các trò chơi vận động lớp 1."
        ],
        "good": [
          "Thao tác đúng các tư thế đội hình đội ngũ cơ bản và các trò chơi vận động lớp 1."
        ],
        "fail": [
          "Cần rèn luyện thêm sự nhanh nhẹn và thực hiện đúng các tư thế vận động cơ bản."
        ]
      },
      "tham mi": {
        "high": [
          "Có cảm thụ nghệ thuật tốt; biết thể hiện ý tưởng qua nét vẽ sinh động và hát đúng giai điệu."
        ],
        "good": [
          "Có cảm thụ nghệ thuật tốt; biết thể hiện ý tưởng qua nét vẽ sinh động và hát đúng giai điệu."
        ],
        "fail": [
          "Còn rụt rè khi thể hiện bài hát hoặc chưa hoàn thiện sản phẩm vẽ theo yêu cầu."
        ]
      },
      "khoa hoc": {
        "high": [
          "Có ý thức quan sát các sự vật, hiện tượng xung quanh; nhận biết tốt các đồ vật quen thuộc."
        ],
        "good": [
          "Có ý thức quan sát các sự vật, hiện tượng xung quanh; nhận biết tốt các đồ vật quen thuộc."
        ],
        "fail": [
          "Cần chú ý quan sát và tìm hiểu thế giới tự nhiên xung quanh nhiều hơn."
        ]
      },
      "tin hoc": {
        "high": [
          "Bước đầu làm quen với các thiết bị học tập; có ý thức giữ gìn và bảo quản thiết bị."
        ],
        "good": [
          "Bước đầu làm quen với các thiết bị học tập; có ý thức giữ gìn và bảo quản thiết bị."
        ],
        "fail": [
          "Cần chú ý lắng nghe cô hướng dẫn khi làm quen với các thiết bị học tập."
        ]
      },
      "cong nghe": {
        "high": [
          "Khéo tay trong các bài tập thủ công xé dán; sử dụng an toàn các dụng cụ học tập."
        ],
        "good": [
          "Khéo tay trong các bài tập thủ công xé dán; sử dụng an toàn các dụng cụ học tập."
        ],
        "fail": [
          "Thao tác xé dán thủ công còn chậm; cần rèn luyện thêm sự khéo léo."
        ]
      }
    }
  },
  "2": {
    "subjects": {
      "tieng viet": {
        "high": [
          "Lớp 2: Đọc to, rõ ràng, trôi chảy; bước đầu biết đọc phân biệt lời nhân vật; viết được đoạn văn ngắn đúng ngữ pháp, từ ngữ sinh động.",
          "Chữ viết đúng mẫu, đều nét, đúng khoảng cách, trình bày bài sạch đẹp."
        ],
        "good": [
          "Đọc trôi chảy toàn bài, ngắt nghỉ đúng dấu câu; trả lời đúng các câu hỏi đọc hiểu cơ bản.",
          "Viết đúng cỡ chữ, đúng chính tả; đoạn văn đủ ý nhưng dùng từ còn đơn điệu, chưa sinh động.",
          "Cần đọc thêm sách để mở rộng vốn từ và tăng tốc độ viết bài."
        ],
        "pass": [
          "Đọc còn chậm, hay ngắc ngứ ở các từ ngữ dài hoặc vần khó; hiểu nội dung bài ở mức sơ giản.",
          "Chữ viết chưa đều nét, bài viết còn sai một số lỗi chính tả (như ch/tr, l/n, dấu thanh). Đoạn văn viết còn ngắn, lặp từ.",
          "Em cần tăng cường rèn đọc thành tiếng và luyện viết câu/đoạn văn nhiều hơn ở nhà."
        ],
        "fail": [
          "Tốc độ đọc quá chậm, phải đánh vần nhiều; chưa hiểu nội dung văn bản.",
          "Chữ viết sai lệch cỡ chữ, chưa biết cách viết một câu hoàn chỉnh, hay bỏ dở bài viết chính tả tại lớp.",
          "Cần phối hợp chặt chẽ với phụ huynh để kèm đọc hiểu và luyện viết cho em mỗi tối."
        ]
      },
      "toan": {
        "high": [
          "Tính toán nhanh, chính xác phép cộng, trừ có nhớ phạm vi 100; thuộc làu bảng nhân, chia 2 và 5; giải tốt toán có lời văn."
        ],
        "good": [
          "Thực hiện đúng các phép tính theo yêu cầu; thuộc các bảng nhân/chia đã học.",
          "Hiểu bài, tự hoàn thành các bài tập tại lớp; tuy nhiên tốc độ tính nhẩm cần đẩy nhanh hơn.",
          "Cần chú ý cẩn thận khi tính toán phần có nhớ và trình bày lời giải rõ ràng hơn."
        ],
        "pass": [
          "Kỹ năng tính toán còn chậm; hay quên không cộng phần nhớ; còn lúng túng khi phân tích đề bài toán có lời văn.",
          "Còn lúng túng khi phân tích đề bài toán có lời văn để tìm phép tính đúng.",
          "Em cần rèn luyện thêm các phép tính cơ bản và ôn tập kỹ bảng cửu chương."
        ],
        "fail": [
          "Chưa thực hiện được các phép tính cộng, trừ cơ bản; không thuộc bảng nhân, chia 2 và 5.",
          "Không tự làm được các bài tập hình học hoặc giải toán có lời văn đơn giản.",
          "Giáo viên sẽ bổ trợ kiến thức riêng tại lớp; đề nghị phụ huynh kiểm tra bài ở nhà cùng con."
        ]
      },
      "other": {
        "high": [
          "Tích cực tham gia các hoạt động; tiếp thu bài nhanh; có năng khiếu đặc thù (vẽ đẹp, hát đúng nhạc, thực hiện dứt khoát động tác thể dục, thao tác máy tính thành thạo)."
        ],
        "good": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đủ đồ dùng học tập; cần mạnh dạn hơn khi phát biểu xây dựng bài."
        ],
        "pass": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đủ đồ dùng học tập; cần mạnh dạn hơn khi phát biểu xây dựng bài."
        ],
        "fail": [
          "Còn thụ động trong giờ học; chưa hoàn thành sản phẩm hoặc các động tác bài tập theo yêu cầu. Biện pháp: Giáo viên chú ý động viên và nhắc nhở em tập trung tham gia cùng tập thể."
        ]
      },
      "tu nhien va xa hoi": {
        "high": [
          "Tích cực tham gia các hoạt động; tiếp thu bài nhanh; có năng khiếu đặc thù (vẽ đẹp, hát đúng nhạc, thực hiện dứt khoát động tác thể dục, thao tác máy tính thành thạo)."
        ],
        "good": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đủ đồ dùng học tập; cần mạnh dạn hơn khi phát biểu xây dựng bài."
        ],
        "pass": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đủ đồ dùng học tập; cần mạnh dạn hơn khi phát biểu xây dựng bài."
        ],
        "fail": [
          "Còn thụ động trong giờ học; chưa hoàn thành sản phẩm hoặc các động tác bài tập theo yêu cầu. Biện pháp: Giáo viên chú ý động viên và nhắc nhở em tập trung tham gia cùng tập thể."
        ]
      },
      "khoa hoc": {
        "high": [
          "Tích cực tham gia các hoạt động; tiếp thu bài nhanh; có năng khiếu đặc thù (vẽ đẹp, hát đúng nhạc, thực hiện dứt khoát động tác thể dục, thao tác máy tính thành thạo)."
        ],
        "good": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đủ đồ dùng học tập; cần mạnh dạn hơn khi phát biểu xây dựng bài."
        ],
        "pass": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đủ đồ dùng học tập; cần mạnh dạn hơn khi phát biểu xây dựng bài."
        ],
        "fail": [
          "Còn thụ động trong giờ học; chưa hoàn thành sản phẩm hoặc các động tác bài tập theo yêu cầu. Biện pháp: Giáo viên chú ý động viên và nhắc nhở em tập trung tham gia cùng tập thể."
        ]
      },
      "dao duc": {
        "high": [
          "Tích cực tham gia các hoạt động; tiếp thu bài nhanh; có năng khiếu đặc thù (vẽ đẹp, hát đúng nhạc, thực hiện dứt khoát động tác thể dục, thao tác máy tính thành thạo)."
        ],
        "good": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đủ đồ dùng học tập; cần mạnh dạn hơn khi phát biểu xây dựng bài."
        ],
        "pass": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đủ đồ dùng học tập; cần mạnh dạn hơn khi phát biểu xây dựng bài."
        ],
        "fail": [
          "Còn thụ động trong giờ học; chưa hoàn thành sản phẩm hoặc các động tác bài tập theo yêu cầu. Biện pháp: Giáo viên chú ý động viên và nhắc nhở em tập trung tham gia cùng tập thể."
        ]
      },
      "cong nghe": {
        "high": [
          "Tích cực tham gia các hoạt động; tiếp thu bài nhanh; có năng khiếu đặc thù (vẽ đẹp, hát đúng nhạc, thực hiện dứt khoát động tác thể dục, thao tác máy tính thành thạo)."
        ],
        "good": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đủ đồ dùng học tập; cần mạnh dạn hơn khi phát biểu xây dựng bài."
        ],
        "pass": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đủ đồ dùng học tập; cần mạnh dạn hơn khi phát biểu xây dựng bài."
        ],
        "fail": [
          "Còn thụ động trong giờ học; chưa hoàn thành sản phẩm hoặc các động tác bài tập theo yêu cầu. Biện pháp: Giáo viên chú ý động viên và nhắc nhở em tập trung tham gia cùng tập thể."
        ]
      },
      "tin hoc": {
        "high": [
          "Tích cực tham gia các hoạt động; tiếp thu bài nhanh; có năng khiếu đặc thù (vẽ đẹp, hát đúng nhạc, thực hiện dứt khoát động tác thể dục, thao tác máy tính thành thạo)."
        ],
        "good": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đủ đồ dùng học tập; cần mạnh dạn hơn khi phát biểu xây dựng bài."
        ],
        "pass": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đủ đồ dùng học tập; cần mạnh dạn hơn khi phát biểu xây dựng bài."
        ],
        "fail": [
          "Còn thụ động trong giờ học; chưa hoàn thành sản phẩm hoặc các động tác bài tập theo yêu cầu. Biện pháp: Giáo viên chú ý động viên và nhắc nhở em tập trung tham gia cùng tập thể."
        ]
      },
      "am nhac": {
        "high": [
          "Tích cực tham gia các hoạt động; tiếp thu bài nhanh; có năng khiếu đặc thù (vẽ đẹp, hát đúng nhạc, thực hiện dứt khoát động tác thể dục, thao tác máy tính thành thạo)."
        ],
        "good": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đủ đồ dùng học tập; cần mạnh dạn hơn khi phát biểu xây dựng bài."
        ],
        "pass": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đủ đồ dùng học tập; cần mạnh dạn hơn khi phát biểu xây dựng bài."
        ],
        "fail": [
          "Còn thụ động trong giờ học; chưa hoàn thành sản phẩm hoặc các động tác bài tập theo yêu cầu. Biện pháp: Giáo viên chú ý động viên và nhắc nhở em tập trung tham gia cùng tập thể."
        ]
      },
      "mi thuat": {
        "high": [
          "Tích cực tham gia các hoạt động; tiếp thu bài nhanh; có năng khiếu đặc thù (vẽ đẹp, hát đúng nhạc, thực hiện dứt khoát động tác thể dục, thao tác máy tính thành thạo)."
        ],
        "good": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đủ đồ dùng học tập; cần mạnh dạn hơn khi phát biểu xây dựng bài."
        ],
        "pass": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đủ đồ dùng học tập; cần mạnh dạn hơn khi phát biểu xây dựng bài."
        ],
        "fail": [
          "Còn thụ động trong giờ học; chưa hoàn thành sản phẩm hoặc các động tác bài tập theo yêu cầu. Biện pháp: Giáo viên chú ý động viên và nhắc nhở em tập trung tham gia cùng tập thể."
        ]
      },
      "giao duc the chat": {
        "high": [
          "Tích cực tham gia các hoạt động; tiếp thu bài nhanh; có năng khiếu đặc thù (vẽ đẹp, hát đúng nhạc, thực hiện dứt khoát động tác thể dục, thao tác máy tính thành thạo)."
        ],
        "good": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đủ đồ dùng học tập; cần mạnh dạn hơn khi phát biểu xây dựng bài."
        ],
        "pass": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đủ đồ dùng học tập; cần mạnh dạn hơn khi phát biểu xây dựng bài."
        ],
        "fail": [
          "Còn thụ động trong giờ học; chưa hoàn thành sản phẩm hoặc các động tác bài tập theo yêu cầu. Biện pháp: Giáo viên chú ý động viên và nhắc nhở em tập trung tham gia cùng tập thể."
        ]
      },
      "hoat dong trai nghiem": {
        "high": [
          "Tích cực tham gia các hoạt động; tiếp thu bài nhanh; có năng khiếu đặc thù (vẽ đẹp, hát đúng nhạc, thực hiện dứt khoát động tác thể dục, thao tác máy tính thành thạo)."
        ],
        "good": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đủ đồ dùng học tập; cần mạnh dạn hơn khi phát biểu xây dựng bài."
        ],
        "pass": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đủ đồ dùng học tập; cần mạnh dạn hơn khi phát biểu xây dựng bài."
        ],
        "fail": [
          "Còn thụ động trong giờ học; chưa hoàn thành sản phẩm hoặc các động tác bài tập theo yêu cầu. Biện pháp: Giáo viên chú ý động viên và nhắc nhở em tập trung tham gia cùng tập thể."
        ]
      },
      "tieng dan toc": {
        "high": [
          "Tích cực tham gia các hoạt động; tiếp thu bài nhanh; có năng khiếu đặc thù (vẽ đẹp, hát đúng nhạc, thực hiện dứt khoát động tác thể dục, thao tác máy tính thành thạo)."
        ],
        "good": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đủ đồ dùng học tập; cần mạnh dạn hơn khi phát biểu xây dựng bài."
        ],
        "pass": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đủ đồ dùng học tập; cần mạnh dạn hơn khi phát biểu xây dựng bài."
        ],
        "fail": [
          "Còn thụ động trong giờ học; chưa hoàn thành sản phẩm hoặc các động tác bài tập theo yêu cầu. Biện pháp: Giáo viên chú ý động viên và nhắc nhở em tập trung tham gia cùng tập thể."
        ]
      }
    },
    "qualities": {
      "yeu nuoc": {
        "high": [
          "Nghiêm túc khi chào cờ; có tình yêu thiên nhiên và ý thức bảo vệ cảnh quan trường lớp xanh - sạch - đẹp."
        ],
        "good": [
          "Nghiêm túc khi chào cờ; có tình yêu thiên nhiên và ý thức bảo vệ cảnh quan trường lớp xanh - sạch - đẹp."
        ],
        "fail": [
          "Cần nghiêm túc hơn trong giờ chào cờ và có ý thức giữ gìn vệ sinh cảnh quan trường lớp."
        ]
      },
      "nhan ai": {
        "high": [
          "Sẵn sàng chia sẻ, giúp đỡ bạn bè trong học tập; biết tôn trọng, lễ phép với thầy cô và người lớn tuổi."
        ],
        "good": [
          "Sẵn sàng chia sẻ, giúp đỡ bạn bè trong học tập; biết tôn trọng, lễ phép với thầy cô và người lớn tuổi."
        ],
        "fail": [
          "Cần biết chia sẻ, hòa đồng hơn với bạn bè và lễ phép với người lớn."
        ]
      },
      "cham chi": {
        "high": [
          "Đi học đúng giờ; chăm chú nghe giảng; luôn tự giác hoàn thành bài tập về nhà và tham gia tích cực việc trực nhật lớp."
        ],
        "good": [
          "Đi học đúng giờ; chăm chú nghe giảng; luôn tự giác hoàn thành bài tập về nhà và tham gia tích cực việc trực nhật lớp."
        ],
        "fail": [
          "Đôi lúc còn làm việc riêng trong giờ học; cần tự giác hoàn thành bài tập về nhà."
        ]
      },
      "trung thuc": {
        "high": [
          "Thật thà, ngay thẳng trong học tập và thi cử; biết nhận lỗi và sửa lỗi khi làm sai."
        ],
        "good": [
          "Thật thà, ngay thẳng trong học tập và thi cử; biết nhận lỗi và sửa lỗi khi làm sai."
        ],
        "fail": [
          "Cần trung thực, thẳng thắn nhận lỗi khi làm sai để tiến bộ hơn."
        ]
      },
      "trach nhiem": {
        "high": [
          "Thực hiện nghiêm túc nội quy trường lớp; có ý thức giữ gìn vệ sinh chung và bảo vệ của công."
        ],
        "good": [
          "Thực hiện nghiêm túc nội quy trường lớp; có ý thức giữ gìn vệ sinh chung và bảo vệ của công."
        ],
        "fail": [
          "Cần có ý thức trách nhiệm hơn trong việc giữ gìn vệ sinh chung và bảo vệ của công."
        ]
      }
    },
    "commonCompetencies": {
      "tu chu va tu hoc": {
        "high": [
          "Tự giác thực hiện nhiệm vụ học tập; tự chuẩn bị đầy đủ sách vở, đồ dùng học tập trước khi đến lớp."
        ],
        "good": [
          "Tự giác thực hiện nhiệm vụ học tập; tự chuẩn bị đầy đủ sách vở, đồ dùng học tập trước khi đến lớp."
        ],
        "fail": [
          "Đôi lúc còn lơ là, cần tập trung hơn và hạn chế làm việc riêng trong giờ học."
        ]
      },
      "giao tiep va hop tac": {
        "high": [
          "Biết lắng nghe bạn bè; mạnh dạn, tự tin khi chia sẻ ý kiến và phối hợp tốt khi làm việc nhóm."
        ],
        "good": [
          "Biết lắng nghe bạn bè; mạnh dạn, tự tin khi chia sẻ ý kiến và phối hợp tốt khi làm việc nhóm."
        ],
        "fail": [
          "Còn rụt rè khi giao tiếp; cần chủ động tương tác với các bạn trong các hoạt động tập thể."
        ]
      },
      "giai quyet van de va sang tao": {
        "high": [
          "Tiếp thu bài nhanh; biết dựa vào gợi ý để giải quyết các tình huống học tập; có nhiều ý tưởng sáng tạo."
        ],
        "good": [
          "Tiếp thu bài nhanh; biết dựa vào gợi ý để giải quyết các tình huống học tập; có nhiều ý tưởng sáng tạo."
        ],
        "fail": [
          "Còn thụ động, hay chờ đợi sự giúp đỡ; cần tự suy nghĩ trước khi hỏi cô hoặc bạn."
        ]
      }
    },
    "specificCompetencies": {
      "ngon ngu": {
        "high": [
          "Diễn đạt rõ ràng, mạch lạc; biết dùng từ phù hợp khi nói và viết; biết kể lại câu chuyện ngắn dựa theo tranh hoặc gợi ý."
        ],
        "good": [
          "Diễn đạt rõ ràng, mạch lạc; biết dùng từ phù hợp khi nói và viết; biết kể lại câu chuyện ngắn dựa theo tranh hoặc gợi ý."
        ],
        "fail": [
          "Diễn đạt câu từ còn lúng túng; cần rèn luyện thêm cách kể chuyện và dùng từ chính xác."
        ]
      },
      "tinh toan": {
        "high": [
          "Có tư duy số học tốt; nhận diện nhanh các hình khối, quy luật toán học và đơn vị đo lường cơ bản."
        ],
        "good": [
          "Có tư duy số học tốt; nhận diện nhanh các hình khối, quy luật toán học và đơn vị đo lường cơ bản."
        ],
        "fail": [
          "Khả năng tính toán và nhận diện hình học còn chậm; cần rèn luyện thêm kỹ năng tính nhẩm."
        ]
      },
      "khoa hoc": {
        "high": [
          "Có ý thức quan sát tốt; ham hiểu biết; nhận biết được các hiện tượng tự nhiên và cơ quan trong cơ thể người."
        ],
        "good": [
          "Có ý thức quan sát tốt; ham hiểu biết; nhận biết được các hiện tượng tự nhiên và cơ quan trong cơ thể người."
        ],
        "fail": [
          "Chưa tập trung quan sát; còn lúng túng khi giải thích các hiện tượng tự nhiên cơ bản."
        ]
      },
      "tin hoc": {
        "high": [
          "Bước đầu làm quen và thực hiện đúng các thao tác cơ bản trên máy tính; sử dụng an toàn các dụng cụ học tập."
        ],
        "good": [
          "Bước đầu làm quen và thực hiện đúng các thao tác cơ bản trên máy tính; sử dụng an toàn các dụng cụ học tập."
        ],
        "fail": [
          "Thao tác trên máy tính còn chậm; cần rèn luyện thêm để nắm vững các kỹ năng cơ bản."
        ]
      },
      "cong nghe": {
        "high": [
          "Sử dụng an toàn các dụng cụ thủ công; hoàn thành các sản phẩm kỹ thuật, thủ công đúng quy trình."
        ],
        "good": [
          "Sử dụng an toàn các dụng cụ thủ công; hoàn thành các sản phẩm kỹ thuật, thủ công đúng quy trình."
        ],
        "fail": [
          "Sử dụng dụng cụ thủ công còn chậm; sản phẩm hoàn thiện chưa đạt yêu cầu."
        ]
      },
      "tham mi": {
        "high": [
          "Có năng khiếu nghệ thuật; biết cảm nhận cái đẹp và thể hiện sáng tạo qua các sản phẩm âm nhạc, mĩ thuật."
        ],
        "good": [
          "Có năng khiếu nghệ thuật; biết cảm nhận cái đẹp và thể hiện sáng tạo qua các sản phẩm âm nhạc, mĩ thuật."
        ],
        "fail": [
          "Cần chú ý lắng nghe giai điệu và rèn luyện thêm kỹ năng tạo hình, vẽ tranh."
        ]
      },
      "the chat": {
        "high": [
          "Thực hiện đúng và dứt khoát các động tác bài tập thể dục; tích cực tham gia các trò chơi vận động."
        ],
        "good": [
          "Thực hiện đúng và dứt khoát các động tác bài tập thể dục; tích cực tham gia các trò chơi vận động."
        ],
        "fail": [
          "Thể lực còn hạn chế; cần tích cực rèn luyện thêm các động tác thể dục cơ bản."
        ]
      }
    }
  },
  "3": {
    "subjects": {
      "tieng viet": {
        "high": [
          "Lớp 3: Đọc diễn cảm tốt, hiểu sâu ý nghĩa bài đọc; viết câu đúng ngữ pháp, đoạn văn ngắn có bố cục rõ ràng, giàu hình ảnh.",
          "Chữ viết đúng mẫu, đều nét, đúng khoảng cách, trình bày bài sạch đẹp."
        ],
        "good": [
          "Đọc trôi chảy toàn bài, ngắt nghỉ đúng dấu câu; trả lời đúng các câu hỏi đọc hiểu cơ bản.",
          "Viết đúng cỡ chữ, đúng chính tả; đoạn văn đủ ý nhưng dùng từ còn đơn điệu, chưa sinh động.",
          "Cần đọc thêm sách để mở rộng vốn từ và tăng tốc độ viết bài."
        ],
        "pass": [
          "Đọc còn chậm, hay ngắc ngứ ở các từ ngữ dài hoặc vần khó; hiểu nội dung bài ở mức sơ giản.",
          "Chữ viết chưa đều nét, bài viết còn sai một số lỗi chính tả (như ch/tr, l/n, dấu thanh). Đoạn văn viết còn ngắn, lặp từ.",
          "Em cần tăng cường rèn đọc thành tiếng và luyện viết câu/đoạn văn nhiều hơn ở nhà."
        ],
        "fail": [
          "Tốc độ đọc quá chậm, phải đánh vần nhiều; chưa hiểu nội dung văn bản.",
          "Chữ viết sai lệch cỡ chữ, chưa biết cách viết một câu hoàn chỉnh, hay bỏ dở bài viết chính tả tại lớp.",
          "Cần phối hợp chặt chẽ với phụ huynh để kèm đọc hiểu và luyện viết cho em mỗi tối."
        ]
      },
      "toan": {
        "high": [
          "Thực hiện thành thạo phép tính cộng, trừ, nhân, chia phạm vi 100 000; tính chu vi, diện tích hình chữ nhật, hình vuông tốt; tư duy logic sắc bén."
        ],
        "good": [
          "Thực hiện đúng các phép tính theo yêu cầu; thuộc các bảng nhân/chia đã học.",
          "Hiểu bài, tự hoàn thành các bài tập tại lớp; tuy nhiên tốc độ tính nhẩm cần đẩy nhanh hơn.",
          "Cần chú ý cẩn thận khi tính toán phần có nhớ và trình bày lời giải rõ ràng hơn."
        ],
        "pass": [
          "Kỹ năng tính toán còn chậm; hay tính sai phép nhân, chia; còn lúng túng khi phân tích đề bài toán có lời văn.",
          "Còn lúng túng khi phân tích đề bài toán có lời văn để tìm phép tính đúng.",
          "Em cần rèn luyện thêm các phép tính cơ bản và ôn tập kỹ bảng cửu chương."
        ],
        "fail": [
          "Chưa thực hiện được các phép tính cộng, trừ, nhân, chia cơ bản; không thuộc bảng cửu chương.",
          "Không tự làm được các bài tập hình học hoặc giải toán có lời văn đơn giản.",
          "Giáo viên sẽ bổ trợ kiến thức riêng tại lớp; đề nghị phụ huynh kiểm tra bài ở nhà cùng con."
        ]
      },
      "other": {
        "high": [
          "Tích cực tham gia các hoạt động; tiếp thu bài nhanh; có năng khiếu đặc thù (vẽ đẹp, hát đúng nhạc, thực hiện dứt khoát động tác thể dục, thao tác máy tính thành thạo)."
        ],
        "good": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đủ đồ dùng học tập; cần mạnh dạn hơn khi phát biểu xây dựng bài."
        ],
        "pass": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đủ đồ dùng học tập; cần mạnh dạn hơn khi phát biểu xây dựng bài."
        ],
        "fail": [
          "Còn thụ động trong giờ học; chưa hoàn thành sản phẩm hoặc các động tác bài tập theo yêu cầu. Biện pháp: Giáo viên chú ý động viên và nhắc nhở em tập trung tham gia cùng tập thể."
        ]
      },
      "tu nhien va xa hoi": {
        "high": [
          "Tích cực tham gia các hoạt động; tiếp thu bài nhanh; có năng khiếu đặc thù (vẽ đẹp, hát đúng nhạc, thực hiện dứt khoát động tác thể dục, thao tác máy tính thành thạo)."
        ],
        "good": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đủ đồ dùng học tập; cần mạnh dạn hơn khi phát biểu xây dựng bài."
        ],
        "pass": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đủ đồ dùng học tập; cần mạnh dạn hơn khi phát biểu xây dựng bài."
        ],
        "fail": [
          "Còn thụ động trong giờ học; chưa hoàn thành sản phẩm hoặc các động tác bài tập theo yêu cầu. Biện pháp: Giáo viên chú ý động viên và nhắc nhở em tập trung tham gia cùng tập thể."
        ]
      },
      "dao duc": {
        "high": [
          "Tích cực tham gia các hoạt động; tiếp thu bài nhanh; có năng khiếu đặc thù (vẽ đẹp, hát đúng nhạc, thực hiện dứt khoát động tác thể dục, thao tác máy tính thành thạo)."
        ],
        "good": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đủ đồ dùng học tập; cần mạnh dạn hơn khi phát biểu xây dựng bài."
        ],
        "pass": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đủ đồ dùng học tập; cần mạnh dạn hơn khi phát biểu xây dựng bài."
        ],
        "fail": [
          "Còn thụ động trong giờ học; chưa hoàn thành sản phẩm hoặc các động tác bài tập theo yêu cầu. Biện pháp: Giáo viên chú ý động viên và nhắc nhở em tập trung tham gia cùng tập thể."
        ]
      },
      "cong nghe": {
        "high": [
          "Tích cực tham gia các hoạt động; tiếp thu bài nhanh; có năng khiếu đặc thù (vẽ đẹp, hát đúng nhạc, thực hiện dứt khoát động tác thể dục, thao tác máy tính thành thạo)."
        ],
        "good": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đủ đồ dùng học tập; cần mạnh dạn hơn khi phát biểu xây dựng bài."
        ],
        "pass": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đủ đồ dùng học tập; cần mạnh dạn hơn khi phát biểu xây dựng bài."
        ],
        "fail": [
          "Còn thụ động trong giờ học; chưa hoàn thành sản phẩm hoặc các động tác bài tập theo yêu cầu. Biện pháp: Giáo viên chú ý động viên và nhắc nhở em tập trung tham gia cùng tập thể."
        ]
      },
      "tin hoc": {
        "high": [
          "Tích cực tham gia các hoạt động; tiếp thu bài nhanh; có năng khiếu đặc thù (vẽ đẹp, hát đúng nhạc, thực hiện dứt khoát động tác thể dục, thao tác máy tính thành thạo)."
        ],
        "good": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đủ đồ dùng học tập; cần mạnh dạn hơn khi phát biểu xây dựng bài."
        ],
        "pass": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đủ đồ dùng học tập; cần mạnh dạn hơn khi phát biểu xây dựng bài."
        ],
        "fail": [
          "Còn thụ động trong giờ học; chưa hoàn thành sản phẩm hoặc các động tác bài tập theo yêu cầu. Biện pháp: Giáo viên chú ý động viên và nhắc nhở em tập trung tham gia cùng tập thể."
        ]
      },
      "am nhac": {
        "high": [
          "Tích cực tham gia các hoạt động; tiếp thu bài nhanh; có năng khiếu đặc thù (vẽ đẹp, hát đúng nhạc, thực hiện dứt khoát động tác thể dục, thao tác máy tính thành thạo)."
        ],
        "good": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đủ đồ dùng học tập; cần mạnh dạn hơn khi phát biểu xây dựng bài."
        ],
        "pass": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đủ đồ dùng học tập; cần mạnh dạn hơn khi phát biểu xây dựng bài."
        ],
        "fail": [
          "Còn thụ động trong giờ học; chưa hoàn thành sản phẩm hoặc các động tác bài tập theo yêu cầu. Biện pháp: Giáo viên chú ý động viên và nhắc nhở em tập trung tham gia cùng tập thể."
        ]
      },
      "mi thuat": {
        "high": [
          "Tích cực tham gia các hoạt động; tiếp thu bài nhanh; có năng khiếu đặc thù (vẽ đẹp, hát đúng nhạc, thực hiện dứt khoát động tác thể dục, thao tác máy tính thành thạo)."
        ],
        "good": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đủ đồ dùng học tập; cần mạnh dạn hơn khi phát biểu xây dựng bài."
        ],
        "pass": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đủ đồ dùng học tập; cần mạnh dạn hơn khi phát biểu xây dựng bài."
        ],
        "fail": [
          "Còn thụ động trong giờ học; chưa hoàn thành sản phẩm hoặc các động tác bài tập theo yêu cầu. Biện pháp: Giáo viên chú ý động viên và nhắc nhở em tập trung tham gia cùng tập thể."
        ]
      },
      "giao duc the chat": {
        "high": [
          "Tích cực tham gia các hoạt động; tiếp thu bài nhanh; có năng khiếu đặc thù (vẽ đẹp, hát đúng nhạc, thực hiện dứt khoát động tác thể dục, thao tác máy tính thành thạo)."
        ],
        "good": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đủ đồ dùng học tập; cần mạnh dạn hơn khi phát biểu xây dựng bài."
        ],
        "pass": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đủ đồ dùng học tập; cần mạnh dạn hơn khi phát biểu xây dựng bài."
        ],
        "fail": [
          "Còn thụ động trong giờ học; chưa hoàn thành sản phẩm hoặc các động tác bài tập theo yêu cầu. Biện pháp: Giáo viên chú ý động viên và nhắc nhở em tập trung tham gia cùng tập thể."
        ]
      },
      "hoat dong trai nghiem": {
        "high": [
          "Tích cực tham gia các hoạt động; tiếp thu bài nhanh; có năng khiếu đặc thù (vẽ đẹp, hát đúng nhạc, thực hiện dứt khoát động tác thể dục, thao tác máy tính thành thạo)."
        ],
        "good": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đủ đồ dùng học tập; cần mạnh dạn hơn khi phát biểu xây dựng bài."
        ],
        "pass": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đủ đồ dùng học tập; cần mạnh dạn hơn khi phát biểu xây dựng bài."
        ],
        "fail": [
          "Còn thụ động trong giờ học; chưa hoàn thành sản phẩm hoặc các động tác bài tập theo yêu cầu. Biện pháp: Giáo viên chú ý động viên và nhắc nhở em tập trung tham gia cùng tập thể."
        ]
      },
      "tieng dan toc": {
        "high": [
          "Tích cực tham gia các hoạt động; tiếp thu bài nhanh; có năng khiếu đặc thù (vẽ đẹp, hát đúng nhạc, thực hiện dứt khoát động tác thể dục, thao tác máy tính thành thạo)."
        ],
        "good": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đủ đồ dùng học tập; cần mạnh dạn hơn khi phát biểu xây dựng bài."
        ],
        "pass": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đủ đồ dùng học tập; cần mạnh dạn hơn khi phát biểu xây dựng bài."
        ],
        "fail": [
          "Còn thụ động trong giờ học; chưa hoàn thành sản phẩm hoặc các động tác bài tập theo yêu cầu. Biện pháp: Giáo viên chú ý động viên và nhắc nhở em tập trung tham gia cùng tập thể."
        ]
      }
    },
    "qualities": {
      "yeu nuoc": {
        "high": [
          "Nghiêm túc khi chào cờ; có tình yêu thiên nhiên và ý thức bảo vệ cảnh quan trường lớp xanh - sạch - đẹp."
        ],
        "good": [
          "Nghiêm túc khi chào cờ; có tình yêu thiên nhiên và ý thức bảo vệ cảnh quan trường lớp xanh - sạch - đẹp."
        ],
        "fail": [
          "Cần nghiêm túc hơn trong giờ chào cờ và có ý thức giữ gìn vệ sinh cảnh quan trường lớp."
        ]
      },
      "nhan ai": {
        "high": [
          "Sẵn sàng chia sẻ, giúp đỡ bạn bè trong học tập; biết tôn trọng, lễ phép với thầy cô và người lớn tuổi."
        ],
        "good": [
          "Sẵn sàng chia sẻ, giúp đỡ bạn bè trong học tập; biết tôn trọng, lễ phép với thầy cô và người lớn tuổi."
        ],
        "fail": [
          "Cần biết chia sẻ, hòa đồng hơn với bạn bè và lễ phép với người lớn."
        ]
      },
      "cham chi": {
        "high": [
          "Đi học đúng giờ; chăm chú nghe giảng; luôn tự giác hoàn thành bài tập về nhà và tham gia tích cực việc trực nhật lớp."
        ],
        "good": [
          "Đi học đúng giờ; chăm chú nghe giảng; luôn tự giác hoàn thành bài tập về nhà và tham gia tích cực việc trực nhật lớp."
        ],
        "fail": [
          "Đôi lúc còn làm việc riêng trong giờ học; cần tự giác hoàn thành bài tập về nhà."
        ]
      },
      "trung thuc": {
        "high": [
          "Thật thà, ngay thẳng trong học tập và thi cử; biết nhận lỗi và sửa lỗi khi làm sai."
        ],
        "good": [
          "Thật thà, ngay thẳng trong học tập và thi cử; biết nhận lỗi và sửa lỗi khi làm sai."
        ],
        "fail": [
          "Cần trung thực, thẳng thắn nhận lỗi khi làm sai để tiến bộ hơn."
        ]
      },
      "trach nhiem": {
        "high": [
          "Thực hiện nghiêm túc nội quy trường lớp; có ý thức giữ gìn vệ sinh chung và bảo vệ của công."
        ],
        "good": [
          "Thực hiện nghiêm túc nội quy trường lớp; có ý thức giữ gìn vệ sinh chung và bảo vệ của công."
        ],
        "fail": [
          "Cần có ý thức trách nhiệm hơn trong việc giữ gìn vệ sinh chung và bảo vệ của công."
        ]
      }
    },
    "commonCompetencies": {
      "tu chu va tu hoc": {
        "high": [
          "Tự giác thực hiện nhiệm vụ học tập; tự chuẩn bị đầy đủ sách vở, đồ dùng học tập trước khi đến lớp."
        ],
        "good": [
          "Tự giác thực hiện nhiệm vụ học tập; tự chuẩn bị đầy đủ sách vở, đồ dùng học tập trước khi đến lớp."
        ],
        "fail": [
          "Đôi lúc còn lơ là, cần tập trung hơn và hạn chế làm việc riêng trong giờ học."
        ]
      },
      "giao tiep va hop tac": {
        "high": [
          "Biết lắng nghe bạn bè; mạnh dạn, tự tin khi chia sẻ ý kiến và phối hợp tốt khi làm việc nhóm."
        ],
        "good": [
          "Biết lắng nghe bạn bè; mạnh dạn, tự tin khi chia sẻ ý kiến và phối hợp tốt khi làm việc nhóm."
        ],
        "fail": [
          "Còn rụt rè khi giao tiếp; cần chủ động tương tác với các bạn trong các hoạt động tập thể."
        ]
      },
      "giai quyet van de va sang tao": {
        "high": [
          "Tiếp thu bài nhanh; biết dựa vào gợi ý để giải quyết các tình huống học tập; có nhiều ý tưởng sáng tạo."
        ],
        "good": [
          "Tiếp thu bài nhanh; biết dựa vào gợi ý để giải quyết các tình huống học tập; có nhiều ý tưởng sáng tạo."
        ],
        "fail": [
          "Còn thụ động, hay chờ đợi sự giúp đỡ; cần tự suy nghĩ trước khi hỏi cô hoặc bạn."
        ]
      }
    },
    "specificCompetencies": {
      "ngon ngu": {
        "high": [
          "Diễn đạt rõ ràng, mạch lạc; biết dùng từ phù hợp khi nói và viết; biết kể lại câu chuyện ngắn dựa theo tranh hoặc gợi ý."
        ],
        "good": [
          "Diễn đạt rõ ràng, mạch lạc; biết dùng từ phù hợp khi nói và viết; biết kể lại câu chuyện ngắn dựa theo tranh hoặc gợi ý."
        ],
        "fail": [
          "Diễn đạt câu từ còn lúng túng; cần rèn luyện thêm cách kể chuyện và dùng từ chính xác."
        ]
      },
      "tinh toan": {
        "high": [
          "Có tư duy số học tốt; nhận diện nhanh các hình khối, quy luật toán học và đơn vị đo lường cơ bản."
        ],
        "good": [
          "Có tư duy số học tốt; nhận diện nhanh các hình khối, quy luật toán học và đơn vị đo lường cơ bản."
        ],
        "fail": [
          "Khả năng tính toán và nhận diện hình học còn chậm; cần rèn luyện thêm kỹ năng tính nhẩm."
        ]
      },
      "khoa hoc": {
        "high": [
          "Có ý thức quan sát tốt; ham hiểu biết; nhận biết được các hiện tượng tự nhiên và cơ quan trong cơ thể người."
        ],
        "good": [
          "Có ý thức quan sát tốt; ham hiểu biết; nhận biết được các hiện tượng tự nhiên và cơ quan trong cơ thể người."
        ],
        "fail": [
          "Chưa tập trung quan sát; còn lúng túng khi giải thích các hiện tượng tự nhiên cơ bản."
        ]
      },
      "tin hoc": {
        "high": [
          "Bước đầu làm quen và thực hiện đúng các thao tác cơ bản trên máy tính; sử dụng an toàn các dụng cụ học tập."
        ],
        "good": [
          "Bước đầu làm quen và thực hiện đúng các thao tác cơ bản trên máy tính; sử dụng an toàn các dụng cụ học tập."
        ],
        "fail": [
          "Thao tác trên máy tính còn chậm; cần rèn luyện thêm để nắm vững các kỹ năng cơ bản."
        ]
      },
      "cong nghe": {
        "high": [
          "Sử dụng an toàn các dụng cụ thủ công; hoàn thành các sản phẩm kỹ thuật, thủ công đúng quy trình."
        ],
        "good": [
          "Sử dụng an toàn các dụng cụ thủ công; hoàn thành các sản phẩm kỹ thuật, thủ công đúng quy trình."
        ],
        "fail": [
          "Sử dụng dụng cụ thủ công còn chậm; sản phẩm hoàn thiện chưa đạt yêu cầu."
        ]
      },
      "tham mi": {
        "high": [
          "Có năng khiếu nghệ thuật; biết cảm nhận cái đẹp và thể hiện sáng tạo qua các sản phẩm âm nhạc, mĩ thuật."
        ],
        "good": [
          "Có năng khiếu nghệ thuật; biết cảm nhận cái đẹp và thể hiện sáng tạo qua các sản phẩm âm nhạc, mĩ thuật."
        ],
        "fail": [
          "Cần chú ý lắng nghe giai điệu và rèn luyện thêm kỹ năng tạo hình, vẽ tranh."
        ]
      },
      "the chat": {
        "high": [
          "Thực hiện đúng và dứt khoát các động tác bài tập thể dục; tích cực tham gia các trò chơi vận động."
        ],
        "good": [
          "Thực hiện đúng và dứt khoát các động tác bài tập thể dục; tích cực tham gia các trò chơi vận động."
        ],
        "fail": [
          "Thể lực còn hạn chế; cần tích cực rèn luyện thêm các động tác thể dục cơ bản."
        ]
      }
    }
  },
  "4": {
    "subjects": {
      "tieng viet": {
        "high": [
          "Lớp 4: Viết bài văn miêu tả (đồ vật, cây cối, con vật) mạch lạc, bố cục rõ ràng, câu văn giàu hình ảnh. Đọc trôi chảy và hiểu sâu nội dung cốt truyện.",
          "Nắm chắc kiến thức từ và câu (danh từ, động từ, tính từ, từ đồng nghĩa, trái nghĩa), chữ viết đẹp, đúng quy tắc chính tả."
        ],
        "good": [
          "Đọc diễn cảm tương đối tốt, trả lời đúng các câu hỏi đọc hiểu văn bản.",
          "Bài làm văn đủ ý, đúng bố cục 3 phần; tuy nhiên diễn đạt còn an toàn, chưa có nhiều phát hiện sáng tạo hoặc hình ảnh độc đáo.",
          "Nên chú ý lỗi lặp từ và rèn luyện thêm cách mở bài, kết bài mở rộng để bài văn hay hơn."
        ],
        "pass": [
          "Đọc thành tiếng đạt tốc độ yêu cầu nhưng chưa biết nhấn giọng, đọc diễn cảm.",
          "Bài tập làm văn còn ngắn, viết câu hay bị thiếu chủ ngữ hoặc vị ngữ; còn sai một số lỗi chính tả thông thường.",
          "Em cần đọc thêm nhiều sách, truyện để tích lũy vốn từ và chăm chỉ luyện viết đoạn văn tại nhà."
        ],
        "fail": [
          "Tốc độ đọc quá chậm, chưa hiểu nội dung bài đọc để trả lời câu hỏi trắc nghiệm/tự luận.",
          "Chưa biết cách bố cục một bài văn; câu văn rời rạc, viết sai nhiều lỗi chính tả.",
          "Cần sự phối hợp sát sao của phụ huynh để hướng dẫn em ôn lại cấu trúc câu và quy tắc chính tả mỗi tối."
        ]
      },
      "toan": {
        "high": [
          "Lớp 4: Thực hiện thành thạo các phép tính với số tự nhiên, phân số. Giải toán có lời văn tốt (tìm hai số khi biết tổng-tỉ, hiệu-tỉ, trung bình cộng).",
          "Tư duy logic tốt, có khả năng giải các bài toán nâng cao hoặc tìm ra nhiều cách giải cho một bài toán."
        ],
        "good": [
          "Thực hiện đúng các thuật tính cơ bản theo yêu cầu của chương trình học.",
          "Hiểu và áp dụng đúng công thức tính toán hình học; tự giải được các bài toán có lời văn từ 2-3 bước tính.",
          "Cần tính toán cẩn thận hơn ở các bước trung gian (như quy đồng mẫu số hoặc nhân chia số thập phân) để tránh sai sót đáng tiếc."
        ],
        "pass": [
          "Kỹ năng tính toán còn chậm; hay tính sai khi thực hiện phép chia phân số hoặc số tự nhiên.",
          "Còn lúng túng khi nhận diện đề bài toán có lời văn phức tạp, thường tính sai đơn vị đo lượng.",
          "Em cần chăm chỉ làm bài tập về nhà, học thuộc các công thức toán hình và bảng đơn vị đo."
        ],
        "fail": [
          "Chưa nắm được các quy tắc tính toán cơ bản (phân số, số thập phân); không thuộc công thức tính hình học.",
          "Không tự tóm tắt và giải được bài toán có lời văn đơn giản.",
          "Giáo viên sẽ kèm cặp riêng tại lớp; đề nghị phụ huynh kiểm tra và cùng con ôn tập lại kiến thức nền tảng."
        ]
      },
      "lich su va dia li": {
        "high": [
          "Nắm chắc các sự kiện lịch sử; sử dụng thành thạo bản đồ, lược đồ địa lí.",
          "Trình bày lưu loát về các vị anh hùng dân tộc và đặc điểm tự nhiên các vùng miền.",
          "Có tư duy phản biện tốt; biết liên hệ kiến thức lịch sử với thực tế cuộc sống.",
          "Nhớ tốt mốc thời gian lịch sử; xác định chính xác các vị trí địa lí trên bản đồ.",
          "Hiểu sâu sắc về truyền thống văn hóa và địa lí Việt Nam; có ý thức hướng về cội nguồn."
        ],
        "good": [
          "Kể được tên các sự kiện lịch sử lớn; biết chỉ bản đồ ở mức cơ bản.",
          "Hiểu nội dung bài học; cần mạnh dạn hơn khi tham gia thảo luận nhóm.",
          "Xác định được các vùng địa lí trên lược đồ nhưng tốc độ còn hơi chậm.",
          "Nắm được nội dung cốt lõi của bài học; cần chú ý phân biệt các mốc lịch sử dễ nhầm lẫn.",
          "Em nên đọc thêm sách lịch sử để ghi nhớ sâu hơn các chi tiết sự kiện."
        ],
        "pass": [
          "Kể được tên các sự kiện lịch sử lớn; biết chỉ bản đồ ở mức cơ bản.",
          "Hiểu nội dung bài học; cần mạnh dạn hơn khi tham gia thảo luận nhóm.",
          "Xác định được các vùng địa lí trên lược đồ nhưng tốc độ còn hơi chậm.",
          "Nắm được nội dung cốt lõi của bài học; cần chú ý phân biệt các mốc lịch sử dễ nhầm lẫn.",
          "Em nên đọc thêm sách lịch sử để ghi nhớ sâu hơn các chi tiết sự kiện."
        ],
        "fail": [
          "Chưa nhớ các sự kiện lịch sử trọng tâm; chưa biết cách đọc bản đồ, lược đồ.",
          "Còn lúng túng khi trả lời câu hỏi lịch sử; hay nhầm lẫn các giai đoạn phát triển.",
          "Em cần tập trung nghe giảng và tập thói quen quan sát lược đồ nhiều hơn."
        ]
      },
      "khoa hoc": {
        "high": [
          "Ham học hỏi; có kỹ năng quan sát và làm thí nghiệm khoa học chính xác.",
          "Giải thích mạch lạc các hiện tượng tự nhiên và sự chuyển hóa của các chất.",
          "Nắm vững kiến thức về cơ thể người; có ý thức giữ gìn vệ sinh và phòng bệnh xuất sắc.",
          "Tư duy khoa học tốt; tích cực đề xuất các giải pháp bảo vệ môi trường nguồn nước, không khí.",
          "Tiếp thu bài rất nhanh; luôn hoàn thành xuất sắc các phiếu bài tập thực hành."
        ],
        "good": [
          "Hiểu các kiến thức khoa học cơ bản; biết áp dụng vào việc chăm sóc sức khỏe bản thân.",
          "Hoàn thành tốt các thí nghiệm dưới sự hướng dẫn của giáo viên và các bạn.",
          "Nắm được quy trình vòng đời của sinh vật; cần chú ý trình bày bài làm rõ ràng hơn.",
          "Có ý thức bảo vệ môi trường; cần tích cực giơ tay phát biểu xây dựng bài.",
          "Em cần cẩn thận hơn khi làm các bài tập trắc nghiệm phân tích hiện tượng."
        ],
        "pass": [
          "Hiểu các kiến thức khoa học cơ bản; biết áp dụng vào việc chăm sóc sức khỏe bản thân.",
          "Hoàn thành tốt các thí nghiệm dưới sự hướng dẫn của giáo viên và các bạn.",
          "Nắm được quy trình vòng đời của sinh vật; cần chú ý trình bày bài làm rõ ràng hơn.",
          "Có ý thức bảo vệ môi trường; cần tích cực giơ tay phát biểu xây dựng bài.",
          "Em cần cẩn thận hơn khi làm các bài tập trắc nghiệm phân tích hiện tượng."
        ],
        "fail": [
          "Chưa nắm được các kiến thức khoa học cốt lõi; còn thụ động trong giờ thực hành.",
          "Chưa giải thích được các hiện tượng tự nhiên đơn giản theo bài học.",
          "Em cần chú ý lắng nghe cô hướng dẫn quy trình làm thí nghiệm tại lớp."
        ]
      },
      "cong nghe": {
        "high": [
          "Khéo tay; lắp ráp các mô hình kỹ thuật nhanh, đúng quy trình và chắc chắn.",
          "Có tư duy sáng tạo cao; sản phẩm thủ công/công nghệ có thẩm mỹ tốt.",
          "Sử dụng thành thạo và an toàn các dụng cụ học tập môn Công nghệ.",
          "Nắm vững quy trình trồng, chăm sóc hoa và cây cảnh trong nhà trường.",
          "Hiểu tốt về các sản phẩm công nghệ trong gia đình; có ý thức tiết kiệm điện, năng lượng."
        ],
        "good": [
          "Lắp ráp được các mô hình theo mẫu; sản phẩm hoàn thiện ở mức khá.",
          "Có ý thức chuẩn bị đầy đủ vật liệu, đồ dùng học tập trước giờ học.",
          "Nắm được các bước trồng cây; cần chú ý giữ gìn vệ sinh nơi thực hành sạch sẽ hơn.",
          "Hiểu về an toàn điện; cần tập trung hơn trong các giờ thực hành lắp ráp chi tiết nhỏ.",
          "Em nên rèn luyện thêm sự kiên nhẫn khi thực hiện các thao tác kỹ thuật khó."
        ],
        "pass": [
          "Lắp ráp được các mô hình theo mẫu; sản phẩm hoàn thiện ở mức khá.",
          "Có ý thức chuẩn bị đầy đủ vật liệu, đồ dùng học tập trước giờ học.",
          "Nắm được các bước trồng cây; cần chú ý giữ gìn vệ sinh nơi thực hành sạch sẽ hơn.",
          "Hiểu về an toàn điện; cần tập trung hơn trong các giờ thực hành lắp ráp chi tiết nhỏ.",
          "Em nên rèn luyện thêm sự kiên nhẫn khi thực hiện các thao tác kỹ thuật khó."
        ],
        "fail": [
          "Chưa hoàn thiện được mô hình lắp ráp; lúng túng khi sử dụng các dụng cụ thủ công.",
          "Sản phẩm công nghệ làm ra chưa đúng kích thước hoặc chưa hoàn chỉnh theo yêu cầu.",
          "Em cần chú ý theo dõi các bước làm mẫu của giáo viên trên bảng."
        ]
      },
      "tin hoc": {
        "high": [
          "Thao tác chuột và bàn phím thành thạo; sử dụng tốt các phần mềm học tập.",
          "Tư duy thuật toán tốt; tự thiết kế được các chương trình kéo thả sáng tạo.",
          "Kỹ năng soạn thảo văn bản và thiết kế bài trình chiếu xuất sắc, thẩm mỹ.",
          "Biết cách tìm kiếm, lựa chọn và lưu trữ thông tin an toàn trên Internet.",
          "Tiếp thu bài nhanh; luôn chủ động hỗ trợ, hướng dẫn các bạn khi thực hành."
        ],
        "good": [
          "Thực hiện đúng các bước khởi động, tắt máy và mở các phần mềm cơ bản.",
          "Gõ được văn bản tiếng Việt ngắn; biết chỉnh sửa font chữ ở mức đơn giản.",
          "Lắp ráp được các khối lệnh theo mẫu hướng dẫn của giáo viên.",
          "Có ý thức bảo quản thiết bị phòng máy; cần tăng tốc độ gõ phím hơn.",
          "Em nên cẩn thận hơn khi lưu tệp tin vào đúng thư mục yêu cầu."
        ],
        "pass": [
          "Thực hiện đúng các bước khởi động, tắt máy và mở các phần mềm cơ bản.",
          "Gõ được văn bản tiếng Việt ngắn; biết chỉnh sửa font chữ ở mức đơn giản.",
          "Lắp ráp được các khối lệnh theo mẫu hướng dẫn của giáo viên.",
          "Có ý thức bảo quản thiết bị phòng máy; cần tăng tốc độ gõ phím hơn.",
          "Em nên cẩn thận hơn khi lưu tệp tin vào đúng thư mục yêu cầu."
        ],
        "fail": [
          "Thao tác máy tính còn lúng túng; chưa nhớ vị trí các phím chức năng.",
          "Chưa tự hoàn thiện được bài thực hành soạn thảo hoặc lập trình theo mẫu.",
          "Em cần tập trung nghe hướng dẫn và tăng cường thực hành gõ phím."
        ]
      },
      "tieng anh": {
        "high": [
          "Phát âm chuẩn; giao tiếp tự tin, lưu loát các chủ đề đã học.",
          "Khả năng nghe hiểu tốt; phản xạ nhanh khi tương tác bằng Tiếng Anh.",
          "Vốn từ vựng phong phú; nắm chắc cấu trúc ngữ pháp và viết đoạn văn tốt.",
          "Đọc hiểu văn bản nhanh; diễn đạt ý kiến cá nhân mạch lạc, trôi chảy.",
          "Tích cực tham gia các trò chơi ngôn ngữ và hoạt động đóng vai trước lớp."
        ],
        "good": [
          "Nghe và hiểu được các câu lệnh, đoạn hội thoại ngắn trong bài học.",
          "Trả lời được các câu hỏi giao tiếp cơ bản; đôi lúc phát âm còn thiếu đuôi (ending sounds).",
          "Viết được câu đúng ngữ pháp; cần mở rộng thêm vốn từ vựng theo chủ đề.",
          "Hiểu nội dung bài đọc; cần mạnh dạn, tự tin hơn khi nói trước đám đông.",
          "Em nên luyện nghe nhiều hơn tại nhà để cải thiện ngữ điệu."
        ],
        "pass": [
          "Nghe và hiểu được các câu lệnh, đoạn hội thoại ngắn trong bài học.",
          "Trả lời được các câu hỏi giao tiếp cơ bản; đôi lúc phát âm còn thiếu đuôi (ending sounds).",
          "Viết được câu đúng ngữ pháp; cần mở rộng thêm vốn từ vựng theo chủ đề.",
          "Hiểu nội dung bài đọc; cần mạnh dạn, tự tin hơn khi nói trước đám đông.",
          "Em nên luyện nghe nhiều hơn tại nhà để cải thiện ngữ điệu."
        ],
        "fail": [
          "Chưa thuộc các từ vựng cốt lõi; còn lúng túng khi viết câu tiếng Anh đơn giản.",
          "Khả năng nghe và phản xạ giao tiếp còn chậm; chưa tự tin tham gia hoạt động lớp.",
          "Giáo viên sẽ tăng cường gọi em tương tác; phụ huynh cần nhắc nhở con ôn từ vựng."
        ]
      },
      "giao duc the chat": {
        "high": [
          "Thực hiện đúng, đẹp và dứt khoát các động tác của bài thể dục phát triển chung.",
          "Tác phong nhanh nhẹn; hoàn thành tốt các bài tập rèn luyện tư thế và kỹ năng vận động.",
          "Có năng khiếu thể thao; thể lực tốt; tiếp thu nhanh các trò chơi vận động mới.",
          "Nghiêm túc thực hiện đúng các quy định đội hình đội ngũ và khẩu lệnh chỉ huy.",
          "Tích cực, nhiệt tình và có tinh thần đồng đội cao khi tham gia thi đấu nhóm."
        ],
        "good": [
          "Thực hiện tương đối đúng quy trình các động tác thể dục; thể lực đạt yêu cầu.",
          "Nắm được quy luật và tích cực tham gia vào các trò chơi vận động cùng bạn.",
          "Có ý thức nề nếp, ra vào lớp đúng giờ và chuẩn bị trang phục thể thao đúng quy định.",
          "Biết cách phối hợp với đồng đội trong các bài tập nhóm; cần chú ý biên độ động tác.",
          "Em cần tập trung chú ý lắng nghe và quan sát giáo viên làm mẫu kỹ hơn."
        ],
        "pass": [
          "Thực hiện tương đối đúng quy trình các động tác thể dục; thể lực đạt yêu cầu.",
          "Nắm được quy luật và tích cực tham gia vào các trò chơi vận động cùng bạn.",
          "Có ý thức nề nếp, ra vào lớp đúng giờ và chuẩn bị trang phục thể thao đúng quy định.",
          "Biết cách phối hợp với đồng đội trong các bài tập nhóm; cần chú ý biên độ động tác.",
          "Em cần tập trung chú ý lắng nghe và quan sát giáo viên làm mẫu kỹ hơn."
        ],
        "fail": [
          "Động tác tập còn hời hợt, chưa đúng kỹ thuật; thể lực còn yếu so với yêu cầu.",
          "Còn thụ động, chưa nghiêm túc hoặc hay mệt mỏi trong giờ tập luyện ngoài trời.",
          "Giáo viên sẽ hướng dẫn riêng từng động tác; em cần tự giác tập luyện thêm."
        ]
      },
      "other": {
        "high": [
          "Tích cực tham gia các hoạt động; tiếp thu bài nhanh; hoàn thành tốt các sản phẩm học tập và nhiệm vụ môn học."
        ],
        "good": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đầy đủ đồ dùng học tập; cần tự tin hơn khi trình bày."
        ],
        "pass": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đầy đủ đồ dùng học tập; cần tự tin hơn khi trình bày."
        ],
        "fail": [
          "Còn thụ động trong giờ học; chưa hoàn thiện sản phẩm hoặc nhiệm vụ học tập theo yêu cầu; cần cố gắng rèn luyện thêm."
        ]
      },
      "dao duc": {
        "high": [
          "Tích cực tham gia các hoạt động; tiếp thu bài nhanh; hoàn thành tốt các sản phẩm học tập và nhiệm vụ môn học."
        ],
        "good": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đầy đủ đồ dùng học tập; cần tự tin hơn khi trình bày."
        ],
        "pass": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đầy đủ đồ dùng học tập; cần tự tin hơn khi trình bày."
        ],
        "fail": [
          "Còn thụ động trong giờ học; chưa hoàn thiện sản phẩm hoặc nhiệm vụ học tập theo yêu cầu; cần cố gắng rèn luyện thêm."
        ]
      },
      "tu nhien va xa hoi": {
        "high": [
          "Tích cực tham gia các hoạt động; tiếp thu bài nhanh; hoàn thành tốt các sản phẩm học tập và nhiệm vụ môn học."
        ],
        "good": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đầy đủ đồ dùng học tập; cần tự tin hơn khi trình bày."
        ],
        "pass": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đầy đủ đồ dùng học tập; cần tự tin hơn khi trình bày."
        ],
        "fail": [
          "Còn thụ động trong giờ học; chưa hoàn thiện sản phẩm hoặc nhiệm vụ học tập theo yêu cầu; cần cố gắng rèn luyện thêm."
        ]
      },
      "am nhac": {
        "high": [
          "Tích cực tham gia các hoạt động; tiếp thu bài nhanh; hoàn thành tốt các sản phẩm học tập và nhiệm vụ môn học."
        ],
        "good": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đầy đủ đồ dùng học tập; cần tự tin hơn khi trình bày."
        ],
        "pass": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đầy đủ đồ dùng học tập; cần tự tin hơn khi trình bày."
        ],
        "fail": [
          "Còn thụ động trong giờ học; chưa hoàn thiện sản phẩm hoặc nhiệm vụ học tập theo yêu cầu; cần cố gắng rèn luyện thêm."
        ]
      },
      "mi thuat": {
        "high": [
          "Tích cực tham gia các hoạt động; tiếp thu bài nhanh; hoàn thành tốt các sản phẩm học tập và nhiệm vụ môn học."
        ],
        "good": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đầy đủ đồ dùng học tập; cần tự tin hơn khi trình bày."
        ],
        "pass": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đầy đủ đồ dùng học tập; cần tự tin hơn khi trình bày."
        ],
        "fail": [
          "Còn thụ động trong giờ học; chưa hoàn thiện sản phẩm hoặc nhiệm vụ học tập theo yêu cầu; cần cố gắng rèn luyện thêm."
        ]
      },
      "hoat dong trai nghiem": {
        "high": [
          "Tích cực tham gia các hoạt động; tiếp thu bài nhanh; hoàn thành tốt các sản phẩm học tập và nhiệm vụ môn học."
        ],
        "good": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đầy đủ đồ dùng học tập; cần tự tin hơn khi trình bày."
        ],
        "pass": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đầy đủ đồ dùng học tập; cần tự tin hơn khi trình bày."
        ],
        "fail": [
          "Còn thụ động trong giờ học; chưa hoàn thiện sản phẩm hoặc nhiệm vụ học tập theo yêu cầu; cần cố gắng rèn luyện thêm."
        ]
      },
      "tieng dan toc": {
        "high": [
          "Tích cực tham gia các hoạt động; tiếp thu bài nhanh; hoàn thành tốt các sản phẩm học tập và nhiệm vụ môn học."
        ],
        "good": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đầy đủ đồ dùng học tập; cần tự tin hơn khi trình bày."
        ],
        "pass": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đầy đủ đồ dùng học tập; cần tự tin hơn khi trình bày."
        ],
        "fail": [
          "Còn thụ động trong giờ học; chưa hoàn thiện sản phẩm hoặc nhiệm vụ học tập theo yêu cầu; cần cố gắng rèn luyện thêm."
        ]
      }
    },
    "qualities": {
      "yeu nuoc": {
        "high": [
          "Có niềm tự hào về lịch sử, truyền thống quê hương; trân trọng và bảo vệ môi trường, có ý thức tiết kiệm điện, nước trong nhà trường."
        ],
        "good": [
          "Có niềm tự hào về lịch sử, truyền thống quê hương; trân trọng và bảo vệ môi trường, có ý thức tiết kiệm điện, nước trong nhà trường."
        ],
        "fail": [
          "Cần nâng cao ý thức giữ gìn vệ sinh môi trường và tiết kiệm điện, nước tại trường lớp."
        ]
      },
      "nhan ai": {
        "high": [
          "Luôn hòa đồng, biết cảm thông, chia sẻ và giúp đỡ các bạn có hoàn cảnh khó khăn; lễ phép, kính trọng thầy cô và người lớn tuổi."
        ],
        "good": [
          "Luôn hòa đồng, biết cảm thông, chia sẻ và giúp đỡ các bạn có hoàn cảnh khó khăn; lễ phép, kính trọng thầy cô và người lớn tuổi."
        ],
        "fail": [
          "Cần biết chia sẻ, đồng cảm và mở lòng giúp đỡ bạn bè xung quanh nhiều hơn."
        ]
      },
      "cham chi": {
        "high": [
          "Đi học chuyên cần; chủ động dọn dẹp vệ sinh trường lớp; luôn hoàn thành tốt các bài tập và nhiệm vụ trực nhật được giao."
        ],
        "good": [
          "Đi học chuyên cần; chủ động dọn dẹp vệ sinh trường lớp; luôn hoàn thành tốt các bài tập và nhiệm vụ trực nhật được giao."
        ],
        "fail": [
          "Đôi lúc còn làm việc riêng trong giờ học; cần nâng cao tính chuyên cần và hoàn thành đầy đủ bài tập."
        ]
      },
      "trung thuc": {
        "high": [
          "Ngay thẳng, tôn trọng sự thật; tuyệt đối nghiêm túc không gian lận trong kiểm tra, thi cử; biết bảo vệ lẽ phải."
        ],
        "good": [
          "Ngay thẳng, tôn trọng sự thật; tuyệt đối nghiêm túc không gian lận trong kiểm tra, thi cử; biết bảo vệ lẽ phải."
        ],
        "fail": [
          "Cần nghiêm túc, trung thực trong học tập và kiểm tra, dũng cảm nhận khuyết điểm khi làm sai."
        ]
      },
      "trach nhiem": {
        "high": [
          "Có ý thức trách nhiệm cao với tập thể; nghiêm túc chấp hành nội quy trường lớp và luật giao thông; biết tự chịu trách nhiệm về hành vi của mình."
        ],
        "good": [
          "Có ý thức trách nhiệm cao với tập thể; nghiêm túc chấp hành nội quy trường lớp và luật giao thông; biết tự chịu trách nhiệm về hành vi của mình."
        ],
        "fail": [
          "Cần có ý thức trách nhiệm hơn với nhiệm vụ được giao và nghiêm túc chấp hành nội quy chung."
        ]
      }
    },
    "commonCompetencies": {
      "tu chu va tu hoc": {
        "high": [
          "Có thói quen tự học tốt; biết lập kế hoạch học tập cá nhân; tự giác tìm kiếm tài liệu để hoàn thành dự án nhỏ."
        ],
        "good": [
          "Có thói quen tự học tốt; biết lập kế hoạch học tập cá nhân; tự giác tìm kiếm tài liệu để hoàn thành dự án nhỏ."
        ],
        "fail": [
          "Chưa có ý thức tự giác cao, còn để nhắc nhở nhiều; cần chủ động làm bài tập mà không đợi thầy cô hay cha mẹ giục."
        ]
      },
      "giao tiep va hop tac": {
        "high": [
          "Tự tin bày tỏ quan điểm trước đám đông; có khả năng dẫn dắt, điều hành nhóm thảo luận hiệu quả và biết tôn trọng ý kiến người khác."
        ],
        "good": [
          "Tự tin bày tỏ quan điểm trước đám đông; có khả năng dẫn dắt, điều hành nhóm thảo luận hiệu quả và biết tôn trọng ý kiến người khác."
        ],
        "fail": [
          "Chưa biết cách phối hợp với các bạn khi làm việc nhóm; còn bảo thủ hoặc quá rụt rè khi tranh luận."
        ]
      },
      "giai quyet van de va sang tao": {
        "high": [
          "Tiếp thu bài nhanh; biết phân tích vấn đề và đề xuất các giải pháp xử lý tình huống thông minh, sáng tạo."
        ],
        "good": [
          "Tiếp thu bài nhanh; biết phân tích vấn đề và đề xuất các giải pháp xử lý tình huống thông minh, sáng tạo."
        ],
        "fail": [
          "Thói quen tư duy còn thụ động; gặp bài tập đòi hỏi lập luận logic nâng cao là dễ nản lòng."
        ]
      }
    },
    "specificCompetencies": {
      "ngon ngu": {
        "high": [
          "Khả năng thuyết trình mạch lạc; viết văn có cảm xúc cá nhân sâu sắc; sử dụng từ ngữ chính xác, giàu tính biểu cảm."
        ],
        "good": [
          "Khả năng thuyết trình mạch lạc; viết văn có cảm xúc cá nhân sâu sắc; sử dụng từ ngữ chính xác, giàu tính biểu cảm."
        ],
        "fail": [
          "Kỹ năng thuyết trình và diễn đạt còn hạn chế; cần rèn luyện thêm sự tự tin khi nói trước đám đông."
        ]
      },
      "tinh toan": {
        "high": [
          "Sử dụng thành thạo các công cụ toán học; có tư duy phân tích số liệu, biểu đồ tốt; nhạy bén với các con số."
        ],
        "good": [
          "Sử dụng thành thạo các công cụ toán học; có tư duy phân tích số liệu, biểu đồ tốt; nhạy bén với các con số."
        ],
        "fail": [
          "Tư duy phân tích số liệu và biểu đồ còn chậm; cần rèn luyện thêm kỹ năng tính toán và suy luận logic."
        ]
      },
      "khoa hoc": {
        "high": [
          "Biết thu thập thông tin, giải thích được các hiện tượng tự nhiên đơn giản; nắm rõ các sự kiện lịch sử và vị trí địa lý cơ bản của đất nước."
        ],
        "good": [
          "Biết thu thập thông tin, giải thích được các hiện tượng tự nhiên đơn giản; nắm rõ các sự kiện lịch sử và vị trí địa lý cơ bản của đất nước."
        ],
        "fail": [
          "Khả năng ghi nhớ và xâu chuỗi sự kiện còn yếu; cần chú ý đọc thêm tài liệu để củng cố kiến thức."
        ]
      },
      "tin hoc": {
        "high": [
          "Sử dụng tốt các phần mềm học tập, soạn thảo văn bản hoặc trình chiếu cơ bản; có ý thức bảo mật và sử dụng internet an toàn."
        ],
        "good": [
          "Sử dụng tốt các phần mềm học tập, soạn thảo văn bản hoặc trình chiếu cơ bản; có ý thức bảo mật và sử dụng internet an toàn."
        ],
        "fail": [
          "Thao tác trên phần mềm máy tính còn lúng túng; cần tăng cường thực hành để nâng cao kỹ năng tin học."
        ]
      },
      "cong nghe": {
        "high": [
          "Sử dụng thành thạo và an toàn các dụng cụ môn Công nghệ; có tư duy sáng tạo trong lắp ráp mô hình kỹ thuật."
        ],
        "good": [
          "Sử dụng thành thạo và an toàn các dụng cụ môn Công nghệ; có tư duy sáng tạo trong lắp ráp mô hình kỹ thuật."
        ],
        "fail": [
          "Thao tác kỹ thuật còn lúng túng; cần rèn luyện thêm sự khéo léo và kiên nhẫn."
        ]
      },
      "tham mi": {
        "high": [
          "Có năng khiếu nghệ thuật và khả năng cảm thụ cái đẹp tốt; biết sáng tạo các sản phẩm hội họa, âm nhạc ấn tượng."
        ],
        "good": [
          "Có năng khiếu nghệ thuật và khả năng cảm thụ cái đẹp tốt; biết sáng tạo các sản phẩm hội họa, âm nhạc ấn tượng."
        ],
        "fail": [
          "Cần chú ý quan sát và mạnh dạn thể hiện ý tưởng sáng tạo trong các hoạt động nghệ thuật."
        ]
      },
      "the chat": {
        "high": [
          "Thể lực tốt, tác phong nhanh nhẹn; hoàn thành xuất sắc các bài tập vận động và có tinh thần đồng đội cao."
        ],
        "good": [
          "Thể lực tốt, tác phong nhanh nhẹn; hoàn thành xuất sắc các bài tập vận động và có tinh thần đồng đội cao."
        ],
        "fail": [
          "Thể lực còn yếu; cần tích cực rèn luyện sức bền và sự dẻo dai trong các giờ giáo dục thể chất."
        ]
      }
    }
  },
  "5": {
    "subjects": {
      "tieng viet": {
        "high": [
          "Lớp 5: Kỹ năng viết văn miêu tả (người, phong cảnh) xuất sắc, biết dùng các biện pháp tu từ (so sánh, nhân hóa) sinh động. Sử dụng từ ngữ phong phú, viết đúng đoạn văn thể hiện tình cảm, cảm nghĩ.",
          "Nắm chắc kiến thức từ và câu (danh từ, động từ, tính từ, từ đồng nghĩa, trái nghĩa), chữ viết đẹp, đúng quy tắc chính tả."
        ],
        "good": [
          "Đọc diễn cảm tương đối tốt, trả lời đúng các câu hỏi đọc hiểu văn bản.",
          "Bài làm văn đủ ý, đúng bố cục 3 phần; tuy nhiên diễn đạt còn an toàn, chưa có nhiều phát hiện sáng tạo hoặc hình ảnh độc đáo.",
          "Nên chú ý lỗi lặp từ và rèn luyện thêm cách mở bài, kết bài mở rộng để bài văn hay hơn."
        ],
        "pass": [
          "Đọc thành tiếng đạt tốc độ yêu cầu nhưng chưa biết nhấn giọng, đọc diễn cảm.",
          "Bài tập làm văn còn ngắn, viết câu hay bị thiếu chủ ngữ hoặc vị ngữ; còn sai một số lỗi chính tả thông thường.",
          "Em cần đọc thêm nhiều sách, truyện để tích lũy vốn từ và chăm chỉ luyện viết đoạn văn tại nhà."
        ],
        "fail": [
          "Tốc độ đọc quá chậm, chưa hiểu nội dung bài đọc để trả lời câu hỏi trắc nghiệm/tự luận.",
          "Chưa biết cách bố cục một bài văn; câu văn rời rạc, viết sai nhiều lỗi chính tả.",
          "Cần sự phối hợp sát sao của phụ huynh để hướng dẫn em ôn lại cấu trúc câu và quy tắc chính tả mỗi tối."
        ]
      },
      "toan": {
        "high": [
          "Lớp 5: Nắm vững toán số thập phân, tỉ số phần trăm và các bài toán về chuyển động đều. Tính toán diện tích, thể tích các hình khối (hình hộp chữ nhật, hình lập phương) chính xác.",
          "Tư duy logic tốt, có khả năng giải các bài toán nâng cao hoặc tìm ra nhiều cách giải cho một bài toán."
        ],
        "good": [
          "Thực hiện đúng các thuật tính cơ bản theo yêu cầu của chương trình học.",
          "Hiểu và áp dụng đúng công thức tính toán hình học; tự giải được các bài toán có lời văn từ 2-3 bước tính.",
          "Cần tính toán cẩn thận hơn ở các bước trung gian (như quy đồng mẫu số hoặc nhân chia số thập phân) để tránh sai sót đáng tiếc."
        ],
        "pass": [
          "Kỹ năng tính toán còn chậm; hay nhầm lẫn vị trí dấu phẩy của số thập phân.",
          "Còn lúng túng khi nhận diện đề bài toán có lời văn phức tạp, thường tính sai đơn vị đo lượng.",
          "Em cần chăm chỉ làm bài tập về nhà, học thuộc các công thức toán hình và bảng đơn vị đo."
        ],
        "fail": [
          "Chưa nắm được các quy tắc tính toán cơ bản (phân số, số thập phân); không thuộc công thức tính hình học.",
          "Không tự tóm tắt và giải được bài toán có lời văn đơn giản.",
          "Giáo viên sẽ kèm cặp riêng tại lớp; đề nghị phụ huynh kiểm tra và cùng con ôn tập lại kiến thức nền tảng."
        ]
      },
      "lich su va dia li": {
        "high": [
          "Nắm chắc các sự kiện lịch sử; sử dụng thành thạo bản đồ, lược đồ địa lí.",
          "Trình bày lưu loát về các vị anh hùng dân tộc và đặc điểm tự nhiên các vùng miền.",
          "Có tư duy phản biện tốt; biết liên hệ kiến thức lịch sử với thực tế cuộc sống.",
          "Nhớ tốt mốc thời gian lịch sử; xác định chính xác các vị trí địa lí trên bản đồ.",
          "Hiểu sâu sắc về truyền thống văn hóa và địa lí Việt Nam; có ý thức hướng về cội nguồn."
        ],
        "good": [
          "Kể được tên các sự kiện lịch sử lớn; biết chỉ bản đồ ở mức cơ bản.",
          "Hiểu nội dung bài học; cần mạnh dạn hơn khi tham gia thảo luận nhóm.",
          "Xác định được các vùng địa lí trên lược đồ nhưng tốc độ còn hơi chậm.",
          "Nắm được nội dung cốt lõi của bài học; cần chú ý phân biệt các mốc lịch sử dễ nhầm lẫn.",
          "Em nên đọc thêm sách lịch sử để ghi nhớ sâu hơn các chi tiết sự kiện."
        ],
        "pass": [
          "Kể được tên các sự kiện lịch sử lớn; biết chỉ bản đồ ở mức cơ bản.",
          "Hiểu nội dung bài học; cần mạnh dạn hơn khi tham gia thảo luận nhóm.",
          "Xác định được các vùng địa lí trên lược đồ nhưng tốc độ còn hơi chậm.",
          "Nắm được nội dung cốt lõi của bài học; cần chú ý phân biệt các mốc lịch sử dễ nhầm lẫn.",
          "Em nên đọc thêm sách lịch sử để ghi nhớ sâu hơn các chi tiết sự kiện."
        ],
        "fail": [
          "Chưa nhớ các sự kiện lịch sử trọng tâm; chưa biết cách đọc bản đồ, lược đồ.",
          "Còn lúng túng khi trả lời câu hỏi lịch sử; hay nhầm lẫn các giai đoạn phát triển.",
          "Em cần tập trung nghe giảng và tập thói quen quan sát lược đồ nhiều hơn."
        ]
      },
      "khoa hoc": {
        "high": [
          "Ham học hỏi; có kỹ năng quan sát và làm thí nghiệm khoa học chính xác.",
          "Giải thích mạch lạc các hiện tượng tự nhiên và sự chuyển hóa của các chất.",
          "Nắm vững kiến thức về cơ thể người; có ý thức giữ gìn vệ sinh và phòng bệnh xuất sắc.",
          "Tư duy khoa học tốt; tích cực đề xuất các giải pháp bảo vệ môi trường nguồn nước, không khí.",
          "Tiếp thu bài rất nhanh; luôn hoàn thành xuất sắc các phiếu bài tập thực hành."
        ],
        "good": [
          "Hiểu các kiến thức khoa học cơ bản; biết áp dụng vào việc chăm sóc sức khỏe bản thân.",
          "Hoàn thành tốt các thí nghiệm dưới sự hướng dẫn của giáo viên và các bạn.",
          "Nắm được quy trình vòng đời của sinh vật; cần chú ý trình bày bài làm rõ ràng hơn.",
          "Có ý thức bảo vệ môi trường; cần tích cực giơ tay phát biểu xây dựng bài.",
          "Em cần cẩn thận hơn khi làm các bài tập trắc nghiệm phân tích hiện tượng."
        ],
        "pass": [
          "Hiểu các kiến thức khoa học cơ bản; biết áp dụng vào việc chăm sóc sức khỏe bản thân.",
          "Hoàn thành tốt các thí nghiệm dưới sự hướng dẫn của giáo viên và các bạn.",
          "Nắm được quy trình vòng đời của sinh vật; cần chú ý trình bày bài làm rõ ràng hơn.",
          "Có ý thức bảo vệ môi trường; cần tích cực giơ tay phát biểu xây dựng bài.",
          "Em cần cẩn thận hơn khi làm các bài tập trắc nghiệm phân tích hiện tượng."
        ],
        "fail": [
          "Chưa nắm được các kiến thức khoa học cốt lõi; còn thụ động trong giờ thực hành.",
          "Chưa giải thích được các hiện tượng tự nhiên đơn giản theo bài học.",
          "Em cần chú ý lắng nghe cô hướng dẫn quy trình làm thí nghiệm tại lớp."
        ]
      },
      "cong nghe": {
        "high": [
          "Khéo tay; lắp ráp các mô hình kỹ thuật nhanh, đúng quy trình và chắc chắn.",
          "Có tư duy sáng tạo cao; sản phẩm thủ công/công nghệ có thẩm mỹ tốt.",
          "Sử dụng thành thạo và an toàn các dụng cụ học tập môn Công nghệ.",
          "Nắm vững quy trình trồng, chăm sóc hoa và cây cảnh trong nhà trường.",
          "Hiểu tốt về các sản phẩm công nghệ trong gia đình; có ý thức tiết kiệm điện, năng lượng."
        ],
        "good": [
          "Lắp ráp được các mô hình theo mẫu; sản phẩm hoàn thiện ở mức khá.",
          "Có ý thức chuẩn bị đầy đủ vật liệu, đồ dùng học tập trước giờ học.",
          "Nắm được các bước trồng cây; cần chú ý giữ gìn vệ sinh nơi thực hành sạch sẽ hơn.",
          "Hiểu về an toàn điện; cần tập trung hơn trong các giờ thực hành lắp ráp chi tiết nhỏ.",
          "Em nên rèn luyện thêm sự kiên nhẫn khi thực hiện các thao tác kỹ thuật khó."
        ],
        "pass": [
          "Lắp ráp được các mô hình theo mẫu; sản phẩm hoàn thiện ở mức khá.",
          "Có ý thức chuẩn bị đầy đủ vật liệu, đồ dùng học tập trước giờ học.",
          "Nắm được các bước trồng cây; cần chú ý giữ gìn vệ sinh nơi thực hành sạch sẽ hơn.",
          "Hiểu về an toàn điện; cần tập trung hơn trong các giờ thực hành lắp ráp chi tiết nhỏ.",
          "Em nên rèn luyện thêm sự kiên nhẫn khi thực hiện các thao tác kỹ thuật khó."
        ],
        "fail": [
          "Chưa hoàn thiện được mô hình lắp ráp; lúng túng khi sử dụng các dụng cụ thủ công.",
          "Sản phẩm công nghệ làm ra chưa đúng kích thước hoặc chưa hoàn chỉnh theo yêu cầu.",
          "Em cần chú ý theo dõi các bước làm mẫu của giáo viên trên bảng."
        ]
      },
      "tin hoc": {
        "high": [
          "Thao tác chuột và bàn phím thành thạo; sử dụng tốt các phần mềm học tập.",
          "Tư duy thuật toán tốt; tự thiết kế được các chương trình kéo thả sáng tạo.",
          "Kỹ năng soạn thảo văn bản và thiết kế bài trình chiếu xuất sắc, thẩm mỹ.",
          "Biết cách tìm kiếm, lựa chọn và lưu trữ thông tin an toàn trên Internet.",
          "Tiếp thu bài nhanh; luôn chủ động hỗ trợ, hướng dẫn các bạn khi thực hành."
        ],
        "good": [
          "Thực hiện đúng các bước khởi động, tắt máy và mở các phần mềm cơ bản.",
          "Gõ được văn bản tiếng Việt ngắn; biết chỉnh sửa font chữ ở mức đơn giản.",
          "Lắp ráp được các khối lệnh theo mẫu hướng dẫn của giáo viên.",
          "Có ý thức bảo quản thiết bị phòng máy; cần tăng tốc độ gõ phím hơn.",
          "Em nên cẩn thận hơn khi lưu tệp tin vào đúng thư mục yêu cầu."
        ],
        "pass": [
          "Thực hiện đúng các bước khởi động, tắt máy và mở các phần mềm cơ bản.",
          "Gõ được văn bản tiếng Việt ngắn; biết chỉnh sửa font chữ ở mức đơn giản.",
          "Lắp ráp được các khối lệnh theo mẫu hướng dẫn của giáo viên.",
          "Có ý thức bảo quản thiết bị phòng máy; cần tăng tốc độ gõ phím hơn.",
          "Em nên cẩn thận hơn khi lưu tệp tin vào đúng thư mục yêu cầu."
        ],
        "fail": [
          "Thao tác máy tính còn lúng túng; chưa nhớ vị trí các phím chức năng.",
          "Chưa tự hoàn thiện được bài thực hành soạn thảo hoặc lập trình theo mẫu.",
          "Em cần tập trung nghe hướng dẫn và tăng cường thực hành gõ phím."
        ]
      },
      "tieng anh": {
        "high": [
          "Phát âm chuẩn; giao tiếp tự tin, lưu loát các chủ đề đã học.",
          "Khả năng nghe hiểu tốt; phản xạ nhanh khi tương tác bằng Tiếng Anh.",
          "Vốn từ vựng phong phú; nắm chắc cấu trúc ngữ pháp và viết đoạn văn tốt.",
          "Đọc hiểu văn bản nhanh; diễn đạt ý kiến cá nhân mạch lạc, trôi chảy.",
          "Tích cực tham gia các trò chơi ngôn ngữ và hoạt động đóng vai trước lớp."
        ],
        "good": [
          "Nghe và hiểu được các câu lệnh, đoạn hội thoại ngắn trong bài học.",
          "Trả lời được các câu hỏi giao tiếp cơ bản; đôi lúc phát âm còn thiếu đuôi (ending sounds).",
          "Viết được câu đúng ngữ pháp; cần mở rộng thêm vốn từ vựng theo chủ đề.",
          "Hiểu nội dung bài đọc; cần mạnh dạn, tự tin hơn khi nói trước đám đông.",
          "Em nên luyện nghe nhiều hơn tại nhà để cải thiện ngữ điệu."
        ],
        "pass": [
          "Nghe và hiểu được các câu lệnh, đoạn hội thoại ngắn trong bài học.",
          "Trả lời được các câu hỏi giao tiếp cơ bản; đôi lúc phát âm còn thiếu đuôi (ending sounds).",
          "Viết được câu đúng ngữ pháp; cần mở rộng thêm vốn từ vựng theo chủ đề.",
          "Hiểu nội dung bài đọc; cần mạnh dạn, tự tin hơn khi nói trước đám đông.",
          "Em nên luyện nghe nhiều hơn tại nhà để cải thiện ngữ điệu."
        ],
        "fail": [
          "Chưa thuộc các từ vựng cốt lõi; còn lúng túng khi viết câu tiếng Anh đơn giản.",
          "Khả năng nghe và phản xạ giao tiếp còn chậm; chưa tự tin tham gia hoạt động lớp.",
          "Giáo viên sẽ tăng cường gọi em tương tác; phụ huynh cần nhắc nhở con ôn từ vựng."
        ]
      },
      "giao duc the chat": {
        "high": [
          "Thực hiện đúng, đẹp và dứt khoát các động tác của bài thể dục phát triển chung.",
          "Tác phong nhanh nhẹn; hoàn thành tốt các bài tập rèn luyện tư thế và kỹ năng vận động.",
          "Có năng khiếu thể thao; thể lực tốt; tiếp thu nhanh các trò chơi vận động mới.",
          "Nghiêm túc thực hiện đúng các quy định đội hình đội ngũ và khẩu lệnh chỉ huy.",
          "Tích cực, nhiệt tình và có tinh thần đồng đội cao khi tham gia thi đấu nhóm."
        ],
        "good": [
          "Thực hiện tương đối đúng quy trình các động tác thể dục; thể lực đạt yêu cầu.",
          "Nắm được quy luật và tích cực tham gia vào các trò chơi vận động cùng bạn.",
          "Có ý thức nề nếp, ra vào lớp đúng giờ và chuẩn bị trang phục thể thao đúng quy định.",
          "Biết cách phối hợp với đồng đội trong các bài tập nhóm; cần chú ý biên độ động tác.",
          "Em cần tập trung chú ý lắng nghe và quan sát giáo viên làm mẫu kỹ hơn."
        ],
        "pass": [
          "Thực hiện tương đối đúng quy trình các động tác thể dục; thể lực đạt yêu cầu.",
          "Nắm được quy luật và tích cực tham gia vào các trò chơi vận động cùng bạn.",
          "Có ý thức nề nếp, ra vào lớp đúng giờ và chuẩn bị trang phục thể thao đúng quy định.",
          "Biết cách phối hợp với đồng đội trong các bài tập nhóm; cần chú ý biên độ động tác.",
          "Em cần tập trung chú ý lắng nghe và quan sát giáo viên làm mẫu kỹ hơn."
        ],
        "fail": [
          "Động tác tập còn hời hợt, chưa đúng kỹ thuật; thể lực còn yếu so với yêu cầu.",
          "Còn thụ động, chưa nghiêm túc hoặc hay mệt mỏi trong giờ tập luyện ngoài trời.",
          "Giáo viên sẽ hướng dẫn riêng từng động tác; em cần tự giác tập luyện thêm."
        ]
      },
      "other": {
        "high": [
          "Tích cực tham gia các hoạt động; tiếp thu bài nhanh; hoàn thành tốt các sản phẩm học tập và nhiệm vụ môn học."
        ],
        "good": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đầy đủ đồ dùng học tập; cần tự tin hơn khi trình bày."
        ],
        "pass": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đầy đủ đồ dùng học tập; cần tự tin hơn khi trình bày."
        ],
        "fail": [
          "Còn thụ động trong giờ học; chưa hoàn thiện sản phẩm hoặc nhiệm vụ học tập theo yêu cầu; cần cố gắng rèn luyện thêm."
        ]
      },
      "dao duc": {
        "high": [
          "Tích cực tham gia các hoạt động; tiếp thu bài nhanh; hoàn thành tốt các sản phẩm học tập và nhiệm vụ môn học."
        ],
        "good": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đầy đủ đồ dùng học tập; cần tự tin hơn khi trình bày."
        ],
        "pass": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đầy đủ đồ dùng học tập; cần tự tin hơn khi trình bày."
        ],
        "fail": [
          "Còn thụ động trong giờ học; chưa hoàn thiện sản phẩm hoặc nhiệm vụ học tập theo yêu cầu; cần cố gắng rèn luyện thêm."
        ]
      },
      "tu nhien va xa hoi": {
        "high": [
          "Tích cực tham gia các hoạt động; tiếp thu bài nhanh; hoàn thành tốt các sản phẩm học tập và nhiệm vụ môn học."
        ],
        "good": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đầy đủ đồ dùng học tập; cần tự tin hơn khi trình bày."
        ],
        "pass": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đầy đủ đồ dùng học tập; cần tự tin hơn khi trình bày."
        ],
        "fail": [
          "Còn thụ động trong giờ học; chưa hoàn thiện sản phẩm hoặc nhiệm vụ học tập theo yêu cầu; cần cố gắng rèn luyện thêm."
        ]
      },
      "am nhac": {
        "high": [
          "Tích cực tham gia các hoạt động; tiếp thu bài nhanh; hoàn thành tốt các sản phẩm học tập và nhiệm vụ môn học."
        ],
        "good": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đầy đủ đồ dùng học tập; cần tự tin hơn khi trình bày."
        ],
        "pass": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đầy đủ đồ dùng học tập; cần tự tin hơn khi trình bày."
        ],
        "fail": [
          "Còn thụ động trong giờ học; chưa hoàn thiện sản phẩm hoặc nhiệm vụ học tập theo yêu cầu; cần cố gắng rèn luyện thêm."
        ]
      },
      "mi thuat": {
        "high": [
          "Tích cực tham gia các hoạt động; tiếp thu bài nhanh; hoàn thành tốt các sản phẩm học tập và nhiệm vụ môn học."
        ],
        "good": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đầy đủ đồ dùng học tập; cần tự tin hơn khi trình bày."
        ],
        "pass": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đầy đủ đồ dùng học tập; cần tự tin hơn khi trình bày."
        ],
        "fail": [
          "Còn thụ động trong giờ học; chưa hoàn thiện sản phẩm hoặc nhiệm vụ học tập theo yêu cầu; cần cố gắng rèn luyện thêm."
        ]
      },
      "hoat dong trai nghiem": {
        "high": [
          "Tích cực tham gia các hoạt động; tiếp thu bài nhanh; hoàn thành tốt các sản phẩm học tập và nhiệm vụ môn học."
        ],
        "good": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đầy đủ đồ dùng học tập; cần tự tin hơn khi trình bày."
        ],
        "pass": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đầy đủ đồ dùng học tập; cần tự tin hơn khi trình bày."
        ],
        "fail": [
          "Còn thụ động trong giờ học; chưa hoàn thiện sản phẩm hoặc nhiệm vụ học tập theo yêu cầu; cần cố gắng rèn luyện thêm."
        ]
      },
      "tieng dan toc": {
        "high": [
          "Tích cực tham gia các hoạt động; tiếp thu bài nhanh; hoàn thành tốt các sản phẩm học tập và nhiệm vụ môn học."
        ],
        "good": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đầy đủ đồ dùng học tập; cần tự tin hơn khi trình bày."
        ],
        "pass": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đầy đủ đồ dùng học tập; cần tự tin hơn khi trình bày."
        ],
        "fail": [
          "Còn thụ động trong giờ học; chưa hoàn thiện sản phẩm hoặc nhiệm vụ học tập theo yêu cầu; cần cố gắng rèn luyện thêm."
        ]
      }
    },
    "qualities": {
      "yeu nuoc": {
        "high": [
          "Có niềm tự hào về lịch sử, truyền thống quê hương; trân trọng và bảo vệ môi trường, có ý thức tiết kiệm điện, nước trong nhà trường."
        ],
        "good": [
          "Có niềm tự hào về lịch sử, truyền thống quê hương; trân trọng và bảo vệ môi trường, có ý thức tiết kiệm điện, nước trong nhà trường."
        ],
        "fail": [
          "Cần nâng cao ý thức giữ gìn vệ sinh môi trường và tiết kiệm điện, nước tại trường lớp."
        ]
      },
      "nhan ai": {
        "high": [
          "Luôn hòa đồng, biết cảm thông, chia sẻ và giúp đỡ các bạn có hoàn cảnh khó khăn; lễ phép, kính trọng thầy cô và người lớn tuổi."
        ],
        "good": [
          "Luôn hòa đồng, biết cảm thông, chia sẻ và giúp đỡ các bạn có hoàn cảnh khó khăn; lễ phép, kính trọng thầy cô và người lớn tuổi."
        ],
        "fail": [
          "Cần biết chia sẻ, đồng cảm và mở lòng giúp đỡ bạn bè xung quanh nhiều hơn."
        ]
      },
      "cham chi": {
        "high": [
          "Đi học chuyên cần; chủ động dọn dẹp vệ sinh trường lớp; luôn hoàn thành tốt các bài tập và nhiệm vụ trực nhật được giao."
        ],
        "good": [
          "Đi học chuyên cần; chủ động dọn dẹp vệ sinh trường lớp; luôn hoàn thành tốt các bài tập và nhiệm vụ trực nhật được giao."
        ],
        "fail": [
          "Đôi lúc còn làm việc riêng trong giờ học; cần nâng cao tính chuyên cần và hoàn thành đầy đủ bài tập."
        ]
      },
      "trung thuc": {
        "high": [
          "Ngay thẳng, tôn trọng sự thật; tuyệt đối nghiêm túc không gian lận trong kiểm tra, thi cử; biết bảo vệ lẽ phải."
        ],
        "good": [
          "Ngay thẳng, tôn trọng sự thật; tuyệt đối nghiêm túc không gian lận trong kiểm tra, thi cử; biết bảo vệ lẽ phải."
        ],
        "fail": [
          "Cần nghiêm túc, trung thực trong học tập và kiểm tra, dũng cảm nhận khuyết điểm khi làm sai."
        ]
      },
      "trach nhiem": {
        "high": [
          "Có ý thức trách nhiệm cao với tập thể; nghiêm túc chấp hành nội quy trường lớp và luật giao thông; biết tự chịu trách nhiệm về hành vi của mình."
        ],
        "good": [
          "Có ý thức trách nhiệm cao với tập thể; nghiêm túc chấp hành nội quy trường lớp và luật giao thông; biết tự chịu trách nhiệm về hành vi của mình."
        ],
        "fail": [
          "Cần có ý thức trách nhiệm hơn với nhiệm vụ được giao và nghiêm túc chấp hành nội quy chung."
        ]
      }
    },
    "commonCompetencies": {
      "tu chu va tu hoc": {
        "high": [
          "Có thói quen tự học tốt; biết lập kế hoạch học tập cá nhân; tự giác tìm kiếm tài liệu để hoàn thành dự án nhỏ."
        ],
        "good": [
          "Có thói quen tự học tốt; biết lập kế hoạch học tập cá nhân; tự giác tìm kiếm tài liệu để hoàn thành dự án nhỏ."
        ],
        "fail": [
          "Chưa có ý thức tự giác cao, còn để nhắc nhở nhiều; cần chủ động làm bài tập mà không đợi thầy cô hay cha mẹ giục."
        ]
      },
      "giao tiep va hop tac": {
        "high": [
          "Tự tin bày tỏ quan điểm trước đám đông; có khả năng dẫn dắt, điều hành nhóm thảo luận hiệu quả và biết tôn trọng ý kiến người khác."
        ],
        "good": [
          "Tự tin bày tỏ quan điểm trước đám đông; có khả năng dẫn dắt, điều hành nhóm thảo luận hiệu quả và biết tôn trọng ý kiến người khác."
        ],
        "fail": [
          "Chưa biết cách phối hợp với các bạn khi làm việc nhóm; còn bảo thủ hoặc quá rụt rè khi tranh luận."
        ]
      },
      "giai quyet van de va sang tao": {
        "high": [
          "Tiếp thu bài nhanh; biết phân tích vấn đề và đề xuất các giải pháp xử lý tình huống thông minh, sáng tạo."
        ],
        "good": [
          "Tiếp thu bài nhanh; biết phân tích vấn đề và đề xuất các giải pháp xử lý tình huống thông minh, sáng tạo."
        ],
        "fail": [
          "Thói quen tư duy còn thụ động; gặp bài tập đòi hỏi lập luận logic nâng cao là dễ nản lòng."
        ]
      }
    },
    "specificCompetencies": {
      "ngon ngu": {
        "high": [
          "Khả năng thuyết trình mạch lạc; viết văn có cảm xúc cá nhân sâu sắc; sử dụng từ ngữ chính xác, giàu tính biểu cảm."
        ],
        "good": [
          "Khả năng thuyết trình mạch lạc; viết văn có cảm xúc cá nhân sâu sắc; sử dụng từ ngữ chính xác, giàu tính biểu cảm."
        ],
        "fail": [
          "Kỹ năng thuyết trình và diễn đạt còn hạn chế; cần rèn luyện thêm sự tự tin khi nói trước đám đông."
        ]
      },
      "tinh toan": {
        "high": [
          "Sử dụng thành thạo các công cụ toán học; có tư duy phân tích số liệu, biểu đồ tốt; nhạy bén với các con số."
        ],
        "good": [
          "Sử dụng thành thạo các công cụ toán học; có tư duy phân tích số liệu, biểu đồ tốt; nhạy bén với các con số."
        ],
        "fail": [
          "Tư duy phân tích số liệu và biểu đồ còn chậm; cần rèn luyện thêm kỹ năng tính toán và suy luận logic."
        ]
      },
      "khoa hoc": {
        "high": [
          "Biết thu thập thông tin, giải thích được các hiện tượng tự nhiên đơn giản; nắm rõ các sự kiện lịch sử và vị trí địa lý cơ bản của đất nước."
        ],
        "good": [
          "Biết thu thập thông tin, giải thích được các hiện tượng tự nhiên đơn giản; nắm rõ các sự kiện lịch sử và vị trí địa lý cơ bản của đất nước."
        ],
        "fail": [
          "Khả năng ghi nhớ và xâu chuỗi sự kiện còn yếu; cần chú ý đọc thêm tài liệu để củng cố kiến thức."
        ]
      },
      "tin hoc": {
        "high": [
          "Sử dụng tốt các phần mềm học tập, soạn thảo văn bản hoặc trình chiếu cơ bản; có ý thức bảo mật và sử dụng internet an toàn."
        ],
        "good": [
          "Sử dụng tốt các phần mềm học tập, soạn thảo văn bản hoặc trình chiếu cơ bản; có ý thức bảo mật và sử dụng internet an toàn."
        ],
        "fail": [
          "Thao tác trên phần mềm máy tính còn lúng túng; cần tăng cường thực hành để nâng cao kỹ năng tin học."
        ]
      },
      "cong nghe": {
        "high": [
          "Sử dụng thành thạo và an toàn các dụng cụ môn Công nghệ; có tư duy sáng tạo trong lắp ráp mô hình kỹ thuật."
        ],
        "good": [
          "Sử dụng thành thạo và an toàn các dụng cụ môn Công nghệ; có tư duy sáng tạo trong lắp ráp mô hình kỹ thuật."
        ],
        "fail": [
          "Thao tác kỹ thuật còn lúng túng; cần rèn luyện thêm sự khéo léo và kiên nhẫn."
        ]
      },
      "tham mi": {
        "high": [
          "Có năng khiếu nghệ thuật và khả năng cảm thụ cái đẹp tốt; biết sáng tạo các sản phẩm hội họa, âm nhạc ấn tượng."
        ],
        "good": [
          "Có năng khiếu nghệ thuật và khả năng cảm thụ cái đẹp tốt; biết sáng tạo các sản phẩm hội họa, âm nhạc ấn tượng."
        ],
        "fail": [
          "Cần chú ý quan sát và mạnh dạn thể hiện ý tưởng sáng tạo trong các hoạt động nghệ thuật."
        ]
      },
      "the chat": {
        "high": [
          "Thể lực tốt, tác phong nhanh nhẹn; hoàn thành xuất sắc các bài tập vận động và có tinh thần đồng đội cao."
        ],
        "good": [
          "Thể lực tốt, tác phong nhanh nhẹn; hoàn thành xuất sắc các bài tập vận động và có tinh thần đồng đội cao."
        ],
        "fail": [
          "Thể lực còn yếu; cần tích cực rèn luyện sức bền và sự dẻo dai trong các giờ giáo dục thể chất."
        ]
      }
    }
  }
}
};

const SUBJECT_ALIASES = {
    'ngoai ngu 1': 'tieng anh',
    'tieng anh': 'tieng anh',
    'lich su va dia li': 'lich su va dia li',
    'lich su dia li': 'lich su va dia li',
    'tu nhien va xa hoi': 'tu nhien va xa hoi',
    'giao duc the chat': 'giao duc the chat',
    'nghe thuat am nhac': 'am nhac',
    'am nhac': 'am nhac',
    'nghe thuat mi thuat': 'mi thuat',
    'nghe thuat my thuat': 'mi thuat',
    'mi thuat': 'mi thuat',
    'my thuat': 'mi thuat',
    'hoat dong trai nghiem': 'hoat dong trai nghiem',
    'tieng dan toc': 'tieng dan toc',
};

function normalizeText(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .replace(/[^a-zA-Z0-9]+/g, ' ')
        .trim()
        .toLowerCase();
}

function normalizeSubject(value) {
    const normalized = normalizeText(value);
    return SUBJECT_ALIASES[normalized] || normalized;
}

const COMMENT_BANK_ADDITIONS = {
  "1": {
    "subjects": {
      "tieng viet": {
        "high": [
          "Đọc to, rõ ràng, tốc độ đọc đạt yêu cầu; nhận diện và phát âm đúng các âm, vần khó.",
          "Chữ viết đúng mẫu, đều nét, đúng khoảng cách; trình bày vở sạch sẽ; viết đúng chính tả.",
          "Nắm chắc cấu trúc câu ngắn, trả lời lưu loát các câu hỏi hỏi-đáp về bài đọc."
        ],
        "good": [
          "Đọc đúng âm, vần, tiếng và từ ngữ; biết ngắt nghỉ hơi ở các dấu câu cơ bản.",
          "Viết đúng cỡ chữ, đúng quy trình viết nhưng tốc độ viết bài đôi lúc còn hơi chậm.",
          "Hiểu nội dung bài đọc ở mức cơ bản; cần mạnh dạn phát biểu to hơn trước lớp."
        ],
        "pass": [
          "Còn đánh vần chậm ở một số vần kép khó; tốc độ đọc thành tiếng chưa cao.",
          "Chữ viết chưa đều nét, viết hoa hoặc nối nét giữa các chữ cái chưa đúng quy định.",
          "Em cần chú ý rèn đọc thành tiếng và luyện viết bảng con/vở ô ly nhiều hơn ở nhà."
        ],
        "fail": [
          "Chưa thuộc hết bảng chữ cái; tốc độ đọc quá chậm và phải đánh vần từng tiếng.",
          "Viết sai lệch cỡ chữ, chưa hoàn thành được các câu chính tả ngắn tại lớp.",
          "Giáo viên tăng cường kèm cặp phối hợp cùng phụ huynh hướng dẫn em nhận diện lại con chữ mỗi tối."
        ]
      },
      "toan": {
        "high": [
          "Nhận biết, đọc, viết thành thạo các số trong phạm vi 100; tính nhẩm nhanh và chính xác.",
          "Thực hiện tốt các phép tính cộng, trừ không nhớ trong phạm vi 10, phạm vi 100.",
          "Nhận diện tốt các hình phẳng (hình vuông, tròn, tam giác, chữ nhật) và giải tốt bài toán có lời văn."
        ],
        "good": [
          "Thực hiện đúng các phép tính theo yêu cầu của giáo viên; biết so sánh các số.",
          "Hiểu bài, tự hoàn thành các bài tập toán tại lớp; cần chú ý viết chữ số ngay ngắn hơn.",
          "Biết cách làm toán có lời văn nhưng viết câu lời giải còn chậm."
        ],
        "pass": [
          "Kỹ năng tính toán cộng, trừ trong phạm vi 10, 100 còn chậm, đôi khi phải đếm ngón tay.",
          "Còn lúng túng khi sử dụng các dấu so sánh (>, <, =) hoặc điền số vào ô trống.",
          "Em cần rèn thêm các phép tính cơ bản và tập đọc kỹ đề bài toán."
        ],
        "fail": [
          "Chưa đếm và viết đúng các số trong phạm vi 20; sai sót nhiều ở các phép tính cộng trừ đơn giản.",
          "Không nhận diện được các hình hình học cơ bản hoặc các ngày trong tuần.",
          "Giáo viên sẽ bổ trợ kiến thức riêng tại lớp; đề nghị phụ huynh kiểm tra các phép tính đơn giản của con."
        ]
      },
      "other": {
        "high": [
          "Thích nghi tốt với môn học; hoàn thành sản phẩm đẹp mắt; thực hiện đúng các tư thế vận động cơ bản; hát đúng giai điệu bài hát lớp 1."
        ],
        "good": [
          "Có ý thức học tập, chuẩn bị đủ đồ dùng học tập; tham gia đầy đủ các hoạt động cùng bạn; cần tự tin hơn khi trình bày."
        ],
        "pass": [
          "Có ý thức học tập, chuẩn bị đủ đồ dùng học tập; tham gia đầy đủ các hoạt động cùng bạn; cần tự tin hơn khi trình bày."
        ],
        "fail": [
          "Còn bỡ ngỡ, chưa tập trung nghe hướng dẫn; sản phẩm hoặc động tác chưa hoàn thiện. Biện pháp: Giáo viên chú ý động viên và nhắc nhở em tập trung tham gia cùng tập thể."
        ]
      },
      "tu nhien va xa hoi": {
        "high": [
          "Thích nghi tốt với môn học; hoàn thành sản phẩm đẹp mắt; thực hiện đúng các tư thế vận động cơ bản; hát đúng giai điệu bài hát lớp 1."
        ],
        "good": [
          "Có ý thức học tập, chuẩn bị đủ đồ dùng học tập; tham gia đầy đủ các hoạt động cùng bạn; cần tự tin hơn khi trình bày."
        ],
        "pass": [
          "Có ý thức học tập, chuẩn bị đủ đồ dùng học tập; tham gia đầy đủ các hoạt động cùng bạn; cần tự tin hơn khi trình bày."
        ],
        "fail": [
          "Còn bỡ ngỡ, chưa tập trung nghe hướng dẫn; sản phẩm hoặc động tác chưa hoàn thiện. Biện pháp: Giáo viên chú ý động viên và nhắc nhở em tập trung tham gia cùng tập thể."
        ]
      },
      "dao duc": {
        "high": [
          "Thích nghi tốt với môn học; hoàn thành sản phẩm đẹp mắt; thực hiện đúng các tư thế vận động cơ bản; hát đúng giai điệu bài hát lớp 1."
        ],
        "good": [
          "Có ý thức học tập, chuẩn bị đủ đồ dùng học tập; tham gia đầy đủ các hoạt động cùng bạn; cần tự tin hơn khi trình bày."
        ],
        "pass": [
          "Có ý thức học tập, chuẩn bị đủ đồ dùng học tập; tham gia đầy đủ các hoạt động cùng bạn; cần tự tin hơn khi trình bày."
        ],
        "fail": [
          "Còn bỡ ngỡ, chưa tập trung nghe hướng dẫn; sản phẩm hoặc động tác chưa hoàn thiện. Biện pháp: Giáo viên chú ý động viên và nhắc nhở em tập trung tham gia cùng tập thể."
        ]
      },
      "am nhac": {
        "high": [
          "Thích nghi tốt với môn học; hoàn thành sản phẩm đẹp mắt; thực hiện đúng các tư thế vận động cơ bản; hát đúng giai điệu bài hát lớp 1."
        ],
        "good": [
          "Có ý thức học tập, chuẩn bị đủ đồ dùng học tập; tham gia đầy đủ các hoạt động cùng bạn; cần tự tin hơn khi trình bày."
        ],
        "pass": [
          "Có ý thức học tập, chuẩn bị đủ đồ dùng học tập; tham gia đầy đủ các hoạt động cùng bạn; cần tự tin hơn khi trình bày."
        ],
        "fail": [
          "Còn bỡ ngỡ, chưa tập trung nghe hướng dẫn; sản phẩm hoặc động tác chưa hoàn thiện. Biện pháp: Giáo viên chú ý động viên và nhắc nhở em tập trung tham gia cùng tập thể."
        ]
      },
      "mi thuat": {
        "high": [
          "Thích nghi tốt với môn học; hoàn thành sản phẩm đẹp mắt; thực hiện đúng các tư thế vận động cơ bản; hát đúng giai điệu bài hát lớp 1."
        ],
        "good": [
          "Có ý thức học tập, chuẩn bị đủ đồ dùng học tập; tham gia đầy đủ các hoạt động cùng bạn; cần tự tin hơn khi trình bày."
        ],
        "pass": [
          "Có ý thức học tập, chuẩn bị đủ đồ dùng học tập; tham gia đầy đủ các hoạt động cùng bạn; cần tự tin hơn khi trình bày."
        ],
        "fail": [
          "Còn bỡ ngỡ, chưa tập trung nghe hướng dẫn; sản phẩm hoặc động tác chưa hoàn thiện. Biện pháp: Giáo viên chú ý động viên và nhắc nhở em tập trung tham gia cùng tập thể."
        ]
      },
      "giao duc the chat": {
        "high": [
          "Thích nghi tốt với môn học; hoàn thành sản phẩm đẹp mắt; thực hiện đúng các tư thế vận động cơ bản; hát đúng giai điệu bài hát lớp 1."
        ],
        "good": [
          "Có ý thức học tập, chuẩn bị đủ đồ dùng học tập; tham gia đầy đủ các hoạt động cùng bạn; cần tự tin hơn khi trình bày."
        ],
        "pass": [
          "Có ý thức học tập, chuẩn bị đủ đồ dùng học tập; tham gia đầy đủ các hoạt động cùng bạn; cần tự tin hơn khi trình bày."
        ],
        "fail": [
          "Còn bỡ ngỡ, chưa tập trung nghe hướng dẫn; sản phẩm hoặc động tác chưa hoàn thiện. Biện pháp: Giáo viên chú ý động viên và nhắc nhở em tập trung tham gia cùng tập thể."
        ]
      },
      "hoat dong trai nghiem": {
        "high": [
          "Thích nghi tốt với môn học; hoàn thành sản phẩm đẹp mắt; thực hiện đúng các tư thế vận động cơ bản; hát đúng giai điệu bài hát lớp 1."
        ],
        "good": [
          "Có ý thức học tập, chuẩn bị đủ đồ dùng học tập; tham gia đầy đủ các hoạt động cùng bạn; cần tự tin hơn khi trình bày."
        ],
        "pass": [
          "Có ý thức học tập, chuẩn bị đủ đồ dùng học tập; tham gia đầy đủ các hoạt động cùng bạn; cần tự tin hơn khi trình bày."
        ],
        "fail": [
          "Còn bỡ ngỡ, chưa tập trung nghe hướng dẫn; sản phẩm hoặc động tác chưa hoàn thiện. Biện pháp: Giáo viên chú ý động viên và nhắc nhở em tập trung tham gia cùng tập thể."
        ]
      },
      "tieng dan toc": {
        "high": [
          "Thích nghi tốt với môn học; hoàn thành sản phẩm đẹp mắt; thực hiện đúng các tư thế vận động cơ bản; hát đúng giai điệu bài hát lớp 1."
        ],
        "good": [
          "Có ý thức học tập, chuẩn bị đủ đồ dùng học tập; tham gia đầy đủ các hoạt động cùng bạn; cần tự tin hơn khi trình bày."
        ],
        "pass": [
          "Có ý thức học tập, chuẩn bị đủ đồ dùng học tập; tham gia đầy đủ các hoạt động cùng bạn; cần tự tin hơn khi trình bày."
        ],
        "fail": [
          "Còn bỡ ngỡ, chưa tập trung nghe hướng dẫn; sản phẩm hoặc động tác chưa hoàn thiện. Biện pháp: Giáo viên chú ý động viên và nhắc nhở em tập trung tham gia cùng tập thể."
        ]
      }
    },
    "qualities": {
      "yeu nuoc": {
        "high": [
          "Có ý thức bảo vệ của công và giữ gìn cảnh quan lớp học sạch đẹp."
        ],
        "good": [
          "Có ý thức bảo vệ của công và giữ gìn cảnh quan lớp học sạch đẹp."
        ],
        "fail": [
          "Cần nâng cao ý thức giữ gìn vệ sinh và bảo vệ cảnh quan lớp học sạch đẹp hơn."
        ]
      },
      "nhan ai": {
        "high": [
          "Biết yêu thương, nhường nhịn bạn bè; sẵn sàng cho bạn mượn bút, tẩy khi bạn quên đem theo."
        ],
        "good": [
          "Biết yêu thương, nhường nhịn bạn bè; sẵn sàng cho bạn mượn bút, tẩy khi bạn quên đem theo."
        ],
        "fail": [
          "Cần biết hòa đồng, yêu thương và nhường nhịn, giúp đỡ bạn bè trong lớp."
        ]
      },
      "cham chi": {
        "high": [
          "Đi học đều và đúng giờ; hoàn thành bài tập vẽ/viết được giao; tích cực tham gia giữ vệ sinh lớp học."
        ],
        "good": [
          "Đi học đều và đúng giờ; hoàn thành bài tập vẽ/viết được giao; tích cực tham gia giữ vệ sinh lớp học."
        ],
        "fail": [
          "Cần đi học đúng giờ và tích cực, tự giác hoàn thành các bài tập viết/vẽ tại lớp."
        ]
      },
      "trung thuc": {
        "high": [
          "Thật thà, không tự tiện lấy đồ của bạn; nhặt được của rơi biết trả lại người mất; biết nhận lỗi khi làm sai."
        ],
        "good": [
          "Thật thà, không tự tiện lấy đồ của bạn; nhặt được của rơi biết trả lại người mất; biết nhận lỗi khi làm sai."
        ],
        "fail": [
          "Cần thật thà, mạnh dạn nhận lỗi và biết sửa lỗi khi làm sai."
        ]
      },
      "trach nhiem": {
        "high": [
          "Tự giác thu dọn sách vở, đồ dùng sau mỗi tiết học; thực hiện tốt các quy định về nền nếp lớp 1."
        ],
        "good": [
          "Tự giác thu dọn sách vở, đồ dùng sau mỗi tiết học; thực hiện tốt các quy định về nền nếp lớp 1."
        ],
        "fail": [
          "Cần rèn luyện tính tự giác thu dọn sách vở, đồ dùng học tập và thực hiện tốt nền nếp lớp học."
        ]
      }
    },
    "commonCompetencies": {
      "tu chu va tu hoc": {
        "high": [
          "Đã quen với nền nếp học tập; tự chuẩn bị được đồ dùng học tập theo thời khóa biểu."
        ],
        "good": [
          "Đã quen với nền nếp học tập; tự chuẩn bị được đồ dùng học tập theo thời khóa biểu."
        ],
        "fail": [
          "Còn hay quên đồ dùng (bút, thước, đất nặn); cần chú ý giữ gìn sách vở sạch sẽ hơn."
        ]
      },
      "giao tiep va hop tac": {
        "high": [
          "Biết chào hỏi thầy cô, hòa đồng với các bạn; bước đầu biết làm việc theo cặp, theo nhóm nhỏ."
        ],
        "good": [
          "Biết chào hỏi thầy cô, hòa đồng với các bạn; bước đầu biết làm việc theo cặp, theo nhóm nhỏ."
        ],
        "fail": [
          "Còn nói leo hoặc nói quá nhỏ; cần biết giơ tay phát biểu và lắng nghe khi bạn khác nói."
        ]
      },
      "giai quyet van de va sang tao": {
        "high": [
          "Biết thực hiện nhiệm vụ theo hướng dẫn của cô; có nhiều ý tưởng vẽ tranh sinh động."
        ],
        "good": [
          "Biết thực hiện nhiệm vụ theo hướng dẫn của cô; có nhiều ý tưởng vẽ tranh sinh động."
        ],
        "fail": [
          "Khi gặp bài toán khó hoặc tình huống lạ còn lúng túng; cần mạnh dạn hỏi giáo viên để được giúp đỡ."
        ]
      }
    },
    "specificCompetencies": {
      "ngon ngu": {
        "high": [
          "Trả lời tròn câu; biết dùng điệu bộ để diễn đạt ý muốn; biết lắng nghe và kể lại câu chuyện ngắn."
        ],
        "good": [
          "Trả lời tròn câu; biết dùng điệu bộ để diễn đạt ý muốn; biết lắng nghe và kể lại câu chuyện ngắn."
        ],
        "fail": [
          "Cần rèn luyện thêm kỹ năng diễn đạt tròn câu và tập trung lắng nghe khi giao tiếp."
        ]
      },
      "tinh toan": {
        "high": [
          "Sử dụng tốt đồ dùng học toán; nhận biết và phân biệt được vị trí (trên - dưới, trước - sau, phải - trái)."
        ],
        "good": [
          "Sử dụng tốt đồ dùng học toán; nhận biết và phân biệt được vị trí (trên - dưới, trước - sau, phải - trái)."
        ],
        "fail": [
          "Cần chú ý rèn thêm kỹ năng sử dụng đồ dùng học toán và xác định vị trí, phương hướng."
        ]
      },
      "the chat": {
        "high": [
          "Thao tác đúng các tư thế đội hình đội ngũ cơ bản và các trò chơi vận động lớp 1."
        ],
        "good": [
          "Thao tác đúng các tư thế đội hình đội ngũ cơ bản và các trò chơi vận động lớp 1."
        ],
        "fail": [
          "Cần rèn luyện thêm sự nhanh nhẹn và thực hiện đúng các tư thế vận động cơ bản."
        ]
      },
      "tham mi": {
        "high": [
          "Có cảm thụ nghệ thuật tốt; biết thể hiện ý tưởng qua nét vẽ sinh động và hát đúng giai điệu."
        ],
        "good": [
          "Có cảm thụ nghệ thuật tốt; biết thể hiện ý tưởng qua nét vẽ sinh động và hát đúng giai điệu."
        ],
        "fail": [
          "Còn rụt rè khi thể hiện bài hát hoặc chưa hoàn thiện sản phẩm vẽ theo yêu cầu."
        ]
      },
      "khoa hoc": {
        "high": [
          "Có ý thức quan sát các sự vật, hiện tượng xung quanh; nhận biết tốt các đồ vật quen thuộc."
        ],
        "good": [
          "Có ý thức quan sát các sự vật, hiện tượng xung quanh; nhận biết tốt các đồ vật quen thuộc."
        ],
        "fail": [
          "Cần chú ý quan sát và tìm hiểu thế giới tự nhiên xung quanh nhiều hơn."
        ]
      },
      "tin hoc": {
        "high": [
          "Bước đầu làm quen với các thiết bị học tập; có ý thức giữ gìn và bảo quản thiết bị."
        ],
        "good": [
          "Bước đầu làm quen với các thiết bị học tập; có ý thức giữ gìn và bảo quản thiết bị."
        ],
        "fail": [
          "Cần chú ý lắng nghe cô hướng dẫn khi làm quen với các thiết bị học tập."
        ]
      },
      "cong nghe": {
        "high": [
          "Khéo tay trong các bài tập thủ công xé dán; sử dụng an toàn các dụng cụ học tập."
        ],
        "good": [
          "Khéo tay trong các bài tập thủ công xé dán; sử dụng an toàn các dụng cụ học tập."
        ],
        "fail": [
          "Thao tác xé dán thủ công còn chậm; cần rèn luyện thêm sự khéo léo."
        ]
      }
    }
  },
  "2": {
    "subjects": {
      "tieng viet": {
        "high": [
          "Lớp 2: Đọc to, rõ ràng, trôi chảy; bước đầu biết đọc phân biệt lời nhân vật; viết được đoạn văn ngắn đúng ngữ pháp, từ ngữ sinh động.",
          "Chữ viết đúng mẫu, đều nét, đúng khoảng cách, trình bày bài sạch đẹp."
        ],
        "good": [
          "Đọc trôi chảy toàn bài, ngắt nghỉ đúng dấu câu; trả lời đúng các câu hỏi đọc hiểu cơ bản.",
          "Viết đúng cỡ chữ, đúng chính tả; đoạn văn đủ ý nhưng dùng từ còn đơn điệu, chưa sinh động.",
          "Cần đọc thêm sách để mở rộng vốn từ và tăng tốc độ viết bài."
        ],
        "pass": [
          "Đọc còn chậm, hay ngắc ngứ ở các từ ngữ dài hoặc vần khó; hiểu nội dung bài ở mức sơ giản.",
          "Chữ viết chưa đều nét, bài viết còn sai một số lỗi chính tả (như ch/tr, l/n, dấu thanh). Đoạn văn viết còn ngắn, lặp từ.",
          "Em cần tăng cường rèn đọc thành tiếng và luyện viết câu/đoạn văn nhiều hơn ở nhà."
        ],
        "fail": [
          "Tốc độ đọc quá chậm, phải đánh vần nhiều; chưa hiểu nội dung văn bản.",
          "Chữ viết sai lệch cỡ chữ, chưa biết cách viết một câu hoàn chỉnh, hay bỏ dở bài viết chính tả tại lớp.",
          "Cần phối hợp chặt chẽ với phụ huynh để kèm đọc hiểu và luyện viết cho em mỗi tối."
        ]
      },
      "toan": {
        "high": [
          "Tính toán nhanh, chính xác phép cộng, trừ có nhớ phạm vi 100; thuộc làu bảng nhân, chia 2 và 5; giải tốt toán có lời văn."
        ],
        "good": [
          "Thực hiện đúng các phép tính theo yêu cầu; thuộc các bảng nhân/chia đã học.",
          "Hiểu bài, tự hoàn thành các bài tập tại lớp; tuy nhiên tốc độ tính nhẩm cần đẩy nhanh hơn.",
          "Cần chú ý cẩn thận khi tính toán phần có nhớ và trình bày lời giải rõ ràng hơn."
        ],
        "pass": [
          "Kỹ năng tính toán còn chậm; hay quên không cộng phần nhớ; còn lúng túng khi phân tích đề bài toán có lời văn.",
          "Còn lúng túng khi phân tích đề bài toán có lời văn để tìm phép tính đúng.",
          "Em cần rèn luyện thêm các phép tính cơ bản và ôn tập kỹ bảng cửu chương."
        ],
        "fail": [
          "Chưa thực hiện được các phép tính cộng, trừ cơ bản; không thuộc bảng nhân, chia 2 và 5.",
          "Không tự làm được các bài tập hình học hoặc giải toán có lời văn đơn giản.",
          "Giáo viên sẽ bổ trợ kiến thức riêng tại lớp; đề nghị phụ huynh kiểm tra bài ở nhà cùng con."
        ]
      },
      "other": {
        "high": [
          "Tích cực tham gia các hoạt động; tiếp thu bài nhanh; có năng khiếu đặc thù (vẽ đẹp, hát đúng nhạc, thực hiện dứt khoát động tác thể dục, thao tác máy tính thành thạo)."
        ],
        "good": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đủ đồ dùng học tập; cần mạnh dạn hơn khi phát biểu xây dựng bài."
        ],
        "pass": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đủ đồ dùng học tập; cần mạnh dạn hơn khi phát biểu xây dựng bài."
        ],
        "fail": [
          "Còn thụ động trong giờ học; chưa hoàn thành sản phẩm hoặc các động tác bài tập theo yêu cầu. Biện pháp: Giáo viên chú ý động viên và nhắc nhở em tập trung tham gia cùng tập thể."
        ]
      },
      "tu nhien va xa hoi": {
        "high": [
          "Tích cực tham gia các hoạt động; tiếp thu bài nhanh; có năng khiếu đặc thù (vẽ đẹp, hát đúng nhạc, thực hiện dứt khoát động tác thể dục, thao tác máy tính thành thạo)."
        ],
        "good": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đủ đồ dùng học tập; cần mạnh dạn hơn khi phát biểu xây dựng bài."
        ],
        "pass": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đủ đồ dùng học tập; cần mạnh dạn hơn khi phát biểu xây dựng bài."
        ],
        "fail": [
          "Còn thụ động trong giờ học; chưa hoàn thành sản phẩm hoặc các động tác bài tập theo yêu cầu. Biện pháp: Giáo viên chú ý động viên và nhắc nhở em tập trung tham gia cùng tập thể."
        ]
      },
      "khoa hoc": {
        "high": [
          "Tích cực tham gia các hoạt động; tiếp thu bài nhanh; có năng khiếu đặc thù (vẽ đẹp, hát đúng nhạc, thực hiện dứt khoát động tác thể dục, thao tác máy tính thành thạo)."
        ],
        "good": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đủ đồ dùng học tập; cần mạnh dạn hơn khi phát biểu xây dựng bài."
        ],
        "pass": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đủ đồ dùng học tập; cần mạnh dạn hơn khi phát biểu xây dựng bài."
        ],
        "fail": [
          "Còn thụ động trong giờ học; chưa hoàn thành sản phẩm hoặc các động tác bài tập theo yêu cầu. Biện pháp: Giáo viên chú ý động viên và nhắc nhở em tập trung tham gia cùng tập thể."
        ]
      },
      "dao duc": {
        "high": [
          "Tích cực tham gia các hoạt động; tiếp thu bài nhanh; có năng khiếu đặc thù (vẽ đẹp, hát đúng nhạc, thực hiện dứt khoát động tác thể dục, thao tác máy tính thành thạo)."
        ],
        "good": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đủ đồ dùng học tập; cần mạnh dạn hơn khi phát biểu xây dựng bài."
        ],
        "pass": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đủ đồ dùng học tập; cần mạnh dạn hơn khi phát biểu xây dựng bài."
        ],
        "fail": [
          "Còn thụ động trong giờ học; chưa hoàn thành sản phẩm hoặc các động tác bài tập theo yêu cầu. Biện pháp: Giáo viên chú ý động viên và nhắc nhở em tập trung tham gia cùng tập thể."
        ]
      },
      "cong nghe": {
        "high": [
          "Tích cực tham gia các hoạt động; tiếp thu bài nhanh; có năng khiếu đặc thù (vẽ đẹp, hát đúng nhạc, thực hiện dứt khoát động tác thể dục, thao tác máy tính thành thạo)."
        ],
        "good": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đủ đồ dùng học tập; cần mạnh dạn hơn khi phát biểu xây dựng bài."
        ],
        "pass": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đủ đồ dùng học tập; cần mạnh dạn hơn khi phát biểu xây dựng bài."
        ],
        "fail": [
          "Còn thụ động trong giờ học; chưa hoàn thành sản phẩm hoặc các động tác bài tập theo yêu cầu. Biện pháp: Giáo viên chú ý động viên và nhắc nhở em tập trung tham gia cùng tập thể."
        ]
      },
      "tin hoc": {
        "high": [
          "Tích cực tham gia các hoạt động; tiếp thu bài nhanh; có năng khiếu đặc thù (vẽ đẹp, hát đúng nhạc, thực hiện dứt khoát động tác thể dục, thao tác máy tính thành thạo)."
        ],
        "good": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đủ đồ dùng học tập; cần mạnh dạn hơn khi phát biểu xây dựng bài."
        ],
        "pass": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đủ đồ dùng học tập; cần mạnh dạn hơn khi phát biểu xây dựng bài."
        ],
        "fail": [
          "Còn thụ động trong giờ học; chưa hoàn thành sản phẩm hoặc các động tác bài tập theo yêu cầu. Biện pháp: Giáo viên chú ý động viên và nhắc nhở em tập trung tham gia cùng tập thể."
        ]
      },
      "am nhac": {
        "high": [
          "Tích cực tham gia các hoạt động; tiếp thu bài nhanh; có năng khiếu đặc thù (vẽ đẹp, hát đúng nhạc, thực hiện dứt khoát động tác thể dục, thao tác máy tính thành thạo)."
        ],
        "good": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đủ đồ dùng học tập; cần mạnh dạn hơn khi phát biểu xây dựng bài."
        ],
        "pass": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đủ đồ dùng học tập; cần mạnh dạn hơn khi phát biểu xây dựng bài."
        ],
        "fail": [
          "Còn thụ động trong giờ học; chưa hoàn thành sản phẩm hoặc các động tác bài tập theo yêu cầu. Biện pháp: Giáo viên chú ý động viên và nhắc nhở em tập trung tham gia cùng tập thể."
        ]
      },
      "mi thuat": {
        "high": [
          "Tích cực tham gia các hoạt động; tiếp thu bài nhanh; có năng khiếu đặc thù (vẽ đẹp, hát đúng nhạc, thực hiện dứt khoát động tác thể dục, thao tác máy tính thành thạo)."
        ],
        "good": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đủ đồ dùng học tập; cần mạnh dạn hơn khi phát biểu xây dựng bài."
        ],
        "pass": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đủ đồ dùng học tập; cần mạnh dạn hơn khi phát biểu xây dựng bài."
        ],
        "fail": [
          "Còn thụ động trong giờ học; chưa hoàn thành sản phẩm hoặc các động tác bài tập theo yêu cầu. Biện pháp: Giáo viên chú ý động viên và nhắc nhở em tập trung tham gia cùng tập thể."
        ]
      },
      "giao duc the chat": {
        "high": [
          "Tích cực tham gia các hoạt động; tiếp thu bài nhanh; có năng khiếu đặc thù (vẽ đẹp, hát đúng nhạc, thực hiện dứt khoát động tác thể dục, thao tác máy tính thành thạo)."
        ],
        "good": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đủ đồ dùng học tập; cần mạnh dạn hơn khi phát biểu xây dựng bài."
        ],
        "pass": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đủ đồ dùng học tập; cần mạnh dạn hơn khi phát biểu xây dựng bài."
        ],
        "fail": [
          "Còn thụ động trong giờ học; chưa hoàn thành sản phẩm hoặc các động tác bài tập theo yêu cầu. Biện pháp: Giáo viên chú ý động viên và nhắc nhở em tập trung tham gia cùng tập thể."
        ]
      },
      "hoat dong trai nghiem": {
        "high": [
          "Tích cực tham gia các hoạt động; tiếp thu bài nhanh; có năng khiếu đặc thù (vẽ đẹp, hát đúng nhạc, thực hiện dứt khoát động tác thể dục, thao tác máy tính thành thạo)."
        ],
        "good": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đủ đồ dùng học tập; cần mạnh dạn hơn khi phát biểu xây dựng bài."
        ],
        "pass": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đủ đồ dùng học tập; cần mạnh dạn hơn khi phát biểu xây dựng bài."
        ],
        "fail": [
          "Còn thụ động trong giờ học; chưa hoàn thành sản phẩm hoặc các động tác bài tập theo yêu cầu. Biện pháp: Giáo viên chú ý động viên và nhắc nhở em tập trung tham gia cùng tập thể."
        ]
      },
      "tieng dan toc": {
        "high": [
          "Tích cực tham gia các hoạt động; tiếp thu bài nhanh; có năng khiếu đặc thù (vẽ đẹp, hát đúng nhạc, thực hiện dứt khoát động tác thể dục, thao tác máy tính thành thạo)."
        ],
        "good": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đủ đồ dùng học tập; cần mạnh dạn hơn khi phát biểu xây dựng bài."
        ],
        "pass": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đủ đồ dùng học tập; cần mạnh dạn hơn khi phát biểu xây dựng bài."
        ],
        "fail": [
          "Còn thụ động trong giờ học; chưa hoàn thành sản phẩm hoặc các động tác bài tập theo yêu cầu. Biện pháp: Giáo viên chú ý động viên và nhắc nhở em tập trung tham gia cùng tập thể."
        ]
      }
    },
    "qualities": {
      "yeu nuoc": {
        "high": [
          "Nghiêm túc khi chào cờ; có tình yêu thiên nhiên và ý thức bảo vệ cảnh quan trường lớp xanh - sạch - đẹp."
        ],
        "good": [
          "Nghiêm túc khi chào cờ; có tình yêu thiên nhiên và ý thức bảo vệ cảnh quan trường lớp xanh - sạch - đẹp."
        ],
        "fail": [
          "Cần nghiêm túc hơn trong giờ chào cờ và có ý thức giữ gìn vệ sinh cảnh quan trường lớp."
        ]
      },
      "nhan ai": {
        "high": [
          "Sẵn sàng chia sẻ, giúp đỡ bạn bè trong học tập; biết tôn trọng, lễ phép với thầy cô và người lớn tuổi."
        ],
        "good": [
          "Sẵn sàng chia sẻ, giúp đỡ bạn bè trong học tập; biết tôn trọng, lễ phép với thầy cô và người lớn tuổi."
        ],
        "fail": [
          "Cần biết chia sẻ, hòa đồng hơn với bạn bè và lễ phép với người lớn."
        ]
      },
      "cham chi": {
        "high": [
          "Đi học đúng giờ; chăm chú nghe giảng; luôn tự giác hoàn thành bài tập về nhà và tham gia tích cực việc trực nhật lớp."
        ],
        "good": [
          "Đi học đúng giờ; chăm chú nghe giảng; luôn tự giác hoàn thành bài tập về nhà và tham gia tích cực việc trực nhật lớp."
        ],
        "fail": [
          "Đôi lúc còn làm việc riêng trong giờ học; cần tự giác hoàn thành bài tập về nhà."
        ]
      },
      "trung thuc": {
        "high": [
          "Thật thà, ngay thẳng trong học tập và thi cử; biết nhận lỗi và sửa lỗi khi làm sai."
        ],
        "good": [
          "Thật thà, ngay thẳng trong học tập và thi cử; biết nhận lỗi và sửa lỗi khi làm sai."
        ],
        "fail": [
          "Cần trung thực, thẳng thắn nhận lỗi khi làm sai để tiến bộ hơn."
        ]
      },
      "trach nhiem": {
        "high": [
          "Thực hiện nghiêm túc nội quy trường lớp; có ý thức giữ gìn vệ sinh chung và bảo vệ của công."
        ],
        "good": [
          "Thực hiện nghiêm túc nội quy trường lớp; có ý thức giữ gìn vệ sinh chung và bảo vệ của công."
        ],
        "fail": [
          "Cần có ý thức trách nhiệm hơn trong việc giữ gìn vệ sinh chung và bảo vệ của công."
        ]
      }
    },
    "commonCompetencies": {
      "tu chu va tu hoc": {
        "high": [
          "Tự giác thực hiện nhiệm vụ học tập; tự chuẩn bị đầy đủ sách vở, đồ dùng học tập trước khi đến lớp."
        ],
        "good": [
          "Tự giác thực hiện nhiệm vụ học tập; tự chuẩn bị đầy đủ sách vở, đồ dùng học tập trước khi đến lớp."
        ],
        "fail": [
          "Đôi lúc còn lơ là, cần tập trung hơn và hạn chế làm việc riêng trong giờ học."
        ]
      },
      "giao tiep va hop tac": {
        "high": [
          "Biết lắng nghe bạn bè; mạnh dạn, tự tin khi chia sẻ ý kiến và phối hợp tốt khi làm việc nhóm."
        ],
        "good": [
          "Biết lắng nghe bạn bè; mạnh dạn, tự tin khi chia sẻ ý kiến và phối hợp tốt khi làm việc nhóm."
        ],
        "fail": [
          "Còn rụt rè khi giao tiếp; cần chủ động tương tác với các bạn trong các hoạt động tập thể."
        ]
      },
      "giai quyet van de va sang tao": {
        "high": [
          "Tiếp thu bài nhanh; biết dựa vào gợi ý để giải quyết các tình huống học tập; có nhiều ý tưởng sáng tạo."
        ],
        "good": [
          "Tiếp thu bài nhanh; biết dựa vào gợi ý để giải quyết các tình huống học tập; có nhiều ý tưởng sáng tạo."
        ],
        "fail": [
          "Còn thụ động, hay chờ đợi sự giúp đỡ; cần tự suy nghĩ trước khi hỏi cô hoặc bạn."
        ]
      }
    },
    "specificCompetencies": {
      "ngon ngu": {
        "high": [
          "Diễn đạt rõ ràng, mạch lạc; biết dùng từ phù hợp khi nói và viết; biết kể lại câu chuyện ngắn dựa theo tranh hoặc gợi ý."
        ],
        "good": [
          "Diễn đạt rõ ràng, mạch lạc; biết dùng từ phù hợp khi nói và viết; biết kể lại câu chuyện ngắn dựa theo tranh hoặc gợi ý."
        ],
        "fail": [
          "Diễn đạt câu từ còn lúng túng; cần rèn luyện thêm cách kể chuyện và dùng từ chính xác."
        ]
      },
      "tinh toan": {
        "high": [
          "Có tư duy số học tốt; nhận diện nhanh các hình khối, quy luật toán học và đơn vị đo lường cơ bản."
        ],
        "good": [
          "Có tư duy số học tốt; nhận diện nhanh các hình khối, quy luật toán học và đơn vị đo lường cơ bản."
        ],
        "fail": [
          "Khả năng tính toán và nhận diện hình học còn chậm; cần rèn luyện thêm kỹ năng tính nhẩm."
        ]
      },
      "khoa hoc": {
        "high": [
          "Có ý thức quan sát tốt; ham hiểu biết; nhận biết được các hiện tượng tự nhiên và cơ quan trong cơ thể người."
        ],
        "good": [
          "Có ý thức quan sát tốt; ham hiểu biết; nhận biết được các hiện tượng tự nhiên và cơ quan trong cơ thể người."
        ],
        "fail": [
          "Chưa tập trung quan sát; còn lúng túng khi giải thích các hiện tượng tự nhiên cơ bản."
        ]
      },
      "tin hoc": {
        "high": [
          "Bước đầu làm quen và thực hiện đúng các thao tác cơ bản trên máy tính; sử dụng an toàn các dụng cụ học tập."
        ],
        "good": [
          "Bước đầu làm quen và thực hiện đúng các thao tác cơ bản trên máy tính; sử dụng an toàn các dụng cụ học tập."
        ],
        "fail": [
          "Thao tác trên máy tính còn chậm; cần rèn luyện thêm để nắm vững các kỹ năng cơ bản."
        ]
      },
      "cong nghe": {
        "high": [
          "Sử dụng an toàn các dụng cụ thủ công; hoàn thành các sản phẩm kỹ thuật, thủ công đúng quy trình."
        ],
        "good": [
          "Sử dụng an toàn các dụng cụ thủ công; hoàn thành các sản phẩm kỹ thuật, thủ công đúng quy trình."
        ],
        "fail": [
          "Sử dụng dụng cụ thủ công còn chậm; sản phẩm hoàn thiện chưa đạt yêu cầu."
        ]
      },
      "tham mi": {
        "high": [
          "Có năng khiếu nghệ thuật; biết cảm nhận cái đẹp và thể hiện sáng tạo qua các sản phẩm âm nhạc, mĩ thuật."
        ],
        "good": [
          "Có năng khiếu nghệ thuật; biết cảm nhận cái đẹp và thể hiện sáng tạo qua các sản phẩm âm nhạc, mĩ thuật."
        ],
        "fail": [
          "Cần chú ý lắng nghe giai điệu và rèn luyện thêm kỹ năng tạo hình, vẽ tranh."
        ]
      },
      "the chat": {
        "high": [
          "Thực hiện đúng và dứt khoát các động tác bài tập thể dục; tích cực tham gia các trò chơi vận động."
        ],
        "good": [
          "Thực hiện đúng và dứt khoát các động tác bài tập thể dục; tích cực tham gia các trò chơi vận động."
        ],
        "fail": [
          "Thể lực còn hạn chế; cần tích cực rèn luyện thêm các động tác thể dục cơ bản."
        ]
      }
    }
  },
  "3": {
    "subjects": {
      "tieng viet": {
        "high": [
          "Lớp 3: Đọc diễn cảm tốt, hiểu sâu ý nghĩa bài đọc; viết câu đúng ngữ pháp, đoạn văn ngắn có bố cục rõ ràng, giàu hình ảnh.",
          "Chữ viết đúng mẫu, đều nét, đúng khoảng cách, trình bày bài sạch đẹp."
        ],
        "good": [
          "Đọc trôi chảy toàn bài, ngắt nghỉ đúng dấu câu; trả lời đúng các câu hỏi đọc hiểu cơ bản.",
          "Viết đúng cỡ chữ, đúng chính tả; đoạn văn đủ ý nhưng dùng từ còn đơn điệu, chưa sinh động.",
          "Cần đọc thêm sách để mở rộng vốn từ và tăng tốc độ viết bài."
        ],
        "pass": [
          "Đọc còn chậm, hay ngắc ngứ ở các từ ngữ dài hoặc vần khó; hiểu nội dung bài ở mức sơ giản.",
          "Chữ viết chưa đều nét, bài viết còn sai một số lỗi chính tả (như ch/tr, l/n, dấu thanh). Đoạn văn viết còn ngắn, lặp từ.",
          "Em cần tăng cường rèn đọc thành tiếng và luyện viết câu/đoạn văn nhiều hơn ở nhà."
        ],
        "fail": [
          "Tốc độ đọc quá chậm, phải đánh vần nhiều; chưa hiểu nội dung văn bản.",
          "Chữ viết sai lệch cỡ chữ, chưa biết cách viết một câu hoàn chỉnh, hay bỏ dở bài viết chính tả tại lớp.",
          "Cần phối hợp chặt chẽ với phụ huynh để kèm đọc hiểu và luyện viết cho em mỗi tối."
        ]
      },
      "toan": {
        "high": [
          "Thực hiện thành thạo phép tính cộng, trừ, nhân, chia phạm vi 100 000; tính chu vi, diện tích hình chữ nhật, hình vuông tốt; tư duy logic sắc bén."
        ],
        "good": [
          "Thực hiện đúng các phép tính theo yêu cầu; thuộc các bảng nhân/chia đã học.",
          "Hiểu bài, tự hoàn thành các bài tập tại lớp; tuy nhiên tốc độ tính nhẩm cần đẩy nhanh hơn.",
          "Cần chú ý cẩn thận khi tính toán phần có nhớ và trình bày lời giải rõ ràng hơn."
        ],
        "pass": [
          "Kỹ năng tính toán còn chậm; hay tính sai phép nhân, chia; còn lúng túng khi phân tích đề bài toán có lời văn.",
          "Còn lúng túng khi phân tích đề bài toán có lời văn để tìm phép tính đúng.",
          "Em cần rèn luyện thêm các phép tính cơ bản và ôn tập kỹ bảng cửu chương."
        ],
        "fail": [
          "Chưa thực hiện được các phép tính cộng, trừ, nhân, chia cơ bản; không thuộc bảng cửu chương.",
          "Không tự làm được các bài tập hình học hoặc giải toán có lời văn đơn giản.",
          "Giáo viên sẽ bổ trợ kiến thức riêng tại lớp; đề nghị phụ huynh kiểm tra bài ở nhà cùng con."
        ]
      },
      "other": {
        "high": [
          "Tích cực tham gia các hoạt động; tiếp thu bài nhanh; có năng khiếu đặc thù (vẽ đẹp, hát đúng nhạc, thực hiện dứt khoát động tác thể dục, thao tác máy tính thành thạo)."
        ],
        "good": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đủ đồ dùng học tập; cần mạnh dạn hơn khi phát biểu xây dựng bài."
        ],
        "pass": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đủ đồ dùng học tập; cần mạnh dạn hơn khi phát biểu xây dựng bài."
        ],
        "fail": [
          "Còn thụ động trong giờ học; chưa hoàn thành sản phẩm hoặc các động tác bài tập theo yêu cầu. Biện pháp: Giáo viên chú ý động viên và nhắc nhở em tập trung tham gia cùng tập thể."
        ]
      },
      "tu nhien va xa hoi": {
        "high": [
          "Tích cực tham gia các hoạt động; tiếp thu bài nhanh; có năng khiếu đặc thù (vẽ đẹp, hát đúng nhạc, thực hiện dứt khoát động tác thể dục, thao tác máy tính thành thạo)."
        ],
        "good": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đủ đồ dùng học tập; cần mạnh dạn hơn khi phát biểu xây dựng bài."
        ],
        "pass": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đủ đồ dùng học tập; cần mạnh dạn hơn khi phát biểu xây dựng bài."
        ],
        "fail": [
          "Còn thụ động trong giờ học; chưa hoàn thành sản phẩm hoặc các động tác bài tập theo yêu cầu. Biện pháp: Giáo viên chú ý động viên và nhắc nhở em tập trung tham gia cùng tập thể."
        ]
      },
      "dao duc": {
        "high": [
          "Tích cực tham gia các hoạt động; tiếp thu bài nhanh; có năng khiếu đặc thù (vẽ đẹp, hát đúng nhạc, thực hiện dứt khoát động tác thể dục, thao tác máy tính thành thạo)."
        ],
        "good": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đủ đồ dùng học tập; cần mạnh dạn hơn khi phát biểu xây dựng bài."
        ],
        "pass": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đủ đồ dùng học tập; cần mạnh dạn hơn khi phát biểu xây dựng bài."
        ],
        "fail": [
          "Còn thụ động trong giờ học; chưa hoàn thành sản phẩm hoặc các động tác bài tập theo yêu cầu. Biện pháp: Giáo viên chú ý động viên và nhắc nhở em tập trung tham gia cùng tập thể."
        ]
      },
      "cong nghe": {
        "high": [
          "Tích cực tham gia các hoạt động; tiếp thu bài nhanh; có năng khiếu đặc thù (vẽ đẹp, hát đúng nhạc, thực hiện dứt khoát động tác thể dục, thao tác máy tính thành thạo)."
        ],
        "good": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đủ đồ dùng học tập; cần mạnh dạn hơn khi phát biểu xây dựng bài."
        ],
        "pass": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đủ đồ dùng học tập; cần mạnh dạn hơn khi phát biểu xây dựng bài."
        ],
        "fail": [
          "Còn thụ động trong giờ học; chưa hoàn thành sản phẩm hoặc các động tác bài tập theo yêu cầu. Biện pháp: Giáo viên chú ý động viên và nhắc nhở em tập trung tham gia cùng tập thể."
        ]
      },
      "tin hoc": {
        "high": [
          "Tích cực tham gia các hoạt động; tiếp thu bài nhanh; có năng khiếu đặc thù (vẽ đẹp, hát đúng nhạc, thực hiện dứt khoát động tác thể dục, thao tác máy tính thành thạo)."
        ],
        "good": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đủ đồ dùng học tập; cần mạnh dạn hơn khi phát biểu xây dựng bài."
        ],
        "pass": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đủ đồ dùng học tập; cần mạnh dạn hơn khi phát biểu xây dựng bài."
        ],
        "fail": [
          "Còn thụ động trong giờ học; chưa hoàn thành sản phẩm hoặc các động tác bài tập theo yêu cầu. Biện pháp: Giáo viên chú ý động viên và nhắc nhở em tập trung tham gia cùng tập thể."
        ]
      },
      "am nhac": {
        "high": [
          "Tích cực tham gia các hoạt động; tiếp thu bài nhanh; có năng khiếu đặc thù (vẽ đẹp, hát đúng nhạc, thực hiện dứt khoát động tác thể dục, thao tác máy tính thành thạo)."
        ],
        "good": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đủ đồ dùng học tập; cần mạnh dạn hơn khi phát biểu xây dựng bài."
        ],
        "pass": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đủ đồ dùng học tập; cần mạnh dạn hơn khi phát biểu xây dựng bài."
        ],
        "fail": [
          "Còn thụ động trong giờ học; chưa hoàn thành sản phẩm hoặc các động tác bài tập theo yêu cầu. Biện pháp: Giáo viên chú ý động viên và nhắc nhở em tập trung tham gia cùng tập thể."
        ]
      },
      "mi thuat": {
        "high": [
          "Tích cực tham gia các hoạt động; tiếp thu bài nhanh; có năng khiếu đặc thù (vẽ đẹp, hát đúng nhạc, thực hiện dứt khoát động tác thể dục, thao tác máy tính thành thạo)."
        ],
        "good": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đủ đồ dùng học tập; cần mạnh dạn hơn khi phát biểu xây dựng bài."
        ],
        "pass": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đủ đồ dùng học tập; cần mạnh dạn hơn khi phát biểu xây dựng bài."
        ],
        "fail": [
          "Còn thụ động trong giờ học; chưa hoàn thành sản phẩm hoặc các động tác bài tập theo yêu cầu. Biện pháp: Giáo viên chú ý động viên và nhắc nhở em tập trung tham gia cùng tập thể."
        ]
      },
      "giao duc the chat": {
        "high": [
          "Tích cực tham gia các hoạt động; tiếp thu bài nhanh; có năng khiếu đặc thù (vẽ đẹp, hát đúng nhạc, thực hiện dứt khoát động tác thể dục, thao tác máy tính thành thạo)."
        ],
        "good": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đủ đồ dùng học tập; cần mạnh dạn hơn khi phát biểu xây dựng bài."
        ],
        "pass": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đủ đồ dùng học tập; cần mạnh dạn hơn khi phát biểu xây dựng bài."
        ],
        "fail": [
          "Còn thụ động trong giờ học; chưa hoàn thành sản phẩm hoặc các động tác bài tập theo yêu cầu. Biện pháp: Giáo viên chú ý động viên và nhắc nhở em tập trung tham gia cùng tập thể."
        ]
      },
      "hoat dong trai nghiem": {
        "high": [
          "Tích cực tham gia các hoạt động; tiếp thu bài nhanh; có năng khiếu đặc thù (vẽ đẹp, hát đúng nhạc, thực hiện dứt khoát động tác thể dục, thao tác máy tính thành thạo)."
        ],
        "good": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đủ đồ dùng học tập; cần mạnh dạn hơn khi phát biểu xây dựng bài."
        ],
        "pass": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đủ đồ dùng học tập; cần mạnh dạn hơn khi phát biểu xây dựng bài."
        ],
        "fail": [
          "Còn thụ động trong giờ học; chưa hoàn thành sản phẩm hoặc các động tác bài tập theo yêu cầu. Biện pháp: Giáo viên chú ý động viên và nhắc nhở em tập trung tham gia cùng tập thể."
        ]
      },
      "tieng dan toc": {
        "high": [
          "Tích cực tham gia các hoạt động; tiếp thu bài nhanh; có năng khiếu đặc thù (vẽ đẹp, hát đúng nhạc, thực hiện dứt khoát động tác thể dục, thao tác máy tính thành thạo)."
        ],
        "good": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đủ đồ dùng học tập; cần mạnh dạn hơn khi phát biểu xây dựng bài."
        ],
        "pass": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đủ đồ dùng học tập; cần mạnh dạn hơn khi phát biểu xây dựng bài."
        ],
        "fail": [
          "Còn thụ động trong giờ học; chưa hoàn thành sản phẩm hoặc các động tác bài tập theo yêu cầu. Biện pháp: Giáo viên chú ý động viên và nhắc nhở em tập trung tham gia cùng tập thể."
        ]
      }
    },
    "qualities": {
      "yeu nuoc": {
        "high": [
          "Nghiêm túc khi chào cờ; có tình yêu thiên nhiên và ý thức bảo vệ cảnh quan trường lớp xanh - sạch - đẹp."
        ],
        "good": [
          "Nghiêm túc khi chào cờ; có tình yêu thiên nhiên và ý thức bảo vệ cảnh quan trường lớp xanh - sạch - đẹp."
        ],
        "fail": [
          "Cần nghiêm túc hơn trong giờ chào cờ và có ý thức giữ gìn vệ sinh cảnh quan trường lớp."
        ]
      },
      "nhan ai": {
        "high": [
          "Sẵn sàng chia sẻ, giúp đỡ bạn bè trong học tập; biết tôn trọng, lễ phép với thầy cô và người lớn tuổi."
        ],
        "good": [
          "Sẵn sàng chia sẻ, giúp đỡ bạn bè trong học tập; biết tôn trọng, lễ phép với thầy cô và người lớn tuổi."
        ],
        "fail": [
          "Cần biết chia sẻ, hòa đồng hơn với bạn bè và lễ phép với người lớn."
        ]
      },
      "cham chi": {
        "high": [
          "Đi học đúng giờ; chăm chú nghe giảng; luôn tự giác hoàn thành bài tập về nhà và tham gia tích cực việc trực nhật lớp."
        ],
        "good": [
          "Đi học đúng giờ; chăm chú nghe giảng; luôn tự giác hoàn thành bài tập về nhà và tham gia tích cực việc trực nhật lớp."
        ],
        "fail": [
          "Đôi lúc còn làm việc riêng trong giờ học; cần tự giác hoàn thành bài tập về nhà."
        ]
      },
      "trung thuc": {
        "high": [
          "Thật thà, ngay thẳng trong học tập và thi cử; biết nhận lỗi và sửa lỗi khi làm sai."
        ],
        "good": [
          "Thật thà, ngay thẳng trong học tập và thi cử; biết nhận lỗi và sửa lỗi khi làm sai."
        ],
        "fail": [
          "Cần trung thực, thẳng thắn nhận lỗi khi làm sai để tiến bộ hơn."
        ]
      },
      "trach nhiem": {
        "high": [
          "Thực hiện nghiêm túc nội quy trường lớp; có ý thức giữ gìn vệ sinh chung và bảo vệ của công."
        ],
        "good": [
          "Thực hiện nghiêm túc nội quy trường lớp; có ý thức giữ gìn vệ sinh chung và bảo vệ của công."
        ],
        "fail": [
          "Cần có ý thức trách nhiệm hơn trong việc giữ gìn vệ sinh chung và bảo vệ của công."
        ]
      }
    },
    "commonCompetencies": {
      "tu chu va tu hoc": {
        "high": [
          "Tự giác thực hiện nhiệm vụ học tập; tự chuẩn bị đầy đủ sách vở, đồ dùng học tập trước khi đến lớp."
        ],
        "good": [
          "Tự giác thực hiện nhiệm vụ học tập; tự chuẩn bị đầy đủ sách vở, đồ dùng học tập trước khi đến lớp."
        ],
        "fail": [
          "Đôi lúc còn lơ là, cần tập trung hơn và hạn chế làm việc riêng trong giờ học."
        ]
      },
      "giao tiep va hop tac": {
        "high": [
          "Biết lắng nghe bạn bè; mạnh dạn, tự tin khi chia sẻ ý kiến và phối hợp tốt khi làm việc nhóm."
        ],
        "good": [
          "Biết lắng nghe bạn bè; mạnh dạn, tự tin khi chia sẻ ý kiến và phối hợp tốt khi làm việc nhóm."
        ],
        "fail": [
          "Còn rụt rè khi giao tiếp; cần chủ động tương tác với các bạn trong các hoạt động tập thể."
        ]
      },
      "giai quyet van de va sang tao": {
        "high": [
          "Tiếp thu bài nhanh; biết dựa vào gợi ý để giải quyết các tình huống học tập; có nhiều ý tưởng sáng tạo."
        ],
        "good": [
          "Tiếp thu bài nhanh; biết dựa vào gợi ý để giải quyết các tình huống học tập; có nhiều ý tưởng sáng tạo."
        ],
        "fail": [
          "Còn thụ động, hay chờ đợi sự giúp đỡ; cần tự suy nghĩ trước khi hỏi cô hoặc bạn."
        ]
      }
    },
    "specificCompetencies": {
      "ngon ngu": {
        "high": [
          "Diễn đạt rõ ràng, mạch lạc; biết dùng từ phù hợp khi nói và viết; biết kể lại câu chuyện ngắn dựa theo tranh hoặc gợi ý."
        ],
        "good": [
          "Diễn đạt rõ ràng, mạch lạc; biết dùng từ phù hợp khi nói và viết; biết kể lại câu chuyện ngắn dựa theo tranh hoặc gợi ý."
        ],
        "fail": [
          "Diễn đạt câu từ còn lúng túng; cần rèn luyện thêm cách kể chuyện và dùng từ chính xác."
        ]
      },
      "tinh toan": {
        "high": [
          "Có tư duy số học tốt; nhận diện nhanh các hình khối, quy luật toán học và đơn vị đo lường cơ bản."
        ],
        "good": [
          "Có tư duy số học tốt; nhận diện nhanh các hình khối, quy luật toán học và đơn vị đo lường cơ bản."
        ],
        "fail": [
          "Khả năng tính toán và nhận diện hình học còn chậm; cần rèn luyện thêm kỹ năng tính nhẩm."
        ]
      },
      "khoa hoc": {
        "high": [
          "Có ý thức quan sát tốt; ham hiểu biết; nhận biết được các hiện tượng tự nhiên và cơ quan trong cơ thể người."
        ],
        "good": [
          "Có ý thức quan sát tốt; ham hiểu biết; nhận biết được các hiện tượng tự nhiên và cơ quan trong cơ thể người."
        ],
        "fail": [
          "Chưa tập trung quan sát; còn lúng túng khi giải thích các hiện tượng tự nhiên cơ bản."
        ]
      },
      "tin hoc": {
        "high": [
          "Bước đầu làm quen và thực hiện đúng các thao tác cơ bản trên máy tính; sử dụng an toàn các dụng cụ học tập."
        ],
        "good": [
          "Bước đầu làm quen và thực hiện đúng các thao tác cơ bản trên máy tính; sử dụng an toàn các dụng cụ học tập."
        ],
        "fail": [
          "Thao tác trên máy tính còn chậm; cần rèn luyện thêm để nắm vững các kỹ năng cơ bản."
        ]
      },
      "cong nghe": {
        "high": [
          "Sử dụng an toàn các dụng cụ thủ công; hoàn thành các sản phẩm kỹ thuật, thủ công đúng quy trình."
        ],
        "good": [
          "Sử dụng an toàn các dụng cụ thủ công; hoàn thành các sản phẩm kỹ thuật, thủ công đúng quy trình."
        ],
        "fail": [
          "Sử dụng dụng cụ thủ công còn chậm; sản phẩm hoàn thiện chưa đạt yêu cầu."
        ]
      },
      "tham mi": {
        "high": [
          "Có năng khiếu nghệ thuật; biết cảm nhận cái đẹp và thể hiện sáng tạo qua các sản phẩm âm nhạc, mĩ thuật."
        ],
        "good": [
          "Có năng khiếu nghệ thuật; biết cảm nhận cái đẹp và thể hiện sáng tạo qua các sản phẩm âm nhạc, mĩ thuật."
        ],
        "fail": [
          "Cần chú ý lắng nghe giai điệu và rèn luyện thêm kỹ năng tạo hình, vẽ tranh."
        ]
      },
      "the chat": {
        "high": [
          "Thực hiện đúng và dứt khoát các động tác bài tập thể dục; tích cực tham gia các trò chơi vận động."
        ],
        "good": [
          "Thực hiện đúng và dứt khoát các động tác bài tập thể dục; tích cực tham gia các trò chơi vận động."
        ],
        "fail": [
          "Thể lực còn hạn chế; cần tích cực rèn luyện thêm các động tác thể dục cơ bản."
        ]
      }
    }
  },
  "4": {
    "subjects": {
      "tieng viet": {
        "high": [
          "Lớp 4: Viết bài văn miêu tả (đồ vật, cây cối, con vật) mạch lạc, bố cục rõ ràng, câu văn giàu hình ảnh. Đọc trôi chảy và hiểu sâu nội dung cốt truyện.",
          "Nắm chắc kiến thức từ và câu (danh từ, động từ, tính từ, từ đồng nghĩa, trái nghĩa), chữ viết đẹp, đúng quy tắc chính tả."
        ],
        "good": [
          "Đọc diễn cảm tương đối tốt, trả lời đúng các câu hỏi đọc hiểu văn bản.",
          "Bài làm văn đủ ý, đúng bố cục 3 phần; tuy nhiên diễn đạt còn an toàn, chưa có nhiều phát hiện sáng tạo hoặc hình ảnh độc đáo.",
          "Nên chú ý lỗi lặp từ và rèn luyện thêm cách mở bài, kết bài mở rộng để bài văn hay hơn."
        ],
        "pass": [
          "Đọc thành tiếng đạt tốc độ yêu cầu nhưng chưa biết nhấn giọng, đọc diễn cảm.",
          "Bài tập làm văn còn ngắn, viết câu hay bị thiếu chủ ngữ hoặc vị ngữ; còn sai một số lỗi chính tả thông thường.",
          "Em cần đọc thêm nhiều sách, truyện để tích lũy vốn từ và chăm chỉ luyện viết đoạn văn tại nhà."
        ],
        "fail": [
          "Tốc độ đọc quá chậm, chưa hiểu nội dung bài đọc để trả lời câu hỏi trắc nghiệm/tự luận.",
          "Chưa biết cách bố cục một bài văn; câu văn rời rạc, viết sai nhiều lỗi chính tả.",
          "Cần sự phối hợp sát sao của phụ huynh để hướng dẫn em ôn lại cấu trúc câu và quy tắc chính tả mỗi tối."
        ]
      },
      "toan": {
        "high": [
          "Lớp 4: Thực hiện thành thạo các phép tính với số tự nhiên, phân số. Giải toán có lời văn tốt (tìm hai số khi biết tổng-tỉ, hiệu-tỉ, trung bình cộng).",
          "Tư duy logic tốt, có khả năng giải các bài toán nâng cao hoặc tìm ra nhiều cách giải cho một bài toán."
        ],
        "good": [
          "Thực hiện đúng các thuật tính cơ bản theo yêu cầu của chương trình học.",
          "Hiểu và áp dụng đúng công thức tính toán hình học; tự giải được các bài toán có lời văn từ 2-3 bước tính.",
          "Cần tính toán cẩn thận hơn ở các bước trung gian (như quy đồng mẫu số hoặc nhân chia số thập phân) để tránh sai sót đáng tiếc."
        ],
        "pass": [
          "Kỹ năng tính toán còn chậm; hay tính sai khi thực hiện phép chia phân số hoặc số tự nhiên.",
          "Còn lúng túng khi nhận diện đề bài toán có lời văn phức tạp, thường tính sai đơn vị đo lượng.",
          "Em cần chăm chỉ làm bài tập về nhà, học thuộc các công thức toán hình và bảng đơn vị đo."
        ],
        "fail": [
          "Chưa nắm được các quy tắc tính toán cơ bản (phân số, số thập phân); không thuộc công thức tính hình học.",
          "Không tự tóm tắt và giải được bài toán có lời văn đơn giản.",
          "Giáo viên sẽ kèm cặp riêng tại lớp; đề nghị phụ huynh kiểm tra và cùng con ôn tập lại kiến thức nền tảng."
        ]
      },
      "lich su va dia li": {
        "high": [
          "Nắm chắc các sự kiện lịch sử; sử dụng thành thạo bản đồ, lược đồ địa lí.",
          "Trình bày lưu loát về các vị anh hùng dân tộc và đặc điểm tự nhiên các vùng miền.",
          "Có tư duy phản biện tốt; biết liên hệ kiến thức lịch sử với thực tế cuộc sống.",
          "Nhớ tốt mốc thời gian lịch sử; xác định chính xác các vị trí địa lí trên bản đồ.",
          "Hiểu sâu sắc về truyền thống văn hóa và địa lí Việt Nam; có ý thức hướng về cội nguồn."
        ],
        "good": [
          "Kể được tên các sự kiện lịch sử lớn; biết chỉ bản đồ ở mức cơ bản.",
          "Hiểu nội dung bài học; cần mạnh dạn hơn khi tham gia thảo luận nhóm.",
          "Xác định được các vùng địa lí trên lược đồ nhưng tốc độ còn hơi chậm.",
          "Nắm được nội dung cốt lõi của bài học; cần chú ý phân biệt các mốc lịch sử dễ nhầm lẫn.",
          "Em nên đọc thêm sách lịch sử để ghi nhớ sâu hơn các chi tiết sự kiện."
        ],
        "pass": [
          "Kể được tên các sự kiện lịch sử lớn; biết chỉ bản đồ ở mức cơ bản.",
          "Hiểu nội dung bài học; cần mạnh dạn hơn khi tham gia thảo luận nhóm.",
          "Xác định được các vùng địa lí trên lược đồ nhưng tốc độ còn hơi chậm.",
          "Nắm được nội dung cốt lõi của bài học; cần chú ý phân biệt các mốc lịch sử dễ nhầm lẫn.",
          "Em nên đọc thêm sách lịch sử để ghi nhớ sâu hơn các chi tiết sự kiện."
        ],
        "fail": [
          "Chưa nhớ các sự kiện lịch sử trọng tâm; chưa biết cách đọc bản đồ, lược đồ.",
          "Còn lúng túng khi trả lời câu hỏi lịch sử; hay nhầm lẫn các giai đoạn phát triển.",
          "Em cần tập trung nghe giảng và tập thói quen quan sát lược đồ nhiều hơn."
        ]
      },
      "khoa hoc": {
        "high": [
          "Ham học hỏi; có kỹ năng quan sát và làm thí nghiệm khoa học chính xác.",
          "Giải thích mạch lạc các hiện tượng tự nhiên và sự chuyển hóa của các chất.",
          "Nắm vững kiến thức về cơ thể người; có ý thức giữ gìn vệ sinh và phòng bệnh xuất sắc.",
          "Tư duy khoa học tốt; tích cực đề xuất các giải pháp bảo vệ môi trường nguồn nước, không khí.",
          "Tiếp thu bài rất nhanh; luôn hoàn thành xuất sắc các phiếu bài tập thực hành."
        ],
        "good": [
          "Hiểu các kiến thức khoa học cơ bản; biết áp dụng vào việc chăm sóc sức khỏe bản thân.",
          "Hoàn thành tốt các thí nghiệm dưới sự hướng dẫn của giáo viên và các bạn.",
          "Nắm được quy trình vòng đời của sinh vật; cần chú ý trình bày bài làm rõ ràng hơn.",
          "Có ý thức bảo vệ môi trường; cần tích cực giơ tay phát biểu xây dựng bài.",
          "Em cần cẩn thận hơn khi làm các bài tập trắc nghiệm phân tích hiện tượng."
        ],
        "pass": [
          "Hiểu các kiến thức khoa học cơ bản; biết áp dụng vào việc chăm sóc sức khỏe bản thân.",
          "Hoàn thành tốt các thí nghiệm dưới sự hướng dẫn của giáo viên và các bạn.",
          "Nắm được quy trình vòng đời của sinh vật; cần chú ý trình bày bài làm rõ ràng hơn.",
          "Có ý thức bảo vệ môi trường; cần tích cực giơ tay phát biểu xây dựng bài.",
          "Em cần cẩn thận hơn khi làm các bài tập trắc nghiệm phân tích hiện tượng."
        ],
        "fail": [
          "Chưa nắm được các kiến thức khoa học cốt lõi; còn thụ động trong giờ thực hành.",
          "Chưa giải thích được các hiện tượng tự nhiên đơn giản theo bài học.",
          "Em cần chú ý lắng nghe cô hướng dẫn quy trình làm thí nghiệm tại lớp."
        ]
      },
      "cong nghe": {
        "high": [
          "Khéo tay; lắp ráp các mô hình kỹ thuật nhanh, đúng quy trình và chắc chắn.",
          "Có tư duy sáng tạo cao; sản phẩm thủ công/công nghệ có thẩm mỹ tốt.",
          "Sử dụng thành thạo và an toàn các dụng cụ học tập môn Công nghệ.",
          "Nắm vững quy trình trồng, chăm sóc hoa và cây cảnh trong nhà trường.",
          "Hiểu tốt về các sản phẩm công nghệ trong gia đình; có ý thức tiết kiệm điện, năng lượng."
        ],
        "good": [
          "Lắp ráp được các mô hình theo mẫu; sản phẩm hoàn thiện ở mức khá.",
          "Có ý thức chuẩn bị đầy đủ vật liệu, đồ dùng học tập trước giờ học.",
          "Nắm được các bước trồng cây; cần chú ý giữ gìn vệ sinh nơi thực hành sạch sẽ hơn.",
          "Hiểu về an toàn điện; cần tập trung hơn trong các giờ thực hành lắp ráp chi tiết nhỏ.",
          "Em nên rèn luyện thêm sự kiên nhẫn khi thực hiện các thao tác kỹ thuật khó."
        ],
        "pass": [
          "Lắp ráp được các mô hình theo mẫu; sản phẩm hoàn thiện ở mức khá.",
          "Có ý thức chuẩn bị đầy đủ vật liệu, đồ dùng học tập trước giờ học.",
          "Nắm được các bước trồng cây; cần chú ý giữ gìn vệ sinh nơi thực hành sạch sẽ hơn.",
          "Hiểu về an toàn điện; cần tập trung hơn trong các giờ thực hành lắp ráp chi tiết nhỏ.",
          "Em nên rèn luyện thêm sự kiên nhẫn khi thực hiện các thao tác kỹ thuật khó."
        ],
        "fail": [
          "Chưa hoàn thiện được mô hình lắp ráp; lúng túng khi sử dụng các dụng cụ thủ công.",
          "Sản phẩm công nghệ làm ra chưa đúng kích thước hoặc chưa hoàn chỉnh theo yêu cầu.",
          "Em cần chú ý theo dõi các bước làm mẫu của giáo viên trên bảng."
        ]
      },
      "tin hoc": {
        "high": [
          "Thao tác chuột và bàn phím thành thạo; sử dụng tốt các phần mềm học tập.",
          "Tư duy thuật toán tốt; tự thiết kế được các chương trình kéo thả sáng tạo.",
          "Kỹ năng soạn thảo văn bản và thiết kế bài trình chiếu xuất sắc, thẩm mỹ.",
          "Biết cách tìm kiếm, lựa chọn và lưu trữ thông tin an toàn trên Internet.",
          "Tiếp thu bài nhanh; luôn chủ động hỗ trợ, hướng dẫn các bạn khi thực hành."
        ],
        "good": [
          "Thực hiện đúng các bước khởi động, tắt máy và mở các phần mềm cơ bản.",
          "Gõ được văn bản tiếng Việt ngắn; biết chỉnh sửa font chữ ở mức đơn giản.",
          "Lắp ráp được các khối lệnh theo mẫu hướng dẫn của giáo viên.",
          "Có ý thức bảo quản thiết bị phòng máy; cần tăng tốc độ gõ phím hơn.",
          "Em nên cẩn thận hơn khi lưu tệp tin vào đúng thư mục yêu cầu."
        ],
        "pass": [
          "Thực hiện đúng các bước khởi động, tắt máy và mở các phần mềm cơ bản.",
          "Gõ được văn bản tiếng Việt ngắn; biết chỉnh sửa font chữ ở mức đơn giản.",
          "Lắp ráp được các khối lệnh theo mẫu hướng dẫn của giáo viên.",
          "Có ý thức bảo quản thiết bị phòng máy; cần tăng tốc độ gõ phím hơn.",
          "Em nên cẩn thận hơn khi lưu tệp tin vào đúng thư mục yêu cầu."
        ],
        "fail": [
          "Thao tác máy tính còn lúng túng; chưa nhớ vị trí các phím chức năng.",
          "Chưa tự hoàn thiện được bài thực hành soạn thảo hoặc lập trình theo mẫu.",
          "Em cần tập trung nghe hướng dẫn và tăng cường thực hành gõ phím."
        ]
      },
      "tieng anh": {
        "high": [
          "Phát âm chuẩn; giao tiếp tự tin, lưu loát các chủ đề đã học.",
          "Khả năng nghe hiểu tốt; phản xạ nhanh khi tương tác bằng Tiếng Anh.",
          "Vốn từ vựng phong phú; nắm chắc cấu trúc ngữ pháp và viết đoạn văn tốt.",
          "Đọc hiểu văn bản nhanh; diễn đạt ý kiến cá nhân mạch lạc, trôi chảy.",
          "Tích cực tham gia các trò chơi ngôn ngữ và hoạt động đóng vai trước lớp."
        ],
        "good": [
          "Nghe và hiểu được các câu lệnh, đoạn hội thoại ngắn trong bài học.",
          "Trả lời được các câu hỏi giao tiếp cơ bản; đôi lúc phát âm còn thiếu đuôi (ending sounds).",
          "Viết được câu đúng ngữ pháp; cần mở rộng thêm vốn từ vựng theo chủ đề.",
          "Hiểu nội dung bài đọc; cần mạnh dạn, tự tin hơn khi nói trước đám đông.",
          "Em nên luyện nghe nhiều hơn tại nhà để cải thiện ngữ điệu."
        ],
        "pass": [
          "Nghe và hiểu được các câu lệnh, đoạn hội thoại ngắn trong bài học.",
          "Trả lời được các câu hỏi giao tiếp cơ bản; đôi lúc phát âm còn thiếu đuôi (ending sounds).",
          "Viết được câu đúng ngữ pháp; cần mở rộng thêm vốn từ vựng theo chủ đề.",
          "Hiểu nội dung bài đọc; cần mạnh dạn, tự tin hơn khi nói trước đám đông.",
          "Em nên luyện nghe nhiều hơn tại nhà để cải thiện ngữ điệu."
        ],
        "fail": [
          "Chưa thuộc các từ vựng cốt lõi; còn lúng túng khi viết câu tiếng Anh đơn giản.",
          "Khả năng nghe và phản xạ giao tiếp còn chậm; chưa tự tin tham gia hoạt động lớp.",
          "Giáo viên sẽ tăng cường gọi em tương tác; phụ huynh cần nhắc nhở con ôn từ vựng."
        ]
      },
      "giao duc the chat": {
        "high": [
          "Thực hiện đúng, đẹp và dứt khoát các động tác của bài thể dục phát triển chung.",
          "Tác phong nhanh nhẹn; hoàn thành tốt các bài tập rèn luyện tư thế và kỹ năng vận động.",
          "Có năng khiếu thể thao; thể lực tốt; tiếp thu nhanh các trò chơi vận động mới.",
          "Nghiêm túc thực hiện đúng các quy định đội hình đội ngũ và khẩu lệnh chỉ huy.",
          "Tích cực, nhiệt tình và có tinh thần đồng đội cao khi tham gia thi đấu nhóm."
        ],
        "good": [
          "Thực hiện tương đối đúng quy trình các động tác thể dục; thể lực đạt yêu cầu.",
          "Nắm được quy luật và tích cực tham gia vào các trò chơi vận động cùng bạn.",
          "Có ý thức nề nếp, ra vào lớp đúng giờ và chuẩn bị trang phục thể thao đúng quy định.",
          "Biết cách phối hợp với đồng đội trong các bài tập nhóm; cần chú ý biên độ động tác.",
          "Em cần tập trung chú ý lắng nghe và quan sát giáo viên làm mẫu kỹ hơn."
        ],
        "pass": [
          "Thực hiện tương đối đúng quy trình các động tác thể dục; thể lực đạt yêu cầu.",
          "Nắm được quy luật và tích cực tham gia vào các trò chơi vận động cùng bạn.",
          "Có ý thức nề nếp, ra vào lớp đúng giờ và chuẩn bị trang phục thể thao đúng quy định.",
          "Biết cách phối hợp với đồng đội trong các bài tập nhóm; cần chú ý biên độ động tác.",
          "Em cần tập trung chú ý lắng nghe và quan sát giáo viên làm mẫu kỹ hơn."
        ],
        "fail": [
          "Động tác tập còn hời hợt, chưa đúng kỹ thuật; thể lực còn yếu so với yêu cầu.",
          "Còn thụ động, chưa nghiêm túc hoặc hay mệt mỏi trong giờ tập luyện ngoài trời.",
          "Giáo viên sẽ hướng dẫn riêng từng động tác; em cần tự giác tập luyện thêm."
        ]
      },
      "other": {
        "high": [
          "Tích cực tham gia các hoạt động; tiếp thu bài nhanh; hoàn thành tốt các sản phẩm học tập và nhiệm vụ môn học."
        ],
        "good": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đầy đủ đồ dùng học tập; cần tự tin hơn khi trình bày."
        ],
        "pass": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đầy đủ đồ dùng học tập; cần tự tin hơn khi trình bày."
        ],
        "fail": [
          "Còn thụ động trong giờ học; chưa hoàn thiện sản phẩm hoặc nhiệm vụ học tập theo yêu cầu; cần cố gắng rèn luyện thêm."
        ]
      },
      "dao duc": {
        "high": [
          "Tích cực tham gia các hoạt động; tiếp thu bài nhanh; hoàn thành tốt các sản phẩm học tập và nhiệm vụ môn học."
        ],
        "good": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đầy đủ đồ dùng học tập; cần tự tin hơn khi trình bày."
        ],
        "pass": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đầy đủ đồ dùng học tập; cần tự tin hơn khi trình bày."
        ],
        "fail": [
          "Còn thụ động trong giờ học; chưa hoàn thiện sản phẩm hoặc nhiệm vụ học tập theo yêu cầu; cần cố gắng rèn luyện thêm."
        ]
      },
      "tu nhien va xa hoi": {
        "high": [
          "Tích cực tham gia các hoạt động; tiếp thu bài nhanh; hoàn thành tốt các sản phẩm học tập và nhiệm vụ môn học."
        ],
        "good": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đầy đủ đồ dùng học tập; cần tự tin hơn khi trình bày."
        ],
        "pass": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đầy đủ đồ dùng học tập; cần tự tin hơn khi trình bày."
        ],
        "fail": [
          "Còn thụ động trong giờ học; chưa hoàn thiện sản phẩm hoặc nhiệm vụ học tập theo yêu cầu; cần cố gắng rèn luyện thêm."
        ]
      },
      "am nhac": {
        "high": [
          "Tích cực tham gia các hoạt động; tiếp thu bài nhanh; hoàn thành tốt các sản phẩm học tập và nhiệm vụ môn học."
        ],
        "good": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đầy đủ đồ dùng học tập; cần tự tin hơn khi trình bày."
        ],
        "pass": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đầy đủ đồ dùng học tập; cần tự tin hơn khi trình bày."
        ],
        "fail": [
          "Còn thụ động trong giờ học; chưa hoàn thiện sản phẩm hoặc nhiệm vụ học tập theo yêu cầu; cần cố gắng rèn luyện thêm."
        ]
      },
      "mi thuat": {
        "high": [
          "Tích cực tham gia các hoạt động; tiếp thu bài nhanh; hoàn thành tốt các sản phẩm học tập và nhiệm vụ môn học."
        ],
        "good": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đầy đủ đồ dùng học tập; cần tự tin hơn khi trình bày."
        ],
        "pass": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đầy đủ đồ dùng học tập; cần tự tin hơn khi trình bày."
        ],
        "fail": [
          "Còn thụ động trong giờ học; chưa hoàn thiện sản phẩm hoặc nhiệm vụ học tập theo yêu cầu; cần cố gắng rèn luyện thêm."
        ]
      },
      "hoat dong trai nghiem": {
        "high": [
          "Tích cực tham gia các hoạt động; tiếp thu bài nhanh; hoàn thành tốt các sản phẩm học tập và nhiệm vụ môn học."
        ],
        "good": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đầy đủ đồ dùng học tập; cần tự tin hơn khi trình bày."
        ],
        "pass": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đầy đủ đồ dùng học tập; cần tự tin hơn khi trình bày."
        ],
        "fail": [
          "Còn thụ động trong giờ học; chưa hoàn thiện sản phẩm hoặc nhiệm vụ học tập theo yêu cầu; cần cố gắng rèn luyện thêm."
        ]
      },
      "tieng dan toc": {
        "high": [
          "Tích cực tham gia các hoạt động; tiếp thu bài nhanh; hoàn thành tốt các sản phẩm học tập và nhiệm vụ môn học."
        ],
        "good": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đầy đủ đồ dùng học tập; cần tự tin hơn khi trình bày."
        ],
        "pass": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đầy đủ đồ dùng học tập; cần tự tin hơn khi trình bày."
        ],
        "fail": [
          "Còn thụ động trong giờ học; chưa hoàn thiện sản phẩm hoặc nhiệm vụ học tập theo yêu cầu; cần cố gắng rèn luyện thêm."
        ]
      }
    },
    "qualities": {
      "yeu nuoc": {
        "high": [
          "Có niềm tự hào về lịch sử, truyền thống quê hương; trân trọng và bảo vệ môi trường, có ý thức tiết kiệm điện, nước trong nhà trường."
        ],
        "good": [
          "Có niềm tự hào về lịch sử, truyền thống quê hương; trân trọng và bảo vệ môi trường, có ý thức tiết kiệm điện, nước trong nhà trường."
        ],
        "fail": [
          "Cần nâng cao ý thức giữ gìn vệ sinh môi trường và tiết kiệm điện, nước tại trường lớp."
        ]
      },
      "nhan ai": {
        "high": [
          "Luôn hòa đồng, biết cảm thông, chia sẻ và giúp đỡ các bạn có hoàn cảnh khó khăn; lễ phép, kính trọng thầy cô và người lớn tuổi."
        ],
        "good": [
          "Luôn hòa đồng, biết cảm thông, chia sẻ và giúp đỡ các bạn có hoàn cảnh khó khăn; lễ phép, kính trọng thầy cô và người lớn tuổi."
        ],
        "fail": [
          "Cần biết chia sẻ, đồng cảm và mở lòng giúp đỡ bạn bè xung quanh nhiều hơn."
        ]
      },
      "cham chi": {
        "high": [
          "Đi học chuyên cần; chủ động dọn dẹp vệ sinh trường lớp; luôn hoàn thành tốt các bài tập và nhiệm vụ trực nhật được giao."
        ],
        "good": [
          "Đi học chuyên cần; chủ động dọn dẹp vệ sinh trường lớp; luôn hoàn thành tốt các bài tập và nhiệm vụ trực nhật được giao."
        ],
        "fail": [
          "Đôi lúc còn làm việc riêng trong giờ học; cần nâng cao tính chuyên cần và hoàn thành đầy đủ bài tập."
        ]
      },
      "trung thuc": {
        "high": [
          "Ngay thẳng, tôn trọng sự thật; tuyệt đối nghiêm túc không gian lận trong kiểm tra, thi cử; biết bảo vệ lẽ phải."
        ],
        "good": [
          "Ngay thẳng, tôn trọng sự thật; tuyệt đối nghiêm túc không gian lận trong kiểm tra, thi cử; biết bảo vệ lẽ phải."
        ],
        "fail": [
          "Cần nghiêm túc, trung thực trong học tập và kiểm tra, dũng cảm nhận khuyết điểm khi làm sai."
        ]
      },
      "trach nhiem": {
        "high": [
          "Có ý thức trách nhiệm cao với tập thể; nghiêm túc chấp hành nội quy trường lớp và luật giao thông; biết tự chịu trách nhiệm về hành vi của mình."
        ],
        "good": [
          "Có ý thức trách nhiệm cao với tập thể; nghiêm túc chấp hành nội quy trường lớp và luật giao thông; biết tự chịu trách nhiệm về hành vi của mình."
        ],
        "fail": [
          "Cần có ý thức trách nhiệm hơn với nhiệm vụ được giao và nghiêm túc chấp hành nội quy chung."
        ]
      }
    },
    "commonCompetencies": {
      "tu chu va tu hoc": {
        "high": [
          "Có thói quen tự học tốt; biết lập kế hoạch học tập cá nhân; tự giác tìm kiếm tài liệu để hoàn thành dự án nhỏ."
        ],
        "good": [
          "Có thói quen tự học tốt; biết lập kế hoạch học tập cá nhân; tự giác tìm kiếm tài liệu để hoàn thành dự án nhỏ."
        ],
        "fail": [
          "Chưa có ý thức tự giác cao, còn để nhắc nhở nhiều; cần chủ động làm bài tập mà không đợi thầy cô hay cha mẹ giục."
        ]
      },
      "giao tiep va hop tac": {
        "high": [
          "Tự tin bày tỏ quan điểm trước đám đông; có khả năng dẫn dắt, điều hành nhóm thảo luận hiệu quả và biết tôn trọng ý kiến người khác."
        ],
        "good": [
          "Tự tin bày tỏ quan điểm trước đám đông; có khả năng dẫn dắt, điều hành nhóm thảo luận hiệu quả và biết tôn trọng ý kiến người khác."
        ],
        "fail": [
          "Chưa biết cách phối hợp với các bạn khi làm việc nhóm; còn bảo thủ hoặc quá rụt rè khi tranh luận."
        ]
      },
      "giai quyet van de va sang tao": {
        "high": [
          "Tiếp thu bài nhanh; biết phân tích vấn đề và đề xuất các giải pháp xử lý tình huống thông minh, sáng tạo."
        ],
        "good": [
          "Tiếp thu bài nhanh; biết phân tích vấn đề và đề xuất các giải pháp xử lý tình huống thông minh, sáng tạo."
        ],
        "fail": [
          "Thói quen tư duy còn thụ động; gặp bài tập đòi hỏi lập luận logic nâng cao là dễ nản lòng."
        ]
      }
    },
    "specificCompetencies": {
      "ngon ngu": {
        "high": [
          "Khả năng thuyết trình mạch lạc; viết văn có cảm xúc cá nhân sâu sắc; sử dụng từ ngữ chính xác, giàu tính biểu cảm."
        ],
        "good": [
          "Khả năng thuyết trình mạch lạc; viết văn có cảm xúc cá nhân sâu sắc; sử dụng từ ngữ chính xác, giàu tính biểu cảm."
        ],
        "fail": [
          "Kỹ năng thuyết trình và diễn đạt còn hạn chế; cần rèn luyện thêm sự tự tin khi nói trước đám đông."
        ]
      },
      "tinh toan": {
        "high": [
          "Sử dụng thành thạo các công cụ toán học; có tư duy phân tích số liệu, biểu đồ tốt; nhạy bén với các con số."
        ],
        "good": [
          "Sử dụng thành thạo các công cụ toán học; có tư duy phân tích số liệu, biểu đồ tốt; nhạy bén với các con số."
        ],
        "fail": [
          "Tư duy phân tích số liệu và biểu đồ còn chậm; cần rèn luyện thêm kỹ năng tính toán và suy luận logic."
        ]
      },
      "khoa hoc": {
        "high": [
          "Biết thu thập thông tin, giải thích được các hiện tượng tự nhiên đơn giản; nắm rõ các sự kiện lịch sử và vị trí địa lý cơ bản của đất nước."
        ],
        "good": [
          "Biết thu thập thông tin, giải thích được các hiện tượng tự nhiên đơn giản; nắm rõ các sự kiện lịch sử và vị trí địa lý cơ bản của đất nước."
        ],
        "fail": [
          "Khả năng ghi nhớ và xâu chuỗi sự kiện còn yếu; cần chú ý đọc thêm tài liệu để củng cố kiến thức."
        ]
      },
      "tin hoc": {
        "high": [
          "Sử dụng tốt các phần mềm học tập, soạn thảo văn bản hoặc trình chiếu cơ bản; có ý thức bảo mật và sử dụng internet an toàn."
        ],
        "good": [
          "Sử dụng tốt các phần mềm học tập, soạn thảo văn bản hoặc trình chiếu cơ bản; có ý thức bảo mật và sử dụng internet an toàn."
        ],
        "fail": [
          "Thao tác trên phần mềm máy tính còn lúng túng; cần tăng cường thực hành để nâng cao kỹ năng tin học."
        ]
      },
      "cong nghe": {
        "high": [
          "Sử dụng thành thạo và an toàn các dụng cụ môn Công nghệ; có tư duy sáng tạo trong lắp ráp mô hình kỹ thuật."
        ],
        "good": [
          "Sử dụng thành thạo và an toàn các dụng cụ môn Công nghệ; có tư duy sáng tạo trong lắp ráp mô hình kỹ thuật."
        ],
        "fail": [
          "Thao tác kỹ thuật còn lúng túng; cần rèn luyện thêm sự khéo léo và kiên nhẫn."
        ]
      },
      "tham mi": {
        "high": [
          "Có năng khiếu nghệ thuật và khả năng cảm thụ cái đẹp tốt; biết sáng tạo các sản phẩm hội họa, âm nhạc ấn tượng."
        ],
        "good": [
          "Có năng khiếu nghệ thuật và khả năng cảm thụ cái đẹp tốt; biết sáng tạo các sản phẩm hội họa, âm nhạc ấn tượng."
        ],
        "fail": [
          "Cần chú ý quan sát và mạnh dạn thể hiện ý tưởng sáng tạo trong các hoạt động nghệ thuật."
        ]
      },
      "the chat": {
        "high": [
          "Thể lực tốt, tác phong nhanh nhẹn; hoàn thành xuất sắc các bài tập vận động và có tinh thần đồng đội cao."
        ],
        "good": [
          "Thể lực tốt, tác phong nhanh nhẹn; hoàn thành xuất sắc các bài tập vận động và có tinh thần đồng đội cao."
        ],
        "fail": [
          "Thể lực còn yếu; cần tích cực rèn luyện sức bền và sự dẻo dai trong các giờ giáo dục thể chất."
        ]
      }
    }
  },
  "5": {
    "subjects": {
      "tieng viet": {
        "high": [
          "Lớp 5: Kỹ năng viết văn miêu tả (người, phong cảnh) xuất sắc, biết dùng các biện pháp tu từ (so sánh, nhân hóa) sinh động. Sử dụng từ ngữ phong phú, viết đúng đoạn văn thể hiện tình cảm, cảm nghĩ.",
          "Nắm chắc kiến thức từ và câu (danh từ, động từ, tính từ, từ đồng nghĩa, trái nghĩa), chữ viết đẹp, đúng quy tắc chính tả."
        ],
        "good": [
          "Đọc diễn cảm tương đối tốt, trả lời đúng các câu hỏi đọc hiểu văn bản.",
          "Bài làm văn đủ ý, đúng bố cục 3 phần; tuy nhiên diễn đạt còn an toàn, chưa có nhiều phát hiện sáng tạo hoặc hình ảnh độc đáo.",
          "Nên chú ý lỗi lặp từ và rèn luyện thêm cách mở bài, kết bài mở rộng để bài văn hay hơn."
        ],
        "pass": [
          "Đọc thành tiếng đạt tốc độ yêu cầu nhưng chưa biết nhấn giọng, đọc diễn cảm.",
          "Bài tập làm văn còn ngắn, viết câu hay bị thiếu chủ ngữ hoặc vị ngữ; còn sai một số lỗi chính tả thông thường.",
          "Em cần đọc thêm nhiều sách, truyện để tích lũy vốn từ và chăm chỉ luyện viết đoạn văn tại nhà."
        ],
        "fail": [
          "Tốc độ đọc quá chậm, chưa hiểu nội dung bài đọc để trả lời câu hỏi trắc nghiệm/tự luận.",
          "Chưa biết cách bố cục một bài văn; câu văn rời rạc, viết sai nhiều lỗi chính tả.",
          "Cần sự phối hợp sát sao của phụ huynh để hướng dẫn em ôn lại cấu trúc câu và quy tắc chính tả mỗi tối."
        ]
      },
      "toan": {
        "high": [
          "Lớp 5: Nắm vững toán số thập phân, tỉ số phần trăm và các bài toán về chuyển động đều. Tính toán diện tích, thể tích các hình khối (hình hộp chữ nhật, hình lập phương) chính xác.",
          "Tư duy logic tốt, có khả năng giải các bài toán nâng cao hoặc tìm ra nhiều cách giải cho một bài toán."
        ],
        "good": [
          "Thực hiện đúng các thuật tính cơ bản theo yêu cầu của chương trình học.",
          "Hiểu và áp dụng đúng công thức tính toán hình học; tự giải được các bài toán có lời văn từ 2-3 bước tính.",
          "Cần tính toán cẩn thận hơn ở các bước trung gian (như quy đồng mẫu số hoặc nhân chia số thập phân) để tránh sai sót đáng tiếc."
        ],
        "pass": [
          "Kỹ năng tính toán còn chậm; hay nhầm lẫn vị trí dấu phẩy của số thập phân.",
          "Còn lúng túng khi nhận diện đề bài toán có lời văn phức tạp, thường tính sai đơn vị đo lượng.",
          "Em cần chăm chỉ làm bài tập về nhà, học thuộc các công thức toán hình và bảng đơn vị đo."
        ],
        "fail": [
          "Chưa nắm được các quy tắc tính toán cơ bản (phân số, số thập phân); không thuộc công thức tính hình học.",
          "Không tự tóm tắt và giải được bài toán có lời văn đơn giản.",
          "Giáo viên sẽ kèm cặp riêng tại lớp; đề nghị phụ huynh kiểm tra và cùng con ôn tập lại kiến thức nền tảng."
        ]
      },
      "lich su va dia li": {
        "high": [
          "Nắm chắc các sự kiện lịch sử; sử dụng thành thạo bản đồ, lược đồ địa lí.",
          "Trình bày lưu loát về các vị anh hùng dân tộc và đặc điểm tự nhiên các vùng miền.",
          "Có tư duy phản biện tốt; biết liên hệ kiến thức lịch sử với thực tế cuộc sống.",
          "Nhớ tốt mốc thời gian lịch sử; xác định chính xác các vị trí địa lí trên bản đồ.",
          "Hiểu sâu sắc về truyền thống văn hóa và địa lí Việt Nam; có ý thức hướng về cội nguồn."
        ],
        "good": [
          "Kể được tên các sự kiện lịch sử lớn; biết chỉ bản đồ ở mức cơ bản.",
          "Hiểu nội dung bài học; cần mạnh dạn hơn khi tham gia thảo luận nhóm.",
          "Xác định được các vùng địa lí trên lược đồ nhưng tốc độ còn hơi chậm.",
          "Nắm được nội dung cốt lõi của bài học; cần chú ý phân biệt các mốc lịch sử dễ nhầm lẫn.",
          "Em nên đọc thêm sách lịch sử để ghi nhớ sâu hơn các chi tiết sự kiện."
        ],
        "pass": [
          "Kể được tên các sự kiện lịch sử lớn; biết chỉ bản đồ ở mức cơ bản.",
          "Hiểu nội dung bài học; cần mạnh dạn hơn khi tham gia thảo luận nhóm.",
          "Xác định được các vùng địa lí trên lược đồ nhưng tốc độ còn hơi chậm.",
          "Nắm được nội dung cốt lõi của bài học; cần chú ý phân biệt các mốc lịch sử dễ nhầm lẫn.",
          "Em nên đọc thêm sách lịch sử để ghi nhớ sâu hơn các chi tiết sự kiện."
        ],
        "fail": [
          "Chưa nhớ các sự kiện lịch sử trọng tâm; chưa biết cách đọc bản đồ, lược đồ.",
          "Còn lúng túng khi trả lời câu hỏi lịch sử; hay nhầm lẫn các giai đoạn phát triển.",
          "Em cần tập trung nghe giảng và tập thói quen quan sát lược đồ nhiều hơn."
        ]
      },
      "khoa hoc": {
        "high": [
          "Ham học hỏi; có kỹ năng quan sát và làm thí nghiệm khoa học chính xác.",
          "Giải thích mạch lạc các hiện tượng tự nhiên và sự chuyển hóa của các chất.",
          "Nắm vững kiến thức về cơ thể người; có ý thức giữ gìn vệ sinh và phòng bệnh xuất sắc.",
          "Tư duy khoa học tốt; tích cực đề xuất các giải pháp bảo vệ môi trường nguồn nước, không khí.",
          "Tiếp thu bài rất nhanh; luôn hoàn thành xuất sắc các phiếu bài tập thực hành."
        ],
        "good": [
          "Hiểu các kiến thức khoa học cơ bản; biết áp dụng vào việc chăm sóc sức khỏe bản thân.",
          "Hoàn thành tốt các thí nghiệm dưới sự hướng dẫn của giáo viên và các bạn.",
          "Nắm được quy trình vòng đời của sinh vật; cần chú ý trình bày bài làm rõ ràng hơn.",
          "Có ý thức bảo vệ môi trường; cần tích cực giơ tay phát biểu xây dựng bài.",
          "Em cần cẩn thận hơn khi làm các bài tập trắc nghiệm phân tích hiện tượng."
        ],
        "pass": [
          "Hiểu các kiến thức khoa học cơ bản; biết áp dụng vào việc chăm sóc sức khỏe bản thân.",
          "Hoàn thành tốt các thí nghiệm dưới sự hướng dẫn của giáo viên và các bạn.",
          "Nắm được quy trình vòng đời của sinh vật; cần chú ý trình bày bài làm rõ ràng hơn.",
          "Có ý thức bảo vệ môi trường; cần tích cực giơ tay phát biểu xây dựng bài.",
          "Em cần cẩn thận hơn khi làm các bài tập trắc nghiệm phân tích hiện tượng."
        ],
        "fail": [
          "Chưa nắm được các kiến thức khoa học cốt lõi; còn thụ động trong giờ thực hành.",
          "Chưa giải thích được các hiện tượng tự nhiên đơn giản theo bài học.",
          "Em cần chú ý lắng nghe cô hướng dẫn quy trình làm thí nghiệm tại lớp."
        ]
      },
      "cong nghe": {
        "high": [
          "Khéo tay; lắp ráp các mô hình kỹ thuật nhanh, đúng quy trình và chắc chắn.",
          "Có tư duy sáng tạo cao; sản phẩm thủ công/công nghệ có thẩm mỹ tốt.",
          "Sử dụng thành thạo và an toàn các dụng cụ học tập môn Công nghệ.",
          "Nắm vững quy trình trồng, chăm sóc hoa và cây cảnh trong nhà trường.",
          "Hiểu tốt về các sản phẩm công nghệ trong gia đình; có ý thức tiết kiệm điện, năng lượng."
        ],
        "good": [
          "Lắp ráp được các mô hình theo mẫu; sản phẩm hoàn thiện ở mức khá.",
          "Có ý thức chuẩn bị đầy đủ vật liệu, đồ dùng học tập trước giờ học.",
          "Nắm được các bước trồng cây; cần chú ý giữ gìn vệ sinh nơi thực hành sạch sẽ hơn.",
          "Hiểu về an toàn điện; cần tập trung hơn trong các giờ thực hành lắp ráp chi tiết nhỏ.",
          "Em nên rèn luyện thêm sự kiên nhẫn khi thực hiện các thao tác kỹ thuật khó."
        ],
        "pass": [
          "Lắp ráp được các mô hình theo mẫu; sản phẩm hoàn thiện ở mức khá.",
          "Có ý thức chuẩn bị đầy đủ vật liệu, đồ dùng học tập trước giờ học.",
          "Nắm được các bước trồng cây; cần chú ý giữ gìn vệ sinh nơi thực hành sạch sẽ hơn.",
          "Hiểu về an toàn điện; cần tập trung hơn trong các giờ thực hành lắp ráp chi tiết nhỏ.",
          "Em nên rèn luyện thêm sự kiên nhẫn khi thực hiện các thao tác kỹ thuật khó."
        ],
        "fail": [
          "Chưa hoàn thiện được mô hình lắp ráp; lúng túng khi sử dụng các dụng cụ thủ công.",
          "Sản phẩm công nghệ làm ra chưa đúng kích thước hoặc chưa hoàn chỉnh theo yêu cầu.",
          "Em cần chú ý theo dõi các bước làm mẫu của giáo viên trên bảng."
        ]
      },
      "tin hoc": {
        "high": [
          "Thao tác chuột và bàn phím thành thạo; sử dụng tốt các phần mềm học tập.",
          "Tư duy thuật toán tốt; tự thiết kế được các chương trình kéo thả sáng tạo.",
          "Kỹ năng soạn thảo văn bản và thiết kế bài trình chiếu xuất sắc, thẩm mỹ.",
          "Biết cách tìm kiếm, lựa chọn và lưu trữ thông tin an toàn trên Internet.",
          "Tiếp thu bài nhanh; luôn chủ động hỗ trợ, hướng dẫn các bạn khi thực hành."
        ],
        "good": [
          "Thực hiện đúng các bước khởi động, tắt máy và mở các phần mềm cơ bản.",
          "Gõ được văn bản tiếng Việt ngắn; biết chỉnh sửa font chữ ở mức đơn giản.",
          "Lắp ráp được các khối lệnh theo mẫu hướng dẫn của giáo viên.",
          "Có ý thức bảo quản thiết bị phòng máy; cần tăng tốc độ gõ phím hơn.",
          "Em nên cẩn thận hơn khi lưu tệp tin vào đúng thư mục yêu cầu."
        ],
        "pass": [
          "Thực hiện đúng các bước khởi động, tắt máy và mở các phần mềm cơ bản.",
          "Gõ được văn bản tiếng Việt ngắn; biết chỉnh sửa font chữ ở mức đơn giản.",
          "Lắp ráp được các khối lệnh theo mẫu hướng dẫn của giáo viên.",
          "Có ý thức bảo quản thiết bị phòng máy; cần tăng tốc độ gõ phím hơn.",
          "Em nên cẩn thận hơn khi lưu tệp tin vào đúng thư mục yêu cầu."
        ],
        "fail": [
          "Thao tác máy tính còn lúng túng; chưa nhớ vị trí các phím chức năng.",
          "Chưa tự hoàn thiện được bài thực hành soạn thảo hoặc lập trình theo mẫu.",
          "Em cần tập trung nghe hướng dẫn và tăng cường thực hành gõ phím."
        ]
      },
      "tieng anh": {
        "high": [
          "Phát âm chuẩn; giao tiếp tự tin, lưu loát các chủ đề đã học.",
          "Khả năng nghe hiểu tốt; phản xạ nhanh khi tương tác bằng Tiếng Anh.",
          "Vốn từ vựng phong phú; nắm chắc cấu trúc ngữ pháp và viết đoạn văn tốt.",
          "Đọc hiểu văn bản nhanh; diễn đạt ý kiến cá nhân mạch lạc, trôi chảy.",
          "Tích cực tham gia các trò chơi ngôn ngữ và hoạt động đóng vai trước lớp."
        ],
        "good": [
          "Nghe và hiểu được các câu lệnh, đoạn hội thoại ngắn trong bài học.",
          "Trả lời được các câu hỏi giao tiếp cơ bản; đôi lúc phát âm còn thiếu đuôi (ending sounds).",
          "Viết được câu đúng ngữ pháp; cần mở rộng thêm vốn từ vựng theo chủ đề.",
          "Hiểu nội dung bài đọc; cần mạnh dạn, tự tin hơn khi nói trước đám đông.",
          "Em nên luyện nghe nhiều hơn tại nhà để cải thiện ngữ điệu."
        ],
        "pass": [
          "Nghe và hiểu được các câu lệnh, đoạn hội thoại ngắn trong bài học.",
          "Trả lời được các câu hỏi giao tiếp cơ bản; đôi lúc phát âm còn thiếu đuôi (ending sounds).",
          "Viết được câu đúng ngữ pháp; cần mở rộng thêm vốn từ vựng theo chủ đề.",
          "Hiểu nội dung bài đọc; cần mạnh dạn, tự tin hơn khi nói trước đám đông.",
          "Em nên luyện nghe nhiều hơn tại nhà để cải thiện ngữ điệu."
        ],
        "fail": [
          "Chưa thuộc các từ vựng cốt lõi; còn lúng túng khi viết câu tiếng Anh đơn giản.",
          "Khả năng nghe và phản xạ giao tiếp còn chậm; chưa tự tin tham gia hoạt động lớp.",
          "Giáo viên sẽ tăng cường gọi em tương tác; phụ huynh cần nhắc nhở con ôn từ vựng."
        ]
      },
      "giao duc the chat": {
        "high": [
          "Thực hiện đúng, đẹp và dứt khoát các động tác của bài thể dục phát triển chung.",
          "Tác phong nhanh nhẹn; hoàn thành tốt các bài tập rèn luyện tư thế và kỹ năng vận động.",
          "Có năng khiếu thể thao; thể lực tốt; tiếp thu nhanh các trò chơi vận động mới.",
          "Nghiêm túc thực hiện đúng các quy định đội hình đội ngũ và khẩu lệnh chỉ huy.",
          "Tích cực, nhiệt tình và có tinh thần đồng đội cao khi tham gia thi đấu nhóm."
        ],
        "good": [
          "Thực hiện tương đối đúng quy trình các động tác thể dục; thể lực đạt yêu cầu.",
          "Nắm được quy luật và tích cực tham gia vào các trò chơi vận động cùng bạn.",
          "Có ý thức nề nếp, ra vào lớp đúng giờ và chuẩn bị trang phục thể thao đúng quy định.",
          "Biết cách phối hợp với đồng đội trong các bài tập nhóm; cần chú ý biên độ động tác.",
          "Em cần tập trung chú ý lắng nghe và quan sát giáo viên làm mẫu kỹ hơn."
        ],
        "pass": [
          "Thực hiện tương đối đúng quy trình các động tác thể dục; thể lực đạt yêu cầu.",
          "Nắm được quy luật và tích cực tham gia vào các trò chơi vận động cùng bạn.",
          "Có ý thức nề nếp, ra vào lớp đúng giờ và chuẩn bị trang phục thể thao đúng quy định.",
          "Biết cách phối hợp với đồng đội trong các bài tập nhóm; cần chú ý biên độ động tác.",
          "Em cần tập trung chú ý lắng nghe và quan sát giáo viên làm mẫu kỹ hơn."
        ],
        "fail": [
          "Động tác tập còn hời hợt, chưa đúng kỹ thuật; thể lực còn yếu so với yêu cầu.",
          "Còn thụ động, chưa nghiêm túc hoặc hay mệt mỏi trong giờ tập luyện ngoài trời.",
          "Giáo viên sẽ hướng dẫn riêng từng động tác; em cần tự giác tập luyện thêm."
        ]
      },
      "other": {
        "high": [
          "Tích cực tham gia các hoạt động; tiếp thu bài nhanh; hoàn thành tốt các sản phẩm học tập và nhiệm vụ môn học."
        ],
        "good": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đầy đủ đồ dùng học tập; cần tự tin hơn khi trình bày."
        ],
        "pass": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đầy đủ đồ dùng học tập; cần tự tin hơn khi trình bày."
        ],
        "fail": [
          "Còn thụ động trong giờ học; chưa hoàn thiện sản phẩm hoặc nhiệm vụ học tập theo yêu cầu; cần cố gắng rèn luyện thêm."
        ]
      },
      "dao duc": {
        "high": [
          "Tích cực tham gia các hoạt động; tiếp thu bài nhanh; hoàn thành tốt các sản phẩm học tập và nhiệm vụ môn học."
        ],
        "good": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đầy đủ đồ dùng học tập; cần tự tin hơn khi trình bày."
        ],
        "pass": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đầy đủ đồ dùng học tập; cần tự tin hơn khi trình bày."
        ],
        "fail": [
          "Còn thụ động trong giờ học; chưa hoàn thiện sản phẩm hoặc nhiệm vụ học tập theo yêu cầu; cần cố gắng rèn luyện thêm."
        ]
      },
      "tu nhien va xa hoi": {
        "high": [
          "Tích cực tham gia các hoạt động; tiếp thu bài nhanh; hoàn thành tốt các sản phẩm học tập và nhiệm vụ môn học."
        ],
        "good": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đầy đủ đồ dùng học tập; cần tự tin hơn khi trình bày."
        ],
        "pass": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đầy đủ đồ dùng học tập; cần tự tin hơn khi trình bày."
        ],
        "fail": [
          "Còn thụ động trong giờ học; chưa hoàn thiện sản phẩm hoặc nhiệm vụ học tập theo yêu cầu; cần cố gắng rèn luyện thêm."
        ]
      },
      "am nhac": {
        "high": [
          "Tích cực tham gia các hoạt động; tiếp thu bài nhanh; hoàn thành tốt các sản phẩm học tập và nhiệm vụ môn học."
        ],
        "good": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đầy đủ đồ dùng học tập; cần tự tin hơn khi trình bày."
        ],
        "pass": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đầy đủ đồ dùng học tập; cần tự tin hơn khi trình bày."
        ],
        "fail": [
          "Còn thụ động trong giờ học; chưa hoàn thiện sản phẩm hoặc nhiệm vụ học tập theo yêu cầu; cần cố gắng rèn luyện thêm."
        ]
      },
      "mi thuat": {
        "high": [
          "Tích cực tham gia các hoạt động; tiếp thu bài nhanh; hoàn thành tốt các sản phẩm học tập và nhiệm vụ môn học."
        ],
        "good": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đầy đủ đồ dùng học tập; cần tự tin hơn khi trình bày."
        ],
        "pass": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đầy đủ đồ dùng học tập; cần tự tin hơn khi trình bày."
        ],
        "fail": [
          "Còn thụ động trong giờ học; chưa hoàn thiện sản phẩm hoặc nhiệm vụ học tập theo yêu cầu; cần cố gắng rèn luyện thêm."
        ]
      },
      "hoat dong trai nghiem": {
        "high": [
          "Tích cực tham gia các hoạt động; tiếp thu bài nhanh; hoàn thành tốt các sản phẩm học tập và nhiệm vụ môn học."
        ],
        "good": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đầy đủ đồ dùng học tập; cần tự tin hơn khi trình bày."
        ],
        "pass": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đầy đủ đồ dùng học tập; cần tự tin hơn khi trình bày."
        ],
        "fail": [
          "Còn thụ động trong giờ học; chưa hoàn thiện sản phẩm hoặc nhiệm vụ học tập theo yêu cầu; cần cố gắng rèn luyện thêm."
        ]
      },
      "tieng dan toc": {
        "high": [
          "Tích cực tham gia các hoạt động; tiếp thu bài nhanh; hoàn thành tốt các sản phẩm học tập và nhiệm vụ môn học."
        ],
        "good": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đầy đủ đồ dùng học tập; cần tự tin hơn khi trình bày."
        ],
        "pass": [
          "Hoàn thành các yêu cầu cốt lõi của bài học; có ý thức chuẩn bị đầy đủ đồ dùng học tập; cần tự tin hơn khi trình bày."
        ],
        "fail": [
          "Còn thụ động trong giờ học; chưa hoàn thiện sản phẩm hoặc nhiệm vụ học tập theo yêu cầu; cần cố gắng rèn luyện thêm."
        ]
      }
    },
    "qualities": {
      "yeu nuoc": {
        "high": [
          "Có niềm tự hào về lịch sử, truyền thống quê hương; trân trọng và bảo vệ môi trường, có ý thức tiết kiệm điện, nước trong nhà trường."
        ],
        "good": [
          "Có niềm tự hào về lịch sử, truyền thống quê hương; trân trọng và bảo vệ môi trường, có ý thức tiết kiệm điện, nước trong nhà trường."
        ],
        "fail": [
          "Cần nâng cao ý thức giữ gìn vệ sinh môi trường và tiết kiệm điện, nước tại trường lớp."
        ]
      },
      "nhan ai": {
        "high": [
          "Luôn hòa đồng, biết cảm thông, chia sẻ và giúp đỡ các bạn có hoàn cảnh khó khăn; lễ phép, kính trọng thầy cô và người lớn tuổi."
        ],
        "good": [
          "Luôn hòa đồng, biết cảm thông, chia sẻ và giúp đỡ các bạn có hoàn cảnh khó khăn; lễ phép, kính trọng thầy cô và người lớn tuổi."
        ],
        "fail": [
          "Cần biết chia sẻ, đồng cảm và mở lòng giúp đỡ bạn bè xung quanh nhiều hơn."
        ]
      },
      "cham chi": {
        "high": [
          "Đi học chuyên cần; chủ động dọn dẹp vệ sinh trường lớp; luôn hoàn thành tốt các bài tập và nhiệm vụ trực nhật được giao."
        ],
        "good": [
          "Đi học chuyên cần; chủ động dọn dẹp vệ sinh trường lớp; luôn hoàn thành tốt các bài tập và nhiệm vụ trực nhật được giao."
        ],
        "fail": [
          "Đôi lúc còn làm việc riêng trong giờ học; cần nâng cao tính chuyên cần và hoàn thành đầy đủ bài tập."
        ]
      },
      "trung thuc": {
        "high": [
          "Ngay thẳng, tôn trọng sự thật; tuyệt đối nghiêm túc không gian lận trong kiểm tra, thi cử; biết bảo vệ lẽ phải."
        ],
        "good": [
          "Ngay thẳng, tôn trọng sự thật; tuyệt đối nghiêm túc không gian lận trong kiểm tra, thi cử; biết bảo vệ lẽ phải."
        ],
        "fail": [
          "Cần nghiêm túc, trung thực trong học tập và kiểm tra, dũng cảm nhận khuyết điểm khi làm sai."
        ]
      },
      "trach nhiem": {
        "high": [
          "Có ý thức trách nhiệm cao với tập thể; nghiêm túc chấp hành nội quy trường lớp và luật giao thông; biết tự chịu trách nhiệm về hành vi của mình."
        ],
        "good": [
          "Có ý thức trách nhiệm cao với tập thể; nghiêm túc chấp hành nội quy trường lớp và luật giao thông; biết tự chịu trách nhiệm về hành vi của mình."
        ],
        "fail": [
          "Cần có ý thức trách nhiệm hơn với nhiệm vụ được giao và nghiêm túc chấp hành nội quy chung."
        ]
      }
    },
    "commonCompetencies": {
      "tu chu va tu hoc": {
        "high": [
          "Có thói quen tự học tốt; biết lập kế hoạch học tập cá nhân; tự giác tìm kiếm tài liệu để hoàn thành dự án nhỏ."
        ],
        "good": [
          "Có thói quen tự học tốt; biết lập kế hoạch học tập cá nhân; tự giác tìm kiếm tài liệu để hoàn thành dự án nhỏ."
        ],
        "fail": [
          "Chưa có ý thức tự giác cao, còn để nhắc nhở nhiều; cần chủ động làm bài tập mà không đợi thầy cô hay cha mẹ giục."
        ]
      },
      "giao tiep va hop tac": {
        "high": [
          "Tự tin bày tỏ quan điểm trước đám đông; có khả năng dẫn dắt, điều hành nhóm thảo luận hiệu quả và biết tôn trọng ý kiến người khác."
        ],
        "good": [
          "Tự tin bày tỏ quan điểm trước đám đông; có khả năng dẫn dắt, điều hành nhóm thảo luận hiệu quả và biết tôn trọng ý kiến người khác."
        ],
        "fail": [
          "Chưa biết cách phối hợp với các bạn khi làm việc nhóm; còn bảo thủ hoặc quá rụt rè khi tranh luận."
        ]
      },
      "giai quyet van de va sang tao": {
        "high": [
          "Tiếp thu bài nhanh; biết phân tích vấn đề và đề xuất các giải pháp xử lý tình huống thông minh, sáng tạo."
        ],
        "good": [
          "Tiếp thu bài nhanh; biết phân tích vấn đề và đề xuất các giải pháp xử lý tình huống thông minh, sáng tạo."
        ],
        "fail": [
          "Thói quen tư duy còn thụ động; gặp bài tập đòi hỏi lập luận logic nâng cao là dễ nản lòng."
        ]
      }
    },
    "specificCompetencies": {
      "ngon ngu": {
        "high": [
          "Khả năng thuyết trình mạch lạc; viết văn có cảm xúc cá nhân sâu sắc; sử dụng từ ngữ chính xác, giàu tính biểu cảm."
        ],
        "good": [
          "Khả năng thuyết trình mạch lạc; viết văn có cảm xúc cá nhân sâu sắc; sử dụng từ ngữ chính xác, giàu tính biểu cảm."
        ],
        "fail": [
          "Kỹ năng thuyết trình và diễn đạt còn hạn chế; cần rèn luyện thêm sự tự tin khi nói trước đám đông."
        ]
      },
      "tinh toan": {
        "high": [
          "Sử dụng thành thạo các công cụ toán học; có tư duy phân tích số liệu, biểu đồ tốt; nhạy bén với các con số."
        ],
        "good": [
          "Sử dụng thành thạo các công cụ toán học; có tư duy phân tích số liệu, biểu đồ tốt; nhạy bén với các con số."
        ],
        "fail": [
          "Tư duy phân tích số liệu và biểu đồ còn chậm; cần rèn luyện thêm kỹ năng tính toán và suy luận logic."
        ]
      },
      "khoa hoc": {
        "high": [
          "Biết thu thập thông tin, giải thích được các hiện tượng tự nhiên đơn giản; nắm rõ các sự kiện lịch sử và vị trí địa lý cơ bản của đất nước."
        ],
        "good": [
          "Biết thu thập thông tin, giải thích được các hiện tượng tự nhiên đơn giản; nắm rõ các sự kiện lịch sử và vị trí địa lý cơ bản của đất nước."
        ],
        "fail": [
          "Khả năng ghi nhớ và xâu chuỗi sự kiện còn yếu; cần chú ý đọc thêm tài liệu để củng cố kiến thức."
        ]
      },
      "tin hoc": {
        "high": [
          "Sử dụng tốt các phần mềm học tập, soạn thảo văn bản hoặc trình chiếu cơ bản; có ý thức bảo mật và sử dụng internet an toàn."
        ],
        "good": [
          "Sử dụng tốt các phần mềm học tập, soạn thảo văn bản hoặc trình chiếu cơ bản; có ý thức bảo mật và sử dụng internet an toàn."
        ],
        "fail": [
          "Thao tác trên phần mềm máy tính còn lúng túng; cần tăng cường thực hành để nâng cao kỹ năng tin học."
        ]
      },
      "cong nghe": {
        "high": [
          "Sử dụng thành thạo và an toàn các dụng cụ môn Công nghệ; có tư duy sáng tạo trong lắp ráp mô hình kỹ thuật."
        ],
        "good": [
          "Sử dụng thành thạo và an toàn các dụng cụ môn Công nghệ; có tư duy sáng tạo trong lắp ráp mô hình kỹ thuật."
        ],
        "fail": [
          "Thao tác kỹ thuật còn lúng túng; cần rèn luyện thêm sự khéo léo và kiên nhẫn."
        ]
      },
      "tham mi": {
        "high": [
          "Có năng khiếu nghệ thuật và khả năng cảm thụ cái đẹp tốt; biết sáng tạo các sản phẩm hội họa, âm nhạc ấn tượng."
        ],
        "good": [
          "Có năng khiếu nghệ thuật và khả năng cảm thụ cái đẹp tốt; biết sáng tạo các sản phẩm hội họa, âm nhạc ấn tượng."
        ],
        "fail": [
          "Cần chú ý quan sát và mạnh dạn thể hiện ý tưởng sáng tạo trong các hoạt động nghệ thuật."
        ]
      },
      "the chat": {
        "high": [
          "Thể lực tốt, tác phong nhanh nhẹn; hoàn thành xuất sắc các bài tập vận động và có tinh thần đồng đội cao."
        ],
        "good": [
          "Thể lực tốt, tác phong nhanh nhẹn; hoàn thành xuất sắc các bài tập vận động và có tinh thần đồng đội cao."
        ],
        "fail": [
          "Thể lực còn yếu; cần tích cực rèn luyện sức bền và sự dẻo dai trong các giờ giáo dục thể chất."
        ]
      }
    }
  }
};

function applyCommentBankAdditions() {
    Object.entries(COMMENT_BANK_ADDITIONS).forEach(([grade, gradeAdditions]) => {
        COMMENT_BANK.grades[grade] = JSON.parse(JSON.stringify(gradeAdditions));
    });
}

applyCommentBankAdditions();

function gradeKey(grade) {
    const match = String(grade || '').match(/[1-5]/);
    return match ? match[0] : '1';
}

function scoreBucket(score) {
    if (score === '' || score === null || score === undefined) return '';
    const value = Number(score);
    if (!Number.isFinite(value)) return '';
    if (value >= 9) return 'high';
    if (value >= 7) return 'good';
    if (value >= 5) return 'pass';
    return 'fail';
}

function levelBucket(level, kind) {
    const value = String(level || '').trim().toUpperCase();
    if (kind === 'subject') {
        if (value === 'T') return 'high';
        if (value === 'H' || value === 'Đ') return 'good';
        if (value === 'C') return 'fail';
    } else {
        if (value === 'T') return 'high';
        if (value === 'Đ' || value === 'H') return 'good';
        if (value === 'C') return 'fail';
    }
    return '';
}

function hashText(value) {
    let hash = 0;
    const text = String(value || '');
    for (let i = 0; i < text.length; i += 1) {
        hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0;
    }
    return Math.abs(hash);
}

function getBucket(config) {
    const byScore = scoreBucket(config.score);
    return byScore || levelBucket(config.level, config.kind);
}

function getItemBank(config) {
    const grade = gradeKey(config.grade);
    const gradeBank = COMMENT_BANK.grades[grade] || COMMENT_BANK.grades['1'];
    const key = normalizeText(config.name);

    if (config.kind === 'quality') {
        return gradeBank.qualities[key] || null;
    }
    if (config.kind === 'commonCompetency') {
        return gradeBank.commonCompetencies[key] || null;
    }
    if (config.kind === 'specificCompetency') {
        return gradeBank.specificCompetencies[key] || null;
    }

    const subjectKey = normalizeSubject(config.name);
    return gradeBank.subjects[subjectKey] || gradeBank.subjects.other || null;
}

export function getCommentSuggestions(config = {}) {
    const itemBank = getItemBank(config);
    const bucket = getBucket(config);
    if (!itemBank || !bucket) return [];

    const direct = Array.isArray(itemBank[bucket]) ? itemBank[bucket] : [];
    if (direct.length) return [...direct];

    // Mức H không có điểm có thể dùng nhóm hoàn thành; nếu thiếu thì dùng nhóm 5–6.
    if (bucket === 'good' && Array.isArray(itemBank.pass)) return [...itemBank.pass];
    if (bucket === 'pass' && Array.isArray(itemBank.good)) return [...itemBank.good];
    return [];
}

export function inferSubjectLevel(score) {
    const bucket = scoreBucket(score);
    if (!bucket) return '';
    if (bucket === 'high') return 'T';
    if (bucket === 'fail') return 'C';
    return 'H';
}

const BINDINGS = new WeakMap();

function flashElement(element) {
    if (!element) return;
    const oldOutline = element.style.outline;
    element.style.outline = '2px solid #f59e0b';
    element.focus();
    setTimeout(() => { element.style.outline = oldOutline; }, 900);
}

function setAutoValue(binding, { force = false, cycle = false } = {}) {
    const { commentEl, levelEl, scoreEl, config } = binding;
    const level = levelEl?.value || '';
    const score = scoreEl?.value ?? '';
    const suggestions = getCommentSuggestions({ ...config, level, score });

    if (!suggestions.length) {
        if (!level && (score === '' || score === null || score === undefined)) {
            flashElement(scoreEl || levelEl);
        }
        return false;
    }

    const isBlank = !String(commentEl.value || '').trim();
    const isAuto = commentEl.dataset.autoComment === '1';
    if (!force && !isBlank && !isAuto) return false;

    const signature = `${config.grade}|${config.kind}|${config.name}|${level}|${score}`;
    let index;
    if (cycle) {
        const previous = Number(commentEl.dataset.suggestionIndex || '-1');
        index = Number.isFinite(previous) ? (previous + 1) % suggestions.length : 0;
    } else if (commentEl.dataset.suggestionSignature === signature) {
        index = Number(commentEl.dataset.suggestionIndex || '0') % suggestions.length;
    } else {
        index = hashText(`${config.seed || ''}|${signature}`) % suggestions.length;
    }

    commentEl.value = suggestions[index];
    commentEl.dataset.autoComment = '1';
    commentEl.dataset.suggestionIndex = String(index);
    commentEl.dataset.suggestionSignature = signature;
    commentEl.title = `Nhận xét tự động ${index + 1}/${suggestions.length}. Có thể sửa trực tiếp.`;
    return true;
}

function addSuggestionButton(binding) {
    const { commentEl } = binding;
    if (commentEl.dataset.commentButtonAdded === '1') return;

    const parent = commentEl.parentElement;
    if (!parent) return;

    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.alignItems = commentEl.tagName === 'TEXTAREA' ? 'flex-start' : 'center';
    wrapper.style.gap = '5px';
    wrapper.style.width = '100%';

    parent.insertBefore(wrapper, commentEl);
    wrapper.appendChild(commentEl);
    commentEl.style.flex = '1';
    commentEl.style.minWidth = '0';

    const button = document.createElement('button');
    button.type = 'button';
    button.innerHTML = '✨';
    button.title = 'Gợi ý hoặc đổi câu nhận xét';
    button.setAttribute('aria-label', 'Gợi ý nhận xét');
    button.style.flex = '0 0 auto';
    button.style.width = '34px';
    button.style.height = commentEl.tagName === 'TEXTAREA' ? '34px' : '30px';
    button.style.border = '1px solid #cbd5e1';
    button.style.borderRadius = '6px';
    button.style.background = '#fffbeb';
    button.style.color = '#b45309';
    button.style.cursor = 'pointer';
    button.style.fontSize = '0.9rem';
    button.style.marginTop = commentEl.tagName === 'TEXTAREA' ? '1px' : '0';

    button.addEventListener('click', () => {
        setAutoValue(binding, { force: true, cycle: true });
    });

    wrapper.appendChild(button);
    commentEl.dataset.commentButtonAdded = '1';
}

export function bindCommentField(config = {}) {
    const commentEl = document.getElementById(config.commentId);
    if (!commentEl) return null;
    if (BINDINGS.has(commentEl)) return BINDINGS.get(commentEl);

    const levelEl = config.levelId ? document.getElementById(config.levelId) : null;
    const scoreEl = config.scoreId ? document.getElementById(config.scoreId) : null;
    const binding = { config, commentEl, levelEl, scoreEl };
    BINDINGS.set(commentEl, binding);

    commentEl.dataset.commentBankBound = '1';
    commentEl.dataset.autoComment = String(commentEl.value || '').trim() ? '0' : '1';

    addSuggestionButton(binding);

    commentEl.addEventListener('input', () => {
        commentEl.dataset.autoComment = '0';
        commentEl.removeAttribute('title');
    });

    const updateFromInputs = () => {
        if (scoreEl && config.syncLevelFromScore !== false) {
            const inferred = inferSubjectLevel(scoreEl.value);
            if (inferred && levelEl && levelEl.value !== inferred) {
                levelEl.value = inferred;
                levelEl.style.fontWeight = '700';
                levelEl.style.color = inferred === 'T' ? '#16a34a' : inferred === 'H' ? '#2563eb' : '#dc2626';
            }
        }
        setAutoValue(binding, { force: false, cycle: false });
    };

    levelEl?.addEventListener('change', updateFromInputs);
    scoreEl?.addEventListener('input', updateFromInputs);
    scoreEl?.addEventListener('change', updateFromInputs);

    // Tự điền khi đã có mức/điểm nhưng ô nhận xét còn trống.
    updateFromInputs();
    return binding;
}

export function fillBlankComments(root = document) {
    let count = 0;
    root.querySelectorAll('[data-comment-bank-bound="1"]').forEach(commentEl => {
        const binding = BINDINGS.get(commentEl);
        if (!binding) return;
        if (!String(commentEl.value || '').trim() && setAutoValue(binding, { force: true })) count += 1;
    });
    return count;
}

export function refreshAutoComments(root = document) {
    let count = 0;
    root.querySelectorAll('[data-comment-bank-bound="1"]').forEach(commentEl => {
        const binding = BINDINGS.get(commentEl);
        if (!binding || commentEl.dataset.autoComment !== '1') return;
        if (setAutoValue(binding, { force: true, cycle: true })) count += 1;
    });
    return count;
}

export function addCommentBankToolbar(root = document, options = {}) {
    if (!root || root.querySelector('[data-comment-bank-toolbar="1"]')) return;

    const toolbar = document.createElement('div');
    toolbar.dataset.commentBankToolbar = '1';
    toolbar.style.display = 'flex';
    toolbar.style.alignItems = 'center';
    toolbar.style.gap = '7px';
    toolbar.style.flexWrap = 'wrap';
    toolbar.style.padding = '8px 10px';
    toolbar.style.marginBottom = '10px';
    toolbar.style.border = '1px solid #fde68a';
    toolbar.style.borderRadius = '8px';
    toolbar.style.background = '#fffbeb';
    toolbar.style.color = '#92400e';
    toolbar.style.fontSize = '0.78rem';

    const label = document.createElement('strong');
    label.textContent = '✨ Ngân hàng nhận xét theo khối';
    toolbar.appendChild(label);

    const fillButton = document.createElement('button');
    fillButton.type = 'button';
    fillButton.textContent = 'Điền các ô trống';
    fillButton.style.cssText = 'border:1px solid #f59e0b;background:white;color:#92400e;border-radius:6px;padding:4px 9px;cursor:pointer;font-size:0.76rem;font-weight:600';
    fillButton.addEventListener('click', () => fillBlankComments(root));
    toolbar.appendChild(fillButton);

    const refreshButton = document.createElement('button');
    refreshButton.type = 'button';
    refreshButton.textContent = 'Đổi câu tự động';
    refreshButton.style.cssText = 'border:1px solid #cbd5e1;background:white;color:#475569;border-radius:6px;padding:4px 9px;cursor:pointer;font-size:0.76rem';
    refreshButton.addEventListener('click', () => refreshAutoComments(root));
    toolbar.appendChild(refreshButton);

    const note = document.createElement('span');
    note.textContent = 'Không ghi đè câu giáo viên đã sửa tay.';
    note.style.marginLeft = 'auto';
    note.style.color = '#78716c';
    toolbar.appendChild(note);

    if (options.afterElement) {
        options.afterElement.insertAdjacentElement('afterend', toolbar);
    } else {
        root.insertBefore(toolbar, root.firstChild);
    }
}

export function getCommentBankStats() {
    let subjectItems = 0;
    let traitItems = 0;
    let suggestions = 0;
    Object.values(COMMENT_BANK.grades).forEach(grade => {
        subjectItems += Object.keys(grade.subjects || {}).length;
        traitItems += Object.keys(grade.qualities || {}).length;
        traitItems += Object.keys(grade.commonCompetencies || {}).length;
        traitItems += Object.keys(grade.specificCompetencies || {}).length;
        [grade.subjects, grade.qualities, grade.commonCompetencies, grade.specificCompetencies]
            .forEach(group => Object.values(group || {}).forEach(item => {
                Object.values(item || {}).forEach(list => {
                    if (Array.isArray(list)) suggestions += list.length;
                });
            }));
    });
    return { version: COMMENT_BANK.version, subjectItems, traitItems, suggestions };
}

if (typeof window !== 'undefined') {
    window.getSmartSchoolCommentBankStats = getCommentBankStats;
}
