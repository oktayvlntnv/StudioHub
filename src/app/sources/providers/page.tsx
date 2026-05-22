import { PrivateShell } from "@/components/layout/PrivateShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProviderManagementPanel } from "@/components/sources/ProviderManagementPanel";
import { getProviders } from "@/lib/data/catalog";

export const metadata = {
  title: "Official Providers",
};

export default async function ProvidersPage() {
  const providers = await getProviders();

  return (
    <PrivateShell>
      <div className="space-y-6">
        <PageHeader
          description="Manage official provider metadata, default playback behavior, access labels, and country availability."
          eyebrow="Owner/admin"
          title="Official Providers"
        />
        <ProviderManagementPanel providers={providers} />
      </div>
    </PrivateShell>
  );
}
