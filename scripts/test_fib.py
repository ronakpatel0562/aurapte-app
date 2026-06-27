import time
import os
from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        # Launch browser
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 800})
        page = context.new_page()

        # Log in
        print("Navigating to login page...")
        page.goto("http://localhost:3000/login")
        page.wait_for_load_state("networkidle")

        print("Filling credentials...")
        page.fill("input[name='email']", "test@aurapte.com")
        page.fill("input[name='password']", "Password123!")
        
        # Click login button
        page.click("button[type='submit']")
        
        # Wait for navigation to dashboard
        page.wait_for_url("**/dashboard")
        print("Logged in successfully, current URL:", page.url)

        # Navigate to a specific question (Housing Agencies Pay The #31)
        question_id = "6a0752f7-4acb-4636-ae59-741fb8798af6"
        target_url = f"http://localhost:3000/questions/reading/reading-fill-in-the-blanks/{question_id}"
        print(f"Navigating to question page: {target_url}...")
        page.goto(target_url)
        page.wait_for_load_state("networkidle")
        time.sleep(2)  # Wait for components to fully render
        
        # Take screenshot of the loaded question
        screenshot_path = "f:/Learning/Projects/Micro/AuraPTE.com/scripts/question_loaded.png"
        page.screenshot(path=screenshot_path)
        print(f"Screenshot saved to {screenshot_path}")

        # Let's inspect the page content/elements
        title = page.locator("h1").inner_text()
        print("Question Title:", title)

        # Let's check the words in the word bank
        words = page.locator("div.cursor-grab, div.cursor-pointer").all_inner_texts()
        print("Word bank contents:", words)

        # Let's check the droppable blanks
        blanks = page.locator("span:has-text('Select')").all()
        print("Number of blanks found:", len(blanks))

        # Close browser
        browser.close()

if __name__ == "__main__":
    run()
