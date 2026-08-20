function createPaymentRequest_(body, email) {
  return appendRow_('PaymentRequests', {
    요청일: Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd'),
    내담자ID: body.clientId, 사유: body.reason || '다음 회기분', 금액: Number(body.amount), 상태: '대기'
  });
}

function updatePaymentRequestStatus_(body, email) {
  var request = findRow_('PaymentRequests', body.requestId);
  if (!request) throw new Error('결제요청을 찾을 수 없습니다: ' + body.requestId);
  var today = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd');

  if (body.status === '링크발송함') {
    return updateRow_('PaymentRequests', body.requestId, { 상태: '링크발송함', 링크발송일: today });
  }

  if (body.status === '완료') {
    if (!body.coverageEndDate) throw new Error('완료 처리하려면 커버종료일이 필요합니다');
    var updated = updateRow_('PaymentRequests', body.requestId, { 상태: '완료', 완료일: today });
    recordPayment_({
      clientId: request['내담자ID'], date: today, coverageEndDate: body.coverageEndDate,
      coverageNote: request['사유'], amount: request['금액'], discountAmount: 0, paymentType: body.paymentType || '개인상담',
      isVoucher: false, method: '카드(페이히어 링크결제)'
    }, email);
    return updated;
  }

  throw new Error('알 수 없는 상태: ' + body.status);
}

function listPaymentRequests_() {
  return readRows_('PaymentRequests').filter(function (r) { return r['상태'] !== '완료'; });
}
