# MCA Document Downloader

A production-ready web application for browsing, selecting, and ordering MCA documents through the Finanvo API (mcadownload.com).How?

---

## API Integration Map

| Feature | Finanvo Endpoint | Status | Missing Information |
|---|---|---|---|
| Login | `POST /user/login` | ✅ IMPLEMENTED | Token field name configurable via `FINANVO_TOKEN_PATH` |
| Company Search | `GET /search/company?query=` | ✅ IMPLEMENTED | Field names auto-detected, confirm after first live use |
| CIN Documents | `GET /company/cin-docs?cin=` | ✅ IMPLEMENTED | Field names auto-detected, confirm after first live use |
| Order Creation | `POST /subscription/saveCinDinPayment` | ❌ MISSING_API | Complete request payload unknown |
| Submit CIN Docs | `submit-cin-doc...` | ❌ MISSING_API | Full URL, method, payload unknown |
| Document Download | Unknown | ❌ MISSING_API | URL, method, response type unknown |

---

## Quick Start

### 1. Configure environment

```bash
cp .env.example backend/.env
```

Edit `backend/.env`:

```env
FINANVO_EMAIL=your@email.com
FINANVO_PASSWORD=yourpassword
FINANVO_TOKEN_PATH=token          # update after first login (see below)
JWT_SECRET=a-long-random-string
```

### 2. Start backend

```bash
cd backend
npm install
npm run dev       # starts on http://localhost:4000
```

### 3. Start frontend

```bash
cd frontend
npm install
npm run dev       # starts on http://localhost:5173
```

### 4. Open the app

Go to http://localhost:5173 and log in with your Finanvo account credentials.

---

## Configuring the Auth Token

After the first login attempt, if it fails with `TOKEN_EXTRACTION_FAILED`, check the backend logs.
They will show the top-level keys in the login response, e.g.:

```
[error] Token extraction failed.
  configuredPath: "token"
  topLevelKeysInResponse: ["success", "data", "message"]
  hint: Set FINANVO_TOKEN_PATH in .env to the correct path, e.g. "data.token"
```

Update `FINANVO_TOKEN_PATH` in `backend/.env` to the correct dot-notation path and restart.

---

## How to Add a Missing API Endpoint

### Step 1 — Capture from Chrome DevTools

1. Open Chrome DevTools → **Network** tab → **Fetch/XHR** filter
2. Enable **Preserve log** (checkbox at the top)
3. Sign in to [mcadownload.com](https://mcadownload.com/company) with your account
4. Perform **exactly one action** (e.g., click "Place Order")
5. Find the corresponding request in the Network list
6. Click on it and record:
   - **Request URL** (full URL including query params)
   - **Request Method** (GET/POST/PUT)
   - **Request Headers** (especially `Authorization`, `Content-Type`, any custom headers)
   - **Request Payload** (full JSON body from the "Payload" tab)
   - **Response** (from the "Response" tab — full JSON)

### Step 2 — Implement the endpoint

#### For Order Creation (`saveCinDinPayment`):

1. Open `backend/src/services/finanvo/types.ts`
2. Fill in `FinanvoCreateOrderRequest` and `FinanvoCreateOrderResponse` with the real field names
3. Open `backend/src/services/finanvo/order.service.ts`
4. Replace the `throw new Error('MISSING_API_ENDPOINT...')` in `createOrder()` with:

```typescript
export async function createOrder(input: CreateOrderInput): Promise<OrderResult> {
  const payload: FinanvoCreateOrderRequest = {
    // Map input to the real request shape you captured
    cin: input.cin,
    documentIds: input.documentIds,
    // ... other fields from the captured payload
  };

  const res = await finanvoClient.post<FinanvoCreateOrderResponse>(
    '/subscription/saveCinDinPayment',
    payload,
  );

  return {
    orderId: String(res.data.orderId ?? ''),   // use actual field name
    status: String(res.data.status ?? ''),
    totalAmount: Number(res.data.totalAmount ?? 0),
    currency: 'INR',
    paymentUrl: res.data.paymentUrl as string | undefined,
    raw: res.data,
  };
}
```

5. Update `INTEGRATION_STATUS.orderCreation` in `types.ts` to `'IMPLEMENTED'`

#### For Document Download:

1. Fill in `FinanvoDownloadRequest` and `FinanvoDownloadResponse` in `types.ts`
2. Open `backend/src/services/finanvo/download.service.ts`
3. Implement `downloadDocumentStream()`:

```typescript
export async function downloadDocumentStream(input: DownloadDocumentInput) {
  const res = await finanvoClient.getStream(
    `/path/to/download/${input.documentId}`,  // use real URL
  );
  const fileName = extractFileName(res.headers) ?? `${input.documentId}.pdf`;
  const mimeType = res.headers['content-type'] ?? 'application/pdf';
  return { stream: res.data, fileName, mimeType };
}
```

### Step 3 — Test it

```bash
cd backend
npm test
```

---

## Project Structure

```
mca-downloader/
├── backend/
│   ├── src/
│   │   ├── config/          # env.ts, logger.ts
│   │   ├── controllers/     # auth, company, document, order, download
│   │   ├── middleware/       # auth, errorHandler
│   │   ├── routes/          # one file per resource
│   │   ├── services/
│   │   │   ├── finanvo/     # finanvo.client.ts + 5 service files
│   │   │   ├── db.service.ts
│   │   │   └── pricing.service.ts
│   │   └── utils/           # cin.ts, sanitize.ts, response.ts
│   └── tests/               # jest + ts-jest tests
└── frontend/
    └── src/
        ├── components/      # Layout, CompanyCard, DocumentTable, OrderSummary, etc.
        ├── hooks/           # useAuth, useDocuments
        ├── pages/           # Login, Search, Documents, Orders, Downloads, Status
        ├── services/        # api.ts (axios wrappers)
        └── types/           # shared TypeScript types
```

---

## API Routes (Our Backend)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/login` | — | Login with Finanvo credentials |
| POST | `/api/auth/logout` | ✓ | Logout and clear session |
| GET | `/api/auth/status` | ✓ | Check session status |
| GET | `/api/companies/search?q=` | ✓ | Search companies |
| GET | `/api/companies/:cin/documents` | ✓ | Get documents for a CIN |
| POST | `/api/orders/calculate` | ✓ | Preview order total |
| POST | `/api/orders` | ✓ | Place order (MISSING API) |
| GET | `/api/orders` | ✓ | List orders |
| POST | `/api/downloads` | ✓ | Queue document downloads (MISSING API) |
| GET | `/api/downloads` | ✓ | Download status + history |
| GET | `/api/downloads/stream/:id` | ✓ | Stream a file (MISSING API) |
| GET | `/api/integration-status` | — | API integration map |
| GET | `/api/health` | — | Health check |

---

## Security

- Finanvo credentials are **never** sent to the browser
- All Finanvo API calls are proxied through the backend
- Session tokens use JWT with configurable expiry
- Passwords and tokens are redacted from all logs
- Rate limiting: 200 requests / 15 min
- Helmet + CORS configured

---

## Running Tests

```bash
cd backend
npm test
```

Tests cover: CIN validation, pricing calculation, company search normalization, document parsing, download queue. All external API calls are mocked — tests do not hit the live API.

---

## Environment Variables Reference

| Variable | Default | Description |
|---|---|---|
| `FINANVO_BASE_URL` | `https://api5.finanvo.in` | Finanvo API base URL |
| `FINANVO_EMAIL` | — | Your Finanvo account email |
| `FINANVO_PASSWORD` | — | Your Finanvo account password |
| `FINANVO_TOKEN_PATH` | `token` | Dot-notation path to token in login response |
| `FINANVO_TIMEOUT_MS` | `30000` | API request timeout in ms |
| `JWT_SECRET` | — | Secret for our own session JWTs |
| `JWT_EXPIRES_IN` | `8h` | Session token lifetime |
| `CLIENT_URL` | `http://localhost:5173` | Frontend origin for CORS |
| `DOWNLOADS_DIR` | `./downloads` | Local directory for saved files |
| `DB_PATH` | `./data/db.json` | JSON database file path |
| `DOWNLOAD_CONCURRENCY` | `3` | Max parallel downloads |
| `DEBUG_API` | `false` | Log sanitized request/response data |





## License

This project was built under a freelance contract for **Technowire Data Science**.
All rights reserved. Not open for redistribution.

