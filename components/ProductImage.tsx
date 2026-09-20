import Image from "next/image";

type ProductImageProps = {
  src?: string | null;
  alt: string;
  className?: string;
  priority?: boolean;
};

export function ProductImage({ src, alt, className = "", priority = false }: ProductImageProps) {
  return (
    <div className={`relative overflow-hidden bg-slate-100 ${className}`}>
      <Image
        src={src || "/placeholder-product.svg"}
        alt={alt}
        fill
        priority={priority}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        className="object-cover"
        unoptimized
      />
    </div>
  );
}
