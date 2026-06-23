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
      categoryFilterHint: "Можна обрати кілька — показуються роботи з усіх обраних категорій.",
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
      financeMonthBannerTitle: "Фінанси за місяць",
      financeMonthPicker: "Обрати місяць",
      monthlyEarnedLabel: "Нараховано (роботи)",
      monthlyPaidLabel: "Виплачено",
      monthlyBalanceLabel: "Залишок",
      financeAllTimeTitle: "Загалом",
      financeAllTimeHint: "Усі роботи та виплати в обліку — від початку користування.",
      allTimeEarnedLabel: "Нараховано (усього)",
      allTimePaidLabel: "Виплачено (усього)",
      allTimeBalanceLabel: "Залишок (усього)",
      tabMain: "Головна",
      tabWorks: "Роботи",
      tabExpenses: "Витрати",
      salaryPayoutsSectionTitle: "Виплачені зарплати",
      noPayoutsMatchFilter: "Виплат не знайдено за фільтром.",
      monthsOnRecord: "Місяців у обліку",
      filtersAndSort: "Фільтри",
      filtersSection: "Фільтри",
      sortSection: "Сортування",
      sortByLabel: "За полем",
      sortDirectionLabel: "Напрямок",
      resetFilters: "Скинути фільтри",
      done: "Готово",
      workerFilterLabel: "Працівник",
      adminScopeWorkerLabel: "Працівник для перегляду",
      adminScopeWorkerHint: "Фінанси, роботи та виплати показуються для обраного працівника",
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
      failedMirrorTarget:
        "Не знайдено профіль stratichuk / stratiichuk у Firestore. Нехай цільовий працівник один раз увійде в додаток, або вкажіть NEXT_PUBLIC_WORK_MIRROR_TARGET_UID у .env.local (UID з Firebase Authentication).",
      failedPermission:
        "Доступ заборонено. Опублікуйте оновлені правила Firestore (firestore.rules) у Firebase Console.",
    },
    workDetails: {
      title: "Деталі запису",
      editTitle: "Редагування запису",
      edit: "Редагувати",
      save: "Зберегти",
      cancel: "Скасувати",
      updated: "Запис оновлено",
      updateFailed: "Не вдалося оновити запис",
      openTooltip: "Відкрити деталі запису",
      delete: "Видалити",
      deleteConfirm: "Видалити цей запис? Дію не можна скасувати.",
      deleteConfirmAction: "Так, видалити",
      deleted: "Запис видалено",
      deleteFailed: "Не вдалося видалити запис",
      deleteFailedPermission:
        "Немає прав на видалення. Опублікуйте firestore.rules у Firebase Console (Firestore → Rules → Publish). Для адміна в users/{uid} має бути role: admin.",
    },
    workPayment: {
      columnTitle: "Оплата",
      sectionTitle: "Статус оплати",
      sectionHint: "Відмітьте етап: акт, подання на оплату чи вже оплачено.",
      pending: "Не подано",
      submitted: "Подано на оплату",
      paid: "Оплачено",
      filterLabel: "Статус оплати",
      filterAll: "Усі статуси",
      updateFailed: "Не вдалося оновити статус",
      legendLabel: "Позначки:",
      legendShowAll: "Усі записи",
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
      categoryFilterHint: "Select one or more — entries from any selected category are shown.",
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
      financeMonthBannerTitle: "Monthly finances",
      financeMonthPicker: "Month",
      monthlyEarnedLabel: "Earned (work)",
      monthlyPaidLabel: "Paid out",
      monthlyBalanceLabel: "Balance",
      financeAllTimeTitle: "Overall",
      financeAllTimeHint: "All work and payouts on record — from when you started using the app.",
      allTimeEarnedLabel: "Earned (total)",
      allTimePaidLabel: "Paid out (total)",
      allTimeBalanceLabel: "Balance (total)",
      tabMain: "Home",
      tabWorks: "Work",
      tabExpenses: "Expenses",
      salaryPayoutsSectionTitle: "Salary payouts",
      noPayoutsMatchFilter: "No payouts match the filter.",
      monthsOnRecord: "Months on record",
      filtersAndSort: "Filters",
      filtersSection: "Filters",
      sortSection: "Sort",
      sortByLabel: "Sort by",
      sortDirectionLabel: "Direction",
      resetFilters: "Reset filters",
      done: "Done",
      workerFilterLabel: "Worker",
      adminScopeWorkerLabel: "View employee",
      adminScopeWorkerHint: "Finances, work, and payouts reflect the selected employee",
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
      failedMirrorTarget:
        "Profile for stratiichuk@gmail.com not found. They must sign in once, or set NEXT_PUBLIC_WORK_MIRROR_TARGET_UID in .env.local",
      failedPermission:
        "Permission denied. Publish updated Firestore rules (firestore.rules) in Firebase Console.",
    },
    workDetails: {
      title: "Entry details",
      editTitle: "Edit entry",
      edit: "Edit",
      save: "Save",
      cancel: "Cancel",
      updated: "Entry updated",
      updateFailed: "Failed to update entry",
      openTooltip: "Open entry details",
      delete: "Delete",
      deleteConfirm: "Delete this entry? This cannot be undone.",
      deleteConfirmAction: "Yes, delete",
      deleted: "Entry deleted",
      deleteFailed: "Failed to delete entry",
      deleteFailedPermission:
        "Permission denied. Publish firestore.rules in Firebase Console (Firestore → Rules → Publish). Admins need role: admin in users/{uid}.",
    },
    workPayment: {
      columnTitle: "Payment",
      sectionTitle: "Payment status",
      sectionHint: "Track act submission and whether the work has been paid.",
      pending: "Not submitted",
      submitted: "Submitted for payment",
      paid: "Paid",
      filterLabel: "Payment status",
      filterAll: "All statuses",
      updateFailed: "Failed to update status",
      legendLabel: "Legend:",
      legendShowAll: "Show all",
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
  | "dashboard.categoryFilterHint"
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
  | "dashboard.financeMonthBannerTitle"
  | "dashboard.financeMonthPicker"
  | "dashboard.monthlyEarnedLabel"
  | "dashboard.monthlyPaidLabel"
  | "dashboard.monthlyBalanceLabel"
  | "dashboard.financeAllTimeTitle"
  | "dashboard.financeAllTimeHint"
  | "dashboard.allTimeEarnedLabel"
  | "dashboard.allTimePaidLabel"
  | "dashboard.allTimeBalanceLabel"
  | "dashboard.tabMain"
  | "dashboard.tabWorks"
  | "dashboard.tabExpenses"
  | "dashboard.salaryPayoutsSectionTitle"
  | "dashboard.noPayoutsMatchFilter"
  | "dashboard.monthsOnRecord"
  | "dashboard.filtersAndSort"
  | "dashboard.filtersSection"
  | "dashboard.sortSection"
  | "dashboard.sortByLabel"
  | "dashboard.sortDirectionLabel"
  | "dashboard.resetFilters"
  | "dashboard.done"
  | "dashboard.workerFilterLabel"
  | "dashboard.adminScopeWorkerLabel"
  | "dashboard.adminScopeWorkerHint"
  | "workForm.title"
  | "workForm.date"
  | "workForm.description"
  | "workForm.category"
  | "workForm.amountOptional"
  | "workForm.selectCategory"
  | "workForm.saveWork"
  | "workForm.categoryMissing"
  | "workForm.failed"
  | "workForm.failedMirrorTarget"
  | "workForm.failedPermission"
  | "workDetails.title"
  | "workDetails.editTitle"
  | "workDetails.edit"
  | "workDetails.save"
  | "workDetails.cancel"
  | "workDetails.updated"
  | "workDetails.updateFailed"
  | "workDetails.openTooltip"
  | "workDetails.delete"
  | "workDetails.deleteConfirm"
  | "workDetails.deleteConfirmAction"
  | "workDetails.deleted"
  | "workDetails.deleteFailed"
  | "workDetails.deleteFailedPermission"
  | "workPayment.columnTitle"
  | "workPayment.sectionTitle"
  | "workPayment.sectionHint"
  | "workPayment.pending"
  | "workPayment.submitted"
  | "workPayment.paid"
  | "workPayment.filterLabel"
  | "workPayment.filterAll"
  | "workPayment.updateFailed"
  | "workPayment.legendLabel"
  | "workPayment.legendShowAll";
