// Simple Leaderboard API using localStorage as fallback
class LeaderboardAPI {
    constructor() {
        this.apiUrl = 'https://your-api-endpoint.com/api'; // Замените на ваш API
        this.localStorageKey = 'beeColbFinanceLeaderboard';
        this.maxEntries = 10;
    }

    // Получить лидерборд
    async getLeaderboard() {
        try {
            // Попытка получить с сервера
            const response = await fetch(`${this.apiUrl}/leaderboard`);
            if (response.ok) {
                const data = await response.json();
                return data.leaderboard || [];
            }
        } catch (error) {
            console.log('Server unavailable, using local storage');
        }

        // Fallback на localStorage
        const localData = localStorage.getItem(this.localStorageKey);
        return localData ? JSON.parse(localData) : [];
    }

    // Сохранить результат
    async saveScore(playerName, score) {
        const newEntry = {
            name: playerName,
            score: score,
            date: new Date().toISOString(),
            id: Date.now() + Math.random()
        };

        try {
            // Попытка сохранить на сервер
            const response = await fetch(`${this.apiUrl}/score`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newEntry)
            });

            if (response.ok) {
                console.log('Score saved to server');
                return true;
            }
        } catch (error) {
            console.log('Server unavailable, saving locally');
        }

        // Fallback на localStorage
        const leaderboard = await this.getLeaderboard();
        
        // Поиск существующей записи с тем же именем
        const existingIndex = leaderboard.findIndex(entry => 
            entry.name.toLowerCase() === playerName.toLowerCase()
        );
        
        if (existingIndex !== -1) {
            // Обновляем существующую запись, если новый результат лучше
            if (score > leaderboard[existingIndex].score) {
                leaderboard[existingIndex] = newEntry;
                console.log(`Updated score for ${playerName}: ${score}`);
            } else {
                console.log(`Score for ${playerName} not improved, keeping existing: ${leaderboard[existingIndex].score}`);
                return true; // Не обновляем, но считаем успешным
            }
        } else {
            // Добавляем новую запись
            leaderboard.push(newEntry);
            console.log(`Added new score for ${playerName}: ${score}`);
        }
        
        // Сортировка по очкам (убывание)
        leaderboard.sort((a, b) => b.score - a.score);
        
        // Оставляем только топ-10
        const topScores = leaderboard.slice(0, this.maxEntries);
        
        localStorage.setItem(this.localStorageKey, JSON.stringify(topScores));
        return true;
    }

    // Получить топ игроков
    async getTopPlayers(limit = 10) {
        const leaderboard = await this.getLeaderboard();
        return leaderboard.slice(0, limit);
    }

    // Проверить, является ли результат рекордом
    async isHighScore(score) {
        const leaderboard = await this.getLeaderboard();
        if (leaderboard.length < this.maxEntries) {
            return true;
        }
        return score > leaderboard[leaderboard.length - 1].score;
    }

    // Очистить дубликаты (удалить старые записи с тем же именем)
    async cleanDuplicates() {
        const leaderboard = await this.getLeaderboard();
        const uniqueLeaderboard = [];
        const seenNames = new Set();

        // Проходим по лидерборду и оставляем только лучший результат для каждого имени
        for (const entry of leaderboard) {
            const nameLower = entry.name.toLowerCase();
            if (!seenNames.has(nameLower)) {
                seenNames.add(nameLower);
                uniqueLeaderboard.push(entry);
            } else {
                // Находим существующую запись и сравниваем результаты
                const existingIndex = uniqueLeaderboard.findIndex(e => 
                    e.name.toLowerCase() === nameLower
                );
                if (existingIndex !== -1 && entry.score > uniqueLeaderboard[existingIndex].score) {
                    uniqueLeaderboard[existingIndex] = entry;
                }
            }
        }

        // Сортируем по очкам
        uniqueLeaderboard.sort((a, b) => b.score - a.score);

        // Сохраняем очищенный лидерборд
        const topScores = uniqueLeaderboard.slice(0, this.maxEntries);
        localStorage.setItem(this.localStorageKey, JSON.stringify(topScores));
        
        return topScores;
    }
}

// Экспорт для использования в игре
window.LeaderboardAPI = LeaderboardAPI;
