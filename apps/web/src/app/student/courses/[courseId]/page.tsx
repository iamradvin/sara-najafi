import { DashboardShell } from "@/components/dashboard-shell";
import { StudentCourseLearning } from "@/components/student-course-learning";

export const metadata = { title: "یادگیری دوره | سارا نجفی" };

export default async function StudentCourseLearningPage({
  params,
}: Readonly<{ params: Promise<{ courseId: string }> }>) {
  const { courseId } = await params;
  return (
    <DashboardShell type="student">
      <StudentCourseLearning courseId={courseId} />
    </DashboardShell>
  );
}
