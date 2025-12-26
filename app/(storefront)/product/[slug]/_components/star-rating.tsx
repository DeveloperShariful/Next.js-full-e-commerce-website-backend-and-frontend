import { Star } from "lucide-react";

interface Props {
  rating: number;
  size?: number;
  interactive?: boolean;
  onRate?: (rating: number) => void;
}

export default function StarRating({ rating, size = 16, interactive = false, onRate }: Props) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          className={`
            ${interactive ? "cursor-pointer transition-colors hover:fill-yellow-400 hover:text-yellow-400" : ""}
            ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
          `}
          onClick={() => interactive && onRate && onRate(star)}
        />
      ))}
    </div>
  );
}