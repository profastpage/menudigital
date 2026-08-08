"""Verify published menu page with 5-button bottom nav, fav buttons, PWA install."""
import asyncio
from playwright.async_api import async_playwright
from pathlib import Path

HTML_PATH = "/home/z/my-project/download/menu-published-test.html"
OUT_DIR = Path("/home/z/my-project/download")
OUT_DIR.mkdir(parents=True, exist_ok=True)


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, args=["--no-sandbox"])
        # Mobile viewport (iPhone 13 mini)
        context = await browser.new_context(
            viewport={"width": 375, "height": 812},
            device_scale_factor=2,
            user_agent=(
                "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) "
                "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
            ),
        )
        page = await context.new_page()

        # Capture console errors
        console_errors = []
        page.on("console", lambda msg: console_errors.append(
            f"[{msg.type}] {msg.text}") if msg.type in ("error", "warning") else None
        )

        url = f"file://{HTML_PATH}"
        print(f"→ Loading: {url}")
        await page.goto(url, wait_until="networkidle", timeout=30000)

        # Wait a bit for images to load
        await page.wait_for_timeout(1500)

        # ─── Check 1: Bottom nav visible with 5 buttons ───
        nav = await page.query_selector("#mobileBottomNav")
        nav_visible = await nav.is_visible() if nav else False
        nav_items = await page.query_selector_all(".mbn-item")
        nav_actions = []
        for item in nav_items:
            action = await item.get_attribute("data-action")
            nav_actions.append(action)
        print(f"\n✓ Bottom nav visible: {nav_visible}")
        print(f"✓ Nav buttons ({len(nav_actions)}): {nav_actions}")
        assert nav_visible, "Bottom nav should be visible"
        assert len(nav_actions) == 5, f"Expected 5 buttons, got {len(nav_actions)}"
        assert nav_actions == ["home", "search", "favorites", "install", "cart"], \
            f"Wrong button order: {nav_actions}"

        # ─── Check 2: Each dish has a fav button (heart) ───
        dishes = await page.query_selector_all(".dish[data-cat]")
        carta_cards = await page.query_selector_all(".carta-card[data-cat]")
        rappi_items = await page.query_selector_all(".rappi-item[data-cat]")
        total_dishes = len(dishes) + len(carta_cards) + len(rappi_items)
        fav_buttons = await page.query_selector_all(".dish-fav-btn")
        print(f"\n✓ Total dishes rendered: {total_dishes}")
        print(f"✓ Favorite buttons injected: {len(fav_buttons)}")
        # Some dishes may not have img-wrap (imageSize=none) — but our test data has medium
        assert len(fav_buttons) > 0, "No fav buttons injected!"
        assert len(fav_buttons) == total_dishes, \
            f"Expected {total_dishes} fav buttons, got {len(fav_buttons)}"

        # ─── Check 3: Click a fav button → toggles is-fav class ───
        first_fav = fav_buttons[0]
        await first_fav.click()
        await page.wait_for_timeout(200)
        is_fav_after_click = await first_fav.evaluate(
            "el => el.classList.contains('is-fav')")
        print(f"\n✓ Click fav button → is-fav class added: {is_fav_after_click}")
        assert is_fav_after_click, "Fav button should be marked is-fav after click"

        # Check fav badge in bottom nav updated
        fav_badge = await page.query_selector("#mbnFavCount")
        badge_display = await fav_badge.evaluate("el => el.style.display")
        badge_text = await fav_badge.inner_text()
        print(f"✓ Fav badge display: {badge_display}, count: {badge_text}")
        assert badge_display != "none" and badge_text == "1", "Fav badge should show count=1"

        # ─── Check 4: Open favorites modal ───
        favs_btn = await page.query_selector('.mbn-item[data-action="favorites"]')
        await favs_btn.click()
        await page.wait_for_timeout(400)
        fav_overlay = await page.query_selector("#favoritesOverlay")
        fav_overlay_visible = await fav_overlay.evaluate(
            "el => el.classList.contains('visible')")
        print(f"\n✓ Favorites modal opens: {fav_overlay_visible}")
        assert fav_overlay_visible, "Favorites modal should be visible"

        # Check that modal shows 1 favorited dish
        fav_items = await page.query_selector_all(".fav-item")
        print(f"✓ Favorite items in modal: {len(fav_items)}")
        assert len(fav_items) == 1, f"Expected 1 fav item, got {len(fav_items)}"

        # Screenshot favorites modal
        await page.screenshot(path=str(OUT_DIR / "menu-favorites-modal.png"), full_page=False)
        print(f"  → Screenshot: menu-favorites-modal.png")

        # Close favorites modal
        close_btn = await page.query_selector("#favoritesClose")
        await close_btn.click()
        await page.wait_for_timeout(400)

        # ─── Check 5: Open PWA install overlay ───
        install_btn = await page.query_selector('.mbn-item[data-action="install"]')
        await install_btn.click()
        await page.wait_for_timeout(400)
        pwa_overlay = await page.query_selector("#pwaInstallOverlay")
        pwa_overlay_visible = await pwa_overlay.evaluate(
            "el => el.classList.contains('visible')")
        print(f"\n✓ PWA install overlay opens: {pwa_overlay_visible}")
        assert pwa_overlay_visible, "PWA install overlay should be visible"

        # Check steps text was populated
        steps = await page.query_selector("#pwaInstallSteps")
        steps_text = await steps.inner_text()
        print(f"  → Steps text: {steps_text[:80]}...")
        assert len(steps_text) > 10, "PWA install instructions should not be empty"

        # Screenshot PWA install overlay
        await page.screenshot(path=str(OUT_DIR / "menu-pwa-install.png"), full_page=False)
        print(f"  → Screenshot: menu-pwa-install.png")

        # Close PWA overlay
        pwa_close = await page.query_selector("#pwaInstallClose")
        await pwa_close.click()
        await page.wait_for_timeout(400)

        # ─── Check 6: Add a dish to cart → cart price visible below icon (not pill above) ───
        add_btn = await page.query_selector(".add-btn")
        if add_btn:
            await add_btn.click()
            await page.wait_for_timeout(400)
        else:
            # Try carta-card-add or rappi-item-add
            carta_add = await page.query_selector(".carta-card-add")
            if carta_add:
                await carta_add.click()
                await page.wait_for_timeout(400)

        cart_price_el = await page.query_selector("#mbnCartTotal")
        cart_price_text = await cart_price_el.inner_text()
        cart_badge = await page.query_selector("#mbnCartCount")
        cart_badge_display = await cart_badge.evaluate("el => el.style.display")
        cart_badge_text = await cart_badge.inner_text()
        print(f"\n✓ Cart price shown below icon: '{cart_price_text}'")
        print(f"✓ Cart badge: display={cart_badge_display}, text={cart_badge_text}")
        assert cart_price_text, "Cart price should be visible"
        assert cart_badge_display != "none", "Cart badge should be visible"

        # ─── Check 7: No old pill-over-icon .mbn-cart-total CSS class is reused as overlay ───
        # (mbnCartTotal now lives inside .mbn-cart-label, not as absolute overlay)
        # Verify the parent of #mbnCartTotal is .mbn-cart-label
        parent_class = await cart_price_el.evaluate(
            "el => el.parentElement.className")
        print(f"✓ Cart price parent class: '{parent_class}'")
        assert "mbn-cart-label" in parent_class, \
            "Price should live inside .mbn-cart-label, not floating over icon"

        # ─── Screenshot: full menu with all features visible ───
        await page.screenshot(path=str(OUT_DIR / "menu-mobile-full.png"), full_page=False)
        print(f"\n  → Screenshot: menu-mobile-full.png")

        # ─── Check 8: Cart button opens modal ───
        cart_btn = await page.query_selector('.mbn-item[data-action="cart"]')
        await cart_btn.click()
        await page.wait_for_timeout(400)
        cart_modal = await page.query_selector("#modal")
        cart_modal_visible = await cart_modal.evaluate(
            "el => el.classList.contains('visible')")
        print(f"✓ Cart button opens modal: {cart_modal_visible}")
        assert cart_modal_visible, "Cart modal should open when cart button is clicked"

        # Close cart modal
        close_btn = await page.query_selector("#closeBtn")
        if close_btn:
            await close_btn.click()
            await page.wait_for_timeout(300)

        # ─── Check 9: Console errors ───
        print(f"\n✓ Console errors/warnings: {len(console_errors)}")
        for err in console_errors[:5]:
            print(f"  {err}")
        # Filter out network errors for unsplash images (not our concern)
        our_errors = [e for e in console_errors
                      if "unsplash" not in e and "favicon" not in e]
        assert len(our_errors) == 0, f"Console errors found: {our_errors[:3]}"

        # ─── Desktop viewport check: bottom nav hidden on desktop ───
        await context.close()
        desktop_ctx = await browser.new_context(
            viewport={"width": 1280, "height": 800}
        )
        desktop_page = await desktop_ctx.new_page()
        await desktop_page.goto(url, wait_until="networkidle", timeout=30000)
        await desktop_page.wait_for_timeout(1000)
        nav_desktop = await desktop_page.query_selector("#mobileBottomNav")
        nav_desktop_display = await nav_desktop.evaluate(
            "el => getComputedStyle(el).display")
        print(f"\n✓ Desktop: bottom nav display = '{nav_desktop_display}' (should be 'none')")
        assert nav_desktop_display == "none", \
            "Bottom nav should be hidden on desktop (>=640px)"

        await desktop_page.screenshot(
            path=str(OUT_DIR / "menu-desktop-full.png"), full_page=False)
        print(f"  → Screenshot: menu-desktop-full.png")

        await desktop_ctx.close()
        await browser.close()

        print("\n" + "=" * 60)
        print("✅ ALL CHECKS PASSED!")
        print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
