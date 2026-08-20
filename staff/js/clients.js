async function renderClientList() {
  const clients = await callApi('listClients');
  const container = document.getElementById('client-list');
  container.innerHTML = '';
  clients.forEach(function (c) {
    const li = document.createElement('li');
    li.textContent = c['이름'] + ' (' + (c['연락처'] || '연락처 없음') + ')' + (c['바우처여부'] ? ' [바우처]' : '');
    li.addEventListener('click', function () { openClientDetail(c); });
    container.appendChild(li);
  });
}

async function openClientDetail(client) {
  const notes = await callApi('listClientNotes', { clientId: client.id });
  document.getElementById('client-detail-name').textContent = client['이름'];
  document.getElementById('client-detail-phone').textContent = client['연락처'] || '연락처 없음';
  
  const list = document.getElementById('client-notes-list');
  list.innerHTML = notes.map(function (n) {
    return '<li>[' + n['날짜'] + ' ' + n['작성자'] + '] ' + n['내용'] + '</li>';
  }).join('');
  document.getElementById('client-note-form').dataset.clientId = client.id;
  document.getElementById('client-detail-dialog').showModal();
}

document.getElementById('client-note-form').addEventListener('submit', async function (e) {
  e.preventDefault();
  const clientId = e.target.dataset.clientId;
  const content = document.getElementById('client-note-input').value;
  await callApi('addClientNote', { clientId: clientId, content: content });
  document.getElementById('client-note-input').value = '';
  
  // Re-fetch the client from API to keep the detail view updated
  const clients = await callApi('listClients');
  const client = clients.find(c => String(c.id) === String(clientId));
  if (client) openClientDetail(client);
});

document.getElementById('open-payment-btn').addEventListener('click', function () {
  const clientId = document.getElementById('client-note-form').dataset.clientId;
  document.getElementById('payment-client-id').value = clientId;
  document.getElementById('payment-dialog').showModal();
});

document.getElementById('new-client-btn').addEventListener('click', function () {
  document.getElementById('new-client-dialog').showModal();
});

document.getElementById('new-client-form').addEventListener('submit', async function (e) {
  e.preventDefault();
  const errorEl = document.getElementById('new-client-error');
  errorEl.textContent = '';
  try {
    await callApi('createClient', {
      name: document.getElementById('new-client-name').value,
      phone: document.getElementById('new-client-phone').value,
      ageGroup: document.getElementById('new-client-age').value,
      isVoucher: document.getElementById('new-client-voucher').checked
    });
    document.getElementById('new-client-dialog').close();
    e.target.reset();
    renderClientList();
  } catch (err) {
    errorEl.textContent = err.message;
  }
});
