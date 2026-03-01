<script setup>
import { ref } from 'vue';
import { SciNotebook } from '@velo-sci/notebook-vue';
import '@velo-sci/notebook-core/styles/index.css';

const notebook = ref({
  id: 'doc-1',
  version: 1,
  cells: [
    { id: 'c1', type: 'markdown', source: 'Vue Integration', metadata: {} }
  ]
});

function handleNotebookChange(updatedData) {
  notebook.value = updatedData;
}
</script>

<template>
  <div class="editor-container" style="height: 100vh;">
    <!-- Vue wrapper maps onChange to component events or v-model depending on implementation -->
    <SciNotebook 
      :notebook="notebook" 
      @change="handleNotebookChange" 
      theme="light" 
    />
  </div>
</template>
