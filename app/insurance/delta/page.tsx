import { Triangle } from "lucide-react";
import { PageHeader } from "@/app/_components/page-header";

export default async function PolicyUpdatePage() {
    return (
        <section className="min-h-screen bg-[#f7f8fa] px-6 py-8 lg:px-10">
            <div className="mx-auto max-w-375">
                <PageHeader section="Insurance" title="Policy Update" icon={<Triangle className="h-6 w-6" aria-hidden="true" />} />
            </div>
        </section>
    );
}