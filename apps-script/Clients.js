function createClient_(body) {
  return appendRow_('Clients', {
    이름: body.name, 연락처: body.phone || '', 나이대: body.ageGroup, 바우처여부: !!body.isVoucher
  });
}

function listClients_() {
  return readRows_('Clients');
}

function addClientNote_(body, email) {
  if (!body.content) throw new Error('메모 내용이 없습니다');
  return appendRow_('ClientNotes', {
    내담자id: body.clientId, 날짜: Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd'),
    작성자: email, 내용: body.content
  });
}

function listClientNotes_(clientId) {
  return readRows_('ClientNotes')
    .filter(function (n) { return String(n['내담자id']) === String(clientId) || String(n['내담자ID']) === String(clientId); })
    .sort(function (a, b) { return a['날짜'] < b['날짜'] ? 1 : -1; });
}
