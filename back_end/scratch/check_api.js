const http = require("http");

http.get("http://localhost:5000/api/products?limit=12&sortBy=-soldCount", (res) => {
  let data = "";
  res.on("data", (chunk) => data += chunk);
  res.on("end", () => {
    try {
      const json = JSON.parse(data);
      console.log("Status Code:", res.statusCode);
      console.log("Response JSON:", JSON.stringify(json, null, 2));
    } catch (e) {
      console.log("Raw Response Error:", e.message);
      console.log("Raw Response:", data);
    }
  });
}).on("error", (err) => {
  console.error("Error:", err.message);
});
