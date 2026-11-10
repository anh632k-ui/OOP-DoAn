#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Ghi số trang thực vào kết quả hiển thị của các trường PAGEREF trong DOCX.
Các trường TOC, TOC-c và PAGEREF vẫn giữ nguyên để Word cập nhật được.
"""
from pathlib import Path
from tempfile import NamedTemporaryFile
from zipfile import ZipFile
from lxml import etree
import re
import unicodedata
import fitz

ROOT=Path(__file__).resolve().parent.parent
docx=ROOT/"reports/MED06_BaoCao_DoAn.docx"
pdf=ROOT/"reports/_render/MED06_BaoCao_DoAn.pdf"
W="{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
XMLNS={"w":"http://schemas.openxmlformats.org/wordprocessingml/2006/main"}

def normalize(text):
    return re.sub(r"\s+"," ",unicodedata.normalize("NFC",text).casefold()).strip()

with ZipFile(docx) as z:
    xml=z.read("word/document.xml")
root=etree.fromstring(xml)
refs={}
for p in root.findall(".//w:body/w:p",XMLNS):
    bookmarks=p.findall("w:bookmarkStart",XMLNS)
    for bm in bookmarks:
        name=bm.get(W+"name")
        if name and (name.startswith("bm_heading_") or name.startswith("bm_figure_")):
            txt="".join(t.text or "" for t in p.findall(".//w:t",XMLNS))
            refs[name]=txt

needed=set()
for el in root.findall(".//w:instrText",XMLNS):
    if el.text and "PAGEREF" in el.text:
        m=re.search(r"PAGEREF\s+(bm_(?:heading|figure)_\d+)",el.text)
        if m:needed.add(m.group(1))
refs={name:label for name,label in refs.items() if name in needed}

pages=fitz.open(pdf)
texts=[normalize(p.get_text("text")) for p in pages]
# The table of contents also contains chapter titles; search for body prose
# to avoid mistaking TOC page 3 for the beginning of Chapter I.
first=next((i for i,t in enumerate(texts) if "hoạt động văn hóa cộng đồng" in t
            and "sức chứa" in t),None)
if first is None:
    raise RuntimeError("Không xác định được trang bắt đầu chương I")
page_map={}
missing=[]
for name,label in refs.items():
    needle=normalize(label)
    if not needle:
        missing.append((name,label))
        continue
    # Caption labels in PDF include the SEQ field result, p text includes cached figure number.
    candidates=[i+1 for i in range(first,len(texts)) if needle in texts[i]]
    if not candidates:
        # Some PDF extractors add line breaks around hyphen punctuation.
        compact=needle.replace(" – "," ").replace("—"," ")
        candidates=[i+1 for i in range(first,len(texts))
                    if compact in texts[i].replace(" – "," ").replace("—"," ")]
    if candidates:
        page_map[name]=candidates[0]
    else:
        missing.append((name,label))

# Check every heading and figure page reference.
if missing:
    print("Unmatched labels:",missing[:30])
    raise RuntimeError(f"Không tìm thấy số trang cho {len(missing)} tiêu đề/hình")

def patch_paragraph(p):
    runs=[el for el in p if el.tag==W+"r"]
    changed=0
    for i,el in enumerate(runs):
        it=el.find(W+"instrText")
        if it is None or not it.text or "PAGEREF" not in it.text:
            continue
        m=re.search(r"PAGEREF\s+(bm_(?:heading|figure)_\d+)",it.text)
        if not m:continue
        page=page_map.get(m.group(1))
        if page is None:continue
        # Keep the outer Word TOC/TOF field automatic. Make the inner
        # page label a stable cached string, because headless LibreOffice
        # otherwise recalculates every nested PAGEREF as page 1.
        if i < 1 or i+3 >= len(runs):
            raise RuntimeError("Unexpected PAGEREF field structure")
        begin, separator, cached, end = runs[i-1], runs[i+1], runs[i+2], runs[i+3]
        tag=cached.find(W+"t")
        if tag is None:
            raise RuntimeError("Missing cached page label")
        tag.text=str(page)
        for element in (begin,el,separator,end):
            p.remove(element)
        changed+=1
    return changed

total=sum(patch_paragraph(p) for p in root.findall(".//w:body/w:p",XMLNS))
expected=len(refs)
if total!=expected:
    raise RuntimeError(f"Cập nhật {total} số trang, mong đợi {expected}")
with NamedTemporaryFile(dir=docx.parent,suffix=".docx",delete=False) as tmp:
    replacement=Path(tmp.name)
with ZipFile(docx,"r") as source,ZipFile(replacement,"w") as target:
    for item in source.infolist():
        data=etree.tostring(root,xml_declaration=True,encoding="UTF-8",standalone=True) if item.filename=="word/document.xml" else source.read(item.filename)
        target.writestr(item,data)
replacement.replace(docx)
# Keep cached entries until the user explicitly chooses 'Update field' in Word.
# This does not remove either TOC field or the SEQ figure-caption fields.
with ZipFile(docx) as z:
    settings_xml=z.read('word/settings.xml')
settings_root=etree.fromstring(settings_xml)
updated=settings_root.find('w:updateFields',XMLNS)
if updated is not None:
    updated.set(W+'val','false')
with NamedTemporaryFile(dir=docx.parent,suffix='.docx',delete=False) as tmp:
    safe=Path(tmp.name)
with ZipFile(docx,'r') as source,ZipFile(safe,'w') as dest:
    for item in source.infolist():
        data=(etree.tostring(settings_root,xml_declaration=True,encoding='UTF-8',standalone=True)
              if item.filename=='word/settings.xml' else source.read(item.filename))
        dest.writestr(item,data)
safe.replace(docx)
assert len(page_map)==len(refs)
print("Index page distribution:",sorted(set(page_map.values())))
assert len(set(page_map.values()))>4, 'TOC page mapping unexpectedly collapsed'
print(f"Updated {total} cached page labels; real pages span {min(page_map.values())}–{max(page_map.values())}")
print(f"Total PDF pages {len(pages)}")
print("First chapter starts at",first+1)
