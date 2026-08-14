# 도담마인드케어 상담센터 CRM Phase 1 — 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 상담 일정 공유·관리(방 충돌 검사 포함) + 상담비 결제 기록(개인/그룹·바우처·아동청소년 유연 커버범위) +
내담자 메모 이력 + 결제요청(링크결제) 상태추적을 하나의 관리자 페이지(`/staff/`)로 제공한다.

**Architecture:** Google Sheets(도메인 데이터) + Google Calendar(방 6개, 반복/예외는 구글 기능에 위임) +
Google Apps Script Web App(단일 진입점 API, ID 토큰 검증 기반 인증) + 정적 프론트엔드(`/staff/`,
dodam-mindcare 저장소에 통합). PG 결제 실제 처리는 Phase 2(본 계획 범위 밖).

**Tech Stack:** Google Apps Script(V8, `clasp`로 로컬 개발), Google Sheets API/Calendar Advanced Service,
Google Identity Services(클라이언트 로그인), Vanilla HTML/CSS/JS(기존 홈페이지와 동일 컨벤션, 프레임워크 없음).

## Global Constraints

- 저장 위치: `~/websites/dodam-mindcare` 저장소 내 `/staff/`(프론트) + `/apps-script/`(백엔드, clasp 프로젝트) — 별도 저장소 만들지 않음
- 인증: 선생님·운영자 개인 Gmail 로그인(Google Identity Services) + 서버측 이메일 화이트리스트, 코드에 비밀키 없음
- 방 충돌 시 예약 저장을 무조건 차단(예외 없음)
- 반복 예약·"이번 회차만" 예외 처리는 Google Calendar 기능을 그대로 사용 — 직접 재구현 금지
- 결제 커버범위는 나이대별 고정 규칙이 아니라 매 결제마다 커버종료일(날짜)을 직접 지정
- ClientNotes는 append-only(덮어쓰기 금지)
- PaymentRequests(결제요청)는 Phase 1에서 수동 발송 + 상태추적만, 자동 발송 API 연동은 하지 않음(페이히어 API 확인 후 별도 업그레이드)
- 대규모 테스트 프레임워크 도입 금지 — Apps Script 내 assert 기반 self-test 함수 + 수동 브라우저 시나리오 확인
- 실제 카드결제 처리(PG 연동) 코드는 이 계획에 포함하지 않음(Phase 2)

## 구현 단계에서 확정된 보충 데이터 모델

스펙(`docs/superpowers/specs/2026-08-14-counseling-crm-design.md`)의 "화이트리스트" 개념을 실제로
구현하려면 로그인 허용 대상(상담사 4명 + 운영자, 상담사가 아닌 운영자도 포함)을 담을 탭이 필요하다.
Counselors 탭은 상담사 고유 정보(담당분야 등)만 담고, 로그인 허용 여부는 별도 탭으로 분리한다.

### AllowedUsers (로그인 허용 이메일 화이트리스트)
| 필드 | 설명 |
|---|---|
| 이메일 | 로그인 허용 Gmail 주소 |
| 이름 | |
| 역할 | 상담사 / 운영자 |

---

## Task 0: Google 리소스 준비 (수동, 코드 없음)

이 작업은 오너가 직접 Google 계정에서 수행해야 한다(에이전트가 브라우저·계정 접근 불가).
**담당: 오너(황성현) 직접 수행. 완료 후 다음 값들을 확보해서 Task 1에 전달.**

- [ ] **Step 1: 관리용 Google 계정 확정**
  이 CRM의 모든 Google 리소스(시트·캘린더·Apps Script)를 소유할 계정 하나를 정한다(예: 도담마인드케어
  대표 Gmail). 이후 모든 리소스를 이 계정으로 생성한다.

- [ ] **Step 2: Google Sheet 생성**
  새 스프레드시트를 만들고 이름을 "도담마인드케어 CRM 데이터"로 지정. 아래 탭을 각각 만들고
  1행에 헤더를 정확히 입력한다(순서·철자 그대로):
  - `Counselors`: id, 이름, 담당분야, 로그인이메일
  - `AllowedUsers`: 이메일, 이름, 역할
  - `Rooms`: id, 이름, 구글캘린더ID
  - `Clients`: id, 이름, 연락처, 나이대, 바우처여부
  - `ClientNotes`: id, 내담자ID, 날짜, 작성자, 내용
  - `Groups`: id, 유형, 그룹명, 요일, 시간, 담당상담사, 방, 반복주기
  - `GroupMembers`: groupId, clientId, 시작일, 종료일
  - `Sessions`: id, 캘린더이벤트ID, 날짜, 시작시간, 종료시간, 상담사, 방, 유형, 대상, 반복여부, 상태, 등록자
  - `Payments`: id, 날짜, 내담자ID, 커버종료일, 커버설명, 금액, 유형, 바우처여부, 본인부담금, 지원금, 결제수단, 메모, 입력자
  - `PaymentRequests`: id, 요청일, 내담자ID, 사유, 금액, 상태, 링크발송일, 완료일
  주소창 URL에서 `/d/`와 `/edit` 사이 문자열이 **SPREADSHEET_ID** — 기록해둔다.

- [ ] **Step 3: Counselors·AllowedUsers 초기 데이터 입력**
  Counselors 탭에 4명(최지혜/대표원장, 손선재/원장, 황성현/슬로우리딩+사회성, 최윤정/사회성) 입력.
  AllowedUsers 탭에 이 4명 + 운영자 이메일을 전부 입력(로그인 허용 대상 전원).

- [ ] **Step 4: Google Calendar 6개 생성**
  Google Calendar에서 새 캘린더 6개 생성: 최지혜 대표원장방·손선재 원장방·모래놀이치료실·놀이치료실·
  세미나실·대표방(황성현). 각 캘린더 설정 → "캘린더 통합" → **캘린더 ID** 복사. Rooms 탭에 6행 입력
  (이름 + 구글캘린더ID). 이 중 아무 방이나 하나를 self-test용으로도 재사용할 것이므로 별도 테스트
  캘린더는 만들지 않는다.

- [ ] **Step 5: Google Cloud OAuth Client ID 생성**
  [Google Cloud Console](https://console.cloud.google.com/) → 새 프로젝트("dodam-crm") → "APIs & Services"
  → "Credentials" → "Create Credentials" → "OAuth client ID" → Application type: **Web application**.
  "Authorized JavaScript origins"에 `https://buildup-message.github.io` 추가(dodam-mindcare GitHub Pages
  도메인). 생성된 **Client ID**(`....apps.googleusercontent.com` 형태)를 기록해둔다.

- [ ] **Step 6: Apps Script 프로젝트 생성 + Advanced Calendar Service 활성화**
  [script.google.com](https://script.google.com) → 새 프로젝트("도담CRM백엔드") 생성. 왼쪽 "서비스" → "+"
  → "Calendar API" 추가(Advanced Service). 프로젝트 설정에서 **스크립트 ID**를 기록해둔다.
  프로젝트 → "프로젝트 설정" → "스크립트 속성"에 다음 2개 등록:
  - `SPREADSHEET_ID` = Step 2에서 기록한 값
  - `OAUTH_CLIENT_ID` = Step 5에서 기록한 값
  - `TEST_CALENDAR_ID` = Step 4의 방 중 아무거나 하나의 캘린더ID

- [ ] **Step 7: 오너가 다음 4개 값을 다음 작업자에게 전달**
  `SPREADSHEET_ID`, `OAUTH_CLIENT_ID`, Apps Script **스크립트 ID**, 6개 **방 이름→캘린더ID** 매핑.
  (Apps Script Web App 배포·URL 발급은 Task 1 마지막에 진행한다.)

---

## Task 1: 저장소 구조 세팅 + Apps Script 스켈레톤 배포

**Files:**
- Create: `apps-script/appsscript.json`
- Create: `apps-script/Code.js`
- Create: `apps-script/.clasp.json.example`
- Create: `apps-script/.gitignore`
- Create: `staff/index.html`
- Create: `staff/js/config.js`

**Interfaces:**
- Produces: `doGet(e)`, `doPost(e)` (Apps Script entrypoint), `handleRequest_(e)`, `parseBody_(e)`,
  `dispatch_(action, body, email)`, `jsonOk_(data)`, `jsonError_(message)` — 이후 모든 Task가 이 라우팅을 통해
  기능을 추가한다.

- [ ] **Step 1: clasp 설치·로그인 확인**

```bash
npm install -g @google/clasp
clasp login
```

- [ ] **Step 2: 저장소에 apps-script 디렉터리 생성**

```bash
mkdir -p ~/websites/dodam-mindcare/apps-script
cd ~/websites/dodam-mindcare/apps-script
```

- [ ] **Step 3: appsscript.json 작성**

`apps-script/appsscript.json`:
```json
{
  "timeZone": "Asia/Seoul",
  "dependencies": {
    "enabledAdvancedServices": [
      { "userSymbol": "Calendar", "version": "v3", "serviceId": "calendar" }
    ]
  },
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8",
  "webapp": {
    "access": "ANYONE_ANONYMOUS",
    "executeAs": "USER_DEPLOYING"
  }
}
```

- [ ] **Step 4: Code.js 라우팅 스켈레톤 작성**

`apps-script/Code.js`:
```js
function doGet(e) {
  return handleRequest_(e);
}
function doPost(e) {
  return handleRequest_(e);
}

function handleRequest_(e) {
  try {
    var body = parseBody_(e);
    if (!body.action) return jsonError_('action이 없습니다');
    if (body.action === 'ping') return jsonOk_({ pong: true });
    var auth = requireAuth_(body.idToken);
    if (!auth.ok) return jsonError_(auth.error);
    return jsonOk_(dispatch_(body.action, body, auth.email));
  } catch (err) {
    return jsonError_(String(err && err.message || err));
  }
}

function parseBody_(e) {
  if (e.postData && e.postData.contents) return JSON.parse(e.postData.contents);
  return e.parameter || {};
}

function dispatch_(action, body, email) {
  switch (action) {
    default:
      throw new Error('알 수 없는 action: ' + action);
  }
}

function jsonOk_(data) {
  return ContentService.createTextOutput(JSON.stringify({ ok: true, data: data }))
    .setMimeType(ContentService.MimeType.JSON);
}
function jsonError_(message) {
  return ContentService.createTextOutput(JSON.stringify({ ok: false, error: message }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

주의: `ContentService`는 HTTP 상태코드를 커스텀할 수 없다(Apps Script 제약) — 항상 200을 반환하고,
성공/실패는 응답 바디의 `ok` 필드로 구분한다. 프론트엔드는 항상 `json.ok`를 확인해야 한다.

- [ ] **Step 5: 임시 requireAuth_ 스텁 작성(Task 3에서 실제 구현으로 교체)**

`apps-script/Auth.js`:
```js
function requireAuth_(idToken) {
  return { ok: true, email: 'temp@example.com' };
}
```

- [ ] **Step 6: .clasp.json 예시 + gitignore**

`apps-script/.clasp.json.example`:
```json
{
  "scriptId": "여기에_Task0_Step6의_스크립트ID_입력",
  "rootDir": "."
}
```

`apps-script/.gitignore`:
```
.clasp.json
.clasprc.json
```

(`.clasp.json`은 스크립트ID를 담지만 이 프로젝트에선 공개저장소 노출 문제보다 "각자 로컬 설정"
성격이라 gitignore 처리 — 실제 값은 `.clasp.json.example`을 복사해서 로컬에 채운다.)

- [ ] **Step 7: 로컬 .clasp.json 생성 후 push**

```bash
cd ~/websites/dodam-mindcare/apps-script
cp .clasp.json.example .clasp.json
# .clasp.json의 scriptId를 Task 0 Step 6 값으로 수정
clasp push
```

- [ ] **Step 8: Web App으로 배포**

```bash
clasp deploy --description "v1"
```
출력된 배포 URL(`https://script.google.com/macros/s/.../exec`)을 기록해둔다.

- [ ] **Step 9: ping 액션으로 배포 확인**

```bash
curl -X POST "<위에서 기록한 Web App URL>" -d '{"action":"ping"}'
```
Expected: `{"ok":true,"data":{"pong":true}}`

- [ ] **Step 10: 프론트엔드 스켈레톤 + config**

`staff/js/config.js`:
```js
window.DODAM_STAFF_CONFIG = {
  googleClientId: '여기에_Task0_Step5_OAUTH_CLIENT_ID',
  apiUrl: '여기에_Step8_Web_App_URL'
};
```

`staff/index.html`:
```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>도담마인드케어 스태프</title>
  <script src="https://accounts.google.com/gsi/client" async defer></script>
  <script src="js/config.js"></script>
</head>
<body>
  <h1>도담마인드케어 스태프 페이지</h1>
  <div id="app">불러오는 중...</div>
</body>
</html>
```

- [ ] **Step 11: 커밋**

```bash
cd ~/websites/dodam-mindcare
git add apps-script/appsscript.json apps-script/Code.js apps-script/Auth.js \
  apps-script/.clasp.json.example apps-script/.gitignore staff/index.html staff/js/config.js
git commit -m "feat: Apps Script 백엔드 스켈레톤 + 프론트엔드 뼈대"
```

---

## Task 2: Sheets 헬퍼 레이어

**Files:**
- Create: `apps-script/Sheets.js`
- Create: `apps-script/SelfTest.js`

**Interfaces:**
- Consumes: Script Property `SPREADSHEET_ID`(Task 0)
- Produces: `getSheet_(tabName)`, `readRows_(tabName)`, `appendRow_(tabName, rowObj)`,
  `updateRow_(tabName, id, patch)`, `deleteRow_(tabName, id)`, `findRow_(tabName, id)` — 이후 모든 기능
  Task가 이 함수들로만 시트를 읽고 쓴다.

- [ ] **Step 1: Sheets.js 작성**

`apps-script/Sheets.js`:
```js
function getSpreadsheet_() {
  var id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!id) throw new Error('SPREADSHEET_ID가 Script Properties에 설정되어 있지 않습니다');
  return SpreadsheetApp.openById(id);
}

function getSheet_(tabName) {
  var sheet = getSpreadsheet_().getSheetByName(tabName);
  if (!sheet) throw new Error('시트 탭을 찾을 수 없습니다: ' + tabName);
  return sheet;
}

function readRows_(tabName) {
  var sheet = getSheet_(tabName);
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  var headers = values[0];
  return values.slice(1)
    .filter(function (row) { return row.some(function (c) { return c !== '' && c !== null; }); })
    .map(function (row) {
      var obj = {};
      headers.forEach(function (h, i) { obj[h] = row[i]; });
      return obj;
    });
}

function appendRow_(tabName, rowObj) {
  var sheet = getSheet_(tabName);
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  if (headers.indexOf('id') !== -1 && !rowObj.id) rowObj.id = Utilities.getUuid();
  var row = headers.map(function (h) { return rowObj[h] !== undefined ? rowObj[h] : ''; });
  sheet.appendRow(row);
  return rowObj;
}

function updateRow_(tabName, id, patch) {
  var sheet = getSheet_(tabName);
  var values = sheet.getDataRange().getValues();
  var headers = values[0];
  var idCol = headers.indexOf('id');
  if (idCol === -1) throw new Error(tabName + ' 탭에 id 컬럼이 없습니다');
  for (var r = 1; r < values.length; r++) {
    if (String(values[r][idCol]) === String(id)) {
      headers.forEach(function (h, c) {
        if (patch[h] !== undefined) sheet.getRange(r + 1, c + 1).setValue(patch[h]);
      });
      var updated = {};
      headers.forEach(function (h, c) { updated[h] = patch[h] !== undefined ? patch[h] : values[r][c]; });
      return updated;
    }
  }
  throw new Error(tabName + ' 탭에서 id=' + id + ' 행을 찾을 수 없습니다');
}

function deleteRow_(tabName, id) {
  var sheet = getSheet_(tabName);
  var values = sheet.getDataRange().getValues();
  var headers = values[0];
  var idCol = headers.indexOf('id');
  for (var r = 1; r < values.length; r++) {
    if (String(values[r][idCol]) === String(id)) {
      sheet.deleteRow(r + 1);
      return true;
    }
  }
  return false;
}

function findRow_(tabName, id) {
  var rows = readRows_(tabName);
  var found = rows.filter(function (r) { return String(r.id) === String(id); });
  return found.length ? found[0] : null;
}
```

- [ ] **Step 2: self-test 작성**

`apps-script/SelfTest.js`:
```js
function selfTest_Sheets_() {
  var created = appendRow_('Clients', { 이름: '__SELFTEST__', 연락처: '000', 나이대: '성인', 바우처여부: false });
  if (!created.id) throw new Error('appendRow_ 가 id를 생성하지 않음');
  var found = findRow_('Clients', created.id);
  if (!found || found['이름'] !== '__SELFTEST__') throw new Error('findRow_ 실패');
  updateRow_('Clients', created.id, { 나이대: '아동청소년' });
  var updated = findRow_('Clients', created.id);
  if (updated['나이대'] !== '아동청소년') throw new Error('updateRow_ 실패');
  var deleted = deleteRow_('Clients', created.id);
  if (!deleted) throw new Error('deleteRow_ 실패');
  if (findRow_('Clients', created.id)) throw new Error('삭제 후에도 조회됨');
  Logger.log('selfTest_Sheets_ PASS');
}

function runAllSelfTests() {
  var tests = ['selfTest_Sheets_'];
  var failed = [];
  tests.forEach(function (name) {
    try {
      this[name]();
    } catch (err) {
      failed.push(name + ': ' + err.message);
    }
  }.bind(this));
  if (failed.length) {
    Logger.log('FAILED:\n' + failed.join('\n'));
    throw new Error(failed.length + '개 self-test 실패');
  }
  Logger.log('모든 self-test 통과 (' + tests.length + '개)');
}
```

- [ ] **Step 3: push 후 Apps Script 편집기에서 runAllSelfTests 실행**

```bash
cd ~/websites/dodam-mindcare/apps-script && clasp push
```
Apps Script 편집기(script.google.com)에서 함수 선택 드롭다운 → `runAllSelfTests` 선택 → 실행.
Expected: 로그에 "모든 self-test 통과 (1개)" 출력, Clients 탭에 `__SELFTEST__` 잔여 행 없음(직접 확인).

- [ ] **Step 4: 커밋**

```bash
cd ~/websites/dodam-mindcare
git add apps-script/Sheets.js apps-script/SelfTest.js
git commit -m "feat: Sheets CRUD 헬퍼 + self-test"
```

---

## Task 3: 인증 (Google ID 토큰 검증 + 화이트리스트)

**Files:**
- Modify: `apps-script/Auth.js`
- Modify: `apps-script/SelfTest.js`

**Interfaces:**
- Consumes: `readRows_('AllowedUsers')`(Task 2), Script Property `OAUTH_CLIENT_ID`(Task 0)
- Produces: `requireAuth_(idToken)` → `{ ok: boolean, email?: string, error?: string }` — Code.js의
  `handleRequest_`가 이미 이 시그니처로 호출 중(Task 1에서 스텁으로 연결됨).

- [ ] **Step 1: Auth.js 실제 구현으로 교체**

`apps-script/Auth.js`:
```js
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
```

- [ ] **Step 2: self-test 추가 (화이트리스트 판정만 — 실제 구글 토큰은 브라우저 로그인으로만 발급되므로
  verifyIdToken_ 자체는 Task 6 수동 브라우저 테스트에서 검증)**

`apps-script/SelfTest.js`에 추가:
```js
function selfTest_Auth_() {
  var allowed = readRows_('AllowedUsers');
  if (!allowed.length) throw new Error('AllowedUsers 탭이 비어있음 — Task 0 Step 3 확인 필요');
  var knownEmail = allowed[0]['이메일'];
  if (!isWhitelisted_(knownEmail)) throw new Error('등록된 이메일인데 화이트리스트 통과 실패');
  if (isWhitelisted_('__not_allowed__@example.com')) throw new Error('미등록 이메일이 통과됨');
  Logger.log('selfTest_Auth_ PASS');
}
```
`runAllSelfTests`의 `tests` 배열에 `'selfTest_Auth_'` 추가.

- [ ] **Step 3: push 후 재실행**

```bash
cd ~/websites/dodam-mindcare/apps-script && clasp push
```
Apps Script 편집기에서 `runAllSelfTests` 실행. Expected: "모든 self-test 통과 (2개)".

- [ ] **Step 4: 커밋**

```bash
cd ~/websites/dodam-mindcare
git add apps-script/Auth.js apps-script/SelfTest.js
git commit -m "feat: Google ID 토큰 검증 + 이메일 화이트리스트 인증"
```

---

## Task 4: Calendar 헬퍼 (방 충돌 검사)

**Files:**
- Create: `apps-script/Calendar.js`
- Modify: `apps-script/SelfTest.js`

**Interfaces:**
- Consumes: Advanced Calendar Service `Calendar`(Task 0 Step 6에서 활성화), Script Property `TEST_CALENDAR_ID`
- Produces: `checkConflict_(calendarId, startIso, endIso, excludeEventId)`, `createCalendarEvent_(calendarId,
  summary, startIso, endIso, recurrenceRule)`, `updateCalendarEvent_(calendarId, eventId, patch)`,
  `deleteCalendarEvent_(calendarId, eventId)`, `eventExists_(calendarId, eventId)`

- [ ] **Step 1: Calendar.js 작성**

`apps-script/Calendar.js`:
```js
function checkConflict_(calendarId, startIso, endIso, excludeEventId) {
  var events = Calendar.Events.list(calendarId, {
    timeMin: startIso,
    timeMax: endIso,
    singleEvents: true,
    showDeleted: false
  });
  var items = events.items || [];
  return items.some(function (ev) {
    return ev.id !== excludeEventId && ev.status !== 'cancelled';
  });
}

function createCalendarEvent_(calendarId, summary, startIso, endIso, recurrenceRule) {
  var event = {
    summary: summary,
    start: { dateTime: startIso, timeZone: 'Asia/Seoul' },
    end: { dateTime: endIso, timeZone: 'Asia/Seoul' }
  };
  if (recurrenceRule) event.recurrence = [recurrenceRule];
  var created = Calendar.Events.insert(event, calendarId);
  return created.id;
}

function updateCalendarEvent_(calendarId, eventId, patch) {
  return Calendar.Events.patch(patch, calendarId, eventId);
}

function deleteCalendarEvent_(calendarId, eventId) {
  Calendar.Events.remove(calendarId, eventId);
}

function eventExists_(calendarId, eventId) {
  try {
    var ev = Calendar.Events.get(calendarId, eventId);
    return ev.status !== 'cancelled';
  } catch (err) {
    return false;
  }
}

function resolveEventInstanceId_(calendarId, masterEventId, dateStr) {
  var master = Calendar.Events.get(calendarId, masterEventId);
  if (!master.recurrence) return masterEventId;
  var instances = Calendar.Events.instances(calendarId, masterEventId, {
    timeMin: dateStr + 'T00:00:00+09:00',
    timeMax: dateStr + 'T23:59:59+09:00'
  });
  if (!instances.items || !instances.items.length) {
    throw new Error('해당 날짜의 반복 일정 회차를 찾을 수 없습니다: ' + dateStr);
  }
  return instances.items[0].id;
}
```

- [ ] **Step 2: self-test 추가**

`apps-script/SelfTest.js`에 추가:
```js
function selfTest_Calendar_() {
  var calId = PropertiesService.getScriptProperties().getProperty('TEST_CALENDAR_ID');
  if (!calId) throw new Error('TEST_CALENDAR_ID가 설정되어 있지 않습니다');
  var start = '2099-01-05T10:00:00+09:00';
  var end = '2099-01-05T10:50:00+09:00';
  var eventId = createCalendarEvent_(calId, '__SELFTEST__', start, end, null);
  if (!eventExists_(calId, eventId)) throw new Error('생성된 이벤트가 조회되지 않음');
  if (!checkConflict_(calId, start, end, null)) throw new Error('겹치는 이벤트인데 충돌로 감지되지 않음');
  if (checkConflict_(calId, start, end, eventId)) throw new Error('자기 자신 제외가 안 됨');
  deleteCalendarEvent_(calId, eventId);
  if (eventExists_(calId, eventId)) throw new Error('삭제 후에도 이벤트가 존재함');
  Logger.log('selfTest_Calendar_ PASS');
}
```
`runAllSelfTests`의 `tests` 배열에 `'selfTest_Calendar_'` 추가.

- [ ] **Step 3: push 후 재실행, 2099년 1월 5일 해당 캘린더에 잔여 이벤트 없는지 직접 확인**

```bash
cd ~/websites/dodam-mindcare/apps-script && clasp push
```

- [ ] **Step 4: 커밋**

```bash
cd ~/websites/dodam-mindcare
git add apps-script/Calendar.js apps-script/SelfTest.js
git commit -m "feat: 구글 캘린더 방 충돌검사 + 이벤트 CRUD 헬퍼"
```

---

## Task 5: 예약(Sessions) API — 생성/수정/취소/조회

**Files:**
- Create: `apps-script/Sessions.js`
- Modify: `apps-script/Code.js` (dispatch_ 라우트 추가)
- Modify: `apps-script/SelfTest.js`

**Interfaces:**
- Consumes: `findRow_`, `appendRow_`, `updateRow_`, `readRows_`(Task 2), `checkConflict_`,
  `createCalendarEvent_`, `updateCalendarEvent_`, `deleteCalendarEvent_`, `resolveEventInstanceId_`(Task 4)
- Produces: `createSession_(body, email)`, `updateSession_(body, email)`, `cancelSession_(sessionId, email)`,
  `listSessionsInRange_(startDate, endDate)`

- [ ] **Step 1: Sessions.js 작성**

`apps-script/Sessions.js`:
```js
function createSession_(body, email) {
  var room = findRow_('Rooms', body.roomId);
  if (!room) throw new Error('방을 찾을 수 없습니다: ' + body.roomId);
  var startIso = body.date + 'T' + body.startTime + ':00+09:00';
  var endIso = body.date + 'T' + body.endTime + ':00+09:00';

  if (checkConflict_(room['구글캘린더ID'], startIso, endIso, null)) {
    throw new Error('이미 예약된 시간입니다: ' + room['이름'] + ' ' + body.date + ' ' + body.startTime);
  }

  var recurrenceRule = null;
  if (body.recurrence === 'WEEKLY') recurrenceRule = 'RRULE:FREQ=WEEKLY';
  if (body.recurrence === 'BIWEEKLY') recurrenceRule = 'RRULE:FREQ=WEEKLY;INTERVAL=2';

  var title = (body.counselorName || '') + ' - ' + (body.targetName || '') + ' (' + body.sessionType + ')';
  var eventId = createCalendarEvent_(room['구글캘린더ID'], title, startIso, endIso, recurrenceRule);

  return appendRow_('Sessions', {
    캘린더이벤트ID: eventId, 날짜: body.date, 시작시간: body.startTime, 종료시간: body.endTime,
    상담사: body.counselorId, 방: body.roomId, 유형: body.sessionType, 대상: body.targetId,
    반복여부: body.recurrence || '없음', 상태: '예정', 등록자: email
  });
}

function updateSession_(body, email) {
  var session = findRow_('Sessions', body.sessionId);
  if (!session) throw new Error('예약을 찾을 수 없습니다: ' + body.sessionId);
  var room = findRow_('Rooms', session['방']);
  var newStartIso = body.date + 'T' + body.startTime + ':00+09:00';
  var newEndIso = body.date + 'T' + body.endTime + ':00+09:00';
  var targetEventId = resolveEventInstanceId_(room['구글캘린더ID'], session['캘린더이벤트ID'], session['날짜']);

  if (checkConflict_(room['구글캘린더ID'], newStartIso, newEndIso, targetEventId)) {
    throw new Error('이미 예약된 시간입니다.');
  }

  updateCalendarEvent_(room['구글캘린더ID'], targetEventId, {
    start: { dateTime: newStartIso, timeZone: 'Asia/Seoul' },
    end: { dateTime: newEndIso, timeZone: 'Asia/Seoul' }
  });

  return updateRow_('Sessions', body.sessionId, { 날짜: body.date, 시작시간: body.startTime, 종료시간: body.endTime });
}

function cancelSession_(sessionId, email) {
  var session = findRow_('Sessions', sessionId);
  if (!session) throw new Error('예약을 찾을 수 없습니다: ' + sessionId);
  var room = findRow_('Rooms', session['방']);
  var targetEventId = resolveEventInstanceId_(room['구글캘린더ID'], session['캘린더이벤트ID'], session['날짜']);
  deleteCalendarEvent_(room['구글캘린더ID'], targetEventId);
  return updateRow_('Sessions', sessionId, { 상태: '취소' });
}

function listSessionsInRange_(startDate, endDate) {
  var sessions = readRows_('Sessions').filter(function (s) {
    return s['날짜'] >= startDate && s['날짜'] <= endDate && s['상태'] !== '취소';
  });
  var rooms = readRows_('Rooms');
  var counselors = readRows_('Counselors');
  return sessions.map(function (s) {
    var room = rooms.filter(function (r) { return String(r.id) === String(s['방']); })[0];
    var counselor = counselors.filter(function (c) { return String(c.id) === String(s['상담사']); })[0];
    return Object.assign({}, s, {
      방이름: room ? room['이름'] : '',
      상담사이름: counselor ? counselor['이름'] : ''
    });
  });
}
```

**참고 (Phase 1 범위 명시)**: `cancelSession_`은 반복 예약의 "해당 회차 하나만" 취소한다. 반복
시리즈 전체를 한 번에 취소하는 기능은 요구되지 않아 Phase 1에 포함하지 않는다(필요해지면 별도 액션으로 추가).

- [ ] **Step 2: Code.js dispatch_ 에 라우트 추가**

`apps-script/Code.js`의 `dispatch_` 함수 내부 `switch`에 추가:
```js
    case 'listRooms': return readRows_('Rooms');
    case 'listCounselors': return readRows_('Counselors');
    case 'listSessions': return listSessionsInRange_(body.startDate, body.endDate);
    case 'createSession': return createSession_(body, email);
    case 'updateSession': return updateSession_(body, email);
    case 'cancelSession': return cancelSession_(body.sessionId, email);
```

- [ ] **Step 3: self-test 추가**

`apps-script/SelfTest.js`에 추가:
```js
function selfTest_Sessions_() {
  var room = readRows_('Rooms')[0];
  if (!room) throw new Error('Rooms 탭에 테스트용 방이 없습니다');
  var counselor = readRows_('Counselors')[0];
  if (!counselor) throw new Error('Counselors 탭이 비어있습니다');
  var client = appendRow_('Clients', { 이름: '__SELFTEST__', 연락처: '000', 나이대: '성인', 바우처여부: false });

  var created = createSession_({
    roomId: room.id, counselorId: counselor.id, counselorName: counselor['이름'],
    targetId: client.id, targetName: client['이름'], sessionType: '일반상담',
    date: '2099-02-10', startTime: '10:00', endTime: '10:50', recurrence: null
  }, 'selftest@example.com');

  var conflictThrown = false;
  try {
    createSession_({
      roomId: room.id, counselorId: counselor.id, counselorName: counselor['이름'],
      targetId: client.id, targetName: client['이름'], sessionType: '일반상담',
      date: '2099-02-10', startTime: '10:30', endTime: '11:00', recurrence: null
    }, 'selftest@example.com');
  } catch (err) { conflictThrown = true; }
  if (!conflictThrown) throw new Error('겹치는 예약인데 충돌 에러가 안 남');

  cancelSession_(created.id, 'selftest@example.com');
  var cancelled = findRow_('Sessions', created.id);
  if (cancelled['상태'] !== '취소') throw new Error('취소 상태 반영 안 됨');

  deleteRow_('Sessions', created.id);
  deleteRow_('Clients', client.id);
  Logger.log('selfTest_Sessions_ PASS');
}
```
`runAllSelfTests`의 `tests` 배열에 `'selfTest_Sessions_'` 추가.

- [ ] **Step 4: push 후 재실행 (2099-02-10 해당 방 캘린더에 잔여 이벤트 없는지 직접 확인)**

```bash
cd ~/websites/dodam-mindcare/apps-script && clasp push
```

- [ ] **Step 5: 커밋**

```bash
cd ~/websites/dodam-mindcare
git add apps-script/Sessions.js apps-script/Code.js apps-script/SelfTest.js
git commit -m "feat: 예약 생성/수정/취소/조회 API + 방 충돌 검사 연동"
```

---

## Task 6: 프론트엔드 — 로그인 + 주간 일정 화면

**Files:**
- Modify: `staff/index.html`
- Create: `staff/js/auth.js`
- Create: `staff/js/api.js`
- Create: `staff/js/schedule.js`
- Create: `staff/css/staff.css`

**Interfaces:**
- Consumes: `window.DODAM_STAFF_CONFIG`(Task 1), 백엔드 액션 `ping`/`listRooms`/`listCounselors`/`listSessions`(Task 1, 5)
- Produces: `initGoogleLogin(onSuccess)`, `getIdToken()`, `callApi(action, payload)`, `renderWeeklySchedule(startDate)`

- [ ] **Step 1: auth.js 작성**

`staff/js/auth.js`:
```js
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
```

- [ ] **Step 2: api.js 작성**

`staff/js/api.js`:
```js
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
```

- [ ] **Step 3: schedule.js 작성 (방별 × 시간대 주간 그리드)**

`staff/js/schedule.js`:
```js
function mondayOf(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function isoDate(d) {
  return d.toISOString().slice(0, 10);
}

async function renderWeeklySchedule(anchorDate) {
  const monday = mondayOf(anchorDate);
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);

  const [rooms, sessions] = await Promise.all([
    callApi('listRooms'),
    callApi('listSessions', { startDate: isoDate(monday), endDate: isoDate(sunday) })
  ]);

  const container = document.getElementById('schedule-grid');
  container.innerHTML = '';

  rooms.forEach(function (room) {
    const roomSessions = sessions.filter(function (s) { return String(s['방']) === String(room.id); });
    const block = document.createElement('div');
    block.className = 'room-block';
    block.innerHTML = '<h3>' + room['이름'] + '</h3>';
    const list = document.createElement('ul');
    roomSessions
      .sort(function (a, b) { return (a['날짜'] + a['시작시간']).localeCompare(b['날짜'] + b['시작시간']); })
      .forEach(function (s) {
        const li = document.createElement('li');
        li.textContent = s['날짜'] + ' ' + s['시작시간'] + '~' + s['종료시간'] + ' ' + s['상담사이름'];
        li.dataset.sessionId = s.id;
        list.appendChild(li);
      });
    block.appendChild(list);
    container.appendChild(block);
  });
}
```

- [ ] **Step 4: index.html을 앱 셸로 확장**

`staff/index.html`:
```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>도담마인드케어 스태프</title>
  <link rel="stylesheet" href="css/staff.css">
  <script src="https://accounts.google.com/gsi/client" async defer></script>
</head>
<body>
  <div id="login-screen">
    <h1>도담마인드케어 스태프 로그인</h1>
    <div id="google-signin-button"></div>
    <p id="login-error" class="error"></p>
  </div>

  <div id="app-shell" hidden>
    <nav>
      <button data-view="schedule">일정</button>
    </nav>
    <main>
      <section id="view-schedule">
        <div id="schedule-grid"></div>
      </section>
    </main>
  </div>

  <script src="js/config.js"></script>
  <script src="js/auth.js"></script>
  <script src="js/api.js"></script>
  <script src="js/schedule.js"></script>
  <script>
    initGoogleLogin(async function () {
      try {
        await callApi('ping');
      } catch (err) {
        document.getElementById('login-error').textContent = err.message;
        return;
      }
      document.getElementById('login-screen').hidden = true;
      document.getElementById('app-shell').hidden = false;
      renderWeeklySchedule(new Date());
    });
  </script>
</body>
</html>
```

- [ ] **Step 5: 최소 스타일**

`staff/css/staff.css`:
```css
body { font-family: sans-serif; margin: 0; padding: 1rem; }
#app-shell[hidden], #login-screen[hidden] { display: none; }
.room-block { border: 1px solid #ddd; border-radius: 8px; padding: 0.75rem; margin-bottom: 0.75rem; }
.room-block ul { list-style: none; padding: 0; margin: 0; }
.room-block li { padding: 0.25rem 0; border-bottom: 1px solid #f0f0f0; }
.error { color: #c0392b; }
```

- [ ] **Step 6: 로컬에서 정적 서버로 브라우저 확인**

```bash
cd ~/websites/dodam-mindcare && python3 -m http.server 8000
```
브라우저에서 `http://localhost:8000/staff/` 접속. Expected: 구글 로그인 버튼이 뜨고, AllowedUsers에
등록된 계정으로 로그인하면 방 6개가 표시된 주간 일정 화면으로 전환됨(빈 목록이어도 정상 — 아직 예약
없음). 등록 안 된 계정으로 로그인 시 "계정은 접근 권한이 없습니다" 에러가 뜨는지도 확인.

- [ ] **Step 7: 커밋**

```bash
cd ~/websites/dodam-mindcare
git add staff/index.html staff/js/auth.js staff/js/api.js staff/js/schedule.js staff/css/staff.css
git commit -m "feat: 스태프 페이지 로그인 + 방별 주간 일정 화면"
```

---

## Task 7: 예약 생성/수정/취소 UI

**Files:**
- Create: `staff/js/booking.js`
- Modify: `staff/index.html`
- Modify: `staff/js/schedule.js`

**Interfaces:**
- Consumes: `callApi`(Task 6), 백엔드 액션 `createSession`/`updateSession`/`cancelSession`(Task 5)
- Produces: `openBookingForm(existingSession?)`, `submitBooking(formData)`

- [ ] **Step 1: booking.js 작성**

`staff/js/booking.js`:
```js
async function submitBooking(formData, existingSessionId) {
  const errorEl = document.getElementById('booking-error');
  errorEl.textContent = '';
  try {
    if (existingSessionId) {
      await callApi('updateSession', Object.assign({ sessionId: existingSessionId }, formData));
    } else {
      await callApi('createSession', formData);
    }
    document.getElementById('booking-dialog').close();
    renderWeeklySchedule(new Date());
  } catch (err) {
    errorEl.textContent = err.message;
  }
}

async function cancelBooking(sessionId) {
  if (!confirm('이 예약을 취소하시겠습니까?')) return;
  await callApi('cancelSession', { sessionId: sessionId });
  renderWeeklySchedule(new Date());
}

async function populateBookingSelects() {
  const [rooms, counselors] = await Promise.all([callApi('listRooms'), callApi('listCounselors')]);
  const roomSelect = document.getElementById('booking-room');
  const counselorSelect = document.getElementById('booking-counselor');
  roomSelect.innerHTML = rooms.map(function (r) { return '<option value="' + r.id + '">' + r['이름'] + '</option>'; }).join('');
  counselorSelect.innerHTML = counselors.map(function (c) { return '<option value="' + c.id + '">' + c['이름'] + '</option>'; }).join('');
}
```

- [ ] **Step 2: index.html에 예약 폼(dialog)과 "새 예약" 버튼 추가**

`staff/index.html`의 `<section id="view-schedule">` 안에 추가:
```html
<button id="new-booking-btn">새 예약</button>
<dialog id="booking-dialog">
  <form id="booking-form" method="dialog">
    <label>방 <select id="booking-room"></select></label>
    <label>상담사 <select id="booking-counselor"></select></label>
    <label>날짜 <input type="date" id="booking-date"></label>
    <label>시작시간 <input type="time" id="booking-start"></label>
    <label>종료시간 <input type="time" id="booking-end"></label>
    <label>유형
      <select id="booking-type">
        <option>초기상담</option><option>일반상담</option><option>부모상담</option>
        <option>모래놀이</option><option>놀이치료</option><option>사회성그룹</option><option>독서그룹</option>
      </select>
    </label>
    <label>내담자/그룹 이름 <input type="text" id="booking-target-name"></label>
    <label>반복
      <select id="booking-recurrence">
        <option value="">없음</option><option value="WEEKLY">매주</option><option value="BIWEEKLY">격주</option>
      </select>
    </label>
    <p id="booking-error" class="error"></p>
    <button type="submit">저장</button>
    <button type="button" onclick="document.getElementById('booking-dialog').close()">취소</button>
  </form>
</dialog>
```

- [ ] **Step 3: schedule.js에 새 예약 버튼·목록 클릭 이벤트 연결**

`staff/js/schedule.js` 끝에 추가:
```js
document.getElementById('new-booking-btn').addEventListener('click', async function () {
  await populateBookingSelects();
  document.getElementById('booking-form').onsubmit = function () {
    submitBooking({
      roomId: document.getElementById('booking-room').value,
      counselorId: document.getElementById('booking-counselor').value,
      counselorName: document.getElementById('booking-counselor').selectedOptions[0].textContent,
      targetId: '', targetName: document.getElementById('booking-target-name').value,
      sessionType: document.getElementById('booking-type').value,
      date: document.getElementById('booking-date').value,
      startTime: document.getElementById('booking-start').value,
      endTime: document.getElementById('booking-end').value,
      recurrence: document.getElementById('booking-recurrence').value || null
    });
  };
  document.getElementById('booking-dialog').showModal();
});
```

- [ ] **Step 4: 브라우저 시나리오 확인**

`python3 -m http.server 8000` 후 `/staff/`에서:
1. "새 예약" → 임의 방/시간으로 저장 → 주간 일정에 표시되는지 확인
2. 같은 방·같은 시간으로 다시 저장 시도 → "이미 예약된 시간입니다" 에러가 뜨는지 확인
3. 저장한 예약을 다른 시간으로 수정 → 반영되는지 확인
4. 예약 취소 → 목록에서 사라지는지 확인

- [ ] **Step 5: 커밋**

```bash
cd ~/websites/dodam-mindcare
git add staff/js/booking.js staff/index.html staff/js/schedule.js
git commit -m "feat: 예약 생성/수정/취소 UI"
```

---

## Task 8: 내담자 관리 + 메모 이력 (Clients / ClientNotes)

**Files:**
- Create: `apps-script/Clients.js`
- Create: `staff/js/clients.js`
- Modify: `apps-script/Code.js`
- Modify: `apps-script/SelfTest.js`
- Modify: `staff/index.html`

**Interfaces:**
- Produces (backend): `createClient_(body)`, `listClients_()`, `addClientNote_(body, email)`,
  `listClientNotes_(clientId)`
- Produces (frontend): `renderClientList()`, `openClientDetail(clientId)`

- [ ] **Step 1: Clients.js 작성**

`apps-script/Clients.js`:
```js
function createClient_(body) {
  return appendRow_('Clients', {
    이름: body.name, 연락처: body.phone || '', 나이대: body.ageGroup, 바우처여부: !!body.isVoucher
  });
}

function listClients_() {
  return readRows_('Clients');
}

function addClientNote_(body, email) {
  if (!body.content) throw new Error('메모 내용이 없습니다');
  return appendRow_('ClientNotes', {
    내담자ID: body.clientId, 날짜: Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd'),
    작성자: email, 내용: body.content
  });
}

function listClientNotes_(clientId) {
  return readRows_('ClientNotes')
    .filter(function (n) { return String(n['내담자ID']) === String(clientId); })
    .sort(function (a, b) { return a['날짜'] < b['날짜'] ? 1 : -1; });
}
```

- [ ] **Step 2: Code.js dispatch_ 에 라우트 추가**

```js
    case 'listClients': return listClients_();
    case 'createClient': return createClient_(body);
    case 'addClientNote': return addClientNote_(body, email);
    case 'listClientNotes': return listClientNotes_(body.clientId);
```

- [ ] **Step 3: self-test 추가**

`apps-script/SelfTest.js`에 추가:
```js
function selfTest_ClientNotes_() {
  var client = createClient_({ name: '__SELFTEST__', phone: '000', ageGroup: '성인', isVoucher: false });
  addClientNote_({ clientId: client.id, content: '첫 메모' }, 'a@example.com');
  addClientNote_({ clientId: client.id, content: '둘째 메모' }, 'b@example.com');
  var notes = listClientNotes_(client.id);
  if (notes.length !== 2) throw new Error('메모 2건이 누적되지 않음(개수=' + notes.length + ')');
  if (notes[0]['내용'] !== '둘째 메모') throw new Error('최신순 정렬 안 됨');
  notes.forEach(function (n) { deleteRow_('ClientNotes', n.id); });
  deleteRow_('Clients', client.id);
  Logger.log('selfTest_ClientNotes_ PASS');
}
```
`runAllSelfTests`의 `tests` 배열에 `'selfTest_ClientNotes_'` 추가.

- [ ] **Step 4: clients.js 프론트엔드 작성**

`staff/js/clients.js`:
```js
async function renderClientList() {
  const clients = await callApi('listClients');
  const container = document.getElementById('client-list');
  container.innerHTML = '';
  clients.forEach(function (c) {
    const li = document.createElement('li');
    li.textContent = c['이름'] + (c['바우처여부'] ? ' (바우처)' : '');
    li.addEventListener('click', function () { openClientDetail(c.id, c['이름']); });
    container.appendChild(li);
  });
}

async function openClientDetail(clientId, name) {
  const notes = await callApi('listClientNotes', { clientId: clientId });
  document.getElementById('client-detail-name').textContent = name;
  const list = document.getElementById('client-notes-list');
  list.innerHTML = notes.map(function (n) {
    return '<li>[' + n['날짜'] + ' ' + n['작성자'] + '] ' + n['내용'] + '</li>';
  }).join('');
  document.getElementById('client-note-form').dataset.clientId = clientId;
  document.getElementById('client-detail-dialog').showModal();
}

document.getElementById('client-note-form').addEventListener('submit', async function (e) {
  const clientId = e.target.dataset.clientId;
  const content = document.getElementById('client-note-input').value;
  await callApi('addClientNote', { clientId: clientId, content: content });
  document.getElementById('client-note-input').value = '';
  openClientDetail(clientId, document.getElementById('client-detail-name').textContent);
});
```

- [ ] **Step 5: index.html에 내담자 뷰 추가**

`<nav>`에 `<button data-view="clients">내담자</button>` 추가. `<main>`에 추가:
```html
<section id="view-clients" hidden>
  <ul id="client-list"></ul>
</section>
<dialog id="client-detail-dialog">
  <h3 id="client-detail-name"></h3>
  <ul id="client-notes-list"></ul>
  <form id="client-note-form" method="dialog">
    <textarea id="client-note-input" required></textarea>
    <button type="submit">메모 추가</button>
  </form>
</dialog>
```
그리고 `<script src="js/clients.js"></script>` 를 body 끝 스크립트 목록에 추가.

- [ ] **Step 6: push + 브라우저 확인**

```bash
cd ~/websites/dodam-mindcare/apps-script && clasp push
```
Apps Script 편집기에서 `runAllSelfTests` 실행 → 통과 확인. 브라우저에서 내담자 탭 열어 메모 2개
추가 후 둘 다 날짜·작성자와 함께 누적되어 보이는지, 새로고침해도 유지되는지 확인.

- [ ] **Step 7: 커밋**

```bash
cd ~/websites/dodam-mindcare
git add apps-script/Clients.js apps-script/Code.js apps-script/SelfTest.js staff/js/clients.js staff/index.html
git commit -m "feat: 내담자 목록 + 누적 메모 이력"
```

---

## Task 9: 결제 기록 (개인/그룹·바우처·커버종료일)

**Files:**
- Create: `apps-script/Payments.js`
- Create: `staff/js/payments.js`
- Modify: `apps-script/Code.js`
- Modify: `apps-script/SelfTest.js`
- Modify: `staff/index.html`

**Interfaces:**
- Produces (backend): `recordPayment_(body, email)`, `listPayments_(clientId)`, `nextDueDate_(clientId)`

- [ ] **Step 1: Payments.js 작성**

`apps-script/Payments.js`:
```js
function recordPayment_(body, email) {
  var amount = Number(body.amount);
  if (!amount || amount <= 0) throw new Error('금액이 올바르지 않습니다');
  if (!body.coverageEndDate) throw new Error('커버종료일이 필요합니다');

  var payment = {
    날짜: body.date, 내담자ID: body.clientId, 커버종료일: body.coverageEndDate,
    커버설명: body.coverageNote || '', 금액: amount, 유형: body.paymentType,
    바우처여부: !!body.isVoucher, 결제수단: body.method, 메모: body.memo || '', 입력자: email
  };

  if (body.isVoucher) {
    var selfPay = Number(body.selfPayAmount || 0);
    var subsidy = Number(body.subsidyAmount || 0);
    if (selfPay + subsidy !== amount) {
      throw new Error('본인부담금(' + selfPay + ') + 지원금(' + subsidy + ') 합계가 금액(' + amount + ')과 일치하지 않습니다');
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
```

- [ ] **Step 2: Code.js dispatch_ 에 라우트 추가**

```js
    case 'recordPayment': return recordPayment_(body, email);
    case 'listPayments': return listPayments_(body.clientId);
    case 'nextDueDate': return { date: nextDueDate_(body.clientId) };
```

- [ ] **Step 3: self-test 추가**

`apps-script/SelfTest.js`에 추가:
```js
function selfTest_Payments_() {
  var client = createClient_({ name: '__SELFTEST__', phone: '000', ageGroup: '아동청소년', isVoucher: true });

  recordPayment_({
    clientId: client.id, date: '2099-01-01', coverageEndDate: '2099-01-31',
    amount: 100000, paymentType: '개인상담', isVoucher: true,
    selfPayAmount: 30000, subsidyAmount: 70000, method: '카드'
  }, 'selftest@example.com');

  var mismatchThrown = false;
  try {
    recordPayment_({
      clientId: client.id, date: '2099-02-01', coverageEndDate: '2099-02-15',
      amount: 100000, paymentType: '개인상담', isVoucher: true,
      selfPayAmount: 30000, subsidyAmount: 60000, method: '카드'
    }, 'selftest@example.com');
  } catch (err) { mismatchThrown = true; }
  if (!mismatchThrown) throw new Error('본인부담금+지원금 불일치인데 에러가 안 남');

  var due = nextDueDate_(client.id);
  if (due !== '2099-01-31') throw new Error('nextDueDate_ 계산 오류: ' + due);

  listPayments_(client.id).forEach(function (p) { deleteRow_('Payments', p.id); });
  deleteRow_('Clients', client.id);
  Logger.log('selfTest_Payments_ PASS');
}
```
`runAllSelfTests`의 `tests` 배열에 `'selfTest_Payments_'` 추가.

- [ ] **Step 4: payments.js 프론트엔드 작성**

`staff/js/payments.js`:
```js
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

document.getElementById('payment-form').addEventListener('submit', function () {
  submitPayment({
    clientId: document.getElementById('payment-client-id').value,
    date: document.getElementById('payment-date').value,
    coverageEndDate: document.getElementById('payment-coverage-end').value,
    coverageNote: document.getElementById('payment-coverage-note').value,
    amount: Number(document.getElementById('payment-amount').value),
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
```

- [ ] **Step 5: index.html에 결제 폼 추가 (내담자 상세 다이얼로그 안에 버튼으로 연결)**

`staff/index.html`의 `#client-detail-dialog` 안에 "결제 기록" 버튼과 `payment-dialog`를 추가:
```html
<button id="open-payment-btn" type="button">결제 기록</button>
<dialog id="payment-dialog">
  <form id="payment-form" method="dialog">
    <input type="hidden" id="payment-client-id">
    <label>날짜 <input type="date" id="payment-date" required></label>
    <label>커버종료일 <input type="date" id="payment-coverage-end" required></label>
    <label>커버설명(선택) <input type="text" id="payment-coverage-note"></label>
    <label>금액 <input type="number" id="payment-amount" required></label>
    <label>유형
      <select id="payment-type"><option>개인상담</option><option>그룹-사회성</option><option>그룹-독서</option></select>
    </label>
    <label><input type="checkbox" id="payment-is-voucher"> 바우처 상담</label>
    <div id="voucher-fields" hidden>
      <label>본인부담금 <input type="number" id="payment-selfpay"></label>
      <label>지원금 <input type="number" id="payment-subsidy"></label>
    </div>
    <label>결제수단
      <select id="payment-method"><option>계좌이체</option><option>현금</option><option>카드</option><option>기타</option></select>
    </label>
    <p id="payment-error" class="error"></p>
    <button type="submit">저장</button>
  </form>
</dialog>
```
`clients.js`의 `openClientDetail`에서 `document.getElementById('payment-client-id').value = clientId;`를
설정하고, `open-payment-btn` 클릭 시 `payment-dialog.showModal()`을 호출하도록 연결.

- [ ] **Step 6: push + 브라우저 확인**

```bash
cd ~/websites/dodam-mindcare/apps-script && clasp push
```
`runAllSelfTests` 통과 확인. 브라우저에서 바우처 내담자 결제 기록(본인부담금+지원금 합 = 금액과
다르게 입력) → 에러 확인. 합이 맞게 입력 → 저장되는지 확인.

- [ ] **Step 7: 커밋**

```bash
cd ~/websites/dodam-mindcare
git add apps-script/Payments.js apps-script/Code.js apps-script/SelfTest.js staff/js/payments.js staff/index.html
git commit -m "feat: 결제 기록(바우처 분할·커버종료일) API + UI"
```

---

## Task 10: 결제요청(PaymentRequests) — 링크결제 상태추적

**Files:**
- Create: `apps-script/PaymentRequests.js`
- Create: `staff/js/payment-requests.js`
- Modify: `apps-script/Code.js`
- Modify: `apps-script/SelfTest.js`
- Modify: `staff/index.html`

**Interfaces:**
- Consumes: `recordPayment_`(Task 9)
- Produces (backend): `createPaymentRequest_(body, email)`, `updatePaymentRequestStatus_(body, email)`,
  `listPaymentRequests_()`

- [ ] **Step 1: PaymentRequests.js 작성**

`apps-script/PaymentRequests.js`:
```js
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
      coverageNote: request['사유'], amount: request['금액'], paymentType: body.paymentType || '개인상담',
      isVoucher: false, method: '카드(페이히어 링크결제)'
    }, email);
    return updated;
  }

  throw new Error('알 수 없는 상태: ' + body.status);
}

function listPaymentRequests_() {
  return readRows_('PaymentRequests').filter(function (r) { return r['상태'] !== '완료'; });
}
```

- [ ] **Step 2: Code.js dispatch_ 에 라우트 추가**

```js
    case 'createPaymentRequest': return createPaymentRequest_(body, email);
    case 'updatePaymentRequestStatus': return updatePaymentRequestStatus_(body, email);
    case 'listPaymentRequests': return listPaymentRequests_();
```

- [ ] **Step 3: self-test 추가**

`apps-script/SelfTest.js`에 추가:
```js
function selfTest_PaymentRequests_() {
  var client = createClient_({ name: '__SELFTEST__', phone: '000', ageGroup: '아동청소년', isVoucher: false });
  var req = createPaymentRequest_({ clientId: client.id, amount: 50000, reason: '다음 회기분' }, 'a@example.com');
  if (req['상태'] !== '대기') throw new Error('초기 상태가 대기가 아님');

  updatePaymentRequestStatus_({ requestId: req.id, status: '링크발송함' }, 'a@example.com');
  var afterSend = findRow_('PaymentRequests', req.id);
  if (afterSend['상태'] !== '링크발송함' || !afterSend['링크발송일']) throw new Error('링크발송 상태 반영 안 됨');

  var beforeCount = listPayments_(client.id).length;
  updatePaymentRequestStatus_({ requestId: req.id, status: '완료', coverageEndDate: '2099-03-31' }, 'a@example.com');
  var afterDone = findRow_('PaymentRequests', req.id);
  if (afterDone['상태'] !== '완료') throw new Error('완료 상태 반영 안 됨');
  var afterCount = listPayments_(client.id).length;
  if (afterCount !== beforeCount + 1) throw new Error('완료 처리 시 Payments 기록이 생성되지 않음');

  listPayments_(client.id).forEach(function (p) { deleteRow_('Payments', p.id); });
  deleteRow_('PaymentRequests', req.id);
  deleteRow_('Clients', client.id);
  Logger.log('selfTest_PaymentRequests_ PASS');
}
```
`runAllSelfTests`의 `tests` 배열에 `'selfTest_PaymentRequests_'` 추가.

- [ ] **Step 4: payment-requests.js 프론트엔드 작성**

`staff/js/payment-requests.js`:
```js
async function renderPaymentRequests() {
  const requests = await callApi('listPaymentRequests');
  const container = document.getElementById('payment-request-list');
  container.innerHTML = requests.map(function (r) {
    return '<li data-id="' + r.id + '">' + r['내담자ID'] + ' / ' + r['금액'] + '원 / ' + r['상태'] +
      (r['상태'] === '대기' ? ' <button class="pr-send" data-id="' + r.id + '">링크발송함</button>' : '') +
      (r['상태'] === '링크발송함' ? ' <button class="pr-done" data-id="' + r.id + '">완료</button>' : '') +
      '</li>';
  }).join('');
}

document.getElementById('payment-request-list').addEventListener('click', async function (e) {
  if (e.target.classList.contains('pr-send')) {
    await callApi('updatePaymentRequestStatus', { requestId: e.target.dataset.id, status: '링크발송함' });
    renderPaymentRequests();
  }
  if (e.target.classList.contains('pr-done')) {
    const coverageEndDate = prompt('이 결제로 언제까지 보장되나요? (YYYY-MM-DD)');
    if (!coverageEndDate) return;
    await callApi('updatePaymentRequestStatus', { requestId: e.target.dataset.id, status: '완료', coverageEndDate: coverageEndDate });
    renderPaymentRequests();
  }
});

document.getElementById('new-payment-request-form').addEventListener('submit', async function (e) {
  await callApi('createPaymentRequest', {
    clientId: document.getElementById('pr-client-id').value,
    amount: Number(document.getElementById('pr-amount').value),
    reason: document.getElementById('pr-reason').value
  });
  renderPaymentRequests();
});
```

- [ ] **Step 5: index.html에 결제요청 뷰 추가**

`<nav>`에 `<button data-view="payment-requests">결제요청</button>` 추가. `<main>`에 추가:
```html
<section id="view-payment-requests" hidden>
  <form id="new-payment-request-form">
    <input type="text" id="pr-client-id" placeholder="내담자ID" required>
    <input type="number" id="pr-amount" placeholder="금액" required>
    <input type="text" id="pr-reason" placeholder="사유(예: 다음 회기분)">
    <button type="submit">결제요청 등록</button>
  </form>
  <ul id="payment-request-list"></ul>
</section>
```
`<script src="js/payment-requests.js"></script>` 추가.

- [ ] **Step 6: push + 브라우저 확인**

```bash
cd ~/websites/dodam-mindcare/apps-script && clasp push
```
`runAllSelfTests` 통과 확인. 브라우저에서 결제요청 등록 → "링크발송함" → "완료"(커버종료일 입력)
순서로 상태 전환되고, 완료 시 해당 내담자 결제기록에 자동으로 반영되는지 확인.

- [ ] **Step 7: 커밋**

```bash
cd ~/websites/dodam-mindcare
git add apps-script/PaymentRequests.js apps-script/Code.js apps-script/SelfTest.js staff/js/payment-requests.js staff/index.html
git commit -m "feat: 결제요청(페이히어 링크결제) 상태추적 — 대기/링크발송함/완료"
```

---

## Task 11: 정합성 점검 (캘린더-시트 불일치 탐지)

**Files:**
- Create: `apps-script/Reconcile.js`
- Create: `staff/js/reconcile.js`
- Modify: `apps-script/Code.js`
- Modify: `staff/index.html`

**Interfaces:**
- Consumes: `eventExists_`(Task 4), `readRows_`(Task 2)
- Produces: `reconcileCheck_()`

- [ ] **Step 1: Reconcile.js 작성**

`apps-script/Reconcile.js`:
```js
function reconcileCheck_() {
  var sessions = readRows_('Sessions').filter(function (s) { return s['상태'] === '예정'; });
  var rooms = readRows_('Rooms');
  var problems = [];
  sessions.forEach(function (s) {
    var room = rooms.filter(function (r) { return String(r.id) === String(s['방']); })[0];
    if (!room) { problems.push({ sessionId: s.id, issue: '방 정보 없음' }); return; }
    if (!eventExists_(room['구글캘린더ID'], s['캘린더이벤트ID'])) {
      problems.push({ sessionId: s.id, issue: '캘린더 이벤트 없음/삭제됨', 방: room['이름'], 날짜: s['날짜'] });
    }
  });
  return problems;
}
```

- [ ] **Step 2: Code.js dispatch_ 에 라우트 추가**

```js
    case 'reconcileCheck': return reconcileCheck_();
```

- [ ] **Step 3: 프론트엔드**

`staff/js/reconcile.js`:
```js
async function renderReconcileCheck() {
  const problems = await callApi('reconcileCheck');
  const container = document.getElementById('reconcile-list');
  container.innerHTML = problems.length
    ? problems.map(function (p) { return '<li>' + p.issue + ' — ' + (p['방'] || '') + ' ' + (p['날짜'] || '') + ' (예약ID: ' + p.sessionId + ')</li>'; }).join('')
    : '<li>불일치 없음</li>';
}
```

`staff/index.html`의 `<nav>`에 `<button data-view="reconcile">정합성점검</button>` 추가, `<main>`에:
```html
<section id="view-reconcile" hidden>
  <button id="run-reconcile-btn">지금 점검하기</button>
  <ul id="reconcile-list"></ul>
</section>
```
`<script src="js/reconcile.js"></script>` 추가, 버튼에 `renderReconcileCheck` 연결하는 리스너 한 줄 추가.

- [ ] **Step 4: push + 브라우저 확인 (임의로 Sessions 행의 캘린더이벤트ID를 잘못된 값으로 바꿔서
  "캘린더 이벤트 없음"이 뜨는지 확인 후 원복)**

```bash
cd ~/websites/dodam-mindcare/apps-script && clasp push
```

- [ ] **Step 5: 커밋**

```bash
cd ~/websites/dodam-mindcare
git add apps-script/Reconcile.js apps-script/Code.js staff/js/reconcile.js staff/index.html
git commit -m "feat: 캘린더-시트 정합성 점검 화면"
```

---

## Task 12: 뷰 전환 배선 + 배포 문서

**Files:**
- Modify: `staff/index.html` (또는 신규 `staff/js/router.js`)
- Create: `apps-script/README.md`
- Create: `staff/README.md`

**Interfaces:**
- Consumes: 모든 이전 Task의 render 함수들

- [ ] **Step 1: 간단한 뷰 전환 스크립트 작성**

`staff/js/router.js`:
```js
document.querySelectorAll('nav button[data-view]').forEach(function (btn) {
  btn.addEventListener('click', function () {
    document.querySelectorAll('main section').forEach(function (s) { s.hidden = true; });
    var view = document.getElementById('view-' + btn.dataset.view);
    view.hidden = false;
    if (btn.dataset.view === 'schedule') renderWeeklySchedule(new Date());
    if (btn.dataset.view === 'clients') renderClientList();
    if (btn.dataset.view === 'payment-requests') renderPaymentRequests();
    if (btn.dataset.view === 'reconcile') renderReconcileCheck();
  });
});
```
`staff/index.html`에 `<script src="js/router.js"></script>` 추가(다른 뷰 스크립트들 이후).

- [ ] **Step 2: apps-script/README.md 작성**

`apps-script/README.md`:
```markdown
# 도담CRM 백엔드 (Apps Script)

## 최초 설정
1. Task 0(스펙 문서 참조)의 Google 리소스 준비 완료
2. `cp .clasp.json.example .clasp.json` 후 scriptId 채우기
3. `clasp push`
4. Apps Script 편집기에서 `runAllSelfTests` 실행해 전부 통과하는지 확인
5. `clasp deploy --description "vN"` 으로 배포, Web App URL을 `staff/js/config.js`에 반영

## 코드 수정 후 배포
```bash
clasp push
clasp deploy --description "설명"
```
새 배포 URL이 기존과 다르면 `staff/js/config.js`도 갱신해야 한다(Web App URL이 배포마다 바뀔 수 있음
— "배포 관리"에서 기존 배포를 "편집"하면 URL을 유지한 채 업데이트 가능).
```

- [ ] **Step 3: staff/README.md 작성**

`staff/README.md`:
```markdown
# 도담CRM 스태프 페이지

로컬 확인: `python3 -m http.server 8000` 후 `http://localhost:8000/staff/`
실 서비스: dodam-mindcare가 GitHub Pages로 배포되면 `https://<도메인>/staff/`에서 접근.

로그인 가능 계정은 Google Sheet의 `AllowedUsers` 탭에서 관리(이메일 추가/삭제로 즉시 반영).
```

- [ ] **Step 4: 전체 시나리오 최종 확인 (브라우저)**

`python3 -m http.server 8000` → `/staff/`에서 로그인 → 일정 탭에서 예약 생성 → 내담자 탭에서 신규
내담자 만들고 메모 추가 → 그 내담자로 결제 기록(바우처 포함) → 결제요청 등록 후 완료 처리 →
정합성점검 실행. 전부 에러 없이 동작하는지 확인.

- [ ] **Step 5: 커밋**

```bash
cd ~/websites/dodam-mindcare
git add staff/js/router.js staff/index.html apps-script/README.md staff/README.md
git commit -m "feat: 뷰 전환 배선 + 배포 문서 — Phase 1 완료"
```

---

## Self-Review 메모 (계획 작성자 자체 점검)

- **스펙 커버리지**: 일정 공유/CRUD(Task 5,6,7) · 방 충돌 차단(Task 4,5) · 반복+예외처리(Task 4,5) ·
  결제기록+커버종료일(Task 9) · 바우처 분할(Task 9) · 내담자 메모 이력(Task 8) · 결제요청 상태추적
  (Task 10) · 정합성 점검(Task 11) · 인증/화이트리스트(Task 3) — 스펙의 모든 섹션에 대응 Task 존재.
- **Phase 2 제외 확인**: 실제 PG 카드결제 처리, 페이히어 API 자동연동은 어떤 Task에도 포함하지 않음
  (의도적 — 오픈 아이템으로 스펙에 남겨둠).
- **타입/시그니처 일관성**: `findRow_`/`appendRow_`/`updateRow_`/`deleteRow_`(Task 2)가 이후 모든 Task
  에서 동일한 시그니처로 재사용됨. `checkConflict_`/`createCalendarEvent_` 등(Task 4)도 Task 5에서
  선언한 파라미터 순서 그대로 소비됨 — 불일치 없음.
