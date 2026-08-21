async function callApi(action, payload) {
  const body = Object.assign({ action: action, idToken: getIdToken() }, payload || {});
  const res = await fetch(window.DODAM_STAFF_CONFIG.apiUrl, {
    method: 'POST',
    body: JSON.stringify(body)
  });
  const json = await res.json();
  if (!json.ok) {
    if (json.error === '로그인이 필요합니다' || json.error === '유효하지 않은 로그인 정보입니다' || json.error.includes('접근 권한이 없습니다')) {
      if (typeof clearAuthAndGoToLogin === 'function') {
        clearAuthAndGoToLogin();
      }
    }
    throw new Error(json.error);
  }
  return json.data;
}
