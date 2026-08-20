document.querySelectorAll('nav button[data-view]').forEach(function (btn) {
  btn.addEventListener('click', function () {
    document.querySelectorAll('main section').forEach(function (s) { s.hidden = true; });
    var view = document.getElementById('view-' + btn.dataset.view);
    if (view) view.hidden = false;
    if (btn.dataset.view === 'schedule' && typeof renderWeeklySchedule === 'function') renderWeeklySchedule(new Date());
    if (btn.dataset.view === 'clients' && typeof renderClientList === 'function') renderClientList();
    if (btn.dataset.view === 'payment-requests' && typeof renderPaymentRequests === 'function') renderPaymentRequests();
    if (btn.dataset.view === 'reconcile' && typeof renderReconcileCheck === 'function') renderReconcileCheck();
  });
});
