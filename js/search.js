/* ============================================================
   성경아 놀자 - 구절 검색 (search.js)

   · 낱말 검색: 66권 데이터를 순서대로 받아 가며 본문에서 찾습니다.
     (처음 한 번만 받고 이후에는 캐시에서 즉시 검색합니다)
   · 주소 검색: "요 3:16", "jhn 3:16", "요한복음 3장 16절" 형태를 알아듣고 바로 이동합니다.
   ============================================================ */
(function () {
  'use strict';

  var books = [];
  var lang = 'krv';
  var MAX = 200;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function hi(text, q) {
    if (!q) return esc(text);
    var i = text.toLowerCase().indexOf(q.toLowerCase());
    if (i === -1) return esc(text);
    return esc(text.slice(0, i)) +
           '<mark style="background:#fdf0c8;padding:0 2px;border-radius:3px">' + esc(text.slice(i, i + q.length)) + '</mark>' +
           esc(text.slice(i + q.length));
  }

  // ---------- 구절 주소 알아듣기 ----------
  function parseRef(q) {
    var s = q.replace(/\s+/g, ' ').trim();
    var m = s.match(/^(.+?)\s*(\d+)\s*(?:장|:|\.)\s*(\d+)?\s*절?$/);
    if (!m) return null;
    var name = m[1].trim().toLowerCase();
    var hit = books.filter(function (b) {
      var ko = b.ko.toLowerCase(), en = b.en.toLowerCase(), code = b.code.toLowerCase();
      return ko === name || en === name || code === name ||
             ko.indexOf(name) === 0 || en.indexOf(name) === 0;
    })[0];
    if (!hit) return null;
    return { code: hit.code, ko: hit.ko, chapter: Number(m[2]), verse: Number(m[3] || 0) };
  }

  // ---------- 낱말 검색 ----------
  function yieldToUI() {
    return new Promise(function (r) { setTimeout(r, 0); });
  }

  async function wordSearch(q, onProgress) {
    var out = [];
    for (var i = 0; i < books.length; i++) {
      var b = books[i];
      onProgress(i + 1, books.length, b.ko);
      // 한 권을 훑을 때마다 화면에 차례를 넘겨 줍니다 (멈춘 것처럼 보이지 않도록)
      await yieldToUI();
      var data = await BibleData.loadBook(lang, b.code.toLowerCase());
      if (!data || !data.chapters) continue;
      for (var c = 0; c < data.chapters.length; c++) {
        var ch = data.chapters[c];
        for (var v = 0; v < ch.length; v++) {
          var t = ch[v];
          if (t && t.toLowerCase().indexOf(q.toLowerCase()) !== -1) {
            out.push({ code: b.code, ko: b.ko, en: b.en, chapter: c + 1, verse: v + 1, text: t });
            if (out.length >= MAX) return out;
          }
        }
      }
    }
    return out;
  }

  async function renderResults(rows, q) {
    var host = document.getElementById('results');
    if (!host) return;
    if (!rows.length) {
      host.innerHTML = '<div class="card"><div class="empty">‘' + esc(q) + '’ 에 해당하는 구절을 찾지 못했습니다.</div></div>';
      return;
    }
    var parts = ['<div class="card"><p style="margin:0 0 12px;color:var(--muted);font-size:14px">' +
                 rows.length + '개 구절' + (rows.length >= MAX ? ' (앞 ' + MAX + '개만 표시)' : '') + '</p>'];
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      var other = await BibleData.loadVerse(lang === 'krv' ? 'web' : 'krv', r.code, r.chapter, r.verse);
      var ref = r.ko + ' ' + r.chapter + ':' + r.verse;
      var favOn = window.BibleSync && BibleSync.isFav(r.code, r.chapter, r.verse);
      parts.push(
        '<div class="verse" data-code="' + r.code + '" data-c="' + r.chapter + '" data-v="' + r.verse + '">' +
        '<div class="verse-body">' +
        '<div style="font-weight:800;color:var(--key);font-size:13px;margin-bottom:2px">' + esc(ref) + '</div>' +
        '<div class="verse-ko">' + hi(r.text, q) + '</div>' +
        '<div class="verse-en">' + esc(other) + '</div>' +
        '<div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap">' +
        '<button type="button" class="btn btn-sm" data-act="fav">' + (favOn ? '★ 즐겨찾기 됨' : '⭐ 즐겨찾기') + '</button>' +
        '<button type="button" class="btn btn-sm" data-act="note">📝 메모</button>' +
        '<a class="btn btn-sm" href="read.html?b=' + r.code.toLowerCase() + '&c=' + r.chapter + '&v=' + r.verse + '">→ 이 장으로</a>' +
        '</div></div></div>');
    }
    parts.push('</div>');
    host.innerHTML = parts.join('');
  }

  async function run() {
    var q = (document.getElementById('q').value || '').trim();
    var hint = document.getElementById('search-hint');
    var host = document.getElementById('results');
    if (!q) { hint.textContent = '찾고 싶은 낱말이나 구절 주소를 입력해 주세요.'; host.innerHTML = ''; return; }

    var ref = parseRef(q);
    if (ref) {
      location.href = 'read.html?b=' + ref.code.toLowerCase() + '&c=' + ref.chapter +
                      (ref.verse ? '&v=' + ref.verse : '');
      return;
    }

    host.innerHTML = '';
    hint.innerHTML = '<span class="loading">검색 준비 중…</span>';
    var rows = await wordSearch(q, function (i, n, name) {
      hint.innerHTML = '본문을 훑는 중… ' + i + '/' + n + ' (' + esc(name) + ')';
    });
    hint.textContent = rows.length ? '‘' + q + '’ 검색 결과' : '';
    await renderResults(rows, q);
  }

  function bind() {
    document.querySelectorAll('#lang-seg button').forEach(function (b) {
      b.addEventListener('click', function () {
        lang = b.getAttribute('data-lang');
        document.querySelectorAll('#lang-seg button').forEach(function (x) {
          x.classList.toggle('active', x === b);
        });
      });
    });
    document.getElementById('go').addEventListener('click', run);
    document.getElementById('q').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') run();
    });

    document.getElementById('results').addEventListener('click', async function (ev) {
      var btn = ev.target.closest('[data-act]');
      if (!btn) return;
      var box = btn.closest('[data-code]');
      var code = box.getAttribute('data-code');
      var c = Number(box.getAttribute('data-c')), v = Number(box.getAttribute('data-v'));
      var b = books.filter(function (x) { return x.code === code; })[0];
      var ko = await BibleData.loadVerse('krv', code, c, v);
      var en = await BibleData.loadVerse('web', code, c, v);

      if (btn.getAttribute('data-act') === 'fav') {
        var on = await BibleSync.toggleFav({ code: code, chapter: c, verse: v, ko: ko, en: en, bookName: b ? b.ko : '' });
        btn.textContent = on ? '★ 즐겨찾기 됨' : '⭐ 즐겨찾기';
      } else {
        var cur = BibleSync.noteOf(code, c, v);
        var next = prompt((b ? b.ko : '') + ' ' + c + ':' + v + ' 메모', cur || '');
        if (next === null) return;
        await BibleSync.saveNote({ code: code, chapter: c, verse: v, bookName: b ? b.ko : '' }, next);
      }
    });
  }

  async function start() {
    if (!window.BibleData) return;
    books = await BibleData.books();
    bind();
    var q = new URLSearchParams(location.search).get('q');
    if (q) { document.getElementById('q').value = q; run(); }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
