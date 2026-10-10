// mockData.js
// -----------------------------------------------------------------------
// MODEL layer (see MVC note in README). Plain JS objects/arrays that seed
// the resource catalog. services/api.js wraps these in Promises so the
// rest of the app never needs to know whether data is mock or real.
//
// Sharing types are restricted to the three this business supports:
// Rent Only, Buy Only, Rent or Buy. Borrow/Donate/Exchange/Trade do not
// exist anywhere in this app.
// -----------------------------------------------------------------------

import { EXACT_PRODUCT_IMAGES } from '../services/imageService.js'

export const CATEGORIES = [
  { id: 'cat-books', name: 'Books', icon: '📚', tag: 'textbook' },
  { id: 'cat-electronics', name: 'Electronics', icon: '🔌', tag: 'electronicsgadget' },
  { id: 'cat-furniture', name: 'Furniture', icon: '🛋️', tag: 'furniture' },
  { id: 'cat-tools', name: 'Tools', icon: '🔧', tag: 'handtools' },
  { id: 'cat-sports', name: 'Sports Equipment', icon: '🏸', tag: 'sportsequipment' },
  { id: 'cat-music', name: 'Musical Instruments', icon: '🎸', tag: 'acousticguitar' },
  { id: 'cat-study', name: 'Study Materials', icon: '📝', tag: 'notebook' },
  { id: 'cat-household', name: 'Household Items', icon: '🏺', tag: 'kitchenware' },
  { id: 'cat-cameras', name: 'Cameras', icon: '📷', tag: 'dslrcamera' },
  { id: 'cat-kitchen', name: 'Kitchen Appliances', icon: '🍳', tag: 'kitchenappliance' },
  { id: 'cat-garden', name: 'Gardening Equipment', icon: '🌱', tag: 'gardentools' },
  { id: 'cat-computers', name: 'Computers & Accessories', icon: '💻', tag: 'laptopcomputer' },
  { id: 'cat-fitness', name: 'Fitness Equipment', icon: '🏋️', tag: 'dumbbell' },
  { id: 'cat-education', name: 'Educational Equipment', icon: '🎓', tag: 'microscope' },
  { id: 'cat-office', name: 'Office Equipment', icon: '🖇️', tag: 'officeprinter' },
]

export const SHARING_TYPES = ['Rent Only', 'Buy Only', 'Rent or Buy']

export const CONDITIONS = ['New', 'Like New', 'Good', 'Fair']

export const AVAILABILITY_OPTIONS = ['Available', 'Unavailable']

// Named localities within each town/city — not just the city name — so
// two resources in the same city don't collapse to the same point and
// show as "0 km" apart. Coordinates are the city center offset by a
// small, realistic amount per named area; exact enough for a campus
// project demo, not survey-grade GPS.
export const LOCATIONS = [
  'Kovilpatti - Illuppaiyurani', 'Kovilpatti - South Pudhugramam', 'Kovilpatti - Town',
  'Tirunelveli - Palayamkottai', 'Tirunelveli - Melapalayam', 'Tirunelveli - Junction',
  'Madurai - Anna Nagar', 'Madurai - Tallakulam', 'Madurai - Simmakkal',
  'Thoothukudi - Bryant Nagar', 'Thoothukudi - Millerpuram', 'Thoothukudi - Port Area',
  'Virudhunagar - Town', 'Virudhunagar - Rajapalayam Road', 'Virudhunagar - Sivakasi Road',
  'Coimbatore - RS Puram', 'Coimbatore - Gandhipuram', 'Coimbatore - Peelamedu',
  'Trichy - Srirangam', 'Trichy - Cantonment', 'Trichy - Thillai Nagar',
  'Salem - Fairlands', 'Salem - Hasthampatti', 'Salem - Suramangalam',
  'Anna Nagar', 'Velachery', 'Tambaram', 'Porur', 'T Nagar',
]

// Real coordinates for every location above, used for actual distance
// (Haversine) calculations in location-based search — not just matching
// location names as strings.
export const LOCATION_COORDS = {
  'Kovilpatti - Illuppaiyurani': { lat: 9.1520, lng: 77.8790 },
  'Kovilpatti - South Pudhugramam': { lat: 9.1590, lng: 77.8510 },
  'Kovilpatti - Town': { lat: 9.1671, lng: 77.8631 },

  'Tirunelveli - Palayamkottai': { lat: 8.7050, lng: 77.7280 },
  'Tirunelveli - Melapalayam': { lat: 8.7280, lng: 77.7420 },
  'Tirunelveli - Junction': { lat: 8.7139, lng: 77.7567 },

  'Madurai - Anna Nagar': { lat: 9.9430, lng: 78.1080 },
  'Madurai - Tallakulam': { lat: 9.9330, lng: 78.1250 },
  'Madurai - Simmakkal': { lat: 9.9195, lng: 78.1195 },

  'Thoothukudi - Bryant Nagar': { lat: 8.7830, lng: 78.1420 },
  'Thoothukudi - Millerpuram': { lat: 8.7550, lng: 78.1220 },
  'Thoothukudi - Port Area': { lat: 8.7480, lng: 78.1650 },

  'Virudhunagar - Town': { lat: 9.5851, lng: 77.9624 },
  'Virudhunagar - Rajapalayam Road': { lat: 9.5650, lng: 77.9400 },
  'Virudhunagar - Sivakasi Road': { lat: 9.6050, lng: 77.9850 },

  'Coimbatore - RS Puram': { lat: 11.0060, lng: 76.9450 },
  'Coimbatore - Gandhipuram': { lat: 11.0180, lng: 76.9670 },
  'Coimbatore - Peelamedu': { lat: 11.0290, lng: 77.0080 },

  'Trichy - Srirangam': { lat: 10.8600, lng: 78.6900 },
  'Trichy - Cantonment': { lat: 10.8050, lng: 78.6870 },
  'Trichy - Thillai Nagar': { lat: 10.8080, lng: 78.6890 },

  'Salem - Fairlands': { lat: 11.6720, lng: 78.1520 },
  'Salem - Hasthampatti': { lat: 11.6780, lng: 78.1400 },
  'Salem - Suramangalam': { lat: 11.6900, lng: 78.1050 },

  'Anna Nagar': { lat: 13.0850, lng: 80.2101 },
  'Velachery': { lat: 12.9756, lng: 80.2207 },
  'Tambaram': { lat: 12.9249, lng: 80.1000 },
  'Porur': { lat: 13.0381, lng: 80.1564 },
  'T Nagar': { lat: 13.0418, lng: 80.2341 },
}

// Radius options for location-based search.
export const SEARCH_RADIUS_OPTIONS = [5, 10, 20, 30]

// Cosmetic catalog owners for the seed marketplace listings. These are
// NOT login-capable accounts — they exist only so Explore has a realistic
// mix of listers before any real person has registered. Real accounts
// (created through Register) are stored separately in ss_registered_users
// / ss_registered_admins and are the only ones that can log in or show up
// in Admin > Manage Users.
export const INITIAL_USERS = [
  {
    id: 'user-karthik',
    name: 'Karthik Raman',
    email: 'karthik.raman@shelfshare.com',
    password: 'Karthik@123',
    phone: '+91 98401 23456',
    address: 'Anna Nagar, Chennai',
    role: 'user',
    joined: '2025-11-10',
    status: 'Active',
    rating: 4.9,
    referralCode: 'KAR8492',
    referredBy: null,
  },
  {
    id: 'user-priya',
    name: 'Priya Sundaram',
    email: 'priya.sundaram@shelfshare.com',
    password: 'Priya@123',
    phone: '+91 98402 34567',
    address: 'T. Nagar, Chennai',
    role: 'user',
    joined: '2025-12-05',
    status: 'Active',
    rating: 4.8,
    referralCode: 'PRI5912',
    referredBy: 'KAR8492',
  },
  {
    id: 'user-arun',
    name: 'Arun Prakash',
    email: 'arun.prakash@shelfshare.com',
    password: 'Arun@123',
    phone: '+91 98403 45678',
    address: 'Velachery, Chennai',
    role: 'user',
    joined: '2026-01-14',
    status: 'Active',
    rating: 4.7,
    referralCode: 'ARU9104',
    referredBy: 'PRI5912',
  },
  {
    id: 'user-divya',
    name: 'Divya Natarajan',
    email: 'divya.natarajan@shelfshare.com',
    password: 'Divya@123',
    phone: '+91 98404 56789',
    address: 'Adyar, Chennai',
    role: 'user',
    joined: '2026-02-01',
    status: 'Active',
    rating: 4.9,
    referralCode: 'DIV3381',
    referredBy: null,
  },
  {
    id: 'user-vignesh',
    name: 'Vignesh Kumar',
    email: 'vignesh.kumar@shelfshare.com',
    password: 'Vignesh@123',
    phone: '+91 98405 67890',
    address: 'OMR, Chennai',
    role: 'user',
    joined: '2026-02-18',
    status: 'Active',
    rating: 4.6,
    referralCode: 'VIG7729',
    referredBy: 'ARU9104',
  },
  {
    id: 'user-ganga',
    name: 'Ganga Devi',
    email: 'gangadevip06@gmail.com',
    password: 'Ganga@123',
    phone: '+91 98406 78901',
    address: 'Chennai, Tamil Nadu',
    role: 'user',
    joined: '2026-03-01',
    status: 'Active',
    rating: 5.0,
    referralCode: 'GAN9001',
    referredBy: null,
  },
]

export const SEED_OWNERS = [
  { id: 'user-karthik', name: 'Karthik Raman', email: 'karthik.raman@shelfshare.com' },
  { id: 'user-priya', name: 'Priya Sundaram', email: 'priya.sundaram@shelfshare.com' },
  { id: 'user-arun', name: 'Arun Prakash', email: 'arun.prakash@shelfshare.com' },
  { id: 'user-divya', name: 'Divya Natarajan', email: 'divya.natarajan@shelfshare.com' },
  { id: 'user-vignesh', name: 'Vignesh Kumar', email: 'vignesh.kumar@shelfshare.com' },
]

// A locally-generated placeholder card (category icon + product title) for
// every seed catalog item. No external image service is used here: after
// repeated mismatches from third-party "photo by tag" services (wrong
// subject, or the same photo repeating across unrelated items), a
// generated card is the only option that's guaranteed to be accurate for
// every single title, unique per item, and has zero network dependency
// (so it never fails to load either). Resources a real user adds through
// Add Resource always use their own uploaded photo instead — this only
// affects the seed catalog.
const CARD_PALETTE = [
  ['#2f6b4f', '#eaf3ee'], ['#204a37', '#e2efe7'], ['#c8842a', '#fbeed9'],
  ['#8a5a2b', '#f3e6d6'], ['#3d6b8a', '#e2eef5'], ['#6b4a8a', '#ece3f3'],
  ['#8a3d4a', '#f5e2e6'], ['#4a7a5a', '#e6f2ea'],
]

function hashString(str) {
  let hash = 0
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0
  }
  return hash
}

function escapeXml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function wrapTitle(title, maxCharsPerLine = 20) {
  const words = title.split(' ')
  const lines = []
  let current = ''
  words.forEach((word) => {
    const candidate = current ? `${current} ${word}` : word
    if (candidate.length > maxCharsPerLine && current) {
      lines.push(current)
    } else {
      current = candidate
    }
  })
  if (current) lines.push(current)
  return lines.slice(0, 3)
}

function placeholderImage(title, icon) {
  const hash = hashString(title)
  const [bg, fg] = CARD_PALETTE[hash % CARD_PALETTE.length]
  const lines = wrapTitle(title)
  const startY = 250 - (lines.length - 1) * 13
  const textEls = lines
    .map((line, i) => `<text x="240" y="${startY + i * 26}" font-size="21" font-family="Georgia, 'Times New Roman', serif" font-weight="700" fill="${fg}" text-anchor="middle">${escapeXml(line)}</text>`)
    .join('')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360" viewBox="0 0 480 360">
    <rect width="480" height="360" fill="${bg}"/>
    <circle cx="240" cy="135" r="72" fill="${fg}" opacity="0.55"/>
    <text x="240" y="160" font-size="68" text-anchor="middle">${icon}</text>
    ${textEls}
  </svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

// Bump this whenever the resource/request data shape changes. api.js checks
// this against what's saved in localStorage and wipes + reseeds catalog data
// automatically, so people who ran an earlier version of the app never see
// stale fields (old sharing types, missing prices, mismatched photos, etc).
export const DATA_VERSION = 'v9-title-matched-images-multichannel-theme'

// [title, description] pairs per category, seven each.
const ITEM_TEMPLATES = {
  Books: [
    ['Data Structures & Algorithms (Cormen)', 'Classic CLRS textbook, third edition. Great for DSA prep, minimal highlighting inside.'],
    ['Engineering Mathematics Vol. 2', 'Covers differential equations and linear algebra, used for one semester.'],
    ['Operating System Concepts (Silberschatz)', 'Standard OS reference used in most CS curriculums, good binding.'],
    ['Atomic Habits by James Clear', 'Paperback, lightly read, no markings.'],
    ['GATE CS Previous Year Papers', 'Compiled solved question bank for GATE Computer Science aspirants.'],
    ['The Alchemist by Paulo Coelho', 'Popular fiction paperback, great condition.'],
    ['Competitive Programming Handbook', 'Covers algorithms and problem-solving patterns with code samples.'],
    ['Introduction to Algorithms Study Guide', 'Condensed guide with solved examples, good for quick revision.'],
    ['Object Oriented Programming with Java', 'Covers OOP concepts with Java code examples, semester textbook.'],
    ['Machine Learning Basics (Paperback)', 'Beginner-friendly ML book covering core concepts and simple examples.'],
  ],
  Electronics: [
    ['Bluetooth Headphones - Boat Rockerz', 'Over-ear headphones, battery holds ~10 hrs, comes with charging cable.'],
    ['Portable Bluetooth Speaker - JBL Go', 'Compact speaker, water resistant, good bass for the size.'],
    ['Smartwatch - Noise ColorFit', 'Fitness tracking smartwatch with heart rate monitor.'],
    ['Power Bank 20000mAh', 'Fast charging power bank, two USB ports.'],
    ['Wireless Mouse - Logitech M235', 'Ergonomic wireless mouse, includes USB receiver.'],
    ['LED Desk Lamp with USB Charging', 'Adjustable brightness desk lamp, built-in USB port.'],
    ['Instant Pocket Printer', 'Bluetooth photo printer, prints from phone gallery directly.'],
    ['Smart Plug (Wi-Fi)', 'App-controlled smart plug, works with voice assistants.'],
    ['USB-C Hub (7-in-1)', 'Multiport adapter with HDMI, USB 3.0 and SD card slots.'],
    ['Noise Cancelling Earbuds', 'True wireless earbuds with active noise cancellation, case included.'],
  ],
  Furniture: [
    ['Study Table with Drawer', 'Compact wooden study table, ideal for hostel rooms. Minor scratches on top.'],
    ['Foldable Study Chair', 'Lightweight folding chair, easy to store, sturdy frame.'],
    ['Bookshelf - 4 Tier', 'Wooden bookshelf, holds around 60 books comfortably.'],
    ['Single Bed Mattress (Foam)', 'Medium firm foam mattress, single size, clean and aired regularly.'],
    ['Plastic Storage Cabinet', 'Multi-drawer storage cabinet, great for hostel or PG rooms.'],
    ['Wall Mirror with Frame', 'Medium sized wooden-framed wall mirror, no cracks.'],
    ['Bean Bag Chair - Large', 'Comfortable bean bag, filling topped up recently.'],
    ['Shoe Rack - 3 Tier', 'Compact shoe rack, holds up to 12 pairs.'],
    ['Room Divider / Partition', 'Foldable wooden partition, useful for shared rooms.'],
    ['Side Table with Storage', 'Small bedside table with a drawer and open shelf.'],
  ],
  Tools: [
    ['Cordless Drill Machine', 'Bosch cordless drill, includes bits and charger. Used for a couple of home projects.'],
    ['Tool Kit Set (45 pcs)', 'General purpose home tool kit with screwdrivers, pliers, wrench set.'],
    ['Electric Hedge Trimmer', 'Compact hedge trimmer, works well for small gardens.'],
    ['Measuring Tape 5m', 'Standard retractable measuring tape, locking mechanism intact.'],
    ['Hammer & Nail Set', 'Claw hammer with an assorted box of nails and hooks.'],
    ['Paint Roller Kit', 'Roller frame, tray and two roller covers, lightly used.'],
    ['Electric Screwdriver Set', 'Rechargeable screwdriver with multiple bit attachments.'],
    ['Spirit Level (2 ft)', 'Aluminium spirit level with three vials, accurate readings.'],
    ['Angle Grinder', 'Corded angle grinder with a spare cutting disc.'],
    ['Socket Wrench Set', '40-piece socket set with ratchet handle and extension bars.'],
  ],
  'Sports Equipment': [
    ['Badminton Racket Set (2)', 'Yonex racket pair with 3 shuttles. Light use, strings intact.'],
    ['Cricket Kit - Full Set', 'Bat, pads, gloves and helmet included, good for weekend matches.'],
    ['Football - Size 5', 'Nivia match football, properly inflated, minimal wear.'],
    ['Yoga Mat (6mm)', 'Non-slip yoga mat, cleaned after every use.'],
    ['Table Tennis Set', 'Two paddles, net, and three balls, foldable net clamp.'],
    ['Skipping Rope (Adjustable)', 'Speed rope with ball-bearing handles, adjustable length.'],
    ['Basketball - Size 7', 'Spalding basketball, good grip, indoor/outdoor use.'],
    ['Chess Set (Magnetic Travel)', 'Foldable magnetic chess board, pieces included.'],
    ['Dumbbell Pair - 5kg', 'Rubber coated dumbbells, good for home workouts.'],
    ['Carrom Board (Standard)', 'Full size carrom board with coins, striker and powder.'],
  ],
  'Musical Instruments': [
    ['Acoustic Guitar - Yamaha F310', 'Well maintained acoustic guitar, comes with a soft case. Perfect for beginners.'],
    ['Digital Keyboard - Casio CTK', '61-key keyboard with stand, great for practice sessions.'],
    ['Cajon Box Drum', 'Handmade cajon with adjustable snare wires, good tone.'],
    ['Ukulele - Soprano Size', 'Beginner friendly ukulele, comes with a gig bag.'],
    ['Harmonica - 10 Hole', 'Diatonic harmonica in the key of C, cleaned before every rental.'],
    ['Violin - 4/4 Size', 'Student violin with bow and rosin, recently restrung.'],
    ['Electronic Metronome & Tuner', 'Clip-on tuner and metronome combo for practice.'],
    ['Bongo Drums (Pair)', 'Wooden bongo set, good tone, comes with a carry bag.'],
    ['Flute - Student Model', 'C key student flute, recently serviced.'],
    ['Guitar Capo & Picks Set', 'Trigger capo with an assorted pack of picks.'],
  ],
  'Study Materials': [
    ['Scientific Calculator - Casio fx-991ES', 'Engineering calculator in working condition, all functions tested.'],
    ['Drafting Kit for Engineering Drawing', 'Complete drafter set with compass, scales and set squares.'],
    ['GATE Coaching Notes (Handwritten)', 'Well organized handwritten notes covering core subjects.'],
    ['Graph Notebooks (Pack of 5)', 'Unused graph ruled notebooks for lab and drawing work.'],
    ['Laptop Stand (Adjustable)', 'Foldable aluminium laptop stand for study desks.'],
    ['Whiteboard with Marker Set', 'Small magnetic whiteboard, comes with two markers and duster.'],
    ['Reference Lab Manual Set', 'Semester lab manuals covering common engineering practicals.'],
    ['Highlighters & Sticky Notes Combo', 'Study essentials bundle, barely used.'],
    ['Desk Organizer Tray', 'Multi-compartment tray for pens, clips and stationery.'],
    ['Study Timer (Pomodoro)', 'Digital timer for focused study sessions.'],
  ],
  'Household Items': [
    ['Microwave Oven - 20L', 'IFB solo microwave, works perfectly, moving out sale.'],
    ['Electric Iron Box', 'Steam iron box, non-stick sole plate, works fine.'],
    ['Study Lamp with Clip', 'Clip-on desk lamp, adjustable neck, warm white light.'],
    ['Vacuum Flask 1L', 'Keeps water hot/cold for hours, no leaks.'],
    ['Ceiling Fan (Portable Stand)', 'Pedestal fan, strong airflow, three speed settings.'],
    ['Curtains Set (2 Panels)', 'Blackout curtains, machine washable, standard window size.'],
    ['Water Purifier - Gravity Based', 'Non-electric gravity water purifier, filters replaced recently.'],
    ['Clothes Drying Rack', 'Foldable stainless steel drying rack, space saving.'],
    ['Table Lamp - Ceramic Base', 'Warm light table lamp, good for reading corners.'],
    ['Storage Boxes (Set of 3)', 'Stackable plastic storage boxes with lids.'],
  ],
  Cameras: [
    ['DSLR Camera - Canon 1500D', 'Entry level DSLR with 18-55mm kit lens, shutter count low.'],
    ['GoPro Hero Action Camera', 'Comes with mounting kit and waterproof case.'],
    ['Tripod Stand (Adjustable)', 'Lightweight aluminium tripod, works with phones and cameras.'],
    ['Ring Light with Phone Holder', '10-inch ring light for video calls and content shoots.'],
    ['Instant Camera - Fujifilm Instax', 'Instant print camera, comes with a pack of film.'],
    ['Camera Backpack Bag', 'Padded compartments, fits a DSLR with two lenses.'],
    ['External Flash Unit', 'Speedlite flash, compatible with most DSLR mounts.'],
    ['Camera Lens - 50mm Prime', 'Sharp prime lens, great for portraits.'],
    ['Memory Card 64GB (Class 10)', 'High speed SD card, tested for read/write errors.'],
    ['Underwater Camera Housing', 'Waterproof case rated to 30m, fits most compact cameras.'],
  ],
  'Kitchen Appliances': [
    ['Mixer Grinder - 3 Jars', 'Standard mixer grinder, all jars included, motor runs smoothly.'],
    ['Electric Kettle 1.5L', 'Auto shut-off kettle, descaled regularly.'],
    ['Sandwich Maker', 'Non-stick plates, quick heat-up, easy to clean.'],
    ['Induction Cooktop', 'Single burner induction stove with multiple power settings.'],
    ['Rice Cooker 1.8L', 'Keep-warm function works well, non-stick bowl.'],
    ['Hand Blender Set', 'Includes whisk and chopper attachments.'],
    ['Air Fryer 4L', 'Digital air fryer, basket non-stick coating intact.'],
    ['Toaster - 2 Slice', 'Pop-up toaster with browning control.'],
    ['Juicer Mixer Grinder', 'Heavy duty motor, comes with juicer attachment.'],
    ['Electric Tandoor (Mini)', 'Countertop tandoor for rotis and snacks.'],
  ],
  'Gardening Equipment': [
    ['Manual Lawn Mower', 'Push-reel mower, no fuel needed, blades sharpened recently.'],
    ['Garden Hose 15m with Nozzle', 'Flexible hose, adjustable spray nozzle included.'],
    ['Pruning Shears Set', 'Sharp bypass pruners, comfortable grip handles.'],
    ['Watering Can 5L', 'Plastic watering can with removable rose head.'],
    ['Gardening Tool Set (5 pcs)', 'Trowel, fork, cultivator and hand rake with a carry bag.'],
    ['Terracotta Planters (Set of 3)', 'Assorted sizes, good drainage holes.'],
    ['Wheelbarrow - Compact', 'Small wheelbarrow, useful for potting soil and debris.'],
    ['Grass Trimmer (Electric)', 'Lightweight edge trimmer for lawn borders.'],
    ['Compost Bin (Small)', 'Ventilated compost bin for kitchen and garden waste.'],
    ['Garden Rake', 'Sturdy metal rake, good for leaves and soil leveling.'],
  ],
  'Computers & Accessories': [
    ['Laptop - Dell Inspiron i5', '8GB RAM, 256GB SSD, battery backup around 4 hours.'],
    ['Mechanical Keyboard - RGB', 'Blue switches, detachable USB-C cable.'],
    ['27-inch Monitor - Full HD', 'IPS panel monitor with HDMI and VGA ports.'],
    ['Webcam 1080p', 'Autofocus webcam with built-in microphone.'],
    ['External Hard Drive 1TB', 'USB 3.0 portable drive, tested working, no bad sectors.'],
    ['Graphics Tablet - Small', 'Drawing tablet with pressure-sensitive pen, good for digital art.'],
    ['Wi-Fi Router - Dual Band', 'AC1200 router, resets cleanly, all ports functional.'],
    ['Portable SSD 512GB', 'Fast USB-C SSD, great for video editing on the go.'],
    ['Laptop Cooling Pad', 'Dual fan cooling pad with adjustable height.'],
    ['USB Microphone (Condenser)', 'Plug-and-play mic, good for calls and recording.'],
  ],
  'Fitness Equipment': [
    ['Adjustable Dumbbell Set', 'Pair of dumbbells with plates, adjustable from 5-25kg total.'],
    ['Resistance Bands Set', 'Five bands of varying resistance with door anchor.'],
    ['Yoga Block & Strap Set', 'Foam blocks and a cotton strap for stretching.'],
    ['Foldable Treadmill', 'Manual incline treadmill, foldable for storage.'],
    ['Skipping Rope + Ab Roller', 'Combo set for home cardio and core workouts.'],
    ['Pull-up Bar (Doorway)', 'No-drill doorway pull-up bar, adjustable width.'],
    ['Exercise Cycle - Stationary', 'Basic stationary cycle with adjustable resistance.'],
    ['Kettlebell - 8kg', 'Cast iron kettlebell, good grip coating.'],
    ['Ab Wheel Roller', 'Dual wheel ab roller with knee mat.'],
    ['Jump Rope with Counter', 'Digital counter jump rope for cardio sessions.'],
  ],
  'Educational Equipment': [
    ['Microscope - Student Grade', 'Compound microscope with multiple magnification levels.'],
    ['Globe - Educational (12 inch)', 'Rotating globe with clearly labelled countries.'],
    ['Chemistry Lab Kit (Basic)', 'Beakers, test tubes and a stand for basic experiments.'],
    ['Robotics Starter Kit', 'Arduino-based kit with sensors and motors for beginners.'],
    ['3D Human Anatomy Model', 'Detachable torso model used for biology study.'],
    ['Projector - Mini LED', 'Portable projector, HDMI and USB input, good for study groups.'],
    ['Periodic Table Wall Chart Set', 'Laminated chart set covering chemistry fundamentals.'],
    ['Physics Lab Kit (Optics)', 'Lenses, prisms and mirror set for optics experiments.'],
    ['Anatomical Skeleton Model (Mini)', 'Desktop-size skeleton model for biology study.'],
    ['Electronics Breadboard Kit', 'Breadboard with jumper wires, LEDs and resistors for basic circuits.'],
  ],
  'Office Equipment': [
    ['All-in-One Printer', 'Print, scan and copy, works with both USB and Wi-Fi.'],
    ['Paper Shredder - Home Office', 'Cross-cut shredder, handles up to 8 sheets at a time.'],
    ['Office Chair - Ergonomic', 'Adjustable height chair with lumbar support.'],
    ['Whiteboard - Large (4x3 ft)', 'Wall-mounted whiteboard with tray, minor surface marks.'],
    ['Laminator Machine A4', 'Hot laminator, works with standard A4 pouches.'],
    ['Filing Cabinet - 2 Drawer', 'Metal filing cabinet with lock, key included.'],
    ['Video Conferencing Speakerphone', 'USB conferencing speaker with echo cancellation.'],
    ['Desk Calendar & Planner', 'Yearly planner with a stand, barely used.'],
    ['Document Scanner (Portable)', 'Compact sheet-fed scanner, USB powered.'],
    ['Stapler & Punch Combo', 'Heavy duty stapler and hole punch set for office use.'],
  ],
}

const CATEGORY_PRICING = {
  Books: { rent: 12, sale: 260 },
  Electronics: { rent: 40, sale: 3200 },
  Furniture: { rent: 70, sale: 3800 },
  Tools: { rent: 50, sale: 1800 },
  'Sports Equipment': { rent: 40, sale: 1200 },
  'Musical Instruments': { rent: 150, sale: 8000 },
  'Study Materials': { rent: 15, sale: 320 },
  'Household Items': { rent: 60, sale: 2000 },
  Cameras: { rent: 300, sale: 15000 },
  'Kitchen Appliances': { rent: 70, sale: 2500 },
  'Gardening Equipment': { rent: 30, sale: 900 },
  'Computers & Accessories': { rent: 200, sale: 20000 },
  'Fitness Equipment': { rent: 60, sale: 3000 },
  'Educational Equipment': { rent: 25, sale: 1200 },
  'Office Equipment': { rent: 35, sale: 1500 },
}

function buildResources() {
  const resources = []
  let counter = 1
  CATEGORIES.forEach((cat, ci) => {
    const items = ITEM_TEMPLATES[cat.name] || []
    const pricing = CATEGORY_PRICING[cat.name] || { rent: 30, sale: 1000 }
    items.forEach(([title, description], ii) => {
      const idx = ci * items.length + ii
      const owner = SEED_OWNERS[idx % SEED_OWNERS.length]
      const location = LOCATIONS[idx % LOCATIONS.length]
      const sharingType = SHARING_TYPES[idx % 3]
      const condition = CONDITIONS[ii % CONDITIONS.length]
      const multiplier = 1 + (ii * 0.12)
      const rentalPrice = sharingType === 'Buy Only' ? 0 : Math.round(pricing.rent * multiplier)
      const salePrice = sharingType === 'Rent Only' ? 0 : Math.round(pricing.sale * multiplier)
      const deposit = sharingType === 'Buy Only' ? 0 : Math.round((salePrice || pricing.sale) * 0.12)
      const availability = idx % 9 === 0 ? 'Unavailable' : 'Available'
      const rating = +(3.8 + ((idx * 37) % 12) / 10).toFixed(1)

      resources.push({
        id: `res-${counter}`,
        title,
        description,
        category: cat.name,
        condition,
        sharingType,
        rentalPrice,
        salePrice,
        deposit,
        availability,
        location,
        image: EXACT_PRODUCT_IMAGES[title] || placeholderImage(title, cat.icon),
        ownerId: owner.id,
        ownerName: owner.name,
        ownerEmail: owner.email || '',
        rating,
        reviews: [],
        status: 'Active',
        bookedRanges: [],
        createdAt: `2026-0${(counter % 6) + 3}-${String((counter % 27) + 1).padStart(2, '0')}`,
      })
      counter += 1
    })
  })
  return resources
}

export const GARDENING_EQUIPMENTS_RESOURCE = {
  id: 'res-gardening-equipments',
  title: 'gardening equipments',
  description: 'Complete gardening tools set including trowel, pruning shears, cultivator, and watering hose.',
  category: 'Gardening Equipment',
  condition: 'Good',
  sharingType: 'Rent Only',
  rentalPrice: 1500,
  salePrice: 0,
  deposit: 500,
  availability: 'Available',
  location: 'Chennai, Tamil Nadu',
  image: 'https://images.unsplash.com/photo-1617576683096-00fc8eecb3af?auto=format&fit=crop&w=600&q=80',
  ownerId: 'user-ganga',
  ownerName: 'Ganga Devi',
  ownerEmail: 'gangadevip06@gmail.com',
  rating: 5.0,
  reviews: [],
  status: 'Active',
  bookedRanges: [],
  createdAt: '2026-03-02',
}

export const INITIAL_RESOURCES = [GARDENING_EQUIPMENTS_RESOURCE, ...buildResources()]

export const INITIAL_REQUESTS = [
  {
    id: 'req-gardening-equipments-1',
    resourceId: 'res-gardening-equipments',
    resourceTitle: 'gardening equipments',
    category: 'Gardening Equipment',
    requesterId: 'user-anushiya',
    requesterName: 'Anushiya',
    ownerId: 'user-ganga',
    ownerName: 'Ganga Devi',
    ownerEmail: 'gangadevip06@gmail.com',
    requestType: 'Rent',
    rentalDuration: 1,
    startDate: '2026-10-03',
    endDate: '2026-10-04',
    isPreBooking: false,
    quantity: 1,
    amount: 1500,
    deposit: 500,
    totalAmount: 2000,
    pickupLocation: 'Chennai, Tamil Nadu',
    status: 'Approved',
    paymentStatus: 'Paid',
    paymentMethod: 'UPI',
    handoverStatus: 'Not Handed Over',
    requestedOn: '2026-10-03',
    statusHistory: [
      { key: 'Requested', at: '2026-10-03T10:00:00.000Z' },
      { key: 'Approved', at: '2026-10-03T10:30:00.000Z' },
    ],
  },
]
export const INITIAL_REPORTS = []
export const INITIAL_NOTIFICATIONS = []
export const INITIAL_MESSAGES = []

export const RENTAL_DURATIONS = [1, 3, 7, 14, 30]
