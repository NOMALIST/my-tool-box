# Alfred

로컬 개발 앱 실행/중지 + 할일·아이디어 기록용 개인 비서 데스크톱 앱 (Windows)

## 기능
- 로컬 프로젝트 등록 (이름·폴더·실행 명령·URL) → 실행/중지, 브라우저 열기, 폴더 열기
- 할일: 추가/완료/삭제, 앱 연결·필터
- 아이디어: 메모 카드 기록, 앱 연결
- 알프레드 종료 시 실행한 dev 서버 자동 종료

## 폴더 규칙
- 모든 로컬 앱은 `my-app` 폴더 바로 아래에 폴더 단위로 존재 (알프레드 포함)
- 앱 등록 시 폴더 이름만 저장 → 실행 시 알프레드의 상위 폴더 기준으로 경로 계산
- `my-app`의 상위 위치는 PC마다 달라도 됨
- 앱 이름 = 폴더 이름으로 통일
- 소스 실행(바로가기, `npm run dev`) 전용 — 설치형 빌드(`build:win`)에서는 기준 폴더 계산이 맞지 않음

## 포트 규칙
- 앱별 고정 포트로 충돌 방지: 첫 앱 3100, 이후 등록 앱은 기존 최대 포트 + 1 자동 배정
- 실행 시 `PORT` 환경변수 전달 + 명령·URL 내 `{port}` 치환

## 실행
```bash
npm install
# my-app/.env.local 필요 (.env.example 참고, DATABASE_URL)
npm run dev        # 개발 모드
npm run build:win  # 설치 파일 빌드
npm run shortcut   # 바탕화면·시작 메뉴 바로가기 생성 (최초 1회)
```

## 바로가기 실행
- 바로가기 → `scripts/launch.vbs` → 터미널 창 없이 `npm run start` (최신 소스 빌드 후 실행)
- 코드 수정 후 별도 빌드 불필요, 다시 실행하면 반영
- 실행 안 될 때: 프로젝트 루트 `launch.log` 확인
- 프로젝트 폴더 이동 시 `npm run shortcut` 재실행
- `launch.vbs`는 UTF-16 LE(BOM) 유지 필수 — UTF-8 저장 시 한글 주석이 다음 줄을 삼켜 실행 안 됨

## 데이터 위치
- Supabase Postgres `alfred` 스키마 (앱·할일·아이디어) → 모든 PC가 같은 데이터 공유
  - 접속 정보: `my-app/.env.local`의 `DATABASE_URL` — 모든 로컬 앱 공유 (git 미포함, PC마다 1회 복사)
  - my-tool-box 폴더에 `.env.local`이 있으면 그 값 우선
  - 스키마: `supabase/schema.sql` → `npm run db:schema`로 적용 (재실행 안전)
- 항목 단위 저장 → 여러 PC에서 써도 서로 덮어쓰지 않음
- 다른 PC의 변경은 창에 다시 들어올 때 재조회로 반영
- DB 연결 실패 시 오류 표시 (오프라인 사용 불가)
- 기존 로컬 파일(`%APPDATA%\Alfred\alfred-data.json`) 이전: `npm run db:migrate-json`

## 구조
- `src/main` — 창 생성, IPC, DB 저장소(`store.ts`, `db.ts`), 폴더 경로(`paths.ts`), 프로세스 실행기(`runner.ts`)
- `src/preload` — 렌더러에 `window.alfred` API 노출
- `src/shared` — 메인/렌더러 공용 타입
- `src/renderer` — React UI (베이지 테마, `assets/main.css`)
