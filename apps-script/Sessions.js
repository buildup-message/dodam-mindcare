function createSession_(body, email) {
  var room = findRow_('Rooms', body.roomId);
  if (!room) throw new Error('방을 찾을 수 없습니다: ' + body.roomId);
  var startIso = body.date + 'T' + body.startTime + ':00+09:00';
  var endIso = body.date + 'T' + body.endTime + ':00+09:00';

  if (checkConflict_(room['구글캘린더ID'], startIso, endIso, null)) {
    throw new Error('이미 예약된 시간입니다: ' + room['이름'] + ' ' + body.date + ' ' + body.startTime);
  }

  var recurrenceRule = null;
  if (body.recurrence === 'WEEKLY') recurrenceRule = 'RRULE:FREQ=WEEKLY';
  if (body.recurrence === 'BIWEEKLY') recurrenceRule = 'RRULE:FREQ=WEEKLY;INTERVAL=2';

  var title = (body.counselorName || '') + ' - ' + (body.targetName || '') + ' (' + body.sessionType + ')';
  var eventId = createCalendarEvent_(room['구글캘린더ID'], title, startIso, endIso, recurrenceRule);

  return appendRow_('Sessions', {
    캘린더이벤트ID: eventId, 날짜: body.date, 시작시간: body.startTime, 종료시간: body.endTime,
    상담사: body.counselorId, 방: body.roomId, 유형: body.sessionType, 대상: body.targetId,
    반복여부: body.recurrence || '없음', 상태: '예정', 등록자: email
  });
}

function updateSession_(body, email) {
  var session = findRow_('Sessions', body.sessionId);
  if (!session) throw new Error('예약을 찾을 수 없습니다: ' + body.sessionId);
  var room = findRow_('Rooms', session['방']);
  var newStartIso = body.date + 'T' + body.startTime + ':00+09:00';
  var newEndIso = body.date + 'T' + body.endTime + ':00+09:00';
  var targetEventId = resolveEventInstanceId_(room['구글캘린더ID'], session['캘린더이벤트ID'], session['날짜']);

  if (checkConflict_(room['구글캘린더ID'], newStartIso, newEndIso, targetEventId)) {
    throw new Error('이미 예약된 시간입니다.');
  }

  updateCalendarEvent_(room['구글캘린더ID'], targetEventId, {
    start: { dateTime: newStartIso, timeZone: 'Asia/Seoul' },
    end: { dateTime: newEndIso, timeZone: 'Asia/Seoul' }
  });

  return updateRow_('Sessions', body.sessionId, { 날짜: body.date, 시작시간: body.startTime, 종료시간: body.endTime });
}

function cancelSession_(sessionId, email) {
  var session = findRow_('Sessions', sessionId);
  if (!session) throw new Error('예약을 찾을 수 없습니다: ' + sessionId);
  var room = findRow_('Rooms', session['방']);
  var targetEventId = resolveEventInstanceId_(room['구글캘린더ID'], session['캘린더이벤트ID'], session['날짜']);
  deleteCalendarEvent_(room['구글캘린더ID'], targetEventId);
  return updateRow_('Sessions', sessionId, { 상태: '취소' });
}

function listSessionsInRange_(startDate, endDate) {
  var sessions = readRows_('Sessions').filter(function (s) {
    return s['날짜'] >= startDate && s['날짜'] <= endDate && s['상태'] !== '취소';
  });
  var rooms = readRows_('Rooms');
  var counselors = readRows_('Counselors');
  return sessions.map(function (s) {
    var room = rooms.filter(function (r) { return String(r.id) === String(s['방']); })[0];
    var counselor = counselors.filter(function (c) { return String(c.id) === String(s['상담사']); })[0];
    return Object.assign({}, s, {
      방이름: room ? room['이름'] : '',
      상담사이름: counselor ? counselor['이름'] : ''
    });
  });
}
