import { useState, useEffect } from 'react'
import './App.css'
import part1Questions from './part1.json'
import part2Questions from './part2.json'

const CATEGORIES = {
  PART1: {
    id: 'part1',
    name: 'Part 1 — MCQ',
    questions: part1Questions,
    icon: '📡',
  },
  PART2: {
    id: 'part2',
    name: 'Part 2 — True / False',
    questions: part2Questions,
    icon: '📶',
  },
}

const SCREENS = { HOME: 'home', QUIZ: 'quiz', RESULTS: 'results' }
const STORAGE_KEY = 'quiz_onyx_state'

const getSavedCategoryData = (categoryKey) => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      return parsed.categories?.[categoryKey] || null
    }
  } catch (e) { /* ignore */ }
  return null
}

const getCategoryProgress = (categoryKey) => {
  const saved = getSavedCategoryData(categoryKey)
  if (saved?.userAnswers) {
    const answered = Object.keys(saved.userAnswers).length
    const total = CATEGORIES[categoryKey].questions.length
    return Math.round((answered / total) * 100)
  }
  return 0
}

export default function App() {
  const [screen, setScreen]             = useState(SCREENS.HOME)
  const [selectedCategory, setSelected] = useState(null)
  const [currentQuestion, setCurrentQ]  = useState(0)
  const [userAnswers, setUserAnswers]   = useState({})
  const [selectedOption, setSelectedOpt]= useState(null)
  const [isTransitioning, setTrans]     = useState(false)
  const [showWrongOnly, setShowWrong]   = useState(false)

  const questions = selectedCategory ? CATEGORIES[selectedCategory].questions : []

  // ── Restore ────────────────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (!saved) return
      const parsed = JSON.parse(saved)
      const cat = parsed.currentView?.selectedCategory || null
      setScreen(parsed.currentView?.screen || SCREENS.HOME)
      setSelected(cat)
      if (cat && parsed.categories?.[cat]) {
        const cs = parsed.categories[cat]
        setCurrentQ(cs.currentQuestion || 0)
        setUserAnswers(cs.userAnswers || {})
        setSelectedOpt(cs.selectedOption || null)
      }
    } catch (e) { /* ignore */ }
  }, [])

  // ── Persist ────────────────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      const existing = raw ? JSON.parse(raw) : { categories: {} }
      existing.currentView = { screen, selectedCategory }
      if (selectedCategory) {
        existing.categories = existing.categories || {}
        existing.categories[selectedCategory] = {
          currentQuestion, userAnswers, selectedOption
        }
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existing))
    } catch (e) { /* ignore */ }
  }, [screen, selectedCategory, currentQuestion, userAnswers, selectedOption])

  // ── Helpers ────────────────────────────────────────────────────────────────
  const go = (fn) => {
    setTrans(true)
    setTimeout(() => { fn(); setTrans(false) }, 260)
  }

  const selectCategory = (key) => {
    go(() => {
      const saved = getSavedCategoryData(key)
      setSelected(key)
      setScreen(SCREENS.QUIZ)
      if (saved) {
        setCurrentQ(saved.currentQuestion || 0)
        setUserAnswers(saved.userAnswers || {})
        setSelectedOpt(saved.selectedOption || null)
      } else {
        setCurrentQ(0); setUserAnswers({}); setSelectedOpt(null)
      }
    })
  }

  // Lock on first click — show immediate green / red
  const selectOption = (option) => {
    if (userAnswers[currentQuestion] !== undefined) return
    setSelectedOpt(option)
    setUserAnswers((prev) => ({ ...prev, [currentQuestion]: option }))
  }

  const nextQuestion = () => {
    if (userAnswers[currentQuestion] === undefined) return
    go(() => {
      const next = currentQuestion + 1
      setCurrentQ(next)
      setSelectedOpt(userAnswers[next] ?? null)
    })
  }

  const prevQuestion = () => {
    if (currentQuestion === 0) return
    go(() => {
      const prev = currentQuestion - 1
      setCurrentQ(prev)
      setSelectedOpt(userAnswers[prev] ?? null)
    })
  }

  const finishQuiz = () => {
    if (userAnswers[currentQuestion] === undefined) return
    go(() => { setScreen(SCREENS.RESULTS); setShowWrong(false) })
  }

  const restartQuiz = () => {
    go(() => {
      setScreen(SCREENS.QUIZ); setCurrentQ(0); setUserAnswers({}); setSelectedOpt(null)
    })
  }

  const goHome = () => {
    go(() => {
      setScreen(SCREENS.HOME); setSelected(null)
      setCurrentQ(0); setUserAnswers({}); setSelectedOpt(null)
    })
  }

  const clearAll = () => {
    try { localStorage.removeItem(STORAGE_KEY) } catch (e) { /* ignore */ }
    setSelected(null)
    setCurrentQ(0)
    setUserAnswers({})
    setSelectedOpt(null)
    // Force a re-render so progress bars disappear instantly
    setScreen(SCREENS.HOME)
  }

  const calculateScore = () =>
    questions.reduce((acc, q, i) => acc + (userAnswers[i] === q.answer ? 1 : 0), 0)

  const getPercentage = () => Math.round((calculateScore() / questions.length) * 100)

  // Per-question feedback
  const isAnswered = userAnswers[currentQuestion] !== undefined
  const userAnswer = userAnswers[currentQuestion]
  const isCorrect  = isAnswered && userAnswer === (questions[currentQuestion]?.answer)

  const getOptClass = (option) => {
    if (!isAnswered) return selectedOption === option ? 'selected' : ''
    const q = questions[currentQuestion]
    if (option === q.answer) return 'opt-correct'
    if (option === userAnswer) return 'opt-wrong'
    return 'opt-dimmed'
  }

  const pageClass = isTransitioning ? 'page-exit' : 'page-enter'

  // ══════════════════════════════════════════════════════════════════════════
  // HOME
  // ══════════════════════════════════════════════════════════════════════════
  if (screen === SCREENS.HOME) return (
    <div className="app-root">
      <div className={`home-screen ${pageClass}`}>
        <div className="home-inner">

          <div className="brand-mark">
            <div className="brand-icon-wrap">
              <svg className="brand-icon-svg" viewBox="0 0 100 100" fill="none">
                <circle cx="50" cy="50" r="44" stroke="currentColor" strokeWidth="3.5" />
                <path
                  d="M30 48C30 36 38 30 50 30C62 30 70 38 70 47C70 56 61 59 50 64"
                  stroke="currentColor" strokeWidth="4.5" strokeLinecap="round"
                />
                <circle cx="50" cy="76" r="5" fill="currentColor" />
              </svg>
            </div>
            <div>
              <h1 className="brand-title">
                Wireless and Communication
                <span className="brand-sub">Midterm Revision 25–26</span>
              </h1>
            </div>
          </div>

          <div className="home-divider">
            <span className="divider-text">Select section</span>
          </div>

          <div className="category-grid">
            {Object.entries(CATEGORIES).map(([key, cat]) => {
              const progress = getCategoryProgress(key)
              const saved    = getSavedCategoryData(key)
              const answered = saved?.userAnswers
                ? Object.keys(saved.userAnswers).length : 0
              return (
                <button
                  key={key}
                  className={`cat-card ${progress > 0 ? 'has-progress' : ''}`}
                  onClick={() => selectCategory(key)}
                >
                  <div className="cat-icon">{cat.icon}</div>
                  <div>
                    <div className="cat-name">{cat.name}</div>
                    <div className="cat-count">{cat.questions.length} questions</div>
                  </div>
                  {progress > 0 && (
                    <div className="cat-progress">
                      <div className="cat-progress-track">
                        <div
                          className="cat-progress-fill"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="cat-progress-label">
                        {answered} / {cat.questions.length} &middot; {progress}%
                      </span>
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          <button className="clear-btn" onClick={clearAll} title="Clear all saved progress and localStorage">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6M14 11v6"/>
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
            Clear All Progress
          </button>

          <div className="home-footer">Wireless &amp; Mobile Networks</div>
        </div>
      </div>
    </div>
  )

  // ══════════════════════════════════════════════════════════════════════════
  // QUIZ
  // ══════════════════════════════════════════════════════════════════════════
  if (screen === SCREENS.QUIZ) {
    const question = questions[currentQuestion]
    const isLast   = currentQuestion === questions.length - 1
    const pct      = ((currentQuestion + 1) / questions.length) * 100
    const category = CATEGORIES[selectedCategory]

    return (
      <div className="app-root">
        <div className={`quiz-screen ${pageClass}`}>

          <div className="quiz-topbar">
            <div className="quiz-badge">
              <span className="badge-dot" />
              {category.icon}&nbsp;&nbsp;{category.name}
            </div>
            <button className="home-btn" onClick={goHome}>
              &#8592; Home
            </button>
          </div>

          <div className="progress-row">
            <div className="progress-meta">
              <span className="progress-label">Progress</span>
              <span className="progress-fraction">
                {currentQuestion + 1} / {questions.length}
              </span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${pct}%` }} />
            </div>
          </div>

          <div className="question-card">
            <div className="q-index">Question {currentQuestion + 1}</div>
            <h2 className="question-text">{question.question}</h2>
          </div>

          <div className="options-list">
            {question.options.map((option, i) => {
              const cls = getOptClass(option)
              return (
                <button
                  key={i}
                  className={`opt-btn ${cls}`}
                  onClick={() => selectOption(option)}
                  disabled={isAnswered}
                >
                  <span className="opt-letter">{String.fromCharCode(65 + i)}</span>
                  <span className="opt-text">{option}</span>
                  {isAnswered && option === question.answer && (
                    <span className="fb-icon fb-ok">&#10003;</span>
                  )}
                  {isAnswered && option === userAnswer && !isCorrect && (
                    <span className="fb-icon fb-err">&#10007;</span>
                  )}
                  {!isAnswered && selectedOption === option && (
                    <span className="check-mark">&#10003;</span>
                  )}
                </button>
              )
            })}
          </div>

          {isAnswered && !isCorrect && question.correction && (
            <div className="correction-box">
              <div>
                <span className="correction-label">Correction</span>
                <span className="correction-text">{question.correction}</span>
              </div>
            </div>
          )}

          <div className="quiz-nav">
            <button
              className="nav-btn prev-btn"
              onClick={prevQuestion}
              disabled={currentQuestion === 0}
            >
              <span className="btn-arrow">&#8592;</span> Previous
            </button>

            {isLast ? (
              <button
                className="nav-btn finish-btn"
                onClick={finishQuiz}
                disabled={!isAnswered}
              >
                Finish Quiz <span className="btn-arrow">&#8594;</span>
              </button>
            ) : (
              <button
                className="nav-btn next-btn"
                onClick={nextQuestion}
                disabled={!isAnswered}
              >
                Next <span className="btn-arrow">&#8594;</span>
              </button>
            )}
          </div>

        </div>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RESULTS
  // ══════════════════════════════════════════════════════════════════════════
  if (screen === SCREENS.RESULTS) {
    const score    = calculateScore()
    const pct      = getPercentage()
    const wrong    = questions.length - score
    const category = CATEGORIES[selectedCategory]

    let gradeClass = 'grade-low',   gradeEmoji = '😔', gradeLabel = 'Need More Practice'
    if (pct >= 80) { gradeClass = 'grade-excellent'; gradeEmoji = '🏆'; gradeLabel = 'Excellent!' }
    else if (pct >= 60) { gradeClass = 'grade-good';    gradeEmoji = '👍'; gradeLabel = 'Good Job!' }
    else if (pct >= 40) { gradeClass = 'grade-average'; gradeEmoji = '📚'; gradeLabel = 'Keep Trying!' }

    const reviewData = questions
      .map((q, i) => ({ q, i }))
      .filter(({ q, i }) => !showWrongOnly || userAnswers[i] !== q.answer)

    return (
      <div className="app-root">
        <div className={`results-screen ${pageClass}`}>

          <div className="results-head">
            <div className="results-badge">
              <span className="badge-dot" />
              {category.icon}&nbsp;&nbsp;{category.name}
            </div>
            <button className="results-home-btn" onClick={goHome}>
              &#8592; Home
            </button>
          </div>

          <div className={`score-panel ${gradeClass}`}>
            <div className="score-left">
              <span className="score-emoji">{gradeEmoji}</span>
              <div className="score-fraction">
                <span>{score}</span>
                <span className="score-slash">/</span>
                <span className="score-total-num">{questions.length}</span>
              </div>
            </div>
            <div className="score-right">
              <div className="score-pct">{pct}%</div>
              <div className="score-grade-label">{gradeLabel}</div>
              <div className="score-sep" />
              <div className="score-stats">
                <div className="stat-item">
                  <span className="stat-val ok-val">{score}</span>
                  <span className="stat-lbl">Correct</span>
                </div>
                <div className="stat-item">
                  <span className="stat-val err-val">{wrong}</span>
                  <span className="stat-lbl">Wrong</span>
                </div>
                <div className="stat-item">
                  <span className="stat-val">{questions.length}</span>
                  <span className="stat-lbl">Total</span>
                </div>
              </div>
            </div>
          </div>

          <div className="review-bar">
            <h2 className="review-heading">Review Answers</h2>
            {wrong > 0 && (
              <button
                className={`filter-btn ${showWrongOnly ? 'active' : ''}`}
                onClick={() => setShowWrong((v) => !v)}
              >
                <span className="filter-dot" />
                {showWrongOnly
                  ? `Show All (${questions.length})`
                  : `Show ${wrong} Wrong Only`}
              </button>
            )}
          </div>

          <div className="review-list">
            {reviewData.length === 0 ? (
              <div className="all-correct-card">
                All answers correct — perfect score!
              </div>
            ) : (
              reviewData.map(({ q, i }) => {
                const ua      = userAnswers[i]
                const correct = ua === q.answer

                return (
                  <div key={i} className={`review-card ${correct ? 'correct' : 'incorrect'}`}>
                    <div className="review-card-head">
                      <span className="rv-qnum">Q{i + 1}</span>
                      <span className={`rv-status ${correct ? 'ok-status' : 'err-status'}`}>
                        {correct ? '✓ Correct' : '✗ Incorrect'}
                      </span>
                    </div>
                    <div className="review-card-body">
                      <p className="rv-question">{q.question}</p>
                      <div className="rv-options">
                        {q.options.map((opt, oi) => {
                          const isUser    = opt === ua
                          const isCorrOpt = opt === q.answer
                          let cls = ''
                          if (isCorrOpt) cls = 'rv-correct'
                          else if (isUser && !correct) cls = 'rv-wrong'
                          return (
                            <div key={oi} className={`rv-opt ${cls}`}>
                              <span className="rv-letter">
                                {String.fromCharCode(65 + oi)}
                              </span>
                              <span className="rv-opt-text">{opt}</span>
                              {isCorrOpt && (
                                <span className="rv-badge ok-badge">&#10003; Correct</span>
                              )}
                              {isUser && !correct && (
                                <span className="rv-badge err-badge">&#10007; Yours</span>
                              )}
                              {isUser && correct && (
                                <span className="rv-badge you-badge">Your Answer</span>
                              )}
                            </div>
                          )
                        })}
                      </div>
                      {!correct && q.correction && (
                        <div className="rv-correction">
                          <div>
                            <span className="correction-label">Correction</span>
                            <span className="correction-text">{q.correction}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          <div className="results-actions">
            <button className="action-btn restart-btn" onClick={restartQuiz}>
              <span className="action-icon">&#8635;</span> Restart Quiz
            </button>
            <button className="action-btn results-home-action" onClick={goHome}>
              <span className="action-icon">&#8592;</span> Back to Home
            </button>
          </div>

        </div>
      </div>
    )
  }

  return null
}
