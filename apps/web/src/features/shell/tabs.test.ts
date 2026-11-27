import assert from "node:assert/strict";
import { test } from "node:test";
import { phoneTab, railTab, screenMotion, tabMove } from "./tabs";

test("tab history and mapping", () => {
  assert.equal(tabMove("chats", "chats", false), "top");
  assert.equal(tabMove("chats", "friends", false), "push");
  assert.equal(tabMove("friends", "you", true), "replace");
  assert.equal(tabMove("you", "chats", true), "back");
  assert.equal(tabMove("you", "chats", false), "replace");
  assert.equal(phoneTab("requests"), "friends");
  assert.equal(phoneTab(undefined), "chats");
  assert.equal(railTab("you"), "chats");
  assert.equal(railTab("requests"), "requests");
});

test("screen motion", () => {
  assert.equal(screenMotion("/", "/c/1"), "push");
  assert.equal(screenMotion("/c/1", "/"), "pop");
  assert.equal(screenMotion("/c/1", "/c/2"), false);
  assert.equal(screenMotion(undefined, "/c/1"), false);
});
