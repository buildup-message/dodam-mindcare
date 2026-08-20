async function renderReconcileCheck() {
  const problems = await callApi('reconcileCheck');
  const container = document.getElementById('reconcile-list');
  container.innerHTML = problems.length
    ? problems.map(function (p) { return '<li>' + p.issue + ' — ' + (p['방'] || '') + ' ' + (p['날짜'] || '') + ' (예약ID: ' + p.sessionId + ')</li>'; }).join('')
    : '<li>불일치 없음</li>';
}

document.getElementById('run-reconcile-btn').addEventListener('click', renderReconcileCheck);
