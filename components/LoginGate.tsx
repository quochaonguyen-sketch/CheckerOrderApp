"use client";

import type { FormEvent, ReactNode } from "react";
import { useEffect, useState } from "react";

const LOGIN_USERNAME = "sdd123";
const LOGIN_PASSWORD = "sdd123";
const AUTH_STORAGE_KEY = "sdd-simple-auth";

type LoginGateProps = {
  children: ReactNode;
};

export function LoginGate({ children }: LoginGateProps) {
  const [isReady, setIsReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    setIsAuthenticated(localStorage.getItem(AUTH_STORAGE_KEY) === "1");
    setIsReady(true);
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (
      username.trim() === LOGIN_USERNAME &&
      password.trim() === LOGIN_PASSWORD
    ) {
      localStorage.setItem(AUTH_STORAGE_KEY, "1");
      setIsAuthenticated(true);
      setErrorMessage("");
      setPassword("");
      return;
    }

    setErrorMessage("Tai khoan hoac mat khau khong dung.");
    setPassword("");
  }

  function handleLogout() {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setIsAuthenticated(false);
    setUsername("");
    setPassword("");
    setErrorMessage("");
  }

  if (!isReady) {
    return null;
  }

  if (isAuthenticated) {
    return (
      <>
        <button
          type="button"
          className="fixed right-2 top-2 z-40 rounded-xl border border-warehouse-line bg-white/90 px-3 py-2 text-xs font-black text-warehouse-ink shadow-card backdrop-blur transition active:scale-95 md:right-4 md:top-4 md:text-sm"
          onClick={handleLogout}
        >
          Dang xuat
        </button>
        {children}
      </>
    );
  }

  return (
    <main className="flex min-h-[100svh] w-full items-center justify-center px-4 py-6 text-warehouse-ink">
      <form
        className="w-full max-w-sm rounded-[1.25rem] border-2 border-warehouse-line bg-white/90 px-4 py-5 shadow-card backdrop-blur sm:px-6"
        onSubmit={handleSubmit}
      >
        <div className="text-center">
          <h1 className="text-2xl font-black tracking-tight">
            Dang nhap SDD
          </h1>
          <p className="mt-1 text-sm font-semibold text-warehouse-ink/60">
            Vui long dang nhap de tiep tuc.
          </p>
        </div>

        <label
          className="mt-5 block text-sm font-black text-warehouse-ink"
          htmlFor="login-username"
        >
          Tai khoan
        </label>
        <input
          id="login-username"
          value={username}
          autoFocus
          autoComplete="username"
          className="mt-2 h-12 w-full rounded-xl border-2 border-warehouse-line bg-white px-3 text-base font-bold text-warehouse-ink outline-none transition focus:border-warehouse-green focus:ring-4 focus:ring-warehouse-green/20"
          onChange={(event) => setUsername(event.target.value)}
        />

        <label
          className="mt-4 block text-sm font-black text-warehouse-ink"
          htmlFor="login-password"
        >
          Mat khau
        </label>
        <input
          id="login-password"
          value={password}
          type="password"
          autoComplete="current-password"
          className="mt-2 h-12 w-full rounded-xl border-2 border-warehouse-line bg-white px-3 text-base font-bold text-warehouse-ink outline-none transition focus:border-warehouse-green focus:ring-4 focus:ring-warehouse-green/20"
          onChange={(event) => setPassword(event.target.value)}
        />

        {errorMessage ? (
          <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-warehouse-red">
            {errorMessage}
          </p>
        ) : null}

        <button
          type="submit"
          className="mt-5 h-12 w-full rounded-xl bg-warehouse-green px-4 text-base font-black text-white shadow-card transition active:scale-95"
        >
          Dang nhap
        </button>
      </form>
    </main>
  );
}
