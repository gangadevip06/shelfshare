// pages/AddResource.jsx
import React, { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import UserLayout from '../components/UserLayout.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import { CATEGORIES, SHARING_TYPES, CONDITIONS, LOCATIONS } from '../data/mockData.js'
import { validateResourceForm } from '../utils/validation.js'
import { addResourceThunk } from '../store/resourceSlice.js'
import { fileToCompressedDataUrl } from '../utils/imageUpload.js'
import { Upload } from 'lucide-react'

const SHARING_KEY = { 'Rent Only': 'sharing_RentOnly', 'Buy Only': 'sharing_BuyOnly', 'Rent or Buy': 'sharing_RentOrBuy' }

const EMPTY_FORM = {
  title: '', category: '', description: '', condition: '', sharingType: '',
  rentalPrice: '', salePrice: '', deposit: '', availability: 'Available', location: '', image: '',
}

export default function AddResource() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const translateSharing = (st) => t(SHARING_KEY[st]) || st
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [imageProcessing, setImageProcessing] = useState(false)

  const needsRental = form.sharingType === 'Rent Only' || form.sharingType === 'Rent or Buy'
  const needsSale = form.sharingType === 'Buy Only' || form.sharingType === 'Rent or Buy'

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setErrors((prev) => ({ ...prev, image: 'Please choose an image file (JPG, PNG, WEBP).' }))
      return
    }
    setImageProcessing(true)
    try {
      const dataUrl = await fileToCompressedDataUrl(file)
      setForm((prev) => ({ ...prev, image: dataUrl }))
      setErrors((prev) => ({ ...prev, image: undefined }))
    } catch (err) {
      setErrors((prev) => ({ ...prev, image: err.message }))
    } finally {
      setImageProcessing(false)
    }
  }

  const handleRemoveImage = () => {
    setForm((prev) => ({ ...prev, image: '' }))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleReset = () => {
    setForm(EMPTY_FORM)
    setErrors({})
    setSuccess(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validationErrors = validateResourceForm(form)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    setSubmitting(true)
    try {
      await dispatch(addResourceThunk({
        ...form,
        rentalPrice: needsRental ? Number(form.rentalPrice) || 0 : 0,
        salePrice: needsSale ? Number(form.salePrice) || 0 : 0,
        deposit: needsRental ? Number(form.deposit) || 0 : 0,
        ownerId: user.id,
        ownerName: user.name,
        ownerEmail: user.email || '',
        ownerPhone: user.phone || '',
        location: form.location || user.address || 'Chennai, Tamil Nadu',
        rating: 5.0,
        reviews: [],
        status: 'Active',
        bookedRanges: [],
      })).unwrap()
      setSuccess(true)
      setTimeout(() => navigate('/my-resources'), 900)
    } catch (err) {
      setErrors({ submit: 'Could not add the resource. Please try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <UserLayout title={t('addResource_title')} subtitle={t('addResource_subtitle')}>
      <div className="card" style={{ padding: 26, maxWidth: 720 }}>
        {success && <div className="alert alert-success">Resource added! Redirecting to My Resources...</div>}
        {errors.submit && <div className="alert alert-error">{errors.submit}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label">Photo of the item</label>
            {form.image ? (
              <div style={{ position: 'relative', width: 220 }}>
                <div style={{ borderRadius: 10, overflow: 'hidden', height: 160, background: '#eee7d8' }}>
                  <img src={form.image} alt="Selected upload" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <button type="button" className="btn btn-outline btn-sm btn-block" style={{ marginTop: 8 }} onClick={handleRemoveImage}>
                  Remove photo
                </button>
              </div>
            ) : (
              <div
                className={`upload-dropzone ${errors.image ? 'invalid' : ''}`}
                onClick={() => fileInputRef.current?.click()}
              >
                {imageProcessing ? (
                  'Processing image...'
                ) : (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <Upload size={18} /> Click to upload a photo of your item (required)
                  </span>
                )}
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            {errors.image && <div className="form-error">{errors.image}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">{t('field_title')}</label>
            <input className={`form-control ${errors.title ? 'invalid' : ''}`} value={form.title} onChange={handleChange('title')} placeholder="e.g. Cordless Drill Machine" />
            {errors.title && <div className="form-error">{errors.title}</div>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{t('field_category')}</label>
              <select className={`form-control ${errors.category ? 'invalid' : ''}`} value={form.category} onChange={handleChange('category')}>
                <option value="">Select category</option>
                {CATEGORIES.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
              {errors.category && <div className="form-error">{errors.category}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">{t('field_condition')}</label>
              <select className={`form-control ${errors.condition ? 'invalid' : ''}`} value={form.condition} onChange={handleChange('condition')}>
                <option value="">Select condition</option>
                {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              {errors.condition && <div className="form-error">{errors.condition}</div>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">{t('field_description')}</label>
            <textarea className={`form-control ${errors.description ? 'invalid' : ''}`} rows={4} value={form.description} onChange={handleChange('description')} placeholder="Describe the item, its condition, and any usage notes." />
            {errors.description && <div className="form-error">{errors.description}</div>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{t('field_sharingType')}</label>
              <select className={`form-control ${errors.sharingType ? 'invalid' : ''}`} value={form.sharingType} onChange={handleChange('sharingType')}>
                <option value="">Select type</option>
                {SHARING_TYPES.map((st) => <option key={st} value={st}>{translateSharing(st)}</option>)}
              </select>
              {errors.sharingType && <div className="form-error">{errors.sharingType}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">{t('field_location')}</label>
              <select className={`form-control ${errors.location ? 'invalid' : ''}`} value={form.location} onChange={handleChange('location')}>
                <option value="">Select location</option>
                {LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
              {errors.location && <div className="form-error">{errors.location}</div>}
            </div>
          </div>

          {needsRental && (
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Rental Price (per day)</label>
                <input type="number" min="0" className={`form-control ${errors.rentalPrice ? 'invalid' : ''}`} value={form.rentalPrice} onChange={handleChange('rentalPrice')} placeholder="0" />
                {errors.rentalPrice && <div className="form-error">{errors.rentalPrice}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">Deposit (optional)</label>
                <input type="number" min="0" className="form-control" value={form.deposit} onChange={handleChange('deposit')} placeholder="0" />
              </div>
            </div>
          )}

          {needsSale && (
            <div className="form-group">
              <label className="form-label">Sale Price</label>
              <input type="number" min="0" className={`form-control ${errors.salePrice ? 'invalid' : ''}`} value={form.salePrice} onChange={handleChange('salePrice')} placeholder="0" />
              {errors.salePrice && <div className="form-error">{errors.salePrice}</div>}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">{t('field_availability')}</label>
            <select className="form-control" value={form.availability} onChange={handleChange('availability')}>
              <option value="Available">{t('status_Available')}</option>
              <option value="Unavailable">{t('status_Unavailable')}</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button type="submit" className="btn btn-primary" disabled={submitting || imageProcessing}>
              {submitting ? 'Saving...' : t('action_addResource')}
            </button>
            <button type="button" className="btn btn-ghost" onClick={handleReset}>{t('action_resetForm')}</button>
          </div>
        </form>
      </div>
    </UserLayout>
  )
}
