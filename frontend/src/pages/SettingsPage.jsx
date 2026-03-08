import { useNavigate } from "react-router-dom";
import { X, Send } from "lucide-react";

import { THEMES } from "../constants";
import { useThemeStore } from "../store/useThemeStore";

const PREVIEW_MESSAGES = [
  { id: 1, content: "Hey! How's it going?", isSent: false },
  {
    id: 2,
    content: "I'm doing great! Just working on some new features.",
    isSent: true,
  },
];

const SettingsPage = () => {
  const { theme, setTheme } = useThemeStore();
  const navigate = useNavigate();

  return (
    <>
      {/* Close Button */}
      <button
        onClick={() => navigate("/")}
        className="fixed top-16 right-4 sm:top-6 sm:right-6 z-50 text-base-content hover:text-error transition"
      >
        <X size={24} />
      </button>

      <div className="min-h-screen w-full px-3 sm:px-6 pt-16 sm:pt-20 mx-auto max-w-5xl">
        <div className="space-y-6">
          {/* Title */}
          <div className="flex flex-col gap-1">
            <h2 className="text-lg sm:text-xl font-semibold">Theme</h2>
            <p className="text-xs sm:text-sm text-base-content/70">
              Choose a theme for your chat interface
            </p>
          </div>

          {/* Theme Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-8 gap-2">
            {THEMES.map((t) => (
              <button
                key={t}
                className={`group flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                  theme === t ? "bg-base-200" : "hover:bg-base-200/50"
                }`}
                onClick={() => setTheme(t)}
              >
                <div
                  className="relative h-7 sm:h-8 w-full rounded-md overflow-hidden"
                  data-theme={t}
                >
                  <div className="absolute inset-0 grid grid-cols-4 gap-px p-1">
                    <div className="rounded bg-primary"></div>
                    <div className="rounded bg-secondary"></div>
                    <div className="rounded bg-accent"></div>
                    <div className="rounded bg-neutral"></div>
                  </div>
                </div>

                <span className="text-[10px] sm:text-[11px] font-medium truncate w-full text-center">
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </span>
              </button>
            ))}
          </div>

          {/* Preview */}
          <h3 className="text-base sm:text-lg font-semibold">Preview</h3>

          <div className="rounded-xl border border-base-300 overflow-hidden bg-base-100 shadow-lg">
            <div className="p-3 sm:p-4 bg-base-200">
              <div className="max-w-md mx-auto">
                <div className="bg-base-100 rounded-xl shadow-sm overflow-hidden">
                  {/* Chat Header */}
                  <div className="px-3 sm:px-4 py-3 border-b border-base-300">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-content text-sm font-medium">
                        J
                      </div>

                      <div>
                        <h3 className="font-medium text-sm">Its Anmol</h3>
                        <p className="text-xs text-base-content/70">Online</p>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="p-3 sm:p-4 space-y-3 min-h-[160px] max-h-[180px] overflow-y-auto">
                    {PREVIEW_MESSAGES.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.isSent ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[80%] rounded-xl p-2.5 sm:p-3 text-sm shadow-sm ${
                            message.isSent
                              ? "bg-primary text-primary-content"
                              : "bg-base-200"
                          }`}
                        >
                          <p>{message.content}</p>

                          <p
                            className={`text-[10px] mt-1 ${
                              message.isSent
                                ? "text-primary-content/70"
                                : "text-base-content/70"
                            }`}
                          >
                            12:00 PM
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Input */}
                  <div className="p-3 sm:p-4 border-t border-base-300">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="input input-bordered flex-1 text-sm h-9 sm:h-10"
                        placeholder="Type a message..."
                        value="This is a preview"
                        readOnly
                      />

                      <button className="btn btn-primary h-9 sm:h-10 min-h-0">
                        <Send size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SettingsPage;
