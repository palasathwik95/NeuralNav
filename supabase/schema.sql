-- Trailhead schema
-- Owned jointly across the team: `profiles`, `skill_scores`, `activity_logs`,
-- and `path_waypoints` are primarily written by the Profile Engine /
-- Recommendation Engine / Path Generator. The Conversational Interface and
-- Dashboard (this piece) read all of them and write to `chat_messages` and
-- `mentor_suggestions` directly, plus apply small profile/path deltas that
-- come out of a chat turn.

create extension if not exists "uuid-ossp";

create table if not exists profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  name text not null default 'Student',
  goal text not null default 'Set a learning goal',
  level text not null default 'Beginner',
  weekly_hours int not null default 5,
  style text not null default '',
  interests text[] not null default '{}',
  streak_days int not null default 0,
  xp int not null default 0,
  xp_to_next int not null default 1000,
  updated_at timestamptz not null default now()
);

create table if not exists path_waypoints (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  status text not null check (status in ('done', 'active', 'upcoming', 'locked')),
  weeks int not null default 1,
  order_index int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists skill_scores (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  skill text not null,
  value int not null check (value between 0 and 100),
  updated_at timestamptz not null default now()
);

create table if not exists activity_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  minutes int not null default 0,
  unique (user_id, day)
);

create table if not exists chat_messages (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists mentor_suggestions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  reason text not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'dismissed')),
  created_at timestamptz not null default now()
);

-- Row level security: every table is scoped to the authenticated user.
alter table profiles enable row level security;
alter table path_waypoints enable row level security;
alter table skill_scores enable row level security;
alter table activity_logs enable row level security;
alter table chat_messages enable row level security;
alter table mentor_suggestions enable row level security;

create policy "own profile" on profiles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own waypoints" on path_waypoints for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own skills" on skill_scores for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own activity" on activity_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own messages" on chat_messages for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own suggestions" on mentor_suggestions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
