-- 데이터 갱신 파이프라인 1·2단계 테이블 (docs/데이터-갱신-파이프라인.md 5장)
--
-- 아동 정보를 담는 칸은 없다. 공공 API 의 제도 원문과 동기화 기록만 둔다.
-- 모든 테이블에 RLS 를 켜고 정책을 두지 않는다 — 브라우저(anon 키)로는 읽지도 쓰지도 못하고,
-- 서버 라우트가 secret 키(service_role)로만 다룬다.

-- cron 이 돌 때마다 한 줄
create table if not exists public.sync_runs (
  id          bigint generated always as identity primary key,
  started_at  timestamptz not null,
  finished_at timestamptz not null default now(),
  trigger     text not null default 'cron',          -- cron | manual
  checked     integer not null default 0,            -- 본 원문 수
  added       integer not null default 0,            -- 처음 본 것
  changed     integer not null default 0,            -- 해시가 바뀐 것
  failed      integer not null default 0,
  by_source   jsonb not null default '{}'::jsonb,    -- { bokjiro: {checked, changed, ...}, ... }
  errors      jsonb not null default '[]'::jsonb     -- [{ source, id, message }]
);

-- 마지막으로 본 공식 원문. (출처, 서비스ID) 마다 한 줄
create table if not exists public.raw_snapshots (
  source       text not null check (source in ('bokjiro', 'gov24', 'local')),
  service_id   text not null,
  name         text not null default '',
  hash         text not null,                         -- 정규화한 원문의 sha256
  payload      jsonb not null,                        -- /api/welfare 가 내는 모양 그대로
  source_updated text not null default '',            -- 원문이 밝힌 수정일 (있으면)
  fetched_at   timestamptz not null default now(),    -- 마지막으로 받은 시각
  changed_at   timestamptz not null default now(),    -- 해시가 마지막으로 바뀐 시각
  primary key (source, service_id)
);

-- 사람이 볼 목록. 바뀐 원문은 자동으로 반영하지 않고 여기 올린다
create table if not exists public.review_queue (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  source      text not null,
  service_id  text not null,
  name        text not null default '',
  kind        text not null check (kind in ('changed', 'added', 'document')),
  old_hash    text,
  new_hash    text not null,
  changes     jsonb not null default '[]'::jsonb,     -- [{ field, before, after }]
  status      text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewer_note text not null default '',
  doc_url     text not null default '',
  reviewed_at timestamptz,
  unique (source, service_id, new_hash)               -- cron 이 두 번 돌아도 한 번만 올라간다
);

create index if not exists review_queue_status_idx on public.review_queue (status, created_at desc);

alter table public.sync_runs     enable row level security;
alter table public.raw_snapshots enable row level security;
alter table public.review_queue  enable row level security;
