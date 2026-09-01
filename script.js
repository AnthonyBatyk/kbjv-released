document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  /* =========================================================
     SUPABASE
  ========================================================= */

  const SUPABASE_URL =
    "https://hbyeycsoxedzvapesrwq.supabase.co";

  const SUPABASE_KEY =
    "sb_publishable_uSR9bn7YeGiy-PTKlUTBNw_ZQtL5Icn";

  let supabaseClient = null;

  if (
    window.supabase &&
    typeof window.supabase.createClient === "function"
  ) {
    supabaseClient = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_KEY
    );
  }


  /* =========================================================
     STATUS STYLES
  ========================================================= */

  const statusStyle = document.createElement("style");

  statusStyle.textContent = `
    .button-status-success {
      background: #22c55e !important;
      background-color: #22c55e !important;
      border-color: #22c55e !important;
      color: #ffffff !important;
      box-shadow:
        0 0 0 1px rgba(34, 197, 94, 0.35),
        0 0 18px rgba(34, 197, 94, 0.35) !important;
      position: relative;
      animation: kbjvButtonPulse 0.25s ease;
    }

    .button-status-error {
      background: #ef4444 !important;
      background-color: #ef4444 !important;
      border-color: #ef4444 !important;
      color: #ffffff !important;
      box-shadow:
        0 0 0 1px rgba(239, 68, 68, 0.35),
        0 0 18px rgba(239, 68, 68, 0.35) !important;
      position: relative;
      animation: kbjvButtonPulse 0.25s ease;
    }

    .button-status-info {
      background: #3b82f6 !important;
      background-color: #3b82f6 !important;
      border-color: #3b82f6 !important;
      color: #ffffff !important;
      box-shadow:
        0 0 0 1px rgba(59, 130, 246, 0.35),
        0 0 18px rgba(59, 130, 246, 0.35) !important;
      position: relative;
      animation: kbjvButtonPulse 0.25s ease;
    }

    .button-status-success::after,
    .button-status-error::after {
      display: inline-block;
      margin-left: 6px;
      font-weight: 700;
    }

    .button-status-success::after {
      content: "✓";
    }

    .button-status-error::after {
      content: "✕";
    }

    @keyframes kbjvButtonPulse {
      0% {
        transform: scale(0.97);
      }

      100% {
        transform: scale(1);
      }
    }

    .delete-product-item-button {
      background: #ef4444 !important;
      background-color: #ef4444 !important;
      color: #ffffff !important;
    }

    .delete-product-item-button:hover {
      background: #dc2626 !important;
      background-color: #dc2626 !important;
    }

    /*
      ВАЖЛИВО:
      Кнопка "Скасувати" у модалці під час статусу
      повинна бути реально червоною, а не тільки
      мати червоне світіння.
    */
    #product-cancel.button-status-error,
    #add-product-cancel.button-status-error,
    #archive-text-cancel.button-status-error {
      background: #ef4444 !important;
      background-color: #ef4444 !important;
      border-color: #ef4444 !important;
      color: #ffffff !important;
      box-shadow:
        0 0 0 1px rgba(239, 68, 68, 0.35),
        0 0 18px rgba(239, 68, 68, 0.35) !important;
    }

    #product-cancel.button-status-error:hover,
    #add-product-cancel.button-status-error:hover,
    #archive-text-cancel.button-status-error:hover {
      background: #ef4444 !important;
      background-color: #ef4444 !important;
      border-color: #ef4444 !important;
      color: #ffffff !important;
    }

    /*
      Коли режим зміни розташування активний,
      кнопка залишається синьою/info і не втрачає
      можливість натискання.
    */
    #reorder-products.button-status-info {
      cursor: pointer !important;
      pointer-events: auto !important;
    }
  `;

  document.head.appendChild(statusStyle);


  /* =========================================================
     LOCAL STORAGE KEYS
  ========================================================= */

  const PRODUCTS_KEY = "kbjv_products";
  const CALCULATOR_KEY = "kbjv_calculator";
  const ARCHIVE_KEY = "kbjv_archive";

  const ACTIVE_TAB_KEY = "kbjv_active_tab";
  const CALCULATOR_DRAFT_KEY = "kbjv_calculator_draft";
  const SEARCH_QUERY_KEY = "kbjv_search_query";

  /*
    Зберігаємо саме режим зміни розташування.
    Це потрібно, щоб після F5 стан інтерфейсу не
    поводився непередбачувано.
  */
  const REORDER_MODE_KEY = "kbjv_reorder_mode";


  /* =========================================================
     DEFAULT PRODUCTS
  ========================================================= */

  const DEFAULT_PRODUCTS = [
    {
      id: "local-eggs",
      name: "Яйця",
      kcal: 155,
      protein: 12,
      fat: 10.2,
      carb: 0.8,
      unit: "г",
      full_name:
        "Яйця aro курячі харчові столові L C0"
    },

    {
      id: "local-heineken",
      name: "Пиво Heineken",
      kcal: 42,
      protein: 0,
      fat: 0,
      carb: 3.2,
      unit: "мл",
      full_name:
        "Пиво Heineken світле нефільтроване пастеризоване, напій алкогольний, вміст спирту 5%"
    }
  ];


  /* =========================================================
     STATE
  ========================================================= */

  let products = [];

  let calculatorItems = [];

  let archiveItems = [];

  let selectedProduct = null;

  let draggedCard = null;

  let reorderMode = false;

  let reorderChanged = false;

  let archiveEditingId = null;

  let archiveOriginalDate = null;

  let archiveOriginalText = null;


  /* =========================================================
     DOM
  ========================================================= */

  const tabs =
    document.querySelectorAll(".tab");

  const pages =
    document.querySelectorAll(".page");

  const grid =
    document.getElementById("grid");

  const searchInput =
    document.getElementById("search");

  const clearSearch =
    document.getElementById("clear-search");

  const exportProductsButton =
    document.getElementById("export-products");

  const importProductsButton =
    document.getElementById("import-products");

  const importFile =
    document.getElementById("import-file");

  const addProductButton =
    document.getElementById("add-product");

  const deleteProductButton =
    document.getElementById("delete-product");

  const reorderProductsButton =
    document.getElementById("reorder-products");


  /* =========================================================
     PRODUCT MODAL DOM
  ========================================================= */

  const productModal =
    document.getElementById("product-modal");

  const productModalName =
    document.getElementById("product-modal-name");

  const productWeight =
    document.getElementById("product-weight");

  const productCancel =
    document.getElementById("product-cancel");

  const productCopy =
    document.getElementById("product-copy");

  const productCalculator =
    document.getElementById("product-calculator");


  /* =========================================================
     ADD PRODUCT MODAL DOM
  ========================================================= */

  const addProductModal =
    document.getElementById("add-product-modal");

  const addProductCancel =
    document.getElementById("add-product-cancel");

  const addProductSave =
    document.getElementById("add-product-save");

  const newProductName =
    document.getElementById("new-product-name");

  const newProductKcal =
    document.getElementById("new-product-kcal");

  const newProductProtein =
    document.getElementById("new-product-protein");

  const newProductFat =
    document.getElementById("new-product-fat");

  const newProductCarb =
    document.getElementById("new-product-carb");

  const newProductDescription =
    document.getElementById("new-product-description");


  /* =========================================================
     DELETE PRODUCT MODAL DOM
  ========================================================= */

  const deleteProductModal =
    document.getElementById("delete-product-modal");

  const deleteProductList =
    document.getElementById("delete-product-list");

  const deleteProductCancel =
    document.getElementById("delete-product-cancel");


  /* =========================================================
     ARCHIVE TEXT MODAL DOM
  ========================================================= */

  const archiveTextModal =
    document.getElementById("archive-text-modal");

  const archiveTextInput =
    document.getElementById("archive-text-input");

  const archiveTextCancel =
    document.getElementById("archive-text-cancel");

  const archiveTextSave =
    document.getElementById("archive-text-save");


  /* =========================================================
     CALCULATOR DOM
  ========================================================= */

  const calcInput =
    document.getElementById("calc-input");

  const calcAdd =
    document.getElementById("calc-add");

  const calcClearText =
    document.getElementById("calc-clear-text");

  const calcClearBlocks =
    document.getElementById("calc-clear-blocks");

  const kcalElement =
    document.getElementById("kcal");

  const proteinElement =
    document.getElementById("protein");

  const fatElement =
    document.getElementById("fat");

  const carbElement =
    document.getElementById("carb");

  const copyTotal =
    document.getElementById("copy-total");

  const saveArchive =
    document.getElementById("save-archive");

  const calcLog =
    document.getElementById("calc-log");

  const archiveLog =
    document.getElementById("archive-log");


  /* =========================================================
     BUTTON STATUS
  ========================================================= */

  function clearButtonStatus(button) {
    if (!button) return;

    button.classList.remove(
      "button-status-success",
      "button-status-error",
      "button-status-info",
      "success",
      "error",
      "copied"
    );
  }


  function showButtonState(
    button,
    text,
    state,
    duration = 1500
  ) {
    if (!button) return;

    clearTimeout(
      button._statusTimeout
    );

    clearButtonStatus(button);

    const originalText =
      button.dataset.originalText ||
      button.textContent.trim();

    button.dataset.originalText =
      originalText;

    button.textContent =
      text;

    button.classList.add(
      `button-status-${state}`
    );

    button._statusTimeout =
      setTimeout(() => {
        clearButtonStatus(button);

        button.textContent =
          originalText;

        /*
          Для кнопки reorder важливо не залишати
          старий dataset originalText після завершення.
        */
        if (
          button ===
          reorderProductsButton
        ) {
          delete button.dataset.originalText;
        }
      }, duration);
  }


  function setButtonStatusPermanent(
    button,
    text,
    state
  ) {
    if (!button) return;

    clearTimeout(
      button._statusTimeout
    );

    const originalText =
      button.dataset.originalText ||
      button.textContent.trim();

    button.dataset.originalText =
      originalText;

    clearButtonStatus(button);

    button.textContent =
      text;

    button.classList.add(
      `button-status-${state}`
    );
  }


  /* =========================================================
     GENERAL HELPERS
  ========================================================= */

  function createId() {
    if (
      typeof crypto !== "undefined" &&
      crypto.randomUUID
    ) {
      return crypto.randomUUID();
    }

    return (
      Date.now().toString(36) +
      Math.random()
        .toString(36)
        .substring(2)
    );
  }


  function number(
    value,
    fallback = 0
  ) {
    const parsed =
      Number.parseFloat(value);

    return Number.isFinite(parsed)
      ? parsed
      : fallback;
  }


  function round(
    value,
    decimals = 2
  ) {
    const multiplier =
      10 ** decimals;

    return (
      Math.round(
        (number(value) +
          Number.EPSILON) *
          multiplier
      ) / multiplier
    );
  }


  function formatNumber(value) {
    const rounded =
      round(value, 2);

    return rounded
      .toString()
      .replace(".", ",");
  }


  function escapeHTML(value) {
    return String(value ?? "")
      .replaceAll(
        "&",
        "&amp;"
      )
      .replaceAll(
        "<",
        "&lt;"
      )
      .replaceAll(
        ">",
        "&gt;"
      )
      .replaceAll(
        '"',
        "&quot;"
      )
      .replaceAll(
        "'",
        "&#039;"
      );
  }


  function getInitials(name) {
    const words =
      String(name || "")
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (!words.length) {
      return "?";
    }

    if (words.length === 1) {
      return words[0]
        .substring(0, 2)
        .toUpperCase();
    }

    return (
      words[0][0] +
      words[1][0]
    ).toUpperCase();
  }


  function normalizeProduct(product) {
    if (!product) return null;

    const name =
      String(
        product.name ??
          product.text ??
          ""
      ).trim();

    if (!name) {
      return null;
    }

    return {
      id:
        product.id ||
        createId(),

      name,

      kcal:
        number(product.kcal),

      protein:
        number(product.protein),

      fat:
        number(product.fat),

      carb:
        number(product.carb),

      unit:
        product.unit ||
        "г",

      full_name:
        product.full_name ??
        product.fullName ??
        ""
    };
  }


  /* =========================================================
     ACTIVE TAB PERSISTENCE
  ========================================================= */

  function saveActiveTab(tabName) {
    if (!tabName) return;

    localStorage.setItem(
      ACTIVE_TAB_KEY,
      tabName
    );
  }


  function loadActiveTab() {
    const saved =
      localStorage.getItem(
        ACTIVE_TAB_KEY
      );

    if (
      saved === "blocks" ||
      saved === "calculator" ||
      saved === "archive"
    ) {
      return saved;
    }

    return "blocks";
  }


  function setActiveTab(tabName) {
    if (!tabName) {
      tabName = "blocks";
    }

    tabs.forEach(tab => {
      tab.classList.toggle(
        "active",
        tab.dataset.tab === tabName
      );
    });

    pages.forEach(page => {
      page.classList.toggle(
        "active",
        page.id === tabName
      );
    });

    saveActiveTab(tabName);

    if (tabName === "calculator") {
      renderCalculator();
    }

    if (tabName === "archive") {
      renderArchive();
    }
  }


  /* =========================================================
     CALCULATOR DRAFT PERSISTENCE
  ========================================================= */

  function saveCalculatorDraft() {
    if (!calcInput) return;

    localStorage.setItem(
      CALCULATOR_DRAFT_KEY,
      calcInput.value
    );
  }


  function loadCalculatorDraft() {
    if (!calcInput) return;

    const draft =
      localStorage.getItem(
        CALCULATOR_DRAFT_KEY
      );

    if (draft !== null) {
      calcInput.value =
        draft;
    }
  }


  function clearCalculatorDraft() {
    localStorage.removeItem(
      CALCULATOR_DRAFT_KEY
    );
  }


  /* =========================================================
     SEARCH PERSISTENCE
  ========================================================= */

  function saveSearchQuery() {
    if (!searchInput) return;

    localStorage.setItem(
      SEARCH_QUERY_KEY,
      searchInput.value
    );
  }


  function loadSearchQuery() {
    if (!searchInput) return;

    const query =
      localStorage.getItem(
        SEARCH_QUERY_KEY
      ) || "";

    searchInput.value =
      query;

    if (clearSearch) {
      clearSearch.style.display =
        query
          ? "block"
          : "none";
    }
  }


  /* =========================================================
     REORDER STATE PERSISTENCE
  ========================================================= */

  function saveReorderMode() {
    localStorage.setItem(
      REORDER_MODE_KEY,
      reorderMode
        ? "true"
        : "false"
    );
  }


  function loadReorderMode() {
    return (
      localStorage.getItem(
        REORDER_MODE_KEY
      ) === "true"
    );
  }


  /* =========================================================
     LOCAL STORAGE
  ========================================================= */

  function loadProductsLocal() {
    try {
      const raw =
        localStorage.getItem(
          PRODUCTS_KEY
        );

      if (!raw) {
        return [];
      }

      const parsed =
        JSON.parse(raw);

      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed
        .map(normalizeProduct)
        .filter(Boolean);
    } catch (error) {
      console.error(
        "Помилка завантаження продуктів:",
        error
      );

      return [];
    }
  }


  function saveProductsLocal() {
    localStorage.setItem(
      PRODUCTS_KEY,
      JSON.stringify(products)
    );
  }


  function loadCalculatorLocal() {
    try {
      const raw =
        localStorage.getItem(
          CALCULATOR_KEY
        );

      if (!raw) {
        return [];
      }

      const parsed =
        JSON.parse(raw);

      return Array.isArray(parsed)
        ? parsed
        : [];
    } catch (error) {
      console.error(
        "Помилка завантаження калькулятора:",
        error
      );

      return [];
    }
  }


  function saveCalculatorLocal() {
    localStorage.setItem(
      CALCULATOR_KEY,
      JSON.stringify(
        calculatorItems
      )
    );
  }


  function loadArchiveLocal() {
    try {
      const raw =
        localStorage.getItem(
          ARCHIVE_KEY
        );

      if (!raw) {
        return [];
      }

      const parsed =
        JSON.parse(raw);

      return Array.isArray(parsed)
        ? parsed
        : [];
    } catch (error) {
      console.error(
        "Помилка завантаження архіву:",
        error
      );

      return [];
    }
  }


  function saveArchiveLocal() {
    localStorage.setItem(
      ARCHIVE_KEY,
      JSON.stringify(
        archiveItems
      )
    );
  }


  /* =========================================================
     SUPABASE USER
  ========================================================= */

  async function getCurrentUser() {
    if (!supabaseClient) {
      return null;
    }

    try {
      const {
        data,
        error
      } =
        await supabaseClient.auth.getUser();

      if (error) {
        return null;
      }

      return data?.user || null;
    } catch (error) {
      console.error(
        "Помилка отримання користувача:",
        error
      );

      return null;
    }
  }


  /* =========================================================
     SUPABASE LOAD PRODUCTS
  ========================================================= */

  async function loadProductsFromSupabase() {
    if (!supabaseClient) {
      return [];
    }

    try {
      const user =
        await getCurrentUser();

      if (!user) {
        return [];
      }

      const {
        data,
        error
      } =
        await supabaseClient
          .from("products")
          .select("*")
          .eq(
            "user_id",
            user.id
          )
          .order(
            "created_at",
            {
              ascending: true
            }
          );

      if (error) {
        console.error(
          "Помилка завантаження продуктів Supabase:",
          error
        );

        return [];
      }

      return (data || [])
        .map(normalizeProduct)
        .filter(Boolean);
    } catch (error) {
      console.error(
        "Помилка Supabase:",
        error
      );

      return [];
    }
  }


  /* =========================================================
     MERGE PRODUCTS
  ========================================================= */

  function mergeProducts(
    localProducts,
    remoteProducts
  ) {
    const map =
      new Map();

    localProducts.forEach(
      product => {
        map.set(
          product.id,
          product
        );
      }
    );

    remoteProducts.forEach(
      product => {
        map.set(
          product.id,
          product
        );
      }
    );

    return Array.from(
      map.values()
    );
  }


  /* =========================================================
     SUPABASE SAVE PRODUCT
  ========================================================= */

  async function saveProductToSupabase(
    product
  ) {
    if (!supabaseClient) {
      return;
    }

    try {
      const user =
        await getCurrentUser();

      if (!user) {
        return;
      }

      const payload = {
        id: product.id,
        user_id: user.id,
        name: product.name,
        kcal: product.kcal,
        protein: product.protein,
        fat: product.fat,
        carb: product.carb,
        unit: product.unit,
        full_name:
          product.full_name
      };

      const {
        error
      } =
        await supabaseClient
          .from("products")
          .upsert(
            payload,
            {
              onConflict:
                "id"
            }
          );

      if (error) {
        console.error(
          "Помилка збереження продукту:",
          error
        );
      }
    } catch (error) {
      console.error(
        "Помилка Supabase:",
        error
      );
    }
  }


  /* =========================================================
     SUPABASE DELETE PRODUCT
  ========================================================= */

  async function deleteProductFromSupabase(
    productId
  ) {
    if (!supabaseClient) {
      return;
    }

    try {
      const user =
        await getCurrentUser();

      if (!user) {
        return;
      }

      const {
        error
      } =
        await supabaseClient
          .from("products")
          .delete()
          .eq(
            "id",
            productId
          )
          .eq(
            "user_id",
            user.id
          );

      if (error) {
        console.error(
          "Помилка видалення продукту:",
          error
        );
      }
    } catch (error) {
      console.error(
        "Помилка Supabase:",
        error
      );
    }
  }


  /* =========================================================
     INITIALIZE PRODUCTS
  ========================================================= */

  async function initializeProducts() {
    const localProducts =
      loadProductsLocal();

    if (localProducts.length) {
      products =
        localProducts;

      renderProducts(
        searchInput?.value || ""
      );
    } else {
      products =
        DEFAULT_PRODUCTS.map(
          product =>
            normalizeProduct(
              product
            )
        );

      saveProductsLocal();

      renderProducts(
        searchInput?.value || ""
      );
    }

    /*
      Відновлюємо режим тільки після того,
      як продукти завантажені.
    */
    reorderMode =
      loadReorderMode();

    if (reorderMode) {
      grid.classList.add(
        "reorder-mode"
      );

      setButtonStatusPermanent(
        reorderProductsButton,
        "Завершити зміну розташування?",
        "info"
      );
    }

    renderProducts(
      searchInput?.value || ""
    );

    const remoteProducts =
      await loadProductsFromSupabase();

    if (remoteProducts.length) {
      products =
        mergeProducts(
          products,
          remoteProducts
        );

      saveProductsLocal();

      renderProducts(
        searchInput?.value || ""
      );
    }
  }


  /* =========================================================
     SYNC PRODUCTS
  ========================================================= */

  async function syncProductsToSupabase() {
    if (!supabaseClient) {
      return;
    }

    try {
      const user =
        await getCurrentUser();

      if (!user) {
        return;
      }

      for (const product of products) {
        await saveProductToSupabase(
          product
        );
      }
    } catch (error) {
      console.error(
        "Помилка синхронізації:",
        error
      );
    }
  }


  /* =========================================================
     PRODUCT RENDER
  ========================================================= */

  function renderProducts(filter = "") {
    if (!grid) return;

    const query =
      String(filter || "")
        .trim()
        .toLowerCase();

    const filtered =
      products.filter(
        product => {
          if (!query) {
            return true;
          }

          return (
            product.name
              .toLowerCase()
              .includes(query) ||
            String(
              product.full_name ||
                ""
            )
              .toLowerCase()
              .includes(query)
          );
        }
      );

    grid.innerHTML = "";

    filtered.forEach(
      product => {
        grid.appendChild(
          createProductCard(
            product
          )
        );
      }
    );

    if (reorderMode) {
      enableDragAndDrop();
    }
  }


  /* =========================================================
     PRODUCT CARD
  ========================================================= */

  function createProductCard(
    product
  ) {
    const article =
      document.createElement(
        "article"
      );

    article.className =
      "food-card";

    article.dataset.id =
      product.id;

    article.draggable =
      reorderMode;

    article.innerHTML = `
      <div
        class="copy-btn"
        title="Скопіювати блок"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M9 9V5.8C9 4.80589 9.80589 4 10.8 4H18.2C19.1941 4 20 4.80589 20 5.8V13.2C20 14.1941 19.1941 15 18.2 15H15"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          />
          <rect
            x="4"
            y="9"
            width="11"
            height="11"
            rx="1.8"
            stroke="currentColor"
            stroke-width="2"
          />
        </svg>

        <span class="tooltip">
          Скопіювати
        </span>
      </div>

      <div class="food-title">

        <div class="badge">
          ${escapeHTML(
            getInitials(
              product.name
            )
          )}
        </div>

        <div>
          <div class="name">
            ${escapeHTML(
              product.name
            )}
          </div>

          <div class="meta">
            на 100 ${escapeHTML(
              product.unit || "г"
            )}
          </div>
        </div>

      </div>

      <div class="kbjv">

        <div class="row">
          <span class="key">
            Ккал
          </span>

          <span class="val">
            ${formatNumber(
              product.kcal
            )}
          </span>
        </div>

        <div class="row">
          <span class="key">
            Білки
          </span>

          <span class="val">
            ${formatNumber(
              product.protein
            )} г
          </span>
        </div>

        <div class="row">
          <span class="key">
            Жири
          </span>

          <span class="val">
            ${formatNumber(
              product.fat
            )} г
          </span>
        </div>

        <div class="row">
          <span class="key">
            Вуглеводи
          </span>

          <span class="val">
            ${formatNumber(
              product.carb
            )} г
          </span>
        </div>

      </div>

      ${
        product.full_name
          ? `
            <div class="full-name">
              ${escapeHTML(
                product.full_name
              )}
            </div>
          `
          : ""
      }
    `;

    const copyButton =
      article.querySelector(
        ".copy-btn"
      );

    copyButton.addEventListener(
      "click",
      event => {
        event.stopPropagation();

        if (reorderMode) {
          return;
        }

        openProductModal(
          product
        );
      }
    );

    article.addEventListener(
      "click",
      event => {
        if (
          event.target.closest(
            ".copy-btn"
          )
        ) {
          return;
        }

        if (reorderMode) {
          return;
        }

        openProductModal(
          product
        );
      }
    );

    return article;
  }


  /* =========================================================
     SEARCH
  ========================================================= */

  if (searchInput) {
    searchInput.addEventListener(
      "input",
      () => {
        saveSearchQuery();

        renderProducts(
          searchInput.value
        );

        if (clearSearch) {
          clearSearch.style.display =
            searchInput.value
              ? "block"
              : "none";
        }
      }
    );
  }


  if (clearSearch) {
    clearSearch.addEventListener(
      "click",
      () => {
        if (!searchInput) return;

        searchInput.value =
          "";

        saveSearchQuery();

        clearSearch.style.display =
          "none";

        renderProducts("");
      }
    );
  }


  /* =========================================================
     PRODUCT MODAL
  ========================================================= */

  function openProductModal(
    product
  ) {
    selectedProduct =
      product;

    productModalName.textContent =
      product.name;

    productWeight.value =
      "100";

    clearButtonStatus(
      productCancel
    );

    clearButtonStatus(
      productCopy
    );

    clearButtonStatus(
      productCalculator
    );

    productModal.classList.add(
      "active"
    );

    setTimeout(() => {
      productWeight.focus();
      productWeight.select();
    }, 0);
  }


  function closeProductModal() {
    productModal.classList.remove(
      "active"
    );

    selectedProduct =
      null;
  }


  productCancel?.addEventListener(
    "click",
    () => {
      showButtonState(
        productCancel,
        "Скасовано",
        "error",
        900
      );

      setTimeout(() => {
        closeProductModal();
      }, 350);
    }
  );


  productModal?.addEventListener(
    "click",
    event => {
      if (
        event.target ===
        productModal
      ) {
        showButtonState(
          productCancel,
          "Скасовано",
          "error",
          900
        );

        setTimeout(() => {
          closeProductModal();
        }, 350);
      }
    }
  );


  function calculateProduct(
    product,
    weight
  ) {
    const multiplier =
      number(weight) / 100;

    return {
      kcal: round(
        product.kcal *
          multiplier
      ),

      protein: round(
        product.protein *
          multiplier
      ),

      fat: round(
        product.fat *
          multiplier
      ),

      carb: round(
        product.carb *
          multiplier
      )
    };
  }


  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(
        text
      );

      return true;
    } catch (error) {
      try {
        const textarea =
          document.createElement(
            "textarea"
          );

        textarea.value =
          text;

        textarea.style.position =
          "fixed";

        textarea.style.opacity =
          "0";

        document.body.appendChild(
          textarea
        );

        textarea.focus();
        textarea.select();

        const result =
          document.execCommand(
            "copy"
          );

        textarea.remove();

        return result;
      } catch {
        return false;
      }
    }
  }


  function getProductSummary(
    product,
    weight
  ) {
    const calculated =
      calculateProduct(
        product,
        weight
      );

    return `${product.name}, для ${formatNumber(weight)} грам - ${formatNumber(calculated.kcal)} ккал / ${formatNumber(calculated.protein)} білка / ${formatNumber(calculated.fat)} жирів / ${formatNumber(calculated.carb)} вуглеводів`;
  }


  productCopy?.addEventListener(
    "click",
    async () => {
      if (!selectedProduct) {
        return;
      }

      const weight =
        number(
          productWeight.value
        );

      if (weight <= 0) {
        showButtonState(
          productCopy,
          "Некоректна вага",
          "error",
          1200
        );

        return;
      }

      const text =
        getProductSummary(
          selectedProduct,
          weight
        );

      const success =
        await copyText(text);

      if (success) {
        showButtonState(
          productCopy,
          "Скопійовано",
          "success",
          1200
        );
      } else {
        showButtonState(
          productCopy,
          "Помилка",
          "error",
          1200
        );
      }
    }
  );


  productCalculator?.addEventListener(
    "click",
    () => {
      if (!selectedProduct) {
        return;
      }

      const weight =
        number(
          productWeight.value
        );

      if (weight <= 0) {
        showButtonState(
          productCalculator,
          "Некоректна вага",
          "error",
          1200
        );

        return;
      }

      const text =
        getProductSummary(
          selectedProduct,
          weight
        );

      if (
        calcInput.value.trim()
      ) {
        calcInput.value +=
          "\n" + text;
      } else {
        calcInput.value =
          text;
      }

      saveCalculatorDraft();

      showButtonState(
        productCalculator,
        "Додано",
        "success",
        1200
      );

      setTimeout(() => {
        closeProductModal();
      }, 300);
    }
  );


  /* =========================================================
     ADD PRODUCT MODAL
  ========================================================= */

  function openAddProductModal() {
    newProductName.value =
      "";

    newProductKcal.value =
      "";

    newProductProtein.value =
      "";

    newProductFat.value =
      "";

    newProductCarb.value =
      "";

    newProductDescription.value =
      "";

    clearButtonStatus(
      addProductCancel
    );

    clearButtonStatus(
      addProductSave
    );

    addProductModal.classList.add(
      "active"
    );

    setTimeout(() => {
      newProductName.focus();
    }, 0);
  }


  function closeAddProductModal() {
    addProductModal.classList.remove(
      "active"
    );
  }


  addProductButton?.addEventListener(
    "click",
    openAddProductModal
  );


  addProductCancel?.addEventListener(
    "click",
    () => {
      showButtonState(
        addProductCancel,
        "Скасовано",
        "error",
        900
      );

      setTimeout(() => {
        closeAddProductModal();
      }, 350);
    }
  );


  addProductModal?.addEventListener(
    "click",
    event => {
      if (
        event.target ===
        addProductModal
      ) {
        showButtonState(
          addProductCancel,
          "Скасовано",
          "error",
          900
        );

        setTimeout(() => {
          closeAddProductModal();
        }, 350);
      }
    }
  );


  async function saveNewProduct() {
    const name =
      newProductName.value.trim();

    if (!name) {
      showButtonState(
        addProductSave,
        "Введіть назву",
        "error",
        1200
      );

      return;
    }

    const product = {
      id: createId(),

      name,

      kcal:
        number(
          newProductKcal.value
        ),

      protein:
        number(
          newProductProtein.value
        ),

      fat:
        number(
          newProductFat.value
        ),

      carb:
        number(
          newProductCarb.value
        ),

      unit: "г",

      full_name:
        newProductDescription.value.trim()
    };

    products.push(
      product
    );

    saveProductsLocal();

    renderProducts(
      searchInput?.value || ""
    );

    showButtonState(
      addProductSave,
      "Збережено",
      "success",
      1200
    );

    showButtonState(
      addProductButton,
      "Додано",
      "success",
      1200
    );

    await saveProductToSupabase(
      product
    );

    setTimeout(() => {
      closeAddProductModal();
    }, 350);
  }


  addProductSave?.addEventListener(
    "click",
    saveNewProduct
  );


  /* =========================================================
     DELETE PRODUCT
  ========================================================= */

  function openDeleteProductModal() {
    renderDeleteProductList();

    deleteProductModal.classList.add(
      "active"
    );
  }


  function closeDeleteProductModal() {
    deleteProductModal.classList.remove(
      "active"
    );
  }


  function renderDeleteProductList() {
    deleteProductList.innerHTML =
      "";

    if (!products.length) {
      deleteProductList.innerHTML = `
        <div class="delete-product-empty">
          Немає продуктів для видалення
        </div>
      `;

      return;
    }

    products.forEach(
      product => {
        const item =
          document.createElement(
            "div"
          );

        item.className =
          "delete-product-item";

        item.innerHTML = `
          <div class="delete-product-item-name">
            ${escapeHTML(
              product.name
            )}
          </div>

          <button
            type="button"
            class="delete-product-item-button"
          >
            Видалити
          </button>
        `;

        const button =
          item.querySelector(
            ".delete-product-item-button"
          );

        button.addEventListener(
          "click",
          async () => {
            const confirmed =
              confirm(
                `Видалити продукт «${product.name}»?`
              );

            if (!confirmed) {
              return;
            }

            products =
              products.filter(
                item =>
                  item.id !==
                  product.id
              );

            saveProductsLocal();

            renderProducts(
              searchInput?.value ||
                ""
            );

            renderDeleteProductList();

            await deleteProductFromSupabase(
              product.id
            );

            showButtonState(
              deleteProductButton,
              "Видалено",
              "success",
              1200
            );
          }
        );

        deleteProductList.appendChild(
          item
        );
      }
    );
  }


  deleteProductButton?.addEventListener(
    "click",
    openDeleteProductModal
  );


  deleteProductCancel?.addEventListener(
    "click",
    closeDeleteProductModal
  );


  deleteProductModal?.addEventListener(
    "click",
    event => {
      if (
        event.target ===
        deleteProductModal
      ) {
        closeDeleteProductModal();
      }
    }
  );


  /* =========================================================
     REORDER PRODUCTS
  ========================================================= */

  function enableDragAndDrop() {
    const cards =
      grid.querySelectorAll(
        ".food-card"
      );

    cards.forEach(card => {
      card.draggable =
        reorderMode;

      if (!reorderMode) {
        return;
      }

      card.addEventListener(
        "dragstart",
        handleDragStart
      );

      card.addEventListener(
        "dragover",
        handleDragOver
      );

      card.addEventListener(
        "dragleave",
        handleDragLeave
      );

      card.addEventListener(
        "drop",
        handleDrop
      );

      card.addEventListener(
        "dragend",
        handleDragEnd
      );
    });
  }


  function handleDragStart(event) {
    if (!reorderMode) {
      event.preventDefault();
      return;
    }

    draggedCard =
      event.currentTarget;

    draggedCard.classList.add(
      "dragging"
    );

    event.dataTransfer.effectAllowed =
      "move";

    event.dataTransfer.setData(
      "text/plain",
      draggedCard.dataset.id
    );
  }


  function handleDragOver(event) {
    if (!reorderMode) {
      return;
    }

    event.preventDefault();

    const card =
      event.currentTarget;

    if (
      card === draggedCard
    ) {
      return;
    }

    card.classList.add(
      "drag-over"
    );

    event.dataTransfer.dropEffect =
      "move";
  }


  function handleDragLeave(event) {
    event.currentTarget.classList.remove(
      "drag-over"
    );
  }


  function handleDrop(event) {
    if (!reorderMode) {
      return;
    }

    event.preventDefault();

    const targetCard =
      event.currentTarget;

    targetCard.classList.remove(
      "drag-over"
    );

    if (
      !draggedCard ||
      draggedCard === targetCard
    ) {
      return;
    }

    const draggedId =
      draggedCard.dataset.id;

    const targetId =
      targetCard.dataset.id;

    const draggedIndex =
      products.findIndex(
        product =>
          product.id ===
          draggedId
      );

    const targetIndex =
      products.findIndex(
        product =>
          product.id ===
          targetId
      );

    if (
      draggedIndex === -1 ||
      targetIndex === -1
    ) {
      return;
    }

    const [
      movedProduct
    ] =
      products.splice(
        draggedIndex,
        1
      );

    products.splice(
      targetIndex,
      0,
      movedProduct
    );

    reorderChanged =
      true;

    saveProductsLocal();

    renderProducts(
      searchInput?.value || ""
    );
  }


  function handleDragEnd() {
    if (draggedCard) {
      draggedCard.classList.remove(
        "dragging"
      );
    }

    grid
      .querySelectorAll(
        ".drag-over"
      )
      .forEach(card => {
        card.classList.remove(
          "drag-over"
        );
      });

    draggedCard =
      null;
  }


  reorderProductsButton?.addEventListener(
    "click",
    () => {
      /*
        ПЕРШЕ НАТИСКАННЯ:
        вмикаємо режим переміщення.
      */
      if (!reorderMode) {
        clearTimeout(
          reorderProductsButton._statusTimeout
        );

        reorderMode =
          true;

        reorderChanged =
          false;

        saveReorderMode();

        grid.classList.add(
          "reorder-mode"
        );

        setButtonStatusPermanent(
          reorderProductsButton,
          "Завершити зміну розташування?",
          "info"
        );

        renderProducts(
          searchInput?.value || ""
        );

        return;
      }

      /*
        ДРУГЕ НАТИСКАННЯ:
        завершуємо режим переміщення.
      */

      clearTimeout(
        reorderProductsButton._statusTimeout
      );

      reorderMode =
        false;

      saveReorderMode();

      grid.classList.remove(
        "reorder-mode"
      );

      renderProducts(
        searchInput?.value || ""
      );

      /*
        Якщо позиції реально змінювалися —
        показуємо зелений статус.
      */
      if (reorderChanged) {
        showButtonState(
          reorderProductsButton,
          "Збережено",
          "success",
          1200
        );
      } else {
        /*
          Якщо нічого не переміщали,
          просто повертаємо стандартний текст.
        */
        clearButtonStatus(
          reorderProductsButton
        );

        reorderProductsButton.textContent =
          "Змінити розташування продукту";

        delete reorderProductsButton.dataset
          .originalText;
      }

      reorderChanged =
        false;
    }
  );


  /* =========================================================
     EXPORT DATABASE
  ========================================================= */

  exportProductsButton?.addEventListener(
    "click",
    () => {
      if (!products.length) {
        showButtonState(
          exportProductsButton,
          "База порожня",
          "error",
          1200
        );

        return;
      }

      const confirmed =
        confirm(
          "Експортувати всю базу продуктів?"
        );

      if (!confirmed) {
        return;
      }

      const data = {
        version: 1,

        exported_at:
          new Date().toISOString(),

        products
      };

      const blob =
        new Blob(
          [
            JSON.stringify(
              data,
              null,
              2
            )
          ],
          {
            type:
              "application/json"
          }
        );

      const url =
        URL.createObjectURL(
          blob
        );

      const link =
        document.createElement(
          "a"
        );

      const date =
        new Date()
          .toISOString()
          .slice(0, 10);

      link.href =
        url;

      link.download =
        `kbjv-database-${date}.json`;

      document.body.appendChild(
        link
      );

      link.click();

      link.remove();

      URL.revokeObjectURL(
        url
      );

      showButtonState(
        exportProductsButton,
        "Експортовано",
        "success",
        1200
      );
    }
  );


  /* =========================================================
     IMPORT DATABASE
  ========================================================= */

  importProductsButton?.addEventListener(
    "click",
    () => {
      importFile?.click();
    }
  );


  importFile?.addEventListener(
    "change",
    event => {
      const file =
        event.target.files?.[0];

      if (!file) {
        return;
      }

      const reader =
        new FileReader();

      reader.onload =
        async () => {
          try {
            const parsed =
              JSON.parse(
                reader.result
              );

            const imported =
              Array.isArray(parsed)
                ? parsed
                : parsed?.products;

            if (
              !Array.isArray(
                imported
              )
            ) {
              throw new Error(
                "Невірний формат бази"
              );
            }

            const normalized =
              imported
                .map(
                  normalizeProduct
                )
                .filter(Boolean);

            if (
              !normalized.length
            ) {
              throw new Error(
                "Файл не містить продуктів"
              );
            }

            const confirmed =
              confirm(
                `Замінити поточну базу продуктів імпортованою? Продуктів: ${normalized.length}`
              );

            if (!confirmed) {
              return;
            }

            products =
              normalized;

            saveProductsLocal();

            renderProducts(
              searchInput?.value ||
                ""
            );

            await syncProductsToSupabase();

            showButtonState(
              importProductsButton,
              "Імпортовано",
              "success",
              1500
            );
          } catch (error) {
            console.error(
              error
            );

            showButtonState(
              importProductsButton,
              "Помилка",
              "error",
              1500
            );
          } finally {
            importFile.value =
              "";
          }
        };

      reader.readAsText(file);
    }
  );


  /* =========================================================
     CALCULATOR PARSER
  ========================================================= */

  function parseCalculatorLine(
    line
  ) {
    const text =
      String(line || "")
        .trim();

    if (!text) {
      return null;
    }

    const productMatch =
      text.match(
        /^(.+?),\s*для\s*([\d.,]+)\s*грам\s*-\s*([\d.,]+)\s*ккал\s*\/\s*([\d.,]+)\s*білка\s*\/\s*([\d.,]+)\s*жирів\s*\/\s*([\d.,]+)\s*вуглеводів/i
      );

    if (productMatch) {
      return {
        id: createId(),

        text,

        kcal:
          number(
            productMatch[3].replace(
              ",",
              "."
            )
          ),

        protein:
          number(
            productMatch[4].replace(
              ",",
              "."
            )
          ),

        fat:
          number(
            productMatch[5].replace(
              ",",
              "."
            )
          ),

        carb:
          number(
            productMatch[6].replace(
              ",",
              "."
            )
          )
      };
    }

    const kcalMatch =
      text.match(
        /^\+?\s*([\d.,]+)\s*(?:ккал|калорій|калорії|калорія)\s*$/i
      );

    if (kcalMatch) {
      return {
        id: createId(),

        text,

        kcal:
          number(
            kcalMatch[1].replace(
              ",",
              "."
            )
          ),

        protein: 0,

        fat: 0,

        carb: 0
      };
    }

    return {
      id: createId(),

      text,

      kcal: 0,

      protein: 0,

      fat: 0,

      carb: 0
    };
  }


  /* =========================================================
     CALCULATOR ADD
  ========================================================= */

  calcAdd?.addEventListener(
    "click",
    () => {
      const text =
        calcInput.value.trim();

      if (!text) {
        showButtonState(
          calcAdd,
          "Немає тексту",
          "error",
          1200
        );

        return;
      }

      const lines =
        text
          .split(/\r?\n/)
          .map(
            line =>
              line.trim()
          )
          .filter(Boolean);

      const parsedItems =
        lines
          .map(
            parseCalculatorLine
          )
          .filter(Boolean);

      if (!parsedItems.length) {
        showButtonState(
          calcAdd,
          "Помилка",
          "error",
          1200
        );

        return;
      }

      calculatorItems.push(
        ...parsedItems
      );

      saveCalculatorLocal();

      renderCalculator();

      calcInput.value =
        "";

      clearCalculatorDraft();

      showButtonState(
        calcAdd,
        "Додано",
        "success",
        1200
      );
    }
  );


  /* =========================================================
     CALCULATOR DRAFT AUTOSAVE
  ========================================================= */

  calcInput?.addEventListener(
    "input",
    () => {
      saveCalculatorDraft();
    }
  );


  /* =========================================================
     CLEAR CALCULATOR TEXT
  ========================================================= */

  calcClearText?.addEventListener(
    "click",
    () => {
      const confirmed =
        confirm(
          "Очистити текст у полі калькулятора?"
        );

      if (!confirmed) {
        return;
      }

      calcInput.value =
        "";

      clearCalculatorDraft();

      showButtonState(
        calcClearText,
        "Очищено",
        "error",
        1200
      );
    }
  );


  /* =========================================================
     CLEAR CALCULATOR BLOCKS
  ========================================================= */

  calcClearBlocks?.addEventListener(
    "click",
    () => {
      if (!calculatorItems.length) {
        showButtonState(
          calcClearBlocks,
          "Вже порожньо",
          "error",
          1200
        );

        return;
      }

      const confirmed =
        confirm(
          "Очистити всі блоки денного підсумку?"
        );

      if (!confirmed) {
        return;
      }

      calculatorItems =
        [];

      saveCalculatorLocal();

      renderCalculator();

      showButtonState(
        calcClearBlocks,
        "Очищено",
        "error",
        1200
      );
    }
  );


  /* =========================================================
     CALCULATOR TOTALS
  ========================================================= */

  function getTotals() {
    return calculatorItems.reduce(
      (
        total,
        item
      ) => {
        total.kcal +=
          number(item.kcal);

        total.protein +=
          number(
            item.protein
          );

        total.fat +=
          number(item.fat);

        total.carb +=
          number(item.carb);

        return total;
      },
      {
        kcal: 0,
        protein: 0,
        fat: 0,
        carb: 0
      }
    );
  }


  function renderTotals() {
    const totals =
      getTotals();

    kcalElement.textContent =
      formatNumber(
        totals.kcal
      );

    proteinElement.textContent =
      formatNumber(
        totals.protein
      );

    fatElement.textContent =
      formatNumber(
        totals.fat
      );

    carbElement.textContent =
      formatNumber(
        totals.carb
      );
  }


  /* =========================================================
     CALCULATOR LOG
  ========================================================= */

  function renderCalculatorLog() {
    if (!calcLog) return;

    calcLog.innerHTML =
      "";

    calculatorItems.forEach(
      (
        item,
        index
      ) => {
        const logItem =
          document.createElement(
            "div"
          );

        logItem.className =
          "log-item";

        logItem.innerHTML = `
          <span>
            ${escapeHTML(
              item.text
            )}
          </span>

          <button
            type="button"
            class="remove"
            data-index="${index}"
          >
            Видалити
          </button>
        `;

        const removeButton =
          logItem.querySelector(
            ".remove"
          );

        removeButton.addEventListener(
          "click",
          () => {
            calculatorItems.splice(
              index,
              1
            );

            saveCalculatorLocal();

            renderCalculator();
          }
        );

        calcLog.appendChild(
          logItem
        );
      }
    );
  }


  function renderCalculator() {
    renderTotals();

    renderCalculatorLog();
  }


  /* =========================================================
     TOTAL SUMMARY
  ========================================================= */

  function getTotalSummary() {
    const totals =
      getTotals();

    return `Денний підсумок: ${formatNumber(totals.kcal)} ккал / ${formatNumber(totals.protein)} білка / ${formatNumber(totals.fat)} жирів / ${formatNumber(totals.carb)} вуглеводів`;
  }


  /* =========================================================
     COPY TOTAL
  ========================================================= */

  copyTotal?.addEventListener(
    "click",
    async () => {
      if (!calculatorItems.length) {
        showButtonState(
          copyTotal,
          "Немає даних",
          "error",
          1200
        );

        return;
      }

      const success =
        await copyText(
          getTotalSummary()
        );

      if (success) {
        showButtonState(
          copyTotal,
          "Скопійовано",
          "success",
          1200
        );
      } else {
        showButtonState(
          copyTotal,
          "Помилка",
          "error",
          1200
        );
      }
    }
  );


  /* =========================================================
     SAVE ARCHIVE
  ========================================================= */

  saveArchive?.addEventListener(
    "click",
    () => {
      if (!calculatorItems.length) {
        showButtonState(
          saveArchive,
          "Немає даних",
          "error",
          1200
        );

        return;
      }

      const now =
        new Date();

      const item = {
        id: createId(),

        date:
          now.toISOString(),

        text:
          getTotalSummary(),

        created_at:
          now.toISOString()
      };

      archiveItems.unshift(
        item
      );

      saveArchiveLocal();

      renderArchive();

      showButtonState(
        saveArchive,
        "Збережено",
        "success",
        1200
      );
    }
  );


  /* =========================================================
     ARCHIVE RENDER
  ========================================================= */

  function formatArchiveDate(
    dateValue
  ) {
    const date =
      new Date(dateValue);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return String(
        dateValue || ""
      );
    }

    return date.toLocaleString(
      "uk-UA",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }
    );
  }


  function renderArchive() {
    if (!archiveLog) return;

    archiveLog.innerHTML =
      "";

    if (!archiveItems.length) {
      archiveLog.innerHTML = `
        <div class="log-item">
          <span>
            Архів порожній
          </span>
        </div>
      `;

      return;
    }

    archiveItems.forEach(
      item => {
        const wrapper =
          document.createElement(
            "div"
          );

        wrapper.className =
          "log-item archive-item";

        wrapper.innerHTML = `
          <div class="archive-content">

            <div>
              <strong>
                ${escapeHTML(
                  formatArchiveDate(
                    item.date
                  )
                )}
              </strong>
            </div>

            <div>
              ${escapeHTML(
                item.text
              )}
            </div>

          </div>

          <div class="archive-actions">

            <button
              type="button"
              class="edit-date"
            >
              Дата
            </button>

            <button
              type="button"
              class="edit-text"
            >
              Текст
            </button>

            <button
              type="button"
              class="remove"
            >
              Видалити
            </button>

          </div>
        `;

        const editDate =
          wrapper.querySelector(
            ".edit-date"
          );

        const editText =
          wrapper.querySelector(
            ".edit-text"
          );

        const removeButton =
          wrapper.querySelector(
            ".remove"
          );

        editDate.addEventListener(
          "click",
          () => {
            editArchiveDate(
              item,
              wrapper,
              editDate
            );
          }
        );

        editText.addEventListener(
          "click",
          () => {
            openArchiveTextModal(
              item,
              editText
            );
          }
        );

        removeButton.addEventListener(
          "click",
          () => {
            const confirmed =
              confirm(
                "Видалити цей запис з архіву?"
              );

            if (!confirmed) {
              return;
            }

            archiveItems =
              archiveItems.filter(
                archiveItem =>
                  archiveItem.id !==
                  item.id
              );

            saveArchiveLocal();

            renderArchive();
          }
        );

        archiveLog.appendChild(
          wrapper
        );
      }
    );
  }


  /* =========================================================
     ARCHIVE DATE EDIT
  ========================================================= */

  function editArchiveDate(
    item,
    wrapper,
    button
  ) {
    if (
      wrapper.querySelector(
        ".archive-date-input"
      )
    ) {
      return;
    }

    const content =
      wrapper.querySelector(
        ".archive-content"
      );

    const input =
      document.createElement(
        "input"
      );

    input.type =
      "datetime-local";

    input.className =
      "archive-date-input";

    const date =
      new Date(item.date);

    if (
      !Number.isNaN(
        date.getTime()
      )
    ) {
      const local =
        new Date(
          date.getTime() -
            date.getTimezoneOffset() *
              60000
        )
          .toISOString()
          .slice(0, 16);

      input.value =
        local;
    }

    const original =
      content.innerHTML;

    content.innerHTML =
      "";

    content.appendChild(
      input
    );

    button.textContent =
      "Зберегти";

    button.classList.add(
      "date-success"
    );

    const cancel =
      document.createElement(
        "button"
      );

    cancel.type =
      "button";

    cancel.className =
      "edit-text";

    cancel.textContent =
      "Скасувати";

    const actions =
      wrapper.querySelector(
        ".archive-actions"
      );

    actions.insertBefore(
      cancel,
      button
    );

    const save =
      () => {
        if (!input.value) {
          return;
        }

        const newDate =
          new Date(
            input.value
          );

        if (
          Number.isNaN(
            newDate.getTime()
          )
        ) {
          return;
        }

        item.date =
          newDate.toISOString();

        saveArchiveLocal();

        renderArchive();
      };

    button.onclick =
      save;

    cancel.onclick =
      () => {
        content.innerHTML =
          original;

        renderArchive();
      };

    input.focus();
  }


  /* =========================================================
     ARCHIVE TEXT MODAL
  ========================================================= */

  function openArchiveTextModal(
    item,
    button
  ) {
    archiveEditingId =
      item.id;

    archiveOriginalDate =
      item.date;

    archiveOriginalText =
      item.text;

    archiveTextInput.value =
      item.text;

    archiveTextModal.classList.add(
      "active"
    );

    clearButtonStatus(
      archiveTextSave
    );

    clearButtonStatus(
      archiveTextCancel
    );

    setTimeout(() => {
      archiveTextInput.focus();
    }, 0);
  }


  function closeArchiveTextModal() {
    archiveEditingId =
      null;

    archiveOriginalDate =
      null;

    archiveOriginalText =
      null;

    archiveTextModal.classList.remove(
      "active"
    );
  }


  archiveTextCancel?.addEventListener(
    "click",
    () => {
      showButtonState(
        archiveTextCancel,
        "Скасовано",
        "error",
        900
      );

      setTimeout(() => {
        closeArchiveTextModal();
      }, 350);
    }
  );


  archiveTextSave?.addEventListener(
    "click",
    () => {
      if (!archiveEditingId) {
        return;
      }

      const item =
        archiveItems.find(
          archiveItem =>
            archiveItem.id ===
            archiveEditingId
        );

      if (!item) {
        closeArchiveTextModal();
        return;
      }

      const newText =
        archiveTextInput.value.trim();

      if (!newText) {
        showButtonState(
          archiveTextSave,
          "Порожній текст",
          "error",
          1200
        );

        return;
      }

      item.text =
        newText;

      saveArchiveLocal();

      renderArchive();

      showButtonState(
        archiveTextSave,
        "Збережено",
        "success",
        1000
      );

      setTimeout(() => {
        closeArchiveTextModal();
      }, 300);
    }
  );


  archiveTextModal?.addEventListener(
    "click",
    event => {
      if (
        event.target ===
        archiveTextModal
      ) {
        closeArchiveTextModal();
      }
    }
  );


  /* =========================================================
     TABS
  ========================================================= */

  tabs.forEach(tab => {
    tab.addEventListener(
      "click",
      () => {
        const tabName =
          tab.dataset.tab;

        setActiveTab(
          tabName
        );
      }
    );
  });


  /* =========================================================
     ESCAPE — CLOSE MODALS
  ========================================================= */

  document.addEventListener(
    "keydown",
    event => {
      if (
        event.key !==
        "Escape"
      ) {
        return;
      }

      if (
        productModal.classList.contains(
          "active"
        )
      ) {
        closeProductModal();
      }

      if (
        addProductModal.classList.contains(
          "active"
        )
      ) {
        closeAddProductModal();
      }

      if (
        deleteProductModal.classList.contains(
          "active"
        )
      ) {
        closeDeleteProductModal();
      }

      if (
        archiveTextModal.classList.contains(
          "active"
        )
      ) {
        closeArchiveTextModal();
      }
    }
  );


  /* =========================================================
     ENTER — PRODUCT WEIGHT
  ========================================================= */

  productWeight?.addEventListener(
    "keydown",
    event => {
      if (
        event.key ===
        "Enter"
      ) {
        event.preventDefault();

        productCopy?.click();
      }
    }
  );


  /* =========================================================
     ENTER — ADD PRODUCT
  ========================================================= */

  [
    newProductName,
    newProductKcal,
    newProductProtein,
    newProductFat,
    newProductCarb
  ].forEach(input => {
    input?.addEventListener(
      "keydown",
      event => {
        if (
          event.key ===
          "Enter"
        ) {
          event.preventDefault();

          addProductSave?.click();
        }
      }
    );
  });


  /* =========================================================
     INITIAL LOAD
  ========================================================= */

  calculatorItems =
    loadCalculatorLocal();

  archiveItems =
    loadArchiveLocal();

  loadCalculatorDraft();

  loadSearchQuery();

  const savedTab =
    loadActiveTab();

  setActiveTab(
    savedTab
  );

  renderCalculator();

  renderArchive();

  initializeProducts();


  /* =========================================================
     SUPABASE AUTH LISTENER
  ========================================================= */

  if (supabaseClient) {
    supabaseClient.auth.onAuthStateChange(
      async (
        event,
        session
      ) => {
        if (
          event ===
          "SIGNED_IN"
        ) {
          const remoteProducts =
            await loadProductsFromSupabase();

          if (
            remoteProducts.length
          ) {
            products =
              mergeProducts(
                products,
                remoteProducts
              );

            saveProductsLocal();

            renderProducts(
              searchInput?.value ||
                ""
            );
          }

          await syncProductsToSupabase();
        }
      }
    );
  }

});
