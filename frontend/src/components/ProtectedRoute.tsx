import { useAppSelector, type RootState } from "@/store";
import { logout } from "@/store/slices/authSlice";
import { checkToken } from "@/utils/checkToken";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router";


const ProtectedRoute = () => {
    const { isAuthenticated , user } = useAppSelector((state:RootState) => state.auth);
    const dispatch = useDispatch();
    const location = useLocation();
    const navigate = useNavigate();
    const token = user?.token;
    useEffect(()=>{
        if(token === null || !checkToken(token as string)){
            dispatch(logout())
            navigate("/landing")
        }
    },[token,dispatch,navigate])
  return (
    isAuthenticated && token ? <Outlet /> : <Navigate to="/landing" state={{ from: location }} replace />
  )
}

export default ProtectedRoute