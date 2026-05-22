<script setup>
import { ref, provide } from 'vue'
import { PenTool, Search, Archive, User } from 'lucide-vue-next'
import PracticeView from './views/PracticeView.vue'
import SearchView from './views/SearchView.vue'
import CollectionView from './views/CollectionView.vue'
import ProfileView from './views/ProfileView.vue'
import SettingsView from './views/SettingsView.vue'
import WordQuizView from './views/WordQuizView.vue'

const tabs = [
  { key: 'practice', label: '每日一练', icon: PenTool },
  { key: 'search', label: '词语搜索', icon: Search },
  { key: 'collection', label: '我的墨盒', icon: Archive },
  { key: 'profile', label: '我的', icon: User },
]

const activeTab = ref('practice')
const previousTab = ref('practice')
const searchQuery = ref('')
const showWordQuiz = ref(false)
const wordQuizTarget = ref('')
const showSettings = ref(false)

/**
 * 导航到词语搜索页面
 * @param {string} query - 要搜索的词语
 */
function navigateToSearch(query) {
  showWordQuiz.value = false; showSettings.value = false
  if (activeTab.value !== 'search') {
    previousTab.value = activeTab.value
  }
  searchQuery.value = query
  activeTab.value = 'search'
}

/**
 * 从词语搜索页面返回到之前的页面
 */
function navigateBackFromSearch() {
  activeTab.value = previousTab.value
  searchQuery.value = ''
}

function navigateToWordQuiz(word) {
  wordQuizTarget.value = word
  showWordQuiz.value = true; showSettings.value = false
}

function navigateToSettings() {
  showSettings.value = true; showWordQuiz.value = false
}

function navigateToProfile() {
  showSettings.value = false; showWordQuiz.value = false
  activeTab.value = 'profile'
}

provide('navigateToSearch', navigateToSearch)
provide('navigateBackFromSearch', navigateBackFromSearch)
provide('navigateToWordQuiz', navigateToWordQuiz)
provide('navigateToSettings', navigateToSettings)
provide('navigateToProfile', navigateToProfile)
</script>

<template>
  <div class="min-h-screen bg-paper flex flex-col max-w-lg mx-auto">
    <div class="flex-1 overflow-y-auto no-scrollbar relative pb-24">
      <SettingsView v-if="showSettings" />
      <WordQuizView v-else-if="showWordQuiz" :word-name="wordQuizTarget" @back="showWordQuiz = false" />
      <template v-else>
        <PracticeView v-show="activeTab === 'practice'" />
        <SearchView v-show="activeTab === 'search'" :initial-query="searchQuery" @update:initial-query="searchQuery = $event" />
        <CollectionView v-show="activeTab === 'collection'" />
        <ProfileView v-show="activeTab === 'profile'" />
      </template>
    </div>

    <div v-if="!showWordQuiz && !showSettings" class="fixed bottom-0 left-0 right-0 max-w-lg mx-auto h-20 bg-white/95 backdrop-blur-md border-t border-gray-100 flex justify-around items-start pt-3 px-4 z-50">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        @click="activeTab = tab.key"
        class="flex flex-col items-center gap-1 transition-colors"
        :class="activeTab === tab.key ? 'text-cinnabar' : 'text-ink-fade'"
      >
        <component :is="tab.icon" class="w-5 h-5" />
        <span class="text-[10px]" :class="{ 'font-medium': activeTab === tab.key }">{{ tab.label }}</span>
      </button>
    </div>
  </div>
</template>
