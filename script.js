const menuToggle = document.getElementById("menuToggle");
const mainNav = document.getElementById("mainNav");
let currentUserEmail = null;
let mediaFieldCounter = 0;
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
  } catch {
    currentUserEmail = null;
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

async function renderStoryDetails() {
  const root = document.getElementById("storyDetails");
  if (!root) return;

  const storyId = getStoryIdFromQuery();
  if (!storyId) {
    root.innerHTML = '<article class="card"><h3>История не найдена</h3><p>Некорректный идентификатор истории.</p></article>';
    return;
  }

  let stories = [];
  try {
    stories = await api("/api/stories");
  } catch (error) {
    root.innerHTML = `<article class="card"><h3>Ошибка</h3><p>${error.message}</p></article>`;
    return;
  }

  const story = stories.find((item) => item.id === storyId);
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
      commentsList.appendChild(item);
    });
  }
  article.appendChild(commentsList);

  const commentForm = document.createElement("form");
  commentForm.className = "comment-form";
  commentForm.dataset.storyId = String(story.id);
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

function setupStoryBuilder() {
  const blocksRoot = document.getElementById("storyBlocks");
  const addTextBtn = document.getElementById("addTextBlockBtn");
  const addMediaBtn = document.getElementById("addMediaBlockBtn");
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
    blocksRoot.appendChild(createTextBlock());
  }
}

function setupAuthForms() {
  const registerForm = document.getElementById("registerForm");
  const loginForm = document.getElementById("loginForm");
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
      authStatus.textContent = "Вы успешно вошли. Можно добавлять истории.";
      updateAuthUi();
      loginForm.reset();
    } catch (error) {
      authStatus.textContent = error.message;
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

    const blocksRoot = document.getElementById("storyBlocks");
    const blocksPayload = [];
    if (blocksRoot) {
      Array.from(blocksRoot.children).forEach((block) => {
        const blockType = block.dataset.type;
        if (blockType === "text") {
          const textValue = block.querySelector("textarea")?.value.trim() || "";
          blocksPayload.push({ type: "text", text: textValue });
        } else if (blockType === "media") {
          const field = block.dataset.field;
          const input = block.querySelector("input[type='file']");
          if (!field || !input || !input.files?.length) return;
          formData.set(field, input.files[0]);
          blocksPayload.push({ type: "media", field });
        }
      });
    }
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
    .querySelectorAll("form:not(#registerForm):not(#loginForm):not(#addStoryForm)")
    .forEach((form) => {
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        alert("Спасибо! Ваша форма отправлена.");
        form.reset();
      });
    });
}

function setupComments() {
  document.querySelectorAll(".comment-form").forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!currentUserEmail) {
        alert("Чтобы комментировать, войдите в аккаунт.");
        window.location.href = "login.html";
        return;
      }
      const storyId = form.dataset.storyId;
      const contentField = form.querySelector('textarea[name="content"]');
      const content = contentField.value.trim();
      try {
        await api(`/api/stories/${storyId}/comments`, {
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
  await renderUserStories();
  await renderStoryDetails();
  setupComments();
  setupImagePreview();
  setupStoriesTabs();
  setupShareButtons();
  setupAuthForms();
  setupAddStoryForm();
  setupStoryBuilder();
  setupDefaultForms();
}

bootstrap();
