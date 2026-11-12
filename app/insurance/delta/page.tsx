import { FileSpreadsheet } from "lucide-react";

import { PageHeader } from "@/app/_components/page-header";
import { PolicyDeltaUpload } from "@/app/_components/policy-delta-upload";
import { listInsuranceProviders } from "@/db/actions/insuranceProviders";

export default async function PolicyUpdatePage() {
    const providers = await listInsuranceProviders();
    return (
        <section className="min-h-screen bg-[#f7f8fa] px-6 py-8 lg:px-10">
            <div className="mx-auto max-w-375 space-y-8">
                <PageHeader section="Insurance" title="Policy Update" icon={<FileSpreadsheet className="h-6 w-6" />} />
                <PolicyDeltaUpload providers={providers.filter(({ type }) => type === "CMP").map(({ id, label }) => ({ id, label }))} />
            </div>
        </section>
    );
}