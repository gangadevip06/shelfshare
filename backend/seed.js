// seed.js - Seeds MongoDB with authentic verified users, admin, categories, and resources
require('dotenv').config()
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const connectDB = require('./config/db')

const User = require('./models/User')
const Admin = require('./models/Admin')
const Category = require('./models/Category')
const Resource = require('./models/Resource')
const Request = require('./models/Request')

const INITIAL_USERS = [
  {
    id: 'user-karthik',
    name: 'Karthik Raman',
    email: 'karthik.raman@shelfshare.com',
    password: 'Karthik@123',
    phone: '+91 98401 23456',
    address: 'Anna Nagar, Chennai',
    role: 'user',
    trustScore: 100,
    rating: 4.9,
    referralCode: 'KAR8492',
    joined: '2025-11-10',
  },
  {
    id: 'user-priya',
    name: 'Priya Sundaram',
    email: 'priya.sundaram@shelfshare.com',
    password: 'Priya@123',
    phone: '+91 98402 34567',
    address: 'T. Nagar, Chennai',
    role: 'user',
    trustScore: 100,
    rating: 4.8,
    referralCode: 'PRI5912',
    referredBy: 'KAR8492',
    joined: '2025-12-05',
  },
  {
    id: 'user-arun',
    name: 'Arun Prakash',
    email: 'arun.prakash@shelfshare.com',
    password: 'Arun@123',
    phone: '+91 98403 45678',
    address: 'Velachery, Chennai',
    role: 'user',
    trustScore: 100,
    rating: 4.7,
    referralCode: 'ARU9104',
    referredBy: 'PRI5912',
    joined: '2026-01-14',
  },
  {
    id: 'user-divya',
    name: 'Divya Natarajan',
    email: 'divya.natarajan@shelfshare.com',
    password: 'Divya@123',
    phone: '+91 98404 56789',
    address: 'Adyar, Chennai',
    role: 'user',
    trustScore: 100,
    rating: 4.9,
    referralCode: 'DIV3381',
    joined: '2026-02-01',
  },
  {
    id: 'user-vignesh',
    name: 'Vignesh Kumar',
    email: 'vignesh.kumar@shelfshare.com',
    password: 'Vignesh@123',
    phone: '+91 98405 67890',
    address: 'OMR, Chennai',
    role: 'user',
    trustScore: 100,
    rating: 4.6,
    referralCode: 'VIG7729',
    referredBy: 'ARU9104',
    joined: '2026-02-18',
  },
  {
    id: 'user-ganga',
    name: 'Ganga Devi',
    email: 'gangadevip06@gmail.com',
    password: 'Ganga@123',
    phone: '+91 98406 78901',
    address: 'Chennai, Tamil Nadu',
    role: 'user',
    trustScore: 100,
    rating: 5.0,
    referralCode: 'GAN9001',
    joined: '2026-03-01',
  },
]

const INITIAL_ADMIN = {
  id: 'admin-1',
  name: 'ShelfShare Platform Administrator',
  email: 'admin@shelfshare.com',
  password: 'Admin@123',
  role: 'admin',
}

const CATEGORIES = [
  { id: 'cat-books', name: 'Books', icon: '📚', tag: 'textbook' },
  { id: 'cat-electronics', name: 'Electronics', icon: '🔌', tag: 'electronicsgadget' },
  { id: 'cat-furniture', name: 'Furniture', icon: '🛋️', tag: 'furniture' },
  { id: 'cat-tools', name: 'Tools', icon: '🔧', tag: 'handtools' },
  { id: 'cat-sports', name: 'Sports Equipment', icon: '🏸', tag: 'sportsequipment' },
  { id: 'cat-music', name: 'Musical Instruments', icon: '🎸', tag: 'acousticguitar' },
  { id: 'cat-study', name: 'Study Materials', icon: '📝', tag: 'notebook' },
  { id: 'cat-household', name: 'Household Items', icon: '🏺', tag: 'kitchenware' },
  { id: 'cat-cameras', name: 'Cameras', icon: '📷', tag: 'dslrcamera' },
  { id: 'cat-kitchen', name: 'Kitchen Appliances', icon: '🍳', tag: 'kitchenappliance' },
  { id: 'cat-garden', name: 'Gardening Equipment', icon: '🌱', tag: 'gardentools' },
  { id: 'cat-computers', name: 'Computers & Accessories', icon: '💻', tag: 'laptopcomputer' },
  { id: 'cat-fitness', name: 'Fitness Equipment', icon: '🏋️', tag: 'dumbbell' },
  { id: 'cat-education', name: 'Educational Equipment', icon: '🎓', tag: 'microscope' },
  { id: 'cat-office', name: 'Office Equipment', icon: '🖇️', tag: 'officeprinter' },
]

const EXACT_IMAGES = {
  'Data Structures & Algorithms (Cormen)': 'https://images.unsplash.com/photo-1532012164546-f432f2e3dd45?auto=format&fit=crop&w=600&q=80',
  'Engineering Mathematics Vol. 2': 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=600&q=80',
  'Operating System Concepts (Silberschatz)': 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
  'Atomic Habits by James Clear': 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=600&q=80',
  'GATE CS Previous Year Papers': 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=600&q=80',
  'The Alchemist by Paulo Coelho': 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80',
  'Competitive Programming Handbook': 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=600&q=80',
  'Introduction to Algorithms Study Guide': 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=600&q=80',
  'Object Oriented Programming with Java': 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=600&q=80',
  'Machine Learning Basics (Paperback)': 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80',
  'Bluetooth Headphones - Boat Rockerz': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
  'Portable Bluetooth Speaker - JBL Go': 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=600&q=80',
  'Smartwatch - Noise ColorFit': 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80',
  'Power Bank 20000mAh': 'https://images.unsplash.com/photo-1609592424109-dd9892f1b177?auto=format&fit=crop&w=600&q=80',
  'Wireless Mouse - Logitech M235': 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=600&q=80',
  'Cordless Drill Machine': 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=600&q=80',
  'Tool Kit Set (45 pcs)': 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=600&q=80',
  'DSLR Camera - Canon 1500D': 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80',
  'Acoustic Guitar - Yamaha F310': 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=600&q=80',
  'Laptop - Dell Inspiron i5': 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=600&q=80',
  'Paper Shredder - Home Office': 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=600&q=80',
  'gardening equipments': 'https://images.unsplash.com/photo-1617576683096-00fc8eecb3af?auto=format&fit=crop&w=600&q=80',
}

const seedDatabase = async () => {
  try {
    await connectDB()

    console.log(' Clearning existing collections...')
    await User.deleteMany()
    await Admin.deleteMany()
    await Category.deleteMany()
    await Resource.deleteMany()
    await Request.deleteMany()

    console.log(' Seeding verified users...')
    const salt = await bcrypt.genSalt(10)
    for (const u of INITIAL_USERS) {
      const hashedPassword = await bcrypt.hash(u.password, salt)
      await User.create({ ...u, password: hashedPassword })
    }

    // Also seed Anushiya as a verified user
    const anushiyaPassword = await bcrypt.hash('Anushiya@123', salt)
    await User.create({
      id: 'user-anushiya',
      name: 'Anushiya',
      email: 'anushiya@shelfshare.com',
      password: anushiyaPassword,
      phone: '+91 98407 12345',
      address: 'Chennai, Tamil Nadu',
      role: 'user',
      trustScore: 100,
      rating: 5.0,
      referralCode: 'ANU8821',
      joined: '2026-03-01',
    })

    console.log(' Seeding platform administrator...')
    const adminPassword = await bcrypt.hash(INITIAL_ADMIN.password, salt)
    await Admin.create({ ...INITIAL_ADMIN, password: adminPassword })

    console.log(' Seeding categories...')
    await Category.insertMany(CATEGORIES)

    console.log(' Seeding authentic catalog resources...')
    const sampleItems = [
      { id: 'res-gardening-equipments', title: 'gardening equipments', category: 'Gardening Equipment', price: 1500, sale: 4500, desc: 'Complete gardening tools set including trowel, pruning shears, cultivator, and watering hose.', ownerId: 'user-ganga', ownerName: 'Ganga Devi', ownerEmail: 'gangadevip06@gmail.com' },
      { title: 'Data Structures & Algorithms (Cormen)', category: 'Books', price: 15, sale: 450, desc: 'Classic CLRS textbook, great for DSA prep.' },
      { title: 'Operating System Concepts (Silberschatz)', category: 'Books', price: 12, sale: 380, desc: 'Standard CS curriculum textbook with clean pages.' },
      { title: 'Atomic Habits by James Clear', category: 'Books', price: 10, sale: 299, desc: 'Bestselling self-improvement book in like-new condition.' },
      { title: 'Bluetooth Headphones - Boat Rockerz', category: 'Electronics', price: 40, sale: 1499, desc: 'Over-ear Bluetooth headphones with 15h battery.' },
      { title: 'Portable Bluetooth Speaker - JBL Go', category: 'Electronics', price: 35, sale: 1999, desc: 'Compact portable waterproof speaker with punchy bass.' },
      { title: 'Smartwatch - Noise ColorFit', category: 'Electronics', price: 50, sale: 2499, desc: 'Fitness tracking smartwatch with heart rate monitor.' },
      { title: 'Cordless Drill Machine', category: 'Tools', price: 70, sale: 3200, desc: 'Bosch cordless hammer drill with accessories.' },
      { title: 'Tool Kit Set (45 pcs)', category: 'Tools', price: 30, sale: 1200, desc: 'Comprehensive home tool kit with sockets and pliers.' },
      { title: 'DSLR Camera - Canon 1500D', category: 'Cameras', price: 350, sale: 28000, desc: 'Canon DSLR with 18-55mm lens and battery kit.' },
      { title: 'Acoustic Guitar - Yamaha F310', category: 'Musical Instruments', price: 120, sale: 7500, desc: 'Natural finish spruce top guitar with padded bag.' },
      { title: 'Laptop - Dell Inspiron i5', category: 'Computers & Accessories', price: 250, sale: 35000, desc: 'Dell 15.6-inch laptop, Core i5, 16GB RAM.' },
      { title: 'Paper Shredder - Home Office', category: 'Office Equipment', price: 40, sale: 2200, desc: 'Cross-cut document shredder with waste bin.' },
    ]

    const locations = ['Anna Nagar', 'T Nagar', 'Velachery', 'Adyar', 'Porur', 'Tambaram']
    const owners = INITIAL_USERS.filter((u) => u.id !== 'user-ganga' && u.email !== 'gangadevip06@gmail.com')

    for (let i = 0; i < sampleItems.length; i++) {
      const it = sampleItems[i]
      const owner = it.ownerId ? { id: it.ownerId, name: it.ownerName, email: it.ownerEmail } : owners[i % owners.length]
      await Resource.create({
        id: it.id || `res-${i + 1}`,
        title: it.title,
        description: it.desc,
        category: it.category,
        condition: 'Good',
        sharingType: 'Rent Only',
        rentalPrice: it.price,
        salePrice: it.sale,
        deposit: Math.round(it.sale * 0.15),
        availability: 'Available',
        location: locations[i % locations.length],
        image: EXACT_IMAGES[it.title] || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80',
        ownerId: owner.id,
        ownerName: owner.name,
        ownerEmail: owner.email || '',
        rating: 5.0,
        reviews: [],
        bookedRanges: [],
        status: 'Active',
      })
    }

    console.log(' Seeding authentic incoming request for Ganga Devi...')
    await Request.create({
      id: 'req-gardening-equipments-1',
      resourceId: 'res-gardening-equipments',
      resourceTitle: 'gardening equipments',
      category: 'Gardening Equipment',
      requesterId: 'user-anushiya',
      requesterName: 'Anushiya',
      ownerId: 'user-ganga',
      ownerName: 'Ganga Devi',
      ownerEmail: 'gangadevip06@gmail.com',
      requestType: 'Rent',
      rentalDuration: 1,
      startDate: '2026-10-03',
      endDate: '2026-10-04',
      isPreBooking: false,
      quantity: 1,
      amount: 1500,
      deposit: 500,
      totalAmount: 2000,
      pickupLocation: 'Chennai, Tamil Nadu',
      status: 'Approved',
      paymentStatus: 'Paid',
      paymentMethod: 'UPI',
      handoverStatus: 'Not Handed Over',
      requestedOn: '2026-10-03',
      statusHistory: [
        { key: 'Requested', at: '2026-10-03T10:00:00.000Z' },
        { key: 'Approved', at: '2026-10-03T10:30:00.000Z' },
      ],
    })

    console.log(' Database successfully seeded!')
    process.exit(0)
  } catch (err) {
    console.error(' Seeding failed:', err.message)
    process.exit(1)
  }
}

seedDatabase()
