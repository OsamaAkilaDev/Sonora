import assert from "node:assert/strict";
import { test } from "node:test";
import { phoneTab, railTab, tabMove } from "./tabs";

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
