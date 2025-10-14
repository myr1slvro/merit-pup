import { FaHardHat } from "react-icons/fa";

export default function utldoUserAnalytics() {
  return (
    <div className="flex-1 flex w-full">
      <div className="flex flex-col w-full bg-white m-16 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold p-8">User Analytics</h1>
        <hr className="h-1 rounded-full border-meritGray/50" />
        <div className="flex flex-col items-center justify-center py-16 px-8">
          <div className="bg-meritYellow/10 border-2 border-meritYellow rounded-lg p-8 max-w-md text-center">
            <FaHardHat className="text-6xl text-meritYellow mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Coming Soon
            </h2>
            <p className="text-gray-600">
              User Analytics dashboard is currently under development. Check
              back soon for detailed insights and analytics.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
