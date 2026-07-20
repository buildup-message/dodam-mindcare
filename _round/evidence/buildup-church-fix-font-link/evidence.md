# buildup-church 넥슨폰트 404 CDN 링크 제거 및 Pretendard 교체 검증 증거 (task-id: buildup-church-fix-font-link)

> **수행 일시:** 2026-07-20 16:33:30 KST
> **수행 노드:** worker-2 (gemini)
> **대상 지휘관:** master

---

## 1. 작업 개요 및 변경 파일 (3개 파일 한정)

| 대상 파일 | 수정 내용 | 검증 결과 |
|---|---|---|
| `~/websites/buildup-church/index.html` | 넥슨고딕 404 CDN link 및 CSS 주석 제거 → Pretendard CDN link 수신 및 `font-family: 'Pretendard', sans-serif;` 지정 | **성공 (grep 0건, HTTP 200)** |
| `~/websites/buildup-church/devotions/index.html` | 넥슨고딕 404 CDN link 및 CSS 주석 제거 → Pretendard CDN link 및 `font-family: 'Pretendard', sans-serif;` 정리 | **성공 (grep 0건, HTTP 200)** |
| `~/websites/buildup-church/devotions/2026-07-19/index.html` | 넥슨고딕 404 CDN link 제거, `font-family` 리스트에서 `'NexonLv1Gothic'` 제거 | **성공 (grep 0건, HTTP 200)** |

---

## 2. 검증 실측 결과 (Evidence Details)

### 2-1. Grep 잔존 검사 (Negative-Case)
- **명령:** `grep -ri "NexonLv1Gothic" ~/websites/buildup-church`
- **결과:** **0건** (NexonLv1Gothic 텍스트 완전히 삭제됨)
- **명령:** `grep -ri "webfontworld" ~/websites/buildup-church`
- **결과:** **0건** (404 CDN URL completely removed)

### 2-2. 로컬 렌더링 HTTP 200 검사 (Real-Data Verification)
- **테스트 방식:** `http.server` (Port 8795) 가동 후 urllib로 3개 대상 파일 GET 실측.
- **결과:**
  1. `http://localhost:8795/index.html`: **HTTP 200 OK** (`Pretendard` 적용, `NexonLv1Gothic` 0건)
  2. `http://localhost:8795/devotions/index.html`: **HTTP 200 OK** (`Pretendard` 적용, `NexonLv1Gothic` 0건)
  3. `http://localhost:8795/devotions/2026-07-19/index.html`: **HTTP 200 OK** (`Pretendard` 적용, `NexonLv1Gothic` 0건)

### 2-3. Git 커밋 이력
- **커밋 ID:** `194c8fe`
- **커밋 메시지:** `fix: remove broken NexonLv1Gothic CDN link and replace with Pretendard font`
- **원격 push 상태:** 미실행 (master 승인 대기 중)
