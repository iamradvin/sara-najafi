import { DashboardShell } from "@/components/dashboard-shell";
import { SecureLessonPlayer } from "@/components/secure-lesson-player";

export const metadata = { title: "پخش درس | سارا نجفی" };

export default async function StudentLessonPage({
  params,
}: Readonly<{ params: Promise<{ lessonId: string }> }>) {
  const { lessonId } = await params;
  return (
    <DashboardShell type="student">
      <SecureLessonPlayer lessonId={lessonId} />
    </DashboardShell>
  );
}
