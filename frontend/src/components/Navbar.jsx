import { Link } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore.js";
import { LogOut, MessageSquare, Settings, User } from "lucide-react";

const Navbar = () => {
  const { logout, authUser } = useAuthStore();

  return (
    <header
      className="bg-base-100 border-b border-base-300 fixed w-full top-0 z-40 
    backdrop-blur-lg bg-base-100/80"
    >
      <div className="container mx-auto pl-18 pr-4 h-16">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center gap-8">
  <Link
              to="/"
              className="flex items-center gap-2.5 group transition-all"
            >
              {/* MAIN LOGO BOX */}
              <div
                className="
    relative overflow-hidden
    flex items-center justify-center
    px-3 h-9 rounded-lg
    bg-primary/10
    border-2 border-primary/40
    shadow-lg shadow-primary/60
    transition-all duration-300
    group-hover:shadow-primary/70
    "
              >
                {/* SHINE EFFECT */}
                <span
                  className="
      absolute inset-0 opacity-0
      bg-gradient-to-r
      from-transparent via-base-100/40 to-transparent
      group-hover:opacity-100
      group-hover:translate-x-full
      transition-all duration-700
      "
                ></span>

                {/* TEXT */}
                <span className="relative text-primary font-bold text-sm tracking-wide">
                  Z-CHAT
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to={"/settings"}
              className={`
              btn btn-sm gap-2 transition-colors
              
              `}
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </Link>

            {authUser && (
              <>
                <Link to={"/profile"} className={`btn btn-sm gap-2`}>
                  <User className="size-5" />
                  <span className="hidden sm:inline">Profile</span>
                </Link>

                <button className="flex gap-2 items-center" onClick={logout}>
                  <LogOut className="size-5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
export default Navbar;
