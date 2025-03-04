// This is a server-side proxy that would handle the request to OleOle.pl
// In a real deployment, this would be implemented as a serverless function

exports.handler = async function (event, context) {
  const url = event.queryStringParameters.url;

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    const body = await response.text();

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "text/html",
        "Access-Control-Allow-Origin": "*",
      },
      body: body,
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to fetch data from OleOle.pl" }),
    };
  }
};
