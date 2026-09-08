/* 성경아 놀자 - 홈의 「최근 읽은 장」 패널 (home.js) */
(function () {
  'use strict';
  async function start() {
    var host = document.getElementById('bible-recent');
    if (!host || !window.CGAuth || !CGAuth.mountRecentPanel) return;
    var books = await BibleData.books();
    var byCode = {}; books.forEach(function (b) { byCode[b.code] = b; });

    CGAuth.mountRecentPanel(host, {
      title: '📂 최근 읽은 장',
      moreUrl: 'my.html',
      guestText: 'Google 로그인하면 읽기 진도와 즐겨찾기가 계정에 저장돼, 휴대폰에서 읽고 PC에서 이어서 볼 수 있어요.',
      emptyText: '아직 읽은 장이 없어요. 성경 읽기에서 한 장을 읽고 “이 장 읽음 표시”를 눌러 보세요.',
      limit: 8,
      loader: async function () {
        var rows = await CGAuth.listRecords('bible_reading_progress', { orderBy: 'read_at', limit: 8 });
        if (!rows.length && window.BibleSync) {
          // 비로그인/미동기화 상태에서는 이 기기 기록을 보여 줍니다
          rows = BibleSync.readList().slice(-8).reverse().map(function (id) {
            var p = id.split('.');
            return { book: (p[0] || '').toUpperCase(), chapter: Number(p[1]) || 0, read_at: null };
          });
        }
        return rows.map(function (r) {
          var b = byCode[r.book];
          return {
            title: (b ? b.ko : r.book) + ' ' + r.chapter + '장',
            url: 'read.html?b=' + String(r.book).toLowerCase() + '&c=' + r.chapter,
            updated_at: r.read_at
          };
        });
      }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
