import { useState } from "react";
import { X, Trash2 } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";

const ChatHeader = () => {
  const { selectedUser, setSelectedUser, deleteConversation } = useChatStore();
  const { onlineUsers } = useAuthStore();

  const [openModal, setOpenModal] = useState(false);
  const [deleteForBoth, setDeleteForBoth] = useState(false);

  if (!selectedUser) return null;

  const handleDelete = async () => {
    await deleteConversation(deleteForBoth);
    setOpenModal(false);
  };

  return (
    <>
      <div className="p-3 border-b border-base-300 bg-base-100">
        <div className="flex items-center justify-between">
          {/* USER INFO */}
          <div className="flex items-center gap-3">
            <div className="avatar">
              <div className="w-10 rounded-full">
                <img
                  src={selectedUser.profilePic || "/avatar.png"}
                  alt={selectedUser.fullName}
                />
              </div>
            </div>

            <div>
              <h3 className="font-medium">{selectedUser.fullName}</h3>
              <p className="text-sm text-base-content/70">
                {onlineUsers.includes(selectedUser._id) ? "Online" : "Offline"}
              </p>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setOpenModal(true)}
              className="btn btn-ghost btn-sm text-error"
            >
              <Trash2 size={18} />
            </button>

            <button
              onClick={() => setSelectedUser(null)}
              className="btn btn-ghost btn-sm"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* TELEGRAM STYLE MODAL */}
      {openModal && (
        <dialog className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Clear Chat History</h3>

            <p className="py-3 text-sm">
              Are you sure you want to clear your chat history with{" "}
              <span className="font-semibold">{selectedUser.fullName}</span>?
            </p>

            {/* TELEGRAM CHECKBOX */}
            <label className="flex items-center gap-2 cursor-pointer mb-4">
              <input
                type="checkbox"
                className="checkbox checkbox-error"
                checked={deleteForBoth}
                onChange={(e) => setDeleteForBoth(e.target.checked)}
              />

              <span className="text-sm">
                Also delete for {selectedUser.fullName}
              </span>
            </label>

            {/* ACTION BUTTONS */}
            <div className="modal-action">
              <button
                className="btn btn-ghost"
                onClick={() => setOpenModal(false)}
              >
                Cancel
              </button>

              <button className="btn btn-error" onClick={handleDelete}>
                Delete
              </button>
            </div>
          </div>
        </dialog>
      )}
    </>
  );
};

export default ChatHeader;
