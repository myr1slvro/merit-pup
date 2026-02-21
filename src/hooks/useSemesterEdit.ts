import { useState, useEffect } from "react";
import { updateInstructionalMaterial } from "../api/instructionalmaterial";

export function useSemesterEdit(
  imId: number,
  initialSemester: string,
  authToken?: string,
  onToast?: (type: "success" | "error", text: string) => void,
) {
  const [semester, setSemester] = useState(initialSemester);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSemester(initialSemester);
  }, [initialSemester]);

  async function save() {
    if (!authToken) return;
    setSaving(true);
    try {
      const res = await updateInstructionalMaterial(
        imId,
        { semester },
        authToken,
      );
      if (res?.error) throw new Error(res.error);
      setEditing(false);
      onToast?.("success", "Semester updated");
    } catch (e: any) {
      onToast?.("error", e.message || "Failed to save semester");
    } finally {
      setSaving(false);
    }
  }

  function cancel() {
    setSemester(initialSemester);
    setEditing(false);
  }

  return { semester, setSemester, editing, setEditing, saving, save, cancel };
}
