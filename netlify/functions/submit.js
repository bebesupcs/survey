// Netlify Serverless Function: submit.js
// Receives survey submissions from the client and forwards them to Google Apps Script (Spreadsheet)

exports.handler = async function (event, context) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json; charset=utf-8"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }

  try {
    const data = JSON.parse(event.body || "{}");
    const scriptUrl = process.env.GOOGLE_SCRIPT_URL || "https://script.google.com/macros/s/AKfycbzRi-LZcXlrzGYtUaSzfOvYNwbSDku7kphfKX7smZXotDkEUhv_yFaB4v5NwaGfsqt-/exec";
    const secret = process.env.GOOGLE_BRIDGE_SECRET || "";

    const payload = {
      action: "submit",
      secret: secret,
      id: data.id || `bebesup-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      submittedAt: data.submittedAt || new Date().toISOString(),
      version: data.version || "20261111",
      answers: data.answers || {},
      questions: data.questions || []
    };

    // Forward to Google Apps Script Web App
    const res = await fetch(scriptUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const resJson = await res.json().catch(() => ({ ok: true }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: true, id: payload.id, result: resJson })
    };
  } catch (err) {
    console.error("Submit error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ ok: false, error: err.message || String(err) })
    };
  }
};
