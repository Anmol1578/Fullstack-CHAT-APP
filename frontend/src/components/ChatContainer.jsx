import React, { useEffect, useRef, useState } from "react";

import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";

import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";

import { formatMessageTime } from "../lib/utils";
import { X } from "lucide-react";
import { createPortal } from "react-dom";

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
  } = useChatStore();

  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);

  // 🔥 Image viewer state
  const [openImage, setOpenImage] = useState(null);

  // Fetch + subscribe
  useEffect(() => {
    if (!selectedUser?._id) return;

    getMessages(selectedUser._id);
    subscribeToMessages();

    return () => unsubscribeFromMessages();
  }, [selectedUser?._id]);

  // Auto scroll
  useEffect(() => {
    if (!messageEndRef.current) return;
    messageEndRef.current.scrollIntoView({ behavior: "auto" });
  }, [messages]);

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => {
          const isLastMessage = index === messages.length - 1;
          const isOwnMessage = message.senderId === authUser._id;

          return (
            <div
              key={message._id}
              className={`chat ${isOwnMessage ? "chat-end" : "chat-start"}`}
              ref={isLastMessage ? messageEndRef : null}
            >
              <div className="chat-image avatar">
                <div className="size-10 rounded-full border">
                  <img
                    src={
                      isOwnMessage
                        ? authUser.profilePic || "/avatar.png"
                        : selectedUser?.profilePic || "/avatar.png"
                    }
                    alt="profile pic"
                  />
                </div>
              </div>

              <div className="chat-header mb-1">
                <time className="text-xs opacity-50 ml-1">
                  {formatMessageTime(message.createdAt)}
                </time>
              </div>

              <div className="chat-bubble flex flex-col">
                {/* IMAGE MESSAGE */}
                {message.image && (
                  <img
                    src={message.image}
                    alt="Attachment"
                    onClick={() => setOpenImage(message.image)}
                    className="sm:max-w-[200px] rounded-md mb-2 cursor-pointer"
                  />
                )}

                {/* TEXT MESSAGE */}
                {message.text && <p>{message.text}</p>}
              </div>
            </div>
          );
        })}
      </div>

      <MessageInput />

      {/* 🔥 FULL SCREEN IMAGE VIEWER */}
      {openImage &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center"
            onClick={() => setOpenImage(null)}
          >
            <img
              src={openImage}
              alt="Full View"
              className="max-w-[95%] max-h-[95%] object-contain"
              onClick={(e) => e.stopPropagation()}
            />

            <button
              onClick={() => setOpenImage(null)}
              className="absolute top-4 right-4 text-white"
            >
              <X size={32} />
            </button>
          </div>,
          document.body,
        )}
    </div>
  );
};

export default ChatContainer;
