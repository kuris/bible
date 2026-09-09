#!/usr/bin/env python3
# ============================================================
#  성경아 놀자 - 페이지 생성기
#  모든 화면이 같은 헤더/메뉴/출처표기/푸터를 쓰도록 한 곳에서 찍어 냅니다.
#  본문 데이터는 건드리지 않고 화면 껍데기만 만듭니다.
# ============================================================
import pathlib

V = '20260909a'
SITE = 'https://bible.chatgpts.kr'
ADSENSE = 'ca-pub-3321070604000141'

MENU = [
    ('index.html',  '🏠 홈'),
    ('today.html',  '☀️ 오늘의 말씀'),
    ('read.html',   '📖 성경 읽기'),
    ('search.html', '🔍 구절 검색'),
    ('topic.html',  '🏷️ 주제별 말씀'),
    ('plan.html',   '📅 읽기표'),
    ('memory.html', '🃏 암송 카드'),
    ('quiz.html',   '🎯 성경 퀴즈'),
    ('my.html',     '📂 내 기록'),
]

FAMILY = [
    ('https://hanja.chatgpts.kr',    '📖 한자야 놀자'),
    ('https://voca.chatgpts.kr',     '⚡ 단어야 놀자'),
    ('https://history.chatgpts.kr',  '📜 역사야 놀자'),
    ('https://fortune.chatgpts.kr',  '🔮 운세야 놀자'),
    ('https://mind.chatgpts.kr',     '🧠 마인드테스트'),
    ('https://work.chatgpts.kr',     '💼 워크야 놀자'),
    ('https://money.chatgpts.kr',    '💰 머니야 놀자'),
    ('https://tools.chatgpts.kr',    '🛠️ 문서야 놀자'),
    ('https://maum.chatgpts.kr',     '🪷 마음아 놀자'),
    ('https://chatgpts.kr',          '🏠 chatgpts.kr'),
]

SOURCE_NOTE = """  <div class="source-note">
    <strong>사용 번역본</strong><br>
    한글 성경: 성경전서 개역한글판 (대한성서공회)<br>
    영어 성경: World English Bible (WEB), Public Domain<br>
    본문은 원문 그대로 표시하며 임의로 수정하지 않습니다.
    <a href="about.html">번역본 안내 자세히 보기 →</a>
  </div>"""


def nav(cur):
    return '\n'.join(
        f'      <a href="{h}" class="nav-chip{" active" if h == cur else ""}">{t}</a>'
        for h, t in MENU)


def family():
    return '\n'.join(f'        <a href="{u}" target="_blank" rel="noopener">{t}</a>'
                     for u, t in FAMILY)


def page(fn, title, desc, body, scripts=(), show_source=True):
    extra = '\n'.join(
        f'<script defer src="js/{s}?v={V}"></script>' for s in scripts)
    html = f'''<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="canonical" href="{SITE}/{fn}">

<meta property="og:type" content="website">
<meta property="og:site_name" content="성경아 놀자">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="{SITE}/{fn}">

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="css/style.css?v={V}">
<link rel="stylesheet" href="css/cg-auth.css?v={V}">

<meta name="google-adsense-account" content="{ADSENSE}">
<script defer src="js/cg-ads.js?v={V}" data-client="{ADSENSE}"></script>
</head>
<body>
<div class="wrap">

  <header class="site-head">
    <a href="index.html" class="brand-logo">
      <span class="logo-char">✝</span>
      <span>성경아 <span class="dot">놀자</span></span>
    </a>
    <div class="header-right"></div>
  </header>

  <nav class="nav-scroll" aria-label="주요 메뉴">
{nav(fn)}
  </nav>

{body}

{SOURCE_NOTE if show_source else ''}

  <footer class="site-foot">
    <div class="foot-links">
{family()}
    </div>
    <p>
      한글 성경: 성경전서 개역한글판 (대한성서공회) ·
      영어 성경: World English Bible (WEB), Public Domain
    </p>
    <p>성경아 놀자는 개인 읽기와 묵상을 돕는 참고용 도구입니다. 특정 교단이나 신학 입장을 대변하지 않습니다.</p>
    <p>© 2026 성경아 놀자 (bible.chatgpts.kr)</p>
  </footer>
</div>

<script defer src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script defer src="js/supabase-config.js?v={V}"></script>
<script defer src="js/cg-auth.js?v={V}" data-service="bible" data-mount=".header-right" data-mount-mode="append" data-my-page="my.html" data-hint="로그인하면 읽기 기록과 즐겨찾기를 저장할 수 있어요."></script>
<script defer src="js/bible-data.js?v={V}"></script>
{extra}
<script defer src="js/track.js?v={V}" data-service="bible"></script>
</body>
</html>
'''
    pathlib.Path(fn).write_text(html, encoding='utf-8')
    print(f'  ok  {fn}')


# ============================================================
#  화면별 본문
# ============================================================

page('index.html', '성경아 놀자 - 개역한글 · WEB 성경 읽기와 한영 병렬 성경',
 '개역한글과 World English Bible을 무료로 읽고 검색하세요. 한영 병렬 보기, 주제별 말씀, 읽기표, 암송 카드, 성경 퀴즈를 제공합니다.',
 '''  <section class="card" id="today-card">
    <div class="page-eyebrow">오늘의 말씀</div>
    <div id="today-box" class="loading">불러오는 중…</div>
  </section>

  <ul class="menu-grid">
    <li><a href="read.html"><span class="emoji">📖</span><span class="label">성경 읽기</span><span class="sub">개역한글 · WEB</span></a></li>
    <li><a href="read.html?view=parallel"><span class="emoji">🔤</span><span class="label">한영 병렬</span><span class="sub">나란히 보기</span></a></li>
    <li><a href="search.html"><span class="emoji">🔍</span><span class="label">구절 검색</span><span class="sub">한글 · 영어</span></a></li>
    <li><a href="topic.html"><span class="emoji">🏷️</span><span class="label">주제별 말씀</span><span class="sub">상황별 모음</span></a></li>
    <li><a href="plan.html"><span class="emoji">📅</span><span class="label">읽기표</span><span class="sub">진도 체크</span></a></li>
    <li><a href="memory.html"><span class="emoji">🃏</span><span class="label">암송 카드</span><span class="sub">가리고 외우기</span></a></li>
    <li><a href="quiz.html"><span class="emoji">🎯</span><span class="label">성경 퀴즈</span><span class="sub">본문 빈칸</span></a></li>
    <li><a href="my.html"><span class="emoji">📂</span><span class="label">내 기록</span><span class="sub">즐겨찾기 · 메모</span></a></li>
  </ul>

  <div id="bible-recent"></div>''',
 scripts=('bible-refs.js', 'bible-sync.js', 'today.js', 'home.js'))

page('today.html', '오늘의 말씀 - 성경아 놀자',
 '날마다 바뀌는 오늘의 말씀을 개역한글과 영어(WEB)로 함께 읽어 보세요.',
 '''  <div class="page-eyebrow">오늘의 말씀</div>
  <h1 class="page-title" id="today-date">오늘의 말씀</h1>
  <p class="page-desc">날마다 한 구절씩, 개역한글과 영어(WEB)로 함께 읽어 보세요.</p>

  <section class="card">
    <div id="today-box" class="loading">불러오는 중…</div>
  </section>

  <h2 class="sec-title">지난 7일의 말씀</h2>
  <section class="card" id="today-week"><div class="loading">불러오는 중…</div></section>''',
 scripts=('bible-refs.js', 'bible-sync.js', 'today.js'))

page('read.html', '성경 읽기 - 개역한글 · WEB 한영 병렬 | 성경아 놀자',
 '개역한글과 World English Bible을 장별로 읽고, 한영 병렬로 나란히 비교해 보세요.',
 '''  <div class="page-eyebrow">성경 읽기</div>
  <h1 class="page-title" id="read-title">성경 읽기</h1>

  <div class="toolbar">
    <div class="seg" id="view-seg" role="tablist" aria-label="보기 모드">
      <button type="button" data-view="krv" class="active">한글</button>
      <button type="button" data-view="web">English</button>
      <button type="button" data-view="parallel">한영 병렬</button>
    </div>
  </div>

  <div class="toolbar">
    <div class="seg" id="testament-seg" aria-label="구약 신약">
      <button type="button" data-t="ot" class="active">구약</button>
      <button type="button" data-t="nt">신약</button>
    </div>
    <select class="pick" id="book-pick" aria-label="성경 책 선택"></select>
    <select class="pick" id="chapter-pick" aria-label="장 선택"></select>
    <button type="button" class="btn btn-sm" id="prev-ch">← 이전 장</button>
    <button type="button" class="btn btn-sm" id="next-ch">다음 장 →</button>
  </div>

  <section class="card">
    <ul class="verse-list" id="verse-list"><li class="loading">불러오는 중…</li></ul>
  </section>

  <div class="toolbar" style="margin-top:14px;justify-content:space-between">
    <button type="button" class="btn" id="prev-ch2">← 이전 장</button>
    <button type="button" class="btn btn-primary" id="mark-read">이 장 읽음 표시</button>
    <button type="button" class="btn" id="next-ch2">다음 장 →</button>
  </div>''',
 scripts=('bible-sync.js', 'read.js'))

page('search.html', '성경 구절 검색 - 개역한글 · WEB | 성경아 놀자',
 '개역한글과 영어(WEB) 성경 본문에서 원하는 구절을 찾아보세요. 책 이름과 장·절로도 이동할 수 있습니다.',
 '''  <div class="page-eyebrow">구절 검색</div>
  <h1 class="page-title">성경 구절 검색</h1>
  <p class="page-desc">본문에 들어 있는 낱말로 찾거나, <strong>요 3:16</strong> 처럼 입력해 바로 이동할 수 있습니다.</p>

  <section class="card">
    <div class="toolbar">
      <input class="pick" id="q" style="flex:1 1 220px" placeholder="예) 사랑  ·  요 3:16  ·  love" autocomplete="off">
      <div class="seg" id="lang-seg" aria-label="검색 대상">
        <button type="button" data-lang="krv" class="active">한글</button>
        <button type="button" data-lang="web">English</button>
      </div>
      <button type="button" class="btn btn-primary" id="go">검색</button>
    </div>
    <div id="search-hint" class="empty">찾고 싶은 낱말이나 구절 주소를 입력해 주세요.</div>
  </section>

  <section id="results"></section>''',
 scripts=('bible-sync.js', 'search.js'))

page('topic.html', '주제별 말씀 - 성경아 놀자',
 '위로, 감사, 불안, 사랑 등 상황별로 모아 놓은 성경 구절을 개역한글과 영어로 읽어 보세요.',
 '''  <div class="page-eyebrow">주제별 말씀</div>
  <h1 class="page-title">주제별 말씀</h1>
  <p class="page-desc">지금 마음에 가까운 주제를 골라 보세요. 구절 목록은 참고용 모음입니다.</p>

  <section class="card">
    <div class="toolbar" id="topic-tabs"></div>
  </section>

  <section id="topic-body"><div class="loading">불러오는 중…</div></section>''',
 scripts=('bible-refs.js', 'bible-sync.js', 'topic.js'))

page('plan.html', '성경 읽기표 - 성경아 놀자',
 '통독 읽기표로 성경 읽기 진도를 확인하세요. 로그인하면 읽은 장이 계정에 저장됩니다.',
 '''  <div class="page-eyebrow">읽기표</div>
  <h1 class="page-title">성경 읽기표</h1>
  <p class="page-desc">읽은 장을 눌러 표시해 보세요. 로그인하면 진도가 계정에 저장되어 다른 기기에서도 이어집니다.</p>

  <section class="card">
    <div class="toolbar">
      <div class="seg" id="plan-seg">
        <button type="button" data-t="ot" class="active">구약 39권</button>
        <button type="button" data-t="nt">신약 27권</button>
      </div>
      <span id="plan-summary" style="color:var(--muted);font-size:14px"></span>
    </div>
    <div id="plan-body"><div class="loading">불러오는 중…</div></div>
  </section>''',
 scripts=('bible-sync.js', 'plan.js'))

page('memory.html', '암송 카드 - 성경아 놀자',
 '유명한 성경 구절을 카드로 가리고 외워 보세요. 개역한글과 영어(WEB)를 함께 제공합니다.',
 '''  <div class="page-eyebrow">암송 카드</div>
  <h1 class="page-title">암송 카드</h1>
  <p class="page-desc">카드를 눌러 본문을 가렸다 펼치며 외워 보세요. 로그인하면 진행률이 저장됩니다.</p>

  <section class="card">
    <div class="toolbar">
      <button type="button" class="btn" id="mem-prev">← 이전</button>
      <span id="mem-count" style="color:var(--muted);font-size:14px"></span>
      <button type="button" class="btn" id="mem-next">다음 →</button>
    </div>
    <div id="mem-card"><div class="loading">불러오는 중…</div></div>
  </section>''',
 scripts=('bible-refs.js', 'bible-sync.js', 'memory.js'))

page('quiz.html', '성경 퀴즈 - 성경아 놀자',
 '성경 본문에서 낱말을 가린 빈칸 퀴즈로 말씀을 복습해 보세요.',
 '''  <div class="page-eyebrow">성경 퀴즈</div>
  <h1 class="page-title">성경 퀴즈</h1>
  <p class="page-desc">본문에서 한 낱말을 가린 빈칸 문제입니다. 문제는 실제 성경 본문에서 그대로 만들어집니다.</p>

  <section class="card" id="quiz-box"><div class="loading">준비 중…</div></section>''',
 scripts=('bible-refs.js', 'bible-sync.js', 'quiz.js'))

page('my.html', '내 기록 - 성경아 놀자',
 '읽기 진도, 즐겨찾기 구절, 메모, 암송 진행률, 퀴즈 결과를 한곳에서 확인하세요.',
 '''  <div class="page-eyebrow">내 기록</div>
  <h1 class="page-title">내 기록</h1>
  <p class="page-desc">읽기 진도와 즐겨찾기, 메모를 모아 봅니다. 로그인하지 않아도 이 기기에 저장된 기록은 그대로 보입니다.</p>

  <div id="my-recent"></div>
  <div id="my-fav" style="margin-top:14px"></div>
  <div id="my-note" style="margin-top:14px"></div>''',
 scripts=('bible-sync.js', 'my.js'))

page('about.html', '사용 번역본 안내 - 성경아 놀자',
 '성경아 놀자가 사용하는 성경 번역본(개역한글, World English Bible)의 출처와 저작권 안내입니다.',
 '''  <div class="page-eyebrow">번역본 안내</div>
  <h1 class="page-title">사용 번역본과 출처</h1>
  <p class="page-desc">성경아 놀자는 저작권 문제가 없는 번역본만 사용합니다.</p>

  <section class="card">
    <h2 class="sec-title" style="margin-top:0">한글 — 성경전서 개역한글판</h2>
    <p>1961년에 나온 <strong>성경전서 개역한글판</strong>(대한성서공회)을 사용합니다.
       저작재산권 보호기간이 만료된 것으로 알려져 있습니다.</p>
    <p>다만 저작인격권(성명표시권·동일성유지권)은 존중해야 하므로,
       <strong>본문을 임의로 고치지 않고 원문 그대로</strong> 보여 줍니다.
       맞춤법을 현대식으로 바꾸거나 요약·의역하는 기능은 넣지 않았습니다.</p>
    <p style="color:var(--muted);font-size:14px">본문 정본: holybible.or.kr · 대조: bible.bskorea.or.kr</p>
  </section>

  <section class="card">
    <h2 class="sec-title" style="margin-top:0">영어 — World English Bible (WEB)</h2>
    <p><strong>World English Bible</strong>은 eBible.org 에서 발행한 <strong>Public Domain</strong> 번역본입니다.
       누구나 자유롭게 복사·배포·인용할 수 있습니다.</p>
    <p style="color:var(--muted);font-size:14px">
      The World English Bible is in the Public Domain. “World English Bible” is a Trademark of eBible.org.
      본문을 변경한 결과물에는 이 이름을 쓰지 않는다는 조건이 있어, 저희는 본문을 변경하지 않습니다.<br>
      출처: eBible.org (engwebp, 66권)
    </p>
  </section>

  <section class="card">
    <h2 class="sec-title" style="margin-top:0">사용하지 않는 번역본</h2>
    <p>개역개정, 새번역, 공동번역, NIV, ESV 등 <strong>저작권이 살아 있는 번역본은 사용하지 않습니다.</strong>
       데이터 폴더에 자리 자체를 두지 않았습니다.</p>
  </section>

  <section class="card">
    <h2 class="sec-title" style="margin-top:0">이 사이트의 성격</h2>
    <p>성경아 놀자는 성경을 읽고 찾아보는 것을 돕는 <strong>참고용 도구</strong>입니다.
       특정 교단이나 신학 입장을 주장하지 않으며, 해석이나 예언을 제공하지 않습니다.
       본문 읽기와 개인 묵상에 도움이 되는 기능만 담았습니다.</p>
  </section>''',
 show_source=False)

print('페이지 생성 완료')
