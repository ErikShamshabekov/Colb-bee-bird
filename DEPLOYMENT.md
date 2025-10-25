# Bee COLB Finance - Deployment Guide

## 🚀 Как разместить игру в интернете

### Вариант 1: Бесплатный хостинг (рекомендуется)

#### 1. GitHub Pages (бесплатно)
1. Создайте аккаунт на [GitHub.com](https://github.com)
2. Создайте новый репозиторий: `bee-colb-finance`
3. Загрузите все файлы игры в репозиторий
4. Перейдите в Settings → Pages
5. Выберите Source: Deploy from a branch
6. Выберите Branch: main
7. Ваша игра будет доступна по адресу: `https://ваш-username.github.io/bee-colb-finance`

#### 2. Netlify (бесплатно)
1. Зайдите на [netlify.com](https://netlify.com)
2. Зарегистрируйтесь или войдите
3. Перетащите папку с игрой в область "Deploy manually"
4. Или подключите GitHub репозиторий
5. Получите ссылку типа: `https://random-name.netlify.app`

#### 3. Vercel (бесплатно)
1. Зайдите на [vercel.com](https://vercel.com)
2. Подключите GitHub аккаунт
3. Импортируйте репозиторий с игрой
4. Нажмите Deploy
5. Получите ссылку типа: `https://bee-colb-finance.vercel.app`

### Вариант 2: Собственный сервер

#### Требования:
- Веб-сервер (Apache, Nginx, или любой другой)
- PHP 7.4+ (для API лидерборда)
- MySQL/PostgreSQL (опционально)

#### Файлы для загрузки:
```
bee-colb-finance/
├── index.html
├── style.css
├── script.js
├── leaderboard-api.js
├── pchela.png
├── api/
│   ├── index.php
│   └── config.php
└── README.md
```

### Вариант 3: Создание API для лидерборда

#### Простой PHP API (api/index.php):
```php
<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$data = json_decode(file_get_contents('php://input'), true);
$file = 'leaderboard.json';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Получить лидерборд
    if (file_exists($file)) {
        echo file_get_contents($file);
    } else {
        echo json_encode(['leaderboard' => []]);
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Сохранить результат
    $leaderboard = [];
    if (file_exists($file)) {
        $leaderboard = json_decode(file_get_contents($file), true);
    }
    
    $leaderboard[] = $data;
    usort($leaderboard, function($a, $b) {
        return $b['score'] - $a['score'];
    });
    
    $leaderboard = array_slice($leaderboard, 0, 10);
    
    file_put_contents($file, json_encode($leaderboard));
    echo json_encode(['success' => true]);
}
?>
```

#### Обновление API URL в leaderboard-api.js:
```javascript
// Замените эту строку:
this.apiUrl = 'https://your-api-endpoint.com/api';

// На ваш реальный URL:
this.apiUrl = 'https://your-domain.com/api';
```

## 📁 Структура файлов для загрузки

### Обязательные файлы:
- `index.html` - главная страница игры
- `style.css` - стили игры
- `script.js` - логика игры
- `leaderboard-api.js` - API для лидерборда
- `pchela.png` - изображение пчелы

### Дополнительные файлы:
- `README.md` - описание игры
- `DEPLOYMENT.md` - эта инструкция
- `api/` - папка с PHP API (если используете)

## 🔧 Настройка лидерборда

### Локальная версия (только localStorage):
- Работает сразу без настройки
- Результаты сохраняются только в браузере

### Онлайн версия (с API):
1. Создайте API endpoint
2. Обновите URL в `leaderboard-api.js`
3. Загрузите файлы на сервер
4. Результаты будут синхронизироваться между всеми игроками

## 🌐 Домены и SSL

### Бесплатные домены:
- GitHub Pages: `username.github.io`
- Netlify: `random-name.netlify.app`
- Vercel: `project-name.vercel.app`

### Собственный домен:
1. Купите домен (например, на Namecheap, GoDaddy)
2. Настройте DNS записи
3. Подключите к хостингу
4. Установите SSL сертификат

## 📱 Мобильная версия

Игра автоматически адаптируется под мобильные устройства:
- Responsive дизайн
- Touch управление
- Оптимизированные размеры

## 🔒 Безопасность

### Рекомендации:
- Валидация данных на сервере
- Ограничение частоты запросов
- Санитизация пользовательского ввода
- HTTPS для всех соединений

## 📊 Аналитика

### Google Analytics:
```html
<!-- Добавьте в <head> index.html -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

## 🚀 Быстрый старт

1. **Выберите хостинг** (рекомендуется GitHub Pages)
2. **Загрузите файлы** игры
3. **Обновите API URL** в `leaderboard-api.js`
4. **Протестируйте** игру
5. **Поделитесь ссылкой** с друзьями!

## 📞 Поддержка

При возникновении проблем:
1. Проверьте консоль браузера (F12)
2. Убедитесь, что все файлы загружены
3. Проверьте настройки CORS для API
4. Убедитесь, что изображение `pchela.png` доступно

---

**Удачи с размещением игры! 🐝🎮**
