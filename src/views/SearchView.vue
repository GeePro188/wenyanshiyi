<script setup>
import { ref, watch } from 'vue'
import { Search, ArrowRightLeft } from 'lucide-vue-next'
import { useVocabulary } from '../composables/useVocabulary.js'

const props = defineProps({ initialQuery: { type: String, default: '' } })
const emit = defineEmits(['update:initialQuery'])
const { search, getByWord } = useVocabulary()

const searchQuery = ref(props.initialQuery)
const selectedWord = ref(null)
const popupWord = ref(null)
const popupData = ref(null)

function doSearch() {
  if (!searchQuery.value.trim()) { selectedWord.value = null; return }
  const results = search(searchQuery.value)
  selectedWord.value = results.length > 0 ? results[0] : null
}

function showPopup(wordName) { const w = getByWord(wordName); if (w) { popupWord.value = w.word; popupData.value = w } }
function closePopup() { popupWord.value = null; popupData.value = null }
function viewDetail() { if (popupWord.value) { searchQuery.value = popupWord.value; popupWord.value = null; popupData.value = null } }

watch(() => props.initialQuery, (val) => { if (val && val !== searchQuery.value) { searchQuery.value = val; doSearch(); emit('update:initialQuery', '') } })
watch(searchQuery, () => doSearch())
</script>

<template>
  <div class="px-6 pt-4 pb-24 relative">
    <h1 class="text-2xl font-serif font-medium text-ink mb-6">词语搜索</h1>

    <div class="relative mb-6">
      <Search class="w-5 h-5 text-ink-fade absolute left-4 top-1/2 -translate-y-1/2" />
      <input v-model="searchQuery" type="text"
        class="w-full bg-white/80 backdrop-blur-sm border border-gray-100 rounded-2xl py-3.5 pl-12 pr-4 text-base text-ink focus:outline-none focus:border-cinnabar/30 placeholder-ink-fade"
        placeholder="搜字词，探古今">
    </div>

    <template v-if="selectedWord">
      <div class="bg-white rounded-2xl p-6 card-shadow mb-4">
        <div class="flex items-baseline mb-4">
          <span class="text-5xl font-serif font-bold text-ink mr-4">{{ selectedWord.word }}</span>
        </div>
        <div class="flex gap-2 mb-1 flex-wrap">
          <span v-for="tag in selectedWord.tags" :key="tag.label" class="text-xs px-2.5 py-1 rounded-md"
            :class="tag.color==='indigo'?'bg-indigo/10 text-indigo':tag.color==='cinnabar'?'bg-cinnabar/10 text-cinnabar':'bg-gray-100 text-ink-light'"
          >{{ tag.label }}</span>
        </div>
      </div>

      <div class="bg-white rounded-2xl p-6 card-shadow mb-4">
        <h3 class="text-sm font-medium text-ink mb-4 flex items-center">
          <span class="w-1 h-4 bg-cinnabar rounded-full mr-2"></span>一词多义
        </h3>
        <div class="space-y-4">
          <div v-for="(sense, idx) in selectedWord.polysemy" :key="idx" class="border-l-2 border-cinnabar/30 pl-4">
            <p class="text-base text-ink font-medium mb-1">{{ idx + 1 }}. {{ sense.meaning }}</p>
            <div v-for="(ex, ei) in sense.examples" :key="ei" class="mb-1">
              <p class="text-sm text-ink-light leading-relaxed">{{ ex.sentence }}</p>
              <p class="text-xs text-ink-fade mt-0.5">{{ ex.source }}</p>
            </div>
          </div>
        </div>
      </div>

      <div v-if="selectedWord.ancient_modern_diff" class="bg-white rounded-2xl p-6 card-shadow mb-4">
        <h3 class="text-sm font-medium text-ink mb-4 flex items-center">
          <span class="w-1 h-4 bg-indigo rounded-full mr-2"></span>古今异义对比
        </h3>
        <div class="flex gap-4">
          <div class="flex-1 bg-cinnabar/5 rounded-xl p-4 text-center">
            <p class="text-xs text-ink-fade mb-2">古义</p>
            <p class="text-lg font-serif font-medium text-cinnabar">{{ selectedWord.ancient_modern_diff.ancient }}</p>
          </div>
          <div class="flex items-center text-ink-fade"><ArrowRightLeft class="w-4 h-4" /></div>
          <div class="flex-1 bg-indigo/5 rounded-xl p-4 text-center">
            <p class="text-xs text-ink-fade mb-2">今义</p>
            <p class="text-lg font-serif font-medium text-indigo">{{ selectedWord.ancient_modern_diff.modern }}</p>
          </div>
        </div>
      </div>

      <div v-if="selectedWord.synonyms?.length || selectedWord.near_synonyms?.length || selectedWord.antonyms?.length" class="bg-white rounded-2xl p-6 card-shadow mb-4">
        <h3 class="text-sm font-medium text-ink mb-4 flex items-center">
          <span class="w-1 h-4 bg-bamboo rounded-full mr-2"></span>关联词语
        </h3>
        <div v-if="selectedWord.synonyms?.length" class="mb-3">
          <p class="text-xs text-ink-fade mb-1">同义词</p>
          <div class="flex flex-wrap gap-2">
            <span v-for="syn in selectedWord.synonyms" :key="syn" @click.stop="showPopup(syn)"
              class="bg-bamboo/10 text-bamboo text-sm px-3 py-1 rounded-full cursor-pointer hover:bg-bamboo/20 transition-colors"
            >{{ syn }}</span>
          </div>
        </div>
        <div v-if="selectedWord.near_synonyms?.length" class="mb-3">
          <p class="text-xs text-ink-fade mb-1">近义词</p>
          <div class="flex flex-wrap gap-2">
            <span v-for="syn in selectedWord.near_synonyms" :key="syn" @click.stop="showPopup(syn)"
              class="bg-indigo/10 text-indigo text-sm px-3 py-1 rounded-full cursor-pointer hover:bg-indigo/20 transition-colors"
            >{{ syn }}</span>
          </div>
        </div>
        <div v-if="selectedWord.antonyms?.length">
          <p class="text-xs text-ink-fade mb-1">反义词</p>
          <div class="flex flex-wrap gap-2">
            <span v-for="ant in selectedWord.antonyms" :key="ant" @click.stop="showPopup(ant)"
              class="bg-gray-100 text-ink-light text-sm px-3 py-1 rounded-full cursor-pointer hover:bg-gray-200 transition-colors"
            >{{ ant }}</span>
          </div>
        </div>
      </div>

      <div v-if="selectedWord.notes" class="bg-white rounded-2xl p-6 card-shadow">
        <h3 class="text-sm font-medium text-ink mb-3 flex items-center">
          <span class="w-1 h-4 bg-ink rounded-full mr-2"></span>注解
        </h3>
        <p class="text-sm text-ink-light leading-relaxed">{{ selectedWord.notes }}</p>
      </div>
    </template>

    <div v-else-if="searchQuery.trim()" class="text-center py-12">
      <p class="text-ink-fade">未找到相关词语，试试其他关键词</p>
    </div>
    <div v-else class="text-center py-12">
      <p class="text-ink-fade text-sm">输入字词，探寻古今释义</p>
    </div>

    <div v-if="popupData" class="fixed inset-0 bg-black/20 z-50 flex items-center justify-center" @click.self="closePopup">
      <div class="bg-white rounded-2xl p-6 card-shadow mx-6 w-full max-w-[320px]">
        <p class="text-3xl font-serif font-bold text-ink mb-1">{{ popupData.word }}</p>
        <p class="text-sm text-ink-light mb-3">{{ popupData.basic_meaning }}</p>
        <div class="flex gap-2 mb-3 flex-wrap">
          <span v-for="tag in popupData.tags" :key="tag.label" class="text-xs px-2 py-0.5 rounded-md"
            :class="tag.color==='indigo'?'bg-indigo/10 text-indigo':tag.color==='cinnabar'?'bg-cinnabar/10 text-cinnabar':'bg-gray-100 text-ink-light'"
          >{{ tag.label }}</span>
        </div>
        <button @click="viewDetail" class="w-full py-2.5 accent-bg text-white rounded-xl text-sm font-medium accent-bg-hover transition-colors">查看详解</button>
      </div>
    </div>
  </div>
</template>
