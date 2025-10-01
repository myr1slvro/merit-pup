import PimecDirectory from "./PimecDirectory";
import EvaluatorRecent from "./evaluatorRecent";
import EvaluatorRecBin from "./evaluatorRecBin";
import Sidebar from "../navigation/Sidebar";
import { BiSolidHome, BiSolidTrash } from "react-icons/bi";
import { IoLibrarySharp } from "react-icons/io5";
import { IoIosTimer } from "react-icons/io";

import React, { useState } from "react";

export default function evaluatorRoleContent() {
  const [activeTab, setActiveTab] = useState("Directory");

  const sidebarItems = [
    {
      icon: <IoLibrarySharp size={20} />,
      name: "Directory",
    },
    {
      icon: <IoIosTimer size={20} />,
      name: "Recent",
    },
    { type: "divider" as const },
    {
      icon: <BiSolidTrash size={20} />,
      name: "Recycle Bin",
    },
  ];

  function renderContent() {
    switch (activeTab) {
      case "Directory":
        return <PimecDirectory />;
      case "Recent":
        return <EvaluatorRecent />;
      case "Recycle Bin":
        return <EvaluatorRecBin />;
      default:
        return <PimecDirectory />;
    }
  }

  return (
    <div className="flex-1 flex w-full px-8 py-16">
      {/* <Sidebar
        items={sidebarItems}
        onItemClick={(item) => {
          if ("name" in item) setActiveTab(item.name);
        }}
        activeTab={activeTab}
      /> */}
      <div className="w-full">{renderContent()}</div>
    </div>
  );
}
