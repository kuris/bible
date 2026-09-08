/* 성경아 놀자 - 읽기표 (plan.js) : 읽은 장 체크 · 진도 표시 */
(function () {
  'use strict';
  var books = [], t = 'ot';
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}

  function render() {
    var host = document.getElementById('plan-body');
    var list = books.filter(function (b) { return b.testament === t; });
    var readSet = {};
    (window.BibleSync ? BibleSync.readList() : []).forEach(function (id) { readSet[id] = true; });

    var doneAll = 0, totalAll = 0;
    var html = list.map(function (b) {
      var cells = [], done = 0;
      for (var c = 1; c <= b.chapters; c++) {
        var on = !!readSet[b.code.toLowerCase() + '.' + c];
        if (on) done++;
        cells.push('<button type="button" class="plan-cell' + (on ? ' on' : '') +
                   '" data-code="' + b.code + '" data-c="' + c + '" title="' + esc(b.ko) + ' ' + c + '장">' + c + '</button>');
      }
      doneAll += done; totalAll += b.chapters;
      return '<div style="margin-bottom:14px">' +
             '<div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px">' +
             '<strong style="font-size:15px">' + esc(b.ko) + '</strong>' +
             '<span style="font-size:12px;color:var(--muted)">' + done + '/' + b.chapters + '</span></div>' +
             '<div class="plan-grid">' + cells.join('') + '</div></div>';
    }).join('');

    host.innerHTML = html || '<div class="empty">표시할 책이 없습니다.</div>';
    var sum = document.getElementById('plan-summary');
    if (sum) sum.textContent = (t === 'ot' ? '구약' : '신약') + ' ' + doneAll + ' / ' + totalAll + '장 읽음';
  }

  function bind() {
    document.querySelectorAll('#plan-seg button').forEach(function (b) {
      b.addEventListener('click', function () {
        t = b.getAttribute('data-t');
        document.querySelectorAll('#plan-seg button').forEach(function (x) { x.classList.toggle('active', x === b); });
        render();
      });
    });
    document.getElementById('plan-body').addEventListener('click', async function (e) {
      var cell = e.target.closest('.plan-cell'); if (!cell) return;
      var on = await BibleSync.markRead(cell.getAttribute('data-code'), Number(cell.getAttribute('data-c')));
      cell.classList.toggle('on', on);
      render();
    });
  }

  async function start() {
    if (!window.BibleData) return;
    books = await BibleData.books();
    bind(); render();
    if (window.BibleSync) BibleSync.onChange(render);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
