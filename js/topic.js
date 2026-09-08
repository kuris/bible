/* 성경아 놀자 - 주제별 말씀 (topic.js) — 본문은 데이터 파일에서만 읽어 옵니다 */
(function () {
  'use strict';
  var cur = null, books = {};
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}

  function tabs() {
    var host = document.getElementById('topic-tabs');
    host.innerHTML = BibleRefs.TOPICS.map(function (t) {
      return '<button type="button" class="btn btn-sm" data-topic="' + t.id + '">' + t.emoji + ' ' + esc(t.name) + '</button>';
    }).join('');
    host.addEventListener('click', function (e) {
      var b = e.target.closest('[data-topic]'); if (!b) return;
      show(b.getAttribute('data-topic'));
    });
  }

  async function show(id) {
    cur = BibleRefs.TOPICS.filter(function (t) { return t.id === id; })[0];
    if (!cur) return;
    document.querySelectorAll('#topic-tabs [data-topic]').forEach(function (b) {
      b.classList.toggle('btn-primary', b.getAttribute('data-topic') === id);
    });
    var host = document.getElementById('topic-body');
    host.innerHTML = '<div class="card"><div class="loading">불러오는 중…</div></div>';

    var rows = [];
    for (var i = 0; i < cur.refs.length; i++) {
      var p = BibleRefs.parse(cur.refs[i]);
      var b = books[p.code];
      var ko = await BibleData.loadVerse('krv', p.code, p.chapter, p.verse);
      var en = await BibleData.loadVerse('web', p.code, p.chapter, p.verse);
      if (!ko && !en) continue;
      rows.push(
        '<div class="verse"><div class="verse-body">' +
        '<div style="font-weight:800;color:var(--key);font-size:13px">' + esc((b ? b.ko : p.code) + ' ' + p.chapter + ':' + p.verse) + '</div>' +
        '<div class="verse-ko">' + esc(ko) + '</div>' +
        '<div class="verse-en">' + esc(en) + '</div>' +
        '<div style="margin-top:6px"><a class="btn btn-sm" href="read.html?b=' + p.code.toLowerCase() + '&c=' + p.chapter + '&v=' + p.verse + '">→ 이 장으로</a></div>' +
        '</div></div>');
    }
    host.innerHTML = '<div class="card"><h2 class="sec-title" style="margin-top:0">' + cur.emoji + ' ' + esc(cur.name) + '</h2>' +
                     (rows.join('') || '<div class="empty">구절을 불러오지 못했습니다.</div>') +
                     '<p style="margin:14px 0 0;font-size:12px;color:var(--muted)">이 목록은 읽기를 돕기 위한 참고용 모음입니다.</p></div>';
  }

  async function start() {
    if (!window.BibleData || !window.BibleRefs) return;
    (await BibleData.books()).forEach(function (b) { books[b.code] = b; });
    tabs();
    show(BibleRefs.TOPICS[0].id);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
