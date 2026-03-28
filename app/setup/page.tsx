import { SetupForm } from "@/components/setup/SetupForm";

export default function SetupPage({
  searchParams,
}: {
  searchParams: { mode?: string };
}) {
  return <SetupForm initialMode={searchParams.mode} />;
}