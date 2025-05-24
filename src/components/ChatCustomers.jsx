import { getDuration } from "../lib/utils";
import Conversation from "../assets/conversation.jpg";
import UserImageDefault from "../assets/user.png";

const EmptyChat = () => {
  console.log("Rendering EmptyChat component");
  return (
    <div className="flex flex-col items-center justify-center h-[80%] opacity-60">
      <img src={Conversation} alt="Empty conversation" className="h-32 w-32" />
      <span>No conversation has started yet.</span>
    </div>
  );
};

const ChatCustomers = ({ chats, selectAChat, selectedChat }) => {
  console.log("ChatCustomers component rendering with chats:", chats);
  
  const getLastMessageTime = (chat) => {
    if (!chat?.messages || chat.messages.length === 0) {
      return "N/A";
    }
    const lastMessageTime = chat?.messages[chat.messages.length - 1]?.time;
    return getDuration(lastMessageTime);
  };

  const getLastMessage = (chat) => {
    if (!chat?.messages || chat.messages.length === 0) {
      return "No messages";
    }
    const lastMessage = chat?.messages[chat.messages.length - 1]?.message;
    // Truncate long messages
    return lastMessage?.length > 30 ? lastMessage.substring(0, 30) + "..." : lastMessage;
  };

  // Check if chats is undefined, null, or empty array
  if (!chats || !Array.isArray(chats) || chats.length === 0) {
    console.log("No chats available, showing EmptyChat component");
    return <EmptyChat />;
  }
  
  return (
    <div className="flex flex-col items-start overflow-y-auto max-h-[calc(100vh-120px)]">
      {chats?.map((chat, i) => {
        const isSelected = selectedChat?.clientId === chat?.clientId;
        
        return (
          <div
            className={`flex flex-col p-4 w-full border-b cursor-pointer hover:bg-[#F6F6F6] transition-all duration-200 ${
              isSelected ? "bg-[#F0F0F0]" : ""
            }`}
            key={i}
            onClick={() => {
              selectAChat(chat);
            }}
          >
            <div className="flex w-full items-center gap-3">
              <div className="relative">
                <img 
                  src={chat?.client?.profile_pic || UserImageDefault} 
                  alt={chat?.client?.name || "User"} 
                  className="h-10 w-10 rounded-full"
                />
                <div className="absolute bottom-0 right-0 h-3 w-3 bg-gray-400 rounded-full border-2 border-white"></div>
              </div>
              <div className="flex flex-col items-start w-[70%]">
                <span className="max-w-[100%] overflow-hidden text-left font-medium">
                  {chat?.client?.name || "Unknown User"}
                </span>
                <span className="text-sm opacity-70">Facebook DM</span>
              </div>
              <span className="text-sm opacity-60 ml-auto">
                {getLastMessageTime(chat)}
              </span>
            </div>

            <div className="ml-12 text-left mt-1">
              <span className="text-sm opacity-60 text-left">
                {getLastMessage(chat)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ChatCustomers;
