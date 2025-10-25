class FlappyBeeGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        // Игровые состояния
        this.gameState = 'start'; // start, playing, gameOver
        this.score = 0;
        this.bestScore = localStorage.getItem('beeColbFinanceBestScore') || 0;
        
        // Пчела
        this.bee = {
            x: 150,
            y: this.height / 2,
            width: 60,
            height: 50,
            velocity: 0,
            gravity: 0.3,
            jumpPower: -10,
            angle: 0
        };
        
        // Изображение пчелы
        this.beeImage = new Image();
        this.beeImageLoaded = false;
        
        // Препятствия (трубы)
        this.pipes = [];
        this.pipeWidth = 100;
        this.pipeGap = 250;
        this.pipeSpeed = 1.5;
        this.pipeSpawnRate = 150; // кадры между спавном труб
        this.frameCount = 0;
        
        // Анимация
        this.wingFlap = 0;
        this.wingFlapSpeed = 0.3;
        
        // Звуки (простая реализация)
        this.sounds = {
            flap: this.createTone(400, 0.1),
            score: this.createTone(600, 0.2),
            gameOver: this.createTone(200, 0.5)
        };
        
        // Лидерборд API
        this.leaderboardAPI = new LeaderboardAPI();
        
        // Никнейм игрока
        this.playerNickname = localStorage.getItem('beeColbFinanceNickname') || '';
        
        this.init();
    }
    
    init() {
        this.loadBeeImage();
        this.setupEventListeners();
        this.updateBestScoreDisplay();
        
        // Показать приветственное окно, если никнейм не установлен
        if (!this.playerNickname) {
            this.showWelcomeModal();
        } else {
            // Если никнейм уже есть, игра готова к запуску
            this.gameState = 'start';
        }
        
        this.gameLoop();
    }
    
    loadBeeImage() {
        this.beeImage.onload = () => {
            this.beeImageLoaded = true;
            console.log('Bee image loaded successfully');
        };
        
        this.beeImage.onerror = () => {
            console.log('Error loading bee image, using fallback bee');
            this.beeImageLoaded = false;
        };
        
        this.beeImage.src = 'pchela.png';
    }
    
    setupEventListeners() {
        // Кнопки
        document.getElementById('restartBtn').addEventListener('click', () => this.restartGame());
        document.getElementById('leaderboardBtn').addEventListener('click', () => this.showLeaderboard());
        
        // Модальные окна
        document.getElementById('startWithNickname').addEventListener('click', () => this.setNicknameAndStart());
        
        // Закрытие модальных окон
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                e.target.closest('.modal').style.display = 'none';
            });
        });
        
        // Закрытие по клику вне модального окна
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });
        
        // Enter для установки никнейма
        document.getElementById('playerNickname').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.setNicknameAndStart();
            }
        });
        
        // Клавиатура и мышь
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                if (this.gameState === 'start') {
                    this.startGame();
                } else if (this.gameState === 'playing') {
                    this.flap();
                }
            }
        });
        
        this.canvas.addEventListener('click', () => {
            if (this.gameState === 'start') {
                this.startGame();
            } else if (this.gameState === 'playing') {
                this.flap();
            }
        });
    }
    
    createTone(frequency, duration) {
        return () => {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = frequency;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration);
        };
    }
    
    startGame() {
        this.gameState = 'playing';
        document.getElementById('restartBtn').style.display = 'inline-block';
        document.getElementById('gameOver').style.display = 'none';
        this.resetGame();
    }
    
    restartGame() {
        this.gameState = 'playing';
        document.getElementById('gameOver').style.display = 'none';
        this.resetGame();
    }
    
    resetGame() {
        this.bee.y = this.height / 2;
        this.bee.velocity = 0;
        this.bee.angle = 0;
        this.score = 0;
        this.pipes = [];
        this.frameCount = 0;
        this.updateScoreDisplay();
    }
    
    flap() {
        if (this.gameState === 'playing') {
            this.bee.velocity = this.bee.jumpPower;
            this.bee.angle = -0.3;
            this.sounds.flap();
        }
    }
    
    update() {
        if (this.gameState !== 'playing') return;
        
        // Обновление пчелы
        this.bee.velocity += this.bee.gravity;
        this.bee.y += this.bee.velocity;
        
        // Поворот пчелы в зависимости от скорости
        this.bee.angle = Math.min(Math.max(this.bee.velocity * 0.05, -0.5), 0.5);
        
        // Анимация крыльев
        this.wingFlap += this.wingFlapSpeed;
        
        // Создание препятствий
        this.frameCount++;
        if (this.frameCount % this.pipeSpawnRate === 0) {
            this.spawnPipe();
        }
        
        // Обновление препятствий
        this.pipes.forEach((pipe, index) => {
            pipe.x -= this.pipeSpeed;
            
            // Проверка очков
            if (!pipe.scored && pipe.x + this.pipeWidth < this.bee.x) {
                pipe.scored = true;
                this.score++;
                this.updateScoreDisplay();
                this.sounds.score();
                this.addPulseEffect();
            }
        });
        
        // Удаление препятствий за экраном
        this.pipes = this.pipes.filter(pipe => pipe.x + this.pipeWidth > 0);
        
        // Проверка коллизий
        this.checkCollisions();
    }
    
    spawnPipe() {
        const minHeight = 50;
        const maxHeight = this.height - this.pipeGap - 50;
        const topHeight = Math.random() * (maxHeight - minHeight) + minHeight;
        
        this.pipes.push({
            x: this.width,
            topHeight: topHeight,
            bottomY: topHeight + this.pipeGap,
            scored: false
        });
    }
    
    checkCollisions() {
        // Проверка границ экрана
        if (this.bee.y < 0 || this.bee.y + this.bee.height > this.height) {
            this.gameOver();
            return;
        }
        
        // Проверка столкновений с трубами
        this.pipes.forEach(pipe => {
            if (this.bee.x < pipe.x + this.pipeWidth &&
                this.bee.x + this.bee.width > pipe.x) {
                
                if (this.bee.y < pipe.topHeight ||
                    this.bee.y + this.bee.height > pipe.bottomY) {
                    this.gameOver();
                }
            }
        });
    }
    
    async gameOver() {
        this.gameState = 'gameOver';
        this.sounds.gameOver();
        
        // Обновление лучшего результата
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('beeColbFinanceBestScore', this.bestScore);
            this.updateBestScoreDisplay();
        }
        
        // Автоматическое сохранение результата в лидерборд
        if (this.playerNickname) {
            try {
                await this.leaderboardAPI.saveScore(this.playerNickname, this.score);
            } catch (error) {
                console.log('Could not save score to leaderboard:', error);
            }
        }
        
        // Показ экрана окончания игры
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('bestScore').textContent = this.bestScore;
        document.getElementById('gameOver').style.display = 'block';
        document.getElementById('restartBtn').style.display = 'inline-block';
    }
    
    updateScoreDisplay() {
        document.getElementById('score').textContent = this.score;
    }
    
    updateBestScoreDisplay() {
        document.getElementById('bestScore').textContent = this.bestScore;
    }
    
    addPulseEffect() {
        document.querySelector('.score').classList.add('pulse');
        setTimeout(() => {
            document.querySelector('.score').classList.remove('pulse');
        }, 300);
    }
    
    draw() {
        // Очистка canvas
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Фон
        this.drawBackground();
        
        // Препятствия
        this.drawPipes();
        
        // Пчела
        this.drawBee();
        
        // Облака
        this.drawClouds();
        
        // Подсказка для запуска игры
        if (this.gameState === 'start') {
            this.drawStartHint();
        }
    }
    
    drawBackground() {
        // Градиентный фон
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#98FB98');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }
    
    drawClouds() {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.beginPath();
        this.ctx.arc(100, 80, 20, 0, Math.PI * 2);
        this.ctx.arc(120, 80, 25, 0, Math.PI * 2);
        this.ctx.arc(140, 80, 20, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.beginPath();
        this.ctx.arc(300, 120, 15, 0, Math.PI * 2);
        this.ctx.arc(315, 120, 20, 0, Math.PI * 2);
        this.ctx.arc(330, 120, 15, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawStartHint() {
        // Полупрозрачный фон для текста
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, this.height / 2 - 40, this.width, 80);
        
        // Текст подсказки
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Press SPACE or Click to Start!', this.width / 2, this.height / 2 - 5);
        
        this.ctx.font = '18px Arial';
        this.ctx.fillText('Make the bee flap its wings', this.width / 2, this.height / 2 + 25);
    }
    
    drawPipes() {
        this.ctx.fillStyle = '#228B22';
        this.ctx.strokeStyle = '#006400';
        this.ctx.lineWidth = 3;
        
        this.pipes.forEach(pipe => {
            // Верхняя труба
            this.ctx.fillRect(pipe.x, 0, this.pipeWidth, pipe.topHeight);
            this.ctx.strokeRect(pipe.x, 0, this.pipeWidth, pipe.topHeight);
            
            // Нижняя труба
            this.ctx.fillRect(pipe.x, pipe.bottomY, this.pipeWidth, this.height - pipe.bottomY);
            this.ctx.strokeRect(pipe.x, pipe.bottomY, this.pipeWidth, this.height - pipe.bottomY);
            
            // Кайма труб
            this.ctx.fillStyle = '#32CD32';
            this.ctx.fillRect(pipe.x - 5, pipe.topHeight - 20, this.pipeWidth + 10, 20);
            this.ctx.fillRect(pipe.x - 5, pipe.bottomY, this.pipeWidth + 10, 20);
            this.ctx.fillStyle = '#228B22';
        });
    }
    
    drawBee() {
        this.ctx.save();
        this.ctx.translate(this.bee.x + this.bee.width / 2, this.bee.y + this.bee.height / 2);
        this.ctx.rotate(this.bee.angle);
        
        if (this.beeImageLoaded) {
            // Рисуем изображение пчелы
            this.ctx.drawImage(
                this.beeImage,
                -this.bee.width / 2,
                -this.bee.height / 2,
                this.bee.width,
                this.bee.height
            );
        } else {
            // Fallback: рисуем пчелу программно, если изображение не загрузилось
            this.drawBeeFallback();
        }
        
        this.ctx.restore();
    }
    
    drawBeeFallback() {
        // Тело пчелы
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillRect(-this.bee.width / 2, -this.bee.height / 2, this.bee.width, this.bee.height);
        
        // Полоски на теле
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(-this.bee.width / 2, -this.bee.height / 2 + 3, this.bee.width, 3);
        this.ctx.fillRect(-this.bee.width / 2, -this.bee.height / 2 + 9, this.bee.width, 3);
        this.ctx.fillRect(-this.bee.width / 2, -this.bee.height / 2 + 15, this.bee.width, 3);
        
        // Крылья
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        const wingOffset = Math.sin(this.wingFlap) * 3;
        
        // Левое крыло
        this.ctx.beginPath();
        this.ctx.ellipse(-8, -5 + wingOffset, 8, 12, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Правое крыло
        this.ctx.beginPath();
        this.ctx.ellipse(8, -5 - wingOffset, 8, 12, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Глаза
        this.ctx.fillStyle = '#000000';
        this.ctx.beginPath();
        this.ctx.arc(-5, -8, 2, 0, Math.PI * 2);
        this.ctx.arc(5, -8, 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Усики
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(-3, -12);
        this.ctx.lineTo(-5, -16);
        this.ctx.moveTo(3, -12);
        this.ctx.lineTo(5, -16);
        this.ctx.stroke();
        
        // Кончики усиков
        this.ctx.fillStyle = '#000000';
        this.ctx.beginPath();
        this.ctx.arc(-5, -16, 1, 0, Math.PI * 2);
        this.ctx.arc(5, -16, 1, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
    
    // Методы для работы с лидербордом
    async showLeaderboard() {
        const modal = document.getElementById('leaderboardModal');
        const list = document.getElementById('leaderboardList');
        
        modal.style.display = 'flex';
        list.innerHTML = '<div class="loading">Loading...</div>';
        
        try {
            // Очищаем дубликаты перед показом
            await this.leaderboardAPI.cleanDuplicates();
            const leaderboard = await this.leaderboardAPI.getTopPlayers(10);
            this.displayLeaderboard(leaderboard);
        } catch (error) {
            list.innerHTML = '<div class="loading">Error loading leaderboard</div>';
        }
    }
    
    displayLeaderboard(leaderboard) {
        const list = document.getElementById('leaderboardList');
        
        if (leaderboard.length === 0) {
            list.innerHTML = '<div class="loading">No scores yet. Be the first!</div>';
            return;
        }
        
        list.innerHTML = leaderboard.map((entry, index) => {
            const date = new Date(entry.date).toLocaleDateString();
            return `
                <div class="leaderboard-entry">
                    <div class="leaderboard-rank">#${index + 1}</div>
                    <div class="leaderboard-name">${entry.name}</div>
                    <div class="leaderboard-score">${entry.score}</div>
                    <div class="leaderboard-date">${date}</div>
                </div>
            `;
        }).join('');
    }
    
    showWelcomeModal() {
        const modal = document.getElementById('welcomeModal');
        const input = document.getElementById('playerNickname');
        
        modal.style.display = 'flex';
        input.value = '';
        input.focus();
    }
    
    setNicknameAndStart() {
        const nickname = document.getElementById('playerNickname').value.trim();
        if (!nickname) {
            alert('Please enter your nickname!');
            return;
        }
        
        // Сохранение никнейма
        this.playerNickname = nickname;
        localStorage.setItem('beeColbFinanceNickname', nickname);
        
        // Закрытие модального окна
        document.getElementById('welcomeModal').style.display = 'none';
        
        // Игра готова к запуску (состояние 'start')
        this.gameState = 'start';
    }
}

// Запуск игры
document.addEventListener('DOMContentLoaded', () => {
    new FlappyBeeGame();
});
