import userImage from "../assets/images/users.png";
// import FollowerBadge from "../components/FollowerBadge";
import MockupCard from "../components/MockUpCard";

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#0f172a] text-white relative overflow-hidden px-4">
      {/* Glowing Background Blur */}
      <div className="absolute top-[-100px] left-1/2 transform -translate-x-1/2 w-[800px] h-[400px] bg-indigo-500 opacity-30 rounded-full filter blur-[120px] z-0" />

      {/* Header */}
      <nav className="relative z-10 flex justify-between items-center max-w-7xl mx-auto py-6">
        <div className="text-2xl font-bold">🔷 Logo</div>
        <div className="space-x-4">
          <button 
            onClick={() => window.location.href = '/admin'}
          className="bg-indigo-500 hover:bg-indigo-600 text-white text-sm px-4 py-2 rounded">
            Admin Sign In
          </button>
        </div>
      </nav>

      {/* Hero Section with Image Right */}
      <div className="relative z-10 mt-16 max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
        {/* Left: Hero Text */}
        <main className="text-center md:text-left max-w-xl">
          <h1 className="text-4xl sm:text-6xl font-extrabold leading-tight">
            A powerful suite for<br />
            <span className="text-indigo-400">User Management</span>
          </h1>
          <p className="mt-4 text-slate-400 text-lg">
            Manage users, followers and more with a personalized dashboard.
          </p>
          <div className="mt-6 flex justify-center md:justify-start gap-4">
            <button 
            onClick={() => window.location.href = '/sign-up'}
            className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 rounded font-medium shadow-md">
              SignUp →
            </button>
            <button onClick={() => window.location.href = '/sign-in'} 
            className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded font-medium"> 
              Sign In → 
            </button> 
          </div>
        </main>

        {/* Right: Image */}
        <div className="flex justify-center w-full md:w-1/2">
          <img
            src={userImage}
            alt="UI mockup"
            className="w-full max-w-md rounded-xl shadow-2xl"
          />
        </div>
    </div>
    {/* MockupCard Highlighted Section */}
    <div className="relative mt-5 flex justify-start items-center">
        {/* Glowing Border Effect */}
        <div className="absolute left-[60%] w-full max-w-2xl h-full rounded-xl blur-3xl bg-indigo-500 opacity-20 z-0" />
        
        <div className="relative z-10 w-full max-w-2xl ml-auto mr-10">
        <MockupCard />
        </div>
    </div>
    </div>
  );
}
