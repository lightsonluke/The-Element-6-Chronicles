// Region helper used by Community Hub presence/server discovery.
// We intentionally use broad matchmaking regions so clients can agree without
// requiring a separate geolocation service.
export function getClientRegion() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    const lang = navigator?.language || '';
    if (/^America\/(New_York|Detroit|Toronto|Indiana|Montreal|Halifax|St_Johns)/.test(tz)) return 'NA-EAST';
    if (/^America\/(Chicago|Winnipeg|Mexico_City|Managua|Guatemala|Costa_Rica)/.test(tz)) return 'NA-CENTRAL';
    if (/^America\/(Denver|Edmonton|Phoenix|Boise)/.test(tz)) return 'NA-MOUNTAIN';
    if (/^America\/(Los_Angeles|Vancouver|Tijuana)/.test(tz)) return 'NA-WEST';
    if (/^America\//.test(tz)) return 'AMERICAS';
    if (/^Europe\//.test(tz)) return 'EUROPE';
    if (/^Africa\//.test(tz)) return 'AFRICA';
    if (/^Asia\//.test(tz)) return 'ASIA';
    if (/^Australia\/|^Pacific\//.test(tz)) return 'OCEANIA';
    if (/^en-(GB|IE)/i.test(lang)) return 'EUROPE';
    return 'NA-EAST';
  } catch { return 'NA-EAST'; }
}
