<script setup>
import { ref, computed } from 'vue'
import { Flame, Scroll, Target, BookOpen } from 'lucide-vue-next'
import { useVocabulary } from '../composables/useVocabulary.js'

const {
  startQuizSession, getCurrentQuizQuestion, getCurrentQuizIndex, getQuizSize,
  isQuizCompleted, answerQuizQuestion, finishQuiz, advanceQuiz, resetQuiz,
  sessionTotal, sessionCorrect, sessionAccuracy, totalDays,
} = useVocabulary()

const screenState = ref('home')
const chosenSize = ref(10)
const selectedOption = ref(null)
const showExplanation = ref(false)
const isAnswered = ref(false)

const question = computed(() => getCurrentQuizQuestion())
const currentIndex = computed(() => getCurrentQuizIndex())
const quizSize = computed(() => getQuizSize())
const completed = computed(() => isQuizCompleted())

const progressDots = computed(() => {
  const idx = currentIndex.value
  return Array.from({ length: quizSize.value }, (_, i) => {
    if (i < idx) return 'done'
    if (i === idx && !completed.value) return 'current'
    if (i === idx && completed.value) return 'done'
    return 'pending'
  })
})

function selectSize(size) { chosenSize.value = size }
function beginQuiz() { resetQuiz(); startQuizSession(chosenSize.value); screenState.value = 'quiz' }
function goBackHome() { resetQuiz(); screenState.value = 'home' }

function selectOption(option) {
  if (isAnswered.value) return
  isAnswered.value = true; selectedOption.value = option
  answerQuizQuestion(option)
  setTimeout(() => { showExplanation.value = true }, 100)
}

function handleNextOrFinish() {
  if (completed.value) { resetQuiz(); screenState.value = 'home'; return }
  advanceQuiz(); selectedOption.value = null; showExplanation.value = false; isAnswered.value = false
}

function restart() { resetQuiz(); selectedOption.value = null; showExplanation.value = false; isAnswered.value = false; startQuizSession(chosenSize.value) }

const sizeOptions = [
  { size: 5, label: '轻松 5 题', desc: '适合碎片时间', icon: Target },
  { size: 10, label: '标准 10 题', desc: '每日推荐', icon: BookOpen },
  { size: 15, label: '进阶 15 题', desc: '深度练习', icon: Scroll },
]
</script>

<template>
  <div class="px-6 pt-4 pb-24">
    <template v-if="screenState === 'home'">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-serif font-medium text-ink">每日一练</h1>
        <div class="flex items-center gap-1 accent-bg-10 px-3 py-1 rounded-full">
          <Flame class="w-4 h-4 accent-text" />
          <span class="text-xs font-medium accent-text">连续 {{ totalDays }} 天</span>
        </div>
      </div>

      <div class="bg-white rounded-2xl p-6 card-shadow mb-6">
        <h2 class="text-sm font-medium text-ink mb-1">选择今日题量</h2>
        <p class="text-xs text-ink-fade mb-5">实词与虚词按比例穿插出题</p>
        <div class="space-y-3">
          <button v-for="opt in sizeOptions" :key="opt.size" @click="selectSize(opt.size)"
            class="w-full text-left px-5 py-4 rounded-xl border transition-all flex items-center gap-4"
            :class="chosenSize === opt.size
              ? 'border-cinnabar accent-bg-5'
              : 'border-gray-100 bg-white hover:border-gray-200'">
            <div class="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              :class="chosenSize === opt.size ? 'accent-bg-10 accent-text' : 'bg-gray-50 text-ink-fade'">
              <component :is="opt.icon" class="w-5 h-5" />
            </div>
            <div>
              <p class="text-base font-medium text-ink">{{ opt.label }}</p>
              <p class="text-xs text-ink-fade">{{ opt.desc }}</p>
            </div>
            <div class="ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
              :class="chosenSize === opt.size ? 'accent-border' : 'border-gray-200'">
              <div v-if="chosenSize === opt.size" class="w-2.5 h-2.5 rounded-full accent-bg"></div>
            </div>
          </button>
        </div>
      </div>

      <button @click="beginQuiz"
        class="w-full py-3.5 accent-bg text-white rounded-xl text-base font-medium accent-bg-hover transition-colors flex items-center justify-center gap-2">
        <BookOpen class="w-5 h-5" /> 开始练题（{{ chosenSize }} 题）
      </button>
    </template>

    <template v-if="screenState === 'quiz' && !completed">
      <div class="flex justify-between items-center mb-4">
        <button @click="goBackHome" class="text-ink-fade text-sm hover:text-ink:text-ink-dark transition-colors">← 退出</button>
        <div class="flex items-center gap-1 accent-bg-10 px-3 py-1 rounded-full">
          <Flame class="w-4 h-4 accent-text" />
          <span class="text-xs font-medium accent-text">连续 {{ totalDays }} 天</span>
        </div>
      </div>

      <div class="flex items-center gap-2 mb-6">
        <div class="flex gap-1.5 flex-wrap">
          <template v-for="(type, i) in progressDots" :key="i">
            <div v-if="type === 'done'" class="w-2 h-2 rounded-full accent-bg"></div>
            <div v-else-if="type === 'current'" class="w-2 h-2 rounded-full bg-cinnabar/50 border border-cinnabar"></div>
            <div v-else class="w-2 h-2 rounded-full bg-gray-200"></div>
          </template>
        </div>
        <span class="text-xs text-ink-fade ml-auto">{{ Math.min(currentIndex + 1, quizSize) }} / {{ quizSize }}</span>
        <span v-if="question?.tags?.length" class="text-[10px] px-2 py-0.5 rounded-full"
          :class="question.tags[0].color === 'indigo' ? 'bg-indigo/10 text-indigo' : 'bg-cinnabar/10 text-cinnabar'"
        >{{ question.tags[0].label }}</span>
      </div>

      <div v-if="question" class="bg-white rounded-2xl p-8 card-shadow mb-6 text-center relative">
        <div class="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-gray-100 rounded-tr-md"></div>
        <div class="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-gray-100 rounded-bl-md"></div>
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

      <div v-if="isAnswered"
        class="bg-bamboo/5 rounded-xl mt-3 px-5 border overflow-hidden transition-all duration-400"
        :class="showExplanation ? 'expand-section active border-bamboo/20' : 'expand-section'">
        <p v-if="selectedOption?.correct" class="text-sm text-bamboo font-medium mb-1">✓ 回答正确</p>
        <p v-else class="text-sm text-cinnabar font-medium mb-1">✗ 回答错误</p>
        <p class="text-sm text-ink-light leading-relaxed">
          <span class="font-serif text-ink">{{ question?.word }}</span>：{{ question?.correctSense?.meaning }}。{{ question?.notes }}
        </p>
      </div>

      <button v-if="isAnswered && currentIndex < quizSize - 1" @click="handleNextOrFinish"
        class="w-full mt-4 py-3 accent-bg text-white rounded-xl text-sm font-medium accent-bg-hover transition-colors">下一题</button>
      <button v-if="isAnswered && currentIndex >= quizSize - 1" @click="finishQuiz"
        class="w-full mt-4 py-3 bg-bamboo text-white rounded-xl text-sm font-medium hover:bg-bamboo/90 transition-colors">提交，查看成绩</button>
    </template>

    <template v-if="screenState === 'quiz' && completed">
      <div class="bg-white rounded-2xl p-8 card-shadow mb-6 text-center">
        <div class="text-5xl mb-4">📜</div>
        <h2 class="text-xl font-serif font-medium text-ink mb-2">练习完成</h2>
        <p class="text-xs text-ink-fade mb-4">共 {{ sessionTotal }} 题</p>
        <div class="flex justify-center gap-8 mt-6 mb-6">
          <div class="text-center"><p class="text-3xl font-serif font-bold text-bamboo">{{ sessionCorrect }}</p><p class="text-xs text-ink-fade mt-1">正确</p></div>
          <div class="text-center"><p class="text-3xl font-serif font-bold text-cinnabar">{{ sessionTotal - sessionCorrect }}</p><p class="text-xs text-ink-fade mt-1">错误</p></div>
          <div class="text-center"><p class="text-3xl font-serif font-bold text-indigo">{{ sessionAccuracy }}%</p><p class="text-xs text-ink-fade mt-1">正确率</p></div>
        </div>
        <div v-if="sessionCorrect / sessionTotal >= 0.8" class="bg-bamboo/10 text-bamboo text-sm px-4 py-2 rounded-lg mb-4">🎉 太厉害了！你的文言文功底很扎实！</div>
        <div v-else-if="sessionCorrect / sessionTotal >= 0.6" class="bg-indigo/10 text-indigo text-sm px-4 py-2 rounded-lg mb-4">👍 不错哦，继续努力！</div>
        <div v-else class="bg-cinnabar/10 text-cinnabar text-sm px-4 py-2 rounded-lg mb-4">📖 学无止境，多多练习便会进步的！</div>
      </div>
      <button @click="restart" class="w-full mb-3 py-3 accent-bg text-white rounded-xl text-sm font-medium accent-bg-hover transition-colors">再来一组</button>
      <button @click="goBackHome" class="w-full py-3 bg-gray-100 text-ink-light rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors">返回主界面</button>
    </template>
  </div>
</template>
