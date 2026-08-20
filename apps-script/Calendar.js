function checkConflict_(calendarId, startIso, endIso, excludeEventId) {
  var events = Calendar.Events.list(calendarId, {
    timeMin: startIso,
    timeMax: endIso,
    singleEvents: true,
    showDeleted: false
  });
  var items = events.items || [];
  return items.some(function (ev) {
    return ev.id !== excludeEventId && ev.status !== 'cancelled';
  });
}

function createCalendarEvent_(calendarId, summary, startIso, endIso, recurrenceRule) {
  var event = {
    summary: summary,
    start: { dateTime: startIso, timeZone: 'Asia/Seoul' },
    end: { dateTime: endIso, timeZone: 'Asia/Seoul' }
  };
  if (recurrenceRule) event.recurrence = [recurrenceRule];
  var created = Calendar.Events.insert(event, calendarId);
  return created.id;
}

function updateCalendarEvent_(calendarId, eventId, patch) {
  return Calendar.Events.patch(patch, calendarId, eventId);
}

function deleteCalendarEvent_(calendarId, eventId) {
  Calendar.Events.remove(calendarId, eventId);
}

function eventExists_(calendarId, eventId) {
  try {
    var ev = Calendar.Events.get(calendarId, eventId);
    return ev.status !== 'cancelled';
  } catch (err) {
    return false;
  }
}

function resolveEventInstanceId_(calendarId, masterEventId, dateStr) {
  var master = Calendar.Events.get(calendarId, masterEventId);
  if (!master.recurrence) return masterEventId;
  var instances = Calendar.Events.instances(calendarId, masterEventId, {
    timeMin: dateStr + 'T00:00:00+09:00',
    timeMax: dateStr + 'T23:59:59+09:00'
  });
  if (!instances.items || !instances.items.length) {
    throw new Error('해당 날짜의 반복 일정 회차를 찾을 수 없습니다: ' + dateStr);
  }
  return instances.items[0].id;
}
