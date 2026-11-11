import Image from "next/image";

export function BrandLogo({ size = 52 }: Readonly<{ size?: number }>) {
  return (
    <span aria-hidden="true" className="brand-logo">
      <Image
        alt=""
        className="brand-logo__dark"
        height={size}
        src="/sara-najafi-mark-dark.png"
        width={size}
      />
      <Image
        alt=""
        className="brand-logo__light"
        height={size}
        src="/sara-najafi-mark-light.png"
        width={size}
      />
    </span>
  );
}
