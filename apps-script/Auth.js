function requireAuth_(idToken) {
  if (!idToken) return { ok: false, error: '로그인이 필요합니다' };
  var claims = verifyIdToken_(idToken);
  if (!claims) return { ok: false, error: '유효하지 않은 로그인 정보입니다' };
  if (!isWhitelisted_(claims.email)) {
    return { ok: false, error: claims.email + ' 계정은 접근 권한이 없습니다' };
  }
  return { ok: true, email: claims.email };
}

function verifyIdToken_(idToken) {
  var resp = UrlFetchApp.fetch(
    'https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(idToken),
    { muteHttpExceptions: true }
  );
  if (resp.getResponseCode() !== 200) return null;
  var claims = JSON.parse(resp.getContentText());
  var expectedAud = PropertiesService.getScriptProperties().getProperty('OAUTH_CLIENT_ID');
  if (claims.aud !== expectedAud) return null;
  if (claims.email_verified !== 'true' && claims.email_verified !== true) return null;
  return claims;
}

function isWhitelisted_(email) {
  var rows = readRows_('AllowedUsers');
  return rows.some(function (r) { return String(r['이메일']).toLowerCase() === String(email).toLowerCase(); });
}
