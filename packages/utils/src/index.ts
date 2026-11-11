const persianLetters: Record<string, string> = {
  آ: "aa", ا: "a", ب: "b", پ: "p", ت: "t", ث: "s", ج: "j", چ: "ch",
  ح: "h", خ: "kh", د: "d", ذ: "z", ر: "r", ز: "z", ژ: "zh", س: "s",
  ش: "sh", ص: "s", ض: "z", ط: "t", ظ: "z", ع: "a", غ: "gh", ف: "f",
  ق: "gh", ک: "k", گ: "g", ل: "l", م: "m", ن: "n", و: "v", ه: "h",
  ی: "y", ء: "a", ئ: "y", ؤ: "v", أ: "a", إ: "e", ك: "k", ي: "y",
};

export function slugFromText(value: string): string {
  const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
  const arabicDigits = "٠١٢٣٤٥٦٧٨٩";
  const transliterated = Array.from(value.normalize("NFKC"), (character) => {
    const persianDigit = persianDigits.indexOf(character);
    if (persianDigit !== -1) return String(persianDigit);
    const arabicDigit = arabicDigits.indexOf(character);
    if (arabicDigit !== -1) return String(arabicDigit);
    return persianLetters[character] ?? character;
  }).join("");

  return transliterated
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 180)
    .replace(/-+$/g, "");
}

export function parseRedisUrl(redisUrl: string) {
  const url = new URL(redisUrl);
  if (url.protocol !== "redis:" && url.protocol !== "rediss:") {
    throw new Error("REDIS_URL must use the redis:// or rediss:// protocol.");
  }

  const database = url.pathname.length > 1 ? Number(url.pathname.slice(1)) : 0;
  if (!Number.isInteger(database) || database < 0) {
    throw new Error("REDIS_URL must use a non-negative integer database index.");
  }

  return {
    host: url.hostname,
    port: url.port ? Number(url.port) : 6379,
    username: url.username ? decodeURIComponent(url.username) : undefined,
    password: url.password ? decodeURIComponent(url.password) : undefined,
    db: database,
    ...(url.protocol === "rediss:" ? { tls: {} } : {}),
  };
}
