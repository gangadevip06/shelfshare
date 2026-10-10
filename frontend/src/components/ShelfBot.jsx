// components/ShelfBot.jsx
import React, { useState, useRef, useEffect } from 'react'
import { Bot, X, Send, Sparkles, MessageCircle, RefreshCw, ChevronDown } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const KNOWLEDGE_BASE = [
  {
    category: 'registration',
    keywords: [
      'register', 'registration', 'sign up', 'signup', 'create account', 'how to register',
      'join', 'new user', 'பதிவு', 'கணக்கு உருவாக்க', 'பதிவு செய்வது எப்படி', 'sign-up'
    ],
    en: '📝 How to Register on ShelfShare:\n1. Click "Register" at top-right (or visit /register).\n2. Enter your Name, Email, Mobile number, Chennai locality (e.g. Anna Nagar, Velachery), and create a password.\n3. Alternatively, click "Sign in with Google" for instant 1-click registration!\n4. Once registered, your account is immediately verified with 100 Trust Score and an RFC 7519 JWT token is issued.',
    ta: '📝 ஷெல்ஃப்ஷேரில் பதிவு செய்வது எப்படி:\n1. மேல் வலதுபுறத்தில் உள்ள "Register" என்பதைக் கிளிக் செய்யவும் (அல்லது /register பக்கத்திற்குச் செல்லவும்).\n2. உங்கள் பெயர், மின்னஞ்சல், மொபைல் எண், சென்னை பகுதி (அண்ணா நகர், வேளச்சேரி போன்றவை) மற்றும் கடவுச்சொல்லை உள்ளிடவும்.\n3. அல்லது "Sign in with Google" மூலம் உடனடியாக 1-கிளிக்கில் பதிவு செய்யலாம்!\n4. பதிவு செய்தவுடன் உங்கள் கணக்கு உடனடியாக 100 நம்பிக்கை புள்ளிகளுடன் சரிபார்க்கப்பட்டு JWT டோக்கன் வழங்கப்படும்.'
  },
  {
    category: 'login',
    keywords: [
      'login', 'log in', 'signin', 'sign in', 'authenticate', 'password', 'google login',
      'உள்நுழை', 'லாகின்', 'உள்நுழைவு', 'log-in'
    ],
    en: '🔐 How to Log In:\n1. Click "Log in" at top-right.\n2. Enter your registered email and password, or use "Sign in with Google" / "Sign in with GitHub".\n3. For campus/project demonstrations, use the "Quick Demo Login" bar to instantly switch between Karthik, Priya, Arun, Divya, Vignesh, or Admin.\n4. Every login generates an RFC 7519 JWT token verifiable in the JWT Inspector.',
    ta: '🔐 உள்நுழைவது எப்படி:\n1. மேல் வலதுபுறத்தில் "Log in" என்பதைத் தேர்ந்தெடுக்கவும்.\n2. உங்கள் பதிவு செய்த மின்னஞ்சல் மற்றும் கடவுச்சொல் மூலம் நுழையலாம், அல்லது "Sign in with Google" / GitHub பயன்படுத்தலாம்.\n3. டெமோ பரிசோதனைக்கு, "Quick Demo Login" பட்டியில் உள்ள கார்த்திக், பிரியா, அருண், திவ்யா, விக்னேஷ் அல்லது அட்மின் பொத்தானை 1-கிளிக்கில் பயன்படுத்தலாம்.\n4. உள்நுழைந்ததும் பாதுகாப்பு JWT டோக்கன் வழங்கப்படும்.'
  },
  {
    category: 'listing',
    keywords: [
      'list item', 'add item', 'add resource', 'sell', 'upload product', 'share item',
      'share resource', 'பொருள் சேர்க்க', 'பகிர', 'பட்டியலிட', 'விற்க', 'பொருள் பதிவு'
    ],
    en: '📦 How to List an Item for Rent or Sale:\n1. Log in and click "Add Resource" in the sidebar.\n2. Enter Title, Category (Books, Electronics, Tools, etc.), Description, and Condition.\n3. Choose sharing type: "Rent Only", "Buy Only", or "Rent or Buy".\n4. Set your rental rate (₹/day), sale price, and refundable security deposit.\n5. Upload an image or use our verified photo matcher. Your item goes live immediately on Explore!',
    ta: '📦 வாடகை அல்லது விற்பனைக்கு பொருள் சேர்க்கும் முறை:\n1. உள்நுழைந்து பக்கவாட்டு பட்டியில் "Add Resource" என்பதை கிளிக் செய்யவும்.\n2. தலைப்பு, வகை (புத்தகங்கள், எலக்ட்ரானிக்ஸ் போன்றவை), விளக்கம் மற்றும் நிலையை உள்ளிடவும்.\n3. பகிர்வு வகையை தேர்வு செய்யவும்: வாடகை மட்டும், விற்பனை மட்டும், அல்லது இரண்டும்.\n4. நாள் வாடகை (₹/நாள்), விற்பனை விலை, மற்றும் திரும்பப்பெறக்கூடிய முன்பணத்தை குறிப்பிடவும்.\n5. புகைப்படம் பதிவேற்றி சமர்ப்பிக்கவும். உடனடியாக பொருள் அனைவருக்கும் தெரியும்!'
  },
  {
    category: 'renting',
    keywords: [
      'how to rent', 'rent item', 'borrow', 'booking', 'take on rent', 'வாடகைக்கு எடுக்க',
      'வாடகை', 'பொருள் வாடகை', 'எப்படி வாடகை'
    ],
    en: '🤝 How to Rent an Item:\n1. Open "Explore" and find the item you need.\n2. Click the item to view details, location, and owner trust score.\n3. Choose your Start Date & Duration (1, 3, 7, 14, 30 days).\n4. Click "Rent This" to send a request to the owner.\n5. Once the owner approves, pay online (UPI/GPay/Card) or Cash on Handover.\n6. Verify the 6-digit Handover Code at pickup, enjoy the item, and mark returned when done!',
    ta: '🤝 பொருள் வாடகைக்கு எடுக்கும் முறை:\n1. "Explore" பக்கத்தில் தேவையான பொருளை தேடவும்.\n2. பொருளை கிளிக் செய்து விவரங்கள் மற்றும் உரிமையாளரின் மதிப்பீட்டைப் பார்க்கவும்.\n3. தொடக்க தேதி மற்றும் கால அளவை (1, 3, 7, 14, 30 நாட்கள்) தேர்வு செய்யவும்.\n4. "Rent This" கிளிக் செய்து கோரிக்கை அனுப்பவும்.\n5. உரிமையாளர் ஒப்புதல் அளித்ததும் UPI/GPay மூலம் கட்டணம் செலுத்தலாம்.\n6. பொருளைப் பெறும்போது 6-இலக்க ஒப்படைப்பு குறியீட்டை உறுதிசெய்து பயன்படுத்தலாம்!'
  },
  {
    category: 'extension',
    keywords: [
      'extend', 'extension', 'priority', 'நீட்டிப்பு', 'முன்னுரிமை', 'renew', 'extra day',
      'more days', 'extend rental', 'கால நீட்டிப்பு'
    ],
    en: '⏱️ Active Renter Extension Priority:\n• If you are currently renting an item and need it longer, open Request Details and click "Request Rental Extension".\n• Choose additional days (1, 3, 7, 14 days). The prorated extension fee is calculated automatically.\n• When the owner APPROVES, your rental is extended and you pay the extra fee.\n• Conflict Bump: If another user pre-booked the same dates, their request is automatically cancelled/marked unavailable, and the owner dispatches an automated apology direct message explaining active renter priority.',
    ta: '⏱️ செயலில் உள்ள வாடகை நீட்டிப்பு முன்னுரிமை:\n• நீங்கள் வாடகைக்கு எடுத்திருக்கும் பொருளை மேலும் சில நாட்கள் பயன்படுத்த விரும்பினால், "Request Rental Extension" கிளிக் செய்யவும்.\n• கூடுதல் நாட்களை தேர்வு செய்யவும். கூடுதல் கட்டணம் தானாக கணக்கிடப்படும்.\n• உரிமையாளர் ஒப்புதல் அளித்ததும் காலம் நீட்டிக்கப்படும் மற்றும் கூடுதல் கட்டணம் செலுத்த வேண்டும்.\n• மற்றொரு பயனர் அதே தேதிகளில் முன்பதிவு செய்திருந்தால், அது தானாகவே ரத்து செய்யப்பட்டு, உரிமையாளரிடமிருந்து விளக்கச் செய்தி அனுப்பப்படும்.'
  },
  {
    category: 'prebooking',
    keywords: [
      'pre-book', 'prebook', 'advance', 'முன்பதிவு', 'future', 'calendar', 'unavailable',
      'lock dates', 'தேதி முடக்கம்', 'முன்கூட்டியே'
    ],
    en: '📅 Advance Pre-Booking & Availability Lock:\n• You can select any future start date from the date picker.\n• When an advance booking is approved, those dates are locked exclusively for you in the calendar.\n• Once booked, the item automatically shows as "Unavailable" to other users during your reserved dates, preventing conflicting double bookings!',
    ta: '📅 முன்கூட்டிய முன்பதிவு & கிடைக்கும் தன்மை:\n• காலெண்டரில் இருந்து எதிர்கால தொடக்க தேதியை தேர்வு செய்து முன்கூட்டியே முன்பதிவு செய்யலாம்.\n• உரிமையாளர் ஒப்புதல் அளித்ததும் அந்த தேதிகள் உங்களுக்கு பிரத்யேகமாக பூட்டப்படும்.\n• முன்பதிவு செய்யப்பட்ட காலத்தில் மற்ற பயனர்களுக்கு அந்த பொருள் "Unavailable" என்று காட்டப்பட்டு இரட்டை முன்பதிவு தடுக்கப்படும்!'
  },
  {
    category: 'return',
    keywords: [
      'return', 'return process', 'handover', 'deposit refund', 'inspection', 'damage',
      'condition', 'திரும்ப ஒப்படைக்க', 'முன்பணம் திரும்ப', 'சேதம்'
    ],
    en: '🔄 Product Return & Deposit Refund Process:\n1. Renter clicks "Mark as Returned" on their Request Details page.\n2. Owner inspects the item condition upon handover: Good, Minor damage, or Major damage.\n3. If returned in Good condition, the 100% security deposit is refunded automatically.\n4. If damage occurred, an agreed deduction is subtracted and the remaining balance is refunded to the renter.',
    ta: '🔄 பொருள் ஒப்படைப்பு & முன்பணம் திரும்பப் பெறுதல்:\n1. வாடகைதாரர் "Mark as Returned" என்பதைக் கிளிக் செய்வார்.\n2. உரிமையாளர் பொருளின் நிலையை ஆய்வு செய்து (நன்றாக உள்ளது / சிறிய சேதம் / பெரிய சேதம்) உறுதிசெய்வார்.\n3. பொருள் நல்ல நிலையில் இருந்தால், 100% முன்பணமும் உடனடியாக திரும்பத் தரப்படும்.\n4. சேதம் ஏற்பட்டிருந்தால், நியாயமான தொகை கழிக்கப்பட்டு மீதித் தொகை திருப்பித் தரப்படும்.'
  },
  {
    category: 'communication',
    keywords: [
      'contact', 'communication', 'whatsapp', 'email', 'call', 'phone', 'reach owner',
      'தொடர்பு', 'வாட்ஸ்அப்', 'அழைப்பு', 'மின்னஞ்சல்', 'message', 'chat'
    ],
    en: '📞 Multi-Channel Communication:\nShelfShare gives you 4 direct ways to connect with owners and buyers:\n1. 💬 WhatsApp: 1-click direct chat via official WhatsApp link.\n2. ✉️ Email: Pre-composed mailto with item details.\n3. 📱 Phone Call: Direct tel link to connect on mobile.\n4. 🗨️ In-App Chat: Real-time messaging within ShelfShare.',
    ta: '📞 பல வழி தொடர்பு முறைகள்:\nஷெல்ஃப்ஷேரில் நீங்கள் உரிமையாளரை 4 வழிகளில் தொடர்பு கொள்ளலாம்:\n1. 💬 வாட்ஸ்அப்: 1-கிளிக் நேரடி WhatsApp செய்தி.\n2. ✉️ மின்னஞ்சல்: பொருள் விவரங்களுடன் கூடிய நேரடி Email.\n3. 📱 தொலைபேசி அழைப்பு: நேரடி போன் கால் தொடர்பு.\n4. 🗨️ தளத்தின் நேரடி சாட்: ShelfShare உள்ளமைந்த மெசேஜிங்.'
  },
  {
    category: 'payment',
    keywords: [
      'payment', 'pay', 'upi', 'gpay', 'phonepe', 'card', 'cash on handover', 'கட்டணம்',
      'பணம் செலுத்த', 'கூகுள் பே'
    ],
    en: '💳 Payments & Security Deposits:\n• Supported methods: UPI (Google Pay, PhonePe, Paytm), Credit/Debit Cards, Net Banking, and Cash on Handover.\n• Rental fee and security deposit are clearly separated.\n• You can download or print official tax receipts anytime from /requests/:id/receipt.',
    ta: '💳 கட்டணம் & முன்பணம்:\n• ஏற்கும் முறைகள்: UPI (Google Pay, PhonePe, Paytm), கார்டுகள், மற்றும் நேரடி பணப் பரிமாற்றம்.\n• வாடகைக் கட்டணம் மற்றும் முன்பணம் தெளிவாக பிரிக்கப்பட்டு காட்டப்படும்.\n• ரசீதை /requests/:id/receipt பக்கத்தில் எப்போது வேண்டுமானாலும் பதிவிறக்கம் செய்யலாம்.'
  },
  {
    category: 'location',
    keywords: [
      'chennai', 'location', 'area', 'distance', 'velachery', 'anna nagar', 't nagar',
      'adyar', 'omr', 'mylapore', 'radius', 'சென்னை', 'இடம்', 'தூரம்'
    ],
    en: '📍 Chennai Localities & Distance Search:\n• Verified Chennai zones: Anna Nagar, T. Nagar, Velachery, Adyar, Mylapore, OMR, Porur, Tambaram, and more.\n• GPS & Radius Search: Use "Use my location" to find items within 5, 10, 20, or 30 km with accurate delivery time estimates!',
    ta: '📍 சென்னை பகுதிகள் & தூர அடிப்படையிலான தேடல்:\n• அண்ணா நகர், தி.நகர், வேளச்சேரி, அடையாறு, மயிலாப்பூர், OMR உள்ளிட்ட சென்னை பகுதிகளில் சேவை உள்ளது.\n• "Use my location" மூலம் உங்கள் இருப்பிடத்திலிருந்து 5, 10, 20 அல்லது 30 கி.மீ சுற்றளவில் உள்ள பொருட்களைக் கண்டறியலாம்!'
  },
  {
    category: 'themes',
    keywords: [
      'theme', 'dark mode', 'color', 'emerald', 'amber', 'ocean', 'obsidian',
      'வண்ணம்', 'தீம்', 'டார்க் மோட்'
    ],
    en: '🎨 ShelfShare Themes:\nChoose from 4 custom project color palettes via the header Preferences switcher:\n1. 🌿 Emerald Mint (Default eco-friendly sharing)\n2. 🌅 Sunset Amber (Warm artisan community)\n3. 🌊 Ocean Slate (Coastal and tech equipment)\n4. 🌑 Dark Obsidian (High-contrast night theme)',
    ta: '🎨 ஷெல்ஃப்ஷேர் வண்ண அமைப்புகள்:\nமேல் பட்டியில் உள்ள அமைப்புகள் மூலம் 4 வண்ண தீம்களை தேர்ந்தெடுக்கலாம்:\n1. 🌿 எமரால்டு மின்ட் (இயல்புநிலை பசுமை தீம்)\n2. 🌅 சன்செட் ஆம்பர் (வெதுவெதுப்பான மர வேலை தீம்)\n3. 🌊 பெருங்கடல் ஸ்லேட் (தொழில்நுட்ப தீம்)\n4. 🌑 டார்க் அப்சிடியன் (நவீன இருண்ட தீம்)'
  },
  {
    category: 'security',
    keywords: [
      'jwt', 'token', 'security', 'ஆத்தண்டிகேஷன்', 'டோக்கன்', 'bearer', 'auth',
      'rsa', 'hs256'
    ],
    en: '🛡️ JWT & OAuth Architecture:\n• ShelfShare signs tokens conforming to RFC 7519 (Header.Payload.Signature).\n• Tokens expire automatically and are verified with Bearer authorization on REST API calls.\n• Click "JWT Inspector" in the navigation bar to inspect your live token in real time!',
    ta: '🛡️ JWT & OAuth பாதுகாப்பு:\n• RFC 7519 தரநிலையின்படி JWT டோக்கன்கள் கையொப்பமிடப்படுகின்றன.\n• API அழைப்புகளுக்கு Bearer அங்கீகாரம் வழங்கப்படுகிறது.\n• மேல் பட்டியில் உள்ள "JWT Inspector" மூலம் உங்கள் நேரடி டோக்கனை நிகழ்நேரத்தில் பார்க்கலாம்!'
  },
  {
    category: 'api',
    keywords: [
      'api', 'docs', 'endpoints', 'swagger', 'developer', 'ஏபிஐ', 'rest'
    ],
    en: '🚀 Interactive API Explorer:\nVisit /api-docs to test all 11 REST API modules (Resources, Requests, Users, Notifications, Messages, etc.) live with your active JWT Bearer token!',
    ta: '🚀 ஊடாடும் API எக்ஸ்ப்ளோரர்:\n/api-docs பக்கத்திற்குச் சென்று உங்கள் நேரடி JWT டோக்கன் மூலம் 11 REST API தொகுதிகளையும் நேரடியாக இயக்கிப் பார்க்கலாம்!'
  }
]

const QUICK_PROMPTS = [
  { en: 'How to register in this system?', ta: 'கணக்கு பதிவு செய்வது எப்படி?' },
  { en: 'How does rental extension priority work?', ta: 'வாடகை நீட்டிப்பு முன்னுரிமை எப்படி?' },
  { en: 'How to pre-book items in advance?', ta: 'முன்பதிவு செய்வது எப்படி?' },
  { en: 'How to contact owner via WhatsApp or Call?', ta: 'வாட்ஸ்அப் அல்லது போன் மூலம் தொடர்பு?' },
  { en: 'What Chennai locations are available?', ta: 'சென்னையில் கிடைக்கும் பகுதிகள்?' },
  { en: 'How to test API & inspect JWT token?', ta: 'API மற்றும் JWT டோக்கன் சோதிப்பது எப்படி?' },
]

export default function ShelfBot() {
  const { language } = useLanguage()
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const isTamil = language === 'ta'

  const userName = user?.name ? String(user.name).split(' ')[0] : ''
  const initialGreeting = isTamil
    ? `வணக்கம்${userName ? ' ' + userName : ''}! நான் ShelfBot, உங்கள் AI உதவியாளர். கணக்கு பதிவு, வாடகை நீட்டிப்பு, முன்பதிவு, வாட்ஸ்அப் தொடர்பு, அல்லது சென்னை பொருட்கள் பற்றி என்னிடம் கேட்கலாம்.`
    : `Hello${userName ? ' ' + userName : ''}! I am ShelfBot, your AI concierge. Ask me anything about registration, rental extensions, pre-booking, WhatsApp/call contact, or items in Chennai.`

  const [messages, setMessages] = useState([
    { id: 1, sender: 'bot', text: initialGreeting, time: 'Just now' }
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const chatEndRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen])

  const findAnswer = (question) => {
    const qLower = question.toLowerCase().trim()

    // 1. Direct keyword match
    for (const item of KNOWLEDGE_BASE) {
      if (item.keywords.some((kw) => qLower.includes(kw.toLowerCase()))) {
        return isTamil ? item.ta : item.en
      }
    }

    // 2. Fuzzy token match (matching any word of length >= 4)
    const words = qLower.split(/[\s,?.!]+/).filter((w) => w.length >= 4)
    for (const item of KNOWLEDGE_BASE) {
      for (const word of words) {
        if (item.keywords.some((kw) => kw.toLowerCase().includes(word))) {
          return isTamil ? item.ta : item.en
        }
      }
    }

    // 3. Smart Categorized Fallback with Guided Options
    if (isTamil) {
      return `மன்னிக்கவும், உங்கள் குறிப்பிட்ட கேள்விக்கான சரியான தகவலை என்னால் நேரடியாகப் பொருத்த முடியவில்லை.\n\nநான் உதவக்கூடிய முக்கிய தலைப்புகள்:\n• 1. பதிவு & உள்நுழைவு ("எப்படி பதிவு செய்வது?")\n• 2. வாடகை & முன்பதிவு ("வாடகைக்கு எடுப்பது எப்படி?")\n• 3. வாடகை நீட்டிப்பு முன்னுரிமை ("கால நீட்டிப்பு")\n• 4. வாட்ஸ்அப்/போன் தொடர்பு ("தொடர்பு கொள்வது எப்படி?")\n• 5. கட்டணம் & முன்பணம் திரும்பப் பெறுதல்\n\nகீழே உள்ள விரைவு பொத்தான்களையும் கிளிக் செய்து தகவல்களைப் பெறலாம்!`
    }
    return `I couldn't pinpoint the exact match for that query, but here is what I can help you with:\n\n• 1. Registration & Login ("How to register?")\n• 2. Renting & Advance Pre-booking\n• 3. Rental Extension Priority & Conflict Bumping\n• 4. WhatsApp, Email & Phone Communication\n• 5. Security Deposits & Handover Returns\n• 6. Chennai Locations & Radius Search\n\nTry asking about any of these or click the quick suggestions below!`
  }

  const handleSend = (textToSend) => {
    const query = (textToSend || input).trim()
    if (!query) return

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    setTimeout(() => {
      const answer = findAnswer(query)
      const botMsg = {
        id: Date.now() + 1,
        sender: 'bot',
        text: answer,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      setMessages((prev) => [...prev, botMsg])
      setIsTyping(false)
    }, 450)
  }

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999 }}>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 18px',
            borderRadius: 50,
            background: 'linear-gradient(135deg, var(--primary) 0%, #047857 100%)',
            color: '#fff',
            border: 'none',
            boxShadow: '0 8px 24px rgba(5, 150, 105, 0.35)',
            cursor: 'pointer',
            fontSize: '0.92rem',
            fontWeight: 600,
            transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px) scale(1.03)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'none')}
        >
          <Bot size={20} />
          <span>ShelfBot AI</span>
          <span style={{
            fontSize: '0.68rem',
            background: 'rgba(255,255,255,0.25)',
            padding: '2px 8px',
            borderRadius: 20,
            fontWeight: 700
          }}>
            {isTamil ? 'தமிழ்' : 'AI'}
          </span>
        </button>
      )}

      {isOpen && (
        <div
          style={{
            width: 360,
            maxWidth: 'calc(100vw - 32px)',
            height: 520,
            maxHeight: 'calc(100vh - 80px)',
            background: 'var(--paper)',
            borderRadius: 16,
            boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
            border: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '14px 16px',
              background: 'linear-gradient(135deg, var(--primary) 0%, #047857 100%)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Bot size={20} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.98rem' }}>ShelfBot Concierge</div>
                <div style={{ fontSize: '0.72rem', opacity: 0.85, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80' }}></span>
                  {isTamil ? 'செயலில் உள்ளது · தமிழ் / English' : 'Online · Bilingual AI'}
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: 'none',
                borderRadius: '50%',
                width: 28,
                height: 28,
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Messages Container */}
          <div
            style={{
              flex: 1,
              padding: 14,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              background: 'var(--bg)',
            }}
          >
            {messages.map((m) => (
              <div
                key={m.id}
                style={{
                  alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                }}
              >
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: 14,
                    fontSize: '0.86rem',
                    lineHeight: 1.5,
                    whiteSpace: 'pre-line',
                    background: m.sender === 'user' ? 'var(--primary)' : 'var(--paper)',
                    color: m.sender === 'user' ? '#fff' : 'var(--ink)',
                    border: m.sender === 'bot' ? '1px solid var(--border)' : 'none',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                    borderBottomRightRadius: m.sender === 'user' ? 2 : 14,
                    borderBottomLeftRadius: m.sender === 'bot' ? 2 : 14,
                  }}
                >
                  {m.text}
                </div>
                <div
                  style={{
                    fontSize: '0.68rem',
                    color: 'var(--sage)',
                    marginTop: 3,
                    textAlign: m.sender === 'user' ? 'right' : 'left',
                    padding: '0 4px',
                  }}
                >
                  {m.time}
                </div>
              </div>
            ))}

            {isTyping && (
              <div style={{ alignSelf: 'flex-start', padding: '8px 12px', background: 'var(--paper)', borderRadius: 14, border: '1px solid var(--border)', fontSize: '0.8rem', color: 'var(--sage)' }}>
                ShelfBot is thinking...
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Suggestions Chips */}
          <div style={{ padding: '8px 12px', background: 'var(--paper)', borderTop: '1px solid var(--border)', overflowX: 'auto', display: 'flex', gap: 6 }}>
            {QUICK_PROMPTS.map((qp, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(isTamil ? qp.ta : qp.en)}
                style={{
                  fontSize: '0.74rem',
                  padding: '4px 10px',
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  color: 'var(--ink)',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                }}
              >
                {isTamil ? qp.ta : qp.en}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend() }}
            style={{
              padding: '10px 12px',
              background: 'var(--paper)',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              gap: 8,
              alignItems: 'center',
            }}
          >
            <input
              type="text"
              className="form-control"
              placeholder={isTamil ? 'கேள்வி கேட்கவும்...' : 'Ask ShelfBot anything...'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              style={{ fontSize: '0.86rem', padding: '8px 12px', borderRadius: 20 }}
            />
            <button
              type="submit"
              disabled={!input.trim()}
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: input.trim() ? 'var(--primary)' : 'var(--border)',
                color: '#fff',
                border: 'none',
                cursor: input.trim() ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
