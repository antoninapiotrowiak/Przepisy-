
export async function onRequest(context) {
  const { request, env } = context;

  // Obsługa zapytania OPTIONS (CORS preflight, gdyby było potrzebne)
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Wymagana metoda POST" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.json();
    const prompt = body.prompt;

    if (!prompt) {
      return new Response(JSON.stringify({ error: "Brak promptu" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Brak skonfigurowanego klucza API w Cloudflare" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Wywołanie oficjalnego API Gemini
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;


    const apiResponse = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await apiResponse.json();

    if (!apiResponse.ok) {
      return new Response(JSON.stringify({ error: data.error?.message || "Błąd API Google" }), {
        status: apiResponse.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Wyciągnięcie tekstu odpowiedzi z formatu Gemini
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "Brak odpowiedzi od AI.";

    return new Response(JSON.stringify({ text: textResponse }), {
      status: 200,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: "Błąd serwera: " + err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
