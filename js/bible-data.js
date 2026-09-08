/* ============================================================
   성경아 놀자 - 성경 본문 로더 (bible-data.js)

   [본문 출처]
     한글: 성경전서 개역한글판 (대한성서공회)
           저작재산권 보호기간 만료 · 정본 holybible.or.kr
     영어: World English Bible (WEB) — Public Domain, eBible.org

   [원칙]
     본문 문자열은 어떤 경우에도 가공하지 않습니다.
     맞춤법 교정·띄어쓰기 보정·요약·의역을 하는 코드가 없습니다.
     (개역한글 동일성유지권 / WEB 상표 조건 준수)

   [로딩 방식]
     성경 전체는 번역본당 4MB가 넘습니다. 한 번에 받으면 모바일에서 느리므로
     책 단위(30~200KB)로 필요할 때만 받고 메모리·sessionStorage 에 캐시합니다.
   ============================================================ */

(function (global) {
  'use strict';

  var BASE = 'data/';
  var mem = {};          // { 'krv:jhn': {…} }
  var indexCache = null;
  var inflight = {};

  function warn(msg, e) {
    try { console.warn('[성경 데이터] ' + msg, e && (e.message || e)); } catch (_) {}
  }

  function ssGet(key) {
    try { var v = sessionStorage.getItem(key); return v ? JSON.parse(v) : null; }
    catch (e) { return null; }
  }
  // sessionStorage 는 5MB 안팎입니다. 성경 전체는 그보다 크므로
  // 작은 책만 저장하고, 큰 책은 메모리 캐시에만 둡니다.
  // (전부 넣으려 하면 용량 초과 예외가 반복되며 화면이 멈춥니다)
  var SS_LIMIT = 120 * 1024;
  function ssSet(key, val) {
    try {
      var str = JSON.stringify(val);
      if (str.length > SS_LIMIT) return;
      sessionStorage.setItem(key, str);
    } catch (e) { /* 용량 초과 무시 */ }
  }

  // ---------- 책 목록 ----------
  async function loadIndex() {
    if (indexCache) return indexCache;
    var cached = ssGet('bible:index');
    if (cached) { indexCache = cached; return cached; }
    try {
      var res = await fetch(BASE + 'index.json');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      indexCache = await res.json();
      ssSet('bible:index', indexCache);
      return indexCache;
    } catch (e) {
      warn('책 목록을 불러오지 못했습니다', e);
      return { versions: [], books: [] };
    }
  }

  // ---------- 책 한 권 ----------
  async function loadBook(version, code) {
    version = String(version || 'krv').toLowerCase();
    code = String(code || '').toLowerCase();
    var key = version + ':' + code;
    if (mem[key]) return mem[key];

    var cached = ssGet('bible:' + key);
    if (cached) { mem[key] = cached; return cached; }

    if (inflight[key]) return inflight[key];
    inflight[key] = (async function () {
      try {
        var res = await fetch(BASE + version + '/' + code + '.json');
        if (!res.ok) throw new Error('HTTP ' + res.status);
        var data = await res.json();
        mem[key] = data;
        ssSet('bible:' + key, data);
        return data;
      } catch (e) {
        warn(code + ' 본문을 불러오지 못했습니다', e);
        return null;
      } finally {
        delete inflight[key];
      }
    })();
    return inflight[key];
  }

  // ---------- 장 ----------
  //  반환: [{ verse: 1, text: '…' }, …]   (없으면 빈 배열)
  async function loadChapter(version, code, chapter) {
    var book = await loadBook(version, code);
    if (!book || !book.chapters) return [];
    var arr = book.chapters[Number(chapter) - 1];
    if (!arr) return [];
    return arr.map(function (t, i) { return { verse: i + 1, text: t }; });
  }

  // ---------- 한영 병렬 ----------
  //  반환: [{ verse, ko, en }, …]
  //  한쪽에만 있는 절은 반대쪽을 빈 문자열로 두고 자리를 유지합니다.
  //  (임의로 채우거나 합치지 않습니다)
  async function loadParallel(code, chapter) {
    var pair = await Promise.all([
      loadChapter('krv', code, chapter),
      loadChapter('web', code, chapter)
    ]);
    var ko = pair[0], en = pair[1];
    var n = Math.max(ko.length, en.length);
    var out = [];
    for (var i = 0; i < n; i++) {
      out.push({
        verse: i + 1,
        ko: ko[i] ? ko[i].text : '',
        en: en[i] ? en[i].text : ''
      });
    }
    return out;
  }

  // ---------- 한 절 ----------
  async function loadVerse(version, code, chapter, verse) {
    var vs = await loadChapter(version, code, chapter);
    var hit = vs[Number(verse) - 1];
    return hit ? hit.text : '';
  }

  // ---------- 유틸 ----------
  var bookMap = null;
  async function books() {
    var idx = await loadIndex();
    return idx.books || [];
  }
  async function bookInfo(code) {
    if (!bookMap) {
      bookMap = {};
      (await books()).forEach(function (b) { bookMap[b.code] = b; });
    }
    return bookMap[String(code).toUpperCase()] || null;
  }
  function refString(bookName, chapter, verse) {
    return bookName + ' ' + chapter + (verse ? ':' + verse : '');
  }
  function refId(code, chapter, verse) {
    return String(code).toLowerCase() + '.' + chapter + (verse ? '.' + verse : '');
  }
  function parseRefId(id) {
    var p = String(id || '').split('.');
    return { code: (p[0] || '').toUpperCase(), chapter: Number(p[1]) || 0, verse: Number(p[2]) || 0 };
  }

  global.BibleData = {
    loadIndex: loadIndex,
    loadBook: loadBook,
    loadChapter: loadChapter,
    loadParallel: loadParallel,
    loadVerse: loadVerse,
    books: books,
    bookInfo: bookInfo,
    refString: refString,
    refId: refId,
    parseRefId: parseRefId,
    VERSIONS: {
      krv: { name: '성경전서 개역한글판', short: '개역한글', lang: 'ko' },
      web: { name: 'World English Bible (WEB)', short: 'WEB', lang: 'en' }
    }
  };
})(typeof window !== 'undefined' ? window : this);
