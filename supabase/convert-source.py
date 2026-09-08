#!/usr/bin/env python3
# ============================================================
#  성경 원천 데이터 → 서비스용 책별 JSON 변환기
#
#  입력
#    krv.jsonl              개역한글 (crizin/bible-db, holybible.or.kr 정본)
#    engwebp_vpl.txt        World English Bible (eBible.org 공식 VPL)
#
#  출력
#    data/krv/<code>.json   개역한글 66권
#    data/web/<code>.json   WEB 66권
#    data/index.json        책 메타 (한/영 이름, 장 수, 절 수)
#    data/compare.txt       한영 절 수 대조 리포트
#
#  ※ 본문 문자열은 한 글자도 변형하지 않습니다.
#     (개역한글 동일성유지권 / WEB 상표 조건 준수)
#     하는 일은 "어느 책·장·절인지" 구조를 바꾸는 것뿐입니다.
# ============================================================
import json, sys, collections, pathlib

SRC = pathlib.Path(sys.argv[1])          # 원천 데이터 폴더
OUT = pathlib.Path(sys.argv[2])          # bible/data

# WEB(VPL)의 옛 SIL 약어 → USFM 표준 코드
WEB_FIX = {
    '1JO': '1JN', '2JO': '2JN', '3JO': '3JN', 'EZE': 'EZK', 'JAM': 'JAS',
    'JOE': 'JOL', 'JOH': 'JHN', 'MAR': 'MRK', 'NAH': 'NAM', 'PHI': 'PHP',
    'SOL': 'SNG',
}

EN_NAME = {
 'GEN':'Genesis','EXO':'Exodus','LEV':'Leviticus','NUM':'Numbers','DEU':'Deuteronomy',
 'JOS':'Joshua','JDG':'Judges','RUT':'Ruth','1SA':'1 Samuel','2SA':'2 Samuel',
 '1KI':'1 Kings','2KI':'2 Kings','1CH':'1 Chronicles','2CH':'2 Chronicles','EZR':'Ezra',
 'NEH':'Nehemiah','EST':'Esther','JOB':'Job','PSA':'Psalms','PRO':'Proverbs',
 'ECC':'Ecclesiastes','SNG':'Song of Solomon','ISA':'Isaiah','JER':'Jeremiah','LAM':'Lamentations',
 'EZK':'Ezekiel','DAN':'Daniel','HOS':'Hosea','JOL':'Joel','AMO':'Amos',
 'OBA':'Obadiah','JON':'Jonah','MIC':'Micah','NAM':'Nahum','HAB':'Habakkuk',
 'ZEP':'Zephaniah','HAG':'Haggai','ZEC':'Zechariah','MAL':'Malachi',
 'MAT':'Matthew','MRK':'Mark','LUK':'Luke','JHN':'John','ACT':'Acts',
 'ROM':'Romans','1CO':'1 Corinthians','2CO':'2 Corinthians','GAL':'Galatians','EPH':'Ephesians',
 'PHP':'Philippians','COL':'Colossians','1TH':'1 Thessalonians','2TH':'2 Thessalonians',
 '1TI':'1 Timothy','2TI':'2 Timothy','TIT':'Titus','PHM':'Philemon','HEB':'Hebrews',
 'JAS':'James','1PE':'1 Peter','2PE':'2 Peter','1JN':'1 John','2JN':'2 John',
 '3JN':'3 John','JUD':'Jude','REV':'Revelation',
}

def load_krv(path):
    """개역한글 jsonl → {code: {'name': 한글명, 'order': n, 'verses': [(ch, v, text)]}}"""
    out = collections.OrderedDict()
    for line in path.open(encoding='utf-8'):
        line = line.strip()
        if not line:
            continue
        o = json.loads(line)
        code = o['code']
        b = out.setdefault(code, {'name': o['name_kr'], 'order': o['book'], 'verses': []})
        b['verses'].append((o['chapter'], o['verse'], o['text']))
    return out

def load_web(path):
    """WEB VPL(한 줄 = 한 절) → {code: [(ch, v, text)]}"""
    out = collections.OrderedDict()
    for raw in path.open(encoding='utf-8'):
        raw = raw.rstrip('\n')
        if not raw.strip():
            continue
        parts = raw.split(' ', 2)
        if len(parts) < 3:
            continue
        code, cv, text = parts
        code = WEB_FIX.get(code, code)
        if ':' not in cv:
            continue
        c, v = cv.split(':', 1)
        try:
            out.setdefault(code, []).append((int(c), int(v), text))
        except ValueError:
            continue
    return out

def to_chapters(verses):
    """[(ch, v, text)] → [[절1, 절2, …], …]  (빠진 절은 빈 문자열로 자리만 유지)"""
    by_ch = collections.defaultdict(dict)
    for c, v, t in verses:
        by_ch[c][v] = t
    chapters = []
    for c in range(1, max(by_ch) + 1):
        vs = by_ch.get(c, {})
        chapters.append([vs.get(v, '') for v in range(1, (max(vs) if vs else 0) + 1)])
    return chapters

def main():
    krv = load_krv(SRC / 'krv.jsonl')
    web = load_web(SRC / 'web_vpl' / 'engwebp_vpl.txt')

    (OUT / 'krv').mkdir(parents=True, exist_ok=True)
    (OUT / 'web').mkdir(parents=True, exist_ok=True)

    index, report = [], []
    for code, b in sorted(krv.items(), key=lambda kv: kv[1]['order']):
        k_ch = to_chapters(b['verses'])
        w_ch = to_chapters(web.get(code, []))

        json.dump({
            'version': 'krv', 'versionName': '성경전서 개역한글판',
            'language': 'ko', 'book': code, 'bookName': b['name'],
            'chapters': k_ch,
        }, (OUT / 'krv' / f'{code.lower()}.json').open('w', encoding='utf-8'),
           ensure_ascii=False, separators=(',', ':'))

        json.dump({
            'version': 'web', 'versionName': 'World English Bible (WEB)',
            'language': 'en', 'book': code, 'bookName': EN_NAME.get(code, code),
            'chapters': w_ch,
        }, (OUT / 'web' / f'{code.lower()}.json').open('w', encoding='utf-8'),
           ensure_ascii=False, separators=(',', ':'))

        kv, wv = sum(len(c) for c in k_ch), sum(len(c) for c in w_ch)
        index.append({
            'code': code, 'order': b['order'], 'ko': b['name'],
            'en': EN_NAME.get(code, code),
            'testament': 'ot' if b['order'] <= 39 else 'nt',
            'chapters': len(k_ch), 'koVerses': kv, 'enVerses': wv,
        })
        if len(k_ch) != len(w_ch) or kv != wv:
            report.append(f'{code:4s} {b["name"]:8s} 장 {len(k_ch):3d}/{len(w_ch):3d}  절 {kv:5d}/{wv:5d}')

    json.dump({
        'versions': [
            {'id': 'krv', 'name': '성경전서 개역한글판', 'short': '개역한글', 'lang': 'ko'},
            {'id': 'web', 'name': 'World English Bible (WEB)', 'short': 'WEB', 'lang': 'en'},
        ],
        'books': index,
    }, (OUT / 'index.json').open('w', encoding='utf-8'), ensure_ascii=False)

    (OUT / 'compare.txt').write_text(
        '=== 한영 장·절 수 대조 (개역한글 / WEB) ===\n'
        f'책 수: {len(index)}\n'
        f'개역한글 총 절: {sum(b["koVerses"] for b in index)}\n'
        f'WEB      총 절: {sum(b["enVerses"] for b in index)}\n\n'
        + ('차이가 있는 책:\n' + '\n'.join(report) if report else '차이 없음'),
        encoding='utf-8')

    print(f'책 {len(index)}권 변환 완료')
    print(f'개역한글 {sum(b["koVerses"] for b in index)}절 / WEB {sum(b["enVerses"] for b in index)}절')
    print(f'장·절 수가 다른 책: {len(report)}권')

main()
