import { PrivateShell } from "@/components/layout/PrivateShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { SettingsForm } from "@/components/settings/SettingsForm";
import { getOwnerSettings } from "@/lib/data/catalog";

export const metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  const ownerSettings = await getOwnerSettings();

  return (
    <PrivateShell>
      <div className="space-y-6">
        <PageHeader
          description="Owner preferences for legal-safe discovery and playback defaults."
          eyebrow="Owner settings"
          title="Settings"
        />
        <SettingsForm settings={ownerSettings} />
      </div>
    </PrivateShell>
  );
}
