/* 성경아 놀자 - 암송 카드 (memory.js) : 본문은 데이터 파일에서만 읽어 옵니다 */
(function () {
  'use strict';
  var idx = 0, books = {}, hidden = true;
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}

  async function render() {
    var host = document.getElementById('mem-card');
    var refs = BibleRefs.MEMORY;
    if (!refs.length) return;
    idx = (idx + refs.length) % refs.length;
    var ref = refs[idx];
    var p = BibleRefs.parse(ref);
    var b = books[p.code];
    var ko = await BibleData.loadVerse('krv', p.code, p.chapter, p.verse);
    var en = await BibleData.loadVerse('web', p.code, p.chapter, p.verse);
    var st = (window.BibleSync ? BibleSync.memoryAll()[ref] : null) || {};

    document.getElementById('mem-count').textContent = (idx + 1) + ' / ' + refs.length +
      (st.status === 'memorized' ? ' · 외움' : '');

    host.innerHTML =
      '<div style="text-align:center;padding:10px 0">' +
      '<div style="font-weight:800;color:var(--key);margin-bottom:12px">' + esc((b ? b.ko : p.code) + ' ' + p.chapter + ':' + p.verse) + '</div>' +
      '<div id="mem-text" style="min-height:96px;display:flex;align-items:center;justify-content:center;padding:16px;border-radius:12px;background:var(--key-soft);cursor:pointer">' +
      (hidden ? '<span style="color:var(--muted)">눌러서 본문 보기</span>'
              : '<div><p class="verse-ko" style="margin:0 0 8px">' + esc(ko) + '</p><p class="verse-en" style="margin:0">' + esc(en) + '</p></div>') +
      '</div>' +
      '<div style="display:flex;gap:8px;justify-content:center;margin-top:14px;flex-wrap:wrap">' +
      '<button type="button" class="btn btn-sm" id="mem-learn">다시 볼래요</button>' +
      '<button type="button" class="btn btn-sm btn-primary" id="mem-done">외웠어요</button>' +
      '<a class="btn btn-sm" href="read.html?b=' + p.code.toLowerCase() + '&c=' + p.chapter + '&v=' + p.verse + '">→ 이 장으로</a>' +
      '</div></div>';

    document.getElementById('mem-text').addEventListener('click', function () { hidden = !hidden; render(); });
    document.getElementById('mem-done').addEventListener('click', async function () {
      await BibleSync.markMemory(ref, 'memorized'); idx++; hidden = true; render();
    });
    document.getElementById('mem-learn').addEventListener('click', async function () {
      await BibleSync.markMemory(ref, 'learning'); idx++; hidden = true; render();
    });
  }

  async function start() {
    if (!window.BibleData || !window.BibleRefs) return;
    (await BibleData.books()).forEach(function (b) { books[b.code] = b; });
    document.getElementById('mem-prev').addEventListener('click', function () { idx--; hidden = true; render(); });
    document.getElementById('mem-next').addEventListener('click', function () { idx++; hidden = true; render(); });
    render();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
