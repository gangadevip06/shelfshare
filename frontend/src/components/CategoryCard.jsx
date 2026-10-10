// components/CategoryCard.jsx
import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'

export default function CategoryCard({ category, count }) {
  return (
    <Link to={`/explore?category=${encodeURIComponent(category.name)}`} className="card category-card" style={{ position: 'relative' }}>
      <div className="category-icon">{category.icon}</div>
      <h4>{category.name}</h4>
      {typeof count === 'number' && <div className="count">{count} listed</div>}
      <div style={{ position: 'absolute', top: 12, right: 12, color: 'var(--sage)', opacity: 0.6 }}>
        <ArrowUpRight size={15} />
      </div>
    </Link>
  )
}

