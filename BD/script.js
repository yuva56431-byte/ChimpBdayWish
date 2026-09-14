(function () {
  const button = document.getElementById("openSurprise");
  const giftBox = document.getElementById("giftBox");
  const giftSparkles = document.getElementById("giftSparkles");
  const status = document.getElementById("surpriseStatus");
  const welcomeSection = document.getElementById("welcomeSection");
  const wishSection = document.getElementById("wishSection");
  const memorySection = document.getElementById("memorySection");
  const admireSection = document.getElementById("admireSection");
  const surpriseSection = document.getElementById("surpriseSection");
  const letterSection = document.getElementById("letterSection");
  const finaleSection = document.getElementById("finaleSection");
  const proposalSection = document.getElementById("proposalSection");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pages = [welcomeSection, wishSection, memorySection, admireSection,
    surpriseSection, letterSection, finaleSection, proposalSection];
  const pageBackButton = document.getElementById("pageBackButton");
  let currentPageIndex = 0;

  function showPage(section, focus = true) {
    const nextIndex = pages.indexOf(section);
    if (nextIndex < 0) return;

    pages.forEach((page, index) => {
      page.classList.toggle("is-current-page", index === nextIndex);
      page.classList.remove("is-transitioning", "is-fading-out", "is-turning-page",
        "is-flipping-page", "is-swirling-away", "is-opening-letter", "is-final-transition",
        "is-proposal-transition");
      if (index !== nextIndex) page.setAttribute("aria-hidden", "true");
      else page.removeAttribute("aria-hidden");
    });
    currentPageIndex = nextIndex;
    pageBackButton.hidden = nextIndex === 0;
    section.scrollTop = 0;
    if (focus && nextIndex > 0) section.focus({ preventScroll: true });
  }

  pageBackButton.addEventListener("click", () => {
    if (currentPageIndex > 0) {
      showPage(pages[currentPageIndex - 1]);
      if (currentPageIndex === 0) {
        button.disabled = false;
        button.removeAttribute("aria-disabled");
        button.textContent = "Open Your Surprise";
        giftBox.classList.remove("is-open");
        status.textContent = "";
      }
    }
  });
  showPage(welcomeSection, false);
  document.body.classList.add("page-mode");

  const sparklePoints = [
    [-72, -94],
    [-42, -122],
    [-12, -104],
    [24, -132],
    [58, -98],
    [86, -118],
    [-92, -62],
    [92, -68],
  ];

  const confettiPoints = [
    [-112, -94, "#c9b6ff"],
    [-82, -140, "#fff9fc"],
    [-52, -110, "#c88673"],
    [-18, -154, "#f8d7e8"],
    [22, -128, "#c9b6ff"],
    [56, -160, "#fff9fc"],
    [92, -112, "#c88673"],
    [122, -86, "#f8d7e8"],
    [-34, -78, "#b86b8e"],
    [38, -82, "#b86b8e"],
  ];

  function createParticle(className, x, y, index, color) {
    const particle = document.createElement("span");
    particle.className = className;
    particle.style.setProperty("--x", `${x}px`);
    particle.style.setProperty("--y", `${y}px`);
    particle.style.animationDelay = `${index * 28}ms`;

    if (className === "confetti-piece") {
      particle.style.setProperty("--confetti-color", color);
      particle.style.setProperty("--rotation", `${160 + index * 37}deg`);
    }

    giftSparkles.appendChild(particle);
    particle.addEventListener("animationend", () => particle.remove(), { once: true });
  }

  function burstSparkles() {
    sparklePoints.forEach(([x, y], index) => {
      createParticle("gift-particle", x, y, index);
    });

    confettiPoints.forEach(([x, y, color], index) => {
      createParticle("confetti-piece", x, y, index, color);
    });
  }

  window.goToNextPage = function goToNextPage() {
    welcomeSection.classList.add("is-transitioning");

    window.setTimeout(
      () => {
        welcomeSection.classList.add("is-fading-out");
        wishSection.classList.add("is-active");
        showPage(wishSection);
      },
      reduceMotion ? 20 : 240
    );

    window.setTimeout(
      () => {
        wishSection.focus({ preventScroll: true });
        window.dispatchEvent(new CustomEvent("birthday-surprise-ready"));
      },
      reduceMotion ? 80 : 760
    );
  };

  function openGift() {
    if (giftBox.classList.contains("is-open")) {
      return;
    }

    button.disabled = true;
    button.setAttribute("aria-disabled", "true");
    button.textContent = "Opening...";
    giftBox.classList.add("is-open");
    status.textContent = "Your birthday surprise is opening.";

    if (!reduceMotion) {
      burstSparkles();
    }

    window.setTimeout(
      () => {
        button.textContent = "Surprise Ready";
        status.textContent = "Your birthday surprise is ready.";
        window.goToNextPage();
      },
      reduceMotion ? 120 : 780
    );
  }

  button.addEventListener("click", openGift);

  if ("IntersectionObserver" in window) {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            wishSection.classList.add("is-active");
          }
        });
      },
      { threshold: 0.35 }
    );

    sectionObserver.observe(wishSection);
  }

  // ===== WISH BOWL LOGIC =====
  const wishBowlButton = document.getElementById("wishBowlButton");
  const wishCounter = document.getElementById("wishCounter");
  const wishCard = document.getElementById("wishCard");
  const wishName = document.getElementById("wishName");
  const wishMessage = document.getElementById("wishMessage");
  const wishComplete = document.getElementById("wishComplete");
  const resetBowl = document.getElementById("resetBowl");
  const continueToGallery = document.getElementById("continueToGallery");
  const skipWishes = document.getElementById("skipWishes");

  const publishedWishesUrl =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vS7Twn036xXZ3pzwHPQR1OadA3OTktmpCMdYn8KDpOppoBshGm4xlc9MEw_ATVb33DWViH-OE7mg6tk/pub?output=csv";
  let wishes = [];

  function parseCsv(csv) {
    const rows = [];
    let row = [];
    let field = "";
    let quoted = false;

    for (let index = 0; index < csv.length; index += 1) {
      const char = csv[index];
      if (char === '"') {
        if (quoted && csv[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          quoted = !quoted;
        }
      } else if (char === "," && !quoted) {
        row.push(field);
        field = "";
      } else if ((char === "\n" || char === "\r") && !quoted) {
        if (char === "\r" && csv[index + 1] === "\n") index += 1;
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
      } else {
        field += char;
      }
    }

    if (field || row.length) {
      row.push(field);
      rows.push(row);
    }
    return rows;
  }

  async function loadWishes() {
    wishBowlButton.disabled = true;
    wishCounter.textContent = "Loading wishes...";

    if (window.location.protocol === "file:") {
      if (!Array.isArray(window.BIRTHDAY_WISHES)) {
        wishCounter.textContent = "Run Start Birthday.bat to download the wishes.";
        return;
      }
      wishes = window.BIRTHDAY_WISHES.filter((wish) => wish.name && wish.message);
      updateCounter();
      wishBowlButton.disabled = wishes.length === 0;
      return;
    }

    try {
      const sheetUrl = new URL(publishedWishesUrl);
      sheetUrl.searchParams.set("refresh", Date.now().toString());
      const response = await fetch(sheetUrl, { cache: "no-store" });
      if (!response.ok) throw new Error(`Sheet returned ${response.status}`);

      const rows = parseCsv(await response.text());
      const headers = (rows.shift() || []).map((header) => header.trim().replace(/^\uFEFF/, "").toLowerCase());
      const nameColumn = headers.indexOf("your name");
      const wishColumn = headers.indexOf("your wish");
      if (nameColumn < 0 || wishColumn < 0) throw new Error("Wish columns are missing");

      wishes = rows.map((row) => ({
        name: (row[nameColumn] || "").trim(),
        message: (row[wishColumn] || "").trim(),
      })).filter((wish) => wish.name && wish.message);
      updateCounter();
      wishBowlButton.disabled = wishes.length === 0;
    } catch (error) {
      console.error("Could not load birthday wishes:", error);
      wishCounter.textContent = "Could not load live wishes. Check your connection and refresh.";
    }
  }

  let openedWishIndexes = [];
  let isOpeningWish = false;

  function updateCounter() {
    const remaining = wishes.length - openedWishIndexes.length;

    if (wishes.length === 0) {
      wishCounter.textContent = "No wishes have been added yet.";
      return;
    }

    if (openedWishIndexes.length === 0) {
      wishCounter.textContent = `${wishes.length} ${wishes.length === 1 ? "Wish" : "Wishes"} Waiting For You`;
      return;
    }

    wishCounter.textContent = `${remaining} ${remaining === 1 ? "Wish" : "Wishes"} Remaining`;
  }

  function getRandomUnopenedWishIndex() {
    const unopenedIndexes = wishes
      .map((wish, index) => index)
      .filter((index) => !openedWishIndexes.includes(index));
    const randomIndex = Math.floor(Math.random() * unopenedIndexes.length);

    return unopenedIndexes[randomIndex];
  }

  function createRisingNote() {
    const risingNote = document.createElement("span");
    risingNote.className = "rising-note";
    wishBowlButton.appendChild(risingNote);
    risingNote.addEventListener("animationend", () => risingNote.remove(), {
      once: true,
    });
  }

  function revealWish(wish) {
    wishName.textContent = wish.name;
    wishMessage.textContent = wish.message;
    wishCard.hidden = false;
    wishCard.classList.remove("is-visible");
    void wishCard.offsetWidth;
    wishCard.classList.add("is-visible");
  }

  function showCompleteState() {
    wishComplete.hidden = false;
    skipWishes.hidden = true;
    wishBowlButton.disabled = true;
    wishBowlButton.setAttribute("aria-disabled", "true");
  }

  function goToMemoryGallery() {
    wishSection.classList.add("is-turning-page");

    window.setTimeout(
      () => {
        memorySection.classList.add("is-entering");
        showPage(memorySection);
      },
      reduceMotion ? 20 : 180
    );

    window.setTimeout(
      () => {
        memorySection.focus({ preventScroll: true });
      },
      reduceMotion ? 80 : 920
    );
  }

  function openRandomWish() {
    if (isOpeningWish || openedWishIndexes.length === wishes.length) {
      return;
    }

    isOpeningWish = true;
    wishBowlButton.disabled = true;
    wishBowlButton.classList.add("is-opening");

    if (!reduceMotion) {
      createRisingNote();
    }

    const wishIndex = getRandomUnopenedWishIndex();
    const selectedWish = wishes[wishIndex];
    openedWishIndexes.push(wishIndex);

    window.setTimeout(
      () => {
        revealWish(selectedWish);
        updateCounter();

        if (openedWishIndexes.length === wishes.length) {
          showCompleteState();
        } else {
          wishBowlButton.disabled = false;
          wishBowlButton.removeAttribute("aria-disabled");
        }

        wishBowlButton.classList.remove("is-opening");
        isOpeningWish = false;
      },
      reduceMotion ? 80 : 720
    );
  }

  function addButtonRipple(event) {
    if (reduceMotion) {
      return;
    }

    const ripple = document.createElement("span");
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    ripple.className = "button-ripple";
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    event.currentTarget.appendChild(ripple);
    ripple.addEventListener("animationend", () => ripple.remove(), { once: true });
  }

  function resetWishBowl(event) {
    openedWishIndexes = [];
    isOpeningWish = false;
    wishCard.hidden = true;
    wishCard.classList.remove("is-visible");
    wishComplete.hidden = true;
    skipWishes.hidden = false;
    wishBowlButton.disabled = false;
    wishBowlButton.removeAttribute("aria-disabled");
    wishBowlButton.classList.remove("is-opening");
    updateCounter();
    wishBowlButton.focus({ preventScroll: true });
  }

  wishBowlButton.addEventListener("click", openRandomWish);
  resetBowl.addEventListener("click", resetWishBowl);
  resetBowl.addEventListener("pointerdown", addButtonRipple);
  continueToGallery.addEventListener("click", goToMemoryGallery);
  continueToGallery.addEventListener("pointerdown", addButtonRipple);
  skipWishes.addEventListener("click", goToMemoryGallery);
  skipWishes.addEventListener("pointerdown", addButtonRipple);
  loadWishes();

  // ===== MEMORY GALLERY LOGIC =====
  const memoryCards = Array.from(document.querySelectorAll(".memory-card"));
  const memoryButtons = Array.from(document.querySelectorAll(".memory-photo-button"));
  const memoryProgress = document.getElementById("memoryProgress");
  const lightbox = document.getElementById("memoryLightbox");
  const lightboxImage = document.getElementById("lightboxImage");
  const lightboxVideo = document.getElementById("lightboxVideo");
  const lightboxTitle = document.getElementById("lightboxTitle");
  const lightboxCaption = document.getElementById("lightboxCaption");
  const lightboxDate = document.getElementById("lightboxDate");
  const lightboxProgress = document.getElementById("lightboxProgress");
  const lightboxClose = document.getElementById("lightboxClose");
  const lightboxPrev = document.getElementById("lightboxPrev");
  const lightboxNext = document.getElementById("lightboxNext");
  const journeyButton = document.getElementById("journeyButton");
  let currentMemoryIndex = 0;
  let previousFocus = null;
  let touchStartX = 0;

  const memories = memoryCards.map((card) => {
    const image = card.querySelector("img");
    const video = card.querySelector("video");
    const title = card.querySelector("h3");
    const caption = card.querySelector("p");
    const date = card.querySelector("time");

    return {
      image: image ? image.currentSrc || image.src : null,
      video: video ? video.currentSrc || video.src : null,
      alt: image ? image.alt : title.textContent,
      title: title.textContent,
      caption: caption.textContent,
      date: date.textContent,
      datetime: date.getAttribute("datetime"),
    };
  });

  memoryCards.forEach((card) => {
    const preview = card.querySelector("video");
    if (preview) {
      const showPreviewFrame = () => {
        if (Number.isFinite(preview.duration) && preview.duration > 0) {
          preview.currentTime = Math.min(0.1, preview.duration / 2);
        }
      };
      if (preview.readyState >= 1) showPreviewFrame();
      else preview.addEventListener("loadedmetadata", showPreviewFrame, { once: true });
    }
  });

  function createAdmirePetals() {
    if (reduceMotion) {
      return;
    }

    const petals = [
      [-180, -130, "160deg"],
      [-126, -184, "220deg"],
      [-68, -142, "280deg"],
      [8, -196, "340deg"],
      [74, -152, "410deg"],
      [138, -188, "470deg"],
      [188, -124, "540deg"],
      [-26, -238, "300deg"],
    ];

    petals.forEach(([x, y, rotation], index) => {
      const petal = document.createElement("span");
      petal.className = "celebration-petal";
      petal.style.setProperty("--x", `${x}px`);
      petal.style.setProperty("--y", `${y}px`);
      petal.style.setProperty("--rotation", rotation);
      petal.style.animationDelay = `${index * 45}ms`;
      admireSection.appendChild(petal);
      petal.addEventListener("animationend", () => petal.remove(), { once: true });
    });
  }

  window.goToAdmireSection = function goToAdmireSection() {
    memorySection.classList.add("is-flipping-page");
    createAdmirePetals();

    window.setTimeout(
      () => {
        admireSection.classList.add("is-entering");
        showPage(admireSection);
      },
      reduceMotion ? 20 : 160
    );

    window.setTimeout(
      () => {
        admireSection.focus({ preventScroll: true });
      },
      reduceMotion ? 80 : 920
    );
  };

  function updateMemoryProgress(index) {
    const progressText = `Memory ${index + 1} / ${memories.length}`;
    memoryProgress.textContent = progressText;
    lightboxProgress.textContent = progressText;
  }

  function renderLightbox(index) {
    const memory = memories[index];
    lightboxVideo.pause();
    lightboxVideo.removeAttribute("src");
    lightboxVideo.load();
    currentMemoryIndex = index;
    lightboxImage.hidden = Boolean(memory.video);
    lightboxVideo.hidden = !memory.video;
    if (memory.video) {
      lightboxImage.removeAttribute("src");
      lightboxVideo.src = memory.video;
    } else {
      lightboxImage.src = memory.image;
      lightboxImage.alt = memory.alt;
    }
    lightboxTitle.textContent = memory.title;
    lightboxCaption.textContent = memory.caption;
    lightboxDate.textContent = memory.date;
    lightboxDate.setAttribute("datetime", memory.datetime);
    updateMemoryProgress(index);
  }

  function openLightbox(index, trigger) {
    previousFocus = trigger;
    renderLightbox(index);
    lightbox.hidden = false;
    if (memories[index].video) lightboxVideo.play().catch(() => {});
    document.body.classList.add("is-lightbox-open");
    requestAnimationFrame(() => {
      lightbox.classList.add("is-open");
      lightboxClose.focus({ preventScroll: true });
    });
  }

  function closeLightbox() {
    lightboxVideo.pause();
    lightbox.classList.remove("is-open");
    lightbox.hidden = true;
    document.body.classList.remove("is-lightbox-open");

    if (previousFocus) {
      previousFocus.focus({ preventScroll: true });
    }
  }

  function showMemory(direction) {
    const nextIndex = (currentMemoryIndex + direction + memories.length) % memories.length;
    renderLightbox(nextIndex);
    if (memories[nextIndex].video) lightboxVideo.play().catch(() => {});
  }

  function handleLightboxKeydown(event) {
    if (lightbox.hidden) {
      return;
    }

    if (event.key === "Tab") {
      const focusableElements = Array.from(
        lightbox.querySelectorAll("button, [href], [tabindex]:not([tabindex='-1'])")
      ).filter((element) => !element.disabled);
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    if (event.key === "Escape") {
      closeLightbox();
    }

    if (event.key === "ArrowLeft") {
      showMemory(-1);
    }

    if (event.key === "ArrowRight") {
      showMemory(1);
    }
  }

  function handleTouchStart(event) {
    touchStartX = event.changedTouches[0].clientX;
  }

  function handleTouchEnd(event) {
    const touchEndX = event.changedTouches[0].clientX;
    const swipeDistance = touchEndX - touchStartX;

    if (Math.abs(swipeDistance) < 45) {
      return;
    }

    showMemory(swipeDistance > 0 ? -1 : 1);
  }

  memoryCards.forEach((card) => card.classList.add("is-visible"));

  memoryButtons.forEach((memoryButton, index) => {
    memoryButton.addEventListener("click", () => openLightbox(index, memoryButton));
  });

  lightboxClose.addEventListener("click", closeLightbox);
  lightboxPrev.addEventListener("click", () => showMemory(-1));
  lightboxNext.addEventListener("click", () => showMemory(1));
  lightbox.addEventListener("touchstart", handleTouchStart, { passive: true });
  lightbox.addEventListener("touchend", handleTouchEnd);
  document.addEventListener("keydown", handleLightboxKeydown);
  journeyButton.addEventListener("click", window.goToAdmireSection);
  journeyButton.addEventListener("pointerdown", addButtonRipple);
  updateMemoryProgress(0);

  // ===== COMPLIMENT CARD LOGIC =====
  const complimentCards = Array.from(document.querySelectorAll(".compliment-card"));
  const complimentCounter = document.getElementById("complimentCounter");
  const complimentComplete = document.getElementById("complimentComplete");
  const surpriseSectionButton = document.getElementById("surpriseSectionButton");
  const openedCompliments = new Set();

  function createSurpriseTransitionPetals() {
    if (reduceMotion) {
      return;
    }

    const petals = [
      [-210, -110, "180deg"],
      [-152, -176, "250deg"],
      [-84, -132, "320deg"],
      [-10, -212, "390deg"],
      [64, -146, "450deg"],
      [132, -190, "520deg"],
      [198, -118, "600deg"],
      [28, -246, "670deg"],
    ];

    petals.forEach(([x, y, rotation], index) => {
      const petal = document.createElement("span");
      petal.className = "celebration-petal";
      petal.style.setProperty("--x", `${x}px`);
      petal.style.setProperty("--y", `${y}px`);
      petal.style.setProperty("--rotation", rotation);
      petal.style.animationDelay = `${index * 42}ms`;
      surpriseSection.appendChild(petal);
      petal.addEventListener("animationend", () => petal.remove(), { once: true });
    });
  }

  window.goToSurpriseSection = function goToSurpriseSection() {
    admireSection.classList.add("is-swirling-away");
    createSurpriseTransitionPetals();

    window.setTimeout(
      () => {
        surpriseSection.classList.add("is-entering");
        showPage(surpriseSection);
      },
      reduceMotion ? 20 : 160
    );

    window.setTimeout(
      () => {
        surpriseSection.focus({ preventScroll: true });
        window.dispatchEvent(new CustomEvent("birthday-final-surprise-ready"));
      },
      reduceMotion ? 80 : 940
    );
  };

  function updateComplimentCounter() {
    complimentCounter.textContent = `${openedCompliments.size} of ${complimentCards.length} little compliments discovered`;
  }

  function createComplimentCelebration() {
    if (reduceMotion) {
      return;
    }

    const petals = [
      [-170, -120, "140deg"],
      [-112, -170, "210deg"],
      [-52, -140, "270deg"],
      [0, -190, "330deg"],
      [58, -144, "390deg"],
      [116, -172, "460deg"],
      [172, -118, "520deg"],
      [26, -230, "610deg"],
      [-88, -220, "300deg"],
      [96, -224, "430deg"],
    ];

    petals.forEach(([x, y, rotation], index) => {
      const petal = document.createElement("span");
      petal.className = "celebration-petal";
      petal.style.setProperty("--x", `${x}px`);
      petal.style.setProperty("--y", `${y}px`);
      petal.style.setProperty("--rotation", rotation);
      petal.style.animationDelay = `${index * 38}ms`;
      admireSection.appendChild(petal);
      petal.addEventListener("animationend", () => petal.remove(), { once: true });
    });
  }

  function revealCompliment(card) {
    const complimentIndex = Number(card.dataset.complimentIndex);

    complimentCards.forEach((otherCard) => otherCard.classList.remove("is-selected"));
    card.classList.add("is-selected");

    if (openedCompliments.has(complimentIndex)) {
      return;
    }

    openedCompliments.add(complimentIndex);
    card.classList.add("is-open");
    card.setAttribute("aria-pressed", "true");
    updateComplimentCounter();

    if (openedCompliments.size === complimentCards.length) {
      complimentComplete.hidden = false;
      createComplimentCelebration();
    }
  }

  complimentCards.forEach((card) => {
    card.setAttribute("aria-pressed", "false");
    card.addEventListener("click", () => revealCompliment(card));
  });

  surpriseSectionButton.addEventListener("click", window.goToSurpriseSection);
  surpriseSectionButton.addEventListener("pointerdown", addButtonRipple);
  updateComplimentCounter();

  // ===== SURPRISE DISCOVERY LOGIC =====
  const surpriseObjects = Array.from(document.querySelectorAll(".surprise-object"));
  const surpriseCounter = document.getElementById("surpriseCounter");
  const surpriseComplete = document.getElementById("surpriseComplete");
  const goldenSecretStar = document.getElementById("goldenSecretStar");
  const letterSectionButton = document.getElementById("letterSectionButton");
  const discoveredSurprises = new Set();
  let goldenStarFound = false;

  function createLetterTransitionPetals() {
    if (reduceMotion) {
      return;
    }

    const petals = [
      [-190, -124, "160deg"],
      [-138, -184, "230deg"],
      [-72, -148, "300deg"],
      [0, -218, "360deg"],
      [72, -150, "430deg"],
      [138, -188, "500deg"],
      [198, -126, "580deg"],
      [26, -252, "650deg"],
    ];

    petals.forEach(([x, y, rotation], index) => {
      const petal = document.createElement("span");
      petal.className = "celebration-petal";
      petal.style.setProperty("--x", `${x}px`);
      petal.style.setProperty("--y", `${y}px`);
      petal.style.setProperty("--rotation", rotation);
      petal.style.animationDelay = `${index * 42}ms`;
      letterSection.appendChild(petal);
      petal.addEventListener("animationend", () => petal.remove(), { once: true });
    });
  }

  window.goToLetterSection = function goToLetterSection() {
    surpriseSection.classList.add("is-opening-letter");
    createLetterTransitionPetals();

    window.setTimeout(
      () => {
        letterSection.classList.add("is-entering");
        showPage(letterSection);
      },
      reduceMotion ? 20 : 160
    );

    window.setTimeout(
      () => {
        letterSection.focus({ preventScroll: true });
        window.dispatchEvent(new CustomEvent("birthday-letter-ready"));
      },
      reduceMotion ? 80 : 940
    );
  };

  function updateSurpriseCounter() {
    surpriseCounter.textContent = `${discoveredSurprises.size} of ${surpriseObjects.length} surprises discovered`;
  }

  function createPetalCelebration(targetSection) {
    if (reduceMotion) {
      return;
    }

    const petals = [
      [-184, -118, "170deg"],
      [-126, -174, "230deg"],
      [-62, -136, "300deg"],
      [0, -204, "360deg"],
      [66, -142, "420deg"],
      [128, -176, "500deg"],
      [188, -122, "570deg"],
      [-24, -244, "640deg"],
      [90, -230, "470deg"],
    ];

    petals.forEach(([x, y, rotation], index) => {
      const petal = document.createElement("span");
      petal.className = "celebration-petal";
      petal.style.setProperty("--x", `${x}px`);
      petal.style.setProperty("--y", `${y}px`);
      petal.style.setProperty("--rotation", rotation);
      petal.style.animationDelay = `${index * 36}ms`;
      targetSection.appendChild(petal);
      petal.addEventListener("animationend", () => petal.remove(), { once: true });
    });
  }

  function revealSurprise(objectButton) {
    const surpriseIndex = Number(objectButton.dataset.surpriseIndex);

    surpriseObjects.forEach((item) => item.classList.remove("is-selected"));
    goldenSecretStar.classList.remove("is-selected");
    objectButton.classList.add("is-selected");

    if (discoveredSurprises.has(surpriseIndex)) {
      return;
    }

    discoveredSurprises.add(surpriseIndex);
    objectButton.classList.add("is-found");
    objectButton.setAttribute("aria-pressed", "true");
    updateSurpriseCounter();

    if (discoveredSurprises.size === surpriseObjects.length) {
      surpriseComplete.hidden = false;
      createPetalCelebration(surpriseSection);
    }
  }

  function revealGoldenStar() {
    surpriseObjects.forEach((item) => item.classList.remove("is-selected"));
    goldenSecretStar.classList.add("is-selected");

    if (goldenStarFound) {
      return;
    }

    goldenStarFound = true;
    goldenSecretStar.classList.add("is-found");
    goldenSecretStar.setAttribute("aria-pressed", "true");
    createPetalCelebration(surpriseSection);
  }

  surpriseObjects.forEach((objectButton) => {
    objectButton.setAttribute("aria-pressed", "false");
    objectButton.addEventListener("click", () => revealSurprise(objectButton));
  });

  goldenSecretStar.setAttribute("aria-pressed", "false");
  goldenSecretStar.addEventListener("click", revealGoldenStar);
  letterSectionButton.addEventListener("click", window.goToLetterSection);
  letterSectionButton.addEventListener("pointerdown", addButtonRipple);
  updateSurpriseCounter();

  // ===== LETTER ANIMATION LOGIC =====
  const envelopeButton = document.getElementById("envelopeButton");
  const letterDialog = document.getElementById("letterDialog");
  const closeLetterDialog = document.getElementById("closeLetterDialog");
  const letterEnd = document.getElementById("letterEnd");
  const finalSurpriseButton = document.getElementById("finalSurpriseButton");
  const musicToggle = document.getElementById("musicToggle");
  const musicToggleText = document.getElementById("musicToggleText");
  let letterOpening = false;

  function createFinaleTransitionGlow() {
    if (reduceMotion) {
      return;
    }

    const petals = [
      [-180, -120, "180deg"],
      [-104, -178, "260deg"],
      [-34, -146, "340deg"],
      [38, -210, "420deg"],
      [112, -156, "500deg"],
      [188, -124, "580deg"],
    ];

    petals.forEach(([x, y, rotation], index) => {
      const petal = document.createElement("span");
      petal.className = "celebration-petal";
      petal.style.setProperty("--x", `${x}px`);
      petal.style.setProperty("--y", `${y}px`);
      petal.style.setProperty("--rotation", rotation);
      petal.style.animationDelay = `${index * 45}ms`;
      finaleSection.appendChild(petal);
      petal.addEventListener("animationend", () => petal.remove(), { once: true });
    });
  }

  window.goToFinalSurpriseSection = function goToFinalSurpriseSection() {
    letterSection.classList.add("is-final-transition");
    createFinaleTransitionGlow();

    window.setTimeout(
      () => {
        finaleSection.classList.add("is-entering");
        showPage(finaleSection);
      },
      reduceMotion ? 20 : 160
    );

    window.setTimeout(
      () => {
        finaleSection.focus({ preventScroll: true });
        window.dispatchEvent(new CustomEvent("birthday-last-surprise-ready"));
      },
      reduceMotion ? 80 : 940
    );
  };

  function openLetter() {
    if (letterOpening || letterDialog.open) return;
    letterOpening = true;
    envelopeButton.classList.add("is-open");
    envelopeButton.setAttribute("aria-expanded", "true");
    window.setTimeout(
      () => {
        letterOpening = false;
        if (!letterSection.classList.contains("is-current-page")) return;
        letterDialog.showModal();
        letterEnd.hidden = false;
        closeLetterDialog.focus();
      },
      reduceMotion ? 20 : 650
    );
  }

  const backgroundMusic = document.getElementById("backgroundMusic");
  let musicPausedByUser = false;
  backgroundMusic.volume = 0.45;

  function updateMusicControl() {
    const isPlaying = !backgroundMusic.paused;
    musicToggle.setAttribute("aria-pressed", String(isPlaying));
    musicToggle.setAttribute("aria-label", isPlaying ? "Pause background music" : "Play background music");
    musicToggleText.textContent = isPlaying ? "Pause" : "Play";
  }

  async function playMusic() {
    try {
      await backgroundMusic.play();
    } catch {
      // Keep the play control available if the browser blocks playback.
    }
    updateMusicControl();
  }

  function startMusicOnInteraction(event) {
    if (musicPausedByUser || !backgroundMusic.paused || musicToggle.contains(event.target)) return;
    if (event.type === "keydown" && !["Enter", " "].includes(event.key)) return;
    void playMusic();
  }

  document.addEventListener("pointerup", startMusicOnInteraction, true);
  document.addEventListener("click", startMusicOnInteraction, true);
  document.addEventListener("keydown", startMusicOnInteraction, true);
  backgroundMusic.addEventListener("play", () => {
    updateMusicControl();
  });
  backgroundMusic.addEventListener("pause", updateMusicControl);
  void playMusic();

  envelopeButton.setAttribute("aria-expanded", "false");
  envelopeButton.addEventListener("click", openLetter);
  closeLetterDialog.addEventListener("click", () => letterDialog.close());
  letterDialog.addEventListener("click", (event) => {
    if (event.target === letterDialog) letterDialog.close();
  });
  letterDialog.addEventListener("close", () => {
    envelopeButton.classList.remove("is-open");
    envelopeButton.setAttribute("aria-expanded", "false");
    if (letterSection.classList.contains("is-current-page")) envelopeButton.focus();
  });
  musicToggle.addEventListener("click", () => {
    if (backgroundMusic.paused) {
      musicPausedByUser = false;
      void playMusic();
    }
    else {
      musicPausedByUser = true;
      backgroundMusic.pause();
    }
  });
  finalSurpriseButton.addEventListener("click", window.goToFinalSurpriseSection);
  finalSurpriseButton.addEventListener("pointerdown", addButtonRipple);

  // ===== CAKE CELEBRATION LOGIC =====
  const cakeButton = document.getElementById("cakeButton");
  const cakeActionButton = document.getElementById("cakeActionButton");
  const wishSentCard = document.getElementById("wishSentCard");
  const floatingWishLayer = document.getElementById("floatingWishLayer");
  const openProposal = document.getElementById("openProposal");
  const floatingWishMessages = [
    "Stay happy.",
    "Keep smiling.",
    "Enjoy your day.",
    "Shine brightly.",
    "Best wishes always.",
    "Beautiful memories ahead.",
    "A joyful year awaits.",
  ];
  let candlesAreLit = false;
  let wishWasMade = false;
  let floatingWishTimer = null;
  let settleTimer = null;

  function clearFinaleTimers() {
    if (floatingWishTimer) {
      window.clearInterval(floatingWishTimer);
      floatingWishTimer = null;
    }

    if (settleTimer) {
      window.clearTimeout(settleTimer);
      settleTimer = null;
    }
  }

  function createFinaleConfettiBurst() {
    if (reduceMotion) {
      return;
    }

    const colors = ["#f8d7e8", "#fff9fc", "#c88673", "#c9b6ff", "#fff3cf"];

    for (let index = 0; index < 18; index += 1) {
      const confetti = document.createElement("span");
      confetti.className = "confetti-piece";
      confetti.style.left = "50%";
      confetti.style.top = "42%";
      confetti.style.setProperty("--x", `${Math.round(Math.random() * 260 - 130)}px`);
      confetti.style.setProperty("--y", `${Math.round(Math.random() * -180 - 45)}px`);
      confetti.style.setProperty("--rotation", `${180 + index * 31}deg`);
      confetti.style.setProperty("--confetti-color", colors[index % colors.length]);
      finaleSection.appendChild(confetti);
      confetti.addEventListener("animationend", () => confetti.remove(), { once: true });
    }
  }

  function createFloatingWish() {
    if (reduceMotion) {
      return;
    }

    const wish = document.createElement("span");
    const message = floatingWishMessages[Math.floor(Math.random() * floatingWishMessages.length)];
    wish.className = "floating-birthday-wish";
    wish.textContent = message;
    wish.style.setProperty("--x", `${Math.floor(Math.random() * 68 + 10)}%`);
    wish.style.setProperty("--y", `${Math.floor(Math.random() * 48 + 18)}%`);
    floatingWishLayer.appendChild(wish);
    wish.addEventListener("animationend", () => wish.remove(), { once: true });
  }

  function lightCandles() {
    if (candlesAreLit && !wishWasMade) {
      return;
    }

    clearFinaleTimers();
    candlesAreLit = true;
    wishWasMade = false;
    finaleSection.classList.add("candles-lit");
    finaleSection.classList.remove("wish-made", "is-celebrating", "is-settled");
    wishSentCard.hidden = true;
    wishSentCard.classList.remove("is-visible");
    openProposal.hidden = true;
    cakeActionButton.textContent = "Make a Birthday Wish ✨";
    cakeButton.setAttribute("aria-label", "Make a birthday wish");
  }

  function startCelebration() {
    if (!candlesAreLit || wishWasMade) {
      lightCandles();
      return;
    }

    wishWasMade = true;
    candlesAreLit = false;
    finaleSection.classList.add("wish-made", "is-celebrating");
    finaleSection.classList.remove("candles-lit", "is-settled");
    cakeActionButton.textContent = "Wish Sent";
    cakeActionButton.disabled = true;
    cakeButton.disabled = true;
    wishSentCard.hidden = false;
    wishSentCard.classList.add("is-visible");
    openProposal.hidden = false;
    createFinaleConfettiBurst();
    createFloatingWish();

    if (!reduceMotion) {
      floatingWishTimer = window.setInterval(createFloatingWish, 850);
      settleTimer = window.setTimeout(() => {
        finaleSection.classList.add("is-settled");
        if (floatingWishTimer) {
          window.clearInterval(floatingWishTimer);
          floatingWishTimer = null;
        }
      }, 6500);
    }
  }

  cakeButton.addEventListener("click", () => {
    if (!candlesAreLit) {
      lightCandles();
    } else {
      startCelebration();
    }
  });
  cakeActionButton.addEventListener("click", startCelebration);
  cakeActionButton.addEventListener("pointerdown", addButtonRipple);
  openProposal.addEventListener("click", () => {
    clearFinaleTimers();
    finaleSection.classList.add("is-proposal-transition");
    window.setTimeout(() => {
      showPage(proposalSection);
      proposalSection.classList.add("is-entering");
      fitProposalCard();
    }, reduceMotion ? 20 : 360);
  });
  openProposal.addEventListener("pointerdown", addButtonRipple);

  // ===== FINAL PROPOSAL =====
  const proposalCard = document.getElementById("proposalCard");
  const proposalQuestion = document.getElementById("proposalQuestion");
  const proposalActions = document.getElementById("proposalActions");
  const proposalYes = document.getElementById("proposalYes");
  const proposalNo = document.getElementById("proposalNo");
  const proposalAnswer = document.getElementById("proposalAnswer");
  const proposalAnswerIcon = document.getElementById("proposalAnswerIcon");
  const proposalAnswerTitle = document.getElementById("proposalAnswerTitle");
  const proposalAnswerMessage = document.getElementById("proposalAnswerMessage");
  const proposalCelebration = document.getElementById("proposalCelebration");
  let lastNoDodgeAt = -Infinity;
  const recentNoPositions = [];

  function fitProposalCard() {
    if (!proposalSection.classList.contains("is-current-page")) return;
    proposalCard.style.zoom = "1";
    const availableHeight = proposalSection.clientHeight - 32;
    const cardHeight = proposalCard.offsetHeight;
    if (cardHeight > availableHeight) {
      proposalCard.style.zoom = String(Math.max(0.72, availableHeight / cardHeight));
    }
  }

  function dodgeNoButton(event, force = false) {
    if (!proposalAnswer.hidden) return;
    const now = performance.now();
    if (!force && now - lastNoDodgeAt < 180) return;

    const buttonRect = proposalNo.getBoundingClientRect();
    const nearX = Math.max(buttonRect.left - event.clientX, 0, event.clientX - buttonRect.right);
    const nearY = Math.max(buttonRect.top - event.clientY, 0, event.clientY - buttonRect.bottom);
    if (!force && Math.hypot(nearX, nearY) > 55) return;

    const area = proposalActions.getBoundingClientRect();
    const maxLeft = Math.max(0, area.width - buttonRect.width);
    const maxTop = Math.max(0, area.height - buttonRect.height);
    const yesRect = proposalYes.getBoundingClientRect();
    const pointerX = Number.isFinite(event.clientX) ? event.clientX : buttonRect.left;
    const pointerY = Number.isFinite(event.clientY) ? event.clientY : buttonRect.top;
    const candidates = [];
    for (let column = 0; column <= 8; column += 1) {
      for (let row = 0; row <= 6; row += 1) {
        const left = maxLeft * Math.min(1, (column + Math.random() * 0.7) / 8);
        const top = maxTop * Math.min(1, (row + Math.random() * 0.7) / 6);
        const x = area.left + left;
        const y = area.top + top;
        if (x < yesRect.right + 8 && x + buttonRect.width > yesRect.left - 8 &&
            y < yesRect.bottom + 8 && y + buttonRect.height > yesRect.top - 8) continue;
        const distance = Math.hypot(
          Math.max(x - pointerX, 0, pointerX - x - buttonRect.width),
          Math.max(y - pointerY, 0, pointerY - y - buttonRect.height)
        );
        const travel = Math.hypot(x - buttonRect.left, y - buttonRect.top);
        if (travel < 45) continue;
        const repeated = recentNoPositions.some(([oldX, oldY]) =>
          Math.hypot(left / (maxLeft || 1) - oldX, top / (maxTop || 1) - oldY) < 0.22
        );
        candidates.push({ left, top, score: distance - (repeated ? 100 : 0) });
      }
    }
    if (!candidates.length) return;
    // Randomize among safe escape points instead of alternating farthest corners.
    candidates.sort((a, b) => b.score - a.score);
    const choices = candidates.filter((candidate) => candidate.score >= candidates[0].score - 65);
    const destination = choices[Math.floor(Math.random() * choices.length)];
    recentNoPositions.push([destination.left / (maxLeft || 1), destination.top / (maxTop || 1)]);
    if (recentNoPositions.length > 4) recentNoPositions.shift();
    lastNoDodgeAt = now;
    // Bounding rectangles include the card's zoom; CSS coordinates do not.
    const scale = area.width / proposalActions.offsetWidth || 1;
    proposalNo.style.left = `${destination.left / scale}px`;
    proposalNo.style.top = `${destination.top / scale}px`;
  }

  function blockNoActivation(event) {
    event.preventDefault();
    event.stopImmediatePropagation();
    dodgeNoButton(event, true);
  }

  function celebrateYes() {
    if (reduceMotion) return;
    const symbols = ["❤️", "💗", "✨", "💍"];
    for (let index = 0; index < 22; index += 1) {
      const heart = document.createElement("span");
      heart.className = "proposal-confetti";
      heart.textContent = symbols[index % symbols.length];
      heart.style.left = `${20 + Math.random() * 60}%`;
      heart.style.top = `${35 + Math.random() * 35}%`;
      heart.style.setProperty("--x", `${Math.random() * 360 - 180}px`);
      heart.style.setProperty("--y", `${-100 - Math.random() * 230}px`);
      heart.style.animationDelay = `${index * 35}ms`;
      proposalCelebration.appendChild(heart);
      heart.addEventListener("animationend", () => heart.remove(), { once: true });
    }
  }

  async function logProposalChoice(yes) {
    try {
      const response = await fetch("/api/proposal-choice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ choice: yes ? "YES" : "NO" }),
      });
      if (!response.ok) throw new Error(`Log server returned ${response.status}`);
    } catch (error) {
      console.error("Could not save the proposal choice. Open the site with Start Birthday.bat.", error);
    }
  }

  function answerProposal(yes) {
    logProposalChoice(yes);
    proposalQuestion.hidden = true;
    proposalAnswer.hidden = false;
    proposalCard.classList.toggle("is-yes", yes);
    proposalCard.classList.toggle("is-no", !yes);
    proposalAnswerIcon.textContent = yes ? "💍" : "❤️";
    proposalAnswerTitle.textContent = yes
      ? "🚨 MEDICAL EMERGENCY 🚨"
      : "Ahhh… rejected for the Nth time. 😂💔";
    if (yes) {
      proposalAnswerMessage.innerHTML = "<strong>SHE SAID YES! 😭❤️</strong><br>Heart rate: 📈📈📈<br>Brain.exe: <strong>Not Responding</strong><br>Happiness.exe: <strong>Running at 100%</strong><br><code>RelationshipStatus = SUCCESS;</code><br><strong>Patient survived the waiting period. 😂❤️</strong>";
    } else {
      proposalAnswerMessage.textContent = "RequestStatus: REJECTED\nPatient condition: Still stable.\nTreatment: Patience.\nNext appointment: Until she changes her mind. 😂❤️\nwhile (!sheSaysYes) patient.Wait();";
    }
    fitProposalCard();
    if (yes) celebrateYes();
  }

  window.addEventListener("resize", fitProposalCard);
  if (document.fonts) document.fonts.ready.then(fitProposalCard);
  proposalSection.addEventListener("pointermove", (event) => {
    if (event.pointerType !== "touch") dodgeNoButton(event);
  });
  proposalNo.addEventListener("pointerdown", blockNoActivation);
  proposalNo.addEventListener("touchstart", (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    if (!window.PointerEvent) dodgeNoButton(event.changedTouches[0], true);
  }, { passive: false });
  proposalNo.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") blockNoActivation(event);
  });
  proposalYes.addEventListener("click", () => answerProposal(true));
  proposalNo.addEventListener("click", blockNoActivation);
})();
