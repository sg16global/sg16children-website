(function () {
  var key = 'sg16_session_v1';
  var btn = document.getElementById('btnContinueRobo');
  if (!btn) return;
  try {
    var raw = sessionStorage.getItem(key);
    if (!raw) return;
    var state = JSON.parse(raw);
    if (state && state.parentGatePassed && state.ageTier) {
      btn.classList.remove('is-hidden');
    }
  } catch (_) {}
})();
