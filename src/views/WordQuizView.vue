<script setup>
import { ref, computed } from 'vue'
import { ChevronLeft } from 'lucide-vue-next'
import { useVocabulary } from '../composables/useVocabulary.js'

const props = defineProps({ wordName: { type: String, default: '' } })
const emit = defineEmits(['back'])

const { getByWord, startSingleWordQuiz, getCurrentQuizQuestion, getCurrentQuizIndex,
  isQuizCompleted, answerQuizQuestion, finishQuiz, advanceQuiz, resetQuiz,
  sessionTotal, sessionCorrect, sessionAccuracy } = useVocabulary()

const word = computed(() => getByWord(props.wordName))
const selectedOption = ref(null)
const showExplanation = ref(false)
const isAnswered = ref(false)
const quizStarted = ref(false)
const completed = computed(() => quizStarted.value && isQuizCompleted())
const question = computed(() => getCurrentQuizQuestion())
const currentIndex = computed(() => getCurrentQuizIndex())

function startQuiz() { resetQuiz(); startSingleWordQuiz(props.wordName); quizStarted.value = true; selectedOption.value = null; showExplanation.value = false; isAnswered.value = false }
function selectOption(option) { if (isAnswered.value) return; isAnswered.value = true; selectedOption.value = option; answerQuizQuestion(option); setTimeout(() => { showExplanation.value = true }, 100) }
function goBack() { resetQuiz(); quizStarted.value = false; emit('back') }
</script>

<template>
  <div class="px-6 pt-4 pb-24">
    <button @click="goBack" class="flex items-center gap-1 text-ink-fade text-sm mb-4 hover:text-ink:text-ink-dark transition-colors">
      <ChevronLeft class="w-4 h-4" />返回
    </button>

    <template v-if="!quizStarted">
      <div v-if="word" class="bg-white rounded-2xl p-6 card-shadow mb-4">
        <div class="flex items-baseline mb-4">
          <span class="text-5xl font-serif font-bold text-ink mr-4">{{ word.word }}</span>
          <span class="text-xl text-ink-light font-light">{{ word.basic_meaning.slice(0, 12) }}</span>
        </div>
        <div class="flex gap-2 mb-1 flex-wrap">
          <span v-for="tag in word.tags" :key="tag.label" class="text-xs px-2.5 py-1 rounded-md"
            :class="tag.color==='indigo'?'bg-indigo/10 text-indigo':tag.color==='cinnabar'?'bg-cinnabar/10 text-cinnabar':'bg-gray-100 text-ink-light'"
          >{{ tag.label }}</span>
        </div>
      </div>

      <div v-if="word" class="bg-white rounded-2xl p-6 card-shadow mb-4">
        <h3 class="text-sm font-medium text-ink mb-4 flex items-center">
          <span class="w-1 h-4 bg-cinnabar rounded-full mr-2"></span>一词多义
        </h3>
        <div class="space-y-4">
          <div v-for="(sense, idx) in word.polysemy" :key="idx" class="border-l-2 border-cinnabar/30 pl-4">
            <p class="text-base text-ink font-medium mb-1">{{ idx + 1 }}. {{ sense.meaning }}</p>
            <div v-for="(ex, ei) in sense.examples" :key="ei" class="mb-1">
              <p class="text-sm text-ink-light leading-relaxed">{{ ex.sentence }}</p>
              <p class="text-xs text-ink-fade mt-0.5">{{ ex.source }}</p>
            </div>
          </div>
        </div>
      </div>

      <div v-if="word?.ancient_modern_diff" class="bg-white rounded-2xl p-6 card-shadow mb-4">
        <h3 class="text-sm font-medium text-ink mb-4 flex items-center">
          <span class="w-1 h-4 bg-indigo rounded-full mr-2"></span>古今异义对比
        </h3>
        <div class="flex gap-4">
          <div class="flex-1 bg-cinnabar/5 rounded-xl p-4 text-center">
            <p class="text-xs text-ink-fade mb-2">古义</p>
            <p class="text-lg font-serif font-medium text-cinnabar">{{ word.ancient_modern_diff.ancient }}</p>
          </div>
          <div class="flex-1 bg-indigo/5 rounded-xl p-4 text-center">
            <p class="text-xs text-ink-fade mb-2">今义</p>
            <p class="text-lg font-serif font-medium text-indigo">{{ word.ancient_modern_diff.modern }}</p>
          </div>
        </div>
      </div>

      <button @click="startQuiz"
        class="w-full py-3 accent-bg text-white rounded-xl text-sm font-medium accent-bg-hover transition-colors mt-4">
        开始刷题（{{ word?.polysemy.length }} 题）
      </button>
    </template>

    <template v-if="quizStarted && !completed">
      <div class="flex justify-between items-center mb-4">
        <span class="text-2xl font-serif font-medium text-ink">{{ word?.word }} · 专项练习</span>
        <span class="text-xs text-ink-fade">{{ currentIndex + 1 }} / {{ sessionTotal }}</span>
      </div>

      <div v-if="question" class="bg-white rounded-2xl p-8 card-shadow mb-6 text-center relative">
        <p class="font-serif text-2xl text-ink leading-relaxed tracking-wide mb-5">
          ···<span class="text-cinnabar font-bold">{{ question.word }}</span>···
        </p>
        <p class="text-sm text-ink-light font-serif leading-relaxed mb-1">{{ question.sentence }}</p>
        <p class="text-xs text-ink-fade font-sans">——{{ question.source }}</p>
      </div>

      <div v-if="question" class="space-y-3">
        <button v-for="option in question.options" :key="option.key" @click="selectOption(option)"
          class="w-full text-left px-5 py-4 rounded-xl border text-base transition-all flex items-center"
          :class="[
            !isAnswered ? 'bg-white border-gray-100 text-ink-light hover:border-gray-300'
            : selectedOption?.key === option.key
              ? option.correct ? 'border-bamboo bg-bamboo/5' : 'border-cinnabar bg-cinnabar/5'
              : option.correct ? 'border-bamboo bg-bamboo/5' : 'border-gray-200 opacity-50'
          ]" :disabled="isAnswered">
          <span class="w-6 h-6 rounded-full border flex items-center justify-center text-xs mr-3 shrink-0"
            :class="[
              !isAnswered ? 'border-gray-200'
              : selectedOption?.key === option.key
                ? option.correct ? 'border-bamboo text-bamboo' : 'border-cinnabar text-cinnabar'
                : option.correct ? 'border-bamboo text-bamboo' : 'border-gray-200'
            ]">{{ option.key }}</span>
          {{ option.text }}
        </button>
      </div>

      <div v-if="isAnswered" class="bg-bamboo/5 rounded-xl mt-3 px-5 border overflow-hidden transition-all duration-400"
        :class="showExplanation ? 'expand-section active border-bamboo/20' : 'expand-section'">
        <p v-if="selectedOption?.correct" class="text-sm text-bamboo font-medium mb-1">✓ 回答正确</p>
        <p v-else class="text-sm text-cinnabar font-medium mb-1">✗ 回答错误</p>
        <p class="text-sm text-ink-light leading-relaxed">
          <span class="font-serif text-ink">{{ question?.word }}</span>：{{ question?.correctSense?.meaning }}。
        </p>
      </div>

      <button v-if="isAnswered && !completed && currentIndex < sessionTotal - 1"
        @click="advanceQuiz(); selectedOption = null; showExplanation = false; isAnswered = false"
        class="w-full mt-4 py-3 accent-bg text-white rounded-xl text-sm font-medium accent-bg-hover transition-colors">下一题</button>
      <button v-if="isAnswered && !completed && currentIndex >= sessionTotal - 1" @click="finishQuiz"
        class="w-full mt-4 py-3 bg-bamboo text-white rounded-xl text-sm font-medium hover:bg-bamboo/90 transition-colors">完成练习，查看成绩</button>
    </template>

    <template v-if="completed">
      <div class="bg-white rounded-2xl p-8 card-shadow mb-6 text-center">
        <div class="text-5xl mb-4">📜</div>
        <h2 class="text-xl font-serif font-medium text-ink mb-2">{{ word?.word }} · 练习完成</h2>
        <div class="flex justify-center gap-8 mt-6 mb-6">
          <div class="text-center"><p class="text-3xl font-serif font-bold text-bamboo">{{ sessionCorrect }}</p><p class="text-xs text-ink-fade mt-1">正确</p></div>
          <div class="text-center"><p class="text-3xl font-serif font-bold text-cinnabar">{{ sessionTotal - sessionCorrect }}</p><p class="text-xs text-ink-fade mt-1">错误</p></div>
          <div class="text-center"><p class="text-3xl font-serif font-bold text-indigo">{{ sessionAccuracy }}%</p><p class="text-xs text-ink-fade mt-1">正确率</p></div>
        </div>
      </div>
      <button @click="resetQuiz(); quizStarted = false" class="w-full py-3 accent-bg text-white rounded-xl text-sm font-medium accent-bg-hover transition-colors">返回详情</button>
    </template>
  </div>
</template>
