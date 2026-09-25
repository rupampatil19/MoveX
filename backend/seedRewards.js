/**
 * Seed MoveX Bazaar rewards.
 * Run once:  node seedRewards.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Reward = require('./models/Reward');

const REWARDS = [
  // ---------------- COSMETICS ----------------
  {
    slug: 'frame_poseidon',
    name: "Poseidon's Trident Avatar Frame",
    description: 'Exclusive ocean-themed frame for your MoveX athlete profile.',
    category: 'COSMETIC', rarity: 'EPIC', iconEmoji: '🔱', icon: '🔱',
    trophyCost: 150, athleteMode: 'BOTH', metadata: { frame_slug: 'poseidon' },
  },
  {
    slug: 'frame_wave_runner',
    name: 'Wave Runner Avatar Frame',
    description: 'Limited wave-styled frame with animated shimmer.',
    category: 'COSMETIC', rarity: 'LEGENDARY', iconEmoji: '🌊', icon: '🌊',
    trophyCost: 500, athleteMode: 'BOTH', stock: 50,
    availableUntil: new Date('2026-12-31T23:59:59Z'),
    metadata: { frame_slug: 'wave_runner' },
  },
  {
    slug: 'aura_ocean',
    name: 'Ocean Energy Aura',
    description: 'Glowing blue aura around your avatar.',
    category: 'COSMETIC', rarity: 'RARE', iconEmoji: '✨', icon: '✨',
    trophyCost: 250, athleteMode: 'BOTH', metadata: { aura_slug: 'ocean' },
  },
  {
    slug: 'badge_poseidon_hub',
    name: 'Poseidon Hub Badge',
    description: 'Show your Hub pride on your profile card.',
    category: 'COSMETIC', rarity: 'UNCOMMON', iconEmoji: '🏅', icon: '🏅',
    trophyCost: 100, athleteMode: 'BOTH', metadata: { badge_slug: 'poseidon_hub' },
  },
  {
    slug: 'badge_regional_champion',
    name: 'Regional Champion Badge',
    description: 'Awarded to regional top contributors.',
    category: 'COSMETIC', rarity: 'EPIC', iconEmoji: '🥇', icon: '🥇',
    trophyCost: 400, athleteMode: 'BOTH', metadata: { badge_slug: 'regional_champion' },
  },

  // ---------------- BOOSTS ----------------
  {
    slug: 'boost_regional_24h',
    name: '24h Regional Energy Surge',
    description: 'Increase regional contribution from verified activities for 24h.',
    category: 'BOOST', rarity: 'RARE', iconEmoji: '⚡', icon: '⚡',
    trophyCost: 100, athleteMode: 'BOTH',
    metadata: { duration_hours: 24, multiplier: 1.5, target: 'regional_energy' },
  },
  {
    slug: 'boost_xp_24h',
    name: '24h XP Surge',
    description: 'Double XP earned from verified activities for 24h.',
    category: 'BOOST', rarity: 'RARE', iconEmoji: '⭐', icon: '⭐',
    trophyCost: 120, athleteMode: 'BOTH',
    metadata: { duration_hours: 24, multiplier: 2.0, target: 'xp' },
  },
  {
    slug: 'shield_streak_48h',
    name: 'Streak Shield (48h)',
    description: 'Protects your streak for 48h if you miss a day.',
    category: 'BOOST', rarity: 'EPIC', iconEmoji: '🛡️', icon: '🛡️',
    trophyCost: 200, athleteMode: 'BOTH',
    metadata: { duration_hours: 48, target: 'streak_protection' },
  },

  // ---------------- PARTNER ----------------
  {
    slug: 'voucher_sports_10',
    name: '10% Sports Voucher (Demo)',
    description: 'Demo voucher — partner integration pending.',
    category: 'PARTNER', rarity: 'UNCOMMON', iconEmoji: '🎟️', icon: '🎟️',
    trophyCost: 300, athleteMode: 'BOTH', stock: 100,
    availableUntil: new Date('2026-12-31T23:59:59Z'),
    metadata: { demo: true, partner: 'placeholder' },
  },
  {
    slug: 'voucher_nutrition_15',
    name: '15% Nutrition Partner Offer (Demo)',
    description: 'Demo partner reward — architecture ready for real API.',
    category: 'PARTNER', rarity: 'UNCOMMON', iconEmoji: '🥤', icon: '🥤',
    trophyCost: 350, athleteMode: 'BOTH', stock: 100,
    availableUntil: new Date('2026-12-31T23:59:59Z'),
    metadata: { demo: true, partner: 'placeholder' },
  },

  // ---------------- CLAN ----------------
  {
    slug: 'clan_banner_ocean',
    name: 'Clan Ocean Banner',
    description: 'Custom clan banner with ocean theme.',
    category: 'CLAN', rarity: 'RARE', iconEmoji: '🚩', icon: '🚩',
    trophyCost: 300, athleteMode: 'BOTH', metadata: { perk_slug: 'banner_ocean' },
  },

  // ---------------- EXPERIENCE ----------------
  {
    slug: 'exp_moment_template',
    name: 'Exclusive MoveX Moment Template',
    description: 'Unlock a premium MoveX Moment visual template.',
    category: 'EXPERIENCE', rarity: 'RARE', iconEmoji: '🎨', icon: '🎨',
    trophyCost: 180, athleteMode: 'BOTH', metadata: { template_slug: 'premium_v1' },
  },
  {
    slug: 'exp_limited_challenge',
    name: 'Special Challenge Access',
    description: 'Unlock access to a limited-time MoveX challenge.',
    category: 'EXPERIENCE', rarity: 'EPIC', iconEmoji: '🏁', icon: '🏁',
    trophyCost: 220, athleteMode: 'BOTH', stock: 25,
    availableUntil: new Date('2026-10-31T23:59:59Z'),
    metadata: { challenge_slug: 'summer_move_2026' },
  },
];

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    let created = 0;
    let skipped = 0;
    for (const r of REWARDS) {
      const exists = await Reward.findOne({ slug: r.slug });
      if (exists) { skipped++; continue; }
      await Reward.create(r);
      created++;
    }
    console.log(`✅ Seeded ${created} new rewards (${skipped} already existed).`);
  } catch (err) {
    console.error('Seed error:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
})();