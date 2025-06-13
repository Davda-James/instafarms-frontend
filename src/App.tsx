// src/App.tsx
import { Routes, Route } from "react-router-dom";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";

// Import your components
import Landing from "./pages/Landing"; // Your existing Landing page
import CompleteProfile from "./components/completeProfile"; // Ensure correct casing
import Dashboard from "./pages/dashboard"; // Ensure correct casing
import { SignIn, SignUp } from "@clerk/clerk-react"; // Clerk UI components
import AuthLayout from './AuthLayout'; // Your existing AuthLayout
import AdminPage from "./pages/Admin";
import "./App.css";


const App: React.FC = () => {
  return (
    <Routes>
      {/* Root Path: ALWAYS renders Landing page, regardless of sign-in status */}
      <Route path="/" element={<Landing />} />

      {/* Sign-in Route: Handles Clerk's Sign-in UI */}
      <Route path="/sign-in/*" element={ // Use /* for Clerk's internal routing
        <AuthLayout>
          <SignIn
            routing="path"
            path="/sign-in"
            appearance={{
              elements: {
                card: "min-h-[320px] min-w-[200px]",
                rootBox: "w-full max-w-md"
              }
            }}
            fallbackRedirectUrl="/dashboard" // After sign-in, go to complete profile
            signUpUrl="/sign-up"
          />
        </AuthLayout>
      } />

      {/* Sign-up Route: Handles Clerk's Sign-up UI */}
      <Route path="/sign-up/*" element={ // Use /* for Clerk's internal routing
        <AuthLayout>
          <SignUp
            routing="path"
            path="/sign-up"
            appearance={{
              elements: {
                card: "min-h-[320px] min-w-[200px]",
                rootBox: "w-full max-w-md"
              }
            }}
            fallbackRedirectUrl="/complete-profile" // CORRECTED: After sign-up, now redirects to Dashboard
            signInUrl="/sign-up"
          />
        </AuthLayout>
      } />

      {/* Protected Complete Profile Page */}
      <Route
        path="/complete-profile"
        element={
          <>
            <SignedIn>
              <CompleteProfile /> {/* Renders CompleteProfile for signed-in users */}
            </SignedIn>
            <SignedOut>
              {/* If not signed in, redirect to sign-in page, then back to complete-profile */}
              <RedirectToSignIn redirectUrl="complete-profile"/>
            </SignedOut>
          </>
        }
      />

      {/* Protected Dashboard Page */}
      <Route
        path="/dashboard"
        element={
          <>
            <SignedIn>
              <Dashboard /> {/* Renders Dashboard for signed-in users */}
            </SignedIn>
            <SignedOut>
              {/* If not signed in, redirect to sign-in page, then back to dashboard */}
              <RedirectToSignIn redirectUrl="/sign-in" />
            </SignedOut>
          </>
        }
      />

      <Route
        path="/admin"
        element={
          <>
            <SignedIn>
              <AdminPage /> {/* Renders AdminPage for signed-in users */}
            </SignedIn>
            <SignedOut>
              {/* If not signed in, redirect to sign-in page, then back to admin */}
              <RedirectToSignIn redirectUrl="/admin" />
            </SignedOut>
          </>
        }
      />

      {/* Fallback route for any other unmatched path. Redirects to root for proper handling. */}
      <Route path="*" element={<RedirectToSignIn redirectUrl="/" />} />
    </Routes>
  );
};

export default App;
