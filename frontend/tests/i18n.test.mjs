import assert from "node:assert/strict";
import test from "node:test";
import { translate } from "../src/lib/i18n.ts";

test("translates core navigation and authentication labels to English and Russian", () => {
  assert.equal(translate("en", "Ish maydoni"), "Workspace");
  assert.equal(translate("ru", "Ish maydoni"), "Рабочая область");
  assert.equal(translate("en", "Google orqali kirish"), "Continue with Google");
  assert.equal(translate("ru", "Tahlil natijasi"), "Результат анализа");
});

test("keeps Uzbek source text and unknown server messages intact", () => {
  assert.equal(translate("uz", "Hisob sozlamalari"), "Hisob sozlamalari");
  assert.equal(translate("en", "Serverdan kelgan yangi xabar"), "Serverdan kelgan yangi xabar");
});
