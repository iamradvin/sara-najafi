export function formatTomanAmount(amount: number): string {
  return new Intl.NumberFormat("fa-IR").format(amount).replace(/[٬,]/gu, "/");
}
