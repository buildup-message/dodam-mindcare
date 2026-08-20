async function renderPaymentRequests() {
  const requests = await callApi('listPaymentRequests');
  const container = document.getElementById('payment-request-list');
  container.innerHTML = requests.map(function (r) {
    return '<li data-id="' + r.id + '">' + r['내담자ID'] + ' / ' + r['금액'] + '원 / ' + r['상태'] +
      (r['상태'] === '대기' ? ' <button class="pr-send" data-id="' + r.id + '">링크발송함</button>' : '') +
      (r['상태'] === '링크발송함' ? ' <button class="pr-done" data-id="' + r.id + '">완료</button>' : '') +
      '</li>';
  }).join('');
}

document.getElementById('payment-request-list').addEventListener('click', async function (e) {
  if (e.target.classList.contains('pr-send')) {
    await callApi('updatePaymentRequestStatus', { requestId: e.target.dataset.id, status: '링크발송함' });
    renderPaymentRequests();
  }
  if (e.target.classList.contains('pr-done')) {
    const coverageEndDate = prompt('이 결제로 언제까지 보장되나요? (YYYY-MM-DD)');
    if (!coverageEndDate) return;
    await callApi('updatePaymentRequestStatus', { requestId: e.target.dataset.id, status: '완료', coverageEndDate: coverageEndDate });
    renderPaymentRequests();
  }
});

document.getElementById('new-payment-request-form').addEventListener('submit', async function (e) {
  e.preventDefault();
  await callApi('createPaymentRequest', {
    clientId: document.getElementById('pr-client-id').value,
    amount: Number(document.getElementById('pr-amount').value),
    reason: document.getElementById('pr-reason').value
  });
  renderPaymentRequests();
});
