"use client";
import React, { useState } from "react";
import InputField from "../components/InputField";
import { postRequest } from "../utils/fetchers";
import { isSuccess } from "../utils/status";
import LoadingSpinner from "../components/Icons";
import { useRouter } from "next/navigation";
import bg from "../../public/bgd.jpg";
import Image from "next/image";
import { successToast } from "../utils/toasts";

export default function page() {
  const [errors, setErrors] = useState({
    displayName: [],
    username: [],
    email: [],
    password: [],
    passwordConfirmed: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function onSubmit(e) {
    e.preventDefault();

    setIsLoading(true);

    let formData = new FormData(e.target);

    let name = formData.get("Name");
    let username = formData.get("Username");
    let email = formData.get("Email");
    let password = formData.get("Password");
    let passwordConfirmed = formData.get("Confirm Password");

    let res = await postRequest("/auth/signup", {
      displayName: name,
      username: username,
      email: email,
      password: password,
      passwordConfirmed: passwordConfirmed,
    });

    const data = await res.json();

    console.log(data);

    if (data.status === 406 || data.status === 409) {
      setErrors({
        displayName: data.content.displayName || [],
        username: data.content.username || [],
        email: data.content.email || [],
        password: data.content.password || [],
        passwordConfirmed: data.content.passwordConfirmed || [],
      });
    }
    //
    else if (data.status === 201) {
      router.push("/app");
      successToast("Account created! You can log in now", "top-center");
    }

    setIsLoading(false);
  }

  return (
    <div className="bg-shade-900 flex h-screen w-full flex-col items-center justify-center gap-7">
      <form onSubmit={onSubmit} className=" auth-form">
        <h1 className="mb-1 text-center font-bold text-white text-[35px]">
          Sign up
        </h1>
        <div className="flex flex-col">
          <div className="flex flex-col gap-2.5">
            <InputField
              type="text"
              name="Name"
              placeholder="Type the display name"
              error={errors?.displayName[0]}
            />

            <InputField
              type="text"
              name="Username"
              placeholder="Type the username"
              error={errors?.username[0]}
            />
            <InputField
              type="text"
              name="Email"
              placeholder="Type your email"
              error={errors?.email[0]}
            />
            <InputField
              type="password"
              name="Password"
              placeholder="Type the password"
              error={errors?.password[0]}
            />
            <InputField
              type="password"
              name="Confirm Password"
              placeholder="Confirm the password"
              error={errors?.passwordConfirmed[0]}
            />
          </div>

          <p className="mt-5 mb-2 text-sm text-white">
            Already a user?
            <a href="/login" className="blue-link ml-1">
              Login
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
            "Sign up"
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
