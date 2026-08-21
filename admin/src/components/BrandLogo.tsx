import logoOnLight from "../assest/Audio Studio Green Tech Logo.jpg";
import logoOnDark from "../assest/Audio_Studio_Green_Tech_Logo-removebg-preview.png";
import type { ImgHTMLAttributes } from "react";

export const logos = {
  onLight: logoOnLight,
  onDark: logoOnDark,
};

type Props = {
  variant: "on-dark" | "on-light";
  className?: string;
  alt?: string;
} & Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt">;

export default function BrandLogo({ variant, className = "", alt = "Qaari", ...rest }: Props) {
  const src = variant === "on-dark" ? logos.onDark : logos.onLight;
  return <img src={src} alt={alt} className={`brand-logo ${variant} ${className}`.trim()} {...rest} />;
}
