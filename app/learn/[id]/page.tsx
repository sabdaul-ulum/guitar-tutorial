import { notFound } from 'next/navigation';
import { LESSONS } from '../../../features/learning/domain/curriculum.ts';
import LessonPage from '../../../features/learning/components/LessonPage.tsx';
export function generateStaticParams() {
  return LESSONS.map(lesson => ({
    id: lesson.id
  }));
}
export const dynamicParams = false;
export default async function LearnLessonPage({
  params
}: { params: Promise<{ id: string }> }) {
  const {
    id
  } = await params;
  const lesson = LESSONS.find(item => item.id === id);
  if (!lesson) {
    notFound();
  }
  return <LessonPage key={id} lesson={lesson} />;
}
