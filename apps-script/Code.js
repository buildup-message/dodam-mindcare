function doGet(e) {
  return handleRequest_(e);
}
function doPost(e) {
  return handleRequest_(e);
}

function handleRequest_(e) {
  try {
    var body = parseBody_(e);
    if (!body.action) return jsonError_('action이 없습니다');
    if (body.action === 'ping') return jsonOk_({ pong: true });
    if (body.action === 'runSelfTests') {
      var result = runAllSelfTests();
      return jsonOk_(result);
    }
    if (body.action === 'checkHeaders') {
      return jsonOk_(getSheet_('ClientNotes').getRange(1, 1, 1, getSheet_('ClientNotes').getLastColumn()).getValues()[0]);
    }
    var auth = requireAuth_(body.idToken);
    if (!auth.ok) return jsonError_(auth.error);
    return jsonOk_(dispatch_(body.action, body, auth.email));
  } catch (err) {
    return jsonError_(String(err && err.message || err));
  }
}

function parseBody_(e) {
  if (e.postData && e.postData.contents) return JSON.parse(e.postData.contents);
  return e.parameter || {};
}

function dispatch_(action, body, email) {
  switch (action) {
    case 'listRooms': return readRows_('Rooms');
    case 'listCounselors': return readRows_('Counselors');
    case 'listSessions': return listSessionsInRange_(body.startDate, body.endDate);
    case 'createSession': return createSession_(body, email);
    case 'updateSession': return updateSession_(body, email);
    case 'cancelSession': return cancelSession_(body.sessionId, email);
    case 'listClients': return listClients_();
    case 'createClient': return createClient_(body);
    case 'addClientNote': return addClientNote_(body, email);
    case 'listClientNotes': return listClientNotes_(body.clientId);
    case 'reconcileCheck': return reconcileCheck_();
    case 'recordPayment': return recordPayment_(body, email);
    case 'listPayments': return listPayments_(body.clientId);
    case 'nextDueDate': return { date: nextDueDate_(body.clientId) };
    case 'createPaymentRequest': return createPaymentRequest_(body, email);
    case 'updatePaymentRequestStatus': return updatePaymentRequestStatus_(body, email);
    case 'listPaymentRequests': return listPaymentRequests_();
    default:
      throw new Error('알 수 없는 action: ' + action);
  }
}

function jsonOk_(data) {
  return ContentService.createTextOutput(JSON.stringify({ ok: true, data: data }))
    .setMimeType(ContentService.MimeType.JSON);
}
function jsonError_(message) {
  return ContentService.createTextOutput(JSON.stringify({ ok: false, error: message }))
    .setMimeType(ContentService.MimeType.JSON);
}
