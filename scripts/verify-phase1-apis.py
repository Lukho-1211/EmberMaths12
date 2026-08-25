"""Verify Phase 1 assessment APIs via fresh student signup."""
import time
from playwright.sync_api import sync_playwright

BASE = "http://localhost:3000"
EMAIL = f"phase1.verify.{int(time.time())}@ember12.test"
PASSWORD = "ember12"


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        page.goto(f"{BASE}/signup/student", wait_until="networkidle")
        page.wait_for_timeout(2000)

        page.get_by_label("Full name").fill("Phase One Verifier")
        page.get_by_label("Email").fill(EMAIL)
        page.get_by_label("Password").fill(PASSWORD)

        # Province select
        page.locator("select").first.select_option(label="Gauteng")
        page.wait_for_timeout(300)

        # Municipality autocomplete
        muni = page.get_by_label("Municipality")
        muni.fill("City of Johannesburg")
        page.wait_for_timeout(600)
        opt = page.get_by_role("option").filter(has_text="City of Johannesburg")
        if opt.count():
            opt.first.click()
        else:
            # click first list item under autocomplete if present
            li = page.locator("ul li, [role='listbox'] [role='option']").first
            if li.count():
                li.click()

        page.get_by_role("button", name="Create account").click()
        try:
            page.wait_for_url(
                lambda url: "/signup/" not in url and "/login/" not in url and "/student" in url,
                timeout=90000,
            )
        except Exception:
            err = page.locator(".text-danger").first
            msg = err.inner_text() if err.count() else page.inner_text("body")[:600]
            print("SIGNUP_FAIL", page.url, msg)
            browser.close()
            return

        print("SIGNUP_OK", page.url, EMAIL)

        curriculum = page.evaluate(
            """async () => {
              const res = await fetch('/api/curriculum', { credentials: 'same-origin' });
              const body = await res.json();
              const q = body.terms?.[0]?.weeks?.[0]?.weekTest?.questions?.[0];
              return {
                status: res.status,
                ok: body.ok,
                hasAnswer: q != null && Object.prototype.hasOwnProperty.call(q, 'answerIndex'),
                weekTestId: body.terms?.[0]?.weeks?.[0]?.weekTest?.id,
                lessonId: body.terms?.[0]?.weeks?.[0]?.lessons?.[0]?.id,
                pastPaperId: body.terms?.[0]?.pastPaper?.id,
              };
            }"""
        )
        print("CURRICULUM", curriculum)

        week_test_id = curriculum.get("weekTestId") or "test-t1-w1"
        mcq = page.evaluate(
            """async (assessmentId) => {
              const res = await fetch('/api/assessments/mcq', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify({ assessmentId, answers: {} }),
              });
              const body = await res.json();
              return {
                status: res.status,
                score: body.score,
                passed: body.passed,
                error: body.error,
                progressStatus: body.progress?.status,
              };
            }""",
            week_test_id,
        )
        print("MCQ", mcq)

        lesson_id = curriculum.get("lessonId")
        complete = page.evaluate(
            """async (lessonId) => {
              const res = await fetch('/api/progress/complete-lesson', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify({ lessonId }),
              });
              const body = await res.json();
              return { status: res.status, ok: body.ok, error: body.error };
            }""",
            lesson_id,
        )
        print("COMPLETE_BLOCKED", complete)

        past_id = curriculum.get("pastPaperId") or "pastpaper-t1"
        scan = page.evaluate(
            """async (assessmentId) => {
              const res = await fetch('/api/assessments/paper-scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify({
                  assessmentId,
                  fileName: 'practice-scan.jpg',
                  practiceOnly: true,
                  correctionMode: 'past-paper',
                }),
              });
              const body = await res.json();
              return {
                status: res.status,
                ok: body.ok,
                practiceOnly: body.practiceOnly,
                progressNull: body.progress == null,
                score: body.correction?.score,
                error: body.error,
              };
            }""",
            past_id,
        )
        print("PAST_PAPER", scan)
        browser.close()


if __name__ == "__main__":
    main()
