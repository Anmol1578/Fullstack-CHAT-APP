

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, CheckCheck, Trash2, Edit3, Reply, ArrowRight } from "lucide-react";

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
    setEditingMessage,
  } = useChatStore();

  const { authUser, socket } = useAuthStore();

  const chatContainerRef = useRef(null);
  const prevMessageCount = useRef(0);
  const userNearBottom = useRef(true);

  const pressTimer = useRef(null);
  const touchStartX = useRef(0);
  const [swipeMessageId, setSwipeMessageId] = useState(null);

  const [openImage, setOpenImage] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [deleteForEveryone, setDeleteForEveryone] = useState(false);
  const [replyingMessage, setReplyingMessage] = useState(null);

  // Fetch messages & subscribe
  useEffect(() => {
    if (!selectedUser?._id) return;
    getMessages(selectedUser._id);
    subscribeToMessages();
    return () => unsubscribeFromMessages();
  }, [selectedUser]);

  // Mark messages seen
  useEffect(() => {
    if (socket && selectedUser?._id && messages.length > 0) {
      socket.emit("markMessagesSeen", { senderId: selectedUser._id });
    }
  }, [messages]);

  // Scroll detection
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const distance =
        container.scrollHeight - container.scrollTop - container.clientHeight;
      userNearBottom.current = distance < 120;
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  // Auto scroll
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;
    const newMessageArrived = messages.length > prevMessageCount.current;
    if (newMessageArrived && userNearBottom.current) {
      container.scrollTop = container.scrollHeight;
    }
    prevMessageCount.current = messages.length;
  }, [messages]);

  // Close menu on scroll
  useEffect(() => {
    const closeMenu = () => setContextMenu(null);
    window.addEventListener("scroll", closeMenu);
    return () => window.removeEventListener("scroll", closeMenu);
  }, []);

  // Context menu for desktop
  const handleContextMenu = (e, message) => {
    e.preventDefault();
    e.stopPropagation();

    const menuHeight = 160;
    const yPos =
      e.clientY + menuHeight > window.innerHeight
        ? e.clientY - menuHeight
        : e.clientY;

    setContextMenu({
      x: e.clientX,
      y: yPos,
      message,
    });
  };

  // MOBILE LONG PRESS
  const handleTouchStart = (e, message) => {
    e.preventDefault();
    e.stopPropagation();

    const touch = e.touches[0];
    touchStartX.current = touch.clientX;

    pressTimer.current = setTimeout(() => {
      const menuWidth = 176;
      const menuHeight = 160;

      const x = Math.min(touch.clientX, window.innerWidth - menuWidth);
      const y = Math.min(touch.clientY, window.innerHeight - menuHeight);

      setContextMenu({ x, y, message });
    }, 500);
  };

  const handleTouchMove = (e, message) => {
    clearTimeout(pressTimer.current);

    const touch = e.touches[0];
    const diffX = touch.clientX - touchStartX.current;

    // Swipe right for reply
    if (diffX > 60 && String(message.senderId) !== String(authUser._id)) {
      setSwipeMessageId(message._id);
    }
  };

  const handleTouchEnd = (e) => {
    clearTimeout(pressTimer.current);
    setSwipeMessageId(null);
  };

  const handleReply = (message) => {
    setReplyingMessage(message);
    setContextMenu(null);
    setSwipeMessageId(null);
  };

  const confirmDelete = () => {
    if (!deleteModal || !socket) return;

    if (deleteForEveryone) {
      socket.emit("deleteForEveryone", {
        messageId: deleteModal._id,
        receiverId: selectedUser._id,
      });
    } else {
      socket.emit("deleteForMe", { messageId: deleteModal._id });
    }

    setDeleteModal(null);
    setDeleteForEveryone(false);
  };

  const handleEditInitiate = (message) => {
    setEditingMessage(message);
    setContextMenu(null);
  };

  if (!selectedUser)
    return (
      <div className="flex-1 flex items-center justify-center opacity-60">
        Select a conversation
      </div>
    );

  if (isMessagesLoading)
    return (
      <div className="flex-1 flex flex-col">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput
          replyingMessage={replyingMessage}
          setReplyingMessage={setReplyingMessage}
        />
      </div>
    );

  return (
    <div
      className="flex-1 flex flex-col relative"
      onClick={() => setContextMenu(null)}
    >
      <ChatHeader />

      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3"
      >
        {messages.slice(-60).map((message) => {
          const isOwnMessage =
            String(message.senderId) === String(authUser._id);
          const isSwiping = swipeMessageId === message._id;

          return (
            <div
              key={message._id}
              onContextMenu={(e) => handleContextMenu(e, message)}
              onTouchStart={(e) => handleTouchStart(e, message)}
              onTouchMove={(e) => handleTouchMove(e, message)}
              onTouchEnd={handleTouchEnd}
              className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
            >
              <div className="max-w-[75%] sm:max-w-[65%] w-fit group relative">
                {/* Swipe Indicator */}
                {isSwiping && !isOwnMessage && (
                  <div className="absolute left-[-30px] top-1/2 transform -translate-y-1/2 text-blue-400">
                    <ArrowRight size={24} />
                  </div>
                )}

                <div
                  className={`px-3 py-2 mt-1 break-words rounded-2xl shadow-sm select-none user-message other-message ${
                    isOwnMessage
                      ? "bg-primary text-primary-content rounded-br-none"
                      : "bg-base-200 text-base-content rounded-bl-none"
                  } ${message.isDeletedForEveryone ? "italic opacity-60" : ""}`}
                  style={{ WebkitTouchCallout: "none" }}
                >
                  {message.image && !message.isDeletedForEveryone && (
                    <img
                      src={message.image}
                      alt="Attachment"
                      onClick={() => setOpenImage(message.image)}
                      className="max-w-full max-h-[300px] object-cover rounded-lg mb-1 cursor-pointer"
                    />
                  )}

                  {message.isDeletedForEveryone ? (
                    <p className="text-sm italic">This message was deleted</p>
                  ) : (
                    <>
                      {message.replyPreview && (
                        <div className="border-l-4 border-blue-400 pl-2 mb-1 text-xs opacity-80">
                          <p className="font-semibold text-blue-400">Reply</p>
                          <p className="truncate message-text">
                            {message.replyPreview.text}
                          </p>
                        </div>
                      )}

                      <p className="text-sm leading-tight message-text">{message.text}</p>
                    </>
                  )}

                  <div className="flex justify-end items-center mt-1 gap-1">
                    {message.isEdited && !message.isDeletedForEveryone && (
                      <span className="text-[9px] opacity-60 mr-1">(edited)</span>
                    )}

                    <span className="text-[10px] opacity-70">
                      {formatMessageTime(message.createdAt)}
                    </span>

                    {isOwnMessage && (
                      <>
                        {message.status === "sent" && <Check size={13} className="opacity-70" />}
                        {message.status === "delivered" && <CheckCheck size={13} className="opacity-70" />}
                        {message.status === "seen" && <CheckCheck size={13} className="text-blue-400" />}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <MessageInput
        replyingMessage={replyingMessage}
        setReplyingMessage={setReplyingMessage}
      />

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-[1000] bg-white dark:bg-gray-800 shadow-2xl rounded-xl py-2 w-44 border"
          style={{
            top: contextMenu.y,
            left: contextMenu.x,
            transform: "translateY(-10px)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => handleReply(contextMenu.message)}
            className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Reply size={16} /> Reply
          </button>

          {String(contextMenu.message.senderId) === String(authUser._id) &&
            !contextMenu.message.isDeletedForEveryone && (
              <button
                className="flex items-center gap-3 w-full px-4 py-2 text-sm text-blue-500"
                onClick={() => handleEditInitiate(contextMenu.message)}
              >
                <Edit3 size={16} /> Edit
              </button>
            )}

          <button
            className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-500"
            onClick={() => {
              setDeleteModal(contextMenu.message);
              setContextMenu(null);
            }}
          >
            <Trash2 size={16} /> Delete
          </button>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal &&
        createPortal(
          <div className="fixed inset-0 z-[1001] bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 rounded-2xl p-6 max-w-sm w-full shadow-xl border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold mb-2 dark:text-white">Delete message</h3>

              <p className="text-sm opacity-70 mb-4">
                This message will be deleted permanently.
              </p>

              {String(deleteModal.senderId) === String(authUser._id) &&
                !deleteModal.isDeletedForEveryone && (
                  <label className="flex items-center gap-2 text-sm mb-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={deleteForEveryone}
                      onChange={(e) => setDeleteForEveryone(e.target.checked)}
                    />
                    Delete for everyone
                  </label>
                )}

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setDeleteModal(null)}
                  className="px-3 py-1 text-sm rounded bg-gray-200 dark:bg-gray-700"
                >
                  Cancel
                </button>

                <button
                  onClick={confirmDelete}
                  className="px-3 py-1 text-sm rounded bg-red-500 text-white"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Image Viewer */}
      {openImage &&
        createPortal(
          <div
            className="fixed inset-0 bg-black/90 flex items-center justify-center"
            onClick={() => setOpenImage(null)}
          >
            <img
              src={openImage}
              className="max-w-[95%] max-h-[95%] object-contain"
            />
          </div>,
          document.body
        )}
    </div>
  );
};

export default ChatContainer;
