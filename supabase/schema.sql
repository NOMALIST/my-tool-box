-- 알프레드(my-tool-box) 데이터 스키마 — 여러 번 실행해도 안전
-- 실행: npm run db:schema  (또는 Supabase SQL Editor에 붙여넣기)

create schema if not exists alfred;

-- 로컬 앱: cwd는 my-app 기준 폴더 이름
create table if not exists alfred.apps (
  id text primary key,
  name text not null,
  cwd text not null,
  command text not null,
  url text not null default '',
  port integer not null,
  created_at bigint not null default (extract(epoch from now()) * 1000)::bigint, -- 등록 순서
  updated_at timestamptz not null default now()
);

create table if not exists alfred.todos (
  id text primary key,
  text text not null,
  done boolean not null default false,
  app_id text,
  created_at bigint not null, -- epoch ms (앱의 Todo.createdAt)
  updated_at timestamptz not null default now()
);

create table if not exists alfred.ideas (
  id text primary key,
  text text not null,
  app_id text,
  created_at bigint not null, -- epoch ms (앱의 Idea.createdAt)
  updated_at timestamptz not null default now()
);

-- 직접 접속(postgres 역할) 전용 → Data API(anon/authenticated) 경로 차단
alter table alfred.apps enable row level security;
alter table alfred.todos enable row level security;
alter table alfred.ideas enable row level security;
revoke all on schema alfred from anon, authenticated;
revoke all on all tables in schema alfred from anon, authenticated;
