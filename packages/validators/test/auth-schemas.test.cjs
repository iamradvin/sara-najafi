const test = require("node:test");
const assert = require("node:assert/strict");
const {
  requestSmsOtpSchema,
  verifySmsOtpSchema,
} = require("../dist/index.js");

test("phone registration validates the name and normalizes Persian phone digits", () => {
  assert.deepEqual(
    requestSmsOtpSchema.parse({
      name: "  سروش  ",
      phone: "۰۹۱۲۳۴۵۶۷۸۹",
      mode: "register",
    }),
    { name: "سروش", phone: "09123456789", mode: "register" },
  );
});

test("phone login requires only a valid phone number", () => {
  assert.deepEqual(
    requestSmsOtpSchema.parse({ phone: "+989123456789", mode: "login" }),
    { phone: "+989123456789", mode: "login" },
  );
  assert.equal(requestSmsOtpSchema.safeParse({ phone: "not-a-phone", mode: "login" }).success, false);
});

test("OTP schemas normalize Persian digits", () => {
  assert.equal(
    requestSmsOtpSchema.parse({ phone: "۰۹۱۲۳۴۵۶۷۸۹", mode: "login" }).phone,
    "09123456789",
  );
  assert.equal(
    verifySmsOtpSchema.parse({
      phone: "09123456789",
      code: "۱۲۳۴۵۶",
      mode: "login",
    }).code,
    "123456",
  );
});
