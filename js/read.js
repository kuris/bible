/* ============================================================
   성경아 놀자 - 성경 읽기 (read.js)
   한글 / English / 한영 병렬 · 책·장 이동 · 즐겨찾기 · 메모
   URL: read.html?b=jhn&c=3&v=16&view=parallel
   ============================================================ */
(function () {
  'use strict';

  var state = { view: 'krv', code: 'GEN', chapter: 1, verse: 0, books: [], testament: 'ot' };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function qs() {
    var o = {}; new URLSearchParams(location.search).forEach(function (v, k) { o[k] = v; }); return o;
  }
  function pushUrl() {
    var u = 'read.html?b=' + state.code.toLowerCase() + '&c=' + state.chapter + '&view=' + state.view;
    history.replaceState(null, '', u);
  }
  function info() {
    for (var i = 0; i < state.books.length; i++) if (state.books[i].code === state.code) return state.books[i];
    return null;
  }

  // ---------- 선택 UI ----------
  function fillBooks() {
    var sel = document.getElementById('book-pick');
    if (!sel) return;
    sel.innerHTML = state.books
      .filter(function (b) { return b.testament === state.testament; })
      .map(function (b) { return '<option value="' + b.code + '">' + esc(b.ko) + '</option>'; })
      .join('');
    sel.value = state.code;
  }
  function fillChapters() {
    var sel = document.getElementById('chapter-pick');
    var b = info();
    if (!sel || !b) return;
    var out = [];
    for (var i = 1; i <= b.chapters; i++) out.push('<option value="' + i + '">' + i + '장</option>');
    sel.innerHTML = out.join('');
    sel.value = state.chapter;
  }
  function syncSegs() {
    document.querySelectorAll('#view-seg button').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-view') === state.view);
    });
    document.querySelectorAll('#testament-seg button').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-t') === state.testament);
    });
  }

  // ---------- 본문 ----------
  function verseHtml(v, ko, en) {
    var b = info();
    var favOn = window.BibleSync && BibleSync.isFav(state.code, state.chapter, v);
    var note = window.BibleSync ? BibleSync.noteOf(state.code, state.chapter, v) : '';
    var body = '';
    if (state.view === 'krv') body = '<div class="verse-ko">' + esc(ko) + '</div>';
    else if (state.view === 'web') body = '<div class="verse-ko">' + esc(en) + '</div>';
    else body = '<div class="verse-ko">' + (ko ? esc(ko) : '<span class="verse-empty">— 이 번역본에는 해당 절이 없습니다</span>') + '</div>' +
                '<div class="verse-en">' + (en ? esc(en) : '<span class="verse-empty">— not in this translation</span>') + '</div>';
    if (note) body += '<div class="verse-en" style="color:var(--accent)">📝 ' + esc(note) + '</div>';

    return '<li class="verse" id="v' + v + '" data-v="' + v + '">' +
           '<span class="verse-no">' + v + '</span>' +
           '<div class="verse-body">' + body + '</div>' +
           '<span class="verse-acts">' +
           '<button type="button" class="icon-btn' + (favOn ? ' on' : '') + '" data-act="fav" title="즐겨찾기">' + (favOn ? '★' : '☆') + '</button>' +
           '<button type="button" class="icon-btn" data-act="note" title="메모">📝</button>' +
           '</span></li>';
  }

  async function render() {
    var list = document.getElementById('verse-list');
    var title = document.getElementById('read-title');
    if (!list) return;
    list.innerHTML = '<li class="loading">불러오는 중…</li>';

    var b = info();
    if (title && b) {
      title.textContent = b.ko + ' ' + state.chapter + '장';
      document.title = b.ko + ' ' + state.chapter + '장 - 성경아 놀자';
    }

    var rows = [];
    if (state.view === 'parallel') {
      var pr = await BibleData.loadParallel(state.code, state.chapter);
      rows = pr.map(function (x) { return verseHtml(x.verse, x.ko, x.en); });
    } else {
      var vs = await BibleData.loadChapter(state.view, state.code, state.chapter);
      rows = vs.map(function (x) { return verseHtml(x.verse, state.view === 'krv' ? x.text : '', state.view === 'web' ? x.text : ''); });
      if (state.view === 'web') {
        rows = vs.map(function (x) { return verseHtml(x.verse, '', x.text); });
      }
    }

    list.innerHTML = rows.length ? rows.join('') : '<li class="empty">본문을 불러오지 못했습니다.</li>';

    if (state.verse) {
      var t = document.getElementById('v' + state.verse);
      if (t) { t.classList.add('target'); t.scrollIntoView({ block: 'center' }); }
      state.verse = 0;
    }
    updateReadBtn();
  }

  function updateReadBtn() {
    var btn = document.getElementById('mark-read');
    if (!btn || !window.BibleSync) return;
    var on = BibleSync.isRead(state.code, state.chapter);
    btn.textContent = on ? '✓ 읽음' : '이 장 읽음 표시';
    btn.classList.toggle('btn-primary', !on);
  }

  // ---------- 이동 ----------
  function move(delta) {
    var b = info();
    if (!b) return;
    var c = state.chapter + delta;
    if (c < 1) {
      var i = state.books.findIndex(function (x) { return x.code === state.code; });
      if (i > 0) { state.code = state.books[i - 1].code; state.testament = state.books[i - 1].testament; state.chapter = state.books[i - 1].chapters; }
      else return;
    } else if (c > b.chapters) {
      var j = state.books.findIndex(function (x) { return x.code === state.code; });
      if (j < state.books.length - 1) { state.code = state.books[j + 1].code; state.testament = state.books[j + 1].testament; state.chapter = 1; }
      else return;
    } else {
      state.chapter = c;
    }
    syncSegs(); fillBooks(); fillChapters(); pushUrl(); render();
    window.scrollTo({ top: 0 });
  }

  function bind() {
    document.querySelectorAll('#view-seg button').forEach(function (b) {
      b.addEventListener('click', function () { state.view = b.getAttribute('data-view'); syncSegs(); pushUrl(); render(); });
    });
    document.querySelectorAll('#testament-seg button').forEach(function (b) {
      b.addEventListener('click', function () {
        state.testament = b.getAttribute('data-t');
        var first = state.books.filter(function (x) { return x.testament === state.testament; })[0];
        if (first) { state.code = first.code; state.chapter = 1; }
        syncSegs(); fillBooks(); fillChapters(); pushUrl(); render();
      });
    });
    var bp = document.getElementById('book-pick');
    if (bp) bp.addEventListener('change', function () { state.code = bp.value; state.chapter = 1; fillChapters(); pushUrl(); render(); });
    var cp = document.getElementById('chapter-pick');
    if (cp) cp.addEventListener('change', function () { state.chapter = Number(cp.value) || 1; pushUrl(); render(); });

    ['prev-ch', 'prev-ch2'].forEach(function (id) {
      var el = document.getElementById(id); if (el) el.addEventListener('click', function () { move(-1); });
    });
    ['next-ch', 'next-ch2'].forEach(function (id) {
      var el = document.getElementById(id); if (el) el.addEventListener('click', function () { move(1); });
    });

    var mr = document.getElementById('mark-read');
    if (mr) mr.addEventListener('click', async function () {
      await BibleSync.markRead(state.code, state.chapter);
      updateReadBtn();
    });

    // 절 단위 즐겨찾기 / 메모
    var list = document.getElementById('verse-list');
    if (list) list.addEventListener('click', async function (ev) {
      var btn = ev.target.closest('[data-act]');
      if (!btn) return;
      var li = btn.closest('.verse');
      var v = Number(li.getAttribute('data-v'));
      var b = info();
      var ko = await BibleData.loadVerse('krv', state.code, state.chapter, v);
      var en = await BibleData.loadVerse('web', state.code, state.chapter, v);

      if (btn.getAttribute('data-act') === 'fav') {
        var on = await BibleSync.toggleFav({
          code: state.code, chapter: state.chapter, verse: v,
          ko: ko, en: en, bookName: b ? b.ko : ''
        });
        btn.textContent = on ? '★' : '☆';
        btn.classList.toggle('on', on);
      } else {
        var cur = BibleSync.noteOf(state.code, state.chapter, v);
        var next = prompt((b ? b.ko : '') + ' ' + state.chapter + ':' + v + ' 메모', cur || '');
        if (next === null) return;
        await BibleSync.saveNote({ code: state.code, chapter: state.chapter, verse: v, bookName: b ? b.ko : '' }, next);
        render();
      }
    });
  }

  async function start() {
    if (!window.BibleData) return;
    state.books = await BibleData.books();
    if (!state.books.length) return;

    var q = qs();
    if (q.b) state.code = String(q.b).toUpperCase();
    if (q.c) state.chapter = Number(q.c) || 1;
    if (q.v) state.verse = Number(q.v) || 0;
    if (q.view && ['krv', 'web', 'parallel'].indexOf(q.view) !== -1) state.view = q.view;
    var b = info();
    if (!b) { state.code = 'GEN'; state.chapter = 1; b = info(); }
    state.testament = b ? b.testament : 'ot';

    syncSegs(); fillBooks(); fillChapters(); bind();
    await render();
    if (window.BibleSync) BibleSync.onChange(updateReadBtn);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
