# React Bits + element upgrade workflow

## Browse and install

Design System Studio > React Bits Studio offers a curated quick-start index. Choose a component, language (TypeScript/JavaScript), and styling variant (plain CSS/Tailwind), then copy the official shadcn registry command.

```bash
npx shadcn@latest add @react-bits/SplitText-TS-CSS
```

The registry is configured in `components.json`. Registry commands copy component source into the project and add declared dependencies. Review generated source, imports, dependencies and license before committing. Avoid bulk-installing the full catalogue: components are optional and some carry animation/WebGL dependencies.

Official guide: https://reactbits.dev/get-started/installation

## Registered slots and one-click replacement

Registered slots now cover multiple page elements:

- Home: hero title, description, three feature cards and sign-in card
- Dashboard: header, hero banner, metrics strip, practice section and analytics section
- Quiz player: sticky toolbar, question workspace and question palette
- Resources: page header and subject browser Each slot is a stable React boundary with an ID, not a fragile CSS selector.

1. Open Design System Studio and enable the live page preview.
2. Click inside a registered slot. The inspector selects the nearest slot boundary.
3. Choose a built-in React Bits-compatible effect: SpotlightCard, Aurora, BlurText, GlareHover, TiltedCard or Magnet.
4. Click **Apply replacement now**. The slot updates immediately in the preview and live page while retaining its original children, links, buttons, state and event handlers.
5. Choose **Original component** or **Undo replacement** to revert.

Selections outside a registered slot remain style-editable but cannot use the one-click component swap. This is deliberate: a rendered DOM node is not its original React JSX source. Arbitrary runtime DOM replacement can break hydration, state, accessibility and event handlers. Extend coverage by wrapping additional page elements in `StudioSlot` and assigning stable IDs.

## Current scope

- One-click visual renderer swaps are implemented for registered slots and persist in the Design Studio configuration.
- The built-in effects are lightweight local implementations inspired by common React Bits interaction patterns; they are not automatic installation of every upstream React Bits component.
- The registry browser remains a curated index with copy-command support. It does not execute package installation on the server.
- Review responsive behavior, reduced-motion behavior and keyboard/accessibility before publishing.
