import UserManagementTable from "./userManagementTable";

export default function userManagement() {
  return (
    <div className="flex-1 flex w-full">
      <div className="flex flex-col w-full bg-white m-16 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold p-8">User Management</h1>
        <hr className="h-1 rounded-full border-meritGray/50" />
        <div className="">
          <UserManagementTable />
        </div>
      </div>
    </div>
  );
}
