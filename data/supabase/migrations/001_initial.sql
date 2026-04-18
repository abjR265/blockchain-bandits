-- Initial Blockchain-Bandits schema
-- Apply: `supabase db push`

-- ========== wallets ==========
-- Canonical record of any wallet we've scored at least once.

create table if not exists public.wallets (
    address text primary key check (address ~ '^0x[a-f0-9]{40}$'),
    first_seen timestamptz not null default now(),
    last_seen_onchain timestamptz,
    notes text
);

-- ========== predictions ==========
-- Every score we've ever served. Append-only; never update in place.

create table if not exists public.predictions (
    id uuid primary key default gen_random_uuid(),
    address text not null references public.wallets(address) on delete cascade,
    label text not null check (label in (
        'legitimate', 'phishing', 'mixer_usage', 'bot_activity', 'sanctioned', 'unknown'
    )),
    risk_score real not null check (risk_score between 0 and 1),
    confidence real not null check (confidence between 0 and 1),
    top_features jsonb not null default '[]'::jsonb,
    model_version text not null,
    scored_at timestamptz not null default now()
);

create index if not exists predictions_address_scored_idx
    on public.predictions (address, scored_at desc);

create index if not exists predictions_scored_at_idx
    on public.predictions (scored_at desc);

-- ========== feedback ==========
-- Analyst corrections tied back to the exact prediction served.

create table if not exists public.feedback (
    id uuid primary key default gen_random_uuid(),
    prediction_id uuid not null references public.predictions(id) on delete cascade,
    verdict text not null check (verdict in ('correct', 'incorrect')),
    correct_label text check (correct_label in (
        'legitimate', 'phishing', 'mixer_usage', 'bot_activity', 'sanctioned', 'unknown'
    )),
    note text,
    analyst_id uuid references auth.users(id),
    created_at timestamptz not null default now()
);

create index if not exists feedback_prediction_idx on public.feedback (prediction_id);

-- ========== labels ==========
-- Ground-truth / weak label seeds loaded from OFAC, CryptoScamDB, etc.

create table if not exists public.labels (
    address text not null references public.wallets(address) on delete cascade,
    label text not null,
    source text not null,
    loaded_at timestamptz not null default now(),
    primary key (address, source, label)
);

-- ========== models ==========
-- Tiny registry so the UI can display which model produced a score.

create table if not exists public.models (
    version text primary key,
    kind text not null check (kind in ('xgboost', 'graphsage', 'ensemble')),
    r2_uri text not null,
    metrics jsonb,
    is_production boolean not null default false,
    created_at timestamptz not null default now()
);

create unique index if not exists models_one_prod_idx
    on public.models (is_production) where is_production;

-- ========== Row-level security ==========
-- Week-1 skeleton: permissive policies so the service role can read/write.
-- Week-5: restrict to authenticated analyst role.

alter table public.wallets       enable row level security;
alter table public.predictions   enable row level security;
alter table public.feedback      enable row level security;
alter table public.labels        enable row level security;
alter table public.models        enable row level security;

create policy "service role all wallets"     on public.wallets       for all using (true) with check (true);
create policy "service role all predictions" on public.predictions   for all using (true) with check (true);
create policy "service role all feedback"    on public.feedback      for all using (true) with check (true);
create policy "service role all labels"      on public.labels        for all using (true) with check (true);
create policy "service role all models"      on public.models        for all using (true) with check (true);
