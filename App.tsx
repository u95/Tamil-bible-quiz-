import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Scroll, Sparkles, User, Trophy, Play, CheckCircle, 
  XCircle, ArrowLeft, ArrowRight, RefreshCw, Copy, Check, 
  HelpCircle, Star, Lock, Unlock, Eye, Sparkle, Download, Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ALL_QUIZ_CATEGORIES_EXPANDED, QuizCategory, QuizLevel, Question } from './quizData';

// Motivational Tamil Bible Verses for the Dashboard
const DEVOTIONAL_VERSES = [
  { verse: "உமது வசனம் என் கால்களுக்குத் தீபமும், என் பாதைக்கு வெளிச்சமுமாய் இருக்கிறது.", ref: "சங்கீதம் 119:105" },
  { verse: "கர்த்தருக்குப் பயப்படுதலே ஞானத்தின் ஆரம்பம்; பரிசுத்தரின் அறிவே அறிவு.", ref: "நீதிமொழிகள் 9:10" },
  { verse: "என் ஜனங்கள் அறிவில்லாமையினால் சங்காரமாகிறார்கள்.", ref: "ஓசியா 4:6" },
  { verse: "வேதவாக்கியங்களையெல்லாம் ஆராய்ந்து பாருங்கள்; அவைகளால் உங்களுக்கு நித்தியஜீவன் உண்டென்று எண்ணுகிறீர்களே.", ref: "யோவான் 5:39" },
  { verse: "மனுஷன் அப்பத்தினாலேமாத்திரமல்ல, தேவனுடைய வாயிலிருந்து புறப்படுகிற ஒவ்வொரு வார்த்தையினாலும் பிழைப்பான்.", ref: "மத்தேயு 4:4" }
];

interface CompletedLevelState {
  categoryId: string;
  levelNumber: number;
  score: number;
  stars: number;
}

export default function App() {
  // Navigation State
  // 'dashboard' | 'levels' | 'quiz' | 'exporter'
  const [currentScreen, setCurrentScreen] = useState<'dashboard' | 'levels' | 'quiz' | 'exporter'>('dashboard');
  
  // Selected category and level
  const [selectedCategory, setSelectedCategory] = useState<QuizCategory | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<QuizLevel | null>(null);
  
  // Quiz Game Loop State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  
  // Progression Storage
  const [completedLevels, setCompletedLevels] = useState<CompletedLevelState[]>(() => {
    const saved = localStorage.getItem('bible_quiz_progress');
    return saved ? JSON.parse(saved) : [];
  });

  // Daily Bible Verse Selector
  const [currentVerse, setCurrentVerse] = useState({ verse: '', ref: '' });

  // Exporter Code State
  const [isCopied, setIsCopied] = useState(false);
  const [exporterCategory, setExporterCategory] = useState<string>('all');

  useEffect(() => {
    // Select a random Bible verse on mount
    const randomVerse = DEVOTIONAL_VERSES[Math.floor(Math.random() * DEVOTIONAL_VERSES.length)];
    setCurrentVerse(randomVerse);
  }, []);

  // Save progress to local storage
  const saveProgress = (categoryId: string, levelNumber: number, finalScore: number, starsEarned: number) => {
    const newProgress = [...completedLevels];
    const existingIndex = newProgress.findIndex(
      p => p.categoryId === categoryId && p.levelNumber === levelNumber
    );

    const levelData = {
      categoryId,
      levelNumber,
      score: finalScore,
      stars: starsEarned
    };

    if (existingIndex > -1) {
      // Only update if new score or stars are higher
      if (starsEarned > newProgress[existingIndex].stars) {
        newProgress[existingIndex] = levelData;
      }
    } else {
      newProgress.push(levelData);
    }

    setCompletedLevels(newProgress);
    localStorage.setItem('bible_quiz_progress', JSON.stringify(newProgress));
  };

  // Helper to check if a level is unlocked
  const isLevelUnlocked = (categoryId: string, levelNumber: number) => {
    if (levelNumber === 1) return true; // Level 1 is always unlocked
    // Level N is unlocked if Level N-1 is completed with at least 1 star
    return completedLevels.some(
      p => p.categoryId === categoryId && p.levelNumber === levelNumber - 1 && p.stars > 0
    );
  };

  // Helper to get stars for a completed level
  const getLevelStars = (categoryId: string, levelNumber: number) => {
    const levelState = completedLevels.find(
      p => p.categoryId === categoryId && p.levelNumber === levelNumber
    );
    return levelState ? levelState.stars : 0;
  };

  // Helper to get total stars earned
  const getTotalStars = () => {
    return completedLevels.reduce((total, level) => total + level.stars, 0);
  };

  // Handle Category Selection
  const handleSelectCategory = (category: QuizCategory) => {
    setSelectedCategory(category);
    setCurrentScreen('levels');
  };

  // Handle Level Selection
  const handleSelectLevel = (level: QuizLevel) => {
    if (!selectedCategory || !isLevelUnlocked(selectedCategory.id, level.levelNumber)) return;
    setSelectedLevel(level);
    setCurrentQuestionIndex(0);
    setSelectedOptionIndex(null);
    setIsAnswerSubmitted(false);
    setScore(0);
    setQuizFinished(false);
    setCurrentScreen('quiz');
  };

  // Handle submitting an answer option
  const handleOptionSelect = (idx: number) => {
    if (isAnswerSubmitted) return;
    setSelectedOptionIndex(idx);
    setIsAnswerSubmitted(true);
    
    if (selectedLevel) {
      const q = selectedLevel.questions[currentQuestionIndex];
      if (idx === q.correctAnswerIndex) {
        setScore(prev => prev + 1);
      }
    }
  };

  // Advance to next question or complete quiz
  const handleNextQuestion = () => {
    if (!selectedLevel || !selectedCategory) return;
    
    if (currentQuestionIndex < selectedLevel.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOptionIndex(null);
      setIsAnswerSubmitted(false);
    } else {
      // Quiz complete!
      setQuizFinished(true);
      const totalQuestions = selectedLevel.questions.length;
      const percentage = (score / totalQuestions) * 100;
      
      let starsEarned = 0;
      if (percentage >= 100) starsEarned = 3;
      else if (percentage >= 80) starsEarned = 2;
      else if (percentage >= 60) starsEarned = 1;

      saveProgress(selectedCategory.id, selectedLevel.levelNumber, score, starsEarned);
    }
  };

  // Helper to get category icon component
  const renderCategoryIcon = (iconName: string, className = "h-6 w-6") => {
    switch (iconName) {
      case 'Scroll': return <Scroll className={className} />;
      case 'BookOpen': return <BookOpen className={className} />;
      case 'Sparkles': return <Sparkles className={className} />;
      case 'User': return <User className={className} />;
      default: return <BookOpen className={className} />;
    }
  };

  // Blogger Exporter Template Generator
  const generateBloggerCode = () => {
    // Generate Blogger self-contained HTML/CSS/JS code matching the chosen category
    const categoriesToExport = exporterCategory === 'all' 
      ? ALL_QUIZ_CATEGORIES_EXPANDED 
      : ALL_QUIZ_CATEGORIES_EXPANDED.filter(c => c.id === exporterCategory);

    const questionsDataJSON = JSON.stringify(categoriesToExport, null, 2);

    return `<!DOCTYPE html>
<html lang="ta">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>விவிலிய வினாடி வினா - Bible Tamil Quiz</title>
  <!-- Google Fonts & Tailwind CSS CDN -->
  <link href="https://fonts.googleapis.com/css2?family=Hind+Madurai:wght@400;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            sans: ['Inter', 'sans-serif'],
            tamil: ['Hind Madurai', 'sans-serif'],
          }
        }
      }
    }
  </script>
  <style>
    /* Custom Colorful & Smooth Transitions */
    .animated-bg {
      background: linear-gradient(135deg, #1e1b4b 0%, #311042 50%, #0c0a0f 100%);
    }
    .accent-glow {
      box-shadow: 0 0 20px rgba(139, 92, 246, 0.4);
    }
    .custom-scrollbar::-webkit-scrollbar {
      width: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.05);
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.2);
      border-radius: 4px;
    }
  </style>
</head>
<body class="animated-bg min-h-screen text-slate-100 font-sans p-3 sm:p-6 flex flex-col justify-between">

  <!-- Header Section -->
  <header class="max-w-4xl mx-auto w-full text-center py-6 border-b border-white/10 mb-6">
    <h1 class="font-tamil text-3xl sm:text-4xl font-bold bg-gradient-to-r from-amber-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">
      விவிலிய வினாடி வினா
    </h1>
    <p class="text-xs sm:text-sm text-slate-400 uppercase tracking-widest mt-1">Bible Tamil Quiz Game</p>
  </header>

  <!-- Main Game Stage -->
  <main class="max-w-3xl mx-auto w-full flex-1 flex flex-col justify-center">
    
    <!-- CATEGORY SCREEN -->
    <div id="category-screen" class="space-y-6">
      <div class="text-center space-y-2">
        <h2 class="font-tamil text-xl text-amber-350">வினாடி வினா பிரிவைத் தேர்ந்தெடுக்கவும்</h2>
        <p class="text-xs text-slate-400">Select a Quiz Category to Begin</p>
      </div>
      <div id="category-container" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <!-- Rendered via JS -->
      </div>
    </div>

    <!-- LEVEL SCREEN (Initially Hidden) -->
    <div id="level-screen" class="hidden space-y-6">
      <div class="flex items-center justify-between">
        <button onclick="showScreen('category')" class="px-4 py-2 bg-white/5 hover:bg-white/10 text-xs font-semibold rounded-xl flex items-center gap-2 border border-white/10 transition">
          ← பின்செல் (Back)
        </button>
        <span id="level-category-title" class="font-tamil font-bold text-lg text-amber-400">பிரிவு</span>
      </div>
      
      <div class="text-center space-y-1">
        <h2 class="font-tamil text-xl text-slate-200">லெவல்கள் (Levels 1 - 10)</h2>
        <p class="text-xs text-slate-400">அடுத்த லெவலைத் திறக்க முந்தைய லெவலில் 60% பெறவும்</p>
      </div>

      <div id="level-grid" class="grid grid-cols-2 sm:grid-cols-5 gap-3 max-w-xl mx-auto">
        <!-- Rendered via JS -->
      </div>
    </div>

    <!-- QUIZ PLAY SCREEN (Initially Hidden) -->
    <div id="quiz-screen" class="hidden bg-white/5 border border-white/10 p-5 sm:p-8 rounded-3xl space-y-6 accent-glow">
      <div class="flex justify-between items-center border-b border-white/10 pb-4">
        <div>
          <span id="quiz-category-tag" class="text-[10px] font-bold uppercase tracking-widest bg-amber-400/20 text-amber-300 px-2.5 py-1 rounded-full"></span>
          <h3 id="quiz-level-tag" class="text-xs font-semibold text-slate-400 mt-1">லெவல் 1</h3>
        </div>
        <div id="quiz-progress-text" class="text-xs font-bold text-slate-450">கேள்வி 1/5</div>
      </div>

      <!-- Question Box -->
      <div class="space-y-4">
        <div class="w-full bg-white/10 h-2 rounded-full overflow-hidden">
          <div id="quiz-progress-bar" class="bg-gradient-to-r from-amber-400 to-indigo-500 h-full w-0 transition-all duration-300"></div>
        </div>
        <h2 id="quiz-question-text" class="font-tamil text-lg sm:text-xl font-semibold leading-relaxed text-slate-100"></h2>
      </div>

      <!-- Options Container -->
      <div id="quiz-options" class="grid grid-cols-1 gap-3 pt-2">
        <!-- Rendered via JS -->
      </div>

      <!-- Explanation & Next Area (Initially Hidden) -->
      <div id="explanation-container" class="hidden bg-white/5 border border-white/10 p-4 rounded-2xl space-y-3">
        <div class="flex items-start gap-2.5">
          <span id="explanation-status-icon" class="text-2xl">💡</span>
          <div>
            <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400">விளக்கம் (Explanation):</h4>
            <p id="explanation-text" class="font-tamil text-xs sm:text-sm text-slate-300 mt-1"></p>
          </div>
        </div>
        <button id="next-btn" onclick="nextQuestion()" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl text-sm transition flex items-center justify-center gap-2">
          அடுத்த கேள்வி (Next) →
        </button>
      </div>
    </div>

    <!-- RESULTS SCREEN (Initially Hidden) -->
    <div id="result-screen" class="hidden text-center bg-white/5 border border-white/10 p-8 rounded-3xl space-y-6 max-w-md mx-auto">
      <div class="inline-flex p-4 bg-amber-400/10 rounded-full text-amber-400 text-5xl">
        🏆
      </div>
      <div class="space-y-2">
        <h2 class="font-tamil text-2xl font-bold text-white">விளையாட்டு முடிந்தது!</h2>
        <p class="text-xs text-slate-400">You Finished the Level</p>
      </div>

      <div class="bg-white/5 border border-white/10 p-4 rounded-2xl space-y-2">
        <div class="text-sm text-slate-400 uppercase tracking-widest">உமது மதிப்பெண் (Your Score)</div>
        <div id="result-score" class="text-4xl font-extrabold text-amber-400">4 / 5</div>
        <div id="result-stars" class="text-2xl text-amber-300 tracking-wider">⭐⭐⭐</div>
      </div>

      <div class="flex flex-col gap-2.5 pt-4">
        <button onclick="retryLevel()" class="w-full bg-white/10 hover:bg-white/15 text-white font-bold py-3 px-6 rounded-xl text-sm transition border border-white/10">
          மீண்டும் விளையாடு (Retry) ↺
        </button>
        <button onclick="showScreen('level')" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl text-sm transition">
          லெவல் பட்டியலுக்குச் செல் (Level Map)
        </button>
      </div>
    </div>

  </main>

  <!-- Footer -->
  <footer class="max-w-4xl mx-auto w-full text-center py-6 text-xs text-slate-500 border-t border-white/10 mt-8 font-tamil">
    &copy; விவிலிய வினாடி வினா - Blogger Widget Template
  </footer>

  <!-- Quiz Engine Logic & Data -->
  <script>
    const QUIZ_DATA = ${questionsDataJSON};

    // Progression Engine stored in LocalStorage
    let progress = JSON.parse(localStorage.getItem('blogger_bible_progress') || '[]');

    let selectedCat = null;
    let selectedLvl = null;
    let currentQIdx = 0;
    let score = 0;
    let answerSubmitted = false;

    function saveBloggerProgress(catId, lvlNo, scoreVal, starsVal) {
      const existingIdx = progress.findIndex(p => p.catId === catId && p.lvlNo === lvlNo);
      const data = { catId, lvlNo, score: scoreVal, stars: starsVal };
      if (existingIdx > -1) {
        if (starsVal > progress[existingIdx].stars) {
          progress[existingIdx] = data;
        }
      } else {
        progress.push(data);
      }
      localStorage.setItem('blogger_bible_progress', JSON.stringify(progress));
    }

    function isBloggerLevelUnlocked(catId, lvlNo) {
      if (lvlNo === 1) return true;
      return progress.some(p => p.catId === catId && p.lvlNo === lvlNo - 1 && p.stars > 0);
    }

    function getBloggerLevelStars(catId, lvlNo) {
      const match = progress.find(p => p.catId === catId && p.lvlNo === lvlNo);
      return match ? match.stars : 0;
    }

    function showScreen(screenId) {
      document.getElementById('category-screen').classList.add('hidden');
      document.getElementById('level-screen').classList.add('hidden');
      document.getElementById('quiz-screen').classList.add('hidden');
      document.getElementById('result-screen').classList.add('hidden');

      if (screenId === 'category') {
        renderCategories();
        document.getElementById('category-screen').classList.remove('hidden');
      } else if (screenId === 'level') {
        renderLevels();
        document.getElementById('level-screen').classList.remove('hidden');
      } else if (screenId === 'quiz') {
        startQuiz();
        document.getElementById('quiz-screen').classList.remove('hidden');
      } else if (screenId === 'result') {
        showResults();
        document.getElementById('result-screen').classList.remove('hidden');
      }
    }

    function renderCategories() {
      const container = document.getElementById('category-container');
      container.innerHTML = '';
      
      QUIZ_DATA.forEach(cat => {
        const div = document.createElement('div');
        div.className = "bg-white/5 border border-white/10 hover:border-white/20 p-5 rounded-2xl cursor-pointer transition transform hover:-translate-y-1 hover:shadow-lg flex flex-col justify-between h-44";
        div.onclick = () => {
          selectedCat = cat;
          showScreen('level');
        };

        div.innerHTML = \`
          <div class="space-y-2">
            <h3 class="font-tamil text-lg font-bold text-amber-400">\${cat.name}</h3>
            <p class="text-xs text-slate-400 uppercase tracking-wider">\${cat.nameEnglish}</p>
            <p class="font-tamil text-xs text-slate-300 leading-relaxed line-clamp-2">\${cat.description}</p>
          </div>
          <div class="flex justify-between items-center text-xs text-amber-400 font-semibold pt-2 border-t border-white/5">
            <span>10 லெவல்கள் (Levels)</span>
            <span>விளையாடு →</span>
          </div>
        \`;
        container.appendChild(div);
      });
    }

    function renderLevels() {
      document.getElementById('level-category-title').innerText = selectedCat.name;
      const grid = document.getElementById('level-grid');
      grid.innerHTML = '';

      selectedCat.levels.forEach(level => {
        const unlocked = isBloggerLevelUnlocked(selectedCat.id, level.levelNumber);
        const stars = getBloggerLevelStars(selectedCat.id, level.levelNumber);
        
        const btn = document.createElement('button');
        btn.disabled = !unlocked;
        
        let buttonClass = "aspect-square flex flex-col items-center justify-center rounded-2xl transition border text-center p-2 ";
        if (unlocked) {
          buttonClass += "bg-white/5 border-white/10 hover:bg-white/10 text-slate-100 hover:border-white/20 active:scale-95";
        } else {
          buttonClass += "bg-black/20 border-white/5 text-slate-600 cursor-not-allowed";
        }

        let starDisplay = "";
        if (unlocked && stars > 0) {
          starDisplay = "<span class='text-[10px] text-amber-400'>" + "★".repeat(stars) + "☆".repeat(3 - stars) + "</span>";
        } else if (unlocked) {
          starDisplay = "<span class='text-[10px] text-slate-500'>☆☆☆</span>";
        } else {
          starDisplay = "<span class='text-[10px]'>🔒 Locked</span>";
        }

        btn.className = buttonClass;
        btn.onclick = () => {
          selectedLvl = level;
          showScreen('quiz');
        };

        btn.innerHTML = \`
          <span class="text-xs font-semibold text-slate-400">Level</span>
          <span class="text-xl font-extrabold my-1">\${level.levelNumber}</span>
          \${starDisplay}
        \`;
        grid.appendChild(btn);
      });
    }

    function startQuiz() {
      currentQIdx = 0;
      score = 0;
      answerSubmitted = false;
      
      document.getElementById('quiz-category-tag').innerText = selectedCat.name;
      document.getElementById('quiz-level-tag').innerText = "லெவல் " + selectedLvl.levelNumber + " - " + selectedLvl.title;
      
      loadQuestion();
    }

    function loadQuestion() {
      answerSubmitted = false;
      document.getElementById('explanation-container').classList.add('hidden');
      
      const q = selectedLvl.questions[currentQIdx];
      const totalQs = selectedLvl.questions.length;
      
      // Update progresses
      document.getElementById('quiz-progress-text').innerText = "கேள்வி " + (currentQIdx + 1) + "/" + totalQs;
      const progressPercent = ((currentQIdx + 1) / totalQs) * 100;
      document.getElementById('quiz-progress-bar').style.width = progressPercent + "%";
      
      document.getElementById('quiz-question-text').innerText = q.question;
      
      const optionsContainer = document.getElementById('quiz-options');
      optionsContainer.innerHTML = '';
      
      q.options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = "w-full text-left font-tamil text-sm sm:text-base p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-200 flex items-center justify-between";
        btn.onclick = () => selectOption(idx, btn);
        btn.innerHTML = \`
          <span>\${opt}</span>
          <span class="w-5 h-5 rounded-full border border-white/20 flex items-center justify-center text-xs"></span>
        \`;
        optionsContainer.appendChild(btn);
      });
    }

    function selectOption(optIdx, buttonElement) {
      if (answerSubmitted) return;
      answerSubmitted = true;
      
      const q = selectedLvl.questions[currentQIdx];
      const isCorrect = optIdx === q.correctAnswerIndex;
      
      if (isCorrect) {
        score++;
        buttonElement.className = "w-full text-left font-tamil text-sm sm:text-base p-4 rounded-xl bg-emerald-500/20 border-emerald-500 text-emerald-300 transition-all duration-200 flex items-center justify-between";
        buttonElement.querySelector('span:last-child').className = "w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-xs text-white font-bold";
        buttonElement.querySelector('span:last-child').innerHTML = "✓";
        document.getElementById('explanation-status-icon').innerText = "🎉";
      } else {
        buttonElement.className = "w-full text-left font-tamil text-sm sm:text-base p-4 rounded-xl bg-rose-500/20 border-rose-500 text-rose-300 transition-all duration-200 flex items-center justify-between";
        buttonElement.querySelector('span:last-child').className = "w-5 h-5 rounded-full bg-rose-500 flex items-center justify-center text-xs text-white font-bold";
        buttonElement.querySelector('span:last-child').innerHTML = "✕";
        
        // Highlight correct option as well
        const optionsChildren = document.getElementById('quiz-options').children;
        const correctButton = optionsChildren[q.correctAnswerIndex];
        correctButton.className = "w-full text-left font-tamil text-sm sm:text-base p-4 rounded-xl bg-emerald-500/20 border-emerald-500 text-emerald-300 transition-all duration-200 flex items-center justify-between";
        correctButton.querySelector('span:last-child').className = "w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-xs text-white font-bold";
        correctButton.querySelector('span:last-child').innerHTML = "✓";
        document.getElementById('explanation-status-icon').innerText = "💡";
      }
      
      // Reveal Explanation
      document.getElementById('explanation-text').innerText = q.explanation;
      document.getElementById('explanation-container').classList.remove('hidden');
    }

    function nextQuestion() {
      if (currentQIdx < selectedLvl.questions.length - 1) {
        currentQIdx++;
        loadQuestion();
      } else {
        // Complete Quiz
        const total = selectedLvl.questions.length;
        const pct = (score / total) * 100;
        
        let stars = 0;
        if (pct >= 100) stars = 3;
        else if (pct >= 80) stars = 2;
        else if (pct >= 60) stars = 1;
        
        saveBloggerProgress(selectedCat.id, selectedLvl.levelNumber, score, stars);
        showScreen('result');
      }
    }

    function showResults() {
      const total = selectedLvl.questions.length;
      document.getElementById('result-score').innerText = score + " / " + total;
      
      const pct = (score / total) * 100;
      let stars = 0;
      if (pct >= 100) stars = 3;
      else if (pct >= 80) stars = 2;
      else if (pct >= 60) stars = 1;
      
      document.getElementById('result-stars').innerHTML = "⭐".repeat(stars) + "☆".repeat(3 - stars);
    }

    function retryLevel() {
      showScreen('quiz');
    }

    // Init
    showScreen('category');
  </script>
</body>
</html>`;
  };

  const handleCopyCode = () => {
    const code = generateBloggerCode();
    navigator.clipboard.writeText(code).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-amber-500/20 selection:text-amber-300 font-sans">
      
      {/* Decorative Warm Celestial Background Gradients */}
      <div className="absolute top-0 left-0 right-0 h-[400px] bg-gradient-to-b from-indigo-900/15 via-purple-900/5 to-transparent pointer-events-none z-0" />
      <div className="absolute top-[20%] right-[10%] h-72 w-72 rounded-full bg-amber-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] left-[10%] h-72 w-72 rounded-full bg-purple-500/5 blur-[120px] pointer-events-none" />

      {/* Main Container */}
      <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 relative z-10 flex-1 flex flex-col justify-between">
        
        {/* Top Header Navigation */}
        <header className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-white/10 pb-6 mb-8">
          <div className="text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-1.5">
              <Sparkles className="h-5 w-5 text-amber-400 animate-pulse" />
              <span className="text-xs font-bold tracking-widest text-amber-400 uppercase">வார்த்தையின் வல்லமை</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-amber-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">
              விவிலிய வினாடி வினா
            </h1>
            <p className="text-xs text-slate-450 mt-1">Bible Tamil Quiz & Blogger Exporter</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentScreen('exporter')}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                currentScreen === 'exporter'
                  ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/10'
                  : 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10'
              }`}
            >
              <Download className="h-4 w-4" /> Blogger கோட் பெறுக (Export)
            </button>
            <div className="bg-gradient-to-r from-purple-900/30 to-indigo-900/30 border border-purple-500/20 px-4 py-2 rounded-2xl flex items-center gap-2">
              <Trophy className="h-4.5 w-4.5 text-amber-400" />
              <div className="text-right">
                <span className="text-[10px] block font-bold text-slate-400 uppercase tracking-widest">உமது நட்சத்திரங்கள்</span>
                <span className="text-sm font-black text-amber-300">{getTotalStars()} ★</span>
              </div>
            </div>
          </div>
        </header>

        {/* SCREEN 1: DASHBOARD */}
        <AnimatePresence mode="wait">
          {currentScreen === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-8 flex-1"
            >
              {/* Daily Bible Verse Banner */}
              <div className="bg-gradient-to-r from-purple-950/40 via-slate-900/60 to-indigo-950/40 border border-purple-500/20 rounded-3xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                  <Scroll className="h-32 w-32 rotate-12" />
                </div>
                <div className="space-y-3 relative z-10 text-center max-w-2xl mx-auto">
                  <div className="inline-flex p-1.5 bg-purple-500/10 rounded-full border border-purple-500/25">
                    <Sparkle className="h-4 w-4 text-purple-400" />
                  </div>
                  <blockquote className="text-base sm:text-lg font-tamil font-bold text-slate-200 leading-relaxed italic">
                    &ldquo;{currentVerse.verse}&rdquo;
                  </blockquote>
                  <cite className="block text-xs font-bold text-purple-400 not-italic uppercase tracking-wider">
                    — {currentVerse.ref}
                  </cite>
                </div>
              </div>

              {/* Category Grid Description */}
              <div className="text-center space-y-2">
                <h2 className="font-tamil text-2xl font-black text-white tracking-tight">விவிலியப் பிரிவைத் தேர்ந்தெடுக்கவும்</h2>
                <p className="text-xs text-slate-400 uppercase tracking-widest">Choose a biblical category to explore</p>
              </div>

              {/* Category Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {ALL_QUIZ_CATEGORIES_EXPANDED.map((cat) => {
                  const completedInCat = completedLevels.filter(
                    p => p.categoryId === cat.id && p.stars > 0
                  ).length;

                  return (
                    <motion.div
                      key={cat.id}
                      whileHover={{ y: -4, scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => handleSelectCategory(cat)}
                      className="bg-white/5 border border-white/10 hover:border-purple-500/30 rounded-3xl p-6 flex flex-col justify-between h-56 cursor-pointer transition-all duration-300 relative group overflow-hidden"
                    >
                      {/* Glow effect on hover */}
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className={`p-3 rounded-2xl bg-gradient-to-br ${cat.color} text-white shadow-md`}>
                            {renderCategoryIcon(cat.icon)}
                          </div>
                          <span className="text-xs font-bold text-slate-500 bg-white/5 px-2.5 py-1 rounded-xl">
                            {completedInCat} / 10 முடிந்தவை (Completed)
                          </span>
                        </div>

                        <div>
                          <h3 className="font-tamil text-xl font-bold text-white group-hover:text-amber-300 transition-colors">
                            {cat.name}
                          </h3>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                            {cat.nameEnglish}
                          </p>
                          <p className="font-tamil text-xs text-slate-300 mt-2.5 leading-relaxed line-clamp-2">
                            {cat.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-white/5 text-xs font-bold text-amber-400">
                        <span className="uppercase tracking-widest text-[10px] text-slate-450">10 லெவல்கள் (Levels)</span>
                        <span className="flex items-center gap-1">விளையாடு (Play) <ArrowRight className="h-3.5 w-3.5" /></span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* SCREEN 2: LEVEL SELECTION */}
          {currentScreen === 'levels' && selectedCategory && (
            <motion.div
              key="levels"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.25 }}
              className="space-y-8 flex-1"
            >
              {/* Top Navigation */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <button
                  onClick={() => setCurrentScreen('dashboard')}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-xs font-bold rounded-2xl flex items-center gap-2 border border-white/10 transition cursor-pointer"
                >
                  ← முகப்பு (Home)
                </button>
                <div className="text-right">
                  <h2 className="font-tamil text-lg font-bold text-amber-400">{selectedCategory.name}</h2>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">{selectedCategory.nameEnglish}</p>
                </div>
              </div>

              {/* Title Instructions */}
              <div className="text-center space-y-1 max-w-md mx-auto">
                <h3 className="font-tamil text-2xl font-black text-slate-100">லெவல்கள் (Levels 1 - 10)</h3>
                <p className="text-xs text-slate-400 leading-relaxed font-tamil">
                  அடுத்த லெவலைத் திறக்க முந்தைய லெவலில் குறைந்தபட்சம் 60% (3/5 கேள்விகள்) சரியான பதில் அளிக்க வேண்டும்.
                </p>
              </div>

              {/* Levels Bento Grid Map */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 max-w-2xl mx-auto">
                {selectedCategory.levels.map((level) => {
                  const unlocked = isLevelUnlocked(selectedCategory.id, level.levelNumber);
                  const stars = getLevelStars(selectedCategory.id, level.levelNumber);

                  return (
                    <motion.button
                      key={level.levelNumber}
                      disabled={!unlocked}
                      whileHover={unlocked ? { scale: 1.05, y: -2 } : {}}
                      whileTap={unlocked ? { scale: 0.95 } : {}}
                      onClick={() => handleSelectLevel(level)}
                      className={`aspect-square flex flex-col items-center justify-center rounded-3xl transition-all duration-300 border text-center p-4 relative overflow-hidden cursor-pointer ${
                        unlocked
                          ? 'bg-gradient-to-br from-slate-900 to-indigo-950/40 border-white/10 hover:border-purple-500/35 shadow-md text-slate-100 hover:shadow-lg hover:shadow-purple-500/5'
                          : 'bg-black/40 border-white/5 text-slate-600 cursor-not-allowed opacity-50'
                      }`}
                    >
                      {/* Locking overlays */}
                      {!unlocked ? (
                        <>
                          <Lock className="h-5 w-5 text-slate-600 mb-1" />
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">பூட்டப்பட்டது</span>
                        </>
                      ) : (
                        <>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Level</span>
                          <span className="text-3xl font-black my-1 text-white">{level.levelNumber}</span>
                          
                          {/* Stars display */}
                          <div className="flex items-center gap-0.5 mt-1">
                            {[1, 2, 3].map((s) => (
                              <Star 
                                key={s} 
                                className={`h-3 w-3 ${s <= stars ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`} 
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* Back to Dashboard Accent */}
              <div className="flex justify-center pt-4">
                <div className="p-3 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-2 max-w-md text-xs text-slate-400">
                  <Unlock className="h-4 w-4 text-amber-400" />
                  <span>விளையாடி உமது விவிலிய அறிவை மென்மேலும் வளர்த்துக்கொள்ளுங்கள்!</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* SCREEN 3: QUIZ ARENA */}
          {currentScreen === 'quiz' && selectedCategory && selectedLevel && (
            <motion.div
              key="quiz"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-6 flex-1 max-w-2xl mx-auto w-full"
            >
              {/* Quiz Back Navigation */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <button
                  onClick={() => setCurrentScreen('levels')}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-xs font-bold rounded-2xl flex items-center gap-2 border border-white/10 transition cursor-pointer"
                >
                  ← லெவல் மேப் (Exit)
                </button>
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-widest bg-purple-500/20 text-purple-300 px-2.5 py-0.5 rounded-full">
                    {selectedCategory.name}
                  </span>
                  <p className="text-xs font-bold text-slate-450 mt-1">
                    லெவல் {selectedLevel.levelNumber} - {selectedLevel.title}
                  </p>
                </div>
              </div>

              {/* Game Arena Body */}
              {!quizFinished ? (
                <div className="bg-slate-900/60 border border-white/10 p-6 sm:p-8 rounded-3xl space-y-6 shadow-xl relative">
                  
                  {/* Top Progress */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                      <span>கேள்வி {currentQuestionIndex + 1} / {selectedLevel.questions.length}</span>
                      <span>சரியானவை: <b className="text-emerald-400">{score}</b></span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-amber-400 to-indigo-500 h-full transition-all duration-300" 
                        style={{ width: `${((currentQuestionIndex + 1) / selectedLevel.questions.length) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Question Title */}
                  <div className="space-y-1">
                    <h2 className="font-tamil text-xl sm:text-2xl font-semibold leading-relaxed text-slate-100">
                      {selectedLevel.questions[currentQuestionIndex].question}
                    </h2>
                  </div>

                  {/* Options List */}
                  <div className="grid grid-cols-1 gap-3 pt-2">
                    {selectedLevel.questions[currentQuestionIndex].options.map((opt, idx) => {
                      const isSelected = selectedOptionIndex === idx;
                      const isCorrectAnswer = idx === selectedLevel.questions[currentQuestionIndex].correctAnswerIndex;
                      
                      let optionStyle = "w-full text-left font-tamil text-sm sm:text-base p-4.5 rounded-2xl bg-white/5 border border-white/10 transition-all duration-200 flex items-center justify-between cursor-pointer ";
                      let ringIndicator = "w-5 h-5 rounded-full border border-white/20 flex items-center justify-center text-xs font-bold ";

                      if (isAnswerSubmitted) {
                        if (isCorrectAnswer) {
                          // Correct option (highlighted in Green)
                          optionStyle += "bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-lg shadow-emerald-500/5";
                          ringIndicator += "bg-emerald-500 border-emerald-500 text-white";
                        } else if (isSelected) {
                          // Wrong option (highlighted in Red)
                          optionStyle += "bg-rose-500/20 border-rose-500 text-rose-300 shadow-lg shadow-rose-500/5";
                          ringIndicator += "bg-rose-500 border-rose-500 text-white";
                        } else {
                          // Unselected option after submission
                          optionStyle += "opacity-50 border-white/5 text-slate-500";
                          ringIndicator += "border-white/5";
                        }
                      } else {
                        // Interactive hovering state
                        optionStyle += "hover:bg-white/10 hover:border-white/20 hover:scale-[1.01] active:scale-[0.99]";
                      }

                      return (
                        <button
                          key={idx}
                          type="button"
                          disabled={isAnswerSubmitted}
                          onClick={() => handleOptionSelect(idx)}
                          className={optionStyle}
                        >
                          <span>{opt}</span>
                          <span className={ringIndicator}>
                            {isAnswerSubmitted && isCorrectAnswer && "✓"}
                            {isAnswerSubmitted && isSelected && !isCorrectAnswer && "✕"}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Biblical Explanation & Next Action */}
                  <AnimatePresence>
                    {isAnswerSubmitted && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-4 overflow-hidden mt-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-purple-500/10 rounded-xl border border-purple-500/20 text-purple-400 mt-0.5">
                            <HelpCircle className="h-4 w-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">விவிலிய ஆதாரம் (Bible Reference)</h4>
                            <p className="font-tamil text-xs sm:text-sm text-slate-200 mt-1 leading-relaxed">
                              {selectedLevel.questions[currentQuestionIndex].explanation}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleNextQuestion}
                          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-3.5 px-6 rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/10 cursor-pointer"
                        >
                          {currentQuestionIndex < selectedLevel.questions.length - 1 
                            ? 'அடுத்த கேள்வி (Next Question) →' 
                            : 'முடிவுகளைப் பார்க்க (Finish Quiz) 🏆'
                          }
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                </div>
              ) : (
                /* QUIZ END SCORECARD */
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-slate-900/60 border border-white/10 p-8 rounded-3xl text-center space-y-6 shadow-xl max-w-md mx-auto"
                >
                  <div className="inline-flex p-4.5 bg-amber-400/10 rounded-full text-amber-400 text-5xl">
                    <Award className="h-16 w-16" />
                  </div>

                  <div className="space-y-1">
                    <h2 className="font-tamil text-2xl font-black text-white">லெவல் {selectedLevel.levelNumber} முடிந்தது!</h2>
                    <p className="text-xs text-slate-400 uppercase tracking-widest">Level Completed</p>
                  </div>

                  {/* Visual Stars Celebration */}
                  <div className="flex justify-center items-center gap-2 py-2">
                    {[1, 2, 3].map((star) => {
                      const totalQuestions = selectedLevel.questions.length;
                      const pct = (score / totalQuestions) * 100;
                      let achieved = false;
                      if (star === 1 && pct >= 60) achieved = true;
                      if (star === 2 && pct >= 80) achieved = true;
                      if (star === 3 && pct >= 100) achieved = true;

                      return (
                        <Star 
                          key={star} 
                          className={`h-8 w-8 ${achieved ? 'text-amber-400 fill-amber-400 drop-shadow-md animate-bounce' : 'text-slate-700'}`} 
                        />
                      );
                    })}
                  </div>

                  <div className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-2">
                    <div className="text-xs text-slate-400 uppercase tracking-widest font-bold">சரியான பதில்கள் (Your Score)</div>
                    <div className="text-4xl font-extrabold text-amber-300">
                      {score} / {selectedLevel.questions.length}
                    </div>
                    <p className="text-xs font-tamil text-slate-300 pt-1 leading-relaxed">
                      {score === selectedLevel.questions.length 
                        ? 'அற்புதமான பதில்! விவிலியத்தில் உமது அறிவு மிகச் சிறந்தது.' 
                        : score >= 3 
                          ? 'சிறப்பான முயற்சி! அடுத்த லெவல் வெற்றிகரமாக திறக்கப்பட்டது.' 
                          : 'பரவாயில்லை, மீண்டும் முயற்சி செய்து அடுத்த லெவலைத் திறக்கவும்!'
                      }
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2.5 pt-4">
                    {score >= 3 && selectedLevel.levelNumber < 10 && (
                      <button
                        onClick={() => {
                          const nextLvl = selectedCategory.levels.find(l => l.levelNumber === selectedLevel.levelNumber + 1);
                          if (nextLvl) {
                            setSelectedLevel(nextLvl);
                            setCurrentQuestionIndex(0);
                            setSelectedOptionIndex(null);
                            setIsAnswerSubmitted(false);
                            setScore(0);
                            setQuizFinished(false);
                            setCurrentScreen('quiz');
                          }
                        }}
                        className="w-full bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-slate-950 font-black py-3.5 px-6 rounded-xl text-sm shadow-md transition cursor-pointer"
                      >
                        அடுத்த லெவல் செல் (Next Level) →
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setCurrentQuestionIndex(0);
                        setSelectedOptionIndex(null);
                        setIsAnswerSubmitted(false);
                        setScore(0);
                        setQuizFinished(false);
                      }}
                      className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-3 px-6 rounded-xl text-sm transition border border-white/10 cursor-pointer"
                    >
                      மீண்டும் விளையாடு (Retry) ↺
                    </button>
                    <button
                      onClick={() => setCurrentScreen('levels')}
                      className="w-full bg-indigo-600 hover:bg-indigo-750 text-white font-bold py-3 px-6 rounded-xl text-sm transition cursor-pointer"
                    >
                      லெவல் வரைபடத்திற்குச் செல் (Level Map)
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* SCREEN 4: BLOGGER EXPORTER PANEL */}
          {currentScreen === 'exporter' && (
            <motion.div
              key="exporter"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.25 }}
              className="space-y-6 flex-1 max-w-3xl mx-auto w-full"
            >
              {/* Back to Home Navigation */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <button
                  onClick={() => setCurrentScreen('dashboard')}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-xs font-bold rounded-2xl flex items-center gap-2 border border-white/10 transition cursor-pointer"
                >
                  ← முகப்பு (Home)
                </button>
                <div className="text-right">
                  <h2 className="text-lg font-bold text-amber-400">Blogger Code Exporter</h2>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">Generate standalone HTML/CSS/JS</p>
                </div>
              </div>

              {/* Exporter Info */}
              <div className="bg-slate-900 border border-white/10 p-6 rounded-3xl space-y-4">
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 bg-amber-500/10 rounded-2xl text-amber-400">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">உமது பிளாக்கர் (Blogger) தளத்திற்கான விட்ஜெட்</h3>
                    <p className="text-xs font-tamil text-slate-300 leading-relaxed mt-1">
                      உங்களது பிளாக்கர் அல்லது வேர்ட்பிரஸ் வலைதளத்தில் விவிலிய வினாடி வினாவை வைக்க இந்த முழுமையான, சுயாதீனமான குறியீட்டைப் பயன்படுத்தலாம். 
                      இதில் 4 பிரிவுகளும், தலா 10 லெவல்களும் முற்றிலும் இலவசமாக இணைக்கப்பட்டுள்ளது.
                    </p>
                  </div>
                </div>

                {/* Filter Exporter selection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/5">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">ஏற்றுமதி செய்யும் பிரிவு (Select Category to Export)</label>
                    <select
                      value={exporterCategory}
                      onChange={(e) => setExporterCategory(e.target.value)}
                      className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-200 focus:outline-none focus:border-amber-400 cursor-pointer"
                    >
                      <option value="all">அனைத்துப் பிரிவுகளும் (All 4 Categories - 40 Levels)</option>
                      <option value="old-testament">பழைய ஏற்பாடு மட்டும் (Old Testament Only)</option>
                      <option value="new-testament">புதிய ஏற்பாடு மட்டும் (New Testament Only)</option>
                      <option value="parables">இயேசுவின் உவமைகள் மட்டும் (Parables Only)</option>
                      <option value="characters">விவிலிய மாந்தர்கள் மட்டும் (Characters Only)</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={handleCopyCode}
                      className="w-full bg-amber-400 hover:bg-amber-500 text-slate-950 font-black py-3 px-5 rounded-xl text-xs transition flex items-center justify-center gap-2.5 shadow-lg shadow-amber-400/5 cursor-pointer"
                    >
                      {isCopied ? (
                        <>
                          <Check className="h-4.5 w-4.5" />
                          <span>குறியீடு நகலெடுக்கப்பட்டது! (Copied)</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-4.5 w-4.5" />
                          <span>கோடு நகலெடு (Copy Code)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Source Code Box */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                  <span>HTML / CSS / JavaScript குறியீடு (Code Preview)</span>
                  <span className="text-[10px] text-slate-500">சுயாதீனமானது (Fully Standalone)</span>
                </div>
                <div className="bg-black/80 border border-white/10 rounded-2xl p-4 overflow-hidden relative group">
                  <pre className="text-[11px] font-mono text-amber-200/90 overflow-x-auto max-h-[300px] custom-scrollbar whitespace-pre-wrap leading-relaxed">
                    {generateBloggerCode()}
                  </pre>
                  <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-black/80 to-transparent pointer-events-none group-hover:from-black/95 transition-all duration-300" />
                </div>
              </div>

              {/* Step instructions */}
              <div className="bg-white/5 border border-white/5 p-5 rounded-2xl space-y-2.5">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider font-tamil">பிளாக்கரில் இதை எவ்வாறு வைப்பது? (How to install on Blogger)</h4>
                <ul className="list-decimal list-inside space-y-1.5 text-xs font-tamil text-slate-300 leading-relaxed">
                  <li>மேலே உள்ள <b className="text-amber-300">Copy Code</b> பட்டனை அழுத்தி முழு குறியீட்டை நகலெடுக்கவும்.</li>
                  <li>உங்களது பிளாக்கர் கணக்கில் நுழைந்து <b className="text-slate-100">Layout</b> அல்லது புதிய <b className="text-slate-100">Post</b> உருவாக்கவும்.</li>
                  <li>மின்னஞ்சல் அல்லது தளத்தில் வைக்கும்போது <b className="text-amber-350">HTML View</b> முறையைத் தேர்வு செய்யவும்.</li>
                  <li>நகலெடுத்த குறியீட்டை அங்கே பேஸ்ட் (Paste) செய்து சேமிக்கவும் (Save).</li>
                </ul>
              </div>

            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Styled Footer */}
      <footer className="border-t border-white/10 py-6 text-center text-xs text-slate-500 font-tamil relative z-10">
        &copy; விவிலிய வினாடி வினா - Bible Tamil Quiz Game. அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.
      </footer>

    </div>
  );
}
