# buildup-church 신규 주일설교 영상 아카이브 페이지 검증·push 보고서 (task-id: buildup-church-verify-sermons-archive-push)

> **수행 일시:** 2026-07-21 04:18:58 KST
> **수행 노드:** worker-2 (gemini)
> **대상 경로:** `~/websites/buildup-church/sermons/index.html` (신규) 및 `~/websites/buildup-church/index.html` (수정)

---

## 1. 설교 영상 아카이브 및 렌더링 실측 결과

- **신규 설교 아카이브 (`sermons/index.html`):**
  - 5개 주차 영상(06-07, 06-14, 06-28, 07-05, 07-12)을 오래된 순서(오름차순)로 배열 완료.
  - 총 6개 iframe 영상 재생 태그 100% 정상 구성 확인 (07-12 주차는 1부 `9JvvDQBKr14` 및 2부 `D0sus9SiGlA` 2개 영상 포함).
  - 각 카드별 '이 주의 묵상 보기' 5개 버튼 링크가 실제 [devotions/](file:///Users/build-upchurch/websites/buildup-church/devotions/) 개별 주차 페이지로 정상 연결 확인.

| 주차 | 주일 설교 제목 | iframe YouTube Embed ID | 묵상 페이지 연결 링크 | 검증 결과 |
|---|---|---|---|---|
| **2026-06-07** | 창조의 시작 | `IzbtZFdJuL8` | `../devotions/2026-06-07/index.html` | **정상 연결** |
| **2026-06-14** | 새로운 출발 | `y2-TZF2agkY` | `../devotions/2026-06-14/index.html` | **정상 연결** |
| **2026-06-28** | 열정을 넘어, 헤세드로 | `zALfAmYy_WQ` | `../devotions/2026-06-28/index.html` | **정상 연결** |
| **2026-07-05** | 완벽한 통치, 참된 안식 | `qxsR1WIdSU8` | `../devotions/2026-07-05/index.html` | **정상 연결** |
| **2026-07-12** | 성경이 말하는 진짜 성공 | 1부: `9JvvDQBKr14`<br>2부: `D0sus9SiGlA` | `../devotions/2026-07-12/index.html` | **정상 연결** |

- **메인 페이지 (`index.html`):**
  - 헤더 상단 네비게이션 메뉴에 '주일설교 영상' 링크 (`sermons/index.html`) 정상 추가.
  - 기존 '주일 설교 영상' 섹션에 '전체보기' 링크 추가 및 최신 영상 (`9JvvDQBKr14`) 갱신 완료 (레이아웃 무손상).

---

## 2. HTTP Server 렌더링 검증 결과

- **로컬 HTTP 서버 (Port 8803):** `sermons/index.html` 및 `index.html` 실측 대조.
- **결과:** 두 페이지 모두 **HTTP 200 OK** 통과.

---

## 3. Git Commit & GitHub Push 정보

- **커밋 해시 (Commit Hash):** `ce386d7`
- **커밋 메시지:** `Add sermons archive page linking all available sermon videos in order`
- **GitHub 커밋 URL:** https://github.com/buildup-message/buildup-church/commit/ce386d7
- **Push 결과:** `26eccd1..ce386d7 main -> main` (`local main == origin/main` 100% 최신 동기화 완료)
