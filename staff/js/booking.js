async function submitBooking(formData, existingSessionId) {
  const errorEl = document.getElementById('booking-error');
  errorEl.textContent = '';
  try {
    if (existingSessionId) {
      await callApi('updateSession', Object.assign({ sessionId: existingSessionId }, formData));
    } else {
      await callApi('createSession', formData);
    }
    document.getElementById('booking-dialog').close();
    renderWeeklySchedule(new Date());
  } catch (err) {
    errorEl.textContent = err.message;
  }
}

async function cancelBooking(sessionId) {
  if (!confirm('이 예약을 취소하시겠습니까?')) return;
  await callApi('cancelSession', { sessionId: sessionId });
  renderWeeklySchedule(new Date());
}

async function populateBookingSelects() {
  const [rooms, counselors] = await Promise.all([callApi('listRooms'), callApi('listCounselors')]);
  const roomSelect = document.getElementById('booking-room');
  const counselorSelect = document.getElementById('booking-counselor');
  roomSelect.innerHTML = rooms.map(function (r) { return '<option value="' + r.id + '">' + r['이름'] + '</option>'; }).join('');
  counselorSelect.innerHTML = counselors.map(function (c) { return '<option value="' + c.id + '">' + c['이름'] + '</option>'; }).join('');
}
