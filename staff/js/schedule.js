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
        li.textContent = s['날짜'] + ' ' + s['시작시간'] + '~' + s['종료시간'] + ' ' + s['상담사이름'] + ' (' + s['유형'] + ') — ' + (s['대상'] || '');
        li.dataset.sessionId = s.id;
        li.style.cursor = 'pointer';
        li.addEventListener('click', function () { openEditBookingDialog(s); });
        list.appendChild(li);
      });
    block.appendChild(list);
    container.appendChild(block);
  });
}

async function openEditBookingDialog(session) {
  await populateBookingSelects();
  
  document.getElementById('booking-room').value = session['방'];
  document.getElementById('booking-counselor').value = session['상담사'];
  document.getElementById('booking-target-name').value = session['대상'] || '';
  document.getElementById('booking-type').value = session['유형'];
  document.getElementById('booking-date').value = session['날짜'];
  document.getElementById('booking-start').value = session['시작시간'];
  document.getElementById('booking-end').value = session['종료시간'];
  document.getElementById('booking-recurrence').value = ''; // 반복 수정은 지원되지 않거나 개별 건으로 취급
  
  document.getElementById('booking-delete-btn').style.display = 'inline-block';
  document.getElementById('booking-delete-btn').onclick = function () {
    cancelBooking(session.id);
  };
  
  document.getElementById('booking-form').onsubmit = function (e) {
    e.preventDefault();
    submitBooking({
      roomId: document.getElementById('booking-room').value,
      counselorId: document.getElementById('booking-counselor').value,
      counselorName: document.getElementById('booking-counselor').selectedOptions[0].textContent,
      targetId: '', targetName: document.getElementById('booking-target-name').value,
      sessionType: document.getElementById('booking-type').value,
      date: document.getElementById('booking-date').value,
      startTime: document.getElementById('booking-start').value,
      endTime: document.getElementById('booking-end').value,
      recurrence: document.getElementById('booking-recurrence').value || null
    }, session.id);
  };
  document.getElementById('booking-dialog').showModal();
}

document.getElementById('new-booking-btn').addEventListener('click', async function () {
  await populateBookingSelects();
  document.getElementById('booking-form').reset();
  document.getElementById('booking-delete-btn').style.display = 'none';
  
  document.getElementById('booking-form').onsubmit = function (e) {
    e.preventDefault();
    submitBooking({
      roomId: document.getElementById('booking-room').value,
      counselorId: document.getElementById('booking-counselor').value,
      counselorName: document.getElementById('booking-counselor').selectedOptions[0].textContent,
      targetId: '', targetName: document.getElementById('booking-target-name').value,
      sessionType: document.getElementById('booking-type').value,
      date: document.getElementById('booking-date').value,
      startTime: document.getElementById('booking-start').value,
      endTime: document.getElementById('booking-end').value,
      recurrence: document.getElementById('booking-recurrence').value || null
    });
  };
  document.getElementById('booking-dialog').showModal();
});
