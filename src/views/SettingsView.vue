<script setup>
import { inject, ref } from 'vue'
import { ChevronLeft, Info, Palette, Check, Database, FileUser } from 'lucide-vue-next'
import { useVocabulary } from '../composables/useVocabulary.js'
import { deleteStore, hasStore, countData } from '../utils/useIDB.js'

const navigateToProfile = inject('navigateToProfile', () => {})
const { themePreset, applyThemePreset, totalPracticed, totalDays } = useVocabulary()

const colorPresets = [
  { id: 'cinnabar', name: '朱砂红', color: 'bg-cinnabar' },
  { id: 'bamboo', name: '竹青绿', color: 'bg-bamboo' },
  { id: 'indigo', name: '靛青蓝', color: 'bg-indigo' },
  { id: 'amber', name: '琥珀橙', color: 'bg-amber' },
  { id: 'ink', name: '墨黑', color: 'bg-ink' },
]

const CACHE_STORE_NAME = 'vocabulary_cache'

const cacheEnabled = ref(localStorage.getItem('setting') ? JSON.parse(localStorage.getItem('setting')).IDBEnabled : true)
const cacheSize = ref('')
const hasDeleteCache = ref(false)
const hasCalculatedCacheSize = ref(false)

const clearCache = async () => {
  if (!confirm('确认清除缓存吗？')) return;
  if (!await hasStore(CACHE_STORE_NAME)) return;
  await deleteStore(CACHE_STORE_NAME)
  hasDeleteCache.value = true
  cacheSize.value = ''
}
const toggleCacheEnabled = () => {
  cacheEnabled.value = !cacheEnabled.value
  localStorage.setItem('setting', JSON.stringify({ IDBEnabled: cacheEnabled.value }))
}
const calculateCacheSize = async () => {
  if (!await hasStore(CACHE_STORE_NAME)) return;
  const size = await countData(CACHE_STORE_NAME)
  cacheSize.value = `${size} 条数据`
  hasCalculatedCacheSize.value = true
}

function goBack() { navigateToProfile() }
</script>

<template>
  <div class="px-6 pt-4 pb-24">
    <button @click="goBack" class="flex items-center gap-1 text-ink-fade text-sm mb-6 hover:text-ink transition-colors">
      <ChevronLeft class="w-4 h-4" />返回
    </button>

    <h1 class="text-2xl font-serif font-medium text-ink mb-6">设置</h1>

    <div class="bg-white rounded-2xl p-5 card-shadow mb-4">
      <h3 class="text-sm font-medium text-ink mb-4 flex items-center gap-2">
        <Palette class="w-4 h-4 accent-text" />主题色
      </h3>
      <div class="flex gap-3">
        <button v-for="preset in colorPresets" :key="preset.id" @click="applyThemePreset(preset.id)"
          class="flex flex-col items-center gap-1.5"
        >
          <div class="w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-110"
            :class="preset.color">
            <Check v-if="themePreset === preset.id" class="w-4 h-4 text-white" />
          </div>
          <span class="text-[10px] text-ink-fade">{{ preset.name }}</span>
        </button>
      </div>
    </div>

    <div class="bg-white rounded-2xl p-5 card-shadow mb-4">
      <h3 class="text-sm font-medium text-ink mb-4 flex items-center gap-2">
        <Database class="w-4 h-4 accent-text" />缓存
      </h3>
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-ink">启用缓存</p>
            <p class="text-xs text-ink-light mt-0.5">缓存词库数据以提升加载速度</p>
          </div>
          <button 
            class="relative w-12 h-6 rounded-full transition-colors duration-200"
            :class="cacheEnabled ? 'accent-bg' : 'bg-gray-300'"
            @click="toggleCacheEnabled"
          >
            <span 
              class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200"
              :class="cacheEnabled ? 'translate-x-6' : 'translate-x-0'"
            ></span>
          </button>
        </div>
        <div class="flex items-center justify-between" v-if="cacheEnabled && !hasDeleteCache">
          <div>
            <p class="text-sm text-ink">数据大小</p>
            <p class="text-xs text-ink-light mt-0.5">IndexedDB.count()</p>
          </div>
          <span class="text-sm text-ink font-medium">
            <button 
              class="border border-ink/50 text-ink/50 px-2 py-1 rounded-md" 
              @click="calculateCacheSize"
              v-if="!hasCalculatedCacheSize"
            >计算</button>
            {{ cacheSize }}
          </span>
        </div>
        <button 
          class="w-full py-2.5 px-4 rounded-xl text-sm font-medium transition-colors duration-200 bg-red-50 text-red-500 hover:bg-red-100"
          @click="clearCache"
          v-if="cacheEnabled && !hasDeleteCache"
        >
          清除缓存
        </button>
      </div>
    </div>

    <div class="bg-white rounded-2xl p-5 card-shadow mb-4">
      <h3 class="text-sm font-medium text-ink mb-4 flex items-center gap-2">
        <FileUser class="w-4 h-4 accent-text" />统计信息
      </h3>
      <div class="space-y-3 text-sm">
        <div class="flex justify-between">
          <span class="text-ink-light">累计刷题</span>
          <span class="text-ink">{{ totalPracticed }} 题</span>
        </div>
        <div class="flex justify-between">
          <span class="text-ink-light">累计学习</span>
          <span class="text-ink">{{ totalDays }} 天</span>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-2xl p-5 card-shadow mb-4">
      <h3 class="text-sm font-medium text-ink mb-4 flex items-center gap-2">
        <Info class="w-4 h-4 text-indigo" />关于
      </h3>
      <div class="space-y-3 text-sm">
        <div class="flex justify-between">
          <span class="text-ink-light">应用名称</span>
          <span class="text-ink">文言拾遗</span>
        </div>
        <div class="flex justify-between">
          <span class="text-ink-light">版本</span>
          <span class="text-ink">1.0.3</span>
        </div>
        <div class="flex justify-between">
          <span class="text-ink-light">技术栈</span>
          <span class="text-ink">Vue 3 + Tailwind CSS</span>
        </div>
        <div>
          <h3 class="text-ink mb-2">功能介绍</h3>
          <p class="text-xs text-ink-light leading-relaxed">
            文言拾遗是一款面向高中文言文学习的工具应用。内置高考核心实词与虚词词库，支持每日一练、词语搜索、一词多义辨析、古今异义对比等功能。支持自定义导入词库，所有学习数据本地存储。
          </p>
          <p class="text-sm text-ink-light leading-relaxed mt-2">文言拾遗是<a class="text-blue-500 underline" target="_blank" href="https://github.com/GeePro188/wenyanshiyi/">开源</a>的</p>
        </div>
      </div>
    </div>
  </div>
</template>
