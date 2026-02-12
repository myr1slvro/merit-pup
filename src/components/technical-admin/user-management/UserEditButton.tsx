import React from "react";

export default function EditButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      className="px-2 py-1 bg-immsYellow text-black rounded hover:bg-yellow-400 transition"
      onClick={onClick}
    >
      Edit
    </button>
  );
}
