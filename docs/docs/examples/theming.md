# Theming and Styling

SciNotebook comes with a flexible theming system and uses CSS variables for easy customization.

## Built-in Themes

You can easily toggle between the built-in `light` and `dark` themes.

```tsx
<SciNotebook 
  notebook={myNotebook} 
  theme="dark" // or "light"
/>
```

## Customizing with CSS Variables

The library uses a set of CSS variables that you can override in your own stylesheets to match your application's branding.

```css
:root {
  /* Change the primary brand color to a custom cyan */
  --sci-nb-brand: #00f2ff;
  --sci-nb-accent: #38bdf8;
  
  /* Customize cell background */
  --sci-nb-cell-bg: #f8fafc;
  --sci-nb-cell-border: transparent;
  
  /* Selection colors */
  --sci-nb-selection: rgba(0, 242, 255, 0.1);
}

.dark {
  --sci-nb-cell-bg: #0f172a;
  --sci-nb-text: rgba(255, 255, 255, 0.9);
}
```

## UI Customization

You can pass a `className` to the `SciNotebook` component to apply custom layouts.

```tsx
<SciNotebook 
  notebook={myNotebook} 
  className="my-custom-notebook-layout"
/>
```

```css
.my-custom-notebook-layout .sci-nb-cells {
  gap: 2rem; /* Increase spacing between cells */
  max-width: 800px;
  margin: 0 auto;
}
```
