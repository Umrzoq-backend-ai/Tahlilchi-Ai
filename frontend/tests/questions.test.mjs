import assert from "node:assert/strict";
import { test } from "node:test";
import { splitNumberedQuestions } from "../src/lib/questions.ts";

test("splits the numbered Uzbek questions actually used by a customer", () => {
  assert.deepEqual(splitNumberedQuestions(
    "1. savol :Qaysi shahar eng ko‘p savdo qilgan?\n" +
    "2.savol :Nechta bo‘sh katak va takroriy qator bor?\n" +
    "3. O‘rtacha chegirma foizi qancha?"
  ), [
    "Qaysi shahar eng ko‘p savdo qilgan?",
    "Nechta bo‘sh katak va takroriy qator bor?",
    "O‘rtacha chegirma foizi qancha?",
  ]);
});

test("does not split ordinary or malformed questions", () => {
  for (const input of [
    "2026-yilning 1. oyida tushum qancha?",
    "1. Birinchi savol\n3. Uchinchi savol",
    "1. Birinchi savol\n2. Ikkinchi savol\nqo‘shimcha izoh",
  ]) {
    assert.deepEqual(splitNumberedQuestions(input), [input]);
  }
});

test("caps automatic batches at five questions", () => {
  const input = Array.from({ length: 6 }, (_, index) => `${index + 1}. Savol ${index + 1}?`).join("\n");
  assert.deepEqual(splitNumberedQuestions(input), [input]);
});
