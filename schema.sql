-- =====================================================
-- PhishGuard AI — Database Schema
-- Run this in your Supabase project:
-- SQL Editor → New query → Paste & Run
-- =====================================================

-- 1. Users Table
create table if not exists users (
    id uuid primary key default gen_random_uuid(),
    username text not null,
    phone text unique,
    phone_verified boolean default false,
    created_at timestamptz default now()
);

-- 2. Communities Table (Neighborhood / Organization Fraud Circles)
create table if not exists communities (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    invite_code text unique not null,
    whatsapp_invite_url text,
    admin_id uuid references users(id) on delete set null,
    created_at timestamptz default now()
);

-- 3. Community Members Table
create table if not exists community_members (
    id uuid primary key default gen_random_uuid(),
    community_id uuid references communities(id) on delete cascade,
    user_id uuid references users(id) on delete cascade,
    joined_at timestamptz default now(),
    unique(community_id, user_id)
);

-- 4. Fraud Reports Table (Community Threat Feed)
create table if not exists reports (
    id uuid primary key default gen_random_uuid(),
    reporter_id uuid references users(id) on delete cascade,
    type text not null, -- 'url' | 'phone' | 'message'
    target text not null,
    description text,
    status text default 'pending',
    created_at timestamptz default now()
);

-- 5. Report Confirmations Table (Crowdsourced Verification Upvotes)
create table if not exists report_confirmations (
    id uuid primary key default gen_random_uuid(),
    report_id uuid references reports(id) on delete cascade,
    user_id uuid references users(id) on delete cascade,
    created_at timestamptz default now(),
    unique(report_id, user_id)
);

-- =====================================================
-- Row Level Security (RLS) & Client Access Policies
-- Enables safe read and insert from PhishGuard frontend
-- =====================================================

alter table users enable row level security;
alter table communities enable row level security;
alter table community_members enable row level security;
alter table reports enable row level security;
alter table report_confirmations enable row level security;

-- Policies for public/anon access with Supabase anon key
create policy "Allow public read on communities" 
    on communities for select using (true);
create policy "Allow public insert on communities" 
    on communities for insert with check (true);
create policy "Allow public update on communities" 
    on communities for update using (true);

create policy "Allow public read on community_members" 
    on community_members for select using (true);
create policy "Allow public insert on community_members" 
    on community_members for insert with check (true);

create policy "Allow public read on users" 
    on users for select using (true);
create policy "Allow public insert on users" 
    on users for insert with check (true);
create policy "Allow public update on users" 
    on users for update using (true);

create policy "Allow public read on reports" 
    on reports for select using (true);
create policy "Allow public insert on reports" 
    on reports for insert with check (true);

create policy "Allow public read on report_confirmations" 
    on report_confirmations for select using (true);
create policy "Allow public insert on report_confirmations" 
    on report_confirmations for insert with check (true);

-- =====================================================
-- Seed Initial PhishGuard Trust Community
-- =====================================================
insert into communities (id, name, invite_code, whatsapp_invite_url)
values (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'PhishGuard Trust Community',
    'TRUST-PG',
    'https://chat.whatsapp.com/FyhDlxIEj4R8BLXtjkJDyTIN'
) on conflict do nothing;
