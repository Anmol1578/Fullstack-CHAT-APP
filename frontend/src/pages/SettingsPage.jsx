import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { X, Send, Trash2, ShieldAlert, LogOut } from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";

import { THEMES } from "../constants";
import { useThemeStore } from "../store/useThemeStore";
import { useAuthStore } from "../store/useAuthStore";

// Preview messages shown in the fake chat UI preview
const PREVIEW_MESSAGES = [
  { id: 1, content: "Hey! How's it going?", isSent: false },
  {
    id: 2,
    content: "I'm doing great! Just working on some new features.",
    isSent: true,
  },
];

const SettingsPage = () => {
  // Theme state from Zustand store
  const { theme, setTheme } = useThemeStore();

  // Logout function from auth store
  const { logout } = useAuthStore();

  // React router navigation
  const navigate = useNavigate();

  // Modal state controllers
  const [showClearModal, setShowClearModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Input confirmation for DELETE typing
  const [confirmText, setConfirmText] = useState("");

  const [isClearing, setIsClearing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Function to clear all chats from backend

  const clearAllChats = async () => {
    try {
      setIsClearing(true);

      await axios.delete("http://localhost:5001/api/messages/clear", {
        withCredentials: true,
      });

      toast.success("All conversations have been cleared.");
    } catch (error) {
      console.error("Error clearing chats:", error);
      toast.error("Failed to clear chats.");
    } finally {
      setIsClearing(false);
    }
  };

  // Function to permanently delete user account

  const deleteAccount = async () => {
    try {
      setIsDeleting(true);

      await axios.delete("http://localhost:5001/api/auth/delete-account", {
        withCredentials: true,
      });

      toast.success("Your account has been permanently deleted.");

      logout();

      navigate("/login");
    } catch (error) {
      console.error("Delete account error:", error);
      toast.error("Failed to delete account.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      {/* CLOSE BUTTON - returns user to home page */}
      <button
        onClick={() => navigate("/")}
        className="fixed top-18 right-4 sm:top-6 sm:right-6 z-50 text-base-content hover:text-error"
      >
        <X size={24} />
      </button>

      {/* MAIN SETTINGS CONTAINER */}
      <div className="min-h-screen px-4 pt-16 max-w-5xl mx-auto">
        <div className="space-y-10">
          {/* SETTINGS HEADER */}
          <div>
            <h1 className="text-2xl font-semibold">Settings</h1>
            <p className="text-sm text-base-content/70">
              Manage your chat preferences
            </p>
          </div>

          {/* THEME SELECTION SECTION */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Theme</h2>

            {/* Theme grid */}
            <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-8 gap-2">
              {THEMES.map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)} // change theme
                  className={`group flex flex-col items-center gap-1 p-2 rounded-lg ${
                    theme === t ? "bg-base-200" : "hover:bg-base-200/50"
                  }`}
                >
                  {/* Theme preview colors */}
                  <div
                    className="h-8 w-full rounded-md overflow-hidden"
                    data-theme={t}
                  >
                    <div className="grid grid-cols-4 gap-px p-1 h-full">
                      <div className="bg-primary rounded"></div>
                      <div className="bg-secondary rounded"></div>
                      <div className="bg-accent rounded"></div>
                      <div className="bg-neutral rounded"></div>
                    </div>
                  </div>

                  {/* Theme name */}
                  <span className="text-xs capitalize">{t}</span>
                </button>
              ))}
            </div>
          </div>

          {/* CHAT PREVIEW UI */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Chat Preview</h3>

            <div className="border border-base-300 rounded-xl overflow-hidden bg-base-100 shadow-lg">
              <div className="p-4 bg-base-200">
                {/* PREVIEW CHAT HEADER */}
                <div className="flex items-center gap-3 border-b pb-3">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-content">
                    J
                  </div>

                  <div>
                    <h3 className="font-medium text-sm">Its Anmol</h3>
                    <p className="text-xs text-base-content/60">Online</p>
                  </div>
                </div>

                {/* PREVIEW MESSAGES */}
                <div className="py-4 space-y-3">
                  {PREVIEW_MESSAGES.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${
                        msg.isSent ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`rounded-xl p-3 text-sm max-w-[80%] ${
                          msg.isSent
                            ? "bg-primary text-primary-content"
                            : "bg-base-300"
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))}
                </div>

                {/* PREVIEW MESSAGE INPUT */}
                <div className="flex gap-2 border-t pt-3">
                  <input
                    type="text"
                    className="input input-bordered flex-1"
                    value="This is a preview"
                    readOnly
                  />

                  <button className="btn btn-primary">
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* DATA MANAGEMENT SECTION */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Data & Privacy</h2>

            <div className="space-y-3">
              {/* BUTTON TO OPEN CLEAR CHATS MODAL */}
              <button
                onClick={() => setShowClearModal(true)}
                className="w-full flex items-center gap-3 p-4 border border-base-300 rounded-xl bg-base-100 hover:bg-base-200 transition"
              >
                <div className="p-2 rounded-lg bg-warning/20 text-warning">
                  <Trash2 size={18} />
                </div>

                <div className="text-left">
                  <h3 className="font-medium">Clear conversations</h3>
                  <p className="text-xs text-base-content/60">
                    Remove all chat history from your account
                  </p>
                </div>
              </button>

              {/* DANGER ZONE - ACCOUNT DELETION */}
              <div className="border border-error/40 rounded-xl p-4 bg-error/5 space-y-4">
                {/* Danger zone header */}
                <h2 className="text-lg font-semibold text-error flex items-center gap-2">
                  <ShieldAlert size={18} />
                  Danger Zone
                </h2>

                {/* Delete account action */}
                <div className="flex items-center justify-between bg-base-100 border border-error/30 rounded-lg p-4">
                  <div>
                    <h3 className="font-medium text-error">Delete account</h3>
                    <p className="text-xs text-base-content/60">
                      Permanently delete your account and all messages.
                    </p>
                  </div>

                  {/* Opens delete confirmation modal */}
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="btn btn-error btn-sm"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* LOGOUT BUTTON */}
          <button
            onClick={logout}
            className="btn btn-outline w-full flex items-center gap-2 justify-center"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>

      {/* CLEAR CHATS CONFIRMATION MODAL */}
      {showClearModal && (
        <dialog className="modal modal-open">
          <div className="modal-box w-11/12 max-w-md">
            <h3 className="font-bold text-lg">Clear All Conversations</h3>

            <p className="py-3 text-sm opacity-70">
              This will permanently delete all your chat history.
            </p>

            <div className="modal-action">
              {/* Cancel button */}
              <button className="btn" onClick={() => setShowClearModal(false)}>
                Cancel
              </button>

              {/* Confirm clear chats */}

              <button
                className="btn btn-error w-full sm:w-auto"
                disabled={isClearing}
                onClick={async () => {
                  await clearAllChats();
                  setShowClearModal(false);
                }}
              >
                {isClearing ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  "Clear Chats"
                )}
              </button>
            </div>
          </div>
        </dialog>
      )}

      {/* DELETE ACCOUNT CONFIRMATION MODAL */}
      {showDeleteModal && (
        <dialog className="modal modal-open">
          <div className="modal-box w-11/12 max-w-md">
            {/* Modal title */}
            <h3 className="font-bold text-lg text-error">Delete Account</h3>

            {/* Warning message */}
            <p className="py-3 text-sm opacity-70">
              This action is permanent. All your messages and account data will
              be deleted.
            </p>

            {/* Security confirmation instruction */}
            <p className="text-xs mb-2">
              Type <b>DELETE</b> to confirm
            </p>

            {/* Confirmation input */}
            <input
              type="text"
              placeholder="DELETE"
              className="input input-bordered w-full"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
            />

            <div className="modal-action">
              {/* Cancel deletion */}
              <button
                className="btn"
                onClick={() => {
                  setShowDeleteModal(false);
                  setConfirmText("");
                }}
              >
                Cancel
              </button>

              {/* Confirm account deletion */}

              <button
                className="btn btn-error"
                disabled={confirmText !== "DELETE" || isDeleting}
                onClick={async () => {
                  await deleteAccount();
                  setShowDeleteModal(false);
                  setConfirmText("");
                }}
              >
                {isDeleting ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  "Delete Account"
                )}
              </button>
            </div>
          </div>
        </dialog>
      )}
    </>
  );
};

export default SettingsPage;

