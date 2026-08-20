async function callApi(action, payload) {
  const body = Object.assign({ action: action, idToken: getIdToken() }, payload || {});
  const res = await fetch(window.DODAM_STAFF_CONFIG.apiUrl, {
    method: 'POST',
    body: JSON.stringify(body)
  });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error);
  return json.data;
}
