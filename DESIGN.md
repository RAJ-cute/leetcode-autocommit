---
name: LeetCode AutoCommit
description: A personal coding archive presented as a collection of original study companions.
colors:
  ivory-canvas: "#fffaf4"
  white-card: "#ffffff"
  navy-ink: "#25305d"
  slate-copy: "#626b83"
  quiet-label: "#737a92"
  lilac-rail: "#f0eafa"
  lavender-feature: "#e9e3fb"
  lavender-selection: "#f4effc"
  card-line: "#e8e1eb"
  candy-pink: "#ed6696"
  candy-pink-hover: "#db4b82"
  mint-success: "#44ab88"
  coral-failure: "#d96574"
  amber-pending: "#e2ac5b"
  violet-focus: "#9b6cce"
typography:
  display:
    fontFamily: "Fredoka Variable, Manrope Variable, sans-serif"
    fontSize: "46px"
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Fredoka Variable, Manrope Variable, sans-serif"
    fontSize: "42px"
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Fredoka Variable, Manrope Variable, sans-serif"
    fontSize: "24px"
    fontWeight: 600
    lineHeight: "30px"
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Manrope Variable, sans-serif"
    fontSize: "14px"
    lineHeight: "21px"
  label:
    fontFamily: "Manrope Variable, sans-serif"
    fontSize: "11px"
    fontWeight: 700
    lineHeight: "16px"
rounded:
  control: "10px"
  notice: "12px"
  tally: "14px"
  card: "15px"
  panel: "16px"
  feature: "18px"
spacing:
  tight: "4px"
  small: "10px"
  card-gap: "14px"
  card-inset: "16px"
  panel-inset: "28px"
  feature-inset: "36px"
components:
  button-primary:
    backgroundColor: "{colors.candy-pink}"
    textColor: "{colors.white-card}"
    rounded: "{rounded.control}"
    padding: "9px 16px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.candy-pink-hover}"
  button-ghost:
    backgroundColor: "{colors.white-card}"
    textColor: "{colors.navy-ink}"
    rounded: "{rounded.control}"
    padding: "9px 16px"
    height: "44px"
  collection-card:
    backgroundColor: "{colors.white-card}"
    textColor: "{colors.navy-ink}"
    rounded: "{rounded.card}"
  input-search:
    backgroundColor: "{colors.white-card}"
    textColor: "{colors.navy-ink}"
    rounded: "{rounded.control}"
  navigation-active:
    backgroundColor: "{colors.white-card}"
    textColor: "{colors.navy-ink}"
    rounded: "{rounded.control}"
---

# Design System: LeetCode AutoCommit

## Overview

**Creative North Star: "The Study Companion Shelf"**

Accepted problems appear as a personal collection, each paired with one of six original plush study companions. Soft color and friendly character shapes make the archive memorable; titles, code, notes, and sync state stay legible and truthful. The canvas feels warm and quiet, while pink actions and ribbons give the collection a clear visual beat.

This identity extends from the dashboard and library into the popup and setup flow. The mascot is a supporting visual cue, never a substitute for a problem name, repository state, or recovery action. A stable problem ID selects its character across collection views.

**Key Characteristics:**
- Warm ivory canvas and lavender navigation with white working surfaces.
- Fredoka headings above compact Manrope controls and data.
- Original soft plush art, small rank ribbons, and gently lifting cards.
- Mint, amber, and coral status cues accompanied by explicit text.

## Colors

The palette joins warm paper and dark navy to candy pink actions, lavender framing, and restrained state colors.

### Primary
- **Candy Pink** drives primary buttons and collection ribbons; the deeper hover shade signals interaction.

### Secondary
- **Lavender Feature** holds the collection introduction and onboarding illustration; **Lilac Rail** separates persistent navigation from the ivory content canvas.

### Tertiary
- **Mint Success**, **Amber Pending**, and **Coral Failure** mark upload outcomes and difficulty cues. State labels always accompany colored dots.

### Neutral
- **Ivory Canvas** is the page ground; **White Card** holds controls, collection cards, and data panels.
- **Navy Ink** carries headings and principal values. **Slate Copy** holds explanatory text; **Quiet Label** holds secondary metadata. **Card Line** defines surface edges.

**The Truthful Status Rule.** Color reinforces a visible state label and a relevant recovery action; it never implies a GitHub upload succeeded merely because a solution was saved locally.

## Typography

**Display Font:** Fredoka Variable (Manrope Variable fallback).  
**Body Font:** Manrope Variable (sans-serif fallback).  
**Label Font:** Manrope Variable.

**Character:** Rounded display lettering gives the collection its friendly identity. Precise utility text keeps dense solution metadata easy to scan.

### Hierarchy
- **Display:** Large collection statements in the feature panel; scales down on small screens.
- **Headline:** Page and detail headings.
- **Title:** Section headings, with a smaller Fredoka size for individual problem cards.
- **Body:** Short descriptive copy and guidance.
- **Label:** Compact navigation, metadata, and status text; uppercase is reserved for utility labels, not problem titles.

**The Two Voice Rule.** Fredoka names the collection and its entries; Manrope handles controls, guidance, code metadata, and state.

## Layout

The desktop app uses a fixed lavender rail (242px) beside a fluid content area. The top bar is 72px high. The main content is capped at 1540px, with horizontal padding that grows from 24px to 48px. The overview begins with a lavender feature panel, follows with a compact progress strip, then a three column collection grid; status and analytics sit below. The library reuses the collection grid with filters above it.

At 900px the grid becomes two columns and supporting panels stack. At 700px collection cards become one column with compact horizontal art, content padding becomes 16px, the feature heading and art shrink, and tally cells form two columns. At 390px the mascot shifts to the feature corner. The popup has its own compact 390px canvas and keeps its primary action and connection status within 600px of height. Keep primary actions and actual upload state visible in the first viewport where space permits.

## Elevation & Depth

The system uses pale surfaces and fine borders at rest. Active navigation has a faint shadow; collection cards gain a short lifted shadow only on hover. Plush art has a soft grounding shadow that belongs to the illustration, not the card.

### Shadow Vocabulary
- **Active navigation** (`0 5px 12px -10px #44386e`): quiet separation for the selected destination.
- **Collection hover** (`0 16px 24px -20px #433c6b99`): momentary lift for an opening card.
- **Hero character** (`drop-shadow(0 18px 18px #675c8128)`): a soft floor for the mint companion.

**The Resting Shelf Rule.** Cards remain flat and bordered until interaction; a shadow marks an actionable hover state.

## Shapes

Controls have modest rounded corners, while panels and collection cards are more generously curved. The feature panel has the broadest radius. Collection rank ribbons hang from the upper edge with rounded lower corners. Soft character silhouettes provide organic contrast to the orderly card grid and conventional fields.

## Components

### Buttons
- **Primary:** Candy Pink fill, white bold Manrope text, comfortable 44px minimum height, and 10px corners. Hover darkens and lifts 2px; active press scales to 98%.
- **Ghost:** White fill, navy text, and a lavender border. Hover warms to a pale violet surface.
- **Focus:** A 3px violet outline with a 3px offset remains visible across the app.

### Cards / Containers
- **Collection cards:** White, 15px corners, fine border, rank ribbon, character art, then factual problem title, difficulty, language or topic, and upload state. Problem titles wrap in full; do not ellipsize them. Hover lifts 5px and changes border and shadow. Cards open the existing problem detail.
- **Panels:** White with 16px corners and fine borders; use 28px interior padding on desktop.
- **Data panels:** Navy values and slate labels on white; charts use mint, lavender, and pink with visible numeric legends.
- **Feature panel:** Lavender with 18px corners, generous padding, one mint companion, and the collection's main action.

### Inputs / Fields
- **Style:** White fill, lavender gray stroke, 9–10px corners, navy typed text, and subdued placeholder.
- **Focus:** Border turns violet, complemented by the shared visible focus outline.
- **Selected mode:** A pale lavender field and violet border make the chosen commit mode explicit.

### Navigation
- **Desktop rail:** Lavender ground with compact Manrope labels. The active item sits on white with a subtle border and shadow; hover receives a deeper lavender wash.
- **Mobile:** A menu control replaces the persistent rail while the top bar keeps the current location and sync access visible.

### Status and notices
- **Status:** A colored dot plus text describes connected, locally saved, pending, completed, or failed work.
- **Notice:** Soft coral surface for errors and mint surface for success. Failed uploads expose a retry action near the main collection message.

## Do's and Don'ts

### Do:
- **Do** reuse the six original companions through stable problem ID assignment so the same problem remains recognizable.
- **Do** pair decorative art with the real problem title, code access, and explicit GitHub state.
- **Do** keep the ivory, navy, lavender, pink, and mint roles consistent across dashboard, popup, and onboarding.
- **Do** honor reduced motion preference and retain visible keyboard focus.

### Don't:
- **Don't** replace solution evidence with invented achievements or vague success claims.
- **Don't** use a mascot alone to communicate difficulty, sync state, or the next recovery action.
- **Don't** turn every static panel into a raised card; reserve the lifted treatment for interactive collection entries.
