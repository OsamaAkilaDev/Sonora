"use client";
import { useRef, useState } from "react";
import {
  HideIcon,
  MailIcon,
  PasswordIcon,
  ShowIcon,
  UserIcon,
  UsernameIcon,
} from "./Icons";

export default function InputField({
  type = "text",
  placeholder = "",
  name,
  disabled = false,
  error = "",
}) {
  const [isPasswordShown, setIsPasswordShown] = useState(false);
  const inputRef = useRef(null);

  function togglePasswordVisibility() {
    setIsPasswordShown((prev) => !prev);
  }

  let icon = "";

  function Icon() {
    if (name === "Email") return <MailIcon />;
    else if (name === "Password" || name === "Confirm Password")
      return <PasswordIcon />;
    else if (name === "Display Name") return <UserIcon />;
    else if (name === "Username") return <UsernameIcon />;
    else if (name === "Name") return <UserIcon />;
  }

  return (
    <div className="relative flex flex-col gap-1">
      <div className="flex w-full items-end justify-between">
        <label className="text-white" htmlFor={name}>
          {name}
        </label>
        <p className="text-rednor-700 text-sm">{error}</p>
      </div>

      <div className="bg-shade-700 flex h-9 w-full flex-row items-center gap-2 rounded-md px-2">
        <div className="text-shade-600 h-[22px] w-[22px]">
          <Icon />
        </div>

        <input
          ref={inputRef}
          className="custom-input grow bg-transparent text-white outline-none"
          type={
            type !== "password" ? type : isPasswordShown ? "text" : "password"
          }
          name={name}
          disabled={disabled}
          id={name}
          placeholder={placeholder}
          required
        />

        {type === "password" && (
          <button
            type="button"
            className="text-shade-600 h-5.5 cursor-pointer"
            onClick={togglePasswordVisibility}
            aria-label={isPasswordShown ? "Hide Password" : "Show Password"}
          >
            {isPasswordShown ? <ShowIcon /> : <HideIcon />}
          </button>
        )}
      </div>
    </div>
  );
}
