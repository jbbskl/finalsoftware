import assert from "node:assert";

const base = "http://localhost:3000";

async function head(path, cookie="") {
  const res = await fetch(base + path, {
    method: "HEAD",
    redirect: "manual",
    headers: cookie ? { cookie } : {},
  });
  return { status: res.status, loc: res.headers.get("location") };
}

(async () => {
  // unauth root -> /login
  let r = await head("/");
  assert([301,302,307,308].includes(r.status)); assert(r.loc === "/login");

  // simulate auth by sending the SAME cookie names as demo-login sets
  const ck = "uid=test-1; email=creator@example.com; role=creator";

  // auth root -> /client
  r = await head("/", ck);
  assert([301,302,307,308].includes(r.status)); assert(r.loc === "/client");

  // alias
  r = await head("/dashboard", ck);
  assert([301,302,307,308].includes(r.status)); assert(r.loc === "/client");

  console.log("Smoke OK");
})();
