// pages/Messages.jsx
import React, { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import UserLayout from '../components/UserLayout.jsx'
import ChatBox from '../components/ChatBox.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { getConversationsFor, sendMessage, maybeSendAutoReply, getResources } from '../services/api.js'
import { Plus, X, Search } from 'lucide-react'

export default function Messages() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const [rawMessages, setRawMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeKey, setActiveKey] = useState(null)
  const [sending, setSending] = useState(false)
  const [showNewChat, setShowNewChat] = useState(false)
  const [allResources, setAllResources] = useState([])
  const [pickerSearch, setPickerSearch] = useState('')
  // A conversation the user opened (via the resource page's Chat button, or
  // the "+ New Message" picker) that doesn't have any messages sent yet.
  const [draftConvo, setDraftConvo] = useState(null)

  useEffect(() => {
    const resourceId = searchParams.get('resourceId') || 'general'
    const withId = searchParams.get('withId') || searchParams.get('to')
    const withName = searchParams.get('withName') || searchParams.get('toName') || 'User'
    const resourceTitle = searchParams.get('resourceTitle') || 'Item Inquiry'

    if (withId) {
      const convoKey = `${resourceId}__${withId}`
      setDraftConvo({
        key: convoKey,
        resourceId,
        resourceTitle,
        withId,
        withName,
      })
      setActiveKey(convoKey)
    }
  }, [searchParams])

  const load = async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const data = await getConversationsFor(user.id)
      setRawMessages(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [user?.id])

  // Group flat messages into per-(resource + other person) conversations.
  const conversations = useMemo(() => {
    const map = new Map()
    rawMessages.forEach((m) => {
      const otherId = m.senderId === user?.id ? m.receiverId : m.senderId
      const otherName = m.senderId === user?.id ? m.receiverName : m.senderName
      const key = `${m.resourceId}__${otherId}`
      if (!map.has(key)) {
        map.set(key, { key, resourceId: m.resourceId, resourceTitle: m.resourceTitle, withId: otherId, withName: otherName, messages: [] })
      }
      map.get(key).messages.push(m)
    })
    if (draftConvo && !map.has(draftConvo.key)) {
      map.set(draftConvo.key, { ...draftConvo, messages: [] })
    }
    return Array.from(map.values()).sort((a, b) => {
      const at = a.messages[a.messages.length - 1]?.sentAt || ''
      const bt = b.messages[b.messages.length - 1]?.sentAt || ''
      return bt.localeCompare(at)
    })
  }, [rawMessages, user?.id, draftConvo])

  useEffect(() => {
    if (!activeKey && conversations.length > 0) {
      const preferredKey = draftConvo?.key
      setActiveKey(preferredKey && conversations.some((c) => c.key === preferredKey) ? preferredKey : conversations[0].key)
    }
  }, [conversations, activeKey, draftConvo])

  const activeConversation = conversations.find((c) => c.key === activeKey)

  const openNewChat = async () => {
    if (allResources.length === 0) {
      try {
        const data = await getResources()
        setAllResources(data)
      } catch (err) {
        console.error(err)
      }
    }
    setShowNewChat(true)
  }

  const pickerOptions = useMemo(() => {
    return allResources
      .filter((r) => r.ownerId !== user?.id)
      .filter((r) => (pickerSearch ? r.title.toLowerCase().includes(pickerSearch.toLowerCase()) || r.ownerName.toLowerCase().includes(pickerSearch.toLowerCase()) : true))
      .slice(0, 30)
  }, [allResources, pickerSearch, user?.id])

  const startConversation = (resource) => {
    setDraftConvo({
      key: `${resource.id}__${resource.ownerId}`,
      resourceId: resource.id,
      resourceTitle: resource.title,
      withId: resource.ownerId,
      withName: resource.ownerName,
    })
    setActiveKey(`${resource.id}__${resource.ownerId}`)
    setShowNewChat(false)
    setPickerSearch('')
  }

  const handleSend = async (conversation, text) => {
    if (!text.trim() || sending) return
    setSending(true)
    try {
      await sendMessage({
        resourceId: conversation.resourceId,
        resourceTitle: conversation.resourceTitle,
        senderId: user.id,
        senderName: user.name,
        receiverId: conversation.withId,
        receiverName: conversation.withName,
        text: text.trim(),
      })
      await load()
      // Simulate the owner's reply for catalog (non-registered) owners.
      maybeSendAutoReply({
        resourceId: conversation.resourceId,
        resourceTitle: conversation.resourceTitle,
        fromId: conversation.withId,
        fromName: conversation.withName,
        toId: user.id,
        toName: user.name,
      }).then(() => load())
    } finally {
      setSending(false)
    }
  }

  return (
    <UserLayout title="Messages" subtitle="Chat with resource owners and requesters.">
      {loading ? (
        <div className="loading-wrap"><span className="spinner" />Loading conversations...</div>
      ) : (
        <div className="chat-layout">
          <div className="chat-list">
            <div style={{ padding: 12, borderBottom: '1px solid var(--border)' }}>
              <button className="btn btn-primary btn-sm btn-block" onClick={openNewChat} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <Plus size={15} style={{ marginRight: 6 }} /> New Message
              </button>
            </div>
            {conversations.length === 0 && (
              <div className="empty-state" style={{ padding: 20 }}>No conversations yet. Start one above, or chat with an owner from a resource page.</div>
            )}
            {conversations.map((c) => {
              const lastMsg = c.messages[c.messages.length - 1]
              return (
                <div
                  key={c.key}
                  className={`chat-list-item ${c.key === activeKey ? 'active' : ''}`}
                  onClick={() => setActiveKey(c.key)}
                >
                  <div className="avatar sm">{c.withName?.charAt(0)}</div>
                  <div className="meta">
                    <div className="top">
                      <span className="name">{c.withName}</span>
                    </div>
                    <div className="snippet">{lastMsg ? lastMsg.text : `Re: ${c.resourceTitle}`}</div>
                  </div>
                </div>
              )
            })}
          </div>
          <ChatBox conversation={activeConversation} currentUserId={user?.id} onSend={handleSend} sending={sending} />
        </div>
      )}

      {showNewChat && (
        <div className="modal-overlay" onClick={() => setShowNewChat(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">
              <h3 style={{ fontSize: '1.05rem' }}>Start a new conversation</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowNewChat(false)}><X size={16} /></button>
            </div>
            <div className="search-input-wrap" style={{ marginBottom: 14 }}>
              <Search size={15} style={{ color: 'var(--sage)' }} />
              <input placeholder="Search by resource or owner name..." value={pickerSearch} onChange={(e) => setPickerSearch(e.target.value)} autoFocus />
            </div>
            <div style={{ maxHeight: 320, overflowY: 'auto', display: 'grid', gap: 8 }}>
              {pickerOptions.map((r) => (
                <div
                  key={r.id}
                  className="chat-list-item"
                  style={{ borderRadius: 10, border: '1px solid var(--border)' }}
                  onClick={() => startConversation(r)}
                >
                  <div className="avatar sm">{r.ownerName?.charAt(0)}</div>
                  <div className="meta">
                    <div className="top"><span className="name">{r.ownerName}</span></div>
                    <div className="snippet">Re: {r.title}</div>
                  </div>
                </div>
              ))}
              {pickerOptions.length === 0 && <div className="empty-state" style={{ padding: 16 }}>No matching resources found.</div>}
            </div>
          </div>
        </div>
      )}
    </UserLayout>
  )
}
