import { Suspense } from "react";
import { LoadingBlock } from "@/components/app/page-header";
import { CvImport } from "./cv-import";

export default function ImportCvPage() {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <CvImport />
    </Suspense>
  );
}
