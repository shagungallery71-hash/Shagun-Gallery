import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/ToastContext'
import { api } from '../api/client'
import { authApi } from '../api/auth'
import Footer from '../components/Footer'
import { StickyNavbar, BreadcrumbNavigator, MobileBottomBar, ChatSupportWidget, CookieConsentBanner } from '../components/UtilityUx'

export default function AdminDashboard() {
  const { user, token } = useAuth()
  const { showToast } = useToast()
  const [activeTab, setActiveTab] = useState('categories')

  // Categories state
  const [categories, setCategories] = useState([])
  const [newCategory, setNewCategory] = useState({ name: '', slug: '', is_active: true })
  const [newSubcategory, setNewSubcategory] = useState({ name: '', slug: '', parent_id: '', is_active: true })

  // Products state
  const [products, setProducts] = useState([])
  const [newProduct, setNewProduct] = useState({
    category_id: '',
    name: '',
    slug: '',
    price: '',
    description: '',
    is_published: true
  })
  const [newVariant, setNewVariant] = useState({
    product_id: '',
    size: '',
    price: '',
    stock: ''
  })
  const [newImage, setNewImage] = useState({ product_id: '', file: null })

  // Users state
  const [newAdmin, setNewAdmin] = useState({ username: '', email: '', password: '' })
  const [deleteUserEmail, setDeleteUserEmail] = useState('')

  useEffect(() => {
    if (user?.role !== 'admin') return
    loadData()
  }, [user, activeTab])

  const loadData = async () => {
    try {
      if (activeTab === 'categories') {
        const cats = await api.categoriesWithSub()
        setCategories(cats.data || [])
      } else if (activeTab === 'products') {
        const prods = await api.productsByMainCategories()
        setProducts(prods.data || [])
      }
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const handleCreateCategory = async (e) => {
    e.preventDefault()
    try {
      await api.createCategory(newCategory, token)
      showToast('Category created successfully', 'success')
      setNewCategory({ name: '', slug: '', is_active: true })
      loadData()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const handleCreateSubcategory = async (e) => {
    e.preventDefault()
    try {
      await api.createSubcategory(newSubcategory, token)
      showToast('Subcategory created successfully', 'success')
      setNewSubcategory({ name: '', slug: '', parent_id: '', is_active: true })
      loadData()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const handleCreateProduct = async (e) => {
    e.preventDefault()
    try {
      await api.createProduct(newProduct, token)
      showToast('Product created successfully', 'success')
      setNewProduct({
        category_id: '',
        name: '',
        slug: '',
        price: '',
        description: '',
        is_published: true
      })
      loadData()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const handleCreateVariant = async (e) => {
    e.preventDefault()
    try {
      await api.createProductVariant(newVariant, token)
      showToast('Product variant created successfully', 'success')
      setNewVariant({ product_id: '', size: '', price: '', stock: '' })
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const handleCreateImage = async (e) => {
    e.preventDefault()
    if (!newImage.file) return
    const formData = new FormData()
    formData.append('product_id', newImage.product_id)
    formData.append('image', newImage.file)
    try {
      await api.createProductImage(formData, token)
      showToast('Product image uploaded successfully', 'success')
      setNewImage({ product_id: '', file: null })
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const handleCreateAdmin = async (e) => {
    e.preventDefault()
    try {
      await authApi.createAdmin(newAdmin, token)
      showToast('Admin user created successfully', 'success')
      setNewAdmin({ username: '', email: '', password: '' })
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const handleDeleteUser = async (e) => {
    e.preventDefault()
    try {
      await authApi.deleteUser({ email: deleteUserEmail }, token)
      showToast('User deleted successfully', 'success')
      setDeleteUserEmail('')
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

 

  return (
    <div className="min-h-screen bg-white">
      <StickyNavbar />
      <BreadcrumbNavigator />
      <main className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto">
          {['categories', 'products', 'users'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-full text-sm font-semibold border whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-pink-600 text-white border-pink-600'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div className="space-y-8">
            <div className="bg-white border border-pink-100 rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-4">Create Category</h2>
              <form onSubmit={handleCreateCategory} className="space-y-4">
                <input
                  type="text"
                  placeholder="Category Name"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
                <input
                  type="text"
                  placeholder="Slug"
                  value={newCategory.slug}
                  onChange={(e) => setNewCategory({...newCategory, slug: e.target.value})}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newCategory.is_active}
                    onChange={(e) => setNewCategory({...newCategory, is_active: e.target.checked})}
                  />
                  Active
                </label>
                <button type="submit" className="px-6 py-2 rounded-full bg-pink-600 text-white font-semibold hover:bg-pink-700">
                  Create Category
                </button>
              </form>
            </div>

            <div className="bg-white border border-pink-100 rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-4">Create Subcategory</h2>
              <form onSubmit={handleCreateSubcategory} className="space-y-4">
                <select
                  value={newSubcategory.parent_id}
                  onChange={(e) => setNewSubcategory({...newSubcategory, parent_id: e.target.value})}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                >
                  <option value="">Select Parent Category</option>
                  {categories.filter(c => !c.parent_id).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Subcategory Name"
                  value={newSubcategory.name}
                  onChange={(e) => setNewSubcategory({...newSubcategory, name: e.target.value})}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
                <input
                  type="text"
                  placeholder="Slug"
                  value={newSubcategory.slug}
                  onChange={(e) => setNewSubcategory({...newSubcategory, slug: e.target.value})}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newSubcategory.is_active}
                    onChange={(e) => setNewSubcategory({...newSubcategory, is_active: e.target.checked})}
                  />
                  Active
                </label>
                <button type="submit" className="px-6 py-2 rounded-full bg-pink-600 text-white font-semibold hover:bg-pink-700">
                  Create Subcategory
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="space-y-8">
            <div className="bg-white border border-pink-100 rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-4">Create Product</h2>
              <form onSubmit={handleCreateProduct} className="space-y-4">
                <select
                  value={newProduct.category_id}
                  onChange={(e) => setNewProduct({...newProduct, category_id: e.target.value})}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                >
                  <option value="">Select Category</option>
                  {categories.filter(c => !c.parent_id).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Product Name"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
                <input
                  type="text"
                  placeholder="Slug"
                  value={newProduct.slug}
                  onChange={(e) => setNewProduct({...newProduct, slug: e.target.value})}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Price"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
                <textarea
                  placeholder="Description"
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  rows={3}
                />
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newProduct.is_published}
                    onChange={(e) => setNewProduct({...newProduct, is_published: e.target.checked})}
                  />
                  Published
                </label>
                <button type="submit" className="px-6 py-2 rounded-full bg-pink-600 text-white font-semibold hover:bg-pink-700">
                  Create Product
                </button>
              </form>
            </div>

            <div className="bg-white border border-pink-100 rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-4">Create Product Variant</h2>
              <form onSubmit={handleCreateVariant} className="space-y-4">
                <select
                  value={newVariant.product_id}
                  onChange={(e) => setNewVariant({...newVariant, product_id: e.target.value})}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                >
                  <option value="">Select Product</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Size"
                  value={newVariant.size}
                  onChange={(e) => setNewVariant({...newVariant, size: e.target.value})}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Price"
                  value={newVariant.price}
                  onChange={(e) => setNewVariant({...newVariant, price: e.target.value})}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
                <input
                  type="number"
                  placeholder="Stock"
                  value={newVariant.stock}
                  onChange={(e) => setNewVariant({...newVariant, stock: e.target.value})}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
                <button type="submit" className="px-6 py-2 rounded-full bg-pink-600 text-white font-semibold hover:bg-pink-700">
                  Create Variant
                </button>
              </form>
            </div>

            <div className="bg-white border border-pink-100 rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-4">Upload Product Image</h2>
              <form onSubmit={handleCreateImage} className="space-y-4">
                <select
                  value={newImage.product_id}
                  onChange={(e) => setNewImage({...newImage, product_id: e.target.value})}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                >
                  <option value="">Select Product</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setNewImage({...newImage, file: e.target.files[0]})}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
                <button type="submit" className="px-6 py-2 rounded-full bg-pink-600 text-white font-semibold hover:bg-pink-700">
                  Upload Image
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-8">
            <div className="bg-white border border-pink-100 rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-4">Create Admin User</h2>
              <form onSubmit={handleCreateAdmin} className="space-y-4">
                <input
                  type="text"
                  placeholder="Username"
                  value={newAdmin.username}
                  onChange={(e) => setNewAdmin({...newAdmin, username: e.target.value})}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={newAdmin.email}
                  onChange={(e) => setNewAdmin({...newAdmin, email: e.target.value})}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={newAdmin.password}
                  onChange={(e) => setNewAdmin({...newAdmin, password: e.target.value})}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
                <button type="submit" className="px-6 py-2 rounded-full bg-pink-600 text-white font-semibold hover:bg-pink-700">
                  Create Admin
                </button>
              </form>
            </div>

            <div className="bg-white border border-pink-100 rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-4">Delete User</h2>
              <form onSubmit={handleDeleteUser} className="space-y-4">
                <input
                  type="email"
                  placeholder="User Email"
                  value={deleteUserEmail}
                  onChange={(e) => setDeleteUserEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
                <button type="submit" className="px-6 py-2 rounded-full bg-red-600 text-white font-semibold hover:bg-red-700">
                  Delete User
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
      <Footer />
      <MobileBottomBar />
      <ChatSupportWidget />
      <CookieConsentBanner />
    </div>
  )
}
