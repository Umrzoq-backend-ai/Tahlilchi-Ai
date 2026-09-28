"""Optional browser smoke test; requires Playwright and a running local server.

Run with a Python interpreter that has playwright installed.
Creates one demo dataset and deletes it before exiting.
"""

import os
import secrets
import time
from getpass import getpass
from pathlib import Path

from playwright.sync_api import expect, sync_playwright

base_url = os.getenv("ANALYST_TEST_URL", "http://127.0.0.1:8000")
screenshots = Path("/tmp/analyst-screenshots")
screenshots.mkdir(exist_ok=True)

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(
        executable_path="/usr/bin/google-chrome", headless=True
    )
    page = browser.new_page(
        viewport={"width": 1440, "height": 1100}, device_scale_factor=1
    )
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.on(
        "console",
        lambda message: (
            errors.append(message.text) if message.type == "error" else None
        ),
    )
    dataset_id = None
    expected_history = 1
    try:
        page.goto(base_url)
        expect(page.locator("#auth-form")).to_be_visible()
        google_status = page.request.get(f"{base_url}/api/v1/auth/google/status").json()
        setup = (
            page.request.get(f"{base_url}/api/v1/auth/me").json().get("setup_allowed")
        )
        if not setup:
            expect(page.locator("#google-login")).to_be_enabled() if google_status[
                "configured"
            ] else expect(page.locator("#google-login")).to_be_disabled()
        page.screenshot(path=str(screenshots / "login.png"), full_page=True)
        if setup and os.getenv("ANALYST_TEST_SETUP") != "1":
            raise RuntimeError(
                "First-account setup requires ANALYST_TEST_SETUP=1 on an isolated test server."
            )
        username = os.getenv("ANALYST_TEST_USERNAME") or (
            "smoketest" if setup else input("Test login: ")
        )
        password = os.getenv("ANALYST_TEST_PASSWORD") or (
            secrets.token_urlsafe(24) if setup else getpass("Test parol: ")
        )
        page.locator("#auth-username").fill(username)
        page.locator("#auth-password").fill(password)
        page.locator("#auth-submit").click()
        expect(page.locator("#auth-panel")).to_be_hidden()
        expect(page.locator(".workspace-label strong")).to_have_text(username)
        expect(page.locator("#demo-button")).to_be_enabled()
        expect(page.locator("#demo-sidebar-button")).to_be_visible()
        page.set_viewport_size({"width": 390, "height": 844})
        expect(page.locator("#demo-sidebar-button")).to_be_visible()
        assert page.evaluate(
            "document.documentElement.scrollWidth <= window.innerWidth"
        )
        page.set_viewport_size({"width": 1440, "height": 1100})
        page.screenshot(path=str(screenshots / "desktop-upload.png"), full_page=True)
        with page.expect_response(
            lambda response: (
                response.url.split("?")[0].endswith("/api/v1/datasets")
                and response.request.method == "POST"
            )
        ) as uploaded:
            page.locator("#demo-sidebar-button").click()
        dataset_id = uploaded.value.json()["id"]
        expect(page.locator("#dataset-name")).to_have_text("sales.csv")
        expect(page.locator("#metric-rows")).to_have_text("19")
        page.locator(".schema-details summary").click()
        expect(page.locator(".schema-details")).to_contain_text("YYYY-MM-DD")
        expect(page.locator('[data-operation="monthly"]')).to_be_enabled()
        page.locator('[data-operation="monthly"]').click()
        page.locator("#group-column").select_option("order_date")
        page.locator("#value-column").select_option("amount")
        page.locator("#analyze-button").click()
        expect(page.locator("#result-summary")).to_contain_text(
            "2026-03", timeout=30000
        )
        expect(page.locator("#chart svg rect")).to_have_count(6)
        expect(page.locator(".history-item")).to_have_count(1)
        expect(page.locator("#analyze-button")).to_be_enabled()
        with page.expect_download() as csv_download:
            page.locator("#download-csv").click()
        assert csv_download.value.suggested_filename.endswith("-preview.csv")
        with page.expect_download() as download:
            page.locator("#download-result").click()
        assert download.value.suggested_filename.endswith(".json")
        if os.getenv("ANALYST_TEST_LIVE_AI") == "1":
            expect(page.locator("#ask-button")).to_be_enabled()
            page.locator("#question-input").fill(
                "Har bir oy uchun amount yig‘indisini hisobla va barcha oylarni chiqar."
            )
            with page.expect_response(
                lambda response: (
                    response.url.endswith("/questions")
                    and response.request.method == "POST"
                )
            ) as submitted:
                page.locator("#ask-button").click()
            response = submitted.value
            assert response.status == 202, response.text()
            run_id = response.json()["id"]
            deadline = time.monotonic() + 190
            while time.monotonic() < deadline:
                run = page.request.get(f"{base_url}/api/v1/runs/{run_id}").json()
                if run["status"] not in {"queued", "running"}:
                    break
                page.wait_for_timeout(500)
            assert run["status"] == "succeeded", {
                "status": run["status"],
                "error": run.get("error"),
                "message": run.get("message"),
            }
            assert ["2026-03", 3400000] in run["analysis"]["result"]["table"]["rows"]
            expect(page.locator("#agent-stage")).to_have_text("Hisoblash tekshirildi.")
            expect(page.locator("#chart svg rect")).to_have_count(6)
            expected_history = 2
            expect(page.locator(".history-item")).to_have_count(expected_history)
            print(
                "Live Gemini passed: plan, generated Python, namespace execution, independent validation."
            )
        page.screenshot(path=str(screenshots / "desktop-result.png"), full_page=True)
        page.reload()
        page.locator(".dataset-item", has_text="sales.csv").first.click()
        expect(page.locator(".history-item")).to_have_count(expected_history)
        expect(page.locator(".history-item").first).to_be_enabled()
        page.locator(".history-item").first.click()
        expect(page.locator("#result-summary")).to_contain_text("2026-03")
        page.set_viewport_size({"width": 390, "height": 844})
        expect(page.locator("#add-file")).to_be_visible()
        assert page.evaluate(
            "document.documentElement.scrollWidth <= window.innerWidth"
        )
        page.screenshot(path=str(screenshots / "mobile-result.png"), full_page=True)
        page.locator("#add-file").click()
        expect(page.locator("#upload-panel")).to_be_visible()
        page.on("dialog", lambda dialog: dialog.accept())
        page.locator("#delete-dataset").click()
        expect(page.locator("#dataset-panel")).to_be_hidden()
        assert (
            page.request.get(f"{base_url}/api/v1/datasets/{dataset_id}").status == 404
        )
        page.locator("#logout-button").click()
        expect(page.locator("#auth-form")).to_be_visible()
        expect(page.locator(".sidebar")).to_be_hidden()
        expect(page.locator("#google-login")).to_be_enabled() if google_status[
            "configured"
        ] else expect(page.locator("#google-login")).to_be_disabled()
        assert (
            page.request.get(f"{base_url}/api/v1/auth/me").json()["authenticated"]
            is False
        )
        page.locator("#auth-username").fill(username)
        page.locator("#auth-password").fill(password)
        page.locator("#auth-submit").click()
        expect(page.locator("#auth-panel")).to_be_hidden()
        expect(page.locator("#demo-button")).to_be_enabled()
        assert errors == [], errors
        print(
            "Browser smoke passed: setup/login, upload, monthly totals, chart, download, history, mobile, deletion, logout and re-login."
        )
        print(f"Screenshots: {screenshots}")
    finally:
        if dataset_id:
            session = page.request.get(f"{base_url}/api/v1/auth/me").json()
            if session.get("authenticated"):
                page.request.delete(
                    f"{base_url}/api/v1/datasets/{dataset_id}",
                    headers={"X-CSRF-Token": session["csrf_token"]},
                )
        browser.close()
