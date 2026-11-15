import { eq } from "drizzle-orm";

import { db } from "../index";
import { medicalRecords } from "../schemas";

type DatabaseTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export function touchMedicalRecord(tx: DatabaseTransaction, recordId: number) {
  const [record] = tx
    .update(medicalRecords)
    .set({ lastUpdated: new Date(), lastUpdater: "USER" })
    .where(eq(medicalRecords.id, recordId))
    .returning({ id: medicalRecords.id })
    .all();
  if (!record) throw new Error("Medical record not found.");
}
