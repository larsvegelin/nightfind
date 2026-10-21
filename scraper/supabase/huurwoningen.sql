-- Huurwoningen Noord-Holland Noord – tabellen voor de scraper in scraper/
-- Supabase-project: "scraper" (ref gpkohiyzdjyehqdkgpdb). Staat los van de ParseLab-tabellen.
--
-- Toegang:
--   * Lezen  : alleen met de juiste toegangscode in de header `x-huur-code` (de pagina vraagt die één keer).
--   * Schrijven: alleen de scraper met de service-role/secret key (die omzeilt RLS). Geen schrijfrechten voor anon.
-- De code zelf staat nergens in de database, alleen de SHA-256-hash in huur_instellingen.
-- Code instellen of wijzigen (in de SQL-editor van Supabase):
--   insert into public.huur_instellingen (id, code_hash) values (true, encode(extensions.digest('<code>', 'sha256'), 'hex'))
--   on conflict (id) do update set code_hash = excluded.code_hash;
--
-- Supabase-advies "Public Can Execute SECURITY DEFINER Function" voor huur_toegang()/huur_info() is bewust:
-- de pagina roept ze aan om de code te controleren. Ze geven alleen true/false terug, of (met geldige code)
-- het tijdstip van de laatste scan en de regio. De codehash zelf is voor anon niet leesbaar.

-- ---------------------------------------------------------------------------
-- Woningen: één rij per advertentie per bron (zelfde velden als data/huurwoningen.json)
-- ---------------------------------------------------------------------------
create table public.huur_woningen (
    id                      text primary key,                 -- "<bron>:<bron-id>", bijv. "funda:43275681"
    source                  text not null,
    source_name             text not null,
    source_type             text not null check (source_type in ('corporatie', 'platform', 'makelaar', 'verhuurder')),
    source_id               text,
    url                     text,
    title                   text,
    street                  text,
    house_number            text,
    house_number_addition   text,
    postcode                text,
    city                    text,
    municipality            text,
    neighbourhood           text,
    address_key             text,                             -- om dezelfde woning op meerdere sites te herkennen
    property_type           text,
    segment                 text,
    rent_total              numeric(10, 2),
    rent_net                numeric(10, 2),
    service_costs           numeric(10, 2),
    energy_costs            numeric(10, 2),
    deposit                 numeric(10, 2),
    area_m2                 integer,
    rooms                   integer,
    bedrooms                integer,
    floor                   text,
    energy_label            text,
    build_year              integer,
    interior                text,
    published_at            date,                             -- datum van plaatsing
    closing_date            date,                             -- reageren tot
    available_from          date,
    available_text          text,
    allocation_model        text,
    reactions               integer,
    landlord                text,
    target_group            text,
    income_text             text,
    age_text                text,
    household_text          text,
    contract                text,
    status                  text not null default 'beschikbaar'
                            check (status in ('beschikbaar', 'binnenkort', 'onder_optie', 'verhuurd_ovb', 'verhuurd', 'gesloten', 'offline')),
    status_text             text,
    label_new               boolean not null default false,
    is_new                  boolean not null default false,
    lat                     double precision,
    lon                     double precision,
    images                  jsonb not null default '[]'::jsonb,
    description             text,
    features                jsonb not null default '[]'::jsonb,
    extra                   jsonb,
    first_seen              timestamptz,
    last_seen               timestamptz,
    offline_since           timestamptz,
    status_history          jsonb not null default '[]'::jsonb,
    details_fetched         boolean not null default false,
    gesynchroniseerd        timestamptz not null default now()  -- laatste keer door de scraper weggeschreven
);

comment on table public.huur_woningen is
    'Huurwoningen Noord-Holland Noord (scraper in de nightfind-repo). Lezen met toegangscode (header x-huur-code), schrijven alleen via service role.';

create index huur_woningen_status_idx on public.huur_woningen (status);
create index huur_woningen_city_idx on public.huur_woningen (city);
create index huur_woningen_published_idx on public.huur_woningen (published_at desc);
create index huur_woningen_address_idx on public.huur_woningen (address_key);
create index huur_woningen_sync_idx on public.huur_woningen (gesynchroniseerd);

-- ---------------------------------------------------------------------------
-- Bronnen: resultaat van de laatste scan per site
-- ---------------------------------------------------------------------------
create table public.huur_bronnen (
    id           text primary key,
    name         text not null,
    type         text not null,
    url          text,
    description  text,
    url_checked  boolean,
    status       text,
    count        integer,
    found        integer,
    complete     boolean,
    error        text,
    notes        jsonb not null default '[]'::jsonb,
    scraped_at   timestamptz,
    duration_s   numeric
);

comment on table public.huur_bronnen is 'Laatste scanresultaat per bron van de huurwoningen-scraper.';

-- ---------------------------------------------------------------------------
-- Instellingen (één rij): hash van de toegangscode, regio en tijdstip laatste scan
-- ---------------------------------------------------------------------------
create table public.huur_instellingen (
    id          boolean primary key default true check (id),
    code_hash   text not null check (length(code_hash) = 64),
    regio       jsonb,
    bijgewerkt  timestamptz
);

comment on table public.huur_instellingen is 'Eén rij met de SHA-256-hash van de toegangscode voor de huurwoningen-pagina.';

-- Klopt de meegestuurde code? (security definer: anon kan de hash zelf niet lezen)
create or replace function public.huur_toegang()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select exists (
        select 1
        from public.huur_instellingen i
        where length(coalesce(nullif(current_setting('request.headers', true), '')::json ->> 'x-huur-code', '')) >= 16
          and i.code_hash = encode(extensions.digest(nullif(current_setting('request.headers', true), '')::json ->> 'x-huur-code', 'sha256'), 'hex')
    );
$$;

comment on function public.huur_toegang() is 'True als de header x-huur-code de juiste toegangscode bevat.';

-- Laatste scan + regio, alleen met geldige code
create or replace function public.huur_info()
returns json
language sql
stable
security definer
set search_path = ''
as $$
    select case when public.huur_toegang()
        then (select json_build_object('bijgewerkt', i.bijgewerkt, 'regio', i.regio) from public.huur_instellingen i)
    end;
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.huur_woningen enable row level security;
alter table public.huur_bronnen enable row level security;
alter table public.huur_instellingen enable row level security;   -- geen policies: alleen service role

create policy "lezen met toegangscode" on public.huur_woningen
    for select to anon, authenticated
    using ((select public.huur_toegang()));

create policy "lezen met toegangscode" on public.huur_bronnen
    for select to anon, authenticated
    using ((select public.huur_toegang()));

revoke all on public.huur_instellingen from anon, authenticated;
revoke insert, update, delete, truncate on public.huur_woningen, public.huur_bronnen from anon, authenticated;
