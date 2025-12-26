import StarRating from "./star-rating";

interface Props {
  stats: {
    totalReviews: number;
    average: number | string;
    breakdown: { star: number; count: number; percentage: number }[];
  };
}

export default function ReviewSummary({ stats }: Props) {
  return (
    <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
      <div className="flex items-center gap-4 mb-6">
        <div className="text-center">
          <span className="text-5xl font-bold text-slate-900">{stats.average}</span>
          <div className="flex justify-center my-2">
            <StarRating rating={Number(stats.average)} size={20} />
          </div>
          <p className="text-sm text-slate-500">{stats.totalReviews} Reviews</p>
        </div>
        
        <div className="flex-1 space-y-2 border-l border-gray-200 pl-6">
          {stats.breakdown.map((item) => (
            <div key={item.star} className="flex items-center gap-3 text-sm">
              <span className="w-3 font-medium">{item.star}</span>
              <StarRating rating={1} size={12} />
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-yellow-400 rounded-full" 
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
              <span className="w-8 text-right text-slate-400 text-xs">{item.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}