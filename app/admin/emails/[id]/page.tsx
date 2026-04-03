import { notFound } from "next/navigation";
import { getEmailBroadcast } from "@/actions/emails";
import { EmailComposer } from "@/components/admin/emails/EmailComposer";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminEmailPage({ params }: Props) {
  const { id } = await params;
  const email = await getEmailBroadcast(id);
  if (!email) notFound();

  return <EmailComposer email={email} />;
}
