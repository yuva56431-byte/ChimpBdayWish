(function () {
  const form = document.getElementById("wishForm");
  const nameInput = document.getElementById("friendName");
  const wishInput = document.getElementById("friendWish");
  const submitButton = document.getElementById("submitWish");
  const nameError = document.getElementById("nameError");
  const wishError = document.getElementById("wishError");
  const formMessage = document.getElementById("formMessage");
  const wishCounter = document.getElementById("wishCounter");
  const successScene = document.getElementById("wishSuccessScene");
  const isSeparateLocalFrontend =
    window.location.hostname === "localhost" &&
    window.location.port &&
    window.location.port !== "5000";
  const wishesApiUrl = isSeparateLocalFrontend
    ? "http://localhost:5000/api/wishes"
    : "/api/wishes";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let isSubmitting = false;

  function normalizeSpaces(value) {
    return value.trim().replace(/\s+/g, " ");
  }

  function normalizeMessage(value) {
    return value
      .trim()
      .split("\n")
      .map((line) => line.trim().replace(/[ \t]+/g, " "))
      .filter(Boolean)
      .join("\n");
  }

  function updateCounter() {
    wishCounter.textContent = `${wishInput.value.length} / 300`;
  }

  function setFieldError(field, messageElement, message) {
    const fieldWrap = field.closest(".wish-field");
    fieldWrap.classList.toggle("has-error", Boolean(message));
    field.setAttribute("aria-invalid", String(Boolean(message)));
    messageElement.textContent = message;
  }

  function validateForm() {
    const name = normalizeSpaces(nameInput.value);
    const message = normalizeMessage(wishInput.value);
    let isValid = true;

    if (!name) {
      setFieldError(nameInput, nameError, "Please add your name.");
      isValid = false;
    } else {
      setFieldError(nameInput, nameError, "");
    }

    if (!message) {
      setFieldError(wishInput, wishError, "Please write a birthday wish.");
      isValid = false;
    } else {
      setFieldError(wishInput, wishError, "");
    }

    return {
      isValid,
      data: {
        friendName: name,
        wishMessage: message,
      },
    };
  }

  function setSubmittingState(isLoading) {
    isSubmitting = isLoading;
    submitButton.disabled = isLoading;
    submitButton.classList.toggle("is-loading", isLoading);
  }

  function showApiErrors(result) {
    const errors = result.errors || {};

    if (errors.friendName?.length) {
      setFieldError(nameInput, nameError, errors.friendName[0]);
    }

    if (errors.wishMessage?.length) {
      setFieldError(wishInput, wishError, errors.wishMessage[0]);
    }

    formMessage.textContent = result.message || "Please check the form and try again.";
  }

  function addButtonRipple(event) {
    if (reduceMotion) {
      return;
    }

    const ripple = document.createElement("span");
    const rect = event.currentTarget.getBoundingClientRect();
    ripple.className = "button-ripple";
    ripple.style.left = `${event.clientX - rect.left}px`;
    ripple.style.top = `${event.clientY - rect.top}px`;
    event.currentTarget.appendChild(ripple);
    ripple.addEventListener("animationend", () => ripple.remove(), { once: true });
  }

  function showSuccess() {
    form.classList.add("is-submitted");

    window.setTimeout(
      () => {
        form.hidden = true;
        successScene.hidden = false;
        successScene.classList.add("is-visible");
      },
      reduceMotion ? 20 : 520
    );
  }

  async function submitWish(event) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    formMessage.textContent = "";
    const { isValid, data } = validateForm();

    if (!isValid) {
      return;
    }

    nameInput.value = data.friendName;
    wishInput.value = data.wishMessage;
    updateCounter();
    setSubmittingState(true);

    try {
      const response = await fetch(wishesApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        showApiErrors(result);
        setSubmittingState(false);
        return;
      }

      showSuccess();
    } catch (error) {
      formMessage.textContent =
        "Could not reach the birthday wish server. Make sure the backend is running on http://localhost:5000.";
      setSubmittingState(false);
    }
  }

  nameInput.addEventListener("input", () => {
    if (nameInput.value.trim()) {
      setFieldError(nameInput, nameError, "");
    }
  });

  wishInput.addEventListener("input", () => {
    updateCounter();

    if (wishInput.value.trim()) {
      setFieldError(wishInput, wishError, "");
    }
  });

  submitButton.addEventListener("pointerdown", addButtonRipple);
  form.addEventListener("submit", submitWish);
  updateCounter();
})();
