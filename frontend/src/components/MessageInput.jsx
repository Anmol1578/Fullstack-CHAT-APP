import { useRef, useState, useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { Image, Send, X, Edit2, Check } from "lucide-react";
import toast from "react-hot-toast";
import { createPortal } from "react-dom";

const MessageInput = ({ replyingMessage, setReplyingMessage }) => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [isImageOpen, setIsImageOpen] = useState(false);

  const fileInputRef = useRef(null);
  const textInputRef = useRef(null);

  const { sendMessage, editingMessage, setEditingMessage, selectedUser } =
    useChatStore();

  const { socket } = useAuthStore();

  // POPULATE INPUT WHEN EDITING
  useEffect(() => {
    if (editingMessage) {
      setText(editingMessage.text || "");
      setImagePreview(null);

      if (fileInputRef.current) fileInputRef.current.value = "";

      setTimeout(() => textInputRef.current?.focus(), 100);
    } else {
      setText("");
    }
  }, [editingMessage]);

  // IMAGE HANDLER
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const reader = new FileReader();

    reader.onloadend = () => {
      setImagePreview(reader.result);
    };

    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    setIsImageOpen(false);

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  
  // ENTER KEY SEND SUPPORT
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };


  // SEND OR EDIT MESSAGE
  const handleSendMessage = async (e) => {
    e.preventDefault();

    const trimmedText = text.trim();

    if (!trimmedText && !imagePreview) return;

    if (!selectedUser?._id) {
      toast.error("Select a user first");
      return;
    }

   
    // EDIT MESSAGE
    if (editingMessage) {
      if (!trimmedText) {
        toast.error("Message cannot be empty");
        return;
      }

      if (!socket?.connected) {
        toast.error("Connection lost");
        return;
      }

      socket.emit("editMessage", {
        messageId: editingMessage._id,
        newText: trimmedText,
        receiverId: selectedUser._id,
      });

      setEditingMessage(null);
      setText("");

      return;
    }

    // SEND MESSAGE
    const messageText = trimmedText;
    const messageImage = imagePreview;

    const payload = {
      text: messageText,
      image: messageImage,
    };

    // ===== REPLY SUPPORT =====
    if (replyingMessage) {
      payload.replyTo = replyingMessage._id;

      payload.replyPreview = {
        text: replyingMessage.text || "📷 Photo",
        senderId: replyingMessage.senderId,
      };
    }

    setText("");
    setImagePreview(null);

    if (fileInputRef.current) fileInputRef.current.value = "";

    try {
      await sendMessage(payload);

      if (replyingMessage) {
        setReplyingMessage(null);
      }
    } catch (error) {
      setText(messageText);
      setImagePreview(messageImage);

      toast.error("Message failed to send");
    }
  };

  const cancelEdit = () => {
    setEditingMessage(null);
    setText("");
  };

  return (
    <div className="p-3 md:p-4 w-full bg-base-100 border-t border-base-300">
      {/* REPLY PREVIEW */}
      {replyingMessage && (
        <div className="flex items-center justify-between bg-blue-500/10 p-2 px-3 rounded-xl border-l-4 border-blue-500 mb-2">
          <div className="overflow-hidden">
            <p className="text-[10px] uppercase font-bold text-blue-500">
              Replying
            </p>

            <p className="text-xs truncate opacity-70 italic">
              {replyingMessage.text || "📷 Photo"}
            </p>
          </div>

          <button
            onClick={() => setReplyingMessage(null)}
            className="p-1.5 hover:bg-base-300 rounded-full"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* EDIT INDICATOR */}
      {editingMessage && (
        <div className="flex items-center justify-between bg-primary/10 p-2 px-3 md:px-4 rounded-xl border-l-4 border-primary mb-2">
          <div className="flex items-center gap-3 overflow-hidden">
            <Edit2 size={16} className="text-primary shrink-0" />

            <div className="overflow-hidden">
              <p className="text-[10px] uppercase font-bold text-primary">
                Editing Message
              </p>

              <p className="text-xs md:text-sm truncate opacity-70 italic">
                {editingMessage.text}
              </p>
            </div>
          </div>

          <button
            onClick={cancelEdit}
            className="p-1.5 hover:bg-base-300 rounded-full"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* IMAGE PREVIEW */}
      {imagePreview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              onClick={() => setIsImageOpen(true)}
              className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-xl border cursor-pointer"
            />

            <button
              type="button"
              onClick={removeImage}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center"
            >
              <X size={12} />
            </button>
          </div>
        </div>
      )}

      {/* IMAGE MODAL */}
      {isImageOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center p-4"
            onClick={() => setIsImageOpen(false)}
          >
            <img
              src={imagePreview}
              alt="Full Preview"
              className="max-w-full max-h-full object-contain"
            />
          </div>,
          document.body,
        )}

      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
        <input
          ref={textInputRef}
          type="text"
          className="flex-1 input input-bordered rounded-xl text-sm md:text-base"
          placeholder={editingMessage ? "Save changes..." : "Type a message..."}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        <input
          type="file"
          accept="image/*"
          className="hidden"
          ref={fileInputRef}
          onChange={handleImageChange}
        />

        {!editingMessage && (
          <button
            type="button"
            className={`btn btn-circle btn-ghost ${
              imagePreview ? "text-primary" : "text-zinc-400"
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <Image size={20} />
          </button>
        )}

        <button
          type="submit"
          className="btn btn-circle btn-primary shadow-lg"
          disabled={!text.trim() && !imagePreview}
        >
          {editingMessage ? <Check size={20} /> : <Send size={18} />}
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
