// Serverless function to proxy requests to OleOle.pl

exports.handler = async function (event, context) {
  const url = event.queryStringParameters.url;

  if (!url) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "URL parameter is required" }),
    };
  }

  try {
    console.log(`Proxying request to: ${url}`);

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml",
      },
    });

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({
          error: `Failed to fetch from website: ${response.status}`,
        }),
      };
    }

    const body = await response.text();
    console.log(`Successfully fetched HTML content, length: ${body.length}`);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "text/html",
        "Access-Control-Allow-Origin": "*",
      },
      body: body,
    };
  } catch (error) {
    console.error("Error in proxy function:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to fetch data from OleOle.pl" }),
    };
  }
};
