# TaskTrackPro (Next.js + FSD + Firebase)

Система обліку робіт для співробітників з ролями `employee` та `admin`.

## Можливості

- Реєстрація та логін через Firebase Auth
- Особистий кабінет співробітника
- Додавання робіт: дата, опис, категорія, необов'язкова сума
- За замовчуванням сума = `0`
- Адмін:
  - додає категорії
  - редагує суму для будь-якої роботи
- Адаптивний інтерфейс (mobile-first)
- i18n перемикач `UA/EN`
- UI-kit компоненти: `Modal`, `Table`, `Toast`
- Пошук, фільтрація та пагінація робіт
- FSD-структура для подальшого масштабування

## FSD-структура

- `src/app` - маршрути, глобальні стилі, провайдери
- `src/widgets` - сторінкові композиції
- `src/features` - бізнес-сценарії (auth, додавання робіт, admin-tools)
- `src/entities` - сутності та доступ до даних
- `src/shared` - перевикористовувані UI-компоненти, firebase, auth context, валідація

## Запуск локально

1. Встановіть залежності:

```bash
npm install
```

2. Створіть `.env.local` на базі `.env.example` і заповніть Firebase змінні.

3. Запустіть dev сервер:

```bash
npm run dev
```

## Firebase налаштування

1. Увімкніть **Email/Password** у Firebase Authentication.
2. Створіть Firestore (Production mode).
3. Додайте правила з `firestore.rules`.
4. Першому адміну змініть роль у `users/{uid}` на `admin` вручну через Firebase Console.

## Деплой

Проєкт готовий до хостингу на будь-якій хмарі:

- Vercel
- Firebase Hosting
- Netlify
- Render

Потрібно лише передати ENV-змінні з `.env.example` у конфіг сервісу.

## E2E тести

- Playwright конфіг: `playwright.config.ts`
- Тести: `tests/e2e`

Запуск:

```bash
npm run test:e2e
```

## CI/CD

Додані GitHub Actions:

- `ci.yml` - lint + build на `push/pull_request`
- `deploy-vercel.yml` - автодеплой на Vercel при пуші в `main`

Для деплою заповніть секрети репозиторію:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
