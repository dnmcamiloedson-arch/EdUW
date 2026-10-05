"""Add fade transitions and cascading Float-In entrance animations to a pptxgenjs deck.
Objects whose name starts with '@N~' animate at step N (same N = together); the prefix is stripped."""
import re, sys, zipfile, shutil

STEP_GAP = 180   # ms between consecutive steps
DUR = 650        # ms per entrance

def timing(groups):
    nid = [2]
    def n():
        nid[0] += 1
        return nid[0]
    pars = []
    for k, step in enumerate(sorted(groups)):
        inner = []
        for j, (spid, is_sp) in enumerate(groups[step]):
            node = "afterEffect" if (k == 0 and j == 0) else "withEffect"
            delay = 0 if k == 0 else 0
            c = n()
            t = lambda: f'<p:tgtEl><p:spTgt spid="{spid}"/></p:tgtEl>'
            inner.append(
                f'<p:par><p:cTn id="{c}" presetID="42" presetClass="entr" presetSubtype="0" fill="hold" grpId="0" nodeType="{node}">'
                f'<p:stCondLst><p:cond delay="{k * STEP_GAP}"/></p:stCondLst><p:childTnLst>'
                f'<p:set><p:cBhvr><p:cTn id="{n()}" dur="1" fill="hold"><p:stCondLst><p:cond delay="0"/></p:stCondLst></p:cTn>{t()}'
                f'<p:attrNameLst><p:attrName>style.visibility</p:attrName></p:attrNameLst></p:cBhvr><p:to><p:strVal val="visible"/></p:to></p:set>'
                f'<p:animEffect transition="in" filter="fade"><p:cBhvr><p:cTn id="{n()}" dur="{DUR}"/>{t()}</p:cBhvr></p:animEffect>'
                f'<p:anim calcmode="lin" valueType="num"><p:cBhvr><p:cTn id="{n()}" dur="{DUR}" decel="100000" fill="hold"/>{t()}'
                f'<p:attrNameLst><p:attrName>ppt_x</p:attrName></p:attrNameLst></p:cBhvr><p:tavLst>'
                f'<p:tav tm="0"><p:val><p:strVal val="#ppt_x"/></p:val></p:tav><p:tav tm="100000"><p:val><p:strVal val="#ppt_x"/></p:val></p:tav></p:tavLst></p:anim>'
                f'<p:anim calcmode="lin" valueType="num"><p:cBhvr><p:cTn id="{n()}" dur="{DUR}" decel="100000" fill="hold"/>{t()}'
                f'<p:attrNameLst><p:attrName>ppt_y</p:attrName></p:attrNameLst></p:cBhvr><p:tavLst>'
                f'<p:tav tm="0"><p:val><p:strVal val="#ppt_y+0.06"/></p:val></p:tav><p:tav tm="100000"><p:val><p:strVal val="#ppt_y"/></p:val></p:tav></p:tavLst></p:anim>'
                f'</p:childTnLst></p:cTn></p:par>')
        pars.extend(inner)
    # one auto-starting "after previous" group holding every effect, each offset by its own delay
    body = (f'<p:par><p:cTn id="3" fill="hold"><p:stCondLst><p:cond delay="indefinite"/>'
            f'<p:cond evt="onBegin" delay="0"><p:tn val="2"/></p:cond></p:stCondLst><p:childTnLst>'
            f'<p:par><p:cTn id="4" fill="hold"><p:stCondLst><p:cond delay="0"/></p:stCondLst><p:childTnLst>'
            + "".join(pars) + '</p:childTnLst></p:cTn></p:par></p:childTnLst></p:cTn></p:par>')
    bld = "".join(f'<p:bldP spid="{spid}" grpId="0" animBg="1"/>' for st in sorted(groups) for spid, is_sp in groups[st] if is_sp)
    return ('<p:timing><p:tnLst><p:par><p:cTn id="1" dur="indefinite" restart="never" nodeType="tmRoot"><p:childTnLst>'
            '<p:seq concurrent="1" nextAc="seek"><p:cTn id="2" dur="indefinite" nodeType="mainSeq"><p:childTnLst>'
            + body + '</p:childTnLst></p:cTn><p:prevCondLst><p:cond evt="onPrev" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:prevCondLst>'
            '<p:nextCondLst><p:cond evt="onNext" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:nextCondLst></p:seq>'
            '</p:childTnLst></p:cTn></p:par></p:tnLst>' + (f'<p:bldLst>{bld}</p:bldLst>' if bld else '') + '</p:timing>')

def process(xml):
    groups = {}
    # find each shape element + its cNvPr
    for m in re.finditer(r'<p:cNvPr id="(\d+)" name="@(\d+)~', xml):
        spid, step = m.group(1), int(m.group(2))
        head = xml[:m.start()]
        kind = max(("sp", "pic", "graphicFrame", "cxnSp"), key=lambda k: head.rfind(f"<p:{k}>"))
        groups.setdefault(step, []).append((spid, kind == "sp"))
    xml = re.sub(r'name="@\d+~', 'name="', xml)
    trans = '<p:transition spd="slow"><p:fade/></p:transition>'
    extra = trans + (timing(groups) if groups else '')
    if '<p:extLst>' in xml.split('</p:cSld>')[-1]:
        raise SystemExit('unexpected extLst after cSld')
    return xml.replace('</p:sld>', extra + '</p:sld>'), sum(len(v) for v in groups.values())

src = sys.argv[1]; tmp = src + '.tmp'
with zipfile.ZipFile(src) as zi, zipfile.ZipFile(tmp, 'w', zipfile.ZIP_DEFLATED) as zo:
    for item in zi.infolist():
        data = zi.read(item.filename)
        if re.match(r'ppt/slides/slide\d+\.xml$', item.filename):
            x, cnt = process(data.decode('utf8'))
            print(item.filename, 'animated objects:', cnt)
            data = x.encode('utf8')
        zo.writestr(item, data)
shutil.move(tmp, src)
