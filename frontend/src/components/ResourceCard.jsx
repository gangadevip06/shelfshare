// components/ResourceCard.jsx
// Reusable card for a single resource, used in Explore, Dashboard,
// MyResources, and Wishlist. Receives data purely through props.
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Heart, MapPin, Bike, Star, Camera, Edit3, Trash2, Eye } from 'lucide-react'
import { toggleWishlist } from '../store/resourceSlice.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import { formatDistance, estimateDeliveryTime } from '../utils/geo.js'

// Fully local, zero-network fallback (used only if a resource somehow has
// no image at all) so a broken photo never shows a broken-image icon.
const FALLBACK_IMAGE = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360"><rect width="480" height="360" fill="#eee7d8"/><text x="240" y="190" font-size="60" text-anchor="middle">📦</text></svg>'
)}`

const SHARING_KEY = { 'Rent Only': 'sharing_RentOnly', 'Buy Only': 'sharing_BuyOnly', 'Rent or Buy': 'sharing_RentOrBuy' }
const STATUS_KEY = { Available: 'status_Available', Unavailable: 'status_Unavailable' }

function priceLabel(resource) {
  if (resource.sharingType === 'Rent Only') return `₹${resource.rentalPrice}/day`
  if (resource.sharingType === 'Buy Only') return `₹${resource.salePrice}`
  return `₹${resource.rentalPrice}/day · ₹${resource.salePrice}`
}

export default function ResourceCard({ resource, showOwnerActions = false, onEdit, onDelete, onManagePhoto, distanceKm = null }) {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { user } = useAuth()
  const { t } = useLanguage()
  const wishlist = useSelector((state) => state.resources?.wishlist)
  const isWished = Array.isArray(wishlist) && resource ? wishlist.includes(resource.id) : false

  if (!resource) return null

  const handleToggleWishlist = (e) => {
    e.stopPropagation()
    if (!user?.id) { navigate('/login'); return }
    dispatch(toggleWishlist({ id: resource.id, userId: user.id }))
  }

  const availabilityBadge = resource.availability === 'Available' ? 'badge-green' : 'badge-amber'

  return (
    <div className="card resource-card">
      <div className="thumb">
        <img
          src={resource.image || FALLBACK_IMAGE}
          alt={resource.title}
          loading="lazy"
          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMAGE }}
        />
        <button
          className="fav"
          title="Toggle wishlist"
          onClick={handleToggleWishlist}
        >
          <Heart
            size={16}
            fill={isWished ? '#ef4444' : 'none'}
            color={isWished ? '#ef4444' : 'var(--ink)'}
            strokeWidth={2.2}
          />
        </button>
        {distanceKm !== null && (
          <span className="distance-chip">
            <MapPin size={11} strokeWidth={2.2} /> {formatDistance(distanceKm)}
          </span>
        )}
      </div>
      <div className="body" onClick={() => navigate(`/resources/${resource.id}`)} style={{ cursor: 'pointer' }}>
        <span className={`badge ${availabilityBadge}`}>{t(STATUS_KEY[resource.availability]) || resource.availability}</span>
        <h4>{resource.title}</h4>
        <div className="meta">
          <span>{resource.category}</span>
          <span>·</span>
          <span>{resource.location}</span>
        </div>
        <div className="price-row">
          <span className="price">{priceLabel(resource)}</span>
          <span className="stars" style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
            <Star size={13} fill="#f59e0b" color="#f59e0b" strokeWidth={1} />
            {resource.rating?.toFixed?.(1) ?? resource.rating}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
          <div className="sharing-type-tag">{t(SHARING_KEY[resource.sharingType]) || resource.sharingType}</div>
          {distanceKm !== null && (
            <div className="delivery-chip">
              <Bike size={12} strokeWidth={2.2} /> {estimateDeliveryTime(distanceKm)}
            </div>
          )}
        </div>
      </div>
      <div className="foot">
        {showOwnerActions ? (
          <>
            <button className="btn btn-outline btn-sm btn-block" onClick={(e) => { e.stopPropagation(); navigate(`/resources/${resource.id}`) }}>
              <Eye size={14} /> {t('common_view')}
            </button>
            <button className="btn btn-outline btn-sm btn-block" onClick={() => onManagePhoto?.(resource)}>
              <Camera size={14} /> {t('action_managePhoto')}
            </button>
            <button className="btn btn-outline btn-sm btn-block" onClick={() => onEdit?.(resource)}>
              <Edit3 size={14} />
              {resource.availability === 'Available' ? t('action_markUnavailable') : t('action_markAvailable')}
            </button>
            <button className="btn btn-danger btn-sm btn-block" onClick={() => onDelete?.(resource)}>
              <Trash2 size={14} /> {t('common_delete')}
            </button>
          </>
        ) : (
          <button className="btn btn-primary btn-sm btn-block" onClick={() => navigate(`/resources/${resource.id}`)}>
            {t('resourceCard_viewDetails')}
          </button>
        )}
      </div>
    </div>
  )
}

