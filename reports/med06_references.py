# -*- coding: utf-8 -*-
"""Nguồn tham khảo chính thức và mã trường trích dẫn tương thích kiểu Zotero Word.

Không tự nhận một nguồn bên ngoài là kết quả kiểm thử hoặc mã nguồn MED-06.
"""
import json
from docx.shared import Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

SOURCES=[
 {"key":"OMG2017","type":"report","title":"OMG Unified Modeling Language (OMG UML), Version 2.5.1","issued":{"date-parts":[[2017]]},"author":[{"literal":"Object Management Group"}],"URL":"https://www.omg.org/spec/UML/2.5.1/PDF","text":"Object Management Group, OMG Unified Modeling Language (OMG UML), Version 2.5.1, 2017. https://www.omg.org/spec/UML/2.5.1/PDF"},
 {"key":"NESTJS","type":"webpage","title":"NestJS Documentation: Fundamentals","author":[{"literal":"NestJS"}],"URL":"https://docs.nestjs.com/fundamentals","text":"NestJS, Documentation: Fundamentals. https://docs.nestjs.com/fundamentals (truy cập 11/11/2026)."},
 {"key":"NEXTJS","type":"webpage","title":"Next.js Documentation","author":[{"literal":"Vercel"}],"URL":"https://nextjs.org/docs","text":"Vercel, Next.js Documentation. https://nextjs.org/docs (truy cập 11/11/2026)."},
 {"key":"POSTGRESQL","type":"webpage","title":"PostgreSQL 16: Explicit Locking","author":[{"literal":"PostgreSQL Global Development Group"}],"URL":"https://www.postgresql.org/docs/16/explicit-locking.html","text":"PostgreSQL Global Development Group, PostgreSQL 16 Documentation: Explicit Locking. https://www.postgresql.org/docs/16/explicit-locking.html (truy cập 11/11/2026)."},
 {"key":"DOCKER","type":"webpage","title":"Docker Compose Documentation","author":[{"literal":"Docker, Inc."}],"URL":"https://docs.docker.com/compose/","text":"Docker, Inc., Docker Compose Documentation. https://docs.docker.com/compose/ (truy cập 11/11/2026)."},
 {"key":"ZOTERO","type":"webpage","title":"Using the Zotero Word Plugin","author":[{"literal":"Corporation for Digital Scholarship"}],"URL":"https://www.zotero.org/support/word_processor_plugin_usage","text":"Zotero, Using the Zotero Word Plugin. https://www.zotero.org/support/word_processor_plugin_usage (truy cập 11/11/2026)."},
]
def _field(p,code,fallback):
    for flag in ["begin",None,"separate"]:
        r=OxmlElement("w:r")
        if flag:
            x=OxmlElement("w:fldChar");x.set(qn("w:fldCharType"),flag);r.append(x)
        else:
            x=OxmlElement("w:instrText");x.set(qn("xml:space"),"preserve");x.text=" "+code+" ";r.append(x)
        p._p.append(r)
    r=p.add_run(fallback)
    r.font.name="Times New Roman";r.font.size=Pt(10)
    end=OxmlElement("w:r");x=OxmlElement("w:fldChar");x.set(qn("w:fldCharType"),"end");end.append(x);p._p.append(end)

def cite(p,number):
    item=dict(SOURCES[number-1])
    key=item.pop("key")
    fallback=item.pop("text")
    data={"citationID":"MED06CITE"+str(number),"properties":{"formattedCitation":"["+str(number)+"]","plainCitation":"["+str(number)+"]","noteIndex":0},
          "citationItems":[{"id":key,"uris":[],"itemData":{"id":key,**item}}],
          "schema":"https://github.com/citation-style-language/schema/raw/master/csl-citation.json"}
    _field(p,"ADDIN ZOTERO_ITEM CSL_CITATION "+json.dumps(data,ensure_ascii=False,separators=(',',':')),"["+str(number)+"]")

def bibliography(doc,h1,h2,t,p):
    h1("TÀI LIỆU THAM KHẢO")
    p("Các tài liệu dưới đây được dùng để đối chiếu ký pháp UML, mô hình NestJS/Next.js, transaction PostgreSQL, Docker Compose và quy trình trích dẫn. Tất cả các đường dẫn đều là tài liệu công khai của tổ chức phát hành. Mã nguồn và tài liệu PTTK riêng của MED-06 đã được dẫn tại mục 7.4.")
    q=doc.add_paragraph()
    q.paragraph_format.space_after=Pt(4)
    field_payload={"uncited":[],"omitted":[],"custom":[]}
    # Bibliography is an active Word field; cached entries remain readable even without Zotero.
    begin=OxmlElement("w:r");ch=OxmlElement("w:fldChar");ch.set(qn("w:fldCharType"),"begin");begin.append(ch);q._p.append(begin)
    instr=OxmlElement("w:r");txt=OxmlElement("w:instrText");txt.set(qn("xml:space"),"preserve");txt.text=" ADDIN ZOTERO_BIBL "+json.dumps(field_payload)+" CSL_BIBLIOGRAPHY ";instr.append(txt);q._p.append(instr)
    sep=OxmlElement("w:r");ch=OxmlElement("w:fldChar");ch.set(qn("w:fldCharType"),"separate");sep.append(ch);q._p.append(sep)
    for i,src in enumerate(SOURCES,1):
        run=q.add_run("["+str(i)+"] "+src["text"])
        run.font.name="Times New Roman";run.font.size=Pt(10.5)
        run.add_break()
    end=OxmlElement("w:r");ch=OxmlElement("w:fldChar");ch.set(qn("w:fldCharType"),"end");end.append(ch);q._p.append(end)
    h2("Bảng thuật ngữ kỹ thuật dùng trong MED-06")
    t(["Thuật ngữ","Giải thích trong đồ án"],[
      ("FCFS","First Come, First Served – xác nhận theo thứ tự hệ thống tiếp nhận yêu cầu hợp lệ."),
      ("Lottery","Phân bổ bằng một lần bốc thăm sau khi đóng đăng ký."),
      ("MIXED","Kết hợp hạn mức FCFS với số chỗ dành cho Lottery."),
      ("Actor","Vai trò tương tác với hệ thống trong sơ đồ Use Case."),
      ("Use Case","Mục tiêu nghiệp vụ mà actor đạt được qua tương tác."),
      ("Entity","Thực thể dữ liệu có định danh và trạng thái."),
      ("Boundary","Thành phần giao diện/giao tiếp với người dùng."),
      ("Service","Lớp điều phối điều kiện và thao tác nghiệp vụ."),
      ("ERD","Entity Relationship Diagram – sơ đồ quan hệ dữ liệu."),
      ("PK / FK","Khóa chính / khóa ngoại của bảng."),
      ("Transaction","Nhóm thao tác dữ liệu bảo đảm commit hoặc rollback nhất quán."),
      ("Index","Cấu trúc hỗ trợ truy vấn hoặc cưỡng chế tính duy nhất."),
      ("QR","Mã ma trận dùng để đưa dữ liệu nhận diện vé vào luồng kiểm tra."),
      ("JWT","Token đăng nhập xác thực yêu cầu tới backend."),
      ("API","Giao diện giao tiếp giữa frontend và backend."),
      ("S3-compatible","Kho lưu trữ đối tượng theo giao thức tương thích Amazon S3."),
      ("UTC+7","Múi giờ hiển thị thời gian sự kiện tại Việt Nam."),
    ])
