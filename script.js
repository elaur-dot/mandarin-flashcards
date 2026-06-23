const BIN_ID = "6a337f28f5f4af5e2906720a";
const MASTER_KEY = "$2a$10$T1wkJETWix6zoi7KEr/iOOBwnc2Pk/PJhzQmlh1mi4Y40vEGEk9mK";
const CLOUD_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

let myVocabularyDeck = [];
let shuffledSessionDeck = [];  
let currentCardIndex = 0;

// ==========================================================================
// 📚 UI RENDER FUNCTIONS
// ==========================================================================
function updateWordBankList(searchTerm = "") {
    const wordListUl = document.getElementById('word-list');
    if (!wordListUl) return;
    
    wordListUl.innerHTML = "";
    const cleanSearch = searchTerm.toLowerCase().trim();

    myVocabularyDeck.forEach(function(wordPackage) {
        const matchesHanzi = wordPackage.hanzi ? wordPackage.hanzi.includes(cleanSearch) : false;
        const matchesPinyin = wordPackage.pinyin ? wordPackage.pinyin.toLowerCase().includes(cleanSearch) : false;
        const matchesMeaning = wordPackage.meaning ? wordPackage.meaning.toLowerCase().includes(cleanSearch) : false;

        if (cleanSearch !== "" && !matchesHanzi && !matchesPinyin && !matchesMeaning) {
            return; 
        }

        let liElement = document.createElement('li');
        liElement.innerHTML = `
            <span><strong>${wordPackage.hanzi}</strong> (${wordPackage.pinyin || ''}) - ${wordPackage.meaning || ''}</span>
        `;

       let deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = `<i class="fa-solid fa-trash-can"></i>`;
        deleteBtn.setAttribute('title', 'Delete Word');
        
        deleteBtn.addEventListener('click', function() {
            deleteWord(wordPackage.id, wordPackage.hanzi);
        });

        liElement.appendChild(deleteBtn);
        wordListUl.appendChild(liElement);
    });
}

function displayCurrentCard() {
    const hanziEl = document.getElementById('card-hanzi');
    const pinyinEl = document.getElementById('card-pinyin');
    const meaningEl = document.getElementById('card-meaning');

    if (!hanziEl || !pinyinEl || !meaningEl) return;

    if (shuffledSessionDeck.length === 0) {
        hanziEl.innerText = "---";
        pinyinEl.innerText = "Select an option";
        meaningEl.innerText = "above to start!";
        return;
    }

    let currentCard = shuffledSessionDeck[currentCardIndex];
    hanziEl.innerText = currentCard.hanzi;
    pinyinEl.innerText = currentCard.pinyin;
    meaningEl.innerText = currentCard.meaning;
}

function shuffleDeck() {
    shuffledSessionDeck = [...myVocabularyDeck];
    for (let i = shuffledSessionDeck.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        let temp = shuffledSessionDeck[i];
        shuffledSessionDeck[i] = shuffledSessionDeck[j];
        shuffledSessionDeck[j] = temp;
    }
}

// ==========================================================================
// ☁️ CLOUD SYNC ACTIONS
// ==========================================================================
function loadDeckFromCloud() {
    fetch(`${CLOUD_URL}/latest`, {
        method: 'GET',
        headers: { 'X-Master-Key': MASTER_KEY }
    })
    .then(response => response.json())
    .then(data => {
        myVocabularyDeck = data.record.words || [];
        updateWordBankList();
        
        if (shuffledSessionDeck.length === 0 && myVocabularyDeck.length > 0) {
            shuffledSessionDeck = [...myVocabularyDeck];
            displayCurrentCard();
        }
    })
    .catch(error => console.error("Error loading from cloud:", error));
}

function saveDeckToCloud() {
    if (myVocabularyDeck.length === 0) {
        console.log("Vault Lock: Refusing to save an empty deck over cloud data.");
        return; 
    }

    fetch(CLOUD_URL, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'X-Master-Key': MASTER_KEY
        },
        body: JSON.stringify({ words: myVocabularyDeck })
    })
    .then(response => response.json())
    .then(() => {
        updateWordBankList();
    })
    .catch(error => console.error("Error saving to cloud:", error));
}

function deleteWord(wordId, hanziName) {
    const confirmDelete = confirm(`Are you absolutely sure you want to delete "${hanziName}"? 😰\nThis cannot be undone!`);
    if (!confirmDelete) return;

    myVocabularyDeck = myVocabularyDeck.filter(word => word.id !== wordId);
    saveDeckToCloud();

    if (currentCardIndex >= myVocabularyDeck.length) {
        currentCardIndex = 0;
    }
}

// ==========================================================================
// 🕹️ INITIALIZATION & WIREUP
// ==========================================================================
document.addEventListener('DOMContentLoaded', function() {
    // Wire up search bar setup safely
    const searchInput = document.getElementById('word-search');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            updateWordBankList(e.target.value);
        });
    }

    // Add Word execution wires
    const addBtn = document.getElementById('add-btn');
    if (addBtn) {
        addBtn.addEventListener('click', function() {
            const hanziInput = document.getElementById('user-hanzi');
            const pinyinInput = document.getElementById('user-pinyin');
            const meaningInput = document.getElementById('user-meaning');

            if (hanziInput.value === "" || pinyinInput.value === "" || meaningInput.value === "") {
                alert("Jangan kosong ya! Fill out all fields! 📋");
                return;
            }

            const newWord = {
                id: Date.now().toString(), 
                hanzi: hanziInput.value,
                pinyin: pinyinInput.value,
                meaning: meaningInput.value
            };

            myVocabularyDeck.push(newWord);
            saveDeckToCloud();

            hanziInput.value = "";
            pinyinInput.value = "";
            meaningInput.value = "";
        });
    }

    // Panel Toggles
    const addPanel = document.getElementById('add-word-square');
    const addToggleBtn = document.getElementById('add-panel-toggle');
    const listDrawer = document.getElementById('word-list-drawer');
    const listToggleBtn = document.getElementById('list-panel-toggle');

    if (addToggleBtn && addPanel) {
        addToggleBtn.addEventListener('click', function() {
            addPanel.style.display = (addPanel.style.display === 'flex') ? 'none' : 'flex';
        });
    }
    if (listToggleBtn && listDrawer) {
        listToggleBtn.addEventListener('click', function() {
            listDrawer.style.display = (listDrawer.style.display === 'block') ? 'none' : 'block';
        });
    }

    // Flashcard Buttons
    const cardInner = document.getElementById('card-inner');
    const flipButton = document.getElementById('flip-btn');
    const nextButton = document.getElementById('next-btn');
    const welcomeMenu = document.getElementById('welcome-menu');
    const continueButton = document.getElementById('continue-btn');
    const resetButton = document.getElementById('reset-btn');

    if (flipButton && cardInner) {
        flipButton.addEventListener('click', function() {
            if (shuffledSessionDeck.length === 0) return;
            cardInner.classList.toggle('flipped');
        });
    }
    if (document.getElementById('flashcard-container') && cardInner) {
        document.getElementById('flashcard-container').addEventListener('click', function(e) {
            if (e.target.tagName === 'BUTTON') return;
            if (shuffledSessionDeck.length === 0) return;
            cardInner.classList.toggle('flipped');
        });
    }
    if (nextButton && cardInner) {
        nextButton.addEventListener('click', function() {
            if (shuffledSessionDeck.length === 0) return;
            document.getElementById('card-hanzi').innerText = "---";
            document.getElementById('card-pinyin').innerText = "---";
            document.getElementById('card-meaning').innerText = "---";
            currentCardIndex++;
            cardInner.classList.remove('flipped');
            if (currentCardIndex >= shuffledSessionDeck.length) {
                alert("🎉 HEY HEY HEY! You finished the entire deck! Incredible job! 🏐");
                currentCardIndex = 0;
                shuffleDeck();
            }
            setTimeout(displayCurrentCard, 200);
        });
    }
    if (continueButton && welcomeMenu) {
        continueButton.addEventListener('click', function() {
            if (myVocabularyDeck.length === 0) {
                alert("Your Cloud Word Bank is empty! Add some words on the right first. 📋");
                return;
            }
            welcomeMenu.style.display = 'none';
            shuffledSessionDeck = [...myVocabularyDeck];
            displayCurrentCard();
        });
    }
    if (resetButton && welcomeMenu) {
        resetButton.addEventListener('click', function() {
            if (myVocabularyDeck.length === 0) {
                alert("Your Cloud Word Bank is empty! Add some words on the right first. 📋");
                return;
            }
            welcomeMenu.style.display = 'none';
            currentCardIndex = 0;
            shuffleDeck();
            displayCurrentCard();
        });
    }

    // Kick off data stream from cloud!
    loadDeckFromCloud();
});