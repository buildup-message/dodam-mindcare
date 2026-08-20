function selfTest_Sheets_() {
  var created = appendRow_('Clients', { 이름: '__SELFTEST__', 연락처: '000', 나이대: '성인', 바우처여부: false });
  if (!created.id) throw new Error('appendRow_ 가 id를 생성하지 않음');
  var found = findRow_('Clients', created.id);
  if (!found || found['이름'] !== '__SELFTEST__') throw new Error('findRow_ 실패');
  updateRow_('Clients', created.id, { 나이대: '아동청소년' });
  var updated = findRow_('Clients', created.id);
  if (updated['나이대'] !== '아동청소년') throw new Error('updateRow_ 실패');
  var deleted = deleteRow_('Clients', created.id);
  if (!deleted) throw new Error('deleteRow_ 실패');
  if (findRow_('Clients', created.id)) throw new Error('삭제 후에도 조회됨');
  Logger.log('selfTest_Sheets_ PASS');
}

function selfTest_Auth_() {
  var allowed = readRows_('AllowedUsers');
  if (!allowed.length) throw new Error('AllowedUsers 탭이 비어있음 — Task 0 Step 3 확인 필요');
  var knownEmail = allowed[0]['이메일'];
  if (!isWhitelisted_(knownEmail)) throw new Error('등록된 이메일인데 화이트리스트 통과 실패');
  if (!isWhitelisted_('  ' + knownEmail.toUpperCase() + '  ')) throw new Error('공백 및 대소문자 무시 실패');
  if (isWhitelisted_('__not_allowed__@example.com')) throw new Error('미등록 이메일이 통과됨');
  Logger.log('selfTest_Auth_ PASS');
}

function selfTest_Calendar_() {
  var calId = PropertiesService.getScriptProperties().getProperty('TEST_CALENDAR_ID');
  if (!calId) throw new Error('TEST_CALENDAR_ID가 설정되어 있지 않습니다');
  var start = '2099-01-05T10:00:00+09:00';
  var end = '2099-01-05T10:50:00+09:00';
  var eventId = createCalendarEvent_(calId, '__SELFTEST__', start, end, null);
  if (!eventExists_(calId, eventId)) throw new Error('생성된 이벤트가 조회되지 않음');
  if (!checkConflict_(calId, start, end, null)) throw new Error('겹치는 이벤트인데 충돌로 감지되지 않음');
  if (checkConflict_(calId, start, end, eventId)) throw new Error('자기 자신 제외가 안 됨');
  deleteCalendarEvent_(calId, eventId);
  if (eventExists_(calId, eventId)) throw new Error('삭제 후에도 이벤트가 존재함');
  Logger.log('selfTest_Calendar_ PASS');
}

function selfTest_Sessions_() {
  var room = readRows_('Rooms')[0];
  if (!room) throw new Error('Rooms 탭에 테스트용 방이 없습니다');
  var counselor = readRows_('Counselors')[0];
  if (!counselor) throw new Error('Counselors 탭이 비어있습니다');
  var client = appendRow_('Clients', { 이름: '__SELFTEST__', 연락처: '000', 나이대: '성인', 바우처여부: false });

  var created = createSession_({
    roomId: room.id, counselorId: counselor.id, counselorName: counselor['이름'],
    targetId: client.id, targetName: client['이름'], sessionType: '일반상담',
    date: '2099-02-10', startTime: '10:00', endTime: '10:50', recurrence: null
  }, 'selftest@example.com');

  var conflictThrown = false;
  try {
    createSession_({
      roomId: room.id, counselorId: counselor.id, counselorName: counselor['이름'],
      targetId: client.id, targetName: client['이름'], sessionType: '일반상담',
      date: '2099-02-10', startTime: '10:30', endTime: '11:00', recurrence: null
    }, 'selftest@example.com');
  } catch (err) { conflictThrown = true; }
  if (!conflictThrown) throw new Error('겹치는 예약인데 충돌 에러가 안 남');

  cancelSession_(created.id, 'selftest@example.com');
  var cancelled = findRow_('Sessions', created.id);
  if (cancelled['상태'] !== '취소') throw new Error('취소 상태 반영 안 됨');

  deleteRow_('Sessions', created.id);
  deleteRow_('Clients', client.id);
  Logger.log('selfTest_Sessions_ PASS');
}

function runAllSelfTests() {
  var tests = ['selfTest_Sheets_', 'selfTest_Auth_', 'selfTest_Calendar_', 'selfTest_Sessions_'];
  var failed = [];
  tests.forEach(function (name) {
    try {
      this[name]();
    } catch (err) {
      failed.push(name + ': ' + err.message);
    }
  }.bind(this));
  if (failed.length) {
    Logger.log('FAILED:\\n' + failed.join('\\n'));
    throw new Error(failed.length + '개 self-test 실패');
  }
  Logger.log('모든 self-test 통과 (' + tests.length + '개)');
}
