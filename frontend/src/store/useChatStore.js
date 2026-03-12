import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

// simple memory cache
const messageCache = {};

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  editingMessage: null,

  /* GET USERS */

  getUsers: async () => {
    set({ isUsersLoading: true });

    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error("Failed to load users");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  /* GET MESSAGES (CACHE OPTIMIZED)*/

  getMessages: async (userId) => {
    if (messageCache[userId]) {
      set({ messages: messageCache[userId] });
    }

    set({ isMessagesLoading: true });

    try {
      const res = await axiosInstance.get(`/messages/${userId}`);

      messageCache[userId] = res.data;

      set({ messages: res.data });
    } catch (error) {
      toast.error("Failed to load messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  /* SEND MESSAGE */

  sendMessage: async (messageData) => {
    const { selectedUser } = get();

    try {
      const res = await axiosInstance.post(
        `/messages/send/${selectedUser._id}`,
        messageData,
      );

      set((state) => ({
        messages: [...state.messages, res.data],
      }));

      if (messageCache[selectedUser._id]) {
        messageCache[selectedUser._id].push(res.data);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send message");
      throw error;
    }
  },

  /* DELETE CONVERSATION */

  deleteConversation: async (deleteForBoth = false) => {
    const { selectedUser } = get();

    try {
      await axiosInstance.delete(`/messages/conversation/${selectedUser._id}`, {
        data: { deleteForBoth },
      });

      // instant UI update
      set({ messages: [] });

      // clear cache
      delete messageCache[selectedUser._id];

      toast.success("Chat history cleared");
    } catch (error) {
      toast.error("Failed to delete conversation");
    }
  },

  setEditingMessage: (message) => set({ editingMessage: message }),

  /* SOCKET SUBSCRIPTIONS */

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;
    const authUser = useAuthStore.getState().authUser;

    if (!socket) return;

    get().unsubscribeFromMessages();

    /* NEW MESSAGE */

    socket.on("newMessage", (newMessage) => {
      const isRelevant =
        newMessage.senderId.toString() === selectedUser._id.toString() ||
        newMessage.receiverId.toString() === selectedUser._id.toString();

      if (!isRelevant) return;

      const { messages } = get();

      if (messages.find((m) => m._id === newMessage._id)) return;

      set((state) => ({
        messages: [...state.messages, newMessage],
      }));

      if (messageCache[selectedUser._id]) {
        messageCache[selectedUser._id].push(newMessage);
      } else {
        messageCache[selectedUser._id] = [newMessage];
      }
    });

    /* EDIT MESSAGE */

    socket.on("messageUpdated", (updatedMsg) => {
      set((state) => ({
        messages: state.messages.map((m) =>
          m._id === updatedMsg._id ? updatedMsg : m,
        ),
      }));
    });

    /* DELETE FOR EVERYONE */

    socket.on("messageDeletedGlobally", (messageId) => {
      set((state) => ({
        messages: state.messages.map((m) =>
          m._id === messageId
            ? {
                ...m,
                text: "",
                image: "",
                isDeletedForEveryone: true,
              }
            : m,
        ),
      }));
    });

    /* DELETE FOR ME */

    socket.on("messageHiddenLocally", (messageId) => {
      set((state) => ({
        messages: state.messages.filter((m) => m._id !== messageId),
      }));
    });

    /* SEEN STATUS */

    socket.on("messagesSeen", ({ senderId }) => {
      if (senderId.toString() !== selectedUser._id.toString()) return;

      set((state) => ({
        messages: state.messages.map((m) =>
          m.senderId.toString() === authUser._id.toString()
            ? { ...m, seen: true, status: "seen" }
            : m,
        ),
      }));
    });

    socket.on("conversationDeleted", ({ senderId, receiverId }) => {
      const { selectedUser } = get();
      const authUser = useAuthStore.getState().authUser;

      if (!selectedUser) return;

      const isConversation =
        (senderId === authUser._id && receiverId === selectedUser._id) ||
        (senderId === selectedUser._id && receiverId === authUser._id);

      if (!isConversation) return;

      set({ messages: [] });

      delete messageCache[selectedUser._id];
    });
  },

  /* UNSUBSCRIBE*/

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.off("newMessage");
    socket.off("messageUpdated");
    socket.off("messageDeletedGlobally");
    socket.off("messageHiddenLocally");
    socket.off("messagesSeen");
    socket.off("conversationDeleted");
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));
