async function renderClientList() {
  const clients = await callApi('listClients');
  const container = document.getElementById('client-list');
  container.innerHTML = '';
  clients.forEach(function (c) {
    const li = document.createElement('li');
    li.textContent = c['이름'] + (c['바우처여부'] ? ' (바우처)' : '');
    li.addEventListener('click', function () { openClientDetail(c.id, c['이름']); });
    container.appendChild(li);
  });
}

async function openClientDetail(clientId, name) {
  const notes = await callApi('listClientNotes', { clientId: clientId });
  document.getElementById('client-detail-name').textContent = name;
  const list = document.getElementById('client-notes-list');
  list.innerHTML = notes.map(function (n) {
    return '<li>[' + n['날짜'] + ' ' + n['작성자'] + '] ' + n['내용'] + '</li>';
  }).join('');
  document.getElementById('client-note-form').dataset.clientId = clientId;
  document.getElementById('client-detail-dialog').showModal();
}

document.getElementById('client-note-form').addEventListener('submit', async function (e) {
  e.preventDefault();
  const clientId = e.target.dataset.clientId;
  const content = document.getElementById('client-note-input').value;
  await callApi('addClientNote', { clientId: clientId, content: content });
  document.getElementById('client-note-input').value = '';
  openClientDetail(clientId, document.getElementById('client-detail-name').textContent);
});

document.getElementById('open-payment-btn').addEventListener('click', function () {
  const clientId = document.getElementById('client-note-form').dataset.clientId;
  document.getElementById('payment-client-id').value = clientId;
  document.getElementById('payment-dialog').showModal();
});
