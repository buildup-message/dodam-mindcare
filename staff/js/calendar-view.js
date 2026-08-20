async function renderCalendarView() {
  const rooms = await callApi('listRooms');
  const colors = ['039BE5', '7CB342', '8E24AA', 'F6BF26', 'F4511E', '0B8043'];
  
  let baseUrl = 'https://calendar.google.com/calendar/embed?height=600&ctz=Asia%2FSeoul&showTitle=0&showNav=1&showDate=1&showPrint=0&showTabs=1&showCalendars=1&showTz=0&mode=WEEK&wkst=1';
  
  rooms.forEach(function(room, index) {
    if (room['구글캘린더ID']) {
      baseUrl += '&src=' + encodeURIComponent(room['구글캘린더ID']);
      baseUrl += '&color=%23' + colors[index % colors.length];
    }
  });

  const container = document.getElementById('view-calendar');
  container.innerHTML = '<iframe src="' + baseUrl + '" style="border:0" width="100%" height="600" frameborder="0" scrolling="no"></iframe>';
}
