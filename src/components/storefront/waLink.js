/** Click-to-chat only (no automation). `text` is prefilled; the buyer sends it themselves. */
export const waLink = (number, text) => `https://wa.me/${number}${text ? `?text=${encodeURIComponent(text)}` : ''}`
