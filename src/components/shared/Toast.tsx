import { useEffect } from "react";

export interface ToastMessage {
  id: number;
  type: "success" | "error" | "info";
  text: string;
  duration?: number; // ms
}

export default function ToastContainer({
  messages,
  remove,
}: {
  messages: ToastMessage[];
  remove: (id: number) => void;
}) {
  useEffect(() => {
    messages.forEach((msg) => {
      if (msg.duration !== 0) {
        const t = setTimeout(() => remove(msg.id), msg.duration || 4000);
        return () => clearTimeout(t);
      }
    });
  }, [messages, remove]);
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
      {messages.map((m) => (
        <div
          key={m.id}
          className={`px-4 py-2 rounded shadow text-sm text-white select-none cursor-pointer transition-opacity bg-${
            m.type === "success" ? "green" : m.type === "error" ? "red" : "blue"
          }-600`}
          onClick={() => remove(m.id)}
        >
          {m.text}
        </div>
      ))}
    </div>
  );
}
