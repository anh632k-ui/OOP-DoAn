#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Báo cáo đồ án MED-06: dựng Word từ ảnh gốc trong draw_doan."""
from pathlib import Path
import re
import zipfile
from datetime import date
from PIL import Image
from docx import Document
from docx.shared import Cm, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.enum.style import WD_STYLE_TYPE
from docx.enum.text import WD_LINE_SPACING
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "reports" / "MED06_BaoCao_DoAn.docx"
DRAW = ROOT / "draw_doan"
LAYOUT = DRAW / "giaodien"

PTTK_LABELS = {
 1:"Use Case tổng quát",
 2:"Use Case phân rã – Đăng ký tham dự",
 3:"Use Case phân rã – Quản lý sự kiện",
 4:"Use Case phân rã – Phân bổ vé",
 5:"Use Case phân rã – Hủy và danh sách chờ",
 6:"Use Case phân rã – Check-in vé",
 7:"Class Diagram phân tích",
 8:"State Diagram – Đăng ký",
 9:"State Diagram – Vé",
 10:"State Diagram – Suất sự kiện",
 11:"Sequence – Đăng ký suất",
 12:"Sequence – Phân bổ FCFS",
 13:"Sequence – Phân bổ Lottery",
 14:"Sequence – Hủy và xét danh sách chờ",
 15:"Sequence – Check-in vé",
 16:"Sequence – Công bố sự kiện",
 17:"Class Diagram thiết kế chi tiết",
 18:"Class chức năng – Quản lý sự kiện",
 19:"Class chức năng – Đăng ký suất",
 20:"Class chức năng – Phân bổ vé",
 21:"Class chức năng – Danh sách chờ",
 22:"Class chức năng – Check-in",
 23:"Activity – Đăng ký và phân bổ vé",
 24:"Activity – Hủy và xử lý danh sách chờ",
 25:"Activity – Check-in vé",
 26:"ERD – Cơ sở dữ liệu PostgreSQL",
 27:"Architecture – Kiến trúc triển khai",
}
UI_LABELS = {
 0:"Hệ thống màn hình và Design System",
 1:"Trang chủ và khám phá sự kiện",
 2:"Chi tiết sự kiện và chọn suất",
 3:"Đăng nhập và đăng ký tài khoản",
 4:"Đăng ký của tôi và theo dõi trạng thái",
 5:"Ví vé điện tử, mã QR và lịch sử",
 6:"Ban tổ chức – Dashboard",
 7:"Ban tổ chức – Quản lý sự kiện và suất",
 8:"Ban tổ chức – Phân bổ vé và danh sách chờ",
 9:"Nhân viên Check-in – Quét vé",
 10:"Quản trị viên – Dashboard riêng",
 11:"Quản trị viên – Tài khoản, phân quyền và nhật ký",
}
D_ANALYSIS = {
 1:("Sơ đồ tổng quát xác định ranh giới của hệ thống và cách các actor tham gia các nghiệp vụ. Guest chủ yếu khám phá sự kiện; người tham dự gửi đăng ký, theo dõi vé; Ban tổ chức quản lý sự kiện; nhân viên check-in kiểm tra vé; quản trị viên giám sát toàn hệ thống.",
    "Các quan hệ trong Use Case thể hiện quyền tương tác của actor với chức năng, không đồng nghĩa một actor được truy cập mọi đường dẫn ứng dụng. Quyền phải được kiểm tra lại tại backend."),
 2:("Đăng ký suất được phân rã thành xác thực người dùng, kiểm tra điều kiện của suất, ngăn trùng, xác định chính sách phân bổ và cập nhật kết quả. Luồng không phát vé ngay nếu đăng ký đang chờ Lottery.",
    "Điều kiện chính gồm trạng thái tài khoản, cửa sổ nhận đăng ký, số suất còn chỗ và nguyên tắc mỗi tài khoản chỉ có một đăng ký còn hiệu lực trên mỗi suất."),
 3:("Nhóm chức năng tổ chức bao gồm tạo sự kiện nháp, khai báo thông tin, bổ sung suất, cấu hình chính sách, kiểm tra tính hợp lệ rồi công bố. Suất có thời gian, địa điểm và sức chứa riêng.",
    "Trạng thái tạm ngưng là phần mở rộng của quá trình phát triển. Khi sự kiện không nhận đăng ký mới, dữ liệu vé và đăng ký đã phát sinh vẫn phải được bảo toàn."),
 4:("Nghiệp vụ phân bổ tách việc thiết lập chính sách với việc chạy thuật toán. FCFS xác nhận khi đăng ký; Lottery được xử lý sau khi đóng đăng ký; MIXED phân vùng sức chứa giữa hai phần.",
    "Trước khi cấp vé, hệ thống cần khóa tài nguyên liên quan và xác định số chỗ còn lại. Sau khi bốc thăm, kết quả cần có nhật ký để truy vết."),
 5:("Luồng hủy đăng ký phân biệt các trường hợp đang chờ, đã được xác nhận và vé đã sử dụng. Khi một vé hợp lệ được hủy trước suất, suất có thể giải phóng một chỗ cho người đầu danh sách chờ.",
    "Thao tác hủy và đôn người chờ cần nằm trong cùng giao dịch để không sinh thêm hai vé hợp lệ cho một chỗ."),
 6:("Nhân viên check-in lựa chọn suất được phân công, quét QR hoặc nhập mã dự phòng. Backend đối chiếu đúng suất, trạng thái vé, thời gian và lịch sử đã quét.",
    "Chỉ lượt quét đầu tiên hợp lệ mới chuyển vé sang đã sử dụng; các lượt kiểm tra sau phải trả kết quả từ chối rõ ràng."),
 7:("Class Diagram phân tích thể hiện các thực thể cốt lõi: người dùng, sự kiện, suất, đăng ký, danh sách chờ, chính sách phân bổ, vé và bản ghi check-in.",
    "Các lớp ở mức phân tích tập trung vào thuộc tính và quan hệ nghiệp vụ, chưa ràng buộc bởi cấu trúc controller hoặc câu lệnh SQL."),
 8:("Vòng đời đăng ký thể hiện sự khác nhau giữa chờ phân bổ, đã xác nhận, danh sách chờ, từ chối và đã hủy.",
    "Thay đổi trạng thái cần được kiểm soát từ service; không được tùy ý chuyển một lượt đã kết thúc thành vé hợp lệ."),
 9:("Vé có các trạng thái sử dụng và vô hiệu. Khi check-in thành công, vé được tiêu thụ và không thể dùng lần hai.",
    "Lịch sử vé vẫn được giữ lại sau khi bị hủy hoặc sử dụng để phục vụ đối chiếu."),
 10:("Suất sự kiện có giai đoạn soạn, mở đăng ký, đóng đăng ký, hoàn tất và hủy. Thời gian hiện tại kết hợp trạng thái là điều kiện quyết định một hành động có hợp lệ không.",
    "Trạng thái suất cần thống nhất với trạng thái sự kiện: một suất không nên tiếp nhận đăng ký khi sự kiện đang tạm ngưng hoặc đã hủy."),
 11:("Sequence chỉ ra thứ tự tương tác từ giao diện tới API, service và kho dữ liệu khi nhận đăng ký một suất.",
    "Điểm trọng tâm là kiểm tra trùng và kiểm tra sức chứa trong giao dịch, không tách lệnh kiểm tra và cấp vé thành hai thao tác thiếu khóa."),
 12:("Với FCFS, thứ tự tiếp nhận có vai trò quyết định. Người đăng ký khi còn chỗ được xác nhận và phát vé; khi hết chỗ thì được đưa vào danh sách chờ.",
    "Kết quả của FCFS không phụ thuộc vào tác vụ bốc thăm cuối kỳ. Cơ sở dữ liệu cần giới hạn số vé hợp lệ không vượt sức chứa."),
 13:("Lottery tập hợp những đăng ký hợp lệ sau khi đóng đăng ký, rút thứ tự và phân vé theo số chỗ có thể cấp.",
    "Kết quả bốc thăm lưu thông tin lượt rút và dữ liệu phục vụ tái kiểm tra. Tính công bằng còn phụ thuộc cách quản lý seed và thời điểm công bố seed."),
 14:("Sequence hủy và đôn chờ gồm xác nhận quyền sở hữu, vô hiệu vé cũ, tìm bản ghi chờ đầu tiên và cấp vé mới.",
    "Toàn bộ cụm thao tác thuộc một giao dịch để tránh tình trạng người chờ được cấp nhưng vé cũ chưa bị vô hiệu."),
 15:("Sequence check-in diễn tả nhân viên gọi API xác minh vé, cơ sở dữ liệu khóa bản ghi vé và ghi nhận kết quả quét.",
    "Ràng buộc duy nhất cho lần check-in thành công kết hợp với cập nhật trạng thái vé bảo vệ nghiệp vụ chống quét trùng."),
 16:("Công bố sự kiện không đơn thuần đổi trạng thái. Hệ thống phải kiểm tra thông tin sự kiện, có suất hợp lệ và cấu hình thời gian cần thiết.",
    "Quyền công bố thuộc người tổ chức sở hữu sự kiện hoặc quản trị viên được cấp phép, không phụ thuộc nút bấm ở frontend."),
 17:("Class Diagram thiết kế chi tiết bổ sung phương thức và phân tách trách nhiệm nhằm hiện thực các quy tắc nghiệp vụ.",
    "Lớp thực thể và lớp dịch vụ có vai trò khác nhau: thực thể biểu diễn trạng thái, service điều phối giao dịch và truy cập dữ liệu."),
 18:("Chức năng quản lý sự kiện phân biệt màn hình, lớp điều khiển nghiệp vụ và các entity Sự kiện, Suất, Địa điểm và Đặc tính tiếp cận.",
    "Quan hệ Sự kiện–Suất là một–nhiều; Suất tham chiếu Địa điểm; sự kiện liên kết nhiều đặc tính tiếp cận thông qua bảng trung gian."),
 19:("Chức năng đăng ký liên kết màn hình người tham dự với service nhận đăng ký, thực thể đăng ký, vé và suất.",
    "Khi triển khai cần tránh để giao diện quyết định trạng thái sau đăng ký; backend trả về trạng thái thực tế."),
 20:("Lớp chức năng phân bổ đặt chính sách và thao tác phân bổ trong service có thể thay đổi thuật toán theo cấu hình của suất.",
    "Phần mở rộng MIXED phải xử lý nhất quán hạn mức FCFS và số lượng còn lại dành cho Lottery, không vượt tổng sức chứa."),
 21:("Class chức năng danh sách chờ thể hiện quan hệ giữa đăng ký chưa được cấp vé và vị trí chờ.",
    "Thứ tự chờ phải ổn định; khi bản ghi đầu được đôn, những người còn lại được hiển thị thứ tự mới mà không cần thay đổi khóa ưu tiên gốc."),
 22:("Chức năng Check-in bao gồm nhân viên, suất được phân công, vé và bản ghi kết quả.",
    "Phân quyền Check-in theo suất là điều kiện bổ sung quan trọng so với việc chỉ xác thực vai trò."),
 23:("Activity mô tả các nhánh quyết định trong quá trình đăng ký: còn chỗ, hết chỗ, chờ bốc thăm và kết thúc phân bổ.",
    "Biểu đồ hoạt động giúp nhận biết trường hợp cần trả trạng thái chờ thay vì tạo vé ngay."),
 24:("Quá trình hủy kiểm tra các điều kiện trước khi cập nhật dữ liệu, sau đó xử lý danh sách chờ khi có chỗ trống.",
    "Một nhánh kết thúc sớm dành cho lượt chờ không có vé; một nhánh xử lý thu hồi vé và đôn chờ khi đăng ký đã được xác nhận."),
 25:("Activity Check-in kiểm tra suất, mã vé, tính hợp lệ và trạng thái đã sử dụng để quyết định chấp nhận hay từ chối.",
    "Luồng từ chối cần có lý do để nhân viên xử lý tại cổng, trong khi thông tin nhạy cảm của mã vé không được ghi vào nhật ký công khai."),
 26:("ERD mô tả các nhóm bảng tài khoản–quyền, sự kiện–suất, đăng ký–chính sách, phân bổ–hàng chờ và vé–Check-in.",
    "ERD là mốc phân tích dữ liệu. Các migration triển khai bổ sung bảng phân công Check-in và yêu cầu Ban tổ chức, do đó bản vẽ gốc và CSDL cuối cùng cần được đối chiếu theo bảng thay đổi."),
 27:("Kiến trúc triển khai sử dụng Next.js cho giao diện, NestJS xử lý API nghiệp vụ, PostgreSQL lưu giao dịch và dịch vụ lưu ảnh tương thích S3.",
    "Docker Compose tạo môi trường vận hành gồm frontend, backend, db, migrate; dịch vụ lưu trữ ảnh có profile riêng. Các thành phần trao đổi qua mạng dịch vụ nội bộ."),
}
UI_ANALYSIS = {
 0:"Bộ quy chuẩn mô tả vai trò người dùng, hệ màu chính, nhịp khoảng cách và thông điệp trạng thái. Đây là chuẩn đối chiếu cho giao diện triển khai.",
 1:"Trang chủ làm nổi bật chủ đề văn hóa, cung cấp tìm kiếm theo tên/nội dung, lọc tiếp cận và các thẻ sự kiện. Dữ liệu sự kiện thực tế phải lấy từ API, không dùng số liệu minh họa.",
 2:"Trang chi tiết gắn thông tin sự kiện với những suất có lịch, địa điểm và sức chứa riêng. Thao tác đăng ký chỉ được kích hoạt theo quy tắc nghiệp vụ.",
 3:"Thiết kế minh họa đăng nhập và tạo tài khoản ở hai cột. Trong sản phẩm, hai biểu mẫu có thể tồn tại ở hai đường dẫn riêng nhưng cần chung phong cách và xác thực từ backend.",
 4:"Người tham dự theo dõi được các trạng thái đã xác nhận, chờ phân bổ, danh sách chờ và lịch sử. Thông báo trạng thái phải khớp kết quả cấp vé trong CSDL.",
 5:"Vé điện tử chứa QR, tên sự kiện, địa điểm, thời gian và trạng thái. QR minh họa trong mockup không được dùng làm vé thật; mã được sinh từ backend.",
 6:"Dashboard Ban tổ chức tổng hợp sự kiện, suất, đăng ký và Check-in thuộc quyền quản lý. Số liệu không được lấy từ mẫu thiết kế để hiển thị giả.",
 7:"Màn hình quản lý sự kiện tổ chức thành danh sách bên trái và chi tiết bên phải, hạn chế dồn nhiều biểu mẫu vào một trang dài.",
 8:"Phần phân bổ làm rõ chính sách của suất, số lượt hợp lệ, số vé cấp và danh sách chờ. Trường hợp MIXED được bổ sung vào giao diện sau giai đoạn thiết kế ban đầu.",
 9:"Giao diện Check-in ưu tiên thao tác quét QR, có phương án nhập mã thủ công và hiển thị kết quả theo từng suất nhân viên được giao.",
 10:"Dashboard quản trị theo dõi tình hình người dùng, sự kiện, suất và các công việc cần xử lý; nội dung phải dựa trên dữ liệu thật từ backend.",
 11:"Khu vực quản trị người dùng và nhật ký cần tìm kiếm, phân quyền, khóa tài khoản, giải thích thao tác dễ hiểu; không hiển thị JSON kỹ thuật cho người dùng cuối.",
}

def files_map(directory, pattern):
    result={}
    for p in directory.glob("*.png"):
        m=re.search(pattern, p.name)
        if m: result[int(m.group(1))]=p
    return result
PTTK=files_map(DRAW,r"MacDinh-(\d\d)")
UI=files_map(LAYOUT,r"ChuyenNghiep\.draw-(\d\d)")
assert sorted(PTTK)==list(range(1,28)), f"Missing source PTTK images: {sorted(PTTK)}"
assert sorted(UI)==list(range(12)), f"Missing source interface images: {sorted(UI)}"
assert len(PTTK)+len(UI)==39

doc=Document()
sec=doc.sections[0]
sec.page_width=Cm(21.0); sec.page_height=Cm(29.7)
sec.top_margin=Cm(2.35); sec.bottom_margin=Cm(2.15)
sec.left_margin=Cm(2.75); sec.right_margin=Cm(2.25)
sec.header_distance=Cm(1.05); sec.footer_distance=Cm(1.15)
body=doc.styles['Normal']
body.font.name="Times New Roman"; body.font.size=Pt(12)
body.paragraph_format.line_spacing=1.24
body.paragraph_format.space_after=Pt(6)
body.paragraph_format.widow_control=True
body.font.color.rgb=RGBColor(37,49,53)
for nm,size,before,after in [('Title',23,10,18),('Heading 1',17,15,12),('Heading 2',14,12,7),('Heading 3',12.5,9,5)]:
    st=doc.styles[nm]
    st.font.name="Times New Roman"; st.font.size=Pt(size); st.font.bold=True
    st.font.color.rgb=RGBColor(10,69,67)
    st.paragraph_format.space_before=Pt(before)
    st.paragraph_format.space_after=Pt(after)
    st.paragraph_format.keep_with_next=True
cap=doc.styles['Caption']
cap.font.name="Times New Roman"; cap.font.size=Pt(10.5)
cap.font.italic=True; cap.font.color.rgb=RGBColor(49,69,72)
cap.paragraph_format.alignment=WD_ALIGN_PARAGRAPH.CENTER
cap.paragraph_format.space_before=Pt(5); cap.paragraph_format.space_after=Pt(10)
cap.paragraph_format.keep_with_next=False

style=doc.styles.add_style("Source note",WD_STYLE_TYPE.PARAGRAPH)
style.base_style=body
style.font.name="Times New Roman"; style.font.size=Pt(9.5)
style.font.color.rgb=RGBColor(98,106,108)
style.paragraph_format.space_after=Pt(8)

def set_cell_shading(cell,fill):
    tcPr=cell._tc.get_or_add_tcPr()
    x=OxmlElement('w:shd'); x.set(qn('w:fill'),fill);tcPr.append(x)
def add_field(p,instruction,cached=""):
    begin=OxmlElement("w:r"); st=OxmlElement("w:fldChar"); st.set(qn("w:fldCharType"),"begin"); begin.append(st);p._p.append(begin)
    inst=OxmlElement("w:r"); it=OxmlElement("w:instrText"); it.set(qn("xml:space"),"preserve");it.text=" "+instruction+" ";inst.append(it);p._p.append(inst)
    sep=OxmlElement("w:r"); q=OxmlElement("w:fldChar");q.set(qn("w:fldCharType"),"separate");sep.append(q);p._p.append(sep)
    if cached: p.add_run(cached)
    end=OxmlElement("w:r"); e=OxmlElement("w:fldChar");e.set(qn("w:fldCharType"),"end");end.append(e);p._p.append(end)
def add_text(text="", bold_start=None, style=None):
    p=doc.add_paragraph(style=style)
    p.alignment=WD_ALIGN_PARAGRAPH.JUSTIFY
    if bold_start and text.startswith(bold_start):
        p.add_run(bold_start).bold=True;p.add_run(text[len(bold_start):])
    else:p.add_run(text)
    return p
def multi(text):
    for s in text.strip().split("\n"):
        if s.strip():add_text(s.strip())
index_headings=[]
index_bookmark_id=20
def bookmark(p,name):
    global index_bookmark_id
    index_bookmark_id+=1
    start=OxmlElement("w:bookmarkStart")
    start.set(qn("w:id"),str(index_bookmark_id))
    start.set(qn("w:name"),name)
    end=OxmlElement("w:bookmarkEnd")
    end.set(qn("w:id"),str(index_bookmark_id))
    p._p.insert(0,start)
    p._p.append(end)
def heading(s,level):
    p=doc.add_heading(s,level)
    name="bm_heading_"+str(len(index_headings)+1)
    bookmark(p,name)
    index_headings.append((level,s,name))
    return p
def h1(s):return heading(s,1)
def h2(s):return heading(s,2)
def h3(s):return heading(s,3)
def bullet(s):doc.add_paragraph(s,style='List Bullet')
def table(headers,rows,widths=None):
    t=doc.add_table(rows=1,cols=len(headers))
    t.style="Table Grid";t.alignment=WD_TABLE_ALIGNMENT.CENTER
    for i,header in enumerate(headers):
        c=t.rows[0].cells[i];c.text=str(header);set_cell_shading(c,"DAECE6")
        for r in c.paragraphs[0].runs:r.bold=True;r.font.size=Pt(10)
    for j,row in enumerate(rows):
        cells=t.add_row().cells
        for i,v in enumerate(row):
            cells[i].text=str(v)
            cells[i].vertical_alignment=WD_CELL_VERTICAL_ALIGNMENT.CENTER
            for p in cells[i].paragraphs:
                p.paragraph_format.space_after=Pt(2);p.paragraph_format.space_before=Pt(2)
                for r in p.runs:r.font.size=Pt(9.3)
            if j%2:set_cell_shading(cells[i],"F6FAF8")
    return t
figures=[]
def fig(path,label,source,notes=None):
    img=Image.open(path)
    iw,ih=img.size
    # A4 portrait inner width: 16 cm; height cap 16.2 cm
    width=min(16.0,16.2*iw/ih)
    p=doc.add_paragraph()
    p.alignment=WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.keep_with_next=True
    p.add_run().add_picture(str(path),width=Cm(width))
    capnum=len(figures)+1
    q=doc.add_paragraph(style='Caption')
    q.add_run("Hình ")
    add_field(q,"SEQ Hinh \\* ARABIC",str(capnum))
    q.add_run(" – "+label)
    bookmark(q,"bm_figure_"+str(capnum))
    figures.append((capnum,label,"bm_figure_"+str(capnum)))
    if notes:add_text(notes,style="Source note")
def pttk(n):
    x,y=D_ANALYSIS[n]
    fig(PTTK[n],PTTK_LABELS[n],"draw_doan")
    add_text(x);add_text(y)
def ui(n):
    fig(UI[n],UI_LABELS[n],"draw_doan/giaodien")
    add_text(UI_ANALYSIS[n])

# Cover
p=doc.add_paragraph();p.alignment=WD_ALIGN_PARAGRAPH.CENTER
p.paragraph_format.space_before=Pt(22);r=p.add_run("TRƯỜNG ĐẠI HỌC CÔNG NGHỆ TP. HỒ CHÍ MINH\nHUTECH");r.bold=True;r.font.size=Pt(15);r.font.color.rgb=RGBColor(10,72,68)
p=doc.add_paragraph();p.alignment=WD_ALIGN_PARAGRAPH.CENTER;p.paragraph_format.space_before=Pt(40)
r=p.add_run("BÁO CÁO ĐỒ ÁN MÔN HỌC");r.bold=True;r.font.size=Pt(19)
p=doc.add_paragraph();p.alignment=WD_ALIGN_PARAGRAPH.CENTER;p.paragraph_format.space_before=Pt(16)
r=p.add_run("PHÂN TÍCH VÀ THIẾT KẾ HƯỚNG ĐỐI TƯỢNG");r.bold=True;r.font.size=Pt(15)
p=doc.add_paragraph();p.alignment=WD_ALIGN_PARAGRAPH.CENTER;p.paragraph_format.space_before=Pt(35)
r=p.add_run("MED-06\nCỔNG QUẢN LÝ SỰ KIỆN VĂN HÓA\nVÀ VÉ MIỄN PHÍ");r.bold=True;r.font.size=Pt(23);r.font.color.rgb=RGBColor(7,87,81)
p=doc.add_paragraph();p.alignment=WD_ALIGN_PARAGRAPH.CENTER;p.paragraph_format.space_before=Pt(48)
r=p.add_run("Sinh viên thực hiện: Bùi Thế Anh\nMã số sinh viên: 1250080004\nLớp: 12_CNPM1");r.font.size=Pt(14)
p=doc.add_paragraph();p.alignment=WD_ALIGN_PARAGRAPH.CENTER;p.paragraph_format.space_before=Pt(55)
p.add_run("TP. Hồ Chí Minh, tháng 11 năm 2026")
doc.add_page_break()

h1("TÓM TẮT ĐỀ TÀI")
multi("""MED-06 là cổng quản lý sự kiện văn hóa và vé tham dự miễn phí. Hệ thống được xây dựng để giải quyết ba vấn đề liên quan chặt chẽ: số lượng vé hữu hạn, lựa chọn người nhận vé theo chính sách có thể kiểm chứng và xác minh vé khi vào cổng nhằm hạn chế sử dụng trùng.
Phạm vi nghiên cứu đi từ nhận diện actor, đặc tả Use Case, phân tích đối tượng, sơ đồ hoạt động – tương tác – trạng thái đến thiết kế cơ sở dữ liệu, kiến trúc triển khai và hệ thống màn hình. Phần hiện thực sử dụng NestJS, Next.js, PostgreSQL, Docker Compose và kho lưu trữ ảnh tương thích S3.
Tùy chính sách của từng suất, hệ thống xử lý đăng ký theo thứ tự đến trước (FCFS), bốc thăm sau khi đóng đăng ký (Lottery) hoặc kết hợp hai hình thức theo hạn mức (MIXED). Đăng ký chưa được cấp vé có thể nằm trong danh sách chờ; vé được phát có mã QR và chỉ được Check-in thành công một lần.
Báo cáo sử dụng bộ 27 sơ đồ PTTK và 12 bản thiết kế giao diện trong thư mục draw_doan ở nhánh main làm tài liệu thiết kế. Thông tin triển khai được đối chiếu với mã nguồn nhánh med06-code và các migration/testcase tương ứng. Những phép thử chỉ được trình bày đúng mức bằng chứng hiện có, không suy diễn từ giao diện minh họa sang kết quả kiểm thử sản phẩm thực tế.""")

doc.add_page_break()
h1("MỤC LỤC")
toc=doc.add_paragraph()
add_field(toc,'TOC \\o "1-3" \\h \\z \\u','')
doc.add_page_break()
h1("DANH MỤC HÌNH")
lof=doc.add_paragraph()
add_field(lof,'TOC \\h \\z \\c "Hinh"','')
doc.add_page_break()

from med06_deep_sections import Expansion
from med06_references import cite, bibliography
exp = Expansion(doc, h2, h3, add_text, table)

# Chapter I
h1("CHƯƠNG I. GIỚI THIỆU ĐỀ TÀI")
h2("1.1. Bối cảnh và bài toán")
multi("""Hoạt động văn hóa cộng đồng thường có số lượng người quan tâm lớn nhưng sức chứa địa điểm và số suất tham dự bị giới hạn. Nếu chỉ ghi nhận đăng ký thủ công, ban tổ chức gặp khó khăn trong việc xác định ai được nhận vé trước, kiểm soát số chỗ và giải thích kết quả phân bổ.
Với vé miễn phí, việc cấp phát còn phải bảo đảm không phát quá số chỗ; một người không thể nhận nhiều đăng ký còn hiệu lực cho cùng một suất; vé bị hủy hoặc đã sử dụng không thể tiếp tục được quét để vào cổng.
Một sự kiện có thể có nhiều suất ở các khung giờ hoặc địa điểm khác nhau. Vì vậy, đơn vị trực tiếp của bài toán đăng ký, sức chứa, chính sách và Check-in là suất sự kiện, không phải chỉ là sự kiện tổng quát.""")
h2("1.2. Mục tiêu")
for s in [
"Xây dựng điểm truy cập thống nhất để khách khám phá, lọc, xem thời gian và điều kiện tiếp cận của sự kiện.",
"Cho phép người tham dự đăng ký miễn phí, theo dõi kết quả, lịch sử, danh sách chờ và vé điện tử.",
"Hỗ trợ Ban tổ chức quản lý sự kiện, suất, địa điểm, chính sách phân bổ và trạng thái vận hành.",
"Bảo đảm kết quả phân bổ không vượt sức chứa và có dữ liệu nhật ký để kiểm chứng.",
"Cho phép nhân viên được phân công kiểm tra vé qua QR hoặc mã dự phòng, chống Check-in trùng.",
"Cung cấp quyền quản trị, nhật ký thao tác và cơ chế đề nghị trở thành Ban tổ chức.",
]:bullet(s)
h2("1.3. Phạm vi chức năng")
table(["Nhóm chức năng","Nội dung chính"],[
("Tài khoản","Đăng ký, đăng nhập, phân quyền và khóa/mở khóa tài khoản."),
("Khám phá","Danh sách sự kiện, tìm kiếm, lọc đặc tính tiếp cận và chi tiết suất."),
("Tổ chức","Tạo sự kiện nháp, quản lý địa điểm/suất, công bố, tạm ngưng, đổi lịch, hủy."),
("Phân bổ","FCFS, Lottery, MIXED, danh sách chờ, kết quả phân bổ và nhật ký."),
("Vé và Check-in","Vé QR, mã dự phòng, phân công Check-in, xác thực và từ chối vé sai."),
("Quản trị","Tổng quan số liệu, người dùng, xét duyệt quyền tổ chức và audit log.")
])
add_text("Ngoài phạm vi của phiên bản đồ án là bán vé trả phí, thanh toán trực tuyến, chuyển nhượng vé, nhận dạng khuôn mặt, AI chống bot và hạ tầng microservices phân tán. Hệ thống có cơ chế chống lạm dụng ở mức cơ bản, không tuyên bố chống mọi loại tấn công tự động.")
h2("1.4. Các nhóm người dùng")
table(["Actor","Phạm vi trách nhiệm","Giới hạn chính"],[
("Guest","Tìm kiếm, xem chi tiết, tạo tài khoản.","Không đăng ký suất khi chưa đăng nhập."),
("Attendee","Đăng ký, xem/hủy lượt, xem vé điện tử.","Không thay đổi chính sách phân bổ."),
("Organizer","Tạo sự kiện và quản lý các suất do mình phụ trách.","Không chỉnh sửa sự kiện ngoài quyền."),
("Check-in Staff","Quét mã, kiểm tra vé ở suất được phân công.","Không cấp quyền cho tài khoản khác."),
("Administrator","Quản trị tài khoản, giám sát sự kiện/nhật ký.","Các thao tác phải được ghi nhận.")
])
h2("1.5. Yêu cầu chức năng và phi chức năng")
multi("""Yêu cầu chức năng được tổ chức theo vòng đời từ khám phá sự kiện, nhận đăng ký, phân bổ, phát vé đến Check-in và quản trị. Trong thiết kế cơ sở, các yêu cầu FR-01 đến FR-24 phân chia theo thao tác tài khoản, quản lý suất, đăng ký, chống trùng, danh sách chờ, phân bổ và truy vết.
Các yêu cầu phi chức năng tập trung vào phân quyền ở API, mật khẩu dạng băm, tính nhất quán giao dịch, phòng ngừa phát vé vượt số chỗ, phản hồi đủ nhanh trong điều kiện đồ án, khả năng truy vết và sử dụng bằng bàn phím trên giao diện.
Ảnh bìa được lưu ở hệ thống lưu trữ đối tượng, PostgreSQL giữ khóa tham chiếu. Đây là cách tách dữ liệu nhị phân khỏi dữ liệu giao dịch, đồng thời tránh tăng kích thước bản ghi sự kiện khi dùng ảnh lớn.""")
h2("1.6. Các quy tắc nghiệp vụ cốt lõi")
table(["Mã","Quy tắc và ý nghĩa"],[
("BR01","Sự kiện có thể nháp khi chưa có suất; chỉ công bố khi có ít nhất một suất hợp lệ."),
("BR02","Sức chứa của suất phải dương; thời gian mở/đóng đăng ký phải phù hợp lịch suất."),
("BR03","Mỗi tài khoản chỉ có tối đa một đăng ký còn hiệu lực cho một suất."),
("BR04","FCFS xét theo thứ tự được hệ thống chấp nhận; hết chỗ thì chuyển danh sách chờ."),
("BR05","Lottery tập hợp đăng ký hợp lệ khi đóng đăng ký, sau đó phân bổ một lần."),
("BR06","MIXED phân chia hạn mức FCFS và Lottery nhưng tổng vé không vượt sức chứa."),
("BR07","Một đăng ký đã xác nhận có tối đa một vé; vé chưa được sử dụng có thể bị vô hiệu."),
("BR08","Vé Check-in thành công không được dùng lại; quét lặp phải bị từ chối."),
("BR09","Hủy một vé hợp lệ có thể đôn người đứng đầu danh sách chờ trong một giao dịch."),
("BR10","Ban tổ chức chỉ quản lý sự kiện thuộc phạm vi mình được cấp phép."),
])
h2("1.7. Phương pháp thực hiện")
add_text("Đề tài áp dụng quy trình phân tích – thiết kế hướng đối tượng: mô tả bài toán và tác nhân, xác định Use Case, phân rã các tình huống quan trọng, dựng mô hình lớp và trạng thái, mô tả tương tác theo sequence/activity, thiết kế bảng dữ liệu và kiến trúc triển khai, sau đó hiện thực và kiểm thử các bất biến. Khi thêm yêu cầu mới, cần rà soát ảnh hưởng đến mã nguồn, migration và các sơ đồ có liên quan.")

exp.ch1()

# Chapter II
h1("CHƯƠNG II. MÔ HÌNH USE CASE")
h2("2.1. Phạm vi hệ thống và Use Case tổng quát")
pttk(1)
h2("2.2. Danh sách Use Case")
table(["Mã","Tên Use Case","Actor chính"],[
("UC01","Đăng ký tài khoản","Guest"),("UC02","Đăng nhập","Guest"),
("UC03","Tìm kiếm/lọc sự kiện","Guest/Attendee"),("UC04","Xem chi tiết sự kiện","Guest/Attendee"),
("UC05","Đăng ký suất","Attendee"),("UC06","Hủy đăng ký","Attendee"),
("UC07","Xem đăng ký, chờ và kết quả","Attendee"),("UC08","Xem vé điện tử","Attendee"),
("UC09","Tạo/cập nhật sự kiện","Organizer"),("UC10","Quản lý suất và tiếp cận","Organizer"),
("UC11","Công bố/mở đăng ký","Organizer"),("UC12","Phân bổ vé","Organizer"),
("UC13","Thống kê và danh sách chờ","Organizer"),("UC14","Check-in vé","Check-in Staff"),
("UC15","Quản trị người dùng/giám sát","Administrator"),
])
h2("2.3. Phân rã Use Case đăng ký và tổ chức")
pttk(2);pttk(3)
h2("2.4. Phân rã phân bổ, hủy và Check-in")
pttk(4);pttk(5);pttk(6)
h2("2.5. Đặc tả Use Case trọng tâm")
for title,actor,pre,flow,alt,post in [
("UC05 – Đăng ký suất","Attendee","Tài khoản hoạt động; suất còn nhận đăng ký; chưa có lượt còn hiệu lực.",
"Chọn suất → xác thực và kiểm tra điều kiện → khóa suất trong giao dịch → ghi đăng ký → xét chính sách → trả trạng thái thực tế.",
"FCFS hết chỗ: vào danh sách chờ; Lottery: chờ phân bổ; tài khoản khóa, đăng ký trùng hoặc ngoài hạn: từ chối.",
"Không vượt sức chứa; không tạo hai đăng ký còn hiệu lực cho cùng suất."),
("UC06 – Hủy đăng ký","Attendee","Đúng người sở hữu; suất chưa bắt đầu; vé nếu có chưa dùng.",
"Kiểm tra điều kiện → khóa suất → chuyển đăng ký sang đã hủy → vô hiệu vé nếu có → tìm người chờ đủ điều kiện → đôn chờ và cấp vé.",
"Nếu đăng ký đang chờ thì không giải phóng chỗ; nếu không có người chờ thì kết thúc sau khi hủy.",
"Không còn vé hợp lệ thuộc đăng ký đã hủy; chỗ được xử lý nhất quán."),
("UC09 – Quản lý sự kiện","Organizer","Đã đăng nhập và có quyền tổ chức.",
"Tạo sự kiện nháp → khai báo thông tin, ảnh và đặc tính tiếp cận → bổ sung suất → kiểm tra dữ liệu → công bố khi hợp lệ.",
"Sự kiện thiếu suất hoặc thời gian không hợp lệ: không công bố; sự kiện đã công bố có thể được tạm ngưng theo quy tắc bổ sung.",
"Trạng thái và quyền sở hữu được lưu trong CSDL; lịch sử hành động quan trọng được ghi nhật ký."),
("UC12 – Phân bổ vé","Organizer/Hệ thống","Suất có chính sách Lottery hoặc MIXED; thời hạn đăng ký đã đóng.",
"Khóa suất → kiểm tra chưa chạy phân bổ → đọc ứng viên hợp lệ → tạo thứ tự bốc thăm → cấp vé đúng hạn mức → ghi người chờ và đợt phân bổ.",
"Bốc thăm lại hoặc không đủ điều kiện: từ chối; không có ứng viên: ghi nhận kết quả phù hợp mà không cấp vé giả.",
"Số vé hợp lệ không vượt sức chứa và kết quả có thể kiểm chứng qua nhật ký."),
("UC14 – Check-in","Check-in Staff","Có quyền trên suất được phân công; vé thuộc đúng suất và hợp lệ.",
"Chọn suất → quét/nhập mã → xác thực trong giao dịch → ghi bản ghi Check-in → chuyển vé sang đã sử dụng → trả thông báo.",
"Mã sai, vé vô hiệu, không đúng suất, quá khung giờ hoặc đã dùng: từ chối.",
"Tối đa một lượt Check-in thành công trên một vé."),
]:
 h3(title)
 table(["Thành phần đặc tả","Nội dung"],[("Actor",actor),("Tiền điều kiện",pre),("Luồng chính",flow),("Luồng thay thế/ngoại lệ",alt),("Hậu điều kiện",post)])

exp.ch2()

# Chapter III
h1("CHƯƠNG III. PHÂN TÍCH VÀ THIẾT KẾ HƯỚNG ĐỐI TƯỢNG")
h2("3.1. Mô hình lớp phân tích")
cite(add_text("Ký hiệu lớp, quan hệ liên kết, thành phần và mô hình tương tác được trình bày theo hệ thống khái niệm UML 2.5.1."),1)
pttk(7)
h2("3.2. Biểu đồ trạng thái")
for n in [8,9,10]:
 h3("3.2."+str(n-7)+". "+PTTK_LABELS[n]);pttk(n)
h2("3.3. Biểu đồ tuần tự")
for i,n in enumerate(range(11,17),1):
 h3("3.3."+str(i)+". "+PTTK_LABELS[n]);pttk(n)
h2("3.4. Biểu đồ hoạt động")
for i,n in enumerate(range(23,26),1):
 h3("3.4."+str(i)+". "+PTTK_LABELS[n]);pttk(n)
h2("3.5. Nguyên tắc thiết kế đối tượng")
multi("""Tách boundary, control/service và entity giúp giảm phụ thuộc giữa giao diện và quy tắc nghiệp vụ. Boundary nhận dữ liệu và hiển thị trạng thái; service xử lý trường hợp sử dụng và transaction; entity biểu diễn thông tin nghiệp vụ có định danh.
Tính đóng gói được thể hiện ở việc trạng thái đăng ký, vé và suất không được chuyển tùy tiện từ trang web. Từng trường hợp sử dụng phải đi qua các hàm nghiệp vụ và điều kiện chuyển trạng thái.
Đa hình ở mức chiến lược phân bổ cho phép thay đổi cách xét người nhận vé theo chính sách từng suất. Dù dùng FCFS, Lottery hay MIXED, số vé phát ra vẫn bị kiểm soát bởi cùng các bất biến trong CSDL.
Quan hệ composition giữa sự kiện và suất mang ý nghĩa vòng đời nghiệp vụ: suất phụ thuộc sự kiện để tồn tại một cách hợp lệ. Tuy nhiên không bắt buộc phải ánh xạ thành ON DELETE CASCADE trên khóa ngoại. Việc giữ lịch sử tham dự và vé dẫn tới lựa chọn chuyển trạng thái hủy thay vì xóa vật lý.""")

exp.ch3()

# Chapter IV
h1("CHƯƠNG IV. THIẾT KẾ DỮ LIỆU")
h2("4.1. Mô hình dữ liệu quan hệ")
pttk(26)
h2("4.2. Danh mục bảng nghiệp vụ")
table(["Nhóm dữ liệu","Bảng","Vai trò"],[
("Tài khoản","vai_tro; nguoi_dung; nguoi_dung_vai_tro","Danh mục vai trò, tài khoản, quan hệ nhiều–nhiều."),
("Sự kiện","dia_diem; su_kien; suat_su_kien","Thông tin sự kiện, địa điểm, lịch và sức chứa."),
("Tiếp cận","dac_tinh_tiep_can; su_kien_dac_tinh","Tập đặc tính được xác nhận gắn với sự kiện."),
("Phân bổ","chinh_sach_phan_bo; dang_ky; muc_danh_sach_cho","Chính sách, đăng ký và người chờ."),
("Kết quả","dot_phan_bo; ket_qua_phan_bo; ve","Đợt phân bổ, kết quả và vé hợp lệ."),
("Cửa vào","ban_ghi_check_in; phan_cong_check_in","Kết quả quét và phân công nhân viên theo suất."),
("Giám sát","nhat_ky_he_thong; yeu_cau_to_chuc","Lịch sử thao tác và yêu cầu xét duyệt quyền tổ chức."),
])
add_text("Migration 001_init.sql tạo 16 bảng nghiệp vụ nền tảng. Migration 006_checkin_assignments.sql bổ sung phan_cong_check_in; migration 010_organizer_applications.sql bổ sung yeu_cau_to_chuc. Như vậy bộ migration hiện có 18 bảng nghiệp vụ. Bảng schema_migrations phục vụ quản lý phiên bản lược đồ, không được tính vào ERD nghiệp vụ. Con số này phản ánh mã migration tại thời điểm đối chiếu, không thay thế bằng chứng chụp cấu trúc cơ sở dữ liệu đang chạy.")
h2("4.3. Khóa chính, khóa ngoại và ràng buộc quan trọng")
table(["Bảng","Khóa / ràng buộc","Mục đích"],[
("nguoi_dung","ma_nguoi_dung (PK); email duy nhất không phân biệt hoa/thường","Không tạo trùng email."),
("nguoi_dung_vai_tro","(ma_nguoi_dung, ma_vai_tro) (PK ghép)","Một người giữ nhiều vai trò, không gán lặp."),
("suat_su_kien","ma_suat (PK); FK ma_su_kien, ma_dia_diem","Mỗi suất thuộc sự kiện và địa điểm."),
("su_kien_dac_tinh","(ma_su_kien, ma_dac_tinh) (PK ghép)","Liên kết N–N."),
("dang_ky","ma_dang_ky (PK), chỉ mục UNIQUE có điều kiện","Không trùng đăng ký còn hiệu lực."),
("chinh_sach_phan_bo","ma_suat UNIQUE; phuong_thuc có CHECK","Mỗi suất một chính sách tại thời điểm hiện tại."),
("muc_danh_sach_cho","ma_dang_ky UNIQUE; thu_tu dương","Một lượt chờ cho mỗi đăng ký."),
("ve","ma_dang_ky UNIQUE; ma_xac_thuc UNIQUE","Mỗi đăng ký tối đa một vé."),
("ban_ghi_check_in","UNIQUE có điều kiện cho quét thành công","Một vé chỉ Check-in thành công một lần."),
("phan_cong_check_in","(ma_suat, ma_nguoi_dung) (PK ghép)","Phân quyền theo từng suất."),
("yeu_cau_to_chuc","ma_nguoi_dung UNIQUE","Một yêu cầu xét duyệt theo mô hình hiện tại."),
])
h2("4.4. Bảo đảm toàn vẹn và tính nhất quán")
cite(add_text("Việc khóa dòng dữ liệu FOR UPDATE ở PostgreSQL được dùng làm cơ sở để xử lý thao tác đồng thời trong giao dịch."),4)
multi("""Sức chứa được bảo vệ ở hai lớp. Backend khóa bản ghi suất trước khi xác nhận và phát vé; trigger trg_ve_capacity trong PostgreSQL kiểm tra số vé hợp lệ không vượt sức chứa. Trigger trg_suat_capacity chặn giảm sức chứa dưới số vé đã cấp.
Một vé được tiêu thụ trong giao dịch Check-in. Trigger trg_checkin_consume yêu cầu vé chưa sử dụng và cùng suất; chỉ mục uq_one_successful_checkin ngăn hai bản ghi thành công trên cùng một vé.
Danh sách chờ có khóa thứ tự thu_tu, trong khi trạng thái mục chờ phản ánh việc còn chờ, đã được đôn hay rút. Khi hủy đăng ký được xác nhận, hệ thống xử lý hủy vé và đôn người tiếp theo trong cùng transaction.
Nhật ký ghi lại thời điểm, loại hành động và dữ liệu giải thích ở JSONB, nhưng không nên lưu mật khẩu, token xác thực hoặc mã QR có thể sử dụng để vào cổng.""")
h2("4.5. Mở rộng lược đồ so với bản vẽ ban đầu")
table(["Migration","Thay đổi","Lý do"],[
("005","Bổ sung su_kien.anh_bia_key","Lưu tham chiếu ảnh bìa trong object storage."),
("006","Tạo bảng phan_cong_check_in","Giới hạn suất được nhân viên kiểm tra."),
("008","Bổ sung trường lịch cũ và lý do đổi lịch","Giúp người tham dự biết thay đổi thời gian."),
("009","Trạng thái TAM_NGUNG; chính sách MIXED; fcfsQuota","Mở rộng trạng thái sự kiện và phân bổ kết hợp."),
("010","Bảng yeu_cau_to_chuc","Người dùng gửi yêu cầu và ADMIN xét duyệt quyền tổ chức."),
])
add_text("Các thay đổi bổ sung này không tự sửa ảnh ERD gốc. Khi thuyết trình, cần phân biệt sơ đồ phân tích thiết kế ban đầu với cấu trúc vật lý đã cập nhật bởi migration. Cách làm này cho phép truy vết sự phát triển của hệ thống mà không xóa lịch sử thiết kế.")

exp.ch4()
exp.ch4_more()

# Chapter V
h1("CHƯƠNG V. THIẾT KẾ KIẾN TRÚC VÀ HIỆN THỰC")
h2("5.1. Kiến trúc hệ thống")
pttk(27)
h2("5.2. Công nghệ và trách nhiệm thành phần")
qp=add_text("Mô hình controller/provider của NestJS, cơ chế App Router trong Next.js và cách vận hành Docker Compose được đối chiếu với tài liệu chính thức của các công nghệ này.")
for item_no in [2,3,5]: cite(qp,item_no)
table(["Thành phần","Công nghệ","Chức năng"],[
("Frontend","Next.js và React","Hiển thị giao diện theo vai trò, gọi API, điều hướng."),
("Backend","NestJS và TypeScript","Xác thực, phân quyền, điều phối đăng ký, phân bổ, Check-in."),
("CSDL","PostgreSQL 16","Dữ liệu nghiệp vụ, giao dịch, khóa và ràng buộc."),
("Lưu ảnh","S3-compatible object storage (SeaweedFS trong Docker)","Lưu file ảnh bìa, DB chỉ giữ khóa ảnh."),
("Vận hành","Docker Compose","Chạy frontend, backend, db, migrate và profile storage."),
("Kiểm thử","Unit test, CI, script SQL/Python","Kiểm tra các bất biến, API và tích hợp dữ liệu."),
])
h2("5.3. Tổ chức nghiệp vụ ở backend")
multi("""Backend thực hiện kiểm tra ở tầng API và service, không tin dữ liệu role hoặc quyền sở hữu do frontend gửi lên. Xác thực phiên đăng nhập xác định người dùng; các route quản trị và quản lý sự kiện yêu cầu đúng vai trò.
Nghiệp vụ đăng ký nằm trong RegistrationsService; phân bổ có AllocationsService; Check-in kiểm tra vé và suất trong service phụ trách; phần ADMIN sử dụng service riêng để liệt kê, cấp quyền và lưu nhật ký.
Đối với suất Lottery và MIXED, backend có công việc kiểm tra định kỳ những suất đã đóng đăng ký cần bốc thăm. Quy tắc mỗi suất một lần bốc thăm kết hợp khóa giao dịch giúp hạn chế xử lý trùng khi nhiều yêu cầu xảy ra cùng lúc.""")
h2("5.4. Phân bổ vé theo FCFS, Lottery và MIXED")
h3("5.4.1. FCFS")
multi("""FCFS là cơ chế ưu tiên theo thứ tự yêu cầu hợp lệ đến hệ thống. Khi còn chỗ, đăng ký được xác nhận và phát vé ngay; nếu hết chỗ, người dùng chuyển vào danh sách chờ. Thời gian ở máy khách không quyết định thứ tự.
Để xử lý các đăng ký đồng thời, service phải dùng giao dịch và khóa dữ liệu suất. Nếu chỉ đọc số vé còn lại rồi ghi vé sau, hai yêu cầu có thể cùng thấy một chỗ trống và cùng được cấp vé; vì vậy cả kiểm tra lẫn phát vé phải được bảo vệ như một đơn vị nguyên tử.""")
h3("5.4.2. Lottery")
multi("""Với Lottery, việc gửi đăng ký thành công chỉ có nghĩa hệ thống tiếp nhận một ứng viên. Khi thời hạn đóng đăng ký đã đến, service lấy tập ứng viên hợp lệ, xếp thứ tự ngẫu nhiên theo thuật toán, cấp vé theo số chỗ còn lại và chuyển phần còn lại sang danh sách chờ.
Lịch sử rút và dữ liệu phục vụ kiểm chứng giúp quản trị viên rà soát được số ứng viên, số vé cấp và thứ tự người chờ. Việc lưu seed sau bốc thăm không tương đương với cơ chế cam kết seed công khai từ trước; báo cáo không tuyên bố tính công bằng đã được kiểm chứng độc lập ngoài phạm vi thử nghiệm.""")
h3("5.4.3. MIXED – phân bổ kết hợp")
multi("""MIXED cho phép một suất sử dụng hai cơ chế: một phần sức chứa dành cho FCFS và phần còn lại dành cho Lottery. Ví dụ với 100 chỗ và fcfsQuota bằng 50, tối đa 50 chỗ được xử lý theo thứ tự đến trước; các chỗ còn lại dành để xét trong đợt bốc thăm sau khi đóng đăng ký.
Hạn mức được lưu trong cấu hình chinh_sach_phan_bo.cau_hinh và được ràng buộc cơ bản ở migration 009. Phép tính số chỗ thực tế vẫn phải kiểm tra trạng thái vé hiện hữu, bởi việc hủy hoặc thay đổi trạng thái có thể làm số chỗ còn lại khác với con số cấu hình ban đầu.""")
h2("5.5. Tổ chức giao diện theo vai trò")
add_text("Giao diện người tham dự tập trung vào tìm kiếm, chọn suất, xem đăng ký và QR. Không gian Ban tổ chức có thống kê, danh sách sự kiện, suất, phân bổ, danh sách chờ và báo cáo. Khu vực Check-in ưu tiên thao tác quét và kết quả trả về. ADMIN dùng bảng người dùng, phân quyền, xét duyệt quyền tổ chức và nhật ký hoạt động. Tuy có điều hướng khác nhau, các route tương ứng vẫn phải được backend kiểm tra quyền.")
h2("5.6. Vận hành với Docker Compose")
multi("""Tệp docker-compose.yml khai báo dịch vụ db dùng PostgreSQL 16-alpine, migrate để áp dụng các phiên bản lược đồ, backend NestJS, frontend Next.js, profile seed cho dữ liệu minh họa và profile storage cho dịch vụ lưu trữ ảnh SeaweedFS.
Các dịch vụ có quan hệ phụ thuộc theo sức khỏe: migrate chỉ chạy khi db sẵn sàng, backend chờ migration hoàn tất, frontend chờ backend khỏe. PostgreSQL và kho ảnh dùng volume để không mất dữ liệu khi khởi động lại container thông thường.
Các địa chỉ localhost:3000 và localhost:3001 là cấu hình phục vụ môi trường triển khai đồ án trên máy cục bộ, không phải bằng chứng đã cấu hình tên miền và HTTPS phục vụ production.""")
h2("5.7. Kiểm thử và truy vết")
table(["Nhóm thử nghiệm","Mã tham chiếu","Bằng chứng được mô tả"],[
("Tài khoản, phân quyền","TC04–TC07, TC19","Đăng ký mặc định ATTENDEE, email trùng, đăng nhập sai, từ chối quyền."),
("Sự kiện và thời gian","TC08–TC09","Tạo nháp, từ chối công bố khi thiếu suất."),
("Đồng thời và FCFS","TC10–TC13","Không vượt sức chứa, ngăn trùng, danh sách chờ và đôn chờ."),
("Lottery","TC14–TC16","Bốc thăm một lần, kiểm chứng thứ tự và từ chối bốc thăm lại."),
("Check-in","TC17–TC18","Quét hợp lệ lần đầu, từ chối khi quét lần thứ hai."),
("Tìm kiếm/ảnh","TC20–TC23","Lọc theo đặc tính xác nhận và tải ảnh đúng loại."),
("Vận hành","TC01–TC03, TC24–TC25","Health, migration/seed idempotent, sao lưu và tính độc lập của DB."),
])
add_text("Ma trận docs/MED06_TEST_CASES.md ghi rõ nhiều trường hợp được thực hiện trong CI, đồng thời phân biệt các trường hợp cần chụp bằng chứng Windows thủ công. Kết quả CI không thể tự thay thế ảnh giao diện sản phẩm, thử camera thật, sao lưu trên máy hoặc thao tác nhiều trình duyệt tại thời điểm nghiệm thu.")
h2("5.8. Giới hạn và kiểm soát rủi ro")
multi("""Chống bot hiện tập trung vào giới hạn tần suất, kiểm tra trạng thái người dùng và chống đăng ký trùng; chưa thể coi là giải pháp chống bot toàn diện.
Kiểm tra QR trên trình duyệt phụ thuộc vào khả năng hỗ trợ camera và môi trường bảo mật. Đường nhập mã dự phòng là phương án vận hành thay thế, cần giữ nguyên mã thực khi sao chép.
Phần quản lý chứng cứ cần tránh đưa giá trị mã QR đang dùng, mật khẩu, JWT hoặc khóa object storage vào hình báo cáo. Những trường hợp chưa có ảnh xác thực từ sản phẩm không được ghi là đã nghiệm thu trên Windows.""")

h2("5.9. Sơ đồ lớp thiết kế chi tiết")
pttk(17)
h2("5.10. Thiết kế lớp cho từng chức năng")
for i,n in enumerate(range(18,23),1):
 h3("5.10."+str(i)+". "+PTTK_LABELS[n]);pttk(n)

exp.ch5()
exp.ch5_more()

# Chapter VI
h1("CHƯƠNG VI. THIẾT KẾ GIAO DIỆN")
h2("6.1. Nguyên tắc thiết kế")
multi("""Bộ giao diện định hướng giảm thời gian thao tác, làm rõ trạng thái đăng ký và không bắt người tham dự hiểu thuật ngữ kỹ thuật như FCFS hay Lottery. Thông báo hiển thị cần diễn giải thành đã có vé, chờ bốc thăm, danh sách chờ hoặc đã hủy.
Màu xanh đậm dùng cho điều hướng và nút chính, nền sáng hỗ trợ đọc nội dung, màu trạng thái dùng có chủ đích. Header, sidebar, thẻ và biểu mẫu cần nhất quán giữa các trang cùng vai trò.
Bản vẽ giao diện là mô hình trình bày. Website triển khai sử dụng dữ liệu được trả từ API; mọi số thống kê, tên sự kiện, lịch suất, QR và danh sách tài khoản thực tế phải lấy từ dữ liệu thật, không được thay bằng con số minh họa trong hình thiết kế.""")
ui(0)
h2("6.2. Giao diện người tham dự")
for n in range(1,6):
 h3("6.2."+str(n)+". "+UI_LABELS[n]);ui(n)
h2("6.3. Giao diện Ban tổ chức")
for n in range(6,9):
 h3("6.3."+str(n-5)+". "+UI_LABELS[n]);ui(n)
h2("6.4. Giao diện Check-in")
ui(9)
h2("6.5. Giao diện ADMIN")
ui(10);ui(11)
h2("6.6. Đối chiếu bản vẽ và sản phẩm hiện thực")
table(["Vấn đề","Quyết định thiết kế khi triển khai"],[
("Ảnh sự kiện","Ưu tiên ảnh bìa thật nếu đã tải lên; hình mặc định chỉ là phương án dự phòng."),
("Vé QR","Ảnh QR trong thiết kế là minh họa; khi chạy phải dùng mã từ API."),
("Trang đăng nhập","Có thể tách login/register thành hai route nhưng dùng chung hệ thiết kế."),
("Trạng thái đăng ký","Phân biệt chờ Lottery với danh sách chờ sau phân bổ."),
("ADMIN","Dùng bảng tìm kiếm, chi tiết thao tác dễ hiểu; không hiển thị JSON thô mặc định."),
("Đăng ký Ban tổ chức","Người tham dự có thể gửi yêu cầu, ADMIN xét duyệt trước khi cấp quyền."),
("MIXED","Bổ sung vào màn phân bổ, dù chưa thể hiện hết trong mockup ban đầu."),
])
add_text("Bộ 12 hình trong chương này là thiết kế màn hình, không phải ảnh chụp xác nhận sản phẩm đã chạy. Phần minh chứng chạy thực tế được hoàn thiện bằng ảnh thao tác riêng khi nghiệm thu sản phẩm.")

exp.ch6()

# Chapter VII
h1("CHƯƠNG VII. KẾT LUẬN")
h2("7.1. Kết quả đạt được")
multi("""Quá trình triển khai MED-06 đã đi qua các bước phân tích yêu cầu, mô hình Use Case, sơ đồ lớp và hành vi, thiết kế dữ liệu, kiến trúc nhiều tầng và thiết kế giao diện cho từng vai trò. Các thành phần cốt lõi của bài toán gồm sức chứa hữu hạn, phân bổ vé và xác minh vé đều có mô hình nghiệp vụ rõ ràng.
Mã nguồn được tổ chức theo NestJS cho backend, Next.js cho frontend, PostgreSQL cho dữ liệu giao dịch, Docker Compose cho môi trường chạy và kho lưu trữ ảnh tương thích S3. Các ràng buộc tránh phát vé vượt số chỗ và ngăn Check-in trùng được bảo vệ cả ở service lẫn cơ sở dữ liệu.
Đề tài thể hiện sự khác biệt giữa bản thiết kế ban đầu và những yêu cầu phát sinh khi hiện thực: tạm ngưng sự kiện, phân bổ MIXED, phân công Check-in theo suất và xét duyệt quyền Ban tổ chức. Những phần mở rộng này được lưu dấu qua migration và mã nguồn.""")
h2("7.2. Hạn chế")
multi("""Bộ sơ đồ PTTK gốc phản ánh mốc thiết kế; những bảng và trạng thái được bổ sung qua migration có thể chưa được đưa ngược lại hình ERD gốc. Vì vậy, muốn kết luận mức độ khớp tuyệt đối cần tiếp tục kiểm tra sai khác giữa hình vẽ, mã nguồn và lược đồ vật lý.
Tài liệu kiểm thử cung cấp ma trận và các lớp kiểm tra tự động, nhưng không thay cho bằng chứng nghiệm thu trực quan đầy đủ trên máy người dùng. Các chức năng phụ thuộc camera, nhiều phiên đăng ký đồng thời, sao lưu và phân quyền thực tế cần được chứng minh bằng lần chạy tại thời điểm nộp.
Đồ án mới cung cấp cơ chế chống lạm dụng cơ bản, chưa có hệ thống vận hành production với quy trình cảnh báo, bảo vệ hạ tầng và quản lý vòng đời khóa bí mật đầy đủ.""")
h2("7.3. Định hướng phát triển")
for s in [
"Hoàn thiện việc đối chiếu các sơ đồ với migration cuối cùng, nhất là trạng thái TAM_NGUNG và các bảng bổ sung.",
"Tăng mức độ kiểm thử tích hợp và đánh giá tính đúng đắn khi có nhiều yêu cầu đăng ký đồng thời.",
"Bổ sung quan trắc hệ thống, cơ chế sao lưu/phục hồi cả PostgreSQL lẫn kho lưu trữ ảnh.",
"Hoàn thiện trải nghiệm mobile, khả năng tiếp cận và thông báo rõ ràng cho người tham dự khi đổi lịch hoặc hủy.",
"Xem xét quy trình cam kết seed trước kỳ bốc thăm nếu hệ thống cần mức kiểm chứng công bằng cao hơn.",
]:bullet(s)
h2("7.4. Tài liệu sử dụng")
for v in [
"Kho ảnh PTTK và thiết kế giao diện: https://github.com/anh632k-ui/OOP-DoAn/tree/main/draw_doan",
"Mã nguồn triển khai: https://github.com/anh632k-ui/OOP-DoAn/tree/med06-code",
"Yêu cầu và đặc tả: PTTK/00_YeuCau/01-yeu-cau-nghiep-vu.md và PTTK/01_Actor_UseCase/02-use-case-specifications.md.",
"Migration dữ liệu: database/migrations/001_init.sql đến 010_organizer_applications.sql.",
"Ma trận kiểm thử: docs/MED06_TEST_CASES.md; tệp đối chiếu: docs/MED06_PTTK_TRACE.md.",
]:add_text(v)


exp.ch7()
exp.ch7_more()

bibliography(doc,h1,h2,table,add_text)
doc.add_page_break()
h1("PHỤ LỤC")
exp.appendix_a()

# Populate a single Word TOC field and a single Table-of-Figures field.
# These are cached, clickable field results, not separate hand-written lists.
from docx.enum.text import WD_TAB_ALIGNMENT, WD_TAB_LEADER
for label,size,bold in [
    ("Report TOC 1",9.5,True),("Report TOC 2",8.9,False),
    ("Report TOC 3",8.5,False),("Report TOF",9.2,False),
]:
    st=doc.styles.add_style(label,WD_STYLE_TYPE.PARAGRAPH)
    st.base_style=body;st.font.name="Times New Roman";st.font.size=Pt(size)
    st.font.bold=bold
    st.paragraph_format.space_after=Pt(0)
    st.paragraph_format.line_spacing=0.96

def add_hyperlink(p,text,anchor):
    h=OxmlElement("w:hyperlink")
    h.set(qn("w:anchor"),anchor)
    h.set(qn("w:history"),"1")
    r=OxmlElement("w:r")
    pr=OxmlElement("w:rPr")
    color=OxmlElement("w:color");color.set(qn("w:val"),"174D50");pr.append(color)
    r.append(pr)
    t=OxmlElement("w:t");t.text=text;r.append(t)
    h.append(r);p._p.append(h)

def populate_index(field_p,entries,kind):
    # Separate -> cached results in new paragraphs -> closing field.
    tail=field_p._p[-1]
    field_p._p.remove(tail)
    position=field_p._p
    for level,caption,anchor in entries:
        sty=("Report TOF" if kind=="fig" else "Report TOC "+str(level))
        p=doc.add_paragraph(style=sty)
        p.paragraph_format.keep_together=True
        p.paragraph_format.left_indent=Cm(0.4*(level-1) if kind!="fig" else 0)
        p.paragraph_format.tab_stops.add_tab_stop(
            Cm(15.5-0.4*(level-1)),WD_TAB_ALIGNMENT.RIGHT,WD_TAB_LEADER.DOTS)
        add_hyperlink(p,caption,anchor)
        p.add_run("\t")
        add_field(p,"PAGEREF "+anchor+" \\h","1")
        position.addnext(p._p)
        position=p._p
    # End the TOC/figure field in the last index row itself, avoiding
    # an otherwise empty trailing paragraph and unpredictable pagination.
    position.append(tail)

toc_entries=[]
live=False
for level,title,anchor in index_headings:
    if title.startswith("CHƯƠNG I. "):
        live=True
    if live:
        toc_entries.append((level,title,anchor))
populate_index(toc,toc_entries,"toc")
populate_index(lof,[(1,"Hình "+str(n)+" – "+label,anchor)
                    for n,label,anchor in figures],"fig")

# Running header/footer; page numbers only, without cover-specific special handling.
head=sec.header.paragraphs[0]
head.text="MED-06  |  Cổng quản lý sự kiện văn hóa và vé miễn phí"
head.alignment=WD_ALIGN_PARAGRAPH.RIGHT
for r in head.runs:r.font.name="Times New Roman";r.font.size=Pt(8.5);r.font.color.rgb=RGBColor(110,119,119)
foot=sec.footer.paragraphs[0];foot.alignment=WD_ALIGN_PARAGRAPH.CENTER
foot.add_run("MED-06  •  ")
add_field(foot,"PAGE","1")
for r in foot.runs:r.font.name="Times New Roman";r.font.size=Pt(9)

# Request Word field recalculation on open.
settings=doc.settings._element
update=OxmlElement('w:updateFields');update.set(qn('w:val'),'true');settings.append(update)
doc.core_properties.title="MED-06 – Báo cáo đồ án"
doc.core_properties.subject="Phân tích thiết kế hướng đối tượng – Cổng quản lý sự kiện văn hóa và vé miễn phí"
doc.core_properties.author="Bùi Thế Anh"
OUT.parent.mkdir(parents=True,exist_ok=True)
doc.save(OUT)

# Validate 39 original images embedded, no stand-in frames.
check=Document(OUT)
assert len(check.inline_shapes)==39, f"Embedded figures {len(check.inline_shapes)} != 39"
assert len(figures)==39
assert len([p for p in check.paragraphs if p.style.name=="Caption"])==39
assert len([p for p in check.paragraphs if p.style.name=="Heading 1"])>=10
assert OUT.stat().st_size>1_000_000, "File seems too small for a 39-figure report"
with zipfile.ZipFile(OUT) as z:
    media=[n for n in z.namelist() if n.startswith("word/media/")]
    assert len(media)==39, f"Only {len(media)} embedded media parts"
    xml=z.read("word/document.xml").decode('utf-8')
    assert 'TOC \\\\o' in xml or 'TOC \\o' in xml
    assert 'TOC \\\\h' in xml or 'TOC \\h' in xml
    assert 'SEQ Hinh' in xml
    assert not ('hãy chụp' in xml.lower() or 'vui lòng bổ sung' in xml.lower())
summary=(
    f"Ảnh nguồn PTTK: {len(PTTK)}/27\\n"
    f"Ảnh thiết kế giao diện: {len(UI)}/12\\n"
    f"Ảnh nhúng trong DOCX: {len(check.inline_shapes)}/39\\n"
    f"Chú thích hình: {len(figures)}\\n"
    f"Heading 1: {len([p for p in check.paragraphs if p.style.name=='Heading 1'])}\\n"
    f"File bytes: {OUT.stat().st_size}\\n"
    "Mục lục Word: TOC field; danh mục hình: TOC-c field; SEQ hình\\n"
    "Ảnh sản phẩm thực tế: không chèn vì chưa có bằng chứng chụp sản phẩm\\n"
)
(ROOT/"reports"/"QA_SUMMARY.txt").write_text(summary,encoding="utf-8")
print(summary)
