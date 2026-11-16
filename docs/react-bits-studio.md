# React Bits + element upgrade workflow

## Browse and install

The Design System Studio > React Bits Studio includes a curated quick-start index. Choose a component, language (TypeScript/JavaScript), and styling variant (plain CSS/Tailwind), then copy the official shadcn registry command.

Example:

```bash
npx shadcn@latest add @react-bits/SplitText-TS-CSS
```

The registry is configured in `components.json`. The command installs component source into the project and adds dependencies declared by the registry. Review the generated source, imports, license and dependency changes before committing. Do not bulk-install the entire catalogue: many components are optional and some have substantial animation/WebGL dependencies.

Official documentation: https://reactbits.dev/get-started/installation

## Element-by-element upgrades

1. Open Design System Studio and enable the live page preview.
2. Click an element in the iframe to select its DOM selector.
3. Choose a suggested React Bits component in the inspector.
4. Save an upgrade plan and copy the install command.
5. Install and review the component source.
6. Migrate the selected page element to a registered React component slot, preserving its content, accessibility, responsive behavior and event handlers.
7. Test the page at desktop/tablet/mobile sizes before publishing.

### Important implementation boundary

The inspector can identify a rendered DOM element, but a browser DOM node is not the original React JSX source. Replacing arbitrary DOM with a React component at runtime is unsafe and brittle (React hydration, state, event handlers and server components can break). The current action therefore saves a selector-to-component upgrade plan; it does not silently rewrite page source. True one-click replacement requires pages to be migrated to explicit `StudioSlot`/component registry boundaries first.
