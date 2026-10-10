// utils/validation.js
// Small, reusable validators used by Register / Login / AddResource forms.

export const isEmpty = (value) => !value || !value.toString().trim()

export const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

export const isValidPhone = (value) => /^[0-9]{10}$/.test(value)

export function validateRegisterForm(form) {
  const errors = {}

  if (isEmpty(form.fullName)) errors.fullName = 'Full name is required.'
  if (isEmpty(form.phone)) errors.phone = 'Phone number is required.'
  else if (!isValidPhone(form.phone)) errors.phone = 'Enter a valid 10-digit phone number.'
  if (isEmpty(form.address)) errors.address = 'Address is required.'

  if (isEmpty(form.email)) errors.email = 'Email is required.'
  else if (!isValidEmail(form.email)) errors.email = 'Enter a valid email address.'

  if (isEmpty(form.password)) errors.password = 'Password is required.'
  else if (form.password.length < 6) errors.password = 'Password must be at least 6 characters.'

  if (isEmpty(form.confirmPassword)) errors.confirmPassword = 'Please confirm your password.'
  else if (form.password !== form.confirmPassword) errors.confirmPassword = 'Passwords do not match.'

  return errors
}

export function validateLoginForm(form) {
  const errors = {}
  if (isEmpty(form.email)) errors.email = 'Email is required.'
  else if (!isValidEmail(form.email)) errors.email = 'Enter a valid email address.'
  if (isEmpty(form.password)) errors.password = 'Password is required.'
  return errors
}

export function validateResourceForm(form) {
  const errors = {}
  if (isEmpty(form.title)) errors.title = 'Title is required.'
  if (isEmpty(form.category)) errors.category = 'Select a category.'
  if (isEmpty(form.description)) errors.description = 'Description is required.'
  if (isEmpty(form.condition)) errors.condition = 'Select a condition.'
  if (isEmpty(form.sharingType)) errors.sharingType = 'Select a sharing type.'
  if (isEmpty(form.location)) errors.location = 'Location is required.'
  if (isEmpty(form.image)) errors.image = 'Please upload a photo of the item.'

  const needsRental = form.sharingType === 'Rent Only' || form.sharingType === 'Rent or Buy'
  const needsSale = form.sharingType === 'Buy Only' || form.sharingType === 'Rent or Buy'

  if (needsRental && (isEmpty(form.rentalPrice) || Number(form.rentalPrice) <= 0)) {
    errors.rentalPrice = 'Enter a valid rental price per day.'
  }
  if (needsSale && (isEmpty(form.salePrice) || Number(form.salePrice) <= 0)) {
    errors.salePrice = 'Enter a valid sale price.'
  }

  return errors
}
