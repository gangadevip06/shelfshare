// pages/Landing.jsx
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Compass, ArrowRight, ShieldCheck, MapPin, Leaf, Sparkles, Star } from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import CategoryCard from '../components/CategoryCard.jsx'
import ResourceCard from '../components/ResourceCard.jsx'
import { CATEGORIES } from '../data/mockData.js'
import { getResources, getRequests, getUsers } from '../services/api.js'

export default function Landing() {
  const navigate = useNavigate()
  const [featured, setFeatured] = useState([])
  const [loading, setLoading] = useState(true)
  const [impact, setImpact] = useState({ totalResources: 0, completedTransactions: 0, totalValueShared: 0, totalMembers: 0 })

  useEffect(() => {
    let cancelled = false
    async function loadFeatured() {
      try {
        const [all, requests, users] = await Promise.all([getResources(), getRequests(), getUsers()])
        if (cancelled) return
        const allResources = Array.isArray(all) ? all : []
        const allRequests = Array.isArray(requests) ? requests : []
        const allUsers = Array.isArray(users) ? users : []
        setFeatured(allResources.slice(0, 8))
        const completed = allRequests.filter((r) => r.status === 'Completed')
        setImpact({
          totalResources: allResources.length,
          completedTransactions: completed.length,
          totalValueShared: completed.reduce((sum, r) => sum + (r.totalAmount || r.amount || 0), 0),
          totalMembers: allUsers.length,
        })
      } catch (err) {
        console.error('Failed to load featured resources', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadFeatured()
    return () => { cancelled = true }
  }, [])

  return (
    <div>
      <Navbar />

      {/* Hero */}
      <section className="hero">
        <div className="container hero-inner">
          <div>
            <div className="tracker-live-badge">
              <span className="live-dot" />
              <span>Hyperlocal Sharing Economy · Verified Community</span>
            </div>
            <h1 style={{ marginTop: 14 }}>
              Everything your neighbours own, <span className="accent-word">one shelf away</span>.
            </h1>
            <p className="lead">
              Rent a guitar for the weekend, buy a study table someone no longer needs, or list your
              own gear for rent or sale — ShelfShare connects people nearby so fewer things sit idle.
            </p>
            <div className="hero-cta">
              <button className="btn btn-primary" onClick={() => navigate('/explore')}>
                <Compass size={17} />
                Explore Resources
              </button>
              <button className="btn btn-outline" onClick={() => navigate('/register')}>
                Start Sharing
                <ArrowRight size={15} />
              </button>
            </div>
            <div className="hero-stats">
              <div className="hero-stat">
                <div className="num">340+</div>
                <div className="lbl">Resources listed</div>
              </div>
              <div className="hero-stat">
                <div className="num">120+</div>
                <div className="lbl">Active members</div>
              </div>
              <div className="hero-stat">
                <div className="num">500+</div>
                <div className="lbl">Items shared</div>
              </div>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-visual-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span className="eyebrow" style={{ color: 'var(--primary)' }}>
                  <Sparkles size={12} /> Fresh on the shelf
                </span>
                <span className="badge badge-green">Available</span>
              </div>
              {featured[0]?.image && (
                <div style={{ height: 130, borderRadius: 10, overflow: 'hidden', marginBottom: 12, background: '#eee' }}>
                  <img src={featured[0].image} alt="Featured" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
              <h4 style={{ marginTop: 2, fontSize: '1.05rem', fontWeight: 700 }}>{featured[0]?.title || 'Acoustic Guitar - Yamaha F310'}</h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--sage)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <MapPin size={13} /> {featured[0]?.location || 'Velachery'} · {featured[0]?.sharingType || 'Rent Only'}
                </span>
                <span style={{ color: 'var(--primary-dark)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                  {featured[0] ? (featured[0].sharingType === 'Buy Only' ? `₹${featured[0].salePrice}` : `₹${featured[0].rentalPrice}/day`) : '₹150/day'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Community impact */}
      <section className="impact-strip">
        <div className="container impact-grid">
          <div className="impact-stat">
            <div className="impact-number">{impact.totalResources}+</div>
            <div className="impact-label">Resources shared</div>
          </div>
          <div className="impact-stat">
            <div className="impact-number">{impact.totalMembers}+</div>
            <div className="impact-label">Community members</div>
          </div>
          <div className="impact-stat">
            <div className="impact-number">{impact.completedTransactions}</div>
            <div className="impact-label">Completed transactions</div>
          </div>
          <div className="impact-stat">
            <div className="impact-number">₹{(impact.totalValueShared || 0).toLocaleString('en-IN')}</div>
            <div className="impact-label">Value shared, not landfilled</div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="section">
        <div className="container">
          <div className="section-head shelf-row">
            <span className="eyebrow">Browse by shelf</span>
            <h2>Categories people share most</h2>
          </div>
          <div className="grid-4">
            {CATEGORIES.map((c) => <CategoryCard key={c.id} category={c} />)}
          </div>
        </div>
      </section>

      {/* Featured resources */}
      <section className="section" style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <div className="section-head shelf-row">
            <span className="eyebrow">Fresh on the shelf</span>
            <h2>Featured resources near you</h2>
          </div>
          {loading ? (
            <div className="loading-wrap"><span className="spinner" />Loading resources...</div>
          ) : (
            <div className="grid-4">
              {featured.slice(0, 4).map((r) => <ResourceCard key={r.id} resource={r} />)}
            </div>
          )}
        </div>
      </section>

      {/* Nearby resources */}
      <section className="section">
        <div className="container">
          <div className="section-head shelf-row">
            <span className="eyebrow">Close by</span>
            <h2>Nearby resources</h2>
          </div>
          {loading ? (
            <div className="loading-wrap"><span className="spinner" />Loading resources...</div>
          ) : (
            <div className="grid-4">
              {featured.slice(4, 8).length ? featured.slice(4, 8).map((r) => <ResourceCard key={r.id} resource={r} />) : featured.map((r) => <ResourceCard key={`n-${r.id}`} resource={r} />)}
            </div>
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="section" id="how-it-works">
        <div className="container">
          <div className="section-head shelf-row">
            <span className="eyebrow">Process</span>
            <h2>How ShelfShare works</h2>
          </div>
          <div className="steps">
            <div className="step">
              <div className="step-no">01</div>
              <h3>List or search</h3>
              <p>Post something you're willing to share, or search what's available nearby by category and type.</p>
            </div>
            <div className="step">
              <div className="step-no">02</div>
              <h3>Request & chat</h3>
              <p>Send a request, chat with the owner to sort out timing and handover, and confirm the terms.</p>
            </div>
            <div className="step">
              <div className="step-no">03</div>
              <h3>Rent, buy & review</h3>
              <p>Complete the rental or purchase, then leave a rating so the community stays trustworthy.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why ShelfShare */}
      <section className="section" style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }} id="why-shelfshare">
        <div className="container">
          <div className="section-head shelf-row">
            <span className="eyebrow">Why ShelfShare</span>
            <h2>Built for people who'd rather share than store</h2>
          </div>
          <div className="grid-3">
            <div className="card" style={{ padding: 26 }}>
              <div className="category-icon" style={{ margin: 0, marginBottom: 16 }}>
                <ShieldCheck size={26} color="var(--primary)" />
              </div>
              <h4>Verified community</h4>
              <p style={{ marginTop: 8, color: 'var(--sage)', fontSize: '0.92rem', lineHeight: 1.55 }}>Ratings and reviews on every member keep exchanges accountable and trustworthy.</p>
            </div>
            <div className="card" style={{ padding: 26 }}>
              <div className="category-icon" style={{ margin: 0, marginBottom: 16 }}>
                <MapPin size={26} color="var(--accent)" />
              </div>
              <h4>Hyper-local</h4>
              <p style={{ marginTop: 8, color: 'var(--sage)', fontSize: '0.92rem', lineHeight: 1.55 }}>Filter by distance so pickups and returns stay within your neighbourhood.</p>
            </div>
            <div className="card" style={{ padding: 26 }}>
              <div className="category-icon" style={{ margin: 0, marginBottom: 16 }}>
                <Leaf size={26} color="var(--primary)" />
              </div>
              <h4>Zero waste lifestyle</h4>
              <p style={{ marginTop: 8, color: 'var(--sage)', fontSize: '0.92rem', lineHeight: 1.55 }}>Every item rented or bought secondhand is one less thing manufactured and landfilled.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section">
        <div className="container">
          <div className="cta-band">
            <div>
              <h2>Have something gathering dust?</h2>
              <p>List it in under two minutes and let it help someone nearby.</p>
            </div>
            <button className="btn btn-accent" onClick={() => navigate('/register')}>
              Start Sharing Today
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
