# Northstar · Multi-source Job Market Research

Northstar searches for AI and software roles in Germany and the Netherlands, compares recurring job requirements with your project evidence, and links each result back to its source. LinkedIn searches remain manual; this app does not scrape LinkedIn.

## Sources

| Source | Coverage | Credentials | Notes |
| --- | --- | --- | --- |
| Arbeitnow | Germany and Netherlands (filtering a Europe-wide feed) | None | Reads up to three pages and filters locally using your role/skill terms. The visa-only option uses its `visa_sponsorship=true` parameter. Keep the required link back to Arbeitnow on displayed listings. Its public endpoint and response fields may change. |
| Arbeitsagentur | Germany only | None | Uses a community-documented, unofficial endpoint with the public `X-API-Key` value. Search terms include common German role equivalents where available. The service is undocumented for this app and can change or fail. |
| Jooble | Germany and Netherlands | Optional `JOOBLE_API_KEY` | Skipped if no key is configured. Jooble API keys may be restricted to the country/domain used to obtain them; confirm that your key covers both markets. |
| Adzuna | Germany and Netherlands | Optional `ADZUNA_APP_ID` and `ADZUNA_APP_KEY` | Skipped if either credential is blank. |

Groq is an optional analysis provider, not a job-listing source. It analyzes up to 15 newest balanced results per search; remaining results use local keyword ranking. This keeps the request smaller for free-tier limits. Without `GROQ_API_KEY`, the app still collects listings, counts requirements, and applies keyword-based ranking.

## Setup

1. Install Node.js 20 or newer.
2. Create your local environment file from the example:

   ```sh
   cp .env.example .env
   ```

   Add whichever credentials you have to `.env`; Arbeitnow and Arbeitsagentur work without signup or card details. Adzuna and Jooble are optional. Groq enables AI analysis and resume/portfolio extraction.

3. Start the app from Terminal in this folder:

   ```sh
   npm start
   ```

4. Open <http://localhost:3000>, review the role and location filters, and click **Find matching jobs**. To filter Arbeitnow results to visa-sponsored roles, select **Visa sponsorship only**.

No npm packages are required. `.env` is excluded by `.gitignore`. Keep keys server-side in `.env` or in your hosting provider's secret settings; never put them in `public/` files or commit them.

## Publish to GitHub

Create an empty repository on GitHub (do not add a README, license, or `.gitignore` there), then, from this project folder, connect it and push:

```sh
git init -b main
git add .gitignore .env.example README.md package.json server.js public
git commit -m "Initial job search app"
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
git push -u origin main
```

Replace the remote URL with the one GitHub shows for your repository. Do not add `.env` or `data/`; both are ignored. A clone can then follow **Setup** above to create their own `.env` and start the app with `npm start`.

## Test each source separately

Start the app with `npm start` in one Terminal window. In another Terminal window, use one of these requests; each returns JSON with `jobs` and `warnings`. The optional `sources` field limits that request to one provider. Normal searches omit it and use all providers.

```sh
# Arbeitnow (no key)
curl -sS -X POST http://localhost:3000/api/search -H 'content-type: application/json' --data '{"roles":["AI Engineer"],"skills":["Python","machine learning"],"locations":["Netherlands"],"sources":["Arbeitnow"]}'

# Arbeitsagentur (Germany only, no key)
curl -sS -X POST http://localhost:3000/api/search -H 'content-type: application/json' --data '{"roles":["AI Engineer"],"skills":["Python"],"locations":["Berlin"],"sources":["Arbeitsagentur"]}'

# Jooble (requires JOOBLE_API_KEY in .env)
curl -sS -X POST http://localhost:3000/api/search -H 'content-type: application/json' --data '{"roles":["AI Engineer"],"skills":["Python"],"locations":["Netherlands"],"sources":["Jooble"]}'

# Adzuna (requires both Adzuna values in .env)
curl -sS -X POST http://localhost:3000/api/search -H 'content-type: application/json' --data '{"roles":["AI Engineer"],"skills":["Python"],"locations":["Berlin"],"sources":["Adzuna"]}'
```

For the Arbeitnow visa filter, repeat its request with `,"visaOnly":true` inside the JSON object. A warning that a source was skipped because its key is absent is expected for Jooble and Adzuna. Arbeitnow logs one raw sample job to the app's Terminal on its first successful call so its upstream fields can be inspected.

## Results and limitations

- Every provider is called independently. Missing optional keys or provider outages do not prevent other sources from returning results; provider warning details remain server-side and are not shown in the page.
- Current results are de-duplicated by source ID and normalized company/title, then selected newest-first in a balanced rotation across sources, up to 60 listings.
- Job-board searches and LinkedIn links are limited to Germany and the Netherlands. Unrecognized locations are rejected with a coverage message instead of being treated as Germany.
- Arbeitsagentur queries use German equivalents such as `KI Entwickler` and `Softwareentwickler` when available. Search relevance can vary because terms are translated approximately.
- The visa-only checkbox uses Arbeitnow's sponsorship filter and keeps results from other sources only when their listing explicitly indicates sponsorship; listings without an explicit statement are excluded.
- Arbeitnow asks API users to link back to its site; the source badge links to Arbeitnow. Its endpoint is public but should be treated as undocumented and subject to change.
- Arbeitsagentur's job search endpoint used here is unofficial/community-documented. Its schema, availability, or access behavior may change. Detail requests are limited to a few results per search to keep requests bounded.
- Jooble key coverage may be country/domain-specific. If it returns an access error, check whether your key is authorized for Germany and the Netherlands; remove the key from `.env` to skip it.
- Adzuna remains optional. Check its current [API terms](https://developer.adzuna.com/docs/terms_of_service) before publishing or using the data beyond personal job search.
- Groq receives your search preferences, project evidence, and selected job description excerpts when enabled. Keep sensitive personal data out of the profile.
- Listings are stored locally in `data/job-market.json` for up to 30 days. Use **Clear collected data** to remove the saved corpus.

## Using the app

1. In **Search jobs**, enter job titles and locations, then click **Find matching jobs**.
2. Expand **Skills and filters** to edit skills, seniority, industry, or visa sponsorship.
3. Expand **Add resume or portfolio** to import a text resume or public portfolio, or enter project evidence yourself. Review imported skills and evidence before searching.
4. Open **Market insights** to see recurring requirements and how often your evidence mentions them. **Mentioned** means the skill text was found in your saved evidence; **Not shown** means it was not found. Neither label verifies your proficiency.
5. Each result's fit percentage is an estimate based on profile/job text overlap and, when configured, Groq's analysis. It is not a hiring probability. LinkedIn links are separate manual searches filtered to the past 24 hours.

## Obtaining optional keys

- Adzuna: register an app at <https://developer.adzuna.com/> to receive an App ID and App Key.
- Jooble: request an API key through the regional Jooble API portal, for example <https://jooble.org/api/about>. Check Jooble's [REST API instructions](https://jooblehelpcenter.freshdesk.com/en/support/solutions/articles/60001448238-rest-api-documentation) for regional key restrictions.
- Groq: create an API key at <https://console.groq.com/keys>.

## Resume and portfolio evidence

In **Add resume or portfolio**, choose a `.txt` or `.md` resume, or enter a public portfolio website URL, then select **Extract profile skills & evidence**. The app extracts skills into the skills field and project/experience examples into the editable evidence box; review both before searching. These profile details contribute to the fit score and evidence explanation. PDF and DOCX uploads are not supported. This import sends the resume or fetched portfolio text to Groq, so only use material you are comfortable sharing with that provider. A `GROQ_API_KEY` is required for extraction; without it, enter evidence manually.

## Project layout

```text
job-match-agent/
├── .env                    # local secrets; create from .env.example, never commit
├── .env.example
├── .gitignore
├── package.json
├── README.md
├── server.js
├── data/                  # created at runtime; excluded from Git
└── public/
    ├── app.js
    └── index.html
```
