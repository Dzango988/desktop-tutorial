# Taxieconom.ru UI/E2E test automation

Набор автотестов для проверки ключевых пользовательских сценариев сайта `https://taxieconom.ru`.

## Что реализовано

- Тестовый фреймворк на `pytest + Playwright`.
- Разделение тестов по маркерам:
  - `@pytest.mark.ui` — UI-валидации и навигация.
  - `@pytest.mark.e2e` — сквозные сценарии.
- Автоматизированы тест-кейсы `TC001–TC040` из предоставленного списка.
- Для сценариев, требующих внешних зависимостей (SMS/антиспам/боевые отправки форм), добавлены управляемые `skip` с пояснением.

## Структура

- `tests/conftest.py` — фикстуры Playwright browser/page и базовый URL.
- `tests/test_taxieconom.py` — полный набор тест-кейсов (40 шт.).
- `pytest.ini` — настройки pytest и маркеры.
- `requirements.txt` — зависимости.

## Запуск

```bash
pip install -r requirements.txt
playwright install chromium
pytest -m ui
pytest -m e2e
pytest
```

## Переменные окружения

- `BASE_URL` (по умолчанию `https://taxieconom.ru`)

Пример:

```bash
BASE_URL=https://taxieconom.ru pytest -k TC001
```


## Веб-форма для запуска тестов

Добавлен локальный веб-раннер `web_runner.py` с формой для запуска `pytest`.

Запуск:

```bash
python web_runner.py
```

Откройте в браузере:

- `http://127.0.0.1:8000`

В форме можно выбрать:

- маркер (`ui`/`e2e`/все),
- фильтр `-k`,
- `BASE_URL`,
- дополнительные аргументы `pytest`.


## Копирование в другой репозиторий

Если нужно перенести этот набор автотестов в другой git-репозиторий, используйте скрипт:

```bash
./tools/copy_to_repo.sh /path/to/target-repo
```

Поведение:

- копирует только файлы автотестового набора,
- не перезаписывает существующие файлы без флага,
- для принудительной перезаписи используйте `--force`:

```bash
./tools/copy_to_repo.sh /path/to/target-repo --force
```
