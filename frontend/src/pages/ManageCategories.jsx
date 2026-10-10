// pages/ManageCategories.jsx
import React, { useEffect, useState } from 'react'
import AdminLayout from '../components/AdminLayout.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import { getCategories, addCategory, updateCategory, deleteCategory, getResources } from '../services/api.js'
import { Plus, X } from 'lucide-react'

export default function ManageCategories() {
  const { t } = useLanguage()
  const [categories, setCategories] = useState([])
  const [resourceCounts, setResourceCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [form, setForm] = useState({ name: '', icon: '📦' })

  const loadData = async () => {
    setLoading(true)
    try {
      const [cats, resources] = await Promise.all([getCategories(), getResources()])
      setCategories(cats)
      const counts = {}
      resources.forEach((r) => { counts[r.category] = (counts[r.category] || 0) + 1 })
      setResourceCounts(counts)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const openAdd = () => { setEditingCategory(null); setForm({ name: '', icon: '📦' }); setShowModal(true) }
  const openEdit = (cat) => { setEditingCategory(cat); setForm({ name: cat.name, icon: cat.icon }); setShowModal(true) }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    if (editingCategory) {
      await updateCategory(editingCategory.id, form)
      setCategories((prev) => prev.map((c) => (c.id === editingCategory.id ? { ...c, ...form } : c)))
    } else {
      const created = await addCategory(form)
      setCategories((prev) => [...prev, created])
    }
    setShowModal(false)
  }

  const handleDelete = async (id) => {
    await deleteCategory(id)
    setCategories((prev) => prev.filter((c) => c.id !== id))
  }

  return (
    <AdminLayout title={t("admin_manageCategoriesTitle")} subtitle="Add, edit, or remove resource categories.">
      <div className="page-head">
        <div />
        <button className="btn btn-accent" onClick={openAdd} style={{ display: 'inline-flex', alignItems: 'center' }}>
          <Plus size={16} style={{ marginRight: 6 }} /> Add Category
        </button>
      </div>

      {loading ? (
        <div className="loading-wrap"><span className="spinner" />Loading categories...</div>
      ) : (
        <div className="grid-4">
          {categories.map((c) => (
            <div key={c.id} className="card category-card">
              <div className="category-icon">{c.icon}</div>
              <h4>{c.name}</h4>
              <div className="count">{resourceCounts[c.name] || 0} resources</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                <button className="btn btn-outline btn-sm btn-block" onClick={() => openEdit(c)}>Edit</button>
                <button className="btn btn-danger btn-sm btn-block" onClick={() => handleDelete(c.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">
              <h3 style={{ fontSize: '1.05rem' }}>{editingCategory ? 'Edit Category' : 'Add Category'}</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Category Name</label>
                <input className="form-control" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Kitchen Appliances" />
              </div>
              <div className="form-group">
                <label className="form-label">Icon (emoji)</label>
                <input className="form-control" value={form.icon} onChange={(e) => setForm((p) => ({ ...p, icon: e.target.value }))} placeholder="🍳" />
              </div>
              <button type="submit" className="btn btn-primary btn-block">{editingCategory ? 'Save Changes' : 'Add Category'}</button>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
