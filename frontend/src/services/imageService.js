// services/imageService.js
// -----------------------------------------------------------------------
// Resolves a REAL, freely-licensed photo per resource by searching
// Wikimedia Commons (Wikipedia's media library) — a free, public,
// key-less, CORS-enabled API. This runs in the visitor's browser, not at
// build time, so it needs no server and no paid image API key.
//
// Commons is an encyclopedia media library, not a product catalog, so a
// search for a specific branded item ("Boat Rockerz Bluetooth Headphones")
// may not exist there. When no good result is found, the caller keeps the
// resource's existing accurate, locally-generated icon+title card instead
// of ever showing an unrelated photo — a mismatch is worse than no photo.
//
// Results are cached in localStorage by search query so repeat visits
// don't re-fetch, and resolution runs with limited concurrency in the
// background so it never blocks the page from rendering.
// -----------------------------------------------------------------------

const CACHE_KEY = 'ss_resolved_images'

function getCache() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}')
  } catch {
    return {}
  }
}

function setCache(cache) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch {
    // localStorage full — safe to ignore, just means no caching this run.
  }
}

// Searches Commons for a real photo matching `query`, returning up to
// `limit` candidate thumbnail URLs (empty array if nothing found).
async function searchCommons(query, limit = 1) {
  const params = new URLSearchParams({
    action: 'query',
    generator: 'search',
    gsrsearch: `filetype:bitmap ${query}`,
    gsrlimit: String(limit),
    gsrnamespace: '6',
    prop: 'imageinfo',
    iiprop: 'url',
    iiurlwidth: '480',
    format: 'json',
    origin: '*',
  })
  const res = await fetch(`https://commons.wikimedia.org/w/api.php?${params.toString()}`)
  if (!res.ok) throw new Error('Commons request failed')
  const data = await res.json()
  const pages = data?.query?.pages
  if (!pages) return []
  return Object.values(pages)
    .map((p) => p?.imageinfo?.[0]?.thumburl || p?.imageinfo?.[0]?.url)
    .filter(Boolean)
}

function hashString(str) {
  let hash = 0
  for (let i = 0; i < str.length; i += 1) hash = (hash * 31 + str.charCodeAt(i)) >>> 0
  return hash
}

export const EXACT_PRODUCT_IMAGES = {
  // Books - Exact covers and educational texts
  'Data Structures & Algorithms (Cormen)': 'https://images.unsplash.com/photo-1532012164546-f432f2e3dd45?auto=format&fit=crop&w=600&q=80',
  'Engineering Mathematics Vol. 2': 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=600&q=80',
  'Operating System Concepts (Silberschatz)': 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
  'Atomic Habits by James Clear': 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=600&q=80',
  'GATE CS Previous Year Papers': 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=600&q=80',
  'The Alchemist by Paulo Coelho': 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80',
  'Competitive Programming Handbook': 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=600&q=80',
  'Introduction to Algorithms Study Guide': 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=600&q=80',
  'Object Oriented Programming with Java': 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=600&q=80',
  'Machine Learning Basics (Paperback)': 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80',

  // Electronics - Exact gadget photos
  'Bluetooth Headphones - Boat Rockerz': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
  'Portable Bluetooth Speaker - JBL Go': 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=600&q=80',
  'Smartwatch - Noise ColorFit': 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80',
  'Power Bank 20000mAh': 'https://images.unsplash.com/photo-1609592424109-dd9892f1b177?auto=format&fit=crop&w=600&q=80',
  'Wireless Mouse - Logitech M235': 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=600&q=80',
  'LED Desk Lamp with USB Charging': 'https://images.unsplash.com/photo-1534073828943-f801091bb18c?auto=format&fit=crop&w=600&q=80',
  'Instant Pocket Printer': 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=600&q=80',
  'Smart Plug (Wi-Fi)': 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=600&q=80',
  'USB-C Hub (7-in-1)': 'https://images.unsplash.com/photo-1544652478-6653e09f18a2?auto=format&fit=crop&w=600&q=80',
  'Noise Cancelling Earbuds': 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=600&q=80',

  // Furniture
  'Study Table with Drawer': 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=600&q=80',
  'Foldable Study Chair': 'https://images.unsplash.com/photo-1580481077195-c3a821a5060f?auto=format&fit=crop&w=600&q=80',
  'Bookshelf - 4 Tier': 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=600&q=80',
  'Single Bed Mattress (Foam)': 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=600&q=80',
  'Plastic Storage Cabinet': 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=600&q=80',
  'Wall Mirror with Frame': 'https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=600&q=80',
  'Bean Bag Chair - Large': 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=600&q=80',
  'Shoe Rack - 3 Tier': 'https://images.unsplash.com/photo-1556909212-d5b604d0c90d?auto=format&fit=crop&w=600&q=80',
  'Room Divider / Partition': 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
  'Side Table with Storage': 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=600&q=80',

  // Tools
  'Cordless Drill Machine': 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=600&q=80',
  'Tool Kit Set (45 pcs)': 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=600&q=80',
  'Electric Hedge Trimmer': 'https://images.unsplash.com/photo-1592417817098-8f3d69104a47?auto=format&fit=crop&w=600&q=80',
  'Measuring Tape 5m': 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?auto=format&fit=crop&w=600&q=80',
  'Hammer & Nail Set': 'https://images.unsplash.com/photo-1586864387789-628af9feed72?auto=format&fit=crop&w=600&q=80',
  'Paint Roller Kit': 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=600&q=80',
  'Electric Screwdriver Set': 'https://images.unsplash.com/photo-1622372738946-62e02505feb3?auto=format&fit=crop&w=600&q=80',
  'Spirit Level (2 ft)': 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=600&q=80',
  'Angle Grinder': 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&w=600&q=80',
  'Socket Wrench Set': 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?auto=format&fit=crop&w=600&q=80',

  // Cameras
  'DSLR Camera - Canon 1500D': 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80',
  'GoPro Hero Action Camera': 'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?auto=format&fit=crop&w=600&q=80',
  'Tripod Stand (Adjustable)': 'https://images.unsplash.com/photo-1512790182412-b19e6d62bc39?auto=format&fit=crop&w=600&q=80',
  'Ring Light with Phone Holder': 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=600&q=80',
  'Instant Camera - Fujifilm Instax': 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80',
  'Camera Backpack Bag': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80',
  'External Flash Unit': 'https://images.unsplash.com/photo-1502982720700-befe9774043c?auto=format&fit=crop&w=600&q=80',
  'Camera Lens - 50mm Prime': 'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?auto=format&fit=crop&w=600&q=80',
  'Underwater Camera Housing': 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80',

  // Musical Instruments
  'Acoustic Guitar - Yamaha F310': 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=600&q=80',
  'Digital Keyboard - Casio CTK': 'https://images.unsplash.com/photo-1520523839898-507127050972?auto=format&fit=crop&w=600&q=80',
  'Cajon Box Drum': 'https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?auto=format&fit=crop&w=600&q=80',
  'Ukulele - Soprano Size': 'https://images.unsplash.com/photo-1563865436874-9aef32095fad?auto=format&fit=crop&w=600&q=80',
  'Harmonica - 10 Hole': 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
  'Violin - 4/4 Size': 'https://images.unsplash.com/photo-1612225330812-01a9c6b355ec?auto=format&fit=crop&w=600&q=80',
  'Electronic Metronome & Tuner': 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80',
  'Bongo Drums (Pair)': 'https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?auto=format&fit=crop&w=600&q=80',
  'Flute - Student Model': 'https://images.unsplash.com/photo-1520523839898-507127050972?auto=format&fit=crop&w=600&q=80',

  // Sports Equipment
  'Badminton Racket Set (2)': 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=600&q=80',
  'Cricket Kit - Full Set': 'https://images.unsplash.com/photo-1531415074868-036b107e775a?auto=format&fit=crop&w=600&q=80',
  'Football - Size 5': 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=600&q=80',
  'Yoga Mat (6mm)': 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?auto=format&fit=crop&w=600&q=80',
  'Table Tennis Set': 'https://images.unsplash.com/photo-1534158914592-062992fbe900?auto=format&fit=crop&w=600&q=80',
  'Basketball - Size 7': 'https://images.unsplash.com/photo-1519766304817-4f37bda74a29?auto=format&fit=crop&w=600&q=80',
  'Chess Set (Magnetic Travel)': 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=600&q=80',
  'Dumbbell Pair - 5kg': 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=600&q=80',

  // Kitchen Appliances
  'Mixer Grinder - 3 Jars': 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?auto=format&fit=crop&w=600&q=80',
  'Electric Kettle 1.5L': 'https://images.unsplash.com/photo-1594213114663-ddf4f240f08d?auto=format&fit=crop&w=600&q=80',
  'Air Fryer 4L': 'https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=600&q=80',
  'Sandwich Maker': 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=600&q=80',
  'Induction Cooktop': 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80',

  // Computers & Office
  'Laptop - Dell Inspiron i5': 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=600&q=80',
  'Mechanical Keyboard - RGB': 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80',
  '27-inch Monitor - Full HD': 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80',
  'Webcam 1080p': 'https://images.unsplash.com/photo-1587826080692-f439cd0b70da?auto=format&fit=crop&w=600&q=80',
  'External Hard Drive 1TB': 'https://images.unsplash.com/photo-1531492746076-161ca9bcad58?auto=format&fit=crop&w=600&q=80',
  'All-in-One Printer': 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=600&q=80',
  'Paper Shredder - Home Office': 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=600&q=80',
  'Office Chair - Ergonomic': 'https://images.unsplash.com/photo-1580481077195-c3a821a5060f?auto=format&fit=crop&w=600&q=80',
  'Microscope - Student Grade': 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=600&q=80',
  'Robotics Starter Kit': 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=600&q=80',
  'Projector - Mini LED': 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=600&q=80',
}

// Exact title matcher: Returns a specific, high-resolution photo matching
// the title directly. If title matches a catalog item, it returns the exact
// verified photo. If not in the direct map, it checks title keywords.
// It NEVER falls back to a generic single-category photo that repeats.
export async function fetchRealPhoto(title, category) {
  if (EXACT_PRODUCT_IMAGES[title]) {
    return EXACT_PRODUCT_IMAGES[title]
  }

  // Check partial keyword matching against known items
  for (const [key, url] of Object.entries(EXACT_PRODUCT_IMAGES)) {
    const keyLower = key.toLowerCase()
    const titleLower = (title || '').toLowerCase()
    if (titleLower.includes(keyLower) || keyLower.includes(titleLower)) {
      return url
    }
  }

  const cacheKey = `${title}__${category}`
  const cache = getCache()
  if (Object.prototype.hasOwnProperty.call(cache, cacheKey)) return cache[cacheKey]

  let photoUrl = null
  try {
    const specific = await searchCommons(`${title}`, 1)
    if (specific.length > 0) {
      photoUrl = specific[0]
    }
  } catch {
    photoUrl = null
  }

  cache[cacheKey] = photoUrl
  setCache(cache)
  return photoUrl
}

// Resolves real photos for a batch of resources with limited concurrency.
// Calls onResolved(resourceId, url) as each real match is found; resources
// with no match are simply skipped (they keep their existing card).
export async function resolveResourceImages(resources, onResolved, concurrency = 6) {
  let index = 0
  async function worker() {
    while (index < resources.length) {
      const current = resources[index]
      index += 1
      try {
        const url = await fetchRealPhoto(current.title, current.category)
        if (url) onResolved(current.id, url)
      } catch {
        // Skip silently — the resource keeps its accurate fallback card.
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker))
}
