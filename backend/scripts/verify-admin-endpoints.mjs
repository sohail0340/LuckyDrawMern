const base = "http://localhost:5000/api";
const email = "kaptanluckydraw@gmail.com";
const password = "KaptanLuckyDraw_937$AdminPannel##";

async function run() {
  const loginRes = await fetch(base + "/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: email, password }),
  });

  const loginText = await loginRes.text();
  console.log("LOGIN", loginRes.status, loginText);
  if (!loginRes.ok) process.exit(1);

  const token = JSON.parse(loginText).token;
  for (const path of ["/admin/settings", "/admin/contact"]) {
    const res = await fetch(base + path, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const text = await res.text();
    console.log(path, res.status, text);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
