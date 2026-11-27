import { createFileRoute } from "@tanstack/react-router";
import { ChatView } from "../../features/chats/chat-view";
import { messagesQuery } from "../../features/chats/queries";

export const Route = createFileRoute("/_app/c/$chatId")({
  // Not awaited: the view renders at once (skeleton if uncached); hover-preload warms it.
  loader: ({ context, params }) => {
    void context.queryClient.prefetchInfiniteQuery(messagesQuery(params.chatId));
  },
  component: function ChatRoute() {
    const { chatId } = Route.useParams();
    return <ChatView key={chatId} chatId={chatId} />;
  },
});
