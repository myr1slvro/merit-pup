import React, { FC, ReactNode } from "react";

type SidebarItem =
  | { type?: "item"; icon: ReactNode; name: string; }
  | { type: "divider" };

interface SidebarProps {
  items: SidebarItem[];
  onItemClick?: (item: SidebarItem) => void;
  activeTab?: string;
}

const Sidebar: FC<SidebarProps> = ({ items, onItemClick, activeTab }) => {
  return (
    <div className="h-full w-1/4 p-8 bg-white shadow-md rounded-3xl">
      {items.map((item, idx) => {
        if ("type" in item && item.type === "divider") {
          return <hr key={idx} className="my-3 border-t border-gray-300" />;
        }
        const isActive = activeTab === item.name;
        return (
          <button
            key={idx}
            type="button"
            onClick={() => onItemClick && onItemClick(item)}
            className={`flex items-center gap-2 py-2 px-3 rounded transition-colors w-full text-left ${
              isActive ? "bg-gray-200 font-bold" : "hover:bg-gray-100"
            }`}
            style={{ outline: "none", border: "none", background: "none" }}
          >
            <span>{item.icon}</span>
            <span>{item.name}</span>
          </button>
        );
      })}
    </div>
  );
};

export default Sidebar;
