import https from 'https';

const projectId = "gen-lang-client-0540458865";
const databaseId = "ai-studio-4a979274-342b-4287-b883-d3e04cdd124b";
const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/ledger_entries?pageSize=10`;

https.get(url, (res) => {
  let data = '';
  console.log("Status Code:", res.statusCode);
  console.log("Headers:", JSON.stringify(res.headers, null, 2));
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log("Raw Response:", data);
  });
}).on('error', (err) => {
  console.error("HTTP request error:", err);
});
