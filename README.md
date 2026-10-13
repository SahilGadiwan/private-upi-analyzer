# Private UPI Analyzer — Windows-friendly iPhone PWA starter

## Why this version?
You have a Windows PC, but building/signing a native iPhone app normally requires a Mac with Xcode. This starter is a Progressive Web App (PWA): develop on Windows, then open it in iPhone Safari and add it to the Home Screen. It can work offline after the app files have been loaded and cached.

## Privacy design
- Statement file is read in the browser with the local file picker.
- No backend, analytics, advertising, AI endpoint, bank connection, or statement upload is implemented.
- Transactions exist only in page memory in this starter. Reloading/closing clears them.
- Hosting the static app files on HTTPS is only for downloading the app code; statement files are never sent to the host by this code.
- This is a prototype and has not been independently security audited. Verify behavior with a redacted test statement first.

## Current functionality
- Dashboard, income/spending totals, basic merchant categories.
- CSV parser for common date/narration/debit/credit columns.
- Excel parser support if you add the local SheetJS `xlsx.full.min.js` library file (instructions below).
- No PDF parser in this HDFC CSV/Excel-focused phase.

## Add offline Excel support
1. On a trusted computer, obtain the official SheetJS Community Edition browser build from the official SheetJS project/documentation: https://docs.sheetjs.com/
2. Save the browser build as `xlsx.full.min.js` in this same folder, beside `index.html`.
3. The app references only this local file. Do not replace it with a CDN script tag if you want offline operation.
4. The service worker caches the main app files. After adding the library, bump the cache name in `sw.js` (e.g. `upi-analyzer-v2`) before redeploying so the new asset is picked up.
5. Check the library's license and official distribution instructions before using it beyond personal use.

## Test on Windows first
- Put the folder in a local development directory.
- For a quick CSV-only test, double-click `index.html` and load `sample-hdfc.csv`. The file picker/parser can work, but service workers require a secure context and will not be enabled by `file://`.
- For offline PWA testing, serve the folder through HTTPS or localhost. A simple local option is Python:
  `python -m http.server 8000`
  Then open `http://localhost:8000` on the PC. This is suitable for local testing only, not for installing on the iPhone over the network.
- For iPhone Home Screen installation, publish the static files to an HTTPS static host (for example, a static GitHub Pages site). This serves only the app assets. Do not add a backend/API, and never upload a statement file to the hosting repository.
- Open the HTTPS site in Safari on iPhone → Share → Add to Home Screen. Load it once while online, then test Airplane Mode.

## Sample HDFC-style CSV
The included sample is fictional and contains no real account data. The parser expects a header row with date, narration/description and debit/credit or amount columns. Actual HDFC exports vary; test a redacted sample and adjust header aliases carefully.

## Next implementation steps
1. Confirm the exact column headers in a redacted HDFC CSV.
2. Improve handling of HDFC summary rows and date formats.
3. Add XLS/XLSX local parser.
4. Add duplicate detection and user-confirmed column mapping.
5. Add PDF text extraction/OCR later.
6. Add a clear-all-data control, optional encrypted persistence, and CSV export.
