import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";

import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";

import { formatMessageTime } from "../lib/utils";

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
  const [openImage, setOpenImage] = useState(null);

  // Fetch messages + subscribe to realtime updates
  useEffect(() => {
    if (!selectedUser?._id) return;

    getMessages(selectedUser._id);
    subscribeToMessages();

    return () => unsubscribeFromMessages();
  }, [selectedUser, getMessages, subscribeToMessages, unsubscribeFromMessages]);

  // Auto scroll to latest message
  useEffect(() => {
    const timer = setTimeout(() => {
      messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);

    return () => clearTimeout(timer);
  }, [messages]);

  // Close image viewer with ESC
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") setOpenImage(null);
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  if (!selectedUser) {
    return (
      <div className="flex-1 flex items-center justify-center text-base-content/60">
        Select a conversation to start chatting
      </div>
    );
  }

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
    <div className="flex-1 flex flex-col overflow-hidden">
      <ChatHeader />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
        {messages.map((message, index) => {
          const isLastMessage = index === messages.length - 1;
          const isOwnMessage = message.senderId === authUser._id;

          return (
            <div
              key={message._id}
              className={`chat ${isOwnMessage ? "chat-end" : "chat-start"}`}
              ref={isLastMessage ? messageEndRef : null}
            >
              {/* Avatar */}
              <div className="chat-image avatar">
                <div className="size-10 rounded-full border">
                  <img
                    src={
                      isOwnMessage
                        ? authUser.profilePic || "/avatar.png"
                        : selectedUser?.profilePic || "/avatar.png"
                    }
                    alt="profile"
                  />
                </div>
              </div>

              {/* Time */}
              <div className="chat-header mb-1">
                <time className="text-xs opacity-50 ml-1">
                  {formatMessageTime(message.createdAt)}
                </time>
              </div>

              {/* Message Bubble */}
              <div
                className={`chat-bubble flex flex-col max-w-[80%] transition-all duration-200
                ${
                  isOwnMessage
                    ? "bg-primary text-primary-content"
                    : "bg-base-200"
                }`}
              >
                {/* Image */}
                {message.image && (
                  <img
                    src={message.image}
                    loading="lazy"
                    alt="Attachment"
                    onClick={() => setOpenImage(message.image)}
                    className="max-w-[220px] sm:max-w-[250px] rounded-xl mb-2 cursor-pointer hover:scale-105 transition-transform duration-200"
                  />
                )}

                {/* Text */}
                {message.text && <p>{message.text}</p>}
              </div>
            </div>
          );
        })}
      </div>

      <MessageInput />

      {/* Full Screen Image Viewer */}
      {openImage &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-sm flex items-center justify-center"
            onClick={() => setOpenImage(null)}
          >
            <img
              src={openImage}
              alt="Full View"
              className="max-w-[95%] max-h-[95%] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />

            <button
              onClick={() => setOpenImage(null)}
              className="absolute top-5 right-5 btn btn-circle btn-sm btn-ghost text-white"
            >
              <X size={24} />
            </button>
          </div>,
          document.body
        )}
    </div>
  );
};

export default ChatContainer;

