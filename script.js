const menuToggle = document.getElementById("menuToggle");
const mainNav = document.getElementById("mainNav");
let currentUserEmail = null;
let currentUserRole = null;
let isAdmin = false;
let mediaFieldCounter = 0;
let sectionArticlesCache = null;
const BACKEND_HINT =
  'Сервер недоступен. Запустите "python app.py" в папке проекта и откройте сайт по адресу http://127.0.0.1:5000 (не через файл).';

if (menuToggle && mainNav) {
  menuToggle.addEventListener("click", () => {
    mainNav.classList.toggle("open");
  });
}

async function api(path, options = {}) {
  try {
    const headers = options.body instanceof FormData ? {} : { "Content-Type": "application/json" };
    const response = await fetch(path, {
      headers,
      ...options,
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Ошибка запроса");
    }
    return data;
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(BACKEND_HINT);
    }
    throw error;
  }
}

async function loadSession() {
  try {
    const me = await api("/api/me");
    currentUserEmail = me.authenticated ? me.email : null;
    currentUserRole = me.authenticated ? me.role : null;
    isAdmin = Boolean(me.authenticated && me.isAdmin);
  } catch {
    currentUserEmail = null;
    currentUserRole = null;
    isAdmin = false;
  }
}

function updateAuthUi() {
  const isAuthed = Boolean(currentUserEmail);
  document.querySelectorAll('[data-role="auth-link"]').forEach((el) => {
    el.classList.toggle("hidden", isAuthed);
  });
  document.querySelectorAll('[data-role="add-story-link"]').forEach((el) => {
    el.classList.toggle("hidden", !isAuthed);
  });
  document.querySelectorAll('[data-role="logout-btn"]').forEach((el) => {
    el.classList.toggle("hidden", !isAuthed);
  });
  const adminPanel = document.getElementById("adminArticlePanel");
  if (adminPanel) {
    adminPanel.classList.toggle("hidden", !isAdmin);
  }
}

function renderArticleCards(rootId, articles, emptyText) {
  const root = document.getElementById(rootId);
  if (!root) return;
  root.innerHTML = "";
  if (!articles.length) {
    root.innerHTML = `<article class="card"><p>${emptyText}</p></article>`;
    return;
  }
  articles.forEach((article) => {
    const card = document.createElement("article");
    card.className = "card";
    const title = document.createElement("h3");
    title.textContent = article.title;
    const content = document.createElement("p");
    content.className = "story-excerpt";
    content.textContent = buildStoryPreviewText(article);
    const meta = document.createElement("p");
    meta.className = "story-meta";
    meta.textContent = `Автор: ${article.author}`;
    const openBtn = document.createElement("a");
    openBtn.className = "btn";
    openBtn.href = `story.html?sectionArticleId=${article.id}`;
    openBtn.textContent = "Читать полностью";
    card.append(title, content, meta, openBtn);
    card.addEventListener("click", (event) => {
      if (event.target.closest("a, button, textarea, input")) return;
      window.location.href = `story.html?sectionArticleId=${article.id}`;
    });
    root.appendChild(card);
  });
}

async function renderSectionArticles() {
  const acesRoot = document.getElementById("sectionAcesList");
  const fateRoot = document.getElementById("sectionFateList");
  const forgeRoot = document.getElementById("sectionForgeList");
  if (!acesRoot && !fateRoot && !forgeRoot) return;
  try {
    const sections = await api("/api/sections");
    sectionArticlesCache = sections;
    renderArticleCards("sectionAcesList", sections.aces || [], "Пока нет статей в этом разделе.");
    renderArticleCards("sectionFateList", sections.fate || [], "Пока нет статей в этом разделе.");
    renderArticleCards("sectionForgeList", sections.forge || [], "Пока нет статей в этом разделе.");
  } catch {
    sectionArticlesCache = null;
    renderArticleCards("sectionAcesList", [], "Не удалось загрузить статьи раздела.");
    renderArticleCards("sectionFateList", [], "Не удалось загрузить статьи раздела.");
    renderArticleCards("sectionForgeList", [], "Не удалось загрузить статьи раздела.");
  }
}

async function renderUserStories() {
  const list = document.getElementById("userStoriesList");
  if (!list) return;
  let stories = [];
  try {
    stories = await api("/api/stories");
  } catch {
    list.innerHTML = '<article class="card"><p>Не удалось загрузить истории с сервера.</p></article>';
    return;
  }

  list.innerHTML = "";
  if (!stories.length) {
    list.innerHTML = '<article class="card"><p>Пока новых историй нет. Вы можете стать первым автором.</p></article>';
    return;
  }

  stories.forEach((story) => {
    const article = document.createElement("article");
    article.className = "card story-preview-card";
    const title = document.createElement("h3");
    title.textContent = story.title;

    article.appendChild(title);
    const excerpt = document.createElement("p");
    excerpt.className = "story-excerpt";
    excerpt.textContent = buildStoryPreviewText(story);
    article.appendChild(excerpt);

    const meta = document.createElement("p");
    meta.className = "story-meta";
    meta.textContent = `Автор: ${story.author}`;
    article.appendChild(meta);

    const openBtn = document.createElement("a");
    openBtn.className = "btn";
    openBtn.href = `story.html?id=${story.id}`;
    openBtn.textContent = "Читать полностью";
    article.appendChild(openBtn);

    article.addEventListener("click", (event) => {
      if (event.target.closest("a, button, textarea, input")) return;
      window.location.href = `story.html?id=${story.id}`;
    });

    list.appendChild(article);
  });
}

function buildStoryPreviewText(story) {
  const fromBlocks = Array.isArray(story.blocks)
    ? story.blocks
        .filter((block) => block.type === "text")
        .map((block) => (block.text || "").trim())
        .filter(Boolean)
        .join(" ")
    : "";
  const source = (fromBlocks || story.content || "").replace(/\s+/g, " ").trim();
  if (!source) return "Текст истории отсутствует.";
  return source.length > 220 ? `${source.slice(0, 220).trim()}...` : source;
}

function createMediaElement(mediaItem) {
  const mediaWrapper = document.createElement("div");
  mediaWrapper.className = "story-media";
  if (mediaItem.type === "video") {
    const video = document.createElement("video");
    video.src = mediaItem.url;
    video.controls = true;
    video.className = "story-video";
    mediaWrapper.appendChild(video);
  } else {
    const image = document.createElement("img");
    image.src = mediaItem.url;
    image.alt = "Медиа к истории";
    image.className = "story-image";
    mediaWrapper.appendChild(image);
  }
  return mediaWrapper;
}

function renderStoryBody(article, story) {
  const appendTextBlock = (rawText) => {
    const normalized = (rawText || "").replace(/\r\n/g, "\n").trim();
    if (!normalized) return;
    normalized.split(/\n{2,}/).forEach((chunk) => {
      const text = chunk.trim();
      if (!text) return;
      const paragraph = document.createElement("p");
      paragraph.textContent = text;
      article.appendChild(paragraph);
    });
  };

  if (Array.isArray(story.blocks) && story.blocks.length) {
    story.blocks.forEach((block) => {
      if (block.type === "text") {
        appendTextBlock(block.text || "");
        return;
      }
      if (block.type === "media" && block.url) {
        article.appendChild(createMediaElement({ type: block.mediaType, url: block.url }));
      }
    });
    return;
  }

  const mediaList = Array.isArray(story.media) ? story.media : [];
  if (!mediaList.length) {
    appendTextBlock(story.content);
    return;
  }

  const usedMediaIndexes = new Set();
  const parts = story.content.split(/(\[media\d+\])/gi);
  parts.forEach((part) => {
    const marker = part.match(/^\[media(\d+)\]$/i);
    if (marker) {
      const mediaIndex = Number(marker[1]) - 1;
      const mediaItem = mediaList[mediaIndex];
      if (mediaItem) {
        usedMediaIndexes.add(mediaIndex);
        article.appendChild(createMediaElement(mediaItem));
      }
      return;
    }
    appendTextBlock(part);
  });

  mediaList.forEach((mediaItem, index) => {
    if (!usedMediaIndexes.has(index)) {
      article.appendChild(createMediaElement(mediaItem));
    }
  });
}

function getStoryIdFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const rawId = params.get("id");
  const id = rawId ? Number(rawId) : NaN;
  return Number.isFinite(id) ? id : null;
}

function getSectionArticleIdFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const rawId = params.get("sectionArticleId");
  const id = rawId ? Number(rawId) : NaN;
  return Number.isFinite(id) ? id : null;
}

function findSectionArticleById(sectionArticleId, sectionsPayload) {
  if (!sectionsPayload || !sectionArticleId) return null;
  const pools = [sectionsPayload.aces || [], sectionsPayload.fate || [], sectionsPayload.forge || []];
  for (const list of pools) {
    const found = list.find((item) => item.id === sectionArticleId);
    if (found) return found;
  }
  return null;
}

async function renderStoryDetails() {
  const root = document.getElementById("storyDetails");
  if (!root) return;

  const storyId = getStoryIdFromQuery();
  const sectionArticleId = getSectionArticleIdFromQuery();
  if (!storyId && !sectionArticleId) {
    root.innerHTML = '<article class="card"><h3>История не найдена</h3><p>Некорректный идентификатор истории.</p></article>';
    return;
  }

  let story = null;
  let mode = "story";
  try {
    if (sectionArticleId) {
      const sections = sectionArticlesCache || (await api("/api/sections"));
      sectionArticlesCache = sections;
      story = findSectionArticleById(sectionArticleId, sections);
      mode = "section";
    } else {
      const stories = await api("/api/stories");
      story = stories.find((item) => item.id === storyId);
    }
  } catch (error) {
    root.innerHTML = `<article class="card"><h3>Ошибка</h3><p>${error.message}</p></article>`;
    return;
  }

  if (!story) {
    root.innerHTML = '<article class="card"><h3>История не найдена</h3><p>Возможно, она была удалена.</p></article>';
    return;
  }

  root.innerHTML = "";
  const article = document.createElement("article");
  article.className = "card";

  const title = document.createElement("h2");
  title.textContent = story.title;
  article.appendChild(title);

  renderStoryBody(article, story);

  const author = document.createElement("p");
  author.className = "story-meta";
  author.textContent = `Автор: ${story.author}`;
  article.appendChild(author);

  if (isAdmin && mode === "section") {
    const adminActions = document.createElement("div");
    adminActions.className = "story-actions";
    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "btn btn-light";
    editBtn.textContent = "Редактировать статью";
    editBtn.addEventListener("click", () => {
      window.location.href = `stories.html?editSectionArticleId=${story.id}`;
    });
    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "btn btn-light";
    deleteBtn.textContent = "Удалить статью";
    deleteBtn.addEventListener("click", async () => {
      if (!window.confirm("Удалить эту статью?")) return;
      try {
        await api(`/api/admin/sections/articles/${story.id}`, { method: "DELETE" });
        alert("Статья удалена.");
        window.location.href = "stories.html";
      } catch (error) {
        alert(error.message);
      }
    });
    adminActions.append(editBtn, deleteBtn);
    article.appendChild(adminActions);
  }

  const commentsTitle = document.createElement("h4");
  commentsTitle.className = "comments-title";
  commentsTitle.textContent = "Комментарии";
  article.appendChild(commentsTitle);

  const commentsList = document.createElement("div");
  commentsList.className = "comments-list";
  if (!story.comments?.length) {
    const empty = document.createElement("p");
    empty.className = "comment-empty";
    empty.textContent = "Пока нет комментариев.";
    commentsList.appendChild(empty);
  } else {
    story.comments.forEach((comment) => {
      const item = document.createElement("div");
      item.className = "comment-item";
      const text = document.createElement("p");
      text.textContent = comment.content;
      const authorName = document.createElement("small");
      authorName.textContent = comment.author;
      item.appendChild(text);
      item.appendChild(authorName);
      if (isAdmin) {
        const controls = document.createElement("div");
        controls.className = "comment-admin-actions";
        const removeBtn = document.createElement("button");
        removeBtn.type = "button";
        removeBtn.className = "btn btn-light comment-delete-btn";
        removeBtn.dataset.commentId = String(comment.id);
        removeBtn.dataset.commentType = mode;
        removeBtn.textContent = "Удалить комментарий";
        controls.appendChild(removeBtn);
        item.appendChild(controls);
      }
      commentsList.appendChild(item);
    });
  }
  article.appendChild(commentsList);

  const commentForm = document.createElement("form");
  commentForm.className = "comment-form";
  commentForm.dataset.storyId = mode === "story" ? String(story.id) : "";
  commentForm.dataset.sectionArticleId = mode === "section" ? String(story.id) : "";
  commentForm.innerHTML =
    '<textarea name="content" rows="2" placeholder="Напишите комментарий..." required></textarea>' +
    '<button type="submit" class="btn">Отправить</button>';
  article.appendChild(commentForm);

  root.appendChild(article);
}

function createTextBlock(initialText = "") {
  const wrapper = document.createElement("div");
  wrapper.className = "story-block";
  wrapper.dataset.type = "text";
  wrapper.innerHTML =
    '<p class="story-block-title">Текстовый блок</p>' +
    `<textarea rows="5" placeholder="Введите текст блока...">${initialText}</textarea>` +
    '<div class="story-block-tools"><button type="button" class="btn btn-light remove-block-btn">Удалить блок</button></div>';
  return wrapper;
}

function createMediaBlock() {
  mediaFieldCounter += 1;
  const field = `media_block_${mediaFieldCounter}`;
  const wrapper = document.createElement("div");
  wrapper.className = "story-block";
  wrapper.dataset.type = "media";
  wrapper.dataset.field = field;
  wrapper.innerHTML =
    '<p class="story-block-title">Медиа-блок</p>' +
    `<input type="file" name="${field}" accept=".jpg,.jpeg,.jfif,.png,.gif,.webp,.mp4,.webm,.mov,image/*,video/*" required>` +
    '<div class="story-block-tools"><button type="button" class="btn btn-light remove-block-btn">Удалить блок</button></div>';
  return wrapper;
}

function createExistingMediaBlock(mediaItem) {
  const wrapper = document.createElement("div");
  wrapper.className = "story-block";
  wrapper.dataset.type = "media-existing";
  wrapper.dataset.mediaId = String(mediaItem.id);
  wrapper.innerHTML =
    '<p class="story-block-title">Существующее медиа</p>' +
    `<p class="help-text">Текущее: ${mediaItem.type === "video" ? "Видео" : "Изображение"}</p>` +
    '<div class="story-block-tools"><button type="button" class="btn btn-light remove-block-btn">Удалить из статьи</button></div>';

  if (mediaItem.type === "video") {
    const video = document.createElement("video");
    video.src = mediaItem.url;
    video.controls = true;
    video.className = "story-video";
    wrapper.appendChild(video);
  } else {
    const image = document.createElement("img");
    image.src = mediaItem.url;
    image.alt = "Текущее медиа";
    image.className = "story-image";
    wrapper.appendChild(image);
  }
  return wrapper;
}

function setupStoryBuilder() {
  setupBlocksBuilder("storyBlocks", "addTextBlockBtn", "addMediaBlockBtn");
}

function setupBlocksBuilder(blocksRootId, addTextBtnId, addMediaBtnId, initialText = "") {
  const blocksRoot = document.getElementById(blocksRootId);
  const addTextBtn = document.getElementById(addTextBtnId);
  const addMediaBtn = document.getElementById(addMediaBtnId);
  if (!blocksRoot || !addTextBtn || !addMediaBtn) return;

  const removeHandler = (event) => {
    if (!event.target.classList.contains("remove-block-btn")) return;
    const block = event.target.closest(".story-block");
    if (!block) return;
    block.remove();
    if (!blocksRoot.children.length) {
      blocksRoot.appendChild(createTextBlock());
    }
  };

  blocksRoot.addEventListener("click", removeHandler);
  addTextBtn.addEventListener("click", () => {
    blocksRoot.appendChild(createTextBlock());
  });
  addMediaBtn.addEventListener("click", () => {
    blocksRoot.appendChild(createMediaBlock());
  });

  if (!blocksRoot.children.length) {
    blocksRoot.appendChild(createTextBlock(initialText));
  }
}

function collectBlocksPayload(formData, blocksRootId) {
  const blocksRoot = document.getElementById(blocksRootId);
  const blocksPayload = [];
  if (!blocksRoot) return blocksPayload;

  Array.from(blocksRoot.children).forEach((block) => {
    const blockType = block.dataset.type;
    if (blockType === "text") {
      const textValue = block.querySelector("textarea")?.value.trim() || "";
      blocksPayload.push({ type: "text", text: textValue });
      return;
    }
    if (blockType === "media") {
      const field = block.dataset.field;
      const input = block.querySelector("input[type='file']");
      if (!field || !input || !input.files?.length) return;
      formData.set(field, input.files[0]);
      blocksPayload.push({ type: "media", field });
      return;
    }
    if (blockType === "media-existing") {
      const mediaId = Number(block.dataset.mediaId || NaN);
      if (!Number.isFinite(mediaId)) return;
      blocksPayload.push({ type: "media_existing", mediaId });
    }
  });
  return blocksPayload;
}

function setupAuthForms() {
  const registerForm = document.getElementById("registerForm");
  const loginForm = document.getElementById("loginForm");
  const adminLoginForm = document.getElementById("adminLoginForm");
  const authStatus = document.getElementById("authStatus");
  if (!registerForm || !loginForm || !authStatus) return;

  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = registerForm.email.value.trim().toLowerCase();
    const password = registerForm.password.value.trim();
    try {
      const data = await api("/api/register", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      currentUserEmail = data.email;
      currentUserRole = data.role || "user";
      isAdmin = currentUserRole === "admin";
      authStatus.textContent = "Регистрация успешна. Вы вошли в систему.";
      updateAuthUi();
      registerForm.reset();
    } catch (error) {
      authStatus.textContent = error.message;
    }
  });

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = loginForm.email.value.trim().toLowerCase();
    const password = loginForm.password.value.trim();
    try {
      const data = await api("/api/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      currentUserEmail = data.email;
      currentUserRole = data.role || "user";
      isAdmin = currentUserRole === "admin";
      authStatus.textContent = "Вы успешно вошли. Можно добавлять истории.";
      updateAuthUi();
      loginForm.reset();
    } catch (error) {
      authStatus.textContent = error.message;
    }
  });

  adminLoginForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = adminLoginForm.email.value.trim().toLowerCase();
    const password = adminLoginForm.password.value.trim();
    try {
      const data = await api("/api/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      if (data.role !== "admin") {
        currentUserEmail = null;
        currentUserRole = null;
        isAdmin = false;
        await api("/api/logout", { method: "POST" });
        throw new Error("Этот аккаунт не имеет прав администратора.");
      }
      currentUserEmail = data.email;
      currentUserRole = data.role;
      isAdmin = true;
      authStatus.textContent = "Вы вошли как администратор.";
      updateAuthUi();
      adminLoginForm.reset();
    } catch (error) {
      authStatus.textContent = error.message;
    }
  });
}

function setupAdminArticleForm() {
  const form = document.getElementById("adminArticleForm");
  const status = document.getElementById("adminArticleStatus");
  const cancelEditBtn = document.getElementById("adminArticleCancelEditBtn");
  const submitBtn = document.getElementById("adminArticleSubmitBtn");
  const panelTitle = document.getElementById("adminArticlePanelTitle");
  if (!form || !status || !submitBtn || !panelTitle) return;

  setupBlocksBuilder("adminArticleBlocks", "adminAddTextBlockBtn", "adminAddMediaBlockBtn");

  const setCreateMode = () => {
    form.articleId.value = "";
    submitBtn.textContent = "Опубликовать статью";
    panelTitle.textContent = "Панель администратора: добавить статью в раздел";
    cancelEditBtn?.classList.add("hidden");
    status.textContent = `Вы вошли как администратор: ${currentUserEmail}`;
    form.title.value = "";
    form.section.value = "aces";
    const root = document.getElementById("adminArticleBlocks");
    if (root) {
      root.innerHTML = "";
      root.appendChild(createTextBlock());
    }
  };

  const setEditMode = (article) => {
    form.articleId.value = String(article.id);
    submitBtn.textContent = "Сохранить изменения";
    panelTitle.textContent = "Панель администратора: редактирование статьи";
    cancelEditBtn?.classList.remove("hidden");
    form.title.value = article.title || "";
    form.section.value = article.section || "aces";
    const root = document.getElementById("adminArticleBlocks");
    if (root) {
      root.innerHTML = "";
      const blocks = Array.isArray(article.blocks) ? [...article.blocks].sort((a, b) => (a.order || 0) - (b.order || 0)) : [];
      if (blocks.length) {
        blocks.forEach((block) => {
          if (block.type === "text") {
            root.appendChild(createTextBlock((block.text || "").trim()));
            return;
          }
          if (block.type === "media" && block.url) {
            const existingFromMediaList = Array.isArray(article.media)
              ? article.media.find((item) => item.filename === block.filename)
              : null;
            const mediaId = existingFromMediaList?.id;
            if (!mediaId) return;
            root.appendChild(
              createExistingMediaBlock({
                id: mediaId,
                type: block.mediaType || existingFromMediaList.type,
                url: block.url,
              })
            );
          }
        });
      } else {
        root.appendChild(createTextBlock(article.content === "[structured]" ? "" : article.content || ""));
      }
    }
    status.textContent = "Режим редактирования: можно оставить текущие медиа или удалить выборочно.";
  };

  const params = new URLSearchParams(window.location.search);
  const editSectionArticleId = Number(params.get("editSectionArticleId") || NaN);

  status.textContent = isAdmin
    ? `Вы вошли как администратор: ${currentUserEmail}`
    : "Только администратор может публиковать статьи в разделы.";

  if (isAdmin) {
    setCreateMode();
  }

  if (isAdmin && Number.isFinite(editSectionArticleId)) {
    const loadForEdit = async () => {
      try {
        const sections = sectionArticlesCache || (await api("/api/sections"));
        sectionArticlesCache = sections;
        const article = findSectionArticleById(editSectionArticleId, sections);
        if (!article) {
          status.textContent = "Статья для редактирования не найдена.";
          return;
        }
        setEditMode(article);
      } catch (error) {
        status.textContent = error.message;
      }
    };
    loadForEdit();
  }

  cancelEditBtn?.addEventListener("click", () => {
    setCreateMode();
    window.history.replaceState({}, "", "stories.html");
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!isAdmin) {
      status.textContent = "Нужен вход администратора.";
      return;
    }
    const articleId = form.articleId.value.trim();
    const formData = new FormData(form);
    formData.set("section", form.section.value);
    formData.set("title", form.title.value.trim());
    formData.set("content", "");
    const blocksPayload = collectBlocksPayload(formData, "adminArticleBlocks");
    formData.set("blocks", JSON.stringify(blocksPayload));

    try {
      await api(articleId ? `/api/admin/sections/articles/${articleId}` : "/api/admin/sections/articles", {
        method: articleId ? "PUT" : "POST",
        body: formData,
      });
      status.textContent = articleId ? "Статья обновлена." : "Статья опубликована.";
      setCreateMode();
      window.history.replaceState({}, "", "stories.html");
      await renderSectionArticles();
    } catch (error) {
      status.textContent = error.message;
    }
  });
}

function setupAddStoryForm() {
  const form = document.getElementById("addStoryForm");
  const status = document.getElementById("storyAccessStatus");
  if (!form || !status) return;

  if (!currentUserEmail) {
    status.textContent = "Сначала войдите в аккаунт на странице авторизации.";
    form.classList.add("hidden");
    return;
  }

  status.textContent = `Вы вошли как: ${currentUserEmail}`;
  form.classList.remove("hidden");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const title = form.title.value.trim();
    formData.set("title", title);
    formData.set("content", "");
    const blocksPayload = collectBlocksPayload(formData, "storyBlocks");
    formData.set("blocks", JSON.stringify(blocksPayload));

    try {
      await api("/api/stories", {
        method: "POST",
        body: formData,
      });
      form.reset();
      alert("История опубликована. Она уже доступна в разделе \"Истории\".");
      window.location.href = "stories.html";
    } catch (error) {
      alert(error.message);
    }
  });
}

function setupDefaultForms() {
  document
    .querySelectorAll("form:not(#registerForm):not(#loginForm):not(#adminLoginForm):not(#addStoryForm):not(#adminArticleForm)")
    .forEach((form) => {
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        alert("Спасибо! Ваша форма отправлена.");
        form.reset();
      });
    });
}

function setupComments() {
  document.querySelectorAll(".comment-delete-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!isAdmin) {
        alert("Удалять комментарии может только администратор.");
        return;
      }
      const commentId = button.dataset.commentId;
      const commentType = button.dataset.commentType || "story";
      if (!commentId) return;
      if (!window.confirm("Удалить этот комментарий?")) return;
      try {
        await api(
          commentType === "section"
            ? `/api/admin/sections/comments/${commentId}`
            : `/api/admin/comments/${commentId}`,
          { method: "DELETE" }
        );
        await renderStoryDetails();
        setupComments();
        setupImagePreview();
      } catch (error) {
        alert(error.message);
      }
    });
  });

  document.querySelectorAll(".comment-form").forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!currentUserEmail) {
        alert("Чтобы комментировать, войдите в аккаунт.");
        window.location.href = "login.html";
        return;
      }
      const storyId = form.dataset.storyId;
      const sectionArticleId = form.dataset.sectionArticleId;
      const contentField = form.querySelector('textarea[name="content"]');
      const content = contentField.value.trim();
      try {
        const endpoint = sectionArticleId
          ? `/api/sections/articles/${sectionArticleId}/comments`
          : `/api/stories/${storyId}/comments`;
        await api(endpoint, {
          method: "POST",
          body: JSON.stringify({ content }),
        });
        contentField.value = "";
        await renderUserStories();
        await renderStoryDetails();
        setupComments();
        setupImagePreview();
      } catch (error) {
        alert(error.message);
      }
    });
  });
}

function ensureMediaModal() {
  if (document.getElementById("mediaModal")) return;
  const modal = document.createElement("div");
  modal.id = "mediaModal";
  modal.className = "media-modal hidden";
  modal.innerHTML =
    '<div class="media-modal-content">' +
    '<button type="button" class="media-modal-close" id="mediaModalClose">Закрыть</button>' +
    '<img id="mediaModalImage" alt="Увеличенное изображение">' +
    "</div>";
  document.body.appendChild(modal);

  const close = () => modal.classList.add("hidden");
  modal.addEventListener("click", (event) => {
    if (event.target === modal) close();
  });
  document.getElementById("mediaModalClose")?.addEventListener("click", close);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") close();
  });
}

function setupImagePreview() {
  ensureMediaModal();
  const modal = document.getElementById("mediaModal");
  const modalImg = document.getElementById("mediaModalImage");
  if (!modal || !modalImg) return;

  document.querySelectorAll(".story-image").forEach((img) => {
    img.addEventListener("click", () => {
      modalImg.src = img.src;
      modal.classList.remove("hidden");
    });
  });
}

function setupStoriesTabs() {
  const tabsRoot = document.querySelector('[data-role="stories-tabs"]');
  if (!tabsRoot) return;
  const buttons = Array.from(tabsRoot.querySelectorAll("[data-tab]"));
  const panels = Array.from(document.querySelectorAll("[data-panel]"));
  if (!buttons.length || !panels.length) return;

  const activate = (tabId) => {
    buttons.forEach((btn) => btn.classList.toggle("active", btn.dataset.tab === tabId));
    panels.forEach((panel) => panel.classList.toggle("hidden", panel.dataset.panel !== tabId));
    if (tabId === "yours") {
      renderUserStories();
    }
  };

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => activate(btn.dataset.tab));
  });

  activate("aces");
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

async function shareLink(kind) {
  const url = window.location.origin;
  const copied = await copyToClipboard(url);
  if (!copied) {
    window.prompt("Скопируйте ссылку на сайт:", url);
  }

  if (kind === "tg") {
    window.location.href = `https://t.me/share/url?url=${encodeURIComponent(url)}`;
    return;
  }
  if (kind === "vk") {
    window.location.href = `https://vk.com/share.php?url=${encodeURIComponent(url)}`;
  }
}

function setupShareButtons() {
  const tgBtn = document.querySelector('[data-role="share-tg"]');
  const vkBtn = document.querySelector('[data-role="share-vk"]');
  tgBtn?.addEventListener("click", () => shareLink("tg"));
  vkBtn?.addEventListener("click", () => shareLink("vk"));
}

document.querySelectorAll('[data-role="logout-btn"]').forEach((button) => {
  button.addEventListener("click", async () => {
    try {
      await api("/api/logout", { method: "POST" });
      currentUserEmail = null;
      currentUserRole = null;
      isAdmin = false;
      updateAuthUi();
      alert("Вы вышли из аккаунта.");
    } catch (error) {
      alert(error.message);
    }
  });
});

async function bootstrap() {
  if (window.location.protocol === "file:") {
    const authStatus = document.getElementById("authStatus");
    const storyAccessStatus = document.getElementById("storyAccessStatus");
    if (authStatus) authStatus.textContent = BACKEND_HINT;
    if (storyAccessStatus) storyAccessStatus.textContent = BACKEND_HINT;
  }

  await loadSession();
  updateAuthUi();
  await renderSectionArticles();
  await renderUserStories();
  await renderStoryDetails();
  setupComments();
  setupImagePreview();
  setupStoriesTabs();
  setupShareButtons();
  setupAuthForms();
  setupAdminArticleForm();
  setupAddStoryForm();
  setupStoryBuilder();
  setupDefaultForms();
}

bootstrap();
