import { useEffect, useRef, useState } from "react";
import Card from "./CommonComponents/Card";
import ProfileImage from "../assets/user.png";
import { getDate, getDuration, getTime, showError } from "../lib/utils";
import { Menu, RotateCw, SendHorizontal, ChevronDown } from "lucide-react";
import Button from "./CommonComponents/Button";
import { Api } from "../Api/Axios";

const SelfMessage = ({ chat }) => {
  return (
    <div className="text-black text-left ml-auto p-2 flex flex-col items-end w-full">
    
      <div className="flex gap-4 justify-end">
        <div className="flex flex-col gap-4  items-end max-w-[100%]">
          {chat?.messages?.map((mess, j) => (
            <Card key={j} className="py-2 px-4 shadow-sm">
              {mess}
            </Card>
          ))}
        </div>
        <div className="mt-auto">
          <img alt="user" src={ProfileImage} className="h-10 w-10" />
        </div>
      </div>
      <div className="flex gap-2 justify-end mr-14 mt-2 ">
        <span className="font-medium">{chat?.senderName} •</span>
        <span>
          {getDate(chat?.time)}, {getTime(chat?.time)}
        </span>
      </div>
    </div>
  );
};

const OthersMessage = ({ chat }) => {
  return (
    <div className="text-black text-left p-2 flex flex-col items-start w-full">
      {/* Chats will go here */}

      <div className="flex gap-4 w-full justify-start">
        <div className="mt-auto">
          <img 
            alt="user" 
            src={chat?.profilePic || ProfileImage} 
            className="h-10 w-10 rounded-full" 
          />
        </div>
        <div className="flex flex-col gap-4 items-start  max-w-[60%]">
          {chat?.messages?.map((mess, j) => (
            <Card key={j} className="py-2 px-4 shadow-sm ">
              {mess}
            </Card>
          ))}
        </div>
      </div>

      <div className="flex gap-2 justify-end ml-16 mt-2">
        <span className="font-medium">{chat?.senderName} •</span>
        <span className="opacity-60">
          {getDate(chat?.time)}, {getTime(chat?.time)}
        </span>
      </div>
    </div>
  );
};

const ChatDock = ({ chat, updateChat }) => {
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [showDonwBtn, setShowDonwBtn] = useState(false);
  const [messages, setMessages] = useState([]);

  const chatBoxRef = useRef();

  const changeNewMessage = (e) => {
    setNewMessage(e.target.value);
  };

  const sendNewMessage = async () => {
    if (newMessage.trim() === "") {
      return;
    }
    const pageDetails = localStorage.getItem("FB_PAGE_DETAILS");
    const pageDetailsParsed = JSON.parse(pageDetails ? pageDetails : "{}");

    try {
      if (!pageDetailsParsed.id) {
        throw new Error(
          "Could not find page details ... please reconnect the facebook page"
        );
      }
      setLoading(true);

      const pageAccessToken = pageDetailsParsed?.pageAccessToken;
      const pageId = pageDetailsParsed?.id;
      const dataToSend = {
        pageId: pageId,
        clientId: chat?.clientId,
        message: newMessage,
        accessToken: pageAccessToken,
      };

      const res = await Api.post("/messages/send", dataToSend);

      updateChat(chat?.clientId, pageId, newMessage);

      setNewMessage("");
    } catch (error) {
      setLoading(false);
      showError(error?.response?.data?.message || "Failed to send message");
    }
    goToBottomOfTheChat();
    setLoading(false);
  };

  const goToBottomOfTheChat = () => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current?.scrollHeight;
      setShowDonwBtn(false);
    }
  };

  const getGroupedMessages = () => {
    try {
    const pageDetails = localStorage.getItem("FB_PAGE_DETAILS");
    const pageDetailsParsed = JSON.parse(pageDetails ? pageDetails : "{}");
      
    if (!pageDetailsParsed.id) {
      throw new Error("Please connect to a facebook page");
    }

      if (!chat?.messages || chat.messages.length === 0) {
        setMessages([]);
        return;
      }

    const __messages = [];
      const clientName = chat?.client?.name || "User";
      const pageName = pageDetailsParsed.name || "Page";
      const pageId = pageDetailsParsed.id;

    let currMessageGroup = {
        senderName: chat?.messages[0]?.senderId === pageId ? pageName : clientName,
      senderId: chat?.messages[0]?.senderId,
      time: chat?.messages[0]?.time,
      messages: [chat?.messages[0]?.message],
        profilePic: chat?.client?.profile_pic
    };

    chat?.messages?.forEach((item, i) => {
      if (i > 0) {
        if (item.senderId === currMessageGroup.senderId) {
          currMessageGroup.messages.push(item.message);
          currMessageGroup.time = item.time;
        } else {
          __messages.push(currMessageGroup);
          currMessageGroup = {
            senderName: item.senderId === pageId ? pageName : clientName,
            senderId: item.senderId,
            time: item.time,
            messages: [item.message],
              profilePic: chat?.client?.profile_pic
          };
        }
      }
    });
      
    __messages.push(currMessageGroup);
    setMessages(__messages);
    } catch (error) {
      console.error("Error grouping messages:", error);
      setMessages([]);
    }
  };

  useEffect(() => {
    if (chat) {
    goToBottomOfTheChat();
    getGroupedMessages();
    }
  }, [chat]);

  if (!chat) {
    return <div className="flex-1 flex items-center justify-center">Select a conversation</div>;
  }

  return (
    <div className="flex flex-col w-[60%] relative bg-[#F6F6F6]">
      {/* Name of the customer goes here */}
      <div className="flex w-full p-3 border-b border-black">
        <h1 className="text-xl font-semibold opacity-65 ">
          {chat?.client?.name || "User"}
        </h1>
      </div>

      {/* Chat goes here */}
      <div
        ref={chatBoxRef}
        className="flex flex-col items-start gap-2 pb-20 relative p-3 overflow-scroll h-[80%]"
      >
        {messages?.map((data, i) => {
          const pageDetails = localStorage.getItem("FB_PAGE_DETAILS");
          const pageDetailsParsed = JSON.parse(pageDetails ? pageDetails : "{}");
          const pageId = pageDetailsParsed.id;
          
          if (data?.senderId === pageId) {
            return <SelfMessage key={i} chat={data} />;
          } else {
            return <OthersMessage key={i} chat={data} />;
          }
        })}
      </div>

      {/* Send message */}
      <form
        className="w-[97%] absolute left-[50%] bottom-5 translate-x-[-50%]"
        onSubmit={(e) => {
          e.preventDefault();
          sendNewMessage();
        }}
      >
        <input
          className="w-full border border-primary rounded-md p-2 "
          placeholder={`Message ${chat?.client?.name || 'User'}`}
          value={newMessage}
          onChange={(e) => {
            changeNewMessage(e);
          }}
        />
        <Button
          className="absolute right-0 top-0"
          type="submit"
          loading={loading}
          disabled={loading}
        >
          <SendHorizontal />
        </Button>
      </form>
    </div>
  );
};

export default ChatDock;
