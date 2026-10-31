import { FileSpreadsheet } from "lucide-react";

import { PageHeader } from "@/app/_components/page-header";
import { PolicyDeltaUpload } from "@/app/_components/policy-delta-upload";

export default function PolicyUpdatePage() {
    return (
        <section className="min-h-screen bg-[#f7f8fa] px-6 py-8 lg:px-10">
            <div className="mx-auto max-w-375 space-y-8">
                <PageHeader section="Insurance" title="Policy Update" icon={<FileSpreadsheet className="h-6 w-6" />} />
                <PolicyDeltaUpload />
            </div>
        </section>
    );
}