import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { Camera, Mail, User, X, Pencil } from "lucide-react";

const ProfilePage = () => {
  const { authUser, isUpdatingProfile, updateProfile, checkUsername } =
    useAuthStore();

  const [selectedImg, setSelectedImg] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const [name, setName] = useState(authUser?.fullName || "");
  const [username, setUsername] = useState(authUser?.username || "");
  const [usernameStatus, setUsernameStatus] = useState("");

  const navigate = useNavigate();

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onloadend = async () => {
      const base64Image = reader.result;
      setSelectedImg(base64Image);
      await updateProfile({ profilePic: base64Image });
    };

    reader.readAsDataURL(file);
  };

  // username availability check
  const handleUsernameChange = async (value) => {
    setUsername(value);

    // don't check small usernames
    if (value.length < 3) {
      setUsernameStatus("");
      return;
    }

    // if same as current username
    if (value === authUser.username) {
      setUsernameStatus("");
      return;
    }

    const res = await checkUsername(value);

    if (res?.available) {
      setUsernameStatus("available");
    } else {
      setUsernameStatus("taken");
    }
  };

  const handleProfileUpdate = async () => {
    const updatedUser = await updateProfile({
      fullName: name,
      username: username,
    });

    if (updatedUser) {
      setName(updatedUser.fullName);
      setUsername(updatedUser.username);
    }

    setShowEditModal(false);
  };

  // OPEN MODAL (RESET VALUES FROM DATABASE)
  const openEditModal = () => {
    setName(authUser.fullName);
    setUsername(authUser.username || "");
    setUsernameStatus("");
    setShowEditModal(true);
  };

  // CLOSE MODAL (RESET INPUTS)
  const closeEditModal = () => {
    setName(authUser.fullName);
    setUsername(authUser.username || "");
    setUsernameStatus("");
    setShowEditModal(false);
  };

  return (
    <>
      <button
        onClick={() => navigate("/")}
        className="fixed top-20 right-4 sm:top-6 sm:right-6 z-50 text-base-content hover:text-error"
      >
        <X size={24} />
      </button>

      <div className="min-h-screen pt-20 px-4 bg-base-100">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* PROFILE HEADER */}
          <div className="bg-base-200/70 backdrop-blur-lg rounded-2xl overflow-hidden shadow-lg border border-base-300">
            <div className="h-36 bg-gradient-to-r from-primary/70 via-secondary/60 to-accent/60"></div>

            <div className="flex flex-col items-center -mt-16 pb-6 px-6">
              <div className="relative">
                <img
                  src={selectedImg || authUser.profilePic || "/avatar.png"}
                  alt="Profile"
                  className="w-32 h-32 rounded-full object-cover border-4 border-base-100 shadow-lg"
                />

                <label
                  htmlFor="avatar-upload"
                  className="absolute bottom-1 right-1 bg-primary text-primary-content p-2 rounded-full cursor-pointer"
                >
                  <Camera size={18} />

                  <input
                    type="file"
                    id="avatar-upload"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isUpdatingProfile}
                  />
                </label>
              </div>

              <div className="text-center mt-4">
                <h2 className="text-xl font-semibold">{authUser.fullName}</h2>

                <p className="text-sm text-primary font-medium">
                  @{authUser.username || "username"}
                </p>

                <p className="text-sm opacity-60">{authUser.email}</p>
              </div>

              <button
                onClick={openEditModal}
                className="btn btn-sm btn-outline mt-3 flex items-center gap-2"
              >
                <Pencil size={16} />
                Edit Profile
              </button>
            </div>
          </div>

          {/* PERSONAL INFO */}
          <div className="bg-base-200/70 backdrop-blur-lg rounded-xl p-6 shadow border border-base-300 space-y-4">
            <h3 className="text-lg font-semibold">Personal Information</h3>

            <div className="flex justify-between border-b border-base-300 pb-3">
              <span className="flex items-center gap-2 text-sm opacity-70">
                <User size={16} />
                Full Name
              </span>

              <span className="font-medium">{authUser.fullName}</span>
            </div>

            <div className="flex justify-between">
              <span className="flex items-center gap-2 text-sm opacity-70">
                <Mail size={16} />
                Email
              </span>

              <span className="font-medium">{authUser.email}</span>
            </div>
          </div>

          {/* ACCOUNT INFORMATION */}
          <div className="bg-base-200/70 backdrop-blur-lg rounded-xl p-6 shadow border border-base-300">
            <h3 className="text-lg font-semibold mb-4">Account Information</h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-base-300 pb-3">
                <span className="opacity-70">Member Since</span>

                <span className="font-medium">
                  {authUser.createdAt ? authUser.createdAt.split("T")[0] : "—"}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="opacity-70">Account Status</span>

                <span className="text-success font-medium">Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* EDIT PROFILE MODAL */}
      {showEditModal && (
        <dialog className="modal modal-open">
          {/* <div className="modal-box"> */}
          <div className="modal-box w-full max-w-md">
            <h3 className="font-bold text-lg">Edit Profile</h3>

            <div className="py-4 space-y-3">
              <input
                type="text"
                placeholder="Full Name"
                className="input input-bordered w-full"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              <input
                type="text"
                placeholder="Username"
                className="input input-bordered w-full"
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
              />

              {usernameStatus === "available" && (
                <p className="text-success text-sm font-medium">
                  ✓ Username available
                </p>
              )}

              {usernameStatus === "taken" && (
                <p className="text-error text-sm">Username already taken</p>
              )}
            </div>

            <div className="modal-action">
              <button className="btn" onClick={closeEditModal}>
                Cancel
              </button>

              <button
                className="btn btn-primary"
                disabled={usernameStatus === "taken" || isUpdatingProfile}
                onClick={handleProfileUpdate}
              >
                {isUpdatingProfile ? "Saving Changes..." : "Save Changes"}
              </button>
            </div>
          </div>
        </dialog>
      )}
    </>
  );
};

export default ProfilePage;

