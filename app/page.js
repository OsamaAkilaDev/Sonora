"use client";
import React, { useState, useEffect } from "react";
import { Users, Zap, Lock, Github, ArrowRight } from "lucide-react";
import { LogoIcon } from "./components/Icons";
import Link from "next/link";

export default function SonoraLanding() {
  const [scrollY, setScrollY] = useState(0);
  const [isVisible, setIsVisible] = useState({});

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible((prev) => ({ ...prev, [entry.target.id]: true }));
          }
        });
      },
      { threshold: 0.1 }
    );

    document
      .querySelectorAll("[data-animate]")
      .forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const features = [
    {
      icon: Lock,
      title: "Secure Authentication",
      description:
        "JWT-based auth system with login, signup, and logout capabilities",
      color: "cyanora",
    },
    {
      icon: Users,
      title: "Friendship Management",
      description: "Send, accept, deny, and cancel friend requests with ease",
      color: "cyanora",
    },
    {
      icon: Zap,
      title: "Real-time Messaging",
      description:
        "Instant chat powered by Socket.IO for lightning-fast communication",
      color: "cyanora",
    },
  ];

  const techStack = [
    {
      name: "Next.js & React",
      category: "Frontend Framework",
      caption:
        "Server-side rendering and reactive UI for blazing-fast user experience",
      icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg",
    },
    {
      name: "Node.js",
      category: "Backend Runtime",
      caption:
        "Efficient JavaScript runtime for scalable server-side operations",
      icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg",
    },
    {
      name: "Express.js",
      category: "Backend Framework",
      caption: "Minimalist web framework for building robust REST APIs",
      icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/express/express-original.svg",
    },
    {
      name: "Socket.IO",
      category: "Real-time Engine",
      caption: "Bi-directional communication for instant message delivery",
      icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/socketio/socketio-original.svg",
    },
    {
      name: "Prisma ORM",
      category: "Database Layer",
      caption:
        "Type-safe database client for efficient data modeling and queries",
      icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/prisma/prisma-original.svg",
    },
    {
      name: "JWT",
      category: "Authentication",
      caption: "Secure token-based authentication for user sessions",
      icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/json/json-original.svg",
    },
  ];

  return (
    <div
      className="min-h-screen text-white"
      style={{ backgroundColor: "#020202" }}
    >
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute w-96 h-96 rounded-full opacity-10 blur-3xl"
          style={{
            backgroundColor: "#0096aa",
            top: "10%",
            left: "10%",
            transform: `translate(${scrollY * 0.1}px, ${scrollY * 0.15}px)`,
          }}
        />
        <div
          className="absolute w-96 h-96 rounded-full opacity-10 blur-3xl"
          style={{
            backgroundColor: "#0096aa",
            bottom: "10%",
            right: "10%",
            transform: `translate(-${scrollY * 0.08}px, -${scrollY * 0.12}px)`,
          }}
        />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 px-6 py-6 flex justify-between items-center max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-4 h-10">
          {/* <MessageSquare size={32} style={{ color: "#0096aa" }} /> */}
          <LogoIcon />
          <span className="text-2xl font-bold">Sonora</span>
        </Link>
        <div className="flex gap-4">
          <a
            href="https://github.com/OsamaAkilaDev/Sonora"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105"
            style={{ backgroundColor: "#2c2c2c" }}
          >
            <Github size={20} />
            <span className="hidden sm:inline">Frontend</span>
          </a>
          <a
            href="https://github.com/OsamaAkilaDev/Sonora-Backend"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105"
            style={{ backgroundColor: "#2c2c2c" }}
          >
            <Github size={20} />
            <span className="hidden sm:inline">Backend</span>
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 px-6 py-20 max-w-7xl mx-auto">
        <div className="text-center space-y-8">
          <div className="space-y-4 animate-fade-in">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              Connect Instantly with{" "}
              <span
                className="inline-block animate-pulse"
                style={{ color: "#0096aa" }}
              >
                Sonora
              </span>
            </h1>
            <p
              className="text-xl md:text-2xl max-w-3xl mx-auto"
              style={{ color: "#cbcbcb" }}
            >
              A modern real-time messaging platform powered by cutting-edge web
              technologies, designed and developed by
              <Link
                href="https://akila-dev.vercel.app/"
                target="_blank"
                className="font-bold text-cyanora-500 underline ml-2"
              >
                Osama Akila
              </Link>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
            <a
              href="/login"
              className="group flex items-center gap-2 px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl"
              style={{ backgroundColor: "#0096aa" }}
            >
              Open App
              <ArrowRight
                size={20}
                className="group-hover:translate-x-1 transition-transform"
              />
            </a>
            <button
              onClick={() =>
                document
                  .getElementById("features")
                  .scrollIntoView({ behavior: "smooth" })
              }
              className="px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 hover:scale-105"
              style={{
                backgroundColor: "#2c2c2c",
                color: "#cbcbcb",
              }}
            >
              Learn More
            </button>
          </div>

          {/* Floating chat preview */}
          <div
            className="mt-16 mx-auto max-w-4xl rounded-2xl overflow-hidden shadow-2xl animate-float"
            style={{
              backgroundColor: "#141414",
              border: "1px solid #2c2c2c",
            }}
          >
            <div
              className="p-4 flex items-center gap-3"
              style={{ backgroundColor: "#202020" }}
            >
              <div className="flex gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: "#e7001e" }}
                />
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: "#8d8e8e" }}
                />
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: "#0096aa" }}
                />
              </div>
              <span style={{ color: "#8d8e8e" }}>Sonora</span>
            </div>
            <div className="sm:p-8 p-5 space-y-6">
              {[
                {
                  name: "Ahmed Kareem",
                  message:
                    "Hey! Just saw your message. The new features look amazing!",
                  date: "Today",
                  time: "2:34 PM",
                },
                {
                  name: "Khaled Bassam",
                  message:
                    "Thanks for the quick response. When can we schedule that call?",
                  date: "Today",
                  time: "2:36 PM",
                },
                {
                  name: "Jamal Adnan",
                  message:
                    "Perfect! I'll send over the files in a few minutes.",
                  date: "Today",
                  time: "2:38 PM",
                },
              ].map((chat, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 animate-slide-in"
                  style={{ animationDelay: `${i * 0.2}s` }}
                >
                  <div
                    className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-sm font-semibold"
                    style={{ backgroundColor: "#0096aa" }}
                  >
                    {chat.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div className="flex flex-col items-start">
                    <div className="flex items-baseline gap-3">
                      <p className="text-[15px] font-normal max-sm:text-xs">
                        {chat.name}
                      </p>
                      <p className="text-[11px]" style={{ color: "#8d8e8e" }}>
                        {chat.date} {chat.time}
                      </p>
                    </div>
                    <p
                      className="font-light whitespace-pre-line text-left"
                      style={{ color: "#cbcbcb" }}
                    >
                      {chat.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="relative z-10 px-6 py-20 max-w-7xl mx-auto"
      >
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Powerful Features
          </h2>
          <p className="text-xl" style={{ color: "#8d8e8e" }}>
            Everything you need for modern communication
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <div
              key={idx}
              id={`feature-${idx}`}
              data-animate
              className={`p-8 rounded-2xl transition-all duration-500 hover:scale-105 ${
                isVisible[`feature-${idx}`]
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
              }`}
              style={{
                backgroundColor: "#141414",
                transitionDelay: `${idx * 0.1}s`,
              }}
            >
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center mb-6"
                style={{ backgroundColor: "#0096aa" }}
              >
                <feature.icon size={28} />
              </div>
              <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
              <p style={{ color: "#8d8e8e" }}>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="relative z-10 px-6 py-20 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Built With Modern Tech
          </h2>
          <p className="text-xl" style={{ color: "#8d8e8e" }}>
            Leveraging the best tools for performance and scalability
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {techStack.map((tech, idx) => (
            <div
              key={idx}
              id={`tech-${idx}`}
              data-animate
              className={`p-6 rounded-xl transition-all duration-500 hover:scale-105 ${
                isVisible[`tech-${idx}`]
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
              }`}
              style={{
                backgroundColor: "#141414",
                border: "1px solid #2c2c2c",
                transitionDelay: `${idx * 0.05}s`,
              }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-12 h-12 shrink-0 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: "#202020" }}
                >
                  <img
                    src={tech.icon}
                    alt={tech.name}
                    className="w-8 h-8 object-contain"
                    style={{
                      filter:
                        tech.name === "Express.js" ||
                        tech.name === "Socket.IO" ||
                        tech.name === "Prisma ORM"
                          ? "brightness(0) invert(1)"
                          : "none",
                    }}
                  />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-lg mb-1">{tech.name}</div>
                  <div
                    className="text-xs font-medium mb-2"
                    style={{ color: "#0096aa" }}
                  >
                    {tech.category}
                  </div>
                  <div
                    className="text-sm leading-relaxed"
                    style={{ color: "#8d8e8e" }}
                  >
                    {tech.caption}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-6 py-20 max-w-7xl mx-auto">
        <div
          className="rounded-3xl p-12 md:p-16 text-center"
          style={{ backgroundColor: "#141414" }}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Start Chatting?
          </h2>
          <p className="text-xl mb-8" style={{ color: "#8d8e8e" }}>
            Join Sonora today and experience real-time messaging like never
            before
          </p>
          <a
            href="/login"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl max-sm:text-sm"
            style={{ backgroundColor: "#0096aa" }}
          >
            Get Started Now
            <ArrowRight size={20} />
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="relative z-10 px-6 py-8 border-t"
        style={{ borderColor: "#2c2c2c" }}
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3 h-8">
            <LogoIcon />
            <span className="font-semibold">Sonora</span>
          </div>
          <div style={{ color: "#8d8e8e" }}>Built by Osama Akila</div>
          <div className="flex gap-4">
            <a
              href="https://github.com/OsamaAkilaDev/Sonora"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors duration-300"
              style={{ color: "#8d8e8e" }}
            >
              Frontend
            </a>
            <a
              href="https://github.com/OsamaAkilaDev/Sonora-Backend"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors duration-300"
              style={{ color: "#8d8e8e" }}
            >
              Backend
            </a>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes float {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .animate-slide-in {
          animation: slide-in 0.5s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
}
