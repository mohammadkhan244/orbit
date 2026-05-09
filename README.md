# ORBIT

Personal relationship cartography. Maps proximity, not activity.

The AI populates the system. It is not the system. The orbit map exists and persists without any AI calls.

---

## ENV Variables

| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | Your Anthropic API key — powers SEARCH and SUGGEST |
| `SHEETS_WEBHOOK_URL` | Google Apps Script web app URL — see setup below |

Add to Vercel:

```bash
vercel env add ANTHROPIC_API_KEY production
vercel env add SHEETS_WEBHOOK_URL production
vercel --prod --yes
```

---

## Google Sheets Setup

### 1. Create the sheet

1. Create a new Google Sheet at [sheets.google.com](https://sheets.google.com)
2. Rename the first tab to exactly: `contacts`
3. Add this header row (row 1, exact column order):

```
id | name | role | why | url | platform | status | notes | interaction_log | date_added | search_hash | created_at
```

### 2. Add the Apps Script webhook

1. Open **Extensions → Apps Script**
2. Delete all existing code and paste the following:

```javascript
const SHEET_NAME = 'contacts'
const COLS = [
  'id','name','role','why','url','platform',
  'status','notes','interaction_log',
  'date_added','search_hash','created_at'
]

function doGet(e) {
  if (e.parameter.action === 'getAll') {
    const sheet  = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME)
    const values = sheet.getDataRange().getValues()
    const rows   = values.slice(1).map(r => r.map(String))
    return json({ rows })
  }
  return json({ error: 'unknown action' })
}

function doPost(e) {
  const body = JSON.parse(e.postData.contents)

  if (body.action === 'add') {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME)
    sheet.appendRow(body.row)
    return json({ ok: true })
  }

  if (body.action === 'update') {
    const sheet  = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME)
    const values = sheet.getDataRange().getValues()
    for (let i = 1; i < values.length; i++) {
      if (String(values[i][0]) === body.id) {
        for (const [key, val] of Object.entries(body.fields)) {
          const col = COLS.indexOf(key)
          if (col >= 0) sheet.getRange(i + 1, col + 1).setValue(val)
        }
        break
      }
    }
    return json({ ok: true })
  }

  return json({ error: 'unknown action' })
}

function json(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON)
}
```

3. Click **Save** (Ctrl+S / Cmd+S)

### 3. Deploy as a web app

1. Click **Deploy → New deployment**
2. Click the gear icon → select **Web app**
3. Set:
   - Description: `ORBIT webhook`
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Click **Deploy**
5. Copy the **Web app URL** — it looks like `https://script.google.com/macros/s/ABC.../exec`

### 4. Wire it to Vercel

```bash
vercel env add SHEETS_WEBHOOK_URL production
# paste the web app URL when prompted
vercel --prod --yes
```

---

## Offline behavior

ORBIT works fully without Sheets. Every write is mirrored to `localStorage` immediately. If Sheets is unreachable, operations queue locally and flush automatically on the next successful connection.

---

## EWS Integration

In the **SEARCH** view, click **+ Include EWS context** and paste your EWS story into the expanded textarea. ORBIT injects this into the identity pack before every AI call, surfacing people who are more likely to resonate with your specific worldview — not just your stated interests.

---

## Stages

| Ring | Stage | Meaning |
|---|---|---|
| 4 (outer) | Identified | On your radar |
| 3 | Reached Out | Contact made |
| 2 | Replied | They responded |
| 1 (inner) | Conversation | Active relationship |

Movement is always inward. Getting someone closer to center is the goal.
