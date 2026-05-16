<script setup>
import { ref, computed, inject, onMounted } from 'vue'
import { ChevronLeft, ChevronRight, ChevronRight as ArrowRight, Settings } from 'lucide-vue-next'
import { useVocabulary } from '../composables/useVocabulary.js'

const navigateToWordQuiz = inject('navigateToWordQuiz', () => {})
const navigateToSettings = inject('navigateToSettings', () => {})

const { masteredWords, totalDays, todayAccuracy, totalPracticed, recentWrongWords, getDailyPracticeCounts, userLevel, nextLevel, levelProgress } = useVocabulary()

const levelNames = ['蒙童', '童生', '秀才', '举人', '贡士', '进士', '翰林', '学士', '太傅', '文宗']
const currentLevelIdx = computed(() => {
  const lvl = userLevel.value
  return levelNames.indexOf(lvl.name)
})

const stats = computed(() => [
  { value: masteredWords.value, label: '已掌握词语', color: 'text-ink' },
  { value: totalDays.value, label: '累计学习天数', color: 'text-ink' },
  { value: todayAccuracy.value + '%', label: '今日正确率', color: 'text-bamboo' },
  { value: totalPracticed.value, label: '总练习题量', color: 'text-ink' },
])

const levels = [
  'bg-paper border border-gray-100',
  'bg-[#EAEAEA]',
  'bg-[#D9D9D9]',
  'bg-[#8C8C8C]',
  'bg-[#1A1A1A]',
]
const heatmapCells = ref([])
const heatmapMonth = ref('')

function generateHeatmap() {
  const counts = getDailyPracticeCounts(35)
  const cells = []
  for (const [, count] of Object.entries(counts)) {
    let level = 0
    if (count >= 6) level = 4; else if (count >= 4) level = 3; else if (count >= 2) level = 2; else if (count >= 1) level = 1
    cells.push(level)
  }
  heatmapCells.value = cells
  const now = new Date()
  heatmapMonth.value = `${now.getFullYear()}年${now.getMonth() + 1}月`
}

onMounted(() => generateHeatmap())
</script>

<template>
  <div class="px-6 pt-4 pb-24">
    <div class="flex items-center justify-between mb-6 mt-2">
      <div class="flex items-center">
        <div class="w-16 h-16 rounded-full bg-paper border-2 border-white shadow-sm mr-4 shrink-0 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-ink-fade" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        </div>
        <div>
          <h2 class="text-xl font-medium text-ink">墨清居士</h2>
          <div class="flex items-center gap-2 mt-1">
            <span class="text-xs border border-cinnabar text-cinnabar px-2 py-0.5 rounded-full">【{{ userLevel.name }}】</span>
            <span class="text-xs text-ink-fade">Lv.{{ currentLevelIdx + 1 }}</span>
          </div>
        </div>
      </div>
      <button @click="navigateToSettings()" class="p-2 hover:bg-gray-100 rounded-full transition-colors">
        <Settings class="w-5 h-5 text-ink-fade" />
      </button>
    </div>

    <div class="bg-white rounded-2xl p-4 card-shadow mb-4">
      <div class="flex items-center justify-between mb-2">
        <span class="text-xs text-ink-fade">{{ userLevel.name }} · 进度</span>
        <span class="text-xs text-ink-fade" v-if="nextLevel">下一级：{{ nextLevel.name }}（需 {{ nextLevel.min - totalPracticed }} 题）</span>
        <span class="text-xs text-bamboo" v-else>已达最高等级 🎉</span>
      </div>
      <div class="w-full bg-gray-100 rounded-full h-2">
        <div class="bg-cinnabar h-2 rounded-full transition-all duration-500" :style="{ width: levelProgress + '%' }"></div>
      </div>
      <p class="text-[10px] text-ink-fade mt-1">已刷 {{ totalPracticed }} 题</p>
    </div>

    <div class="grid grid-cols-2 gap-3 mb-4">
      <div v-for="(stat, i) in stats" :key="i" class="bg-white rounded-2xl p-4 card-shadow text-center">
        <p class="text-3xl font-serif font-bold" :class="stat.color">{{ stat.value }}</p>
        <p class="text-xs text-ink-fade mt-1">{{ stat.label }}</p>
      </div>
    </div>

    <div class="bg-white rounded-2xl p-5 card-shadow mb-6">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-sm font-medium text-ink">学习热点图</h3>
        <span class="text-xs text-ink-fade">{{ heatmapMonth }}</span>
      </div>
      <div class="flex flex-wrap gap-[3px] justify-center">
        <div v-for="(level, i) in heatmapCells" :key="i" class="ink-square" :class="levels[level]"></div>
      </div>
    </div>

    <div class="bg-white rounded-2xl p-5 card-shadow">
      <h3 class="text-sm font-medium text-ink mb-4 flex items-center">
        <span class="w-1 h-4 bg-cinnabar rounded-full mr-2"></span>今日错题回顾
      </h3>
      <div v-if="recentWrongWords.length > 0" class="space-y-3">
        <div v-for="(item, i) in recentWrongWords" :key="i" @click="navigateToWordQuiz(item.word)"
          class="flex justify-between items-center py-2 cursor-pointer hover:bg-gray-50 -mx-1 px-1 rounded transition-colors"
          :class="{ 'border-b border-gray-50': i < recentWrongWords.length - 1 }">
          <div>
            <span class="text-xl font-serif text-ink mr-2">{{ item.word }}</span>
            <span class="text-xs text-ink-fade">答错 {{ item.count }} 次</span>
          </div>
          <ArrowRight class="w-4 h-4 text-ink-fade" />
        </div>
      </div>
      <p v-else class="text-sm text-ink-fade text-center py-4">暂无错题，继续保持！</p>
    </div>
  </div>
</template>
