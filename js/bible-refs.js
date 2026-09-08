/* ============================================================
   성경아 놀자 - 구절 "주소" 목록 (bible-refs.js)

   ※ 이 파일에는 성경 본문이 한 줄도 들어 있지 않습니다.
     "어느 책 몇 장 몇 절" 이라는 주소만 담고 있고,
     본문은 언제나 data/krv · data/web 의 원본 파일에서 읽어 옵니다.
     (개역한글 동일성유지권 / WEB 상표 조건 준수)

   주소 형식: 'jhn.3.16'  =  요한복음 3장 16절
   ============================================================ */

(function (global) {
  'use strict';

  // ---------- 주제별 말씀 (상황별 참고 모음) ----------
  var TOPICS = [
    { id: 'comfort', name: '위로가 필요할 때', emoji: '🕊️', refs: [
      'psa.23.1','psa.23.4','psa.34.18','psa.147.3','isa.41.10','isa.43.2',
      'mat.11.28','jhn.14.27','rom.8.28','2co.1.3','1pe.5.7','rev.21.4' ] },
    { id: 'anxiety', name: '불안하고 두려울 때', emoji: '🌊', refs: [
      'jos.1.9','psa.27.1','psa.56.3','psa.94.19','isa.41.13','mat.6.34',
      'phi.4.6','phi.4.7','2ti.1.7','1jn.4.18' ] },
    { id: 'thanks', name: '감사할 때', emoji: '🌾', refs: [
      'psa.100.4','psa.103.2','psa.107.1','psa.136.1','1th.5.18','col.3.15',
      'eph.5.20','jas.1.17' ] },
    { id: 'love', name: '사랑에 대하여', emoji: '💗', refs: [
      'jhn.3.16','jhn.13.34','jhn.15.13','rom.5.8','1co.13.4','1co.13.7',
      '1co.13.13','1jn.4.7','1jn.4.19','eph.4.32' ] },
    { id: 'strength', name: '힘이 필요할 때', emoji: '⛰️', refs: [
      'psa.18.2','psa.46.1','isa.40.29','isa.40.31','phi.4.13','eph.6.10',
      '2co.12.9','neh.8.10' ] },
    { id: 'guide', name: '길을 찾을 때', emoji: '🧭', refs: [
      'psa.32.8','psa.119.105','pro.3.5','pro.3.6','pro.16.9','isa.30.21',
      'jer.29.11','jas.1.5' ] },
    { id: 'forgive', name: '용서에 대하여', emoji: '🤝', refs: [
      'psa.103.12','pro.17.9','mat.6.14','mat.18.21','mrk.11.25','luk.6.37',
      'eph.4.32','col.3.13','1jn.1.9' ] },
    { id: 'hope', name: '소망을 품을 때', emoji: '🌅', refs: [
      'psa.42.11','pro.23.18','isa.40.31','jer.29.11','rom.5.5','rom.15.13',
      'heb.11.1','1pe.1.3' ] },
    { id: 'family', name: '가정을 위하여', emoji: '🏡', refs: [
      'jos.24.15','psa.127.3','pro.22.6','eph.5.25','eph.6.1','eph.6.4',
      'col.3.20','1ti.5.8' ] },
    { id: 'work', name: '일과 수고에 대하여', emoji: '🛠️', refs: [
      'gen.2.15','pro.16.3','ecc.3.13','ecc.9.10','col.3.23','1th.4.11',
      '2th.3.10','gal.6.9' ] }
  ];

  // ---------- 암송 카드용 구절 ----------
  var MEMORY = [
    'gen.1.1','jos.1.9','psa.1.1','psa.23.1','psa.119.105','pro.3.5',
    'isa.41.10','isa.53.5','jer.29.11','mat.5.3','mat.6.33','mat.11.28',
    'mat.28.19','jhn.1.1','jhn.3.16','jhn.14.6','jhn.15.5','act.1.8',
    'rom.3.23','rom.5.8','rom.8.28','rom.12.2','1co.10.13','1co.13.13',
    '2co.5.17','gal.2.20','eph.2.8','phi.4.6','phi.4.13','col.3.23',
    '1th.5.16','2ti.3.16','heb.11.1','heb.13.8','jas.1.5','1pe.5.7',
    '1jn.1.9','rev.3.20'
  ];

  // ---------- 퀴즈 출제 대상 구절 ----------
  //  본문은 데이터 파일에서 읽어와 그 자리에서 빈칸을 만듭니다.
  var QUIZ_POOL = MEMORY.concat([
    'psa.46.1','psa.100.4','pro.16.9','isa.40.31','mat.7.7','mat.22.37',
    'luk.6.31','jhn.13.34','rom.6.23','rom.10.9','gal.5.22','eph.6.10',
    'phi.2.3','col.3.13','1th.5.18','heb.4.12','jas.2.17','1pe.3.15'
  ]);

  // ---------- 읽기표 (통독 순서 = 성경 순서) ----------
  //  실제 장 수는 data/index.json 에서 읽어 옵니다.
  var PLAN = { id: 'whole', name: '성경 전체 통독', desc: '창세기부터 요한계시록까지 순서대로 읽습니다.' };

  global.BibleRefs = {
    TOPICS: TOPICS,
    MEMORY: MEMORY,
    QUIZ_POOL: QUIZ_POOL,
    PLAN: PLAN,
    parse: function (ref) {
      var p = String(ref || '').split('.');
      return { code: (p[0] || '').toUpperCase(), chapter: Number(p[1]) || 0, verse: Number(p[2]) || 0 };
    }
  };
})(typeof window !== 'undefined' ? window : this);
