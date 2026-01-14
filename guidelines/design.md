# Design System Specification

## Project Overview

Design a modern, production-ready interface using **Aurora Gradient** aesthetic principles with a **ScrollyTelling** layout structure. This specification provides comprehensive guidelines for visual design, component styling, and implementation details.

---

## 1. Visual Aesthetic: Aurora Gradient

**Description:** Flowing, ethereal color transitions

**Visual Characteristics:**
Smooth color transitions, animated gradients, soft glows, dreamy atmosphere

**Implementation Approach:**
background: linear-gradient with 3+ colors, subtle animation, filter: blur for glow effects

**Design Principles:**
- Maintain visual consistency across all interface elements
- Every component should reflect the aurora gradient aesthetic
- Balance aesthetics with usability and accessibility
- Use motion and transitions sparingly but purposefully

---

## 2. Color System: Coral Reef

**Palette Mood:** vibrant • tropical • warm

### Color Definitions

- **Primary Dark** `#134E4A` - Main headings, primary text, dark backgrounds
- **Primary** `#0D9488` - Secondary text, borders, interactive elements
- **Accent** `#2DD4BF` - CTAs, links, highlights, focus states
- **Secondary** `#F472B6` - Subtle backgrounds, disabled states, dividers
- **Background** `#FDF2F8` - Main background, card surfaces, input fields

### Usage Guidelines

**Text Hierarchy:**11418d
- H1/Hero: #134E4A at 48-72px
- H2/Section: #0D9488 at 32-40px
- H3/Subsection: #0D9488 at 24-28px
- Body: #0D9488 at 16-18px
- Caption: #F472B6 at 14px

**Interactive Elements:**
- Primary CTA: Background #2DD4BF, white text, hover darken 10%
- Secondary CTA: Border #0D9488, transparent bg, hover fill with #FDF2F8
- Links: #2DD4BF with underline on hover
- Focus States: 2px outline using #2DD4BF

---

## 3. Layout: ScrollyTelling

**Structure:** Immersive scroll-driven narrative with animations triggered on scroll

### Layout Specifications

**Grid System:**
- Desktop: 12-column grid, 1200px max-width, 24px gutters
- Tablet: 8-column grid, 768px max-width, 16px gutters  
- Mobile: 4-column grid, 100% width, 16px gutters

**Spacing Scale:**
- xs: 4px - tight element spacing
- sm: 8px - compact component spacing
- md: 16px - default component spacing
- lg: 24px - section spacing
- xl: 48px - major section breaks
- 2xl: 96px - hero section padding

**Breakpoints:**
- Mobile: 320px - 767px
- Tablet: 768px - 1023px
- Desktop: 1024px+

---

## 4. Hero Section Design

### Recommended Hero: Immersive Full-Width

**Layout Structure:**
- Full viewport height (min-height: 100vh)
- Background: #134E4A with subtle gradient to #0D9488
- Content: Centered vertically and horizontally
- Maximum content width: 800px

**Content Hierarchy:**
1. Navigation bar (80px height, transparent background with blur)
2. Main headline (64px font, #FDF2F8, bold weight)
3. Subheadline (24px font, #F472B6, regular weight)
4. Primary CTA (56px height, #2DD4BF background)
5. Secondary CTA (56px height, text-only with underline)

**Visual Enhancements:**
- Add subtle aurora gradient effects to hero background
- Animate elements on scroll (fade-in with slight upward movement)
- Optional: Hero image/illustration on right side (40% width)

---

## 5. Component Library

### Buttons

**Primary Button:**
```css
background: #2DD4BF
color: #FFFFFF
padding: 14px 32px
font-size: 16px
font-weight: 600
border-radius: 8px

transition: all 0.2s ease
hover: transform scale(1.02), brightness 110%
```

**Secondary Button:**
```css
background: transparent
color: #0D9488
border: 2px solid #0D9488
padding: 14px 32px
hover: background #FDF2F8, color #134E4A
```

### Cards

```css
background: #FDF2F8
border: 1px solid #F472B6

box-shadow: 0 2px 8px rgba(0,0,0,0.08);
border-radius: 12px
padding: 24px
hover: translateY(-4px), shadow increase
```

### Input Fields

```css
background: #FDF2F8
border: 2px solid #F472B6
padding: 12px 16px
font-size: 16px
border-radius: 6px
focus: border-color #2DD4BF, outline 2px #2DD4BF
```

### Navigation

```css
height: 72px
background: #FDF2F8
border-bottom: 1px solid #F472B6
links: #0D9488, hover #2DD4BF
logo: 32px height
```

---

## 6. Typography System

**Font Pairing:** Quicksand + Open Sans
- Headings: Quicksand (Weight: 600)
- Body Text: Open Sans (Weight: 400)

**Implementation:**
```css
/* Import from Google Fonts */
@import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@600&family=Open+Sans:wght@400&display=swap');

/* Apply to elements */
h1, h2, h3, h4, h5, h6 {
  font-family: 'Quicksand', serif;
  font-weight: 600;
}

body, p, span, div {
  font-family: 'Open Sans', sans-serif;
  font-weight: 400;
}
```

**Scale:**
- Hero: 72px / 1.1 line-height / -0.02em letter-spacing
- H1: 48px / 1.2 line-height / -0.01em letter-spacing  
- H2: 36px / 1.3 line-height / -0.01em letter-spacing
- H3: 28px / 1.4 line-height / normal letter-spacing
- Body Large: 18px / 1.6 line-height
- Body: 16px / 1.6 line-height
- Small: 14px / 1.5 line-height

---

## 7. Animation & Interaction

**Timing Functions:**
- Quick interactions: 150ms ease-out
- Standard transitions: 250ms ease-in-out  
- Complex animations: 400ms cubic-bezier(0.4, 0, 0.2, 1)

**Hover States:**
- Buttons: scale(1.02) + brightness increase
- Cards: translateY(-4px) + shadow expansion
- Links: color change + underline animation
- Images: scale(1.05) with overflow hidden

**Loading States:**
- Skeleton screens using #F472B6
- Spinner using #2DD4BF
- Progress bars: gradient from #0D9488 to #2DD4BF

---

## 8. Responsive Behavior

**Mobile Optimizations:**
- Adapt ScrollyTelling to single column on mobile
- Reduce font sizes by 20% on mobile
- Increase touch targets to minimum 44x44px
- Simplify navigation to hamburger menu
- Reduce spacing scale by 25%

**Tablet Adaptations:**
- 2-column layouts where appropriate
- Maintain desktop aesthetic with adjusted spacing
- Touch-friendly but retain desktop complexity

---

## 9. Accessibility Requirements

- Color contrast ratio minimum 4.5:1 for text
- Focus indicators on all interactive elements (2px outline #2DD4BF)
- Keyboard navigation support throughout
- ARIA labels for icon buttons
- Skip navigation links
- Reduced motion alternatives for animations

---

## 10. Implementation Checklist

- [ ] Set up color variables in CSS/Tailwind config
- [ ] Configure typography scale
- [ ] Implement ScrollyTelling base structure
- [ ] Create reusable component library
- [ ] Apply Aurora Gradient effects consistently
- [ ] Test responsive breakpoints
- [ ] Validate accessibility with WAVE/axe
- [ ] Optimize performance (Lighthouse score 90+)
- [ ] Cross-browser testing (Chrome, Safari, Firefox)
- [ ] Implement loading states and error handling

---

**Design System Generated:** January 14, 2026