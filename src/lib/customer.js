// Two customers can share a company name (e.g. LAKSHMI MOTORS in Kovilpalayam and
// in Annur), so pickers show where each one is: the line just before the last line
// of the address (the last one is usually city/pincode, shared by both), or the only
// line when there is one; old records may only have a separate city. Plus the GST number.
function placeAddressLine(c) {
  const lines = (c.address || '')
    .split(/[\r\n]+/)
    .map((l) => l.replace(/\s+/g, ' ').replace(/^[\s,]+|[\s,]+$/g, ''))
    .filter(Boolean)
  if (lines.length >= 2) return lines[lines.length - 2]
  return lines[0] || (c.city || '').trim()
}

export function customerPlace(c) {
  if (!c) return ''
  return [placeAddressLine(c), (c.gst_number || '').trim()].filter(Boolean).join(' · ')
}

export function customerLabel(c) {
  const place = customerPlace(c)
  return place ? `${c.name} — ${place}` : c.name
}
