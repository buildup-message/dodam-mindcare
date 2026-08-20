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
새 배포 URL이 기존과 다르면 `staff/js/config.js`도 갱신해야 한다(Web App URL이 배포마다 바뀔 수 있음 — "배포 관리"에서 기존 배포를 "편집"하면 URL을 유지한 채 업데이트 가능).
