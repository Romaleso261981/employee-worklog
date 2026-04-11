export type Locale = "uk" | "en";

export const translations = {
  uk: {
    common: {
      loadingApp: "Завантаження додатку...",
      loadingProfile: "Завантаження профілю...",
      logout: "Вийти",
      search: "Пошук",
      allCategories: "Усі категорії",
      page: "Сторінка",
      language: "Мова",
      close: "Закрити",
      prev: "Назад",
      next: "Далі",
    },
    auth: {
      login: "Вхід",
      register: "Реєстрація",
      email: "Email",
      password: "Пароль",
      showPassword: "Показати пароль",
      hidePassword: "Приховати пароль",
      submitLogin: "Увійти",
      submitRegister: "Створити акаунт",
      noAccount: "Ще немає акаунта?",
      hasAccount: "Вже маєте акаунт?",
      failed: "Не вдалося виконати авторизацію. Перевірте дані.",
    },
    dashboard: {
      title: "Особистий кабінет",
      works: "Список робіт",
      noWorks: "Роботи ще не додані.",
      addWork: "Додати роботу",
      workAdded: "Роботу успішно додано",
      categoryLabel: "Категорія",
      amountLabel: "Сума",
      dateLabel: "Дата",
      descriptionLabel: "Опис",
      salarySummaryTitle: "Фінанси",
      totalEarned: "Загальна сума заробітку",
      totalPaid: "Загальна сума виплат",
      balance: "Залишок",
      payoutHistoryTitle: "Історія виплат",
      noPayouts: "Виплат ще немає.",
      allWorkers: "Усі працівники",
      sortDate: "Сортувати: дата",
      sortDescription: "Сортувати: опис",
      sortCategory: "Сортувати: категорія",
      sortAmount: "Сортувати: сума",
      sortDirectionAsc: "Напрямок: зростання",
      sortDirectionDesc: "Напрямок: спадання",
      filteredTotalLabel: "Разом (за фільтром)",
      dateFilterMode: "Фільтр дат",
      dateFilterAll: "Усі дати",
      dateFilterByYear: "За рік",
      dateFilterByMonth: "За місяць",
      dateFilterByRange: "Період",
      dateFilterYear: "Рік",
      dateFilterMonth: "Місяць",
      dateFilterFrom: "Від",
      dateFilterTo: "До",
    },
    workForm: {
      title: "Додати роботу",
      date: "Дата",
      description: "Опис роботи",
      category: "Категорія",
      amountOptional: "Сума (опційно)",
      selectCategory: "Оберіть категорію",
      saveWork: "Зберегти роботу",
      categoryMissing: "Категорію не знайдено",
      failed: "Не вдалося додати роботу",
    },
  },
  en: {
    common: {
      loadingApp: "Loading app...",
      loadingProfile: "Loading profile...",
      logout: "Logout",
      search: "Search",
      allCategories: "All categories",
      page: "Page",
      language: "Language",
      close: "Close",
      prev: "Prev",
      next: "Next",
    },
    auth: {
      login: "Login",
      register: "Register",
      email: "Email",
      password: "Password",
      showPassword: "Show password",
      hidePassword: "Hide password",
      submitLogin: "Sign in",
      submitRegister: "Create account",
      noAccount: "No account yet?",
      hasAccount: "Already have an account?",
      failed: "Authorization failed. Please check your credentials.",
    },
    dashboard: {
      title: "Personal dashboard",
      works: "Work list",
      noWorks: "No work entries yet.",
      addWork: "Add work",
      workAdded: "Work entry has been created",
      categoryLabel: "Category",
      amountLabel: "Amount",
      dateLabel: "Date",
      descriptionLabel: "Description",
      salarySummaryTitle: "Finance",
      totalEarned: "Total earned",
      totalPaid: "Total paid",
      balance: "Balance",
      payoutHistoryTitle: "Payout history",
      noPayouts: "No payouts yet.",
      allWorkers: "All workers",
      sortDate: "Sort: date",
      sortDescription: "Sort: description",
      sortCategory: "Sort: category",
      sortAmount: "Sort: amount",
      sortDirectionAsc: "Direction: ascending",
      sortDirectionDesc: "Direction: descending",
      filteredTotalLabel: "Total (filtered)",
      dateFilterMode: "Date filter",
      dateFilterAll: "All dates",
      dateFilterByYear: "By year",
      dateFilterByMonth: "By month",
      dateFilterByRange: "Date range",
      dateFilterYear: "Year",
      dateFilterMonth: "Month",
      dateFilterFrom: "From",
      dateFilterTo: "To",
    },
    workForm: {
      title: "Add work",
      date: "Date",
      description: "Work description",
      category: "Category",
      amountOptional: "Amount (optional)",
      selectCategory: "Select category",
      saveWork: "Save work",
      categoryMissing: "Category not found",
      failed: "Failed to create work entry",
    },
  },
} as const;

export type TranslationPath =
  | "common.loadingApp"
  | "common.loadingProfile"
  | "common.logout"
  | "common.search"
  | "common.allCategories"
  | "common.page"
  | "common.language"
  | "common.close"
  | "common.prev"
  | "common.next"
  | "auth.login"
  | "auth.register"
  | "auth.email"
  | "auth.password"
  | "auth.showPassword"
  | "auth.hidePassword"
  | "auth.submitLogin"
  | "auth.submitRegister"
  | "auth.noAccount"
  | "auth.hasAccount"
  | "auth.failed"
  | "dashboard.title"
  | "dashboard.works"
  | "dashboard.noWorks"
  | "dashboard.addWork"
  | "dashboard.workAdded"
  | "dashboard.categoryLabel"
  | "dashboard.amountLabel"
  | "dashboard.dateLabel"
  | "dashboard.descriptionLabel"
  | "dashboard.salarySummaryTitle"
  | "dashboard.totalEarned"
  | "dashboard.totalPaid"
  | "dashboard.balance"
  | "dashboard.payoutHistoryTitle"
  | "dashboard.noPayouts"
  | "dashboard.allWorkers"
  | "dashboard.sortDate"
  | "dashboard.sortDescription"
  | "dashboard.sortCategory"
  | "dashboard.sortAmount"
  | "dashboard.sortDirectionAsc"
  | "dashboard.sortDirectionDesc"
  | "dashboard.filteredTotalLabel"
  | "dashboard.dateFilterMode"
  | "dashboard.dateFilterAll"
  | "dashboard.dateFilterByYear"
  | "dashboard.dateFilterByMonth"
  | "dashboard.dateFilterByRange"
  | "dashboard.dateFilterYear"
  | "dashboard.dateFilterMonth"
  | "dashboard.dateFilterFrom"
  | "dashboard.dateFilterTo"
  | "workForm.title"
  | "workForm.date"
  | "workForm.description"
  | "workForm.category"
  | "workForm.amountOptional"
  | "workForm.selectCategory"
  | "workForm.saveWork"
  | "workForm.categoryMissing"
  | "workForm.failed";
