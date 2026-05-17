// app/admin/reviews/page.tsx

import ReviewView from "./_components/review-view";

export const metadata = {
  title: "Reviews | Admin",
  description: "Manage product reviews and customer feedback",
};

export default function ReviewsPage() {
  return <ReviewView />;
}