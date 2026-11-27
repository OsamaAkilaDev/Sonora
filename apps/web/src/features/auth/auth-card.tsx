import { WarningCircle } from "@phosphor-icons/react";
import { loginInput, signupInput } from "@sonora/shared";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { type FormEvent, useState } from "react";
import { ApiError } from "../../lib/api";
import { play } from "../../lib/sound";
import { Button } from "../../ui/button";
import { Field } from "../../ui/field";
import { Logo } from "../../ui/logo";
import { Segmented } from "../../ui/segmented";
import { useLogin, useSignup } from "./queries";

type Mode = "login" | "signup";
const copy = {
  login: { title: "Welcome back", sub: "Sign in to pick up where you left off.", cta: "Sign in" },
  signup: {
    title: "Make yourself at home",
    sub: "One account for chats, calls and everyone in between.",
    cta: "Create account",
  },
};

export function AuthCard({ mode }: { mode: Mode }) {
  const navigate = useNavigate();
  const { redirect } = useSearch({ strict: false }) as { redirect?: string };
  const login = useLogin();
  const signup = useSignup();
  const [fields, setFields] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const pending = login.isPending || signup.isPending;

  function switchMode(next: Mode) {
    setFields({});
    setFormError("");
    navigate({ to: next === "login" ? "/login" : "/signup", search: { redirect }, replace: true });
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    const parsed = (mode === "login" ? loginInput : signupInput).safeParse(data);
    if (!parsed.success) {
      setFields(Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message])));
      return;
    }
    setFields({});
    setFormError("");
    try {
      if (mode === "login") await login.mutateAsync(parsed.data as typeof loginInput._output);
      else await signup.mutateAsync(parsed.data as typeof signupInput._output);
      sessionStorage.setItem("sonora-intro", "1");
      play("success");
      navigate({ to: redirect ?? "/" }); // sanitized by redirectSearch
    } catch (err) {
      play("error");
      if (err instanceof ApiError && Object.keys(err.fields).length) setFields(err.fields);
      else setFormError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  const c = copy[mode];
  return (
    <m.form
      onSubmit={onSubmit}
      noValidate
      initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.45, ease: [0.2, 0, 0, 1] }}
      className="grid w-full max-w-[380px] gap-5"
    >
      <header>
        <Logo className="mb-6 h-9 text-cyan lg:hidden" />
        <h1 className="text-[29px] leading-[1.15] font-semibold tracking-[-0.52px] text-balance">
          {c.title}
        </h1>
        <p className="mt-1.5 text-[15px] text-slate">{c.sub}</p>
      </header>

      <Segmented
        label="Account"
        value={mode}
        onChange={switchMode}
        options={[
          { value: "login", label: "Sign in" },
          { value: "signup", label: "Create account" },
        ]}
      />

      <div className="grid gap-3">
        {mode === "signup" && (
          <Field
            label="Username"
            name="username"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="omar.k"
            hint="This is how friends find you. Lowercase letters, numbers, dots and underscores."
            error={fields.username}
          />
        )}
        <Field
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
          error={fields.email}
        />
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          placeholder={mode === "signup" ? "At least 10 characters" : undefined}
          error={fields.password}
        />
        <AnimatePresence initial={false}>
          {formError && (
            <m.p
              role="alert"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-1.5 text-[12.5px] text-red"
            >
              <WarningCircle aria-hidden className="shrink-0" />
              {formError}
            </m.p>
          )}
        </AnimatePresence>
      </div>

      <Button type="submit" size="lg" loading={pending}>
        {c.cta}
      </Button>
    </m.form>
  );
}
