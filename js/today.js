/* ============================================================
   성경아 놀자 - 오늘의 말씀 (today.js)
   날짜를 시드로 삼아 매일 같은 구절이 나오도록 고릅니다.
   본문은 언제나 데이터 파일에서 읽어 옵니다.
   ============================================================ */
(function () {
  'use strict';

  var POOL = null;

  function seedOf(d) {
    return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  }
  function pickRef(d) {
    var pool = POOL || (window.BibleRefs ? window.BibleRefs.MEMORY : []);
    if (!pool.length) return null;
    var s = seedOf(d);
    // 간단한 해시로 날짜를 섞습니다 (같은 날 = 같은 구절)
    var h = 0, str = String(s);
    for (var i = 0; i < str.length; i++) h = (h * 131 + str.charCodeAt(i)) % 1000003;
    return pool[h % pool.length];
  }
  function kstDate(offsetDays) {
    var now = new Date(Date.now() + (offsetDays || 0) * 86400000);
    return new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  async function renderOne(ref, box) {
    var p = window.BibleRefs.parse(ref);
    var info = await BibleData.bookInfo(p.code);
    var ko = await BibleData.loadVerse('krv', p.code, p.chapter, p.verse);
    var en = await BibleData.loadVerse('web', p.code, p.chapter, p.verse);
    if (!info) { box.innerHTML = '<div class="empty">구절을 불러오지 못했습니다.</div>'; return; }

    var title = info.ko + ' ' + p.chapter + ':' + p.verse;
    box.innerHTML =
      '<div style="font-weight:800;color:var(--key);margin-bottom:8px">' + esc(title) + '</div>' +
      '<p class="verse-ko" style="margin:0 0 10px">' + esc(ko) + '</p>' +
      '<p class="verse-en" style="margin:0 0 14px">' + esc(en) + '</p>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
      '  <a class="btn btn-sm btn-primary" href="read.html?b=' + p.code.toLowerCase() +
      '&c=' + p.chapter + '&v=' + p.verse + '">이 장 전체 읽기</a>' +
      '  <button type="button" class="btn btn-sm" data-fav="' + esc(ref) + '">⭐ 즐겨찾기</button>' +
      '</div>' +
      '<p style="margin:12px 0 0;font-size:12px;color:var(--muted)">개역한글 · WEB</p>';

    var btn = box.querySelector('[data-fav]');
    if (btn && window.BibleSync) {
      var on = BibleSync.isFav(p.code, p.chapter, p.verse);
      btn.textContent = on ? '★ 즐겨찾기 됨' : '⭐ 즐겨찾기';
      btn.addEventListener('click', async function () {
        var now = await BibleSync.toggleFav({
          code: p.code, chapter: p.chapter, verse: p.verse,
          ko: ko, en: en, bookName: info.ko
        });
        btn.textContent = now ? '★ 즐겨찾기 됨' : '⭐ 즐겨찾기';
      });
    }
  }

  async function renderWeek(box) {
    var rows = [];
    for (var i = 1; i <= 7; i++) {
      var d = kstDate(-i);
      var ref = pickRef(d);
      if (!ref) continue;
      var p = window.BibleRefs.parse(ref);
      var info = await BibleData.bookInfo(p.code);
      var ko = await BibleData.loadVerse('krv', p.code, p.chapter, p.verse);
      rows.push(
        '<a class="cg-rec-row" href="read.html?b=' + p.code.toLowerCase() + '&c=' + p.chapter + '&v=' + p.verse + '">' +
        '<span class="cg-rec-title">' + esc((info ? info.ko : p.code) + ' ' + p.chapter + ':' + p.verse) + '</span>' +
        '<span class="cg-rec-sub">' + esc(ko.slice(0, 40)) + '…</span>' +
        '<span class="cg-rec-when">' + (d.getMonth() + 1) + '/' + d.getDate() + '</span></a>');
    }
    box.innerHTML = rows.length ? '<div class="cg-rec-list">' + rows.join('') + '</div>'
                                : '<div class="empty">표시할 기록이 없습니다.</div>';
  }

  async function start() {
    if (!window.BibleData || !window.BibleRefs) return;
    var box = document.getElementById('today-box');
    var week = document.getElementById('today-week');
    var dateEl = document.getElementById('today-date');

    var d = kstDate(0);
    if (dateEl) dateEl.textContent = (d.getMonth() + 1) + '월 ' + d.getDate() + '일의 말씀';

    if (box) {
      var ref = pickRef(d);
      if (ref) await renderOne(ref, box);
    }
    if (week) await renderWeek(week);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
