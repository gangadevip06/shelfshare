// utils/trustScore.js
// Combines completed-transaction count, average rating, and account age
// into a single Trust Score, shown as a Bronze/Silver/Gold badge —
// meant to be more meaningful than a raw star average alone, since a new
// account with one 5-star review shouldn't outrank someone with 40
// smoothly completed transactions.
export function computeTrustScore({ completedCount = 0, avgRating = 0, joinedDate }) {
  const ratingScore = Math.min(avgRating, 5) * 20 // 0-100
  const completionScore = Math.min(completedCount * 6, 100) // 0-100, caps at ~17 completions
  const accountAgeDays = joinedDate ? (Date.now() - new Date(joinedDate).getTime()) / 86400000 : 0
  const ageScore = Math.min(accountAgeDays / 2, 100) // 0-100, caps at 200 days

  const total = ratingScore * 0.45 + completionScore * 0.4 + ageScore * 0.15
  return Math.round(Math.max(0, Math.min(100, total)))
}

export function trustTier(score) {
  if (score >= 65) return { tier: 'Gold', icon: '🥇', className: 'trust-gold' }
  if (score >= 35) return { tier: 'Silver', icon: '🥈', className: 'trust-silver' }
  return { tier: 'Bronze', icon: '🥉', className: 'trust-bronze' }
}
