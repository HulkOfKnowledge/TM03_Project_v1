/**
 * Quiz Layout Component
 * Interactive quiz interface with progress tracking
 */


interface QuizLayoutProps {
  id: string;
  category: string;
  topic: string;
}

export function QuizLayout({ id, category, topic }: QuizLayoutProps) {

   return (
    <div className="space-y-6">
      <p> Quiz Layout: {id}, {category}, {topic}</p>
    </div>
  );
}
