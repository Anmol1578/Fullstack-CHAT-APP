import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, Check, CheckCheck } from "lucide-react";

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

  const { authUser, socket } = useAuthStore();

  const chatContainerRef = useRef(null);
  const isUserAtBottom = useRef(true);
  const [openImage, setOpenImage] = useState(null);

  useEffect(() => {
    if (!selectedUser?._id) return;

    getMessages(selectedUser._id);
    subscribeToMessages();

    return () => unsubscribeFromMessages();
  }, [selectedUser]);

  useEffect(() => {
    if (!selectedUser?._id || !socket) return;

    if (messages.length === 0) return;

    socket.emit("markMessagesSeen", {
      senderId: selectedUser._id,
    });
  }, [selectedUser, messages.length]);

  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const distanceFromBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight;

      isUserAtBottom.current = distanceFromBottom < 80;
    };

    container.addEventListener("scroll", handleScroll);

    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    requestAnimationFrame(() => {
      container.scrollTop = container.scrollHeight;
    });
  }, [selectedUser]);

  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    if (!isUserAtBottom.current) return;

    requestAnimationFrame(() => {
      container.scrollTop = container.scrollHeight;
    });
  }, [messages.length]);

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

      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 scroll-smooth"
      >
        {messages.map((message) => {
          const isOwnMessage = message.senderId === authUser._id;

          return (
            <div
              key={message._id}
              className={`flex ${
                isOwnMessage ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`px-3 py-2 max-w-[65%] w-fit break-words rounded-2xl ${
                  isOwnMessage
                    ? "bg-indigo-200 text-gray-900 dark:bg-indigo-600 dark:text-white rounded-br-md"
                    : "bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-100 rounded-bl-md"
                }`}
              >
                {message.image && (
                  <img
                    src={message.image}
                    alt="Attachment"
                    loading="lazy"
                    onClick={() => setOpenImage(message.image)}
                    className="max-w-[240px] rounded-xl mb-1 cursor-pointer"
                  />
                )}

                {message.text && (
                  <p className="text-sm leading-tight">{message.text}</p>
                )}

                <div className="flex justify-end items-center mt-[2px] gap-1">
                  <span className="text-[10px] opacity-70">
                    {formatMessageTime(message.createdAt)}
                  </span>

                  {isOwnMessage &&
                    (message.seen ? (
                      <CheckCheck size={13} className="text-blue-600" />
                    ) : (
                      <Check size={13} className="opacity-70" />
                    ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <MessageInput />

      {openImage &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center"
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
              className="absolute top-5 right-5 text-white"
            >
              <X size={26} />
            </button>
          </div>,
          document.body,
        )}
    </div>
  );
};

export default ChatContainer;
