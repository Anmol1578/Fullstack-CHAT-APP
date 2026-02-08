import { useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { Image, Send, X } from "lucide-react";
import toast from "react-hot-toast";
import { createPortal } from "react-dom";

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [isImageOpen, setIsImageOpen] = useState(false);

  const fileInputRef = useRef(null);
  const { sendMessage } = useChatStore();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    setIsImageOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview) return;

    const messageText = text.trim();
    const messageImage = imagePreview;

    setText("");
    setImagePreview(null);
    setIsImageOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = "";

    try {
      await sendMessage({
        text: messageText,
        image: messageImage,
      });
    } catch (error) {
      toast.error("Failed to send message", error);
    }
  };

  return (
    <div className="p-4 w-full">
      {/* IMAGE PREVIEW */}
      {imagePreview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              onClick={() => setIsImageOpen(true)}
              className="w-20 h-20 object-cover rounded-lg border border-zinc-700 cursor-pointer"
            />

            <button
              type="button"
              onClick={removeImage}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300 flex items-center justify-center"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      {/* FULL SCREEN IMAGE MODAL (PORTAL) */}
      {isImageOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center"
            onClick={() => setIsImageOpen(false)}
          >
            <img
              src={imagePreview}
              alt="Full Preview"
              className="max-w-[95%] max-h-[95%] object-contain"
              onClick={(e) => e.stopPropagation()}
            />

            <button
              onClick={() => setIsImageOpen(false)}
              className="absolute top-4 right-4 text-white"
            >
              <X size={32} />
            </button>
          </div>,
          document.body,
        )}

      {/* MESSAGE INPUT */}
      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            className="w-full input input-bordered rounded-lg input-sm sm:input-md"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageChange}
          />

          <button
            type="button"
            className={`hidden sm:flex btn btn-circle ${
              imagePreview ? "text-emerald-500" : "text-zinc-400"
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <Image size={20} />
          </button>
        </div>

        <button
          type="submit"
          className="btn btn-sm btn-circle"
          disabled={!text.trim() && !imagePreview}
        >
          <Send size={22} />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
