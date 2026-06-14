// Vercel Serverless Function - Proxy to Google Apps Script backend
export default async function handler(req, res) {
  // Handle CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  // Only allow POST
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const BACKEND_URL = process.env.GOOGLE_APPS_SCRIPT_URL;

  if (!BACKEND_URL) {
    console.error("GOOGLE_APPS_SCRIPT_URL environment variable not set");
    res.status(500).json({
      success: false,
      message: "Backend not configured",
    });
    return;
  }

  try {
    console.log("Forwarding request to backend...");

    // Forward request to Google Apps Script
    const response = await fetch(BACKEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();

    res.status(200).json(data);
  } catch (error) {
    console.error("Proxy error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Backend error",
    });
  }
}
