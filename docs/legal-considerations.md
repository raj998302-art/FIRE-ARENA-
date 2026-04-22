# Legal considerations (India-focused)

**This is not legal advice.** Consult a qualified Indian lawyer before operating a real-money platform.

## Gambling / skill-gaming law
- Indian states differ. Assam, Andhra Pradesh, Telangana, Nagaland, Sikkim, Tamil Nadu have restrictions or explicit bans on real-money fantasy/esports games (status changes frequently).
- "Game of skill" vs "game of chance" doctrine is litigated per format — even skill-based contests can be banned in specific states.
- MeitY IT Amendment Rules 2023 create a framework for Online Gaming Intermediaries + Self-Regulatory Bodies. Rules are still being operationalised.

## Tax
- 28% GST on the **full face value of deposits** applies to online money gaming (effective Oct 2023). Your pricing must account for this.
- TDS on winnings (Section 194BA) — withhold 30% on net winnings per user per year.

## Payments (RBI / Razorpay)
- Razorpay requires a registered Indian entity, GSTIN, and a gaming-MCC underwriting approval before enabling real-money flows. Test keys work without this, live keys do not.
- RBI / NPCI guidelines on merchant category codes must be followed. "Gambling" MCCs are blocked by default on many issuers.

## KYC / AML
- PMLA and FIU-IND require KYC for payouts above thresholds and suspicious-transaction reporting. You need a KYC provider (DigiLocker / Karza / IDfy / Signzy / HyperVerge) integrated before withdrawals go live.
- Self-exclusion and responsible-gaming surfaces must be in-product.

## Data & privacy
- DPDP Act 2023: collect only necessary data, get explicit consent, appoint a DPO if you qualify as a Significant Data Fiduciary, publish a privacy policy (one is included in `/index.html`), honor data-subject rights.

## T&Cs / content
- Publish Terms of Service, Privacy Policy, Refund/Cancellation, Anti-fraud, Responsible Gaming, Grievance Officer contact per IT Rules.
- Tournament rules must be deterministic and published before a contest opens.

## What this repo does / doesn't do
- Does not implement KYC, GST, TDS, or any responsible-gaming surface. These must be added before go-live.
- Does implement payment verification (Razorpay HMAC) and a UTR-based manual flow with duplicate detection. That is the tech layer only, not the compliance layer.
