// components/Footer.jsx
import React from 'react'
import { Link } from 'react-router-dom'
import { Sparkles } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="logo" style={{ marginBottom: 10 }}>
              <span className="logo-mark">
                <Sparkles size={16} strokeWidth={2.5} />
              </span>
              ShelfShare
            </div>
            <p style={{ color: 'var(--sage)', fontSize: '0.88rem', maxWidth: 260, lineHeight: 1.6 }}>
              A community platform for renting and buying everyday resources near you.
            </p>
          </div>
          <div>
            <h5>Platform</h5>
            <Link to="/explore">Explore</Link>
            <Link to="/register">Start Sharing</Link>
            <Link to="/login">Login</Link>
          </div>
          <div>
            <h5>Categories</h5>
            <Link to="/explore?category=Books">Books</Link>
            <Link to="/explore?category=Electronics">Electronics</Link>
            <Link to="/explore?category=Furniture">Furniture</Link>
          </div>
          <div>
            <h5>Support</h5>
            <a href="#">Help Center</a>
            <a href="#">Community Guidelines</a>
            <a href="#">Contact Us</a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 ShelfShare. A Modern Web Technology academic project.</span>
          <span>Built with React · <Link to="/admin-login" style={{ color: 'inherit', opacity: 0.6 }}>Admin</Link></span>
        </div>
      </div>
    </footer>
  )
}
