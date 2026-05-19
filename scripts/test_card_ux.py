"""
Card UX test for the public feed page.
Checks: badge consistency, title clamp, description clamp, Live chip logic.
"""
import sys
from playwright.sync_api import sync_playwright

VIEWPORT = {"width": 1440, "height": 900}
URL = "http://localhost:3000"
SHOTS = "C:/Users/cusma/projects/Bulletin/scripts/screenshots"

import os
os.makedirs(SHOTS, exist_ok=True)

issues = []

def check(condition, msg):
    if not condition:
        issues.append(f"FAIL: {msg}")
        print(f"  ✗ {msg}")
    else:
        print(f"  ✓ {msg}")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport=VIEWPORT)

    print("\n── Loading public feed ──")
    page.goto(URL)
    page.wait_for_load_state("networkidle")

    # Full page screenshot
    page.screenshot(path=f"{SHOTS}/01_full_page.png", full_page=True)
    print(f"  Screenshot saved: 01_full_page.png")

    # Collect all standard announcement cards (non-featured)
    cards = page.locator('[data-testid="announcement-card"]').all()
    print(f"\n── Found {len(cards)} announcement card(s) ──")

    check(len(cards) > 0, f"At least 1 card rendered (got {len(cards)})")

    badge_row_present = 0
    badge_row_missing = 0
    live_chip_cards = 0
    non_live_chip_cards = 0
    title_overflow_cards = 0
    desc_overflow_cards = 0

    for i, card in enumerate(cards[:12]):  # Test first 12 cards
        box = card.bounding_box()
        if not box:
            continue

        # Badge chips inside this card
        chips = card.locator('.announcement-card-chip').all()
        badges_div = card.locator('.announcement-card-badges')

        has_badges_div = badges_div.count() > 0
        chip_count = len(chips)

        if chip_count > 0:
            badge_row_present += 1
        else:
            badge_row_missing += 1
            issues.append(f"FAIL: Card {i+1} has no badge chips — title position inconsistent")
            print(f"  ✗ Card {i+1}: no chips (title alignment broken)")

        # Check for Live chip
        live_chips = card.locator('.announcement-card-chip', has_text="Live").all()
        has_live = len(live_chips) > 0

        # Check if other status chips exist
        urgency_chips = card.locator('.announcement-card-chip').all()
        chip_labels = [c.inner_text().strip() for c in urgency_chips]
        has_other_chips = any(
            label not in ("Live",) for label in chip_labels
        )

        if has_live and has_other_chips:
            non_live_chip_cards += 1  # Live shown alongside other chips (wrong)
            issues.append(f"FAIL: Card {i+1} shows 'Live' alongside other chips: {chip_labels}")
            print(f"  ✗ Card {i+1}: Live + other chips = {chip_labels}")
        elif has_live:
            live_chip_cards += 1
            print(f"  ✓ Card {i+1}: 'Live' chip (no other badges) {chip_labels}")
        else:
            print(f"  ✓ Card {i+1}: chips = {chip_labels}")

        # Title clamp — check rendered height vs line-height
        title = card.locator('.announcement-card-title').first
        if title.count() > 0:
            t_box = title.bounding_box()
            # Get computed line-height via JS
            lh = page.evaluate("""(el) => {
                const style = window.getComputedStyle(el);
                return parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.2;
            }""", title.element_handle())
            if t_box and lh:
                lines_rendered = t_box["height"] / lh
                if lines_rendered > 2.4:  # allow small rounding
                    title_overflow_cards += 1
                    issues.append(f"FAIL: Card {i+1} title renders {lines_rendered:.1f} lines (expected ≤2)")
                    print(f"  ✗ Card {i+1}: title = {lines_rendered:.1f} lines")

        # Description clamp
        desc = card.locator('.announcement-card-summary').first
        if desc.count() > 0:
            d_box = desc.bounding_box()
            dlh = page.evaluate("""(el) => {
                const style = window.getComputedStyle(el);
                return parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.5;
            }""", desc.element_handle())
            if d_box and dlh:
                desc_lines = d_box["height"] / dlh
                if desc_lines > 2.6:
                    desc_overflow_cards += 1
                    issues.append(f"FAIL: Card {i+1} description renders {desc_lines:.1f} lines (expected ≤2)")
                    print(f"  ✗ Card {i+1}: description = {desc_lines:.1f} lines")

    # Cropped screenshot of first row of cards
    cards_section = page.locator('#announcements').first
    if cards_section.count() > 0:
        cards_section.screenshot(path=f"{SHOTS}/02_announcements_section.png")
        print(f"\n  Screenshot saved: 02_announcements_section.png")

    # Check badge row consistency summary
    print(f"\n── Badge row summary ──")
    check(badge_row_missing == 0, f"All cards have at least one badge chip (missing on {badge_row_missing})")
    check(live_chip_cards >= 0, f"'Live' chip appeared on {live_chip_cards} badge-less cards")
    check(non_live_chip_cards == 0, f"'Live' chip NOT shown alongside other chips ({non_live_chip_cards} violations)")
    check(title_overflow_cards == 0, f"No title overflow beyond 2 lines ({title_overflow_cards} violations)")
    check(desc_overflow_cards == 0, f"No description overflow beyond 2 lines ({desc_overflow_cards} violations)")

    # Mobile viewport test
    print(f"\n── Mobile (390px) viewport ──")
    page.set_viewport_size({"width": 390, "height": 844})
    page.reload()
    page.wait_for_load_state("networkidle")
    page.screenshot(path=f"{SHOTS}/03_mobile_cards.png", full_page=True)
    print(f"  Screenshot saved: 03_mobile_cards.png")

    mobile_cards = page.locator('[data-testid="announcement-card"]').all()
    mobile_badge_missing = sum(
        1 for c in mobile_cards[:8]
        if c.locator('.announcement-card-chip').count() == 0
    )
    check(mobile_badge_missing == 0, f"Mobile: all cards have badge chips (missing on {mobile_badge_missing})")

    browser.close()

print(f"\n── Result ──")
if issues:
    print(f"  {len(issues)} issue(s) found:")
    for issue in issues:
        print(f"    {issue}")
    sys.exit(1)
else:
    print("  All checks passed.")
