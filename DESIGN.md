# Mr Electron design system

## Product point of view

Mr Electron is a calm, practical science classroom for primary and preparatory students. The public landing page is a short orientation layer: it explains the path through grades, terms, chapters, lessons, and manually activated access, then sends each visitor to the correct app. It does not sell courses or pretend to be a marketplace.

## Landing direction

The landing surface uses an open lab notebook as its own visual world. Paper surfaces, teal ink, gold measurement marks, orbit geometry, and field-note rows make the curriculum feel observable and structured without depending on course photography or decorative stock imagery.

The first viewport should answer three questions quickly:

1. What is this? A science platform for Mr Electron's students.
2. How is it organized? Nine grades, two terms, chapters, and lessons.
3. What should I do? Log in, register, or open the teacher panel.

## Tokens

```text
ink       #102d2f  primary text and dark science field
teal      #0f6b67  actions, links, and active curriculum state
teal-dark #073e40  hero field and high-contrast surfaces
paper     #f5f0e6  notebook and page background
gold      #d49a3a  measurements, highlights, and attention marks
line      #c7d4cd  quiet boundaries
muted     #607270  secondary copy
display   Cairo, sans-serif
mono      IBM Plex Mono, monospace
```

## Composition rules

- Use strong asymmetry: a dark science field paired with a paper curriculum sheet.
- Use one clear accent color for actions; gold is a measurement/highlight color, not a second button system.
- Keep curriculum information in rows and compact cards so the hierarchy stays scannable on mobile.
- Avoid course thumbnails, price badges, fake ratings, and generic SaaS gradients.
- Keep Arabic copy direct and specific; explain the classroom access model plainly.

## Responsive behavior

- At desktop widths, keep the hero as a two-part spread with the lab sheet visible in the first viewport.
- At narrow widths, stack the spread, preserve the notebook border, and keep the primary login/register actions reachable without horizontal scrolling.
- Respect `prefers-reduced-motion`; orbit and reveal effects are enhancements, not required information.

## App relationship

The landing page is a static router to the student and admin static apps. Student and admin share the same teal/ink language but are task surfaces: navigation, data tables, lessons, exams, and access controls take priority over marketing composition.
