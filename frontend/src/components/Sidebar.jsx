
import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users, UserCheck, Search } from "lucide-react";

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

  // filter users
  const filteredUsers = users
    .filter((user) => {
      const name = user.fullName || "";
      const query = search || "";
      return name.toLowerCase().includes(query.toLowerCase());
    })
    .filter((user) => (showOnlineOnly ? onlineUsers.includes(user._id) : true));

  if (isUsersLoading) return <SidebarSkeleton />;

  return (
    <>
      {/* MOBILE BUTTON */}
      <button
        className="lg:hidden fixed top-4 left-4 z-40 btn btn-circle btn-sm shadow-md"
        onClick={() => setMobileOpen(true)}
      >
        <Users className="w-5 h-5" />
      </button>

      {/* MOBILE OVERLAY */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      {/* <aside
        className={`
        fixed lg:relative z-40 h-full
        border-r border-base-300 flex flex-col
        transition-all duration-300 bg-base-100
        overflow-y-auto
        ${mobileOpen ? "left-0" : "-left-full"}
        lg:left-0
        w-[85%] sm:w-72 max-w-[320px]
        shadow-lg lg:shadow-none
      `}
      > */}

      <aside
        className={`
  fixed lg:relative z-40 h-full
  border-r border-base-300 flex flex-col
  bg-base-100
  overflow-y-auto
  transform transition-transform duration-300
  ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
  lg:translate-x-0
  w-[85%] sm:w-72 max-w-[320px]
  shadow-lg lg:shadow-none
`}
      >
        {/* HEADER */}
        <div className="border-b border-base-300 p-5 sticky top-0 bg-base-100 z-10">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-6 h-6 text-primary" />
            <h2 className="font-semibold text-lg">Contacts</h2>
          </div>

          {/* SEARCH */}
          <div className="form-control w-full mb-3">
            <label className="input input-bordered input-sm flex items-center gap-2 focus-within:ring-2 focus-within:ring-primary">
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
          <label className="flex items-center justify-between cursor-pointer text-sm">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-success" />
              <span>Online only</span>
            </div>

            <input
              type="checkbox"
              checked={showOnlineOnly}
              onChange={(e) => setShowOnlineOnly(e.target.checked)}
              className="toggle toggle-success toggle-xs"
            />
          </label>

          <p className="text-xs text-base-content/60 mt-1">
            {onlineUsers.filter((id) => id !== authUser?._id).length} online
          </p>
        </div>

        {/* USER LIST */}
        <ul className="flex-1 p-2 flex flex-col gap-1">
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
                  className={`flex items-center gap-3 w-full px-3 py-2 rounded-xl transition-all duration-200
                  ${
                    isActive
                      ? "bg-primary/15 text-primary border border-primary/20 shadow-sm"
                      : "text-gray-350 dark:text-gray-200 hover:bg-base-200 backdrop-blur-sm"
                  }`}
                >
                  {/* AVATAR */}
                  <div className="relative">
                    <img
                      src={user.profilePic || "/avatar.png"}
                      alt={user.fullName}
                      className="w-12 h-12 rounded-full object-cover shadow-sm"
                    />

                    {isOnline && (
                      <div className="absolute bottom-0 right-0 flex items-center justify-center">
                        <span className="absolute inline-flex h-3 w-3 rounded-full bg-success opacity-75 animate-ping"></span>
                        <span className="relative inline-flex h-3 w-3 rounded-full bg-success ring-2 ring-base-100"></span>
                      </div>
                    )}
                  </div>

                  {/* NAME + MESSAGE */}
                  <div className="flex flex-col text-left truncate flex-1">
                    <span className="font-medium truncate">
                      {user.fullName}
                    </span>

                    {typingUsers[user._id] ? (
                      <span className="loading loading-dots loading-xs text-primary mt-1"></span>
                    ) : (
                      <span className="text-xs opacity-80 truncate max-w-[160px]">
                        {user.lastMessage || (isOnline ? "Online" : "Offline")}
                      </span>
                    )}
                  </div>

                  {/* UNREAD BADGE */}
                  {user.unreadCount > 0 && (
                    <span className="ml-auto badge badge-primary badge-sm">
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
          <div className="text-center text-base-content/60 py-6">
            No users found
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;

