import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { FarazSmsService } from "../dist/src/auth/faraz-sms.service.js";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

function createService(overrides = {}) {
  const values = {
    FARAZ_SMS_API_KEY: "test-api-key",
    FARAZ_SMS_PATTERN: "test-pattern",
    FARAZ_SMS_SENDER: "50002178584000",
    ...overrides,
  };
  return new FarazSmsService({
    get: (name, fallback) => values[name] ?? fallback,
  });
}

test("sends an OTP using FarazSMS's immediate pattern API contract", async () => {
  let request;
  globalThis.fetch = async (url, options) => {
    request = { url, options };
    return new Response(JSON.stringify({ status: "success", data: 1, messages: null }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  };

  await createService().sendOtp("+989121234567", "123456");

  assert.equal(request.url, "https://api.iranpayamak.com/ws/v1/sms/pattern");
  assert.equal(request.options.headers["Api-Key"], "test-api-key");
  assert.deepEqual(JSON.parse(request.options.body), {
    code: "test-pattern",
    recipient: "09121234567",
    attributes: { code: "123456" },
    line_number: "50002178584000",
    number_format: "english",
  });
});

test("rejects unsuccessful provider responses", async () => {
  globalThis.fetch = async () => new Response(
    JSON.stringify({ status: "error", data: null, messages: "rejected" }),
    { status: 201, headers: { "Content-Type": "application/json" } },
  );

  await assert.rejects(
    createService().sendOtp("+989121234567", "123456"),
    /تنظیمات پترن یا خط ایران‌پیامک/,
  );
});

test("rejects incomplete provider configuration before making a request", async () => {
  let requested = false;
  globalThis.fetch = async () => {
    requested = true;
    return new Response(null, { status: 201 });
  };

  await assert.rejects(
    createService({ FARAZ_SMS_SENDER: "" }).sendOtp("+989121234567", "123456"),
    /تنظیمات پیامک ورود کامل نشده است/,
  );
  assert.equal(requested, false);
});
