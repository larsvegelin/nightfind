// NightFind — affiliate deeplinks. Werkt ook zonder ID's (dan zonder tracking).
(function () {
  const cfg = () => (window.NF_CONFIG && window.NF_CONFIG.affiliates) || {};
  const q = (s) => encodeURIComponent(s || '');

  function bookingHotels(city, opts = {}) {
    const p = new URLSearchParams({ ss: city, group_adults: opts.adults || 2, no_rooms: 1 });
    if (opts.checkin) p.set('checkin', opts.checkin);
    if (opts.checkout) p.set('checkout', opts.checkout);
    if (cfg().booking && cfg().booking.aid) p.set('aid', cfg().booking.aid);
    return `https://www.booking.com/searchresults.html?${p.toString()}`;
  }

  function viatorActivities(city, keyword = '') {
    const p = new URLSearchParams({ text: [city, keyword].filter(Boolean).join(' ') });
    if (cfg().viator && cfg().viator.pid) {
      p.set('pid', cfg().viator.pid); p.set('mcid', '42383'); p.set('medium', 'link');
    }
    return `https://www.viator.com/searchResults/all?${p.toString()}`;
  }

  function tripadvisor(city, keyword = 'restaurants') {
    const p = new URLSearchParams({ q: `${keyword} ${city}` });
    if (cfg().tripadvisor && cfg().tripadvisor.marker) p.set('m', cfg().tripadvisor.marker);
    return `https://www.tripadvisor.com/Search?${p.toString()}`;
  }

  // Kies per stoptype de best passende partner.
  function forStop(stop, city) {
    switch (stop.type) {
      case 'hotel':      return { label: 'Bekijk hotels op Booking.com', partner: 'Booking.com', url: bookingHotels(city) };
      case 'activity':   return { label: 'Boek via Viator', partner: 'Viator', url: viatorActivities(city, stop.keyword || stop.name) };
      case 'restaurant': return { label: 'Reviews & reserveren op TripAdvisor', partner: 'TripAdvisor', url: tripadvisor(city, `${stop.name} restaurant`) };
      case 'bar':
      case 'club':       return { label: 'Bekijk op TripAdvisor', partner: 'TripAdvisor', url: tripadvisor(city, `${stop.name} ${stop.type}`) };
      default:           return { label: 'Meer info', partner: 'TripAdvisor', url: tripadvisor(city, stop.name) };
    }
  }

  window.NF_AFFILIATES = { bookingHotels, viatorActivities, tripadvisor, forStop, q };
})();
