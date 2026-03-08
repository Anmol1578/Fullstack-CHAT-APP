import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load users");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    const authUser = useAuthStore.getState().authUser;

    if (!selectedUser?._id) throw new Error("No user selected");

    // 🔥 optimistic message
    const tempMessage = {
      _id: Date.now(), // temp id
      senderId: authUser._id,
      receiverId: selectedUser._id,
      text: messageData.text,
      image: messageData.image,
      createdAt: new Date().toISOString(),
      pending: true,
      seen: false,
    };

    set({ messages: [...messages, tempMessage] });

    try {
      const res = await axiosInstance.post(
        `/messages/send/${selectedUser._id}`,
        messageData,
      );

      // replace temp message with real one
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === tempMessage._id ? res.data : msg,
        ),
      }));

      return res.data;
    } catch (error) {
      // rollback on failure
      set((state) => ({
        messages: state.messages.filter((msg) => msg._id !== tempMessage._id),
      }));
      throw error;
    }
  },

  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;
    const { selectedUser } = get();

    if (!socket || !selectedUser?._id) return;

    const authUserId = useAuthStore.getState().authUser?._id;

    // remove old listeners
    socket.off("newMessage");
    socket.off("messagesSeen");

    // NEW MESSAGE
    socket.on("newMessage", (newMessage) => {
      if (
        newMessage.senderId !== selectedUser._id &&
        newMessage.senderId !== authUserId
      ) {
        return;
      }

      set((state) => ({
        messages: [...state.messages, newMessage],
      }));
    });

    socket.on("messagesSeen", ({ senderId }) => {
      const { selectedUser } = get();

      if (!selectedUser) return;

      set((state) => ({
        messages: state.messages.map((msg) =>
          msg.senderId === authUserId && msg.receiverId === selectedUser._id
            ? { ...msg, seen: true }
            : msg,
        ),
      }));
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket?.off("newMessage");
    socket?.off("messagesSeen");
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));
