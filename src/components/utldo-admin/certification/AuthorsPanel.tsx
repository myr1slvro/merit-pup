import React from "react";
import { AuthorInfo } from "../../../types/certificate";

interface Props {
  authors: AuthorInfo[];
  loading: boolean;
  onEditClick: () => void;
}

/**
 * Displays the list of authors for an IM with rank badges and an edit trigger.
 */
export default function AuthorsPanel({ authors, loading, onEditClick }: Props) {
  return (
    <div className="border rounded p-2 bg-gray-50 text-xs">
      <div className="flex items-center justify-between mb-1">
        <span className="font-semibold text-gray-700">Authors</span>
        <button
          type="button"
          onClick={onEditClick}
          className="text-xs text-blue-600 underline hover:text-blue-800"
        >
          Edit Authors
        </button>
      </div>
      {loading ? (
        <div className="text-gray-400">Loading authors…</div>
      ) : authors.length === 0 ? (
        <div className="text-gray-400 italic">No authors found</div>
      ) : (
        <ul className="space-y-1">
          {authors.map((a) => (
            <li key={a.user_id} className="flex items-center gap-2">
              <span className="font-medium">{a.name}</span>
              {a.rank ? (
                <span className="bg-blue-100 text-blue-700 rounded px-1 py-0.5 text-xs">
                  {a.rank}
                </span>
              ) : (
                <span className="text-yellow-600 italic">No rank set</span>
              )}
              {a.email && <span className="text-gray-500">{a.email}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
