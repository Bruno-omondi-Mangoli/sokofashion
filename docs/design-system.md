# Design system

## Concept

The interface borrows from the parts of a kanga cloth. The pindo is the woven border, the centre is a quiet field, and the ujumbe is a short saying. The border is the one bold element and everything else stays calm.

## Rules

- Colours, fonts and type sizes come from the tokens in src/app/globals.css. Never write a raw hex colour in a component.
- Every text and background pair is checked by src/config/design-tokens.test.ts. Add a pair there when you add a colour.
- Display font (Young Serif) is for headings and brand moments only. Body font (Atkinson Hyperlegible Next) is for everything else.
- Touch targets are at least 48 pixels tall.
- Use the Pindo band at the top of a page and the kanga frame on one hero or empty state per page. Never more.
- Motion is rare. The only motion is the border weaving in once on the home page, plus small press feedback on buttons. Respect reduced motion.
- Errors say what went wrong and how to fix it. Empty screens say what to do next. Buttons name the action, such as Save changes.
- Use full class names in components. Class names built from pieces, such as bg- plus a variable, are not generated.
- Signed in pages use AppShell. Sign in pages use AuthShell. Group related content in a Card, show roles and statuses with a Badge, and give every page a loading, error and not found fallback.

## Two moods

- Dashboard: calm, fast, high contrast, thumb friendly. Mostly paper and sand with indigo actions.
- Storefront: expressive and editorial. Each shop will pick an accent colour within limits, and the contrast helper in src/lib/contrast.ts will refuse unreadable choices.

## Live guide

Run the app and open /design. It is hidden in production.

## Swahili text

All Swahili sayings must be confirmed by a Swahili speaker before the pilot.
