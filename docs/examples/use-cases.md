<script setup>
import { sampleNotebookData, cellTypesNotebook } from '../.vitepress/theme/notebooks'
</script>

# Use Cases

Explore various ways SciNotebook can be integrated and used in real-world scenarios.

## 1. Interactive Educational Content

SciNotebook is perfect for creating interactive textbooks or tutorials where students can modify code and equations in place.

<FrameworkDemo :notebook="sampleNotebookData" title="Education Demo" />

## 2. Component Documentation

You can use SciNotebook to document its own components or other libraries, providing live examples.

<FrameworkDemo :notebook="cellTypesNotebook" title="Feature Showcase" />

## 3. Data Science Reports

Embed notebooks directly into reports or dashboards to allow stakeholders to explore data dynamically.

::: tip Live Rendering
All examples above are fully interactive. Try editing the cells!
:::
