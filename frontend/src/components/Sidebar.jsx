import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users, UserCheck, Search, X } from "lucide-react";

const Sidebar = () => {
  const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading } =
    useChatStore();

  const { onlineUsers, authUser, socket } = useAuthStore();

  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});

  useEffect(() => {
    getUsers();
  }, [getUsers]);

  // typing listeners
  useEffect(() => {
    if (!socket) return;

    socket.on("userTyping", ({ senderId }) => {
      setTypingUsers((prev) => ({
        ...prev,
        [senderId]: true,
      }));
    });

    socket.on("userStopTyping", ({ senderId }) => {
      setTypingUsers((prev) => ({
        ...prev,
        [senderId]: false,
      }));
    });

    return () => {
      socket.off("userTyping");
      socket.off("userStopTyping");
    };
  }, [socket]);

  const filteredUsers = users
    .filter((user) =>
      (user.fullName || "").toLowerCase().includes(search.toLowerCase()),
    )
    .filter((user) => (showOnlineOnly ? onlineUsers.includes(user._id) : true));

  if (isUsersLoading) return <SidebarSkeleton />;

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="
lg:hidden fixed top-4 left-4 z-40
w-10 h-10 flex items-center justify-center
rounded-xl
bg-primary/18 text-primary
border border-primary/20
shadow-sm hover:shadow-md
hover:bg-primary/20
active:scale-95
transition-all duration-200
"
      >
        <Users size={20} />
      </button>

      {/* MOBILE OVERLAY */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`
        fixed lg:relative z-40 h-full
        w-[85%] max-w-[320px] lg:w-72
        border-r border-base-300 flex flex-col
        bg-base-100
        transition-all duration-300
        ${mobileOpen ? "left-0" : "-left-full"} lg:left-0
        `}
      >
        {/* HEADER */}
        <div className="border-b border-base-300 p-4 flex flex-col gap-3 bg-base-100">
          {/* TITLE */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" />
              <span className="font-semibold">Contacts</span>
            </div>

            {/* CLOSE BUTTON (MOBILE) */}
            <button
              className="lg:hidden btn btn-ghost btn-sm btn-circle"
              onClick={() => setMobileOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* SEARCH */}
          <div className="form-control w-full">
            <label className="input input-bordered input-sm flex items-center gap-2">
              <Search className="w-4 h-4 opacity-60" />
              <input
                type="text"
                className="grow"
                placeholder="Search contacts"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
          </div>

          {/* ONLINE FILTER */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showOnlineOnly}
              onChange={(e) => setShowOnlineOnly(e.target.checked)}
              className="checkbox checkbox-sm checkbox-success"
            />

            <UserCheck className="w-4 h-4 text-green-500" />

            <span className="text-sm">Online only</span>
          </label>

          <span className="text-xs text-gray-400">
            ({onlineUsers.filter((id) => id !== authUser?._id).length} online)
          </span>
        </div>

        {/* USER LIST */}
        <ul className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
          {filteredUsers.map((user) => {
            const isActive = selectedUser?._id === user._id;
            const isOnline = onlineUsers.includes(user._id);

            return (
              <li key={user._id}>
                <button
                  onClick={() => {
                    setSelectedUser(user);
                    setMobileOpen(false);
                  }}
                  className={`flex items-center gap-3 w-full px-3 py-2 rounded-xl
                  transition-all hover:bg-base-200
                  ${isActive ? "bg-primary/10 text-primary" : ""}
                  `}
                >
                  {/* AVATAR */}
                  <div className="relative">
                    <img
                      src={user.profilePic || "/avatar.png"}
                      alt={user.fullName}
                      className="w-12 h-12 rounded-full object-cover"
                    />

                    {isOnline && (
                      <span className="absolute bottom-0 right-0 flex h-3 w-3">
                        <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping"></span>
                        <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500 border-2 border-base-100"></span>
                      </span>
                    )}
                  </div>

                  {/* NAME + STATUS */}
                  <div className="flex flex-col text-left truncate flex-1 min-w-0">
                    <span className="font-medium truncate">
                      {user.fullName}
                    </span>

                    {typingUsers[user._id] ? (
                      <span className="loading loading-dots loading-xs text-primary"></span>
                    ) : (
                      <span
                        className={`text-xs truncate ${
                          user.lastMessage
                            ? "opacity-60"
                            : isOnline
                              ? "text-green-500 font-medium"
                              : "text-gray-400"
                        }`}
                      >
                        {user.lastMessage || (isOnline ? "Online" : "Offline")}
                      </span>
                    )}
                  </div>

                  {/* UNREAD */}
                  {user.unreadCount > 0 && (
                    <span className="badge badge-primary badge-sm">
                      {user.unreadCount}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        {/* EMPTY */}
        {filteredUsers.length === 0 && (
          <div className="text-center text-gray-500 py-4">No users found</div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;

