function reconcileCheck_() {
  var sessions = readRows_('Sessions').filter(function (s) { return s['상태'] === '예정'; });
  var rooms = readRows_('Rooms');
  var problems = [];
  sessions.forEach(function (s) {
    var room = rooms.filter(function (r) { return String(r.id) === String(s['방']); })[0];
    if (!room) { problems.push({ sessionId: s.id, issue: '방 정보 없음' }); return; }
    if (!eventExists_(room['구글캘린더ID'], s['캘린더이벤트ID'])) {
      problems.push({ sessionId: s.id, issue: '캘린더 이벤트 없음/삭제됨', 방: room['이름'], 날짜: s['날짜'] });
    }
  });
  return problems;
}
