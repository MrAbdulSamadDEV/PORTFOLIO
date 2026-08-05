import { qs } from "../../utils/dom.js";

/**
 * Frontend-only contact form validation.
 * On success it opens the visitor's email client with a pre-filled
 * message addressed to the portfolio owner.
 */

interface FormField {
  input: HTMLInputElement | HTMLTextAreaElement;
  error: HTMLElement;
  validate: (value: string) => string | null;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function createValidators(form: HTMLFormElement): FormField[] {
  const nameInput = qs<HTMLInputElement>("#contact-name", form);
  const emailInput = qs<HTMLInputElement>("#contact-email", form);
  const messageInput = qs<HTMLTextAreaElement>("#contact-message", form);
  const nameError = qs<HTMLElement>('[data-error-for="name"]', form);
  const emailError = qs<HTMLElement>('[data-error-for="email"]', form);
  const messageError = qs<HTMLElement>('[data-error-for="message"]', form);
  if (!nameInput || !emailInput || !messageInput || !nameError || !emailError || !messageError) return [];

  return [
    {
      input: nameInput,
      error: nameError,
      validate: (value) => {
        const trimmed = value.trim();
        if (trimmed.length < 2) return "Please enter your name (at least 2 characters).";
        if (trimmed.length > 80) return "Your name is too long (80 characters max).";
        return null;
      },
    },
    {
      input: emailInput,
      error: emailError,
      validate: (value) => {
        const trimmed = value.trim();
        if (trimmed.length === 0) return "Please enter your email address.";
        if (!EMAIL_PATTERN.test(trimmed)) return "Please enter a valid email address.";
        if (trimmed.length > 120) return "Your email is too long.";
        return null;
      },
    },
    {
      input: messageInput,
      error: messageError,
      validate: (value) => {
        const trimmed = value.trim();
        if (trimmed.length < 10) return "Your message should be at least 10 characters.";
        if (trimmed.length > 2000) return "Your message is too long (2000 characters max).";
        return null;
      },
    },
  ];
}

export function initContactForm(): void {
  const form = qs<HTMLFormElement>("[data-contact-form]");
  if (!form) return;
  const status = qs<HTMLElement>("[data-form-status]", form);

  let fields: FormField[] = [];
  let submittedOnce = false;

  // Fields exist on both the home contact section and the /contact page;
  // wire up whichever form is present.
  const bind = (): void => {
    fields = createValidators(form);
    for (const field of fields) {
      field.input.addEventListener("input", () => {
        if (!submittedOnce) return;
        validateField(field);
      });
      field.input.addEventListener("blur", () => {
        if (submittedOnce) validateField(field);
      });
    }
  };

  const setFieldError = (field: FormField, message: string | null): void => {
    const wrapper = field.input.closest(".contact-form__field");
    wrapper?.classList.toggle("has-error", message !== null);
    field.error.textContent = message ?? "";
    field.input.setAttribute("aria-invalid", message !== null ? "true" : "false");
    if (message !== null) {
      field.error.id = `error-${field.input.id}`;
      field.input.setAttribute("aria-describedby", field.error.id);
    } else {
      field.input.removeAttribute("aria-describedby");
    }
  };

  const validateField = (field: FormField): boolean => {
    const message = field.validate(field.input.value);
    setFieldError(field, message);
    return message === null;
  };

  const showStatus = (kind: "success" | "error", text: string): void => {
    if (!status) return;
    status.className = `contact-form__status is-${kind}`;
    status.textContent = text;
    status.hidden = false;
  };

  const onOpen = (): void => {
    if (status) status.hidden = true;
  };

  // Note: both handlers are safe to bind — form submit triggers at most once.
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    submittedOnce = true;
    onOpen();

    const invalid = fields.filter((field) => !validateField(field));
    if (invalid.length > 0) {
      invalid[0]?.input.focus();
      return;
    }

    const name = qs<HTMLInputElement>("#contact-name", form)?.value.trim() ?? "";
    const email = qs<HTMLInputElement>("#contact-email", form)?.value.trim() ?? "";
    const message = qs<HTMLTextAreaElement>("#contact-message", form)?.value.trim() ?? "";

    const subject = encodeURIComponent(`Project inquiry from ${name}`);
    const body = encodeURIComponent(`${message}\n\n— ${name}\n${email}`);
    const mailtoBase = form.dataset.mailto ?? "mailto:mr.abdulsamadabdullah@gmail.com";
    const mailtoUrl = `${mailtoBase}?subject=${subject}&body=${body}`;

    window.location.href = mailtoUrl;

    const successText = form.dataset.successText ?? "Your email client has been opened with your message. If it didn't open, email me directly.";
    showStatus("success", successText);
  });

  bind();
}
