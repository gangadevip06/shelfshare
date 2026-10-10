// components/ContactModal.jsx
import React from 'react'
import { X, Phone, Mail, MessageSquare, Send, CheckCircle2, ExternalLink } from 'lucide-react'

export default function ContactModal({
  isOpen,
  onClose,
  recipientName,
  recipientPhone,
  recipientEmail,
  resourceTitle,
  onOpenInAppChat,
}) {
  if (!isOpen) return null

  const digitsOnly = (recipientPhone || '').replace(/\D/g, '')
  const waPhone = digitsOnly.length === 10 ? `91${digitsOnly}` : digitsOnly
  const callPhone = digitsOnly.length === 10 ? `+91${digitsOnly}` : (recipientPhone && recipientPhone.startsWith('+') ? recipientPhone : `+${digitsOnly}`)
  const displayPhone = recipientPhone || (digitsOnly ? `+91 ${digitsOnly}` : 'Phone not provided')

  const displayEmail = recipientEmail || `${(recipientName || 'owner').toLowerCase().replace(/\s+/g, '.')}@shelfshare.com`
  const defaultMessage = `Hello ${recipientName || 'there'}, I am contacting you regarding "${resourceTitle || 'your item'}" on ShelfShare.`

  const handleWhatsApp = () => {
    if (!waPhone) {
      alert('Owner phone number is not available.')
      return
    }
    const waUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(defaultMessage)}`
    window.open(waUrl, '_blank', 'noopener,noreferrer')
  }

  const handleCall = () => {
    if (!digitsOnly) {
      alert('Owner phone number is not available.')
      return
    }
    window.location.href = `tel:${callPhone}`
  }

  const handleEmail = () => {
    // Open Gmail web compose in a new tab (real Gmail inbox composition)
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(displayEmail)}&su=${encodeURIComponent(`ShelfShare: ${resourceTitle || 'Resource Inquiry'}`)}&body=${encodeURIComponent(defaultMessage)}`
    const win = window.open(gmailUrl, '_blank', 'noopener,noreferrer')
    if (!win) {
      window.location.href = `mailto:${displayEmail}?subject=${encodeURIComponent(`ShelfShare: ${resourceTitle || 'Resource Inquiry'}`)}&body=${encodeURIComponent(defaultMessage)}`
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 10000 }}>
      <div
        className="modal-box"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 440, borderRadius: 20, padding: 24 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
              Contact {recipientName || 'Owner'}
            </h3>
            <div style={{ fontSize: '0.8rem', color: 'var(--sage)', marginTop: 3 }}>
              Choose your preferred communication channel
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ padding: 6 }}>
            <X size={18} />
          </button>
        </div>

        {resourceTitle && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 10,
              background: 'var(--paper-subtle, #f1f5f9)',
              border: '1px solid var(--border)',
              marginBottom: 18,
              fontSize: '0.85rem',
            }}
          >
            <div style={{ fontSize: '0.74rem', color: 'var(--sage)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.5 }}>
              Regarding Listing
            </div>
            <div style={{ fontWeight: 600, color: 'var(--ink)', marginTop: 2 }}>
              {resourceTitle}
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gap: 12 }}>
          {/* WhatsApp Direct */}
          <button
            type="button"
            onClick={handleWhatsApp}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '12px 16px',
              borderRadius: 14,
              border: '1.5px solid #25D366',
              background: 'rgba(37, 211, 102, 0.08)',
              color: '#128C7E',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'transform 0.15s ease, background 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(37, 211, 102, 0.16)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(37, 211, 102, 0.08)')}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: '#25D366',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Send size={18} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '0.94rem', color: '#075E54' }}>
                WhatsApp Direct Message
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--sage)', marginTop: 2 }}>
                {displayPhone} · Instant chat on WhatsApp
              </div>
            </div>
            <ExternalLink size={16} color="#128C7E" />
          </button>

          {/* Direct Phone Call */}
          <button
            type="button"
            onClick={handleCall}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '12px 16px',
              borderRadius: 14,
              border: '1.5px solid #0284c7',
              background: 'rgba(2, 132, 199, 0.08)',
              color: '#0369a1',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'transform 0.15s ease, background 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(2, 132, 199, 0.16)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(2, 132, 199, 0.08)')}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: '#0284c7',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Phone size={18} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '0.94rem', color: '#0369a1' }}>
                Direct Phone Call
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--sage)', marginTop: 2 }}>
                {displayPhone} · Dial directly on mobile
              </div>
            </div>
            <Phone size={16} color="#0284c7" />
          </button>

          {/* Direct Email */}
          <button
            type="button"
            onClick={handleEmail}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '12px 16px',
              borderRadius: 14,
              border: '1.5px solid #ea580c',
              background: 'rgba(234, 88, 12, 0.08)',
              color: '#c2410c',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'transform 0.15s ease, background 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(234, 88, 12, 0.16)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(234, 88, 12, 0.08)')}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: '#ea580c',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Mail size={18} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: '0.94rem', color: '#c2410c' }}>
                Direct Email Inquiry
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--sage)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {displayEmail} · Open in Gmail
              </div>
            </div>
            <ExternalLink size={16} color="#ea580c" />
          </button>

          {/* In-App Chat */}
          {onOpenInAppChat && (
            <button
              type="button"
              onClick={() => {
                onClose()
                onOpenInAppChat()
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '12px 16px',
                borderRadius: 14,
                border: '1.5px solid var(--primary)',
                background: 'var(--primary-light)',
                color: 'var(--primary-dark)',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: 'var(--primary)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <MessageSquare size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '0.94rem', color: 'var(--primary-dark)' }}>
                  ShelfShare In-App Chat
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--sage)', marginTop: 2 }}>
                  Chat inside the platform with message history
                </div>
              </div>
              <MessageSquare size={16} color="var(--primary)" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
