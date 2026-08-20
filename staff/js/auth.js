let idToken = null;

function initGoogleLogin(onSuccess) {
  google.accounts.id.initialize({
    client_id: window.DODAM_STAFF_CONFIG.googleClientId,
    callback: function (response) {
      idToken = response.credential;
      onSuccess();
    }
  });
  google.accounts.id.renderButton(
    document.getElementById('google-signin-button'),
    { theme: 'outline', size: 'large' }
  );
}

function getIdToken() {
  if (!idToken) throw new Error('로그인이 필요합니다');
  return idToken;
}
