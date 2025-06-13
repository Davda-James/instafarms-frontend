export default function UserMockupCard() {
  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl shadow-xl w-full max-w-2xl flex items-center justify-between text-white">
      
      {/* Left Side: Avatar + Name */}
      <div className="flex items-center space-x-4">
        <img
          src="https://i.pravatar.cc/100?img=32"
          alt="Avatar"
          className="w-14 h-14 rounded-full border-2 border-indigo-400"
        />
        <div>
          <h3 className="text-xl font-semibold">hunter_dev</h3>
          <p className="text-sm text-slate-400">Hunter Singh</p>
        </div>
      </div>

      {/* Right Side: Stats and Buttons */}
      <div className="flex items-center space-x-6">
        {/* Stats */}
        <div className="text-center">
          <p className="text-lg font-bold">345</p>
          <p className="text-sm text-slate-400">Followers</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold">180</p>
          <p className="text-sm text-slate-400">Following</p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col space-y-2">
          <button className="bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1 rounded text-sm shadow-md">
            Follow
          </button>
          <button className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-1 rounded text-sm">
            Following
          </button>
        </div>
      </div>
    </div>
  );
}
