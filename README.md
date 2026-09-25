# Alfred

로컬 개발 앱 실행/중지 + 할일·아이디어 기록용 개인 비서 데스크톱 앱 (Windows)

## 기능
- 로컬 프로젝트 등록 (이름·폴더·실행 명령·URL) → 실행/중지, 브라우저 열기, 폴더 열기
- 할일: 추가/완료/삭제, 앱 연결·필터
- 아이디어: 메모 카드 기록, 앱 연결
- 알프레드 종료 시 실행한 dev 서버 자동 종료

## 포트 규칙
- 앱별 고정 포트로 충돌 방지: 첫 앱 3100, 이후 등록 앱은 기존 최대 포트 + 1 자동 배정
- 실행 시 `PORT` 환경변수 전달 + 명령·URL 내 `{port}` 치환

## 실행
```bash
npm install
npm run dev        # 개발 모드
npm run build:win  # 설치 파일 빌드
```

## 데이터 위치
- `%APPDATA%\Alfred\alfred-data.json`

## 구조
- `src/main` — 창 생성, IPC, JSON 저장소(`store.ts`), 프로세스 실행기(`runner.ts`)
- `src/preload` — 렌더러에 `window.alfred` API 노출
- `src/shared` — 메인/렌더러 공용 타입
- `src/renderer` — React UI (베이지 테마, `assets/main.css`)
