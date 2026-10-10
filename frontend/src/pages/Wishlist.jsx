// pages/Wishlist.jsx
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Heart } from 'lucide-react'
import UserLayout from '../components/UserLayout.jsx'
import ResourceCard from '../components/ResourceCard.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import { getResources } from '../services/api.js'

export default function Wishlist() {
  const { t } = useLanguage()
  const wishlistIds = useSelector((state) => state.resources.wishlist)
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const all = await getResources()
        setResources(all)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const wishedResources = resources.filter((r) => wishlistIds.includes(r.id))

  return (
    <UserLayout title={t('wishlist_title')} subtitle={t('wishlist_subtitle')}>
      {loading ? (
        <div className="loading-wrap"><span className="spinner" />{t('common_loading')}</div>
      ) : wishedResources.length === 0 ? (
        <div className="empty-state">
          <div className="ic" style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <Heart size={44} strokeWidth={1.5} color="var(--sage)" />
          </div>
          {t('empty_noWishlist')}
        </div>
      ) : (
        <div className="grid-4">
          {wishedResources.map((r) => <ResourceCard key={r.id} resource={r} />)}
        </div>
      )}
    </UserLayout>
  )
}
