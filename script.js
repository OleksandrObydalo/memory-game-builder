class MemoryGameBuilder {
    constructor() {
        this.cardPairs = [];
        this.gameCards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.attempts = 0;
        this.startTime = null;
        this.timerInterval = null;
        this.isGameActive = false;
        
        this.init();
    }

    init() {
        // Add initial card pair
        this.addCardPair();
        this.addCardPair();
        this.updateStartButton();
    }

    addCardPair() {
        const pairId = Date.now() + Math.random();
        const cardPair = {
            id: pairId,
            question: '',
            answer: ''
        };
        
        this.cardPairs.push(cardPair);
        this.renderCardPair(cardPair);
        this.updateStartButton();
    }

    renderCardPair(cardPair) {
        const container = document.getElementById('cardPairs');
        const pairElement = document.createElement('div');
        pairElement.className = 'card-pair';
        pairElement.dataset.id = cardPair.id;
        
        pairElement.innerHTML = `
            <div class="card-input">
                <label>📝 Питання</label>
                <textarea placeholder="Введіть питання..." oninput="gameBuilder.updateCardPair(${cardPair.id}, 'question', this.value)">${cardPair.question}</textarea>
            </div>
            <div class="card-input">
                <label>✅ Відповідь</label>
                <textarea placeholder="Введіть відповідь..." oninput="gameBuilder.updateCardPair(${cardPair.id}, 'answer', this.value)">${cardPair.answer}</textarea>
            </div>
            <button class="remove-pair-btn" onclick="gameBuilder.removeCardPair(${cardPair.id})" title="Видалити пару">×</button>
        `;
        
        container.appendChild(pairElement);
        
        // Add entrance animation
        setTimeout(() => {
            pairElement.style.transform = 'translateY(0)';
            pairElement.style.opacity = '1';
        }, 100);
    }

    updateCardPair(pairId, field, value) {
        const pair = this.cardPairs.find(p => p.id === pairId);
        if (pair) {
            pair[field] = value;
            this.updateStartButton();
        }
    }

    removeCardPair(pairId) {
        if (this.cardPairs.length <= 1) {
            alert('Має бути принаймні одна пара карт!');
            return;
        }
        
        this.cardPairs = this.cardPairs.filter(p => p.id !== pairId);
        const pairElement = document.querySelector(`[data-id="${pairId}"]`);
        
        if (pairElement) {
            pairElement.style.transform = 'translateX(-100%)';
            pairElement.style.opacity = '0';
            setTimeout(() => {
                pairElement.remove();
            }, 300);
        }
        
        this.updateStartButton();
    }

    updateStartButton() {
        const startBtn = document.getElementById('startBtn');
        const validPairs = this.cardPairs.filter(pair => 
            pair.question.trim() && pair.answer.trim()
        );
        
        startBtn.disabled = validPairs.length < 2;
        startBtn.textContent = validPairs.length < 2 ? 
            '🎮 Потрібно мінімум 2 пари' : 
            `🎮 Почати гру (${validPairs.length} пар)`;
    }

    resetBuilder() {
        if (confirm('Ви впевнені, що хочете скинути всі картки?')) {
            this.cardPairs = [];
            document.getElementById('cardPairs').innerHTML = '';
            this.addCardPair();
            this.addCardPair();
            this.updateStartButton();
        }
    }

    importAnkiCards(input) {
        const file = input.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target.result;
                const pairs = this.parseAnkiFile(content, file.name);
                
                if (pairs.length === 0) {
                    alert('Не вдалося знайти валідні пари карток у файлі. Перевірте формат файлу.');
                    return;
                }

                // Clear existing pairs and add imported ones
                this.cardPairs = [];
                document.getElementById('cardPairs').innerHTML = '';
                
                pairs.forEach(pair => {
                    const cardPair = {
                        id: Date.now() + Math.random(),
                        question: pair.question,
                        answer: pair.answer
                    };
                    this.cardPairs.push(cardPair);
                    this.renderCardPair(cardPair);
                });

                this.updateStartButton();
                alert(`Успішно завантажено ${pairs.length} пар карток!`);
                
            } catch (error) {
                console.error('Error importing Anki cards:', error);
                alert('Помилка при завантаженні файлу. Перевірте формат файлу.');
            }
        };
        
        reader.readAsText(file, 'UTF-8');
        input.value = ''; // Reset input
    }

    parseAnkiFile(content, fileName) {
        const pairs = [];
        const lines = content.split('\n').filter(line => line.trim());
        
        if (lines.some(line => line.includes(';'))) {
            lines.forEach(line => {
                const parts = line.split(';').map(part => this.cleanText(part));
                if (parts.length >= 2 && parts[0] && parts[1]) {
                    pairs.push({
                        question: parts[0],
                        answer: parts[1]
                    });
                }
            });
        } else if (fileName.endsWith('.csv') || content.includes('\t')) {
            lines.forEach(line => {
                const columns = line.split(/\t|,(?=(?:[^"]*"[^"]*")*[^"]*$)/);
                if (columns.length >= 2) {
                    const question = this.cleanText(columns[0]);
                    const answer = this.cleanText(columns[1]);
                    if (question && answer) {
                        pairs.push({ question, answer });
                    }
                }
            });
        } else {
            let currentQuestion = '';
            let currentAnswer = '';
            let isAnswer = false;
            
            lines.forEach(line => {
                const trimmed = line.trim();
                if (trimmed === '') {
                    if (currentQuestion && currentAnswer) {
                        pairs.push({
                            question: currentQuestion,
                            answer: currentAnswer
                        });
                    }
                    currentQuestion = '';
                    currentAnswer = '';
                    isAnswer = false;
                } else if (!isAnswer) {
                    currentQuestion = trimmed;
                    isAnswer = true;
                } else {
                    currentAnswer = trimmed;
                }
            });
            
            if (currentQuestion && currentAnswer) {
                pairs.push({
                    question: currentQuestion,
                    answer: currentAnswer
                });
            }
        }
        
        return pairs;
    }

    cleanText(text) {
        if (!text) return '';
        return text.replace(/^["']|["']$/g, '').trim();
    }

    startGame() {
        const validPairs = this.cardPairs.filter(pair => 
            pair.question.trim() && pair.answer.trim()
        );
        
        if (validPairs.length < 2) {
            alert('Потрібно мінімум 2 пари карт з заповненими полями!');
            return;
        }

        this.gameCards = [];
        
        validPairs.forEach((pair, index) => {
            this.gameCards.push({
                id: `q_${index}`,
                pairId: pair.id,
                content: pair.question,
                type: 'question',
                matched: false
            });
            
            this.gameCards.push({
                id: `a_${index}`,
                pairId: pair.id,
                content: pair.answer,
                type: 'answer',
                matched: false
            });
        });

        this.shuffleArray(this.gameCards);
        
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.attempts = 0;
        this.isGameActive = true;
        
        document.getElementById('builder').style.display = 'none';
        document.getElementById('gameArea').style.display = 'block';
        document.getElementById('gameResults').style.display = 'none';
        
        this.updateGameUI();
        this.renderGameCards();
        this.startTimer();
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    renderGameCards() {
        const grid = document.getElementById('memoryGrid');
        grid.innerHTML = '';
        
        this.gameCards.forEach(card => {
            const cardElement = document.createElement('div');
            cardElement.className = 'memory-card';
            cardElement.dataset.cardId = card.id;
            
            cardElement.innerHTML = `
                <div class="card-inner">
                    <div class="card-front">?</div>
                    <div class="card-back ${card.type}">
                        ${card.content}
                    </div>
                </div>
            `;
            
            cardElement.addEventListener('click', () => this.flipCard(card.id));
            grid.appendChild(cardElement);
        });
    }

    flipCard(cardId) {
        if (!this.isGameActive) return;
        
        const card = this.gameCards.find(c => c.id === cardId);
        const cardElement = document.querySelector(`[data-card-id="${cardId}"]`);
        
        if (!card || card.matched || cardElement.classList.contains('flipped')) {
            return;
        }
        
        if (this.flippedCards.length >= 2) {
            return;
        }
        
        cardElement.classList.add('flipped');
        this.flippedCards.push(card);
        
        if (this.flippedCards.length === 2) {
            this.attempts++;
            this.updateGameUI();
            
            setTimeout(() => {
                this.checkMatch();
            }, 1000);
        }
    }

    checkMatch() {
        const [card1, card2] = this.flippedCards;
        
        if (card1.pairId === card2.pairId) {
            card1.matched = true;
            card2.matched = true;
            
            const card1Element = document.querySelector(`[data-card-id="${card1.id}"]`);
            const card2Element = document.querySelector(`[data-card-id="${card2.id}"]`);
            
            card1Element.classList.add('matched');
            card2Element.classList.add('matched');
            
            this.matchedPairs++;
            
            if (this.matchedPairs === this.cardPairs.filter(p => p.question.trim() && p.answer.trim()).length) {
                this.endGame();
            }
        } else {
            const card1Element = document.querySelector(`[data-card-id="${card1.id}"]`);
            const card2Element = document.querySelector(`[data-card-id="${card2.id}"]`);
            
            card1Element.classList.remove('flipped');
            card2Element.classList.remove('flipped');
        }
        
        this.flippedCards = [];
        this.updateGameUI();
    }

    updateGameUI() {
        const totalPairs = this.cardPairs.filter(p => p.question.trim() && p.answer.trim()).length;
        document.getElementById('score').textContent = this.matchedPairs;
        document.getElementById('totalPairs').textContent = totalPairs;
        document.getElementById('attempts').textContent = this.attempts;
    }

    startTimer() {
        this.startTime = Date.now();
        this.timerInterval = setInterval(() => {
            const elapsed = Date.now() - this.startTime;
            const minutes = Math.floor(elapsed / 60000);
            const seconds = Math.floor((elapsed % 60000) / 1000);
            document.getElementById('timer').textContent = 
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }

    endGame() {
        this.isGameActive = false;
        clearInterval(this.timerInterval);
        
        const totalTime = Date.now() - this.startTime;
        const minutes = Math.floor(totalTime / 60000);
        const seconds = Math.floor((totalTime % 60000) / 1000);
        const totalCards = this.gameCards.length;
        const accuracy = Math.round((this.matchedPairs / this.attempts) * 100);
        
        document.getElementById('finalTime').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        document.getElementById('finalAttempts').textContent = this.attempts;
        document.getElementById('accuracy').textContent = accuracy;
        
        setTimeout(() => {
            document.getElementById('gameResults').style.display = 'block';
        }, 1000);
    }

    restartGame() {
        this.startGame();
    }

    backToBuilder() {
        this.isGameActive = false;
        clearInterval(this.timerInterval);
        
        document.getElementById('builder').style.display = 'block';
        document.getElementById('gameArea').style.display = 'none';
    }
}

let gameBuilder;

function addCardPair() {
    gameBuilder.addCardPair();
}

function startGame() {
    gameBuilder.startGame();
}

function resetBuilder() {
    gameBuilder.resetBuilder();
}

function backToBuilder() {
    gameBuilder.backToBuilder();
}

function restartGame() {
    gameBuilder.restartGame();
}

document.addEventListener('DOMContentLoaded', () => {
    gameBuilder = new MemoryGameBuilder();
});