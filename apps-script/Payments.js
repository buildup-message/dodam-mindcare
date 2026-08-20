function recordPayment_(body, email) {
  var amount = Number(body.amount);
  var discountAmount = Number(body.discountAmount || 0);
  if (!amount || amount <= 0) throw new Error('금액이 올바르지 않습니다');
  if (!body.coverageEndDate) throw new Error('커버종료일이 필요합니다');

  var netAmount = amount - discountAmount;
  if (netAmount < 0) throw new Error('할인금액이 정가보다 클 수 없습니다');

  var payment = {
    날짜: body.date, 내담자ID: body.clientId, 커버종료일: body.coverageEndDate,
    커버설명: body.coverageNote || '', 금액: amount, 할인금액: discountAmount, 유형: body.paymentType,
    바우처여부: !!body.isVoucher, 결제수단: body.method, 메모: body.memo || '', 입력자: email
  };

  if (body.isVoucher) {
    var selfPay = Number(body.selfPayAmount || 0);
    var subsidy = Number(body.subsidyAmount || 0);
    if (selfPay + subsidy !== netAmount) {
      throw new Error('본인부담금(' + selfPay + ') + 지원금(' + subsidy + ') 합계가 실수령액(' + netAmount + ')과 일치하지 않습니다');
    }
    payment['본인부담금'] = selfPay;
    payment['지원금'] = subsidy;
  }

  return appendRow_('Payments', payment);
}

function listPayments_(clientId) {
  var rows = readRows_('Payments');
  if (clientId) rows = rows.filter(function (r) { return String(r['내담자ID']) === String(clientId); });
  return rows;
}

function nextDueDate_(clientId) {
  var dates = listPayments_(clientId).map(function (p) { return p['커버종료일']; }).filter(Boolean);
  if (!dates.length) return null;
  return dates.reduce(function (latest, d) { return d > latest ? d : latest; });
}
