import TravelExample from './components/TravelExample'
import './App.css'

import {
  createBrowserRouter,
  RouterProvider,
} from "react-router";
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/landingpage/LandingPage';
import SignInPage from './pages/signinpage/SignInPage';
import SignUpPage from './pages/signuppage/SignUpPage';

function App() {
  const router = createBrowserRouter([
    {
      path: "/signin",
      element: <SignInPage />,
    },
    {
      path: "/signup",
      element: <SignUpPage />,
    },
    {
      path: "/landing",
      element: <LandingPage />,
    },
    {
      path: "/",
      element: <ProtectedRoute />,
      children: [
        {
          path: "/",
          element: <TravelExample />,
        }
      ]
    }
  ]);
  return (
    <div className="min-h-screen ">
      <RouterProvider router={router} />
    </div>
  )
}

export default App
