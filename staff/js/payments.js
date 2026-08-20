async function submitPayment(formData) {
  const errorEl = document.getElementById('payment-error');
  errorEl.textContent = '';
  try {
    await callApi('recordPayment', formData);
    document.getElementById('payment-dialog').close();
    alert('결제가 기록되었습니다.');
  } catch (err) {
    errorEl.textContent = err.message;
  }
}

document.getElementById('payment-form').addEventListener('submit', function (e) {
  e.preventDefault();
  submitPayment({
    clientId: document.getElementById('payment-client-id').value,
    date: document.getElementById('payment-date').value,
    coverageEndDate: document.getElementById('payment-coverage-end').value,
    coverageNote: document.getElementById('payment-coverage-note').value,
    amount: Number(document.getElementById('payment-amount').value),
    discountAmount: Number(document.getElementById('payment-discount').value || 0),
    paymentType: document.getElementById('payment-type').value,
    isVoucher: document.getElementById('payment-is-voucher').checked,
    selfPayAmount: Number(document.getElementById('payment-selfpay').value || 0),
    subsidyAmount: Number(document.getElementById('payment-subsidy').value || 0),
    method: document.getElementById('payment-method').value
  });
});

document.getElementById('payment-is-voucher').addEventListener('change', function (e) {
  document.getElementById('voucher-fields').hidden = !e.target.checked;
});

function updateNetAmount() {
  const amount = Number(document.getElementById('payment-amount').value || 0);
  const discount = Number(document.getElementById('payment-discount').value || 0);
  const netAmount = amount - discount;
  document.getElementById('payment-net-amount').textContent = Math.max(0, netAmount) + ' 원';
}

document.getElementById('payment-amount').addEventListener('input', updateNetAmount);
document.getElementById('payment-discount').addEventListener('input', updateNetAmount);
