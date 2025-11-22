"use client";
import React, { useState } from "react";
import InputField from "../components/InputField";
import { postRequest } from "../utils/fetchers";
import { isSuccess } from "../utils/status";
import LoadingSpinner from "../components/Icons";
import { useRouter } from "next/navigation";
import bg from "../../public/bgd.jpg";
import Image from "next/image";

export default function LoginPage() {
  const [errors, setErrors] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function onSubmit(e) {
    e.preventDefault();

    setIsLoading(true);

    let formData = new FormData(e.target);

    let email = formData.get("Email");
    let password = formData.get("Password");
    console.log(email, password);

    let res = await postRequest("/auth/login", {
      email: email,
      password: password,
    });

    const data = await res.json();

    console.log(data);

    if (isSuccess(data.status)) {
      // Set cookie in browser after successful login
      document.cookie = `token=${data.content.token}; path=/; SameSite=None; Secure`;
      router.push("/app");
    }
    //
    else if (data.status === 400) {
      setErrors((errors) => ({ email: "Invalid Email", password: "" }));
    }
    //
    else if (data.status === 401) {
      setErrors((errors) => ({ email: "", password: "Invalid Password" }));
    }

    setIsLoading(false);
  }

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-7 bg-black">
      <form className="auth-form" onSubmit={onSubmit}>
        <h1 className="mb-1 text-center text-[32px] font-bold text-white">
          Login
        </h1>
        <div className="flex flex-col">
          <div className="flex flex-col gap-2.5">
            <InputField
              type="text"
              name="Email"
              placeholder="Type your email"
              error={errors.email}
            />
            <InputField
              type="password"
              name="Password"
              placeholder="Type your password"
              error={errors.password}
            />
          </div>

          <p className="mt-5  text-sm text-white">
            New here?
            <a href="/signup" className="blue-link ml-1">
              Sign up
            </a>
          </p>
        </div>
        <button
          className="bg-cyanora-500 hover:bg-cyanora-600 active:bg-cyanora-700 hover h-9 cursor-pointer rounded-md mt-3 flex items-center justify-center p-2 font-medium disabled:bg-cyanora-disabled disabled:cursor-not-allowed"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="w-6 h-6">
              <LoadingSpinner />
            </div>
          ) : (
            "Log in"
          )}
        </button>
      </form>

      <Image
        className="fixed z-0 h-full w-full object-cover"
        fill
        src={bg}
        alt=""
      />
    </div>
  );
}
