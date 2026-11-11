from pathlib import Path
from zipfile import ZipFile
from lxml import etree
from tempfile import NamedTemporaryFile

root=Path(__file__).resolve().parent.parent
source=root/'reports/MED06_BaoCao_DoAn.docx'
target=root/'reports/_render/MED06_BaoCao_DoAn_preview.docx'
W='{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
ns={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
target.parent.mkdir(parents=True,exist_ok=True)
with ZipFile(source) as zin:
    tree=etree.fromstring(zin.read('word/document.xml'))
    body=tree.find('w:body',ns)
    removed=0
    for p in list(body.findall('w:p',ns)):
        raw_text=''.join(x.text or '' for x in p.findall('.//w:t',ns)).strip()
        if raw_text:
            continue
        instr=' '.join(x.text or '' for x in p.findall('.//w:instrText',ns))
        has_only_field_end=any(
            x.get(W+'fldCharType')=='end'
            for x in p.findall('w:r/w:fldChar',ns)
        ) and not instr
        if 'TOC' in instr or has_only_field_end:
            body.remove(p)
            removed+=1
    if removed < 2:
        raise RuntimeError(f'Expected at least two TOC control paragraphs, removed {removed}')
    with ZipFile(target,'w') as zout:
        for item in zin.infolist():
            content=(etree.tostring(tree,xml_declaration=True,encoding='UTF-8',standalone=True)
                     if item.filename=='word/document.xml' else zin.read(item.filename))
            zout.writestr(item,content)
print(f'Static preview created: {target} ({removed} control paragraphs removed)')
