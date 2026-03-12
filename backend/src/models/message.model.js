import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    text: {
      type: String,
      default: "",
      trim: true,
    },

    image: {
      type: String,
      default: "",
    },

    // reply system
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },

    replyPreview: {
      text: {
        type: String,
        default: "",
      },
      senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    },

    // message delivery status
    status: {
      type: String,
      enum: ["sent", "delivered", "seen"],
      default: "sent",
    },

    seen: {
      type: Boolean,
      default: false,
    },

    // message editing
    isEdited: {
      type: Boolean,
      default: false,
    },

    editedAt: {
      type: Date,
      default: null,
    },

    // delete for everyone
    isDeletedForEveryone: {
      type: Boolean,
      default: false,
    },

    // delete for me
    deletedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  },
);

// index for faster chat queries
messageSchema.index({ senderId: 1, receiverId: 1, createdAt: 1 });

const Message = mongoose.model("Message", messageSchema);

export default Message;
