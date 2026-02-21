import React, { useState, useEffect } from "react";
import { generateCertificateForUser } from "../../api/instructionalmaterial";
import { getAuthorsForIM } from "../../api/author";
import { getUserById } from "../../api/users";

interface AuthorDetail {
  user_id: number;
  name: string;
  rank: string | null;
  email: string;
}

export interface SendCertModalProps {
  imId: number;
  authToken: string;
  onClose: () => void;
}

export default function SendCertificateModal({
  imId,
  authToken,
  onClose,
}: SendCertModalProps) {
  const [authors, setAuthors] = useState<AuthorDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [statuses, setStatuses] = useState<
    Record<number, "idle" | "loading" | "success" | "error">
  >({});
  const [messages, setMessages] = useState<Record<number, string>>({});

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getAuthorsForIM(imId, authToken)
      .then(async (list) => {
        const items = Array.isArray(list) ? list : list?.data || [];
        const detailed = await Promise.all(
          items.map(async (a: any) => {
            const uid = a.user_id ?? a.userId;
            try {
              const user = await getUserById(uid, authToken);
              const name = [
                user?.first_name,
                user?.middle_name,
                user?.last_name,
              ]
                .filter(Boolean)
                .join(" ");
              return {
                user_id: uid,
                name: name || `User ${uid}`,
                rank: user?.rank || null,
                email: user?.email || "",
              };
            } catch {
              return {
                user_id: uid,
                name: `User ${uid}`,
                rank: null,
                email: "",
              };
            }
          }),
        );
        if (!cancelled) setAuthors(detailed);
      })
      .catch(() => {
        if (!cancelled) setAuthors([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [imId, authToken]);

  async function sendToAuthor(userId: number) {
    setStatuses((s) => ({ ...s, [userId]: "loading" }));
    try {
      const res = await generateCertificateForUser(imId, userId, authToken);
      if ((res as any)?.error) throw new Error((res as any).error);
      setStatuses((s) => ({ ...s, [userId]: "success" }));
      setMessages((m) => ({ ...m, [userId]: "Certificate sent!" }));
    } catch (e: any) {
      setStatuses((s) => ({ ...s, [userId]: "error" }));
      setMessages((m) => ({ ...m, [userId]: e.message || "Failed" }));
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">Send Certificates</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 text-lg leading-none"
          >
            &times;
          </button>
        </div>

        {loading ? (
          <div className="text-sm text-gray-500 py-4 text-center">
            Loading authors…
          </div>
        ) : authors.length === 0 ? (
          <div className="text-sm text-gray-400 italic py-4 text-center">
            No authors found for this IM.
          </div>
        ) : (
          <ul className="space-y-3">
            {authors.map((a) => {
              const st = statuses[a.user_id] || "idle";
              return (
                <li
                  key={a.user_id}
                  className="flex items-center gap-3 border rounded p-2"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{a.name}</div>
                    {a.rank && (
                      <div className="text-xs text-gray-500">{a.rank}</div>
                    )}
                    {a.email && (
                      <div className="text-xs text-gray-400 truncate">
                        {a.email}
                      </div>
                    )}
                    {messages[a.user_id] && (
                      <div
                        className={`text-xs mt-0.5 ${st === "success" ? "text-green-600" : "text-red-500"}`}
                      >
                        {messages[a.user_id]}
                      </div>
                    )}
                    {!a.rank && (
                      <div className="text-xs text-yellow-600 italic">
                        No rank — certificate may be incomplete
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => sendToAuthor(a.user_id)}
                    disabled={st === "loading" || st === "success"}
                    className={`text-xs px-2 py-1 rounded whitespace-nowrap ${
                      st === "success"
                        ? "bg-green-100 text-green-700 cursor-default"
                        : st === "loading"
                          ? "bg-gray-200 text-gray-500 cursor-wait"
                          : "bg-yellow-600 text-white hover:bg-yellow-700"
                    }`}
                  >
                    {st === "loading"
                      ? "Sending…"
                      : st === "success"
                        ? "Sent ✓"
                        : "Generate & Send"}
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
