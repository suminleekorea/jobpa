# Contributing to JobPA

Thanks for checking out JobPA. The project is focused on candidate-side Career Ops and AI-assisted job-search workflows.

## Product Scope

Good contributions usually improve one of these areas:

- Career Ops dashboard clarity
- AI Career Assistant quality and safety
- Resume parsing and job-fit analysis
- Mobile usability
- Accessibility
- Documentation and launch assets

Please avoid contributions that add:

- Auto-apply behavior
- Credential collection for third-party job boards
- Login bypassing or scraping that violates platform terms
- Unverified legal, visa, salary, immigration, or tax advice

## Local Development

```bash
pnpm install
cp .env.example .env
pnpm run dev
```

Before opening a pull request:

```bash
pnpm run check
pnpm test
pnpm run build
```

## Pull Request Notes

- Keep changes focused.
- Add tests for parser, server, or data-transform changes when practical.
- Include screenshots for visible UI changes.
- Explain any AI prompt or safety behavior changes clearly.

## Safety Standard

JobPA is guidance software. AI outputs should help users make better decisions, not replace official legal, immigration, tax, employment, or salary advice.
