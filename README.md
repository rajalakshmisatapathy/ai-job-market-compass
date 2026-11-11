# AI Job Market Compass

An on-demand job search and market research app for AI and software roles across Europe. It combines public job sources, optional API providers, local skill matching, and optional Groq analysis. LinkedIn remains a manual search; this app does not log in to or scrape LinkedIn.

## Technology

- **Backend:** Python 3.9+ using the standard library (`http.server`, `urllib`, and `ThreadPoolExecutor`). No Python packages are required.
- **Frontend:** HTML and CSS with browser JavaScript. Profile preferences are saved in browser local storage.
- **LLM:** Optional Groq chat completions over HTTPS for job analysis and resume/portfolio extraction. The default model is `openai/gpt-oss-120b`.
- **LangChain and LangGraph:** Not used. The app calls Groq directly, without an agent framework.
- **Node.js:** Not required. The backend was migrated from Node.js to Python; browser JavaScript remains part of the UI.

## Features

- Searches job sources when the user clicks **Find matching jobs**.
- Compares job postings with selected roles, skills, seniority, industry, and resume/portfolio evidence.
- Shows an estimated fit score, matched skills, recurring requirements, and market insights. Groq ranks up to 15 jobs; local keyword matching covers remaining results and is the fallback when Groq is unavailable.
- Resume import supports `.txt` and `.md`; portfolio import reads a public webpage. Groq extracts skills and concise evidence for the user to review.
- The visa-only filter uses Arbeitnow's visa sponsorship option and requires explicit sponsorship wording from other sources.
- Generates LinkedIn search links for the past 24 hours. Users open LinkedIn themselves; listings are not imported from LinkedIn.
- Stores collected job listings locally in `data/job-market.json`, retaining listings for up to 30 days.
- Accepts European country names and a set of common European cities. Enter `Europe` to search the European feed. Unknown or non-European locations are rejected; add the country after a less common city (for example, `York, UK`).
- Filters provider results against the selected city or country after fetching, so a London search drops results from the Netherlands. `Europe` is the explicit broad-search option.

## Job sources

| Source | Coverage | Key | Notes |
| --- | --- | --- | --- |
| Arbeitnow | European listings in its public feed | None | Reads up to three pages and filters role/skill keywords locally. `Europe` searches the feed across identifiable European countries. The visa-only option uses `visa_sponsorship=true`. Coverage and fields depend on the feed; link back to Arbeitnow on listings. |
| Arbeitsagentur | Germany | None | Runs for German locations, and for Germany when `Europe` is selected. Uses an unofficial, community-documented endpoint. Adds common German role equivalents and fetches details for only a few results. Access or response formats may change. |
| Jooble | Configured regional markets | Optional country-specific `JOOBLE_API_KEY_<ISO>` values | Jooble keys are tied to country domains. Set `JOOBLE_API_KEY_GB`, `JOOBLE_API_KEY_DE`, and so on for each market you want searched. A single key only covers its registered market. |
| Adzuna | Selected country; limited market list for `Europe` | Optional `ADZUNA_APP_ID` and `ADZUNA_APP_KEY` | Skipped when either key is absent. For `Europe`, the app queries Adzuna's configured European API markets (Austria, Germany, France, UK, Ireland, Italy, Netherlands, Poland). |

Every source is isolated so a provider failure does not stop the other searches. Current results are deduplicated by listing ID and normalized company/title, then selected newest-first in a balanced rotation, up to 60 listings. Europe-wide searches combine up to three Arbeitnow feed pages, configured Adzuna markets, configured Jooble regional markets, and Germany-only Arbeitsagentur results; source coverage is not exhaustive across Europe. Provider warnings are not displayed in the page.

## Run locally

1. Install Python 3.9 or newer.
2. If you are starting from GitHub, clone the repository and enter its folder:

   ```sh
   git clone https://github.com/rajalakshmisatapathy/ai-job-market-compass.git
   cd ai-job-market-compass
   ```

   If you already have the project locally, open Terminal in that project folder instead.

3. Create a local `.env` from the example (do this once):

   ```sh
   cp .env.example .env
   ```

4. Add any optional API keys to `.env`. Arbeitnow and Arbeitsagentur need no key. Groq enables AI analysis and profile extraction; without it, job search and keyword ranking still work. Adzuna and Jooble are optional.
5. Start the app:

   ```sh
   python3 server.py
   ```

6. Open <http://localhost:3000>.

The Python backend has no third-party dependencies, so there is no `pip install` or `npm install` step. Press **Control+C** in Terminal to stop the server.

## Configuration

Copy `.env.example` to `.env` and fill only keys you have:

```env
ADZUNA_APP_ID=
ADZUNA_APP_KEY=
JOOBLE_API_KEY=
JOOBLE_COUNTRY=
JOOBLE_API_KEY_DE=
JOOBLE_API_KEY_GB=
JOOBLE_API_KEY_FR=
JOOBLE_API_KEY_NL=
GROQ_API_KEY=
GROQ_MODEL=openai/gpt-oss-120b
PORT=3000
```

Keep keys in the backend `.env` or your hosting provider's secret settings. Never put keys in `public/` or commit `.env`. The repository ignores `.env` and the local `data/` folder.

## API routes

The browser uses these same-origin routes served by `server.py`:

- `GET /api/config` — reports which optional providers are configured.
- `GET /api/dashboard` — loads locally saved results and market insights.
- `POST /api/search` — searches configured sources and ranks results. Request JSON includes roles and locations; optional fields include skills, seniority, industries, project evidence, and `visaOnly`.
- `POST /api/profile/import` — extracts skills and experience evidence from resume text or a public portfolio URL.
- `POST /api/clear` — clears the saved local job corpus.

## Check a provider individually

Start the app with `python3 server.py`, then run a request in another Terminal window. The `sources` field restricts a request to the named provider.

```sh
# Arbeitnow across identifiable European feed listings (no key)
curl -sS -X POST http://localhost:3000/api/search -H 'content-type: application/json' --data '{"roles":["AI Engineer"],"skills":["Python","machine learning"],"locations":["Europe"],"sources":["Arbeitnow"]}'

# Arbeitsagentur (Germany only, no key)
curl -sS -X POST http://localhost:3000/api/search -H 'content-type: application/json' --data '{"roles":["AI Engineer"],"skills":["Python"],"locations":["Berlin"],"sources":["Arbeitsagentur"]}'

# Jooble (requires a key for the regional market being searched)
curl -sS -X POST http://localhost:3000/api/search -H 'content-type: application/json' --data '{"roles":["AI Engineer"],"skills":["Python"],"locations":["Netherlands"],"sources":["Jooble"]}'

# Adzuna in selected European API markets (requires both Adzuna keys)
curl -sS -X POST http://localhost:3000/api/search -H 'content-type: application/json' --data '{"roles":["AI Engineer"],"skills":["Python"],"locations":["Europe"],"sources":["Adzuna"]}'
```

For an Arbeitnow visa-only search, add `,"visaOnly":true` to its JSON body.

## AI, data, and limits

- Without `GROQ_API_KEY`, searches use local keyword matching and market aggregation. Groq is optional.
- When Groq is configured, search preferences, project evidence, and selected job-description excerpts are sent to Groq for analysis. Resume/portfolio text is sent when the user chooses **Extract profile skills & evidence**. Avoid sending material you do not want processed by the provider.
- A fit percentage is a text-based estimate, not a hiring probability. Review the listing and extracted evidence yourself.
- The sponsorship filter is conservative: for sources other than Arbeitnow, a listing must explicitly say sponsorship is available. Missing information is treated as no confirmed sponsorship.
- LinkedIn links use the title/location fields and a 24-hour filter. LinkedIn may broaden its own results; this app does not retrieve them.
- Europe-wide results depend on each provider's own feed and country coverage. Arbeitnow does not return every European vacancy; Adzuna's Europe mode queries only its configured country endpoints; Arbeitsagentur covers Germany; and each Jooble key is regional.
- Job sources can return stale, incomplete, or changed data. Arbeitsagentur's endpoint is unofficial; Arbeitnow's endpoint is public but its schema may change.
- Job-market results are saved locally in `data/job-market.json` for up to 30 days. Use **Clear collected data** to erase them.

## Optional API keys

- Adzuna: <https://developer.adzuna.com/> — App ID and App Key.
- Jooble: <https://jooble.org/api/about> — obtain a key on each regional Jooble domain you want to query, then set the corresponding `JOOBLE_API_KEY_<ISO>` variable. For one key, set `JOOBLE_COUNTRY` to its ISO country code and put the key in `JOOBLE_API_KEY`.
- Groq: <https://console.groq.com/keys>.

## Repository contents

```text
ai-job-market-compass/
├── .env.example
├── .gitignore
├── README.md
├── server.py
├── data/              # created locally; excluded from Git
└── public/
    ├── app.js
    └── index.html
```
