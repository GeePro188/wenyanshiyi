<script setup>
import { ref, computed, inject } from 'vue'
import { ChevronDown, Upload, Trash2 } from 'lucide-vue-next'
import { useVocabulary } from '../composables/useVocabulary.js'

const navigateToSearch = inject('navigateToSearch', () => {})

const { vocabularies, activeVocabId, setActiveVocab, getAllWords, getContentWords, getFunctionWords, importVocab, deleteImportedVocab } = useVocabulary()

const showVocabPicker = ref(false)
const showImport = ref(false)
const activeFilter = ref('all')
const importError = ref('')
const importSuccess = ref('')

const activeVocabName = computed(() => {
  const v = vocabularies.value.find((v) => v.id === activeVocabId.value)
  return v ? v.name : ''
})

const filters = computed(() => {
  const all = getAllWords(); const content = getContentWords(); const func = getFunctionWords()
  return [
    { key: 'all', label: `全部 (${all.length})` },
    { key: 'content', label: `实词 (${content.length})` },
    { key: 'func', label: `虚词 (${func.length})` },
  ]
})

const filteredWords = computed(() => {
  if (activeFilter.value === 'content') return getContentWords()
  if (activeFilter.value === 'func') return getFunctionWords()
  return getAllWords()
})

function selectVocab(id) { setActiveVocab(id); showVocabPicker.value = false }

function handleFileImport(e) {
  importError.value = ''; importSuccess.value = ''
  const file = e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (ev) => {
    try {
      const json = JSON.parse(ev.target.result)
      if (json.vocabularies && Array.isArray(json.vocabularies)) {
        let count = 0
        for (const v of json.vocabularies) {
          if (importVocab(v)) count++
        }
        if (count > 0) importSuccess.value = `成功导入 ${count} 个词库！`
        else importError.value = '未识别到有效词库'
      } else if (json.name && json.words) {
        if (importVocab(json)) importSuccess.value = `成功导入「${json.name}」！`
        else importError.value = '词库格式无效'
      } else {
        importError.value = 'JSON 格式不符合词库标准'
      }
    } catch (err) {
      importError.value = 'JSON 解析失败，请检查文件格式'
    }
  }
  reader.readAsText(file)
  e.target.value = ''
}

function removeVocab(vocab) {
  if (vocab.source !== 'imported') return
  if (confirm(`确定要删除词库「${vocab.name}」吗？`)) {
    deleteImportedVocab(vocab.id)
  }
}

function goToWord(word) { navigateToSearch(word) }
</script>

<template>
  <div class="px-6 pt-4 pb-24">
    <div class="flex items-center gap-3 mb-4">
      <div class="relative flex-1">
        <button @click="showVocabPicker = !showVocabPicker"
          class="flex items-center gap-2 bg-white rounded-xl px-4 py-3 card-shadow w-full">
          <span class="text-sm font-medium text-ink">{{ activeVocabName }}</span>
          <ChevronDown class="w-4 h-4 text-ink-fade ml-auto" :class="{ 'rotate-180': showVocabPicker }" />
        </button>
        <div v-if="showVocabPicker"
          class="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl card-shadow overflow-hidden z-30">
          <button v-for="v in vocabularies" :key="v.id" @click="selectVocab(v.id)"
            class="w-full text-left px-4 py-3 text-sm transition-colors flex items-center justify-between"
            :class="activeVocabId === v.id ? 'bg-cinnabar/5 text-cinnabar font-medium' : 'text-ink-light hover:bg-gray-50'">
            <div>
              <p>{{ v.name }}</p>
              <p class="text-xs text-ink-fade mt-0.5">{{ v.wordCount }} 词</p>
            </div>
            <button v-if="v.source === 'imported'" @click.stop="removeVocab(v)" class="text-ink-fade hover:text-cinnabar p-1">
              <Trash2 class="w-3.5 h-3.5" />
            </button>
          </button>
        </div>
      </div>
      <button @click="showImport = !showImport"
        class="shrink-0 p-3 bg-white rounded-xl card-shadow hover:bg-gray-50 transition-colors">
        <Upload class="w-5 h-5 text-ink-fade" />
      </button>
    </div>

    <div v-if="showImport" class="bg-white rounded-2xl p-5 card-shadow mb-4">
      <h3 class="text-sm font-medium text-ink mb-3">导入词库</h3>
      <p class="text-xs text-ink-fade mb-3">支持标准词库 JSON 格式。格式要求：<code class="bg-gray-100 px-1 rounded">{"name": "词库名", "words": [{"word": "字", "basic_meaning": "释义", "polysemy": [...]}]}</code></p>
      <label class="block w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-center cursor-pointer hover:border-cinnabar/30 transition-colors">
        <span class="text-sm text-ink-fade">点击选择 JSON 文件</span>
        <input type="file" accept=".json" class="hidden" @change="handleFileImport">
      </label>
      <p v-if="importError" class="text-xs text-cinnabar mt-2">{{ importError }}</p>
      <p v-if="importSuccess" class="text-xs text-bamboo mt-2">{{ importSuccess }}</p>
    </div>

    <div class="flex gap-4 mb-4 border-b border-gray-100 pb-3">
      <button v-for="filter in filters" :key="filter.key" @click="activeFilter = filter.key"
        class="text-sm pb-3 -mb-[13px] transition-colors"
        :class="activeFilter===filter.key?'font-medium text-cinnabar border-b-2 border-cinnabar':'text-ink-fade'"
      >{{ filter.label }}</button>
    </div>

    <div class="space-y-2">
      <div v-for="w in filteredWords" :key="w.word" @click="goToWord(w.word)"
        class="bg-white rounded-xl px-5 py-4 card-shadow flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow">
        <div class="flex items-center gap-3">
          <span class="text-2xl font-serif font-bold text-ink w-10 text-center">{{ w.word }}</span>
          <div>
            <p class="text-sm text-ink">{{ w.basic_meaning.slice(0, 16) }}</p>
            <div class="flex gap-1.5 mt-0.5">
              <span v-for="tag in w.tags" :key="tag.label" class="text-[10px] px-1.5 py-0.5 rounded"
                :class="tag.color==='indigo'?'bg-indigo/10 text-indigo':tag.color==='cinnabar'?'bg-cinnabar/10 text-cinnabar':'bg-gray-100 text-ink-light'"
              >{{ tag.label }}</span>
            </div>
          </div>
        </div>
        <span class="text-ink-fade text-xs">›</span>
      </div>
    </div>
  </div>
</template>
