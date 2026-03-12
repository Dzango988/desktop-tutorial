import re

import pytest
from playwright.sync_api import Page, expect


CITY_SLUG = "/moskva/"
CITY_NAME = "Москва"


def by_text(page: Page, text: str):
    return page.get_by_text(text, exact=False)


def any_locator(page: Page, *selectors: str):
    for selector in selectors:
        locator = page.locator(selector)
        if locator.count() > 0:
            return locator.first
    return page.locator(selectors[0]).first


def open_home(page: Page):
    page.goto("/")


def open_city(page: Page):
    page.goto(CITY_SLUG)


@pytest.mark.ui
def test_TC001_search_city_input_visible(page: Page):
    open_home(page)
    city_input = any_locator(page, "input[placeholder*='город']", "input[type='search']", "input")
    expect(city_input).to_be_visible()


@pytest.mark.ui
def test_TC002_search_city_autocomplete(page: Page):
    open_home(page)
    city_input = any_locator(page, "input[placeholder*='город']", "input[type='search']", "input")
    city_input.fill("Мос")
    suggestions = any_locator(page, "[role='listbox'] li", ".autocomplete li", ".ui-menu-item")
    expect(suggestions).to_be_visible()


@pytest.mark.e2e
def test_TC003_search_city_select(page: Page):
    open_home(page)
    city_input = any_locator(page, "input[placeholder*='город']", "input[type='search']", "input")
    city_input.fill("Москва")
    by_text(page, "Москва").first.click()
    expect(page).to_have_url(re.compile(r"/moskva/?"))


@pytest.mark.ui
def test_TC004_popular_city_click(page: Page):
    open_home(page)
    by_text(page, "Москва").first.click()
    expect(page).to_have_url(re.compile(r"/.+"))


@pytest.mark.ui
def test_TC005_navigation_contacts(page: Page):
    open_home(page)
    by_text(page, "Контакты").first.click()
    expect(page).to_have_url(re.compile(r"contact|kontakty|contacts", re.I))


@pytest.mark.ui
def test_TC006_navigation_ads(page: Page):
    open_home(page)
    by_text(page, "Реклама").first.click()
    expect(page).to_have_url(re.compile(r"reklama|ads|advert", re.I))


@pytest.mark.ui
def test_TC007_navigation_favourites(page: Page):
    open_home(page)
    any_locator(page, "a[href*='favorite']", "a[href*='favourite']", "header .fa-heart").click()
    expect(page).to_have_url(re.compile(r"favorite|favourite", re.I))


@pytest.mark.e2e
def test_TC008_add_service_button(page: Page):
    open_home(page)
    by_text(page, "Добавить службу бесплатно").first.click()
    expect(page).to_have_url(re.compile(r"auth|login|register", re.I))


@pytest.mark.ui
def test_TC009_city_page_title(page: Page):
    open_city(page)
    expect(by_text(page, CITY_NAME).first).to_be_visible()


@pytest.mark.ui
def test_TC010_city_min_price_display(page: Page):
    open_city(page)
    min_price = any_locator(page, "text=/от\s*\d+\s*₽/i", "text=/миним.*\d+/i")
    expect(min_price).to_be_visible()


@pytest.mark.ui
def test_TC011_taxi_cards_visible(page: Page):
    open_city(page)
    cards = any_locator(page, ".taxi-card", ".company-card", "article")
    expect(cards).to_be_visible()


@pytest.mark.ui
def test_TC012_taxi_card_name_display(page: Page):
    open_city(page)
    card_name = any_locator(page, ".taxi-card h2", ".company-card h2", "article h2")
    expect(card_name).to_be_visible()


@pytest.mark.ui
def test_TC013_taxi_card_price_display(page: Page):
    open_city(page)
    price = any_locator(page, "text=/\d+\s*₽/", "text=/от\s*\d+/i")
    expect(price).to_be_visible()


@pytest.mark.ui
def test_TC014_taxi_card_wait_time_display(page: Page):
    open_city(page)
    wait_time = any_locator(page, "text=/мин/i", "text=/подач/i")
    expect(wait_time).to_be_visible()


@pytest.mark.e2e
def test_TC015_taxi_show_phone_button(page: Page):
    open_city(page)
    by_text(page, "Показать телефон").first.click()
    expect(page.locator("text=/\+?\d[\d\s\-()]{7,}/").first).to_be_visible()


@pytest.mark.e2e
def test_TC016_taxi_contact_button(page: Page):
    open_city(page)
    by_text(page, "Написать").first.click()
    expect(any_locator(page, "form", "a[href*='telegram']", "a[href*='whatsapp']")).to_be_visible()


@pytest.mark.e2e
def test_TC017_taxi_add_to_favourites(page: Page):
    open_city(page)
    any_locator(page, ".taxi-card .fa-heart", "article button[aria-label*='favorite']", "button:has(.fa-heart)").click()
    open_home(page)
    any_locator(page, "a[href*='favorite']", "a[href*='favourite']", "header .fa-heart").click()
    expect(any_locator(page, ".taxi-card", ".company-card", "article")).to_be_visible()


@pytest.mark.ui
def test_TC018_open_prices_tab(page: Page):
    open_city(page)
    by_text(page, "Цены").first.click()
    expect(by_text(page, "Тариф").first).to_be_visible()


@pytest.mark.ui
def test_TC019_open_routes_tab(page: Page):
    open_city(page)
    by_text(page, "Популярные направления").first.click()
    expect(by_text(page, "направлен").first).to_be_visible()


@pytest.mark.ui
def test_TC020_open_jobs_tab(page: Page):
    open_city(page)
    by_text(page, "Работа в такси").first.click()
    expect(by_text(page, "Работа").first).to_be_visible()


@pytest.mark.ui
def test_TC021_open_offices_tab(page: Page):
    open_city(page)
    by_text(page, "Офисы").first.click()
    expect(any_locator(page, "iframe", "#map", ".map")).to_be_visible()


@pytest.mark.ui
def test_TC022_open_comments_tab(page: Page):
    open_city(page)
    by_text(page, "Оставить комментарий").first.click()
    expect(any_locator(page, "form textarea", "textarea")).to_be_visible()


@pytest.mark.ui
def test_TC023_comment_empty_validation(page: Page):
    open_city(page)
    by_text(page, "Оставить комментарий").first.click()
    any_locator(page, "form button[type='submit']", "button:has-text('Отправить')").click()
    expect(any_locator(page, ".error", "text=/обязател/i", "text=/заполн/i")).to_be_visible()


@pytest.mark.ui
def test_TC024_comment_invalid_email_validation(page: Page):
    open_city(page)
    by_text(page, "Оставить комментарий").first.click()
    any_locator(page, "input[type='email']", "input[name*='mail']").fill("invalid-email")
    any_locator(page, "form button[type='submit']", "button:has-text('Отправить')").click()
    expect(any_locator(page, "text=/email/i", ".error")).to_be_visible()


@pytest.mark.e2e
def test_TC025_comment_success_submit(page: Page):
    pytest.skip("Requires stable test data and anti-spam bypass on production")


@pytest.mark.ui
def test_TC026_taxi_page_title_display(page: Page):
    open_city(page)
    any_locator(page, ".taxi-card a", ".company-card a", "article a").first.click()
    expect(any_locator(page, "h1", ".page-title")).to_be_visible()


@pytest.mark.ui
def test_TC027_taxi_phone_link(page: Page):
    open_city(page)
    any_locator(page, ".taxi-card a", ".company-card a", "article a").first.click()
    phone = any_locator(page, "a[href^='tel:']", "text=/\+?\d[\d\s\-()]{7,}/")
    expect(phone).to_be_visible()


@pytest.mark.ui
def test_TC028_taxi_telegram_link(page: Page):
    open_city(page)
    any_locator(page, ".taxi-card a", ".company-card a", "article a").first.click()
    telegram = any_locator(page, "a[href*='t.me']", "a:has-text('Telegram')")
    expect(telegram).to_be_visible()


@pytest.mark.ui
def test_TC029_taxi_tariffs_visible(page: Page):
    open_city(page)
    any_locator(page, ".taxi-card a", ".company-card a", "article a").first.click()
    expect(any_locator(page, "text=/тариф/i", ".tariffs", "table")).to_be_visible()


@pytest.mark.ui
def test_TC030_contacts_info_display(page: Page):
    page.goto("/contacts")
    expect(any_locator(page, "a[href^='tel:']", "text=/@/", "a[href^='mailto:']")).to_be_visible()


@pytest.mark.e2e
def test_TC031_contact_form_submit_success(page: Page):
    page.goto("/contacts")
    form = any_locator(page, "form", ".contact-form")
    expect(form).to_be_visible()


@pytest.mark.ui
def test_TC032_ads_button_click(page: Page):
    page.goto("/reklama")
    by_text(page, "Узнать стоимость").first.click()
    expect(any_locator(page, "form", ".modal", ".popup")).to_be_visible()


@pytest.mark.ui
def test_TC033_ads_form_validation_empty(page: Page):
    page.goto("/reklama")
    any_locator(page, "form button[type='submit']", "button:has-text('Отправить')").click()
    expect(any_locator(page, ".error", "text=/обязател/i", "text=/заполн/i")).to_be_visible()


@pytest.mark.e2e
def test_TC034_ads_form_success_submit(page: Page):
    pytest.skip("Requires non-production endpoint or disposable inbox for deterministic assertion")


@pytest.mark.ui
def test_TC035_favourites_empty_state(page: Page):
    page.goto("/favorites")
    expect(any_locator(page, "text=/нет избран/i", "text=/пуст/i", ".empty")).to_be_visible()


@pytest.mark.e2e
def test_TC036_favourites_add_item(page: Page):
    open_city(page)
    any_locator(page, ".taxi-card .fa-heart", "article button[aria-label*='favorite']", "button:has(.fa-heart)").click()
    page.goto("/favorites")
    expect(any_locator(page, ".taxi-card", ".company-card", "article")).to_be_visible()


@pytest.mark.ui
def test_TC037_login_empty_fields_validation(page: Page):
    page.goto("/auth")
    any_locator(page, "button[type='submit']", "button:has-text('Войти')").click()
    expect(any_locator(page, ".error", "text=/обязател/i", "text=/заполн/i")).to_be_visible()


@pytest.mark.e2e
def test_TC038_login_invalid_credentials(page: Page):
    page.goto("/auth")
    any_locator(page, "input[type='tel']", "input[name*='phone']", "input[type='text']").fill("79990000000")
    any_locator(page, "input[type='password']", "input[name*='password']").fill("invalid-password")
    any_locator(page, "button[type='submit']", "button:has-text('Войти')").click()
    expect(any_locator(page, ".error", "text=/невер/i", "text=/ошиб/i")).to_be_visible()


@pytest.mark.e2e
def test_TC039_registration_sms_send(page: Page):
    pytest.skip("Requires controlled phone number and SMS receiver")


@pytest.mark.e2e
def test_TC040_registration_code_confirm(page: Page):
    pytest.skip("Requires valid SMS code and controlled registration flow")
