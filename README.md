# 성경아 놀자 (bible.chatgpts.kr)

개역한글과 World English Bible(WEB)을 무료로 읽고 검색하는 도구입니다.
한영 병렬 보기, 주제별 말씀, 읽기표, 암송 카드, 성경 퀴즈를 제공합니다.

> 개인 읽기와 묵상을 돕는 **참고용 도구**입니다.
> 특정 교단이나 신학 입장을 대변하지 않으며, 해석이나 예언을 제공하지 않습니다.

## 사용 번역본과 출처

| 언어 | 번역본 | 저작권 | 출처 |
|---|---|---|---|
| 한글 | 성경전서 개역한글판 (1961) | 저작재산권 보호기간 만료 | 대한성서공회 · 정본 holybible.or.kr |
| 영어 | World English Bible (WEB) | **Public Domain** | eBible.org (`engwebp`, 66권) |

- 개역한글은 저작인격권(성명표시권·동일성유지권)을 존중해 **본문을 임의로 고치지 않습니다.**
  맞춤법 현대화·요약·의역 기능을 넣지 않았습니다.
- WEB은 Public Domain 이며, "World English Bible"은 eBible.org 의 상표입니다.
  본문을 변경한 결과물에 이 이름을 쓰지 않는다는 조건이 있어 **본문을 변경하지 않습니다.**
- 개역개정·새번역·공동번역·NIV·ESV 등 **저작권이 살아 있는 번역본은 사용하지 않습니다.**

## 데이터 구조

```
data/
├── index.json        책 66권 메타 (한/영 이름, 장 수, 절 수)
├── compare.txt       한영 장·절 수 대조 리포트
├── krv/<code>.json   개역한글 66권   (31,101절)
└── web/<code>.json   WEB 66권        (31,103절)
```

파일 하나의 형식:
```json
{
  "version": "krv",
  "versionName": "성경전서 개역한글판",
  "language": "ko",
  "book": "JHN",
  "bookName": "요한복음",
  "chapters": [["1절", "2절", "…"], ["…"]]
}
```
`chapters[장-1][절-1]` 이 본문입니다. 성경 전체는 번역본당 4MB가 넘어
책 단위로 필요할 때만 내려받고 캐시합니다.

원천 데이터에서 이 구조로 바꾸는 스크립트는 `supabase/convert-source.py` 입니다.
(구조만 바꾸고 본문 문자열은 한 글자도 건드리지 않습니다)

## 로그인

- **Google 로그인만** 사용합니다. 이메일/비밀번호, 카카오, 네이버, X, GitHub 로그인은 없습니다.
- 로그인은 **선택**입니다. 비로그인 사용자도 읽기·검색·병렬 보기·주제별·읽기표·암송·퀴즈를
  모두 그대로 쓸 수 있고, 기록은 이 기기(localStorage)에 저장됩니다.
- 로그인하면 기기 기록과 계정 기록을 **합쳐서** 양쪽에 반영합니다 (덮어쓰지 않습니다).
- 공통 로그인 모듈은 `play_project/_shared/cg-auth.js` 원본을 `sync.sh` 로 배포합니다.
  이 저장소의 `js/cg-auth.js` 는 복사본이므로 직접 수정하지 마세요.

## 필요한 SQL

`play_project/_shared/sql/` 의 01~07 을 순서대로 Supabase SQL Editor 에서 실행합니다.
bible 전용은 `07-bible.sql` 하나이며, 나머지는 8개 형제 서비스와 공유합니다.

| 테이블 | 용도 |
|---|---|
| `bible_reading_progress` | 읽은 장 |
| `bible_favorites` | 즐겨찾기 구절 |
| `bible_notes` | 개인 메모 |
| `bible_memory_progress` | 암송 진행률 |
| `bible_quiz_logs` | 퀴즈 결과 |
| `cg_recent` (공용) | 최근 본 항목 |
| `page_views` (공용) | 방문 통계 (`service='bible'`) |

## 화면

| 파일 | 화면 |
|---|---|
| `index.html` | 홈 · 오늘의 말씀 · 최근 읽은 장 |
| `today.html` | 오늘의 말씀 · 지난 7일 |
| `read.html` | 성경 읽기 (한글 / English / 한영 병렬) |
| `search.html` | 구절 검색 (낱말 · "요 3:16" 주소 이동) |
| `topic.html` | 주제별 말씀 |
| `plan.html` | 읽기표 (장 단위 진도 체크) |
| `memory.html` | 암송 카드 |
| `quiz.html` | 성경 퀴즈 (본문 빈칸) |
| `my.html` | 내 기록 (읽은 장 · 즐겨찾기 · 메모) |
| `about.html` | 사용 번역본 안내 |
| `admin.html` | 관리자 (profiles.role = 'admin') |

## 광고

AdSense 스크립트를 `js/cg-ads.js` 가 **조건부로** 넣습니다.
광고 제거 대상(관리자 · ads_disabled · premium · `ad_free` 권한)에게는 스크립트를 아예 로드하지 않습니다.
CSS 로 광고를 가리지 않습니다.
