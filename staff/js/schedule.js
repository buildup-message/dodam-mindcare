function mondayOf(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function isoDate(d) {
  return d.toISOString().slice(0, 10);
}

async function renderWeeklySchedule(anchorDate) {
  const monday = mondayOf(anchorDate);
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);

  const [rooms, sessions] = await Promise.all([
    callApi('listRooms'),
    callApi('listSessions', { startDate: isoDate(monday), endDate: isoDate(sunday) })
  ]);

  const container = document.getElementById('schedule-grid');
  container.innerHTML = '';

  rooms.forEach(function (room) {
    const roomSessions = sessions.filter(function (s) { return String(s['방']) === String(room.id); });
    const block = document.createElement('div');
    block.className = 'room-block';
    block.innerHTML = '<h3>' + room['이름'] + '</h3>';
    const list = document.createElement('ul');
    roomSessions
      .sort(function (a, b) { return (a['날짜'] + a['시작시간']).localeCompare(b['날짜'] + b['시작시간']); })
      .forEach(function (s) {
        const li = document.createElement('li');
        li.textContent = s['날짜'] + ' ' + s['시작시간'] + '~' + s['종료시간'] + ' ' + s['상담사이름'];
        li.dataset.sessionId = s.id;
        list.appendChild(li);
      });
    block.appendChild(list);
    container.appendChild(block);
  });
}
