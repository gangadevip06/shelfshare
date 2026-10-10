// components/ChatBox.jsx
// Renders a single conversation's message thread + input, used inside Messages page.
import React, { useState } from 'react'
import { MessageSquare, Send } from 'lucide-react'

function formatTime(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString(undefined, { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })
}

export default function ChatBox({ conversation, currentUserId, onSend, sending }) {
  const [text, setText] = useState('')

  const handleSend = () => {
    if (!text.trim()) return
    onSend(conversation, text)
    setText('')
  }

  if (!conversation) {
    return (
      <div className="empty-state" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div className="ic" style={{ marginBottom: 14 }}>
          <MessageSquare size={44} strokeWidth={1.5} color="var(--sage)" />
        </div>
        Select a conversation to start chatting.
      </div>
    )
  }

  return (
    <div className="chat-window">
      <div className="chat-header">
        <div className="avatar sm">{conversation.withName?.charAt(0)}</div>
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{conversation.withName}</div>
          <div style={{ fontSize: '0.76rem', color: 'var(--sage)' }}>Re: {conversation.resourceTitle}</div>
        </div>
      </div>
      <div className="chat-messages">
        {conversation.messages.length === 0 && (
          <div className="empty-state" style={{ padding: 20 }}>Say hello — ask about availability, pickup time, or anything else.</div>
        )}
        {conversation.messages.map((m) => (
          <div key={m.id} className={`msg-bubble ${m.senderId === currentUserId ? 'mine' : 'theirs'}`}>
            {m.text}
            <span className="msg-time">{formatTime(m.sentAt)}</span>
          </div>
        ))}
      </div>
      <div className="chat-input-row">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
        <button className="btn btn-primary" onClick={handleSend} disabled={sending}>
          <Send size={15} /> Send
        </button>
      </div>
    </div>
  )
}
