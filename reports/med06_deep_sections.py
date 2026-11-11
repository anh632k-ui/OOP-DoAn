# -*- coding: utf-8 -*-
"""Các phần chuyên sâu của báo cáo MED-06, rút từ mã nguồn thật trên med06-code.

Nguồn chính:
- PTTK/00_YeuCau/01-yeu-cau-nghiep-vu.md
- PTTK/01_Actor_UseCase/02-use-case-specifications.md
- database/migrations/*.sql
- backend/src/**/*.{ts}
- docs/MED06_TEST_CASES.md

Không sử dụng số liệu, kết quả test hoặc ảnh chạy thực tế tưởng tượng.
"""
import os, re, textwrap
from pathlib import Path
from collections import defaultdict
from docx.shared import Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH

BASE = Path(__file__).resolve().parent.parent / "src_snapshot"

def read(rel):
    f=BASE / rel
    if not f.is_file():
        raise RuntimeError("Thiếu dữ liệu MED-06 thật: "+str(f))
    return f.read_text(encoding="utf-8")

def rows_of(md):
    rows=[]
    for raw in md.splitlines():
        x=raw.strip()
        if x.startswith("|") and x.endswith("|"):
            cells=[v.strip() for v in x.strip("|").split("|")]
            if len(cells)>1 and not all(set(c)<=set("-: ") for c in cells):
                rows.append(cells)
    return rows

def section(md,heading,nextlevel="##"):
    matches=list(re.finditer(r"(?m)^"+re.escape(nextlevel)+r"\s+(.*)$",md))
    for i,m in enumerate(matches):
        if heading in m.group(1):
            return md[m.end():matches[i+1].start() if i+1<len(matches) else len(md)].strip()
    return ""

def sql_tables():
    found={}
    for f in sorted((BASE/"database/migrations").glob("*.sql")):
        sql=f.read_text(encoding="utf-8")
        for m in re.finditer(r"\bCREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?([a-z_]+)\s*\(",sql,re.I):
            j=m.end();depth=1;quotes=False;begin=j
            while j<len(sql) and depth>0:
                ch=sql[j]
                if ch=="'" and (j==0 or sql[j-1]!="\\"):quotes=not quotes
                if not quotes:
                    if ch=="(":depth+=1
                    elif ch==")":depth-=1
                j+=1
            body=sql[begin:j-1]
            entries=[];buf="";level=0;quot=False
            for ch in body:
                if ch=="'":quot=not quot
                if not quot:
                    if ch=="(":level+=1
                    if ch==")":level-=1
                if ch=="," and level==0:
                    entries.append(buf.strip());buf=""
                else:buf+=ch
            if buf.strip():entries.append(buf.strip())
            fields=[];constraints=[]
            for c in entries:
                c=" ".join(c.split())
                pieces=c.split(" ",2)
                if not pieces:continue
                key=pieces[0]
                if key.upper() in ("CONSTRAINT","PRIMARY","UNIQUE","FOREIGN","CHECK"):
                    constraints.append(c)
                elif len(pieces)>1:
                    fields.append((key,pieces[1],pieces[2] if len(pieces)>2 else ""))
            found[m.group(1)]={"name":m.group(1),"migration":f.name,"fields":fields,"constraints":constraints}
    return found

def endpoint_routes():
    paths=sorted((BASE/"backend/src").glob("*/*.controller.ts"))
    groups=[]
    for f in paths:
        s=f.read_text(encoding="utf-8")
        prefix=re.search(r"@Controller\(['\"]([^'\"]*)['\"]\)",s)
        if not prefix:continue
        prefix=prefix.group(1)
        endpoints=[]
        for m in re.finditer(r"@(Get|Post|Patch|Put|Delete)\(\s*(['\"]([^'\"]*)['\"])?\s*\)",s):
            verb=m.group(1).upper()
            relative=m.group(3) or ""
            post=s[m.end():m.end()+350]
            # Skip parameter decorator lines until the declared method.
            fmatch=re.search(r"\b(?:async\s+)?([A-Za-z]\w*)\s*\(",post)
            func=fmatch.group(1) if fmatch else "—"
            route="/"+"/".join(x for x in [prefix,relative] if x)
            endpoints.append((verb,route,func))
        groups.append((f.relative_to(BASE).as_posix(),endpoints))
    return groups

def uc_parts():
    md=read("PTTK/01_Actor_UseCase/02-use-case-specifications.md")
    out={}
    for m in re.finditer(r"(?m)^##\s+UC(\d+)\s*-\s*(.*)$",md):
        starts=m.end()
        tail=md.find("\n## UC",starts)
        if tail<0:tail=len(md)
        block=md[starts:tail].strip()
        out[int(m.group(1))]=(m.group(2).strip(),block)
    return out

def norm_words(s,n=210):
    s=re.sub(r"[\n\r]+"," ",s)
    s=re.sub(r"\s+"," ",s).strip()
    words=s.split(" ")
    return " ".join(words[:n])

def desc_for_field(k):
    x=k.lower()
    if x.startswith("ma_"):return "Mã định danh hoặc tham chiếu thực thể liên quan."
    if "mat_khau" in x:return "Chỉ lưu giá trị băm, không lưu mật khẩu dạng rõ."
    if "email" in x:return "Thông tin liên hệ và đăng nhập; áp dụng kiểm tra trùng."
    if "trang_thai" in x:return "Trạng thái vòng đời được kiểm soát bằng quy tắc nghiệp vụ."
    if "thoi_gian" in x or "luc" in x or x in ("bat_dau","ket_thuc","mo_dang_ky","dong_dang_ky"):return "Mốc thời gian xử lý; ứng dụng hiển thị theo múi giờ Việt Nam."
    if "so_luong" in x or "suc_chua" in x or "vi_tri" in x or "thu_tu" in x:return "Số lượng/vị trí được ràng buộc để giữ đúng giới hạn nghiệp vụ."
    if "ten_" in x or "ho_ten" in x:return "Tên hiển thị của đối tượng."
    if "mo_ta" in x or "ghi_chu" in x or "ly_do" in x:return "Thông tin mô tả hoặc diễn giải cho người vận hành."
    if "phuong_thuc" in x:return "Chính sách hoặc phương thức hành động được chọn."
    if "cau_hinh" in x:return "Cấu hình nghiệp vụ có cấu trúc; không phải mã thực thi."
    if "xac_thuc" in x or "ma_ve" in x:return "Dữ liệu nhận diện vé cần được bảo vệ khi hiển thị."
    if "anh_" in x:return "Tham chiếu tới tệp ảnh ở dịch vụ lưu trữ đối tượng."
    return "Trường dữ liệu thuộc trạng thái của thực thể; kiểm tra nghĩa trong migration."

def evidence_for_test(label):
    x=label.lower()
    if "đăng ký" in x or "fcfs" in x or "cấp" in x:
        return "So sánh trạng thái đăng ký và bản ghi vé; đối chiếu số vé còn hiệu lực với sức chứa của suất."
    if "lottery" in x or "bốc thăm" in x:
        return "Đối chiếu đợt phân bổ, ứng viên hợp lệ, thứ tự và điều kiện chỉ được xử lý một lần."
    if "check-in" in x or "quét" in x:
        return "Kiểm tra kết quả trả về, trạng thái vé và số bản ghi quét thành công trong CSDL."
    if "quyền" in x or "attendee" in x or "login" in x or "đăng nhập" in x:
        return "Đối chiếu HTTP status và thông tin phiên, không chụp mật khẩu hoặc token."
    if "sql" in x or "migration" in x or "seed" in x:
        return "Chạy trên dữ liệu kiểm thử độc lập và so sánh số bản ghi trước/sau."
    if "ảnh" in x or "upload" in x:
        return "Kiểm tra loại tệp, kích thước và khóa ảnh, không xuất khóa bí mật."
    return "Kiểm tra đầu vào, kết quả phản hồi và dữ liệu lưu sau thao tác; ghi nhận bằng chứng nếu chạy thủ công."

ROLE_INFO={
"Guest":("Khách chưa đăng nhập","Khám phá thông tin công khai, tìm kiếm và đăng ký tài khoản."),
"Attendee":("Người tham dự","Đăng ký suất, theo dõi danh sách chờ, vé QR, hủy khi đủ điều kiện."),
"Organizer":("Ban tổ chức","Tạo nháp, tạo suất, công bố, thiết lập chính sách, quan sát kết quả."),
"Check-in Staff":("Nhân viên kiểm vé","Làm việc tại suất được phân công, xác thực mã vé và ghi nhận lượt vào cổng."),
"Administrator":("Quản trị viên","Xét duyệt yêu cầu tổ chức, cấp quyền, khóa tài khoản, tra cứu nhật ký."),
}
FORMS=[
("BM01","Đăng ký tài khoản","Họ tên, email, mật khẩu","Tạo tài khoản người tham dự"),
("BM02","Đăng nhập","Email, mật khẩu","Xác nhận danh tính"),
("BM03","Tìm kiếm sự kiện","Tên/nội dung, đặc tính tiếp cận","Lọc danh sách sự kiện đã công bố"),
("BM04","Đăng ký suất","Sự kiện, suất, nút tham dự","Gửi yêu cầu theo chính sách đang áp dụng"),
("BM05","Theo dõi đăng ký","Đang tham gia, chờ, lịch sử","Hiển thị trạng thái do backend tính"),
("BM06","Ví vé điện tử","Vé, QR, giờ, địa điểm","Xuất trình duy nhất một lần"),
("BM07","Tạo/chỉnh sửa sự kiện","Tên, mô tả, ảnh, tiếp cận","Quản lý dữ liệu thuộc quyền Ban tổ chức"),
("BM08","Cấu hình suất","Lịch, sức chứa, cửa sổ đăng ký","Tạo suất hợp lệ trước khi công bố"),
("BM09","Phân bổ và danh sách chờ","Chính sách, thống kê, đợt phân bổ","Thực hiện và giám sát FCFS/Lottery/MIXED"),
("BM10","Check-in","Suất phân công, camera, mã thủ công","Xác nhận/từ chối một lượt quét"),
("BM11","Quản trị tài khoản","Tìm kiếm, khóa, cấp quyền","Quản trị tài khoản theo vai trò"),
("BM12","Nhật ký và xét duyệt","Yêu cầu tổ chức, bộ lọc hành động","Giám sát và ra quyết định có truy vết"),
]
UC_TABLE=[
(1,"Đăng ký tài khoản","Guest","POST /auth/register","Tài khoản mới được tạo mặc định vai trò ATTENDEE."),
(2,"Đăng nhập","Guest","POST /auth/login","Trả thông tin phiên khi email và mật khẩu hợp lệ."),
(3,"Tìm kiếm sự kiện","Guest, Attendee","GET /events","Chỉ danh sách sự kiện đã công bố theo bộ lọc."),
(4,"Xem chi tiết","Guest, Attendee","GET /events/:id","Hiển thị sự kiện, các suất và đặc tính tiếp cận."),
(5,"Đăng ký suất","Attendee","POST /registrations /sessions","Kết quả có thể được xác nhận, chờ hoặc danh sách chờ."),
(6,"Hủy đăng ký","Attendee","DELETE /registrations/:id","Hủy vé nếu chưa sử dụng, có thể đôn người chờ."),
(7,"Xem đăng ký","Attendee","GET /registrations","Trạng thái lấy từ đăng ký của người hiện tại."),
(8,"Xem vé điện tử","Attendee","GET /tickets","Chỉ hiển thị vé thuộc tài khoản, theo trạng thái."),
(9,"Tạo/cập nhật sự kiện","Organizer","POST /manage/events","Tạo nháp, kiểm tra ownership trước khi cập nhật."),
(10,"Quản lý suất","Organizer","POST /manage/events/:id/sessions","Thiết lập lịch, địa điểm, sức chứa và chính sách."),
(11,"Công bố sự kiện","Organizer","POST /manage/events/:id/publish","Chỉ công bố khi có suất hợp lệ."),
(12,"Phân bổ vé","Organizer","POST /manage/sessions/:id/allocate","Áp dụng chính sách và giới hạn sức chứa."),
(13,"Thống kê và chờ","Organizer","GET /manage/sessions/:id/insights","Theo dõi suất, kết quả, vé và danh sách chờ."),
(14,"Check-in","Check-in Staff","POST /checkin","Từ chối vé đã quét hoặc không đúng suất."),
(15,"Quản trị người dùng","Administrator","GET /admin/users","Phân quyền, khóa tài khoản, ghi nhật ký."),
]
DOMAIN_OBJECTS=[
("User","Tài khoản đăng nhập, danh sách vai trò, trạng thái hoạt động","Một người có thể đồng thời là Attendee và Organizer; quyền ở API không thể dựa vào nút frontend."),
("Venue","Địa điểm có tên, địa chỉ và mô tả","Suất thuộc một địa điểm; thay đổi địa điểm tác động tới thông tin vé."),
("AccessibilityFeature","Danh mục tính năng tiếp cận","Chỉ nên cho lọc theo đặc tính đã được xác nhận của sự kiện."),
("Event","Chương trình văn hóa tổng thể có nhiều suất","Trạng thái nháp/công bố/tạm ngưng/hủy quyết định hoạt động liên quan."),
("EventSession","Suất gồm lịch, địa điểm, sức chứa, hạn đăng ký","Đơn vị trực tiếp của đăng ký, vé, kiểm tra cửa vào và phân bổ."),
("AllocationRun","Một đợt bốc thăm hoặc phân bổ có nhật ký","Không chạy hai đợt cho cùng suất nếu đã có kết quả chốt."),
("Registration","Ý định tham dự của tài khoản tại một suất","Không tạo hai lượt đăng ký còn hiệu lực trên cùng một suất."),
("WaitlistEntry","Vị trí chờ khi chưa được cấp vé","Thứ tự tăng dần và trạng thái đôn chờ được duy trì."),
("Ticket","Mã vé gắn với đăng ký xác nhận","Mỗi vé chỉ có tối đa một lượt Check-in thành công."),
("CheckIn","Bản ghi người kiểm tra, kết quả và thời điểm","Ghi nhận cả các lần từ chối theo chính sách nhật ký."),
]
SERVICE_DESCRIPTIONS={
"auth/auth.service.ts":"Xác thực và phát token. Mật khẩu được băm, tài khoản bị khóa không được cấp phiên hợp lệ.",
"registrations/registrations.service.ts":"Dùng giao dịch PostgreSQL để kiểm tra cửa sổ đăng ký, chống trùng, cấp vé FCFS hoặc ghi lượt chờ.",
"allocations/allocations.service.ts":"Chạy Lottery/MIXED sau hạn đăng ký; có lịch kiểm tra và khóa tránh chạy trùng.",
"checkin/checkin.service.ts":"Kiểm tra mã vé theo suất và quyền nhân viên; xử lý trạng thái trong giao dịch.",
"events/events.service.ts":"Tra cứu sự kiện công khai, suất và thuộc tính tiếp cận qua truy vấn dữ liệu.",
"management/management.service.ts":"Nghiệp vụ Ban tổ chức: tạo sự kiện, suất, công bố, tạm ngưng, đổi lịch, hủy và chính sách.",
"management/organizer-insights.service.ts":"Tổng hợp số liệu đăng ký, phân bổ, danh sách chờ và Check-in theo phạm vi Ban tổ chức.",
"admin/admin.service.ts":"Người dùng, khóa tài khoản, phân quyền, xét duyệt Ban tổ chức và audit.",
"staff/staff.service.ts":"Phân công Check-in và kiểm soát quyền theo từng suất.",
"media/media.service.ts":"Lưu và đọc ảnh trên kho tương thích S3, kiểm tra định dạng và kích thước.",
"database/database.service.ts":"Quản lý pool PostgreSQL, truy vấn có tham số và transaction.",
"audit/audit.ts":"Ghi nhận thao tác quan trọng nhưng không lưu thông tin bí mật của người dùng.",
}

class Expansion:
    def __init__(self,doc,h2,h3,p,t):
        self.doc=doc;self.h2=h2;self.h3=h3;self.p=p;self.t=t
        self.depth=int(os.getenv("MED06_EXTRA_DEPTH","100"))
        self.notesize=int(os.getenv("MED06_DETAIL_NOTE_SIZE","10"))
        self._items=0
    def can(self,key):
        # Optional depth gates are deterministic and distributed across chapters.
        return key<=self.depth
    def add(self,txt):
        return self.p(txt)
    def mini(self,txt):
        q=self.doc.add_paragraph()
        q.paragraph_format.space_after=Pt(3)
        r=q.add_run(txt);r.font.name="Times New Roman";r.font.size=Pt(10)
    def source(self,rel):
        self.mini("Nguồn đối chiếu trong kho MED-06: "+rel+" (nhánh med06-code).")
    def ex(self,title,items,text):
        self.h3(title)
        self.t(["Thành phần","Nội dung triển khai"],items)
        self.add(text)
    def ch1(self):
        self.h2("1.8. Khảo sát hiện trạng quản lý sự kiện và vé miễn phí")
        self.add("Đối tượng khảo sát trong phạm vi bài toán là quy trình công bố một chương trình văn hóa và quản lý người tham dự khi số chỗ hạn chế. Việc phân phối suất tham dự bằng danh sách thủ công hoặc biểu mẫu rời gây khó kiểm tra thời điểm nhận đăng ký, dễ trùng thông tin và không có điểm tra cứu thống nhất cho người chờ.")
        self.t(["Tình huống hiện trạng","Rủi ro cần khắc phục","Nghiệp vụ MED-06"],[
         ("Công bố lịch bằng nhiều kênh","Khách không biết suất nào còn nhận đăng ký","Một cổng khám phá sự kiện và lịch suất."),
         ("Nhận đăng ký cùng lúc","Có thể cấp quá số chỗ hoặc ghi nhận trùng","Transaction/unique constraint và kiểm soát sức chứa."),
         ("Bốc thăm thủ công","Khó kiểm lại kết quả và danh sách chờ","Ghi đợt phân bổ và thứ tự xét."),
         ("Hủy suất hoặc đổi lịch","Không thể cập nhật trạng thái cho mọi người","Trạng thái suất và thông tin thay đổi."),
         ("Kiểm tra tại cổng","Một vé có thể được xuất trình nhiều lần","Mã QR và Check-in một lần."),
         ("Hỗ trợ người khuyết tật","Không rõ điều kiện tiếp cận của sự kiện","Đặc tính tiếp cận được xác nhận và bộ lọc."),
        ])
        self.add("Từ các điểm bất cập, yêu cầu đặt ra là dữ liệu phải được quản lý theo từng suất và mỗi hành động có hệ quả nhất quán tới lượt đăng ký, vé, hàng chờ và lịch sử. Cổng web chỉ là mặt trình bày; quy tắc quyết định kết quả phải nằm trong tầng service cùng các ràng buộc ở CSDL.")
        self.h2("1.9. Sơ đồ tổ chức và nhiệm vụ")
        self.add("Hệ thống được phân thành các không gian sử dụng theo quyền. Đây là sơ đồ phân công chức năng phần mềm, không phải sơ đồ nhân sự của một đơn vị tổ chức cụ thể.")
        self.t(["Nhóm","Quyền chủ đạo","Dữ liệu được phép xem/cập nhật"],[
          (k,a+"; "+b,"Dữ liệu thuộc quyền sở hữu hoặc phạm vi vai trò." if k!="Guest" else "Dữ liệu sự kiện công khai.")
          for k,(a,b) in ROLE_INFO.items()
        ])
        self.add("Quan hệ giữa các vai trò không phải quan hệ kế thừa dữ liệu. Một tài khoản có thể giữ nhiều vai trò được ADMIN cấp và thu hồi, còn việc tạo tài khoản mới chỉ sinh vai trò người tham dự mặc định. Vai trò Guest và nhãn Authenticated User trong sơ đồ là actor phân tích chứ không lưu thành role.")
        self.h2("1.10. Danh sách yêu cầu chức năng")
        req=read("PTTK/00_YeuCau/01-yeu-cau-nghiep-vu.md")
        fr=[r for r in rows_of(section(req,"4. Yêu cầu chức năng","##")) if re.match(r"FR-\d+",r[0])]
        self.t(["Mã","Yêu cầu được xác định từ phân tích nghiệp vụ"],fr)
        self.source("PTTK/00_YeuCau/01-yeu-cau-nghiep-vu.md")
        self.h2("1.11. Danh sách quy tắc nghiệp vụ")
        br=[r for r in rows_of(section(req,"5. Business Rules","##")) if re.match(r"BR-\d+",r[0])]
        self.t(["Mã","Quy tắc quản lý yêu cầu và trạng thái"],br)
        self.add("Các quy tắc trong bảng thuộc baseline phân tích. Ở lần hiện thực, policy MIXED, tạm ngưng sự kiện và xét duyệt quyền Ban tổ chức là mở rộng so với chính sách FCFS/Lottery gốc. Những phần này cần đọc kèm migration 009 và 010, không thay thế nguồn phân tích bằng suy đoán.")
        self.h2("1.12. Danh sách biểu mẫu nghiệp vụ")
        self.t(["Mã","Biểu mẫu giao diện","Thông tin nhập/hiển thị","Kết quả"],FORMS)
        for no,name,fields,purpose in FORMS:
            if not self.can(60+int(no[2:])):continue
            self.h3("1.12."+str(int(no[2:]))+". "+name)
            self.add("Biểu mẫu "+no+" phục vụ thao tác "+purpose.lower()+". Dữ liệu chính: "+fields+". Trước khi ghi dữ liệu, người dùng phải nhận được thông báo hợp lệ dựa trên phản hồi của backend.")
            self.add("Các thông báo lỗi cần chỉ ra thao tác cần sửa nhưng không làm lộ mã xác thực, chuỗi token hoặc thông tin tài khoản khác. Biểu mẫu được trình bày trong chương VI theo đúng bộ 12 ảnh thiết kế giao diện.")
    def ch2(self):
        self.h2("2.6. Đặc tả và truy vết 15 Use Case")
        specs=uc_parts()
        for id,name,actor,api,result in UC_TABLE:
            if not self.can(40+id):continue
            self.h3(f"2.6.{id}. UC{id:02d} – {name}")
            spec=specs.get(id)
            rows=[
              ("Actor chính",actor),
              ("Đầu vào", "Yêu cầu thao tác trên đối tượng nghiệp vụ và phiên người dùng, nếu cần."),
              ("Điều kiện bắt buộc","Kiểm tra vai trò/ownership, trạng thái đối tượng và dữ liệu đầu vào."),
              ("Mốc API liên hệ","Tham chiếu: "+api+"; đường dẫn thực phải ưu tiên decorator trong mã controller."),
              ("Kết quả mong đợi",result),
              ("Ngoại lệ","Dữ liệu không hợp lệ: 400; chưa xác thực: 401; sai quyền: 403; trùng/xung đột: 409 theo trường hợp."),
              ("Truy vết","Actor → Use Case → service NestJS → migration/bảng dữ liệu → testcase khi có.")
            ]
            self.t(["Hạng mục","Mô tả"],rows)
            if spec:
                block=spec[1]
                step_lines=[x.strip(" -0123456789.") for x in block.splitlines()
                            if x.strip().startswith(("- ","1. ","2. ","3. ","4. ","5. ","6. "))]
                if step_lines:
                    self.add("Theo đặc tả gốc, các bước trọng tâm được ghi nhận như sau: "+
                             "; ".join(x for x in step_lines[:7])+".")
            if id in (5,6,12,14):
                self.add("Trường hợp sử dụng có cập nhật đồng thời phải đặt trong một giao dịch. UI không được tự quyết định xác nhận hay vô hiệu vé; kết quả cuối lấy từ trạng thái dữ liệu do backend chuyển.")
        self.h2("2.7. Quan hệ giữa chức năng và quy tắc")
        self.t(["Chuỗi nghiệp vụ","Use Case liên quan","Bất biến cần giữ"],[
          ("Tạo tài khoản → Đăng nhập","UC01, UC02","Tài khoản mới không tự có quyền Organizer/ADMIN."),
          ("Khám phá → Xem chi tiết","UC03, UC04","Chỉ lộ thông tin công khai của sự kiện hợp lệ."),
          ("Đăng ký → Phân bổ → Nhận vé","UC05, UC12, UC08","Một suất không phát quá sức chứa; mỗi lượt có tối đa một vé."),
          ("Hủy → Đôn người chờ","UC06, UC07","Thứ tự chờ được xử lý nhất quán trong giao dịch."),
          ("Xuất trình → Check-in","UC08, UC14","Vé sai suất hoặc đã dùng không được chấp nhận."),
          ("Quản lý → Giám sát","UC09–UC13, UC15","Thao tác có phân quyền và nhật ký."),
        ])
        self.h2("2.8. Các điều kiện tương tác cần kiểm thử")
        self.add("Use Case trong UML mô tả mục tiêu của người dùng, không tự chứng minh chương trình chạy đúng. Muốn kiểm chứng, mỗi chức năng phải có dữ liệu đầu vào, kỳ vọng, trạng thái cuối và một hoặc nhiều cách kiểm tra độc lập. Các hoạt động chính liên hệ với TC01–TC25 ở chương V.")
    def ch3(self):
        self.h2("3.6. Mô tả chi tiết các lớp đối tượng")
        puml=read("PTTK/03_ClassDiagram/01-class-diagram-entities.puml")
        cls={}
        for m in re.finditer(r"class\s+(\w+)\s*\{(.*?)\}",puml,re.S):
            cls[m.group(1)]=[v.strip() for v in m.group(2).splitlines() if v.strip()]
        for i,(name,meaning,rule) in enumerate(DOMAIN_OBJECTS,1):
            if not self.can(35+i):continue
            self.h3(f"3.6.{i}. Lớp {name}")
            info=cls.get(name,[])
            attributes=[v for v in info if v.startswith("-")]
            methods=[v for v in info if v.startswith("+")]
            self.add(meaning+". "+rule)
            self.t(["Thành phần lớp","Khai báo trong mô hình","Vai trò thiết kế"],[
                ("Thuộc tính",", ".join(attributes) or "Được mô tả trong sơ đồ lớp.", "Dữ liệu trạng thái hoặc quan hệ theo định danh."),
                ("Phương thức",", ".join(methods) or "Do service điều phối.", "Kiểm tra điều kiện hoặc chuyển trạng thái hợp lệ."),
                ("Quan hệ",name+" liên kết với các thực thể khác theo sơ đồ Domain.", "Đa số liên kết được bảo vệ bằng FK khi ánh xạ PostgreSQL."),
            ])
            self.add("Tại mức phân tích, lớp "+name+" biểu diễn khái niệm nghiệp vụ. Khi hiện thực, các phép đọc/ghi đi qua NestJS service, không có nghĩa mọi phương thức UML nhất thiết trở thành một method TypeScript trùng tên.")
        self.h2("3.7. Phân tích luồng trạng thái")
        paths=["PTTK/07_State/01-registration-state.puml","PTTK/07_State/02-ticket-state.puml","PTTK/07_State/03-event-session-state.puml","PTTK/07_State/04-event-state.puml"]
        for k,path in enumerate(paths,1):
            src=read(path)
            transitions=[]
            for line in src.splitlines():
                if "-->" in line and not line.lstrip().startswith("'"):
                    transitions.append(line.strip()[:180])
            self.h3(f"3.7.{k}. Ma trận chuyển trạng thái – "+["Đăng ký","Vé điện tử","Suất sự kiện","Sự kiện"][k-1])
            self.t(["Chuyển trạng thái được thể hiện","Ý nghĩa kiểm soát"],[
                (x,"Chỉ thực hiện khi các tiền điều kiện của nghiệp vụ đạt; phản hồi phải phản ánh trạng thái sau transaction.")
                for x in transitions[:15] ] or [("Không có mũi tên dạng -->","Đọc thêm sơ đồ nguồn.")])
            self.source(path)
        self.h2("3.8. Liên hệ sơ đồ tuần tự và hoạt động với thiết kế")
        self.t(["Nghiệp vụ","Điểm kiểm soát trong sequence","Nhánh quyết định trong activity"],[
         ("Đăng ký","Kiểm tra phiên và khóa suất trước khi phát vé","Còn chỗ/đầy/chờ bốc thăm."),
         ("Hủy/đôn chờ","Thu hồi vé và cập nhật người chờ trong cùng giao dịch","Có người chờ hay không; vé đã sử dụng hay chưa."),
         ("Bốc thăm","Ghi đợt phân bổ duy nhất trước khi cập nhật kết quả","Còn ứng viên/không còn ứng viên; hạn mức."),
         ("Check-in","Khóa bản ghi vé, ghi nhật ký, cập nhật trạng thái","Mã đúng/sai, hết hiệu lực, đã dùng."),
        ])
    def ch4(self):
        tables=sql_tables()
        self.h2("4.6. Cấu trúc vật lý chi tiết từng bảng PostgreSQL")
        self.add("Phần dưới trích cấu trúc thật từ câu lệnh CREATE TABLE trong các migration thuộc nhánh med06-code. Vì bản ERD gốc phản ánh mốc thiết kế trước mở rộng, danh sách bảng và cột trong migration là căn cứ ưu tiên cho bản triển khai vật lý. Những mô tả diễn giải không thay thế định nghĩa DDL.")
        for i,(name,meta) in enumerate(tables.items(),1):
            if not self.can(25+i):continue
            self.h3(f"4.6.{i}. Bảng {name}")
            self.add("Nguồn định nghĩa: "+meta["migration"]+". Bảng "+name+" tham gia vào lưu trữ dữ liệu nghiệp vụ; tên bảng và kiểu cột được giữ theo lược đồ PostgreSQL của dự án.")
            self.t(["Tên cột thực tế","Kiểu SQL","Ràng buộc được khai báo","Ý nghĩa"],[
                (col,typ,(constraint[:120] or "—"),desc_for_field(col))
                for col,typ,constraint in meta["fields"]
            ])
            if meta["constraints"]:
                self.add("Các ràng buộc ở cấp bảng: "+"; ".join(x[:210] for x in meta["constraints"][:6])+".")
            self.add("Khi cập nhật bảng "+name+", service cần kiểm tra quyền và điều kiện nghiệp vụ trước khi ghi. Các ràng buộc kiểu dữ liệu, NOT NULL, FK và UNIQUE ở PostgreSQL là tầng bảo vệ bổ sung nhằm hạn chế dữ liệu không hợp lệ khi có nhiều request cùng lúc.")
        self.h2("4.7. Ràng buộc, chỉ mục và trigger")
        parts=[]
        for f in sorted((BASE/"database/migrations").glob("*.sql")):
            s=f.read_text(encoding="utf-8")
            for x in re.findall(r"(?im)^\s*CREATE\s+(?:UNIQUE\s+)?INDEX\s+[^;]+;",s):
                parts.append((f.name,x.strip()))
        for i,(f,s) in enumerate(parts[:32],1):
            if not self.can(40+i):continue
            self.h3(f"4.7.{i}. Chỉ mục theo {f}")
            self.code(s,max_lines=5)
            self.add("Chỉ mục này nằm trong migration thực tế. Khi đánh giá ảnh hưởng cần xem nó phục vụ truy vấn nào, có ngăn trùng dữ liệu hay không và chi phí cập nhật khi có đăng ký đồng thời.")
        self.h2("4.8. Truy vấn đối chiếu bất biến dữ liệu")
        for i,(topic,sql,meaning) in enumerate([
          ("Số vé hợp lệ theo suất","SELECT ma_suat, count(*) FROM ve WHERE trang_thai = 'CHUA_SU_DUNG' GROUP BY ma_suat;",
           "Dùng để đối chiếu với suc_chua của suat_su_kien sau các lượt đăng ký và phân bổ."),
          ("Đăng ký còn hiệu lực","SELECT ma_suat, ma_nguoi_dung, count(*) FROM dang_ky WHERE trang_thai IN ('CHO_PHAN_BO','DANH_SACH_CHO','DA_XAC_NHAN') GROUP BY ma_suat, ma_nguoi_dung HAVING count(*) > 1;",
           "Kết quả rỗng là bằng chứng không có đăng ký trùng theo tiêu chí truy vấn này."),
          ("Danh sách chờ theo suất","SELECT d.ma_suat, m.thu_tu, d.ma_nguoi_dung FROM muc_danh_sach_cho m JOIN dang_ky d ON d.ma_dang_ky=m.ma_dang_ky ORDER BY d.ma_suat,m.thu_tu;",
           "Sắp xếp giúp kiểm tra quy tắc xử lý người chờ theo thứ tự."),
        ],1):
            self.h3(f"4.8.{i}. {topic}")
            self.code(sql,max_lines=4)
            self.add(meaning+" Cần kiểm tra lại điều kiện trạng thái với migration hiện hành trước khi dùng làm kết luận nghiệm thu; đây là câu truy vấn minh họa cách đối chiếu, không phải kết quả thực thi.")
    def code(self,s,max_lines=13):
        p=self.doc.add_paragraph()
        p.paragraph_format.space_before=Pt(3);p.paragraph_format.space_after=Pt(6)
        p.paragraph_format.left_indent=Cm(.25)
        r=p.add_run("\n".join(s.splitlines()[:max_lines]))
        r.font.name="Consolas";r.font.size=Pt(8.4)
        r.font.color.rgb=RGBColor(28,59,67)
        return p
    def ch5(self):
        self.h2("5.11. Phân rã thành phần trong mã nguồn")
        for i,(rel,explain) in enumerate(SERVICE_DESCRIPTIONS.items(),1):
            if not self.can(30+i):continue
            s=read("backend/src/"+rel)
            methods=re.findall(r"\b(?:private\s+|public\s+|protected\s+)?(?:async\s+)?([A-Za-z]\w*)\s*\([^\n]*\)\s*(?::[^{\n]+)?\s*\{",s)
            self.h3(f"5.11.{i}. {rel}")
            self.add(explain)
            self.t(["Nội dung đọc từ mã nguồn","Mô tả"],[
             ("Tệp triển khai",rel),
             ("Một số phương thức","; ".join(methods[:12]) or "Kiểm tra trực tiếp tệp TS."),
             ("Vai trò trong kiến trúc","Service hoặc helper do module NestJS sử dụng."),
             ("Đối chiếu PTTK","Use Case → lớp nghiệp vụ → dữ liệu và trạng thái."),
            ])
            important=[x.strip() for x in s.splitlines() if any(y in x for y in ["FOR UPDATE","this.db.transaction","@Roles(","newCode()","lotteryOrder(","appendAudit(","this.jwt.signAsync","assertCheckinScope"])]
            if important:
                self.add("Các chi tiết kỹ thuật đáng chú ý, trích theo dòng mã nguồn thực tế:")
                self.code("\n".join(important[:7]),max_lines=7)
            self.add("Phần kiểm tra của thành phần này phải bao gồm quyền truy cập, điều kiện trạng thái và kết quả cuối cùng. Giải thích trên không khẳng định mọi nhánh lỗi đã được nghiệm thu thủ công trên Windows.")
        self.h2("5.12. Danh sách API xác định trực tiếp từ controller")
        groups=endpoint_routes()
        for i,(f,eps) in enumerate(groups,1):
            if not self.can(35+i):continue
            self.h3(f"5.12.{i}. Các endpoint của {f}")
            if eps:
                self.t(["Phương thức","Đường dẫn","Hàm điều khiển"],eps)
                self.add("Đường dẫn trên được trích từ decorator Controller và method tại "+f+". Controller xử lý transport/guard rồi chuyển logic sang service. Các đường dẫn này được ưu tiên hơn tài liệu API baseline cũ nếu có chênh lệch khi code.")
            else:
                self.add("Không thấy decorator endpoint GET/POST/PATCH/PUT/DELETE phù hợp với bộ phân tích hiện tại; tra cứu trực tiếp trong tệp nguồn để xác định.")
        self.h2("5.13. Quy trình triển khai môi trường phát triển")
        commands=[
           ("Kiểm tra Git và Docker","git status\ndocker compose version","Bảo đảm đúng nhánh, đúng thư mục và Docker Desktop đang chạy."),
           ("Khởi động cơ sở dữ liệu và migrate","docker compose up -d --build","Compose chờ db khỏe trước khi migrate và chạy backend/frontend."),
           ("Kiểm tra trạng thái dịch vụ","docker compose ps\ndocker compose logs --tail=60 backend","Kiểm tra backend có kết nối PostgreSQL, không kết luận chỉ bằng giao diện."),
           ("Kiểm tra health","curl http://localhost:3001/health","Trạng thái backend và database cần phù hợp với dữ liệu thực."),
           ("Đọc schema migration","docker compose exec db psql -U med06 -d med06 -c '\\dt'","Cần dùng đúng các biến môi trường trong .env, không tự suy đoán tài khoản DB."),
           ("Dừng dịch vụ","docker compose down","Không thêm -v nếu muốn giữ dữ liệu trong volume."),
        ]
        for i,(name,c,meaning) in enumerate(commands,1):
            if not self.can(40+i):continue
            self.h3(f"5.13.{i}. {name}")
            self.code(c,max_lines=5)
            self.add(meaning+" Khi trình bày bằng chứng, ghi rõ thời điểm và môi trường chạy. Các câu lệnh là hướng dẫn, không phải đầu ra đã được thực thi trong thời điểm lập báo cáo.")
        self.h2("5.14. Ma trận kiểm thử, kết quả mong đợi và mức bằng chứng")
        md=read("docs/MED06_TEST_CASES.md")
        tests=[r for r in rows_of(md) if re.match(r"TC\d+",r[0])]
        self.t(["Mã","Nghiệp vụ","Mong đợi","Nguồn"],tests)
        self.source("docs/MED06_TEST_CASES.md")
        for i,case in enumerate(tests,1):
            if not self.can(23+i):continue
            cid,feature,expected,status=case[:4]
            self.h3(f"5.14.{i}. {cid} – {feature}")
            self.t(["Hạng mục","Nội dung"],[
              ("Mục tiêu kiểm tra",feature+"."),
              ("Dữ liệu và điều kiện","Thiết lập trạng thái phù hợp với chức năng tại "+cid+"; dùng tài khoản/thực thể kiểm thử riêng."),
              ("Thao tác","Gọi API hoặc thao tác giao diện tương ứng, đồng thời quan sát CSDL nếu tình huống làm thay đổi dữ liệu."),
              ("Kết quả mong đợi",expected+"."),
              ("Nguồn kiểm chứng ghi trong dự án",status),
              ("Bằng chứng cần đối chiếu",evidence_for_test(feature)),
            ])
            self.add("Kết quả được ghi ở ma trận trên là kỳ vọng hoặc đánh dấu nguồn kiểm thử của dự án; chưa thể suy ra trường hợp này đã được chụp ảnh nghiệm thu trên máy của sinh viên. Khi bổ sung ảnh, cần giữ nguyên thông số đầu vào và kết quả để người chấm có thể kiểm chứng.")
        self.h2("5.15. Liên hệ nghiệp vụ, thành phần kỹ thuật và ràng buộc")
        self.t(["Nghiệp vụ","Module có trách nhiệm","Cơ chế bảo vệ"],[
          ("Đăng ký tài khoản","AuthService; PostgreSQL","Băm mật khẩu, vai trò mặc định, email duy nhất."),
          ("Công bố sự kiện","ManagementService","Ownership và đủ suất hợp lệ."),
          ("FCFS","RegistrationsService","Khóa suất, sức chứa và unique."),
          ("Lottery/MIXED","AllocationsService","Đợt duy nhất, bốc thăm có thông tin kiểm chứng."),
          ("Hủy và đôn chờ","RegistrationsService","Một transaction để thu hồi và cấp tiếp."),
          ("Check-in","CheckinService, StaffService","Phân công theo suất, khóa vé, chống quét trùng."),
          ("Ảnh bìa","MediaService","Kiểm tra MIME, lưu khóa ảnh trong DB."),
          ("ADMIN","AdminService, audit","Kiểm tra quyền và ghi nhật ký."),
        ])
    def ch6(self):
        self.h2("6.7. Mô tả trường dữ liệu và điều kiện hiển thị")
        for i,(no,name,fields,meaning) in enumerate(FORMS,1):
            if not self.can(42+i):continue
            self.h3(f"6.7.{i}. {name}")
            self.t(["Thành phần","Mô tả"],[
              ("Màn hình",name),
              ("Dữ liệu chính",fields),
              ("Mục tiêu",meaning),
              ("Trạng thái có thể gặp","Đang tải, có kết quả, rỗng, thiếu quyền hoặc lỗi điều kiện nghiệp vụ."),
              ("Dữ liệu từ backend","Sự kiện, đăng ký, vé, phân công hoặc tài khoản tương ứng."),
              ("Kiểm thử UI","Thao tác bằng bàn phím; thông báo rõ ràng; đối chiếu dữ liệu thực và trạng thái API."),
            ])
            self.add("Thiết kế "+no+" không sử dụng số thống kê hoặc QR demo làm dữ liệu thật. Những hình ở chương VI mô tả bố cục theo mockup; ảnh chạy sản phẩm chỉ bổ sung sau khi đã chụp và xác minh được.")
    def ch7(self):
        self.h2("7.5. Đối chiếu yêu cầu của giảng viên và thành phần báo cáo")
        self.t(["Yêu cầu trong video hướng dẫn","Vị trí trình bày","Cách đối chiếu"],[
          ("Khảo sát, nhiệm vụ, yêu cầu và biểu mẫu","Chương I","Khảo sát quy trình, 5 vai trò, FR/BR và BM."),
          ("Mô hình UC, Actor, đặc tả UC","Chương II","Hình tổng quát, phân rã và 15 đặc tả."),
          ("Phân tích lớp, trạng thái, tuần tự","Chương III","Hình UML gốc kèm diễn giải trạng thái."),
          ("Sơ đồ logic và thành phần dữ liệu","Chương IV","ERD và bảng cột/ràng buộc từ migration."),
          ("Kiến trúc, thành phần và cách triển khai","Chương V","NestJS/Next.js, service/controller, API, thử nghiệm."),
          ("Thiết kế giao diện theo biểu mẫu","Chương VI","12 ảnh UI gốc, bảng màn hình và luồng thao tác."),
          ("Môi trường, kết quả và hướng phát triển","Chương VII","Đối chiếu thành quả và giới hạn."),
        ])
        self.add("Việc có đủ các mục nói trên không tự động đồng nghĩa tất cả testcase đã được chứng minh bằng ảnh. Ảnh sản phẩm thật là minh chứng cần tách khỏi hình thiết kế. Không dùng tài khoản thật, mật khẩu, token truy cập hoặc mã QR có hiệu lực trong phần phụ lục.")

    def ch4_more(self):
        self.h2("4.9. Thiết kế giao dịch theo các trường hợp sử dụng")
        specs=[
          ("Nhận đăng ký FCFS",
           "Khóa tài khoản hiện tại và suất được chọn, sau đó kiểm tra lại trạng thái, thời gian và số vé. Nếu còn chỗ thì ghi đăng ký được xác nhận và phát một vé; nếu hết chỗ thì tạo vị trí chờ. Thao tác tạo đăng ký cùng phát vé phải hoàn thành hoặc hoàn tác cùng nhau.",
           "Số vé CHUA_SU_DUNG không vượt suc_chua; không có hai đăng ký hợp lệ cùng tài khoản và suất."),
          ("Nhận yêu cầu chờ bốc thăm",
           "Kiểm tra cửa sổ nhận đăng ký rồi lưu bản ghi CHO_PHAN_BO. Không cấp vé ngay ở bước này. Đăng ký đủ điều kiện chỉ được đưa vào tập ứng viên khi bốc thăm sau hạn đóng.",
           "Không có vé trước thời điểm phân bổ; người tham dự nhìn thấy trạng thái đang chờ."),
          ("Chạy đợt Lottery",
           "Khóa suất, kiểm tra chưa có đợt phân bổ đã hoàn tất, lấy các đăng ký hợp lệ. Thứ tự lựa chọn dựa trên thuật toán trong module allocations và ghi lại dữ liệu đủ để đối chiếu.",
           "Số vé và người trúng không vượt hạn mức còn lại; không chạy lại đợt của cùng suất."),
          ("Hủy và đôn người chờ",
           "Kiểm tra lượt đăng ký có thuộc tài khoản hay không, suất chưa bắt đầu và vé chưa dùng. Nếu vé đang có hiệu lực, vô hiệu hóa rồi tìm mục chờ đầu tiên hợp lệ để cấp lại trong cùng transaction.",
           "Một vị trí vừa được giải phóng không bị hai giao dịch cùng cấp cho hai người."),
          ("Quét QR tại cổng",
           "Nhân viên chọn đúng suất được phân công, backend tìm vé theo mã và suất. Trước khi chuyển trạng thái, service kiểm tra tình trạng sự kiện, thời gian, quyền và bản ghi quét cũ.",
           "Một mã vé chỉ được ghi nhận Check-in thành công đúng một lần."),
          ("Thay đổi thời gian suất",
           "Thực hiện điều kiện đổi lịch, lưu lịch cũ và lý do thay đổi theo migration 008. Thông báo lại ngày giờ thực tế trên trang chi tiết và thông tin của người đã đăng ký.",
           "Mốc đăng ký và giờ bắt đầu suất vẫn hợp lệ sau thay đổi."),
        ]
        for i,(name,flow,assertion) in enumerate(specs,1):
            self.h3(f"4.9.{i}. {name}")
            self.t(["Pha giao dịch","Nội dung"],[
             ("Dữ liệu đầu vào",name+"."),
             ("Tổ chức xử lý",flow),
             ("Điều kiện nhất quán",assertion),
             ("Cách truy vết","Xem migration liên quan, bản ghi nghiệp vụ và nhật ký theo thời điểm; không dựa riêng vào màu thông báo trên web."),
            ])
            self.add("Thiết kế giao dịch này tách điều kiện thuộc service khỏi điều kiện dữ liệu thuộc PostgreSQL. Ràng buộc SQL giữ bất biến ngay cả khi nhiều lời gọi API đến đồng thời; service chịu trách nhiệm thông báo cho người dùng bằng lời dễ hiểu.")
        self.h2("4.10. Ma trận ánh xạ quy tắc với bảng PostgreSQL")
        self.t(["Quy tắc","Bảng liên quan","Tình huống phải từ chối"],[
          ("Không tạo đăng ký trùng","dang_ky, nguoi_dung","Một người đăng ký hai lần khi lượt đầu vẫn hiệu lực."),
          ("Không phát vé quá chỗ","suat_su_kien, ve, dang_ky","Hai người cùng đăng ký lúc chỉ còn một chỗ."),
          ("Mỗi đăng ký được phát tối đa một vé","ve, dang_ky","Lệnh cấp vé chạy lại khi người dùng refresh."),
          ("Check-in một lần","ve, ban_ghi_check_in","Mã QR xuất trình lần hai."),
          ("Một suất có chính sách rõ ràng","chinh_sach_phan_bo, suat_su_kien","Thiếu policy nhưng yêu cầu phân bổ."),
          ("Chỉ nhân viên đúng suất","phan_cong_check_in, suat_su_kien","Nhân viên cố quét vé ngoài phạm vi."),
          ("Hủy có thể đôn chờ","muc_danh_sach_cho, ve, dang_ky","Đôn hai người cùng một chỗ được trả về."),
          ("Kiểm chứng bốc thăm","dot_phan_bo, ket_qua_phan_bo","Chạy lại phân bổ sau khi chốt."),
          ("Xét duyệt quyền tổ chức","yeu_cau_to_chuc, nguoi_dung_vai_tro","Tự cấp quyền khi chưa được phê duyệt."),
        ])
    def ch5_more(self):
        self.h2("5.16. Tổ chức trang giao diện trong Next.js")
        pages=sorted((BASE/"frontend/app").rglob("page.tsx"))
        for i,f in enumerate(pages,1):
            if not self.can(55+i):continue
            rel=f.relative_to(BASE).as_posix()
            url="/"+"/".join(f.parent.relative_to(BASE/"frontend/app").parts)
            url=url.replace("/[id]","/:id")
            if url=="/.":url="/"
            source=f.read_text(encoding="utf-8")
            api_refs=sorted(set(re.findall(r"['\"](/(?:auth|events|manage|admin|registrations|tickets|checkin|account)[^'\"\s]*)['\"]",source)))
            titles=re.findall(r"<h[12][^>]*>([^<]{3,80})",source)
            self.h3(f"5.16.{i}. Trang {url}")
            self.t(["Thành phần","Kiểm tra từ mã nguồn"],[
              ("Tệp Next.js",rel),
              ("Đường dẫn",url),
              ("Nhiệm vụ giao diện",self._page_meaning(url)),
              ("Tham chiếu nội bộ",", ".join(api_refs[:8]) if api_refs else "API được gọi thông qua service/helper hoặc component con."),
              ("Tiêu đề hiển thị",", ".join(titles[:3]) if titles else "Thành phần tiêu đề nằm trong JSX/component khác."),
            ])
            self.add("Khi kiểm thử trang "+url+", cần kiểm tra điều hướng, trạng thái đang tải, xử lý trả lỗi và xác thực vai trò từ API. Cấu trúc trang không đủ để suy ra rằng dữ liệu đã được lưu hoặc nghiệp vụ đã chạy thành công.")
        self.h2("5.17. Các tầng bảo vệ người dùng và dữ liệu")
        defenses=[
          ("Xác thực","JwtAuthGuard bảo vệ tuyến yêu cầu đăng nhập; backend xác định tài khoản từ thông tin phiên, không dựa vào tên người dùng từ HTML."),
          ("Phân quyền","RolesGuard chặn tài khoản không có role phù hợp; service còn kiểm tra sự kiện thuộc phạm vi tổ chức hay không."),
          ("Chống trùng","Unique constraint trong migration và khóa dữ liệu khi đăng ký giúp tránh lỗi hai lời gọi cùng cấp một suất."),
          ("Chống phát quá sức chứa","Khóa suất khi tính số vé và trigger/chỉ mục CSDL hỗ trợ bảo vệ giới hạn."),
          ("Kiểm tra Check-in","Chỉ nhân viên đúng suất được phân công mới có thể xác thực vé tại cổng."),
          ("Bảo mật mã","QR chứa mã định danh vé có thể kiểm tra nhưng không được ghi vào audit log dưới dạng rõ."),
          ("Hạn chế gọi dồn","Guard theo tài khoản cho nghiệp vụ đăng ký nhằm hạn chế spam đơn giản."),
          ("Ảnh tải lên","Cần kiểm tra MIME, giới hạn kích thước và không tin tên file do người dùng cung cấp."),
        ]
        for i,(name,content) in enumerate(defenses,1):
            if not self.can(65+i):continue
            self.h3(f"5.17.{i}. {name}")
            self.add(content+" Nếu chỉ ẩn nút ở giao diện mà không kiểm tra lại trong API thì một yêu cầu tự tạo vẫn có thể vượt qua. Vì vậy việc kiểm tra cần nằm ở nhiều lớp phù hợp.")
            self.t(["Kiểm tra quan trọng","Bằng chứng cần đối chiếu"],[
              ("Mã nguồn","Tìm guard/service/SQL có liên quan trong nhánh med06-code."),
              ("Trạng thái HTTP","Quan sát trường hợp hợp lệ và bị từ chối."),
              ("CSDL","Đọc trạng thái trước/sau trong môi trường thử nghiệm."),
              ("Bảo mật ảnh chụp","Che token, mã QR có hiệu lực và khóa bí mật trước khi đưa vào báo cáo."),
            ])
        self.h2("5.18. Các bước trình diễn sản phẩm MED-06")
        steps=[
          ("Chuẩn bị tài khoản", "Khởi động frontend/backend, kiểm tra kết nối; chuẩn bị vai trò ADMIN, Organizer, Attendee và nhân viên Check-in."),
          ("Tạo sự kiện và suất","Tạo chương trình nháp, nhập dữ liệu địa điểm/suất, chọn chính sách, công bố sau khi hợp lệ."),
          ("Đăng ký FCFS cạnh tranh","Mở hai phiên người dùng, chọn suất sức chứa 1, gửi đăng ký gần đồng thời và kiểm tra đúng một vé."),
          ("Kiểm tra danh sách chờ","Hủy vé chưa dùng của người được xác nhận và theo dõi người kế tiếp được đôn chờ."),
          ("Bốc thăm Lottery","Đối chiếu suất đóng đăng ký, xác nhận tập ứng viên và một lần phân bổ; không bốc thăm lại."),
          ("Vé QR và Check-in","Hiển thị mã QR tại /tickets, quét hoặc nhập mã dự phòng, chứng minh lượt đầu thành công và lượt sau bị từ chối."),
          ("Quản trị hệ thống","Tìm người dùng, xét duyệt quyền tổ chức và xem nhật ký thao tác."),
          ("Kiểm tra vận hành","Xem health API, Docker container và các nhóm ràng buộc trong PostgreSQL."),
        ]
        for i,(name,body) in enumerate(steps,1):
            if not self.can(70+i):continue
            self.h3(f"5.18.{i}. {name}")
            self.add(body)
            self.t(["Nội dung báo cáo","Mô tả"],[
              ("Mục đích minh chứng",name),
              ("Điều kiện hoàn thành","Có thao tác thành công hoặc bị từ chối đúng như quy tắc đã thiết kế."),
              ("Cần chụp khi nghiệm thu","Màn hình trước/sau thao tác và trạng thái liên quan; không dùng số liệu của mockup."),
              ("Kết quả đã xác minh trong tài liệu","Chỉ kiểm thử đánh dấu CI trong docs/MED06_TEST_CASES.md; các bước thao tác thật cần chụp riêng."),
            ])
        self.h2("5.19. Quan hệ giữa thiết kế và cài đặt")
        self.t(["Nguồn thiết kế","Thành phần mã nguồn","Chứng cứ xác minh"],[
          ("Use Case đăng nhập","AuthController, AuthService","Route HTTP và session có kiểm tra tài khoản."),
          ("Use Case tạo sự kiện","ManagementController, ManagementService","Sự kiện nháp và quy tắc công bố."),
          ("Sequence đăng ký","RegistrationsService","Khóa suất, tạo đăng ký, cấp vé/đưa vào chờ."),
          ("Sequence Lottery","AllocationsService","Tạo đợt, sắp thứ tự, phát vé đúng hạn mức."),
          ("Sequence Check-in","CheckinService, StaffService","Đúng suất, chống dùng lặp và bản ghi kết quả."),
          ("ERD/SQL","database/migrations/*.sql","PK, FK, UNIQUE, INDEX, trigger và transaction."),
          ("Thiết kế giao diện","frontend/app/**/page.tsx","Các trang theo vai trò và trạng thái."),
        ])
    def _page_meaning(self,url):
        if url in ("/","/."):return "Khám phá, tìm kiếm và điều hướng đến sự kiện."
        if "/events/" in url:return "Chi tiết sự kiện, suất và thao tác đăng ký."
        if "/tickets" in url:return "Quản lý vé QR và lịch sử."
        if "/registrations" in url:return "Theo dõi trạng thái tham dự và danh sách chờ."
        if "/organizer" in url:return "Tổ chức chương trình, suất và phân bổ."
        if "/checkin" in url:return "Xác minh vé theo suất được phân công."
        if "/admin" in url:return "Quản trị hệ thống, tài khoản hoặc nhật ký."
        if "/account" in url:return "Thông tin tài khoản, đăng nhập hoặc tạo tài khoản."
        return "Trang nghiệp vụ trong hệ thống MED-06."
    def ch7_more(self):
        self.h2("7.6. Đánh giá mức độ đáp ứng các mục tiêu của đồ án")
        checks=[
          ("Quản lý các suất văn hóa","Mã nguồn có route quản lý sự kiện, địa điểm và các khung giờ; cần ảnh chụp xác nhận thao tác quản trị."),
          ("Nhận đăng ký miễn phí","Có module đăng ký và luồng hiển thị trạng thái; cần đối chiếu với bản ghi thật."),
          ("Phân bổ vé có giới hạn","Mã nguồn dùng hai cơ chế FCFS/Lottery và bổ sung MIXED; phép kiểm chính là số vé hợp lệ không vượt sức chứa."),
          ("Danh sách chờ có thứ tự","Dữ liệu chờ có thứ tự trong cơ sở dữ liệu và nghiệp vụ đôn người chờ khi có chỗ."),
          ("Check-in chống trùng","Có ràng buộc một lượt thành công, cần thử quét lặp bằng cùng vé."),
          ("Phân quyền theo vai trò","Guards và kiểm tra ownership có trong backend; thao tác quản trị cần tài khoản đủ quyền."),
          ("Accessibility","Sự kiện có đặc tính tiếp cận được xác nhận và bộ lọc công khai."),
          ("Theo dõi và truy vết","Các thao tác quan trọng có audit log; dữ liệu bí mật không được đưa vào nhật ký."),
        ]
        self.t(["Mục tiêu","Căn cứ đối chiếu"],checks)
        for i,(name,contents) in enumerate(checks,1):
            if not self.can(55+i):continue
            self.h3(f"7.6.{i}. {name}")
            self.add(contents)
            self.add("Khi đánh giá nghiệm thu, đối tượng được kiểm tra phải tách thành ba mức: bản thiết kế đã xây dựng, mã nguồn/CI có thể chạy, và bằng chứng vận hành thực tế do người thực hiện thu thập. Báo cáo này không đồng nhất ba mức đó.")
        self.h2("7.7. Bài học thiết kế và hướng bảo trì")
        self.t(["Vấn đề đã gặp","Kinh nghiệm sử dụng cho MED-06"],[
          ("Sơ đồ khác cấu trúc triển khai","Theo dõi migration và mô tả phần thay đổi thay vì sửa im lặng tài liệu gốc."),
          ("Thông tin trạng thái gây nhầm lẫn","Chuyển mã kỹ thuật thành thông báo rõ bằng tiếng Việt ở UI."),
          ("Nhiều vai trò trong một tài khoản","Kiểm tra cả roles lẫn ownership/phạm vi suất."),
          ("Cấp vé cạnh tranh","Đặt kiểm tra và cập nhật trong transaction cùng các bất biến ở DB."),
          ("Tham chiếu ảnh","Lưu khóa ảnh ngoài database, kiểm tra MIME và tách ảnh demo."),
          ("Minh chứng chưa đủ","Lưu kịch bản thử, dữ liệu thử và kết quả thật trước khi đánh dấu hoàn thành."),
        ])
        self.add("Định hướng tiếp theo là cải thiện kiểm thử tích hợp, tăng độ ổn định khi nhiều người đăng ký đồng thời và xác nhận tính dễ sử dụng trên điện thoại. Các hoạt động này phải được phân biệt với chức năng đã có trong mã hiện hành.")

    def appendix_a(self):
        self.h2("Phụ lục A. Ma trận truy vết yêu cầu – Use Case – kiểm thử")
        self.add("Ma trận gồm đủ 24 yêu cầu chức năng. Tên module được viết tắt để bảng tra cứu gọn; testcase là mốc kiểm tra, không phải xác nhận PASS.")
        links=[
         ("FR-01","UC01, UC02","Auth","TC04–TC06"),
         ("FR-02","UC15","Roles/Admin","TC07, TC19"),
         ("FR-03","UC03","Events","TC21"),
         ("FR-04","UC04","Events","TC21"),
         ("FR-05","UC09, UC11","Management","TC08, TC09"),
         ("FR-06","UC10","Management","TC08–TC09"),
         ("FR-07","UC10, UC12","Management","TC14–TC16"),
         ("FR-08","UC05","Registrations","TC10, TC12"),
         ("FR-09","UC05","Registrations","TC11"),
         ("FR-10","UC05, UC07","Registrations","TC10, TC12"),
         ("FR-11","UC05, UC12","Register/Allocate","TC14"),
         ("FR-12","UC12, UC13","Allocations","TC14, TC15"),
         ("FR-13","UC05, UC08","Registrations","TC10, TC13"),
         ("FR-14","UC07, UC08","Registrations","TC12–TC14"),
         ("FR-15","UC06","Registrations","TC13"),
         ("FR-16","UC06, UC07","Registrations","TC13"),
         ("FR-17","UC14","Check-in","TC17"),
         ("FR-18","UC14","Check-in","TC18"),
         ("FR-19","UC10","Management","TC20–TC21"),
         ("FR-20","UC03","Events","TC21"),
         ("FR-21","UC05","Throttle","TC11"),
         ("FR-22","UC13","Insights","TC12–TC18"),
         ("FR-23","UC15","Admin","TC07, TC19"),
         ("FR-24","UC12","Allocate/Audit","TC14–TC16"),
        ]
        self.t(["Yêu cầu","Use Case liên quan","Thành phần cần đối chiếu","Testcase tham chiếu"],links)
        self.add("Phương pháp đọc: chọn một yêu cầu, kiểm tra Use Case thể hiện mục tiêu đó, tìm controller/service có trách nhiệm, xem migration bảo vệ trạng thái và chạy testcase tương ứng. Khi thiếu một khâu, yêu cầu chưa thể coi là đã được chứng minh đầy đủ.")
    def appendix_b(self):
        self.h2("Phụ lục B. Bộ minh chứng nghiệm thu sản phẩm thực tế")
        self.add("Hình PTTK và mockup trong các chương trước không được thay cho ảnh sản phẩm đã chạy. Danh sách dưới đây là kế hoạch thu thập bằng chứng trên máy Windows; khi chưa có ảnh, báo cáo không đánh dấu là đã chụp.")
        photo=[
         ("B01","Khởi động dịch vụ và health","Docker Compose, frontend/backend/db, phản hồi /health","Chưa đính kèm"),
         ("B02","Đăng nhập và phân quyền","Tài khoản mới chỉ là Attendee; thử truy cập ADMIN","Chưa đính kèm"),
         ("B03","Tạo sự kiện và cấu hình suất","Sự kiện nháp, giờ, địa điểm, sức chứa, policy","Chưa đính kèm"),
         ("B04","Công bố khi hợp lệ","Màn hình sự kiện có suất và trạng thái DA_CONG_BO","Chưa đính kèm"),
         ("B05","Đăng ký FCFS cạnh tranh","Hai phiên đăng ký chỗ cuối cùng, một vé và một chờ","Chưa đính kèm"),
         ("B06","Hủy và đôn danh sách chờ","Trạng thái hai tài khoản trước/sau hủy","Chưa đính kèm"),
         ("B07","Bốc thăm Lottery","Đợt phân bổ sau hạn đóng; số vé và danh sách chờ","Chưa đính kèm"),
         ("B08","Vé QR hợp lệ","Trang vé với thông tin suất; không lộ mã thật trong báo cáo","Chưa đính kèm"),
         ("B09","Check-in lần đầu","Phản hồi được chấp nhận và vé DA_SU_DUNG","Chưa đính kèm"),
         ("B10","Check-in lặp lại","Từ chối với cùng mã, chỉ một lượt thành công","Chưa đính kèm"),
         ("B11","Tìm kiếm và tiếp cận","Lọc sự kiện theo đặc tính đã xác nhận","Chưa đính kèm"),
         ("B12","Quản trị và audit","Đổi role, khóa tài khoản, nội dung nhật ký dễ đọc","Chưa đính kèm"),
         ("B13","Ảnh sự kiện","Ảnh bìa trên chi tiết và thẻ khám phá","Chưa đính kèm"),
         ("B14","Sao lưu và DB","Tệp sao lưu có dữ liệu; schema vẫn còn sau restart","Chưa đính kèm"),
        ]
        self.t(["Mã","Nội dung","Cần chứng minh","Tình trạng"],photo)
        self.add("Quy tắc an toàn: trước khi chụp, che mật khẩu, access token, mã QR còn hiệu lực và khóa dịch vụ lưu ảnh. Ảnh của tài khoản cá nhân trong demo phải có quyền sử dụng. Mỗi bằng chứng cần ghi nguồn thao tác và thời điểm để đối chiếu trạng thái cuối.")
