## Priority 1: Core Health Score System (Launch Critical)

### 1. Health Score Gauge

**Format:** SVG (scalable, animation-ready) **Specifications:**

- Circular progress gauge with 4-tier gradient
    - 0-25: Bronze (`#CD7F32` to `#B8860B`)
    - 26-50: Silver (`#C0C0C0` to `#E8E8E8`)
    - 51-75: Gold (`#FFD700` to `#FFA500`)
    - 76-100: Platinum (`#E5E4E2` to `#00D4FF`)
- Center display: current score (large number)
- Tick marks at 25, 50, 75, 100
- Smooth animation support for score changes
- Sizes: Responsive SVG, min 200x200px rendered

### 2. Tier Badges

**Format:** PNG with transparency + SVG versions **Sizes:** 64x64, 128x128, 256x256 (for retina displays)

**Bronze Badge:**

- Earthy copper tones (`#CD7F32`)
- Simple shield or medal shape
- Subtle texture (brushed metal effect)
- "BRONZE" text on ribbon below

**Silver Badge:**

- Shiny metallic silver (`#C0C0C0`)
- More refined shield/medal
- Light reflections/highlights
- "SILVER" text

**Gold Badge:**

- Glowing gold (`#FFD700`)
- Elegant design with slight shimmer
- Small sparkle effects in corners
- "GOLD" text

**Platinum Badge:**

- Diamond/crystal effect (`#E5E4E2` with blue highlights)
- Premium look with gemstone quality
- Animated sparkle overlay (optional Lottie)
- "PLATINUM" text

## Priority 2: Streak System

### 3. Streak Fire Icons

**Format:** PNG sequences or Lottie animation **Sizes:** 32x32, 48x48, 64x64

**Variants:**

- `streak-0.png` - No flame (gray/empty)
- `streak-1-2.png` - Small spark (orange)
- `streak-3-6.png` - Small flame (red-orange)
- `streak-7-13.png` - Medium flame (yellow-orange)
- `streak-14-29.png` - Large flame (golden)
- `streak-30plus.png` - Inferno (rainbow/special)

**Additional Icons:**

- `streak-shield.png` - Shield icon (for streak protection feature)
- `streak-warning.png` - Broken chain or flickering flame (streak at risk)
- `streak-frozen.png` - Iced-over flame (streak freeze power-up)

## Priority 3: Mood Weather System

### 4. Weather Mood Icons

**Format:** SVG (for color customization) or PNG **Sizes:** 48x48, 72x72 **Style:** Friendly, rounded, minimal (matching Meedi8 aesthetic)

**Icons needed:**

- ☀️ `mood-sunny.svg` - Bright sun, happy feeling
- ⛅ `mood-cloudy.svg` - Partly cloudy, neutral/mixed
- 🌧️ `mood-rainy.svg` - Rain clouds, sad/down
- ⛈️ `mood-stormy.svg` - Dark clouds with lightning, angry/anxious
- 🌫️ `mood-foggy.svg` - Fog/mist, confused/uncertain
- 🌈 `mood-rainbow.svg` - Rainbow (post-resolution, hopeful)

**Mood Grid Display:**

- `mood-grid-bg.svg` - 7-day calendar grid background
- Weather icons populate grid cells

## Priority 4: Achievement Badges

### 5. Achievement Icons (25 badges minimum)

**Format:** PNG with transparency **Sizes:** 64x64, 128x128 **Border System:** Rarity indicated by border color/style

**Communication Category (5 badges):**

- `achievement-first-words.png` - Speech bubble
- `achievement-active-listener.png` - Ear with sound waves
- `achievement-clear-communicator.png` - Megaphone/microphone
- `achievement-conversationalist.png` - Multiple speech bubbles
- `achievement-master-speaker.png` - Crown + microphone

**Empathy Category (5 badges):**

- `achievement-first-empathy.png` - Single heart
- `achievement-understanding.png` - Hands holding heart
- `achievement-compassion.png` - Glowing hearts
- `achievement-emotional-intelligence.png` - Brain + heart fusion
- `achievement-empathy-master.png` - Rainbow heart with rays

**Growth Category (5 badges):**

- `achievement-first-step.png` - Seedling sprout
- `achievement-growing-strong.png` - Small plant
- `achievement-blooming.png` - Flower opening
- `achievement-flourishing.png` - Full plant with flowers
- `achievement-growth-master.png` - Tree with golden leaves

**Commitment Category (5 badges):**

- `achievement-first-session.png` - Calendar with checkmark
- `achievement-weekly-warrior.png` - 7-day streak calendar
- `achievement-monthly-champion.png` - 30-day ribbon
- `achievement-dedicated.png` - Trophy + calendar
- `achievement-commitment-master.png` - Golden crown + infinity symbol

**Mindfulness Category (5 badges):**

- `achievement-first-breath.png` - Single breath wave
- `achievement-calm-found.png` - Lotus flower
- `achievement-centered.png` - Meditation pose
- `achievement-mindful.png` - Brain with peaceful waves
- `achievement-zen-master.png` - Mountain with sun

**Rarity Border Overlays:**

- `border-common.png` - Bronze/copper border
- `border-rare.png` - Silver border
- `border-epic.png` - Purple/gold border with shimmer
- `border-legendary.png` - Rainbow animated border (Lottie)

## Priority 5: Breathing Exercise Visuals

### 6. Breathing Pattern Icons

**Format:** SVG (for animation) or Lottie **Sizes:** Responsive, min 200x200px

**Box Breathing:**

- `breathing-box.svg` - Square path animation
- Shows: Inhale (4s) → Hold (4s) → Exhale (4s) → Hold (4s)
- Animated dot travels along square edges

**4-7-8 Breathing:**

- `breathing-478.svg` - Circle with segments
- Shows: Inhale (4s) → Hold (7s) → Exhale (8s)
- Numbered circles or segments light up

**Coherence Breathing:**

- `breathing-coherence.svg` - Wave pattern
- Shows: 5-second inhale, 5-second exhale
- Smooth sine wave animation

## Priority 6: UI Feedback Animations

### 7. Celebration & Feedback Effects

**Format:** Lottie JSON or GIF sequences **Durations:** 1-2 seconds

**Score Increase:**

- `score-increase.json` - Numbers floating up with sparkles
- Green color (`#7DD3C0`)
- Small particle effects

**Achievement Unlock:**

- `achievement-unlock.json` - Burst/explosion effect
- Badge slides in from top
- Confetti falls
- 2-second duration

**Streak Milestone:**

- `streak-milestone.json` - Fireworks burst
- Special effect for 7, 14, 30, 60, 100 days
- Multi-color celebration

**Level Up:**

- `level-up.json` - Tier badge transformation
- Morphs from current tier to next
- Shimmer/glow effect

**Empty States:**

- `empty-achievements.svg` - Locked trophy silhouette
- `empty-mood.svg` - Question mark weather icon
- `empty-streak.svg` - Unlit candle/flame outline

## Priority 7: Mascot (Optional but Recommended)

### 8. Meedi Character Expressions

**Format:** PNG with transparency **Sizes:** 128x128, 256x256 **Style:** Matches existing Meedi illustrations

**Expressions:**

- `meedi-encouraging.png` - Thumbs up, slight smile
- `meedi-celebrating.png` - Arms raised, big smile
- `meedi-concerned.png` - Gentle frown, hand on chin
- `meedi-sleepy.png` - Yawning, eyes closing (streak warning)
- `meedi-proud.png` - Medal around neck, beaming
- `meedi-thinking.png` - Hand on head, contemplative

**Usage:**

- Achievement toast notifications
- Empty state illustrations
- Tutorial/onboarding screens
- Streak warning messages

## Technical Specifications Summary

### File Formats:

- **SVG**: Gauges, icons that need scaling/color changes
- **PNG**: Badges, complex illustrations (2x retina versions)
- **Lottie**: Animations (JSON format)
- **GIF**: Simple animations (fallback for older browsers)

### Color Palette (from existing Meedi8 brand):

- Teal: `#7DD3C0` (primary brand color)
- Purple: `#CCB2FF` (secondary color)
- Light backgrounds: `#E8F9F5`, `#F5EFFF`
- Bronze: `#CD7F32`
- Silver: `#C0C0C0`
- Gold: `#FFD700`
- Platinum: `#E5E4E2` with blue (`#00D4FF`) accents

category-name-variant.extension
Examples:
- achievement-first-words-common.png
- streak-7-13-days.png
- mood-sunny.svg
- tier-badge-gold.png

frontend/public/assets/gamification/
├── badges/
│   ├── tier/
│   ├── achievement/
│   └── rarity-borders/
├── streak/
├── mood/
├── breathing/
├── animations/
│   ├── lottie/
│   └── gif/
├── gauge/
└── mascot/