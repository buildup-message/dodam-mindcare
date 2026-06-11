# 도담마인드케어 홈페이지 (Dodam Mindcare)

도담마인드케어 심리상담센터의 공식 프리미엄 랜딩 페이지입니다.  
본 홈페이지는 성인 개인상담을 중심으로 부모, 아동·청소년, 부부와 가족까지 함께 만나는 도담마인드케어의 가치와 철학을 담고 있습니다.

## 🎨 주요 디자인 컨셉
* **따뜻한 라왕나무 테마**: 차분하고 깊이 있는 우드 톤과 자연의 안정감을 주는 그린 컬러를 조합한 힐링 테마.
* **책방 같은 아늑함**: 편안히 머물 수 있는 따뜻한 톤온톤 레이아웃과 감성적인 서체(Noto Serif KR, Pretendard).
* **인터랙티브 갤러리**: 모래놀이치료실, 책장, 상담실 등 내부의 넉넉한 공간감을 생생하게 탐색할 수 있는 필터링 기능 탑재.

## 🛠️ 기술 스택
* HTML5 (시맨틱 태그)
* Vanilla CSS3 (반응형 웹, CSS Custom Variables)
* Vanilla JavaScript (ES6, 인터랙션 구현)

## 📂 폴더 구조
```markdown
├── index.html           # 메인 홈페이지 마크업
├── css/
│   └── style.css        # 핵심 디자인 시스템 및 전체 스타일시트
├── js/
│   └── main.js          # 캐러셀 슬라이더, 모달, 갤러리 등 스크립트 파일
├── 사진/                # 원본 공간 이미지 폴더 (사용자 제공)
├── .gitignore           # Git 업로드 제외 파일 목록
└── README.md            # 본 설명서
```

## 🚀 GitHub Pages 배포 방법
본 프로젝트는 순수 정적 파일(Static Files)로 구성되어 있어 GitHub Pages를 통해 무료로 손쉽게 배포할 수 있습니다.

1. **GitHub 저장소 생성 및 코드 업로드**
   * GitHub에서 새로운 저장소(Repository)를 생성합니다.
   * 로컬 프로젝트 폴더에서 아래 명령을 실행하여 코드를 업로드합니다:
     ```bash
     git init
     git add .
     git commit -m "Initial commit"
     git branch -M main
     git remote add origin https://github.com/사용자아이디/저장소이름.git
     git push -u origin main
     ```
2. **GitHub Pages 활성화**
   * GitHub 저장소 페이지의 **Settings** -> **Pages** 메뉴로 이동합니다.
   * **Build and deployment** 항목의 Source를 `Deploy from a branch`로 선택합니다.
   * Branch를 `main` (또는 `/root`)으로 지정하고 **Save** 버튼을 누릅니다.
   * 약 1~2분 후, 제공되는 GitHub Pages URL(예: `https://username.github.io/repo-name/`)을 통해 전 세계 어디서나 홈페이지에 접속할 수 있습니다.
