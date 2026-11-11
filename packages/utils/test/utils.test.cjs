const test = require("node:test");
const assert = require("node:assert/strict");
const { parseRedisUrl, slugFromText } = require("../dist/index.js");

test("slugFromText transliterates Persian and preserves English", () => {
  assert.equal(slugFromText("لایف استایل"), "layf-astayl");
  assert.equal(slugFromText("Mindset 101"), "mindset-101");
  assert.equal(slugFromText("Mindset ۱۰۱"), "mindset-101");
});

test("parseRedisUrl reads host and database without exposing credentials", () => {
  assert.deepEqual(parseRedisUrl("rediss://user:secret@cache.example:6380/2"), {
    host: "cache.example",
    port: 6380,
    username: "user",
    password: "secret",
    db: 2,
    tls: {},
  });
  assert.throws(() => parseRedisUrl("https://cache.example"), /REDIS_URL/);
});
