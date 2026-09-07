// NightFind — centrale configuratie. Vul hier je affiliate-ID's en endpoints in.
window.NF_CONFIG = {
  supabaseUrl: 'https://wwsxjoavjccajwrcrtfg.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3c3hqb2F2amNjYWp3cmNydGZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMzUwMTYsImV4cCI6MjA2OTkxMTAxNn0.9w25Fw0q7vNfH3KC5XphzgJP_S2jM7E89tb2OrKr8pE',

  // Chatbot backend (Supabase Edge Function die naar Claude proxied).
  // Leeg laten = lokale fallback-antwoorden (geen AI).
  chatEndpoint: 'https://wwsxjoavjccajwrcrtfg.supabase.co/functions/v1/chat',

  affiliates: {
    booking: { aid: '' },          // Booking.com Affiliate Partner ID
    viator:  { pid: '' },          // Viator Partner ID (P00xxxxx)
    tripadvisor: { marker: '' }    // TripAdvisor/CJ tracking marker
  }
};
