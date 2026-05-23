import { ref, computed, watch } from 'vue'
import { 
  getData, 
  updateData, 
  hasStore,
  createStore 
} from '../utils/useIDB.js'

const VOCAB_STORE_NAME = 'vocabulary_cache'
const VOCAB_CACHE_KEY = 1
const VOCAB_JSON_PATH = '/public/high_school_classical_chinese_vocabulary.json'

const FUNCTION_WORDS = new Set(['其', '所以', '之', '而', '以', '于', '为', '者', '也', '乎', '焉', '哉', '何', '乃', '且', '则', '若', '虽', '所', '与', '因', '矣', '耳'])

const STORAGE_KEY = 'wenyanshiyi_data'

function loadStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const data = JSON.parse(raw)
      return {
        practiceHistory: data.practiceHistory || [],
        wrongAnswers: data.wrongAnswers || [],
        activeVocabId: data.activeVocabId || '',
        importedVocabs: data.importedVocabs || [],
        themePreset: data.themePreset || 'cinnabar',
      }
    }
  } catch (e) { /* ignore */ }
  return null
}

function saveStore(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (e) { /* ignore */ }
}

const savedState = loadStore()

const vocabularies = ref([])
const activeVocabId = ref(savedState?.activeVocabId || '')
const calculatedAllWords = ref([])
const initialized = ref(false)
const importedVocabs = ref(savedState?.importedVocabs || [])
let cachedVocabData = null
let initPromise = null

const themePreset = ref(savedState?.themePreset || 'cinnabar')

function applyThemePreset(preset) {
  themePreset.value = preset
  const html = document.documentElement
  html.classList.remove('theme-cinnabar', 'theme-bamboo', 'theme-indigo', 'theme-ink', 'theme-amber')
  html.classList.add('theme-' + preset)
  persistStore()
}

/**
 * 从 IndexedDB 加载词汇缓存
 * @returns {Promise<Object|null>} 缓存的词汇数据或 null
 */
async function loadVocabularyFromCache() {
  try {
    const hasStoreExists = await hasStore(VOCAB_STORE_NAME)
    if (!hasStoreExists) return null
    
    const cached = await getData(VOCAB_STORE_NAME, VOCAB_CACHE_KEY)
    if (!cached) return null
    
    return cached
  } catch (e) {
    console.warn('Failed to load vocabulary from cache:', e)
    return null
  }
}

/**
 * 从服务器获取词汇数据
 * @returns {Promise<Object|null>} 词汇数据或 null
 */
async function fetchVocabularyData() {
  try {
    const res = await fetch(VOCAB_JSON_PATH)
    if (!res.ok) throw new Error('Failed to fetch vocabulary data')
    return await res.json()
  } catch (e) {
    console.error('Failed to fetch vocabulary data:', e)
    return null
  }
}

/**
 * 保存词汇数据到 IndexedDB
 * @param {Object} data - 词汇数据
 */
async function saveVocabularyToCache(data) {
  try {
    const hasStoreExists = await hasStore(VOCAB_STORE_NAME)
    if (!hasStoreExists) {
      await createStore(VOCAB_STORE_NAME)
    }
    
    const cacheData = {
      id: VOCAB_CACHE_KEY,
      ...data
    }
    
    await updateData(VOCAB_STORE_NAME, cacheData)
  } catch (e) {
    console.warn('Failed to save vocabulary to cache:', e)
  }
}

/**
 * 初始化词汇数据
 */
async function init() {
  if (initialized.value) return
  
  if (initPromise) {
    return initPromise
  }
  
  initPromise = (async () => {
    let raw = null
    
    const cached = await loadVocabularyFromCache()
    if (cached && cached.vocabularies) {
      raw = cached.vocabularies
      cachedVocabData = cached
    } else {
      const fetchedData = await fetchVocabularyData()
      if (fetchedData && fetchedData.vocabularies) {
        raw = fetchedData.vocabularies
        cachedVocabData = fetchedData
        await saveVocabularyToCache(fetchedData)
      }
    }

    if (!raw || raw.length === 0) {
      console.error('No vocabulary data available')
      return
    }

    const builtIn = raw.map((v) => ({
      id: v.id, name: v.name, description: v.description || '',
      wordCount: (v.words || []).length,
      source: 'builtin',
    }))

    vocabularies.value = [...builtIn, ...importedVocabs.value.map((v) => ({
      id: v.id, name: v.name, description: v.description || '',
      wordCount: (v.words || []).length,
      source: 'imported',
    }))]

    if (activeVocabId.value && vocabularies.value.some((v) => v.id === activeVocabId.value)) {
      loadVocabWords(activeVocabId.value)
    } else if (vocabularies.value.length > 0) {
      activeVocabId.value = vocabularies.value[0].id
    }

    applyThemePreset(themePreset.value)
    initialized.value = true
  })()
  
  return initPromise
}

function findVocabData(vocabId) {
  if (!cachedVocabData) {
    console.warn('Vocabulary data not initialized')
    return null
  }
  const builtIn = (cachedVocabData.vocabularies || []).find((v) => v.id === vocabId)
  if (builtIn) return builtIn
  const imported = importedVocabs.value.find((v) => v.id === vocabId)
  return imported || null
}

function normalizeSense(sense) {
  if (!sense) return sense
  if (sense.examples) return sense
  if (sense.example !== undefined) {
    sense.examples = [{ sentence: sense.example, source: sense.source || '' }]
    delete sense.example
    delete sense.source
  } else {
    sense.examples = []
  }
  return sense
}

function normalizeWord(word) {
  if (word.polysemy) word.polysemy.forEach(normalizeSense)
  if (word.ancient_modern_diff) normalizeSense(word.ancient_modern_diff)
  return word
}

function loadVocabWords(vocabId) {
  const vocab = findVocabData(vocabId)
  if (!vocab) { calculatedAllWords.value = []; return }
  const words = vocab.words || []
  calculatedAllWords.value = words.map((item) => {
    normalizeWord(item)
    const isFuncWord = FUNCTION_WORDS.has(item.word)
    const hasAncientModernDiff = item.ancient_modern_diff !== null
    return {
      ...item, vocabId,
      isFuncWord, isContentWord: !isFuncWord, hasAncientModernDiff,
      wordType: classifyWordType(item),
      tags: buildTags(item, isFuncWord, hasAncientModernDiff),
    }
  })
}

function importVocab(json) {
  if (!json || !json.name || !json.words || !Array.isArray(json.words)) return false
  if (json.words.length === 0) return false
  const id = 'imported_' + Date.now()
  const vocab = { id, name: json.name, description: json.description || '', words: json.words }
  importedVocabs.value.push(vocab)
  vocabularies.value.push({
    id, name: vocab.name, description: vocab.description,
    wordCount: vocab.words.length, source: 'imported',
  })
  persistStore()
  return true
}

function deleteImportedVocab(id) {
  const idx = importedVocabs.value.findIndex((v) => v.id === id)
  if (idx === -1) return
  importedVocabs.value.splice(idx, 1)
  vocabularies.value = vocabularies.value.filter((v) => v.id !== id)
  if (activeVocabId.value === id && vocabularies.value.length > 0) {
    setActiveVocab(vocabularies.value[0].id)
  }
  persistStore()
}

function setActiveVocab(vocabId) {
  activeVocabId.value = vocabId
  loadVocabWords(vocabId)
  persistStore()
}

const allWords = computed(() => {
  if (calculatedAllWords.value.length > 0) return calculatedAllWords.value
  const active = findVocabData(activeVocabId.value)
  if (!active) return []
  return (active.words || []).map((item) => {
    normalizeWord(item)
    const isFuncWord = FUNCTION_WORDS.has(item.word)
    const hasAncientModernDiff = item.ancient_modern_diff !== null
    return {
      ...item, vocabId: activeVocabId.value,
      isFuncWord, isContentWord: !isFuncWord, hasAncientModernDiff,
      wordType: classifyWordType(item),
      tags: buildTags(item, isFuncWord, hasAncientModernDiff),
    }
  })
})

function classifyWordType(item) {
  const meaning = item.basic_meaning
  if (/代词|副词|介词|连词|助词|语气词|叹词/.test(meaning)) {
    if (/代词/.test(meaning)) return '代词'
    if (/副词/.test(meaning)) return '副词'
    if (/介词/.test(meaning)) return '介词'
    if (/连词/.test(meaning)) return '连词'
    if (/助词/.test(meaning)) return '助词'
    if (/语气/.test(meaning)) return '语气词'
    return '虚词'
  }
  if (/名词/.test(meaning)) return '名词'
  if (/动词/.test(meaning)) return '动词'
  if (/形容词/.test(meaning)) return '形容词'
  return '实词'
}

function buildTags(item, isFuncWord, hasAncientModernDiff) {
  const tags = []
  if (isFuncWord) tags.push({ label: '虚词', color: 'indigo' })
  else tags.push({ label: '实词', color: 'cinnabar' })
  const wt = classifyWordType(item)
  if (!['实词', '虚词'].includes(wt)) tags.push({ label: wt, color: 'gray' })
  if (hasAncientModernDiff) tags.push({ label: '古今异义', color: 'indigo' })
  return tags
}

function search(query) {
  const words = allWords.value
  if (!query || !query.trim()) return words
  const q = query.trim()
  const scored = words.map((w) => {
    let score = 0
    if (w.word === q) score += 100
    else if (w.word.startsWith(q)) score += 50
    else if (w.word.includes(q)) score += 30
    if (w.basic_meaning.includes(q)) score += 10
    if (w.notes && w.notes.includes(q)) score += 5
    if (w.polysemy.some((p) => p.meaning === q || p.meaning.includes(q))) score += 8
    if (w.polysemy.some((p) => p.examples && p.examples.some((e) => e.sentence.includes(q)))) score += 3
    if (w.synonyms.some((s) => s === q)) score += 15
    if (w.synonyms.some((s) => s.includes(q))) score += 5
    if (w.near_synonyms.some((s) => s === q || s.includes(q))) score += 4
    if (w.antonyms.some((s) => s === q || s.includes(q))) score += 4
    return { word: w, score }
  }).filter((x) => x.score > 0).sort((a, b) => b.score - a.score).map((x) => x.word)
  return scored
}

function getByWord(word) { return allWords.value.find((w) => w.word === word) || null }
function getContentWords() { return allWords.value.filter((w) => w.isContentWord) }
function getFunctionWords() { return allWords.value.filter((w) => w.isFuncWord) }
function getAllWords() { return allWords.value }

function pickDistractors(correctSense, wordObj, count = 3) {
  const pool = []
  wordObj.polysemy.forEach((s) => { if (s.meaning !== correctSense.meaning) pool.push(s.meaning) })
  if (pool.length >= count) { return [...pool].sort(() => Math.random() - 0.5).slice(0, count) }
  const extraWords = wordObj.isFuncWord
    ? allWords.value.filter((w) => w.isFuncWord && w.word !== wordObj.word)
    : allWords.value.filter((w) => w.word !== wordObj.word)
  extraWords.forEach((w) => { w.polysemy.forEach((s) => { if (s.meaning !== correctSense.meaning && !pool.includes(s.meaning)) pool.push(s.meaning) }) })
  return [...new Set(pool)].sort(() => Math.random() - 0.5).slice(0, count)
}

function buildQuestion(wordObj, sense) {
  const distractors = pickDistractors(sense, wordObj, 3)
  const options = [{ text: sense.meaning, correct: true }, ...distractors.map((text) => ({ text, correct: false }))]
    .sort(() => Math.random() - 0.5).map((opt, i) => ({ ...opt, key: String.fromCharCode(65 + i) }))
  const examples = sense.examples || []
  const picked = examples.length > 0 ? examples[Math.floor(Math.random() * examples.length)] : { sentence: '', source: '' }
  return { word: wordObj.word, wordObj, correctSense: sense, options, sentence: picked.sentence, source: picked.source, notes: wordObj.notes || '', tags: wordObj.tags }
}

const currentQuiz = ref([])
const currentQuizIndex = ref(0)
const sessionAnswers = ref([])
const quizCompleted = ref(false)
const quizSize = ref(10)

function startQuizSession(totalCount = 10) {
  const allW = allWords.value
  if (allW.length === 0) return
  quizSize.value = totalCount
  const contentWords = allW.filter((w) => w.isContentWord)
  const funcWords = allW.filter((w) => w.isFuncWord)
  const contentNeed = Math.round(totalCount * 0.8)
  const funcNeed = totalCount - contentNeed
  const contentPairs = []
  const usedCW = new Set()
  const shuffledContent = [...contentWords].sort(() => Math.random() - 0.5)
  for (const w of shuffledContent) {
    if (contentPairs.length >= contentNeed) break
    if (usedCW.has(w.word)) {
      const unused = w.polysemy.filter((s) => !contentPairs.find((p) => p.word.word === w.word && p.sense.meaning === s.meaning))
      if (unused.length > 0) { const sense = unused[Math.floor(Math.random() * unused.length)]; contentPairs.push({ word: w, sense }) }
      continue
    }
    usedCW.add(w.word); contentPairs.push({ word: w, sense: w.polysemy[Math.floor(Math.random() * w.polysemy.length)] })
  }
  while (contentPairs.length < contentNeed) {
    const w = shuffledContent[Math.floor(Math.random() * shuffledContent.length)]
    const usedSenses = contentPairs.filter((p) => p.word.word === w.word).map((p) => p.sense.meaning)
    const available = w.polysemy.filter((s) => !usedSenses.includes(s.meaning))
    const sense = available.length > 0 ? available[Math.floor(Math.random() * available.length)] : w.polysemy[Math.floor(Math.random() * w.polysemy.length)]
    contentPairs.push({ word: w, sense })
  }
  const funcPairs = []
  const usedFW = new Set()
  const shuffledFunc = [...funcWords].sort(() => Math.random() - 0.5)
  for (const w of shuffledFunc) {
    if (funcPairs.length >= funcNeed) break
    if (usedFW.has(w.word)) {
      const unused = w.polysemy.filter((s) => !funcPairs.find((p) => p.word.word === w.word && p.sense.meaning === s.meaning))
      if (unused.length > 0) { const sense = unused[Math.floor(Math.random() * unused.length)]; funcPairs.push({ word: w, sense }) }
      continue
    }
    usedFW.add(w.word); funcPairs.push({ word: w, sense: w.polysemy[Math.floor(Math.random() * w.polysemy.length)] })
  }
  while (funcPairs.length < funcNeed) {
    const w = shuffledFunc[Math.floor(Math.random() * shuffledFunc.length)]
    const usedSenses = funcPairs.filter((p) => p.word.word === w.word).map((p) => p.sense.meaning)
    const available = w.polysemy.filter((s) => !usedSenses.includes(s.meaning))
    const sense = available.length > 0 ? available[Math.floor(Math.random() * available.length)] : w.polysemy[Math.floor(Math.random() * w.polysemy.length)]
    funcPairs.push({ word: w, sense })
  }
  const finalPairs = []
  const contentPool = [...contentPairs].sort(() => Math.random() - 0.5)
  const funcPool = [...funcPairs].sort(() => Math.random() - 0.5)
  for (let i = 0; i < totalCount; i++) {
    const everyN = totalCount >= 10 ? 5 : 3
    if ((i + 1) % everyN === 0 && funcPool.length > 0) finalPairs.push(funcPool.shift())
    else if (contentPool.length > 0) finalPairs.push(contentPool.shift())
    else if (funcPool.length > 0) finalPairs.push(funcPool.shift())
  }
  currentQuiz.value = finalPairs.map(({ word, sense }) => buildQuestion(word, sense))
  currentQuizIndex.value = 0; sessionAnswers.value = []; quizCompleted.value = false
}

function startSingleWordQuiz(wordName) {
  const wordObj = allWords.value.find((w) => w.word === wordName)
  if (!wordObj) return
  currentQuiz.value = wordObj.polysemy.map((sense) => buildQuestion(wordObj, sense))
  currentQuizIndex.value = 0; sessionAnswers.value = []; quizCompleted.value = false
}

function getCurrentQuizQuestion() { return currentQuizIndex.value >= currentQuiz.value.length ? null : currentQuiz.value[currentQuizIndex.value] }
function getCurrentQuizIndex() { return currentQuizIndex.value }
function getQuizSize() { return quizSize.value }
function isQuizCompleted() { return quizCompleted.value }
const sessionTotal = computed(() => currentQuiz.value.length)
const sessionCorrect = computed(() => sessionAnswers.value.filter((a) => a.isCorrect).length)
const sessionAccuracy = computed(() => sessionAnswers.value.length === 0 ? 0 : Math.round((sessionCorrect.value / sessionAnswers.value.length) * 100))

function answerQuizQuestion(option) {
  if (quizCompleted.value) return { isCorrect: false, isLast: false }
  const question = currentQuiz.value[currentQuizIndex.value]
  if (!question) return { isCorrect: false, isLast: false }
  const isCorrect = option.correct
  sessionAnswers.value.push({ word: question.word, sense: question.correctSense.meaning, isCorrect })
  recordAnswer(question.word, isCorrect)
  const isLast = currentQuizIndex.value >= currentQuiz.value.length - 1
  return { isCorrect, isLast }
}

function finishQuiz() { quizCompleted.value = true }
function advanceQuiz() { if (currentQuizIndex.value < currentQuiz.value.length - 1) currentQuizIndex.value++ }
function resetQuiz() { currentQuiz.value = []; currentQuizIndex.value = 0; sessionAnswers.value = []; quizCompleted.value = false }

const practiceHistory = ref(savedState?.practiceHistory || [])
const wrongAnswers = ref(savedState?.wrongAnswers || [])

function persistStore() {
  saveStore({
    practiceHistory: practiceHistory.value,
    wrongAnswers: wrongAnswers.value,
    activeVocabId: activeVocabId.value,
    importedVocabs: importedVocabs.value,
    themePreset: themePreset.value,
  })
}

function recordAnswer(word, isCorrect) {
  practiceHistory.value.push({ word, isCorrect, time: Date.now() })
  if (!isCorrect) {
    const existing = wrongAnswers.value.find((w) => w.word === word)
    if (existing) existing.count++
    else wrongAnswers.value.push({ word, count: 1, time: Date.now() })
  }
  persistStore()
}

const totalPracticed = computed(() => practiceHistory.value.length)
const masteredWords = computed(() => {
  const set = new Set()
  practiceHistory.value.forEach((p) => { if (p.isCorrect) set.add(p.word) })
  return set.size
})
const todayAccuracy = computed(() => {
  const today = new Date().toDateString()
  const todayPractices = practiceHistory.value.filter((p) => new Date(p.time).toDateString() === today)
  if (todayPractices.length === 0) return 0
  return Math.round((todayPractices.filter((p) => p.isCorrect).length / todayPractices.length) * 100)
})
const totalDays = computed(() => {
  const days = new Set()
  practiceHistory.value.forEach((p) => days.add(new Date(p.time).toDateString()))
  return days.size
})
const recentWrongWords = computed(() => [...wrongAnswers.value].sort((a, b) => b.time - a.time).slice(0, 5))

function getDailyPracticeCounts(daysBack = 35) {
  const counts = {}
  const now = new Date()
  for (let i = daysBack - 1; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i); counts[d.toDateString()] = 0
  }
  practiceHistory.value.forEach((p) => {
    const key = new Date(p.time).toDateString()
    if (counts[key] !== undefined) counts[key]++
  })
  return counts
}

const LEVELS = [
  { name: '蒙童', min: 0, max: 9 },
  { name: '童生', min: 10, max: 29 },
  { name: '秀才', min: 30, max: 79 },
  { name: '举人', min: 80, max: 199 },
  { name: '贡士', min: 200, max: 499 },
  { name: '进士', min: 500, max: 999 },
  { name: '翰林', min: 1000, max: 1999 },
  { name: '学士', min: 2000, max: 4999 },
  { name: '太傅', min: 5000, max: 9999 },
  { name: '文宗', min: 10000, max: Infinity },
]

const userLevel = computed(() => {
  const total = totalPracticed.value
  for (const level of LEVELS) {
    if (total >= level.min && total <= level.max) return level
  }
  return LEVELS[0]
})

const nextLevel = computed(() => {
  const idx = LEVELS.indexOf(userLevel.value)
  return idx < LEVELS.length - 1 ? LEVELS[idx + 1] : null
})

const levelProgress = computed(() => {
  const lvl = userLevel.value
  const range = lvl.max - lvl.min
  if (range === Infinity || range === 0) return 100
  return Math.round(((totalPracticed.value - lvl.min) / range) * 100)
})

export function useVocabulary() {
  init()
  return {
    vocabularies, activeVocabId, setActiveVocab, importVocab, deleteImportedVocab,
    allWords, search, getByWord, getContentWords, getFunctionWords, getAllWords,
    startQuizSession, startSingleWordQuiz,
    getCurrentQuizQuestion, getCurrentQuizIndex, getQuizSize, isQuizCompleted,
    answerQuizQuestion, finishQuiz, advanceQuiz, resetQuiz,
    sessionTotal, sessionCorrect, sessionAccuracy,
    practiceHistory, wrongAnswers, recordAnswer,
    totalPracticed, masteredWords, todayAccuracy, totalDays, recentWrongWords,
    getDailyPracticeCounts, userLevel, nextLevel, levelProgress,
    themePreset, applyThemePreset,
  }
}
